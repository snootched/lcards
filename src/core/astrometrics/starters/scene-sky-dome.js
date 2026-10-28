/** Sky dome, the sun and moon: the docs reference (index page) */
export default /** @type {import('./index.js').Starter} */ ({
  id: 'sky_dome',
  kind: 'scene',
  title: 'Sky dome: the sun and moon',
  description: 'A dome over your home with the sun and moon where they are now and today\'s tracks across the sky, from your Home Assistant location.',
  icon: 'mdi:weather-sunset',
  params: [],
  build: () => ({
    views: {
      horizon: { target: [0, 15, 0], yaw: 180, tilt: 28, distance: 260 },
      zenith: { target: [0, 0, 0], tilt: 90, distance: 260 }
    },
    camera: { view: 'horizon' },
    objects: [
      { type: 'grid', id: 'sky', shape: 'dome', radius: 100, pattern: 'both', line_spacing_deg: 15 },
      { type: 'ring', radius: 100, width: 3, color: 'theme:colors.ui.primary' },
      { type: 'path', sky: 'sun', object: 'sky', dash: [6, 4], color: 'var(--lcars-yellow)' },
      { type: 'path', sky: 'moon', object: 'sky', dash: [6, 4], color: 'var(--lcars-blue)' }
    ],
    points: [
      { id: 'sun', sky: 'sun', object: 'sky', marker: 'reticle', label: 'SOL' },
      { id: 'moon', sky: 'moon', object: 'sky', marker: 'moon_phase', label: 'LUNA' },
      { id: 'north', altaz: [0, 0], object: 'sky', label: 'N', style: 'major', overlap: true },
      { id: 'east', altaz: [90, 0], object: 'sky', label: 'E', style: 'major', overlap: true },
      { id: 'south', altaz: [180, 0], object: 'sky', label: 'S', style: 'major', overlap: true },
      { id: 'west', altaz: [270, 0], object: 'sky', label: 'W', style: 'major', overlap: true }
    ]
  })
});
