'use server';

import { getDb } from '@/lib/database/connection';
import { 
  transactionsSchema, 
  categoriesSchema, 
  budgetsSchema, 
  savingsGoalsSchema,
  recurringTransactionsSchema 
} from '@/lib/database/schemas';
import { eq, desc, sql, and, gte, lte } from 'drizzle-orm';
import { geminiAnalyzer, type TFinancialData, type TForecastRequest } from '@/lib/gemini';

// Types for forecasting responses
export interface CashFlowProjection {
  monthlyProjections: Array<{
    month: number;
    projectedIncome: number;
    projectedExpenses: number;
    netCashFlow: number;
    confidence: number;
  }>;
  summary: {
    totalProjectedIncome: number;
    totalProjectedExpenses: number;
    averageMonthlyFlow: number;
    confidenceLevel: number;
    riskFactors: string[];
    opportunities: string[];
  };
}

export interface SpendingAnalysis {
  spendingTrends: {
    topCategories: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
    averageMonthlySpending: number;
    spendingVolatility: number;
    seasonalPatterns: string[];
  };
  anomalies: Array<{
    type: 'unusual_spending' | 'category_spike' | 'timing_anomaly';
    description: string;
    amount: number;
    date: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  insights: {
    recommendations: string[];
    potentialSavings: number;
    riskAreas: string[];
    optimizationOpportunities: string[];
  };
}

export interface BudgetForecast {
  budgetForecasts: Array<{
    categoryName: string;
    currentBudget: number;
    recommendedBudget: number;
    projectedSpending: number;
    variance: number;
    confidence: number;
    reasoning: string;
  }>;
  overallAnalysis: {
    totalCurrentBudgets: number;
    totalRecommendedBudgets: number;
    estimatedSavings: number;
    riskCategories: string[];
    budgetingTips: string[];
  };
}

export interface FinancialAdvice {
  financialHealthScore: number;
  priorityActions: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    impact: string;
    timeframe: string;
  }>;
  savingsOptimization: {
    currentSavingsRate: number;
    recommendedSavingsRate: number;
    potentialMonthlySavings: number;
    strategies: string[];
  };
  goalAchievability: Array<{
    goalName: string;
    feasibility: 'easy' | 'moderate' | 'challenging' | 'unrealistic';
    timeToCompletion: string;
    recommendations: string[];
  }>;
  riskAssessment: {
    emergencyFundStatus: 'adequate' | 'insufficient' | 'none';
    debtLevel: 'low' | 'moderate' | 'high';
    incomeStability: 'stable' | 'variable' | 'uncertain';
    riskFactors: string[];
  };
  nextSteps: string[];
}

