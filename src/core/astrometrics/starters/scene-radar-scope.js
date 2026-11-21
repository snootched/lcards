/**
 * Radar scope: a round sensor scope with range rings, cross hairs and a turning sweep,
 * and contacts placed by distance and bearing. In 3D, so it can be tilted too.
 */

/** The scope's radius in scene units */
const R = 100;
/** The sweep's lines: how far each trails the leading edge (degrees) and how bright it is */
const FAN = Array.from({ length: 10 }, (_, i) => [i * 3, Math.round(100 * 0.9 * (1 - i / 10) ** 1.6) / 100]);

export default /** @type {import('./index.js').Starter} */ ({
  id: 'radar_scope',
  kind: 'scene',
  title: 'Radar scope',
  summary: 'A sensor scope with range rings, a turning sweep and contacts',
  description: 'A round sensor scope: range rings with their distances, cross hairs, a sweep turning round with a fading afterglow, and contacts placed by distance and bearing. Give a contact polar: { entity } to place it from an entity\'s distance and bearing attributes, and tilt the camera to see the scope in perspective.',
  icon: 'mdi:radar',
  params: [
    { key: 'speed', label: 'Sweep speed (degrees a second)', type: 'number', default: 60 }
  ],
  build: ({ speed }) => {
    const turn = Number.isFinite(Number(speed)) ? Number(speed) : 60;
    const contact = (/** @type {string} */ id, /** @type {string} */ label, /** @type {number} */ d, /** @type {number} */ b, /** @type {string} */ color) =>
      ({ id, polar: [d, b], marker: 'dot', label, style: 'tiny', color });
    return {
      views: {
        scope: { target: [0, 0, 0], tilt: 90, distance: 330 },
        tilted: { target: [0, 0, 0], yaw: 0, tilt: 35, distance: 300 }
      },
      camera: { view: 'scope' },
      points: [
        { id: 'centre', xyz: [0, 0, 0] },
        // the sweep's leading edge and its afterglow, riding the turning ring
        ...FAN.map(([lag], i) => ({ id: `sweep_${i + 1}`, polar: [R, -lag], object: 'sweep_ring' })),
        // each range ring's distance, along bearing 135
        ...[1, 2, 3, 4].map((k) => ({ id: `range_${k}`, polar: [k * R / 4, 135], label: String(k * R / 4), style: 'tiny', overlap: true })),
        { id: 'north', polar: [R + 12, 0], label: '000', style: 'minor', overlap: true },
        { id: 'east', polar: [R + 12, 90], label: '090', style: 'minor', overlap: true },
        { id: 'south', polar: [R + 12, 180], label: '180', style: 'minor', overlap: true },
        { id: 'west', polar: [R + 12, 270], label: '270', style: 'minor', overlap: true },
        contact('contact_1', 'CONTACT 1', 62, 40, 'var(--lcars-orange)'),
        contact('contact_2', 'CONTACT 2', 35, 215, 'var(--lcars-orange)'),
        contact('contact_3', 'UNKNOWN', 85, 300, 'var(--lcars-red)')
      ],
      objects: [
        { type: 'grid', id: 'scope', shape: 'disc', radius: R, pattern: 'polar', line_spacing: R / 4, spoke_count: 12, opacity: 0.6 },
        { type: 'ring', id: 'rim', radius: R, width: 3, color: 'theme:colors.ui.primary' },
        { type: 'beam', id: 'cross_ns', from: [0, 0, -R], to: [0, 0, R], width: 1, color: 'theme:colors.ui.secondary' },
        { type: 'beam', id: 'cross_ew', from: [-R, 0, 0], to: [R, 0, 0], width: 1, color: 'theme:colors.ui.secondary' },
        // the ring the sweep rides: it turns clockwise seen from above (a negative spin), unseen
        { type: 'ring', id: 'sweep_ring', radius: R, spin: -turn, opacity: 0 },
        ...FAN.map(([, a], i) => ({
          type: 'beam', id: `sweep_line_${i + 1}`, from: 'centre', to: `sweep_${i + 1}`, width: i === 0 ? 3 : 2, opacity: a, color: 'var(--lcars-green)'
        })),
        { type: 'glow', at: 'contact_1', size: 10, color: 'var(--lcars-orange)' },
        { type: 'glow', at: 'contact_2', size: 10, color: 'var(--lcars-orange)' },
        { type: 'glow', at: 'contact_3', size: 10, color: 'var(--lcars-red)' }
      ]
    };
  }
});
