/**
 * Solar system: planets orbit by standing on their orbit rings, which spin
 * (a point on an object turns with it); the Moon orbits the Earth the same way.
 */

/** [id, label, orbit radius, planet radius, orbit spin (degrees per second), start bearing] */
const PLANETS = /** @type {const} */ ([
  ['mercury', 'MERCURY', 20, 1.2, 24, 40],
  ['venus', 'VENUS', 30, 2, 16, 150],
  ['earth', 'EARTH', 42, 2.4, 10, 250],
  ['mars', 'MARS', 56, 1.6, 6, 320],
  ['jupiter', 'JUPITER', 82, 5, 2.5, 100]
]);

export default /** @type {import('./index.js').Starter} */ ({
  id: 'solar_system',
  kind: 'scene',
  title: 'Solar system',
  description: 'The Sun and five planets on their orbits, the Earth with its map and the Moon going round it. Tap a planet to fly to it.',
  icon: 'mdi:orbit',
  params: [],
  build: () => ({
    views: {
      system: { target: 'sun', yaw: 20, tilt: 40, distance: 230 },
      top: { target: 'sun', tilt: 90, distance: 250 },
      earth: { target: 'earth', yaw: 30, tilt: 20, distance: 22 }
    },
    camera: { view: 'system' },
    backdrop: { stars: { count: 2000 } },
    points: [
      { id: 'sun', xyz: [0, 0, 0], label: 'SOL', style: 'major' },
      ...PLANETS.map(([id, label, orbit, , , bearing]) => ({
        id, polar: [orbit, bearing], object: `${id}_orbit`, marker: 'dot', label, style: 'minor', tap_action: { action: 'fly-to' }
      })),
      { id: 'moon', polar: [5, 0], object: 'moon_orbit', marker: 'dot', label: 'LUNA', style: 'tiny', max_distance: 80 }
    ],
    objects: [
      { type: 'glow', at: 'sun', size: 40, color: 'var(--lcars-yellow)' },
      { type: 'sphere', id: 'sun_body', at: 'sun', radius: 5, fill_color: 'var(--lcars-yellow)', color: 'var(--lcars-orange)', line_spacing_deg: 30 },
      ...PLANETS.flatMap(([id, , orbit, radius, spin]) => [
        { type: 'ring', id: `${id}_orbit`, radius: orbit, spin, width: 1, color: 'theme:colors.ui.secondary', opacity: 0.6 },
        id === 'earth'
          ? { type: 'sphere', id: 'earth_body', at: 'earth', radius, image: 'builtin:earth_blue_marble', line_spacing_deg: 30, spin: 20 }
          : { type: 'sphere', id: `${id}_body`, at: id, radius, line_spacing_deg: 30, spin: 15 }
      ]),
      { type: 'ring', id: 'moon_orbit', at: 'earth', radius: 5, spin: 40, width: 1, dash: [3, 3], opacity: 0.6 },
      { type: 'sphere', id: 'moon_body', at: 'moon', radius: 0.6, line_spacing_deg: 45 }
    ]
  })
});
