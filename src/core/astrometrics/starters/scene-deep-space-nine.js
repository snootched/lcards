/** Deep Space 9 (the built-in model) by the Bajoran wormhole, with Bajor below */
export default /** @type {import('./index.js').Starter} */ ({
  id: 'deep_space_nine',
  kind: 'scene',
  title: 'Deep Space 9',
  summary: 'Deep Space 9 with its parts marked, the wormhole and Bajor',
  description: 'The built-in Deep Space 9 station with Ops, the Promenade and its docking pylons marked, the Bajoran wormhole off its bow and Bajor below. Tap a name to fly to it.',
  icon: 'mdi:space-station',
  params: [],
  build: () => ({
    views: {
      station: { target: 'ds9_centre', yaw: 30, tilt: 10, distance: 190 },
      ops: { target: 'ops', yaw: 50, tilt: 25, distance: 70 },
      wormhole: { target: 'wormhole', yaw: 150, tilt: 8, distance: 120 },
      sector: { target: [0, -40, 120], yaw: 60, tilt: 20, distance: 520 }
    },
    camera: { view: 'station' },
    backdrop: { stars: { count: 2500 } },
    points: [
      { id: 'ds9_centre', xyz: [0, 0, 0] },
      { id: 'ds9_name', at: 'ds9_centre', offset: [0, 70, 0], label: 'DEEP SPACE 9', style: 'major', tap_action: { action: 'fly-to', view: 'station' } },
      { id: 'ops', object: 'ds9', part: 'ops', marker: 'dot', label: 'OPS', style: 'minor', tap_action: { action: 'fly-to', view: 'ops' } },
      { id: 'promenade', object: 'ds9', part: 'promenade', marker: 'dot', label: 'PROMENADE', style: 'tiny' },
      { id: 'habitat', object: 'ds9', part: 'habitat_ring', marker: 'dot', label: 'HABITAT RING', style: 'tiny' },
      { id: 'pylon1', object: 'ds9', part: 'upper_pylon_1', marker: 'dot', label: 'UPPER PYLON 1', style: 'tiny' },
      { id: 'pylon2', object: 'ds9', part: 'upper_pylon_2', marker: 'dot', label: 'UPPER PYLON 2', style: 'tiny' },
      { id: 'pylon3', object: 'ds9', part: 'upper_pylon_3', marker: 'dot', label: 'UPPER PYLON 3', style: 'tiny' },
      { id: 'wormhole', xyz: [0, 10, 300], label: 'BAJORAN WORMHOLE', style: 'minor', tap_action: { action: 'fly-to', view: 'wormhole' } },
      { id: 'bajor', xyz: [-160, -260, -40] },
      { id: 'bajor_name', at: 'bajor', offset: [0, 30, 125], label: 'BAJOR', style: 'minor' }
    ],
    objects: [
      { type: 'model', id: 'ds9', src: 'builtin:deep_space_nine', at: 'ds9_centre', size: 100, material: 'original' },
      { type: 'glow', at: 'wormhole', size: 90, color: 'var(--lcars-blue)' },
      { type: 'glow', at: 'wormhole', size: 40, color: 'var(--lcards-moonlight)' },
      { type: 'ring', at: 'wormhole', radius: 26, rotation: [90, 0, 0], spin: 40, dash: [2, 4], width: 1.5, color: 'var(--lcars-blue)' },
      { type: 'sphere', at: 'bajor', radius: 120, fill: { effect: { preset: 'terran' } }, line_spacing_deg: 30, line_width: 0.5, opacity: 0.3, spin: 3 }
    ]
  })
});
