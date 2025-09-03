// Components
export { SavingsGoalCard } from './components/SavingsGoalCard';
export { SavingsGoalForm } from './components/SavingsGoalForm';
export { SavingsGoalList } from './components/SavingsGoalList';
export { SavingsGoalsPage } from './components/SavingsGoalsPage';

// Actions and types
export {
  createSavingsGoal,
  getSavingsGoals,
  getSavingsGoalById,
  updateSavingsGoal,
  updateSavingsProgress,
  deleteSavingsGoal,
  getSavingsGoalsSummary,
  getSavingsGoalsAlerts,
  getRecommendedMonthlySavings,
  type SavingsGoalWithProgress,
} from './actions';
