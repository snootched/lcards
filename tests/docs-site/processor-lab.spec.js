/**
 * Processor labs (```yaml lab) on the processor reference page: each runs the real
 * processors over sample history and charts raw against processed values; editing
 * the YAML re-runs it; bad configs show an error; Reset restores the example.
 */
import { readFileSync } from 'node:fs';
import { test, expect, watchErrors } from './support.js';

const URL = '/core/datasources/processor-reference';
const LAB_COUNT = (readFileSync('doc/core/datasources/processor-reference.md', 'utf8').match(/^```ya?ml lab$/gm) ?? []).length;

/**
 * Scroll to a lab (labs start when they come into view) and wait for its chart.
 * Scrolls again until it shows: VitePress scrolls to the top once it has loaded,
 * which can undo a scroll made earlier.
 */
async function openLab(page, index) {
    const lab = page.locator('.processor-lab').nth(index);
    const chart = lab.locator('.processor-lab-chart .apexcharts-svg');
    await expect.poll(async () => {
        await lab.scrollIntoViewIfNeeded();
        return chart.isVisible();
    }, { timeout: 20_000, intervals: [250, 500, 1000] }).toBe(true);
    return lab;
}
const seriesCount = (lab) => lab.locator('.apexcharts-series[seriesName]').count();
/** Replace the editor's YAML (CodeMirror view from the DOM). */
const setYaml = (lab, text) => lab.locator('.cm-content').evaluate((el, t) => {
    const view = el.cmTile.root.view;
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: t } });
}, text);

test('every lab charts raw and processed values with no errors', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(URL);
    await expect(page.locator('.processor-lab')).toHaveCount(LAB_COUNT);
    expect(LAB_COUNT).toBeGreaterThanOrEqual(13);
    for (let i = 0; i < LAB_COUNT; i++) {
        const lab = await openLab(page, i);
        expect(await seriesCount(lab), `lab ${i + 1} series`).toBeGreaterThanOrEqual(1);
        await expect(lab.locator('.processor-lab-table tbody tr').first()).toBeVisible();
        await expect(lab.locator('.processor-lab-messages .is-error')).toHaveCount(0);
        // The example's YAML is in the page (rendered at build time) until Edit.
        await expect(lab.locator('.processor-lab-source pre')).toBeVisible();
    }
    expect(errors).toEqual([]);
});

test('editing a lab re-runs it; a bad config shows an error; Reset restores it', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(URL);
    const lab = await openLab(page, 0); // convert_unit: raw + fahrenheit
    expect(await seriesCount(lab)).toBe(2);
    await lab.getByRole('button', { name: 'Edit' }).click();
    await expect(lab.locator('.cm-content')).toBeVisible();
    // The lab has no quick settings: no empty section in its editor.
    await expect(lab.locator('summary', { hasText: 'Quick settings' })).toHaveCount(0);

    await setYaml(lab, 'entity: sensor.demo_temperature\nprocessing:\n  fahrenheit:\n    type: convert_unit\n    from: c\n    to: f\n  rounded:\n    type: round\n    input_source: fahrenheit\n');
    await expect.poll(() => seriesCount(lab)).toBe(3);
    await expect(lab.locator('.processor-lab-table tbody tr')).toHaveCount(2);
    await expect(lab.locator('.processor-lab-order')).toContainText('fahrenheit → rounded');

    // "Use it in a chart" follows the edit
    await lab.locator('.processor-lab-chart-yaml summary').click();
    await expect(lab.locator('.processor-lab-chart-yaml pre')).toContainText('type: custom:lcards-chart');
    await expect(lab.locator('.processor-lab-chart-yaml pre')).toContainText('buffer: rounded');

    await setYaml(lab, 'entity: sensor.demo_temperature\nprocessing:\n  odd:\n    type: nope\n');
    await expect(lab.locator('.processor-lab-chart-yaml')).toHaveCount(0);
    await expect(lab.locator('.processor-lab-messages .is-error')).toContainText('Unknown processor type: nope');

    await lab.getByRole('button', { name: 'Reset' }).click();
    await expect(lab.locator('.processor-lab-messages .is-error')).toHaveCount(0);
    await expect.poll(() => seriesCount(lab)).toBe(2);
    // The real ProcessorManager logs the bad config too; nothing else may fail.
    expect(errors.filter(e => !/Unknown processor type: nope/.test(e))).toEqual([]);
});
