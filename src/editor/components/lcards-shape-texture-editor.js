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

const BLEND_MODES = ['normal', 'multiply', 'screen', 'overlay', 'hard-light', 'soft-light', 'color-burn', 'color-dodge'];

const ANIMATED_PRESETS = ['grid', 'diagonal', 'hexagonal', 'dots', 'fluid'];

export class LCARdSShapeTextureEditor extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            config: { type: Object }
        };
    }

    static get styles() {
        return css`
            :host {
                display: block;
                width: 100%;
            }

            .section {
                margin-bottom: 16px;
            }

            ha-selector {
                max-width: 100%;
                width: 100%;
                display: block;
            }

            .param-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 16px;
                margin-top: 8px;
            }

            .disabled-hint {
                font-size: 13px;
                color: var(--secondary-text-color);
                padding: 8px 0;
            }
        `;
    }

    /**
     * Emit texture-changed event
     * @param {Object|null} value
     */
    _emit(value) {
        this.dispatchEvent(new CustomEvent('texture-changed', {
            detail: { value },
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Update a single key in the texture config
     * @param {string} key
     * @param {*} value
     */
    _update(key, value) {
        const current = this.config || {};
        this._emit({ ...current, [key]: value });
    }

    /**
     * Update a key inside config.config (preset-specific params)
     * @param {string} key
     * @param {*} value
     */
    _updatePresetConfig(key, value) {
        const current = this.config || {};
        const cfg = current.config || {};
        this._emit({ ...current, config: { ...cfg, [key]: value } });
    }

    render() {
        const enabled = !!(this.config?.preset);
        const preset = this.config?.preset || '';
        const presetDef = SHAPE_TEXTURE_PRESETS[preset];
        const presetConfig = this.config?.config || {};
        const defaults = presetDef?.defaults || {};
        const isAnimated = ANIMATED_PRESETS.includes(preset);

        const presetOptions = Object.entries(SHAPE_TEXTURE_PRESETS).map(([key, def]) => ({
            value: key,
            label: def.name
        }));

        return html`
            <!-- Enable toggle -->
            <div class="section">
                <ha-selector
                    .hass=${this.hass}
                    .selector=${{ boolean: {} }}
                    .value=${enabled}
                    .label=${'Enable Shape Texture'}
                    .helper=${'Render an SVG texture pattern inside the button shape'}
                    @value-changed=${(e) => {
                        if (!e.detail.value) {
                            this._emit(null);
                        } else {
                            const gridDefaults = SHAPE_TEXTURE_PRESETS['grid'].defaults;
                            this._emit({ preset: 'grid', opacity: 0.3, config: { ...gridDefaults } });
                        }
                    }}
                ></ha-selector>
            </div>

            ${enabled ? html`
                <!-- Preset selector -->
                <div class="section">
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ select: { options: presetOptions, mode: 'dropdown' } }}
                        .value=${preset}
                        .label=${'Texture Preset'}
                        @value-changed=${(e) => this._update('preset', e.detail.value)}
                    ></ha-selector>
                </div>

                <!-- Opacity -->
                <div class="section">
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ number: { min: 0, max: 1, step: 0.05, mode: 'slider' } }}
                        .value=${this.config?.opacity ?? 0.3}
                        .label=${'Opacity'}
                        .helper=${'Texture layer opacity (0 = invisible, 1 = fully opaque)'}
                        @value-changed=${(e) => this._update('opacity', e.detail.value)}
                    ></ha-selector>
                </div>

                <!-- Speed multiplier (animated presets only) -->
                ${isAnimated ? html`
                    <div class="section">
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{ number: { min: 0, max: 10, step: 0.1, mode: 'slider' } }}
                            .value=${this.config?.speed ?? 1.0}
                            .label=${'Animation Speed Multiplier'}
                            .helper=${'Multiplies scroll/animation speed (0 = static, 1 = default)'}
                            @value-changed=${(e) => this._update('speed', e.detail.value)}
                        ></ha-selector>
                    </div>
                ` : ''}

                <!-- Blend mode -->
                <div class="section">
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{ select: { options: BLEND_MODES.map(m => ({ value: m, label: m })), mode: 'dropdown' } }}
                        .value=${this.config?.mix_blend_mode ?? 'normal'}
                        .label=${'Blend Mode'}
                        .helper=${'CSS mix-blend-mode for compositing the texture over the button fill'}
                        @value-changed=${(e) => this._update('mix_blend_mode', e.detail.value)}
                    ></ha-selector>
                </div>

                <!-- Color -->
                ${presetDef ? html`
                    <div class="section">
                        <lcards-color-picker
                            .hass=${this.hass}
                            .label=${'Texture Color'}
                            .value=${presetConfig.color ?? defaults.color ?? 'rgba(255,255,255,0.3)'}
                            @value-changed=${(e) => this._updatePresetConfig('color', e.detail.value)}
                        ></lcards-color-picker>
                    </div>
                ` : ''}

                <!-- Preset-specific params -->
                ${this._renderPresetParams(preset, presetConfig, defaults)}
            ` : html`
                <div class="disabled-hint">Enable shape texture to configure options.</div>
            `}
        `;
    }

    /**
     * Render preset-specific parameter controls
     */
    _renderPresetParams(preset, cfg, defaults) {
        if (!preset) return '';

        switch (preset) {
            case 'grid':
                return html`
                    <div class="param-grid">
                        <ha-selector .hass=${this.hass}
                            .selector=${{ number: { min: 1, max: 10, step: 0.5, mode: 'slider' } }}
                            .value=${cfg.line_width ?? defaults.line_width ?? 1}
                            .label=${'Line Width'}
                            @value-changed=${(e) => this._updatePresetConfig('line_width', e.detail.value)}
                        ></ha-selector>
                        <ha-selector .hass=${this.hass}
                            .selector=${{ number: { min: 5, max: 200, step: 1, mode: 'slider' } }}
                            .value=${cfg.line_spacing ?? defaults.line_spacing ?? 40}
                            .label=${'Line Spacing (px)'}
                            @value-changed=${(e) => this._updatePresetConfig('line_spacing', e.detail.value)}
                        ></ha-selector>
                        <ha-selector .hass=${this.hass}
                            .selector=${{ number: { min: 0, max: 200, step: 1, mode: 'slider' } }}
                            .value=${cfg.scroll_speed_x ?? defaults.scroll_speed_x ?? 20}
                            .label=${'Scroll Speed X (px/s)'}
                            @value-changed=${(e) => this._updatePresetConfig('scroll_speed_x', e.detail.value)}
                        ></ha-selector>
                        <ha-selector .hass=${this.hass}
                            .selector=${{ number: { min: 0, max: 200, step: 1, mode: 'slider' } }}
                            .value=${cfg.scroll_speed_y ?? defaults.scroll_speed_y ?? 0}
                            .label=${'Scroll Speed Y (px/s)'}
                            @value-changed=${(e) => this._updatePresetConfig('scroll_speed_y', e.detail.value)}
                        ></ha-selector>
                        <ha-selector .hass=${this.hass}
                            .selector=${{ select: { options: [
                                { value: 'both', label: 'Both axes' },
                                { value: 'horizontal', label: 'Horizontal only' },
                                { value: 'vertical', label: 'Vertical only' }
                            ], mode: 'dropdown' } }}
                            .value=${cfg.pattern ?? defaults.pattern ?? 'both'}
                            .label=${'Grid Pattern'}
                            @value-changed=${(e) => this._updatePresetConfig('pattern', e.detail.value)}
                        ></ha-selector>
                    </div>`;

            case 'diagonal':
                return html`
                    <div class="param-grid">
                        <ha-selector .hass=${this.hass}
                            .selector=${{ number: { min: 1, max: 10, step: 0.5, mode: 'slider' } }}
                            .value=${cfg.line_width ?? defaults.line_width ?? 1}
                            .label=${'Line Width'}
                            @value-changed=${(e) => this._updatePresetConfig('line_width', e.detail.value)}
                        ></ha-selector>
                        <ha-selector .hass=${this.hass}
                            .selector=${{ number: { min: 5, max: 200, step: 1, mode: 'slider' } }}
                            .value=${cfg.line_spacing ?? defaults.line_spacing ?? 40}
                            .label=${'Line Spacing (px)'}
                            @value-changed=${(e) => this._updatePresetConfig('line_spacing', e.detail.value)}
                        ></ha-selector>
                        <ha-selector .hass=${this.hass}
                            .selector=${{ number: { min: 0, max: 200, step: 1, mode: 'slider' } }}
                            .value=${cfg.scroll_speed_x ?? defaults.scroll_speed_x ?? 20}
                            .label=${'Scroll Speed X (px/s)'}
                            @value-changed=${(e) => this._updatePresetConfig('scroll_speed_x', e.detail.value)}
                        ></ha-selector>
                        <ha-selector .hass=${this.hass}
                            .selector=${{ number: { min: 0, max: 200, step: 1, mode: 'slider' } }}
                            .value=${cfg.scroll_speed_y ?? defaults.scroll_speed_y ?? 20}
                            .label=${'Scroll Speed Y (px/s)'}
                            @value-changed=${(e) => this._updatePresetConfig('scroll_speed_y', e.detail.value)}
                        ></ha-selector>
                    </div>`;

            case 'hexagonal':
                return html`
                    <div class="param-grid">
                        <ha-selector .hass=${this.hass}
                            .selector=${{ number: { min: 1, max: 10, step: 0.5, mode: 'slider' } }}
                            .value=${cfg.line_width ?? defaults.line_width ?? 1}
                            .label=${'Line Width'}
                            @value-changed=${(e) => this._updatePresetConfig('line_width', e.detail.value)}
                        ></ha-selector>
                        <ha-selector .hass=${this.hass}
                            .selector=${{ number: { min: 5, max: 100, step: 1, mode: 'slider' } }}
                            .value=${cfg.hex_radius ?? defaults.hex_radius ?? 20}
                            .label=${'Hex Radius (px)'}
                            @value-changed=${(e) => this._updatePresetConfig('hex_radius', e.detail.value)}
                        ></ha-selector>
                        <ha-selector .hass=${this.hass}
                            .selector=${{ number: { min: 0, max: 200, step: 1, mode: 'slider' } }}
                            .value=${cfg.scroll_speed_x ?? defaults.scroll_speed_x ?? 15}
                            .label=${'Scroll Speed X (px/s)'}
                            @value-changed=${(e) => this._updatePresetConfig('scroll_speed_x', e.detail.value)}
                        ></ha-selector>
                        <ha-selector .hass=${this.hass}
                            .selector=${{ number: { min: 0, max: 200, step: 1, mode: 'slider' } }}
                            .value=${cfg.scroll_speed_y ?? defaults.scroll_speed_y ?? 0}
                            .label=${'Scroll Speed Y (px/s)'}
                            @value-changed=${(e) => this._updatePresetConfig('scroll_speed_y', e.detail.value)}
                        ></ha-selector>
                    </div>`;

            case 'dots':
                return html`
                    <div class="param-grid">
                        <ha-selector .hass=${this.hass}
                            .selector=${{ number: { min: 0.5, max: 20, step: 0.5, mode: 'slider' } }}
                            .value=${cfg.dot_radius ?? defaults.dot_radius ?? 2}
                            .label=${'Dot Radius (px)'}
                            @value-changed=${(e) => this._updatePresetConfig('dot_radius', e.detail.value)}
                        ></ha-selector>
                        <ha-selector .hass=${this.hass}
                            .selector=${{ number: { min: 5, max: 100, step: 1, mode: 'slider' } }}
                            .value=${cfg.spacing ?? defaults.spacing ?? 20}
                            .label=${'Dot Spacing (px)'}
                            @value-changed=${(e) => this._updatePresetConfig('spacing', e.detail.value)}
                        ></ha-selector>
                        <ha-selector .hass=${this.hass}
                            .selector=${{ number: { min: 0, max: 200, step: 1, mode: 'slider' } }}
                            .value=${cfg.scroll_speed_x ?? defaults.scroll_speed_x ?? 15}
                            .label=${'Scroll Speed X (px/s)'}
                            @value-changed=${(e) => this._updatePresetConfig('scroll_speed_x', e.detail.value)}
                        ></ha-selector>
                        <ha-selector .hass=${this.hass}
                            .selector=${{ number: { min: 0, max: 200, step: 1, mode: 'slider' } }}
                            .value=${cfg.scroll_speed_y ?? defaults.scroll_speed_y ?? 0}
                            .label=${'Scroll Speed Y (px/s)'}
                            @value-changed=${(e) => this._updatePresetConfig('scroll_speed_y', e.detail.value)}
                        ></ha-selector>
                    </div>`;

            case 'fluid':
                return html`
                    <div class="param-grid">
                        <ha-selector .hass=${this.hass}
                            .selector=${{ number: { min: 0.001, max: 0.1, step: 0.001, mode: 'slider' } }}
                            .value=${cfg.base_frequency ?? defaults.base_frequency ?? 0.015}
                            .label=${'Base Frequency'}
                            .helper=${'Lower = larger blobs, higher = finer noise'}
                            @value-changed=${(e) => this._updatePresetConfig('base_frequency', e.detail.value)}
                        ></ha-selector>
                        <ha-selector .hass=${this.hass}
                            .selector=${{ number: { min: 1, max: 8, step: 1, mode: 'slider' } }}
                            .value=${cfg.num_octaves ?? defaults.num_octaves ?? 3}
                            .label=${'Octaves'}
                            .helper=${'Higher values add detail (more CPU cost)'}
                            @value-changed=${(e) => this._updatePresetConfig('num_octaves', e.detail.value)}
                        ></ha-selector>
                        <ha-selector .hass=${this.hass}
                            .selector=${{ number: { min: 0, max: 5, step: 0.1, mode: 'slider' } }}
                            .value=${cfg.speed ?? defaults.speed ?? 0.5}
                            .label=${'Animation Speed'}
                            .helper=${'Speed of the turbulence evolution (0 = static)'}
                            @value-changed=${(e) => this._updatePresetConfig('speed', e.detail.value)}
                        ></ha-selector>
                    </div>`;

            case 'solid':
                return ''; // color is sufficient; no extra params

            default:
                return '';
        }
    }
}

customElements.define('lcards-shape-texture-editor', LCARdSShapeTextureEditor);
