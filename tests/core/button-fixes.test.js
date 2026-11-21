/**
 * Button card fixes from the D2 docs audit (2026-11-07): the pure parts. The
 * rendering side of each is in tests/browser/button-fixes.spec.js.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getButtonSchema } from '../../src/cards/schemas/button-schema.js';
import { getElbowSchema } from '../../src/cards/schemas/elbow-schema.js';
import { CANVAS_TEXTURE_PRESETS } from '../../src/core/packs/textures/presets/index.js';
import { pulseAt } from '../../src/core/packs/textures/effects/PulseTextureEffect.js';
import { COMPONENT_GRID, buttonGridOptions as grid, mergeSegmentLayers, spreadBorderShorthands } from '../../src/cards/button-config.js';

test('components report the rows they draw to (they collapsed at 1 row in a sections view)', () => {
    assert.deepEqual(
        Object.fromEntries(Object.entries(COMPONENT_GRID).map(([k, v]) => [k, v.rows])),
        { dpad: 5, dpad_voyager: 6, brackets: 5, alert: 4 },
    );
    assert.deepEqual(grid({ component: 'dpad' }), { columns: 6, rows: 5, min_columns: 2, min_rows: 2 });
    assert.deepEqual(grid({ preset: 'lozenge' }), { columns: 4, rows: 1, min_columns: 1, min_rows: 1 });
    // the user's grid_options wins
    assert.deepEqual(grid({ component: 'alert', grid_options: { rows: 2, columns: 12, min_rows: 1 } }), { columns: 12, rows: 2, min_columns: 2, min_rows: 1 });
});

test('component segments: theme < segments.default < the segment\'s own keys, layer by layer', () => {
    const theme = { up: { style: { fill: 'theme-up', stroke: 'theme-stroke' } }, left: { style: { fill: 'theme-left' } } };
    const user = { default: { style: { fill: 'orange' }, hold_action: { action: 'more-info' } }, up: { style: { fill: 'blue' } } };
    const merged = mergeSegmentLayers([theme, undefined, user, null]);
    assert.equal(merged.left.style.fill, 'orange');              // default beats the theme
    assert.equal(merged.up.style.fill, 'blue');                  // the segment's own beats default
    assert.equal(merged.up.style.stroke, 'theme-stroke');        // what default leaves out stays
    assert.deepEqual(merged.left.hold_action, { action: 'more-info' });
    assert.equal(merged.default, undefined);                     // never a segment itself
    // a range layer above the user's still wins
    assert.equal(mergeSegmentLayers([theme, user, { left: { style: { fill: 'red' } } }]).left.style.fill, 'red');
    // a lower layer's default never beats a higher layer's segment
    assert.equal(mergeSegmentLayers([{ default: { style: { fill: 'x' } }, up: {} }, { up: { style: { fill: 'y' } } }]).up.style.fill, 'y');
});

// 2026-11-17: a user's fill map replaced the theme's whole map, so a dpad with
// segments.default.style.fill: { default, active } lost the theme's hover and pressed
// colours and stopped reacting to the pointer.
test('component segments: a state map keeps the pointer colours of the value it replaces', () => {
    const themeMap = { default: 'g', active: 'a', inactive: 'i', unavailable: 'u', hover: 'h', pressed: 'p' };
    const resolve = (/** @type {string} */ t) => (t === 'theme:dpad.fill' ? themeMap : undefined);
    const component = { up: { style: { fill: 'theme:dpad.fill', stroke: 'theme:dpad.fill' } }, left: { style: { fill: themeMap } } };
    const user = { default: { style: { fill: { default: 'grey', active: 'orange' } } }, right: { style: { fill: { default: 'x', hover: 'mine' } } } };
    const m = mergeSegmentLayers([component, undefined, user, null], resolve);
    // through a theme token: hover and pressed come along, and only those (the theme's
    // inactive and unavailable would beat the user's default)
    assert.deepEqual(m.up.style.fill, { default: 'grey', active: 'orange', hover: 'h', pressed: 'p' });
    // over a plain map the deep merge keeps every key, as it always did
    assert.deepEqual(m.left.style.fill, { ...themeMap, default: 'grey', active: 'orange' });
    // the user's own hover wins; pressed still comes from below (right has no component entry: from default)
    assert.equal(m.right.style.fill.hover, 'mine');
    // what the user left alone stays the theme's
    assert.equal(m.up.style.stroke, 'theme:dpad.fill');
    // a plain colour (not a map) still replaces the map below: no pointer states added
    assert.equal(mergeSegmentLayers([component, { up: { style: { fill: 'red' } } }], resolve).up.style.fill, 'red');
    // without a resolver a theme token can't be read: the map is used as given
    assert.deepEqual(mergeSegmentLayers([component, user]).up.style.fill, { default: 'grey', active: 'orange' });
});

