/**
 * @fileoverview Ring buffer for rule evaluation trace history.
 *
 * Stores a rolling window of rule matching results for debugging and
 * HUD integration. Exposed globally at `window.__msdRuleTrace` for
 * browser console access.
 *
 * Console API:
 *   window.__msdRuleTrace.getRecent(50)         // last N traces
 *   window.__msdRuleTrace.getRuleHistory(ruleId) // history for one rule
 *   window.__msdRuleTrace.getStats()             // match rate + timing
 *   window.__msdRuleTrace.export({ format: 'csv' })
 *   window.__msdRuleTrace.clear()
 */

/**
 * Fixed-capacity ring buffer that records rule evaluation results.
 */
export class RuleTraceBuffer {
  /**
   * @param {number} [maxSize=1000] Maximum number of traces to retain.
   */
  constructor(maxSize = 1000) {
    this.buffer = [];
    this.maxSize = maxSize;
    this.index = 0;
    this.totalTraces = 0;
  }

  /**
   * Record a single rule evaluation result.
   * @param {string}  ruleId         - Rule identifier.
   * @param {boolean} matched        - Whether the rule conditions matched.
   * @param {Array}   conditions     - Evaluated condition snapshots.
   * @param {number}  evaluationTime - Time taken in milliseconds.
   * @param {Object}  [metadata={}]  - Arbitrary extra context.
   */
  addTrace(ruleId, matched, conditions, evaluationTime, metadata = {}) {
    const trace = {
      ruleId,
      matched,
      conditions,
      evaluationTime,
      timestamp: Date.now(),
      metadata: { ...metadata }
    };

    if (this.buffer.length < this.maxSize) {
      this.buffer.push(trace);
    } else {
      this.buffer[this.index] = trace;
      this.index = (this.index + 1) % this.maxSize;
    }

    this.totalTraces++;
  }

  /**
   * Return the most recent traces in chronological order.
   * @param {number} [limit=50]  Maximum number of traces to return.
   * @param {Object} [filter={}] Optional filter — supports `ruleId`, `matched`, `minTime`, `maxTime`, `minEvalTime`.
   * @returns {Array<Object>}
   */
  getRecentTraces(limit = 50, filter = {}) {
    const recent = [];
    let idx = this.index - 1;

    for (let i = 0; i < Math.min(limit, this.buffer.length); i++) {
      if (idx < 0) idx = this.buffer.length - 1;

      const trace = this.buffer[idx];
      if (this.matchesFilter(trace, filter)) {
        recent.unshift(trace);
      }

      idx--;
    }

    return recent;
  }

  /**
   * Return up to `limit` traces for a specific rule, most recent first.
   * @param {string} ruleId
   * @param {number} [limit=20]
   * @returns {Array<Object>}
   */
  getRuleHistory(ruleId, limit = 20) {
    return this.getRecentTraces(this.buffer.length, { ruleId }).slice(0, limit);
  }

  /**
   * Return matched traces within a recent time window.
   * @param {number} [timeWindow=60000] Lookback period in milliseconds.
   * @param {number} [limit=100]        Maximum results.
   * @returns {Array<Object>}
   */
  getMatchedRules(timeWindow = 60000, limit = 100) {
    const cutoff = Date.now() - timeWindow;
    return this.getRecentTraces(this.buffer.length, { matched: true })
      .filter(trace => trace.timestamp > cutoff)
      .slice(0, limit);
  }

  /**
   * Return aggregate statistics for the buffered traces.
   * @returns {{ totalTraces: number, bufferedTraces: number, recentMatched: number, recentTotal: number, matchRate: number, avgEvaluationTime: number }}
   */
  getStats() {
    const recent = this.getRecentTraces(this.buffer.length);
    const matched = recent.filter(t => t.matched).length;
    const avgEvalTime = recent.length > 0
      ? recent.reduce((sum, t) => sum + t.evaluationTime, 0) / recent.length
      : 0;

    return {
      totalTraces: this.totalTraces,
      bufferedTraces: this.buffer.length,
      recentMatched: matched,
      recentTotal: recent.length,
      matchRate: recent.length > 0 ? matched / recent.length : 0,
      avgEvaluationTime: avgEvalTime
    };
  }

  /**
   * Test whether a trace matches an ad-hoc filter object.
   * @param {Object} trace
   * @param {Object} filter
   * @returns {boolean}
   */
  matchesFilter(trace, filter) {
    if (filter.ruleId && trace.ruleId !== filter.ruleId) return false;
    if (filter.matched !== undefined && trace.matched !== filter.matched) return false;
    if (filter.minTime && trace.timestamp < filter.minTime) return false;
    if (filter.maxTime && trace.timestamp > filter.maxTime) return false;
    if (filter.minEvalTime && trace.evaluationTime < filter.minEvalTime) return false;

    return true;
  }

  /** Reset the buffer to empty. */
  clear() {
    this.buffer = [];
    this.index = 0;
    this.totalTraces = 0;
  }

  /**
   * Serialise recent traces for export or logging.
   * @param {Object}  [options={}]
   * @param {'json'|'csv'} [options.format='json']  Output format.
   * @param {number}  [options.limit=100]            Number of traces to include.
   * @param {boolean} [options.includeConditions=true]  Include condition snapshots.
   * @param {boolean} [options.includeMetadata=false]   Include metadata objects.
   * @returns {string}
   */
  exportTraces(options = {}) {
    const {
      format = 'json',
      limit = 100,
      includeConditions = true,
      includeMetadata = false
    } = options;

    const traces = this.getRecentTraces(limit);

    const exported = traces.map(trace => {
      const exported = {
        ruleId: trace.ruleId,
        matched: trace.matched,
        evaluationTime: trace.evaluationTime,
        timestamp: trace.timestamp
      };

      if (includeConditions) {
        exported.conditions = trace.conditions;
      }

      if (includeMetadata) {
        exported.metadata = trace.metadata;
      }

      return exported;
    });

    if (format === 'csv') {
      return this.exportToCsv(exported);
    }

    return JSON.stringify(exported, null, 2);
  }

  /**
   * Convert an array of trace records to CSV string.
   * @param {Array<Object>} traces
   * @returns {string}
   */
  exportToCsv(traces) {
    if (traces.length === 0) return 'No traces available\n';

    const headers = ['ruleId', 'matched', 'evaluationTime', 'timestamp'];
    const rows = traces.map(trace => [
      trace.ruleId,
      trace.matched,
      trace.evaluationTime.toFixed(3),
      new Date(trace.timestamp).toISOString()
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }
}

// Global trace buffer instance
const globalTraceBuffer = new RuleTraceBuffer();

// Node.js and browser compatibility
const debugNamespace = (typeof window !== 'undefined') ? window : global;
if (debugNamespace) {
  debugNamespace.__msdRuleTrace = {
    buffer: globalTraceBuffer,
    getRecent: (limit) => globalTraceBuffer.getRecentTraces(limit),
    getStats: () => globalTraceBuffer.getStats(),
    getRuleHistory: (ruleId) => globalTraceBuffer.getRuleHistory(ruleId),
    export: (options) => globalTraceBuffer.exportTraces(options),
    clear: () => globalTraceBuffer.clear()
  };
}

export { globalTraceBuffer };
