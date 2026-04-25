/**
 * @fileoverview LCARdS About / Welcome Tab
 *
 * Displays a Get Started checklist, a Panel Guide with clickable tab
 * navigation cards, and resource links. Fires `lcards-navigate-tab`
 * (bubbles, composed) when the user clicks a Panel Guide card so the
 * parent config panel can switch tabs without tight coupling.
 *
 * @element lcards-about-tab
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import './lcards-preview-chip.js';

export class LCARdSAboutTab extends LitElement {
  static properties = {
    hass: { type: Object },
    previewEnabled: { type: Boolean },
  };

  constructor() {
    super();
    /** @type {any} */
    this.hass = undefined;
    /** @type {boolean} */
    this.previewEnabled = false;
  }

  // ============================================================================
  // TAB GUIDE DEFINITIONS
  // ============================================================================

  static get _TAB_GUIDE() {
    return [
      {
        index: 1,
        icon: 'mdi:cog',
        label: 'Helpers',
        desc: 'Create and manage the HA input helpers LCARdS and HA-LCARS use to store dynamic configuration values',
      },
      {
        index: 2,
        icon: 'mdi:palette-swatch',
        label: 'Alert Lab & Theme Browser',
        desc: 'Customize and preview how colours are derived for ALERT modes.  You can also browse tokens and CSS variables in the system for easy visual reference',
      },
      {
        index: 3,
        icon: 'mdi:volume-high',
        label: 'Sounds',
        desc: 'Select sound schemes and customize/preview sounds for alert modes and interactions types',
      },
      {
        index: 5,
        icon: 'mdi:package-variant',
        label: 'Pack Explorer',
        desc: 'Browse the pre-built content packs that add cards styles, fonts, sounds, images and more',
      },
      {
        index: 6,
        icon: 'mdi:database-cog',
        label: 'Storage',
        desc: 'Advanced: Inspect and manage the raw key/value data LCARdS stores for persistent configuration (data that is not stored in HA helpers - use with caution)',
      },
    ];
  }

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  /** True when the user has opted into preview / experimental features. */
  _isPreviewEnabled() {
    return this.previewEnabled;
  }

  /**
   * Fire a bubbling event so the parent config panel switches to the given tab.
   * @param {number} tabIndex
   */
  _navigateToTab(tabIndex) {
    this.dispatchEvent(new CustomEvent('lcards-navigate-tab', {
      detail: { tab: tabIndex },
      bubbles: true,
      composed: true,
    }));
    lcardsLog.debug(`[AboutTab] Navigating to tab ${tabIndex}`);
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  render() {
    return html`
      <div class="scrollable-body">

      <!-- ── Getting Started ───────────────────────────────────────── -->
      <div class="section">
        <div class="section-header">
          <ha-icon icon="mdi:rocket-launch-outline"></ha-icon>
          Getting Started
        </div>
        <p class="section-intro">Welcome to LCARdS for Home Assistant!   Follow these steps to get started:</p>
        <ol class="steps-list">
          <li class="step">
            <div class="step-number">1</div>
            <div class="step-body">
              <span class="step-title">Create Helpers</span>
              <span class="step-desc">Setup LCARdS and HA-LCARS input helper entities - used to dynamically configure certain settings</span>
            </div>
          </li>
          <li class="step">
            <div class="step-number">2</div>
            <div class="step-body">
              <span class="step-title">Customize ALERT Modes</span>
              <span class="step-desc">Customize your LCARS alert mode visuals from the Alert Lab</span>
            </div>
          </li>
          <li class="step">
            <div class="step-number">3</div>
            <div class="step-body">
              <span class="step-title">Customize Sounds</span>
              <span class="step-desc">Configure audio feedback for alert modes and card interactions — assign sounds and adjust volume levels</span>
            </div>
          </li>
        </ol>
      </div>

      <!-- ── Panel Guide ───────────────────────────────────────── -->
      <div class="section">
        <div class="section-header">
          <ha-icon icon="mdi:view-dashboard-outline"></ha-icon>
          Panel Guide
        </div>
        <div class="tab-guide-grid">
          ${LCARdSAboutTab._TAB_GUIDE.map(tab => html`
            <div
              class="tab-guide-card"
              role="button"
              tabindex="0"
              @click=${() => this._navigateToTab(tab.index)}
              @keydown=${(e) => e.key === 'Enter' && this._navigateToTab(tab.index)}
            >
              <div class="tab-guide-icon">
                <ha-icon icon="${tab.icon}"></ha-icon>
              </div>
              <div class="tab-guide-body">
                <span class="tab-guide-title">${tab.label}</span>
                <span class="tab-guide-desc">${tab.desc}</span>
              </div>
              <ha-icon icon="mdi:arrow-right" class="tab-guide-arrow"></ha-icon>
            </div>
          `)}
          <div
              class="tab-guide-card"
              role="button"
              tabindex="0"
              @click=${() => this._navigateToTab(4)}
              @keydown=${(e) => e.key === 'Enter' && this._navigateToTab(4)}
            >
              <div class="tab-guide-icon">
                <ha-icon icon="mdi:account-multiple-outline"></ha-icon>
              </div>
              <div class="tab-guide-body">
                <span class="tab-guide-title">Users &amp; Devices</span>
                <span class="tab-guide-desc">Manage registered devices and users with stored per-user / per-device overrides. Edit or clear scoped settings centrally (admin only).</span>
              </div>
              <ha-icon icon="mdi:arrow-right" class="tab-guide-arrow"></ha-icon>
            </div>
        </div>
      </div>

      <!-- ── Preview Features ──────────────────────────────────── -->
      <div class="section">
        <div class="section-header">
          <ha-icon icon="mdi:flask-outline"></ha-icon>
          Preview Features
          <lcards-preview-chip></lcards-preview-chip>
        </div>
        <p class="section-intro" style="margin-bottom:0;">
          To enable, go to <strong>Settings → Devices &amp; Services → LCARdS → Configure</strong>
          and turn on <em>Enable Preview Features</em>.
        </p>

        <p class="section-intro">
          Preview features are already included in the release &mdash; by opting-in with this setting it will surface their configuration across the UI allowing you can control them.
          By default, features will operate behind the scenes with established defaults &mdash; you simply won&rsquo;t see the settings.
        </p>
        <p class="section-intro">
          Features in preview:
        </p>

        <ul class="preview-features-list">
          <li>
            <ha-icon icon="mdi:tune"></ha-icon>
            <div>
              <span class="pf-title">Token Overrides (Alert Lab)</span>
              <span class="pf-desc">A dedicated <em>Token Overrides</em> tab in the Alert Lab allowing you to create scoped or global token overrides that persist as part of your LCARdS configuration.</span>
            </div>
          </li>
        </ul>

      </div>

      <!-- ── Resources ─────────────────────────────────────────── -->
      <div class="section">
        <div class="section-header">
          <ha-icon icon="mdi:link-variant"></ha-icon>
          Resources
        </div>
        <div class="links-grid">
          <a class="link-card" href="https://lcards.unimatrix01.ca" target="_blank" rel="noopener">
            <ha-icon icon="mdi:book-open-variant"></ha-icon>
            <div class="link-body">
              <span class="link-title">Documentation</span>
              <span class="link-url">lcards.unimatrix01.ca</span>
            </div>
            <ha-icon icon="mdi:open-in-new" class="link-external"></ha-icon>
          </a>

          <a class="link-card" href="https://github.com/snootched/LCARdS" target="_blank" rel="noopener">
            <ha-icon icon="mdi:github"></ha-icon>
            <div class="link-body">
              <span class="link-title">GitHub Repository</span>
              <span class="link-url">github.com/snootched/LCARdS</span>
            </div>
            <ha-icon icon="mdi:open-in-new" class="link-external"></ha-icon>
          </a>

          <a class="link-card" href="https://github.com/snootched/LCARdS/issues" target="_blank" rel="noopener">
            <ha-icon icon="mdi:bug-outline"></ha-icon>
            <div class="link-body">
              <span class="link-title">Report an Issue</span>
              <span class="link-url">github.com/snootched/LCARdS/issues</span>
            </div>
            <ha-icon icon="mdi:open-in-new" class="link-external"></ha-icon>
          </a>

          <a class="link-card" href="https://github.com/snootched/LCARdS/releases" target="_blank" rel="noopener">
            <ha-icon icon="mdi:tag-multiple-outline"></ha-icon>
            <div class="link-body">
              <span class="link-title">Releases</span>
              <span class="link-url">github.com/snootched/LCARdS/releases</span>
            </div>
            <ha-icon icon="mdi:open-in-new" class="link-external"></ha-icon>
          </a>
        </div>
      </div>

      <!-- ── Legal / attribution ───────────────────────────────── -->
      <div class="footer">
        LCARdS is licensed <a href="https://github.com/snootched/lcards/blob/main/LICENSE" target="_blank" rel="noopener">MIT</a>
        · LCARS aesthetics inspired by Star Trek <a href="https://lcards.unimatrix01.ca/credits.html" target="_blank" rel="noopener">[disclaimer]</a>
      </div>

      </div>
    `;
  }

  // ============================================================================
  // STYLES
  // ============================================================================

  static styles = css`
    :host {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }

    /* Scrollable content area — same pattern as sound/storage tabs */
    .scrollable-body {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding-bottom: 8px;
    }

    /* ── Sections — matches lcards-form-section background ─────── */
    .section {
      background: rgba(60, 60, 60, 0.5);
      border-radius: var(--ha-card-border-radius, 12px);
      padding: 12px 16px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1em;
      font-weight: 600;
      color: var(--primary-text-color);
      padding-bottom: 12px;
      border-bottom: 1px solid color-mix(in srgb, var(--divider-color) 60%, transparent);
      margin-bottom: 12px;
    }

    .section-header ha-icon {
      --mdc-icon-size: 20px;
      color: var(--primary-color);
    }

    /* ── Get Started steps ───────────────────────────── */
    .section-intro {
      margin: 0 0 12px 0;
      color: var(--secondary-text-color);
      line-height: 1.5;
    }

    /* ── Preview features list ───────────────────────── */
    .preview-features-list {
      list-style: none;
      margin: 0 0 14px 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .preview-features-list li {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 9px 12px;
      border-radius: 8px;
      background: color-mix(in srgb, var(--info-color, #03a9f4) 7%, rgba(40,40,40,0.5));
      border: 1px solid color-mix(in srgb, var(--info-color, #03a9f4) 20%, transparent);
    }

    .preview-features-list ha-icon {
      flex-shrink: 0;
      color: var(--info-color, #03a9f4);
      margin-top: 2px;
    }

    .preview-features-list div {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .pf-title {
      font-weight: 600;
      color: var(--primary-text-color);
      font-size: 0.92em;
    }

    .pf-desc {
      color: var(--secondary-text-color);
      font-size: 0.85em;
      line-height: 1.5;
    }

    .pf-desc code {
      font-family: monospace;
      background: rgba(255,255,255,0.08);
      padding: 1px 4px;
      border-radius: 3px;
      font-size: 0.95em;
    }

    .steps-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .step {
      display: flex;
      align-items: flex-start;
      gap: 14px;
    }

    .step-number {
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--primary-color, #1b4f8a);
      color: white;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--lcars-font), var(--lcars-fallback-font), 'Antonio', sans-serif;
      letter-spacing: 0.05em;
      margin-top: 1px;
    }

    .step-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .step-title {
      font-weight: 600;
      color: var(--primary-text-color);
    }

    .step-desc {
      color: var(--secondary-text-color);
      line-height: 1.5;
      font-size: 0.9em;
    }

    /* ── Panel Guide grid ────────────────────────────── */
    .tab-guide-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 6px;
    }

    .tab-guide-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: var(--ha-card-border-radius, 12px);
      border: 1px solid color-mix(in srgb, var(--divider-color) 60%, transparent);
      background: rgba(40, 40, 40, 0.6);
      cursor: pointer;
      color: var(--primary-text-color);
      transition: background 0.15s, border-color 0.15s;
    }

    .tab-guide-card:hover {
      background: color-mix(in srgb, var(--primary-color, #1b4f8a) 18%, rgba(40, 40, 40, 0.8));
      border-color: var(--primary-color);
    }

    .tab-guide-card:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    .tab-guide-icon {
      flex-shrink: 0;
      --mdc-icon-size: 22px;
      color: var(--primary-color);
    }

    .tab-guide-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      min-width: 0;
    }

    .tab-guide-title {
      font-weight: 600;
    }

    .tab-guide-desc {
      color: var(--secondary-text-color);
      line-height: 1.4;
      font-size: 0.9em;
    }

    .tab-guide-arrow {
      --mdc-icon-size: 16px;
      color: var(--secondary-text-color);
      flex-shrink: 0;
      transition: color 0.15s;
    }

    .tab-guide-card:hover .tab-guide-arrow {
      color: var(--primary-color);
    }

    /* ── Links grid ──────────────────────────────────── */
    .links-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 6px;
    }

    .link-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: var(--ha-card-border-radius, 12px);
      border: 1px solid color-mix(in srgb, var(--divider-color) 60%, transparent);
      background: rgba(40, 40, 40, 0.6);
      text-decoration: none;
      color: var(--primary-text-color);
      transition: background 0.15s, border-color 0.15s;
    }

    .link-card:hover {
      background: color-mix(in srgb, var(--primary-color, #1b4f8a) 18%, rgba(40, 40, 40, 0.8));
      border-color: var(--primary-color);
    }

    .link-card > ha-icon:first-child {
      --mdc-icon-size: 20px;
      color: var(--primary-color);
      flex-shrink: 0;
    }

    .link-body {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }

    .link-title {
      font-weight: 500;
    }

    .link-url {
      color: var(--secondary-text-color);
      font-size: 0.85em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .link-external {
      --mdc-icon-size: 14px;
      color: var(--secondary-text-color);
      flex-shrink: 0;
    }

    /* ── Footer ──────────────────────────────────────── */
    .footer {
      text-align: center;
      font-size: 0.9em;
      color: var(--secondary-text-color);
      padding: 4px 0 12px;
    }

    .footer a {
      color: var(--primary-color);
      text-decoration: none;
    }

    .footer a:hover {
      text-decoration: underline;
    }
  `;
}

if (!customElements.get('lcards-about-tab')) {
  customElements.define('lcards-about-tab', LCARdSAboutTab);
}
