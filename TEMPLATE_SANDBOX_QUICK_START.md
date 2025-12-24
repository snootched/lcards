# Template Sandbox Quick Start Guide

## What is the Template Sandbox?

The Template Sandbox is an interactive testing environment built into the LCARdS card editor. It lets you test templates in isolation without editing your live card configuration, making it perfect for debugging, learning, and experimenting with template syntax.

## How to Open It

### Method 1: From Template Evaluation Tab
1. Open any LCARdS card in edit mode
2. Navigate to the **"Templates"** tab
3. Click the **"🧪 Open Template Sandbox"** button at the top

### Method 2: From a Discovered Template
1. Open any LCARdS card in edit mode
2. Navigate to the **"Templates"** tab
3. Find a template in the list
4. Click the **"🧪 Test in Sandbox"** button on that template card

## Quick Tutorial

### 1. Start with an Example

The easiest way to learn is to start with an example:

1. Click the **"Example Templates"** dropdown in the Input panel
2. Select **"Simple Entity State"**
3. The sandbox will automatically:
   - Load the template: `{entity.state}`
   - Set mock entity to `light.kitchen`
   - Configure mock state to `on`
4. Click **"Evaluate Now"** (or wait 500ms for auto-evaluation)
5. See the result: `"on"` in the Output panel

### 2. Try Different Examples

Explore the 14 pre-configured examples:

**Basic Templates:**
- Simple Entity State
- Entity Attribute
- DataSource (Live)
- DataSource (Short Syntax)

**JavaScript:**
- JavaScript Conditional
- JavaScript Calculation

**Jinja2:**
- Jinja2 Template
- Jinja2 Conditional

**Theme Tokens:**
- Theme Token
- Multiple Theme Tokens

**Mixed:**
- JS + DataSource
- Entity + Theme
- Complex Dashboard

### 3. Customize the Context

**Change the Entity:**
1. In the Context panel, type a different entity ID (e.g., `sensor.temperature`)
2. The template will auto-re-evaluate with the new entity

**Set Quick State:**
1. Click quick state buttons (On, Off, Heat, Cool, etc.)
2. Watch the result update instantly

**Edit Complex State:**
1. Use the YAML editor for attributes:
```yaml
state: on
attributes:
  brightness: 200
  color_temp: 300
```

### 4. Use Live DataSources

If you have DataSources configured:

1. Look in the **"Live DataSources"** dropdown
2. Select a DataSource to see its current value
3. Reference it in your template: `{datasource:sensor.temp}`
4. The sandbox will:
   - Subscribe to live updates (⚡ indicator)
   - Auto-re-evaluate when the DataSource changes
   - Show real-time values

### 5. Check Dependencies

The Output panel shows all dependencies your template uses:

**🏠 Entities:**
- ✅ Available - Entity exists in Home Assistant
- ❌ Not found - Entity doesn't exist

**📊 DataSources:**
- ⚡ Live - Connected to real DataSource
- 🔸 Mock - Using mock value
- ❌ Not found - DataSource doesn't exist

**🎨 Theme Tokens:**
- ✅ Resolved - Token exists in current theme
- ❌ Not found - Token doesn't exist in theme

### 6. Copy Your Work

Once you have a working template:

1. Click **"Copy Template"** to copy the template syntax
2. Or click **"Copy Result"** to copy the evaluated result
3. Paste into your card configuration

## Common Use Cases

### Debugging a Non-Working Template

**Problem:** Your template shows `{entity.state}` instead of the actual state.

**Solution:**
1. Open Template Sandbox
2. Paste your template
3. Check the Dependencies section:
   - Is the entity available? (✅ or ❌)
   - Is the syntax correct?
4. Fix issues and copy working template back

### Learning Template Syntax

**Goal:** Learn how to use JavaScript in templates.

**Steps:**
1. Select **"JavaScript Conditional"** example
2. See how it works: `[[[return entity.state === "on" ? "Active" : "Idle"]]]`
3. Modify it: Try different conditions, different outputs
4. Experiment with `entity.attributes`, `Math` functions, etc.

### Testing DataSource Formatting

**Goal:** Format a DataSource value to 1 decimal place.

**Steps:**
1. Type: `Temperature: {datasource:sensor.temp:.1f}°C`
2. If DataSource exists: See live value formatted
3. If not: Add mock value in Context panel
4. Verify formatting is correct
5. Copy to card config

### Creating Complex Templates

**Goal:** Combine multiple template types.

