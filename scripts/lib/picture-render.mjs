/**
 * Shared by the picture scripts (scripts/astro-pictures.mjs, scripts/picker-pictures.mjs):
 * the card config of an Astrometrics Studio starter or sample, the theme the pictures
 * are rendered in (scripts/data/picture-theme.json, `npm run pictures:theme`), and a
 * wait for an astrometrics scene to stop drawing.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STARTERS, applyStarter } from '../../src/core/astrometrics/starters/index.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const ASTRO_TYPE = 'custom:lcards-astrometrics-card';

const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
export const starterById = (id) => STARTERS.find((s) => s.id === id);

/** Every [x, y, z] coordinate and size-like number in a fragment */
function extentOf(frag) {
    const coords = [];
    let size = 0;
    const walk = (v, key) => {
        if (Array.isArray(v)) {
            if (v.length === 3 && v.every((n) => typeof n === 'number') && ['xyz', 'at'].includes(key)) coords.push(v);
            else v.forEach((x) => walk(x, key));
        } else if (isObj(v)) {
            for (const [k, x] of Object.entries(v)) {
                // a radius may be [inner, outer]
                const n = Array.isArray(x) && x.every((v) => typeof v === 'number') ? Math.max(...x) : x;
                if (typeof n === 'number' && ['radius', 'orbit', 'size', 'outer_radius'].includes(k)) size = Math.max(size, n);
                walk(x, k);
            }
        }
    };
    walk(frag.points, null);
    walk(frag.objects, null);
    if (!coords.length) coords.push([0, 0, 0]);
    const lo = [0, 1, 2].map((i) => Math.min(...coords.map((c) => c[i])));
    const hi = [0, 1, 2].map((i) => Math.max(...coords.map((c) => c[i])));
    const centre = lo.map((l, i) => (l + hi[i]) / 2);
    const span = Math.max(...hi.map((h, i) => h - lo[i]), size * 2, 1);
    return { centre, span };
}

/**
 * The card config a starter's picture is taken of. A scene shows its own start view;
 * a part has no camera or backdrop of its own: it gets stars and a view framed round
 * its coordinates, or the scene it is made for (`scene`) and the starter's `picture`
 * (camera, backdrop) when that frames it better.
 * @param {any} starter
 */
export function pictureConfig(starter) {
    const pic = starter.picture ?? {};
    let base = { type: ASTRO_TYPE, height: '100%' };
    if (starter.scene) {
        const host = applyStarter(base, starterById(starter.scene));
        if (!host.config) throw new Error(`${starter.id}: scene ${starter.scene}: ${host.error}`);
        base = host.config;
    }
    const out = applyStarter(base, starter);
    if (!out.config) throw new Error(`${starter.id}: ${out.error}`);
    const config = { ...out.config, height: '100%' };
    if (starter.kind === 'part' && !starter.scene) {
        const { centre, span } = extentOf(out.added);
        const view = { target: centre.map((n) => Math.round(n * 100) / 100), yaw: 25, tilt: 30, distance: Math.round(span * 1.3) };
        config.camera = { ...(config.camera ?? {}), view: 'picture', views: { ...(config.camera?.views ?? {}), picture: { ...view, ...(pic.camera ?? {}) } } };
        config.backdrop = { stars: true, ...(config.backdrop ?? {}), ...(pic.backdrop ?? {}) };
    } else if (pic.camera) {
        config.camera = { ...(config.camera ?? {}), view: 'picture', views: { ...(config.camera?.views ?? {}), picture: pic.camera } };
    }
    // no on-card buttons in a picture
    config.camera = { ...(config.camera ?? {}), buttons: false };
    return config;
}

/**
 * The card config of an object or shape sample: stars behind, its own view.
 * @param {import('../../src/core/astrometrics/object-samples.js').ObjectSample} sample
 */
export function sampleConfig(sample) {
    return {
        type: ASTRO_TYPE, height: '100%',
        ...(sample.points ? { points: sample.points } : {}),
        objects: sample.objects,
        backdrop: { stars: true },
        camera: { view: 'picture', views: { picture: sample.camera }, buttons: false },
    };
}

/**
 * The theme the pictures are rendered in: its colour variables (name without --),
 * or null when none was captured.
 * @returns {{ name: string, vars: Record<string, string> } | null}
 */
export function loadPictureTheme() {
    const file = join(ROOT, 'scripts/data/picture-theme.json');
    if (!existsSync(file)) return null;
    const data = JSON.parse(readFileSync(file, 'utf8'));
    return { name: data.name, vars: data.vars ?? {} };
}

/**
 * Put the picture theme's variables on the harness page's root, as Home Assistant
 * applies a theme (before the card resolves its colours).
 * @param {import('@playwright/test').Page} page
 * @param {Record<string, string>} vars
 */
export async function applyThemeVars(page, vars) {
    await page.evaluate((vars) => {
        for (const [name, value] of Object.entries(vars)) document.documentElement.style.setProperty(`--${name}`, value);
    }, vars);
}

/**
 * Wait until an astrometrics scene is built and stops drawing (it draws on demand),
 * then a moment for models and maps that load after the first frames.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector - the card, e.g. '#mount > *'
 */
export async function waitForSceneSettled(page, selector) {
    const frames = () => page.evaluate((sel) => /** @type {any} */ (document.querySelector(sel))?._scene?.debug().frames ?? 0, selector);
    const t0 = Date.now();
    let last = -1, still = 0;
    while (Date.now() - t0 < 30_000) {
        await page.waitForTimeout(400);
        const f = await frames();
        still = f > 0 && f === last ? still + 1 : 0;
        last = f;
        if (still >= 2) break;
    }
    await page.waitForTimeout(1500);
}
