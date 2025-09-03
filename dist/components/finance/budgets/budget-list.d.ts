import type { TBudget } from '../../../types/finance';
type TProps = {
    onEdit: (budget: TBudget) => void;
    onDelete: (id: number) => void;
    onRefresh: () => void;
    api: any;
};
export declare function BudgetList({ onEdit, onDelete, onRefresh, api }: TProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=budget-list.d.ts.map