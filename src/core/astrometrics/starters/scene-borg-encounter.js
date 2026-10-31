/** A Borg cube (type: cube) closing on a Federation starship, a tractor beam between them */
export default /** @type {import('./index.js').Starter} */ ({
  id: 'borg_encounter',
  kind: 'scene',
  title: 'Borg encounter',
  summary: 'A Borg cube bearing down on a starship, tractor beam locked on',
  description: 'A Borg cube with its green halo bearing down on the built-in Constitution-class starship, its tractor beam locked on. Tap a name to fly to it.',
  icon: 'mdi:cube',
  params: [],
  build: () => ({
    views: {
      encounter: { target: [0, 0, 20], yaw: 120, tilt: 15, distance: 170 },
      cube: { target: 'cube', yaw: 30, tilt: 20, distance: 90 },
      ship: { target: 'ship', yaw: 150, tilt: 20, distance: 45 }
    },
    camera: { view: 'encounter' },
    backdrop: { stars: { count: 2500 } },
    points: [
      { id: 'cube', xyz: [0, 0, -20] },
      { id: 'cube_name', at: 'cube', offset: [0, 32, 0], label: 'BORG CUBE', style: 'major', tap_action: { action: 'fly-to', view: 'cube' } },
      { id: 'ship', xyz: [0, 4, 70] },
      { id: 'ship_name', at: 'ship', offset: [0, 10, 0], label: 'USS ENTERPRISE', style: 'minor', tap_action: { action: 'fly-to', view: 'ship' } },
      // the beam leaves the cube's face toward the ship
      { id: 'emitter', xyz: [0, 2, 0] }
    ],
    objects: [
      { type: 'glow', at: 'cube', size: 110, color: 'var(--lcards-green-medium)', opacity: 0.45 },
      { type: 'cube', id: 'borg', at: 'cube', size: 40, spin: 3, rotation: [8, 25, 0] },
      { type: 'model', id: 'hull', src: 'builtin:constitution', at: 'ship', size: 20, rotation: [0, 160, 0], scan_period: 5 },
      { type: 'beam', from: 'emitter', to: 'ship', width: 10, color: 'var(--lcards-green-medium)', pulse: true }
    ]
  })
});
