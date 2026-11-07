/**
 * A heading that moved to another page keeps working at its old address: the old
 * page's `moved_anchors` frontmatter sends #old-id on to the new page and heading
 * (doc/.vitepress/theme/index.ts). Old editors and bookmarks link these.
 */
import { test, expect } from './support.js';

for (const [from, to] of [
    ['/cards/slider-card/#ring-gauge', /\/cards\/slider-card\/components(\.html)?#ring-gauge$/],
    ['/cards/slider-card/#drag-value-badge', /\/cards\/slider-card\/control(\.html)?#drag-value-badge$/],
    ['/cards/astrometrics/objects#comet', /\/cards\/astrometrics\/objects\/space(\.html)?#comet$/],
]) {
    test(`${from} lands on the heading's new page`, async ({ page }) => {
        await page.goto(from);
        await expect(page).toHaveURL(to);
        await expect(page.locator(`h2#${to.source.split('#')[1].replace('$', '')}`)).toBeVisible();
    });
}

test('an anchor still on the page stays put', async ({ page }) => {
    await page.goto('/cards/slider-card/#presets');
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/cards\/slider-card\/#presets$/);
});
