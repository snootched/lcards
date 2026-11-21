/**
 * Built-in asset URLs resolve against the bundle folder (src/utils/bundle-url.js).
 *
 * The versioned docs site serves the bundle from /dev/lcards/ or
 * /v/<version>/lcards/; a root-absolute /lcards/... URL there fetched the
 * latest channel's copy (or a 404). The loader stub records its folder in
 * window.__LCARDS_BOOT__.base and bundleUrl() maps /lcards/... onto it.
 *
 * The source guard below holds the rule for src/:
 *   - A literal '/lcards/...' URL in code is resolved with bundleUrl() on the
 *     same line (fetch, <img src>, <link href>, new Audio, @font-face url()).
 *   - Pack data (src/core/packs/**: `url:` values and BASE_URL constants) keeps
 *     the written /lcards/... form: AssetManager and SoundManager resolve it at
 *     use. Pack files must still never fetch or link such a URL themselves.
 *   - A few constants that are resolved where they are used are listed in
 *     ALLOWED below, with the reason.
 *   - Font stylesheets (src/assets/fonts/*.css) use url()s relative to their
 *     own folder, never /lcards/fonts/.
 */
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundleUrl, bundleBase, BUILTIN_PREFIX } from '../../src/utils/bundle-url.js';

const root = fileURLToPath(new URL('../..', import.meta.url));

afterEach(() => { delete window.__LCARDS_BOOT__; });

test('with no recorded base, URLs come back unchanged', () => {
    delete window.__LCARDS_BOOT__;
    assert.equal(bundleBase(), '/lcards/');
    assert.equal(bundleUrl('/lcards/models/galaxy-class.glb'), '/lcards/models/galaxy-class.glb');
});

test('with no window at all (plain node), URLs come back unchanged', () => {
    const saved = globalThis.window;
    // remove the shim's window on purpose
    delete globalThis.window;
    try {
        assert.equal(typeof window, 'undefined');
        assert.equal(bundleBase(), '/lcards/');
        assert.equal(bundleUrl('/lcards/msd/ncc-1701-a.svg'), '/lcards/msd/ncc-1701-a.svg');
    } finally {
        globalThis.window = saved;
    }
});

test('Home Assistant base /lcards/ gives identical URLs', () => {
    window.__LCARDS_BOOT__ = { log: null, base: '/lcards/' };
    for (const u of ['/lcards/fonts/lcards_antonio.css', '/lcards/sounds/lcards_default/tap.mp3', '/lcards/images/astro-studio/starter-x.webp']) {
        assert.equal(bundleUrl(u), u);
    }
});

test('a /dev/lcards/ base moves built-in URLs under it', () => {
    window.__LCARDS_BOOT__ = { log: null, base: '/dev/lcards/' };
    assert.equal(bundleBase(), '/dev/lcards/');
    assert.equal(bundleUrl('/lcards/models/galaxy-class.glb'), '/dev/lcards/models/galaxy-class.glb');
    assert.equal(bundleUrl('/lcards/msd/ncc-1701-a.svg'), '/dev/lcards/msd/ncc-1701-a.svg');
    assert.equal(bundleUrl('/lcards/brand/icon@2x.png'), '/dev/lcards/brand/icon@2x.png');
});

test('a full-origin base (bundle on another host) is used as given', () => {
    window.__LCARDS_BOOT__ = { log: null, base: 'https://cdn.example/v/2026.11.0/lcards/' };
    assert.equal(bundleUrl('/lcards/fonts/x.css'), 'https://cdn.example/v/2026.11.0/lcards/fonts/x.css');
});

test('anything that is not a built-in /lcards/ URL is untouched', () => {
    window.__LCARDS_BOOT__ = { log: null, base: '/dev/lcards/' };
    for (const u of [
        '/lcards-user/models/my.glb',
        '/local/images/bridge.jpg',
        '/hacsfiles/x.svg',
        'https://example.com/lcards/x.svg',
        'http://example.com/x.png',
        'builtin:galaxy_class',
        'media-source://lcards/my_models/a.glb',
        'data:image/svg+xml,<svg/>',
        'lcards/models/relative.glb',
        '/lcards',
        '',
    ]) {
        assert.equal(bundleUrl(u), u, u);
    }
    assert.equal(bundleUrl(null), null);
    assert.equal(bundleUrl(undefined), undefined);
});

