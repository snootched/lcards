#!/usr/bin/env node
/**
 * check-doc-ha-name.js - fail on the bare abbreviation "HA" in docs prose.
 *
 * House style for user-facing text (CLAUDE.md): write "Home Assistant" in full.
 * Scans doc/ markdown prose (code, links and HTML tags are skipped; see
 * scripts/lib/home-assistant-name.js); built output and caches are skipped.
 *
 *   node scripts/check-doc-ha-name.js
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bareHaLines } from './lib/home-assistant-name.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOC = join(root, 'doc');
const SKIP = new Set(['dist', 'cache', 'node_modules', 'public', '.vitepress']);

const hits = [];
(function walk(dir) {
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) {
            if (!SKIP.has(name)) walk(p);
        } else if (name.endsWith('.md')) {
            for (const { line, text } of bareHaLines(readFileSync(p, 'utf8'))) {
                hits.push(`${relative(root, p)}:${line}  ${text.slice(0, 100)}`);
            }
        }
    }
})(DOC);

if (hits.length) {
    console.error(`\n${hits.length} line(s) in docs say "HA" (write "Home Assistant"; HA-LCARS and code stay):\n`);
    for (const h of hits) console.error(`  ${h}`);
    process.exit(1);
}
console.log('Docs "Home Assistant" check OK.');
