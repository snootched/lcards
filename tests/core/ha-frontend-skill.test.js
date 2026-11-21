/**
 * The lcards-ha-frontend project skill (.claude/skills/lcards-ha-frontend/) maps every
 * upstream ha-frontend-* skill in the sibling HA frontend checkout to follow / translate /
 * ignore. A new upstream skill without a row fails here instead of loading unmapped.
 * Skipped when ../frontend is not checked out (CI).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const UPSTREAM = join(dirname(ROOT), 'frontend', '.agents', 'skills');
const bridge = readFileSync(join(ROOT, '.claude', 'skills', 'lcards-ha-frontend', 'SKILL.md'), 'utf8');
const rows = [...bridge.matchAll(/^\| `(ha-frontend-[a-z-]+)` \|/gm)].map(m => m[1]);

test('every upstream ha-frontend-* skill has a row in the bridge', { skip: !existsSync(UPSTREAM) && 'no ../frontend checkout' }, () => {
    const upstream = readdirSync(UPSTREAM).filter(n => n.startsWith('ha-frontend-')).sort();
    assert.ok(upstream.length > 0);
    assert.deepEqual(upstream.filter(n => !rows.includes(n)), [], 'add a row to .claude/skills/lcards-ha-frontend/SKILL.md');
    assert.deepEqual(rows.filter(n => !upstream.includes(n)), [], 'upstream skill removed or renamed: drop or rename its row');
});

test('bridge rows are unique', () => {
    assert.equal(new Set(rows).size, rows.length);
});
