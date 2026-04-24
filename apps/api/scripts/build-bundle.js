#!/usr/bin/env node
/**
 * PROTECHT BIM API — Production bundle (esbuild)
 * 
 * Bundles src/main.ts + shared libs into a single CJS file.
 * Output: apps/api/dist-bundle/main.js
 * Run:    node apps/api/scripts/build-bundle.js
 */

const esbuild = require('esbuild');
const path    = require('path');
const fs      = require('fs');

const root   = path.resolve(__dirname, '../../..');   // monorepo root
const apiDir = path.resolve(__dirname, '..');          // apps/api
const outDir = path.join(apiDir, 'dist-bundle');

fs.mkdirSync(outDir, { recursive: true });

console.log('🔨 Bundling PROTECHT BIM API with esbuild…');
console.log(`   Entry : ${path.join(apiDir, 'src/main.ts')}`);
console.log(`   Output: ${outDir}/main.js`);

// Native node addons / heavy deps that MUST be kept external
// (they resolve via node_modules at runtime and cannot be inlined)
const externals = [
  // DB / native
  'bcrypt', 'pg', 'pg-native', 'pg-hstore', 'pg-query-stream',
  // ORM
  'typeorm', 'reflect-metadata',
  // HTTP
  'express', 'cors', 'helmet', 'express-session', 'express-rate-limit',
  'multer', 'connect-redis',
  // Auth
  'jsonwebtoken',
  // Storage
  '@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner',
  // Realtime
  'socket.io', 'engine.io',
  // Cache
  'redis', 'ioredis',
  // Utils
  'dotenv', 'slugify', 'ical-generator', 'uuid', 'axios', 'tslib',
  // Validation
  'class-transformer', 'class-validator',
  // AI
  'groq-sdk',
];

esbuild.build({
  entryPoints : [path.join(apiDir, 'src/main.ts')],
  bundle      : true,
  platform    : 'node',
  target      : 'node18',
  format      : 'cjs',
  outfile     : path.join(outDir, 'main.js'),
  external    : externals,
  tsconfig    : path.join(apiDir, 'tsconfig.json'),
  logLevel    : 'info',
  sourcemap   : false,
  minify      : false,
  // Resolve monorepo path aliases
  alias: {
    '@protecht-bim/shared-utils': path.join(root, 'libs/shared-utils/src/index.ts'),
    '@protecht-bim/shared-types': path.join(root, 'libs/shared-types/src/index.ts'),
  },
  // Suppress false-positive "use of eval" warnings from typeorm decorators
  logOverride: { 'indirect-require': 'silent' },
}).then(() => {
  const size = (fs.statSync(path.join(outDir, 'main.js')).size / 1024).toFixed(0);
  console.log(`\n✅ Bundle complete  →  dist-bundle/main.js  (${size} KB)`);
  console.log('🚀 Start: node apps/api/dist-bundle/main.js\n');
}).catch(err => {
  console.error('❌ Build failed:', err.message);
  process.exit(1);
});
