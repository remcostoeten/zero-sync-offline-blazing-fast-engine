'use client';

import React, { useState, useEffect } from 'react';
import { financeApi } from '../../../lib/api/finance-api';
import type { TAlert } from '../../../types/finance';

interface AlertRule {
  id: string;
  type: TAlert['type'];
  name: string;
  description: string;
  enabled: boolean;
  severity: TAlert['severity'];
  threshold?: number;
  daysInAdvance?: number;
}

interface AlertSettingsProps {
  onSettingsChange?: (settings: AlertRule[]) => void;
}

const AlertSettings: React.FC<AlertSettingsProps> = ({ onSettingsChange }) => {
  const [rules, setRules] = useState<AlertRule[]>([
    {
      id: 'budget-warning-90',
      type: 'budget_warning',
      name: 'Budget Warning (90%)',
      description: 'Alert when spending reaches 90% of budget',
      enabled: true,
      severity: 'medium',
      threshold: 90
    },
    {
      id: 'budget-warning-100',
      type: 'budget_warning',
      name: 'Budget Exceeded',
      description: 'Alert when spending exceeds budget',
      enabled: true,
      severity: 'critical',
      threshold: 100
    },
    {
      id: 'recurring-due-3',
      type: 'recurring_due',
      name: 'Recurring Due (3 days)',
      description: 'Alert 3 days before recurring transaction is due',
      enabled: true,
      severity: 'medium',
      daysInAdvance: 3
    },
    {
      id: 'recurring-due-1',
      type: 'recurring_due',
      name: 'Recurring Due (1 day)',
      description: 'Alert 1 day before recurring transaction is due',
      enabled: true,
      severity: 'high',
      daysInAdvance: 1
    },
    {
      id: 'savings-deadline-30',
      type: 'savings_deadline',
      name: 'Savings Deadline (30 days)',
      description: 'Alert 30 days before savings goal deadline',
      enabled: true,
      severity: 'low',
      daysInAdvance: 30
    },
    {
      id: 'savings-deadline-7',
      type: 'savings_deadline',
      name: 'Savings Deadline (7 days)',
      description: 'Alert 7 days before savings goal deadline',
      enabled: true,
      severity: 'high',
      daysInAdvance: 7
    }
  ]);

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    toastNotifications: true,
    dailyDigest: false,
    weeklyReport: true
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (onSettingsChange) {
      onSettingsChange(rules);
    }
  }, [rules, onSettingsChange]);

  const loadSettings = async () => {
    try {
      // In a real app, load from backend
      // const settings = await financeApi.getAlertSettings();
      // setRules(settings.rules);
      // setPreferences(settings.preferences);
    } catch (err) {
      console.error('Error loading alert settings:', err);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      // In a real app, save to backend
      // await financeApi.updateAlertSettings({ rules, preferences });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Error saving alert settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateRule = (ruleId: string, updates: Partial<AlertRule>) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ));
  };

  const updatePreference = (key: string, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const getSeverityColor = (severity: TAlert['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: TAlert['type']) => {
    switch (type) {
      case 'budget_warning': return '💰';
      case 'recurring_due': return '🔄';
      case 'savings_deadline': return '🎯';
      case 'custom': return '📢';
      default: return '📢';
    }
  };

  return (
    <div className="space-y-8">
      {/* Alert Rules */}
      <div>
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Alert Rules</h3>
          <p className="text-sm text-gray-600">
            Configure when and how you want to be notified about financial events.
          </p>
        </div>

        <div className="space-y-4">
          {rules.map((rule) => (
            <div 
              key={rule.id} 
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    <span className="text-lg">{getTypeIcon(rule.type)}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {rule.name}
                      </h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(rule.severity)}`}>
                        {rule.severity}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">
                      {rule.description}
                    </p>

                    <div className="flex items-center space-x-4">
                      {rule.threshold !== undefined && (
                        <div className="flex items-center space-x-2">
                          <label className="text-xs text-gray-500">Threshold:</label>
                          <input
                            type="number"
                            value={rule.threshold}
                            onChange={(e) => updateRule(rule.id, { threshold: Number(e.target.value) })}
                            className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                            min="0"
                            max="100"
                          />
                          <span className="text-xs text-gray-500">%</span>
                        </div>
                      )}

                      {rule.daysInAdvance !== undefined && (
                        <div className="flex items-center space-x-2">
                          <label className="text-xs text-gray-500">Days in advance:</label>
                          <input
                            type="number"
                            value={rule.daysInAdvance}
                            onChange={(e) => updateRule(rule.id, { daysInAdvance: Number(e.target.value) })}
                            className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                            min="1"
                            max="365"
                          />
                          <span className="text-xs text-gray-500">days</span>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <label className="text-xs text-gray-500">Severity:</label>
                        <select
                          value={rule.severity}
                          onChange={(e) => updateRule(rule.id, { severity: e.target.value as TAlert['severity'] })}
                          className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 ml-4">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={(e) => updateRule(rule.id, { enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notification Preferences */}
      <div>
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Notification Preferences</h3>
          <p className="text-sm text-gray-600">
            Choose how you want to receive notifications.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                <p className="text-sm text-gray-600">Receive alerts via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={(e) => updatePreference('emailNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Push Notifications</h4>
                <p className="text-sm text-gray-600">Receive browser push notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.pushNotifications}
                  onChange={(e) => updatePreference('pushNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Toast Notifications</h4>
                <p className="text-sm text-gray-600">Show pop-up notifications in the app</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.toastNotifications}
                  onChange={(e) => updatePreference('toastNotifications', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Daily Digest</h4>
                <p className="text-sm text-gray-600">Receive a daily summary of alerts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.dailyDigest}
                  onChange={(e) => updatePreference('dailyDigest', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Weekly Report</h4>
                <p className="text-sm text-gray-600">Receive a weekly financial summary</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.weeklyReport}
                  onChange={(e) => updatePreference('weeklyReport', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {loading && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          <span>{loading ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}</span>
        </button>
      </div>
    </div>
  );
};

export default AlertSettings;
