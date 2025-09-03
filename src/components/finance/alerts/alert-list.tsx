'use client';

import React, { useState, useEffect } from 'react';
import { financeApi } from '../../../lib/api/finance-api';
import type { TAlert } from '../../../types/finance';

interface AlertListProps {
  filters?: {
    isRead?: boolean;
    isDismissed?: boolean;
    type?: TAlert['type'];
    severity?: TAlert['severity'];
  };
  showActions?: boolean;
  maxItems?: number;
}

const AlertList: React.FC<AlertListProps> = ({ 
  filters = {}, 
  showActions = true, 
  maxItems 
}) => {
  const [alerts, setAlerts] = useState<TAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAlerts();
  }, [filters]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const response = await financeApi.getAlerts(filters);
      const data = response.data || [];
      const limitedData = maxItems ? data.slice(0, maxItems) : data;
      setAlerts(limitedData);
    } catch (err) {
      console.error('Error loading alerts:', err);
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await financeApi.markAlertAsRead(id);
      setAlerts(prev => prev.map(alert => 
        alert.id === id ? { ...alert, is_read: true } : alert
      ));
    } catch (err) {
      console.error('Error marking alert as read:', err);
    }
  };

  const handleDismiss = async (id: number) => {
    try {
      await financeApi.dismissAlert(id);
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    } catch (err) {
      console.error('Error dismissing alert:', err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await financeApi.deleteAlert(id);
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    } catch (err) {
      console.error('Error deleting alert:', err);
    }
  };

  const getSeverityIcon = (severity: TAlert['severity']) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return 'ℹ️';
      default: return 'ℹ️';
    }
  };

  const getSeverityColor = (severity: TAlert['severity']) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={loadAlerts}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No alerts</h3>
        <p className="text-gray-600">
          {filters.isRead === false ? 'All caught up! No unread alerts.' : 'No alerts found.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`p-4 border-l-4 rounded-lg ${getSeverityColor(alert.severity)} ${
            !alert.is_read ? 'shadow-md' : 'opacity-75'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center mb-2">
                <span className="text-lg mr-2">{getSeverityIcon(alert.severity)}</span>
                <span className="text-sm mr-2">{getTypeIcon(alert.type)}</span>
                <h3 className={`text-sm font-medium ${!alert.is_read ? 'font-bold' : ''}`}>
                  {alert.title}
                </h3>
                {!alert.is_read && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    New
                  </span>
                )}
              </div>
              
              <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
              
              <div className="flex items-center text-xs text-gray-500 space-x-4">
                <span>{formatDate(alert.created_at)} at {formatTime(alert.created_at)}</span>
                {alert.due_date && (
                  <span>Due: {formatDate(alert.due_date)}</span>
                )}
                <span className="capitalize">{alert.severity} priority</span>
              </div>
            </div>

            {showActions && (
              <div className="flex items-center space-x-2 ml-4">
                {!alert.is_read && (
                  <button
                    onClick={() => handleMarkAsRead(alert.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    title="Mark as read"
                  >
                    ✓
                  </button>
                )}
                
                <button
                  onClick={() => handleDismiss(alert.id)}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                  title="Dismiss"
                >
                  ✕
                </button>
                
                <button
                  onClick={() => handleDelete(alert.id)}
                  className="text-red-400 hover:text-red-600 text-sm"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AlertList;
