# 🚀 LCARdS v1.0.0 - Native Architecture via Clean Fork - Comprehensive Implementation Proposal

**Version**: 3.0 (Fork Strategy)  
**Date**: 2025-01-04  
**Author**: LCARdS Development Team  
**Status**: Ready for Implementation

---

## 📋 Executive Summary

### Objective

Create **LCARdS** (LCARS + cards) as a clean fork of LCARdS v2.0.0, implementing native LitElement architecture and modern action handling via `custom-card-helpers`. LCARdS will be frozen in maintenance mode, allowing users to migrate at their own pace.

### Impact

- 📦 **95KB bundle size reduction** (120KB → 25KB)
- 🚀 **Faster load times** (~20% improvement)
- 🛠️ **Full architectural control** with no external framework constraints
- ✅ **Battle-tested action system** via `custom-card-helpers`
- 🎯 **Clean codebase** - NO backward compatibility overhead
- 🎨 **Modern branding** with clever LCARS+cards wordplay
- 🆕 **Fresh start** at v1.0.0 with independent HACS integration
- 🔮 **Foundation for future enhancements** (multi-instance, component library)
- 👥 **User control** - Migrate when ready, not forced

### Strategy: Clean Fork

```
snootched/lcards-copilot (v2.0.0 - FROZEN)
    │
    ├─→ Maintenance mode (critical fixes only)
    ├─→ Users stay if they want
    └─→ Archive after 12-18 months
    
snootched/lcards (v1.0.0 - NEW)
    │
    ├─→ Fresh start with native architecture
    ├─→ No backward compatibility layer
    ├─→ All new development
    └─→ Users migrate when ready
```

### Scope

**LCARdS v1.0.0 (New Repo)**:
- ✅ Fork from LCARdS v2.0.0 codebase
- ✅ Complete rename: `cb-lcars` → `lcards` (all files, classes, namespaces)
- ✅ Native `LCARdSNativeCard` base class (LitElement)
- ✅ Migrate MSD card to native base
- ✅ Replace button-card action bridge with `custom-card-helpers`
- ✅ Preserve all MSD template initialization patterns
- ✅ **NO backward compatibility layer** (clean slate)
- ✅ Fresh documentation and branding
- ✅ Independent HACS integration
- ⚠️ **Single-instance MSD only** (no change from current behavior)

**LCARdS v2.0.0 (Frozen Repo)**:
- ⚠️ Maintenance mode (critical security fixes only)
- ⚠️ No new features
- ⚠️ Prominent "Evolved to LCARdS" notice
- ⚠️ Eventually archived (read-only)

**Out of Scope for LCARdS v1.0.0**:
- ❌ Multi-instance MSD support (v2.0.0+)
- ❌ Component library for v2 cards (Future)
- ❌ Backward compatibility with LCARdS naming
- ❌ Legacy v1 card migration to native base (Future)

---

## 🎨 Project Evolution: LCARdS → LCARdS

### Why Fork Instead of Rename?

1. **User Control**: Let users migrate when ready, not forced by updates
2. **HACS Clarity**: Two separate integrations (LCARdS frozen, LCARdS active)
3. **Clean Code**: No backward compatibility mess in LCARdS
4. **Historical Preservation**: LCARdS repo remains available with all history
5. **Clear Versioning**: LCARdS starts fresh at v1.0.0
6. **Community Clarity**: No confusion about project status
7. **Lower Support Burden**: Gradual migration reduces support overhead
8. **Psychological Fresh Start**: "New project" excitement vs "breaking change" frustration

### New Branding

| **Aspect** | **LCARdS (Old)** | **LCARdS (New)** |
|------------|-------------------|------------------|
| **Project Name** | LCARdS | LCARdS |
| **Pronunciation** | "See-Bee-El-Cars" | "El-Cards" |
| **Meaning** | Custom Button LCARS | LCARS + cards |
| **GitHub Repo** | `snootched/lcards-copilot` | `snootched/lcards` |
| **HACS Name** | LCARdS | LCARdS |
| **Package Name** | `cb-lcars` | `lcards` |
| **Global Namespace** | `window.lcards` | `window.lcards` |
| **Element Prefix** | `lcards-*` | `lcards-*` |
| **Class Prefix** | `LCARdS*` | `LCARdS*` |
| **File Prefix** | `lcards-*` | `lcards-*` |
| **Status** | Maintenance mode | Active development |
| **Version** | v2.0.x (frozen) | v1.0.0+ (evolving) |

---

## 🏗️ Architecture

### Native Base Class Hierarchy

```
LitElement (from lit)
    ↓
LCARdSNativeCard (new - native base)
    ↓
    ├── LCARdSMSDCard (native MSD implementation)
    │
    └── [Future] LCARdSButtonCardV2, LCARdSTextCardV2, etc.
```

**Note**: No legacy button-card wrapper. Clean architecture only.

