/**
 * LineOverlay.js
 * Instance-based line overlay with lifecycle management.
 *
 * Architecture:
 * - Extends OverlayBase for lifecycle management
 * - One instance per line overlay (not shared)
 * - Resolves styles fresh on each render (ensures theme token changes are always applied)
 * - Delegates to RouterCore for path computation
 * - Manages marker, gradient, and pattern definitions
 *
 * Lifecycle:
 * 1. Constructor: Initialize caches and RouterCore reference
 * 2. initialize(mountEl): Pre-resolve styles
 * 3. render(): Create line SVG markup with routing
 * 4. update(): Recompute path if anchor positions change
 * 5. destroy(): Cleanup cached definitions
 */

import { OverlayBase } from './OverlayBase.js';
import { OverlayUtils } from '../renderer/OverlayUtils.js';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { ColorUtils } from '../../core/themes/ColorUtils.js';

/**
 * LineOverlay - Instance-based line overlay
 *
 * Features:
 * - Multiple routing strategies (direct, smart, channel, arc)
 * - Advanced styling (gradients, patterns, markers)
 * - Overlay-to-overlay attachment with gap support
 * - Theme token integration
 * - Animation hooks (via AnimationManager)
 * - Segment colors
 * - Dash patterns
 */
// @ts-ignore - LineOverlay extends OverlayBase (type inference issues with duplicate base methods)
export class LineOverlay extends OverlayBase {
  constructor(overlay, systemsManager, routerCore = null) {
    super(overlay, systemsManager);

    // RouterCore is required for line path computation
    this.routerCore = routerCore;

    // Caching for efficient updates

    this._cachedPathResult = null;
    this._cachedAnchors = null;

    // Definition caches for performance
    this.markerCache = new Map();
    this.gradientCache = new Map();
    this.patternCache = new Map();

    lcardsLog.trace(`[LineOverlay] Created instance for overlay ${overlay.id}`);
  }

  /**
   * Initialize line overlay
   * Validates RouterCore availability; style resolution happens fresh on each render.
   *
   * @param {Element} mountEl - Mount element for the overlay
   * @returns {Promise<void>}
   */
  async initialize(mountEl) {
    await super.initialize(mountEl);

    try {
      if (!this.routerCore) {
        lcardsLog.error(`[LineOverlay] RouterCore not available for overlay ${this.overlay.id}`);
        throw new Error('RouterCore not available');
      }

      lcardsLog.trace(`[LineOverlay] Initialized overlay ${this.overlay.id}:`, {
        hasRouterCore: !!this.routerCore,
        routingStrategy: this.overlay.routing_strategy
      });
    } catch (error) {
      lcardsLog.error(`[LineOverlay] Error initializing overlay ${this.overlay.id}:`, error);
      throw error;
    }
  }

