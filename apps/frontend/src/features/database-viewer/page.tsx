'use client';

import { useState } from 'react';
import { DatabaseBrowser } from './components/DatabaseBrowser';
import { TableViewer } from './components/TableViewer';
import { QueryBuilder } from './components/QueryBuilder';
import { DatabaseMetrics } from './components/DatabaseMetrics';
import { ConnectionManager } from './components/ConnectionManager';
import { TableSchemaViewer } from './components/TableSchemaViewer';
import { DataExporter } from './components/DataExporter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  Table, 
  Terminal, 
  BarChart3,
  ArrowLeft
} from 'lucide-react';
import { type DatabaseConnection } from './api-actions';

type ViewMode = 'browser' | 'tables' | 'query' | 'metrics' | 'connections' | 'schema' | 'export';

export default function DatabaseViewerPage() {
  const [currentView, setCurrentView] = useState<ViewMode>('browser');
  const [selectedConnection, setSelectedConnection] = useState<DatabaseConnection | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const handleSelectConnection = (connection: DatabaseConnection) => {
    setSelectedConnection(connection);
    setCurrentView('tables');
  };

  const handleViewMetrics = (connection: DatabaseConnection) => {
    setSelectedConnection(connection);
    setCurrentView('metrics');
  };

  const handleBack = () => {
    setCurrentView('browser');
    setSelectedConnection(null);
    setSelectedTable(null);
  };

  const handleViewSchema = (connection: DatabaseConnection, tableName: string) => {
    setSelectedConnection(connection);
    setSelectedTable(tableName);
    setCurrentView('schema');
  };

  const handleViewExport = (connection: DatabaseConnection, tableName?: string) => {
    setSelectedConnection(connection);
    setSelectedTable(tableName || null);
    setCurrentView('export');
  };

  const renderCurrentView = () => {
    if (!selectedConnection) {
      switch (currentView) {
        case 'connections':
          return (
            <ConnectionManager 
              onConnectionSelect={handleSelectConnection}
              onConnectionUpdate={() => {}}
            />
          );
        default:
          return (
            <DatabaseBrowser 
              onSelectConnection={handleSelectConnection}
              onViewMetrics={handleViewMetrics}
            />
          );
      }
    }

    switch (currentView) {
      case 'tables':
        return (
          <TableViewer 
            connection={selectedConnection}
            onBack={handleBack}
            onViewSchema={(tableName) => handleViewSchema(selectedConnection, tableName)}
            onViewExport={(tableName) => handleViewExport(selectedConnection, tableName)}
          />
        );
      case 'query':
        return (
          <QueryBuilder 
            connection={selectedConnection}
            onBack={handleBack}
          />
        );
      case 'metrics':
        return (
          <DatabaseMetrics 
            connection={selectedConnection}
            onBack={handleBack}
          />
        );
      case 'schema':
        return selectedTable ? (
          <TableSchemaViewer 
            connection={selectedConnection}
            tableName={selectedTable}
            onBack={handleBack}
          />
        ) : null;
      case 'export':
        return (
          <DataExporter 
            connection={selectedConnection}
            tableName={selectedTable || undefined}
          />
        );
      default:
        return (
          <DatabaseBrowser 
            onSelectConnection={handleSelectConnection}
            onViewMetrics={handleViewMetrics}
          />
        );
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Database className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Database Viewer</h1>
        </div>
        <p className="text-gray-600 text-lg">
          Browse, query, and analyze your database connections
        </p>
      </div>

      <div className="mb-6">
        <Tabs value={currentView} onValueChange={(value) => setCurrentView(value as ViewMode)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="browser" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Browse
            </TabsTrigger>
            <TabsTrigger value="connections" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Connections
            </TabsTrigger>
            {selectedConnection && (
              <>
                <TabsTrigger value="tables" className="flex items-center gap-2">
                  <Table className="h-4 w-4" />
                  Tables
                </TabsTrigger>
                <TabsTrigger value="query" className="flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  Query
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </Tabs>
      </div>

      {renderCurrentView()}
    </div>
  );
}
