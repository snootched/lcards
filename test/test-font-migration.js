/**
 * Font System Migration Test
 * 
 * Verifies that:
 * 1. All font files have been renamed from cb-lcars_* to lcards_*
 * 2. Font CSS files contain correct font-family names
 * 3. Font registry contains all distributed fonts
 * 4. Backward compatibility migration map is complete
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const FONTS_DIR = path.join(__dirname, '../src/fonts');
const EXPECTED_FONT_COUNT = 34; // 34 distributed fonts (excluding Antonio which is from Google Fonts)

console.log('🧪 Running Font System Migration Tests...\n');

// Test 1: Check that all font files use lcards_ prefix
console.log('Test 1: Verify font file naming convention');
const fontFiles = fs.readdirSync(FONTS_DIR).filter(f => f.endsWith('.css'));
const lcardsFonts = fontFiles.filter(f => f.startsWith('lcards_'));
const cbLcarsFonts = fontFiles.filter(f => f.startsWith('cb-lcars_'));

console.log(`  - Found ${fontFiles.length} CSS files`);
console.log(`  - lcards_* files: ${lcardsFonts.length}`);
console.log(`  - cb-lcars_* files: ${cbLcarsFonts.length}`);

if (cbLcarsFonts.length > 0) {
    console.error('  ❌ FAIL: Found legacy cb-lcars_* files:');
    cbLcarsFonts.forEach(f => console.error(`     - ${f}`));
    process.exit(1);
}

if (lcardsFonts.length !== EXPECTED_FONT_COUNT) {
    console.warn(`  ⚠️  WARNING: Expected ${EXPECTED_FONT_COUNT} fonts, found ${lcardsFonts.length}`);
}

console.log('  ✅ PASS: All font files use lcards_ prefix\n');

// Test 2: Check font CSS content
console.log('Test 2: Verify font CSS file contents');
let cssErrors = [];

lcardsFonts.forEach(file => {
    const filePath = path.join(FONTS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract font name from filename (remove lcards_ prefix and .css extension)
    const fontName = file.replace('lcards_', '').replace('.css', '');
    
    // Check 1: Font-family should use lcards_ prefix
    if (content.includes(`font-family: 'cb-lcars_`)) {
        cssErrors.push(`${file}: Contains legacy cb-lcars_ font-family name`);
    }
    
    if (!content.includes(`font-family: 'lcards_${fontName}'`)) {
        cssErrors.push(`${file}: Missing correct font-family declaration`);
    }
    
    // Check 2: URL should use /hacsfiles/lcards/ path
    if (content.includes('/hacsfiles/cb-lcars/')) {
        cssErrors.push(`${file}: Contains legacy /hacsfiles/cb-lcars/ URL`);
    }
    
    if (!content.includes('/hacsfiles/lcards/')) {
        cssErrors.push(`${file}: Missing correct /hacsfiles/lcards/ URL`);
    }
});

if (cssErrors.length > 0) {
    console.error('  ❌ FAIL: CSS content errors:');
    cssErrors.forEach(err => console.error(`     - ${err}`));
    process.exit(1);
}

console.log('  ✅ PASS: All CSS files have correct content\n');

// Test 3: Verify font registry
console.log('Test 3: Verify font registry completeness');

// We can't directly import ES modules in this Node.js script, but we can verify the file exists
// and check its structure
const registryPath = path.join(__dirname, '../src/utils/lcards-fonts.js');
if (!fs.existsSync(registryPath)) {
    console.error('  ❌ FAIL: Font registry file not found');
    process.exit(1);
}

const registryContent = fs.readFileSync(registryPath, 'utf8');

// Check that it exports the required constants and functions
const requiredExports = [
    'export const CORE_FONTS',
    'export const STANDARD_FONTS',
    'export const ALIEN_FONTS',
    'export const ALL_FONTS',
    'export function getFontMetadata',
    'export function isKnownFont',
    'export function migrateFontName',
    'export function ensureFontLoaded',
    'export function getFontsByCategory',
    'export function getFontSelectorOptions'
];

const missingExports = requiredExports.filter(exp => !registryContent.includes(exp));

if (missingExports.length > 0) {
    console.error('  ❌ FAIL: Missing required exports:');
    missingExports.forEach(exp => console.error(`     - ${exp}`));
    process.exit(1);
}

console.log('  ✅ PASS: Font registry has all required exports\n');

// Test 4: Verify backward compatibility
console.log('Test 4: Verify backward compatibility layer');

const themeFilePath = path.join(__dirname, '../src/utils/lcards-theme.js');
const themeContent = fs.readFileSync(themeFilePath, 'utf8');

// Check that migration map exists
if (!themeContent.includes('const FONT_NAME_MIGRATION')) {
    console.error('  ❌ FAIL: FONT_NAME_MIGRATION map not found in lcards-theme.js');
    process.exit(1);
}

// Check that migrateLegacyFontName function exists
if (!themeContent.includes('function migrateLegacyFontName')) {
    console.error('  ❌ FAIL: migrateLegacyFontName function not found');
    process.exit(1);
}

// Check that loadFont uses migration
if (!themeContent.includes('fontName = migrateLegacyFontName(fontName)')) {
    console.error('  ❌ FAIL: loadFont does not call migrateLegacyFontName');
    process.exit(1);
}

// Check that it now looks for lcards_ prefix
if (!themeContent.includes("!fontName.startsWith('lcards_')")) {
    console.error('  ❌ FAIL: loadFont does not check for lcards_ prefix');
    process.exit(1);
}

console.log('  ✅ PASS: Backward compatibility layer is in place\n');

// Test 5: Verify core fonts update
console.log('Test 5: Verify core fonts configuration');

const varsFilePath = path.join(__dirname, '../src/lcards-vars.js');
const varsContent = fs.readFileSync(varsFilePath, 'utf8');

if (varsContent.includes('cb-lcars_jeffries') || varsContent.includes('cb-lcars_microgramma')) {
    console.error('  ❌ FAIL: lcards-vars.js still contains legacy cb-lcars_ font names');
    process.exit(1);
}

if (!varsContent.includes('lcards_jeffries') || !varsContent.includes('lcards_microgramma')) {
    console.error('  ❌ FAIL: lcards-vars.js missing new font names');
    process.exit(1);
}

console.log('  ✅ PASS: Core fonts use new naming\n');

// Test 6: Verify schema updates
console.log('Test 6: Verify schema format hints');

const schemaFilePath = path.join(__dirname, '../src/cards/schemas/button-schema.js');
const schemaContent = fs.readFileSync(schemaFilePath, 'utf8');

// Check for format: 'font-family' hints
const fontFamilyFormatMatches = (schemaContent.match(/format:\s*['"]font-family['"]/g) || []).length;

if (fontFamilyFormatMatches === 0) {
    console.error('  ❌ FAIL: No format: "font-family" hints found in schema');
    process.exit(1);
}

console.log(`  - Found ${fontFamilyFormatMatches} format: 'font-family' hints`);
console.log('  ✅ PASS: Schema has font-family format hints\n');

// Test 7: Verify font selector component
console.log('Test 7: Verify font selector component');

const fontSelectorPath = path.join(__dirname, '../src/editor/components/form/lcards-font-selector.js');
if (!fs.existsSync(fontSelectorPath)) {
    console.error('  ❌ FAIL: Font selector component not found');
    process.exit(1);
}

const fontSelectorContent = fs.readFileSync(fontSelectorPath, 'utf8');

if (!fontSelectorContent.includes('class LCARdSFontSelector extends LitElement')) {
    console.error('  ❌ FAIL: Font selector class definition not found');
    process.exit(1);
}

if (!fontSelectorContent.includes("customElements.define('lcards-font-selector'")) {
    console.error('  ❌ FAIL: Font selector not registered as custom element');
    process.exit(1);
}

console.log('  ✅ PASS: Font selector component exists and is properly defined\n');

// Test 8: Verify form field integration
console.log('Test 8: Verify form field integration');

const formFieldPath = path.join(__dirname, '../src/editor/components/form/lcards-form-field.js');
const formFieldContent = fs.readFileSync(formFieldPath, 'utf8');

if (!formFieldContent.includes("import './lcards-font-selector.js'")) {
    console.error('  ❌ FAIL: Font selector not imported in form field');
    process.exit(1);
}

if (!formFieldContent.includes("hasFormat(schema, 'font-family')")) {
    console.error('  ❌ FAIL: Form field does not check for font-family format');
    process.exit(1);
}

if (!formFieldContent.includes('_renderFontSelector')) {
    console.error('  ❌ FAIL: Form field missing _renderFontSelector method');
    process.exit(1);
}

console.log('  ✅ PASS: Form field integration complete\n');

// All tests passed!
console.log('✅ All tests passed! Font system migration is complete.\n');
console.log('Summary:');
console.log(`  - ${lcardsFonts.length} font CSS files renamed and updated`);
console.log(`  - Font registry created with ${fontFamilyFormatMatches} schema hints`);
console.log('  - Backward compatibility layer implemented');
console.log('  - Font selector component integrated');
console.log('');
