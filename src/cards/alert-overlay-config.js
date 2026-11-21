/**
 * @fileoverview What the alert overlay shows for a condition, from its config:
 * the content card (custom content, or the built-in alert symbol with the
 * alert_button overrides), the display (overlay or band), the content size and
 * the screen effect layers.
 *
 * Pure functions, shared by the card (lcards-alert-overlay.js), which shows
 * the result on the real screen, and the Alert Studio's mock screen
 * (editor/components/alert-overlay/lcards-alert-preview.js), which shows it
 * without raising an alert.
 *
 * @module cards/alert-overlay-config
 */

import { parseColor } from '../core/themes/color-syntax.js';
import { HATemplateEvaluator } from '../core/templates/HATemplateEvaluator.js';
import { lcardsLog } from '../utils/lcards-logging.js';
import { resolveBandConfig, bandSpeed, EMBLEM_SWEEP_MS } from './alert-band-layout.js';

/** The alert conditions, in the order the editor and the studio list them. */
export const ALERT_CONDITION_KEYS = Object.freeze(['red_alert', 'yellow_alert', 'blue_alert', 'black_alert', 'gray_alert']);

/**
 * Per-condition built-in defaults: the floor values; alert_button overrides
 * are applied on top.
 */
export const CONDITION_DEFAULTS = Object.freeze({
    red_alert:    { preset: 'condition_red',    alertText: 'ALERT', subText: 'CONDITION: RED' },
    yellow_alert: { preset: 'condition_yellow', alertText: 'ALERT', subText: 'CONDITION: YELLOW' },
    blue_alert:   { preset: 'condition_blue',   alertText: 'ALERT', subText: 'CONDITION: BLUE' },
    black_alert:  { preset: 'condition_black',  alertText: 'ALERT', subText: 'CONDITION: BLACK' },
    gray_alert:   { preset: 'condition_gray',   alertText: 'ALERT', subText: 'CONDITION: GRAY' },
});

// Content size when the config sets none: a share of the screen (the overlay covers
// the whole viewport, so % is of its width and height). The built-in alert symbol
// gets a box it scales to fit; a custom content card keeps its own height.
export const DEFAULT_CONTENT_WIDTH  = '60%';
export const DEFAULT_SYMBOL_HEIGHT  = '50%';

/**
 * Presentation for a condition: `overlay` (backdrop + symbol, modal) or `band`
 * (dashes across the screen, the dashboard stays usable).
 * @param {any} config - Card config
 * @param {string} condition - e.g. 'red_alert'
 * @returns {'overlay'|'band'}
 */
export function displayFor(config, condition) {
    const display = config?.conditions?.[condition]?.display ?? config?.display;
    return display === 'band' ? 'band' : 'overlay';
}

/**
 * The overlay content's size for a condition: per-condition values, then the
 * card's, then the defaults above. A width set without a height leaves the height
 * to the content (the alert symbol keeps its aspect ratio from the width).
 * @param {any} config - Card config
 * @param {string} condition - Active condition, e.g. 'red_alert'
 * @returns {{width: string, height: string}}
 */
export function overlayContentSize(config, condition) {
    const perCond = config?.conditions?.[condition];
    const width  = perCond?.width  ?? config?.width;
    const height = perCond?.height ?? config?.height;
    // A custom card keeps its own height; the alert symbol as content (Start from the
    // alert symbol in the Alert Studio) sizes like the built-in one.
    const content = perCond?.content;
    const customContent = !!content && !(content.type === 'custom:lcards-button' && content.component === 'alert');
    return {
        width:  width ?? DEFAULT_CONTENT_WIDTH,
        height: height ?? (width || customContent ? 'auto' : DEFAULT_SYMBOL_HEIGHT),
    };
}

/**
 * Where the overlay content sits (card value, per-condition override).
 * @param {any} config
 * @param {string} condition
 * @returns {string}
 */
export function overlayPosition(config, condition) {
    return config?.conditions?.[condition]?.position ?? config?.position ?? 'center';
}

/**
 * Keys of `alert_button` that are not applied: the symbol is always the alert
 * component of lcards-button, and each condition keeps its own preset (its colours).
 */
export const ALERT_BUTTON_FIXED_KEYS = Object.freeze(['type', 'component', 'preset']);

/** @param {any} v */
const isPlainObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * Deep merge for config patches: plain objects merge key by key, anything else
 * (arrays included) replaces. Returns a new object; the inputs are not changed.
 * @param {any} base
 * @param {any} patch
 * @returns {any}
 */
