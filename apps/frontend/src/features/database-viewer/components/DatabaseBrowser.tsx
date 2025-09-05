'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Table, 
  Play, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Star,
  StarOff,
  ExternalLink,
  BarChart3,
  Info
} from 'lucide-react';
import { 
  getConnections, 
  testConnection, 
  toggleFavorite,
  type DatabaseConnection 
} from '../api-actions';
import { EmptyState } from '@/components/ui/empty-state';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';

interface DatabaseBrowserProps {
  onSelectConnection: (connection: DatabaseConnection) => void;
  onViewMetrics: (connection: DatabaseConnection) => void;
}

export function DatabaseBrowser({ onSelectConnection, onViewMetrics }: DatabaseBrowserProps) {
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<Record<string, 'success' | 'error' | 'testing'>>({});

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching connections...');
      const data = await getConnections();
      console.log('Connections fetched:', data);
      setConnections(data);
    } catch (err) {
      console.error('Error fetching connections:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch connections';
      setError(`Connection Error: ${errorMessage}. Please check if the backend server is running on http://localhost:4000`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (connection: DatabaseConnection) => {
    setTesting(connection.id);
    setConnectionStatus(prev => ({ ...prev, [connection.id]: 'testing' }));
    
    try {
      const result = await testConnection(connection.id);
      setConnectionStatus(prev => ({ 
        ...prev, 
        [connection.id]: result.success ? 'success' : 'error' 
      }));
      
      if (result.success) {
        // Show success message briefly
        setTimeout(() => {
          setConnectionStatus(prev => ({ ...prev, [connection.id]: 'success' }));
        }, 2000);
      }
    } catch (err) {
      setConnectionStatus(prev => ({ ...prev, [connection.id]: 'error' }));
    } finally {
      setTesting(null);
    }
  };

  const handleToggleFavorite = async (connection: DatabaseConnection) => {
    try {
      const updated = await toggleFavorite(connection.id);
      setConnections(prev => 
        prev.map(conn => 
          conn.id === connection.id 
            ? { ...conn, isFavorite: updated.isFavorite }
            : conn
        )
      );
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const getDatabaseIcon = (type: string) => {
    switch (type) {
      case 'sqlite':
        return <Database className="h-5 w-5 text-blue-600" />;
      case 'libsql':
        return <Database className="h-5 w-5 text-green-600" />;
      case 'postgres':
        return <Database className="h-5 w-5 text-purple-600" />;
      default:
        return <Database className="h-5 w-5 text-gray-600" />;
    }
  };

  const getDatabaseTypeLabel = (type: string) => {
    switch (type) {
      case 'sqlite':
        return 'SQLite';
      case 'libsql':
        return 'LibSQL';
      case 'postgres':
        return 'PostgreSQL';
      default:
        return type;
    }
  };

  const getStatusIcon = (connectionId: string) => {
    const status = connectionStatus[connectionId];
    
    if (testing === connectionId || status === 'testing') {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
    }
    
    if (status === 'success') {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    
    if (status === 'error') {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
    
    return <AlertCircle className="h-4 w-4 text-gray-400" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading database connections...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-red-800">
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (connections.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8">
          <EmptyState
            icon={<Database className="h-12 w-12" />}
            title="No database connections"
            description="Create your first database connection to start browsing your data"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Database Connections</h2>
          <p className="text-gray-600">Select a database to browse tables and data</p>
        </div>
        <Button onClick={fetchConnections} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {connections.map((connection) => (
          <Card key={connection.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getDatabaseIcon(connection.type)}
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {connection.name}
                      {connection.isFavorite && (
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {getDatabaseTypeLabel(connection.type)}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        Created {formatDate(connection.createdAt)}
                      </span>
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusIcon(connection.id)}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleFavorite(connection)}
                    className="h-8 w-8 p-0"
                  >
                    {connection.isFavorite ? (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    ) : (
                      <StarOff className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTestConnection(connection)}
                    disabled={testing === connection.id}
                    className="h-8 w-8 p-0"
                    title="Test Connection"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Connection Details"
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          {getDatabaseIcon(connection.type)}
                          {connection.name}
                        </DialogTitle>
                        <DialogDescription>
                          Database connection details and configuration
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Database Type</label>
                            <p className="text-sm">{getDatabaseTypeLabel(connection.type)}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Status</label>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(connection.id)}
                              <span className="text-sm">
                                {connectionStatus[connection.id] === 'success' ? 'Connected' : 
                                 connectionStatus[connection.id] === 'error' ? 'Error' : 
                                 connectionStatus[connection.id] === 'testing' ? 'Testing...' : 'Unknown'}
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Created</label>
                            <p className="text-sm">{formatDate(connection.createdAt)}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Last Updated</label>
                            <p className="text-sm">{formatDate(connection.updatedAt)}</p>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-500">Connection Details</label>
                          <div className="mt-1 p-3 bg-gray-50 rounded-md">
                            <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap">
                              {connection.type === 'sqlite' && connection.filePath && (
                                `File Path: ${connection.filePath}`
                              )}
                              {connection.type === 'libsql' && connection.url && (
                                `URL: ${connection.url}`
                              )}
                              {connection.type === 'postgres' && connection.url && (
                                `Connection String: ${connection.url}`
                              )}
                            </pre>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestConnection(connection)}
                            disabled={testing === connection.id}
                          >
                            {testing === connection.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Testing...
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 h-4 w-4" />
                                Test Connection
                              </>
                            )}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewMetrics(connection)}
                          >
                            <BarChart3 className="mr-2 h-4 w-4" />
                            View Metrics
                          </Button>
                          
                          <Button
                            size="sm"
                            onClick={() => onSelectConnection(connection)}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Browse Database
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewMetrics(connection)}
                    className="h-8 w-8 p-0"
                    title="View Metrics"
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectConnection(connection)}
                    className="h-8 w-8 p-0"
                    title="Browse Database"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="text-sm text-gray-600">
                {connection.type === 'sqlite' && connection.filePath && (
                  <div className="flex items-center gap-2">
                    <Table className="h-3 w-3" />
                    <span className="font-mono">{connection.filePath}</span>
                  </div>
                )}
                {connection.type === 'libsql' && connection.url && (
                  <div className="flex items-center gap-2">
                    <Database className="h-3 w-3" />
                    <span className="font-mono">{connection.url}</span>
                  </div>
                )}
                {connection.type === 'postgres' && connection.url && (
                  <div className="flex items-center gap-2">
                    <Database className="h-3 w-3" />
                    <span className="font-mono">{connection.url}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
