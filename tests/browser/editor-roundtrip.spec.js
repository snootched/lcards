/**
 * Editor round trip (Layer A, built bundle): every fixture's card opens in its editor,
 * every tab and section is visited, and each control is "edited" to the value it shows
 * (support-roundtrip.js). No key of the config may vanish or change: that was silent data
 * loss (the 2026-11-20 editor audit found four editors dropping keys they don't show, and
 * the sweep's first run found the segmented elbow showing `bar_width: theme` as 90 px).
 *
 * Allowed: keys an edit only adds (the value the control showed), and the equivalent
 * forms below. Runs only with the full suite (scripts/lib/browser-test-select.js).
 */
import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import yaml from 'js-yaml';
import { mountCase } from './support.js';
import { sweepEditor } from './support-roundtrip.js';

const FIXTURES = readdirSync(new URL('./fixtures', import.meta.url))
    .filter((f) => f.endsWith('.yaml') && !f.includes('-invalid'))
    .map((f) => f.replace(/\.yaml$/, ''));

/** The same meaning written another way: not a loss. */
const EQUIVALENT = [
    // an action equal to the card's default (a button toggles) is left out
    (d, cfg) => d.path === 'tap_action' && JSON.stringify(cfg.tap_action) === '{"action":"toggle"}',
    // one padding for every side, spelled out per side
    (d) => /padding$/.test(d.path) && typeof d.from === 'number'
        && d.to && typeof d.to === 'object' && ['top', 'right', 'bottom', 'left'].every((s) => d.to[s] === d.from),
];

for (const name of FIXTURES) {
    test(`${name}: the editor keeps every key when each control is set to what it shows`, async ({ page }) => {
        test.setTimeout(120_000);
        await mountCase(page, 'button-lozenge');
        const config = yaml.load(readFileSync(new URL(`./fixtures/${name}.yaml`, import.meta.url), 'utf8'));
        const r = await page.evaluate(sweepEditor, config);
        const real = [...r.lost.map((l) => ({ ...l, kind: 'lost' })), ...r.changed.map((c) => ({ ...c, kind: 'changed' }))]
            .filter((d) => !EQUIVALENT.some((ok) => ok(d, config)));
        expect(real, `${r.tag}: ${r.controls} controls on ${r.tabs.join(', ')}`).toEqual([]);
        expect(r.errors).toEqual([]);
    });
}
