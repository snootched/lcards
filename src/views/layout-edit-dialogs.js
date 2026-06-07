/**
 * @fileoverview Shared HA-style confirmation dialog for the layout editor.
 *
 * Uses the same imperative `ha-dialog` pattern as the rest of the codebase
 * (see lcards-msd-studio-dialog / lcards-color-section-v2): `headerTitle` for
 * the heading and a `slot="footer"` div holding the action buttons. The danger
 * action uses `variant="danger"`.
 */

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

        document.body.appendChild(dialog);
    });
}
