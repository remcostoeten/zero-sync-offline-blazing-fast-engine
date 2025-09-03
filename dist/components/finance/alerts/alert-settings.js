'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
const AlertSettings = ({ onSettingsChange }) => {
    const [rules, setRules] = useState([
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
        }
        catch (err) {
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
        }
        catch (err) {
            console.error('Error saving alert settings:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const updateRule = (ruleId, updates) => {
        setRules(prev => prev.map(rule => rule.id === ruleId ? { ...rule, ...updates } : rule));
    };
    const updatePreference = (key, value) => {
        setPreferences(prev => ({ ...prev, [key]: value }));
    };
    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-800 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
    return (_jsxs("div", { className: "space-y-8", children: [_jsxs("div", { children: [_jsxs("div", { className: "mb-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "Alert Rules" }), _jsx("p", { className: "text-sm text-gray-600", children: "Configure when and how you want to be notified about financial events." })] }), _jsx("div", { className: "space-y-4", children: rules.map((rule) => (_jsx("div", { className: "bg-white border border-gray-200 rounded-lg p-4", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-start space-x-3 flex-1", children: [_jsx("div", { className: "flex-shrink-0 mt-1", children: _jsx("span", { className: "text-lg", children: getTypeIcon(rule.type) }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center space-x-2 mb-1", children: [_jsx("h4", { className: "text-sm font-medium text-gray-900", children: rule.name }), _jsx("span", { className: `px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(rule.severity)}`, children: rule.severity })] }), _jsx("p", { className: "text-sm text-gray-600 mb-3", children: rule.description }), _jsxs("div", { className: "flex items-center space-x-4", children: [rule.threshold !== undefined && (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("label", { className: "text-xs text-gray-500", children: "Threshold:" }), _jsx("input", { type: "number", value: rule.threshold, onChange: (e) => updateRule(rule.id, { threshold: Number(e.target.value) }), className: "w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500", min: "0", max: "100" }), _jsx("span", { className: "text-xs text-gray-500", children: "%" })] })), rule.daysInAdvance !== undefined && (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("label", { className: "text-xs text-gray-500", children: "Days in advance:" }), _jsx("input", { type: "number", value: rule.daysInAdvance, onChange: (e) => updateRule(rule.id, { daysInAdvance: Number(e.target.value) }), className: "w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500", min: "1", max: "365" }), _jsx("span", { className: "text-xs text-gray-500", children: "days" })] })), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("label", { className: "text-xs text-gray-500", children: "Severity:" }), _jsxs("select", { value: rule.severity, onChange: (e) => updateRule(rule.id, { severity: e.target.value }), className: "px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "low", children: "Low" }), _jsx("option", { value: "medium", children: "Medium" }), _jsx("option", { value: "high", children: "High" }), _jsx("option", { value: "critical", children: "Critical" })] })] })] })] })] }), _jsx("div", { className: "flex-shrink-0 ml-4", children: _jsxs("label", { className: "relative inline-flex items-center cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: rule.enabled, onChange: (e) => updateRule(rule.id, { enabled: e.target.checked }), className: "sr-only peer" }), _jsx("div", { className: "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" })] }) })] }) }, rule.id))) })] }), _jsxs("div", { children: [_jsxs("div", { className: "mb-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "Notification Preferences" }), _jsx("p", { className: "text-sm text-gray-600", children: "Choose how you want to receive notifications." })] }), _jsx("div", { className: "bg-white border border-gray-200 rounded-lg p-4", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-gray-900", children: "Email Notifications" }), _jsx("p", { className: "text-sm text-gray-600", children: "Receive alerts via email" })] }), _jsxs("label", { className: "relative inline-flex items-center cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: preferences.emailNotifications, onChange: (e) => updatePreference('emailNotifications', e.target.checked), className: "sr-only peer" }), _jsx("div", { className: "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" })] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-gray-900", children: "Push Notifications" }), _jsx("p", { className: "text-sm text-gray-600", children: "Receive browser push notifications" })] }), _jsxs("label", { className: "relative inline-flex items-center cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: preferences.pushNotifications, onChange: (e) => updatePreference('pushNotifications', e.target.checked), className: "sr-only peer" }), _jsx("div", { className: "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" })] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-gray-900", children: "Toast Notifications" }), _jsx("p", { className: "text-sm text-gray-600", children: "Show pop-up notifications in the app" })] }), _jsxs("label", { className: "relative inline-flex items-center cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: preferences.toastNotifications, onChange: (e) => updatePreference('toastNotifications', e.target.checked), className: "sr-only peer" }), _jsx("div", { className: "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" })] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-gray-900", children: "Daily Digest" }), _jsx("p", { className: "text-sm text-gray-600", children: "Receive a daily summary of alerts" })] }), _jsxs("label", { className: "relative inline-flex items-center cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: preferences.dailyDigest, onChange: (e) => updatePreference('dailyDigest', e.target.checked), className: "sr-only peer" }), _jsx("div", { className: "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" })] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h4", { className: "text-sm font-medium text-gray-900", children: "Weekly Report" }), _jsx("p", { className: "text-sm text-gray-600", children: "Receive a weekly financial summary" })] }), _jsxs("label", { className: "relative inline-flex items-center cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: preferences.weeklyReport, onChange: (e) => updatePreference('weeklyReport', e.target.checked), className: "sr-only peer" }), _jsx("div", { className: "w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" })] })] })] }) })] }), _jsx("div", { className: "flex justify-end", children: _jsxs("button", { onClick: saveSettings, disabled: loading, className: "px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2", children: [loading && (_jsxs("svg", { className: "animate-spin -ml-1 mr-2 h-4 w-4 text-white", fill: "none", viewBox: "0 0 24 24", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] })), _jsx("span", { children: loading ? 'Saving...' : saved ? 'Saved!' : 'Save Settings' })] }) })] }));
};
export default AlertSettings;
//# sourceMappingURL=alert-settings.js.map