'use client';

import { CodeBlock } from './code-block';
import { Card, CardContent, CardHeader } from './card';
import { Badge } from './badge';
import { Clock, CheckCircle, XCircle, AlertCircle, Database } from 'lucide-react';

type TResponseStatus = 'success' | 'error' | 'warning';

type TProps = {
  response: string;
  status: TResponseStatus;
  statusCode?: number;
  language?: 'json' | 'xml' | 'text' | 'sql';
  timestamp?: Date;
  executionTime?: number;
  theme?: 'light' | 'dark';
  showMetadata?: boolean;
  rowCount?: number;
  className?: string;
};

export function ResponseDisplay({
  response,
  status,
  statusCode,
  language = 'json',
  timestamp = new Date(),
  executionTime,
  theme = 'light',
  showMetadata = true,
  rowCount,
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

  function getStatusIcon() {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />;
    }
  }

  function getStatusColors() {
    switch (status) {
      case 'success':
        return 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800';
    }
  }

  function getStatusBadgeColors() {
    switch (status) {
      case 'success':
        return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
      case 'error':
        return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300';
    }
  }

  return (
    <Card className={`${getStatusColors()} ${className}`}>
      {showMetadata && (
        <CardHeader className="pb-3 space-y-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <Badge variant="secondary" className={`text-xs ${getStatusBadgeColors()}`}>
                Response
              </Badge>
              <Badge variant="outline" className="text-xs">
                {language.toUpperCase()}
              </Badge>
              {statusCode && (
                <Badge variant="outline" className="text-xs">
                  {statusCode}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              {rowCount !== undefined && (
                <div className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  <span>{rowCount} row{rowCount !== 1 ? 's' : ''}</span>
                </div>
              )}
              
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
          code={response}
          language={language}
          theme={theme}
          maxHeight="400px"
          wrapLines={true}
          className="border-none"
        />
      </CardContent>
    </Card>
  );
}
