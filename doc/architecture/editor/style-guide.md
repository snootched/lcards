# LCARdS Editor Style Guide

## Overview

This guide documents the standardized styling patterns for LCARdS editor components. All patterns are extracted from the MSD Studio dialog (our gold standard reference) and organized into centralized style files for consistency and maintainability.

## Style File Organization

```
src/editor/
├── base/
│   ├── editor-styles.js              # Base styles, spacing, typography
│   └── editor-component-styles.js    # Shared component patterns
├── dialogs/
│   └── studio-dialog-styles.js       # Full-screen studio patterns
└── components/editors/
    └── editor-widget-styles.js       # List-based editor patterns
```

### 1. Base Styles (`editor-styles.js`)
Foundation styles for all editors: layout, spacing, typography, messages, form elements.

**Usage:**
```javascript
import { editorStyles } from '../base/editor-styles.js';

static get styles() {
    return [editorStyles];
}
```

### 2. Editor Component Styles (`editor-component-styles.js`)
Reusable component patterns: icon buttons, info cards, grids, badges, toolbars, empty states.

**Usage:**
```javascript
import { editorStyles } from '../base/editor-styles.js';
import { editorComponentStyles } from '../base/editor-component-styles.js';

static get styles() {
    return [editorStyles, editorComponentStyles];
}
```

### 3. Studio Dialog Styles (`studio-dialog-styles.js`)
Full-screen studio dialog patterns: split panels, floating toolbars, zoom controls, tab navigation.

**Usage:**
```javascript
import { editorStyles } from '../base/editor-styles.js';
import { studioDialogStyles } from '../dialogs/studio-dialog-styles.js';

static get styles() {
    return [editorStyles, studioDialogStyles];
}
```

### 4. Editor Widget Styles (`editor-widget-styles.js`)
List-based editor patterns: collapsible items, drag-and-drop, expand/collapse, item actions.

**Usage:**
```javascript
import { editorWidgetStyles } from './editor-widget-styles.js';

static get styles() {
    return [editorWidgetStyles];
}
```

---

## Spacing Standards

### Base Spacing (12px)
Standard spacing for most editor components:
- Section margins: `12px`
- Form row margins: `12px`
- Grid gaps: `12px`
- Section content padding: `12px`

### Compact Spacing (8px)
Use for nested sections or dense layouts:
- `.compact` form fields: `8px` margin
- `.nested` section content: `8px` padding
- Nested section margins: `8px`

### Example:
```html
<lcards-form-section header="Main Section" ?expanded=${true}>
    <!-- Main content with 12px spacing -->
    
    <lcards-form-section 
        header="Nested Section" 
        ?expanded=${false}
        ?compact=${true}>
        <!-- Nested content with 8px spacing -->
    </lcards-form-section>
</lcards-form-section>
```

---

## LCARS Border Radius

Maintain Star Trek LCARS aesthetic with these standard radii:
- **Large** (panels, cards): `24px`
- **Medium** (sections, buttons): `12px`
- **Small** (inputs, badges): `8px`
- **Circular** (icon buttons): `50%`

**Example:**
```css
.card {
    border-radius: 24px;
}

.button {
    border-radius: 12px;
}

.input {
    border-radius: 8px;
}

ha-icon-button {
    border-radius: 50%;
}
```

---

## CSS Variables (Required)

**Always use Home Assistant CSS variables, never hardcode colors.**

### Standard Variables:
```css
/* ✅ Correct */
background: var(--card-background-color);
color: var(--primary-text-color);
border: 1px solid var(--divider-color);

/* ❌ Wrong */
background: #fff;
color: #212121;
border: 1px solid #e0e0e0;
```

### Common Variables:
- `--card-background-color` - Card backgrounds
- `--primary-background-color` - Primary backgrounds
- `--secondary-background-color` - Secondary backgrounds
- `--primary-text-color` - Primary text
- `--secondary-text-color` - Secondary/helper text
- `--divider-color` - Borders and dividers
- `--primary-color` - Brand/accent color
- `--error-color` - Error states
- `--warning-color` - Warning states
- `--success-color` - Success states

---

## Component Patterns

### Icon Buttons (from MSD Studio)

Modern icon button styling with hover and active states:

```javascript
import { editorComponentStyles } from '../base/editor-component-styles.js';

static get styles() {
    return [editorComponentStyles];
}

// In template
html`
    <ha-icon-button 
        class="${this.isActive ? 'active' : ''}"
        icon="mdi:grid"
        @click=${this._toggle}>
    </ha-icon-button>
`
```

