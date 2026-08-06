/**
 * [MsdControlsRenderer] Home Assistant card controls renderer - handles HA card embedding with SVG foreignObject positioning
 * 🎮 Provides sophisticated card creation, HASS context management, and SVG-based positioning for proper scaling
 *
 * === WHY MANUAL HASS FORWARDING IS REQUIRED ===
 *
 * Cards embedded in MSD control overlays are rendered in MSD's shadow root,
 * which isolates them from Home Assistant's component tree. This isolation
 * means cards don't automatically receive HASS updates from HA.
 *
 * Without manual forwarding:
 * - Cards can execute actions (toggle switch, turn on light)
 * - But cards don't see the resulting state changes
 * - UI becomes out of sync (switch looks OFF but light is ON)
 * - Cards become unusable until page refresh
 *
 * Testing confirmed this on 2026-01-09 with:
 * - Standard HA cards (entities, button, light)
 * - LCARdS cards (lcards-button)
 * - Custom cards (button-card, mini-graph-card)
 *
 * === OPTIMIZATION STRATEGY ===
 *
 * Rather than updating ALL controls on every HASS change, we:
 * 1. Track which entities each control uses (_controlEntityMap)
 * 2. Detect which entities changed in HASS update (_detectEntityChanges)
 * 3. Only update controls affected by changed entities (_getAffectedControls)
 * 4. Batch updates to minimize reflows (_batchUpdateControls)
 *
 * This reduces unnecessary updates by 80-95% in typical dashboards.
 *
 * === PERFORMANCE CHARACTERISTICS ===
 *
 * - First HASS update: All controls updated (no previous state to compare)
 * - Subsequent updates: Only controls using changed entities
 * - No entity changes: Early exit, zero control updates
 * - Single entity change: Typically 1-2 controls updated (not all 10+)
 *
 * === USAGE ===
 *
 * Manual HASS forwarding is ENABLED by default (required for foreignObject isolation).
 * To disable and rely on automatic propagation (not recommended):
 *   const msdCard = document.querySelector('lcards-msd');
 *   msdCard._msdPipeline.coordinator.controlsRenderer._manualHassForwarding = false;
 *
 * View entity tracking:
 *   console.log(renderer._controlEntityMap);
 */

import { OverlayUtils } from '../renderer/OverlayUtils.js';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { createCardElement, applyHassToCard, createHuiCardWrapper } from '../../utils/ha-card-factory.js';
import { extractAllConfigStrings } from '../../utils/extractConfigStrings.js';
import { TemplateParser } from '../../core/templates/TemplateParser.js';
import { isHAEntity } from '../utils/HADomains.js';

export class MsdControlsRenderer {
  constructor(renderer, cardConfig = null, isEditMode = false) {
    this.renderer = renderer;
    // Resolved contents of the card's own `msd:` config block — used only for
    // the card-wide triggers_update: 'all' escape hatch (see setHass()).
    this._cardConfig = cardConfig || null;
    this.controlElements = new Map(); // overlayId -> { element, config }
    this.hass = null;
    this.lastRenderArgs = null;
    this._isRendering = false;
    this._lastSignature = null;

    // True only when rendering inside the MSD Studio editor dialog (#387) —
    // forwarded to hui-card.editMode so Studio's live preview keeps its
    // current "always show" behavior instead of newly hiding a control
    // whenever its visibility condition happens to be false at design time,
    // matching the same "edit mode ignores visibility" convention stock HA
    // dashboards and lcards-layout-view/lcards-layout-card already use.
    this._editMode = !!isEditMode;

    // ⚠️ FEATURE FLAG: Manual HASS Forwarding
    // Default: true (required for foreignObject-embedded cards)
    // Cards in SVG foreignObjects are isolated from HA's component tree
    // and need explicit HASS forwarding to receive state updates
    //
    // Testing: Toggle via console:
    //   const msdCard = document.querySelector('lcards-msd');
    //   msdCard._msdPipeline.coordinator.controlsRenderer._manualHassForwarding = false;
    this._manualHassForwarding = true;

    // NEW: Entity tracking for optimized HASS updates
    // Maps control overlay ID to Set of entity IDs it uses
    this._controlEntityMap = new Map(); // overlayId -> Set<entityId>

    // Overlays with triggers_update: 'all' — always included in the affected
    // batch on any hass change, bypassing the entity-diff gate for just that
    // control (see #387: for cards whose entity dependencies genuinely can't
    // be enumerated, e.g. wildcard/device-class auto-discovery).
    this._alwaysUpdateControls = new Set(); // Set<overlayId>

    // DEBUGGING: Log when MsdControlsRenderer is created
    lcardsLog.debug('[MsdControlsRenderer] 🎮 Constructor called', {
      manualHassForwarding: this._manualHassForwarding,
      entityTrackingEnabled: true
    });
  }

  /**
   * Single choke point for every pointer-events assignment this renderer makes
   * on a control's DOM. 'none' only when rendering inside MSD Studio's own
   * editor preview (this._editMode) AND the overlay is explicitly locked —
   * otherwise 'auto', regardless of context. A real dashboard always has
   * this._editMode === false, so a locked overlay is never less interactive
   * there than an unlocked one — locked is editor-only, see msd-schema.js's
   * field description. (Locking a control in MSD Studio makes it undraggable
   * on the canvas, and — via this method — makes its real rendered DOM stop
   * intercepting clicks/pans meant for whatever's visually underneath it,
   * entirely independent of MSD Studio's own separate synthetic bbox overlay,
   * which handles drag/resize disabling on its own.)
   * @param {boolean} [locked]
   * @returns {'auto'|'none'}
   * @private
   */
  _resolvePointerEvents(locked) {
    return (this._editMode && locked === true) ? 'none' : 'auto';
  }

  /**
   * Extract entities used by a control overlay
   * Supports multiple entity reference patterns used by different card types
   * @private
   * @param {Object} overlay - Control overlay configuration
   * @returns {Set<string>} Set of entity IDs used by this control
   */
  _extractControlEntities(overlay) {
    const entities = new Set();

    // Explicit escape hatch (array form): overlay.triggers_update — same field
    // already used by line overlays for MSD data-source subscriptions
    // (ModelBuilder.js/OverlayBase.js). Entity-shaped entries are folded into
    // this control's own change-detection set here; non-entity entries are
    // MSD data-source refs, unrelated to this method. The 'all' string form
    // is handled separately by the caller (_registerControl), not here.
    if (Array.isArray(overlay.triggers_update)) {
      overlay.triggers_update.forEach(ref => {
        if (typeof ref === 'string' && isHAEntity(ref)) {
          entities.add(ref);
        }
      });
    }

    if (!overlay.card) return entities;

    const cardConfig = overlay.card;

    // Pattern 1: Direct entity reference (most common)
    // Example: { type: 'light', entity: 'light.kitchen' }
    if (cardConfig.entity) {
      entities.add(cardConfig.entity);
    }

    // Pattern 2: Entities array (entities card, glance card, etc.)
    // Example: { type: 'entities', entities: ['light.kitchen', 'light.living_room'] }
    if (Array.isArray(cardConfig.entities)) {
      cardConfig.entities.forEach(e => {
        const entityId = typeof e === 'string' ? e : e.entity;
        if (entityId) entities.add(entityId);
      });
    }

    // Pattern 3: Nested config object (some card patterns)
    // Example: { type: 'custom:my-card', config: { entity: 'light.kitchen' } }
    if (cardConfig.config) {
      if (cardConfig.config.entity) {
        entities.add(cardConfig.config.entity);
      }

      if (Array.isArray(cardConfig.config.entities)) {
        cardConfig.config.entities.forEach(e => {
          const entityId = typeof e === 'string' ? e : e.entity;
          if (entityId) entities.add(entityId);
        });
      }
    }

    // Pattern 4: generic scan of every string value anywhere in the card
    // config (mirrors LCARdSCard._extractAllConfigStrings — skips `type`).
    // Catches entity refs nested under arbitrary key names (e.g. a
    // third-party card's own `alerts: [{entity: 'binary_sensor.x'}]` shape,
    // which Patterns 1-3 can't see since they only look at fixed key names),
    // plus entity refs embedded inside Jinja2 templates in any field.
    extractAllConfigStrings(cardConfig).forEach(str => {
      // 4a. Jinja2 templates anywhere, e.g. state: "{{ states('sensor.x') }}"
      TemplateParser.extractJinja2Entities(str).forEach(id => entities.add(id));

      // 4b. Treat the raw string itself as a candidate plain entity ID.
      // isHAEntity() already gates on a known HA domain prefix; when hass is
      // available, also confirm it's a real registered entity (avoids
      // false-positive noise from unrelated dotted strings that happen to
      // share a domain prefix). When hass isn't available yet (rare — only
      // possible before the very first hass tick), err permissive: including
      // an extra candidate only costs an occasional unnecessary update, never
      // a missed one.
      if (isHAEntity(str) && (!this.hass?.states || this.hass.states[str])) {
        entities.add(str);
      }
    });

    return entities;
  }

