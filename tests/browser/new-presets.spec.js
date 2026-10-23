/**
 * B1 presets: morph (an MSD shape takes another shape's geometry and gets its own
 * back on stop) and tap-ripple (a data-grid pulse that starts at the tap point).
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

/** Running tracked instances whose scope id contains `part`. */
const running = (page, part) => page.evaluate((part) => {
    let n = 0;
    window.lcards.core.animationManager.scopes.forEach((s, id) => {
        if (!id.includes(part)) return;
        s.runningInstances.forEach(list => { n += list.filter(i => !i.completed).length; });
    });
    return n;
}, part);

/** Stop every animation of the scopes whose id contains `part`. */
const stopScopes = (page, part) => page.evaluate((part) => {
    const manager = window.lcards.core.animationManager;
    [...manager.scopes.keys()].filter(id => id.includes(part)).forEach(id => manager.stopAnimations(id));
}, part);

const shapeD = (card) => card.evaluate((el) =>
    el.shadowRoot.querySelector('[data-overlay-id="status_shape"] .shape-path')?.getAttribute('d') ?? null);

test.describe('morph', () => {
    test('the shape morphs, is tracked, and gets its own geometry back on stop', async ({ page }) => {
        const card = await mountCase(page, 'msd-morph');
        await expect.poll(() => shapeD(card), { timeout: 10_000 }).not.toBeNull();
        // The hit area keeps the authored geometry (the animation never touches it)
        const original = await card.evaluate((el) =>
            el.shadowRoot.querySelector('[data-overlay-id="status_shape"] .shape-hit-area').getAttribute('d'));
        await expect.poll(() => running(page, 'status_shape'), { timeout: 10_000 }).toBe(1);
        // The first frames already differ from the square's own path
        const seen = new Set();
        for (let i = 0; i < 8; i++) {
            seen.add(await shapeD(card));
            await page.waitForTimeout(60);
        }
        expect(seen.size, 'd changes while it morphs').toBeGreaterThan(2);

        await stopScopes(page, 'status_shape');
        expect(await running(page, 'status_shape')).toBe(0);
        const after = await shapeD(card);
        expect(after, 'the authored geometry is back').toBe(original);
        await expectNoErrors(page);
    });

    test('under reduced motion the loop never starts', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        const card = await mountCase(page, 'msd-morph');
        await page.waitForTimeout(800);
        expect(await running(page, 'status_shape')).toBe(0);
        const d = await shapeD(card);
        const hit = await card.evaluate((el) =>
            el.shadowRoot.querySelector('[data-overlay-id="status_shape"] .shape-hit-area').getAttribute('d'));
        expect(d).toBe(hit);
        await expectNoErrors(page);
    });
});

/** Click the grid at a cell's centre; returns that cell's index. */
const tapCell = (card, index) => card.evaluate((el, index) => {
    const cell = el.shadowRoot.querySelectorAll('.grid-cell')[index];
    const r = cell.getBoundingClientRect();
    cell.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, detail: 1 }));
    return index;
}, index);

/** Each cell's opacity sampled every frame for `ms`: the frame each first dims. */
const firstDim = (card, ms, tap) => card.evaluate((el, { ms, tap }) => new Promise((resolve) => {
    const cells = [...el.shadowRoot.querySelectorAll('.grid-cell')];
    const first = cells.map(() => -1);
    let frame = 0;
    const end = performance.now() + ms;
    const tick = () => {
        cells.forEach((c, i) => { if (first[i] < 0 && Number(getComputedStyle(c).opacity) < 0.97) first[i] = frame; });
        frame++;
        if (performance.now() < end) requestAnimationFrame(tick); else resolve(first);
    };
    const cell = cells[tap];
    const r = cell.getBoundingClientRect();
    cell.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, detail: 1 }));
    requestAnimationFrame(tick);
}), { ms, tap });

test.describe('tap-ripple', () => {
    test('starts at the tapped cell and spreads outward', async ({ page }) => {
        const card = await mountCase(page, 'data-grid-tap-ripple');
        // 6 x 4 grid: tap the bottom-right cell
        const first = await firstDim(card, 900, 23);
        expect(first.every(f => f >= 0), `every cell pulses: ${first}`).toBe(true);
        expect(first[23], 'tapped cell first').toBe(Math.min(...first));
        expect(first[0], 'far corner last').toBe(Math.max(...first));
        expect(first[0]).toBeGreaterThan(first[23]);
        await expectNoErrors(page);
    });

    test('is tracked and settles back to full opacity', async ({ page }) => {
        const card = await mountCase(page, 'data-grid-tap-ripple');
        await tapCell(card, 0);
        await expect.poll(() => running(page, 'data-grid'), { timeout: 2000 }).toBe(1);
        await expect.poll(() => running(page, 'data-grid'), { timeout: 4000 }).toBe(0);
        const opacities = await card.evaluate(el => [...el.shadowRoot.querySelectorAll('.grid-cell')].map(c => Number(getComputedStyle(c).opacity)));
        expect(opacities.every(o => o > 0.99)).toBe(true);
        await expectNoErrors(page);
    });

    test('under reduced motion it jumps to the end state', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        const card = await mountCase(page, 'data-grid-tap-ripple');
        await tapCell(card, 5);
        await page.waitForTimeout(200);
        expect(await running(page, 'data-grid')).toBe(0);
        const opacities = await card.evaluate(el => [...el.shadowRoot.querySelectorAll('.grid-cell')].map(c => Number(getComputedStyle(c).opacity)));
        expect(opacities.every(o => o > 0.99)).toBe(true);
        await expectNoErrors(page);
    });
});

