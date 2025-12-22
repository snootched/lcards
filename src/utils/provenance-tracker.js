/**
 * @fileoverview Unified Provenance Tracker for LCARdS
 *
 * Provides standardized provenance tracking across all card types for:
 * - Config layers (card defaults → theme defaults → preset → user → rules)
 * - Theme token resolution chains (token path → computed tokens → final value)
 * - Rule patches (original value → patched value + rule info)
 * - Template processing (template → processed output + dependencies)
 * - Style resolution (explicit → theme → preset → default)
 * - Renderer info (MSD-specific: defaults accessed, features used, timing)
 *
 * @module utils/provenance-tracker
 */

import { lcardsLog } from './lcards-logging.js';

/**
 * Unified Provenance Tracker
 *
 * Stores provenance information for debugging and troubleshooting.
 * Tracks where every config value, style, and resolved setting originates.
 *
 * @class ProvenanceTracker
 */
export class ProvenanceTracker {
  /**
   * Create a new provenance tracker
   * @param {string} cardGuid - Unique identifier for the card
   */
  constructor(cardGuid) {
    this.cardGuid = cardGuid;
    
    // Provenance data storage
    this.data = {
      // Config layer provenance (from CoreConfigManager)
      config: {
        merge_order: [],           // Layer precedence
        field_sources: {},         // Field → layer mapping
        card_type: null,
        timestamp: null
      },
      
      // Theme token resolution chains
      theme_tokens: {},
      
      // Rule patches (runtime overrides)
      rule_patches: {},
      
      // Template processing
      templates: {},
      
      // Style resolution (MSD-specific)
      styles: null,
      
      // Renderer info (MSD-specific)
      renderer: null
    };
    
    // Statistics
    this.stats = {
      tokensTracked: 0,
      patchesTracked: 0,
      templatesTracked: 0
    };
  }
  
  /**
   * Track config provenance from CoreConfigManager
   *
   * @param {Object} provenance - Config provenance object
   * @param {string[]} provenance.merge_order - Layer precedence
   * @param {Object} provenance.field_sources - Field → layer mapping
   * @param {string} provenance.card_type - Card type
   * @param {number} provenance.timestamp - Merge timestamp
   */
  trackConfig(provenance) {
    if (!provenance) return;
    
    this.data.config = {
      merge_order: provenance.merge_order || [],
      field_sources: provenance.field_sources || {},
      card_type: provenance.card_type || null,
      timestamp: provenance.timestamp || Date.now()
    };
    
    lcardsLog.trace(`[ProvenanceTracker:${this.cardGuid}] Config tracked`, {
      layers: this.data.config.merge_order.length,
      fields: Object.keys(this.data.config.field_sources).length
    });
  }
  
  /**
   * Track theme token resolution
   *
   * @param {string} tokenPath - Token path (e.g., 'colors.accent.primary')
   * @param {string} originalRef - Original reference (e.g., 'theme:colors.accent.primary')
   * @param {any} resolvedValue - Final resolved value
   * @param {Array<Object>} resolutionChain - Resolution steps
   * @param {string[]} usedByFields - Fields using this token
   */
  trackThemeToken(tokenPath, originalRef, resolvedValue, resolutionChain = [], usedByFields = []) {
    this.data.theme_tokens[tokenPath] = {
      original_ref: originalRef,
      resolved_value: resolvedValue,
      resolution_chain: resolutionChain,
      used_by_fields: usedByFields,
      timestamp: Date.now()
    };
    
    this.stats.tokensTracked++;
    
    lcardsLog.trace(`[ProvenanceTracker:${this.cardGuid}] Token tracked: ${tokenPath}`, {
      resolvedValue,
      chainLength: resolutionChain.length
    });
  }
  
  /**
   * Track rule patch application
   *
   * @param {string} fieldPath - Field path (e.g., 'style.opacity')
   * @param {any} originalValue - Value before patch
   * @param {any} patchedValue - Value after patch
   * @param {string} ruleId - Rule ID that applied the patch
   * @param {string} ruleCondition - Human-readable rule condition
   */
  trackRulePatch(fieldPath, originalValue, patchedValue, ruleId, ruleCondition) {
    this.data.rule_patches[fieldPath] = {
      original_value: originalValue,
      patched_value: patchedValue,
      rule_id: ruleId,
      rule_condition: ruleCondition,
      applied_at: Date.now()
    };
    
    this.stats.patchesTracked++;
    
    lcardsLog.trace(`[ProvenanceTracker:${this.cardGuid}] Patch tracked: ${fieldPath}`, {
      ruleId,
      originalValue,
      patchedValue
    });
  }
  
  /**
   * Track template processing
   *
   * @param {string} fieldId - Field identifier (e.g., 'label', 'text.name')
   * @param {string} original - Original template string
   * @param {string} processed - Processed output
   * @param {string[]} dependencies - Entity/variable dependencies
   * @param {string} processor - Processor type (e.g., 'jinja2', 'javascript')
   */
  trackTemplate(fieldId, original, processed, dependencies = [], processor = 'unknown') {
    this.data.templates[fieldId] = {
      original,
      processed,
      dependencies,
      processor,
      last_updated: Date.now()
    };
    
    this.stats.templatesTracked++;
    
    lcardsLog.trace(`[ProvenanceTracker:${this.cardGuid}] Template tracked: ${fieldId}`, {
      processor,
      dependencies: dependencies.length
    });
  }
  
  /**
   * Track MSD-specific style provenance
   *
   * @param {Object} styleProvenance - Style provenance data from MSD ProvenanceTracker
   */
  trackStyles(styleProvenance) {
    this.data.styles = styleProvenance;
    
    lcardsLog.trace(`[ProvenanceTracker:${this.cardGuid}] MSD styles tracked`);
  }
  
