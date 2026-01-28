## Description

<!-- Provide a clear and concise description of what this PR does -->

## Type of Change

<!-- Check all that apply -->

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 🔨 Refactoring (code restructure without changing functionality)
- [ ] 📚 Documentation update
- [ ] ⚡ Performance improvement
- [ ] ✅ Tests (adding or updating tests)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to change)

## Related Issues

<!-- Link to related issues using "Closes #123" or "Fixes #456" -->

Closes #

## Breaking Changes

**Does this PR introduce breaking changes?** Yes / No

<!-- If yes, describe what breaks and provide migration guidance -->

<details>
<summary><b>Migration Guide (if breaking changes)</b></summary>

### What breaks:

<!-- Describe what configurations or behaviors change -->

### How to migrate:

<!-- Provide step-by-step migration instructions -->

```yaml
# Before:
type: custom:lcards-button
old_property: value

# After:
type: custom:lcards-button
new_property: value
```

</details>

## Testing

### How was this tested?

<!-- Describe the testing you've done -->

- [ ] Tested manually in Home Assistant
- [ ] Tested with browser developer tools
- [ ] Tested across multiple browsers (list below)
- [ ] Tested with different Home Assistant versions

### Which cards were tested?

<!-- List which LCARdS cards you tested this change with -->

- [ ] lcards-button
- [ ] lcards-slider
- [ ] lcards-msd
- [ ] lcards-chart
- [ ] lcards-data-grid
- [ ] lcards-elbow
- [ ] Other: ___________

### Browser Compatibility

<!-- Which browsers did you test in? -->

- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

## Checklist

<!-- Mark completed items with [x] -->

### Code Quality

- [ ] Code follows [LCARdS coding standards](/.github/copilot-instructions.md)
- [ ] JSDoc comments added/updated for public APIs
- [ ] Code is properly structured (no unnecessary complexity)
- [ ] No `console.log()` statements (use `lcardsLog` instead)
- [ ] Proper error handling implemented

### Architecture Compliance

- [ ] Uses `window.lcards.core.*` singletons (not direct HASS access when applicable)
- [ ] Animation uses anime.js v4 syntax (not v3)
- [ ] Templates use `UnifiedTemplateEvaluator` (not manual parsing)
- [ ] No direct DOM manipulation (uses `this.renderRoot` or Lit patterns)
- [ ] Entity state cached in `_handleHassUpdate()` (not accessed on every render)

### Card-Specific (if applicable)

- [ ] Extends proper base class (`LCARdSCard` or `LCARdSMSDCard`)
- [ ] Implements lifecycle methods correctly (`_handleFirstUpdate`, `_handleHassUpdate`, `_renderCard`)
- [ ] Registers with RulesEngine if using conditional styling
- [ ] Calls `requestUpdate()` after applying rule patches
- [ ] Includes provenance tracking for config changes

### Documentation

- [ ] Documentation updated (if user-facing changes)
- [ ] README updated (if installation/setup changes)
- [ ] Architecture docs updated (if core system changes)
- [ ] JSDoc added for new public APIs
- [ ] Breaking changes documented in CHANGELOG.md

### Build & Testing

- [ ] Code builds successfully (`npm run build`)
- [ ] No TypeScript/lint errors (if applicable)
- [ ] No console errors/warnings in browser
- [ ] Tested with multiple cards on same dashboard
- [ ] Tested theme switching
- [ ] Tested with Rules Engine (if applicable)
- [ ] Tested animations (if applicable)

### Security

- [ ] No hardcoded credentials or sensitive data
- [ ] Input validation implemented (if accepting user input)
- [ ] XSS prevention considered (if rendering user content)
- [ ] Dependencies checked for vulnerabilities (if adding new deps)

## Screenshots/Videos

<!-- If UI changes, provide before/after screenshots or videos -->

### Before

<!-- Screenshot or description of old behavior -->

### After

<!-- Screenshot or description of new behavior -->

## Additional Notes

<!-- Any other information reviewers should know -->

---

**Reviewer Notes:**

<!-- This section is for reviewers to add comments during review -->
