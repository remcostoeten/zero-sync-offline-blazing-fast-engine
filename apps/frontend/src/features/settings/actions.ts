'use server';

import { getDb } from '@/lib/database/connection';
import { z } from 'zod';

// Settings interfaces
export interface UserPreferences {
  currency: string;
  dateFormat: 'MM/dd/yyyy' | 'dd/MM/yyyy' | 'yyyy-MM-dd';
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
}

export interface NotificationSettings {
  emailNotifications: boolean;
  budgetAlerts: boolean;
  recurringTransactionAlerts: boolean;
  savingsGoalAlerts: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
  overdueAlerts: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number; // minutes
  loginNotifications: boolean;
  apiAccessEnabled: boolean;
}

export interface DataSettings {
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  dataRetention: number; // months
  exportFormat: 'csv' | 'excel' | 'json';
}

export interface ImportSettings {
  bankConnectionEnabled: boolean;
  autoImport: boolean;
  importFrequency: 'daily' | 'weekly';
  duplicateHandling: 'skip' | 'merge' | 'flag';
}

// Validation schemas
const userPreferencesSchema = z.object({
  currency: z.string().min(1),
  dateFormat: z.enum(['MM/dd/yyyy', 'dd/MM/yyyy', 'yyyy-MM-dd']),
  theme: z.enum(['light', 'dark', 'system']),
  language: z.string().min(1),
  timezone: z.string().min(1),
  firstDayOfWeek: z.union([z.literal(0), z.literal(1)])
});

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  budgetAlerts: z.boolean(),
  recurringTransactionAlerts: z.boolean(),
  savingsGoalAlerts: z.boolean(),
  weeklyReports: z.boolean(),
  monthlyReports: z.boolean(),
  overdueAlerts: z.boolean()
});

const securitySettingsSchema = z.object({
  twoFactorEnabled: z.boolean(),
  sessionTimeout: z.number().min(5).max(480), // 5 minutes to 8 hours
  loginNotifications: z.boolean(),
  apiAccessEnabled: z.boolean()
});

const dataSettingsSchema = z.object({
  autoBackup: z.boolean(),
  backupFrequency: z.enum(['daily', 'weekly', 'monthly']),
  dataRetention: z.number().min(1).max(120), // 1 to 120 months
  exportFormat: z.enum(['csv', 'excel', 'json'])
});

const importSettingsSchema = z.object({
  bankConnectionEnabled: z.boolean(),
  autoImport: z.boolean(),
  importFrequency: z.enum(['daily', 'weekly']),
  duplicateHandling: z.enum(['skip', 'merge', 'flag'])
});

// Default settings
const defaultUserPreferences: UserPreferences = {
  currency: 'USD',
  dateFormat: 'MM/dd/yyyy',
  theme: 'system',
  language: 'en',
  timezone: 'America/New_York',
  firstDayOfWeek: 0
};

const defaultNotificationSettings: NotificationSettings = {
  emailNotifications: true,
  budgetAlerts: true,
  recurringTransactionAlerts: true,
  savingsGoalAlerts: true,
  weeklyReports: false,
  monthlyReports: true,
  overdueAlerts: true
};

const defaultSecuritySettings: SecuritySettings = {
  twoFactorEnabled: false,
  sessionTimeout: 60, // 1 hour
  loginNotifications: true,
  apiAccessEnabled: false
};

const defaultDataSettings: DataSettings = {
  autoBackup: true,
  backupFrequency: 'weekly',
  dataRetention: 24, // 2 years
  exportFormat: 'csv'
};

const defaultImportSettings: ImportSettings = {
  bankConnectionEnabled: false,
  autoImport: false,
  importFrequency: 'daily',
  duplicateHandling: 'flag'
};

// Settings storage (in a real app, this would be in a database)
let userSettings = {
  userPreferences: defaultUserPreferences,
  notificationSettings: defaultNotificationSettings,
  securitySettings: defaultSecuritySettings,
  dataSettings: defaultDataSettings,
  importSettings: defaultImportSettings
};

// Get user preferences
export async function getUserPreferences(): Promise<UserPreferences> {
  try {
    return userSettings.userPreferences;
  } catch (error) {
    return defaultUserPreferences;
  }
}

// Update user preferences
export async function updateUserPreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
  try {
    const validatedPreferences = userPreferencesSchema.partial().parse(preferences);
    userSettings.userPreferences = { 
      ...userSettings.userPreferences, 
      ...validatedPreferences 
    };
    return userSettings.userPreferences;
  } catch (error) {
    throw new Error('Invalid preferences data');
  }
}

// Get notification settings
export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    return userSettings.notificationSettings;
  } catch (error) {
    return defaultNotificationSettings;
  }
}

// Update notification settings
export async function updateNotificationSettings(notifications: Partial<NotificationSettings>): Promise<NotificationSettings> {
  try {
    const validatedNotifications = notificationSettingsSchema.partial().parse(notifications);
    userSettings.notificationSettings = { 
      ...userSettings.notificationSettings, 
      ...validatedNotifications 
    };
    return userSettings.notificationSettings;
  } catch (error) {
    throw new Error('Invalid notification settings');
  }
}

