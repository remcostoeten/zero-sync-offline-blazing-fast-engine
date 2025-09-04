'use client';

import { getLocalClient } from './local-client';
import { syncQueue } from './local-crud-factory';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';

export type TBulkOperationType = 'insert' | 'update' | 'delete';

export type TBulkOperation<T = any> = {
  type: TBulkOperationType;
  table: string;
  data: T[];
  batchSize?: number;
  onProgress?: (completed: number, total: number) => void;
  skipValidation?: boolean;
};

export type TBulkResult = {
  success: number;
  failed: number;
  errors: Array<{ index: number; error: string; data: any }>;
  duration: number;
};

class BulkOperationManager {
  private readonly DEFAULT_BATCH_SIZE = 100;
  private readonly MAX_BATCH_SIZE = 1000;

  async executeBulkOperation<T extends Record<string, any>>(
    operation: TBulkOperation<T>
  ): Promise<TBulkResult> {
    const startTime = Date.now();
    const batchSize = Math.min(
      operation.batchSize || this.DEFAULT_BATCH_SIZE,
      this.MAX_BATCH_SIZE
    );

    console.log(`🔄 Starting bulk ${operation.type} for ${operation.data.length} records`);

    const result: TBulkResult = {
      success: 0,
      failed: 0,
      errors: [],
      duration: 0
    };

    const client = getLocalClient().getClient();
    const totalBatches = Math.ceil(operation.data.length / batchSize);

    try {
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIdx = batchIndex * batchSize;
        const endIdx = Math.min(startIdx + batchSize, operation.data.length);
        const batch = operation.data.slice(startIdx, endIdx);

        try {
          await client.execute('BEGIN TRANSACTION;');

          const batchResult = await this.processBatch(
            operation.type,
            operation.table,
            batch,
            startIdx
          );

          await client.execute('COMMIT;');

          result.success += batchResult.success;
          result.failed += batchResult.failed;
          result.errors.push(...batchResult.errors);

          // Report progress
          const completed = Math.min(endIdx, operation.data.length);
          operation.onProgress?.(completed, operation.data.length);

          console.log(`✅ Batch ${batchIndex + 1}/${totalBatches} completed: ${batchResult.success} success, ${batchResult.failed} failed`);

        } catch (batchError) {
          await client.execute('ROLLBACK;');
          
          // Mark entire batch as failed
          for (let i = 0; i < batch.length; i++) {
            result.errors.push({
              index: startIdx + i,
              error: batchError instanceof Error ? batchError.message : 'Unknown batch error',
              data: batch[i]
            });
          }
          result.failed += batch.length;
          
          console.error(`❌ Batch ${batchIndex + 1} failed:`, batchError);
        }

        // Small delay between batches to avoid overwhelming the system
        if (batchIndex < totalBatches - 1) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

    } catch (error) {
      console.error('❌ Bulk operation failed:', error);
      throw error;
    }

    result.duration = Date.now() - startTime;
    
    console.log(`✅ Bulk ${operation.type} completed: ${result.success} success, ${result.failed} failed in ${result.duration}ms`);
    
    return result;
  }

  private async processBatch(
    type: TBulkOperationType,
    tableName: string,
    batch: any[],
    startIndex: number
  ): Promise<TBulkResult> {
    const result: TBulkResult = { success: 0, failed: 0, errors: [], duration: 0 };
    const client = getLocalClient().getClient();

    switch (type) {
      case 'insert':
        return await this.processBulkInsert(tableName, batch, startIndex);
      
      case 'update':
        return await this.processBulkUpdate(tableName, batch, startIndex);
      
      case 'delete':
        return await this.processBulkDelete(tableName, batch, startIndex);
      
      default:
        throw new Error(`Unsupported bulk operation type: ${type}`);
    }
  }

  private async processBulkInsert(
    tableName: string,
    batch: any[],
    startIndex: number
  ): Promise<TBulkResult> {
    const result: TBulkResult = { success: 0, failed: 0, errors: [], duration: 0 };
    const client = getLocalClient().getClient();

    if (batch.length === 0) return result;

    try {
      // Get column names from first record
      const columns = Object.keys(batch[0]).filter(key => key !== 'id');
      const placeholders = columns.map(() => '?').join(', ');
      
      const insertSQL = `
        INSERT INTO ${tableName} (${columns.join(', ')}, synced)
        VALUES (${placeholders}, 0)
      `;

      for (let i = 0; i < batch.length; i++) {
        const record = batch[i];
        
        try {
          const values = columns.map(col => record[col]);
          await client.execute(insertSQL, values);
          
          result.success++;

          // Add to sync queue for later synchronization
          syncQueue.addOperation({
            type: 'create',
            table: tableName,
            data: record
          });

        } catch (error) {
          result.failed++;
          result.errors.push({
            index: startIndex + i,
            error: error instanceof Error ? error.message : 'Unknown insert error',
            data: record
          });
        }
      }

    } catch (error) {
      // If SQL preparation fails, mark all as failed
      for (let i = 0; i < batch.length; i++) {
        result.errors.push({
          index: startIndex + i,
          error: error instanceof Error ? error.message : 'SQL preparation failed',
          data: batch[i]
        });
      }
      result.failed = batch.length;
    }

    return result;
  }

