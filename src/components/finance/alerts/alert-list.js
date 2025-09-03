'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { financeApi } from '../../../lib/api/finance-api';
const AlertList = ({ filters = {}, showActions = true, maxItems }) => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
        }
        catch (err) {
            console.error('Error loading alerts:', err);
            setError('Failed to load alerts');
        }
        finally {
            setLoading(false);
        }
    };
    const handleMarkAsRead = async (id) => {
        try {
            await financeApi.markAlertAsRead(id);
            setAlerts(prev => prev.map(alert => alert.id === id ? { ...alert, is_read: true } : alert));
        }
        catch (err) {
            console.error('Error marking alert as read:', err);
        }
    };
    const handleDismiss = async (id) => {
        try {
            await financeApi.dismissAlert(id);
            setAlerts(prev => prev.filter(alert => alert.id !== id));
        }
        catch (err) {
            console.error('Error dismissing alert:', err);
        }
    };
    const handleDelete = async (id) => {
        try {
            await financeApi.deleteAlert(id);
            setAlerts(prev => prev.filter(alert => alert.id !== id));
        }
        catch (err) {
            console.error('Error deleting alert:', err);
        }
    };
    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'critical': return '🚨';
            case 'high': return '⚠️';
            case 'medium': return '⚡';
            case 'low': return 'ℹ️';
            default: return 'ℹ️';
        }
    };
    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'border-red-500 bg-red-50';
            case 'high': return 'border-orange-500 bg-orange-50';
            case 'medium': return 'border-yellow-500 bg-yellow-50';
            case 'low': return 'border-blue-500 bg-blue-50';
            default: return 'border-gray-500 bg-gray-50';
        }
    };
    const getTypeIcon = (type) => {
        switch (type) {
            case 'budget_warning': return '💰';
            case 'recurring_due': return '🔄';
            case 'savings_deadline': return '🎯';
            case 'custom': return '📢';
            default: return '📢';
        }
    };
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };
    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    if (loading) {
        return (_jsx("div", { className: "space-y-3", children: [...Array(3)].map((_, i) => (_jsx("div", { className: "animate-pulse", children: _jsx("div", { className: "h-20 bg-gray-200 rounded-lg" }) }, i))) }));
    }
    if (error) {
        return (_jsxs("div", { className: "text-center py-8", children: [_jsx("p", { className: "text-red-600 mb-4", children: error }), _jsx("button", { onClick: loadAlerts, className: "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700", children: "Try Again" })] }));
    }
    if (alerts.length === 0) {
        return (_jsxs("div", { className: "text-center py-8", children: [_jsx("div", { className: "text-6xl mb-4", children: "\uD83C\uDF89" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "No alerts" }), _jsx("p", { className: "text-gray-600", children: filters.isRead === false ? 'All caught up! No unread alerts.' : 'No alerts found.' })] }));
    }
    return (_jsx("div", { className: "space-y-3", children: alerts.map((alert) => (_jsx("div", { className: `p-4 border-l-4 rounded-lg ${getSeverityColor(alert.severity)} ${!alert.is_read ? 'shadow-md' : 'opacity-75'}`, children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center mb-2", children: [_jsx("span", { className: "text-lg mr-2", children: getSeverityIcon(alert.severity) }), _jsx("span", { className: "text-sm mr-2", children: getTypeIcon(alert.type) }), _jsx("h3", { className: `text-sm font-medium ${!alert.is_read ? 'font-bold' : ''}`, children: alert.title }), !alert.is_read && (_jsx("span", { className: "ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800", children: "New" }))] }), _jsx("p", { className: "text-sm text-gray-700 mb-2", children: alert.message }), _jsxs("div", { className: "flex items-center text-xs text-gray-500 space-x-4", children: [_jsxs("span", { children: [formatDate(alert.created_at), " at ", formatTime(alert.created_at)] }), alert.due_date && (_jsxs("span", { children: ["Due: ", formatDate(alert.due_date)] })), _jsxs("span", { className: "capitalize", children: [alert.severity, " priority"] })] })] }), showActions && (_jsxs("div", { className: "flex items-center space-x-2 ml-4", children: [!alert.is_read && (_jsx("button", { onClick: () => handleMarkAsRead(alert.id), className: "text-blue-600 hover:text-blue-800 text-sm font-medium", title: "Mark as read", children: "\u2713" })), _jsx("button", { onClick: () => handleDismiss(alert.id), className: "text-gray-400 hover:text-gray-600 text-sm", title: "Dismiss", children: "\u2715" }), _jsx("button", { onClick: () => handleDelete(alert.id), className: "text-red-400 hover:text-red-600 text-sm", title: "Delete", children: "\uD83D\uDDD1\uFE0F" })] }))] }) }, alert.id))) }));
};
export default AlertList;
//# sourceMappingURL=alert-list.js.map