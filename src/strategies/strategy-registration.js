/**
 * @fileoverview Main-chunk registration of the strategies whose generators load
 * lazily: the Picard shell dashboard strategy and the LCARS section strategies.
 *
 * Home Assistant waits at most 5 s for a strategy element, so the elements are
 * defined at module top level (lcards-main.js); it awaits generate(),
 * getStubConfig() and getConfigElement(), so those import their module on first use
 * and the main chunk carries only these small classes.
 */

import { docsUrl, DOCS } from '../utils/docs-url.js';
import { LCARS_SECTION_CATALOG } from './strategy-catalog.js';

const sections = () => import('./lcards-section-strategies.js');

/** The Picard shell (custom:lcars-shell-picard): the same settings form as the v1 shell. */
export class LCARdSShellPicardDashboardStrategy extends HTMLElement {
    static configRequired = true;

    static getCreateSuggestions(_hass) {
        return { title: 'LCARS', icon: 'mdi:view-dashboard-variant' };
    }

    static getConfigElement() {
        return document.createElement('lcards-shell-strategy-editor');
    }

    /** @param {any} config @param {any} hass */
    static async generate(config, hass) {
        const { LCARdSShellPicardDashboardStrategy: Strategy } = await import('./lcards-shell-picard-strategy.js');
        return Strategy.generate(config, hass);
    }
}

/**
 * The strategy class for one LCARS section kind.
 * @param {string} key
 */
function sectionStrategyClass(key) {
    return class extends HTMLElement {
        static registryDependencies = /** @type {const} */ (['entities', 'devices', 'areas', 'floors', 'labels']);

        static async getConfigElement() {
            (await sections()).defineSectionEditor();
            return document.createElement('lcards-section-strategy-editor');
        }

        /** The new section's start, and the preview in the chooser. @param {any} hass */
        static async getStubConfig(hass) {
            return (await sections()).sectionStubConfig(key, hass);
        }

        /** @param {any} config @param {any} hass */
        static async generate(config, hass) {
            return (await sections()).generateLcarsSection(key, config, hass);
        }
    };
}

/** Define the section strategy elements and list them in Home Assistant's chooser. Call at module top level. */
export function registerLcarsSections() {
    const w = /** @type {any} */ (window);
    w.customStrategies = w.customStrategies || [];
    for (const [key, { name, description }] of Object.entries(LCARS_SECTION_CATALOG)) {
        const tag = `ll-strategy-section-${key}`;
        if (!customElements.get(tag)) customElements.define(tag, sectionStrategyClass(key));
        if (!w.customStrategies.some((/** @type {any} */ s) => s.type === key && s.strategyType === 'section')) {
            w.customStrategies.push({ type: key, strategyType: 'section', name, description, documentationURL: docsUrl(`${DOCS.sectionStrategies}#${key}`) });
        }
    }
}
