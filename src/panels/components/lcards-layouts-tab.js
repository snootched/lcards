/**
 * @fileoverview LCARdS Layouts Tab
 *
 * Template library for LCARdS layouts. Two categories:
 *
 * Shells  — complete view YAML (outer grid, sidebar, elbows, decorative
 *           elements) with a content-panel placeholder zone.
 *
 * Content Panels — standalone card YAML that drops into a shell's
 *                  content-panel grid area. Uses lcards-elbow frame +
 *                  symbiont for reliable full-height sizing.
 *
 * Users select a template, fill in minimal structural inputs, and copy
 * the generated YAML into their HA dashboard raw editor.
 *
 * @element lcards-layouts-tab
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import '../../editor/components/shared/lcards-form-section.js';

// ============================================================================
// MINIMAL YAML SERIALIZER
// ============================================================================

function _needsQuote(s) {
  return (
    /^(true|false|null)$/i.test(s) ||
    /^[0-9]/.test(s) ||
    /[:#[\]{}&*!|>'"%@`]/.test(s) ||
    s.includes('\n')
  );
}

function _toYaml(value, indent = 0) {
  const pad = '  '.repeat(indent);

  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);

  if (typeof value === 'string') {
    if (_needsQuote(value)) return `'${value.replace(/'/g, "''")}'`;
    return value;
  }

  if (Array.isArray(value)) {
    if (!value.length) return '[]';
    return value
      .map(item => {
        if (item !== null && typeof item === 'object') {
          const innerPad = '  '.repeat(indent + 1);
          const lines = _toYaml(item, indent + 1).split('\n');
          const firstContent = lines[0].startsWith(innerPad)
            ? lines[0].slice(innerPad.length)
            : lines[0];
          return `${pad}- ${firstContent}\n${lines.slice(1).join('\n')}`;
        }
        return `${pad}- ${_toYaml(item, indent)}`;
      })
      .join('\n');
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (!keys.length) return '{}';
    return keys
      .map(k => {
        const v = value[k];
        const key = _needsQuote(k) ? `'${k.replace(/'/g, "''")}'` : k;
        if (v !== null && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length) {
          return `${pad}${key}:\n${_toYaml(v, indent + 1)}`;
        }
        if (Array.isArray(v) && v.length && typeof v[0] === 'object') {
          return `${pad}${key}:\n${_toYaml(v, indent + 1)}`;
        }
        return `${pad}${key}: ${_toYaml(v, indent)}`;
      })
      .join('\n');
  }

  return String(value);
}

// ============================================================================
// SHELL GENERATE FUNCTIONS
// ============================================================================

const _CARD_MOD_FULL_HEIGHT = 'grid-layout { --layout-height: 100% !important; }';

function _shellGridAreas() {
  return [
    '"header-border header-border header-border header-border header-border header-border header-border header-border"',
    '"border-left header-left . header header header header sidebar-right"',
    '"border-left header-left . . . . . sidebar-right"',
    '"border-left header-left . content-panel content-panel content-panel . sidebar-right"',
    '"sidebar-left sidebar-left . content-panel content-panel content-panel . sidebar-right"',
    '"footer-left footer-left footer-left content-panel content-panel content-panel . sidebar-right"',
    '"footer-left footer-left footer-left . . . . sidebar-right"',
    '"footer-left footer-left footer-left . footer footer footer sidebar-right"',
    '"footer-left footer-left footer-left . footer-border footer-border footer-border sidebar-right"',
  ].join(' ');
}

function _generateShellAdaptive(inputs, size) {
  const title = (inputs.title || 'LCARdS Dashboard').trim();
  const path = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'lcards-dashboard';
  const pages = (inputs.page_names || 'HOME, LIGHTS, SECURITY')
    .split(',').map(p => p.trim().toUpperCase()).filter(Boolean);

  const innerSidebar = size === '9inch' ? 'clamp(80px, 11vw, 150px)' : 'clamp(100px, 12vw, 180px)';
  const mqBreak     = size === '9inch' ? 820 : 1010;

  const layout = {
    height: 'calc(100dvh - var(--header-height, 56px))',
    'grid-gap': '5px',
    card_margin: 0,
    margin: 0,
    padding: 0,
    'grid-template-columns': `45px ${innerSidebar} 5px 40px 1fr 40px 5px minmax(0, auto)`,
    'grid-template-rows': 'minmax(0,auto) clamp(25px, 5vh, 95px) 5px 40px 1fr 40px 5px clamp(25px, 5vh, 95px) 45px',
    'grid-template-areas': _shellGridAreas(),
    mediaquery: {
      [`(max-width: ${mqBreak}px)`]: {
        'grid-template-rows': 'minmax(0,auto) clamp(25px, 5vh, 95px) 5px 40px minmax(0,1fr) 40px 5px clamp(25px, 5vh, 95px) 45px',
        'grid-gap': '5px',
        'grid-template-columns': `45px ${innerSidebar} 5px 40px 1fr 40px 1px minmax(0,auto)`,
      },
    },
  };

  const view = {
    title,
    path,
    type: 'custom:grid-layout',
    layout,
    card_mod: { style: _CARD_MOD_FULL_HEIGHT },
    cards: [
      // footer-left: segmented elbow decoration
      {
        type: 'custom:lcards-elbow',
        elbow: {
          type: 'footer-left',
          radius: { outer: 'auto' },
          style: 'segmented',
          segments: {
            gap: 5,
            outer_segment: {
              bar_width: 45, bar_height: 45, outer_curve: 160, inner_curve: 115,
              color: { default: 'var(--lcars-ui-primary)' },
            },
            inner_segment: {
              bar_width: innerSidebar, bar_height: 'clamp(25px, 5vh, 95px)', inner_curve: 35,
              color: { default: 'var(--lcars-ui-quaternary)', hover: 'var(--lcards-green)' },
            },
          },
        },
        width: `calc(50px + ${innerSidebar} + 50px + 5px)`,
        view_layout: { 'grid-area': 'footer-left' },
      },
      // border-left: thin vertical accent bar
      {
        type: 'custom:lcards-button',
        preset: 'panel-light',
        min_width: 10,
        text: { label: { show: false } },
        view_layout: { 'grid-area': 'border-left' },
      },
      // header-left: top-bar and right-sidebar toggles
      {
        type: 'custom:layout-card',
        layout_type: 'custom:grid-layout',
        layout: {
          'grid-template-columns': '1fr', 'grid-gap': '5px',
          'grid-template-rows': '1fr', 'grid-auto-rows': '1fr',
          padding: 0, card_margin: 0, margin: 0,
        },
        cards: [
          { type: 'custom:lcards-button', preset: 'panel-dark', min_height: 10, entity: 'input_boolean.lcars_ui_top_bar', interactive: true },
          { type: 'custom:lcards-button', preset: 'panel-dark', min_height: 10, entity: 'input_boolean.lcars_ui_right_sidebar', interactive: true },
        ],
        view_layout: { 'grid-area': 'header-left' },
        card_mod: { style: _CARD_MOD_FULL_HEIGHT },
      },
      // sidebar-left: page selector
      {
        type: 'custom:layout-card',
        layout_type: 'custom:grid-layout',
        layout: {
          'grid-template-columns': '45px 1fr', 'grid-template-rows': '1fr',
          'grid-auto-rows': 'auto', 'grid-gap': '5px',
          padding: 0, card_margin: 0, margin: 0,
        },
        cards: [
          { type: 'custom:lcards-button', preset: 'panel-light', text: { label: { show: false } } },
          {
            type: 'custom:lcards-select-menu',
            entity: 'input_select.lcars_ui_page_selector',
            preset: 'outline',
            grid: { columns: 1, gap: '5px', 'grid-auto-rows': 'auto' },
            button_template: { min_height: '10', text: { label: { show: true, position: 'right-center' } } },
          },
          { type: 'custom:lcards-button', preset: 'panel-light', text: { label: { show: false } } },
          { type: 'custom:lcards-button', preset: 'panel-dark', tap_action: { action: 'toggle' } },
        ],
        view_layout: { 'grid-area': 'sidebar-left' },
        card_mod: { style: _CARD_MOD_FULL_HEIGHT },
      },
      // header: placeholder
      {
        type: 'custom:lcards-button',
        preset: 'panel-light',
        min_height: 10,
        text: { label: { show: true, content: '[ header — customize me ]' } },
        view_layout: { 'grid-area': 'header' },
      },
      // content-panel: placeholder — user replaces with a content panel card
      {
        type: 'custom:lcards-button',
        preset: 'outline',
        text: { label: { show: true, content: '[ content-panel — paste a content panel card here ]' } },
        view_layout: { 'grid-area': 'content-panel' },
      },
      // sidebar-right: placeholder, toggled by the right-sidebar boolean
      {
        type: 'custom:lcards-button',
        preset: 'panel-dark',
        text: { label: { show: true, content: '[ right sidebar ]' } },
        view_layout: { 'grid-area': 'sidebar-right' },
        width: 'clamp(100px, 16vw, 230px)',
        visibility: [{ condition: 'state', entity: 'input_boolean.lcars_ui_right_sidebar', state: 'on' }],
      },
      // header-border: top header bar — toggled by the top-bar boolean
      // Contains a conditional header-left elbow (visible on first page) + a banner/ticker area
      {
        type: 'custom:layout-card',
        layout_type: 'custom:grid-layout',
        layout: {
          'grid-template-columns': 'auto 1fr', 'grid-gap': '5px',
          'grid-template-rows': '1fr', 'grid-auto-rows': '1fr',
          padding: 0, card_margin: 0, margin: 0,
        },
        cards: [
          {
            type: 'custom:lcards-elbow',
            visibility: [{ condition: 'state', entity: 'input_select.lcars_ui_page_selector', state: pages[0] || 'HOME' }],
            elbow: {
              type: 'header-left',
              style: 'segmented',
              segments: {
                gap: 5,
                outer_segment: { bar_width: 45, bar_height: 45, outer_curve: 120, inner_curve: 75, color: { default: 'var(--lcars-ui-primary)' } },
                inner_segment: { bar_width: `calc(${innerSidebar})`, bar_height: 0.01, inner_curve: 75, color: { default: 'var(--lcars-ui-quaternary)' } },
              },
            },
            height: '10vh',
            width: `calc(45px + ${innerSidebar} + 5px + 40px)`,
          },
          {
            type: 'custom:layout-card',
            layout_type: 'custom:grid-layout',
            layout: {
              'grid-template-columns': '1fr', 'grid-gap': '5px',
              'grid-template-rows': '45px minmax(10px,50px)',
              padding: 0, card_margin: 0, margin: 0,
              height: '8vh',
            },
            cards: [
              { type: 'custom:lcards-button', preset: 'panel-light', min_height: 10 },
              {
                type: 'custom:lcards-button',
                preset: 'text-only',
                min_height: 10,
                interactive: false,
                text: { label: { show: true, content: '[ banner / ticker area ]' } },
                style: { border: { color: { default: 'transparent' }, width: 3 } },
              },
            ],
            card_mod: { style: _CARD_MOD_FULL_HEIGHT },
          },
        ],
        visibility: [{ condition: 'state', entity: 'input_boolean.lcars_ui_top_bar', state: 'on' }],
        view_layout: { 'grid-area': 'header-border' },
        card_mod: { style: _CARD_MOD_FULL_HEIGHT },
      },
      // footer: placeholder
      {
        type: 'custom:lcards-button',
        preset: 'panel-light',
        min_height: 10,
        view_layout: { 'grid-area': 'footer' },
      },
      // footer-border: bottom accent strip
      {
        type: 'custom:layout-card',
        layout_type: 'custom:grid-layout',
        layout: {
          'grid-template-columns': '1fr', 'grid-gap': '5px',
          'grid-template-rows': '1fr', 'grid-auto-rows': '1fr',
          padding: 0, card_margin: 0, margin: 0,
        },
        cards: [{ type: 'custom:lcards-button', preset: 'panel-light', min_height: 1 }],
        view_layout: { 'grid-area': 'footer-border' },
        card_mod: { style: _CARD_MOD_FULL_HEIGHT },
      },
    ],
  };

  const helpers = [
    'input_select:',
    '  lcars_ui_page_selector:',
    '    name: LCARS Page Selector',
    '    options:',
    ...pages.map(p => `      - ${p}`),
    '  lcars_ui_room_selector:',
    '    name: LCARS Room Selector',
    '    options:',
    '      - Living Room    # Replace with your actual HA area names',
    '      - Kitchen',
    '      - Bedroom',
    'input_boolean:',
    '  lcars_ui_top_bar:',
    '    name: LCARS Top Bar',
    '  lcars_ui_right_sidebar:',
    '    name: LCARS Right Sidebar',
  ].join('\n');

  return { view, helpers };
}

// ============================================================================
// CONTENT PANEL GENERATE FUNCTIONS
// ============================================================================

function _generatePanelRoomLights(inputs) {
  const cardType  = inputs.card_type || 'custom:lcards-slider';
  const preset    = inputs.preset    || 'pills-left-border';

  // Jinja2 template for auto-entities — discovers entities for the selected room.
  // Single-line to avoid YAML multi-line serialization issues; semantically identical.
  const jinja = `[{% for e in area_entities(states('input_select.lcars_ui_room_selector')) %}{% if e.startswith('light.') %}{'entity': '{{ e }}','type': '${cardType}','preset': '${preset}','view_layout': {'grid-column': '1'},'text': {'name': {'show': 'true'}}},{% endif %}{% endfor %}]`;

  const card = {
    type: 'custom:lcards-elbow',
    elbow: {
      type: 'frame',
      frame: {
        bar_width: 40,
        bar_height: 20,
        top:    { enabled: true, bar_height: 40 },
        bottom: { enabled: true, bar_height: 40 },
        right:  { enabled: false },
        left:   { enabled: false },
      },
    },
    symbiont: {
      enabled: true,
      overflow_y: 'auto',
      overflow_x: 'hidden',
      position: { top: 10, right: 10, bottom: 10, left: 10 },
      size:     { width: '95%', height: '95%' },
      anchor:   'center',
      card: {
        type: 'custom:layout-card',
        layout_type: 'custom:grid-layout',
        layout: {
          'grid-template-columns': 'minmax(60px, 200px) 20px 1fr',
          'grid-template-rows': 'auto 1fr auto',
          'grid-template-areas': '"header header header" "selector . list" "footer footer footer"',
          'grid-gap': '5px',
          padding: 0, card_margin: 0, margin: 0,
          height: '100%',
        },
        card_mod: {
          style: ':host { height: 100%; min-height: 0; } grid-layout { --layout-height: 100% !important; overflow: hidden !important; }',
        },
        cards: [
          // header elbow decoration
          {
            type: 'custom:lcards-elbow',
            min_height: '60px',
            view_layout: { 'grid-area': 'header' },
          },
          // room selector
          {
            type: 'custom:lcards-select-menu',
            entity: 'input_select.lcars_ui_room_selector',
            preset: 'lozenge',
            grid: { columns: 1, gap: '5px' },
            view_layout: { 'grid-area': 'selector' },
          },
          // auto-populated entity list
          {
            type: 'custom:auto-entities',
            filter: { template: jinja },
            card_param: 'cards',
            card: {
              type: 'custom:layout-card',
              layout_type: 'custom:grid-layout',
              layout: {
                'grid-template-columns': '1fr',
                'grid-template-rows': 'minmax(45px, 56px)',
                'grid-auto-rows': 'minmax(45px, 56px)',
                'grid-gap': '5px',
                padding: 0, card_margin: 0, margin: 0,
              },
            },
            view_layout: { 'grid-area': 'list' },
          },
          // footer elbow decoration
          {
            type: 'custom:lcards-elbow',
            elbow: { type: 'footer-left', segment: { bar_width: 90, bar_height: 20, outer_curve: 'auto' } },
            height: '60px',
            view_layout: { 'grid-area': 'footer' },
          },
        ],
      },
    },
    view_layout: { 'grid-area': 'content-panel' },
  };

  const helpers = [
    'input_select:',
    '  lcars_ui_room_selector:',
    '    name: LCARS Room Selector',
    '    options:',
    '      - Living Room    # Replace with your actual HA area names',
    '      - Kitchen',
    '      - Bedroom',
  ].join('\n');

  return { card, helpers };
}

// ============================================================================
// TEMPLATE REGISTRY
// ============================================================================

const TEMPLATES = [
  // ── Shells ────────────────────────────────────────────────────────────────
  {
    id:          'shell-tablet-9',
    section:     'shell',
    label:       'Adaptive Shell — 9"',
    icon:        'mdi:tablet',
    description: 'Full adaptive shell with page-selector sidebar, header, footer, and content-panel zone. Tuned for 9" tablets.',
    inputs: [
      { key: 'title',      label: 'Dashboard Title', hint: 'Used as the view title and URL path.', type: 'text', selector: { text: {} }, defaultValue: 'My Dashboard' },
      { key: 'page_names', label: 'Page Names',      hint: 'Comma-separated. Become the sidebar selector options.', type: 'text', selector: { text: {} }, defaultValue: 'HOME, LIGHTS, SECURITY' },
    ],
    generate: inputs => _generateShellAdaptive(inputs, '9inch'),
  },
  {
    id:          'shell-tablet-11',
    section:     'shell',
    label:       'Adaptive Shell — 11"',
    icon:        'mdi:tablet-dashboard',
    description: 'Full adaptive shell with page-selector sidebar, header, footer, and content-panel zone. Tuned for 11" tablets.',
    inputs: [
      { key: 'title',      label: 'Dashboard Title', hint: 'Used as the view title and URL path.', type: 'text', selector: { text: {} }, defaultValue: 'My Dashboard' },
      { key: 'page_names', label: 'Page Names',      hint: 'Comma-separated. Become the sidebar selector options.', type: 'text', selector: { text: {} }, defaultValue: 'HOME, LIGHTS, SECURITY' },
    ],
    generate: inputs => _generateShellAdaptive(inputs, '11inch'),
  },

  // ── Content Panels ────────────────────────────────────────────────────────
  {
    id:          'panel-room-lights',
    section:     'panel',
    label:       'Room Lights',
    icon:        'mdi:lightbulb-group-outline',
    description: 'Room selector with auto-populated light controls per area. Drop into a shell\'s content-panel zone. Requires auto-entities (HACS).',
    inputs: [
      {
        key:          'card_type',
        label:        'Entity Card',
        hint:         'Card type rendered for each light entity.',
        type:         'select',
        selector:     { select: { options: [
          { value: 'custom:lcards-slider', label: 'Slider — brightness control' },
          { value: 'custom:lcards-button', label: 'Button — on/off toggle' },
        ], mode: 'dropdown' } },
        defaultValue: 'custom:lcards-slider',
      },
      {
        key:          'preset',
        label:        'Card Preset',
        hint:         'Visual preset applied to each entity card.',
        type:         'text',
        selector:     { text: {} },
        defaultValue: 'pills-left-border',
      },
    ],
    generate: inputs => _generatePanelRoomLights(inputs),
  },
];

const _SHELLS = TEMPLATES.filter(t => t.section === 'shell');
const _PANELS = TEMPLATES.filter(t => t.section === 'panel');

// ============================================================================
// COMPONENT
// ============================================================================

export class LCARdSLayoutsTab extends LitElement {

  static properties = {
    hass:           { type: Object },
    _selectedId:    { type: String,  state: true },
    _params:        { type: Object,  state: true },
    _generatedYaml: { type: String,  state: true },
    _generating:    { type: Boolean, state: true },
    _copyFeedback:  { type: Boolean, state: true },
  };

  constructor() {
    super();
    /** @type {any} */
    this.hass = undefined;
    this._selectedId    = TEMPLATES[0].id;
    this._params        = {};
    this._generating    = false;
    this._copyFeedback  = false;
    this._generatedYaml = '';
    this._initParams(TEMPLATES[0]);
  }

  _initParams(template) {
    const defaults = {};
    for (const p of (template.inputs ?? [])) defaults[p.key] = p.defaultValue;
    this._params = defaults;
  }

  _getTemplate(id) {
    return TEMPLATES.find(t => t.id === id) ?? TEMPLATES[0];
  }

  _selectTemplate(id) {
    this._selectedId    = id;
    this._generatedYaml = '';
    this._initParams(this._getTemplate(id));
  }

  _handleParamChange(key, e) {
    e.stopPropagation();
    this._params        = { ...this._params, [key]: e.detail.value };
    this._generatedYaml = '';
  }

  async _handleGenerate() {
    const template = this._getTemplate(this._selectedId);
    this._generating    = true;
    this._generatedYaml = '';
    this.requestUpdate();

    try {
      const result = template.generate(this._params);
      const date   = new Date().toLocaleDateString();
      const header = `# LCARdS Layout Library — ${date}\n# Requires: layout-card (HACS — custom:grid-layout)\n#\n`;

      if (result.view) {
        this._generatedYaml =
          header +
          `# ── PART 1: Dashboard View ──────────────────────────────────────────\n` +
          `# Paste under 'views:' in your dashboard raw editor.\n\n` +
          _toYaml(result.view, 0) +
          (result.helpers
            ? `\n\n# ── PART 2: HA Helpers ──────────────────────────────────────────────\n` +
              `# Add to configuration.yaml, then restart Home Assistant.\n\n` +
              result.helpers
            : '');
      } else if (result.card) {
        this._generatedYaml =
          header +
          `# Requires also: auto-entities (HACS)\n` +
          `#\n` +
          `# ── Content Panel Card ──────────────────────────────────────────────\n` +
          `# Replace the content-panel placeholder in your shell with this card.\n\n` +
          _toYaml(result.card, 0) +
          (result.helpers
            ? `\n\n# ── Required HA Helpers ─────────────────────────────────────────────\n` +
              `# Add to configuration.yaml, then restart Home Assistant.\n\n` +
              result.helpers
            : '');
      }

      lcardsLog.debug('[LCARdSLayoutsTab] YAML generated', { bytes: this._generatedYaml.length });
    } catch (err) {
      lcardsLog.error('[LCARdSLayoutsTab] generate() failed', err);
      this._generatedYaml = `# Error generating layout:\n# ${err.message}`;
    } finally {
      this._generating = false;
    }
  }

  async _handleCopy() {
    if (!this._generatedYaml) return;
    try {
      await navigator.clipboard.writeText(this._generatedYaml);
      this._copyFeedback = true;
      this.requestUpdate();
      setTimeout(() => { this._copyFeedback = false; this.requestUpdate(); }, 2000);
    } catch (err) {
      lcardsLog.warn('[LCARdSLayoutsTab] Clipboard write failed', err);
    }
  }

  _renderTemplateCard(t) {
    const selected = t.id === this._selectedId;
    return html`
      <div
        class="template-card ${selected ? 'selected' : ''}"
        role="button"
        tabindex="0"
        @click=${() => this._selectTemplate(t.id)}
        @keydown=${e => e.key === 'Enter' && this._selectTemplate(t.id)}
      >
        <div class="template-icon"><ha-icon icon="${t.icon}"></ha-icon></div>
        <div class="template-body">
          <span class="template-name">${t.label}</span>
          <span class="template-desc">${t.description}</span>
        </div>
        ${selected ? html`<ha-icon icon="mdi:check-circle" class="template-check"></ha-icon>` : ''}
      </div>
    `;
  }

  render() {
    const template  = this._getTemplate(this._selectedId);
    const isShell   = template.section === 'shell';
    const yamlHint  = isShell
      ? html`Paste <strong>Part 1</strong> under <code>views:</code> in your dashboard raw editor. Add <strong>Part 2</strong> to <code>configuration.yaml</code>.`
      : html`Replace the <code>content-panel</code> placeholder in your shell with this card.`;

    return html`
      <div class="studio-layout"><div class="scrollable-body">

        <!-- ── Prerequisite banner ── -->
        <div class="banner warning">
          <ha-icon icon="mdi:information-outline"></ha-icon>
          <span>
            Layouts require <strong>layout-card</strong> from HACS (<code>custom:grid-layout</code>).
            Content panels also require <strong>auto-entities</strong> (HACS).
          </span>
        </div>

        <!-- ── Template picker ── -->
        <lcards-form-section
          header="Choose a Template"
          icon="mdi:view-grid-plus-outline"
          description="Select a shell (outer dashboard structure) or a content panel (card that slots into a shell's content-panel zone), fill in the inputs, then copy the generated YAML."
          ?expanded=${true}
          ?outlined=${true}>

          <div class="section-label">
            <ha-icon icon="mdi:monitor-dashboard"></ha-icon>
            <span>Shells</span>
          </div>
          <div class="template-grid">
            ${_SHELLS.map(t => this._renderTemplateCard(t))}
          </div>

          <div class="section-label" style="margin-top: 12px;">
            <ha-icon icon="mdi:view-module-outline"></ha-icon>
            <span>Content Panels</span>
          </div>
          <div class="template-grid">
            ${_PANELS.map(t => this._renderTemplateCard(t))}
          </div>
        </lcards-form-section>

        <!-- ── Parameters ── -->
        <lcards-form-section
          header="Inputs"
          icon="mdi:tune-variant"
          ?expanded=${true}
          ?outlined=${true}>

          ${(template.inputs ?? []).map(p => html`
            <div class="control-row">
              <div class="control-label">
                ${p.label}
                <span class="hint">${p.hint}</span>
              </div>
              <ha-selector
                .hass=${this.hass}
                .selector=${p.selector}
                .value=${this._params[p.key]}
                @value-changed=${e => this._handleParamChange(p.key, e)}
              ></ha-selector>
            </div>
          `)}

          <div class="generate-row">
            <ha-button unelevated ?disabled=${this._generating} @click=${this._handleGenerate}>
              <ha-icon slot="icon" icon="mdi:code-tags"></ha-icon>
              ${this._generating ? 'Generating…' : 'Generate YAML'}
            </ha-button>
          </div>
        </lcards-form-section>

        <!-- ── Output ── -->
        ${this._generatedYaml ? html`
          <lcards-form-section
            header="Generated YAML"
            icon="mdi:code-tags"
            ?expanded=${true}
            ?outlined=${true}>

            <div class="yaml-actions">
              <span class="yaml-hint">${yamlHint}</span>
              <ha-button @click=${this._handleCopy}>
                <ha-icon slot="icon" icon=${this._copyFeedback ? 'mdi:check' : 'mdi:content-copy'}></ha-icon>
                ${this._copyFeedback ? 'Copied!' : 'Copy'}
              </ha-button>
            </div>
            <pre class="yaml-block"><code>${this._generatedYaml}</code></pre>
          </lcards-form-section>
        ` : ''}

      </div></div>
    `;
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow: hidden;
      }

      .studio-layout {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: var(--primary-background-color);
        min-height: 0;
        border-radius: var(--ha-card-border-radius, 12px);
        padding: 16px;
      }

      .scrollable-body {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding-bottom: 8px;
        --lcards-section-spacing: 0;
      }

      /* Prerequisite banner */
      .banner {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-radius: var(--ha-border-radius-md);
        font-size: 0.9em;
      }
      .banner.warning {
        background: color-mix(in srgb, var(--warning-color, #ff9800) 15%, transparent);
        border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--warning-color, #ff9800) 40%, transparent);
        color: var(--primary-text-color);
      }
      .banner ha-icon { flex-shrink: 0; color: var(--warning-color, #ff9800); }
      .banner code, .banner strong {
        font-family: monospace;
        background: color-mix(in srgb, var(--primary-text-color) 10%, transparent);
        padding: 1px 5px;
        border-radius: 3px;
      }
      .banner strong { font-family: inherit; }

      /* Section labels */
      .section-label {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 2px 6px;
        font-size: 0.72em;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--secondary-text-color);
        border-bottom: var(--ha-border-width-sm) solid color-mix(in srgb, var(--divider-color) 40%, transparent);
        margin-bottom: 6px;
      }
      .section-label ha-icon { --mdc-icon-size: 13px; }

      /* Template picker cards */
      .template-grid {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding-bottom: 4px;
      }

      .template-card {
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
      .template-card:hover {
        background: color-mix(in srgb, var(--primary-color) 15%, var(--secondary-background-color));
        border-color: var(--primary-color);
      }
      .template-card.selected {
        background: color-mix(in srgb, var(--primary-color) 22%, var(--secondary-background-color));
        border-color: var(--primary-color);
      }
      .template-card:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }

      .template-icon { flex-shrink: 0; --mdc-icon-size: 22px; color: var(--primary-color); }
      .template-body { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
      .template-name { font-weight: 600; font-size: 0.95em; }
      .template-desc { color: var(--secondary-text-color); font-size: 0.85em; line-height: 1.4; }
      .template-check { flex-shrink: 0; --mdc-icon-size: 18px; color: var(--primary-color); }

      /* Parameter control rows */
      .control-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 8px 0;
        border-bottom: var(--ha-border-width-sm) solid color-mix(in srgb, var(--divider-color) 50%, transparent);
      }
      .control-row:last-child { border-bottom: none; }

      .control-label {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-width: 0;
        gap: 2px;
        font-size: 0.9em;
      }
      .hint { font-size: 0.8em; color: var(--secondary-text-color); line-height: 1.4; }

      ha-selector { min-width: 200px; }

      .generate-row { display: flex; justify-content: flex-end; padding-top: 12px; }

      /* YAML output */
      .yaml-actions {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 4px 0 10px;
        border-bottom: var(--ha-border-width-sm) solid color-mix(in srgb, var(--divider-color) 50%, transparent);
        margin-bottom: 10px;
      }
      .yaml-hint { flex: 1; font-size: 0.85em; color: var(--secondary-text-color); }
      .yaml-hint code {
        font-family: monospace;
        background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
        padding: 1px 4px;
        border-radius: 3px;
      }

      .yaml-block {
        background: var(--primary-background-color);
        color: var(--primary-text-color);
        border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--divider-color) 60%, transparent);
        border-radius: 6px;
        padding: 14px 16px;
        font-family: 'Fira Code', 'Consolas', 'Menlo', monospace;
        font-size: 0.78em;
        line-height: 1.7;
        overflow-x: auto;
        white-space: pre;
        margin: 0;
        max-height: 50vh;
        overflow-y: auto;
      }
    `;
  }
}

if (!customElements.get('lcards-layouts-tab')) {
  customElements.define('lcards-layouts-tab', LCARdSLayoutsTab);
}
