/**
 * [MsdControlsRenderer] Home Assistant card controls renderer - handles HA card embedding with SVG foreignObject positioning
 * 🎮 Provides sophisticated card creation, HASS context management, and SVG-based positioning for proper scaling
 */

import { OverlayUtils } from '../renderer/OverlayUtils.js';
import { lcardsLog } from '../../utils/lcards-logging.js';

export class MsdControlsRenderer {
  constructor(renderer) {
    this.renderer = renderer;
    this.controlElements = new Map();
    this.hass = null;
    this.lastRenderArgs = null;
    this._isRendering = false;
    this._lastSignature = null;

    // ⚠️ FEATURE FLAG: Manual HASS Forwarding (v1.17.0+)
    // Default: false (automatic propagation via HA component tree)
    // Set to true to enable legacy manual HASS forwarding behavior
    // 
    // Testing: Toggle via console:
    //   const msdCard = document.querySelector('lcards-msd');
    //   msdCard._msdPipeline.coordinator.controlsRenderer._manualHassForwarding = true;
    this._manualHassForwarding = false;

    // DEBUGGING: Log when MsdControlsRenderer is created
    lcardsLog.debug('[MsdControlsRenderer] 🎮 Constructor called', {
      manualHassForwarding: this._manualHassForwarding
    });
  }

  setHass(hass) {
    lcardsLog.debug('[MsdControlsRenderer] setHass called with:', {
      hasHass: !!hass,
      entityCount: hass?.states ? Object.keys(hass.states).length : 0,
      hasLightDesk: !!hass?.states?.['light.desk'],
      lightDeskState: hass?.states?.['light.desk']?.state,
      previousHass: !!this.hass,
      controlElementsCount: this.controlElements.size,
      manualHassForwarding: this._manualHassForwarding
    });

    this.hass = hass;

    // ⚠️ FEATURE FLAG: Manual HASS Forwarding
    if (this._manualHassForwarding) {
      // 🔄 MANUAL MODE: Legacy behavior - explicitly forward HASS to all controls
      // This was necessary in older architecture to ensure controls received updates
      lcardsLog.info('[MsdControlsRenderer] 🔄 Manual HASS forwarding ENABLED - distributing to controls');
      
      if (this.controlElements.size > 0) {
        lcardsLog.debug('[MsdControlsRenderer] Updating HASS context for', this.controlElements.size, 'control cards');
        this._updateAllControlsHass(hass);
      } else {
        lcardsLog.debug('[MsdControlsRenderer] No control elements to update');
      }
    } else {
      // ✨ AUTOMATIC MODE: Let HA component tree propagate HASS naturally
      // - LCARdS cards: Receive HASS via their own setters + singleton integration
      // - Standard HA cards (hui-*): Receive HASS via HA's component tree
      // - Third-party cards: Receive HASS via their base class implementation
      lcardsLog.info('[MsdControlsRenderer] ✨ Automatic HASS propagation ENABLED - relying on HA component tree');
      lcardsLog.debug('[MsdControlsRenderer] Controls will receive HASS via:', {
        lcardsCards: 'LCARdSCard.hass setter + singleton propagation',
        standardHACards: 'HA component tree (hui-* elements)',
        thirdPartyCards: 'Custom card base class implementations',
        controlCount: this.controlElements.size
      });
    }
  }

  // ADDED: Update HASS context for all existing control cards
  _updateAllControlsHass(hass) {
    lcardsLog.debug(`[MsdControlsRenderer] Updating HASS for ${this.controlElements.size} control cards`);

    for (const [overlayId, wrapperElement] of this.controlElements) {
      try {
        // Find the actual card element inside the wrapper
        const cardElement = wrapperElement.querySelector('[class*="card"], [data-card-type], lcards-button-card, hui-light-card') ||
                           wrapperElement.firstElementChild;

        if (cardElement) {
          this._applyHassToCard(cardElement, hass, overlayId);
        }
      } catch (error) {
            lcardsLog.warn('[MsdControls] ❌ Config stored for deferred application:', overlayId);
      }
    }
  }