  /**
   * Track MSD-specific renderer provenance
   *
   * @param {Object} rendererProvenance - Renderer provenance data from BaseRenderer
   */
  trackRenderer(rendererProvenance) {
    this.data.renderer = rendererProvenance;
    
    lcardsLog.trace(`[ProvenanceTracker:${this.cardGuid}] MSD renderer tracked`);
  }
  
  /**
   * Get provenance data
   *
   * @param {string} [path] - Optional path to specific provenance data
   * @returns {any} Provenance data (full or at path)
   *
   * @example
   * // Get all provenance
   * tracker.getProvenance();
   *
   * // Get config provenance
   * tracker.getProvenance('config');
   *
   * // Get specific field source
   * tracker.getProvenance('config.field_sources.style.color');
   */
  getProvenance(path = null) {
    if (!path) {
      return this.data;
    }
    
    // Navigate path
    const parts = path.split('.');
    let current = this.data;
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return null;
      }
    }
    
    return current;
  }
  
  /**
   * Get pretty-printed debug output
   * 
   * NOTE: Uses emoji for visual appeal in console output. This is intentional
   * for human-readable debugging. Emojis render consistently in modern browsers.
   * For automated/programmatic access, use getProvenance() instead.
   *
   * @returns {string} Formatted provenance information
   */
  debugProvenance() {
    const lines = [];
    
    lines.push(`🔍 Provenance for ${this.cardGuid}`);
    lines.push('');
    
    // Config merge order
    if (this.data.config.merge_order.length > 0) {
      lines.push('  📦 Config Merge Order');
      lines.push(`    [${this.data.config.merge_order.map(l => `'${l}'`).join(', ')}]`);
      lines.push('');
    }
    
    // Field sources (sample)
    const fieldSources = Object.keys(this.data.config.field_sources);
    if (fieldSources.length > 0) {
      lines.push('  📋 Field Sources (Sample)');
      const sample = fieldSources.slice(0, 10);
      sample.forEach(field => {
        const source = this.data.config.field_sources[field];
        lines.push(`    ${field}: ${source}`);
      });
      if (fieldSources.length > 10) {
        lines.push(`    ... and ${fieldSources.length - 10} more`);
      }
      lines.push('');
    }
    
    // Theme tokens
    const tokens = Object.keys(this.data.theme_tokens);
    if (tokens.length > 0) {
      lines.push(`  🎨 Theme Tokens (${tokens.length})`);
      tokens.slice(0, 5).forEach(token => {
        const data = this.data.theme_tokens[token];
        lines.push(`    ${token}: ${JSON.stringify(data.resolved_value)}`);
        if (data.used_by_fields.length > 0) {
          lines.push(`      Used by: ${data.used_by_fields.join(', ')}`);
        }
      });
      if (tokens.length > 5) {
        lines.push(`    ... and ${tokens.length - 5} more`);
      }
      lines.push('');
    }
    
    // Rule patches
    const patches = Object.keys(this.data.rule_patches);
    if (patches.length > 0) {
      lines.push(`  ⚙️ Rule Patches (${patches.length})`);
      patches.slice(0, 5).forEach(field => {
        const patch = this.data.rule_patches[field];
        lines.push(`    ${field}: ${JSON.stringify(patch.original_value)} → ${JSON.stringify(patch.patched_value)}`);
        lines.push(`      Rule: ${patch.rule_id} (${patch.rule_condition})`);
      });
      if (patches.length > 5) {
        lines.push(`    ... and ${patches.length - 5} more`);
      }
      lines.push('');
    }
    
    // Templates
    const templates = Object.keys(this.data.templates);
    if (templates.length > 0) {
      lines.push(`  📝 Templates (${templates.length})`);
      templates.slice(0, 5).forEach(field => {
        const tmpl = this.data.templates[field];
        lines.push(`    ${field}: "${tmpl.original}" → "${tmpl.processed}"`);
        if (tmpl.dependencies.length > 0) {
          lines.push(`      Dependencies: ${tmpl.dependencies.join(', ')}`);
        }
      });
      if (templates.length > 5) {
        lines.push(`    ... and ${templates.length - 5} more`);
      }
      lines.push('');
    }
    
    // MSD-specific
    if (this.data.styles) {
      lines.push('  🎭 MSD Style Provenance: Available');
    }
    if (this.data.renderer) {
      lines.push('  🖼️ MSD Renderer Provenance: Available');
    }
    
    // Statistics
    lines.push('');
    lines.push('  📊 Statistics');
    lines.push(`    Tokens tracked: ${this.stats.tokensTracked}`);
    lines.push(`    Patches tracked: ${this.stats.patchesTracked}`);
    lines.push(`    Templates tracked: ${this.stats.templatesTracked}`);
    
    return lines.join('\n');
  }
  
  /**
   * Clear all provenance data
   */
  clear() {
    this.data = {
      config: { merge_order: [], field_sources: {}, card_type: null, timestamp: null },
      theme_tokens: {},
      rule_patches: {},
      templates: {},
      styles: null,
      renderer: null
    };
    
    this.stats = {
      tokensTracked: 0,
      patchesTracked: 0,
      templatesTracked: 0
    };
    
    lcardsLog.trace(`[ProvenanceTracker:${this.cardGuid}] Cleared`);
  }
  
  /**
   * Get statistics
   *
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      ...this.stats,
      configLayers: this.data.config.merge_order.length,
      fields: Object.keys(this.data.config.field_sources).length
    };
  }
}

export default ProvenanceTracker;
