import type { TBudget, TBudgetFormData } from '../../../types/finance';
type TProps = {
    budget?: TBudget | null;
    onSubmit: (formData: TBudgetFormData) => Promise<void>;
    onCancel: () => void;
    api: any;
};
export declare function BudgetForm({ budget, onSubmit, onCancel, api }: TProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=budget-form.d.ts.map