test('a malformed recorded base falls back to /lcards/', () => {
    // a bad value on purpose
    window.__LCARDS_BOOT__ = { log: null, base: 42 };
    assert.equal(bundleBase(), BUILTIN_PREFIX);
    window.__LCARDS_BOOT__ = { log: null, base: '/no-trailing-slash' };
    assert.equal(bundleBase(), BUILTIN_PREFIX);
    assert.equal(bundleUrl('/lcards/x.css'), '/lcards/x.css');
});

test('the loader stub records its folder as the base', () => {
    const stub = readFileSync(join(root, 'src/lcards.js'), 'utf8');
    assert.match(stub, /window\.__LCARDS_BOOT__ = \{ log, base \}/);
    // inlined, not imported: a module shared with the main chunk would land in the entry
    assert.doesNotMatch(stub, /^import .*bundle-url/m);
});

// ── Source guard ─────────────────────────────────────────────────────────────

/** Lines that may hold a literal /lcards/ URL without bundleUrl(), and why. */
const ALLOWED = [
    ['src/lcards.js', "let base = '/lcards/';", 'the stub\'s default base itself'],
    ['src/utils/bundle-url.js', "export const BUILTIN_PREFIX = '/lcards/';", 'the prefix bundleUrl() maps'],
    ['src/editor/dialogs/astro-studio/starter-gallery.js', "export const PICTURE_BASE = '/lcards/images/astro-studio/';", 'data constant: the picture helpers wrap it in bundleUrl()'],
    ['src/editor/dialogs/lcards-msd-studio-dialog.js', "source.startsWith('/lcards/') || source.startsWith(bundleBase())", 'a source check, not a load: it accepts both forms'],
];

/** A built-in URL literal: a quote, backtick or ( straight before /lcards/. */
const LITERAL = /["'`(]\/lcards\//;
/** Loading one directly, whatever file it is in. */
const DIRECT_LOAD = /(fetch\(\s*|new Audio\(\s*|\b(src|href)\s*=\s*["'`]?|url\(\s*["'`]?)["'`]?\/lcards\//;

/** @param {string} dir @returns {string[]} */
function walk(dir) {
    return readdirSync(dir).flatMap((name) => {
        const p = join(dir, name);
        return statSync(p).isDirectory() ? walk(p) : [p];
    });
}

/** @param {string} line */
const isComment = (line) => /^\s*(\*|\/\/|\/\*)/.test(line);

test('source guard: src/ code resolves literal /lcards/ URLs with bundleUrl()', () => {
    const problems = [];
    for (const file of walk(join(root, 'src')).filter((f) => /\.(js|ts)$/.test(f))) {
        const rel = relative(root, file).replaceAll('\\', '/');
        if (rel.startsWith('src/types/')) continue;
        const isPack = rel.startsWith('src/core/packs/');
        readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
            if (isComment(line) || !LITERAL.test(line) || line.includes('bundleUrl(')) return;
            if (ALLOWED.some(([f, text]) => f === rel && line.includes(text))) return;
            // pack data keeps the written form; packs never load it themselves
            if (isPack && !DIRECT_LOAD.test(line)) return;
            problems.push(`${rel}:${i + 1}: ${line.trim()}`);
        });
    }
    assert.deepEqual(problems, [], 'wrap built-in /lcards/ URLs in bundleUrl() where they are fetched, linked or used as a src (see the rule at the top of this file)');
});

test('source guard: font stylesheets use url()s relative to the fonts folder', () => {
    const dir = join(root, 'src/assets/fonts');
    const bad = readdirSync(dir).filter((f) => f.endsWith('.css'))
        .filter((f) => /url\(\s*["']?\/lcards\//.test(readFileSync(join(dir, f), 'utf8')));
    assert.deepEqual(bad, []);
});
