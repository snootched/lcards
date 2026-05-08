/**
 * @fileoverview Borg Font Assimilation — injects Borg font override on the document root.
 *
 * Overrides `--lcars-font` and `--lcars-fallback-font` on `:root` so all LCARS
 * text system-wide switches to the `lcards_borg` typeface.  The font is loaded
 * on-demand via `AssetManager.loadFont()` before injection.
 *
 * Reverts cleanly by removing the injected `<style>` tag — no DOM state leaks.
 *
 * @module core/themes/borgFontAssimilation
 */

import { lcardsLog } from '../../utils/lcards-logging.js';

const BORG_FONT_STYLE_ID = 'lcards-borg-font-override';

/**
 * Load `lcards_borg` via AssetManager and inject a `<style>` tag that overrides
 * the two authoritative HA-LCARS font CSS variables on `:root`.
 *
 * Idempotent — safe to call multiple times; only one `<style>` tag is ever added.
 *
 * @returns {Promise<void>}
 */
export async function injectBorgFont() {
    // Ensure the font stylesheet is loaded into the document before overriding.
    await window.lcards?.core?.assetManager?.loadFont('lcards_borg');

    if (document.getElementById(BORG_FONT_STYLE_ID)) {
        lcardsLog.debug('[BorgFont] Font override already active — skipping duplicate injection');
        return;
    }

    const style = document.createElement('style');
    style.id = BORG_FONT_STYLE_ID;
    // Override the two canonical HA-LCARS font variables.
    // `--lcars-font` is the primary variable used throughout all LCARS card text;
    // `--lcars-fallback-font` is the secondary cascade fallback.
    // `!important` is required here — HA theme stylesheets have high specificity
    // and would otherwise win over :root overrides without it.
    style.textContent = `
        :root {
            --lcars-font:          'lcards_borg', monospace !important;
            --lcars-fallback-font: 'lcards_borg', monospace !important;
        }
    `;
    document.head.appendChild(style);
    lcardsLog.info('[BorgFont] Borg font assimilation injected — resistance is futile');
}

/**
 * Remove the Borg font override, immediately restoring whatever the active
 * HA-LCARS theme previously defined for `--lcars-font`.
 */
export function revertBorgFont() {
    const el = document.getElementById(BORG_FONT_STYLE_ID);
    if (el) {
        el.remove();
        lcardsLog.info('[BorgFont] Borg font reverted — systems restored');
    }
}
