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
 * @returns {any} MSD card element
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
          routing: {
            desc: 'Routing and resolution debugging',
            methods: ['inspect(overlayId, cardId?)', 'stats(cardId?)', 'invalidate(id, cardId?)', 'inspectAs(overlayId, mode, cardId?)']
          },
          data: {
            desc: 'MSD entity data tracing across overlays',
            methods: ['trace(entityId, cardId?)']
          },
          rules: {
            desc: 'MSD card rules inspection',
            methods: ['listActive(options?, cardId?)']
          },
          animations: {
            desc: 'Animation state and playback control',
            methods: ['active(cardId?)', 'dump(cardId?)', 'registryStats(cardId?)', 'inspect(overlayId, cardId?)', 'timeline(id, cardId?)', 'trigger(overlayId, preset, params?, cardId?)']
          },
          overlays: {
            desc: 'Overlay introspection and search',
            methods: ['inspect(id, cardId?)', 'getBBox(id, cardId?)', 'getTransform(id, cardId?)', 'getState(id, cardId?)', 'findByType(type, cardId?)', 'findByEntity(entityId, cardId?)', 'tree(cardId?)', 'list(cardId?)']
          },
          anchors: {
            desc: 'Anchor tracing through MSD pipeline stages',
            methods: ['getAll(cardId?)', 'get(name, cardId?)', 'trace(cardId?)', 'list(cardId?)', 'print(cardId?)']
          },
          pipeline: {
            desc: 'MSD pipeline lifecycle and config inspection',
            methods: ['stages(cardId?)', 'timing(cardId?)', 'config(cardId?)', 'errors(cardId?)', 'rerun(cardId?)', 'getInstance(cardId?)']
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
          routing: [
            '// Inspect routing for an overlay',
            'msd.routing.inspect("my-overlay");',
            '',
            '// Get routing stats',
            'msd.routing.stats();',
            '',
            '// Force routing cache invalidation',
            'msd.routing.invalidate("*");'
          ],
          data: [
            '// Trace entity usage across MSD overlays',
            'msd.data.trace("sensor.temperature");'
          ],
          rules: [
            '// List all active rules in this MSD card',
            'msd.rules.listActive();',
            '',
            '// Include disabled rules',
            'msd.rules.listActive({ includeDisabled: true });',
            '',
            '// Full rule detail',
            'msd.rules.listActive({ verbose: true });'
          ],
          animations: [
            '// List active animations',
            'msd.animations.active();',
            '',
            '// Inspect animation scope for an overlay',
            'msd.animations.inspect("cpu_status");',
            '',
            '// Manually trigger animation',
            'msd.animations.trigger("cpu_status", "pulse");'
          ],
          overlays: [
            '// List all overlays',
            'msd.overlays.list();',
            '',
            '// Find overlays showing a specific entity',
            'msd.overlays.findByEntity("sensor.temperature");',
            '',
            '// Inspect single overlay',
            'msd.overlays.inspect("button_1");'
          ],
          anchors: [
            '// List all anchor names',
            'msd.anchors.list();',
            '',
            '// Print anchor table to console',
            'msd.anchors.print();',
            '',
            '// Trace anchor flow through pipeline',
            'msd.anchors.trace();'
          ],
          pipeline: [
            '// Get pipeline config (merged YAML)',
            'msd.pipeline.config();',
            '',
            '// Get pipeline timing breakdown',
            'msd.pipeline.timing();',
            '',
            '// Force re-render',
            'msd.pipeline.rerun();'
          ]
        };

        if (!namespace) {
          console.log('%c LCARdS Debug API Usage Examples ', 'background: #ff9900; color: #000; font-weight: bold; padding: 4px 8px;');
          console.log('\n%cQuick Start:', 'font-weight: bold; color: #ff9900;');
          console.log('  const msd = window.lcards.debug.msd;  // Shorthand');
          console.log('  msd.help();                             // List all namespaces');
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
      // DATA INTROSPECTION
      // ==========================================

      data: {
        /**
         * Trace entity usage across MSD overlays
         *
         * Shows which MSD overlays reference a specific entity and how they route it.
         *
         * @param {string} entityId - Entity ID to trace
         * @param {string|null} [cardId=null] - Config ID for target MSD card
         * @returns {Object|null} Entity trace data
         *
         * @example
         * window.lcards.debug.msd.data.trace('sensor.temperature')
         * // → { entityId, found, entity, usedByOverlays: [{ id, type, route }] }
         */
        trace(entityId, cardId = null) {
          try {
            const coordinator = _getMsdCoordinator(cardId);
            const dataManager = coordinator?.dataSourceManager;

            if (!dataManager) {
              lcardsLog.warn('[DebugAPI] DataSourceManager not available');
              return null;
            }

            const entity = dataManager.getEntity(entityId);
            if (!entity) {
              return { entityId, found: false, message: 'Entity not found' };
            }

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
        }
      },

      // ==========================================
      // RULES ENGINE
      // ==========================================

      rules: {
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
        listActive(options = /** @type {any} */ ({}), cardId = null) {
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
              { name: 'AdvancedRenderer', status: 'complete', component: coordinator?.renderer }
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

            pipeline.reRender();
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
