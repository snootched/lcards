/**
 * @fileoverview LCARdS Panel Dashboard/View Strategy
 *
 * Generates LCARS-authentic panel layouts using custom:grid-layout (layout-card).
 * Supports both scaffold (empty slot) and auto-populate (hass.areas/entities) modes.
 *
 * Usage as a view strategy:
 * ```yaml
 * views:
 *   - title: LCARS Panel
 *     strategy:
 *       type: custom:lcards-panel
 *       config:
 *         mode: scaffold          # 'scaffold' (default) | 'auto'
 *         columns: 2              # content columns (default: 2)
 *         header_height: 10vh     # override header row height
 *         sidebar_width: 15vw     # override sidebar column width
 *         endcap_width: 6vw       # override end-cap column width
 *         gap: 0.4vw              # grid gap
 * ```
 *
 * Usage as a dashboard strategy:
 * ```yaml
 * strategy:
 *   type: custom:lcards-panel
 *   config:
 *     mode: auto
 * ```
 *
 * Requires: custom-layout-card (HACS)
 * https://github.com/thomasloven/lovelace-layout-card
 *
 * @element N/A — registered as customViewStrategies / customDashboardStrategies
 */

import { lcardsLog } from '../utils/lcards-logging.js';

// ============================================================================
// LCARS CANONICAL DEFAULTS  (all dynamic units — no px)
// ============================================================================

const DEFAULTS = {
  mode:           'scaffold',   // 'scaffold' | 'auto'
  columns:        2,            // number of content columns
  header_height:  '10vh',       // top elbow / header bar row
  sidebar_width:  '15vw',       // left sidebar column
  endcap_width:   '6vw',        // right end-cap column
  gap:            '0.4vw',      // grid-gap between cells
};

// Entity domains to surface in auto mode (priority-ordered)
const AUTO_DOMAINS = ['light', 'climate', 'switch', 'cover', 'media_player', 'sensor', 'binary_sensor'];

// Maximum number of cards per area section in auto mode
const AUTO_MAX_PER_AREA = 6;

// ============================================================================
// HELPER — build grid-layout layout block
// ============================================================================

function _buildGridLayout(cfg) {
  const columns = cfg.columns ?? DEFAULTS.columns;

  // Content columns: repeat(N, 1fr) — fills available space equally
  const contentCols = `repeat(${columns}, 1fr)`;

  return {
    'grid-template-columns': `${cfg.sidebar_width ?? DEFAULTS.sidebar_width} ${contentCols} ${cfg.endcap_width ?? DEFAULTS.endcap_width}`,
    'grid-template-rows':    `${cfg.header_height ?? DEFAULTS.header_height} 1fr`,
    'grid-gap':               cfg.gap ?? DEFAULTS.gap,
    'padding':                '0',
  };
}

// ============================================================================
// HELPER — scaffold card definitions
// ============================================================================

function _buildScaffoldCards(cfg, columns) {
  const totalCols = columns + 2; // sidebar + content + endcap

  // Sidebar = col 1, content = col 2…(columns+1), endcap = col (columns+2)
  const contentColStart = 2;
  const contentColEnd   = columns + 2; // span end (exclusive)

  return [
    // ── Row 1: Elbow corner ─────────────────────────────────────────────────
    {
      type: 'custom:lcards-elbow',
      elbow: {
        type: 'header-left',
      },
      view_layout: {
        'grid-column': '1',
        'grid-row':    '1',
      },
    },
    // ── Row 1: Header bar ───────────────────────────────────────────────────
    {
      type:   'custom:lcards-button',
      preset: 'lozenge',
      label:  'LCARS PANEL',
      view_layout: {
        'grid-column': `${contentColStart} / ${contentColEnd}`,
        'grid-row':    '1',
      },
    },
    // ── Row 1+2: End cap ────────────────────────────────────────────────────
    {
      type:   'custom:lcards-button',
      preset: 'lozenge',
      view_layout: {
        'grid-column': `${totalCols}`,
        'grid-row':    '1 / 3',
      },
    },
    // ── Row 2: Sidebar ──────────────────────────────────────────────────────
    {
      type:   'custom:lcards-button',
      preset: 'lozenge',
      view_layout: {
        'grid-column': '1',
        'grid-row':    '2',
      },
    },
    // ── Row 2: Content slots ─────────────────────────────────────────────────
    ...Array.from({ length: columns }, (_, i) => ({
      type:   'custom:lcards-button',
      preset: 'lozenge',
      label:  `Slot ${i + 1}`,
      view_layout: {
        'grid-column': `${contentColStart + i}`,
        'grid-row':    '2',
      },
    })),
  ];
}

// ============================================================================
// HELPER — auto-populate cards from hass data
// ============================================================================