export function mergePatch(base, patch) {
    if (!isPlainObject(patch)) return patch === undefined ? base : patch;
    /** @type {Record<string, any>} */
    const out = isPlainObject(base) ? { ...base } : {};
    for (const [key, value] of Object.entries(patch)) {
        if (value === undefined) continue;
        out[key] = isPlainObject(value) && isPlainObject(out[key]) ? mergePatch(out[key], value) : value;
    }
    return out;
}

/**
 * What `value` changes on `base`, as a patch (mergePatch(base, diff) gives value
 * back for every key value has). Objects compare key by key, anything else whole.
 * @param {any} value
 * @param {any} base
 * @returns {any} undefined when nothing differs
 */
export function patchDiff(value, base) {
    if (!isPlainObject(value)) return JSON.stringify(value) === JSON.stringify(base) ? undefined : value;
    /** @type {Record<string, any>} */
    const out = {};
    for (const [key, v] of Object.entries(value)) {
        const d = patchDiff(v, isPlainObject(base) ? base[key] : undefined);
        if (d !== undefined) out[key] = d;
    }
    return Object.keys(out).length ? out : undefined;
}

/**
 * The built-in alert symbol for a condition: the alert component of lcards-button
 * with the condition's preset and default text.
 * @param {string} condition
 * @returns {any|null} null for an unknown condition
 */
export function builtInSymbol(condition) {
    const def = /** @type {any} */ (CONDITION_DEFAULTS)[condition];
    if (!def) return null;
    return {
        type:      'custom:lcards-button',
        component: 'alert',
        preset:    def.preset,
        text: {
            alert_text: { content: def.alertText },
            sub_text:   { content: def.subText },
        },
    };
}

/**
 * The alert_button patch for a condition: the card's (every condition), then the
 * condition's over it; the fixed keys left out.
 * @param {any} config
 * @param {string} condition
 * @returns {Record<string, any>}
 */
export function symbolPatch(config, condition) {
    const merged = mergePatch(config?.alert_button ?? {}, config?.conditions?.[condition]?.alert_button ?? {});
    for (const key of ALERT_BUTTON_FIXED_KEYS) delete merged[key];
    return merged;
}

/**
 * The card config shown for a condition:
 *   1. conditions.<key>.content: a full custom card (the user supplies everything)
 *   2. otherwise the built-in alert symbol, with alert_button patched over it:
 *      the card's alert_button (every condition), then the condition's. Every
 *      lcards-button key applies (text fields whole, style, animations, ...) but
 *      type, component and preset; `speed` sets the bar sweep.
 *
 * The text is in the config the button receives, rather than left to
 * lcards-button's component-preset text injection, which runs asynchronously and
 * can race with / overwrite user-supplied text values.
 *
 * @param {any} config - Card config
 * @param {string} condition
 * @returns {any|null} null for an unknown condition without custom content
 */
export function buildContentConfig(config, condition) {
    const condCfg = config?.conditions?.[condition] ?? {};

    // Tier 1: full custom card
    if (condCfg.content) return condCfg.content;

    const base = builtInSymbol(condition);
    if (!base) return null;

    const { speed: patchSpeed, ...patch } = symbolPatch(config, condition);
    const card = mergePatch(base, patch);

    // Bar sweep speed: alert_button.speed, else (band mode) the band's speed so the
    // symbol and the dashes keep step. Merged by id into the component's
    // bars-*-sweep animations (an animation of the same id set in the patch wins).
    const speed = patchSpeed ?? (displayFor(config, condition) === 'band'
        ? resolveBandConfig(config, condition).speed : undefined);
    if (speed !== undefined && bandSpeed(speed) !== 1) {
        const duration = Math.round(EMBLEM_SWEEP_MS / bandSpeed(speed));
        const own = Array.isArray(card.animations) ? card.animations : [];
        const ids = new Set(own.map((/** @type {any} */ a) => a?.id));
        card.animations = [
            ...own,
            ...['bars-top-sweep', 'bars-bottom-sweep'].filter((id) => !ids.has(id)).map(id => ({ id, params: { duration } })),
        ];
    }

    return card;
}

/**
 * The screen effect layers for a condition: per-condition slots over the card's
 * `layers` (or the legacy `backdrop`), else an 8px blur. Each slot is
 * `{ preset, ...params }` or null (off). `layers: null` turns every slot off.
 * A condition's legacy `backdrop` migrates to its backdrop and color slots; its
 * `layers` slots win over that.
 * @param {any} config
 * @param {string} condition
 * @returns {{ backdrop: any, color: any, canvas: any }}
 */