**Styling:**
- 40px × 40px circular
- Subtle background: `rgba(255, 255, 255, 0.1)`
- Hover state: `rgba(255, 255, 255, 0.2)` with `--primary-color` border
- Active state: `--primary-color` background

---

### Info Cards (from Data Grid Studio)

Informational card pattern for important messages or studio launchers:

```javascript
html`
    <div class="info-card">
        <div class="info-card-content">
            <h3>🎨 Configuration Studio</h3>
            <p>Full-screen visual editor with live preview</p>
        </div>
        <div class="info-card-actions">
            <ha-button raised @click=${this._openStudio}>
                <ha-icon icon="mdi:pencil" slot="icon"></ha-icon>
                Open Studio
            </ha-button>
        </div>
    </div>
`
```

**Features:**
- 16px padding
- 2px border with `--divider-color`
- 12px border-radius
- 12px gap between elements

---

### List-Based Editors (Animation/Filter Pattern)

Modern list-based editor pattern with collapsible items:

```javascript
import { editorWidgetStyles } from './editor-widget-styles.js';

static get styles() {
    return [editorWidgetStyles];
}

html`
    <div class="editor-list">
        ${items.map(item => html`
            <div class="editor-item" ?expanded=${this._isExpanded(item.id)}>
                <div class="editor-item-header" @click=${() => this._toggle(item.id)}>
                    <ha-icon class="drag-handle" icon="mdi:drag"></ha-icon>
                    <ha-icon class="editor-item-icon" icon="mdi:animation"></ha-icon>
                    <div class="editor-item-info">
                        <div class="editor-item-title">${item.name}</div>
                        <div class="editor-item-subtitle">${item.subtitle}</div>
                    </div>
                    <div class="editor-item-actions" @click=${(e) => e.stopPropagation()}>
                        <ha-icon-button
                            icon="mdi:content-copy"
                            @click=${(e) => this._duplicate(e, item.id)}>
                        </ha-icon-button>
                        <ha-icon-button
                            icon="mdi:delete"
                            @click=${(e) => this._delete(e, item.id)}>
                        </ha-icon-button>
                    </div>
                    <ha-icon
                        class="expand-icon ${this._isExpanded(item.id) ? 'expanded' : ''}"
                        icon="mdi:chevron-down">
                    </ha-icon>
                </div>
                ${this._isExpanded(item.id) ? html`
                    <div class="editor-item-content">
                        <!-- Item configuration form -->
                    </div>
                ` : ''}
            </div>
        `)}
    </div>
    
    <ha-button class="add-button" @click=${this._add}>
        <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
        Add Item
    </ha-button>
`
```

**Features:**
- Collapsible items with expand/collapse animation
- Drag handle for reordering (visual indicator)
- Action buttons (duplicate, delete)
- Subtitle for preview information
- Consistent 8px gap between items

---

### Grid Layouts

Two-column and three-column grid patterns:

```javascript
html`
    <div class="two-column-grid">
        <div>Column 1</div>
        <div>Column 2</div>
    </div>

    <div class="three-column-grid">
        <div>Column 1</div>
        <div>Column 2</div>
        <div>Column 3</div>
    </div>
`
```

**Features:**
- 12px gap
- Responsive: collapses to single column on mobile (<768px)
- Defined in `editorComponentStyles`

---

### Empty States

User-friendly empty state pattern:

```javascript
html`
    <div class="empty-state">
        <ha-icon icon="mdi:text-box-outline"></ha-icon>
        <div class="empty-state-title">No items configured</div>
        <div class="empty-state-subtitle">Add an item to get started</div>
    </div>
`
```

**Features:**
- 64px icon with 30% opacity
- Center-aligned text
- 32px vertical padding

---

## Studio Dialog Patterns

### Split Panel Layout

Standard 33/66 split for config/preview panels:

```javascript
html`
    <div class="studio-layout">
        <div class="config-panel">
            <!-- Configuration panel (33%) -->
            <div class="tab-content">
                <!-- Tabs and forms -->
            </div>
        </div>
        <div class="preview-panel">
            <!-- Preview panel (66%) -->
            <div class="preview-scroll-container">
                <!-- Live preview -->
            </div>
        </div>
    </div>
`
```

**Features:**
- 33.3% / 66.6% split
- 2px divider with `--divider-color`
- Responsive: stacks vertically on mobile (<1024px)

---

### Floating Toolbar

Floating toolbar pattern for canvas tools:

