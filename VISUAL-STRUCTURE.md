# Configuration Studio Dialog - Visual Structure

## Component Hierarchy

```
LCARdSDataGridStudioDialog (LitElement)
│
├── lcards-dialog (wrapper)
│   ├── Heading: "Configuration Studio"
│   ├── Primary Action: Save Button
│   └── Secondary Action: Cancel Button
│
└── Dialog Content (Split Panel Layout)
    │
    ├── LEFT PANEL (60% - Config)
    │   │
    │   ├── Validation Errors Display
    │   │   └── Visual error list (conditional)
    │   │
    │   ├── Mode Selector Section
    │   │   └── lcards-form-section
    │   │       └── 3 Mode Cards (grid)
    │   │           ├── Random Mode Card
    │   │           │   ├── Icon: mdi:dice-multiple
    │   │           │   ├── Title: "Random Data"
    │   │           │   └── Description
    │   │           ├── Template Mode Card
    │   │           │   ├── Icon: mdi:table-edit
    │   │           │   ├── Title: "Template Grid"
    │   │           │   └── Description
    │   │           └── DataSource Mode Card
    │   │               ├── Icon: mdi:database
    │   │               ├── Title: "Live Data"
    │   │               └── Description
    │   │
    │   ├── Grid Designer Section
    │   │   └── lcards-form-section
    │   │       └── lcards-visual-grid-designer
    │   │           ├── Mode Toggle (Visual/CSS)
    │   │           ├── Rows Control
    │   │           ├── Columns Control
    │   │           ├── Gap Control
    │   │           └── Grid Preview Canvas
    │   │
    │   ├── Mode-Specific Configuration
    │   │   │
    │   │   ├── Random Mode Config
    │   │   │   └── lcards-form-section
    │   │   │       ├── ha-select (format)
    │   │   │       └── ha-textfield (refresh_interval)
    │   │   │
    │   │   ├── Template Mode Config
    │   │   │   └── lcards-form-section
    │   │   │       ├── lcards-message (info)
    │   │   │       ├── ha-button (edit rows)
    │   │   │       └── Row Summary Display
    │   │   │
    │   │   └── DataSource Mode Config
    │   │       └── lcards-form-section
    │   │           ├── ha-select (layout type)
    │   │           ├── Timeline Controls
    │   │           │   ├── ha-button (picker)
    │   │           │   ├── Source Display
    │   │           │   └── ha-textfield (hours)
    │   │           └── Spreadsheet Controls
    │   │               ├── ha-button (editor)
    │   │               └── Config Summary
    │   │
    │   ├── Styling Section
    │   │   ├── Style Presets
    │   │   │   └── lcards-form-section
    │   │   │       └── Preset Buttons (grid)
    │   │   │           ├── Classic LCARS
    │   │   │           ├── Picard Era
    │   │   │           └── Minimal
    │   │   │
    │   │   ├── Colors
    │   │   │   └── lcards-color-section
    │   │   │       ├── Text Color Picker
    │   │   │       └── Background Picker
    │   │   │
    │   │   └── Typography
    │   │       └── lcards-form-section
    │   │           ├── ha-textfield (font_size)
    │   │           └── ha-select (align)
    │   │
    │   └── Animation Section
    │       ├── Cascade Animation
    │       │   └── lcards-form-section
    │       │       ├── ha-select (type)
    │       │       ├── ha-select (pattern)
    │       │       └── lcards-color-section (cascade colors)
    │       │
    │       └── Change Detection
    │           └── lcards-form-section
    │               ├── ha-switch (enable)
    │               └── ha-select (preset)
    │
    └── RIGHT PANEL (40% - Preview)
        └── lcards-data-grid-live-preview
            ├── Preview Header
            │   ├── Title: "Live Preview"
            │   └── Refresh Button
            ├── Preview Card Container
            │   └── <lcards-data-grid> (live)
            └── Preview Footer
                └── Status Information
```

## Event Flow

```
User Actions → Component Methods → State Updates → Preview Updates
     │              │                    │              │
     ▼              ▼                    ▼              ▼
┌─────────┐  ┌──────────┐  ┌────────────────┐  ┌──────────────┐
│ Click   │→ │_handleMode│→ │_workingConfig  │→ │_triggerPreview│
│ Mode    │  │Change()   │  │.data_mode =    │  │Update()       │
│ Card    │  │           │  │'template'      │  │               │
└─────────┘  └──────────┘  └────────────────┘  └──────────────┘
                                   │                    │
                                   ▼                    ▼
                          ┌────────────────┐  ┌──────────────┐
                          │requestUpdate() │  │_previewUpdate│
                          │                │  │Key++         │
                          └────────────────┘  └──────────────┘
                                   │                    │
                                   └──────────┬─────────┘
                                              ▼
                                    ┌──────────────────┐
                                    │ Re-render with   │
                                    │ updated preview  │
                                    └──────────────────┘
```

