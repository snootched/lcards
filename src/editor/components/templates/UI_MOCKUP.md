# Template Sandbox UI Mockup

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         🧪 Template Sandbox                              [Close] │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐     │
│  │  📝 Template Input  │  │   ⚙️ Context        │  │   ✅ Output         │     │
│  ├─────────────────────┤  ├─────────────────────┤  ├─────────────────────┤     │
│  │                     │  │                     │  │                     │     │
│  │ Example Templates   │  │ Mock Entity         │  │ Result              │     │
│  │ ┌─────────────────┐ │  │ ┌─────────────────┐ │  │ ┌─────────────────┐ │     │
│  │ │-- Select an     │▼│  │ │light.kitchen    │ │  │ │ ✅ Success      │ │     │
│  │ │   example --     │ │  │ └─────────────────┘ │  │ │                 │ │     │
│  │ └─────────────────┘ │  │                     │  │ │ "on"            │ │     │
│  │                     │  │ Quick State         │  │ │                 │ │     │
│  │ Template            │  │ [On] [Off]          │  │ │ 0.23ms          │ │     │
│  │ ┌─────────────────┐ │  │                     │  │ └─────────────────┘ │     │
│  │ │{entity.state}   │ │  │ Entity State (YAML) │  │                     │     │
│  │ │                 │ │  │ ┌─────────────────┐ │  │ Dependencies        │     │
│  │ │                 │ │  │ │state: on        │ │  │ ┌─────────────────┐ │     │
│  │ │                 │ │  │ │attributes:      │ │  │ │🏠 Entities      │ │     │
│  │ │                 │ │  │ │  brightness: 200│ │  │ │ light.kitchen   │ │     │
│  │ └─────────────────┘ │  │ └─────────────────┘ │  │ │ ✅ Available    │ │     │
│  │                     │  │                     │  │ └─────────────────┘ │     │
│  │ 🏷️ Token            │  │ Live DataSources    │  │                     │     │
│  │ 1 line, 14 chars    │  │ ┌─────────────────┐ │  │ ┌─────────────────┐ │     │
│  │                     │  │ │-- Available DS  │▼│  │ │📊 DataSources   │ │     │
│  │ [Evaluate Now]      │  │ └─────────────────┘ │  │ │ sensor.temp     │ │     │
│  │                     │  │                     │  │ │ ⚡ Live (23.5°C) │ │     │
│  │                     │  │ Active Theme        │  │ └─────────────────┘ │     │
│  │                     │  │ LCARdS Default      │  │                     │     │
│  │                     │  │                     │  │ ┌─────────────────┐ │     │
│  │                     │  │                     │  │ │🎨 Theme Tokens  │ │     │
│  │                     │  │                     │  │ │ colors.primary  │ │     │
│  │                     │  │                     │  │ │ ✅ Resolved     │ │     │
│  │                     │  │                     │  │ └─────────────────┘ │     │
│  │                     │  │                     │  │                     │     │
│  │                     │  │                     │  │ [Copy Result]       │     │
│  │                     │  │                     │  │ [Copy Template]     │     │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘     │
│                                                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Panel Descriptions

### Left Panel: Template Input
- **Example Templates Dropdown**: Select from 14 pre-configured examples
- **Template Textarea**: Enter or edit your template (auto-evaluation after 500ms)
- **Type Badge**: Shows detected template types (JS, Token, DataSource, Jinja2)
- **Meta Info**: Line count and character count
- **Evaluate Button**: Manual trigger for immediate evaluation

### Middle Panel: Context
- **Mock Entity Section**:
  - Entity ID input field
  - Quick state picker buttons (domain-aware: light, switch, sensor, climate)
  - YAML editor for complex entity states with attributes
  
- **Live DataSource Section**:
  - Dropdown showing all available DataSources from dataSourceManager
  - Real-time value display with timestamp
  - Live indicator (⚡) when connected to real DataSource
  
- **Theme Info**:
  - Display current active theme name

### Right Panel: Output
- **Result Display**:
  - Status icon (✅ success, ❌ error, ⚠️ warning)
  - Evaluated template result
  - Execution time in milliseconds
  
- **Dependency Tree**:
  - **Entities**: Shows referenced entities with availability status
  - **DataSources**: Shows referenced datasources with live/mock/missing status
  - **Theme Tokens**: Shows referenced theme tokens with resolution status
  
- **Action Buttons**:
  - Copy Result: Copy evaluated result to clipboard
  - Copy Template: Copy template syntax to clipboard

## Status Indicators

### Success (✅)
- Green border/background
- Template evaluated successfully
- All dependencies resolved

### Error (❌)
- Red border/background
- Template evaluation failed
- Shows error message
- Dependency not found

### Warning (⚠️)
- Orange border/background
- Template partially resolved
- Some dependencies missing

### Live (⚡)
- Green background
- Connected to real DataSource
- Auto-updates on DataSource changes

### Mock (🔸)
- Orange background
- Using mock DataSource value
- Not connected to real DataSource

## Example Template Categories

1. **Simple Entity** - `{entity.state}`
2. **Entity Attribute** - `{entity.attributes.brightness}`
3. **DataSource** - `{datasource:sensor.temp:.1f}°C`
4. **JavaScript** - `[[[return entity.state === "on" ? "Active" : "Idle"]]]`
5. **Jinja2** - `{{states('sensor.temp') | float | round(1)}}`
6. **Theme Token** - `{theme:colors.accent.primary}`
7. **Mixed** - Combination of multiple template types

## Responsive Behavior

**Desktop (>1200px):**
- Three columns side-by-side
- Full width for each panel
- Horizontal scrolling if needed

**Tablet/Mobile (<1200px):**
- Single column layout
- Panels stacked vertically
- Vertical scrolling
- Same functionality, optimized for smaller screens

## Interaction Flow

1. **Open Sandbox**:
   - Click "🧪 Open Template Sandbox" in Template Evaluation Tab header
   - Or click "🧪 Test in Sandbox" on any template card

2. **Select Example** (optional):
   - Choose from dropdown
   - Auto-populates template, entity ID, and mock data

3. **Edit Template**:
   - Type in template textarea
   - See type badges update in real-time
   - Auto-evaluation after 500ms typing pause

4. **Configure Context**:
   - Set entity ID (or use real entity from HASS)
   - Use quick state buttons or YAML editor
   - Select live DataSources if available

5. **Review Output**:
   - Check evaluation result and status
   - Review execution time
   - Inspect dependency tree for issues

6. **Take Action**:
   - Copy result for use elsewhere
   - Copy template to paste in card config
   - Iterate and refine based on feedback

7. **Close**:
   - Click Close button
   - Or press Escape key
   - Subscriptions automatically cleaned up
