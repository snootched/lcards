/**
 * Docs channels (versioned docs site): scripts/docs-deploy.mjs merges each channel's
 * build into the gh-pages tree without touching the others, keeps card assets as a
 * union, freezes and prunes archives; theme/docs-versions.js builds the switcher and
 * banner; scripts/check-docs-base.js catches links that escape a channel's base.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { deploy, archivedVersions, DEFAULT_KEEP } from '../../scripts/docs-deploy.mjs';
import { escapes } from '../../scripts/check-docs-base.js';
import { switcherEntries, pathInBase, bannerFor, channelBase } from '../../doc/.vitepress/theme/docs-versions.js';

const tmp = (name) => mkdtempSync(join(tmpdir(), `lcards-${name}-`));
const put = (root, rel, text = rel) => {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), text);
};
const read = (root, rel) => readFileSync(join(root, rel), 'utf8');

/** A fake docs build: index page, one page, bundle and some card assets. */
function build(tag, assets = ['msd/ship.svg']) {
    const dir = tmp(`build-${tag}`);
    put(dir, 'index.html', `home ${tag}`);
    put(dir, 'cards/button.html', `button ${tag}`);
    put(dir, 'lcards/lcards.js', `bundle ${tag}`);
    for (const a of assets) put(dir, `lcards/${a}`, `${a} from ${tag}`);
    return dir;
}

test('latest replaces the root and keeps dev/, v/ and versions.json', () => {
    const site = tmp('site');
    deploy({ site, build: build('stable1'), channel: 'latest', version: '2026.10.0' });
    deploy({ site, build: build('dev1'), channel: 'dev', version: '2026.11.0-dev.1' });
    deploy({ site, build: build('arch'), channel: 'archive', version: '2026.10.0' });
    put(site, 'stale.html', 'old root page');

    const { versions } = deploy({ site, build: build('stable2'), channel: 'latest', version: '2026.10.1' });
    assert.equal(read(site, 'index.html'), 'home stable2');
    assert.ok(!existsSync(join(site, 'stale.html')), 'old root files are removed');
    assert.equal(read(site, 'dev/index.html'), 'home dev1');
    assert.equal(read(site, 'v/2026.10.0/index.html'), 'home arch');
    assert.deepEqual(versions, { latest: '2026.10.1', dev: '2026.11.0-dev.1', versions: ['2026.10.0'] });
    assert.deepEqual(JSON.parse(read(site, 'versions.json')), versions);
});

test('dev replaces only dev/', () => {
    const site = tmp('site');
    deploy({ site, build: build('stable'), channel: 'latest', version: '2026.10.0' });
    deploy({ site, build: build('dev1'), channel: 'dev', version: '2026.11.0-dev.1' });
    put(site, 'dev/removed-page.html');
    deploy({ site, build: build('dev2'), channel: 'dev', version: '2026.11.0-dev.2' });
    assert.equal(read(site, 'dev/index.html'), 'home dev2');
    assert.ok(!existsSync(join(site, 'dev/removed-page.html')));
    assert.equal(read(site, 'index.html'), 'home stable');
    assert.equal(JSON.parse(read(site, 'versions.json')).dev, '2026.11.0-dev.2');
});

test('root lcards/ assets are the union of every channel and survive a root redeploy', () => {
    const site = tmp('site');
    deploy({ site, build: build('stable', ['msd/ship.svg']), channel: 'latest', version: '2026.10.0' });
    deploy({ site, build: build('dev', ['msd/ship.svg', 'msd/new-ship.svg', 'sounds/beep.mp3']), channel: 'dev', version: '2026.11.0-dev.1' });
    assert.equal(read(site, 'lcards/msd/new-ship.svg'), 'msd/new-ship.svg from dev', 'dev-only asset added to the root');
    assert.equal(read(site, 'lcards/msd/ship.svg'), 'msd/ship.svg from stable', 'existing root asset not overwritten by dev');

    deploy({ site, build: build('stable2', ['msd/ship.svg']), channel: 'latest', version: '2026.10.1' });
    assert.equal(read(site, 'lcards/msd/ship.svg'), 'msd/ship.svg from stable2', 'the root build wins for its own files');
    assert.ok(existsSync(join(site, 'lcards/msd/new-ship.svg')), 'dev-only asset kept after a root redeploy');
    assert.ok(existsSync(join(site, 'lcards/sounds/beep.mp3')));
    assert.equal(read(site, 'lcards/lcards.js'), 'bundle stable2', 'the root bundle itself is replaced, not merged');
});

