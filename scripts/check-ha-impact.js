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
 *
 * @module scripts/check-ha-impact
 */

import { execFileSync, spawnSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
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
const FRONTEND_RELEVANT_PATHS = [
  'src/resources/theme/',
  'src/resources/styles/',
  'src/components/ha-button*',
  'src/components/ha-textfield*',
  'src/components/ha-textarea*',
  'src/components/ha-circular-progress*',
  'src/components/ha-expansion-panel*',
  'src/components/ha-tab-group*',
  'src/components/ha-tab-panel*',
  'src/components/ha-selector/',
  'src/components/ha-alert*',
  'src/components/ha-entity-picker*',
  'src/components/ha-icon-button*',
  'src/components/ha-card*',
  'src/panels/lovelace/',
  'src/layouts/',
];

const CORE_RELEVANT_PATHS = [
  'homeassistant/components/frontend/',
  'homeassistant/components/websocket_api/',
  'homeassistant/components/http/',
];

// ─── Small helpers ────────────────────────────────────────────────────────────

function git(repoPath, args) {
  return execFileSync('git', ['-C', repoPath, ...args], { encoding: 'utf-8' }).trim();
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

/** Extract all `--name:` CSS custom property declarations from HA theme files. */
function extractFrontendCssVars(frontendPath) {
  const themeDir = join(frontendPath, 'src', 'resources', 'theme');
  const files = walk(themeDir, f => f.endsWith('.globals.ts'));
  const vars = new Set();
  const RE_VAR = /--([\w-]+)\s*:/g;
  for (const file of files) {
    const text = readFileSync(file, 'utf-8');
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
function analyzeRepo({ name, repoPath, relevantPaths, state, trackCssVars }) {
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

  const headSha = git(repoPath, ['rev-parse', 'HEAD']);
  const repoState = state[name] || {};
  const lastSha = repoState.lastSha;

  let cssVarDiff = null;
  const nextCssVars = trackCssVars ? extractFrontendCssVars(repoPath) : null;

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

  if (trackCssVars) {
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

const repos = [
  {
    name: 'frontend',
    repoPath: FRONTEND_PATH,
    relevantPaths: FRONTEND_RELEVANT_PATHS,
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

Pay special attention to:
  - CSS custom property renames, removals, or value-meaning changes (--ha-*, --primary-*, --mdc-*, --md-*)
  - Changes to the approved HA elements LCARdS uses (props/attributes added, removed, or renamed; \
slot/shadow-DOM structure changes; deprecations)
  - Any MWC→WebAwesome migration activity (new wa-* elements, mwc-* removals, changed event names)

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
