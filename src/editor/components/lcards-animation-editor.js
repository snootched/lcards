/**
 * @fileoverview Advanced animation configuration editor component.
 *
 * Features:
 * - Comprehensive preset parameter editing (all documented options)
 * - Dynamic form generation based on selected preset
 * - Custom anime.js configuration support
 * - Trigger management (on_load, on_hover, on_tap, on_datasource_change)
 * - Modern UI with collapsible sections
 * - Full parameter coverage from preset documentation
 *
 * Usage:
 * ```html
 * <lcards-animation-editor
 *   .hass=${this.hass}
 *   .animations=${config.animations}
 *   @animations-changed=${(e) => this._handleAnimationsChanged(e.detail.value)}
 * ></lcards-animation-editor>
 * ```
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import './shared/lcards-color-picker.js';
import './shared/lcards-form-section.js';
import { LCARdSFormFieldHelper as FormField } from './shared/lcards-form-field.js';
import { ANIMATION_PRESET_PARAMS_SCHEMAS } from '../../cards/schemas/animation-preset-params-schemas.js';
import { ANIMATION_PRESET_DOCS_URL } from './shared/docs-links.js';
import { infoGuideStyles } from './shared/info-guide-styles.js';
import { searchableSelectStyles } from './shared/searchable-select-styles.js';
import { getAttributeOptions } from '../../utils/attribute-options.js';

/**
 * Presets whose params are rendered generically via FormField.renderField(),
 * driven by ANIMATION_PRESET_PARAMS_SCHEMAS, instead of a hand-written `case`
 * branch in _renderPresetParams(). Migrated preset-by-preset (Phase 13.5),
 * starting with the 6 presets that previously had no dedicated UI at all,
 * then completed in one pass across every remaining preset once the generic
 * renderer had proven itself (color-picker widget, JSON/YAML code-editor
 * fields, structured nested-object sub-forms) — this also fixes several
 * confirmed field-name-drift bugs the hand-maintained `case` branches had
 * accumulated (e.g. timeline-attention's case wrote `scale_amount` and
 * shake's wrote both `intensity`/`direction`, but their preset factories
 * read `scale_max` and `intensity`/`frequency` respectively — `direction`
 * was never read at all, so shake's "Shake Direction" dropdown did nothing;
 * both were silently broken until migration, since the generic renderer
 * always reads/writes the schema's real field names).
 *
 * The old hand-written `case` branches for every migrated preset have been
 * deleted outright (not left as dead code) — the generic renderer is the
 * only UI path for them now. Re-adding a preset's `case` branch (from git
 * history) plus removing it from this Set is the rollback path if a specific
 * preset's generic rendering ever needs to fall back.
 *
 * Deliberately NOT migrated, long-term: skew, rotate, bounce — their field
 * *shape* changes based on another field's value (e.g. bounce's `ease`/
 * `duration` behavior differs when `bounces > 1`), which the generic
 * renderer has no concept of (no conditional-field-visibility support).
 * Their hand-written `case` branches also had the exact same class of
 * field-name-drift bugs described above (skew wrote `x`/`y` instead of the
 * real `skewX`/`skewY`; rotate wrote `angle`/`origin`, neither of which the
 * factory reads at all — `origin` in particular is hardcoded in the factory,
 * not configurable) — fixed in place, since they're staying hardcoded.
 * 'grid-stagger' was removed entirely (2026.07.x) — it never staggered
 * correctly (a confirmed, unfixed bug in its per-element delay calculation)
 * and had already been pulled from this dropdown for that reason; `preset:
 * grid-stagger` in an existing config no longer resolves. Migrate to
 * 'stagger-grid' — see the 2026.07.x release notes for the field mapping
 * (stagger_duration → delay, wave_duration → duration, and `from` value
 * differences; there's no equivalent for `from: random`).
 */
const SCHEMA_DRIVEN_PRESETS = new Set([
  // Original 6 (previously had no dedicated UI at all)
  'glitch', 'motionpath', 'sequence', 'chaos', 'physics-spring',
  // Core motion/visual presets
  'pulse', 'fade', 'glow', 'draw', 'march', 'blink', 'shimmer', 'strobe',
  'flicker', 'cascade', 'cascade-color', 'ripple', 'scale', 'scale-reset',
  'set', 'slide', 'shake', 'color-shift',
  // Text presets
  'text-reveal', 'text-typewriter', 'text-scramble', 'text-glitch',
  // Stagger presets
  'stagger-grid', 'stagger-flash', 'stagger-wave', 'stagger-radial',
  // Timeline presets
  'timeline-cascade', 'timeline-attention'
]);

/**
 * Per-preset canonical (duration/ease/loop/alternate/delay) fields to hide
 * from the "Timing & Duration"/"Easing Function" common-params sections,
 * because they're confirmed non-functional for that specific preset — not
 * merely "the preset's own factory code doesn't explicitly reference this
 * field." That second, broader category is deliberately NOT hidden: most
 * "animation"-mechanism presets never explicitly touch e.g. `delay` in their
 * own JS, but it still reaches the final anime.animate() call untouched
 * (animateElement()'s `Object.assign(params, presetResult.anime)` only
 * overwrites keys the preset's own returned object actually sets — anything
 * it doesn't mention passes through from the already-resolved top-level
 * value completely intact). Only listed here when confirmed via one of:
 *   (a) the preset's own returned object explicitly hardcodes/overrides the
 *       field to a literal value (e.g. set's duration:0, glitch's
 *       ease:'linear'), or
 *   (b) the preset bypasses anime.js's normal animate()/Timer path entirely
 *       for that field, confirmed against anime.js's own source — e.g.
 *       march/stagger-flash's CSS/WAAPI short-circuit skips the whole
 *       anime.animate() call, so passthrough never applies at all; or
 *       Timeline (sequence/timeline-cascade/timeline-attention) extends
 *       Timer, whose constructor destructures duration/loop/alternate/delay
 *       from flat params — but Timeline's own constructor immediately
 *       overwrites `this.duration` to grow from its children instead, and
 *       `ease` isn't in Timer's destructured list at all (only the
 *       different `playbackEase` is) — so only duration/ease are truly
 *       inert there; loop/alternate/delay genuinely still govern the whole
 *       timeline's repeat/reverse/start-delay behavior and must stay
 *       visible.
 * bounce is deliberately NOT listed despite conditionally discarding `ease`
 * when bounces > 1 — that's config-dependent, not an unconditional
 * override, so hiding it would sometimes hide a field the user still needs;
 * it has an inline helper-text note on the Bounces field instead.
 */
const PRESET_HIDDEN_CANONICAL_FIELDS = {
  'set': { hideDuration: true, hideEasing: true, hideLoop: true, hideAlternate: true },
  'scale-reset': { hideLoop: true, hideAlternate: true },
  'glitch': { hideEasing: true },
  'text-typewriter': { hideDuration: true, hideEasing: true },
  'text-scramble': { hideEasing: true, hideAlternate: true },
  'text-glitch': { hideEasing: true },
  'physics-spring': { hideDuration: true, hideEasing: true, hideAlternate: true },
  'march': { hideEasing: true, hideAlternate: true, hideStartDelay: true },
  'stagger-flash': { hideDuration: true, hideEasing: true, hideLoop: true, hideAlternate: true, hideStartDelay: true },
  'sequence': { hideDuration: true, hideEasing: true },
  'timeline-cascade': { hideDuration: true, hideEasing: true },
  'timeline-attention': { hideDuration: true, hideEasing: true }
};

/**
 * anime.js v4 documentation URL for the primary mechanism each preset uses
 * under the hood, shown as a secondary link in the info guide alongside the
 * LCARdS docs link. Determined via a full read of every preset factory
 * (not guessed from the name) — e.g. `cascade` calls
 * `stagger()` directly even though `cascade-color` (default mode) is a
 * plain tween despite superficially sounding related. Every URL below was
 * verified to resolve with a live fetch before being hardcoded here.
 * `march`/`stagger-flash` are deliberately omitted — both bypass anime.js
 * entirely (raw CSS keyframes / WAAPI respectively), so no anime.js doc
 * page is actually relevant to link to.
 */
const ANIMEJS_DOCS_BASE = 'https://animejs.com/documentation';
const ANIMEJS_REFERENCE_URLS = {
  draw: `${ANIMEJS_DOCS_BASE}/svg/createdrawable`,
  motionpath: `${ANIMEJS_DOCS_BASE}/svg/createmotionpath`,
  'physics-spring': `${ANIMEJS_DOCS_BASE}/easings/spring`,
  cascade: `${ANIMEJS_DOCS_BASE}/utilities/stagger`,
  'stagger-grid': `${ANIMEJS_DOCS_BASE}/utilities/stagger`,
  'stagger-wave': `${ANIMEJS_DOCS_BASE}/utilities/stagger`,
  'stagger-radial': `${ANIMEJS_DOCS_BASE}/utilities/stagger`,
  sequence: `${ANIMEJS_DOCS_BASE}/timeline`,
  'timeline-cascade': `${ANIMEJS_DOCS_BASE}/timeline`,
  'timeline-attention': `${ANIMEJS_DOCS_BASE}/timeline`,
  'text-reveal': `${ANIMEJS_DOCS_BASE}/text/splittext`,
  'text-scramble': `${ANIMEJS_DOCS_BASE}/text/splittext`,
  'text-glitch': `${ANIMEJS_DOCS_BASE}/text/splittext`,
  'text-typewriter': `${ANIMEJS_DOCS_BASE}/text/splittext`
};
// Everything else uses the default plain-tween mechanism.
const ANIMEJS_DEFAULT_REFERENCE_URL = `${ANIMEJS_DOCS_BASE}/animation`;

// 'while' condition types whose value is a numeric threshold rather than a state string.
const NUMERIC_WHILE_TYPES = ['above', 'at_least', 'below', 'at_most'];
// Composite range types — each maps to two atomic while-condition keys that
// AND-combine (see TriggerManager._evaluateWhileCondition).
const COMBO_WHILE_BOUNDS = {
  between:           { loKey: 'at_least', hiKey: 'at_most' }, // inclusive both ends
  between_exclusive: { loKey: 'above',    hiKey: 'below' }    // exclusive both ends
};

