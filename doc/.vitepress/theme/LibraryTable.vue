<script setup lang="ts">
// The About page's library tables (doc/credits.md): <LibraryTable /> lists the
// libraries built into LCARdS, <LibraryTable set="docs" /> the ones only this docs
// site uses. Rows come from libraries.data.js (versions and licences from
// node_modules), so nothing here is typed by hand.
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { data } from './libraries.data.js'

const props = defineProps<{ set?: 'runtime' | 'docs' }>()
const set = computed(() => props.set ?? 'runtime')
const rows = computed(() => data[set.value] ?? [])
const LOAD = { main: 'Always', lazy: 'On demand' }
const notices = withBase('/lcards/THIRD_PARTY_NOTICES.txt')
</script>

<template>
  <table class="library-table">
    <thead>
      <tr>
        <th>Library</th>
        <th>Version</th>
        <th>License</th>
        <th v-if="set === 'runtime'">Loaded</th>
        <th>Purpose</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="r in rows" :key="r.id">
        <td><a :href="r.url" target="_blank" rel="noopener">{{ r.name }}</a></td>
        <td class="library-version">{{ r.version }}</td>
        <td>
          <a v-if="r.license.url" :href="r.license.url" target="_blank" rel="noopener">{{ r.license.name }}</a>
          <span v-else>{{ r.license.name }}</span>
          <span v-if="r.licenseNote" class="library-note">{{ r.licenseNote }}</span>
        </td>
        <td v-if="set === 'runtime'">{{ LOAD[r.load] ?? r.load }}</td>
        <td>{{ r.purpose }}</td>
      </tr>
    </tbody>
  </table>
  <p v-if="set === 'runtime'" class="library-footnote">
    The license texts of these libraries, and of the code they pull in, ship with the integration in
    <a :href="notices" target="_blank" rel="noopener"><code>THIRD_PARTY_NOTICES.txt</code></a>.
  </p>
</template>

<style scoped>
.library-version {
  white-space: nowrap;
}
.library-note {
  display: block;
  margin-top: 4px;
  font-size: 0.85em;
  color: var(--vp-c-text-2);
}
.library-footnote {
  font-size: 0.9em;
  color: var(--vp-c-text-2);
}
</style>
