/**
 * Layer A: the number-block and toggle-tab presets take every colour from the theme.
 * The harness loads no HA-LCARS theme, so the test sets one theme's variables (from the
 * committed HA-LCARS snapshot) on the page, then checks the card follows them in both
 * states. Screenshots of each theme/state go to test-results/ for eyeballing.
 */
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { mountCase, expectNoErrors } from './support.js';

const snapshot = JSON.parse(readFileSync(new URL('../../scripts/data/ha-lcars/snapshot.json', import.meta.url), 'utf8'));

/** CSS for one HA-LCARS theme: palette, role defaults, the theme's own values, its dark mode. */
function themeCss(name) {
    const theme = snapshot.themes.find(t => t.name === name);
    const vars = {
        ...Object.fromEntries(snapshot.palette.map(p => [p.name, p.value])),
        ...Object.fromEntries(snapshot.roles.map(r => [r.name, r.default])),
        ...snapshot.mode_defaults.dark,
        ...theme.vars,
        ...(theme.modes?.dark ?? {}),
    };
    return `:root { ${Object.entries(vars).map(([k, v]) => `--${k}: ${v};`).join(' ')} }`;
}

/** The computed colour of a CSS expression on the page (for comparing against the card). */
const computed = (page, expr) => page.evaluate((e) => {
    const probe = document.createElement('div');
    probe.style.color = e;
    document.body.appendChild(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c;
}, expr);

/** Every fill and stroke used inside the button's SVG, as computed rgb() strings. */
const paints = (card) => card.evaluate(el => {
    const out = new Set();
    for (const n of el.shadowRoot.querySelectorAll('path, rect, line')) {
        const s = getComputedStyle(n);
        if (s.fill && s.fill !== 'none') out.add(s.fill);
        if (s.stroke && s.stroke !== 'none') out.add(s.stroke);
    }
    return [...out];
});

for (const theme of ['LCARS Picard [LCARdS Red Accent]', 'LCARS Default']) {
    for (const preset of ['number-block', 'toggle-tab']) {
        test(`${preset} follows the theme (${theme}): accent when on, structure when off`, async ({ page }, info) => {
            const card = await mountCase(page, `button-${preset}`, { width: '220' });
            await page.addStyleTag({ content: themeCss(theme) });
            const accent = await computed(page, 'var(--lcars-ui-tertiary)');
            const dark = await computed(page, 'var(--lcars-card-top-color)');

            await page.evaluate(() => window.__setState('input_boolean.demo_toggle', 'on'));
            await expect.poll(() => paints(card)).toContain(accent);
            await card.screenshot({ path: info.outputPath(`${preset}-on.png`) });

            await page.evaluate(() => window.__setState('input_boolean.demo_toggle', 'off'));
            await expect.poll(() => paints(card)).toContain(dark);
            expect(await paints(card)).not.toContain(accent);
            await card.screenshot({ path: info.outputPath(`${preset}-off.png`) });
            await expectNoErrors(page);
        });
    }
}
