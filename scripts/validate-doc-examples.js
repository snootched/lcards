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
 *   3. For blocks that parse successfully AND whose top-level (or nested)
 *      `type:` maps to a known card, the parsed config is validated against
 *      the card's real JSON Schema (from `src/cards/schemas/*.js`). Schema
 *      issues are reported separately from parse issues (see output sections).
 *      lcards-msd-card and lcards-config-panel are excluded (no Node-importable
 *      schema or schema excluded from v1).
 *   4. The validator recognises two opt-out meta hints on the opening fence:
 *
 *      • ` ```yaml no-validate `  — skip the block entirely (YAML parse AND
 *        type-ref checks). Use this for intentionally wrong/invalid examples
 *        that illustrate "❌ Wrong" anti-patterns.
 *
 *      • ` ```yaml alternatives `  — skip YAML parsing (the block contains
 *        duplicate keys to show multiple valid option values, e.g. several
 *        `color:` lines back-to-back), but still regex-scan the raw text for
 *        `custom:lcards-*` type references and validate them. Use this for
 *        snippet-style blocks that are not standalone YAML documents but whose
 *        card type references should still be checked.
 *
 * Usage:
 *   node scripts/validate-doc-examples.js              # validate
 *   node scripts/validate-doc-examples.js --verbose    # list every block
 *   node scripts/validate-doc-examples.js --quiet      # only print summary / errors
 *   node scripts/validate-doc-examples.js --strict     # parse errors are fatal too
 *
 * Default mode: any block whose `type:` references an unknown LCARdS custom
 * element fails the build (these are real bugs that would break the user's
 * dashboard). Parse failures are reported as warnings (separate section from
 * schema warnings). Add ` ```yaml alternatives ` for snippet-style blocks with
 * duplicate keys (parse skipped, type refs still checked), or
 * ` ```yaml no-validate ` to opt a block out entirely.
 *
 * `--strict` promotes both parse AND schema warnings to errors.
 *
 * Output sections (only shown when non-empty):
 *   ⚠️  N parse warning(s)   — YAML syntax / duplicate key failures
 *   ⚠️  N schema warning(s)  — JSON Schema constraint violations
 *   ❌  N error(s)            — unknown card types (always fatal)
 */

// ── Schema factory imports (Node-compatible; no browser deps) ─────────────────
// These are imported at the module level so Node resolves the ESM graph once.
import { getButtonSchema }       from '../src/cards/schemas/button-schema.js';
import { getSliderSchema }       from '../src/cards/schemas/slider-schema.js';
import { getElbowSchema }        from '../src/cards/schemas/elbow-schema.js';
import { getChartSchema }        from '../src/cards/schemas/chart-schema.js';
import { dataGridSchema }        from '../src/cards/schemas/data-grid-schema.js';
import { getAlertOverlaySchema } from '../src/cards/schemas/lcards-alert-overlay-schema.js';
import { getSelectMenuSchema }   from '../src/cards/schemas/select-menu-schema.js';
import Ajv                       from 'ajv';

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

// ── Build compiled card schema validators ────────────────────────────────────
// Strip `additionalProperties: false` and the LCARdS-specific `'warn'` value
// (to avoid noise from partial examples; ajv@8 only accepts boolean/schema-object,
// so `'warn'` — a valid CoreValidationService value, not standard JSON Schema —
// would otherwise fail schema compilation entirely) and any dangling `$ref` nodes
// (button + elbow have an unresolvable
// `$ref: '#/$defs/stateColorSchema'` — ajv@8 would throw on it).
// Also strip empty `enum: []` arrays — these arise when schema factories are
// called without preset options, and ajv@8 rejects them as invalid schemas.
//
// Special case for oneOf/anyOf/allOf: when stripping a `$ref` leaves an item
// that is an empty object `{}`, that item is removed from the combination array.
// An empty `{}` schema matches everything and would make `oneOf` always fail
// for values that also satisfy the sibling branch.
function stripSchemaRestrictions(node) {
  if (Array.isArray(node)) return node.map(stripSchemaRestrictions);
  if (node && typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) {
      if (k === 'additionalProperties' && (v === false || v === 'warn')) continue;
      if (k === '$ref') continue;
      if (k === 'enum' && Array.isArray(v) && v.length === 0) continue;
      if ((k === 'oneOf' || k === 'anyOf' || k === 'allOf') && Array.isArray(v)) {
        // After stripping, remove any items that became empty objects (were $ref-only).
        const stripped = v
          .map(stripSchemaRestrictions)
          .filter(item => !(item && typeof item === 'object' && !Array.isArray(item) && Object.keys(item).length === 0));
        if (stripped.length > 0) out[k] = stripped;
        continue;
      }
      out[k] = stripSchemaRestrictions(v);
    }
    return out;
  }
  return node;
}

