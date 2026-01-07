/**
 * [AdvancedRenderer] Advanced renderer - clean implementation for MSD v1
 * 🎨 Main orchestrator that delegates to specialized renderers
 */


import { RendererUtils } from './RendererUtils.js';
import { OverlayUtils } from './OverlayUtils.js';
import { AttachmentPointManager } from './AttachmentPointManager.js';

import { MsdControlsRenderer } from '../controls/MsdControlsRenderer.js';
import { lcardsLog } from '../../utils/lcards-logging.js';

// Phase 3: Instance-based overlay architecture (COMPLETE)
import { OverlayBase } from '../overlays/OverlayBase.js';
import { LineOverlay } from '../overlays/LineOverlay.js';

export class AdvancedRenderer {
  constructor(mountEl, routerCore, coordinator = null) {
    this.mountEl = mountEl;
    this.routerCore = routerCore;
    this.coordinator = coordinator;
    this.overlayElements = new Map();
    this.lastRenderArgs = null;

    // Centralized attachment point management
    this.attachmentManager = new AttachmentPointManager();

    // Track overlay elements for efficient updates
    this.overlayElementCache = new Map(); // overlayId -> DOM element
    this._lineDeps = new Map(); // targetOverlayId -> Set(lineOverlayId)

    // Phase 3: Cache for instance-based overlay renderers
    // Maps overlay.id -> OverlayBase instance
    this.overlayRenderers = new Map();

    this._performance = {
      renderStart: null,
      renderEnd: null,
      stages: {
        preparation: 0,
        overlayRendering: 0,
        domInjection: 0,
        actionAttachment: 0
      },
      overlayTimings: new Map(),
      totalRenderTime: 0,
      overlayCount: 0,
      lastRenderTimestamp: null
    };

  }

