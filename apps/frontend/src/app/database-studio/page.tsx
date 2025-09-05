import { ConnectionForm } from '@/features/database-studio/components/ConnectionForm';
import { ConnectionsList } from '@/features/database-studio/components/ConnectionsList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Plus, List } from 'lucide-react';

export default function DatabaseStudioPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Database className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Database Studio</h1>
        </div>
        <p className="text-gray-600 text-lg">
          Connect to and manage your databases directly from the browser
        </p>
      </div>

      <Tabs defaultValue="connections" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="connections" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Connections
          </TabsTrigger>
          <TabsTrigger value="new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Connection
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="mt-6">
          <ConnectionsList />
        </TabsContent>

        <TabsContent value="new" className="mt-6">
          <ConnectionForm />
        </TabsContent>
      </Tabs>

      <div className="mt-12 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">What&apos;s Next?</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Phase 1 (Current)</h4>
            <ul className="text-gray-600 space-y-1">
              <li>✅ Connection management</li>
              <li>✅ Database testing</li>
              <li>✅ Table discovery</li>
              <li>✅ Row browsing</li>
              <li>✅ Query execution</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Phase 2</h4>
            <ul className="text-gray-600 space-y-1">
              <li>🚧 Multi-user workspaces</li>
              <li>🚧 Role-based permissions</li>
              <li>🚧 Audit logs</li>
              <li>🚧 Inline editing</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Phase 3</h4>
            <ul className="text-gray-600 space-y-1">
              <li>🚧 Analytics dashboards</li>
              <li>🚧 Charts and visualizations</li>
              <li>🚧 Performance metrics</li>
              <li>🚧 Alerts and notifications</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}