export class LCARdSAnimationEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      animations: { type: Array, noAccessor: true }, // Custom getter/setter below — seeds _workingAnimations
      cardElement: { type: Object },  // Card element for target discovery
      searchRootSelector: { type: String }, // Optional: scope target discovery to a sub-element (e.g. '#__msd-base-content') instead of the whole card
      systemAnimationIds: { type: Array }, // IDs from componentDef.animations — no delete, toggle only
      _workingAnimations: { state: true }, // Internal editing state — never overwritten by parent re-renders
      _expandedIndex: { type: Number },
      _pendingDeleteIndex: { type: Number },
      _expandedGuideIndices: { state: true } // Set<number> — which animations' "How this preset works" info guide is open
    };
  }

  // ---------------------------------------------------------------------------
  // Custom getter/setter for the `animations` prop.
  // The setter is ONLY called from outside (parent Lit binding) and only seeds
  // _workingAnimations when the set of animation IDs changes — it ignores echoes
  // of our own _fireChange emissions so parent re-renders can't clobber in-progress edits.
  // ---------------------------------------------------------------------------
  get animations() {
    return this._workingAnimations || [];
  }

  set animations(val) {
    const incoming = val || [];
    const current = this._workingAnimations || [];
    // Compare animation IDs (system anims always have IDs; user anims may not)
    const incomingIds = incoming.map(a => a.id).filter(Boolean).sort().join(',');
    const currentIds  = current.map(a => a.id).filter(Boolean).sort().join(',');
    // Accept update only when there is no working state yet OR the component
    // animations changed (different IDs = card switched preset/component)
    if (!current.length || incomingIds !== currentIds) {
      this._workingAnimations = JSON.parse(JSON.stringify(incoming)).map(a => this._normalizeAnimation(a));
    }
  }

  /**
   * Ensure the canonical top-level fields (loop, alternate, duration, delay, ease)
   * are never duplicated inside params. Moves them up to the top level if found
   * in params, removing them from params. Safe to call on both new and existing
   * animation objects.
   */
  _normalizeAnimation(anim) {
    const TOP_LEVEL_KEYS = ['loop', 'alternate', 'duration', 'delay', 'ease'];
    if (!anim.params) return anim;

    const promotedFromParams = {};
    const remainingParams = {};
    for (const [k, v] of Object.entries(anim.params)) {
      if (TOP_LEVEL_KEYS.includes(k)) {
        // Only promote if the top-level value is not already explicitly set
        if (anim[k] === undefined) promotedFromParams[k] = v;
        // Either way, do not keep in params
      } else {
        remainingParams[k] = v;
      }
    }

    const normalized = { ...anim, ...promotedFromParams, params: remainingParams };
    if (Object.keys(normalized.params).length === 0) delete normalized.params;
    return normalized;
  }

  static get styles() {
    return [css`
      :host {
        display: block;
        width: 100%;
      }

      .animations-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .animation-item {
        background: var(--card-background-color);
        border: var(--ha-border-width-sm) solid var(--divider-color);
        border-radius: var(--ha-card-border-radius, 12px);
        overflow: hidden;
      }

      .animation-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        cursor: pointer;
        user-select: none;
        background: var(--secondary-background-color);
      }

      .animation-header:hover {
        background: var(--primary-background-color);
      }

      .animation-icon {
        color: var(--primary-color);
        --mdc-icon-size: 24px;
      }

      .animation-info {
        flex: 1;
        min-width: 0;
      }

      .animation-id-row {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 4px;
      }

      .animation-id {
        font-weight: 600;
        font-size: 18px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .animation-unnamed {
        font-weight: 500;
        font-size: 13px;
        color: var(--warning-color, #ff9800);
        font-style: italic;
      }

      .animation-chips {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-wrap: wrap;
      }

      .animation-actions {
        display: flex;
        gap: 4px;
      }

      .expand-icon {
        transition: transform 0.2s;
      }

      .expand-icon.expanded {
        transform: rotate(180deg);
      }

      .add-button {
        margin-bottom: 16px;
        align-self: flex-start;
      }

      .animation-content {
        padding: 20px;
        background: var(--card-background-color, #fff);
      }

      .section {
        margin-bottom: 24px;
      }

      .section:last-child {
        margin-bottom: 0;
      }

      .section-header {
        font-size: 15px;
        font-weight: 600;
        color: var(--primary-text-color);
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: var(--ha-border-width-md) solid var(--primary-color);
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .form-row {
        margin-bottom: 16px;
      }

      .form-row:last-child {
        margin-bottom: 0;
      }

      .param-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
        margin-top: 12px;
      }

      /* Constrain slider widths */
      ha-selector {
        max-width: 100%;
        width: 100%;
      }

      .param-full {
        grid-column: 1 / -1;
      }

      .add-button {
        width: 100%;
        margin-top: 8px;
      }

      .empty-state {
        text-align: center;
        padding: 32px 16px;
        color: var(--secondary-text-color);
      }

      .empty-state ha-icon {
        font-size: 64px;
        opacity: 0.3;
        margin-bottom: 16px;
      }

      .empty-state-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 8px;
      }

      .empty-state-subtitle {
        font-size: 14px;
        opacity: 0.7;
      }

      .help-text {
        font-size: 12px;
        color: var(--secondary-text-color);
        margin-top: 6px;
        line-height: 1.4;
      }

      .help-icon {
        font-size: 16px;
        color: var(--secondary-text-color);
        cursor: help;
      }

      ha-icon-button {
        --ha-icon-button-size: 36px;
        --mdc-icon-size: 20px;
      }

      .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px;
        background: var(--secondary-background-color, #fafafa);
        border-radius: 6px;
        margin-bottom: 16px;
      }

      .toggle-label {
        font-weight: 500;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .field-label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        font-size: 14px;
        color: var(--primary-text-color);
      }

      .warning-banner {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px 16px;
        background: var(--warning-color, #ff9800);
        color: #fff;
        border-radius: 6px;
        margin-bottom: 16px;
        font-size: 13px;
        line-height: 1.4;
      }

      .warning-banner ha-icon {
        flex-shrink: 0;
        margin-top: 2px;
      }

      /* Target Selection Styles */
      .mode-selector {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
        padding: 8px 0;
      }

      .target-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .target-item {
        display: flex;
        align-items: flex-start;
        gap: 8px;
      }

      .target-item ha-selector {
        flex: 1;
      }

      .target-item ha-icon-button {
        margin-top: 8px;
        --ha-icon-button-size: 36px;
        --mdc-icon-size: 20px;
      }


      .animation-item.is-disabled .animation-icon {
        opacity: 0.35;
      }

      .animation-item.is-disabled .animation-type {
        opacity: 0.5;
      }

      .danger-zone {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding-top: 20px;
        border-top: var(--ha-border-width-sm) solid var(--divider-color);
        margin-top: 8px;
      }

      .confirm-delete-row {
        display: flex;
        align-items: center;
        gap: 8px;
        justify-content: flex-end;
        padding-top: 20px;
        border-top: var(--ha-border-width-sm) solid var(--error-color, #f44336);
        margin-top: 8px;
      }

      .confirm-delete-label {
        flex: 1;
        font-size: 13px;
        color: var(--error-color, #f44336);
        font-weight: 500;
      }

      @media (max-width: 600px) {
        .animation-header {
          padding: 12px;
        }

        .animation-content {
          padding: 16px;
        }
      }
    `, infoGuideStyles, searchableSelectStyles];
  }

  constructor() {
    super();
        /** @type {any} */
        this.hass = undefined;
    /** @type {any} */
    this.cardElement = null;
    this._workingAnimations = [];
    this.systemAnimationIds = [];
    this._expandedIndex = null;
    this._pendingDeleteIndex = null;
    this._expandedGuideIndices = new Set();
    this._targetRediscoveryTimer = null;
    this._targetRediscoveryAttempts = 0;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this._targetRediscoveryTimer);
  }

  render() {
    return html`
      <div class="animations-container">
        <ha-button @click=${this._addAnimation} class="add-button">
          <ha-icon icon="mdi:plus" slot="start"></ha-icon>
          Add Animation
        </ha-button>
        ${this.animations.length === 0 ? this._renderEmptyState() : ''}
        ${this.animations.map((anim, index) => this._renderAnimationItem(anim, index))}
      </div>
    `;
  }

  _renderEmptyState() {
    return html`
      <div class="empty-state">
        <ha-icon icon="mdi:animation-outline"></ha-icon>
        <div class="empty-state-title">No animations configured</div>
        <div class="empty-state-subtitle">Add an animation to bring your card to life</div>
      </div>
    `;
  }

  _renderAnimationItem(anim, index) {
    const isExpanded = this._expandedIndex === index;
    const trigger = anim.trigger || 'on_load';
    const isCustom = anim.type === 'custom';
    const preset = anim.preset || 'pulse';
    const isEnabled = anim.enabled !== false;
    const isSystem = !!(anim.id && this.systemAnimationIds?.includes(anim.id));
    const hasId = !!(anim.id);

    return html`
      <div class="animation-item ${isEnabled ? '' : 'is-disabled'} ${isSystem ? 'is-system' : ''}">
        <div class="animation-header" @click=${() => this._toggleExpanded(index)}>
          <ha-icon
            class="animation-icon"
            icon=${isCustom ? 'mdi:code-braces' : 'mdi:animation'}>
          </ha-icon>

          <div class="animation-info">
            <div class="animation-id-row">
              ${hasId
                ? html`<span class="animation-id">${anim.id}</span>`
                : html`<span class="animation-unnamed">⚠ Unnamed animation</span>`
              }
            </div>
            <div class="animation-chips">
              <ha-assist-chip
                .filled=${true}
                style="--ha-assist-chip-filled-container-color: color-mix(in srgb, var(--primary-color) 80%, transparent); --md-sys-color-primary: var(--primary-text-color); --md-sys-color-on-surface: var(--primary-text-color);"
                .label=${isCustom ? 'custom' : this._formatPresetName(preset)}>
              </ha-assist-chip>
              <ha-assist-chip
                .filled=${true}
                style="--ha-assist-chip-filled-container-color: color-mix(in srgb, var(--primary-color) 80%, transparent); --md-sys-color-primary: var(--primary-text-color); --md-sys-color-on-surface: var(--primary-text-color);"
                .label=${this._formatTrigger(trigger)}>
              </ha-assist-chip>
              ${isSystem ? html`<ha-assist-chip
                .filled=${true}
                style="--ha-assist-chip-filled-container-color: color-mix(in srgb, var(--info-color, #039be5) 80%, transparent); --md-sys-color-primary: var(--primary-text-color); --md-sys-color-on-surface: var(--primary-text-color);"
                label="component">
                <ha-icon slot="icon" icon="mdi:puzzle-outline"></ha-icon>
              </ha-assist-chip>` : ''}
              ${!isEnabled ? html`<ha-assist-chip
                .filled=${true}
                style="--ha-assist-chip-filled-container-color: color-mix(in srgb, var(--primary-background-color, #000000) 80%, transparent); --md-sys-color-primary: var(--primary-text-color); --md-sys-color-on-surface: var(--primary-text-color);"
                label="disabled"></ha-assist-chip>` : ''}
            </div>
          </div>

          <div class="animation-actions">
            ${!isSystem ? html`
              <ha-icon-button
                @click=${(e) => this._duplicateAnimation(e, index)}
                .label=${'Duplicate'}
                .path=${'M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z'}>
              </ha-icon-button>
            ` : ''}
            <ha-icon-button
              @click=${(e) => this._toggleEnabled(e, index)}
              .label=${isEnabled ? 'Disable animation' : 'Enable animation'}
              .path=${isEnabled
                ? 'M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9M12,4.5C17,4.5 21.27,7.61 23,12C21.27,16.39 17,19.5 12,19.5C7,19.5 2.73,16.39 1,12C2.73,7.61 7,4.5 12,4.5M3.18,12C4.83,15.36 8.24,17.5 12,17.5C15.76,17.5 19.17,15.36 20.82,12C19.17,8.64 15.76,6.5 12,6.5C8.24,6.5 4.83,8.64 3.18,12Z'
                : 'M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10.02 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.08L19.73,22L21,20.73L3.27,3M12,4.5C17,4.5 21.27,7.61 23,12C22.32,13.76 21.3,15.32 20.05,16.62L18.63,15.19C19.57,14.26 20.35,13.18 20.88,12C19.23,8.64 15.82,6.5 12,6.5C10.92,6.5 9.87,6.7 8.9,7.05L7.42,5.58C8.83,4.88 10.37,4.5 12,4.5Z'}>
            </ha-icon-button>
          </div>

          <ha-icon
            class="expand-icon ${isExpanded ? 'expanded' : ''}"
            icon="mdi:chevron-down">
          </ha-icon>
        </div>

        ${isExpanded ? html`
          <div class="animation-content">
            ${this._renderAnimationForm(anim, index)}
          </div>
        ` : ''}
      </div>
    `;
  }

  _renderAnimationForm(anim, index) {
    const isCustom = anim.type === 'custom';
    const preset = anim.preset || 'pulse';
    const isPlaceholder = this._isPlaceholderPreset(preset);
    const isEnabled = anim.enabled !== false;
    const isSystem = !!(anim.id && this.systemAnimationIds?.includes(anim.id));

    return html`
      <!-- ID field for user-defined animations -->
      ${!isSystem ? html`
        ${(() => {
          const idError = anim.id ? this._validateAnimationId(anim.id, index) : null;
          return html`
            <ha-selector
              .hass=${this.hass}
              .selector=${{ text: {} }}
              .value=${anim.id || ''}
              .label=${'Animation ID'}
              .helper=${'Letters, numbers, hyphens and underscores only — e.g. my-pulse'}
              @value-changed=${(e) => this._handleIdChange(index, e.detail.value)}>
            </ha-selector>
            ${idError ? html`
              <lcards-message type="error">
                <p style="margin:0;font-size:13px;line-height:1.4;">${idError}</p>
              </lcards-message>
            ` : !anim.id ? html`
              <lcards-message type="warning">
                <p style="margin:0;font-size:13px;line-height:1.4;">
                  Give this animation an <strong>ID</strong> so you can identify it in the list and reference it in YAML rules.
                </p>
              </lcards-message>
            ` : ''}
          `;
        })()}
      ` : ''}

      <!-- Enabled Toggle -->
      <div class="toggle-row">
        <span class="toggle-label">
          <ha-icon icon=${isEnabled ? 'mdi:play-circle-outline' : 'mdi:pause-circle-outline'}></ha-icon>
          Animation Enabled
        </span>
        <ha-selector
          .hass=${this.hass}
          .selector=${{ boolean: {} }}
          .value=${isEnabled}
          @value-changed=${(e) => this._setEnabled(index, e.detail.value)}>
        </ha-selector>
      </div>

      <!-- Trigger Section -->
      <lcards-form-section
        header="Trigger"
        icon="mdi:lightning-bolt"
        ?expanded=${true}>
        <ha-selector
          .hass=${this.hass}
          .selector=${{
            select: {
              mode: 'dropdown',
              options: [
                { value: 'on_load', label: 'On Load' },
                { value: 'on_hover', label: 'On Hover' },
                { value: 'on_leave', label: 'On Leave (Exit Hover)' },
                { value: 'on_tap', label: 'On Tap' },
                { value: 'on_datasource_change', label: 'On Data Change' },
                { value: 'on_entity_change', label: 'On Entity Change' }
              ]
            }
          }}
          .value=${anim.trigger || 'on_load'}
          .label=${'When to trigger animation'}
          .helper=${this._getTriggerHelp(anim.trigger || 'on_load')}
          @value-changed=${(e) => this._updateAnimation(index, 'trigger', e.detail.value)}
        ></ha-selector>

        ${anim.trigger === 'on_entity_change' ? this._renderEntityChangeTriggerConfig(anim, index) : ''}
      </lcards-form-section>

      <!-- Target Selection Section -->
      ${isSystem ? '' : this._renderTargetSelector(anim, index)}

      <!-- Custom Toggle -->
      <ha-selector
        .hass=${this.hass}
        .selector=${{ boolean: {} }}
        .value=${isCustom}
        .label=${'Use Custom anime.js Code'}
        .helper=${'Switch to custom anime.js v4 configuration instead of preset'}
        @value-changed=${(e) => this._toggleCustomMode(index, e.detail.value)}
      ></ha-selector>

      ${isCustom ? this._renderCustomForm(anim, index) : html`
        ${isPlaceholder ? this._renderPlaceholderWarning(preset) : ''}
        ${this._renderPresetForm(anim, index, isSystem)}
      `}

      ${!isSystem ? this._renderDeleteSection(index) : ''}
    `;
  }

  _renderDeleteSection(index) {
    if (this._pendingDeleteIndex === index) {
      return html`
        <div class="confirm-delete-row">
          <span class="confirm-delete-label">Delete this animation permanently?</span>
          <ha-button @click=${() => { this._pendingDeleteIndex = null; this.requestUpdate(); }}>
            Cancel
          </ha-button>
          <ha-button
            variant="danger"
            @click=${() => this._confirmDelete(index)}>
            <ha-icon icon="mdi:trash-can" slot="start"></ha-icon>
            Delete
          </ha-button>
        </div>
      `;
    }
    return html`
      <div class="danger-zone">
        <ha-button
          variant="danger"
          @click=${() => { this._pendingDeleteIndex = index; this.requestUpdate(); }}>
          <ha-icon icon="mdi:trash-can-outline" slot="start"></ha-icon>
          Delete Animation
        </ha-button>
      </div>
    `;
  }

  _renderPresetForm(anim, index, isSystem = false) {
    // Normalize: loop/alternate/duration/delay are canonical top-level fields.
    // Prefer top-level values; fall back to legacy params.X for old configs.
    const params = {
      ...anim.params,
      ...(anim.duration  !== undefined && { duration:  anim.duration  }),
      ...(anim.delay     !== undefined && { delay:     anim.delay     }),
      ...(anim.loop      !== undefined && { loop:      anim.loop      }),
      ...(anim.alternate !== undefined && { alternate: anim.alternate }),
      ...(anim.ease      !== undefined && { ease:      anim.ease      }),
    };
    const preset = anim.preset || 'pulse';

    return html`
      <!-- Preset Selection Section -->
      <lcards-form-section
        header="Animation Preset"
        icon="mdi:animation"
        ?expanded=${!isSystem}>
        ${isSystem ? html`
          <lcards-message type="info" .message=${'Preset type is fixed for component animations. Edit parameters below.'}></lcards-message>
        ` : html`
          <ha-selector
            .hass=${this.hass}
            .selector=${{
              select: {
                mode: 'dropdown',
                custom_value: true,
                options: this._getPresetOptions()
              }
            }}
            .value=${preset}
            .label=${'Select animation type'}
            @value-changed=${(e) => this._updatePreset(index, e.detail.value)}
          ></ha-selector>
        `}
      </lcards-form-section>

      ${!isSystem ? this._renderPresetInfoGuide(preset, index) : ''}

      <lcards-form-section
        header="Animation Parameters"
        icon="mdi:tune"
        ?expanded=${true}>
        ${this._renderPresetParams(preset, params, index)}
      </lcards-form-section>
    `;
  }

  _renderPresetParams(preset, params, index) {
    // Common timing parameters shown for all presets — confirmed-non-functional
    // ones are hidden per-preset via PRESET_HIDDEN_CANONICAL_FIELDS.
    const commonParamOpts = PRESET_HIDDEN_CANONICAL_FIELDS[preset] || {};
    const commonParams = this._renderCommonParams(params, index, commonParamOpts);

    if (SCHEMA_DRIVEN_PRESETS.has(preset)) {
      return html`
        <lcards-form-section
          header="Preset Parameters"
          icon="mdi:tune-variant"
          ?expanded=${true}>
          ${this._renderSchemaDrivenParams(preset, params, index)}
        </lcards-form-section>
        ${commonParams}
      `;
    }

    // Preset-specific parameters
    let specificParams = /** @type {any} */ ('');

    switch (preset) {
      case 'rotate': {
        // Fixed a confirmed field-name/capability mismatch: this hardcoded UI
        // wrote to params.angle/params.origin, but the actual preset factory
        // never reads either — it reads `direction` ('clockwise'/
        // 'counterclockwise', which entirely overrides from/to) or explicit
        // `from`/`to` degree values, and transformOrigin is hardcoded to
        // 'center' in the factory (not configurable at all). Both old fields
        // were completely non-functional. Rebuilt to match the real shape —
        // direction shorthand vs. explicit from/to is exactly the kind of
        // conditional field visibility that keeps this preset off the
        // generic renderer.
        const useCustomRange = !params.direction;
        specificParams = html`
          <div class="param-grid">
            <ha-selector
              .hass=${this.hass}
              .selector=${{
                select: {
                  mode: 'dropdown',
                  options: [
                    { value: 'clockwise', label: 'Clockwise (0° → 360°)' },
                    { value: 'counterclockwise', label: 'Counter-clockwise (0° → -360°)' },
                    { value: '', label: 'Custom range (from/to below)' }
                  ]
                }
              }}
              .value=${params.direction ?? ''}
              .label=${'Direction'}
              @value-changed=${(e) => this._updateParam(index, 'direction', e.detail.value)}>
            </ha-selector>
            ${useCustomRange ? html`
              <ha-selector
                .hass=${this.hass}
                .selector=${{ number: { min: -720, max: 720, step: 15, mode: 'box' } }}
                .value=${params.from ?? 0}
                .label=${'From (degrees)'}
                @value-changed=${(e) => this._updateParam(index, 'from', e.detail.value)}>
              </ha-selector>
              <ha-selector
                .hass=${this.hass}
                .selector=${{ number: { min: -720, max: 720, step: 15, mode: 'box' } }}
                .value=${params.to ?? 360}
                .label=${'To (degrees)'}
                @value-changed=${(e) => this._updateParam(index, 'to', e.detail.value)}>
              </ha-selector>
            ` : ''}
          </div>
        `;
        break;
      }

      case 'bounce':
        // Fixed a confirmed field-name-drift bug: this hardcoded UI wrote to
        // params.max_scale, but the actual preset factory only ever reads
        // p.scale_max. Also removed "Elasticity" — p.elasticity is never
        // read anywhere in the factory; that slider did nothing.
        specificParams = html`
          <div class="param-grid">
            <ha-selector
              .hass=${this.hass}
              .selector=${{ number: { min: 0.1, max: 3, step: 0.1, mode: 'slider' } }}
              .value=${params.scale_max ?? 1.2}
              .label=${'Max Scale'}
              @value-changed=${(e) => this._updateParam(index, 'scale_max', e.detail.value)}>
            </ha-selector>
            <ha-selector
              .hass=${this.hass}
              .selector=${{ number: { min: 1, max: 10, step: 1, mode: 'slider' } }}
              .value=${params.bounces ?? 3}
              .label=${'Number of Bounces'}
              .helper=${'When > 1, this preset forces outQuad easing and multiplies duration by this count — see the info guide above.'}
              @value-changed=${(e) => this._updateParam(index, 'bounces', e.detail.value)}>
            </ha-selector>
          </div>
        `;
        break;

      case 'skew':
        // Fixed a confirmed field-name-drift bug: this hardcoded UI wrote to
        // params.x/params.y, but the actual preset factory only ever reads
        // p.skewX/p.skewY. Added the optional from_skewX/from_skewY fields
        // too (initially left out, which made the UI's own field list
        // inconsistent with the info guide's schema-driven description of
        // this preset, listing all 4 fields) — the factory's real shape is
        // simple enough (from_* just switch it from "0 → target" to
        // "explicit start → target") that it doesn't need to stay hidden.
        specificParams = html`
          <div class="param-grid">
            <ha-selector
              .hass=${this.hass}
              .selector=${{ number: { min: -45, max: 45, step: 1, mode: 'box' } }}
              .value=${params.skewX ?? 0}
              .label=${'Skew X (degrees)'}
              @value-changed=${(e) => this._updateParam(index, 'skewX', e.detail.value)}>
            </ha-selector>
            <ha-selector
              .hass=${this.hass}
              .selector=${{ number: { min: -45, max: 45, step: 1, mode: 'box' } }}
              .value=${params.skewY ?? 0}
              .label=${'Skew Y (degrees)'}
              @value-changed=${(e) => this._updateParam(index, 'skewY', e.detail.value)}>
            </ha-selector>
            <ha-selector
              .hass=${this.hass}
              .selector=${{ number: { min: -45, max: 45, step: 1, mode: 'box' } }}
              .value=${params.from_skewX ?? 0}
              .label=${'From Skew X (degrees)'}
              .helper=${'Optional starting X skew — if either From field is set, the animation goes from these values to Skew X/Y above instead of from 0'}
              @value-changed=${(e) => this._updateParam(index, 'from_skewX', e.detail.value)}>
            </ha-selector>
            <ha-selector
              .hass=${this.hass}
              .selector=${{ number: { min: -45, max: 45, step: 1, mode: 'box' } }}
              .value=${params.from_skewY ?? 0}
              .label=${'From Skew Y (degrees)'}
              .helper=${'Optional starting Y skew — see From Skew X'}
              @value-changed=${(e) => this._updateParam(index, 'from_skewY', e.detail.value)}>
            </ha-selector>
          </div>
        `;
        break;

    }

    return html`
      ${specificParams ? html`
        <lcards-form-section
          header="Preset Parameters"
          icon="mdi:tune-variant"
          ?expanded=${true}>
          ${specificParams}
        </lcards-form-section>
      ` : ''}
      ${commonParams}
    `;
  }

  /**
   * Renders one preset's params fields generically, driven by
   * ANIMATION_PRESET_PARAMS_SCHEMAS[preset], via the shared FormField.renderField()
   * (the same renderer already used by lcards-slider-editor.js) — for presets in
   * SCHEMA_DRIVEN_PRESETS only. Array/object-shaped fields (flagged in the schema
   * via x-ui-hints.widget: 'json') render as a raw JSON textarea instead, the same
   * pattern already used by hand in several of the hardcoded `case` branches above.
   *
   * FormField.renderField() calls back into this.hass / _getSchemaForPath /
   * _getConfigValue / _setConfigValue — the last three resolve against
   * `_schemaRenderCtx` (presetSchema/params/index, set once per preset-params
   * render, not per-field — see the comment at its assignment below for why).
   * Nested fields (see _renderNestedObjectField()) use a dot-separated path
   * (e.g. "shape.fill") so the adapter methods can resolve/write the correct
   * location purely from the path string, which is what actually stays fresh
   * across a later, asynchronous user interaction — the shared context wouldn't.
   */
  _renderSchemaDrivenParams(preset, params, index) {
    const presetSchema = ANIMATION_PRESET_PARAMS_SCHEMAS[preset];
    if (!presetSchema?.properties) return '';

    // Canonical fields (duration/ease/loop/alternate/delay) are already covered by
    // _renderCommonParams() above — skip them here to avoid rendering them twice.
    const CANONICAL_KEYS = new Set(['duration', 'ease', 'loop', 'alternate', 'delay']);

    // Set once per preset-params render, not per-field: _getSchemaForPath/_getConfigValue
    // are read synchronously during render (safe either way), but _setConfigValue only
    // fires later, on a real user interaction — by which point a per-field-reassigned
    // context would already reflect whichever field rendered LAST, not the one whose
    // callback is actually firing. Keeping presetSchema/params/index constant across
    // the whole pass (nesting is derived from the field's own path string instead,
    // see _setConfigValue) avoids that staleness entirely.
    this._schemaRenderCtx = { presetSchema, params, index };

    return html`
      <div class="param-grid">
        ${Object.entries(presetSchema.properties)
          .filter(([key]) => !CANONICAL_KEYS.has(key))
          .map(([key, fieldSchema]) => {
            if (fieldSchema['x-ui-hints']?.widget === 'json') {
              return this._renderJsonParamField(key, fieldSchema, params, index);
            }
            if (fieldSchema.type === 'object' && fieldSchema.properties) {
              return this._renderNestedObjectField(key, fieldSchema, params);
            }
            return FormField.renderField(this, key, {});
          })}
      </div>
    `;
  }

  /**
   * Structured sub-form for a fixed-shape nested object field (e.g. motionpath's
   * `shape: {type, size, fill, stroke, ...}`) — one level of nesting, rendered via
   * the same FormField.renderField() as top-level fields, using a dot-separated
   * path (e.g. "shape.fill") so the adapter methods below can resolve/write the
   * right location from the path string alone. Only for schemas with a small,
   * known set of sub-properties; genuinely open-ended/dynamic-key objects (e.g.
   * chaos's `range`) stay on the JSON-textarea path — there's no fixed field list
   * to build a form from for those.
   * @private
   */
  _renderNestedObjectField(key, fieldSchema, params) {
    const hints = fieldSchema['x-ui-hints'] || {};
    const label = hints.label || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    return html`
      <div class="param-full">
        <lcards-form-section .header=${label} .description=${fieldSchema.description || ''} ?expanded=${true}>
          <div class="param-grid">
            ${Object.entries(fieldSchema.properties || {}).map(([subKey]) =>
              FormField.renderField(this, `${key}.${subKey}`, {}))}
          </div>
        </lcards-form-section>
      </div>
    `;
  }

  /** @private — resolves a possibly dot-separated "parent.sub" path against presetSchema.properties */
  _resolveNestedFieldSchema(path) {
    const presetSchema = this._schemaRenderCtx?.presetSchema;
    if (!presetSchema?.properties) return null;
    if (path.includes('.')) {
      const [parentKey, subKey] = path.split('.');
      return presetSchema.properties[parentKey]?.properties?.[subKey] ?? null;
    }
    return presetSchema.properties[path] ?? null;
  }

  /** @private — adapter for FormField.renderField(), see _renderSchemaDrivenParams() */
  _getSchemaForPath(path) {
    return this._resolveNestedFieldSchema(path);
  }

  /** @private — adapter for FormField.renderField(), see _renderSchemaDrivenParams() */
  _getConfigValue(path) {
    const params = this._schemaRenderCtx?.params;
    if (!params) return undefined;
    if (path.includes('.')) {
      const [parentKey, subKey] = path.split('.');
      const parent = params[parentKey];
      return (parent && typeof parent === 'object') ? parent[subKey] : undefined;
    }
    return params[path];
  }

  /**
   * @private — adapter for FormField.renderField(), see _renderSchemaDrivenParams().
   * Nesting is decided entirely by whether `path` itself contains a "." — never by
   * separately-tracked render-time state, which would already be stale by the time
   * this fires (see the comment in _renderSchemaDrivenParams()).
   */
  _setConfigValue(path, value) {
    const index = this._schemaRenderCtx?.index;
    if (path.includes('.')) {
      const [parentKey, subKey] = path.split('.');
      const currentParams = this.animations[index]?.params || {};
      const currentParent = (currentParams[parentKey] && typeof currentParams[parentKey] === 'object') ? currentParams[parentKey] : {};
      const updatedParent = { ...currentParent, [subKey]: value };
      this._updateParam(index, parentKey, updatedParent);
      return;
    }
    this._updateParam(index, path, value);
  }

  /**
   * Structured editing for array/object-shaped preset params (e.g. chaos's
   * `properties`/`range`, sequence's `steps`) via HA's native <ha-yaml-editor>
   * (a CodeMirror-backed editor with syntax highlighting and lint feedback) —
   * a real upgrade over a plain single-line text input that required valid
   * JSON on every keystroke. Despite the "JSON" naming inherited from the
   * schema's x-ui-hints (these fields' stored values are plain JS
   * arrays/objects either way), this editor natively displays/accepts YAML
   * syntax too — which is arguably a better fit here, since the surrounding
   * card config is YAML already; both JSON and YAML input parse correctly
   * (JSON is valid YAML).
   *
   * IMPORTANT: <ha-yaml-editor>.value expects the real parsed value (object/
   * array), not a pre-stringified string — and needs `auto-update` set, since
   * its internal re-serialization to displayed text only runs reactively when
   * that attribute is present (confirmed against the frontend source; see the
   * _renderCustomForm() fix alongside this one, which had both of these wrong).
   * Its `value-changed` event already hands back the parsed value directly
   * (plus `isValid`/`errorMsg`) — no manual JSON.parse needed.
   * @private
   */
  _renderJsonParamField(key, fieldSchema, params, index) {
    const hints = fieldSchema['x-ui-hints'] || {};
    const label = hints.label || key;
    const emptyValue = fieldSchema.type === 'array' ? [] : {};
    const currentValue = params[key] ?? fieldSchema.default ?? emptyValue;
    return html`
      <div class="param-full">
        <p class="field-label">${label}</p>
        <ha-yaml-editor
          auto-update
          .value=${currentValue}
          @value-changed=${(e) => {
            if (e.detail.isValid !== false) {
              this._updateParam(index, key, e.detail.value);
            }
          }}>
        </ha-yaml-editor>
        ${fieldSchema.description ? html`<div class="help-text">${fieldSchema.description}</div>` : ''}
      </div>
    `;
  }

  _renderCommonParams(params, index, options = {}) {
    const showTimingSection = !(options.hideDuration && options.hideStartDelay && options.hideLoop && options.hideAlternate);
    return html`
      ${showTimingSection ? html`<lcards-form-section
        header="Timing & Duration"
        icon="mdi:timer-outline"
        ?expanded=${true}>
        <div class="param-grid">
          ${!options.hideDuration ? html`<ha-input
            type="number"
            label="Duration (ms)"
            .value=${params.duration ?? 1000}
            min="0"
            step="100"
            @input=${(e) => this._updateParam(index, 'duration', Number(e.target.value))}>
          </ha-input>` : ''}

          ${!options.hideStartDelay ? html`<ha-input
            type="number"
            label="Start Delay (ms)"
            .value=${params.delay ?? 0}
            min="0"
            step="100"
            helper="Delay before animation starts"
            @input=${(e) => this._updateParam(index, 'delay', Number(e.target.value))}>
          </ha-input>` : ''}

          ${!options.hideLoop ? html`
            <ha-selector
              .hass=${this.hass}
              .selector=${{ boolean: {} }}
              .value=${typeof params.loop === 'boolean' ? params.loop : (params.loop ? true : false)}
              .label=${'Loop Animation (Infinite)'}
              .helper=${'Toggle for infinite loop, or use Loop Count below for specific iterations'}
              @value-changed=${(e) => this._updateParam(index, 'loop', e.detail.value)}>
            </ha-selector>

            <ha-selector
              .hass=${this.hass}
              .selector=${{ number: { min: 0, max: 100, step: 1, mode: 'box' } }}
              .value=${typeof params.loop === 'number' ? params.loop : ''}
              .label=${'Loop Count (0 = off, leave empty for infinite)'}
              @value-changed=${(e) => this._updateParam(index, 'loop', e.detail.value || false)}>
            </ha-selector>
          ` : ''}

          ${!options.hideAlternate ? html`<ha-selector
            .hass=${this.hass}
            .selector=${{ boolean: {} }}
            .value=${params.alternate ?? false}
            .label=${'Alternate Direction'}
            .helper=${'Reverse animation direction on each loop'}
            @value-changed=${(e) => this._updateParam(index, 'alternate', e.detail.value)}>
          </ha-selector>` : ''}
        </div>
      </lcards-form-section>` : ''}

      ${!options.hideEasing ? html`<lcards-form-section
        header="Easing Function"
        icon="mdi:chart-bell-curve"
        ?expanded=${true}>
        <div class="param-grid">
          <ha-selector
          .hass=${this.hass}
          .selector=${{
            select: {
              mode: 'dropdown',
              custom_value: true,
              options: [
                // Linear
                { value: 'linear', label: 'Linear' },

                // Power (parametric: power = 1.675 by default)
                { value: 'in', label: 'Power - In' },
                { value: 'out', label: 'Power - Out' },
                { value: 'inOut', label: 'Power - In/Out' },
                { value: 'outIn', label: 'Power - Out/In' },

                // Quad (Quadratic)
                { value: 'inQuad', label: 'Quad - In' },
                { value: 'outQuad', label: 'Quad - Out' },
                { value: 'inOutQuad', label: 'Quad - In/Out' },
                { value: 'outInQuad', label: 'Quad - Out/In' },

                // Cubic
                { value: 'inCubic', label: 'Cubic - In' },
                { value: 'outCubic', label: 'Cubic - Out' },
                { value: 'inOutCubic', label: 'Cubic - In/Out' },
                { value: 'outInCubic', label: 'Cubic - Out/In' },

                // Quart (Quartic)
                { value: 'inQuart', label: 'Quart - In' },
                { value: 'outQuart', label: 'Quart - Out' },
                { value: 'inOutQuart', label: 'Quart - In/Out' },
                { value: 'outInQuart', label: 'Quart - Out/In' },

                // Quint (Quintic)
                { value: 'inQuint', label: 'Quint - In' },
                { value: 'outQuint', label: 'Quint - Out' },
                { value: 'inOutQuint', label: 'Quint - In/Out' },
                { value: 'outInQuint', label: 'Quint - Out/In' },

                // Sine
                { value: 'inSine', label: 'Sine - In' },
                { value: 'outSine', label: 'Sine - Out' },
                { value: 'inOutSine', label: 'Sine - In/Out' },
                { value: 'outInSine', label: 'Sine - Out/In' },

                // Exponential
                { value: 'inExpo', label: 'Expo - In' },
                { value: 'outExpo', label: 'Expo - Out' },
                { value: 'inOutExpo', label: 'Expo - In/Out' },
                { value: 'outInExpo', label: 'Expo - Out/In' },

                // Circular
                { value: 'inCirc', label: 'Circ - In' },
                { value: 'outCirc', label: 'Circ - Out' },
                { value: 'inOutCirc', label: 'Circ - In/Out' },
                { value: 'outInCirc', label: 'Circ - Out/In' },

                // Back (parametric: overshoot = 1.70158 by default)
                { value: 'inBack', label: 'Back - In ↩️' },
                { value: 'outBack', label: 'Back - Out ↩️' },
                { value: 'inOutBack', label: 'Back - In/Out ↩️' },
                { value: 'outInBack', label: 'Back - Out/In ↩️' },

                // Elastic (parametric: amplitude = 1, period = 0.3 by default)
                { value: 'inElastic', label: 'Elastic - In 🎯' },
                { value: 'outElastic', label: 'Elastic - Out 🎯' },
                { value: 'inOutElastic', label: 'Elastic - In/Out 🎯' },
                { value: 'outInElastic', label: 'Elastic - Out/In 🎯' },

                // Bounce
                { value: 'inBounce', label: 'Bounce - In' },
                { value: 'outBounce', label: 'Bounce - Out' },
                { value: 'inOutBounce', label: 'Bounce - In/Out' },
                { value: 'outInBounce', label: 'Bounce - Out/In' },

                // Advanced Easings (require custom parameters)
                { value: 'cubicBezier', label: '🔧 Cubic Bézier - Custom curve' },
                { value: 'spring', label: '🔧 Spring - Physics-based' },
                { value: 'steps', label: '🔧 Steps - Frame-by-frame' },
                { value: 'linear', label: '🔧 Linear - Custom linear points' },
                { value: 'irregular', label: '🔧 Irregular - Randomized' },
                { value: 'custom', label: '🔧 Custom - anime.js string' }
              ]
            }
          }}
          .value=${params.ease ?? 'inOutQuad'}
          .label=${'Easing Function'}
          @value-changed=${(e) => this._updateParam(index, 'ease', e.detail.value)}>
        </ha-selector>
        </div>

        ${this._renderParametricEasingFields(params, index)}
      </lcards-form-section>` : ''}
    `;
  }

  _renderParametricEasingFields(params, index) {
    const ease = params.ease || 'inOutQuad';

    // Power easings (in, out, inOut, outIn)
    if (['in', 'out', 'inOut', 'outIn'].includes(ease)) {
      return html`
        <ha-input
          type="number"
          label="Power (exponent)"
          .value=${params.ease_params?.power ?? 1.675}
          min="0.1"
          max="10"
          step="0.1"
          helper="Default: 1.675. Higher = steeper curve"
          @input=${(e) => this._updateEaseParam(index, 'power', Number(e.target.value))}>
        </ha-input>
      `;
    }

    // Back easings (overshoot parameter)
    if (ease.includes('Back')) {
      return html`
        <ha-input
          type="number"
          label="Overshoot"
          .value=${params.ease_params?.overshoot ?? 1.70158}
          min="0"
          max="5"
          step="0.1"
          helper="Default: 1.70158. Higher = more overshoot"
          @input=${(e) => this._updateEaseParam(index, 'overshoot', Number(e.target.value))}>
        </ha-input>
      `;
    }

    // Elastic easings (amplitude and period)
    if (ease.includes('Elastic')) {
      return html`
        <div class="param-grid" style="grid-template-columns: 1fr 1fr;">
          <ha-input
            type="number"
            label="Amplitude"
            .value=${params.ease_params?.amplitude ?? 1}
            min="0.1"
            max="5"
            step="0.1"
            helper="Default: 1"
            @input=${(e) => this._updateEaseParam(index, 'amplitude', Number(e.target.value))}>
          </ha-input>

          <ha-input
            type="number"
            label="Period"
            .value=${params.ease_params?.period ?? 0.3}
            min="0.1"
            max="2"
            step="0.05"
            helper="Default: 0.3"
            @input=${(e) => this._updateEaseParam(index, 'period', Number(e.target.value))}>
          </ha-input>
        </div>
      `;
    }

    // Cubic Bézier (4 control points: x1, y1, x2, y2)
    if (ease === 'cubicBezier') {
      return html`
        <div class="param-grid" style="grid-template-columns: 1fr 1fr;">
          <ha-selector
            .hass=${this.hass}
            .selector=${{ number: { min: 0, max: 1, step: 0.01, mode: 'box' } }}
            .value=${params.ease_params?.x1 ?? 0.25}
            .label=${'X1'}
            @value-changed=${(e) => this._updateEaseParam(index, 'x1', e.detail.value)}>
          </ha-selector>
          <ha-selector
            .hass=${this.hass}
            .selector=${{ number: { min: -2, max: 2, step: 0.01, mode: 'box' } }}
            .value=${params.ease_params?.y1 ?? 0.1}
            .label=${'Y1'}
            @value-changed=${(e) => this._updateEaseParam(index, 'y1', e.detail.value)}>
          </ha-selector>
          <ha-selector
            .hass=${this.hass}
            .selector=${{ number: { min: 0, max: 1, step: 0.01, mode: 'box' } }}
            .value=${params.ease_params?.x2 ?? 0.25}
            .label=${'X2'}
            @value-changed=${(e) => this._updateEaseParam(index, 'x2', e.detail.value)}>
          </ha-selector>
          <ha-selector
            .hass=${this.hass}
            .selector=${{ number: { min: -2, max: 2, step: 0.01, mode: 'box' } }}
            .value=${params.ease_params?.y2 ?? 1}
            .label=${'Y2'}
            @value-changed=${(e) => this._updateEaseParam(index, 'y2', e.detail.value)}>
          </ha-selector>
        </div>
        <lcards-message type="info" .message=${'Define custom curve: (x1,y1) and (x2,y2) control points'}></lcards-message>
      `;
    }

    // Spring (physics-based easing)
    if (ease === 'spring') {
      return html`
        <div class="param-grid" style="grid-template-columns: 1fr 1fr;">
          <ha-selector
            .hass=${this.hass}
            .selector=${{ number: { min: 0.1, max: 10, step: 0.1, mode: 'box' } }}
            .value=${params.ease_params?.mass ?? 1}
            .label=${'Mass'}
            @value-changed=${(e) => this._updateEaseParam(index, 'mass', e.detail.value)}>
          </ha-selector>
          <ha-selector
            .hass=${this.hass}
            .selector=${{ number: { min: 1, max: 1000, step: 10, mode: 'box' } }}
            .value=${params.ease_params?.stiffness ?? 100}
            .label=${'Stiffness'}
            @value-changed=${(e) => this._updateEaseParam(index, 'stiffness', e.detail.value)}>
          </ha-selector>
          <ha-selector
            .hass=${this.hass}
            .selector=${{ number: { min: 0, max: 100, step: 1, mode: 'box' } }}
            .value=${params.ease_params?.damping ?? 10}
            .label=${'Damping'}
            @value-changed=${(e) => this._updateEaseParam(index, 'damping', e.detail.value)}>
          </ha-selector>
          <ha-selector
            .hass=${this.hass}
            .selector=${{ number: { min: -100, max: 100, step: 1, mode: 'box' } }}
            .value=${params.ease_params?.velocity ?? 0}
            .label=${'Velocity'}
            @value-changed=${(e) => this._updateEaseParam(index, 'velocity', e.detail.value)}>
          </ha-selector>
        </div>
        <lcards-message type="info" .message=${'Physics simulation. Try: mass=1, stiffness=170, damping=26'}></lcards-message>
      `;
    }

    // Steps (frame-by-frame animation)
    if (ease === 'steps') {
      return html`
        <div class="param-grid" style="grid-template-columns: 2fr 1fr;">
          <ha-selector
            .hass=${this.hass}
            .selector=${{ number: { min: 1, max: 100, step: 1, mode: 'box' } }}
            .value=${params.ease_params?.steps ?? 10}
            .label=${'Number of Steps'}
            @value-changed=${(e) => this._updateEaseParam(index, 'steps', e.detail.value)}>
          </ha-selector>
          <ha-selector
            .hass=${this.hass}
            .selector=${{ boolean: {} }}
            .value=${params.ease_params?.fromStart ?? false}
            .label=${'From Start'}
            @value-changed=${(e) => this._updateEaseParam(index, 'fromStart', e.detail.value)}>
          </ha-selector>
        </div>
        <lcards-message type="info" .message=${'Choppy frame-by-frame. fromStart: change at step start vs end'}></lcards-message>
      `;
    }

    // Linear (custom linear curve with points)
    if (ease === 'linear') {
      const pointsStr = JSON.stringify(params.ease_params?.points ?? [0, 0.25, 0.75, 1]);
      return html`
        <ha-selector
          .hass=${this.hass}
          .selector=${{ text: { multiline: false } }}
          .value=${pointsStr}
          .label=${'Value Points (JSON)'}
          @value-changed=${(e) => {
            try {
              const parsed = JSON.parse(e.detail.value);
              if (Array.isArray(parsed)) {
                this._updateEaseParam(index, 'points', parsed);
              }
            } catch (err) {}
          }}>
        </ha-selector>
        <lcards-message type="info" .message=${'Linear between points: [0, 0.5, 1] or with timing: [0, "0.5 50%", 1]'}></lcards-message>
      `;
    }

    // Irregular (randomized easing)
    if (ease === 'irregular') {
      return html`
        <div class="param-grid" style="grid-template-columns: 1fr 1fr;">
          <ha-selector
            .hass=${this.hass}
            .selector=${{ number: { min: 2, max: 100, step: 1, mode: 'box' } }}
            .value=${params.ease_params?.steps ?? 10}
            .label=${'Steps'}
            @value-changed=${(e) => this._updateEaseParam(index, 'steps', e.detail.value)}>
          </ha-selector>
          <ha-selector
            .hass=${this.hass}
            .selector=${{ number: { min: 0.1, max: 5, step: 0.1, mode: 'box' } }}
            .value=${params.ease_params?.randomness ?? 1}
            .label=${'Randomness'}
            @value-changed=${(e) => this._updateEaseParam(index, 'randomness', e.detail.value)}>
          </ha-selector>
        </div>
        <lcards-message type="info" .message=${'Erratic motion. Higher randomness = wilder jumps'}></lcards-message>
      `;
    }

    // Custom (anime.js easing string)
    if (ease === 'custom') {
      return html`
        <ha-textarea
          label="anime.js Easing String"
          .value=${params.ease_params?.customString ?? ''}
          @input=${(e) => this._updateEaseParam(index, 'customString', e.target.value)}
          rows="3"
          resize="auto"
          style="width: 100%; font-family: 'Roboto Mono', monospace;">
        </ha-textarea>
        <lcards-message type="info">
          Paste from <a href="https://animejs.com/easing-editor/spring/default" target="_blank">anime.js Easing Editor</a>.
          Example: <code>spring({ bounce: 0.4, duration: 500 })</code>
        </lcards-message>
      `;
    }

    return ''; // No parametric fields for other easings
  }

  _updateEaseParam(index, paramKey, value) {
    const updated = [...this.animations];
    const current = updated[index];
    updated[index] = {
      ...current,
      params: {
        ...current.params,
        ease_params: {
          ...current.params?.ease_params,
          [paramKey]: value
        }
      }
    };
    this._workingAnimations = updated;
    this._fireChange();
  }

  _renderCustomForm(anim, index) {
    const animeConfig = anim.animejs || {};

    return html`
      <lcards-form-section
        header="Custom anime.js Configuration"
        icon="mdi:code-braces"
        ?expanded=${true}>
        <ha-yaml-editor
          auto-update
          .value=${animeConfig}
          @value-changed=${(e) => {
            if (e.detail.isValid !== false) {
              this._updateCustomConfig(index, e.detail.value);
            }
          }}>
        </ha-yaml-editor>
        <lcards-message type="info">
          Enter a valid object for anime.js v4 configuration (JSON or YAML syntax both work).
          <a href="https://animejs.com/documentation/" target="_blank" rel="noopener noreferrer">
            View Documentation →
          </a>
        </lcards-message>
      </lcards-form-section>
    `;
  }

  _renderPlaceholderWarning(preset) {
    return html`
      <div class="warning-banner">
        <ha-icon icon="mdi:alert-circle"></ha-icon>
        <div>
          <strong>Placeholder Preset:</strong> "${this._formatPresetName(preset)}" is not yet implemented.
          You can still configure it, but it won't animate until the preset is completed.
        </div>
      </div>
    `;
  }

  _formatTrigger(trigger) {
    const map = {
      'on_load': 'Load',
      'on_hover': 'Hover',
      'on_leave': 'Leave',
      'on_tap': 'Tap',
      'on_datasource_change': 'Data Change',
      'on_entity_change': 'Entity Change'
    };
    return map[trigger] || trigger;
  }

  _getTriggerIcon(trigger) {
    const icons = {
      'on_load': 'mdi:loading',
      'on_hover': 'mdi:cursor-default-click',
      'on_leave': 'mdi:cursor-default-outline',
      'on_tap': 'mdi:gesture-tap',
      'on_datasource_change': 'mdi:database-sync',
      'on_entity_change': 'mdi:state-machine'
    };
    return icons[trigger] || 'mdi:lightning-bolt';
  }

  _getTriggerHelp(trigger) {
    const help = {
      'on_load': 'Executes when the card loads or updates',
      'on_hover': 'Executes when mouse enters the element',
      'on_leave': 'Executes when mouse leaves the element (use for exit animations)',
      'on_tap': 'Executes when the element is clicked/tapped',
      'on_datasource_change': 'Executes when associated data source value changes',
      'on_entity_change': 'Triggers when a monitored entity (or attribute) changes. Use from_state/to_state as fire-and-forget gates, and while to auto-stop a looping animation when a condition clears.'
    };
    return help[trigger] || '';
  }

  _renderEntityChangeTriggerConfig(anim, index) {
    const whileType  = this._getWhileConditionType(anim);
    const whileValue = this._getWhileConditionValue(anim);
    const whileIsNumeric = NUMERIC_WHILE_TYPES.includes(whileType);
    const whileBounds = this._getWhileConditionBounds(anim);

    return html`
      <div style="margin-top: 16px; padding: 12px; background: var(--secondary-background-color); border-radius: 6px;">
        <label class="field-label">Entity Change Configuration</label>

        <ha-selector
          .hass=${this.hass}
          .selector=${{ entity: {} }}
          .value=${anim.entity || ''}
          .label=${'Entity to Monitor'}
          .helper=${'Entity whose state changes will trigger this animation'}
          @value-changed=${(e) => this._updateAnimation(index, 'entity', e.detail.value)}
          style="margin-bottom: 12px;">
        </ha-selector>

        <ha-selector
          .hass=${this.hass}
          .label=${'Attribute (optional)'}
          .helper=${'Attribute to read instead of entity state. Applies to from_state, to_state, and while. Use brightness_pct for a computed 0\u2013100 light brightness percentage.'}
          .selector=${{ select: { mode: 'dropdown', custom_value: true, options: [
            { value: '__none__', label: '\u2014 Use entity state' },
            ...getAttributeOptions(this.hass, anim.entity || this.cardElement?.config?.entity)
          ] } }}
          .value=${anim.attribute || '__none__'}
          @value-changed=${(e) => {
            const v = (e.detail.value ?? '').trim();
            this._updateAnimation(index, 'attribute', (v === '__none__' || !v) ? undefined : v);
          }}
          style="width: 100%; margin-bottom: 12px;">
        </ha-selector>

        <lcards-message type="warning" .message=${'\u26a0\ufe0f from_state and to_state are fire-and-forget gates \u2014 they control when an animation starts but will NOT stop a looping animation. To automatically stop a loop when a condition clears, add a While Condition below.'}></lcards-message>

        <ha-input
          label="From State (optional)"
          .value=${anim.from_state || ''}
          .helper=${'Fire-and-forget gate: only trigger when transitioning FROM this value (leave empty for any)'}
          @input=${(e) => this._updateAnimation(index, 'from_state', e.target.value)}
          style="width: 100%; margin-bottom: 12px;">
        </ha-input>

        <ha-input
          label="To State (optional)"
          .value=${anim.to_state || ''}
          .helper=${'Fire-and-forget gate: only trigger when transitioning TO this value (leave empty for any)'}
          @input=${(e) => this._updateAnimation(index, 'to_state', e.target.value)}
          style="width: 100%; margin-bottom: 12px;">
        </ha-input>

        <label class="field-label" style="margin-top: 8px; display: block;">While Condition <span style="font-size: 0.85em; opacity: 0.7;">(requires loop: true)</span></label>
        <div style="display: flex; gap: 8px; margin-bottom: 8px; align-items: flex-start; flex-wrap: wrap;">
          <ha-selector
            .hass=${this.hass}
            .selector=${{ select: { options: [
              { value: 'none',      label: 'None (fire-and-forget)' },
              { value: 'state',     label: 'State equals' },
              { value: 'not_state', label: 'State not equals' },
              { value: 'above',     label: 'Above (numeric >)' },
              { value: 'at_least',  label: 'At Least (numeric ≥)' },
              { value: 'below',     label: 'Below (numeric <)' },
              { value: 'at_most',   label: 'At Most (numeric ≤)' },
              { value: 'between',           label: 'Between (inclusive, ≥ and ≤)' },
              { value: 'between_exclusive', label: 'Between (exclusive, > and <)' }
            ]}}}
            .value=${whileType}
            .label=${'Play while...'}
            @value-changed=${(e) => this._updateWhileConditionType(index, e.detail.value)}
            style="flex: 1; min-width: 160px;">
          </ha-selector>
          ${whileBounds ? html`
            <ha-input
              label="Min"
              type="number"
              .value=${String(whileBounds.lo ?? '')}
              @input=${(e) => this._updateWhileConditionBoundValue(index, whileBounds.loKey, e.target.value)}
              style="flex: 1; min-width: 100px;">
            </ha-input>
            <ha-input
              label="Max"
              type="number"
              .value=${String(whileBounds.hi ?? '')}
              @input=${(e) => this._updateWhileConditionBoundValue(index, whileBounds.hiKey, e.target.value)}
              style="flex: 1; min-width: 100px;">
            </ha-input>
          ` : whileType !== 'none' ? html`
            <ha-input
              label="Value"
              type=${whileIsNumeric ? 'number' : 'text'}
              .value=${whileValue}
              .helper=${whileIsNumeric ? 'Numeric threshold' : 'State string (e.g. on, off, heating)'}
              @input=${(e) => this._updateWhileConditionValue(index, whileType, e.target.value)}
              style="flex: 1;">
            </ha-input>
          ` : ''}
        </div>

        ${anim.while ? html`
          <lcards-message type="info" .message=${'The looping animation will play while the condition is true and stop automatically when it clears. Requires loop: true in the Animation Settings section above.'}></lcards-message>
        ` : ''}

        <ha-selector
          .hass=${this.hass}
          .selector=${{ boolean: {} }}
          .value=${anim.check_on_load !== false}
          .label=${'Check on Load'}
          .helper=${'Evaluate the condition when the card first loads (default: on). For while conditions: starts immediately if condition already met. For to_state: fires if entity is already in that state. Disable to only react to state transitions after load.'}
          @value-changed=${(e) => this._updateAnimation(index, 'check_on_load', e.detail.value)}
          style="margin-bottom: 12px;">
        </ha-selector>
      </div>
    `;
  }

  /** Return the active while condition type key, or 'none' */
  _getWhileConditionType(anim) {
    const w = anim.while;
    if (!w || typeof w !== 'object') return 'none';
    if ('state'     in w) return 'state';
    if ('not_state' in w) return 'not_state';
    // Combo (range) types take priority over their atomic keys when both bounds are present.
    if ('at_least' in w && 'at_most' in w) return 'between';
    if ('above'    in w && 'below'   in w) return 'between_exclusive';
    if ('above'     in w) return 'above';
    if ('at_least'  in w) return 'at_least';
    if ('below'     in w) return 'below';
    if ('at_most'   in w) return 'at_most';
    return 'none';
  }

  /** Return the current while condition value as a string (atomic types only) */
  _getWhileConditionValue(anim) {
    const type = this._getWhileConditionType(anim);
    if (type === 'none' || COMBO_WHILE_BOUNDS[type]) return '';
    return String(anim.while[type] ?? '');
  }

  /** Return { loKey, hiKey, lo, hi } for a combo (range) while condition type, or null */
  _getWhileConditionBounds(anim) {
    const type = this._getWhileConditionType(anim);
    const combo = COMBO_WHILE_BOUNDS[type];
    if (!combo) return null;
    const w = anim.while || {};
    return { loKey: combo.loKey, hiKey: combo.hiKey, lo: w[combo.loKey], hi: w[combo.hiKey] };
  }

  /** Handle while condition TYPE change (e.g. 'state' → 'above' → 'between') */
  _updateWhileConditionType(index, condType) {
    const updated = [...this.animations];
    const combo = COMBO_WHILE_BOUNDS[condType];
    if (condType === 'none') {
      const { while: _removed, ...rest } = updated[index];
      updated[index] = rest;
    } else if (combo) {
      updated[index] = { ...updated[index], while: { [combo.loKey]: 0, [combo.hiKey]: 100 } };
    } else {
      const currentVal = this._getWhileConditionValue(updated[index]);
      const isNumeric  = NUMERIC_WHILE_TYPES.includes(condType);
      const val = currentVal !== '' ? (isNumeric ? (Number(currentVal) || 0) : currentVal) : (isNumeric ? 0 : '');
      updated[index] = { ...updated[index], while: { [condType]: val } };
    }
    this._workingAnimations = updated;
    this._fireChange();
  }

  /** Handle while condition VALUE change (atomic types only) */
  _updateWhileConditionValue(index, condType, rawValue) {
    const updated  = [...this.animations];
    const isNumeric = NUMERIC_WHILE_TYPES.includes(condType);
    const val = isNumeric ? Number(rawValue) : rawValue;
    updated[index] = { ...updated[index], while: { [condType]: val } };
    this._workingAnimations = updated;
    this._fireChange();
  }

  /** Handle a single bound edit for a combo (range) while condition, keeping the other bound intact */
  _updateWhileConditionBoundValue(index, key, rawValue) {
    const updated = [...this.animations];
    updated[index] = { ...updated[index], while: { ...updated[index].while, [key]: Number(rawValue) } };
    this._workingAnimations = updated;
    this._fireChange();
  }

  _formatPresetName(preset) {
    const names = {
      'pulse': 'Pulse',
      'fade': 'Fade',
      'glow': 'Glow',
      'draw': 'Draw',
      'march': 'Marching Ants',
      'blink': 'Blink',
      'shimmer': 'Shimmer',
      'strobe': 'Strobe',
      'flicker': 'Flicker',
      'cascade': 'Cascade',
      'cascade-color': 'Cascade Colour',
      'ripple': 'Ripple',
      'scale': 'Scale',
      'scale-reset': 'Scale Reset',
      'set': 'Set Properties',
      'motionpath': 'Motion Path',
      'slide': 'Slide',
      'rotate': 'Rotate',
      'shake': 'Shake',
      'bounce': 'Bounce',
      'color-shift': 'Colour Shift',
      'skew': 'Skew',
      'glitch': 'Glitch',
      'stagger-flash': 'Stagger Flash',
      'stagger-grid': 'Stagger Grid',
      'stagger-wave': 'Stagger Wave',
      'stagger-radial': 'Stagger Radial'
    };
    return names[preset] || preset;
  }

  _getAnimationDetails(anim) {
    // Prefer top-level canonical values; fall back to legacy params.X for old configs.
    const params = {
      ...anim.params,
      ...(anim.duration  !== undefined && { duration:  anim.duration  }),
      ...(anim.delay     !== undefined && { delay:     anim.delay     }),
      ...(anim.loop      !== undefined && { loop:      anim.loop      }),
      ...(anim.alternate !== undefined && { alternate: anim.alternate }),
      ...(anim.ease      !== undefined && { ease:      anim.ease      }),
    };
    const parts = [];

    // Show duration if set
    if (params.duration) parts.push(`${params.duration}ms`);

    // Show ease if set
    if (params.ease && params.ease !== 'inOutQuad') parts.push(params.ease);

    // Show loop info
    if (params.loop === true) parts.push('loop: ∞');
    else if (typeof params.loop === 'number' && params.loop > 0) parts.push(`loop: ${params.loop}×`);

    // Show delay if set
    if (params.delay) parts.push(`delay: ${params.delay}ms`);

    // Show alternate if set
    if (params.alternate) parts.push('alternate');

    // Show key preset-specific params
    const preset = anim.preset || 'pulse';
    if (preset === 'pulse' && params.max_scale) parts.push(`scale: ${params.max_scale}`);
    if (preset === 'fade' && params.to !== undefined) parts.push(`opacity: ${params.to}`);
    if (preset === 'scale' && params.scale) parts.push(`scale: ${params.scale}`);

    return parts.length > 0 ? parts.join(' • ') : 'Default settings';
  }

  _getPresetOptions() {
    return [
      // Core Animations
      { value: 'pulse', label: 'Pulse - Breathing scale + brightness' },
      { value: 'fade', label: 'Fade - Opacity transition' },
      { value: 'glow', label: 'Glow - Drop shadow pulsing' },
      { value: 'draw', label: 'Draw - SVG stroke drawing' },
      { value: 'march', label: 'Marching Ants - Dashed line animation' },

      // Visual Effects
      { value: 'blink', label: 'Blink - Rapid opacity toggle' },
      { value: 'shimmer', label: 'Shimmer - Colour + opacity shimmer' },
      { value: 'strobe', label: 'Strobe - Fast flashing' },
      { value: 'flicker', label: 'Flicker - Random flickering' },
      { value: 'cascade', label: 'Cascade - Staggered animation' },
      { value: 'cascade-color', label: 'Cascade Colour - Row-by-row colour cycling' },
      { value: 'ripple', label: 'Ripple - Expanding wave effect' },
      { value: 'scale', label: 'Scale - Simple scale transform' },
      { value: 'scale-reset', label: 'Scale Reset - Return to original' },

      // Motion Effects (NEW - PR#229)
      { value: 'slide', label: 'Slide - Translate/position animation' },
      { value: 'rotate', label: 'Rotate - Rotation animation' },
      { value: 'shake', label: 'Shake - Vibrate/shake effect' },
      { value: 'bounce', label: 'Bounce - Elastic bounce' },
      { value: 'color-shift', label: 'Colour Shift - Pure colour transition' },
      { value: 'skew', label: 'Skew - Slant transformation' },
      { value: 'motionpath', label: 'Motion Path - Follow SVG path' },
      { value: 'sequence', label: 'Sequence - Multi-step timeline of tweens' },
      { value: 'chaos', label: 'Chaos - Randomized multi-property glitch motion' },
      { value: 'glitch', label: 'Glitch - Digital distortion' },
      { value: 'physics-spring', label: 'Physics Spring - Spring physics simulation' },

      // Text Animations (NEW - PR#234)
      { value: 'text-reveal', label: '✨ Text Reveal - Character-by-character reveal' },
      { value: 'text-typewriter', label: '✨ Text Typewriter - Typing effect' },
      { value: 'text-scramble', label: '✨ Text Scramble - Matrix-style scramble' },
      { value: 'text-glitch', label: '✨ Text Glitch - Rapid jitter' },

      // Stagger Animations (NEW - PR#233)
      { value: 'stagger-flash', label: '⚡ Stagger Flash - LCARS chasing bar effect' },
      { value: 'stagger-grid', label: '⚡ Stagger Grid - Grid-based stagger' },
      { value: 'stagger-wave', label: '⚡ Stagger Wave - Wave pattern' },
      { value: 'stagger-radial', label: '⚡ Stagger Radial - Radial burst' },

      // Timeline Animations (NEW - PR#233)
      { value: 'timeline-cascade', label: '🎬 Timeline Cascade - Sequential steps' },
      { value: 'timeline-attention', label: '🎬 Timeline Attention - Attention-getter' },

      // Utility
      { value: 'set', label: 'Set - Immediate property change' }
    ];
  }

  /**
   * Splits dense, multi-clause schema description text (written for accuracy,
   * not UI display — often several sentences with em-dash asides crammed
   * together) into separate sentences, so the info guide can render each as
   * its own line instead of one unbroken wall of text. Splits after
   * `.`/`!`/`?` followed by whitespace and a capital letter or backtick —
   * deliberately conservative so it doesn't break on decimals (`0.5`) or
   * abbreviations; a missed split just leaves two sentences joined, no worse
   * than today.
   * @private
   */
  _splitIntoSentences(text) {
    if (!text) return [];
    return text.split(/(?<=[.!?])\s+(?=[A-Z`])/);
  }

  /**
   * Builds a copy-pasteable example YAML block for a preset, using only
   * fields the schema declares an actual `default` for — inventing a
   * plausible-looking value for a field with no known default (e.g. a
   * required color/from/to) would risk looking like a real value instead of
   * a placeholder, so those are called out by name below the snippet instead
   * of guessed at. Canonical fields (duration/ease/loop/alternate/delay)
   * aren't included either — the schema has no preset-specific default for
   * these (see _CANONICAL_REDECLARED), only the individual preset factory's
   * own JS fallback does, so a generic number here would be a guess.
   * @private
   */
  _buildExampleYaml(preset, presetSchema, paramEntries) {
    const withDefault = paramEntries.filter(([, fieldSchema]) => fieldSchema.default !== undefined);
    const withoutDefault = paramEntries.filter(([, fieldSchema]) => fieldSchema.default === undefined);

    const lines = [
      'animations:',
      '  - trigger: on_load',
      `    preset: ${preset}`
    ];
    if (withDefault.length) {
      lines.push('    params:');
      for (const [key, fieldSchema] of withDefault) {
        lines.push(`      ${key}: ${JSON.stringify(fieldSchema.default)}`);
      }
    }
    return { yaml: lines.join('\n'), missingFields: withoutDefault.map(([key]) => key) };
  }

  /**
   * Collapsible "How this preset works" info guide — sourced entirely from
   * ANIMATION_PRESET_PARAMS_SCHEMAS (the same schema catalog used for
   * validation and, for SCHEMA_DRIVEN_PRESETS, form rendering), so there's a
   * single maintained source of truth instead of a hand-written, easily
   * stale, separately-maintained help-text map (the previous _getPresetHelp()
   * map was missing several presets entirely, e.g. chaos/grid-stagger/sequence
   * — confirmed via diffing against the registry). Applies uniformly to every
   * preset regardless of whether its param UI is schema-driven or still on
   * the legacy hardcoded switch, since it only needs the preset name.
   * @private
   */
  _renderPresetInfoGuide(preset, index) {
    const presetSchema = ANIMATION_PRESET_PARAMS_SCHEMAS[preset];
    if (!presetSchema) return '';

    const expanded = this._expandedGuideIndices.has(index);
    const CANONICAL_KEYS = new Set(['duration', 'ease', 'loop', 'alternate', 'delay']);
    const paramEntries = Object.entries(presetSchema.properties || {})
      .filter(([key]) => !CANONICAL_KEYS.has(key));
    const docsUrl = `${ANIMATION_PRESET_DOCS_URL}#${preset}`;
    const animejsUrl = (preset === 'march' || preset === 'stagger-flash')
      ? null
      : (ANIMEJS_REFERENCE_URLS[preset] || ANIMEJS_DEFAULT_REFERENCE_URL);
    const { yaml: exampleYaml, missingFields } = this._buildExampleYaml(preset, presetSchema, paramEntries);

    return html`
      <div class="preset-info-guide">
        <div class="preset-info-guide-header"
             @click=${() => this._toggleGuideExpanded(index)}>
          <ha-icon icon="mdi:information-outline"></ha-icon>
          <span>How ${preset} works</span>
          <ha-icon
            icon="mdi:chevron-down"
            class="guide-chevron ${expanded ? 'expanded' : ''}">
          </ha-icon>
        </div>
        ${expanded ? html`
          <div class="preset-info-guide-body">
            ${this._splitIntoSentences(presetSchema.description).map(sentence => html`<p>${sentence}</p>`)}
            ${paramEntries.length ? html`
              <strong>Params:</strong>
              <ul>
                ${paramEntries.map(([key, fieldSchema]) => html`
                  <li>
                    <code>${key}</code>${fieldSchema.default !== undefined ? html` (default: <code>${JSON.stringify(fieldSchema.default)}</code>)` : ''}
                    ${fieldSchema.description ? ` — ${fieldSchema.description}` : ''}
                  </li>
                `)}
              </ul>
            ` : ''}
            <strong>Example:</strong>
            <pre class="preset-info-guide-example">${exampleYaml}</pre>
            ${missingFields.length ? html`
              <p class="preset-info-guide-missing-note">
                No known default to show for: ${missingFields.map(f => html`<code>${f}</code>`)} — add these yourself before using this example.
              </p>
            ` : ''}
            ${this._renderMapRangeNote()}
            <div class="preset-info-guide-links">
              <a href=${docsUrl} target="_blank" rel="noopener noreferrer">View full docs →</a>
              ${animejsUrl ? html`<a href=${animejsUrl} target="_blank" rel="noopener noreferrer">anime.js reference →</a>` : ''}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Entity-reactive parameters note — map_range lets `duration`, `delay`,
   * or any preset param (resolveAnimParams.js walks all three) live-track
   * an entity's value instead of being a static number, e.g. animation
   * speed scaling with power draw. Not GUI-editable (no form field for it
   * anywhere in this editor) — this is purely a discoverability note so
   * users know it exists and where to add it, mirroring
   * lcards-background-animation-editor.js's _renderEntityBindingNote() for
   * the same gap in that sibling editor. `entity` is required here (unlike
   * that editor's own note, which can omit it and default to the card's
   * bound entity) — resolveAnimParams.js has no such fallback.
   * @returns {TemplateResult}
   * @private
   */
  _renderMapRangeNote() {
    return html`
      <lcards-message type="info">
        <strong>Entity-reactive parameters:</strong> <code>duration</code>, <code>delay</code>, and any preset param above can live-track an entity's value instead of a fixed number — edit this animation's YAML directly to use it:<br><br>
        <code>speed: { map_range: { entity: sensor.grid_power, input: [0, 5000], output: [8, 0.5] } }</code><br><br>
        <code>output</code> can also be a two-color pair (<code>['#00ff88', '#ff4400']</code>) to interpolate color instead of a number.
      </lcards-message>
    `;
  }

  _toggleGuideExpanded(index) {
    const updated = new Set(this._expandedGuideIndices);
    if (updated.has(index)) {
      updated.delete(index);
    } else {
      updated.add(index);
    }
    this._expandedGuideIndices = updated;
  }

  _isPlaceholderPreset(preset) {
    // All core presets are now implemented
    return false;
  }

  _toggleExpanded(index) {
    this._expandedIndex = this._expandedIndex === index ? null : index;
    this._pendingDeleteIndex = null;
  }

  _addAnimation() {
    console.log('[AnimationEditor] 🎬 Add Animation button clicked!', {
      currentAnimations: this.animations.length,
      expandedIndex: this._expandedIndex
    });

    const newAnimation = {
      trigger: 'on_load',
      preset: 'pulse',
      duration: 1000,
      ease: 'inOutQuad',
      loop: true,
      alternate: true,
      params: {}
    };

    this._workingAnimations = [...this.animations, newAnimation];
    this._expandedIndex = this.animations.length - 1;

    lcardsLog.debug('[AnimationEditor] Animation added', {
      newCount: this.animations.length,
      newExpandedIndex: this._expandedIndex,
      newAnimation
    });

    this._fireChange();
    this.requestUpdate(); // Force re-render
  }

  _duplicateAnimation(e, index) {
    e.stopPropagation();
    const source = this.animations[index];
    const duplicate = JSON.parse(JSON.stringify(source)); // Deep clone

    this._workingAnimations = [
      ...this.animations.slice(0, index + 1),
      duplicate,
      ...this.animations.slice(index + 1)
    ];
    this._expandedIndex = index + 1;
    this._fireChange();
  }

  _deleteAnimation(e, index) {
    e.stopPropagation();
    this._workingAnimations = this.animations.filter((_, i) => i !== index);
    if (this._expandedIndex === index) {
      this._expandedIndex = null;
    } else if (this._expandedIndex > index) {
      this._expandedIndex--;
    }
    this._pendingDeleteIndex = null;
    this._fireChange();
  }

  _confirmDelete(index) {
    const e = { stopPropagation: () => {} };
    this._deleteAnimation(e, index);
  }

  _toggleEnabled(e, index) {
    e.stopPropagation();
    this._setEnabled(index, this.animations[index].enabled !== false ? false : undefined);
  }

  _setEnabled(index, value) {
    const updated = [...this.animations];
    const anim = { ...updated[index] };
    if (value === false) {
      anim.enabled = false;
    } else {
      // Remove enabled key entirely so YAML stays clean
      delete anim.enabled;
    }
    updated[index] = anim;
    this._workingAnimations = updated;
    this._fireChange();
  }

  _validateAnimationId(id, currentIndex) {
    if (!id) return null;
    // Only letters, numbers, hyphens, underscores
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      return 'ID can only contain letters, numbers, hyphens (-) and underscores (_). No spaces or special characters.';
    }
    // Check for duplicate IDs among all animations at other indices
    const allAnimations = this._workingAnimations || [];
    const duplicate = allAnimations.some((anim, i) => i !== currentIndex && anim.id === id);
    if (duplicate) {
      return `ID "${id}" is already used by another animation.`;
    }
    return null;
  }

  _handleIdChange(index, rawValue) {
    const value = rawValue?.trim() || undefined;
    // Always update working state so the field reflects user input
    const updated = [...this.animations];
    updated[index] = { ...updated[index], id: value };
    this._workingAnimations = updated;
    this.requestUpdate();
    // Only persist to config if ID is valid (or cleared)
    if (!value || !this._validateAnimationId(value, index)) {
      this._fireChange();
    }
  }

  _updateAnimation(index, key, value) {
    const updated = [...this.animations];
    updated[index] = { ...updated[index], [key]: value };
    this._workingAnimations = updated;
    this._fireChange();
  }

  _updatePreset(index, newPreset) {
    const updated = [...this.animations];
    const current = updated[index];
    if (current.preset === newPreset) return;
    // Preset-specific fields never carry meaning across a different preset (e.g.
    // pulse's max_scale/max_brightness are meaningless to sequence or physics-spring)
    // and left-behind values only cause confusion or, for presets that assume specific
    // params shapes (e.g. sequence's steps array), runtime failures. Canonical fields
    // (trigger/duration/loop/alternate/delay/ease/target/targets/id/enabled) all live
    // at the top level and are untouched by a preset switch.
    updated[index] = { ...current, preset: newPreset, params: {} };
    this._workingAnimations = updated;
    this._fireChange();
  }

  _updateParam(index, paramKey, value) {
    // These are canonical top-level animation fields, not preset-specific params.
    // Always write them at the top level so TriggerManager and AnimationManager
    // both see them consistently.
    const TOP_LEVEL_KEYS = ['loop', 'alternate', 'duration', 'delay', 'ease'];
    if (TOP_LEVEL_KEYS.includes(paramKey)) {
      return this._updateAnimation(index, paramKey, value);
    }

    const updated = [...this.animations];
    updated[index] = {
      ...updated[index],
      params: {
        ...updated[index].params,
        [paramKey]: value
      }
    };
    this._workingAnimations = updated;
    this._fireChange();
  }

  _toggleCustomMode(index, isCustom) {
    const updated = [...this.animations];
    if (isCustom) {
      // Convert preset to custom
      updated[index] = {
        trigger: updated[index].trigger || 'on_load',
        type: 'custom',
        animejs: {
          targets: '#your-overlay-id',
          scale: [1, 1.1, 1],
          duration: 1000,
          loop: true
        }
      };
    } else {
      // Convert custom to preset
      const { type, animejs, ...rest } = updated[index];
      updated[index] = {
        ...rest,
        preset: 'pulse',
        duration: 1000,
        loop: true,
        params: {}
      };
    }
    this._workingAnimations = updated;
    this._fireChange();
  }

  // ha-yaml-editor's value-changed already hands back a parsed value (its
  // caller only forwards here when e.detail.isValid !== false) — no JSON.parse
  // needed, unlike the old plain-text-input version of this handler.
  _updateCustomConfig(index, config) {
    const updated = [...this.animations];
    updated[index] = {
      ...updated[index],
      animejs: config
    };
    this._workingAnimations = updated;
    this._fireChange();
  }

  _fireChange() {
    this.dispatchEvent(new CustomEvent('animations-changed', {
      detail: { value: this.animations },
      bubbles: true,
      composed: true
    }));
  }

  // ============================================================================
  // TARGET SELECTION METHODS
  // ============================================================================

  /**
   * Render target selection section
   * @param {Object} animation - Animation config object
   * @param {number} index - Animation index in array
   * @returns {TemplateResult}
   */
  _renderTargetSelector(animation, index) {
    const targetMode = animation.targets ? 'multiple' : 'single';

    // Collapsed by default — expanded (Single/Multiple picker) is easy to mistake
    // for something you need to interact with, and clicking around in it risks
    // setting an explicit target by accident. Leaving it collapsed with a plain
    // "Default (this element)" label makes the common case (do nothing) obvious
    // without inviting a click; it only auto-expands once a real target is set,
    // same convention as the Stacking Order (z_index) section's secondary label.
    const hasExplicitTarget = !!(animation.target || (Array.isArray(animation.targets) ? animation.targets.length > 0 : animation.targets));
    // "Target" is already the section header (lcards-form-section renders header
    // + secondary side by side) — don't repeat the word here.
    const secondaryText = !hasExplicitTarget
      ? 'Default (this element)'
      : (animation.targets
          ? Array.isArray(animation.targets) ? animation.targets.join(', ') : animation.targets
          : animation.target);

    return html`
      <lcards-form-section
        header="Target"
        icon="mdi:crosshairs-gps"
        description="Select which element(s) to animate"
        secondary=${secondaryText}
        ?expanded=${hasExplicitTarget}>

        <lcards-message
            type="info"
            message="If the element list below looks empty or incomplete, click Refresh — the live preview reloads periodically and this list can go stale.">
        </lcards-message>
        <ha-button
            outlined
            @click=${() => {
              // Just re-rendering this component isn't enough — .cardElement is
              // a reference the PARENT (Studio dialog) passes in, re-fetched via
              // its own _getLivePreviewCardElement() only when IT re-renders.
              // The live preview replaces the whole <lcards-msd-card> element on
              // every reload, so re-rendering here alone would keep re-querying
              // the same stale/detached reference. Ask the parent to refresh it.
              this.dispatchEvent(new CustomEvent('refresh-targets', { bubbles: true, composed: true }));
            }}>
          <ha-icon icon="mdi:refresh" slot="icon"></ha-icon>
          Refresh Element List
        </ha-button>

        <div class="mode-selector">
          <ha-radio-group
            .value=${targetMode}
            @change=${e => this._setTargetMode(index, e.target.value)}>
            <ha-radio-option value="single">Single Element</ha-radio-option>
            <ha-radio-option value="multiple">Multiple Elements</ha-radio-option>
          </ha-radio-group>
        </div>

        ${targetMode === 'single'
          ? this._renderSingleTarget(animation, index)
          : this._renderMultipleTargets(animation, index)
        }
      </lcards-form-section>
    `;
  }

  /**
   * Render single target mode UI
   * @param {Object} animation
   * @param {number} index
   * @returns {TemplateResult}
   */
  _renderSingleTarget(animation, index) {
    const options = this._getTargetOptions();
    const currentValue = animation.target || null;

    return html`
      <ha-selector
        .hass=${this.hass}
        .selector=${{
          select: {
            mode: 'dropdown',
            custom_value: true,
            options: [
              { value: '_default', label: 'Card (Default)' },
              ...options
            ]
          }
        }}
        .value=${currentValue === null ? '_default' : currentValue}
        .label=${'Target Element'}
        @value-changed=${(e) => this._updateTarget(index, e.detail.value)}
      ></ha-selector>

      <div class="help-text">
        ${currentValue && currentValue !== '_default'
          ? this._renderValidation(currentValue)
          : html`<span>Leave empty to use card's default animation target</span>`
        }
      </div>
    `;
  }

  /**
   * Render multiple targets mode UI
   * @param {Object} animation
   * @param {number} index
   * @returns {TemplateResult}
   */
  _renderMultipleTargets(animation, index) {
    const options = this._getTargetOptions();
    const targets = animation.targets || [];

    return html`
      <div class="target-list">
        ${targets.map((target, targetIndex) => html`
          <div class="target-item">
            <ha-selector
              .hass=${this.hass}
              .selector=${{
                select: {
                  mode: 'dropdown',
                  custom_value: true,
                  options: options
                }
              }}
              .value=${target}
              .label=${`Target ${targetIndex + 1}`}
              @value-changed=${(e) => this._updateTargetItem(index, targetIndex, e.detail.value)}
            ></ha-selector>

            <ha-icon-button
              .label=${'Remove target'}
              @click=${() => this._removeTarget(index, targetIndex)}
            >
              <ha-icon icon="mdi:close"></ha-icon>
            </ha-icon-button>
          </div>
        `)}

        <ha-button
          outlined
          @click=${() => this._addTarget(index)}
        >
          <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
          Add Target
        </ha-button>

        ${targets.length > 0 ? this._renderMultiTargetValidation(targets) : ''}
      </div>
    `;
  }

  /**
   * Get list of available target options from card's shadow DOM
   * @returns {Array<{value: string, label: string}>}
   */
  _getTargetOptions() {
    const options = [];

    // Check if we have card element access
    if (!this.cardElement) {
      lcardsLog.warn('[AnimationEditor] No card element provided for target discovery');
      return options;
    }

    const fullRoot = this.cardElement.shadowRoot || this.cardElement.renderRoot;

    if (!fullRoot) {
      lcardsLog.warn('[AnimationEditor] Card element has no shadow/render root:', {
        element: this.cardElement.tagName,
        hasShadowRoot: !!this.cardElement.shadowRoot,
        hasRenderRoot: !!this.cardElement.renderRoot
      });
      return options;
    }

    // Optionally scope discovery to a sub-element (e.g. MSD's base_svg group)
    // instead of the whole card, so this only ever offers targets that will
    // actually resolve for whichever scope this animation gets registered
    // against — otherwise a target picked from elsewhere on the card would
    // silently fail to resolve at runtime (no error, just no match).
    let root = fullRoot;
    if (this.searchRootSelector) {
      const scopedRoot = fullRoot.querySelector(this.searchRootSelector);
      if (scopedRoot) {
        root = scopedRoot;
        this._targetRediscoveryAttempts = 0;
      } else {
        lcardsLog.warn('[AnimationEditor] searchRootSelector not found, falling back to whole-card discovery:', {
          searchRootSelector: this.searchRootSelector
        });
        this._requestTargetRediscovery();
      }
    }

    try {
      // Discover all elements with ID attributes OR data-* id attributes
      const elementsWithId = root.querySelectorAll('[id], [data-button-id], [data-overlay-id], [data-segment-id], [data-lcards-segment]');

      elementsWithId.forEach(el => {
        // Priority: id > data-button-id > data-overlay-id > data-segment-id > data-lcards-segment
        const id = el.id || el.getAttribute('data-button-id') || el.getAttribute('data-overlay-id') || el.getAttribute('data-segment-id') || el.getAttribute('data-lcards-segment');
        const tagName = el.tagName.toLowerCase();

        // Safely get class names (handle SVG elements where className is SVGAnimatedString)
        let classes = '';
        if (el.classList && el.classList.length > 0) {
          classes = '.' + Array.from(el.classList).join('.');
        }

        // Skip internal framework IDs (if any)
        if (id && (id.startsWith('_') || id.startsWith('ha-'))) {
          return;
        }

        if (id) {
          options.push({
            value: `#${id}`,
            label: `#${id} <${tagName}>${classes || ''}`
          });
        }
      });

      // Discover text field elements (SVG <text> and background <rect> with data-field-id)
      const textFieldElements = root.querySelectorAll('[data-field-id]');
      const seenFieldIds = new Set();
      textFieldElements.forEach(el => {
        const fieldId = el.getAttribute('data-field-id');
        if (!fieldId || seenFieldIds.has(fieldId)) return;
        seenFieldIds.add(fieldId);
        const tagName = el.tagName.toLowerCase();
        const isBackground = fieldId.endsWith('-bg');
        const prefix = isBackground ? 'text-bg' : 'text';
        options.push({
          value: `[data-field-id="${fieldId}"]`,
          label: `[${prefix}] ${fieldId} <${tagName}>`
        });
      });

      // Also scan for elements with CSS classes for more flexibility
      const elementsWithClass = root.querySelectorAll('[class]');
      const seenClasses = new Set();

      elementsWithClass.forEach(el => {
        const classList = Array.from(el.classList);
        classList.forEach(cls => {
          // Skip generic/common classes
          if (cls && !seenClasses.has(cls) && !cls.startsWith('_') && !cls.match(/^(ha-|mdc-|button-svg)/)) {
            seenClasses.add(cls);
            const tagName = el.tagName.toLowerCase();
            options.push({
              value: `.${cls}`,
              label: `.${cls} <${tagName}>`
            });
          }
        });
      });

      // Discover generic tag-based selectors (e.g. "path" matches every <path>
      // element at once) — a bulk-targeting shortcut for animations meant to
      // apply to many/all elements of a kind (e.g. "draw" across every path in
      // an SVG), without needing to individually pick each one via id/class.
      const EXCLUDED_TAGS = new Set(['svg', 'defs', 'style', 'script', 'title', 'desc', 'metadata', 'symbol']);
      const tagCounts = new Map();
      root.querySelectorAll('*').forEach(el => {
        const tag = el.tagName.toLowerCase();
        if (EXCLUDED_TAGS.has(tag)) return;
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
      tagCounts.forEach((count, tag) => {
        options.push({
          value: tag,
          label: `All <${tag}> elements (${count} found)`,
          isTagOption: true
        });
      });

      // NOTE: a "Top-level <tag> only, excluding nested" bulk option (via a
      // :scope-based CSS trick) was tried here and removed — it still produced
      // incorrect scaling/positioning even after fixing an initial scoping bug,
      // and wasn't worth further speculative CSS-selector debugging without a
      // way to test live in a browser. For animations that need to target a
      // specific element within a nested group structure (e.g. a whole SVG's
      // outermost group, to avoid compounding transforms on its own nested
      // children), pick that element's specific #id from the list instead —
      // already confirmed reliable, and it's how targeting works everywhere
      // else in the app.

      lcardsLog.debug('[AnimationEditor] Discovered targets:', {
        count: options.length
      });

    } catch (error) {
      lcardsLog.error('[AnimationEditor] Error discovering targets:', error);
    }

    // Sort "All <tag> elements" bulk options to the top (as their own
    // alphabetical group), then everything else alphabetically after them.
    options.sort((a, b) => {
      if (!!a.isTagOption !== !!b.isTagOption) return a.isTagOption ? -1 : 1;
      return a.label.localeCompare(b.label);
    });

    return options;
  }

  /**
   * Self-heal a failed scoped target lookup by asking the parent to refresh
   * .cardElement — exactly what the manual "Refresh Element List" button
   * does (see its click handler for why re-rendering this component alone
   * can't fix it: .cardElement is a reference the parent owns, and the live
   * preview replaces the whole <lcards-msd-card> element on every reload).
   *
   * This runs from within _getTargetOptions() itself rather than being
   * triggered by a guessed proxy event (e.g. "tab just switched to
   * Animation") — a target section only actually queries the DOM once its
   * "Target" sub-section is expanded (it's collapsed by default until a
   * target is set), which can happen well after the tab switch and after
   * .cardElement has already gone stale again. Reacting to the real failure
   * itself, whenever it happens, covers every trigger path uniformly.
   *
   * Also force our own re-render unconditionally, not just the parent's —
   * if the parent recomputes the exact same .cardElement reference (element
   * wasn't swapped, its internal content just wasn't finished rendering yet
   * at the last query), Lit's property diffing sees no change and would
   * never re-invoke our render()/_getTargetOptions() again on its own.
   *
   * Bounded (10 attempts, 250ms apart — reset to 0 on the next successful
   * lookup) so a selector that never resolves (e.g. the overlay was deleted
   * mid-edit) doesn't retry forever.
   * @private
   */
  _requestTargetRediscovery() {
    if (this._targetRediscoveryTimer || this._targetRediscoveryAttempts >= 10) {
      return;
    }
    this._targetRediscoveryAttempts++;
    this._targetRediscoveryTimer = setTimeout(() => {
      this._targetRediscoveryTimer = null;
      this.dispatchEvent(new CustomEvent('refresh-targets', { bubbles: true, composed: true }));
      this.requestUpdate();
    }, 250);
  }

  /**
   * Set target mode (single vs multiple)
   * @param {number} index - Animation index
   * @param {string} mode - 'single' or 'multiple'
   */
  _setTargetMode(index, mode) {
    const animations = [...this.animations];
    const animation = { ...animations[index] };  // shallow copy to avoid mutating frozen objects
    animations[index] = animation;

    if (mode === 'single') {
      // Convert to single mode
      const firstTarget = animation.targets?.[0] || '';
      animation.target = firstTarget;
      delete animation.targets;
    } else {
      // Convert to multiple mode
      const currentTarget = animation.target || '';
      animation.targets = currentTarget ? [currentTarget] : [];
      delete animation.target;
    }

    this._workingAnimations = animations;
    this._fireChange();
  }

  /**
   * Update single target value
   * @param {number} index
   * @param {string} value
   */
  _updateTarget(index, value) {
    const animations = [...this.animations];
    const animation = { ...animations[index] };  // shallow copy to avoid mutating frozen objects
    animations[index] = animation;

    if (value === '' || value === null || value === '_default') {
      // Remove target field to use default
      delete animation.target;
    } else {
      animation.target = value;
    }

    // Remove targets array if switching from multiple mode
    delete animation.targets;

    this._workingAnimations = animations;
    this._fireChange();
  }

  /**
   * Add new target to multiple targets array
   * @param {number} index
   */
  _addTarget(index) {
    const animations = [...this.animations];
    const animation = { ...animations[index] };  // shallow copy to avoid mutating frozen objects
    animation.targets = animation.targets ? [...animation.targets] : [];
    animations[index] = animation;

    animation.targets.push('');  // Empty string for user to fill

    this._workingAnimations = animations;
    this._fireChange();
  }

  /**
   * Update specific target in multiple targets array
   * @param {number} animIndex
   * @param {number} targetIndex
   * @param {string} value
   */
  _updateTargetItem(animIndex, targetIndex, value) {
    const animations = [...this.animations];
    const animation = { ...animations[animIndex] };  // shallow copy to avoid mutating frozen objects
    animation.targets = animation.targets ? [...animation.targets] : [];
    animations[animIndex] = animation;

    animation.targets[targetIndex] = value;

    this._workingAnimations = animations;
    this._fireChange();
  }

  /**
   * Remove target from multiple targets array
   * @param {number} animIndex
   * @param {number} targetIndex
   */
  _removeTarget(animIndex, targetIndex) {
    const animations = [...this.animations];
    const animation = { ...animations[animIndex] };  // shallow copy to avoid mutating frozen objects
    animations[animIndex] = animation;

    if (animation.targets) {
      animation.targets = [...animation.targets];
      animation.targets.splice(targetIndex, 1);

      // Clean up empty array
      if (animation.targets.length === 0) {
        delete animation.targets;
      }
    }

    this._workingAnimations = animations;
    this._fireChange();
  }

  /**
   * Validate CSS selector against card's shadow DOM
   * @param {string} selector
   * @returns {Object} {valid: boolean, count: number, message: string}
   * @private
   */
  _validateSelector(selector) {
    if (!selector) {
      return { valid: true, count: 0, message: '', type: null };
    }

    if (!this.cardElement?.shadowRoot && !this.cardElement?.renderRoot) {
      return {
        valid: false,
        count: 0,
        message: 'Cannot validate — card preview not available',
        type: 'warning'
      };
    }

    const root = this.cardElement.shadowRoot || this.cardElement.renderRoot;

    try {
      const matches = root.querySelectorAll(selector);
      const count = matches.length;

      if (count === 0) {
        return {
          valid: true,  // Valid syntax, just no matches
          count: 0,
          message: 'No elements match this selector',
          type: 'warning'
        };
      }

      return {
        valid: true,
        count: count,
        message: `${count} element${count === 1 ? '' : 's'} matched`,
        type: 'success'
      };

    } catch (error) {
      return {
        valid: false,
        count: 0,
        message: `Invalid selector: ${error.message}`,
        type: 'error'
      };
    }
  }

  /**
   * Render validation message for single selector
   */
  _renderValidation(selector) {
    const validation = this._validateSelector(selector);
    if (!validation.type) return html``;

    return html`
      <lcards-message type=${validation.type} .message=${validation.message}></lcards-message>
    `;
  }

  /**
   * Render validation for multiple targets
   */
  _renderMultiTargetValidation(targets) {
    let totalCount = 0;
    let hasErrors = false;

    targets.forEach(selector => {
      const result = this._validateSelector(selector);
      if (!result.valid) {
        hasErrors = true;
      }
      totalCount += result.count;
    });

    if (hasErrors) {
      return html`<lcards-message type="error" message="Some selectors are invalid"></lcards-message>`;
    }
    if (totalCount === 0) {
      return html`<lcards-message type="warning" message="No elements match any selector"></lcards-message>`;
    }
    return html`<lcards-message type="success" message="${totalCount} total element${totalCount === 1 ? '' : 's'} matched"></lcards-message>`;
  }
}

if (!customElements.get('lcards-animation-editor')) customElements.define('lcards-animation-editor', LCARdSAnimationEditor);