  /**
   * Render the complete MSD with all overlays
   * ✅ ENHANCED: Phase 5.3 - Now includes detailed performance tracking
   *
   * @param {Object} resolvedModel - Complete model with overlays and anchors
   * @returns {Promise<Object>} {svgMarkup, overlayCount, errors, provenance}
   */
  async render(resolvedModel) {
    // ✅ NEW: Start overall performance tracking (Phase 5.3)
    this._performance.renderStart = performance.now();
    this._performance.overlayTimings.clear();
    this._performance.overlayCount = 0;

    if (!resolvedModel) {
      lcardsLog.warn('[AdvancedRenderer] ⚠️ No resolved model provided');
      return { svgMarkup: '', overlayCount: 0 };
    }

    const { overlays = [], anchors = {}, viewBox } = resolvedModel;

    // Store static anchors for use throughout render
    this._staticAnchors = anchors;

    lcardsLog.debug(`[AdvancedRenderer] 🎨 Rendering ${overlays.length} overlays, ${Object.keys(anchors).length} anchors`);

    // ✅ NEW: Stage 1 - Preparation (Phase 5.3)
    const prepStart = performance.now();

    this.overlayElements.clear();

    // Phase rendering requires live SVG early
    const svg = this.mountEl?.querySelector('svg');
    if (!svg) {
      lcardsLog.warn('[AdvancedRenderer] ❌ SVG element not found in container');
      return { svgMarkup: '', overlayCount: 0 };
    }

    // Prepare / clear overlay group
    const overlayGroup = this._ensureOverlayGroup(svg);
    overlayGroup.innerHTML = '';
    this.overlayElementCache.clear();

    // Phase 3: Line overlay attachment points are set per-instance during render
    // (removed global lineRenderer.setOverlayAttachmentPoints call)

    this._performance.stages.preparation = performance.now() - prepStart;

    // ✅ NEW: Stage 2 - Overlay Rendering (Phase 5.3)
    const renderStart = performance.now();

    // Initialize provenance collection
    const provenance = {
      renderer: 'AdvancedRenderer',
      overlays: {},
      render_summary: {
        total_overlays: overlays.length,
        by_type: {},
        by_renderer: {}
      }
    };

    // Phase 1: render overlays that others may depend on (currently empty)
    const earlyTypes = new Set([]);
    let svgMarkupAccum = '';
    let processedCount = 0;

    overlays.filter(o => earlyTypes.has(o.type)).forEach(ov => {
      try {
        // ✅ NEW: Track per-overlay timing (Phase 5.3)
        const overlayStart = performance.now();

        const result = this.renderOverlay(ov, anchors, viewBox);

        lcardsLog.trace(`[AdvancedRenderer] 📊 Phase 1 overlay result:`, {
          resultType: typeof result,
          isObject: result && typeof result === 'object',
          hasMarkup: result?.markup,
          hasActionInfo: result?.actionInfo,
          overlayId: result?.overlayId
        });

        // CHANGED: Handle new return structure
        if (typeof result === 'string') {
          // Backward compatibility - old renderers return strings
          svgMarkupAccum += result;
        } else if (result && result.markup) {
          // New structure - extract markup
          svgMarkupAccum += result;

          // ✅ NEW: Collect provenance if available (Phase 5.3)
          if (result.provenance) {
            provenance.overlays[ov.id] = result.provenance;

            // Track by type
            const overlayType = result.provenance.overlay_type || ov.type;
            if (!provenance.render_summary.by_type[overlayType]) {
              provenance.render_summary.by_type[overlayType] = 0;
            }
            provenance.render_summary.by_type[overlayType]++;

            // Track by renderer
            const renderer = result.provenance.renderer;
            if (!provenance.render_summary.by_renderer[renderer]) {
              provenance.render_summary.by_renderer[renderer] = {
                count: 0,
                total_time_ms: 0
              };
            }
            provenance.render_summary.by_renderer[renderer].count++;
            provenance.render_summary.by_renderer[renderer].total_time_ms +=
              result.provenance.rendering_time_ms || 0;
          }
        }

        // ✅ NEW: Record overlay timing (Phase 5.3)
        const overlayDuration = performance.now() - overlayStart;
        this._performance.overlayTimings.set(ov.id, {
          type: ov.type,
          duration: overlayDuration
        });
        this._performance.overlayCount++;

        processedCount++;
      } catch (e) {
        lcardsLog.warn(`[AdvancedRenderer] ⚠️ Phase1 render failed for overlay ${ov.id}:`, e);

        // ✅ NEW: Track failed overlay (Phase 5.3)
        provenance.overlays[ov.id] = {
          renderer: 'AdvancedRenderer',
          overlay_id: ov.id,
          error: e.message,
          timestamp: Date.now()
        };
      }
    });

    // Inject Phase 1 DOM
    overlayGroup.innerHTML = svgMarkupAccum;

    this._cacheElementsFrom(overlayGroup);

    // CRITICAL: Populate attachment points from Phase 1 overlays BEFORE Phase 2
    // This ensures line overlays have correct attachment points on initial render
    this._populateInitialAttachmentPoints(overlays, anchors);

    // Build virtual anchors from Phase 1 overlays for line anchoring
    // These are base anchors without gaps - lines will overwrite with gap-applied versions
    this._buildVirtualAnchorsFromAllOverlays(overlays);

    // Build dynamic anchors (overlay destinations) with gap applied
    // This OVERWRITES the base anchors from _buildVirtualAnchorsFromAllOverlays with gap-applied versions
    this.attachmentManager.setAnchorsFromObject(anchors);
    this._buildDynamicOverlayAnchors(overlays);

    // Phase 2a: render non-line overlays (cards, etc.) that lines may attach to
    overlays.filter(o => !earlyTypes.has(o.type) && o.type !== 'line').forEach(ov => {
      try {
        // ✅ NEW: Track per-overlay timing (Phase 5.3)
        const overlayStart = performance.now();

        const result = this.renderOverlay(ov, this._staticAnchors, viewBox);

        lcardsLog.debug(`[AdvancedRenderer] 📊 Phase 2a overlay ${ov.id} result:`, {
          resultType: typeof result,
          isObject: result && typeof result === 'object',
          hasMarkup: result?.markup,
          hasActionInfo: result?.actionInfo,
          overlayId: result?.overlayId
        });

        let markup = null;

        if (typeof result === 'string') {
          markup = result;
        } else if (result && result.markup) {
          markup = result.markup;

          // NEW: Store renderer provenance
          if (result.provenance) {
            this._storeRendererProvenance(ov.id, result.provenance);
            const renderer = result.provenance.renderer;
            if (!provenance.render_summary.by_renderer[renderer]) {
              provenance.render_summary.by_renderer[renderer] = {
                count: 0,
                total_time_ms: 0
              };
            }
            provenance.render_summary.by_renderer[renderer].count++;
            provenance.render_summary.by_renderer[renderer].total_time_ms +=
              result.provenance.rendering_time_ms || 0;
          }
        }

        if (markup) {
          overlayGroup.insertAdjacentHTML('beforeend', markup);
          svgMarkupAccum += markup;
          const el = overlayGroup.querySelector(`[data-overlay-id="${ov.id}"]`);
          if (el) this.overlayElementCache.set(ov.id, el);
        }

        // ✅ NEW: Record overlay timing (Phase 5.3)
        const overlayDuration = performance.now() - overlayStart;
        this._performance.overlayTimings.set(ov.id, {
          type: ov.type,
          duration: overlayDuration
        });
        this._performance.overlayCount++;

        processedCount++;
      } catch (e) {
        lcardsLog.warn(`[AdvancedRenderer] ⚠️ Phase2a render failed for overlay ${ov.id}:`, e);
      }
    });

    // Cache Phase 2a elements and populate attachment points for cards
    this._cacheElementsFrom(overlayGroup);
    this._populateInitialAttachmentPoints(overlays, anchors);

    // Rebuild virtual anchors now that we have Phase 2a overlays (cards, etc.)
    // IMPORTANT: This must run BEFORE _buildDynamicOverlayAnchors so that
    // gap-applied anchors don't get overwritten by non-gap anchors
    this._buildVirtualAnchorsFromAllOverlays(overlays);

    // CRITICAL: Rebuild dynamic overlay anchors now that Phase 2a overlays have attachment points
    // This runs AFTER _buildVirtualAnchorsFromAllOverlays so gaps are preserved
    this._buildDynamicOverlayAnchors(overlays);

    // CRITICAL: Wait for cards to fully position and register attachment points
    // Cards may register attachment points during their connectedCallback/firstUpdated lifecycle
    // which happens asynchronously after element creation
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    lcardsLog.debug('[AdvancedRenderer] 🎯 Attachment points available:', {
      totalAnchors: Object.keys(this._staticAnchors).length,
      attachmentPointCount: this.attachmentManager?._attachmentPoints?.size || 0
    });

    // Phase 2b: render line overlays (now ALL targets exist with attachment points)
    overlays.filter(o => o.type === 'line').forEach(ov => {
      try {
        // ✅ NEW: Track per-overlay timing (Phase 5.3)
        const overlayStart = performance.now();

        const result = this.renderOverlay(ov, this._staticAnchors, viewBox);

        lcardsLog.debug(`[AdvancedRenderer] 📊 Phase 2b overlay ${ov.id} result:`, {
          resultType: typeof result,
          isObject: result && typeof result === 'object',
          hasMarkup: result?.markup,
          hasActionInfo: result?.actionInfo,
          overlayId: result?.overlayId
        });

        let markup = '';
        if (typeof result === 'string') {
          markup = result;
        } else if (result && result.markup) {
          markup = result.markup;

          // ✅ NEW: Collect provenance if available (Phase 5.3)
          if (result.provenance) {
            provenance.overlays[ov.id] = result.provenance;

            // Track by type
            const overlayType = result.provenance.overlay_type || ov.type;
            if (!provenance.render_summary.by_type[overlayType]) {
              provenance.render_summary.by_type[overlayType] = 0;
            }
            provenance.render_summary.by_type[overlayType]++;

            // Track by renderer
            const renderer = result.provenance.renderer;
            if (!provenance.render_summary.by_renderer[renderer]) {
              provenance.render_summary.by_renderer[renderer] = {
                count: 0,
                total_time_ms: 0
              };
            }
            provenance.render_summary.by_renderer[renderer].count++;
            provenance.render_summary.by_renderer[renderer].total_time_ms +=
              result.provenance.rendering_time_ms || 0;
          }
        }

        if (markup) {
          overlayGroup.insertAdjacentHTML('beforeend', markup);
          svgMarkupAccum += markup;
          const el = overlayGroup.querySelector(`[data-overlay-id="${ov.id}"]`);
          if (el) this.overlayElementCache.set(ov.id, el);
          const raw = ov._raw || ov.raw || {};
          const targetId = raw.attach_to || raw.attachTo;
          if (targetId) {
            if (!this._lineDeps.has(targetId)) this._lineDeps.set(targetId, new Set());
            this._lineDeps.get(targetId).add(ov.id);

            // NEW: ensure RouterCore sees a route for overlay-destination line (HUD listing)
            if (this.routerCore && raw.anchor) {
              const anchorPt = this.attachmentManager.getAnchor(raw.anchor);

              // Build virtual anchor ID for destination overlay
              const attachSide = raw.attach_side || raw.attachSide || 'center';
              const virtualAnchorId = attachSide === 'center' ? targetId : `${targetId}.${attachSide}`;
              const targetPt = this.attachmentManager.getAnchor(virtualAnchorId);

              if (anchorPt && targetPt) {
                try {
                  const req = this.routerCore.buildRouteRequest(ov, anchorPt, targetPt);
                  this.routerCore.computePath(req);
                } catch (e) {
                  lcardsLog.debug('[AdvancedRenderer] 🔗 Route registration failed for overlay', ov.id, e);
                }
              }
            }
          }
        }

        // ✅ NEW: Record overlay timing (Phase 5.3)
        const overlayDuration = performance.now() - overlayStart;
        this._performance.overlayTimings.set(ov.id, {
          type: ov.type,
          duration: overlayDuration
        });
        this._performance.overlayCount++;

        processedCount++;
      } catch (e) {
        lcardsLog.warn(`[AdvancedRenderer] ⚠️ Phase2b render failed for overlay ${ov.id}:`, e);

        // ✅ NEW: Track failed overlay (Phase 5.3)
        provenance.overlays[ov.id] = {
          renderer: 'AdvancedRenderer',
          overlay_id: ov.id,
          error: e.message,
          timestamp: Date.now()
        };
      }
    });

    this._performance.stages.overlayRendering = performance.now() - renderStart;

    // ✅ NEW: Stage 3 - DOM Injection (Phase 5.3)
    const domStart = performance.now();

    this._performance.stages.domInjection = performance.now() - domStart;

    lcardsLog.debug('[AdvancedRenderer] Injected elements (after phased render):', {
      total: this.overlayElementCache.size,
      lines: overlayGroup.querySelectorAll('[data-overlay-type="line"]').length,
      controls: overlayGroup.querySelectorAll('[data-overlay-type="control"]').length
    });

    // ✅ NEW: Stage 4 - Action Attachment (already done inline, track time)
    // Action attachment time is tracked inline above during Phase 1 and Phase 2

    // NEW: schedule deferred line refresh to fix first-load orientation/position
    this._scheduleDeferredLineRefresh(overlays, this._staticAnchors, viewBox);

    this.lastRenderArgs = { resolvedModel, overlays, svg };

    // ✅ NEW: Calculate total and store final metrics (Phase 5.3)
    this._performance.renderEnd = performance.now();
    this._performance.totalRenderTime = this._performance.renderEnd - this._performance.renderStart;
    this._performance.lastRenderTimestamp = Date.now();

    // ✅ NEW: Add performance summary to provenance (Phase 5.3)
    provenance.performance = this._getPerformanceSummary();

    // ✅ NEW: Log performance summary (Phase 5.3)
    lcardsLog.debug('[AdvancedRenderer] Render complete', {
      overlays: overlays.length,
      processed: processedCount,
      errors: overlays.length - processedCount,
      totalTime: this._performance.totalRenderTime.toFixed(2) + 'ms',
      stages: {
        preparation: this._performance.stages.preparation.toFixed(2) + 'ms',
        rendering: this._performance.stages.overlayRendering.toFixed(2) + 'ms',
        domInjection: this._performance.stages.domInjection.toFixed(2) + 'ms'
      }
    });

    // ✅ NEW: Store provenance in config (Phase 5.3)
    const config = window.lcards.debug.msd?.pipelineInstance?.config;
    if (config && config.__provenance) {
      config.__provenance.advanced_renderer = provenance;
    }

    return {
      svgMarkup: svgMarkupAccum,
      overlayCount: processedCount,
      errors: overlays.length - processedCount,
      provenance  // ✅ NEW: Return provenance data (Phase 5.3)
    };
  }

