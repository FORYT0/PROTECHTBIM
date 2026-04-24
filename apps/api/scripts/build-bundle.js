#!/usr/bin/env node
/**
 * PROTECHT BIM API — esbuild production bundle
 * Works when run from repo root OR from apps/api directory
 */

const esbuild = require('esbuild');
const path    = require('path');
const fs      = require('fs');

// Detect where we're being run from
const cwd = process.cwd();
const isRunFromApiDir = fs.existsSync(path.join(cwd, 'src/main.ts'));
const isRunFromRoot   = fs.existsSync(path.join(cwd, 'apps/api/src/main.ts'));

let apiDir, libsDir, outDir;

if (isRunFromApiDir) {
  // Running from apps/api/
  apiDir  = cwd;
  libsDir = path.resolve(cwd, '../../libs');
  outDir  = path.join(cwd, 'dist-bundle');
} else if (isRunFromRoot) {
  // Running from repo root
  apiDir  = path.join(cwd, 'apps/api');
  libsDir = path.join(cwd, 'libs');
  outDir  = path.join(cwd, 'apps/api/dist-bundle');
} else {
  console.error('❌ Run this script from the repo root or apps/api directory');
  process.exit(1);
}

// Find node_modules — could be in apiDir or root
const nodeModules = fs.existsSync(path.join(apiDir, 'node_modules'))
  ? path.join(apiDir, 'node_modules')
  : path.join(path.resolve(apiDir, '../..'), 'node_modules');

fs.mkdirSync(outDir, { recursive: true });

const entry = path.join(apiDir, 'src/main.ts');
const out   = path.join(outDir, 'main.js');

console.log('🔨 Building PROTECHT BIM API bundle...');
console.log(`   Entry:  ${entry}`);
console.log(`   Output: ${out}`);
console.log(`   Libs:   ${libsDir}`);

const externals = [
  'bcrypt', 'pg', 'pg-native', 'pg-hstore', 'pg-query-stream',
  'typeorm', 'reflect-metadata',
  'express', 'cors', 'helmet', 'express-session', 'express-rate-limit',
  'multer', 'connect-redis',
  'jsonwebtoken',
  '@aws-sdk/client-s3', '@aws-sdk/s3-request-presigner',
  'socket.io', 'engine.io',
  'redis', 'ioredis',
  'dotenv', 'slugify', 'ical-generator', 'uuid', 'axios', 'tslib',
  'class-transformer', 'class-validator',
  'groq-sdk',
];

esbuild.build({
  entryPoints: [entry],
  bundle:      true,
  platform:    'node',
  target:      'node18',
  format:      'cjs',
  outfile:     out,
  external:    externals,
  tsconfig:    path.join(apiDir, 'tsconfig.json'),
  logLevel:    'info',
  sourcemap:   false,
  minify:      false,
  alias: {
    '@protecht-bim/shared-utils': path.join(libsDir, 'shared-utils/src/index.ts'),
    '@protecht-bim/shared-types': path.join(libsDir, 'shared-types/src/index.ts'),
  },
  logOverride: { 'indirect-require': 'silent' },
}).then(() => {
  const kb = (fs.statSync(out).size / 1024).toFixed(0);
  console.log(`\n✅ Bundle complete → ${out} (${kb} KB)`);
  console.log(`🚀 Start: node ${path.relative(process.cwd(), out)}\n`);
}).catch(err => {
  console.error('❌ Build failed:', err.message);
  process.exit(1);
});
