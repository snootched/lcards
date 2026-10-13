<script setup lang="ts">
// Under a release page's title (injected by releaseMetaRule in config.mts):
// date or in-testing note, breaking badge, links to GitHub.
import { computed } from 'vue'
import { useData } from 'vitepress'
import { formatReleaseDate } from './release-format'

const { frontmatter } = useData()
const repo = 'https://github.com/snootched/lcards'
const tag = computed(() => String(frontmatter.value.version ?? ''))
const testing = computed(() => frontmatter.value.status === 'testing')
</script>

<template>
  <div class="release-meta">
    <span v-if="testing" class="release-badge testing">In testing</span>
    <span v-else class="release-date">Released {{ formatReleaseDate(frontmatter.date) }}</span>
    <span v-if="frontmatter.breaking" class="release-badge breaking">Breaking changes</span>
    <a v-if="testing" :href="`${repo}/releases`" target="_blank" rel="noopener">Dev builds on GitHub</a>
    <a v-else :href="`${repo}/releases/tag/${tag}`" target="_blank" rel="noopener">GitHub release</a>
  </div>
  <div v-if="testing" class="tip custom-block">
    <p class="custom-block-title">Not released yet</p>
    <p>These notes cover the dev builds of the next release and grow with each one. Dev builds are pre-releases on GitHub; install them only if you want to help test.</p>
  </div>
</template>