  /**
   * Compute attachment points for any overlay type
   * @param {Object} overlay - Overlay configuration
   * @param {Object} anchors - Available anchors
   * @param {Element} container - Container element for measurements
   * @param {Array} viewBox - ViewBox dimensions for proper scaling
   * @returns {Object|null} Attachment points object or null if not computable
   */
  computeAttachmentPointsForType(overlay, anchors, container, viewBox = null) {
    if (!overlay || !overlay.type || !overlay.id) {
      return null;
    }

    // Use provided viewBox or try to get from resolved model
    let effectiveViewBox = viewBox;
    if (!effectiveViewBox) {
      const resolvedModel = this._getResolvedModel();
      effectiveViewBox = resolvedModel?.viewBox || [0, 0, 400, 200];
    }

    try {
      switch (overlay.type) {
        case 'control':
          return this._computeControlAttachmentPoints(overlay, anchors, container, effectiveViewBox);
        case 'line':
          // Lines don't have attachment points (they attach to others, not vice versa)
          return null;
        default:
          lcardsLog.warn(`[AdvancedRenderer] Unknown overlay type for attachment points: ${overlay.type}`);
          return null;
      }
    } catch (error) {
      lcardsLog.warn(`[AdvancedRenderer] Failed to compute attachment points for ${overlay.id}:`, error);
      return null;
    }
  }

  // Individual attachment point computation methods for each overlay type

  _computeControlAttachmentPoints(overlay, anchors, container, viewBox) {
    return MsdControlsRenderer.computeAttachmentPoints(overlay, anchors, container);
  }

  _ensureOverlayGroup(svg) {
    let group = svg.querySelector('#msd-overlay-container');
    if (!group) {
      group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('id', 'msd-overlay-container');
      // CRITICAL: Use 'all' to ensure ALL events can reach child elements
      group.style.pointerEvents = 'all';
      svg.appendChild(group);
    } else {
      // CRITICAL: Ensure existing container also has proper pointer events
      group.style.pointerEvents = 'all';
    }
    return group;
  }

  _cacheElementsFrom(group) {
    const nodes = group.querySelectorAll('[data-overlay-id]');
    nodes.forEach(el => {
      const id = el.getAttribute('data-overlay-id');
      if (id) this.overlayElementCache.set(id, el);
    });
  }

  // Build virtual anchors for lines that attach to overlays
  _buildDynamicOverlayAnchors(overlays) {
    overlays.filter(o => o.type === 'line').forEach(line => {
      const raw = line._raw || line.raw || {};
      const dest = raw.attach_to || raw.attachTo;
      if (!dest) return;

      // Read from attachment manager
      const attachmentPointData = this.attachmentManager.getAttachmentPoints(dest);
      if (!attachmentPointData || !attachmentPointData.points) {
        // Some overlays don't need attachment points (e.g., anchors, controls)
        lcardsLog.debug(`[AdvancedRenderer] No attachment points found for ${dest}`);
        return;
      }

      // Get line anchor for auto-side determination
      // Check if anchor refers to an overlay (has attachment points)
      let lineAnchor = null;
      const sourceAttachmentPoints = this.attachmentManager.getAttachmentPoints(raw.anchor);

      lcardsLog.debug(`[AdvancedRenderer] 🔍 Source anchor resolution for ${line.id}:`);
      lcardsLog.debug(`  raw.anchor: "${raw.anchor}"`);
      lcardsLog.debug(`  hasSourceAttachmentPoints: ${!!sourceAttachmentPoints}`);

      if (sourceAttachmentPoints?.points) {
        // Anchor is an overlay - resolve the appropriate side
        const anchorSide = (raw.anchor_side || raw.anchorSide || '').toLowerCase();

        lcardsLog.debug(`  anchorSide config: "${anchorSide}"`);
        lcardsLog.debug(`  destination center: [${attachmentPointData.points.center.join(', ')}]`);

        const { point: sourcePt, side: sourceEffectiveSide } = this._resolveOverlayAttachmentPoint(
          sourceAttachmentPoints.points,
          anchorSide,
          attachmentPointData.points.center  // Use destination center to auto-determine source side
        );

        lcardsLog.debug(`  resolved sourcePt: [${sourcePt ? sourcePt.join(', ') : 'null'}]`);
        lcardsLog.debug(`  resolved sourceEffectiveSide: "${sourceEffectiveSide}"`);

        lineAnchor = sourcePt;

        // Store the source virtual anchor if it's not center
        if (sourcePt && sourceEffectiveSide && sourceEffectiveSide !== 'center') {
          const sourceVirtualAnchorId = `${raw.anchor}.${sourceEffectiveSide}`;
          const sourceGapPt = this._applyAttachGap(sourcePt, sourceEffectiveSide,
            { anchor_gap: raw.anchor_gap || raw.anchorGap }, sourceAttachmentPoints.bbox);
          this.attachmentManager.setAnchor(sourceVirtualAnchorId, sourceGapPt);
          if (this.routerCore?.anchors) {
            this.routerCore.anchors[sourceVirtualAnchorId] = sourceGapPt;
          }
          lineAnchor = sourceGapPt;  // Use the gap-adjusted point

          // CRITICAL: Write back auto-determined side to overlay config so LineOverlay can use it
          raw.anchor_side = sourceEffectiveSide;
          line.anchor_side = sourceEffectiveSide;  // Also write to top-level object
          lcardsLog.debug(`[AdvancedRenderer] 💾 Wrote back anchor_side to overlay config:`, {
            overlayId: line.id,
            anchor_side: sourceEffectiveSide
          });
        }
      } else {
        // Standard anchor lookup
        lineAnchor = this.attachmentManager.getAnchor(raw.anchor) ||
                    this._staticAnchors[raw.anchor] ||
                    null;
      }

      const configSide = (raw.attach_side || raw.attachSide || '').toLowerCase();

      lcardsLog.debug(`[AdvancedRenderer] 🔗 Building anchor for line ${line.id}:`);
      lcardsLog.debug(`  dest: ${dest}`);
      lcardsLog.debug(`  configSide: "${configSide}" (empty=${!configSide})`);
      lcardsLog.debug(`  lineAnchor: [${lineAnchor ? lineAnchor.join(', ') : 'null'}]`);
      lcardsLog.debug(`  availablePoints: ${Object.keys(attachmentPointData.points).join(', ')}`);
      lcardsLog.debug(`  center: [${attachmentPointData.points.center.join(', ')}]`);
      lcardsLog.debug(`  right: [${attachmentPointData.points.right.join(', ')}]`);
      lcardsLog.debug(`  left: [${attachmentPointData.points.left.join(', ')}]`);

      const { point: basePt, side: effectiveSide } = this._resolveOverlayAttachmentPoint(
        attachmentPointData.points,
        configSide,
        lineAnchor
      );

      lcardsLog.debug(`[AdvancedRenderer] 🎯 Resolved attachment point:`);
      lcardsLog.debug(`  effectiveSide: "${effectiveSide}"`);
      lcardsLog.debug(`  basePt: [${basePt ? basePt.join(', ') : 'null'}]`);
      lcardsLog.debug(`  configSide was: "${configSide}"`);      if (!basePt) {
        lcardsLog.warn(`[AdvancedRenderer] ⚠️ No base point resolved for ${line.id}`);
        return;
      }
      const gapPt = this._applyAttachGap(basePt, effectiveSide, raw, attachmentPointData.bbox);

      // Construct the proper virtual anchor ID based on effective side (which may be auto-determined)
      const virtualAnchorId = effectiveSide && effectiveSide !== 'center' ? `${dest}.${effectiveSide}` : dest;

      lcardsLog.debug(`[AdvancedRenderer] 💾 Storing virtual anchor:`);
      lcardsLog.debug(`  virtualAnchorId: "${virtualAnchorId}"`);
      lcardsLog.debug(`  gapPt: [${gapPt.join(', ')}]`);
      lcardsLog.debug(`  effectiveSide: "${effectiveSide}"`);

      // Store in attachment manager
      this.attachmentManager.setAnchor(virtualAnchorId, gapPt);

      // CRITICAL: Write back auto-determined side to overlay config so LineOverlay can use it
      if (effectiveSide && effectiveSide !== 'center' && !configSide) {
        raw.attach_side = effectiveSide;
        line.attach_side = effectiveSide;  // Also write to top-level object
        lcardsLog.debug(`[AdvancedRenderer] 💾 Wrote back attach_side to overlay config:`, {
          overlayId: line.id,
          attach_side: effectiveSide
        });
      }

      // Register in routerCore so HUD sees it as an anchor
      if (this.routerCore && this.routerCore.anchors) {
        this.routerCore.anchors[virtualAnchorId] = gapPt;
        try {
          this.routerCore.invalidate(line.id);
          const srcAnchor = this.attachmentManager.getAnchor(raw.anchor) || this.routerCore.anchors[raw.anchor];
          if (srcAnchor) {
            const req = this.routerCore.buildRouteRequest(line, srcAnchor, gapPt);
            this.routerCore.computePath(req);
          }
        } catch(e) {
          lcardsLog.info('[AdvancedRenderer] Route registration (initial) failed', line.id, e);
        }
      }
      // Track dependency
      if (!this._lineDeps.has(dest)) this._lineDeps.set(dest, new Set());
      this._lineDeps.get(dest).add(line.id);
    });
  }

