/**
 * @fileoverview The editors' one explainer: a collapsible info guide ("How X
 * works", references, tips, examples). An lcards-form-section with
 * variant="guide" (same header, icon and chevron as every section; dark, with
 * the theme's primary colour on border and header), closed by default.
 *
 * Body styles: `.info-guide-body` and friends in infoGuideStyles
 * (shared/info-guide-styles.js), included in editorStyles. Body content can use
 * `.info-guide-example` (code), `.info-guide-tip`, `.info-guide-links` and
 * short lcards-message elements.
 *
 * When to use it (and when not): .github/instructions/editor.instructions.md,
 * "Dialogs, surfaces and messages".
 *
 * @module editor/components/shared/info-guide
 */

import { html } from 'lit';
import './lcards-form-section.js';

/**
 * @param {Object} opts
 * @param {string} opts.header - e.g. 'How actions work'
 * @param {import('lit').TemplateResult|string} opts.body
 * @param {string} [opts.icon='mdi:information-outline']
 * @param {boolean} [opts.open=false]
 * @param {string} [opts.id] - For tests and anchors
 * @returns {import('lit').TemplateResult}
 */
export function renderInfoGuide({ header, body, icon = 'mdi:information-outline', open = false, id = undefined }) {
    return html`
        <lcards-form-section
            variant="guide"
            class="info-guide"
            data-guide=${id ?? header}
            header=${header}
            icon=${icon}
            ?expanded=${open}
            outlined>
            <div class="info-guide-body">${body}</div>
        </lcards-form-section>
    `;
}
