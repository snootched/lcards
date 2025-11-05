#!/bin/bash

# LCARdS v1.0.0 Release Preparation Script
# This script validates all components are ready for release

set -e

echo "🚀 LCARdS v1.0.0 Release Preparation"
echo "===================================="

# Check we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "src/lcards.js" ]; then
    echo "❌ Error: Must be run from LCARdS root directory"
    exit 1
fi

echo "📂 Checking project structure..."

# Verify key files exist
REQUIRED_FILES=(
    "package.json"
    "hacs.json"
    "webpack.config.js"
    "src/lcards.js"
    "src/base/LCARdSNativeCard.js"
    "src/base/LCARdSActionHandler.js"
    "src/cards/lcards-msd.js"
    "README.md"
    "CHANGELOG.md"
    "LICENSE"
    "doc/MIGRATION.md"
    "scripts/migrate-from-cb-lcars.js"
    "test/TESTING_CHECKLIST.md"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ Missing: $file"
        exit 1
    fi
done

echo ""
echo "📋 Validating package.json..."

# Check package.json version
VERSION=$(node -p "require('./package.json').version")
NAME=$(node -p "require('./package.json').name")

if [ "$NAME" != "lcards" ]; then
    echo "❌ Package name should be 'lcards', got: $NAME"
    exit 1
fi

if [ "$VERSION" != "1.0.0" ]; then
    echo "❌ Version should be '1.0.0', got: $VERSION"
    exit 1
fi

echo "✅ Package: $NAME v$VERSION"

echo ""
echo "🔧 Validating HACS configuration..."

# Check hacs.json
HACS_NAME=$(node -p "require('./hacs.json').name")
HACS_FILENAME=$(node -p "require('./hacs.json').filename")

if [ "$HACS_NAME" != "LCARdS" ]; then
    echo "❌ HACS name should be 'LCARdS', got: $HACS_NAME"
    exit 1
fi

if [ "$HACS_FILENAME" != "lcards.js" ]; then
    echo "❌ HACS filename should be 'lcards.js', got: $HACS_FILENAME"
    exit 1
fi

echo "✅ HACS: $HACS_NAME ($HACS_FILENAME)"

echo ""
echo "🔨 Building project..."

# Clean and build
npm run clean > /dev/null 2>&1 || true
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# Check output file exists
if [ -f "dist/lcards.js" ]; then
    BUNDLE_SIZE=$(stat -c%s "dist/lcards.js" 2>/dev/null || stat -f%z "dist/lcards.js" 2>/dev/null)
    BUNDLE_SIZE_MB=$(echo "scale=2; $BUNDLE_SIZE / 1024 / 1024" | bc)
    echo "✅ Bundle: dist/lcards.js (${BUNDLE_SIZE_MB}MB)"
else
    echo "❌ Build output not found: dist/lcards.js"
    exit 1
fi

echo ""
echo "🧪 Validating migration tools..."

# Test migration script
if node scripts/migrate-from-cb-lcars.js --dry-run test/test-cb-lcars-config.yaml > /dev/null 2>&1; then
    echo "✅ Migration script functional"
else
    echo "❌ Migration script test failed"
    exit 1
fi

echo ""
echo "📄 Checking documentation..."

# Check README has LCARdS content
if grep -q "LCARdS" README.md && grep -q "lcards" README.md; then
    echo "✅ README.md updated for LCARdS"
else
    echo "❌ README.md not properly updated"
    exit 1
fi

# Check changelog has v1.0.0 entry
if grep -q "\[1.0.0\]" CHANGELOG.md; then
    echo "✅ CHANGELOG.md has v1.0.0 entry"
else
    echo "❌ CHANGELOG.md missing v1.0.0 entry"
    exit 1
fi

echo ""
echo "🔍 Checking for CB-LCARS references..."

# Check for remaining cb-lcars references that should be lcards
CBRCLAR_FILES=$(find src -name "*.js" -exec grep -l "cb-lcars\|cblcars\|CB-LCARS\|CBLCARS" {} \; | grep -v "test" | head -5)
if [ -n "$CBRCLAR_FILES" ]; then
    echo "⚠️  Found potential CB-LCARS references in:"
    echo "$CBRCLAR_FILES"
    echo "    Please verify these are intentional (e.g., in comments or migration code)"
else
    echo "✅ No unexpected CB-LCARS references found"
fi

echo ""
echo "🏷️  Git status check..."

# Check git status
if git diff --quiet && git diff --cached --quiet; then
    echo "✅ Working directory clean"
else
    echo "⚠️  Uncommitted changes detected:"
    git status --porcelain
    echo "    Consider committing changes before release"
fi

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "main" ]; then
    echo "✅ On main branch"
else
    echo "⚠️  Not on main branch (current: $CURRENT_BRANCH)"
fi

echo ""
echo "📊 Release Summary"
echo "=================="
echo "Project: $NAME"
echo "Version: $VERSION"
echo "Bundle: ${BUNDLE_SIZE_MB}MB"
echo "Branch: $CURRENT_BRANCH"

echo ""
echo "✅ Release preparation complete!"
echo ""
echo "🎯 Next steps:"
echo "   1. Commit any final changes"
echo "   2. Create git tag: git tag v1.0.0"
echo "   3. Push with tags: git push origin main --tags"
echo "   4. Create GitHub release with dist/lcards.js asset"
echo "   5. Submit to HACS repository"
echo ""
echo "🎉 Ready for LCARdS v1.0.0 release!"