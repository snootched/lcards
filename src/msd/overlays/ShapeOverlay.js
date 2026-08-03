/**
 * ShapeOverlay.js
 * Instance-based freeform shape overlay (polyline/rect/circle) with lifecycle management.
 *
 * Architecture:
 * - Extends OverlayBase for lifecycle management (sibling of LineOverlay, not a subclass —
 *   line's anchor/attach_to/attach_side resolution and fallback rendering are all
 *   line-specific and would be actively wrong here)
 * - One instance per shape overlay (not shared)
 * - Resolves styles fresh on each render (ensures theme token changes are always applied)
 * - polyline kind delegates point-array-to-path generation to RouterCore's public
 *   buildRouteRequest()/computePath() (forced into 'manual' mode) — the same two
 *   methods LineOverlay itself calls — to get corner-rounding/smoothing for free
 * - rect/circle kinds render as native <rect>/<ellipse> elements (SVG markers only
 *   apply to path/line/polyline/polygon, never rect/circle, so path-based rendering
 *   buys nothing for these kinds)
 *
 * Lifecycle:
 * 1. Constructor: Initialize caches and RouterCore reference (only needed for polyline)
 * 2. initialize(mountEl): base lifecycle setup
 * 3. render(): Create shape SVG markup, dispatched by `kind`
 * 4. update(): Full re-render on config change (shapes don't do incremental DOM patching)
 * 5. destroy(): Cleanup cached definitions
 */

import { OverlayBase } from './OverlayBase.js';
import { OverlayUtils } from '../renderer/OverlayUtils.js';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { ColorUtils } from '../../core/themes/ColorUtils.js';

const VALID_KINDS = ['polyline', 'rect', 'circle'];

// @ts-ignore - ShapeOverlay extends OverlayBase (type inference issues with duplicate base methods)
export class ShapeOverlay extends OverlayBase {
  constructor(overlay, systemsManager, routerCore = null) {
    super(overlay, systemsManager);

    // RouterCore is only required for the polyline kind (path/corner/smoothing generation)
    this.routerCore = routerCore;

    this._cachedPathResult = null;

    // Definition caches for performance
    this.markerCache = new Map();
    this.gradientCache = new Map();
    this.patternCache = new Map();

    lcardsLog.trace(`[ShapeOverlay] Created instance for overlay ${overlay.id}`);
  }

  /**
   * Initialize shape overlay
   * @param {Element} mountEl - Mount element for the overlay
   * @returns {Promise<void>}
   */
  async initialize(mountEl) {
    await super.initialize(mountEl);
    lcardsLog.trace(`[ShapeOverlay] Initialized overlay ${this.overlay.id}:`, {
      kind: this.overlay.kind
    });
  }

