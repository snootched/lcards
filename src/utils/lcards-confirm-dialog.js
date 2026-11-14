/**
 * @fileoverview A Home Assistant style confirmation dialog, for cards and editors.
 *
 * Built like Home Assistant's own dialog box (frontend
 * src/dialogs/generic/dialog-box.ts): `ha-dialog` with `headerTitle`, the text,
 * and HA's `ha-dialog-footer` with a dismiss and a confirm button. A
 * destructive confirm uses `variant="danger"` and focuses Cancel; otherwise
 * the confirm button is `brand` and has the focus. Mounted inside
 * `<home-assistant>` so Home Assistant's contexts reach it.
 */

import { createDialogFooter, mountDialogNearHomeAssistant } from './lcards-shared-helpers.js';

/**
 * Ask the user to confirm.
 * @param {object} opts
 * @param {string} [opts.title] - Dialog heading (none when left out, as Home Assistant's)
 * @param {string} opts.message - Body text
 * @param {string} [opts.confirmText='OK'] - Confirm button label
 * @param {string} [opts.dismissText='Cancel'] - Dismiss button label
 * @param {boolean} [opts.destructive=false] - Danger button, Cancel focused
 * @param {Element} [opts.startEl] - Where to look for the home-assistant root (a card in a portal)
 * @returns {Promise<boolean>} true when confirmed; false on cancel, Esc or the scrim
 */
export function showConfirmDialog({ title, message, confirmText = 'OK', dismissText = 'Cancel', destructive = false, startEl }) {
    return new Promise((resolve) => {
        let settled = false;
        const finish = (/** @type {boolean} */ result) => {
            if (settled) return;
            settled = true;
            resolve(result);
        };
        const dialog = document.createElement('ha-dialog');
        if (title) dialog.headerTitle = title;
        dialog.open = true;

        const content = document.createElement('div');
        content.textContent = message;
        content.style.padding = 'var(--ha-space-4)';
        content.style.lineHeight = '1.5';
        content.style.maxWidth = '360px';
        dialog.appendChild(content);

        const cancelButton = document.createElement('ha-button');
        cancelButton.textContent = dismissText;
        cancelButton.setAttribute('appearance', 'plain');
        cancelButton.autofocus = destructive;
        cancelButton.addEventListener('click', () => {
            dialog.open = false;
            finish(false);
        });

        const confirmButton = document.createElement('ha-button');
        confirmButton.textContent = confirmText;
        confirmButton.setAttribute('variant', destructive ? 'danger' : 'brand');
        confirmButton.autofocus = !destructive;
        confirmButton.addEventListener('click', () => {
            dialog.open = false;
            finish(true);
        });

        dialog.appendChild(createDialogFooter({ secondary: [cancelButton], primary: [confirmButton] }));

        // Dismissed without choosing (Esc / scrim): not confirmed.
        dialog.addEventListener('closed', () => {
            dialog.remove();
            finish(false);
        });

        mountDialogNearHomeAssistant(dialog, startEl);
    });
}
