/**
 * [AdvancedRenderer] Advanced renderer - clean implementation for MSD v1
 * 🎨 Main orchestrator that delegates to specialized renderers
 */


import { RendererUtils } from './RendererUtils.js';
import { OverlayUtils } from './OverlayUtils.js';
import { AttachmentPointManager } from './AttachmentPointManager.js';
import { ColorUtils } from '../../core/themes/ColorUtils.js';

import { MsdControlsRenderer } from '../controls/MsdControlsRenderer.js';
import { lcardsLog } from '../../utils/lcards-logging.js';

// Instance-based overlay architecture
import { OverlayBase } from '../overlays/OverlayBase.js';
import { LineOverlay } from '../overlays/LineOverlay.js';
import { ShapeOverlay } from '../overlays/ShapeOverlay.js';

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

    // Cache for instance-based overlay renderers
    this.overlayRenderers = new Map();

  }

  /**
   * Render the complete MSD with all overlays.
   * Includes detailed per-overlay performance and provenance tracking.
   *
   * @param {Object} resolvedModel - Complete model with overlays and anchors
   * @returns {Promise<Object>} {svgMarkup, overlayCount, errors, provenance}
   */
  async render(resolvedModel) {
    if (!resolvedModel) {
      lcardsLog.warn('[AdvancedRenderer] ⚠️ No resolved model provided');
      return { svgMarkup: '', overlayCount: 0 };
    }

    const { overlays = [], anchors = {}, viewBox } = resolvedModel;

    // Store static anchors for use throughout render
    this._staticAnchors = anchors;

    lcardsLog.debug(`[AdvancedRenderer] 🎨 Rendering ${overlays.length} overlays, ${Object.keys(anchors).length} anchors`);

    this.overlayElements.clear();

    // Phase rendering requires live SVG early
    const svg = this.mountEl?.querySelector('svg');
    if (!svg) {
      // Trace level - this is expected during initial mount timing
      lcardsLog.trace('[AdvancedRenderer] SVG not yet mounted, skipping render');
      return { svgMarkup: '', overlayCount: 0 };
    }

    // Prepare / clear overlay group
    const overlayGroup = this._ensureOverlayGroup(svg);
    overlayGroup.innerHTML = '';
    this.overlayElementCache.clear();

    // Phase 3: Line overlay attachment points are set per-instance during render
    // (removed global lineRenderer.setOverlayAttachmentPoints call)

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

    // Pass 1: render overlays that others may depend on (currently empty)
    const earlyTypes = new Set([]);
    let svgMarkupAccum = '';
    let processedCount = 0;

    overlays.filter(o => earlyTypes.has(o.type)).forEach(ov => {
      try {
        const result = this.renderOverlay(ov, anchors, viewBox);

        lcardsLog.trace(`[AdvancedRenderer] 📊 Phase 1 overlay result:`, {
          resultType: typeof result,
          isObject: result && typeof result === 'object',
          hasMarkup: result?.markup,
          hasActionInfo: result?.actionInfo,
          overlayId: result?.overlayId
        });

        // Handle new return structure
        if (typeof result === 'string') {
          // Backward compatibility - old renderers return strings
          svgMarkupAccum += result;
        } else if (result && result.markup) {
          // New structure - extract markup string from result object
          svgMarkupAccum += result.markup ?? '';

          // Collect provenance if available
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

        processedCount++;
      } catch (e) {
        lcardsLog.warn(`[AdvancedRenderer] ⚠️ Phase1 render failed for overlay ${ov.id}:`, e);

        // Track failed overlay
        provenance.overlays[ov.id] = {
          renderer: 'AdvancedRenderer',
          overlay_id: ov.id,
          error: e.message,
          timestamp: Date.now()
        };
      }
    });

    // Inject pass-1 DOM
    overlayGroup.innerHTML = svgMarkupAccum;

    this._cacheElementsFrom(overlayGroup);

    // Pass 2a: render non-line overlays (cards, etc.) that lines may attach to.
    // Each control overlay is rendered via an async foreignObject path; we must await
    // each one so positionControlElement registers attachment points before we build
    // virtual anchors in the next step.
    //
    // Stable two-bucket partition: controls whose `position` references another
    // control overlay's id are processed second, so the target's attachment points
    // (registered synchronously inside positionControlElement) are already available
    // regardless of declaration order in the config. This only handles one level of
    // dependency — a control depending on another control that ITSELF depends on a
    // third falls back to MsdControlsRenderer's existing [0,0]-with-warning path.
    const phase2aOverlays = overlays.filter(o => !earlyTypes.has(o.type) && o.type !== 'line');
    const phase2aControlIds = new Set(phase2aOverlays.filter(o => o.type === 'control').map(o => o.id));
    const independentPhase2a = [];
    const dependentPhase2a = [];
    for (const ov of phase2aOverlays) {
      if (ov.type === 'control' && typeof ov.position === 'string' && phase2aControlIds.has(ov.position)) {
        dependentPhase2a.push(ov);
      } else {
        independentPhase2a.push(ov);
      }
    }

    for (const ov of [...independentPhase2a, ...dependentPhase2a]) {
      try {
        const result = await this.renderOverlay(ov, this._staticAnchors, viewBox);

        lcardsLog.trace(`[AdvancedRenderer] 📊 Phase 2a overlay ${ov.id} result:`, {
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

          // Shape attachment-point registration ("connect to each other"): must
          // happen here, before _buildVirtualAnchorsFromAllOverlays runs below and
          // before Phase 2b renders any line that might attach_to this shape.
          // rect/circle get the same bbox-corner registration a control gets
          // (reusing OverlayUtils.computeAttachmentPoints — the identical math
          // MsdControlsRenderer itself delegates to); polyline vertices are
          // registered individually since the fixed 9-key bbox struct can't
          // represent an arbitrary vertex count.
          if (ov.type === 'shape' && result?.metadata?.attachment) {
            const attachment = result.metadata.attachment;
            if (attachment.type === 'bbox') {
              const attachmentPoints = OverlayUtils.computeAttachmentPoints(ov, this._staticAnchors);
              if (attachmentPoints) {
                // Kebab-case aliases alongside the camelCase keys: LineOverlay's
                // _resolveAttachTo() lowercases attach_side before building its
                // virtual-anchor lookup key — 'top-left'.toLowerCase() stays
                // 'top-left' (hyphen untouched), but 'topLeft'.toLowerCase()
                // becomes 'topleft', matching neither. Controls register the
                // same aliases for exactly this reason (see
                // MsdControlsRenderer._computeAttachmentPointsFromBox) — without
                // this, a line's attach_side: top-left against a shape silently
                // fails to resolve and falls back to the bare (wrong) position.
                attachmentPoints.points['top-left'] = attachmentPoints.points.topLeft;
                attachmentPoints.points['top-right'] = attachmentPoints.points.topRight;
                attachmentPoints.points['bottom-left'] = attachmentPoints.points.bottomLeft;
                attachmentPoints.points['bottom-right'] = attachmentPoints.points.bottomRight;
                this.attachmentManager.setAttachmentPoints(ov.id, attachmentPoints);
              }
            } else if (attachment.type === 'vertices' && Array.isArray(attachment.points)) {
              attachment.points.forEach((pt, i) => {
                this.attachmentManager.setAnchor(`${ov.id}.vertex${i}`, pt);
              });
            }
          }
        }

        processedCount++;
      } catch (e) {
        lcardsLog.warn(`[AdvancedRenderer] ⚠️ Phase2a render failed for overlay ${ov.id}:`, e);
      }
    }

    // Wait for custom element connectedCallback/firstUpdated to settle before
    // reading attachment points. positionControlElement fires synchronously once
    // createControlElement resolves, but the element lifecycle needs one more frame.
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

    // Build virtual anchors NOW — all control overlays are positioned and their
    // attachment points are registered in attachmentManager.
    this._cacheElementsFrom(overlayGroup);
    this._buildVirtualAnchorsFromAllOverlays(overlays);
    this.attachmentManager.setAnchorsFromObject(anchors);
    this._buildDynamicOverlayAnchors(overlays);

    lcardsLog.debug('[AdvancedRenderer] 🎯 Attachment points available:', {
      totalAnchors: Object.keys(this._staticAnchors).length,
      attachmentPointCount: this.attachmentManager?._attachmentPoints?.size || 0
    });

    // Repeatedly route every line (discarding markup) so RouterCore's
    // trunk/crossing registries reflect every line's geometry BEFORE Pass
    // 2b's real, declaration-order pass runs — see _discoverLineRoutes for
    // why this removes the order-dependency a single pass would otherwise
    // have (a line drawn later in YAML that would make an excellent trunk
    // for an earlier line was previously invisible to it).
    this._discoverLineRoutes(overlays);

    // Pass 2b: render line overlays (now ALL targets exist with attachment points)
    overlays.filter(o => o.type === 'line').forEach(ov => {
      try {
        const result = this.renderOverlay(ov, this._staticAnchors, viewBox);

        lcardsLog.trace(`[AdvancedRenderer] 📊 Phase 2b overlay ${ov.id} result:`, {
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

          // Collect provenance if available
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
            // NOTE: no synthetic computePath here (a "HUD listing" call used
            // to route bare-anchor -> virtual-anchor endpoints for the SAME
            // line id). The renderOverlay call above already computed and
            // cached this line's REAL route, so the HUD sees it — while the
            // synthetic one, with its differently-resolved endpoints, was
            // REGISTERING wrong geometry into the trunk/crossing registries
            // under the real line's id, in declaration order, AFTER the
            // discovery loop had converged — reintroducing exactly the
            // declaration-order dependence the loop exists to remove.
          }
        }

        processedCount++;
      } catch (e) {
        lcardsLog.warn(`[AdvancedRenderer] ⚠️ Phase2b render failed for overlay ${ov.id}:`, e);

        // Track failed overlay
        provenance.overlays[ov.id] = {
          renderer: 'AdvancedRenderer',
          overlay_id: ov.id,
          error: e.message,
          timestamp: Date.now()
        };
      }
    });

    lcardsLog.debug('[AdvancedRenderer] Injected elements (after phased render):', {
      total: this.overlayElementCache.size,
      lines: overlayGroup.querySelectorAll('[data-overlay-type="line"]').length,
      controls: overlayGroup.querySelectorAll('[data-overlay-type="control"]').length
    });

    // Final z-order pass: controls are inserted into a separate sibling
    // <g id="msd-controls-container"> (see getSvgControlsContainer) while lines land
    // directly in overlayGroup, so today's paint order is purely structural
    // (controls-over-lines) regardless of any z_index value. Sort every cached
    // overlay element by (z_index ?? implicit default by type, declared-order
    // tiebreak) and re-append in that order — appendChild on an already-attached
    // node moves it, so this both merges controls into overlayGroup and fixes
    // final paint order without re-rendering anything. Defaults reproduce today's
    // actual behavior when z_index is unset, so this is non-breaking by default.
    const declOrder = new Map(overlays.map((o, i) => [o.id, i]));
    const DEFAULT_Z_BY_TYPE = { control: 200, line: 100, shape: 50 };
    overlays
      .map(o => ({ o, el: this.overlayElementCache.get(o.id) }))
      .filter(x => x.el)
      .sort((a, b) => {
        const za = a.o.z_index ?? DEFAULT_Z_BY_TYPE[a.o.type] ?? 150;
        const zb = b.o.z_index ?? DEFAULT_Z_BY_TYPE[b.o.type] ?? 150;
        return za - zb || declOrder.get(a.o.id) - declOrder.get(b.o.id);
      })
      .forEach(({ el }) => overlayGroup.appendChild(el));

    // NEW: schedule deferred line refresh to fix first-load orientation/position
    this._scheduleDeferredLineRefresh(overlays, this._staticAnchors, viewBox);

    this.lastRenderArgs = { resolvedModel, overlays, svg };

    lcardsLog.debug('[AdvancedRenderer] Render complete', {
      overlays: overlays.length,
      processed: processedCount,
      errors: overlays.length - processedCount
    });

    // Store provenance in config
    const config = window.lcards.debug.msd?.pipelineInstance?.config;
    if (config && config.__provenance) {
      config.__provenance.advanced_renderer = provenance;
    }

    return {
      svgMarkup: svgMarkupAccum,
      overlayCount: processedCount,
      errors: overlays.length - processedCount,
      provenance
    };
  }

  /**
   * Destroy this renderer and all cached overlay instances.
   * Called by MsdCardCoordinator.destroy() during card teardown.
   */
  destroy() {
    for (const [id, renderer] of this.overlayRenderers) {
      try {
        if (typeof renderer.destroy === 'function') {
          renderer.destroy();
        }
      } catch (e) {
        lcardsLog.warn(`[AdvancedRenderer] Error destroying overlay renderer ${id}:`, e);
      }
    }
    this.overlayRenderers.clear();
    this.overlayElementCache.clear();
    this.overlayElements.clear();
    this.attachmentManager = null;
    this.lastRenderArgs = null;
    lcardsLog.debug('[AdvancedRenderer] Destroyed — all overlay renderers cleaned up');
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
          // Virtual anchor registered in attachmentManager under sourceVirtualAnchorId.
          // LineOverlay._resolveAnchor picks it up via the config's anchor_side value —
          // no write-back to the (potentially frozen) overlay object needed.
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

      // Virtual anchor stored under virtualAnchorId in attachmentManager.
      // LineOverlay._resolveAttachTo builds the same key from the config's attach_side —
      // no write-back to the (potentially frozen) overlay object needed.

      // Register in routerCore so HUD sees it as an anchor. The anchor
      // moved (or was just created), so drop this line's stale cached
      // routes — but do NOT compute a synthetic route here: the endpoints
      // this site can resolve (bare anchor -> gap point) are not the
      // line's real anchor_side-resolved endpoints, and computePath
      // REGISTERS whatever it routes into the trunk/crossing registries
      // under the real line's id, in declaration order — polluting the
      // registries the discovery loop later converges from. The real
      // route (computed by LineOverlay via the discovery loop and Pass
      // 2b) is what the HUD should — and now does — see.
      if (this.routerCore && this.routerCore.anchors) {
        this.routerCore.anchors[virtualAnchorId] = gapPt;
        this.routerCore.invalidate(line.id);
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
        // Anchor moved: invalidate this line's cached routes so its next
        // real render recomputes. No synthetic computePath — same reasoning
        // as _buildDynamicOverlayAnchors (bare-anchor endpoints would
        // register wrong geometry under the real line's id).
        if (this.routerCore && this.routerCore.anchors) {
          this.routerCore.anchors[virtualAnchorId] = gapPt;
          this.routerCore.invalidate(line.id);
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
   * Repeatedly routes every line overlay (via LineOverlay.resolveRoute(),
   * which computes a route but never touches the DOM) until RouterCore's
   * trunk/crossing registry stops changing, or a safety cap is hit. This
   * removes the order-dependency a single declaration-order pass would
   * otherwise have: after this loop, every line's independent geometry has
   * been registered regardless of YAML order, so Pass 2b's own real,
   * sequential pass (unchanged, still declaration-order) sees the union of
   * every other line's geometry rather than just earlier-declared lines'.
   *
   * Cost is bounded by RouterCore's own registry-version-keyed route
   * cache, not by pass count: once a full sweep produces zero registry
   * mutations, every subsequent lookup in this render is a cache hit,
   * including this loop's own remaining iterations and Pass 2b's real
   * pass — so a render where nothing's geometry actually changed pays
   * nothing extra, and even a multi-way mutual dependency only pays for
   * the lines still adjusting on each extra pass, not a full re-sweep at
   * full price every time.
   *
   * Known, explicitly-scoped limitation: within Pass 2b's own single
   * sequential pass afterward, a later line still sees earlier lines'
   * POST-Pass-2b geometry while an earlier line only ever saw later lines'
   * geometry as of THIS loop's convergence — a genuine three-way mutual
   * dependency where the best arrangement only emerges after two other
   * lines have already joined each other isn't guaranteed optimal.
   * Fixing that would need iterating Pass 2b itself to convergence too,
   * which is out of scope here.
   * @param {Array<Object>} overlays
   * @private
   */
  _discoverLineRoutes(overlays) {
    if (!this.routerCore) return;
    // Sorted by id — deliberately NOT declaration order. A join decision
    // can be a genuine near-tie whose cost flips pass-to-pass (joining a
    // trunk widens it, which changes the branch-point clamp for the NEXT
    // evaluation, which can make joining look worse, which un-joins and
    // narrows it back, which makes joining look better again — a real
    // 2-cycle, confirmed empirically, not hypothetical). Declaration order
    // determines WHICH pass within that cycle a line is FIRST evaluated
    // on, so two different declaration orders can hit the pass cap at
    // opposite phases of the same oscillation and land on different
    // answers — exactly the order-dependency this loop exists to remove.
    // A fixed, order-independent iteration sequence inside the loop itself
    // guarantees both orders hit the cap at the same phase. Pass 2b (the
    // real render below) is unaffected — it still iterates `overlays` in
    // declaration order for z-ordering/DOM-insertion purposes.
    const lineOverlays = overlays.filter(o => o.type === 'line').slice().sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    if (!lineOverlays.length) return;
    // The COMPLETE anchor set (static + attachmentManager virtual anchors),
    // exactly what renderOverlay hands LineOverlay.render for the real
    // pass. Passing bare _staticAnchors here (as this loop originally did)
    // made resolveRoute's anchor resolution fail for every line anchored
    // to an overlay/control — 'control_x.right' only exists in the merged
    // set — so the whole loop silently no-opped and the FIRST real routing
    // happened in Pass 2b's declaration-order pass, reintroducing exactly
    // the YAML-order dependence this loop exists to remove (confirmed
    // live: two equal-cost route shapes existed for a line, and which one
    // won followed declaration order, not the sorted order below).
    const completeAnchors = this._getCompleteAnchors(this._staticAnchors, 'line');
    const maxPasses = this.routerCore._trunkDiscoveryMaxPasses ?? 4;
    let lastVersion = -1;
    let pass = 0;
    while (this.routerCore._registryVersion !== lastVersion && pass < maxPasses) {
      lastVersion = this.routerCore._registryVersion;
      for (const ov of lineOverlays) {
        try {
          // @ts-ignore - TS2339: resolveRoute is LineOverlay-specific, not on OverlayBase; compatible at runtime since lineOverlays is already filtered to type==='line'
          const resolved = (/** @type {any} */ (this._getRendererForOverlay(ov)))?.resolveRoute?.(ov, completeAnchors);
          if (!resolved) {
            // A line the discovery loop can't route is a line whose
            // registrations Pass 2b will make in declaration order instead
            // — worth surfacing, since that quietly weakens the loop's
            // order-independence guarantee for this card.
            lcardsLog.debug(`[AdvancedRenderer] Discovery pass could not resolve route for '${ov.id}' (anchors unresolved?)`);
          }
        } catch (e) {
          lcardsLog.debug('[AdvancedRenderer] Discovery-pass route failed for', ov.id, e);
        }
      }
      pass++;
    }
    lcardsLog.debug(`[AdvancedRenderer] Route discovery converged after ${pass} pass(es) (registryVersion=${this.routerCore._registryVersion})`);
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
      this.overlayRenderers.set((/** @type {any} */ (overlay)).id, overlay);
      return overlay;
    }

    // Phase 3: Create instance-based renderers for all overlay types

    // Line overlays use LineOverlay class (SVG-native, MSD-specific)
    if (overlay.type === 'line') {
      const lineOverlay = new LineOverlay(overlay, this.coordinator, this.routerCore);
      // @ts-ignore - TS2322: LineOverlay extends OverlayBase; compatible at runtime
      this.overlayRenderers.set((/** @type {any} */ (overlay)).id, lineOverlay);
      return /** @type {any} */ (lineOverlay);
    }

    // Shape overlays (freeform polyline/rect/circle) use ShapeOverlay class —
    // raw drawn SVG like line, not an embedded HA card like control, so it must
    // follow line's instance-based pattern (not delegate to MsdControlsRenderer)
    // to get animation targeting (getDefaultAnimationTarget) and attachment-point
    // registration wired up.
    if (overlay.type === 'shape') {
      const shapeOverlay = new ShapeOverlay(overlay, this.coordinator, this.routerCore);
      // @ts-ignore - TS2322: ShapeOverlay extends OverlayBase; compatible at runtime
      this.overlayRenderers.set((/** @type {any} */ (overlay)).id, shapeOverlay);
      return /** @type {any} */ (shapeOverlay);
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
   * Render individual overlay using appropriate renderer.
   * Supports both instance-based (OverlayBase) and static renderers.
   * Collects and stores renderer provenance for debugging.
   *
   * @private
   * @returns {any}
   */
  renderOverlay(overlay, anchors, viewBox, svgContainer) {
    try {
      lcardsLog.trace(`[AdvancedRenderer] 🎨 Rendering overlay: ${overlay.type} (${overlay.id})`);

      let result;

      // Try to get instance-based renderer first
      const renderer = this._getRendererForOverlay(overlay);

      if (renderer instanceof OverlayBase) {
        // Instance-based overlay - currently only LineOverlay uses this pattern
        lcardsLog.trace(`[AdvancedRenderer] 🎯 Using instance-based renderer for ${overlay.id}`);

        if (overlay.type === 'line' || overlay.type === 'shape') {
          // Lines need complete anchor set (static + virtual) for overlay-to-overlay connections;
          // shapes only ever resolve against static anchors (_getCompleteAnchors is a no-op for
          // any type other than 'line'), but still need cardInstance for entity-bound style.color.
          const completeAnchors = this._getCompleteAnchors(anchors, overlay.type);
          // cardInstance needed for state-color resolution when style.color is bound to overlay.entity
          result = renderer.render(overlay, completeAnchors, viewBox, svgContainer, this._resolveCardInstance());
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

      // Store renderer provenance after successful render
      if (result && typeof result === 'object' && (/** @type {any} */ (result)).provenance) {
        this._storeRendererProvenance(overlay.id, (/** @type {any} */ (result)).provenance);
      } else if (result && typeof result === 'string' && result !== '') {
        // For renderers that just return string markup (legacy pattern)
        // We still want to track that the overlay was rendered, but without detailed provenance
        this._storeBasicRendererProvenance(overlay.id, overlay.type);
      }

      return result;

    } catch (error) {
      lcardsLog.error(`[AdvancedRenderer] ❌ Error rendering overlay ${overlay.id}:`, error);

      // Track failed render
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
    if ((/** @type {any} */ (this))._currentRenderModel?.resolvedModel?.overlays) {
      return (/** @type {any} */ (this))._currentRenderModel.resolvedModel.overlays.find(o => o.id === overlayId);
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
           (/** @type {any} */ (this)).systemManager?.rulesEngine?.getResolvedModel?.() ||
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
        // For line overlays, update overlayAttachmentPoints map on instance first
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
                      font-family="var(--lcars-font, var(--lcars-fallback-font, Antonio))">
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
   * Re-resolve and DOM-patch every entity-bound or templated line's color on a
   * HASS update.
   *
   * Unlike controls (which receive HASS directly) and rule-driven overlays (which
   * are subscribed via the Rules Engine's own watch mechanism), a line's `entity`
   * state-color binding — or a plain Jinja2/JS template literal in `style.color`
   * (Phase 8, no `entity` field needed since `states(...)` is called directly
   * inside the template string) — has no subscription of its own; render() only
   * resolves color once, at initial paint. Called from
   * MsdCardCoordinator._propagateHassToSystems() on every HASS update; cheap even
   * for many lines since it's just a handful of object-key lookups per line, no
   * re-render of routing/geometry, no DOM destruction (unlike a full reRender()
   * — deliberately avoided here so running animations on unrelated overlays are
   * never disturbed by a color-only update).
   *
   * @param {Object} hass - Current Home Assistant state object
   */
  updateLineEntityColors(hass) {
    const overlays = this.lastRenderArgs?.overlays;
    if (!hass || !overlays) return;

    const cardInstance = this._resolveCardInstance();
    if (!cardInstance) return;

    for (const overlay of overlays) {
      if (overlay.type !== 'line' && overlay.type !== 'shape') continue;

      const styleValue = overlay.finalStyle?.color ?? overlay.style?.color;
      const isTemplateLiteral = typeof styleValue === 'string' &&
        (styleValue.includes('{{') || styleValue.includes('{%') || styleValue.includes('[[['));
      if (!overlay.entity && !isTemplateLiteral) continue;

      const el = this.overlayElementCache.get(overlay.id);
      if (!el) continue;

      // ShapeOverlay deliberately doesn't extend LineOverlay (see ShapeOverlay's
      // class docblock), so it has its own _resolveShapeColor method with the
      // same signature/behavior as _resolveLineColor rather than inheriting it.
      const overlayRenderer = this._getRendererForOverlay(overlay);
      const resolveColorMethod = overlay.type === 'shape' ? '_resolveShapeColor' : '_resolveLineColor';
      if (!overlayRenderer || typeof overlayRenderer[resolveColorMethod] !== 'function') continue;

      const rawColor = overlayRenderer[resolveColorMethod](
        styleValue,
        overlay,
        cardInstance,
        'var(--lcars-orange, var(--lcards-orange-medium, #ff7700))'
      );
      // Full pipeline required: setAttribute() cannot handle var() —
      // _resolveLineColor()/_resolveShapeColor() only performs token/state
      // resolution for literal string colors, so materialize any remaining
      // var(...) here before writing it to the DOM. `el` scopes the lookup so
      // inherited/section-scoped CSS vars resolve correctly.
      const newColor = ColorUtils.resolveCssVariable(rawColor, '#ff7700', el);

      // Class-name selector (not tag-based) so this matches shape's <rect>/
      // <ellipse> main elements (kind: rect/circle) as well as <path> (line, and
      // shape kind: polyline) — all share the same .{line,shape}-path /
      // .{line,shape}-selection-indicator class convention regardless of tag.
      const paths = el.querySelectorAll('.line-path, .line-selection-indicator, .shape-path, .shape-selection-indicator');
      paths.forEach(p => p.setAttribute('stroke', newColor));

      // Fill: same live-refresh treatment as stroke above, previously missing
      // entirely — style.fill resolved correctly once at initial render (or on
      // a full re-render), but every subsequent HASS update only ever touched
      // stroke, so an entity-bound fill would silently stop tracking the
      // entity's state after the first paint (e.g. a rule-free, plain
      // `entity:` + `style.fill: {default, above:80, below:20}` binding never
      // updates once the entity's value crosses a threshold). Deliberately
      // NOT applied to .line-selection-indicator/.shape-selection-indicator —
      // those are the editor-only selection halo, hardcoded to fill="none" by
      // the renderer, never meant to pick up the resolved color.
      const fillStyleValue = overlay.finalStyle?.fill ?? overlay.style?.fill;
      if (fillStyleValue != null) {
        const rawFill = overlayRenderer[resolveColorMethod](
          fillStyleValue,
          overlay,
          cardInstance,
          'none',
          undefined,
          undefined,
          'defaultFillColor'
        );
        const newFill = ColorUtils.resolveCssVariable(rawFill, 'none', el);
        el.querySelectorAll('.line-path, .shape-path').forEach(p => p.setAttribute('fill', newFill));
      }

      // "match_line" markers (Phase 9) — the cached <marker> defs only pick up a
      // color change on the next full build (_buildDefinitions()'s cache-key
      // includes the color precisely for this reason), which we deliberately
      // don't force here (see class docblock). Patch the marker's shape fill/
      // stroke attribute directly instead — same surgical, no-rebuild approach
      // as the line stroke above.
      const markerStyle = overlay.finalStyle ?? overlay.style ?? {};
      ['marker_start', 'marker_mid', 'marker_end'].forEach((key, index) => {
        const marker = markerStyle[key];
        if (!marker || (marker.fill !== 'match_line' && marker.stroke !== 'match_line')) return;

        const position = ['start', 'mid', 'end'][index];
        const shape = el.querySelector(`marker#marker-${position}-${overlay.id} > *`);
        if (!shape) return;

        // The 'line' marker type (an orthogonal tick, an SVG <line> with no fill)
        // renders its color via `stroke`, using the *fill* config field for it
        // (see LineOverlay._createMarkerDefinition()'s 'line' case) — match that
        // quirk here so "Match Line Color" on a fill field still patches the
        // attribute that actually carries color for this one marker type.
        if (marker.fill === 'match_line') {
          shape.setAttribute(marker.type === 'line' ? 'stroke' : 'fill', newColor);
        }
        if (marker.stroke === 'match_line' && marker.type !== 'line') {
          shape.setAttribute('stroke', newColor);
        }
      });
    }
  }

}
