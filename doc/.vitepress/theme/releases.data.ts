// Release list for <ReleaseList /> (doc/releases/index.md): frontmatter of every
// doc/releases/<tag>.md, in testing first, then newest first. Same source as the
// sidebar in config.mts and the GitHub export (scripts/release-lib.mjs).
import { listReleases } from '../../../scripts/release-lib.mjs'

export interface Release {
  tag: string
  version: string
  date: string | null
  status: 'released' | 'testing'
  summary: string
  breaking: boolean
  link: string
  github: string
}

declare const data: Release[]
export { data }

export default {
  watch: ['../../releases/*.md'],
  load(): Release[] {
    return listReleases().map(({ file, ...r }) => r)
  },
}
