'use strict';

const { execSync } = require('child_process');
const pkg = require('../package.json');
const path = require('path');
const fs = require('fs');

const externalDeps = [
  ...Object.keys(pkg.dependencies || {}).flatMap(dep => [dep, `${dep}/*`]),
  ...Object.keys(pkg.peerDependencies || {}).flatMap(dep => [dep, `${dep}/*`]),
  'bson',
  'bson/*',
  'node:*'
];

async function runBuild() {
  const start = Date.now();
  console.log('Building Mongoose bundled distribution...');

  const distDir = path.join(__dirname, '../dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const externalFlags = externalDeps.map(dep => `--external:"${dep}"`).join(' ');
  const entryFile = path.join(__dirname, '../lib/index.js');
  const cjsOut = path.join(__dirname, '../dist/index.js');
  const esmOut = path.join(__dirname, '../dist/index.mjs');

  let esbuildCmd = 'npx --yes esbuild';
  try {
    require.resolve('esbuild');
    esbuildCmd = 'npx esbuild';
  } catch (e) {
    // fallback
  }

  console.log('Building CJS bundle...');
  execSync(`${esbuildCmd} "${entryFile}" --outfile="${cjsOut}" --bundle --platform=node --target=node20 --format=cjs --tree-shaking=true --minify ${externalFlags}`, { stdio: 'inherit' });

  console.log('Building ESM bundle...');
  const esmBanner = `--banner:js="import { createRequire } from 'module'; const require = createRequire(import.meta.url);"`;
  execSync(`${esbuildCmd} "${entryFile}" --outfile="${esmOut}" --bundle --platform=node --target=node20 --format=esm --tree-shaking=true --minify ${esmBanner} ${externalFlags}`, { stdio: 'inherit' });

  const cjsStat = fs.statSync(cjsOut);
  const esmStat = fs.statSync(esmOut);

  console.log(`✓ Build completed in ${Date.now() - start}ms`);
  console.log(`  - dist/index.js  (CJS): ${(cjsStat.size / 1024).toFixed(2)} KB`);
  console.log(`  - dist/index.mjs (ESM): ${(esmStat.size / 1024).toFixed(2)} KB`);
}

runBuild().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