## Dialog Lifecycle

```
Creation
    │
    ▼
┌─────────────────────┐
│ Constructor         │
│ - Initialize props  │
│ - Set defaults      │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│ connectedCallback() │
│ - Deep clone config │
│ - Set data_mode     │
│ - Init grid         │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│ render()            │
│ - Mode selector     │
│ - Grid designer     │
│ - Config panels     │
│ - Styling           │
│ - Animation         │
│ - Live preview      │
└─────────────────────┘
    │
    ▼
┌─────────────────────┐
│ User Interactions   │
│ - Change mode       │
│ - Adjust grid       │
│ - Apply preset      │
│ - Open sub-dialogs  │
│ - Modify settings   │
└─────────────────────┘
    │
    ├─→ Save Path
    │   │
    │   ▼
    │   ┌─────────────────────┐
    │   │ _validateConfig()   │
    │   │ - Check required    │
    │   │ - Mode-specific     │
    │   └─────────────────────┘
    │       │
    │       ├─→ Valid
    │       │   │
    │       │   ▼
    │       │   ┌─────────────────────┐
    │       │   │ _handleSave()       │
    │       │   │ - Fire config-      │
    │       │   │   changed event     │
    │       │   │ - Close dialog      │
    │       │   └─────────────────────┘
    │       │
    │       └─→ Invalid
    │           │
    │           ▼
    │           ┌─────────────────────┐
    │           │ Display Errors      │
    │           │ - Show error list   │
    │           │ - requestUpdate()   │
    │           └─────────────────────┘
    │
    └─→ Cancel Path
        │
        ▼
        ┌─────────────────────┐
        │ _handleCancel()     │
        │ - Discard changes   │
        │ - Fire closed event │
        └─────────────────────┘
            │
            ▼
        ┌─────────────────────┐
        │ Dialog Cleanup      │
        │ - Remove from DOM   │
        │ - Event cleanup     │
        └─────────────────────┘
```

## Sub-Dialog Integration

```
Configuration Studio
         │
         ├─→ Template Mode
         │   │
         │   └─→ Click "Edit Template Rows"
         │       │
         │       ▼
         │   ┌───────────────────────────────┐
         │   │ lcards-template-editor-dialog │
         │   │ - Configure rows              │
         │   │ - Cell templates              │
         │   │ - Row styling                 │
         │   └───────────────────────────────┘
         │       │
         │       └─→ rows-changed event
         │           │
         │           ▼
         │       ┌───────────────────┐
         │       │ Update _working   │
         │       │ Config.rows       │
         │       └───────────────────┘
         │
         ├─→ DataSource Timeline
         │   │
         │   └─→ Click "Select Data Source"
         │       │
         │       ▼
         │   ┌────────────────────────────────┐
         │   │ lcards-datasource-picker-dialog│
         │   │ - Browse existing              │
         │   │ - Create new                   │
         │   │ - Entity picker                │
         │   └────────────────────────────────┘
         │       │
         │       └─→ source-selected event
         │           │
         │           ▼
         │       ┌───────────────────┐
         │       │ Update _working   │
         │       │ Config.source     │
         │       └───────────────────┘
         │
         └─→ DataSource Spreadsheet
             │
             └─→ Click "Configure Spreadsheet"
                 │
                 ▼
             ┌─────────────────────────────────┐
             │ lcards-spreadsheet-editor-dialog│
             │ - Column configuration          │
             │ - Row configuration             │
             │ - DataSource binding            │
             └─────────────────────────────────┘
                 │
                 └─→ config-changed event
                     │
                     ▼
                 ┌───────────────────┐
                 │ Update _working   │
                 │ Config.columns,   │
                 │ rows, datasources │
                 └───────────────────┘
```

## State Management Flow

```
┌──────────────────────────────────────────────────────┐
│ Initial Config (prop)                                │
│ { data_mode: 'random', grid: {...}, style: {...} }  │
└──────────────────────────────────────────────────────┘
                    │
                    │ Deep Clone in connectedCallback()
                    ▼
┌──────────────────────────────────────────────────────┐
│ _workingConfig (state)                               │
│ { data_mode: 'random', grid: {...}, style: {...} }  │
└──────────────────────────────────────────────────────┘
                    │
                    │ User Edits
                    ▼
┌──────────────────────────────────────────────────────┐
│ Config Update Methods                                │
│ - _updateConfig(path, value)                         │
│ - _updateNestedConfig(path, value)                   │
│ - _applyStylePreset(presetName)                      │
└──────────────────────────────────────────────────────┘
                    │
                    ├─→ _triggerPreviewUpdate()
                    │   └─→ _previewUpdateKey++
                    │
                    └─→ requestUpdate()
                        └─→ Re-render
```

