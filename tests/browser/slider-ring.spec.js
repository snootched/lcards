/**
 * Slider `component: ring`: drag around the ring, entity updates move the value
 * arc in place, keyboard steps, locked rings take no input, presses on the
 * centre text do nothing.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

const SIZE = { width: '260', height: '260' };

/** Page point on the ring's stroke centre line at a fraction of the 270 degree sweep (from the card's own layout). */
async function ringPoint(page, fraction) {
    const box = await page.locator('lcards-slider .ring-overlay').boundingBox();
    const ring = await page.locator('lcards-slider').evaluate(el => {
        const l = el._ringLayout;
        return { cx: l.cx - l.box.x, cy: l.cy - l.box.y, r: l.rMid };
    });
    const deg = -135 + 270 * fraction;
    const rad = deg * Math.PI / 180;
    return { x: box.x + ring.cx + ring.r * Math.sin(rad), y: box.y + ring.cy - ring.r * Math.cos(rad) };
}

const calls = (page) => page.evaluate(() => window.__hass.serviceCalls);
const dash = (page) => page.locator('lcards-slider').evaluate(el =>
    el.shadowRoot.querySelector('[data-lcards-role="progress-fill"]').getAttribute('stroke-dasharray'));

test('ring: drag from 25% to 75% round the top sets the light to ~75%', async ({ page }) => {
    await mountCase(page, 'slider-ring', SIZE);
    const start = await ringPoint(page, 0.25);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) {
        const p = await ringPoint(page, 0.25 + 0.05 * i);
        await page.mouse.move(p.x, p.y);
    }
    // While dragging, the value arc follows the pointer without a commit.
    expect(parseFloat(await dash(page))).toBeCloseTo(0.75, 1);
    expect(await calls(page)).toEqual([]);
    await page.mouse.up();

    await expect.poll(() => calls(page)).toHaveLength(1);
    const [call] = await calls(page);
    expect(call.domain).toBe('light');
    expect(call.service).toBe('turn_on');
    expect(call.data.brightness).toBeGreaterThanOrEqual(186);
    expect(call.data.brightness).toBeLessThanOrEqual(196);
    await expectNoErrors(page);
});

test('ring: an entity update moves the value arc', async ({ page }) => {
    await mountCase(page, 'slider-ring', SIZE);
    await page.evaluate(() => window.__setState('light.demo', { state: 'on', attributes: { brightness: 51 } }));
    await expect.poll(async () => parseFloat(await dash(page))).toBeCloseTo(0.2, 2);
});

test('ring: arrow keys change by one step and commit once', async ({ page }) => {
    await mountCase(page, 'slider-picard-ring', SIZE);
    await page.locator('lcards-slider .ring-overlay').focus();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => calls(page)).toEqual([
        { domain: 'input_number', service: 'set_value', data: { entity_id: 'input_number.demo_level', value: 41 } },
    ]);
    await page.keyboard.press('End');
    await expect.poll(() => calls(page)).toHaveLength(2);
    expect((await calls(page))[1].data.value).toBe(100);
});

test('ring: a press on the centre text does nothing', async ({ page }) => {
    await mountCase(page, 'slider-ring', SIZE);
    const box = await page.locator('lcards-slider .ring-overlay').boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(300);
    expect(await calls(page)).toEqual([]);
});

test('ring: a sensor ring is read-only (no input overlay)', async ({ page }) => {
    await mountCase(page, 'slider-ring-locked', SIZE);
    await expect.poll(() => page.locator('lcards-slider').evaluate(el => !!el.shadowRoot.querySelector('[data-lcards-role="progress-fill"]'))).toBe(true);
    expect(await page.locator('lcards-slider .ring-overlay').count()).toBe(0);
    await expectNoErrors(page);
});

const ringInfo = (page) => page.locator('lcards-slider').evaluate(el => {
    const root = el.shadowRoot;
    return {
        scaleLabels: [...root.querySelectorAll('[data-lcards-role="ring-scale-labels"] text')].map(t => t.textContent),
        ticks: root.querySelectorAll('[data-lcards-role="ring-ticks"] line').length,
        markers: [...root.querySelectorAll('[data-lcards-role="range-marker"]')].map(g => g.firstElementChild?.tagName),
        labels: [...root.querySelectorAll('[data-lcards-role="range-marker-label"]')].map(t => ({ text: t.textContent, transform: t.getAttribute('transform') })),
    };
});

