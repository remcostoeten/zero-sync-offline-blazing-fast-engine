'use client';

import { useState, useEffect } from 'react';
import { 
  NotificationSettings as NotificationSettingsType, 
  getNotificationSettings, 
  updateNotificationSettings 
} from '../actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Bell,
  Mail,
  Target,
  Repeat,
  PiggyBank,
  Calendar,
  FileText,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettingsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getNotificationSettings();
      setSettings(data);
    } catch (error) {
      toast.error('Failed to load notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSetting = async (key: keyof NotificationSettingsType, value: boolean) => {
    if (!settings) return;

    try {
      setSavingStates(prev => ({ ...prev, [key]: true }));
      const updatedSettings = await updateNotificationSettings({
        [key]: value
      });
      setSettings(updatedSettings);
      toast.success('Notification setting updated');
    } catch (error) {
      toast.error('Failed to update setting');
      // Revert the change
      setSettings(prev => prev ? { ...prev, [key]: !value } : prev);
    } finally {
      setSavingStates(prev => ({ ...prev, [key]: false }));
    }
  };

  const notificationTypes = [
    {
      key: 'emailNotifications' as const,
      title: 'Email Notifications',
      description: 'Receive email notifications for important updates',
      icon: Mail,
      category: 'General'
    },
    {
      key: 'budgetAlerts' as const,
      title: 'Budget Alerts',
      description: 'Get notified when you approach or exceed budget limits',
      icon: Target,
      category: 'Financial Alerts'
    },
    {
      key: 'recurringTransactionAlerts' as const,
      title: 'Recurring Transaction Alerts',
      description: 'Notifications when recurring transactions are processed',
      icon: Repeat,
      category: 'Financial Alerts'
    },
    {
      key: 'savingsGoalAlerts' as const,
      title: 'Savings Goal Alerts',
      description: 'Updates on savings goal progress and milestones',
      icon: PiggyBank,
      category: 'Financial Alerts'
    },
    {
      key: 'overdueAlerts' as const,
      title: 'Overdue Alerts',
      description: 'Notifications for overdue transactions and bills',
      icon: AlertTriangle,
      category: 'Financial Alerts'
    },
    {
      key: 'weeklyReports' as const,
      title: 'Weekly Reports',
      description: 'Receive weekly financial summary reports',
      icon: FileText,
      category: 'Reports'
    },
    {
      key: 'monthlyReports' as const,
      title: 'Monthly Reports',
      description: 'Detailed monthly financial analysis and insights',
      icon: Calendar,
      category: 'Reports'
    }
  ];

  const groupedNotifications = notificationTypes.reduce((acc, notification) => {
    if (!acc[notification.category]) {
      acc[notification.category] = [];
    }
    acc[notification.category].push(notification);
    return acc;
  }, {} as Record<string, typeof notificationTypes>);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="h-4 bg-muted rounded w-32 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-48 animate-pulse" />
                </div>
                <div className="h-6 w-10 bg-muted rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Failed to load notification settings</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {Object.entries(groupedNotifications).map(([category, notifications], categoryIndex) => (
          <div key={category} className="space-y-4">
            {categoryIndex > 0 && <Separator />}
            
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">{category}</h3>
            </div>
            
            <div className="space-y-4">
              {notifications.map((notification) => {
                const Icon = notification.icon;
                const isEnabled = settings[notification.key];
                const isSaving = savingStates[notification.key];
                
                return (
                  <div key={notification.key} className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-0.5">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <Label 
                              htmlFor={notification.key}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {notification.title}
                            </Label>
                            {isSaving && (
                              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {notification.description}
                          </p>
                        </div>
                      </div>
                      
                      <Switch
                        id={notification.key}
                        checked={isEnabled}
                        onCheckedChange={(checked) => 
                          handleUpdateSetting(notification.key, checked)
                        }
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        
        <Separator />
        
        {/* Notification Summary */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Notification Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
            <div>
              <span className="font-medium">Financial Alerts:</span> {
                notificationTypes
                  .filter(n => n.category === 'Financial Alerts' && settings[n.key])
                  .length
              } of {notificationTypes.filter(n => n.category === 'Financial Alerts').length} enabled
            </div>
            <div>
              <span className="font-medium">Reports:</span> {
                notificationTypes
                  .filter(n => n.category === 'Reports' && settings[n.key])
                  .length
              } of {notificationTypes.filter(n => n.category === 'Reports').length} enabled
            </div>
            <div>
              <span className="font-medium">Email:</span> {settings.emailNotifications ? 'Enabled' : 'Disabled'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
