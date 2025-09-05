'use client';

import { useRef, useEffect } from 'react';
import { QueryDisplay } from './query-display';
import { ResponseDisplay } from './response-display';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { ScrollArea } from './scroll-area';
import { Terminal, Trash2, Download } from 'lucide-react';
import { Button } from './button';

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

type TProps = {
  entries: TConsoleEntry[];
  theme?: 'light' | 'dark';
  maxHeight?: string;
  autoScroll?: boolean;
  showMetadata?: boolean;
  title?: string;
  onClear?: () => void;
  onExport?: () => void;
  className?: string;
};

export function TestingConsole({
  entries,
  theme = 'light',
  maxHeight = '600px',
  autoScroll = true,
  showMetadata = true,
  title = 'Testing Console',
  onClear,
  onExport,
  className = ''
}: TProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [entries, autoScroll]);

  function renderEntry(entry: TConsoleEntry) {
    if (entry.type === 'query' && entry.query) {
      return (
        <QueryDisplay
          key={`${entry.id}-query`}
          query={entry.query.content}
          language={entry.query.language}
          timestamp={entry.timestamp}
          executionTime={entry.query.executionTime}
          theme={theme}
          showMetadata={showMetadata}
        />
      );
    }

    if (entry.type === 'response' && entry.response) {
      return (
        <ResponseDisplay
          key={`${entry.id}-response`}
          response={entry.response.content}
          status={entry.response.status}
          statusCode={entry.response.statusCode}
          language={entry.response.language}
          timestamp={entry.timestamp}
          executionTime={entry.response.executionTime}
          rowCount={entry.response.rowCount}
          theme={theme}
          showMetadata={showMetadata}
        />
      );
    }

    return null;
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <CardTitle className="text-lg">{title}</CardTitle>
            {entries.length > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({entries.length} {entries.length === 1 ? 'entry' : 'entries'})
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {onExport && entries.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onExport}
                className="h-8 px-2"
                title="Export console logs"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            
            {onClear && entries.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                title="Clear console"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div 
          className="relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50/50 dark:bg-gray-900/50"
          style={{ height: maxHeight }}
        >
          <ScrollArea 
            ref={scrollAreaRef}
            className="h-full w-full"
          >
            <div className="p-4 space-y-4">
              {entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center text-gray-500 dark:text-gray-400">
                  <Terminal className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No console entries yet</p>
                  <p className="text-xs">Queries and responses will appear here</p>
                </div>
              ) : (
                <>
                  {entries.map(renderEntry)}
                  <div ref={bottomRef} aria-hidden="true" />
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
