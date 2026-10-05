/**
 * @fileoverview LCARdS logging facade.
 *
 * Provides a single `lcardsLog` object with `error / warn / info / debug / trace`
 * methods gated by a global log level. The level is configurable at runtime via
 * `lcardsSetGlobalLogLevel()`, or from the HA developer console via
 * `window.lcards.setGlobalLogLevel('debug')`.
 *
 * @module utils/lcards-logging
 */

import * as LCARdS from '../lcards-vars.js';

const LOG_LEVEL_STORAGE_KEY = 'lcards-global-log-level';

function readStoredLogLevel() {
  try {
    return window.localStorage.getItem(LOG_LEVEL_STORAGE_KEY);
  } catch {
    return null;
  }
}

// Persisted across reloads (including a full HA restart) so a level set via
// `window.lcards.setGlobalLogLevel('debug')` survives long enough to catch
// startup-sequence logging, which is otherwise gone the instant the page
// reloads and this module re-initializes with the 'info' default.
let lcardsGlobalLogLevel = readStoredLogLevel() || 'info';

export function lcardsSetGlobalLogLevel(level) {
  const validLevels = ['error', 'warn', 'info', 'debug', 'trace'];
  if (!validLevels.includes(level)) {
    console.warn('🟡 LCARdS|WARN: Invalid log level:', level, 'Using "info" instead');
    level = 'info';
  }
  lcardsGlobalLogLevel = level;
  try {
    window.localStorage.setItem(LOG_LEVEL_STORAGE_KEY, level);
  } catch {
    // Best-effort only — private browsing / storage-blocked contexts just
    // won't persist the level across reloads.
  }
  console.log('🔵 LCARdS|INFO: Setting LCARdS global log level to:', level);
}
export function lcardsGetGlobalLogLevel() {
  return lcardsGlobalLogLevel;
}

// Ensure the lcards object exists on the window object
window.lcards = window.lcards || {};
// Attach the functions to the lcards object
window.lcards.setGlobalLogLevel = lcardsSetGlobalLogLevel;
window.lcards.getGlobalLogLevel = lcardsGetGlobalLogLevel;
// Add shortcut properties for each log level
['error', 'warn', 'info', 'debug', 'trace'].forEach(level => {
  window.lcards.setGlobalLogLevel[level] = () => lcardsSetGlobalLogLevel(level);
});


export function lcardsLogBanner() {
  let styles1 = [
      'color: white',
      'font-weight: bold',
      'padding: 2px 4px',
      'border-radius: 5em 5em 0 0', // Top left and right rounded, bottom left and right square
      'background-color: #37a6d1' // Blue
  ];

  let styles2 = [
      'color: white',
      'padding: 2px 4px',
      'border-radius: 0 0 5em 5em', // Top left and right square, bottom left and right rounded
      'background-color: #37a6d1' // Blue
  ];

  let invisibleStyle = [
      'color: transparent',
      'padding: 0',
      'border: none'
  ];

  const version = LCARdS.LCARdS_VERSION;
  const url = LCARdS.project_url;
  const baseString = "LCARdS v" + version;
  const padding = 4;

  // Calculate the total length including padding
  const totalLength = url.length + padding;
  const spacesNeeded = totalLength - baseString.length;

  // FIXED: Protect against negative repeat count
  const spaces = spacesNeeded > 0 ? ' '.repeat(spacesNeeded) : '';
  const paddedUrl = ' '.repeat(padding) + url;

  console.info(`%c${spaces}${baseString}  %c\n%c${paddedUrl}  `, styles1.join(';'), invisibleStyle.join(';'), styles2.join(';'));
}

/**
 * LCARdS Logging System
 *
 * RECOMMENDED USAGE:
 *   import { lcardsLog } from './utils/lcards-logging.js';
 *
 *   lcardsLog.error('[MyClass] Something failed:', error);    // ✅ Styled, ✅ Level filtered, ✅ Stack trace
 *   lcardsLog.warn('[MyClass] Deprecated usage detected');    // ✅ Styled, ✅ Level filtered, ✅ Stack trace
 *   lcardsLog.info('[MyClass] Processing started');           // ✅ Styled, ✅ Level filtered, use [Class] prefix
 *   lcardsLog.debug('[MyClass] Debug data:', data);           // ✅ Styled, ✅ Level filtered, use [Class] prefix
 *
 *
 * EMOTICON REFERENCE GUIDE:
 * Use these emoticons consistently across all panels for similar operations:
 *
 *   ⚠️  - Warnings (data capture failures, missing resources, deprecated usage)
 *   ❌  - Error conditions (not found, failed operations, critical failures)
 *   ✅  - Successful operations (completed tasks, enabled features)
 *   🔍  - Searching/inspection operations (looking for elements, analyzing)
 *   �  - Targeting/highlighting (selecting specific items, focus operations)
 *   🏷️  - Metadata/labeling (type information, tags, classifications)
 *   📊  - Data/statistics (counts, summaries, metrics, analysis results)
 *   📋  - Detailed information (lists, sources, comprehensive data)
 *   �  - Debug/development operations (troubleshooting, developer tools)
 *   �️  - Configuration/setup (enabling features, initialization)
 *   🔄  - Processing/modifications (transforms, patches, updates)
 *   🔗  - Connections/relationships (linking, mapping, associations)
 *   ♻️  - Refresh/reload operations (data refresh, interface updates)
 *   �  - Export/output operations (data export, file generation)
 *   �  - Import/download operations (file downloads, data ingestion)
 *   �  - Flags/features (feature toggles, debug flags)
 *   🚨  - Issues/alerts (problem detection, critical notifications)
 *   �  - Packages/collections (pack management, bundled resources)
 *   📈  - Trends/analytics (usage patterns, performance tracking)
 *   🎮  - Controls/interactions (UI controls, user input handling)
 *   �  - Styling/appearance (CSS operations, visual modifications)
 *   🔀  - Routing/navigation (path management, flow control)
 *   ⏱️  - Performance/timing (speed issues, duration tracking)
 *   �  - Scaling/sizing (dimension adjustments, zoom operations)
 *   🧹  - Cleanup/maintenance (clearing data, housekeeping)
 *   🚫  - Blocking/skipping (prevented operations, filtered out)
 *   🔢  - Counting/enumeration (numeric operations, indexing)
*/