  /**
   * Render shape overlay
   *
   * @param {Object} overlay - Overlay configuration
   * @param {Object} anchors - Anchor positions
   * @param {Array} viewBox - SVG viewBox dimensions [minX, minY, width, height]
   * @param {Element} svgContainer - SVG container element
   * @param {Object} cardInstance - MSD card instance, needed to resolve state-color
   * @returns {Object} {markup, actionInfo, overlayId, metadata, provenance}
   */
  render(overlay, anchors, viewBox, svgContainer, cardInstance) {
    const kind = overlay.kind;

    if (!VALID_KINDS.includes(kind)) {
      lcardsLog.error(`[ShapeOverlay] ❌ Shape ${overlay.id} has invalid or missing 'kind' (got: ${JSON.stringify(kind)}). Must be one of: ${VALID_KINDS.join(', ')}.`);
      return this._errorResult(overlay.id, 'invalid_kind');
    }

    try {
      const shapeStyle = this._resolveShapeStyles(
        overlay.finalStyle || overlay.style || {},
        overlay.id,
        viewBox,
        overlay,
        cardInstance
      );

      const animationAttributes = this._prepareAnimationAttributes(overlay, overlay.style || {});
      // Gated on _isStudioPreview (real DOM-ancestry check, not persisted
      // config) so a stray _editorSelected flag can never paint the
      // selection glow outside the Studio dialog itself. Also reused below to
      // gate a locked shape's pointer-events — same reasoning: `locked` is
      // editor-only (see msd-schema.js), so it must never affect a real
      // dashboard's rendering, only MSD Studio's own preview.
      const isStudioPreview = cardInstance?._isStudioPreview === true;
      const isSelected = overlay._editorSelected === true && isStudioPreview;

      let geometry;
      if (kind === 'polyline') {
        geometry = this._renderPolyline(overlay, anchors, shapeStyle, animationAttributes, isSelected);
      } else if (kind === 'rect') {
        geometry = this._renderRect(overlay, anchors, shapeStyle, animationAttributes, isSelected, isStudioPreview);
      } else {
        geometry = this._renderCircle(overlay, anchors, shapeStyle, animationAttributes, isSelected, isStudioPreview);
      }

      if (!geometry) {
        return this._errorResult(overlay.id, `invalid_${kind}_geometry`);
      }

      const svgParts = [
        this._buildDefinitions(shapeStyle, overlay.id),
        geometry.markup
      ].filter(Boolean);

      const markup = `<g id="${overlay.id}"
                data-overlay-id="${overlay.id}"
                  data-overlay-type="shape"
                  data-shape-kind="${kind}"
                  data-animation-ready="${!!animationAttributes.hasAnimations}">
                ${svgParts.join('\n')}
              </g>`;

      return {
        markup,
        actionInfo: null, // Shapes don't have actions
        overlayId: overlay.id,
        metadata: {
          kind,
          hasAnimations: animationAttributes.hasAnimations,
          // Consumed by AdvancedRenderer immediately after render() to register
          // attachment points — {type:'bbox'} for rect/circle (AdvancedRenderer
          // derives the actual bbox via OverlayUtils.computeAttachmentPoints using
          // this overlay's own position/size), {type:'vertices', points} for polyline.
          attachment: geometry.attachment
        },
        provenance: this._getRendererProvenance(overlay.id, {
          overlay_type: 'shape',
          kind,
          has_animations: animationAttributes.hasAnimations
        })
      };

    } catch (error) {
      lcardsLog.error(`[ShapeOverlay] Rendering failed for shape ${overlay.id}:`, error);
      return this._errorResult(overlay.id, error.message, true);
    }
  }

  /**
   * Update shape overlay
   * Shapes re-render fully on config change, matching LineOverlay's convention.
   *
   * @returns {boolean} Success status
   */
  update(overlayElement, overlay, sourceData) {
    lcardsLog.trace(`[ShapeOverlay] Update called for ${overlay.id} (shapes re-render fully on config changes)`);
    return true;
  }

  /**
   * Get default animation target for shape overlays
   * @returns {Element|null} The main visible element with data-animatable="true"
   */
  getDefaultAnimationTarget() {
    if (!this.element) return null;

    const animatableEl = this.element.querySelector('[data-animatable="true"]');
    if (animatableEl) return animatableEl;

    // Fallback to any geometry element in the group
    return this.element.querySelector('path, rect, ellipse');
  }

  /**
   * Destroy shape overlay
   * Cleanup cached definitions and resources
   */
  destroy() {
    lcardsLog.trace(`[ShapeOverlay] Destroying overlay ${this.overlay.id}`);

    this._cachedPathResult = null;
    this.markerCache.clear();
    this.gradientCache.clear();
    this.patternCache.clear();

    super.destroy();
  }

  // ============================================================================
  // KIND-SPECIFIC GEOMETRY RENDERERS
  // ============================================================================

