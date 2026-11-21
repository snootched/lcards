/**
 * Preview Your YAML page (getting-started/preview.md, <PreviewBoard />): a link with the
 * YAML in its hash mounts the real cards with the checker's verdict, a dashboard gets a
 * tab per view, "Copy link" writes a link that reopens the same preview, and bad YAML,
 * a cut-off link and a strategy each say so.
 */
import { encodePreview, PREVIEW_SAMPLE } from '../../doc/.vitepress/theme/preview-link.js';
import { test, expect, watchErrors } from './support.js';

const URL = '/getting-started/preview';
const stage = (page) => page.getByTestId('preview-stage');
/** Wait until the page has mounted every card of view `index`. */
const ready = (page, index = 0) => page.waitForFunction((i) => document.querySelector('[data-testid="preview-stage"]')?.dataset.ready === String(i), index, { timeout: 45_000 });
const setYaml = (page, text) => page.locator('.pv .cm-content').evaluate((el, t) => {
    const view = el.cmTile.root.view;
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: t } });
}, text);

test('a preview link shows its cards and the checker finds no problems', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(`${URL}#${await encodePreview(PREVIEW_SAMPLE)}`);
    await ready(page);
    await expect(stage(page).locator('lcards-button')).toHaveCount(4);
    await expect(stage(page).locator('lcards-elbow, lcards-slider')).toHaveCount(2);
    await expect(page.getByTestId('preview-check')).toContainText('no problems', { timeout: 20_000 });
    // the source is folded away for a link
    await expect(page.locator('.pv-source')).not.toHaveAttribute('open', '');
    expect(errors).toEqual([]);
});

test('a dashboard gets a tab per view, and Copy link reopens the same preview', async ({ page }) => {
    await page.goto(URL);
    await page.locator('.pv .cm-content').waitFor();
    const dash = [
        'views:',
        '  - title: Bridge',
        '    sections:',
        '      - cards:',
        '          - type: custom:lcards-button',
        '            preset: lozenge',
        '            entity: light.bridge',
        '  - title: Engineering',
        '    cards:',
        '      - type: custom:lcards-slider',
        '        preset: pills-basic',
        '        entity: light.engineering',
        '      - type: custom:lcards-slider',
        '        preset: gauge-basic',
        '        entity: sensor.core_temperature',
        '',
    ].join('\n');
    await setYaml(page, dash);
    await expect(page.getByRole('tab')).toHaveText(['Bridge', 'Engineering'], { timeout: 20_000 });
    await ready(page, 0);
    await expect(stage(page).locator('lcards-button')).toHaveCount(1);
    await page.getByRole('tab', { name: 'Engineering' }).click();
    await ready(page, 1);
    await expect(stage(page).locator('lcards-button')).toHaveCount(0);
    await expect(stage(page).locator('lcards-slider')).toHaveCount(2);

    await page.getByTestId('preview-copy').click();
    await expect.poll(() => page.evaluate(() => location.hash)).toMatch(/^#yaml=/);
    const link = page.url();
    await page.goto('about:blank');
    await page.goto(link);
    // a fresh page: the component and the bundle load first
    await expect(page.getByRole('tab')).toHaveText(['Bridge', 'Engineering'], { timeout: 20_000 });
});

test('bad YAML, a cut-off link and a strategy each say so', async ({ page }) => {
    const hash = await encodePreview(PREVIEW_SAMPLE);
    await page.goto(`${URL}#${hash.slice(0, 30)}`);
    await expect(page.getByTestId('preview-problem')).toContainText('could not be read');

    await page.goto(URL);
    await page.locator('.pv .cm-content').waitFor();
    await setYaml(page, 'type: custom:lcards-button\n  bad: : x\n');
    await expect(page.getByTestId('preview-problem')).toContainText("isn't valid YAML");
    await setYaml(page, 'strategy:\n  type: custom:lcars-shell\n');
    await expect(page.locator('.pv-note').first()).toContainText('strategy');
});
