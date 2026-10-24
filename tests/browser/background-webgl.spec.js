/**
 * three.js background tier (C2): warp-starfield and the grid render through
 * the page's one shared WebGL context into the card's Canvas2D canvas,
 * animate through the EffectHandle, keep their scene across an alert change,
 * hold a frame under reduced motion, release the context, and fall back to
 * Canvas2D without WebGL or after a context loss.
 * C3: the WebGL noise fields (contour-field, plasma, fluid) draw the same
 * pixels as their Canvas2D versions, fall back to them, and recolour in place.
 * Headless Chromium has WebGL2 through SwiftShader.
 */
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { mountCase, cardErrors } from './support.js';

/**
 * No card errors, except the frame-budget guard: SwiftShader renders WebGL on
 * the CPU, and in a parallel run a frame can pass the 500 ms hard limit, which
 * pauses the loop as designed. That is the machine's load, not a fault here.
 * @param {import('@playwright/test').Page} page
 */
const expectNoErrors = async (page) => {
    expect((await cardErrors(page)).filter((e) => !/Frame took \d+ms/.test(e))).toEqual([]);
};

/** What each background entry is drawn with, and whether its scene is up */
const entries = (page) => page.evaluate(() => {
    const bg = /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer;
    return bg.renderer.effects.map((e) => ({ type: e.constructor.name, ready: e._scene ? true : e._scene === null ? false : undefined }));
});

/** Pixels on the background canvas that are not fully transparent */
const litPixels = (page) => page.evaluate(() => {
    const canvas = /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer.canvas;
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let lit = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) lit++;
    return lit;
});

const effectField = (page, field) => page.evaluate((f) =>
    /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer.getHandles(0)[0]?.effects[0]?.[f], field);

const webglStats = (page) => page.evaluate(() => window.lcards.debug.webgl.stats());

test('warp-starfield loads its scene on the shared context and draws into the card canvas', async ({ page }) => {
    await mountCase(page, 'button-warp-starfield');
    await expect.poll(() => entries(page), { timeout: 10_000 }).toEqual([{ type: 'WarpStarfieldEffect', ready: true }]);
    await expect.poll(() => litPixels(page)).toBeGreaterThan(20);
    expect(await webglStats(page)).toMatchObject({ users: 1, context: true, created: 1 });
    await expectNoErrors(page);
});

test('warp-starfield camera_yaw: the stars stream from a point to the left when the camera turns right', async ({ page }) => {
    await mountCase(page, 'button-warp-starfield', { width: '600' });
    await expect.poll(() => entries(page), { timeout: 10_000 }).toEqual([{ type: 'WarpStarfieldEffect', ready: true }]);
    /** Horizontal centroid of the lit pixels, 0 (left) to 1 (right), averaged over a few frames */
    const centroid = async () => {
        let sum = 0;
        for (let k = 0; k < 4; k++) {
            sum += await page.evaluate(() => {
                const c = /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer.canvas;
                const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
                let sx = 0, n = 0;
                for (let i = 3; i < d.length; i += 4) if (d[i] > 20) { sx += ((i - 3) / 4) % c.width; n++; }
                return n ? sx / n / c.width : 0.5;
            });
            await page.waitForTimeout(120);
        }
        return sum / 4;
    };
    const straight = await centroid();
    await page.evaluate(() => {
        const h = /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer.getHandles(0)[0];
        h.setProp('camera_yaw', 35);
    });
    await page.waitForTimeout(300);
    const turned = await centroid();
    expect(turned, 'stars shift left').toBeLessThan(straight - 0.05);
    await expectNoErrors(page);
});

test('target: background ramps warp speed through the handle', async ({ page }) => {
    await mountCase(page, 'button-warp-starfield');
    await expect.poll(() => entries(page), { timeout: 10_000 }).toEqual([{ type: 'WarpStarfieldEffect', ready: true }]);
    expect(await effectField(page, 'speed')).toBe(1);
    await page.evaluate(() => window.__setState('input_select.demo_mode', 'Heat'));
    await expect.poll(() => effectField(page, 'speed'), { timeout: 1500 }).toBeGreaterThan(1.5);
    expect(await effectField(page, 'speed'), 'mid-ramp').toBeLessThan(8);
    await expect.poll(() => effectField(page, 'speed'), { timeout: 3000 }).toBe(8);
    await expectNoErrors(page);
});

