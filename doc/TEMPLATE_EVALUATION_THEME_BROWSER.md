# Template Evaluation & Theme Token Browser - Feature Documentation

## Overview

This document describes the new Template Evaluation Tab and Theme Token Browser features added to the LCARdS card editor system.

## Features

### 1. Template Evaluation Tab

The Template Evaluation Tab helps users discover, debug, and understand all templates and tokens used in their card configuration.

#### Key Features:

- **Automatic Template Discovery**: Recursively scans the entire card configuration to find all templates
- **Live Evaluation**: Evaluates each template in real-time with current entity state and context
- **Multiple Template Types Supported**:
  - JavaScript expressions: `[[[...]]]`
  - LCARdS theme tokens: `{theme:colors.primary}`
  - LCARdS datasource tokens: `{datasource:sensor.temp}` or `{ds:sensor.temp}`
  - LCARdS simple tokens: `{entity.state}`, `{config.entity}`, `{variables.color}`
  - Jinja2 templates: `{{states('sensor.temp')}}`

#### UI Components:

1. **Syntax Reference Panel** (top):
   - Shows all supported template syntaxes with examples
   - Emphasizes the difference between single braces (LCARdS) and double braces (Jinja2)
   - Provides quick reference while editing

2. **Filter Bar**:
   - Filter by template type (All, JavaScript, Theme, Datasource, Token, Jinja2)
   - Shows count for each type
   - Active filters highlighted

3. **Templates Table**:
   - **Path**: Config location (e.g., `text.name.content`, `style.color.default`)
   - **Type**: Badge showing template type with color coding
   - **Template**: Raw template string in code format
   - **Result**: Evaluated value or error message
   - **Status**: Visual indicator (✅ success, ❌ error, ⚠️ pending)
   - **Actions**: Copy button to copy evaluated result

#### Example Use Cases:

1. **Debugging Templates**: When a template doesn't work as expected, see the raw template, evaluated result, and any errors
2. **Discovery**: Find all places where templates are used in your card config
3. **Learning**: Understand the difference between template syntaxes
4. **Migration**: Identify templates that need updating when changing syntax

### 2. Theme Token Browser Tab

The Theme Token Browser helps users discover and use theme tokens with the correct LCARdS syntax.

#### Key Features:

- **Complete Token Tree**: Shows all tokens from the active theme
- **Search & Filter**: Find tokens by path or value
- **Category Filtering**: Filter by token category (colors, typography, spacing, etc.)
- **Usage Tracking**: See where each token is used in the current card config
- **Type-Aware Previews**:
  - Color tokens: Color swatch preview
  - Typography tokens: Font sample preview
  - Spacing tokens: Visual spacing indicator

#### UI Components:

1. **Theme Info Panel** (top):
   - Shows active theme name
   - Total token count
   - Syntax reminder: "Copy format: {theme:token.path}"

2. **Search & Filter Controls**:
   - Search box to filter by token path or value
   - Category chips showing count for each category
   - Active category highlighted

3. **Token Cards Grid**:
   - **Token Path**: Full token path in code format (e.g., `{theme:colors.accent.primary}`)
   - **Category Badge**: Token category label
   - **Value**: Resolved token value
   - **Preview**: Visual preview based on token type
   - **Actions**:
     - "Copy Token" button: Copies proper LCARdS syntax `{theme:token.path}`
     - "Copy Value" button: Copies the resolved value
   - **Usage List**: Shows config paths where this token is used

#### Example Use Cases:

1. **Token Discovery**: Browse all available theme tokens
2. **Color Exploration**: See all color tokens with visual previews
3. **Proper Syntax**: Always copy tokens with the correct `{theme:...}` format
4. **Usage Audit**: Find where specific tokens are used in your config
5. **Theme Migration**: Identify tokens that need updating when switching themes

## Integration

Both tabs are integrated into the button card editor and can be easily added to other card editors.

### For Button Card:

1. Open the button card in edit mode
2. Navigate to the "Templates" tab to see template evaluation
3. Navigate to the "Theme Tokens" tab to browse theme tokens

### Adding to Other Card Editors:

To add these tabs to other card editors (slider, chart, etc.):

1. Import the tab components:
```javascript
import '../components/templates/lcards-template-evaluation-tab.js';
import '../components/templates/lcards-theme-token-browser-tab.js';
```

2. Add to tab definitions:
```javascript
tabs.push(
  { label: 'Templates', content: () => this._renderTemplatesTab() },
  { label: 'Theme Tokens', content: () => this._renderThemeTokensTab() }
);
```

