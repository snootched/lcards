// Build-time data for the live demo page (DemoBoard.vue, getting-started/live-demo.md):
// the public demo board (demo/order.yaml, demo/views/) for this docs build's release
// only. Each docs channel ships its own bundle, so /v/<version>/ keeps that release's
// views on that release's code, and /dev/ shows the upcoming release.
import { readFileSync } from 'node:fs'
import { loadDemo, buildDashboard, boardReleases, helpersPackage } from '../../../scripts/lib/demo-dashboard.js'
import { TEST_HELPERS, GALLERY_HELPERS } from '../../../tests/ha/ha-client.mjs'

/** package.json's version without its -dev.N suffix: the release this build documents. */
export function docsRelease() {
  const { version } = JSON.parse(readFileSync(new URL('../../../package.json', import.meta.url), 'utf8'))
  return version.replace(/-.*$/, '')
}

export default {
  watch: ['../../../demo/**/*.yaml'],
  load() {
    const release = docsRelease()
    const demo = loadDemo()
    // The Docs buttons open this channel's own pages (relative to the site base).
    const base = (process.env.DOCS_BASE ?? '/').replace(/\/$/, '')
    const board = buildDashboard(demo, { board: 'public', release, docsBase: base, index: false })
    const views = boardReleases(demo, { board: 'public', release }).flatMap(r => r.views)
    return {
      release,
      // the helpers these views use, as a package for the reader's own Home Assistant
      helpers: helpersPackage(views, { ...TEST_HELPERS, ...GALLERY_HELPERS }).yaml,
      // the index view is for Home Assistant (navigate actions); the page has its own picker
      views: board.views.slice(1).map((config, i) => ({
        path: config.path,
        title: views[i].title,
        summary: views[i].summary,
        yaml: views[i].text,
        config,
      })),
    }
  },
}