// Get security settings
export async function getSecuritySettings(): Promise<SecuritySettings> {
  try {
    return userSettings.securitySettings;
  } catch (error) {
    return defaultSecuritySettings;
  }
}

// Update security settings
export async function updateSecuritySettings(security: Partial<SecuritySettings>): Promise<SecuritySettings> {
  try {
    const validatedSecurity = securitySettingsSchema.partial().parse(security);
    userSettings.securitySettings = { 
      ...userSettings.securitySettings, 
      ...validatedSecurity 
    };
    return userSettings.securitySettings;
  } catch (error) {
    throw new Error('Invalid security settings');
  }
}

// Get data settings
export async function getDataSettings(): Promise<DataSettings> {
  try {
    return userSettings.dataSettings;
  } catch (error) {
    return defaultDataSettings;
  }
}

// Update data settings
export async function updateDataSettings(data: Partial<DataSettings>): Promise<DataSettings> {
  try {
    const validatedData = dataSettingsSchema.partial().parse(data);
    userSettings.dataSettings = { 
      ...userSettings.dataSettings, 
      ...validatedData 
    };
    return userSettings.dataSettings;
  } catch (error) {
    throw new Error('Invalid data settings');
  }
}

// Get import settings
export async function getImportSettings(): Promise<ImportSettings> {
  try {
    return userSettings.importSettings;
  } catch (error) {
    return defaultImportSettings;
  }
}

// Update import settings
export async function updateImportSettings(importData: Partial<ImportSettings>): Promise<ImportSettings> {
  try {
    const validatedImport = importSettingsSchema.partial().parse(importData);
    userSettings.importSettings = { 
      ...userSettings.importSettings, 
      ...validatedImport 
    };
    return userSettings.importSettings;
  } catch (error) {
    throw new Error('Invalid import settings');
  }
}

// Get all settings
export async function getAllSettings() {
  return {
    userPreferences: await getUserPreferences(),
    notificationSettings: await getNotificationSettings(),
    securitySettings: await getSecuritySettings(),
    dataSettings: await getDataSettings(),
    importSettings: await getImportSettings()
  };
}

// Reset settings to defaults
export async function resetSettings(category: 'all' | 'preferences' | 'notifications' | 'security' | 'data' | 'import') {
  switch (category) {
    case 'all':
      userSettings = {
        userPreferences: defaultUserPreferences,
        notificationSettings: defaultNotificationSettings,
        securitySettings: defaultSecuritySettings,
        dataSettings: defaultDataSettings,
        importSettings: defaultImportSettings
      };
      break;
    case 'preferences':
      userSettings.userPreferences = defaultUserPreferences;
      break;
    case 'notifications':
      userSettings.notificationSettings = defaultNotificationSettings;
      break;
    case 'security':
      userSettings.securitySettings = defaultSecuritySettings;
      break;
    case 'data':
      userSettings.dataSettings = defaultDataSettings;
      break;
    case 'import':
      userSettings.importSettings = defaultImportSettings;
      break;
  }
  
  return await getAllSettings();
}

// Export user data
export async function exportUserData(format: 'json' | 'csv' | 'excel' = 'json') {
  const db = getDb();
  
  try {
    // In a real implementation, you would export all user data from the database
    // For now, we'll simulate the export process
    
    const exportData = {
      settings: userSettings,
      timestamp: new Date().toISOString(),
      format: format
    };
    
    return {
      success: true,
      data: exportData,
      filename: `financial-data-export-${new Date().toISOString().split('T')[0]}.${format}`
    };
  } catch (error) {
    throw new Error('Failed to export user data');
  }
}

// Delete user account and data
export async function deleteUserAccount() {
  const db = getDb();
  
  try {
    // In a real implementation, you would:
    // 1. Delete all user transactions, categories, budgets, etc.
    // 2. Delete user settings
    // 3. Archive data for legal compliance if required
    // 4. Send confirmation email
    
    // For now, we'll just reset the settings
    await resetSettings('all');
    
    return {
      success: true,
      message: 'Account deletion completed successfully'
    };
  } catch (error) {
    throw new Error('Failed to delete user account');
  }
}

// Change user password (placeholder)
export async function changePassword(currentPassword: string, newPassword: string) {
  try {
    // In a real implementation, you would:
    // 1. Verify current password
    // 2. Hash new password
    // 3. Update in database
    // 4. Invalidate existing sessions
    // 5. Send confirmation email
    
    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    
    return {
      success: true,
      message: 'Password updated successfully'
    };
  } catch (error) {
    throw new Error('Failed to change password');
  }
}

// Enable/disable two-factor authentication
export async function toggleTwoFactor(enable: boolean) {
  try {
    await updateSecuritySettings({ twoFactorEnabled: enable });
    
    return {
      success: true,
      message: enable ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled'
    };
  } catch (error) {
    throw new Error('Failed to update two-factor authentication');
  }
}

// Get application info
export async function getApplicationInfo() {
  return {
    version: '1.0.0',
    buildDate: '2024-01-01',
    environment: 'production',
    supportEmail: 'support@example.com',
    privacyPolicyUrl: '/privacy',
    termsOfServiceUrl: '/terms'
  };
}
