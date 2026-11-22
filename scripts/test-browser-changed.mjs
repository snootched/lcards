#!/usr/bin/env node
/**
 * npm run test:browser:changed [-- --base <ref>] [--dry-run] [--all] [--github-output] [playwright args...]
 *
 * Runs only the browser tests (Playwright component project) that the changed
 * files need; shared code runs the full suite. The map is
 * scripts/lib/browser-test-select.js. Changed files are everything that differs
 * from the merge base with --base (default: origin/dev, else dev, else main),
 * committed or not, plus untracked files. Run `npm run build` first: the tests
 * use the built bundle. Other arguments go to Playwright (--workers=2,
 * --reporter=dot, ...).
 *
 * --github-output (CI): run nothing; write the choice to $GITHUB_OUTPUT as
 * `browser=all|some|none` and `grep=<pattern>` (validate-integration.yml).
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { selectBrowserTests, grepFor, NOT_COMPONENT } from './lib/browser-test-select.js';

const args = process.argv.slice(2);
const take = (flag) => {
    const i = args.indexOf(flag);
    if (i < 0) return undefined;
    const [, value] = args.splice(i, flag.startsWith('--base') ? 2 : 1);
    return value ?? true;
};
const baseArg = take('--base');
const dryRun = take('--dry-run');
const forceAll = take('--all');
const githubOutput = take('--github-output');

const git = (...a) => execFileSync('git', a, { encoding: 'utf8' }).trim();
const refExists = (ref) => { try { git('rev-parse', '--verify', '--quiet', `${ref}^{commit}`); return true; } catch { return false; } };

const base = typeof baseArg === 'string' ? baseArg : ['origin/dev', 'dev', 'main'].find(refExists);
if (!base || !refExists(base)) {
    console.error(`[test:browser:changed] base ref ${base ?? '(none)'} not found; pass --base <ref>, or run npm run test:browser`);
    process.exit(2);
}
const mergeBase = git('merge-base', base, 'HEAD');
const lines = (s) => s.split('\n').filter(Boolean);
const changed = [...new Set([
    ...lines(git('diff', '--name-only', mergeBase)),               // committed and uncommitted
    ...lines(git('ls-files', '--others', '--exclude-standard')),  // new files
])];

const dir = 'tests/browser';
const specFiles = readdirSync(dir).filter((f) => f.endsWith('.spec.js') && !NOT_COMPONENT.includes(f));
const specsUsingFixture = (name) => specFiles.filter((f) => readFileSync(join(dir, f), 'utf8').includes(`'${name}'`));

const sel = forceAll ? { all: true, specs: [], cards: [], fixtures: [], reasons: ['--all'] }
    : selectBrowserTests(changed, specFiles, specsUsingFixture);

console.log(`[test:browser:changed] ${changed.length} changed file(s) since ${base} (${mergeBase.slice(0, 8)})`);
for (const r of sel.reasons.slice(0, 20)) console.log(`  ${r}`);
if (sel.reasons.length > 20) console.log(`  ... and ${sel.reasons.length - 20} more`);

if (githubOutput) {
    const out = process.env.GITHUB_OUTPUT;
    const grep = sel.all ? '' : (grepFor(sel) ?? '');
    const mode = sel.all ? 'all' : grep ? 'some' : 'none';
    console.log(`[test:browser:changed] CI: ${mode}${grep ? ` (${sel.specs.length} spec file(s)${sel.cards.length || sel.fixtures.length ? ' and part of cards.spec.js' : ''})` : ''}`);
    if (out) appendFileSync(out, `browser=${mode}\ngrep<<LCARDS_GREP_EOF\n${grep}\nLCARDS_GREP_EOF\n`);
    process.exit(0);
}

const pw = ['playwright', 'test', '--project=component'];
if (sel.all) {
    console.log('[test:browser:changed] full suite');
} else {
    const grep = grepFor(sel);
    if (!grep) {
        console.log('[test:browser:changed] nothing in the bundle changed: no browser tests to run');
        process.exit(0);
    }
    console.log(`[test:browser:changed] ${sel.specs.length} spec file(s)${sel.cards.length || sel.fixtures.length ? ' and part of cards.spec.js' : ''}`);
    for (const s of sel.specs) console.log(`  ${s}`);
    if (sel.cards.length || sel.fixtures.length) console.log(`  cards.spec.js: ${[...sel.cards, ...sel.fixtures].join(', ')}`);
    pw.push('--grep', grep);
}
pw.push(...args);
if (dryRun) {
    console.log(`[test:browser:changed] dry run: npx ${pw.map((a) => (/[\s|()]/.test(a) ? JSON.stringify(a) : a)).join(' ')}`);
    process.exit(0);
}
const run = spawnSync('npx', pw, { stdio: 'inherit' });
process.exit(run.status ?? 1);
