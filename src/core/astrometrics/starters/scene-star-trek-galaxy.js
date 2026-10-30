/**
 * The Star Trek galaxy (R4c2): the Milky Way in light years (type: galaxy),
 * cut into the four quadrants by two lines through the core, one through
 * Sol, with the major powers, the Bajoran wormhole to the Gamma Quadrant,
 * Voyager's route home and the Great Barrier.
 *
 * Two scales (the user, 2026-10-30). Canon gives small distances between
 * capitals (Vulcan 16 ly from Earth, Bajor about 52, Cardassia about 5
 * beyond Bajor, Qo'noS 36 to 90) and one large figure for the Federation
 * (8,000 ly across, Picard in 2373), which cannot both hold on one map. So
 * the galaxy view shows the powers as regions sized after the Federation's
 * 8,000 ly, and the Federation space view (a close-up round Sol) shows the
 * capitals at their canon distances with the sector grid and the neutral
 * zones. The near powers' regions hide inside the close-up.
 *
 * Frame: the core at 0, Sol 26,000 ly toward bearing 180 (the default
 * camera); galactic north is up (+y), so the galaxy turns clockwise seen
 * from above. The Alpha/Beta line is the real line from Sol to the core:
 * Alpha is galactic longitude 0 to 180 (left of it, x < 0), Beta 180 to 360,
 * Gamma and Delta across the core (Memory Alpha, "Quadrant": seen from above,
 * Alpha lower left, then Gamma, Delta, Beta clockwise).
 *
 * Sources (researched 2026-10-30, Memory Alpha, which cites Star Trek: Star
 * Charts and Stellar Cartography: The Starfleet Reference Library, and the
 * on-screen star charts drawn from them):
 * - homeworlds at real stars come from those stars' real positions:
 *   Vulcan = 40 Eridani (canon since PIC "Maps and Legends"; Beta), Andoria
 *   = Procyon (Beta), Tellar = 61 Cygni (Alpha); landmarks Alpha Centauri,
 *   Wolf 359, Vega, Altair likewise;
 * - fictional worlds within the recorded figures: Qo'noS over 100 ly from
 *   Sol in Beta (Star Charts and the PIC chart; dialogue says under 90),
 *   Romulus in Beta, Bajor 5.25 ly from Cardassia in Alpha;
 * - the Federation 8,000 ly across on the Alpha/Beta line; the Dominion
 *   40,000 to 50,000 ly from the core in Gamma; Idran 4.72 ly from the
 *   wormhole's far end, about 70,000 ly from Bajor (Stellar Cartography);
 *   Ocampa 70,000 ly from Earth (VOY "Caretaker"); the Great Barrier about
 *   15,000 ly across (Star Charts);
 * - Sol 26,000 ly from the core (measured; Memory Alpha says about 30,000).
 * The regions' outlines are our own.
 */

/** Sol's place in the galaxy (0.52 of the 50,000 ly radius, bearing 180) */
export const SOL = /** @type {const} */ ([0, 0, 26000]);

/**
 * A place near Sol, ly east (x) and south (z) of it, as galaxy coordinates.
 * @param {number} dx @param {number} dz @param {number} [dy]
 */
export const nearSol = (dx, dz, dy = 0) => [dx, dy, SOL[2] + dz];

/** ICRS (J2000 equatorial) to galactic axes: x toward the core, y toward longitude 90, z toward galactic north */
const ICRS_TO_GALACTIC = [
  [-0.0548755604, -0.8734370902, -0.4838350155],
  [0.4941094279, -0.4448296300, 0.7469822445],
  [-0.8676661490, -0.1980763734, 0.4559837762]
];

/**
 * A real star near Sol, from its sky position and distance, as an offset
 * from Sol in the scene's axes (ly): toward the core is -z, longitude 90
 * (Alpha) is -x, galactic north is +y.
 * @param {number} raHours - right ascension, hours (J2000)
 * @param {number} decDeg - declination, degrees
 * @param {number} ly - distance
 * @returns {[number, number, number]}
 */