  /**
   * Apply HASS context to a specific control card
   * @private
   * @param {Element} card - The card element
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
    // ADDED: More comprehensive safety checks
    if (this._isRendering) {
      lcardsLog.debug('[MsdControlsRenderer] renderControls skipped (in progress)');
      return;
    }

    if (!controlOverlays?.length) {
      lcardsLog.debug('[MsdControlsRenderer] No control overlays to render');
      return;
    }

    // ADDED: Validate resolved model
    if (!resolvedModel) {
      lcardsLog.error('[MsdControlsRenderer] No resolved model provided');
      return;
    }

    // ADDED: Validate DOM environment
    if (typeof document === 'undefined') {
      lcardsLog.error('[MsdControlsRenderer] Document not available');
      return;
    }

    // ✅ NEW: Check if already rendered with same config to avoid duplicate creation
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

      // ADDED: Render controls with individual error handling
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

  async renderControlOverlay(overlay, resolvedModel) {
    lcardsLog.debug('[MsdControlsRenderer] renderControlOverlay called for:', overlay.id);

    // CRITICAL FIX: Get SVG container first, then search for existing foreignObject within it
    const svgContainer = this.getSvgControlsContainer();
    if (svgContainer) {
      const existingForeignObject = svgContainer.querySelector(`foreignObject[id="${overlay.id}"]`);
      if (existingForeignObject) {
        lcardsLog.debug('[MsdControlsRenderer] Removing existing foreignObject for', overlay.id);
        try {
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
    }

    lcardsLog.debug('[MsdControlsRenderer] Creating control overlay', overlay.id, {
      overlayPosition: overlay.position,
      overlayAnchor: overlay.anchor,
      overlayType: overlay.type,
      overlayKeys: Object.keys(overlay)
    });

    // ADDED: Wrap in try-catch to prevent one failing card from blocking others
    try {
      const controlElement = await this.createControlElement(overlay);
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

      // Store the wrapper element
      this.controlElements. set(overlay.id, controlElement);

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

  // ADDED: Build the final config object passed to setConfig
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

  // ADDED: Normalize card type to handle HA built-in cards
  _normalizeCardType(cardType) {
    if (!cardType) return null;

    // Handle custom cards
    if (cardType.startsWith('custom:')) {
      return cardType.slice(7); // Remove 'custom:' prefix
    }

    // ADDED: Map HA built-in card types to their actual element names
    // This matches the complete list from AdvancedRenderer._isHomeAssistantCardType
    const builtInCardMap = {
      // Entity cards
      'entities': 'hui-entities-card',
      'entity': 'hui-entity-card',
      'glance': 'hui-glance-card',
      'grid': 'hui-grid-card',

      // Layout cards
      'horizontal-stack': 'hui-horizontal-stack-card',
      'vertical-stack': 'hui-vertical-stack-card',

      // Entity control cards
      'button': 'hui-button-card',
      'light': 'hui-light-card',
      'thermostat': 'hui-thermostat-card',
      'gauge': 'hui-gauge-card',
      'sensor': 'hui-sensor-card',

      // Visualization cards
      'history-graph': 'hui-history-graph-card',
      'picture': 'hui-picture-card',
      'picture-entity': 'hui-picture-entity-card',
      'picture-glance': 'hui-picture-glance-card',
      'picture-elements': 'hui-picture-elements-card',

      // Utility cards
      'conditional': 'hui-conditional-card',
      'markdown': 'hui-markdown-card',
      'media-control': 'hui-media-control-card',
      'alarm-panel': 'hui-alarm-panel-card',
      'weather-forecast': 'hui-weather-forecast-card',
      'shopping-list': 'hui-shopping-list-card',
      'logbook': 'hui-logbook-card',
      'map': 'hui-map-card',
      'iframe': 'hui-iframe-card',

      // Special cards
      'area': 'hui-area-card',
      'energy': 'hui-energy-card',
      'humidifier': 'hui-humidifier-card',
      'statistics-graph': 'hui-statistics-graph-card',
      'tile': 'hui-tile-card',

      // Legacy/other entity cards
      'switch': 'hui-switch-card',
      'binary-sensor': 'hui-binary-sensor-card',
      'cover': 'hui-cover-card',
      'fan': 'hui-fan-card',
      'climate': 'hui-climate-card',
      'input-number': 'hui-input-number-card',
      'input-select': 'hui-input-select-card',
      'input-text': 'hui-input-text-card',
      'lock': 'hui-lock-card',
      'vacuum': 'hui-vacuum-card',
      'water-heater': 'hui-water-heater-card'
    };

    return builtInCardMap[cardType] || cardType;
  }

  async createControlElement(overlay) {
    const cardDef = this. resolveCardDefinition(overlay);
    if (!cardDef) {
      lcardsLog.warn('[MsdControlsRenderer] No card definition found for control overlay', overlay.id);
      return null;
    }

    try {
      const cardType = cardDef.type;
      let cardElement = null;

      const normalizedCardType = this._normalizeCardType(cardType);

      lcardsLog.debug('[MsdControls] Creating card element:', {
        originalType: cardType,
        normalizedType: normalizedCardType,
        overlayId: overlay.id,
        hasEntities: !!cardDef.entities,
        entityCount: cardDef.entities?. length
      });

      // Special handling for HA built-in cards
      if (normalizedCardType. startsWith('hui-')) {
        lcardsLog.debug('[MsdControls] Creating HA built-in card:', normalizedCardType);
        cardElement = await this._createHomeAssistantCard(normalizedCardType, cardDef, overlay);
      } else {
        // Handle custom cards
        lcardsLog.debug('[MsdControls] Creating custom card:', normalizedCardType);
        cardElement = await this._createCustomCard(normalizedCardType, cardDef, overlay);
      }

      // Fallback:  Create a placeholder
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

      // FIXED: Apply HASS context BEFORE configuration
      lcardsLog.debug('[MsdControls] Applying HASS and config:', {
        overlayId: overlay. id,
        hasHass: !!this.hass,
        hasSetConfig: typeof cardElement.setConfig === 'function'
      });

      // Apply HASS context first
      if (this.hass) {
        await this._applyHassContext(cardElement, overlay.id);
      }

      // Then apply configuration
      await this._configureCard(cardElement, cardDef, overlay);

      // Create wrapper for positioning
      const wrapper = document.createElement('div');
      wrapper.className = 'msd-control-wrapper';
      wrapper.dataset.msdControlId = overlay. id;
      wrapper.style. position = 'absolute';
      wrapper.style.pointerEvents = 'auto';
      wrapper.style.touchAction = 'manipulation';
      wrapper.appendChild(cardElement);

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

  // ADDED: Create Home Assistant built-in cards
  async _createHomeAssistantCard(normalizedCardType, cardDef, overlay) {
    lcardsLog.debug('[MsdControls] Creating HA built-in card:', normalizedCardType);

    try {
      // Wait for Home Assistant's card registry to be available
      if (!window.customCards && !document.querySelector('home-assistant')) {
        lcardsLog.warn('[MsdControls] Home Assistant not fully loaded yet');
        return null;
      }

      // Try to get the card constructor from HA's registry
      let cardElement = null;

      // Strategy 1: Use HA's card creation helper if available
      if (window.customElements && window.customElements.get(normalizedCardType)) {
        const CardClass = window.customElements.get(normalizedCardType);
        cardElement = new CardClass();
        lcardsLog.debug('[MsdControls] HA card created via customElements.get:', normalizedCardType);
      } else {
        // Strategy 2: Create via document (HA cards need brief upgrade wait)
        cardElement = document.createElement(normalizedCardType);
        lcardsLog.debug('[MsdControls] HA card created via createElement:', normalizedCardType);

        // HA cards need a brief moment to upgrade after creation
        // Wait for setConfig to become available (shorter timeout than custom cards)
        await this._waitForElementUpgrade(cardElement, 500);

        if (typeof cardElement.setConfig === 'function') {
          lcardsLog.debug('[MsdControls] ✅ HA card upgraded successfully:', normalizedCardType);
        } else {
          lcardsLog.warn('[MsdControls] ⚠️ HA card created but setConfig not available after upgrade:', normalizedCardType);
        }
      }

      // NOTE: HA built-in cards (hui-*) handle their own lifecycle and configuration
      // They need a brief upgrade wait (500ms) for setConfig to become available
      // This is much faster than the old 5s timeout for custom overlays

      return cardElement;

    } catch (error) {
      lcardsLog.warn('[MsdControls] HA card creation failed:', error);
      return null;
    }
  }

  // ADDED: Create custom cards (extracted from existing logic)
  async _createCustomCard(normalizedCardType, cardDef, overlay) {
    let cardElement = null;

    // Check if this is an LCARdS card (lcards-*)
    const isLCARdSCard = normalizedCardType.startsWith('lcards-');

    // Strategy 1: Try direct custom element creation
    if (window.customElements && typeof window.customElements.get === 'function') {
      try {
        const CardClass = window.customElements.get(normalizedCardType);
        if (CardClass) {
          cardElement = new CardClass();
          lcardsLog.debug('[MsdControls] ✅ Strategy 1 SUCCESS: Created via constructor:', normalizedCardType);
        }
      } catch (e) {
        lcardsLog.debug('[MsdControls] Strategy 1 failed:', normalizedCardType, e.message);
      }
    }

    // Strategy 2: Try document.createElement (simplified for LCARdS cards)
    if (!cardElement) {
      lcardsLog.debug('[MsdControls] Strategy 2: Attempting createElement for:', normalizedCardType);
      try {
        cardElement = document.createElement(normalizedCardType);

        // Check if this is actually a custom element (not a generic div)
        if (cardElement.tagName.toLowerCase() === normalizedCardType.toLowerCase()) {
          if (isLCARdSCard) {
            // LCARdS cards are already registered, no upgrade wait needed
            lcardsLog.debug('[MsdControls] ✅ Strategy 2 SUCCESS: Created LCARdS card via createElement:', normalizedCardType);
          } else {
            // Other custom cards might need upgrade waiting
            lcardsLog.debug('[MsdControls] Strategy 2: Created element, checking for upgrade:', normalizedCardType);

            // Quick check with shorter timeout (100ms instead of 5s)
            await this._waitForElementUpgrade(cardElement, 100);

            if (typeof cardElement.setConfig === 'function') {
              lcardsLog.debug('[MsdControls] ✅ Strategy 2 SUCCESS: Created via createElement with upgrade:', normalizedCardType);
            } else {
              lcardsLog.debug('[MsdControls] ❌ Strategy 2 FAILED: Element created but no setConfig after upgrade:', normalizedCardType);
              cardElement = null;
            }
          }
        } else {
          lcardsLog.debug('[MsdControls] ❌ Strategy 2 FAILED: Generic element created, not custom card:', normalizedCardType);
          cardElement = null;
        }
      } catch (e) {
        lcardsLog.debug('[MsdControls] ❌ Strategy 2 FAILED: createElement error for', normalizedCardType, ':', e.message);
      }
    }

    // Strategy 3: Try creating in document body (only for non-LCARdS cards that failed above)
    if (!cardElement && !isLCARdSCard) {
      lcardsLog.debug('[MsdControls] Strategy 3: Attempting body attachment technique for:', normalizedCardType);
      try {
        cardElement = document.createElement(normalizedCardType);
        // Temporarily attach to body to trigger upgrade
        const tempParent = document.createElement('div');
        tempParent.style.position = 'absolute';
        tempParent.style.left = '-10000px';
        document.body.appendChild(tempParent);
        tempParent.appendChild(cardElement);

        lcardsLog.debug('[MsdControls] Strategy 3: Element attached to body, checking for upgrade:', normalizedCardType);
        // Shorter timeout for this fallback strategy
        await this._waitForElementUpgrade(cardElement, 500);

        // Remove from temp parent
        cardElement.remove();
        tempParent.remove();

        if (typeof cardElement.setConfig === 'function') {
          lcardsLog.debug('[MsdControls] ✅ Strategy 3 SUCCESS: Created via body attachment:', normalizedCardType);
        } else {
          lcardsLog.debug('[MsdControls] ❌ Strategy 3 FAILED: Body attachment did not result in working card:', normalizedCardType);
          cardElement = null;
        }
      } catch (e) {
        lcardsLog.debug('[MsdControls] ❌ Strategy 3 FAILED: Body attachment error for', normalizedCardType, ':', e.message);
      }
    }

    if (cardElement) {
      lcardsLog.debug('[MsdControls] 🎉 Custom card creation SUCCESSFUL for:', normalizedCardType);
    } else {
      lcardsLog.debug('[MsdControls] 💥 ALL STRATEGIES FAILED for:', normalizedCardType);
    }

    return cardElement;
  }

  /**
   * Wait for custom element to be fully upgraded
   */
  async _waitForElementUpgrade(element, maxWait = 5000) {
    const startTime = Date.now();

    lcardsLog.debug('[MsdControls] Waiting for element upgrade:', {
      tagName: element.tagName,
      hasSetConfig: typeof element.setConfig === 'function'
    });

    while (Date.now() - startTime < maxWait) {
      // Check if element has been upgraded (has setConfig method)
      if (typeof element.setConfig === 'function') {
        lcardsLog.debug('[MsdControls] Element upgraded successfully:', element.tagName);
        return element;
      }

      // Check if element has upgrade promise
      if (element.updateComplete) {
        try {
          await element.updateComplete;
          if (typeof element.setConfig === 'function') {
            lcardsLog.debug('[MsdControls] Element upgraded via updateComplete:', element.tagName);
            return element;
          }
        } catch (e) {
          // Ignore update errors
        }
      }

      // Force upgrade attempt
      if (window.customElements && window.customElements.upgrade) {
        try {
          window.customElements.upgrade(element);
        } catch (e) {
          // Ignore upgrade errors
        }
      }

      // Short wait before next check
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    lcardsLog.warn('[MsdControls] Element upgrade timeout:', {
      tagName: element.tagName,
      hasSetConfig: typeof element.setConfig === 'function',
      waitTime: Date.now() - startTime
    });

    return element;
  }

  /**
   * Configure the card with config and HASS context
   */
  async _configureCard(cardElement, cardDef, overlay) {
    // Build the final configuration
    const config = this._buildCardConfig(cardDef);

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

    // ENHANCED: Additional update strategies for different card types
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
  _buildCardConfig(cardDef) {
    if (!cardDef) return null;

    lcardsLog.debug('[MsdControls] Building card config from cardDef:', {
      cardDefKeys: Object.keys(cardDef),
      cardDefType: cardDef.type,
      hasConfig: !!cardDef.config,
      hasEntities: !!cardDef.entities,
      entitiesValue: cardDef.entities
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

    // FIXED: More precise detection for LCARdS and custom-button-card based cards
    const cardType = finalConfig.type;
    const isCustomButtonCard = cardType === 'custom:lcards-button-card' ||
                               cardType === 'lcards-button-card' ||
                               cardType === 'custom:button-card' ||
                               cardType === 'button-card';

    // Do NOT treat regular HA built-in cards as custom-button-cards
    const isBuiltInCard = cardType === 'button' || cardType === 'light' || cardType === 'switch' ||
                          cardType.startsWith('hui-');

    if (isCustomButtonCard && !isBuiltInCard && finalConfig.entity) {
      lcardsLog.debug(`[MsdControlsRenderer] Adding triggers_update for LCARdS card with entity: ${finalConfig.entity}`);

      // Ensure triggers_update includes the entity
      if (isCustomButtonCard && !isBuiltInCard) {
        lcardsLog.debug(`[MsdControlsRenderer] Setting triggers_update to 'all' for LCARdS card: ${finalConfig.entity}`);

        // FIXED: Use 'all' so the card sees ALL HASS updates, not just specific entities
        finalConfig.triggers_update = 'all';

        lcardsLog.debug(`[MsdControlsRenderer] LCARdS card configured with triggers_update: 'all'`);
      }

      lcardsLog.debug(`[MsdControlsRenderer] LCARdS card configured with triggers_update:`, finalConfig.triggers_update);
    } else if (isBuiltInCard) {
      lcardsLog.debug(`[MsdControlsRenderer] Skipping triggers_update for built-in HA card: ${cardType}`);
    }    // Mark as MSD-generated
    finalConfig._msdGenerated = true;

    return finalConfig;
  }

  /**
   * Apply HASS context to card element with multiple strategies
   */
  async _applyHassContext(cardElement, overlayId) {
    if (!this.hass) {
      lcardsLog.warn('[MsdControls] ⚠️ No HASS context available for:', overlayId);
      return false;
    }

    lcardsLog.debug('[MsdControls] Starting HASS application strategies for:', overlayId);

    const strategies = [
      // Strategy 1: Direct property assignment
      () => {
        lcardsLog.debug('[MsdControls] HASS Strategy 1: Attempting direct property assignment for:', overlayId);
        try {
          cardElement.hass = this.hass;
          const success = cardElement.hass === this.hass;
          if (success) {
            lcardsLog.debug('[MsdControls] ✅ HASS Strategy 1 SUCCESS: Direct property assignment for:', overlayId);
          } else {
            lcardsLog.debug('[MsdControls] ❌ HASS Strategy 1 FAILED: Property assignment did not stick for:', overlayId);
          }
          return success;
        } catch (e) {
          lcardsLog.debug('[MsdControls] ❌ HASS Strategy 1 FAILED: Property assignment error for', overlayId, ':', e.message);
          return false;
        }
      },

      // Strategy 2: Use property descriptor
      () => {
        lcardsLog.debug('[MsdControls] HASS Strategy 2: Attempting property descriptor for:', overlayId);
        try {
          Object.defineProperty(cardElement, 'hass', {
            value: this.hass,
            writable: true,
            configurable: true
          });
          lcardsLog.debug('[MsdControls] ✅ HASS Strategy 2 SUCCESS: Property descriptor applied for:', overlayId);
          return true;
        } catch (e) {
          lcardsLog.debug('[MsdControls] ❌ HASS Strategy 2 FAILED: Property descriptor error for', overlayId, ':', e.message);
          return false;
        }
      },

      // Strategy 3: Store in private property for later access
      () => {
        lcardsLog.debug('[MsdControls] HASS Strategy 3: Attempting private property fallback for:', overlayId);
        try {
          cardElement._hass = this.hass;
          // Also try setting via property if it exists
          if ('hass' in cardElement) {
            cardElement.hass = this.hass;
            lcardsLog.debug('[MsdControls] HASS Strategy 3: Also set public hass property for:', overlayId);
          }
          lcardsLog.debug('[MsdControls] ✅ HASS Strategy 3 SUCCESS: Private property fallback for:', overlayId);
          return true;
        } catch (e) {
          lcardsLog.debug('[MsdControls] ❌ HASS Strategy 3 FAILED: Private property error for', overlayId, ':', e.message);
          return false;
        }
      }
    ];

    for (const [index, strategy] of strategies.entries()) {
      if (strategy()) {
        lcardsLog.debug(`[MsdControls] 🎉 HASS application SUCCESSFUL via strategy ${index + 1} for:`, overlayId);
        return true;
      }
    }

    lcardsLog.debug('[MsdControls] 💥 ALL HASS STRATEGIES FAILED for:', overlayId);
    return false;
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

          // ADDED: Verify the config was applied correctly (triggers_update is custom-button-card specific)
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
    wrapper.style.pointerEvents = 'auto';
    wrapper.style.position = 'absolute';
    wrapper.style.zIndex = '1000'; // Ensure it's above other layers
    wrapper.setAttribute('tabindex', '0');

    // ADDED: Ensure the card element itself can receive events
    if (cardElement) {
      cardElement.style.pointerEvents = 'auto';
      cardElement.style.position = 'relative';
      cardElement.style.zIndex = '1';

      // ADDED: Ensure card can receive all necessary events for hold actions
      cardElement.style.touchAction = 'manipulation'; // Improves touch responsiveness
    }
  }

  positionControlElement(element, overlay, resolvedModel) {
    const position = this.resolvePosition(overlay.position, resolvedModel);
    const size = this.resolveSize(overlay.size, resolvedModel);

    if (!position || !size) {
      lcardsLog.warn('[MSD Controls] Invalid position or size for control:', overlay.id);
      return;
    }

    // Create SVG foreignObject wrapper to live in viewBox coordinate space
    const foreignObject = this.createSvgForeignObject(overlay.id, position, size);
    if (!foreignObject) {
      lcardsLog.error('[MSD Controls] Failed to create SVG foreignObject for:', overlay.id);
      return;
    }

    // Configure the control element for SVG embedding
    this.configureControlForSvg(element, overlay, size);

    // Insert control into foreignObject
    foreignObject.appendChild(element);

    // Add to SVG container (this will scale automatically with viewBox)
    const svgContainer = this.getSvgControlsContainer();
    if (svgContainer && foreignObject.parentNode !== svgContainer) {
      svgContainer.appendChild(foreignObject);
      lcardsLog.debug('[MSD Controls] Control positioned in SVG coordinates:', overlay.id, { position, size });
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
   */
  createSvgForeignObject(overlayId, position, size) {
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

      // Ensure proper event handling
      foreignObject.style.pointerEvents = 'auto';
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
    element.style.pointerEvents = 'auto';
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
  resolvePosition(position, resolvedModel) {
    // Use the OverlayUtils for consistency with other overlays
    lcardsLog.debug('[MSD Controls] Resolving position:', {
      position,
      anchorsAvailable: Object.keys(resolvedModel.anchors || {}),
      anchorsObject: resolvedModel.anchors
    });

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
          foreignObject.remove();
        } else if (element && element.remove) {
          element.remove();
        }
      } catch (e) {
        lcardsLog.warn(`Failed to remove control element ${id}:`, e);
      }
    }
    this.controlElements.clear();

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

