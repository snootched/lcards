/** Sector map: the docs reference (index page) */
export default /** @type {import('./index.js').Starter} */ ({
  id: 'sector_map',
  kind: 'scene',
  title: 'Sector map',
  description: 'A flat lettered grid seen from straight above, territories filled cell by cell; the tilt is locked, so a drag pans the map.',
  icon: 'mdi:grid',
  params: [],
  build: () => ({
    views: { map: { target: [0, 0, 0], tilt: 90, distance: 1250, projection: 'orthographic' } },
    camera: { view: 'map', limits: { tilt: [90, 90] } },
    objects: [
      {
        type: 'grid', id: 'sectors', shape: 'plane', size: [1200, 600], line_spacing: 40,
        axis_labels: { columns: 'letters', rows: 'numbers', column_start: 'AD' },
        cells: [
          { from: 'AF3', to: 'AH6', color: 'var(--lcars-blue)', opacity: 0.3, shade: 0.4, edges: true },
          { from: 'AL2', to: 'AO5', color: 'var(--lcars-green)', opacity: 0.25, shade: 0.4 },
          { from: 'AL9', to: 'AP12', color: 'var(--lcars-red)', opacity: 0.3, shade: 0.4 }
        ]
      }
    ],
    points: [
      { id: 'ufp', cell: 'AG4', object: 'sectors', label: 'UNITED FEDERATION OF PLANETS', style: 'major' },
      { id: 'sb10', cell: 'AJ2', object: 'sectors', offset: [8, 0, 12], marker: 'triangle', label: 'Starbase 10' },
      { id: 'achernar', cell: 'AN3', object: 'sectors', marker: 'diamond', label: 'Achernar' },
      { id: 'qualor', cell: 'AL6', object: 'sectors', marker: 'dot', label: 'Qualor', style: 'tiny', max_distance: 1300 }
    ]
  })
});
