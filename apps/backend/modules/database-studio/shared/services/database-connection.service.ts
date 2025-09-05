import { Client } from 'pg';
import { createConnection } from 'mysql2/promise';
import Database from 'better-sqlite3';
import type { Connection } from '../schemas/connections.schema';

export type DatabaseInfo = {
  version: string;
  tables: TableInfo[];
};

export type TableInfo = {
  name: string;
  columns: ColumnInfo[];
  rowCount?: number;
};

export type ColumnInfo = {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string | null;
  isPrimaryKey?: boolean;
};

type ConnectionResult = {
  success: boolean;
  error?: string;
  info?: DatabaseInfo;
};

type QueryResult = {
  success: boolean;
  data?: any[];
  error?: string;
};

type RowCountResult = {
  success: boolean;
  data?: Record<string, number>;
  error?: string;
};

type SizeResult = {
  success: boolean;
  data?: number;
  error?: string;
};

type TableRowsResult = {
  success: boolean;
  data?: {
    rows: any[];
    total: number;
    hasMore: boolean;
  };
  error?: string;
};

export class DatabaseConnectionService {
  private activeConnections = new Map<string, any>();

  async testConnection(connection: Connection): Promise<ConnectionResult> {
    try {
      switch (connection.type) {
        case 'postgresql':
          return await this.testPostgreSQL(connection);
        case 'mysql':
          return await this.testMySQL(connection);
        case 'sqlite':
          return await this.testSQLite(connection);
        default:
          return {
            success: false,
            error: `Unsupported database type: ${connection.type}`
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async closeConnection(connectionId: string): Promise<void> {
    const conn = this.activeConnections.get(connectionId);
    if (conn) {
      try {
        if (conn.end) {
          await conn.end();
        } else if (conn.close) {
          conn.close();
        }
      } catch (error) {
        console.error('Error closing connection:', error);
      }
      this.activeConnections.delete(connectionId);
    }
  }

  async getTableRows(
    connectionId: string,
    tableName: string,
    limit: number,
    offset: number,
    search?: string,
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<TableRowsResult> {
    try {
      const conn = this.activeConnections.get(connectionId);
      if (!conn) {
        return {
          success: false,
          error: 'No active connection found'
        };
      }

      let query = `SELECT * FROM ${tableName}`;
      const params: any[] = [];

      if (search) {
        query += ` WHERE CAST(${tableName} AS TEXT) LIKE ?`;
        params.push(`%${search}%`);
      }

      if (sortBy) {
        query += ` ORDER BY ${sortBy} ${sortOrder}`;
      }

      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const countQuery = search 
        ? `SELECT COUNT(*) as total FROM ${tableName} WHERE CAST(${tableName} AS TEXT) LIKE ?`
        : `SELECT COUNT(*) as total FROM ${tableName}`;

      const countParams = search ? [`%${search}%`] : [];

      const [rows, countResult] = await Promise.all([
        this.executeRawQuery(conn, query, params),
        this.executeRawQuery(conn, countQuery, countParams)
      ]);

      const total = countResult[0]?.total || 0;
      const hasMore = offset + limit < total;

      return {
        success: true,
        data: {
          rows,
          total,
          hasMore
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async executeQuery(connectionId: string, query: string): Promise<QueryResult> {
    try {
      const conn = this.activeConnections.get(connectionId);
      if (!conn) {
        return {
          success: false,
          error: 'No active connection found'
        };
      }

      const result = await this.executeRawQuery(conn, query);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Query execution failed'
      };
    }
  }

  async getTableRowCounts(connectionId: string, tableNames: string[]): Promise<RowCountResult> {
    try {
      const conn = this.activeConnections.get(connectionId);
      if (!conn) {
        return {
          success: false,
          error: 'No active connection found'
        };
      }

      const rowCounts: Record<string, number> = {};
      
      for (const tableName of tableNames) {
        try {
          const result = await this.executeRawQuery(conn, `SELECT COUNT(*) as count FROM ${tableName}`);
          rowCounts[tableName] = result[0]?.count || 0;
        } catch (error) {
          rowCounts[tableName] = 0;
        }
      }

      return {
        success: true,
        data: rowCounts
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get row counts'
      };
    }
  }

  async getDatabaseSize(connectionId: string): Promise<SizeResult> {
    try {
      const conn = this.activeConnections.get(connectionId);
      if (!conn) {
        return {
          success: false,
          error: 'No active connection found'
        };
      }

      // This is a simplified implementation - actual size calculation varies by database type
      return {
        success: true,
        data: 0 // Placeholder - would need database-specific queries
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get database size'
      };
    }
  }

  private async testPostgreSQL(connection: Connection): Promise<ConnectionResult> {
    let client: Client | undefined;
    
    try {
      client = new Client({
        host: connection.host,
        port: connection.port,
        database: connection.database,
        user: connection.username,
        password: connection.password,
        ssl: connection.ssl ? { rejectUnauthorized: false } : false
      });

      await client.connect();
      
      // Get database version
      const versionResult = await client.query('SELECT version()');
      const version = versionResult.rows[0]?.version || 'Unknown';

      // Get tables information
      const tablesResult = await client.query(`
        SELECT 
          t.table_name,
          c.column_name,
          c.data_type,
          c.is_nullable,
          c.column_default,
          CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key
        FROM information_schema.tables t
        LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
        LEFT JOIN (
          SELECT kcu.column_name, kcu.table_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          WHERE tc.constraint_type = 'PRIMARY KEY'
        ) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
        WHERE t.table_schema = 'public' 
          AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name, c.ordinal_position
      `);

      const tables = this.groupTableInfo(tablesResult.rows);
      
      // Store active connection
      this.activeConnections.set(connection.id, client);

      return {
        success: true,
        info: {
          version,
          tables
        }
      };
    } catch (error) {
      if (client) {
        await client.end().catch(() => {});
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PostgreSQL connection failed'
      };
    }
  }

  private async testMySQL(connection: Connection): Promise<ConnectionResult> {
    let conn: any;
    
    try {
      conn = await createConnection({
        host: connection.host,
        port: connection.port,
        database: connection.database,
        user: connection.username,
        password: connection.password,
        ssl: connection.ssl ? {} : false
      });

      // Get database version
      const [versionRows] = await conn.execute('SELECT VERSION() as version');
      const version = (versionRows as any[])[0]?.version || 'Unknown';

      // Get tables information
      const [tableRows] = await conn.execute(`
        SELECT 
          t.table_name,
          c.column_name,
          c.data_type,
          c.is_nullable,
          c.column_default,
          CASE WHEN k.column_name IS NOT NULL THEN 1 ELSE 0 END as is_primary_key
        FROM information_schema.tables t
        LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
        LEFT JOIN information_schema.key_column_usage k ON c.table_name = k.table_name 
          AND c.column_name = k.column_name 
          AND k.constraint_name = 'PRIMARY'
        WHERE t.table_schema = DATABASE()
          AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name, c.ordinal_position
      `);

      const tables = this.groupTableInfo(tableRows as any[]);
      
      // Store active connection
      this.activeConnections.set(connection.id, conn);

      return {
        success: true,
        info: {
          version,
          tables
        }
      };
    } catch (error) {
      if (conn) {
        await conn.end().catch(() => {});
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'MySQL connection failed'
      };
    }
  }

  private async testSQLite(connection: Connection): Promise<ConnectionResult> {
    let db: Database.Database | undefined;
    
    try {
      db = new Database(connection.database);

      // Get SQLite version
      const versionResult = db.prepare('SELECT sqlite_version() as version').get() as any;
      const version = `SQLite ${versionResult?.version || 'Unknown'}`;

      // Get tables information
      const tablesResult = db.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
      `).all() as any[];

      const tables: TableInfo[] = [];
      
      for (const table of tablesResult) {
        const columnsResult = db.prepare(`PRAGMA table_info(${table.name})`).all() as any[];
        
        const columns: ColumnInfo[] = columnsResult.map(col => ({
          name: col.name,
          type: col.type,
          nullable: col.notnull === 0,
          defaultValue: col.dflt_value,
          isPrimaryKey: col.pk === 1
        }));

        tables.push({
          name: table.name,
          columns
        });
      }
      
      // Store active connection
      this.activeConnections.set(connection.id, db);

      return {
        success: true,
        info: {
          version,
          tables
        }
      };
    } catch (error) {
      if (db) {
        db.close();
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SQLite connection failed'
      };
    }
  }

  private groupTableInfo(rows: any[]): TableInfo[] {
    const tablesMap = new Map<string, TableInfo>();

    for (const row of rows) {
      const tableName = row.table_name;
      
      if (!tablesMap.has(tableName)) {
        tablesMap.set(tableName, {
          name: tableName,
          columns: []
        });
      }

      const table = tablesMap.get(tableName)!;
      table.columns.push({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES',
        defaultValue: row.column_default,
        isPrimaryKey: row.is_primary_key === true || row.is_primary_key === 1
      });
    }

    return Array.from(tablesMap.values());
  }

  private async executeRawQuery(conn: any, query: string, params: any[] = []): Promise<any[]> {
    if (conn instanceof Client) {
      // PostgreSQL
      const result = await conn.query(query, params);
      return result.rows;
    } else if (conn.execute) {
      // MySQL
      const [rows] = await conn.execute(query, params);
      return rows as any[];
    } else if (conn.prepare) {
      // SQLite
      const stmt = conn.prepare(query);
      if (params.length > 0) {
        return stmt.all(...params);
      } else {
        return stmt.all();
      }
    } else {
      throw new Error('Unknown connection type');
    }
  }
}
