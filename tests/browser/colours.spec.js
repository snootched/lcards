/**
 * Colour forms render the same in every card (Layer A, built bundle).
 *
 * Each card is mounted once and reconfigured with every colour form from
 * core/themes/color-syntax.js; the test reads the browser's computed colour.
 *
 * Regressions covered: a computed colour written as a plain string (no state
 * map) reached the DOM unevaluated; nested functions (`alpha(darken(...))`)
 * were not evaluated; named and hsl() colours were dropped by the resolver
 * whenever a caller passed a different fallback.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

const ORANGE = 'rgb(255, 153, 0)';

/** [config value, computed colour] */
const FORMS = [
    ['#ff9900', ORANGE],
    ['#ff990080', 'rgba(255, 153, 0, 0.5)'],
    ['orange', 'rgb(255, 165, 0)'],
    ['hsl(36, 100%, 50%)', ORANGE],
    ['var(--test-orange)', ORANGE],
    ['alpha(#ff9900, 0.5)', 'rgba(255, 153, 0, 0.5)'],
    ['darken(var(--test-orange), 0.2)', 'rgb(204, 122, 0)'],
    ['alpha(darken(#ff9900, 0.2), 0.5)', 'rgba(204, 122, 0, 0.5)'],
    ['mix(#ff0000, #0000ff, 0.25)', 'rgb(64, 0, 191)'],
    ['color-mix(in srgb, #ff0000 25%, #0000ff)', 'rgb(64, 0, 191)'],
];

/**
 * Computed colour as rgb()/rgba(). Live colours (color-mix() over a CSS
 * variable, kept so alert modes apply without a re-render) are serialised by
 * the browser as color(srgb r g b / a).
 */
const rgb = (page, locator, prop) => locator.evaluate((el, p) => {
    const value = getComputedStyle(el)[p];
    const srgb = value.match(/^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)$/);
    if (!srgb) return value;
    const [r, g, b] = srgb.slice(1, 4).map(c => Math.round(parseFloat(c) * 255));
    const a = srgb[4] === undefined ? 1 : parseFloat(srgb[4]);
    return a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
}, prop);

/** --test-orange is defined by the harness page. */
const reconfigure = (page, config) => page.evaluate((c) => window.__reconfigure(c), config);

const buttonConfig = (background) => ({
    type: 'custom:lcards-button', entity: 'light.demo', preset: 'lozenge',
    style: { card: { color: { background } } },
});

test('button background: every colour form, as a plain value and inside a state map', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    const bg = page.locator('lcards-button path.button-bg');
    for (const [value, expected] of FORMS) {
        await reconfigure(page, buttonConfig(value));
        await expect.poll(() => rgb(page, bg, 'fill'), { message: value }).toBe(expected);
        await reconfigure(page, buttonConfig({ default: value, active: value, inactive: value }));
        await expect.poll(() => rgb(page, bg, 'fill'), { message: `state map: ${value}` }).toBe(expected);
    }
    await expectNoErrors(page);
});

test('elbow segment colour: nested computed function over a CSS variable', async ({ page }) => {
    // Mounted from a fixture (also covers a plain string reaching the first render)
    await mountCase(page, 'elbow-colour');
    const path = page.locator('lcards-elbow path.elbow-bg');
    await expect.poll(() => rgb(page, path, 'fill')).toBe('rgba(204, 122, 0, 0.5)');
    await expectNoErrors(page);
});

test('chart series colour: a computed colour over a CSS variable in sources[] reaches ApexCharts concrete', async ({ page }) => {
    await mountCase(page, 'chart-line', { height: '300' });
    await reconfigure(page, {
        type: 'custom:lcards-chart',
        sources: [{ entity: 'sensor.demo_temperature', color: 'alpha(darken(var(--test-orange), 0.2), 0.5)' }],
    });
    const line = page.locator('lcards-chart path.apexcharts-line').first();
    await expect.poll(() => line.getAttribute('stroke')).toBe('rgba(204, 122, 0, 0.5)');
    await expectNoErrors(page);
});

test('button shape texture: every colour field resolved after templates, to concrete values for Canvas2D', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    await reconfigure(page, {
        ...buttonConfig('#333366'),
        shape_texture: {
            preset: 'level',
            config: {
                color_a: "[[[ return 'alpha(darken(var(--test-orange), 0.2), 0.5)' ]]]",
                color_b: { default: 'mix(#ff0000, #0000ff, 0.25)' },
                edge_glow_color: 'theme:alpha(colors.ui.primary, 0)',
            },
        },
    });
    const resolved = () => page.evaluate(() => {
        const cfg = document.querySelector('lcards-button')._resolveShapeTextureConfig();
        const c = cfg?.resolvedConfig;
        return c && [c.color_a, c.color_b, c.edge_glow_color];
    });
    await expect.poll(resolved).toEqual(['rgba(204, 122, 0, 0.5)', '#4000bf', expect.stringMatching(/^rgba\(\d+, \d+, \d+, 0\)$/)]);
    await expectNoErrors(page);
});
