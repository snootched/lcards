/**
 * The Preview Your YAML page's link format (doc/.vitepress/theme/preview-link.js) and
 * its other writers: the skill's lcards-preview-link.mjs (Node zlib) and the Python
 * one-liner in SKILL.md. Every writer's link reads back to the same YAML; viewsOf()
 * finds the views in a card, a list of cards, a view and a dashboard; the page's
 * example is a clean config.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { encodePreview, decodePreview, viewsOf, PREVIEW_SAMPLE } from '../../doc/.vitepress/theme/preview-link.js';
import { createChecker } from '../../doc/.vitepress/theme/config-checker-core.js';
import { getSchemaEntries } from '../../scripts/lib/card-schemas.js';
import { buildRegistries } from '../../scripts/lib/registries.js';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const dir = mkdtempSync(join(tmpdir(), 'lcards-preview-'));
// Non-ASCII on purpose (UTF-8 round trip), and a gallery dashboard for size.
const YAML = `${PREVIEW_SAMPLE}# Überprüfung · 温度\n`;
const file = join(dir, 'view.yaml');
writeFileSync(file, YAML);

test('a link reads back to the same YAML; no hash or another hash reads as none', async () => {
    const hash = await encodePreview(YAML);
    assert.match(hash, /^yaml=[A-Za-z0-9_-]+$/);
    assert.equal(await decodePreview(`#${hash}`), YAML);
    assert.equal(await decodePreview(hash), YAML);
    assert.equal(await decodePreview(''), null);
    assert.equal(await decodePreview('#outline'), null);
    await assert.rejects(decodePreview(`#${hash.slice(0, 40)}`), 'a cut-off link throws');
});

test("the skill's Node script makes a link the page reads", async () => {
    const r = spawnSync(process.execPath, [join(ROOT, 'skills/lcards/scripts/lcards-preview-link.mjs'), file], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    const url = r.stdout.trim();
    assert.match(url, /^__PREVIEW_URL__#yaml=/, 'the build fills in the channel URL');
    assert.equal(await decodePreview(url.slice(url.indexOf('#'))), YAML);
});

test("SKILL.md's Python one-liner makes a link the page reads", async (t) => {
    if (spawnSync('python3', ['--version']).status !== 0) return t.skip('no python3');
    const md = readFileSync(join(ROOT, 'skills/lcards/SKILL.md'), 'utf8');
    const code = /python3 -c "([^"]+)"/.exec(md)?.[1];
    assert.ok(code, 'SKILL.md has the Python one-liner');
    const r = spawnSync('python3', ['-c', code, file], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    const url = r.stdout.trim();
    assert.match(url, /^__PREVIEW_URL__#yaml=/);
    assert.equal(await decodePreview(url.slice(url.indexOf('#'))), YAML);
});

test('a gallery dashboard fits in a link under the size the page warns about', async () => {
    const yaml = readFileSync(join(ROOT, 'doc/gallery/dashboards/picard-console.yaml'), 'utf8');
    const hash = await encodePreview(yaml);
    assert.ok(hash.length < 60000, `${hash.length} characters`);
});

test('viewsOf finds the views in a card, a list of cards, a view and a dashboard', () => {
    const button = { type: 'custom:lcards-button', entity: 'light.a' };
    assert.deepEqual(viewsOf(button).views.map(v => v.config.sections[0].cards), [[button]]);
    // a layout card has cards: too, and is still one card
    const layoutCard = { type: 'custom:lcards-layout-card', cards: [button] };
    assert.equal(viewsOf(layoutCard).views[0].config.sections[0].cards[0], layoutCard);
    assert.equal(viewsOf([button, 'x', button]).views[0].config.sections[0].cards.length, 2);
    const layoutView = { type: 'custom:lcards-layout-view', cards: [button] };
    assert.equal(viewsOf(layoutView).views[0].config, layoutView);
    assert.equal(viewsOf({ cards: [button] }).views.length, 1, 'a masonry view without a type');
    const dash = { views: [{ title: 'Bridge', sections: [] }, { path: 'eng', cards: [] }, { strategy: { type: 'x' } }] };
    const found = viewsOf(dash);
    assert.deepEqual(found.views.map(v => v.title), ['Bridge', 'eng']);
    assert.match(found.note, /1 view uses a strategy/);
    assert.match(viewsOf({ strategy: { type: 'custom:lcars-shell' } }).note, /strategy/);
    assert.deepEqual(viewsOf({ foo: 1 }).views, []);
    assert.deepEqual(viewsOf(null).views, []);
});

test("the page's example is a clean config", async () => {
    const checker = createChecker({ entries: getSchemaEntries(), registries: await buildRegistries() });
    const r = checker.check(PREVIEW_SAMPLE);
    assert.equal(r.parseError, null);
    assert.equal(r.cards.length, 7, "the layout view and its six cards");
    assert.deepEqual(r.cards.flatMap(c => c.issues), []);
});
