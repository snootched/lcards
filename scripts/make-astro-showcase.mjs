#!/usr/bin/env node
/**
 * make-astro-showcase.mjs: writes demo/views/astro-showcase.yaml, the
 * astrometrics showcase (R4d), from the starters it is built on, so it stays
 * in step with them:
 *
 *  - the Star Trek galaxy starter and its three parts (ly);
 *  - the real-positions Sol system (R4a) as a system in km at Sol, with
 *    Spacedock at Earth, the Utopia Planitia yards over Mars and a ship in
 *    orbit with its trail;
 *  - a Bajor system in km at Bajor: B'hava'el, Bajor, the Denorios belt, Deep
 *    Space 9 with its shields and status card, the animated wormhole (power
 *    opens it), a nebula with a patrol route, and a Borg cube (the incursion
 *    toggle);
 *  - the wormhole's Gamma end as a small system in km with the same mouth:
 *    both mouths face along the link (`face`), which runs throat to throat;
 *    each mouth has a diagram look and a realistic one (`look`, picked by
 *    the LOOK selector);
 *
 * in an LCARS frame (lcards-layout-view): the 14 stops down the left, the
 * controls along the bottom. The helpers it uses are in tests/ha/ha-client.mjs,
 * its tour script and automations in demo/package.yaml.
 *
 *   node scripts/make-astro-showcase.mjs          # write the view
 *   node scripts/make-astro-showcase.mjs --check  # fail if it is stale
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const root = new URL('..', import.meta.url);
const OUT = fileURLToPath(new URL('demo/views/astro-showcase.yaml', root));

/** The card's id (the package's set_clock automation and the stop buttons name it) */
export const CARD_ID = 'astro_showcase';

/** The tour's stops in order: [view, button label, clock to set there (optional)] */
export const STOPS = /** @type {const} */ ([
  ['galaxy', 'GALAXY'],
  ['federation', 'FEDERATION'],
  ['sol', 'SOL SYSTEM', { rate: 30 }],
  ['earth', 'EARTH', { rate: 0.0417 }],
  ['mars', 'MARS'],
  ['jupiter', 'JUPITER', { rate: 1 }],
  ['saturn', 'SATURN', { rate: 1 }],
  ['pluto', 'PLUTO'],
  ['bajor_system', 'BAJOR SYSTEM'],
  ['ds9', 'DEEP SPACE 9'],
  ['wormhole', 'WORMHOLE'],
  ['nebula', 'NEBULA'],
  ['cube', 'BORG CUBE'],
  ['gamma', 'IDRAN']
]);

/** How deep a wormhole mouth's funnel runs (km): the link leaves from its throat */
const MOUTH_DEPTH = 60;

/**
 * The card config.
 * @returns {Promise<Record<string, any>>}
 */
