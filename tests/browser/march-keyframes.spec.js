/**
 * The march preset shares one @keyframes rule per pattern and direction. It used a
 * random name per run and added a rule every time, never removing one, so a line
 * that re-renders (state changes, rules) grew its shadow root's stylesheet for good
 * (2026-11-17). Playing it again still restarts it.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

test('march adds one keyframes rule per pattern, however often it runs', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    const result = await page.evaluate(() => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const root = host.attachShadow({ mode: 'open' });
        root.innerHTML = '<svg width="200" height="20"><path id="a" d="M0 10 H200" stroke="red" stroke-dasharray="10 5"/>'
            + '<path id="b" d="M0 15 H200" stroke="red" stroke-dasharray="6 4"/></svg>';
        const march = /** @type {any} */ (window).lcards.anim.presets.march;
        const run = (/** @type {string} */ id, /** @type {any} */ params = {}) => {
            const el = root.getElementById(id);
            march({ params })?.setup(el);
            return el;
        };
        for (let i = 0; i < 50; i++) { run('a'); run('b'); run('a', { direction: 'reverse' }); }
        const rules = root.adoptedStyleSheets.flatMap((s) => [...s.cssRules]).filter((r) => r instanceof CSSKeyframesRule);
        const a = /** @type {SVGElement} */ (root.getElementById('a'));
        return {
            rules: rules.map((r) => r.name).sort(),
            running: a.getAnimations().filter((x) => x.playState === 'running').length,
        };
    });
    // a forward 15, a forward 10, a reverse 15
    expect(result.rules).toEqual(['lcards-march-f-10', 'lcards-march-f-15', 'lcards-march-r-15']);
    expect(result.running).toBe(1);
    await expectNoErrors(page);
});

test('playing a finite march again restarts it', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    const times = await page.evaluate(async () => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const root = host.attachShadow({ mode: 'open' });
        root.innerHTML = '<svg width="200" height="20"><path id="a" d="M0 10 H200" stroke="red" stroke-dasharray="10 5"/></svg>';
        const el = /** @type {SVGElement} */ (root.getElementById('a'));
        const march = /** @type {any} */ (window).lcards.anim.presets.march;
        march({ params: { loop: 1, speed: 2 } }).setup(el);
        await new Promise((r) => setTimeout(r, 600));
        const before = el.getAnimations()[0]?.currentTime;
        march({ params: { loop: 1, speed: 2 } }).setup(el);
        const after = el.getAnimations()[0]?.currentTime;
        return { before, after };
    });
    expect(Number(times.before)).toBeGreaterThan(400);
    expect(Number(times.after)).toBeLessThan(100);
});
