/**
 * AssetManager SVG registry keys (D3b A1): a path or URL source is keyed by
 * the whole source, so two files with the same name in different folders do
 * not collide, and a user file named like a built-in never gets the built-in.
 */
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { AssetManager } from '../../src/core/assets/AssetManager.js';
import { installJsdom } from '../helpers/jsdom-env.js';

let am, fetched, realFetch, env;

/** @param {string} id */
const svg = (id) => `<svg xmlns="http://www.w3.org/2000/svg" id="${id}"/>`;

beforeEach(async () => {
    env = installJsdom(); // SVG content is validated with DOMParser
    fetched = [];
    realFetch = globalThis.fetch;
    globalThis.fetch = /** @type {any} */ (async (/** @type {string} */ u) => {
        fetched.push(u);
        return { ok: true, text: async () => svg(u) };
    });
    am = new AssetManager();
    await am.initialize();
});

afterEach(() => { globalThis.fetch = realFetch; env.restore(); });

test('same file name in two folders loads two different SVGs', async () => {
    const a = await am.loadSvg('/local/a/ship.svg');
    const b = await am.loadSvg('/local/b/ship.svg');
    assert.equal(a, svg('/local/a/ship.svg'));
    assert.equal(b, svg('/local/b/ship.svg'));
    assert.deepEqual(fetched, ['/local/a/ship.svg', '/local/b/ship.svg']);
});

test('a user file named like a built-in gets the user file, and the built-in stays', async () => {
    am.register('svg', 'ship', svg('builtin'), { pack: 'builtin_msd' });
    assert.equal(await am.loadSvg('/local/ship.svg'), svg('/local/ship.svg'));
    assert.equal(await am.loadSvg('https://example.com/x/ship.svg'), svg('https://example.com/x/ship.svg'));
    assert.equal(await am.loadSvg('builtin:ship'), svg('builtin'));
});

test('svgKeyForSource: built-ins by name, paths/URLs and media by the whole source', () => {
    assert.equal(am.svgKeyForSource('builtin:ncc-1701-a'), 'ncc-1701-a');
    assert.equal(am.svgKeyForSource('/local/a/ship.svg'), '/local/a/ship.svg');
    assert.equal(am.svgKeyForSource(' /local/a/ship.svg '), '/local/a/ship.svg');
    assert.equal(am.svgKeyForSource('https://x.test/ship.svg'), 'https://x.test/ship.svg');
    assert.equal(am.svgKeyForSource('media-source://media_source/local/s.svg'), 'media-source://media_source/local/s.svg');
    assert.equal(am.svgKeyForSource('ncc-1701-a'), 'ncc-1701-a');
    assert.equal(am.svgKeyForSource(''), null);
    assert.equal(am.svgKeyForSource('none'), null);
});

test('the registry entry for a loaded path is found again by its source (sync readers)', async () => {
    await am.loadSvg('/local/a/ship.svg');
    const key = am.svgKeyForSource('/local/a/ship.svg');
    assert.equal(am.getRegistry('svg').get(key), svg('/local/a/ship.svg'));
    assert.equal(am.getMetadata('svg', key)?.source, 'user');
});

test('getSvgContent (MSD anchors, studio previews) finds a loaded path or URL SVG by its source', async () => {
    const { getSvgContent } = await import('../../src/utils/lcards-anchor-helpers.js');
    const w = /** @type {any} */ (globalThis.window);
    const saved = w.lcards;
    w.lcards = { core: { assetManager: am } };
    try {
        am.register('svg', 'ship', svg('builtin'), { pack: 'builtin_msd' });
        await am.loadSvg('/local/b/ship.svg');
        await am.loadSvg('https://example.com/ship.svg');
        assert.equal(getSvgContent('/local/b/ship.svg'), svg('/local/b/ship.svg'));
        assert.equal(getSvgContent('https://example.com/ship.svg'), svg('https://example.com/ship.svg'));
        assert.equal(getSvgContent('builtin:ship'), svg('builtin'));
        assert.equal(getSvgContent('/local/other/ship.svg') ?? null, null);
    } finally {
        w.lcards = saved;
    }
});