  private async processBulkUpdate(
    tableName: string,
    batch: any[],
    startIndex: number
  ): Promise<TBulkResult> {
    const result: TBulkResult = { success: 0, failed: 0, errors: [], duration: 0 };
    const client = getLocalClient().getClient();

    for (let i = 0; i < batch.length; i++) {
      const record = batch[i];
      
      if (!record.id) {
        result.failed++;
        result.errors.push({
          index: startIndex + i,
          error: 'Missing ID for update operation',
          data: record
        });
        continue;
      }

      try {
        const { id, ...updateData } = record;
        const columns = Object.keys(updateData);
        const setClause = columns.map(col => `${col} = ?`).join(', ');
        
        const updateSQL = `
          UPDATE ${tableName} 
          SET ${setClause}, synced = 0, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `;

        const values = [...columns.map(col => updateData[col]), id];
        await client.execute(updateSQL, values);
        
        result.success++;

        // Add to sync queue
        syncQueue.addOperation({
          type: 'update',
          table: tableName,
          data: record
        });

      } catch (error) {
        result.failed++;
        result.errors.push({
          index: startIndex + i,
          error: error instanceof Error ? error.message : 'Unknown update error',
          data: record
        });
      }
    }

    return result;
  }

  private async processBulkDelete(
    tableName: string,
    batch: any[],
    startIndex: number
  ): Promise<TBulkResult> {
    const result: TBulkResult = { success: 0, failed: 0, errors: [], duration: 0 };
    const client = getLocalClient().getClient();

    // Extract IDs for bulk delete
    const ids = batch.map(record => {
      if (typeof record === 'number') return record;
      if (typeof record === 'object' && record.id) return record.id;
      return null;
    }).filter(id => id !== null);

    if (ids.length === 0) {
      result.failed = batch.length;
      batch.forEach((record, i) => {
        result.errors.push({
          index: startIndex + i,
          error: 'Invalid ID for delete operation',
          data: record
        });
      });
      return result;
    }

    try {
      // Use IN clause for efficient bulk delete
      const placeholders = ids.map(() => '?').join(', ');
      const deleteSQL = `DELETE FROM ${tableName} WHERE id IN (${placeholders})`;
      
      await client.execute(deleteSQL, ids);
      
      result.success = ids.length;

      // Add to sync queue
      ids.forEach(id => {
        syncQueue.addOperation({
          type: 'delete',
          table: tableName,
          data: { id }
        });
      });

    } catch (error) {
      result.failed = batch.length;
      batch.forEach((record, i) => {
        result.errors.push({
          index: startIndex + i,
          error: error instanceof Error ? error.message : 'Bulk delete failed',
          data: record
        });
      });
    }

    return result;
  }

  // Optimized bulk upsert (insert or update)
  async bulkUpsert<T extends Record<string, any>>(
    tableName: string,
    data: T[],
    options: {
      batchSize?: number;
      onProgress?: (completed: number, total: number) => void;
      conflictColumns?: string[];
    } = {}
  ): Promise<TBulkResult> {
    const { batchSize = this.DEFAULT_BATCH_SIZE, onProgress, conflictColumns = ['id'] } = options;
    
    console.log(`🔄 Starting bulk upsert for ${data.length} records`);
    
    const result: TBulkResult = { success: 0, failed: 0, errors: [], duration: Date.now() };
    const client = getLocalClient().getClient();
    
    const totalBatches = Math.ceil(data.length / batchSize);

    try {
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIdx = batchIndex * batchSize;
        const endIdx = Math.min(startIdx + batchSize, data.length);
        const batch = data.slice(startIdx, endIdx);

        if (batch.length === 0) continue;

        try {
          await client.execute('BEGIN TRANSACTION;');

          // Get column names from first record
          const columns = Object.keys(batch[0]);
          const placeholders = columns.map(() => '?').join(', ');
          const updateClause = columns
            .filter(col => !conflictColumns.includes(col))
            .map(col => `${col} = excluded.${col}`)
            .join(', ');

          const upsertSQL = `
            INSERT INTO ${tableName} (${columns.join(', ')}, synced)
            VALUES (${placeholders}, 0)
            ON CONFLICT(${conflictColumns.join(', ')}) DO UPDATE SET
            ${updateClause}, synced = 0, updated_at = CURRENT_TIMESTAMP
          `;

          for (const record of batch) {
            try {
              const values = columns.map(col => record[col]);
              await client.execute(upsertSQL, values);
              result.success++;

              // Add to sync queue
              syncQueue.addOperation({
                type: record.id ? 'update' : 'create',
                table: tableName,
                data: record
              });

            } catch (recordError) {
              result.failed++;
              result.errors.push({
                index: startIdx + batch.indexOf(record),
                error: recordError instanceof Error ? recordError.message : 'Upsert failed',
                data: record
              });
            }
          }

          await client.execute('COMMIT;');

          // Report progress
          const completed = Math.min(endIdx, data.length);
          onProgress?.(completed, data.length);

        } catch (batchError) {
          await client.execute('ROLLBACK;');
          
          // Mark entire batch as failed
          for (let i = 0; i < batch.length; i++) {
            result.errors.push({
              index: startIdx + i,
              error: batchError instanceof Error ? batchError.message : 'Batch upsert failed',
              data: batch[i]
            });
          }
          result.failed += batch.length;
        }
      }

    } catch (error) {
      console.error('❌ Bulk upsert failed:', error);
      throw error;
    }

