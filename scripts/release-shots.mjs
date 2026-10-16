#!/usr/bin/env node
/**
 * release-shots.mjs - capture the pictures for a release page from the dev HA.
 *
 *   node scripts/release-shots.mjs <version> [name ...] [--gif] [--headed]
 *   node scripts/release-shots.mjs --list <file.yaml> --out <dir> [name ...] [--gif]   (any other shot
 *       list, e.g. doc/cards/shots.yaml -> doc/public/img/cards for the card overview)
 *
 * Reads doc/releases/shots/<version>.yaml and writes doc/public/releases/<version>/<name>.webp
 * (stills) or <name>.webm (+ <name>.gif with --gif, for the GitHub export). Videos are
 * recorded in real time with the DevTools screencast (animations run as on a dashboard). Needs the
 * dev HA (HA_URL, default http://localhost:8123) with a long-lived token in $HA_TOKEN
 * or .ha-token, a current `npm run build`, and `magick` + `ffmpeg`.
 *
 * Shot list entries (see .github/instructions/releases.instructions.md):
 *
 *   - name: chart-studio            # output file name
 *     kind: still                   # still (default) | video
 *     card: { type: custom:lcards-chart, ... }   # mounted inside home-assistant on a plain backdrop
 *     size: [600, 300]              # card width and height in px (height 0 = the card's own)
 *     path: /lcards-config?tab=theme  # an HA page instead of card: (default /lcards-config)
 *     editor: true                  # mount the card's editor instead of the card
 *     open: _openChartStudio        # then call this editor method (opens a studio)
 *     steps:                        # then, in order:
 *       - click: 'ha-tab-group-tab:has-text("Series")'   # Playwright selector (pierces shadow roots)
 *       - wait: 800                 # ms
 *       - eval: 'window.scrollTo(0, 0)'                  # JS in the page
 *       - service: [input_number, set_value, { entity_id: input_number.lcards_test_value, value: 40 }]
 *       - drag: [lcards-slider, 0.2, 0.8, 1500]   # press at 20% of its width, move to 80% over 1.5 s, hold, release
 *     selector: lcards-chart-studio-dialog ha-dialog     # crop to this element (default: whole viewport)
 *     padding: 16                   # px around the crop
 *     viewport: [1400, 900]
 *     duration: 4000                # video only: ms recorded after the steps
 *     video_steps: [...]            # video only: steps run while recording
 *
 * Only lcards_test_* helpers are created (nothing is saved to a dashboard). Check
 * every image for personal names (entities, areas, dashboards) before committing it.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import yaml from 'js-yaml';
import { chromium } from '@playwright/test';
import { HAClient, HA_URL, readToken, ensureHelpers } from '../tests/ha/ha-client.mjs';
import { ROOT, PUBLIC_DIR } from './release-lib.mjs';
import { runSteps, recordScreencast, encodeFrames, webmToGif } from './lib/shot-video.mjs';

const argv = process.argv.slice(2);
const optValue = (flag) => { const i = argv.indexOf(flag); return i === -1 ? null : argv[i + 1]; };
const listArg = optValue('--list');
const outArg = optValue('--out');
// Positional args, without the values of --list / --out.
const args = argv.filter((a, i) => !['--list', '--out'].includes(argv[i - 1]));
const positional = args.filter(a => !a.startsWith('--'));
const version = listArg ? null : positional[0];
const only = new Set(listArg ? positional : positional.slice(1));
const wantGif = args.includes('--gif');
const headed = args.includes('--headed');

if (!version && !(listArg && outArg)) {
    console.error('usage: release-shots.mjs <version> [name ...] [--gif] [--headed]\n       release-shots.mjs --list <file.yaml> --out <dir> [name ...] [--gif] [--headed]');
    process.exit(1);
}
const listFile = listArg ? join(ROOT, listArg) : join(ROOT, 'doc', 'releases', 'shots', `${version}.yaml`);
if (!existsSync(listFile)) {
    console.error(`No shot list ${listFile}`);
    process.exit(1);
}
const token = readToken();
if (!token) {
    console.error('No HA token: set HA_TOKEN or put one in .ha-token');
    process.exit(1);
}

const shots = (yaml.load(readFileSync(listFile, 'utf8')) ?? []).filter(s => !only.size || only.has(s.name));
const outDir = outArg ? join(ROOT, outArg) : join(PUBLIC_DIR, 'releases', version);
mkdirSync(outDir, { recursive: true });

/** Element box (plus padding) clamped to the viewport, or the whole viewport. */
async function cropBox(page, shot, viewport) {
    if (!shot.selector) return { x: 0, y: 0, width: viewport[0], height: viewport[1] };
    const target = page.locator(shot.selector).first();
    await target.scrollIntoViewIfNeeded();
    const box = await target.boundingBox();
    if (!box) throw new Error(`${shot.name}: "${shot.selector}" has no box`);
    const pad = shot.padding ?? 0;
    const x = Math.max(0, Math.floor(box.x - pad));
    const y = Math.max(0, Math.floor(box.y - pad));
    return {
        x, y,
        width: Math.min(viewport[0] - x, Math.ceil(box.width + 2 * pad)),
        height: Math.min(viewport[1] - y, Math.ceil(box.height + 2 * pad)),
    };
}

