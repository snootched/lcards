/**
 * Docs Releases section (doc/releases/, scripts/release-lib.mjs, scripts/release-notes.mjs):
 * the real pages pass the checks, the GitHub export and the backfill import transform
 * markdown as documented, and the built index lists every release.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
    checkReleases, listReleases, toGithubMarkdown, importGithubBody, compareVersions, sortReleases,
    absoluteSiteUrl, hardBreaks, RELEASES_DIR,
} from '../../scripts/release-lib.mjs';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

function page({ version = '2026.11.0', status = 'released', date = '2026-11-02', summary = 'Things.', breaking = false, body = '' } = {}) {
    return ['---', `version: "${version}"`, ...(date ? [`date: ${date}`] : []), `status: ${status}`,
        `summary: "${summary}"`, `breaking: ${breaking}`, '---', '', `# LCARdS ${version}`, '', body, ''].join('\n');
}

/** A temp doc/ tree with the given release pages and public files. */
function fixture(pages, files = []) {
    const dir = mkdtempSync(join(tmpdir(), 'lcards-releases-'));
    const rel = join(dir, 'releases');
    const pub = join(dir, 'public', 'releases');
    mkdirSync(rel, { recursive: true });
    mkdirSync(pub, { recursive: true });
    for (const [tag, text] of Object.entries(pages)) writeFileSync(join(rel, `${tag}.md`), text);
    for (const f of files) {
        mkdirSync(join(dir, 'public', f, '..'), { recursive: true });
        writeFileSync(join(dir, 'public', f), '');
    }
    return { dir, rel, pub };
}

test('the real release pages pass every check', () => {
    assert.deepEqual(checkReleases({ pkgVersion: pkg.version }), []);
});

test('every page is listed, in testing first then newest first', () => {
    const files = readdirSync(RELEASES_DIR).filter(f => f.endsWith('.md') && f !== 'index.md');
    const list = listReleases();
    assert.equal(list.length, files.length);
    const released = list.filter(r => r.status === 'released');
    for (let i = 1; i < released.length; i++) assert.ok(compareVersions(released[i - 1].version, released[i].version) > 0);
    const firstReleased = list.findIndex(r => r.status === 'released');
    assert.ok(list.slice(firstReleased).every(r => r.status === 'released'), 'testing pages come first');
});

test('versions of mixed tag shapes sort numerically', () => {
    const tags = ['2026.04.6.1', '2026.10.0', '2026.04.11.2', '2026.03.27', '2026.03.27.1', '2026.09.0'];
    assert.deepEqual([...tags].sort(compareVersions),
        ['2026.03.27', '2026.03.27.1', '2026.04.6.1', '2026.04.11.2', '2026.09.0', '2026.10.0']);
    assert.deepEqual(sortReleases([{ version: '2026.09.0' }, { version: '2026.10.0', status: 'testing' }, { version: '2026.10.1' }])
        .map(r => r.version), ['2026.10.0', '2026.10.1', '2026.09.0']);
});

