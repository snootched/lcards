import { linearMap } from '../../utils/linearMap.js';
import { TemplateDetector } from '../templates/TemplateDetector.js';
import { TemplateParser } from '../templates/TemplateParser.js';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { compareNumericBounds } from '../../utils/comparison-utils.js';

export function compileRule(rule, issues) {
  const raw = rule.when;
  const compiled = {
    tree: raw ? compileNode(raw, issues, rule.id) : alwaysTrueNode(),
    deps: {
      entities: new Set(),
      perf: new Set(),
      flags: new Set()
    }
  };
  collectDeps(compiled.tree, compiled.deps);
  return compiled;
}

function compileNode(node, issues, ruleId) {
  if (!node) return alwaysTrueNode();
  if (Array.isArray(node)) {
    return { type: 'all', nodes: node.map(n => compileNode(n, issues, ruleId)) };
  }
  if (node.all) {
    return { type: 'all', nodes: node.all.map(n => compileNode(n, issues, ruleId)) };
  }
  if (node.any) {
    return { type: 'any', nodes: node.any.map(n => compileNode(n, issues, ruleId)) };
  }
  if (node.not) {
    return { type: 'not', node: compileNode(node.not, issues, ruleId) };
  }

  // ✨ NEW: Auto-detect template type from 'condition' field
  if (node.condition) {
    const conditionStr = String(node.condition);

    // Debug: Log condition string to help diagnose YAML escaping issues
    if (conditionStr.includes('[[[') || conditionStr.includes('{{')) {
      lcardsLog.trace('[compileConditions] Condition string:', conditionStr);
      lcardsLog.trace('[compileConditions] String length:', conditionStr.length);
      lcardsLog.trace('[compileConditions] Has backslashes:', conditionStr.includes('\\'));
    }

    // JavaScript with [[[ ]]] syntax (like custom-button-card)
    if (conditionStr.includes('[[[') && conditionStr.includes(']]]')) {
      const code = conditionStr.slice(3, -3).trim();
      lcardsLog.trace('[compileConditions] Detected JavaScript with [[[]]]. Code:', code);

      // Don't add extra 'return' - user's code should handle it
      return {
        type: 'javascript',
        code: code,
        detected: true
      };
    }

    // Jinja2 (double braces)
    if (conditionStr.includes('{{') && conditionStr.includes('}}')) {
      lcardsLog.trace('[compileConditions] Detected Jinja2 template');
      return {
        type: 'jinja2',
        template: conditionStr,
        detected: true
      };
    }

    // If no special syntax, log a warning
    lcardsLog.warn('[compileConditions] ⚠️ Plain string condition not supported. Use [[[ ]]] for JavaScript or {{ }} for Jinja2');
    issues.push({
      ruleId,
      severity: 'error',
      message: `Plain string conditions not supported. Use [[[ ]]] for JavaScript or {{ }} for Jinja2: "${conditionStr}"`
    });
    return { type: 'always' };
  }

  // ✨ NEW: Explicit type support (for power users)
  if (node.jinja2) {
    return {
      type: 'jinja2',
      template: node.jinja2,
      detected: false  // Explicitly declared
    };
  }

  if (node.javascript || node.js) {
    return {
      type: 'javascript',
      code: node.javascript || node.js,
      detected: false
    };
  }

  if (node.map_range_cond) {
    const c = { ...node.map_range_cond };
    return { type: 'map_range_cond', c };
  }
  if (node.entity || node.entity_attr) {
    // ✨ FIXED: Normalize 'state' property to 'equals' for comparison
    const c = { ...node };
    if (c.state !== undefined && c.equals === undefined) {
      c.equals = c.state;
      delete c.state;
    }
    return { type: node.entity ? 'entity' : 'entity_attr', c };
  }
  if (node.time_between) {
    return { type: 'time_between', range: node.time_between };
  }
  if (node.weekday_in) {
    return { type: 'weekday_in', list: node.weekday_in };
  }
  if (node.sun_elevation) {
    return { type: 'sun_elevation', cmp: node.sun_elevation };
  }
  if (node.perf_metric) {
    return { type: 'perf_metric', c: node.perf_metric };
  }
  if (node.flag) {
    return { type: 'flag', c: node.flag };
  }
  if (node.random_chance != null) {
    return { type: 'random_chance', p: node.random_chance };
  }
  // Fallback treat as entity-like invalid condition → always false
  return { type: 'invalid', reason: 'unrecognized', raw: node };
}

