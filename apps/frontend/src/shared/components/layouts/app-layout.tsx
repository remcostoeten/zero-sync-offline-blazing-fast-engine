'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '../sidebar';
import { Breadcrumbs } from '../breadcrumbs';
import { getFeature, getAllRoutes } from '@/config/features';
import { useTheme } from '@/lib/providers/theme-provider';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';

type TProps = {
  children: React.ReactNode;
  className?: string;
};

export function AppLayout({ children, className = '' }: TProps) {
  const pathname = usePathname();
  useTheme();

  function getCurrentFeature() {
    const allRoutes = getAllRoutes();
    const currentRoute = allRoutes.find(route =>
      pathname === route.path || pathname.startsWith(route.path + '/')
    );
    return currentRoute ? getFeature(currentRoute.featureId) : null;
  }

  const currentFeature = getCurrentFeature();

  return (
    <div className="flex min-h-screen bg-foreground text-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="pb-28 flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Header with breadcrumbs */}
        <header className="bg-muted border-b border-neutral-200 dark:border-neutral-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Breadcrumbs />
              <ThemeSwitcher />
            </div>

            {/* Feature context */}
            {currentFeature && (
              <div className="hidden sm:flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-background border border-neutral-200 dark:border-neutral-700">
                  <currentFeature.icon className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {currentFeature.name}
                  </div>
                  <div className="text-xs text-neutral-600 dark:text-neutral-400">
                    {currentFeature.description}
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className={`flex-1 overflow-auto ${className}`}>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
