#!/usr/bin/env node

/**
 * Editor Import Verification Script
 * 
 * Verifies that all editor components can be imported without errors.
 * This helps catch import path issues before deployment.
 */

const fs = require('fs');
const path = require('path');

const editorDir = path.join(__dirname, '../src/editor');
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m'
};

console.log(`${colors.blue}=== LCARdS Editor Import Verification ===${colors.reset}\n`);

let totalFiles = 0;
let passedFiles = 0;
let failedFiles = 0;

/**
 * Check if a file exists and has correct import paths
 */
function verifyFile(filePath, relativePath) {
    totalFiles++;
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Extract all import statements
        const importRegex = /import\s+(?:{[^}]*}|[^'"]*)\s+from\s+['"]([^'"]+)['"]/g;
        let match;
        const imports = [];
        
        while ((match = importRegex.exec(content)) !== null) {
            imports.push(match[1]);
        }
        
        // Check if all imports are valid
        let hasErrors = false;
        for (const importPath of imports) {
            // Skip node_modules and absolute imports
            if (!importPath.startsWith('.')) {
                continue;
            }
            
            // Resolve the import path
            const dir = path.dirname(filePath);
            const resolvedPath = path.resolve(dir, importPath);
            const pathWithExt = resolvedPath.endsWith('.js') ? resolvedPath : `${resolvedPath}.js`;
            
            // Check if file exists
            if (!fs.existsSync(pathWithExt)) {
                console.log(`  ${colors.red}✗ Invalid import in ${relativePath}:${colors.reset}`);
                console.log(`    ${colors.yellow}Import: ${importPath}${colors.reset}`);
                console.log(`    ${colors.yellow}Resolved: ${pathWithExt}${colors.reset}`);
                hasErrors = true;
            }
        }
        
        if (!hasErrors) {
            passedFiles++;
            console.log(`${colors.green}✓ ${relativePath}${colors.reset}`);
        } else {
            failedFiles++;
        }
        
    } catch (err) {
        failedFiles++;
        console.log(`${colors.red}✗ Error reading ${relativePath}: ${err.message}${colors.reset}`);
    }
}

/**
 * Recursively scan directory for JS files
 */
function scanDirectory(dir, baseDir = dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
            scanDirectory(fullPath, baseDir);
        } else if (entry.name.endsWith('.js')) {
            const relativePath = path.relative(baseDir, fullPath);
            verifyFile(fullPath, relativePath);
        }
    }
}

// Run verification
try {
    scanDirectory(editorDir);
    
    console.log(`\n${colors.blue}=== Summary ===${colors.reset}`);
    console.log(`Total files: ${totalFiles}`);
    console.log(`${colors.green}Passed: ${passedFiles}${colors.reset}`);
    
    if (failedFiles > 0) {
        console.log(`${colors.red}Failed: ${failedFiles}${colors.reset}`);
        process.exit(1);
    } else {
        console.log(`${colors.green}\n✓ All editor imports are valid!${colors.reset}`);
        process.exit(0);
    }
    
} catch (err) {
    console.error(`${colors.red}Error: ${err.message}${colors.reset}`);
    process.exit(1);
}
