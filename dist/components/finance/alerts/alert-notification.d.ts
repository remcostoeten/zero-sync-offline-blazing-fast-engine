import React from 'react';
import type { TAlert } from '../../../types/finance';
interface AlertNotificationProps {
    alerts: TAlert[];
    onDismiss: (alertId: number) => void;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    duration?: number;
}
declare const AlertNotification: React.FC<AlertNotificationProps>;
export declare const useAlertNotifications: () => {
    notifications: TAlert[];
    addNotification: (alert: TAlert) => void;
    removeNotification: (alertId: number) => void;
    clearAllNotifications: () => void;
};
export default AlertNotification;
//# sourceMappingURL=alert-notification.d.ts.map