// Helper function to gather all financial data
export async function gatherFinancialData(): Promise<TFinancialData> {
  const db = getDb();
  
  // Get recent transactions (last 12 months)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  
  const transactions = await db
    .select({
      amount: transactionsSchema.amount,
      type: transactionsSchema.type,
      date: transactionsSchema.date,
      categoryName: categoriesSchema.name,
      description: transactionsSchema.description
    })
    .from(transactionsSchema)
    .leftJoin(categoriesSchema, eq(transactionsSchema.categoryId, categoriesSchema.id))
    .where(gte(transactionsSchema.date, twelveMonthsAgo.toISOString().split('T')[0]))
    .orderBy(desc(transactionsSchema.date));
  
  // Get current budgets with spending
  const budgets = await db
    .select({
      budgetName: budgetsSchema.name,
      budgetAmount: budgetsSchema.amount,
      spentAmount: sql<number>`0`, // Will be calculated separately
      categoryName: categoriesSchema.name
    })
    .from(budgetsSchema)
    .leftJoin(categoriesSchema, eq(budgetsSchema.categoryId, categoriesSchema.id))
    .where(eq(budgetsSchema.isActive, true));
  
  // Calculate actual spending for budgets
  const budgetsWithSpending = await Promise.all(
    budgets.map(async (budget) => {
      const [spending] = await db
        .select({
          spent: sql<number>`COALESCE(SUM(amount), 0)`
        })
        .from(transactionsSchema)
        .leftJoin(categoriesSchema, eq(transactionsSchema.categoryId, categoriesSchema.id))
        .where(
          and(
            eq(categoriesSchema.name, budget.categoryName),
            eq(transactionsSchema.type, 'expense'),
            sql`strftime('%Y-%m', ${transactionsSchema.date}) = strftime('%Y-%m', 'now')`
          )
        );
      
      return {
        budgetName: budget.budgetName,
        budgetAmount: budget.budgetAmount,
        spentAmount: spending.spent,
        categoryName: budget.categoryName || 'Unknown'
      };
    })
  );
  
  // Get savings goals
  const savingsGoals = await db
    .select({
      goalName: savingsGoalsSchema.name,
      targetAmount: savingsGoalsSchema.targetAmount,
      currentAmount: savingsGoalsSchema.currentAmount,
      targetDate: savingsGoalsSchema.targetDate
    })
    .from(savingsGoalsSchema)
    .where(eq(savingsGoalsSchema.isActive, true));
  
  // Get recurring transactions
  const recurringTransactions = await db
    .select({
      name: recurringTransactionsSchema.name,
      amount: recurringTransactionsSchema.amount,
      type: recurringTransactionsSchema.type,
      frequency: recurringTransactionsSchema.frequency,
      isActive: recurringTransactionsSchema.isActive
    })
    .from(recurringTransactionsSchema);
  
  return {
    transactions: transactions.map(t => ({
      amount: t.amount,
      type: t.type,
      date: t.date,
      categoryName: t.categoryName || 'Uncategorized',
      description: t.description || 'No description'
    })),
    budgets: budgetsWithSpending,
    savingsGoals: savingsGoals.map(g => ({
      goalName: g.goalName,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      targetDate: g.targetDate || undefined
    })),
    recurringTransactions: recurringTransactions.map(r => ({
      name: r.name,
      amount: r.amount,
      type: r.type,
      frequency: r.frequency,
      isActive: r.isActive
    }))
  };
}

// Cash Flow Projections
export async function generateCashFlowProjection(
  timeframe: number = 6,
  scenarios?: { incomeChange?: number; expenseChange?: number }
): Promise<CashFlowProjection> {
  try {
    const financialData = await gatherFinancialData();
    
    const request: TForecastRequest = {
      type: 'cash_flow',
      timeframe,
      data: financialData,
      scenarios
    };
    
    return await geminiAnalyzer.analyzeCashFlowProjection(request);
  } catch (error) {
    console.error('Cash flow projection error:', error);
    throw new Error('Failed to generate cash flow projection');
  }
}

// Spending Pattern Analysis
export async function generateSpendingAnalysis(): Promise<SpendingAnalysis> {
  try {
    const financialData = await gatherFinancialData();
    
    const request: TForecastRequest = {
      type: 'spending_analysis',
      timeframe: 12,
      data: financialData
    };
    
    return await geminiAnalyzer.generateSpendingAnalysis(request);
  } catch (error) {
    console.error('Spending analysis error:', error);
    throw new Error('Failed to generate spending analysis');
  }
}

// Budget Forecasting
export async function generateBudgetForecast(timeframe: number = 3): Promise<BudgetForecast> {
  try {
    const financialData = await gatherFinancialData();
    
    const request: TForecastRequest = {
      type: 'budget_forecast',
      timeframe,
      data: financialData
    };
    
    return await geminiAnalyzer.generateBudgetForecast(request);
  } catch (error) {
    console.error('Budget forecast error:', error);
    throw new Error('Failed to generate budget forecast');
  }
}

// Financial Advice Generation
export async function generateFinancialAdvice(): Promise<FinancialAdvice> {
  try {
    const financialData = await gatherFinancialData();
    
    const request: TForecastRequest = {
      type: 'financial_advice',
      timeframe: 12,
      data: financialData
    };
    
    return await geminiAnalyzer.generateFinancialAdvice(request);
  } catch (error) {
    console.error('Financial advice error:', error);
    throw new Error('Failed to generate financial advice');
  }
}

