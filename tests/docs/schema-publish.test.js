/**
 * Published schema set (scripts/lib/schema-publish.js, scripts/generate-llm-schema.js):
 * the split files and the full bundle are lossless (every $ref resolves back to exactly
 * the stripped source schema), the files compile in ajv with their shared refs, real
 * fixture configs validate against them, and the size budgets hold.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import yaml from 'js-yaml';
import { getSchemaEntries } from '../../scripts/lib/card-schemas.js';
import { buildSchemaSet, stripSchema, SHARED_MODULES } from '../../scripts/lib/schema-publish.js';
import { isTemplateString } from '../../src/utils/template-string.js';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const SECTION = { card: 'cards', view: 'views', strategy: 'strategies' };
const HEADER_KEYS = ['$schema', '$comment', '$defs'];

const entries = getSchemaEntries();
const { files, bundle, index } = buildSchemaSet(entries, { version: '0.0.0-test', generatedAt: 'now' });

const withoutHeader = (doc) => Object.fromEntries(Object.entries(doc).filter(([k]) => !HEADER_KEYS.includes(k)));

/** Inline every $ref of a split file: local #/$defs, and shared files (relative paths). */
function resolveSplit(node, doc, dir) {
    if (Array.isArray(node)) return node.map(v => resolveSplit(v, doc, dir));
    if (!node || typeof node !== 'object') return node;
    if (typeof node.$ref === 'string') {
        assert.equal(Object.keys(node).length, 1, 'a $ref node has no siblings');
        if (node.$ref.startsWith('#/$defs/')) {
            const def = doc.$defs?.[node.$ref.slice('#/$defs/'.length)];
            assert.ok(def, `dangling ${node.$ref}`);
            return resolveSplit(def, doc, dir);
        }
        const rel = join(dir, node.$ref).replace(/\\/g, '/');
        const target = files.get(rel);
        assert.ok(target, `dangling file ref ${node.$ref} (from ${dir})`);
        return resolveSplit(withoutHeader(target), target, 'shared');
    }
    return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, resolveSplit(v, doc, dir)]));
}

function resolveBundle(node) {
    if (Array.isArray(node)) return node.map(resolveBundle);
    if (!node || typeof node !== 'object') return node;
    if (typeof node.$ref === 'string') {
        const def = bundle.$defs[node.$ref.slice('#/$defs/'.length)];
        assert.ok(def, `dangling ${node.$ref}`);
        return resolveBundle(def);
    }
    return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, resolveBundle(v)]));
}

test('split files are lossless: resolving every $ref gives back the stripped source schema', () => {
    for (const { kind, tag, schema } of entries) {
        const rel = `${SECTION[kind]}/${tag}.json`;
        const doc = files.get(rel);
        assert.ok(doc, `${rel} missing`);
        assert.deepEqual(resolveSplit(withoutHeader(doc), doc, SECTION[kind]), stripSchema(schema), rel);
    }
    for (const [name, schema] of SHARED_MODULES) {
        const doc = files.get(`shared/${name}.json`);
        assert.deepEqual(resolveSplit(withoutHeader(doc), doc, 'shared'), stripSchema(schema), name);
    }
});

test('the full bundle is lossless and holds every card (MSD included), view and strategy', () => {
    for (const { kind, tag, schema } of entries) {
        const doc = bundle[SECTION[kind]][tag];
        assert.ok(doc, `${kind} ${tag} missing from the bundle`);
        assert.deepEqual(resolveBundle(doc), stripSchema(schema), tag);
    }
    assert.ok(bundle.cards['lcards-msd-card']);
});

test('stripping drops editor metadata, functions, $id and $schema but keeps descriptions', () => {
    const out = stripSchema({
        $id: 'https://example.invalid/x', $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        'x-ui': { a: 1 }, 'x-ui-hints': { b: 1 }, validators: [() => true],
        properties: { kept: { type: 'string', description: 'd', examples: [1, 2, 3] }, old: { type: 'string', deprecated: true } },
        additionalProperties: 'warn',
    });
    assert.deepEqual(out, { type: 'object', properties: { kept: { type: 'string', description: 'd', examples: [1] } } });
});