async function openShot(page, shot) {
    await page.goto(shot.path ?? '/lcards-config');
    await page.waitForFunction(() => {
        const ha = document.querySelector('home-assistant');
        return !!(ha?.shadowRoot && ha.hass?.states && window.lcards?.core?.themeManager);
    }, null, { timeout: 30_000 });
    await page.evaluate(() => customElements.whenDefined('lcards-button'));
    if (shot.card) {
        // Inside home-assistant (where HA's Lit contexts resolve), on a plain full-screen
        // backdrop so nothing of the page behind shows. hass follows HA's own updates.
        await page.evaluate(async ({ config, editor: asEditor, open, size }) => {
            const tag = config.type.replace(/^custom:/, '');
            await customElements.whenDefined(tag);
            const ha = document.querySelector('home-assistant');
            const backdrop = document.createElement('div');
            backdrop.id = 'lcards-release-backdrop';
            backdrop.style.cssText = 'position:fixed;inset:0;z-index:9999;overflow:auto;display:flex;align-items:center;justify-content:center;'
                + 'background:var(--primary-background-color)';
            let el;
            if (asEditor) {
                el = await customElements.get(tag).getConfigElement();
                el.id = 'lcards-release-editor';
                el.style.cssText = 'align-self:stretch;width:100%;padding:16px';
            } else {
                el = document.createElement(tag);
            }
            el.setConfig(config);
            el.hass = ha.hass;
            setInterval(() => { if (el.hass !== ha.hass) el.hass = ha.hass; }, 100);
            if (asEditor) {
                backdrop.appendChild(el);
            } else {
                // Cards size to their parent: give them a sized box (the crop target).
                const box = document.createElement('div');
                box.id = 'lcards-release-card';
                box.style.cssText = `flex:none;width:${size[0]}px;${size[1] ? `height:${size[1]}px;` : ''}`;
                box.appendChild(el);
                backdrop.appendChild(box);
            }
            ha.shadowRoot.appendChild(backdrop);
            await el.updateComplete;
            if (open) await el[open]();
        }, { config: shot.card, editor: !!shot.editor, open: shot.open ?? null, size: shot.size ?? [600, 0] });
    }
    await page.waitForTimeout(shot.settle ?? 2000);
}

const client = await HAClient.connect(token);
await ensureHelpers(client);
const browser = await chromium.launch({
    headless: !headed,
    executablePath: process.env.CHROMIUM_PATH ?? (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
});

let failed = 0;
for (const shot of shots) {
    const viewport = shot.viewport ?? [1400, 900];
    const video = shot.kind === 'video';
    const context = await browser.newContext({
        baseURL: HA_URL,
        viewport: { width: viewport[0], height: viewport[1] },
        deviceScaleFactor: video ? 1 : (shot.scale ?? 2),
        serviceWorkers: 'block',
    });
    await context.addInitScript(({ token, hassUrl }) => {
        localStorage.setItem('hassTokens', JSON.stringify({
            access_token: token, token_type: 'Bearer', expires_in: 1e9, hassUrl,
            clientId: `${hassUrl}/`, expires: Date.now() + 1e12, refresh_token: '',
        }));
    }, { token, hassUrl: HA_URL });
    const page = await context.newPage();
    try {
        await openShot(page, shot);
        await runSteps(page, client, shot.steps);
        const clip = await cropBox(page, shot, viewport);
        if (!video) {
            const png = join(tmpdir(), `lcards-shot-${process.pid}-${shot.name}.png`);
            await page.screenshot({ path: png, clip });
            execFileSync('magick', [png, '-resize', '1600x>', '-quality', '85', join(outDir, `${shot.name}.webp`)]);
            rmSync(png, { force: true });
            console.log(`${shot.name}.webp  ${clip.width}x${clip.height}`);
        } else {
            const frames = await recordScreencast(page, clip, async () => {
                await runSteps(page, client, shot.video_steps);
                await page.waitForTimeout(shot.duration ?? 4000);
            });
            const webm = join(outDir, `${shot.name}.webm`);
            encodeFrames(frames, webm, clip);
            if (wantGif) webmToGif(webm, join(outDir, `${shot.name}.gif`));
            console.log(`${shot.name}.webm${wantGif ? ' + .gif' : ''}  ${clip.width}x${clip.height}, ${frames.length} frames`);
        }
    } catch (err) {
        failed++;
        console.error(`${shot.name}: ${err.message.split('\n')[0]}`);
        const fail = join(tmpdir(), `lcards-shot-failed-${shot.name}.png`);
        await page.screenshot({ path: fail }).catch(() => {});
        console.error(`  page at failure: ${fail}`);
    } finally {
        await context.close().catch(() => {});
    }
}
await browser.close();
client.close();
console.log(`\n${shots.length - failed}/${shots.length} shot(s) in ${outDir.replace(ROOT + "/", "")}/. Check each for personal names before committing.`);
process.exit(failed ? 1 : 0);
