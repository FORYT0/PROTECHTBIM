import 'reflect-metadata';
import { AppDataSource } from '../src/config/data-source';

/**
 * Database setup script
 * This script initializes the database connection and runs migrations
 */
async function setupDatabase() {
  console.log('🔧 Setting up database...\n');

  try {
    // Initialize database connection
    console.log('📡 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connection established\n');

    // Run migrations
    console.log('🔄 Running migrations...');
    const migrations = await AppDataSource.runMigrations();
    
    if (migrations.length === 0) {
      console.log('ℹ️  No pending migrations');
    } else {
      console.log(`✅ Successfully ran ${migrations.length} migration(s):`);
      migrations.forEach((migration) => {
        console.log(`   - ${migration.name}`);
      });
    }

    console.log('\n✨ Database setup complete!');
    console.log('\nDatabase details:');
    console.log(`   Host: ${AppDataSource.options.host}`);
    console.log(`   Port: ${AppDataSource.options.port}`);
    console.log(`   Database: ${AppDataSource.options.database}`);
    console.log(`   User: ${AppDataSource.options.username}`);

    // Close connection
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
