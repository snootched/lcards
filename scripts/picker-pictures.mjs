#!/usr/bin/env node
/**
 * picker-pictures.mjs - render the pictures Home Assistant's card picker shows for
 * the LCARdS cards that can't draw a live preview there (a WebGL scene, a blueprint
 * with routed lines, a grid of child cards, a full-screen overlay, a chart with no
 * history in the picker).
 *
 *   npm run picker:pictures [name ...] [-- --headed]
 *
 * A card is mounted on the browser harness (tests/browser/serve.mjs, the built
 * bundle and its sample states and history: run `npm run build` first) in a
 * 480 x 270 box at 1.6x, with a pinned date and seed, and screenshotted. The alert
 * overlay is drawn on the Alert Studio's mock screen (lcards-alert-preview), as the
 * docs show it. Astrometrics renders a Studio starter (the same config as
 * scripts/astro-pictures.mjs) in the picture theme (scripts/data/picture-theme.json); the MSD, the layout card and the chart use existing
 * pictures (dashboard gallery screens, the chart page's picture), cropped or padded
 * to 16:9. The select menu is rendered in an HA-LCARS theme (its variables from the
 * committed snapshot). Output: src/assets/images/picker/<name>.webp (768 x
 * 432; the build copies it to custom_components/lcards/images/, served at
 * /lcards/images/picker/; written there too so no rebuild is needed). The cards show
 * them through src/utils/picker-picture.js; tests/core/picker-pictures.test.js fails
 * when one is missing.
 */
import { mkdirSync, writeFileSync, existsSync, copyFileSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
import { PICKER_PICTURES } from '../src/utils/picker-picture-names.js';
import { pictureConfig, starterById, loadPictureTheme, applyThemeVars, waitForSceneSettled } from './lib/picture-render.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src/assets/images/picker');
const SERVED = join(ROOT, 'custom_components/lcards/images/picker');
const PORT = 4881;
const WIDTH = 480, HEIGHT = 270, SCALE = 1.6;
const NOW = Date.UTC(2026, 10, 21, 15, 0, 0);
const GPU_FLAGS = ['--ignore-gpu-blocklist', '--enable-gpu', '--use-angle=vulkan', '--enable-features=Vulkan'];

const args = process.argv.slice(2);
const headed = args.includes('--headed');
const only = args.filter((a) => !a.startsWith('--'));

const lozenge = (entity, content) => ({
    type: 'custom:lcards-button', preset: 'lozenge', entity,
    text: { name: { content, show: true, font_size: 30 } },
});

/** How each picture is made: a card config, the alert preview, an existing picture
 * (cropped to 16:9 in the middle and scaled), or a copy of a Studio starter picture. */
const SOURCES = {
    // a Studio starter, rendered here at full size in the picture theme: Earth with its
    // real satellites in orbit
    astrometrics: { starter: 'earth_orbit', pictureTheme: true },
    // the "display" half of the Picard display gallery screen: the ship profile with its callouts
    msd: { image: 'doc/public/gallery/picard-display.webp', crop: { x: 0, y: 0, w: 1600, h: 660 }, fit: 'contain' },
    // a gallery screen built from layouts: the Bridge
    'layout-card': { image: 'doc/public/gallery/bridge.webp' },
    // the chart page's own picture: a temperature area, a smoothed line and a comfort threshold
    chart: { image: 'doc/public/img/cards/chart.webp', fit: 'contain' },
    // red alert on the Alert Studio's mock screen
    'alert-overlay': {
        alert: { config: { type: 'custom:lcards-alert-overlay' }, condition: 'red_alert' },
        settle: 2500,
    },
    // a mode selector in the LCARS TNG theme (the Bridge gallery screen's), its own colours
    'select-menu': {
        config: {
            type: 'custom:lcards-select-menu',
            entity: 'input_select.demo_mode',
            preset: 'lozenge',
            grid: { columns: 2, gap: '10px', height: '100%' },
            style: { text: { default: { font_size: 22, letter_spacing: '0.08em', text_transform: 'uppercase' } } },
        },
        theme: 'LCARS TNG',
        settle: 2500,
        pad: 16,
    },
};