test('an alert change recolours the scene in place: same effect, same scene, same context (F1)', async ({ page }) => {
    await mountCase(page, 'button-warp-starfield');
    await expect.poll(() => entries(page), { timeout: 10_000 }).toEqual([{ type: 'WarpStarfieldEffect', ready: true }]);
    const before = await page.evaluateHandle(() => {
        const e = /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer.getHandles(0)[0].effects[0];
        return { effect: e, scene: e._scene };
    });
    await page.evaluate(() => window.lcards.core.themeManager.setAlertMode('red_alert'));
    await page.waitForTimeout(500);
    expect(await page.evaluate((old) => {
        const e = /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer.getHandles(0)[0].effects[0];
        return { effect: e === old.effect, scene: e._scene === old.scene };
    }, before)).toEqual({ effect: true, scene: true });
    expect(await webglStats(page)).toMatchObject({ users: 1, created: 1 });
    await page.evaluate(() => window.lcards.core.themeManager.setAlertMode('green_alert'));
    await expectNoErrors(page);
});

test('a warp ramp started just before the alert re-render runs to the end (to_state / from_state on the alert entity)', async ({ page }) => {
    // What lcards.red_alert does: the alert helper changes, then the palette.
    // The re-render used to replay check_on_load (restarting the ramp and firing
    // the from_state ramp-down, which cancelled it), so warp lasted a moment.
    await mountCase(page, 'elbow-warp-alert', { height: '300' });
    await expect.poll(() => entries(page), { timeout: 10_000 }).toEqual([{ type: 'WarpStarfieldEffect', ready: true }]);
    await page.evaluate(() => window.__setState('input_select.lcards_alert_mode', 'green_alert'));
    await page.waitForTimeout(300);
    await page.evaluate(() => window.__setState('input_select.lcards_alert_mode', 'red_alert'));
    await page.waitForTimeout(100);
    await page.evaluate(() => window.lcards.core.themeManager.setAlertMode('red_alert'));
    await expect.poll(() => effectField(page, 'speed'), { timeout: 4000 }).toBe(8);
    await page.waitForTimeout(1000);
    expect(await effectField(page, 'speed'), 'still at warp').toBe(8);
    await page.evaluate(() => window.__setState('input_select.lcards_alert_mode', 'green_alert'));
    await expect.poll(() => effectField(page, 'speed'), { timeout: 5000 }).toBe(1);
    await page.evaluate(() => window.lcards.core.themeManager.setAlertMode('green_alert'));
});

test('a mixed stack keeps entry order and shares one context between two scenes', async ({ page }) => {
    await mountCase(page, 'button-webgl-stack');
    await expect.poll(() => entries(page), { timeout: 10_000 }).toEqual([
        { type: 'GridGLEffect', ready: true },
        { type: 'SolidEffect', ready: undefined },
        { type: 'WarpStarfieldEffect', ready: true }
    ]);
    expect(await webglStats(page)).toMatchObject({ users: 2, context: true, created: 1 });
    await expectNoErrors(page);
});

test('10 remove/re-add cycles (view switches): the context is given back each time, never two alive', async ({ page }) => {
    await mountCase(page, 'button-warp-starfield');
    await expect.poll(() => entries(page), { timeout: 10_000 }).toEqual([{ type: 'WarpStarfieldEffect', ready: true }]);
    for (let i = 0; i < 10; i++) {
        await page.evaluate(() => { window.__parked = document.querySelector('#mount > *'); window.__parked.remove(); });
        await expect.poll(() => webglStats(page)).toMatchObject({ users: 0, context: false });
        await page.evaluate(() => document.querySelector('#mount').appendChild(window.__parked));
        await expect.poll(() => entries(page), { timeout: 10_000 }).toEqual([{ type: 'WarpStarfieldEffect', ready: true }]);
        expect(await webglStats(page)).toMatchObject({ users: 1, context: true });
    }
    expect((await webglStats(page)).created).toBe(11);
    // Lifecycle, not frame time (see expectNoErrors)
    await expectNoErrors(page);
});

test('a lost context swaps the entry for its Canvas2D fallback', async ({ page }) => {
    await mountCase(page, 'button-warp-starfield');
    await expect.poll(() => entries(page), { timeout: 10_000 }).toEqual([{ type: 'WarpStarfieldEffect', ready: true }]);
    await page.evaluate(() => window.lcards.debug.webgl.loseContext());
    await expect.poll(() => entries(page)).toEqual([{ type: 'StarfieldEffect', ready: undefined }]);
    // The handle still drives it: the warp animation lands on the fallback
    await page.evaluate(() => window.__setState('input_select.demo_mode', 'Heat'));
    await expect.poll(() => effectField(page, 'speed'), { timeout: 3000 }).toBe(8);
});

/** RGBA bytes of the background canvas */
const canvasBytes = (page) => page.evaluate(() => {
    const c = /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer.canvas;
    return Array.from(c.getContext('2d').getImageData(0, 0, c.width, c.height).data);
});

/** Grid floor view, mean alpha of the band under the horizon: 0.42 without the crowd fade, 0.19 with it (2026-10-24) */
const MAX_ROW = 0.3;

