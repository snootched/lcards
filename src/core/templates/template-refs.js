/**
 * @fileoverview What a template refers to: the entities (the card's own, others
 * by ID in tokens, JavaScript and Jinja2), data sources, theme tokens and
 * variables. Used for template provenance (cards) and by the editor's
 * Templates tab and sandbox.
 *
 * @module core/templates/template-refs
 */

import { TemplateParser } from './TemplateParser.js';

/**
 * What a template refers to.
 * @param {string} template
 * @param {Object} [opts]
 * @param {string} [opts.entityId] - The card's entity (what `entity` means)
 * @returns {{entities: string[], datasources: string[], themeTokens: string[], variables: string[], usesEntity: boolean}}
 */
export function templateRefs(template, { entityId } = {}) {
    const text = String(template ?? '');
    const entities = new Set();
    const datasources = new Set();
    const themeTokens = new Set();
    const variables = new Set();

    const usesEntity = /\{entity\.|\bentity\s*[.?[]/.test(text);
    if (usesEntity && entityId) entities.add(entityId);
    for (const m of text.matchAll(/\{states\.([a-z_]+)\.([a-z0-9_]+)\./gi)) entities.add(`${m[1]}.${m[2]}`);
    for (const m of text.matchAll(/states\[\s*['"]([a-z_]+\.[a-z0-9_]+)['"]\s*\]/gi)) entities.add(m[1]);
    for (const id of TemplateParser.extractJinja2Entities(text)) entities.add(id);
    for (const m of text.matchAll(/\{(?:datasource|ds):([a-z0-9_]+)/gi)) datasources.add(m[1]);
    for (const m of text.matchAll(/\{theme:([^}]+)\}/g)) themeTokens.add(m[1].trim());
    for (const m of text.matchAll(/\bvariables\.([a-z_][\w]*)/gi)) variables.add(m[1]);

    return {
        entities: [...entities],
        datasources: [...datasources],
        themeTokens: [...themeTokens],
        variables: [...variables],
        usesEntity,
    };
}

