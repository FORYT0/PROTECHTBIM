import 'reflect-metadata';
import { AppDataSource } from '../src/config/data-source';

async function test() {
    try {
        console.log('Initializing...');
        await AppDataSource.initialize();
        console.log('✅ Connected');
        const res = await AppDataSource.query('SELECT 1 as result');
        console.log('Query result:', res);

        // Test if we can create a table with jsonb
        console.log('Testing jsonb support...');
        await AppDataSource.query('CREATE TABLE IF NOT EXISTS test_jsonb (data JSONB)');
        console.log('✅ Table created');
        await AppDataSource.query('DROP TABLE test_jsonb');
        console.log('✅ Table dropped');

        await AppDataSource.destroy();
    } catch (error: any) {
        console.error('❌ Error details:', error);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
    }
}

test();
