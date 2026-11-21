/**
 * Studio dialogs and their launchers (reports/d3d-bugs.md E1, E2):
 *
 * - A dialog's `@closed` handler acts only on the dialog's own `closed`
 *   (`e.target === e.currentTarget`): `closed` bubbles from pickers and selects
 *   inside it, and the Layout Studio used to cancel (restoring the initial config)
 *   on any of them.
 * - Every studio launcher keeps the open studio in `_studio`, forwards `hass` to
 *   it on change and drops it on close; the Chart Studio forwards `hass` to its
 *   preview card. State ticks on the Layout and MSD previews update hass on the
 *   card that is there instead of re-applying or rebuilding it.
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installJsdom } from '../helpers/jsdom-env.js';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const walk = (dir) => readdirSync(dir).flatMap(n => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') ? [p] : [];
});
const sources = walk(join(ROOT, 'src')).map(p => ({ file: relative(ROOT, p), text: readFileSync(p, 'utf8') }));
const lineOf = (text, index) => text.slice(0, index).split('\n').length;

/** The `${...}` expression starting at `start` (the index of `$`), braces balanced. */
function expressionAt(text, start) {
    let depth = 0;
    for (let i = start + 1; i < text.length; i++) {
        if (text[i] === '{') depth++;
        else if (text[i] === '}' && --depth === 0) return text.slice(start + 2, i);
    }
    return '';
}

/** Body of `name(...) {` in `text`, braces balanced; '' when absent. */
function methodBody(text, name) {
    const m = new RegExp(`\\n\\s+${name}\\([^)]*\\)\\s*\\{`).exec(text);
    if (!m) return '';
    let depth = 0;
    for (let i = m.index + m[0].length - 1; i < text.length; i++) {
        if (text[i] === '{') depth++;
        else if (text[i] === '}' && --depth === 0) return text.slice(m.index, i);
    }
    return '';
}

const OWN_DIALOG = /\.target === \w+\.currentTarget|\.target\.tagName === 'HA-DIALOG'/;

