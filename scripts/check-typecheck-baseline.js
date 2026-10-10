#!/usr/bin/env node
/**
 * check-typecheck-baseline.js - fail only on TypeScript errors not in the baseline.
 *
 * `npm run typecheck` reports a known backlog of errors. This script runs tsc,
 * normalises each error to `file: error TSxxxx: message` (line/column stripped so
 * unrelated edits don't churn the baseline) and compares the result, as a
 * multiset, against scripts/tsc-baseline.txt.
 *
 *   node scripts/check-typecheck-baseline.js           # check (CI)
 *   node scripts/check-typecheck-baseline.js --update  # rewrite the baseline
 *
 * New errors fail the check. Errors that disappeared are reported so the
 * baseline can be tightened with --update.
 */

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = resolve(root, 'scripts/tsc-baseline.txt');
const ERROR_LINE = /^(\S.*?)\(\d+,\d+\): (error TS\d+: .*)$/;

/** @param {string} text @returns {string[]} sorted normalised error lines */
function normalise(text) {
    const out = [];
    for (const line of text.split(/\r?\n/)) {
        const m = ERROR_LINE.exec(line);
        if (m) out.push(`${m[1]}: ${m[2]}`);
    }
    return out.sort();
}

/** @param {string[]} list @returns {Map<string, number>} */
function counts(list) {
    const map = new Map();
    for (const item of list) map.set(item, (map.get(item) || 0) + 1);
    return map;
}

/** @param {Map<string, number>} a @param {Map<string, number>} b @returns {string[]} entries in a beyond b */
function excess(a, b) {
    const out = [];
    for (const [item, n] of a) {
        for (let i = b.get(item) || 0; i < n; i++) out.push(item);
    }
    return out;
}

const tsc = spawnSync(process.execPath, [resolve(root, 'node_modules/typescript/bin/tsc'), '--pretty', 'false'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
});
if (tsc.error) {
    console.error('Failed to run tsc:', tsc.error.message);
    process.exit(2);
}
const current = normalise(`${tsc.stdout}\n${tsc.stderr}`);

if (process.argv.includes('--update')) {
    writeFileSync(BASELINE, current.join('\n') + '\n');
    console.log(`Baseline updated: ${current.length} error(s) in scripts/tsc-baseline.txt`);
    process.exit(0);
}

if (!existsSync(BASELINE)) {
    console.error('scripts/tsc-baseline.txt is missing; run with --update to create it.');
    process.exit(2);
}

const baseline = readFileSync(BASELINE, 'utf8').split(/\r?\n/).filter(Boolean);
const added = excess(counts(current), counts(baseline));
const fixed = excess(counts(baseline), counts(current));

if (fixed.length) {
    console.log(`${fixed.length} baseline error(s) no longer reported (tighten with --update):`);
    for (const item of fixed) console.log(`  - ${item}`);
}

if (added.length) {
    console.error(`\n${added.length} new TypeScript error(s) not in the baseline:`);
    for (const item of added) console.error(`  + ${item}`);
    console.error('\nFix them, or if intentional, run: node scripts/check-typecheck-baseline.js --update');
    process.exit(1);
}

console.log(`Typecheck OK: ${current.length} error(s), none new against the baseline.`);