/** The boot fixture's visible state: label text, inline styles on the parts, border dash attributes. */
const bootState = (card) => card.evaluate((el) => {
    const g = el.shadowRoot.querySelector('[data-overlay-id="button"]');
    const parts = [...g.querySelectorAll('.button-bg, .button-border')];
    return {
        text: [...g.querySelectorAll('text')].map(t => t.textContent.trim()).filter(Boolean).join(' '),
        inline: parts.map(p => (p.style.opacity || '') + (p.style.clipPath || '')).join(''),
        dash: [...g.querySelectorAll('.button-border')].map(b => b.getAttribute('stroke-dasharray') ?? '').join(''),
        borders: g.querySelectorAll('.button-border').length,
    };
});

test.describe('boot-sequence', () => {
    test('powers the button up, is tracked, and ends exactly as it started', async ({ page }) => {
        const card = await mountCase(page, 'button-boot-sequence');
        expect((await bootState(card)).borders, 'fixture has border paths').toBeGreaterThan(0);
        await expect.poll(() => running(page, 'button-'), { timeout: 5000 }).toBe(1);
        // Mid-sequence: the label is hidden or scrambled, the parts carry inline values
        const mid = await bootState(card);
        expect(mid.text === 'BOOT SEQUENCE' && mid.inline === '', 'something is mid-boot').toBe(false);

        await expect.poll(() => running(page, 'button-'), { timeout: 5000 }).toBe(0);
        const end = await bootState(card);
        expect(end.text).toBe('BOOT SEQUENCE');
        expect(end.inline, 'no inline opacity or clip left').toBe('');
        expect(end.dash, 'authored dash attributes back').toBe('');
        await expectNoErrors(page);
    });

    test('a stop mid-sequence puts everything back', async ({ page }) => {
        const card = await mountCase(page, 'button-boot-sequence');
        await expect.poll(() => running(page, 'button-'), { timeout: 5000 }).toBe(1);
        await page.waitForTimeout(500);
        await stopScopes(page, 'button-');
        const after = await bootState(card);
        expect(after.text).toBe('BOOT SEQUENCE');
        expect(after.inline).toBe('');
        expect(after.dash).toBe('');
        await expectNoErrors(page);
    });

    test('sweep fill clips in from the side', async ({ page }) => {
        const card = await mountCase(page, 'button-boot-sequence');
        await page.evaluate(() => {
            const config = JSON.parse(JSON.stringify(window.__card.config));
            config.animations[0].trigger = 'on_tap';
            config.animations[0].params.fill = 'sweep';
            config.tap_action = { action: 'none' };
            window.__reconfigure(config);
        });
        await expect.poll(() => running(page, 'button-'), { timeout: 5000 }).toBe(0);
        await card.evaluate(el => el.shadowRoot.querySelector('.button-bg').dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true })));
        await page.waitForTimeout(250);
        const clip = await card.evaluate(el => el.shadowRoot.querySelector('.button-bg').style.clipPath);
        expect(clip).toMatch(/^inset\(/);
        await expect.poll(async () => (await bootState(card)).inline, { timeout: 5000 }).toBe('');
        await expectNoErrors(page);
    });

    test('reduced motion: settled at once, everything visible', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        const card = await mountCase(page, 'button-boot-sequence');
        await page.waitForTimeout(400);
        expect(await running(page, 'button-')).toBe(0);
        const s = await bootState(card);
        expect(s.text).toBe('BOOT SEQUENCE');
        expect(s.inline).toBe('');
        await expectNoErrors(page);
    });

    test('essential_motion plays it under reduced motion', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await mountCase(page, 'button-boot-sequence');
        await page.evaluate(() => {
            const config = JSON.parse(JSON.stringify(window.__card.config));
            config.animations[0].essential_motion = true;
            config.animations[0].trigger = 'on_tap';
            config.tap_action = { action: 'none' };
            window.__reconfigure(config);
        });
        await page.waitForTimeout(300);
        await page.locator('#mount > *').first().evaluate(el => el.shadowRoot.querySelector('.button-bg').dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true })));
        await expect.poll(() => running(page, 'button-'), { timeout: 2000 }).toBe(1);
        await expectNoErrors(page);
    });
});

const sweeps = (card) => card.evaluate(el => el.shadowRoot.querySelectorAll('[data-sensor-sweep]').length);

test.describe('sensor-sweep', () => {
    for (const [fixture, scope] of [['elbow-sensor-sweep', 'button-'], ['msd-sensor-sweep', 'scanner']]) {
        test(`${fixture}: draws its shapes, rotates, and removes them on stop`, async ({ page }) => {
            const card = await mountCase(page, fixture);
            await expect.poll(() => sweeps(card), { timeout: 10_000 }).toBe(1);
            expect(await running(page, scope)).toBe(1);
            const angle = () => card.evaluate(el => el.shadowRoot.querySelector('[data-sensor-sweep] path').style.transform);
            const a = await angle();
            await page.waitForTimeout(200);
            expect(await angle(), 'the wedge turns').not.toBe(a);
            await stopScopes(page, scope);
            expect(await sweeps(card)).toBe(0);
            await expectNoErrors(page);
        });
    }

    test('reduced motion: no sweep drawn', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        const card = await mountCase(page, 'msd-sensor-sweep');
        await page.waitForTimeout(1500);
        expect(await sweeps(card)).toBe(0);
        expect(await running(page, 'scanner')).toBe(0);
        await expectNoErrors(page);
    });
});
