#!/usr/bin/env node
/**
 * copy-assets.js — Copy src/assets/* into custom_components/lcards/
 *
 * Mirrors the three asset directories (fonts, msd, sounds) alongside lcards.js
 * so that the /lcards/* static path served by frontend.py can resolve all font,
 * SVG, and sound URLs that are hardcoded in the JS bundle.
 *
 * Run automatically as part of build:integration:
 *   npm run build:integration
 *
 * Can also be run standalone:
 *   node scripts/copy-assets.js
 */

import { cpSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root      = resolve(__dirname, '..');

const SRC  = resolve(root, 'src/assets');
const DEST = resolve(root, 'custom_components/lcards');

const ASSET_DIRS = ['fonts', 'msd', 'sounds', 'images'];

console.log('\n📁 Copying assets → custom_components/lcards/\n');

for (const dir of ASSET_DIRS) {
    const src  = resolve(SRC,  dir);
    const dest = resolve(DEST, dir);

    if (!existsSync(src)) {
        console.warn(`  ⚠️  Source not found, skipping: src/assets/${dir}`);
        continue;
    }

    mkdirSync(dest, { recursive: true });
    cpSync(src, dest, { recursive: true });

    console.log(`  ✅ src/assets/${dir}/ → custom_components/lcards/${dir}/`);
}

console.log('\n🚀 Assets copied.\n');
