'use server';

import { getDb } from '@/lib/database/connection';
import { 
  transactionsSchema, 
  categoriesSchema, 
  budgetsSchema,
  savingsGoalsSchema 
} from '@/lib/database/schemas';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import { geminiAnalyzer, type TFinancialData, type TBudgetOptimization } from '@/lib/gemini';
import { gatherFinancialData } from '@/features/dashboard/actions/forecasting';

type TBudgetAnalysisResult = {
  optimization: TBudgetOptimization;
  underutilizedBudgets: Array<{
    categoryName: string;
    budgetAmount: number;
    actualSpending: number;
    utilizationRate: number;
    potentialReallocation: number;
  }>;
  savingsOpportunities: Array<{
    opportunity: string;
    category: string;
    currentAmount: number;
    potentialSavings: number;
    difficulty: 'easy' | 'moderate' | 'challenging';
    timeframe: 'immediate' | 'short-term' | 'long-term';
  }>;
  riskAreas: Array<{
    category: string;
    riskType: 'overspending' | 'volatility' | 'trend_increase';
    severity: 'low' | 'medium' | 'high';
    description: string;
    recommendation: string;
  }>;
};

export async function analyzeBudgetOptimization(
  timeframe: number = 6
): Promise<TBudgetAnalysisResult> {
  try {
    // Gather comprehensive financial data
    const financialData = await gatherFinancialData();
    
    // Generate AI-powered optimization recommendations
    const optimization = await geminiAnalyzer.generateBudgetOptimization(financialData);
    
    // Perform detailed analysis
    const underutilizedBudgets = await identifyUnderutilizedBudgets();
    const savingsOpportunities = await detectSavingsOpportunities(financialData);
    const riskAreas = await analyzeRiskAreas(financialData);
    
    return {
      optimization,
      underutilizedBudgets,
      savingsOpportunities,
      riskAreas
    };
  } catch (error) {
    console.error('Budget optimization analysis error:', error);
    throw new Error('Failed to analyze budget optimization');
  }
}

export async function identifyUnderutilizedBudgets(): Promise<Array<{
  categoryName: string;
  budgetAmount: number;
  actualSpending: number;
  utilizationRate: number;
  potentialReallocation: number;
}>> {
  const db = getDb();
  
  // Get current month's budget utilization
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  
  const budgetUtilization = await db
    .select({
      categoryName: categoriesSchema.name,
      budgetAmount: budgetsSchema.amount,
      actualSpending: sql<number>`COALESCE(SUM(${transactionsSchema.amount}), 0)`,
    })
    .from(budgetsSchema)
    .leftJoin(categoriesSchema, eq(budgetsSchema.categoryId, categoriesSchema.id))
    .leftJoin(
      transactionsSchema,
      and(
        eq(transactionsSchema.categoryId, budgetsSchema.categoryId),
        eq(transactionsSchema.type, 'expense'),
        sql`strftime('%Y-%m', ${transactionsSchema.date}) = ${currentMonth}`
      )
    )
    .where(eq(budgetsSchema.isActive, true))
    .groupBy(budgetsSchema.id, categoriesSchema.name, budgetsSchema.amount);
  
  return budgetUtilization
    .map(b => ({
      categoryName: b.categoryName || 'Unknown',
      budgetAmount: b.budgetAmount,
      actualSpending: b.actualSpending,
      utilizationRate: b.budgetAmount > 0 ? (b.actualSpending / b.budgetAmount) * 100 : 0,
      potentialReallocation: Math.max(0, b.budgetAmount - b.actualSpending)
    }))
    .filter(b => b.utilizationRate < 60) // Less than 60% utilization
    .sort((a, b) => b.potentialReallocation - a.potentialReallocation);
}

