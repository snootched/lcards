/**
 * Published schemas (scripts/lib/card-schemas.js and its consumers): every registered
 * card and view has a schema, the doc-example validator really checks MSD and layout
 * views, the description lint catches new gaps, and the LLM bundle has the documented
 * sections.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getSchemaEntries } from '../../scripts/lib/card-schemas.js';
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

test('LLM bundle: cards, views and strategies sections; MSD not yet included', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lcards-llm-'));
    mkdirSync(dir, { recursive: true });
    const out = join(dir, 'schema.json');
    const r = spawnSync(process.execPath, [join(ROOT, 'scripts/generate-llm-schema.js'), `--out=${out}`], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    const bundle = JSON.parse(readFileSync(out, 'utf8'));
    assert.ok(bundle.cards['lcards-button'] && bundle.cards['lcards-layout-card']);
    assert.ok(!bundle.cards['lcards-msd-card']);
    assert.deepEqual(Object.keys(bundle.views), ['lcards-layout-view']);
    assert.deepEqual(Object.keys(bundle.strategies), ['lcars-shell']);
    // Every $ref resolves.
    const refs = JSON.stringify(bundle).match(/"\$ref":"#\/\$defs\/[^"]+"/g) ?? [];
    for (const ref of new Set(refs)) {
        const name = ref.slice('"$ref":"#/$defs/'.length, -1);
        assert.ok(bundle.$defs[name], `dangling ${ref}`);
    }
});
