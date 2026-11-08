// What the live card components (CardDemo.vue, CardGallery.vue) share: the
// production bundle, one sample hass per page, the LCARS colour variables and
// the sections-grid sizing.
import { SAMPLE_ENTITIES, samplePoints, sampleStatistics, LCARS_DEMO_VARS } from './chart-demo-data.js'
// The HA-LCARS palette (fixed colours such as --lcars-alert-red), from the committed snapshot
// (scripts/sync-ha-lcars.js), so doc examples naming a palette colour render as on a dashboard.
// Role variables (--lcars-ui-*) stay unset: cards show their LCARdS fallbacks, as without a theme.
import haLcars from '../../../scripts/data/ha-lcars/snapshot.json' with { type: 'json' }

/**
 * The production bundle, loaded once per page from the published /lcards/ copy.
 * A module <script> tag, not import(): the docs dev server refuses to import files
 * from public/ ("can only be referenced via HTML tags"), while a script tag works in
 * both the dev server and the built site. The stub then loads its main chunk itself.
 */
export function loadBundle() {
  globalThis.__lcardsDocsBundle ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.type = 'module'
    // Under the site's base (/, /dev/, /v/<version>/): each docs channel runs its own bundle.
    const src = `${import.meta.env?.BASE_URL ?? '/'}lcards/lcards.js`
    script.src = `${src}?v=docs`
    script.onload = resolve
    script.onerror = () => reject(new Error(`could not load ${src} (run npm run build; for the built site, npm run docs:build)`))
    document.head.appendChild(script)
  })
  return globalThis.__lcardsDocsBundle
}

/** One shared environment per page: every demo on the page sees the same sample states. */
export function sharedEnv() {
  globalThis.__lcardsDocsEnv ??= Promise.all([
    import('../../../tests/helpers/card-env.js'),
    import('../../../tests/helpers/demo-states.js'),
    import('../../../tests/helpers/ha-jinja.js'),
  ]).then(([mod, { DEMO_STATES }, { createHaJinja }]) => {
    mod.defineHaStubs({ loadIcons: () => import('@mdi/js') })
    let render = null
    let latest = {}
    const env = mod.createDemoEnv({
      sample: { SAMPLE_ENTITIES, samplePoints, sampleStatistics },
      simulateServices: true,
      // the entities the live demo's views use (demo/views/, DemoBoard.vue)
      extraStates: DEMO_STATES,
      // Jinja2 templates ({{ }}) rendered here, as Home Assistant would (no server on the docs)
      renderTemplate: (template, variables, states) => {
        latest = states
        render ??= createHaJinja(() => latest)
        return render(template, variables)
      },
    })
    return env
  })
  return globalThis.__lcardsDocsEnv
}

/**
 * Home Assistant's own theme colours that examples may name (status colours from
 * the frontend's color.globals.ts; cards sit on the demo's black panel), so they
 * render as on a dashboard instead of falling back to grey.
 */
const HA_DEMO_VARS = {
  '--error-color': '#db4437',
  '--warning-color': '#ffa600',
  '--success-color': '#43a047',
  '--info-color': '#039be5',
  '--primary-background-color': '#000000',
  // Home Assistant's radius scale (layout area examples)
  '--ha-border-radius-lg': '12px',
  '--ha-card-background': '#000000',
  '--card-background-color': '#000000',
}

/** The LCARS (HA-LCARS theme) colour variables a dashboard would have, and Home Assistant's status colours. */
export function applyDemoVars() {
  const root = document.documentElement
  const palette = Object.fromEntries(haLcars.palette.filter(p => p.name.startsWith('lcars-')).map(p => [`--${p.name}`, p.value]))
  for (const [name, value] of Object.entries({ ...HA_DEMO_VARS, ...palette, ...LCARS_DEMO_VARS })) {
    if (!getComputedStyle(root).getPropertyValue(name).trim()) root.style.setProperty(name, value)
  }
}

/** Load the bundle and the sample hass, and wait for the cards to be defined. */
export async function cardRuntime() {
  applyDemoVars()
  const [env] = await Promise.all([sharedEnv(), loadBundle()])
  await customElements.whenDefined('lcards-button')
  return env
}

/** Height of `rows` rows in HA's sections grid (56 px rows, 8 px gaps). */
const rowsHeight = (rows) => `${rows * 56 + (rows - 1) * 8}px`

/**
 * Give the card the height a dashboard's sections grid would: its grid_options.rows;
 * else the rows the card asks for itself (getGridOptions(), as Home Assistant reads
 * them: button 1, a button component 4 to 6, an upright slider 4), at least 3 for an
 * elbow (its 2 default rows leave little open frame).
 */
export function sizeMount(config, card) {
  const explicit = Number(config.grid_options?.rows)
  if (explicit > 0) return rowsHeight(explicit)
  let rows = Number(card?.getGridOptions?.()?.rows)
  if (config.type === 'custom:lcards-elbow') rows = Math.max(rows || 0, 3)
  return rows > 0 ? rowsHeight(rows) : ''
}

/**
 * Width for an explicit grid_options.columns, as in an HA sections view: a section
 * is about 500 px with 12 columns and 8 px gaps (so columns: 6 is about 244 px).
 * Without it the card takes the demo's full width. The mount caps it at 100%.
 */
export function mountWidth(config) {
  const columns = Number(config.grid_options?.columns)
  if (!(columns > 0) || columns >= 12) return ''
  return `${Math.round(columns * 34 + (columns - 1) * 8)}px`
}

/**
 * Room round the card for parts a card draws outside its own box, so the demo panel
 * (overflow: hidden) doesn't clip them: a slider's drag badge sits below a flat track,
 * beside an upright one (left of a Picard gauge) and inside a ring.
 * @returns {{ marginBottom?: string, marginLeft?: string, marginRight?: string }}
 */
export function mountRoom(config) {
  if (config.type !== 'custom:lcards-slider' || config.drag_badge?.enabled !== true) return {}
  if (config.component === 'ring' || /ring/.test(String(config.preset ?? ''))) return {}
  const vertical = config.style?.track?.orientation === 'vertical' || /vertical/.test(String(config.preset ?? ''))
  if (!vertical) return { marginBottom: '32px' }
  return config.component === 'picard' || /picard/.test(String(config.preset ?? '')) ? { marginLeft: '72px' } : { marginRight: '72px' }
}

const READ_ONLY_DOMAINS = new Set(['sensor', 'binary_sensor', 'weather', 'sun', 'zone', 'person', 'device_tracker'])

/** What a reader can do with this demo, for the caption under it ('' when nothing). */
export function demoHint(config) {
  const domain = String(config.entity ?? '').split('.')[0]
  const readOnly = READ_ONLY_DOMAINS.has(domain)
  if (config.type === 'custom:lcards-slider') {
    if (!config.entity) return ''
    return readOnly ? `Read-only: a ${domain} can't be set, so this shows its sample value.` : `Drag to set ${config.entity}.`
  }
  if (config.type === 'custom:lcards-select-menu') return 'Tap an option to select it.'
  if (JSON.stringify(config).includes('"action":"toggle"')) {
    return 'Taps on toggle actions switch the sample entity.'
  }
  if (readOnly) return `${config.entity} is a read-only sample sensor.`
  return ''
}
