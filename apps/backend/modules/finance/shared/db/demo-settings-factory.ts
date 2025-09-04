import { eq, sql } from 'drizzle-orm';
import { createDb } from './index';
import { demoSettingsSchema, TDemoSettings, TDemoSettingsInsert } from '../schemas/demo-settings.schema';

function createDemoSettingsFactory() {
  const db = createDb();

  async function create(data: Partial<TDemoSettingsInsert>) {
    try {
      const newRecord = await db
        .insert(demoSettingsSchema)
        .values({
          isDemoMode: data.isDemoMode ?? false,
          userId: data.userId ?? 1,
          description: data.description ?? 'Demo mode settings',
          synced: data.synced ?? false
        })
        .returning();
      
      return newRecord[0];
    } catch (error) {
      console.error('Error creating demo settings:', error);
      throw error;
    }
  }

  async function read(userId = 1): Promise<TDemoSettings | null> {
    try {
      const result = await db
        .select()
        .from(demoSettingsSchema)
        .where(eq(demoSettingsSchema.userId, userId))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Error reading demo settings:', error);
      throw error;
    }
  }

  async function readOrCreate(userId = 1): Promise<TDemoSettings> {
    let settings = await read(userId);
    
    if (!settings) {
      settings = await create({ userId, isDemoMode: false });
    }
    
    return settings;
  }

  async function update(userId: number, updates: Partial<TDemoSettingsInsert>): Promise<TDemoSettings> {
    try {
      const updateData = {
        ...updates,
        updatedAt: sql`CURRENT_TIMESTAMP`
      };

      const updatedRecord = await db
        .update(demoSettingsSchema)
        .set(updateData)
        .where(eq(demoSettingsSchema.userId, userId))
        .returning();

      if (updatedRecord.length === 0) {
        throw new Error(`Demo settings not found for user ${userId}`);
      }

      return updatedRecord[0];
    } catch (error) {
      console.error('Error updating demo settings:', error);
      throw error;
    }
  }

  async function destroy(userId: number): Promise<boolean> {
    try {
      const deletedRecords = await db
        .delete(demoSettingsSchema)
        .where(eq(demoSettingsSchema.userId, userId))
        .returning();

      return deletedRecords.length > 0;
    } catch (error) {
      console.error('Error deleting demo settings:', error);
      throw error;
    }
  }

  async function toggleDemoMode(userId = 1): Promise<TDemoSettings> {
    const settings = await readOrCreate(userId);
    return await update(userId, { isDemoMode: !settings.isDemoMode });
  }

  return {
    create,
    read,
    readOrCreate,
    update,
    destroy,
    toggleDemoMode
  };
}

export { createDemoSettingsFactory };
