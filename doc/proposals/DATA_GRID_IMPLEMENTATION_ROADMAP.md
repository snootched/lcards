# LCARdS Data Grid Card - Implementation Roadmap

## Quick Start

This document provides a step-by-step implementation guide for the `lcards-data-grid` card feature.

## Prerequisites

- Familiarity with Lit Element
- Understanding of Home Assistant card development
- Knowledge of LCARdS architecture (see [Architecture Guide](../architecture/))

## Implementation Phases

### Phase 1: MVP Foundation (Week 1-2)

#### Step 1.1: Create Card Component

**File**: `src/cards/lcards-data-grid.js`

```javascript
import { LCARdSCard } from '../base/LCARdSCard.js';
import { html, css } from 'lit';
import { StatusGridRenderer } from '../msd/renderer/StatusGridRenderer.js';

export class LCARdSDataGridCard extends LCARdSCard {
  static get properties() {
    return {
      ...super.properties,
      _gridConfig: { type: Object, state: true }
    };
  }

  constructor() {
    super();
    this._gridRenderer = new StatusGridRenderer();
    this._gridConfig = {};
  }

  setConfig(config) {
    super.setConfig(config);
    this._gridConfig = this._processGridConfig(config);
  }

  _processGridConfig(config) {
    return {
      cells: config.cells || [],
      columns: config.grid?.columns || 3,
      rows: config.grid?.rows || 3,
      gap: config.grid?.gap || 8,
      style: config.style || {}
    };
  }

  render() {
    return html`
      <div class="lcards-data-grid">
        ${this._renderGrid()}
      </div>
    `;
  }

  _renderGrid() {
    // TODO: Implement grid rendering using StatusGridRenderer
    return html`<div class="grid-placeholder">Data Grid</div>`;
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .lcards-data-grid {
        width: 100%;
        height: 100%;
      }
    `;
  }
}

customElements.define('lcards-data-grid-card', LCARdSDataGridCard);
```

**Tasks**:
- [ ] Create file structure
- [ ] Implement basic property handling
- [ ] Add grid config processing
- [ ] Wire up StatusGridRenderer
- [ ] Test basic rendering

#### Step 1.2: Create Schema

**File**: `src/schemas/data-grid-schema.js`

```javascript
export const dataGridSchema = {
  title: 'Data Grid Configuration',
  type: 'object',
  required: ['type'],
  properties: {
    type: {
      type: 'string',
      const: 'custom:lcards-data-grid-card',
      description: 'Card type identifier'
    },
    data_mode: {
      type: 'string',
      enum: ['form', 'random', 'template'],
      default: 'form',
      title: 'Data Mode',
      description: 'How data is provided to the grid'
    },
    grid: {
      type: 'object',
      title: 'Grid Layout',
      properties: {
        columns: {
          type: 'integer',
          minimum: 1,
          maximum: 12,
          default: 3,
          title: 'Columns'
        },
        rows: {
          type: 'integer',
          minimum: 1,
          maximum: 12,
          default: 3,
          title: 'Rows'
        },
        gap: {
          type: 'number',
          minimum: 0,
          maximum: 50,
          default: 8,
          title: 'Gap (px)'
        }
      }
    },
    cells: {
      type: 'array',
      title: 'Grid Cells',
      items: {
        type: 'object',
        properties: {
          entity: {
            type: 'string',
            title: 'Entity ID',
            format: 'entity'
          },
          label: {
            type: 'string',
            title: 'Label'
          },
          value: {
            type: ['string', 'number', 'boolean'],
            title: 'Static Value'
          }
        }
      }
    }
  }
};
```

**Tasks**:
- [ ] Define complete schema
- [ ] Add validation rules
- [ ] Document all properties
- [ ] Add schema tests

#### Step 1.3: Create Basic Editor YAML

**File**: `src/editor/cb-lcars-card-editor-forms.yaml`

Add section after existing cards:

```yaml
lcards-data-grid-card:
  tabs:
    - label: Data
      content:
        - type: Section
          label: "Data Configuration"
          outlined: true
          leftChevron: false
          expanded: true
          headerLevel: 4
          icon: "mdi:database"
          rows:
            - controls:
                - label: "Data Mode"
                  configValue: data_mode
                  type: Selector
                  required: true
                  selector:
                    select:
                      mode: dropdown
                      options:
                        - value: 'form'
                          label: 'Form (Static Configuration)'
                        - value: 'random'
                          label: 'Random (Testing/Demo)'
                        - value: 'template'
                          label: 'Template (YAML)'
                - label: "Refresh Interval (ms)"
                  configValue: refresh_interval
                  type: Selector
                  visibilityCondition: "this._config?.data_mode === 'random'"
                  selector:
                    number:
                      min: 1000
                      max: 60000
                      step: 1000
                      mode: slider
        
        - type: Section
          label: "Grid Layout"
          outlined: true
          leftChevron: false
          expanded: true
          headerLevel: 4
          icon: "mdi:grid"
          rows:
            - type: ControlRow
              cssClass: "form-row two-controls"
              controls:
                - label: "Columns"
                  configValue: "grid.columns"
                  type: Selector
                  selector:
                    number:
                      min: 1
                      max: 12
                      step: 1
                      mode: slider
                - label: "Rows"
                  configValue: "grid.rows"
                  type: Selector
                  selector:
                    number:
                      min: 1
                      max: 12
                      step: 1
                      mode: slider
            - controls:
                - label: "Gap (px)"
                  configValue: "grid.gap"
                  type: Selector
                  selector:
                    number:
                      min: 0
                      max: 50
                      step: 2
                      mode: slider

    - label: YAML
      content:
        - type: Section
          label: "Raw YAML Configuration"
          outlined: true
          leftChevron: false
          expanded: true
          headerLevel: 4
          icon: "mdi:code-braces"
          rows:
            - controls:
                - type: Message
                  alertType: info
                  message: "Edit the raw YAML configuration. Changes here will override UI settings."

  css:
    mergeUserStyles: true
    cssText: |
      .form-control {
        padding: 2px 8px 2px 8px;
      }
      .form-row {
        grid-template-columns: 100%;
      }
      .form-row.two-controls {
        grid-template-columns: 50% 50%;
      }
