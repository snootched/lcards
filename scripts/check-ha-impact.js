#!/usr/bin/env node
/**
 * @fileoverview Local HA Frontend/Core Impact Analysis
 *
 * LCARdS has repeatedly broken on upstream Home Assistant frontend changes
 * (ha-textfield 0px-height regression, ha-circular-progress size="small" →
 * "s", --mdc-theme-primary removal, the ongoing MDC→WebAwesome migration).
 * This script gives an early warning by diffing the local `frontend` (and
 * optionally `homeassistant-core`) workspace checkouts against the last
 * commit we analyzed, filtered to paths LCARdS actually depends on.
 *
 * Tier 1 (always runs, free, no LLM):
 *   - relevant-path file diff per repo
 *   - deterministic --ha-* CSS var add/remove diff (regex over theme/*.globals.ts)
 *
 * Tier 2 (default, skip with --quick):
 *   - hands the changed-file list off to the Claude Code CLI (`claude -p`),
 *     which reads the actual diffs itself (via --add-dir) and the LCARdS
 *     dependency docs, then writes a HIGH/MEDIUM/LOW markdown report.
 *
 * Usage:
 *   node scripts/check-ha-impact.js                 full run (tier 1 + 2)
 *   node scripts/check-ha-impact.js --quick          tier 1 only, no LLM call
 *   node scripts/check-ha-impact.js --pull           git pull checkouts first (only if clean)
 *   node scripts/check-ha-impact.js --include-core   also analyze homeassistant-core
 *   node scripts/check-ha-impact.js --since=<sha>    diff <sha>..HEAD instead of the saved
 *                                                    baseline; never writes .state.json
 *   node scripts/check-ha-impact.js --ref=<tag|sha>  analyze that frontend ref (e.g. an upcoming
 *                                                    release tag) instead of the checkout's HEAD —
 *                                                    read via git, nothing is checked out
 *
 * Tier 1 also always runs two frontend health checks against the analyzed ref:
 *   - element existence: every <ha-*|hui-*|wa-*|mwc-*|paper-*> tag LCARdS renders must
 *     be defined there (@customElement / customElements.define / a webawesome import)
 *   - dead CSS hooks: HA-namespace vars LCARdS *sets* (--ha-*, --mdc-*, --dialog-*, --md-*)
 *     that the frontend source never references
 *
 * @module scripts/check-ha-impact
 */