export function starOffset(raHours, decDeg, ly) {
  const a = raHours * 15 * Math.PI / 180;
  const d = decDeg * Math.PI / 180;
  const eq = [Math.cos(d) * Math.cos(a), Math.cos(d) * Math.sin(a), Math.sin(d)];
  const g = ICRS_TO_GALACTIC.map((row) => row[0] * eq[0] + row[1] * eq[1] + row[2] * eq[2]);
  const r = (/** @type {number} */ v) => Math.round(v * 100) / 100;
  return [r(-g[1] * ly), r(g[2] * ly), r(-g[0] * ly)];
}

/** Real stars: [id, label, RA hours, Dec degrees, ly, marker, colour] */
const STARS = /** @type {const} */ ([
  ['vulcan', 'Vulcan (40 Eridani)', 4.2545, -7.6529, 16.26, 'dot', 'var(--lcars-blue)'],
  ['andoria', 'Andoria (Procyon)', 7.6550, 5.2250, 11.46, 'dot', 'var(--lcars-blue)'],
  ['tellar', 'Tellar (61 Cygni)', 21.1150, 38.7494, 11.40, 'dot', 'var(--lcars-blue)'],
  ['alpha_centauri', 'Alpha Centauri', 14.6600, -60.8340, 4.37, 'dot', 'var(--lcards-moonlight)'],
  ['wolf_359', 'Wolf 359', 10.9414, 7.0147, 7.86, 'dot', 'var(--lcards-moonlight)'],
  ['vega', 'Vega', 18.6156, 38.7837, 25.04, 'dot', 'var(--lcards-moonlight)'],
  ['altair', 'Altair', 19.8464, 8.8683, 16.73, 'dot', 'var(--lcards-moonlight)']
]);

/** Fictional capitals, within the recorded figures: [id, label, dx, dz, marker, colour] (ly from Sol) */
const CAPITALS = /** @type {const} */ ([
  ['qonos', "Qo'noS", 64, -90, 'diamond', 'var(--lcars-red)'],
  ['romulus', 'Romulus', 112, 26, 'diamond', 'var(--lcars-green)'],
  ['remus', 'Remus', 113, 27.5, 'dot', 'var(--lcars-green)'],
  ['bajor', 'Bajor', -46, 24, 'diamond', 'var(--lcars-yellow)'],
  ['cardassia', 'Cardassia Prime', -50.9, 26, 'diamond', 'var(--lcars-orange)']
]);

/**
 * The powers as galaxy-scale regions: [id, label, colour, outline [x, z] ly,
 * label place, near Sol (hidden inside the close-up)].
 * @type {[string, string, string, [number, number][], [number, number], boolean][]}
 */
const POWERS = [
  ['federation', 'UNITED FEDERATION OF PLANETS', 'var(--lcars-blue)', [[-4800, 23200], [-1200, 21800], [2200, 23000], [2600, 27200], [800, 30000], [-3200, 30400], [-5200, 27600]], [-1200, 26000], true],
  ['klingon', 'KLINGON EMPIRE', 'var(--lcars-red)', [[2400, 22600], [6200, 21400], [8400, 24200], [7400, 27600], [3000, 27000]], [5600, 24400], true],
  ['romulan', 'ROMULAN STAR EMPIRE', 'var(--lcars-green)', [[2800, 27400], [7200, 28000], [7800, 31800], [3600, 32600], [1200, 30400]], [4800, 30200], true],
  ['cardassian', 'CARDASSIAN UNION', 'var(--lcars-orange)', [[-5400, 27800], [-8800, 26600], [-10400, 29600], [-8200, 32200], [-4600, 31000]], [-7600, 29400], true],
  ['dominion', 'THE DOMINION', 'var(--lcars-violet)', [[-30000, -27000], [-41000, -22000], [-46000, -32000], [-40000, -41000], [-29000, -37000]], [-41000, -25500], false],
  ['borg', 'BORG COLLECTIVE', 'var(--lcars-green)', [[14000, -14000], [30000, -10000], [40000, -24000], [32000, -40000], [16000, -34000], [10000, -22000]], [24000, -24000], false]
];

