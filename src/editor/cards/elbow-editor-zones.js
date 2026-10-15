/**
 * Text zones the elbow editor offers in its zone dropdown, derived from the
 * elbow config alone (no live card needed). Must match the zones the card
 * builds in lcards-elbow.js (_calculateFrameZones, _calculateSegmentedElbowZones,
 * _calculateSimpleElbowZones).
 *
 * @module editor/cards/elbow-editor-zones
 */

const FRAME_SIDES = [['top', 'Top'], ['bottom', 'Bottom'], ['left', 'Left'], ['right', 'Right']];

/**
 * @param {Object} elbowCfg - the card config's `elbow` block
 * @returns {Object.<string, string>} zone name -> label. `body` comes first: it is
 *   where the card puts a text field with no `zone` (lcards-elbow.js _injectZoneText),
 *   and the editor shows the first entry for an unset field. `full` (the whole card)
 *   exists on every elbow.
 */
export function elbowEditorZones(elbowCfg = {}) {
    return {
        body: elbowCfg.type === 'frame' ? 'Body (interior)' : 'Body (open area)',
        full: 'Full (entire card)',
        ...shapeZones(elbowCfg),
    };
}

/** The bar and side zones for the elbow's shape. */
function shapeZones(elbowCfg) {
    const type  = elbowCfg.type  || 'header-left';
    const style = elbowCfg.style || 'simple';

    // Frame: one zone per drawn side. Sides live at elbow.frame.<side> and are on
    // unless `enabled: false` (lcards-elbow.js _validateElbowConfig); a side drawn
    // with zero thickness gets no zone on the card either.
    if (type === 'frame') {
        const frame = elbowCfg.frame || {};
        /** @type {Object.<string, string>} */
        const zones = {};
        for (const [side, label] of FRAME_SIDES) {
            const cfg = frame[side] || {};
            const thickness = cfg.bar_width ?? cfg.bar_height ?? cfg.thickness;
            if (cfg.enabled === false || thickness === 0) continue;
            zones[side] = label;
        }
        return zones;
    }

    // Segmented (Picard-style double elbow)
    if (style === 'segmented') {
        return {
            outer_vertical_bar:   'Outer Vertical Bar',
            inner_vertical_bar:   'Inner Vertical Bar',
            outer_horizontal_bar: 'Outer Horizontal Bar',
            inner_horizontal_bar: 'Inner Horizontal Bar'
        };
    }

    // Simple elbows, by the type's layout side (elbow component `layout.side`):
    // open types have no vertical bar; contained types have one at each end.
    if (type.endsWith('-open')) {
        return { horizontal_bar: 'Horizontal Bar' };
    }
    if (type.endsWith('-contained')) {
        return {
            left_bar:       'Left Bar',
            right_bar:      'Right Bar',
            horizontal_bar: 'Horizontal Bar'
        };
    }
    // L-shaped (left/right corners, diagonal caps). The card also names the vertical
    // bar left_bar / right_bar; that alias isn't offered twice.
    return {
        vertical_bar:   'Vertical Bar',
        horizontal_bar: 'Horizontal Bar'
    };
}
