#!/usr/bin/env node
/**
 * @fileoverview Validate YAML examples in LCARdS documentation.
 *
 * Walks every `*.md` file under `doc/`, extracts fenced code blocks tagged
 * `yaml` or `yml`, parses them with `js-yaml`, and applies lightweight
 * structural checks tied to the *real* code:
 *
 *   1. YAML must parse (this catches indentation typos in examples).
 *   2. If the block contains a top-level (or nested-card) `type:` value of
 *      the form `custom:lcards-*`, that suffix must match the real custom
 *      element name registered in `src/lcards.js`. Card identifiers are
 *      discovered automatically by scanning for `customElements.define(
 *      'lcards-…', …)` calls — no parallel/invented schema.
 *   3. The validator skips fenced blocks tagged with the meta hint
 *      ` ```yaml no-validate ` (used for intentionally invalid examples that
 *      illustrate "❌ Wrong" anti-patterns).
 *
 * Usage:
 *   node scripts/validate-doc-examples.js              # validate
 *   node scripts/validate-doc-examples.js --verbose    # list every block
 *   node scripts/validate-doc-examples.js --quiet      # only print summary / errors
 *   node scripts/validate-doc-examples.js --strict     # parse errors are fatal too
 *
 * Default mode: any block whose `type:` references an unknown LCARdS custom
 * element fails the build (these are real bugs that would break the user's
 * dashboard). Parse failures are reported as warnings, because many
 * "snippet-style" code blocks in the docs intentionally show alternative
 * values for the same key (e.g. several `color:` lines back-to-back) and
 * are not standalone HA config documents. Add the meta hint
 * ` ```yaml no-validate ` to opt a block out entirely.
 *
 * `--strict` promotes parse warnings to errors — useful when curating docs.
 *
 * Intentionally minimal in scope: deep schema validation against the runtime
 * `CoreValidationService` (which lives inside the browser/HA bundle and
 * relies on cards self-registering schemas at startup) is tracked as a
 * follow-up PR slice in `doc/dev/codebase-review.md`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const REPO_ROOT  = path.resolve(__dirname, '..');
const DOC_ROOT   = path.join(REPO_ROOT, 'doc');
const SRC_ROOT   = path.join(REPO_ROOT, 'src');

const args = new Set(process.argv.slice(2));
const VERBOSE = args.has('--verbose');
const QUIET   = args.has('--quiet');
const STRICT  = args.has('--strict');

// Directories under doc/ that should not be scanned for prose markdown.
const SKIP_DOC_DIRS = new Set(['.vitepress', 'public', 'node_modules']);

// ── Discover real LCARdS custom element names from src/lcards.js ─────────────
function discoverRegisteredElements() {
  const lcardsEntry = path.join(SRC_ROOT, 'lcards.js');
  const text = fs.readFileSync(lcardsEntry, 'utf8');
  // Match: customElements.define('lcards-foo', SomeClass) or "lcards-foo".
  // (Backticks are not used for these registrations in the codebase.)
  const re = /customElements\.define\(\s*['"](lcards-[a-z0-9-]+)['"]/g;
  const found = new Set();
  let m;
  while ((m = re.exec(text)) !== null) found.add(m[1]);
  return found;
}

// ── Walk doc tree ────────────────────────────────────────────────────────────
function walkDocs(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (SKIP_DOC_DIRS.has(ent.name)) continue;
      walkDocs(p, out);
    } else if (ent.isFile() && /\.mdx?$/.test(ent.name)) {
      out.push(p);
    }
  }
  return out;
}

// ── Extract fenced YAML blocks ───────────────────────────────────────────────
// Matches ```yaml … ``` and ```yml … ``` and the meta hint `no-validate`.
const FENCE_RE = /^([ \t]*)```([a-zA-Z0-9_-]+)([^\n]*)\n([\s\S]*?)\n\1```/gm;

function extractYamlBlocks(text, file) {
  const blocks = [];
  let m;
  while ((m = FENCE_RE.exec(text)) !== null) {
    const lang = m[2].toLowerCase();
    if (lang !== 'yaml' && lang !== 'yml') continue;
    const meta = (m[3] || '').trim();
    if (/\bno-validate\b/.test(meta)) continue;
    // Compute 1-based line number of the opening fence
    const before = text.slice(0, m.index);
    const line = before.split('\n').length;
    blocks.push({ file, line, meta, content: m[4] });
  }
  return blocks;
}

// ── Recursively collect every `type:` value in a parsed YAML object ──────────
function collectTypes(node, out) {
  if (Array.isArray(node)) {
    for (const item of node) collectTypes(item, out);
  } else if (node && typeof node === 'object') {
    if (typeof node.type === 'string') out.push(node.type);
    for (const k of Object.keys(node)) {
      if (k === 'type') continue;
      collectTypes(node[k], out);
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
function main() {
  const registered = discoverRegisteredElements();
  if (registered.size === 0) {
    console.error('❌ Could not discover any registered LCARdS custom elements in src/lcards.js — aborting.');
    process.exit(2);
  }

  if (!QUIET) {
    console.log('🔍 LCARdS Documentation YAML Validator');
    console.log(`   docs: ${path.relative(REPO_ROOT, DOC_ROOT)}`);
    console.log(`   registered LCARdS elements: ${[...registered].sort().join(', ')}`);
    console.log('');
  }

  const files = walkDocs(DOC_ROOT);
  let totalBlocks  = 0;
  let totalParsed  = 0;
  const errors     = [];
  const warnings   = [];

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const blocks = extractYamlBlocks(text, file);
    for (const b of blocks) {
      totalBlocks++;
      const rel = path.relative(REPO_ROOT, b.file);

      // Parse
      let parsed;
      try {
        parsed = yaml.load(b.content, { schema: yaml.JSON_SCHEMA });
        totalParsed++;
      } catch (e) {
        const entry = {
          file: rel, line: b.line,
          msg: `YAML parse error: ${e.message.split('\n')[0]}`,
        };
        if (STRICT) {
          errors.push(entry);
        } else {
          warnings.push(entry);
        }
        continue;
      }

      // Type checking
      const types = [];
      collectTypes(parsed, types);
      for (const t of types) {
        if (!t.startsWith('custom:lcards-')) continue;
        const tag = t.slice('custom:'.length);
        if (registered.has(tag)) continue;

        // Common typo: lcards-X-card / lcards-X — give specific guidance
        const candidates = [...registered].filter(r =>
          r === tag.replace(/-card$/, '') ||
          `${r}-card` === tag
        );
        const hint = candidates.length
          ? ` (did you mean: custom:${candidates[0]}?)`
          : '';
        errors.push({
          file: rel, line: b.line,
          msg: `Unknown LCARdS card type "${t}"${hint}`,
        });
      }

      if (VERBOSE) {
        console.log(`   ✓ ${rel}:${b.line} (${types.length} type fields)`);
      }
    }
  }

  // ── Report ────────────────────────────────────────────────────────────────
  if (!QUIET) {
    console.log(`Scanned ${files.length} markdown files; ${totalBlocks} YAML blocks; ${totalParsed} parsed OK.`);
  }

  if (warnings.length) {
    console.log('');
    console.log(`⚠️  ${warnings.length} warning(s):`);
    for (const w of warnings) console.log(`   ${w.file}:${w.line}  ${w.msg}`);
  }

  if (errors.length) {
    console.log('');
    console.log(`❌ ${errors.length} error(s):`);
    for (const e of errors) console.log(`   ${e.file}:${e.line}  ${e.msg}`);
    process.exit(1);
  }

  if (!QUIET) {
    console.log('');
    console.log('✅ All documentation YAML examples parsed and reference valid card types.');
  }
}

main();