const FIELDS = [
    ['contour-field', 'ContourFieldGLEffect', 'ContourFieldEffect'],
    ['plasma', 'PlasmaGLEffect', 'PlasmaTextureEffect'],
    ['fluid', 'FluidGLEffect', 'FluidTextureEffect']
];

for (const [preset, glType, canvasType] of FIELDS) {
    test(`${preset}: WebGL draws the same field as the Canvas2D version (renderer: canvas)`, async ({ page }) => {
        const name = `button-webgl-${preset}`;
        const config = /** @type {any} */ (yaml.load(readFileSync(new URL(`fixtures/${name}.yaml`, import.meta.url), 'utf8')));
        await mountCase(page, name);
        await expect.poll(() => entries(page), { timeout: 10_000 }).toEqual([{ type: glType, ready: true }]);
        await page.waitForTimeout(200);
        const gl = await canvasBytes(page);
        const background_animation = config.background_animation.map((e) => ({ ...e, renderer: 'canvas' }));
        await page.evaluate((c) => window.__reconfigure(c), { ...config, background_animation });
        await expect.poll(() => entries(page)).toEqual([{ type: canvasType, ready: undefined }]);
        await page.waitForTimeout(300);
        const c2d = await canvasBytes(page);
        expect(c2d.length).toBe(gl.length);
        let diff = 0;
        for (let i = 0; i < gl.length; i++) diff += Math.abs(gl[i] - c2d[i]);
        // Measured 2026-10-23: 0.24 to 0.27 (rounding, sub-pixel blit)
        expect(diff / gl.length, 'mean byte difference').toBeLessThan(1.5);
        expect(gl.some((v, i) => i % 4 === 3 && v > 0), 'drew something').toBe(true);
        await expectNoErrors(page);
    });
}

test('holo-sphere: WebGL and Canvas2D draw the same sphere (lit area and colour)', async ({ page }) => {
    const name = 'button-webgl-holo-sphere';
    const config = /** @type {any} */ (yaml.load(readFileSync(new URL(`fixtures/${name}.yaml`, import.meta.url), 'utf8')));
    await mountCase(page, name);
    await expect.poll(() => entries(page), { timeout: 10_000 }).toEqual([{ type: 'HoloSphereGLEffect', ready: true }]);
    await page.waitForTimeout(200);
    const summary = (bytes) => {
        let lit = 0, alpha = 0, sx = 0, sy = 0;
        const w = bytes.length / 4 / 160;
        for (let i = 0; i < bytes.length; i += 4) {
            if (bytes[i + 3] < 8) continue;
            lit++; alpha += bytes[i + 3];
            sx += (i / 4) % w; sy += Math.floor(i / 4 / w);
        }
        return { lit, alpha, cx: sx / lit, cy: sy / lit };
    };
    const gl = summary(await canvasBytes(page));
    const background_animation = config.background_animation.map((e) => ({ ...e, renderer: 'canvas' }));
    await page.evaluate((c) => window.__reconfigure(c), { ...config, background_animation });
    await expect.poll(() => entries(page)).toEqual([{ type: 'HoloSphereEffect', ready: undefined }]);
    await page.waitForTimeout(300);
    const c2d = summary(await canvasBytes(page));
    expect(gl.lit).toBeGreaterThan(500);
    // Antialiasing differs between the tiers: compare coverage and placement, not pixels
    expect(gl.alpha / c2d.alpha).toBeGreaterThan(0.6);
    expect(gl.alpha / c2d.alpha).toBeLessThan(1.6);
    expect(Math.abs(gl.cx - c2d.cx)).toBeLessThan(3);
    expect(Math.abs(gl.cy - c2d.cy)).toBeLessThan(3);
    await expectNoErrors(page);
});

test('nebula volumetric: draws on WebGL, keeps its scene through an alert, plain clouds with renderer: canvas', async ({ page }) => {
    await mountCase(page, 'button-webgl-nebula');
    await expect.poll(() => entries(page), { timeout: 10_000 }).toEqual([{ type: 'NebulaGLEffect', ready: true }]);
    await expect.poll(() => litPixels(page)).toBeGreaterThan(1000);
    const before = await page.evaluateHandle(() => /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer.getHandles(0)[0].effects[0]);
    await page.evaluate(() => window.lcards.core.themeManager.setAlertMode('red_alert'));
    await page.waitForTimeout(300);
    expect(await page.evaluate((old) => /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer.getHandles(0)[0].effects[0] === old, before)).toBe(true);
    await page.evaluate(() => window.lcards.core.themeManager.setAlertMode('green_alert'));
    const config = /** @type {any} */ (yaml.load(readFileSync(new URL('fixtures/button-webgl-nebula.yaml', import.meta.url), 'utf8')));
    await page.evaluate((c) => window.__reconfigure(c), { ...config, background_animation: config.background_animation.map((e) => ({ ...e, renderer: 'canvas' })) });
    await expect.poll(() => entries(page)).toEqual([{ type: 'NebulaEffect', ready: undefined }]);
    await expectNoErrors(page);
});

