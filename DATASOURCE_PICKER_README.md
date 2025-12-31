# DataSource Picker Dialog Implementation

## Summary

This PR implements a complete DataSource picker dialog for the data-grid card's timeline layout mode, allowing users to select existing DataSources or create new ones from Home Assistant entities.

## What's New

### 1. DataSource Picker Dialog
**File:** `src/editor/dialogs/lcards-datasource-picker-dialog.js`

A dual-mode modal dialog:
- **Browse Mode**: Lists all existing DataSources with search/filter
- **Create Mode**: Entity picker with auto-generated names

Features:
- Real-time DataSource info (value, history, last update)
- Search/filter by name or entity ID
- Entity preview with state and attributes
- Auto-generated unique names with timestamp
- Proper validation and error handling

### 2. DataSource Card Component
**File:** `src/editor/components/datasources/lcards-datasource-card.js`

Reusable card component for displaying DataSource information:
- Visual representation of DataSource details
- Selection state with hover effects
- Relative timestamp formatting
- Responsive design

### 3. Data-Grid Editor Integration
**File:** `src/editor/cards/lcards-data-grid-editor.js`

Updated timeline layout section:
- Replaced placeholder with functional "Select Data Source" button
- Added DataSource selection dialog
- Added DataSource summary display
- Proper event handling and cleanup

## User Experience

### Selecting a DataSource
1. Open data-grid card editor
2. Choose "DataSource" mode → "Timeline" layout
3. Click "Select Data Source" button
4. Browse existing sources or create new one
5. Confirm selection
6. Source automatically saved to configuration

### Creating a DataSource
1. Switch to "Create from Entity" tab
2. Pick any Home Assistant entity
3. Name auto-generates (or customize)
4. Preview shows entity state
5. Click "Create & Select"
6. DataSource registered and selected

## Technical Details

### Architecture
- Uses `window.lcards.core.dataSourceManager` singleton
- Follows LCARdS dialog patterns
- Lit-based web components
- Event-driven communication

### Configuration
```yaml
type: custom:lcards-data-grid
data_mode: datasource
layout: timeline
source: sensor.temperature  # or DataSource ID
history_hours: 1
value_template: '{value}°C'
```

### Events
- `source-selected`: Fired when DataSource selected/created
- `closed`: Fired when dialog closes
- `datasource-click`: Fired when DataSource card clicked

## Files Changed

### New Files
- `src/editor/dialogs/lcards-datasource-picker-dialog.js` (738 lines)
- `src/editor/components/datasources/lcards-datasource-card.js` (226 lines)
- `doc/editor/datasource-picker-dialog.md` (143 lines)
- `doc/editor/datasource-picker-validation.md` (264 lines)

### Modified Files
- `src/editor/cards/lcards-data-grid-editor.js` (+104 lines, -14 lines)

### Build Output
- `dist/lcards.js` (2.8 MB, +components)

## Testing

### Build Status
✅ Build successful with no errors
```bash
npm run build
# webpack 5.97.0 compiled with 3 warnings in 25816 ms
```

### Manual Testing Required
See `doc/editor/datasource-picker-validation.md` for comprehensive testing checklist.

Test in Home Assistant:
1. Copy `dist/lcards.js` to `www/community/lcards/`
2. Hard refresh browser
3. Test browse and create modes
4. Verify YAML sync
5. Check edge cases

## Documentation

- **User Guide**: `doc/editor/datasource-picker-dialog.md`
  - Usage instructions
  - Technical implementation
  - Configuration format
  
- **Validation**: `doc/editor/datasource-picker-validation.md`
  - Build verification
  - Code quality checks
  - Manual testing checklist
  - Known limitations

## Code Quality

✅ Follows LCARdS conventions:
- Proper logging with `lcardsLog`
- Singleton access patterns
- Event bubbling and composition
- Clean lifecycle management
- Responsive styling
- Error handling throughout

✅ Integration:
- Uses existing shared components
- Consistent with template editor dialog
- Proper Home Assistant component usage
- Theme variable support

## Future Enhancements

Not included in this PR (future work):
- Edit existing DataSource configurations
- Advanced config options in create mode
- Live value updates while dialog open
- Bulk creation from multiple entities
- DataSource templates for aggregation
- Import/export configurations

## Dependencies

No new external dependencies added. Uses existing:
- Lit (web components)
- Home Assistant components (ha-entity-picker, ha-textfield)
- LCARdS shared components (lcards-dialog, lcards-message)

## Breaking Changes

None. This is a pure feature addition with no breaking changes.

## Migration

No migration required. Existing configurations continue to work.

## Browser Compatibility

Same as LCARdS core:
- Modern browsers with ES6+ support
- Home Assistant supported browsers

## Performance

Minimal impact:
- Dialog loads on demand (not in initial bundle parse)
- Components use efficient Lit rendering
- DataSource queries are cached
- No polling or heavy computation

## Accessibility

- Proper ARIA labels on interactive elements
- Keyboard navigation support (native to HA components)
- Semantic HTML structure
- Clear visual feedback

## Security

- No external API calls
- Uses Home Assistant's built-in entity picker
- DataSource creation through official manager API
- Input validation and sanitization

## License

Same as LCARdS project (check main repository for license).

## Credits

Implementation follows LCARdS patterns and conventions established by the project maintainers.

---

**Ready for Review**: All code complete, built, and documented. Ready for manual testing in Home Assistant environment.
