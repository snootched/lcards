/**
 * Solar system: planets orbit by standing on their orbit rings, which spin
 * (a point on an object turns with it); the Moon orbits the Earth the same way.
 * Each planet wears its NASA / USGS map, or a fill.effect preset where no
 * map exists (Venus's clouds, Saturn, Uranus, Neptune).
 *
 * Each orbit ring lies in the planet's real orbital plane: `rotation` tips
 * it by the orbit's inclination to the ecliptic about its line of nodes,
 * turned to the ascending node's longitude (J2000). The tilt is on the
 * ring's outer group and the spin on the ring itself, so a planet standing
 * on it goes round in that plane. Distances and sizes stay a diagram's.
 */

/**
 * [id, label, orbit radius, planet radius, orbit spin (degrees per second), start bearing,
 *  inclination (degrees), ascending node (degrees)]
 */
const PLANETS = /** @type {const} */ ([
  ['mercury', 'MERCURY', 20, 1.2, 24, 40, 7.0, 48.3],
  ['venus', 'VENUS', 30, 2, 16, 150, 3.39, 76.7],
  ['earth', 'EARTH', 42, 2.4, 10, 250, 0, 0],
  ['mars', 'MARS', 56, 1.6, 6, 320, 1.85, 49.6],
  ['jupiter', 'JUPITER', 82, 5, 2.5, 100, 1.3, 100.5],
  ['saturn', 'SATURN', 112, 4.2, 1.6, 200, 2.49, 113.7],
  ['uranus', 'URANUS', 138, 3, 1.1, 20, 0.77, 74.0],
  ['neptune', 'NEPTUNE', 160, 3, 0.8, 280, 1.77, 131.8],
  ['pluto', 'PLUTO', 184, 0.9, 0.55, 160, 17.16, 110.3]
]);

/** Each planet's surface: a built-in map, or a fill.effect preset */
const LOOKS = /** @type {Record<string, Record<string, any>>} */ ({
  mercury: { image: 'builtin:mercury_messenger' },
  venus: { fill: { effect: { preset: 'clouds' } } },
  earth: { image: 'builtin:earth_blue_marble' },
  mars: { image: 'builtin:mars_viking' },
  jupiter: { image: 'builtin:jupiter_cassini' },
  saturn: { fill: { effect: { preset: 'ringed_giant' } } },
  uranus: { fill: { effect: { preset: 'ice_giant' } } },
  neptune: { fill: { effect: { preset: 'storm_giant' } } },
  pluto: { image: 'builtin:pluto_new_horizons' }
});

export default /** @type {import('./index.js').Starter} */ ({
  id: 'solar_system',
  kind: 'scene',
  title: 'Solar system',
  summary: 'The Sun, eight planets and Pluto on their tilted orbits, with maps',
  description: 'The Sun, eight planets and Pluto, each orbit tilted as the real one is and each planet with its map or planet type, Saturn with its rings and the Moon going round the Earth. Tap a planet to fly to it.',
  icon: 'mdi:orbit',
  params: [],
  build: () => ({
    views: {
      system: { target: 'sun', yaw: 20, tilt: 40, distance: 440 },
      top: { target: 'sun', tilt: 90, distance: 460 },
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
      { type: 'sphere', id: 'sun_body', at: 'sun', radius: 5, fill: { color: 'var(--lcars-yellow)' }, color: 'var(--lcars-orange)', line_spacing_deg: 30 },
      ...PLANETS.flatMap(([id, , orbit, radius, spin, , inclination, node]) => [
        {
          type: 'ring', id: `${id}_orbit`, radius: orbit, spin, width: 1, color: 'theme:colors.ui.secondary', opacity: 0.6,
          ...(inclination ? { rotation: [inclination, node, 0] } : {})
        },
        { type: 'sphere', id: `${id}_body`, at: id, radius, ...LOOKS[id], line_spacing_deg: 30, line_width: 0.5, spin: id === 'earth' ? 20 : 15 }
      ]),
      // Saturn's rings, D ring to F ring, tilted as the planet is
      { type: 'ring', id: 'saturn_rings', at: 'saturn', radius: 9.8, inclination: 27, band: { image: 'builtin:saturn_rings', inner_radius: 4.66 } },
      // the Moon appears as you close in on the Earth, with its label
      { type: 'ring', id: 'moon_orbit', at: 'earth', radius: 5, spin: 40, width: 1, dash: [3, 3], opacity: 0.6, max_distance: 80 },
      { type: 'sphere', id: 'moon_body', at: 'moon', radius: 0.6, image: 'builtin:moon_lroc', line_spacing_deg: 45, line_width: 0.5, max_distance: 80 }
    ]
  })
});