  // Update dynamic anchors for changed overlays
  _updateDynamicAnchorsForOverlays(changedIds, overlays, anchorMap) {
    if (!changedIds.size) return;
    changedIds.forEach(id => {
      const tap = this.attachmentManager.getAttachmentPoints(id);
      if (!tap || !tap.points) return;

      // Log what attachment points we're reading for title_overlay
      if (id === 'title_overlay') {
        lcardsLog.trace(`[AdvancedRenderer] 🔍 _updateDynamicAnchorsForOverlays reading title_overlay attachment points:`, {
          right: tap.points.right,
          bboxRight: tap.bbox?.right,
          bboxWidth: tap.bbox?.width
        });
      }

      const dep = this._lineDeps.get(id);
      if (!dep) return;
      dep.forEach(lineId => {
        const line = overlays.find(o => o.id === lineId);
        if (!line) return;
        const raw = line._raw || line.raw || {};

        // Get line anchor for auto-side determination
        const lineAnchor = anchorMap[raw.anchor] ||
                          this.attachmentManager.getAnchor(raw.anchor) ||
                          this.routerCore?.anchors[raw.anchor] ||
                          null;

        const configSide = (raw.attach_side || raw.attachSide || '').toLowerCase();
        const { point: basePt, side: effectiveSide } = this._resolveOverlayAttachmentPoint(
          tap.points,
          configSide,
          lineAnchor
        );
        if (!basePt) return;
        const gapPt = this._applyAttachGap(basePt, effectiveSide, raw, tap.bbox);

        // Construct the proper virtual anchor ID based on effective side (which may be auto-determined)
        const virtualAnchorId = effectiveSide && effectiveSide !== 'center' ? `${id}.${effectiveSide}` : id;

        // Log for title_overlay
        if (id === 'title_overlay' && effectiveSide === 'right') {
          lcardsLog.trace(`[AdvancedRenderer] 🔍 _updateDynamicAnchorsForOverlays setting title_overlay.right:`, {
            basePt,
            gapPt,
            gap: raw.attach_gap
          });
        }

        // Update in attachment manager
        this.attachmentManager.setAnchor(virtualAnchorId, gapPt);

        anchorMap[virtualAnchorId] = gapPt;
        if (this.routerCore && this.routerCore.anchors) {
          this.routerCore.anchors[virtualAnchorId] = gapPt;
          try {
            this.routerCore.invalidate(line.id);
            const srcAnchor = anchorMap[raw.anchor] || this.routerCore.anchors[raw.anchor];
            if (srcAnchor) {
              const req = this.routerCore.buildRouteRequest(line, srcAnchor, gapPt);
              this.routerCore.computePath(req);
            }
          } catch(e) {
            lcardsLog.info('[AdvancedRenderer] Route registration (update) failed', line.id, e);
          }
        }
      });
    });
  }

  // NEW: apply attach_gap offsets
  _applyAttachGap(point, side, raw, bbox) {
    const gap = Number(raw.attach_gap || raw.attachGap || raw.anchor_gap || raw.anchorGap || 0);
    const gapX = Number(raw.attach_gap_x || raw.attachGapX || raw.anchor_gap_x || raw.anchorGapX || gap || 0);
    const gapY = Number(raw.attach_gap_y || raw.attachGapY || raw.anchor_gap_y || raw.anchorGapY || gap || 0);

    lcardsLog.trace(`[AdvancedRenderer] 🔧 _applyAttachGap:`, {
      point,
      side,
      gap,
      gapX,
      gapY,
      rawGaps: {
        attach_gap: raw.attach_gap,
        anchor_gap: raw.anchor_gap
      }
    });

    if (!(gapX || gapY)) {
      lcardsLog.debug(`[AdvancedRenderer] ⏭️ No gap to apply, returning original point`);
      return point;
    }

    const [x, y] = point;
    let dx = 0, dy = 0;
    switch (side) {
      case 'left': dx = -gapX; break;
      case 'right': dx = gapX; break;
      case 'top': dy = -gapY; break;
      case 'bottom': dy = gapY; break;
      case 'top-left': dx = -gapX; dy = -gapY; break;
      case 'top-right': dx = gapX; dy = -gapY; break;
      case 'bottom-left': dx = -gapX; dy = gapY; break;
      case 'bottom-right': dx = gapX; dy = gapY; break;
      default: break;
    }

    const result = [x + dx, y + dy];
    lcardsLog.trace(`[AdvancedRenderer] ✅ Applied gap: [${point}] + [${dx}, ${dy}] = [${result}]`);
    return result;
  }

  // NEW: resolve which attachment point to use based on side keyword
  // If side is not specified (empty), auto-determine best side based on line anchor position
  // Returns: { point: [x, y], side: 'left'|'right'|'top'|'bottom'|etc }
  _resolveOverlayAttachmentPoint(points, side, lineAnchor = null) {
    if (!points) return { point: null, side: null };

    let effectiveSide = side;

    // Auto-determine side if not specified
    if (!side || side === '') {
      lcardsLog.debug('[AdvancedRenderer] 🔍 Auto-determination check:', {
        hasLineAnchor: !!lineAnchor,
        lineAnchor,
        hasCenter: !!points?.center,
        center: points?.center
      });

      if (lineAnchor && points.center) {
        // Calculate which side of the overlay is closest to the line anchor
        const [lineX, lineY] = lineAnchor;
        const [centerX, centerY] = points.center;

        const dx = lineX - centerX;
        const dy = lineY - centerY;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        // Determine primary direction (horizontal or vertical)
        if (absDx > absDy) {
          // Horizontal: left or right
          effectiveSide = dx < 0 ? 'left' : 'right';
        } else {
          // Vertical: top or bottom
          effectiveSide = dy < 0 ? 'top' : 'bottom';
        }

        lcardsLog.debug('[AdvancedRenderer] ✅ Auto-determined attach_side:', effectiveSide, {
          lineAnchor,
          center: points.center,
          dx,
          dy
        });
      } else {
        // Fallback to center if no line anchor provided
        effectiveSide = 'center';
      }
    }

    let point;
    switch (effectiveSide) {
      case 'left': point = points.left || points.leftPadded || points.center; break;
      case 'right': point = points.right || points.rightPadded || points.center; break;
      case 'top': point = points.top || points.topPadded || points.center; break;
      case 'bottom': point = points.bottom || points.bottomPadded || points.center; break;
      case 'top-left': point = points.topLeft || points.left || points.top || points.center; break;
      case 'top-right': point = points.topRight || points.right || points.top || points.center; break;
      case 'bottom-left': point = points.bottomLeft || points.left || points.bottom || points.center; break;
      case 'bottom-right': point = points.bottomRight || points.right || points.bottom || points.center; break;
      case 'center':
      default:
        point = points.center;
        effectiveSide = 'center';
    }

    return { point, side: effectiveSide };
  }

  /**
   * Schedule deferred line refresh
   * No-op maintained for backwards compatibility with render pipeline
   * @private
   */
  _scheduleDeferredLineRefresh(overlays, anchorsRef, viewBox) {
    // No-op: Lines are now refreshed immediately during render
  }

