# Universal Productivity Suite

A modern, modular productivity application built with Next.js 15, featuring finance management, with upcoming notes, todos, project management, and database viewing capabilities.

## 🎯 Features

### ✅ Currently Available

**Finance Management** (Fully Implemented)
- 📊 Dashboard with financial overview
- 💰 Transaction management and categorization  
- 🎯 Budget tracking and alerts
- 🏦 Savings goals with progress tracking
- 🔄 Recurring transactions and automation
- 📈 Financial reports and analytics
- ⚙️ Settings with demo data toggle
- 🎭 Demo mode with realistic sample data

### 🚧 Coming Soon

**Notes** - Rich text note-taking with organization and search
**To-dos** - Task management with projects and collaboration  
**Projects** - Project management with teams and milestones
**Database Viewer** - Browse and manage database tables

## 🏗️ Architecture

### Modular Feature-Based Structure

```
src/
├── config/
│   └── features.ts              # Feature registry and configuration
├── shared/
│   ├── components/
│   │   ├── layouts/
│   │   │   └── app-layout.tsx   # Main app layout with sidebar
│   │   ├── sidebar.tsx          # Modern collapsible sidebar
│   │   └── breadcrumbs.tsx      # Dynamic breadcrumb navigation
│   ├── utils/                   # Shared utilities
│   ├── types/                   # Shared TypeScript types  
│   └── hooks/                   # Shared React hooks
├── features/
│   ├── finance/                 # Finance feature module
│   ├── notes/                   # Notes feature (future)
│   ├── todos/                   # Todos feature (future)
│   ├── projects/                # Projects feature (future)
│   └── database-viewer/         # Database viewer feature (future)
└── app/                         # Next.js 15 App Router
    ├── finance/                 # Finance routes (/finance/*)
    │   ├── categories/
    │   ├── transactions/
    │   ├── budgets/
    │   ├── savings/
    │   ├── recurring/
    │   ├── reports/
    │   └── settings/
    ├── notes/                   # Notes routes (placeholder)
    ├── todos/                   # Todos routes (placeholder)
    ├── projects/                # Projects routes (placeholder)  
    └── database/                # Database routes (placeholder)
```

## 🎨 Key Components

### Modern Sidebar Navigation
- 🎯 **Feature-grouped navigation** with collapsible sections
- 🔍 **Real-time search** across all features and pages
- 📱 **Mobile responsive** with drawer functionality
- 🎨 **Theme-aware colors** for different feature sections
- ⌨️ **Keyboard navigation** support

### Intelligent Layout System  
- 📐 **Flexible layouts** that adapt to different features
- 🍞 **Dynamic breadcrumbs** based on current location
- 🎯 **Feature context headers** showing current section
- 📱 **Responsive design** for all screen sizes

### Feature Management
- ⚙️ **Centralized configuration** in `features.ts`
- 🔒 **Permission-based access** control
- 🎚️ **Feature flags** for development and rollout
- 📊 **Metadata tracking** (version, author, tags)

## 🛠️ Development

### Prerequisites
- Node.js 18+
- Bun (package manager)

### Setup
```bash
cd apps/frontend
bun install
bun dev
```

### Adding New Features

See the comprehensive [Feature Development Guide](./FEATURE_DEVELOPMENT.md) for detailed instructions on adding new features to the application.

Quick steps:
1. Add feature config to `src/config/features.ts`
2. Create feature directory structure
3. Build feature components and pages
4. Add app routes
5. Enable the feature in config

### Code Standards

**TypeScript Rules:**
- ✅ Use `type` declarations (not `interface`)
- ✅ Prefix all types with `T` (e.g., `TProps`, `TUser`)
- ✅ Single non-exported type per file should be `TProps`

**React Components:**
- ✅ Use `function` declarations (no arrow functions)
- ✅ Named exports only (except pages/views)
- ✅ Props type must be called `TProps`

**Functional Programming:**
- ✅ Pure functions without side effects
- ✅ No classes, `extends`, `new`, or `this`
- ✅ Immutable data patterns
- ✅ Composition over inheritance

## 🎯 Navigation Features

### Smart Sidebar
- **Collapsible design** - Expands/collapses with persistent state
- **Feature sections** - Organized by product areas (Finance, Notes, etc.)
- **Active state** - Clear indication of current page
- **Search functionality** - Find any feature or page instantly
- **Mobile responsive** - Drawer pattern on small screens

### Dynamic Breadcrumbs  
- **Context aware** - Shows current feature and page
- **Clickable navigation** - Jump to any parent level
- **Home integration** - Always accessible home link

### Feature Context
- **Current feature indicator** - Shows active feature with icon and description
- **Theme colors** - Each feature has its own color scheme
- **Responsive design** - Adapts to screen size

## 🚀 Future Roadmap

1. **Notes Feature** - Rich text editing, organization, search
2. **Todos Feature** - Task management, projects, collaboration  
3. **Projects Feature** - Team management, milestones, tracking
4. **Database Viewer** - Table browsing, query builder, admin tools
5. **Advanced Search** - Global search across all features
6. **User Management** - Authentication, permissions, profiles
7. **Integrations** - Third-party service connections

## 📁 Current Structure

```
apps/frontend/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── finance/           # ✅ Finance routes (implemented)
│   │   ├── notes/             # 🚧 Notes routes (placeholder)
│   │   ├── todos/             # 🚧 Todos routes (placeholder)
│   │   ├── projects/          # 🚧 Projects routes (placeholder)
│   │   ├── database/          # 🚧 Database routes (placeholder)
│   │   ├── layout.tsx         # Root layout with AppLayout
│   │   └── page.tsx           # Redirects to /finance
│   ├── shared/
│   │   └── components/
│   │       ├── layouts/
│   │       │   └── app-layout.tsx
│   │       ├── sidebar.tsx
│   │       ├── breadcrumbs.tsx
│   │       └── demo-toggle.tsx
│   ├── config/
│   │   └── features.ts        # Feature registry
│   └── features/              # Feature modules
├── FEATURE_DEVELOPMENT.md     # Development guide
└── README.md                  # This file
```

## 🎭 Demo Mode

The finance feature includes a comprehensive demo mode:
- **Toggle in settings** - Switch between real and sample data
- **Rich sample data** - Realistic transactions, budgets, and categories
- **Safe exploration** - Explore features without affecting real data
- **Data preservation** - Your real data is preserved when switching modes

---

**Built with ❤️ using Next.js 15, TypeScript, and modern web technologies**