/**
 * An HA-LCARS theme's CSS variables as plain values, from the committed snapshot
 * (scripts/data/ha-lcars/snapshot.json: the palette, the dark mode defaults, the theme).
 * @param {string} name
 * @returns {Record<string, string>} variable name (no --) -> value
 */
function themeVars(name) {
    const snap = JSON.parse(readFileSync(join(ROOT, 'scripts/data/ha-lcars/snapshot.json'), 'utf8'));
    const theme = snap.themes.find((t) => t.name === name);
    if (!theme) throw new Error(`no HA-LCARS theme ${name} in the snapshot`);
    const defs = {
        ...Object.fromEntries(snap.palette.map((c) => [c.name, c.value])),
        ...(snap.mode_defaults?.dark ?? {}),
        ...theme.vars,
    };
    const resolve = (value, depth = 0) => String(value).replace(/var\(--([a-z0-9-]+)(?:,\s*([^)]+))?\)/g, (m, ref, fallback) => {
        if (depth > 10) return m;
        if (ref in defs) return resolve(defs[ref], depth + 1);
        return fallback ? resolve(fallback, depth + 1) : m;
    });
    return Object.fromEntries(Object.entries(defs).map(([k, v]) => [k, resolve(v)]));
}


async function waitForServer(url) {
    for (let i = 0; i < 50; i++) {
        try { if ((await fetch(url)).ok) return; } catch { /* not up yet */ }
        await new Promise((r) => setTimeout(r, 100));
    }
    throw new Error(`server did not start at ${url}`);
}

/** Mount one card (or the alert preview) in a sized box below the empty harness mount. */
async function render(page, source) {
    return page.evaluate(async ({ source, w, h }) => {
        const box = document.createElement('div');
        box.id = 'picture';
        box.style.cssText = `width:${w}px;height:${h}px;overflow:hidden;background:#000;position:relative;box-sizing:border-box;padding:${source.pad ?? 0}px`;
        // a theme's variables on the box, as Home Assistant themes a view
        for (const [name, value] of Object.entries(source.vars ?? {})) box.style.setProperty(`--${name}`, value);
        if (source.alert) {
            await window.lcards.loadAlertPreview();
            await customElements.whenDefined('lcards-alert-preview');
            const preview = /** @type {any} */ (document.createElement('lcards-alert-preview'));
            preview.hass = window.__hass;
            preview.config = source.alert.config;
            preview.condition = source.alert.condition;
            preview.screenSize = { width: 1920, height: 1080 };
            preview.style.cssText = 'display:block;width:100%;height:100%';
            box.appendChild(preview);
            document.getElementById('mount').after(box);
            return;
        }
        const card = await window.__mountExtra(source.config);
        const holder = card.parentElement;
        holder.replaceWith(box);
        box.appendChild(card);
        card.style.height = '100%';
    }, { source, w: WIDTH, h: HEIGHT });
}

