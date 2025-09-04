# Feature Development Guide

This guide explains how to add new features to the Universal Productivity Suite.

## Architecture Overview

The application uses a modular, feature-based architecture:

```
src/
├── config/
│   └── features.ts          # Feature registry and configuration
├── shared/
│   ├── components/          # Shared UI components
│   ├── utils/               # Shared utilities
│   ├── types/               # Shared TypeScript types
│   └── hooks/               # Shared React hooks
├── features/
│   ├── finance/             # Finance feature module
│   ├── notes/               # Notes feature module (future)
│   ├── todos/               # Todos feature module (future)
│   └── {feature-name}/      # New feature modules
└── app/
    ├── finance/             # Finance app routes
    ├── notes/               # Notes app routes (future)
    └── {feature-name}/      # New feature routes
```

## Adding a New Feature

### 1. Feature Configuration

First, add your feature to `src/config/features.ts`:

```typescript
// Add to FEATURES object
myNewFeature: {
  id: 'my-new-feature',
  name: 'My Feature',
  description: 'Description of what this feature does',
  icon: MyFeatureIcon, // Lucide React icon
  color: 'blue', // Theme color: emerald, blue, purple, orange, slate
  isEnabled: true, // Set to false for development
  permissions: ['read', 'write'], // Required permissions
  routes: [
    {
      path: '/my-feature',
      label: 'Overview',
      icon: Home,
      exact: true
    },
    {
      path: '/my-feature/settings',
      label: 'Settings',
      icon: Settings
    }
  ],
  metadata: {
    version: '1.0.0',
    author: 'Your Name',
    tags: ['productivity', 'example']
  }
}
```

### 2. Directory Structure

Create the feature directories:

```bash
# Feature module
mkdir -p src/features/my-new-feature/{components,pages,actions,types,utils}

# App routes
mkdir -p src/app/my-feature/{settings}
```

### 3. Feature Module Structure

Create the feature module at `src/features/my-new-feature/`:

```
my-new-feature/
├── index.ts                 # Feature exports
├── types/
│   └── index.ts            # Feature-specific types
├── components/
│   ├── index.ts            # Component exports
│   ├── my-feature-list.tsx # Feature components
│   └── my-feature-form.tsx
├── pages/
│   ├── index.ts            # Page exports  
│   ├── overview-page.tsx   # Page components
│   └── settings-page.tsx
├── actions/
│   └── index.ts            # Server actions
└── utils/
    └── index.ts            # Feature utilities
```

### 4. Create App Routes

Create pages in `src/app/my-feature/`:

```typescript
// src/app/my-feature/page.tsx
import { OverviewPage } from '@/features/my-new-feature/pages/overview-page';

export default OverviewPage;
```

```typescript
// src/app/my-feature/settings/page.tsx  
import { SettingsPage } from '@/features/my-new-feature/pages/settings-page';

export default SettingsPage;
```

### 5. Feature Components

Create feature components following the established patterns:

```typescript
// src/features/my-new-feature/components/my-feature-list.tsx
'use client';

type TProps = {
  items: TMyFeatureItem[];
  onItemClick?: (item: TMyFeatureItem) => void;
};

export function MyFeatureList({ items, onItemClick }: TProps) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div 
          key={item.id}
          className="p-4 bg-white rounded-lg border hover:shadow-sm transition-shadow cursor-pointer"
          onClick={() => onItemClick?.(item)}
        >
          <h3 className="font-medium">{item.name}</h3>
          <p className="text-sm text-gray-600">{item.description}</p>
        </div>
      ))}
    </div>
  );
}
```

### 6. Server Actions (Optional)

If your feature needs server-side functionality:

```typescript
// src/features/my-new-feature/actions/index.ts
'use server';

export async function getMyFeatureItems() {
  // Fetch data from database/API
  return items;
}

export async function createMyFeatureItem(data: TMyFeatureItemInsert) {
  // Create new item
  return newItem;
}
```

### 7. Types

Define feature-specific types:

```typescript
// src/features/my-new-feature/types/index.ts
export type TMyFeatureItem = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type TMyFeatureItemInsert = Omit<TMyFeatureItem, 'id' | 'createdAt' | 'updatedAt'>;
```

## Code Standards

### TypeScript Rules
- Use `type` declarations, never `interface`
- All type names must be prefixed with `T`
- Single non-exported type in a file must be named `TProps`

### Component Rules
- Use `function` declarations, never arrow functions
- Export components with named exports only
- Props type must be called `TProps`
- No default exports except for pages/views

### Functional Programming
- Use pure functions without side effects
- No classes, `extends`, `new`, or `this`
- Prefer composition over inheritance
- Use immutable data patterns

### No Comments
- Code must be self-explanatory
- Use clear, descriptive function and variable names
- Only comment for non-standard or obscure syntax

## Testing

Currently, no testing is required unless specifically requested.

## Example Feature

See the existing `finance` feature for a complete implementation example:
- Configuration: `src/config/features.ts`
- Feature module: `src/features/settings/` (partial example)
- App routes: `src/app/finance/`

## Getting Help

For questions about feature development:
1. Review existing feature implementations
2. Check the shared components in `src/shared/components/`
3. Follow the established patterns and conventions
