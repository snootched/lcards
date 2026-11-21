/**
 * Chart redraws (2026-11-17, perf review item 13). The fetcher delivers every
 * changed series in one loop (a flush; the minute tick that moves a rolling window
 * to now, so the chart follows real time with no new data). Each delivery updated
 * the chart twice (the window, then the series): a chart of four series drew eight
 * times a minute while idle. Now once per flush, the same two calls.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

test('four series: the minute tick moves the window to now and redraws once, with every series', async ({ page }) => {
    await mountCase(page, 'chart-four-series', { width: '600', height: '300' });
    await page.waitForFunction(() => window.__card?._chartReady && window.__card?._dataArrived, null, { timeout: 15000 });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
        const ch = /** @type {any} */ (window).__card._chart;
        /** @type {any} */ (window).__calls = [];
        for (const m of ['updateOptions', 'updateSeries']) {
            const o = ch[m].bind(ch);
            ch[m] = (/** @type {any[]} */ ...a) => { /** @type {any} */ (window).__calls.push(m); return o(...a); };
        }
    });
    const max0 = await page.evaluate(() => /** @type {any} */ (window).__card._chart.w.config.xaxis.max);
    await page.waitForTimeout(1100); // past the flush throttle, and time moves on
    await page.evaluate(() => /** @type {any} */ (window).__card._fetcher._onWindowTick());
    await expect.poll(() => page.evaluate(() => /** @type {any} */ (window).__calls.length), { timeout: 3000 }).toBeGreaterThan(0);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => /** @type {any} */ (window).__calls)).toEqual(['updateOptions', 'updateSeries']);
    const after = await page.evaluate(() => {
        const w = /** @type {any} */ (window).__card._chart.w;
        return { max: w.config.xaxis.max, series: w.config.series.map((/** @type {any} */ s) => s.data.length) };
    });
    // the window ends now: it moved on by the time that passed (the axis is in local time)
    expect(after.max - max0).toBeGreaterThanOrEqual(1000);
    expect(after.max - max0).toBeLessThan(10000);
    expect(after.series).toHaveLength(4);
    for (const n of after.series) expect(n).toBeGreaterThan(0);
    await expectNoErrors(page);
});
