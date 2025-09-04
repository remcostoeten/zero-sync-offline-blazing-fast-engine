import { getDb } from '../src/lib/database/connection';

async function addDemoFields() {
  console.log('🔄 Adding isDemo fields to existing database tables...');
  
  const db = getDb();
  
  try {
    // Add isDemo column to categories table
    await db.run(`
      ALTER TABLE categories 
      ADD COLUMN is_demo INTEGER NOT NULL DEFAULT 0
    `);
    console.log('✅ Added is_demo column to categories table');

    // Add isDemo column to transactions table  
    await db.run(`
      ALTER TABLE transactions 
      ADD COLUMN is_demo INTEGER NOT NULL DEFAULT 0
    `);
    console.log('✅ Added is_demo column to transactions table');

    console.log('🎉 Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    
    // Check if columns already exist
    if (error instanceof Error && error.message.includes('duplicate column name')) {
      console.log('ℹ️ Columns already exist, migration not needed');
      return;
    }
    
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  addDemoFields()
    .then(() => {
      console.log('✨ Migration complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export { addDemoFields };