3. Add render methods:
```javascript
_renderTemplatesTab() {
  return html`
    <lcards-template-evaluation-tab
      .editor=${this}
      .config=${this.config}
      .hass=${this.hass}>
    </lcards-template-evaluation-tab>
  `;
}

_renderThemeTokensTab() {
  return html`
    <lcards-theme-token-browser-tab
      .editor=${this}
      .config=${this.config}
      .hass=${this.hass}>
    </lcards-theme-token-browser-tab>
  `;
}
```

## Token Syntax Reference

### LCARdS Tokens (Single Braces)

**Theme Tokens:**
```yaml
# Correct:
color: {theme:colors.accent.primary}

# Wrong (Jinja2 syntax):
color: {{theme:colors.accent.primary}}
```

**Datasource Tokens:**
```yaml
# Explicit syntax (recommended):
content: {datasource:sensor.temperature}
content: {ds:sensor.temperature}

# Legacy syntax (still supported):
content: {sensor.temperature}
```

**Simple Tokens:**
```yaml
# Entity properties:
content: {entity.state}
content: {entity.attributes.friendly_name}

# Config properties:
width: {config.custom_width}

# Variables:
color: {variables.custom_color}
```

### JavaScript Templates (Triple Brackets)

```yaml
content: [[[return entity.state === 'on' ? 'Active' : 'Inactive']]]
color: [[[return entity.attributes.temperature > 25 ? '#ff0000' : '#00ff00']]]
```

### Jinja2 Templates (Double Braces)

```yaml
# Home Assistant functions:
content: {{states('sensor.temperature')}}
content: {{state_attr('sensor.temperature', 'unit_of_measurement')}}

# With filters:
content: {{states('sensor.temperature') | float | round(1)}}
```

## Technical Details

### Template Evaluation Order

Templates are evaluated in the following order:
1. JavaScript templates `[[[...]]]` (synchronous)
2. LCARdS tokens `{...}` (synchronous)
3. Datasource tokens `{datasource:...}` or `{ds:...}` (synchronous)
4. Jinja2 templates `{{...}}` (asynchronous)

### Dependencies

The components rely on:
- `window.lcards.core.themeManager` - For theme token resolution
- `window.lcards.core.dataSourceManager` - For datasource token evaluation
- `UnifiedTemplateEvaluator` - For template evaluation
- `TemplateDetector` - For template type detection

### Error Handling

- Invalid theme tokens: Shows "(not found)" with warning status
- Datasource errors: Shows descriptive error message
- JavaScript errors: Catches and displays error message
- Jinja2 errors: Shows async evaluation status

## Future Enhancements

Possible future additions (not in current implementation):

1. **Token Override Editor**:
   - Visual editor for card-level token overrides
   - Preview token changes in real-time

2. **Template Suggestions**:
   - AI-powered template suggestions based on context
   - Common template patterns library

3. **Performance Monitoring**:
   - Track template evaluation performance
   - Identify slow templates

## Template Sandbox Modal ✨

The Template Sandbox is an interactive testing environment for templates, integrated into the Template Evaluation Tab.

### Key Features

**Three-Panel Interactive UI:**

1. **Input Panel (Left)**:
   - Monaco-style code editor for template input
   - Example templates dropdown with pre-configured scenarios
   - Syntax highlighting and type detection badges
   - Character and line count display

2. **Context Panel (Middle)**:
   - **Mock Entity Configuration**:
     - Entity ID input field
     - Quick state picker buttons for common domains (light: on/off, sensor: numeric values)
     - YAML editor for full entity state/attributes customization
   - **Live DataSource Selector**:
     - Dropdown of available DataSources from `window.lcards.core.dataSourceManager`
     - Real-time value display with timestamp
     - Subscription status indicator (⚡ for live)
     - Automatic re-evaluation on DataSource updates
   - **Active Theme Display**: Shows currently active theme name

3. **Output Panel (Right)**:
   - Evaluated result display with status indicator (✅/❌/⚠️)
   - Execution time measurement
   - **Dependency Tree Visualization**:
     - Entity dependencies (with availability status)
     - DataSource dependencies (live vs mock indicator)
     - Theme token dependencies (resolution status)
   - **Action Buttons**:
     - Copy Result
     - Copy Template
     - Insert into Card (future enhancement)

### Live DataSource Integration

The sandbox provides real-time integration with DataSources:

**Waterfall Resolution Strategy:**
1. Try real DataSource first (from `dataSourceManager`)
2. Fall back to mock DataSource from YAML input
3. Show warning if not found

