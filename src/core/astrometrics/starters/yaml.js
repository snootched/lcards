/**
 * @fileoverview A starter's config as YAML the way the docs write scenes: one
 * point, object or view per line when it fits, nested blocks when it does not.
 * Shared by the Studio's Starters tab and the generated starters page
 * (scripts/lib/astro-starters-doc.js), so both show the same text.
 */

import jsYaml from 'js-yaml';

/** Longest line kept in flow style */
const WIDTH = 130;

const isObj = (/** @type {any} */ v) => !!v && typeof v === 'object' && !Array.isArray(v);

/** One value in flow style, `{ id: sun, xyz: [0, 0, 0] }` */
function flow(/** @type {any} */ value) {
  if (Array.isArray(value)) return `[${value.map(flow).join(', ')}]`;
  if (isObj(value)) return Object.keys(value).length === 0 ? '{}' : `{ ${Object.entries(value).map(([k, v]) => `${scalar(k)}: ${flow(v)}`).join(', ')} }`;
  return scalar(value);
}

/** A scalar key or a plain string, quoted only when YAML needs it */
function scalar(/** @type {any} */ value) {
  const text = jsYaml.dump(value, { lineWidth: -1 }).trim();
  // a plain string with a comma or brackets would split a flow collection
  return typeof value === 'string' && !/^['"]/.test(text) && /[,[\]{}]/.test(value) ? JSON.stringify(value) : text;
}

/**
 * @param {any} value - an object or array
 * @param {string} pad
 * @returns {string[]}
 */
function block(value, pad) {
  /** @type {string[]} */
  const lines = [];
  if (Array.isArray(value)) {
    for (const item of value) {
      const one = `${pad}- ${flow(item)}`;
      if (!isObj(item) && !Array.isArray(item) || one.length <= WIDTH) { lines.push(one); continue; }
      const inner = block(item, `${pad}  `);
      lines.push(`${pad}- ${inner[0].trimStart()}`, ...inner.slice(1));
    }
    return lines;
  }
  for (const [key, v] of Object.entries(value)) {
    const head = `${pad}${scalar(key)}:`;
    const one = `${head} ${flow(v)}`;
    if ((!isObj(v) && !Array.isArray(v)) || one.length <= WIDTH || (Array.isArray(v) && !v.some((x) => isObj(x) || Array.isArray(x)))) {
      lines.push(one);
    } else {
      lines.push(head, ...block(v, `${pad}  `));
    }
  }
  return lines;
}

/**
 * A config (or the part of one a starter adds) as YAML.
 * @param {Record<string, any>} config
 */
export function starterYaml(config) {
  return `${block(config, '').join('\n')}\n`;
}
