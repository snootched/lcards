#!/usr/bin/env node
/**
 * bump-version.js — Compute and write the next version into package.json
 *
 * Scheme: YYYY.MM.SEQ[-dev.N]  — sequence resets to 0 on each new month.
 *
 *   npm run bump-version          stable bump: promote a -dev.N build to
 *                                 stable (strip suffix), or advance SEQ
 *                                 (reset to 0 on month rollover)
 *   npm run bump-version:dev      dev bump: increment -dev.N on the current
 *                                 base, or start -dev.1 on the next base
 *
 * Only touches package.json — run `npm run set-version` (or `npm run build`,
 * which calls it) afterward to propagate to manifest.json / const.py.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const isDev = process.argv.includes('--dev');

const pkgPath = resolve(root, 'package.json');
const pkgContent = readFileSync(pkgPath, 'utf8');
const versionMatch = pkgContent.match(/"version":\s*"([^"]+)"/);
if (!versionMatch) {
  console.error('\n❌ Could not find a "version" field in package.json\n');
  process.exit(1);
}
const rawVersion = versionMatch[1];

const hyphenIdx = rawVersion.indexOf('-');
const base = hyphenIdx === -1 ? rawVersion : rawVersion.slice(0, hyphenIdx);
const suffix = hyphenIdx === -1 ? null : rawVersion.slice(hyphenIdx + 1); // e.g. "dev.2"

const baseParts = base.split('.');
if (baseParts.length !== 3) {
  console.error(`\n❌ Expected version in YYYY.MM.SEQ form, got "${base}" (from "${rawVersion}")\n`);
  process.exit(1);
}
const [Y, M, SEQStr] = baseParts;
const SEQ = parseInt(SEQStr, 10);

const now = new Date();
const curY = String(now.getFullYear());
const curM = String(now.getMonth() + 1).padStart(2, '0');

// Next stable base: advance SEQ within the current month, reset to 0 across a month rollover.
function nextBase() {
  if (Y === curY && M === curM) {
    return `${curY}.${curM}.${SEQ + 1}`;
  }
  return `${curY}.${curM}.0`;
}

const devMatch = suffix ? suffix.match(/^dev\.(\d+)$/) : null;

let newVersion;
if (isDev) {
  if (devMatch) {
    newVersion = `${base}-dev.${parseInt(devMatch[1], 10) + 1}`;
  } else if (suffix) {
    newVersion = `${base}-dev.1`; // unrecognized existing suffix — replace with dev.1 on the same base
  } else {
    newVersion = `${nextBase()}-dev.1`;
  }
} else {
  if (suffix) {
    newVersion = base; // promote: strip suffix, keep the same base
  } else {
    newVersion = nextBase();
  }
}

const newPkgContent = pkgContent.replace(/"version":\s*"[^"]+"/, `"version": "${newVersion}"`);
writeFileSync(pkgPath, newPkgContent);

console.log(`\n🔢 Version bump (${isDev ? 'dev' : 'stable'}): ${rawVersion} → ${newVersion}\n`);
console.log('   Run `npm run set-version` (or `npm run build`) to propagate to manifest.json / const.py.\n');
