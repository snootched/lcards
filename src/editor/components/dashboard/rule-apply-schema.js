/**
 * @fileoverview The schema the rule editor's Apply YAML is checked and completed
 * against: the rules schema's `apply`, with `overlays` filled in from the page.
 * Each overlay on the page becomes a key whose patch completes against its own
 * card's schema (a patch is a partial card config), so `my_button:` offers
 * `style`, `text`, `icon`, ... with their docs.
 *
 * @module editor/components/dashboard/rule-apply-schema
 */

import { rulesSchema } from '../../../cards/schemas/common-schemas.js';

/** Card-level keys a rule can't patch. */
const NOT_PATCHABLE = new Set(['type', 'id', 'tags', 'rules', 'data_sources', 'grid_options', 'view_layout', 'visibility']);

/** A copy of a schema with every `required` dropped (a patch sets only what it changes). */
function withoutRequired(node) {
    if (Array.isArray(node)) return node.map(withoutRequired);
    if (!node || typeof node !== 'object') return node;
    const out = {};
    for (const [k, v] of Object.entries(node)) {
        if (k === 'required' && Array.isArray(v)) continue;
        out[k] = withoutRequired(v);
    }
    return out;
}

/**
 * A patch for one card type: its schema's top-level properties, all optional.
 * @param {Object|null} cardSchema
 * @param {string} description
 */
function patchSchema(cardSchema, description) {
    if (!cardSchema?.properties) return { type: 'object', description, additionalProperties: true };
    const properties = Object.fromEntries(Object.entries(cardSchema.properties).filter(([k]) => !NOT_PATCHABLE.has(k)));
    return { type: 'object', description, properties: withoutRequired(properties), additionalProperties: true };
}

/**
 * @param {Object} opts
 * @param {Array<{id: string, type?: string, tags?: string[]}>} [opts.overlays] - Rule targets on the page
 *   (systemsManager.getAllTargetableOverlays())
 * @param {{id?: string, type?: string}} [opts.card] - The card being edited (it may not be on the page yet)
 * @param {(type: string) => (Object|null)} [opts.getCardSchema] - configManager.getCardSchema
 * @returns {Object} JSON Schema for a rule's `apply`
 */
export function ruleApplySchema({ overlays = [], card = {}, getCardSchema = () => null } = {}) {
    const apply = rulesSchema.items.properties.apply;
    const targets = new Map(overlays.filter(o => o?.id).map(o => [o.id, o]));
    if (card.id && !targets.has(card.id)) targets.set(card.id, { id: card.id, type: card.type });

    const byType = new Map();
    const patchFor = (type) => {
        const key = type || 'unknown';
        if (!byType.has(key)) byType.set(key, getCardSchema(key));
        return byType.get(key);
    };

    const properties = {};
    for (const { id, type } of targets.values()) {
        const label = type && type !== 'unknown' ? `${type} card` : 'overlay';
        properties[id] = patchSchema(patchFor(type), `Changes to ${id} (${label}) while the rule matches`);
    }
    // Selectors: one patch for many targets (any card type, so no completion inside).
    properties.all = { type: 'object', description: 'Changes to every overlay on the page (minus exclude)', additionalProperties: true };
    properties.exclude = { type: 'array', items: { type: 'string', enum: [...targets.keys()] }, description: 'Overlay IDs the all/type:/tag:/pattern: selectors skip' };

    const tags = [...new Set(overlays.flatMap(o => o.tags ?? []))];
    const ids = [...targets.keys()];
    const animationItem = apply.properties.animations.items;

    return {
        ...apply,
        properties: {
            ...apply.properties,
            overlays: {
                ...apply.properties.overlays,
                description: 'What to change, per overlay ID, or per selector: type:<card type>, tag:<tag>, pattern:<regex>',
                properties,
                additionalProperties: { type: 'object', description: 'Changes for a type:, tag: or pattern: selector', additionalProperties: true },
            },
            animations: {
                ...apply.properties.animations,
                items: {
                    ...animationItem,
                    properties: {
                        ...animationItem.properties,
                        overlay: { ...animationItem.properties.overlay, ...(ids.length ? { examples: ids } : {}) },
                        tag: { ...animationItem.properties.tag, ...(tags.length ? { examples: tags } : {}) },
                    },
                },
            },
        },
    };
}

/**
 * A whole rule (id, when, apply, ...) with ruleApplySchema() as its `apply`.
 * @param {Parameters<typeof ruleApplySchema>[0]} [opts]
 * @returns {Object} JSON Schema for one rule
 */
export function ruleSchema(opts) {
    const rule = rulesSchema.items;
    return { ...rule, properties: { ...rule.properties, apply: ruleApplySchema(opts) } };
}

/** 'custom:lcards-button' → 'button' (the name cards register their schema and overlays under). */
export const cardTypeOf = (config) => String(config?.type ?? '').replace(/^custom:lcards-/, '');

/**
 * ruleApplySchema() / ruleSchema() options for the page the editor is on.
 * @param {any} editor - The card's LCARdSBaseEditor
 */
export function pageSchemaOptions(editor) {
    const core = window.lcards?.core;
    const config = editor?.config ?? {};
    let overlays = [];
    try {
        overlays = core?.systemsManager?.getAllTargetableOverlays?.() ?? [];
    } catch { /* no systems manager yet */ }
    return {
        overlays,
        card: { id: config.id, type: cardTypeOf(config) },
        getCardSchema: (type) => core?.configManager?.getCardSchema?.(type) ?? null,
    };
}
