/**
 * Resolves animation targets given a selector, element, object, or array of these.
 * @param {string|object|Element|Array} targets - Selector, element, object, or array.
 * @param {Element|ShadowRoot|Document} root - The root to search within.
 * @returns {Element[]} Array of found elements (may be empty).
 */
export function resolveAnimationTargets(targets, root = document) {
  const out = [];
  const searchRoot = /** @type {any} */ (root).shadowRoot || root || document;
  (Array.isArray(targets) ? targets : [targets]).forEach(t => {
    if (typeof t === 'string') {
      out.push(...searchRoot.querySelectorAll(t));
    } else if (t instanceof Element) {
      out.push(t);
    }
  });
  return out;
}

/**
 * Walks up from an element through parent elements and shadow-root host
 * boundaries to find the `<home-assistant>` root element.
 *
 * HA's own dialog manager (and its Lit `@consume`/`ContextProvider` context
 * tree for things like `ha-entity-picker`) is rooted on the single
 * `<home-assistant>` element's shadow root. Full-screen editor dialogs that
 * are appended to `document.body` end up as DOM *siblings* of
 * `<home-assistant>` rather than descendants, which silently breaks any HA
 * component relying on `@consume` context (props still work fine). Mounting
 * such a dialog into `homeAssistantEl.shadowRoot` instead — mirroring HA's
 * own `make-dialog-manager.ts` — keeps it in the same composed subtree so
 * context resolves normally.
 * @param {Element|null} startEl - Element to start searching from (e.g. `this` in a Lit component).
 * @returns {Element|null} The `<home-assistant>` element, or null if not found.
 */
export function findHomeAssistantRoot(startEl) {
  let element = startEl;
  while (element) {
    if (element.tagName === 'HOME-ASSISTANT') {
      return element;
    }
    if (element.assignedSlot) {
      element = element.assignedSlot;
    } else if (element.parentElement) {
      element = element.parentElement;
    } else {
      const root = element.getRootNode();
      element = root instanceof ShadowRoot ? root.host : null;
    }
  }
  return null;
}

/**
 * Appends a dialog element into the same composed subtree as `<home-assistant>`
 * (its shadow root) so Lit context-consuming HA components work inside it.
 * Falls back to `document.body` if `<home-assistant>` can't be found.
 * @param {Element} dialogEl - The dialog element to mount.
 * @param {Element} startEl - Element to start the `<home-assistant>` search from.
 */
export function mountDialogNearHomeAssistant(dialogEl, startEl) {
  const haRoot = findHomeAssistantRoot(startEl);
  const mountRoot = haRoot?.shadowRoot ?? document.body;
  mountRoot.appendChild(dialogEl);
}
