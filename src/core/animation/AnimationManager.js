/**
 * AnimationManager - Central orchestrator for the MSD animation system
 *
 * Responsibilities:
 * - Manage animation scopes per overlay
 * - Register and coordinate animations with triggers
 * - Integrate with DataSourceManager for reactive animations
 * - Integrate with RulesEngine for rule-triggered animations
 * - Provide Runtime/Debug API surface
 *
 * Architecture Integration:
 * - Initialized in SystemsManager Phase 5 (after AdvancedRenderer)
 * - Uses existing AnimationRegistry for performance caching
 * - Leverages existing anime.js v4 integration via window.lcards.anim
 * - Works with existing preset system in lcards-anim-presets.js
 */

import { lcardsLog } from '../../utils/lcards-logging.js';
import { AnimationRegistry } from './AnimationRegistry.js';
import { TriggerManager } from './TriggerManager.js';
import { BaseService } from '../BaseService.js';

export class AnimationManager extends BaseService {
  constructor(systemsManager) {
    super();
    this.systemsManager = systemsManager;

    // Core components
    this.registry = new AnimationRegistry();
    this.scopes = new Map(); // overlayId -> { scope, overlay, activeAnimations, triggerManager }
    this.customPresets = new Map(); // preset name -> preset definition
    this.timelines = new Map(); // timelineId -> timeline instance

    // Animation tracking
    this.activeAnimations = new Map(); // overlayId -> Set<animation instances>
    this.registeredAnimations = new Map(); // overlayId -> animation definitions[]

    // Datasource subscriptions
    this.datasourceSubscriptions = new Map(); // datasource_id -> cleanup function

    // DOM root element (for reliable queries when elements become disconnected)
    this.mountEl = null;

    // State
    this.initialized = false;

    lcardsLog.debug('[AnimationManager] Created');
  }