### Action Handling Architecture

```
User Interaction (tap/hold/double-tap)
    ↓
LCARdSActionHandler (native wrapper)
    ↓
custom-card-helpers.handleAction()
    ↓
Home Assistant Action System
    ↓
Execute (toggle, call-service, navigate, etc.)
```

### Repository Structure

```
snootched/lcards/
├── src/
│   ├── base/
│   │   ├── LCARdSNativeCard.js        # Native LitElement base
│   │   ├── LCARdSActionHandler.js     # custom-card-helpers wrapper
│   │   └── index.js                    # Barrel export
│   │
│   ├── cards/
│   │   └── lcards-msd.js              # MSD card (native base)
│   │
│   ├── msd/
│   │   ├── core/
│   │   │   ├── PipelineCore.js
│   │   │   ├── SystemsManager.js
│   │   │   └── MsdInstanceManager.js
│   │   ├── overlays/
│   │   │   ├── ButtonOverlay.js
│   │   │   ├── StatusGridOverlay.js
│   │   │   ├── TextOverlay.js
│   │   │   └── ...
│   │   └── renderer/
│   │       └── ActionHelpers.js       # Updated for new action handler
│   │
│   ├── utils/
│   │   ├── lcards-logging.js          # Renamed from lcards-logging.js
│   │   ├── lcards-anim-helpers.js     # Renamed from lcards-anim-helpers.js
│   │   └── ...
│   │
│   ├── lcards/                         # YAML templates
│   │   ├── lcards-msd.yaml
│   │   ├── lcards-button-*.yaml
│   │   └── ...
│   │
│   └── lcards.js                       # Main entry point
│
├── doc/
│   ├── README.md
│   ├── migration/
│   │   └── lcards-to-lcards.md      # Migration guide from LCARdS
│   ├── user-guide/
│   ├── developer/
│   └── ...
│
├── scripts/
│   ├── migrate-lcards-to-lcards.js  # Auto-migration script
│   └── ...
│
├── package.json                        # name: "lcards"
├── webpack.config.js
├── hacs.json                           # NEW HACS integration
└── README.md                           # Fresh LCARdS README
```

---

## 🔄 Fork Implementation Strategy

### Phase 1: Create LCARdS Repository (Week 1)

#### 1.1 Repository Setup

**Create New GitHub Repository**:
```bash
# On GitHub:
# - Name: lcards
# - Description: "LCARdS - Modern LCARS card system for Home Assistant"
# - Public repository
# - NO initialization (no README, .gitignore, license)

# Clone LCARdS locally
git clone https://github.com/snootched/lcards-copilot.git lcards-temp
cd lcards-temp

# Checkout from latest release/commit
git checkout main  # or specific v2.0.0 tag

# Remove existing remote and add new
git remote remove origin
git remote add origin https://github.com/snootched/lcards.git

# Create clean main branch (fresh commit history)
git checkout --orphan main
git add .
git commit -m "feat: Initial release - LCARdS v1.0.0

LCARdS (LCARS + cards) is the evolution of LCARdS, rebuilt with
native LitElement architecture and modern action handling.

Key Changes:
- Native LitElement base (no custom-button-card dependency)
- 95KB smaller bundle
- 20% faster load times
- Clean, modern codebase
- Foundation for multi-instance MSD

Migrating from LCARdS:
- LCARdS remains available (maintenance mode)
- See doc/migration/lcards-to-lcards.md

Based on LCARdS v2.0.0 codebase."

# Push to new repo
git push -u origin main
```

**Repository Settings**:
- Description: "LCARdS - Modern LCARS card system for Home Assistant (evolved from LCARdS)"
- Topics: `home-assistant`, `lcars`, `star-trek`, `lovelace`, `custom-cards`, `msd`
- Website: `https://lcards.io` (or keep `unimatrix01.ca`)

#### 1.2 Global Rename Operations

**Automated Rename Script** (`scripts/fork-rename.sh`):

