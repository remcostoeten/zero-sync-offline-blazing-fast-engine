'use client';

import { z } from 'zod';

export type TConflictType = 
  | 'remote_newer'      // Remote data is newer than local
  | 'local_newer'       // Local data is newer than remote  
  | 'both_modified'     // Both local and remote have been modified
  | 'remote_deleted'    // Record deleted on remote but modified locally
  | 'local_deleted'     // Record deleted locally but modified on remote
  | 'field_conflict';   // Specific field conflicts

export type TResolutionStrategy = 
  | 'local_wins'        // Always take local version
  | 'remote_wins'       // Always take remote version
  | 'newest_wins'       // Take the version with newest timestamp
  | 'merge_fields'      // Merge non-conflicting fields
  | 'ask_user'          // Prompt user to resolve
  | 'create_duplicate'; // Create duplicate record

export type TConflictRecord<T = any> = {
  id: string;
  entity: string;
  conflictType: TConflictType;
  localData: T | null;
  remoteData: T | null;
  fieldConflicts?: string[];
  timestamp: Date;
  resolved: boolean;
  resolution?: TResolutionStrategy;
  resolvedData?: T;
};

export type TConflictResolution<T = any> = {
  strategy: TResolutionStrategy;
  resolvedData: T;
  keepBoth?: boolean;
};

class ConflictResolver {
  private conflicts: Map<string, TConflictRecord> = new Map();
  private resolutionStrategies: Map<string, TResolutionStrategy> = new Map();

  // Default resolution strategies per entity type
  private defaultStrategies: Record<string, TResolutionStrategy> = {
    categories: 'newest_wins',
    transactions: 'merge_fields', 
    budgets: 'ask_user',
    savings_goals: 'newest_wins'
  };

  detectConflict<T extends Record<string, any>>(
    entity: string,
    localData: T | null,
    remoteData: T | null,
    id: string
  ): TConflictRecord<T> | null {
    // No conflict if one side is null (simple create/delete)
    if (!localData || !remoteData) {
      return null;
    }

    const localTimestamp = new Date(localData.updatedAt || localData.createdAt);
    const remoteTimestamp = new Date(remoteData.updatedAt || remoteData.createdAt);
    
    // Compare timestamps
    const timeDiff = localTimestamp.getTime() - remoteTimestamp.getTime();
    const fieldConflicts: string[] = [];

    // Detect field-level conflicts (excluding metadata fields)
    const excludeFields = ['id', 'createdAt', 'updatedAt', 'synced'];
    
    for (const key in localData) {
      if (excludeFields.includes(key)) continue;
      
      if (localData[key] !== remoteData[key]) {
        fieldConflicts.push(key);
      }
    }

    // Determine conflict type
    let conflictType: TConflictType;
    
    if (fieldConflicts.length === 0) {
      // No actual data conflicts, just timestamp differences
      return null;
    }
    
    if (Math.abs(timeDiff) < 1000) { // Less than 1 second difference
      conflictType = 'both_modified';
    } else if (timeDiff > 0) {
      conflictType = 'local_newer';
    } else {
      conflictType = 'remote_newer';
    }

    const conflict: TConflictRecord<T> = {
      id: `${entity}_${id}_${Date.now()}`,
      entity,
      conflictType,
      localData,
      remoteData,
      fieldConflicts: fieldConflicts.length > 0 ? fieldConflicts : undefined,
      timestamp: new Date(),
      resolved: false
    };

    this.conflicts.set(conflict.id, conflict);
    return conflict;
  }

  async resolveConflict<T extends Record<string, any>>(
    conflictId: string,
    strategy?: TResolutionStrategy
  ): Promise<TConflictResolution<T> | null> {
    const conflict = this.conflicts.get(conflictId) as TConflictRecord<T>;
    
    if (!conflict || conflict.resolved) {
      return null;
    }

    const resolveStrategy = strategy || 
      this.resolutionStrategies.get(conflict.entity) ||
      this.defaultStrategies[conflict.entity] ||
      'newest_wins';

    let resolvedData: T;
    let keepBoth = false;

    switch (resolveStrategy) {
      case 'local_wins':
        resolvedData = conflict.localData!;
        break;

      case 'remote_wins':
        resolvedData = conflict.remoteData!;
        break;

      case 'newest_wins':
        const localTime = new Date(conflict.localData?.updatedAt || 0).getTime();
        const remoteTime = new Date(conflict.remoteData?.updatedAt || 0).getTime();
        resolvedData = localTime > remoteTime ? conflict.localData! : conflict.remoteData!;
        break;

      case 'merge_fields':
        resolvedData = this.mergeFields(conflict.localData!, conflict.remoteData!);
        break;

      case 'create_duplicate':
        resolvedData = conflict.localData!;
        keepBoth = true;
        break;

      case 'ask_user':
        // This would trigger UI for user decision
        // For now, fall back to newest_wins
        const localTimestamp = new Date(conflict.localData?.updatedAt || 0).getTime();
        const remoteTimestamp = new Date(conflict.remoteData?.updatedAt || 0).getTime();
        resolvedData = localTimestamp > remoteTimestamp ? conflict.localData! : conflict.remoteData!;
        break;

      default:
        resolvedData = conflict.remoteData!;
    }

    // Mark as resolved
    conflict.resolved = true;
    conflict.resolution = resolveStrategy;
    conflict.resolvedData = resolvedData;

    return {
      strategy: resolveStrategy,
      resolvedData,
      keepBoth
    };
  }