test('grid floor view: lines fade out where they crowd, so the horizon band is not saturated', async ({ page }) => {
    await mountCase(page, 'button-webgl-grid-view-floor', { width: '860' });
    await expect.poll(() => entries(page), { timeout: 10_000 }).toEqual([{ type: 'GridGLEffect', ready: true }]);
    await page.waitForTimeout(500);
    /** Mean alpha per row */
    const rows = await page.evaluate(() => {
        const c = /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer.canvas;
        const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        const sums = [];
        for (let y = 0; y < c.height; y++) {
            let sum = 0;
            for (let x = 0; x < c.width; x++) sum += d[(y * c.width + x) * 4 + 3];
            sums.push(sum / (c.width * 255));
        }
        return sums;
    });
    // The band just under the horizon (see MAX_ROW): the 30 rows below the first lit one
    const top = rows.findIndex((r) => r > 0.002);
    const band = rows.slice(top, top + 30);
    const horizon = band.reduce((sum, r) => sum + r, 0) / band.length;
    expect(top, 'sky above the horizon').toBeGreaterThan(20);
    expect(horizon, 'mean alpha of the horizon band').toBeLessThan(MAX_ROW);
    expect(Math.max(...rows), 'still draws a floor').toBeGreaterThan(0.05);
    await expectNoErrors(page);
});

/** Grid patterns: WebGL flat view against the Canvas2D grid, same frame (scroll pinned) */
const GRID_CASES = {
    both: { preset: 'grid', config: { color: 'rgba(255,153,102,0.6)' } },
    major: { preset: 'grid', config: { color: 'rgba(255,153,102,0.5)', color_major: '#ffcc99', major_row_interval: 3, major_col_interval: 4, line_width_major: 3, line_spacing: 25 } },
    // Tiles of 7 rows (spacing 35, height 200), interval 3, a seam mid-card:
    // where majors used to restart and meet side by side
    seam: { preset: 'grid', config: { color: 'rgba(255,153,102,0.5)', color_major: '#ffcc99', major_row_interval: 3, line_width_major: 3, line_spacing: 35, pattern: 'horizontal' }, scroll: [0, 120] },
    cells: { preset: 'grid', config: { num_rows: 4, num_cols: 8, line_width: 2, color: 'rgba(153,204,255,0.7)' } },
    fill: { preset: 'grid', config: { fill_color: 'rgba(0,40,120,0.4)', show_border_lines: false } },
    dots: { preset: 'grid', config: { pattern: 'dots', dot_radius: 3, color: '#ff9966' } },
    diagonal: { preset: 'grid-diagonal', config: { color: 'rgba(255,153,102,0.6)' } },
    hexagonal: { preset: 'grid-hexagonal', config: {} },
    polar: { preset: 'grid', config: { pattern: 'polar', color: 'rgba(255,153,102,0.6)' } },
    // Off centre, majors on rings and spokes, rings moved out and spokes turned by the scroll
    'polar-major': { preset: 'grid', config: { pattern: 'polar', polar_x: 0.3, polar_y: 0.7, spoke_count: 16, line_spacing: 30, major_row_interval: 3, major_col_interval: 4, line_width_major: 3, color: 'rgba(255,153,102,0.5)', color_major: '#ffcc99' }, scroll: [20, 47] }
};

