# Categories Data Model & Constraints

## Current Data Model Analysis

### Database Schema (Drizzle/SQLite)

```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  synced INTEGER DEFAULT 0,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT '💰',
  is_demo INTEGER DEFAULT 0 NOT NULL
);
```

### Entity Type Definitions

```typescript
// Base types (from shared/types/index.ts)
type TTimestamps = {
  createdAt: Date;
  updatedAt: Date;
};

type TBaseEntity = {
  id: number;
} & TTimestamps;

// Current Category entity (from backend schema)
type TCategory = TBaseEntity & {
  name: string;           // Required, unique
  type: 'income' | 'expense'; // Required enum
  color: string;          // Optional, defaults to '#3B82F6'
  icon: string;           // Optional, defaults to '💰'
  isDemo: boolean;        // Required, defaults to false
  synced: boolean;        // Optional, defaults to false
};

// Input types for operations
type TCategoryInsert = Omit<TCategory, 'id' | 'createdAt' | 'updatedAt'>;
type TCategorySelect = TCategory;
```

## Data Constraints Analysis

### Database-Level Constraints

1. **Primary Key**
   - `id` is auto-incrementing integer primary key
   - Unique across all categories

2. **Uniqueness Constraints**
   - `name` must be unique across all categories
   - No duplicate category names allowed

3. **Null Constraints**
   - `name` is NOT NULL
   - `type` is NOT NULL  
   - `is_demo` is NOT NULL
   - `created_at` is NOT NULL
   - `updated_at` is NOT NULL

4. **Check Constraints**
   - `type` must be either 'income' or 'expense'

5. **Default Values**
   - `color` defaults to '#3B82F6' (blue)
   - `icon` defaults to '💰' (money emoji)
   - `synced` defaults to false (0)
   - `is_demo` defaults to false (0)
   - `created_at` defaults to current timestamp
   - `updated_at` defaults to current timestamp

### Application-Level Constraints

1. **Name Constraints**
   - Must be non-empty string
   - Recommended max length: 100 characters
   - Should be trimmed of leading/trailing whitespace
   - Case-sensitive uniqueness

2. **Type Constraints**
   - Strict enum: 'income' | 'expense'
   - No other values accepted

3. **Color Constraints**
   - Must be valid hex color format: /^#[0-9A-F]{6}$/i
   - Case-insensitive hex validation
   - Defaults to blue if not provided

4. **Icon Constraints**
   - Single emoji or short text representation
   - Recommended max length: 10 characters
   - UTF-8 emoji support required

5. **Boolean Constraints**
   - `isDemo` and `synced` must be proper boolean values
   - SQLite stores as INTEGER 0/1

## Migration Target Model

### Enhanced Type System (Following Project Rules)

```typescript
// Base types following project rules
type TTimestamps = {
  createdAt: Date;
  updatedAt: Date;
};

type TBaseEntity = {
  id: number;
} & TTimestamps;

// Enhanced category entity
type TCategory = TBaseEntity & {
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  isDemo: boolean;
  synced: boolean;
};

// Input types for create operations
type TCreateCategoryInput = {
  name: string;
  type: 'income' | 'expense';
  color?: string;
  icon?: string;
  isDemo?: boolean;
};

// Input types for update operations  
type TUpdateCategoryInput = {
  id: number;
  name?: string;
  type?: 'income' | 'expense';
  color?: string;
  icon?: string;
  isDemo?: boolean;
};

// Query filter types
type TCategoryFilters = {
  type?: 'income' | 'expense';
  isDemo?: boolean;
  limit?: number;
  offset?: number;
};
```

## Data Examples

### Valid Records

```typescript
// Valid category examples
const validCategories: TCategory[] = [
  {
    id: 1,
    name: "Salary",
    type: "income",
    color: "#22C55E",
    icon: "💵",
    isDemo: false,
    synced: true,
    createdAt: new Date("2025-01-01T10:00:00Z"),
    updatedAt: new Date("2025-01-01T10:00:00Z")
  },
  {
    id: 2,
    name: "Groceries", 
    type: "expense",
    color: "#EF4444",
    icon: "🛒",
    isDemo: false,
    synced: false,
    createdAt: new Date("2025-01-01T11:00:00Z"),
    updatedAt: new Date("2025-01-01T11:30:00Z")
  },
  {
    id: 3,
    name: "Demo Income",
    type: "income", 
    color: "#3B82F6", // default
    icon: "💰", // default
    isDemo: true,
    synced: false,
    createdAt: new Date("2025-01-01T12:00:00Z"),
    updatedAt: new Date("2025-01-01T12:00:00Z")
  }
];
```

