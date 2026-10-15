#!/usr/bin/env node
/**
 * dashboard-shots.mjs - see a dashboard YAML as it renders in Home Assistant.
 *
 * The feedback loop for building dashboards (the gallery in doc/gallery/, or any
 * YAML Claude or you are working on): validate -> push to the dev HA -> screenshot.
 *
 *   node scripts/dashboard-shots.mjs <file.yaml ...> [--out=<dir>] [--view=<n>]
 *        [--size=1600x1000] [--force] [--keep] [--headed]
 *
 * For each file:
 *   1. Check it with the config checker (scripts/lib/config-validator.js); stop on
 *      errors unless --force (warnings are printed).
 *   2. Make sure the lcards_test_* helpers exist (tests/ha/ha-client.mjs), write the
 *      YAML to the hidden `lcards-gallery` dashboard (not in the sidebar).
 *   3. Set the helpers to the sample values in GALLERY_STATES, open view <n> (default
 *      0) logged in with the token, sidebar hidden, wait for the LCARdS cards to
 *      settle, and save <out>/<file name>.webp (default doc/public/gallery/) at 2x,
 *      cropped to the view (no HA toolbar).
 * With --keep the dashboard keeps the last file's config (open /lcards-gallery to
 * look around); otherwise it is reset to an empty view.
 *
 * Needs the dev HA (HA_URL, default http://localhost:8123) with a long-lived token
 * in $HA_TOKEN or .ha-token, a current `npm run build`, and `magick`. The YAML must
 * use only lcards_test_* helpers (the dev HA's other entities carry personal names);
 * tests/docs/dashboard-gallery.test.js enforces that for the gallery.
 */
import { readFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import { HAClient, HA_URL, readToken, ensureHelpers, TEST_HELPERS, GALLERY_HELPERS, GALLERY_STATES } from '../tests/ha/ha-client.mjs';
import { validateTexts, parseConfig } from './lcards-validate.mjs';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
export const GALLERY_DASHBOARD = 'lcards-gallery';

const args = process.argv.slice(2);
const opt = (name, fallback) => args.find(a => a.startsWith(`--${name}=`))?.split('=')[1] ?? fallback;
const files = args.filter(a => !a.startsWith('--'));
const outDir = resolve(opt('out', join(ROOT, 'doc/public/gallery')));
const viewIndex = Number(opt('view', '0'));
const [width, height] = opt('size', '1600x1000').split('x').map(Number);

if (!files.length) {
    console.error('usage: dashboard-shots.mjs <file.yaml ...> [--out=<dir>] [--view=<n>] [--size=WxH] [--force] [--keep] [--headed]');
    process.exit(2);
}

const token = readToken();
if (!token) {
    console.error('No HA token: set $HA_TOKEN or put a long-lived token in .ha-token');
    process.exit(2);
}

const client = await HAClient.connect(token);
await ensureHelpers(client, { ...TEST_HELPERS, ...GALLERY_HELPERS });
// The same sample values for every shot (power 82 %, lights on, ...).
for (const [domain, service, data] of GALLERY_STATES) await client.callService(domain, service, data);
const dashboards = await client.call({ type: 'lovelace/dashboards/list' });
if (!dashboards.some(d => d.url_path === GALLERY_DASHBOARD)) {
    await client.call({
        type: 'lovelace/dashboards/create', url_path: GALLERY_DASHBOARD, title: 'LCARdS Gallery',
        mode: 'storage', require_admin: false, show_in_sidebar: false,
    });
}
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({
    headless: !args.includes('--headed'),
    executablePath: process.env.CHROMIUM_PATH ?? (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
});

let failed = 0;
for (const file of files) {
    const name = basename(file).replace(/\.ya?ml$/, '');
    const text = readFileSync(file, 'utf8');
    const issues = await validateTexts([{ name: file, text }]);
    for (const i of issues) console.log(`  ${i.severity} ${i.path}${i.tag ? ` [${i.tag}]` : ''} ${i.message}`);
    if (issues.some(i => i.severity === 'error') && !args.includes('--force')) {
        console.error(`${name}: config errors, not pushed (--force to push anyway)`);
        failed++;
        continue;
    }
    const config = parseConfig(text);
    await client.call({ type: 'lovelace/config/save', url_path: GALLERY_DASHBOARD, config });

    const context = await browser.newContext({ baseURL: HA_URL, viewport: { width, height }, deviceScaleFactor: 2, serviceWorkers: 'block' });
    await context.addInitScript(({ token, hassUrl }) => {
        localStorage.setItem('hassTokens', JSON.stringify({
            access_token: token, token_type: 'Bearer', expires_in: 1e9, hassUrl,
            clientId: `${hassUrl}/`, expires: Date.now() + 1e12, refresh_token: '',
        }));
        localStorage.setItem('dockedSidebar', JSON.stringify('always_hidden'));
    }, { token, hassUrl: HA_URL });
    const page = await context.newPage();
    const errors = [];
    // LCARdS errors only (message plus the top stack frames, enough to find the card).
    // HA's own frontend throws one on load here because service workers are blocked.
    page.on('pageerror', e => {
        if (!/lcards/i.test(`${e.message}\n${e.stack ?? ''}`)) return;
        errors.push([e.message, ...(e.stack ?? '').split('\n').slice(1, 4).map(l => l.trim())].join(' | '));
    });
    page.on('console', m => { if (m.type() === 'error' && /lcards/i.test(m.text())) errors.push(m.text().slice(0, 200)); });
    try {
        const viewPath = config.views?.[viewIndex]?.path ?? String(viewIndex);
        await page.goto(`/${GALLERY_DASHBOARD}/${viewPath}`);
        await page.waitForFunction(() => !!window.lcards?.core?.themeManager, null, { timeout: 30_000 });
        await page.waitForLoadState('networkidle').catch(() => {});
        await page.waitForTimeout(3000); // animations, charts and MSD routing settle
        // The view itself, below HA's toolbar (whose title and clock aren't the example's).
        const view = page.locator('hui-view').first();
        const box = (await view.count()) ? await view.boundingBox() : null;
        const clip = box ? { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, height - box.y) } : undefined;
        const png = join(tmpdir(), `lcards-gallery-${process.pid}-${name}.png`);
        await page.screenshot({ path: png, clip });
        const out = join(outDir, `${name}.webp`);
        execFileSync('magick', [png, '-resize', '1600x>', '-quality', '85', out]);
        rmSync(png, { force: true });
        console.log(`${name}: ${out.startsWith(ROOT) ? out.slice(ROOT.length + 1) : out}${errors.length ? `  (${errors.length} page error(s))` : ''}`);
        for (const e of errors.slice(0, 5)) console.log(`  page error: ${e}`);
    } catch (err) {
        failed++;
        console.error(`${name}: ${err.message.split('\n')[0]}`);
    } finally {
        await context.close().catch(() => {});
    }
}

if (!args.includes('--keep')) {
    await client.call({ type: 'lovelace/config/save', url_path: GALLERY_DASHBOARD, config: { title: 'LCARdS Gallery', views: [{ title: 'Empty', cards: [] }] } });
}
await browser.close();
client.close();
process.exit(failed ? 1 : 0);
