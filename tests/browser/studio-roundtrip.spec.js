/**
 * Studio round trip (Layer A, built bundle): the editor round trip
 * (editor-roundtrip.spec.js) for the studios. Each fixture's card opens in its studio,
 * every tab of the config panel is visited, each control is set to what it shows, then
 * Save; the working copy after each control and the saved config must keep every key.
 *
 * Its first run (2026-11-20) found: the Astrometrics Studio cleared the whole `labels`
 * block when the colour section's draft row (threshold, custom state) fired, dropped a
 * point's `xyz: {}` (position from its entity) on any other edit, and showed a clock date
 * with a zone in UTC digits as local time.
 *
 * Every chart, data grid, MSD and layout card fixture runs; the astrometrics ones are a
 * varied set (all 49 take ten minutes). test:browser:changed runs a card's own fixtures here
 * when its files change; the full suite runs them all.
 */
import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import yaml from 'js-yaml';
import { mountCase } from './support.js';
import { sweepStudio } from './support-roundtrip.js';

const STUDIOS = {
    'lcards-chart': 'lcards-chart-studio-dialog',
    'lcards-data-grid': 'lcards-data-grid-studio-dialog-v4',
    'lcards-msd-card': 'lcards-msd-studio-dialog',
    'lcards-astrometrics-card': 'lcards-astrometrics-studio-dialog',
    'lcards-layout-card': 'lcards-layout-studio-dialog',
};

/** Astrometrics fixtures: the ones that found bugs, and a spread of objects and settings */
const ASTRO = new Set(['astro-data', 'astro-labels', 'astro-camera', 'astro-follow', 'astro-clock', 'astro-satellites',
    'astro-sky', 'astro-model', 'astro-true-scale', 'astro-sector', 'astro-cards', 'astro-bindings', 'astro-state-settings',
    'astro-nebula-shapes', 'astro-well-morph', 'astro-looks']);

/** The same meaning written another way: not a loss. */
const EQUIVALENT = [
    // camera buttons: true is every button at the default size
    (d) => d.path === 'camera.buttons' && d.from === true && d.to && typeof d.to === 'object' && (d.to.size === undefined || d.to.size === 180),
    // a chart state band's colour per state can't show in the single colour picker, which
    // shows empty under the hint "A colour per state is set in YAML; picking one here
    // replaces it": clearing it is the user's choice, warned about (a plain colour still counts)
    (d, cfg) => {
        const m = /^state_bands\[(\d+)\]\.color$/.exec(d.path);
        return !!m && d.by.endsWith('lcards-color-picker') && typeof cfg.state_bands?.[Number(m[1])]?.color === 'object';
    },
];

const FIXTURES = readdirSync(new URL('./fixtures', import.meta.url))
    .filter((f) => f.endsWith('.yaml') && !f.includes('-invalid'))
    .map((f) => f.replace(/\.yaml$/, ''))
    .map((name) => ({ name, config: /** @type {any} */ (yaml.load(readFileSync(new URL(`./fixtures/${name}.yaml`, import.meta.url), 'utf8'))) }))
    .filter(({ name, config }) => {
        const card = String(config?.type ?? '').replace(/^custom:/, '');
        return STUDIOS[card] && (card !== 'lcards-astrometrics-card' || ASTRO.has(name));
    });

for (const { name, config } of FIXTURES) {
    const card = String(config.type).replace(/^custom:/, '');
    test(`${name}: the studio keeps every key when each control is set to what it shows, and on save`, async ({ page }) => {
        test.setTimeout(180_000);
        await mountCase(page, 'button-lozenge');
        await page.evaluate(async (c) => { await customElements.whenDefined(c); await customElements.get(c).getConfigElement(); }, card);
        const r = await page.evaluate(sweepStudio, { tag: STUDIOS[card], config });
        const real = [...r.lost.map((l) => ({ ...l, kind: 'lost' })), ...r.changed.map((c) => ({ ...c, kind: 'changed' }))]
            .filter((d) => !EQUIVALENT.some((ok) => ok(d, config)));
        expect(real, `${STUDIOS[card]}: ${r.controls} controls on ${r.tabs.join(', ')}`).toEqual([]);
        expect(r.saved, 'Save sent the config').toBe(true);
        expect(r.errors).toEqual([]);
    });
}