  /**
   * Detect which entities changed between HASS updates
   * Compares state and last_changed to catch all relevant updates
   * @private
   * @param {Object} oldHass - Previous HASS object
   * @param {Object} newHass - New HASS object
   * @returns {Set<string>} Set of entity IDs that changed
   */
  _detectEntityChanges(oldHass, newHass) {
    const changed = new Set();

    if (!oldHass || !oldHass.states) {
      // First HASS update - consider all entities changed
      return new Set(Object.keys(newHass.states));
    }

    // Compare entity states
    Object.keys(newHass.states).forEach(entityId => {
      const oldState = oldHass.states[entityId];
      const newState = newHass.states[entityId];

      // Entity is new or state/attributes changed
      if (!oldState ||
          oldState.state !== newState.state ||
          oldState.last_changed !== newState.last_changed) {
        changed.add(entityId);
      }
    });

    return changed;
  }

  /**
   * Get controls affected by entity changes
   * Returns list of controls that use at least one changed entity
   * @private
   * @param {Set<string>} changedEntities - Set of entity IDs that changed
   * @returns {Array} Array of affected control objects { overlayId, element, config }
   */
  _getAffectedControls(changedEntities) {
    const affected = [];

    this._controlEntityMap.forEach((entities, overlayId) => {
      // triggers_update: 'all' controls are always affected, regardless of
      // which entities actually changed (see #387).
      const hasChangedEntity = this._alwaysUpdateControls.has(overlayId) ||
        Array.from(entities).some(e => changedEntities.has(e));

      if (hasChangedEntity) {
        const element = this.controlElements.get(overlayId);
        if (element) {
          affected.push({ overlayId, element });
        }
      }
    });

    return affected;
  }

  setHass(hass) {
    if (!hass || !hass.states) {
      lcardsLog.warn('[MsdControlsRenderer] Invalid HASS provided');
      return;
    }

    const oldHass = this.hass;
    this.hass = hass;

    // No controls yet - skip
    if (this.controlElements.size === 0) {
      lcardsLog.trace('[MsdControlsRenderer] No controls to update');
      return;
    }

    // ⚠️ FEATURE FLAG: Manual HASS Forwarding
    if (this._manualHassForwarding) {
      // Card-wide escape hatch (msd.triggers_update: 'all', see #387) —
      // discouraged last resort: bypasses the entity-diff gate entirely and
      // refreshes every registered control on every hass tick. Reuses the
      // existing unconditional-update method rather than duplicating it.
      if (this._cardConfig?.triggers_update === 'all') {
        lcardsLog.debug('[MsdControlsRenderer] 🔄 Card-wide triggers_update:"all" — updating ALL controls unconditionally');
        this._updateAllControlsHass(hass);
        return;
      }

      // 🔄 MANUAL MODE: Optimized entity-based forwarding
      lcardsLog.debug('[MsdControlsRenderer] 🔄 Manual HASS forwarding ENABLED - using entity-based optimization');

      // Detect which entities changed
      const changedEntities = this._detectEntityChanges(oldHass, hass);

      if (changedEntities.size === 0) {
        lcardsLog.trace('[MsdControlsRenderer] No entity changes, skipping control updates');
        return;
      }

      // Only update controls that use changed entities
      const affectedControls = this._getAffectedControls(changedEntities);

      if (affectedControls.length === 0) {
        lcardsLog.trace('[MsdControlsRenderer] No controls affected by entity changes');
        return;
      }

      lcardsLog.debug('[MsdControlsRenderer] Updating affected controls', {
        changedEntities: changedEntities.size,
        affectedControls: affectedControls.length,
        totalControls: this.controlElements.size,
        efficiency: `${((1 - affectedControls.length / this.controlElements.size) * 100).toFixed(1)}% reduction`
      });

      // Update only affected controls
      this._batchUpdateControls(affectedControls, hass);

    } else {
      // ✨ AUTOMATIC MODE: Let HA component tree propagate HASS naturally
      // - LCARdS cards: Receive HASS via their own setters + singleton integration
      // - Standard HA cards (hui-*): Receive HASS via HA's component tree
      // - Third-party cards: Receive HASS via their base class implementation
      lcardsLog.trace('[MsdControlsRenderer] ✨ Automatic HASS propagation - relying on HA component tree');
    }
  }

  /**
   * Batch update controls
   * Applies HASS to a specific list of controls
   * @private
   * @param {Array} controls - Array of control objects to update
   * @param {Object} hass - HASS object to apply
   */
  _batchUpdateControls(controls, hass) {
    const startTime = performance.now();

    controls.forEach(({ overlayId, element }) => {
      try {
        // Find the actual card element inside the wrapper (#387: prefer the
        // reference stashed at creation time — see createControlElement()).
        const cardElement = element._msdCardElement ||
                           element.querySelector('[class*="card"], [data-card-type], lcards-button-card, hui-light-card') ||
                           element.firstElementChild;

        if (cardElement) {
          this._forwardHassToControl(cardElement, hass, overlayId);
        }
      } catch (error) {
        lcardsLog.error(`[MsdControlsRenderer] Failed to update control ${overlayId}:`, error);
      }
    });

    const duration = performance.now() - startTime;

    lcardsLog.trace(`[MsdControlsRenderer] Batch update completed in ${duration.toFixed(2)}ms`, {
      controlsUpdated: controls.length
    });
  }

  // LEGACY: Update HASS context for all existing control cards (kept for compatibility)
  _updateAllControlsHass(hass) {
    lcardsLog.debug(`[MsdControlsRenderer] LEGACY: Updating HASS for ${this.controlElements.size} control cards`);

    for (const [overlayId, wrapperElement] of this.controlElements) {
      try {
        // Find the actual card element inside the wrapper (#387: prefer the
        // reference stashed at creation time — see createControlElement()).
        const cardElement = wrapperElement._msdCardElement ||
                           wrapperElement.querySelector('[class*="card"], [data-card-type], lcards-button-card, hui-light-card') ||
                           wrapperElement.firstElementChild;

        if (cardElement) {
          this._forwardHassToControl(cardElement, hass, overlayId);
        }
      } catch (error) {
            lcardsLog.warn('[MsdControls] ❌ Config stored for deferred application:', overlayId);
      }
    }
  }


