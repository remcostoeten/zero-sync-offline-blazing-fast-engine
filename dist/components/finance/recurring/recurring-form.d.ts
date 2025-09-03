import type { TRecurringTransaction, TRecurringTransactionFormData } from '../../../types/finance';
type TProps = {
    transaction?: TRecurringTransaction | null;
    onSubmit: (formData: TRecurringTransactionFormData) => Promise<void>;
    onCancel: () => void;
    api: any;
};
export declare function RecurringTransactionForm({ transaction, onSubmit, onCancel, api }: TProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=recurring-form.d.ts.map