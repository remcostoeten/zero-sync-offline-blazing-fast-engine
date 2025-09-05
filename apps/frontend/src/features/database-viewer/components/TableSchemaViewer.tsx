'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table, 
  Database, 
  Key, 
  Index, 
  ChevronLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  executeQuery,
  type DatabaseConnection 
} from '../api-actions';

interface TableSchemaViewerProps {
  connection: DatabaseConnection;
  tableName: string;
  onBack: () => void;
}

interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

interface IndexInfo {
  seq: number;
  name: string;
  unique: number;
  origin: string;
  partial: number;
}

interface TableSchema {
  columns: ColumnInfo[];
  indexes: IndexInfo[];
  createStatement: string;
}

export function TableSchemaViewer({ connection, tableName, onBack }: TableSchemaViewerProps) {
  const [schema, setSchema] = useState<TableSchema | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateStatement, setShowCreateStatement] = useState(false);

  useEffect(() => {
    fetchTableSchema();
  }, [connection.id, tableName]);

  const fetchTableSchema = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get column information
      const columnsQuery = `PRAGMA table_info(${tableName});`;
      const columnsResult = await executeQuery(connection.id, columnsQuery);

      // Get index information
      const indexesQuery = `PRAGMA index_list(${tableName});`;
      const indexesResult = await executeQuery(connection.id, indexesQuery);

      // Get CREATE statement
      const createQuery = `SELECT sql FROM sqlite_master WHERE name='${tableName}' AND type='table';`;
      const createResult = await executeQuery(connection.id, createQuery);

      setSchema({
        columns: columnsResult.rows as ColumnInfo[],
        indexes: indexesResult.rows as IndexInfo[],
        createStatement: createResult.rows[0]?.sql || ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch table schema');
    } finally {
      setLoading(false);
    }
  };

  const getColumnTypeColor = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('int') || lowerType.includes('integer')) return 'bg-blue-100 text-blue-800';
    if (lowerType.includes('text') || lowerType.includes('varchar') || lowerType.includes('char')) return 'bg-green-100 text-green-800';
    if (lowerType.includes('real') || lowerType.includes('float') || lowerType.includes('double') || lowerType.includes('decimal')) return 'bg-purple-100 text-purple-800';
    if (lowerType.includes('blob')) return 'bg-orange-100 text-orange-800';
    if (lowerType.includes('date') || lowerType.includes('time')) return 'bg-pink-100 text-pink-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatDefaultValue = (value: any) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') return `'${value}'`;
    return String(value);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{tableName}</h2>
            <p className="text-gray-600">Table Schema</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading table schema...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{tableName}</h2>
            <p className="text-gray-600">Table Schema</p>
          </div>
        </div>
        
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!schema) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{tableName}</h2>
            <p className="text-gray-600">Table Schema</p>
          </div>
        </div>
        
        <div className="text-center py-8 text-gray-500">
          <Table className="h-8 w-8 mx-auto mb-2" />
          <p>No schema information available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{tableName}</h2>
            <p className="text-gray-600">Table Schema & Structure</p>
          </div>
        </div>
        <Button onClick={fetchTableSchema} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Table Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table className="h-5 w-5" />
            Table Overview
          </CardTitle>
          <CardDescription>
            Basic information about the {tableName} table
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{schema.columns.length}</div>
              <div className="text-sm text-gray-600">Columns</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{schema.indexes.length}</div>
              <div className="text-sm text-gray-600">Indexes</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {schema.columns.filter(col => col.pk).length}
              </div>
              <div className="text-sm text-gray-600">Primary Keys</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Columns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Columns ({schema.columns.length})
          </CardTitle>
          <CardDescription>
            Column definitions, types, and constraints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-900">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-900">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-900">Nullable</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-900">Default</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-900">Primary Key</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {schema.columns.map((column) => (
                  <tr key={column.cid} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{column.name}</span>
                        {column.pk && (
                          <Key className="h-3 w-3 text-yellow-600" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={getColumnTypeColor(column.type)}>
                        {column.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={column.notnull ? 'destructive' : 'secondary'}>
                        {column.notnull ? 'NOT NULL' : 'NULL'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {column.dflt_value !== null ? (
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {formatDefaultValue(column.dflt_value)}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {column.pk ? (
                        <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                          Primary Key
                        </Badge>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Indexes */}
      {schema.indexes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Index className="h-5 w-5" />
              Indexes ({schema.indexes.length})
            </CardTitle>
            <CardDescription>
              Database indexes for improved query performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schema.indexes.map((index, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Index className="h-4 w-4 text-gray-600" />
                    <div>
                      <div className="font-medium">{index.name}</div>
                      <div className="text-sm text-gray-600">
                        {index.unique ? 'Unique' : 'Non-unique'} • {index.origin}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {index.unique && (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Unique
                      </Badge>
                    )}
                    {index.partial && (
                      <Badge variant="secondary">
                        Partial
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CREATE Statement */}
      {schema.createStatement && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
  