// Savings Goal Projections
export async function generateSavingsProjections(): Promise<{
  goalProjections: Array<{
    goalName: string;
    currentAmount: number;
    targetAmount: number;
    monthsToCompletion: number;
    recommendedMonthlySaving: number;
    projectedCompletionDate: string;
    feasibility: 'easy' | 'moderate' | 'challenging' | 'unrealistic';
  }>;
  overallSavingsHealth: {
    totalGoalValue: number;
    totalCurrentSavings: number;
    averageCompletionTime: number;
    riskFactors: string[];
    recommendations: string[];
  };
}> {
  try {
    const financialData = await gatherFinancialData();
    
    // Calculate basic projections
    const goalProjections = financialData.savingsGoals.map(goal => {
      const remaining = goal.targetAmount - goal.currentAmount;
      const monthsToCompletion = goal.targetDate ? 
        Math.max(1, Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30))) : 
        12;
      
      const recommendedMonthlySaving = remaining / monthsToCompletion;
      const projectedCompletionDate = new Date(Date.now() + monthsToCompletion * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      let feasibility: 'easy' | 'moderate' | 'challenging' | 'unrealistic' = 'moderate';
      if (recommendedMonthlySaving < 100) feasibility = 'easy';
      else if (recommendedMonthlySaving < 500) feasibility = 'moderate';
      else if (recommendedMonthlySaving < 1000) feasibility = 'challenging';
      else feasibility = 'unrealistic';
      
      return {
        goalName: goal.goalName,
        currentAmount: goal.currentAmount,
        targetAmount: goal.targetAmount,
        monthsToCompletion,
        recommendedMonthlySaving,
        projectedCompletionDate,
        feasibility
      };
    });
    
    const totalGoalValue = financialData.savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalCurrentSavings = financialData.savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
    const averageCompletionTime = goalProjections.reduce((sum, g) => sum + g.monthsToCompletion, 0) / Math.max(1, goalProjections.length);
    
    return {
      goalProjections,
      overallSavingsHealth: {
        totalGoalValue,
        totalCurrentSavings,
        averageCompletionTime,
        riskFactors: ['Market volatility', 'Income instability'],
        recommendations: ['Automate savings', 'Review goals quarterly']
      }
    };
  } catch (error) {
    console.error('Savings projection error:', error);
    throw new Error('Failed to generate savings projections');
  }
}

// Income Stability Analysis
export async function analyzeIncomeStability(): Promise<{
  stabilityScore: number; // 0-100
  incomeVariability: number; // coefficient of variation
  trendAnalysis: {
    trend: 'increasing' | 'stable' | 'decreasing';
    monthlyGrowthRate: number;
    seasonalPattern: boolean;
  };
  riskFactors: string[];
  recommendations: string[];
}> {
  try {
    const financialData = await gatherFinancialData();
    
    const incomeTransactions = financialData.transactions
      .filter(t => t.type === 'income')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (incomeTransactions.length < 3) {
      return {
        stabilityScore: 50,
        incomeVariability: 0,
        trendAnalysis: {
          trend: 'stable',
          monthlyGrowthRate: 0,
          seasonalPattern: false
        },
        riskFactors: ['Insufficient income history'],
        recommendations: ['Track income sources more consistently']
      };
    }
    
    // Calculate monthly income totals
    const monthlyIncomes = new Map<string, number>();
    incomeTransactions.forEach(t => {
      const monthKey = t.date.substring(0, 7); // YYYY-MM
      monthlyIncomes.set(monthKey, (monthlyIncomes.get(monthKey) || 0) + t.amount);
    });
    
    const incomeValues = Array.from(monthlyIncomes.values());
    const avgIncome = incomeValues.reduce((sum, val) => sum + val, 0) / incomeValues.length;
    
    // Calculate coefficient of variation
    const variance = incomeValues.reduce((sum, val) => sum + Math.pow(val - avgIncome, 2), 0) / incomeValues.length;
    const stdDev = Math.sqrt(variance);
    const incomeVariability = avgIncome > 0 ? (stdDev / avgIncome) * 100 : 100;
    
    // Stability score (inverse of variability)
    const stabilityScore = Math.max(0, Math.min(100, 100 - incomeVariability * 2));
    
    // Simple trend analysis
    const firstHalf = incomeValues.slice(0, Math.floor(incomeValues.length / 2));
    const secondHalf = incomeValues.slice(Math.floor(incomeValues.length / 2));
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    const changeThreshold = 0.05; // 5%
    if ((secondAvg - firstAvg) / firstAvg > changeThreshold) trend = 'increasing';
    else if ((firstAvg - secondAvg) / firstAvg > changeThreshold) trend = 'decreasing';
    
    const monthlyGrowthRate = incomeValues.length > 1 ? 
      ((incomeValues[incomeValues.length - 1] - incomeValues[0]) / incomeValues[0]) / incomeValues.length * 100 : 0;
    
    const riskFactors = [];
    if (stabilityScore < 70) riskFactors.push('High income variability');
    if (trend === 'decreasing') riskFactors.push('Declining income trend');
    if (incomeTransactions.length < 6) riskFactors.push('Limited income history');
    
    const recommendations = [];
    if (stabilityScore < 50) recommendations.push('Diversify income sources');
    if (incomeVariability > 30) recommendations.push('Build larger emergency fund');
    recommendations.push('Track income patterns monthly');
    
    return {
      stabilityScore,
      incomeVariability,
      trendAnalysis: {
        trend,
        monthlyGrowthRate,
        seasonalPattern: incomeValues.length >= 12 // Simplified check
      },
      riskFactors,
      recommendations
    };
  } catch (error) {
    console.error('Income stability analysis error:', error);
    throw new Error('Failed to analyze income stability');
  }
}

