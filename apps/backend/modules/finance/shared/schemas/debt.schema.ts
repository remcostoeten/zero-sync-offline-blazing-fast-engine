import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { TBaseEntity } from '../types';
import { createSyncableEntity } from '../db/schema-helpers';

export const debtsSchema = sqliteTable('debts', {
  ...createSyncableEntity(),
  name: text('name').notNull(),
  description: text('description'),
  creditor: text('creditor').notNull(),
  
  // Type and status fields
  type: text('type', { enum: ['loan', 'credit_card', 'mortgage', 'personal_debt', 'other'] }).notNull(),
  debtType: text('debt_type', { enum: ['credit_card', 'personal_loan', 'mortgage', 'auto_loan', 'student_loan', 'line_of_credit', 'other'] }).notNull(),
  status: text('status', { enum: ['active', 'paid_off', 'defaulted', 'consolidated'] }).default('active'),
  
  // Financial amounts
  originalAmount: real('original_amount').notNull(),
  principal: real('principal').notNull(),
  currentBalance: real('current_balance').notNull(),
  creditLimit: real('credit_limit'),
  
  // Interest details
  interestRate: real('interest_rate').notNull(),
  interestType: text('interest_type', { enum: ['simple', 'compound'] }).default('compound'),
  compoundingFrequency: text('compounding_frequency', { enum: ['daily', 'monthly', 'quarterly', 'annually'] }).default('monthly'),
  
  // Payment details
  minimumPayment: real('minimum_payment').notNull(),
  paymentFrequency: text('payment_frequency', { 
    enum: ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'] 
  }).notNull(),
  
  // Dates
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  originationDate: text('origination_date').notNull(),
  maturityDate: text('maturity_date'),
  nextPaymentDate: text('next_payment_date'),
  lastPaymentDate: text('last_payment_date'),
  
  // Optional fields
  accountNumber: text('account_number'),
  tags: text('tags', { mode: 'json' }).$type<string[]>().default([]),
  notes: text('notes'),
});

export const debtPaymentsSchema = sqliteTable('debt_payments', {
  ...createSyncableEntity(),
  debtId: integer('debt_id').notNull().references(() => debtsSchema.id),
  amount: real('amount').notNull(),
  paymentDate: text('payment_date').notNull(),
  
  // Payment type and method
  paymentType: text('payment_type', { enum: ['regular', 'extra', 'minimum', 'interest_only'] }).default('regular'),
  paymentMethod: text('payment_method', { enum: ['bank_transfer', 'check', 'cash', 'auto_pay', 'credit_card', 'other'] }),
  
  // Payment allocation
  principalAmount: real('principal_amount'),
  interestAmount: real('interest_amount'),
  feesAmount: real('fees_amount').default(0),
  
  // Additional fields
  reference: text('reference'),
  description: text('description'),
  isExtraPayment: integer('is_extra_payment', { mode: 'boolean' }).default(false),
  isVerified: integer('is_verified', { mode: 'boolean' }).default(false),
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
  description?: string;
  creditor: string;
  type: 'loan' | 'credit_card' | 'mortgage' | 'personal_debt' | 'other';
  debtType: 'credit_card' | 'personal_loan' | 'mortgage' | 'auto_loan' | 'student_loan' | 'line_of_credit' | 'other';
  status: 'active' | 'paid_off' | 'defaulted' | 'consolidated';
  originalAmount: number;
  principal: number;
  currentBalance: number;
  creditLimit?: number;
  interestRate: number;
  interestType: 'simple' | 'compound';
  compoundingFrequency: 'daily' | 'monthly' | 'quarterly' | 'annually';
  minimumPayment: number;
  paymentFrequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string | null;
  originationDate: string;
  maturityDate?: string;
  nextPaymentDate?: string;
  lastPaymentDate?: string;
  accountNumber?: string;
  tags: string[];
  notes: string | null;
  synced: boolean;
};

type TDebtInsert = Omit<TDebt, 'id' | 'createdAt' | 'updatedAt'>;

type TDebtSelect = TDebt;

type TDebtPayment = TBaseEntity & {
  debtId: number;
  amount: number;
  paymentDate: string;
  paymentType: 'regular' | 'extra' | 'minimum' | 'interest_only';
  paymentMethod?: 'bank_transfer' | 'check' | 'cash' | 'auto_pay' | 'credit_card' | 'other';
  principalAmount?: number;
  interestAmount?: number;
  feesAmount: number;
  reference?: string;
  description?: string;
  isExtraPayment: boolean;
  isVerified: boolean;
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