test('every @closed handler that acts checks the event is its own', () => {
    const hits = [];
    for (const { file, text } of sources) {
        for (const m of text.matchAll(/@closed=\$\{/g)) {
            const expr = expressionAt(text, m.index + '@closed='.length).trim();
            if (/^\(\w+\) => \w+\.stopPropagation\(\)$/.test(expr)) continue;   // swallow only
            const method = /^this\.(\w+)$/.exec(expr)?.[1];
            const body = method ? methodBody(text, method) : expr;
            if (!OWN_DIALOG.test(body)) hits.push(`${file}:${lineOf(text, m.index)} ${expr.slice(0, 60)}`);
        }
    }
    assert.deepEqual(hits, [], 'check e.target === e.currentTarget (see _onDialogClosed in the studio dialogs)');
});

describe('studios and launchers in a DOM', () => {
    let restore;
    /** @type {Record<string, any>} */
    const mods = {};

    before(async () => {
        const env = installJsdom();
        restore = env.restore;
        for (const key of ['Document', 'ShadowRoot', 'Element', 'Node', 'CSSStyleSheet', 'MutationObserver', 'DocumentFragment', 'Event', 'CustomEvent']) {
            if (globalThis[key] === undefined && env.dom.window[key] !== undefined) globalThis[key] = env.dom.window[key];
        }
        for (const name of ['chart', 'msd', 'layout-card', 'alert-overlay', 'astrometrics', 'data-grid']) {
            mods[name] = await import(`../../src/editor/cards/lcards-${name}-editor.js`);
        }
        mods.chartStudio = await import('../../src/editor/dialogs/lcards-chart-studio-dialog.js');
        mods.layoutStudio = await import('../../src/editor/dialogs/lcards-layout-studio-dialog.js');
        mods.msdStudio = await import('../../src/editor/dialogs/lcards-msd-studio-dialog.js');
        mods.astroStudio = await import('../../src/editor/dialogs/lcards-astrometrics-studio-dialog.js');
        mods.gridStudio = await import('../../src/editor/dialogs/lcards-data-grid-studio-dialog.js');
        mods.msdPreview = await import('../../src/editor/components/lcards-msd-live-preview.js');
    });
    after(() => restore?.());

    test('the studios close only on their own dialog closed', () => {
        const studios = [
            [mods.chartStudio.LCARdSChartStudioDialog, '_handleClose'],
            [mods.layoutStudio.LCARdSLayoutStudioDialog, '_handleCancel'],
            [mods.msdStudio.LCARdSMSDStudioDialog, '_handleClose'],
            [mods.astroStudio.LCARdSAstrometricsStudioDialog, '_close'],
            [mods.gridStudio.LCARdSDataGridStudioDialogV4, '_close'],
        ];
        for (const [Studio, closeName] of studios) {
            assert.ok(Studio, `studio class exported for ${closeName}`);
            let closes = 0;
            const studio = Object.create(Studio.prototype);
            Object.defineProperty(studio, closeName, { value: () => { closes++; } });
            const dialog = document.createElement('ha-dialog');
            const select = document.createElement('ha-select');
            dialog.appendChild(select);
            dialog.addEventListener('closed', (e) => Studio.prototype._onDialogClosed.call(studio, e));
            const fromChild = new Event('closed', { bubbles: true });
            select.dispatchEvent(fromChild);
            assert.equal(closes, 0, `${Studio.name}: a child's closed must not close the studio`);
            dialog.dispatchEvent(new Event('closed', { bubbles: true }));
            assert.equal(closes, 1, `${Studio.name}: its own closed closes it`);
        }
    });

    test('every launcher keeps the studio, forwards hass and drops it on close', async () => {
        const launchers = [
            [mods.chart.LCARdSChartEditor, '_openChartStudio'],
            [mods.msd.LCARdSMSDEditor, '_openMsdStudio'],
            [mods['layout-card'].LCARdSLayoutCardEditor, '_openStudio'],
            [mods['alert-overlay'].LCARdSAlertOverlayEditor, '_openAlertStudio'],
            [mods.astrometrics.LCARdSAstrometricsEditor, '_openStudio'],
            [mods['data-grid'].LCARdSDataGridEditor, '_openConfigurationStudio'],
        ];
        const realCreate = document.createElement.bind(document);
        /** @type {any[]} */
        const created = [];
        document.createElement = (tag, ...rest) => {
            if (!/-studio-dialog/.test(tag)) return realCreate(tag, ...rest);
            const fake = realCreate('div');
            created.push(fake);
            return fake;
        };
        try {
            for (const [Editor, open] of launchers) {
                const editor = /** @type {any} */ (new Editor());   // not connected: no render
                editor.hass = { id: 1 };
                editor.config = { type: 'x' };
                await editor[open]();
                const studio = created.at(-1);
                assert.ok(studio, `${Editor.name}: opened a studio`);
                assert.equal(editor._studio, studio, `${Editor.name}: keeps the studio`);
                assert.equal(studio.hass, editor.hass, `${Editor.name}: studio starts with hass`);

                const next = { id: 2 };
                editor.hass = next;
                Editor.prototype.updated.call(editor, new Map([['hass', undefined]]));
                assert.equal(studio.hass, next, `${Editor.name}: forwards hass`);

                studio.dispatchEvent(new Event('closed'));
                assert.equal(editor._studio, null, `${Editor.name}: drops the studio on close`);
                studio.remove();
            }
        } finally {
            document.createElement = realCreate;
        }
    });

    test('the Chart Studio forwards hass to its preview card', () => {
        const { LCARdSChartStudioDialog: Studio } = mods.chartStudio;
        const studio = Object.create(Studio.prototype);
        const mount = document.createElement('div');
        for (const [k, v] of Object.entries({ hass: { id: 1 }, _previewRef: { value: mount }, _previewCard: null,
            _previewEmpty: false, _previewError: null, _getPreviewConfig: () => ({ type: 'custom:lcards-chart' }) })) {
            Object.defineProperty(studio, k, { value: v, writable: true, configurable: true, enumerable: true });
        }
        const realCreate = document.createElement.bind(document);
        document.createElement = (tag, ...rest) => {
            const el = realCreate(tag === 'lcards-chart' ? 'div' : tag, ...rest);
            if (tag === 'lcards-chart') Object.assign(el, { setConfig() {} });
            return el;
        };
        try {
            studio._updatePreviewCard();
        } finally {
            document.createElement = realCreate;
        }
        const card = studio._previewCard;
        assert.ok(card && mount.contains(card), 'the preview card is kept');
        assert.equal(card.hass, studio.hass);

        studio.hass = { id: 2 };
        Studio.prototype.updated.call(studio, new Map([['hass', undefined]]));
        assert.equal(card.hass, studio.hass, 'hass reaches the preview card');
    });

    test('a hass tick updates the Layout Studio preview without a full sync', () => {
        const { LCARdSLayoutStudioDialog: Studio } = mods.layoutStudio;
        let syncs = 0;
        const studio = Object.create(Studio.prototype);
        for (const [k, v] of Object.entries({ hass: { id: 2 }, _previewEl: {}, _overlayEl: {}, _syncCanvas: () => { syncs++; } })) {
            Object.defineProperty(studio, k, { value: v, writable: true, configurable: true, enumerable: true });
        }
        Studio.prototype.updated.call(studio, new Map([['hass', undefined]]));
        assert.equal(syncs, 0);
        assert.equal(studio._previewEl.hass, studio.hass);
        assert.equal(studio._overlayEl.hass, studio.hass);

        Studio.prototype.updated.call(studio, new Map([['hass', undefined], ['config', undefined]]));
        assert.equal(syncs, 1, 'a config change still syncs the canvas');
    });

    test('a hass tick sets hass on the MSD preview card instead of rebuilding it', () => {
        const { LCARdSMSDLivePreview: Preview } = mods.msdPreview;
        let rebuilds = 0;
        const card = {};
        const preview = Object.create(Preview.prototype);
        for (const [k, v] of Object.entries({ hass: { id: 2 }, shadowRoot: { querySelector: () => card }, _schedulePreviewUpdate: () => { rebuilds++; } })) {
            Object.defineProperty(preview, k, { value: v, writable: true, configurable: true, enumerable: true });
        }
        Preview.prototype.updated.call(preview, new Map([['hass', undefined]]));
        assert.equal(rebuilds, 0);
        assert.equal(card.hass, preview.hass);

        Preview.prototype.updated.call(preview, new Map([['config', undefined]]));
        assert.equal(rebuilds, 1, 'a config change still rebuilds');
    });
});