  /**
   * Initialize the animation system with overlay configurations
   * Called by SystemsManager after AdvancedRenderer is initialized
   *
   * @param {Array} overlays - Overlay configurations from merged config
   * @param {Object} [options] - Additional options
   * @param {Object} [options.customPresets] - User-defined animation_presets
   * @param {Object} [options.timelines] - Timeline configurations
   * @param {Object} [options.suppressMountWarning] - Suppress mount element warning (for core singleton init)
   */
  async initialize(overlays = [], options = {}) {
    lcardsLog.debug('[AnimationManager] Initializing animation system');

    try {
      // Store mount element for reliable DOM queries (only if not already set)
      if (!this.mountEl) {
        this.mountEl = this.systemsManager?.renderer?.mountEl;
      }
      if (!this.mountEl && !options.suppressMountWarning) {
        lcardsLog.warn('[AnimationManager] No mountEl available - DOM queries may fail');
      }

      // Store custom presets for resolution
      if (options.customPresets) {
        Object.entries(options.customPresets).forEach(([name, preset]) => {
          this.customPresets.set(name, preset);
          lcardsLog.debug(`[AnimationManager] Registered custom preset: ${name}`);
        });
      }

      // Register animations from overlay configs (don't execute yet - overlays may not be rendered)
      overlays.forEach(overlay => {
        if (overlay.animations && Array.isArray(overlay.animations)) {
          this.registeredAnimations.set(overlay.id, overlay.animations);
          lcardsLog.debug(`[AnimationManager] Registered ${overlay.animations.length} animations for overlay: ${overlay.id}`);
        }
      });

      // Store timeline configs (will be initialized when overlays are ready)
      if (options.timelines) {
        Object.entries(options.timelines).forEach(([timelineId, timelineConfig]) => {
          lcardsLog.debug(`[AnimationManager] Stored timeline config: ${timelineId}`);
        });
        this.timelineConfigs = options.timelines;
      }

      this.initialized = true;

      // Expose to global namespace for Runtime/Debug API
      if (typeof window !== 'undefined') {
        window.lcards = window.lcards || {};
        window.lcards.animationManager = this;
      }

      lcardsLog.debug('[AnimationManager] Animation system initialized', {
        overlaysWithAnimations: this.registeredAnimations.size,
        customPresets: this.customPresets.size,
        timelines: Object.keys(options.timelines || {}).length
      });

    } catch (error) {
      lcardsLog.error('[AnimationManager] ❌ Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Called by AdvancedRenderer when an overlay is rendered and ready for animations
   * Creates scope, registers triggers, and executes on_load animations
   *
   * @param {string} overlayId - Overlay identifier
   * @param {Element} element - Rendered DOM element
   * @param {Object} overlayConfig - Full overlay configuration
   * @param {Object} systemsManager - Optional MSD coordinator/systems manager for accessing overlay instances
   */
  async onOverlayRendered(overlayId, element, overlayConfig = {}, systemsManager = null) {
    if (!element) {
      lcardsLog.warn(`[AnimationManager] Cannot initialize animations for ${overlayId} - no element provided`);
      return;
    }

    lcardsLog.debug(`[AnimationManager] 🎨 Overlay rendered: ${overlayId}`);

    try {
      // Check if scope already exists
      const existingScope = this.scopes.get(overlayId);

      // Strategy: Preserve onLoadFired if scope was created more than 500ms ago
      // This distinguishes initial setup (multiple rapid calls) from state changes (later calls)
      // - Initial setup: 2-3 calls within ~100ms → only first fires animation
      // - State changes: Calls happen >500ms after creation → don't fire animation
      const now = Date.now();
      const scopeAge = existingScope ? (now - existingScope.createdAt) : 0;
      const isInitialSetup = scopeAge < 500; // Consider calls within 500ms as "initial setup"

      const preserveOnLoadFlag = existingScope?.onLoadFired && !isInitialSetup;

      if (existingScope) {
        lcardsLog.debug(`[AnimationManager] Scope exists for ${overlayId}, age: ${scopeAge}ms, preserving onLoadFired: ${preserveOnLoadFlag} (initial setup: ${isInitialSetup})`);
      }

      // Create anime.js scope for this overlay
      const scope = this.createScopeForOverlay(overlayId, element);

      // Create trigger manager for this overlay
      const triggerManager = new TriggerManager(overlayId, element, this);

      // Store scope and trigger manager
      this.scopes.set(overlayId, {
        scope: scope,
        overlay: overlayConfig,
        element: element,
        activeAnimations: new Set(),
        triggerManager: triggerManager,
        // Track running animation instances by trigger type for stopAnimations()
        // Structure: Map<trigger, Array<animeInstance>>
        runningInstances: new Map(),
        // Store systemsManager reference for accessing overlay instances
        systemsManager: systemsManager,
        // Track whether on_load animations have already fired
        // Preserve the flag if scope is being recreated (e.g., on element changes)
        onLoadFired: preserveOnLoadFlag,
        // Track when scope was created to distinguish initial setup from state changes
        createdAt: existingScope?.createdAt || now
      });

      // Get registered animations for this overlay
      const animations = this.registeredAnimations.get(overlayId) ||
                        overlayConfig.animations ||
                        [];

      if (animations.length === 0) {
        lcardsLog.debug(`[AnimationManager] No animations registered for overlay: ${overlayId}`);
        return;
      }

      // Snapshot the on_load fire decision ONCE before iterating.
      // This prevents the first animation from setting onLoadFired = true and
      // blocking all subsequent on_load animations in the same scope/batch.
      const shouldFireOnLoad = !this.scopes.get(overlayId).onLoadFired;

      // Register each animation with its trigger
      for (const animDef of animations) {
        await this.registerAnimation(overlayId, animDef, { batchShouldFire: shouldFireOnLoad });
      }

      // Mark on_load as fired AFTER the entire batch has been processed,
      // so all animations in this call get a chance to fire.
      if (shouldFireOnLoad) {
        const sd = this.scopes.get(overlayId);
        if (sd) sd.onLoadFired = true;
      }

      lcardsLog.debug(`[AnimationManager] ✅ Initialized ${animations.length} animations for overlay: ${overlayId}`);

    } catch (error) {
      lcardsLog.error(`[AnimationManager] Failed to initialize animations for ${overlayId}:`, error);
    }
  }

  /**
   * Register an animation with its trigger
   *
   * @param {string} overlayId - Overlay identifier
   * @param {Object} animDef - Animation definition
   */
  async registerAnimation(overlayId, animDef, { batchShouldFire = null } = {}) {
    // Respect the enabled flag — false suppresses registration entirely
    if (animDef.enabled === false) {
      lcardsLog.debug(`[AnimationManager] Skipping disabled animation "${animDef.id ?? '(no id)'}" for overlay: ${overlayId}`);
      return;
    }

    const trigger = animDef.trigger || 'on_load';
    const scopeData = this.scopes.get(overlayId);

    if (!scopeData) {
      lcardsLog.warn(`[AnimationManager] Cannot register animation - scope not found for overlay: ${overlayId}`);
      return;
    }

    lcardsLog.debug(`[AnimationManager] Registering animation for ${overlayId} with trigger: ${trigger}`);

    // Resolve preset_ref to actual definition
    const resolvedAnimDef = this.resolveAnimationDefinition(animDef);

    // Register with trigger manager
    scopeData.triggerManager.register(trigger, resolvedAnimDef);

    // For on_load triggers, execute immediately (but only once per scope)
    if (trigger === 'on_load') {
      // batchShouldFire is set by onOverlayRendered before the animation loop so that
      // ALL animations in the same batch share the same fire decision — fixing the bug
      // where the first animation setting onLoadFired=true would block the rest.
      // For direct (non-batch) callers batchShouldFire is null; fall back to the scope flag.
      const shouldFire = batchShouldFire !== null ? batchShouldFire : !scopeData.onLoadFired;
      if (shouldFire) {
        lcardsLog.debug(`[AnimationManager] Executing on_load animation for ${overlayId}`);
        if (batchShouldFire === null) {
          // Direct (non-batch) call — maintain single-fire semantics immediately
          scopeData.onLoadFired = true;
        }
        // In batch mode onLoadFired is set by onOverlayRendered after the full loop.
        await this.playAnimation(overlayId, resolvedAnimDef);
      } else {
        lcardsLog.debug(`[AnimationManager] Skipping on_load animation (already fired for ${overlayId})`);
      }
    }

    // ✨ NEW: For on_datasource_change triggers, setup datasource listener
    if (trigger === 'on_datasource_change') {
      this.setupDatasourceListenerForAnimation(overlayId, resolvedAnimDef);
    }
  }

  /**
   * Setup datasource change listener for a single animation
   * Called when registering on_datasource_change animations
   *
   * @param {string} overlayId - Overlay identifier
   * @param {Object} animDef - Animation definition with trigger: on_datasource_change
   */
  setupDatasourceListenerForAnimation(overlayId, animDef) {
    const dataSourceManager = this.systemsManager?.dataSourceManager;

    if (!dataSourceManager) {
      lcardsLog.warn('[AnimationManager] DataSourceManager not available for datasource triggers');
      return;
    }

    if (!animDef.datasource) {
      lcardsLog.warn(`[AnimationManager] on_datasource_change animation missing 'datasource' property for overlay: ${overlayId}`, animDef);
      return;
    }

    const datasourceName = animDef.datasource;

    // Handle dot notation (datasource_name.transformations.celsius)
    const [sourceName, ...pathParts] = datasourceName.split('.');
    const source = dataSourceManager.getSource(sourceName);

    if (!source) {
      lcardsLog.warn(`[AnimationManager] Datasource not found: ${sourceName} (overlay: ${overlayId})`);
      return;
    }

    // Create unique subscription key
    const subscriptionKey = `${overlayId}:${datasourceName}`;

    // Check if we already have a subscription for this overlay+datasource combo
    if (this.datasourceSubscriptions.has(subscriptionKey)) {
      lcardsLog.debug(`[AnimationManager] Subscription already exists for ${subscriptionKey}`);
      return;
    }

    // Subscribe to datasource updates
    const unsubscribe = source.subscribe((data) => {
      lcardsLog.debug(`[AnimationManager] 📊 Datasource change: ${datasourceName} (overlay: ${overlayId})`, data);

      // Extract value based on path if needed
      let value = data.v;
      if (pathParts.length > 0) {
        value = this._extractValueFromPath(data, pathParts);
      }

      // Trigger the animation (no filtering - always plays on change)
      lcardsLog.debug(`[AnimationManager] 🎬 Triggering animation for ${overlayId} on datasource change`);
      this.playAnimation(overlayId, animDef);
    });

    // Store unsubscribe function
    this.datasourceSubscriptions.set(subscriptionKey, unsubscribe);
    lcardsLog.debug(`[AnimationManager] ✅ Setup datasource listener: ${subscriptionKey}`);
  }

  /**
   * Extract value from datasource using dot notation path
   * NEW: Updated for datasource buffer structure (main buffer + processor buffers)
   *
   * @param {Object} data - Datasource data object with structure: { v: value, processorKey: value, ... }
   * @param {Array<string>} pathParts - Path parts (e.g., ['celsius'] for processor buffer)
   * @returns {*} Extracted value
   * @private
   */
  _extractValueFromPath(data, pathParts) {
    // Guard against null/undefined data
    if (!data || typeof data !== 'object') {
      lcardsLog.warn(`[AnimationManager] Invalid datasource data: ${data}`);
      return undefined;
    }

    // No path specified - return main buffer value
    if (pathParts.length === 0) {
      return data.v;
    }

    // Single path part - look for processor buffer (e.g., 'celsius', 'rolling_avg')
    const processorKey = pathParts[0];

    if (data[processorKey] !== undefined) {
      // Found processor buffer - return its value
      return data[processorKey];
    }

    // Processor buffer not found - log warning and fallback to main buffer
    lcardsLog.warn(`[AnimationManager] Processor buffer '${processorKey}' not found in datasource. Available: ${Object.keys(data).join(', ')}. Falling back to main buffer.`);
    return data.v !== undefined ? data.v : undefined;
  }

  /**
   * Trigger all animations registered for a specific overlay and trigger type
   * This is called by ActionHelpers when interactive events occur
   *
   * @param {string} overlayId - Overlay identifier
   * @param {string} trigger - Trigger type (on_tap, on_hold, on_hover, etc.)
   */
  async triggerAnimations(overlayId, trigger) {
    const scopeData = this.scopes.get(overlayId);

    if (!scopeData) {
      // Only warn if we have ANY scopes registered (meaning animations are actually being used)
      if (this.scopes.size > 0) {
        lcardsLog.debug(`[AnimationManager] Overlay not found for animation trigger: ${overlayId}`);
      }
      return;
    }

    // Get animations registered for this trigger from TriggerManager
    const triggerManager = scopeData.triggerManager;
    if (!triggerManager || !triggerManager.registrations.has(trigger)) {
      lcardsLog.debug(`[AnimationManager] No animations registered for ${overlayId} on trigger: ${trigger}`);
      return;
    }

    const animations = triggerManager.registrations.get(trigger) || [];

    if (animations.length === 0) {
      lcardsLog.debug(`[AnimationManager] No animations to trigger for ${overlayId} on ${trigger}`);
      return;
    }

    lcardsLog.debug(`[AnimationManager] 🎬 Triggering ${animations.length} animation(s) for ${overlayId} on ${trigger}`);

    // Execute each animation
    for (const animDef of animations) {
      try {
        await this.playAnimation(overlayId, animDef);
      } catch (error) {
        lcardsLog.error(`[AnimationManager] Failed to play animation for ${overlayId}:`, error);
      }
    }
  }

  /**
   * Stop animations for a specific overlay and optional trigger type
   * Used primarily to stop looping hover animations when pointer leaves
   *
   * @param {string} overlayId - Overlay identifier
   * @param {string} [trigger] - Optional trigger type to stop (stops all if not specified)
   */
  stopAnimations(overlayId, trigger = null) {
    const resolved = this._resolveScopeFromOverlay(overlayId);
    if (!resolved) {
      lcardsLog.debug(`[AnimationManager] No scope found for ${overlayId}`);
      return;
    }

    const { scopeId, scopeData } = resolved;
    if (!scopeData.scope) {
      lcardsLog.debug(`[AnimationManager] Scope ${scopeId} has no anime scope`);
      return;
    }

    lcardsLog.debug(`[AnimationManager] stopAnimations called for ${scopeId}, trigger=${trigger}`);

    if (trigger) {
      // Get anime instances tracked for this trigger
      const instances = scopeData.runningInstances.get(trigger) || [];

      if (instances.length === 0) {
        lcardsLog.debug(`[AnimationManager] No tracked instances for trigger ${trigger} on ${overlayId}`);
        // Fallback: try scope.children
        this._stopAnimationsFromScopeChildren(scopeData, trigger);
        return;
      }

      // Pause and complete each tracked instance
      let stopped = 0;
      instances.forEach(instance => {
        try {
          if (instance && !instance.completed) {
            // Revert animation - removes all transformations and returns to original state
            // This is better than seek(0) which goes to first animation frame
            if (instance.revert) {
              instance.revert();
              stopped++;
            } else {
              // Fallback: pause if revert not available
              lcardsLog.warn(`[AnimationManager] Instance has no revert() method, using pause()`);
              instance.complete = true;
              instance.pause();
              stopped++;
            }
          }
        } catch (error) {
          lcardsLog.warn(`[AnimationManager] Error stopping instance:`, error);
        }
      });

      // Clear tracked instances for this trigger
      scopeData.runningInstances.delete(trigger);

      lcardsLog.debug(`[AnimationManager] ⏸️ Stopped ${stopped} animation(s) for trigger ${trigger} on ${overlayId}`);

    } else {
      // Stop all animations
      let stopped = 0;
      scopeData.runningInstances.forEach((instances, trig) => {
        instances.forEach(instance => {
          try {
            if (instance && !instance.completed) {
              // Revert to remove all transformations
              if (instance.revert) {
                instance.revert();
                stopped++;
              } else {
                instance.complete = true;
                instance.pause();
                stopped++;
              }
            }
          } catch (error) {
            lcardsLog.warn(`[AnimationManager] Error stopping instance:`, error);
          }
        });
      });

      scopeData.runningInstances.clear();
      lcardsLog.debug(`[AnimationManager] ⏹️ Stopped ${stopped} animation(s) on ${overlayId}`);
    }
  }

  /**
   * Fallback: Try to stop animations by inspecting scope.children
   * @private
   */
  _stopAnimationsFromScopeChildren(scopeData, trigger) {
    const children = scopeData.scope.children || [];

    if (children.length === 0) {
      return;
    }

    let stopped = 0;
    children.forEach(child => {
      try {
        // Anime instances have .completed, .paused, .pause(), .play() methods
        if (child && !child.completed && !child.paused) {
          // Use revert to return to original state
          if (child.revert) {
            child.revert();
            stopped++;
          } else {
            child.complete = true;
            child.pause();
            stopped++;
          }
        }
      } catch (error) {
        // Silently ignore - might not be an anime instance
      }
    });

    if (stopped > 0) {
      lcardsLog.debug(`[AnimationManager] ⏸️ Stopped ${stopped} animation(s) via scope.children (fallback)`);
    }
  }  /**
   * Resolve animation definition from preset or custom preset
   *
   * @param {Object} animDef - Raw animation definition
   * @returns {Object} Resolved animation definition
   */
  resolveAnimationDefinition(animDef) {
    let resolved = { ...animDef };

    // Check if preset refers to a custom preset (supports both built-in and custom)
    if (animDef.preset) {
      const customPreset = this.customPresets.get(animDef.preset);
      if (customPreset) {
        // Get the base preset name from the custom preset
        const basePresetName = customPreset._basePreset || customPreset.preset || customPreset.type;

        // Merge: base preset params < custom preset params < animDef params
        resolved = {
          ...customPreset,
          ...animDef,
          preset: basePresetName // Use the base preset for execution
        };

        // Clean up internal fields
        delete resolved._basePreset;
        delete resolved.type;

        lcardsLog.debug(`[AnimationManager] Resolved custom preset: ${animDef.preset} -> ${basePresetName}`);
      }
    }

    // Verify preset exists if specified
    if (resolved.preset) {
      const presetFn = window.lcards?.anim?.presets?.[resolved.preset];
      if (!presetFn) {
        lcardsLog.warn(`[AnimationManager] Unknown preset: ${resolved.preset}`, {
          availablePresets: Object.keys(window.lcards?.anim?.presets || {}),
          hasAnimNamespace: !!window.lcards?.anim,
          hasPresetsObject: !!window.lcards?.anim?.presets
        });
      } else {
        lcardsLog.debug(`[AnimationManager] Preset found: ${resolved.preset}`);
      }
    }

    return resolved;
  }

  /**
   * Create an ad-hoc animation scope for rule-based animations
   * Used when rules target overlays that don't have pre-defined animations
   *
   * @param {string} overlayId - Original overlay ID from SystemsManager
   * @param {Object} overlayMetadata - Overlay metadata (type, element, etc.)
   * @param {string} scopeId - Computed scope ID (type-overlayId)
   * @private
   */
  async _createAdHocScope(overlayId, overlayMetadata, scopeId) {
    try {
      // Query for the actual DOM element
      // For simple cards, the element is the card itself
      const cardElement = document.querySelector(`[data-card-id="${overlayId}"]`) ||
                          document.querySelector(`lcards-${overlayMetadata.type}[data-card-id="${overlayId.replace(/^lcards-/, '')}"]`);

      if (!cardElement) {
        lcardsLog.warn(`[AnimationManager] Cannot create ad-hoc scope - element not found for overlay: ${overlayId}`);
        return;
      }

      // Create minimal scope for rule-based animations
      const scope = {
        overlay: cardElement,
        activeAnimations: new Set(),
        triggerManager: null, // No trigger manager needed for rule-based
        onLoadFired: true // Skip on_load trigger
      };

      this.scopes.set(scopeId, scope);
      this.activeAnimations.set(scopeId, new Set());

      lcardsLog.debug(`[AnimationManager] ✅ Created ad-hoc scope: ${scopeId}`);
    } catch (error) {
      lcardsLog.error(`[AnimationManager] Failed to create ad-hoc scope for ${overlayId}:`, error);
    }
  }

  /**
   * Resolve overlay ID to scope ID with type prefix
   * @param {string} overlayId - Overlay identifier
   * @returns {Object|null} Object with scopeId and scopeData, or null if not found
   * @private
   */
  _resolveScopeFromOverlay(overlayId) {
    // Try direct lookup first
    let scopeData = this.scopes.get(overlayId);
    if (scopeData) {
      return { scopeId: overlayId, scopeData };
    }

    // If not found, try to resolve from SystemsManager overlay registry
    // (Simple cards register with card GUID, but may have scope with type prefix)
    if (this.systemsManager) {
      const overlayRegistry = this.systemsManager.getOverlayRegistry?.() || this.systemsManager._overlayRegistry;
      const overlayMetadata = overlayRegistry?.get(overlayId);

      if (overlayMetadata) {
        // Use stored type field from overlay metadata
        const cardType = overlayMetadata.type;

        // Try scope with type prefix (e.g., "button-lcards-abc123")
        const scopeId = `${cardType}-${overlayId}`;
        scopeData = this.scopes.get(scopeId);

        if (scopeData) {
          lcardsLog.debug(`[AnimationManager] Resolved overlay ${overlayId} to scope ${scopeId} (type: ${cardType})`);
          return { scopeId, scopeData };
        } else {
          lcardsLog.warn(`[AnimationManager] Scope not found for overlay: ${overlayId} (tried ${scopeId}). Card may not have initialized properly.`);
        }
      }
    }

    return null;
  }

  /**
   * Play an animation on an overlay
   *
   * @param {string} overlayId - Overlay identifier
   * @param {Object} animDef - Animation definition (already resolved)
   * @returns {Promise<Object|null>} Animation instance
   */
  async playAnimation(overlayId, animDef) {
    const resolved = this._resolveScopeFromOverlay(overlayId);
    if (!resolved) {
      lcardsLog.warn(`[AnimationManager] Cannot play animation - overlay not found: ${overlayId}`);
      return null;
    }

    const { scopeId, scopeData } = resolved;

    try {
      // Resolve datasource-driven parameters if needed
      const resolvedParams = await this.resolveDatasourceParams(animDef);
      const finalAnimDef = { ...animDef, ...resolvedParams };

      // Get overlay instance from AdvancedRenderer for target resolution
      // Try scope-specific systemsManager first (MSD cards), then fall back to global (simple cards)
      const systemsManager = scopeData.systemsManager || this.systemsManager;
      const overlayInstance = systemsManager?.renderer?.overlayRenderers?.get(overlayId);

      lcardsLog.debug(`[AnimationManager] Target resolution for ${overlayId}:`, {
        hasRenderer: !!systemsManager?.renderer,
        hasOverlayRenderers: !!systemsManager?.renderer?.overlayRenderers,
        hasOverlayInstance: !!overlayInstance,
        overlayInstanceType: overlayInstance?.constructor?.name,
        hasGetAnimationTarget: typeof overlayInstance?.getAnimationTarget === 'function',
        hasScopeSystemsManager: !!scopeData.systemsManager,
        target: finalAnimDef.target,
        targets: finalAnimDef.targets
      });

      // Resolve animation target(s) using overlay's targeting API
      let targetElements = [];
      const overlayElement = scopeData.element;

      if (finalAnimDef.targets) {
        // Multiple targets specified (array)
        const targetSpecs = Array.isArray(finalAnimDef.targets) ? finalAnimDef.targets : [finalAnimDef.targets];

        for (const spec of targetSpecs) {
          let el = null;

          if (overlayInstance && typeof overlayInstance.getAnimationTarget === 'function') {
            // Pass the overlay element to the instance for querying
            overlayInstance.element = overlayElement;
            el = overlayInstance.getAnimationTarget(spec);
          }

          // Fallback to CSS selector if overlay doesn't resolve it
          if (!el && overlayElement) {
            el = overlayElement.querySelector(spec);
          }

          if (el) {
            targetElements.push(el);
          } else {
            lcardsLog.warn(`[AnimationManager] Target not found: "${spec}" for overlay ${overlayId}`);
          }
        }
      } else if (finalAnimDef.target) {
        // Single target specified (string selector or element)

        // If it's already an Element, use it directly
        if (finalAnimDef.target instanceof Element) {
          targetElements.push(finalAnimDef.target);
        } else {
          // It's a selector string - query for all matching elements
          const selector = finalAnimDef.target;
          let elements = null;

          if (overlayInstance && typeof overlayInstance.getAnimationTarget === 'function') {
            // Pass the overlay element to the instance for querying
            overlayInstance.element = overlayElement;
            elements = overlayInstance.getAnimationTarget(selector);
            // Convert single element to array
            if (elements && !Array.isArray(elements)) {
              elements = [elements];
            }
          }

          // Fallback to CSS selector if overlay doesn't resolve it
          if (!elements && overlayElement) {
            // Use querySelectorAll to find all matching elements
            elements = Array.from(overlayElement.querySelectorAll(selector));
          }

          if (elements && elements.length > 0) {
            targetElements.push(...elements);
          } else {
            lcardsLog.warn(`[AnimationManager] Target not found: "${selector}" for overlay ${overlayId}`);
          }
        }
      } else {
        // No target specified - use overlay's smart default
        let el = null;

        if (overlayInstance && typeof overlayInstance.getDefaultAnimationTarget === 'function') {
          // Pass the overlay element to the instance for querying
          overlayInstance.element = overlayElement;
          el = overlayInstance.getDefaultAnimationTarget();

          lcardsLog.debug(`[AnimationManager] getDefaultAnimationTarget() called for ${overlayId}:`, {
            returnedElement: el?.tagName,
            elementId: el?.id,
            hasStrokeDasharray: el?.getAttribute('stroke-dasharray')
          });
        } else {
          lcardsLog.debug(`[AnimationManager] No getDefaultAnimationTarget for ${overlayId}:`, {
            hasInstance: !!overlayInstance,
            instanceType: overlayInstance?.constructor?.name,
            hasMethod: typeof overlayInstance?.getDefaultAnimationTarget
          });
        }

        // Fallback to overlay element
        if (!el) {
          lcardsLog.debug(`[AnimationManager] Using overlay element fallback for ${overlayId}`);
          el = overlayElement;
        }

        if (el) {
          targetElements.push(el);
        }
      }

      // If we resolved nothing, fall back to overlay element
      if (targetElements.length === 0) {
        lcardsLog.warn(`[AnimationManager] No targets resolved, using overlay element for ${overlayId}`);
        targetElements.push(overlayElement);
      }

      // Verify target elements are connected to DOM
      const connectedTargets = targetElements.filter(el => el && el.isConnected);
      if (connectedTargets.length === 0) {
        lcardsLog.error(`[AnimationManager] All target elements disconnected from DOM for ${overlayId}`, {
          totalTargets: targetElements.length,
          targetSelectors: finalAnimDef.target || finalAnimDef.targets || 'default'
        });
        return null;
      }

      if (connectedTargets.length < targetElements.length) {
        lcardsLog.warn(`[AnimationManager] Some targets disconnected, animating ${connectedTargets.length}/${targetElements.length} for ${overlayId}`);
        targetElements = connectedTargets;
      }

      lcardsLog.debug(`[AnimationManager] Resolved ${targetElements.length} target(s) for overlay ${overlayId}:`, {
        hasTarget: !!finalAnimDef.target,
        hasTargets: !!finalAnimDef.targets,
        targetCount: targetElements.length
      });

      // Use existing animateElement helper for consistency
      const { animateElement } = window.lcards.anim;

      if (!animateElement) {
        lcardsLog.error('[AnimationManager] animateElement helper not found');
        return null;
      }

      // Get HASS context from SystemsManager
      const hass = this.systemsManager?.getHass?.() || this.systemsManager?._hass;

      // Build animation options for animateElement
      // For stagger presets with multiple targets, pass as array directly to animateElement
      // which will handle them properly via anime.js stagger functionality
      const animOptions = {
        type: finalAnimDef.preset || finalAnimDef.type,
        targets: targetElements,  // Pass resolved DOM elements, not original selectors
        root: scopeData.element.getRootNode(),
        duration: finalAnimDef.duration,
        easing: finalAnimDef.easing,
        loop: finalAnimDef.loop,
        alternate: finalAnimDef.alternate,
        delay: finalAnimDef.delay,
        // Pass through preset-specific params but exclude original target/targets selectors
        ...(finalAnimDef.params || {}),
        // Pass other animation def properties except targets/target which we already resolved
        ...Object.fromEntries(
          Object.entries(finalAnimDef).filter(([key]) =>
            !['target', 'targets', 'params', 'preset', 'type', 'duration', 'easing', 'loop', 'alternate', 'delay'].includes(key)
          )
        )
      };

      // Prepare array to collect anime instances created by animateElement
      if (!scopeData.runningInstances.has(animDef.trigger)) {
        scopeData.runningInstances.set(animDef.trigger, []);
      }
      const instancesArray = scopeData.runningInstances.get(animDef.trigger);

      // Callback to track instances as they're created
      const onInstanceCreated = (instance) => {
        if (instance) {
          instancesArray.push(instance);
          lcardsLog.debug(`[AnimationManager] 📌 Tracked anime instance for trigger: ${animDef.trigger}`);
        }
      };

      // Execute animation via animateElement with callback
      // Pass scopeData (which has .scope property) not just the raw scope
      await animateElement(scopeData, animOptions, hass, onInstanceCreated);

      lcardsLog.debug(`[AnimationManager] ▶️ Playing animation on ${overlayId}:`, {
        type: finalAnimDef.type,
        trigger: animDef.trigger,
        duration: finalAnimDef.duration
      });

      // Track active animation definition
      scopeData.activeAnimations.add(finalAnimDef);

      return finalAnimDef; // Return for API access

    } catch (error) {
      lcardsLog.error(`[AnimationManager] Failed to play animation on ${overlayId}:`, error);
      return null;
    }
  }

  /**
   * Resolve datasource-driven parameters in animation definition
   *
   * @param {Object} animDef - Animation definition
   * @returns {Promise<Object>} Resolved parameters
   */
  async resolveDatasourceParams(animDef) {
    const resolved = {};
    const dataSourceManager = this.systemsManager?.dataSourceManager;

    if (!dataSourceManager) {
      return resolved;
    }

    // Get datasource value if specified
    let datasourceValue = null;
    if (animDef.datasource) {
      const datasource = dataSourceManager.getSource(animDef.datasource);
      if (datasource) {
        const currentData = datasource.getCurrentData();
        datasourceValue = currentData?.value;
      }
    }

    // Resolve template strings in parameters
    for (const [key, value] of Object.entries(animDef)) {
      if (typeof value === 'string' && this.isTemplate(value)) {
        // Build context for template resolution
        const context = {
          datasource: {
            value: datasourceValue
          },
          states: (entityId) => {
            const hass = this.systemsManager?.getHass?.() || this.systemsManager?._hass;
            return hass?.states?.[entityId]?.state;
          }
        };

        // Use TemplateProcessor if available
        // For now, do simple replacement (full template processor integration in Phase 2)
        let resolvedValue = value;
        if (datasourceValue !== null) {
          resolvedValue = value.replace(/\{\{\s*datasource\.value\s*\}\}/g, datasourceValue);
        }

        resolved[key] = resolvedValue;
      }
    }

    return resolved;
  }

  /**
   * Check if a string contains template syntax
   *
   * @param {string} str - String to check
   * @returns {boolean}
   */
  isTemplate(str) {
    return /\{\{.*\}\}|\{%.*%\}/.test(str);
  }

  /**
   * Create an anime.js scope for an overlay
   *
   * @param {string} overlayId - Overlay identifier
   * @param {Element} element - Overlay DOM element
   * @returns {Object} Anime.js scope
   */
  createScopeForOverlay(overlayId, element) {
    try {
      // Use global anime.js to create scope
      const anime = window.lcards?.anim?.animejs;
      if (!anime || !anime.createScope) {
        lcardsLog.error('[AnimationManager] Anime.js createScope not available');
        return null;
      }

      const scope = anime.createScope();

      // Store in global scopes map for compatibility
      if (window.lcards?.anim?.scopes) {
        window.lcards.anim.scopes.set(overlayId, scope);
      }

      lcardsLog.debug(`[AnimationManager] Created scope for overlay: ${overlayId}`);

      return scope;

    } catch (error) {
      lcardsLog.error(`[AnimationManager] Failed to create scope for ${overlayId}:`, error);
      return null;
    }
  }

  /**
   * Stop all animations on an overlay
   *
   * @param {string} overlayId - Overlay identifier
   */
  stopAnimation(overlayId) {
    const resolved = this._resolveScopeFromOverlay(overlayId);
    if (!resolved) {
      lcardsLog.warn(`[AnimationManager] Cannot stop animations - overlay not found: ${overlayId}`);
      return;
    }

    const { scopeId, scopeData } = resolved;

    try {
      // Use scope's revert method to stop all animations
      if (scopeData.scope && scopeData.scope.revert) {
        scopeData.scope.revert();
      }

      // Clear active animations tracking
      scopeData.activeAnimations.clear();

      lcardsLog.debug(`[AnimationManager] ⏹️ Stopped animations on overlay: ${scopeId}`);

    } catch (error) {
      lcardsLog.error(`[AnimationManager] Failed to stop animations on ${scopeId}:`, error);
    }
  }

  /**
   * Pause animations on an overlay
   *
   * @param {string} overlayId - Overlay identifier
   */
  pauseOverlay(overlayId) {
    const scopeData = this.scopes.get(overlayId);

    if (!scopeData || !scopeData.scope) {
      lcardsLog.warn(`[AnimationManager] Cannot pause - overlay not found: ${overlayId}`);
      return;
    }

    try {
      if (scopeData.scope.pause) {
        scopeData.scope.pause();
        lcardsLog.debug(`[AnimationManager] ⏸️ Paused animations on overlay: ${overlayId}`);
      }
    } catch (error) {
      lcardsLog.error(`[AnimationManager] Failed to pause animations on ${overlayId}:`, error);
    }
  }

  /**
   * Resume animations on an overlay
   *
   * @param {string} overlayId - Overlay identifier
   */
  resumeOverlay(overlayId) {
    const scopeData = this.scopes.get(overlayId);

    if (!scopeData || !scopeData.scope) {
      lcardsLog.warn(`[AnimationManager] Cannot resume - overlay not found: ${overlayId}`);
      return;
    }

    try {
      if (scopeData.scope.play) {
        scopeData.scope.play();
        lcardsLog.debug(`[AnimationManager] ▶️ Resumed animations on overlay: ${overlayId}`);
      }
    } catch (error) {
      lcardsLog.error(`[AnimationManager] Failed to resume animations on ${overlayId}:`, error);
    }
  }

  /**
   * Destroy scope and cleanup for an overlay
   * Called when overlay is removed
   *
   * @param {string} overlayId - Overlay identifier
   */
  destroyOverlayScope(overlayId) {
    const scopeData = this.scopes.get(overlayId);

    if (!scopeData) {
      return;
    }

    try {
      // ✨ NEW: Cleanup datasource subscriptions for this overlay
      const keysToRemove = [];
      this.datasourceSubscriptions.forEach((cleanup, key) => {
        if (key.startsWith(`${overlayId}:`)) {
          if (typeof cleanup === 'function') {
            try {
              cleanup();
              lcardsLog.debug(`[AnimationManager] Unsubscribed datasource listener: ${key}`);
            } catch (error) {
              lcardsLog.warn(`[AnimationManager] Error unsubscribing datasource ${key}:`, error);
            }
          }
          keysToRemove.push(key);
        }
      });
      keysToRemove.forEach(key => this.datasourceSubscriptions.delete(key));

      // Cleanup trigger manager
      if (scopeData.triggerManager) {
        scopeData.triggerManager.destroy();
      }

      // Revert and cleanup scope
      if (scopeData.scope && typeof scopeData.scope.revert === 'function') {
        try {
          scopeData.scope.revert();
        } catch (revertError) {
          lcardsLog.warn(`[AnimationManager] Error reverting scope for ${overlayId}:`, revertError);
        }
      }

      // Remove from maps
      this.scopes.delete(overlayId);
      this.activeAnimations.delete(overlayId);

      // Cleanup global scope reference
      if (window.lcards?.anim?.scopes) {
        window.lcards.anim.scopes.delete(overlayId);
      }

      lcardsLog.debug(`[AnimationManager] 🗑️ Destroyed scope for overlay: ${overlayId}`);

    } catch (error) {
      lcardsLog.error(`[AnimationManager] Failed to destroy scope for ${overlayId}:`, error);
    }
  }

  /**
   * Get all active animations (for Debug API)
   *
   * @returns {Object} Active animations by overlay
   */
  getActiveAnimations() {
    const result = {};

    this.scopes.forEach((scopeData, overlayId) => {
      if (scopeData.activeAnimations.size > 0) {
        result[overlayId] = Array.from(scopeData.activeAnimations).map(anim => ({
          preset: anim.preset,
          trigger: anim.trigger,
          duration: anim.duration
        }));
      }
    });

    return result;
  }

  /**
   * Get all registered animation definitions (for Debug API)
   *
   * @returns {Array} Animation definitions
   */
  getAllAnimationDefinitions() {
    const result = [];

    this.registeredAnimations.forEach((animations, overlayId) => {
      animations.forEach(animDef => {
        result.push({
          overlayId,
          ...animDef
        });
      });
    });

    return result;
  }

  /**
   * Inspect a specific overlay's animation state (for Debug API)
   *
   * @param {string} overlayId - Overlay identifier
   * @returns {Object|null} Overlay animation state
   */
  inspectOverlay(overlayId) {
    const scopeData = this.scopes.get(overlayId);

    if (!scopeData) {
      return null;
    }

    return {
      overlayId,
      hasScope: !!scopeData.scope,
      activeAnimations: Array.from(scopeData.activeAnimations),
      registeredAnimations: this.registeredAnimations.get(overlayId) || [],
      hasTriggerManager: !!scopeData.triggerManager
    };
  }

  /**
   * Cleanup all resources
   */
  dispose() {
    lcardsLog.info('[AnimationManager] 🧹 Disposing animation system');

    // ✨ NEW: Cleanup all datasource subscriptions
    lcardsLog.debug(`[AnimationManager] Cleaning up ${this.datasourceSubscriptions.size} datasource subscriptions`);
    this.datasourceSubscriptions.forEach((cleanup, key) => {
      if (typeof cleanup === 'function') {
        try {
          cleanup();
          lcardsLog.debug(`[AnimationManager] Unsubscribed datasource listener: ${key}`);
        } catch (error) {
          lcardsLog.warn(`[AnimationManager] Error unsubscribing from datasource ${key}:`, error);
        }
      }
    });
    this.datasourceSubscriptions.clear();

    // Destroy all overlay scopes
    Array.from(this.scopes.keys()).forEach(overlayId => {
      this.destroyOverlayScope(overlayId);
    });

    // Clear all maps
    this.scopes.clear();
    this.customPresets.clear();
    this.timelines.clear();
    this.activeAnimations.clear();
    this.registeredAnimations.clear();

    this.initialized = false;

    lcardsLog.info('[AnimationManager] ✅ Animation system disposed');
  }

  // ============================================================================
  // SEGMENT ANIMATION SUPPORT
  // Extends AnimationManager to support sub-scope animations for SVG segments
  // ============================================================================

  /**
   * Register segment animations for a card
   * Creates a "sub-scope" under the card's scope for segment-level animations
   *
   * @param {string} cardId - Unique card identifier (e.g., "lcards-button-123")
   * @param {string} segmentId - Segment identifier
   * @param {Array} animations - Animation definitions array
   * @param {Element} segmentElement - SVG element to animate
   */
  async registerSegmentAnimations(cardId, segmentId, animations, segmentElement) {
    if (!animations || animations.length === 0) {
      return;
    }

    const scopeKey = `${cardId}:segment:${segmentId}`;

    lcardsLog.debug(`[AnimationManager] Registering segment animations`, {
      cardId,
      segmentId,
      scopeKey,
      animationCount: animations.length
    });

    try {
      // Create scope for this segment if it doesn't exist
      if (!this.scopes.has(scopeKey)) {
        // Create anime.js scope
        const scope = this.createScopeForOverlay(scopeKey, segmentElement);

        // Create trigger manager for segment
        const triggerManager = new TriggerManager(scopeKey, segmentElement, this);

        // Store segment scope data
        this.scopes.set(scopeKey, {
          scope: scope,
          overlay: { animations: animations },
          element: segmentElement,
          activeAnimations: new Set(),
          triggerManager: triggerManager,
          runningInstances: new Map(),
          // Segment-specific metadata
          isSegment: true,
          cardId: cardId,
          segmentId: segmentId,
          // Track whether on_load animations have already fired
          onLoadFired: false
        });

        lcardsLog.debug(`[AnimationManager] Created segment scope: ${scopeKey}`);
      }

      const scopeData = this.scopes.get(scopeKey);

      // Register each animation with its trigger
      for (const animDef of animations) {
        // Respect the enabled flag — false suppresses registration entirely
        if (animDef.enabled === false) {
          lcardsLog.debug(`[AnimationManager] Skipping disabled animation "${animDef.id ?? '(no id)'}" on ${scopeKey}`);
          continue;
        }

        const trigger = animDef.trigger || 'on_load';

        // Register with trigger manager
        scopeData.triggerManager.register(trigger, this.resolveAnimationDefinition(animDef));

        // For on_load triggers, execute immediately (but only once)
        if (trigger === 'on_load') {
          if (!scopeData.onLoadFired) {
            scopeData.onLoadFired = true;
            await this.playAnimation(scopeKey, this.resolveAnimationDefinition(animDef));
          } else {
            lcardsLog.debug(`[AnimationManager] Skipping on_load animation (already fired for ${scopeKey})`);
          }
        }

        // For on_entity_change triggers, setup is handled by the card
        // (card tracks entity changes and calls playSegmentAnimation)
      }

      lcardsLog.debug(`[AnimationManager] ✅ Registered ${animations.length} animations for segment: ${scopeKey}`);

    } catch (error) {
      lcardsLog.error(`[AnimationManager] Failed to register segment animations:`, error);
    }
  }

  /**
   * Play animation on a specific segment
   *
   * @param {string} cardId - Card identifier
   * @param {string} segmentId - Segment identifier
   * @param {string} trigger - Animation trigger (on_tap, on_hover, on_entity_change, etc.)
   */
  async playSegmentAnimation(cardId, segmentId, trigger) {
    const scopeKey = `${cardId}:segment:${segmentId}`;
    const scopeData = this.scopes.get(scopeKey);

    if (!scopeData) {
      lcardsLog.debug(`[AnimationManager] No segment scope found: ${scopeKey}`);
      return;
    }

    // Verify element is still connected to DOM
    if (!scopeData.element || !scopeData.element.isConnected) {
      lcardsLog.warn(`[AnimationManager] Segment element disconnected, skipping animation: ${scopeKey}`);
      return;
    }

    // Get animations registered for this trigger
    const triggerManager = scopeData.triggerManager;
    if (!triggerManager || !triggerManager.registrations.has(trigger)) {
      lcardsLog.debug(`[AnimationManager] No segment animations for ${scopeKey} on trigger: ${trigger}`);
      return;
    }

    const animations = triggerManager.registrations.get(trigger) || [];

    if (animations.length === 0) {
      return;
    }

    lcardsLog.debug(`[AnimationManager] 🎬 Playing ${animations.length} segment animation(s) for ${scopeKey} on ${trigger}`);

    // Execute each animation
    for (const animDef of animations) {
      try {
        await this.playAnimation(scopeKey, animDef);
      } catch (error) {
        lcardsLog.error(`[AnimationManager] Failed to play segment animation:`, error);
      }
    }
  }

  /**
   * Stop animations for a specific segment
   *
   * @param {string} cardId - Card identifier
   * @param {string} segmentId - Segment identifier
   * @param {string} [trigger] - Optional trigger type to stop (stops all if not specified)
   */
  stopSegmentAnimations(cardId, segmentId, trigger = null) {
    const scopeKey = `${cardId}:segment:${segmentId}`;
    this.stopAnimations(scopeKey, trigger);
  }

  /**
   * Destroy all segment scopes for a card
   * Called when card is disconnected
   *
   * @param {string} cardId - Card identifier
   */
  destroyCardSegmentScopes(cardId) {
    const keysToDestroy = [];

    // Find all segment scopes for this card
    this.scopes.forEach((scopeData, scopeKey) => {
      if (scopeData.isSegment && scopeData.cardId === cardId) {
        keysToDestroy.push(scopeKey);
      }
    });

    // Destroy each segment scope
    keysToDestroy.forEach(scopeKey => {
      this.destroyOverlayScope(scopeKey);
    });

    if (keysToDestroy.length > 0) {
      lcardsLog.debug(`[AnimationManager] 🗑️ Destroyed ${keysToDestroy.length} segment scopes for card: ${cardId}`);
    }
  }

  /**
   * Get debug information about the animation manager state
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    return {
      type: 'AnimationManager',
      initialized: this.initialized || false,
      scopesCount: this.scopes?.size || 0,
      customPresetsCount: this.customPresets?.size || 0,
      timelinesCount: this.timelines?.size || 0,
      activeAnimationsCount: this.activeAnimations?.size || 0,
      registeredAnimationsCount: this.registeredAnimations?.size || 0,
      hasMountEl: !!this.mountEl,
      hasSystemsManager: !!this.systemsManager
    };
  }
}