export async function showcaseCard() {
  const { applyStarter, STARTERS } = await import('../src/core/astrometrics/starters/index.js');
  const { solSystem, SOL_VIEWS } = await import('../src/core/astrometrics/starters/true-scale.js');
  const { WORMHOLE_AIM, wormholeMouth } = await import('../src/core/astrometrics/starters/scene-star-trek-galaxy.js');
  const byId = (/** @type {string} */ id) => /** @type {any} */ (STARTERS.find((s) => s.id === id));
  /** @type {any} */
  let card = applyStarter({ type: 'custom:lcards-astrometrics-card', id: CARD_ID }, byId('star_trek_galaxy')).config;
  for (const id of ['st_minor_powers', 'st_delta_powers', 'st_transwarp']) card = /** @type {any} */ (applyStarter(card, byId(id))).config;

  // The wormhole's mouths are in two systems below (km, the same size at both ends): the galaxy-scale
  // mouths go, the link runs throat to throat, each mouth faces where the link leaves it
  // (the starter's mouths, ids wormhole_alpha_* and wormhole_gamma_*, and its alpha end point go)
  const starterMouth = (/** @type {string} */ id) => id === 'wormhole_alpha' || id === 'wormhole_aim_alpha' || /^wormhole_(alpha|gamma)_/.test(id);
  card.points = card.points.filter((/** @type {any} */ p) => !starterMouth(p.id));
  card.points.push({ id: 'wormhole_aim_alpha', at: 'bajor', offset: [0, WORMHOLE_AIM, 0] });
  card.objects = card.objects
    .filter((/** @type {any} */ o) => !starterMouth(o.id))
    .map((/** @type {any} */ o) => (o.id === 'wormhole_link' ? { ...o, points: ['wormhole_throat', 'gamma_wormhole_throat'] } : o));
  // Federation names go to alert colours during a Borg incursion (a rule on the tag)
  card.points = card.points.map((/** @type {any} */ p) => (['federation_name', 'sol', 'vulcan', 'andoria', 'tellar'].includes(p.id) ? { ...p, tags: ['federation'] } : p));

  // ── Sol (km) ──
  const sol = solSystem();
  sol.objects = sol.objects.map((/** @type {any} */ o) => (o.type === 'sphere' ? { ...o, tags: ['planets'] } : o));
  sol.points.push(
    // your home on Earth, the sun's elevation there
    { id: 'home', latlon: { entity: 'zone.home' }, object: 'earth_body', alt: 50, marker: 'reticle', label: 'HOME', style: 'tiny', color: 'var(--lcars-orange)', max_distance: 200000 },
    { id: 'sun_reading', at: 'home', offset: [0, 900, 0], label: 'SUN {states.sun.sun.attributes.elevation}°', style: 'tiny', max_distance: 200000 },
    // Spacedock in high orbit; the Utopia Planitia yards over Mars, a Constitution in one
    { id: 'spacedock', at: 'earth', offset: [-21082, 0, 36515], label: 'SPACEDOCK', style: 'tiny', marker: 'starbase', max_distance: 3000000 },
    { id: 'yards', at: 'mars', offset: [0, 300, 20400], label: 'UTOPIA PLANITIA', style: 'tiny', marker: 'starbase', max_distance: 2000000 },
    { id: 'dock_2', at: 'yards', offset: [3, 0, 0] },
    { id: 'dock_3', at: 'yards', offset: [-3, 0, 0] },
    { id: 'ship_in_dock', object: 'drydock_1', part: 'berth' },
    // a ship on patrol round Earth, facing the way it goes, its trail behind it
    { id: 'patrol', polar: [12000, 0], object: 'patrol_orbit', marker: 'ship', label: 'USS ENTERPRISE', style: 'tiny', max_distance: 400000 }
  );
  sol.objects.push(
    { type: 'model', id: 'spacedock_model', at: 'spacedock', src: 'builtin:earth_spacedock', size: 5.48, material: 'original' },
    { type: 'model', id: 'drydock_1', at: 'yards', src: 'builtin:utopia_planitia_drydock', size: 0.76, material: 'original' },
    { type: 'model', id: 'drydock_2', at: 'dock_2', src: 'builtin:utopia_planitia_drydock', size: 0.76, material: 'original' },
    { type: 'model', id: 'drydock_3', at: 'dock_3', src: 'builtin:utopia_planitia_drydock', size: 0.76, material: 'original' },
    { type: 'model', id: 'ship_building', at: 'ship_in_dock', src: 'builtin:constitution', size: 0.289, material: 'original' },
    { type: 'ring', id: 'patrol_orbit', at: 'earth', radius: 12000, inclination: 28, spin: 20, width: 1, opacity: 0.35, color: 'var(--lcars-blue)', tags: ['orbits'] },
    { type: 'model', id: 'patrol_ship', at: 'patrol', src: 'builtin:constitution', size: 0.289, face: 'motion', material: 'original' },
    { type: 'trail', point: 'patrol', length: 8, width: 2, color: 'var(--lcars-blue)' }
  );

  // ── Bajor (km) ──
  // the mouths in km, 40 km across at full power: the WORMHOLE slider opens them
  const power = 'input_number.lcards_test_power';
  const bajorMouth = wormholeMouth({ prefix: 'wormhole', at: 'bajor_wormhole', aim: 'wormhole_aim_gamma', radius: 40, depth: MOUTH_DEPTH, power, stars: 9000 });
  const bajor = {
    points: [
      { id: 'bhavael', xyz: [0, 0, 0], label: "B'HAVA'EL", style: 'minor' },
      { id: 'bajor_world', polar: [150000000, 300], marker: 'dot', label: 'BAJOR', style: 'minor', max_distance: 900000000 },
      { id: 'bajor_wormhole', polar: [232000000, 46], alt: 20, label: 'THE WORMHOLE', style: 'minor', max_distance: 30000 },
      // Deep Space 9 350 km out in front of the mouth (it opens toward yaw 33, tilt -10), its shields and a status card
      {
        id: 'ds9', at: 'bajor_wormhole', offset: [190, -60, 290], marker: 'starbase', label: 'DEEP SPACE 9', style: 'minor', max_distance: 60000,
        card: {
          show: 'always', position: 'top-right', width: 180,
          card: { type: 'custom:lcards-button', preset: 'lozenge', entity: 'input_number.lcards_test_shields', text: { name: { content: 'SHIELDS {entity.state}%', show: true } } }
        }
      },
      // the cube lurks beyond the wormhole; an incursion (a rule) brings it to Deep Space 9
      { id: 'cube', at: 'bajor_wormhole', offset: [2600, 400, -1800], label: 'BORG CUBE', style: 'minor', color: 'var(--lcars-green)', max_distance: 20000 },
      // a nebula to fly through, a patrol route across it
      { id: 'nebula', polar: [236000000, 52], label: 'CHIN\'TOKA NEBULA', style: 'minor', max_distance: 3000000 },
      { id: 'route_a', at: 'nebula', offset: [-90000, 2000, -30000] },
      { id: 'route_b', at: 'nebula', offset: [90000, -2000, 30000] },
      ...bajorMouth.points
    ],
    objects: [
      { type: 'glow', at: 'bhavael', size: 9000000, color: 'var(--lcars-yellow)' },
      { type: 'sphere', id: 'bhavael_body', at: 'bhavael', radius: 650000, fill_color: 'var(--lcars-yellow)', color: 'var(--lcars-orange)', tags: ['planets'] },
      { type: 'sphere', id: 'bajor_body', at: 'bajor_world', radius: 6300, fill_effect: { preset: 'terran' }, spin: 4, line_spacing_deg: 30, line_width: 0.5, tags: ['planets'] },
      { type: 'ring', id: 'bajor_orbit', radius: 150000000, width: 1, opacity: 0.5, tags: ['orbits'] },
      { type: 'belt', id: 'denorios_belt', at: 'bhavael', radius: [222000000, 242000000], thickness: 2000000, count: 1500, size: [0.5, 30], tumble: 0, seed: 21 },
      { type: 'model', id: 'ds9_model', at: 'ds9', src: 'builtin:deep_space_nine', size: 1.452, material: 'original' },
      { type: 'sphere', id: 'ds9_shields', at: 'ds9', radius: 1.2, fill_color: 'var(--lcars-blue)', color: 'var(--lcars-blue)', line_spacing_deg: 20, opacity: { entity: 'input_number.lcards_test_shields', to: [0, 0.45] } },
      ...bajorMouth.objects,
      // hidden from afar (its clouds would wash over Sol in the galaxy view)
      { type: 'nebula', id: 'chintoka', at: 'nebula', radius: 70000, colors: ['var(--lcars-orange)', 'var(--lcars-violet)'], drift: 300, max_distance: 3000000 },
      { type: 'path', id: 'patrol_route', points: ['route_a', 'route_b'], arc: 8000, dash: [10, 8], flow_speed: 40, pulse: true, color: 'var(--lcars-orange)', width: 2 },
      { type: 'cube', id: 'borg_cube', at: 'cube', size: 3 }
    ]
  };

  // ── The Gamma end (km): the same mouth, facing back along the link ──
  const gammaMouth = wormholeMouth({ prefix: 'gamma_wormhole', at: 'gamma_mouth', aim: 'wormhole_aim_alpha', radius: 40, depth: MOUTH_DEPTH, power, stars: 9000 });
  const gamma = {
    points: [{ id: 'gamma_mouth', xyz: [0, 0, 0], label: 'THE WORMHOLE (GAMMA)', style: 'minor', max_distance: 30000 }, ...gammaMouth.points],
    objects: gammaMouth.objects
  };

  card.objects.push(
    { type: 'system', id: 'sol_system', at: 'sol', units: 'km', ...sol },
    { type: 'system', id: 'bajor_system', at: 'bajor', units: 'km', ...bajor },
    { type: 'system', id: 'gamma_system', at: 'wormhole_gamma', units: 'km', ...gamma }
  );

  // diagram, realistic or both: the look selector
  card.look = { entity: 'input_select.lcards_test_look' };
  // the scene date's rate follows the value slider; the date comes from the date helper (an automation)
  card.clock = { date: 'now', rate: { entity: 'input_number.lcards_test_value', to: [0, 30] } };
  const views = {
    ...card.camera.views,
    sol: { ...SOL_VIEWS.system, target: 'sun' },
    earth: { ...SOL_VIEWS.earth },
    // Mars is north (-z) of the yards: yaw near 0 looks at it past the Constitution in its drydock
    mars: { target: 'ship_in_dock', yaw: 15, tilt: 10, distance: 2.2 },
    jupiter: SOL_VIEWS.jupiter,
    saturn: SOL_VIEWS.saturn,
    neptune: SOL_VIEWS.neptune,
    pluto: { target: 'pluto', yaw: 120, tilt: 25, distance: 9000000000 },
    bajor_system: { target: 'bhavael', yaw: 30, tilt: 35, distance: 700000000 },
    // past the station into the wormhole's mouth behind it (12 degrees off the mouth's axis)
    ds9: { target: 'ds9', yaw: 45, tilt: 0, distance: 5 },
    // into the mouth, 30 degrees off its axis (it opens toward yaw 33, tilt -10: away from the Gamma end)
    wormhole: { target: 'bajor_wormhole', yaw: 63, tilt: 5, distance: 320 },
    // the Gamma mouth, the same size as Bajor's, opening the other way (yaw 213)
    gamma: { target: 'gamma_mouth', yaw: 243, tilt: 5, distance: 320 },
    // at the nebula's edge (its clouds fade as you fly in), the patrol route crossing in front
    nebula: { target: 'nebula', yaw: 40, tilt: 8, distance: 110000 },
    cube: { target: 'cube', yaw: 20, tilt: 10, distance: 12 }
  };
  card.camera = {
    ...card.camera,
    views,
    fly_duration: 5000,
    // the guided tour: the stage helper picks the stop
    view: { entity: 'input_number.lcards_test_stage', views: STOPS.map(([view, , clock]) => (clock ? { view, ...clock } : view)) }
  };
  card.rules = [
    { id: 'showcase_orbits_off', when: { entity: 'input_boolean.lcards_test_visible', state: 'off' }, apply: { overlays: { 'tag:orbits': { visible: false } } } },
    { id: 'showcase_grids_off', when: { entity: 'input_boolean.lcards_test_lights', state: 'off' }, apply: { overlays: { 'tag:planets': { line_width: 0 } } } },
    {
      id: 'showcase_borg_incursion', when: { entity: 'input_boolean.lcards_test_toggle', state: 'on' },
      apply: {
        overlays: {
          cube: { at: 'ds9', offset: [40, 8, -25] },
          borg_space: { outline: [[6000, -6000], [32000, 2000], [44000, -24000], [34000, -44000], [12000, -38000], [2000, -20000]] },
          'tag:federation': { color: 'var(--lcars-red)' }
        }
      }
    }
  ];
  return card;
}

