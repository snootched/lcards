/**
 * @fileoverview The picture a card shows as its tile in Home Assistant's card picker
 * when it can't draw a live preview there (a WebGL scene, a blueprint with routed
 * lines, child cards, a full-screen overlay, a chart with no history): a real render
 * of the card, made by scripts/picker-pictures.mjs and shipped with the bundle
 * (/lcards/images/picker/<name>.webp, fetched only when the picker shows the tile).
 */

import { html } from 'lit';
import { bundleUrl } from './bundle-url.js';
import { PICKER_PICTURES } from './picker-picture-names.js';

export { PICKER_PICTURES };

/**
 * The picture's URL, from wherever the bundle was loaded.
 * @param {string} name - one of PICKER_PICTURES
 * @returns {string}
 */
export function pickerPictureUrl(name) {
    return bundleUrl(`/lcards/images/picker/${name}.webp`);
}

/**
 * The picker tile: the picture, full width at 16:9, with the card's rounded corners.
 * @param {string} name - one of PICKER_PICTURES
 * @param {string} alt - what the picture shows
 */
export function renderPickerPicture(name, alt) {
    return html`<img
        class="lcards-picker-picture"
        src=${pickerPictureUrl(name)}
        alt=${alt}
        loading="lazy"
        decoding="async"
        style="display:block;width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;border-radius:var(--ha-card-border-radius, var(--ha-border-radius-lg));">`;
}

/**
 * Whether an element sits in Home Assistant's card picker (through shadow roots), for
 * cards that don't extend LCARdSCard (its _checkForAncestor does the same).
 * @param {Element} el
 * @returns {boolean}
 */
export function inCardPicker(el) {
    /** @type {any} */
    let node = el;
    while (node) {
        if (node.tagName === 'HUI-CARD-PICKER') return true;
        node = node.parentNode ?? node.host ?? null;
    }
    return false;
}

/**
 * Let a card in the picker take its picture's height: a configured or stub height
 * (astrometrics' 400 px) and a stylesheet floor (the chart's 200 px) would otherwise
 * stretch the tile, and with it every tile in its row. Inline, so it beats both.
 * @param {HTMLElement} el - the card
 */
export function fitPickerHost(el) {
    el.style.setProperty('height', 'auto', 'important');
    el.style.setProperty('min-height', '0', 'important');
    el.style.removeProperty('max-height');
}
