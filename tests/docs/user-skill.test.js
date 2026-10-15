/**
 * The user-facing skill (skills/lcards/SKILL.md, scripts/build-user-skill.js): the zip
 * has valid skill frontmatter, every path SKILL.md points at exists in the package, the
 * schemas cover every card, and the bundled checker runs.
 */
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getSchemaEntries } from '../../scripts/lib/card-schemas.js';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
let dir;
let skill;

before(() => {
    dir = mkdtempSync(join(tmpdir(), 'lcards-skill-test-'));
    const r = spawnSync(process.execPath, [join(ROOT, 'scripts/build-user-skill.js'), `--out=${join(dir, 'lcards-skill.zip')}`], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    execFileSync('python3', ['-m', 'zipfile', '-e', join(dir, 'lcards-skill.zip'), dir]);
    skill = join(dir, 'lcards');
});

test('SKILL.md has the frontmatter a skill needs and names the version it was built for', () => {
    const md = readFileSync(join(skill, 'SKILL.md'), 'utf8');
    const fm = /^---\n([\s\S]*?)\n---/.exec(md)?.[1] ?? '';
    assert.match(fm, /^name: lcards$/m);
    const description = /^description: (.+)$/m.exec(fm)?.[1] ?? '';
    assert.ok(description.length > 100 && description.length < 1024, 'description sized for triggering');
    const { version } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
    assert.ok(md.includes(`Built for LCARdS ${version}`));
    assert.ok(!/—/.test(md));
});

test('every path SKILL.md mentions exists in the package', () => {
    const md = readFileSync(join(skill, 'SKILL.md'), 'utf8');
    const paths = [...md.matchAll(/`((?:references|scripts)\/[^`<>*\s]+)`/g)].map(m => m[1].replace(/\/$/, ''));
    assert.ok(paths.length >= 6);
    for (const p of paths) assert.ok(existsSync(join(skill, p)), `${p} missing from the package`);
});

test('schemas for every card, view and strategy; docs for every card', () => {
    const index = JSON.parse(readFileSync(join(skill, 'references/schema/index.json'), 'utf8'));
    for (const { tag } of getSchemaEntries()) {
        const entry = index.cards[tag] ?? index.views[tag] ?? index.strategies[tag];
        assert.ok(entry && existsSync(join(skill, 'references/schema', entry.file)), tag);
    }
    const cards = readdirSync(join(skill, 'references/docs/cards'));
    for (const card of ['button', 'elbow', 'slider-card', 'chart', 'data-grid', 'select-menu', 'msd', 'layout-view']) assert.ok(cards.includes(card), card);
});

test('the bundled checker runs on the bundled gallery', () => {
    const gallery = readdirSync(join(skill, 'references/gallery')).map(f => join(skill, 'references/gallery', f));
    const r = spawnSync(process.execPath, [join(skill, 'scripts/lcards-validate.mjs'), '--strict', ...gallery], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout + r.stderr);
});
