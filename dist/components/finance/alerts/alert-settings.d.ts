import React from 'react';
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
declare const AlertSettings: React.FC<AlertSettingsProps>;
export default AlertSettings;
//# sourceMappingURL=alert-settings.d.ts.map