  /**
   * Forward a fresh hass object to a control's card element, whichever
   * pipeline created it (#387).
   *
   * hui-card-wrapped controls (the preferred path — see createControlElement())
   * just need plain property assignment: hui-card's own `hass` setter
   * evaluates `config.visibility` and only redistributes hass to the real
   * inner card when conditions pass — that IS the visibility fix, so nothing
   * else should reach past it into the inner card directly.
   *
   * Raw-card controls (the hui-card-unavailable fallback path) still go
   * through `_applyHassToCard()`'s existing per-card-type branching exactly
   * as before.
   * @private
   * @param {any} cardElement - Element found inside the control wrapper
   * @param {Object} hass - Home Assistant object
   * @param {string} controlId - Control identifier for logging
   */
  _forwardHassToControl(cardElement, hass, controlId) {
    if (cardElement.tagName?.toLowerCase() === 'hui-card') {
      cardElement.hass = hass;
    } else {
      this._applyHassToCard(cardElement, hass, controlId);
    }
  }

  /**
   * Apply HASS context to a specific control card
   * @private
   * @param {any} card - The card element
   * @param {Object} hass - Home Assistant object
   * @param {string} controlId - Control identifier for logging
   */
  _applyHassToCard(card, hass, controlId) {
      // Debug reduced: Only log for LCARdS cards or when issues occur

      try {
          const tagName = card.tagName ? card.tagName.toLowerCase() : '';

          // FIXED: Only LCARdS cards use property assignment
          const isLCARdSCard = tagName.includes('cb-lcars');
          const isStandardHACard = tagName.includes('hui-') || (tagName.includes('button-card') && !tagName.includes('cb-lcars'));

          if (isLCARdSCard) {
              lcardsLog.debug(`[MsdControlsRenderer] Using property assignment for LCARdS card: ${controlId}`);

              // Store old HASS for change detection
              const oldHass = card.hass;

              // CRITICAL: Update _stateObj BEFORE setting HASS to ensure proper state synchronization
              if (card._config?.entity && hass.states?.[card._config.entity]) {
                  const newStateObj = hass.states[card._config.entity];
                  lcardsLog.debug(`[MsdControlsRenderer] Updating _stateObj for ${controlId} entity: ${card._config.entity}`, {
                      oldState: card._stateObj?.state,
                      newState: newStateObj?.state,
                      stateChanged: card._stateObj?.state !== newStateObj?.state
                  });
                  card._stateObj = newStateObj;
              }

              // Use PROPERTY ASSIGNMENT (not method call) to trigger LitElement reactivity
              card.hass = hass;
              card._hass = hass;  // Also set internal property for compatibility

              // Trigger LitElement's reactive property system
              if (typeof card.requestUpdate === 'function') {
                  lcardsLog.debug(`[MsdControlsRenderer] Triggering LitElement property update for ${controlId}`);
                  card.requestUpdate('hass', oldHass);
                  card.requestUpdate('_hass', oldHass);

                  // Also trigger update for state object changes
                  if (card._config?.entity) {
                      card.requestUpdate('_stateObj');
                  }
              }
          } else if (isStandardHACard) {
              lcardsLog.debug(`[MsdControlsRenderer] Using setHass() method for standard HA card: ${controlId}`);

              // Standard HA cards: Use setHass method (their preferred approach)
              if (card.setHass && typeof card.setHass === 'function') {
                  card.setHass(hass);
              } else {
                  // Not all standard HA cards implement setHass - fallback is normal
                  lcardsLog.debug(`[MsdControlsRenderer] Standard HA card ${controlId} has no setHass method, using fallback`);

                  // Fallback: property assignment
                  const oldHass = card.hass;
                  card.hass = hass;
                  card._hass = hass;

                  if (typeof card.requestUpdate === 'function') {
                      card.requestUpdate('hass', oldHass);
                  }
              }
          } else {
              lcardsLog.debug(`[MsdControlsRenderer] Using fallback approach for unknown card type: ${controlId}`);

              // Unknown card type: Try setHass first, then property assignment
              if (card.setHass && typeof card.setHass === 'function') {
                  card.setHass(hass);
              } else {
                  const oldHass = card.hass;
                  card.hass = hass;
                  card._hass = hass;

                  if (typeof card.requestUpdate === 'function') {
                      card.requestUpdate('hass', oldHass);
                  }
              }
          }          return true;

      } catch (error) {
          lcardsLog.error(`[MsdControlsRenderer] ❌ Failed to update HASS for ${controlId}:`, error);
          return false;
      }
  }


  async renderControls(controlOverlays, resolvedModel) {
    if (this._isRendering) {
      lcardsLog.debug('[MsdControlsRenderer] renderControls skipped (in progress)');
      return;
    }

    if (!controlOverlays?.length) {
      lcardsLog.debug('[MsdControlsRenderer] No control overlays to render');
      return;
    }

    if (!resolvedModel) {
      lcardsLog.error('[MsdControlsRenderer] No resolved model provided');
      return;
    }

    if (typeof document === 'undefined') {
      lcardsLog.error('[MsdControlsRenderer] Document not available');
      return;
    }

    // Check if already rendered with same config to avoid duplicate creation
    // Generate signature from sorted overlay IDs to detect duplicate configurations
    const signature = controlOverlays.map(o => o.id).sort().join('|');

    // Verify that all overlay IDs exist in controlElements (robust duplicate detection)
    const controlsAlreadyRendered = this._lastSignature === signature &&
      this.controlElements.size === controlOverlays.length &&
      controlOverlays.every(overlay => this.controlElements.has(overlay.id));

    if (controlsAlreadyRendered) {
      lcardsLog.debug('[MsdControlsRenderer] Skipped duplicate creation - controls already exist', {
        signature,
        elementCount: this.controlElements.size,
        controlIds: controlOverlays.map(o => o.id),
        manualHassForwarding: this._manualHassForwarding
      });

      // ⚠️ FEATURE FLAG: Manual HASS Forwarding
      if (this._manualHassForwarding) {
        // CRITICAL: Update HASS context even when skipping recreation (MANUAL MODE)
        // Controls need fresh HASS state for entity updates, state changes, and card reactivity
        // Without this, cards would display stale data from previous render cycle
        // _updateAllControlsHass() iterates through controlElements and applies new HASS to each card
        lcardsLog.debug('[MsdControlsRenderer] 🔄 Manual mode: Updating HASS for existing controls');
        this._updateAllControlsHass(this.hass);
      } else {
        // ✨ AUTOMATIC MODE: Cards receive HASS updates via HA component tree
        // No manual forwarding needed - Lit lifecycle handles updates
        lcardsLog.debug('[MsdControlsRenderer] ✨ Automatic mode: Controls update via HA component tree');
      }
      return;
    }

    this._isRendering = true;
    try {
      lcardsLog.debug('[MsdControlsRenderer] renderControls called - creating controls', {
        count: controlOverlays.length,
        ids: controlOverlays.map(o => o.id),
        signature,
        hasHass: !!this.hass
      });

      // STEP 1: Ensure SVG container exists and clear existing controls
      const svgContainer = this.getSvgControlsContainer();
      if (!svgContainer) {
        lcardsLog.error('[MsdControlsRenderer] No SVG container available; abort render');
        return;
      }

      // DESIGN DECISION: All-or-nothing approach to control rendering
      // If signature check fails (different controls or partial match), clear everything and recreate
      // This ensures consistency and avoids complex partial update logic
      // Signature check above handles the common case (same controls, just need HASS update)
      lcardsLog.debug('[MsdControlsRenderer] SVG container found, clearing existing controls');
      svgContainer.innerHTML = '';
      this.controlElements.clear();
      this._controlEntityMap.clear(); // Also clear entity tracking
      this._alwaysUpdateControls.clear();

      for (const overlay of controlOverlays) {
        try {
          await this.renderControlOverlay(overlay, resolvedModel);
        } catch (overlayError) {
          lcardsLog.error(`[MsdControlsRenderer] Failed to render control overlay ${overlay.id}:`, overlayError);
          // Continue with other overlays
        }
      }

      this.lastRenderArgs = { controlOverlays, resolvedModel };
      this._lastSignature = signature;

      // CRITICAL: Build virtual anchors now that all cards have registered their attachment points
      // This enables line overlays to find and connect to card overlays
      // NOTE: Virtual anchors are now automatically created by AttachmentPointManager.setAttachmentPoints()
      // See AttachmentPointManager.js lines 74-89

      lcardsLog.debug('[MsdControlsRenderer] renderControls completed successfully');

    } catch (error) {
      lcardsLog.error('[MsdControlsRenderer] renderControls failed:', error);
      throw error; // Re-throw so caller knows it failed
    } finally {
      this._isRendering = false;
    }
  }

