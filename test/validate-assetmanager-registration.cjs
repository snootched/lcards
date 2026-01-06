#!/usr/bin/env node
/**
 * Validation script for AssetManager registration fixes
 * Verifies that button components are properly defined and imports are static
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, checks) {
    if (!fs.existsSync(filePath)) {
        log(`❌ File not found: ${filePath}`, 'red');
        return false;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    let allPassed = true;

    log(`\n📄 Checking ${path.basename(filePath)}:`, 'blue');
    
    for (const check of checks) {
        const passed = check.test(content);
        const symbol = passed ? '✅' : '❌';
        const color = passed ? 'green' : 'red';
        log(`  ${symbol} ${check.name}`, color);
        
        if (!passed) {
            allPassed = false;
            if (check.hint) {
                log(`     Hint: ${check.hint}`, 'yellow');
            }
        }
    }

    return allPassed;
}

// Button components file checks
const buttonComponentsChecks = [
    {
        name: 'BUTTON_COMPONENTS export exists',
        test: content => content.includes('export const BUTTON_COMPONENTS'),
        hint: 'Add: export const BUTTON_COMPONENTS = { ... }'
    },
    {
        name: 'registerButtonComponents export exists',
        test: content => content.includes('export function registerButtonComponents'),
        hint: 'Add: export function registerButtonComponents(assetManager) { ... }'
    },
    {
        name: 'Contains base button',
        test: content => content.includes("'base':"),
        hint: 'Add base button to BUTTON_COMPONENTS'
    },
    {
        name: 'Contains lozenge button',
        test: content => content.includes("'lozenge':"),
        hint: 'Add lozenge button to BUTTON_COMPONENTS'
    },
    {
        name: 'Has 23+ button components',
        test: content => {
            const matches = content.match(/'[a-z-]+'\s*:\s*{/g);
            return matches && matches.length >= 23;
        },
        hint: 'Ensure all 23 button presets are defined'
    },
    {
        name: 'Registration uses assetManager.register()',
        test: content => content.includes("assetManager.register('button'"),
        hint: 'Add registration logic in registerButtonComponents()'
    }
];

// lcards.js file checks
const lcardsJsChecks = [
    {
        name: 'Static slider import exists',
        test: content => content.includes("import { registerSliderComponents } from './core/packs/components/sliders/index.js'"),
        hint: 'Add static import at module top'
    },
    {
        name: 'Static button import exists',
        test: content => content.includes("import { registerButtonComponents } from './core/packs/components/buttons/index.js'"),
        hint: 'Add static import at module top'
    },
    {
        name: 'Slider registration call exists',
        test: content => content.includes('registerSliderComponents(lcardsCore.assetManager)'),
        hint: 'Call registerSliderComponents() in initialization'
    },
    {
        name: 'Button registration call exists',
        test: content => content.includes('registerButtonComponents(lcardsCore.assetManager)'),
        hint: 'Call registerButtonComponents() in initialization'
    },
    {
        name: 'Dynamic import removed (no await import for sliders)',
        test: content => !content.includes("await import('./core/packs/components/sliders/index.js')"),
        hint: 'Remove dynamic import and use static import instead'
    },
    {
        name: 'Imports are before async function',
        test: content => {
            const sliderImportIndex = content.indexOf('import { registerSliderComponents }');
            const asyncFunctionIndex = content.indexOf('async function initializeCustomCard');
            return sliderImportIndex > 0 && sliderImportIndex < asyncFunctionIndex;
        },
        hint: 'Move imports to module top level (before functions)'
    }
];

// Run validation
console.log('');
log('='.repeat(60), 'blue');
log('AssetManager Registration Validation', 'blue');
log('='.repeat(60), 'blue');

const SRC_PATH = path.join(__dirname, '../src');
const buttonComponentsPath = path.join(SRC_PATH, 'core/packs/components/buttons/index.js');
const lcardsJsPath = path.join(SRC_PATH, 'lcards.js');

const buttonComponentsPassed = checkFile(buttonComponentsPath, buttonComponentsChecks);
const lcardsJsPassed = checkFile(lcardsJsPath, lcardsJsChecks);

// Summary
log('\n' + '='.repeat(60), 'blue');
log('Summary', 'blue');
log('='.repeat(60), 'blue');

if (buttonComponentsPassed && lcardsJsPassed) {
    log('✅ All checks passed! AssetManager registration is properly configured.', 'green');
    log('\nNext steps:', 'blue');
    log('  1. Run: npm run build', 'yellow');
    log('  2. Open: test/test-assetmanager-registration.html', 'yellow');
    log('  3. Run: "Run All Tests" button', 'yellow');
    process.exit(0);
} else {
    log('❌ Some checks failed. Please fix the issues above.', 'red');
    process.exit(1);
}
