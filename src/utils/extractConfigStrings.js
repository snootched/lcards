/**
 * Recursively collect every string value from a config object.
 * Skips the `type` key (card type identifier, e.g. 'custom:lcards-button' —
 * never an entity reference).
 *
 * Shared between LCARdSCard's own entity-tracking (`_updateTrackedEntities`)
 * and MsdControlsRenderer's control-overlay entity harvesting
 * (`_extractControlEntities`) — both need to scan arbitrary config shapes for
 * Jinja2 template / plain entity-ID strings without enumerating every
 * possible field name.
 *
 * @param {*} node - Config node (object, array, or scalar)
 * @param {Set<string>} [out] - Accumulator set
 * @returns {Set<string>} Collected string values
 */
export function extractAllConfigStrings(node, out = new Set()) {
  if (!node || typeof node !== 'object') {
    if (typeof node === 'string') out.add(node);
    return out;
  }
  if (Array.isArray(node)) {
    node.forEach(item => extractAllConfigStrings(item, out));
    return out;
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === 'type') continue;
    extractAllConfigStrings(value, out);
  }
  return out;
}
