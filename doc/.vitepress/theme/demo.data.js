// Build-time data for the live demo page (DemoBoard.vue, getting-started/live-demo.md):
// the public demo board (demo/order.yaml, demo/views/), every release's views, each with
// its topic and release. Each docs channel ships its own bundle and its own order.yaml,
// so /v/<version>/ keeps the views up to that release on that release's code, and /dev/
// shows the upcoming release.
import { readFileSync } from 'node:fs'
import { loadDemo, loadPackage, buildDashboard, boardReleases, helpersPackage } from '../../../scripts/lib/demo-dashboard.js'
import { TEST_HELPERS, GALLERY_HELPERS } from '../../../tests/ha/ha-client.mjs'
import { DEMO_STATES } from '../../../tests/helpers/demo-states.js'

/** package.json's version without its -dev.N suffix: the release this build documents. */
export function docsRelease() {
  const { version } = JSON.parse(readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'))
  return version.replace(/-.*$/, '')
}

/**
 * The demo helpers DEMO_STATES has no sample value for, as a fresh Home Assistant
 * install creates them from their definitions (initial, else min or the first option;
 * a toggle off): without them a view's helper would get a generic sample (40, "on").
 */
export function helperSeed(definitions = { ...TEST_HELPERS, ...GALLERY_HELPERS }) {
  const seed = {}
  for (const [id, def] of Object.entries(definitions)) {
    if (DEMO_STATES[id]) continue
    const attributes = { friendly_name: def.name }
    const domain = id.split('.')[0]
    if (domain === 'input_number') {
      Object.assign(attributes, { min: def.min, max: def.max, step: def.step ?? 1 }, def.unit_of_measurement ? { unit_of_measurement: def.unit_of_measurement } : {})
      seed[id] = { state: String(def.initial ?? def.min), attributes }
    } else if (domain === 'input_boolean') {
      seed[id] = { state: def.initial ? 'on' : 'off', attributes }
    } else if (domain === 'input_select') {
      seed[id] = { state: String(def.initial ?? def.options[0]), attributes: { ...attributes, options: def.options } }
    }
  }
  return seed
}

export default {
  watch: ['../../../demo/**/*.yaml'],
  load() {
    const release = docsRelease()
    const demo = loadDemo()
    // The Docs buttons open this channel's own pages (relative to the site base).
    const base = (process.env.DOCS_BASE ?? '/').replace(/\/$/, '')
    const board = buildDashboard(demo, { board: 'public', docsBase: base, index: false })
    const views = boardReleases(demo, { board: 'public' }).flatMap(r => r.views.map(v => ({ ...v, release: r.version })))
    const configs = Object.fromEntries(board.views.slice(1).map(c => [c.path, c]))
    const isPublic = new Set(views.map(v => v.file))
    return {
      release,
      helperStates: helperSeed(),
      // demo/package.yaml's scripts, run by the page's sample Home Assistant (card-env.js addScripts)
      scripts: loadPackage().script,
      // the topic tree (demo/order.yaml), public views only: topic > groups > view paths
      topics: demo.topics
        .map(t => ({ id: t.id, title: t.title, groups: t.groups.map(g => ({ title: g.title, views: g.views.filter(f => isPublic.has(f)).map(f => views.find(v => v.file === f).path) })).filter(g => g.views.length) }))
        .filter(t => t.groups.length),
      // the helpers these views use, as a package for the reader's own Home Assistant
      helpers: helpersPackage(views, { ...TEST_HELPERS, ...GALLERY_HELPERS }, loadPackage()).yaml,
      // in the tree's order; the index view is for Home Assistant (navigate actions), the page has its own menu
      views: [...views].sort((a, b) => a.rank - b.rank).map(v => ({
        path: v.path,
        title: v.title,
        summary: v.summary,
        topic: v.topic,
        group: v.group,
        heavy: v.heavy,
        release: v.release,
        isNew: v.release === release,
        yaml: v.text,
        config: configs[v.path],
      })),
    }
  },
}
