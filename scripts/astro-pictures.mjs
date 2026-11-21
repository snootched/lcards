#!/usr/bin/env node
/**
 * astro-pictures.mjs - render the Astrometrics Studio's pictures: starters,
 * object types (the add-object gallery) and shapes (the shape picker).
 *
 *   npm run astro:pictures [name ...] [-- --headed]
 *
 * A name picks pictures by file name: `planet`, `type-grid`, `shape-volume`
 * (every volume shape), `type` (every type).
 *
 * Each starter (src/core/astrometrics/starters/) is put into an empty card
 * with its default params and rendered on the browser harness
 * (tests/browser/serve.mjs, the built bundle: run `npm run build` first),
 * with a pinned date and seed and reduced motion, so a re-run gives the same
 * picture. Output: src/assets/images/astro-studio/starter-<id>.webp (480x270;
 * the build copies it to custom_components/lcards/images/, served at
 * /lcards/images/astro-studio/; written there too so no rebuild is needed). The Studio's Starters
 * gallery shows them; tests/editor/astro-starter-pictures.test.js fails when
 * one is missing. Types and shapes come from src/core/astrometrics/object-samples.js
 * (shape-<type>-<shape>.webp, smaller: 320x180).
 *
 * A scene shows its own start view. A part has no camera or backdrop of its
 * own: it gets stars and a view framed round its coordinates, or the
 * scene it is made for (`scene`) and the starter's `picture` (camera, backdrop) when that frames it better.
 * Uses the real GPU when there is one (flags from the docs Playwright config).
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
import { STARTERS, applyStarter } from '../src/core/astrometrics/starters/index.js';
import { TYPE_SAMPLES, SHAPE_SAMPLES } from '../src/core/astrometrics/object-samples.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src/assets/images/astro-studio');
const SERVED = join(ROOT, 'custom_components/lcards/images/astro-studio');
const PORT = 4879;
const WIDTH = 960, HEIGHT = 540;
const NOW = Date.UTC(2026, 9, 31, 12, 0, 0);
const TYPE = 'custom:lcards-astrometrics-card';
const GPU_FLAGS = ['--ignore-gpu-blocklist', '--enable-gpu', '--use-angle=vulkan', '--enable-features=Vulkan'];

const args = process.argv.slice(2);
const headed = args.includes('--headed');
const only = args.filter((a) => !a.startsWith('--'));

const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const byId = (id) => STARTERS.find((s) => s.id === id);

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
 * The card config of an object or shape sample: stars behind, its own view.
 * @param {import('../src/core/astrometrics/object-samples.js').ObjectSample} sample
 */
export function sampleConfig(sample) {
  return {
    type: TYPE, height: '100%',
    ...(sample.points ? { points: sample.points } : {}),
    objects: sample.objects,
    backdrop: { stars: true },
    camera: { view: 'picture', views: { picture: sample.camera }, buttons: false }
  };
}

/** Every picture: file stem, card config, output size */
function pictures() {
  const list = STARTERS.map((st) => ({ name: `starter-${st.id}`, id: st.id, config: () => pictureConfig(st), w: 480, h: 270 }));
  for (const [type, sample] of Object.entries(TYPE_SAMPLES)) list.push({ name: `type-${type}`, id: '', config: () => sampleConfig(sample), w: 480, h: 270, motion: !!sample.motion });
  for (const [type, shapes] of Object.entries(SHAPE_SAMPLES)) {
    for (const [shape, sample] of Object.entries(shapes)) list.push({ name: `shape-${type}-${shape}`, id: '', config: () => sampleConfig(sample), w: 320, h: 180 });
  }
  // a starter by its id, anything by its file name or the start of it
  return list.filter((p) => !only.length || only.some((n) => n === p.id || p.name === n || p.name.startsWith(`${n}-`)));
}

/** The card config a starter's picture is taken of */
export function pictureConfig(starter) {
  const pic = starter.picture ?? {};
  let base = { type: TYPE, height: '100%' };
  if (starter.scene) {
    const host = applyStarter(base, byId(starter.scene));
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

async function waitForServer(url) {
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(url)).ok) return; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`server did not start at ${url}`);
}

async function main() {
  if (!existsSync(join(ROOT, 'custom_components/lcards/lcards.js'))) throw new Error('no bundle: run npm run build first');
  mkdirSync(OUT, { recursive: true });
  mkdirSync(SERVED, { recursive: true });
  const server = spawn(process.execPath, [join(ROOT, 'tests/browser/serve.mjs'), String(PORT)], { stdio: 'ignore' });
  const base = `http://127.0.0.1:${PORT}`;
  try {
    await waitForServer(`${base}/harness.html`);
    const browser = await chromium.launch({
      headless: !headed,
      executablePath: existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined,
      args: GPU_FLAGS
    });
    const page = await browser.newPage({ viewport: { width: WIDTH + 40, height: HEIGHT + 40 } });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const pic of pictures()) {
      const config = pic.config();
      const query = new URLSearchParams({ case: 'astro-galaxy', width: String(WIDTH), height: String(HEIGHT), now: String(NOW), seed: '7', freeze: '1' });
      await page.goto(`${base}/harness.html?${query}`);
      await page.waitForFunction(() => window.__ready !== false, null, { timeout: 20_000 });
      // a picture of motion (a trail) runs for a few seconds; the rest are still
      await page.emulateMedia({ reducedMotion: pic.motion ? 'no-preference' : 'reduce' });
      await page.evaluate((c) => window.__reconfigure(c), config);
      // the scene draws on demand: wait until it is built, then until it stops drawing
      const frames = () => page.evaluate(() => document.querySelector('#mount > *')?._scene?.debug().frames ?? 0);
      const t0 = Date.now();
      let last = -1, still = 0;
      if (pic.motion) await page.waitForTimeout(5000);
      while (!pic.motion && Date.now() - t0 < 30_000) {
        await page.waitForTimeout(400);
        const f = await frames();
        still = f > 0 && f === last ? still + 1 : 0;
        last = f;
        if (still >= 2) break;
      }
      // models and maps load after the first frames
      await page.waitForTimeout(1500);
      const png = await page.locator('#mount').screenshot();
      const webp = await page.evaluate(async ({ b64, w, h }) => {
        const img = new Image();
        img.src = `data:image/png;base64,${b64}`;
        await img.decode();
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        return canvas.toDataURL('image/webp', 0.8).split(',')[1];
      }, { b64: png.toString('base64'), w: pic.w, h: pic.h });
      const file = join(OUT, `${pic.name}.webp`);
      writeFileSync(file, Buffer.from(webp, 'base64'));
      writeFileSync(join(SERVED, `${pic.name}.webp`), Buffer.from(webp, 'base64'));
      const errors = (await page.evaluate(() => window.__errors)).filter((e) => !/favicon|SoundManager/.test(e));
      console.log(`${pic.name}: ${Math.round(Buffer.from(webp, 'base64').length / 1024)} KB${errors.length ? `  errors: ${errors.join(' | ')}` : ''}`);
    }
    await browser.close();
  } finally {
    server.kill();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
