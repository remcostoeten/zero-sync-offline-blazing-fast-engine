import React from 'react';
import type { TDebt } from '../../../types/finance';
interface DebtListProps {
    onEdit?: (debt: TDebt) => void;
    onDelete?: (debt: TDebt) => void;
    onAddPayment?: (debt: TDebt) => void;
    showActions?: boolean;
}
declare const DebtList: React.FC<DebtListProps>;
export default DebtList;
//# sourceMappingURL=debt-list.d.ts.map