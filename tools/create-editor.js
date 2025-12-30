#!/usr/bin/env node

/**
 * LCARdS Editor Boilerplate Generator
 * 
 * Interactive CLI tool to generate editor class, schema, and registration.
 * 
 * Usage:
 *   npm run create-editor
 *   npm run create-editor chart
 *   node tools/create-editor.js chart
 */

import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

/**
 * Main CLI flow
 * @param {Array<string>} args - Command line arguments
 */
async function main(args) {
    console.log('🎨 LCARdS Editor Boilerplate Generator\n');
    
    const cardType = args[0];
    
    // Gather options via prompts
    const options = await promptForOptions(cardType);
    
    // Generate files
    console.log('\n📝 Generating files...\n');
    const files = await generateFiles(options);
    
    // Show success message
    files.forEach(file => console.log(`✅ Created: ${file}`));
    
    console.log('\n✨ Done! Next steps:');
    console.log(`  1. Customize schema: src/cards/schemas/${options.cardType}-schema.js`);
    console.log(`  2. Add tab content: src/editor/cards/lcards-${options.cardType}-editor.js`);
    console.log(`  3. Test: Reload HA, create ${options.label}, verify editor opens`);
    console.log(`  4. Use Schema Editor: open tools/schema-editor.html\n`);
}

// ============================================================================
// INTERACTIVE PROMPTS
// ============================================================================

/**
 * Gather configuration via interactive prompts
 * @param {string} initialCardType - Pre-provided card type (optional)
 * @returns {Promise<Object>} Configuration options
 */
async function promptForOptions(initialCardType) {
    const questions = [];
    
    // Card type
    if (!initialCardType) {
        questions.push({
            type: 'input',
            name: 'cardType',
            message: 'Card type (e.g., chart, gauge, timeline):',
            validate: async (input) => {
                if (!input) return 'Card type is required';
                if (!/^[a-z][a-z0-9-]*$/.test(input)) {
                    return 'Card type must be lowercase, start with a letter, and contain only letters, numbers, and hyphens';
                }
                
                // Check if editor already exists
                const editorPath = path.join(ROOT, 'src/editor/cards', `lcards-${input}-editor.js`);
                try {
                    await fs.access(editorPath);
                    return `Editor already exists at src/editor/cards/lcards-${input}-editor.js`;
                } catch {
                    return true;
                }
            }
        });
    } else {
        // Validate pre-provided card type
        if (!/^[a-z][a-z0-9-]*$/.test(initialCardType)) {
            throw new Error('Card type must be lowercase, start with a letter, and contain only letters, numbers, and hyphens');
        }
        
        const editorPath = path.join(ROOT, 'src/editor/cards', `lcards-${initialCardType}-editor.js`);
        try {
            await fs.access(editorPath);
            throw new Error(`Editor already exists at src/editor/cards/lcards-${initialCardType}-editor.js`);
        } catch (err) {
            if (err.code !== 'ENOENT') throw err;
        }
    }
    
    // Display label
    questions.push({
        type: 'input',
        name: 'label',
        message: 'Display label:',
        default: (answers) => {
            const type = initialCardType || answers.cardType;
            return type.split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ') + ' Card';
        }
    });
    
    // Has primary entity
    questions.push({
        type: 'confirm',
        name: 'hasEntity',
        message: 'Has primary entity?',
        default: true
    });
    
    // Tab selection
    questions.push({
        type: 'checkbox',
        name: 'tabs',
        message: 'Select tabs to include:',
        choices: [
            { name: 'General (entity, name, basic config)', value: 'general', checked: true },
            { name: 'Style (appearance, colors, layout)', value: 'style', checked: true },
            { name: 'Data (data sources, series)', value: 'data', checked: false },
            { name: 'Advanced (actions, templates)', value: 'advanced', checked: true }
        ],
        validate: (input) => {
            if (input.length === 0) return 'Select at least one tab';
            return true;
        }
    });
    
    // Base template
    questions.push({
        type: 'list',
        name: 'template',
        message: 'Base template:',
        choices: [
            { name: 'Minimal (entity + name only, single General tab)', value: 'minimal' },
            { name: 'Standard (entity + style basics + actions) [Recommended]', value: 'standard' },
            { name: 'Advanced (standard + data tab + templates + rules)', value: 'advanced' },
            { name: 'Clone from slider', value: 'clone-slider' },
            { name: 'Clone from button', value: 'clone-button' },
            { name: 'Clone from elbow', value: 'clone-elbow' }
        ],
        default: 'standard'
    });
    
    // Generate schema
    questions.push({
        type: 'confirm',
        name: 'generateSchema',
        message: 'Generate schema file?',
        default: true
    });
    
    const answers = await inquirer.prompt(questions);
    
    // Use initial card type if provided
    if (initialCardType) {
        answers.cardType = initialCardType;
    }
    
    return answers;
}