  /**
   * Render polyline kind: resolve points, compute path via RouterCore (manual mode),
   * optionally close it, build the styled <path>.
   *
   * @private
   */
  _renderPolyline(overlay, anchors, shapeStyle, animationAttributes, isSelected) {
    if (!this.routerCore) {
      lcardsLog.error(`[ShapeOverlay] RouterCore not available for polyline shape ${overlay.id}`);
      return null;
    }

    const rawPoints = Array.isArray(overlay.points) ? overlay.points : [];
    const resolvedPoints = [];
    for (const pt of rawPoints) {
      const resolved = Array.isArray(pt) && pt.length >= 2
        ? [Number(pt[0]), Number(pt[1])]
        : OverlayUtils.resolvePosition(pt, anchors);
      if (!resolved || !Number.isFinite(resolved[0]) || !Number.isFinite(resolved[1])) {
        lcardsLog.error(`[ShapeOverlay] ❌ Could not resolve point ${JSON.stringify(pt)} for polyline shape ${overlay.id}`);
        return null;
      }
      resolvedPoints.push(resolved);
    }

    if (resolvedPoints.length < 2) {
      lcardsLog.error(`[ShapeOverlay] ❌ Polyline shape ${overlay.id} needs at least 2 resolvable points (got ${resolvedPoints.length})`);
      return null;
    }

    // RouterCore's cache key doesn't include waypoints, only endpoints — without
    // this, editing an interior point while endpoints stay fixed could serve a
    // stale cached path.
    this.routerCore.invalidate(overlay.id);

    const start = resolvedPoints[0];
    const end = resolvedPoints[resolvedPoints.length - 1];
    const interiorWaypoints = resolvedPoints.slice(1, -1);

    // Minimal adapter object matching what buildRouteRequest() actually reads
    // (overlay.id, overlay._raw, overlay.finalStyle) — forced into manual mode so
    // computePath() takes the deterministic _computeManual branch, not any
    // obstacle/A*/channel logic (irrelevant once points are already known).
    const routeOverlay = {
      id: overlay.id,
      _raw: {
        route: 'manual',
        waypoints: interiorWaypoints,
        corner_style: overlay.corner_style,
        corner_radius: overlay.corner_radius,
        corner_angle: overlay.corner_angle,
        smoothing_mode: overlay.smoothing_mode,
        smoothing_iterations: overlay.smoothing_iterations,
        smoothing_max_points: overlay.smoothing_max_points,
        clearance: overlay.clearance
      }
    };

    const routeRequest = this.routerCore.buildRouteRequest(routeOverlay, start, end);
    const pathResult = this.routerCore.computePath(routeRequest);

    if (!pathResult?.d) {
      lcardsLog.warn(`[ShapeOverlay] No path computed for polyline shape ${overlay.id}`);
      return null;
    }

    this._cachedPathResult = pathResult;

    const pathD = overlay.closed ? `${pathResult.d} Z` : pathResult.d;

    return {
      markup: this._buildPolylinePath(pathD, shapeStyle, overlay.id, animationAttributes, isSelected),
      attachment: { type: 'vertices', points: resolvedPoints }
    };
  }

  /**
   * Render rect kind: resolve position+size (same convention as control overlays),
   * build a native <rect>.
   *
   * @private
   */
  _renderRect(overlay, anchors, shapeStyle, animationAttributes, isSelected, isStudioPreview = false) {
    const position = OverlayUtils.resolvePosition(overlay.position, anchors);
    const size = overlay.size;

    if (!position || !Array.isArray(size) || size.length < 2 || !(size[0] > 0) || !(size[1] > 0)) {
      lcardsLog.error(`[ShapeOverlay] ❌ Invalid position/size for rect shape ${overlay.id}:`, { position: overlay.position, size });
      return null;
    }

    const [x, y] = position;
    const [width, height] = size;
    // Only 'round' corner_style maps to a native rx/ry; 'miter' and 'bevel' (not
    // natively expressible on <rect>) both fall back to sharp corners.
    const radius = overlay.corner_style === 'round' ? Math.max(0, Number(overlay.corner_radius || 0)) : 0;

    const attrs = this._buildCommonStyleAttrs(shapeStyle, overlay.id, { includeJoin: true });
    const selectionIndicator = isSelected ? `<rect
      class="shape-selection-indicator"
      x="${x - 5}" y="${y - 5}" width="${width + 10}" height="${height + 10}" rx="${radius}"
      fill="none" stroke="#66B0FF" stroke-width="${shapeStyle.width + 6}" stroke-opacity="0.7"
      pointer-events="none" style="filter: blur(4px);"
    />` : '';

    const rect = `<rect
      class="shape-path"
      data-shape-id="${overlay.id}"
      x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" ry="${radius}"
      ${attrs}
      data-animatable="${animationAttributes.animatable}"
      pointer-events="${(isStudioPreview && overlay.locked) ? 'none' : 'all'}"
      style="cursor: pointer;"
    />`;

    return {
      markup: selectionIndicator + rect,
      attachment: { type: 'bbox' }
    };
  }