function buildCardValidators() {
  // validateFormats: false — silences warnings about HA-specific formats
  // (entity, font-family, color) that ajv does not know about.
  const ajv = new Ajv({ allErrors: true, strict: false, validateFormats: false });
  const rawSchemas = [
    ['lcards-button',        getButtonSchema({})],
    ['lcards-slider',        getSliderSchema({})],
    ['lcards-elbow',         getElbowSchema({})],
    ['lcards-chart',         getChartSchema({})],
    ['lcards-data-grid',     dataGridSchema],
    ['lcards-alert-overlay', getAlertOverlaySchema()],
    ['lcards-select-menu',   getSelectMenuSchema({})],
  ];
  const validators = new Map();
  for (const [tag, schema] of rawSchemas) {
    try {
      const stripped = stripSchemaRestrictions(schema);
      validators.set(tag, ajv.compile(stripped));
    } catch (e) {
      // Non-fatal: skip this card's schema validation and warn at startup
      console.warn(`⚠️  Could not compile schema for ${tag}: ${e.message}`);
    }
  }
  return validators;
}

// ── Collect card nodes from parsed YAML for schema validation ─────────────────
// Recursively finds every object that has a `type: custom:lcards-*` key,
// including cards nested inside `cards:` arrays.
function collectCardNodes(node, out = []) {
  if (Array.isArray(node)) {
    for (const item of node) collectCardNodes(item, out);
  } else if (node && typeof node === 'object') {
    if (typeof node.type === 'string' && node.type.startsWith('custom:lcards-')) {
      out.push(node);
    }
    for (const v of Object.values(node)) collectCardNodes(v, out);
  }
  return out;
}

// ── Extract fenced YAML blocks ───────────────────────────────────────────────
// Matches ```yaml … ``` and ```yml … ``` and the meta hints `no-validate` /
// `alternatives`.
const FENCE_RE = /^([ \t]*)```([a-zA-Z0-9_-]+)([^\n]*)\n([\s\S]*?)\n\1```/gm;

function extractYamlBlocks(text, file) {
  const blocks = [];
  let m;
  while ((m = FENCE_RE.exec(text)) !== null) {
    const lang = m[2].toLowerCase();
    if (lang !== 'yaml' && lang !== 'yml') continue;
    const meta = (m[3] || '').trim();
    // `no-validate` — skip entirely (intentionally wrong anti-pattern examples)
    if (/\bno-validate\b/.test(meta)) continue;
    // Compute 1-based line number of the opening fence
    const before = text.slice(0, m.index);
    const line = before.split('\n').length;
    // `alternatives` — snippet-style blocks with duplicate keys; skip YAML parse
    // but still run type-ref checks on raw text.
    const skipParse = /\balternatives\b/.test(meta);
    blocks.push({ file, line, meta, content: m[4], skipParse });
  }
  return blocks;
}

// ── Extract `custom:lcards-*` type refs from raw text (no YAML parse) ────────
const TYPE_REF_RE = /\btype\s*:\s*(custom:lcards-[a-z0-9-]+)/g;