// ============================================================================
// FILE GENERATION
// ============================================================================

/**
 * Generate all files based on options
 * @param {Object} options - Configuration options
 * @returns {Promise<Array<string>>} List of created files
 */
async function generateFiles(options) {
    const files = [];
    
    // Generate editor class
    const editorContent = options.template.startsWith('clone-')
        ? await generateEditorFromClone(options)
        : generateEditorClass(options);
    
    const editorPath = await writeEditorFile(options.cardType, editorContent);
    files.push(editorPath);
    
    // Generate schema if requested
    if (options.generateSchema) {
        const schemaContent = generateSchema(options);
        const schemaPath = await writeSchemaFile(options.cardType, schemaContent);
        files.push(schemaPath);
    }
    
    return files;
}

/**
 * Generate editor class from template
 * @param {Object} options - Configuration options
 * @returns {string} Editor class content
 */
function generateEditorClass(options) {
    const { cardType, label, hasEntity, tabs, template } = options;
    const className = cardType.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join('');
    
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Build imports
    const imports = [
        "import { html } from 'lit';",
        "import { LCARdSBaseEditor } from '../base/LCARdSBaseEditor.js';",
        "import { LCARdSFormFieldHelper as FormField } from '../components/shared/lcards-form-field.js';",
        "import '../components/shared/lcards-form-section.js';"
    ];
    
    // Add conditional imports based on template
    if (template === 'advanced' || tabs.includes('advanced')) {
        imports.push("import '../components/editors/lcards-multi-action-editor.js';");
    }
    if (tabs.includes('data')) {
        imports.push("import '../components/datasources/lcards-datasource-editor-tab.js';");
    }
    
    // Build tab definitions
    const tabDefs = [];
    if (tabs.includes('general')) {
        tabDefs.push("{ label: 'General', content: () => this._renderGeneralTab() }");
    }
    if (tabs.includes('style')) {
        tabDefs.push("{ label: 'Style', content: () => this._renderStyleTab() }");
    }
    if (tabs.includes('data')) {
        tabDefs.push("{ label: 'Data', content: () => this._renderDataTab() }");
    }
    if (tabs.includes('advanced')) {
        tabDefs.push("{ label: 'Advanced', content: () => this._renderAdvancedTab() }");
    }
    
    // Add utility tabs
    tabDefs.push("...this._getUtilityTabs()");
    
    // Build tab renderer methods
    const tabRenderers = [];
    
    if (tabs.includes('general')) {
        tabRenderers.push(generateGeneralTab(options));
    }
    if (tabs.includes('style')) {
        tabRenderers.push(generateStyleTab(options));
    }
    if (tabs.includes('data')) {
        tabRenderers.push(generateDataTab(options));
    }
    if (tabs.includes('advanced')) {
        tabRenderers.push(generateAdvancedTab(options));
    }
    
    return `/**
 * ${label} Editor
 * 
 * Visual editor for LCARdS ${label}s.
 * Generated by tools/create-editor.js on ${timestamp}
 * 
 * @extends LCARdSBaseEditor
 */

${imports.join('\n')}

export class LCARdS${className}Editor extends LCARdSBaseEditor {

    constructor() {
        super();
        this.cardType = '${cardType}';
    }

    /**
     * Get editor tab definitions
     * @returns {Array<{label: string, content: Function}>}
     * @private
     */
    _getTabDefinitions() {
        return [
            ${tabDefs.join(',\n            ')}
        ];
    }

${tabRenderers.join('\n\n')}
}

customElements.define('lcards-${cardType}-editor', LCARdS${className}Editor);
`;
}

/**
 * Generate General tab renderer
 * @param {Object} options - Configuration options
 * @returns {string} Tab renderer method
 */
function generateGeneralTab(options) {
    const { hasEntity } = options;
    
    const entityField = hasEntity ? `
                \${FormField.renderField(this, 'entity', {
                    label: 'Entity',
                    helper: 'Select the primary entity for this card'
                })}` : '';
    
    return `    /**
     * Render General tab
     * @returns {TemplateResult}
     * @private
     */
    _renderGeneralTab() {
        return html\`
            <lcards-form-section 
                header="Basic Configuration"
                description="Core card settings">
                ${entityField}
                
                \${FormField.renderField(this, 'name', {
                    label: 'Name',
                    helper: 'Display name for the card (optional)'
                })}
                
                <!-- TODO: Add card-specific fields here -->
                
            </lcards-form-section>
        \`;
    }`;
}

