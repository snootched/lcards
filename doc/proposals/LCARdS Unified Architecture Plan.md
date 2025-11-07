# LCARdS Unified Architecture Plan
**Master Systems Display (MSD) Infrastructure Evolution**

**Document Version:** 2.0
**Date:** 2025-01-07
**Status:** Ready for Implementation
**Author:** LCARdS Development Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Architecture Vision](#architecture-vision)
4. [Core Infrastructure Design](#core-infrastructure-design)
5. [Implementation Phases](#implementation-phases)
6. [API Reference](#api-reference)
7. [Testing Strategy](#testing-strategy)
8. [Success Criteria](#success-criteria)

---

## Executive Summary

### Purpose

This document outlines the architectural evolution of LCARdS from a single-instance MSD card to a unified, modular system where core infrastructure is shared globally and overlays can function both as standalone cards and within MSD environments.

### Core Problems Being Solved

1. **MSD Infrastructure Locked Inside MSD Card** - Valuable systems (rules engine, data sources, animation system) only available within MSD
2. **Single-Instance Limitation** - Cannot have multiple MSD cards or multiple overlay cards on same dashboard
3. **No Standalone Overlays** - Overlays (buttons, text, gauges) only work inside MSD, can't be used independently
4. **No Inter-Card Communication** - Cards cannot coordinate or share state
5. **Order-Dependent Initialization** - Data sources and rules must be declared before use

### Solution Overview

**Extract MSD infrastructure into shared global systems** that all LCARdS cards leverage:

- **Global Core (Singleton):** SystemsManager, DataSourceManager, RulesManager, StyleLibrary
- **Scoped Rules System:** Global rules (cross-card coordination) + Local rules (per-card overrides)
- **Pack System:** Ship core rule packs with LCARdS, users can extend
- **Standalone Overlays:** Button, text, and other overlays as independent cards
- **Multi-Instance Support:** Multiple MSD cards and/or overlay cards per dashboard
- **Order-Independent Initialization:** Declarative configuration with retry logic

### Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **Lazy Core Initialization** | Lightweight systems (~9KB) load on module import; heavy systems (~150KB) lazy-load on first card |
| **Declarative Configuration** | Cards declare needs (data sources, rules); core provides when available |
| **Scoped Rules (Global + Local)** | Global rules for cross-card coordination; local rules for card-specific overrides |
| **Pack System** | Ship core rules with LCARdS; users extend via YAML packs |
| **Consistent Overlay Configs** | Same config works standalone or within MSD (position only required in MSD) |
| **Firewall-Style Rule Evaluation** | Priority-based, first-match-wins, local before global |

---

## Current State Analysis

### Existing Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CURRENT ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Legacy Cards (Frozen - Will Be Removed)                  │  │
│  │  ├─ Based on button-card templates (deprecated)          │  │
│  │  ├─ Complex YAML with embedded JavaScript                │  │
│  │  ├─ External dependency: custom-button-card              │  │
│  │  └─ Will be removed once new overlays are working        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  MSD Card (LIT-Based - Completed)                         │  │
│  │  ├─ Modular pipeline system                              │  │
│  │  ├─ Overlay system (lines, text, sparklines, etc.)       │  │
│  │  ├─ Controls layer (embedded HA cards)                   │  │
│  │  ├─ SystemsManager (entity tracking)                     │  │
│  │  ├─ DataSourceManager (REST, polling)                    │  │
│  │  ├─ Rules engine (state evaluation)                      │  │
│  │  ├─ Composition engine (SVG layout)                      │  │
│  │  │                                                         │  │
│  │  ⚠️  ISSUES:                                              │  │
│  │  • Infrastructure locked inside MSD card                 │  │
│  │  • Single-instance limitation (instance manager)         │  │
│  │  • Overlays cannot be used standalone                    │  │
│  │  • No inter-card communication                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### MSD Strengths to Leverage

The completed MSD implementation has proven several architectural patterns that should be extracted:

1. **Pipeline Pattern:** Clean separation of concerns (data → processing → rendering)
2. **Modular Overlays:** Reusable rendering components (lines, text, sparklines, buttons)
3. **SystemsManager:** Centralized entity state tracking with subscriptions
4. **DataSourceManager:** Unified data fetching (REST, polling)
5. **Rules Engine:** Declarative state evaluation with priority-based matching
6. **Controls Layer:** Embedded HA cards with proper HASS forwarding
7. **Animation System:** anime.js v4 scopes and timelines
8. **API Structure:** Tiered API system (documented in src/api)

---

## Architecture Vision

### Target Architecture

```
┌───────────────────────────────────────────────────────────────────────────┐
│                      Home Assistant Lovelace                               │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Button     │  │    Text      │  │   MSD #1     │  │   MSD #2     │ │
│  │   Card       │  │    Card      │  │   Card       │  │   Card       │ │
│  │ (Standalone) │  │ (Standalone) │  │              │  │              │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                  │                  │                  │         │
│         └──────────────────┴──────────────────┴──────────────────┘         │
│                                    │                                        │
│                         ┌──────────▼──────────┐                           │
│                         │   LCARdSCore        │  ← SINGLETON              │
│                         │  (window.lcards     │                           │
│                         │        .core)       │                           │
│                         └──────────┬──────────┘                           │
│                                    │                                        │
│         ┌──────────────────────────┼──────────────────────────┐           │
│         │                          │                           │           │
│  ┌──────▼──────┐          ┌────────▼────────┐        ┌───────▼──────┐   │
│  │  Systems    │          │  Data Source    │        │    Rules     │   │
│  │  Manager    │          │    Manager      │        │   Manager    │   │
│  │             │          │                 │        │              │   │
│  │ SHARED      │          │    SHARED       │        │   SHARED     │   │
│  │ • Entity    │          │ • REST polls    │        │ • Global     │   │
│  │   tracking  │          │ • WebSockets    │        │   rules      │   │
│  │ • State     │          │ • Caching       │        │ • Local      │   │
│  │   updates   │          │ • Retry logic   │        │   rules      │   │
│  │             │          │                 │        │ • Priority   │   │
│  └─────────────┘          └─────────────────┘        │   eval       │   │
│                                                        └──────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                    SHARED COMPONENT LIBRARY                           │ │
│  │                                                                        │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │ │
│  │  │    Overlays     │  │    Controls     │  │  Style Library  │     │ │
│  │  │                 │  │                 │  │                 │     │ │
│  │  │ • LineOverlay   │  │ • SliderControl │  │ • Presets       │     │ │
│  │  │ • TextOverlay   │  │ • ButtonControl │  │ • Themes        │     │ │
│  │  │ • ButtonOverlay │  │ • HACardControl │  │ • Packs         │     │ │
│  │  │ • SparklineOL   │  │ • TapControl    │  │                 │     │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘     │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                 LIGHTWEIGHT INFRASTRUCTURE (Always Active)            │ │
│  │                                                                        │ │
│  │  ┌────────────┐  ┌──────────────┐  ┌────────────┐  ┌─────────────┐ │ │
│  │  │  Event Bus │  │ Animation API│  │ SVG Helpers│  │  Debug API  │ │ │
│  │  │            │  │              │  │            │  │             │ │ │
│  │  │ • Pub/Sub  │  │ • anime.js v4│  │ • Anchors  │  │ • Inspect   │ │ │
│  │  │ • History  │  │ • Scopes     │  │ • ViewBox  │  │ • Log       │ │ │
│  │  │ • Wildcard │  │ • Timelines  │  │ • Compose  │  │ • Monitor   │ │ │
│  │  └────────────┘  └──────────────┘  └────────────┘  └─────────────┘ │ │
│  │                                                                        │ │
│  │  Initialized: Module load (~9KB overhead)                             │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                      LCARdSBaseCard                                   │ │
│  │           (Extends LitElement - Native Foundation)                    │ │
│  │                                                                        │ │
│  │  • Manages pipeline connection                                        │ │
│  │  • Handles HASS updates                                               │ │
│  │  • Coordinates overlays/controls                                      │ │
│  │  • Provides mountEl context                                           │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────┘
```

### Layered Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                            │
│  (Card Implementations: Button, Text, MSD, etc.)                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    COMPONENT LAYER                               │
│  (Reusable Overlays & Controls)                                 │
│                                                                   │
│  ┌───────────────────────┐      ┌────────────────────────┐     │
│  │  Overlay Components   │      │  Control Components    │     │
│  │  ├─ LineOverlay       │      │  ├─ SliderControl      │     │
│  │  ├─ TextOverlay       │      │  ├─ ButtonControl      │     │
│  │  ├─ ButtonOverlay     │      │  ├─ TapControl         │     │
│  │  ├─ SparklineOverlay  │      │  ├─ HACardControl      │     │
│  │  ├─ GaugeOverlay      │      │  └─ CustomControl      │     │
│  │  └─ CustomOverlay     │      │                         │     │
│  └───────────────────────┘      └────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CORE LAYER                                    │
│  (Shared Infrastructure - LCARdSCore Singleton)                 │
│                                                                   │
│  ┌────────────────────┐  ┌────────────────────┐                │
│  │  SystemsManager    │  │ DataSourceManager  │                │
│  │  • Entity tracking │  │ • REST polling     │                │
│  │  • State cache     │  │ • WebSocket (fut)  │                │
│  │  • Subscriptions   │  │ • Data cache       │                │
│  └────────────────────┘  └────────────────────┘                │
│                                                                   │
│  ┌────────────────────┐  ┌────────────────────┐                │
│  │  RulesManager      │  │  StyleLibrary      │                │
│  │  • Global rules    │  │  • Style presets   │                │
│  │  • Local rules     │  │  • Theme colors    │                │
│  │  • Priority eval   │  │  • Pack system     │                │
│  │  • Targeting       │  │                    │                │
│  └────────────────────┘  └────────────────────┘                │
│                                                                   │
│  ┌────────────────────┐  ┌────────────────────┐                │
│  │ AnimationPresets   │  │ ComponentRegistry  │                │
│  │  • Preset library  │  │ • Component types  │                │
│  │  • Pack system     │  │ • Factory methods  │                │
│  └────────────────────┘  └────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    UTILITY LAYER                                 │
│  (Always Available - Module-Level Init)                         │
│                                                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐         │
│  │  Event Bus  │  │ Animation API│  │  SVG Helpers  │         │
│  │  • Pub/Sub  │  │ • anime.js v4│  │  • Anchors    │         │
│  │  • History  │  │ • Scopes     │  │  • ViewBox    │         │
│  │  • Wildcard │  │ • Timelines  │  │  • Transforms │         │
│  └─────────────┘  └──────────────┘  └───────────────┘         │
│                                                                   │
│  ┌─────────────┐  ┌──────────────┐                             │
│  │ Font Loader │  │  Debug API   │                             │
│  │  • LCARS    │  │  • Logging   │                             │
│  │  • Antonio  │  │  • Inspection│                             │
│  └─────────────┘  └──────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Infrastructure Design

### 1. LCARdSCore (Singleton)

**Purpose:** Central coordinator for all LCARdS infrastructure

**File:** `src/core/lcards-core.js`

**Responsibilities:**
- Initialize and manage shared systems
- Register/unregister cards and overlays
- Coordinate data source declarations
- Coordinate rule declarations
- Provide pipelines to cards
- Handle retry logic for missing dependencies

**API Surface:**

```javascript
/**
 * LCARdSCore - Central Infrastructure Coordinator
 *
 * Singleton managing all shared systems for LCARdS cards.
 * Initializes lazily on first card load.
 *
 * @class LCARdSCore
 */
class LCARdSCore {
    constructor() {
        // ===== SHARED SYSTEMS (Lazy-initialized) =====
        this.systemsManager = null;      // Entity state tracking
        this.dataSourceManager = null;   // Data fetching/polling
        this.rulesManager = null;        // Rule evaluation (global + local)
        this.styleLibrary = null;        // Style presets
        this.animationPresets = null;    // Animation definitions
        this.componentRegistry = null;   // Overlay/control types

        // ===== REGISTRIES =====
        this._cardInstances = new Map();     // Map<cardId, CardContext>
        this._overlayInstances = new Map();  // Map<overlayId, OverlayContext>
        this._cardLoadOrder = [];            // Array<cardId> for debugging

        // ===== INITIALIZATION STATE =====
        this._coreInitialized = false;
        this._coreInitPromise = null;
        this._pendingCards = [];  // Cards waiting for core initialization
    }

    /**
     * Initialize core systems
     * Safe to call multiple times - only initializes once
     *
     * @param {Object} hass - Home Assistant instance
     * @returns {Promise<void>}
     */
    async initialize(hass) { /* ... */ }

    /**
     * Register a card instance
     * Can be called before core is initialized (card will queue)
     *
     * @param {string} cardId - Unique card identifier
     * @param {Object} card - Card instance
     * @param {Object} config - Card configuration
     * @returns {Promise<Object>} Card context
     */
    async registerCard(cardId, card, config) { /* ... */ }

    /**
     * Register an overlay instance
     * Overlays can be in MSD or standalone cards
     *
     * @param {string} overlayId - Unique overlay identifier
     * @param {Object} overlay - Overlay instance
     * @param {string} cardId - Parent card ID
     * @param {Object} config - Overlay configuration
     * @returns {Object} Overlay context
     */
    registerOverlay(overlayId, overlay, cardId, config) { /* ... */ }

    /**
     * Declare a data source
     * Multiple cards can declare same data source (configs merge)
     *
     * @param {string} cardId - Card declaring the data source
     * @param {Object} dataSourceConfig - Data source configuration
     */
    declareDataSource(cardId, dataSourceConfig) { /* ... */ }

    /**
     * Declare a rule
     * Rules can be global (affect all cards) or local (single card)
     *
     * @param {Object} rule - Rule configuration
     * @param {string} cardId - Card declaring the rule
     * @param {string} scope - 'global' or 'local'
     */
    declareRule(rule, cardId, scope = 'global') { /* ... */ }

    /**
     * Create pipeline for a card
     * Returns lightweight pipeline for overlay cards
     * Returns full MSD pipeline for MSD cards
     *
     * @param {Object} card - Card instance
     * @param {Object} config - Card configuration
     * @param {boolean} fullMSD - Whether this is a full MSD card
     * @returns {Promise<Object>} Pipeline
     */
    async createPipeline(card, config, fullMSD = false) { /* ... */ }

    /**
     * Unregister card when destroyed
     * Cleanup subscriptions, rules, overlays, etc.
     *
     * @param {string} cardId - Card to unregister
     */
    unregisterCard(cardId) { /* ... */ }

    /**
     * Unregister overlay when destroyed
     *
     * @param {string} overlayId - Overlay to unregister
     */
    unregisterOverlay(overlayId) { /* ... */ }

    /**
     * Get debug information
     *
     * @returns {Object} Debug info
     */
    getDebugInfo() { /* ... */ }
}
```

### 2. Rules Manager (Shared - Global + Local Scopes)

**Purpose:** Manage global and local rules with priority-based evaluation

**File:** `src/core/rules-manager/index.js`

**Features:**
- **Global rules:** Affect all matching overlays across all cards
- **Local rules:** Affect only overlays in declaring card
- **Priority system:** Firewall-style evaluation (highest priority first)
- **Rich targeting:** By ID, tag, wildcard
- **Pack system:** Load rules from YAML packs
- **Order-independent:** Rules work regardless of declaration order

**API Surface:**

```javascript
/**
 * RulesManager - Global and Local Rule Management
 *
 * Manages rules with firewall-style priority evaluation.
 * Supports global rules (cross-card) and local rules (per-card).
 *
 * @class RulesManager
 */
class RulesManager {
    constructor(styleLibrary, animationPresets) {
        this.styleLibrary = styleLibrary;
        this.animationPresets = animationPresets;

        // ===== RULE STORAGE =====
        this._globalRules = [];  // Global rules (sorted by priority)
        this._localRulesByCard = new Map();  // Map<cardId, Rule[]>

        // ===== OVERLAY REGISTRY =====
        this._overlayRegistry = new Map();  // Map<overlayId, { overlay, cardId, tags }>
        this._tagIndex = new Map();  // Map<tag, Set<overlayId>>

        // ===== PACK TRACKING =====
        this._loadedPacks = new Set();  // Set<packId>
    }

    /**
     * Declare a rule
     *
     * @param {Object} rule - Rule configuration
     * @param {string} cardId - Card declaring the rule
     * @param {string} scope - 'global' or 'local'
     */
    declareRule(rule, cardId, scope = 'global') {
        const ruleWithMeta = {
            ...rule,
            scope: scope,
            declaredBy: cardId,
            declaredAt: Date.now()
        };

        if (scope === 'global') {
            this._globalRules.push(ruleWithMeta);
            this._sortRulesByPriority(this._globalRules);
        } else {
            if (!this._localRulesByCard.has(cardId)) {
                this._localRulesByCard.set(cardId, []);
            }
            const localRules = this._localRulesByCard.get(cardId);
            localRules.push(ruleWithMeta);
            this._sortRulesByPriority(localRules);
        }

        // Apply to existing overlays
        this._applyRuleToExistingOverlays(ruleWithMeta);
    }

    /**
     * Register an overlay with the rules manager
     *
     * @param {string} overlayId - Unique overlay identifier
     * @param {Object} overlay - Overlay instance
     * @param {string} cardId - Parent card ID
     * @param {Array<string>} tags - Overlay tags
     */
    registerOverlay(overlayId, overlay, cardId, tags = []) {
        this._overlayRegistry.set(overlayId, { overlay, cardId, tags });

        // Index tags
        tags.forEach(tag => {
            if (!this._tagIndex.has(tag)) {
                this._tagIndex.set(tag, new Set());
            }
            this._tagIndex.get(tag).add(overlayId);
        });

        // Retroactively apply rules
        this._retroactivelyApplyRules(overlayId);
    }

    /**
     * Unregister overlay
     *
     * @param {string} overlayId - Overlay to unregister
     */
    unregisterOverlay(overlayId) {
        const context = this._overlayRegistry.get(overlayId);
        if (!context) return;

        // Remove from tag index
        context.tags.forEach(tag => {
            this._tagIndex.get(tag)?.delete(overlayId);
        });

        this._overlayRegistry.delete(overlayId);
    }

    /**
     * Evaluate rules for an overlay
     * Firewall-style: Local rules first, then global rules, first match wins
     *
     * @param {string} overlayId - Overlay to evaluate
     * @param {Object} entityState - Current entity state
     * @param {Object} customContext - Additional context
     * @returns {Object} Rule result { matched, rule, directives }
     */
    evaluateForOverlay(overlayId, entityState, customContext = {}) {
        const context = this._overlayRegistry.get(overlayId);
        if (!context) {
            return { matched: false };
        }

        // Get matching rules (local + global)
        const matchingRules = [
            ...this._getLocalRulesForOverlay(context.cardId, overlayId),
            ...this._getGlobalRulesForOverlay(overlayId)
        ];

        // Already sorted by priority (highest first)
        // Evaluate until first match (firewall-style)
        for (const rule of matchingRules) {
            if (this._matchesCondition(rule.condition, entityState, customContext)) {
                return {
                    matched: true,
                    rule: rule,
                    scope: rule.scope,
                    directives: this._processDirectives(rule.apply, customContext)
                };
            }
        }

        return { matched: false };
    }

    /**
     * Load rule pack from YAML
     *
     * @param {string} packUrl - URL to pack YAML file
     * @returns {Promise<void>}
     */
    async loadPack(packUrl) {
        try {
            const response = await fetch(packUrl);
            const packData = await response.text();
            const pack = jsyaml.load(packData);

            if (!pack.pack_id || !pack.global_rules) {
                throw new Error('Invalid rule pack format');
            }

            if (this._loadedPacks.has(pack.pack_id)) {
                lcardsLog.info(`[RulesManager] Pack ${pack.pack_id} already loaded, skipping`);
                return;
            }

            // Register rules from pack
            for (const rule of pack.global_rules) {
                this.declareRule(
                    { ...rule, source: pack.pack_id },
                    `pack:${pack.pack_id}`,
                    'global'
                );
            }

            this._loadedPacks.add(pack.pack_id);
            lcardsLog.info(`[RulesManager] Loaded rule pack: ${pack.pack_id} (${pack.global_rules.length} rules)`);

        } catch (error) {
            lcardsLog.error(`[RulesManager] Failed to load pack ${packUrl}:`, error);
        }
    }

    /**
     * Get local rules that affect this overlay
     * @private
     */
    _getLocalRulesForOverlay(cardId, overlayId) { /* ... */ }

    /**
     * Get global rules that affect this overlay
     * @private
     */
    _getGlobalRulesForOverlay(overlayId) { /* ... */ }

    /**
     * Check if rule targets this overlay
     * @private
     */
    _ruleTargetsOverlay(rule, overlayId) { /* ... */ }

    /**
     * Check if condition matches
     * @private
     */
    _matchesCondition(condition, entityState, context) { /* ... */ }

    /**
     * Process apply directives
     * @private
     */
    _processDirectives(apply, context) { /* ... */ }

    /**
     * Sort rules by priority
     * @private
     */
    _sortRulesByPriority(rules) {
        rules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    }

    /**
     * Apply rule to existing overlays (retroactive)
     * @private
     */
    _applyRuleToExistingOverlays(rule) { /* ... */ }

    /**
     * Apply all rules to newly registered overlay (retroactive)
     * @private
     */
    _retroactivelyApplyRules(overlayId) { /* ... */ }

    /**
     * Get debug info
     *
     * @returns {Object}
     */
    getDebugInfo() {
        return {
            globalRules: this._globalRules.length,
            localRulesByCard: Object.fromEntries(
                Array.from(this._localRulesByCard.entries()).map(([cardId, rules]) =>
                    [cardId, rules.length]
                )
            ),
            registeredOverlays: this._overlayRegistry.size,
            taggedOverlays: Object.fromEntries(this._tagIndex),
            loadedPacks: Array.from(this._loadedPacks)
        };
    }
}
```

### 3. Pack System (Rules & Animation Presets)

**Purpose:** Ship core rule packs and animation presets with LCARdS

**Initial Implementation:** Rules defined in JS code (easier to start)
**Future Enhancement:** Externalize to YAML files for easier maintenance

**Pack Structure (Future YAML Format):**

```yaml
# /src/lcards/rules/alert-conditions.yaml
pack_id: lcards-core-rules
version: 1.0.0
description: Standard LCARS alert condition rules
author: LCARdS Team

global_rules:
  # ============================================
  # Standard Alert Conditions
  # ============================================
  - id: red_alert
    scope: global
    priority: 1000
    condition:
      entity: sensor.alert_condition
      state: "red"
    target:
      tags: ["alert-sensitive"]
    apply:
      style_preset: red_alert
      animation: pulse_critical

  - id: yellow_alert
    scope: global
    priority: 900
    condition:
      entity: sensor.alert_condition
      state: "yellow"
    target:
      tags: ["alert-sensitive"]
    apply:
      style_preset: yellow_alert
      animation: pulse_warning

  - id: green_alert
    scope: global
    priority: 800
    condition:
      entity: sensor.alert_condition
      state: "green"
    target:
      tags: ["alert-sensitive"]
    apply:
      style_preset: green_alert

  # ============================================
  # Universal Error States
  # ============================================
  - id: entity_unavailable
    scope: global
    priority: 950
    condition:
      state: ["unavailable", "unknown"]
    target: "*"  # ALL overlays
    apply:
      style_preset: error
      animation: blink_error
```

**Initial JS Implementation (Phase 1):**

```javascript
// src/core/rules-manager/builtin-packs.js

/**
 * Built-in rule packs
 * TODO: Externalize to YAML in Phase 3
 */
export const BUILTIN_RULE_PACKS = {
    'lcards-core-rules': {
        pack_id: 'lcards-core-rules',
        version: '1.0.0',
        description: 'Standard LCARS alert condition rules',
        global_rules: [
            {
                id: 'red_alert',
                priority: 1000,
                condition: { entity: 'sensor.alert_condition', state: 'red' },
                target: { tags: ['alert-sensitive'] },
                apply: { style_preset: 'red_alert', animation: 'pulse_critical' }
            },
            {
                id: 'yellow_alert',
                priority: 900,
                condition: { entity: 'sensor.alert_condition', state: 'yellow' },
                target: { tags: ['alert-sensitive'] },
                apply: { style_preset: 'yellow_alert', animation: 'pulse_warning' }
            },
            {
                id: 'green_alert',
                priority: 800,
                condition: { entity: 'sensor.alert_condition', state: 'green' },
                target: { tags: ['alert-sensitive'] },
                apply: { style_preset: 'green_alert' }
            },
            {
                id: 'entity_unavailable',
                priority: 950,
                condition: { state: ['unavailable', 'unknown'] },
                target: '*',
                apply: { style_preset: 'error', animation: 'blink_error' }
            }
        ]
    }
};
```

### 4. Standalone Overlay Cards

**Purpose:** Allow overlays to function as independent cards

**Example: Button Card**

```yaml
# Standalone button card
- type: lcards-button-card
  id: warp_core_button
  tags: ["engineering", "alert-sensitive"]
  entity: light.warp_core

  # Button-specific config
  shape: lozenge
  size: medium
  label: "WARP CORE"

  # Optional: Local rules (override global)
  local_rules:
    - priority: 1001
      condition: { state: "on" }
      apply:
        style_preset: warp_active
        animation: pulse_blue
```

**Example: Text Card**

```yaml
# Standalone text card
- type: lcards-text-card
  id: status_display
  tags: ["alert-sensitive"]

  # Text-specific config
  text: "${data.system_status.message}"
  font_size: 18
  color: var(--lcards-ui-secondary)

  # Data source reference
  data_sources:
    - id: system_status
      type: rest
      url: /api/system/status
      refresh: 5
```

**Same Config in MSD:**

```yaml
# Inside MSD - exact same config + position
- type: lcards-msd-card
  msd:
    overlays:
      # Button overlay
      - type: button
        id: warp_core_button
        tags: ["engineering", "alert-sensitive"]
        entity: light.warp_core

        # Position only required in MSD
        position: [100, 200]

        # Same button config as standalone
        shape: lozenge
        size: medium
        label: "WARP CORE"

      # Text overlay
      - type: text
        id: status_display
        tags: ["alert-sensitive"]

        # Position only required in MSD
        position: [300, 400]

        # Same text config as standalone
        text: "${data.system_status.message}"
        font_size: 18
        color: var(--lcards-ui-secondary)
```

### 5. Multi-Instance Support

**Key Changes:**

1. **Remove MSD Instance Manager singleton limitation**
2. **Per-card animation scopes** (already implemented)
3. **Shared core systems** (SystemsManager, RulesManager, etc.)
4. **Overlay registration by unique ID** (cardId + overlayId)

**Example: Multiple MSD Cards**

```yaml
# Dashboard with 2 MSD cards + standalone overlays
views:
  - name: Bridge
    cards:
      # MSD 1: Main viewscreen
      - type: lcards-msd-card
        id: main_viewscreen
        msd:
          base_svg:
            source: builtin:enterprise-d-bridge
          overlays:
            - id: main_viewer  # Unique: main_viewscreen.main_viewer
              tags: ["alert-sensitive"]
              type: text
              position: [100, 100]

      # MSD 2: Engineering console
      - type: lcards-msd-card
        id: engineering_console
        msd:
          base_svg:
            source: builtin:enterprise-d-engineering
          overlays:
            - id: warp_core_status  # Unique: engineering_console.warp_core_status
              tags: ["engineering", "alert-sensitive"]
              type: gauge
              position: [200, 200]

      # Standalone button
      - type: lcards-button-card
        id: red_alert_button  # Unique: standalone
        tags: ["alert-sensitive"]

# Result: Red alert affects ALL 3 overlays across both MSDs + button!
```

---

## Implementation Phases

### Phase 1: Core Infrastructure Extraction (Week 1-3)

**Goal:** Extract and unify core systems from MSD into global singleton

#### Tasks

##### 1.1: Create Core Module Structure

**Files to Create:**
```
src/core/
├── lcards-core.js                   # Main LCARdSCore singleton
├── lcards-init.js                   # Lightweight initialization
├── systems-manager/
│   └── index.js                     # SystemsManager (extracted from MSD)
├── data-sources/
│   ├── index.js                     # DataSourceManager
│   └── rest-source.js               # REST API polling
├── rules-manager/
│   ├── index.js                     # RulesManager
│   ├── builtin-packs.js             # Built-in rules (JS for now)
│   └── condition-evaluator.js      # Condition matching logic
└── styling/
    ├── style-library.js             # StyleLibrary
    └── builtin-styles.js            # Built-in style presets
```

##### 1.2: Extract SystemsManager from MSD

**Source:** `src/msd/core/systems-manager.js`

**Changes:**
- Remove MSD-specific dependencies
- Make it work without pipeline reference
- Add multi-card subscription management
- Add entity state caching

**Deliverable:** `src/core/systems-manager/index.js`

##### 1.3: Extract DataSourceManager from MSD

**Source:** `src/msd/data-sources/`

**Changes:**
- Remove MSD-specific dependencies
- Add retry logic for missing data sources
- Support config merging from multiple cards
- Add subscription lifecycle management

**Deliverable:** `src/core/data-sources/index.js`

##### 1.4: Create RulesManager (Global + Local Scopes)

**New Implementation** (inspired by MSD rules engine)

**Features:**
- Global rule storage (sorted by priority)
- Local rule storage (per-card)
- Overlay registry with tag indexing
- Firewall-style evaluation (local first, then global)
- Built-in rule packs (JS-defined initially)

**Deliverable:** `src/core/rules-manager/index.js`

##### 1.5: Create LCARdSCore Singleton

**New Implementation**

**Features:**
- Lazy initialization (on first card)
- Card registration and lifecycle
- Overlay registration and lifecycle
- Data source declaration hoisting
- Rule declaration hoisting
- Pipeline creation (light vs full MSD)

**Deliverable:** `src/core/lcards-core.js`

##### 1.6: Update LCARdSBaseCard

**File:** `src/base/LCARdSBaseCard.js` (or wherever base card lives)

**Changes:**
- Initialize core on first card connection
- Create pipeline via core
- Forward HASS updates to pipeline
- Initialize overlays/controls if configured
- Handle card destruction (unregister from core)

##### 1.7: Lightweight Module-Level Initialization

**File:** `src/lcards.js` (main entry point)

**Initialize immediately:**
- Event Bus (~5KB)
- Animation API (~1KB)
- SVG Helpers (~2KB)
- Font Loader (<1KB)
- Debug API (<1KB)

**Register for lazy init:**
- LCARdSCore singleton (initialize on first card)

**Deliverable:** Updated `src/lcards.js` with lightweight init

**Phase 1 Deliverables:**
- ✅ `src/core/lcards-core.js` - Core singleton
- ✅ `src/core/systems-manager/index.js` - Entity tracking
- ✅ `src/core/data-sources/index.js` - Data fetching
- ✅ `src/core/rules-manager/index.js` - Rule evaluation
- ✅ `src/core/styling/style-library.js` - Style presets
- ✅ Updated `src/lcards.js` - Module initialization
- ✅ Updated `src/base/LCARdSBaseCard.js` - Core integration
- ✅ Unit tests for each core system

---

### Phase 2: Standalone Overlay Cards (Week 4-6)

**Goal:** Create button and text overlays as standalone cards

#### Tasks

##### 2.1: Create BaseOverlay Class with Loading States

**File:** `src/components/overlays/base-overlay.js`

**Features:**
- Automatic dependency waiting (entities, data sources)
- Pending state rendering ("LOADING..." with animation)
- Error state rendering (red error message)
- Lifecycle hooks (onInitialize, render, onUpdate, destroy)
- State machine (initializing → pending → ready | error)

**Deliverable:** Base class for all overlays

##### 2.2: Extract ButtonOverlay from MSD

**Source:** `src/msd/overlays/button-overlay.js`

**Changes:**
- Extend new BaseOverlay class
- Remove MSD-specific position handling
- Work in standalone card mode (no SVG parent required)
- Use window.lcards.core for rules evaluation

**Deliverable:** `src/components/overlays/button-overlay.js`

##### 2.3: Create LCARdSButtonCard

**File:** `src/cards/lcards-button-card.js`

**Implementation:**

```javascript
/**
 * LCARdS Button Card
 * Standalone button overlay as a custom card
 *
 * @extends LCARdSBaseCard
 */
class LCARdSButtonCard extends LCARdSBaseCard {
    static get properties() {
        return {
            config: { type: Object },
            hass: { type: Object }
        };
    }

    async setConfig(config) {
        // Validate config
        this.config = config;

        // Initialize core if needed
        if (this.hass && !window.lcards.core._coreInitialized) {
            await window.lcards.core.initialize(this.hass);
        }

        // Create lightweight pipeline
        this._pipeline = await window.lcards.core.createPipeline(this, config, false);

        // Declare rules if provided
        if (config.local_rules) {
            config.local_rules.forEach(rule => {
                window.lcards.core.declareRule(rule, this._pipeline.cardId, 'local');
            });
        }
        if (config.global_rules) {
            config.global_rules.forEach(rule => {
                window.lcards.core.declareRule(rule, this._pipeline.cardId, 'global');
            });
        }

        // Declare data sources if provided
        if (config.data_sources) {
            config.data_sources.forEach(ds => {
                window.lcards.core.declareDataSource(this._pipeline.cardId, ds);
            });
        }

        // Create button overlay
        const ButtonOverlay = window.lcards.core.componentRegistry.getOverlay('button');
        this._buttonOverlay = new ButtonOverlay(config, this._pipeline);

        // Register overlay with core
        window.lcards.core.registerOverlay(
            config.id || `button-${this._pipeline.cardId}`,
            this._buttonOverlay,
            this._pipeline.cardId,
            config.tags || []
        );

        // Initialize overlay
        await this._buttonOverlay.initialize();

        this.requestUpdate();
    }

    render() {
        if (!this._buttonOverlay) {
            return html`<div>Loading...</div>`;
        }

        return html`
            <div class="lcards-button-card">
                ${this._buttonOverlay.render()}
            </div>
        `;
    }

    disconnectedCallback() {
        super.disconnectedCallback();

        // Cleanup
        if (this._buttonOverlay) {
            window.lcards.core.unregisterOverlay(this._buttonOverlay.id);
            this._buttonOverlay.destroy();
        }

        if (this._pipeline) {
            window.lcards.core.unregisterCard(this._pipeline.cardId);
            this._pipeline.destroy();
        }
    }
}

customElements.define('lcards-button-card', LCARdSButtonCard);
```

**Deliverable:** Working standalone button card

##### 2.4: Extract TextOverlay from MSD

**Source:** `src/msd/overlays/text-overlay.js`

**Changes:**
- Extend new BaseOverlay class
- Remove MSD-specific position handling
- Support data source references
- Support template strings

**Deliverable:** `src/components/overlays/text-overlay.js`

##### 2.5: Create LCARdSTextCard

**File:** `src/cards/lcards-text-card.js`

**Implementation:** Similar to button card (see above)

**Deliverable:** Working standalone text card

##### 2.6: Test Multi-Instance Deployment

**Create test dashboard:**
- 2 MSD cards with overlays
- 2 standalone button cards
- 1 standalone text card
- Global red alert rule affecting all

**Verify:**
- All cards load regardless of order
- Red alert affects all overlays
- Data sources shared correctly
- No interference between cards

**Phase 2 Deliverables:**
- ✅ `src/components/overlays/base-overlay.js` - Base overlay class
- ✅ `src/components/overlays/button-overlay.js` - Button overlay
- ✅ `src/components/overlays/text-overlay.js` - Text overlay
- ✅ `src/cards/lcards-button-card.js` - Standalone button card
- ✅ `src/cards/lcards-text-card.js` - Standalone text card
- ✅ Multi-instance test dashboard
- ✅ Integration tests

---

### Phase 3: Pack System & Polish (Week 7-8)

**Goal:** Implement pack system and polish core features

#### Tasks

##### 3.1: Built-in Rule Packs (JS Implementation)

**File:** `src/core/rules-manager/builtin-packs.js`

**Packs to create:**
- `lcards-core-rules` - Alert conditions, entity states
- `lcards-engineering-rules` - Engineering-specific rules (optional)

**Load in core initialization:**

```javascript
// In LCARdSCore.initialize()
await this.rulesManager.loadBuiltinPacks([
    'lcards-core-rules'  // Always loaded
    // Optional packs loaded based on config
]);
```

**Deliverable:** Built-in rule packs working

##### 3.2: Built-in Style Presets

**File:** `src/core/styling/builtin-styles.js`

**Presets to create:**
- `red_alert` - Red alert styling
- `yellow_alert` - Yellow alert styling
- `green_alert` - Green alert styling
- `error` - Error state styling
- `active` - Active entity styling
- `inactive` - Inactive entity styling

**Deliverable:** Built-in style presets working

##### 3.3: Update MSD Card to Use Global Core

**File:** `src/cards/lcards-msd-card.js`

**Changes:**
- Use global core instead of instance manager
- Register all overlays with core
- Declare rules to core (if provided)
- Declare data sources to core (if provided)

**Deliverable:** MSD card using global core

##### 3.4: Remove Legacy Instance Manager

**File to remove:** `src/msd/core/instance-manager.js`

**Changes:**
- Remove singleton limitation
- Remove instance tracking
- Update MSD initialization to use core

**Deliverable:** Instance manager removed

##### 3.5: Documentation

**Files to create/update:**
- `doc/architecture/core-infrastructure.md` - Core architecture
- `doc/architecture/rules-system.md` - Rules system guide
- `doc/user-guide/standalone-overlays.md` - Using standalone cards
- `doc/user-guide/multi-instance.md` - Multiple MSDs
- `doc/developer/creating-overlays.md` - Creating overlay cards

**Deliverable:** Complete documentation

##### 3.6: Performance Testing

**Tests:**
- Load time with 10 cards
- Memory usage with 20 overlays
- Rule evaluation performance with 50 rules
- Data source polling efficiency

**Deliverable:** Performance report

**Phase 3 Deliverables:**
- ✅ Built-in rule packs (JS)
- ✅ Built-in style presets
- ✅ MSD using global core
- ✅ Instance manager removed
- ✅ Complete documentation
- ✅ Performance testing

---

### Phase 4: Future Enhancements (Week 9+)

**Optional enhancements for future releases:**

#### 4.1: Externalize Packs to YAML

**Goal:** Move built-in packs from JS to YAML files

**Benefits:**
- Easier to maintain
- Users can see and understand default rules
- Community can contribute rule packs

**Tasks:**
- Create YAML pack loader
- Convert JS packs to YAML
- Update pack loading in core
- Add pack validation

**Deliverable:** YAML pack system

#### 4.2: Native Slider Control

**Goal:** Replace external slider dependencies with native implementation

**Implementation:**
- Create `src/components/controls/slider-control.js`
- Use anime.js v4 for animations
- Support all entity types (light, fan, cover, etc.)
- LCARS styling

**Deliverable:** Native slider control

#### 4.3: Additional Overlay Types

**Future overlay cards:**
- `lcards-gauge-card` - Gauge/meter overlay
- `lcards-sparkline-card` - Sparkline overlay
- `lcards-apexcharts-card` - ApexCharts integration

**Deliverable:** Additional overlay card types

#### 4.4: Visual Rule Debugger

**Goal:** Help users understand rule evaluation

**Features:**
- Show which rules are active
- Highlight matched conditions
- Display rule priority order
- Show affected overlays

**Deliverable:** Debug UI panel

#### 4.5: Community Pack Marketplace

**Goal:** Allow users to share rule and animation packs

**Features:**
- Pack registry
- Pack discovery
- Pack installation
- Pack versioning

**Deliverable:** Pack marketplace (long-term)

---

## API Reference

### Core API

**Global Namespace:**

```javascript
window.lcards = {
    // === CORE SINGLETON ===
    core: LCARdSCore,

    // === UTILITIES (Always Available) ===
    eventBus: CBLCARSEventBus,
    anim: { anime, scopes, presets, ... },
    svgHelpers: { ... },
    anchorHelpers: { ... },
    loadFont: Function,

    // === DEBUG API ===
    debug: {
        setLevel: Function,
        getLevel: Function,
        getInfo: Function,
        eventBus: Function,
        core: Function
    }
};
```

### Core Methods

```javascript
// Initialize core (called automatically by first card)
await window.lcards.core.initialize(hass);

// Register card
const context = await window.lcards.core.registerCard(cardId, card, config);

// Register overlay
window.lcards.core.registerOverlay(overlayId, overlay, cardId, config);

// Declare data source
window.lcards.core.declareDataSource(cardId, dataSourceConfig);

// Declare rule
window.lcards.core.declareRule(rule, cardId, scope);

// Create pipeline
const pipeline = await window.lcards.core.createPipeline(card, config, fullMSD);
```

### Rules API

```javascript
// Evaluate rules for overlay
const result = window.lcards.core.rulesManager.evaluateForOverlay(
    overlayId,
    entityState,
    customContext
);

// Result: { matched: boolean, rule: Object, scope: string, directives: Object }

// Load rule pack
await window.lcards.core.rulesManager.loadPack('/local/my-rules.yaml');

// Get debug info
const info = window.lcards.core.rulesManager.getDebugInfo();
```

### Pipeline API (Light Pipeline)

```javascript
const pipeline = {
    cardId: 'button-abc123',

    // Shared system references
    systemsManager: core.systemsManager,
    dataSourceManager: core.dataSourceManager,
    rulesManager: core.rulesManager,
    styleLibrary: core.styleLibrary,

    // Convenience methods
    getEntityState: (entityId) => { ... },
    getDataSource: (dsId) => { ... },
    evaluateRules: (overlayId, entityState, context) => { ... },
    applyStyles: (element, ruleResult) => { ... },
    ingestHass: (hass) => { ... },
    destroy: () => { ... }
};
```

---

## Testing Strategy

### Unit Tests

**Core Systems:**
- `test/core/lcards-core.test.js` - Core singleton
- `test/core/systems-manager.test.js` - Entity tracking
- `test/core/data-sources.test.js` - Data source management
- `test/core/rules-manager.test.js` - Rule evaluation

**Overlays:**
- `test/components/base-overlay.test.js` - Base overlay class
- `test/components/button-overlay.test.js` - Button overlay
- `test/components/text-overlay.test.js` - Text overlay

**Cards:**
- `test/cards/button-card.test.js` - Standalone button card
- `test/cards/text-card.test.js` - Standalone text card

### Integration Tests

**Multi-Instance:**
- Multiple MSD cards on same dashboard
- Multiple standalone cards on same dashboard
- Mixed MSD + standalone cards

**Rule Evaluation:**
- Global rules affecting all cards
- Local rules overriding global rules
- Priority-based evaluation
- Tag-based targeting

**Data Sources:**
- Shared data sources across cards
- Order-independent initialization
- Config merging from multiple cards

**Performance:**
- Load time with 10+ cards
- Memory usage with 20+ overlays
- Rule evaluation with 50+ rules

### Manual Testing

**Test Dashboard:**

```yaml
title: LCARdS Test Dashboard
views:
  - name: Multi-Instance Test
    cards:
      # MSD 1
      - type: lcards-msd-card
        id: bridge_msd
        global_rules:
          - id: red_alert
            scope: global
            priority: 1000
            condition: { entity: sensor.alert, state: "red" }
            target: { tags: ["alert-sensitive"] }
            apply: { style_preset: red_alert }
        msd:
          base_svg:
            source: builtin:enterprise-d-bridge
          overlays:
            - id: main_viewer
              type: text
              tags: ["alert-sensitive"]
              position: [100, 100]
              text: "MAIN VIEWER"

      # MSD 2
      - type: lcards-msd-card
        id: engineering_msd
        msd:
          base_svg:
            source: builtin:enterprise-d-engineering
          overlays:
            - id: warp_core
              type: gauge
              tags: ["engineering", "alert-sensitive"]
              position: [200, 200]

      # Standalone button
      - type: lcards-button-card
        id: red_alert_button
        tags: ["alert-sensitive"]
        entity: switch.red_alert
        shape: lozenge
        label: "RED ALERT"

      # Standalone text
      - type: lcards-text-card
        id: status_text
        tags: ["alert-sensitive"]
        text: "System Status: ${data.status.message}"
        data_sources:
          - id: status
            type: rest
            url: /api/system/status
            refresh: 5

# Expected behavior:
# 1. All cards load regardless of order
# 2. Red alert affects all "alert-sensitive" overlays
# 3. Data sources work across all cards
# 4. Multiple MSDs work simultaneously
```

---

## Success Criteria

### Functional Requirements

- ✅ **Multi-instance support:** Multiple MSD cards and overlay cards on same dashboard
- ✅ **Standalone overlays:** Button and text overlays work as independent cards
- ✅ **Consistent configs:** Same overlay config works standalone or in MSD
- ✅ **Global rules:** Rules affect all matching overlays across all cards
- ✅ **Local rules:** Per-card rules override global rules
- ✅ **Order-independent:** Cards work regardless of load order
- ✅ **Shared infrastructure:** SystemsManager, DataSourceManager, RulesManager shared
- ✅ **Pack system:** Core rule packs ship with LCARdS

### Performance Requirements

- ✅ **Module overhead:** ≤10KB for lightweight systems
- ✅ **Core overhead:** ≤200KB for full core initialization
- ✅ **Load time:** <500ms for 10 cards
- ✅ **Memory usage:** <50MB for 20 overlays
- ✅ **Rule evaluation:** <10ms for 50 rules

### Code Quality Requirements

- ✅ **JSDoc:** All public methods documented
- ✅ **Tests:** 80%+ coverage for core systems
- ✅ **Architecture docs:** Complete and up-to-date
- ✅ **User docs:** Guides for standalone cards and multi-instance
- ✅ **No legacy code:** Button-card dependencies removed

### User Experience Requirements

- ✅ **Simple use case stays simple:** Basic button card is <10 lines of YAML
- ✅ **Power users have control:** Advanced features available via local rules
- ✅ **Red alert works:** Global red alert affects all cards (core feature)
- ✅ **Loading states:** Clear feedback when overlays wait for data sources
- ✅ **Error handling:** Clear error messages when things go wrong

---

## Appendix

### A. Migration from Current MSD

**No migration required** - MSD will be updated to use global core internally.

Users with existing MSD cards will see:
- Same functionality
- Better performance (shared systems)
- New capability: Multiple MSDs per dashboard

### B. Configuration Examples

See [API Reference](#api-reference) section for complete examples.

### C. Pack System TODO

**Phase 1 (Current):**
- Rules defined in JS code (`builtin-packs.js`)
- Easy to implement, get started quickly

**Phase 4 (Future Enhancement):**
- Externalize to YAML files
- Easier for users to understand and modify
- Community can contribute packs
- Add pack validation and versioning

**Rationale for JS-first approach:**
- Faster implementation
- No YAML loader complexity initially
- Can refactor to YAML later without breaking API
- Built-in packs are stable, don't need frequent editing

### D. Rule Pack Format (Future YAML)

```yaml
pack_id: string  # Unique pack identifier
version: string  # Semantic version
description: string  # Human-readable description
author: string  # Pack author
homepage: string  # URL to pack documentation (optional)

global_rules:  # Array of rules
  - id: string  # Unique rule ID within pack
    priority: number  # Rule priority (higher = evaluated first)
    condition: object  # Condition to match
    target: object  # What overlays to affect
    apply: object  # What to apply when matched
```

### E. Glossary

- **Overlay:** Visual component that can render in MSD or standalone (button, text, gauge, etc.)
- **Control:** Interactive component (slider, tap handler, etc.)
- **Pipeline:** Context object providing overlay access to core systems
- **Light Pipeline:** Simplified pipeline for standalone overlay cards
- **Full MSD Pipeline:** Complete pipeline with MSD-specific features
- **Global Rules:** Rules that affect all matching overlays across all cards
- **Local Rules:** Rules that only affect overlays in the declaring card
- **Pack:** Collection of rules or presets (animation, style)
- **Scope:** Whether a rule is global (cross-card) or local (single-card)
- **Priority:** Numeric value determining rule evaluation order (higher = first)
- **Target:** Specification of which overlays a rule affects (by ID, tag, wildcard)

---

**End of Implementation Plan**