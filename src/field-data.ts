import { createClient } from '@libsql/client';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create the Turso client with offline sync enabled
const client = createClient({
  url: 'file:field-data.db',
  syncUrl: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

// Initialize the field data database
async function setupFieldDataDB() {
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS field_data (
        id INTEGER PRIMARY KEY,
        location TEXT NOT NULL,
        reading REAL NOT NULL,
        notes TEXT,
        timestamp TEXT NOT NULL,
        synced INTEGER DEFAULT 0
      )
    `);
    
    console.log('✅ Field data database initialized');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
  }
}

// Record field data (works offline)
async function recordFieldData(location: string, reading: number, notes?: string) {
  try {
    // Insert data locally - works offline
    await client.execute({
      sql: `INSERT INTO field_data (location, reading, notes, timestamp) 
             VALUES (?, ?, ?, datetime('now'))`,
      args: [location, reading, notes || ''],
    });

    console.log(`📊 Data recorded locally: ${reading} at ${location}`);

    // Try to sync with server if possible
    try {
      await client.sync();
      console.log('✅ Data synchronized with central database');
      
      // Mark as synced
      await client.execute({
        sql: `UPDATE field_data SET synced = 1 WHERE location = ? AND reading = ? AND timestamp = (
          SELECT MAX(timestamp) FROM field_data WHERE location = ? AND reading = ?
        )`,
        args: [location, reading, location, reading],
      });
    } catch (error) {
      console.log('⚠️  Working offline - data will sync later when connection is restored');
    }
  } catch (error) {
    console.error('❌ Error recording field data:', error);
  }
}

// Get all field data
async function getFieldData() {
  try {
    const result = await client.execute(
      'SELECT * FROM field_data ORDER BY timestamp DESC'
    );
    return result.rows;
  } catch (error) {
    console.error('❌ Error reading field data:', error);
    return [];
  }
}

// Get unsynced data
async function getUnsyncedData() {
  try {
    const result = await client.execute(
      'SELECT * FROM field_data WHERE synced = 0 ORDER BY timestamp ASC'
    );
    return result.rows;
  } catch (error) {
    console.error('❌ Error reading unsynced data:', error);
    return [];
  }
}

// Force sync all data
async function forceSync() {
  try {
    console.log('🔄 Forcing sync of all data...');
    await client.sync();
    console.log('✅ Force sync completed');
    
    // Mark all data as synced
    await client.execute('UPDATE field_data SET synced = 1');
    console.log('✅ All data marked as synced');
  } catch (error) {
    console.error('❌ Force sync failed:', error);
  }
}

// Display field data in a nice format
async function displayFieldData() {
  const data = await getFieldData();
  if (data.length === 0) {
    console.log('No field data found.');
    return;
  }
  
  console.log('\n📊 Field Data Collection:');
  console.log('─'.repeat(60));
  
  data.forEach((record: any, index: number) => {
    const syncStatus = record.synced ? '✅' : '⏳';
    console.log(`${index + 1}. ${syncStatus} ${record.reading} at ${record.location}`);
    console.log(`   Notes: ${record.notes || 'None'}`);
    console.log(`   Time: ${record.timestamp}`);
    console.log(`   Synced: ${record.synced ? 'Yes' : 'No'}`);
    console.log('');
  });
}

// Main function for field data demo
async function main() {
  console.log('🌍 Turso Field Data Collection Demo');
  console.log('===================================\n');

  // Check if environment variables are set
  if (!process.env.TURSO_SYNC_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.log('⚠️  Environment variables not set. Please create a .env file with:');
    console.log('   TURSO_SYNC_URL=your_sync_url_here');
    console.log('   TURSO_AUTH_TOKEN=your_auth_token_here');
    return;
  }

  try {
    // Setup the database
    await setupFieldDataDB();

    // Record some sample field data
    await recordFieldData('Sensor A', 23.5, 'Temperature reading');
    await recordFieldData('Sensor B', 45.2, 'Humidity reading');
    await recordFieldData('Sensor C', 12.8, 'Pressure reading');

    // Display the data
    await displayFieldData();

    // Show unsynced data
    const unsynced = await getUnsyncedData();
    if (unsynced.length > 0) {
      console.log(`\n⏳ ${unsynced.length} records waiting to sync...`);
    }

    // Try to force sync
    await forceSync();

  } catch (error) {
    console.error('❌ Field data demo error:', error);
  }
}

// Run the demo if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}

export { 
  setupFieldDataDB, 
  recordFieldData, 
  getFieldData, 
  getUnsyncedData, 
  forceSync, 
  displayFieldData 
};
