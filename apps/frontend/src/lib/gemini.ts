import { GoogleGenerativeAI } from '@google/generative-ai';

type TFinancialData = {
  transactions: Array<{
    amount: number;
    type: 'income' | 'expense';
    date: string;
    categoryName: string;
    description: string;
  }>;
  budgets: Array<{
    budgetName: string;
    budgetAmount: number;
    spentAmount: number;
    categoryName: string;
  }>;
  savingsGoals: Array<{
    goalName: string;
    targetAmount: number;
    currentAmount: number;
    targetDate?: string;
  }>;
  recurringTransactions: Array<{
    name: string;
    amount: number;
    type: 'income' | 'expense';
    frequency: string;
    isActive: boolean;
  }>;
};

type TForecastRequest = {
  type: 'cash_flow' | 'budget_forecast' | 'savings_projection' | 'spending_analysis' | 'financial_advice';
  timeframe: number; // months
  data: TFinancialData;
  scenarios?: {
    incomeChange?: number; // percentage
    expenseChange?: number; // percentage
    newGoalAmount?: number;
  };
};

class GeminiFinancialAnalyzer {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async analyzeCashFlowProjection(request: TForecastRequest) {
    const prompt = this.buildCashFlowPrompt(request);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return this.parseCashFlowResponse(response.text());
    } catch (error) {
      console.error('Gemini API error:', error);
      return this.getFallbackCashFlowProjection(request);
    }
  }

  async generateSpendingAnalysis(request: TForecastRequest) {
    const prompt = this.buildSpendingAnalysisPrompt(request);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return this.parseSpendingAnalysis(response.text());
    } catch (error) {
      console.error('Gemini API error:', error);
      return this.getFallbackSpendingAnalysis(request);
    }
  }

  async generateBudgetForecast(request: TForecastRequest) {
    const prompt = this.buildBudgetForecastPrompt(request);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return this.parseBudgetForecast(response.text());
    } catch (error) {
      console.error('Gemini API error:', error);
      return this.getFallbackBudgetForecast(request);
    }
  }

  async generateFinancialAdvice(request: TForecastRequest) {
    const prompt = this.buildFinancialAdvicePrompt(request);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return this.parseFinancialAdvice(response.text());
    } catch (error) {
      console.error('Gemini API error:', error);
      return this.getFallbackFinancialAdvice(request);
    }
  }

  async parseNaturalLanguageQuery(query: string, availableCategories: string[] = []): Promise<TNaturalLanguageSearchResult> {
    const prompt = this.buildNaturalLanguagePrompt(query, availableCategories);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return this.parseNaturalLanguageResponse(response.text());
    } catch (error) {
      console.error('Natural language parsing error:', error);
      return this.getFallbackNaturalLanguageResult(query);
    }
  }

  async generateBudgetOptimization(data: TFinancialData): Promise<TBudgetOptimization> {
    const prompt = this.buildBudgetOptimizationPrompt(data);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return this.parseBudgetOptimizationResponse(response.text());
    } catch (error) {
      console.error('Budget optimization error:', error);
      return this.getFallbackBudgetOptimization();
    }
  }

  private buildCashFlowPrompt(request: TForecastRequest): string {
    const { data, timeframe, scenarios } = request;
    
    const totalIncome = data.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = data.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyRecurringIncome = data.recurringTransactions
      .filter(t => t.type === 'income' && t.isActive && t.frequency === 'monthly')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const monthlyRecurringExpenses = data.recurringTransactions
      .filter(t => t.type === 'expense' && t.isActive && t.frequency === 'monthly')
      .reduce((sum, t) => sum + t.amount, 0);

    return `
As a financial analyst, analyze this financial data and provide cash flow projections for the next ${timeframe} months.

CURRENT FINANCIAL DATA:
- Historical Income: $${totalIncome}
- Historical Expenses: $${totalExpenses}
- Monthly Recurring Income: $${monthlyRecurringIncome}
- Monthly Recurring Expenses: $${monthlyRecurringExpenses}

SCENARIO ADJUSTMENTS:
${scenarios?.incomeChange ? `- Income change: ${scenarios.incomeChange > 0 ? '+' : ''}${scenarios.incomeChange}%` : ''}
${scenarios?.expenseChange ? `- Expense change: ${scenarios.expenseChange > 0 ? '+' : ''}${scenarios.expenseChange}%` : ''}

Please provide a JSON response with the following structure:
{
  "monthlyProjections": [
    {
      "month": 1,
      "projectedIncome": number,
      "projectedExpenses": number,
      "netCashFlow": number,
      "confidence": number (0-100)
    }
  ],
  "summary": {
    "totalProjectedIncome": number,
    "totalProjectedExpenses": number,
    "averageMonthlyFlow": number,
    "confidenceLevel": number,
    "riskFactors": ["string"],
    "opportunities": ["string"]
  }
}

Focus on realistic projections based on historical patterns, seasonal trends, and the provided scenarios.
`;
  }

  private buildSpendingAnalysisPrompt(request: TForecastRequest): string {
    const { data } = request;
    
    const categorySpending = data.transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.categoryName] = (acc[t.categoryName] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    return `
As a financial analyst, analyze these spending patterns and provide insights:

EXPENSE DATA BY CATEGORY:
${Object.entries(categorySpending).map(([category, amount]) => 
  `- ${category}: $${amount}`
).join('\n')}

TRANSACTION HISTORY:
${data.transactions.slice(0, 20).map(t => 
  `${t.date}: ${t.type === 'income' ? '+' : '-'}$${t.amount} (${t.categoryName}) - ${t.description}`
).join('\n')}

Please provide a JSON response with:
{
  "spendingTrends": {
    "topCategories": [{"category": "string", "amount": number, "percentage": number}],
    "averageMonthlySpending": number,
    "spendingVolatility": number,
    "seasonalPatterns": ["string"]
  },
  "anomalies": [
    {
      "type": "unusual_spending" | "category_spike" | "timing_anomaly",
      "description": "string",
      "amount": number,
      "date": "string",
      "severity": "low" | "medium" | "high"
    }
  ],
  "insights": {
    "recommendations": ["string"],
    "potentialSavings": number,
    "riskAreas": ["string"],
    "optimizationOpportunities": ["string"]
  }
}
`;
  }

  private buildBudgetForecastPrompt(request: TForecastRequest): string {
    const { data, timeframe } = request;
    
    return `
As a financial analyst, create budget forecasts based on this data:

CURRENT BUDGETS:
${data.budgets.map(b => 
  `- ${b.budgetName}: $${b.budgetAmount} budget, $${b.spentAmount} spent (${Math.round((b.spentAmount / b.budgetAmount) * 100)}%)`
).join('\n')}

SPENDING HISTORY:
${data.transactions.filter(t => t.type === 'expense').slice(0, 15).map(t => 
  `${t.date}: $${t.amount} (${t.categoryName})`
).join('\n')}

Provide a ${timeframe}-month budget forecast with JSON response:
{
  "budgetForecasts": [
    {
      "categoryName": "string",
      "currentBudget": number,
      "recommendedBudget": number,
      "projectedSpending": number,
      "variance": number,
      "confidence": number,
      "reasoning": "string"
    }
  ],
  "overallAnalysis": {
    "totalCurrentBudgets": number,
    "totalRecommendedBudgets": number,
    "estimatedSavings": number,
    "riskCategories": ["string"],
    "budgetingTips": ["string"]
  }
}
`;
  }

  private buildFinancialAdvicePrompt(request: TForecastRequest): string {
    const { data } = request;
    
    const totalIncome = data.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = data.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    return `
As a personal financial advisor, provide comprehensive advice based on this financial profile:

FINANCIAL OVERVIEW:
- Total Income: $${totalIncome}
- Total Expenses: $${totalExpenses}
- Savings Rate: ${savingsRate.toFixed(1)}%
- Active Goals: ${data.savingsGoals.length}
- Budget Categories: ${data.budgets.length}

SAVINGS GOALS:
${data.savingsGoals.map(g => 
  `- ${g.goalName}: $${g.currentAmount}/$${g.targetAmount} (${Math.round((g.currentAmount / g.targetAmount) * 100)}%)${g.targetDate ? ` by ${g.targetDate}` : ''}`
).join('\n')}

Provide personalized advice in JSON format:
{
  "financialHealthScore": number (0-100),
  "priorityActions": [
    {
      "action": "string",
      "priority": "high" | "medium" | "low",
      "impact": "string",
      "timeframe": "string"
    }
  ],
  "savingsOptimization": {
    "currentSavingsRate": number,
    "recommendedSavingsRate": number,
    "potentialMonthlySavings": number,
    "strategies": ["string"]
  },
  "goalAchievability": [
    {
      "goalName": "string",
      "feasibility": "easy" | "moderate" | "challenging" | "unrealistic",
      "timeToCompletion": "string",
      "recommendations": ["string"]
    }
  ],
  "riskAssessment": {
    "emergencyFundStatus": "adequate" | "insufficient" | "none",
    "debtLevel": "low" | "moderate" | "high",
    "incomeStability": "stable" | "variable" | "uncertain",
    "riskFactors": ["string"]
  },
  "nextSteps": ["string"]
}
`;
  }

  private parseCashFlowResponse(response: string) {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
    }
    
    return this.getFallbackCashFlowProjection({ timeframe: 6 } as TForecastRequest);
  }

  private parseSpendingAnalysis(response: string) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse spending analysis:', error);
    }
    
    return this.getFallbackSpendingAnalysis({} as TForecastRequest);
  }

  private parseBudgetForecast(response: string) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse budget forecast:', error);
    }
    
    return this.getFallbackBudgetForecast({} as TForecastRequest);
  }

  private parseFinancialAdvice(response: string) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse financial advice:', error);
    }
    
    return this.getFallbackFinancialAdvice({} as TForecastRequest);
  }

  // Fallback methods for when AI is unavailable
  private getFallbackCashFlowProjection(request: TForecastRequest) {
    const monthlyProjections = [];
    for (let i = 1; i <= request.timeframe; i++) {
      monthlyProjections.push({
        month: i,
        projectedIncome: 5000,
        projectedExpenses: 4200,
        netCashFlow: 800,
        confidence: 75
      });
    }
    
    return {
      monthlyProjections,
      summary: {
        totalProjectedIncome: 5000 * request.timeframe,
        totalProjectedExpenses: 4200 * request.timeframe,
        averageMonthlyFlow: 800,
        confidenceLevel: 75,
        riskFactors: ['Limited historical data'],
        opportunities: ['Potential for increased savings']
      }
    };
  }

  private getFallbackSpendingAnalysis(request: TForecastRequest) {
    return {
      spendingTrends: {
        topCategories: [
          { category: 'Food & Dining', amount: 800, percentage: 25 },
          { category: 'Transportation', amount: 600, percentage: 19 },
          { category: 'Utilities', amount: 400, percentage: 13 }
        ],
        averageMonthlySpending: 3200,
        spendingVolatility: 15,
        seasonalPatterns: ['Higher spending in December', 'Lower utility costs in spring']
      },
      anomalies: [],
      insights: {
        recommendations: ['Review subscription services', 'Consider meal planning'],
        potentialSavings: 200,
        riskAreas: ['Variable dining expenses'],
        optimizationOpportunities: ['Bundle insurance policies']
      }
    };
  }

    private getFallbackBudgetForecast(_request: TForecastRequest) {
    return {
      budgetForecasts: [],
      overallAnalysis: {
        totalCurrentBudgets: 4000,
        totalRecommendedBudgets: 3800,
        estimatedSavings: 200,
        riskCategories: ['Entertainment'],
        budgetingTips: ['Use the 50/30/20 rule', 'Track all expenses']
      }
    };
  }

  private getFallbackFinancialAdvice(request: TForecastRequest) {
    return {
      financialHealthScore: 75,
      priorityActions: [
        {
          action: 'Build emergency fund',
          priority: 'high' as const,
          impact: 'Provides financial security',
          timeframe: '3-6 months'
        }
      ],
      savingsOptimization: {
        currentSavingsRate: 15,
        recommendedSavingsRate: 20,
        potentialMonthlySavings: 250,
        strategies: ['Automate savings', 'Reduce discretionary spending']
      },
      goalAchievability: [],
      riskAssessment: {
        emergencyFundStatus: 'insufficient' as const,
        debtLevel: 'low' as const,
        incomeStability: 'stable' as const,
        riskFactors: ['No emergency fund']
      },
      nextSteps: ['Set up automatic savings', 'Review and optimize budget']
    };
  }

  // Natural Language Processing Methods
  private buildNaturalLanguagePrompt(query: string, availableCategories: string[]): string {
    const currentDate = new Date().toISOString().split('T')[0];
    
    return `
As a natural language processing assistant for financial transaction searches, parse this user query and extract structured search parameters.

USER QUERY: "${query}"

AVAILABLE CATEGORIES: ${availableCategories.join(', ')}
CURRENT DATE: ${currentDate}

Analyze the query and extract:
1. Date ranges (convert relative dates like "2 months ago", "last week", "this year" to absolute dates)
2. Amount ranges (interpret "around 20", "roughly 50 euros", "between 10-30")
3. Category matches (fuzzy match against available categories)
4. Transaction type (income/expense based on context)
5. Description keywords
6. Payee/merchant names

Examples:
- "medicine I bought 2 months ago around 20 euros" → startDate: 2 months ago, endDate: now, minAmount: 15, maxAmount: 25, description: "medicine"
- "salary from last month" → type: income, startDate: start of last month, endDate: end of last month, description: "salary"
- "groceries this week under 100" → categories: ["groceries"], maxAmount: 100, startDate: start of this week

Provide JSON response:
{
  "searchParams": {
    "startDate": "YYYY-MM-DD" | null,
    "endDate": "YYYY-MM-DD" | null,
    "minAmount": number | null,
    "maxAmount": number | null,
    "categories": ["string"] | null,
    "description": "string" | null,
    "payee": "string" | null,
    "type": "income" | "expense" | null
  },
  "confidence": number (0-100),
  "interpretation": "Human readable explanation of how the query was interpreted",
  "alternatives": ["alternative interpretations if confidence < 80"]
}
`;
  }

  private buildBudgetOptimizationPrompt(data: TFinancialData): string {
    const categorySpending = data.transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.categoryName] = (acc[t.categoryName] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const budgetUtilization = data.budgets.map(b => ({
      category: b.categoryName,
      budget: b.budgetAmount,
      spent: b.spentAmount,
      utilization: b.budgetAmount > 0 ? (b.spentAmount / b.budgetAmount) * 100 : 0
    }));

    return `
As a financial optimization specialist, analyze this financial data and provide comprehensive budget optimization recommendations.

CURRENT BUDGET UTILIZATION:
${budgetUtilization.map(b => 
  `- ${b.category}: ${b.utilization.toFixed(1)}% (${b.spent}/${b.budget})`
).join('\n')}

ACTUAL SPENDING BY CATEGORY:
${Object.entries(categorySpending).map(([category, amount]) => 
  `- ${category}: $${amount}`
).join('\n')}

RECENT TRANSACTIONS:
${data.transactions.slice(0, 30).map(t => 
  `${t.date}: ${t.type === 'income' ? '+' : '-'}$${t.amount} (${t.categoryName}) - ${t.description}`
).join('\n')}

Analyze and provide optimization recommendations focusing on:
1. Budget reallocations (move funds between categories)
2. Budget reductions (eliminate waste)
3. Budget increases (address consistent overspending)
4. Budget eliminations (unused categories)
5. New budget creation (unbudgeted spending areas)

Provide JSON response:
{
  "overallScore": number (0-100, current budget efficiency),
  "recommendations": [
    {
      "type": "reallocation" | "reduction" | "increase" | "elimination" | "creation",
      "category": "string",
      "currentAmount": number,
      "recommendedAmount": number,
      "reasoning": "detailed explanation",
      "impact": number (percentage improvement expected),
      "priority": "high" | "medium" | "low",
      "difficulty": "easy" | "moderate" | "challenging",
      "estimatedSavings": number
    }
  ],
  "savingsOpportunities": {
    "automaticSavings": number,
    "subscriptionOptimization": number,
    "categoryOptimization": number,
    "seasonalAdjustments": number
  },
  "riskAnalysis": {
    "overbudgetCategories": ["string"],
    "underutilizedBudgets": ["string"],
    "volatileSpending": ["string"],
    "recommendations": ["string"]
  },
  "timeline": {
    "immediate": ["actions for this month"],
    "shortTerm": ["actions for next 3 months"],
    "longTerm": ["strategic changes"]
  }
}
`;
  }

  private parseNaturalLanguageResponse(response: string): TNaturalLanguageSearchResult {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse natural language response:', error);
    }
    
    return this.getFallbackNaturalLanguageResult('');
  }

  private parseBudgetOptimizationResponse(response: string): TBudgetOptimization {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse budget optimization response:', error);
    }
    
    return this.getFallbackBudgetOptimization();
  }

  private getFallbackNaturalLanguageResult(query: string): TNaturalLanguageSearchResult {
    return {
      searchParams: {
        description: query
      },
      confidence: 30,
      interpretation: `Searching for transactions matching "${query}" (fallback - AI unavailable)`,
      alternatives: ['Try using specific keywords', 'Use date ranges like "last month"']
    };
  }

  private getFallbackBudgetOptimization(): TBudgetOptimization {
    return {
      overallScore: 65,
      recommendations: [
        {
          type: 'reduction',
          category: 'Entertainment',
          currentAmount: 300,
          recommendedAmount: 200,
          reasoning: 'Consider reducing entertainment expenses to increase savings',
          impact: 15,
          priority: 'medium',
          difficulty: 'moderate',
          estimatedSavings: 100
        }
      ],
      savingsOpportunities: {
        automaticSavings: 150,
        subscriptionOptimization: 75,
        categoryOptimization: 200,
        seasonalAdjustments: 100
      },
      riskAnalysis: {
        overbudgetCategories: ['Entertainment'],
        underutilizedBudgets: ['Emergency Fund'],
        volatileSpending: ['Dining Out'],
        recommendations: ['Set up automatic savings', 'Review subscription services']
      },
      timeline: {
        immediate: ['Cancel unused subscriptions', 'Set spending alerts'],
        shortTerm: ['Implement 50/30/20 budgeting rule', 'Automate savings transfers'],
        longTerm: ['Build emergency fund to 6 months expenses', 'Consider investment opportunities']
      }
    };
  }
}