import { execFileSync, spawnSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ─── CLI args ─────────────────────────────────────────────────────────────────
const ARGS = new Set(process.argv.slice(2));
const QUICK = ARGS.has('--quick');
const PULL = ARGS.has('--pull');
const INCLUDE_CORE = ARGS.has('--include-core');
const HELP = ARGS.has('--help') || ARGS.has('-h');
const SINCE = process.argv.slice(2).find(a => a.startsWith('--since='))?.slice('--since='.length) || null;
const FRONTEND_REF = process.argv.slice(2).find(a => a.startsWith('--ref='))?.slice('--ref='.length) || 'HEAD';

// ─── ANSI colour helpers ──────────────────────────────────────────────────────
const RED = s => `\x1b[31m${s}\x1b[0m`;
const YELLOW = s => `\x1b[33m${s}\x1b[0m`;
const GREEN = s => `\x1b[32m${s}\x1b[0m`;
const BOLD = s => `\x1b[1m${s}\x1b[0m`;
const DIM = s => `\x1b[2m${s}\x1b[0m`;

if (HELP) {
  console.log(`Local HA Frontend/Core Impact Analysis

Usage:
  node scripts/check-ha-impact.js [options]

Options:
  --quick          Tier 1 only (deterministic file/var diff) — no Claude CLI call
  --pull           git pull --ff-only the checkouts first (skipped if dirty)
  --include-core   Also analyze the homeassistant-core checkout
  --since=<sha>    Diff <sha>..HEAD instead of the saved baseline (re-check a
                   past range); never writes .state.json
  --ref=<tag|sha>  Analyze this frontend ref instead of the checkout's HEAD
                   (e.g. --ref=20260930.0); nothing is checked out
  --help, -h       Show this help
`);
  process.exit(0);
}

// ─── Repo locations (sibling workspace checkouts) ────────────────────────────
const FRONTEND_PATH = join(dirname(ROOT), 'frontend');
const CORE_PATH = join(homedir(), 'code', 'homeassistant-core');

const REPORTS_DIR = join(ROOT, 'reports', 'ha-impact');
const STATE_PATH = join(REPORTS_DIR, '.state.json');

// ─── Relevant path allowlists ─────────────────────────────────────────────────
// Mirrors ha-lcars's RELEVANT_PATH_PREFIXES pattern, but scoped to what LCARdS
// actually depends on (see .github/instructions/editor.instructions.md
// "Approved HA Elements" + doc/development/ha-css-vars.md "Variable Sources").
// The static list covers infrastructure; the files defining every <ha-*>/<hui-*>
// element LCARdS renders are added automatically (deriveLcardsElementPaths),
// so a newly used element can't silently fall outside the filter.
const FRONTEND_RELEVANT_PATHS = [
  'package.json',                    // @home-assistant/webawesome / lit bumps
  'src/resources/theme/',
  'src/resources/styles/',
  'src/components/ha-selector/',
  'src/components/ha-form/',
  'src/components/input/',
  'src/components/chips/',
  'src/components/ha-media-item-picker*',
  'src/mixins/',                     // e.g. ConditionalListenerMixin (hui-card visibility)
  'src/common/controllers/',
  'src/common/condition/',
  'src/panels/lovelace/',
  'src/layouts/',
];

/**
 * Every HA-provided element tag LCARdS renders (markup or createElement).
 * @returns {Set<string>}
 */
function lcardsUsedTags() {
  const tags = new Set();
  const RE_TAG = /<((?:ha|hui|wa|mwc|paper)-[a-z0-9-]+)|createElement\(\s*['"]((?:ha|hui|wa|mwc|paper)-[a-z0-9-]+)['"]/g;
  for (const file of walk(join(ROOT, 'src'), f => f.endsWith('.js'))) {
    for (const m of readFileSync(file, 'utf-8').matchAll(RE_TAG)) tags.add(m[1] || m[2]);
  }
  return tags;
}

/**
 * Map of element tag -> defining file in the frontend at `ref`:
 * @customElement / customElements.define, plus wa-* elements HA registers by
 * importing @home-assistant/webawesome components.
 * @returns {Map<string, string>|null} null when the frontend repo is unavailable
 */
function frontendElementDefs(frontendPath, ref) {
  let out;
  try {
    out = git(frontendPath, ['grep', '-n', '-E',
      '@customElement\\("[a-z0-9-]+"\\)|customElements\\.define\\(\\s*"[a-z0-9-]+"|webawesome/dist/components/[a-z0-9-]+/',
      ref, '--', 'src']);
  } catch {
    return null;
  }
  const defs = new Map();
  const prefix = `${ref}:`;
  for (const raw of out.split('\n')) {
    const line = raw.startsWith(prefix) ? raw.slice(prefix.length) : raw;
    const file = line.split(':')[0];
    for (const m of line.matchAll(/@customElement\("([a-z0-9-]+)"\)|customElements\.define\(\s*"([a-z0-9-]+)"/g)) {
      const tag = m[1] || m[2];
      if (!defs.has(tag)) defs.set(tag, file);
    }
    for (const m of line.matchAll(/webawesome\/dist\/components\/([a-z0-9-]+)\//g)) {
      if (!defs.has(`wa-${m[1]}`)) defs.set(`wa-${m[1]}`, file);
    }
  }
  return defs;
}

/**
 * Resolve every element LCARdS renders to the frontend file defining it, so
 * changes to those files are always in the relevant-path filter.
 */
function deriveLcardsElementPaths(defs, tags) {
  if (!defs) return [];
  return [...new Set([...tags].filter(t => defs.has(t) && !t.startsWith('wa-')).map(t => defs.get(t)))].sort();
}

/**
 * Health checks against the frontend at `ref` (tier 1, deterministic):
 *   missingTags   — tags LCARdS renders that HA no longer defines (render as empty unknown elements)
 *   deadHooks     — HA-owned CSS vars LCARdS sets that HA never references (silently do nothing)
 *   unverifiedMd  — --md-* vars LCARdS sets that HA src never references (may still be read inside
 *                   @material/web, which isn't in the frontend src tree — verify by hand)
 */
// Tags LCARdS renders on purpose even though HA never defined them. Keep this
// list tiny and justified — everything else missing is a real break.
const KNOWN_UNDEFINED_TAGS = new Map([
  // Never existed in HA. Used as a plain `?hidden` tab-content wrapper by
  // LCARdSBaseEditor and a few dialogs; as an unknown (display:inline) element
  // its min-height/vertical padding rules don't apply, so swapping in a <div>
  // changes every editor's layout. Migrate deliberately, with a visual check.
  ['ha-tab-panel', 'LCARdS tab-content wrapper (never an HA element)'],
]);

function frontendHealthChecks(frontendPath, ref, defs, tags) {
  const missingTags = defs ? [...tags].filter(t => !defs.has(t) && !KNOWN_UNDEFINED_TAGS.has(t)).sort() : [];

  const sets = new Map(); // var -> Set<file>
  const reads = new Set();
  const RE_SET = /(--(?:ha|mdc|md|dialog)-[a-z0-9-]+)\s*:/g;
  const RE_READ = /var\(\s*(--[a-z0-9-]+)/g;
  for (const file of walk(join(ROOT, 'src'), f => f.endsWith('.js'))) {
    const text = readFileSync(file, 'utf-8');
    for (const m of text.matchAll(RE_SET)) {
      if (!sets.has(m[1])) sets.set(m[1], new Set());
      sets.get(m[1]).add(relative(ROOT, file));
    }
    for (const m of text.matchAll(RE_READ)) reads.add(m[1]);
  }
  let referenced;
  try {
    referenced = new Set(git(frontendPath, ['grep', '-ohE', '--', '--[a-zA-Z0-9_-]+', ref, '--', 'src'])
      .split('\n').map(l => l.slice(l.lastIndexOf(':') + 1)));
  } catch {
    return { missingTags, deadHooks: [], unverifiedMd: [] };
  }
  const deadHooks = [];
  const unverifiedMd = [];
  for (const [v, files] of [...sets].sort()) {
    // LCARdS's own variables (set and read by LCARdS) aren't HA hooks
    if (referenced.has(v) || reads.has(v)) continue;
    (v.startsWith('--md-') ? unverifiedMd : deadHooks).push({ v, files: [...files] });
  }
  return { missingTags, deadHooks, unverifiedMd };
}

const CORE_RELEVANT_PATHS = [
  'homeassistant/components/frontend/',
  'homeassistant/components/websocket_api/',
  'homeassistant/components/http/',
];

// ─── Small helpers ────────────────────────────────────────────────────────────

function git(repoPath, args) {
  return execFileSync('git', ['-C', repoPath, ...args], { encoding: 'utf-8', maxBuffer: 512 * 1024 * 1024 }).trim();
}

function loadState() {
  if (!existsSync(STATE_PATH)) return {};
  try {
    return JSON.parse(readFileSync(STATE_PATH, 'utf-8'));
  } catch (e) {
    console.warn(YELLOW(`⚠  Could not parse ${STATE_PATH}: ${e.message} — starting fresh.`));
    return {};
  }
}

function saveState(state) {
  if (SINCE) return; // --since re-checks an arbitrary range; never move the baseline
  mkdirSync(REPORTS_DIR, { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n');
}

/** Recursively collect file paths under dir matching predicate(relativePath). */
function walk(dir, predicate, base = dir) {
  let results = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(walk(full, predicate, base));
    } else if (predicate(full)) {
      results.push(full);
    }
  }
  return results;
}

/** Extract all `--name:` CSS custom property declarations from HA theme files at `ref`. */
function extractFrontendCssVars(frontendPath, ref) {
  const files = git(frontendPath, ['ls-tree', '-r', '--name-only', ref, '--', 'src/resources/theme'])
    .split('\n').filter(f => f.endsWith('.globals.ts'));
  const vars = new Set();
  const RE_VAR = /--([\w-]+)\s*:/g;
  for (const file of files) {
    const text = git(frontendPath, ['show', `${ref}:${file}`]);
    for (const m of text.matchAll(RE_VAR)) vars.add(m[1]);
  }
  return vars;
}

function diffSets(prevArr, nextSet) {
  const prev = new Set(prevArr || []);
  const added = [...nextSet].filter(v => !prev.has(v));
  const removed = [...prev].filter(v => !nextSet.has(v));
  return { added, removed };
}

/**
 * Analyze a single repo: pull (optional), diff against last-analyzed SHA,
 * filter to relevant paths, and (for frontend) diff the CSS var snapshot.
 * Returns null if the repo is missing, or a result object otherwise.
 */
function analyzeRepo({ name, repoPath, relevantPaths, state, trackCssVars, ref = 'HEAD' }) {
  if (!existsSync(repoPath)) {
    console.warn(YELLOW(`⚠  ${name}: not found at ${repoPath} — skipping.`));
    return null;
  }

  console.log(BOLD(`\n— ${name} (${repoPath}) —`));

  if (PULL) {
    const dirty = git(repoPath, ['status', '--short']);
    if (dirty) {
      console.warn(YELLOW(`⚠  ${name} has local changes — skipping pull.`));
    } else {
      try {
        const branch = git(repoPath, ['branch', '--show-current']);
        console.log(`  Pulling ${branch}…`);
        console.log(DIM(git(repoPath, ['pull', '--ff-only'])));
      } catch (e) {
        console.warn(YELLOW(`⚠  ${name}: pull failed — ${e.message}`));
      }
    }
  }

  const headSha = git(repoPath, ['rev-parse', `${ref}^{commit}`]);
  const repoState = state[name] || {};
  const lastSha = SINCE ? git(repoPath, ['rev-parse', SINCE]) : repoState.lastSha;

  let cssVarDiff = null;
  const nextCssVars = trackCssVars ? extractFrontendCssVars(repoPath, headSha) : null;

  if (!lastSha) {
    console.log(`  No prior baseline — recording HEAD (${headSha.slice(0, 7)}) as the starting point.`);
    state[name] = {
      lastSha: headSha,
      lastRun: new Date().toISOString(),
      ...(trackCssVars ? { cssVarSnapshot: [...nextCssVars] } : {}),
    };
    return { name, repoPath, headSha, lastSha: null, changedFiles: [], baseline: true };
  }

  if (lastSha === headSha) {
    console.log(`  Already at last-analyzed commit (${headSha.slice(0, 7)}) — nothing new.`);
    return { name, repoPath, headSha, lastSha, changedFiles: [], baseline: false };
  }

  const changedFiles = git(repoPath, ['diff', '--name-only', `${lastSha}..${headSha}`, '--', ...relevantPaths])
    .split('\n')
    .filter(Boolean);

  // The saved var snapshot belongs to the saved baseline, not to --since.
  if (trackCssVars && !SINCE) {
    cssVarDiff = diffSets(repoState.cssVarSnapshot, nextCssVars);
  }

  console.log(`  ${lastSha.slice(0, 7)}..${headSha.slice(0, 7)}: ${changedFiles.length} relevant file(s) changed.`);
  if (changedFiles.length) {
    for (const f of changedFiles.slice(0, 25)) console.log(DIM(`    ${f}`));
    if (changedFiles.length > 25) console.log(DIM(`    … and ${changedFiles.length - 25} more`));
  }
  if (cssVarDiff && (cssVarDiff.added.length || cssVarDiff.removed.length)) {
    if (cssVarDiff.added.length) console.log(GREEN(`  + added vars:   ${cssVarDiff.added.join(', ')}`));
    if (cssVarDiff.removed.length) console.log(RED(`  - removed vars: ${cssVarDiff.removed.join(', ')}`));
  }

  return {
    name,
    repoPath,
    headSha,
    lastSha,
    changedFiles,
    cssVarDiff,
    nextCssVars: trackCssVars ? nextCssVars : null,
    baseline: false,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const state = loadState();

const usedTags = lcardsUsedTags();
const elementDefs = existsSync(FRONTEND_PATH) ? frontendElementDefs(FRONTEND_PATH, FRONTEND_REF) : null;
const frontendElementPaths = deriveLcardsElementPaths(elementDefs, usedTags);
console.log(DIM(`Watching ${frontendElementPaths.length} frontend element file(s) derived from LCARdS src/.`));

// ─── Tier 1 health checks (always run) ────────────────────────────────────────
let health = null;
if (elementDefs) {
  health = frontendHealthChecks(FRONTEND_PATH, FRONTEND_REF, elementDefs, usedTags);
  console.log(BOLD(`\n— frontend health @ ${FRONTEND_REF} —`));
  if (health.missingTags.length) {
    console.log(RED(`  ✖ ${health.missingTags.length} element(s) LCARdS renders are not defined by HA (render as empty unknown tags):`));
    for (const t of health.missingTags) console.log(RED(`      <${t}>`));
  } else {
    console.log(GREEN(`  ✓ all ${usedTags.size} HA element tags LCARdS renders are defined`));
  }
  if (health.deadHooks.length) {
    console.log(RED(`  ✖ ${health.deadHooks.length} HA CSS hook(s) LCARdS sets are never referenced by HA (silently do nothing):`));
    for (const { v, files } of health.deadHooks) console.log(RED(`      ${v}`) + DIM(`  ${files.slice(0, 3).join(', ')}`));
  } else {
    console.log(GREEN('  ✓ every --ha-*/--mdc-*/--dialog-* hook LCARdS sets is referenced by HA'));
  }
  if (health.unverifiedMd.length) {
    console.log(YELLOW(`  ? ${health.unverifiedMd.length} --md-* var(s) not referenced in HA src — may be read inside @material/web; verify:`));
    for (const { v, files } of health.unverifiedMd) console.log(YELLOW(`      ${v}`) + DIM(`  ${files.slice(0, 3).join(', ')}`));
  }
}

const repos = [
  {
    name: 'frontend',
    repoPath: FRONTEND_PATH,
    relevantPaths: [...new Set([...FRONTEND_RELEVANT_PATHS, ...frontendElementPaths])],
    ref: FRONTEND_REF,
    trackCssVars: true,
  },
];
if (INCLUDE_CORE) {
  repos.push({
    name: 'core',
    repoPath: CORE_PATH,
    relevantPaths: CORE_RELEVANT_PATHS,
    trackCssVars: false,
  });
}

const results = repos
  .map(r => analyzeRepo({ ...r, state }))
  .filter(Boolean);

const withChanges = results.filter(r => !r.baseline && r.changedFiles.length > 0);

if (withChanges.length === 0) {
  console.log(BOLD('\nNothing relevant changed since the last analysis.'));
  saveState(state);
  process.exit(0);
}

if (QUICK) {
  console.log(BOLD('\n--quick: skipping Claude CLI report.'));
  // Bump state forward even on a quick run so the next full run's diff window
  // doesn't grow unbounded; the file-level summary above already surfaced it.
  for (const r of withChanges) {
    state[r.name] = {
      lastSha: r.headSha,
      lastRun: new Date().toISOString(),
      ...(r.nextCssVars ? { cssVarSnapshot: [...r.nextCssVars] } : {}),
    };
  }
  saveState(state);
  process.exit(0);
}

// ─── Tier 2: hand off to the Claude Code CLI ─────────────────────────────────

mkdirSync(REPORTS_DIR, { recursive: true });
const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const primarySha = withChanges[0].headSha.slice(0, 7);
const reportPath = join('reports', 'ha-impact', `${dateStr}-${primarySha}.md`);

const repoSections = withChanges
  .map(r => {
    const lines = [
      `### ${r.name} (${r.repoPath})`,
      `Commit range to diff: \`${r.lastSha}..${r.headSha}\``,
      `Relevant changed files (run \`git -C ${r.repoPath} diff ${r.lastSha}..${r.headSha} -- <file>\` per file, or the whole filtered range, to see actual content changes):`,
      ...r.changedFiles.map(f => `  - ${f}`),
    ];
    if (r.cssVarDiff && (r.cssVarDiff.added.length || r.cssVarDiff.removed.length)) {
      lines.push('Deterministic CSS var diff already detected (verify and expand on this, don\'t just repeat it):');
      if (r.cssVarDiff.added.length) lines.push(`  - Added: ${r.cssVarDiff.added.join(', ')}`);
      if (r.cssVarDiff.removed.length) lines.push(`  - Removed/renamed: ${r.cssVarDiff.removed.join(', ')}`);
    }
    return lines.join('\n');
  })
  .join('\n\n');

const prompt = `You are doing a breaking-change impact analysis for the LCARdS Home Assistant \
Lovelace card project (this repo, ${ROOT}) against upstream changes in the local checkouts below.

LCARdS has been broken before by HA frontend changes: ha-textfield rendering at 0px height \
(deprecated MDC component), ha-circular-progress size="small" → "s", --mdc-theme-primary \
removal, and the ongoing MDC→WebAwesome (WA) component migration. Your job is to catch the \
next one of these before it ships.

First, read these two files in this repo for context on exactly what LCARdS currently depends \
on:
  - doc/development/ha-css-vars.md  (every HA CSS custom property LCARdS uses, and how)
  - .github/instructions/editor.instructions.md  (the "Approved HA Elements" list and CSS/theming conventions)

Then, for each repo/commit-range below, run \`git -C <repo path> diff <range> -- <file>\` \
yourself (or in batches) to see the actual content diffs of the changed files — the list below \
is just the file-level filter, you need the real diffs to judge impact:

${repoSections}

${health && (health.missingTags.length || health.deadHooks.length || health.unverifiedMd.length) ? `Deterministic frontend health checks @ ${FRONTEND_REF} already flagged (verify, explain impact, suggest fixes):
${health.missingTags.map(t => `  - element <${t}> is rendered by LCARdS but not defined by HA`).join('\n')}
${health.deadHooks.map(({ v, files }) => `  - CSS hook ${v} is set by LCARdS (${files.join(', ')}) but never referenced by HA`).join('\n')}
${health.unverifiedMd.map(({ v, files }) => `  - --md-* var ${v} (${files.join(', ')}) not referenced in HA src — check whether a remaining @material/web component still reads it`).join('\n')}

` : ''}Pay special attention to:
  - CSS custom property renames, removals, or value-meaning changes (--ha-*, --primary-*, --mdc-*, --md-*)
  - Changes to the approved HA elements LCARdS uses (props/attributes added, removed, or renamed; \
slot/shadow-DOM structure changes; deprecations)
  - Any MWC→WebAwesome migration activity (new wa-* elements, mwc-* removals, changed event names)
  - Dependency version bumps in package.json that LCARdS inherits at runtime \
(@home-assistant/webawesome, lit) — LCARdS renders wa-* elements directly
  - Elements losing their last eager importer (LCARdS can't import HA modules; it relies on \
someone else registering every element it renders)

Do NOT report pure logic changes, translation/localization changes, or test-only changes.

Write your findings to ${reportPath} (relative to ${ROOT}) as a markdown report with this structure:
  - A small header table: repos analyzed, commit ranges, date
  - "## HIGH IMPACT" / "## MEDIUM IMPACT" / "## LOW IMPACT" sections, each with bullet points: \
what changed, what in LCARdS it affects (file/variable/element), and a suggested fix
  - End with this exact HTML comment block so future readers know the convention:
    <!-- Review each item above. Mark resolved items with a ✅. When everything in this file is
    resolved, delete the file — it is a working document, not permanent documentation. -->

If you find nothing of HIGH or MEDIUM impact, say so plainly rather than padding the report.`;

console.log(BOLD('\nHanding off to Claude Code CLI for narrative analysis…'));
console.log(DIM(`  Report will be written to ${reportPath}\n`));

const addDirArgs = withChanges.flatMap(r => ['--add-dir', r.repoPath]);

const claudeResult = spawnSync(
  'claude',
  [
    '-p', prompt,
    ...addDirArgs,
    '--allowedTools', 'Bash(git *) Read Write Glob Grep',
    '--permission-mode', 'acceptEdits',
  ],
  { cwd: ROOT, stdio: 'inherit' }
);

if (claudeResult.error) {
  console.error(RED(`✗ Failed to invoke claude CLI: ${claudeResult.error.message}`));
  console.error(YELLOW('  Is the Claude Code CLI installed and on PATH? State was not updated — re-run when fixed.'));
  process.exit(1);
}
if (claudeResult.status !== 0) {
  console.error(RED(`✗ claude CLI exited with status ${claudeResult.status}. State was not updated — re-run to retry.`));
  process.exit(claudeResult.status ?? 1);
}

// Only bump state forward after a successful Claude run.
for (const r of withChanges) {
  state[r.name] = {
    lastSha: r.headSha,
    lastRun: new Date().toISOString(),
    ...(r.nextCssVars ? { cssVarSnapshot: [...r.nextCssVars] } : {}),
  };
}
saveState(state);

console.log(GREEN(`\n✓ Done. Report: ${reportPath}`));
