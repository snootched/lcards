/**
 * lcards-shape-texture-editor.js
 * Shape texture configuration editor component
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
import { SHAPE_TEXTURE_PRESETS } from '../../core/packs/textures/presets/index.js';
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
const ANIMATED_PRESETS = new Set(['grid', 'diagonal', 'hexagonal', 'dots', 'fluid', 'shimmer', 'plasma', 'flow', 'level', 'pulse', 'scanlines']);

// Presets that use turbulence (their own speed param rather than scroll_speed_x/y)
const TURBULENCE_PRESETS = new Set(['fluid', 'plasma', 'flow']);

// Evolution speed threshold above which a GPU cost warning is shown
const EVOLUTION_GPU_WARNING_THRESHOLD = 0.7;

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

    // ─── Event helpers ────────────────────────────────────────────────────────

    _emit(value) {
        this.dispatchEvent(new CustomEvent('texture-changed', {
            detail: { value },
            bubbles: true,
            composed: true
        }));
    }

    _update(key, value) {
        this._emit({ ...(this.config || {}), [key]: value });
    }

    _updatePresetConfig(key, value) {
        const current = this.config || {};
        const cfg     = current.config || {};
        this._emit({ ...current, config: { ...cfg, [key]: value } });
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    render() {
        const enabled      = !!(this.config?.preset);
        const preset       = this.config?.preset || '';
        const presetDef    = SHAPE_TEXTURE_PRESETS[preset];
        const presetConfig = this.config?.config || {};
        const defaults     = presetDef?.defaults || {};

        const presetOptions = Object.entries(SHAPE_TEXTURE_PRESETS).map(([key, def]) => ({
            value: key,
            label: def.name,
            description: def.description
        }));

        const blendMode = this.config?.mix_blend_mode ?? 'normal';
        const blendHint = BLEND_MODE_OPTIONS.find(m => m.value === blendMode)?.hint ?? '';

        // Evaluate preset-specific settings once to avoid double-call
        const presetSettings = preset ? this._renderPresetSettings(preset, presetConfig, defaults) : null;

        return html`
            <!-- ── Enable toggle ─────────────────────────────────── -->
            <div class="row">
                <ha-selector
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
                                config: { ...SHAPE_TEXTURE_PRESETS['shimmer'].defaults }
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
                            .hass=${this.hass}
                            .selector=${{ select: { options: presetOptions, mode: 'dropdown' } }}
                            .value=${preset}
                            .label=${'Texture Preset'}
                            .helper=${presetDef?.description ?? ''}
                            @value-changed=${(e) => {
                                const newPreset = e.detail.value;
                                const newDef    = SHAPE_TEXTURE_PRESETS[newPreset];
                                // Completely replace config with new preset defaults — no key pollution
                                this._emit({
                                    preset:        newPreset,
                                    opacity:       this.config?.opacity       ?? 0.3,
                                    mix_blend_mode: this.config?.mix_blend_mode ?? 'normal',
                                    config:        { ...(newDef?.defaults || {}) }
                                });
                            }}
                        ></ha-selector>
                    </div>
                </lcards-form-section>

                <!-- ══ APPEARANCE ════════════════════════════════ -->
                <lcards-form-section header="Appearance" ?expanded=${true}>

                    <!-- Color (not shown for presets with two colors like plasma) -->
                    ${presetDef && !['plasma'].includes(preset) ? html`
                        <div class="row">
                            <lcards-color-picker
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
                            <lcards-color-picker .hass=${this.hass} .label=${'Color A'}
                                .value=${presetConfig.color_a ?? defaults.color_a ?? 'rgba(80,0,255,0.9)'}
                                @value-changed=${(e) => this._updatePresetConfig('color_a', e.detail.value)}
                            ></lcards-color-picker>
                        </div>
                        <div class="row">
                            <lcards-color-picker .hass=${this.hass} .label=${'Color B'}
                                .value=${presetConfig.color_b ?? defaults.color_b ?? 'rgba(255,40,120,0.9)'}
                                @value-changed=${(e) => this._updatePresetConfig('color_b', e.detail.value)}
                            ></lcards-color-picker>
                        </div>
                    ` : ''}

                    <!-- Opacity -->
                    <div class="row">
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{ number: { min: 0, max: 1, step: 0.05, mode: 'slider' } }}
                            .value=${this.config?.opacity ?? 0.3}
                            .label=${'Opacity'}
                            .helper=${'0 = invisible · 1 = fully opaque'}
                            @value-changed=${(e) => this._update('opacity', e.detail.value)}
                        ></ha-selector>
                    </div>

                    <!-- Blend Mode -->
                    <div class="row">
                        <ha-selector
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
                                    .hass=${this.hass}
                                    .selector=${{ number: { min: 0, max: 10, step: 0.1, mode: 'slider' } }}
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
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -200, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.scroll_speed_x ?? defaults.scroll_speed_x ?? 20}
                        .label=${'Scroll Speed X (px/s)'}
                        .helper=${'Negative = reverse direction · 0 = static'}
                        @value-changed=${(e) => this._updatePresetConfig('scroll_speed_x', e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -200, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.scroll_speed_y ?? defaults.scroll_speed_y ?? 0}
                        .label=${'Scroll Speed Y (px/s)'}
                        .helper=${'Negative = reverse direction · 0 = static'}
                        @value-changed=${(e) => this._updatePresetConfig('scroll_speed_y', e.detail.value)}
                    ></ha-selector></div>`;

            case 'diagonal':
                return html`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -200, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.scroll_speed_x ?? defaults.scroll_speed_x ?? 20}
                        .label=${'Scroll Speed X (px/s)'}
                        .helper=${'Negative = reverse direction · 0 = static'}
                        @value-changed=${(e) => this._updatePresetConfig('scroll_speed_x', e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -200, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.scroll_speed_y ?? defaults.scroll_speed_y ?? 20}
                        .label=${'Scroll Speed Y (px/s)'}
                        .helper=${'Negative = reverse direction · 0 = static'}
                        @value-changed=${(e) => this._updatePresetConfig('scroll_speed_y', e.detail.value)}
                    ></ha-selector></div>`;

            case 'hexagonal':
                return html`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -200, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.scroll_speed_x ?? defaults.scroll_speed_x ?? 15}
                        .label=${'Scroll Speed X (px/s)'}
                        .helper=${'Negative = reverse direction · 0 = static'}
                        @value-changed=${(e) => this._updatePresetConfig('scroll_speed_x', e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -200, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.scroll_speed_y ?? defaults.scroll_speed_y ?? 0}
                        .label=${'Scroll Speed Y (px/s)'}
                        .helper=${'Negative = reverse direction · 0 = static'}
                        @value-changed=${(e) => this._updatePresetConfig('scroll_speed_y', e.detail.value)}
                    ></ha-selector></div>`;

            case 'dots':
                return html`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -200, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.scroll_speed_x ?? defaults.scroll_speed_x ?? 15}
                        .label=${'Scroll Speed X (px/s)'}
                        .helper=${'Negative = reverse direction · 0 = static'}
                        @value-changed=${(e) => this._updatePresetConfig('scroll_speed_x', e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -200, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.scroll_speed_y ?? defaults.scroll_speed_y ?? 0}
                        .label=${'Scroll Speed Y (px/s)'}
                        .helper=${'Negative = reverse direction · 0 = static'}
                        @value-changed=${(e) => this._updatePresetConfig('scroll_speed_y', e.detail.value)}
                    ></ha-selector></div>`;

            case 'fluid':
                return html`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -200, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.scroll_speed_x ?? defaults.scroll_speed_x ?? 7}
                        .label=${'Scroll Speed X (px/s)'}
                        .helper=${'Negative = reverse direction'}
                        @value-changed=${(e) => this._updatePresetConfig('scroll_speed_x', e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -200, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.scroll_speed_y ?? defaults.scroll_speed_y ?? 10}
                        .label=${'Scroll Speed Y (px/s)'}
                        .helper=${'Negative = reverse direction'}
                        @value-changed=${(e) => this._updatePresetConfig('scroll_speed_y', e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 0, max: 1, step: 0.05, mode: 'slider' } }}
                        .value=${cfg.evolution_speed ?? defaults.evolution_speed ?? 0}
                        .label=${'Evolution Speed'}
                        .helper=${'0 = frozen tile scrolling · 0.3 = gentle morphing · 1.0 = fast swirl (GPU intensive)'}
                        @value-changed=${(e) => this._updatePresetConfig('evolution_speed', e.detail.value)}
                    ></ha-selector></div>
                    ${(cfg.evolution_speed ?? 0) > EVOLUTION_GPU_WARNING_THRESHOLD ? html`
                        <div class="blend-hint" style="border-color: #ff9800;">
                            ⚠️ High evolution speed may be GPU intensive on low-power hardware (Raspberry Pi).
                        </div>
                    ` : ''}`;

            case 'plasma':
                return html`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -200, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.scroll_speed_x ?? defaults.scroll_speed_x ?? 8}
                        .label=${'Scroll Speed X (px/s)'}
                        .helper=${'Negative = reverse direction'}
                        @value-changed=${(e) => this._updatePresetConfig('scroll_speed_x', e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -200, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.scroll_speed_y ?? defaults.scroll_speed_y ?? 5}
                        .label=${'Scroll Speed Y (px/s)'}
                        .helper=${'Negative = reverse direction'}
                        @value-changed=${(e) => this._updatePresetConfig('scroll_speed_y', e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 0, max: 1, step: 0.05, mode: 'slider' } }}
                        .value=${cfg.evolution_speed ?? defaults.evolution_speed ?? 0}
                        .label=${'Evolution Speed'}
                        .helper=${'0 = frozen tile scrolling · 0.3 = gentle colour wash morph · 1.0 = fast plasma churn (GPU intensive)'}
                        @value-changed=${(e) => this._updatePresetConfig('evolution_speed', e.detail.value)}
                    ></ha-selector></div>
                    ${(cfg.evolution_speed ?? 0) > EVOLUTION_GPU_WARNING_THRESHOLD ? html`
                        <div class="blend-hint" style="border-color: #ff9800;">
                            ⚠️ High evolution speed may be GPU intensive on low-power hardware (Raspberry Pi).
                        </div>
                    ` : ''}`;

            case 'flow':
                return html`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -200, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.scroll_speed_x ?? defaults.scroll_speed_x ?? 50}
                        .label=${'Flow Speed X (px/s)'}
                        .helper=${'Horizontal stream speed · negative = reverse · 0 = static'}
                        @value-changed=${(e) => this._updatePresetConfig('scroll_speed_x', e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -200, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.scroll_speed_y ?? defaults.scroll_speed_y ?? 0}
                        .label=${'Flow Speed Y (px/s)'}
                        .helper=${'Vertical stream speed · negative = reverse · 0 = static'}
                        @value-changed=${(e) => this._updatePresetConfig('scroll_speed_y', e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 0, max: 1, step: 0.05, mode: 'slider' } }}
                        .value=${cfg.evolution_speed ?? defaults.evolution_speed ?? 0}
                        .label=${'Evolution Speed'}
                        .helper=${'0 = steady current (static warp) · 0.3 = gently undulating · 1.0 = turbulent flow (GPU intensive)'}
                        @value-changed=${(e) => this._updatePresetConfig('evolution_speed', e.detail.value)}
                    ></ha-selector></div>
                    ${(cfg.evolution_speed ?? 0) > EVOLUTION_GPU_WARNING_THRESHOLD ? html`
                        <div class="blend-hint" style="border-color: #ff9800;">
                            ⚠️ High evolution speed may be GPU intensive on low-power hardware (Raspberry Pi).
                        </div>
                    ` : ''}`;

            case 'shimmer':
                return html`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 0.1, max: 20, step: 0.1, mode: 'slider' } }}
                        .value=${cfg.speed ?? defaults.speed ?? 2.5}
                        .label=${'Sweep Speed (px/s)'}
                        .helper=${'How fast the highlight sweeps across'}
                        @value-changed=${(e) => this._updatePresetConfig('speed', e.detail.value)}
                    ></ha-selector></div>`;

            case 'pulse':
                return html`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 0.1, max: 10, step: 0.1, mode: 'slider' } }}
                        .value=${cfg.speed ?? defaults.speed ?? 1.2}
                        .label=${'Pulse Speed'}
                        .helper=${'Pulses per second'}
                        @value-changed=${(e) => this._updatePresetConfig('speed', e.detail.value)}
                    ></ha-selector></div>`;

            case 'scanlines': {
                const scanDir = cfg.direction ?? defaults.direction ?? 'horizontal';
                return scanDir === 'vertical'
                    ? html`<div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -200, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.scroll_speed_x ?? defaults.scroll_speed_x ?? 0}
                        .label=${'Scroll Speed X (px/s)'}
                        .helper=${'Horizontal scroll speed \u00b7 negative = reverse \u00b7 0 = static'}
                        @value-changed=${(e) => this._updatePresetConfig('scroll_speed_x', e.detail.value)}
                    ></ha-selector></div>`
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
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 1, max: 10, step: 0.5, mode: 'slider' } }}
                        .value=${cfg.line_width ?? defaults.line_width ?? 1}
                        .label=${'Line Width'}
                        @value-changed=${(e) => this._updatePresetConfig('line_width', e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 5, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.line_spacing ?? defaults.line_spacing ?? 40}
                        .label=${'Grid Cell Size (px)'}
                        @value-changed=${(e) => this._updatePresetConfig('line_spacing', e.detail.value)}
                    ></ha-selector></div>
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
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 1, max: 10, step: 0.5, mode: 'slider' } }}
                        .value=${cfg.line_width ?? defaults.line_width ?? 1}
                        .label=${'Line Width'}
                        @value-changed=${(e) => this._updatePresetConfig('line_width', e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 5, max: 200, step: 1, mode: 'slider' } }}
                        .value=${cfg.line_spacing ?? defaults.line_spacing ?? 40}
                        .label=${'Stripe Spacing (px)'}
                        @value-changed=${(e) => this._updatePresetConfig('line_spacing', e.detail.value)}
                    ></ha-selector></div>`;

            case 'hexagonal':
                return html`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 1, max: 10, step: 0.5, mode: 'slider' } }}
                        .value=${cfg.line_width ?? defaults.line_width ?? 1}
                        .label=${'Line Width'}
                        @value-changed=${(e) => this._updatePresetConfig('line_width', e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 5, max: 100, step: 1, mode: 'slider' } }}
                        .value=${cfg.hex_radius ?? defaults.hex_radius ?? 20}
                        .label=${'Hex Cell Radius (px)'}
                        @value-changed=${(e) => this._updatePresetConfig('hex_radius', e.detail.value)}
                    ></ha-selector></div>`;

            case 'dots':
                return html`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 0.5, max: 20, step: 0.5, mode: 'slider' } }}
                        .value=${cfg.dot_radius ?? defaults.dot_radius ?? 2}
                        .label=${'Dot Radius (px)'}
                        @value-changed=${(e) => this._updatePresetConfig('dot_radius', e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 5, max: 100, step: 1, mode: 'slider' } }}
                        .value=${cfg.spacing ?? defaults.spacing ?? 20}
                        .label=${'Dot Spacing (px)'}
                        @value-changed=${(e) => this._updatePresetConfig('spacing', e.detail.value)}
                    ></ha-selector></div>`;

            case 'fluid':
            case 'plasma':
                return html`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 0.004, max: 0.08, step: 0.001, mode: 'slider' } }}
                        .value=${cfg.base_frequency ?? defaults.base_frequency ?? 0.018}
                        .label=${'Base Frequency'}
                        .helper=${'Lower = larger blobs, higher = finer noise'}
                        @value-changed=${(e) => this._updatePresetConfig('base_frequency', e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 1, max: 8, step: 1, mode: 'slider' } }}
                        .value=${cfg.num_octaves ?? defaults.num_octaves ?? 3}
                        .label=${'Octaves'}
                        .helper=${'More octaves = finer detail (higher GPU cost)'}
                        @value-changed=${(e) => this._updatePresetConfig('num_octaves', e.detail.value)}
                    ></ha-selector></div>`;

            case 'flow':
                return html`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 0.004, max: 0.08, step: 0.001, mode: 'slider' } }}
                        .value=${cfg.base_frequency ?? defaults.base_frequency ?? 0.015}
                        .label=${'Turbulence Frequency'}
                        .helper=${'Lower = longer, lazier streak shapes'}
                        @value-changed=${(e) => this._updatePresetConfig('base_frequency', e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 5, max: 80, step: 1, mode: 'slider' } }}
                        .value=${cfg.wave_scale ?? defaults.wave_scale ?? 8}
                        .label=${'Warp Intensity'}
                        .helper=${'How much the displacement distorts the streaks'}
                        @value-changed=${(e) => this._updatePresetConfig('wave_scale', e.detail.value)}
                    ></ha-selector></div>`;

            case 'shimmer':
                return html`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 0.05, max: 0.8, step: 0.05, mode: 'slider' } }}
                        .value=${cfg.highlight_width ?? defaults.highlight_width ?? 0.35}
                        .label=${'Highlight Width'}
                        .helper=${'Fraction of the sweep tile covered by the bright band'}
                        @value-changed=${(e) => this._updatePresetConfig('highlight_width', e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -90, max: 90, step: 5, mode: 'slider' } }}
                        .value=${cfg.angle ?? defaults.angle ?? 30}
                        .label=${'Angle (degrees)'}
                        .helper=${'0° = horizontal sweep · 30° = diagonal · 90° = vertical'}
                        @value-changed=${(e) => this._updatePresetConfig('angle', e.detail.value)}
                    ></ha-selector></div>`;

            case 'level':
                return html`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 0, max: 100, step: 1, mode: 'slider' } }}
                        .value=${cfg.fill_pct ?? defaults.fill_pct ?? 50}
                        .label=${'Fill Level (%)'}
                        .helper=${'0 = empty · 100 = full. Use a state-based object to drive from entity state.'}
                        @value-changed=${(e) => this._updatePresetConfig('fill_pct', e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ select: { options: [
                            { value: 'up',    label: 'Fill upward (bottom → top)' },
                            { value: 'right', label: 'Fill rightward (left → right)' }
                        ], mode: 'dropdown' } }}
                        .value=${cfg.direction ?? defaults.direction ?? 'up'}
                        .label=${'Fill Direction'}
                        @value-changed=${(e) => this._updatePresetConfig('direction', e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 0, max: 20, step: 0.5, mode: 'slider' } }}
                        .value=${cfg.wave_height ?? defaults.wave_height ?? 4}
                        .label=${'Wave Height (px)'}
                        .helper=${'0 = flat edge · higher = taller wave crest'}
                        @value-changed=${(e) => this._updatePresetConfig('wave_height', e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 1, max: 12, step: 1, mode: 'slider' } }}
                        .value=${cfg.wave_count ?? defaults.wave_count ?? 4}
                        .label=${'Wave Count'}
                        .helper=${'Number of wave cycles across the button width'}
                        @value-changed=${(e) => this._updatePresetConfig('wave_count', e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: -80, max: 80, step: 1, mode: 'slider' } }}
                        .value=${cfg.wave_speed ?? defaults.wave_speed ?? 20}
                        .label=${'Wave Speed (px/s)'}
                        .helper=${'Speed of wave animation · negative = reverse'}
                        @value-changed=${(e) => this._updatePresetConfig('wave_speed', e.detail.value)}
                    ></ha-selector></div>`;

            case 'pulse':
                return html`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 0.2, max: 1.0, step: 0.05, mode: 'slider' } }}
                        .value=${cfg.radius ?? defaults.radius ?? 0.7}
                        .label=${'Glow Radius'}
                        .helper=${'Maximum glow size as fraction of shape diagonal'}
                        @value-changed=${(e) => this._updatePresetConfig('radius', e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 0.0, max: 0.9, step: 0.05, mode: 'slider' } }}
                        .value=${cfg.min_size ?? defaults.min_size ?? 0.15}
                        .label=${'Minimum Size'}
                        .helper=${'Smallest the glow shrinks to (fraction of max radius) \u00b7 0 = collapses fully'}
                        @value-changed=${(e) => this._updatePresetConfig('min_size', e.detail.value)}
                    ></ha-selector></div>`;

            case 'scanlines':
                return html`
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ select: { options: [
                            { value: 'horizontal', label: 'Horizontal (lines run left\u2194right, scroll vertically)' },
                            { value: 'vertical',   label: 'Vertical (lines run top\u2195bottom, scroll horizontally)' }
                        ], mode: 'dropdown' } }}
                        .value=${cfg.direction ?? defaults.direction ?? 'horizontal'}
                        .label=${'Line Direction'}
                        @value-changed=${(e) => this._updatePresetConfig('direction', e.detail.value)}
                    ></ha-selector></div>
                    <div class="row"><ha-selector .hass=${this.hass}
                        .selector=${{ number: { min: 2, max: 20, step: 0.5, mode: 'slider' } }}
                        .value=${cfg.line_spacing ?? defaults.line_spacing ?? 4}
                        .label=${'Line Spacing (px)'}
                        @value-changed=${(e) => this._updatePresetConfig('line_spacing', e.detail.value)}
                    ></ha-selector></div>
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