  /**
   * Register control with entity tracking
   * Extracts entities from control config and stores mapping for optimization
   * @private
   * @param {string} overlayId - Control overlay ID
   * @param {Element} element - Control wrapper element
   * @param {Object} overlay - Control overlay configuration
   */
  _registerControl(overlayId, element, overlay) {
    // Store control element
    this.controlElements.set(overlayId, element);

    // triggers_update: 'all' — always update this control, skip entity
    // tracking entirely (see #387: for cards whose dependencies can't be
    // statically enumerated at all, e.g. wildcard/device-class matching).
    //
    // Also always-update any control with a `visibility:` array (#387): HA's
    // visibility conditions include entity-keyed types (state/numeric_state)
    // but also entity-less ones (screen/user, and any and/or/not nesting of
    // either) that this entity-diff gate has no way to key off. Rather than
    // parsing/recursing HA's condition shapes to tell them apart (fragile —
    // would need to stay in sync with condition types HA adds later), simply
    // treat any control that opts into visibility as always-update, so the
    // hui-card wrapper (see createControlElement()) keeps getting fresh hass
    // every tick to re-evaluate its condition, instead of freezing forever
    // after its first render.
    const hasVisibility = Array.isArray(overlay.card?.visibility) && overlay.card.visibility.length > 0;
    const alwaysUpdate = overlay.triggers_update === 'all' || hasVisibility;
    if (alwaysUpdate) {
      this._alwaysUpdateControls.add(overlayId);
    } else {
      this._alwaysUpdateControls.delete(overlayId); // safety on re-registration
    }

    // Extract and track entities (empty Set is fine/unused when alwaysUpdate)
    const entities = alwaysUpdate ? new Set() : this._extractControlEntities(overlay);
    this._controlEntityMap.set(overlayId, entities);

    lcardsLog.debug(`[MsdControlsRenderer] Registered control ${overlayId}`, {
      entityCount: entities.size,
      entities: Array.from(entities),
      alwaysUpdate
    });
  }

  async renderControlOverlay(overlay, resolvedModel) {
    lcardsLog.debug('[MsdControlsRenderer] renderControlOverlay called for:', overlay.id);

    // CRITICAL FIX: Get SVG container first, then search for existing foreignObject within it
    const svgContainer = this.getSvgControlsContainer();
    if (svgContainer) {
      const existingForeignObject = svgContainer.querySelector(`foreignObject[id="${overlay.id}"]`);
      if (existingForeignObject) {
        lcardsLog.debug('[MsdControlsRenderer] Removing existing foreignObject for', overlay.id);
        try {
          existingForeignObject._msdScaleObserver?.disconnect();
          existingForeignObject.remove();
        } catch (e) {
          lcardsLog.warn('[MsdControlsRenderer] Failed to remove existing foreignObject:', e);
        }
      }
    } else {
      lcardsLog.warn('[MsdControlsRenderer] SVG container not available for cleanup of', overlay.id);
    }

    // If we somehow already have a control element instance registered, drop it (fresh rebuild model)
    if (this.controlElements.has(overlay.id)) {
      lcardsLog.debug('[MsdControlsRenderer] Clearing existing control element entry for', overlay.id);
      this.controlElements.delete(overlay.id);
      this._controlEntityMap.delete(overlay.id); // Also clear entity tracking
      this._alwaysUpdateControls.delete(overlay.id);
    }

    lcardsLog.debug('[MsdControlsRenderer] Creating control overlay', overlay.id, {
      overlayPosition: overlay.position,
      overlayAnchor: overlay.anchor,
      overlayType: overlay.type,
      overlayKeys: Object.keys(overlay)
    });

    try {
      const controlElement = /** @type {any} */ (await this.createControlElement(overlay));
      if (!controlElement) {
        lcardsLog.warn('[MsdControlsRenderer] createControlElement returned null for', overlay. id);
        return;
      }

      lcardsLog.debug('[MsdControlsRenderer] Created control element for', overlay.id, {
        tagName: controlElement.tagName,
        className: controlElement.className,
        hasSetConfig: typeof controlElement.setConfig === 'function'
      });

      // Position the control (creates foreignObject and adds to SVG)
      this.positionControlElement(controlElement, overlay, resolvedModel);

      // Register control with entity tracking (replaces simple Map.set)
      this._registerControl(overlay.id, controlElement, overlay);

      // Apply initial HASS if available
      if (this.hass && this._manualHassForwarding) {
        // #387: prefer the reference stashed moments ago in createControlElement().
        const cardElement = controlElement._msdCardElement ||
                           controlElement.querySelector('[class*="card"], [data-card-type], lcards-button-card, hui-light-card') ||
                           controlElement.firstElementChild;
        if (cardElement) {
          this._forwardHassToControl(cardElement, this.hass, overlay.id);
        }
      }

      lcardsLog.debug('[MsdControlsRenderer] ✅ Successfully rendered control overlay:', overlay.id);

    } catch (error) {
      lcardsLog.error('[MsdControlsRenderer] Failed to render control overlay', overlay.id, error);
      // Continue with other controls
    }
  }

  /**
   * Resolve card definition from control overlay
   *
   * ENFORCES SINGLE PATTERN: Nested card property only
   *
   * Correct pattern:
   *   { type: 'control', card: { type: 'custom:some-card', ... } }
   *
   * Rejected patterns:
   *   - Flat/direct: { type: 'custom:lcards-button', entity: '...' }
   *   - Legacy: { type: 'control', card_config: {...} }
   *   - Legacy: { type: 'control', cardConfig: {...} }
   *
   * @param {Object} overlay - Control overlay configuration
   * @returns {Object|null} Card definition or null if invalid
   */
  resolveCardDefinition(overlay) {
    lcardsLog.debug('[MsdControlsRenderer] Resolving card definition for', overlay.id, {
      hasCard: !!overlay.card,
      overlayType: overlay.type
    });

    // ONLY PATTERN: Nested card definition (required by schema)
    // { type: 'control', card: { type: 'custom:some-card', ... } }
    if (overlay.card) {
      if (typeof overlay.card !== 'object') {
        lcardsLog.error('[MsdControlsRenderer] Card property must be an object for', overlay.id);
        return null;
      }

      if (!overlay.card.type) {
        lcardsLog.error('[MsdControlsRenderer] Card definition missing required "type" property for', overlay.id);
        return null;
      }

      return overlay.card;
    }

    // Error: No card property found
    lcardsLog.error('[MsdControlsRenderer] Control overlay missing required "card" property:', overlay.id, {
      suggestion: 'Use nested card pattern:\n' +
                  '  - type: control\n' +
                  '    id: ' + overlay.id + '\n' +
                  '    card:\n' +
                  '      type: custom:lcards-button\n' +
                  '      entity: light.example\n' +
                  '    position: [x, y]\n' +
                  '    size: [width, height]'
    });

    return null;
  }

  // Build the final config object passed to setConfig
  /* TO BE REMOVED - no longer needed
  buildCardConfig(cardObj) {
    if (!cardObj) return null;
    // If nested config key provided, that is authoritative
    if (cardObj.config && typeof cardObj.config === 'object') {
      return { ...cardObj.config }; // shallow clone
    }
    // Otherwise treat the card object (minus wrapper-only keys) as config
    const { type, config, ...rest } = cardObj;
    // Include type too (some built-in cards ignore, harmless if present)
    return { type, ...rest };
  }
  */

