// Database Viewer API Actions
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Types
export interface DatabaseConnection {
  id: string;
  name: string;
  type: 'postgres' | 'sqlite' | 'libsql';
  url?: string;
  filePath?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseTable {
  name: string;
  type: string;
  schema?: string;
}

export interface TableRow {
  [key: string]: any;
}

export interface QueryResult {
  rows: TableRow[];
  columns: { name: string }[];
  rowCount: number;
}

export interface DatabaseMetrics {
  tableCount: number;
  totalSize: number;
  tableRowCounts: Record<string, number>;
  totalRows: number;
}

export interface TableData {
  rows: TableRow[];
  columns: { name: string }[];
  totalRows: number;
  hasMore: boolean;
}

// Helper function for API calls
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log('Making API request to:', url);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    console.log('API response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API request failed:', response.status, response.statusText, errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('API response data:', result);
    
    if (!result.success) {
      throw new Error(result.error || 'API request failed');
    }

    return result.data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// Connection Management
export async function getConnections(): Promise<DatabaseConnection[]> {
  return fetchApi<DatabaseConnection[]>('/api/database-studio/connections');
}

export async function getConnection(id: string): Promise<DatabaseConnection> {
  return fetchApi<DatabaseConnection>(`/api/database-studio/connections/${id}`);
}

export async function createConnection(connection: Partial<DatabaseConnection>): Promise<DatabaseConnection> {
  return fetchApi<DatabaseConnection>('/api/database-studio/connections', {
    method: 'POST',
    body: JSON.stringify(connection),
  });
}

export async function updateConnection(id: string, connection: Partial<DatabaseConnection>): Promise<DatabaseConnection> {
  return fetchApi<DatabaseConnection>(`/api/database-studio/connections/${id}`, {
    method: 'PUT',
    body: JSON.stringify(connection),
  });
}

export async function deleteConnection(id: string): Promise<void> {
  return fetchApi<void>(`/api/database-studio/connections/${id}`, {
    method: 'DELETE',
  });
}

export async function testConnection(id: string): Promise<{ success: boolean; info?: any; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/database-studio/connections/${id}/connect`, {
      method: 'POST',
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Connection test failed' };
  }
}

export async function toggleFavorite(id: string): Promise<DatabaseConnection> {
  return fetchApi<DatabaseConnection>(`/api/database-studio/connections/${id}/favorite`, {
    method: 'PATCH',
  });
}

// Database Operations
export async function getTables(connectionId: string): Promise<DatabaseTable[]> {
  return fetchApi<DatabaseTable[]>(`/api/database-studio/connections/${connectionId}/tables`);
}

export async function getTableRows(
  connectionId: string,
  tableName: string,
  options: {
    limit?: number;
    offset?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<TableData> {
  const params = new URLSearchParams();
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.offset) params.append('offset', options.offset.toString());
  if (options.search) params.append('q', options.search);
  if (options.sortBy) params.append('sort', options.sortBy);
  if (options.sortOrder) params.append('order', options.sortOrder);

  const queryString = params.toString();
  const endpoint = `/api/database-studio/connections/${connectionId}/tables/${tableName}/rows${queryString ? `?${queryString}` : ''}`;
  
  return fetchApi<TableData>(endpoint);
}

export async function executeQuery(connectionId: string, query: string): Promise<QueryResult> {
  return fetchApi<QueryResult>(`/api/database-studio/connections/${connectionId}/query`, {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

export async function getDatabaseMetrics(connectionId: string): Promise<DatabaseMetrics> {
  return fetchApi<DatabaseMetrics>(`/api/database-studio/connections/${connectionId}/metrics`);
}
