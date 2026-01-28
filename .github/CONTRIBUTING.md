# Contributing to LCARdS

First off, thank you for considering contributing to LCARdS! 🖖

LCARdS is a hobby project built by LCARS and Star Trek fans, and we welcome contributions from the community. Whether you're fixing bugs, adding features, improving documentation, or sharing ideas, your help is appreciated.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Getting Help](#getting-help)

## Code of Conduct

This project adheres to the Contributor Covenant [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior by creating a private security advisory.

## How Can I Contribute?

### 🐛 Reporting Bugs

Found a bug? Please create an issue using our [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.yml):

1. Check [existing issues](https://github.com/snootched/LCARdS/issues) first
2. Use the bug report template - it helps us help you faster
3. Include version info, steps to reproduce, and card configuration
4. Remove sensitive information from configs

### ✨ Suggesting Features

Have an idea? We'd love to hear it!

1. Check [existing issues](https://github.com/snootched/LCARdS/issues) and [discussions](https://github.com/snootched/LCARdS/discussions)
2. For fully-formed proposals, use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.yml)
3. For brainstorming and early ideas, start a [Discussion](https://github.com/snootched/LCARdS/discussions/categories/ideas)

### 📚 Improving Documentation

Documentation improvements are always welcome:

1. Create an issue using the [Documentation template](.github/ISSUE_TEMPLATE/documentation.yml)
2. Or submit a PR directly for typos and small fixes
3. For larger doc changes, discuss in an issue first

### 💻 Contributing Code

Ready to code? Here's how to get started:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/my-new-feature`)
3. Make your changes following our [coding standards](#coding-standards)
4. Test thoroughly (see [Testing Guidelines](#testing-guidelines))
5. Commit your changes with clear messages
6. Push to your fork
7. Open a Pull Request using our [PR template](.github/PULL_REQUEST_TEMPLATE.md)

## Development Setup

### Prerequisites

- **Node.js** 16+ (for building)
- **npm** 8+ (package manager)
- **Home Assistant** instance for testing
- **Git** for version control
- Code editor (VS Code recommended)

### Initial Setup

```bash
# 1. Fork and clone the repository
git clone https://github.com/YOUR-USERNAME/LCARdS.git
cd LCARdS

# 2. Install dependencies
npm install

# 3. Build the project
npm run build

# 4. The output is in dist/lcards.js
```

### Build Commands

```bash
# Production build (minified)
npm run build

# Development build (with source maps)
npm run build:dev

# Clean dist folder
npm run clean

# Analyze bundle size
npm run analyze
```

### Testing Your Changes

1. **Build:** Run `npm run build` after making changes
2. **Deploy:** Copy `dist/lcards.js` to `<ha-config>/www/community/lcards/`
3. **Test:** Hard refresh browser (Ctrl+Shift+R) and test in Home Assistant
4. **Verify:** Check browser console for errors

**Note:** LCARdS loads from `dist/lcards.js`, not source files. Always rebuild before testing!

### Project Structure

```
LCARdS/
├── src/
│   ├── base/           # Base classes (LCARdSCard, LCARdSNativeCard)
│   ├── cards/          # Card implementations
│   ├── core/           # Singleton systems (themes, rules, datasources)
│   ├── editor/         # Visual editor components
│   ├── msd/            # MSD-specific rendering
│   ├── utils/          # Utilities (logging, provenance)
│   └── lcards.js       # Entry point
├── doc/                # Documentation
│   ├── user-guide/     # User documentation
│   └── architecture/   # Developer documentation
├── .github/            # GitHub templates and workflows
└── dist/               # Build output (not committed)
```

## Coding Standards

LCARdS follows specific architectural patterns and coding standards. Please review these before contributing.

### General Guidelines

1. **Use existing patterns:** Study existing cards/components before creating new ones
2. **Follow Lit conventions:** Use Lit web component patterns
3. **Structured logging:** Use `lcardsLog` with proper severity levels
4. **No `console.log()`:** Use `lcardsLog.debug/info/warn/error` instead
5. **Singleton access:** Use `window.lcards.core.*` for shared systems
6. **JSDoc comments:** Document public APIs and complex logic

### Architecture Patterns

#### Use Singleton Services

```javascript
// ✅ GOOD: Use singleton
const themeManager = window.lcards.core.themeManager;
const theme = themeManager.getCurrentTheme();

// ❌ BAD: Don't create new instances
const themeManager = new ThemeManager(this.hass);
```

#### Cache Entity References

```javascript
// ✅ GOOD: Cache in _handleHassUpdate
_handleHassUpdate(newHass, oldHass) {
  super._handleHassUpdate(newHass, oldHass);
  this._entity = newHass.states[this.config.entity_id];
  this.requestUpdate();
}

_renderCard() {
  return html`${this._entity?.state}`;
}

// ❌ BAD: Access on every render (slow!)
_renderCard() {
  const entity = this.hass.states[this.config.entity_id];
  return html`${entity.state}`;
}
```

#### Use Unified Template Evaluator

```javascript
// ✅ GOOD: Use UnifiedTemplateEvaluator
import { UnifiedTemplateEvaluator } from '../core/templates/UnifiedTemplateEvaluator.js';

const evaluator = new UnifiedTemplateEvaluator({
  hass: this.hass,
  context: { entity: this._entity },
  dataSourceManager: window.lcards.core.dataSourceManager
});

const result = await evaluator.evaluateAsync(template);

// ❌ BAD: Manual template parsing
if (template.startsWith('{')) {
  // custom parsing logic...
}
```

#### Anime.js v4 Syntax

```javascript
// ✅ GOOD: anime.js v4 syntax
import anime from 'animejs';

anime({
  targets: '.my-element',
  translateX: [0, 100],
  duration: 1000,
  easing: 'easeInOutQuad'
});

// ❌ BAD: anime.js v3 syntax (won't work!)
anime.timeline()
  .add({ targets: '.my-element', translateX: 100 });
```

#### Proper Logging

```javascript
// ✅ GOOD: Structured logging
import { lcardsLog } from '../utils/lcards-logging.js';

lcardsLog.debug('[MyCard] Initializing', { config: this.config });
lcardsLog.info('[MyCard] Processing complete');
lcardsLog.warn('[MyCard] Deprecated usage detected');
lcardsLog.error('[MyCard] Operation failed:', error);

// ❌ BAD: Console logging
console.log('Initializing...');
console.error('Error:', error);
```

### Card Development Pattern

When creating a new card:

1. **Extend the right base:**
   - `LCARdSCard` - Single-purpose cards
   - `LCARdSMSDCard` - Complex multi-overlay displays

2. **Implement lifecycle methods:**
   - `_handleFirstUpdate()` - One-time setup
   - `_handleHassUpdate()` - Update entity references
   - `_renderCard()` - Return card HTML

3. **Register with systems:**
   - Register overlays with RulesEngine
   - Subscribe to DataSources
   - Track provenance

See [Card Development Guide](doc/architecture/cards/lcards-card-foundation.md) for details.

### File Naming

- Card files: `lcards-cardname.js` (e.g., `lcards-button.js`)
- Editor files: `lcards-cardname-editor.js`
- Utility files: `kebab-case.js`
- Class names: `PascalCase`

## Pull Request Process

### Before Submitting

- [ ] Code builds successfully (`npm run build`)
- [ ] No console errors in browser
- [ ] Tested in Home Assistant with multiple scenarios
- [ ] Follows [coding standards](#coding-standards)
- [ ] Documentation updated (if needed)
- [ ] No sensitive data in commits

### PR Guidelines

1. **Use the PR template:** Fill out all relevant sections
2. **Clear title:** Use descriptive titles (e.g., "Fix button click handling in lcards-button")
3. **Link issues:** Reference related issues with "Closes #123"
4. **Small PRs:** Keep changes focused - easier to review!
5. **No merge commits:** Rebase on main if needed
6. **CI must pass:** Address any CI failures

### Review Process

1. **Maintainer review:** A maintainer will review your PR
2. **Feedback:** Address any requested changes
3. **Approval:** Once approved, your PR will be merged
4. **Release:** Changes included in next release

**Note:** This is a hobby project - reviews may take time. Be patient and respectful.

### Commit Messages

Write clear, descriptive commit messages:

```
# Good commit messages
Fix button not responding to tap events on mobile
Add support for vertical orientation to slider card
Update documentation for DataSource configuration

# Less helpful
Fix bug
Update stuff
WIP
```

## Testing Guidelines

### Manual Testing Checklist

Test your changes thoroughly before submitting:

- [ ] **Build succeeds** without errors
- [ ] **No console errors** in browser DevTools
- [ ] **Functionality works** as expected
- [ ] **Edge cases** handled (missing entity, null values, etc.)
- [ ] **Multiple browsers** tested (Chrome, Firefox, Safari)
- [ ] **Mobile** tested (if applicable)
- [ ] **Theme switching** works
- [ ] **Existing cards** still work (no regressions)

### Specific Testing Scenarios

#### For Card Changes
- Test with different entity types
- Test with various states (on/off/unavailable)
- Test with animations enabled/disabled
- Test with rules applied
- Test in light and dark themes

#### For Core System Changes
- Test impact on all card types
- Test with multiple cards simultaneously
- Check browser performance
- Verify backwards compatibility

#### For Editor Changes
- Test all configuration options
- Test YAML editing
- Test visual preview
- Test import/export

### Performance Testing

For performance-sensitive changes:

1. Use browser DevTools Performance profiler
2. Test with dashboards containing 20-50 cards
3. Monitor memory usage
4. Check animation frame rates

## Documentation

Good documentation is crucial! Please update docs when:

- Adding new features
- Changing public APIs
- Modifying configuration options
- Changing behavior
- Adding architecture

### Documentation Locations

- **User docs:** `doc/user-guide/`
- **Architecture docs:** `doc/architecture/`
- **API docs:** JSDoc comments in code
- **Examples:** Inline code examples

### Documentation Style

- Use clear, simple language
- Include code examples
- Add screenshots for UI features
- Link related documentation
- Keep examples up-to-date

## Getting Help

Need help contributing?

- **Questions:** [Discussions Q&A](https://github.com/snootched/LCARdS/discussions/categories/q-a)
- **Ideas:** [Discussions Ideas](https://github.com/snootched/LCARdS/discussions/categories/ideas)
- **Documentation:** [Architecture Docs](doc/architecture/README.md)
- **Issues:** [GitHub Issues](https://github.com/snootched/LCARdS/issues)

## Recognition

All contributors are valued! We recognize contributions by:

- Listing contributors in release notes
- GitHub's automatic contributor graphs
- Crediting in relevant documentation
- Acknowledging in commit messages

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

## Thank You! 🖖

Your contributions help make LCARdS better for everyone. Whether you're fixing a typo or adding a major feature, we appreciate your time and effort.

**Live long and prosper!**

---

*For more technical details, see the [Architecture Documentation](doc/architecture/README.md).*
