import { createClient } from '@libsql/client';
import { Connection } from '../schemas/connections.schema';

export interface DatabaseInfo {
  tables: TableInfo[];
  size: number;
  rowCounts: Record<string, number>;
}

export interface TableInfo {
  name: string;
  schema: string;
  columns: ColumnInfo[];
}

export interface ColumnInfo {
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  nullable: boolean;
}

export class DatabaseConnectionService {
  private connections = new Map<string, any>();

  async testConnection(connection: Connection): Promise<{ success: boolean; error?: string; info?: DatabaseInfo }> {
    try {
      switch (connection.type) {
        case 'libsql':
          return await this.testLibSQLConnection(connection);
        case 'sqlite':
          return await this.testSQLiteConnection(connection);
        case 'postgres':
          return await this.testPostgresConnection(connection);
        default:
          return { success: false, error: `Unsupported database type: ${connection.type}` };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown connection error' 
      };
    }
  }

  async getConnection(connectionId: string): Promise<any> {
    return this.connections.get(connectionId);
  }

  async closeConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (connection) {
      // For LibSQL, we don't need to explicitly close
      // For PostgreSQL, we would close the pool
      this.connections.delete(connectionId);
    }
  }

  private async testLibSQLConnection(connection: Connection): Promise<{ success: boolean; error?: string; info?: DatabaseInfo }> {
    try {
      if (!connection.url || !connection.token) {
        return { success: false, error: 'LibSQL requires both URL and token' };
      }

      const client = createClient({
        url: connection.url,
        authToken: connection.token
      });

      // Test the connection by getting table list
      const tables = await client.execute('SELECT name FROM sqlite_master WHERE type="table"');
      
      const tableInfos: TableInfo[] = [];
      for (const table of tables.rows) {
        const tableName = table.name as string;
        const schema = await client.execute(`PRAGMA table_info(${tableName})`);
        
        const columns: ColumnInfo[] = schema.rows.map((col: any) => ({
          name: col.name,
          type: col.type,
          isPrimaryKey: col.pk === 1,
          isForeignKey: false, // LibSQL doesn't expose FK info in table_info
          nullable: col.notnull === 0
        }));

        tableInfos.push({
          name: tableName,
          schema: JSON.stringify(schema.rows),
          columns
        });
      }

      // Store the connection for later use
      this.connections.set(connection.id!, client);

      return {
        success: true,
        info: {
          tables: tableInfos,
          size: 0, // LibSQL doesn't expose size info
          rowCounts: {} // Would need to query each table
        }
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'LibSQL connection failed' 
      };
    }
  }

  private async testSQLiteConnection(connection: Connection): Promise<{ success: boolean; error?: string; info?: DatabaseInfo }> {
    try {
      if (!connection.filePath) {
        return { success: false, error: 'SQLite requires a file path' };
      }

      // For now, we'll use LibSQL client to connect to local SQLite files
      // In production, you might want to use better-sqlite3 for better performance
      const client = createClient({
        url: `file:${connection.filePath}`
      });

      const tables = await client.execute('SELECT name FROM sqlite_master WHERE type="table"');
      
      const tableInfos: TableInfo[] = [];
      for (const table of tables.rows) {
        const tableName = table.name as string;
        const schema = await client.execute(`PRAGMA table_info(${tableName})`);
        
        const columns: ColumnInfo[] = schema.rows.map((col: any) => ({
          name: col.name,
          type: col.type,
          isPrimaryKey: col.pk === 1,
          isForeignKey: false,
          nullable: col.notnull === 0
        }));

        tableInfos.push({
          name: tableName,
          schema: JSON.stringify(schema.rows),
          columns
        });
      }

      this.connections.set(connection.id!, client);

      return {
        success: true,
        info: {
          tables: tableInfos,
          size: 0,
          rowCounts: {}
        }
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'SQLite connection failed' 
      };
    }
  }

  private async testPostgresConnection(connection: Connection): Promise<{ success: boolean; error?: string; info?: DatabaseInfo }> {
    // TODO: Implement PostgreSQL connection
    // This would require adding pg package and implementing connection pooling
    return { 
      success: false, 
      error: 'PostgreSQL support coming soon. Please use LibSQL or SQLite for now.' 
    };
  }

  async executeQuery(connectionId: string, query: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        return { success: false, error: 'Connection not found' };
      }

      const result = await connection.execute(query);
      return {
        success: true,
        data: {
          rows: result.rows,
          columns: result.columns,
          rowCount: result.rowsAffected
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Query execution failed'
      };
    }
  }

  async getTableRows(
    connectionId: string, 
    tableName: string, 
    limit: number = 100, 
    offset: number = 0,
    search?: string,
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        return { success: false, error: 'Connection not found' };
      }

      let query = `SELECT * FROM ${tableName}`;
      const params: any[] = [];

      if (search) {
        // Simple search across all columns - in production, you'd want to be more specific
        query += ` WHERE rowid IN (SELECT rowid FROM ${tableName} WHERE rowid LIKE ? OR name LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
      }

      if (sortBy) {
        query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
      }

      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const result = await connection.execute(query, params);
      
      return {
        success: true,
        data: {
          rows: result.rows,
          total: result.rows.length,
          hasMore: result.rows.length === limit
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch table rows'
      };
    }
  }
}
