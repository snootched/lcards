/**
 * @fileoverview LCARdS About / Welcome Tab
 *
 * Displays a Get Started checklist, a Panel Guide with clickable tab
 * navigation cards, a Support & system info health check (copy support info /
 * open a prefilled GitHub bug report), and resource links. Fires `lcards-navigate-tab`
 * (bubbles, composed) when the user clicks a Panel Guide card so the
 * parent config panel can switch tabs without tight coupling.
 *
 * @element lcards-about-tab
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { copyTextToClipboard } from '../../utils/clipboard-utils.js';
import { buildSupportReport, openIssueForReport } from '../../utils/support-info.js';
import '../../editor/components/shared/lcards-message.js';
import { surfaceStyles } from '../../editor/base/surface-styles.js';
import { docsUrl, DOCS } from '../../utils/docs-url.js';

export class LCARdSAboutTab extends LitElement {
  static properties = {
    hass: { type: Object },
    _report:        { type: Object,  state: true },
    _reportLoading: { type: Boolean, state: true },
    _includeConfig: { type: Boolean, state: true },
    _supportNotice: { type: String,  state: true },
  };

  constructor() {
    super();
    /** @type {any} */
    this.hass = undefined;
    /** @type {{info: object, checks: any[], markdown: string, compactMarkdown: string}|null} */
    this._report = null;
    this._reportLoading = false;
    this._includeConfig = false;
    this._supportNotice = '';
    this._noticeTimer = null;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this._noticeTimer);
  }

  updated(changed) {
    // Collect once hass is available. Pre-collecting matters: the copy / report
    // buttons must act synchronously in the click (clipboard + window.open are
    // blocked after an awaited round-trip in Safari/Firefox).
    if (changed.has('hass') && this.hass && !this._report && !this._reportLoading) {
      this._refreshSupport();
    }
  }

  // ============================================================================
  // SUPPORT & SYSTEM INFO
  // ============================================================================

  async _refreshSupport() {
    this._reportLoading = true;
    try {
      this._report = await buildSupportReport({ hass: this.hass, includeConfig: this._includeConfig });
    } catch (err) {
      lcardsLog.error('[AboutTab] Failed to collect support info', err);
    } finally {
      this._reportLoading = false;
    }
  }

  _flashNotice(text) {
    this._supportNotice = text;
    clearTimeout(this._noticeTimer);
    this._noticeTimer = setTimeout(() => { this._supportNotice = ''; }, 6000);
  }

  async _copySupport() {
    if (!this._report) return;
    const ok = await copyTextToClipboard(this._report.markdown);
    this._flashNotice(ok ? 'Support info copied to the clipboard.' : 'Copy failed: select the text in the preview below and copy it manually.');
  }

  _openIssue() {
    if (!this._report) return;
    const { truncated, copied } = openIssueForReport(this._report);
    copied.then((ok) => this._flashNotice(
      !ok ? 'GitHub opened: copy failed, so paste the preview text below into "LCARdS support info".'
        : truncated ? 'GitHub opened with a summary: full support info is on your clipboard; paste it into "LCARdS support info".'
        : 'GitHub opened with your support info prefilled (also copied to the clipboard). Review it and describe the problem.'));
  }

  _toggleIncludeConfig(e) {
    this._includeConfig = e.target.checked;
    this._refreshSupport();
  }

  _renderSupportSection() {
    const STATUS_ICON = { ok: 'mdi:check-circle', warn: 'mdi:alert', error: 'mdi:close-circle', info: 'mdi:information-outline' };
    const report = this._report;
    const checks = report?.checks ?? [];
    const problems = checks.filter(c => c.status === 'warn' || c.status === 'error');
    const info = /** @type {any} */ (report?.info);

    return html`
      <div class="section">
        <div class="section-header">
          <ha-icon icon="mdi:lifebuoy"></ha-icon>
          Support &amp; system info
        </div>
        <p class="section-intro">
          A health check of your setup. If something isn't working, copy this info or open a pre-filled
          GitHub bug report: it's opened for you to review; nothing is sent automatically.
        </p>

        ${!report ? html`
          <div class="support-loading">${this._reportLoading ? 'Collecting system info…' : 'System info unavailable.'}</div>
        ` : html`
          ${problems.length ? html`
            <lcards-message type="${problems.some(c => c.status === 'error') ? 'error' : 'warning'}">
              <strong>${problems.length} issue${problems.length === 1 ? '' : 's'} found</strong>. See the checks below for fixes.
            </lcards-message>
          ` : ''}

          <div class="support-versions">
            <span><b>LCARdS</b> ${info?.lcards?.version ?? '-'}</span>
            <span><b>Integration</b> ${info?.lcards?.backendVersion ?? '-'}</span>
            <span><b>Home Assistant</b> ${info?.ha?.version ?? '-'}</span>
            <span><b>Frontend</b> ${info?.ha?.frontendVersion ?? '-'}</span>
          </div>

          <ul class="support-checks">
            ${checks.map(c => html`
              <li class="check ${c.status}">
                <ha-icon icon="${STATUS_ICON[c.status] ?? 'mdi:circle-small'}"></ha-icon>
                <div class="check-body">
                  <span class="check-title">${c.title}</span>
                  ${c.detail ? html`<span class="check-detail">${c.detail}</span>` : ''}
                  ${c.fix ? html`<span class="check-fix">Fix: ${c.fix}</span>` : ''}
                </div>
              </li>
            `)}
          </ul>

          <div class="support-actions">
            <ha-button appearance="filled" @click=${this._openIssue} ?disabled=${this._reportLoading}>
              <ha-icon icon="mdi:bug-outline" slot="start"></ha-icon>Report an issue
            </ha-button>
            <ha-button appearance="outlined" @click=${this._copySupport} ?disabled=${this._reportLoading}>
              <ha-icon icon="mdi:content-copy" slot="start"></ha-icon>Copy support info
            </ha-button>
            <ha-button appearance="plain" @click=${this._refreshSupport} ?disabled=${this._reportLoading}>
              <ha-icon icon="mdi:refresh" slot="start"></ha-icon>Refresh
            </ha-button>
            <ha-checkbox .checked=${this._includeConfig} @change=${this._toggleIncludeConfig}>
              Include data-source names &amp; entity IDs
            </ha-checkbox>
          </div>

          ${this._supportNotice ? html`<div class="support-notice">${this._supportNotice}</div>` : ''}

          <details class="support-preview">
            <summary>Preview what will be shared</summary>
            <pre>${report.markdown}</pre>
          </details>
        `}
      </div>
    `;
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
        label: 'Theme Studio',
        desc: 'LCARdS Alert Mode Lab (fully customize alert colour transforms), HA-LCARS Theme Lab, browsable LCARdS/HA CSS variable references',
      },
      {
        index: 3,
        icon: 'mdi:wifi-off',
        label: 'Connectivity',
        desc: 'Configure the connection-lost overlay: what is shown when HA loses its WebSocket connection, and the "connection restored" confirmation banner',
      },
      {
        index: 4,
        icon: 'mdi:volume-high',
        label: 'Sounds',
        desc: 'Select sound schemes and customize/preview sounds for alert modes and interactions types',
      },
      {
        index: 6,
        icon: 'mdi:package-variant',
        label: 'Pack Explorer',
        desc: 'Browse the pre-built content packs that add cards styles, fonts, sounds, images and more',
      },
      {
        index: 7,
        icon: 'mdi:database-cog',
        label: 'Storage',
        desc: 'Advanced: Inspect and manage the raw key/value data LCARdS stores for persistent configuration (data that is not stored in HA helpers - use with caution)',
      },
    ];
  }

  /**
   * Resources section links. Bug reports go through the Support & system info
   * section (prefilled form), so there is deliberately no bare "issues" link.
   */
  static get _RESOURCE_LINKS() {
    return [
      { icon: 'mdi:book-open-variant', title: 'Documentation', caption: 'lcards.unimatrix01.ca',
        href: docsUrl(DOCS.home) },
      { icon: 'mdi:lifebuoy', title: 'Getting Help', caption: 'Troubleshooting & reporting problems',
        href: docsUrl(DOCS.gettingHelp) },
      { icon: 'mdi:forum-outline', title: 'Discussions', caption: 'Questions, config help & showcase',
        href: 'https://github.com/snootched/LCARdS/discussions' },
      { icon: 'mdi:github', title: 'GitHub Repository', caption: 'github.com/snootched/LCARdS',
        href: 'https://github.com/snootched/LCARdS' },
      { icon: 'mdi:tag-multiple-outline', title: 'Releases', caption: "What's new in each version",
        href: 'https://github.com/snootched/LCARdS/releases' },
      { icon: 'mdi:source-branch', title: 'HA-LCARS Theme', caption: 'github.com/th3jesta/ha-lcars',
        href: 'https://github.com/th3jesta/ha-lcars' },
      { icon: 'mdi:puzzle-outline', title: 'UI eXtension (UIX)', caption: 'Required by HA-LCARS (replaces card-mod)',
        href: 'https://github.com/Lint-Free-Technology/uix' },
    ];
  }

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  /** True when the dev-only features URL parameter is present (?lcards_dev_features=true). */
  _isDevFeaturesEnabled() {
    return new URLSearchParams(window.location.search).get('lcards_dev_features') === 'true';
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
              <span class="step-desc">Configure audio feedback for alert modes and card interactions: assign sounds and adjust volume levels</span>
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
              @click=${() => this._navigateToTab(5)}
              @keydown=${(e) => e.key === 'Enter' && this._navigateToTab(5)}
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
          ${this._isDevFeaturesEnabled() ? html`
            <div
                class="tab-guide-card"
                role="button"
                tabindex="0"
                @click=${() => this._navigateToTab(8)}
                @keydown=${(e) => e.key === 'Enter' && this._navigateToTab(8)}
              >
              <div class="tab-guide-icon">
                <ha-icon icon="mdi:view-grid-plus-outline"></ha-icon>
              </div>
              <div class="tab-guide-body">
                <span class="tab-guide-title">Layouts</span>
                <span class="tab-guide-desc">Dev preview: compose reusable card layouts with a WYSIWYG grid editor (enabled via the ?lcards_dev_features=true URL parameter).</span>
              </div>
              <ha-icon icon="mdi:arrow-right" class="tab-guide-arrow"></ha-icon>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- ── Support & system info ───────────────────────────────── -->
      ${this._renderSupportSection()}

      <!-- ── Resources ─────────────────────────────────────────── -->
      <div class="section">
        <div class="section-header">
          <ha-icon icon="mdi:link-variant"></ha-icon>
          Resources
        </div>
        <div class="links-grid">
          ${LCARdSAboutTab._RESOURCE_LINKS.map(link => html`
            <a class="link-card" href="${link.href}" target="_blank" rel="noopener">
              <ha-icon icon="${link.icon}"></ha-icon>
              <div class="link-body">
                <span class="link-title">${link.title}</span>
                <span class="link-url">${link.caption}</span>
              </div>
              <ha-icon icon="mdi:open-in-new" class="link-external"></ha-icon>
            </a>
          `)}
        </div>
      </div>

      <!-- ── Legal / attribution ───────────────────────────────── -->
      <div class="footer">
        LCARdS is licensed <a href="https://github.com/snootched/lcards/blob/main/LICENSE" target="_blank" rel="noopener">MIT</a>
        · LCARS aesthetics inspired by Star Trek <a href=${docsUrl(DOCS.credits)} target="_blank" rel="noopener">[disclaimer]</a>
      </div>

      </div>
    `;
  }

  // ============================================================================
  // STYLES
  // ============================================================================

  static styles = [surfaceStyles, css`
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
      background: color-mix(
          in srgb,
          var(--secondary-background-color) 50%,
          color-mix(in srgb, var(--primary-background-color) 25%, transparent)
      );
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
      border-bottom: var(--ha-border-width-sm) solid color-mix(in srgb, var(--divider-color) 60%, transparent);
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
      border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--divider-color) 60%, transparent);
      background: var(--secondary-background-color);
      cursor: pointer;
      color: var(--primary-text-color);
      transition: background var(--ha-animation-duration-fast), border-color var(--ha-animation-duration-fast);
    }

    .tab-guide-card:hover {
      background: color-mix(in srgb, var(--primary-color) 15%, var(--secondary-background-color));
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
      transition: color var(--ha-animation-duration-fast);
    }

    .tab-guide-card:hover .tab-guide-arrow {
      color: var(--primary-color);
    }

    /* ── Links grid ──────────────────────────────────── */
    /* ── Support & system info ── */
    .support-loading,
    .support-notice {
      color: var(--secondary-text-color);
      font-size: var(--ha-font-size-s, 0.875rem);
      padding: var(--ha-space-2) 0;
    }

    .support-notice {
      color: var(--primary-text-color);
    }

    .support-versions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--ha-space-2) var(--ha-space-5);
      margin: var(--ha-space-3) 0;
      color: var(--secondary-text-color);
      font-size: var(--ha-font-size-s, 0.875rem);
    }

    .support-versions b {
      color: var(--primary-text-color);
      font-weight: 500;
    }

    .support-checks {
      list-style: none;
      margin: 0 0 var(--ha-space-3);
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--ha-space-2);
    }

    .check {
      display: flex;
      gap: var(--ha-space-2);
      align-items: flex-start;
    }

    .check ha-icon {
      --mdc-icon-size: 20px;
      flex-shrink: 0;
    }

    .check.ok ha-icon    { color: var(--success-color); }
    .check.warn ha-icon  { color: var(--warning-color); }
    .check.error ha-icon { color: var(--error-color); }
    .check.info ha-icon  { color: var(--secondary-text-color); }

    .check-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .check-title {
      color: var(--primary-text-color);
    }

    .check-detail,
    .check-fix {
      color: var(--secondary-text-color);
      font-size: var(--ha-font-size-s, 0.875rem);
      overflow-wrap: anywhere;
    }

    .check-fix {
      color: var(--primary-text-color);
    }

    .support-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--ha-space-2);
    }

    .support-preview {
      margin-top: var(--ha-space-3);
    }

    .support-preview summary {
      cursor: pointer;
      color: var(--secondary-text-color);
    }

    .support-preview pre {
      max-height: 320px;
      overflow: auto;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      font-family: var(--ha-font-family-code, monospace);
      font-size: var(--ha-font-size-xs, 0.75rem);
      padding: var(--ha-space-3);
      border-radius: var(--ha-border-radius-md);
      background: var(--secondary-background-color);
      border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--divider-color) 60%, transparent);
    }

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
      border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--divider-color) 60%, transparent);
      background: var(--secondary-background-color);
      text-decoration: none;
      color: var(--primary-text-color);
      transition: background var(--ha-animation-duration-fast), border-color var(--ha-animation-duration-fast);
    }

    .link-card:hover {
      background: color-mix(in srgb, var(--primary-color) 15%, var(--secondary-background-color));
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
  `];
}

if (!customElements.get('lcards-about-tab')) {
  customElements.define('lcards-about-tab', LCARdSAboutTab);
}
