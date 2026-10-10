/**
 * Install a jsdom browser environment on globalThis for node tests that need a
 * real `document` (theme activation, core init). Node-only: imports jsdom.
 *
 *   const env = installJsdom();
 *   ...
 *   env.restore();
 *
 * `window` is globalThis under tests/setup/browser-shims.js, so the window-level
 * APIs (event methods, history, location, sizes) are forwarded from jsdom too.
 */
import { JSDOM } from 'jsdom';

const GLOBALS = [
    'document', 'navigator', 'location', 'history', 'screen', 'localStorage', 'sessionStorage',
    'HTMLElement', 'HTMLCanvasElement', 'HTMLStyleElement', 'SVGElement', 'Element', 'Node',
    'DocumentFragment', 'ShadowRoot', 'customElements', 'CSSStyleSheet',
    'Event', 'CustomEvent', 'MutationObserver', 'DOMParser', 'XMLSerializer', 'Image',
    'getComputedStyle', 'matchMedia', 'innerWidth', 'innerHeight',
];
const BOUND = ['addEventListener', 'removeEventListener', 'dispatchEvent'];

export function installJsdom({ url = 'http://localhost:8123/' } = {}) {
    const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', { url, pretendToBeVisual: true });
    const saved = new Map();
    const set = (key, value) => {
        saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
        Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
    };
    for (const key of GLOBALS) if (dom.window[key] !== undefined) set(key, dom.window[key]);
    for (const key of BOUND) set(key, dom.window[key].bind(dom.window));
    return {
        dom,
        restore() {
            for (const [key, desc] of saved) {
                if (desc) Object.defineProperty(globalThis, key, desc);
                else delete globalThis[key];
            }
            dom.window.close();
        },
    };
}
