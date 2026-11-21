/**
 * @fileoverview An editor-shaped adapter over a plain value, so the shared
 * card-editor controls (FormField, lcards-text-field-editor, the colour and
 * padding editors, which read and write through a host editor) can edit a
 * part of the Astrometrics Studio's working config (tests/editor/astro-studio-clock.test.js).
 *
 * Paths are dot paths inside the value (`default.font_size`,
 * `styles.major.color.default`); the schema is walked through `properties`
 * and `additionalProperties` (label styles by name). Every change makes a
 * new value (empty objects pruned) and hands it to `onChange`.
 *
 * @module editor/dialogs/astro-studio/text-adapter
 */

const isObj = (/** @type {any} */ v) => !!v && typeof v === 'object' && !Array.isArray(v);
const empty = (/** @type {any} */ v) => v === undefined || v === null || v === '' || (isObj(v) && Object.keys(v).length === 0);

/**
 * `obj` with the value at `keys` set (removed when empty, and parents left
 * empty by it removed too). A new object.
 * @param {Record<string, any>} obj
 * @param {string[]} keys
 * @param {any} value
 * @returns {Record<string, any>}
 */
export function setPath(obj, keys, value) {
  const [head, ...rest] = keys;
  const next = { ...(isObj(obj) ? obj : {}) };
  const v = rest.length ? setPath(next[head], rest, value) : value;
  if (empty(v)) delete next[head];
  else next[head] = v;
  return next;
}

/**
 * The schema at a dot path: through properties, then additionalProperties.
 * @param {any} schema
 * @param {string} path
 * @returns {any}
 */
export function schemaAt(schema, path) {
  let s = schema;
  for (const key of String(path).split('.')) {
    if (!isObj(s)) return null;
    if (isObj(s.properties) && s.properties[key]) s = s.properties[key];
    else if (isObj(s.additionalProperties)) s = s.additionalProperties;
    else return null;
  }
  return s ?? null;
}

/**
 * @typedef {{ hass: any, config: Record<string, any>, _getSchemaForPath: (path: string) => any,
 *   _getConfigValue: (path: string) => any, _setConfigValue: (path: string, v: any) => void, requestUpdate: () => void }} ValueEditor
 */

/**
 * An editor over a value.
 * @param {{ hass: any, schema: any, value: Record<string, any>, onChange: (v: Record<string, any>) => void }} opts
 * @returns {ValueEditor}
 */
export function valueEditor({ hass, schema, value, onChange }) {
  /** @type {ValueEditor} */
  const editor = {
    hass,
    config: isObj(value) ? value : {},
    /** @param {string} path */
    _getSchemaForPath: (path) => schemaAt(schema, path),
    /** @param {string} path */
    _getConfigValue: (path) => String(path).split('.').reduce((/** @type {any} */ o, k) => (o == null ? undefined : o[k]), editor.config),
    /** @param {string} path @param {any} v */
    _setConfigValue: (path, v) => {
      editor.config = setPath(editor.config, String(path).split('.'), v);
      onChange(editor.config);
    },
    requestUpdate: () => {}
  };
  return editor;
}
