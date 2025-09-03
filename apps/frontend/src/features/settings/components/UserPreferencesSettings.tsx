'use client';

import { useState, useEffect } from 'react';
import { 
  UserPreferences, 
  getUserPreferences, 
  updateUserPreferences 
} from '../actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  User,
  Globe,
  Palette,
  DollarSign,
  Calendar,
  Clock,
  Loader2,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

export function UserPreferencesSettings() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const data = await getUserPreferences();
      setPreferences(data);
    } catch (error) {
      toast.error('Failed to load preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePreference = async (key: keyof UserPreferences, value: any) => {
    if (!preferences) return;

    try {
      setIsSaving(true);
      const updatedPreferences = await updateUserPreferences({
        [key]: value
      });
      setPreferences(updatedPreferences);
      toast.success('Preference updated successfully');
    } catch (error) {
      toast.error('Failed to update preference');
    } finally {
      setIsSaving(false);
    }
  };

  const currencies = [
    { code: 'USD', name: 'US Dollar ($)', symbol: '$' },
    { code: 'EUR', name: 'Euro (€)', symbol: '€' },
    { code: 'GBP', name: 'British Pound (£)', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen (¥)', symbol: '¥' },
    { code: 'CAD', name: 'Canadian Dollar (C$)', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar (A$)', symbol: 'A$' },
    { code: 'CHF', name: 'Swiss Franc (CHF)', symbol: 'CHF' },
    { code: 'CNY', name: 'Chinese Yuan (¥)', symbol: '¥' },
  ];

  const dateFormats = [
    { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY (12/31/2024)', example: '12/31/2024' },
    { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY (31/12/2024)', example: '31/12/2024' },
    { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD (2024-12-31)', example: '2024-12-31' },
  ];

  const themes = [
    { value: 'light', label: 'Light', description: 'Clean, bright interface' },
    { value: 'dark', label: 'Dark', description: 'Easy on the eyes' },
    { value: 'system', label: 'System', description: 'Match device preference' },
  ];

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
  ];

  const timezones = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
    { value: 'Europe/Paris', label: 'Central European Time (CET)' },
    { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
    { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
    { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            User Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                <div className="h-10 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Failed to load preferences</p>
          <Button onClick={loadPreferences} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          User Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Currency */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Currency</Label>
          </div>
          <Select 
            value={preferences.currency} 
            onValueChange={(value) => handleUpdatePreference('currency', value)}
            disabled={isSaving}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{currency.symbol}</span>
                    <span>{currency.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            This will be used for all monetary displays and calculations.
          </p>
        </div>

        <Separator />

        {/* Date Format */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Date Format</Label>
          </div>
          <Select 
            value={preferences.dateFormat} 
            onValueChange={(value: any) => handleUpdatePreference('dateFormat', value)}
            disabled={isSaving}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dateFormats.map((format) => (
                <SelectItem key={format.value} value={format.value}>
                  <div className="flex flex-col">
                    <span>{format.label}</span>
                    <span className="text-xs text-muted-foreground">
                      Example: {format.example}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Theme */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Theme</Label>
          </div>
          <Select 
            value={preferences.theme} 
            onValueChange={(value: any) => handleUpdatePreference('theme', value)}
            disabled={isSaving}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {themes.map((theme) => (
                <SelectItem key={theme.value} value={theme.value}>
                  <div className="flex flex-col">
                    <span>{theme.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {theme.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Language */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Language</Label>
          </div>
          <Select 
            value={preferences.language} 
            onValueChange={(value) => handleUpdatePreference('language', value)}
            disabled={isSaving}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map((language) => (
                <SelectItem key={language.code} value={language.code}>
                  <div className="flex items-center gap-2">
                    <span>{language.flag}</span>
                    <span>{language.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Interface language. Some languages may have limited translations.
          </p>
        </div>

        <Separator />

        {/* Timezone */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Timezone</Label>
          </div>
          <Select 
            value={preferences.timezone} 
            onValueChange={(value) => handleUpdatePreference('timezone', value)}
            disabled={isSaving}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((timezone) => (
                <SelectItem key={timezone.value} value={timezone.value}>
                  {timezone.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* First Day of Week */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-medium">First Day of Week</Label>
          </div>
          <Select 
            value={preferences.firstDayOfWeek.toString()} 
            onValueChange={(value) => handleUpdatePreference('firstDayOfWeek', parseInt(value))}
            disabled={isSaving}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Sunday</SelectItem>
              <SelectItem value="1">Monday</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Indicator */}
        {isSaving && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Saving preferences...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