function _buildAutoCards(cfg, columns, hass) {
  const totalCols = columns + 2;
  const contentColStart = 2;
  const contentColEnd   = columns + 2;

  // Chrome cards (elbow, header, endcap, sidebar) — same as scaffold
  const chrome = _buildScaffoldCards(cfg, columns).filter((_, i) => i < 4);

  // ── Gather area data ──────────────────────────────────────────────────────
  const areas   = Object.values(hass.areas ?? {});
  const allEntities = Object.values(hass.entities ?? {});
  const states  = hass.states ?? {};

  if (!areas.length) {
    lcardsLog.warn('[LCARdSPanelStrategy] No areas found in hass — falling back to scaffold content area');
    // Fall back to scaffold content slots
    return [
      ...chrome,
      ..._buildScaffoldCards(cfg, columns).slice(4),
    ];
  }

  // For each area, build a mini-section of entity cards
  const areaSections = areas.map(area => {
    const areaEntities = allEntities
      .filter(e => e.area_id === area.area_id && states[e.entity_id])
      .sort((a, b) => {
        // Sort by domain priority
        const aPriority = AUTO_DOMAINS.indexOf(a.entity_id.split('.')[0]);
        const bPriority = AUTO_DOMAINS.indexOf(b.entity_id.split('.')[0]);
        const aP = aPriority === -1 ? 99 : aPriority;
        const bP = bPriority === -1 ? 99 : bPriority;
        return aP - bP;
      })
      .slice(0, AUTO_MAX_PER_AREA);

    if (!areaEntities.length) return null;

    return {
      type: 'vertical-stack',
      cards: [
        // Area label
        {
          type:   'custom:lcards-button',
          preset: 'lozenge',
          label:  (area.name || area.area_id).toUpperCase(),
        },
        // Entity cards
        ...areaEntities.map(entity => ({
          type:       'custom:lcards-button',
          entity:     entity.entity_id,
          preset:     'lozenge',
          tap_action: { action: 'toggle' },
        })),
      ],
    };
  }).filter(Boolean);

  if (!areaSections.length) {
    lcardsLog.warn('[LCARdSPanelStrategy] No area entities found — falling back to scaffold content area');
    return [...chrome, ..._buildScaffoldCards(cfg, columns).slice(4)];
  }

  // Distribute area sections across content columns using a nested grid-layout
  const contentCard = {
    type: 'custom:grid-layout',
    layout: {
      'grid-template-columns': `repeat(${columns}, 1fr)`,
      'grid-gap': cfg.gap ?? DEFAULTS.gap,
    },
    cards: areaSections.map((section, i) => ({
      ...section,
      view_layout: {
        'grid-column': `${(i % columns) + 1}`,
      },
    })),
    view_layout: {
      'grid-column': `${contentColStart} / ${contentColEnd}`,
      'grid-row': '2',
    },
  };

  return [...chrome, contentCard];
}

// ============================================================================
// SHARED GENERATE HELPER
// ============================================================================

async function _generateViewCards(config, hass) {
  // User params live under config.config (the strategy config block)
  const cfg = config?.config ?? {};

  const mode    = cfg.mode    ?? DEFAULTS.mode;
  const columns = parseInt(cfg.columns ?? DEFAULTS.columns, 10);

  lcardsLog.debug(`[LCARdSPanelStrategy] generate() mode=${mode} columns=${columns}`);

  const layout = _buildGridLayout(cfg);

  let contentCards;
  if (mode === 'auto' && hass) {
    contentCards = _buildAutoCards(cfg, columns, hass);
  } else {
    if (mode === 'auto' && !hass) {
      lcardsLog.warn('[LCARdSPanelStrategy] auto mode requested but hass not available — using scaffold');
    }
    contentCards = _buildScaffoldCards(cfg, columns);
  }

  return {
    layout,
    cards: contentCards,
  };
}

// ============================================================================
// VIEW STRATEGY  — ll-strategy-view-lcards-panel
// Returns { type, layout, cards } at the view level for a single HA view.
// ============================================================================

export class LCARdSPanelViewStrategy extends HTMLElement {

  /**
   * @param {object} config - Strategy config block ({ config: { mode, columns, ... } })
   * @param {object} hass   - The Home Assistant object
   * @returns {Promise<{ cards: Array }>}
   */
  static async generate(config, hass) {
    const { layout, cards } = await _generateViewCards(config, hass);

    // Return the grid layout at the view level — layout-card's custom:grid-layout
    // view type applies the grid tracks to the view container itself, with cards
    // placed directly as children (not wrapped in another card).
    /** @type {any} */
    const viewResult = {
      type:   'custom:grid-layout',
      layout,
      cards,
    };
    return viewResult;
  }
}

// ============================================================================
// DASHBOARD STRATEGY  — ll-strategy-dashboard-lcards-panel
// Returns { views } for a full HA dashboard.
// Delegates the single view to the view strategy to keep rendering lazy.
// ============================================================================

export class LCARdSPanelDashboardStrategy extends HTMLElement {

  /**
   * @param {object} config - Full dashboard config + strategy config
   * @param {object} hass   - The Home Assistant object
   * @returns {Promise<{ views: Array }>}
   */
  static async generate(config, hass) {
    // Pass the strategy config block through to the view strategy
    const strategyConfig = config?.config ?? {};

    return {
      views: [
        {
          title:    strategyConfig.title ?? 'LCARS Panel',
          strategy: {
            type:   'custom:lcards-panel',
            config: strategyConfig,
          },
        },
      ],
    };
  }
}
