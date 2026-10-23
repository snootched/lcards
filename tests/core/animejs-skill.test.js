/**
 * The vendored anime.js project skill (.claude/skills/animejs/) only teaches API names the
 * installed animejs actually exports, and never the parametric string eases that 4.3 removed
 * ('steps(5)', 'cubicBezier(..)': they warn and fall back to no easing). Fails after an animejs
 * bump that drops something the skill still shows, or once SKILL.md names a different version than
 * the one installed; see references/UPSTREAM.md to re-vendor.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const SKILL = join(ROOT, '.claude', 'skills', 'animejs');
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith('.md') ? [join(dir, e.name)] : []);
// The frontmatter description and the "v3 to v4" bullet name v3 APIs on purpose; skip them.
const files = walk(SKILL).map(file => ({
    file: relative(ROOT, file),
    text: readFileSync(file, 'utf8').replace(/^---\n[\s\S]*?\n---\n/, '')
        .split('\n').filter(l => !l.includes('**v3 to v4**')).join('\n'),
}));

// The test preloads shim `window` without `document`, which animejs's module init trips on,
// so read the export surface from a clean child process.
const probe = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import * as a from 'animejs';
    const keys = (o) => Object.keys(o ?? {});
    console.log(JSON.stringify({ top: keys(a), eases: keys(a.eases), utils: keys(a.utils), svg: keys(a.svg) }));
`], { cwd: ROOT, encoding: 'utf8' });
const api = JSON.parse(probe.stdout);

/** Every `regex` capture-1 hit across the skill whose name is not in `known`, as file:name. */
function unknown(regex, known) {
    const misses = [];
    for (const { file, text } of files) {
        for (const m of text.matchAll(regex)) {
            const names = m[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0]).filter(Boolean);
            for (const name of names) if (!known.includes(name)) misses.push(`${file}: ${name}`);
        }
    }
    return misses;
}

test('the skill names the installed animejs version', () => {
    const installed = JSON.parse(readFileSync(join(ROOT, 'node_modules', 'animejs', 'package.json'), 'utf8')).version;
    const skill = readFileSync(join(SKILL, 'SKILL.md'), 'utf8');
    const named = skill.match(/\*\*Exact version is ([\d.]+)\.\*\*/)?.[1];
    assert.equal(named, installed, 'update SKILL.md (and references/changes-*.md) for the new animejs');
});

test('animejs export probe ran', () => {
    assert.equal(probe.status, 0, probe.stderr);
    assert.ok(api.top.includes('animate'));
});

test('named imports from animejs exist', () => {
    assert.deepEqual(unknown(/import\s*\{([^}]+)\}\s*from\s*['"]animejs['"]/g, api.top), []);
});

test('anime.* / eases.* / utils.* / svg.* members exist', () => {
    assert.deepEqual([
        ...unknown(/\banime\.([A-Za-z$]\w*)/g, [...api.top, 'js', 'com']),  // "anime.js", "animejs.com" prose
        ...unknown(/\beases\.([A-Za-z]\w*)\(/g, api.eases),
        ...unknown(/\butils\.([A-Za-z$]\w*)\(/g, api.utils),
        ...unknown(/\bsvg\.([A-Za-z]\w*)\(/g, api.svg),
    ], []);
});

test('no removed string-form parametric eases', () => {
    const hits = [];
    for (const { file, text } of files) {
        for (const m of text.matchAll(/ease:\s*['"](cubicBezier|steps|linear|irregular|spring)\(/g)) hits.push(`${file}: ${m[0]}`);
    }
    assert.deepEqual(hits, []);
});