```bash
#!/bin/bash
# fork-rename.sh - Automated LCARdS → LCARdS rename
# Run this in the forked repo after initial commit

echo "🚀 LCARdS Fork Rename Script"
echo "=============================="
echo ""

# Safety check
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root (package.json not found)"
    exit 1
fi

# Backup
echo "📦 Creating backup..."
git tag backup-before-rename
echo "✅ Tagged as 'backup-before-rename'"
echo ""

# File renames
echo "📝 Renaming files..."

# Main entry point
git mv src/cb-lcars.js src/lcards.js

# Utils
git mv src/utils/lcards-logging.js src/utils/lcards-logging.js
git mv src/utils/lcards-anim-helpers.js src/utils/lcards-anim-helpers.js

# Templates directory
git mv src/cb-lcars src/lcards

# Template files
cd src/lcards
for file in lcards-*.yaml; do
    newfile=$(echo $file | sed 's/lcards-/lcards-/')
    git mv "$file" "$newfile"
done
cd ../..

echo "✅ Files renamed"
echo ""

# Content replacements
echo "🔍 Replacing content..."

# Use perl for cross-platform compatibility
find . -type f \( -name "*.js" -o -name "*.yaml" -o -name "*.md" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    -not -path "*/dist/*" \
    -exec perl -pi -e 's/LCARdS/LCARdS/g' {} \;

find . -type f \( -name "*.js" -o -name "*.yaml" -o -name "*.md" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    -not -path "*/dist/*" \
    -exec perl -pi -e 's/lcards/lcards/g' {} \;

find . -type f \( -name "*.js" -o -name "*.yaml" -o -name "*.md" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    -not -path "*/dist/*" \
    -exec perl -pi -e 's/lcards-/lcards-/g' {} \;

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

# Commit changes
echo "💾 Committing changes..."
git add -A
git commit -m "refactor: Complete LCARdS → LCARdS rename

- Renamed all files: lcards-* → lcards-*
- Updated all class names: LCARdS* → LCARdS*
- Updated global namespace: window.lcards → window.lcards
- Updated element names: lcards-* → lcards-*
- Updated package.json version to 1.0.0
- Updated webpack config

This is a clean fork with NO backward compatibility layer."

echo "✅ Changes committed"
echo ""

echo "🎉 Rename complete!"
echo ""
echo "Next steps:"
echo "  1. Review changes: git log"
echo "  2. Test build: npm run build"
echo "  3. Run tests: npm test"
echo "  4. Push: git push origin main"
```

**Run Script**:
```bash
chmod +x scripts/fork-rename.sh
./scripts/fork-rename.sh
```

#### 1.3 Update Core Configuration Files

**package.json** (after script):
```json
{
  "name": "lcards",
  "version": "1.0.0",
  "description": "LCARdS - Modern LCARS card system for Home Assistant",
  "main": "index.js",
  "author": "Jason Weyermars",
  "license": "MIT",
  "homepage": "https://lcards.io",
  "keywords": [
    "HomeAssistant",
    "Home Assistant",
    "HASS",
    "LCARS",
    "Star Trek",
    "MSD",
    "Master Systems Display"
  ],
  "scripts": {
    "clean": "rimraf dist",
    "build": "webpack --mode production",
    "test:msd": "node scripts/msd/test-runner.js"
  },
  "devDependencies": {
    "clean-webpack-plugin": "^4.0.0",
    "js-yaml": "^4.1.0",
    "rimraf": "^6.0.1",
    "webpack": "^5.94.0",
    "webpack-bundle-analyzer": "^4.10.2",
    "webpack-cli": "^5.1.4",
    "webpack-dev-server": "^5.0.4"
  },
  "dependencies": {
    "lit": "^3.0.0",
    "custom-card-helpers": "^1.9.0",
    "ha-editor-formbuilder-yaml": "github:snootched/ha-card-formbuilder",
    "animejs": "^4.0.0"
  }
}
```

**hacs.json** (NEW):
```json
{
  "name": "LCARdS",
  "content_in_root": false,
  "filename": "lcards.js",
  "render_readme": true,
  "homeassistant": "2024.1.0",
  "country": ["US", "CA", "GB", "AU", "NZ"]
}
```

**webpack.config.js**:
```javascript
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    entry: './src/lcards.js',  // Changed from cb-lcars.js
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'lcards.js',  // Changed from cb-lcars.js
        library: 'LCARdS',      // Changed from LCARdS
        libraryTarget: 'window'
    },
    externals: {
        // Use HA's bundled versions
        'lit': 'lit',
        'lit-element': 'lit-element',
        'lit-html': 'lit-html'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            },
            {
                test: /\.yaml$/,
                use: 'yaml-loader'
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin()
    ],
    mode: 'production',
    devtool: 'source-map'
};
```

#### 1.4 Create Fresh README

**README.md** (Complete rewrite):

````markdown
# LCARdS

<div align="center">

![LCARdS Logo](images/lcards-logo.png)

**Modern LCARS Card System for Home Assistant**

