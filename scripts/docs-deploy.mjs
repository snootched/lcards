#!/usr/bin/env node
/**
 * docs-deploy.mjs - merge one docs channel's build into the published site tree.
 *
 * The docs site holds three kinds of channel (see reports/ai-readiness-plan.md, step 3):
 *   latest   the site root: the stable line, rebuilt on every push to main
 *   dev      /dev/: the dev branch, rebuilt on every push to dev
 *   archive  /v/<version>/: a stable release, built once and then frozen
 *
 * The tree lives on the `gh-pages` branch; .github/workflows/docs.yml checks it out,
 * runs this, commits, and publishes the whole tree to GitHub Pages. Each channel
 * replaces only its own part:
 *   latest   everything at the root except v/, dev/ and versions.json
 *   dev      dev/
 *   archive  v/<version>/ (refuses to overwrite one that exists), then prunes v/ to
 *            the newest --keep versions
 *
 * Shared files at the root, kept as the union of every channel's (a deploy adds what's
 * missing and never deletes):
 *   - card assets: the LCARdS bundle loads MSD SVGs, sounds, fonts and images from the
 *     root-absolute /lcards/ path (where HA serves them), so every channel's demos read
 *     the root's lcards/{msd,sounds,fonts,images};
 *   - release pictures: a GitHub release body links /releases/<version>/<picture> at
 *     the site root, also for a dev pre-release whose docs live under /dev/.
 *
 * /versions.json (read by the docs' VersionSwitcher/VersionBanner):
 *   { "latest": "<root version>", "dev": "<dev version>", "versions": [newest first] }
 *
 * Usage:
 *   node scripts/docs-deploy.mjs --site=<gh-pages checkout> --build=<vitepress dist> \
 *        --channel=latest|dev|archive --version=<package.json version> [--keep=8] [--force]
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { compareVersions } from './release-lib.mjs';

/** Root entries a `latest` deploy leaves alone. */
const KEEP_AT_ROOT = new Set(['v', 'dev', 'versions.json', '.git']);
/** Asset folders under lcards/ that are kept as a union across channels. */
export const SHARED_ASSET_DIRS = ['msd', 'sounds', 'fonts', 'images'];

/** Root-relative folders kept as a union: card assets, and each release's picture folder. */
export function sharedDirs(root) {
  const dirs = SHARED_ASSET_DIRS.map(d => join('lcards', d));
  const releases = join(root, 'releases');
  if (existsSync(releases)) {
    for (const ent of readdirSync(releases, { withFileTypes: true })) {
      if (ent.isDirectory()) dirs.push(join('releases', ent.name));
    }
  }
  return dirs;
}
export const DEFAULT_KEEP = 8;

const isStable = (v) => /^\d{4}\.\d{2}\.\d+$/.test(v) || /^\d{4}\.\d{2}\.\d{2}\.\d+$/.test(v);

/** Copy files from `src` into `dest` that `dest` doesn't have yet (recursive). */
export function copyMissing(src, dest) {
  if (!existsSync(src)) return 0;
  let added = 0;
  for (const ent of readdirSync(src, { withFileTypes: true })) {
    const s = join(src, ent.name);
    const d = join(dest, ent.name);
    if (ent.isDirectory()) {
      added += copyMissing(s, d);
    } else if (!existsSync(d)) {
      mkdirSync(dest, { recursive: true });
      cpSync(s, d);
      added++;
    }
  }
  return added;
}

/** Add a build's shared files (card assets, release pictures) to the root (never removes any). */
function unionShared(build, site) {
  let added = 0;
  for (const dir of sharedDirs(build)) added += copyMissing(join(build, dir), join(site, dir));
  return added;
}

