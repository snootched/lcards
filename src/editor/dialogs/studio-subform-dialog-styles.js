/**
 * @fileoverview Studio Subform Dialog Shared Styles
 *
 * Chrome for nested "add/edit" dialogs that render on top of a Studio dialog
 * (e.g. MSD's line/control edit forms) — a smaller, tabbed, content+preview
 * split dialog, distinct from the top-level Studio chrome in
 * `studio-dialog-styles.js`.
 *
 * CSS-only, same convention as `studio-dialog-styles.js`: these forms already
 * live in the host's shadow root and share its state/methods directly, so a
 * wrapper component would only add slot/prop plumbing without a real benefit.
 *
 * Class names are deliberately distinct from the top-level Studio classes
 * (`.subform-*` vs `.config-panel`/`.preview-panel`/`.tab-content`) since a
 * subform dialog and its parent Studio dialog render into the same shadow
 * root — reusing the parent's class names would collide with its
 * `querySelector('.preview-panel')`-based canvas interaction code.
 *
 * Usage:
 * ```javascript
 * import { studioSubformDialogStyles } from '../dialogs/studio-subform-dialog-styles.js';
 *
 * static get styles() {
 *     return [editorStyles, studioDialogStyles, studioSubformDialogStyles, ...];
 * }
 * ```
 */
import { css } from 'lit';

export const studioSubformDialogStyles = css`
    /* Dialog sizing - canonical subform size, adopted from the line-edit form */
    .subform-dialog {
        --ha-dialog-width-md: 90vw;
        --ha-dialog-min-height: 80vh;
        --ha-dialog-max-height: 80vh;
    }

    /* Split Layout: config content (left) + live preview (right) */
    .subform-layout {
        display: grid;
        grid-template-columns: 70% 30%;
        height: 70vh;
        overflow: hidden;
    }

    .subform-config {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-right: var(--ha-border-width-md) solid var(--divider-color);
    }

    .subform-tabs {
        padding: 0 var(--ha-space-4);
        flex-shrink: 0;
    }

    .subform-tab-content {
        flex: 1;
        overflow-y: auto;
        padding: var(--ha-space-4);
    }

    .subform-preview {
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    /* Modifier for previews that are bare content (e.g. an SVG) needing the
       panel itself to supply background/padding - the line-edit form's case. */
    .subform-preview.padded {
        padding: var(--ha-space-4);
        background: var(--secondary-background-color);
    }

    /* Modifier for forms whose preview should stay in view while the config
       column scrolls (e.g. the control-edit form) rather than matching the
       line-edit form's fixed-height side-by-side split. Its preview content
       already boxes itself (background/border/padding), so this modifier
       intentionally does not add its own padding/background. */
    .subform-preview.sticky {
        overflow-y: auto;
        position: sticky;
        top: 0;
        height: fit-content;
    }

    .subform-preview-label {
        font-size: var(--ha-font-size-m);
        font-weight: 600;
        margin-bottom: var(--ha-space-3);
        color: var(--primary-text-color);
    }

    /* Wraps a live card preview (card editor sub-form, and the control form's
       own card preview) - background matches HA's own .element-preview
       treatment in hui-dialog-edit-card; padding is more generous than HA's
       (4px) since a small padded card reads as cramped inside Studio's larger
       preview panes. Shared by both preview surfaces so they look consistent
       with each other, not just with HA. Distinct from .subform-preview.padded's
       --secondary-background-color (used by the line editor's SVG canvas),
       which should not change. */
    .card-editor-preview-surface {
        background: var(--primary-background-color);
        padding: var(--ha-space-6);
        border-radius: var(--ha-border-radius-md);
    }

    /* Vertical stack of fields with consistent spacing - replaces the
       repeated inline style="display:flex;flex-direction:column;gap:16px"
       (and per-field style="margin-top:12px") pattern in subform tab content */
    .subform-field-stack {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-4);
    }

    .subform-field-stack > * {
        margin-top: 0;
    }

    /* Two-column layout for subform tab content (distinct from editorStyles'
       .form-row.two-controls, which is sized/spaced for compact config-panel
       field rows rather than a pair of full lcards-form-section blocks) */
    .subform-columns-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--ha-space-4);
        align-items: start;
    }

    /* A primary control with a secondary control stacked below it (e.g. a
       position picker paired with a small numeric gap input) - distinct
       from editorStyles' .form-row.two-controls (even 50/50 split). Always
       stacked, not side-by-side: this only ever appears inside a
       .connection-source/.connection-target column (already squeezed to
       ~1/3 of the dialog width by .line-connection-flow's 3-column grid),
       where a fixed 120px second column routinely overflowed past the
       picker's own minimum width. */
    .subform-row-aside {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--ha-space-3);
        align-items: start;
    }

    @media (max-width: 1024px) {
        .subform-layout {
            grid-template-columns: 1fr;
            height: auto;
        }

        .subform-config {
            border-right: none;
            border-bottom: var(--ha-border-width-md) solid var(--divider-color);
        }

        .subform-columns-2 {
            grid-template-columns: 1fr;
        }
    }
`;