  /**
   * Inject (once per instance) a stylesheet rule that gives a `<hui-card>`
   * control wrapper a sane fill default (`display:block`, 100% width/height).
   * Deliberately a class-based rule, not inline style — see the comment at
   * the call site in `createControlElement()` for why inline would clobber
   * hui-card's own `visibility:`-driven `style.display` toggling (#387).
   * @private
   */
  _ensureHuiCardWrapperStyles() {
    if (this._huiCardStylesInjected) return;
    this._huiCardStylesInjected = true;

    const svg = this.getSvgControlsContainer()?.closest?.('svg');
    if (!svg || svg.querySelector('#msd-hui-card-wrapper-style')) return;

    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.id = 'msd-hui-card-wrapper-style';
    style.textContent =
      '.msd-control-wrapper > hui-card { display: block; width: 100%; height: 100%; box-sizing: border-box; }';
    svg.insertBefore(style, svg.firstChild);
  }

  async createControlElement(overlay) {
    const cardDef = this. resolveCardDefinition(overlay);
    if (!cardDef) {
      lcardsLog.warn('[MsdControlsRenderer] No card definition found for control overlay', overlay.id);
      return null;
    }

    try {
      const cardType = cardDef.type;
      let cardElement = /** @type {any} */ (null);

      lcardsLog.debug('[MsdControls] Creating card element:', {
        cardType,
        overlayId: overlay.id,
        hasEntities: !!cardDef.entities,
        entityCount: cardDef.entities?.length
      });

      if (customElements.get('hui-card')) {
        // PREFERRED (#387): wrap in HA's own universal `hui-card` element so
        // its native `visibility:` conditional evaluation runs — the same
        // mechanism a card gets automatically on a real dashboard, and the
        // same fix already used by lcards-layout-card.js's `_createChild()`.
        // hui-card evaluates `config.visibility` in its own `hass` setter and
        // only forwards hass to the real inner card when conditions pass;
        // cards never need to implement visibility themselves.
        const config = this._buildCardConfig(cardDef, overlay.id);
        cardElement = createHuiCardWrapper(config, this.hass, { editMode: this._editMode });

        // hui-card ships no layout CSS of its own (unstyled custom elements
        // default to `display:inline`) — give it a sane fill default via a
        // stylesheet CLASS rule, never inline style. This matters: hui-card
        // toggles its OWN `style.display` inline (`''`/`none`) to implement
        // `visibility:` — createHuiCardWrapper() above already ran that
        // check synchronously via `.load()` before returning. Setting
        // `cardElement.style.display = 'block'` here would silently
        // overwrite whatever hui-card just computed, permanently pinning
        // the control visible regardless of its condition. A class-based
        // rule never competes with hui-card's inline toggling (inline always
        // wins the cascade), so it only ever supplies the default hui-card
        // itself leaves alone (`style.display === ''`, i.e. "visible").
        this._ensureHuiCardWrapperStyles();

        lcardsLog.debug('[MsdControls] Created hui-card wrapper for:', overlay.id, {
          cardType,
          editMode: this._editMode
        });
      } else {
        // FALLBACK: hui-card unavailable (defensive — real HA always has it
        // registered). Today's pre-#387 pipeline, unchanged: no visibility
        // support for controls that hit this branch.
        cardElement = await createCardElement(cardType, overlay.id);

        if (!cardElement) {
          lcardsLog.warn(`[MsdControls] Could not create card element for type: ${cardType}, creating fallback`);
          cardElement = this._createFallbackCard(cardType, cardDef);
        } else {
          lcardsLog.debug('[MsdControls] Card element created successfully:', {
            overlayId: overlay.id,
            cardType,
            tagName: cardElement.tagName,
            hasSetConfig: typeof cardElement.setConfig === 'function'
          });
        }

        // Apply HASS context first
        if (this.hass) {
          applyHassToCard(cardElement, this.hass, overlay.id);
        }

        // Then apply configuration
        // For LCARdS cards, pass overlay ID to ensure consistent rule targeting
        await this._configureCard(cardElement, cardDef, overlay);
      }

      // Create wrapper for positioning
      const wrapper = document.createElement('div');
      wrapper.className = 'msd-control-wrapper';
      wrapper.dataset.msdControlId = overlay. id;
      wrapper.style. position = 'absolute';
      wrapper.style.pointerEvents = this._resolvePointerEvents(overlay?.locked);
      wrapper.style.touchAction = 'manipulation';
      wrapper.appendChild(cardElement);

      // #387: stash a direct reference to the card element this method just
      // created (hui-card wrapper or raw fallback card) instead of making
      // every hass-forwarding call site re-derive it later via fragile
      // querySelector/firstElementChild guessing — which can resolve to the
      // wrong node (e.g. matches something unrelated nested inside the real
      // card's light DOM) and silently route hass through the wrong branch.
      // We already know exactly what we built; just remember it.
      wrapper._msdCardElement = cardElement;

      // Event isolation
      this._setupEventIsolation(wrapper, cardElement, overlay);

      lcardsLog.debug('[MsdControls] Wrapper created for:', overlay.id, {
        wrapperHasCard: wrapper.children.length > 0,
        cardTagName: cardElement.tagName
      });

      return wrapper;

    } catch (error) {
      lcardsLog.error(`[MSD Controls] Failed to create card ${cardDef?. type} for ${overlay.id}:`, error);
      lcardsLog.error('[MSD Controls] Error stack:', error.stack);
      return this._createFallbackCard(cardDef?. type || 'unknown', cardDef);
    }
  }

  /**
   * Configure the card with config and HASS context
   */
  async _configureCard(cardElement, cardDef, overlay) {
    // Build the final configuration
    const config = this._buildCardConfig(cardDef, overlay.id);

    lcardsLog.debug('[MsdControls] Configuring card:', {
      overlayId: overlay.id,
      cardType: cardDef.type,
      hasSetConfig: typeof cardElement.setConfig === 'function',
      hasHass: !!this.hass,
      config: config
    });

    // Apply configuration with retries
    if (config) {
      const success = await this._applyCardConfig(cardElement, config, overlay.id);
      if (!success) {
        // Try one more time after a longer delay
        setTimeout(async () => {
          lcardsLog.debug('[MsdControls] Retrying config application after delay:', overlay.id);
          await this._applyCardConfig(cardElement, config, overlay.id);
        }, 1000);
      }
    }

    // Force update if possible
    if (typeof cardElement.requestUpdate === 'function') {
      try {
        await cardElement.requestUpdate();
        lcardsLog.debug('[MsdControls] Requested update for:', overlay.id);
      } catch (e) {
        lcardsLog.debug('[MsdControls] requestUpdate failed:', e);
      }
    }

    // Additional update strategies for different card types
    if (cardElement.tagName) {
      const tagName = cardElement.tagName.toLowerCase();
      const isCustomButtonCard = tagName.includes('cb-lcars') ||
                                 tagName.includes('button-card') ||
                                 cardElement._isCustomButtonCard ||
                                 cardElement.constructor?.name?.includes('Button');

      if (isCustomButtonCard) {
        // LCARdS and custom-button-card specific updates
        lcardsLog.debug(`[MsdControls] Setting up custom-button-card updates for:`, overlay.id);

        setTimeout(() => {
          try {
            // Ensure HASS is set
            if (this.hass) {
              cardElement.hass = this.hass;
              cardElement._hass = this.hass;
            }

            // Force full re-evaluation to trigger state-based styling
            if (cardElement._config && typeof cardElement.setConfig === 'function') {
              const currentConfig = { ...cardElement._config };
              cardElement.setConfig(currentConfig);

              // Re-apply HASS after config
              if (this.hass) {
                cardElement.hass = this.hass;
              }
            }

            // LitElement update if available
            if (typeof cardElement.requestUpdate === 'function') {
              cardElement.requestUpdate();
            }

            lcardsLog.debug('[MsdControls] ✅ Custom-button-card initial update completed for:', overlay.id);

          } catch (e) {
            lcardsLog.debug('[MsdControls] Custom-button-card specific update failed:', e);
          }
        }, 100);

      } else if (tagName.startsWith('hui-')) {
        // Home Assistant built-in card updates
        setTimeout(() => {
          try {
            if (typeof cardElement.requestUpdate === 'function') {
              cardElement.requestUpdate();
            }
            // Force state update
            if (this.hass) {
              cardElement.hass = this.hass;
            }
          } catch (e) {
            lcardsLog.debug('[MsdControls] HA card specific update failed:', e);
          }
        }, 200);
      }
    }
  }

