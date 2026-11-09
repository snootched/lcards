/**
 * third-party.js - the third-party libraries LCARdS ships, for the docs About page
 * (doc/.vitepress/theme/libraries.data.js), THIRD_PARTY_NOTICES.txt
 * (scripts/generate-third-party-notices.js) and their tests.
 *
 * Hand metadata (names, purposes, families) is scripts/data/third-party.json.
 * Versions, licenses and license texts always come from node_modules/<pkg>/, never
 * typed by hand. Pure node, no build needed (bundledPackagesFromMaps reads a build's
 * sourcemaps when one exists).
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/** Licenses that need no note on the About page. */
export const LICENSE_ALLOWLIST = ['MIT', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0', '0BSD'];

/** The standard MIT permission notice, for a package that declares MIT but ships no LICENSE file. */
const MIT_TEXT = `Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));

/** scripts/data/third-party.json: { runtime: Row[], docs: Row[] }. */
export function loadMetadata({ root = ROOT } = {}) {
  return readJson(join(root, 'scripts/data/third-party.json'));
}

/** The repo's package.json. */
export function loadPackageJson({ root = ROOT } = {}) {
  return readJson(join(root, 'package.json'));
}

/**
 * One installed package: name, version, license, homepage, author.
 * @param {string} name
 * @returns {{ name: string, version: string, license: string, homepage: string, author: string, dir: string }}
 */
export function packageInfo(name, { root = ROOT } = {}) {
  const dir = join(root, 'node_modules', name);
  const pkg = readJson(join(dir, 'package.json'));
  const license = typeof pkg.license === 'string' ? pkg.license
    : pkg.license?.type ?? (Array.isArray(pkg.licenses) ? pkg.licenses.map(l => l.type ?? l).join(' OR ') : 'UNKNOWN');
  const repo = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url;
  const author = typeof pkg.author === 'string' ? pkg.author : pkg.author?.name ?? '';
  return { name, version: pkg.version, license, homepage: pkg.homepage || repoUrl(repo) || '', author, dir };
}

/** A package.json `repository` value as a browsable URL ("nodeca/js-yaml", "git+https://...git"). */
function repoUrl(repo) {
  if (!repo) return '';
  if (/^[\w.-]+\/[\w.-]+$/.test(repo)) return `https://github.com/${repo}`;
  if (repo.startsWith('github:')) return `https://github.com/${repo.slice(7)}`;
  return repo.replace(/^git\+/, '').replace(/\.git$/, '').replace(/^git:\/\//, 'https://');
}

/** Distinct values in first-seen order. */
const unique = (values) => [...new Set(values)];

/** Numeric semver compare (major.minor.patch, pre-release suffixes ignored). */
function compareVersions(a, b) {
  const pa = a.split(/[.-]/).map(Number), pb = b.split(/[.-]/).map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  return 0;
}

/**
 * The rows of one table, resolved against node_modules.
 * @param {'runtime'|'docs'} set
 * @returns {Array<{ id: string, name: string, url: string, purpose: string, load?: string,
 *   packages: string[], family: string[], version: string, licenses: string[],
 *   license: { name: string, url?: string }, licenseNote?: string, overridden: boolean }>}
 */
export function libraryRows(set = 'runtime', { root = ROOT } = {}) {
  const rows = loadMetadata({ root })[set] ?? [];
  return rows.map((row) => {
    const packages = row.packages ?? [];
    const family = row.family ?? [];
    const infos = packages.map(p => packageInfo(p, { root }));
    const versions = unique(infos.map(i => i.version)).sort(compareVersions);
    const version = versions.length > 1 ? `${versions[0]} to ${versions[versions.length - 1]}` : versions[0] ?? '';
    const licenses = unique([...infos, ...family.map(p => packageInfo(p, { root }))].map(i => i.license));
    return {
      id: row.id,
      name: row.name,
      url: row.url || infos[0]?.homepage || '',
      purpose: row.purpose,
      ...(row.load ? { load: row.load } : {}),
      packages,
      family,
      version,
      licenses,
      license: row.license ?? { name: licenses.join(', ') },
      ...(row.licenseNote ? { licenseNote: row.licenseNote } : {}),
      overridden: !!row.license,
    };
  });
}

/** The About page's runtime table (every library inside lcards.js and its chunks). */
export function runtimeLibraries({ root = ROOT } = {}) {
  return libraryRows('runtime', { root });
}

/** Every package a row of `set` stands for: its packages plus their family. */
export function rowPackages(set = 'runtime', { root = ROOT } = {}) {
  const out = new Map();
  for (const row of loadMetadata({ root })[set] ?? []) {
    for (const p of [...(row.packages ?? []), ...(row.family ?? [])]) out.set(p, row.id);
  }
  return out;
}

/** The package name in a path that contains node_modules/ (the last one; scoped names kept). */
export function packageFromPath(path) {
  const i = path.lastIndexOf('node_modules/');
  if (i < 0) return null;
  const parts = path.slice(i + 'node_modules/'.length).split('/');
  return parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
}

/** The sourcemaps of a build: lcards.js.map and chunks/*.js.map (absolute paths). */
export function sourcemapFiles(dir = join(ROOT, 'custom_components/lcards')) {
  const files = [];
  if (existsSync(join(dir, 'lcards.js.map'))) files.push(join(dir, 'lcards.js.map'));
  const chunks = join(dir, 'chunks');
  if (existsSync(chunks)) {
    for (const f of readdirSync(chunks)) if (f.endsWith('.js.map')) files.push(join(chunks, f));
  }
  return files;
}

/**
 * Packages in a build, from its sourcemaps' `sources`.
 * @param {string} dir - the build folder (custom_components/lcards)
 * @returns {Map<string, Set<string>>} package name to the chunk files (basename, no .map) it lands in
 */
export function bundledPackagesFromMaps(dir = join(ROOT, 'custom_components/lcards')) {
  const out = new Map();
  for (const file of sourcemapFiles(dir)) {
    const { sources = [] } = readJson(file);
    const chunk = file.slice(dir.length + 1).replace(/\.map$/, '');
    for (const source of sources) {
      const name = packageFromPath(source);
      if (!name) continue;
      if (!out.has(name)) out.set(name, new Set());
      out.get(name).add(chunk);
    }
  }
  return out;
}

/** A valid npm package root from a bare specifier ("lit/directives/x.js" to "lit"), else null. */
export function packageRoot(specifier) {
  if (/^(node:|virtual:|https?:|\/|\.)/.test(specifier)) return null;
  const parts = specifier.split('/');
  const name = specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
  return /^(@[a-z0-9][\w.-]*\/)?[a-z0-9][\w.-]*$/.test(name) ? name : null;
}

function jsFiles(dir, out = []) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) jsFiles(p, out);
    else if (/\.(m?js|ts)$/.test(ent.name) && !ent.name.endsWith('.d.ts')) out.push(p);
  }
  return out;
}