  /**
   * Get or create a renderer for an overlay
   *
   * Phase 3 COMPLETE: All overlay types now use instance-based architecture
   * - TextOverlay, ButtonOverlay, LineOverlay: Full migration
   * - ApexChartsOverlay, StatusGridOverlay: Wrapper pattern
   *
   * @private
   * @param {Object} overlay - Overlay configuration
   * @returns {OverlayBase|null} Renderer instance or null if no renderer available
   */
  _getRendererForOverlay(overlay) {
    // Check if we already have a renderer cached
    if (this.overlayRenderers.has(overlay.id)) {
      return this.overlayRenderers.get(overlay.id);
    }

    // Check if the overlay itself is already an instance-based renderer
    // (This will be the case when overlays are migrated to extend OverlayBase)
    if (overlay instanceof OverlayBase) {
      this.overlayRenderers.set(overlay.id, overlay);
      return overlay;
    }

    // Phase 3: Create instance-based renderers for all overlay types

    // Line overlays use LineOverlay class (SVG-native, MSD-specific)
    if (overlay.type === 'line') {
      const lineOverlay = new LineOverlay(overlay, this.coordinator, this.routerCore);
      this.overlayRenderers.set(overlay.id, lineOverlay);
      return lineOverlay;
    }

    // UNIFIED CARD PATTERN:
    // All other overlays are card-based and handled by MsdControlsRenderer
    // This includes:
    // - LCARdS cards: custom:lcards-button, custom:lcards-chart
    // - HA cards: entities, grid, button, light, etc.
    // - Legacy control overlays with nested card definition

    // Card-based overlays (LCARdS cards, HA cards, controls)
    // Return null to signal that MsdControlsRenderer should handle this
    if (overlay.type === 'control' ||
        overlay.type?.startsWith('custom:') ||
        overlay.type?.startsWith('hui-') ||
        this._isHomeAssistantCardType(overlay.type)) {
      lcardsLog.trace(`[AdvancedRenderer] Card-based overlay ${overlay.id} (${overlay.type}) - delegating to MsdControlsRenderer`);
      return null;
    }

    // Unknown overlay type
    lcardsLog.warn(`[AdvancedRenderer] ⚠️ No renderer available for overlay type: ${overlay.type}`);
    return null;
  }

  /**
   * Check if a type string represents a Home Assistant built-in card
   * @private
   */
  _isHomeAssistantCardType(type) {
    if (!type || typeof type !== 'string') return false;

    // Common HA card types (not exhaustive but covers most cases)
    const haCardTypes = [
      'entities', 'entity', 'glance', 'grid', 'horizontal-stack', 'vertical-stack',
      'button', 'light', 'thermostat', 'gauge', 'sensor', 'history-graph',
      'picture', 'picture-entity', 'picture-glance', 'picture-elements',
      'conditional', 'markdown', 'media-control', 'alarm-panel',
      'weather-forecast', 'shopping-list', 'logbook', 'map', 'iframe',
      'area', 'energy', 'humidifier', 'statistics-graph', 'tile'
    ];

    return haCardTypes.includes(type);
  }


  /**
   * Render individual overlay using appropriate renderer
   *
   * ✅ ENHANCED: Phase 3A+ - Now supports both instance-based (OverlayBase) and static renderers
   * ✅ ENHANCED: Now collects and stores renderer provenance for debugging
   *
   * @private
   */
  renderOverlay(overlay, anchors, viewBox, svgContainer) {
    try {
      lcardsLog.trace(`[AdvancedRenderer] 🎨 Rendering overlay: ${overlay.type} (${overlay.id})`);

      let result;

      // Phase 3A+: Try to get instance-based renderer first
      const renderer = this._getRendererForOverlay(overlay);

      if (renderer instanceof OverlayBase) {
        // Instance-based overlay - currently only LineOverlay uses this pattern
        lcardsLog.trace(`[AdvancedRenderer] 🎯 Using instance-based renderer for ${overlay.id}`);

        if (overlay.type === 'line') {
          // Lines need complete anchor set (static + virtual) for overlay-to-overlay connections
          const completeAnchors = this._getCompleteAnchors(anchors, overlay.type);
          result = renderer.render(overlay, completeAnchors, viewBox, svgContainer);
        } else {
          // Standard render for other instance-based overlays (if any)
          result = renderer.render(overlay, anchors, viewBox, svgContainer);
        }

      } else {
        // No renderer available - delegate to MsdControlsRenderer for card-based overlays
        // This includes:
        // - LCARdS cards (custom:lcards-button, custom:lcards-chart)
        // - HA cards (entities, grid, button, etc.)
        // - Control overlays (type: 'control')

        if (overlay.type === 'line') {
          // Line without renderer is an error
          lcardsLog.error(`[AdvancedRenderer] ❌ Line overlay ${overlay.id} has no renderer`);
          return this.renderFallbackOverlay(overlay);
        }

        // Delegate to MsdControlsRenderer for all card-based overlays
        lcardsLog.debug(`[AdvancedRenderer] 🎴 Delegating card-based overlay ${overlay.id} to MsdControlsRenderer`);

        result = this._renderCardOverlayViaMsdControls(overlay, anchors, viewBox, svgContainer);
      }

      // ✅ NEW: Store renderer provenance after successful render
      if (result && typeof result === 'object' && result.provenance) {
        this._storeRendererProvenance(overlay.id, result.provenance);
      } else if (result && typeof result === 'string' && result !== '') {
        // For renderers that just return string markup (legacy pattern)
        // We still want to track that the overlay was rendered, but without detailed provenance
        this._storeBasicRendererProvenance(overlay.id, overlay.type);
      }

      return result;

    } catch (error) {
      lcardsLog.error(`[AdvancedRenderer] ❌ Error rendering overlay ${overlay.id}:`, error);

      // ✅ NEW: Track failed render
      this._storeFailedRendererProvenance(overlay.id, overlay.type, error);

      return this.renderFallbackOverlay(overlay);
    }
  }

  /**
   * Render card-based overlay via MsdControlsRenderer
   *
   * This delegates to the existing MsdControlsRenderer which handles:
   * - foreignObject creation and positioning in SVG viewBox coordinates
   * - Card element creation (LCARdS cards & HA cards)
   * - HASS context application with retry strategies
   * - Config application via setConfig()
   * - Event isolation
   *
   * @private
   * @param {Object} overlay - Overlay configuration
   * @param {Object} anchors - Anchor positions
   * @param {Array} viewBox - SVG viewBox dimensions
   * @param {Element} svgContainer - SVG container element
   * @returns {Promise<string>} Empty string (MsdControlsRenderer handles DOM directly)
   */
  async _renderCardOverlayViaMsdControls(overlay, anchors, viewBox, svgContainer) {
    if (!this.coordinator?.controlsRenderer) {
      lcardsLog.error('[AdvancedRenderer] No controlsRenderer available for card overlay');
      return this.renderFallbackOverlay(overlay);
    }

    try {
      // Build resolved model for MsdControlsRenderer
      const resolvedModel = {
        anchors,
        viewBox,
        overlays: [overlay]
      };

      // CRITICAL: Await MsdControlsRenderer to ensure attachment points are registered
      // BEFORE Phase 2b (line overlays) renders - lines need these attachment points!
      await this.coordinator.controlsRenderer.renderControlOverlay(overlay, resolvedModel);

      // Return empty string - MsdControlsRenderer manipulates DOM directly via foreignObject
      // The SVG markup is handled separately, we just need to trigger the card creation
      return '';

    } catch (error) {
      lcardsLog.error(`[AdvancedRenderer] Error delegating to MsdControlsRenderer for ${overlay.id}:`, error);
      return this.renderFallbackOverlay(overlay);
    }
  }

  /**
   * Store renderer provenance in config
   *
   * ✅ NEW: Provenance storage method
   *
   * @private
   * @param {string} overlayId - Overlay ID
   * @param {Object} provenance - Renderer provenance data
   */
  _storeRendererProvenance(overlayId, provenance) {
    // Get config from pipeline
    const config = window.lcards.debug.msd?.pipelineInstance?.config;
    if (!config || !config.__provenance) {
      return;
    }

    // Ensure renderers object exists
    if (!config.__provenance.renderers) {
      config.__provenance.renderers = {};
    }

    // Store provenance
    config.__provenance.renderers[overlayId] = provenance;

    lcardsLog.trace(`[AdvancedRenderer] 📊 Stored renderer provenance for ${overlayId}`, provenance);
  }

