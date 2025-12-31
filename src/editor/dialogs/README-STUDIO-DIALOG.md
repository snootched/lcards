# LCARdS Data Grid Configuration Studio Dialog

## Overview

The Configuration Studio Dialog (`lcards-data-grid-studio-dialog`) is a full-screen immersive editor for configuring data-grid cards. It integrates all configuration aspects into a unified workspace with live preview.

## Features

### 1. Full-Screen Immersive Interface
- 95vw × 90vh dialog size for maximum workspace
- Split panel layout: 60% configuration, 40% live preview
- Responsive design that stacks panels on mobile devices

### 2. Visual Mode Selection
Three data modes with prominent card-style buttons:
- **Random Mode**: Decorative LCARS-style grid with auto-generated data
- **Template Mode**: Manual grid with Home Assistant templates
- **DataSource Mode**: Real-time data from sensors or DataSources

### 3. Integrated Grid Designer
- Embeds `lcards-visual-grid-designer` component
- Visual controls for rows, columns, and gap
- Supports both visual and CSS text editor modes

### 4. Mode-Specific Configuration
Context-aware panels that adapt based on selected data mode:

**Random Mode:**
- Data format selection (digit, float, alpha, hex, mixed)
- Auto-refresh interval configuration

**Template Mode:**
- Button to open template editor dialog
- Summary display of configured rows
- Validation warnings for missing configuration

**DataSource Mode:**
- Layout type selection (timeline or spreadsheet)
- Timeline: DataSource picker, history hours
- Spreadsheet: Column/row configuration with spreadsheet editor

### 5. Unified Styling Controls
- Style preset buttons (Classic LCARS, Picard Era, Minimal)
- Color configuration using `lcards-color-section`
- Typography controls (font size, text alignment)

### 6. Animation Configuration
- Cascade animation settings with pattern selection
- Cascade color customization
- Change detection with animation presets

### 7. Live Preview Panel
- Real-time preview of configuration changes
- Sticky positioning (stays visible while scrolling)
- Automatic updates when config changes (debounced)
- Manual refresh button

### 8. Validation & Error Handling
- Comprehensive validation before save
- Visual error display at top of dialog
- Mode-specific validation rules
- Helpful error messages

## Usage

### Basic Example

```javascript
// Create and open the studio dialog
const studio = document.createElement('lcards-data-grid-studio-dialog');
studio.hass = this.hass;
studio.config = {
  type: 'custom:lcards-data-grid',
  data_mode: 'random',
  grid: {
    rows: 8,
    columns: 12,
    gap: 8
  }
};

// Listen for configuration changes
studio.addEventListener('config-changed', (e) => {
  console.log('Config saved:', e.detail.config);
  // Update your card configuration
  this.config = e.detail.config;
  this._fireConfigChanged();
});

// Listen for dialog close
studio.addEventListener('closed', () => {
  studio.remove();
});

// Append to document
document.body.appendChild(studio);
```

### Integration with Card Editor

```javascript
// In your card editor class (e.g., lcards-data-grid-editor.js)
import '../dialogs/lcards-data-grid-studio-dialog.js';

class LCARdSDataGridEditor extends LCARdSBaseEditor {
  
  _openConfigurationStudio() {
    const studio = document.createElement('lcards-data-grid-studio-dialog');
    studio.hass = this.hass;
    studio.config = this.config;
    
    studio.addEventListener('config-changed', (e) => {
      // Update config and notify Home Assistant
      this.config = e.detail.config;
      this._fireConfigChanged();
    });
    
    studio.addEventListener('closed', () => {
      studio.remove();
    });
    
    document.body.appendChild(studio);
  }
  
  _renderDataModeTab() {
    return html`
      <ha-button
        raised
        @click=${this._openConfigurationStudio}>
        <ha-icon icon="mdi:view-dashboard-edit" slot="icon"></ha-icon>
        Open Configuration Studio
      </ha-button>
      
      <!-- Other tab content... -->
    `;
  }
}
```

## Configuration Object Structure

The dialog works with a configuration object that includes:

```javascript
{
  type: 'custom:lcards-data-grid',
  
  // Data mode configuration
  data_mode: 'random' | 'template' | 'datasource',
  
  // Grid layout
  grid: {
    rows: 8,
    columns: 12,
    gap: 8
    // Additional CSS Grid properties...
  },
  
  // Random mode specific
  format: 'mixed' | 'digit' | 'float' | 'alpha' | 'hex',
  refresh_interval: 0,
  
  // Template mode specific
  rows: [
    // Row configurations...
  ],
  
  // DataSource mode specific
  layout: 'timeline' | 'spreadsheet',
  source: 'datasource_id',
  history_hours: 1,
  columns: [/* column configs */],
  
  // Styling
  style: {
    color: '#color',
    background: '#color',
    font_size: 18,
    align: 'left' | 'center' | 'right'
  },
  
  // Animation
  animation: {
    type: 'none' | 'cascade',
    pattern: 'default' | 'niagara' | 'fast' | 'custom',
    colors: {
      start: '#color',
      text: '#color',
      end: '#color'
    },
    highlight_changes: false,
    change_preset: 'pulse' | 'glow' | 'flash'
  }
}
```