/**
 * Generate Style tab renderer
 * @param {Object} options - Configuration options
 * @returns {string} Tab renderer method
 */
function generateStyleTab(options) {
    return `    /**
     * Render Style tab
     * @returns {TemplateResult}
     * @private
     */
    _renderStyleTab() {
        return html\`
            <lcards-form-section 
                header="Appearance"
                description="Visual styling options">
                
                \${FormField.renderField(this, 'style.background.color', {
                    label: 'Background Color',
                    helper: 'Card background color'
                })}
                
                \${FormField.renderField(this, 'style.border.radius', {
                    label: 'Border Radius',
                    helper: 'Corner rounding in pixels or theme token'
                })}
                
                \${FormField.renderField(this, 'style.padding', {
                    label: 'Padding',
                    helper: 'Internal spacing'
                })}
                
                <!-- TODO: Add card-specific style fields -->
                
            </lcards-form-section>
        \`;
    }`;
}

/**
 * Generate Data tab renderer
 * @param {Object} options - Configuration options
 * @returns {string} Tab renderer method
 */
function generateDataTab(options) {
    return `    /**
     * Render Data tab
     * @returns {TemplateResult}
     * @private
     */
    _renderDataTab() {
        return html\`
            <lcards-form-section 
                header="Data Sources"
                description="Configure data sources and series">
                
                <!-- TODO: Add data source configuration -->
                <p style="color: var(--secondary-text-color); padding: 16px;">
                    Data source configuration will be added here.
                    Use the DataSource Editor component for advanced configuration.
                </p>
                
            </lcards-form-section>
        \`;
    }`;
}

/**
 * Generate Advanced tab renderer
 * @param {Object} options - Configuration options
 * @returns {string} Tab renderer method
 */
function generateAdvancedTab(options) {
    return `    /**
     * Render Advanced tab
     * @returns {TemplateResult}
     * @private
     */
    _renderAdvancedTab() {
        return html\`
            <lcards-form-section 
                header="Actions"
                description="Interaction handlers">
                
                \${FormField.renderField(this, 'tap_action', {
                    label: 'Tap Action',
                    helper: 'Action to perform when tapped'
                })}
                
                \${FormField.renderField(this, 'hold_action', {
                    label: 'Hold Action',
                    helper: 'Action to perform on long press'
                })}
                
            </lcards-form-section>
            
            <lcards-form-section 
                header="Templates & Advanced"
                description="Template expressions and advanced features">
                
                <!-- TODO: Add template configuration fields -->
                
            </lcards-form-section>
        \`;
    }`;
}

/**
 * Generate editor from clone
 * @param {Object} options - Configuration options
 * @returns {Promise<string>} Editor class content
 */
async function generateEditorFromClone(options) {
    const { cardType, label, template } = options;
    const sourceType = template.replace('clone-', '');
    
    const sourcePath = path.join(ROOT, 'src/editor/cards', `lcards-${sourceType}-editor.js`);
    let content = await fs.readFile(sourcePath, 'utf8');
    
    // Replace class name
    const sourceClassName = sourceType.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join('');
    const targetClassName = cardType.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join('');
    
    content = content.replace(new RegExp(`LCARdS${sourceClassName}`, 'g'), `LCARdS${targetClassName}`);
    content = content.replace(new RegExp(`lcards-${sourceType}`, 'g'), `lcards-${cardType}`);
    content = content.replace(new RegExp(`${sourceType}`, 'gi'), cardType);
    
    // Update cardType in constructor
    content = content.replace(/this\.cardType = '[^']+';/, `this.cardType = '${cardType}';`);
    
    // Add generation notice at top
    const timestamp = new Date().toISOString().split('T')[0];
    content = content.replace(/\/\*\*\n \* LCARdS/, `/**
 * ${label} Editor
 * 
 * Cloned from ${sourceType} editor by tools/create-editor.js on ${timestamp}
 * 
 * @extends LCARdSBaseEditor
 */

/**
 * Original LCARdS ${sourceType.charAt(0).toUpperCase() + sourceType.slice(1)}`);
    
    return content;
}

/**
 * Generate schema file
 * @param {Object} options - Configuration options
 * @returns {string} Schema content
 */
