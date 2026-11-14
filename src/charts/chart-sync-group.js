/**
 * Chart cards linked by `sync_group`: a time cursor shared by every member.
 *
 * ApexCharts' own group (chart.group) syncs tooltips, crosshair and zoom, but
 * only between charts that are not timelines and show the same time window
 * (step 0 spike, 2026-11-13). On top of it, hovering any member publishes the
 * time under the pointer here, and every other member draws a cursor line at
 * that time (timelines and charts with other windows too), unless ApexCharts
 * already draws its crosshair there.
 *
 * Times are the charts' own x values: wall-clock ms in Home Assistant's zone
 * (chart-time-labels.js), the same for every card on a dashboard.
 *
 * @module charts/chart-sync-group
 */

/**
 * @typedef {Object} SyncMember
 * @property {(time: number|null, source: SyncMember) => void} showTime - draw (or hide, null) the cursor
 * @property {() => {min: number, max: number}|null} window - the member's plotted x range now (ApexCharts' own)
 * @property {() => boolean} apexSynced - in ApexCharts' own group (not a timeline)
 */

/** @type {Map<string, Set<SyncMember>>} */
const groups = new Map();

/**
 * Join a group; returns the function that leaves it.
 * @param {string} group
 * @param {SyncMember} member
 * @returns {() => void}
 */
export function joinSyncGroup(group, member) {
  let set = groups.get(group);
  if (!set) groups.set(group, (set = new Set()));
  set.add(member);
  return () => {
    set.delete(member);
    if (!set.size) groups.delete(group);
  };
}

/**
 * Tell the other members of a group the time under the pointer (null: the
 * pointer left).
 * @param {string} group
 * @param {SyncMember} source
 * @param {number|null} time
 */
export function publishSyncTime(group, source, time) {
  for (const member of groups.get(group) ?? []) {
    if (member !== source) member.showTime(time, source);
  }
}

/**
 * ApexCharts syncs a group member only when its x range is exactly the
 * source's (Tooltip.js: minX === and maxX ===).
 * @param {{min: number, max: number}|null} a
 * @param {{min: number, max: number}|null} b
 */
const sameWindow = (a, b) => !!a && !!b && a.min === b.min && a.max === b.max;

/**
 * Whether ApexCharts already shows this time on the member (its own group
 * syncs only non-timeline charts with the same window): then no LCARdS cursor.
 * @param {SyncMember} member
 * @param {SyncMember} source
 * @returns {boolean}
 */
export function apexShowsCursor(member, source) {
  return member.apexSynced() && source.apexSynced() && sameWindow(member.window(), source.window());
}

/**
 * The time at a pointer position over a plot.
 * @param {number} x - Pointer x relative to the plot's left edge, px
 * @param {number} width - Plot width, px
 * @param {{min: number, max: number}} window
 * @returns {number|null} null outside the plot
 */
export function timeAtX(x, width, window) {
  if (!(width > 0) || x < 0 || x > width) return null;
  return window.min + (x / width) * (window.max - window.min);
}

/**
 * Where a time sits across a plot, px from its left edge.
 * @param {number} time
 * @param {number} width
 * @param {{min: number, max: number}} window
 * @returns {number|null} null outside the window
 */
export function xAtTime(time, width, window) {
  if (!(window.max > window.min) || time < window.min || time > window.max) return null;
  return ((time - window.min) / (window.max - window.min)) * width;
}

/** For tests: forget every group. */
export function resetSyncGroups() {
  groups.clear();
}
