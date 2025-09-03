'use client';

import React, { useState, useEffect } from 'react';
import AlertList from '../components/finance/alerts/alert-list';
import AlertSettings from '../components/finance/alerts/alert-settings';
import AlertNotification, { useAlertNotifications } from '../components/finance/alerts/alert-notification';
import { financeApi } from '../lib/api/finance-api';
import type { TAlert } from '../types/finance';

const AlertsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'settings'>('alerts');
  const [alertStats, setAlertStats] = useState({
    total: 0,
    unread: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  });
  const [filters, setFilters] = useState<{
    isRead?: boolean;
    isDismissed?: boolean;
    type?: TAlert['type'];
    severity?: TAlert['severity'];
  }>({ isDismissed: false });

  const { notifications, addNotification, removeNotification } = useAlertNotifications();

  useEffect(() => {
    loadAlertStats();
    // Check for new critical alerts periodically
    const interval = setInterval(checkForNewAlerts, 40000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadAlertStats = async () => {
    try {
      const allAlertsResponse = await financeApi.getAlerts({ isDismissed: false });
      const allAlerts = allAlertsResponse.data || [];
      
      const stats = {
        total: allAlerts.length,
        unread: allAlerts.filter((a: TAlert) => !a.is_read).length,
        critical: allAlerts.filter((a: TAlert) => a.severity === 'critical').length,
        high: allAlerts.filter((a: TAlert) => a.severity === 'high').length,
        medium: allAlerts.filter((a: TAlert) => a.severity === 'medium').length,
        low: allAlerts.filter((a: TAlert) => a.severity === 'low').length
      };
      
      setAlertStats(stats);
    } catch (err) {
      console.error('Error loading alert stats:', err);
    }
  };

  const checkForNewAlerts = async () => {
    try {
      // Get recent unread critical/high alerts
      const recentAlertsResponse = await financeApi.getAlerts({ 
        isRead: false, 
        isDismissed: false
      });
      const recentAlerts = recentAlertsResponse.data || [];
      
      const urgentAlerts = recentAlerts.filter((alert: TAlert) => 
        (alert.severity === 'critical' || alert.severity === 'high') &&
        new Date(alert.created_at).getTime() > Date.now() - 60000 // Last minute
      );
      
      urgentAlerts.forEach((alert: TAlert) => addNotification(alert));
    } catch (err) {
      console.error('Error checking for new alerts:', err);
    }
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleGenerateAlerts = async () => {
    try {
      await financeApi.generateAllAlerts();
      await loadAlertStats();
      // Refresh alert list by updating filters
      setFilters({ ...filters });
    } catch (err) {
      console.error('Error generating alerts:', err);
    }
  };

  const getSeverityColor = (severity: TAlert['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeColor = (type: TAlert['type']) => {
    switch (type) {
      case 'budget_warning': return 'text-purple-600 bg-purple-100';
      case 'recurring_due': return 'text-indigo-600 bg-indigo-100';
      case 'savings_deadline': return 'text-green-600 bg-green-100';
      case 'custom': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Alert Notifications */}
      <AlertNotification
        alerts={notifications}
        onDismiss={removeNotification}
        position="top-right"
        duration={5000}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Alerts & Notifications</h1>
            <p className="mt-2 text-gray-600">
              Manage your financial alerts and notification preferences
            </p>
          </div>
          
          <button
            onClick={handleGenerateAlerts}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <span>🔄</span>
            <span>Check for Alerts</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{alertStats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{alertStats.unread}</div>
              <div className="text-sm text-gray-600">Unread</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{alertStats.critical}</div>
              <div className="text-sm text-gray-600">Critical</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{alertStats.high}</div>
              <div className="text-sm text-gray-600">High</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{alertStats.medium}</div>
              <div className="text-sm text-gray-600">Medium</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{alertStats.low}</div>
              <div className="text-sm text-gray-600">Low</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'alerts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🔔 Alerts
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ⚙️ Settings
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Alerts</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.isRead === undefined ? 'all' : filters.isRead ? 'read' : 'unread'}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleFilterChange({
                      ...filters,
                      isRead: value === 'all' ? undefined : value === 'read'
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All alerts</option>
                  <option value="unread">Unread only</option>
                  <option value="read">Read only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={filters.type || 'all'}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleFilterChange({
                      ...filters,
                      type: value === 'all' ? undefined : value as TAlert['type']
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All types</option>
                  <option value="budget_warning">💰 Budget Warning</option>
                  <option value="recurring_due">🔄 Recurring Due</option>
                  <option value="savings_deadline">🎯 Savings Deadline</option>
                  <option value="custom">📢 Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity
                </label>
                <select
                  value={filters.severity || 'all'}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleFilterChange({
                      ...filters,
                      severity: value === 'all' ? undefined : value as TAlert['severity']
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All severities</option>
                  <option value="critical">🚨 Critical</option>
                  <option value="high">⚠️ High</option>
                  <option value="medium">⚡ Medium</option>
                  <option value="low">ℹ️ Low</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ isDismissed: false })}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Alert List */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <AlertList 
              filters={filters}
              showActions={true}
            />
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <AlertSettings />
        </div>
      )}
    </div>
  );
};

export default AlertsView;
