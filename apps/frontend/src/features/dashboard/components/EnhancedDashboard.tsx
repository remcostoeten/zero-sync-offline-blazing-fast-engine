'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardTabs } from './DashboardTabs';
import { OverviewTab } from './tabs/OverviewTab';
import { HistoryTab } from './tabs/HistoryTab';
import { RecurringTab } from './tabs/RecurringTab';
import { PrognosesTab } from './tabs/PrognosesTab';

type TTabId = 'overview' | 'history' | 'recurring' | 'notifications' | 'prognoses';

type TProps = {
  // Overview data
  overview: any;
  recentTransactions: any[];
  budgetProgress: any[];
  savingsProgress: any[];
  insights: any;
  trends?: any[];

  // History data
  allTransactions: any[];
  categories: any[];
  totalTransactionCount: number;

  // Recurring data
  recurringTransactions: any[];
  upcomingTransactions: any[];

  // Notification counts
  notificationCount?: number;
  upcomingRecurringCount?: number;
};

function TabSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-96 bg-muted rounded-lg animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-48 bg-muted rounded-lg animate-pulse" />
          <div className="h-48 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function NotificationsTabPlaceholder() {
  return (
    <div className="flex items-center justify-center h-96 bg-muted/20 rounded-lg border-2 border-dashed">
      <div className="text-center">
        <h3 className="font-semibold text-lg mb-2">Notifications Tab</h3>
        <p className="text-muted-foreground">Coming soon - notification center with alerts and reminders</p>
      </div>
    </div>
  );
}

function PrognosesTabPlaceholder() {
  return (
    <div className="flex items-center justify-center h-96 bg-muted/20 rounded-lg border-2 border-dashed">
      <div className="text-center">
        <h3 className="font-semibold text-lg mb-2">Prognoses Tab</h3>
        <p className="text-muted-foreground">Coming soon - financial forecasting and projections</p>
      </div>
    </div>
  );
}

export function EnhancedDashboard({
  overview,
  recentTransactions,
  budgetProgress,
  savingsProgress,
  insights,
  trends,
  allTransactions,
  categories,
  totalTransactionCount,
  recurringTransactions,
  upcomingTransactions,
  notificationCount = 0,
  upcomingRecurringCount = 0
}: TProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TTabId>('overview');
  const [currentPage, setCurrentPage] = useState(1);

  // Initialize tab from URL params
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TTabId;
    if (tabParam && ['overview', 'history', 'recurring', 'notifications', 'prognoses'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  function handleTabChange(tabId: TTabId) {
    setActiveTab(tabId);

    // Update URL without page refresh
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId);
    router.push(`?${params.toString()}`, { scroll: false });
  }

  // History tab handlers
  function handleFilterChange(filters: any) {
    console.log('Filter change:', filters);
    // TODO: Implement actual filtering with server actions
  }

  function handlePageChange(page: number) {
    setCurrentPage(page);
    // TODO: Implement pagination with server actions
  }

  function handleExport(format: 'csv' | 'pdf') {
    console.log('Export:', format);
    // TODO: Implement export functionality
  }

  // Recurring tab handlers
  function handleToggleActive(id: number, active: boolean) {
    console.log('Toggle active:', id, active);
    // TODO: Implement with server action
  }

  function handleToggleAutoGenerate(id: number, autoGenerate: boolean) {
    console.log('Toggle auto-generate:', id, autoGenerate);
    // TODO: Implement with server action
  }

  function handleEditRecurring(id: number) {
    console.log('Edit recurring:', id);
    // TODO: Open edit modal or navigate to edit page
  }

  function handleDeleteRecurring(id: number) {
    console.log('Delete recurring:', id);
    // TODO: Implement delete with confirmation
  }

  function handleCreateRecurring() {
    console.log('Create recurring');
    // TODO: Open create modal or navigate to create page
  }

  function handleSkipUpcoming(id: number) {
    console.log('Skip upcoming:', id);
    // TODO: Implement skip action
  }

  function handleGenerateUpcoming(id: number) {
    console.log('Generate upcoming:', id);
    // TODO: Implement generate action
  }

  // Prognoses tab handlers - AI forecasting
  async function handleGenerateProjection(timeframe: number, scenarios?: any) {
    // Import dynamically to avoid SSR issues
    const { generateCashFlowProjection } = await import('../actions/forecasting');
    return await generateCashFlowProjection(timeframe, scenarios);
  }

  async function handleGenerateAnalysis() {
    const { generateSpendingAnalysis } = await import('../actions/forecasting');
    return await generateSpendingAnalysis();
  }

  async function handleGenerateAdvice() {
    const { generateFinancialAdvice } = await import('../actions/forecasting');
    return await generateFinancialAdvice();
  }

  function renderActiveTab() {
    switch (activeTab) {
      case 'overview':
        return (
          <Suspense fallback={<TabSkeleton />}>
            <OverviewTab
              overview={overview}
              recentTransactions={recentTransactions}
              budgetProgress={budgetProgress}
              savingsProgress={savingsProgress}
              insights={insights}
              trends={trends}
            />
          </Suspense>
        );

      case 'history':
        return (
          <Suspense fallback={<TabSkeleton />}>
            <HistoryTab
              transactions={allTransactions}
              categories={categories}
              totalCount={totalTransactionCount}
              currentPage={currentPage}
              onFilterChange={handleFilterChange}
              onPageChange={handlePageChange}
              onExport={handleExport}
            />
          </Suspense>
        );

      case 'recurring':
        return (
          <Suspense fallback={<TabSkeleton />}>
            <RecurringTab
              recurringTransactions={recurringTransactions}
              upcomingTransactions={upcomingTransactions}
              onToggleActive={handleToggleActive}
              onToggleAutoGenerate={handleToggleAutoGenerate}
              onEdit={handleEditRecurring}
              onDelete={handleDeleteRecurring}
              onCreate={handleCreateRecurring}
              onSkip={handleSkipUpcoming}
              onGenerate={handleGenerateUpcoming}
            />
          </Suspense>
        );

      case 'notifications':
        return <NotificationsTabPlaceholder />;

      case 'prognoses':
        return (
          <Suspense fallback={<TabSkeleton />}>
            <PrognosesTab
              onGenerateProjection={handleGenerateProjection}
              onGenerateAnalysis={handleGenerateAnalysis}
              onGenerateAdvice={handleGenerateAdvice}
            />
          </Suspense>
        );

      default:
        return <OverviewTab
          overview={overview}
          recentTransactions={recentTransactions}
          budgetProgress={budgetProgress}
          savingsProgress={savingsProgress}
          insights={insights}
          trends={trends}
        />;
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Financial Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive view of your finances with advanced analytics
          </p>
        </div>

        {/* Tab Navigation */}
        <DashboardTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          notificationCount={notificationCount}
          upcomingRecurringCount={upcomingRecurringCount}
        />

        {/* Tab Content */}
        {renderActiveTab()}
      </div>
    </div>
  );
}
