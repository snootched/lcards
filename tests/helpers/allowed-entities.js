/**
 * Entity ids in dashboard YAML that is pushed to the dev Home Assistant (the
 * dashboard gallery, the demo dashboard). The dev HA's other entities carry
 * personal names, so these may use only the lcards_test_* helpers plus a few
 * named entities each caller allows.
 */
const ENTITY = /(?<![.\w])(input_boolean|input_number|input_select|input_text|sensor|binary_sensor|light|switch|lock|camera|climate|media_player|cover|fan|alarm_control_panel|sun|zone|person|device_tracker)\.([a-z0-9_]+)/g;
/** Service calls in the YAML look like entity ids; these are services, not entities. */
const SERVICES = new Set(['increment', 'decrement', 'set_value', 'select_option', 'toggle', 'turn_on', 'turn_off']);

/**
 * The entity ids in `text` that are neither lcards_test_* helpers nor in `allowed`.
 * @param {string} text
 * @param {Iterable<string>} allowed  full entity ids
 * @returns {string[]}
 */
export function disallowedEntities(text, allowed = []) {
    const ok = new Set(allowed);
    const used = [...text.matchAll(ENTITY)].filter(([, , id]) => !SERVICES.has(id)).map(m => m[0]);
    return [...new Set(used.filter(id => !id.split('.')[1].startsWith('lcards_test_') && !ok.has(id)))];
}
