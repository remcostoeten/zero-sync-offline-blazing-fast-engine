'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { TAlert } from '../../../types/finance';

interface ToastNotification extends Omit<TAlert, 'id'> {
  id: string;
  show: boolean;
}

interface AlertNotificationProps {
  alerts: TAlert[];
  onDismiss: (alertId: number) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  duration?: number; // Auto-dismiss duration in ms
}

const AlertNotification: React.FC<AlertNotificationProps> = ({
  alerts = [],
  onDismiss,
  position = 'top-right',
  duration = 5000
}) => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  useEffect(() => {
    // Convert new alerts to toast notifications
    const newToasts = alerts
      .filter(alert => alert.severity === 'critical' || alert.severity === 'high')
      .filter(alert => !toasts.find(toast => toast.id === alert.id.toString()))
      .map(alert => ({
        ...alert,
        id: alert.id.toString(),
        show: true
      }));

    if (newToasts.length > 0) {
      setToasts(prev => [...prev, ...newToasts]);

      // Auto-dismiss toasts after duration
      newToasts.forEach(toast => {
        setTimeout(() => {
          setToasts(prev => 
            prev.map(t => 
              t.id === toast.id ? { ...t, show: false } : t
            )
          );

          // Remove from DOM after animation
          setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== toast.id));
          }, 300);
        }, duration);
      });
    }
  }, [alerts, duration]);

  const handleDismiss = (toastId: string) => {
    const toast = toasts.find(t => t.id === toastId);
    if (toast) {
      // Hide toast
      setToasts(prev => 
        prev.map(t => 
          t.id === toastId ? { ...t, show: false } : t
        )
      );

      // Remove from DOM after animation
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toastId));
      }, 300);

      // Call parent dismiss handler
      onDismiss(toast.id as any);
    }
  };

  const getSeverityStyles = (severity: TAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          bgColor: 'bg-red-600',
          textColor: 'text-white',
          borderColor: 'border-red-700',
          icon: '🚨'
        };
      case 'high':
        return {
          bgColor: 'bg-orange-500',
          textColor: 'text-white',
          borderColor: 'border-orange-600',
          icon: '⚠️'
        };
      case 'medium':
        return {
          bgColor: 'bg-yellow-500',
          textColor: 'text-gray-900',
          borderColor: 'border-yellow-600',
          icon: '⚡'
        };
      default:
        return {
          bgColor: 'bg-blue-500',
          textColor: 'text-white',
          borderColor: 'border-blue-600',
          icon: 'ℹ️'
        };
    }
  };

  const getPositionStyles = (position: string) => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  if (toasts.length === 0 || typeof window === 'undefined') {
    return null;
  }

  return createPortal(
    <div className={`fixed ${getPositionStyles(position)} z-50 space-y-2 max-w-sm`}>
      {toasts.map((toast) => {
        const styles = getSeverityStyles(toast.severity);
        
        return (
          <div
            key={toast.id}
            className={`
              transform transition-all duration-300 ease-in-out
              ${toast.show 
                ? 'translate-x-0 opacity-100 scale-100' 
                : 'translate-x-full opacity-0 scale-95'
              }
              ${styles.bgColor} ${styles.textColor}
              rounded-lg shadow-lg border ${styles.borderColor}
              max-w-sm w-full p-4
            `}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-lg">{styles.icon}</span>
              </div>
              
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium">
                  {toast.title}
                </p>
                <p className="mt-1 text-sm opacity-90">
                  {toast.message}
                </p>
                {toast.due_date && (
                  <p className="mt-1 text-xs opacity-75">
                    Due: {new Date(toast.due_date).toLocaleDateString()}
                  </p>
                )}
              </div>
              
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  className={`
                    inline-flex ${styles.textColor} hover:opacity-75 
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white
                    transition-opacity duration-150
                  `}
                  onClick={() => handleDismiss(toast.id)}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>,
    document.body
  );
};

// Hook for managing toast notifications
export const useAlertNotifications = () => {
  const [notifications, setNotifications] = useState<TAlert[]>([]);

  const addNotification = (alert: TAlert) => {
    setNotifications(prev => [...prev, alert]);
  };

  const removeNotification = (alertId: number) => {
    setNotifications(prev => prev.filter(alert => alert.id !== alertId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications
  };
};

export default AlertNotification;
