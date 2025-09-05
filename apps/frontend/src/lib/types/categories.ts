type TTimestamps = {
  createdAt: Date;
  updatedAt: Date;
};

type TBaseEntity = {
  id: number;
} & TTimestamps;

type TCategory = TBaseEntity & {
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  isDemo: boolean;
  synced: boolean;
};

type TCreateCategoryInput = {
  name: string;
  type: 'income' | 'expense';
  color?: string;
  icon?: string;
  isDemo?: boolean;
};

type TUpdateCategoryInput = {
  id: number;
  name?: string;
  type?: 'income' | 'expense';
  color?: string;
  icon?: string;
  isDemo?: boolean;
};

type TCategoryFilters = {
  type?: 'income' | 'expense';
  isDemo?: boolean;
  limit?: number;
  offset?: number;
};

type TCategoryListOptions = {
  filters?: TCategoryFilters;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
};

type TCategoryError = 
  | { type: 'validation'; message: string; field?: string }
  | { type: 'not_found'; id: number }
  | { type: 'duplicate_name'; name: string }
  | { type: 'unauthorized'; operation: string }
  | { type: 'constraint_violation'; constraint: string }
  | { type: 'unknown'; message: string };

export type { 
  TTimestamps, 
  TBaseEntity, 
  TCategory, 
  TCreateCategoryInput, 
  TUpdateCategoryInput, 
  TCategoryFilters, 
  TCategoryListOptions,
  TCategoryError 
};
