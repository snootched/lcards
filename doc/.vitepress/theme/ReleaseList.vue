<script setup lang="ts">
// The Releases index: one card per release page, in testing first.
import { withBase } from 'vitepress'
import { data as releases } from './releases.data'
import { formatReleaseDate } from './release-format'
</script>

<template>
  <ul class="release-list">
    <li v-for="r in releases" :key="r.tag" class="release-item" :class="{ testing: r.status === 'testing' }">
      <a :href="withBase(r.link + '.html')" class="release-link">
        <span class="release-head">
          <span class="release-version">{{ r.version }}</span>
          <span v-if="r.status === 'testing'" class="release-badge testing">In testing</span>
          <span v-if="r.breaking" class="release-badge breaking">Breaking changes</span>
          <span class="release-date">{{ r.status === 'testing' ? 'Dev builds' : formatReleaseDate(r.date) }}</span>
        </span>
        <span class="release-summary">{{ r.summary }}</span>
      </a>
    </li>
  </ul>
</template>
