'use client';

import { CodeBlock } from './code-block';
import { Card, CardContent, CardHeader } from './card';
import { Badge } from './badge';
import { Clock, Play } from 'lucide-react';

type TProps = {
  query: string;
  language?: 'sql' | 'graphql' | 'javascript' | 'json';
  timestamp?: Date;
  executionTime?: number;
  theme?: 'light' | 'dark';
  showMetadata?: boolean;
  className?: string;
};

export function QueryDisplay({
  query,
  language = 'sql',
  timestamp = new Date(),
  executionTime,
  theme = 'light',
  showMetadata = true,
  className = ''
}: TProps) {
  function formatTimestamp(date: Date) {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  }

  function formatExecutionTime(timeMs?: number) {
    if (!timeMs) return null;
    
    if (timeMs < 1000) {
      return `${timeMs}ms`;
    }
    
    return `${(timeMs / 1000).toFixed(2)}s`;
  }

  return (
    <Card className={`bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 ${className}`}>
      {showMetadata && (
        <CardHeader className="pb-3 space-y-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                Query
              </Badge>
              <Badge variant="outline" className="text-xs">
                {language.toUpperCase()}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              {executionTime !== undefined && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatExecutionTime(executionTime)}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatTimestamp(timestamp)}</span>
              </div>
            </div>
          </div>
        </CardHeader>
      )}
      
      <CardContent className={showMetadata ? 'pt-0' : ''}>
        <CodeBlock
          code={query}
          language={language}
          theme={theme}
          maxHeight="300px"
          wrapLines={true}
          className="border-none"
        />
      </CardContent>
    </Card>
  );
}
