#!/usr/bin/env node
/**
 * copy-docs-bundle.js - publish the built LCARdS bundle with the docs site.
 *
 * The docs' live card demos (doc/.vitepress/theme/CardDemo.vue) load the real
 * production bundle at runtime from /lcards/lcards.js, exactly as Home Assistant
 * serves it, so the hard-coded /lcards/fonts and /lcards/msd URLs work unchanged.
 * Copies the loader stub, the JS chunks (no source maps), fonts and MSD SVGs from
 * custom_components/lcards/ into doc/public/lcards/ (gitignored); VitePress then
 * publishes them. Images and sounds are left out (demos don't need them).
 *
 * Run after `vite build --mode integration` (npm run docs:build does both).
 */
import { cpSync, existsSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'custom_components/lcards');
const DEST = join(root, 'doc/public/lcards');

if (!existsSync(join(SRC, 'lcards.js'))) {
    console.error('custom_components/lcards/lcards.js not found: run `npm run build` (or vite build --mode integration) first.');
    process.exit(1);
}

rmSync(DEST, { recursive: true, force: true });
mkdirSync(join(DEST, 'chunks'), { recursive: true });
cpSync(join(SRC, 'lcards.js'), join(DEST, 'lcards.js'));
for (const name of readdirSync(join(SRC, 'chunks'))) {
    if (name.endsWith('.js')) cpSync(join(SRC, 'chunks', name), join(DEST, 'chunks', name));
}
for (const dir of ['fonts', 'msd']) cpSync(join(SRC, dir), join(DEST, dir), { recursive: true });

console.log('Copied the LCARdS bundle (stub, chunks, fonts, msd) to doc/public/lcards/.');
