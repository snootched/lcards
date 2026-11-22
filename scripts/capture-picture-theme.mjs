#!/usr/bin/env node
/**
 * capture-picture-theme.mjs - save the dev Home Assistant's current theme as the
 * theme the generated pictures are rendered in (scripts/data/picture-theme.json).
 *
 *   npm run pictures:theme
 *
 * Opens a dashboard of the dev Home Assistant (HA_URL, the token in $HA_TOKEN or
 * .ha-token, as the Layer C tests) and reads the theme variables Home Assistant puts
 * on the page (inline on <html>: the selected theme, resolved), its colours only. The Astrometrics
 * Studio's pictures (scripts/astro-pictures.mjs) and the card picker pictures
 * (scripts/picker-pictures.mjs) apply them, so the pictures don't depend on the theme
 * the harness happens to have, and look the same on every re-render. Pick the theme
 * in the dev Home Assistant (profile), run this, then the two picture scripts.
 */
import { writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { HA_URL, TEST_DASHBOARD, readToken } from '../tests/ha/ha-client.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'scripts/data/picture-theme.json');

const TOKEN = readToken();
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium' });
try {
    const page = await browser.newPage();
    await page.addInitScript(({ token, hassUrl }) => localStorage.setItem('hassTokens', JSON.stringify({
        access_token: token, token_type: 'Bearer', expires_in: 1e9, hassUrl,
        clientId: `${hassUrl}/`, expires: Date.now() + 1e12, refresh_token: '',
    })), { token: TOKEN, hassUrl: HA_URL });
    await page.goto(`${HA_URL}/${TEST_DASHBOARD}`);
    await page.waitForFunction(() => !!document.querySelector('home-assistant')?.hass?.themes, null, { timeout: 30_000 });
    await page.waitForTimeout(2000);
    const theme = await page.evaluate(() => {
        const hass = /** @type {any} */ (document.querySelector('home-assistant')).hass;
        const root = document.documentElement;
        /** @type {Record<string, string>} */
        const vars = {};
        for (let i = 0; i < root.style.length; i++) {
            const name = root.style[i];
            if (name.startsWith('--')) vars[name.slice(2)] = root.style.getPropertyValue(name).trim();
        }
        return { name: hass.themes.theme, dark: !!hass.themes.darkMode, vars };
    });
    // colours only: the pictures need nothing else (sizes, fonts and timings would
    // only make the file large)
    const isColourName = (/** @type {string} */ n) => /^(lcars-|lcards-|rgb-)/.test(n) || /(^|-)colou?r(-|$)/.test(n);
    const isColourValue = (/** @type {string} */ v) => /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|color-mix\(|var\(|^transparent$|^[a-z]+$/i.test(v);
    theme.vars = Object.fromEntries(Object.entries(theme.vars).filter(([n, v]) => isColourName(n) && isColourValue(v)));
    const count = Object.keys(theme.vars).length;
    if (!count) throw new Error('no theme variables on the page: is a theme selected in the dev Home Assistant?');
    writeFileSync(OUT, `${JSON.stringify({
        $comment: 'The theme the generated pictures are rendered in (npm run pictures:theme reads it from the dev Home Assistant). Applied by scripts/astro-pictures.mjs and scripts/picker-pictures.mjs.',
        name: theme.name,
        dark: theme.dark,
        captured: new Date().toISOString().slice(0, 10),
        vars: Object.fromEntries(Object.entries(theme.vars).sort(([a], [b]) => a.localeCompare(b))),
    }, null, 2)}\n`);
    console.log(`${theme.name}${theme.dark ? ' (dark)' : ''}: ${count} variables -> ${OUT}`);
} finally {
    await browser.close();
}
