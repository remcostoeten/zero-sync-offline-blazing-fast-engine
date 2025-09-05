'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Menu,
  X,
  Settings as SettingsIcon
} from 'lucide-react';
import { getEnabledFeatures, getAllRoutes, APP_CONFIG } from '@/config/features';

type TProps = {
  className?: string;
};

type TSidebarState = {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  searchQuery: string;
};

export function Sidebar({ className = '' }: TProps) {
  const [state, setState] = useState<TSidebarState>({
    isCollapsed: false,
    isMobileOpen: false,
    searchQuery: ''
  });
  
  const pathname = usePathname();
  const enabledFeatures = getEnabledFeatures();
  const allRoutes = getAllRoutes();

  const filteredRoutes = allRoutes.filter(route =>
    route.label.toLowerCase().includes(state.searchQuery.toLowerCase())
  );

  function toggleCollapsed() {
    setState(prev => ({ ...prev, isCollapsed: !prev.isCollapsed }));
  }

  function toggleMobile() {
    setState(prev => ({ ...prev, isMobileOpen: !prev.isMobileOpen }));
  }

  function handleSearch(query: string) {
    setState(prev => ({ ...prev, searchQuery: query }));
  }

  function isRouteActive(routePath: string): boolean {
    if (routePath === '/finance' && pathname === '/') return true;
    return pathname === routePath || pathname.startsWith(routePath + '/');
  }

  function getFeatureColor(featureId: string): string {
    const feature = enabledFeatures.find(f => f.id === featureId);
    const colorMap: Record<string, string> = {
      emerald: 'text-emerald-600 bg-emerald-50',
      blue: 'text-blue-600 bg-blue-50',
      purple: 'text-purple-600 bg-purple-50',
      orange: 'text-orange-600 bg-orange-50',
      slate: 'text-slate-600 bg-slate-50'
    };
    return colorMap[feature?.color || 'slate'] || colorMap.slate;
  }

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) {
        setState(prev => ({ ...prev, isMobileOpen: false }));
      }
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sidebarClasses = `
    ${className}
    ${state.isCollapsed ? 'w-16' : 'w-64'}
    ${state.isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    fixed lg:static inset-y-0 left-0 z-50
    bg-white border-r border-gray-200
    transition-all duration-300 ease-in-out
    flex flex-col
  `.trim();

  return (
    <>
      {/* Mobile backdrop */}
      {state.isMobileOpen && (
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-30 z-40 lg:hidden"
          onClick={() => setState(prev => ({ ...prev, isMobileOpen: false }))}
        />
      )}

      {/* Mobile menu button */}
      <button
        onClick={toggleMobile}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md border"
      >
        {state.isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside className={sidebarClasses}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!state.isCollapsed && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">UPS</span>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 text-sm">
                    {APP_CONFIG.name.split(' ').slice(0, 2).join(' ')}
                  </h2>
                  <p className="text-xs text-gray-500">v{APP_CONFIG.version}</p>
                </div>
              </div>
            )}
            
            <button
              onClick={toggleCollapsed}
              className="hidden lg:flex p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            >
              {state.isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-gray-500" />
              )}
            </button>
          </div>

          {/* Search */}
          {!state.isCollapsed && (
            <div className="mt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search features..."
                  value={state.searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {!state.searchQuery && (
            <>
              {/* Features grouped by feature */}
              {enabledFeatures.map((feature) => (
                <div key={feature.id} className="space-y-1">
                  {!state.isCollapsed && (
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <feature.icon className={`h-4 w-4 ${getFeatureColor(feature.id)}`} />
                        <span>{feature.name}</span>
                      </div>
                    </div>
                  )}
                  
                  {feature.routes.map((route) => {
                    const isActive = isRouteActive(route.path);
                    const Icon = route.icon || feature.icon;
                    
                    return (
                      <Link
                        key={route.path}
                        href={route.path}
                        className={`
                          flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                          ${isActive 
                            ? `${getFeatureColor(feature.id)} shadow-sm` 
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }
                          ${state.isCollapsed ? 'justify-center' : ''}
                        `.trim()}
                        onClick={() => setState(prev => ({ ...prev, isMobileOpen: false }))}
                      >
                        <Icon className={`h-5 w-5 ${state.isCollapsed ? '' : 'flex-shrink-0'}`} />
                        {!state.isCollapsed && (
                          <span className="truncate">{route.label}</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </>
          )}

          {/* Search results */}
          {state.searchQuery && (
            <div className="space-y-1">
              {!state.isCollapsed && (
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Search Results ({filteredRoutes.length})
                </div>
              )}
              
              {filteredRoutes.map((route) => {
                const isActive = isRouteActive(route.path);
                const Icon = route.icon;
                const feature = enabledFeatures.find(f => f.id === route.featureId);
                
                return (
                  <Link
                    key={route.path}
                    href={route.path}
                    className={`
                      flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${isActive 
                        ? `${getFeatureColor(route.featureId)} shadow-sm` 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }
                      ${state.isCollapsed ? 'justify-center' : ''}
                    `.trim()}
                    onClick={() => setState(prev => ({ ...prev, isMobileOpen: false, searchQuery: '' }))}
                  >
                    {Icon && <Icon className={`h-5 w-5 ${state.isCollapsed ? '' : 'flex-shrink-0'}`} />}
                    {!state.isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <span className="block truncate">{route.label}</span>
                        <span className="text-xs text-gray-500">{feature?.name}</span>
                      </div>
                    )}
                  </Link>
                );
              })}
              
              {filteredRoutes.length === 0 && !state.isCollapsed && (
                <div className="px-3 py-8 text-center text-sm text-gray-500">
                                    No results found for &quot;{state.searchQuery}&quot;

                </div>
              )}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          {!state.isCollapsed ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{enabledFeatures.length} features</span>
                <Link 
                  href="/settings" 
                  className="hover:text-gray-700 transition-colors"
                >
                  <SettingsIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
            <Link 
              href="/settings"
              className="flex justify-center p-2 hover:bg-gray-50 rounded-md transition-colors"
            >
              <SettingsIcon className="h-5 w-5 text-gray-500" />
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
