'use client';

import { createBudgetSchema, updateBudgetSchema } from '@/lib/validation/schemas';
import { z } from 'zod';

type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;

// API Response types
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
  count?: number;
};

type BudgetWithUtilization = {
  id: number;
  categoryId: number;
  amount: number;
  period: 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  status: 'on_track' | 'warning' | 'exceeded' | 'completed';
  daysRemaining?: number;
};

type BudgetUtilizationData = {
  utilization: Array<{
    budgetId: number;
    categoryName: string;
    categoryColor: string;
    categoryIcon: string;
    budgetAmount: number;
    period: string;
    spentAmount: number;
    remainingAmount: number;
    percentageUsed: number;
    status: string;
  }>;
  alerts: Array<{
    budgetId: number;
    categoryName: string;
    budgetAmount: number;
    spentAmount: number;
    percentageUsed: number;
    alertLevel: 'warning' | 'critical' | 'exceeded';
    message: string;
  }>;
  summary: {
    totalBudgets: number;
    totalBudgetAmount: number;
    totalSpentAmount: number;
    alertsCount: number;
    exceededCount: number;
  };
};

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

// Helper function to handle API responses
async function handleApiResponse<T>(response: Response): Promise<T> {
  const result: ApiResponse<T> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || result.details || 'API request failed');
  }
  
  return result.data as T;
}

// Budget CRUD operations
export async function getBudgets(filters?: {
  categoryId?: number;
  period?: 'monthly' | 'yearly' | 'all';
  isActive?: boolean;
  limit?: number;
  offset?: number;
}): Promise<BudgetWithUtilization[]> {
  const params = new URLSearchParams();
  
  if (filters?.categoryId) params.append('categoryId', filters.categoryId.toString());
  if (filters?.period) params.append('period', filters.period);
  if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.offset) params.append('offset', filters.offset.toString());
  
  const response = await fetch(`${backendUrl}/api/finance/budgets?${params.toString()}`);
  return handleApiResponse<BudgetWithUtilization[]>(response);
}

export async function getBudgetById(id: number): Promise<BudgetWithUtilization> {
  const response = await fetch(`${backendUrl}/api/finance/budgets/${id}`);
  return handleApiResponse<BudgetWithUtilization>(response);
}

export async function createBudget(data: CreateBudgetInput): Promise<BudgetWithUtilization> {
  const response = await fetch(`${backendUrl}/api/finance/budgets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleApiResponse<BudgetWithUtilization>(response);
}

export async function updateBudget(data: UpdateBudgetInput): Promise<BudgetWithUtilization> {
  const { id, ...updateData } = data;
  const response = await fetch(`${backendUrl}/api/finance/budgets/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updateData),
  });
  return handleApiResponse<BudgetWithUtilization>(response);
}

export async function deleteBudget(id: number): Promise<void> {
  const response = await fetch(`${backendUrl}/api/finance/budgets/${id}`, {
    method: 'DELETE',
  });
  await handleApiResponse<void>(response);
}

export async function toggleBudgetStatus(id: number): Promise<BudgetWithUtilization> {
  const response = await fetch(`${backendUrl}/api/finance/budgets/${id}/toggle`, {
    method: 'PATCH',
  });
  return handleApiResponse<BudgetWithUtilization>(response);
}

