#!/usr/bin/env node
// Print a link to the LCARdS docs' "Preview Your YAML" page with this YAML inside it.
// The YAML rides in the link's #hash, which browsers never send to a server.
//
//   node scripts/lcards-preview-link.mjs <file.yaml>     (or - for standard input)
//
// Format: #yaml= + base64url(raw deflate(UTF-8 YAML)), no padding. The same as the
// Python in SKILL.md and the docs page's own reader (doc/.vitepress/theme/preview-link.js).
import { readFileSync } from 'node:fs';
import { deflateRawSync } from 'node:zlib';

const PREVIEW_URL = '__PREVIEW_URL__';

const file = process.argv[2];
if (!file) {
  console.error('usage: node lcards-preview-link.mjs <file.yaml | ->');
  process.exit(2);
}
const yaml = readFileSync(file === '-' ? 0 : file, 'utf8');
const packed = deflateRawSync(Buffer.from(yaml, 'utf8'), { level: 9 }).toString('base64url');
const url = `${PREVIEW_URL}#yaml=${packed}`;
console.log(url);
if (url.length > 60000) console.error(`Note: the link is ${url.length} characters; some chat apps cut links this long. Offer the YAML to paste on ${PREVIEW_URL} too.`);
