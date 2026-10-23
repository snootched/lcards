/**
 * Dialog footers and buttons follow HA's dialog conventions (lcards-ha-frontend skill,
 * reports/ha-frontend-skills-audit.md B1/C1):
 *
 * - Footers are `<ha-dialog-footer slot="footer">` (templates) or createDialogFooter()
 *   (imperative dialogs), never a hand-built `div slot="footer"` or loose footer buttons.
 * - Cancel and Close buttons are `appearance="plain"`, except a lone Close, which is
 *   the dialog's primaryAction (HA's own pattern).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const walk = (dir) => readdirSync(dir).flatMap(n => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') ? [p] : [];
});
const sources = walk(join(ROOT, 'src')).map(p => ({ file: relative(ROOT, p), text: readFileSync(p, 'utf8') }));
const lineOf = (text, index) => text.slice(0, index).split('\n').length;

// <ha-button ...>label</ha-button>, where attributes may hold ${...} expressions containing '>'.
const HA_BUTTON = /<ha-button\b((?:\$\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}|[^>])*)>((?:(?!<\/ha-button>)[\s\S]){0,300}?)<\/ha-button>/g;

test('no hand-built dialog footers', () => {
    const hits = [];
    for (const { file, text } of sources) {
        if (file === 'src/utils/lcards-shared-helpers.js') continue;   // createDialogFooter itself
        for (const m of text.matchAll(/<div\b[^>]*\bslot="footer"|\.slot = 'footer'|setAttribute\('slot', 'footer'\)/g)) {
            hits.push(`${file}:${lineOf(text, m.index)}`);
        }
    }
    assert.deepEqual(hits, [], 'use <ha-dialog-footer slot="footer"> or createDialogFooter()');
});

test('Cancel and Close buttons are plain (a lone Close is the primaryAction)', () => {
    const hits = [];
    for (const { file, text } of sources) {
        for (const m of text.matchAll(HA_BUTTON)) {
            const label = m[2].replace(/<[^>]+>/g, '').trim();
            if (!['Cancel', 'Close'].includes(label)) continue;
            const attrs = m[1];
            if (attrs.includes('appearance="plain"')) continue;
            if (label === 'Close' && attrs.includes('slot="primaryAction"')) continue;
            hits.push(`${file}:${lineOf(text, m.index)} ${label}`);
        }
        for (const m of text.matchAll(/(\w+)\.textContent = 'Cancel';/g)) {
            const around = text.slice(Math.max(0, m.index - 400), m.index + 400);
            if (!around.includes(`${m[1]}.setAttribute('appearance', 'plain')`)) hits.push(`${file}:${lineOf(text, m.index)} ${m[1]}`);
        }
    }
    assert.deepEqual(hits, []);
});

test('createDialogFooter puts secondary actions before primary ones in HA slots', async () => {
    const { installJsdom } = await import('../helpers/jsdom-env.js');
    const env = installJsdom();
    try {
        const { createDialogFooter } = await import('../../src/utils/lcards-shared-helpers.js');
        const cancel = document.createElement('ha-button');
        const save = document.createElement('ha-button');
        const footer = createDialogFooter({ secondary: [cancel], primary: [save] });
        assert.equal(footer.localName, 'ha-dialog-footer');
        assert.equal(footer.slot, 'footer');
        assert.deepEqual([...footer.children].map(c => c.slot), ['secondaryAction', 'primaryAction']);
        assert.deepEqual([...footer.children], [cancel, save]);
    } finally {
        env.restore();
    }
});