test('component segments: a state map over a plain colour keeps that colour as its default (brackets, 2026-11-20)', () => {
    const brackets = { left: { style: { fill: 'theme:colors.ui.secondary', stroke: 'none' } }, right: { style: { fill: 'theme:colors.ui.secondary' } } };
    const resolve = () => 'var(--lcars-gray)';
    const user = { left: { style: { fill: { active: 'var(--lcars-orange)' } } }, right: { style: { fill: { default: 'var(--lcars-blue)', active: 'var(--lcars-orange)' } } } };
    const m = mergeSegmentLayers([brackets, null, user], resolve);
    assert.deepEqual(m.left.style.fill, { active: 'var(--lcars-orange)', default: 'theme:colors.ui.secondary' });
    // the user's own default wins
    assert.deepEqual(m.right.style.fill, { default: 'var(--lcars-blue)', active: 'var(--lcars-orange)' });
    // through segments.default too
    const viaDefault = mergeSegmentLayers([brackets, null, { default: { style: { fill: { active: 'var(--lcars-orange)' } } } }], resolve);
    assert.equal(viaDefault.left.style.fill.default, 'theme:colors.ui.secondary');
    // stroke: none stays the default under a map as well
    assert.equal(mergeSegmentLayers([brackets, { left: { style: { stroke: { active: 'var(--lcars-orange)' } } } }], resolve).left.style.stroke.default, 'none');
});

test('config merge (preset under user): a state map over a plain colour keeps it as default; other objects over scalars replace them', async () => {
    const { deepMerge } = await import('../../src/core/config-manager/merge-helpers.js');
    // was { 0: 'v', 1: 'a', ..., active } (the string spread into keys)
    assert.deepEqual(deepMerge({ style: { color: 'var(--a)' } }, { style: { color: { active: 'var(--b)' } } }), { style: { color: { default: 'var(--a)', active: 'var(--b)' } } });
    assert.deepEqual(deepMerge({ style: { color: 'var(--a)' } }, { style: { color: { default: 'var(--c)', active: 'var(--b)' } } }), { style: { color: { default: 'var(--c)', active: 'var(--b)' } } });
    assert.deepEqual(deepMerge({ style: { width: 2 } }, { style: { width: { top: 4 } } }), { style: { width: { top: 4 } } });
    assert.deepEqual(deepMerge({ fill: 'var(--a)' }, { fill: { type: 'linear', stops: ['a', 'b'] } }), { fill: { type: 'linear', stops: ['a', 'b'] } });
    assert.deepEqual(deepMerge({ label: 'Hello' }, { label: { content: 'x' } }), { label: { content: 'x' } }, 'not a colour: replaced, not spread');
});