  /**
   * Store basic renderer provenance for legacy renderers that only return strings
   *
   * ✅ NEW: Basic provenance tracking for legacy renderers
   *
   * @private
   * @param {string} overlayId - Overlay ID
   * @param {string} overlayType - Overlay type
   */
  _storeBasicRendererProvenance(overlayId, overlayType) {
    const config = window.lcards.debug.msd?.pipelineInstance?.config;
    if (!config || !config.__provenance) {
      return;
    }

    // Ensure renderers object exists
    if (!config.__provenance.renderers) {
      config.__provenance.renderers = {};
    }

    // Store basic provenance
    config.__provenance.renderers[overlayId] = {
      renderer: `${overlayType}_renderer`,
      extends_base: false, // Unknown for legacy renderers
      theme_manager_resolved: false, // Unknown for legacy renderers
      rendering_time_ms: 0,
      timestamp: Date.now(),
      legacy_renderer: true,
      note: 'Renderer returned string markup only (no provenance data)'
    };

    lcardsLog.debug(`[AdvancedRenderer] 📊 Stored basic provenance for legacy renderer: ${overlayId}`);
  }

  /**
   * Store failed render provenance
   *
   * ✅ NEW: Track rendering failures for debugging
   *
   * @private
   * @param {string} overlayId - Overlay ID
   * @param {string} overlayType - Overlay type
   * @param {Error} error - Error that occurred
   */
  _storeFailedRendererProvenance(overlayId, overlayType, error) {
    const config = window.lcards.debug.msd?.pipelineInstance?.config;
    if (!config || !config.__provenance) {
      return;
    }

    // Ensure renderers object exists
    if (!config.__provenance.renderers) {
      config.__provenance.renderers = {};
    }

    // Store failure provenance
    config.__provenance.renderers[overlayId] = {
      renderer: `${overlayType}_renderer`,
      extends_base: false,
      theme_manager_resolved: false,
      rendering_failed: true,
      error_message: error.message,
      error_stack: error.stack,
      timestamp: Date.now()
    };

    lcardsLog.debug(`[AdvancedRenderer] 📊 Stored failed render provenance for ${overlayId}:`, error.message);
  }


  injectSvgContent(svgContent) {
    const svg = this.mountEl.querySelector('svg');
    if (!svg) {
      lcardsLog.info('[AdvancedRenderer] No SVG element found for overlay injection');
      return;
    }

    let overlayGroup = svg.querySelector('#msd-overlay-container');
    if (!overlayGroup) {
      overlayGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      overlayGroup.setAttribute('id', 'msd-overlay-container');
      svg.appendChild(overlayGroup);
    } else {
      overlayGroup.innerHTML = '';
    }

    try {
      overlayGroup.innerHTML = svgContent;
      lcardsLog.debug('[AdvancedRenderer] SVG content injected successfully');

      // Build element cache after injection
      this.overlayElementCache.clear();
      const overlayElements = overlayGroup.querySelectorAll('[data-overlay-id]');
      overlayElements.forEach(element => {
        const overlayId = element.getAttribute('data-overlay-id');
        if (overlayId) {
          this.overlayElementCache.set(overlayId, element);
        }
      });

      // Verify injection
      const lines = overlayGroup.querySelectorAll('[data-overlay-type="line"]');

      lcardsLog.debug('[AdvancedRenderer] Injected elements:', {
        lines: lines.length,
        cached: this.overlayElementCache.size
      });

    } catch (error) {
      lcardsLog.info('[AdvancedRenderer] Failed to inject SVG content:', error);
    }
  }



  // === DATA UPDATE METHODS ===

  /**
   * Update overlay with new DataSource data
   * @param {string} overlayId - Overlay ID
   * @param {Object} sourceData - DataSource data
   */
  updateOverlayData(overlayId, sourceData) {
    try {
      lcardsLog.debug(`[AdvancedRenderer] 📊 Updating overlay ${overlayId} with DataSource data`, {
        hasData: !!sourceData,
        value: sourceData?.v,
        isPeriodicUpdate: sourceData?.isPeriodicUpdate,
        hasAggregations: !!sourceData?.aggregations
      });

      // Get the overlay element from cache, with fallback to DOM query
      let overlayElement = this.overlayElementCache?.get(overlayId);

      // CRITICAL FIX: Cache can be stale after font stabilization re-renders
      // If cached element is disconnected, query DOM directly
      if (!overlayElement || !overlayElement.isConnected) {
        const overlayGroup = this.mountEl.querySelector('#msd-overlay-container');
        if (overlayGroup) {
          overlayElement = overlayGroup.querySelector(`[data-overlay-id="${overlayId}"]`);

          // Update cache with fresh element
          if (overlayElement && overlayElement.isConnected) {
            this.overlayElementCache.set(overlayId, overlayElement);
            lcardsLog.debug(`[AdvancedRenderer] 🔄 Refreshed stale cache entry for ${overlayId}`);
          }
        }
      }

      if (!overlayElement) {
        lcardsLog.warn(`[AdvancedRenderer] Overlay element not found for: ${overlayId}`);
        return;
      }

      // Get the overlay configuration
      const overlay = this._findOverlayById(overlayId);
      if (!overlay) {
        lcardsLog.warn(`[AdvancedRenderer] Overlay configuration not found: ${overlayId}`);
        return;
      }

      // Phase 3: Use instance-based update method if available
      const renderer = this.overlayRenderers.get(overlayId);
      if (renderer && renderer.update) {
        // Instance-based overlay - use its update method
        renderer.update(overlayElement, overlay, sourceData);
        return;
      }

      // Fallback for any overlays without instance renderers (shouldn't happen with Phase 3 complete)
      lcardsLog.warn(`[AdvancedRenderer] No instance renderer found for overlay ${overlayId}, using legacy update`);

      // If we reach here, log that no update handler exists
      lcardsLog.debug(`[AdvancedRenderer] No update handler for overlay type: ${overlay.type}`);

    } catch (error) {
      lcardsLog.error(`[AdvancedRenderer] Error updating overlay ${overlayId}:`, error);
    }
  }

  /**
   * Find overlay by ID in current model
   * @private
   * @param {string} overlayId - Overlay ID
   * @returns {Object|null} Overlay configuration
   */
  _findOverlayById(overlayId) {
    // Try to get from last render args first
    if (this.lastRenderArgs?.overlays) {
      const overlay = this.lastRenderArgs.overlays.find(o => o.id === overlayId);
      if (overlay) return overlay;
    }

    // Try to get from current render model
    if (this._currentRenderModel?.resolvedModel?.overlays) {
      return this._currentRenderModel.resolvedModel.overlays.find(o => o.id === overlayId);
    }

    // Try systems manager
    const resolvedModel = this.coordinator?.getResolvedModel?.();
    if (resolvedModel?.overlays) {
      return resolvedModel.overlays.find(o => o.id === overlayId);
    }

    return null;
  }





  /**
   * Get resolved model from various sources
   * @private
   * @returns {Object|null} Resolved model or null if not found
   */
  _getResolvedModel() {
    return this.coordinator?.rulesEngine?.getResolvedModel?.() ||
           this.systemManager?.rulesEngine?.getResolvedModel?.() ||
           this.routerCore?.getResolvedModel?.() ||
           null;
  }