test('checks catch bad frontmatter, missing or unused images and demo components', () => {
    const { rel, pub } = fixture({
        '2026.11.0': page({ summary: 'TODO', body: '<img src="/releases/2026.11.0/missing.webp" />\n\n<CardDemo />\n\n```yaml live\ntype: x\n```' }),
        '2026.11.1': page({ version: '2026.11.9' }),
        '2026.12.0': page({ status: 'testing', date: null }),
        '2027.01.0': page({ status: 'testing', date: null }),
    }, ['releases/2026.11.0/stray.webp', 'releases/2026.11.0/clip.gif']);
    const errors = checkReleases({ dir: rel, publicDir: pub, pkgVersion: '2026.12.0-dev.1' }).join('\n');
    assert.match(errors, /2026\.11\.0\.md: summary is missing/);
    assert.match(errors, /2026\.11\.1\.md: version "2026\.11\.9" must equal the file name/);
    assert.match(errors, /missing image \/releases\/2026\.11\.0\/missing\.webp/);
    assert.match(errors, /unused file doc\/public\/releases\/2026\.11\.0\/stray\.webp/);
    assert.match(errors, /unused file doc\/public\/releases\/2026\.11\.0\/clip\.gif/);
    assert.match(errors, /<CardDemo> components don't export/);
    assert.match(errors, /`yaml live` blocks don't export/);
    assert.match(errors, /only one page may be status: testing/);
});

test('a GIF twin of a referenced clip counts as used', () => {
    const { rel, pub } = fixture({
        '2026.11.0': page({ body: '<video class="release-shot" src="/releases/2026.11.0/clip.webm" autoplay loop muted playsinline></video>' }),
    }, ['releases/2026.11.0/clip.webm', 'releases/2026.11.0/clip.gif']);
    assert.deepEqual(checkReleases({ dir: rel, publicDir: pub }), []);
});

test('GitHub export: no frontmatter or title, absolute links, alerts, short refs, plain fences', () => {
    const body = [
        'Intro with a [docs link](/core/actions#tap) and [a card](/cards/chart/).',
        '',
        '<img class="release-shot" alt="Shot" src="/releases/2026.11.0/shot.webp" />',
        '',
        '::: warning Check your charts',
        'Charts moved to `sources:`.',
        ':::',
        '',
        '::: details Smaller fixes',
        '- Fixed a thing ([#123](https://github.com/snootched/lcards/issues/123)), thanks [@someone](https://github.com/someone)',
        ':::',
        '',
        '```yaml no-validate',
        'type: custom:lcards-chart',
        '```',
        '',
        '<video class="release-shot" src="/releases/2026.11.0/anim.webm" autoplay loop muted playsinline></video>',
        '<video class="release-shot" src="/releases/2026.11.0/nogif.webm" autoplay loop muted playsinline></video>',
    ].join('\n');
    const md = toGithubMarkdown(page({ body }), { fileExists: p => p === '/releases/2026.11.0/anim.gif' });
    assert.doesNotMatch(md, /^---\nversion/);
    assert.doesNotMatch(md, /# LCARdS 2026\.11\.0/);
    assert.match(md, /\(https:\/\/lcards\.unimatrix01\.ca\/core\/actions\.html#tap\)/);
    assert.match(md, /\(https:\/\/lcards\.unimatrix01\.ca\/cards\/chart\/\)/);
    assert.match(md, /src="https:\/\/lcards\.unimatrix01\.ca\/releases\/2026\.11\.0\/shot\.webp"/);
    assert.match(md, /> \[!WARNING\]\n> \*\*Check your charts\*\*\n>\n> Charts moved to `sources:`\./);
    assert.match(md, /<details>\n<summary>Smaller fixes<\/summary>/);
    assert.match(md, /\(#123\), thanks @someone/);
    assert.match(md, /```yaml\ntype: custom:lcards-chart/);
    assert.match(md, /<img src="https:\/\/lcards\.unimatrix01\.ca\/releases\/2026\.11\.0\/anim\.gif"/);
    assert.match(md, /\[Watch the clip\]\(https:\/\/lcards\.unimatrix01\.ca\/releases\/2026\.11\.0\/nogif\.webm\)/);
    assert.match(md, /Read these notes on the docs site: https:\/\/lcards\.unimatrix01\.ca\/releases\/2026\.11\.0\.html\n$/);
    assert.doesNotMatch(md.replace(/```[\s\S]*?```/g, ''), /\]\(\/|="\/(?!\/)|^:::/m, 'no site-relative links or containers left');
});

test('GitHub export of an in-testing page leads with the dev build note', () => {
    const md = toGithubMarkdown(page({ status: 'testing', date: null, body: 'Hello.' }));
    assert.match(md, /^> \[!NOTE\]\n> Dev build of the upcoming LCARdS 2026\.11\.0\./);
});

test('absoluteSiteUrl keeps assets and treats version-like page names as pages', () => {
    assert.equal(absoluteSiteUrl('/releases/2026.09.0'), 'https://lcards.unimatrix01.ca/releases/2026.09.0.html');
    assert.equal(absoluteSiteUrl('/releases/2026.09.0/a.webp'), 'https://lcards.unimatrix01.ca/releases/2026.09.0/a.webp');
    assert.equal(absoluteSiteUrl('/core/colours.md#x'), 'https://lcards.unimatrix01.ca/core/colours.html#x');
});

test('export CLI: exit 2 without a page, 3 for a stable version still in testing, body otherwise', () => {
    const { dir, rel } = fixture({ '2026.11.0': page({ status: 'testing', date: null, body: 'Draft.' }) });
    const run = v => spawnSync(process.execPath, [join(ROOT, 'scripts/release-notes.mjs'), 'export', v], {
        encoding: 'utf8', env: { ...process.env, LCARDS_RELEASES_DIR: rel, LCARDS_PUBLIC_DIR: join(dir, 'public') },
    });
    assert.equal(run('2026.12.0').status, 2);
    assert.equal(run('2026.11.0').status, 3);
    const dev = run('2026.11.0-dev.2');
    assert.equal(dev.status, 0);
    assert.match(dev.stdout, /Dev build of the upcoming LCARdS 2026\.11\.0/);
});

test('backfill import: images re-hosted, refs linked, em dashes and stray tags gone', () => {
    const body = [
        '## LCARdS 2026.05.01.1',
        '',
        '# New Features',
        '',
        '### Thing (#394)',
        'Line one \u2014 with a dash \u2014 and more',
        'Line two uses <ha-button> in prose',
        '',
        '<img width="80%" height="80%" alt="Theme Lab" src="https://github.com/user-attachments/assets/aaa-111" />',
        '![](https://github.com/user-attachments/assets/bbb-222)',
        '',
        'Thanks @tswonke! (https://github.com/snootched/lcards/issues/344)',
        '',
        '```yaml',
        'type: custom:lcards-button',
        '```',
        '',
        '---',
        '',
        '**Full Changelog**: https://github.com/snootched/lcards/compare/a...b',
    ].join('\r\n');
    const { markdown, images } = importGithubBody(body, { tag: '2026.05.01.1' });
    assert.doesNotMatch(markdown, /LCARdS 2026\.05\.01\.1|Full Changelog|\u2014|\r/);
    assert.match(markdown, /^## New Features/m);
    assert.match(markdown, /### Thing \(\[#394\]\(https:\/\/github\.com\/snootched\/lcards\/issues\/394\)\)/);
    assert.match(markdown, /Line one: with a dash, and more\\\nLine two uses &lt;ha-button> in prose/);
    assert.deepEqual(images.map(i => i.path), ['/releases/2026.05.01.1/theme-lab.webp', '/releases/2026.05.01.1/image-2.webp']);
    assert.match(markdown, /<img class="release-shot" alt="Theme Lab" src="\/releases\/2026\.05\.01\.1\/theme-lab\.webp" \/>/);
    assert.match(markdown, /\[@tswonke\]\(https:\/\/github\.com\/tswonke\)! \(\[#344\]\(https:\/\/github\.com\/snootched\/lcards\/issues\/344\)\)/);
    assert.match(markdown, /```yaml no-validate\n/);
});

test('hard breaks only join plain prose lines', () => {
    assert.equal(hardBreaks('a\nb\n\n- x\n- y\n\n```\nc\nd\n```'), 'a\\\nb\n\n- x\n- y\n\n```\nc\nd\n```');
});

const DIST = join(ROOT, 'doc/.vitepress/dist');
test('the built releases index lists every release', { skip: !existsSync(join(DIST, 'releases/index.html')) && 'docs site not built' }, () => {
    const html = readFileSync(join(DIST, 'releases/index.html'), 'utf8');
    for (const r of listReleases()) {
        assert.ok(html.includes(`${r.link}.html`), `${r.version} missing from /releases/`);
        assert.ok(existsSync(join(DIST, `releases/${r.tag}.html`)), `${r.tag}.html not built`);
    }
});

test('release pages and pictures are not gitignored (a stray Releases/ rule once hid them)', () => {
    const paths = [
        ...listReleases().map(r => `doc/releases/${r.file}`),
        'doc/releases/index.md',
        ...readdirSync(join(ROOT, 'doc/public/releases'), { recursive: true }).map(f => `doc/public/releases/${f}`),
    ];
    const ignored = spawnSync('git', ['check-ignore', '--stdin'], { cwd: ROOT, input: paths.join('\n'), encoding: 'utf8' });
    if (ignored.error) return; // no git (e.g. a source tarball)
    assert.equal(ignored.stdout.trim(), '');
});

test('commits CLI lists what the notes do not cover yet, from notes_through to HEAD', () => {
    const base = spawnSync('git', ['rev-parse', 'HEAD~3'], { cwd: ROOT, encoding: 'utf8' }).stdout.trim();
    if (!base) return; // shallow clone
    const { dir, rel } = fixture({
        '2026.09.0': page({ version: '2026.09.0' }),
        '2026.11.0': page({ status: 'testing', date: null }).replace('breaking: false', `breaking: false\nnotes_through: "${base.slice(0, 12)}"`),
    });
    const run = spawnSync(process.execPath, [join(ROOT, 'scripts/release-notes.mjs'), 'commits', '--brief'], {
        encoding: 'utf8', env: { ...process.env, LCARDS_RELEASES_DIR: rel, LCARDS_PUBLIC_DIR: join(dir, 'public') },
    });
    assert.equal(run.status, 0, run.stderr);
    assert.match(run.stdout, /^# Commits since notes_through of doc\/releases\/2026\.11\.0\.md: \w+\.\.\w+ \(\d+\)/);
    const listed = run.stdout.match(/^## [0-9a-f]{12} /gm) ?? [];
    const expected = spawnSync('git', ['rev-list', '--count', '--no-merges', `${base}..HEAD`], { cwd: ROOT, encoding: 'utf8' }).stdout.trim();
    assert.equal(listed.length, Number(expected));
    assert.match(run.stdout, /set {2}notes_through: "[0-9a-f]{12}"/);
});
