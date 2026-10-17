/**
 * Studio layouts below 1024px. The shared studioDialogStyles stacks the default
 * 50/50 layout into one column and two `1fr 1fr` rows. A studio that overrides
 * `.studio-layout { grid-template-columns }` without also setting
 * grid-template-rows kept those two rows beside its own two columns: config and
 * preview squeezed into the top half with an empty row below (MSD, chart and
 * datasource studios, 2026-10).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const SHARED = 'src/editor/dialogs/studio-dialog-styles.js';
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.js') ? [join(dir, e.name)] : []);

test('a .studio-layout that sets its own columns also sets its rows', () => {
    const offenders = [];
    for (const file of walk(join(ROOT, 'src/editor'))) {
        const rel = relative(ROOT, file);
        if (rel === SHARED) continue;
        const text = readFileSync(file, 'utf8');
        for (const m of text.matchAll(/\.studio-layout\s*\{([^}]*)\}/g)) {
            const body = m[1];
            if (/grid-template-columns\s*:/.test(body) && !/grid-template-rows\s*:/.test(body)) {
                offenders.push(`${rel}:${text.slice(0, m.index).split('\n').length}`);
            }
        }
    }
    assert.deepEqual(offenders, []);
});
