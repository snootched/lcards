#!/usr/bin/env node
/**
 * Banner renderer (B1): mounts a banner config (real LCARdS cards, usually one
 * lcards-layout-card) in the browser test harness at banner size, with the
 * HA-LCARS palette the docs demos use, and saves a still or a frame sequence.
 *
 *   node scripts/banner/render.mjs <config.yaml> <out.png> [--size 1200x300] [--wait 4000]
 *   node scripts/banner/render.mjs <config.yaml> <framesDir> --capture 9000
 *     records the browser's own frames (DevTools screencast, PNG, with timestamps)
 *     for 9000 ms after the banner settles, running `banner_timeline` from the
 *     start; then scripts/banner/encode-gif.mjs turns them into a looping GIF.
 *
 * Needs `npm run build` first (it serves custom_components/lcards/ like the tests).
 */
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args.splice(i, 2)[1] : def; };
const [w, h] = opt('size', '1200x300').split('x').map(Number);
const wait = Number(opt('wait', '4000'));
const capture = Number(opt('capture', '0'));
const [configPath, out] = args;
if (!configPath || !out) { console.error('usage: render.mjs <config.yaml> <out.png|framesDir> [--size WxH] [--wait ms] [--capture ms]'); process.exit(1); }

const config = YAML.parse(readFileSync(configPath, 'utf8'));
// `banner_states` (not a card key): entity states to set before the banner mounts
const states = config.banner_states ?? {};
delete config.banner_states;
// `banner_profile` (not a card key): the HA-LCARS theme whose variables the page gets,
// e.g. "LCARS Picard [LCARdS Red Accent]" (its vars, then its dark mode's)
const profileName = config.banner_profile ?? null;
delete config.banner_profile;
// `banner_timeline` (not a card key): [{ at: ms, states: { entity: value } }] from the capture start
const timeline = config.banner_timeline ?? [];
delete config.banner_timeline;
// `banner_after_mount` (not a card key): states set once the banner has mounted, before --wait
// (an object built at full size and then closed scales back to exactly its built look)
const afterMount = config.banner_after_mount ?? {};
delete config.banner_after_mount;
const snapshot = JSON.parse(readFileSync(join(ROOT, 'scripts/data/ha-lcars/snapshot.json'), 'utf8'));
const palette = Object.fromEntries(snapshot.palette.filter((p) => p.name.startsWith('lcars-')).map((p) => [`--${p.name}`, p.value]));
if (profileName) {
    const theme = snapshot.themes.find((t) => t.name === profileName);
    if (!theme) { console.error(`no HA-LCARS theme named ${profileName}`); process.exit(1); }
    const dark = theme.modes?.dark ?? {};
    for (const [k, v] of Object.entries({ ...theme.vars, ...dark })) {
        if (typeof v === 'string' || typeof v === 'number') palette[`--${k}`] = String(v);
    }
}

const port = 4890 + Math.floor(Math.random() * 50);
const server = spawn('node', [join(ROOT, 'tests/browser/serve.mjs'), String(port)], { stdio: 'ignore' });
try {
    const browser = await chromium.launch({
        executablePath: '/usr/bin/chromium',
        args: ['--ignore-gpu-blocklist', '--enable-gpu', '--use-angle=vulkan', '--enable-features=Vulkan'],
    });
    const page = await browser.newPage({ viewport: { width: w + 40, height: h + 40 }, deviceScaleFactor: 1 });
    for (let i = 0; i < 50; i++) {
        try { await page.goto(`http://127.0.0.1:${port}/harness.html?case=button-rule`); break; } catch { await new Promise((r) => setTimeout(r, 200)); }
    }
    await page.waitForFunction(() => window.__ready !== false, null, { timeout: 20_000 });
    await page.evaluate(([vars, W, H]) => {
        for (const [k, v] of Object.entries(vars)) document.documentElement.style.setProperty(k, v);
        document.documentElement.style.setProperty('--ha-card-background', '#000');
        const mount = document.getElementById('mount');
        Object.assign(mount.style, { width: `${W}px`, height: `${H}px`, padding: '0' });
    }, [palette, w, h]);
    await page.evaluate((st) => { for (const [id, v] of Object.entries(st)) /** @type {any} */ (window).__setState(id, String(v)); }, states);
    // a fresh card of the banner's own type (reconfigure keeps the fixture's element type)
    await page.evaluate(async ([c, H]) => {
        const first = /** @type {any} */ (window).__card;
        const el = await /** @type {any} */ (window).__mountExtra(c);
        first.remove();
        const box = el.parentElement;
        Object.assign(box.style, { width: document.getElementById('mount').style.width, height: `${H}px`, overflow: 'hidden' });
        document.getElementById('mount').style.display = 'none';
        el.style.height = `${H}px`;
        el.style.display = 'block';
        /** @type {any} */ (window).__banner = el;
    }, [config, h]);
    await page.waitForTimeout(1500);
    await page.evaluate((st) => { for (const [id, v] of Object.entries(st)) /** @type {any} */ (window).__setState(id, String(v)); }, afterMount);
    await page.waitForTimeout(wait);
    const card = page.locator('#mount + div');
    if (!capture) {
        await card.screenshot({ path: out });
        console.log(out);
    } else {
        mkdirSync(out, { recursive: true });
        const box = await card.boundingBox();
        const cdp = await page.context().newCDPSession(page);
        const frames = [];
        cdp.on('Page.screencastFrame', async (f) => {
            frames.push({ t: f.metadata.timestamp, data: f.data });
            await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
        });
        await page.evaluate((tl) => {
            for (const step of tl) setTimeout(() => {
                for (const [id, v] of Object.entries(step.states)) /** @type {any} */ (window).__setState(id, String(v));
            }, step.at);
        }, timeline);
        await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1 });
        await page.waitForTimeout(capture);
        await cdp.send('Page.stopScreencast');
        // frames with their display times, cropped later by the encoder (box)
        const t0 = frames[0]?.t ?? 0;
        const lines = [];
        frames.forEach((f, i) => {
            const name = `f${String(i).padStart(5, '0')}.png`;
            writeFileSync(join(out, name), Buffer.from(f.data, 'base64'));
            lines.push(`${name} ${((f.t - t0) * 1000).toFixed(1)}`);
        });
        writeFileSync(join(out, 'frames.txt'), lines.join('\n') + '\n');
        writeFileSync(join(out, 'box.json'), JSON.stringify({ ...box, duration: capture }));
        console.log(`${frames.length} frames in ${out}`);
    }
    const errors = await page.evaluate(() => window.__errors ?? []);
    if (errors.length) console.log('page errors:', errors.slice(0, 5));
    await browser.close();
} finally {
    server.kill();
}