// Expense Anomaly Detection
export async function detectExpenseAnomalies(): Promise<{
  anomalies: Array<{
    transactionId?: number;
    date: string;
    amount: number;
    category: string;
    description: string;
    anomalyType: 'amount_spike' | 'frequency_change' | 'unusual_category' | 'timing_anomaly';
    severity: 'low' | 'medium' | 'high';
    explanation: string;
  }>;
  summary: {
    totalAnomalies: number;
    highSeverityCount: number;
    affectedCategories: string[];
    totalImpact: number;
  };
}> {
  try {
    const financialData = await gatherFinancialData();
    
    const expenseTransactions = financialData.transactions
      .filter(t => t.type === 'expense')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Calculate category averages and thresholds
    const categoryStats = new Map<string, { amounts: number[], avgAmount: number, stdDev: number }>();
    
    expenseTransactions.forEach(t => {
      if (!categoryStats.has(t.categoryName)) {
        categoryStats.set(t.categoryName, { amounts: [], avgAmount: 0, stdDev: 0 });
      }
      categoryStats.get(t.categoryName)!.amounts.push(t.amount);
    });
    
    // Calculate statistics for each category
    categoryStats.forEach((stats, category) => {
      stats.avgAmount = stats.amounts.reduce((sum, amt) => sum + amt, 0) / stats.amounts.length;
      const variance = stats.amounts.reduce((sum, amt) => sum + Math.pow(amt - stats.avgAmount, 2), 0) / stats.amounts.length;
      stats.stdDev = Math.sqrt(variance);
    });
    
    const anomalies: Array<{
      date: string;
      amount: number;
      category: string;
      description: string;
      anomalyType: 'amount_spike' | 'frequency_change' | 'unusual_category' | 'timing_anomaly';
      severity: 'low' | 'medium' | 'high';
      explanation: string;
    }> = [];
    
    // Detect amount spikes
    expenseTransactions.forEach(transaction => {
      const categoryData = categoryStats.get(transaction.categoryName);
      if (categoryData && categoryData.amounts.length > 3) {
        const threshold = categoryData.avgAmount + (2 * categoryData.stdDev);
        
        if (transaction.amount > threshold) {
          let severity: 'low' | 'medium' | 'high' = 'low';
          const multiplier = transaction.amount / categoryData.avgAmount;
          
          if (multiplier > 3) severity = 'high';
          else if (multiplier > 2) severity = 'medium';
          
          anomalies.push({
            date: transaction.date,
            amount: transaction.amount,
            category: transaction.categoryName,
            description: transaction.description,
            anomalyType: 'amount_spike',
            severity,
            explanation: `Amount is ${multiplier.toFixed(1)}x higher than average for ${transaction.categoryName}`
          });
        }
      }
    });
    
    const affectedCategories = [...new Set(anomalies.map(a => a.category))];
    const totalImpact = anomalies.reduce((sum, a) => sum + a.amount, 0);
    const highSeverityCount = anomalies.filter(a => a.severity === 'high').length;
    
    return {
      anomalies: anomalies.slice(0, 20), // Limit to most recent anomalies
      summary: {
        totalAnomalies: anomalies.length,
        highSeverityCount,
        affectedCategories,
        totalImpact
      }
    };
  } catch (error) {
    console.error('Anomaly detection error:', error);
    throw new Error('Failed to detect expense anomalies');
  }
}
