'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Database, TestTube, Save } from 'lucide-react';

interface ConnectionFormData {
  name: string;
  type: 'postgres' | 'sqlite' | 'libsql';
  url?: string;
  filePath?: string;
  token?: string;
}

export function ConnectionForm() {
  const [formData, setFormData] = useState<ConnectionFormData>({
    name: '',
    type: 'sqlite'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInputChange = (field: keyof ConnectionFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const testConnection = async () => {
    setIsTesting(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/database-studio/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Connection created successfully! Now testing...' });
        
        // Test the connection
        const testResponse = await fetch(`/api/database-studio/connections/${result.data.id}/connect`, {
          method: 'POST'
        });
        
        const testResult = await testResponse.json();
        
        if (testResult.success) {
          setMessage({ 
            type: 'success', 
            text: `Connection successful! Found ${testResult.info.tables.length} tables.` 
          });
        } else {
          setMessage({ type: 'error', text: `Connection failed: ${testResult.error}` });
        }
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to test connection. Please try again.' });
    } finally {
      setIsTesting(false);
    }
  };

  const saveConnection = async () => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/database-studio/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Connection saved successfully!' });
        setFormData({ name: '', type: 'sqlite' });
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save connection. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const renderConnectionFields = () => {
    switch (formData.type) {
      case 'libsql':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="url">Database URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://your-database.turso.io"
                value={formData.url || ''}
                onChange={(e) => handleInputChange('url', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token">Auth Token</Label>
              <Input
                id="token"
                type="password"
                placeholder="Enter your auth token"
                value={formData.token || ''}
                onChange={(e) => handleInputChange('token', e.target.value)}
                required
              />
            </div>
          </>
        );
      
      case 'sqlite':
        return (
          <div className="space-y-2">
            <Label htmlFor="filePath">Database File Path</Label>
            <Input
              id="filePath"
              type="text"
              placeholder="./database.db or /path/to/database.db"
              value={formData.filePath || ''}
              onChange={(e) => handleInputChange('filePath', e.target.value)}
              required
            />
          </div>
        );
      
      case 'postgres':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="url">Connection String</Label>
              <Input
                id="url"
                type="text"
                placeholder="postgresql://user:password@host:port/database"
                value={formData.url || ''}
                onChange={(e) => handleInputChange('url', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="token">Password (if not in URL)</Label>
              <Input
                id="token"
                type="password"
                placeholder="Enter password if not in connection string"
                value={formData.token || ''}
                onChange={(e) => handleInputChange('token', e.target.value)}
              />
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          New Database Connection
        </CardTitle>
        <CardDescription>
          Connect to your database and start exploring your data
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Connection Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="My Production Database"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Database Type</Label>
          <Select value={formData.type} onValueChange={(value: any) => handleInputChange('type', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sqlite">SQLite</SelectItem>
              <SelectItem value="libsql">LibSQL / Turso</SelectItem>
              <SelectItem value="postgres">PostgreSQL (Coming Soon)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {renderConnectionFields()}

        {message && (
          <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3">
          <Button
            onClick={testConnection}
            disabled={isTesting || isLoading || !formData.name}
            variant="outline"
            className="flex-1"
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <TestTube className="mr-2 h-4 w-4" />
                Test Connection
              </>
            )}
          </Button>
          
          <Button
            onClick={saveConnection}
            disabled={isLoading || isTesting || !formData.name}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Connection
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


