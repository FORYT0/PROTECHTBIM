#!/usr/bin/env node
/**
 * Vercel pre-build: copies shared libs into apps/web so Vite
 * can resolve @protecht-bim/shared-types without the monorepo root.
 */
const fs   = require('fs');
const path = require('path');

const here = __dirname; // apps/web/scripts

// Try to find libs/ relative to here
const candidates = [
  path.resolve(here, '../../../libs'),  // when CWD is apps/web: ../../../ = repo root
  path.resolve(here, '../../libs'),     // when CWD is repo root: ../../ = repo root
  path.resolve(here, '../../../../libs'),
];

const libsSrc = candidates.find(p => fs.existsSync(p));
if (!libsSrc) {
  console.error('❌ Cannot find libs/ folder. Tried:', candidates);
  process.exit(1);
}

const libsDest = path.resolve(here, '../libs');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    if (item === 'node_modules') continue;
    const s = path.join(src, item);
    const d = path.join(dest, item);
    fs.statSync(s).isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
  }
}

if (!fs.existsSync(libsDest)) {
  console.log(`📦 Copying ${libsSrc} → ${libsDest}`);
  copyDir(libsSrc, libsDest);
  console.log('✅ Libs copied');
} else {
  console.log('✅ Libs already present, skipping copy');
}
