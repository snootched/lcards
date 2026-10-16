// The config checker page's logic (ConfigChecker.vue), kept free of Vue and the DOM
// so tests/docs/config-checker.test.js runs it in node. It is the same checker as
// `npm run validate:config` / lcards-validate.mjs (scripts/lib/config-validator.js),
// with results grouped per card, in plainer words, with line numbers and docs links.
import jsYaml from 'js-yaml'
import { parseDocument, LineCounter } from 'yaml'
import { createConfigValidator, collectLcardsNodes } from '../../../scripts/lib/config-validator.js'
import { docsFor } from '../../../src/editor/utils/yaml-docs-links.js'

export { BROKEN_SAMPLE, FIXED_SAMPLE, SAMPLE_FIXES } from './config-checker-samples.js'

// Docs pages for tags docsFor() doesn't know by its short name.
const PAGE_FOR_TAG = {
  'lcards-msd-card': '/cards/msd/',
  'lcards-chart': '/cards/chart/',
  'lcards-data-grid': '/cards/data-grid/',
  'lcards-layout-view': '/cards/layout-view/',
  'lcards-layout-card': '/cards/layout-card/',
  'lcars-shell': '/cards/layout-view/',
}

/** 'a.b[0].c' -> ['a', 'b', 0, 'c'] */
export function splitPath(path) {
  if (!path || path === '(root)') return []
  return path.split(/\.|(?=\[)/).filter(Boolean).map(seg => (/^\[\d+\]$/.test(seg) ? Number(seg.slice(1, -1)) : seg))
}

/** Docs link (site-relative) for an option path of a card. */
export function docsLink(tag, path) {
  const short = tag === 'lcards-msd-card' ? 'msd' : tag
  const link = docsFor(short, splitPath(path))
  return link ?? PAGE_FOR_TAG[tag]
}

/**
 * One line per problem, in plain words. ajv reports a value that fits none of a
 * oneOf's branches several times (the branch check, each branch's own error);
 * keep the most specific one.
 * @param {{path: string, severity: string, code: string, message: string}[]} issues - one card's issues
 */
export function friendlyIssues(issues) {
  const meta = /^must match (exactly one|a) schema in (oneOf|anyOf)$/
  const schemaErrors = issues.filter(i => i.code === 'schema' && !meta.test(i.message))
  const out = []
  const seen = new Set()
  for (const issue of issues) {
    if (issue.code === 'schema') {
      if (meta.test(issue.message) && schemaErrors.some(o => o.path === issue.path || o.path.startsWith(issue.path + '.') || o.path.startsWith(issue.path + '['))) continue
      // "must be string" at a.b when a.b.c has its own error: the value was meant as the object form.
      if (/^must be /.test(issue.message) && schemaErrors.some(o => o.path.startsWith(issue.path + '.') || o.path.startsWith(issue.path + '['))) continue
    }
    const message = plainMessage(issue)
    const key = `${issue.path}\n${message}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ ...issue, message })
  }
  // Same path, several "must be X" lines -> one "must be X or Y".
  const merged = []
  for (const issue of out) {
    const prev = merged.find(m => m.path === issue.path && m.code === 'schema' && issue.code === 'schema' && /^should be /.test(m.message) && /^should be /.test(issue.message))
    // A number, or a string in a set format (sizes like 100px): one line for both.
    const typed = !prev && merged.find(m => m.path === issue.path && m.code === 'schema' && issue.code === 'schema'
      && /^should be /.test(m.message) && issue.message === 'not a valid value here.')
    if (prev) prev.message += ` or ${issue.message.replace(/^should be /, '')}`
    else if (typed) typed.message += ', or text in the expected format (see the docs).'
    else merged.push({ ...issue })
  }
  return merged
}

function plainMessage({ code, path, message }) {
  if (code === 'unknown-key') {
    const hint = / \(did you mean "([^"]+)"\?\)$/.exec(message)?.[1]
    return `not an LCARdS option${hint ? `: did you mean "${hint}"?` : '. Check the spelling, or that it belongs at this level.'}`
  }
  if (code === 'registry') return message.replace(/^unknown /, 'not a built-in ').replace(/ \(did you mean "([^"]+)"\?\)$/, ': did you mean "$1"?')
  if (code !== 'schema') return message
  if (message === 'must pass "pattern" keyword validation') {
    return /colou?r|background|border|fill|stroke/i.test(path)
      ? 'not a valid colour. Use a hex value, rgb(), var(--name), or a theme token with the theme: prefix (theme:colors.ui.primary).'
      : 'not a valid value here.'
  }
  const type = /^must be (string|number|integer|boolean|object|array|null)$/.exec(message)?.[1]
  if (type) return `should be ${{ string: 'text', number: 'a number', integer: 'a whole number', boolean: 'true or false', object: 'a group of options (key: value lines)', array: 'a list (- items)', null: 'empty' }[type]}`
  const allowed = /^must be equal to one of the allowed values$/.test(message)
  if (allowed) return 'not one of the allowed values.'
  return message
}

/**
 * @param {{ entries: {tag: string, schema: object}[], registries?: object|null }} opts
 *   entries: getSchemaEntries() (scripts/lib/card-schemas.js); registries: schema/registries.json
 */
export function createChecker({ entries, registries = null }) {
  const validator = createConfigValidator({ entries, registries })

  /**
   * @param {string} text - YAML: a card, a view or a whole dashboard
   * @returns {{ parseError: {message: string, line: number|null}|null,
   *   cards: {path: string, tag: string, line: number|null, docs: string|undefined,
   *     issues: {path: string, severity: string, code: string, message: string, line: number|null, docs: string|undefined}[]}[],
   *   errors: number, warnings: number }}
   */
  function check(text) {
    const empty = { parseError: null, cards: [], errors: 0, warnings: 0 }
    let config
    try {
      config = jsYaml.load(text)
    } catch (err) {
      return { ...empty, parseError: { message: err.reason || err.message, line: err.mark ? err.mark.line + 1 : null } }
    }
    if (config == null) return empty

    const lines = new LineCounter()
    const doc = parseDocument(text, { lineCounter: lines })
    const lineOf = (pathArr) => {
      if (!pathArr.length) return 1
      const parent = pathArr.length > 1 ? doc.getIn(pathArr.slice(0, -1), true) : doc.contents
      const last = pathArr[pathArr.length - 1]
      const pair = parent?.items?.find?.(item => item?.key?.value === last)
      const node = pair?.key ?? (typeof last === 'number' ? parent?.items?.[last] : null)
      return node?.range ? lines.linePos(node.range[0]).line : null
    }

    const cards = collectLcardsNodes(config).map(({ node, path, tag }) => {
      const base = splitPath(path)
      const issues = friendlyIssues(validator.validateNode(node, tag, '')).map(issue => ({
        ...issue,
        line: lineOf([...base, ...splitPath(issue.path)]),
        docs: docsLink(tag, issue.path),
      }))
      return { path: path || '(root)', tag, line: base.length ? lineOf(base) : 1, docs: PAGE_FOR_TAG[tag] ?? docsLink(tag, ''), issues }
    })
    const all = cards.flatMap(c => c.issues)
    return {
      parseError: null,
      cards,
      errors: all.filter(i => i.severity === 'error').length,
      warnings: all.filter(i => i.severity === 'warning').length,
    }
  }

  return { check }
}
