# Next.js Architecture for Categories Migration

## Architecture Overview

The Categories module will follow a clean, layer-based architecture that aligns with the project's functional programming and type safety principles.

```
Frontend (Next.js App Router)
├── app/
│   ├── finance/
│   │   └── categories/
│   │       ├── page.tsx                 # Page (returns view only)
│   │       ├── actions.ts               # Server Actions (mutations)
│   │       ├── reads.ts                 # Server-only reads  
│   │       └── validation.ts            # Zod schemas
│   └── api/                             # Optional compatibility layer
│       └── categories/
│           ├── route.ts                 # GET list, POST create
│           └── [id]/
│               └── route.ts             # GET, PATCH, DELETE
├── views/
│   └── categories-view.tsx              # Main UI composition
└── lib/
    ├── db/
    │   ├── schema/
    │   │   └── categories.ts            # Drizzle schema definition
    │   └── factories/
    │       └── create-categories-repository.ts  # Repository factory
    ├── types/
    │   └── categories.ts                # Shared types
    └── auth/                            # Authentication & authorization
        ├── get-current-user.ts
        └── authorize.ts
```

## Layer Responsibilities

### 1. Database Layer (lib/db/)

**Schema Definition** (`lib/db/schema/categories.ts`)
- Drizzle table definition
- Type exports for Insert/Select operations
- Database constraints and indexes

**Repository Factory** (`lib/db/factories/create-categories-repository.ts`)
- Pure functional factory pattern
- CRUD operations with Drizzle query builder
- No business logic, only data access
- Transaction-aware operations

### 2. Type System (lib/types/)

**Category Types** (`lib/types/categories.ts`)
- Base entity types (TTimestamps, TBaseEntity)
- Category entity type (TCategory)
- Input types (TCreateCategoryInput, TUpdateCategoryInput)
- Filter types (TCategoryFilters)
- All following T-prefix naming convention

### 3. Server Actions Layer (app/finance/categories/)

**Mutations** (`actions.ts`)
- Server actions for create, update, delete operations
- Server-only imports to prevent client bundling
- Authentication and authorization guards
- Input validation with Zod
- Cache invalidation with revalidateTag

**Reads** (`reads.ts`)
- Server-only read functions for RSC usage
- Caching with Next.js cache and tags
- Authorization for sensitive data
- Optimized queries for common patterns

**Validation** (`validation.ts`)
- Zod schemas for all input types
- Input transformations and normalization
- Error handling for validation failures

### 4. Authentication & Authorization (lib/auth/)

**Session Management** (`get-current-user.ts`)
- Server-only user session retrieval
- Type-safe user context
- Error handling for unauthenticated requests

**Authorization** (`authorize.ts`)
- Permission-based access control
- Resource-level authorization
- Clear error messages for denied access

### 5. UI Layer (views/ and app/)

**View Component** (`views/categories-view.tsx`)
- Main UI composition and state management
- Form handling with server actions
- Optimistic UI updates
- Error boundaries and loading states

**Page Component** (`app/finance/categories/page.tsx`)
- Simple wrapper that returns the view
- Server component data fetching
- No business logic per project rules

### 6. API Compatibility Layer (app/api/categories/)

**Optional HTTP Endpoints**
- Maintain backward compatibility during transition
- Reuse validation and repository layers
- Deprecation headers and logging
- Gradual sunset plan

## Data Flow Patterns

### Create Category Flow

```typescript
// 1. User submits form in categories-view.tsx
<form action={createCategoryAction}>
  <input name="name" required />
  <select name="type" required>
    <option value="income">Income</option>
    <option value="expense">Expense</option>
  </select>
  <button type="submit">Create</button>
</form>

// 2. Server action in actions.ts
export async function createCategoryAction(formData: FormData) {
  // Guard: Authentication & authorization
  const user = await getCurrentUser();
  await authorize(user, 'categories:create');
  
  // Validate: Parse and validate input
  const input = createCategorySchema.parse({
    name: formData.get('name'),
    type: formData.get('type'),
  });
  
  // Execute: Repository operation
  const repository = createCategoriesRepository(getDb());
  const category = await repository.create(input);
  
  // Invalidate: Clear cache
  revalidateTag('categories:list');
  
  // Return: Created entity
  return category;
}

// 3. Repository factory in create-categories-repository.ts
export function createCategoriesRepository(db) {
  return {
    async create(input: TCreateCategoryInput) {
      return await db
        .insert(categoriesSchema)
        .values({
          ...input,
          color: input.color || '#3B82F6',
          icon: input.icon || '💰',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
    }
  };
}
```

### Read Categories Flow

```typescript
// 1. Server component in page.tsx
export default async function CategoriesPage() {
  const categories = await listCategories();
  return <CategoriesView initialCategories={categories} />;
}

// 2. Server-only read function in reads.ts
export async function listCategories(filters?: TCategoryFilters) {
  const repository = createCategoriesRepository(getDb());
  return await repository.list(filters);
}

// 3. Repository with caching
export function createCategoriesRepository(db) {
  return {
    async list(filters: TCategoryFilters = {}) {
      const query = db.select().from(categoriesSchema);
      
      if (filters.type) {
        query.where(eq(categoriesSchema.type, filters.type));
      }
      
      if (filters.limit) {
        query.limit(filters.limit);
      }
      
      return await query;
    }
  };
}
```