  /**
   * Re-render all overlays dependent on a given set of source overlays
   * @param {Array} allOverlays - Complete list of overlays
   * @param {Set} sourceOverlayIds - Set of source overlay IDs that changed
   * @param {Array} viewBox - Current viewBox for rendering
   */
  _rerenderAllDependentOverlays(allOverlays, sourceOverlayIds, viewBox) {
    const visited = new Set();
    const queue = Array.from(sourceOverlayIds);
    const svg = this.mountEl?.querySelector('svg');
    const overlayGroup = svg?.querySelector('#msd-overlay-container');

    if (!svg || !overlayGroup) {
      lcardsLog.warn('[AdvancedRenderer] ⚠️ Cannot re-render dependent overlays - missing SVG or overlay container');
      return;
    }

    while (queue.length) {
      const overlayId = queue.shift();
      if (visited.has(overlayId)) continue;
      visited.add(overlayId);

      const overlay = allOverlays.find(o => o.id === overlayId);
      if (!overlay) continue;

      // Re-render the overlay (generate new markup)
      try {
        // ✅ CRITICAL: For line overlays, update overlayAttachmentPoints map on instance first
        if (overlay.type === 'line') {
          const renderer = this._getRendererForOverlay(overlay);
          if (renderer) {
            lcardsLog.trace(`[AdvancedRenderer] 🔗 Re-rendering line overlay with updated attachment points: ${overlayId}`);
          }
        }

        const result = this.renderOverlay(overlay, this._staticAnchors, viewBox, svg);

        if (result && result.markup) {
          // Remove old element
          const existingElement = overlayGroup.querySelector(`[data-overlay-id="${overlayId}"]`);
          if (existingElement) {
            existingElement.remove();
          }

          // Parse and insert new markup
          const parser = new DOMParser();
          const wrappedMarkup = `<svg xmlns="http://www.w3.org/2000/svg">${result.markup}</svg>`;
          const svgDoc = parser.parseFromString(wrappedMarkup, 'image/svg+xml');

          const parserError = svgDoc.querySelector('parsererror');
          if (parserError) {
            lcardsLog.error(`[AdvancedRenderer] ❌ SVG parsing error for ${overlayId}:`, parserError.textContent);
            continue;
          }

          const svgElement = svgDoc.documentElement;
          const newElement = svgElement.firstElementChild;
          if (newElement) {
            const importedElement = document.importNode(newElement, true);
            overlayGroup.appendChild(importedElement);
            lcardsLog.trace(`[AdvancedRenderer] ✅ Re-rendered dependent overlay: ${overlayId}`);
          }
        }
      } catch (e) {
        lcardsLog.warn(`[AdvancedRenderer] ⚠️ Re-render failed for overlay ${overlayId}:`, e);
      }

      // Queue up dependencies for re-rendering
      const deps = this._lineDeps.get(overlayId);
      if (deps) {
        deps.forEach(depId => {
          if (!visited.has(depId)) {
            queue.push(depId);
          }
        });
      }
    }
  }

  /**
   * Rebuild virtual anchors from changed overlays (after font stabilization)
   * @param {Set} changedOverlayIds - Set of overlay IDs that have changed
   * @param {Array} allOverlays - Complete list of overlays
   * @param {Object} anchorsMap - Current map of dynamic anchors
   */
  _rebuildVirtualAnchorsFromChangedOverlays(changedOverlayIds, allOverlays, anchorsMap) {
    changedOverlayIds.forEach(id => {
      const overlay = allOverlays.find(o => o.id === id);
      if (!overlay) return;
      const raw = overlay._raw || overlay.raw || {};
      const dest = raw.attach_to || raw.attachTo;
      if (!dest) return;

      // Use unified attachment points (includes all overlay types)
      const attachmentPointData = this.attachmentManager.getAttachmentPoints(dest);
      if (!attachmentPointData || !attachmentPointData.points) return;
      const side = (raw.attach_side || raw.attachSide || '').toLowerCase();
      const basePt = this._resolveOverlayAttachmentPoint(attachmentPointData.points, side);
      if (!basePt) return;
      const gapPt = this._applyAttachGap(basePt, side, raw, attachmentPointData.bbox);
      anchorsMap[dest] = gapPt;
    });
  }

  /**
   * Build virtual anchors from ALL overlay attachment points
   * This allows lines to use ANY overlay as an anchor point
   * @private
   */
  _buildVirtualAnchorsFromAllOverlays(overlays) {
    overlays.forEach(overlay => {
      if (overlay.type === 'line') return; // Lines don't create virtual anchors

      // Read from attachment manager
      const attachmentPoints = this.attachmentManager.getAttachmentPoints(overlay.id);
      if (!attachmentPoints || !attachmentPoints.points) return;

      // Create virtual anchors for each attachment point of this overlay
      // BUT: Don't overwrite gap-adjusted anchors from _buildDynamicOverlayAnchors
      const createdAnchors = [];
      Object.entries(attachmentPoints.points).forEach(([side, point]) => {
        const virtualAnchorId = `${overlay.id}.${side}`;

        // Only set if not already set (preserves gap-adjusted anchors)
        if (!this.attachmentManager.hasAnchor(virtualAnchorId)) {
          this.attachmentManager.setAnchor(virtualAnchorId, point);
          createdAnchors.push({ id: virtualAnchorId, point });
        }
      });

      // Also create a default virtual anchor using the center point (safe to always update)
      this.attachmentManager.setAnchor(overlay.id, attachmentPoints.center);
      createdAnchors.push({ id: overlay.id, point: attachmentPoints.center });

      if (createdAnchors.length > 0) {
        lcardsLog.trace(`[AdvancedRenderer] 🔗 Created virtual anchors for overlay ${overlay.id}:`, createdAnchors);
      }
    });
  }

  /**
   * Get complete anchor set for rendering (static + virtual)
   * @param {Object} staticAnchors - Original anchors from configuration
   * @param {string} overlayType - Type of overlay being rendered
   * @returns {Object} Complete anchor set
   * @private
   */
  _getCompleteAnchors(staticAnchors, overlayType) {
    // Line overlays need access to virtual anchors for overlay-to-overlay connections
    if (overlayType === 'line') {
      return { ...staticAnchors, ...this.attachmentManager.getAllAnchorsAsObject() };
    }
    return staticAnchors;
  }

  /**
   * Populate initial attachment points from Phase 1 overlays
   * This reads the expanded bbox from DOM elements and populates overlayAttachmentPoints
   * BEFORE Phase 2 renders, ensuring lines have correct attachment points on initial render
   * @private
   */
  /**
   * Populate attachment points for Phase 1 overlays before Phase 2 rendering
   * This ensures line overlays have correct attachment points on initial render
   * @private
   */
  _populateInitialAttachmentPoints(overlays, anchors) {
    // Process all overlays that can be attachment targets (everything except lines)
    overlays.filter(o => o.type !== 'line').forEach(overlay => {
      const groupEl = this.overlayElementCache.get(overlay.id);
      if (!groupEl) return;

      // Try to read expanded bbox from DOM attribute (if status indicator present)
      const expandedBboxAttr = groupEl.getAttribute('data-expanded-bbox');
      let bbox;

      if (expandedBboxAttr) {
        try {
          bbox = JSON.parse(expandedBboxAttr);
          lcardsLog.trace(`[AdvancedRenderer] 📍 Read expanded bbox from DOM for ${overlay.id}:`, bbox);
        } catch (e) {
          lcardsLog.warn(`[AdvancedRenderer] Failed to parse expanded bbox for ${overlay.id}`, e);
        }
      }

      // Fallback to measuring from DOM if no expanded bbox
      if (!bbox) {
        // For all overlays, use generic SVG getBBox()
        try {
          const bb = groupEl.getBBox();
          bbox = {
            width: bb.width,
            height: bb.height,
            left: bb.x,
            top: bb.y,
            right: bb.x + bb.width,
            bottom: bb.y + bb.height,
            centerX: bb.x + bb.width / 2,
            centerY: bb.y + bb.height / 2
          };
          lcardsLog.debug(`[AdvancedRenderer] 📍 Measured bbox from DOM for ${overlay.id}:`, bbox);
        } catch (e) {
          lcardsLog.warn(`[AdvancedRenderer] Failed to measure bbox for ${overlay.id}`, e);
          return;
        }
      }

      if (!bbox) return;

      // Create attachment point data
      const attachmentPoints = {
        id: overlay.id,
        center: [bbox.centerX, bbox.centerY],
        bbox: {
          left: bbox.left,
          right: bbox.right,
          top: bbox.top,
          bottom: bbox.bottom,
          width: bbox.width,
          height: bbox.height
        },
        points: {
          center: [bbox.centerX, bbox.centerY],
          top: [bbox.centerX, bbox.top],
          bottom: [bbox.centerX, bbox.bottom],
          left: [bbox.left, bbox.centerY],
          right: [bbox.right, bbox.centerY],
          topLeft: [bbox.left, bbox.top],
          topRight: [bbox.right, bbox.top],
          bottomLeft: [bbox.left, bbox.bottom],
          bottomRight: [bbox.right, bbox.bottom]
        }
      };

      // Store in attachment manager (single source of truth)
      this.attachmentManager.setAttachmentPoints(overlay.id, attachmentPoints);

      lcardsLog.trace(`[AdvancedRenderer] ✅ Populated initial attachment points for ${overlay.id}`, {
        right: bbox.right,
        expandedRight: bbox.right,
        hasExpandedBbox: !!expandedBboxAttr
      });
    });

    // Process other Phase 1 overlay types (cards, etc.)
    overlays.filter(o => o.type !== 'text' && o.type !== 'line').forEach(overlay => {
      const groupEl = this.overlayElementCache.get(overlay.id);
      if (!groupEl) return;

      // Use overlay configuration for accurate positioning
      // Resolve position using anchors if necessary
      const position = OverlayUtils.resolvePosition(overlay.position, anchors);
      if (!position || !overlay.size) return;

      const [x, y] = position;
      const [width, height] = overlay.size;

      const bbox = {
        left: x,
        right: x + width,
        top: y,
        bottom: y + height,
        width: width,
        height: height,
        centerX: x + width / 2,
        centerY: y + height / 2
      };

      // Create attachment point data
      const attachmentPoints = {
        id: overlay.id,
        center: [bbox.centerX, bbox.centerY],
        bbox: {
          left: bbox.left,
          right: bbox.right,
          top: bbox.top,
          bottom: bbox.bottom,
          width: bbox.width,
          height: bbox.height
        },
        points: {
          center: [bbox.centerX, bbox.centerY],
          top: [bbox.centerX, bbox.top],
          bottom: [bbox.centerX, bbox.bottom],
          left: [bbox.left, bbox.centerY],
          right: [bbox.right, bbox.centerY],
          topLeft: [bbox.left, bbox.top],
          topRight: [bbox.right, bbox.top],
          bottomLeft: [bbox.left, bbox.bottom],
          bottomRight: [bbox.right, bbox.bottom]
        }
      };

      // Store in attachment manager (single source of truth)
      this.attachmentManager.setAttachmentPoints(overlay.id, attachmentPoints);

      lcardsLog.trace(`[AdvancedRenderer] ✅ Populated initial attachment points for ${overlay.id} (${overlay.type})`, {
        bbox: bbox,
        center: [bbox.centerX, bbox.centerY]
      });
    });
  }

