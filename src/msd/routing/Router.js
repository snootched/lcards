import { perfCount } from '../../utils/performance.js';
import { stableStringify } from '../../utils/stableStringify.js';

/**
 * Router adapter:
 * - Generates simple line paths between overlay anchors
 * - Caches per overlay id + endpoints + mode signature
 */
export class Router {
  constructor(routingConfig, anchors, viewBox) {
    this.routingConfig = routingConfig || {};
    this.anchors = anchors || {};
    this.viewBox = viewBox || [0,0,400,200];
    this.cache = new Map(); // overlayId -> { key, d, meta }
  }

  updateEnv({ routingConfig, anchors, viewBox }) {
    if (routingConfig) this.routingConfig = routingConfig;
    if (anchors) this.anchors = anchors;
    if (viewBox) this.viewBox = viewBox;
    // Intentionally keep cache (anchors rarely shift); caller may clear if needed.
  }

  computePath(overlay, a1, a2) {
    const raw = overlay._raw || overlay.raw || {};
    const modeFull = raw.route_mode_full || raw.route_mode || raw.route || 'auto';
    const avoid = raw.avoid || [];
    const channels = raw.route_channels || [];
    const channelMode = raw.route_channel_mode || raw.channel_mode;
    const attachSide = raw.attach_side;
    const keyObj = {
      a1, a2,
      modeFull,
      avoid: avoid.slice().sort(),
      channels: channels.slice().sort(),
      channelMode,
      attachSide,
      width: overlay.finalStyle?.width,
      corner: overlay.finalStyle?.corner_radius
    };
    const key = stableStringify(keyObj);
    const cached = this.cache.get(overlay.id);
    if (cached && cached.key === key) {
      perfCount('connectors.route.cache.hit', 1);
      return cached;
    }
    perfCount('connectors.route.cache.miss', 1);

    // Simple line routing (no legacy advanced routing available)
    const d = `M${a1[0]},${a1[1]} L${a2[0]},${a2[1]}`;
    const meta = { strategy: 'simple-line' };

    const record = { key, d, meta };
    this.cache.set(overlay.id, record);
    return record;
  }

  invalidate(id) {
    if (id === '*') this.cache.clear();
    else this.cache.delete(id);
  }

  stats() {
    return {
      cacheSize: this.cache.size,
      routingMode: this.routingConfig?.default_mode
    };
  }
}