### Valid Create Inputs

```typescript
const validCreateInputs: TCreateCategoryInput[] = [
  // Minimal required fields
  {
    name: "Restaurant", 
    type: "expense"
  },
  
  // With optional fields
  {
    name: "Freelance Income",
    type: "income", 
    color: "#10B981",
    icon: "💼"
  },
  
  // Demo category
  {
    name: "Demo Category",
    type: "expense",
    isDemo: true
  }
];
```

### Invalid Records

```typescript
// Invalid examples that should be rejected
const invalidExamples = [
  // Empty name
  { name: "", type: "income" },
  
  // Invalid type
  { name: "Test", type: "invalid" },
  
  // Invalid color format
  { name: "Test", type: "income", color: "blue" },
  { name: "Test", type: "income", color: "#GGG" },
  
  // Name too long (>100 chars)
  { 
    name: "A".repeat(101), 
    type: "income" 
  },
  
  // Icon too long 
  {
    name: "Test",
    type: "income", 
    icon: "🎉".repeat(20)
  }
];
```

## Business Rules & Constraints

### Category Lifecycle

1. **Creation Rules**
   - Name must be unique across all categories
   - Type is required and immutable after creation
   - Color and icon get defaults if not provided
   - New categories default to `synced: false`
   - Demo flag can only be set on creation

2. **Update Rules**
   - Can update: name, color, icon
   - Cannot update: id, type, createdAt, isDemo
   - Name must remain unique after update
   - `updatedAt` is automatically set on any update
   - Successful updates set `synced: false`

3. **Deletion Rules**
   - Categories with associated transactions cannot be deleted
   - Demo categories can always be deleted
   - Soft delete not implemented (hard delete only)
   - No cascading deletes

### Validation Rules

1. **Name Validation**
   - Required, non-empty after trim
   - Length: 1-100 characters
   - Must be unique (case-sensitive)
   - No HTML/special characters beyond basic punctuation

2. **Type Validation** 
   - Must be exactly 'income' or 'expense'
   - Case-sensitive validation
   - Required for all operations

3. **Color Validation**
   - Must match pattern: /^#[0-9A-F]{6}$/i
   - Automatically convert to uppercase
   - Default to '#3B82F6' if invalid or missing

4. **Icon Validation**
   - Max 10 characters
   - Unicode emoji support
   - Default to '💰' if missing
   - Sanitize to prevent XSS

## Database Indexes

### Current Indexes
```sql
-- Primary key index (automatic)
CREATE INDEX idx_categories_pk ON categories(id);

-- Unique name index (from UNIQUE constraint)
CREATE UNIQUE INDEX idx_categories_name ON categories(name);
```

### Recommended Additional Indexes
```sql
-- For filtering by type (common query pattern)
CREATE INDEX idx_categories_type ON categories(type);

-- For filtering demo/non-demo data
CREATE INDEX idx_categories_is_demo ON categories(is_demo);

-- For sync status queries
CREATE INDEX idx_categories_synced ON categories(synced);

-- Composite index for common filter combinations
CREATE INDEX idx_categories_type_demo ON categories(type, is_demo);

-- For timestamp-based queries
CREATE INDEX idx_categories_created_at ON categories(created_at);
```

## Sync & Offline Considerations

### Sync Status Management
- `synced: false` indicates pending sync to remote
- Create/update operations automatically set `synced: false`
- Successful remote sync sets `synced: true`
- Sync conflicts resolved by timestamp (last write wins)

### Demo Data Handling
- `isDemo: true` categories are excluded from production sync
- Demo categories can be bulk deleted for cleanup
- Demo flag is immutable after creation
- Used for testing and onboarding flows

## Migration Impact

### Schema Changes Required
- **None** - Current schema is sufficient for migration
- Existing constraints and defaults will be preserved
- No data migration needed

### Type System Updates
- Align with project naming conventions (T prefix)
- Create proper input/output types for server actions
- Add comprehensive validation schemas

### Index Optimization
- Add performance indexes for common query patterns
- Monitor query performance during migration
- Optimize based on actual usage patterns

---

**Document Status**: Complete  
**Schema Compatibility**: ✅ No changes required  
**Migration Ready**: ✅ Model is well-defined and constrained
