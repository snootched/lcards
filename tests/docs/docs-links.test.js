/**
 * Every docs link the YAML editor and playgrounds offer (src/editor/utils/
 * yaml-docs-links.js) points at a real page and heading on the built docs site.
 * Skips when the site isn't built (run `npm run docs:build`).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listDocsLinks, docsUrl } from '../../src/editor/utils/yaml-docs-links.js';

const DIST = fileURLToPath(new URL('../../doc/.vitepress/dist', import.meta.url));
const built = existsSync(join(DIST, 'index.html'));

/** Built HTML file for a site path ('/cards/button/' or '/core/actions'). */
function pageFile(path) {
    const clean = path.replace(/\/$/, '');
    for (const candidate of [join(DIST, `${clean}.html`), join(DIST, clean, 'index.html')]) {
        if (existsSync(candidate)) return candidate;
    }
    return null;
}

test('every docs link resolves to a page and heading on the built site', { skip: !built && 'docs site not built' }, () => {
    const broken = [];
    for (const link of listDocsLinks()) {
        const [path, anchor] = link.split('#');
        const file = pageFile(path);
        if (!file) { broken.push(`${link} (no page)`); continue; }
        if (anchor && !readFileSync(file, 'utf8').includes(`id="${anchor}"`)) broken.push(`${link} (no #${anchor})`);
    }
    assert.deepEqual(broken, []);
});

test('docsUrl points at the published .html page', () => {
    assert.equal(docsUrl('/cards/button/#presets'), 'https://lcards.unimatrix01.ca/cards/button/#presets');
    assert.equal(docsUrl('/core/actions'), 'https://lcards.unimatrix01.ca/core/actions.html');
    assert.equal(docsUrl('/cards/common#stacking-z-index'), 'https://lcards.unimatrix01.ca/cards/common.html#stacking-z-index');
});
