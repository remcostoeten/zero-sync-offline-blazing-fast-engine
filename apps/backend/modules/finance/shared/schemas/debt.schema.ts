import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { TBaseEntity } from '../types';
import { createSyncableEntity } from '../db/schema-helpers';

export const debtsSchema = sqliteTable('debts', {
  ...createSyncableEntity(),
  name: text('name').notNull(),
  type: text('type', { enum: ['loan', 'credit_card', 'mortgage', 'personal_debt', 'other'] }).notNull(),
  originalAmount: real('original_amount').notNull(),
  currentBalance: real('current_balance').notNull(),
  interestRate: real('interest_rate').notNull(),
  minimumPayment: real('minimum_payment').notNull(),
  paymentFrequency: text('payment_frequency', { 
    enum: ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'] 
  }).notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  notes: text('notes'),
});

export const debtPaymentsSchema = sqliteTable('debt_payments', {
  ...createSyncableEntity(),
  debtId: integer('debt_id').notNull().references(() => debtsSchema.id),
  amount: real('amount').notNull(),
  paymentDate: text('payment_date').notNull(),
  isExtraPayment: integer('is_extra_payment', { mode: 'boolean' }).default(false),
  notes: text('notes'),
});

export const debtsRelations = relations(debtsSchema, ({ many }) => ({
  payments: many(debtPaymentsSchema),
}));

export const debtPaymentsRelations = relations(debtPaymentsSchema, ({ one }) => ({
  debt: one(debtsSchema, {
    fields: [debtPaymentsSchema.debtId],
    references: [debtsSchema.id],
  }),
}));

type TDebt = TBaseEntity & {
  name: string;
  type: 'loan' | 'credit_card' | 'mortgage' | 'personal_debt' | 'other';
  originalAmount: number;
  currentBalance: number;
  interestRate: number;
  minimumPayment: number;
  paymentFrequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string | null;
  notes: string | null;
  synced: boolean;
};

type TDebtInsert = Omit<TDebt, 'id' | 'createdAt' | 'updatedAt'>;

type TDebtSelect = TDebt;

type TDebtPayment = TBaseEntity & {
  debtId: number;
  amount: number;
  paymentDate: string;
  isExtraPayment: boolean;
  notes: string | null;
  synced: boolean;
};

type TDebtPaymentInsert = Omit<TDebtPayment, 'id' | 'createdAt' | 'updatedAt'>;

type TDebtPaymentSelect = TDebtPayment;

export type { 
  TDebt, 
  TDebtInsert, 
  TDebtSelect,
  TDebtPayment,
  TDebtPaymentInsert,
  TDebtPaymentSelect
};
