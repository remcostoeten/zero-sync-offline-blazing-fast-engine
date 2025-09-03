'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  BarChart3,
  TrendingUp,
  Target,
  DollarSign,
  Download,
  FileText,
  Loader2
} from 'lucide-react';
import { DateRange } from '../actions';

export type ReportType = 'spending' | 'income' | 'budget' | 'cash-flow';

interface ReportGeneratorProps {
  onGenerateReport: (type: ReportType, dateRange: DateRange) => Promise<void>;
  isLoading?: boolean;
}

export function ReportGenerator({ onGenerateReport, isLoading }: ReportGeneratorProps) {
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('spending');
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const reportTypes = [
    {
      id: 'spending' as const,
      title: 'Spending Analysis',
      description: 'Detailed breakdown of expenses by category and trends',
      icon: BarChart3,
      color: 'bg-blue-50 text-blue-600 border-blue-200'
    },
    {
      id: 'income' as const,
      title: 'Income Report',
      description: 'Income sources, trends, and recurring revenue analysis',
      icon: TrendingUp,
      color: 'bg-green-50 text-green-600 border-green-200'
    },
    {
      id: 'budget' as const,
      title: 'Budget Performance',
      description: 'Budget utilization, alerts, and category performance',
      icon: Target,
      color: 'bg-purple-50 text-purple-600 border-purple-200'
    },
    {
      id: 'cash-flow' as const,
      title: 'Cash Flow Analysis',
      description: 'Daily, weekly, and monthly cash flow patterns',
      icon: DollarSign,
      color: 'bg-orange-50 text-orange-600 border-orange-200'
    }
  ];

  const quickDateRanges = [
    {
      label: 'This Month',
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    {
      label: 'Last Month',
      startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0],
      endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0]
    },
    {
      label: 'Last 3 Months',
      startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    {
      label: 'This Year',
      startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    },
    {
      label: 'Last Year',
      startDate: new Date(new Date().getFullYear() - 1, 0, 1).toISOString().split('T')[0],
      endDate: new Date(new Date().getFullYear() - 1, 11, 31).toISOString().split('T')[0]
    }
  ];

  const handleGenerateReport = async () => {
    await onGenerateReport(selectedReportType, dateRange);
  };

  const handleQuickDateRange = (range: { startDate: string; endDate: string }) => {
    setDateRange(range);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Generate Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Report Type Selection */}
        <div className="space-y-3">
          <Label>Report Type</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reportTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedReportType === type.id;
              
              return (
                <div
                  key={type.id}
                  className={`
                    relative p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                  onClick={() => setSelectedReportType(type.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${type.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{type.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {type.description}
                      </p>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Badge variant="default" className="text-xs">
                        Selected
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Date Range Selection */}
        <div className="space-y-4">
          <Label>Date Range</Label>
          
          {/* Quick Date Range Buttons */}
          <div className="flex flex-wrap gap-2">
            {quickDateRanges.map((range, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickDateRange(range)}
                className={`text-xs ${
                  dateRange.startDate === range.startDate && 
                  dateRange.endDate === range.endDate
                    ? 'bg-primary/10 border-primary text-primary'
                    : ''
                }`}
              >
                {range.label}
              </Button>
            ))}
          </div>

          {/* Custom Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ 
                  ...dateRange, 
                  startDate: e.target.value 
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ 
                  ...dateRange, 
                  endDate: e.target.value 
                })}
                min={dateRange.startDate}
              />
            </div>
          </div>
        </div>

        {/* Date Range Preview */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Report Period:</span>
            <span className="font-medium">
              {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
            </span>
            <span className="text-muted-foreground">
              ({Math.ceil((new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime()) / (1000 * 60 * 60 * 24))} days)
            </span>
          </div>
        </div>

        {/* Generate Button */}
        <Button 
          onClick={handleGenerateReport}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Report...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Generate {reportTypes.find(t => t.id === selectedReportType)?.title}
            </>
          )}
        </Button>

        {/* Report Features */}
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-2">Report Features:</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 bg-green-500 rounded-full" />
              <span>Detailed Analytics</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 bg-blue-500 rounded-full" />
              <span>Visual Charts</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 bg-purple-500 rounded-full" />
              <span>Export Options</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 bg-orange-500 rounded-full" />
              <span>Trend Analysis</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