async function main() {
    if (!existsSync(join(ROOT, 'custom_components/lcards/lcards.js'))) throw new Error('no bundle: run npm run build first');
    mkdirSync(OUT, { recursive: true });
    mkdirSync(SERVED, { recursive: true });
    const names = PICKER_PICTURES.filter((n) => !only.length || only.includes(n));
    const server = spawn(process.execPath, [join(ROOT, 'tests/browser/serve.mjs'), String(PORT)], { stdio: 'ignore' });
    const base = `http://127.0.0.1:${PORT}`;
    try {
        await waitForServer(`${base}/harness.html`);
        const browser = await chromium.launch({
            headless: !headed,
            executablePath: existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined,
            args: GPU_FLAGS,
        });
        const page = await browser.newPage({ viewport: { width: WIDTH + 40, height: HEIGHT + 80 }, deviceScaleFactor: SCALE });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        for (const name of names) {
            const source = /** @type {any} */ (SOURCES)[name];
            if (!source) throw new Error(`no source for picker picture ${name}`);
            if (source.image) {
                const data = readFileSync(join(ROOT, source.image)).toString('base64');
                const webp = await page.evaluate(async ({ data, w, h, crop, fit }) => {
                    const img = new Image();
                    img.src = `data:image/webp;base64,${data}`;
                    await img.decode();
                    // the part of the picture to use (all of it by default)
                    const area = crop ?? { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
                    const canvas = document.createElement('canvas');
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingQuality = 'high';
                    ctx.fillStyle = '#000';
                    ctx.fillRect(0, 0, w, h);
                    if (fit === 'contain') {
                        // all of it, on black bars
                        const scale = Math.min(w / area.w, h / area.h);
                        const dw = area.w * scale, dh = area.h * scale;
                        ctx.drawImage(img, area.x, area.y, area.w, area.h, (w - dw) / 2, (h - dh) / 2, dw, dh);
                    } else {
                        // the middle 16:9 of it
                        const ratio = w / h;
                        let sw = area.w, sh = area.h;
                        if (sw / sh > ratio) sw = Math.round(sh * ratio); else sh = Math.round(sw / ratio);
                        ctx.drawImage(img, area.x + Math.round((area.w - sw) / 2), area.y + Math.round((area.h - sh) / 2), sw, sh, 0, 0, w, h);
                    }
                    return canvas.toDataURL('image/webp', 0.85).split(',')[1];
                }, { data, w: Math.round(WIDTH * SCALE), h: Math.round(HEIGHT * SCALE), crop: source.crop ?? null, fit: source.fit ?? 'cover' });

                writeFileSync(join(OUT, `${name}.webp`), Buffer.from(webp, 'base64'));
                writeFileSync(join(SERVED, `${name}.webp`), Buffer.from(webp, 'base64'));
                console.log(`${name}: ${Math.round(Buffer.from(webp, 'base64').length / 1024)} KB, from ${source.image}`);
                continue;
            }
            if (source.copy) {
                copyFileSync(join(ROOT, source.copy), join(OUT, `${name}.webp`));
                copyFileSync(join(ROOT, source.copy), join(SERVED, `${name}.webp`));
                console.log(`${name}: copied ${source.copy}`);
                continue;
            }
            const query = new URLSearchParams({ seed: '7', freeze: '1', ...(source.liveClock ? {} : { now: String(NOW) }) });
            await page.goto(`${base}/harness.html?${query}`);
            await page.waitForFunction(() => window.__ready === true, null, { timeout: 20_000 });
            if (source.theme) source.vars = themeVars(source.theme);
            if (source.starter) source.config = pictureConfig(starterById(source.starter));
            // the picture theme (scripts/data/picture-theme.json) on the page, as Home Assistant applies a theme
            if (source.pictureTheme) {
                const theme = loadPictureTheme();
                if (theme) await applyThemeVars(page, theme.vars);
            }
            if (source.states) await page.evaluate((states) => { for (const [id, s] of Object.entries(states)) window.__setState(id, s); }, source.states);
            await render(page, source);
            if (source.starter) await waitForSceneSettled(page, '#picture > *');
            else await page.waitForTimeout(source.settle ?? 2500);
            const png = await page.locator('#picture').screenshot();
            const webp = await page.evaluate(async ({ b64, w, h }) => {
                const img = new Image();
                img.src = `data:image/png;base64,${b64}`;
                await img.decode();
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                return canvas.toDataURL('image/webp', 0.82).split(',')[1];
            }, { b64: png.toString('base64'), w: Math.round(WIDTH * SCALE), h: Math.round(HEIGHT * SCALE) });
            writeFileSync(join(OUT, `${name}.webp`), Buffer.from(webp, 'base64'));
            writeFileSync(join(SERVED, `${name}.webp`), Buffer.from(webp, 'base64'));
            const errors = (await page.evaluate(() => window.__errors)).filter((e) => !/favicon|SoundManager/.test(e));
            console.log(`${name}: ${Math.round(Buffer.from(webp, 'base64').length / 1024)} KB${errors.length ? `  errors: ${errors.join(' | ')}` : ''}`);
        }
        await browser.close();
    } finally {
        server.kill();
    }
}

main().catch((e) => { console.error(e); process.exit(1); });
