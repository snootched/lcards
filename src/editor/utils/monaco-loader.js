/**
 * Monaco Loader Utility
 * 
 * Singleton pattern for loading Monaco Editor and monaco-yaml worker only once.
 * Handles dynamic imports, concurrent request queueing, and error handling.
 * 
 * Usage:
 * ```javascript
 * import { loadMonaco } from './monaco-loader.js';
 * 
 * const monaco = await loadMonaco();
 * if (monaco) {
 *   // Use monaco.editor, monaco.languages, etc.
 * }
 * ```
 * 
 * @module editor/utils/monaco-loader
 */

import { lcardsLog } from '../../utils/lcards-logging.js';

/**
 * Monaco loader state
 * @private
 */
let monacoLoadState = {
    loading: false,
    loaded: false,
    error: null,
    promise: null,
    monacoInstance: null,
    yamlWorker: null
};

/**
 * Queue of callbacks waiting for Monaco to load
 * @private
 */
const pendingCallbacks = [];

/**
 * Load Monaco Editor and monaco-yaml worker
 * 
 * This function uses a singleton pattern to ensure Monaco is loaded only once,
 * even if multiple components request it simultaneously.
 * 
 * @returns {Promise<Object|null>} Monaco instance with editor and yaml worker, or null on error
 * 
 * @example
 * const monaco = await loadMonaco();
 * if (monaco) {
 *   const editor = monaco.editor.create(container, options);
 *   monaco.yamlWorker.configureMonacoYaml(monaco, { ... });
 * }
 */
export async function loadMonaco() {
    // Return immediately if already loaded
    if (monacoLoadState.loaded && monacoLoadState.monacoInstance) {
        lcardsLog.debug('[MonacoLoader] Monaco already loaded, returning cached instance');
        return {
            editor: monacoLoadState.monacoInstance.editor,
            languages: monacoLoadState.monacoInstance.languages,
            yamlWorker: monacoLoadState.yamlWorker
        };
    }

    // Return error if previous load failed
    if (monacoLoadState.error) {
        lcardsLog.warn('[MonacoLoader] Previous load failed:', monacoLoadState.error);
        return null;
    }

    // If currently loading, queue this request
    if (monacoLoadState.loading && monacoLoadState.promise) {
        lcardsLog.debug('[MonacoLoader] Monaco loading in progress, queueing request');
        return monacoLoadState.promise;
    }

    // Start loading Monaco
    monacoLoadState.loading = true;
    monacoLoadState.promise = _performMonacoLoad();

    return monacoLoadState.promise;
}

/**
 * Check if Monaco is currently loaded
 * @returns {boolean} True if Monaco is loaded
 */
export function isMonacoLoaded() {
    return monacoLoadState.loaded && monacoLoadState.monacoInstance !== null;
}

/**
 * Get Monaco load error if any
 * @returns {Error|null} Load error or null
 */
export function getMonacoLoadError() {
    return monacoLoadState.error;
}

/**
 * Perform the actual Monaco loading
 * @private
 * @returns {Promise<Object|null>}
 */
async function _performMonacoLoad() {
    lcardsLog.info('[MonacoLoader] 🚀 Starting Monaco Editor dynamic import...');

    try {
        // Step 1: Load Monaco Editor core
        lcardsLog.debug('[MonacoLoader] Loading monaco-editor...');
        const monacoModule = await import('monaco-editor');
        
        if (!monacoModule || !monacoModule.editor) {
            throw new Error('Monaco Editor module loaded but editor API not found');
        }

        lcardsLog.debug('[MonacoLoader] ✅ Monaco Editor core loaded');

        // Step 2: Load monaco-yaml worker
        lcardsLog.debug('[MonacoLoader] Loading monaco-yaml...');
        const yamlModule = await import('monaco-yaml');
        
        if (!yamlModule || !yamlModule.configureMonacoYaml) {
            throw new Error('Monaco YAML module loaded but configureMonacoYaml not found');
        }

        lcardsLog.debug('[MonacoLoader] ✅ monaco-yaml worker loaded');

        // Store instances
        monacoLoadState.monacoInstance = monacoModule;
        monacoLoadState.yamlWorker = yamlModule;
        monacoLoadState.loaded = true;
        monacoLoadState.loading = false;
        monacoLoadState.error = null;

        lcardsLog.info('[MonacoLoader] ✅ Monaco Editor and YAML support loaded successfully');

        // Create result object
        const result = {
            editor: monacoModule.editor,
            languages: monacoModule.languages,
            yamlWorker: yamlModule
        };

        // Process any pending callbacks
        _processPendingCallbacks(result);

        return result;

    } catch (error) {
        lcardsLog.error('[MonacoLoader] ❌ Failed to load Monaco Editor:', error);
        
        monacoLoadState.loading = false;
        monacoLoadState.loaded = false;
        monacoLoadState.error = error;
        monacoLoadState.monacoInstance = null;
        monacoLoadState.yamlWorker = null;

        // Notify pending callbacks of failure
        _processPendingCallbacks(null);

        return null;
    }
}

/**
 * Process pending callbacks after load completes (success or failure)
 * @private
 * @param {Object|null} result - Monaco instance or null on error
 */
function _processPendingCallbacks(result) {
    if (pendingCallbacks.length === 0) {
        return;
    }

    lcardsLog.debug(`[MonacoLoader] Processing ${pendingCallbacks.length} pending callbacks`);

    while (pendingCallbacks.length > 0) {
        const callback = pendingCallbacks.shift();
        try {
            callback(result);
        } catch (error) {
            lcardsLog.error('[MonacoLoader] Error in pending callback:', error);
        }
    }
}

/**
 * Reset Monaco loader state (mainly for testing)
 * @private
 */
export function _resetMonacoLoader() {
    monacoLoadState = {
        loading: false,
        loaded: false,
        error: null,
        promise: null,
        monacoInstance: null,
        yamlWorker: null
    };
    pendingCallbacks.length = 0;
    lcardsLog.debug('[MonacoLoader] State reset');
}
