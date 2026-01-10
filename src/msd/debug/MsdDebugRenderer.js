import { lcardsLog } from '../../utils/lcards-logging.js';

/**
 * [MsdDebugRenderer] Debug visualization renderer - shows anchor markers, overlay bounding boxes, routing guidelines
 * 🔍 Provides comprehensive debug overlays with performance metrics and visual debugging aids
 */
export class MsdDebugRenderer {
  constructor() {
    this.enabled = false;
    this.debugLayer = null;
    this.anchorMarkers = new Map();
    this.boundingBoxes = new Map();
    this.routingOverlays = new Map();

    this.scale = 1.0;

    // Remove old feature flags - now managed by DebugManager
    this.debugManager = null;
    this.unsubscribeDebug = null;

    // Store last render context for reactive re-renders
    this._lastRenderContext = null;
  }

  /**
   * Initialize with systems manager and subscribe to debug changes
   * @param {MsdCardCoordinator} coordinator - Systems manager instance
   */
  init(coordinator) {
    this.debugManager = coordinator.debugManager;

    // Subscribe to debug state changes for reactive rendering
    this.unsubscribeDebug = this.debugManager.onChange((event) => {
      // REDUCED: Only log significant events
      if (event.type === 'feature' || event.type === 'scale' || event.type === 'router-ready') {
        this._scheduleRerender();
      }
    });

  }

  /**
   * Set scale factor from debug configuration
   * @param {number} scale - Scale multiplier (default 1.0)
   */
  setScale(scale = 1.0) {
    this.scale = Math.max(0.3, Math.min(3.0, scale)); // Clamp between reasonable bounds
    lcardsLog.debug(`[MsdDebugRenderer] 🔍 Scale factor set to: ${this.scale}`);
  }

  /**
   * Main render method - now powered by DebugManager state
   * @param {Element} root - DOM root element
   * @param {Array} viewBox - SVG viewBox [x, y, width, height]
   * @param {Object} opts - Render options
   */
  render(root, viewBox, opts = {}) {
    // REDUCED: Only log if debug is actually enabled
    const debugState = this.debugManager?.getSnapshot();
    if (!debugState?.enabled) {
      return;
    }

    // Store context for reactive re-renders
    this._lastRenderContext = { root, viewBox, opts };

    if (!this.debugManager || !this.debugManager.initialized) {
      return;
    }

    if (!root || typeof root.querySelector !== 'function') {
      lcardsLog.warn('[MsdDebugRenderer] Invalid root element');
      return;
    }

    const svgElement = root.querySelector('svg');
    if (!svgElement) {
      lcardsLog.warn('[MsdDebugRenderer] No SVG element found in root');
      return;
    }

    // Update scale from DebugManager
    this.setScale(debugState.scale);

    // Setup debug layer
    this.integrateWithAdvancedRenderer(svgElement, viewBox, opts.anchors);

    // Clear existing debug content
    if (this.debugLayer) {
      this.debugLayer.innerHTML = '';
    }

    // Exit early if no features enabled
    if (!debugState.enabled) {
      if (this.debugLayer) {
        this.debugLayer.style.display = 'none';
      }
      return;
    }

    // REDUCED: Only log when actually rendering features
    lcardsLog.debug('[MsdDebugRenderer] 🔍 Rendering debug features', debugState);

    // Render grid if enabled (Phase 3)
    if (opts.grid || debugState.grid) {
      this.renderCoordinateGrid(viewBox, {
        spacing: opts.gridSpacing || opts.grid_spacing || debugState.grid_spacing || debugState.gridSpacing || 50,
        showLabels: true
      });
    }

    // Render enabled features using DebugManager state
    if (debugState.anchors && opts.anchors) {
      this.renderAnchorMarkers(opts.anchors);
    }

    if (debugState.bounding_boxes && opts.overlays) {
      lcardsLog.debug('[MsdDebugRenderer] 🔍 Bounding boxes:', {
        overlayCount: opts.overlays.length,
        overlayTypes: opts.overlays.map(o => o.type)
      });
      this.renderOverlayBounds(opts.overlays);
    }

    if (debugState.routing && this.debugManager.canRenderRouting()) {
      lcardsLog.debug('[MsdDebugRenderer] 🔍 Routing guides:', {
        canRender: this.debugManager.canRenderRouting(),
        hasRouter: !!opts.router,
        routerOverlays: opts.router?.overlays?.length
      });
      this.renderRoutingGuides(opts);
    }

    // Show debug layer
    if (this.debugLayer) {
      this.debugLayer.style.display = 'block';
    }
  }

  /**
   * Schedule a reactive re-render
   * @private
   */
  _scheduleRerender() {
    if (this._lastRenderContext) {
      // Use requestAnimationFrame to avoid excessive re-renders
      requestAnimationFrame(() => {
        const { root, viewBox, opts } = this._lastRenderContext;
        this.render(root, viewBox, opts);
      });
    }
  }

