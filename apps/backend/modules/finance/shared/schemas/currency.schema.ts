import { sqliteTable, integer, text, real, unique } from 'drizzle-orm/sqlite-core';
import { TBaseEntity } from '../types';
import { createTimestamps } from '../db/schema-helpers';

export const exchangeRatesSchema = sqliteTable('exchange_rates', {
  id: integer('id').primaryKey(),
  fromCurrency: text('from_currency').notNull(),
  toCurrency: text('to_currency').notNull(),
  rate: real('rate').notNull(),
  lastUpdated: integer('last_updated', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  synced: integer('synced', { mode: 'boolean' }).default(false),
}, (table) => ({
  uniqueCurrencyPair: unique().on(table.fromCurrency, table.toCurrency),
}));

export const userPreferencesSchema = sqliteTable('user_preferences', {
  id: integer('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  synced: integer('synced', { mode: 'boolean' }).default(false),
});

type TExchangeRate = {
  id: number;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  lastUpdated: Date;
  synced: boolean;
};

type TExchangeRateInsert = Omit<TExchangeRate, 'id'>;

type TExchangeRateSelect = TExchangeRate;

type TUserPreference = {
  id: number;
  key: string;
  value: string;
  updatedAt: Date;
  synced: boolean;
};

type TUserPreferenceInsert = Omit<TUserPreference, 'id' | 'updatedAt'>;

type TUserPreferenceSelect = TUserPreference;

export type { 
  TExchangeRate, 
  TExchangeRateInsert, 
  TExchangeRateSelect,
  TUserPreference,
  TUserPreferenceInsert,
  TUserPreferenceSelect
};
