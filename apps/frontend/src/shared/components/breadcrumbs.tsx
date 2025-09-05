'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { getAllRoutes, getFeature } from '@/config/features';

type TBreadcrumb = {
  label: string;
  href: string;
  isActive: boolean;
};

export function Breadcrumbs() {
  const pathname = usePathname();
  
  function generateBreadcrumbs(): TBreadcrumb[] {
    const allRoutes = getAllRoutes();
    
    // Handle root path
    if (pathname === '/') {
      return [
        { label: 'Dashboard', href: '/finance', isActive: true }
      ];
    }
    
    // Find the current route
    const currentRoute = allRoutes.find(route => 
      pathname === route.path || pathname.startsWith(route.path + '/')
    );
    
    if (!currentRoute) {
      return [
        { label: 'Home', href: '/', isActive: true }
      ];
    }
    
    const feature = getFeature(currentRoute.featureId);
    const breadcrumbs: TBreadcrumb[] = [];
    
    // Add feature root if not already there
    const featureRoot = feature?.routes.find(r => r.exact);
    if (featureRoot && currentRoute.path !== featureRoot.path) {
      breadcrumbs.push({
        label: feature.name,
        href: featureRoot.path,
        isActive: false
      });
    }
    
    // Add current route
    breadcrumbs.push({
      label: currentRoute.label,
      href: currentRoute.path,
      isActive: true
    });
    
    return breadcrumbs;
  }
  
  const breadcrumbs = generateBreadcrumbs();
  
  return (
    <nav className="flex items-center space-x-2 text-sm">
      <Link 
        href="/" 
        className="text-gray-500 hover:text-gray-700 transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {breadcrumbs.map((breadcrumb) => (
        <div key={breadcrumb.href} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4 text-gray-400" />
          
          {breadcrumb.isActive ? (
            <span className="font-medium text-gray-900">
              {breadcrumb.label}
            </span>
          ) : (
            <Link
              href={breadcrumb.href}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              {breadcrumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
