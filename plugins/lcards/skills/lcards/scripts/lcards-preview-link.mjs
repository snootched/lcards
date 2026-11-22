#!/usr/bin/env node
// Make a link to the LCARdS docs' "Preview Your YAML" page with this YAML inside it.
// The YAML rides in the link's #hash, which browsers never send to a server.
//
//   node scripts/lcards-preview-link.mjs <file.yaml> [--html <out.html>]   (- for standard input)
//
// Prints the link. With --html it also writes a small page that opens the preview: hand
// the user that file rather than retyping the link (a long link copied by hand breaks).
//
// Format: #yaml= + base64url(raw deflate(UTF-8 YAML)), no padding. The same as
// lcards-preview-link.py and the docs page's own reader (doc/.vitepress/theme/preview-link.js).
import { readFileSync, writeFileSync } from 'node:fs';
import { deflateRawSync } from 'node:zlib';

const PREVIEW_URL = 'https://lcards.unimatrix01.ca/getting-started/preview.html';

const args = process.argv.slice(2);
const h = args.indexOf('--html');
const html = h >= 0 ? args.splice(h, 2)[1] : null;
const file = args[0];
if (!file || (h >= 0 && !html)) {
  console.error('usage: node lcards-preview-link.mjs <file.yaml | -> [--html <out.html>]');
  process.exit(2);
}
const yaml = readFileSync(file === '-' ? 0 : file, 'utf8');
const packed = deflateRawSync(Buffer.from(yaml, 'utf8'), { level: 9 }).toString('base64url');
const url = `${PREVIEW_URL}#yaml=${packed}`;
console.log(url);
if (html) {
  // base64url and the page URL hold no characters HTML or JS need escaped.
  writeFileSync(html, `<!doctype html>
<meta charset="utf-8">
<title>LCARdS preview</title>
<p><a href="${url}">Open the LCARdS preview</a></p>
<script>location.replace(${JSON.stringify(url)})</script>
`);
  console.error(`Wrote ${html}: opening it shows the preview.`);
}
if (url.length > 60000) console.error(`Note: the link is ${url.length} characters; some chat apps cut links this long. Offer the YAML to paste on ${PREVIEW_URL} too.`);
