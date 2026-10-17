/**
 * TypeScript checking stays honest (see tsconfig.json and doc/development/typescript.md):
 * no @ts-ignore / @ts-nocheck anywhere in src/ (they hid ~400 errors and several real
 * bugs until 2026-10), every @ts-expect-error says why, and the generated custom
 * element map (src/types/elements.generated.d.ts) matches the elements we register.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const SRC = join(ROOT, 'src');
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(join(dir, e.name)) : /\.(js|ts)$/.test(e.name) ? [join(dir, e.name)] : []);

test('no @ts-ignore or @ts-nocheck in src/', () => {
    const hits = [];
    for (const file of walk(SRC)) {
        readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
            if (/@ts-(ignore|nocheck)\b/.test(line)) hits.push(`${relative(ROOT, file)}:${i + 1}`);
        });
    }
    assert.deepEqual(hits, [], 'fix the type error, or use @ts-expect-error <reason> for a genuine typing gap');
});

test('every @ts-expect-error gives a reason', () => {
    const bare = [];
    for (const file of walk(SRC)) {
        readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
            const m = /@ts-expect-error\b(.*)$/.exec(line);
            if (m && m[1].replace(/[\s*/:-]/g, '').length < 10) bare.push(`${relative(ROOT, file)}:${i + 1}`);
        });
    }
    assert.deepEqual(bare, []);
});

test('the custom element type map is current', () => {
    const r = spawnSync(process.execPath, [join(ROOT, 'scripts/generate-element-types.js'), '--check'], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
});
