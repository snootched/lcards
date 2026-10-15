#!/usr/bin/env node
/**
 * check-doc-anchors.js - fail on links to heading anchors that don't exist.
 *
 * VitePress checks that linked pages exist, not that `#anchor` targets do. Its
 * slugger turns `_` into `-`, prefixes headings that start with a digit with `_`,
 * and collapses runs of `-`, so hand-written anchors drift easily.
 *
 * Runs on the built site (after `vitepress build doc`): collects every element id
 * per page, resolves every `href="...#fragment"` (same-page, relative and
 * absolute), and reports targets that are missing, with the closest existing id
 * as a suggestion.
 *
 *   node scripts/check-doc-anchors.js            # exit 1 when anything is missing
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(root, 'doc/.vitepress/dist');
const SITE_BASE = process.env.DOCS_BASE ?? '/';

if (!existsSync(DIST)) {
    console.error('doc/.vitepress/dist not found: run `npm run docs:build` first.');
    process.exit(2);
}

/** @returns {string[]} every built .html page (assets excluded) */
function pages(dir, out = []) {
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) {
            if (name !== 'assets') pages(p, out);
        } else if (name.endsWith('.html')) {
            out.push(p);
        }
    }
    return out;
}

/** Resolve a link path to a built page, or null when there is no such page. */
function resolvePage(fromPage, linkPath) {
    if (!linkPath) return fromPage;
    let clean = linkPath.split('?')[0];
    // A /dev/ or /v/<version>/ build (DOCS_BASE) prefixes every site link with its base.
    if (SITE_BASE !== '/' && clean.startsWith(SITE_BASE)) clean = '/' + clean.slice(SITE_BASE.length);
    const base = clean.startsWith('/') ? join(DIST, clean) : resolve(dirname(fromPage), clean);
    for (const candidate of [base, `${base}.html`, join(base, 'index.html'), base.replace(/\.html$/, '/index.html')]) {
        if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
    }
    return null;
}

/** Normalised form for "did you mean" matching. */
const norm = (s) => s.toLowerCase().replace(/_/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

function suggest(fragment, ids) {
    const want = norm(fragment);
    let best = null;
    let bestScore = 0;
    for (const id of ids) {
        const n = norm(id);
        if (n === want) return id;
        // Longest common prefix as a cheap similarity score.
        let i = 0;
        while (i < n.length && i < want.length && n[i] === want[i]) i++;
        if (i > bestScore) { bestScore = i; best = id; }
    }
    return bestScore >= Math.min(8, want.length) ? best : null;
}

const all = pages(DIST);
const idsByPage = new Map();
const htmlByPage = new Map();
for (const page of all) {
    const html = readFileSync(page, 'utf8');
    htmlByPage.set(page, html);
    idsByPage.set(page, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1])));
}

const problems = new Map();
for (const [page, html] of htmlByPage) {
    for (const m of html.matchAll(/href="([^"#]*)#([^"]+)"/g)) {
        const [, linkPath, rawFragment] = m;
        if (/^[a-z]+:/i.test(linkPath)) continue; // external (https:, mailto:, ...)
        const target = resolvePage(page, linkPath);
        const from = relative(DIST, page);
        const href = `${linkPath}#${rawFragment}`;
        if (!target) {
            problems.set(`${from}|${href}`, `${from}: ${href}  (no such page)`);
            continue;
        }
        const fragment = decodeURIComponent(rawFragment);
        const ids = idsByPage.get(target);
        if (ids.has(fragment)) continue;
        const hint = suggest(fragment, ids);
        problems.set(`${from}|${href}`, `${from}: ${href}${hint ? `  (did you mean #${hint}?)` : ''}`);
    }
}

if (problems.size) {
    console.error(`\n${problems.size} link(s) to missing anchors:\n`);
    for (const line of problems.values()) console.error(`  ${line}`);
    console.error('');
    process.exit(1);
}
console.log(`Doc anchors OK: ${all.length} pages, every #anchor link resolves.`);
