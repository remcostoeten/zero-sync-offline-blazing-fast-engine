import { 
  Home, 
  FolderOpen, 
  CreditCard, 
  PiggyBank, 
  Target, 
  TrendingUp,
  BarChart3,
  Settings,
  StickyNote,
  CheckSquare,
  Briefcase,
  Database,
  LucideIcon
} from 'lucide-react';

export type TFeaturePermission = 'read' | 'write' | 'admin';

export type TFeatureRoute = {
  path: string;
  label: string;
  icon?: LucideIcon;
  permissions?: TFeaturePermission[];
  exact?: boolean;
};

export type TFeatureConfig = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  isEnabled: boolean;
  permissions: TFeaturePermission[];
  routes: TFeatureRoute[];
  metadata?: {
    version?: string;
    author?: string;
    tags?: string[];
  };
};

export const FEATURES: Record<string, TFeatureConfig> = {
  finance: {
    id: 'finance',
    name: 'Finance',
    description: 'Personal finance management with budgeting, transactions, and reporting',
    icon: CreditCard,
    color: 'emerald',
    isEnabled: true,
    permissions: ['read', 'write'],
    routes: [
      {
        path: '/finance',
        label: 'Dashboard',
        icon: Home,
        exact: true
      },
      {
        path: '/finance/categories',
        label: 'Categories',
        icon: FolderOpen
      },
      {
        path: '/finance/transactions',
        label: 'Transactions',
        icon: CreditCard
      },
      {
        path: '/finance/budgets',
        label: 'Budgets',
        icon: Target
      },
      {
        path: '/finance/savings',
        label: 'Savings',
        icon: PiggyBank
      },
      {
        path: '/finance/recurring',
        label: 'Recurring',
        icon: TrendingUp
      },
      {
        path: '/finance/reports',
        label: 'Reports',
        icon: BarChart3
      },
      {
        path: '/finance/settings',
        label: 'Settings',
        icon: Settings
      }
    ],
    metadata: {
      version: '2.0.0',
      author: 'Finance Team',
      tags: ['money', 'budgeting', 'transactions']
    }
  },

  notes: {
    id: 'notes',
    name: 'Notes',
    description: 'Rich text note-taking with organization and search capabilities',
    icon: StickyNote,
    color: 'blue',
    isEnabled: false, // Will be enabled in future
    permissions: ['read', 'write'],
    routes: [
      {
        path: '/notes',
        label: 'All Notes',
        icon: StickyNote,
        exact: true
      },
      {
        path: '/notes/folders',
        label: 'Folders',
        icon: FolderOpen
      },
      {
        path: '/notes/search',
        label: 'Search',
        icon: Settings
      }
    ],
    metadata: {
      version: '1.0.0',
      tags: ['productivity', 'writing', 'organization']
    }
  },

  todos: {
    id: 'todos',
    name: 'To-dos',
    description: 'Task management with projects, deadlines, and collaboration',
    icon: CheckSquare,
    color: 'purple',
    isEnabled: false,
    permissions: ['read', 'write'],
    routes: [
      {
        path: '/todos',
        label: 'Tasks',
        icon: CheckSquare,
        exact: true
      },
      {
        path: '/todos/projects',
        label: 'Projects',
        icon: Briefcase
      },
      {
        path: '/todos/calendar',
        label: 'Calendar',
        icon: Target
      }
    ],
    metadata: {
      version: '1.0.0',
      tags: ['productivity', 'tasks', 'planning']
    }
  },

  projects: {
    id: 'projects',
    name: 'Projects',
    description: 'Project management with teams, milestones, and tracking',
    icon: Briefcase,
    color: 'orange',
    isEnabled: false,
    permissions: ['read', 'write', 'admin'],
    routes: [
      {
        path: '/projects',
        label: 'Overview',
        icon: Briefcase,
        exact: true
      },
      {
        path: '/projects/active',
        label: 'Active Projects',
        icon: TrendingUp
      },
      {
        path: '/projects/team',
        label: 'Team',
        icon: Settings
      }
    ],
    metadata: {
      version: '1.0.0',
      tags: ['collaboration', 'management', 'teams']
    }
  },

  databaseViewer: {
    id: 'database-viewer',
    name: 'Database Viewer',
    description: 'Browse and manage database tables with advanced querying',
    icon: Database,
    color: 'slate',
    isEnabled: true,
    permissions: ['read', 'admin'],
    routes: [
      {
        path: '/database-viewer',
        label: 'Database Viewer',
        icon: Database,
        exact: true
      }
    ],
    metadata: {
      version: '1.0.0',
      tags: ['database', 'admin', 'data']
    }
  }
};

export function getEnabledFeatures(): TFeatureConfig[] {
  return Object.values(FEATURES).filter(feature => feature.isEnabled);
}

export function getFeature(id: string): TFeatureConfig | undefined {
  return FEATURES[id];
}

export function getFeatureRoutes(featureId: string): TFeatureRoute[] {
  const feature = getFeature(featureId);
  return feature?.routes || [];
}

export function getAllRoutes(): Array<TFeatureRoute & { featureId: string }> {
  return Object.entries(FEATURES)
    .filter(([, feature]) => feature.isEnabled)
    .flatMap(([featureId, feature]) => 
      feature.routes.map(route => ({
        ...route,
        featureId
      }))
    );
}

export function hasFeaturePermission(
  featureId: string, 
  requiredPermission: TFeaturePermission
): boolean {
  const feature = getFeature(featureId);
  if (!feature || !feature.isEnabled) return false;
  
  // For now, return true - in a real app, check user permissions
  return feature.permissions.includes(requiredPermission);
}

export const APP_CONFIG = {
  name: 'Universal Productivity Suite',
  description: 'All-in-one productivity application with finance, notes, todos, and more',
  version: '3.0.0',
  features: FEATURES,
  settings: {
    defaultFeature: 'finance',
    sidebarCollapsed: false,
    theme: 'light' as 'light' | 'dark' | 'system'
  }
} as const;