/** Archived versions on the site, newest first. */
export function archivedVersions(site) {
  const v = join(site, 'v');
  if (!existsSync(v)) return [];
  return readdirSync(v, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort((a, b) => compareVersions(b, a));
}

/**
 * Merge a build into the site tree.
 * @param {{site: string, build: string, channel: 'latest'|'dev'|'archive', version: string, keep?: number, force?: boolean}} opts
 * @returns {{versions: object, pruned: string[], assetsAdded: number}}
 */
export function deploy({ site, build, channel, version, keep = DEFAULT_KEEP, force = false }) {
  if (!existsSync(join(build, 'index.html'))) throw new Error(`${build} is not a docs build (no index.html)`);
  if (!version) throw new Error('--version is required');
  mkdirSync(site, { recursive: true });
  if (channel !== 'latest' && !existsSync(join(site, 'index.html'))) {
    throw new Error('The site has no root yet: deploy the latest channel (main) first.');
  }

  let assetsAdded = 0;
  let pruned = [];
  if (channel === 'latest') {
    // Keep the other channels' shared files: stash them, replace the root, merge back.
    const stash = mkdtempSync(join(tmpdir(), 'lcards-shared-'));
    const stashed = sharedDirs(site);
    for (const dir of stashed) {
      const from = join(site, dir);
      if (existsSync(from)) cpSync(from, join(stash, dir), { recursive: true });
    }
    for (const name of readdirSync(site)) {
      if (!KEEP_AT_ROOT.has(name)) rmSync(join(site, name), { recursive: true, force: true });
    }
    for (const name of readdirSync(build)) {
      if (KEEP_AT_ROOT.has(name)) throw new Error(`The root build contains reserved path ${name}/`);
      cpSync(join(build, name), join(site, name), { recursive: true });
    }
    for (const dir of stashed) assetsAdded += copyMissing(join(stash, dir), join(site, dir));
    rmSync(stash, { recursive: true, force: true });
  } else if (channel === 'dev') {
    rmSync(join(site, 'dev'), { recursive: true, force: true });
    cpSync(build, join(site, 'dev'), { recursive: true });
    assetsAdded = unionShared(build, site);
  } else if (channel === 'archive') {
    if (!isStable(version)) throw new Error(`Only stable releases are archived (got ${version})`);
    const dest = join(site, 'v', version);
    if (existsSync(dest) && !force) throw new Error(`v/${version}/ is already published and frozen (pass --force to replace it)`);
    rmSync(dest, { recursive: true, force: true });
    cpSync(build, dest, { recursive: true });
    assetsAdded = unionShared(build, site);
    pruned = archivedVersions(site).slice(keep);
    for (const v of pruned) rmSync(join(site, 'v', v), { recursive: true, force: true });
  } else {
    throw new Error(`Unknown channel ${channel} (latest, dev or archive)`);
  }

  const file = join(site, 'versions.json');
  const versions = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  if (channel === 'latest') versions.latest = version;
  if (channel === 'dev') versions.dev = version;
  versions.versions = archivedVersions(site);
  writeFileSync(file, JSON.stringify(versions, null, 2) + '\n');
  return { versions, pruned, assetsAdded };
}

function main() {
  const args = Object.fromEntries(process.argv.slice(2).map(a => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.length ? v.join('=') : true];
  }));
  for (const k of ['site', 'build', 'channel', 'version']) {
    if (!args[k]) {
      console.error(`Missing --${k}. Usage: node scripts/docs-deploy.mjs --site=<dir> --build=<dist> --channel=latest|dev|archive --version=<v> [--keep=8] [--force]`);
      process.exit(2);
    }
  }
  try {
    const { versions, pruned, assetsAdded } = deploy({
      site: resolve(args.site), build: resolve(args.build), channel: args.channel, version: args.version,
      keep: args.keep ? Number(args.keep) : DEFAULT_KEEP, force: !!args.force,
    });
    const where = { latest: '/', dev: '/dev/', archive: `/v/${args.version}/` }[args.channel];
    console.log(`Deployed ${args.version} to ${where}; versions.json: ${JSON.stringify(versions)}`);
    if (assetsAdded) console.log(`Root shared files (card assets, release pictures): ${assetsAdded} added for other channels`);
    if (pruned.length) console.log(`Pruned archived versions: ${pruned.join(', ')}`);
  } catch (e) {
    console.error(`docs-deploy: ${e.message}`);
    process.exit(1);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
