'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  History, 
  Repeat, 
  Bell, 
  TrendingUp,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TTabId = 'overview' | 'history' | 'recurring' | 'notifications' | 'prognoses';

type TTab = {
  id: TTabId;
  label: string;
  icon: any;
  badge?: number;
  description: string;
};

type TProps = {
  activeTab: TTabId;
  onTabChange: (tabId: TTabId) => void;
  notificationCount?: number;
  upcomingRecurringCount?: number;
};

const tabs: TTab[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: BarChart3,
    description: 'Financial summary and key metrics'
  },
  {
    id: 'history',
    label: 'History',
    icon: History,
    description: 'Transaction history and analysis'
  },
  {
    id: 'recurring',
    label: 'Recurring',
    icon: Repeat,
    description: 'Recurring transactions and schedules'
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    description: 'Alerts and financial reminders'
  },
  {
    id: 'prognoses',
    label: 'Prognoses',
    icon: TrendingUp,
    description: 'Financial forecasting and projections'
  }
];

export function DashboardTabs({ 
  activeTab, 
  onTabChange, 
  notificationCount = 0,
  upcomingRecurringCount = 0 
}: TProps) {
  function getBadgeCount(tabId: TTabId): number | undefined {
    switch (tabId) {
      case 'notifications':
        return notificationCount > 0 ? notificationCount : undefined;
      case 'recurring':
        return upcomingRecurringCount > 0 ? upcomingRecurringCount : undefined;
      default:
        return undefined;
    }
  }

  return (
    <Card className="mb-8">
      <div className="border-b">
        <nav className="flex space-x-8 px-6" aria-label="Dashboard navigation">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const badgeCount = getBadgeCount(tab.id);
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'group relative flex items-center gap-2 py-4 text-sm font-medium transition-all',
                  'border-b-2 border-transparent',
                  'hover:text-primary hover:border-primary/50',
                  isActive 
                    ? 'text-primary border-primary' 
                    : 'text-muted-foreground'
                )}
                aria-selected={isActive}
                role="tab"
              >
                <Icon className={cn(
                  'w-4 h-4 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )} />
                <span>{tab.label}</span>
                {badgeCount && (
                  <Badge 
                    variant="destructive" 
                    className="ml-1 h-5 min-w-[20px] text-xs px-1.5"
                  >
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </Badge>
                )}
                
                {/* Tooltip on hover */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                  {tab.description}
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </Card>
  );
}
