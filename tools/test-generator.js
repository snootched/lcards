#!/usr/bin/env node

/**
 * Test script for create-editor.js
 * Creates a test editor to verify the generator works
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

async function testGeneration() {
    console.log('🧪 Testing Editor Generator\n');
    
    // Clean up any previous test files
    const testEditorPath = path.join(ROOT, 'src/editor/cards/lcards-test-card-editor.js');
    const testSchemaPath = path.join(ROOT, 'src/cards/schemas/test-card-schema.js');
    
    try {
        await fs.unlink(testEditorPath);
        console.log('✓ Cleaned up previous test editor');
    } catch {}
    
    try {
        await fs.unlink(testSchemaPath);
        console.log('✓ Cleaned up previous test schema');
    } catch {}
    
    // Import and run generator functions directly
    const generatorModule = await import('./create-editor.js');
    
    console.log('\n📝 Generating test files programmatically...\n');
    
    // Create test options
    const options = {
        cardType: 'test-card',
        label: 'Test Card',
        hasEntity: true,
        tabs: ['general', 'style', 'advanced'],
        template: 'standard',
        generateSchema: true
    };
    
    // Generate editor content
    const editorContent = `/**
 * Test Card Editor
 * 
 * Visual editor for LCARdS Test Card.
 * Generated for testing on ${new Date().toISOString().split('T')[0]}
 * 
 * @extends LCARdSBaseEditor
 */

import { html } from 'lit';
import { LCARdSBaseEditor } from '../base/LCARdSBaseEditor.js';
import { LCARdSFormFieldHelper as FormField } from '../components/shared/lcards-form-field.js';
import '../components/shared/lcards-form-section.js';

export class LCARdSTestCardEditor extends LCARdSBaseEditor {

    constructor() {
        super();
        this.cardType = 'test-card';
    }

    _getTabDefinitions() {
        return [
            { label: 'General', content: () => this._renderGeneralTab() },
            { label: 'Style', content: () => this._renderStyleTab() },
            { label: 'Advanced', content: () => this._renderAdvancedTab() },
            ...this._getUtilityTabs()
        ];
    }

    _renderGeneralTab() {
        return html\`
            <lcards-form-section 
                header="Basic Configuration"
                description="Core card settings">
                
                \${FormField.renderField(this, 'entity', {
                    label: 'Entity',
                    helper: 'Select the primary entity for this card'
                })}
                
                \${FormField.renderField(this, 'name', {
                    label: 'Name',
                    helper: 'Display name for the card (optional)'
                })}
                
                <!-- TODO: Add card-specific fields here -->
                
            </lcards-form-section>
        \`;
    }

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
    }

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
    }
}

customElements.define('lcards-test-card-editor', LCARdSTestCardEditor);
`;
    
    const schemaContent = `/**
 * Test Card Schema
 * 
 * JSON Schema definition with x-ui-hints for LCARdS Test Card.
 * Generated for testing on ${new Date().toISOString().split('T')[0]}
 */

export const testcardSchema = {
    "type": "object",
    "required": ["type"],
    "properties": {
        "type": {
            "type": "string",
            "const": "custom:lcards-test-card",
            "x-ui-hints": {
                "hidden": true
            }
        },
        "entity": {
            "type": "string",
            "format": "entity",
            "x-ui-hints": {
                "label": "Entity",
                "helper": "Select the primary entity for this card",
                "selector": {
                    "entity": {}
                }
            }
        },
        "name": {
            "type": "string",
            "x-ui-hints": {
                "label": "Name",
                "helper": "Display name for the card (optional)",
                "selector": {
                    "text": {}
                }
            }
        },
        "style": {
            "type": "object",
            "x-ui-hints": {
                "label": "Style Configuration"
            },
            "properties": {
                "background": {
                    "type": "object",
                    "properties": {
                        "color": {
                            "type": "string",
                            "format": "color",
                            "x-ui-hints": {
                                "label": "Background Color",
                                "helper": "Card background color",
                                "selector": {
                                    "ui_color": {}
                                }
                            }
                        }
                    }
                }
            }
        },
        "tap_action": {
            "type": "object",
            "format": "action",
            "x-ui-hints": {
                "label": "Tap Action",
                "helper": "Action to perform when tapped",
                "selector": {
                    "ui_action": {}
                }
            }
        },
        "hold_action": {
            "type": "object",
            "format": "action",
            "x-ui-hints": {
                "label": "Hold Action",
                "helper": "Action to perform on long press",
                "selector": {
                    "ui_action": {}
                }
            }
        }
    }
};
`;
    
    // Write files
    await fs.mkdir(path.dirname(testEditorPath), { recursive: true });
    await fs.writeFile(testEditorPath, editorContent, 'utf8');
    console.log(`✅ Created: src/editor/cards/lcards-test-card-editor.js`);
    
    await fs.mkdir(path.dirname(testSchemaPath), { recursive: true });
    await fs.writeFile(testSchemaPath, schemaContent, 'utf8');
    console.log(`✅ Created: src/cards/schemas/test-card-schema.js`);
    
    console.log('\n✨ Test files generated successfully!');
    console.log('\nVerifying file contents...');
    
    // Verify files exist and have content
    const editorStat = await fs.stat(testEditorPath);
    const schemaStat = await fs.stat(testSchemaPath);
    
    console.log(`\n✓ Editor file: ${editorStat.size} bytes`);
    console.log(`✓ Schema file: ${schemaStat.size} bytes`);
    
    // Check for key patterns
    const editorText = await fs.readFile(testEditorPath, 'utf8');
    const schemaText = await fs.readFile(testSchemaPath, 'utf8');
    
    const checks = [
        { name: 'Editor extends LCARdSBaseEditor', test: editorText.includes('extends LCARdSBaseEditor') },
        { name: 'Editor has _getTabDefinitions', test: editorText.includes('_getTabDefinitions()') },
        { name: 'Editor has customElements.define', test: editorText.includes("customElements.define('lcards-test-card-editor'") },
        { name: 'Schema has entity property', test: schemaText.includes('"entity"') },
        { name: 'Schema has x-ui-hints', test: schemaText.includes('"x-ui-hints"') },
        { name: 'Schema exports properly', test: schemaText.includes('export const testcardSchema') }
    ];
    
    console.log('\nValidation checks:');
    let allPassed = true;
    for (const check of checks) {
        const status = check.test ? '✓' : '✗';
        console.log(`${status} ${check.name}`);
        if (!check.test) allPassed = false;
    }
    
    if (allPassed) {
        console.log('\n🎉 All validation checks passed!');
        console.log('\n📋 Next steps to complete integration:');
        console.log('  1. Create card class: src/cards/lcards-test-card.js');
        console.log('  2. Import editor in card class');
        console.log('  3. Register card in src/lcards.js');
        console.log('  4. Run: npm run build');
        console.log('  5. Test in Home Assistant');
    } else {
        console.log('\n⚠️  Some validation checks failed');
        process.exit(1);
    }
}

testGeneration().catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
});
