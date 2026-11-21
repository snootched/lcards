/**
 * Third-party libraries (scripts/data/third-party.json, scripts/lib/third-party.js):
 * the About page table (<LibraryTable />, doc/credits.md) and THIRD_PARTY_NOTICES.txt
 * stay in step with what src/ imports, package.json and the built bundle.
 * The built-bundle checks skip when no build exists; tests/browser/bundle.spec.js runs
 * them as hard checks after the CI build.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
    ROOT, LICENSE_ALLOWLIST, loadMetadata, loadPackageJson, packageInfo, libraryRows,
    rowPackages, srcBareImports, bundledPackagesFromMaps, sourcemapFiles, packageFromPath,
    packageRoot, handNotices, noticesText,
} from '../../scripts/lib/third-party.js';

const pkg = loadPackageJson();
const meta = loadMetadata();
const deps = Object.keys(pkg.dependencies ?? {});
const devDeps = Object.keys(pkg.devDependencies ?? {});
const imports = srcBareImports(join(ROOT, 'src'));
const BUILD = join(ROOT, 'custom_components/lcards');

test('every bare import in src/ is a dependency (not dev) with an About row', () => {
    const direct = new Set(meta.runtime.flatMap(r => r.packages ?? []));
    for (const [name, files] of imports) {
        assert.ok(deps.includes(name), `${name} (imported by ${files[0]}) is not in package.json dependencies`);
        assert.ok(direct.has(name), `${name} (imported by ${files[0]}) has no row in scripts/data/third-party.json`);
    }
});

test('every dependency is imported by src/, and every row package is a dependency', () => {
    for (const name of deps) assert.ok(imports.has(name), `${name} is in dependencies but nothing in src/ imports it`);
    for (const row of meta.runtime) {
        for (const name of row.packages ?? []) assert.ok(deps.includes(name), `row ${row.id}: ${name} is not a dependency`);
    }
});

test('docs-site rows are devDependencies (never shipped in the integration)', () => {
    for (const row of meta.docs ?? []) {
        for (const name of row.packages ?? []) {
            assert.ok(devDeps.includes(name), `docs row ${row.id}: ${name} is not a devDependency`);
            assert.ok(!imports.has(name), `docs row ${row.id}: ${name} is imported by src/`);
        }
    }
});

test('rows are complete: name, url, purpose, load, unique ids, no package in two rows', () => {
    const seen = new Map();
    for (const [set, rows] of Object.entries({ runtime: meta.runtime, docs: meta.docs ?? [] })) {
        for (const row of rows) {
            assert.ok(row.id && row.name && row.purpose && row.url, `${set} row ${row.id}: id, name, url and purpose are required`);
            if (set === 'runtime') assert.ok(['main', 'lazy'].includes(row.load), `row ${row.id}: load is main or lazy`);
            assert.ok((row.packages ?? []).length > 0, `row ${row.id}: no packages`);
            for (const name of [...row.packages, ...(row.family ?? [])]) {
                assert.ok(!seen.has(name), `${name} is in rows ${seen.get(name)} and ${row.id}`);
                seen.set(name, row.id);
                assert.ok(existsSync(join(ROOT, 'node_modules', name, 'package.json')), `${name} is not installed`);
            }
            if (row.license) assert.ok(row.license.name && row.licenseNote, `row ${row.id}: a license override needs a name and a licenseNote`);
            assert.ok(!/\u2014/.test(JSON.stringify(row)), `row ${row.id}: no em dashes in user-facing text`);
            assert.ok(!/\bHA\b/.test(`${row.purpose} ${row.licenseNote ?? ''}`), `row ${row.id}: write "Home Assistant" in full`);
        }
    }
});

test('a licence outside the allowlist needs the row\'s license override and note', () => {
    for (const set of ['runtime', 'docs']) {
        for (const row of meta[set] ?? []) {
            for (const name of [...row.packages, ...(row.family ?? [])]) {
                const { license } = packageInfo(name);
                if (LICENSE_ALLOWLIST.includes(license)) continue;
                assert.ok(row.license && row.licenseNote,
                    `${name} is licensed "${license}" (not ${LICENSE_ALLOWLIST.join('/')}): row ${row.id} needs a license override and licenseNote`);
            }
        }
    }
});

test('ApexCharts shows its Community License, never MIT', () => {
    const apex = libraryRows('runtime').find(r => r.packages.includes('apexcharts'));
    assert.ok(apex, 'an ApexCharts row');
    assert.equal(apex.license.name, 'ApexCharts Community License');
    assert.equal(apex.license.url, 'https://apexcharts.com/license/community/');
    assert.ok(apex.licenseNote);
});

test('versions and licences come from node_modules', () => {
    for (const row of libraryRows('runtime')) {
        const first = packageInfo(row.packages[0]);
        assert.ok(row.version.includes(first.version) || row.version.includes(' to '), `row ${row.id}: version ${row.version} vs ${first.version}`);
        assert.ok(row.licenses.includes(first.license));
    }
    const d3 = libraryRows('runtime').find(r => r.id === 'd3');
    assert.deepEqual(d3?.licenses, ['ISC', 'BSD-3-Clause'], 'd3-ease is BSD-3-Clause, the rest ISC');
});

test('doc/credits.md uses <LibraryTable /> and has no hand-written library table', () => {
    const page = readFileSync(join(ROOT, 'doc/credits.md'), 'utf8');
    assert.match(page, /<LibraryTable\b/);
    assert.match(page, /^# About LCARdS$/m);
    assert.ok(!/^\|\s*Library\s*\|/m.test(page), 'a hand-written "| Library |" table is back');
    const section = page.split(/^## Bundled Libraries$/m)[1]?.split(/^## /m)[0] ?? '';
    assert.ok(!/^\|/m.test(section), 'no markdown table under Bundled Libraries');
});

test('helpers: package names from paths and specifiers', () => {
    assert.equal(packageFromPath('../../node_modules/lit-html/lit-html.js'), 'lit-html');
    assert.equal(packageFromPath('../../node_modules/@codemirror/view/dist/index.js'), '@codemirror/view');
    assert.equal(packageFromPath('/x/node_modules/a/node_modules/@lezer/lr/dist/index.js'), '@lezer/lr');
    assert.equal(packageFromPath('../../src/lcards.js'), null);
    assert.equal(packageRoot('lit/directives/ref.js'), 'lit');
    assert.equal(packageRoot('@codemirror/view'), '@codemirror/view');
    assert.equal(packageRoot('./x.js'), null);
    assert.equal(packageRoot('node:fs'), null);
});

test('the hand notices keep ha-lcars, lcars and engage, and drop three.js (generated)', () => {
    const subjects = handNotices(['three']).map(s => s.match(/'([^']+)'/)?.[1]);
    assert.deepEqual(subjects, ['ha-lcars', 'lcars', 'warp-drive-engineering/engage']);
});

const maps = sourcemapFiles(BUILD);

test('built bundle: every bundled package belongs to a row (packages or family)', (t) => {
    if (maps.length === 0) return t.skip('no build in custom_components/lcards (run npm run build)');
    const owned = rowPackages('runtime');
    const bundled = bundledPackagesFromMaps(BUILD);
    for (const [name, chunks] of bundled) {
        assert.ok(owned.has(name), `${name} is in the bundle (${[...chunks][0]}) but no row of scripts/data/third-party.json lists it in packages or family`);
    }
});

test('built bundle: each row\'s load matches where its packages land', (t) => {
    if (maps.length === 0) return t.skip('no build in custom_components/lcards (run npm run build)');
    const bundled = bundledPackagesFromMaps(BUILD);
    for (const row of meta.runtime) {
        const chunks = [...row.packages, ...(row.family ?? [])].flatMap(p => [...(bundled.get(p) ?? [])]);
        assert.ok(chunks.length > 0, `row ${row.id}: none of its packages is in the bundle`);
        const inMain = chunks.some(c => /^chunks\/lcards-main-/.test(c) || c === 'lcards.js');
        assert.equal(inMain, row.load === 'main', `row ${row.id}: load is ${row.load} but its code is in ${[...new Set(chunks)].join(', ')}`);
    }
});

test('built bundle: the notices text names every bundled package', (t) => {
    if (maps.length === 0) return t.skip('no build in custom_components/lcards (run npm run build)');
    const bundled = [...bundledPackagesFromMaps(BUILD).keys()];
    const text = noticesText(bundled);
    for (const name of bundled) assert.match(text, new RegExp(`^${name.replace(/[/.]/g, '\\$&')} \\d`, 'm'), `${name} notice`);
    assert.match(text, /ApexCharts Community License/);
    assert.match(text, /'ha-lcars'/);
});
