/**
 * @fileoverview Shared HA-style confirmation dialog for the layout editor.
 *
 * Uses the same imperative `ha-dialog` pattern as the rest of the codebase
 * (see lcards-msd-studio-dialog / lcards-color-section-v2): `headerTitle` for
 * the heading and a `slot="footer"` div holding the action buttons. The danger
 * action uses `variant="danger"`.
 */

import { mountDialogNearHomeAssistant } from '../utils/lcards-shared-helpers.js';

/**
 * Show a destructive-action confirmation dialog.
 * @param {object} opts
 * @param {string} opts.title       Dialog heading.
 * @param {string} opts.message     Body text.
 * @param {string} [opts.confirmText='Delete']  Label for the danger button.
 * @returns {Promise<boolean>} Resolves true when the user confirms, false otherwise.
 */
export function showConfirmDeleteDialog({ title, message, confirmText = 'Delete' }) {
    return new Promise((resolve) => {
        const dialog = document.createElement('ha-dialog');
        // @ts-ignore - ha-dialog properties not in HTMLElement type
        dialog.headerTitle = title;
        // @ts-ignore - ha-dialog properties not in HTMLElement type
        dialog.open = true;

        const content = document.createElement('div');
        content.textContent = message;
        content.style.padding = '16px';
        content.style.lineHeight = '1.5';
        content.style.maxWidth = '360px';
        dialog.appendChild(content);

        const cancelButton = document.createElement('ha-button');
        cancelButton.textContent = 'Cancel';
        cancelButton.setAttribute('appearance', 'plain');
        cancelButton.addEventListener('click', () => {
            // @ts-ignore - ha-dialog properties not in HTMLElement type
            dialog.open = false;
            resolve(false);
        });

        const confirmButton = document.createElement('ha-button');
        confirmButton.textContent = confirmText;
        confirmButton.setAttribute('variant', 'danger');
        confirmButton.addEventListener('click', () => {
            // @ts-ignore - ha-dialog properties not in HTMLElement type
            dialog.open = false;
            resolve(true);
        });

        const footerDiv = document.createElement('div');
        footerDiv.slot = 'footer';
        footerDiv.appendChild(cancelButton);
        footerDiv.appendChild(confirmButton);
        dialog.appendChild(footerDiv);

        // Resolve false if the dialog is dismissed without choosing (Esc / scrim).
        dialog.addEventListener('closed', () => {
            dialog.remove();
            resolve(false);
        });

        mountDialogNearHomeAssistant(dialog);
    });
}

/**
 * Show a simple informational HA dialog with a single OK button.
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} opts.message
 * @returns {Promise<void>}
 */
export function showInfoDialog({ title, message }) {
    return new Promise((resolve) => {
        const dialog = document.createElement('ha-dialog');
        // @ts-ignore - ha-dialog properties not in HTMLElement type
        dialog.headerTitle = title;
        // @ts-ignore - ha-dialog properties not in HTMLElement type
        dialog.open = true;

        const content = document.createElement('div');
        content.textContent = message;
        content.style.padding = '16px';
        content.style.lineHeight = '1.5';
        content.style.maxWidth = '380px';
        dialog.appendChild(content);

        const okButton = document.createElement('ha-button');
        okButton.textContent = 'OK';
        okButton.setAttribute('slot', 'footer');
        okButton.setAttribute('variant', 'brand');
        okButton.addEventListener('click', () => {
            // @ts-ignore - ha-dialog properties not in HTMLElement type
            dialog.open = false;
        });
        dialog.appendChild(okButton);

        dialog.addEventListener('closed', () => {
            dialog.remove();
            resolve();
        });

        mountDialogNearHomeAssistant(dialog);
    });
}

/**
 * Ask for one line of text in an HA dialog (instead of the browser's prompt()).
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} [opts.message] - Text above the field
 * @param {string} [opts.label] - Field label
 * @param {string} [opts.value] - Initial value
 * @param {string} [opts.confirmText='OK']
 * @returns {Promise<string|null>} The trimmed text, or null when cancelled or empty.
 */
export function showPromptDialog({ title, message = '', label = '', value = '', confirmText = 'OK' }) {
    return new Promise((resolve) => {
        let settled = false;
        const finish = (result) => {
            if (settled) return;
            settled = true;
            resolve(result);
        };
        const dialog = document.createElement('ha-dialog');
        // @ts-ignore - ha-dialog properties not in HTMLElement type
        dialog.headerTitle = title;
        // @ts-ignore - ha-dialog properties not in HTMLElement type
        dialog.open = true;

        const content = document.createElement('div');
        content.style.padding = '16px';
        content.style.display = 'grid';
        content.style.gap = '12px';
        content.style.minWidth = '320px';
        if (message) {
            const text = document.createElement('div');
            text.textContent = message;
            text.style.lineHeight = '1.5';
            content.appendChild(text);
        }
        const input = document.createElement('ha-input');
        // @ts-ignore - ha-input properties not in HTMLElement type
        input.label = label;
        // @ts-ignore
        input.value = value;
        content.appendChild(input);
        dialog.appendChild(content);

        const submit = () => {
            // @ts-ignore
            const text = String(input.value ?? '').trim();
            // @ts-ignore
            dialog.open = false;
            finish(text || null);
        };
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });

        const cancelButton = document.createElement('ha-button');
        cancelButton.textContent = 'Cancel';
        cancelButton.setAttribute('appearance', 'plain');
        cancelButton.addEventListener('click', () => {
            // @ts-ignore
            dialog.open = false;
            finish(null);
        });
        const okButton = document.createElement('ha-button');
        okButton.textContent = confirmText;
        okButton.setAttribute('variant', 'brand');
        okButton.addEventListener('click', submit);

        const footerDiv = document.createElement('div');
        footerDiv.slot = 'footer';
        footerDiv.appendChild(cancelButton);
        footerDiv.appendChild(okButton);
        dialog.appendChild(footerDiv);

        dialog.addEventListener('closed', () => {
            dialog.remove();
            finish(null);
        });

        mountDialogNearHomeAssistant(dialog);
        // @ts-ignore
        setTimeout(() => input.focus?.(), 50);
    });
}
