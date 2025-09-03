'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import AlertList from '../components/finance/alerts/alert-list';
import AlertSettings from '../components/finance/alerts/alert-settings';
import AlertNotification, { useAlertNotifications } from '../components/finance/alerts/alert-notification';
import { financeApi } from '../lib/api/finance-api';
const AlertsView = () => {
    const [activeTab, setActiveTab] = useState('alerts');
    const [alertStats, setAlertStats] = useState({
        total: 0,
        unread: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
    });
    const [filters, setFilters] = useState({ isDismissed: false });
    const { notifications, addNotification, removeNotification } = useAlertNotifications();
    useEffect(() => {
        loadAlertStats();
        // Check for new critical alerts periodically
        const interval = setInterval(checkForNewAlerts, 30000); // Every 30 seconds
        return () => clearInterval(interval);
    }, []);
    const loadAlertStats = async () => {
        try {
            const allAlertsResponse = await financeApi.getAlerts({ isDismissed: false });
            const allAlerts = allAlertsResponse.data || [];
            const stats = {
                total: allAlerts.length,
                unread: allAlerts.filter((a) => !a.is_read).length,
                critical: allAlerts.filter((a) => a.severity === 'critical').length,
                high: allAlerts.filter((a) => a.severity === 'high').length,
                medium: allAlerts.filter((a) => a.severity === 'medium').length,
                low: allAlerts.filter((a) => a.severity === 'low').length
            };
            setAlertStats(stats);
        }
        catch (err) {
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
            const urgentAlerts = recentAlerts.filter((alert) => (alert.severity === 'critical' || alert.severity === 'high') &&
                new Date(alert.created_at).getTime() > Date.now() - 60000 // Last minute
            );
            urgentAlerts.forEach((alert) => addNotification(alert));
        }
        catch (err) {
            console.error('Error checking for new alerts:', err);
        }
    };
    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };
    const handleGenerateAlerts = async () => {
        try {
            await financeApi.generateAllAlerts();
            await loadAlertStats();
            // Refresh alert list by updating filters
            setFilters({ ...filters });
        }
        catch (err) {
            console.error('Error generating alerts:', err);
        }
    };
    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'text-red-600 bg-red-100';
            case 'high': return 'text-orange-600 bg-orange-100';
            case 'medium': return 'text-yellow-600 bg-yellow-100';
            case 'low': return 'text-blue-600 bg-blue-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };
    const getTypeColor = (type) => {
        switch (type) {
            case 'budget_warning': return 'text-purple-600 bg-purple-100';
            case 'recurring_due': return 'text-indigo-600 bg-indigo-100';
            case 'savings_deadline': return 'text-green-600 bg-green-100';
            case 'custom': return 'text-gray-600 bg-gray-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };
    return (_jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [_jsx(AlertNotification, { alerts: notifications, onDismiss: removeNotification, position: "top-right", duration: 5000 }), _jsxs("div", { className: "mb-8", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Alerts & Notifications" }), _jsx("p", { className: "mt-2 text-gray-600", children: "Manage your financial alerts and notification preferences" })] }), _jsxs("button", { onClick: handleGenerateAlerts, className: "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2", children: [_jsx("span", { children: "\uD83D\uDD04" }), _jsx("span", { children: "Check for Alerts" })] })] }), _jsxs("div", { className: "mt-6 grid grid-cols-2 md:grid-cols-6 gap-4", children: [_jsx("div", { className: "bg-white rounded-lg border border-gray-200 p-4", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-gray-900", children: alertStats.total }), _jsx("div", { className: "text-sm text-gray-600", children: "Total" })] }) }), _jsx("div", { className: "bg-white rounded-lg border border-gray-200 p-4", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-blue-600", children: alertStats.unread }), _jsx("div", { className: "text-sm text-gray-600", children: "Unread" })] }) }), _jsx("div", { className: "bg-white rounded-lg border border-gray-200 p-4", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-red-600", children: alertStats.critical }), _jsx("div", { className: "text-sm text-gray-600", children: "Critical" })] }) }), _jsx("div", { className: "bg-white rounded-lg border border-gray-200 p-4", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-orange-600", children: alertStats.high }), _jsx("div", { className: "text-sm text-gray-600", children: "High" })] }) }), _jsx("div", { className: "bg-white rounded-lg border border-gray-200 p-4", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-yellow-600", children: alertStats.medium }), _jsx("div", { className: "text-sm text-gray-600", children: "Medium" })] }) }), _jsx("div", { className: "bg-white rounded-lg border border-gray-200 p-4", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-blue-600", children: alertStats.low }), _jsx("div", { className: "text-sm text-gray-600", children: "Low" })] }) })] })] }), _jsx("div", { className: "border-b border-gray-200 mb-6", children: _jsxs("nav", { className: "-mb-px flex space-x-8", children: [_jsx("button", { onClick: () => setActiveTab('alerts'), className: `py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'alerts'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`, children: "\uD83D\uDD14 Alerts" }), _jsx("button", { onClick: () => setActiveTab('settings'), className: `py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'settings'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`, children: "\u2699\uFE0F Settings" })] }) }), activeTab === 'alerts' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-white border border-gray-200 rounded-lg p-4", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-4", children: "Filter Alerts" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Status" }), _jsxs("select", { value: filters.isRead === undefined ? 'all' : filters.isRead ? 'read' : 'unread', onChange: (e) => {
                                                    const value = e.target.value;
                                                    handleFilterChange({
                                                        ...filters,
                                                        isRead: value === 'all' ? undefined : value === 'read'
                                                    });
                                                }, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "all", children: "All alerts" }), _jsx("option", { value: "unread", children: "Unread only" }), _jsx("option", { value: "read", children: "Read only" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Type" }), _jsxs("select", { value: filters.type || 'all', onChange: (e) => {
                                                    const value = e.target.value;
                                                    handleFilterChange({
                                                        ...filters,
                                                        type: value === 'all' ? undefined : value
                                                    });
                                                }, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "all", children: "All types" }), _jsx("option", { value: "budget_warning", children: "\uD83D\uDCB0 Budget Warning" }), _jsx("option", { value: "recurring_due", children: "\uD83D\uDD04 Recurring Due" }), _jsx("option", { value: "savings_deadline", children: "\uD83C\uDFAF Savings Deadline" }), _jsx("option", { value: "custom", children: "\uD83D\uDCE2 Custom" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Severity" }), _jsxs("select", { value: filters.severity || 'all', onChange: (e) => {
                                                    const value = e.target.value;
                                                    handleFilterChange({
                                                        ...filters,
                                                        severity: value === 'all' ? undefined : value
                                                    });
                                                }, className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "all", children: "All severities" }), _jsx("option", { value: "critical", children: "\uD83D\uDEA8 Critical" }), _jsx("option", { value: "high", children: "\u26A0\uFE0F High" }), _jsx("option", { value: "medium", children: "\u26A1 Medium" }), _jsx("option", { value: "low", children: "\u2139\uFE0F Low" })] })] }), _jsx("div", { className: "flex items-end", children: _jsx("button", { onClick: () => setFilters({ isDismissed: false }), className: "w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200", children: "Clear Filters" }) })] })] }), _jsx("div", { className: "bg-white border border-gray-200 rounded-lg p-6", children: _jsx(AlertList, { filters: filters, showActions: true }) })] })), activeTab === 'settings' && (_jsx("div", { className: "bg-white border border-gray-200 rounded-lg p-6", children: _jsx(AlertSettings, {}) }))] }));
};
export default AlertsView;
//# sourceMappingURL=alerts-view.js.map