#!/usr/bin/env node
/**
 * Build script for PROTECHT BIM API
 * Uses esbuild JS API to bundle the API including shared-utils.
 */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '../../..');
const apiDir = path.resolve(__dirname, '..');
const outDir = path.join(apiDir, 'dist-bundle');

fs.mkdirSync(outDir, { recursive: true });

console.log('🔨 Bundling PROTECHT BIM API...');

const externals = [
  'bcrypt', 'bcryptjs', 'pg', 'pg-native', 'pg-hstore',
  'typeorm', 'reflect-metadata', 'socket.io', 'engine.io',
  'express', 'jsonwebtoken', 'helmet', 'cors', 'dotenv',
  'multer', 'redis', 'ioredis', 'connect-redis',
  'express-session', 'express-rate-limit',
  'class-transformer', 'class-validator',
  'slugify', 'ical-generator', 'uuid',
  'groq-sdk', 'axios', 'tslib',
  '@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner',
];

esbuild.build({
  entryPoints: [path.join(apiDir, 'src/main.ts')],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outfile: path.join(outDir, 'main.js'),
  external: externals,
  tsconfig: path.join(apiDir, 'tsconfig.json'),
  logLevel: 'info',
  sourcemap: false,
  minify: false,
  // Handle the path aliases from tsconfig.base.json
  alias: {
    '@protecht-bim/shared-utils': path.join(root, 'libs/shared-utils/src/index.ts'),
    '@protecht-bim/shared-types': path.join(root, 'libs/shared-types/src/index.ts'),
  },
}).then(() => {
  console.log(`\n✅ Bundle written to ${outDir}/main.js`);
  console.log('🚀 Start with: node apps/api/dist-bundle/main.js');
}).catch(err => {
  console.error('❌ Build failed:', err.message);
  process.exit(1);
});
