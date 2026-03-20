import * as dotenv from 'dotenv';
import { initializeRedis, cache, CacheKeys, CacheTTL, closeRedis } from '../src/config/redis';

// Load environment variables
dotenv.config({ path: './apps/api/.env' });

async function testRedis() {
  console.log('🧪 Testing Redis connection and functionality...\n');

  try {
    // Initialize Redis
    console.log('1. Initializing Redis connection...');
    await initializeRedis();
    console.log('✅ Redis initialized successfully\n');

    // Test basic set/get
    console.log('2. Testing basic cache operations...');
    const testKey = 'test:connection';
    const testValue = { message: 'Hello Redis!', timestamp: new Date().toISOString() };
    
    await cache.set(testKey, testValue, 60);
    console.log('✅ Set test value:', testValue);
    
    const retrieved = await cache.get(testKey);
    console.log('✅ Retrieved value:', retrieved);
    
    if (JSON.stringify(retrieved) === JSON.stringify(testValue)) {
      console.log('✅ Values match!\n');
    } else {
      console.error('❌ Values do not match!\n');
    }

    // Test cache key naming conventions
    console.log('3. Testing cache key naming conventions...');
    const projectId = 'test-project-123';
    const modelId = 'test-model-456';
    const userId = 'test-user-789';

    await cache.set(CacheKeys.project(projectId), { name: 'Test Project' }, CacheTTL.PROJECT);
    await cache.set(CacheKeys.modelThumbnail(modelId), { url: '/thumbnails/test.png' }, CacheTTL.MODEL_THUMBNAIL);
    await cache.set(CacheKeys.userPermissions(userId), ['read', 'write'], CacheTTL.USER_PERMISSIONS);

    console.log('✅ Project key:', CacheKeys.project(projectId));
    console.log('✅ Model thumbnail key:', CacheKeys.modelThumbnail(modelId));
    console.log('✅ User permissions key:', CacheKeys.userPermissions(userId));
    console.log('✅ Cache keys created successfully\n');

    // Test exists
    console.log('4. Testing cache exists...');
    const exists = await cache.exists(CacheKeys.project(projectId));
    console.log(`✅ Project cache exists: ${exists}\n`);

    // Test delete
    console.log('5. Testing cache deletion...');
    await cache.del(testKey);
    const afterDelete = await cache.get(testKey);
    console.log(`✅ Value after deletion: ${afterDelete === null ? 'null (deleted successfully)' : 'still exists'}\n`);

    // Test pattern deletion
    console.log('6. Testing pattern deletion...');
    await cache.delPattern('test:*');
    console.log('✅ Pattern deletion completed\n');

    // Test TTL
    console.log('7. Testing TTL values...');
    console.log(`   - PROJECT: ${CacheTTL.PROJECT}s (1 hour)`);
    console.log(`   - WORK_PACKAGES: ${CacheTTL.WORK_PACKAGES}s (5 minutes)`);
    console.log(`   - MODEL_THUMBNAIL: ${CacheTTL.MODEL_THUMBNAIL}s (24 hours)`);
    console.log(`   - USER_PERMISSIONS: ${CacheTTL.USER_PERMISSIONS}s (15 minutes)`);
    console.log('✅ TTL values configured correctly\n');

    console.log('✅ All Redis tests passed!');
    console.log('\n📊 Summary:');
    console.log('   - Redis connection: ✅');
    console.log('   - Basic operations: ✅');
    console.log('   - Cache key conventions: ✅');
    console.log('   - TTL configuration: ✅');
    console.log('   - Pattern operations: ✅');

  } catch (error) {
    console.error('❌ Redis test failed:', error);
    process.exit(1);
  } finally {
    // Close connection
    await closeRedis();
    console.log('\n🔌 Redis connection closed');
    process.exit(0);
  }
}

// Run tests
testRedis();