  /**
   * Render routing guides - simplified without retry mechanism
   * @param {Object} opts - Render options
   */
  renderRoutingGuides(opts) {
    if (!this.debugLayer) return;

    // Clear existing routes
    this.routingOverlays.forEach(o => o.remove());
    this.routingOverlays.clear();

    // Get routing system from window.lcards.debug.msd (set by pipeline)
    const routing = opts.router || window.lcards.debug.msd?.routing;

    lcardsLog.debug('[MsdDebugRenderer] Routing debug:', {
      hasOptsRouter: !!opts.router,
      hasWindowRouter: !!window.lcards.debug.msd?.routing,
      routerHasInspect: !!(routing?.inspect),
      routerType: routing?.constructor?.name
    });

    if (!routing || typeof routing.inspect !== 'function') {
      lcardsLog.debug('[MsdDebugRenderer] Routing system not available for debug rendering');
      return;
    }

    const overlays = opts.overlays || [];
    const lineOverlays = overlays.filter(o => o.type === 'line');

    if (lineOverlays.length === 0) {
      lcardsLog.debug('[MsdDebugRenderer] No line overlays found for routing visualization');
      return;
    }

    let routeCount = 0;
    lineOverlays.forEach(overlay => {
      try {
        const routeInfo = routing.inspect(overlay.id);
        if (routeInfo && routeInfo.pts && routeInfo.pts.length > 1) {
          const routeOverlay = this.createRoutingOverlay(overlay.id, routeInfo);
          this.debugLayer.appendChild(routeOverlay);
          this.routingOverlays.set(overlay.id, routeOverlay);
          routeCount++;
        } else {
          // Fine-grained debug, not necessarily an error
          lcardsLog.debug(`[MsdDebugRenderer] No route info for overlay ${overlay.id}`);
        }
      } catch (error) {
        lcardsLog.warn(`[MsdDebugRenderer] ⚠️ Failed to render routing guide for ${overlay.id}:`, error);
      }
    });

    if (routeCount > 0) {
      lcardsLog.debug(`[MsdDebugRenderer] Rendered ${routeCount} routing guides`);
    }
  }

  /**
   * Create routing visualization overlay group.
   * @param {string} overlayId
   * @param {Object} routeInfo
   * @returns {SVGGElement}
   */
  createRoutingOverlay(overlayId, routeInfo) {
    const doc = this.debugLayer.ownerDocument;
    const group = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'msd-debug-routing');

    const points = routeInfo.pts || [];
    points.forEach((pt, index) => {
      if (Array.isArray(pt) && pt.length >= 2) {
        const [x, y] = pt;
        const waypoint = doc.createElementNS('http://www.w3.org/2000/svg', 'circle');
        waypoint.setAttribute('cx', x);
        waypoint.setAttribute('cy', y);
        waypoint.setAttribute('r', 2 * this.scale);
        waypoint.setAttribute('fill', 'magenta');
        waypoint.setAttribute('stroke', 'white');
        waypoint.setAttribute('stroke-width', 1 * this.scale);
        waypoint.setAttribute('opacity', '0.8');
        group.appendChild(waypoint);

        if (index === 0 || index === points.length - 1 || points.length <= 6) {
          const label = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', x + (4 * this.scale));
            label.setAttribute('y', y - (4 * this.scale));
            label.setAttribute('fill', 'magenta');
            label.setAttribute('font-size', 8 * this.scale);
            label.setAttribute('font-family', 'monospace');
            label.setAttribute('opacity', '0.8');
            label.textContent = index;
            group.appendChild(label);
        }
      }
    });

    if (routeInfo.meta) {
      const startPt = points[0];
      if (startPt && Array.isArray(startPt) && startPt.length >= 2) {
        const info = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
        info.setAttribute('x', startPt[0]);
        info.setAttribute('y', startPt[1] - (12 * this.scale));
        info.setAttribute('fill', 'magenta');
        info.setAttribute('font-size', 9 * this.scale);
        info.setAttribute('font-family', 'monospace');
        info.setAttribute('opacity', '0.9');
        info.textContent = `${routeInfo.meta.strategy || 'auto'} (${Math.round(routeInfo.meta.cost || 0)})`;
        group.appendChild(info);
      }
    }