/**
 * Package roots of every static and dynamic bare import under srcDir (.js/.mjs/.ts,
 * type declarations left out: they are never bundled).
 * @returns {Map<string, string[]>} package root to the files (relative to srcDir's parent) that import it
 */
export function srcBareImports(srcDir = join(ROOT, 'src')) {
  const out = new Map();
  const patterns = [
    // import x from 'p'; import { a,\n b } from 'p'; export * from 'p'
    /^[ \t]*(?:import|export)\b[^;'"`]*?\bfrom\s*['"]([^'"\n]+)['"]/gm,
    // import 'p';
    /^[ \t]*import\s*['"]([^'"\n]+)['"]/gm,
    // import('p')
    /\bimport\(\s*['"]([^'"\n]+)['"]\s*\)/g,
  ];
  const base = dirname(srcDir);
  for (const file of jsFiles(srcDir)) {
    const text = readFileSync(file, 'utf8');
    for (const re of patterns) {
      for (const m of text.matchAll(re)) {
        const root = packageRoot(m[1]);
        if (!root) continue;
        if (!out.has(root)) out.set(root, []);
        const rel = file.slice(base.length + 1);
        if (!out.get(root).includes(rel)) out.get(root).push(rel);
      }
    }
  }
  return out;
}

/** The license file of an installed package (LICENSE, LICENSE.md, LICENCE, COPYING...), or null. */
export function licenseFile(name, { root = ROOT } = {}) {
  const dir = join(root, 'node_modules', name);
  const hit = readdirSync(dir).find(f => /^(licen[cs]e|copying)(\.(md|txt))?$/i.test(f) && statSync(join(dir, f)).isFile());
  return hit ? join(dir, hit) : null;
}

