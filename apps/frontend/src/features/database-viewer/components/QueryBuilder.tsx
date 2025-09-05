'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  ChevronLeft,
  RefreshCw,
  Copy,
  Download,
  Maximize2
} from 'lucide-react';
import { 
  executeQuery, 
  type QueryResult,
  type DatabaseConnection 
} from '../api-actions';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';

interface QueryBuilderProps {
  connection: DatabaseConnection;
  onBack: () => void;
}

export function QueryBuilder({ connection, onBack }: QueryBuilderProps) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  const handleExecuteQuery = async () => {
    if (!query.trim()) {
      setError('Please enter a SQL query');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);
      setExecutionTime(null);

      const startTime = Date.now();
      const data = await executeQuery(connection.id, query);
      const endTime = Date.now();
      
      setResult(data);
      setExecutionTime(endTime - startTime);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query execution failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClearQuery = () => {
    setQuery('');
    setResult(null);
    setError(null);
    setExecutionTime(null);
  };

  const handleCopyResult = async () => {
    if (result) {
      const csvData = convertToCSV(result);
      await navigator.clipboard.writeText(csvData);
    }
  };

  const handleDownloadResult = () => {
    if (result) {
      const csvData = convertToCSV(result);
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `query_result_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const convertToCSV = (data: QueryResult): string => {
    if (!data.rows.length) return '';
    
    const headers = data.columns.map(col => col.name).join(',');
    const rows = data.rows.map(row => 
      data.columns.map(col => {
        const value = row[col.name];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      }).join(',')
    );
    
    return [headers, ...rows].join('\n');
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">null</span>;
    }
    if (typeof value === 'boolean') {
      return <Badge variant={value ? 'default' : 'secondary'}>{value.toString()}</Badge>;
    }
    if (typeof value === 'number') {
      return <span className="font-mono">{value.toLocaleString()}</span>;
    }
    if (typeof value === 'string' && value.length > 100) {
      return <span title={value}>{value.substring(0, 100)}...</span>;
    }
    return <span>{String(value)}</span>;
  };

  const getQueryType = (query: string): string => {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.startsWith('select')) return 'SELECT';
    if (trimmed.startsWith('insert')) return 'INSERT';
    if (trimmed.startsWith('update')) return 'UPDATE';
    if (trimmed.startsWith('delete')) return 'DELETE';
    if (trimmed.startsWith('create')) return 'CREATE';
    if (trimmed.startsWith('drop')) return 'DROP';
    if (trimmed.startsWith('alter')) return 'ALTER';
    return 'UNKNOWN';
  };

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
            <h2 className="text-2xl font-bold">{connection.name}</h2>
            <p className="text-gray-600">SQL Query Builder</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {query.trim() && (
            <Badge variant="outline">
              {getQueryType(query)}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Query Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              SQL Query
            </CardTitle>
            <CardDescription>
              Write and execute SQL queries against your database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="SELECT * FROM users LIMIT 10;"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
            
            <div className="flex gap-2">
              <Button 
                onClick={handleExecuteQuery} 
                disabled={loading || !query.trim()}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Execute Query
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleClearQuery}
                disabled={loading}
              >
                Clear
              </Button>
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Query Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Results
            </CardTitle>
            <CardDescription>
              {result ? (
                <div className="flex items-center gap-4">
                  <span>{result.rowCount.toLocaleString()} rows</span>
                  {executionTime && (
                    <span className="text-green-600">
                      {executionTime}ms
                    </span>
                  )}
                </div>
              ) : (
                'Query results will appear here'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result && result.rows.length > 0 && (
              <div className="space-y-4">
                {/* Result Actions */}
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                      >
                        <Maximize2 className="mr-2 h-4 w-4" />
                        Full Screen
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] max-h-[95vh]">
                      <DialogHeader>
                        <DialogTitle>Query Results - {result.rowCount.toLocaleString()} rows</DialogTitle>
                        <DialogDescription>
                          {executionTime && `Executed in ${executionTime}ms`}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleCopyResult}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy CSV
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleDownloadResult}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download CSV
                          </Button>
                        </div>
                        
                        <div className="overflow-auto max-h-[70vh] border rounded-lg">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b sticky top-0">
                              <tr>
                                {result.columns.map((column) => (
                                  <th
                                    key={column.name}
                                    className="px-3 py-2 text-left text-xs font-medium text-gray-900"
                                  >
                                    {column.name}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {result.rows.map((row, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  {result.columns.map((column) => (
                                    <td key={column.name} className="px-3 py-2">
                                      {formatValue(row[column.name])}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleCopyResult}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleDownloadResult}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV
                  </Button>
                </div>

                {/* Results Table */}
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        {result.columns.map((column) => (
                          <th
                            key={column.name}
                            className="px-3 py-2 text-left text-xs font-medium text-gray-900"
                          >
                            {column.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {result.rows.slice(0, 100).map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          {result.columns.map((column) => (
                            <td key={column.name} className="px-3 py-2">
                              {formatValue(row[column.name])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {result.rows.length > 100 && (
                    <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-t">
                      Showing first 100 rows of {result.rowCount.toLocaleString()} total rows
                    </div>
                  )}
                </div>
              </div>
            )}

            {result && result.rows.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p>Query executed successfully</p>
                <p className="text-sm">No rows returned</p>
              </div>
            )}

            {!result && !loading && (
              <div className="text-center py-8 text-gray-400">
                <Play className="h-8 w-8 mx-auto mb-2" />
                <p>Enter a SQL query and click Execute</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sample Queries */}
      <Card>
        <CardHeader>
          <CardTitle>Sample Queries</CardTitle>
          <CardDescription>
            Click on any query to use it as a starting point
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Basic Queries</h4>
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left font-mono text-xs"
                  onClick={() => setQuery('SELECT * FROM sqlite_master WHERE type="table";')}
                >
                  Show all tables
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left font-mono text-xs"
                  onClick={() => setQuery('SELECT COUNT(*) as total_rows FROM users;')}
                >
                  Count rows in table
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left font-mono text-xs"
                  onClick={() => setQuery('SELECT * FROM users LIMIT 10;')}
                >
                  Get first 10 rows
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Schema Queries</h4>
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left font-mono text-xs"
                  onClick={() => setQuery('PRAGMA table_info(users);')}
                >
                  Show table schema
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left font-mono text-xs"
                  onClick={() => setQuery('SELECT sql FROM sqlite_master WHERE name="users";')}
                >
                  Show CREATE statement
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left font-mono text-xs"
                  onClick={() => setQuery('SELECT name FROM sqlite_master WHERE type="index";')}
                >
                  List all indexes
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