test('border: a per-side object over a single preset value keeps that value on the other sides', () => {
    const preset = { border: { width: 'theme:components.button.border.width', radius: 0, color: 'c' } };
    const user = { border: { width: { left: 6 }, radius: { top_left: 24 } } };
    const spread = spreadBorderShorthands(preset, user);
    assert.deepEqual(spread.border.width, { top: preset.border.width, right: preset.border.width, bottom: preset.border.width, left: preset.border.width });
    assert.deepEqual(spread.border.radius, { top_left: 0, top_right: 0, bottom_right: 0, bottom_left: 0 });
    assert.equal(spread.border.color, 'c');
    assert.equal(preset.border.radius, 0, 'the preset is not mutated');
    // nothing to spread: same object back
    assert.equal(spreadBorderShorthands(preset, { border: { width: 3 } }), preset);
    assert.equal(spreadBorderShorthands(preset, {}), preset);
    const objectPreset = { border: { width: { top: 4, right: 0, bottom: 0, left: 0 } } };
    assert.equal(spreadBorderShorthands(objectPreset, user), objectPreset);
});

test('every shape_texture preset the schemas offer exists (pulse was dropped in the Canvas2D move)', () => {
    for (const [name, schema] of [['button', getButtonSchema()], ['elbow', getElbowSchema()]]) {
        const json = JSON.stringify(schema);
        const m = json.match(/"enum":\["grid"[^\]]*\]/);
        assert.ok(m, `${name}: shape_texture preset enum found`);
        const offered = JSON.parse(m[0].slice('"enum":'.length));
        assert.deepEqual([...offered].sort(), Object.keys(CANVAS_TEXTURE_PRESETS).sort(), name);
    }
    assert.equal(CANVAS_TEXTURE_PRESETS.pulse.effectClass.name, 'PulseTextureEffect');
});

test('pulse: full size and strength at the start of each cycle, smallest halfway', () => {
    assert.deepEqual(pulseAt(0, 0.15), { size: 1, alpha: 1 });
    assert.deepEqual(pulseAt(2, 0.15), { size: 1, alpha: 1 });
    const mid = pulseAt(0.5, 0.15);
    assert.ok(Math.abs(mid.size - 0.15) < 1e-9 && Math.abs(mid.alpha - 0.3) < 1e-9);
});

test('level texture: the preset has no color_a default to beat the user\'s color', () => {
    assert.equal(CANVAS_TEXTURE_PRESETS.level.defaults.color_a, undefined);
    assert.equal(CANVAS_TEXTURE_PRESETS.level.defaults.color, 'rgba(0,200,100,0.7)');
    // no other preset has both a color default and a color_a default
    for (const [name, def] of Object.entries(CANVAS_TEXTURE_PRESETS)) {
        assert.ok(!(def.defaults?.color && def.defaults?.color_a), name);
    }
});

test('button schema: no-effect keys deprecated, defaults match the runtime', () => {
    const p = getButtonSchema().properties;
    assert.equal(p.control.deprecated, true);
    assert.equal(p.icon_style.properties.type.deprecated, true);
    assert.equal(p.icon_style.properties.type.enum, undefined);
    // the runtime: show_icon false unless the preset shows it; icon area sized to the icon;
    // divider from the preset/theme (6 without); radius from the preset (20 without)
    assert.equal(p.show_icon.default, undefined);
    assert.equal(p.icon_area_size.default, undefined);
    assert.equal(p.divider.properties.width.default, undefined);
    assert.ok(!JSON.stringify(p.style.properties.border.properties.radius).includes('"default"'));
    for (const side of ['left', 'right', 'top', 'bottom']) {
        assert.match(p.icon_style.properties[`padding_${side}`].description, new RegExp(`padding\\.${side}`));
    }
});

test('the schema knows every style.text.default key the button reads (letter_spacing and text_transform were missing)', async () => {
    const fs = await import('node:fs');
    const src = fs.readFileSync(new URL('../../src/cards/lcards-button.js', import.meta.url), 'utf8');
    const read = [...new Set([...src.matchAll(/_buttonStyle\?\.text\?\.default\?\.(\w+)/g)].map((m) => m[1]))].sort();
    assert.ok(read.includes('letter_spacing') && read.includes('text_transform'), read.join());
    const props = getButtonSchema({ availablePresets: [] }).properties.style.properties.text.properties.default.properties;
    assert.deepEqual(read.filter((k) => !props[k]), []);
});
