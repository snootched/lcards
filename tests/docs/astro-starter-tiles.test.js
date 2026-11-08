/**
 * The astrometrics Getting Started page's starter tiles (AstroStarterTiles):
 * each has the Studio's picture and links to a heading on the Starters page,
 * and every starter has a tile.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { starterSlug } from '../../doc/.vitepress/theme/astro-starter-tiles.js';

const ROOT = path.resolve(import.meta.dirname, '../..');
const page = fs.readFileSync(path.join(ROOT, 'doc/cards/astrometrics/start.md'), 'utf8');
const starters = fs.readFileSync(path.join(ROOT, 'doc/cards/astrometrics/starters.md'), 'utf8');
const tiles = [...page.matchAll(/\[\s*'([^']+)',\s*'([^']+)'/g)].map((m) => ({ id: m[1], title: m[2] }));
const headings = new Set([...starters.matchAll(/^###\s+(.+)$/gm)].map((m) => starterSlug(m[1])));

test('every tile has its picture and links to a starter heading', () => {
  assert.ok(tiles.length > 20);
  for (const { id, title } of tiles) {
    assert.ok(fs.existsSync(path.join(ROOT, `src/assets/images/astro-studio/starter-${id}.webp`)), `picture for ${id}`);
    assert.ok(headings.has(starterSlug(title)), `heading for ${title}`);
  }
});

test('every starter picture has a tile', () => {
  const ids = new Set(tiles.map((t) => t.id));
  const pictures = fs.readdirSync(path.join(ROOT, 'src/assets/images/astro-studio'))
    .filter((f) => f.startsWith('starter-')).map((f) => f.slice(8, -5));
  assert.deepEqual(pictures.filter((p) => !ids.has(p)), []);
});

test('slugs match VitePress for titles with punctuation', () => {
  assert.equal(starterSlug('Sky dome: the sun and moon'), 'sky-dome-the-sun-and-moon');
  assert.equal(starterSlug('Solar system (real positions)'), 'solar-system-real-positions');
  assert.equal(starterSlug('Star Trek: minor powers'), 'star-trek-minor-powers');
});
