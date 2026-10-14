/**
 * Published schemas (scripts/lib/card-schemas.js and its consumers): every registered
 * card and view has a schema, the doc-example validator really checks MSD and layout
 * views, the description lint catches new gaps, and the published option lists match
 * the runtime. The published schema files themselves: schema-publish.test.js.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getSchemaEntries, BUILTIN_OPTIONS } from '../../scripts/lib/card-schemas.js';
import { StylePresetManager } from '../../src/core/presets/StylePresetManager.js';
import { ComponentManager } from '../../src/core/components/ComponentManager.js';
import { loadBuiltinPacks } from '../../src/core/packs/loadBuiltinPacks.js';
import { TEXT_POSITIONS } from '../../src/cards/schemas/schema-options.js';
import { missingDescriptions, currentGaps } from '../../scripts/check-schema-descriptions.js';
import { getMsdSchema } from '../../src/cards/schemas/msd-schema.js';
import { shellStrategySchema, shellStrategyEditorSchema } from '../../src/cards/schemas/shell-strategy-schema.js';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

test('every registered LCARdS card and view element has a schema entry', () => {
    const main = readFileSync(join(ROOT, 'src/lcards-main.js'), 'utf8');
    const registered = [...main.matchAll(/customElements\.define\(\s*['"](lcards-[a-z0-9-]+)['"]/g)]
        .map(m => m[1])
        .filter(tag => !tag.endsWith('-editor'));
    const tags = new Set(getSchemaEntries().map(e => e.tag));
    for (const tag of registered) assert.ok(tags.has(tag), `${tag} is registered but has no entry in scripts/lib/card-schemas.js`);
});

test('the shell strategy registered in lcards-main.js matches the schema type', () => {
    const main = readFileSync(join(ROOT, 'src/lcards-main.js'), 'utf8');
    assert.match(main, /ll-strategy-dashboard-lcars-shell/);
    assert.equal(shellStrategySchema.properties.type.const, 'custom:lcars-shell');
});

test('the shell strategy form is derived from its schema, in order, with every config key generate() reads', () => {
    const form = shellStrategyEditorSchema();
    assert.deepEqual(form.map(f => f.name), ['room_selector_entity', 'page_selector_entity', 'top_bar_entity', 'right_sidebar_entity']);
    for (const field of form) {
        assert.ok(field.label && field.description && field.selector?.entity, `${field.name} is missing label, description or entity selector`);
    }
    const strategySrc = readFileSync(join(ROOT, 'src/strategies/lcards-shell-strategy.js'), 'utf8');
    const read = [...strategySrc.matchAll(/config\?\.([a-z_]+)/g)].map(m => m[1]);
    assert.deepEqual([...new Set(read)].sort(), form.map(f => f.name).sort());
});

test('published option lists match what the real preset and component managers give the cards at runtime', async () => {
    // Same pack list as src/core/lcards-core.js.
    const core = readFileSync(join(ROOT, 'src/core/lcards-core.js'), 'utf8');
    const ids = JSON.parse(core.match(/packManager\.loadBuiltinPacks\((\[[^\]]*\])\)/)[1].replace(/'/g, '"'));
    const packs = loadBuiltinPacks(ids);
    const spm = new StylePresetManager();
    for (const pack of packs) spm.registerPresetsFromPack(pack);
    const cm = new ComponentManager();
    await cm.initialize();
    for (const pack of packs) cm.registerComponentsFromPack(pack);
    const sorted = (list) => [...list].sort();
    assert.deepEqual(sorted(BUILTIN_OPTIONS.buttonPresets), sorted(spm.getAvailablePresets('button')));
    assert.deepEqual(sorted(BUILTIN_OPTIONS.sliderPresets), sorted(spm.getAvailablePresets('slider')));
    assert.deepEqual(sorted(BUILTIN_OPTIONS.sliderComponents), sorted(cm.getComponentsByType('slider')));
});

test('published schemas carry real enums: positions and presets are never empty lists', () => {
    const empty = [];
    const walk = (node, path) => {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node.enum) && node.enum.length === 0) empty.push(path);
        for (const [k, v] of Object.entries(node)) walk(v, `${path}.${k}`);
    };
    for (const { tag, schema } of getSchemaEntries()) walk(schema, tag);
    assert.deepEqual(empty, []);
    const button = getSchemaEntries().find(e => e.tag === 'lcards-button').schema;
    assert.deepEqual(button.properties.text.properties.default.properties.position.enum, [...TEXT_POSITIONS]);
});

test('MSD schema: overlay tags are declared and base_svg is not hard-required (view_box alone is a blank canvas)', () => {
    const msd = getMsdSchema().properties.msd;
    assert.ok(msd.properties.overlays.items.properties.tags, 'overlays[].tags missing');
    assert.ok(!(msd.required ?? []).includes('base_svg'));
});

/** Run the doc validator in strict mode over a temp docs folder holding one page. */
function validateDoc(yaml) {
    const dir = mkdtempSync(join(tmpdir(), 'lcards-docval-'));
    writeFileSync(join(dir, 'page.md'), `# Test\n\n\`\`\`yaml\n${yaml.trim()}\n\`\`\`\n`);
    const r = spawnSync(process.execPath, [join(ROOT, 'scripts/validate-doc-examples.js'), '--strict', '--quiet', `--docs=${dir}`], { encoding: 'utf8' });
    return { ok: r.status === 0, out: r.stdout + r.stderr };
}