/** The whole view (an LCARS frame round the card) */
export async function showcaseView() {
  const card = await showcaseCard();
  const stop = (/** @type {string} */ view, /** @type {string} */ label) => ({
    type: 'custom:lcards-button', preset: 'lozenge', text: { name: { content: label, show: true } },
    tap_action: { action: 'fly-to', card: CARD_ID, view }
  });
  const toggle = (/** @type {string} */ entity, /** @type {string} */ label) => ({
    type: 'custom:lcards-button', preset: 'lozenge', entity, text: { name: { content: label, show: true } }, tap_action: { action: 'toggle' }
  });
  const slider = (/** @type {string} */ entity, /** @type {string} */ label) => ({
    type: 'custom:lcards-slider', entity, preset: 'shaped-horizontal', component: 'shaped', text: { name: { content: label } },
    style: { shaped: { text_bands: { left: { size: 110 } } } }
  });
  const action = (/** @type {string} */ label, /** @type {any} */ tap) => ({
    type: 'custom:lcards-button', preset: 'lozenge', text: { name: { content: label, show: true } }, tap_action: tap
  });
  const stage = { entity_id: 'input_number.lcards_test_stage' };
  return {
    title: 'Astrometrics showcase',
    path: 'astro-showcase',
    type: 'custom:lcards-layout-view',
    layout: {
      height: 'calc(100dvh - var(--header-height, 56px))',
      'min-height': '1100px',
      padding: '12px',
      'grid-gap': '8px',
      'grid-template-columns': '200px minmax(0, 1fr)',
      'grid-template-rows': '80px minmax(0, 1fr) 176px',
      'grid-template-areas': '"head head" "stops scene" "stops controls"'
    },
    cards: [
      {
        type: 'custom:lcards-elbow',
        view_layout: { 'grid-area': 'head' },
        elbow: { type: 'header-left', segment: { bar_width: 200, bar_height: 26, color: 'theme:colors.ui.secondary' } },
        text: { title: { content: 'ASTROMETRICS · STELLAR CARTOGRAPHY', position: 'bottom-right', font_size: 30, color: 'theme:colors.ui.tertiary' } }
      },
      {
        type: 'custom:lcards-layout-card',
        view_layout: { 'grid-area': 'stops' },
        layout: { 'grid-gap': '6px', 'grid-template-columns': 'minmax(0, 1fr)', 'grid-template-rows': `repeat(${STOPS.length}, minmax(0, 1fr))` },
        cards: STOPS.map(([view, label]) => stop(view, label))
      },
      { ...card, view_layout: { 'grid-area': 'scene' }, height: '100%' },
      {
        type: 'custom:lcards-layout-card',
        view_layout: { 'grid-area': 'controls' },
        layout: {
          'grid-gap': '6px',
          'grid-template-columns': 'repeat(6, minmax(0, 1fr))',
          'grid-template-rows': 'repeat(4, minmax(0, 1fr))'
        },
        cards: [
          toggle('input_boolean.lcards_test_visible', 'ORBITS'),
          toggle('input_boolean.lcards_test_lights', 'PLANET GRIDS'),
          toggle('input_boolean.lcards_test_toggle', 'BORG INCURSION'),
          action('PREVIOUS', { action: 'perform-action', perform_action: 'input_number.decrement', target: stage }),
          // starts the tour, and stops it while it runs
          {
            type: 'custom:lcards-button', preset: 'lozenge', entity: 'script.lcards_test_tour',
            text: { name: { content: "[[[ return entity?.state === 'on' ? 'STOP TOUR' : 'PLAY TOUR' ]]]", show: true } },
            tap_action: { action: 'toggle' }
          },
          action('NEXT', { action: 'perform-action', perform_action: 'input_number.increment', target: stage }),
          { ...slider('input_number.lcards_test_shields', 'SHIELDS'), view_layout: { 'grid-column': 'span 2' } },
          { ...slider('input_number.lcards_test_power', 'WORMHOLE'), view_layout: { 'grid-column': 'span 2' } },
          { ...slider('input_number.lcards_test_value', 'DATE RATE'), view_layout: { 'grid-column': 'span 2' } },
          { type: 'custom:lcards-select-menu', entity: 'input_select.lcards_test_mode', preset: 'toggle-tab', grid: { columns: 3 }, view_layout: { 'grid-column': 'span 3' } },
          // the look: the wormholes as LCARS diagrams, realistic, or both
          { type: 'custom:lcards-select-menu', entity: 'input_select.lcards_test_look', preset: 'toggle-tab', grid: { columns: 3 }, view_layout: { 'grid-column': 'span 3' } },
          {
            type: 'custom:lcards-button', preset: 'lozenge', entity: 'input_datetime.lcards_test_date', view_layout: { 'grid-column': 'span 5' },
            text: { name: { content: 'DATE {entity.state}', show: true } }, tap_action: { action: 'more-info' }
          },
          action('NOW', { action: 'set-clock', card: CARD_ID, date: 'now', rate: 'live' })
        ]
      }
    ]
  };
}

const HEAD = `# Astrometrics showcase (R4d), written by scripts/make-astro-showcase.mjs: do not
# edit by hand, change the script (or the starters it is built on) and run it.
# The Star Trek galaxy with the real Sol system and a Bajor system inside it,
# the 14 stops down the left, the controls along the bottom. Helpers in
# tests/ha/ha-client.mjs; uses: script.lcards_test_tour,
# automation.lcards_test_alert, automation.lcards_test_date (demo/package.yaml).
`;

async function main() {
  const text = HEAD + yaml.dump(await showcaseView(), { lineWidth: -1, flowLevel: 6, noRefs: true });
  if (process.argv.includes('--check')) {
    if (readFileSync(OUT, 'utf8') !== text) {
      console.error('demo/views/astro-showcase.yaml is stale: run node scripts/make-astro-showcase.mjs');
      process.exit(1);
    }
    console.log('astro-showcase.yaml is up to date');
    return;
  }
  writeFileSync(OUT, text);
  console.log(`wrote demo/views/astro-showcase.yaml (${Math.round(text.length / 1024)} KB)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
