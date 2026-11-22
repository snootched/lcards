#!/usr/bin/env node
/**
 * LCARdS plugin hook (PostToolUse on Write/Edit/MultiEdit): when Claude writes a YAML
 * file that holds LCARdS config, run the bundled config checker on it and hand the
 * result back. Errors block (Claude must fix them); warnings come back as context.
 * Any other file, or a checker that cannot run, is a silent no-op.
 */
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.env.CLAUDE_PLUGIN_ROOT ?? join(dirname(fileURLToPath(import.meta.url)), '..');
const checker = join(root, 'skills/lcards/scripts/lcards-validate.mjs');

let input;
try { input = JSON.parse(readFileSync(0, 'utf8')); } catch { process.exit(0); }
const file = input?.tool_input?.file_path;
if (typeof file !== 'string' || !/\.ya?ml$/i.test(file) || !existsSync(file) || !existsSync(checker)) process.exit(0);
let text;
try { text = readFileSync(file, 'utf8'); } catch { process.exit(0); }
if (!/custom:(lcards-|lcars-shell)/.test(text)) process.exit(0);

const run = spawnSync(process.execPath, [checker, '--json', file], { encoding: 'utf8', timeout: 30000 });
let issues;
try { issues = JSON.parse(run.stdout); } catch { process.exit(0); }
if (!Array.isArray(issues) || !issues.length) process.exit(0);

const line = (i) => `- ${i.severity} ${i.path || '(root)'} [${i.tag}]: ${i.message}`;
const errors = issues.filter(i => i.severity === 'error');
const warnings = issues.filter(i => i.severity !== 'error');
const report = `LCARdS config checker on ${file}:\n${[...errors, ...warnings].map(line).join('\n')}`;
const out = errors.length
  ? { decision: 'block', reason: `${report}\nFix every error (and the warnings, usually typos) before handing the YAML over.` }
  : { hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: `${report}\nNo errors. Check each warning: an unknown name is almost always a typo.` } };
process.stdout.write(JSON.stringify(out));
