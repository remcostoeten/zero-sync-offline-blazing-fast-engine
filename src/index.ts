import { createClient } from '@libsql/client';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create the Turso client with offline sync enabled
const client = createClient({
  url: 'file:local.db',
  syncUrl: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

// Function to save a note that works offline
async function saveNote(content: string) {
  try {
    // Create the notes table if it doesn't exist
    await client.execute(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY,
        content TEXT,
        created_at TEXT
      )
    `);

    // Add the note - works even without internet
    await client.execute({
      sql: `INSERT INTO notes (content, created_at) VALUES (?, datetime('now'))`,
      args: [content],
    });

    console.log(`Note saved locally: "${content}"`);

    // Try to sync changes with the remote database
    try {
      await client.sync();
      console.log('✅ Note synced to cloud successfully');
    } catch (error) {
      console.log('⚠️  Note saved locally, will sync later when connection is restored');
    }
  } catch (error) {
    console.error('Error saving note:', error);
  }
}

// Read notes function that works offline
async function getNotes() {
  try {
    const result = await client.execute(
      'SELECT * FROM notes ORDER BY created_at DESC'
    );
    return result.rows;
  } catch (error) {
    console.error('Error reading notes:', error);
    return [];
  }
}

// Function to display all notes
async function displayNotes() {
  const notes = await getNotes();
  if (notes.length === 0) {
    console.log('No notes found.');
    return;
  }
  
  console.log('\n📝 Your Notes:');
  console.log('─'.repeat(50));
  notes.forEach((note: any, index: number) => {
    console.log(`${index + 1}. ${note.content}`);
    console.log(`   Created: ${note.created_at}`);
    console.log('');
  });
}

// Main application function
async function main() {
  console.log('🚀 Turso Offline Sync Demo');
  console.log('==========================\n');

  // Check if environment variables are set
  if (!process.env.TURSO_SYNC_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.log('⚠️  Environment variables not set. Please create a .env file with:');
    console.log('   TURSO_SYNC_URL=your_sync_url_here');
    console.log('   TURSO_AUTH_TOKEN=your_auth_token_here');
    console.log('\n📖 See the README.md for setup instructions.');
    return;
  }

  try {
    // Example: Add some sample notes
    await saveNote('Welcome to Turso Offline Sync!');
    await saveNote('This note was created while potentially offline');
    await saveNote('Changes will sync automatically when connected');

    // Display all notes
    await displayNotes();

    // Try to sync with the remote database
    console.log('🔄 Attempting to sync with Turso Cloud...');
    try {
      await client.sync();
      console.log('✅ Sync completed successfully!');
    } catch (error) {
      console.log('⚠️  Sync failed (this is normal if offline):', error);
    }

  } catch (error) {
    console.error('❌ Application error:', error);
  }
}

// Run the application
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}

export { saveNote, getNotes, displayNotes, client };