export async function resetBudget(id: number, options?: {
  newAmount?: number;
  resetPeriod?: boolean;
  resetSpent?: boolean;
  notes?: string;
}): Promise<BudgetWithUtilization> {
  const response = await fetch(`${backendUrl}/api/finance/budgets/${id}/reset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options || {}),
  });
  return handleApiResponse<BudgetWithUtilization>(response);
}

export async function getBudgetUtilization(filters?: {
  categoryId?: number;
  period?: 'monthly' | 'yearly' | 'all';
  startDate?: string;
  endDate?: string;
  alertsOnly?: boolean;
}): Promise<BudgetUtilizationData> {
  const params = new URLSearchParams();
  
  if (filters?.categoryId) params.append('categoryId', filters.categoryId.toString());
  if (filters?.period) params.append('period', filters.period);
  if (filters?.startDate) params.append('startDate', filters.startDate);
  if (filters?.endDate) params.append('endDate', filters.endDate);
  if (filters?.alertsOnly !== undefined) params.append('alertsOnly', filters.alertsOnly.toString());
  
  const response = await fetch(`${backendUrl}/api/finance/budgets/utilization/overview?${params.toString()}`);
  return handleApiResponse<BudgetUtilizationData>(response);
}

// Bulk operations
export async function bulkCreateBudgets(budgets: CreateBudgetInput[]): Promise<BudgetWithUtilization[]> {
  const response = await fetch(`${backendUrl}/api/finance/budgets/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ budgets }),
  });
  return handleApiResponse<BudgetWithUtilization[]>(response);
}

export async function bulkUpdateBudgets(updates: Array<UpdateBudgetInput & { id: number }>): Promise<BudgetWithUtilization[]> {
  const response = await fetch(`${backendUrl}/api/finance/budgets/bulk`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ budgets: updates }),
  });
  return handleApiResponse<BudgetWithUtilization[]>(response);
}

export async function bulkDeleteBudgets(ids: number[]): Promise<{ deleted: number[]; failed: number[] }> {
  const response = await fetch(`${backendUrl}/api/finance/budgets/bulk`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids }),
  });
  return handleApiResponse<{ deleted: number[]; failed: number[] }>(response);
}

// Helper functions for frontend compatibility
export async function getBudgetsSummary() {
  const utilization = await getBudgetUtilization();
  return {
    totalBudgets: utilization.summary.totalBudgets,
    activeBudgets: utilization.summary.totalBudgets, // All budgets in utilization are active
    totalBudgetAmount: utilization.summary.totalBudgetAmount,
    totalSpent: utilization.summary.totalSpentAmount,
    totalRemaining: utilization.summary.totalBudgetAmount - utilization.summary.totalSpentAmount
  };
}

export async function getBudgetAlerts() {
  const utilization = await getBudgetUtilization({ alertsOnly: true });
  return {
    overBudget: utilization.alerts.filter(alert => alert.alertLevel === 'exceeded'),
    nearLimit: utilization.alerts.filter(alert => alert.alertLevel === 'critical' || alert.alertLevel === 'warning'),
    healthyBudgets: [] // Would need to calculate this separately
  };
}

export async function getBudgetInsights() {
  const utilization = await getBudgetUtilization();
  const budgets = await getBudgets();
  
  return {
    totalCategories: new Set(budgets.map(b => b.categoryId)).size,
    averageSpendingRate: budgets.length > 0 
      ? budgets.reduce((sum, b) => sum + b.percentageUsed, 0) / budgets.length 
      : 0,
    mostOverspentCategory: utilization.alerts
      .filter(a => a.alertLevel === 'exceeded')
      .sort((a, b) => b.spentAmount - a.spentAmount)[0],
    bestPerformingBudget: budgets
      .filter(b => b.status === 'on_track')
      .sort((a, b) => b.remainingAmount - a.remainingAmount)[0],
    periodComparison: {
      thisWeek: 0, // Would need separate API calls for period comparison
      lastWeek: 0,
      thisMonth: utilization.summary.totalSpentAmount,
      lastMonth: 0
    }
  };
}

// Get categories for budget creation (reuse from categories feature)
export async function getBudgetCategories() {
  const response = await fetch(`${backendUrl}/api/finance/categories?type=expense`);
  const result: ApiResponse<any[]> = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch categories');
  }
  
  return result.data || [];
}

// Export types for use in components
export type { BudgetWithUtilization, BudgetUtilizationData, CreateBudgetInput, UpdateBudgetInput };

