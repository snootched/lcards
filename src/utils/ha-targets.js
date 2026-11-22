/**
 * @fileoverview Home Assistant targets and labels, resolved from the registries in `hass`
 * (reports/ha-labels-plan.md, phase 1a).
 *
 * A target is Home Assistant's own object, `{ entity_id, device_id, area_id, floor_id,
 * label_id }`, each a string or a list. The registries come with every `hass`
 * (`hass.entities`, `hass.devices`, `hass.areas`, each entry with `labels`), so nothing
 * here calls Home Assistant except `fetchLabelRegistry`, which only the editor needs for
 * label names. Home Assistant replaces a registry object when it changes, so callers can
 * compare `registryKey(hass)` to know when to resolve again.
 */

/**
 * @typedef {{ entity_id?: string|string[], device_id?: string|string[], area_id?: string|string[],
 *   floor_id?: string|string[], label_id?: string|string[] }} Target
 * @typedef {{ id: string, from: 'entity'|'device'|'area' }} EntityLabel
 * @typedef {{ label_id: string, name: string, icon?: string|null, color?: string|null,
 *   description?: string|null }} LabelEntry
 */

/** A value as a list: nothing gives `[]`, one value `[value]`. */
const list = (/** @type {any} */ v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

/**
 * An entity's area: its own, else its device's.
 * @param {any} hass
 * @param {string} entityId
 * @returns {string|null}
 */
export function entityArea(hass, entityId) {
    const entry = hass?.entities?.[entityId];
    return entry?.area_id ?? (entry?.device_id ? hass?.devices?.[entry.device_id]?.area_id : null) ?? null;
}

/**
 * The entity ids a target names: entities directly; devices, areas (an entity's own
 * area or its device's), floors (their areas) and labels (on entities, devices or
 * areas) through the registries. Hidden and entity-category entities are left out
 * unless named directly, as Home Assistant's Entities section does. Entities without
 * a state are left out.
 * @param {any} hass
 * @param {Target|undefined|null} target
 * @returns {string[]}
 */
export function resolveTarget(hass, target) {
    if (!target) return [];
    const entities = hass?.entities ?? {};
    const devices = hass?.devices ?? {};
    const areas = hass?.areas ?? {};
    const states = hass?.states ?? {};
    const direct = new Set(list(target.entity_id));
    const deviceIds = new Set(list(target.device_id));
    const areaIds = new Set(list(target.area_id));
    const labelIds = new Set(list(target.label_id));
    for (const floor of list(target.floor_id)) {
        for (const a of Object.values(areas)) if (a?.floor_id === floor) areaIds.add(a.area_id);
    }
    if (labelIds.size) {
        for (const a of Object.values(areas)) if (list(a?.labels).some(l => labelIds.has(l))) areaIds.add(a.area_id);
        for (const d of Object.values(devices)) if (list(d?.labels).some(l => labelIds.has(l))) deviceIds.add(d.id);
    }
    const out = new Set([...direct].filter(id => id in states));
    for (const [id, entry] of Object.entries(entities)) {
        if (entry?.hidden || entry?.entity_category) continue;
        if (!(id in states)) continue;
        if ((entry?.device_id && deviceIds.has(entry.device_id))
            || areaIds.has(/** @type {string} */ (entityArea(hass, id)))
            || list(entry?.labels).some(l => labelIds.has(l))) out.add(id);
    }
    return [...out];
}

/**
 * The Home Assistant labels an entity carries: its own, its device's and its area's
 * (the entity's own area, else its device's), each once, marked with where it comes
 * from (the entity wins over the device, the device over the area). Unlike
 * `resolveTarget`, hidden and entity-category entities keep their labels: a card names
 * its entity directly.
 * @param {any} hass
 * @param {string|null|undefined} entityId
 * @returns {EntityLabel[]}
 */
export function labelsOf(hass, entityId) {
    if (!entityId) return [];
    const entry = hass?.entities?.[entityId];
    if (!entry) return [];
    /** @type {Map<string, EntityLabel['from']>} */
    const out = new Map();
    const add = (/** @type {any} */ labels, /** @type {EntityLabel['from']} */ from) => {
        for (const id of list(labels)) if (typeof id === 'string' && !out.has(id)) out.set(id, from);
    };
    add(entry.labels, 'entity');
    if (entry.device_id) add(hass?.devices?.[entry.device_id]?.labels, 'device');
    const area = entityArea(hass, entityId);
    if (area) add(hass?.areas?.[area]?.labels, 'area');
    return [...out].map(([id, from]) => ({ id, from }));
}

/**
 * Whether an entity carries a label, directly or through its device or area.
 * @param {any} hass
 * @param {string|null|undefined} entityId
 * @param {string} labelId
 */
export function hasLabel(hass, entityId, labelId) {
    return labelsOf(hass, entityId).some(l => l.id === labelId);
}

/**
 * The registry objects a target or a label resolves against. Home Assistant replaces
 * each one when its registry changes, so a different key means "resolve again".
 * @param {any} hass
 * @returns {[any, any, any]}
 */
export function registryKey(hass) {
    return [hass?.entities, hass?.devices, hass?.areas];
}

/**
 * Whether two `registryKey` results name the same registry objects.
 * @param {[any, any, any]|null|undefined} a
 * @param {[any, any, any]|null|undefined} b
 */
export function sameRegistries(a, b) {
    return !!a && !!b && a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

/** @type {Promise<Map<string, LabelEntry>>|null} */
let labelRegistry = null;

/**
 * Label names, icons and colours from Home Assistant's label registry
 * (`config/label_registry/list`, open to every user), fetched once and kept. Only the
 * editor needs it, to show names: matching always uses label ids. On failure it
 * resolves to an empty map (callers show ids alone) and the next call tries again.
 * @param {any} hass
 * @returns {Promise<Map<string, LabelEntry>>}
 */
export function fetchLabelRegistry(hass) {
    if (labelRegistry) return labelRegistry;
    const call = hass?.callWS ?? hass?.connection?.sendMessagePromise?.bind(hass.connection);
    if (typeof call !== 'function') return Promise.resolve(new Map());
    const pending = Promise.resolve()
        .then(() => call({ type: 'config/label_registry/list' }))
        .then((/** @type {any} */ entries) => new Map(list(entries).map((/** @type {LabelEntry} */ e) => [e.label_id, e])))
        .catch(() => {
            labelRegistry = null;
            return /** @type {Map<string, LabelEntry>} */ (new Map());
        });
    labelRegistry = pending;
    return pending;
}

/** Forget the fetched label registry (a label was created, renamed or deleted; tests). */
export function clearLabelRegistry() {
    labelRegistry = null;
}