  /**
   * Render line overlay
   *
   * @param {Object} overlay - Overlay configuration
   * @param {Object} anchors - Anchor positions
   * @param {Array} viewBox - SVG viewBox dimensions [minX, minY, width, height]
   * @param {Element} svgContainer - SVG container element
   * @param {Object} cardInstance - Card instance (not used for lines)
   * @returns {Object} {markup, actionInfo, overlayId, metadata, provenance}
   */
  render(overlay, anchors, viewBox, svgContainer, cardInstance) {
    if (!this.routerCore) {
      lcardsLog.error(`[LineOverlay] RouterCore not available for overlay ${overlay.id}`);
      return {
        markup: '',
        actionInfo: null,
        overlayId: overlay.id,
        metadata: { error: 'router_unavailable' },
        provenance: this._getRendererProvenance(overlay.id, {
          overlay_type: 'line',
          error: 'router_unavailable'
        })
      };
    }

    // Cache anchors for update checks
    this._cachedAnchors = anchors;

    // Resolve anchor positions with overlay attachment support
    let anchor = this._resolveAnchor(overlay, anchors);
    let anchor2 = this._resolveAttachTo(overlay, anchors);

    lcardsLog.trace(`[LineOverlay] 📍 Resolved anchors for ${overlay.id}: anchor=[${anchor}], anchor2=[${anchor2}], attach_gap=${overlay.attach_gap}, anchor_gap=${overlay.anchor_gap}`);

    // Validate anchors - must have at least anchor or attach_to
    if (!overlay.anchor && !overlay.attach_to) {
      lcardsLog.error(`[LineOverlay] ❌ Line ${overlay.id} requires either 'anchor' or 'attach_to' property. Both are missing.`);
      return {
        markup: '',
        actionInfo: null,
        overlayId: overlay.id,
        metadata: { error: 'missing_anchor_config' },
        provenance: this._getRendererProvenance(overlay.id, {
          overlay_type: 'line',
          error: 'missing_anchor_config',
          message: 'Line overlays require either anchor or attach_to property'
        })
      };
    }

    // Validate primary anchor if specified
    if (overlay.anchor && (!anchor || !Array.isArray(anchor) || anchor.length !== 2)) {
      lcardsLog.error(`[LineOverlay] ❌ Invalid anchor for line ${overlay.id}:`, {
        provided: overlay.anchor,
        resolved: anchor,
        message: `Anchor '${overlay.anchor}' could not be resolved to a valid position [x, y]`
      });
      return {
        markup: '',
        actionInfo: null,
        overlayId: overlay.id,
        metadata: { error: 'invalid_anchor' },
        provenance: this._getRendererProvenance(overlay.id, {
          overlay_type: 'line',
          error: 'invalid_anchor',
          anchor_name: overlay.anchor,
          message: `Anchor '${overlay.anchor}' not found or invalid format`
        })
      };
    }

    // Validate attach_to if specified
    if (overlay.attach_to && (!anchor2 || !Array.isArray(anchor2) || anchor2.length !== 2)) {
      lcardsLog.error(`[LineOverlay] ❌ Invalid attach_to for line ${overlay.id}:`, {
        provided: overlay.attach_to,
        resolved: anchor2,
        message: `Attachment target '${overlay.attach_to}' could not be resolved to a valid position [x, y]`
      });
      return {
        markup: '',
        actionInfo: null,
        overlayId: overlay.id,
        metadata: { error: 'invalid_attach_to' },
        provenance: this._getRendererProvenance(overlay.id, {
          overlay_type: 'line',
          error: 'invalid_attach_to',
          attach_to_name: overlay.attach_to,
          message: `Attachment target '${overlay.attach_to}' not found or invalid format`
        })
      };
    }

    try {
      // Get the computed path from RouterCore
      const routeRequest = this.routerCore.buildRouteRequest(overlay, anchor, anchor2);
      const pathResult = this.routerCore.computePath(routeRequest);

      if (!pathResult?.d) {
        lcardsLog.warn(`[LineOverlay] No path computed for line ${overlay.id}`);
        return {
          markup: '',
          actionInfo: null,
          overlayId: overlay.id,
          metadata: { error: 'no_path_computed' },
          provenance: this._getRendererProvenance(overlay.id, {
            overlay_type: 'line',
            error: 'no_path_computed'
          })
        };
      }

      // Cache path result for updates
      this._cachedPathResult = pathResult;

      // Always resolve fresh — ensures theme token changes are always reflected
      const lineStyle = this._resolveLineStyles(
        overlay.finalStyle || overlay.style || {},
        overlay.id,
        viewBox,
        overlay.corner_style,
        overlay,
        cardInstance
      );

      const animationAttributes = this._prepareAnimationAttributes(overlay, overlay.style || {});

      // Check if this line is selected (for editor highlighting)
      const isSelected = overlay._editorSelected === true;

      // Build SVG group with all features
      const svgParts = [
        this._buildDefinitions(lineStyle, overlay.id),
        this._buildMainPath(pathResult.d, lineStyle, overlay.id, animationAttributes, isSelected),
        this._buildMarkers(pathResult, lineStyle, overlay.id)
      ].filter(Boolean);

      const markup = `<g id="${overlay.id}"
                data-overlay-id="${overlay.id}"
                  data-overlay-type="line"
                  data-routing-strategy="${pathResult.meta?.strategy || 'unknown'}"
                  data-animation-ready="${!!animationAttributes.hasAnimations}">
                ${svgParts.join('\n')}
              </g>`;

      return {
        markup,
        actionInfo: null, // Lines don't have actions
        overlayId: overlay.id,
        metadata: {
          routingStrategy: pathResult.meta?.strategy || 'unknown',
          pathLength: pathResult.d.length,
          hasAnimations: animationAttributes.hasAnimations
        },
        provenance: this._getRendererProvenance(overlay.id, {
          overlay_type: 'line',
          routing_strategy: pathResult.meta?.strategy || 'unknown',
          path_length: pathResult.d.length,
          has_animations: animationAttributes.hasAnimations
        })
      };

    } catch (error) {
      lcardsLog.error(`[LineOverlay] Rendering failed for line ${overlay.id}:`, error);

      const fallback = this._renderFallbackLine(overlay, anchor, anchor2);
      return {
        markup: fallback,
        actionInfo: null,
        overlayId: overlay.id,
        metadata: { error: error.message, fallback: true },
        provenance: this._getRendererProvenance(overlay.id, {
          overlay_type: 'line',
          fallback_used: true,
          error: error.message
        })
      };
    }
  }

  /**
   * Update line overlay
   * Recomputes path if anchor positions changed
   *
   * @param {Element} overlayElement - The overlay's DOM element
   * @param {Object} overlay - Updated overlay configuration
   * @param {*} sourceData - New data from data source (not used for lines)
   * @returns {boolean} Success status
   */
  update(overlayElement, overlay, sourceData) {
    // Lines typically don't update based on data changes
    // They update when anchor positions change, which triggers a full re-render
    lcardsLog.trace(`[LineOverlay] Update called for ${overlay.id} (lines typically re-render on anchor changes)`);
    return true;
  }