export async function detectSavingsOpportunities(
  data: TFinancialData
): Promise<Array<{
  opportunity: string;
  category: string;
  currentAmount: number;
  potentialSavings: number;
  difficulty: 'easy' | 'moderate' | 'challenging';
  timeframe: 'immediate' | 'short-term' | 'long-term';
}>> {
  const opportunities = [];
  
  // Analyze spending patterns for opportunities
  const categorySpending = data.transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.categoryName] = (acc[t.categoryName] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
  
  // Identify subscription optimization opportunities
  const subscriptionKeywords = ['subscription', 'monthly', 'streaming', 'gym', 'software', 'membership'];
  const subscriptionExpenses = data.transactions.filter(t => 
    t.type === 'expense' && 
    subscriptionKeywords.some(keyword => 
      t.description.toLowerCase().includes(keyword)
    )
  );
  
  if (subscriptionExpenses.length > 0) {
    const totalSubscriptions = subscriptionExpenses.reduce((sum, t) => sum + t.amount, 0);
    opportunities.push({
      opportunity: 'Review and optimize recurring subscriptions',
      category: 'Subscriptions',
      currentAmount: totalSubscriptions,
      potentialSavings: totalSubscriptions * 0.3, // Assume 30% savings potential
      difficulty: 'easy',
      timeframe: 'immediate'
    });
  }
  
  // Identify dining out opportunities
  const diningCategories = ['dining', 'restaurant', 'food', 'takeout'];
  const diningExpenses = Object.entries(categorySpending)
    .filter(([category]) => 
      diningCategories.some(dc => category.toLowerCase().includes(dc))
    )
    .reduce((sum, [, amount]) => sum + amount, 0);
  
  if (diningExpenses > 500) { // If spending more than $500/month on dining
    opportunities.push({
      opportunity: 'Reduce dining out and increase home cooking',
      category: 'Food & Dining',
      currentAmount: diningExpenses,
      potentialSavings: diningExpenses * 0.4, // 40% savings potential
      difficulty: 'moderate',
      timeframe: 'short-term'
    });
  }
  
  // Identify transportation optimization
  const transportCategories = ['transport', 'gas', 'fuel', 'uber', 'taxi', 'parking'];
  const transportExpenses = Object.entries(categorySpending)
    .filter(([category]) => 
      transportCategories.some(tc => category.toLowerCase().includes(tc))
    )
    .reduce((sum, [, amount]) => sum + amount, 0);
  
  if (transportExpenses > 400) {
    opportunities.push({
      opportunity: 'Optimize transportation costs (carpooling, public transport, gas rewards)',
      category: 'Transportation',
      currentAmount: transportExpenses,
      potentialSavings: transportExpenses * 0.25,
      difficulty: 'moderate',
      timeframe: 'short-term'
    });
  }
  
  // Identify utility optimization
  const utilityCategories = ['utilities', 'electric', 'water', 'internet', 'phone'];
  const utilityExpenses = Object.entries(categorySpending)
    .filter(([category]) => 
      utilityCategories.some(uc => category.toLowerCase().includes(uc))
    )
    .reduce((sum, [, amount]) => sum + amount, 0);
  
  if (utilityExpenses > 200) {
    opportunities.push({
      opportunity: 'Reduce utility costs through energy efficiency and plan optimization',
      category: 'Utilities',
      currentAmount: utilityExpenses,
      potentialSavings: utilityExpenses * 0.15,
      difficulty: 'easy',
      timeframe: 'immediate'
    });
  }
  
  return opportunities.sort((a, b) => b.potentialSavings - a.potentialSavings);
}