```

**Tasks**:
- [ ] Add editor definition to YAML
- [ ] Test editor rendering
- [ ] Verify config updates
- [ ] Add validation messages

#### Step 1.4: Register Card

**File**: `src/lcards.js`

Add import and registration:

```javascript
// Add after other card imports
import { LCARdSDataGridCard } from './cards/lcards-data-grid.js';

// Add in initializeCustomCard().then() block
defineCustomElement('lcards-data-grid-card', LCARdSDataGridCard, 'lcards-data-grid-card-editor', LCARdSCardEditor);
```

**Tasks**:
- [ ] Import card class
- [ ] Register custom element
- [ ] Test card appears in UI picker
- [ ] Verify editor loads

#### Step 1.5: Testing

**File**: `test/cards/lcards-data-grid.test.js`

```javascript
import { expect, fixture, html } from '@open-wc/testing';
import '../../src/cards/lcards-data-grid.js';

describe('LCARdSDataGridCard', () => {
  it('renders with minimal config', async () => {
    const el = await fixture(html`
      <lcards-data-grid-card></lcards-data-grid-card>
    `);
    await el.updateComplete;
    expect(el).to.exist;
  });

  it('accepts grid configuration', async () => {
    const el = await fixture(html`
      <lcards-data-grid-card></lcards-data-grid-card>
    `);
    el.setConfig({
      type: 'custom:lcards-data-grid-card',
      grid: { columns: 4, rows: 3, gap: 10 }
    });
    await el.updateComplete;
    expect(el._gridConfig.columns).to.equal(4);
  });
});
```

**Tasks**:
- [ ] Create test file
- [ ] Write unit tests
- [ ] Run test suite
- [ ] Fix any failures

---

### Phase 2: Enhanced Editor (Week 3-4)

#### Step 2.1: Add Layout Tab

Add visual grid designer component.

**File**: `src/editor/components/lcards-grid-layout-designer.js`

```javascript
import { LitElement, html, css } from 'lit';

export class LCARdSGridLayoutDesigner extends LitElement {
  static get properties() {
    return {
      columns: { type: Number },
      rows: { type: Number },
      gap: { type: Number },
      cells: { type: Array }
    };
  }

  constructor() {
    super();
    this.columns = 3;
    this.rows = 3;
    this.gap = 8;
    this.cells = [];
  }

  render() {
    return html`
      <div class="grid-designer">
        <div class="grid-preview" style="
          display: grid;
          grid-template-columns: repeat(${this.columns}, 1fr);
          grid-template-rows: repeat(${this.rows}, 1fr);
          gap: ${this.gap}px;
        ">
          ${this._renderGridCells()}
        </div>
      </div>
    `;
  }

  _renderGridCells() {
    const totalCells = this.columns * this.rows;
    return Array.from({ length: totalCells }, (_, i) => html`
      <div class="grid-cell" @click=${() => this._handleCellClick(i)}>
        Cell ${i + 1}
      </div>
    `);
  }

  _handleCellClick(index) {
    this.dispatchEvent(new CustomEvent('cell-selected', {
      detail: { index },
      bubbles: true,
      composed: true
    }));
  }

