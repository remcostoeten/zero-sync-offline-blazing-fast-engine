'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
const AlertNotification = ({ alerts = [], onDismiss, position = 'top-right', duration = 5000 }) => {
    const [toasts, setToasts] = useState([]);
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
                    setToasts(prev => prev.map(t => t.id === toast.id ? { ...t, show: false } : t));
                    // Remove from DOM after animation
                    setTimeout(() => {
                        setToasts(prev => prev.filter(t => t.id !== toast.id));
                    }, 300);
                }, duration);
            });
        }
    }, [alerts, duration]);
    const handleDismiss = (toastId) => {
        const toast = toasts.find(t => t.id === toastId);
        if (toast) {
            // Hide toast
            setToasts(prev => prev.map(t => t.id === toastId ? { ...t, show: false } : t));
            // Remove from DOM after animation
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== toastId));
            }, 300);
            // Call parent dismiss handler
            onDismiss(toast.id);
        }
    };
    const getSeverityStyles = (severity) => {
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
    const getPositionStyles = (position) => {
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
    return createPortal(_jsx("div", { className: `fixed ${getPositionStyles(position)} z-50 space-y-2 max-w-sm`, children: toasts.map((toast) => {
            const styles = getSeverityStyles(toast.severity);
            return (_jsx("div", { className: `
              transform transition-all duration-300 ease-in-out
              ${toast.show
                    ? 'translate-x-0 opacity-100 scale-100'
                    : 'translate-x-full opacity-0 scale-95'}
              ${styles.bgColor} ${styles.textColor}
              rounded-lg shadow-lg border ${styles.borderColor}
              max-w-sm w-full p-4
            `, children: _jsxs("div", { className: "flex items-start", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx("span", { className: "text-lg", children: styles.icon }) }), _jsxs("div", { className: "ml-3 w-0 flex-1", children: [_jsx("p", { className: "text-sm font-medium", children: toast.title }), _jsx("p", { className: "mt-1 text-sm opacity-90", children: toast.message }), toast.due_date && (_jsxs("p", { className: "mt-1 text-xs opacity-75", children: ["Due: ", new Date(toast.due_date).toLocaleDateString()] }))] }), _jsx("div", { className: "ml-4 flex-shrink-0 flex", children: _jsxs("button", { className: `
                    inline-flex ${styles.textColor} hover:opacity-75 
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white
                    transition-opacity duration-150
                  `, onClick: () => handleDismiss(toast.id), children: [_jsx("span", { className: "sr-only", children: "Close" }), _jsx("svg", { className: "h-5 w-5", viewBox: "0 0 20 20", fill: "currentColor", children: _jsx("path", { fillRule: "evenodd", d: "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z", clipRule: "evenodd" }) })] }) })] }) }, toast.id));
        }) }), document.body);
};
// Hook for managing toast notifications
export const useAlertNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const addNotification = (alert) => {
        setNotifications(prev => [...prev, alert]);
    };
    const removeNotification = (alertId) => {
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
//# sourceMappingURL=alert-notification.js.map