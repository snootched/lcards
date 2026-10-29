/** Galaxy with territories: a galaxy disc, territories, beams, a planet with an away team */
export default /** @type {import('./index.js').Starter} */ ({
  id: 'galaxy',
  kind: 'scene',
  title: 'Galaxy with territories',
  description: 'A galaxy disc with its core, Federation and Borg space as see-through volumes, crossing beams, a planet with an away team (it appears as you fly in) and a route between two stars.',
  icon: 'mdi:star-four-points-outline',
  params: [],
  build: () => ({
    views: {
      galaxy: { target: 'core', yaw: 20, tilt: 35, distance: 280 },
      map: { target: 'core', tilt: 90, distance: 300 },
      planet: { target: 'nimbus', yaw: 60, tilt: 20, distance: 40 }
    },
    camera: { view: 'galaxy' },
    backdrop: { stars: { count: 2500 } },
    points: [
      { id: 'core', xyz: [0, 0, 0], label: 'GALACTIC CORE', style: 'title' },
      { id: 'sagittarius', polar: [45, 300], label: 'Sagittarius Arm', style: 'major' },
      { id: 'federation', polar: [75, 135], alt: 22, label: 'FEDERATION', style: 'major', color: 'var(--lcars-blue)' },
      { id: 'borg', polar: [30, 345], alt: 44, label: 'BORG SPACE', style: 'major', color: 'var(--lcars-green)' },
      { id: 'talos', polar: [52, 310], marker: 'dot', label: 'Talos IV', style: 'tiny', max_distance: 200 },
      { id: 'vega', polar: [64, 160], marker: 'triangle', label: 'Vega', style: 'minor' },
      { id: 'nimbus', polar: [72, 236], alt: 12, marker: 'reticle', label: 'NIMBUS III', tap_action: { action: 'fly-to', view: 'planet' } },
      { id: 'away', latlon: [10, 40], object: 'planet', alt: 0.3, marker: 'dot', label: 'AWAY TEAM', style: 'tiny', color: 'var(--lcars-orange)', max_distance: 100 }
    ],
    objects: [
      { type: 'grid', shape: 'disc', radius: 100, pattern: 'polar', line_spacing: 10, spoke_count: 36, major_row_interval: 3, ring_labels: { step: 10, radius: 106 } },
      { type: 'ring', radius: 100, width: 3, color: 'theme:colors.ui.secondary' },
      {
        type: 'volume', id: 'federation_space', shape: 'sector', radius: [55, 95], angle: [100, 170], height: [-6, 18],
        cells: { ring: 10, angle: 10, layer: 8 }, color: 'var(--lcars-blue)', tap_action: { action: 'fly-to' }
      },
      { type: 'volume', shape: 'sector', radius: [18, 42], angle: [330, 360], height: [0, 40], color: 'var(--lcars-green)' },
      { type: 'glow', at: 'core', size: 70 },
      { type: 'beam', from: [-180, 0, 0], to: [180, 0, 0] },
      { type: 'beam', from: [0, 0, -180], to: [0, 0, 180] },
      // the planet shows only close up: from the galaxy view, Nimbus III is its marker
      { type: 'sphere', id: 'planet', at: 'nimbus', radius: 6, spin: 8, max_distance: 100 },
      { type: 'ring', at: 'nimbus', radius: 10, inclination: 20, width: 1.5, max_distance: 100 },
      { type: 'path', points: ['talos', 'vega'], arc: 12, dash: [6, 4], color: 'var(--lcars-orange)' }
    ]
  })
});