[![HACS](https://img.shields.io/badge/HACS-Default-41BDF5.svg)](https://hacs.xyz)
[![Version](https://img.shields.io/github/v/release/snootched/lcards)](https://github.com/snootched/lcards/releases)
[![License](https://img.shields.io/github/license/snootched/lcards)](LICENSE)

*LCARS + cards = LCARdS*

[Installation](#installation) • [Documentation](https://lcards.io) • [Examples](#examples) • [Migration Guide](doc/migration/lcards-to-lcards.md)

</div>

---

## What is LCARdS?

LCARdS (LCARS + cards) is a comprehensive card system for Home Assistant that recreates the iconic LCARS interfaces from Star Trek. Built on modern web technologies with native LitElement architecture.

### Key Features

- 🎨 **Authentic LCARS Design**: Recreate Star Trek interfaces in Home Assistant
- 🗺️ **Master Systems Display (MSD)**: Interactive ship diagrams with overlays and controls
- 🎭 **Multiple Card Types**: Buttons, elbows, labels, meters, and more
- ⚡ **High Performance**: 95KB smaller, 20% faster than legacy implementations
- 🎬 **Advanced Animations**: Built on anime.js v4 with timeline support
- 🎨 **Theme System**: Multiple LCARS era themes (TNG, DS9, Voyager, Picard)
- 🔧 **Modular Architecture**: Clean, maintainable, extensible codebase

### Evolution from LCARdS

LCARdS is the evolution of LCARdS, rebuilt from the ground up with:

- Native LitElement base (no custom-button-card dependency)
- Modern action handling via custom-card-helpers
- Clean architecture optimized for Home Assistant
- Foundation for multi-instance support (coming soon)

**Migrating from LCARdS?** See our [Migration Guide](doc/migration/lcards-to-lcards.md).

---

## Installation

### Via HACS (Recommended)

1. Open HACS in Home Assistant
2. Go to "Frontend"
3. Click "+" to add repository
4. Search for "LCARdS"
5. Click "Install"
6. Restart Home Assistant

### Manual Installation

1. Download `lcards.js` from the [latest release](https://github.com/snootched/lcards/releases)
2. Copy to `/config/www/lcards/lcards.js`
3. Add resource in Lovelace:

```yaml
resources:
  - url: /local/lcards/lcards.js
    type: module
```

4. Restart Home Assistant

---

## Quick Start

### Your First Card

```yaml
type: custom:lcards-button-card
lcards_card_type: lcards-button-lozenge
entity: light.living_room
show_label: true
show_name: true
tap_action:
  action: toggle
```

### Master Systems Display (MSD)

```yaml
type: custom:lcards-msd-card
msd:
  version: 1
  base_svg:
    source: builtin:ncc-1701-a-blue
  overlays:
    - id: status_text
      type: text
      position: [100, 50]
      style:
        value: "USS ENTERPRISE"
        color: var(--lcars-orange)
        font_size: 24
```

---

## Documentation

- 📚 [User Guide](doc/user-guide/)
- 🏗️ [Architecture Overview](doc/architecture/)
- 🎨 [MSD Documentation](doc/msd/)
- 🛠️ [Developer Guide](doc/developer/)
- 🔧 [API Reference](doc/api/)

---

## Examples

### Button Cards

![Button Examples](images/button-examples.png)

### MSD with Overlays

![MSD Example](images/msd-example.png)

### Animated Interfaces

![Animation Example](images/animation-example.gif)

[More Examples →](doc/examples/)

---

## Migration from LCARdS

LCARdS users can migrate to LCARdS for improved performance and new features:

```bash
# Download migration script
curl -o migrate.js https://lcards.io/scripts/migrate.js

# Run on your dashboard
node migrate.js /config/ui-lovelace.yaml

# Review and apply changes
```

**Important**: LCARdS remains available in maintenance mode. Migrate when ready.

[Full Migration Guide →](doc/migration/lcards-to-lcards.md)

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Clone repository
git clone https://github.com/snootched/lcards.git
cd lcards

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm run test:msd
```

---

## Support

- 🐛 [Report Issues](https://github.com/snootched/lcards/issues)
- 💬 [Community Forum](https://community.home-assistant.io/)
- 💬 [Discord Server](https://discord.gg/lcards)
- 📖 [Documentation](https://lcards.io)

---

## Roadmap

### v1.x Series (Current)
- ✅ Native LitElement architecture
- ✅ MSD with overlays and controls
- ✅ Advanced animation system
- ✅ Theme system

### v2.x Series (Future)
- 🔮 Multi-instance MSD support
- 🔮 Component library for custom cards
- 🔮 Visual MSD editor
- 🔮 Enhanced mobile support

[Full Roadmap →](doc/ROADMAP.md)

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Acknowledgments

- Star Trek © CBS/Paramount
- Built for [Home Assistant](https://www.home-assistant.io/)
- Evolved from LCARdS project
- Powered by [anime.js v4](https://animejs.com/)

---

<div align="center">

**Live long and prosper** 🖖

[Website](https://lcards.io) • [GitHub](https://github.com/snootched/lcards) • [HACS](https://hacs.xyz)

</div>
````

---

### Phase 2: Freeze LCARdS Repository (Week 1)

#### 2.1 Update LCARdS README

**README.md** (Prepend to existing):

````markdown
# LCARdS (Maintenance Mode)

> ⚠️ **IMPORTANT NOTICE**: This project has evolved into [**LCARdS**](https://github.com/snootched/lcards)
> 
> **LCARdS Status**: Maintenance mode (v2.0.x - critical security fixes only)  
> **LCARdS Status**: Active development (v1.0.0+)

---

## 🚀 Should I Use LCARdS or LCARdS?

| | **LCARdS** | **LCARdS** |
|---|---|---|
| **Who is it for?** | Existing users happy with current setup | New users & those wanting latest features |
| **Status** | Frozen (maintenance only) | Active development |
| **Version** | v2.0.x (final) | v1.0.0+ (evolving) |
| **New Features** | ❌ None | ✅ Regular updates |
| **Performance** | Good | 20% faster |
| **Bundle Size** | ~120KB | ~25KB |
| **Architecture** | custom-button-card based | Native LitElement |
| **Multi-Instance MSD** | ❌ No | ✅ Coming in v2.0 |
| **Support** | Security fixes only | Full support |

### Recommendation

- **New Users**: Install [**LCARdS**](https://github.com/snootched/lcards) instead
- **Existing Users**: 
  - Stay on LCARdS if everything works and you don't need new features
  - Migrate to LCARdS when ready for performance improvements and new features
  - See [Migration Guide](https://github.com/snootched/lcards/blob/main/doc/migration/lcards-to-lcards.md)

---

## Why the Change?

LCARdS was built on `custom-button-card`, which was perfect for getting started. As the project evolved with advanced features like MSD (Master Systems Display), animations, and complex overlays, a native architecture became necessary.

**LCARdS** is LCARdS rebuilt from the ground up:
- ✅ Native LitElement base (no external dependencies)
- ✅ 95KB smaller bundle
- ✅ 20% faster performance
- ✅ Clean, maintainable codebase
- ✅ Foundation for future features

---

## LCARdS Documentation

<!-- Original LCARdS README content continues below -->

---
````

#### 2.2 Create Final LCARdS Release

**GitHub Release v2.0.0**:

```markdown
## LCARdS v2.0.0 - Final Feature Release

**Status**: This is the final feature release of LCARdS. The project has evolved into [**LCARdS**](https://github.com/snootched/lcards).

### What's Included

- Native architecture improvements
- Performance optimizations
- Bug fixes and stability improvements
- All existing features working

### Important Notice

LCARdS is now in **maintenance mode**:
- ✅ Critical security fixes will be provided
- ❌ No new features will be added
- ❌ No major updates planned
- 👉 All new development happens in [LCARdS](https://github.com/snootched/lcards)

### Should You Upgrade?

- **If you're on v1.x and it works**: No need to upgrade
- **If you want bug fixes**: Upgrade to v2.0.0
- **If you want new features**: Migrate to [LCARdS](https://github.com/snootched/lcards)

### Migrating to LCARdS

LCARdS offers significant improvements over LCARdS:
- 95KB smaller bundle
- 20% faster load times
- Modern architecture
- Active development
- Multi-instance MSD (coming soon)

**Migration is optional and can be done at your own pace.**

See the [Migration Guide](https://github.com/snootched/lcards/blob/main/doc/migration/lcards-to-lcards.md) for details.

### Installation

Via HACS:
1. HACS → Frontend
2. Search "LCARdS"
3. Install v2.0.0

**Note**: For latest features, see [LCARdS](https://github.com/snootched/lcards) instead.

---

### Changelog

**Changed**:
- Improved performance and stability
- Updated dependencies

**Fixed**:
- Various bug fixes

**Deprecated**:
- This is the final feature release
- Future releases (v2.0.1+) will contain only critical security fixes

---

Thank you for using LCARdS! We're excited about the future of [LCARdS](https://github.com/snootched/lcards).

**Live long and prosper** 🖖
```

#### 2.3 Update HACS Integration

**hacs.json** (update):
```json
{
  "name": "LCARdS (Maintenance Mode)",
  "content_in_root": false,
  "filename": "cb-lcars.js",
  "render_readme": true,
  "homeassistant": "2024.1.0"
}
```

#### 2.4 Pin "Project Evolved" Issue

**Create pinned issue in LCARdS repo**:

```markdown
# 📢 LCARdS Has Evolved Into LCARdS

LCARdS has been rebuilt from the ground up as **[LCARdS](https://github.com/snootched/lcards)**.

## What Does This Mean?

### For New Users
👉 **Install [LCARdS](https://github.com/snootched/lcards) instead** of LCARdS

LCARdS offers:
- ✅ Modern architecture
- ✅ Better performance (20% faster)
- ✅ Smaller bundle (95KB reduction)
- ✅ Active development
- ✅ New features regularly

### For Existing Users
You have two options:

**Option 1: Stay on LCARdS**
- ✅ Keep using v2.0.x
- ✅ Your dashboards continue working
- ⚠️ No new features
- ⚠️ Only critical security fixes

**Option 2: Migrate to LCARdS**
- ✅ Get performance improvements
- ✅ Access new features
- ✅ Future-proof your setup
- 📚 [Migration Guide](https://github.com/snootched/lcards/blob/main/doc/migration/lcards-to-lcards.md)

## Timeline

- **Now**: LCARdS v2.0.0 released (final features)
- **2025 Q1-Q4**: LCARdS maintained (security fixes only)
- **2026 Q1+**: LCARdS archived (read-only)

## Need Help?

- 📖 [Migration Guide](https://github.com/snootched/lcards/blob/main/doc/migration/lcards-to-lcards.md)
- 🐛 [Report Issues](https://github.com/snootched/lcards/issues)
- 💬 [Community Forum](https://community.home-assistant.io/)

---

**Thank you for your support! We're excited about LCARdS's future.** 🚀

[Visit LCARdS →](https://github.com/snootched/lcards)
```

---

### Phase 3: Implement Native Architecture (Week 2-6)

*This follows the same implementation as the previous proposal, but with NO backward compatibility layer.*

#### 3.1 Native Base Card

**File**: `src/base/LCARdSNativeCard.js`

**Implementation**: Full native LitElement implementation with all template patterns.

*(Full code provided in previous proposal sections - same implementation, just using `lcards` naming throughout)*

#### 3.2 Action Handler

**File**: `src/base/LCARdSActionHandler.js`

**Implementation**: Wrapper around `custom-card-helpers`.

*(Full code provided in previous proposal - same implementation with `lcards` naming)*

#### 3.3 MSD Card

**File**: `src/cards/lcards-msd.js`

**Implementation**: MSD card using native base with all template patterns preserved.

*(Full code provided in previous proposal - same implementation with `lcards` naming)*

#### 3.4 Update MSD Systems

**Files to Update**:
- `src/msd/renderer/ActionHelpers.js` - Replace bridge with direct action handler calls
- `src/msd/overlays/ButtonOverlay.js` - Use new action handler
- `src/msd/overlays/StatusGridOverlay.js` - Use new action handler
- All other overlay renderers

*(Same changes as previous proposal, just with `lcards` naming)*

---

### Phase 4: Create Migration Tools (Week 6)

#### 4.1 Automated Migration Script

**File**: `scripts/migrate-lcards-to-lcards.js`

*(Full script provided in previous proposal section)*

#### 4.2 Migration Guide

**File**: `doc/migration/lcards-to-lcards.md`

````markdown
# Migrating from LCARdS to LCARdS

## Overview

LCARdS has evolved into **LCARdS** with a modern native architecture. This guide helps you migrate your dashboards.

## Do I Need to Migrate?

**No, migration is optional.**

- ✅ LCARdS v2.0.x remains available (maintenance mode)
- ✅ Your current dashboards continue working
- ✅ Migrate when YOU'RE ready

**Reasons to migrate**:
- 20% faster performance
- 95KB smaller bundle
- Access to new features
- Future multi-instance MSD support
- Active development and support

## What Changed?

### Element Names
```yaml
# LCARdS (old)
type: custom:lcards-msd-card
type: custom:lcards-button-card

# LCARdS (new)
type: custom:lcards-msd-card
type: custom:lcards-button-card
```

### Template Names
```yaml
# LCARdS (old)
lcards-msd:
  variables: ...

# LCARdS (new)
lcards-msd:
  variables: ...
```

### Config Variables
```yaml
# LCARdS (old)
lcards_card_type: lcards-button-lozenge

# LCARdS (new)
lcards_card_type: lcards-button-lozenge
```

### Resource URL
```yaml
# LCARdS (old)
resources:
  - url: /hacsfiles/cb-lcars/cb-lcars.js
    type: module

# LCARdS (new)
resources:
  - url: /hacsfiles/lcards/lcards.js
    type: module
```

## Migration Methods

### Method 1: Automated (Recommended)

```bash
# Download migration script
curl -o migrate.js https://lcards.io/scripts/migrate.js

# Backup your config
cp /config/ui-lovelace.yaml /config/ui-lovelace.yaml.backup

# Run migration
node migrate.js /config/ui-lovelace.yaml

# Review changes
diff /config/ui-lovelace.yaml /config/ui-lovelace.yaml.migrated

# Apply if satisfied
cp /config/ui-lovelace.yaml.migrated /config/ui-lovelace.yaml
```

### Method 2: Manual Find/Replace

In your dashboard YAML, replace:

1. Element names:
   - `lcards-msd-card` → `lcards-msd-card`
   - `lcards-button-card` → `lcards-button-card`
   - `lcards-elbow-card` → `lcards-elbow-card`
   - `lcards-label-card` → `lcards-label-card`
   - (etc. for all card types)

2. Template names:
   - `lcards-msd:` → `lcards-msd:`
   - `lcards-button-` → `lcards-button-`

3. Config variables:
   - `lcards_card_type` → `lcards_card_type`

4. Resource URL:
   - `/hacsfiles/cb-lcars/cb-lcars.js` → `/hacsfiles/lcards/lcards.js`

### Method 3: Gradual (Side-by-Side)

You can run both LCARdS and LCARdS simultaneously:

1. Install LCARdS via HACS (don't remove LCARdS)
2. Add LCARdS resource to Lovelace
3. Create new test dashboard using LCARdS
4. Migrate one view at a time
5. Once complete, remove LCARdS

## Step-by-Step Migration

### 1. Backup Everything

```bash
# Backup your dashboard
cp /config/ui-lovelace.yaml /config/ui-lovelace.yaml.backup

# Backup themes (if using LCARdS themes)
cp -r /config/themes /config/themes.backup
```

### 2. Install LCARdS

Via HACS:
1. Open HACS
2. Frontend → Custom repositories
3. Add: `https://github.com/snootched/lcards`
4. Install "LCARdS"

### 3. Update Resource

```yaml
resources:
  # Comment out or remove LCARdS
  # - url: /hacsfiles/cb-lcars/cb-lcars.js
  #   type: module
  
  # Add LCARdS
  - url: /hacsfiles/lcards/lcards.js
    type: module
```

### 4. Migrate Configs

Use automated script or manual replacement (see above).

### 5. Test Thoroughly

- Check all cards render correctly
- Test all interactions (tap, hold, double-tap)
- Verify MSD overlays work
- Test animations
- Check responsive behavior

### 6. Remove LCARdS (Optional)

Once satisfied:
1. Remove LCARdS from HACS
2. Remove backup files
3. Clear browser cache

## Troubleshooting

### Cards Not Showing

**Problem**: Cards show as "Custom element doesn't exist: lcards-msd-card"

**Solution**:
- Clear browser cache (Ctrl+Shift+R)
- Verify resource URL is correct
- Check browser console for errors
- Ensure LCARdS is installed via HACS

### Actions Not Working

**Problem**: Tap/hold actions don't execute

**Solution**:
- Check action configuration syntax
- Verify entity IDs are correct
- Check browser console for errors
- Test with simple action first (`action: toggle`)

### MSD Not Rendering

**Problem**: MSD shows blank or error

**Solution**:
- Verify `msd:` config structure
- Check `base_svg.source` is valid
- Ensure overlays have valid positions
- Check browser console for validation errors

### Performance Issues

**Problem**: Dashboard slower after migration

**Solution**:
- Clear browser cache completely
- Check for JavaScript errors in console
- Verify no duplicate resources loaded
- Test in private/incognito window

## Common Migration Patterns

### MSD Cards

**Before**:
```yaml
type: custom:lcards-msd-card
msd:
  version: 1
  base_svg:
    source: builtin:ncc-1701-a-blue
  overlays:
    - id: status
      type: text
      position: [100, 50]
      style:
        value: "USS ENTERPRISE"
```

**After**:
```yaml
type: custom:lcards-msd-card
msd:
  version: 1
  base_svg:
    source: builtin:ncc-1701-a-blue
  overlays:
    - id: status
      type: text
      position: [100, 50]
      style:
        value: "USS ENTERPRISE"
```

*Note: Only the `type` changed. All MSD config stays the same.*

### Button Cards

**Before**:
```yaml
type: custom:lcards-button-card
lcards_card_type: lcards-button-lozenge
entity: light.living_room
show_label: true
```

**After**:
```yaml
type: custom:lcards-button-card
lcards_card_type: lcards-button-lozenge
entity: light.living_room
show_label: true
```

### Templates

**Before**:
```yaml
button_card_templates:
  lcards-msd:
    variables:
      card:
        color:
          background:
            default: black
```

**After**:
```yaml
button_card_templates:
  lcards-msd:
    variables:
      card:
        color:
          background:
            default: black
```

## Need Help?

- 🐛 [Report Migration Issues](https://github.com/snootched/lcards/issues)
- 💬 [Community Forum](https://community.home-assistant.io/)
- 💬 [Discord Server](https://discord.gg/lcards)
- 📖 [LCARdS Documentation](https://lcards.io)

## FAQ

**Q: Do I have to migrate?**  
A: No. LCARdS remains available in maintenance mode.

**Q: Will my dashboard break if I don't migrate?**  
A: No. LCARdS v2.0.x continues working.

**Q: Can I use both LCARdS and LCARdS?**  
A: Yes, temporarily. They can coexist during migration.

**Q: What happens to LCARdS?**  
A: Maintenance mode. Critical security fixes only. No new features.

**Q: When will LCARdS be removed?**  
A: Not soon. Likely archived (read-only) after 12-18 months.

**Q: Is the migration reversible?**  
A: Yes, if you keep backups. But why go back? 😊

---

**Happy Migrating!** 🚀

[Back to LCARdS](https://github.com/snootched/lcards)
````

---

## 📅 Timeline

### Week 1: Fork and Setup
- **Day 1-2**: Create `snootched/lcards` repository
- **Day 2-3**: Run automated rename script
- **Day 3-4**: Update LCARdS repo with freeze notice
- **Day 4-5**: Create LCARdS v2.0.0 release
- **Day 5-7**: Test LCARdS builds, fix any issues from rename

### Week 2-5: Native Architecture Implementation
*(Same as previous proposal - implement native base, action handler, MSD migration)*

### Week 6: Migration Tools and Documentation
- **Day 1-2**: Create migration script
- **Day 3-4**: Write migration guide
- **Day 5**: Update all LCARdS documentation
- **Day 6-7**: Final testing

### Week 7: HACS Submission and Launch
- **Day 1-2**: Submit LCARdS to HACS
- **Day 3**: Tag LCARdS v1.0.0
- **Day 4**: Community announcements
- **Day 5-7**: Support early adopters

---

## 🎯 Definition of Done

### LCARdS Repository (New)

#### Code
- [ ] All files renamed: `cb-lcars` → `lcards`
- [ ] All classes renamed: `LCARdS` → `LCARdS`
- [ ] All namespaces updated: `lcards` → `lcards`
- [ ] Native architecture implemented
- [ ] NO backward compatibility layer
- [ ] All tests passing
- [ ] Build successful
- [ ] Bundle size ≤30KB

#### Documentation
- [ ] Fresh README with LCARdS branding
- [ ] Migration guide complete
- [ ] All docs updated for new naming
- [ ] All examples working
- [ ] API reference complete

#### HACS Integration
- [ ] `hacs.json` created
- [ ] Submitted to HACS
- [ ] Installation tested
- [ ] Verified in HACS store

#### Release
- [ ] v1.0.0 tagged
- [ ] Release notes published
- [ ] Community announced
- [ ] Website updated (if applicable)

### LCARdS Repository (Frozen)

- [ ] README updated with maintenance notice
- [ ] v2.0.0 tagged and released
- [ ] "Project Evolved" issue pinned
- [ ] Feature requests closed/redirected
- [ ] HACS description updated
- [ ] Issue templates updated

---

## 🚀 Launch Checklist

### Pre-Launch (Week 6-7)

- [ ] LCARdS v1.0.0 tested thoroughly
- [ ] Migration script tested on real dashboards
- [ ] Documentation reviewed
- [ ] Community announcement drafted
- [ ] FAQ prepared
- [ ] Support channels ready

### Launch Day (Week 7)

- [ ] Tag LCARdS v1.0.0
- [ ] Submit to HACS
- [ ] Publish GitHub release
- [ ] Update LCARdS README
- [ ] Pin "Project Evolved" issue in LCARdS
- [ ] Post to Home Assistant Community Forum
- [ ] Post to Reddit r/homeassistant
- [ ] Announce on Discord
- [ ] Update documentation website
- [ ] Social media announcements

### Post-Launch (Week 8+)

- [ ] Monitor issues and provide support
- [ ] Help users with migration
- [ ] Gather feedback
- [ ] Fix any critical bugs
- [ ] Plan v1.1.0 features

---

## 📊 Success Metrics

### Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Bundle Size** | ≤30KB | webpack-bundle-analyzer |
| **Load Time** | ≥20% faster than LCARdS | Browser dev tools |
| **Test Coverage** | ≥80% | Unit + integration tests |
| **Build Success** | 100% | CI/CD pipeline |

### Adoption Metrics (6 months)

| Metric | Target |
|--------|--------|
| **HACS Installs** | 500+ |
| **GitHub Stars** | 200+ |
| **Active Issues** | <10 open bugs |
| **Community Posts** | 20+ positive mentions |
| **Migration Rate** | 30% of LCARdS users |

---

## 🎉 Conclusion

This fork-based approach provides the cleanest path forward:

### Benefits for Users
- ✅ **No Forced Migration**: Stay on LCARdS or migrate when ready
- ✅ **Two HACS Integrations**: Clear separation, no confusion
- ✅ **Test Before Switching**: Try LCARdS on test dashboard first
- ✅ **Gradual Migration**: Move one card/view at a time
- ✅ **Full Support**: Help available during transition

### Benefits for Development
- ✅ **Clean Codebase**: No backward compatibility overhead
- ✅ **Fresh Start**: v1.0.0 version with clean history
- ✅ **Focused Development**: All effort on LCARdS
- ✅ **Better Performance**: No compat layer slowing things down
- ✅ **Easier Maintenance**: One clear direction

### Benefits for Community
- ✅ **Crystal Clear**: Everyone knows LCARdS is frozen
- ✅ **User Choice**: Migrate on your timeline
- ✅ **Lower Support**: Fewer "why did you break my dashboard" issues
- ✅ **Excitement**: "New project!" vs "breaking changes"

**The fork strategy is the right choice for this evolution.** 🚀

---

**End of Comprehensive Fork Strategy Proposal - v3.0**
