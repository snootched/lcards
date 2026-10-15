/**
 * Card playgrounds: quick settings, schema completion, Insert and Copy YAML all
 * drive the real card.
 */
import { test, expect, watchErrors, waitForDemos, demoState } from './support.js';

const PLAYGROUNDS = [
    // [url, card tag, quick-setting label, value to pick]
    ['/cards/button/playground', 'lcards-button', 'Preset', 'barrel'],
    ['/cards/elbow/playground', 'lcards-elbow', 'Elbow type', 'footer-right'],
    ['/cards/slider-card/playground', 'lcards-slider', 'Preset', 'gauge-basic'],
    ['/cards/select-menu/playground', 'lcards-select-menu', 'Preset', 'barrel'],
];

/** YAML currently in the playground editor. */
const editorText = (page) => page.evaluate(() => document.querySelector('.cm-content').cmTile.root.view.state.doc.toString());

for (const [url, tag, label, value] of PLAYGROUNDS) {
    test(`${url}: starters, quick settings, completion, Insert and Copy`, async ({ page, context }) => {
        const errors = watchErrors(page);
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
        await page.goto(url);
        await waitForDemos(page, 1);
        expect((await demoState(page))[0].card).toBe(tag);

        // Every starter renders without errors or warnings.
        const starters = await page.locator('.card-demo-toolbar select option').evaluateAll(os => os.map(o => o.value));
        expect(starters.length).toBeGreaterThan(1);
        for (const key of starters) {
            await page.locator('.card-demo-toolbar select').selectOption(key);
            await page.waitForTimeout(700);
            const [d] = await demoState(page);
            expect(d.card, key).toBe(tag);
            expect(d.messages, key).toEqual([]);
        }

        // A quick setting rewrites the YAML and the card re-renders with it.
        await page.locator('.card-demo-toolbar select').selectOption(starters[0]);
        await page.waitForTimeout(700);
        const control = page.locator('.pg-control', { hasText: label }).locator('select');
        await control.selectOption(value);
        await expect.poll(() => editorText(page)).toContain(value);
        await expect.poll(() => page.evaluate((t) => document.querySelector(`.card-demo-mount ${t}`)?.config?.preset ?? document.querySelector(`.card-demo-mount ${t}`)?.config?.elbow?.type, tag)).toBe(value);

        // Typing at the top level offers completions from the card schema.
        await page.locator('.cm-content').click();
        await page.keyboard.press('Control+End');
        await page.keyboard.press('Enter');
        await page.keyboard.type('ta');
        await expect(page.locator('.cm-tooltip-autocomplete')).toBeVisible();
        await page.keyboard.press('Escape');
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');

        // Options here: Insert adds a key at the cursor's level.
        const before = await editorText(page);
        await page.locator('.pg-options .pg-btn', { hasText: 'Insert' }).first().click();
        await expect.poll(() => editorText(page)).not.toBe(before);

        // Copy YAML puts the editor text on the clipboard.
        await page.locator('.card-demo-btn', { hasText: 'Copy YAML' }).click();
        await expect(page.locator('.card-demo-btn', { hasText: 'Copied' })).toBeVisible();
        expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await editorText(page));

        expect(errors).toEqual([]);
    });
}