## Responsive Layout Breakpoints

```
Desktop (> 1024px)
┌────────────────────────────────────────────┐
│ ┌──────────────────┬───────────────────┐   │
│ │                  │                   │   │
│ │   Config (60%)   │   Preview (40%)   │   │
│ │                  │                   │   │
│ │   Scrollable     │   Sticky          │   │
│ │                  │                   │   │
│ └──────────────────┴───────────────────┘   │
└────────────────────────────────────────────┘

Tablet/Mobile (≤ 1024px)
┌────────────────────────────────────────────┐
│ ┌────────────────────────────────────────┐ │
│ │                                        │ │
│ │   Config Panel                         │ │
│ │   (scrollable)                         │ │
│ │                                        │ │
│ └────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────┐ │
│ │                                        │ │
│ │   Preview Panel                        │ │
│ │   (max-height: 400px)                  │ │
│ │                                        │ │
│ └────────────────────────────────────────┘ │
└────────────────────────────────────────────┘

Mobile (≤ 768px)
┌───────────────────┐
│ ┌───────────────┐ │
│ │               │ │
│ │ Config Panel  │ │
│ │ (scrollable)  │ │
│ │               │ │
│ │ Mode Cards    │ │
│ │ Stacked       │ │
│ │               │ │
│ └───────────────┘ │
│ ┌───────────────┐ │
│ │               │ │
│ │ Preview Panel │ │
│ │               │ │
│ └───────────────┘ │
└───────────────────┘
```

## CSS Architecture

```
Component Styles
│
├── Dialog Sizing
│   ├── --mdc-dialog-min-width: 95vw
│   ├── --mdc-dialog-max-width: 95vw
│   ├── --mdc-dialog-min-height: 90vh
│   └── --mdc-dialog-max-height: 90vh
│
├── Layout Grid
│   ├── grid-template-columns: 60% 40%
│   ├── gap: 16px
│   └── @media (max-width: 1024px)
│       └── grid-template-columns: 1fr
│
├── Mode Selector
│   ├── display: grid
│   ├── grid-template-columns: repeat(3, 1fr)
│   ├── gap: 12px
│   └── .mode-card
│       ├── padding: 24px
│       ├── border: 2px solid
│       ├── border-radius: 8px
│       └── .active
│           └── border-color: primary-color
│
├── Config Panel
│   ├── display: flex
│   ├── flex-direction: column
│   ├── gap: 16px
│   └── overflow-y: auto
│
└── Preview Panel
    ├── position: sticky
    ├── top: 0
    └── max-height: calc(90vh - 120px)
```

## Key Design Patterns

### 1. Deep Clone Pattern
```javascript
connectedCallback() {
  // Prevent mutations to original config
  this._workingConfig = JSON.parse(JSON.stringify(this.config || {}));
}
```

### 2. Preview Update Pattern
```javascript
_updateConfig(path, value) {
  this._workingConfig[path] = value;
  this._triggerPreviewUpdate();  // Increment key
  this.requestUpdate();           // Trigger render
}
```

### 3. Nested Config Update Pattern
```javascript
_updateNestedConfig(path, value) {
  const keys = path.split('.');
  let obj = this._workingConfig;
  
  // Navigate to parent
  for (let i = 0; i < keys.length - 1; i++) {
    if (!obj[keys[i]]) obj[keys[i]] = {};
    obj = obj[keys[i]];
  }
  
  // Set value
  obj[keys[keys.length - 1]] = value;
}
```

### 4. Validation Pattern
```javascript
_validateConfig() {
  this._validationErrors = [];
  
  // Rule-based validation
  if (!this._workingConfig.data_mode) {
    this._validationErrors.push('Data mode is required');
  }
  
  // Mode-specific validation
  if (mode === 'template' && !rows.length) {
    this._validationErrors.push('Template mode requires rows');
  }
  
  return this._validationErrors.length === 0;
}
```

### 5. Sub-Dialog Launch Pattern
```javascript
async _openTemplateEditorDialog() {
  const dialog = document.createElement('lcards-template-editor-dialog');
  dialog.hass = this.hass;
  dialog.rows = this._workingConfig.rows || [];
  
  dialog.addEventListener('rows-changed', (e) => {
    this._workingConfig.rows = e.detail.rows;
    this._triggerPreviewUpdate();
  });
  
  dialog.addEventListener('closed', () => {
    dialog.remove();
  });
  
  document.body.appendChild(dialog);
}
```

## Performance Considerations

1. **Deep Clone**: Only performed once on connect
2. **Debounced Updates**: Preview updates are debounced (300ms)
3. **Lazy Rendering**: Mode-specific panels only render when active
4. **Event Delegation**: Single event listeners for repeated elements
5. **Efficient Updates**: Only update what changed via requestUpdate()
