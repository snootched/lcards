/**
 * Check Your Config page: the broken example shows its mistakes with docs links,
 * "Fix it" gets to all clear, and pasted YAML is checked as you type.
 */
import { test, expect, watchErrors } from './support.js';

const URL = '/getting-started/config-checker';
/** Replace the editor's YAML (CodeMirror view from the DOM). */
const setYaml = (page, text) => page.locator('.cc .cm-content').evaluate((el, t) => {
    const view = el.cmTile.root.view;
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: t } });
}, text);

test('the broken example is reported, then fixed', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(URL);
    await page.getByRole('button', { name: 'Try a broken example' }).click();
    const summary = page.getByTestId('checker-summary');
    await expect(summary).toHaveText(/2 errors and 3 warnings in 1 card/, { timeout: 20_000 });
    await expect(page.locator('.cc-issue')).toHaveCount(5);
    await expect(page.locator('.cc-issue').first()).toContainText('did you mean "color"');
    await expect(page.locator('.cc-issue a.cc-docs')).toHaveCount(5);

    await page.getByRole('button', { name: 'Fix it' }).click();
    await expect(summary).toHaveText(/All clear/);
    await expect(page.locator('.cc-pair tbody tr')).toHaveCount(5);
    expect(errors).toEqual([]);
});

test('pasted YAML is checked as you type', async ({ page }) => {
    await page.goto(URL);
    await expect(page.getByTestId('checker-results')).toContainText('Paste a card', { timeout: 20_000 });
    await setYaml(page, 'type: custom:lcards-slider\nentity: input_number.x\npressets: pills\n');
    await expect(page.locator('.cc-issue')).toHaveCount(1);
    await expect(page.locator('.cc-issue')).toContainText('pressets');
    await setYaml(page, 'type: custom:lcards-button\n  bad: : x\n');
    await expect(page.getByTestId('checker-results')).toContainText("isn't valid YAML (line 2)");
});
