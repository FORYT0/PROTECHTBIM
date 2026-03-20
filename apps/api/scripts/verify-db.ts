import 'reflect-metadata';
import { AppDataSource } from '../src/config/data-source';

/**
 * Database verification script
 * This script verifies the database connection and checks the schema
 */
async function verifyDatabase() {
  console.log('🔍 Verifying database setup...\n');

  try {
    // Initialize database connection
    console.log('📡 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connection successful\n');

    // Check if migrations have been run
    console.log('🔄 Checking migration status...');
    const migrations = await AppDataSource.showMigrations();
    
    if (migrations) {
      console.log('⚠️  There are pending migrations. Run: npm run migration:run');
    } else {
      console.log('✅ All migrations are up to date\n');
    }

    // Verify tables exist
    console.log('📊 Verifying database tables...');
    const queryRunner = AppDataSource.createQueryRunner();
    
    const tables = await queryRunner.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    if (tables.length === 0) {
      console.log('⚠️  No tables found. Run migrations first: npm run db:setup');
    } else {
      console.log(`✅ Found ${tables.length} tables:`);
      tables.forEach((table: any) => {
        console.log(`   - ${table.table_name}`);
      });
      console.log();
    }

    // Check default roles
    const roles = await queryRunner.query('SELECT name FROM roles ORDER BY name');
    if (roles.length > 0) {
      console.log(`✅ Found ${roles.length} default roles:`);
      roles.forEach((role: any) => {
        console.log(`   - ${role.name}`);
      });
      console.log();
    }

    // Check default permissions
    const permissions = await queryRunner.query('SELECT COUNT(*) as count FROM permissions');
    console.log(`✅ Found ${permissions[0].count} permissions\n`);

    // Check connection pool status
    console.log('🔌 Connection pool configuration:');
    console.log(`   Max connections: ${AppDataSource.options.extra?.max || 'default'}`);
    console.log(`   Min connections: ${AppDataSource.options.extra?.min || 'default'}`);
    console.log(`   Idle timeout: ${AppDataSource.options.extra?.idleTimeoutMillis || 'default'}ms`);
    console.log(`   Connection timeout: ${AppDataSource.options.extra?.connectionTimeoutMillis || 'default'}ms\n`);

    console.log('✨ Database verification complete!');
    console.log('\n📋 Summary:');
    console.log(`   Database: ${AppDataSource.options.database}`);
    console.log(`   Host: ${AppDataSource.options.host}:${AppDataSource.options.port}`);
    console.log(`   Status: ✅ Ready for use`);

    await queryRunner.release();
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database verification failed:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Make sure Docker services are running: docker-compose up -d');
    console.log('   2. Wait for PostgreSQL to be healthy: docker-compose ps');
    console.log('   3. Run database setup: npm run db:setup');
    console.log('   4. Check your .env file for correct database credentials');
    process.exit(1);
  }
}

verifyDatabase();
