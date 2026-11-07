/**
 * The user-facing docs formula (reports/d2-pilot-compare.md, "The formula"):
 * block-style YAML in examples, one key-table shape, and the example before
 * the table in every section. Pages join FORMATTED as they are reworked.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const ROOT = path.resolve(import.meta.dirname, '../..');

/** Pages written to the formula */
const FORMATTED = [
  'doc/cards/slider-card/index.md',
  'doc/cards/slider-card/styles.md',
  'doc/cards/slider-card/components.md',
  'doc/cards/slider-card/ranges.md',
  'doc/cards/slider-card/control.md',
  'doc/cards/astrometrics/objects.md',
  'doc/cards/astrometrics/objects/surfaces.md',
  'doc/cards/astrometrics/objects/lines.md',
  'doc/cards/astrometrics/objects/space.md',
  'doc/cards/astrometrics/objects/ships.md'
];

const KEY_TABLE = '| Key | Type | Default | Description |';

/** @param {string} md */
const yamlBlocks = (md) => [...md.matchAll(/^```yaml[^\n]*\n([\s\S]*?)^```$/gm)].map((m) => ({ body: m[1], at: m.index ?? 0 }));

/** Sections split at H2/H3 headings, fenced code skipped @param {string} md */
function sections(md) {
  /** @type {{ heading: string, text: string }[]} */
  const out = [{ heading: '(top)', text: '' }];
  let fenced = false;
  for (const line of md.split('\n')) {
    if (line.startsWith('```')) fenced = !fenced;
    if (!fenced && /^#{2,3} /.test(line)) out.push({ heading: line, text: '' });
    else out[out.length - 1].text += line + '\n';
  }
  return out;
}

for (const file of FORMATTED) {
  const md = fs.readFileSync(path.join(ROOT, file), 'utf8');

  test(`${file}: examples use block-style YAML (no { } maps)`, () => {
    const bad = [];
    for (const { body } of yamlBlocks(md)) {
      const doc = YAML.parseDocument(body);
      YAML.visit(doc, {
        Map(_, node) { if (node.flow) bad.push(String(node).slice(0, 60)); },
        Seq(_, node) { if (node.flow && node.items.some((i) => !YAML.isScalar(i))) bad.push(String(node).slice(0, 60)); }
      });
    }
    assert.deepEqual(bad, [], 'write these out in block style');
  });

  test(`${file}: key tables are ${KEY_TABLE}`, () => {
    const heads = md.split('\n').filter((l) => /^\|\s*`?(Key|Field)\b/.test(l));
    assert.deepEqual(heads.filter((l) => l.trim() !== KEY_TABLE), []);
  });

  test(`${file}: a section with a key table shows an example before it`, () => {
    const missing = sections(md)
      .filter((s) => s.text.includes(KEY_TABLE))
      .filter((s) => {
        const ex = s.text.search(/^```yaml/m);
        return ex < 0 || ex > s.text.indexOf(KEY_TABLE);
      })
      .map((s) => s.heading);
    assert.deepEqual(missing, []);
  });
}
