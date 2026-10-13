/**
 * Editor and panel UI guards: patterns the shared look replaced stay gone
 * (.github/instructions/editor.instructions.md, "Dialogs, surfaces and messages").
 *
 * - No native dialogs (confirm/alert/prompt), no <textarea> for code and no
 *   raw <select> (ha-selector with a select selector).
 * - Messages stay short (lcards-message text up to MESSAGE_LIMIT characters):
 *   longer explanations are info guides (renderInfoGuide).
 * - ha-alert only where it is the point (the lcards-message wrapper, developer
 *   errors in shared components, the theme lab's alert previews).
 * - The old hand-built guide markup (preset-info-guide) is gone.
 * - No emoji in the UI (mdi icons instead); only the 🖖 on Main Engineering.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOTS = ['src/editor', 'src/panels'];
const MESSAGE_LIMIT = 200;

/** Where a direct ha-alert is intended. */
const HA_ALERT_ALLOWED = new Set([
    'src/editor/components/shared/lcards-message.js',          // the wrapper itself
    'src/editor/components/shared/lcards-form-field.js',       // developer errors
    'src/editor/components/editors/lcards-object-editor.js',
    'src/editor/components/editors/lcards-color-section-v2.js',
    'src/editor/components/editors/lcards-icon-section.js',
    'src/editor/base/LCARdSBaseEditor.js',                     // schema / validation errors
    'src/editor/components/theme-browser/lcards-theme-generator-view.js', // previews of HA's own alerts
]);

function files(dir) {
    const out = [];
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) out.push(...files(p));
        else if (p.endsWith('.js')) out.push(p);
    }
    return out;
}
const SOURCES = ROOTS.flatMap(files).map(p => ({ path: relative('.', p).replace(/\\/g, '/'), text: readFileSync(p, 'utf8') }));

/** Code only: comments removed (so documentation can mention the patterns); line numbers kept. */
const code = (text) => text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, '')).replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

test('no native confirm / alert / prompt dialogs', () => {
    const hits = SOURCES.flatMap(({ path, text }) =>
        [...code(text).matchAll(/(?:^|[^.\w$])(?:window\.)?(confirm|alert|prompt)\(/g)].map(m => `${path}: ${m[1]}(`));
    assert.deepEqual(hits, []);
});

test('no <textarea> (code goes in a code editor)', () => {
    assert.deepEqual(SOURCES.filter(({ text }) => /<textarea\b/.test(code(text))).map(s => s.path), []);
});

test('no raw <select> (ha-selector with a select selector)', () => {
    assert.deepEqual(SOURCES.filter(({ text }) => /<select\b/.test(code(text))).map(s => s.path), []);
});

test(`lcards-message text stays short (${MESSAGE_LIMIT} characters); longer explanations are info guides`, () => {
    const long = [];
    for (const { path, text } of SOURCES) {
        for (const m of code(text).matchAll(/<lcards-message\b([^>]*)>([\s\S]*?)<\/lcards-message>/g)) {
            const attr = /message=(?:"([^"]*)"|\$\{'([^']*)'\})/.exec(m[1]);
            const body = attr ? (attr[1] ?? attr[2]) : m[2];
            const plain = body.replace(/<[^>]+>/g, ' ').replace(/\$\{[^}]*\}/g, '').replace(/\s+/g, ' ').trim();
            if (plain.length > MESSAGE_LIMIT) long.push(`${path} (${plain.length}): ${plain.slice(0, 60)}`);
        }
    }
    assert.deepEqual(long, []);
});

test('ha-alert only where it is intended (otherwise lcards-message)', () => {
    const hits = SOURCES.filter(({ path, text }) => !HA_ALERT_ALLOWED.has(path) && /<ha-alert\b/.test(code(text))).map(s => s.path);
    assert.deepEqual(hits, []);
});

test('no hand-built guide markup (renderInfoGuide instead)', () => {
    assert.deepEqual(SOURCES.filter(({ text }) => /class="preset-info-guide/.test(text)).map(s => s.path), []);
});

// Emoji: those drawn as emoji (arrows and other symbols in text style are fine), and ⚠.
test('no emoji in the UI except the 🖖 on Main Engineering (log messages may keep theirs)', () => {
    const hits = [];
    for (const { path, text } of SOURCES) {
        code(text).split('\n').forEach((line, i) => {
            if (/lcardsLog|console\./.test(line)) return;
            for (const m of line.matchAll(/\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F|\u26A0/gu)) {
                if (m[0] !== '🖖') hits.push(`${path}:${i + 1} ${m[0]}`);
            }
        });
    }
    assert.deepEqual(hits, []);
});
