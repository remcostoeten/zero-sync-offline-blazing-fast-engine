import { db } from '../modules/database-studio/shared/db/barrel';
import { connections } from '../modules/database-studio/shared/schemas/connections.schema';
import { sql, eq } from 'drizzle-orm';

async function migrateDatabaseStudio() {
  console.log('🚀 Starting Database Studio migration...');
  
  try {
    // Create connections table
    console.log('📋 Creating connections table...');
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS connections (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('postgres', 'sqlite', 'libsql')),
        url TEXT,
        file_path TEXT,
        token TEXT,
        is_favorite INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);

    // Create indexes for better performance
    console.log('🔍 Creating indexes...');
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_connections_type ON connections(type)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_connections_favorite ON connections(is_favorite)`);
    await db.run(sql`CREATE INDEX IF NOT EXISTS idx_connections_updated ON connections(updated_at)`);

    console.log('✅ Database Studio migration completed successfully!');
    
    // Test the table by inserting a sample connection (only if it doesn't exist)
    console.log('🧪 Testing with sample data...');
    const existingConnection = await db.select().from(connections).where(eq(connections.id, 'test-connection-1')).limit(1);
    
    if (existingConnection.length === 0) {
      const testConnection = {
        id: 'test-connection-1',
        name: 'Sample SQLite Database',
        type: 'sqlite' as const,
        filePath: './sample.db',
        isFavorite: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.insert(connections).values(testConnection);
      console.log('✅ Sample connection created successfully!');
    } else {
      console.log('✅ Sample connection already exists, skipping...');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (import.meta.main) {
  migrateDatabaseStudio()
    .then(() => {
      console.log('🎉 Migration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}
