import type { TRecurringTransaction } from '../../../types/finance';
type TProps = {
    onEdit: (transaction: TRecurringTransaction) => void;
    onDelete: (id: number) => void;
    onToggleActive: (id: number, isActive: boolean) => void;
    onGenerate: () => void;
    api: any;
};
export declare function RecurringTransactionList({ onEdit, onDelete, onToggleActive, onGenerate, api }: TProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=recurring-list.d.ts.map