    return group;
  }

  /**
   * Render anchor markers
   * @param {Object} anchors
   */
  renderAnchorMarkers(anchors) {
    if (!anchors || !this.debugLayer) return;

    this.anchorMarkers.forEach(marker => marker.remove());
    this.anchorMarkers.clear();

    let markerCount = 0;
    for (const [name, pt] of Object.entries(anchors)) {
      if (Array.isArray(pt) && pt.length >= 2) {
        const marker = this.createAnchorMarker(name, pt[0], pt[1]);
        this.debugLayer.appendChild(marker);
        this.anchorMarkers.set(name, marker);
        markerCount++;
      }
    }

    lcardsLog.debug(`[MsdDebugRenderer] Rendered ${markerCount} anchor markers`);
  }

  /**
   * Create individual anchor marker group element
   * @param {string} name
   * @param {number} x
   * @param {number} y
   * @returns {SVGGElement}
   */
  createAnchorMarker(name, x, y) {
    const group = this.debugLayer.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('transform', `translate(${x}, ${y})`);
    group.setAttribute('class', 'msd-debug-anchor');

    const crosshairSize = 8 * this.scale;
    const strokeWidth = 2 * this.scale;
    const circleRadius = 3 * this.scale;
    const fontSize = 12 * this.scale;
    const labelOffset = 12 * this.scale;

    const crosshair = `
      <line x1="${-crosshairSize}" y1="0" x2="${crosshairSize}" y2="0" stroke="cyan" stroke-width="${strokeWidth}" opacity="0.8"/>
      <line x1="0" y1="${-crosshairSize}" x2="0" y2="${crosshairSize}" stroke="cyan" stroke-width="${strokeWidth}" opacity="0.8"/>
      <circle cx="0" cy="0" r="${circleRadius}" fill="cyan" stroke="white" stroke-width="${this.scale}" opacity="0.9"/>
    `;
    const label = `
      <text x="${labelOffset}" y="4" fill="cyan" font-size="${fontSize}" font-family="monospace" opacity="0.9">
        ${name} (${Math.round(x)}, ${Math.round(y)})
      </text>
    `;

    group.innerHTML = crosshair + label;
    return group;
  }

  /**
   * Render coordinate grid for visual reference
   * @param {Array} viewBox - ViewBox [minX, minY, width, height]
   * @param {Object} options - Grid options
   * @param {number} options.spacing - Grid spacing (default: 50)
   * @param {string} options.color - Grid line color (default: 'rgba(255, 255, 255, 0.2)')
   * @param {number} options.strokeWidth - Line stroke width (default: 0.5)
   * @param {boolean} options.showLabels - Show coordinate labels (default: true)
   * @returns {string} SVG markup for grid
   */
  renderCoordinateGrid(viewBox, options = {}) {
    if (!this.debugLayer) return '';

    const spacing = options.spacing || 50;
    const color = options.color || 'rgba(255, 255, 255, 0.2)';
    const strokeWidth = options.strokeWidth || 0.5;
    const showLabels = options.showLabels !== false;

    const [minX, minY, width, height] = viewBox;
    const maxX = minX + width;
    const maxY = minY + height;

    const doc = this.debugLayer.ownerDocument;
    const gridGroup = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
    gridGroup.setAttribute('class', 'msd-debug-grid');
    gridGroup.setAttribute('opacity', '0.5');

    // Vertical lines
    for (let x = Math.ceil(minX / spacing) * spacing; x <= maxX; x += spacing) {
      const line = doc.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x);
      line.setAttribute('y1', minY);
      line.setAttribute('x2', x);
      line.setAttribute('y2', maxY);
      line.setAttribute('stroke', color);
      line.setAttribute('stroke-width', strokeWidth);
      gridGroup.appendChild(line);

      // Add coordinate label
      if (showLabels && x % (spacing * 2) === 0) {
        const text = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', minY + 12);
        text.setAttribute('fill', color);
        text.setAttribute('font-size', 10);
        text.setAttribute('font-family', 'monospace');
        text.textContent = x;
        gridGroup.appendChild(text);
      }
    }

    // Horizontal lines
    for (let y = Math.ceil(minY / spacing) * spacing; y <= maxY; y += spacing) {
      const line = doc.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', minX);
      line.setAttribute('y1', y);
      line.setAttribute('x2', maxX);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', color);
      line.setAttribute('stroke-width', strokeWidth);
      gridGroup.appendChild(line);

      // Add coordinate label
      if (showLabels && y % (spacing * 2) === 0) {
        const text = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', minX + 4);
        text.setAttribute('y', y - 2);
        text.setAttribute('fill', color);
        text.setAttribute('font-size', 10);
        text.setAttribute('font-family', 'monospace');
        text.textContent = y;
        gridGroup.appendChild(text);
      }
    }

    // Append grid to debug layer
    // Remove existing grid first
    const existingGrid = this.debugLayer.querySelector('.msd-debug-grid');
    if (existingGrid) {
      existingGrid.remove();
    }
    this.debugLayer.insertBefore(gridGroup, this.debugLayer.firstChild); // Insert at beginning so it's behind other elements

    lcardsLog.debug('[MsdDebugRenderer] Rendered coordinate grid', { viewBox, spacing });
    return gridGroup.outerHTML;
  }

  /**
   * Render overlay bounding boxes
   * @param {Array<Object>} overlays
   */
  renderOverlayBounds(overlays = []) {
    if (!this.debugLayer) return;

    this.boundingBoxes.forEach((bboxObj) => {
      bboxObj.rect?.remove();
      bboxObj.label?.remove();
    });
    this.boundingBoxes.clear();

    let bboxCount = 0;
    overlays.forEach(overlay => {
      lcardsLog.debug('[MsdDebugRenderer] Checking overlay for bbox:', {
        id: overlay.id,
        type: overlay.type,
        hasPosition: !!overlay.position,
        position: overlay.position,
        hasSize: !!overlay.size
      });

      if (overlay.position && Array.isArray(overlay.position)) {
        const [x, y] = overlay.position;

        // Get actual dimensions based on overlay type
        const dimensions = this._getOverlayDimensions(overlay, x, y);
        if (!dimensions) {
          lcardsLog.debug('[MsdDebugRenderer] No dimensions for overlay:', overlay.id);
          return;
        }

        const bboxObj = this.createBoundingBox(overlay.id, dimensions.x, dimensions.y, dimensions.width, dimensions.height);
        this.debugLayer.appendChild(bboxObj.rect);
        this.debugLayer.appendChild(bboxObj.label);
        this.boundingBoxes.set(overlay.id, bboxObj);
        bboxCount++;
      }
    });

    lcardsLog.debug(`[MsdDebugRenderer] Rendered ${bboxCount} bounding boxes`);
  }

  /**
   * Create bounding box visualization objects
   * @param {string} id
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @returns {{rect: SVGRectElement, label: SVGTextElement}}
   */
  createBoundingBox(id, x, y, width, height) {
    const doc = this.debugLayer.ownerDocument;
    const rect = doc.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', width);
    rect.setAttribute('height', height);
    rect.setAttribute('fill', 'none');
    rect.setAttribute('stroke', 'orange');
    rect.setAttribute('stroke-width', 1 * this.scale);
    rect.setAttribute('stroke-dasharray', `${3 * this.scale},${3 * this.scale}`);
    rect.setAttribute('opacity', '0.7');
    rect.setAttribute('class', 'msd-debug-bbox');

    const label = doc.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', x + (2 * this.scale));
    label.setAttribute('y', y + (12 * this.scale));
    label.setAttribute('fill', 'orange');
    label.setAttribute('font-size', 10 * this.scale);
    label.setAttribute('font-family', 'monospace');
    label.setAttribute('opacity', '0.9');
    label.textContent = id || 'unknown';
    label.setAttribute('class', 'msd-debug-bbox-label');

    return { rect, label };
  }



  /**
   * Connect to AdvancedRenderer's SVG structure
   * @param {SVGElement} svgElement
   * @param {Array} viewBox
   * @param {Object} anchors
   */
  integrateWithAdvancedRenderer(svgElement, viewBox, anchors = {}) {
    if (!svgElement) return;
    this.ensureDebugLayer(svgElement);
    this.viewBox = viewBox;
    this.anchors = anchors;
  }

  /**
   * Setup debug layer container group inside the SVG.
   * @param {SVGElement} svgElement
   */
  ensureDebugLayer(svgElement) {
    if (!svgElement) {
      lcardsLog.warn('[MsdDebugRenderer] ensureDebugLayer: no SVG element provided');
      return;
    }

    let debugLayer = svgElement.querySelector('#msd-debug-layer');
    if (!debugLayer) {
      lcardsLog.debug('[MsdDebugRenderer] Creating new debug layer');
      const doc = svgElement.ownerDocument;
      debugLayer = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
      debugLayer.id = 'msd-debug-layer';
      debugLayer.style.pointerEvents = 'none';
      debugLayer.style.zIndex = '1000';
      svgElement.appendChild(debugLayer);
    } else {
      lcardsLog.debug('[MsdDebugRenderer] Using existing debug layer');
    }

    this.debugLayer = debugLayer;
  }

  /**
   * Toggle debug visualization on/off.
   * @param {boolean} enabled
   * @returns {boolean}
   */
  toggle(enabled = !this.enabled) {
    this.enabled = enabled;
    if (this.debugLayer) {
      this.debugLayer.style.display = enabled ? 'block' : 'none';
    }
    lcardsLog.debug(`[MsdDebugRenderer] Debug visualization ${enabled ? 'enabled' : 'disabled'}`);
    return enabled;
  }

  /**
   * Toggle a specific debug feature.
   * @param {string} feature - Feature key
   * @param {boolean} enabled - Desired state
   */
  toggleFeature(feature, enabled) {
    if (this.features.hasOwnProperty(feature)) {
      this.features[feature] = enabled;
      lcardsLog.debug(`[MsdDebugRenderer] Feature '${feature}' ${enabled ? 'enabled' : 'disabled'}`);

      // Optionally re-render (future HUD integration may call up-stream)
      setTimeout(() => {
        if (this._lastRenderContext) {
          const { root, viewBox, opts } = this._lastRenderContext;
          this.render(root, viewBox, opts);
        }
      }, 10);
    }
  }

  /**
   * Get current debug state summary.
   * @returns {Object}
   */
  getDebugState() {
    return {
      enabled: this.enabled,
      features: { ...this.features },
      hasDebugLayer: Boolean(this.debugLayer),
      markerCount: this.anchorMarkers.size,
      boundingBoxCount: this.boundingBoxes.size,
      routingOverlayCount: this.routingOverlays.size
    };
  }

  /**
   * Get overlay dimensions based on overlay type and rendered content - ENHANCED for baseline accuracy
   * @private
   * @param {Object} overlay - Overlay configuration
   * @param {number} x - X position
   * @param {number} y - Y position
   * @returns {Object|null} Dimensions object with x, y, width, height
   */
  _getOverlayDimensions(overlay, x, y) {
    // First, check if the overlay has been rendered and has dimension data attributes
    if (this.debugLayer) {
      const svgElement = this.debugLayer.closest('svg');
      if (svgElement) {
        const renderedOverlay = svgElement.querySelector(`[data-overlay-id="${overlay.id}"]`);
        if (renderedOverlay) {
          // Try to get dimensions from data attributes (set by TextOverlayRenderer)
          const width = renderedOverlay.getAttribute('data-text-width');
          const height = renderedOverlay.getAttribute('data-text-height');
          const fontSize = renderedOverlay.getAttribute('data-font-size');
          const dominantBaseline = renderedOverlay.getAttribute('data-dominant-baseline');
          const textAnchor = renderedOverlay.getAttribute('data-text-anchor');

          if (width && height && width !== '0' && height !== '0') {
            // Calculate proper positions based on actual rendered attributes
            const textHeight = parseFloat(height);
            const textWidth = parseFloat(width);
            const textFontSize = parseFloat(fontSize) || 16;

            // Y position calculation based on actual dominant baseline
            let adjustedY = y;
            const actualBaseline = dominantBaseline || 'auto';

            if (actualBaseline === 'hanging') {
              // Text starts at y, so bounding box starts at y
              adjustedY = y;
            } else if (actualBaseline === 'middle' || actualBaseline === 'central') {
              // Text is centered on y, so bounding box starts at y - height/2
              adjustedY = y - textHeight / 2;
            } else if (actualBaseline === 'text-after-edge') {
              // Text ends at y, so bounding box starts at y - height
              adjustedY = y - textHeight;
            } else {
              // Default/auto baseline - estimate ascent position
              const ascent = textFontSize * 0.7;
              adjustedY = y - ascent;
            }

            // X position calculation based on actual text anchor
            let adjustedX = x;
            const actualTextAnchor = textAnchor || 'start';

            if (actualTextAnchor === 'middle') {
              adjustedX = x - textWidth / 2;
            } else if (actualTextAnchor === 'end') {
              adjustedX = x - textWidth;
            }
            // 'start' anchor keeps x as-is



            return {
              x: adjustedX,
              y: adjustedY,
              width: textWidth,
              height: textHeight
            };
          }
        }
      }
    }

    // Fallback to overlay-specific dimension calculation
    switch (overlay.type) {
      case 'text':
        return this._calculateTextOverlayDimensions(overlay, x, y);

      case 'line':
        return this._calculateLineOverlayDimensions(overlay, x, y);

      case 'image':
        return this._calculateImageOverlayDimensions(overlay, x, y);

      case 'rect':
      case 'rectangle':
        return this._calculateRectOverlayDimensions(overlay, x, y);

      default:
        // Generic fallback using size property or default
        const width = overlay.size ? overlay.size[0] : 100;
        const height = overlay.size ? overlay.size[1] : 20;
        return { x, y, width, height };
    }
  }

  /**
   * Calculate text overlay dimensions using similar logic to TextOverlayRenderer
   * @private
   */
  _calculateTextOverlayDimensions(overlay, x, y) {
    try {
      // Get the SVG container for proper measurement context
      const svgElement = this.debugLayer?.closest('svg');
      const container = svgElement?.parentElement || this.debugLayer;

      // Try to use TextOverlayRenderer's attachment point calculation
      if (window.lcards?.TextOverlayRenderer?.computeAttachmentPoints) {
        const attachmentData = window.lcards.TextOverlayRenderer.computeAttachmentPoints(
          overlay,
          this.anchors || {},
          container
        );

        if (attachmentData && attachmentData.bbox) {
          lcardsLog.debug(`[MsdDebugRenderer] Using TextOverlayRenderer bbox for ${overlay.id}`);
          return {
            x: attachmentData.bbox.left,
            y: attachmentData.bbox.top,
            width: attachmentData.bbox.width,
            height: attachmentData.bbox.height
          };
        }
      }

      // Alternative: Try to get dimensions from already rendered overlay
      if (svgElement) {
        const renderedElement = svgElement.querySelector(`[data-overlay-id="${overlay.id}"]`);
        if (renderedElement) {
          try {
            const bbox = renderedElement.getBBox();
            if (bbox.width > 0 && bbox.height > 0) {
              lcardsLog.debug(`[MsdDebugRenderer] Using getBBox for ${overlay.id}: ${bbox.width}x${bbox.height}`);
              return {
                x: bbox.x,
                y: bbox.y,
                width: bbox.width,
                height: bbox.height
              };
            }
          } catch (bboxError) {
            lcardsLog.warn(`[MsdDebugRenderer] getBBox failed for ${overlay.id}:`, bboxError);
          }
        }
      }

      // Fallback to manual text measurement
      const style = overlay.finalStyle || overlay.style || {};
      const textContent = style.value || overlay.text || overlay.content ||
                         overlay._raw?.content || overlay._raw?.text || '';

      if (!textContent) {
        return { x, y, width: 0, height: 0 };
      }

      // Basic text measurement fallback
      const fontSize = style.font_size || style.fontSize || 16;
      const fontFamily = style.font_family || style.fontFamily || 'monospace';

      // Estimate dimensions (this is a rough approximation)
      const charWidth = fontSize * 0.6; // Rough estimate for monospace
      const lineHeight = fontSize * 1.2;

      const lines = textContent.split('\n');
      const maxLineLength = Math.max(...lines.map(line => line.length));

      const width = maxLineLength * charWidth;
      const height = lines.length * lineHeight;

      // Adjust position based on text anchor and baseline
      const textAnchor = style.text_anchor || style.textAnchor || 'start';
      const dominantBaseline = style.dominant_baseline || style.dominantBaseline || 'auto';

      let adjustedX = x;
      if (textAnchor === 'middle') {
        adjustedX = x - width / 2;
      } else if (textAnchor === 'end') {
        adjustedX = x - width;
      }

      // Calculate proper Y position based on dominant baseline
      let adjustedY = y;
      const ascent = fontSize * 0.7; // Estimate ascent

      if (dominantBaseline === 'hanging') {
        // Text starts at y, so bounding box starts at y
        adjustedY = y;
      } else if (dominantBaseline === 'middle' || dominantBaseline === 'central') {
        // Text is centered on y, so bounding box starts at y - height/2
        adjustedY = y - height / 2;
      } else if (dominantBaseline === 'text-after-edge') {
        // Text ends at y, so bounding box starts at y - height
        adjustedY = y - height;
      } else {
        // Default/auto baseline - text baseline is at y, so bounding box starts at y - ascent
        adjustedY = y - ascent;
      }

      return {
        x: adjustedX,
        y: adjustedY,
        width,
        height
      };
    } catch (error) {
      lcardsLog.warn(`[MsdDebugRenderer] ⚠️ Failed to calculate text dimensions for ${overlay.id}:`, error);
      return { x, y, width: 100, height: 20 };
    }
  }

  /**
   * Calculate line overlay dimensions
   * @private
   */
  _calculateLineOverlayDimensions(overlay, x, y) {
    const endpoints = overlay.endpoints || overlay.end_points;
    if (!endpoints || !Array.isArray(endpoints) || endpoints.length < 2) {
      return { x, y, width: 50, height: 2 };
    }

    const [start, end] = endpoints;
    const startX = Array.isArray(start) ? start[0] : start.x || x;
    const startY = Array.isArray(start) ? start[1] : start.y || y;
    const endX = Array.isArray(end) ? end[0] : end.x || x + 50;
    const endY = Array.isArray(end) ? end[1] : end.y || y;

    const minX = Math.min(startX, endX);
    const minY = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);

    return {
      x: minX,
      y: minY,
      width: Math.max(width, 2), // Minimum width for visibility
      height: Math.max(height, 2) // Minimum height for visibility
    };
  }

  /**
   * Calculate image overlay dimensions
   * @private
   */
  _calculateImageOverlayDimensions(overlay, x, y) {
    const style = overlay.finalStyle || overlay.style || {};
    const width = style.width || overlay.width || overlay.size?.[0] || 64;
    const height = style.height || overlay.height || overlay.size?.[1] || 64;

    return { x, y, width: parseFloat(width), height: parseFloat(height) };
  }

  /**
   * Calculate rectangle overlay dimensions
   * @private
   */
  _calculateRectOverlayDimensions(overlay, x, y) {
    const style = overlay.finalStyle || overlay.style || {};
    const width = style.width || overlay.width || overlay.size?.[0] || 100;
    const height = style.height || overlay.height || overlay.size?.[1] || 50;

    return { x, y, width: parseFloat(width), height: parseFloat(height) };
  }

  /**
   * Render anchor markers for editor (editor-specific visualization)
   * @param {Object} anchors - Anchor name to position map
   * @param {Object} options - Rendering options
   * @param {string} options.color - Marker color (default: '#FF9900')
   * @param {boolean} options.showLabels - Display anchor names (default: true)
   * @param {number} options.markerSize - Marker radius in pixels (default: 6)
   */
  renderAnchorsForEditor(anchors, options = {}) {
    if (!anchors || !this.debugLayer) return;

    const {
      color = '#FF9900',
      showLabels = true,
      markerSize = 6
    } = options;

    let markerCount = 0;
    for (const [name, pt] of Object.entries(anchors)) {
      if (Array.isArray(pt) && pt.length >= 2) {
        const marker = this._createEditorAnchorMarker(name, pt[0], pt[1], color, showLabels, markerSize);
        this.debugLayer.appendChild(marker);
        markerCount++;
      }
    }

    lcardsLog.debug(`[MsdDebugRenderer] Rendered ${markerCount} editor anchor markers`);
  }

  /**
   * Create editor anchor marker with outer ring + inner dot + label
   * @private
   */
  _createEditorAnchorMarker(name, x, y, color, showLabels, markerSize) {
    const group = this.debugLayer.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('transform', `translate(${x}, ${y})`);
    group.setAttribute('class', 'msd-debug-editor-anchor');

    const outerRadius = markerSize * this.scale;
    const innerRadius = (markerSize / 2) * this.scale;
    const fontSize = 11 * this.scale;
    const labelOffset = (markerSize + 4) * this.scale;

    // Outer ring for visibility
    const outerRing = this.debugLayer.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'circle');
    outerRing.setAttribute('cx', 0);
    outerRing.setAttribute('cy', 0);
    outerRing.setAttribute('r', outerRadius);
    outerRing.setAttribute('fill', 'none');
    outerRing.setAttribute('stroke', color);
    outerRing.setAttribute('stroke-width', 2 * this.scale);
    outerRing.setAttribute('opacity', '0.8');

    // Inner dot for precise position
    const innerDot = this.debugLayer.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'circle');
    innerDot.setAttribute('cx', 0);
    innerDot.setAttribute('cy', 0);
    innerDot.setAttribute('r', innerRadius);
    innerDot.setAttribute('fill', color);
    innerDot.setAttribute('opacity', '0.9');

    group.appendChild(outerRing);
    group.appendChild(innerDot);

    // Label with background
    if (showLabels) {
      // Background rect for label
      const labelText = `${name}`;
      const labelWidth = labelText.length * 7 * this.scale;
      const labelHeight = 14 * this.scale;

      const labelBg = this.debugLayer.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'rect');
      labelBg.setAttribute('x', labelOffset);
      labelBg.setAttribute('y', -labelHeight / 2);
      labelBg.setAttribute('width', labelWidth);
      labelBg.setAttribute('height', labelHeight);
      labelBg.setAttribute('fill', 'rgba(0, 0, 0, 0.7)');
      labelBg.setAttribute('rx', 2 * this.scale);

      const label = this.debugLayer.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', labelOffset + 2 * this.scale);
      label.setAttribute('y', 4 * this.scale);
      label.setAttribute('fill', color);
      label.setAttribute('font-size', fontSize);
      label.setAttribute('font-family', 'monospace');
      label.setAttribute('font-weight', 'bold');
      label.setAttribute('opacity', '0.95');
      label.textContent = labelText;

      group.appendChild(labelBg);
      group.appendChild(label);
    }

    return group;
  }

  /**
   * Render 9-point attachment grid on control overlay (editor-specific)
   * @param {Object} overlay - Control overlay object with position and size
   * @param {Object} options - Rendering options
   * @param {string} options.color - Point color (default: '#00FF00')
   * @param {boolean} options.showLabels - Display point names (default: false)
   * @param {number} options.pointSize - Point radius in pixels (default: 4)
   */
  render9PointAttachments(overlay, options = {}) {
    if (!overlay || !overlay.position || !this.debugLayer) return;

    const {
      color = '#00FF00',
      showLabels = false,
      pointSize = 4
    } = options;

    const [x, y] = overlay.position;
    const size = overlay.size || [100, 50];
    const [width, height] = size;

    // Calculate 9 attachment points
    const points = {
      'top-left': [x, y],
      'top': [x + width / 2, y],
      'top-right': [x + width, y],
      'left': [x, y + height / 2],
      'center': [x + width / 2, y + height / 2],
      'right': [x + width, y + height / 2],
      'bottom-left': [x, y + height],
      'bottom': [x + width / 2, y + height],
      'bottom-right': [x + width, y + height]
    };

    // Render each attachment point
    for (const [name, [px, py]] of Object.entries(points)) {
      const point = this._create9PointMarker(name, px, py, color, showLabels, pointSize);
      this.debugLayer.appendChild(point);
    }

    lcardsLog.debug(`[MsdDebugRenderer] Rendered 9-point attachments for overlay ${overlay.id}`);
  }

  /**
   * Create 9-point attachment marker
   * @private
   */
  _create9PointMarker(name, x, y, color, showLabels, pointSize) {
    const group = this.debugLayer.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('class', 'msd-debug-9point');

    const circle = this.debugLayer.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', pointSize * this.scale);
    circle.setAttribute('fill', color);
    circle.setAttribute('stroke', 'white');
    circle.setAttribute('stroke-width', 1 * this.scale);
    circle.setAttribute('opacity', '0.8');

    group.appendChild(circle);

    // Optional label
    if (showLabels) {
      const label = this.debugLayer.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', x + (6 * this.scale));
      label.setAttribute('y', y + (3 * this.scale));
      label.setAttribute('fill', color);
      label.setAttribute('font-size', 9 * this.scale);
      label.setAttribute('font-family', 'monospace');
      label.setAttribute('opacity', '0.9');
      label.textContent = name;
      group.appendChild(label);
    }

    return group;
  }

  /**
   * Render routing channel rectangle (editor-specific)
   * @param {Object} channel - Channel object with bounds and type
   * @param {Object} options - Rendering options
   * @param {boolean} options.showLabel - Display channel name/type (default: true)
   */
  renderRoutingChannel(channel, options = {}) {
    if (!channel || !channel.bounds || !this.debugLayer) return;

    const { showLabel = true } = options;

    const bounds = channel.bounds;
    const [x, y, width, height] = bounds;

    // Color-code by channel type
    const typeColors = {
      bundling: 'rgba(0, 255, 0, 0.2)',   // Green
      avoiding: 'rgba(255, 0, 0, 0.2)',   // Red
      waypoint: 'rgba(0, 0, 255, 0.2)'    // Blue
    };

    const typeStrokeColors = {
      bundling: '#00FF00',
      avoiding: '#FF0000',
      waypoint: '#0000FF'
    };

    const fillColor = typeColors[channel.type] || 'rgba(128, 128, 128, 0.2)';
    const strokeColor = typeStrokeColors[channel.type] || '#808080';

    // Create channel rectangle
    const rect = this.debugLayer.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', width);
    rect.setAttribute('height', height);
    rect.setAttribute('fill', fillColor);
    rect.setAttribute('stroke', strokeColor);
    rect.setAttribute('stroke-width', 2 * this.scale);
    rect.setAttribute('stroke-dasharray', `${4 * this.scale},${4 * this.scale}`);
    rect.setAttribute('class', 'msd-debug-channel');

    this.debugLayer.appendChild(rect);

    // Label with channel name and type
    if (showLabel && channel.id) {
      const labelText = `${channel.id} (${channel.type || 'unknown'})`;
      const label = this.debugLayer.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', x + (4 * this.scale));
      label.setAttribute('y', y + (14 * this.scale));
      label.setAttribute('fill', strokeColor);
      label.setAttribute('font-size', 11 * this.scale);
      label.setAttribute('font-family', 'monospace');
      label.setAttribute('font-weight', 'bold');
      label.setAttribute('opacity', '0.9');
      label.textContent = labelText;

      // Label background for readability
      const labelBg = this.debugLayer.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'rect');
      labelBg.setAttribute('x', x + (2 * this.scale));
      labelBg.setAttribute('y', y + (2 * this.scale));
      labelBg.setAttribute('width', labelText.length * 7 * this.scale);
      labelBg.setAttribute('height', 14 * this.scale);
      labelBg.setAttribute('fill', 'rgba(0, 0, 0, 0.7)');
      labelBg.setAttribute('rx', 2 * this.scale);

      this.debugLayer.appendChild(labelBg);
      this.debugLayer.appendChild(label);
    }

    lcardsLog.debug(`[MsdDebugRenderer] Rendered routing channel ${channel.id}`);
  }

  /**
   * Essential cleanup to prevent memory leaks
   */
  destroy() {
    // Unsubscribe from debug manager changes
    if (this.unsubscribeDebug) {
      this.unsubscribeDebug();
      this.unsubscribeDebug = null;
    }

    // Clear debug layer reference
    this.debugLayer = null;
    this._lastRenderContext = null;
  }
}

// Keep browser fallback for direct script loading
if (typeof window !== 'undefined') {
  window.lcards = window.lcards || {};
  window.lcards.MsdDebugRenderer = MsdDebugRenderer;
}