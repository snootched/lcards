#!/usr/bin/env node
/**
 * check-schema-descriptions.js - fail on schema properties added without a description.
 *
 * Descriptions are what people and LLMs read to decide what a key does, and the
 * published schema (lcards-schema.json) carries them. This walks every schema in
 * scripts/lib/card-schemas.js and lists each property that has no `description`
 * as `<tag>: <path>` (`[]` marks array items; anyOf/oneOf/allOf branches share
 * their parent's path). Properties that are `$ref`s or marked `deprecated` are
 * skipped. The list is compared against scripts/schema-description-baseline.txt,
 * the known backlog, the same way check-typecheck-baseline.js treats tsc.
 *
 *   node scripts/check-schema-descriptions.js           # check (npm run build, CI)
 *   node scripts/check-schema-descriptions.js --update  # rewrite the baseline
 *
 * New gaps fail the check. Gaps that were filled are reported so the baseline
 * can be tightened with --update.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSchemaEntries } from './lib/card-schemas.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = resolve(root, 'scripts/schema-description-baseline.txt');

/**
 * Collect `<path>` for every property under `schema` that lacks a description.
 * @param {any} schema
 * @param {string} path
 * @param {Set<string>} out
 * @param {Set<object>} stack - schemas on the current path (guards recursive schemas)
 * @returns {Set<string>}
 */
export function missingDescriptions(schema, path = '', out = new Set(), stack = new Set()) {
    if (!schema || typeof schema !== 'object' || Array.isArray(schema) || stack.has(schema)) return out;
    stack.add(schema);
    for (const [name, prop] of Object.entries(schema.properties ?? {})) {
        if (!prop || typeof prop !== 'object') continue;
        const p = path ? `${path}.${name}` : name;
        if (!prop.description && !prop.$ref && !prop.deprecated) out.add(p);
        missingDescriptions(prop, p, out, stack);
    }
    for (const sub of Object.values(schema.patternProperties ?? {})) missingDescriptions(sub, `${path}.*`, out, stack);
    if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
        missingDescriptions(schema.additionalProperties, `${path}.*`, out, stack);
    }
    if (schema.items) missingDescriptions(schema.items, `${path}[]`, out, stack);
    for (const key of ['anyOf', 'oneOf', 'allOf']) {
        for (const branch of schema[key] ?? []) missingDescriptions(branch, path, out, stack);
    }
    stack.delete(schema);
    return out;
}

/** @returns {string[]} sorted `<tag>: <path>` lines for every schema */
export function currentGaps() {
    const lines = [];
    for (const { tag, schema } of getSchemaEntries()) {
        for (const p of missingDescriptions(schema)) lines.push(`${tag}: ${p}`);
    }
    return lines.sort();
}

function main() {
    const current = currentGaps();
    if (process.argv.includes('--update')) {
        writeFileSync(BASELINE, current.join('\n') + '\n');
        console.log(`Baseline updated: ${current.length} propert${current.length === 1 ? 'y' : 'ies'} without a description in scripts/schema-description-baseline.txt`);
        return;
    }
    if (!existsSync(BASELINE)) {
        console.error('scripts/schema-description-baseline.txt is missing; run with --update to create it.');
        process.exit(2);
    }
    const baseline = new Set(readFileSync(BASELINE, 'utf8').split(/\r?\n/).filter(Boolean));
    const now = new Set(current);
    const added = current.filter(line => !baseline.has(line));
    const fixed = [...baseline].filter(line => !now.has(line));
    if (fixed.length) {
        console.log(`${fixed.length} baseline entr${fixed.length === 1 ? 'y' : 'ies'} now described or gone (tighten with --update):`);
        for (const line of fixed) console.log(`  - ${line}`);
    }
    if (added.length) {
        console.error(`\n${added.length} schema propert${added.length === 1 ? 'y has' : 'ies have'} no description:`);
        for (const line of added) console.error(`  + ${line}`);
        console.error('\nAdd a `description` to each (it is published in lcards-schema.json), or if intentional run: node scripts/check-schema-descriptions.js --update');
        process.exit(1);
    }
    console.log(`Schema descriptions OK: ${current.length} known gap(s), none new against the baseline.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
