/**
 * @fileoverview The launcher card at the top of a Main Engineering sub-tab (Data
 * Sources, Theme Browser, Provenance, Templates): what the tool is, a few counts,
 * and the button that opens it. A black inset card (the LCARS look the config
 * panel and studios use), with an mdi icon in the heading.
 *
 * @module editor/components/shared/launcher
 */

import { html, css, nothing } from 'lit';

/** The launcher card's styles; add to the host's styles. */
export const launcherStyles = css`
  .launcher {
    background: var(--primary-background-color);
    border: var(--ha-border-width-sm) solid var(--divider-color);
    border-radius: var(--ha-card-border-radius, var(--ha-border-radius-lg));
    padding: var(--ha-space-5) var(--ha-space-6);
    margin-bottom: var(--lcards-section-spacing, var(--ha-space-4));
    box-shadow: var(--ha-box-shadow-s);
  }
  .launcher-head {
    display: flex;
    align-items: center;
    gap: var(--ha-space-3);
    margin: 0 0 var(--ha-space-2);
  }
  .launcher-head ha-icon {
    --mdc-icon-size: 24px;
    color: var(--primary-color);
    flex: none;
  }
  .launcher-head h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    color: var(--primary-text-color);
  }
  .launcher-desc {
    margin: 0 0 var(--ha-space-3);
    font-size: 13px;
    line-height: 1.5;
    color: var(--secondary-text-color);
  }
  .launcher-stats {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ha-space-1) var(--ha-space-4);
    margin: 0 0 var(--ha-space-4);
    font-size: 14px;
    color: var(--primary-text-color);
  }
  .launcher-stats strong {
    font-weight: 600;
  }
  .launcher-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--ha-space-2);
    padding-top: var(--ha-space-3);
    border-top: var(--ha-border-width-sm) solid var(--divider-color);
  }
`;

/**
 * @param {Object} opts
 * @param {string} opts.icon - mdi icon for the heading
 * @param {string} opts.title - Heading text
 * @param {string} opts.description - One line: what the tool shows
 * @param {Array<{value: (string|number), label: string}>} [opts.stats] - Counts, e.g. { value: 3, label: 'card sources' }
 * @param {Array<{label: string, icon: string, onClick: Function}>} opts.actions - Buttons (the first is the main one)
 * @returns {import('lit').TemplateResult}
 */
export function renderLauncher({ icon, title, description, stats = [], actions }) {
  return html`
    <div class="launcher">
      <div class="launcher-head">
        <ha-icon icon=${icon}></ha-icon>
        <h3>${title}</h3>
      </div>
      <p class="launcher-desc">${description}</p>
      ${stats.length ? html`
        <div class="launcher-stats">
          ${stats.map(s => html`<span><strong>${s.value}</strong> ${s.label}</span>`)}
        </div>
      ` : nothing}
      <div class="launcher-actions">
        ${actions.map((a, i) => html`
          <ha-button variant="brand" appearance=${i === 0 ? 'accent' : 'outlined'} @click=${a.onClick}>
            <ha-icon icon=${a.icon} slot="start"></ha-icon>
            ${a.label}
          </ha-button>
        `)}
      </div>
    </div>
  `;
}