```javascript
html`
    <div class="canvas-toolbar">
        <button class="canvas-toolbar-toggle" @click=${this._toggle}>
            <ha-icon icon="mdi:menu"></ha-icon>
        </button>
        <div class="canvas-toolbar-buttons">
            <button class="canvas-toolbar-button ${mode === 'grid' ? 'active' : ''}"
                    @click=${() => this._setMode('grid')}>
                <ha-icon icon="mdi:grid"></ha-icon>
            </button>
            <div class="canvas-toolbar-divider"></div>
            <button class="canvas-toolbar-button"
                    @click=${this._reset}>
                <ha-icon icon="mdi:refresh"></ha-icon>
            </button>
        </div>
    </div>
`
```

**Features:**
- Absolute positioning: `top: 12px; right: 12px`
- Dark background: `rgba(0, 0, 0, 0.75)` with 8px blur
- 24px border-radius for LCARS aesthetic
- 40px circular buttons

---

### Zoom Controls

Floating zoom control pattern:

```javascript
html`
    <div class="zoom-controls">
        <ha-icon-button icon="mdi:minus" @click=${this._zoomOut}></ha-icon-button>
        <div class="zoom-level">${this._zoom}%</div>
        <ha-icon-button icon="mdi:plus" @click=${this._zoomIn}></ha-icon-button>
    </div>
`
```

**Features:**
- Centered at bottom: `bottom: 16px; left: 50%; transform: translateX(-50%)`
- Dark background: `rgba(0, 0, 0, 0.85)` with 8px blur
- 24px border-radius

---

## Migration Checklist

When updating an editor component:

- [ ] Remove inline `css` tagged templates
- [ ] Import shared style files
- [ ] Replace hardcoded colors with CSS variables
- [ ] Apply spacing standards (12px base, 8px compact)
- [ ] Use LCARS border-radius (24px/12px/8px)
- [ ] Adopt icon button pattern for actions
- [ ] Use info-card pattern for studio launchers
- [ ] Convert custom lists to editor-widget pattern
- [ ] Test nested sections with compact spacing
- [ ] Validate responsive behavior (@media queries)

---

## Don't Touch List

These components are reference implementations - study them, don't modify them:

- `src/editor/dialogs/lcards-msd-studio-dialog.js`
- `src/editor/dialogs/msd-studio/msd-studio-styles.js`
- `src/editor/components/theme-browser/lcards-theme-token-browser-tab.js`
- `src/editor/components/provenance/lcards-provenance-tab.js`

---

## Examples

### Complete Editor Component

```javascript
import { LitElement, html } from 'lit';
import { editorStyles } from '../base/editor-styles.js';
import { editorComponentStyles } from '../base/editor-component-styles.js';
import '../shared/lcards-form-section.js';

export class MyEditor extends LitElement {
    static get styles() {
        return [editorStyles, editorComponentStyles];
    }

    render() {
        return html`
            <!-- Info Card -->
            <div class="info-card">
                <div class="info-card-content">
                    <h3>Configuration</h3>
                    <p>Configure your component settings</p>
                </div>
            </div>

            <!-- Form Section -->
            <lcards-form-section
                header="Basic Settings"
                icon="mdi:cog"
                ?expanded=${true}>
                
                <!-- Form fields here -->
                
            </lcards-form-section>

            <!-- Nested Section with Compact Spacing -->
            <lcards-form-section
                header="Advanced Settings"
                icon="mdi:tune"
                ?expanded=${false}
                ?compact=${true}>
                
                <!-- Advanced form fields -->
                
            </lcards-form-section>
        `;
    }
}
```

---

## Best Practices

1. **Always import base styles first**: `editorStyles` should be first in the styles array
2. **Use compact spacing for nested sections**: Add `?compact=${true}` to nested `lcards-form-section`
3. **Prefer CSS variables over hardcoded colors**: Never use hex colors in CSS
4. **Follow LCARS border-radius standards**: 24px/12px/8px for different element sizes
5. **Use semantic class names**: `.editor-list`, `.editor-item`, `.info-card` etc.
6. **Test responsive behavior**: Always check mobile (<768px) and tablet (<1024px) layouts
7. **Document component-specific overrides**: If you must override shared styles, document why

---

## Resources

- MSD Studio Reference: `src/editor/dialogs/lcards-msd-studio-dialog.js`
- Animation Editor Example: `src/editor/components/lcards-animation-editor.js`
- Filter Editor Example: `src/editor/components/lcards-filter-editor.js`
- Multi-Text Editor V2: `src/editor/components/editors/lcards-multi-text-editor-v2.js`

---

*Last Updated: December 2025 | LCARdS v1.20.01*