function collectDeps(node, deps) {
  switch (node.type) {
    case 'all':
    case 'any':
      node.nodes.forEach(n => collectDeps(n, deps));
      break;
    case 'not':
      collectDeps(node.node, deps);
      break;
    case 'entity':
    case 'entity_attr':
    case 'map_range_cond':
      if (node.c?.entity) deps.entities.add(node.c.entity);
      break;
    case 'perf_metric':
      if (node.c?.key) deps.perf.add(node.c.key);
      break;
    case 'flag':
      if (node.c?.debugFlagName) deps.flags.add(node.c.debugFlagName);
      break;
    // ✨ NEW: Extract dependencies from template conditions
    case 'jinja2':
      // Extract entity IDs from Jinja2 templates
      try {
        const jinja2Entities = TemplateParser.extractJinja2Entities(node.template);
        jinja2Entities.forEach(entityId => deps.entities.add(entityId));
      } catch (error) {
        // Parsing failed, no dependencies extracted
      }
      break;
    case 'javascript':
      // Extract entity references from JavaScript code
      try {
        const jsTokens = TemplateParser.extractTokens(node.code);
        jsTokens.forEach(token => {
          if (token.parts[0] === 'entity') {
            // This references ctx.entity, dependency will be from rule's entity context
          }
        });
      } catch (error) {
        // Parsing failed, no dependencies extracted
      }
      break;
  }
}

function alwaysTrueNode() {
  return { type: 'always' };
}

/**
 * Evaluate Jinja2 template condition via Home Assistant
 *
 * @param {Object} tree - Compiled Jinja2 node
 * @param {Object} ctx - Evaluation context
 * @param {Object} ctx.unifiedTemplateEvaluator - UnifiedTemplateEvaluator instance
 * @returns {Promise<boolean>} True if condition matches
 */
async function evalJinja2(tree, ctx) {
  if (!ctx.unifiedTemplateEvaluator) {
    lcardsLog.warn('[compileConditions] ⚠️ UnifiedTemplateEvaluator not available for Jinja2 evaluation');
    return false;
  }

  try {
    // Evaluate Jinja2 template - result is a string
    const result = await ctx.unifiedTemplateEvaluator.evaluateAsync(tree.template);

    lcardsLog.trace('[evalJinja2] Template:', tree.template);
    lcardsLog.trace('[evalJinja2] Raw result:', result, 'Type:', typeof result);

    // Handle direct boolean/number results
    if (typeof result === 'boolean') {
      lcardsLog.trace('[evalJinja2] Direct boolean result:', result);
      return result;
    }

    if (typeof result === 'number') {
      lcardsLog.trace('[evalJinja2] Numeric result, converting:', result !== 0);
      return result !== 0;
    }

    // Convert result to boolean
    // Jinja2 may return: "True", "False", "true", "false", "1", "0", "yes", "no"
    const resultStr = String(result).trim().toLowerCase();
    lcardsLog.trace('[evalJinja2] String result after normalization:', resultStr);

    const truthyValues = ['true', '1', 'yes', 'on'];
    const falsyValues = ['false', '0', 'no', 'off', '', 'none'];

    if (truthyValues.includes(resultStr)) {
      lcardsLog.trace('[evalJinja2] Matched truthy value, returning true');
      return true;
    }

    if (falsyValues.includes(resultStr)) {
      lcardsLog.trace('[evalJinja2] Matched falsy value, returning false');
      return false;
    }

    // Try numeric conversion as fallback
    const numValue = parseFloat(resultStr);
    if (!isNaN(numValue)) {
      lcardsLog.trace('[evalJinja2] Numeric conversion:', numValue, 'Returning:', numValue !== 0);
      return numValue !== 0;
    }

    // If result is non-empty string, treat as truthy
    lcardsLog.trace('[evalJinja2] Non-empty string, treating as truthy:', resultStr.length > 0);
    return resultStr.length > 0;

  } catch (error) {
    lcardsLog.error('[compileConditions] ❌ Jinja2 evaluation failed:', error);
    lcardsLog.error('Template:', tree.template);
    return false;
  }
}

