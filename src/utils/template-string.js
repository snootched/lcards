/**
 * @fileoverview Recognise strings the template pipeline evaluates at render time.
 *
 * Shared by the validation service and the docs example validator (plain Node, so
 * this module has no dependencies). A schema `pattern` can't judge a template:
 * it only becomes its real value (a colour, a number, ...) when evaluated.
 */

/** [[[ js ]]], {{ jinja }}, {% jinja %} or a {token} reference. */
const TEMPLATE_RE = /\[\[\[[\s\S]*\]\]\]|\{\{[\s\S]*\}\}|\{%|\{[a-zA-Z_][\w.:-]*\}/;

/**
 * @param {*} value
 * @returns {boolean} true for strings evaluated by the template pipeline
 */
export function isTemplateString(value) {
    return typeof value === 'string' && TEMPLATE_RE.test(value);
}
