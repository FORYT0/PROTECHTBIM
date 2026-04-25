#!/usr/bin/env node
/**
 * Build the seed script into a runnable bundle
 * Output: apps/api/dist-bundle/seed.js
 */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const root    = path.resolve(__dirname, '../../..');
const apiDir  = path.resolve(__dirname, '..');
const outDir  = path.join(apiDir, 'dist-bundle');

fs.mkdirSync(outDir, { recursive: true });

const externals = [
  'bcrypt', 'pg', 'pg-native', 'typeorm', 'reflect-metadata',
  'dotenv', 'tslib', 'class-transformer', 'class-validator',
];

esbuild.build({
  entryPoints : [path.join(apiDir, 'scripts/seed-demo.ts')],
  bundle      : true,
  platform    : 'node',
  target      : 'node18',
  format      : 'cjs',
  outfile     : path.join(outDir, 'seed.js'),
  external    : externals,
  tsconfig    : path.join(apiDir, 'tsconfig.json'),
  alias: {
    '@protecht-bim/shared-utils': path.join(root, 'libs/shared-utils/src/index.ts'),
    '@protecht-bim/shared-types': path.join(root, 'libs/shared-types/src/index.ts'),
  },
  logLevel    : 'info',
}).then(() => {
  const size = (fs.statSync(path.join(outDir, 'seed.js')).size / 1024).toFixed(0);
  console.log(`\n✅ Seed bundle: dist-bundle/seed.js (${size} KB)`);
  console.log('🌱 Run: node apps/api/dist-bundle/seed.js\n');
}).catch(e => { console.error('Build failed:', e); process.exit(1); });
