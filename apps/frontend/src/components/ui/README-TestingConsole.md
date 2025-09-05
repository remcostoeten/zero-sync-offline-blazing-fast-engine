# Testing Console Components

A comprehensive set of React components for displaying queries and responses with syntax highlighting, proper overflow handling, and professional styling.

## Components

### TestingConsole

The main container component that displays a list of queries and responses with proper scrolling and overflow handling.

**Features:**
- ✅ Syntax highlighting for multiple languages (SQL, GraphQL, JavaScript, JSON, XML)
- ✅ Copy-to-clipboard functionality with visual feedback
- ✅ Proper overflow handling with custom scrollbars
- ✅ Auto-scroll to newest entries
- ✅ Light/dark theme support
- ✅ Export functionality
- ✅ Clear console functionality
- ✅ Responsive design
- ✅ TypeScript support with strict typing

**Props:**
```typescript
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
```

**Usage:**
```tsx
import { TestingConsole } from '@/components/ui/testing-console';

function MyComponent() {
  const [entries, setEntries] = useState<TConsoleEntry[]>([]);
  
  return (
    <TestingConsole
      entries={entries}
      theme="light"
      maxHeight="600px"
      onClear={() => setEntries([])}
      onExport={exportToFile}
    />
  );
}
```

### CodeBlock

A reusable component for displaying code with syntax highlighting and copy functionality.

**Props:**
```typescript
type TProps = {
  code: string;
  language?: string;
  theme?: 'light' | 'dark';
  maxHeight?: string;
  showLineNumbers?: boolean;
  showCopyButton?: boolean;
  wrapLines?: boolean;
  className?: string;
};
```

### QueryDisplay

Specialized component for displaying executed queries with metadata.

**Props:**
```typescript
type TProps = {
  query: string;
  language?: 'sql' | 'graphql' | 'javascript' | 'json';
  timestamp?: Date;
  executionTime?: number;
  theme?: 'light' | 'dark';
  showMetadata?: boolean;
  className?: string;
};
```

### ResponseDisplay

Specialized component for displaying API/query responses with status indicators.

**Props:**
```typescript
type TProps = {
  response: string;
  status: 'success' | 'error' | 'warning';
  statusCode?: number;
  language?: 'json' | 'xml' | 'text' | 'sql';
  timestamp?: Date;
  executionTime?: number;
  theme?: 'light' | 'dark';
  showMetadata?: boolean;
  rowCount?: number;
  className?: string;
};
```

## Entry Types

The `TestingConsole` accepts an array of entries with this structure:

```typescript
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
```

## Example Entry Creation

### SQL Query Entry
```typescript
const sqlQueryEntry: TConsoleEntry = {
  id: 'sql-1',
  type: 'query',
  query: {
    content: 'SELECT * FROM users WHERE active = true;',
    language: 'sql',
    executionTime: 150
  },
  timestamp: new Date()
};
```

### API Response Entry
```typescript
const apiResponseEntry: TConsoleEntry = {
  id: 'api-response-1',
  type: 'response',
  response: {
    content: JSON.stringify({ success: true, data: [] }, null, 2),
    status: 'success',
    statusCode: 200,
    language: 'json',
    executionTime: 85,
    rowCount: 0
  },
  timestamp: new Date()
};
```

### Error Response Entry
```typescript
const errorResponseEntry: TConsoleEntry = {
  id: 'error-1',
  type: 'response',
  response: {
    content: JSON.stringify({
      error: {
        code: 'TABLE_NOT_FOUND',
        message: 'Table "users" does not exist'
      }
    }, null, 2),
    status: 'error',
    statusCode: 400,
    language: 'json',
    executionTime: 45
  },
  timestamp: new Date()
};
```

## Styling & Overflow Handling

The components include comprehensive CSS for handling overflow scenarios:

- **Container Scrolling**: Fixed height containers with smooth vertical scrolling
- **Horizontal Code Overflow**: Code blocks that scroll horizontally for long lines
- **Custom Scrollbars**: Thin, themed scrollbars that work in light/dark modes
- **Responsive Design**: Adapts to different screen sizes
- **Theme Support**: Seamless switching between light and dark themes

## Dependencies

Make sure to install the required dependencies:

```bash
bun add react-syntax-highlighter @types/react-syntax-highlighter
```

## Demo

Visit `/testing-console-demo` to see an interactive demo with various examples including:
- SQL queries with results
- API requests and responses  
- GraphQL queries
- Error scenarios
- Theme switching

## Design System Integration

The components follow your existing design system:
- Uses TProps naming convention for TypeScript types
- Follows functional programming patterns
- No arrow function constants
- Consistent spacing and typography
- Integrates with existing UI components (Card, Button, Badge, etc.)

<citations>
<document>
<document_type>RULE</document_type>
<document_id>C6hew6tpot5EZ5Rbf30pQh</document_id>
</document>
<document>
<document_type>RULE</document_type>
<document_id>G3cVTjzX1twujMTVyHqmIY</document_id>
</document>
<document>
<document_type>RULE</document_type>
<document_id>fAq7fExYqHSboSFsqsCPOL</document_id>
</document>
</citations>
