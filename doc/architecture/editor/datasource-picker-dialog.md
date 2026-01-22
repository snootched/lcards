# DataSource Picker Dialog

## Overview

The DataSource Picker Dialog provides a visual interface for selecting or creating DataSources for the data-grid card's timeline layout mode.

## Features

### Browse Mode
- Lists all existing DataSources in the system
- Shows detailed information for each DataSource:
  - Name/ID
  - Source entity ID
  - Current value
  - History count (number of buffered data points)
  - Last update timestamp
- Search/filter functionality by name or entity ID
- Click to select a DataSource
- Visual feedback for selected items

### Create Mode
- Entity picker with all available Home Assistant entities
- Auto-generates unique DataSource names from entity IDs
- Allows custom naming
- Live entity preview showing:
  - Current state
  - Unit of measurement
  - Friendly name
  - Last changed timestamp
- Creates and registers new DataSource with DataSourceManager

## Usage

### Opening the Dialog

In the data-grid card editor:
1. Select "DataSource" as the data mode
2. Select "Timeline" as the layout type
3. Click the "Select Data Source" button

### Selecting an Existing DataSource

1. Dialog opens in Browse mode by default
2. Use the search box to filter DataSources (optional)
3. Click on a DataSource card to select it
4. Click "Select" button to confirm
5. The selected DataSource ID will be saved to the card's `source` field

### Creating a New DataSource

1. Click the "Create from Entity" tab in the dialog
2. Use the entity picker to select a Home Assistant entity
3. A unique name will be auto-generated (format: `{entity_name}_ds_{timestamp}`)
4. Optionally customize the DataSource name
5. Review the entity preview to confirm it's the right entity
6. Click "Create & Select" button
7. The DataSource will be created and its ID saved to the card's `source` field

## Technical Details

### Components

- **lcards-datasource-picker-dialog.js**: Main dialog component
  - Located: `src/editor/dialogs/`
  - Manages two modes: browse and create
  - Handles DataSource creation and selection
  - Fires `source-selected` event with selected source ID

- **lcards-datasource-card.js**: Reusable DataSource display component
  - Located: `src/editor/components/datasources/`
  - Shows DataSource information in a card format
  - Supports selection state
  - Fires `datasource-click` event

### Integration

The dialog is integrated into the data-grid editor in the timeline layout fields:

```javascript
// Open dialog
async _openDataSourcePickerDialog() {
  const dialog = document.createElement('lcards-datasource-picker-dialog');
  dialog.hass = this.hass;
  dialog.currentSource = this._getConfigValue('source') || '';
  dialog.open = true;
  
  dialog.addEventListener('source-selected', (e) => {
    const selectedSource = e.detail.source;
    this._setConfigValue('source', selectedSource);
  });
  
  document.body.appendChild(dialog);
}
```

### DataSource Creation

When creating a new DataSource, the following configuration is used:

```javascript
{
  name: '{custom_or_generated_name}',
  entity: '{selected_entity_id}',
  attribute: '__state__',
  windowSeconds: 60,
  minEmitMs: 100,
  emitOnSameValue: true,
  history: {
    preload: false,
    hours: 1
  }
}
```

## Configuration Format

The selected DataSource is saved to the card configuration:

```yaml
type: custom:lcards-data-grid
data_mode: datasource
layout: timeline
source: temperature_ds_1735660800000  # DataSource ID or entity ID
history_hours: 1
value_template: '{value}°C'
```

## Notes

- The dialog uses `window.lcards.core.dataSourceManager` singleton to access DataSources
- Auto-generated names include timestamp suffix for uniqueness
- DataSources can be reused across multiple cards
- The dialog cleans up properly when closed
- Follows LCARdS logging conventions for debugging

## Future Enhancements

Potential improvements not included in this implementation:
- Edit existing DataSource configurations
- Bulk DataSource creation from multiple entities
- DataSource templates (aggregate multiple entities)
- Live preview of DataSource values while dialog is open
- Import/export DataSource configurations