## Validation Rules

The dialog validates configuration before saving:

1. **Data mode required**: `data_mode` must be set
2. **Template mode**: Requires at least one configured row
3. **DataSource timeline**: Requires a selected data source
4. **DataSource spreadsheet**: Requires at least one column

Validation errors are displayed prominently at the top of the dialog.

## Style Presets

Three built-in presets are available:

### Classic LCARS
```javascript
{
  style: {
    color: '{theme:colors.lcars.blue}',
    background: 'transparent',
    font_size: 18
  },
  animation: {
    type: 'cascade',
    pattern: 'default',
    colors: {
      start: '{theme:colors.lcars.blue}',
      text: '{theme:colors.lcars.dark-blue}',
      end: '{theme:colors.lcars.moonlight}'
    }
  }
}
```

### Picard Era
```javascript
{
  style: {
    color: '{theme:colors.text.primary}',
    background: '{theme:alpha(colors.grid.cellBackground, 0.05)}',
    font_size: 16
  },
  animation: {
    type: 'cascade',
    pattern: 'niagara',
    colors: {
      start: '{theme:colors.lcars.orange}',
      text: '{theme:colors.lcars.yellow}',
      end: '{theme:colors.lcars.orange}'
    }
  }
}
```

### Minimal
```javascript
{
  style: {
    color: '{theme:colors.text.primary}',
    background: 'transparent',
    font_size: 14
  },
  animation: {
    type: 'none'
  }
}
```

## Events

### config-changed
Fired when the user saves the configuration.

```javascript
studio.addEventListener('config-changed', (e) => {
  const config = e.detail.config;
  // Handle configuration update
});
```

**Detail:**
- `config`: The complete updated configuration object

### closed
Fired when the dialog is closed (save or cancel).

```javascript
studio.addEventListener('closed', () => {
  // Clean up
  studio.remove();
});
```

## Properties

### hass (Object)
**Required.** Home Assistant instance passed from parent component.

### config (Object)
**Required.** Initial card configuration to edit.

## Internal State

The dialog maintains internal state:

- `_workingConfig`: Working copy of configuration (deep cloned)
- `_previewUpdateKey`: Incrementing key to force preview updates
- `_validationErrors`: Array of validation error messages

## Architecture

The dialog follows LCARdS patterns:

1. **Extends LitElement**: Uses Lit for templating and reactivity
2. **Uses lcards-dialog**: Wraps ha-dialog with proper event handling
3. **Integrates existing components**: Reuses visual-grid-designer, live-preview, color-section, etc.
4. **Launches sub-dialogs**: Opens specialized dialogs for template/datasource/spreadsheet configuration
5. **Implements validation**: Validates before save with helpful error messages
6. **Responsive design**: Adapts layout for mobile devices

## Dependencies

The dialog imports and uses:

- `lcards-dialog`: Base dialog wrapper
- `lcards-form-section`: Collapsible sections
- `lcards-message`: Info/warning messages
- `lcards-visual-grid-designer`: Grid configuration
- `lcards-color-section`: Color configuration
- `lcards-data-grid-live-preview`: Live preview
- `lcards-template-editor-dialog`: Template row editor
- `lcards-datasource-picker-dialog`: DataSource selection
- `lcards-spreadsheet-editor-dialog`: Spreadsheet configuration

## Styling

The dialog uses CSS custom properties for theming:

```css
--mdc-dialog-min-width: 95vw;
--mdc-dialog-max-width: 95vw;
--mdc-dialog-min-height: 90vh;
--mdc-dialog-max-height: 90vh;
--primary-color: Theme primary color
--secondary-background-color: Background for panels
--divider-color: Border colors
--card-background-color: Section backgrounds
```

## Best Practices

1. **Always provide HASS**: The dialog needs the hass instance for sub-dialogs and preview
2. **Deep clone config**: The dialog deep clones the config internally
3. **Handle events**: Always listen to both config-changed and closed events
4. **Clean up**: Remove dialog from DOM in closed event handler
5. **Validate first**: The dialog validates before save, but parent can add additional validation

## Troubleshooting

### Dialog doesn't open
- Ensure hass instance is valid
- Check config object structure
- Verify all required imports are present

### Preview not updating
- Check that _triggerPreviewUpdate() is called after config changes
- Verify lcards-data-grid card component is available
- Check browser console for errors

### Sub-dialogs not opening
- Ensure dialog components are imported
- Check that hass instance is passed correctly
- Verify event handlers are attached

### Validation errors
- Check that data_mode is set
- Verify mode-specific required fields
- Review error messages displayed in dialog

## Future Enhancements

Potential improvements:

1. **Undo/Redo**: Add config history navigation
2. **Import/Export**: Allow saving/loading configurations
3. **Templates**: Preset configurations for common layouts
4. **Advanced Validation**: Schema-based validation
5. **Keyboard Shortcuts**: Quick actions via keyboard
6. **Tour Mode**: Guided walkthrough for new users
