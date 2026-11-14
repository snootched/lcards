/**
 * Line-art MSD backgrounds (src/assets/msd/*-lineart.svg, made by
 * scripts/make-msd-lineart.mjs from the built-in ship models): registered in
 * the built-in pack, drawn in currentColor under a theme variable, with the
 * named anchors the docs list, all inside the drawing.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BUILTIN_MSD_SVG_PACK } from '../../src/core/packs/builtin-msd.js';

const svg = readFileSync(new URL('../../src/assets/msd/galaxy-class-lineart.svg', import.meta.url), 'utf8');
const docs = readFileSync(new URL('../../doc/cards/msd/background.md', import.meta.url), 'utf8');
const ANCHORS = ['bridge', 'saucer', 'neck', 'engineering', 'warp_core', 'impulse', 'shuttle_bay', 'deflector', 'torpedo', 'nacelle', 'bussard', 'pylon'];

test('the Galaxy class line art is a built-in blueprint', () => {
    const entry = BUILTIN_MSD_SVG_PACK.svg_assets['galaxy-class-lineart'];
    assert.equal(entry?.url, '/lcards/msd/galaxy-class-lineart.svg');
    assert.equal(entry.metadata.license, 'MIT');
    assert.match(docs, /`builtin:galaxy-class-lineart`/);
});

test('its lines use currentColor under a theme variable, no fixed colours', () => {
    assert.match(svg, /<g fill="none" stroke="currentColor"[^>]* style="color: var\(--lcards?-[a-z-]+, #[0-9a-f]{6}\)">/);
    // Nothing paint-related on the root: the MSD card keeps the root <svg>, so its
    // overlays (labels' button backgrounds) would inherit a stroke or fill from it.
    const root = /<svg [^>]*>/.exec(svg)[0];
    assert.doesNotMatch(root, /stroke|fill|style|color/);
    // The only hex is that fallback.
    assert.equal((svg.match(/#[0-9a-fA-F]{3,8}\b/g) || []).length, 1);
    const outline = /class="lineart-outline"[^>]* d="([^"]+)"/.exec(svg)?.[1] || '';
    assert.ok(outline.length > 1000, 'an outline');
    for (const cls of ['lineart-inside', 'lineart-crease', 'lineart-core']) assert.match(svg, new RegExp(`class="${cls}"`));
    // No ids on the groups: a g[id] would become an anchor.
    assert.doesNotMatch(svg, /<g [^>]*id=/);
});

test('its named anchors are the docs list, all inside the drawing', () => {
    const [, , w, h] = /viewBox="([\d. ]+)"/.exec(svg)[1].split(' ').map(Number);
    const found = Object.fromEntries([...svg.matchAll(/<circle id="([a-z_]+)" cx="([\d.]+)" cy="([\d.]+)" r="0"\/>/g)].map(m => [m[1], [Number(m[2]), Number(m[3])]]));
    assert.deepEqual(Object.keys(found).sort(), [...ANCHORS].sort());
    for (const [name, [x, y]] of Object.entries(found)) {
        assert.ok(x > 0 && x < w && y > 0 && y < h, name);
        assert.match(docs, new RegExp('`' + name + '`'), `${name} in the docs`);
    }
    // Side elevation, bow on the left: the bridge is ahead of the nacelle, above the engineering hull.
    assert.ok(found.bridge[0] < found.nacelle[0]);
    assert.ok(found.bridge[1] < found.engineering[1]);
    assert.ok(found.warp_core[1] > found.neck[1]);
});
