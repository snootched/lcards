/** The Utopia Planitia Fleet Yards: drydocks (the built-in model) in orbit over Mars */

/** [id, label, position, a ship in the berth] */
const DOCKS = /** @type {const} */ ([
  ['dock1', 'DRYDOCK 1', [-70, 30, 20], true],
  ['dock2', 'DRYDOCK 2', [0, 38, 0], false],
  ['dock3', 'DRYDOCK 3', [70, 30, -20], false]
]);

export default /** @type {import('./index.js').Starter} */ ({
  id: 'utopia_planitia',
  kind: 'scene',
  title: 'Utopia Planitia yards',
  summary: 'Three drydocks in orbit over Mars, a starship in the first',
  description: 'Three drydocks of the Utopia Planitia Fleet Yards in orbit over Mars (its USGS Viking map), a Constitution-class starship in the first. Tap a drydock to fly to it.',
  icon: 'mdi:factory',
  params: [],
  build: () => ({
    views: {
      yards: { target: [0, 20, 0], yaw: 20, tilt: 22, distance: 260 },
      ...Object.fromEntries(DOCKS.map(([id]) => [id, { target: id, yaw: 35, tilt: 20, distance: 80 }]))
    },
    camera: { view: 'yards' },
    backdrop: { stars: { count: 2000 } },
    points: [
      { id: 'mars', xyz: [0, -200, 0] },
      // names stand clear of the bodies (a label inside one hides behind its surface)
      { id: 'mars_name', at: 'mars', offset: [0, 40, 200], label: 'MARS', style: 'major' },
      ...DOCKS.flatMap(([id, label, xyz]) => [
        { id, xyz: [...xyz] },
        { id: `${id}_name`, at: id, offset: [0, 14, 0], marker: 'reticle', label, style: 'minor', tap_action: { action: 'fly-to', view: id } }
      ])
    ],
    objects: [
      { type: 'sphere', id: 'mars_body', at: 'mars', radius: 190, image: 'builtin:mars_viking', line_spacing_deg: 30, line_width: 0.5, opacity: 0.3, spin: 2 },
      ...DOCKS.flatMap(([id, , , ship]) => [
        { type: 'model', id: `${id}_frame`, src: 'builtin:utopia_planitia_drydock', at: id, size: 40, material: 'original' },
        // the ship at the drydock's scale (289 m in a 772 m frame)
        ...(ship ? [{ type: 'model', id: `${id}_ship`, src: 'builtin:constitution', at: id, size: 15, scan: { period: 6 } }] : [])
      ])
    ]
  })
});