const styleConfig = {
  commonStyles: 'color: white; padding: 2px 6px; border-radius: 15px; font-weight: bold;',
  levels: {
    info: 'background: linear-gradient(45deg, #37a6d1, #4db8e8);',
    warn: 'background: linear-gradient(45deg, #ff6753, #ff8570);',
    error: 'background: linear-gradient(45deg, #ef1d10, #ff453a);',
    debug: 'background: linear-gradient(45deg, #8e44ad, #a569bd);',
    trace: 'background: linear-gradient(45deg, #5a6c7d, #718a9e);'
  }
};

function shouldLog(level) {
  // Correct logging hierarchy: error (most critical) -> warn -> info -> debug -> trace (least critical)
  const levels = ['error', 'warn', 'info', 'debug', 'trace'];
  const levelPriority = {
    'error': 0,  // Always shown (highest priority)
    'warn': 1,   // Shown at warn level and above
    'info': 2,   // Shown at info level and above
    'debug': 3,  // Shown at debug level and above
    'trace': 4   // Only shown at trace level (lowest priority, most verbose)
  };

  const currentPriority = levelPriority[lcardsGlobalLogLevel] ?? 2; // Default to info
  const messagePriority = levelPriority[level] ?? 2;

  return messagePriority <= currentPriority;
}

function createStyleArgs(level, message, ...args) {
  return [
    `%c LCARdS|${level} `,
    `${styleConfig.levels[level]} ${styleConfig.commonStyles}`,
    message,
    ...args
  ];
}

// ─── Recent warnings/errors (support bundle) ─────────────────────────────────
// Captured regardless of the console log level so "Copy support info" can show
// what LCARdS complained about even when the user runs at level 'error'.
const RECENT_LOG_LIMIT = 25;
const RECENT_MSG_MAX = 300;
/** @type {{t: string, level: 'warn'|'error', message: string}[]} */
const _recentLogEntries = [];

function _stringifyLogPart(part) {
  if (part instanceof Error) return `${part.name}: ${part.message}`;
  if (typeof part === 'string') return part;
  try { return JSON.stringify(part); } catch { return String(part); }
}

function _recordRecent(level, message, args) {
  const text = [message, ...args].map(_stringifyLogPart).join(' ');
  _recentLogEntries.push({
    t: new Date().toISOString(),
    level,
    message: text.length > RECENT_MSG_MAX ? `${text.slice(0, RECENT_MSG_MAX)}…` : text,
  });
  if (_recentLogEntries.length > RECENT_LOG_LIMIT) _recentLogEntries.shift();
}

/**
 * The most recent LCARdS warnings and errors (oldest first), for support info.
 * @returns {{t: string, level: 'warn'|'error', message: string}[]}
 */
export function getRecentLogEntries() {
  return [..._recentLogEntries];
}

export function logError(message, ...args) {
  _recordRecent('error', message, args);
  if (shouldLog('error')) {
    console.error(...createStyleArgs('error', message, ...args));
  }
}

export function logWarn(message, ...args) {
  _recordRecent('warn', message, args);
  if (shouldLog('warn')) {
    console.warn(...createStyleArgs('warn', message, ...args));
  }
}

export function logInfo(message, ...args) {
  if (shouldLog('info')) {
    console.log(...createStyleArgs('info', message, ...args));
  }
}

export function logDebug(message, ...args) {
  if (shouldLog('debug')) {
    console.debug(...createStyleArgs('debug', message, ...args));
  }
}

export function logTrace(message, ...args) {
  if (shouldLog('trace')) {
    console.debug(...createStyleArgs('trace', message, ...args));
  }
}





/*
 * PRIMARY API - Dot notation logging (recommended approach)
 * Familiar console.* style API with level filtering and styling
 */
export const lcardsLog = {
  log: (...args) => logInfo(...args),
  info: (...args) => logInfo(...args),
  warn: (...args) => logWarn(...args),
  error: (...args) => logError(...args),
  debug: (...args) => logDebug(...args),
  trace: (...args) => logTrace(...args)
};