  /**
   * Render fallback overlay for error cases
   * @private
   */
  renderFallbackOverlay(overlay) {
    const position = overlay.position || [50, 50];
    const size = overlay.size || [100, 40];
    const [x, y] = position;
    const [width, height] = size;
    const color = 'var(--lcars-gray, var(--lcards-gray-medium, #666688))';

    lcardsLog.warn(`[AdvancedRenderer] ⚠️ Using fallback rendering for overlay ${overlay.id}`);

    return `<g data-overlay-id="${overlay.id}" data-overlay-type="${overlay.type}" data-fallback="true">
              <g transform="translate(${x}, ${y})">
                <rect width="${width}" height="${height}"
                      fill="none" stroke="${color}" stroke-width="2" rx="4"/>
                <text x="${width / 2}" y="${height / 2}" text-anchor="middle"
                      fill="${color}" font-size="12" dominant-baseline="middle"
                      font-family="var(--lcars-font-family, Antonio)">
                  ${overlay.type} Error
                </text>
              </g>
            </g>`;
  }

  /**
   * Resolve card instance for action handling
   * @private
   */
  _resolveCardInstance() {
    // Try MsdCardCoordinator first
    if (this.coordinator?.cardInstance) {
      return this.coordinator.cardInstance;
    }

    // Try pipeline instance
    if (window.lcards.debug.msd?.pipelineInstance?.cardInstance) {
      return window.lcards.debug.msd.pipelineInstance.cardInstance;
    }

    // Try global references
    if (window._msdCardInstance) {
      return window._msdCardInstance;
    }

    if (window.lcards.debug.msd?.cardInstance) {
      return window.lcards.debug.msd.cardInstance;
    }

    return null;
  }

  /**
   * ✅ NEW: Phase 5.3 - Get performance summary for current render
   * @private
   * @returns {Object} Performance summary
   */
  _getPerformanceSummary() {
    const overlayTimingsArray = Array.from(this._performance.overlayTimings.entries())
      .map(([id, data]) => ({
        overlay_id: id,
        type: data.type,
        duration_ms: data.duration
      }))
      .sort((a, b) => b.duration_ms - a.duration_ms);

    return {
      total_render_time_ms: this._performance.totalRenderTime,
      overlay_count: this._performance.overlayCount,
      average_per_overlay_ms: this._performance.overlayCount > 0
        ? this._performance.totalRenderTime / this._performance.overlayCount
        : 0,
      stages: {
        preparation_ms: this._performance.stages.preparation,
        overlay_rendering_ms: this._performance.stages.overlayRendering,
        dom_injection_ms: this._performance.stages.domInjection,
        action_attachment_ms: this._performance.stages.actionAttachment
      },
      overlay_timings: overlayTimingsArray,
      slowest_overlays: overlayTimingsArray.slice(0, 5),
      timestamp: this._performance.lastRenderTimestamp
    };
  }

  /**
   * ✅ NEW: Phase 5.3 - Get performance data for a specific overlay
   * @param {string} overlayId - Overlay ID
   * @returns {Object|null} Performance data for the overlay
   */
  getOverlayPerformance(overlayId) {
    const timing = this._performance.overlayTimings.get(overlayId);
    if (!timing) return null;

    return {
      overlay_id: overlayId,
      type: timing.type,
      duration_ms: timing.duration,
      percentage_of_total: (timing.duration / this._performance.totalRenderTime * 100).toFixed(1)
    };
  }

  /**
   * ✅ NEW: Phase 5.3 - Get slowest overlays
   * @param {number} count - Number of slowest overlays to return
   * @returns {Array} Array of slowest overlay performance data
   */
  getSlowestOverlays(count = 5) {
    return Array.from(this._performance.overlayTimings.entries())
      .map(([id, data]) => ({
        overlay_id: id,
        type: data.type,
        duration_ms: data.duration,
        percentage_of_total: (data.duration / this._performance.totalRenderTime * 100).toFixed(1)
      }))
      .sort((a, b) => b.duration_ms - a.duration_ms)
      .slice(0, count);
  }

  /**
   * ✅ NEW: Phase 5.3 - Get performance by overlay type
   * @returns {Object} Performance data grouped by overlay type
   */
  getPerformanceByType() {
    const byType = {};

    this._performance.overlayTimings.forEach((data, id) => {
      const type = data.type;
      if (!byType[type]) {
        byType[type] = {
          count: 0,
          total_ms: 0,
          average_ms: 0,
          overlays: []
        };
      }

      byType[type].count++;
      byType[type].total_ms += data.duration;
      byType[type].overlays.push({
        id,
        duration_ms: data.duration
      });
    });

    // Calculate averages
    Object.keys(byType).forEach(type => {
      byType[type].average_ms = byType[type].total_ms / byType[type].count;
    });

    return byType;
  }

  /**
   * ✅ NEW: Phase 5.3 - Check if any overlays exceed performance thresholds
   * @returns {Object} Performance warnings
   */
  getPerformanceWarnings() {
    const warnings = [];
    const SLOW_OVERLAY_THRESHOLD = 50; // ms
    const SLOW_TOTAL_THRESHOLD = 200; // ms

    // Check total render time
    if (this._performance.totalRenderTime > SLOW_TOTAL_THRESHOLD) {
      warnings.push({
        type: 'slow_total_render',
        severity: 'warning',
        message: `Total render time (${this._performance.totalRenderTime.toFixed(2)}ms) exceeds threshold (${SLOW_TOTAL_THRESHOLD}ms)`,
        value: this._performance.totalRenderTime,
        threshold: SLOW_TOTAL_THRESHOLD
      });
    }

    // Check individual overlays
    this._performance.overlayTimings.forEach((data, id) => {
      if (data.duration > SLOW_OVERLAY_THRESHOLD) {
        warnings.push({
          type: 'slow_overlay',
          severity: 'warning',
          message: `Overlay '${id}' (${data.type}) took ${data.duration.toFixed(2)}ms to render`,
          overlay_id: id,
          overlay_type: data.type,
          value: data.duration,
          threshold: SLOW_OVERLAY_THRESHOLD
        });
      }
    });

    return {
      has_warnings: warnings.length > 0,
      count: warnings.length,
      warnings: warnings.sort((a, b) => (b.value || 0) - (a.value || 0))
    };
  }

}