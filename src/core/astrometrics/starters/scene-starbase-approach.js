/** A starship (the built-in Constitution-class model) approaching Earth Spacedock */
export default /** @type {import('./index.js').Starter} */ ({
  id: 'starbase_approach',
  kind: 'scene',
  title: 'Starbase approach',
  description: 'The built-in Constitution-class starship on its way into Earth Spacedock through the space doors, with its bridge and nacelles marked and the approach lane drawn. Not to scale: the real Spacedock is nineteen times the ship\'s length.',
  icon: 'mdi:space-station',
  params: [],
  build: () => ({
    views: {
      approach: { target: [0, 60, -60], yaw: 125, tilt: 20, distance: 800 },
      starbase: { target: 'dock', yaw: 200, tilt: 30, distance: 420 },
      ship: { target: 'ship_centre', yaw: 140, tilt: 25, distance: 90 }
    },
    camera: { view: 'approach' },
    backdrop: { stars: { count: 2000 } },
    points: [
      { id: 'ship_centre', xyz: [0, 170, 90] },
      { id: 'ship_name', at: 'ship_centre', offset: [0, 22, 0], label: 'USS ENTERPRISE', style: 'major', tap_action: { action: 'fly-to', view: 'ship' } },
      { id: 'bridge', object: 'ship', part: 'bridge', marker: 'dot', label: 'BRIDGE', style: 'tiny' },
      { id: 'port', object: 'ship', part: 'nacelle_port', marker: 'dot', label: 'PORT NACELLE', style: 'tiny' },
      { id: 'starboard', object: 'ship', part: 'nacelle_starboard', marker: 'dot', label: 'STARBOARD NACELLE', style: 'tiny' },
      // the space doors, on top of the cap (the model is 480 tall, centred on its at)
      { id: 'doors', xyz: [0, 134, -110], marker: 'dot', label: 'SPACE DOORS', style: 'minor' },
      { id: 'dock', at: 'doors', offset: [0, 50, 0], label: 'SPACEDOCK', style: 'major', tap_action: { action: 'fly-to', view: 'starbase' } }
    ],
    objects: [
      { type: 'model', id: 'ship', src: 'builtin:constitution', at: 'ship_centre', size: 50, rotation: [0, 180, 0], scan_period: 6, animation: 'all' },
      { type: 'model', id: 'spacedock', src: 'builtin:earth_spacedock', at: [0, -110, -110], size: 480, material: 'original' },
      { type: 'path', points: ['ship_centre', 'doors'], dash: [4, 6], flow_speed: -30, color: 'var(--lcars-orange)' }
    ]
  })
});
