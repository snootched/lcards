/**
 * Every docs link LCARdS offers points at a real page and heading on the built docs
 * site: the YAML editor and playgrounds (src/editor/utils/yaml-docs-links.js) and
 * the editor tabs, studios, panel and card picker (src/utils/docs-url.js) and
 * the "How LCARdS works" diagram (doc/.vitepress/theme/how-it-works-model.js).
 * Skips when the site isn't built (run `npm run docs:build`).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync } from 'node:fs';
import { listDocsLinks, docsUrl, docsBase, editorTabDocs } from '../../src/editor/utils/yaml-docs-links.js';
import { ALL_BOXES, EXAMPLES, CONNECTIONS, connected } from '../../doc/.vitepress/theme/how-it-works-model.js';

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

/** Links (site paths with an optional #anchor) that don't resolve on the built site. */
function brokenLinks(links) {
    const broken = [];
    for (const link of new Set(links)) {
        const [path, anchor] = link.split('#');
        const file = pageFile(path);
        if (!file) { broken.push(`${link} (no page)`); continue; }
        if (anchor && !readFileSync(file, 'utf8').includes(`id="${anchor}"`)) broken.push(`${link} (no #${anchor})`);
    }
    return broken;
}

test('every docs link resolves to a page and heading on the built site', { skip: !built && 'docs site not built' }, () => {
    assert.deepEqual(brokenLinks(listDocsLinks()), []);
});

test('every box in the How LCARdS works diagram links to a docs page', { skip: !built && 'docs site not built' }, () => {
    assert.deepEqual(brokenLinks(Object.values(ALL_BOXES).map(b => b.link)), []);
});

test('every connection in the diagram names real boxes, and every card connects to the core', () => {
    for (const [from, to] of Object.entries(CONNECTIONS)) {
        assert.ok(ALL_BOXES[from], `no box "${from}"`);
        for (const id of to) assert.ok(ALL_BOXES[id], `${from} -> no box "${id}"`);
    }
    for (const id of ['button', 'chart', 'msd', 'overlay']) assert.ok(connected(id).includes('themes'), `${id} uses themes`);
    assert.ok(connected('themes').includes('button'), 'connections work both ways');
});

test('every example step in the diagram lights up real boxes', () => {
    for (const ex of EXAMPLES) {
        for (const [i, step] of ex.steps.entries()) {
            assert.ok(step.boxes.length && step.text, `${ex.id} step ${i + 1}`);
            for (const id of step.boxes) assert.ok(ALL_BOXES[id], `${ex.id} step ${i + 1}: no box "${id}"`);
        }
    }
});

test('docsUrl points at the published .html page', () => {
    assert.equal(docsUrl('/cards/button/#presets'), 'https://lcards.unimatrix01.ca/cards/button/#presets');
    assert.equal(docsUrl('/core/actions'), 'https://lcards.unimatrix01.ca/core/actions.html');
    assert.equal(docsUrl('/cards/common#stacking-z-index'), 'https://lcards.unimatrix01.ca/cards/common.html#stacking-z-index');
});

test('a -dev build links to the dev docs, a stable build to the root', () => {
    assert.equal(docsBase('2026.10.0-dev.2'), 'https://lcards.unimatrix01.ca/dev');
    assert.equal(docsBase('2026.10.0'), 'https://lcards.unimatrix01.ca');
    assert.equal(docsUrl('/core/actions', '2026.11.0-dev.1'), 'https://lcards.unimatrix01.ca/dev/core/actions.html');
});

// Each card editor's cardType and the labels of its tabs (static scan of _getTabDefinitions
// and the shared utility tabs).
const EDITOR_DIR = 'src/editor/cards';
function editorTabs() {
    const base = readFileSync('src/editor/base/LCARdSBaseEditor.js', 'utf8');
    const utility = [...base.slice(base.indexOf('_getUtilityTabs() {')).slice(0, 400).matchAll(/label: '([^']+)'/g)].map(m => m[1]);
    const out = [];
    for (const file of readdirSync(EDITOR_DIR).filter(f => f.endsWith('-editor.js'))) {
        const src = readFileSync(join(EDITOR_DIR, file), 'utf8');
        const cardType = /this\.cardType = '([^']+)'/.exec(src)?.[1];
        const start = src.indexOf('_getTabDefinitions() {');
        if (!cardType || start === -1) continue;
        const body = src.slice(start, src.indexOf('\n    }\n', start));
        for (const m of body.matchAll(/label: '([^']+)'(,\s*docs: '([^']+)')?/g)) out.push({ file, cardType, label: m[1], docs: m[3] });
        if (body.includes('_getUtilityTabs()')) for (const label of utility) out.push({ file, cardType, label });
    }
    return out;
}

test('every card editor tab has a docs link', () => {
    const tabs = editorTabs();
    assert.ok(tabs.length > 40, `found ${tabs.length} tabs`);
    const missing = tabs.filter(t => !t.docs && !editorTabDocs(t.cardType, t.label)).map(t => `${t.file}: ${t.label}`);
    assert.deepEqual(missing, []);
});

test('tab-specific docs links resolve on the built site', { skip: !built && 'docs site not built' }, () => {
    assert.deepEqual(brokenLinks(editorTabs().filter(t => t.docs).map(t => t.docs)), []);
});

test('no docs URL is written out by hand in src (use docsUrl and DOCS from utils/docs-url.js)', () => {
    const offenders = [];
    const walk = (dir) => {
        for (const ent of readdirSync(dir, { withFileTypes: true })) {
            const p = join(dir, ent.name);
            if (ent.isDirectory()) walk(p);
            else if (p.endsWith('.js') && !['src/utils/docs-url.js', 'src/lcards-vars.js'].includes(p)
                && /https:\/\/lcards\.unimatrix01\.ca\//.test(readFileSync(p, 'utf8'))) offenders.push(p);
        }
    };
    walk('src');
    assert.deepEqual(offenders, []);
});