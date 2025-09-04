// Server Actions
export * from './actions';

// Legacy Components (for backwards compatibility)
export { OverviewWidget } from './components/OverviewWidget';
export { RecentTransactionsWidget } from './components/RecentTransactionsWidget';
export { BudgetProgressWidget } from './components/BudgetProgressWidget';
export { SavingsGoalsWidget } from './components/SavingsGoalsWidget';

// Enhanced Dashboard Components
export { DashboardTabs } from './components/DashboardTabs';
export { EnhancedDashboard } from './components/EnhancedDashboard';
export { OverviewTab } from './components/tabs/OverviewTab';
export { HistoryTab } from './components/tabs/HistoryTab';
export { RecurringTab } from './components/tabs/RecurringTab';
export { PrognosesTab } from './components/tabs/PrognosesTab';

// Forecasting Actions
export * from './actions/forecasting';

// Page
export { default as DashboardPage } from './page';
