/** A starship (the built-in Constitution-class model) approaching a starbase */
export default /** @type {import('./index.js').Starter} */ ({
  id: 'starbase_approach',
  kind: 'scene',
  title: 'Starbase approach',
  description: 'The built-in Constitution-class starship on its way into a wireframe starbase, with its bridge and nacelles marked and the approach lane drawn.',
  icon: 'mdi:space-station',
  params: [],
  build: () => ({
    views: {
      approach: { target: [0, 15, 25], yaw: 125, tilt: 18, distance: 230 },
      starbase: { target: 'dock', yaw: 200, tilt: 25, distance: 160 },
      ship: { target: 'ship_centre', yaw: 140, tilt: 25, distance: 90 }
    },
    camera: { view: 'approach' },
    backdrop: { stars: { count: 2000 } },
    points: [
      { id: 'ship_centre', xyz: [0, 20, 90] },
      { id: 'ship_name', at: 'ship_centre', offset: [0, 22, 0], label: 'USS ENTERPRISE', style: 'major', tap_action: { action: 'fly-to', view: 'ship' } },
      { id: 'bridge', object: 'ship', part: 'bridge', marker: 'dot', label: 'BRIDGE', style: 'tiny' },
      { id: 'port', object: 'ship', part: 'nacelle_port', marker: 'dot', label: 'PORT NACELLE', style: 'tiny' },
      { id: 'starboard', object: 'ship', part: 'nacelle_starboard', marker: 'dot', label: 'STARBOARD NACELLE', style: 'tiny' },
      { id: 'dock', xyz: [0, 20, -40], marker: 'reticle', label: 'SPACEDOCK', style: 'major', tap_action: { action: 'fly-to', view: 'starbase' } }
    ],
    objects: [
      { type: 'model', id: 'ship', src: 'builtin:constitution', at: 'ship_centre', size: 50, rotation: [0, 180, 0], scan_period: 6, animation: 'all' },
      { type: 'grid', id: 'starbase_dome', shape: 'sphere', at: [0, 20, -40], radius: 45, pattern: 'both', line_spacing_deg: 15, color: 'theme:colors.ui.secondary', opacity: 0.7 },
      { type: 'grid', id: 'starbase_stem', shape: 'cylinder', at: [0, -50, -40], radius: 8, height: 50, pattern: 'both', line_spacing: 6 },
      { type: 'path', points: ['ship_centre', 'dock'], dash: [4, 6], flow_speed: -30, color: 'var(--lcars-orange)' },
      { type: 'grid', shape: 'plane', size: [300, 300], line_spacing: 20, at: [0, -60, 0], opacity: 0.25 }
    ]
  })
});