/**
 * One package's notice: a header line, its license text, and the row's license link
 * when the row overrides the license (ApexCharts). A package that ships no license
 * file but declares MIT gets the standard MIT text with its package.json author.
 */
export function packageNotice(name, { root = ROOT, rows = runtimeLibraries({ root }) } = {}) {
  const info = packageInfo(name, { root });
  const row = rows.find(r => r.packages.includes(name) || r.family.includes(name));
  const lines = [`${name} ${info.version}`, `License: ${row?.overridden ? row.license.name : info.license}`];
  if (row?.overridden && row.license.url) lines.push(`License terms: ${row.license.url}`);
  if (info.homepage) lines.push(`Home: ${info.homepage}`);
  const file = licenseFile(name, { root });
  let text;
  if (file) {
    text = readFileSync(file, 'utf8').trim();
  } else if (info.license === 'MIT') {
    text = `(The package ships no license file; its package.json declares MIT. The standard MIT text follows.)\n\nMIT License\n\nCopyright (c) ${info.author || `the ${name} authors`}\n\n${MIT_TEXT}`;
  } else {
    throw new Error(`${name}: no license file and license "${info.license}" has no standard text; add it by hand`);
  }
  return `${lines.join('\n')}\n\n${text}`;
}

/**
 * The hand-written entries of the repo's THIRD_PARTY_LICENSES (assets and code that do
 * not come from npm: ha-lcars, lcars, engage), leaving out sections for a package
 * whose notice is generated from node_modules (three.js).
 * @param {Iterable<string>} generated - package names with a generated notice
 */
export function handNotices(generated, { root = ROOT } = {}) {
  const file = join(root, 'THIRD_PARTY_LICENSES');
  if (!existsSync(file)) return [];
  const names = new Set(generated);
  return readFileSync(file, 'utf8').split(/^-{3,}\s*$/m).map(s => s.trim()).filter(Boolean).filter((section) => {
    const subject = section.match(/^[^\n]*?'([^']+)'/)?.[1];
    return !subject || !(names.has(subject) || names.has(subject.replace(/\.js$/, '')));
  });
}

/**
 * The full THIRD_PARTY_NOTICES.txt text.
 * @param {Iterable<string>} bundled - package names found in the build
 * @param {{ title?: string, generator?: string, hand?: boolean, root?: string }} [options]
 *   generator: the script named in the header; hand: append THIRD_PARTY_LICENSES' entries
 */
export function noticesText(bundled, { title, generator = 'scripts/generate-third-party-notices.js', hand = true, root = ROOT } = {}) {
  const pkg = loadPackageJson({ root });
  const names = [...new Set(bundled)].sort((a, b) => a.replace(/^@/, '').localeCompare(b.replace(/^@/, '')));
  const rows = runtimeLibraries({ root });
  const rule = '='.repeat(78);
  const head = [
    title ?? `LCARdS ${pkg.version}: third-party notices`,
    '',
    'LCARdS itself is released under the MIT License (LICENSE in the repository,',
    'https://github.com/snootched/lcards/blob/main/LICENSE).',
    '',
    'The license and copyright notices of the third-party code built into this copy' + (hand ? ',' : '.'),
    ...(hand ? ['followed by the non-npm material LCARdS adapts.'] : []),
    `Generated by ${generator} from the packages found in the build;`,
    'do not edit by hand.',
    '',
    'Packages:',
    ...names.map(n => `  ${n} ${packageInfo(n, { root }).version}`),
  ].join('\n');
  const sections = [
    ...names.map(n => packageNotice(n, { root, rows })),
    ...(hand ? handNotices(names, { root }) : []),
  ];
  return `${head}\n\n${sections.map(s => `${rule}\n${s}\n`).join('\n')}`;
}