// Export singleton instance
export const geminiAnalyzer = new GeminiFinancialAnalyzer();

// Export types
// Natural Language Query Types
type TNaturalLanguageSearchResult = {
  searchParams: {
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    categories?: string[];
    description?: string;
    payee?: string;
    type?: 'income' | 'expense';
  };
  confidence: number;
  interpretation: string;
  alternatives?: string[];
};

type TBudgetOptimization = {
  overallScore: number;
  recommendations: Array<{
    type: 'reallocation' | 'reduction' | 'increase' | 'elimination' | 'creation';
    category: string;
    currentAmount: number;
    recommendedAmount: number;
    reasoning: string;
    impact: number; // percentage impact
    priority: 'high' | 'medium' | 'low';
    difficulty: 'easy' | 'moderate' | 'challenging';
    estimatedSavings: number;
  }>;
  savingsOpportunities: {
    automaticSavings: number;
    subscriptionOptimization: number;
    categoryOptimization: number;
    seasonalAdjustments: number;
  };
  riskAnalysis: {
    overbudgetCategories: string[];
    underutilizedBudgets: string[];
    volatileSpending: string[];
    recommendations: string[];
  };
  timeline: {
    immediate: string[]; // Actions to take this month
    shortTerm: string[]; // Actions for next 3 months
    longTerm: string[]; // Strategic changes
  };
};

export type { TFinancialData, TForecastRequest, TNaturalLanguageSearchResult, TBudgetOptimization };
