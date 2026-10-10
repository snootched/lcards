#!/usr/bin/env node
/**
 * check-doc-em-dashes.js - fail on em dashes in docs sources.
 *
 * House style for user-facing text (CLAUDE.md): no em dashes. Use a colon,
 * comma, semicolon, parentheses or a new sentence. Scans doc/ markdown and the
 * docs site's own code (Vue, TS, JS); built output and caches are skipped.
 *
 *   node scripts/check-doc-em-dashes.js
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOC = join(root, 'doc');
const SKIP = new Set(['dist', 'cache', 'node_modules']);
const EXT = /\.(md|vue|ts|mts|js)$/;
const EM_DASH = '—';

const hits = [];
(function walk(dir) {
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) {
            if (!SKIP.has(name)) walk(p);
        } else if (EXT.test(name)) {
            readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
                if (line.includes(EM_DASH)) hits.push(`${relative(root, p)}:${i + 1}  ${line.trim().slice(0, 100)}`);
            });
        }
    }
})(DOC);

if (hits.length) {
    console.error(`\n${hits.length} em dash(es) in docs (use a colon, comma, semicolon or parentheses):\n`);
    for (const h of hits) console.error(`  ${h}`);
    process.exit(1);
}
console.log('Docs em-dash check OK.');
