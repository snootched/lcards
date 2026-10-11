/**
 * Every playground starter (doc/.vitepress/theme/card-demo-starters.js) and every
 * gallery tile (card-demo-galleries.js) is valid YAML that passes its card's schema
 * with no errors or warnings.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import yaml from 'js-yaml';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { CARD_STARTERS } from '../../doc/.vitepress/theme/card-demo-starters.js';
import { CARD_GALLERIES } from '../../doc/.vitepress/theme/card-demo-galleries.js';
import { CoreValidationService } from '../../src/core/validation-service/index.js';
import { getButtonSchema } from '../../src/cards/schemas/button-schema.js';
import { getSliderSchema } from '../../src/cards/schemas/slider-schema.js';
import { getElbowSchema } from '../../src/cards/schemas/elbow-schema.js';
import { getSelectMenuSchema } from '../../src/cards/schemas/select-menu-schema.js';
import { BUTTON_PRESETS } from '../../src/core/packs/style-presets/buttons/index.js';
import { SLIDER_PRESETS } from '../../src/core/packs/style-presets/sliders/index.js';

// Built with the real preset lists, as the cards do (empty lists give an empty enum).
const buttonPresets = { availablePresets: Object.keys(BUTTON_PRESETS) };
const SCHEMAS = {
    'lcards-button': getButtonSchema(buttonPresets),
    'lcards-slider': getSliderSchema({ availablePresets: Object.keys(SLIDER_PRESETS) }),
    'lcards-elbow': getElbowSchema(buttonPresets),
    'lcards-select-menu': getSelectMenuSchema(buttonPresets),
};

function assertValid(text, card) {
    const config = yaml.load(text);
    const tag = String(config.type).replace(/^custom:/, '');
    if (card) assert.equal(tag, card);
    assert.ok(SCHEMAS[tag], `no schema for ${config.type}`);
    const result = new CoreValidationService({ cacheResults: false }).validate(config, SCHEMAS[tag]);
    assert.deepEqual([...result.errors, ...result.warnings].map(e => `${e.field}: ${e.message}`), []);
}

for (const [card, starters] of Object.entries(CARD_STARTERS)) {
    for (const starter of starters) {
        test(`${card} starter "${starter.label}" is valid`, () => assertValid(starter.yaml, card));
    }
}

for (const [name, gallery] of Object.entries(CARD_GALLERIES)) {
    test(`gallery ${name} has tiles with unique labels`, () => {
        assert.ok(gallery.tiles.length > 1);
        assert.equal(new Set(gallery.tiles.map(t => t.label)).size, gallery.tiles.length);
    });
    for (const tile of gallery.tiles) {
        test(`gallery ${name} tile "${tile.label}" is valid`, () => assertValid(tile.yaml));
    }
}

// A slider preset that declares only non-default components (picard-gauge-vertical)
// but doesn't set one itself renders as a plain gauge unless the config sets
// component: so every demo config using one must set a compatible component.
function presetComponentProblem(config) {
    if (config.type !== 'custom:lcards-slider' || !config.preset) return null;
    const preset = SLIDER_PRESETS[config.preset];
    const compatible = preset?.compatibleComponents ?? ['default'];
    if (preset?.component || compatible.includes('default')) return null;
    return compatible.includes(config.component) ? null : `preset ${config.preset} needs component: ${compatible.join(' | ')}`;
}

test('demo configs set the component their slider preset needs', () => {
    const configs = [
        ...Object.values(CARD_STARTERS).flat().map(s => [`starter ${s.label}`, s.yaml]),
        ...Object.entries(CARD_GALLERIES).flatMap(([name, g]) => g.tiles.map(t => [`gallery ${name} ${t.label}`, t.yaml])),
    ];
    (function walk(dir) {
        for (const name of readdirSync(dir)) {
            const p = join(dir, name);
            if (statSync(p).isDirectory()) { if (!['.vitepress', 'public'].includes(name)) walk(p); continue; }
            if (!name.endsWith('.md')) continue;
            for (const m of readFileSync(p, 'utf8').matchAll(/^```ya?ml[^\n]*\blive\b[^\n]*\n([\s\S]*?)^```/gm)) configs.push([p, m[1]]);
        }
    })('doc');
    const problems = configs.flatMap(([where, text]) => {
        let config;
        try { config = yaml.load(text); } catch { return []; }
        const problem = config && typeof config === 'object' ? presetComponentProblem(config) : null;
        return problem ? [`${where}: ${problem}`] : [];
    });
    assert.deepEqual(problems, []);
});
