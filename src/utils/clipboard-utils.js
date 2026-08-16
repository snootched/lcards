/**
 * @fileoverview Clipboard helpers shared across editor/panel components.
 * @module utils/clipboard-utils
 */

import { lcardsLog } from './lcards-logging.js';

/**
 * Copy text to the clipboard, falling back to the legacy execCommand path
 * when the async Clipboard API is unavailable (e.g. non-secure-context
 * HTTP access to HA, which both Chrome and Safari block on Mac).
 * @param {string} text
 * @returns {Promise<boolean>} whether the copy succeeded
 */
export async function copyTextToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      lcardsLog.warn('[ClipboardUtils] navigator.clipboard.writeText failed, falling back:', error);
    }
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (error) {
    lcardsLog.error('[ClipboardUtils] execCommand("copy") fallback failed:', error);
    return false;
  }
}
