/**
 * Chart Studio's series list: Add series shows the new series on the first click
 * and the delete button removes it. The studio used to edit its working config in
 * place, so the list's `config` property never changed and it did not re-render
 * (Add looked dead until a second click showed two; delete only worked in YAML).
 */
import { test, expect } from '@playwright/test';
import { mountCase } from './support.js';

test('add and remove a series in the Chart Studio', async ({ page }) => {
    await mountCase(page, 'chart-line', { height: '300' });
    const counts = await page.evaluate(async () => {
        await customElements.get('lcards-chart').getConfigElement(); // loads the editor chunk
        await customElements.whenDefined('lcards-chart-studio-dialog');
        const studio = /** @type {any} */ (document.createElement('lcards-chart-studio-dialog'));
        studio.config = { type: 'custom:lcards-chart', sources: [{ entity: 'sensor.demo_temperature' }] };
        document.body.appendChild(studio);
        await studio.updateComplete;
        const list = studio.shadowRoot.querySelector('lcards-chart-series-list-editor');
        const series = async () => {
            await studio.updateComplete;
            await list.updateComplete;
            return list.shadowRoot.querySelectorAll('lcards-form-section.series').length;
        };
        const result = { start: await series() };
        list.shadowRoot.querySelector('.header ha-button').click();
        result.afterAdd = await series();
        list.shadowRoot.querySelectorAll('ha-icon-button[slot="header-icons"]')[2].click(); // first series' delete
        result.afterRemove = await series();
        result.config = studio._workingConfig.sources;
        return result;
    });
    expect(counts.start).toBe(1);
    expect(counts.afterAdd).toBe(2);
    expect(counts.afterRemove).toBe(1);
    expect(counts.config).toEqual([{ entity: '' }]);
});

// With no series yet, the new one is index 0, which is already the expanded index,
// so nothing else changed to force a render (the "click twice" half of the bug).
test('the first series appears after one Add click', async ({ page }) => {
    await mountCase(page, 'chart-line', { height: '300' });
    const count = await page.evaluate(async () => {
        await customElements.get('lcards-chart').getConfigElement();
        await customElements.whenDefined('lcards-chart-studio-dialog');
        const studio = /** @type {any} */ (document.createElement('lcards-chart-studio-dialog'));
        studio.config = { type: 'custom:lcards-chart', sources: [] };
        document.body.appendChild(studio);
        await studio.updateComplete;
        const list = studio.shadowRoot.querySelector('lcards-chart-series-list-editor');
        await list.updateComplete;
        list.shadowRoot.querySelector('.header ha-button').click();
        await studio.updateComplete;
        await list.updateComplete;
        return list.shadowRoot.querySelectorAll('lcards-form-section.series').length;
    });
    expect(count).toBe(1);
});

// Every chart type's help panel links to its docs, and the footer Documentation
// button follows the active tab.
test('chart types and tabs link to the chart docs', async ({ page }) => {
    await mountCase(page, 'chart-line', { height: '300' });
    const result = await page.evaluate(async () => {
        await customElements.get('lcards-chart').getConfigElement();
        await customElements.whenDefined('lcards-chart-studio-dialog');
        const studio = /** @type {any} */ (document.createElement('lcards-chart-studio-dialog'));
        studio.config = { type: 'custom:lcards-chart', sources: [{ entity: 'a.a' }, { entity: 'b.b' }] };
        document.body.appendChild(studio);
        await studio.updateComplete;
        const links = {};
        for (const type of ['line', 'radar', 'pie', 'rangeBar', 'boxPlot']) {
            studio._workingConfig = { ...studio._workingConfig, chart_type: type };
            await studio.updateComplete;
            links[type] = [...studio.shadowRoot.querySelectorAll('.info-guide-links a')].map(a => a.getAttribute('href'))
                .find(h => h.includes('/cards/chart/'));
        }
        const tabs = {};
        for (const tab of ['data', 'appearance', 'advanced']) {
            studio._activeTab = tab;
            tabs[tab] = studio._tabDocs();
        }
        return { links, tabs };
    });
    expect(result.links.radar).toMatch(/\/cards\/chart\/index\.html#gallery$|\/cards\/chart\/#gallery$/);
    expect(result.links.rangeBar).toMatch(/\/cards\/chart\/styling\.html#raw-apexcharts-options$/);
    expect(result.links.boxPlot).toMatch(/\/cards\/chart\/series\.html#range-charts$/);
    expect(result.links.line).toBeTruthy();
    expect(result.links.pie).toBeTruthy();
    expect(result.tabs).toEqual({ data: '/cards/chart/series', appearance: '/cards/chart/styling', advanced: '/cards/chart/styling#raw-apexcharts-options' });
});