/**
 * Resolve dot-notation path from context
 *
 * Handles special case: Entity IDs like "light.tv.state"
 * - If token looks like entity_id.property, use getEntity or hass.states
 * - Otherwise, resolve as normal dot-notation
 *
 * @param {Array<string>} parts - Path parts (e.g., ['light', 'tv', 'state'])
 * @param {Object} ctx - Evaluation context
 * @returns {*} Resolved value
 */
function resolveTokenPath(parts, ctx) {
  // Special case: Entity ID pattern (domain.name.property)
  // Examples: light.tv.state, sensor.temp.attributes.battery
  if (parts.length >= 3) {
    const potentialEntityId = `${parts[0]}.${parts[1]}`;  // e.g., "light.tv"
    const propertyPath = parts.slice(2);  // e.g., ["state"] or ["attributes", "battery"]

    // Try to get entity from context
    let entity = null;

    // Method 1: Use getEntity if available (preferred - handles fallback)
    if (ctx.getEntity && typeof ctx.getEntity === 'function') {
      try {
        entity = ctx.getEntity(potentialEntityId);
      } catch (e) {
        // getEntity might throw if entity not found
      }
    }

    // Method 2: Try hass.states (direct lookup)
    if (!entity && ctx.hass?.states?.[potentialEntityId]) {
      entity = ctx.hass.states[potentialEntityId];
    }

    // If we found an entity, resolve the property path
    if (entity) {
      let current = entity;
      for (const prop of propertyPath) {
        if (current === null || current === undefined) {
          return null;
        }
        current = current[prop];
      }
      return current;
    }
  }

  // Standard dot-notation resolution (non-entity paths)
  let current = ctx;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return null;
    }
    current = current[part];
  }

  return current;
}

/**
 * Resolve tokens in JavaScript code before evaluation
 *
 * Converts {entity.state} to actual values from context
 * Uses a SIMPLE regex that matches ALL {tokens} including entity IDs
 *
 * IMPORTANT: Detects if token is already quoted and avoids double-quoting!
 *
 * @param {string} code - JavaScript code with tokens
 * @param {Object} ctx - Evaluation context
 * @returns {string} Code with tokens replaced by values
 */
