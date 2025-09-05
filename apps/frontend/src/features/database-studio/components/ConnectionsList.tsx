'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Star, 
  StarOff, 
  Edit, 
  Trash2, 
  Play, 
  Loader2,
  ExternalLink,
  FileText,
  Globe
} from 'lucide-react';

interface Connection {
  id: string;
  name: string;
  type: 'postgres' | 'sqlite' | 'libsql';
  url?: string;
  filePath?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export function ConnectionsList() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/database-studio/connections');
      const result = await response.json();
      
      if (result.success) {
        setConnections(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Failed to fetch connections');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (id: string) => {
    try {
      const response = await fetch(`/api/database-studio/connections/${id}/favorite`, {
        method: 'PATCH'
      });
      
      const result = await response.json();
      
      if (result.success) {
        setConnections(prev => 
          prev.map(conn => 
            conn.id === id 
              ? { ...conn, isFavorite: !conn.isFavorite }
              : conn
          )
        );
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const deleteConnection = async (id: string) => {
    if (!confirm('Are you sure you want to delete this connection?')) {
      return;
    }

    try {
      const response = await fetch(`/api/database-studio/connections/${id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        setConnections(prev => prev.filter(conn => conn.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete connection:', error);
    }
  };

  const connectToDatabase = async (id: string) => {
    setConnecting(id);
    try {
      const response = await fetch(`/api/database-studio/connections/${id}/connect`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`Connected successfully! Found ${result.info.tables.length} tables.`);
        // In a real app, you'd navigate to the database studio view
      } else {
        alert(`Connection failed: ${result.error}`);
      }
    } catch (error) {
      alert('Failed to connect to database');
    } finally {
      setConnecting(null);
    }
  };

  const getDatabaseIcon = (type: string) => {
    switch (type) {
      case 'sqlite':
        return <FileText className="h-4 w-4" />;
      case 'libsql':
        return <Globe className="h-4 w-4" />;
      case 'postgres':
        return <Database className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading connections...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertDescription className="text-red-800">
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (connections.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No connections yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first database connection to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Database Connections</h2>
      
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFavorite(connection.id)}
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
                    onClick={() => connectToDatabase(connection.id)}
                    disabled={connecting === connection.id}
                    className="h-8 w-8 p-0"
                  >
                    {connecting === connection.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteConnection(connection.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="text-sm text-gray-600">
                {connection.type === 'sqlite' && connection.filePath && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-3 w-3" />
                    <span className="font-mono">{connection.filePath}</span>
                  </div>
                )}
                {connection.type === 'libsql' && connection.url && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-3 w-3" />
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


