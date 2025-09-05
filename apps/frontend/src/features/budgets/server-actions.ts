import { TBudgetWithUtilization } from './api-actions';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function getBudgetsServer(): Promise<TBudgetWithUtilization[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/finance/budgets`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add cache control for server-side fetching
      next: { revalidate: 60 }, // Revalidate every 60 seconds
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch budgets: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch budgets');
    }

    return result.data || [];
  } catch (error) {
    console.error('Error fetching budgets on server:', error);
    // Return empty array on error to prevent page crashes
    return [];
  }
}

export async function getBudgetUtilizationServer(): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/finance/budgets/utilization/overview`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch budget utilization: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch budget utilization');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching budget utilization on server:', error);
    return null;
  }
}

