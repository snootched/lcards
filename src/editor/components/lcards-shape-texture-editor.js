/**
 * @fileoverview Shape texture configuration editor component.
 *
 * Provides UI for configuring SVG-native shape texture presets on
 * button and elbow cards.
 *
 * Usage:
 * ```html
 * <lcards-shape-texture-editor
 *   .hass=${this.hass}
 *   .config=${config.shape_texture}
 *   @texture-changed=${(e) => this._handleTextureChanged(e.detail.value)}
 * ></lcards-shape-texture-editor>
 * ```
 */

import { LitElement, html, css } from 'lit';
import { CANVAS_TEXTURE_PRESETS } from '../../core/packs/textures/presets/index.js';
import './shared/lcards-color-picker.js';
import './shared/lcards-form-section.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const BLEND_MODE_OPTIONS = [
    { value: 'normal',      label: 'Normal',      hint: 'Texture draws directly over the button fill (default)' },
    { value: 'screen',      label: 'Screen',       hint: 'Lightens underlying colour — great for glows on dark buttons' },
    { value: 'overlay',     label: 'Overlay',      hint: 'Increases contrast — dark areas darker, light areas lighter' },
    { value: 'multiply',    label: 'Multiply',     hint: 'Darkens — useful for shadow or vignette effects' },
    { value: 'hard-light',  label: 'Hard Light',   hint: 'Strong contrast boost, more vivid than Overlay' },
    { value: 'soft-light',  label: 'Soft Light',   hint: 'Gentle contrast variation, subtle and natural' },
    { value: 'color-dodge', label: 'Color Dodge',  hint: 'Brightens dramatically — great for energy/shimmer effects' },
    { value: 'color-burn',  label: 'Color Burn',   hint: 'Darkens and saturates — intense shadow effect' },
];

// Presets that have a scrolling animation speed multiplier
const ANIMATED_PRESETS = new Set(['grid', 'diagonal', 'hexagonal', 'dots', 'fluid', 'shimmer', 'plasma', 'flow', 'level', 'scanlines']);

// Presets that use turbulence (their own speed param rather than scroll_speed_x/y)
const TURBULENCE_PRESETS = new Set(['fluid', 'plasma', 'flow']);

// ─── Component ────────────────────────────────────────────────────────────────

export class LCARdSShapeTextureEditor extends LitElement {
    static get properties() {
        return {
            hass:   { type: Object },
            config: { type: Object }
        };
    }

    static get styles() {
        return css`
            :host { display: block; width: 100%; }

            .row { margin-bottom: 12px; }

            .blend-hint {
                font-size: 12px;
                color: var(--secondary-text-color);
                margin-top: 4px;
                padding: 6px 10px;
                border-left: 3px solid var(--primary-color, #4c9be8);
                background: var(--secondary-background-color, rgba(255,255,255,0.04));
                border-radius: 0 4px 4px 0;
                line-height: 1.4;
            }

            .disabled-hint {
                font-size: 13px;
                color: var(--secondary-text-color);
                padding: 8px 0;
            }

            ha-selector { width: 100%; display: block; }
        `;
    }

    constructor() {
        super();
        /** @type {any} */
        this.hass = undefined;
        /** @type {any} */
        this.config = undefined;
    }

    // ─── Event helpers ────────────────────────────────────────────────────────

    _emit(value) {
        this.dispatchEvent(new CustomEvent('texture-changed', {
            detail: { value },
            bubbles: true,
            composed: true
        }));
    }

    _update(key, value) {
        // @ts-ignore - TS2339: auto-suppressed
        this._emit({ ...(this.config || {}), [key]: value });
    }