/** Voyager's way home: [id, label, x, z] (galaxy ly) */
const VOYAGER = /** @type {const} */ ([
  ['ocampa', 'OCAMPA', 37000, -33000],
  ['nekrit', 'Nekrit Expanse', 31000, -22000],
  ['northwest_passage', 'Northwest Passage', 22000, -9000],
  ['endgame', 'Transwarp conduit', 9000, 8000]
]);

/** Galaxy-scale content that stays in a star system's close-ups: the stars round you and the routes into it */
/** The wormhole link's arch over the galaxy (ly) */
export const WORMHOLE_ARC = 4000;
/**
 * How high over the far end a wormhole mouth aims: the link (a sine arch,
 * objects/lines.js arcRun) leaves each end rising pi x its arc over the
 * chord, so a mouth facing this point lines up with the line leaving it.
 */
export const WORMHOLE_AIM = Math.round(Math.PI * WORMHOLE_ARC);

const KEEP_IN_SYSTEMS = new Set(['milky_way', 'voyager_route', 'wormhole_link']);

/**
 * Everything else at galaxy scale steps aside while the camera is inside a
 * star system (`hide_in_systems`): region walls, quadrant lines and the
 * far names would cross the close-ups.
 * @template {{ points?: any[], objects?: any[] }} T
 * @param {T} frag
 * @returns {T}
 */
export function galaxyScale(frag) {
  const mark = (/** @type {any} */ x) => (KEEP_IN_SYSTEMS.has(x.id) ? x : { ...x, hide_in_systems: true });
  return { ...frag, points: (frag.points ?? []).map(mark), objects: (frag.objects ?? []).map(mark) };
}

