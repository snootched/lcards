/**
 * Every <lcards-*> element an editor renders must be defined by a module the
 * editor imports (directly or through its imports). Otherwise the element
 * only works when some other editor happened to load first: the elbow editor
 * rendered an empty background animation section on a dashboard of elbows,
 * because only the button editor imported that component (found 2026-10-24).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../src');

/** @param {string} dir @returns {string[]} */
const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') ? [p] : [];
});
const files = walk(root);
const source = new Map(files.map((f) => [f, readFileSync(f, 'utf8')]));

/** tag -> module that defines it */
const definedBy = new Map();
for (const [file, text] of source) {
  for (const m of text.matchAll(/customElements\.define\(\s*['"]([a-z0-9-]+)['"]/g)) definedBy.set(m[1], file);
}

/** Every module `file` imports, transitively (static imports only) */
function closure(file, seen = new Set()) {
  if (seen.has(file)) return seen;
  seen.add(file);
  const text = source.get(file) ?? '';
  for (const m of text.matchAll(/^\s*import\s+(?:[^'"]*?\s+from\s+)?['"](\.[^'"]+)['"]/gm)) {
    closure(resolve(dirname(file), m[1]), seen);
  }
  return seen;
}

const editors = files.filter((f) => /[/\\]editor[/\\]cards[/\\]lcards-[a-z-]+-editor\.js$/.test(f));

for (const editor of editors) {
  test(`${editor.slice(root.length + 1)} imports every lcards element it renders`, () => {
    const imported = closure(editor);
    const used = new Set([...source.get(editor).matchAll(/<(lcards-[a-z0-9-]+)[\s>]/g)].map((m) => m[1]));
    const missing = [...used].filter((tag) => definedBy.has(tag) && !imported.has(definedBy.get(tag)));
    assert.deepEqual(missing, []);
  });
}