function resolveTokensInCode(code, ctx) {
  // Use a simple regex that matches ANY {token} including entity IDs
  // This is different from TemplateParser.extractTokens() which excludes domain names
  const tokenRegex = /\{([^{}]+)\}/g;

  let resolved = code;
  const matches = [];
  let match;

  // Collect all matches first (to avoid issues with string.replace changing indices)
  while ((match = tokenRegex.exec(code)) !== null) {
    matches.push({
      fullMatch: match[0],  // e.g., "{light.tv.state}"
      tokenPath: match[1].trim(),  // e.g., "light.tv.state"
      index: match.index
    });
  }

  // Process matches in reverse order to maintain string positions
  for (let i = matches.length - 1; i >= 0; i--) {
    const { fullMatch, tokenPath, index } = matches[i];

    // Parse the token path
    const parts = tokenPath.split('.');

    // Resolve token path from context
    const value = resolveTokenPath(parts, ctx);

    // Debug logging for token resolution
    lcardsLog.trace(`[resolveTokensInCode] Resolving token: ${fullMatch}`);
    lcardsLog.trace(`[resolveTokensInCode] Token path parts:`, parts);
    lcardsLog.trace(`[resolveTokensInCode] Resolved value:`, value, `(type: ${typeof value})`);

    // Check if token is already wrapped in quotes
    const beforeToken = code.substring(Math.max(0, index - 1), index);
    const afterToken = code.substring(index + fullMatch.length, index + fullMatch.length + 1);
    const isAlreadyQuoted = (beforeToken === '"' || beforeToken === "'") &&
                            (afterToken === '"' || afterToken === "'");

    lcardsLog.trace(`[resolveTokensInCode] Is already quoted: ${isAlreadyQuoted}`);

    // Replace token with value
    let replacement;
    if (value === null || value === undefined) {
      replacement = isAlreadyQuoted ? 'null' : 'null';  // Don't quote null
    } else if (typeof value === 'string') {
      // If already quoted (e.g., "{light.tv.state}"), just insert the value
      // If not quoted (e.g., {light.tv.state}), wrap in quotes
      if (isAlreadyQuoted) {
        replacement = value.replace(/"/g, '\\"').replace(/'/g, "\\'");  // Escape quotes
      } else {
        replacement = `"${value.replace(/"/g, '\\"')}"`;  // Wrap in quotes
      }
    } else {
      replacement = String(value);  // Numbers, booleans - no quotes
    }

    lcardsLog.trace(`[resolveTokensInCode] Replacement value:`, replacement);

    // Replace this specific occurrence
    resolved = resolved.substring(0, index) + replacement + resolved.substring(index + fullMatch.length);
  }

  lcardsLog.trace(`[resolveTokensInCode] Final resolved code:`, resolved);
  return resolved;
}

/**
 * Evaluate JavaScript condition
 * Simple approach like custom-button-card: just pass hass and states
 *
 * @param {Object} tree - Compiled JavaScript node
 * @param {Object} ctx - Evaluation context with hass, entity, etc
 * @returns {boolean} True if condition matches
 */
function evalJavaScript(tree, ctx) {
  const code = tree.code;

  try {
    // Create function with available context
    // Same approach as custom-button-card
    const func = new Function(
      'entity',
      'hass',
      'states',
      code
    );

    // Execute with context values
    const result = func(
      ctx.entity,
      ctx.hass,
      ctx.hass?.states || {}
    );

    // Ensure boolean result
    return !!result;

  } catch (error) {
    lcardsLog.error('[compileConditions] ❌ JavaScript evaluation failed:', error);
    lcardsLog.error('[compileConditions] Error message:', error.message);
    lcardsLog.error('[compileConditions] Error stack:', error.stack);
    lcardsLog.error('[compileConditions] Code:', code);
    lcardsLog.error('[compileConditions] Context keys:', Object.keys(ctx));
    return false;
  }
}

export async function evalCompiled(tree, ctx) {
  switch (tree.type) {
    case 'always':
      return true;

    case 'all':
      // Evaluate all conditions (in parallel for performance)
      const allResults = await Promise.all(
        tree.nodes.map(n => evalCompiled(n, ctx))
      );
      return allResults.every(r => r);

    case 'any':
      // Evaluate all conditions (in parallel)
      const anyResults = await Promise.all(
        tree.nodes.map(n => evalCompiled(n, ctx))
      );
      return anyResults.some(r => r);

    case 'not':
      const notResult = await evalCompiled(tree.node, ctx);
      return !notResult;

    // ✨ NEW: Async template conditions
    case 'jinja2':
      return await evalJinja2(tree, ctx);

    case 'javascript':
      return evalJavaScript(tree, ctx);  // Sync

    // Existing conditions (sync)
    case 'entity':
      return evalEntity(tree.c, ctx);
    case 'entity_attr':
      return evalEntityAttr(tree.c, ctx);
    case 'map_range_cond':
      return evalMapRangeCond(tree.c, ctx);
    case 'time_between':
      return evalTimeBetween(tree.range, ctx);
    case 'weekday_in':
      return evalWeekdayIn(tree.list, ctx);
    case 'sun_elevation':
      return evalSunElevation(tree.cmp, ctx);
    case 'perf_metric':
      return evalPerfMetric(tree.c, ctx);
    case 'flag':
      return evalFlag(tree.c, ctx);
    case 'random_chance':
      return Math.random() < (tree.p || 0);

    default:
      return false;
  }
}