export default /** @type {import('./index.js').Starter} */ ({
  id: 'star_trek_galaxy',
  kind: 'scene',
  title: 'Star Trek galaxy',
  description: 'The Milky Way in light years cut into the four quadrants (the Alpha/Beta line runs from Sol to the core), with the Federation, the Klingon, Romulan and Cardassian empires, the Dominion and the Borg, the Bajoran wormhole to the Gamma Quadrant, Voyager\'s route home from Ocampa and the Great Barrier. Fly in to Sol for Federation space: Vulcan, Andoria and Tellar at their real stars (40 Eridani, Procyon, 61 Cygni), the Klingon, Romulan and Cardassian capitals at the distances the reference charts give. The galaxy view sizes the empires to be seen, so the two scales do not overlay exactly.',
  icon: 'mdi:star-david',
  params: [],
  build: () => {
    const quadrant = (/** @type {string} */ id, /** @type {string} */ label, /** @type {number} */ bearing) => ({
      // the galaxy and quadrant views only: from anywhere near Sol they are 15,000 to 65,000 ly away
      id, polar: [40000, bearing], alt: 6000, label, style: 'title', min_distance: 70000
    });
    return galaxyScale({
      units: 'ly',
      views: {
        galaxy: { target: 'core', yaw: 20, tilt: 40, distance: 130000 },
        quadrants: { target: 'core', tilt: 90, distance: 150000 },
        federation: { target: 'sol', yaw: 200, tilt: 45, distance: 380 },
        // Earth's neighbours (Vulcan, Andoria, Tellar) crowd SOL from the Federation view
        neighbours: { target: 'sol', yaw: 200, tilt: 35, distance: 50 },
        bajor: { target: 'bajor', yaw: 160, tilt: 20, distance: 12 },
        gamma: { target: 'idran', yaw: 30, tilt: 30, distance: 9000 },
        delta: { target: 'ocampa', yaw: 330, tilt: 40, distance: 45000 },
        barrier: { target: 'core', yaw: 40, tilt: 25, distance: 30000 }
      },
      camera: { view: 'galaxy', fly_duration: 4500, buttons: true },
      backdrop: { stars: { count: 1500 } },
      points: [
        { id: 'core', xyz: [0, 0, 0], label: 'GALACTIC CORE', style: 'major', tap_action: { action: 'fly-to', view: 'barrier' } },
        quadrant('alpha', 'ALPHA QUADRANT', 225),
        quadrant('beta', 'BETA QUADRANT', 135),
        quadrant('gamma_q', 'GAMMA QUADRANT', 315),
        quadrant('delta_q', 'DELTA QUADRANT', 45),
        // the powers' names: the far ones on their regions; the near ones would all fall on a few px
        // round Sol at the galaxy view (one px is ~120 ly there), so they stack as a legend beside it,
        // each in its region's colour, 3,500 ly apart in height (~22 px at the galaxy view)
        ...POWERS.map(([id, label, color, , [x, z], near], i) => ({
          id: `${id}_name`, xyz: near ? [-9000, 1500 + 3500 * i, SOL[2]] : [x, 1500, z], label, style: near ? 'minor' : 'major', color,
          ...(near ? { min_distance: 2500 } : {})
        })),
        // never hidden by its neighbours' labels (they take a free side)
        { id: 'sol', xyz: [...SOL], marker: 'reticle', label: 'SOL', style: 'major', overlap: true, tap_action: { action: 'fly-to', view: 'neighbours' } },
        ...STARS.map(([id, label, ra, dec, ly, marker, color]) => {
          const [dx, dy, dz] = starOffset(ra, dec, ly);
          // the homeworlds win over the landmark stars (and SOL) where their labels overlap
          const home = ['vulcan', 'andoria', 'tellar'].includes(id);
          // within 25 ly of Sol: shown from 150 ly in (the Federation view would crowd them onto SOL)
          return { id, xyz: nearSol(dx, dz, dy), marker, label, style: home ? 'minor' : 'tiny', ...(home ? { priority: 90 } : {}), color, max_distance: 150 };
        }),
        ...CAPITALS.map(([id, label, dx, dz, marker, color]) => ({
          id, xyz: nearSol(dx, dz), marker, label, style: 'minor', color, max_distance: 3000,
          // Bajor wins over Cardassia, 5 ly away, until the Bajor view parts them
          ...(id === 'bajor' ? { priority: 85, tap_action: { action: 'fly-to', view: 'bajor' } } : {})
        })),
        // the Bajoran wormhole: its mouth by Bajor, and its far end at Idran in the Gamma Quadrant
        { id: 'wormhole_alpha', xyz: nearSol(-45, 21.5, 1), label: 'BAJORAN WORMHOLE', style: 'tiny', max_distance: 60 },
        { id: 'idran', xyz: [-38000, 0, -32000], marker: 'diamond', label: 'IDRAN', style: 'minor', tap_action: { action: 'fly-to', view: 'gamma' } },
        // 4.72 ly from Idran (DS9)
        { id: 'wormhole_gamma', xyz: [-37997, 1, -31996.5], label: 'WORMHOLE (GAMMA END)', style: 'tiny', max_distance: 60 },
        // each mouth faces where the link leaves it (WORMHOLE_AIM), the link runs throat to throat
        { id: 'wormhole_aim_gamma', at: 'wormhole_gamma', offset: [0, WORMHOLE_AIM, 0] },
        { id: 'wormhole_aim_alpha', at: 'wormhole_alpha', offset: [0, WORMHOLE_AIM, 0] },
        { id: 'wormhole_alpha_throat', object: 'wormhole_mouth_alpha', xyz: [0, -1.6, 0] },
        { id: 'wormhole_gamma_throat', object: 'wormhole_mouth_gamma', xyz: [0, -1.6, 0] },
        { id: 'founders', xyz: [-39500, 0, -31200], marker: 'dot', label: "Founders' homeworld", style: 'tiny', max_distance: 20000 },
        { id: 'unicomplex', xyz: [26000, 0, -26000], marker: 'diamond', label: 'Unicomplex', style: 'minor', max_distance: 60000 },
        ...VOYAGER.map(([id, label, x, z]) => ({
          id, xyz: [x, 0, z], marker: 'dot', label, style: id === 'ocampa' ? 'minor' : 'tiny', color: 'var(--lcars-orange)',
          ...(id === 'ocampa' ? { tap_action: { action: 'fly-to', view: 'delta' } } : {})
        }))
      ],
      objects: [
        { type: 'galaxy', id: 'milky_way', glow: 0.5 },
        // the quadrant lines: the Alpha/Beta line runs from the core through Sol
        { type: 'beam', id: 'alpha_beta_line', from: [0, 0, -52000], to: [0, 0, 52000], width: 1.5, color: 'theme:colors.ui.secondary', min_distance: 2000 },
        { type: 'beam', id: 'gamma_delta_line', from: [-52000, 0, 0], to: [52000, 0, 0], width: 1.5, color: 'theme:colors.ui.secondary', min_distance: 2000 },
        // the Great Barrier round the core: about 15,000 ly across (Star Charts)
        { type: 'grid', id: 'great_barrier', shape: 'sphere', radius: 7500, line_spacing_deg: 20, color: 'var(--lcars-yellow)', opacity: 0.4, scan_period: 6 },
        { type: 'glow', at: 'core', size: 7000, color: 'var(--lcars-yellow)', opacity: 0.5 },
        // the powers' regions; the near ones hide once the camera is inside them (the close-up)
        ...POWERS.map(([id, , color, outline, , near]) => ({
          type: 'volume', id: `${id}_space`, shape: 'prism', outline, height: [-1200, 1200], color, face_opacity: 0.25,
          // the near powers' nearest edges are 1,200 to 5,400 ly from Sol: hidden anywhere near it
          cells: { width: 2000, depth: 2000, height: 1200 }, ...(near ? { min_distance: 6000 } : {})
        })),
        // Federation space: the sector grid round Sol (20 ly sectors) and the neutral zones
        { type: 'grid', id: 'sectors', shape: 'plane', at: 'sol', size: [400, 400], line_spacing: 20, major_row_interval: 5, opacity: 0.5, max_distance: 3000 },
        { type: 'volume', id: 'romulan_neutral_zone', shape: 'prism', at: 'sol', outline: [[70, -40], [78, -40], [80, 60], [72, 60]], height: [-4, 4], color: 'var(--lcars-green)', face_opacity: 0.35, max_distance: 3000 },
        { type: 'volume', id: 'cardassian_dmz', shape: 'prism', at: 'sol', outline: [[-38, 12], [-42, 8], [-48, 34], [-44, 38]], height: [-4, 4], color: 'var(--lcars-orange)', face_opacity: 0.35, max_distance: 3000 },
        // the Bajoran wormhole: one wormhole, a mouth at each end, the dashed link its throat across the galaxy
        { type: 'path', id: 'wormhole_link', points: ['wormhole_alpha_throat', 'wormhole_gamma_throat'], arc: WORMHOLE_ARC, dash: [8, 6], flow_speed: 30, color: 'var(--lcars-yellow)', width: 1.5 },
        { type: 'grid', id: 'wormhole_mouth_alpha', shape: 'well', well_shape: 'trumpet', well_throat: 0.1, radius: 0.6, depth: 1.6, at: 'wormhole_alpha', face: 'wormhole_aim_gamma', line_spacing_deg: 30, color: 'var(--lcars-yellow)', max_distance: 200 },
        { type: 'grid', id: 'wormhole_mouth_gamma', shape: 'well', well_shape: 'trumpet', well_throat: 0.1, radius: 0.6, depth: 1.6, at: 'wormhole_gamma', face: 'wormhole_aim_alpha', line_spacing_deg: 30, color: 'var(--lcars-yellow)', max_distance: 200 },
        // Voyager's way home
        { type: 'path', id: 'voyager_route', points: [...VOYAGER.map(([id]) => id), 'sol'], dash: [10, 6], flow_speed: 40, color: 'var(--lcars-orange)', width: 2 }
      ]
    });
  }
});