test('archives are frozen, stable-only, and pruned to the newest versions', () => {
    const site = tmp('site');
    deploy({ site, build: build('root'), channel: 'latest', version: '2026.10.0' });
    assert.throws(() => deploy({ site, build: build('x'), channel: 'archive', version: '2026.11.0-dev.1' }), /Only stable/);
    deploy({ site, build: build('a'), channel: 'archive', version: '2026.10.0' });
    assert.throws(() => deploy({ site, build: build('b'), channel: 'archive', version: '2026.10.0' }), /frozen/);
    deploy({ site, build: build('b'), channel: 'archive', version: '2026.10.0', force: true });
    assert.equal(read(site, 'v/2026.10.0/index.html'), 'home b');

    const many = ['2026.10.1', '2026.11.0', '2026.11.1', '2026.12.0', '2027.01.0', '2027.01.1', '2027.02.0', '2027.03.0'];
    let last;
    for (const v of many) last = deploy({ site, build: build(v), channel: 'archive', version: v });
    assert.equal(archivedVersions(site).length, DEFAULT_KEEP);
    assert.deepEqual(last.pruned, ['2026.10.0']);
    assert.equal(archivedVersions(site)[0], '2027.03.0');
    assert.ok(!existsSync(join(site, 'v/2026.10.0')));
    assert.deepEqual(JSON.parse(read(site, 'versions.json')).versions, archivedVersions(site));
});

test('dev or archive cannot go out before the site has a root', () => {
    assert.throws(() => deploy({ site: tmp('site'), build: build('dev'), channel: 'dev', version: '2026.11.0-dev.1' }), /no root yet/);
});

test('a root build may not contain the reserved channel folders', () => {
    const b = build('bad');
    put(b, 'dev/index.html');
    assert.throws(() => deploy({ site: tmp('site'), build: b, channel: 'latest', version: '2026.10.0' }), /reserved path dev/);
});

test('switcher: Latest, Dev, then archives newest first; the current channel is marked', () => {
    const versions = { latest: '2026.10.1', dev: '2026.11.0-dev.1', versions: ['2026.10.1', '2026.10.0', '2026.09.0'] };
    const onDev = switcherEntries(versions, { channel: 'dev', version: '2026.11.0-dev.1', base: '/dev/' });
    assert.deepEqual(onDev.map(e => e.label), ['Latest (2026.10.1)', 'Dev (2026.11.0-dev.1)', '2026.10.0', '2026.09.0']);
    assert.deepEqual(onDev.filter(e => e.current).map(e => e.base), ['/dev/']);
    // No versions.json (local build): just this channel, so the switcher hides itself.
    assert.equal(switcherEntries(null, { channel: 'latest', version: '2026.10.1', base: '/' }).length, 1);
    // An archive older than the kept list still lists itself.
    const old = switcherEntries(versions, { channel: 'archive', version: '2026.08.0', base: '/v/2026.08.0/' });
    assert.ok(old.some(e => e.current && e.label === '2026.08.0'));
});

test('switching keeps the page path; channel bases', () => {
    assert.equal(pathInBase('/dev/cards/button/', '/dev/', '/'), '/cards/button/');
    assert.equal(pathInBase('/cards/button/', '/', '/v/2026.10.0/'), '/v/2026.10.0/cards/button/');
    assert.equal(pathInBase('/v/2026.10.0/', '/v/2026.10.0/', '/dev/'), '/dev/');
    assert.equal(channelBase('latest'), '/');
    assert.equal(channelBase('dev'), '/dev/');
    assert.equal(channelBase('archive', '2026.10.0'), '/v/2026.10.0/');
});

test('banner: none on the root; dev and archive say so and name the latest release', () => {
    assert.equal(bannerFor({ channel: 'latest', version: '2026.10.1', base: '/' }, null), null);
    assert.match(bannerFor({ channel: 'dev', version: '2026.11.0-dev.1', base: '/dev/' }, { latest: '2026.10.1' }).text, /development docs \(2026\.11\.0-dev\.1\).*latest stable release is 2026\.10\.1/);
    assert.match(bannerFor({ channel: 'archive', version: '2026.09.0', base: '/v/2026.09.0/' }, null).text, /LCARdS 2026\.09\.0, an earlier release/);
    assert.ok(!/—/.test(JSON.stringify(bannerFor({ channel: 'dev', version: 'x', base: '/dev/' }, { latest: 'y' }))));
});

test('base check: root-absolute links outside the base are reported (protocol-relative and absolute URLs are not)', () => {
    const html = '<a href="/dev/cards/">ok</a><img src="/lcards/x.svg"><a href="/credits">bad</a><a href="/">root</a><a href="//cdn.example/x">cdn</a><link href="https://x/y">';
    assert.deepEqual(escapes(html, '/dev/'), ['/lcards/x.svg', '/credits', '/']);
    assert.deepEqual(escapes(html, '/'), []);
});

test('docs.yml and config agree on the channel bases', () => {
    const config = readFileSync(new URL('../../doc/.vitepress/config.mts', import.meta.url), 'utf8');
    assert.match(config, /DOCS_BASE/);
    const workflow = readFileSync(new URL('../../.github/workflows/docs.yml', import.meta.url), 'utf8');
    for (const needle of ['DOCS_BASE', 'scripts/docs-deploy.mjs', 'gh-pages']) assert.ok(workflow.includes(needle), `docs.yml is missing ${needle}`);
    assert.ok(readdirSync(new URL('../../doc/.vitepress/theme/', import.meta.url)).includes('VersionSwitcher.vue'));
    const theme = readFileSync(new URL('../../doc/.vitepress/theme/index.ts', import.meta.url), 'utf8');
    assert.match(theme, /'layout-top': \(\) => h\(VersionBanner\)/);
    assert.match(theme, /'nav-bar-title-after': \(\) => h\(VersionSwitcher\)/);
});
