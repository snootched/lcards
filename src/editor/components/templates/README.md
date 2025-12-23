# LCARdS Template Components

This directory contains components for template discovery, evaluation, and testing.

## Components

### `lcards-template-evaluation-tab.js`

Main tab component that automatically discovers and evaluates all templates in a card configuration.

**Features:**
- Recursive template discovery across entire card config
- Live evaluation with current entity state
- Filter by template type (JavaScript, Token, DataSource, Theme, Jinja2)
- Copy template/result buttons
- Launch Template Sandbox for detailed testing

**Usage:**
```javascript
<lcards-template-evaluation-tab
  .editor=${this}
  .config=${this.config}
  .hass=${this.hass}>
</lcards-template-evaluation-tab>
```

### `lcards-template-sandbox.js`

Interactive modal for testing templates in isolation with live DataSource integration.

**Features:**
- Three-panel UI (Input, Context, Output)
- Example templates library (14 pre-configured scenarios)
- Mock entity configuration with quick state pickers
- Live DataSource selector with real-time subscriptions
- Dependency tree visualization
- Execution time measurement
- Auto-evaluation with 500ms debounce

**Usage:**
```javascript
<lcards-template-sandbox
  .hass=${this.hass}
  .config=${this.config}
  .open=${true}
  .initialData=${{ template: '{entity.state}', mockEntity: 'light.kitchen' }}
  @sandbox-closed=${this._handleClose}>
</lcards-template-sandbox>
```

**Opening Programmatically:**
```javascript
// From Template Evaluation Tab
_openSandbox() {
  this._sandboxOpen = true;
  this._sandboxInitialData = {
    template: '[[[return entity.state]]]',
    mockEntity: 'light.example',
    mockState: { state: 'on', attributes: {} }
  };
}
```

### `template-examples.js`

Library of pre-configured example templates demonstrating various template types.

**Example Categories:**
- Simple entity state and attributes
- Live DataSources with formatting
- JavaScript conditionals and calculations
- Jinja2 templates with filters
- Theme tokens
- Mixed template types

**API:**
```javascript
import { EXAMPLE_TEMPLATES, getExampleIds, getExample, getExamplesByCategory } from './template-examples.js';

// Get all example IDs
const ids = getExampleIds(); // ['simple-entity', 'datasource-live', ...]

// Get specific example
const example = getExample('javascript-conditional');
// { name: '...', template: '...', description: '...', mockEntity: '...', mockState: {...} }

// Get examples by category
const jsExamples = getExamplesByCategory('javascript');
const dsExamples = getExamplesByCategory('datasource');
```

## Template Types Supported

### JavaScript Templates
```javascript
[[[return entity.state === "on" ? "Active" : "Idle"]]]
```

### Token Templates
```javascript
{entity.state}
{entity.attributes.brightness}
{config.entity}
```

### DataSource Templates
```javascript
{datasource:sensor.temp:.1f}
{ds:sensor.value}
```

### Theme Token Templates
```javascript
{theme:colors.accent.primary}
{theme:typography.fontFamily}
```

### Jinja2 Templates
```javascript
{{states('sensor.temperature') | float | round(1)}}
{% if is_state('light.kitchen', 'on') %}Active{% else %}Idle{% endif %}
```

## Live DataSource Integration

The sandbox provides real-time integration with DataSources:

### Waterfall Resolution
1. **Live DataSource**: Try `window.lcards.core.dataSourceManager.getSource(id)` first
2. **Mock DataSource**: Fall back to user-defined mock values
3. **Warning**: Show warning if not found

### Subscriptions
- Automatically subscribes to referenced DataSources on sandbox open
- Re-evaluates template when DataSource updates
- Shows live indicator (⚡) for connected sources
- Cleans up subscriptions on modal close

### Example
```javascript
// Template references 'sensor.temp' DataSource
template: 'Temperature: {datasource:sensor.temp:.1f}°C'

// Sandbox will:
// 1. Check if dataSourceManager has 'sensor.temp'
// 2. If yes: Subscribe and show ⚡ Live indicator
// 3. If no: Use mock value from YAML input (if provided)
// 4. If neither: Show ❌ Not found warning
```

## Dependency Visualization

The sandbox extracts and displays dependencies with status:

### Entity Dependencies
- Extracts from `{entity.*}` patterns
- Shows ✅ if entity exists in HASS
- Shows ❌ if entity not found

### DataSource Dependencies
- Extracts from `{datasource:*}` and `{ds:*}` patterns
- Shows ⚡ if live DataSource connected
- Shows 🔸 if using mock value
- Shows ❌ if not found

### Theme Token Dependencies
- Extracts from `{theme:*}` patterns
- Shows ✅ if token resolves in current theme
- Shows ❌ if token not found

## Mock Entity System

### Domain-Specific Quick State Pickers

The sandbox provides quick state buttons based on entity domain:

- **light/switch/input_boolean**: On, Off
- **sensor**: 10, 20, 30 (numeric values)
- **climate**: Heat, Cool, Off
- **default**: On, Off, Unknown

### YAML Editor

For complex entity states with attributes:

```yaml
state: on
attributes:
  brightness: 200
  color_temp: 300
  rgb_color: [255, 0, 0]
```

Simple YAML-like syntax:
- `state: value` for entity state
- `attributes:` section for attributes
- Automatic number parsing

## Integration Pattern

### Adding to Card Editors

```javascript
// 1. Import the tab component
import '../components/templates/lcards-template-evaluation-tab.js';

// 2. Add tab definition
tabs.push({ 
  label: 'Templates', 
  content: () => this._renderTemplatesTab() 
});

// 3. Render method
_renderTemplatesTab() {
  return html`
    <lcards-template-evaluation-tab
      .editor=${this}
      .config=${this.config}
      .hass=${this.hass}>
    </lcards-template-evaluation-tab>
  `;
}
```

The Template Sandbox is automatically included via the evaluation tab import.

## Performance

### Auto-Evaluation Debouncing
- Template changes trigger auto-evaluation after 500ms delay
- Prevents excessive re-evaluation during typing
- "Evaluate Now" button for immediate evaluation

### Subscription Management
- Subscribes only to referenced DataSources
- Cleans up all subscriptions on modal close
- Re-subscribes when template changes

### Execution Time Measurement
- Uses `performance.now()` for precise timing
- Displayed in milliseconds with 2 decimal places
- Helps identify slow templates

## Known Limitations

1. **Jinja2 Templates**: Require Home Assistant connection (server-side evaluation)
2. **Mock Entities**: Don't trigger state change events like real entities
3. **Theme Tokens**: Require active theme manager to resolve
4. **DataSource Subscriptions**: Limited to global singleton sources from dataSourceManager
5. **YAML Parser**: Simple parser for mock entity state (not full YAML spec)

## Future Enhancements

- **Insert into Card**: Button to insert tested template into specific config path
- **Template History**: Remember recently tested templates
- **Performance Profiling**: Track and compare template execution times
- **Advanced Mocking**: More sophisticated entity state simulation
- **Export/Import**: Save and share template test scenarios

## Related Documentation

- [Template Evaluation & Theme Browser](../../../doc/TEMPLATE_EVALUATION_THEME_BROWSER.md)
- [LCARdS Template System](../../../doc/templates.md)
- [DataSource System](../../../PHASE3_USAGE_GUIDE.md)
- [Editor Architecture](../../README.md)
