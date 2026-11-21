// Docs channels shared by VersionSwitcher.vue and VersionBanner.vue (pure, so
// tests/docs/docs-versions.test.js runs it in node).
//
// The site root is the stable line, /dev/ the dev branch, /v/<version>/ a frozen
// stable release. /versions.json at the site root (written by
// scripts/docs-deploy.mjs on every deploy) lists them:
//   { "latest": "2026.10.0", "dev": "2026.11.0-dev.1", "versions": ["2026.10.0", ...] }

/** Base path of a channel. */
export function channelBase(channel, version) {
  if (channel === 'latest') return '/'
  if (channel === 'dev') return '/dev/'
  return `/v/${version}/`
}

/**
 * The same page in another channel: swap the current base for the target's.
 * @param {string} pathname - location.pathname, e.g. /dev/cards/button/
 * @param {string} currentBase - this build's base
 * @param {string} targetBase
 */
export function pathInBase(pathname, currentBase, targetBase) {
  const rest = pathname.startsWith(currentBase) ? pathname.slice(currentBase.length) : pathname.replace(/^\//, '')
  return targetBase + rest
}

/**
 * Switcher entries, newest first: Latest, Dev, then each archived release (the
 * archive copy of the latest release is the same as Latest, so it is listed once).
 * @param {{latest?: string, dev?: string, versions?: string[]} | null} versions
 * @param {{channel: string, version: string, base: string}} current
 * @returns {{label: string, base: string, current: boolean}[]}
 */
export function switcherEntries(versions, current) {
  const entries = []
  const add = (label, base) => entries.push({ label, base, current: base === current.base })
  const latest = versions?.latest ?? (current.channel === 'latest' ? current.version : null)
  if (latest) add(`Latest (${latest})`, '/')
  const dev = versions?.dev ?? (current.channel === 'dev' ? current.version : null)
  if (dev) add(`Dev (${dev})`, '/dev/')
  for (const v of versions?.versions ?? []) {
    if (v === latest) continue
    add(v, `/v/${v}/`)
  }
  if (!entries.some(e => e.current)) add(current.channel === 'archive' ? current.version : current.channel, current.base)
  return entries
}

/**
 * Banner for every channel except the stable root.
 * @returns {{text: string, latestBase: string} | null}
 */
export function bannerFor(current, versions) {
  if (current.channel === 'latest') return null
  const latest = versions?.latest
  const tail = latest ? ` The latest stable release is ${latest}.` : ''
  if (current.channel === 'dev') {
    return { text: `You are reading the development docs (${current.version}): features here may not be released yet.${tail}`, latestBase: '/' }
  }
  return { text: `You are reading the docs for LCARdS ${current.version}, an earlier release.${tail}`, latestBase: '/' }
}
