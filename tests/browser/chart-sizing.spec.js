/**
 * Charts follow their card's size, and chart types ApexCharts sizes poorly get
 * fitted defaults (2026-10-18). The chart used to keep its first pixel size and
 * overflow a card that shrank; a radar used about half a wide card's height.
 */
import { test, expect } from '@playwright/test';
import { mountCase } from './support.js';

const svgSize = (page) => page.evaluate(() => {
    const svg = document.querySelector('#mount > *').shadowRoot.querySelector('svg.apexcharts-svg');
    const r = svg.getBoundingClientRect();
    return [Math.round(r.width), Math.round(r.height)];
});

test('the chart follows its card when the card is resized', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 700 });
    await mountCase(page, 'chart-two-series', { width: '900', height: '312' });
    await expect.poll(() => svgSize(page)).toEqual([900, 312]);
    await page.evaluate(() => Object.assign(document.getElementById('mount').style, { width: '450px', height: '250px' }));
    await expect.poll(() => svgSize(page)).toEqual([450, 250]);
    // ApexCharts' own min-height must not feed back into the size (it used to grow ~75px per redraw).
    await page.waitForTimeout(800);
    expect(await svgSize(page)).toEqual([450, 250]);
    await page.evaluate(() => Object.assign(document.getElementById('mount').style, { width: '700px', height: '400px' }));
    await expect.poll(() => svgSize(page)).toEqual([700, 400]);
});

test('a three-axis radar fills most of a wide card', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 600 });
    await mountCase(page, 'chart-two-series', { width: '900', height: '312' });
    await page.evaluate(async () => window.__reconfigure({
        type: 'custom:lcards-chart',
        chart_type: 'radar',
        sources: [
            { entity: 'sensor.demo_temperature', name: 'Toronto' },
            { entity: 'sensor.demo_outdoor_temperature', name: 'Bathroom' },
            { entity: 'sensor.demo_humidity', name: 'Bedroom' }
        ]
    }));
    const web = () => page.evaluate(() => {
        const root = document.querySelector('#mount > *').shadowRoot;
        const poly = root.querySelector('.apexcharts-radar-series polygon');
        return poly ? Math.round(poly.getBoundingClientRect().height) : 0;
    });
    await expect.poll(web).toBeGreaterThan(200); // ApexCharts alone: about 150
    const grid = await page.evaluate(() => [...document.querySelector('#mount > *').shadowRoot.querySelectorAll('.apexcharts-gridline')]
        .filter(l => l.getBoundingClientRect().width > 0 && getComputedStyle(l).display !== 'none' && l.closest('.apexcharts-grid')?.getAttribute('visibility') !== 'hidden').length);
    expect(grid).toBe(0);
});

test('a state change draws at once (the live history stream, a rolling window that ends now); one subscription per series', async ({ page }) => {
    const card = await mountCase(page, 'chart-live', { width: '600', height: '300' });
    const last = () => card.evaluate(el => /** @type {any} */ (el)._seriesPoints?.[0]?.at(-1)?.v);
    await expect.poll(last).not.toBeUndefined();
    await page.evaluate(() => window.__setState('input_number.demo_level', '87'));
    await expect.poll(last, { timeout: 2500 }).toBe(87);
    await page.evaluate(() => window.__setState('input_number.demo_level', '12'));
    await expect.poll(last, { timeout: 2500 }).toBe(12);
    // one series, one subscription (a start racing another start left a second one, drawing every update twice)
    const streams = await card.evaluate(el => /** @type {any} */ (el).hass.connection.subs.filter(s => s.active && s.message?.type === 'history/stream').length);
    expect(streams).toBe(1);
});

test('rangeBar timeline: state runs as bars in their colours; a state change opens a new bar (E1.2)', async ({ page }) => {
    const card = await mountCase(page, 'chart-timeline', { width: '600', height: '240' });
    const bars = () => card.evaluate(el => [...el.shadowRoot.querySelectorAll('.apexcharts-rangebar-area')].map(p => p.getAttribute('fill')));
    await expect.poll(async () => (await bars()).length).toBeGreaterThan(2);
    const fills = await bars();
    // the configured heat colour and the input_select's graph colour are both drawn (rgba from ApexCharts)
    expect(fills.some(f => /255,\s*119,\s*0/.test(f ?? ''))).toBe(true);
    expect(fills.every(f => f && f !== 'none')).toBe(true);
    // the mode row: one run (the helper's current value) until it changes
    const modeRuns = () => card.evaluate(el => /** @type {any} */ (el)._chart?.w?.config?.series?.[1]?.data?.map((d) => d.state));
    await expect.poll(modeRuns).toEqual(['Auto']);
    await page.evaluate(() => window.__setState('input_select.demo_mode', 'Cool'));
    await expect.poll(modeRuns, { timeout: 4000 }).toEqual(['Auto', 'Cool']);
    // the last bar reaches now: its end grows with the window
    const lastEnd = await card.evaluate(el => /** @type {any} */ (el)._chart.w.config.series[1].data.at(-1).y[1]);
    expect(lastEnd).toBeGreaterThan(0);
});


test('state bands: a thermostat\'s heat and cool runs shaded behind the line; a state change adds a band (E1.1)', async ({ page }) => {
    const card = await mountCase(page, 'chart-bands', { width: '600', height: '300' });
    const bands = () => card.evaluate(el => [...el.shadowRoot.querySelectorAll('.apexcharts-xaxis-annotations rect')]
        .filter(r => Number(r.getAttribute('width')) > 0).map(r => r.getAttribute('fill')));
    await expect.poll(async () => (await bands()).length).toBeGreaterThan(0);
    expect((await bands()).every(f => ['#ff7700', '#4455ff'].includes(f ?? ''))).toBe(true);
    // the line is still the only series
    expect(await card.evaluate(el => /** @type {any} */ (el)._chart.w.config.series.length)).toBe(1);
    const annotations = () => card.evaluate(el => /** @type {any} */ (el)._chart.w.config.annotations.xaxis.length);
    await page.evaluate(() => window.__setState('climate.demo_hall', 'off'));
    await page.waitForTimeout(1200);
    const before = await annotations();
    await page.evaluate(() => window.__setState('climate.demo_hall', 'heat'));
    // the new heat run opens a band only once it has length: wait for the next update
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.__setState('climate.demo_hall', 'cool'));
    await expect.poll(annotations, { timeout: 5000 }).toBeGreaterThan(before);
});
