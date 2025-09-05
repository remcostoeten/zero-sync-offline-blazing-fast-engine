'use client';

import { useState } from 'react';
import { TestingConsole } from '@/components/ui/testing-console';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Play, RotateCcw, Palette } from 'lucide-react';

type TConsoleEntry = {
  id: string;
  type: 'query' | 'response';
  query?: {
    content: string;
    language?: 'sql' | 'graphql' | 'javascript' | 'json';
    executionTime?: number;
  };
  response?: {
    content: string;
    status: 'success' | 'error' | 'warning';
    statusCode?: number;
    language?: 'json' | 'xml' | 'text' | 'sql';
    executionTime?: number;
    rowCount?: number;
  };
  timestamp: Date;
};

export default function TestingConsoleDemoPage() {
  const [entries, setEntries] = useState<TConsoleEntry[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  function addSampleSqlQuery() {
    const id = Math.random().toString(36).substr(2, 9);
    const baseTimestamp = new Date();
    
    const newEntries: TConsoleEntry[] = [
      {
        id: id + '-query',
        type: 'query',
        query: {
          content: `SELECT u.name, u.email, COUNT(o.id) as order_count, SUM(o.total) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at >= '2024-01-01'
  AND u.status = 'active'
GROUP BY u.id, u.name, u.email
HAVING COUNT(o.id) > 0
ORDER BY total_spent DESC
LIMIT 10;`,
          language: 'sql',
          executionTime: Math.floor(Math.random() * 500) + 50
        },
        timestamp: baseTimestamp
      },
      {
        id: id + '-response',
        type: 'response',
        response: {
          content: JSON.stringify([
            {
              "name": "John Doe",
              "email": "john@example.com",
              "order_count": 15,
              "total_spent": "2,450.50"
            },
            {
              "name": "Jane Smith",
              "email": "jane@example.com",
              "order_count": 12,
              "total_spent": "1,890.25"
            },
            {
              "name": "Mike Johnson",
              "email": "mike@example.com",
              "order_count": 8,
              "total_spent": "1,234.75"
            }
          ], null, 2),
          status: 'success',
          statusCode: 200,
          language: 'json',
          executionTime: Math.floor(Math.random() * 500) + 50,
          rowCount: 3
        },
        timestamp: new Date(baseTimestamp.getTime() + 200)
      }
    ];

    setEntries(prev => [...prev, ...newEntries]);
  }

  function addSampleApiQuery() {
    const id = Math.random().toString(36).substr(2, 9);
    const baseTimestamp = new Date();
    
    const newEntries: TConsoleEntry[] = [
      {
        id: id + '-query',
        type: 'query',
        query: {
          content: `fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIs...'
  },
  body: JSON.stringify({
    name: 'New User',
    email: 'newuser@example.com',
    role: 'customer'
  })
})`,
          language: 'javascript',
          executionTime: Math.floor(Math.random() * 200) + 100
        },
        timestamp: baseTimestamp
      },
      {
        id: id + '-response',
        type: 'response',
        response: {
          content: JSON.stringify({
            "success": true,
            "data": {
              "id": 123,
              "name": "New User",
              "email": "newuser@example.com",
              "role": "customer",
              "created_at": "2024-01-15T10:30:00Z",
              "updated_at": "2024-01-15T10:30:00Z"
            },
            "message": "User created successfully"
          }, null, 2),
          status: 'success',
          statusCode: 201,
          language: 'json',
          executionTime: Math.floor(Math.random() * 200) + 100
        },
        timestamp: new Date(baseTimestamp.getTime() + 150)
      }
    ];

    setEntries(prev => [...prev, ...newEntries]);
  }

  function addSampleErrorQuery() {
    const id = Math.random().toString(36).substr(2, 9);
    const baseTimestamp = new Date();
    
    const newEntries: TConsoleEntry[] = [
      {
        id: id + '-query',
        type: 'query',
        query: {
          content: `SELECT * FROM non_existent_table 
WHERE invalid_column = 'some_value';`,
          language: 'sql',
          executionTime: 45
        },
        timestamp: baseTimestamp
      },
      {
        id: id + '-response',
        type: 'response',
        response: {
          content: JSON.stringify({
            "error": {
              "code": "42P01",
              "message": "relation \"non_existent_table\" does not exist",
              "detail": "The table 'non_existent_table' was not found in the current database schema.",
              "hint": "Check if the table name is spelled correctly and exists in your database.",
              "position": "15"
            }
          }, null, 2),
          status: 'error',
          statusCode: 400,
          language: 'json',
          executionTime: 45
        },
        timestamp: new Date(baseTimestamp.getTime() + 45)
      }
    ];

    setEntries(prev => [...prev, ...newEntries]);
  }

  function addSampleGraphQLQuery() {
    const id = Math.random().toString(36).substr(2, 9);
    const baseTimestamp = new Date();
    
    const newEntries: TConsoleEntry[] = [
      {
        id: id + '-query',
        type: 'query',
        query: {
          content: `query GetUserPosts($userId: ID!, $limit: Int = 10) {
  user(id: $userId) {
    id
    name
    email
    posts(limit: $limit) {
      edges {
        node {
          id
          title
          content
          publishedAt
          tags {
            name
            color
          }
          commentCount
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
}`,
          language: 'graphql',
          executionTime: Math.floor(Math.random() * 300) + 80
        },
        timestamp: baseTimestamp
      },
      {
        id: id + '-response',
        type: 'response',
        response: {
          content: JSON.stringify({
            "data": {
              "user": {
                "id": "user_123",
                "name": "Alice Cooper",
                "email": "alice@example.com",
                "posts": {
                  "edges": [
                    {
                      "node": {
                        "id": "post_456",
                        "title": "Getting Started with GraphQL",
                        "content": "GraphQL is a powerful query language...",
                        "publishedAt": "2024-01-10T14:30:00Z",
                        "tags": [
                          { "name": "GraphQL", "color": "#e91e63" },
                          { "name": "API", "color": "#2196f3" }
                        ],
                        "commentCount": 24
                      }
                    }
                  ],
                  "pageInfo": {
                    "hasNextPage": true,
                    "endCursor": "cursor_abc123"
                  }
                }
              }
            }
          }, null, 2),
          status: 'success',
          statusCode: 200,
          language: 'json',
          executionTime: Math.floor(Math.random() * 300) + 80,
          rowCount: 1
        },
        timestamp: new Date(baseTimestamp.getTime() + 180)
      }
    ];

    setEntries(prev => [...prev, ...newEntries]);
  }

  function clearConsole() {
    setEntries([]);
  }

  function exportConsole() {
    const data = {
      exported_at: new Date().toISOString(),
      entries: entries,
      total_entries: entries.length
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `console-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Testing Console Demo</h1>
        <p className="text-gray-600 text-lg">
          Interactive demo of the TestingConsole component with syntax highlighting and proper overflow handling.
        </p>
      </div>

      <Tabs defaultValue="demo" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="demo">Interactive Demo</TabsTrigger>
          <TabsTrigger value="examples">Usage Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="demo" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Demo Controls
                  </CardTitle>
                  <CardDescription>
                    Add sample queries and responses to test the console
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={addSampleSqlQuery} 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    Add SQL Query
                  </Button>
                  <Button 
                    onClick={addSampleApiQuery} 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    Add API Request
                  </Button>
                  <Button 
                    onClick={addSampleErrorQuery} 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    Add Error Response
                  </Button>
                  <Button 
                    onClick={addSampleGraphQLQuery} 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    Add GraphQL Query
                  </Button>
                  
                  <div className="pt-2 border-t">
                    <Button 
                      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                    >
                      <Palette className="h-4 w-4 mr-2" />
                      Switch to {theme === 'light' ? 'Dark' : 'Light'} Theme
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">✓</Badge>
                      Syntax highlighting for multiple languages
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">✓</Badge>
                      Copy-to-clipboard functionality
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">✓</Badge>
                      Proper overflow and scrolling
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">✓</Badge>
                      Auto-scroll to newest entries
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">✓</Badge>
                      Light/dark theme support
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">✓</Badge>
                      Export functionality
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <TestingConsole
                entries={entries}
                theme={theme}
                maxHeight="700px"
                title="SQL & API Testing Console"
                onClear={clearConsole}
                onExport={exportConsole}
                className="h-full"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="examples" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Usage</CardTitle>
                <CardDescription>
                  Import and use the TestingConsole component in your applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <pre><code>{`import { TestingConsole } from '@/components/ui/testing-console';

function MyComponent() {
  const [entries, setEntries] = useState([]);
  
  return (
    <TestingConsole
      entries={entries}
      theme="light"
      maxHeight="600px"
      onClear={() => setEntries([])}
      onExport={() => {/* export logic */}}
    />
  );
}`}</code></pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Entry Types</CardTitle>
                <CardDescription>
                  Examples of different entry types and their structure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <pre><code>{`// Query Entry
const queryEntry = {
  id: 'unique-id-1',
  type: 'query',
  query: {
    content: 'SELECT * FROM users;',
    language: 'sql',
    executionTime: 150
  },
  timestamp: new Date()
};

// Response Entry
const responseEntry = {
  id: 'unique-id-2',
  type: 'response',
  response: {
    content: JSON.stringify(data, null, 2),
    status: 'success',
    statusCode: 200,
    language: 'json',
    executionTime: 150,
    rowCount: 42
  },
  timestamp: new Date()
};`}</code></pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
