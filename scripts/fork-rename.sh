#!/bin/bash
# fork-rename.sh - Automated CB-LCARS → LCARdS rename
# Run this in the forked repo after initial commit

echo "🚀 LCARdS Fork Rename Script"
echo "=============================="
echo ""

# Safety check
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root (package.json not found)"
    exit 1
fi

# Check if backup tag exists
if ! git tag -l | grep -q "backup-before-lcards-rename"; then
    echo "❌ Error: No backup tag found. Run: git tag backup-before-lcards-rename"
    exit 1
fi

echo "📦 Backup tag confirmed: backup-before-lcards-rename"
echo ""

# Create scripts directory if it doesn't exist
mkdir -p scripts

# File renames
echo "📝 Renaming files..."

# Main entry point
if [ -f "src/cb-lcars.js" ]; then
    git mv src/cb-lcars.js src/lcards.js
    echo "✅ Renamed main entry: cb-lcars.js → lcards.js"
fi

# Utils
if [ -f "src/utils/cb-lcars-logging.js" ]; then
    git mv src/utils/cb-lcars-logging.js src/utils/lcards-logging.js
    echo "✅ Renamed logging utility"
fi

if [ -f "src/utils/cb-lcars-anim-helpers.js" ]; then
    git mv src/utils/cb-lcars-anim-helpers.js src/utils/lcards-anim-helpers.js
    echo "✅ Renamed animation helpers"
fi

# Templates directory
if [ -d "src/cb-lcars" ]; then
    git mv src/cb-lcars src/lcards
    echo "✅ Renamed templates directory: cb-lcars → lcards"
fi

# Template files in the lcards directory
if [ -d "src/lcards" ]; then
    cd src/lcards
    for file in cb-lcars-*.yaml; do
        if [ -f "$file" ]; then
            newfile=$(echo $file | sed 's/cb-lcars-/lcards-/')
            git mv "$file" "$newfile"
            echo "✅ Renamed template: $file → $newfile"
        fi
    done
    cd ../..
fi

# Variables file
if [ -f "src/cb-lcars-vars.js" ]; then
    git mv src/cb-lcars-vars.js src/lcards-vars.js
    echo "✅ Renamed variables file"
fi

echo ""
echo "🔍 Replacing content..."

# Use perl for cross-platform compatibility
# Replace class names: CBLCARS → LCARdS
find . -type f \( -name "*.js" -o -name "*.yaml" -o -name "*.md" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    -not -path "*/dist/*" \
    -exec perl -pi -e 's/CBLCARS/LCARdS/g' {} \;

# Replace namespace: cblcars → lcards
find . -type f \( -name "*.js" -o -name "*.yaml" -o -name "*.md" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    -not -path "*/dist/*" \
    -exec perl -pi -e 's/cblcars/lcards/g' {} \;

# Replace element/file prefixes: cb-lcars- → lcards-
find . -type f \( -name "*.js" -o -name "*.yaml" -o -name "*.md" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    -not -path "*/dist/*" \
    -exec perl -pi -e 's/cb-lcars-/lcards-/g' {} \;

# Replace CB-LCARS → LCARdS in documentation
find . -type f \( -name "*.js" -o -name "*.yaml" -o -name "*.md" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    -not -path "*/dist/*" \
    -exec perl -pi -e 's/CB-LCARS/LCARdS/g' {} \;

echo "✅ Content replaced"
echo ""

# Update package.json
echo "📦 Updating package.json..."
perl -pi -e 's/"name": "cb-lcars"/"name": "lcards"/' package.json
perl -pi -e 's/"version": "[^"]*"/"version": "1.0.0"/' package.json
perl -pi -e 's|"homepage": "https://cb-lcars.unimatrix01.ca"|"homepage": "https://lcards.io"|' package.json
perl -pi -e 's/"description": "[^"]*"/"description": "LCARdS - Modern LCARS card system for Home Assistant"/' package.json

echo "✅ package.json updated"
echo ""

# Update webpack config
echo "⚙️  Updating webpack.config.js..."
perl -pi -e "s|entry: './src/cb-lcars.js'|entry: './src/lcards.js'|" webpack.config.js
perl -pi -e "s|filename: 'cb-lcars.js'|filename: 'lcards.js'|" webpack.config.js

echo "✅ webpack.config.js updated"
echo ""

# Create new hacs.json
echo "📋 Creating hacs.json for LCARdS..."
cat > hacs.json << 'EOF'
{
  "name": "LCARdS",
  "content_in_root": false,
  "filename": "lcards.js",
  "render_readme": true,
  "domains": ["script", "sensor", "light", "switch", "binary_sensor"],
  "homeassistant": "2024.1.0",
  "iot_class": "Cloud Polling"
}
EOF

echo "✅ hacs.json created"
echo ""

# Commit changes
echo "💾 Committing changes..."
git add -A
git commit -m "refactor: Complete CB-LCARS → LCARdS rename

- Renamed all files: cb-lcars-* → lcards-*
- Updated all class names: CBLCARS* → LCARdS*
- Updated global namespace: window.cblcars → window.lcards
- Updated element names: cb-lcars-* → lcards-*
- Updated package.json version to 1.0.0
- Updated webpack config
- Created new hacs.json for LCARdS integration

This is a clean fork with NO backward compatibility layer."

echo "✅ Changes committed"
echo ""

echo "🎉 Rename complete!"
echo ""
echo "Next steps:"
echo "  1. Review changes: git log"
echo "  2. Test build: npm run build"
echo "  3. Continue with native architecture implementation"
echo "  4. Push when ready: git push origin main"