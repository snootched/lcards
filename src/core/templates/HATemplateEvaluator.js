import { TemplateEvaluator } from './TemplateEvaluator.js';
import { lcardsLog } from '../../utils/lcards-logging.js';

/**
 * HATemplateEvaluator - Server-side Jinja2 template evaluation via Home Assistant
 *
 * Uses Home Assistant's render_template WebSocket API to evaluate Jinja2 templates
 * server-side. This provides access to all HA template functions, filters, and state.
 *
 * @extends TemplateEvaluator
 *
 * @example
 * const evaluator = new HATemplateEvaluator({ hass, entity, config });
 * const result = await evaluator.evaluate('{{states("sensor.temp")}}°F');
 * // Result: "72°F"
 */
export class HATemplateEvaluator extends TemplateEvaluator {
  /**
   * Evaluate Jinja2 template using Home Assistant's render_template API
   *
   * @param {string} content - Content containing Jinja2 templates
   * @returns {Promise<string>} Content with Jinja2 templates evaluated
   *
   * @example
   * // Simple state access
   * await evaluate('{{states("sensor.temp")}}')  // "72"
   *
   * // With filters
   * await evaluate('{{states("sensor.temp") | float | round(1)}}')  // "72.0"
   *
   * // Time functions
   * await evaluate('{{now().strftime("%H:%M")}}')  // "14:30"
   *
   * // Conditional logic
   * await evaluate('{{states("light.living") == "on" ? "Active" : "Off"}}')
   */
  async evaluate(content) {
    if (!content || typeof content !== 'string') {
      return content;
    }

    // Quick exit if no Jinja2 templates (expressions {{...}}, control structures {%...%}, or comments {#...#})
    const hasExpressions = content.includes('{{') && content.includes('}}');
    const hasControlStructures = content.includes('{%') && content.includes('%}');
    const hasComments = content.includes('{#') && content.includes('#}');

    if (!hasExpressions && !hasControlStructures && !hasComments) {
      return content;
    }

    return this._safeEvaluate(async () => {
      try {
        // Use Home Assistant's render_template API
        const result = await this._renderTemplate(content);
        this._logEvaluation(content, result, { type: 'jinja2', serverSide: true });
        return result;
      } catch (error) {
        lcardsLog.warn('[HATemplateEvaluator] Server-side evaluation failed:', error);
        this._logEvaluation(content, content, { type: 'jinja2', error: error.message });
        return content; // Return original on error
      }
    });
  }

  /**
   * Call Home Assistant's template rendering via WebSocket subscription
   *
   * Uses a one-shot subscription to render_template which immediately
   * returns the rendered result and unsubscribes.
   *
   * @private
   * @param {string} template - Jinja2 template to render
   * @returns {Promise<string>} Rendered template result
   *
   * @throws {Error} If hass connection is unavailable or API call fails
   */
  async _renderTemplate(template) {
    if (!this.context.hass || !this.context.hass.connection) {
      throw new Error('Home Assistant connection not available');
    }

    return new Promise((resolve, reject) => {
      let unsubscribe;
      const timeout = setTimeout(() => {
        if (unsubscribe) unsubscribe();
        reject(new Error('Template rendering timed out after 5 seconds'));
      }, 5000);

      // Subscribe to render_template - it will immediately return result
      this.context.hass.connection.subscribeMessage(
        (result) => {
          clearTimeout(timeout);
          if (unsubscribe) unsubscribe();

          lcardsLog.trace('[HATemplateEvaluator] Received result:', result);

          // Result is an object with a 'result' property containing the rendered string
          const rendered = result?.result !== undefined ? String(result.result) : String(result || '');
          resolve(rendered);
        },
        {
          type: 'render_template',
          template: template
        }
      ).then((unsub) => {
        unsubscribe = unsub;
      }).catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * Batch evaluate multiple Jinja2 templates efficiently
   *
   * Useful when a card has multiple fields with Jinja2 templates.
   * Currently evaluates sequentially but could be optimized for parallel execution.
   *
   * @param {Object.<string, string>} templates - Map of field names to template strings
   * @returns {Promise<Object.<string, string>>} Map of field names to evaluated results
   *
   * @example
   * const results = await evaluateBatch({
   *   label: '{{states("sensor.temp")}}°F',
   *   secondary: '{{now().strftime("%H:%M")}}'
   * });
   * // { label: "72°F", secondary: "14:30" }
   */
  async evaluateBatch(templates) {
    const results = {};

    for (const [key, template] of Object.entries(templates)) {
      results[key] = await this.evaluate(template);
    }

    return results;
  }

  /**
   * Test if a template can be evaluated (checks for HA connection)
   *
   * @returns {boolean} True if HA connection is available
   */
  canEvaluate() {
    return !!(this.context.hass && this.context.hass.connection);
  }
}
