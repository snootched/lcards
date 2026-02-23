/**
 * MsdDebugAPI - Debug and introspection API for LCARdS MSD
 *
 * Provides advanced debugging, introspection, and analysis tools for developers.
 * Accessible via window.lcards.debug.msd namespace.
 *
 * Phase 1: Core debug functionality (performance, routing, data, styles, charts)
 *
 * @module api/MsdDebugAPI
 */

import { lcardsLog } from '../utils/lcards-logging.js';

/**
 * Get all MSD card instances from SystemsManager
 * @returns {Array} Array of {card, config, cardId} objects
 * @private
 */
function _getAllMsdCards() {
  const core = window.lcards?.core;
  if (!core?.systemsManager) {
    lcardsLog.warn('[MsdDebugAPI] SystemsManager not available');
    return [];
  }

  const registered = core.systemsManager._registeredCards;
  const msdCards = [];

  registered.forEach((cardData, cardId) => {
    // Check if it's an MSD card
    if (cardData.card?.tagName === 'LCARDS-MSD-CARD') {
      msdCards.push({
        card: cardData.card,
        config: cardData.config,
        cardId: cardId
      });
    }
  });

  return msdCards;
}

/**
 * Get MSD card by config ID or return first card if no ID specified
 * @param {string|null} cardId - Config ID (e.g. 'bridge') or null for first card
 * @returns {Element|null} MSD card element
 * @private
 */
function _getMsdCard(cardId = null) {
  const allCards = _getAllMsdCards();

  if (allCards.length === 0) {
    return null;
  }

  // If no ID specified, return first card
  if (!cardId) {
    return allCards[0].card;
  }

  // Find by config ID
  const found = allCards.find(c => c.config?.id === cardId);
  return found ? found.card : null;
}

/**
 * Get MSD card pipeline using SystemsManager
 * @param {string|null} cardId - Config ID (e.g. 'bridge') or null for first card
 * @returns {Object|null} Pipeline API or null
 * @private
 */
function _getMsdPipeline(cardId = null) {
  const card = _getMsdCard(cardId);

  if (!card?._msdPipeline) {
    lcardsLog.warn('[MsdDebugAPI] No MSD card found or pipeline not initialized');
    return null;
  }

  // Warn if using default (null) selector with multiple cards
  if (cardId === null) {
    const allCards = _getAllMsdCards();
    if (allCards.length > 1) {
      const cardIds = allCards.map(c => c.config?.id || 'unnamed').join(', ');
      lcardsLog.warn(
        `[MsdDebugAPI] ⚠️ Multiple MSD cards detected (${allCards.length}: ${cardIds}). ` +
        `Using first card. To list all cards: listMsdCards(). ` +
        `To target specific card, pass card ID as second parameter: ` +
        `methodName(arg, 'bridge')`
      );
    }
  }

  return card._msdPipeline;
}

/**
 * Get MSD card coordinator using SystemsManager
 * @param {string|null} cardId - Config ID (e.g. 'bridge') or null for first card
 * @returns {Object|null} Coordinator or null
 * @private
 */
function _getMsdCoordinator(cardId = null) {
  const card = _getMsdCard(cardId);
  return card?._msdPipeline?.coordinator || null;
}

/**
 * Get resolved model using SystemsManager
 * @param {string|null} cardId - Config ID (e.g. 'bridge') or null for first card
 * @returns {Object|null} Resolved model or null
 * @private
 */
function _getMsdModel(cardId = null) {
  const pipeline = _getMsdPipeline(cardId);
  return typeof pipeline?.getResolvedModel === 'function' ? pipeline.getResolvedModel() : null;
}

/**
 * Get config using SystemsManager
 * @param {string|null} cardId - Config ID (e.g. 'bridge') or null for first card
 * @returns {Object|null} Config or null
 * @private
 */
function _getMsdConfig(cardId = null) {
  return _getMsdPipeline(cardId)?.config || null;
}

/**
 * MSD Debug API
 * Provides debugging utilities for MSD cards
 *
 * Supports multiple MSD card instances on the same dashboard.
 * All methods accept an optional cardId parameter for multi-card targeting.
 *
 * @example
 * // Single MSD card - use default selector
 * window.lcards.debug.msd.inspect('overlay1')
 *
 * @example
 * // Multiple MSD cards - discover available cards first
 * const cards = window.lcards.debug.msd.listMsdCards()
 * // Returns: [{id: 'bridge', selector: '...', overlayCount: 15}, ...]
 *
 * // Then target specific card
 * window.lcards.debug.msd.inspect('overlay1', 'lcards-msd[id="bridge"]')
 * window.lcards.debug.msd.getRouterMetrics('lcards-msd[id="engineering"]')
 */