test('doc validator: valid MSD examples pass (tags on overlays, view_box without base_svg)', () => {
    const r = validateDoc(`
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 400, 200]
  overlays:
    - id: core
      type: control
      tags: [engineering]
      position: [10, 10]
      size: [100, 40]
      card:
        type: custom:lcards-button
`);
    assert.ok(r.ok, r.out);
});

test('doc validator: MSD with neither base_svg.source nor view_box fails', () => {
    const r = validateDoc(`
type: custom:lcards-msd-card
msd:
  overlays: []
`);
    assert.ok(!r.ok);
    assert.match(r.out, /neither msd\.base_svg\.source nor a view_box/);
});

test('doc validator: an undeclared MSD overlay key fails', () => {
    const r = validateDoc(`
type: custom:lcards-msd-card
msd:
  base_svg:
    source: builtin:ncc-1701-a-blue
  overlays:
    - id: core
      type: line
      colour_typo: red
`);
    assert.ok(!r.ok);
    assert.match(r.out, /\[lcards-msd-card\] unknown key: msd\.overlays\[0\]\.colour_typo/);
});

test('doc validator: layout views are schema-checked, standard view keys pass', () => {
    const good = validateDoc(`
views:
  - title: Bridge
    path: bridge
    type: custom:lcards-layout-view
    layout:
      grid-template-areas: '"a"'
    cards:
      - type: custom:lcards-button
        view_layout:
          grid-area: a
`);
    assert.ok(good.ok, good.out);
    const bad = validateDoc(`
views:
  - type: custom:lcards-layout-view
    layout: 5
`);
    assert.ok(!bad.ok);
    assert.match(bad.out, /\[lcards-layout-view\] \/layout: must be object/);
});

test('description lint: lists undescribed properties with paths through items, branches and patterns', () => {
    const schema = {
        type: 'object',
        properties: {
            described: { type: 'string', description: 'ok' },
            bare: { type: 'string' },
            ref: { $ref: '#/$defs/x' },
            old: { type: 'string', deprecated: true },
            list: { type: 'array', description: 'ok', items: { type: 'object', properties: { inner: { type: 'number' } } } },
            either: { description: 'ok', anyOf: [{ type: 'object', properties: { a: { type: 'string' } } }, { type: 'string' }] },
            map: { type: 'object', description: 'ok', additionalProperties: { type: 'object', properties: { v: { type: 'string' } } } },
        },
    };
    assert.deepEqual([...missingDescriptions(schema)].sort(), ['bare', 'either.a', 'list[].inner', 'map.*.v']);
});

test('description lint: the committed baseline has no new gaps (npm run validate:schema-descriptions)', () => {
    const baseline = new Set(readFileSync(join(ROOT, 'scripts/schema-description-baseline.txt'), 'utf8').split(/\r?\n/).filter(Boolean));
    const added = currentGaps().filter(line => !baseline.has(line));
    assert.deepEqual(added, [], 'add descriptions, or run npm run validate:schema-descriptions:update if intentional');
});