for (const [name, entry] of Object.entries(GRID_CASES)) {
    test(`grid ${name}: the WebGL flat view draws what the Canvas2D grid draws`, async ({ page }) => {
        const base = { type: 'custom:lcards-button', entity: 'light.demo', preset: 'lozenge', height: 200 };
        await mountCase(page, 'button-background', { width: '520' });
        /** Mount entry on a tier, pin the scroll, return the canvas bytes */
        const shot = async (renderer, type) => {
            const { scroll = [13.25, 7.5], ...bgEntry } = /** @type {any} */ (entry);
            await page.evaluate((c) => window.__reconfigure(c), { ...base, background_animation: [{ ...bgEntry, renderer }] });
            await expect.poll(() => entries(page), { timeout: 10_000 }).toEqual([{ type, ready: type === 'GridGLEffect' ? true : undefined }]);
            await page.evaluate(([sx, sy]) => {
                const e = /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer.renderer.effects[0];
                const grid = e.model ?? e;
                e.speed = 0;
                grid.scrollX = sx;
                grid.scrollY = sy;
            }, scroll);
            await page.waitForTimeout(250);
            return canvasBytes(page);
        };
        const gl = await shot('auto', 'GridGLEffect');
        const c2d = await shot('canvas', 'GridEffect');
        expect(c2d.length).toBe(gl.length);
        let diff = 0, alphaGl = 0, alphaC2d = 0;
        for (let i = 0; i < gl.length; i++) {
            diff += Math.abs(gl[i] - c2d[i]);
            if (i % 4 === 3) { alphaGl += gl[i]; alphaC2d += c2d[i]; }
        }
        expect(alphaGl, 'drew something').toBeGreaterThan(0);
        if (name === 'diagonal' || name === 'hexagonal' || name.startsWith('polar')) {
            // Canvas2D overdraws these unevenly (overlapping tiles) and the tiers
            // antialias 1 px diagonals differently: every line pixel (core,
            // alpha > 60) of one tier has one of the other within 1 px, both ways
            const width = await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer.canvas.width);
            /** @param {number[]} from @param {number[]} to */
            const near = (from, to) => {
                const height = from.length / 4 / width;
                const core = (/** @type {number[]} */ d, /** @type {number} */ x, /** @type {number} */ y) =>
                    x >= 0 && x < width && y >= 0 && y < height && d[(y * width + x) * 4 + 3] > 60;
                let hits = 0, total = 0;
                for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
                    if (!core(from, x, y)) continue;
                    total++;
                    if ([-1, 0, 1].some((dy) => [-1, 0, 1].some((dx) => core(to, x + dx, y + dy)))) hits++;
                }
                return hits / total;
            };
            expect(near(gl, c2d), 'WebGL line pixels near Canvas2D ones').toBeGreaterThan(0.97);
            expect(near(c2d, gl), 'Canvas2D line pixels near WebGL ones').toBeGreaterThan(0.97);
            expect(alphaGl / alphaC2d, 'average brightness').toBeGreaterThan(0.8);
            expect(alphaGl / alphaC2d, 'average brightness').toBeLessThan(1.25);
        } else {
            // Measured 2026-10-24: 0.05 to 0.11
            expect(diff / gl.length, 'mean byte difference').toBeLessThan(1);
        }
        await expectNoErrors(page);
    });
}

test('contour-field: a lost context swaps to its own Canvas2D version', async ({ page }) => {
    await mountCase(page, 'button-webgl-contour-field');
    await expect.poll(() => entries(page), { timeout: 10_000 }).toEqual([{ type: 'ContourFieldGLEffect', ready: true }]);
    await page.evaluate(() => window.lcards.debug.webgl.loseContext());
    await expect.poll(() => entries(page)).toEqual([{ type: 'ContourFieldEffect', ready: undefined }]);
    await expect.poll(() => litPixels(page)).toBeGreaterThan(100);
});

test('a frame drawn after the context is lost but before the event arrives keeps the loop alive', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (e) => pageErrors.push(e.message));
    await mountCase(page, 'button-webgl-contour-field');
    await expect.poll(() => entries(page), { timeout: 10_000 }).toEqual([{ type: 'ContourFieldGLEffect', ready: true }]);
    // Same task: the webglcontextlost event cannot have been delivered yet
    const threw = await page.evaluate(async () => {
        const bg = /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer;
        const effect = bg.renderer.effects[0];
        const glCanvas = effect._runtime._canvas();
        const ctx = bg.canvas.getContext('2d');
        glCanvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext();
        try {
            effect.draw(ctx, bg.canvas.width, bg.canvas.height);
            return false;
        } catch {
            return true;
        }
    });
    expect(threw, 'draw threw (it would end the card frame loop)').toBe(false);
    await expect.poll(() => entries(page)).toEqual([{ type: 'ContourFieldEffect', ready: undefined }]);
    await expect.poll(() => litPixels(page)).toBeGreaterThan(100);
    expect(pageErrors).toEqual([]);
});

test('plasma: an alert change recolours on the GPU, same effect and scene (no re-bake)', async ({ page }) => {
    await mountCase(page, 'button-webgl-plasma');
    await expect.poll(() => entries(page), { timeout: 10_000 }).toEqual([{ type: 'PlasmaGLEffect', ready: true }]);
    const before = await page.evaluateHandle(() => {
        const e = /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer.getHandles(0)[0].effects[0];
        return { effect: e, scene: e._scene };
    });
    await page.evaluate(() => window.lcards.core.themeManager.setAlertMode('red_alert'));
    await page.waitForTimeout(400);
    expect(await page.evaluate((old) => {
        const e = /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer.getHandles(0)[0].effects[0];
        return { effect: e === old.effect, scene: e._scene === old.scene };
    }, before)).toEqual({ effect: true, scene: true });
    await page.evaluate(() => window.lcards.core.themeManager.setAlertMode('green_alert'));
    await expectNoErrors(page);
});

