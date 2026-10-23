/**
 * Text presets with no `target` run on the card's button group. They must split
 * the <text> inside it, not the group itself: splitting the group replaced the
 * background path with <tspan>s and the button went black (0x0 group).
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

const snapshot = (card) => card.evaluate((el) => {
    const g = el.shadowRoot.querySelector('[data-button-id]');
    const r = g.getBoundingClientRect();
    return {
        size: `${Math.round(r.width)}x${Math.round(r.height)}`,
        hasBg: !!g.querySelector('.button-bg'),
        text: g.querySelector('text')?.textContent.replace(/\s+/g, ' ').trim(),
    };
});

for (const preset of ['text-scramble', 'text-decode', 'text-reveal', 'text-typewriter', 'text-glitch']) {
    test(`${preset} on an untargeted button keeps the button and restores its text`, async ({ page }) => {
        const card = await mountCase(page, 'button-text-preset');
        if (preset !== 'text-scramble') {
            await page.evaluate((p) => {
                const config = JSON.parse(JSON.stringify(window.__card.config));
                config.animations[0].preset = p;
                window.__reconfigure(config);
            }, preset);
            await page.waitForTimeout(300);
        }
        const before = await snapshot(card);
        expect(before.text).toBe('TEXT PRESET');

        await card.click();
        await page.waitForTimeout(150);
        const during = await snapshot(card);
        expect(during.hasBg, 'background path kept').toBe(true);
        const [w, h] = during.size.split('x').map(Number);
        expect(w, 'group not collapsed').toBeGreaterThan(100);
        expect(h, 'group not collapsed').toBeGreaterThan(20);

        await expect.poll(async () => (await snapshot(card)).text, { timeout: 5000 }).toBe('TEXT PRESET');
        expect((await snapshot(card)).hasBg).toBe(true);
        await expectNoErrors(page);
    });
}

/** Set the fixture's tap animation, then return helpers bound to the card. */
async function withAnimation(page, animation) {
    const card = await mountCase(page, 'button-text-preset');
    await page.evaluate((anim) => {
        const config = JSON.parse(JSON.stringify(window.__card.config));
        config.animations = [anim];
        window.__reconfigure(config);
    }, animation);
    await page.waitForTimeout(300);
    return card;
}

/** Label text sampled every frame for `ms` after a tap. */
const framesAfterTap = (card, ms) => card.evaluate((el, ms) => new Promise((resolve) => {
    const seen = [];
    const end = performance.now() + ms;
    const tick = () => {
        const t = el.shadowRoot.querySelector('text[data-field-id]')?.textContent ?? '';
        if (seen.at(-1) !== t) seen.push(t);
        if (performance.now() < end) requestAnimationFrame(tick); else resolve(seen);
    };
    el.shadowRoot.querySelector('.button-bg').dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    requestAnimationFrame(tick);
}), ms);

/** Running tracked instances for a trigger, across scopes. */
const tracked = (page, trigger) => page.evaluate((trigger) => {
    let n = 0;
    window.lcards.core.animationManager.scopes.forEach((s) => { n += (s.runningInstances.get(trigger) ?? []).filter(i => !i.completed).length; });
    return n;
}, trigger);

test('text-decode scrambles, settles on the label, and is tracked while it runs', async ({ page }) => {
    const card = await withAnimation(page, { trigger: 'on_tap', preset: 'text-decode', params: { duration: 600 } });
    const sampling = framesAfterTap(card, 900);
    await page.waitForTimeout(200);
    expect(await tracked(page, 'on_tap')).toBe(1);
    const frames = await sampling;
    expect(frames.length, 'scrambled frames').toBeGreaterThan(5);
    expect(frames.at(-1)).toBe('TEXT PRESET');
    await expectNoErrors(page);
});

test('a seeded text-decode plays the same frames every time', async ({ page }) => {
    const anim = { trigger: 'on_tap', preset: 'text-decode', params: { duration: 400, seed: 11, chars: 'numbers' } };
    let card = await withAnimation(page, anim);
    const first = await framesAfterTap(card, 700);
    card = await withAnimation(page, anim);
    const second = await framesAfterTap(card, 700);
    // Frame timing varies, but the glyph sequence is drawn from the same seed
    const glyphs = (frames) => new Set(frames.slice(1, -1));
    const overlap = [...glyphs(first)].filter((f) => glyphs(second).has(f)).length;
    expect(overlap, 'shared scrambled frames').toBeGreaterThan(2);
    await expectNoErrors(page);
});

test('stopping a looping text-decode restores the label at once', async ({ page }) => {
    const card = await withAnimation(page, { trigger: 'on_tap', preset: 'text-decode', loop: true, params: { duration: 800, loop: true } });
    framesAfterTap(card, 50);
    await page.waitForTimeout(250);
    await page.evaluate(() => window.lcards.core.animationManager.scopes.forEach((_s, id) => window.lcards.core.animationManager.stopAnimations(id, 'on_tap')));
    const text = await card.evaluate((el) => el.shadowRoot.querySelector('text[data-field-id]').textContent);
    expect(text).toBe('TEXT PRESET');
    await expectNoErrors(page);
});

test('text-reveal puts its split text back when it finishes (no stray tspans)', async ({ page }) => {
    const card = await withAnimation(page, { trigger: 'on_tap', preset: 'text-reveal', params: { duration: 200, stagger: 10 } });
    await framesAfterTap(card, 50);
    await expect.poll(() => card.evaluate((el) => el.shadowRoot.querySelectorAll('text[data-field-id] tspan').length), { timeout: 4000 }).toBe(0);
    await expectNoErrors(page);
});

test('text-glitch on SVG text is tracked and stopping it restores the text', async ({ page }) => {
    const card = await withAnimation(page, { trigger: 'on_tap', preset: 'text-glitch', loop: true, params: { loop: true, duration: 300 } });
    framesAfterTap(card, 50);
    await page.waitForTimeout(200);
    expect(await tracked(page, 'on_tap')).toBe(1);
    await page.evaluate(() => window.lcards.core.animationManager.scopes.forEach((_s, id) => window.lcards.core.animationManager.stopAnimations(id, 'on_tap')));
    const result = await card.evaluate((el) => {
        const t = el.shadowRoot.querySelector('text[data-field-id]');
        return { text: t.textContent, tspans: t.querySelectorAll('tspan').length };
    });
    expect(result).toEqual({ text: 'TEXT PRESET', tspans: 0 });
    await expectNoErrors(page);
});