export async function analyzeRiskAreas(data: TFinancialData): Promise<Array<{
  category: string;
  riskType: 'overspending' | 'volatility' | 'trend_increase';
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
}>> {
  const risks = [];
  
  // Analyze budget vs actual spending
  const budgetRisks = data.budgets
    .filter(b => b.spentAmount > b.budgetAmount * 1.1) // 10% over budget
    .map(b => ({
      category: b.categoryName,
      riskType: 'overspending' as const,
      severity: (b.spentAmount / b.budgetAmount) > 1.5 ? 'high' : 'medium' as const,
      description: `Spending ${((b.spentAmount / b.budgetAmount - 1) * 100).toFixed(1)}% over budget`,
      recommendation: `Set up spending alerts and review category expenses weekly`
    }));
  
  risks.push(...budgetRisks);
  
  // Analyze spending volatility by category
  const categoryTransactions = data.transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      if (!acc[t.categoryName]) acc[t.categoryName] = [];
      acc[t.categoryName].push(t.amount);
      return acc;
    }, {} as Record<string, number[]>);
  
  Object.entries(categoryTransactions)
    .filter(([, amounts]) => amounts.length >= 5) // Need at least 5 transactions
    .forEach(([category, amounts]) => {
      const avg = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
      const variance = amounts.reduce((sum, a) => sum + Math.pow(a - avg, 2), 0) / amounts.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = stdDev / avg;
      
      if (coefficientOfVariation > 0.5) { // High volatility
        risks.push({
          category,
          riskType: 'volatility',
          severity: coefficientOfVariation > 1.0 ? 'high' : 'medium',
          description: `Highly variable spending (${(coefficientOfVariation * 100).toFixed(0)}% variation)`,
          recommendation: 'Consider setting up automatic transfers or scheduled payments to stabilize spending'
        });
      }
    });
  
  // Analyze spending trends (increasing patterns)
  const recentTransactions = data.transactions
    .filter(t => t.type === 'expense' && new Date(t.date) >= new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)) // Last 3 months
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const categoryTrends = recentTransactions.reduce((acc, t) => {
    const month = t.date.slice(0, 7); // YYYY-MM
    if (!acc[t.categoryName]) acc[t.categoryName] = {};
    acc[t.categoryName][month] = (acc[t.categoryName][month] || 0) + t.amount;
    return acc;
  }, {} as Record<string, Record<string, number>>);
  
  Object.entries(categoryTrends).forEach(([category, monthlyData]) => {
    const months = Object.keys(monthlyData).sort();
    if (months.length >= 3) {
      const amounts = months.map(m => monthlyData[m]);
      const isIncreasing = amounts.every((amount, i) => 
        i === 0 || amount >= amounts[i - 1] * 0.9
      ); // Allowing 10% variance
      
      const trend = (amounts[amounts.length - 1] - amounts[0]) / amounts[0];
      
      if (isIncreasing && trend > 0.2) { // 20% increase trend
        risks.push({
          category,
          riskType: 'trend_increase',
          severity: trend > 0.5 ? 'high' : 'medium',
          description: `Spending increasing by ${(trend * 100).toFixed(0)}% over 3 months`,
          recommendation: 'Review what\'s driving increased spending and set stricter budget limits'
        });
      }
    }
  });
  
  return risks.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });
}

export async function generatePersonalizedStrategies(
  userId: string, // When user management is implemented
  preferences: {
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    savingsGoalPriority: 'emergency' | 'investment' | 'specific_goal';
    timeCommitment: 'minimal' | 'moderate' | 'high';
  }
): Promise<{
  strategies: Array<{
    title: string;
    description: string;
    steps: string[];
    timeCommitment: string;
    expectedImpact: string;
    difficulty: 'easy' | 'moderate' | 'challenging';
  }>;
}> {
  const strategies = [];
  
  // Conservative strategies
  if (preferences.riskTolerance === 'conservative') {
    strategies.push({
      title: 'Automated Savings Approach',
      description: 'Set up automatic transfers to steadily build your savings without thinking about it.',
      steps: [
        'Calculate 10% of your monthly income',
        'Set up automatic transfer on payday',
        'Start with a high-yield savings account',
        'Increase by 1% every 3 months'
      ],
      timeCommitment: 'Minimal - 30 minutes setup',
      expectedImpact: 'Save 10-15% more within 6 months',
      difficulty: 'easy'
    });
  }
  
  // Moderate strategies
  if (preferences.riskTolerance === 'moderate') {
    strategies.push({
      title: 'Smart Budget Reallocation',
      description: 'Optimize your budget by moving money from underused categories to priority areas.',
      steps: [
        'Review last 3 months of spending',
        'Identify categories under 60% utilization',
        'Reallocate 50% of unused budget to savings or debt payments',
        'Monitor and adjust monthly'
      ],
      timeCommitment: 'Moderate - 2 hours monthly',
      expectedImpact: 'Improve budget efficiency by 20-30%',
      difficulty: 'moderate'
    });
  }
  
  // Aggressive strategies
  if (preferences.riskTolerance === 'aggressive') {
    strategies.push({
      title: 'Zero-Based Budgeting Implementation',
      description: 'Completely restructure your budget to maximize every dollar\'s impact.',
      steps: [
        'List all sources of income',
        'Assign every dollar to a specific purpose',
        'Prioritize essentials, then savings, then wants',
        'Review and adjust weekly for first month'
      ],
      timeCommitment: 'High - 4+ hours initial setup, 1 hour weekly',
      expectedImpact: 'Potentially save 30-50% more',
      difficulty: 'challenging'
    });
  }
  
  // Add goal-specific strategies
  if (preferences.savingsGoalPriority === 'emergency') {
    strategies.push({
      title: 'Emergency Fund Builder',
      description: 'Build a robust emergency fund using the envelope method.',
      steps: [
        'Calculate 3-6 months of essential expenses',
        'Create separate high-yield savings account',
        'Use the 52-week challenge approach',
        'Automate weekly transfers of increasing amounts'
      ],
      timeCommitment: preferences.timeCommitment === 'minimal' ? 'Minimal - automated' : 'Moderate',
      expectedImpact: 'Complete emergency fund in 12-18 months',
      difficulty: preferences.timeCommitment === 'minimal' ? 'easy' : 'moderate'
    });
  }
  
  return { strategies };
}

