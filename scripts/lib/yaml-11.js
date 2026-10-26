/**
 * Where a YAML text means something else in Home Assistant's code editor.
 *
 * Home Assistant's code editor (card dialogs, the raw dashboard editor) reads
 * YAML 1.1 since Home Assistant 2026.8 (frontend 20260729, js-yaml 5 with
 * YAML11_SCHEMA): unquoted on, off, y, n, yes, no (any case) are booleans
 * there, so `y: 20` arrives as `true: 20` and `label: N` as `label: false`.
 * LCARdS, the docs and the checker read YAML 1.2. Used by the config checker
 * (a warning per place) and the docs tests (every example must agree).
 *
 * @module scripts/lib/yaml-11
 */
import YAML from 'yaml';

/** Home Assistant's own tags (!secret, !include, ...): read the same both ways */
const anyTag = (/** @type {string} */ tag) => ({ tag, resolve: (/** @type {any} */ v) => v });
const HA_TAGS = ['!include', '!include_dir_list', '!include_dir_named', '!include_dir_merge_list', '!include_dir_merge_named', '!secret', '!env_var', '!input'];
const customTags = HA_TAGS.map(anyTag);

/**
 * @param {string} text
 * @param {'1.1' | '1.2'} version
 */
const parse = (text, version) => YAML.parse(text, { version, ...(version === '1.2' ? { schema: 'core' } : {}), customTags, logLevel: 'silent' });

/** `views[0].cards[2].text.y` style path */
const join = (/** @type {string} */ at, /** @type {string} */ key) => (/^\d+$/.test(key) ? `${at}[${key}]` : at ? `${at}.${key}` : key);

/**
 * @param {any} a - the YAML 1.2 reading
 * @param {any} b - the YAML 1.1 reading
 * @param {string} at
 * @returns {{ path: string, yaml12: any, yaml11: any }[]}
 */
function differences(a, b, at = '') {
  if (JSON.stringify(a) === JSON.stringify(b)) return [];
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    // A key that became true/false: report it once, under its 1.2 name
    const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
    /** @type {{ path: string, yaml12: any, yaml11: any }[]} */
    const out = [];
    for (const k of keys) {
      if (!(k in a) && (k === 'true' || k === 'false')) continue;
      if (!(k in b) && Array.isArray(a) === false) {
        out.push({ path: join(at, k), yaml12: `key "${k}"`, yaml11: 'key "true" or "false"' });
        continue;
      }
      out.push(...differences(a[k], b[k], join(at, k)));
    }
    return out;
  }
  return [{ path: at || '(root)', yaml12: a, yaml11: b }];
}

/**
 * Where the text reads differently as YAML 1.1 (Home Assistant's code editor)
 * than as YAML 1.2; empty when it reads the same, or does not parse.
 * @param {string} text
 * @returns {{ path: string, yaml12: any, yaml11: any }[]}
 */
export function yaml11Differences(text) {
  let a;
  let b;
  try {
    a = parse(text, '1.2');
    b = parse(text, '1.1');
  } catch {
    return [];
  }
  return differences(a, b);
}

/**
 * The checker's message for one difference.
 * @param {{ path: string, yaml12: any, yaml11: any }} d
 */
export function yaml11Message(d) {
  if (typeof d.yaml12 === 'string' && d.yaml12.startsWith('key ')) {
    return `Home Assistant's code editor reads this ${d.yaml12} as true or false: quote it ("${d.yaml12.slice(5, -1)}": ...)`;
  }
  return `Home Assistant's code editor reads ${JSON.stringify(d.yaml12)} here as ${JSON.stringify(d.yaml11)}: quote the value`;
}