  /**
   * Render circle kind: resolve position+size, build a native <ellipse> (a strict
   * superset of <circle> — visually identical when width === height, free ellipse
   * support otherwise).
   *
   * @private
   */
  _renderCircle(overlay, anchors, shapeStyle, animationAttributes, isSelected, isStudioPreview = false) {
    const position = OverlayUtils.resolvePosition(overlay.position, anchors);
    const size = overlay.size;

    if (!position || !Array.isArray(size) || size.length < 2 || !(size[0] > 0) || !(size[1] > 0)) {
      lcardsLog.error(`[ShapeOverlay] ❌ Invalid position/size for circle shape ${overlay.id}:`, { position: overlay.position, size });
      return null;
    }

    const [x, y] = position;
    const [width, height] = size;
    const cx = x + width / 2;
    const cy = y + height / 2;
    const rx = width / 2;
    const ry = height / 2;

    const attrs = this._buildCommonStyleAttrs(shapeStyle, overlay.id, { includeJoin: false });
    const selectionIndicator = isSelected ? `<ellipse
      class="shape-selection-indicator"
      cx="${cx}" cy="${cy}" rx="${rx + 5}" ry="${ry + 5}"
      fill="none" stroke="#66B0FF" stroke-width="${shapeStyle.width + 6}" stroke-opacity="0.7"
      pointer-events="none" style="filter: blur(4px);"
    />` : '';

    const ellipse = `<ellipse
      class="shape-path"
      data-shape-id="${overlay.id}"
      cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"
      ${attrs}
      data-animatable="${animationAttributes.animatable}"
      pointer-events="${(isStudioPreview && overlay.locked) ? 'none' : 'all'}"
      style="cursor: pointer;"
    />`;

    return {
      markup: selectionIndicator + ellipse,
      attachment: { type: 'bbox' }
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Resolve comprehensive shape styling from configuration.
   * Adapted from LineOverlay._resolveLineStyles — deliberately excludes the
   * vestigial fields confirmed dead there (glow/glow_color/glow_size, style-level
   * smoothing enum, pulse_speed/flow_speed/segment_colors/status_indicator): those
   * were superseded by the modern animation-preset system (glow/pulse/march
   * presets), which shape overlays already get for free via the standard
   * `animations: [...]` mechanism — no need to propagate dead fields into new code.
   *
   * @private
   */
  _resolveShapeStyles(style, overlayId, viewBox, overlay, cardInstance) {
    const _resolver = window.lcards?.core?.themeManager?.resolver;
    const resolveToken = (_resolver && typeof _resolver.forComponent === 'function')
      ? _resolver.forComponent('shape')
      : null;
    const scalingContext = this._getScalingContext(viewBox);

    return {
      color: this._materializeColor(this._resolveShapeColor(
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

      lineCap: (style.line_cap || 'butt').toLowerCase(),
      lineJoin: (style.line_join || overlay?.corner_style || 'miter').toLowerCase(),
      miterLimit: Number(style.miter_limit || 4),

      dashArray: style.dash_array || null,
      dashOffset: Number(style.dash_offset || 0),

      fill: this._materializeColor(this._resolveShapeColor(
        style.fill,
        overlay,
        cardInstance,
        'none',
        resolveToken,
        scalingContext,
        'defaultFillColor'
      ), 'none', cardInstance),
      fillOpacity: Number(style.fill_opacity || 1),

      gradient: this._parseGradientConfig(style.gradient),
      pattern: this._parsePatternConfig(style.pattern),

      markerStart: this._parseMarkerConfig(style.marker_start),
      markerMid: this._parseMarkerConfig(style.marker_mid),
      markerEnd: this._parseMarkerConfig(style.marker_end),

      animatable: style.animatable !== false
    };
  }

  /**
   * Resolve a style property using token system with fallback
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
   * Resolve style.color, which may be a literal/token string or a state-color
   * object (stateColorSchema shape) bound to the overlay's own `entity` — mirrors
   * LineOverlay._resolveLineColor exactly (same underlying pipeline, needed so
   * "highlight this wall when a door sensor opens" works identically for shapes).
   *
   * @private
   */
  _resolveShapeColor(styleValue, overlay, cardInstance, fallback, resolveToken, context = {}, tokenPath = 'defaultColor') {
    if (styleValue === undefined || styleValue === null) {
      // tokenPath is only consulted when styleValue is absent (theme "give me a
      // sensible default" lookup) — callers resolving `fill` must pass a distinct
      // path from `color`'s, otherwise an unset fill silently inherits whatever
      // theme token the stroke color falls back to.
      return this._resolveStyleProperty(styleValue, tokenPath, resolveToken, fallback, context);
    }

    if (!cardInstance || typeof cardInstance._resolveColorValue !== 'function') {
      return (typeof styleValue === 'object') ? (styleValue.default ?? fallback) : styleValue;
    }

    // A plain string may be a literal, a var(...), a theme: token, or a computed
    // expression (alpha()/darken()/.../match-brightness) — all of which need the
    // full _resolveColorValue pipeline (computed-token resolution, match-brightness
    // substitution, CSS var resolution), not just the bare-token-path shortcut
    // _resolveStyleProperty offers, which left those raw/unresolved and rendered as
    // an invalid SVG paint value (black). _saveShape flattens a single-state
    // {default: X} object down to plain string X to keep saved YAML clean, so
    // wrapping it back into that shape here routes both forms through the exact
    // same pipeline the entity-bound state-color object branch below already uses.
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
   * Final materialization pass after _resolveShapeColor, covering two gaps in
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
      lcardsLog.warn('[ShapeOverlay] Computed color expression left unresolved — themeManager.resolver unavailable at render time:', value);
    }

    if (typeof value !== 'string' || !value.includes('var(')) return value;
    return ColorUtils.resolveCssVariable(value, fallback, cardInstance) || fallback;
  }

  /**
   * Get scaling context for responsive token resolution
   * @private
   */
  _getScalingContext(viewBox) {
    return { viewBox };
  }

  /**
   * Prepare animation attributes
   * @private
   */
  _prepareAnimationAttributes(overlay, style) {
    return {
      hasAnimations: style.animatable !== false,
      animatable: style.animatable !== false
    };
  }

  /**
   * Build SVG definitions (gradients, patterns, markers) — identical structure to
   * LineOverlay._buildDefinitions.
   * @private
   */
  _buildDefinitions(shapeStyle, overlayId) {
    const defs = [];

    if (shapeStyle.gradient) {
      const gradientId = `gradient-${overlayId}`;
      if (!this.gradientCache.has(gradientId)) {
        this.gradientCache.set(gradientId, this._createGradientDefinition(shapeStyle.gradient, gradientId));
      }
      defs.push(this.gradientCache.get(gradientId));
    }

    if (shapeStyle.pattern) {
      const patternId = `pattern-${overlayId}`;
      if (!this.patternCache.has(patternId)) {
        this.patternCache.set(patternId, this._createPatternDefinition(shapeStyle.pattern, patternId));
      }
      defs.push(this.patternCache.get(patternId));
    }

    // Markers only render on <path> (polyline kind) — harmless to compute for
    // rect/circle even though unused, since neither kind references marker-*.
    ['markerStart', 'markerMid', 'markerEnd'].forEach((markerType, index) => {
      const marker = shapeStyle[markerType];
      if (marker) {
        const markerPosition = ['start', 'mid', 'end'][index];
        const renderedId = `marker-${markerPosition}-${overlayId}`;
        const matchesLine = marker.fill === 'match_line' || marker.stroke === 'match_line';
        const cacheKey = matchesLine
          ? `${renderedId}::${shapeStyle.color}::${shapeStyle.opacity}`
          : `${renderedId}::${shapeStyle.opacity}`;
        if (!this.markerCache.has(cacheKey)) {
          const resolvedFill = marker.fill === 'match_line' ? shapeStyle.color : marker.fill;
          const resolvedStroke = marker.stroke === 'match_line' ? shapeStyle.color : marker.stroke;
          const markerWithFallback = (resolvedFill || marker.color)
            ? { ...marker, fill: resolvedFill, stroke: resolvedStroke }
            : { ...marker, fill: shapeStyle.color, stroke: resolvedStroke };
          this.markerCache.set(cacheKey, this._createMarkerDefinition(markerWithFallback, renderedId, markerPosition, shapeStyle.opacity));
        }
        defs.push(this.markerCache.get(cacheKey));
      }
    });

    return defs.length > 0 ? `<defs>${defs.join('')}</defs>` : '';
  }

  /**
   * Build the common stroke/fill attribute string shared by rect and circle kinds.
   * @private
   */
  _buildCommonStyleAttrs(shapeStyle, overlayId, { includeJoin }) {
    const stroke = shapeStyle.gradient ? `url(#gradient-${overlayId})` :
                   shapeStyle.pattern ? `url(#pattern-${overlayId})` :
                   shapeStyle.color;

    return `
      stroke="${stroke}"
      stroke-width="${shapeStyle.width}"
      stroke-opacity="${shapeStyle.opacity}"
      ${includeJoin ? `stroke-linejoin="${shapeStyle.lineJoin}"` : ''}
      ${includeJoin && shapeStyle.miterLimit ? `stroke-miterlimit="${shapeStyle.miterLimit}"` : ''}
      stroke-linecap="${shapeStyle.lineCap}"
      ${shapeStyle.dashArray ? `stroke-dasharray="${shapeStyle.dashArray}"` : ''}
      ${shapeStyle.dashOffset ? `stroke-dashoffset="${shapeStyle.dashOffset}"` : ''}
      fill="${shapeStyle.fill}"
      fill-opacity="${shapeStyle.fillOpacity}"
    `;
  }

  /**
   * Build the polyline kind's main <path>, mirroring LineOverlay._buildMainPath
   * (selection indicator + wide invisible hit-area + visible styled path).
   * @private
   */
  _buildPolylinePath(pathD, shapeStyle, overlayId, animationAttributes, isSelected = false) {
    const stroke = shapeStyle.gradient ? `url(#gradient-${overlayId})` :
                   shapeStyle.pattern ? `url(#pattern-${overlayId})` :
                   shapeStyle.color;

    const markerStart = shapeStyle.markerStart ? `url(#marker-start-${overlayId})` : '';
    const markerMid = shapeStyle.markerMid ? `url(#marker-mid-${overlayId})` : '';
    const markerEnd = shapeStyle.markerEnd ? `url(#marker-end-${overlayId})` : '';

    const selectionIndicator = isSelected ? `<path
      class="shape-selection-indicator"
      d="${pathD}"
      stroke="#66B0FF"
      stroke-width="${shapeStyle.width + 10}"
      stroke-opacity="0.7"
      stroke-linecap="${shapeStyle.lineCap}"
      stroke-linejoin="${shapeStyle.lineJoin}"
      fill="none"
      pointer-events="none"
      style="filter: blur(4px);"
    />` : '';

    const hitAreaPath = `<path
      class="shape-hit-area"
      d="${pathD}"
      stroke="transparent"
      stroke-width="12"
      fill="none"
      pointer-events="stroke"
      style="cursor: pointer;"
    />`;

    const visiblePath = `<path
      class="shape-path"
      data-shape-id="${overlayId}"
      d="${pathD}"
      stroke="${stroke}"
      stroke-width="${shapeStyle.width}"
      stroke-opacity="${shapeStyle.opacity}"
      stroke-linecap="${shapeStyle.lineCap}"
      stroke-linejoin="${shapeStyle.lineJoin}"
      ${shapeStyle.miterLimit ? `stroke-miterlimit="${shapeStyle.miterLimit}"` : ''}
      ${shapeStyle.dashArray ? `stroke-dasharray="${shapeStyle.dashArray}"` : ''}
      ${shapeStyle.dashOffset ? `stroke-dashoffset="${shapeStyle.dashOffset}"` : ''}
      fill="${shapeStyle.fill}"
      fill-opacity="${shapeStyle.fillOpacity}"
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
   * Build a uniform error result
   * @private
   */
  _errorResult(overlayId, errorCode, isException = false) {
    return {
      markup: '',
      actionInfo: null,
      overlayId,
      metadata: { error: errorCode, ...(isException ? { fallback: true } : {}) },
      provenance: this._getRendererProvenance(overlayId, {
        overlay_type: 'shape',
        error: errorCode
      })
    };
  }

  /**
   * Get renderer provenance information
   * @private
   */
  _getRendererProvenance(overlayId, metadata = {}) {
    return {
      renderer: 'ShapeOverlay',
      version: '1.0.0',
      timestamp: Date.now(),
      overlayId,
      metadata
    };
  }

  // ============================================================================
  // PARSING METHODS (mirrors LineOverlay's — kept as separate copies deliberately,
  // see class-level doc comment for why)
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
    return markerConfig; // Simplified, matches LineOverlay's own simplification
  }

  _createGradientDefinition(gradient, gradientId) {
    const stops = gradient.stops.map(stop =>
      `<stop offset="${stop.offset}" stop-color="${stop.color}" />`
    ).join('');

    return `<linearGradient id="${gradientId}">${stops}</linearGradient>`;
  }

  _createPatternDefinition(pattern, patternId) {
    return `<pattern id="${patternId}" width="${pattern.size}" height="${pattern.size}" patternUnits="userSpaceOnUse">
              <circle cx="${pattern.size / 2}" cy="${pattern.size / 2}" r="1" fill="${pattern.color}" opacity="${pattern.opacity || 0.5}" />
            </pattern>`;
  }

  _createMarkerDefinition(marker, markerId, markerPosition = 'end', lineOpacity = 1) {
    if (!marker || !marker.type) return '';

    const vb = marker.size || 10;
    const center = vb / 2;

    const fillColor = marker.fill || marker.color || 'currentColor';
    const strokeColor = marker.stroke || 'none';
    const strokeWidth = marker.stroke_width || 0;

    let shape = '';
    let markerW = vb, markerH = vb, refX = center, refY = center;
    const edgeAlign = marker.align === 'edge';

    switch (marker.type) {
      case 'arrow':
      case 'triangle':
        if (edgeAlign) refX = 0;
        shape = `<path d="M 0 0 L ${vb} ${center} L 0 ${vb} Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
        break;

      case 'dot': {
        const radius = vb / 3;
        shape = `<circle cx="${center}" cy="${center}" r="${radius}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
        break;
      }

      case 'diamond':
        if (edgeAlign) refX = 0;
        shape = `<path d="M ${center} 0 L ${vb} ${center} L ${center} ${vb} L 0 ${center} Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
        break;

      case 'line': {
        const lineLength = vb * 0.8;
        const lineOffset = (vb - lineLength) / 2;
        shape = `<line x1="${center}" y1="${lineOffset}" x2="${center}" y2="${vb - lineOffset}" stroke="${fillColor}" stroke-width="${Math.max(strokeWidth || 2, 2)}" stroke-linecap="round" />`;
        break;
      }

      case 'square':
      case 'rect': {
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
        shape = `<circle cx="${center}" cy="${center}" r="${vb / 3}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;
    }

    const orient = markerPosition === 'start' ? 'auto-start-reverse' : 'auto';
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
  window.lcards.debug.msd.ShapeOverlay = ShapeOverlay;
}
