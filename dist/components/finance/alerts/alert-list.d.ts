import React from 'react';
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
declare const AlertList: React.FC<AlertListProps>;
export default AlertList;
//# sourceMappingURL=alert-list.d.ts.map