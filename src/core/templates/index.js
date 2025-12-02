/**
 * Core Template System
 *
 * Unified template processing infrastructure for all card types.
 * Consolidates template detection, parsing, and evaluation logic.
 *
 * @module core/templates
 */

export { TemplateDetector } from './TemplateDetector.js';
export { TemplateParser } from './TemplateParser.js';
export { TemplateEvaluator, createEvaluator } from './TemplateEvaluator.js';
export { LCARdSCardTemplateEvaluator } from './LCARdSCardTemplateEvaluator.js';