test.describe('no WebGL', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { delete (/** @type {any} */ (window)).WebGL2RenderingContext; });
    });

    test('warp-starfield draws the plain starfield with the same config', async ({ page }) => {
        await mountCase(page, 'button-warp-starfield');
        await expect.poll(() => entries(page)).toEqual([{ type: 'StarfieldEffect', ready: undefined }]);
        expect(await effectField(page, 'count')).toBe(400);
        await expect.poll(() => litPixels(page)).toBeGreaterThan(20);
        await expectNoErrors(page);
    });

    test('contour-field, plasma and fluid draw their Canvas2D versions', async ({ page }) => {
        for (const [preset, , canvasType] of FIELDS) {
            await mountCase(page, `button-webgl-${preset}`);
            await expect.poll(() => entries(page)).toEqual([{ type: canvasType, ready: undefined }]);
            await expect.poll(() => litPixels(page)).toBeGreaterThan(100);
        }
        await expectNoErrors(page);
    });
});

test.describe('reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('the held frame shows the scene once it has loaded', async ({ page }) => {
        await mountCase(page, 'button-warp-starfield');
        await expect.poll(() => entries(page), { timeout: 10_000 }).toEqual([{ type: 'WarpStarfieldEffect', ready: true }]);
        await expect.poll(() => litPixels(page)).toBeGreaterThan(5);
        const clock = await effectField(page, '_elapsedTime');
        await page.waitForTimeout(500);
        expect(await effectField(page, '_elapsedTime'), 'no motion while held').toBe(clock);
        await expectNoErrors(page);
    });
});

/** Alpha of every pixel of the background canvas, with its size */
const alphaMap = (page) => page.evaluate(() => {
    const c = /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer.canvas;
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    const a = [];
    for (let i = 3; i < d.length; i += 4) a.push(d[i]);
    return { w: c.width, h: c.height, a };
});

/** Centres of the runs of lit pixels along a line of alphas */
const peaks = (line, min = 60) => {
    const out = [];
    for (let i = 0; i < line.length; i++) {
        if (line[i] < min) continue;
        let j = i;
        while (j + 1 < line.length && line[j + 1] >= min) j++;
        out.push((i + j) / 2);
        i = j;
    }
    return out;
};

test('grid surface: cylinder, line_spacing is true px at the front, columns and rows', async ({ page }) => {
    await mountCase(page, 'button-webgl-grid-cylinder', { width: '860' });
    await expect.poll(() => entries(page), { timeout: 10_000 }).toEqual([{ type: 'GridGLEffect', ready: true }]);
    await page.waitForTimeout(300);
    const { w, h, a } = await alphaMap(page);
    // Columns along a row between two rings (rings every 40 px from the equator)
    const y = Math.round(h / 2 + 20);
    const cols = peaks(a.slice(y * w, (y + 1) * w), 120); // front lines only (the far side is at 0.25)
    const centre = cols.reduce((best, x) => (Math.abs(x - w / 2) < Math.abs(best - w / 2) ? x : best), cols[0]);
    expect(Math.abs(centre - w / 2), 'a column at the front').toBeLessThanOrEqual(1);
    const next = cols.find((x) => x > centre);
    // 40 px stretched so a whole number of cells goes round (19 round 754 px: 40.3)
    expect(Math.abs(next - centre - 40), 'column pitch at the front').toBeLessThanOrEqual(1.5);
    // Rings down the front column's side
    const x = Math.round(w / 2 + 20);
    const ring = peaks(Array.from({ length: h }, (_, yy) => a[yy * w + x]), 120);
    const mid = ring.reduce((best, v) => (Math.abs(v - h / 2) < Math.abs(best - h / 2) ? v : best), ring[0]);
    expect(Math.abs(mid - h / 2), 'the equator ring at the front').toBeLessThanOrEqual(1.5);
    expect(Math.abs(ring[ring.indexOf(mid) + 1] - mid - 40), 'ring pitch at the front').toBeLessThanOrEqual(1.5);
    // Nothing outside the cylinder's silhouette (radius 0.4 x 300)
    expect(a.slice(y * w, y * w + Math.round(w / 2 - 140)).every((v) => v === 0), 'clear left of the cylinder').toBe(true);
    await expectNoErrors(page);
});

