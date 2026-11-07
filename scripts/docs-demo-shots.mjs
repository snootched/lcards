// Screenshot every live card demo on a docs page, one PNG each, to look at
// examples before they ship (the lcards-docs-writer skill).
//
//   node scripts/docs-demo-shots.mjs <outdir> <page path> [prefix] [--url http://127.0.0.1:5173]
//
// Needs a running docs server (`npm run docs:serve`, default port 5173). Prints
// each demo's index with the heading above it. Uses the GPU flags so 3D demos
// render as in a browser (SwiftShader otherwise).
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
const urlAt = args.indexOf('--url');
const base = urlAt >= 0 ? args.splice(urlAt, 2)[1] : 'http://127.0.0.1:5173';
const [out, path, prefix = 'demo'] = args;
if (!out || !path) {
  console.error('usage: node scripts/docs-demo-shots.mjs <outdir> <page path> [prefix] [--url <docs server>]');
  process.exit(1);
}

const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  args: ['--ignore-gpu-blocklist', '--enable-gpu', '--use-angle=vulkan', '--enable-features=Vulkan']
});
const page = await browser.newPage({ viewport: { width: 1300, height: 1000 } });
await page.goto(base + path);
await page.waitForTimeout(3000);
const demos = await page.locator('.card-demo-panel').all();
for (let i = 0; i < demos.length; i++) {
  await demos[i].scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
  const heading = await demos[i].evaluate((el) => {
    let n = el;
    while (n && !/^H[234]$/.test(n.tagName)) n = n.previousElementSibling || n.parentElement;
    return n?.textContent?.replace(/​/g, '').trim().slice(0, 40) ?? '';
  });
  await demos[i].screenshot({ path: `${out}/${prefix}-${i}.png` });
  console.log(i, heading);
}
await browser.close();