    result.duration = Date.now() - result.duration;
    console.log(`✅ Bulk upsert completed: ${result.success} success, ${result.failed} failed in ${result.duration}ms`);
    
    return result;
  }

  // Import data from CSV or JSON
  async importData(
    tableName: string,
    data: any[],
    options: {
      format: 'csv' | 'json';
      mapping?: Record<string, string>; // Map source columns to table columns
      skipValidation?: boolean;
      onProgress?: (completed: number, total: number) => void;
    }
  ): Promise<TBulkResult> {
    console.log(`📥 Importing ${data.length} records to ${tableName}`);

    // Apply column mapping if provided
    const transformedData = options.mapping 
      ? data.map(record => this.applyColumnMapping(record, options.mapping!))
      : data;

    // Validate data structure if not skipped
    if (!options.skipValidation) {
      const validationResult = await this.validateImportData(tableName, transformedData);
      if (!validationResult.valid) {
        throw new Error(`Import validation failed: ${validationResult.errors.join(', ')}`);
      }
    }

    return await this.bulkUpsert(tableName, transformedData, {
      onProgress: options.onProgress
    });
  }

  private applyColumnMapping(record: any, mapping: Record<string, string>): any {
    const transformed: any = {};
    
    for (const [sourceCol, targetCol] of Object.entries(mapping)) {
      if (sourceCol in record) {
        transformed[targetCol] = record[sourceCol];
      }
    }

    // Include unmapped columns as-is
    for (const [key, value] of Object.entries(record)) {
      if (!(key in mapping)) {
        transformed[key] = value;
      }
    }

    return transformed;
  }

  private async validateImportData(
    tableName: string,
    data: any[]
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (data.length === 0) {
      errors.push('No data to import');
      return { valid: false, errors };
    }

    // Basic validation - check for required columns based on table
    const sampleRecord = data[0];
    const requiredColumns = await this.getRequiredColumns(tableName);
    
    for (const column of requiredColumns) {
      if (!(column in sampleRecord)) {
        errors.push(`Missing required column: ${column}`);
      }
    }

    // Check data types and constraints
    for (let i = 0; i < Math.min(data.length, 10); i++) {
      const record = data[i];
      const recordErrors = this.validateRecord(tableName, record, i);
      errors.push(...recordErrors);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private async getRequiredColumns(tableName: string): Promise<string[]> {
    // This would typically query the schema, but for now return common required fields
    const commonRequired: Record<string, string[]> = {
      categories: ['name', 'type'],
      transactions: ['amount', 'type', 'category_id', 'date'],
      budgets: ['name', 'amount', 'category_id', 'period', 'start_date'],
      savings_goals: ['name', 'target_amount']
    };

    return commonRequired[tableName] || [];
  }

  private validateRecord(tableName: string, record: any, index: number): string[] {
    const errors: string[] = [];

    // Common validations
    if (tableName === 'transactions' || tableName === 'budgets') {
      if ('amount' in record && (typeof record.amount !== 'number' || record.amount <= 0)) {
        errors.push(`Record ${index}: Amount must be a positive number`);
      }
    }

    if (tableName === 'transactions' && 'date' in record) {
      const date = new Date(record.date);
      if (isNaN(date.getTime())) {
        errors.push(`Record ${index}: Invalid date format`);
      }
    }

    return errors;
  }

  // Get operation statistics
  getPerformanceStats(): {
    averageProcessingTime: number;
    totalOperations: number;
    successRate: number;
  } {
    // This would track performance metrics over time
    // For now, return placeholder data
    return {
      averageProcessingTime: 150, // ms per record
      totalOperations: 0,
      successRate: 0.95
    };
  }
}

// Singleton instance
let bulkManagerInstance: BulkOperationManager | null = null;

export function getBulkOperationManager(): BulkOperationManager {
  if (!bulkManagerInstance) {
    bulkManagerInstance = new BulkOperationManager();
  }
  return bulkManagerInstance;
}

export { BulkOperationManager };
