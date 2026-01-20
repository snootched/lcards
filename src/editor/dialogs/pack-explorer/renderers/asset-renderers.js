/**
 * Asset Renderers for Pack Explorer
 *
 * Provides preview rendering for different asset types:
 * - Themes: Color swatches and token previews
 * - Presets: Live card previews (simplified)
 * - Animations: Metadata and playback info
 * - SVG Assets: Inline rendering
 */

import { html, css } from 'lit';

/**
 * Render theme color swatches
 * @param {Object} theme - Theme metadata
 * @returns {TemplateResult} Rendered theme preview
 */
export function renderThemePreview(theme) {
  // For now, just show metadata
  // Future enhancement: Show actual color swatches from theme tokens
  return html`
    <div class="theme-preview">
      <div class="preview-label">Theme Preview</div>
      <div class="preview-note">
        Theme contains ${theme.tokenCount || 0} design tokens.
        ${theme.hasCssFile ? 'Includes custom CSS file.' : ''}
      </div>
    </div>
  `;
}

/**
 * Render preset preview
 * @param {Object} preset - Preset metadata
 * @returns {TemplateResult} Rendered preset preview
 */
export function renderPresetPreview(preset) {
  // For MVP, just show metadata
  // Future enhancement: Render actual button/slider with preset applied
  return html`
    <div class="preset-preview">
      <div class="preview-label">Preset Preview</div>
      <div class="preview-note">
        This is a ${preset.presetType || preset.type} preset.
        ${preset.extends ? `Extends: ${preset.extends}` : ''}
      </div>
      <div class="preview-placeholder">
        [Live preview coming soon]
      </div>
    </div>
  `;
}

/**
 * Render animation metadata
 * @param {Object} animation - Animation metadata
 * @returns {TemplateResult} Rendered animation info
 */
export function renderAnimationPreview(animation) {
  return html`
    <div class="animation-preview">
      <div class="preview-label">Animation Info</div>
      <div class="animation-details">
        ${animation.preset ? html`<div><strong>Preset:</strong> ${animation.preset}</div>` : ''}
        ${animation.duration ? html`<div><strong>Duration:</strong> ${animation.duration}ms</div>` : ''}
        ${animation.easing ? html`<div><strong>Easing:</strong> ${animation.easing}</div>` : ''}
        ${animation.loop ? html`<div><strong>Loop:</strong> Yes</div>` : ''}
      </div>
    </div>
  `;
}

/**
 * Render SVG asset preview
 * @param {Object} asset - SVG asset metadata
 * @returns {TemplateResult} Rendered SVG preview
 */
export function renderSvgPreview(asset) {
  // For MVP, just show metadata
  // Future enhancement: Fetch and display actual SVG
  return html`
    <div class="svg-preview">
      <div class="preview-label">SVG Asset</div>
      <div class="preview-note">
        SVG inline preview coming soon
      </div>
    </div>
  `;
}

/**
 * Shared CSS styles for renderers
 */
export const rendererStyles = css`
  .theme-preview,
  .preset-preview,
  .animation-preview,
  .svg-preview {
    background: var(--secondary-background-color);
    border: 1px solid var(--divider-color);
    border-radius: 6px;
    padding: 16px;
    margin: 12px 0;
  }

  .preview-label {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--primary-text-color);
  }

  .preview-note {
    font-size: 13px;
    color: var(--secondary-text-color);
    margin-bottom: 12px;
  }

  .preview-placeholder {
    background: var(--card-background-color);
    border: 2px dashed var(--divider-color);
    border-radius: 4px;
    padding: 24px;
    text-align: center;
    color: var(--secondary-text-color);
    font-style: italic;
  }

  .animation-details {
    font-size: 13px;
    line-height: 1.6;
  }

  .animation-details div {
    margin: 4px 0;
  }

  .animation-details strong {
    color: var(--primary-text-color);
  }
`;