function generateSchema(options) {
    const { cardType, label, hasEntity, tabs } = options;
    const timestamp = new Date().toISOString().split('T')[0];
    
    const properties = {
        type: {
            type: 'string',
            const: `custom:lcards-${cardType}`,
            'x-ui-hints': { hidden: true }
        }
    };
    
    if (hasEntity) {
        properties.entity = {
            type: 'string',
            format: 'entity',
            'x-ui-hints': {
                label: 'Entity',
                helper: 'Select the primary entity for this card',
                selector: { entity: {} }
            }
        };
    }
    
    properties.name = {
        type: 'string',
        'x-ui-hints': {
            label: 'Name',
            helper: 'Display name for the card (optional)',
            selector: { text: {} }
        }
    };
    
    if (tabs.includes('style')) {
        properties.style = {
            type: 'object',
            'x-ui-hints': { label: 'Style Configuration' },
            properties: {
                background: {
                    type: 'object',
                    properties: {
                        color: {
                            type: 'string',
                            format: 'color',
                            'x-ui-hints': {
                                label: 'Background Color',
                                helper: 'Card background color',
                                selector: { ui_color: {} }
                            }
                        }
                    }
                },
                border: {
                    type: 'object',
                    properties: {
                        radius: {
                            oneOf: [
                                {
                                    type: 'number',
                                    title: 'Pixels',
                                    minimum: 0,
                                    maximum: 50
                                },
                                {
                                    type: 'string',
                                    title: 'Theme Token',
                                    pattern: '^\\{theme:.*\\}$'
                                }
                            ],
                            'x-ui-hints': {
                                label: 'Border Radius',
                                helper: 'Corner rounding in pixels or theme token',
                                selector: {
                                    choose: {
                                        choices: {
                                            pixels: {
                                                selector: {
                                                    number: {
                                                        mode: 'slider',
                                                        min: 0,
                                                        max: 50,
                                                        step: 1,
                                                        unit_of_measurement: 'px'
                                                    }
                                                }
                                            },
                                            theme: {
                                                selector: {
                                                    text: {
                                                        placeholder: '{theme:border.radius}'
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                padding: {
                    oneOf: [
                        {
                            type: 'number',
                            title: 'Uniform',
                            minimum: 0,
                            maximum: 100
                        },
                        {
                            type: 'object',
                            title: 'Per Side',
                            properties: {
                                top: { type: 'number', minimum: 0 },
                                right: { type: 'number', minimum: 0 },
                                bottom: { type: 'number', minimum: 0 },
                                left: { type: 'number', minimum: 0 }
                            }
                        }
                    ],
                    'x-ui-hints': {
                        label: 'Padding',
                        helper: 'Internal spacing',
                        selector: {
                            choose: {
                                choices: {
                                    uniform: {
                                        selector: {
                                            number: {
                                                mode: 'slider',
                                                min: 0,
                                                max: 100,
                                                unit_of_measurement: 'px'
                                            }
                                        }
                                    },
                                    per_side: {
                                        selector: { object: {} }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
    }
    
    if (tabs.includes('advanced')) {
        properties.tap_action = {
            type: 'object',
            format: 'action',
            'x-ui-hints': {
                label: 'Tap Action',
                helper: 'Action to perform when tapped',
                selector: { ui_action: {} }
            }
        };
        
        properties.hold_action = {
            type: 'object',
            format: 'action',
            'x-ui-hints': {
                label: 'Hold Action',
                helper: 'Action to perform on long press',
                selector: { ui_action: {} }
            }
        };
    }
    
    return `/**
 * ${label} Schema
 * 
 * JSON Schema definition with x-ui-hints for LCARdS ${label}s.
 * Generated by tools/create-editor.js on ${timestamp}
 * 
 * Use tools/schema-editor.html for visual editing.
 * 
 * @see doc/editor/schema-ui-hints.md
 */

export const ${cardType.replace(/-/g, '')}Schema = ${JSON.stringify({
    type: 'object',
    required: ['type'],
    properties
}, null, 4)};

// TODO: Add card-specific properties here
// Use tools/schema-editor.html for visual editing
`;
}

/**
 * Write editor file
 * @param {string} cardType - Card type
 * @param {string} content - File content
 * @returns {Promise<string>} File path
 */
async function writeEditorFile(cardType, content) {
    const dir = path.join(ROOT, 'src/editor/cards');
    await fs.mkdir(dir, { recursive: true });
    
    const file = path.join(dir, `lcards-${cardType}-editor.js`);
    await fs.writeFile(file, content, 'utf8');
    
    return `src/editor/cards/lcards-${cardType}-editor.js`;
}

/**
 * Write schema file
 * @param {string} cardType - Card type
 * @param {string} content - File content
 * @returns {Promise<string>} File path
 */
async function writeSchemaFile(cardType, content) {
    const dir = path.join(ROOT, 'src/cards/schemas');
    await fs.mkdir(dir, { recursive: true });
    
    const file = path.join(dir, `${cardType}-schema.js`);
    await fs.writeFile(file, content, 'utf8');
    
    return `src/cards/schemas/${cardType}-schema.js`;
}

// ============================================================================
// RUN
// ============================================================================

const args = process.argv.slice(2);
main(args).catch((error) => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
});