test('grid surface: back_opacity dims the far side; renderer: canvas draws the flat grid', async ({ page }) => {
    await mountCase(page, 'button-webgl-grid-cylinder', { width: '860' });
    await expect.poll(() => entries(page), { timeout: 10_000 }).toEqual([{ type: 'GridGLEffect', ready: true }]);
    const total = async (back) => {
        // Set it and draw a frame in place: under load the loop pauses itself
        // (FPS too low), so waiting for the next frame is not reliable
        await page.evaluate((b) => {
            const bg = /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer;
            bg.getHandles(0)[0].effects[0].params.back_opacity = b;
            bg.renderer._drawEffects(0);
        }, back);
        const { a } = await alphaMap(page);
        return a.reduce((s, v) => s + v, 0);
    };
    const none = await total(0);
    const some = await total(0.25);
    const full = await total(1);
    expect(none).toBeGreaterThan(0);
    expect(some, 'back_opacity 0.25 adds the far side').toBeGreaterThan(none * 1.05);
    expect(full, 'back_opacity 1 adds more').toBeGreaterThan(some * 1.1);
    const config = /** @type {any} */ (yaml.load(readFileSync(new URL('fixtures/button-webgl-grid-cylinder.yaml', import.meta.url), 'utf8')));
    await page.evaluate((c) => window.__reconfigure(c), { ...config, background_animation: config.background_animation.map((e) => ({ ...e, renderer: 'canvas' })) });
    await expect.poll(() => entries(page)).toEqual([{ type: 'GridEffect', ready: undefined }]);
    await expectNoErrors(page);
});

test('grid surface: well, a funnel from the rim down to a narrow throat', async ({ page }) => {
    await mountCase(page, 'button-background', { width: '500' });
    await page.evaluate((c) => window.__reconfigure(c), {
        type: 'custom:lcards-button', entity: 'light.demo', preset: 'lozenge', height: 300,
        background_animation: [{ preset: 'grid', config: { surface: 'well', well_throat: 0.2, color: 'rgba(153,204,255,0.8)', scroll_speed_x: 0 } }]
    });
    await expect.poll(() => entries(page), { timeout: 10_000 }).toEqual([{ type: 'GridGLEffect', ready: true }]);
    await page.waitForTimeout(300);
    const { w, h, a } = await alphaMap(page);
    /** Lit extent of row y: [first, last] x, or null */
    const extent = (y) => {
        const row = a.slice(y * w, (y + 1) * w);
        const first = row.findIndex((v) => v > 30);
        if (first < 0) return null;
        return [first, w - 1 - [...row].reverse().findIndex((v) => v > 30)];
    };
    const rows = Array.from({ length: h }, (_, y) => extent(y));
    const top = rows.findIndex(Boolean);
    const bottom = h - 1 - [...rows].reverse().findIndex(Boolean);
    expect(bottom - top, 'the well spans most of the card').toBeGreaterThan(h * 0.5);
    const width = (y) => { const e = rows[y]; return e ? e[1] - e[0] : 0; };
    const rim = width(top + Math.round((bottom - top) * 0.1));
    const throat = width(bottom - 3);
    expect(rim, 'rim wider than the throat').toBeGreaterThan(throat * 3);
    // Centred, inside its rim (diameter 0.8 x 300, plus the near rim's perspective)
    expect(Math.abs((rows[top + 20][0] + rows[top + 20][1]) / 2 - w / 2), 'centred').toBeLessThanOrEqual(2);
    expect(a.slice(0, h * w).filter((v, i) => v > 0 && Math.abs((i % w) - w / 2) > 160).length, 'nothing far outside the rim').toBe(0);
    await expectNoErrors(page);
});

test('zoom over a WebGL grid: draws, the scene renders once per frame, and the copies are scaled', async ({ page }) => {
    await mountCase(page, 'button-background', { width: '520' });
    const bg = { preset: 'grid', config: { line_spacing: 40, color: 'rgba(255,153,102,0.8)', scroll_speed_x: 0, scroll_speed_y: 0 } };
    await page.evaluate((c) => window.__reconfigure(c), {
        type: 'custom:lcards-button', entity: 'light.demo', preset: 'lozenge', height: 200,
        background_animation: [{ ...bg, zoom: { layers: 3, scale_from: 0.5, scale_to: 2, duration: 10 } }]
    });
    await expect.poll(() => page.evaluate(() => {
        const z = /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer.renderer.effects[0];
        return [z.constructor.name, z.baseEffect?.constructor.name, !!z.baseEffect?._scene];
    }), { timeout: 10_000 }).toEqual(['ZoomEffect', 'GridGLEffect', true]);
    // Five frames drawn here (the loop may pause itself on a busy machine)
    const counts = await page.evaluate(() => {
        const r = /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer.renderer;
        r.stop();
        const z = r.effects[0];
        const n = { zoom: 0, base: 0 };
        const zoomDraw = z.draw.bind(z);
        const baseDraw = z.baseEffect.draw.bind(z.baseEffect);
        z.draw = (...args) => { n.zoom++; return zoomDraw(...args); };
        z.baseEffect.draw = (...args) => { n.base++; return baseDraw(...args); };
        for (let i = 0; i < 5; i++) r._drawEffects(400);
        return n;
    });
    expect(counts, 'one grid render per frame').toEqual({ zoom: 5, base: 5 });
    expect(await litPixels(page), 'drew something').toBeGreaterThan(1000);
    // Three scaled copies of a 40 px grid: more distinct line positions than one grid
    const { w, h, a } = await alphaMap(page);
    const lines = peaks(a.slice(Math.round(h / 2) * w, (Math.round(h / 2) + 1) * w), 20).length;
    expect(lines, 'scaled copies add lines').toBeGreaterThan(Math.ceil(w / 40) + 2);
    await expectNoErrors(page);
});