**Live Subscriptions:**
- Automatically subscribes to referenced DataSources
- Re-evaluates template when DataSource updates
- Shows live indicator (⚡) for connected sources
- Cleans up subscriptions when modal closes

### Example Templates Library

The sandbox includes 14 pre-configured example templates:

- **Simple Entity State**: `{entity.state}`
- **Entity Attribute**: `Brightness: {entity.attributes.brightness}`
- **Live DataSource**: `Temperature: {datasource:sensor.temp:.1f}°C`
- **DataSource (Short Syntax)**: `Value: {ds:sensor.value}`
- **JavaScript Conditional**: `[[[return entity.state === "on" ? "Active" : "Idle"]]]`
- **JavaScript Calculation**: Temperature conversion with Math operations
- **Jinja2 Template**: `{{states("sensor.temperature") | float | round(1)}}°C`
- **Jinja2 Conditional**: `{% if is_state("light.kitchen", "on") %}Active{% else %}Idle{% endif %}`
- **Theme Token**: `Color: {theme:colors.accent.primary}`
- **Multiple Theme Tokens**: Multiple tokens in one template
- **Mixed: JS + DataSource**: Combining JavaScript and DataSource templates
- **Mixed: Entity + Theme**: Combining entity tokens and theme tokens
- **Complex Dashboard**: Multi-type template with emojis and formatting

### Usage

**From Template Evaluation Tab:**

1. Click "🧪 Open Template Sandbox" button in the tab header
2. Or click "🧪 Test in Sandbox" on any discovered template card

**Testing Workflow:**

1. **Select an Example** (optional):
   - Choose from dropdown to auto-populate template, entity, and mock data

2. **Enter Template**:
   - Type or paste your template
   - See detected types badge (JS, Token, DataSource, Jinja2)

3. **Configure Context**:
   - Set mock entity ID
   - Use quick state buttons or edit YAML directly
   - Select live DataSources if available

4. **Evaluate**:
   - Click "Evaluate Now" or wait for auto-evaluation (500ms debounce)
   - View result with execution time
   - Inspect dependency tree for availability status

5. **Use Results**:
   - Copy evaluated result for use elsewhere
   - Copy template back to card configuration
   - Iterate and refine based on output

### Technical Details

**Template Evaluation:**
- Uses `UnifiedTemplateEvaluator` directly (not via LCARdSCard)
- Supports all template types: JavaScript, Tokens, DataSource, Jinja2
- Measures execution time with `performance.now()`
- Handles async evaluation for Jinja2 templates

**Dependency Extraction:**
- Entity references: `{entity.*}` patterns
- DataSource references: `{datasource:*}` or `{ds:*}` patterns
- Theme token references: `{theme:*}` patterns
- Shows availability status for each dependency

**Mock Entity System:**
- Domain-specific quick state pickers (light, switch, sensor, climate)
- YAML editor for complex attribute structures
- Falls back to real entity from HASS if available

**DataSource Subscriptions:**
- Subscribes to all referenced DataSources on open
- Automatically re-evaluates on updates
- Cleans up subscriptions on close
- Shows live value with timestamp

### Integration Pattern

The sandbox is integrated into any card editor with Template Evaluation Tab:

```javascript
// Already included in lcards-template-evaluation-tab.js
import './lcards-template-sandbox.js';

// Rendered automatically in evaluation tab
${this._renderSandbox()}
```

### Limitations

- Jinja2 templates require Home Assistant connection (server-side evaluation)
- Mock entities don't trigger state change events
- Theme token resolution requires active theme manager
- DataSource subscriptions limited to global singleton sources

## Related Documentation

- [LCARdS Template System](../doc/templates.md)
- [Theme Token System](../doc/themes.md)
- [Datasource System](../PHASE3_USAGE_GUIDE.md)
- [Card Editor Architecture](../VISUAL_EDITOR_PHASE1_SUMMARY.md)

## Migration Notes

If you have existing configurations using incorrect token syntax:

### Before:
```yaml
# Incorrect (double braces for theme tokens)
style:
  color: {{theme:colors.primary}}
```

### After:
```yaml
# Correct (single braces for theme tokens)
style:
  color: {theme:colors.primary}
```

The Template Evaluation Tab will help identify these issues by showing warning/error status for improperly formatted tokens.

## Support

For issues or questions:
- Check the syntax reference panel in the Template Evaluation Tab
- Review theme token formats in the Theme Token Browser
- Consult the [main documentation](../README.md)
- Report bugs via GitHub issues