function getEntity(c, ctx) {
  if (!c.entity) return null;
  return ctx.getEntity?.(c.entity) || null;
}

function evalEntity(c, ctx) {
  const ent = getEntity(c, ctx);
  if (!ent) return false;
  const valRaw = ent.state;
  return compareValue(valRaw, c);
}

function evalEntityAttr(c, ctx) {
  const ent = getEntity(c, ctx);
  if (!ent) return false;
  const attrName = c.attribute;
  if (!attrName) return false;
  const valRaw = ent.attributes ? ent.attributes[attrName] : undefined;
  return compareValue(valRaw, c);
}

function evalMapRangeCond(c, ctx) {
  const ent = getEntity(c, ctx);
  if (!ent) return false;
  const val = Number(ent.state);
  if (!Number.isFinite(val)) return false;
  const [inA, inB] = c.input || [];
  const [outA, outB] = c.output || [];
  if (![inA,inB,outA,outB].every(Number.isFinite)) return false;
  const mapped = linearMap(val, inA, inB, outA, outB, c.clamp);
  return compareValue(mapped, c);
}

function compareValue(valRaw, c) {
  const num = Number(valRaw);
  const isNum = Number.isFinite(num);
  if (c.equals != null) return valRaw == c.equals;
  if (c.not_equals != null) return valRaw != c.not_equals;
  if (c.in) return Array.isArray(c.in) && c.in.includes(valRaw);
  if (c.not_in) return Array.isArray(c.not_in) && !c.not_in.includes(valRaw);
  if (c.regex) {
    try {
      const re = new RegExp(c.regex);
      return re.test(String(valRaw));
    } catch {
      return false;
    }
  }
  const hasBound = c.above != null || c.at_least != null || c.below != null || c.at_most != null;
  if (hasBound) return isNum && compareNumericBounds(num, c);
  // If only equals-like handled earlier; default false unless no operator (treated as truthy existence)
  return c.equals == null && c.not_equals == null && c.in == null && c.not_in == null && c.regex == null ? !!valRaw : false;
}

function evalTimeBetween(range, ctx) {
  if (typeof range !== 'string') return false;
  const m = range.match(/^(\d\d):(\d\d)-(\d\d):(\d\d)$/);
  if (!m) return false;
  const now = ctx.now ? new Date(ctx.now) : new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const start = Number(m[1]) * 60 + Number(m[2]);
  const end = Number(m[3]) * 60 + Number(m[4]);
  if (start <= end) return mins >= start && mins <= end;
  // wrap past midnight
  return mins >= start || mins <= end;
}

function evalWeekdayIn(list, ctx) {
  if (!Array.isArray(list) || !list.length) return false;
  const wd = (ctx.now ? new Date(ctx.now) : new Date()).getDay(); // 0=Sun
  const map = ['sun','mon','tue','wed','thu','fri','sat'];
  return list.map(s => s.toLowerCase()).includes(map[wd]);
}

function evalSunElevation(cmp, ctx) {
  const elev = ctx.sun?.elevation;
  if (!Number.isFinite(elev)) return false;
  return compareNumericBounds(elev, cmp);
}

function evalPerfMetric(c, ctx) {
  const val = ctx.getPerf?.(c.key);
  const num = Number(val);
  if (!Number.isFinite(num)) return false;
  if (!compareNumericBounds(num, c)) return false;
  if (c.equals != null) return num == c.equals;
  return true;
}

function evalFlag(c, ctx) {
  const val = ctx.flags?.[c.debugFlagName];
  if (c.is === true) return !!val;
  if (c.is === false) return !val;
  return !!val;
}