test('ring: the scale draws ticks and value labels; markers take their indicator type', async ({ page }) => {
    await mountCase(page, 'slider-picard-ring', SIZE);
    await expect.poll(async () => (await ringInfo(page)).scaleLabels).toEqual(['0', '20', '40', '60', '80', '100']);
    const info = await ringInfo(page);
    expect(info.ticks).toBe(6 + 15);                     // majors every 20, minors every 5 between them
    expect(info.markers).toEqual(['polygon']);           // indicator.type: triangle
    expect(info.labels.map(l => l.text)).toEqual(['SET']);
    await expectNoErrors(page);
});

test('ring: marker labels render and follow their marker when its value changes', async ({ page }) => {
    await mountCase(page, 'slider-ring-markers', SIZE);
    await expect.poll(async () => (await ringInfo(page)).markers).toEqual(['line', 'circle', 'polygon']);
    const before = (await ringInfo(page)).labels;
    expect(before.map(l => l.text)).toEqual(['TARGET']);
    await page.evaluate(() => window.__setState('input_number.demo_level', '90'));
    await expect.poll(async () => (await ringInfo(page)).labels[0]?.transform).not.toBe(before[0].transform);
    await expectNoErrors(page);
});

test('ring: no focus outline by default; style.ring.focus_ring: true shows it on keyboard focus', async ({ page }) => {
    await mountCase(page, 'slider-ring', SIZE);
    const overlay = page.locator('lcards-slider .ring-overlay');
    const outline = () => overlay.evaluate(el => getComputedStyle(el).outlineStyle);
    await page.keyboard.press('Tab');
    await expect(overlay).toBeFocused();
    expect(await outline()).toBe('none');

    await page.evaluate(() => window.__reconfigure({
        type: 'custom:lcards-slider', entity: 'light.demo', preset: 'ring',
        control: { attribute: 'brightness' }, style: { ring: { focus_ring: true } },
    }));
    await expect.poll(() => overlay.evaluate(el => el.classList.contains('show-focus'))).toBe(true);
    await page.locator('body').click({ position: { x: 1, y: 1 } });
    await page.keyboard.press('Tab');
    await expect(overlay).toBeFocused();
    expect(await outline()).toBe('solid');
    await expectNoErrors(page);
});

test('ring: debug_zones outlines the rectangle zones only (the `_ring` layout zone has no box)', async ({ page }) => {
    // Regression (2026-11-06): `_ring` holds the centre and radii, no x/y/width/height,
    // and made every debug rect and label NaN ("Expected length" console errors).
    const browserErrors = [];
    page.on('console', (m) => { if (m.type() === 'error') browserErrors.push(m.text()); });
    await mountCase(page, 'slider-ring', SIZE);
    await page.evaluate(() => window.__reconfigure({
        type: 'custom:lcards-slider', entity: 'light.demo', preset: 'ring',
        control: { attribute: 'brightness' }, debug_zones: true,
    }));
    const card = page.locator('lcards-slider');
    await expect.poll(() => card.evaluate(el => !!el.shadowRoot.querySelector('#lcards-zone-debug'))).toBe(true);
    const overlay = await card.evaluate((el) => {
        const g = el.shadowRoot.querySelector('#lcards-zone-debug');
        if (!g) return null;
        const nums = [...g.querySelectorAll('rect, text')].flatMap(n =>
            ['x', 'y', 'width', 'height', 'font-size', 'stroke-width'].map(a => n.getAttribute(a)).filter(v => v !== null));
        return { labels: [...g.querySelectorAll('text')].map(t => t.textContent), nums };
    });
    expect(overlay).not.toBeNull();
    expect(overlay.labels).toEqual(expect.arrayContaining(['center', 'label', 'value', 'sublabel']));
    expect(overlay.labels).not.toContain('_ring');
    expect(overlay.nums.every(v => Number.isFinite(Number(v)))).toBe(true);
    expect(browserErrors.filter(e => /Expected length/.test(e))).toEqual([]);
    await expectNoErrors(page);
});
