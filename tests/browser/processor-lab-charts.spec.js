/**
 * The chart config each processor lab offers ("Use it in a chart") renders in the
 * real lcards-chart card: its data source preloads sample history, runs the
 * processors, and every series draws.
 */
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { mountCase, cardErrors } from './support.js';

// The lab's code imports src/ modules: load them with the node test shims (window, version).
await import('../setup/browser-shims.js');
const { runLab, labChartConfig } = await import('../../doc/.vitepress/theme/processor-lab-core.js');

const LABS = [...readFileSync('doc/core/datasources/processor-reference.md', 'utf8').matchAll(/^```ya?ml lab\n([\s\S]*?)^```/gm)].map(m => m[1]);

for (const [i, text] of LABS.entries()) {
    const config = yaml.load(text);
    const { chart } = labChartConfig(config, runLab(config)) ?? {};

    test(`processor lab ${i + 1}: its chart config draws every series in lcards-chart`, async ({ page }) => {
        expect(chart).toBeTruthy();
        // Serve the generated config as a harness fixture.
        await page.route('**/fixtures/zz-processor-lab.yaml', route => route.fulfill({ contentType: 'text/yaml', body: yaml.dump(chart) }));
        await mountCase(page, 'zz-processor-lab', { height: '300' });
        await expect(page.locator('lcards-chart .apexcharts-canvas')).toBeVisible({ timeout: 15_000 });
        const series = page.locator('lcards-chart .apexcharts-series[seriesName]');
        await expect(series).toHaveCount(chart.sources.length);
        // Every series has a drawn line (the data source preloaded and processed history).
        const lengths = await page.locator('lcards-chart .apexcharts-series[seriesName]').evaluateAll(
            groups => groups.map(g => Math.max(0, ...[...g.querySelectorAll('path')].map(p => (p.getAttribute('d') ?? '').length))));
        for (const [n, len] of lengths.entries()) expect(len, `series ${chart.sources[n].name}`).toBeGreaterThan(100);
        expect(await cardErrors(page)).toEqual([]);
    });
}