  static get styles() {
    return css`
      .grid-designer {
        padding: 16px;
      }
      .grid-cell {
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        padding: 8px;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      .grid-cell:hover {
        background-color: var(--secondary-background-color);
      }
    `;
  }
}

customElements.define('lcards-grid-layout-designer', LCARdSGridLayoutDesigner);
```

**Tasks**:
- [ ] Create designer component
- [ ] Add to editor YAML
- [ ] Implement cell selection
- [ ] Add cell configuration panel
- [ ] Test interaction flow

#### Step 2.2: Add Styling Tab

Integrate with existing color/font components.

**Tasks**:
- [ ] Add typography section with `lcards-font-selector`
- [ ] Add colors section with `lcards-color-picker`
- [ ] Add borders section
- [ ] Test preset manager integration

---

### Phase 3: Animation & Advanced (Week 5-6)

#### Step 3.1: Add Animation Tab

**Tasks**:
- [ ] Add cascade animation controls
- [ ] Implement real-time preview
- [ ] Add change detection animations
- [ ] Test performance with animations

#### Step 3.2: Add Advanced Tab

**Tasks**:
- [ ] Add debounce settings
- [ ] Add debug options
- [ ] Add metadata fields
- [ ] Test performance optimizations

---

### Phase 4: Polish & Documentation (Week 7-8)

#### Step 4.1: Live Preview

Implement debounced live preview without re-instantiation.

**Tasks**:
- [ ] Add preview component
- [ ] Implement config debouncing
- [ ] Test with large datasets
- [ ] Optimize update performance

#### Step 4.2: Documentation

**Tasks**:
- [ ] Write user guide
- [ ] Create example configurations
- [ ] Add inline help text
- [ ] Record demo video

#### Step 4.3: Testing & QA

**Tasks**:
- [ ] Run full test suite
- [ ] Test edge cases
- [ ] Browser compatibility testing
- [ ] Performance profiling
- [ ] Accessibility audit

---

## File Structure

```
LCARdS/
├── src/
│   ├── cards/
│   │   └── lcards-data-grid.js          # Main card component
│   ├── schemas/
│   │   └── data-grid-schema.js          # JSON Schema definition
│   ├── editor/
│   │   ├── cb-lcards-card-editor-forms.yaml  # Editor config (add section)
│   │   └── components/
│   │       ├── lcards-grid-layout-designer.js
│   │       └── lcards-data-grid-preview.js
│   └── lcards.js                        # Registration (add import)
├── test/
│   └── cards/
│       └── lcards-data-grid.test.js     # Unit tests
└── doc/
    ├── proposals/
    │   ├── DATA_GRID_CARD_PROPOSAL.md
    │   └── DATA_GRID_IMPLEMENTATION_ROADMAP.md  # This file
    └── user-guide/
        └── cards/
            └── data-grid.md             # User documentation
```

## Development Commands

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Build in development mode (faster, with source maps)
npm run build:dev

# Run tests
npm test

# Watch mode for development
npm run watch
```

## Testing Checklist

- [ ] Card renders without errors
- [ ] Editor opens and displays tabs
- [ ] Config changes update card
- [ ] Schema validation works
- [ ] Live preview updates correctly
- [ ] Performance acceptable with 100+ cells
- [ ] Works in Chrome, Firefox, Safari
- [ ] No console errors or warnings
- [ ] Accessibility: keyboard navigation works
- [ ] Accessibility: screen reader compatible

## Common Issues & Solutions

### Issue: Card doesn't appear in UI picker
**Solution**: Verify registration in `src/lcards.js` and rebuild.

### Issue: Editor doesn't load
**Solution**: Check YAML syntax in `cb-lcars-card-editor-forms.yaml` and regenerate editor JSON.

### Issue: Config changes don't update card
**Solution**: Ensure `setConfig()` is called and `requestUpdate()` is triggered.

### Issue: Performance issues with large grids
**Solution**: Implement virtual scrolling or increase debounce time in advanced settings.

## Resources

- [Lit Element Guide](https://lit.dev/docs/)
- [Home Assistant Frontend Docs](https://developers.home-assistant.io/docs/frontend/)
- [LCARdS Architecture](../architecture/)
- [StatusGridRenderer Source](../../src/msd/renderer/StatusGridRenderer.js)

## Questions?

If you encounter issues or have questions during implementation:

1. Check existing card implementations (e.g., `lcards-button-card.js`, `lcards-msd.js`)
2. Review repository memories for patterns and conventions
3. Consult the LCARdS Discord/GitHub Discussions
4. Create an issue with the `question` label

---

**Last Updated**: 2026-01-01
**Status**: Proposal Phase
**Next Review**: After Phase 1 MVP completion
