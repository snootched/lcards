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
