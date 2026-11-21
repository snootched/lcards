// Third-party libraries for <LibraryTable /> (doc/credits.md, the About page): the
// rows of scripts/data/third-party.json with versions and licences read from
// node_modules/<pkg>/package.json (scripts/lib/third-party.js). Same source as
// THIRD_PARTY_NOTICES.txt; tests/docs/third-party.test.js keeps it complete.
import { libraryRows } from '../../../scripts/lib/third-party.js'

export default {
  watch: ['../../../package.json', '../../../scripts/data/third-party.json'],
  load() {
    const pick = ({ id, name, url, purpose, load, version, license, licenseNote }) =>
      ({ id, name, url, purpose, load, version, license, licenseNote })
    return { runtime: libraryRows('runtime').map(pick), docs: libraryRows('docs').map(pick) }
  },
}
