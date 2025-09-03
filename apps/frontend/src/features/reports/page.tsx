'use client';

import { useState } from 'react';
import { 
  generateSpendingAnalysisReport,
  generateIncomeReport,
  generateBudgetReport,
  generateCashFlowReport,
  DateRange,
  SpendingAnalysisReport,
  IncomeReport,
  BudgetReport,
  CashFlowReport
} from './actions';
import { ReportGenerator, ReportType } from './components/ReportGenerator';
import { ReportDisplay } from './components/ReportDisplay';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

type ReportData = SpendingAnalysisReport | IncomeReport | BudgetReport | CashFlowReport | null;

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentReport, setCurrentReport] = useState<{
    type: ReportType;
    data: ReportData;
  } | null>(null);

  const handleGenerateReport = async (type: ReportType, dateRange: DateRange) => {
    setIsLoading(true);
    
    try {
      let reportData: ReportData = null;
      
      switch (type) {
        case 'spending':
          reportData = await generateSpendingAnalysisReport(dateRange);
          break;
        case 'income':
          reportData = await generateIncomeReport(dateRange);
          break;
        case 'budget':
          reportData = await generateBudgetReport(dateRange);
          break;
        case 'cash-flow':
          reportData = await generateCashFlowReport(dateRange);
          break;
        default:
          throw new Error('Invalid report type');
      }
      
      setCurrentReport({ type, data: reportData });
      toast.success('Report generated successfully');
    } catch (error: any) {
      console.error('Failed to generate report:', error);
      toast.error(error.message || 'Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = async (format: 'pdf' | 'csv' | 'excel') => {
    if (!currentReport) return;
    
    try {
      // This would typically call an export API endpoint
      toast.info(`Exporting ${currentReport.type} report as ${format.toUpperCase()}...`);
      
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Report exported as ${format.toUpperCase()} successfully`);
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-8">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Financial Reports</h1>
          <p className="text-muted-foreground">
            Generate comprehensive financial reports and analysis
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Sidebar - Report Generator */}
          <div className="lg:col-span-4">
            <div className="sticky top-8">
              <ReportGenerator
                onGenerateReport={handleGenerateReport}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-8">
            {currentReport && currentReport.data ? (
              <ReportDisplay
                reportType={currentReport.type}
                reportData={currentReport.data}
                onExport={handleExportReport}
              />
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Report Generated</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Select a report type and date range from the generator on the left, 
                    then click "Generate Report" to view your financial analysis.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto text-sm">
                    <div className="p-4 bg-blue-50 rounded-lg text-left">
                      <div className="font-medium text-blue-900 mb-2">💡 Tip</div>
                      <p className="text-blue-800">
                        Start with a Spending Analysis to get a comprehensive overview of your expenses.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg text-left">
                      <div className="font-medium text-green-900 mb-2">📊 Features</div>
                      <p className="text-green-800">
                        All reports include detailed breakdowns, trends, and export options.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-purple-50 rounded-lg text-left">
                      <div className="font-medium text-purple-900 mb-2">📅 Date Ranges</div>
                      <p className="text-purple-800">
                        Use quick date ranges or select custom periods for analysis.
                      </p>
                    </div>
                    
                    <div className="p-4 bg-orange-50 rounded-lg text-left">
                      <div className="font-medium text-orange-900 mb-2">💾 Export</div>
                      <p className="text-orange-800">
                        Export reports in PDF, Excel, or CSV formats for further analysis.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-80">
              <CardContent className="p-6 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <h3 className="font-semibold mb-2">Generating Report</h3>
                <p className="text-sm text-muted-foreground">
                  Analyzing your financial data and generating insights...
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
