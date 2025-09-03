# Finance App Frontend

A Next.js 15 application with TypeScript, Tailwind CSS, and SQLite database for personal finance management.

## Features

### Categories Module (Complete)
- ✅ Create, read, update, delete categories
- ✅ Five category types: income, expense, debt, investment, savings
- ✅ Interactive UI with search and filtering
- ✅ Form validation with Zod schemas
- ✅ Modal forms for adding/editing
- ✅ Responsive card grid layout
- ✅ Monthly budget limits per category

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite with Turso
- **ORM**: Drizzle ORM
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **UI Components**: Custom components with Tailwind variants

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── categories/         # Categories page
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout with navigation
│   └── page.tsx           # Dashboard home page
├── components/
│   ├── ui/                # Reusable UI components
│   │   ├── badge.tsx      # Badge component
│   │   ├── button.tsx     # Button with variants
│   │   ├── card.tsx       # Card component
│   │   └── input.tsx      # Input component
│   └── Navigation.tsx     # Main navigation
├── features/
│   └── categories/        # Category feature module
│       ├── actions.ts     # Server actions
│       └── components/    # Category-specific components
│           ├── CategoryCard.tsx   # Individual category display
│           ├── CategoryForm.tsx   # Add/edit form
│           ├── CategoryList.tsx   # Main list component
│           └── index.ts   # Barrel exports
├── lib/
│   ├── crud/
│   │   └── factory.ts     # CRUD operations factory
│   ├── database/
│   │   ├── connection.ts  # Database connection
│   │   └── schemas.ts     # Drizzle schemas
│   ├── validation/
│   │   └── schemas.ts     # Zod validation schemas
│   └── utils.ts           # Utility functions
└── scripts/
    └── init-db.ts         # Database initialization
```

## Getting Started

### 1. Environment Setup

Create `.env.local`:

```bash
TURSO_DATABASE_URL="file:./dev.db"  # For local SQLite
TURSO_AUTH_TOKEN=""                 # Leave empty for local
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Initialize Database (Optional)

```bash
npm run init-db
```

This creates sample categories to demonstrate the functionality.

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3001](http://localhost:3001)

## Usage

### Categories Management

1. **View Categories**: Navigate to `/categories` to see all categories
2. **Create Category**: Click "New Category" button to open the form modal
3. **Edit Category**: Click the pencil icon on any category card
4. **Delete Category**: Click the trash icon (with confirmation)
5. **Filter Categories**: Use the search bar and filter dropdowns
6. **Budget Limits**: Set optional monthly budget limits for expense categories

### Form Validation

- Name: Required, 1-50 characters
- Type: Required, one of: income, expense, debt, investment, savings
- Description: Optional
- Monthly Budget Limit: Optional positive number
- Status: Active/Inactive toggle

## Architecture Decisions

### Server Actions
- Direct server actions instead of API routes
- Better type safety and performance
- Automatic revalidation with `revalidatePath`

### Component Structure
- Feature-based organization
- Reusable UI components
- Client-side state management for UI interactions
- Server-side data fetching and mutations

### Form Handling
- React Hook Form for performance
- Zod for runtime type validation
- Proper error handling and display

### Database Design
- SQLite for simplicity and local development
- Drizzle ORM for type-safe queries
- Incremental ID primary keys
- Created/updated timestamps
- Sync support (for future multi-device sync)

## Next Steps

The categories module is complete and provides a solid foundation for:

1. **Transactions Module**: Create transactions linked to categories
2. **Budgets Module**: Set budget limits per category
3. **Savings Goals Module**: Track progress toward financial goals
4. **Dashboard Analytics**: Visual charts and statistics
5. **Debt Management**: Track and plan debt payments

The established patterns can be replicated for other modules:
- Database schema definition
- Zod validation schemas
- Server actions for CRUD operations
- Reusable UI components
- Feature-based organization

## Development Notes

- Uses Next.js 15 with Turbopack for fast development
- All components use TypeScript for type safety
- Tailwind CSS for consistent styling
- Form validation prevents invalid data submission
- Responsive design works on all device sizes
- Accessibility considerations in form labels and navigation