  /**
   * Get default animation target for line overlays
   * Lines should animate the <path> element, not the <g> wrapper
   * @returns {Element|null} The path element with data-animatable="true"
   */
  getDefaultAnimationTarget() {
    if (!this.element) return null;

    // Find the path element with data-animatable attribute
    const pathElement = this.element.querySelector('path[data-animatable="true"]');

    if (pathElement) {
      return pathElement;
    }

    // Fallback to any path in the group
    return this.element.querySelector('path');
  }

  /**
   * Destroy line overlay
   * Cleanup cached definitions and resources
   */
  destroy() {
    lcardsLog.trace(`[LineOverlay] Destroying overlay ${this.overlay.id}`);

    // Clear caches
    this._cachedPathResult = null;
    this._cachedAnchors = null;
    this.markerCache.clear();
    this.gradientCache.clear();
    this.patternCache.clear();

    // Call parent destroy
    super.destroy();
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Resolve comprehensive line styling from configuration
   *
   * @private
   * @param {Object} style - Style configuration
   * @param {string} overlayId - Overlay ID for logging
   * @param {Array} viewBox - SVG viewBox for scaling context
   * @param {string} [cornerStyle] - Overlay-level corner_style (miter/round/bevel),
   *   used as the stroke-linejoin fallback when style.line_join isn't explicitly set —
   *   corner_style otherwise only drives RouterCore's rounding decision, so without
   *   this a "bevel" selection never actually produced a visible cut corner.
   * @param {Object} [overlay] - Full overlay config, used when style.color is a
   *   state-color object (see _resolveLineColor) — needs entity/state_attribute/ranges_attribute
   * @param {Object} [cardInstance] - MSD card instance, needed to resolve state-color
   * @returns {Object} Resolved line styles
   */
  _resolveLineStyles(style, overlayId, viewBox, cornerStyle, overlay, cardInstance) {
    // Create component-scoped token resolver using the live singleton (not a stale module import)
    const _resolver = window.lcards?.core?.themeManager?.resolver;
    const resolveToken = (_resolver && typeof _resolver.forComponent === 'function')
      ? _resolver.forComponent('line')
      : null;
    const scalingContext = this._getScalingContext(viewBox);

    const lineStyle = {
      // Core stroke properties with token integration
      color: this._materializeColor(this._resolveLineColor(
        style.color || style.stroke,
        overlay,
        cardInstance,
        'var(--lcars-orange, var(--lcards-orange-medium, #ff7700))',
        resolveToken,
        scalingContext
      ), 'var(--lcars-orange, var(--lcards-orange-medium, #ff7700))', cardInstance),

      width: Number(this._resolveStyleProperty(
        style.width || style.stroke_width,
        'defaultWidth',
        resolveToken,
        2,
        scalingContext
      )),

      opacity: Number(this._resolveStyleProperty(
        style.opacity,
        'effects.opacity.base',
        resolveToken,
        1,
        scalingContext
      )),

      // Advanced stroke styling
      lineCap: (style.line_cap || 'butt').toLowerCase(),
      lineJoin: (style.line_join || cornerStyle || 'miter').toLowerCase(),
      miterLimit: Number(style.miter_limit || 4),

      // Dash patterns
      dashArray: style.dash_array || null,
      dashOffset: Number(style.dash_offset || 0),

      // Fill properties
      fill: this._materializeColor(this._resolveLineColor(
        style.fill,
        overlay,
        cardInstance,
        'none',
        resolveToken,
        scalingContext,
        'defaultFillColor'
      ), 'none', cardInstance),
      fillOpacity: Number(style.fill_opacity || 1),

      // Gradient and pattern support
      gradient: this._parseGradientConfig(style.gradient),
      pattern: this._parsePatternConfig(style.pattern),

      // Markers (arrowheads, dots, etc.)
      markerStart: this._parseMarkerConfig(style.marker_start),
      markerMid: this._parseMarkerConfig(style.marker_mid),
      markerEnd: this._parseMarkerConfig(style.marker_end),

      // Animation states
      animatable: style.animatable !== false
    };

    // Debug logging for dash_array
    if (lineStyle.dashArray) {
      lcardsLog.trace(`[LineOverlay] Dash array configured for ${overlayId}:`, {
        input: style.dash_array,
        resolved: lineStyle.dashArray,
        willRender: true
      });
    }

    return lineStyle;
  }

  /**
   * Resolve a style property using token system with fallback
   *
   * @private
   */
  _resolveStyleProperty(styleValue, tokenPath, resolveToken, fallback, context = {}) {
    if (styleValue !== undefined && styleValue !== null) {
      if (resolveToken && typeof styleValue === 'string' && this._isTokenReference(styleValue)) {
        return resolveToken(styleValue, fallback, context);
      }
      return styleValue;
    }

    if (resolveToken) {
      return resolveToken(tokenPath, fallback, context);
    }

    return fallback;
  }

  /**
   * Resolve style.color, which may be a literal/token string (existing path) or a
   * state-color object (stateColorSchema shape) bound to the overlay's own `entity`
   * — mirrors the button card's entity/state_attribute/ranges_attribute, but scoped
   * per-line since MSD has no single bound entity the way button/slider cards do.
   *
   * Resolution (_resolveEntityStateColor → resolveStateColor) reads
   * cardInstance._entity, cardInstance.config.state_attribute, and
   * cardInstance.config.ranges_attribute internally — all three are temporarily
   * swapped to this overlay's own values for the duration of the (synchronous,
   * no-await) call, then restored, reusing the exact same state-color pipeline
   * buttons/sliders use with zero duplicated resolution logic.
   *
   * @private
   */
  _resolveLineColor(styleValue, overlay, cardInstance, fallback, resolveToken, context = {}, tokenPath = 'defaultColor') {
    if (styleValue === undefined || styleValue === null) {
      // tokenPath is only consulted when styleValue is absent (theme "give me a
      // sensible default" lookup) — callers resolving `fill` must pass a distinct
      // path from `color`'s, otherwise an unset fill silently inherits whatever
      // theme token the stroke color falls back to (e.g. a UI-tertiary accent),
      // filling shapes/enclosed line paths that were never configured to have one.
      return this._resolveStyleProperty(styleValue, tokenPath, resolveToken, fallback, context);
    }

    if (!cardInstance || typeof cardInstance._resolveColorValue !== 'function') {
      return (typeof styleValue === 'object') ? (styleValue.default ?? fallback) : styleValue;
    }

    // A plain string may be a literal, a var(...), a theme: token, or a computed
    // expression (alpha()/darken()/.../match-brightness) — all of which need the
    // full _resolveColorValue pipeline (computed-token resolution, match-brightness
    // substitution, template eval, CSS var resolution), not just the bare-token-path
    // shortcut _resolveStyleProperty offers, which left those raw/unresolved and
    // rendered as an invalid SVG paint value (black). Editors that flatten a
    // single-state {default: X} object down to plain string X for clean YAML rely
    // on this: wrapping it back into that shape here routes both forms through the
    // exact same pipeline the entity-bound state-color object branch below uses.
    const stateColorValue = (typeof styleValue === 'object') ? styleValue : { default: styleValue };

    const entityId = overlay?.entity;
    const entityObj = entityId ? cardInstance.hass?.states?.[entityId] : null;
    const savedEntity = cardInstance._entity;
    const savedStateAttribute = cardInstance.config?.state_attribute;
    const savedRangesAttribute = cardInstance.config?.ranges_attribute;

    cardInstance._entity = entityObj || null;
    if (cardInstance.config) {
      cardInstance.config.state_attribute = overlay?.state_attribute;
      cardInstance.config.ranges_attribute = overlay?.ranges_attribute;
    }
    try {
      return cardInstance._resolveColorValue(stateColorValue, fallback);
    } finally {
      cardInstance._entity = savedEntity;
      if (cardInstance.config) {
        cardInstance.config.state_attribute = savedStateAttribute;
        cardInstance.config.ranges_attribute = savedRangesAttribute;
      }
    }
  }

  /**
   * Final materialization pass after _resolveLineColor, covering two gaps in
   * the pipeline it delegates to (cardInstance._resolveColorValue):
   *
   * 1. A computed expression (alpha()/darken()/etc) that, for whatever reason,
   *    reached here still unevaluated — e.g. state-color-resolver.js's and
   *    _resolveColorValue's own computed-token passes both gate on
   *    `window.lcards.core.themeManager.resolver` being set, and this is the
   *    last point before the value is baked into a markup *string* (this runs
   *    before the element exists in the DOM). Retried here with an explicit
   *    element context.
   * 2. A resolved value like `color-mix(in srgb, var(--x) 50%, transparent)`
   *    still containing a *nested* var() — _resolveColorValue's own
   *    materialization step only unwraps a value that IS (starts with) a bare
   *    var(...), not one containing one elsewhere in the string.
   *
   * Without this, e.g. `alpha(var(--lcars-black-cherry), 0.5)` reaches the SVG
   * fill attribute still wrapped in the unevaluated `alpha(...)` call — invalid
   * paint syntax the browser can't parse, silently rendering opaque black
   * instead of the intended translucent fill.
   * @private
   */
  _materializeColor(value, fallback, cardInstance) {
    if (typeof value !== 'string') return value;

    const resolver = window.lcards?.core?.themeManager?.resolver;
    if (resolver && typeof resolver.resolve === 'function') {
      value = resolver.resolve(value, value, { element: cardInstance });
    } else if (/^(darken|lighten|alpha|saturate|desaturate|mix|base)\(/.test(value)) {
      lcardsLog.warn('[LineOverlay] Computed color expression left unresolved — themeManager.resolver unavailable at render time:', value);
    }

    if (typeof value !== 'string' || !value.includes('var(')) return value;
    return ColorUtils.resolveCssVariable(value, fallback, cardInstance) || fallback;
  }

  /**
   * Get scaling context for responsive token resolution
   *
   * @private
   */
  _getScalingContext(viewBox) {
    return { viewBox };
  }

  /**
   * Resolve anchor position with overlay attachment support
   *
   * @private
   */
  _resolveAnchor(overlay, anchors) {
    lcardsLog.trace(`[LineOverlay] 🎯 _resolveAnchor for ${overlay.id}:`, {
      anchor: overlay.anchor,
      anchor_side: overlay.anchor_side
    });

    // PRIORITY 1: virtual anchor with gap pre-applied by AdvancedRenderer
    // e.g. anchors['n_hub.top'] built by _buildDynamicOverlayAnchors
    if (typeof overlay.anchor === 'string') {
      const anchorSide = (overlay.anchor_side || '').toLowerCase();
      const virtualAnchorId = anchorSide && anchorSide !== 'center'
        ? `${overlay.anchor}.${anchorSide}`
        : overlay.anchor;

      lcardsLog.trace(`[LineOverlay] 🔍 Trying virtual anchor:`, {
        anchorSide,
        virtualAnchorId,
        hasInAnchors: !!anchors[virtualAnchorId]
      });

      const virtualAnchor = OverlayUtils.resolvePosition(virtualAnchorId, anchors);
      if (virtualAnchor) {
        lcardsLog.trace(`[LineOverlay] ✅ Resolved virtual anchor (gap pre-applied):`, virtualAnchor);
        return virtualAnchor;
      }
    }

    // PRIORITY 2: standard static anchor resolution (named anchor or [x, y])
    const fallback = OverlayUtils.resolvePosition(overlay.anchor, anchors);
    lcardsLog.trace(`[LineOverlay] Using fallback resolution:`, fallback);
    return fallback;
  }

  /**
   * Resolve attach_to position with overlay attachment support
   *
   * @private
   */
  _resolveAttachTo(overlay, anchors) {
    lcardsLog.trace(`[LineOverlay] 🎯 _resolveAttachTo for ${overlay.id}:`, {
      attach_to: overlay.attach_to,
      attach_side: overlay.attach_side
    });

    // PRIORITY 1: virtual anchor with gap pre-applied by AdvancedRenderer
    if (typeof overlay.attach_to === 'string') {
      const attachSide = (overlay.attach_side || '').toLowerCase();
      const virtualAnchorId = attachSide && attachSide !== 'center'
        ? `${overlay.attach_to}.${attachSide}`
        : overlay.attach_to;

      lcardsLog.trace(`[LineOverlay] 🔍 Trying virtual anchor:`, {
        attachSide,
        virtualAnchorId,
        hasInAnchors: !!anchors[virtualAnchorId]
      });

      const virtualAnchor = OverlayUtils.resolvePosition(virtualAnchorId, anchors);
      if (virtualAnchor) {
        lcardsLog.trace(`[LineOverlay] ✅ Resolved virtual anchor (gap pre-applied):`, virtualAnchor);
        return virtualAnchor;
      }
    }

    // PRIORITY 2: standard static anchor resolution
    const fallback = OverlayUtils.resolvePosition(overlay.attach_to, anchors);
    lcardsLog.trace(`[LineOverlay] Using fallback resolution:`, fallback);
    return fallback;
  }

  /**
   * Resolve attachment point by side
   *
   * @private
   */
  _resolveAttachmentPoint(points, side) {
    if (!points) return null;

    const sideMap = {
      'top': points.top,
      'right': points.right,
      'bottom': points.bottom,
      'left': points.left,
      'center': points.center,
      'top-left': points.topLeft,
      'top-right': points.topRight,
      'bottom-left': points.bottomLeft,
      'bottom-right': points.bottomRight
    };

    return sideMap[side] || points.center || null;
  }

  /**
   * Apply gap to attachment point
   *
   * @private
   */
  _applyGapToAttachmentPoint(point, side, gap, bbox) {
    if (!gap || gap === 0) return point;

    const [x, y] = point;

    switch (side) {
      case 'top':
        return [x, y - gap];
      case 'bottom':
        return [x, y + gap];
      case 'left':
        return [x - gap, y];
      case 'right':
        return [x + gap, y];
      default:
        return point;
    }
  }

  /**
   * Prepare animation attributes
   *
   * @private
   */
  _prepareAnimationAttributes(overlay, style) {
    return {
      hasAnimations: style.animatable !== false,
      animatable: style.animatable !== false
    };
  }

  /**
   * Build SVG definitions (gradients, patterns, markers)
   *
   * @private
   */
  _buildDefinitions(lineStyle, overlayId) {
    const defs = [];

    // Gradient definitions
    if (lineStyle.gradient) {
      const gradientId = `gradient-${overlayId}`;
      if (!this.gradientCache.has(gradientId)) {
        const gradientDef = this._createGradientDefinition(lineStyle.gradient, gradientId);
        this.gradientCache.set(gradientId, gradientDef);
      }
      defs.push(this.gradientCache.get(gradientId));
    }

    // Pattern definitions
    if (lineStyle.pattern) {
      const patternId = `pattern-${overlayId}`;
      if (!this.patternCache.has(patternId)) {
        const patternDef = this._createPatternDefinition(lineStyle.pattern, patternId);
        this.patternCache.set(patternId, patternDef);
      }
      defs.push(this.patternCache.get(patternId));
    }

    // Marker definitions. A marker with no explicit fill/color falls back to
    // currentColor, which inherits the card host's text color — not the line's
    // own color, which looks like an unrelated, jarring mismatch. Default to the
    // line's color instead, same as the editor preview already does.
    //
    // "match_line" (Phase 9) is an explicit opt-in sentinel — distinct from the
    // implicit no-fill-set fallback above — letting a marker's fill/stroke track
    // the line's fully-resolved color (static or state-based) without duplicating
    // state-color config onto the marker itself. The rendered <marker id="..."> is
    // always the fixed `marker-${markerPosition}-${overlayId}` value — it's
    // referenced by a hardcoded url(#...) from the path in _buildMainPath(), so it
    // can't vary — but the markerCache LOOKUP key includes the resolved color for
    // "match_line" markers, so updateLineEntityColors() (Phase 8/9) can force a
    // fresh def (and DOM patch) when the line's color changes, rather than
    // reusing a stale cached marker forever.
    ['markerStart', 'markerMid', 'markerEnd'].forEach((markerType, index) => {
      const marker = lineStyle[markerType];
      if (marker) {
        const markerPosition = ['start', 'mid', 'end'][index];
        const renderedId = `marker-${markerPosition}-${overlayId}`;
        const matchesLine = marker.fill === 'match_line' || marker.stroke === 'match_line';
        // Opacity is always baked in (see _createMarkerDefinition's lineOpacity
        // param), so it's always part of the cache key, not just for match_line.
        const cacheKey = matchesLine
          ? `${renderedId}::${lineStyle.color}::${lineStyle.opacity}`
          : `${renderedId}::${lineStyle.opacity}`;
        if (!this.markerCache.has(cacheKey)) {
          const resolvedFill = marker.fill === 'match_line' ? lineStyle.color : marker.fill;
          const resolvedStroke = marker.stroke === 'match_line' ? lineStyle.color : marker.stroke;
          const markerWithFallback = (resolvedFill || marker.color)
            ? { ...marker, fill: resolvedFill, stroke: resolvedStroke }
            : { ...marker, fill: lineStyle.color, stroke: resolvedStroke };
          const markerDef = this._createMarkerDefinition(markerWithFallback, renderedId, markerPosition, lineStyle.opacity);
          this.markerCache.set(cacheKey, markerDef);
        }
        defs.push(this.markerCache.get(cacheKey));
      }
    });

    return defs.length > 0 ? `<defs>${defs.join('')}</defs>` : '';
  }

  /**
   * Build main path element
   *
   * @private
   */
  _buildMainPath(pathD, lineStyle, overlayId, animationAttributes, isSelected = false) {
    const stroke = lineStyle.gradient ? `url(#gradient-${overlayId})` :
                   lineStyle.pattern ? `url(#pattern-${overlayId})` :
                   lineStyle.color;

    const markerStart = lineStyle.markerStart ? `url(#marker-start-${overlayId})` : '';
    const markerMid = lineStyle.markerMid ? `url(#marker-mid-${overlayId})` : '';
    const markerEnd = lineStyle.markerEnd ? `url(#marker-end-${overlayId})` : '';

    // Add selection indicator if this line is selected (thicker blue glow behind)
    const selectionIndicator = isSelected ? `<path
      class="line-selection-indicator"
      d="${pathD}"
      stroke="#66B0FF"
      stroke-width="${lineStyle.width + 10}"
      stroke-opacity="0.7"
      stroke-linecap="${lineStyle.lineCap}"
      stroke-linejoin="${lineStyle.lineJoin}"
      fill="none"
      pointer-events="none"
      style="filter: blur(4px);"
    />` : '';

    // Add invisible wider path for proximity click detection (12px hit area)
    const hitAreaPath = `<path
      class="line-hit-area"
      d="${pathD}"
      stroke="transparent"
      stroke-width="12"
      fill="none"
      pointer-events="stroke"
      style="cursor: pointer;"
    />`;

    const visiblePath = `<path
      class="line-path"
      data-line-id="${overlayId}"
      d="${pathD}"
      stroke="${stroke}"
      stroke-width="${lineStyle.width}"
      stroke-opacity="${lineStyle.opacity}"
      stroke-linecap="${lineStyle.lineCap}"
      stroke-linejoin="${lineStyle.lineJoin}"
      ${lineStyle.miterLimit ? `stroke-miterlimit="${lineStyle.miterLimit}"` : ''}
      ${lineStyle.dashArray ? `stroke-dasharray="${lineStyle.dashArray}"` : ''}
      ${lineStyle.dashOffset ? `stroke-dashoffset="${lineStyle.dashOffset}"` : ''}
      fill="${lineStyle.fill}"
      fill-opacity="${lineStyle.fillOpacity}"
      ${markerStart ? `marker-start="${markerStart}"` : ''}
      ${markerMid ? `marker-mid="${markerMid}"` : ''}
      ${markerEnd ? `marker-end="${markerEnd}"` : ''}
      data-animatable="${animationAttributes.animatable}"
      pointer-events="none"
      style="cursor: pointer;"
    />`;

    return selectionIndicator + hitAreaPath + visiblePath;
  }

  /**
   * Build markers (placeholder - simplified)
   *
   * @private
   */
  _buildMarkers(pathResult, lineStyle, overlayId) {
    // Markers are handled in definitions
    return null;
  }



  /**
   * Render fallback line for error cases
   *
   * @private
   */
  _renderFallbackLine(overlay, anchor, anchor2) {
    const [x1, y1] = anchor;
    const [x2, y2] = anchor2 || anchor;
    const rawColor = overlay.style?.color;
    const color = (typeof rawColor === 'object' && rawColor !== null)
      ? (rawColor.default || 'var(--lcars-orange, var(--lcards-orange-medium, #ff7700))')
      : (rawColor || 'var(--lcars-orange, var(--lcards-orange-medium, #ff7700))');

    lcardsLog.warn(`[LineOverlay] Using fallback rendering for overlay ${overlay.id}`);

    return `<g id="${overlay.id}" data-overlay-id="${overlay.id}" data-overlay-type="line" data-fallback="true">
              <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
                    stroke="${color}" stroke-width="2" />
            </g>`;
  }

  /**
   * Get renderer provenance information
   *
   * @private
   */
  _getRendererProvenance(overlayId, metadata = {}) {
    return {
      renderer: 'LineOverlay',
      version: '3.0.0',
      timestamp: Date.now(),
      overlayId,
      metadata
    };
  }

  // ============================================================================
  // PARSING METHODS (Simplified - full implementation in original file)
  // ============================================================================

  _parseGradientConfig(gradientConfig) {
    if (!gradientConfig) return null;
    if (typeof gradientConfig === 'string') {
      const match = gradientConfig.match(/^(.+?)-to-(.+)$/);
      if (match) {
        return {
          type: 'linear',
          direction: 'horizontal',
          stops: [
            { offset: '0%', color: match[1].trim() },
            { offset: '100%', color: match[2].trim() }
          ]
        };
      }
    }
    if (typeof gradientConfig === 'object') {
      return {
        type: gradientConfig.type || 'linear',
        direction: gradientConfig.direction || 'horizontal',
        stops: gradientConfig.stops || []
      };
    }
    return null;
  }

  _parsePatternConfig(patternConfig) {
    if (!patternConfig) return null;
    if (typeof patternConfig === 'string') {
      return { type: patternConfig, size: 8, color: 'currentColor' };
    }
    if (typeof patternConfig === 'object') {
      return {
        type: patternConfig.type || 'dots',
        size: Number(patternConfig.size || 8),
        color: patternConfig.color || 'currentColor',
        opacity: Number(patternConfig.opacity || 0.5)
      };
    }
    return null;
  }

  _parseMarkerConfig(markerConfig) {
    if (!markerConfig) return null;
    return markerConfig; // Simplified
  }

  _createGradientDefinition(gradient, gradientId) {
    // Simplified gradient definition
    const stops = gradient.stops.map(stop =>
      `<stop offset="${stop.offset}" stop-color="${stop.color}" />`
    ).join('');

    return `<linearGradient id="${gradientId}">${stops}</linearGradient>`;
  }

  _createPatternDefinition(pattern, patternId) {
    // Simplified pattern definition
    return `<pattern id="${patternId}" width="${pattern.size}" height="${pattern.size}" patternUnits="userSpaceOnUse">
              <circle cx="${pattern.size / 2}" cy="${pattern.size / 2}" r="1" fill="${pattern.color}" opacity="${pattern.opacity || 0.5}" />
            </pattern>`;
  }

  _createMarkerDefinition(marker, markerId, markerPosition = 'end', lineOpacity = 1) {
    if (!marker || !marker.type) return '';

    // Use size directly in pixels
    const vb = marker.size || 10; // Default to 10px
    const center = vb / 2;

    // Color configuration with separate stroke and fill
    const fillColor = marker.fill || marker.color || 'currentColor';
    const strokeColor = marker.stroke || 'none';
    const strokeWidth = marker.stroke_width || 0;

    let shape = '';
    // Defaults; only 'rect' overrides these to support independent width/height.
    let markerW = vb, markerH = vb, refX = center, refY = center;

    // Opt-in "edge" attach (default stays 'center', preserving pre-existing
    // configs' appearance): for pointed/directional shapes, refX becomes the
    // shape's back edge/point (local x=0, the flat end facing the line)
    // instead of its bounding-box center — the whole shape, tip included,
    // then projects forward past the line's true endpoint rather than
    // straddling it. This is deliberately the opposite of the "tip pinned to
    // the vertex" convention common in thin-stroke SVG examples: with a
    // thick line stroke, pinning the tip means the line's own end-cap
    // (round/square, or even butt at sub-pixel scale) can render past the
    // marker's point since nothing of the marker exists beyond that pivot.
    // Pinning the back edge instead means the marker's opaque body (painted
    // on top of the path, per SVG marker rendering order) fully covers that
    // same spot, so the tip is always the true outermost visible point
    // regardless of stroke width or line-cap style. Symmetric shapes (dot,
    // the orthogonal 'line' tick) have no meaningful "edge" distinct from
    // their center, so `align` is a no-op for them.
    const edgeAlign = marker.align === 'edge';

    switch (marker.type) {
      case 'arrow':
      case 'triangle': // alias, kept for configs saved before the two were merged
        if (edgeAlign) refX = 0;
        shape = `<path d="M 0 0 L ${vb} ${center} L 0 ${vb} Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
        break;

      case 'dot':
        const radius = vb / 3;
        shape = `<circle cx="${center}" cy="${center}" r="${radius}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
        break;

      case 'diamond':
        if (edgeAlign) refX = 0;
        shape = `<path d="M ${center} 0 L ${vb} ${center} L ${center} ${vb} L 0 ${center} Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
        break;

      case 'line':
        // Orthogonal line (perpendicular to path direction)
        const lineLength = vb * 0.8;
        const lineOffset = (vb - lineLength) / 2;
        shape = `<line x1="${center}" y1="${lineOffset}" x2="${center}" y2="${vb - lineOffset}" stroke="${fillColor}" stroke-width="${Math.max(strokeWidth || 2, 2)}" stroke-linecap="round" />`;
        break;

      case 'square': // alias, kept for configs saved before 'square'/'rect' were merged
      case 'rect': {
        // 'square' configs (pre-merge) default filled; 'rect' configs default outlined
        // (matching each type's original look) unless `filled` is set explicitly.
        const filled = marker.filled ?? (marker.type === 'square');
        markerW = marker.width || vb;
        markerH = marker.height || vb;
        refX = edgeAlign ? 0 : markerW / 2;
        refY = markerH / 2;
        shape = filled
          ? `<rect x="0" y="0" width="${markerW}" height="${markerH}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`
          : `<rect x="0" y="0" width="${markerW}" height="${markerH}" fill="none" stroke="${fillColor}" stroke-width="${strokeWidth || 1.5}" />`;
        break;
      }

      default:
        // Fallback to dot
        shape = `<circle cx="${center}" cy="${center}" r="${vb/3}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
    }

    // userSpaceOnUse: without this, markerWidth/markerHeight are multiples of the
    // path's stroke-width (SVG default), so "size" would scale with line thickness
    // instead of being an absolute pixel value as the field implies.
    // auto-start-reverse: marker-start conventionally points outward/away from the
    // line (like the far end of a two-headed arrow) — plain "auto" points forward,
    // the same direction as marker-end, which looks backward for a start marker.
    const orient = markerPosition === 'start' ? 'auto-start-reverse' : 'auto';

    // A fully-opaque marker on a translucent line reads as a mismatch/bug rather
    // than an intentional style choice (unlike marker color, which legitimately
    // differs from the line's own color often) — so unlike "match_line" color,
    // this isn't opt-in: markers always inherit the line's opacity. It's a
    // static config value (no template/entity support planned), so this only
    // needs to be baked in at build time, not live-patched on hass updates.
    const markerContent = lineOpacity !== 1 ? `<g opacity="${lineOpacity}">${shape}</g>` : shape;

    return `<marker
      id="${markerId}"
      viewBox="0 0 ${markerW} ${markerH}"
      markerWidth="${markerW}"
      markerHeight="${markerH}"
      markerUnits="userSpaceOnUse"
      refX="${refX}"
      refY="${refY}"
      orient="${orient}">
      ${markerContent}
    </marker>`;
  }
}

// Expose to window.lcards.debug.msd namespace for console debugging
if (typeof window !== 'undefined' && window.lcards?.debug?.msd) {
  window.lcards.debug.msd.LineOverlay = LineOverlay;
}
