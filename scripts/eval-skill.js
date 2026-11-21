#!/usr/bin/env node
/**
 * eval-skill.js - run the LCARdS plugin's eval suite (skills/lcards/plugin/evals/) with
 * `claude plugin eval`: build the plugin zip, unpack it with the suite into a temp
 * directory, and evaluate it against a no-plugin baseline. Each case is a user request
 * graded on what Claude produced (regex over the YAML file or the reply, short rubrics)
 * and on whether the skill fired.
 *
 *   npm run eval:skill                        every case, 2 runs per arm
 *   npm run eval:skill -- --case 'ha-lcars-*' --runs 1    any claude plugin eval option
 *
 * Local only: every run is a Claude session on your own credential (it costs tokens), so
 * it is not part of npm test or CI. Needs the claude CLI; Bash runs in its OS sandbox
 * (bubblewrap + socat on Linux). Results and the HTML report go to the printed directory.
 */
import { cpSync, mkdirSync, mkdtempSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const work = mkdtempSync(join(tmpdir(), 'lcards-skill-eval-'));
const plugin = join(work, 'lcards');

execFileSync(process.execPath, [join(ROOT, 'scripts/build-user-skill.js'),
  `--out=${join(work, 'lcards-skill.zip')}`, `--plugin-out=${join(work, 'lcards-plugin.zip')}`,
  `--marketplace-out=${join(work, 'marketplace.json')}`], { stdio: 'inherit' });
mkdirSync(plugin);
execFileSync('python3', ['-m', 'zipfile', '-e', join(work, 'lcards-plugin.zip'), plugin]);
cpSync(join(ROOT, 'skills/lcards/plugin/evals'), join(plugin, 'evals'), { recursive: true });

const passthrough = process.argv.slice(2);
const args = ['plugin', 'eval', plugin, '--trust-plugin', '--no-publish',
  ...(passthrough.includes('--runs') ? [] : ['--runs', '2']),
  ...passthrough,
  // Last: --allow-tools takes a list. Write/Edit for the YAML files, node for the checker.
  '--allow-tools', 'Write', 'Edit', 'Bash(node *)'];
console.log(`\n▶ claude ${args.join(' ')}\n`);
const r = spawnSync('claude', args, { stdio: 'inherit' });
console.log(`\nPlugin and results: ${plugin} (evals/results/)`);
process.exit(r.status ?? 1);
