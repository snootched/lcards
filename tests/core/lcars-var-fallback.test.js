/**
 * Rendered defaults (card code, component and preset packs, theme tokens) must give every
 * HA-LCARS variable a fallback: `var(--lcars-x, ...)`. A bare `var(--lcars-x)` is empty
 * wherever HA-LCARS isn't installed (and on the docs site), so the part draws nothing:
 * the alert component's shield and text were invisible that way. The variable names
 * themselves are checked by validate-css-vars; this checks that they can't come out empty.
 * Schemas are skipped: their examples are written for HA-LCARS users.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const walk = (dir) => readdirSync(dir).flatMap(f => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? (f === 'schemas' ? [] : walk(p)) : p.endsWith('.js') ? [p] : [];
});

test('rendered --lcars-* variables have a fallback (cards, packs, theme tokens)', () => {
    const bare = [];
    for (const file of [...walk(join(ROOT, 'src/cards')), ...walk(join(ROOT, 'src/core/packs'))]) {
        readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
            if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
            for (const m of line.matchAll(/var\(--lcars-[a-z0-9-]+\)/g)) bare.push(`${file.slice(ROOT.length)}:${i + 1} ${m[0]}`);
        });
    }
    assert.deepEqual(bare, []);
});
