# SimpleCard Token Syntax Migration Guide

## Overview

As of LCARdS v1.9.8, SimpleCard token syntax has changed from double braces `{{token}}` to single braces `{token}` to avoid ambiguity with Home Assistant Jinja2 templates.

## Why the Change?

### Previous Collision
Both SimpleCard tokens and Jinja2 templates used `{{...}}` syntax:

```yaml
# SimpleCard token (client-side)
name: "{{entity.state}}"

# Jinja2 template (server-side)
label: "{{states('sensor.temp') | round(1)}}"
```

This created parsing ambiguity and made it impossible to support both systems.

### New Clear Distinction

```yaml
# SimpleCard tokens - single braces (client-side lookup)
name: "{entity.state}"
label: "{entity.attributes.friendly_name}"

# Jinja2 templates - double braces (server-side rendering)
value: "{{states('sensor.temp') | round(1)}}°C"
temperature: "{{state_attr('climate.home', 'temperature')}}"

# MSD datasources - unchanged (domain.entity syntax)
content: "{sensor.desk_sensor_temperature}"  # MSD datasource
content: "{light.tv.brightness}"              # MSD datasource
```

## Migration Instructions

### Automatic Search & Replace

Use your editor's find/replace function with these patterns:

**Find:** `{{entity.`
**Replace:** `{entity.`

**Find:** `{{variables.`
**Replace:** `{variables.`

**Find:** `{{config.`
**Replace:** `{config.`

**Find:** `{{card.`
**Replace:** `{card.`

### What NOT to Change

Do **not** change these patterns:

1. **Jinja2 function calls** (keep double braces):
   ```yaml
   # Keep as-is - these are Jinja2 functions
   value: "{{states('sensor.temperature')}}"
   label: "{{state_attr('light.tv', 'brightness')}}"
   time: "{{now().strftime('%H:%M')}}"
   ```

2. **Jinja2 filters** (keep double braces):
   ```yaml
   # Keep as-is - these use Jinja2 filters
   value: "{{sensor.temperature | round(1)}}"
   label: "{{value | lower}}"
   ```

3. **Jinja2 statements** (keep double braces):
   ```yaml
   # Keep as-is - these are Jinja2 control structures
   text: "{% if is_state('light.tv', 'on') %}ON{% else %}OFF{% endif %}"
   ```

4. **MSD datasources** (already use single braces correctly):
   ```yaml
   # Already correct - MSD datasources use domain.entity format
   content: "{sensor.temperature}"       # MSD datasource
   content: "{light.living_room.state}"  # MSD datasource
   ```

## Examples

### Before (Old Syntax)

```yaml
type: custom:lcards-simple-card
name: "{entity.attributes.friendly_name}"
label: "{{entity.state}}"
text: "Temperature: {{sensor.temperature}}°C"
```

### After (New Syntax)

```yaml
type: custom:lcards-simple-card
name: "{entity.attributes.friendly_name}"
label: "{entity.state}"
text: "Temperature: {sensor.temperature}°C"
```

### Mixed Templates (New Syntax)

```yaml
type: custom:lcards-simple-card
# SimpleCard token (client-side)
name: "{entity.attributes.friendly_name}"

# Jinja2 template (server-side) - FUTURE SUPPORT
label: "{{states('sensor.temp') | round(1)}}°C"

# MSD datasource (unchanged)
content: "{sensor.desk_sensor_temperature}"
```

## Detection Logic

The system now uses these rules to distinguish template types:

1. **Single braces `{token}`** = SimpleCard token
   - Must NOT contain function calls like `states()`
   - Must NOT use MSD domain prefixes (`sensor.`, `light.`, etc.)
   - Examples: `{entity.state}`, `{variables.color}`

2. **Double braces `{{...}}`** = Jinja2 template
   - Contains function calls: `{{states('entity')}}`
   - Contains filters: `{{value | round}}`
   - Contains statements: `{% if ... %}`

3. **Single braces with domain `{domain.entity}`** = MSD datasource
   - Has domain prefix from known list
   - Examples: `{sensor.temp}`, `{light.desk.brightness}`

## Testing Checklist

After migration, verify:

- [ ] All SimpleCard tokens use single braces `{token}`
- [ ] All Jinja2 templates use double braces `{{template}}`
- [ ] MSD datasources remain unchanged `{domain.entity}`
- [ ] Cards render correctly in Home Assistant
- [ ] Dynamic values update when entities change
- [ ] No console errors related to template parsing

## Rollback

If you need to temporarily rollback:

1. Revert to LCARdS v1.9.7 or earlier
2. Change single braces back to double braces
3. Report any issues on GitHub

## Support

- **Documentation:** See `JINJA2_IMPLEMENTATION_PLAN.md` for full technical details
- **Examples:** See `test/test-overlay-cards.yaml` for working examples
- **Issues:** Report problems on GitHub with `template` label

## Timeline

- **v1.9.7 and earlier:** Double brace tokens `{{entity.state}}`
- **v1.9.8+:** Single brace tokens `{entity.state}`
- **Future releases:** Full Jinja2 support via `HATemplateEvaluator`

---

**Last Updated:** $(date +%Y-%m-%d)
**Related Documents:**
- `JINJA2_IMPLEMENTATION_PLAN.md` - Full implementation roadmap
- `JINJA2_FEASIBILITY_ASSESSMENT.md` - Architecture analysis
- `JINJA2_QUICK_START.md` - Quick reference guide
