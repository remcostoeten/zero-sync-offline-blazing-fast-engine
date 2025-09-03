'use client';

import { useState, useEffect } from 'react';
import { UserPreferencesSettings } from './components/UserPreferencesSettings';
import { NotificationSettings } from './components/NotificationSettings';
import { DataSecuritySettings } from './components/DataSecuritySettings';
import { getApplicationInfo } from './actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Database,
  Info,
  ExternalLink
} from 'lucide-react';

export default function SettingsPage() {
  const [appInfo, setAppInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('preferences');

  useEffect(() => {
    loadAppInfo();
  }, []);

  const loadAppInfo = async () => {
    try {
      const info = await getApplicationInfo();
      setAppInfo(info);
    } catch (error) {
      console.error('Failed to load application info:', error);
    }
  };

  const settingsTabs = [
    {
      id: 'preferences',
      label: 'Preferences',
      description: 'Customize your experience',
      icon: User,
      component: UserPreferencesSettings
    },
    {
      id: 'notifications',
      label: 'Notifications',
      description: 'Manage your alerts',
      icon: Bell,
      component: NotificationSettings
    },
    {
      id: 'security',
      label: 'Security & Data',
      description: 'Security and data management',
      icon: Shield,
      component: DataSecuritySettings
    }
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-8">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and application settings
          </p>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Tab Content */}
          {settingsTabs.map((tab) => {
            const Component = tab.component;
            return (
              <TabsContent key={tab.id} value={tab.id} className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <tab.icon className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-semibold">{tab.label}</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">{tab.description}</p>
                </div>
                
                <Component />
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Application Information */}
        {appInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Application Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Version</p>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{appInfo.version}</p>
                    <Badge variant="outline" className="text-xs">
                      {appInfo.environment}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Build Date</p>
                  <p className="font-medium">{new Date(appInfo.buildDate).toLocaleDateString()}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Support</p>
                  <p className="font-medium">{appInfo.supportEmail}</p>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex items-center gap-4 text-sm">
                <a 
                  href={appInfo.privacyPolicyUrl}
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  Privacy Policy
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a 
                  href={appInfo.termsOfServiceUrl}
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  Terms of Service
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Settings Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">💡 Settings Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="font-medium text-blue-900 mb-2">📱 Notifications</div>
                <p className="text-blue-800">
                  Enable budget alerts to stay on track with your spending goals.
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="font-medium text-green-900 mb-2">🔒 Security</div>
                <p className="text-green-800">
                  Enable two-factor authentication for additional account security.
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="font-medium text-purple-900 mb-2">💾 Backup</div>
                <p className="text-purple-800">
                  Regularly export your data to keep secure backups of your financial records.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
