/**
 * "Home Assistant" in full, never bare "HA", in user-facing text (CLAUDE.md, adopted
 * 2026-10-22). The docs are checked in the build (scripts/check-doc-ha-name.js); this
 * covers the matcher itself, every published schema description/helper, and the
 * integration's own strings (action descriptions in HA's Developer Tools, options flow).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bareHaLines, hasBareHa } from '../../scripts/lib/home-assistant-name.js';
import { getSchemaEntries } from '../../scripts/lib/card-schemas.js';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

test('matcher: bare HA and lower-case compounds fail; names, code and links pass', () => {
    for (const bad of ['Restart HA.', "HA's toolbar", 'an HA card', 'HA-native display']) assert.ok(hasBareHa(bad), bad);
    for (const ok of ['Home Assistant', 'an HA-LCARS theme', 'HACS', 'HA_TOKEN', 'tagName HA-DIALOG', 'HA-* elements',
        '`HA` in code', '[link](https://example.com/HA)', '<span title="HA">x</span>']) assert.ok(!hasBareHa(ok), ok);
});

test('matcher: markdown skips frontmatter keys and code, reads fence comments and titles', () => {
    const md = ['---', 'title: HA Actions', 'outline: HA', '---', 'Prose HA.', '```yaml', 'type: HA', 'x: 1   # HA comment', '```', '`HA`'].join('\n');
    assert.deepEqual(bareHaLines(md).map(h => h.line), [2, 5, 8]);
});

/** Every description/helper/title string anywhere in a schema object. */
function* schemaText(node, path = '') {
    if (Array.isArray(node)) { for (const [i, v] of node.entries()) yield* schemaText(v, `${path}[${i}]`); return; }
    if (!node || typeof node !== 'object') return;
    for (const [k, v] of Object.entries(node)) {
        if (['description', 'helper', 'title', 'markdownDescription'].includes(k) && typeof v === 'string') yield [`${path}.${k}`, v];
        else yield* schemaText(v, `${path}.${k}`);
    }
}

test('schema descriptions say "Home Assistant"', () => {
    const hits = [];
    let seen = 0;
    for (const { tag, schema } of getSchemaEntries()) {
        for (const [path, text] of schemaText(schema)) {
            seen++;
            if (hasBareHa(text)) hits.push(`${tag}${path}: ${text.slice(0, 80)}`);
        }
    }
    assert.ok(seen > 500, `walked only ${seen} schema strings`);
    assert.deepEqual(hits, []);
});

test('integration strings say "Home Assistant" (services.yaml, strings.json, translations)', () => {
    const hits = [];
    for (const file of ['services.yaml', 'strings.json', 'translations/en.json']) {
        readFileSync(join(ROOT, 'custom_components', 'lcards', file), 'utf8').split('\n').forEach((line, i) => {
            if (!line.trimStart().startsWith('#') && hasBareHa(line)) hits.push(`${file}:${i + 1}`);
        });
    }
    assert.deepEqual(hits, []);
});
