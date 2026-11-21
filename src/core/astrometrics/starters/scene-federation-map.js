/** The Federation and its neighbours: territories as volumes on a galaxy disc */
export default /** @type {import('./index.js').Starter} */ ({
  id: 'federation_map',
  kind: 'scene',
  title: 'Federation map',
  summary: 'The Alpha and Beta Quadrant powers as territories on a disc',
  description: 'The Alpha and Beta Quadrant powers as territories on a disc, their capitals, the Romulan Neutral Zone and a route from Earth to Qo\'noS.',
  icon: 'mdi:map-legend',
  params: [],
  build: () => ({
    views: {
      overview: { target: [0, 0, -10], yaw: 200, tilt: 50, distance: 350 },
      top: { target: [0, 0, 0], tilt: 90, distance: 300, projection: 'orthographic' },
      sol: { target: 'earth', yaw: 220, tilt: 35, distance: 80 }
    },
    camera: { view: 'overview' },
    backdrop: { stars: { count: 1500 } },
    points: [
      { id: 'federation', polar: [60, 165], alt: 14, label: 'UNITED FEDERATION OF PLANETS', style: 'major', color: 'var(--lcars-blue)' },
      { id: 'klingon', polar: [80, 45], alt: 14, label: 'KLINGON EMPIRE', style: 'major', color: 'var(--lcars-red)' },
      { id: 'romulan', polar: [90, 320], alt: 14, label: 'ROMULAN STAR EMPIRE', style: 'major', color: 'var(--lcars-green)' },
      { id: 'cardassian', polar: [85, 235], alt: 14, label: 'CARDASSIAN UNION', style: 'major', color: 'var(--lcars-orange)' },
      { id: 'earth', polar: [45, 170], marker: 'reticle', label: 'Earth', tap_action: { action: 'fly-to', view: 'sol' } },
      { id: 'vulcan', polar: [52, 150], marker: 'dot', label: 'Vulcan', style: 'tiny' },
      { id: 'qonos', polar: [80, 40], marker: 'diamond', label: 'Qo\'noS' },
      { id: 'romulus', polar: [95, 325], marker: 'diamond', label: 'Romulus' },
      { id: 'cardassia', polar: [90, 230], marker: 'diamond', label: 'Cardassia Prime' },
      { id: 'neutral_zone', polar: [60, 330], label: 'NEUTRAL ZONE', style: 'tiny', color: 'var(--lcars-green)' }
    ],
    objects: [
      { type: 'grid', shape: 'disc', radius: 130, pattern: 'polar', line_spacing: 10, spoke_count: 36, major: { row_interval: 3 }, opacity: 0.6 },
      { type: 'ring', radius: 130, width: 2, color: 'theme:colors.ui.secondary' },
      { type: 'volume', id: 'federation_space', shape: 'sector', radius: [25, 75], angle: [130, 200], height: [-4, 6], color: 'var(--lcars-blue)', tap_action: { action: 'fly-to' } },
      { type: 'volume', id: 'klingon_space', shape: 'sector', radius: [50, 110], angle: [15, 75], height: [-4, 6], color: 'var(--lcars-red)', tap_action: { action: 'fly-to' } },
      { type: 'volume', id: 'romulan_space', shape: 'sector', radius: [65, 120], angle: [295, 350], height: [-4, 6], color: 'var(--lcars-green)', tap_action: { action: 'fly-to' } },
      { type: 'volume', id: 'cardassian_space', shape: 'sector', radius: [60, 115], angle: [210, 255], height: [-4, 6], color: 'var(--lcars-orange)', tap_action: { action: 'fly-to' } },
      { type: 'ring', radius: 62, arc: [295, 350], width: 2, dash: [6, 4], color: 'var(--lcars-green)' },
      { type: 'path', points: ['earth', 'qonos'], arc: 10, dash: { pattern: [6, 4], speed: 20 }, color: 'var(--lcars-orange)' },
      { type: 'glow', at: [0, 0, 0], size: 40, opacity: 0.6 }
    ]
  })
});
