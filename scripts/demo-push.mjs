#!/usr/bin/env node
/**
 * demo-push.mjs - build the demo boards in the dev Home Assistant from the tracked
 * view files (demo/views/*.yaml, ordered and described by demo/order.yaml):
 * lcards-demo (dev: every view) and lcards-demo-public (the public views).
 *
 *   npm run demo:push [-- --board=dev|public] [--view=<path>] [--check[=<path>]] [--dry-run] [--force]
 *
 * Every push writes each board whole: the generated index view, then every view
 * with its generated header. Adding or changing one file never drops the others.
 *
 *   1. Check every view file and each assembled board (headers, index) with the
 *      config checker (scripts/lib/config-validator.js); errors stop the push
 *      unless --force, warnings are printed.
 *   2. Make sure the lcards_test_* helpers exist (tests/ha/ha-client.mjs), create
 *      the boards if missing (in the sidebar) and save them.
 *
 * --board=<name> push one board (default: both).
 * --view=<path>  the view whose URL is printed (default: the index).
 * --check        open every view of the pushed boards (or --check=<path> one) in
 *                headless Chromium logged in with the token, save
 *                tmp/demo/<board>/<path>.png and print LCARdS page errors.
 *                Needs a current `npm run build`.
 * --dry-run      validate and assemble only; no Home Assistant needed.
 *
 * Needs the dev Home Assistant (HA_URL, default http://localhost:8123) with a
 * long-lived token in $HA_TOKEN or .ha-token. Views use only lcards_test_*
 * helpers and the non-personal entities tests/docs/demo-dashboard.test.js allows.
 */
import { mkdirSync } from 'node:fs';
import yaml from 'js-yaml';
import { relative } from 'node:path';
import { HAClient, HA_URL, readToken, ensureHelpers, TEST_HELPERS, GALLERY_HELPERS } from '../tests/ha/ha-client.mjs';
import { loadDemo, loadPackage, viewTexts, buildDashboard, BOARDS } from './lib/demo-dashboard.js';
import { validateTexts } from './lcards-validate.mjs';
import { launchChromium, newHAContext, openDashboardView, collectLcardsErrors } from './lib/ha-browser.mjs';

const args = process.argv.slice(2);
const opt = (name) => {
    const a = args.find(x => x === `--${name}` || x.startsWith(`--${name}=`));
    return a === undefined ? undefined : (a.split('=')[1] ?? true);
};

const demo = loadDemo();
if (demo.missing.length) console.error(`order.yaml lists missing views: ${demo.missing.join(', ')}`);
if (demo.unlisted.length) console.error(`views not in order.yaml: ${demo.unlisted.join(', ')}`);
const boardNames = typeof opt('board') === 'string' ? [opt('board')] : Object.keys(BOARDS);
for (const b of boardNames) if (!BOARDS[b]) { console.error(`unknown board ${b} (${Object.keys(BOARDS).join(', ')})`); process.exit(2); }
const configs = Object.fromEntries(boardNames.map(b => [b, buildDashboard(demo, { board: b })]));
const issues = [
    ...await validateTexts(viewTexts(demo)),
    // the generated headers and index
    ...await validateTexts(boardNames.map(b => ({ name: `${b} board`, text: yaml.dump(configs[b]) }))),
];
for (const i of issues) console.log(`  ${i.severity} ${relative(process.cwd(), i.file)}: ${i.path}${i.tag ? ` [${i.tag}]` : ''} ${i.message}`);
const errors = issues.filter(i => i.severity === 'error').length + demo.missing.length + demo.unlisted.length;
if (errors && !opt('force')) {
    console.error(`${errors} problem(s), not pushed (--force to push anyway)`);
    process.exit(1);
}

for (const b of boardNames) console.log(`${BOARDS[b].urlPath}: ${configs[b].views.length} views: ${configs[b].views.map(v => v.path).join(', ')}`);
if (opt('dry-run')) process.exit(0);

const token = readToken();
if (!token) {
    console.error('No Home Assistant token: set $HA_TOKEN or put a long-lived token in .ha-token');
    process.exit(2);
}
const client = await HAClient.connect(token);
await ensureHelpers(client, { ...TEST_HELPERS, ...GALLERY_HELPERS });
// the scripts and automations the views use (demo/package.yaml), created or replaced
const extras = loadPackage();
for (const [id, cfg] of Object.entries(extras.script)) await client.saveConfig('script', id, cfg);
for (const cfg of extras.automation) await client.saveConfig('automation', cfg.id, cfg);
const dashboards = await client.call({ type: 'lovelace/dashboards/list' });
const viewPath = typeof opt('view') === 'string' ? opt('view') : 'index';
for (const b of boardNames) {
    const { urlPath, title } = BOARDS[b];
    if (!dashboards.some(d => d.url_path === urlPath)) {
        await client.call({
            type: 'lovelace/dashboards/create', url_path: urlPath, title,
            icon: b === 'dev' ? 'mdi:flask' : 'mdi:rocket-launch', mode: 'storage', require_admin: false, show_in_sidebar: true,
        });
    }
    await client.call({ type: 'lovelace/config/save', url_path: urlPath, config: configs[b] });
    console.log(`Pushed: ${HA_URL}/${urlPath}/${viewPath}`);
}

const check = opt('check');
let failed = 0;
if (check) {
    const browser = await launchChromium();
    const shots = boardNames.flatMap(b => (typeof check === 'string' ? [check] : configs[b].views.map(v => v.path))
        .filter(path => configs[b].views.some(v => v.path === path)).map(path => [b, path]));
    for (const b of boardNames) mkdirSync(`tmp/demo/${b}`, { recursive: true });
    for (const [b, path] of shots) {
        const out = `tmp/demo/${b}/${path}.png`;
        const context = await newHAContext(browser, token, { width: 1600, height: 1200 });
        const page = await context.newPage();
        const pageErrors = collectLcardsErrors(page);
        try {
            await openDashboardView(page, BOARDS[b].urlPath, path, 5000);
            await page.screenshot({ path: out, fullPage: true });
            console.log(`${out}${pageErrors.length ? `  (${pageErrors.length} page error(s))` : ''}`);
            for (const e of pageErrors.slice(0, 5)) console.log(`  page error: ${e}`);
            if (pageErrors.length) failed++;
        } catch (err) {
            failed++;
            console.error(`${out}: ${err.message.split('\n')[0]}`);
        } finally {
            await context.close().catch(() => {});
        }
    }
    await browser.close();
}
client.close();
process.exit(failed ? 1 : 0);
