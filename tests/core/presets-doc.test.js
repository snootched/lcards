/**
 * doc/core/presets.md lists exactly the presets the built-in packs ship, so the
 * tables can't drift (they once listed presets that never existed).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BUTTON_PRESETS } from '../../src/core/packs/style-presets/buttons/index.js';
import { SLIDER_PRESETS } from '../../src/core/packs/style-presets/sliders/index.js';

const doc = readFileSync(new URL('../../doc/core/presets.md', import.meta.url), 'utf8');

/** Preset names in the first column of the table under `heading`. */
function tablePresets(heading) {
    const start = doc.indexOf(heading);
    assert.notEqual(start, -1, `heading "${heading}" not found`);
    const next = doc.indexOf('\n###', start + heading.length);
    const section = doc.slice(start, next === -1 ? undefined : next);
    return [...section.matchAll(/^\| `([^`]+)` \|/gm)].map(m => m[1]);
}

for (const [heading, presets] of [
    ['### Button (`lcards-button`)', BUTTON_PRESETS],
    ['### Slider (`lcards-slider`)', SLIDER_PRESETS],
]) {
    test(`presets.md ${heading} matches the pack`, () => {
        assert.deepEqual(tablePresets(heading).sort(), Object.keys(presets).sort());
    });
}
