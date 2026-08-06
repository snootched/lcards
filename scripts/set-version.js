#!/usr/bin/env node
/**
 * set-version.js — Sync version from package.json → manifest.json and const.py
 *
 * package.json format : YYYY.MM.SEQ[-dev.N]  (e.g. 2026.08.1-dev.2)
 * HA integration format: YYYY.M.SEQ          (e.g. 2026.8.1    — no leading zeros, no suffix)
 *
 * Run locally after bumping package.json version (see also: npm run bump-version):
 *   npm run set-version
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// ── 1. Read version from package.json ────────────────────────────────────────
const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const rawVersion = pkg.version; // e.g. "2026.03.25-alpha.1"

// ── 2. Convert to HA calver (no leading zeros, no pre-release suffix) ────────
const [calver] = rawVersion.split('-'); // "2026.08.1"
const parts = calver.split('.');        // ["2026", "08", "1"]
if (parts.length !== 3) {
  console.error(`\n❌ Expected version in YYYY.MM.SEQ form, got "${calver}" (from "${rawVersion}")\n`);
  process.exit(1);
}
const haVersion = `${parts[0]}.${parseInt(parts[1], 10)}.${parts[2]}`; // "2026.8.1"

console.log(`\n🔢 Version sync: ${rawVersion} → ${haVersion}\n`);

// ── 3. Update manifest.json ──────────────────────────────────────────────────
const manifestPath = resolve(root, 'custom_components/lcards/manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const prevManifest = manifest.version;
manifest.version = haVersion;
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`  ✅ manifest.json  ${prevManifest} → ${haVersion}`);

// ── 4. Update const.py ───────────────────────────────────────────────────────
const constPath = resolve(root, 'custom_components/lcards/const.py');
let constContent = readFileSync(constPath, 'utf8');
const prevConst = (constContent.match(/^DOMAIN_VERSION\s*=\s*"([^"]*)"/m) || [])[1] ?? '?';
constContent = constContent.replace(
  /^DOMAIN_VERSION\s*=\s*"[^"]*"/m,
  `DOMAIN_VERSION = "${rawVersion}"`
);
writeFileSync(constPath, constContent);
console.log(`  ✅ const.py       ${prevConst} → ${rawVersion}`);

console.log('\n🚀 Done.\n');
