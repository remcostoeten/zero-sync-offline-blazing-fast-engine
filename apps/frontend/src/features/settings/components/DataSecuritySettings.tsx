'use client';

import { useState, useEffect } from 'react';
import { 
  SecuritySettings as SecuritySettingsType,
  DataSettings as DataSettingsType,
  getSecuritySettings,
  getDataSettings,
  updateSecuritySettings,
  updateDataSettings,
  exportUserData,
  deleteUserAccount,
  changePassword,
  toggleTwoFactor
} from '../actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Shield,
  Database,
  Download,
  Trash2,
  Lock,
  Key,
  Clock,
  AlertTriangle,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

export function DataSecuritySettings() {
  const [securitySettings, setSecuritySettings] = useState<SecuritySettingsType | null>(null);
  const [dataSettings, setDataSettings] = useState<DataSettingsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showPasswords: false
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [security, data] = await Promise.all([
        getSecuritySettings(),
        getDataSettings()
      ]);
      setSecuritySettings(security);
      setDataSettings(data);
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSecuritySetting = async (key: keyof SecuritySettingsType, value: any) => {
    if (!securitySettings) return;

    try {
      setSavingStates(prev => ({ ...prev, [key]: true }));
      const updatedSettings = await updateSecuritySettings({
        [key]: value
      });
      setSecuritySettings(updatedSettings);
      toast.success('Security setting updated');
    } catch (error) {
      toast.error('Failed to update security setting');
    } finally {
      setSavingStates(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleUpdateDataSetting = async (key: keyof DataSettingsType, value: any) => {
    if (!dataSettings) return;

    try {
      setSavingStates(prev => ({ ...prev, [key]: true }));
      const updatedSettings = await updateDataSettings({
        [key]: value
      });
      setDataSettings(updatedSettings);
      toast.success('Data setting updated');
    } catch (error) {
      toast.error('Failed to update data setting');
    } finally {
      setSavingStates(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      setIsChangingPassword(true);
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        showPasswords: false
      });
      toast.success('Password changed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleToggleTwoFactor = async (enable: boolean) => {
    try {
      setSavingStates(prev => ({ ...prev, twoFactor: true }));
      await toggleTwoFactor(enable);
      if (securitySettings) {
        setSecuritySettings({
          ...securitySettings,
          twoFactorEnabled: enable
        });
      }
      toast.success(
        enable 
          ? 'Two-factor authentication enabled' 
          : 'Two-factor authentication disabled'
      );
    } catch (error) {
      toast.error('Failed to update two-factor authentication');
    } finally {
      setSavingStates(prev => ({ ...prev, twoFactor: false }));
    }
  };

  const handleExportData = async (format: 'json' | 'csv' | 'excel') => {
    try {
      setIsExporting(true);
      const result = await exportUserData(format);
      
      // In a real implementation, you would trigger a download
      toast.success(`Data exported as ${format.toUpperCase()}: ${result.filename}`);
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeletingAccount(true);
      await deleteUserAccount();
      toast.success('Account deletion initiated');
    } catch (error) {
      toast.error('Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(2)].map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="h-6 bg-muted rounded w-48 animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="h-4 bg-muted rounded w-32 animate-pulse" />
                      <div className="h-3 bg-muted rounded w-48 animate-pulse" />
                    </div>
                    <div className="h-6 w-10 bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {securitySettings && (
            <>
              {/* Two-Factor Authentication */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-muted-foreground" />
                      <Label className="text-sm font-medium">Two-Factor Authentication</Label>
                      {securitySettings.twoFactorEnabled && (
                        <Badge variant="default" className="text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactorEnabled}
                    onCheckedChange={handleToggleTwoFactor}
                    disabled={savingStates.twoFactor}
                  />
                </div>
              </div>

              <Separator />

              {/* Session Timeout */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm font-medium">Session Timeout</Label>
                </div>
                <Select 
                  value={securitySettings.sessionTimeout.toString()}
                  onValueChange={(value) => handleUpdateSecuritySetting('sessionTimeout', parseInt(value))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="240">4 hours</SelectItem>
                    <SelectItem value="480">8 hours</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Automatically log out after this period of inactivity
                </p>
              </div>

              <Separator />

              {/* Login Notifications */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Login Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified of new login attempts
                  </p>
                </div>
                <Switch
                  checked={securitySettings.loginNotifications}
                  onCheckedChange={(value) => handleUpdateSecuritySetting('loginNotifications', value)}
                  disabled={savingStates.loginNotifications}
                />
              </div>

              <Separator />

              {/* API Access */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">API Access</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow third-party applications to access your data
                  </p>
                </div>
                <Switch
                  checked={securitySettings.apiAccessEnabled}
                  onCheckedChange={(value) => handleUpdateSecuritySetting('apiAccessEnabled', value)}
                  disabled={savingStates.apiAccessEnabled}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={passwordForm.showPasswords ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({ 
                  ...prev, 
                  currentPassword: e.target.value 
                }))}
                placeholder="Enter current password"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={passwordForm.showPasswords ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ 
                  ...prev, 
                  newPassword: e.target.value 
                }))}
                placeholder="Enter new password (min. 8 characters)"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={passwordForm.showPasswords ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ 
                  ...prev, 
                  confirmPassword: e.target.value 
                }))}
                placeholder="Confirm new password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setPasswordForm(prev => ({ 
                  ...prev, 
                  showPasswords: !prev.showPasswords 
                }))}
              >
                {passwordForm.showPasswords ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <Button 
            onClick={handleChangePassword}
            disabled={
              !passwordForm.currentPassword || 
              !passwordForm.newPassword || 
              !passwordForm.confirmPassword ||
              isChangingPassword
            }
            className="w-full"
          >
            {isChangingPassword ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Changing Password...
              </>
            ) : (
              'Change Password'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {dataSettings && (
            <>
              {/* Auto Backup */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Auto Backup</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically backup your data regularly
                  </p>
                </div>
                <Switch
                  checked={dataSettings.autoBackup}
                  onCheckedChange={(value) => handleUpdateDataSetting('autoBackup', value)}
                  disabled={savingStates.autoBackup}
                />
              </div>

              {dataSettings.autoBackup && (
                <>
                  <Separator />
                  
                  {/* Backup Frequency */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Backup Frequency</Label>
                    <Select 
                      value={dataSettings.backupFrequency}
                      onValueChange={(value: any) => handleUpdateDataSetting('backupFrequency', value)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <Separator />

              {/* Data Retention */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Data Retention</Label>
                <Select 
                  value={dataSettings.dataRetention.toString()}
                  onValueChange={(value) => handleUpdateDataSetting('dataRetention', parseInt(value))}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">1 year</SelectItem>
                    <SelectItem value="24">2 years</SelectItem>
                    <SelectItem value="36">3 years</SelectItem>
                    <SelectItem value="60">5 years</SelectItem>
                    <SelectItem value="120">10 years</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  How long to keep your financial data
                </p>
              </div>

              <Separator />

              {/* Export Format */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Default Export Format</Label>
                <Select 
                  value={dataSettings.exportFormat}
                  onValueChange={(value: any) => handleUpdateDataSetting('exportFormat', value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <Separator />

          {/* Export Data */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Your Data</Label>
            <p className="text-xs text-muted-foreground">
              Download all your financial data in your preferred format
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleExportData('json')}
                disabled={isExporting}
              >
                <Download className="w-4 h-4 mr-2" />
                JSON
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleExportData('csv')}
                disabled={isExporting}
              >
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleExportData('excel')}
                disabled={isExporting}
              >
                <Download className="w-4 h-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>

          <Separator />

          {/* Delete Account */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-destructive">Danger Zone</Label>
            <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                <div className="flex-1 space-y-2">
                  <h4 className="text-sm font-medium text-destructive">Delete Account</h4>
                  <p className="text-xs text-muted-foreground">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Account</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete your account, all financial data, 
                          transactions, budgets, and settings. This action cannot be undone.
                          Are you absolutely sure you want to continue?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          className="bg-destructive hover:bg-destructive/90"
                          disabled={isDeletingAccount}
                        >
                          {isDeletingAccount ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            'Yes, Delete Account'
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