test('index lists every file with its real size and the shared files it references', () => {
    for (const section of ['cards', 'views', 'strategies', 'shared']) {
        for (const [tag, info] of Object.entries(index[section])) {
            const doc = files.get(info.file);
            assert.ok(doc, `${info.file} listed but not generated`);
            assert.equal(info.bytes, Buffer.byteLength(JSON.stringify(doc)), info.file);
            const refs = new Set([...JSON.stringify(doc).matchAll(/"\$ref":"(?:\.\.\/shared\/)?([a-z-]+)\.json"/g)].map(m => m[1]));
            assert.deepEqual(info.uses, [...refs].filter(r => r !== tag).sort(), `${info.file} uses`);
        }
    }
    assert.equal(files.size, Object.values(index).filter(v => v && typeof v === 'object').reduce((n, s) => n + Object.keys(s).length, 0));
});

function ajvWithFiles() {
    const ajv = new Ajv({ allErrors: true, strict: false, validateFormats: false });
    // Template strings are evaluated at render time, so `pattern` applies to literals only (as in the app).
    ajv.removeKeyword('pattern');
    ajv.addKeyword({ keyword: 'pattern', type: 'string', schemaType: 'string', validate: (p, d) => isTemplateString(d) || new RegExp(p, 'u').test(d) });
    for (const [rel, doc] of files) ajv.addSchema(doc, `https://schema.test/schema/${rel}`);
    return ajv;
}

test('every split file compiles in ajv with its shared refs, and real fixture configs validate', () => {
    const ajv = ajvWithFiles();
    for (const rel of files.keys()) assert.ok(ajv.getSchema(`https://schema.test/schema/${rel}`), `${rel} does not compile`);

    const fixtures = join(ROOT, 'tests/browser/fixtures');
    let checked = 0;
    for (const name of readdirSync(fixtures)) {
        if (/invalid/.test(name)) continue;
        const config = yaml.load(readFileSync(join(fixtures, name), 'utf8'));
        const tag = String(config?.type ?? '').replace(/^custom:/, '');
        const validate = ajv.getSchema(`https://schema.test/schema/cards/${tag}.json`);
        if (!validate) continue;
        assert.ok(validate(config), `${name}: ${JSON.stringify(validate.errors)}`);
        checked++;
    }
    assert.ok(checked >= 15, `only ${checked} fixtures checked`);

    const msd = ajv.getSchema('https://schema.test/schema/cards/lcards-msd-card.json');
    assert.equal(msd({ type: 'custom:lcards-msd-card', msd: { view_box: [0, 0, 1, 1], overlays: 'nope' } }), false);
});

test('size budgets: each card/view/strategy file under 100 KB, the full bundle under 600 KB', () => {
    for (const [rel, doc] of files) {
        if (rel.startsWith('shared/')) continue;
        const kb = Buffer.byteLength(JSON.stringify(doc)) / 1024;
        assert.ok(kb < 100, `${rel} is ${kb.toFixed(1)} KB; move a big shared piece into SHARED_MODULES or trim it`);
    }
    const bundleKb = Buffer.byteLength(JSON.stringify(bundle)) / 1024;
    assert.ok(bundleKb < 600, `lcards-schema.json is ${bundleKb.toFixed(1)} KB`);
});

test('published text has no em dashes (CLAUDE.md: schema descriptions are user-facing)', () => {
    assert.ok(!JSON.stringify(bundle).includes('—'));
});

test('the CLI writes the bundle, the index and every split file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'lcards-schema-'));
    const r = spawnSync(process.execPath, [join(ROOT, 'scripts/generate-llm-schema.js'), `--out-dir=${dir}`], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    const written = JSON.parse(readFileSync(join(dir, 'lcards-schema.json'), 'utf8'));
    assert.ok(written.cards['lcards-msd-card'] && written.views['lcards-layout-view'] && written.strategies['lcars-shell']);
    const idx = JSON.parse(readFileSync(join(dir, 'schema/index.json'), 'utf8'));
    for (const section of ['cards', 'views', 'strategies', 'shared']) {
        for (const info of Object.values(idx[section])) assert.ok(existsSync(join(dir, 'schema', info.file)), info.file);
    }
});