  private mergeFields<T extends Record<string, any>>(local: T, remote: T): T {
    const merged = { ...remote }; // Start with remote as base

    // Merge strategy: take local values for user-modified fields
    const userFields = ['name', 'description', 'amount', 'color', 'icon'];
    const localTimestamp = new Date(local.updatedAt || 0).getTime();
    const remoteTimestamp = new Date(remote.updatedAt || 0).getTime();

    for (const field of userFields) {
      if (field in local && local[field] !== remote[field]) {
        // If local is newer for this field, use local value
        if (localTimestamp > remoteTimestamp) {
          merged[field] = local[field];
        }
        // Otherwise keep remote value (already in merged)
      }
    }

    // Always use the newest timestamp
    merged.updatedAt = localTimestamp > remoteTimestamp ? local.updatedAt : remote.updatedAt;

    return merged;
  }

  // Batch conflict resolution
  async resolveAllConflicts(
    defaultStrategy: TResolutionStrategy = 'newest_wins'
  ): Promise<TConflictResolution[]> {
    const resolutions: TConflictResolution[] = [];

    for (const conflict of this.conflicts.values()) {
      if (!conflict.resolved) {
        const resolution = await this.resolveConflict(conflict.id, defaultStrategy);
        if (resolution) {
          resolutions.push(resolution);
        }
      }
    }

    return resolutions;
  }

  // Get unresolved conflicts
  getUnresolvedConflicts(): TConflictRecord[] {
    return Array.from(this.conflicts.values()).filter(c => !c.resolved);
  }

  // Get conflicts by entity
  getConflictsByEntity(entity: string): TConflictRecord[] {
    return Array.from(this.conflicts.values()).filter(c => c.entity === entity);
  }

  // Set resolution strategy for entity type
  setResolutionStrategy(entity: string, strategy: TResolutionStrategy): void {
    this.resolutionStrategies.set(entity, strategy);
  }

  // Clear resolved conflicts (cleanup)
  clearResolvedConflicts(): void {
    for (const [id, conflict] of this.conflicts.entries()) {
      if (conflict.resolved) {
        this.conflicts.delete(id);
      }
    }
  }

  // Get conflict statistics
  getConflictStats(): {
    total: number;
    resolved: number;
    unresolved: number;
    byType: Record<TConflictType, number>;
    byEntity: Record<string, number>;
  } {
    const conflicts = Array.from(this.conflicts.values());
    
    const stats = {
      total: conflicts.length,
      resolved: conflicts.filter(c => c.resolved).length,
      unresolved: conflicts.filter(c => !c.resolved).length,
      byType: {} as Record<TConflictType, number>,
      byEntity: {} as Record<string, number>
    };

    // Count by type
    for (const conflict of conflicts) {
      stats.byType[conflict.conflictType] = (stats.byType[conflict.conflictType] || 0) + 1;
      stats.byEntity[conflict.entity] = (stats.byEntity[conflict.entity] || 0) + 1;
    }

    return stats;
  }

  // Auto-resolve simple conflicts
  async autoResolveSimpleConflicts(): Promise<number> {
    let resolved = 0;
    
    for (const conflict of this.conflicts.values()) {
      if (conflict.resolved) continue;

      // Auto-resolve if only metadata fields changed
      if (!conflict.fieldConflicts || conflict.fieldConflicts.length === 0) {
        await this.resolveConflict(conflict.id, 'newest_wins');
        resolved++;
      }
      
      // Auto-resolve if conflict is just timestamp differences
      if (conflict.conflictType === 'remote_newer' || conflict.conflictType === 'local_newer') {
        const hasRealConflicts = conflict.fieldConflicts && 
          conflict.fieldConflicts.some(field => !['updatedAt', 'createdAt'].includes(field));
        
        if (!hasRealConflicts) {
          await this.resolveConflict(conflict.id, 'newest_wins');
          resolved++;
        }
      }
    }

    return resolved;
  }
}

// Singleton instance
let conflictResolverInstance: ConflictResolver | null = null;

export function getConflictResolver(): ConflictResolver {
  if (!conflictResolverInstance) {
    conflictResolverInstance = new ConflictResolver();
  }
  return conflictResolverInstance;
}

export { ConflictResolver };
