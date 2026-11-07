/**
 * What a slider sets: control.attribute picks the action's value (a light's
 * colour temperature, not its brightness), and a slider with nothing to set
 * stays read-only even with locked: false.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

const calls = (page) => page.evaluate(() => window.__hass.serviceCalls);

test('control.attribute color_temp_kelvin sets the colour temperature', async ({ page }) => {
    const card = await mountCase(page, 'slider-color-temp', { width: '400', height: '60' });
    const input = card.locator('input.slider-input-overlay');
    await expect(input).toHaveCount(1);
    // the range is the light's colour temperature, in kelvin
    expect(Number(await input.evaluate(el => el.min))).toBeGreaterThanOrEqual(1000);
    expect(Number(await input.evaluate(el => el.max))).toBeGreaterThan(4000);
    await input.evaluate(el => {
        el.value = '4000';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expect.poll(() => calls(page)).toHaveLength(1);
    const [call] = await calls(page);
    expect(call.domain).toBe('light');
    expect(call.service).toBe('turn_on');
    expect(call.data).toEqual({ entity_id: 'light.demo', color_temp_kelvin: 4000 });
    await expectNoErrors(page);
});

test('a sensor stays read-only with locked: false', async ({ page }) => {
    const card = await mountCase(page, 'slider-sensor-unlocked', { width: '400', height: '60' });
    await expect(card.locator('lcards-slider, :scope').first()).toBeVisible();
    expect(await card.evaluate(el => el._controlConfig.locked)).toBe(true);
    await expect(card.locator('.slider-input-overlay')).toHaveCount(0);
    await expectNoErrors(page);
});

test('style.track.margin as one number insets every side', async ({ page }) => {
    const card = await mountCase(page, 'slider-pills', { width: '400', height: '80' });
    const width = () => card.locator('input.slider-input-overlay').evaluate(el => el.getBoundingClientRect().width);
    const withMargin = (margin) => page.evaluate((m) => window.__reconfigure({
        type: 'custom:lcards-slider', entity: 'light.demo', preset: 'pills-left-border',
        control: { attribute: 'brightness' }, style: { track: { margin: m } },
    }), margin);
    await withMargin(0);
    await page.waitForTimeout(300);
    const before = await width();
    await withMargin(20);
    await expect.poll(width).toBeCloseTo(before - 40, 0);
});

test('a flat gauge draws its scale labels at scale.labels.font_size', async ({ page }) => {
    const card = await mountCase(page, 'slider-gauge', { width: '400', height: '80' });
    const sizes = () => card.evaluate(el => [...el.shadowRoot.querySelectorAll('svg text')]
        .map(t => t.getAttribute('font-size')).filter(Boolean));
    expect(await sizes()).toContain('14px');
    await page.evaluate(() => window.__reconfigure({
        type: 'custom:lcards-slider', entity: 'sensor.demo_temperature', preset: 'gauge-basic',
        style: { track: { display: { min: -10, max: 40, unit: '°C' } }, gauge: { scale: { labels: { font_size: 20 } } } },
    }));
    await expect.poll(sizes).toContain('20px');
    expect(await sizes()).not.toContain('14px');
});

test('a marker caption on a one-row flat gauge stays on the card', async ({ page }) => {
    const card = await mountCase(page, 'slider-gauge-marker-caption', { width: '400', height: '56' });
    const caption = card.locator('[data-lcards-role="range-marker-label"]');
    await expect(caption).toHaveCount(1);
    const [c, k] = await Promise.all([caption.boundingBox(), card.boundingBox()]);
    expect(c.y).toBeGreaterThanOrEqual(k.y - 0.5);
    expect(c.y + c.height).toBeLessThanOrEqual(k.y + k.height + 0.5);
});

test('Picard ranges sit on the display scale, split by the border colour', async ({ page }) => {
    const card = await mountCase(page, 'slider-picard-ranges', { width: '220', height: '400' });
    const bands = await card.evaluate(el => {
        const zone = el.shadowRoot.querySelector('#range-zone');
        const h = Number(zone.getAttribute('data-bounds').split(',')[3]);
        return {
            h,
            bands: [...zone.querySelectorAll('rect.range-bg')].map(r => ({ y: +r.getAttribute('y'), height: +r.getAttribute('height') })),
            borders: [...zone.querySelectorAll('rect.range-border')].map(r => getComputedStyle(r).fill || r.getAttribute('fill')),
        };
    });
    // two bands, each half the column (0-20 and 20-40 on a 0-40 scale), less the 4 px line
    expect(bands.bands).toHaveLength(2);
    for (const b of bands.bands) expect(b.height).toBeCloseTo(bands.h / 2 - 4, 0);
    expect(bands.borders).toHaveLength(2);
    expect(new Set(bands.borders).size).toBe(1);
    expect(bands.borders[0]).not.toMatch(/black|rgb\(0, 0, 0\)/);
});

test('upright sliders ask a sections view for a real cell; grid_options still wins', async ({ page }) => {
    // Without rows Home Assistant sizes the cell "auto" and an upright slider (drawn
    // to its cell height) collapsed to a strip; one column crushed it sideways.
    const card = await mountCase(page, 'slider-picard-gauge', { width: '220', height: '400' });
    const grid = () => card.evaluate(el => el.getGridOptions());
    expect(await grid()).toMatchObject({ columns: 6, rows: 7 });
    const reconfigure = (extra) => page.evaluate((c) => window.__reconfigure(c), {
        type: 'custom:lcards-slider', entity: 'light.demo', preset: 'pills-basic',
        style: { track: { orientation: 'vertical' } }, ...extra,
    });
    await reconfigure({});
    await expect.poll(grid).toMatchObject({ columns: 3, rows: 4 });
    await reconfigure({ grid_options: { rows: 2, columns: 12 } });
    await expect.poll(grid).toMatchObject({ columns: 12, rows: 2 });
});
