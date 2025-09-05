'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3, 
  Database, 
  Table, 
  ChevronLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  HardDrive,
  Hash
} from 'lucide-react';
import { 
  getDatabaseMetrics, 
  type DatabaseMetrics as DatabaseMetricsType,
  type DatabaseConnection 
} from '../api-actions';

interface DatabaseMetricsProps {
  connection: DatabaseConnection;
  onBack: () => void;
}

export function DatabaseMetrics({ connection, onBack }: DatabaseMetricsProps) {
  const [metrics, setMetrics] = useState<DatabaseMetricsType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, [connection.id]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDatabaseMetrics(connection.id);
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch database metrics');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const getTableSizePercentage = (tableRows: number, totalRows: number): number => {
    if (totalRows === 0) return 0;
    return (tableRows / totalRows) * 100;
  };

  const getTopTables = () => {
    if (!metrics) return [];
    return Object.entries(metrics.tableRowCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
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
            <h2 className="text-2xl font-bold">{connection.name}</h2>
            <p className="text-gray-600">Database Metrics</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading database metrics...</span>
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
            <h2 className="text-2xl font-bold">{connection.name}</h2>
            <p className="text-gray-600">Database Metrics</p>
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

  if (!metrics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{connection.name}</h2>
            <p className="text-gray-600">Database Metrics</p>
          </div>
        </div>
        
        <div className="text-center py-8 text-gray-500">
          <BarChart3 className="h-8 w-8 mx-auto mb-2" />
          <p>No metrics available</p>
        </div>
      </div>
    );
  }

  const topTables = getTopTables();

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
            <p className="text-gray-600">Database Metrics & Statistics</p>
          </div>
        </div>
        <Button onClick={fetchMetrics} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
            <Table className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.tableCount)}</div>
            <p className="text-xs text-muted-foreground">
              Database tables
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rows</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.totalRows)}</div>
            <p className="text-xs text-muted-foreground">
              Across all tables
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Size</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(metrics.totalSize)}</div>
            <p className="text-xs text-muted-foreground">
              Total storage used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rows/Table</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(Math.round(metrics.totalRows / metrics.tableCount))}
            </div>
            <p className="text-xs text-muted-foreground">
              Average table size
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table className="h-5 w-5" />
            Table Statistics
          </CardTitle>
          <CardDescription>
            Row counts and size distribution across tables
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topTables.length > 0 ? (
            <div className="space-y-4">
              {topTables.map(([tableName, rowCount]) => {
                const percentage = getTableSizePercentage(rowCount, metrics.totalRows);
                return (
                  <div key={tableName} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tableName}</span>
                        <Badge variant="secondary">
                          {formatNumber(rowCount)} rows
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-500">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              
              {Object.keys(metrics.tableRowCounts).length > 10 && (
                <div className="text-center text-sm text-gray-500 pt-2">
                  Showing top 10 tables of {Object.keys(metrics.tableRowCounts).length} total
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Table className="h-8 w-8 mx-auto mb-2" />
              <p>No table data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Database Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Information
          </CardTitle>
          <CardDescription>
            Connection details and database metadata
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Database Type</label>
                <p className="text-sm">{connection.type.toUpperCase()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Connection Name</label>
                <p className="text-sm">{connection.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-sm">{new Date(connection.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="text-sm">{new Date(connection.updatedAt).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Favorite</label>
                <p className="text-sm">
                  {connection.isFavorite ? (
                    <Badge variant="default">Yes</Badge>
                  ) : (
                    <Badge variant="secondary">No</Badge>
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Connection Path</label>
                <p className="text-sm font-mono text-xs break-all">
                  {connection.filePath || connection.url || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