## Caching Strategy

### Cache Tags
- `categories:list` - for all list queries
- `category:{id}` - for individual category queries
- `categories:type:{type}` - for type-filtered lists

### Invalidation Points
- Create category: invalidate `categories:list`
- Update category: invalidate `category:{id}` and `categories:list`
- Delete category: invalidate `category:{id}` and `categories:list`

### Cache Configuration
```typescript
// Server-only read with caching
export async function readCategory(id: number) {
  return unstable_cache(
    async () => {
      const repository = createCategoriesRepository(getDb());
      return await repository.read(id);
    },
    [`category:${id}`],
    {
      tags: [`category:${id}`],
      revalidate: 3600, // 1 hour
    }
  )();
}
```

## Error Handling Strategy

### Typed Error System
```typescript
// Domain error types
type TCategoryError = 
  | { type: 'validation'; message: string; field?: string }
  | { type: 'not_found'; id: number }
  | { type: 'duplicate_name'; name: string }
  | { type: 'unauthorized'; operation: string }
  | { type: 'unknown'; message: string };

// Error boundary in views
function CategoriesErrorBoundary({ error }: { error: TCategoryError }) {
  switch (error.type) {
    case 'validation':
      return <ValidationError message={error.message} field={error.field} />;
    case 'not_found':
      return <NotFoundError entityType="Category" id={error.id} />;
    // ... other cases
  }
}
```

### Server Action Error Handling
```typescript
export async function createCategoryAction(formData: FormData) {
  try {
    // ... implementation
  } catch (error) {
    if (error instanceof ZodError) {
      throw { type: 'validation', message: error.message };
    }
    
    if (error.code === 'UNIQUE_CONSTRAINT_FAILED') {
      throw { type: 'duplicate_name', name: formData.get('name') };
    }
    
    throw { type: 'unknown', message: error.message };
  }
}
```

## Performance Considerations

### Database Indexes
```sql
-- Primary access patterns
CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_categories_is_demo ON categories(is_demo);
CREATE INDEX idx_categories_type_demo ON categories(type, is_demo);
```

### Query Optimization
- Use select() with specific fields for large lists
- Implement proper pagination with offset/limit
- Consider cursor-based pagination for very large datasets
- Monitor query performance with EXPLAIN QUERY PLAN

### Client-Side Optimizations
- Server components for initial data loading
- Optimistic UI updates for mutations
- Progressive enhancement for form submissions
- Error boundaries for graceful degradation

## Security Implementation

### Authentication Guards
```typescript
// Server-only authentication check
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw { type: 'unauthorized', operation: 'access' };
  }
  return user;
}
```

### Authorization Patterns
```typescript
// Resource-level authorization
export async function authorize(user: TUser, operation: string) {
  const permissions = await getUserPermissions(user.id);
  if (!permissions.includes(operation)) {
    throw { type: 'unauthorized', operation };
  }
}
```

### Input Sanitization
```typescript
// Zod schema with sanitization
const createCategorySchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .refine(name => !/<script/i.test(name), 'Invalid characters'),
  type: z.enum(['income', 'expense']),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Invalid color format')
    .optional()
    .default('#3B82F6'),
});
```

## Migration Transition

### Feature Flag Implementation
```typescript
// Environment-based feature flag
const USE_NEXT_ACTIONS = process.env.USE_NEXT_CATEGORIES === 'true';

// Conditional routing in components
function CategoriesView() {
  const actions = USE_NEXT_ACTIONS 
    ? useNextCategoriesActions() 
    : useHonoCategoriesActions();
    
  // ... component implementation
}
```

### Dual-Run Verification
```typescript
// Shadow mode for comparison
export async function createCategoryWithValidation(input: TCreateCategoryInput) {
  // Create via Next.js action
  const nextResult = await createCategoryAction(input);
  
  // Also create via Hono API for comparison (development only)
  if (process.env.NODE_ENV === 'development') {
    const honoResult = await fetch('/api/categories', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    
    // Log any differences for analysis
    compareResults(nextResult, await honoResult.json());
  }
  
  return nextResult;
}
```

## Observability & Monitoring

### Structured Logging
```typescript
import { logger } from '@/lib/logger';

export async function createCategoryAction(formData: FormData) {
  const startTime = Date.now();
  
  try {
    const result = await repository.create(input);
    
    logger.info('Category created', {
      action: 'create_category',
      categoryId: result.id,
      userId: user.id,
      duration: Date.now() - startTime,
    });
    
    return result;
  } catch (error) {
    logger.error('Category creation failed', {
      action: 'create_category',
      userId: user.id,
      error: error.message,
      duration: Date.now() - startTime,
    });
    
    throw error;
  }
}
```

### Performance Metrics
- Server action execution time
- Database query performance
- Cache hit ratios
- Error rates by operation type

---

**Architecture Status**: Complete and Ready for Implementation  
**Compliance**: ✅ Follows all project rules and constraints  
**Migration Path**: ✅ Clear transition from Hono to Next.js actions