**Steps:**
1. Start with **"Complex Dashboard"** example
2. See how it combines:
   - JavaScript: `[[[return entity.state === "on" ? "🟢" : "🔴"]]]`
   - Token: `{entity.attributes.friendly_name}`
   - DataSource: `{datasource:sensor.temp:.1f}`
3. Adapt to your needs
4. Test with different entity states
5. Verify all dependencies resolve

## Tips & Tricks

### 1. Auto-Evaluation
- Templates auto-evaluate after 500ms of no typing
- Or click "Evaluate Now" for immediate feedback

### 2. Quick State Testing
- Use quick state buttons to rapidly test different states
- Domain-aware: light (On/Off), sensor (10/20/30), climate (Heat/Cool/Off)

### 3. Mock DataSources
- Add mock values when you don't have real DataSources configured
- Edit the Context panel YAML to add:
```yaml
mockDataSources:
  sensor.temp: 23.5
```

### 4. Execution Time
- Watch the execution time (ms) to identify slow templates
- JavaScript templates are typically <1ms
- Jinja2 templates may take longer (server-side)

### 5. Dependency Tree
- Always check the dependency tree for issues
- Green = good, red = problem, orange = mock/warning

### 6. Copy Early, Copy Often
- Copy working templates immediately
- Experiment in sandbox, not in live config

## Template Type Reference

### Entity Tokens
```javascript
{entity.state}                          // Entity state
{entity.attributes.brightness}          // Attribute value
{entity.attributes.friendly_name}       // Friendly name
```

### DataSource Tokens
```javascript
{datasource:sensor.temp}                // Raw value
{datasource:sensor.temp:.1f}            // Formatted to 1 decimal
{ds:sensor.value}                       // Short syntax
```

### JavaScript Templates
```javascript
[[[return entity.state]]]                                    // Simple
[[[return entity.state === "on" ? "Active" : "Idle"]]]      // Conditional
[[[return Math.round(entity.attributes.temperature)]]]       // Math
```

### Jinja2 Templates
```javascript
{{states('sensor.temperature')}}                            // Get state
{{state_attr('sensor.temp', 'unit_of_measurement')}}       // Get attribute
{{states('sensor.temp') | float | round(1)}}               // With filters
{% if is_state('light.kitchen', 'on') %}Active{% endif %}  // Conditional
```

### Theme Tokens
```javascript
{theme:colors.primary}                  // Primary color
{theme:colors.accent.primary}           // Accent color
{theme:typography.fontFamily}           // Font family
```

## Troubleshooting

### "Template not resolved - check if datasource/token exists"
**Cause:** DataSource or token referenced but not found
**Fix:** 
1. Check Dependencies section
2. Verify DataSource/token name is correct
3. Add mock value or fix reference

### "Evaluated to empty - token/datasource not found"
**Cause:** Token evaluated to empty string
**Fix:**
1. Check entity ID is correct
2. Verify entity exists in Home Assistant
3. Check attribute name spelling

### "❌ Not found" in Dependencies
**Cause:** Referenced resource doesn't exist
**Fix:**
1. For entities: Check Home Assistant states
2. For DataSources: Configure in DataSource Manager
3. For theme tokens: Check theme configuration

### Template doesn't update with DataSource
**Cause:** Not subscribed to live DataSource
**Fix:**
1. Check for ⚡ indicator (should be green)
2. Verify DataSource exists in dataSourceManager
3. Re-open sandbox to re-subscribe

### Jinja2 template shows "⏳ Not evaluated"
**Cause:** Jinja2 requires server-side evaluation
**Note:** This is expected. Jinja2 templates need Home Assistant connection.
**Workaround:** Test in Home Assistant Template Developer Tools

## Keyboard Shortcuts

- **Escape** - Close sandbox
- **Tab** - Navigate between fields
- **Ctrl+Enter** (in textarea) - Evaluate now

## Best Practices

1. **Start with Examples**: Learn from pre-configured examples
2. **Test Incrementally**: Build complex templates step by step
3. **Check Dependencies**: Always verify all resources exist
4. **Use Mock Values**: Test without affecting live configuration
5. **Copy Working Templates**: Save working templates immediately
6. **Monitor Execution Time**: Optimize slow templates
7. **Test Edge Cases**: Try different states (on, off, unavailable, etc.)

## Need Help?

- **Syntax Reference**: See Template Evaluation Tab for syntax examples
- **Examples Library**: 14 examples covering all template types
- **Documentation**: See `TEMPLATE_EVALUATION_THEME_BROWSER.md` for full details
- **Component README**: See `src/editor/components/templates/README.md`

---

**Pro Tip:** The sandbox is completely isolated from your card configuration. Feel free to experiment without fear of breaking anything!
