#!/usr/bin/env node
/**
 * Writes the generated part of doc/cards/astrometrics/starters.md (every
 * astrometrics starter with its settings and default YAML) from
 * src/core/astrometrics/starters/. Run after changing a starter:
 * `npm run docs:astro-starters` (`--check` exits 1 when the page is stale).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { withStartersDoc } from './lib/astro-starters-doc.js';

const file = new URL('../doc/cards/astrometrics/starters.md', import.meta.url);
const page = readFileSync(file, 'utf8');
const next = withStartersDoc(page);

if (process.argv.includes('--check')) {
  if (next !== page) {
    console.error('doc/cards/astrometrics/starters.md is stale: run npm run docs:astro-starters');
    process.exit(1);
  }
  console.log('starters.md is up to date');
} else if (next !== page) {
  writeFileSync(file, next);
  console.log('wrote doc/cards/astrometrics/starters.md');
} else {
  console.log('starters.md is up to date');
}
