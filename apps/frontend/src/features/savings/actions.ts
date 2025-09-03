'use server';

import { getDb } from '@/lib/database/connection';
import { savingsGoalsSchema, TSavingsGoal } from '@/lib/database/schemas';
import { createSavingsGoalSchema, updateSavingsGoalSchema } from '@/lib/validation/schemas';
import { eq, desc, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

type CreateSavingsGoalInput = z.infer<typeof createSavingsGoalSchema>;
type UpdateSavingsGoalInput = z.infer<typeof updateSavingsGoalSchema>;

// Extended savings goal type with progress info
export type SavingsGoalWithProgress = TSavingsGoal & {
  progress: {
    percentage: number;
    remaining: number;
    monthsToTarget?: number;
    recommendedMonthly?: number;
    isOnTrack: boolean;
    daysLeft?: number;
  };
};

// Helper to calculate progress and recommendations
function calculateProgress(goal: TSavingsGoal): SavingsGoalWithProgress['progress'] {
  const percentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  
  let monthsToTarget: number | undefined;
  let recommendedMonthly: number | undefined;
  let isOnTrack = true;
  let daysLeft: number | undefined;

  if (goal.targetDate && remaining > 0) {
    const today = new Date();
    const targetDate = new Date(goal.targetDate);
    const timeDiff = targetDate.getTime() - today.getTime();
    daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
    monthsToTarget = Math.ceil(daysLeft / 30.44); // Average days per month
    
    if (monthsToTarget > 0) {
      recommendedMonthly = remaining / monthsToTarget;
      
      // Check if on track based on monthly target
      if (goal.monthlyTarget) {
        isOnTrack = goal.monthlyTarget >= recommendedMonthly;
      }
    }
  } else if (remaining > 0 && goal.monthlyTarget) {
    // Calculate months based on monthly target
    monthsToTarget = Math.ceil(remaining / goal.monthlyTarget);
  }

  return {
    percentage: Math.min(percentage, 100),
    remaining,
    monthsToTarget,
    recommendedMonthly,
    isOnTrack,
    daysLeft: daysLeft && daysLeft > 0 ? daysLeft : undefined
  };
}

// Create a new savings goal
export async function createSavingsGoal(input: CreateSavingsGoalInput): Promise<TSavingsGoal> {
  const validatedData = createSavingsGoalSchema.parse(input);
  const db = getDb();
  
  const result = await db
    .insert(savingsGoalsSchema)
    .values({
      ...validatedData,
      color: validatedData.color || '#3B82F6',
      icon: validatedData.icon || '🎯',
    })
    .returning();
    
  revalidatePath('/savings');
  
  return result[0];
}

// Get all savings goals with progress calculations
export async function getSavingsGoals(filters?: {
  priority?: 'low' | 'medium' | 'high';
  isActive?: boolean;
  isCompleted?: boolean;
  category?: string;
}): Promise<SavingsGoalWithProgress[]> {
  const db = getDb();
  
  let query = db
    .select()
    .from(savingsGoalsSchema)
    .orderBy(desc(savingsGoalsSchema.priority), desc(savingsGoalsSchema.createdAt));
    
  // Apply filters would go here if needed
  // For now, we'll apply filters in memory for simplicity
  
  const goals = await query;
  
  // Filter and calculate progress
  const filteredGoals = goals
    .filter(goal => {
      if (filters?.priority && goal.priority !== filters.priority) return false;
      if (filters?.isActive !== undefined && goal.isActive !== filters.isActive) return false;
      if (filters?.isCompleted !== undefined && goal.isCompleted !== filters.isCompleted) return false;
      if (filters?.category && goal.category !== filters.category) return false;
      return true;
    })
    .map(goal => ({
      ...goal,
      progress: calculateProgress(goal)
    }));
  
  return filteredGoals;
}

// Get savings goal by ID
export async function getSavingsGoalById(id: number): Promise<TSavingsGoal | null> {
  const db = getDb();
  
  const result = await db
    .select()
    .from(savingsGoalsSchema)
    .where(eq(savingsGoalsSchema.id, id))
    .limit(1);
    
  return result[0] || null;
}

// Update a savings goal
export async function updateSavingsGoal(input: UpdateSavingsGoalInput): Promise<TSavingsGoal> {
  const validatedData = updateSavingsGoalSchema.parse(input);
  const { id, ...updateData } = validatedData;
  const db = getDb();
  
  // Auto-complete goal if current amount reaches target
  if (updateData.currentAmount && updateData.targetAmount && 
      updateData.currentAmount >= updateData.targetAmount) {
    updateData.isCompleted = true;
  }
  
  const result = await db
    .update(savingsGoalsSchema)
    .set({
      ...updateData,
      updatedAt: sql`CURRENT_TIMESTAMP`
    })
    .where(eq(savingsGoalsSchema.id, parseInt(id!)))
    .returning();
    
  revalidatePath('/savings');
  
  return result[0];
}

// Update savings goal progress (add/subtract amount)
export async function updateSavingsProgress(input: {
  id: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
}): Promise<TSavingsGoal> {
  const db = getDb();
  const goalId = parseInt(input.id);
  
  // Get current goal
  const [currentGoal] = await db
    .select()
    .from(savingsGoalsSchema)
    .where(eq(savingsGoalsSchema.id, goalId))
    .limit(1);
    
  if (!currentGoal) {
    throw new Error('Savings goal not found');
  }
  
  // Calculate new amount
  const newAmount = input.type === 'deposit' 
    ? currentGoal.currentAmount + input.amount
    : Math.max(0, currentGoal.currentAmount - input.amount);
  
  // Check if goal is completed
  const isCompleted = newAmount >= currentGoal.targetAmount;
  
  const result = await db
    .update(savingsGoalsSchema)
    .set({
      currentAmount: newAmount,
      isCompleted,
      updatedAt: sql`CURRENT_TIMESTAMP`
    })
    .where(eq(savingsGoalsSchema.id, goalId))
    .returning();
    
  revalidatePath('/savings');
  
  return result[0];
}

// Delete a savings goal
export async function deleteSavingsGoal(input: { id: string }): Promise<void> {
  const db = getDb();
  
  await db
    .delete(savingsGoalsSchema)
    .where(eq(savingsGoalsSchema.id, parseInt(input.id)));
    
  revalidatePath('/savings');
}

// Get savings goals summary
export async function getSavingsGoalsSummary() {
  const db = getDb();
  
  const [summary] = await db
    .select({
      totalGoals: sql<number>`COUNT(*)`,
      activeGoals: sql<number>`COUNT(CASE WHEN is_active = 1 THEN 1 END)`,
      completedGoals: sql<number>`COUNT(CASE WHEN is_completed = 1 THEN 1 END)`,
      totalTargetAmount: sql<number>`COALESCE(SUM(CASE WHEN is_active = 1 THEN target_amount ELSE 0 END), 0)`,
      totalCurrentAmount: sql<number>`COALESCE(SUM(CASE WHEN is_active = 1 THEN current_amount ELSE 0 END), 0)`,
      totalRemaining: sql<number>`COALESCE(SUM(CASE WHEN is_active = 1 AND is_completed = 0 THEN (target_amount - current_amount) ELSE 0 END), 0)`
    })
    .from(savingsGoalsSchema);
    
  return summary;
}

// Get savings goals that need attention (behind target, due soon)
export async function getSavingsGoalsAlerts(): Promise<{
  behindTarget: SavingsGoalWithProgress[];
  dueSoon: SavingsGoalWithProgress[];
  completed: SavingsGoalWithProgress[];
}> {
  const goals = await getSavingsGoals({ isActive: true });
  const today = new Date();
  
  const behindTarget = goals.filter(g => 
    !g.isCompleted && 
    g.progress.daysLeft && 
    g.progress.daysLeft > 0 && 
    !g.progress.isOnTrack
  );
  
  const dueSoon = goals.filter(g => 
    !g.isCompleted && 
    g.progress.daysLeft && 
    g.progress.daysLeft <= 30 && 
    g.progress.daysLeft > 0
  );
  
  const completed = goals.filter(g => g.isCompleted);
  
  return { behindTarget, dueSoon, completed };
}

// Get recommended monthly savings amounts for all active goals
export async function getRecommendedMonthlySavings(): Promise<{
  totalRecommended: number;
  goalBreakdown: { goalName: string; recommended: number; priority: string }[];
}> {
  const goals = await getSavingsGoals({ isActive: true, isCompleted: false });
  
  let totalRecommended = 0;
  const goalBreakdown = goals
    .filter(g => g.progress.recommendedMonthly && g.progress.recommendedMonthly > 0)
    .map(g => {
      const recommended = g.progress.recommendedMonthly!;
      totalRecommended += recommended;
      return {
        goalName: g.name,
        recommended,
        priority: g.priority
      };
    })
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority as keyof typeof priorityOrder] - 
             priorityOrder[a.priority as keyof typeof priorityOrder];
    });
  
  return { totalRecommended, goalBreakdown };
}