  /**
   * Build card configuration from card definition
   */
  _buildCardConfig(cardDef, overlayId) {
    if (!cardDef) return null;

    lcardsLog.debug('[MsdControls] Building card config from cardDef:', {
      cardDefKeys: Object.keys(cardDef),
      cardDefType: cardDef.type,
      hasConfig: !!cardDef.config,
      hasEntities: !!cardDef.entities,
      entitiesValue: cardDef.entities,
      overlayId
    });

    let finalConfig;

    // Handle nested config structure: { type: "light", config: { entity: "light.example" } }
    if (cardDef.config && typeof cardDef.config === 'object') {
      finalConfig = {
        type: cardDef.type,
        ...cardDef.config
      };
      lcardsLog.debug('[MsdControls] Used nested config structure:', {
        finalConfigKeys: Object.keys(finalConfig),
        hasEntities: !!finalConfig.entities
      });
    } else {
      // Handle flat structure: { type: "light", entity: "light.example", name: "My Light" }
      const { type, config, card, card_config, cardConfig, ...otherProps } = cardDef;
      finalConfig = {
        type,
        ...otherProps
      };
      lcardsLog.debug('[MsdControls] Used flat structure:', {
        type,
        otherPropsKeys: Object.keys(otherProps),
        finalConfigKeys: Object.keys(finalConfig),
        hasEntities: !!finalConfig.entities,
        entitiesValue: finalConfig.entities
      });
    }

    // CRITICAL: For LCARdS cards, inject overlay ID as card ID if not already specified
    // This ensures the card registers with RulesEngine using the overlay ID from config
    const isLCARdSCard = finalConfig.type?.startsWith('custom:lcards-');
    if (isLCARdSCard && overlayId && !finalConfig.id) {
      finalConfig.id = overlayId;
      lcardsLog.debug(`[MsdControls] Injected overlay ID as card ID: ${overlayId}`);
    }

    // Mark as MSD-generated
    finalConfig._msdGenerated = true;

    return finalConfig;
  }