// Helper function to suggest budget reallocations
export async function suggestBudgetReallocations(): Promise<{
  reallocations: Array<{
    fromCategory: string;
    toCategory: string;
    amount: number;
    reasoning: string;
    impact: string;
  }>;
  totalPotentialSavings: number;
}> {
  const underutilizedBudgets = await identifyUnderutilizedBudgets();
  const db = getDb();
  
  // Get categories that are consistently over budget
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  const overBudgetCategories = await db
    .select({
      categoryName: categoriesSchema.name,
      budgetAmount: budgetsSchema.amount,
      actualSpending: sql<number>`COALESCE(SUM(${transactionsSchema.amount}), 0)`,
    })
    .from(budgetsSchema)
    .leftJoin(categoriesSchema, eq(budgetsSchema.categoryId, categoriesSchema.id))
    .leftJoin(
      transactionsSchema,
      and(
        eq(transactionsSchema.categoryId, budgetsSchema.categoryId),
        eq(transactionsSchema.type, 'expense'),
        sql`strftime('%Y-%m', ${transactionsSchema.date}) = ${currentMonth}`
      )
    )
    .where(eq(budgetsSchema.isActive, true))
    .groupBy(budgetsSchema.id, categoriesSchema.name, budgetsSchema.amount)
    .having(sql`${sql<number>`COALESCE(SUM(${transactionsSchema.amount}), 0)`} > ${budgetsSchema.amount}`);
  
  const reallocations = [];
  let totalPotentialSavings = 0;
  
  // Suggest moving money from underutilized to over-budget categories
  for (const overBudget of overBudgetCategories) {
    const shortage = overBudget.actualSpending - overBudget.budgetAmount;
    
    for (const underutilized of underutilizedBudgets) {
      if (underutilized.potentialReallocation >= shortage * 0.5) {
        const reallocationAmount = Math.min(
          shortage,
          underutilized.potentialReallocation * 0.7 // Don't reallocate everything
        );
        
        reallocations.push({
          fromCategory: underutilized.categoryName,
          toCategory: overBudget.categoryName || 'Unknown',
          amount: reallocationAmount,
          reasoning: `${underutilized.categoryName} is only ${underutilized.utilizationRate.toFixed(0)}% utilized, while ${overBudget.categoryName} is over budget by $${shortage.toFixed(0)}`,
          impact: `Better align budget with actual spending patterns`
        });
        
        totalPotentialSavings += reallocationAmount * 0.1; // Assume 10% efficiency gain
        break;
      }
    }
  }
  
  return {
    reallocations,
    totalPotentialSavings
  };
}