export class MsdDebugAPI {
  /**
   * Create Debug API instance
   * @returns {Object} Debug API methods
   */
  static create() {
    return {
      // ==========================================
      // ROOT UTILITY METHODS
      // ==========================================

      /**
       * Get singleton debug info (unified API access)
       *
       * Provides access to core singleton debug information through the
       * structured API while preserving direct console access patterns.
       *
       * @returns {Object} Core singleton debug information
       *
       * @example
       * // Structured API access
       * window.lcards.debug.msd.core();
       *
       * // Direct access (still works)
       * window.lcards.core.getDebugInfo();
       * window.lcards.debug.singletons.getDebugInfo();
       */
      core() {
        if (window.lcards?.core?.getDebugInfo) {
          return window.lcards.core.getDebugInfo();
        }
        return { error: 'Core singletons not available', available: false };
      },

      /**
       * Get specific singleton manager debug info
       *
       * @param {string} manager - Manager name (e.g., 'systemsManager', 'dataSourceManager')
       * @returns {Object} Manager debug information
       *
       * @example
       * window.lcards.debug.msd.singleton('systemsManager');
       * window.lcards.debug.msd.singleton('dataSourceManager');
       */
      singleton(manager) {
        const core = window.lcards?.core;
        if (!core) {
          return { error: 'Core singletons not available', manager, available: false };
        }

        const singletonManager = core[manager];
        if (!singletonManager) {
          return {
            error: `Manager '${manager}' not found`,
            manager,
            available: Object.keys(core).filter(k => !k.startsWith('_'))
          };
        }

        if (typeof singletonManager.getDebugInfo === 'function') {
          return singletonManager.getDebugInfo();
        }

        return {
          error: `Manager '${manager}' does not have getDebugInfo method`,
          manager,
          type: typeof singletonManager
        };
      },

      /**
       * List all available singleton managers
       *
       * @returns {Array} Array of available singleton manager names
       *
       * @example
       * window.lcards.debug.msd.singletons();
       */
      singletons() {
        const core = window.lcards?.core;
        if (!core) {
          return { error: 'Core singletons not available', available: false };
        }

        const managers = Object.keys(core).filter(key => {
          return !key.startsWith('_') &&
                 core[key] &&
                 typeof core[key] === 'object' &&
                 typeof core[key].getDebugInfo === 'function';
        });

        return {
          managers,
          count: managers.length,
          coreInitialized: core._coreInitialized,
          directAccess: 'window.lcards.core or window.lcards.debug.singletons'
        };
      },

      /**
       * List all MSD cards on the page
       * Useful for discovering card IDs when debugging multiple instances
       * Uses SystemsManager for reliable card discovery
       *
       * @returns {Array<Object>} Array of card info objects
       *
       * @example
       * // Discover all MSD cards
       * window.lcards.debug.msd.listMsdCards()
       * // Returns:
       * // [
       * //   {
       * //     id: 'bridge',
       * //     systemId: 'lcards-abc123',
       * //     hasConfig: true,
       * //     hasPipeline: true,
       * //     overlayCount: 15,
       * //     routingChannels: 10,
       * //     element: <lcards-msd-card>
       * //   },
       * //   {
       * //     id: 'engineering',
       * //     systemId: 'lcards-xyz789',
       * //     hasConfig: true,
       * //     hasPipeline: true,
       * //     overlayCount: 8,
       * //     routingChannels: 5,
       * //     element: <lcards-msd-card>
       * //   }
       * // ]
       */
      listMsdCards() {
        const cards = _getAllMsdCards();

        if (cards.length === 0) {
          lcardsLog.warn('[MsdDebugAPI] No MSD cards found on page');
          return [];
        }

        const cardInfo = cards.map((cardData) => {
          const { card, config, cardId } = cardData;
          const pipeline = card._msdPipeline;
          const configId = config?.id || 'unnamed';

          return {
            id: configId,
            systemId: cardId,
            hasConfig: !!config,
            hasPipeline: !!pipeline,
            overlayCount: pipeline?.coordinator?.cardModel?.overlays?.length || 0,
            routingChannels: pipeline?.coordinator?.router?.channels?.size || 0,
            element: card
          };
        });

        lcardsLog.info(`[MsdDebugAPI] Found ${cards.length} MSD card(s):`, cardInfo.map(c => c.id));
        return cardInfo;
      },

      /**
       * Display help information about available API methods
       *
       * @param {string} [topic] - Optional namespace to get specific help (e.g., 'perf', 'routing', 'data', 'core')
       *
       * @example
       * // Show all available namespaces
       * window.lcards.debug.msd.help();
       *
       * // Show methods in a specific namespace
       * window.lcards.debug.msd.help('perf');
       * window.lcards.debug.msd.help('core');
       */
      help(topic) {
        const namespaces = {
          core: {
            desc: 'Core singleton access and debugging',
            methods: ['core()', 'singleton(manager)', 'singletons()']
          },
          perf: {
            desc: 'Performance profiling and analysis',
            methods: ['summary()', 'slowestOverlays(n)', 'byRenderer()', 'byOverlay(id)', 'warnings()', 'timeline()', 'compare()']
          },
          routing: {
            desc: 'Routing and resolution debugging',
            methods: ['inspect(guid)', 'trace(guid)', 'analyze(guid)', 'listActive()', 'testMatch()']
          },
          data: {
            desc: 'Data context and subscription inspection',
            methods: ['context()', 'subscriptions()', 'inspect(entityId)', 'entities()', 'refresh()', 'trace(entityId)', 'history()', 'validate()']
          },
          styles: {
            desc: 'Style computation and inspection',
            methods: ['computed(guid)', 'effective(guid)', 'overrides(guid)', 'inheritance(guid)', 'cascade(guid)', 'validate(guid)']
          },
          charts: {
            desc: 'Chart data processing inspection',
            methods: ['inspect(guid)', 'trace(guid)', 'validate(guid)', 'compareSnapshots()']
          },
          rules: {
            desc: 'Rule evaluation and validation',
            methods: ['listActive(options)', 'evaluate()', 'trace()', 'validate()']
          },
          animations: {
            desc: 'Animation state and playback control',
            methods: ['list()', 'inspect(id)', 'control(id, action)', 'registry()']
          },
          packs: {
            desc: 'Pack compilation and management',
            methods: ['list()', 'inspect(packId)', 'compile()', 'validate()']
          },
          visual: {
            desc: 'Visual debugging and overlay inspection',
            methods: ['hud()', 'highlight(guid)', 'inspect(guid)', 'snapshot()', 'diff(before, after)', 'validate(guid)', 'toggleBorders()']
          },
          overlays: {
            desc: 'Overlay management and bulk operations',
            methods: ['list(filter)', 'inspect(id)', 'create()', 'update(id, changes)', 'remove(id)', 'bulkUpdate(selector, changes)', 'bulkRemove(selector)', 'bulkApplyTags(selector, tags)', 'validate(id)', 'export(filter)', 'import(data)']
          },
          pipeline: {
            desc: 'Pipeline execution and lifecycle control',
            methods: ['status()', 'lifecycle()', 'trace()', 'rerun()', 'getInstance()']
          }
        };

        if (!topic) {
          console.log('%c LCARdS Debug API Help ', 'background: #ff9900; color: #000; font-weight: bold; padding: 4px 8px;');
          console.log('\n%cAvailable namespaces:', 'font-weight: bold; color: #ff9900;');
          Object.entries(namespaces).forEach(([name, info]) => {
            console.log(`  %c${name}%c - ${info.desc}`, 'color: #66ccff; font-weight: bold', 'color: inherit');
          });
          console.log('\n%cUsage:', 'font-weight: bold; color: #ff9900;');
          console.log('  window.lcards.debug.msd.help("namespace") - Show methods in a namespace');
          console.log('  window.lcards.debug.msd.usage("namespace") - Show usage examples');
          console.log('\n%cExample:', 'font-weight: bold; color: #ff9900;');
          console.log('  msd.help("perf")  // Show performance methods');
          return;
        }

        const ns = namespaces[topic];
        if (!ns) {
          console.error(`Unknown namespace: "${topic}". Available: ${Object.keys(namespaces).join(', ')}`);
          return;
        }

        console.log(`%c ${topic} Namespace `, 'background: #ff9900; color: #000; font-weight: bold; padding: 4px 8px;');
        console.log(`\n${ns.desc}\n`);
        console.log('%cMethods:', 'font-weight: bold; color: #ff9900;');
        ns.methods.forEach(method => {
          console.log(`  msd.${topic}.${method}`);
        });
        console.log(`\n%cFor examples:%c msd.usage("${topic}")`, 'font-weight: bold; color: #ff9900', 'color: inherit');
      },

      /**
       * Show usage examples for API methods
       *
       * @param {string} [namespace] - Optional namespace to show examples for
       *
       * @example
       * // Show examples for all namespaces
       * window.lcards.debug.msd.usage();
       *
       * // Show examples for specific namespace
       * window.lcards.debug.msd.usage('perf');
       */
      usage(namespace) {
        const examples = {
          core: [
            '// Get complete core singleton debug info',
            'const coreDebug = msd.core();',
            'console.log("Systems:", coreDebug.systemsManager);',
            '',
            '// Inspect specific singleton manager',
            'const dsm = msd.singleton("dataSourceManager");',
            'console.log("Data sources:", dsm);',
            '',
            '// List all available singleton managers',
            'const managers = msd.singletons();',
            'console.log("Available:", managers.managers);',
            '',
            '// Direct console access (alternative)',
            'window.lcards.core.getDebugInfo();',
            'window.lcards.debug.singletons.systemsManager.getDebugInfo();'
          ],
          perf: [
            '// Get performance summary',
            'const perf = msd.perf.summary();',
            'console.log("Render time:", perf.total_render_time_ms, "ms");',
            '',
            '// Find slowest overlays',
            'const slow = msd.perf.slowestOverlays(5);',
            'slow.forEach(o => console.log(o.overlay_id, o.duration_ms + "ms"));'
          ],
          routing: [
            '// Inspect routing for a GUID',
            'msd.routing.inspect("my-button-guid");',
            '',
            '// Trace full resolution path',
            'msd.routing.trace("my-button-guid");',
            '',
            '// List all active routes',
            'msd.routing.listActive();'
          ],
          data: [
            '// View data context',
            'const ctx = msd.data.context();',
            'console.log("Entities:", ctx.entities);',
            '',
            '// Inspect specific entity',
            'msd.data.inspect("sensor.temperature");',
            '',
            '// Refresh data sources',
            'msd.data.refresh();'
          ],
          styles: [
            '// Get computed styles for GUID',
            'const styles = msd.styles.computed("my-button-guid");',
            '',
            '// Check style inheritance chain',
            'msd.styles.inheritance("my-button-guid");',
            '',
            '// Validate style configuration',
            'msd.styles.validate("my-button-guid");'
          ],
          charts: [
            '// Inspect chart data processing',
            'msd.charts.inspect("my-chart-guid");',
            '',
            '// Trace data transformation',
            'msd.charts.trace("my-chart-guid");',
            '',
            '// Validate chart configuration',
            'msd.charts.validate("my-chart-guid");'
          ],
          rules: [
            '// List all active rules',
            'msd.rules.listActive();',
            '',
            '// List with disabled rules included',
            'msd.rules.listActive({ includeDisabled: true });',
            '',
            '// Evaluate rules for current context',
            'msd.rules.evaluate();'
          ],
          animations: [
            '// List all animations',
            'const anims = msd.animations.list();',
            '',
            '// Inspect specific animation',
            'msd.animations.inspect("fade-in-1");',
            '',
            '// Control animation playback',
            'msd.animations.control("fade-in-1", "pause");',
            'msd.animations.control("fade-in-1", "play");'
          ],
          packs: [
            '// List all packs',
            'const packs = msd.packs.list();',
            '',
            '// Inspect specific pack',
            'msd.packs.inspect("my-pack-id");',
            '',
            '// Validate pack configuration',
            'msd.packs.validate();'
          ],
          visual: [
            '// Toggle HUD display',
            'msd.visual.hud();',
            '',
            '// Highlight element by GUID',
            'msd.visual.highlight("my-button-guid");',
            '',
            '// Take visual snapshot',
            'const snapshot = msd.visual.snapshot();',
            '',
            '// Toggle debug borders',
            'msd.visual.toggleBorders();'
          ],
          overlays: [
            '// List all overlays',
            'const all = msd.overlays.list();',
            '',
            '// Filter overlays by tag',
            'const buttons = msd.overlays.list({ tags: ["button"] });',
            '',
            '// Bulk update matching overlays',
            'msd.overlays.bulkUpdate({ tags: ["button"] }, { label_color: "#ff9900" });',
            '',
            '// Bulk apply tags',
            'msd.overlays.bulkApplyTags({ row: 1 }, ["top-row"]);'
          ],
          pipeline: [
            '// Get pipeline status',
            'const status = msd.pipeline.status();',
            'console.log("State:", status.state);',
            '',
            '// View lifecycle state',
            'msd.pipeline.lifecycle();',
            '',
            '// Re-run pipeline',
            'msd.pipeline.rerun();'
          ]
        };

        if (!namespace) {
          console.log('%c LCARdS Debug API Usage Examples ', 'background: #ff9900; color: #000; font-weight: bold; padding: 4px 8px;');
          console.log('\n%cQuick Start:', 'font-weight: bold; color: #ff9900;');
          console.log('  const msd = window.lcards.debug.msd;  // Shorthand');
          console.log('  msd.help();                             // List all namespaces');
          console.log('  msd.help("perf");                       // Show perf methods');
          console.log('  msd.usage("perf");                      // Show perf examples');
          console.log('\n%cAvailable namespaces:', 'font-weight: bold; color: #ff9900;');
          console.log('  ' + Object.keys(examples).join(', '));
          console.log('\n%cTip:%c Use msd.usage("namespace") for specific examples', 'font-weight: bold; color: #ff9900', 'color: inherit');
          return;
        }

        const ex = examples[namespace];
        if (!ex) {
          console.error(`Unknown namespace: "${namespace}". Available: ${Object.keys(examples).join(', ')}`);
          return;
        }

        console.log(`%c ${namespace} Usage Examples `, 'background: #ff9900; color: #000; font-weight: bold; padding: 4px 8px;');
        console.log('\n' + ex.join('\n'));
        console.log(`\n%cFor method details:%c msd.help("${namespace}")`, 'font-weight: bold; color: #ff9900', 'color: inherit');
      },

      // ==========================================
      // PERFORMANCE INTROSPECTION
      // ==========================================

      perf: {
        /**
         * Get comprehensive performance summary from last render
         *
         * Returns detailed breakdown of render stages, overlay timings,
         * and performance metrics.
         *
         * @returns {Object|null} Performance summary with stage breakdowns
         *
         * @example
         * const perf = window.lcards.debug.msd.perf.summary();
         * console.log('Total render time:', perf.total_render_time_ms, 'ms');
         * console.log('Overlays:', perf.overlay_count);
         * console.log('Slowest:', perf.slowest_overlays);
         */
        summary(cardId = null) {
          try {
            const coordinator = _getMsdCoordinator(cardId);
            if (!coordinator?.renderer) {
              lcardsLog.warn('[DebugAPI] Performance summary not available - no renderer');
              return null;
            }

            // Access AdvancedRenderer's private performance method
            return coordinator.renderer._getPerformanceSummary();
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error getting performance summary:', error);
            return null;
          }
        },

        /**
         * Get slowest overlays from last render
         *
         * Returns the N slowest rendering overlays with timing details.
         *
         * @param {number} [n=5] - Number of slowest overlays to return
         * @returns {Array|null} Array of slowest overlay performance data
         *
         * @example
         * const slowest = window.lcards.debug.msd.perf.slowestOverlays(10);
         * slowest.forEach(ov => {
         *   console.log(`${ov.overlay_id}: ${ov.duration_ms}ms`);
         * });
         */
        slowestOverlays(n = 5, cardId = null) {
          try {
            const coordinator = _getMsdCoordinator(cardId);
            if (!coordinator?.renderer || typeof coordinator.renderer.getSlowestOverlays !== 'function') {
              lcardsLog.warn('[DebugAPI] Slowest overlays not available');
              return null;
            }

            return coordinator.renderer.getSlowestOverlays(n);
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error getting slowest overlays:', error);
            return null;
          }
        },

        /**
         * Get performance breakdown by renderer/overlay type
         *
         * Groups performance data by overlay type (text, button, status_grid, etc.)
         * showing count, total time, average time per type.
         *
         * @returns {Object|null} Performance data grouped by type
         *
         * @example
         * const byType = window.lcards.debug.msd.perf.byRenderer();
         * console.log('Status grids:', byType.status_grid);
         * console.log('Text overlays:', byType.text);
         */
        byRenderer(cardId = null) {
          try {
            const coordinator = _getMsdCoordinator(cardId);
            if (!coordinator?.renderer) {
              lcardsLog.warn('[DebugAPI] Renderer performance not available');
              return null;
            }

            // Get performance summary and group by overlay type
            const summary = coordinator.renderer._getPerformanceSummary();
            if (!summary || !summary.overlay_timings) {
              return null;
            }

            const byType = {};
            summary.overlay_timings.forEach(overlay => {
              const type = overlay.type || 'unknown';
              if (!byType[type]) {
                byType[type] = {
                  count: 0,
                  total_ms: 0,
                  avg_ms: 0,
                  overlays: []
                };
              }
              byType[type].count++;
              byType[type].total_ms += overlay.duration_ms;
              byType[type].overlays.push(overlay.overlay_id);
            });

            // Calculate averages
            Object.values(byType).forEach(typeData => {
              typeData.avg_ms = typeData.count > 0 ? typeData.total_ms / typeData.count : 0;
            });

            return byType;
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error getting renderer performance:', error);
            return null;
          }
        },

        /**
         * Get performance data for a specific overlay
         *
         * Returns detailed timing information for a single overlay.
         *
         * @param {string} overlayId - Overlay ID to get performance for
         * @returns {Object|null} Performance data for the overlay
         *
         * @example
         * const perf = window.lcards.debug.msd.perf.byOverlay('title_overlay');
         * console.log('Duration:', perf.duration_ms, 'ms');
         * console.log('Percentage:', perf.percentage_of_total, '%');
         */
        byOverlay(overlayId, cardId = null) {
          try {
            const coordinator = _getMsdCoordinator(cardId);
            if (!coordinator?.renderer || typeof coordinator.renderer.getOverlayPerformance !== 'function') {
              lcardsLog.warn('[DebugAPI] Overlay performance not available');
              return null;
            }

            return coordinator.renderer.getOverlayPerformance(overlayId);
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error getting overlay performance:', error);
            return null;
          }
        },

        /**
         * Get performance warnings for slow overlays
         *
         * Identifies overlays that are rendering slower than recommended
         * thresholds and provides warnings.
         *
         * @returns {Object|null} Performance warnings with details
         *
         * @example
         * const warnings = window.lcards.debug.msd.perf.warnings();
         * if (warnings.has_warnings) {
         *   console.log('Warnings:', warnings.count);
         *   warnings.warnings.forEach(w => console.warn(w.message));
         * }
         */
        warnings() {
          try {
            const dbg = window.lcards.debug.msd;
            if (!dbg || typeof dbg.getPerformanceWarnings !== 'function') {
              lcardsLog.warn('[DebugAPI] Performance warnings not available');
              return null;
            }

            return dbg.getPerformanceWarnings();
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error getting performance warnings:', error);
            return null;
          }
        },

        /**
         * Get render timeline (stage-by-stage breakdown)
         *
         * Returns timing breakdown for each render stage:
         * preparation, overlay rendering, DOM injection, action attachment.
         *
         * @returns {Object|null} Timeline of render stages
         *
         * @example
         * const timeline = window.lcards.debug.msd.perf.timeline();
         * console.log('Stages:', timeline.stages);
         */
        timeline() {
          try {
            const dbg = window.lcards.debug.msd;
            if (!dbg || typeof dbg.getRenderTimeline !== 'function') {
              lcardsLog.warn('[DebugAPI] Render timeline not available');
              return null;
            }

            return dbg.getRenderTimeline();
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error getting render timeline:', error);
            return null;
          }
        },

        /**
         * Compare performance between renders (placeholder)
         *
         * @param {string} [baseline] - Baseline render identifier
         * @returns {Object} NOT_IMPLEMENTED response
         *
         * @example
         * const comparison = window.lcards.debug.msd.perf.compare();
         */
        compare(baseline) {
          lcardsLog.warn('[DebugAPI] perf.compare() not yet implemented - planned for Phase 5');
          lcardsLog.info('[DebugAPI] This will enable A/B performance comparison between configs');
          return {
            error: 'NOT_IMPLEMENTED',
            message: 'Feature planned for Phase 5',
            plannedFeatures: [
              'Compare render times between two configs',
              'Identify performance regressions',
              'A/B test optimization changes'
            ]
          };
        }
      },

      /**
       * Legacy performance getter for backward compatibility with HUD panels
       *
       * Provides a simplified performance object that wraps perf.summary()
       * for use by HUD PerformancePanel and other legacy code.
       *
       * @returns {Object} Performance data with timers and counters
       *
       * @example
       * const perf = window.lcards.debug.msd.getPerf();
       * console.log('Timers:', perf.timers);
       */
      getPerf() {
        try {
          const summary = this.perf.summary();
          if (!summary) {
            return { timers: {}, counters: {} };
          }

          // Convert summary format to legacy format
          const timers = {};
          const counters = {};

          // Map relevant summary data to timers/counters
          if (summary.total_render_time_ms !== undefined) {
            timers['total_render'] = {
              total: summary.total_render_time_ms,
              count: 1,
              max: summary.total_render_time_ms
            };
          }

          if (summary.overlay_count !== undefined) {
            counters['overlay_count'] = summary.overlay_count;
          }

          return { timers, counters };
        } catch (error) {
          lcardsLog.error('[DebugAPI] Error in getPerf():', error);
          return { timers: {}, counters: {} };
        }
      },

      // ==========================================
      // ROUTING INTROSPECTION
      // ==========================================

      routing: {
        /**
         * Inspect routing resolution for an overlay
         *
         * Returns detailed routing path resolution showing how data flows
         * from entities to the overlay.
         *
         * @param {string} overlayId - Overlay ID to inspect
         * @param {string|null} [cardId=null] - Config ID for target MSD card (e.g. 'bridge')
         * @returns {Object|null} Routing info or null if not found
         *
         * @example
         * // Single card (default)
         * window.lcards.debug.msd.routing.inspect('status-line')
         *
         * @example
         * // Multiple cards - target specific card by config ID
         * window.lcards.debug.msd.routing.inspect('status-line', 'bridge')
         */
        inspect(overlayId, cardId = null) {
          try {
            // Get MSD card via SystemsManager (modern multi-instance pattern)
            const pipeline = _getMsdPipeline(cardId);
            if (!pipeline) {
              lcardsLog.warn('[MsdDebugAPI] No MSD card found or pipeline not ready');
              return null;
            }

            // Access routing inspect method
            if (typeof pipeline.routingInspect === 'function') {
              return pipeline.routingInspect(overlayId);
            }

            lcardsLog.warn('[MsdDebugAPI] routingInspect method not available');
            return null;
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error inspecting routing:', error);
            return null;
          }
        },

        /**
         * Get routing statistics
         *
         * Returns cache hits, paths computed, invalidations, and other
         * routing performance metrics.
         *
         * @param {string|null} [cardId=null] - Config ID for target MSD card (e.g. 'bridge')
         * @returns {Object|null} Performance metrics or null if router unavailable
         *
         * @example
         * // Single card
         * window.lcards.debug.msd.routing.stats()
         *
         * @example
         * // Multiple cards - compare metrics
         * const bridge = window.lcards.debug.msd.routing.stats('bridge')
         * const eng = window.lcards.debug.msd.routing.stats('engineering')
         * console.table([bridge, eng])
         */
        stats(cardId = null) {
          try {
            const coordinator = _getMsdCoordinator(cardId);
            if (!coordinator?.router) {
              lcardsLog.warn('[MsdDebugAPI] No MSD router found');
              return null;
            }

            if (typeof coordinator.router.stats === 'function') {
              return coordinator.router.stats();
            }

            return { cacheHits: 0, pathsComputed: 0, invalidations: 0, error: 'stats method not available' };
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error getting routing stats:', error);
            return null;
          }
        },

        /**
         * Invalidate routing cache
         *
         * Forces recomputation of routing paths. Use '*' to invalidate all,
         * or provide specific overlay ID to invalidate just that overlay.
         *
         * @param {string} [id='*'] - Overlay ID or '*' for all
         * @param {string|null} [cardId=null] - Config ID for MSD card (e.g. 'bridge')
         * @returns {boolean} Success status
         *
         * @example
         * // Invalidate all routing
         * msd.routing.invalidate();
         *
         * // Invalidate specific overlay on specific card
         * msd.routing.invalidate('button_1', 'bridge');
         */
        invalidate(id = '*', cardId = null) {
          try {
            const coordinator = _getMsdCoordinator(cardId);
            if (!coordinator?.router) {
              lcardsLog.warn('[MsdDebugAPI] No MSD router found');
              return false;
            }

            if (typeof coordinator.router.invalidate === 'function') {
              coordinator.router.invalidate(id);
              lcardsLog.debug(`[DebugAPI] Invalidated routing cache: ${id}`);
              return true;
            }

            lcardsLog.warn('[MsdDebugAPI] Router invalidate method not available');
            return false;
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error invalidating routing:', error);
            return false;
          }
        },

        /**
         * Inspect overlay routing with different mode
         *
         * Temporarily changes the route_mode_full for an overlay and
         * inspects how it would be routed. Restores original mode after.
         *
         * @param {string} overlayId - Overlay ID to inspect
         * @param {string} [mode='smart'] - Route mode to test ('smart', 'full', 'minimal')
         * @param {string|null} [cardId=null] - Config ID for MSD card (e.g. 'bridge')
         * @returns {Object|null} Routing inspection with tested mode
         *
         * @example
         * const routing = msd.routing.inspectAs('button_1', 'full', 'bridge');
         * console.log('Full mode routing:', routing);
         */
        inspectAs(overlayId, mode = 'smart', cardId = null) {
          try {
            const pipeline = _getMsdPipeline(cardId);
            if (!pipeline) {
              lcardsLog.warn('[MsdDebugAPI] No MSD card found or pipeline not ready');
              return null;
            }

            // Try to get the model and manipulate routing mode
            const model = typeof pipeline.getResolvedModel === 'function' ? pipeline.getResolvedModel() : null;
            if (!model) {
              lcardsLog.warn('[MsdDebugAPI] Could not get resolved model');
              return null;
            }

            const ov = model.overlays.find(o => o.id === overlayId);
            if (!ov) {
              lcardsLog.warn('[MsdDebugAPI] Overlay not found:', overlayId);
              return null;
            }

            // Temporarily change routing mode and inspect
            ov._raw = ov._raw || {};
            const original = ov._raw.route_mode_full;
            ov._raw.route_mode_full = mode;

            const coordinator = _getMsdCoordinator(cardId);
            if (coordinator?.router?.invalidate) {
              coordinator.router.invalidate('*');
            }

            const result = this.inspect(overlayId, cardId);

            // Restore original
            ov._raw.route_mode_full = original;
            if (coordinator?.router?.invalidate) {
              coordinator.router.invalidate('*');
            }

            return result;
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error in inspectAs:', error);
            return null;
          }
        },

        /**
         * Visualize routing paths (future enhancement)
         *
         * Will render visual representation of data flow paths.
         *
         * @param {string} [overlayId] - Overlay to visualize, or all if omitted
         * @returns {Object} NOT_IMPLEMENTED response
         *
         * @example
         * const viz = window.lcards.debug.msd.routing.visualize('button_1');
         */
        visualize(overlayId) {
          lcardsLog.warn('[DebugAPI] routing.visualize() not yet implemented - planned for Phase 5');
          lcardsLog.info('[DebugAPI] This will draw routing paths directly on the MSD');
          return {
            error: 'NOT_IMPLEMENTED',
            message: 'Feature planned for Phase 5',
            plannedFeatures: [
              'Visual overlay of routing paths on MSD',
              'Interactive path exploration',
              'Highlight data flow bottlenecks'
            ]
          };
        }
      },

      // ==========================================
      // DATA SOURCE INTROSPECTION
      // ==========================================

      data: {
        /**
         * Get data source statistics
         *
         * Returns statistics for all data sources including entity counts,
         * cache hits, updates, and source-specific metrics.
         *
         * @returns {Object|null} Data source statistics
         *
         * @example
         * const stats = window.lcards.debug.msd.data.stats();
         * console.log('Sources:', stats.sources);
         * console.log('Total entities:', stats.totalEntities);
         */
        stats() {
          try {
            const dbg = window.lcards.debug.msd;
            if (!dbg?.dataSources?.stats) {
              lcardsLog.warn('[DebugAPI] Data source stats not available');
              return null;
            }

            return dbg.dataSources.stats();
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error getting data stats:', error);
            return null;
          }
        },

        /**
         * List all data source names
         *
         * Returns array of data source names (e.g., 'hass', 'manual', 'computed').
         *
         * @returns {Array<string>} Array of data source names
         *
         * @example
         * const sources = window.lcards.debug.msd.data.list();
         * console.log('Available sources:', sources);
         */
        list() {
          try {
            const dbg = window.lcards.debug.msd;
            if (!dbg?.dataSources?.list) {
              lcardsLog.warn('[DebugAPI] Data source list not available');
              return [];
            }

            return dbg.dataSources.list();
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error listing data sources:', error);
            return [];
          }
        },

        /**
         * Get data source details by name
         *
         * Returns statistics and details for a specific data source.
         *
         * @param {string} sourceName - Data source name
         * @returns {Object|null} Data source details
         *
         * @example
         * const hass = window.lcards.debug.msd.data.get('hass');
         * console.log('HASS entities:', hass.entityCount);
         */
        get(sourceName) {
          try {
            const dbg = window.lcards.debug.msd;
            if (!dbg?.dataSources?.get) {
              lcardsLog.warn('[DebugAPI] Data source get not available');
              return null;
            }

            return dbg.dataSources.get(sourceName);
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error getting data source:', error);
            return null;
          }
        },

        /**
         * Dump all data source information
         *
         * Returns comprehensive dump of all data sources with full details.
         *
         * @returns {Object|null} Complete data source dump
         *
         * @example
         * const dump = window.lcards.debug.msd.data.dump();
         * console.log('Full data dump:', dump);
         */
        dump() {
          try {
            const dbg = window.lcards.debug.msd;
            if (!dbg?.dataSources?.dump) {
              lcardsLog.warn('[DebugAPI] Data source dump not available');
              return null;
            }

            return dbg.dataSources.dump();
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error dumping data sources:', error);
            return null;
          }
        },

        /**
         * Trace entity usage across overlays
         *
         * Shows which overlays reference a specific entity and how.
         *
         * @param {string} entityId - Entity ID to trace
         * @returns {Object|null} Entity trace data
         *
         * @example
         * const trace = window.lcards.debug.msd.data.trace('sensor.temperature');
         * console.log('Used by overlays:', trace.overlays);
         */
        trace(entityId, cardId = null) {
          try {
            const coordinator = _getMsdCoordinator(cardId);
            const dataManager = coordinator?.dataSourceManager;

            if (!dataManager) {
              lcardsLog.warn('[DebugAPI] DataSourceManager not available');
              return null;
            }

            // Get entity data
            const entity = dataManager.getEntity(entityId);
            if (!entity) {
              return { entityId, found: false, message: 'Entity not found' };
            }

            // Find overlays using this entity
            const model = _getMsdModel(cardId);
            const overlays = model?.overlays.filter(ov => {
              const route = ov.route || ov._raw?.route;
              return route && JSON.stringify(route).includes(entityId);
            }) || [];

            return {
              entityId,
              found: true,
              entity,
              usedByOverlays: overlays.map(ov => ({
                id: ov.id,
                type: ov.type,
                route: ov.route || ov._raw?.route
              }))
            };
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error tracing entity:', error);
            return null;
          }
        },

        /**
         * Get entity state history
         *
         * Returns recent state changes for an entity (if available).
         *
         * @param {string} entityId - Entity ID
         * @param {number} [n=10] - Number of history entries
         * @returns {Object} NOT_IMPLEMENTED response
         *
         * @example
         * const history = window.lcards.debug.msd.data.history('sensor.temp', 5);
         */
        history(entityId, n = 10) {
          lcardsLog.warn('[DebugAPI] data.history() not yet implemented - planned for Phase 5');
          lcardsLog.info('[DebugAPI] This will show historical entity state changes');
          return {
            error: 'NOT_IMPLEMENTED',
            message: 'Feature planned for Phase 5',
            plannedFeatures: [
              'Track entity state history locally',
              'Integration with HA history API',
              'Show state change timeline'
            ],
            suggestion: 'Use Home Assistant history panel or logbook for now'
          };
        }
      },

      // ==========================================
      // STYLE INTROSPECTION
      // ==========================================

      styles: {
        /**
         * Get style resolution details for an overlay
         *
         * Shows how each style property was resolved (from theme tokens,
         * overlays, defaults, etc.) with full provenance.
         *
         * @param {string} overlayId - Overlay ID
         * @returns {Object|null} Style resolution data
         *
         * @example
         * const styles = window.lcards.debug.msd.styles.resolutions('button_1');
         * console.log('Total properties:', styles.total);
         * console.log('By source:', styles.by_source);
         */
        resolutions(overlayId) {
          try {
            const dbg = window.lcards.debug.msd;
            if (!dbg?.getStyleResolutions) {
              lcardsLog.warn('[DebugAPI] Style resolutions not available');
              return null;
            }

            return dbg.getStyleResolutions(overlayId);
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error getting style resolutions:', error);
            return null;
          }
        },

        /**
         * Find overlays using a specific theme token
         *
         * Searches all overlays to find which ones reference a given
         * theme token path.
         *
         * @param {string} tokenPath - Token path (e.g., 'colors.primary')
         * @returns {Array|null} Overlays using this token
         *
         * @example
         * const overlays = window.lcards.debug.msd.styles.findByToken('colors.primary');
         * overlays.forEach(ov => console.log(ov.overlayId, ov.properties));
         */
        findByToken(tokenPath) {
          try {
            const dbg = window.lcards.debug.msd;
            if (!dbg?.findOverlaysByToken) {
              lcardsLog.warn('[DebugAPI] findOverlaysByToken not available');
              return null;
            }

            return dbg.findOverlaysByToken(tokenPath);
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error finding overlays by token:', error);
            return null;
          }
        },

        /**
         * Get global style resolution summary
         *
         * Returns aggregate statistics across all overlays showing
         * resolution sources, renderer breakdown, and overlay type analysis.
         *
         * @returns {Object|null} Global style summary
         *
         * @example
         * const summary = window.lcards.debug.msd.styles.provenance();
         * console.log('Total overlays:', summary.total_overlays);
         * console.log('By source:', summary.by_source);
         */
        provenance() {
          try {
            const dbg = window.lcards.debug.msd;
            if (!dbg?.getGlobalStyleSummary) {
              lcardsLog.warn('[DebugAPI] Global style summary not available');
              return null;
            }

            return dbg.getGlobalStyleSummary();
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error getting style provenance:', error);
            return null;
          }
        },

        /**
         * List all theme tokens (future enhancement)
         *
         * Will return all available theme tokens with their paths.
         *
         * @returns {Array|null} Theme tokens
         *
         * @example
         * const tokens = window.lcards.debug.msd.styles.listTokens();
         */
        listTokens() {
          try {
            const theme = window.lcards?.core?.themeManager ?? window.lcards?.theme;
            if (!theme) {
              lcardsLog.warn('[DebugAPI] Theme manager not available');
              return null;
            }

            // Get active theme and extract token paths
            const activeTheme = theme.getActiveTheme?.();
            if (!activeTheme) return null;

            // Recursively collect token paths
            const collectPaths = (obj, prefix = '') => {
              const paths = [];
              for (const [key, value] of Object.entries(obj)) {
                const path = prefix ? `${prefix}.${key}` : key;
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                  paths.push(...collectPaths(value, path));
                } else {
                  paths.push({ path, value });
                }
              }
              return paths;
            };

            return collectPaths(activeTheme);
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error listing tokens:', error);
            return null;
          }
        },

        /**
         * Get resolved value for a theme token
         *
         * Returns the current resolved value for a token path.
         *
         * @param {string} tokenPath - Token path (e.g., 'colors.primary')
         * @returns {*} Token value
         *
         * @example
         * const color = window.lcards.debug.msd.styles.getTokenValue('colors.primary');
         */
        getTokenValue(tokenPath) {
          try {
            const theme = window.lcards?.core?.themeManager ?? window.lcards?.theme;
            if (!theme) {
              lcardsLog.warn('[DebugAPI] Theme manager not available');
              return null;
            }

            const activeTheme = theme.getActiveTheme?.();
            if (!activeTheme) return null;

            // Navigate token path
            const parts = tokenPath.split('.');
            let value = activeTheme;
            for (const part of parts) {
              if (value && typeof value === 'object') {
                value = value[part];
              } else {
                return null;
              }
            }

            return value;
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error getting token value:', error);
            return null;
          }
        }
      },

      // ==========================================
      // CHART VALIDATION
      // ==========================================

      charts: {
        /**
         * Validate a specific chart overlay
         *
         * Validates ApexChart data format, series structure, and
         * data source compatibility.
         *
         * @param {string} overlayId - Chart overlay ID
         * @returns {Object|null} Validation result with errors/warnings
         *
         * @example
         * const result = window.lcards.debug.msd.charts.validate('chart_1');
         * if (!result.valid) {
         *   result.errors.forEach(err => console.error(err.message));
         * }
         */
        validate(overlayId) {
          try {
            const dbg = window.lcards.debug.msd;
            if (!dbg?.charts?.validate) {
              lcardsLog.warn('[DebugAPI] Chart validation not available');
              return null;
            }

            return dbg.charts.validate(overlayId);
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error validating chart:', error);
            return null;
          }
        },

        /**
         * Validate all chart overlays
         *
         * Runs validation on all ApexChart overlays and returns
         * summary of results.
         *
         * @returns {Object|null} Validation summary
         *
         * @example
         * const summary = window.lcards.debug.msd.charts.validateAll();
         * console.log(`Valid: ${summary.validCount}, Invalid: ${summary.invalidCount}`);
         */
        validateAll() {
          try {
            const dbg = window.lcards.debug.msd;
            if (!dbg?.charts?.validateAll) {
              lcardsLog.warn('[DebugAPI] Chart validateAll not available');
              return null;
            }

            return dbg.charts.validateAll();
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error validating all charts:', error);
            return null;
          }
        },

        /**
         * Get format specification for chart type
         *
         * Returns expected data format and structure requirements
         * for a specific chart type.
         *
         * @param {string} chartType - Chart type (e.g., 'line', 'area', 'bar')
         * @returns {Object|null} Format specification
         *
         * @example
         * const spec = window.lcards.debug.msd.charts.getFormatSpec('line');
         */
        getFormatSpec(chartType) {
          try {
            const dbg = window.lcards.debug.msd;
            if (!dbg?.charts?.getFormatSpec) {
              lcardsLog.warn('[DebugAPI] Chart getFormatSpec not available');
              return null;
            }

            return dbg.charts.getFormatSpec(chartType);
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error getting format spec:', error);
            return null;
          }
        },

        /**
         * List supported chart types
         *
         * Returns array of supported ApexChart types.
         *
         * @returns {Array<string>} Chart types
         *
         * @example
         * const types = window.lcards.debug.msd.charts.listTypes();
         */
        listTypes() {
          try {
            const dbg = window.lcards.debug.msd;
            if (!dbg?.charts?.listTypes) {
              // Return known types as fallback
              return ['line', 'area', 'bar', 'scatter', 'heatmap', 'candlestick',
                      'boxplot', 'radar', 'radialBar', 'pie', 'donut', 'polarArea'];
            }

            return dbg.charts.listTypes();
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error listing chart types:', error);
            return [];
          }
        }
      },

      // ==========================================
      // RULES ENGINE
      // ==========================================

      rules: {
        /**
         * Get rules execution trace
         *
         * Returns trace of rules evaluation showing which rules fired,
         * conditions checked, and actions taken.
         *
         * @returns {Object|null} Rules trace data
         *
         * @example
         * const trace = window.lcards.debug.msd.rules.trace();
         * console.log('Rules evaluated:', trace.evaluated);
         * console.log('Rules fired:', trace.fired);
         */
        trace() {
          try {
            const dbg = window.lcards.debug.msd;
            if (!dbg?.rules?.trace) {
              lcardsLog.warn('[DebugAPI] Rules trace not available');
              return null;
            }

            return dbg.rules.trace();
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error getting rules trace:', error);
            return null;
          }
        },

        /**
         * Evaluate specific rule (future enhancement)
         *
         * Test a rule against current state.
         *
         * @param {string} ruleId - Rule ID
         * @returns {Object} NOT_IMPLEMENTED response
         *
         * @example
         * const result = window.lcards.debug.msd.rules.evaluate('rule_1');
         */
        evaluate(ruleId) {
          lcardsLog.warn('[DebugAPI] rules.evaluate() not yet implemented - planned for Phase 5');
          lcardsLog.info('[DebugAPI] This will test rule evaluation against current state');
          return {
            error: 'NOT_IMPLEMENTED',
            message: 'Feature planned for Phase 5',
            plannedFeatures: [
              'Test rule evaluation in isolation',
              'Preview rule outcomes',
              'Debug rule conditions'
            ]
          };
        },

        /**
         * List active rules
         *
         * Returns currently active/enabled rules with detailed information.
         * Filters out disabled rules and provides rule metadata.
         *
         * @param {Object} options - Filter options
         * @param {boolean} options.includeDisabled - Include disabled rules (default: false)
         * @param {boolean} options.verbose - Include full rule details (default: false)
         * @returns {Array} Active rules
         *
         * @example
         * // Get only enabled rules
         * const active = window.lcards.debug.msd.rules.listActive();
         *
         * // Get all rules including disabled
         * const all = window.lcards.debug.msd.rules.listActive({ includeDisabled: true });
         *
         * // Get detailed rule information
         * const detailed = window.lcards.debug.msd.rules.listActive({ verbose: true });
         */
        listActive(options = {}, cardId = null) {
          try {
            const { includeDisabled = false, verbose = false } = options;
            const config = _getMsdConfig(cardId);
            const rules = config?.rules || [];

            // Filter based on enabled state
            let filteredRules = rules;
            if (!includeDisabled) {
              filteredRules = rules.filter(rule => rule.enabled !== false);
            }

            // Return full details if verbose, otherwise just summaries
            if (verbose) {
              return filteredRules;
            }

            // Return compact summary
            return filteredRules.map(rule => ({
              id: rule.id,
              enabled: rule.enabled !== false,
              conditions: rule.conditions?.length || 0,
              actions: rule.actions?.length || 0,
              description: rule.description || rule.id
            }));
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error listing active rules:', error);
            return [];
          }
        },

        /**
         * Debug specific rule with test state (future enhancement)
         *
         * @param {string} ruleId - Rule ID
         * @param {Object} state - Test state
         * @returns {Object} NOT_IMPLEMENTED response
         *
         * @example
         * const result = window.lcards.debug.msd.rules.debugRule('rule_1', testState);
         */
        debugRule(ruleId, state) {
          lcardsLog.warn('[DebugAPI] rules.debugRule() not yet implemented - planned for Phase 5');
          lcardsLog.info('[DebugAPI] This will enable step-by-step rule debugging with test state');
          return {
            error: 'NOT_IMPLEMENTED',
            message: 'Feature planned for Phase 5',
            plannedFeatures: [
              'Test rules with mock state',
              'Step through rule evaluation',
              'Preview actions without executing'
            ]
          };
        }
      },

      // ==========================================
      // ANIMATIONS
      // ==========================================

      animations: {
        /**
         * Get active animations
         *
         * Returns list of currently running animations across all overlays.
         *
         * @returns {Array} Active animations with overlay, state, and progress info
         *
         * @example
         * const active = window.lcards.debug.msd.animations.active();
         * active.forEach(anim => console.log(anim.overlayId, anim.state, anim.progress));
         */
        active(cardId = null) {
          try {
            const coordinator = _getMsdCoordinator(cardId);
            const animationManager = coordinator?.animationManager;

            if (!animationManager) {
              lcardsLog.warn('[DebugAPI] AnimationManager not available');
              return [];
            }

            return animationManager.getActiveAnimations();
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error getting active animations:', error);
            return [];
          }
        },

        /**
         * Dump all animation definitions
         *
         * Returns complete animation configuration including custom presets,
         * overlay animations, and timelines.
         *
         * @returns {Object} Animation definitions
         *
         * @example
         * const dump = window.lcards.debug.msd.animations.dump();
         * console.log('Custom presets:', dump.customPresets);
         * console.log('Overlay animations:', dump.overlayAnimations);
         * console.log('Timelines:', dump.timelines);
         */
        dump(cardId = null) {
          try {
            const coordinator = _getMsdCoordinator(cardId);
            const animationManager = coordinator?.animationManager;

            if (!animationManager) {
              lcardsLog.warn('[DebugAPI] AnimationManager not available');
              return null;
            }

            return animationManager.getAllAnimationDefinitions();
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error dumping animations:', error);
            return null;
          }
        },

        /**
         * Get AnimationRegistry statistics
         *
         * Returns cache performance metrics, hit rates, and stored animations.
         *
         * @returns {Object} Registry statistics
         *
         * @example
         * const stats = window.lcards.debug.msd.animations.registryStats();
         * console.log('Cache hit rate:', stats.hitRate);
         * console.log('Stored animations:', stats.size);
         */
        registryStats(cardId = null) {
          try {
            const coordinator = _getMsdCoordinator(cardId);
            const registry = coordinator?.animRegistry;

            if (!registry) {
              lcardsLog.warn('[DebugAPI] AnimationRegistry not available');
              return null;
            }

            return registry.getStats();
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error getting registry stats:', error);
            return null;
          }
        },

        /**
         * Inspect overlay animations
         *
         * Returns detailed animation state for a specific overlay including
         * scope info, active animations, and registered triggers.
         *
         * @param {string} overlayId - Overlay identifier
         * @returns {Object|null} Overlay animation state
         *
         * @example
         * const state = window.lcards.debug.msd.animations.inspect('cpu_status');
         * console.log('Scope:', state.scope);
         * console.log('Active animations:', state.activeAnimations);
         * console.log('Triggers:', state.triggers);
         */
        inspect(overlayId, cardId = null) {
          try {
            const coordinator = _getMsdCoordinator(cardId);
            const animationManager = coordinator?.animationManager;

            if (!animationManager) {
              lcardsLog.warn('[DebugAPI] AnimationManager not available');
              return null;
            }

            return animationManager.inspectOverlay(overlayId);
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error inspecting overlay:', error);
            return null;
          }
        },

        /**
         * Get timeline details
         *
         * Returns details for a specific animation timeline.
         *
         * @param {string} timelineId - Timeline ID
         * @returns {Object|null} Timeline details
         *
         * @example
         * const timeline = window.lcards.debug.msd.animations.timeline('startup_sequence');
         */
        timeline(timelineId, cardId = null) {
          try {
            const config = _getMsdConfig(cardId);
            const timelines = config?.timelines || [];
            return timelines.find(tl => tl.id === timelineId) || null;
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error getting timeline:', error);
            return null;
          }
        },

        /**
         * Trigger animation manually
         *
         * Manually trigger an animation for testing.
         *
         * @param {string} overlayId - Overlay identifier
         * @param {string} presetName - Animation preset name
         * @param {Object} [params] - Additional animation parameters
         * @returns {Object} Result object
         *
         * @example
         * window.lcards.debug.msd.animations.trigger('cpu_status', 'pulse', { duration: 500 });
         */
        trigger(overlayId, presetName, params = {}, cardId = null) {
          try {
            const coordinator = _getMsdCoordinator(cardId);
            const animationManager = coordinator?.animationManager;

            if (!animationManager) {
              lcardsLog.warn('[DebugAPI] AnimationManager not available');
              return {
                error: 'NO_ANIMATION_MANAGER',
                message: 'Animation system not initialized'
              };
            }

            const result = animationManager.playAnimation(overlayId, {
              preset: presetName,
              ...params,
              trigger_source: 'debug_api'
            });

            if (result) {
              lcardsLog.debug(`[DebugAPI] Animation triggered: ${overlayId} / ${presetName}`);
              return { success: true, overlayId, preset: presetName, params };
            } else {
              return {
                error: 'ANIMATION_FAILED',
                message: 'Failed to trigger animation',
                overlayId,
                preset: presetName
              };
            }
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error triggering animation:', error);
            return {
              error: 'EXCEPTION',
              message: error.message
            };
          }
        }
      },

      // ==========================================
      // PACKS (Configuration Packs)
      // ==========================================

      packs: {
        /**
         * List packs by type
         *
         * Returns count/list of configuration packs (animations, overlays,
         * rules, profiles, timelines).
         *
         * @param {string} [type] - Pack type or omit for counts
         * @returns {Object|Array} Pack counts or specific pack list
         *
         * @example
         * // Get counts
         * const counts = window.lcards.debug.msd.packs.list();
         * console.log('Overlays:', counts.overlays);
         *
         * // Get specific type
         * const overlays = window.lcards.debug.msd.packs.list('overlays');
         */
        list(type) {
          try {
            const dbg = window.lcards.debug.msd;
            if (!dbg?.packs?.list) {
              lcardsLog.warn('[DebugAPI] Packs list not available');
              return type ? [] : {};
            }

            return dbg.packs.list(type);
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error listing packs:', error);
            return type ? [] : {};
          }
        },

        /**
         * Get specific pack item
         *
         * Returns a specific item from a pack by type and ID.
         *
         * @param {string} type - Pack type (e.g., 'overlays', 'rules')
         * @param {string} id - Item ID
         * @returns {Object|null} Pack item
         *
         * @example
         * const overlay = window.lcards.debug.msd.packs.get('overlays', 'button_1');
         */
        get(type, id) {
          try {
            const dbg = window.lcards.debug.msd;
            if (!dbg?.packs?.get) {
              lcardsLog.warn('[DebugAPI] Packs get not available');
              return null;
            }

            return dbg.packs.get(type, id);
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error getting pack item:', error);
            return null;
          }
        },

        /**
         * Get configuration issues
         *
         * Returns validation issues found in configuration packs.
         *
         * @returns {Array|null} Configuration issues
         *
         * @example
         * const issues = window.lcards.debug.msd.packs.issues();
         * issues.forEach(issue => console.error(issue.message));
         */
        issues() {
          try {
            const dbg = window.lcards.debug.msd;
            if (!dbg?.packs?.issues) {
              lcardsLog.warn('[DebugAPI] Packs issues not available');
              return null;
            }

            return dbg.packs.issues();
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error getting pack issues:', error);
            return null;
          }
        },

        /**
         * Get pack loading order (future enhancement)
         *
         * Returns the order in which packs were loaded/merged.
         *
         * @returns {Object} NOT_IMPLEMENTED response
         *
         * @example
         * const order = window.lcards.debug.msd.packs.order();
         */
        order() {
          lcardsLog.warn('[DebugAPI] packs.order() not yet implemented - planned for Phase 5');
          lcardsLog.info('[DebugAPI] This will show pack merge order and provenance');
          return {
            error: 'NOT_IMPLEMENTED',
            message: 'Feature planned for Phase 5',
            plannedFeatures: [
              'Show pack loading order',
              'Track configuration provenance',
              'Identify override sources'
            ]
          };
        }
      },

      // ==========================================
      // VISUAL DEBUG CONTROLS (Phase 2)
      // ==========================================

      visual: {
        /**
         * Enable visual debug feature
         *
         * Shows visual debug overlays for anchors, bounding boxes, routing,
         * or performance metrics. Use 'all' to enable all features.
         *
         * @param {string} feature - Feature name or 'all'
         * @returns {boolean} Success status
         *
         * @example
         * // Enable bounding boxes
         * window.lcards.debug.msd.visual.enable('bounding_boxes');
         *
         * // Enable all debug visuals
         * window.lcards.debug.msd.visual.enable('all');
         *
         * // Enable specific feature
         * window.lcards.debug.msd.visual.enable('anchors');
         * window.lcards.debug.msd.visual.enable('routing');
         * window.lcards.debug.msd.visual.enable('performance');
         */
        enable(feature) {
          try {
            const dbg = window.lcards.debug.msd;
            if (!dbg?.debug?.enable) {
              lcardsLog.warn('[DebugAPI] Visual debug not available');
              return false;
            }

            dbg.debug.enable(feature);
            lcardsLog.debug(`[DebugAPI] Enabled visual debug: ${feature}`);
            return true;
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error enabling visual debug:', error);
            return false;
          }
        },

        /**
         * Disable visual debug feature
         *
         * Hides visual debug overlays for specified feature or all features.
         *
         * @param {string} feature - Feature name or 'all'
         * @returns {boolean} Success status
         *
         * @example
         * // Disable bounding boxes
         * window.lcards.debug.msd.visual.disable('bounding_boxes');
         *
         * // Disable all debug visuals
         * window.lcards.debug.msd.visual.disable('all');
         */
        disable(feature) {
          try {
            const dbg = window.lcards.debug.msd;
            if (!dbg?.debug?.disable) {
              lcardsLog.warn('[DebugAPI] Visual debug not available');
              return false;
            }

            dbg.debug.disable(feature);
            lcardsLog.debug(`[DebugAPI] Disabled visual debug: ${feature}`);
            return true;
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error disabling visual debug:', error);
            return false;
          }
        },

        /**
         * Toggle visual debug feature on/off
         *
         * Convenient method to toggle a debug feature without checking current state.
         *
         * @param {string} feature - Feature name to toggle
         * @returns {boolean} New state (true = enabled, false = disabled)
         *
         * @example
         * const newState = window.lcards.debug.msd.visual.toggle('bounding_boxes');
         * console.log('Bounding boxes now:', newState ? 'enabled' : 'disabled');
         */
        toggle(feature) {
          try {
            const status = this.status();
            if (!status) return false;

            const isEnabled = status[feature];
            if (isEnabled) {
              this.disable(feature);
              return false;
            } else {
              this.enable(feature);
              return true;
            }
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error toggling visual debug:', error);
            return false;
          }
        },

        /**
         * Get visual debug status
         *
         * Returns current state of all visual debug features.
         *
         * @returns {Object|null} Debug feature status
         *
         * @example
         * const status = window.lcards.debug.msd.visual.status();
         * console.log('Anchors enabled:', status.anchors);
         * console.log('Bounding boxes enabled:', status.bounding_boxes);
         * console.table(status);
         */
        status() {
          try {
            const dbg = window.lcards.debug.msd;
            if (!dbg?.debug?.getStatus) {
              lcardsLog.warn('[DebugAPI] Visual debug status not available');
              return null;
            }

            return dbg.debug.getStatus();
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error getting visual debug status:', error);
            return null;
          }
        },

        /**
         * Get list of active visual debug features
         *
         * Returns array of currently enabled debug feature names.
         *
         * @returns {Array<string>} Active feature names
         *
         * @example
         * const active = window.lcards.debug.msd.visual.getActive();
         * console.log('Active debug features:', active);
         * // ['bounding_boxes', 'anchors']
         */
        getActive() {
          try {
            const status = this.status();
            if (!status) return [];

            return Object.entries(status)
              .filter(([key, value]) => value === true && key !== 'scale')
              .map(([key]) => key);
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error getting active features:', error);
            return [];
          }
        },

        /**
         * Refresh visual debug overlays
         *
         * Forces re-render of debug overlays to reflect current state.
         *
         * @returns {boolean} Success status
         *
         * @example
         * window.lcards.debug.msd.visual.refresh();
         */
        refresh() {
          try {
            const dbg = window.lcards.debug.msd;
            if (!dbg?.debug?.refresh) {
              lcardsLog.warn('[DebugAPI] Visual debug refresh not available');
              return false;
            }

            dbg.debug.refresh();
            return true;
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error refreshing visual debug:', error);
            return false;
          }
        }
      },

      // ==========================================
      // OVERLAY INTROSPECTION (Phase 2)
      // ==========================================

      overlays: {
        /**
         * Inspect overlay details
         *
         * Returns comprehensive overlay information including config,
         * bounding box, type, and validation status.
         *
         * @param {string} overlayId - Overlay ID
         * @returns {Object|null} Overlay details
         *
         * @example
         * const overlay = window.lcards.debug.msd.overlays.inspect('button_1');
         * console.log('Type:', overlay.type);
         * console.log('BBox:', overlay.bbox);
         * console.log('Config:', overlay.config);
         */
        inspect(overlayId, cardId = null) {
          try {
            const pipeline = _getMsdPipeline(cardId);
            if (!pipeline) {
              lcardsLog.warn('[DebugAPI] Pipeline instance not available');
              return null;
            }

            const model = typeof pipeline.getResolvedModel === 'function' ? pipeline.getResolvedModel() : null;
            if (!model) return null;

            const overlay = model.overlays.find(o => o.id === overlayId);
            if (!overlay) return null;

            return {
              id: overlayId,
              type: overlay.type,
              config: overlay,
              position: overlay.position,
              size: overlay.size,
              route: overlay.route,
              visible: overlay.visible !== false
            };
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error inspecting overlay:', error);
            return null;
          }
        },

        /**
         * Get overlay bounding box
         *
         * Returns position and size from the resolved model.
         *
         * @param {string} overlayId - Overlay ID
         * @returns {Object|null} Bounding box derived from model {x, y, w, h}
         *
         * @example
         * const bbox = window.lcards.debug.msd.overlays.getBBox('button_1');
         * console.log(`Position: (${bbox.x}, ${bbox.y})`);
         * console.log(`Size: ${bbox.w} x ${bbox.h}`);
         */
        getBBox(overlayId, cardId = null) {
          try {
            const pipeline = _getMsdPipeline(cardId);
            if (!pipeline) {
              lcardsLog.warn('[DebugAPI] Pipeline instance not available');
              return null;
            }

            const model = typeof pipeline.getResolvedModel === 'function' ? pipeline.getResolvedModel() : null;
            if (!model) return null;

            const overlay = model.overlays.find(o => o.id === overlayId);
            if (!overlay || !overlay.position || !overlay.size) return null;

            const pos = overlay.position;
            const sz = overlay.size;
            return {
              x: Array.isArray(pos) ? pos[0] : pos?.x ?? null,
              y: Array.isArray(pos) ? pos[1] : pos?.y ?? null,
              w: Array.isArray(sz) ? sz[0] : sz?.w ?? null,
              h: Array.isArray(sz) ? sz[1] : sz?.h ?? null
            };
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error getting bbox:', error);
            return null;
          }
        },

        /**
         * Get overlay transform
         *
         * Returns transform attribute if present (e.g., translate values).
         * Queries the live SVG DOM for the rendered element's transform.
         *
         * @param {string} overlayId - Overlay ID
         * @returns {Object|null} Transform data
         *
         * @example
         * const transform = window.lcards.debug.msd.overlays.getTransform('line_1');
         * if (transform.translate) {
         *   console.log(`Translate: (${transform.translate.x}, ${transform.translate.y})`);
         * }
         */
        getTransform(overlayId, cardId = null) {
          try {
            const coordinator = _getMsdCoordinator(cardId);
            const renderer = coordinator?.renderer;
            const root = renderer?.mountEl;

            if (!root) return null;

            const svg = root.querySelector('svg');
            if (!svg) return null;

            const el = svg.getElementById?.(overlayId) || svg.querySelector(`#${CSS.escape(overlayId)}`);
            if (!el) return null;

            const transform = el.getAttribute('transform');
            if (!transform) return null;

            // Parse transform string
            const result = { raw: transform };

            // Parse translate
            const translateMatch = transform.match(/translate\s*\(\s*([^,\s]+)[\s,]+([^)]+)\)/);
            if (translateMatch) {
              result.translate = {
                x: parseFloat(translateMatch[1]),
                y: parseFloat(translateMatch[2])
              };
            }

            // Parse scale
            const scaleMatch = transform.match(/scale\s*\(\s*([^)]+)\)/);
            if (scaleMatch) {
              const values = scaleMatch[1].split(/[\s,]+/).map(parseFloat);
              result.scale = values.length === 1
                ? { x: values[0], y: values[0] }
                : { x: values[0], y: values[1] };
            }

            // Parse rotate
            const rotateMatch = transform.match(/rotate\s*\(\s*([^)]+)\)/);
            if (rotateMatch) {
              const values = rotateMatch[1].split(/[\s,]+/).map(parseFloat);
              result.rotate = values[0];
              if (values.length === 3) {
                result.rotateCenter = { x: values[1], y: values[2] };
              }
            }

            return result;
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error getting transform:', error);
            return null;
          }
        },

        /**
         * Get overlay state (from data source)
         *
         * Returns current data/state for an overlay.
         *
         * @param {string} overlayId - Overlay ID
         * @returns {*} Overlay state/data
         *
         * @example
         * const state = window.lcards.debug.msd.overlays.getState('temp_display');
         */
        getState(overlayId, cardId = null) {
          try {
            const model = _getMsdModel(cardId);

            if (!model) return null;

            const overlay = model.overlays.find(o => o.id === overlayId);
            if (!overlay) return null;

            // Return the resolved data if available
            return overlay.data || overlay.state || null;
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error getting overlay state:', error);
            return null;
          }
        },

        /**
         * Find overlays by type
         *
         * Returns all overlays matching the specified type.
         *
         * @param {string} type - Overlay type (e.g., 'button', 'text', 'status_grid')
         * @returns {Array} Matching overlays
         *
         * @example
         * const buttons = window.lcards.debug.msd.overlays.findByType('button');
         * console.log('Found buttons:', buttons.length);
         * buttons.forEach(btn => console.log(btn.id));
         */
        findByType(type, cardId = null) {
          try {
            const model = _getMsdModel(cardId);

            if (!model) return [];

            return model.overlays
              .filter(o => o.type === type)
              .map(o => ({
                id: o.id,
                type: o.type,
                position: o.position,
                size: o.size
              }));
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error finding overlays by type:', error);
            return [];
          }
        },

        /**
         * Find overlays using entity
         *
         * Returns all overlays that reference a specific entity ID.
         *
         * @param {string} entityId - Entity ID
         * @returns {Array} Overlays using this entity
         *
         * @example
         * const overlays = window.lcards.debug.msd.overlays.findByEntity('sensor.temperature');
         */
        findByEntity(entityId, cardId = null) {
          try {
            const model = _getMsdModel(cardId);

            if (!model) return [];

            return model.overlays
              .filter(o => {
                const route = o.route || o._raw?.route;
                return route && JSON.stringify(route).includes(entityId);
              })
              .map(o => ({
                id: o.id,
                type: o.type,
                route: o.route
              }));
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error finding overlays by entity:', error);
            return [];
          }
        },

        /**
         * Get overlay tree (hierarchy)
         *
         * Returns overlay structure as hierarchical tree.
         *
         * @returns {Array} Overlay tree
         *
         * @example
         * const tree = window.lcards.debug.msd.overlays.tree();
         */
        tree(cardId = null) {
          try {
            const model = _getMsdModel(cardId);

            if (!model) return [];

            // Group by type for simple tree
            const byType = {};
            model.overlays.forEach(o => {
              if (!byType[o.type]) byType[o.type] = [];
              byType[o.type].push({ id: o.id, type: o.type });
            });

            return Object.entries(byType).map(([type, overlays]) => ({
              type,
              count: overlays.length,
              overlays
            }));
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error getting overlay tree:', error);
            return [];
          }
        },

        /**
         * List all overlays
         *
         * Returns array of all overlays with basic info.
         *
         * @returns {Array} All overlays
         *
         * @example
         * const all = window.lcards.debug.msd.overlays.list();
         * console.log('Total overlays:', all.length);
         */
        list(cardId = null) {
          try {
            const model = _getMsdModel(cardId);

            if (!model) return [];

            return model.overlays.map(o => ({
              id: o.id,
              type: o.type,
              visible: o.visible !== false
            }));
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error listing overlays:', error);
            return [];
          }
        }
      },

      // ==========================================
      // PIPELINE INTROSPECTION (Phase 2)
      // ==========================================

      pipeline: {
        /**
         * Get pipeline stages
         *
         * Returns list of pipeline stages with their status.
         *
         * @returns {Array} Pipeline stages
         *
         * @example
         * const stages = window.lcards.debug.msd.pipeline.stages();
         * stages.forEach(stage => {
         *   console.log(`${stage.name}: ${stage.status}`);
         * });
         */
        stages(cardId = null) {
          try {
            const pipeline = _getMsdPipeline(cardId);
            const coordinator = _getMsdCoordinator(cardId);

            if (!pipeline) return [];

            // Define known pipeline stages
            const stages = [
              { name: 'PipelineCore', status: 'complete', component: pipeline },
              { name: 'SystemsManager', status: 'complete', component: coordinator },
              { name: 'ModelBuilder', status: 'complete', component: coordinator?.modelBuilder },
              { name: 'AdvancedRenderer', status: 'complete', component: pipelineInstance.systemsManager?.renderer }
            ];

            return stages.map(stage => ({
              name: stage.name,
              status: stage.component ? 'initialized' : 'not_initialized',
              hasErrors: false,
              timing: null // Could extract from provenance
            }));
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error getting pipeline stages:', error);
            return [];
          }
        },

        /**
         * Get pipeline timing
         *
         * Returns timing information for pipeline execution.
         *
         * @param {string|null} [cardId=null] - Config ID for target MSD card (e.g. 'bridge')
         * @returns {Object|null} Performance summary or null
         *
         * @example
         * // Single card
         * window.lcards.debug.msd.pipeline.timing()
         *
         * @example
         * // Multiple cards - get all performance data
         * const cards = window.lcards.debug.msd.listMsdCards()
         * const perfData = cards.map(c => ({
         *   id: c.id,
         *   perf: window.lcards.debug.msd.pipeline.timing(c.selector)
         * }))
         * console.table(perfData)
         */
        timing(cardId = null) {
          try {
            const config = _getMsdConfig(cardId);

            if (!config?.__provenance) return null;

            const provenance = config.__provenance;
            const timing = {
              pipeline_core: provenance.pipeline_core,
              systems_manager: provenance.systems_manager,
              model_builder: provenance.model_builder,
              advanced_renderer: provenance.advanced_renderer,
              total_ms: null
            };

            // Calculate total if individual timings exist
            const times = Object.values(timing).filter(t => t?.duration_ms);
            if (times.length > 0) {
              timing.total_ms = times.reduce((sum, t) => sum + (t.duration_ms || 0), 0);
            }

            return timing;
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error getting pipeline timing:', error);
            return null;
          }
        },

        /**
         * Get pipeline configuration
         *
         * Returns merged pipeline configuration.
         *
         * @returns {Object|null} Pipeline config
         *
         * @example
         * const config = window.lcards.debug.msd.pipeline.config();
         * console.log('Anchors:', config.anchors);
         * console.log('ViewBox:', config.viewBox);
         */
        config(cardId = null) {
          try {
            return _getMsdConfig(cardId);
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error getting pipeline config:', error);
            return null;
          }
        },

        /**
         * Get pipeline errors
         *
         * Returns any errors encountered during pipeline execution.
         *
         * @returns {Array} Pipeline errors
         *
         * @example
         * const errors = window.lcards.debug.msd.pipeline.errors();
         * if (errors.length > 0) {
         *   errors.forEach(err => console.error(err.message));
         * }
         */
        errors(cardId = null) {
          try {
            const config = _getMsdConfig(cardId);

            // Check validation errors
            const validation = config?.__validation || {};
            const errors = [];

            if (validation.errors?.length > 0) {
              errors.push(...validation.errors.map(e => ({
                stage: 'validation',
                type: 'validation_error',
                message: e.message || e,
                overlayId: e.overlayId
              })));
            }

            // Check config issues
            const issues = config?.__issues || [];
            if (issues.length > 0) {
              errors.push(...issues.map(i => ({
                stage: 'config',
                type: 'config_issue',
                message: i.message || i
              })));
            }

            return errors;
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error getting pipeline errors:', error);
            return [];
          }
        },

        /**
         * Re-run pipeline (trigger re-render)
         *
         * Forces pipeline to re-execute from current config.
         *
         * @returns {boolean} Success status
         *
         * @example
         * window.lcards.debug.msd.pipeline.rerun();
         */
        rerun(cardId = null) {
          try {
            const pipeline = _getMsdPipeline(cardId);

            if (!pipeline?.reRender) {
              lcardsLog.warn('[DebugAPI] Pipeline rerun not available');
              return false;
            }

            pipelineInstance.reRender();
            lcardsLog.debug('[DebugAPI] Pipeline re-run triggered');
            return true;
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error re-running pipeline:', error);
            return false;
          }
        },

        /**
         * Get pipeline instance
         *
         * Returns raw pipeline instance for advanced debugging.
         *
         * @returns {Object|null} Pipeline instance
         *
         * @example
         * const pipeline = window.lcards.debug.msd.pipeline.getInstance();
         */
        getInstance(cardId = null) {
          try {
            return _getMsdPipeline(cardId);
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error getting pipeline instance:', error);
            return null;
          }
        }
      },

      /**
       * Anchors introspection namespace
       *
       * Provides comprehensive anchor debugging and introspection.
       * Reveals where anchors are stored at each pipeline stage.
       */
      anchors: {
        /**
         * Get all anchors from resolved model
         *
         * Returns the final merged anchor list used for rendering.
         * This is the "source of truth" for overlay positioning.
         *
         * @param {string|null} cardId - Config ID or null for first card
         * @returns {Object} Anchor dictionary { name: [x, y] }
         *
         * @example
         * const anchors = window.lcards.debug.msd.anchors.getAll();
         * console.table(anchors);
         */
        getAll(cardId = null) {
          try {
            const pipeline = _getMsdPipeline(cardId);
            const model = pipeline?.getResolvedModel?.();
            return model?.anchors || {};
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error getting anchors:', error);
            return {};
          }
        },

        /**
         * Get anchor by name
         *
         * @param {string} name - Anchor name
         * @param {string|null} cardId - Config ID or null for first card
         * @returns {Array|null} [x, y] coordinates or null
         *
         * @example
         * const bridge = window.lcards.debug.msd.anchors.get('bridge');
         * console.log('Bridge position:', bridge);
         */
        get(name, cardId = null) {
          const anchors = this.getAll(cardId);
          return anchors[name] || null;
        },

        /**
         * Trace anchor through pipeline stages
         *
         * Shows where anchors are stored and how they flow through:
         * 1. SVG extraction (AnchorProcessor)
         * 2. CoreConfigManager processing
         * 3. ConfigProcessor merging
         * 4. CardModel storage
         * 5. resolvedModel (final)
         *
         * Reveals the architectural issue with anchor splitting.
         *
         * @param {string|null} cardId - Config ID or null for first card
         * @returns {Object} Anchor trace data
         *
         * @example
         * const trace = window.lcards.debug.msd.anchors.trace();
         * console.log('Anchor flow:', trace);
         */
        trace(cardId = null) {
          try {
            const card = _getMsdCard(cardId);
            const pipeline = card?._msdPipeline;
            const coordinator = pipeline?.coordinator;
            const cardModel = coordinator?.cardModel;
            const resolvedModel = pipeline?.getResolvedModel?.();
            const fullConfig = card?._fullConfig;

            const trace = {
              description: 'Anchor data flow through MSD pipeline',
              stages: {
                '1_cardModel': {
                  source: 'CardModel.anchors',
                  count: cardModel?.anchors ? Object.keys(cardModel.anchors).length : 0,
                  anchors: cardModel?.anchors || {},
                  note: 'Anchors from merged config after ConfigProcessor'
                },
                '2_resolvedModel': {
                  source: 'resolvedModel.anchors',
                  count: resolvedModel?.anchors ? Object.keys(resolvedModel.anchors).length : 0,
                  anchors: resolvedModel?.anchors || {},
                  note: 'Final anchors used for rendering (copied from cardModel)'
                },
                '3_fullConfig_toplevel': {
                  source: 'fullConfig.anchors (top-level)',
                  count: fullConfig?.anchors ? Object.keys(fullConfig.anchors).length : 0,
                  anchors: fullConfig?.anchors || {},
                  note: 'Extracted anchors from SVG (placed by CoreConfigManager)'
                },
                '4_fullConfig_nested': {
                  source: 'fullConfig.msd.anchors (nested)',
                  count: fullConfig?.msd?.anchors ? Object.keys(fullConfig.msd.anchors).length : 0,
                  anchors: fullConfig?.msd?.anchors || {},
                  note: 'User-defined anchors from YAML config'
                }
              },
              issue: {
                description: 'CoreConfigManager splits anchors across levels',
                extracted_location: 'fullConfig.anchors (top-level)',
                user_location: 'fullConfig.msd.anchors (nested)',
                fix_location: 'ConfigProcessor merges them after processConfig() returns',
                is_working: resolvedModel?.anchors && Object.keys(resolvedModel.anchors).length > 0
              }
            };

            return trace;
          } catch (error) {
            lcardsLog.error('[DebugAPI] Error tracing anchors:', error);
            return { error: error.message };
          }
        },

        /**
         * List all anchor names with source info
         *
         * Shows which anchors came from SVG vs user config.
         * Requires user to inspect trace() output to determine source.
         *
         * @param {string|null} cardId - Config ID or null for first card
         * @returns {Array} Array of anchor names
         *
         * @example
         * const names = window.lcards.debug.msd.anchors.list();
         * console.log('Available anchors:', names);
         */
        list(cardId = null) {
          const anchors = this.getAll(cardId);
          return Object.keys(anchors).sort();
        },

        /**
         * Print anchor table to console
         *
         * Nice formatted output of all anchors.
         *
         * @param {string|null} cardId - Config ID or null for first card
         *
         * @example
         * window.lcards.debug.msd.anchors.print();
         */
        print(cardId = null) {
          const anchors = this.getAll(cardId);
          const formatted = {};
          Object.entries(anchors).forEach(([name, pos]) => {
            formatted[name] = { x: pos[0], y: pos[1] };
          });
          console.table(formatted);
          console.log(`Total: ${Object.keys(anchors).length} anchors`);
        }
      }
    };
  }
}
