'use client';

import { 
  SpendingAnalysisReport, 
  IncomeReport, 
  BudgetReport, 
  CashFlowReport 
} from '../actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  Target,
  Info
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ReportType } from './ReportGenerator';

type ReportData = SpendingAnalysisReport | IncomeReport | BudgetReport | CashFlowReport;

interface ReportDisplayProps {
  reportType: ReportType;
  reportData: ReportData;
  onExport?: (format: 'pdf' | 'csv' | 'excel') => void;
}

export function ReportDisplay({ reportType, reportData, onExport }: ReportDisplayProps) {
  const renderSpendingAnalysis = (data: SpendingAnalysisReport) => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Total Income</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(data.summary.totalIncome)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-sm text-muted-foreground">Total Expenses</span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(data.summary.totalExpenses)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Net Income</span>
            </div>
            <p className={cn(
              "text-2xl font-bold",
              data.summary.netIncome >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {formatCurrency(data.summary.netIncome)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-muted-foreground">Transactions</span>
            </div>
            <p className="text-2xl font-bold">
              {data.summary.transactionCount}
            </p>
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(data.summary.averageTransaction)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Expense Breakdown by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.categoryBreakdown.map((category, index) => (
              <div key={category.categoryId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.categoryColor }}
                    />
                    <span className="font-medium">{category.categoryName}</span>
                    <Badge variant="outline" className="text-xs">
                      {category.transactionCount} transactions
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(category.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {category.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <Progress value={category.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Monthly Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.monthlyTrends.map((month, index) => (
              <div key={month.month} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="font-medium">{month.month}</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Income</p>
                    <p className="font-semibold text-green-600">{formatCurrency(month.income)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Expenses</p>
                    <p className="font-semibold text-red-600">{formatCurrency(month.expenses)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Net</p>
                    <p className={cn(
                      "font-semibold",
                      month.net >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {formatCurrency(month.net)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Largest Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.topTransactions.map((transaction, index) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <span className="text-xs text-muted-foreground">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{transaction.categoryName}</span>
                      <span>•</span>
                      <span>{new Date(transaction.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className={cn(
                  "font-bold",
                  transaction.type === 'income' ? "text-green-600" : "text-red-600"
                )}>
                  {transaction.type === 'income' ? '+' : ''}
                  {formatCurrency(transaction.amount)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderBudgetReport = (data: BudgetReport) => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Total Budgets</span>
            </div>
            <p className="text-2xl font-bold">{data.summary.totalBudgets}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Total Budget Amount</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(data.summary.totalBudgetAmount)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-sm text-muted-foreground">Total Spent</span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(data.summary.totalSpent)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-muted-foreground">Over Budget</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {data.summary.overBudgetCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Budget Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.budgetPerformance.map((budget) => (
              <div key={budget.budgetId} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: budget.categoryColor }}
                    />
                    <div>
                      <p className="font-medium">{budget.budgetName}</p>
                      <p className="text-sm text-muted-foreground">{budget.categoryName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {budget.status === 'over' && (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                    <Badge 
                      variant={
                        budget.status === 'over' ? 'destructive' : 
                        budget.status === 'near_limit' ? 'secondary' : 
                        'default'
                      }
                      className="text-xs"
                    >
                      {budget.percentage.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
                
                <Progress 
                  value={Math.min(budget.percentage, 100)} 
                  className="h-2"
                />
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Spent: {formatCurrency(budget.spentAmount)}</span>
                  <span>Budget: {formatCurrency(budget.budgetAmount)}</span>
                </div>
                
                {budget.status === 'over' && (
                  <p className="text-sm text-red-600 font-medium">
                    Over budget by {formatCurrency(budget.spentAmount - budget.budgetAmount)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderIncomeReport = (data: IncomeReport) => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Total Income</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(data.summary.totalIncome)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Monthly Average</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(data.summary.averageMonthly)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-muted-foreground">Transactions</span>
            </div>
            <p className="text-2xl font-bold">{data.summary.transactionCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Growth Rate</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {data.summary.growthRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Income Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Income Sources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.sources.map((source) => (
              <div key={source.categoryId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: source.categoryColor }}
                    />
                    <span className="font-medium">{source.categoryName}</span>
                    <Badge variant="outline" className="text-xs">
                      {source.frequency} payments
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">{formatCurrency(source.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {source.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <Progress value={source.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCashFlowReport = (data: CashFlowReport) => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Total Inflow</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(data.summary.totalInflow)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-sm text-muted-foreground">Total Outflow</span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(data.summary.totalOutflow)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Net Cash Flow</span>
            </div>
            <p className={cn(
              "text-2xl font-bold",
              data.summary.netCashFlow >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {formatCurrency(data.summary.netCashFlow)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-muted-foreground">Daily Average</span>
            </div>
            <p className={cn(
              "text-2xl font-bold",
              data.summary.averageDaily >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {formatCurrency(data.summary.averageDaily)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Cash Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Monthly Cash Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.monthlyFlow.map((month) => (
              <div key={month.month} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="font-medium">{month.month}</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Inflow</p>
                    <p className="font-semibold text-green-600">{formatCurrency(month.inflow)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Outflow</p>
                    <p className="font-semibold text-red-600">{formatCurrency(month.outflow)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Net</p>
                    <p className={cn(
                      "font-semibold",
                      month.net >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {formatCurrency(month.net)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderReportContent = () => {
    switch (reportType) {
      case 'spending':
        return renderSpendingAnalysis(reportData as SpendingAnalysisReport);
      case 'income':
        return renderIncomeReport(reportData as IncomeReport);
      case 'budget':
        return renderBudgetReport(reportData as BudgetReport);
      case 'cash-flow':
        return renderCashFlowReport(reportData as CashFlowReport);
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-xl font-semibold capitalize">
                  {reportType.replace('-', ' ')} Report
                </h2>
                <p className="text-sm text-muted-foreground">
                  Generated on {new Date().toLocaleDateString()} • 
                  Period: {new Date(reportData.summary.dateRange.startDate).toLocaleDateString()} - {new Date(reportData.summary.dateRange.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {onExport && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => onExport('pdf')}>
                  <Download className="w-4 h-4 mr-1" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => onExport('excel')}>
                  <Download className="w-4 h-4 mr-1" />
                  Excel
                </Button>
                <Button variant="outline" size="sm" onClick={() => onExport('csv')}>
                  <Download className="w-4 h-4 mr-1" />
                  CSV
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Report Content */}
      {renderReportContent()}

      {/* Report Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="w-4 h-4" />
            <span>
              This report was generated from your transaction data. 
              All calculations are based on the selected date range and active financial records.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