export function resolveLayers(config, condition) {
    const globalLayers = configuredLayers(config ?? {});
    const condCfg = config?.conditions?.[condition] ?? {};
    /** @type {Record<string, any>} */
    const overrides = {};
    if (condCfg.backdrop) {
        const legacy = promoteLegacyBackdrop(condCfg.backdrop);
        overrides.backdrop = legacy.backdrop;
        overrides.color    = legacy.color;
    }
    if (condCfg.layers) Object.assign(overrides, condCfg.layers);
    // Per-condition: only slots explicitly present (key exists) override.
    return {
        backdrop: 'backdrop' in overrides ? overrides.backdrop : globalLayers.backdrop,
        color:    'color'    in overrides ? overrides.color    : globalLayers.color,
        canvas:   'canvas'   in overrides ? overrides.canvas   : globalLayers.canvas,
    };
}

/**
 * The layers a band shows: only those the config sets (a band has no default blur).
 * @param {any} config
 * @param {string} condition
 * @returns {{ backdrop: any, color: any, canvas: any }|null}
 */
export function bandLayers(config, condition) {
    const cond = config?.conditions?.[condition];
    const set = !!(config?.layers || config?.backdrop || cond?.layers || cond?.backdrop);
    return set ? resolveLayers(config, condition) : null;
}

/**
 * { backdrop, color, canvas } from a config, migrating the legacy `backdrop`.
 * `layers: null` is every slot off; no `layers` and no `backdrop` is the default blur.
 * @param {any} cfg
 */
function configuredLayers(cfg) {
    if (cfg.layers !== undefined) {
        return {
            backdrop: cfg.layers?.backdrop ?? null,
            color:    cfg.layers?.color    ?? null,
            canvas:   cfg.layers?.canvas   ?? null,
        };
    }
    if (cfg.backdrop) return promoteLegacyBackdrop(cfg.backdrop);
    // Default: blur only.
    return { backdrop: { preset: 'blur', amount: '8px' }, color: null, canvas: null };
}

/**
 * The legacy `backdrop.{blur, opacity, color}` as layer slots; opacity is folded
 * into the colour's alpha to keep the look.
 * @param {any} backdrop
 */
export function promoteLegacyBackdrop(backdrop) {
    /** @type {{backdrop: any, color: any, canvas: any}} */
    const result = { backdrop: null, color: null, canvas: null };
    if (backdrop.blur) result.backdrop = { preset: 'blur', amount: backdrop.blur };
    if (backdrop.color || backdrop.opacity !== undefined) {
        const opacity = typeof backdrop.opacity === 'number' ? backdrop.opacity : 0.6;
        const color   = backdrop.color ?? 'rgba(0,0,0,0.5)';
        const c = parseColor(color);
        result.color  = { preset: 'color-tint', color: c ? `rgba(${c.r},${c.g},${c.b},${Math.min(1, c.a * opacity).toFixed(2)})` : color };
    }
    return result;
}

/**
 * Evaluate the Jinja templates ({{ ... }} / {% ... %}) in a content config's text
 * fields through Home Assistant, returning a copy. JS ([[[...]]]) and token
 * ({entity.state}) templates are left alone: lcards-button resolves those itself
 * once mounted.
 * @param {any} cardConfig
 * @param {any} hass
 * @returns {Promise<any>}
 */
export async function resolveJinjaText(cardConfig, hass) {
    if (!hass || !cardConfig?.text) return cardConfig;
    const evaluator = new HATemplateEvaluator({ hass });
    /** @type {Record<string, any>} */
    const resolvedText = {};
    for (const [fieldId, fieldCfg] of Object.entries(cardConfig.text)) {
        const content = fieldCfg?.content;
        if (typeof content === 'string' && (content.includes('{{') || content.includes('{%'))) {
            try {
                resolvedText[fieldId] = { ...fieldCfg, content: await evaluator.evaluate(content) };
            } catch (e) {
                lcardsLog.warn(`[AlertOverlay] Jinja2 eval failed for '${fieldId}':`, e);
                resolvedText[fieldId] = fieldCfg;
            }
        } else {
            resolvedText[fieldId] = fieldCfg;
        }
    }
    return { ...cardConfig, text: resolvedText };
}