    _updatePresetConfig(key, value) {
        // @ts-ignore - TS2339: auto-suppressed
        const current = this.config || {};
        const cfg     = current.config || {};
        this._emit({ ...current, config: { ...cfg, [key]: value } });
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    render() {
        // @ts-ignore - TS2339: auto-suppressed
        const enabled      = !!(this.config?.preset);
        // @ts-ignore - TS2339: auto-suppressed
        const preset       = this.config?.preset || '';
        const presetDef    = CANVAS_TEXTURE_PRESETS[preset];
        // @ts-ignore - TS2339: auto-suppressed
        const presetConfig = this.config?.config || {};
        const defaults     = presetDef?.defaults || {};

        const presetOptions = Object.entries(CANVAS_TEXTURE_PRESETS).map(([key, def]) => ({
            value: key,
            label: def.name,
            description: def.description
        }));

        // @ts-ignore - TS2339: auto-suppressed
        const blendMode = this.config?.mix_blend_mode ?? 'normal';
        const blendHint = BLEND_MODE_OPTIONS.find(m => m.value === blendMode)?.hint ?? '';

        // Evaluate preset-specific settings once to avoid double-call
        const presetSettings = preset ? this._renderPresetSettings(preset, presetConfig, defaults) : null;

        return html`
            <!-- ── Enable toggle ─────────────────────────────────── -->
            <div class="row">
                <ha-selector
                    // @ts-ignore - TS2339: auto-suppressed
                    .hass=${this.hass}
                    .selector=${{ boolean: {} }}
                    .value=${enabled}
                    .label=${'Enable Shape Texture'}
                    .helper=${'Renders an SVG pattern or animation inside the button shape boundary'}
                    @value-changed=${(e) => {
                        if (!e.detail.value) {
                            this._emit(null);
                        } else {
                            this._emit({
                                preset: 'shimmer',
                                opacity: 0.45,
                                config: { ...CANVAS_TEXTURE_PRESETS['shimmer'].defaults }
                            });
                        }
                    }}
                ></ha-selector>
            </div>

            ${enabled ? html`

                <!-- ══ PRESET ════════════════════════════════════ -->
                <lcards-form-section header="Preset" ?expanded=${true}>
                    <div class="row">
                        <ha-selector
                            // @ts-ignore - TS2339: auto-suppressed
                            .hass=${this.hass}
                            .selector=${{ select: { options: presetOptions, mode: 'dropdown' } }}
                            .value=${preset}
                            .label=${'Texture Preset'}
                            .helper=${presetDef?.description ?? ''}
                            @value-changed=${(e) => {
                                const newPreset = e.detail.value;
                                const newDef    = CANVAS_TEXTURE_PRESETS[newPreset];
                                // Completely replace config with new preset defaults — no key pollution
                                this._emit({
                                    preset:        newPreset,
                                    // @ts-ignore - TS2339: auto-suppressed
                                    opacity:       this.config?.opacity       ?? 0.3,
                                    // @ts-ignore - TS2339: auto-suppressed
                                    mix_blend_mode: this.config?.mix_blend_mode ?? 'normal',
                                    config:        { ...(newDef?.defaults || {}) }
                                });
                            }}
                        ></ha-selector>
                    </div>
                </lcards-form-section>

                <!-- ══ APPEARANCE ════════════════════════════════ -->
                <lcards-form-section header="Appearance" ?expanded=${true}>

                    <!-- Color (not shown for presets that manage their own colors) -->
                    ${presetDef && !['plasma', 'level'].includes(preset) ? html`
                        <div class="row">
                            <lcards-color-picker
                                // @ts-ignore - TS2339: auto-suppressed
                                .hass=${this.hass}
                                .label=${'Texture Color'}
                                .value=${presetConfig.color ?? defaults.color ?? 'rgba(255,255,255,0.3)'}
                                @value-changed=${(e) => this._updatePresetConfig('color', e.detail.value)}
                            ></lcards-color-picker>
                        </div>
                    ` : ''}

                    <!-- Plasma dual colors -->
                    ${preset === 'plasma' ? html`
                        <div class="row">
                            // @ts-ignore - TS2339: auto-suppressed
                            <lcards-color-picker .hass=${this.hass} .label=${'Color A'}
                                .value=${presetConfig.color_a ?? defaults.color_a ?? 'rgba(80,0,255,0.9)'}
                                @value-changed=${(e) => this._updatePresetConfig('color_a', e.detail.value)}
                            ></lcards-color-picker>
                        </div>
                        <div class="row">
                            // @ts-ignore - TS2339: auto-suppressed
                            <lcards-color-picker .hass=${this.hass} .label=${'Color B'}
                                .value=${presetConfig.color_b ?? defaults.color_b ?? 'rgba(255,40,120,0.9)'}
                                @value-changed=${(e) => this._updatePresetConfig('color_b', e.detail.value)}
                            ></lcards-color-picker>
                        </div>
                    ` : ''}

                    <!-- Level fill + gradient colors -->
                    ${preset === 'level' ? html`
                        <div class="row">
                            // @ts-ignore - TS2339: auto-suppressed
                            <lcards-color-picker .hass=${this.hass} .label=${'Fill Colour'}
                                .value=${presetConfig.color_a ?? presetConfig.color ?? defaults.color_a ?? 'rgba(0,200,100,0.7)'}
                                @value-changed=${(e) => this._updatePresetConfig('color_a', e.detail.value)}
                            ></lcards-color-picker>
                        </div>
                        <div class="row">
                            // @ts-ignore - TS2339: auto-suppressed
                            <lcards-color-picker .hass=${this.hass} .label=${'Edge Tint (optional gradient)'}
                                .value=${presetConfig.color_b ?? defaults.color_b ?? ''}
                                @value-changed=${(e) => this._updatePresetConfig('color_b', e.detail.value || null)}
                            ></lcards-color-picker>
                        </div>
                        <div class="row">
                            // @ts-ignore - TS2339: auto-suppressed
                            <ha-selector .hass=${this.hass}
                                .selector=${{ number: { min: 0, max: 100, step: 1, mode: 'slider' } }}
                                .value=${presetConfig.gradient_crossover ?? defaults.gradient_crossover ?? 80}
                                .label=${'Gradient Crossover (%)'}
                                .helper=${'How far from the wave the colour blend starts · only active when Edge Tint is set'}
                                @value-changed=${(e) => this._updatePresetConfig('gradient_crossover', e.detail.value)}
                            ></ha-selector>
                        </div>
                    ` : ''}

                    <!-- Opacity -->
                    <div class="row">
                        <ha-selector
                            // @ts-ignore - TS2339: auto-suppressed
                            .hass=${this.hass}
                            .selector=${{ number: { min: 0, max: 1, step: 0.05, mode: 'slider' } }}
                            // @ts-ignore - TS2339: auto-suppressed
                            .value=${this.config?.opacity ?? 0.3}
                            .label=${'Opacity'}
                            .helper=${'0 = invisible · 1 = fully opaque'}
                            @value-changed=${(e) => this._update('opacity', e.detail.value)}
                        ></ha-selector>
                    </div>

                    <!-- Blend Mode -->
                    <div class="row">
                        <ha-selector
                            // @ts-ignore - TS2339: auto-suppressed
                            .hass=${this.hass}
                            .selector=${{ select: {
                                options: BLEND_MODE_OPTIONS.map(m => ({ value: m.value, label: m.label })),
                                mode: 'dropdown'
                            } }}
                            .value=${blendMode}
                            .label=${'Blend Mode'}
                            .helper=${'Controls how the texture layer is composited over the button fill colour'}
                            @value-changed=${(e) => this._update('mix_blend_mode', e.detail.value)}
                        ></ha-selector>
                        ${blendMode !== 'normal' ? html`<div class="blend-hint">${blendHint}</div>` : ''}
                    </div>

                </lcards-form-section>

                <!-- ══ ANIMATION ══════════════════════════════════ -->
                ${ANIMATED_PRESETS.has(preset) ? html`
                    <lcards-form-section header="Animation" ?expanded=${true}>

                        <!-- Global speed multiplier (non-turbulence animated presets) -->
                        ${!TURBULENCE_PRESETS.has(preset) ? html`
                            <div class="row">
                                <ha-selector
                                    // @ts-ignore - TS2339: auto-suppressed
                                    .hass=${this.hass}
                                    .selector=${{ number: { min: 0, max: 10, step: 0.1, mode: 'slider' } }}
                                    // @ts-ignore - TS2339: auto-suppressed
                                    .value=${this.config?.speed ?? 1.0}
                                    .label=${'Speed Multiplier'}
                                    .helper=${'Scales all scroll speeds — 0 freezes, 1 = default, 2 = double'}
                                    @value-changed=${(e) => this._update('speed', e.detail.value)}
                                ></ha-selector>
                            </div>
                        ` : ''}

                        ${this._renderAnimationParams(preset, presetConfig, defaults)}

                    </lcards-form-section>
                ` : ''}

                <!-- ══ PRESET SETTINGS ════════════════════════════ -->
                ${presetSettings ? html`
                    <lcards-form-section header="Settings" ?expanded=${true}>
                        ${presetSettings}
                    </lcards-form-section>
                ` : ''}

            ` : html`
                <div class="disabled-hint">Enable shape texture to configure options.</div>
            `}
        `;
    }

    // ─── Animation param controls (per preset) ───────────────────────────────

    _renderAnimationParams(preset, cfg, defaults) {
        switch (preset) {
            case 'grid':
                return html`
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -200, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.scroll_speed_x ?? defaults.scroll_speed_x ?? 20}
                        .label=${'Scroll Speed X (px/s)'}
                        .helper=${'Negative = reverse direction · 0 = static'}
                        @value-changed=${(e) => this._updatePresetConfig('scroll_speed_x', e.detail.value)}
                    ></ha-selector></div>
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -200, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.scroll_speed_y ?? defaults.scroll_speed_y ?? 0}
                        .label=${'Scroll Speed Y (px/s)'}
                        .helper=${'Negative = reverse direction · 0 = static'}
                        @value-changed=${(e) => this._updatePresetConfig('scroll_speed_y', e.detail.value)}
                    ></ha-selector></div>`;

            case 'diagonal':
                return html`
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -200, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.scroll_speed_x ?? defaults.scroll_speed_x ?? 20}
                        .label=${'Scroll Speed X (px/s)'}
                        .helper=${'Negative = reverse direction · 0 = static'}
                        @value-changed=${(e) => this._updatePresetConfig('scroll_speed_x', e.detail.value)}
                    ></ha-selector></div>
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -200, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.scroll_speed_y ?? defaults.scroll_speed_y ?? 20}
                        .label=${'Scroll Speed Y (px/s)'}
                        .helper=${'Negative = reverse direction · 0 = static'}
                        @value-changed=${(e) => this._updatePresetConfig('scroll_speed_y', e.detail.value)}
                    ></ha-selector></div>`;

            case 'hexagonal':
                return html`
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -200, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.scroll_speed_x ?? defaults.scroll_speed_x ?? 15}
                        .label=${'Scroll Speed X (px/s)'}
                        .helper=${'Negative = reverse direction · 0 = static'}
                        @value-changed=${(e) => this._updatePresetConfig('scroll_speed_x', e.detail.value)}
                    ></ha-selector></div>
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -200, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.scroll_speed_y ?? defaults.scroll_speed_y ?? 0}
                        .label=${'Scroll Speed Y (px/s)'}
                        .helper=${'Negative = reverse direction · 0 = static'}
                        @value-changed=${(e) => this._updatePresetConfig('scroll_speed_y', e.detail.value)}
                    ></ha-selector></div>`;

            case 'dots':
                return html`
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -200, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.scroll_speed_x ?? defaults.scroll_speed_x ?? 15}
                        .label=${'Scroll Speed X (px/s)'}
                        .helper=${'Negative = reverse direction · 0 = static'}
                        @value-changed=${(e) => this._updatePresetConfig('scroll_speed_x', e.detail.value)}
                    ></ha-selector></div>
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -200, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.scroll_speed_y ?? defaults.scroll_speed_y ?? 0}
                        .label=${'Scroll Speed Y (px/s)'}
                        .helper=${'Negative = reverse direction · 0 = static'}
                        @value-changed=${(e) => this._updatePresetConfig('scroll_speed_y', e.detail.value)}
                    ></ha-selector></div>`;

            case 'fluid':
                return html`
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -200, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.scroll_speed_x ?? defaults.scroll_speed_x ?? 7}
                        .label=${'Scroll Speed X (px/s)'}
                        .helper=${'Negative = reverse direction'}
                        @value-changed=${(e) => this._updatePresetConfig('scroll_speed_x', e.detail.value)}
                    ></ha-selector></div>
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -200, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.scroll_speed_y ?? defaults.scroll_speed_y ?? 10}
                        .label=${'Scroll Speed Y (px/s)'}
                        .helper=${'Negative = reverse direction'}
                        @value-changed=${(e) => this._updatePresetConfig('scroll_speed_y', e.detail.value)}
                    ></ha-selector></div>`;

            case 'plasma':
                return html`
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -200, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.scroll_speed_x ?? defaults.scroll_speed_x ?? 8}
                        .label=${'Scroll Speed X (px/s)'}
                        .helper=${'Negative = reverse direction'}
                        @value-changed=${(e) => this._updatePresetConfig('scroll_speed_x', e.detail.value)}
                    ></ha-selector></div>
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -200, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.scroll_speed_y ?? defaults.scroll_speed_y ?? 5}
                        .label=${'Scroll Speed Y (px/s)'}
                        .helper=${'Negative = reverse direction'}
                        @value-changed=${(e) => this._updatePresetConfig('scroll_speed_y', e.detail.value)}
                    ></ha-selector></div>`;

            case 'level':
                return html`
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -120, max: 120, step: 1, mode: 'slider' } }}
                        .value=${cfg.wave_speed ?? defaults.wave_speed ?? 20}
                        .label=${'Wave 1 Speed (deg/s)'}
                        .helper=${'Phase rate · negative = reverse direction'}
                        @value-changed=${(e) => this._updatePresetConfig('wave_speed', e.detail.value)}
                    ></ha-selector></div>
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -120, max: 120, step: 1, mode: 'slider' } }}
                        .value=${cfg.wave2_speed ?? defaults.wave2_speed ?? -15}
                        .label=${'Wave 2 Speed (deg/s)'}
                        .helper=${'Opposite sign to Wave 1 creates interference patterns · ignored when Wave 2 Height = 0'}
                        @value-changed=${(e) => this._updatePresetConfig('wave2_speed', e.detail.value)}
                    ></ha-selector></div>`;

            case 'flow':
                return html`
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -200, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.scroll_speed_x ?? defaults.scroll_speed_x ?? 50}
                        .label=${'Flow Speed X (px/s)'}
                        .helper=${'Horizontal stream speed · negative = reverse · 0 = static'}
                        @value-changed=${(e) => this._updatePresetConfig('scroll_speed_x', e.detail.value)}
                    ></ha-selector></div>
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -200, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.scroll_speed_y ?? defaults.scroll_speed_y ?? 0}
                        .label=${'Flow Speed Y (px/s)'}
                        .helper=${'Vertical stream speed · negative = reverse · 0 = static'}
                        @value-changed=${(e) => this._updatePresetConfig('scroll_speed_y', e.detail.value)}
                    ></ha-selector></div>`;

            case 'shimmer':
                return html`
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 0.1, max: 20, step: 0.1, mode: 'slider' } }}
                        .value=${cfg.speed ?? defaults.speed ?? 2.5}
                        .label=${'Sweep Speed (px/s)'}
                        .helper=${'How fast the highlight sweeps across'}
                        @value-changed=${(e) => this._updatePresetConfig('speed', e.detail.value)}
                    ></ha-selector></div>`;

            case 'scanlines': {
                const scanDir = cfg.direction ?? defaults.direction ?? 'horizontal';
                return scanDir === 'vertical'
                    // @ts-ignore - TS2339: auto-suppressed
                    ? html`<div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -200, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.scroll_speed_x ?? defaults.scroll_speed_x ?? 0}
                        .label=${'Scroll Speed X (px/s)'}
                        .helper=${'Horizontal scroll speed \u00b7 negative = reverse \u00b7 0 = static'}
                        @value-changed=${(e) => this._updatePresetConfig('scroll_speed_x', e.detail.value)}
                    ></ha-selector></div>`
                    // @ts-ignore - TS2339: auto-suppressed
                    : html`<div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -200, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.scroll_speed_y ?? defaults.scroll_speed_y ?? 0}
                        .label=${'Scroll Speed Y (px/s)'}
                        .helper=${'Vertical scroll speed \u00b7 negative = reverse \u00b7 0 = static'}
                        @value-changed=${(e) => this._updatePresetConfig('scroll_speed_y', e.detail.value)}
                    ></ha-selector></div>`;
            }

            default:
                return '';
        }
    }

    // ─── Preset-specific non-animation settings ───────────────────────────────

    _renderPresetSettings(preset, cfg, defaults) {
        switch (preset) {
            case 'grid':
                return html`
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 1, max: 10, step: 0.5, mode: 'slider' } }}
                        .value=${cfg.line_width ?? defaults.line_width ?? 1}
                        .label=${'Line Width'}
                        @value-changed=${(e) => this._updatePresetConfig('line_width', e.detail.value)}
                    ></ha-selector></div>
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 5, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.line_spacing ?? defaults.line_spacing ?? 40}
                        .label=${'Grid Cell Size (px)'}
                        @value-changed=${(e) => this._updatePresetConfig('line_spacing', e.detail.value)}
                    ></ha-selector></div>
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ select: { options: [
                            { value: 'both',       label: 'Grid (both axes)' },
                            { value: 'horizontal', label: 'Horizontal lines only' },
                            { value: 'vertical',   label: 'Vertical lines only' }
                        ], mode: 'dropdown' } }}
                        .value=${cfg.pattern ?? defaults.pattern ?? 'both'}
                        .label=${'Line Pattern'}
                        @value-changed=${(e) => this._updatePresetConfig('pattern', e.detail.value)}
                    ></ha-selector></div>`;

            case 'diagonal':
                return html`
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 1, max: 10, step: 0.5, mode: 'slider' } }}
                        .value=${cfg.line_width ?? defaults.line_width ?? 1}
                        .label=${'Line Width'}
                        @value-changed=${(e) => this._updatePresetConfig('line_width', e.detail.value)}
                    ></ha-selector></div>
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 5, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.line_spacing ?? defaults.line_spacing ?? 40}
                        .label=${'Stripe Spacing (px)'}
                        @value-changed=${(e) => this._updatePresetConfig('line_spacing', e.detail.value)}
                    ></ha-selector></div>`;

            case 'hexagonal':
                return html`
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 1, max: 10, step: 0.5, mode: 'slider' } }}
                        .value=${cfg.line_width ?? defaults.line_width ?? 1}
                        .label=${'Line Width'}
                        @value-changed=${(e) => this._updatePresetConfig('line_width', e.detail.value)}
                    ></ha-selector></div>
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 5, max: 100, step: 1, mode: 'slider' } }}
                        .value=${cfg.hex_radius ?? defaults.hex_radius ?? 20}
                        .label=${'Hex Cell Radius (px)'}
                        @value-changed=${(e) => this._updatePresetConfig('hex_radius', e.detail.value)}
                    ></ha-selector></div>`;

            case 'dots':
                return html`
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 0.5, max: 20, step: 0.5, mode: 'slider' } }}
                        .value=${cfg.dot_radius ?? defaults.dot_radius ?? 2}
                        .label=${'Dot Radius (px)'}
                        @value-changed=${(e) => this._updatePresetConfig('dot_radius', e.detail.value)}
                    ></ha-selector></div>
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 5, max: 100, step: 1, mode: 'slider' } }}
                        .value=${cfg.spacing ?? defaults.spacing ?? 20}
                        .label=${'Dot Spacing (px)'}
                        @value-changed=${(e) => this._updatePresetConfig('spacing', e.detail.value)}
                    ></ha-selector></div>`;

            case 'fluid':
            case 'plasma':
                return html`
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 0.004, max: 0.08, step: 0.001, mode: 'slider' } }}
                        .value=${cfg.base_frequency ?? defaults.base_frequency ?? 0.018}
                        .label=${'Base Frequency'}
                        .helper=${'Lower = larger blobs, higher = finer noise'}
                        @value-changed=${(e) => this._updatePresetConfig('base_frequency', e.detail.value)}
                    ></ha-selector></div>
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 1, max: 8, step: 1, mode: 'slider' } }}
                        .value=${cfg.num_octaves ?? defaults.num_octaves ?? 3}
                        .label=${'Octaves'}
                        .helper=${'More octaves = finer detail (higher GPU cost)'}
                        @value-changed=${(e) => this._updatePresetConfig('num_octaves', e.detail.value)}
                    ></ha-selector></div>`;

            case 'flow':
                return html`
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 2, max: 24, step: 1, mode: 'slider' } }}
                        .value=${cfg.num_streaks ?? defaults.num_streaks ?? 8}
                        .label=${'Number of Bands'}
                        .helper=${'More bands = denser parallel streaks'}
                        @value-changed=${(e) => this._updatePresetConfig('num_streaks', e.detail.value)}
                    ></ha-selector></div>
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 0.1, max: 2.0, step: 0.05, mode: 'slider' } }}
                        .value=${cfg.streak_width ?? defaults.streak_width ?? 0.8}
                        .label=${'Band Width'}
                        .helper=${'Fraction of band slot filled · >1.0 = bands overlap and blend'}
                        @value-changed=${(e) => this._updatePresetConfig('streak_width', e.detail.value)}
                    ></ha-selector></div>
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 0, max: 20, step: 0.5, mode: 'slider' } }}
                        .value=${cfg.blur ?? defaults.blur ?? 0}
                        .label=${'Blur (px)'}
                        .helper=${'Gaussian softness on band edges · 0 = crisp'}
                        @value-changed=${(e) => this._updatePresetConfig('blur', e.detail.value)}
                    ></ha-selector></div>
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 0.004, max: 0.08, step: 0.001, mode: 'slider' } }}
                        .value=${cfg.base_frequency ?? defaults.base_frequency ?? 0.015}
                        .label=${'Turbulence Frequency'}
                        .helper=${'Lower = longer, lazier streak shapes'}
                        @value-changed=${(e) => this._updatePresetConfig('base_frequency', e.detail.value)}
                    ></ha-selector></div>
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 5, max: 80, step: 1, mode: 'slider' } }}
                        .value=${cfg.wave_scale ?? defaults.wave_scale ?? 8}
                        .label=${'Warp Intensity'}
                        .helper=${'How much the displacement distorts the streaks'}
                        @value-changed=${(e) => this._updatePresetConfig('wave_scale', e.detail.value)}
                    ></ha-selector></div>`;

            case 'shimmer':
                return html`
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 0.05, max: 0.8, step: 0.05, mode: 'slider' } }}
                        .value=${cfg.highlight_width ?? defaults.highlight_width ?? 0.35}
                        .label=${'Highlight Width'}
                        .helper=${'Fraction of the sweep tile covered by the bright band'}
                        @value-changed=${(e) => this._updatePresetConfig('highlight_width', e.detail.value)}
                    ></ha-selector></div>
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -90, max: 90, step: 5, mode: 'slider' } }}
                        .value=${cfg.angle ?? defaults.angle ?? 30}
                        .label=${'Angle (degrees)'}
                        .helper=${'0° = horizontal sweep · 30° = diagonal · 90° = vertical'}
                        @value-changed=${(e) => this._updatePresetConfig('angle', e.detail.value)}
                    ></ha-selector></div>`;

            case 'level':
                return html`
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 0, max: 100, step: 1, mode: 'slider' } }}
                        .value=${cfg.fill_pct ?? defaults.fill_pct ?? 50}
                        .label=${'Fill Level (%)'}
                        .helper=${'0 = empty · 100 = full · supports state-based values via rules engine'}
                        @value-changed=${(e) => this._updatePresetConfig('fill_pct', e.detail.value)}
                    ></ha-selector></div>
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ select: { options: [
                            { value: 'up',    label: 'Fill upward (bottom → top)' },
                            { value: 'right', label: 'Fill rightward (left → right)' }
                        ], mode: 'dropdown' } }}
                        .value=${cfg.direction ?? defaults.direction ?? 'up'}
                        .label=${'Fill Direction'}
                        @value-changed=${(e) => this._updatePresetConfig('direction', e.detail.value)}
                    ></ha-selector></div>

                    <lcards-form-section header="Primary Wave" ?expanded=${true} .nested=${true}>
                        // @ts-ignore - TS2339: auto-suppressed
                        <div class="row"><ha-selector .hass=${this.hass}
                            .selector=${{ number: { min: 0, max: 20, step: 0.5, mode: 'slider' } }}
                            .value=${cfg.wave_height ?? defaults.wave_height ?? 4}
                            .label=${'Height (px)'}
                            .helper=${'0 = flat fill edge'}
                            @value-changed=${(e) => this._updatePresetConfig('wave_height', e.detail.value)}
                        ></ha-selector></div>
                        // @ts-ignore - TS2339: auto-suppressed
                        <div class="row"><ha-selector .hass=${this.hass}
                            .selector=${{ number: { min: 1, max: 16, step: 1, mode: 'slider' } }}
                            .value=${cfg.wave_count ?? defaults.wave_count ?? 4}
                            .label=${'Count'}
                            .helper=${'Sine cycles across the button width'}
                            @value-changed=${(e) => this._updatePresetConfig('wave_count', e.detail.value)}
                        ></ha-selector></div>
                    </lcards-form-section>

                    <lcards-form-section header="Secondary Wave" ?expanded=${false} .nested=${true}>
                        <div class="row" style="font-size:12px;color:var(--secondary-text-color);padding-bottom:8px;line-height:1.5">
                            Adds a second harmonic to the <em>same</em> fill surface — not a separate layer or colour.
                            Set Height to 0 to disable.
                        </div>
                        // @ts-ignore - TS2339: auto-suppressed
                        <div class="row"><ha-selector .hass=${this.hass}
                            .selector=${{ number: { min: 0, max: 12, step: 0.5, mode: 'slider' } }}
                            .value=${cfg.wave2_height ?? defaults.wave2_height ?? 0}
                            .label=${'Height (px)'}
                            .helper=${'0 = disabled'}
                            @value-changed=${(e) => this._updatePresetConfig('wave2_height', e.detail.value)}
                        ></ha-selector></div>
                        // @ts-ignore - TS2339: auto-suppressed
                        <div class="row"><ha-selector .hass=${this.hass}
                            .selector=${{ number: { min: 1, max: 20, step: 1, mode: 'slider' } }}
                            .value=${cfg.wave2_count ?? defaults.wave2_count ?? 5}
                            .label=${'Count'}
                            @value-changed=${(e) => this._updatePresetConfig('wave2_count', e.detail.value)}
                        ></ha-selector></div>
                    </lcards-form-section>

                    <lcards-form-section header="Sloshing" ?expanded=${false} .nested=${true}>
                        // @ts-ignore - TS2339: auto-suppressed
                        <div class="row"><ha-selector .hass=${this.hass}
                            .selector=${{ number: { min: 0, max: 1, step: 0.05, mode: 'slider' } }}
                            .value=${cfg.slosh_amount ?? defaults.slosh_amount ?? 0}
                            .label=${'Amount'}
                            .helper=${'0 = disabled · fluid tilts side-to-side as if in a vessel'}
                            @value-changed=${(e) => this._updatePresetConfig('slosh_amount', e.detail.value)}
                        ></ha-selector></div>
                        // @ts-ignore - TS2339: auto-suppressed
                        <div class="row"><ha-selector .hass=${this.hass}
                            .selector=${{ number: { min: 0.5, max: 10, step: 0.5, mode: 'slider' } }}
                            .value=${cfg.slosh_period ?? defaults.slosh_period ?? 3}
                            .label=${'Period (s)'}
                            .helper=${'Seconds per complete slosh cycle'}
                            @value-changed=${(e) => this._updatePresetConfig('slosh_period', e.detail.value)}
                        ></ha-selector></div>
                    </lcards-form-section>

                    <lcards-form-section header="Edge Glow" ?expanded=${false} .nested=${true}>
                        // @ts-ignore - TS2339: auto-suppressed
                        <div class="row"><ha-selector .hass=${this.hass}
                            .selector=${{ boolean: {} }}
                            .value=${cfg.edge_glow ?? defaults.edge_glow ?? true}
                            .label=${'Enable'}
                            @value-changed=${(e) => this._updatePresetConfig('edge_glow', e.detail.value)}
                        ></ha-selector></div>
                        <div class="row">
                            // @ts-ignore - TS2339: auto-suppressed
                            <lcards-color-picker .hass=${this.hass} .label=${'Glow Colour'}
                                .value=${cfg.edge_glow_color ?? defaults.edge_glow_color ?? 'rgba(255,255,255,0.7)'}
                                @value-changed=${(e) => this._updatePresetConfig('edge_glow_color', e.detail.value)}
                            ></lcards-color-picker>
                        </div>
                        // @ts-ignore - TS2339: auto-suppressed
                        <div class="row"><ha-selector .hass=${this.hass}
                            .selector=${{ number: { min: 1, max: 24, step: 0.5, mode: 'slider' } }}
                            .value=${cfg.edge_glow_width ?? defaults.edge_glow_width ?? 6}
                            .label=${'Glow Width (px)'}
                            .helper=${'Bloom spread radius · colour alpha controls intensity'}
                            @value-changed=${(e) => this._updatePresetConfig('edge_glow_width', e.detail.value)}
                        ></ha-selector></div>
                    </lcards-form-section>`;

            case 'scanlines':
                return html`
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ select: { options: [
                            { value: 'horizontal', label: 'Horizontal (lines run left\u2194right, scroll vertically)' },
                            { value: 'vertical',   label: 'Vertical (lines run top\u2195bottom, scroll horizontally)' }
                        ], mode: 'dropdown' } }}
                        .value=${cfg.direction ?? defaults.direction ?? 'horizontal'}
                        .label=${'Line Direction'}
                        @value-changed=${(e) => this._updatePresetConfig('direction', e.detail.value)}
                    ></ha-selector></div>
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 2, max: 20, step: 0.5, mode: 'slider' } }}
                        .value=${cfg.line_spacing ?? defaults.line_spacing ?? 4}
                        .label=${'Line Spacing (px)'}
                        @value-changed=${(e) => this._updatePresetConfig('line_spacing', e.detail.value)}
                    ></ha-selector></div>
                    // @ts-ignore - TS2339: auto-suppressed
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 0.5, max: 8, step: 0.5, mode: 'slider' } }}
                        .value=${cfg.line_width ?? defaults.line_width ?? 1.5}
                        .label=${'Line Width'}
                        @value-changed=${(e) => this._updatePresetConfig('line_width', e.detail.value)}
                    ></ha-selector></div>`;

            case 'circuit':
                return html``; // removed — fall through

            default:
                return null; // signals no section header needed
        }
    }
}

customElements.define('lcards-shape-texture-editor', LCARdSShapeTextureEditor);
