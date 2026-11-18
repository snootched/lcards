/**
 * MSD card bugs found by the D2 docs audit (2026-11-08), fixture msd-audit.yaml:
 * - a rule's apply.base_svg filters were never applied (unwired since the move to
 *   the core rules engine); the blueprint goes back to its own filters after;
 * - tag:/type: selectors never matched MSD overlays (registered without tags/type);
 * - a rule colour on a line went onto its 12-wide hit area and markers too;
 * - a line that ends on a point lost its start gap (anchor_gap);
 * - marker_end: arrow (the string form) drew no marker;
 * - fill_opacity 0 became 1;
 * - var() colours in a gradient were written raw into stop-color, and the gradient drew
 *   nothing on a straight horizontal line (objectBoundingBox on a zero-height box).
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

/** @param {import('@playwright/test').Page} page @param {string} sel */
const attr = (page, sel, name) => page.evaluate(([s, n]) => {
    const card = /** @type {any} */ (document.querySelector('#mount > *'));
    const el = card.renderRoot.querySelector(s);
    return el ? (n === 'filter' ? /** @type {any} */ (el).style.filter : el.getAttribute(n)) : null;
}, [sel, name]);

test('MSD audit fixes: base_svg rule filters, tag selector on the visible line only, start gap, string marker, fill_opacity 0, gradient colours', async ({ page }) => {
    await mountCase(page, 'msd-audit', { width: '800' });
    await expect.poll(() => attr(page, '#line_gap .line-path', 'd'), { timeout: 10000 }).not.toBeNull();

    // start gap: the hub's right edge is x 300; the line starts 20 further out
    const d = await attr(page, '#line_gap .line-path', 'd');
    const start = /M\s*([\d.]+)[ ,]+([\d.]+)/.exec(d ?? '');
    expect(Number(start?.[1])).toBeCloseTo(320, 0);

    // marker_end: arrow (string form) draws a marker
    expect(await attr(page, '#line_gap .line-path', 'marker-end')).toMatch(/url\(#/);

    // fill_opacity 0 stays 0
    const fo = await page.evaluate(() => {
        const card = /** @type {any} */ (document.querySelector('#mount > *'));
        const el = card.renderRoot.querySelector('#hub [fill-opacity], #hub rect');
        return el?.getAttribute('fill-opacity');
    });
    expect(fo).toBe('0');

    // gradient stops are concrete colours (no raw var())
    const stops = await page.evaluate(() => {
        const card = /** @type {any} */ (document.querySelector('#mount > *'));
        return [...card.renderRoot.querySelectorAll('linearGradient stop')].map((s) => s.getAttribute('stop-color'));
    });
    expect(stops.length).toBeGreaterThan(1);
    for (const c of stops) expect(c).not.toMatch(/var\(/);
    // and the gradient runs from the line's start to its end in user space: a bounding-box
    // gradient draws nothing on a straight horizontal line (its box has no height)
    const grad = await page.evaluate(() => {
        const card = /** @type {any} */ (document.querySelector('#mount > *'));
        const g = card.renderRoot.querySelector('linearGradient');
        return g && { units: g.getAttribute('gradientUnits'), x1: g.getAttribute('x1'), x2: g.getAttribute('x2') };
    });
    expect(grad?.units).toBe('userSpaceOnUse');
    expect(grad?.x1).not.toBe(grad?.x2);

    const hitBefore = await attr(page, '#line_gap .line-hit-area', 'stroke');
    // the rule: tag:power recolours the line, base_svg dims the blueprint
    await page.evaluate(() => window.__setState('input_boolean.lcards_test_toggle', 'on'));
    await expect.poll(() => attr(page, '#line_gap .line-path', 'stroke'), { timeout: 5000 }).toMatch(/#ff0000|rgb\(255, 0, 0\)/i);
    expect(await attr(page, '#line_gap .line-hit-area', 'stroke')).toBe(hitBefore);
    await expect.poll(() => attr(page, '#__msd-base-content', 'filter'), { timeout: 5000 }).toMatch(/opacity\(0\.3\)/);
    // transition: 0 switches at once (D2 batch 5: `|| 1000` turned it into a 1 s fade)
    expect(await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *')).renderRoot.querySelector('#__msd-base-content').style.transition)).not.toMatch(/1000ms/);

    // off again: the blueprint goes back to its own (no) filters, the line to its own colour
    await page.evaluate(() => window.__setState('input_boolean.lcards_test_toggle', 'off'));
    await expect.poll(() => attr(page, '#line_gap .line-path', 'stroke'), { timeout: 5000 }).not.toMatch(/#ff0000|rgb\(255, 0, 0\)/i);
    await expect.poll(() => attr(page, '#__msd-base-content', 'filter'), { timeout: 5000 }).not.toMatch(/opacity\(0\.3\)/);
    await expectNoErrors(page);
});

test('percentage anchors resolve against the view box (a control on "80%", "40%" is centred at 640, 120)', async ({ page }) => {
    await mountCase(page, 'msd-percent-anchors', { width: '800' });
    await expect.poll(() => attr(page, 'foreignObject', 'x'), { timeout: 10000 }).not.toBeNull();
    expect(Number(await attr(page, 'foreignObject', 'x'))).toBeCloseTo(540, 0);
    expect(Number(await attr(page, 'foreignObject', 'y'))).toBeCloseTo(85, 0);
    await expectNoErrors(page);
});

test('a line with no sides leaves from the nearest sides; percentage positions; a blueprint from a served path', async ({ page }) => {
    await mountCase(page, 'msd-auto-side', { width: '800' });
    await expect.poll(() => attr(page, '#link .line-path', 'd'), { timeout: 10000 }).not.toBeNull();
    // right_box at 75% / 33.3% of 800 x 300 is x 600, y 100
    await expect.poll(() => page.evaluate(() => {
        const card = /** @type {any} */ (document.querySelector('#mount > *'));
        const r = card.renderRoot.querySelector('#right_box rect');
        return r ? [Number(r.getAttribute('x')), Math.round(Number(r.getAttribute('y')))] : null;
    })).toEqual([600, 100]);
    // left_box's right edge is x 150, right_box's left edge x 600; centres are y 150
    const d = /** @type {string} */ (await attr(page, '#link .line-path', 'd'));
    const nums = (d.match(/-?[\d.]+/g) ?? []).map(Number);
    expect(nums[0]).toBeCloseTo(150, 0);
    expect(nums[1]).toBeCloseTo(150, 0);
    expect(nums[nums.length - 2]).toBeCloseTo(600, 0);
    expect(nums[nums.length - 1]).toBeCloseTo(150, 0);
    // the blueprint came from /lcards/msd/... (a served path, not /local/)
    await expect.poll(() => page.evaluate(() => {
        const card = /** @type {any} */ (document.querySelector('#mount > *'));
        return card.renderRoot.querySelectorAll('#__msd-base-content *').length;
    }), { timeout: 10000 }).toBeGreaterThan(10);
    await expectNoErrors(page);
});

test('a rule that matches as the card loads colours the line from the start, and lets go after', async ({ page }) => {
    await mountCase(page, 'msd-rule-at-load', { width: '800' });
    await expect.poll(() => attr(page, '#line_a .line-path', 'stroke'), { timeout: 10000 }).toMatch(/#ff0000|rgb\(255, 0, 0\)/i);
    await page.evaluate(() => window.__setState('light.demo', 'off'));
    await expect.poll(() => attr(page, '#line_a .line-path', 'stroke'), { timeout: 5000 }).toMatch(/#ff9900|rgb\(255, 153, 0\)/i);
    await expectNoErrors(page);
});

test('two rules on one MSD line: the higher priority colour wins, the other rule\'s width still applies (D2 batch 5)', async ({ page }) => {
    await mountCase(page, 'msd-two-rules', { width: '800' });
    await expect.poll(() => attr(page, '#line_a .line-path', 'stroke'), { timeout: 10000 }).toMatch(/#ff0000|rgb\(255, 0, 0\)/i);
    expect(await attr(page, '#line_a .line-path', 'stroke-width')).toBe('9');
    await expectNoErrors(page);
});

test('leader lines: a line from a corner along the top edge sits inside it (flush with a bracket bar); route angled draws a stub then a diagonal', async ({ page }) => {
    await mountCase(page, 'msd-leader-lines', { width: '800' });
    await expect.poll(() => attr(page, '#bracket_line .line-path', 'd'), { timeout: 10000 }).not.toBeNull();
    await expect.poll(() => attr(page, '#angled_line .line-path', 'd'), { timeout: 10000 }).not.toBeNull();
    // The bracket's top-right corner is (240, 100): the 6-wide line starts 3 below it
    // and 3 inside it (overlapping the border bar, so no seam where they meet)
    const d = /** @type {string} */ (await attr(page, '#bracket_line .line-path', 'd'));
    const nums = (d.match(/-?[\d.]+/g) ?? []).map(Number);
    expect(nums[0]).toBeCloseTo(237, 0);
    expect(nums[1]).toBeCloseTo(103, 0);
    // then along the top edge (same y), before turning down to (500, 250)
    expect(nums[3]).toBeCloseTo(103, 0);
    // angled: (700, 50) -> stub to (660, 50) -> straight to (400, 200)
    const a = (/** @type {string} */ (await attr(page, '#angled_line .line-path', 'd')).match(/-?[\d.]+/g) ?? []).map(Number);
    expect(a).toEqual([700, 50, 660, 50, 400, 200]);
    await expectNoErrors(page);
});

// 2026-11-17 (perf review Tier 3 item 11): every card's rules callback gets the
// patches of every matching rule on the page. The MSD kept them all, so a rule for
// any other card changed its patch map and redrew the whole MSD (every line
// re-routed, its animations restarted): 19 redraws for 20 changes of a button rule.
/** Count the MSD's full re-renders from now on. */
const countReRenders = (page) => page.evaluate(() => {
    const co = /** @type {any} */ (window).__card._msdPipeline.coordinator;
    const orig = co._reRenderCallback;
    /** @type {any} */ (window).__reRenders = 0;
    co._reRenderCallback = (/** @type {any[]} */ ...a) => { /** @type {any} */ (window).__reRenders++; return orig.apply(co, a); };
});
const reRenders = (page) => page.evaluate(() => /** @type {any} */ (window).__reRenders);
const ready = (page) => expect.poll(() => page.evaluate(() => !!(/** @type {any} */ (window).__card._msdPipeline?.coordinator?._reRenderCallback)), { timeout: 10000 }).toBe(true);

for (const [kind, patch] of /** @type {const} */ ([
    ['text', { text: { name: { content: 'ON' } } }],
    ['style', { style: { card: { color: { background: 'var(--lcars-alert-red)' } } } }],
])) {
    test(`a rule for another card (${kind} patch) does not redraw the MSD`, async ({ page }) => {
        await mountCase(page, 'msd-foreign-rule', { width: '800' });
        await ready(page);
        await page.evaluate(async (patch) => {
            await /** @type {any} */ (window).__mountExtra({
                type: 'custom:lcards-button', id: 'other_button', preset: 'lozenge', entity: 'light.demo',
                text: { name: { content: 'OTHER', show: true } },
                rules: [{ id: 'other_only', when: { entity: 'light.demo', state: 'on' }, apply: { overlays: { other_button: patch } } }],
            });
        }, patch);
        await page.waitForTimeout(1000);
        await countReRenders(page);
        for (const state of ['off', 'on', 'off', 'on']) {
            await page.evaluate((s) => window.__setState('light.demo', s), state);
            await page.waitForTimeout(300);
        }
        expect(await reRenders(page)).toBe(0);
        await expectNoErrors(page);
    });
}

test("the MSD's own rule: a style-only patch is drawn without a re-render; a patch with other keys clears when the rule stops matching", async ({ page }) => {
    await mountCase(page, 'msd-foreign-rule', { width: '800' });
    await ready(page);
    const config = JSON.parse(JSON.stringify(await page.evaluate(() => /** @type {any} */ (window).__card.config)));
    config.rules = [
        { id: 'own_style', when: { entity: 'light.demo', state: 'on' }, apply: { overlays: { line_2: { style: { width: 9 } } } } },
        // attach_to has no effect on a drawn line; its style used to stay merged in for good
        { id: 'own_mixed', when: { entity: 'light.demo', state: 'on' }, apply: { overlays: { line_1: { attach_to: [600, 300], style: { width: 12 } } } } },
    ];
    await page.evaluate((c) => /** @type {any} */ (window).__reconfigure(c), config);
    await page.evaluate(() => window.__setState('light.demo', 'off'));
    await ready(page);
    const width = (/** @type {string} */ id) => attr(page, `#${id} .line-path`, 'stroke-width');
    await expect.poll(() => width('line_1'), { timeout: 10000 }).toBe('4');
    await page.evaluate(() => window.__setState('light.demo', 'on'));
    await expect.poll(() => width('line_1'), { timeout: 10000 }).toBe('12');
    expect(await width('line_2')).toBe('9');
    await page.evaluate(() => window.__setState('light.demo', 'off'));
    await expect.poll(() => width('line_1'), { timeout: 10000 }).toBe('4');
    expect(await width('line_2')).toBe('4');

    // style only: written onto the elements, no re-render
    config.rules = [config.rules[0]];
    await page.evaluate((c) => /** @type {any} */ (window).__reconfigure(c), config);
    await ready(page);
    await expect.poll(() => width('line_2'), { timeout: 10000 }).toBe('4');
    await countReRenders(page);
    await page.evaluate(() => window.__setState('light.demo', 'on'));
    await expect.poll(() => width('line_2'), { timeout: 10000 }).toBe('9');
    expect(await reRenders(page)).toBe(0);
    await expectNoErrors(page);
});
