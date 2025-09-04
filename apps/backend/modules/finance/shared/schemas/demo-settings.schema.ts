import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { TBaseEntity } from '../types';
import { createSyncableEntity } from '../db/schema-helpers';

export const demoSettingsSchema = sqliteTable('demo_settings', {
  ...createSyncableEntity(),
  isDemoMode: integer('is_demo_mode', { mode: 'boolean' }).default(false).notNull(),
  userId: integer('user_id').default(1).notNull(),
  description: text('description').default('Demo mode settings'),
});

type TDemoSettings = TBaseEntity & {
  isDemoMode: boolean;
  userId: number;
  description: string;
  synced: boolean;
};

type TDemoSettingsInsert = Omit<TDemoSettings, 'id' | 'createdAt' | 'updatedAt'>;

type TDemoSettingsSelect = TDemoSettings;

export type { TDemoSettings, TDemoSettingsInsert, TDemoSettingsSelect };
