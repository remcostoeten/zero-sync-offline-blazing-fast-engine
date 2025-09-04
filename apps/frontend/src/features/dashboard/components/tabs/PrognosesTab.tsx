'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  TrendingUp,
  TrendingDown,
  Brain,
  Target,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  BarChart3,
  PieChart,
  Calendar,
  Zap,
  Settings,
  RefreshCw,
  Lightbulb,
  Shield,
  Clock
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';

// Types
type TCashFlowProjection = {
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
};

type TSpendingAnalysis = {
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
    type: string;
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
};

type TFinancialAdvice = {
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
  riskAssessment: {
    emergencyFundStatus: 'adequate' | 'insufficient' | 'none';
    debtLevel: 'low' | 'moderate' | 'high';
    incomeStability: 'stable' | 'variable' | 'uncertain';
    riskFactors: string[];
  };
  nextSteps: string[];
};

type TProps = {
  onGenerateProjection: (timeframe: number, scenarios?: any) => Promise<TCashFlowProjection>;
  onGenerateAnalysis: () => Promise<TSpendingAnalysis>;
  onGenerateAdvice: () => Promise<TFinancialAdvice>;
};

function FinancialHealthScore({ score }: { score: number }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          Financial Health Score
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <div className="relative w-32 h-32 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-8 border-gray-200"></div>
          <div 
            className={cn(
              'absolute inset-0 rounded-full border-8 border-transparent',
              getScoreColor(score)
            )}
            style={{
              borderTopColor: 'currentColor',
              borderRightColor: 'currentColor',
              transform: `rotate(${(score / 100) * 360}deg)`
            }}
          ></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={cn('text-3xl font-bold', getScoreColor(score))}>
                {score}
              </div>
              <div className="text-xs text-muted-foreground">/ 100</div>
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <p className={cn('font-semibold text-lg', getScoreColor(score))}>
            {getScoreLabel(score)}
          </p>
          <p className="text-sm text-muted-foreground">
            Overall financial wellness
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function CashFlowProjectionChart({ projection }: { projection: TCashFlowProjection }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-green-500" />
          Cash Flow Projection
          <Badge variant="outline" className="ml-auto">
            {projection.summary.confidenceLevel}% confidence
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(projection.summary.totalProjectedIncome)}
              </p>
              <p className="text-xs text-muted-foreground">Total Income</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(projection.summary.totalProjectedExpenses)}
              </p>
              <p className="text-xs text-muted-foreground">Total Expenses</p>
            </div>
            <div className="text-center">
              <p className={cn(
                'text-2xl font-bold',
                projection.summary.averageMonthlyFlow >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {formatCurrency(projection.summary.averageMonthlyFlow)}
              </p>
              <p className="text-xs text-muted-foreground">Avg Monthly Flow</p>
            </div>
          </div>

          {/* Monthly Projections */}
          <div className="space-y-2">
            <h4 className="font-medium">Monthly Breakdown</h4>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {projection.monthlyProjections.map((month) => (
                <div key={month.month} className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">Month {month.month}</span>
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      'text-sm font-medium',
                      month.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {formatCurrency(month.netCashFlow)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {month.confidence}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Factors & Opportunities */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-orange-600 mb-2">Risk Factors</h4>
              <ul className="space-y-1">
                {projection.summary.riskFactors.map((risk, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-1">
                    <AlertTriangle className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-600 mb-2">Opportunities</h4>
              <ul className="space-y-1">
                {projection.summary.opportunities.map((opportunity, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-1">
                    <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                    {opportunity}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SpendingAnalysisWidget({ analysis }: { analysis: TSpendingAnalysis }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="w-5 h-5 text-purple-500" />
          Spending Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Top Categories */}
          <div>
            <h4 className="font-medium mb-3">Top Spending Categories</h4>
            <div className="space-y-2">
              {analysis.spendingTrends.topCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{category.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {formatCurrency(category.amount)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {category.percentage.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-lg font-bold">
                {formatCurrency(analysis.spendingTrends.averageMonthlySpending)}
              </p>
              <p className="text-xs text-muted-foreground">Avg Monthly</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">
                {analysis.spendingTrends.spendingVolatility.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">Volatility</p>
            </div>
          </div>

          {/* Anomalies */}
          {analysis.anomalies.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Recent Anomalies</h4>
              <div className="space-y-1">
                {analysis.anomalies.slice(0, 3).map((anomaly, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-orange-50 rounded">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <span className="text-xs text-orange-700">{anomaly.description}</span>
                    <Badge 
                      variant={anomaly.severity === 'high' ? 'destructive' : 'secondary'}
                      className="ml-auto text-xs"
                    >
                      {anomaly.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insights */}
          <div>
            <h4 className="font-medium mb-2">Key Insights</h4>
            <div className="space-y-1">
              {analysis.insights.recommendations.slice(0, 3).map((rec, index) => (
                <p key={index} className="text-sm text-muted-foreground flex items-start gap-1">
                  <Lightbulb className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                  {rec}
                </p>
              ))}
            </div>
            <div className="mt-3 p-2 bg-green-50 rounded">
              <p className="text-sm font-medium text-green-700">
                Potential Monthly Savings: {formatCurrency(analysis.insights.potentialSavings)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FinancialAdvicePanel({ advice }: { advice: TFinancialAdvice }) {
  return (
    <div className="space-y-6">
      {/* Priority Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-red-500" />
            Priority Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {advice.priorityActions.map((action, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded">
                <div className={cn(
                  'w-2 h-2 rounded-full mt-2',
                  action.priority === 'high' ? 'bg-red-500' :
                  action.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                )} />
                <div className="flex-1">
                  <h4 className="font-medium">{action.action}</h4>
                  <p className="text-sm text-muted-foreground">{action.impact}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {action.priority} priority
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {action.timeframe}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Savings Optimization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            Savings Optimization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <p className="text-lg font-bold">
                {advice.savingsOptimization.currentSavingsRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">Current Rate</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">
                {advice.savingsOptimization.recommendedSavingsRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">Recommended</p>
            </div>
          </div>
          
          <div className="p-3 bg-green-50 rounded mb-4">
            <p className="text-sm font-medium text-green-700">
              Potential Monthly Savings: {formatCurrency(advice.savingsOptimization.potentialMonthlySavings)}
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-2">Strategies</h4>
            <ul className="space-y-1">
              {advice.savingsOptimization.strategies.map((strategy, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-1">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                  {strategy}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-500" />
            Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <Badge variant={
                advice.riskAssessment.emergencyFundStatus === 'adequate' ? 'default' : 'destructive'
              }>
                {advice.riskAssessment.emergencyFundStatus}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">Emergency Fund</p>
            </div>
            <div className="text-center">
              <Badge variant={
                advice.riskAssessment.debtLevel === 'low' ? 'default' : 
                advice.riskAssessment.debtLevel === 'moderate' ? 'secondary' : 'destructive'
              }>
                {advice.riskAssessment.debtLevel}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">Debt Level</p>
            </div>
            <div className="text-center">
              <Badge variant={
                advice.riskAssessment.incomeStability === 'stable' ? 'default' : 'secondary'
              }>
                {advice.riskAssessment.incomeStability}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">Income</p>
            </div>
          </div>

          {advice.riskAssessment.riskFactors.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 text-orange-600">Risk Factors</h4>
              <ul className="space-y-1">
                {advice.riskAssessment.riskFactors.map((risk, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-1">
                    <AlertTriangle className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-500" />
            Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {advice.nextSteps.map((step, index) => (
              <div key={index} className="flex items-center gap-3 p-2 border rounded">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                </div>
                <span className="text-sm">{step}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ScenarioSimulator({ onRunScenario }: { 
  onRunScenario: (scenarios: any) => Promise<void> 
}) {
  const [incomeChange, setIncomeChange] = useState(0);
  const [expenseChange, setExpenseChange] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  async function runScenario() {
    setIsRunning(true);
    try {
      await onRunScenario({
        incomeChange: incomeChange,
        expenseChange: expenseChange
      });
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-500" />
          Scenario Simulator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Income Change (%)</label>
            <Input
              type="number"
              value={incomeChange}
              onChange={(e) => setIncomeChange(Number(e.target.value))}
              placeholder="0"
              className="mt-1"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Expense Change (%)</label>
            <Input
              type="number"
              value={expenseChange}
              onChange={(e) => setExpenseChange(Number(e.target.value))}
              placeholder="0"
              className="mt-1"
            />
          </div>

          <Button 
            onClick={runScenario} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Running Scenario...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Run Scenario
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function PrognosesTab({ 
  onGenerateProjection, 
  onGenerateAnalysis, 
  onGenerateAdvice 
}: TProps) {
  const [cashFlowProjection, setCashFlowProjection] = useState<TCashFlowProjection | null>(null);
  const [spendingAnalysis, setSpendingAnalysis] = useState<TSpendingAnalysis | null>(null);
  const [financialAdvice, setFinancialAdvice] = useState<TFinancialAdvice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTimeframe, setActiveTimeframe] = useState(6);

  async function loadAllForecasts() {
    setIsLoading(true);
    try {
      const [projection, analysis, advice] = await Promise.all([
        onGenerateProjection(activeTimeframe),
        onGenerateAnalysis(),
        onGenerateAdvice()
      ]);
      
      setCashFlowProjection(projection);
      setSpendingAnalysis(analysis);
      setFinancialAdvice(advice);
    } catch (error) {
      console.error('Failed to load forecasts:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleScenarioRun(scenarios: any) {
    try {
      const projection = await onGenerateProjection(activeTimeframe, scenarios);
      setCashFlowProjection(projection);
    } catch (error) {
      console.error('Failed to run scenario:', error);
    }
  }

  useEffect(() => {
    loadAllForecasts();
  }, [activeTimeframe]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-500" />
          <h3 className="font-semibold mb-2">Generating AI-Powered Forecasts</h3>
          <p className="text-muted-foreground">
            Analyzing your financial data with advanced AI models...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Financial Prognoses</h3>
          <p className="text-sm text-muted-foreground">
            AI-powered forecasting and financial insights
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Timeframe:</span>
          {[3, 6, 12].map((months) => (
            <Button
              key={months}
              variant={activeTimeframe === months ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTimeframe(months)}
            >
              {months}m
            </Button>
          ))}
          
          <Button
            onClick={loadAllForecasts}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="ml-4"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Financial Health Score */}
      {financialAdvice && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <FinancialHealthScore score={financialAdvice.financialHealthScore} />
          
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-500" />
                  AI Financial Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {financialAdvice.savingsOptimization.recommendedSavingsRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Recommended Savings Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(financialAdvice.savingsOptimization.potentialMonthlySavings)}
                    </p>
                    <p className="text-xs text-muted-foreground">Potential Monthly Savings</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {financialAdvice.priorityActions.filter(a => a.priority === 'high').length}
                    </p>
                    <p className="text-xs text-muted-foreground">High Priority Actions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Main Forecasting Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Projections & Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cash Flow Projection */}
          {cashFlowProjection && (
            <CashFlowProjectionChart projection={cashFlowProjection} />
          )}

          {/* Spending Analysis */}
          {spendingAnalysis && (
            <SpendingAnalysisWidget analysis={spendingAnalysis} />
          )}
        </div>

        {/* Right Column - Controls & Advice */}
        <div className="space-y-6">
          {/* Scenario Simulator */}
          <ScenarioSimulator onRunScenario={handleScenarioRun} />

          {/* Financial Advice Panel */}
          {financialAdvice && (
            <FinancialAdvicePanel advice={financialAdvice} />
          )}
        </div>
      </div>
    </div>
  );
}