/** Mount one grid entry on a 500 x 300 card and return its alpha map */
const gridMap = async (page, config) => {
    await mountCase(page, 'button-background', { width: '500' });
    await page.evaluate((c) => window.__reconfigure(c), {
        type: 'custom:lcards-button', entity: 'light.demo', preset: 'lozenge', height: 300,
        background_animation: [{ preset: 'grid', config: { scroll_speed_x: 0, scroll_speed_y: 0, color: 'rgba(153,204,255,0.9)', ...config } }]
    });
    await expect.poll(() => entries(page), { timeout: 10_000 }).toEqual([{ type: 'GridGLEffect', ready: true }]);
    await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer.renderer._drawEffects(0));
    return alphaMap(page);
};

test('camera_roll turns the picture clockwise: rows become columns at 90, the floor horizon drops to the right', async ({ page }) => {
    // Mean alpha of a row and of a column: horizontal lines vary down a column, not along a row
    const spread = ({ w, h, a }) => {
        const col = Array.from({ length: h }, (_, y) => a[y * w + Math.round(w / 2) + 7]);
        const row = Array.from({ length: w }, (_, x) => a[Math.round(h / 2 + 7) * w + x]);
        const range = (v) => Math.max(...v) - Math.min(...v);
        return { col: range(col), row: range(row) };
    };
    const flat = spread(await gridMap(page, { pattern: 'horizontal' }));
    expect(flat.col, 'rows: lit and dark down a column').toBeGreaterThan(100);
    expect(flat.row, 'rows: even along a row').toBeLessThan(20);
    const rolled = spread(await gridMap(page, { pattern: 'horizontal', camera_roll: 90 }));
    expect(rolled.row, 'rolled 90: lit and dark along a row').toBeGreaterThan(100);
    expect(rolled.col, 'rolled 90: even down a column').toBeLessThan(20);
    // Floor rolled 20 degrees clockwise: the sky reaches lower on the left than on the right
    const { w, h, a } = await gridMap(page, { view: 'floor', camera_roll: 20 });
    const firstLit = (x) => Array.from({ length: h }, (_, y) => a[y * w + x]).findIndex((v) => v > 10);
    expect(firstLit(20), 'horizon higher on the left').toBeLessThan(firstLit(w - 20));
    await expectNoErrors(page);
});

test('well ripple: the silhouette swells and narrows down a straight well; well_morph reshapes it', async ({ page }) => {
    /** Lit width of each row */
    const widths = ({ w, h, a }) => Array.from({ length: h }, (_, y) => {
        const row = a.slice(y * w, (y + 1) * w);
        const first = row.findIndex((v) => v > 20);
        return first < 0 ? 0 : w - [...row].reverse().findIndex((v) => v > 20) - first;
    });
    const mid = (v) => v.slice(Math.round(v.length * 0.35), Math.round(v.length * 0.65));
    const plain = mid(widths(await gridMap(page, { surface: 'well', well_profile: [1, 1], camera_tilt: 0 })));
    const rippled = mid(widths(await gridMap(page, { surface: 'well', well_profile: [1, 1], camera_tilt: 0, well_ripple: 0.15, well_ripple_speed: 0 })));
    expect(Math.max(...plain) - Math.min(...plain), 'straight well: even width').toBeLessThanOrEqual(3);
    expect(Math.max(...rippled) - Math.min(...rippled), 'ripples: the width swells and narrows').toBeGreaterThan(20);
    // Morph a straight well halfway toward a narrow waist: the middle narrows
    const waist = mid(widths(await gridMap(page, { surface: 'well', well_profile: [1, 1, 1], well_profile_to: [1, 0.2, 1], well_morph: 0.5, camera_tilt: 0 })));
    expect(Math.min(...waist), 'morphed: narrower in the middle').toBeLessThan(Math.min(...plain) * 0.8);
    await expectNoErrors(page);
});