function extractTypeRefsFromRaw(content) {
  const types = [];
  let m;
  while ((m = TYPE_REF_RE.exec(content)) !== null) types.push(m[1]);
  return types;
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

  const cardValidators = buildCardValidators();

  if (!QUIET) {
    console.log('🔍 LCARdS Documentation YAML Validator');
    console.log(`   docs: ${path.relative(REPO_ROOT, DOC_ROOT)}`);
    console.log(`   registered LCARdS elements: ${[...registered].sort().join(', ')}`);
    console.log(`   schema validators loaded: ${[...cardValidators.keys()].sort().join(', ')}`);
    console.log('');
  }

  const files = walkDocs(DOC_ROOT);
  let totalBlocks         = 0;
  let totalParsed         = 0;
  let totalAlternatives   = 0;
  let totalSchemaChecked  = 0;
  const errors            = [];   // always fatal (unknown card type)
  const parseWarnings     = [];   // YAML parse failures
  const schemaWarnings    = [];   // JSON Schema violations

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const blocks = extractYamlBlocks(text, file);
    for (const b of blocks) {
      totalBlocks++;
      const rel = path.relative(REPO_ROOT, b.file);

      // ── alternatives blocks: skip YAML parse, regex-check type refs ────────
      if (b.skipParse) {
        totalAlternatives++;
        const types = extractTypeRefsFromRaw(b.content);
        for (const t of types) {
          const tag = t.slice('custom:'.length);
          if (registered.has(tag)) continue;
          const candidates = [...registered].filter(r =>
            r === tag.replace(/-card$/, '') ||
            `${r}-card` === tag
          );
          const hint = candidates.length
            ? ` (did you mean: custom:${candidates[0]}?)`
            : '';
          errors.push({
            file: rel, line: b.line,
            msg: `Unknown LCARdS card type "${t}"${hint} [alternatives block]`,
          });
        }
        if (VERBOSE) {
          console.log(`   ~ ${rel}:${b.line} (alternatives; ${types.length} type refs checked without parse)`);
        }
        continue;
      }

      // ── ordinary blocks: parse YAML, then walk the tree ────────────────────
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
          parseWarnings.push(entry);
        }
        continue;
      }

      // ── Type-existence check ──────────────────────────────────────────────
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

      // ── Schema validation ─────────────────────────────────────────────────
      // Find every card node (top-level or nested) and validate against its
      // JSON Schema if we have a compiled validator for that card type.
      const cardNodes = collectCardNodes(parsed);
      let blockSchemaIssues = 0;
      for (const cardNode of cardNodes) {
        const tag = cardNode.type.slice('custom:'.length); // e.g. 'lcards-button'
        const validate = cardValidators.get(tag);
        if (!validate) continue; // msd-card, config-panel, or unknown — skip
        totalSchemaChecked++;
        const valid = validate(cardNode);
        if (!valid) {
          for (const err of (validate.errors || [])) {
            const loc = err.instancePath ? err.instancePath : '(root)';
            const entry = {
              file: rel, line: b.line,
              msg: `Schema [${tag}] ${loc}: ${err.message}`,
            };
            if (STRICT) {
              errors.push(entry);
            } else {
              schemaWarnings.push(entry);
            }
            blockSchemaIssues++;
          }
        }
      }

      if (VERBOSE) {
        const schemaNote = cardNodes.length
          ? blockSchemaIssues
            ? ` ✗ schema (${blockSchemaIssues} issue${blockSchemaIssues > 1 ? 's' : ''})`
            : ` ✓ schema`
          : '';
        console.log(`   ✓ ${rel}:${b.line} (${types.length} type fields${schemaNote})`);
      }
    }
  }

  // ── Report ────────────────────────────────────────────────────────────────
  if (!QUIET) {
    const altNote    = totalAlternatives  ? `; ${totalAlternatives} alternatives (parse skipped, type refs checked)` : '';
    const schemaNote = totalSchemaChecked ? `; ${totalSchemaChecked} schema-checked` : '';
    console.log(`Scanned ${files.length} markdown files; ${totalBlocks} YAML blocks; ${totalParsed} parsed OK${altNote}${schemaNote}.`);
  }

  if (parseWarnings.length) {
    console.log('');
    console.log(`⚠️  ${parseWarnings.length} parse warning(s):`);
    for (const w of parseWarnings) console.log(`   ${w.file}:${w.line}  ${w.msg}`);
  }

  if (schemaWarnings.length) {
    console.log('');
    console.log(`⚠️  ${schemaWarnings.length} schema warning(s):`);
    for (const w of schemaWarnings) console.log(`   ${w.file}:${w.line}  ${w.msg}`);
  }

  if (errors.length) {
    console.log('');
    console.log(`❌ ${errors.length} error(s):`);
    for (const e of errors) console.log(`   ${e.file}:${e.line}  ${e.msg}`);
    process.exit(1);
  }

  if (!QUIET) {
    const allClear = !parseWarnings.length && !schemaWarnings.length;
    console.log('');
    if (allClear) {
      console.log('✅ All documentation YAML examples parsed and validated successfully.');
    } else {
      console.log('✅ No fatal errors. Run with --strict to promote warnings to errors.');
    }
  }
}

main();
