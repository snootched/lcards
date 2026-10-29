/**
 * The true-scale dive: a galaxy in light years with the Sol system in km
 * inside it (`type: system`), down to Deep Space 9 in Earth orbit. The
 * galactic disc hides once you are inside the system.
 */
import { solSystem, SOL_VIEWS, STATION_VIEW } from './true-scale.js';

export default /** @type {import('./index.js').Starter} */ ({
  id: 'true_scale_dive',
  kind: 'scene',
  title: 'Galaxy to station at true scale',
  description: 'A galaxy in light years with the Sol system in km inside it, 26,000 light years from the core: tap SOL and dive from the galaxy to the planets, Earth and Deep Space 9, all at their real sizes and distances.',
  icon: 'mdi:magnify-plus-outline',
  params: [],
  build: () => ({
    units: 'ly',
    views: {
      galaxy: { target: 'core', yaw: 20, tilt: 35, distance: 140000 },
      ...SOL_VIEWS,
      station: STATION_VIEW
    },
    camera: { view: 'galaxy', fly_duration: 5000 },
    backdrop: { stars: { count: 2000 } },
    points: [
      { id: 'core', xyz: [0, 0, 0], label: 'GALACTIC CORE', style: 'title' },
      { id: 'sol', polar: [26000, 200], alt: 60, marker: 'dot', label: 'SOL', style: 'major', tap_action: { action: 'fly-to', view: 'inner' } }
    ],
    objects: [
      // measured to its surface: hidden once you are near Sol, 60 ly above it
      { type: 'grid', shape: 'disc', radius: 50000, pattern: 'polar', line_spacing: 5000, spoke_count: 36, min_distance: 20 },
      { type: 'glow', at: 'core', size: 30000 },
      { type: 'system', id: 'sol_system', at: 'sol', units: 'km', ...solSystem({ station: true }) }
    ]
  })
});