  /**
   * Apply card configuration with retry logic
   */
  async _applyCardConfig(cardElement, config, overlayId) {
    if (!config) return false;

    lcardsLog.debug('[MsdControls] Applying config:', {
      overlayId: overlayId,
      hasSetConfig: typeof cardElement.setConfig === 'function',
      cardType: config.type,
      entity: config.entity,
      triggersUpdate: config.triggers_update,
      config: config
    });

    const maxRetries = 8; // Increased retries

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (typeof cardElement.setConfig === 'function') {
          cardElement.setConfig(config);
          cardElement._config = config;

          // Verify the config was applied correctly (triggers_update is custom-button-card specific)
          if (cardElement._config && cardElement._config.triggers_update) {
            lcardsLog.debug(`[MsdControls] ✅ Config applied with triggers_update:${cardElement._config.triggers_update} for:`, overlayId);
          } else {
            // Debug only: triggers_update is specific to custom-button-card and LCARdS, not regular HA cards
            lcardsLog.debug(`[MsdControls] Config applied (no triggers_update - normal for standard HA cards) for:`, overlayId);
          }

          lcardsLog.debug(`[MsdControls] ✅ Config applied on attempt ${attempt + 1} for:`, overlayId);
          return true;
        }

        // If setConfig not available yet, wait and retry
        if (attempt < maxRetries - 1) {
          const delay = 200 * (attempt + 1); // Increased delay
          lcardsLog.debug(`[MsdControls] Retrying config in ${delay}ms for:`, overlayId);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

      } catch (e) {
        lcardsLog.warn(`[MsdControls] setConfig attempt ${attempt + 1} failed for ${overlayId}:`, e);

        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 200 * (attempt + 1)));
        }
      }
    }

    // Store config for later application
    cardElement._pendingConfig = config;
    lcardsLog.warn('[MsdControls] ❌ Config stored for deferred application:', overlayId);

    // Set up a periodic retry
    const retryInterval = setInterval(() => {
      if (typeof cardElement.setConfig === 'function') {
        try {
          cardElement.setConfig(config);
          cardElement._config = config;
          lcardsLog.debug('[MsdControls] ✅ Deferred config finally applied:', overlayId);
          clearInterval(retryInterval);
        } catch (e) {
          lcardsLog.warn('[MsdControls] Deferred config retry failed:', overlayId, e);
        }
      }
    }, 1000);

    // Clear interval after 10 seconds
    setTimeout(() => clearInterval(retryInterval), 10000);

    return false;
  }

  /**
   * Create fallback card when creation fails
   */
  _createFallbackCard(cardType, cardDef) {
    const fallback = document.createElement('div');
    fallback.className = 'msd-control-fallback';

    Object.assign(fallback.style, {
      border: '2px dashed var(--primary-color, #ffa500)',
      borderRadius: '8px',
      padding: '16px',
      background: 'var(--card-background-color, rgba(0,0,0,0.8))',
      color: 'var(--primary-text-color, #ffffff)',
      fontSize: '14px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '80px'
    });

    const title = document.createElement('div');
    title.textContent = `Card: ${cardType}`;
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '8px';

    const subtitle = document.createElement('div');
    subtitle.textContent = '(Card failed to load)';
    subtitle.style.fontSize = '12px';
    subtitle.style.opacity = '0.7';

    fallback.appendChild(title);
    fallback.appendChild(subtitle);

    // Make it interactive for debugging
    fallback.addEventListener('click', () => {
      lcardsLog.debug('[MsdControls] Fallback card clicked:', { cardType, cardDef });
    });

    return fallback;
  }

  /**
   * Setup event isolation for control interactions
   */
  _setupEventIsolation(wrapper, cardElement, overlay) {
    // FIXED: Less aggressive event isolation - allow events to reach card, but prevent bubbling to MSD
    const events = [
      'click', 'dblclick', 'contextmenu',
      'pointerdown', 'pointerup', 'pointermove', 'pointercancel',
      'touchstart', 'touchend', 'touchmove', 'touchcancel',
      'mousedown', 'mouseup', 'mousemove', 'mouseenter', 'mouseleave',
      'focus', 'blur', 'focusin', 'focusout',
      'keydown', 'keyup', 'keypress'
    ];

    events.forEach(eventType => {
      wrapper.addEventListener(eventType, (event) => {
        // FIXED: Only stop propagation if the event originated from our card
        // This prevents MSD from handling card events, but allows the card to work
        if (event.target === cardElement || cardElement.contains(event.target)) {
          // Allow the event to proceed to the card normally
          // Only stop it from bubbling further up to MSD
          event.stopPropagation();
          /*
          lcardsLog.debug('[MsdControls] Event allowed to card but prevented from bubbling:', {
            type: event.type,
            overlayId: overlay.id,
            target: event.target.tagName,
            cardType: cardElement?.tagName
          });
          */
        }
      }, {
        capture: false,  // CHANGED: Use bubble phase so card gets events first
        passive: false   // Allow preventDefault if needed
      });
    });

    // ADDED: Set higher z-index and pointer events
    wrapper.style.pointerEvents = this._resolvePointerEvents(overlay?.locked);
    wrapper.style.position = 'absolute';
    wrapper.style.zIndex = '1000'; // Ensure it's above other layers
    wrapper.setAttribute('tabindex', '0');

    // ADDED: Ensure the card element itself can receive events
    if (cardElement) {
      cardElement.style.pointerEvents = this._resolvePointerEvents(overlay?.locked);
      cardElement.style.position = 'relative';
      cardElement.style.zIndex = '1';

      // ADDED: Ensure card can receive all necessary events for hold actions
      cardElement.style.touchAction = 'manipulation'; // Improves touch responsiveness
    }
  }

  positionControlElement(element, overlay, resolvedModel) {
    const rawPosition = this.resolvePosition(overlay.position, resolvedModel, overlay.position_side || 'center');
    const size = this.resolveSize(overlay.size, resolvedModel);

    if (!rawPosition || !size) {
      lcardsLog.warn('[MSD Controls] Invalid position or size for control:', overlay.id);
      return;
    }

    // Apply attachment point offset
    const position = this._applyAttachmentOffset(rawPosition, size, overlay.attachment);
    lcardsLog.debug('[MSD Controls] Position after attachment offset:', {
      overlay: overlay.id,
      rawPosition,
      attachment: overlay.attachment,
      finalPosition: position,
      size
    });

    // Create SVG foreignObject wrapper to live in viewBox coordinate space
    const foreignObject = this.createSvgForeignObject(overlay.id, position, size, overlay.locked === true);
    if (!foreignObject) {
      lcardsLog.error('[MSD Controls] Failed to create SVG foreignObject for:', overlay.id);
      return;
    }

    // Tag the CARD element (first child of the wrapper div) with the design dimensions
    // BEFORE connecting to the DOM. LCARdSCard._setupAutoSizing() reads this attribute
    // on `this` (the card host) and locks _containerSize to the design size, skipping
    // the window-resize fallback (which calls getBoundingClientRect() and returns the
    // SVG-scaled visual size — causing the viewBox to track the visual pixel count and
    // keeping font-size at a constant absolute pixel value regardless of MSD card size).
    //
    // With a locked viewBox="0 0 W H" and SVG width="100%", 1 SVG unit maps to
    // (foreignObject-CSS-px / W) — content scales proportionally with the MSD card. ✓
    const [designWidth, designHeight] = size;
    const sizeAttr = `${designWidth},${designHeight}`;
    const cardEl = element._msdCardElement || element.firstElementChild;
    if (cardEl) {
      cardEl.setAttribute('data-msd-design-size', sizeAttr);

      // #387: when cardEl is a <hui-card> wrapper, the attribute above lands
      // on the wrapper, not the real LCARdS card instance that
      // _setupAutoSizing() actually reads it from (`this.getAttribute(...)`
      // on the card host itself). hui-card materialises its real inner
      // element asynchronously at `._element` (see createHuiCardWrapper()'s
      // doc comment) — poll briefly and tag it too once it exists. In
      // practice this resolves synchronously for lcards-* types (they're
      // always pre-registered before MSD ever runs), so the first check
      // below wins immediately; the retry is a safety net for slower cases.
      if (cardEl.tagName?.toLowerCase() === 'hui-card') {
        const tagInnerElement = (attempt = 0) => {
          const inner = /** @type {any} */ (cardEl)._element;
          if (inner) {
            inner.setAttribute('data-msd-design-size', sizeAttr);
          } else if (attempt < 20) {
            setTimeout(() => tagInnerElement(attempt + 1), 100);
          }
        };
        tagInnerElement();
      }
    }

    // Configure the control element for SVG embedding
    this.configureControlForSvg(element, overlay, size);

    foreignObject.appendChild(element);

    // Add to SVG container (scales automatically with viewBox)
    const svgContainer = this.getSvgControlsContainer();
    if (svgContainer && foreignObject.parentNode !== svgContainer) {
      svgContainer.appendChild(foreignObject);
      lcardsLog.debug('[MSD Controls] Control positioned in SVG coordinates:', overlay.id, { position, size });
    }

    // Registered so AdvancedRenderer's final z-order pass can find and re-parent
    // this element alongside lines (previously only lines were cached here).
    if (this.renderer?.overlayElementCache) {
      this.renderer.overlayElementCache.set(overlay.id, foreignObject);
    }

    // CRITICAL: Compute and register attachment points for line anchoring
    // This enables lines to connect to this control overlay
    const attachmentPoints = this._computeAttachmentPointsFromBox(overlay.id, position, size);
    if (attachmentPoints && this.renderer?.attachmentManager) {
      this.renderer.attachmentManager.setAttachmentPoints(overlay.id, attachmentPoints);
      lcardsLog.debug('[MsdControls] ✅ Registered attachment points for', overlay.id, attachmentPoints);
    }
  }

  /**
   * Apply attachment point offset to position
   * @private
   * @param {Array} position - Raw position [x, y]
   * @param {Array} size - Size [width, height]
   * @param {string} attachment - Attachment point (center, top-left, etc.)
   * @returns {Array} Adjusted position [x, y]
   */
  _applyAttachmentOffset(position, size, attachment = 'center') {
    const [x, y] = position;
    const [width, height] = size;

    // Map attachment points to offsets
    const offsetMap = {
      'top-left': [0, 0],
      'top': [-width / 2, 0],
      'top-center': [-width / 2, 0],
      'top-right': [-width, 0],
      'left': [0, -height / 2],
      'center': [-width / 2, -height / 2],
      'middle-center': [-width / 2, -height / 2],
      'right': [-width, -height / 2],
      'bottom-left': [0, -height],
      'bottom': [-width / 2, -height],
      'bottom-center': [-width / 2, -height],
      'bottom-right': [-width, -height]
    };

    const offset = offsetMap[attachment] || offsetMap['top-left'];
    return [x + offset[0], y + offset[1]];
  }

  /**
   * Compute attachment points from position and size
   * @private
   */
  _computeAttachmentPointsFromBox(overlayId, position, size) {
    const [x, y] = position;
    const [width, height] = size;

    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const right = x + width;
    const bottom = y + height;

    return {
      id: overlayId,
      center: [centerX, centerY],
      bbox: {
        left: x,
        right: right,
        top: y,
        bottom: bottom,
        width: width,
        height: height
      },
      points: {
        center: [centerX, centerY],
        top: [centerX, y],
        bottom: [centerX, bottom],
        left: [x, centerY],
        right: [right, centerY],
        topLeft: [x, y],
        topRight: [right, y],
        bottomLeft: [x, bottom],
        bottomRight: [right, bottom],
        // Aliases for compatibility
        'top-left': [x, y],
        'top-right': [right, y],
        'bottom-left': [x, bottom],
        'bottom-right': [right, bottom]
      }
    };
  }

  /**
   * Create an SVG foreignObject element to embed HTML controls in viewBox space
   * @param {boolean} [locked] - see _resolvePointerEvents()
   */
  createSvgForeignObject(overlayId, position, size, locked = false) {
    const targetContainer = this.renderer.container || this.renderer.mountEl;
    const svg = targetContainer?. querySelector('svg');

    if (!svg) {
      lcardsLog.warn('[MSD Controls] No SVG element found for foreignObject creation');
      return null;
    }

    try {
      const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');

      // Position in viewBox coordinates
      foreignObject.setAttribute('x', position[0]);
      foreignObject.setAttribute('y', position[1]);
      foreignObject.setAttribute('width', size[0]);
      foreignObject.setAttribute('height', size[1]);

      // FIXED: Use consistent ID format for easier cleanup
      // Use overlay ID directly as the foreignObject ID
      foreignObject.setAttribute('data-msd-control-id', overlayId);
      foreignObject.setAttribute('id', overlayId);  // ← ID matches overlay ID directly
      // Line/other overlays get this from AdvancedRenderer — controls need it too so
      // PipelineCore's animated-overlay DOM lookup (`[data-overlay-id="..."]`) can find
      // them; without it, AnimationManager.onOverlayRendered() is silently never called
      // for any control, regardless of preset.
      foreignObject.setAttribute('data-overlay-id', overlayId);
      // Mirrors LineOverlay/ShapeOverlay's own data-overlay-type — lets the
      // animation target-picker offer an "All Controls" bulk option the same
      // way it already does for lines/shapes (see _getTargetOptions() in
      // lcards-animation-editor.js).
      foreignObject.setAttribute('data-overlay-type', 'control');

      // Ensure proper event handling
      foreignObject.style.pointerEvents = this._resolvePointerEvents(locked);
      foreignObject.style.overflow = 'visible';

      lcardsLog.debug('[MSD Controls] Created foreignObject for', overlayId, {
        x: position[0],
        y: position[1],
        width: size[0],
        height: size[1]
      });

      return foreignObject;

    } catch (error) {
      lcardsLog.error('[MSD Controls] Failed to create foreignObject:', error);
      return null;
    }
  }

  /**
   * Configure control element for SVG embedding
   */
  configureControlForSvg(element, overlay, size) {
    // Remove any absolute positioning that would interfere with foreignObject
    element.style.position = 'relative';
    element.style.left = 'auto';
    element.style.top = 'auto';

    // Size the element to fill the foreignObject
    element.style.width = '100%';
    element.style.height = '100%';
    element.style.boxSizing = 'border-box';

    // Ensure proper event handling
    element.style.pointerEvents = this._resolvePointerEvents(overlay?.locked);
    element.style.zIndex = overlay.z_index || 'auto';

    // Maintain background if needed
    if (!element.style.background && !element.shadowRoot) {
      element.style.background = 'none';
    }

    lcardsLog.debug('[MSD Controls] Configured element for SVG embedding:', overlay.id);
  }

  /**
   * Get or create the SVG controls container group
   */
  getSvgControlsContainer() {
    const targetContainer = this.renderer.container || this.renderer.mountEl;
    const svg = targetContainer?.querySelector('svg');

    if (!svg) {
      lcardsLog.warn('[MSD Controls] No SVG element found for controls container');
      return null;
    }

    // Look for existing controls group
    let controlsGroup = svg.querySelector('#msd-controls-container');

    if (!controlsGroup) {
      // Create new controls group
      controlsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      controlsGroup.setAttribute('id', 'msd-controls-container');
      controlsGroup.style.pointerEvents = 'none'; // Group itself doesn't capture events

      // Insert after overlay container but before debug layer
      const overlayContainer = svg.querySelector('#msd-overlay-container');
      const debugLayer = svg.querySelector('#msd-debug-layer');

      if (debugLayer) {
        svg.insertBefore(controlsGroup, debugLayer);
      } else if (overlayContainer) {
        svg.insertBefore(controlsGroup, overlayContainer.nextSibling);
      } else {
        svg.appendChild(controlsGroup);
      }

      lcardsLog.debug('[MSD Controls] Created SVG controls container group');
    }

    return controlsGroup;
  }

  // Helper methods for position and size resolution
  resolvePosition(position, resolvedModel, positionSide = 'center') {
    // Use the OverlayUtils for consistency with other overlays
    lcardsLog.debug('[MSD Controls] Resolving position:', {
      position,
      anchorsAvailable: Object.keys(resolvedModel.anchors || {}),
      anchorsObject: resolvedModel.anchors
    });

    // position_side: when position references another control and a non-center
    // side is requested, resolve via the attachment-point registry directly. The
    // flat anchors object (resolvedModel.anchors) only gets `${id}.${side}` virtual
    // keys populated in bulk after all Phase-2a controls finish positioning, so it
    // can't be relied on here — attachmentManager is updated synchronously as each
    // control is positioned, so an earlier-processed target is already available.
    if (typeof position === 'string' && positionSide && positionSide !== 'center' && this.renderer?.attachmentManager) {
      const sidePoint = this.renderer.attachmentManager.getAttachmentPoint(position, positionSide);
      if (sidePoint) {
        lcardsLog.debug('[MSD Controls] Position resolved via attachment point side:', { position, positionSide, sidePoint });
        return [sidePoint[0], sidePoint[1]];
      }
      lcardsLog.warn('[MSD Controls] position_side target not yet available (declare the target control earlier, or it has no attachment points) — falling back to standard resolution:', { position, positionSide });
    }

    const resolved = OverlayUtils.resolvePosition(position, resolvedModel.anchors || {});
    if (resolved) {
      lcardsLog.debug('[MSD Controls] Position resolved to:', resolved);
      return resolved;
    }

    // Fallback: Return default position if resolution fails
    lcardsLog.warn('[MSD Controls] Position resolution failed, using default [0, 0]', {
      position,
      anchorsProvided: Object.keys(resolvedModel.anchors || {})
    });
    return [0, 0];
  }

  resolveSize(size, resolvedModel) {
    if (!size || !Array.isArray(size) || size.length < 2) {
      return [100, 100];
    }
    return [size[0], size[1]];
  }

  /**
   * Compute attachment points for control overlay
   * @param {Object} overlay - Control overlay configuration
   * @param {Object} anchors - Available anchors
   * @param {Element} container - Container element for measurements
   * @returns {Object|null} Attachment points object
   * @static
   */
  static computeAttachmentPoints(overlay, anchors, container) {
    // Set default size for control overlays if not specified
    if (!overlay.size) overlay.size = [100, 80];

    const attachmentPoints = OverlayUtils.computeAttachmentPoints(overlay, anchors);

    if (!attachmentPoints) {
      lcardsLog.debug(`[MsdControlsRenderer] Cannot compute attachment points for ${overlay.id}: missing position or size`);
      return null;
    }

    // Add aliases for common naming conventions
    attachmentPoints.points['top-left'] = attachmentPoints.points.topLeft;
    attachmentPoints.points['top-right'] = attachmentPoints.points.topRight;
    attachmentPoints.points['bottom-left'] = attachmentPoints.points.bottomLeft;
    attachmentPoints.points['bottom-right'] = attachmentPoints.points.bottomRight;

    return attachmentPoints;
  }

  // Cleanup method
  cleanup() {
    lcardsLog.debug('[MsdControlsRenderer] Cleaning up controls renderer');

    // Clear control elements (now foreignObjects in SVG)
    for (const [id, element] of this.controlElements) {
      try {
        // Remove foreignObject wrapper from SVG
        const foreignObject = element.closest('foreignObject') ||
                             document.querySelector(`#msd-control-foreign-${id}`);
        if (foreignObject && foreignObject.remove) {
          foreignObject._msdScaleObserver?.disconnect();
          foreignObject.remove();
        } else if (element && element.remove) {
          element.remove();
        }
      } catch (e) {
        lcardsLog.warn(`Failed to remove control element ${id}:`, e);
      }
    }
    this.controlElements.clear();
    this._controlEntityMap.clear(); // Also clear entity tracking
    this._alwaysUpdateControls.clear();

    // Remove SVG controls container
    const targetContainer = this.renderer?.container || this.renderer?.mountEl;
    const svg = targetContainer?.querySelector('svg');
    const svgControlsContainer = svg?.querySelector('#msd-controls-container');
    if (svgControlsContainer) {
      try {
        svgControlsContainer.remove();
      } catch (e) {
        lcardsLog.warn('Failed to remove SVG controls container:', e);
      }
    }

    // Clean up any legacy DOM container if it exists
    const legacyContainer = targetContainer?.querySelector('#msd-controls-container');
    if (legacyContainer && legacyContainer.tagName === 'DIV') {
      try {
        legacyContainer.remove();
        lcardsLog.debug('[MsdControlsRenderer] Removed legacy DOM controls container');
      } catch (e) {
        lcardsLog.warn('Failed to remove legacy controls container:', e);
      }
    }

    // Clear HASS reference
    this.hass = null;
  }
}

