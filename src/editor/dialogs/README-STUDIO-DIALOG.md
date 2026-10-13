# Studio dialogs

The studios are full-size `ha-dialog`s for the cards whose config is too big for a form: a config panel on the left, a live preview on the right. They share one shell, so they look and behave alike. The rules for editors in general are in `.github/instructions/editor.instructions.md` ("Dialogs, surfaces and messages").

| Studio | Element | Opened from | Split (config / preview) |
|---|---|---|---|
| MSD | `lcards-msd-studio-dialog` | `lcards-msd-editor.js` `_openMsdStudio()` | 50 / 50 |
| Chart | `lcards-chart-studio-dialog` | `lcards-chart-editor.js` `_openChartStudio()` | 40 / 60 |
| Data Grid | `lcards-data-grid-studio-dialog-v4` | `lcards-data-grid-editor.js` `_openConfigurationStudio()` | 50 / 50 |
| Layout | `lcards-layout-studio-dialog` | `lcards-layout-card-editor.js` `_openStudio()` | 1 / 2 |
| Data source | `lcards-datasource-studio-dialog` | Main Engineering > Data Sources, chart studio | 50 / 50 |

## The shell

```js
import { studioDialogStyles } from './studio-dialog-styles.js';
import { messageStyles } from '../base/surface-styles.js';

static get styles() {
    return [editorStyles, studioDialogStyles, messageStyles, css`/* studio-specific */`];
}

render() {
    return html`
        <ha-dialog open flexcontent header-title="My Studio"
            @closed=${(e) => { e.stopPropagation(); this._handleClose(); }}>
            <div class="dialog-content">
                <div class="studio-layout">
                    <div class="config-panel">
                        <ha-tab-group>...</ha-tab-group>
                        <div class="tab-content">...</div>
                    </div>
                    <div class="preview-panel">...</div>
                </div>
            </div>
            <div slot="footer">
                <ha-button appearance="plain" @click=${this._handleCancel}>Cancel</ha-button>
                <ha-button variant="brand" @click=${this._handleSave}>
                    <ha-icon icon="mdi:check" slot="start"></ha-icon>
                    Save
                </ha-button>
            </div>
        </ha-dialog>
    `;
}
```

- **Height:** `studioDialogStyles` fixes the dialog at 90vh, and `flexcontent` lets `.dialog-content` and the black `.studio-layout` inset fill it. The inset keeps one height on every tab; only `.tab-content` scrolls. Don't set heights on `.dialog-content`, `.tab-content` or the panels.
- **Split:** `.studio-layout` is 50/50; a studio changes only `grid-template-columns`.
- **Footer:** Cancel (`appearance="plain"`), then Save (`variant="brand"`, `mdi:check`). Secondary actions (Documentation, Reset) go first, in a `<div class="footer-start">` group, which sits at the left.
- **Text:** small grey help text is `.hint` (`messageStyles`); longer help is an info guide (`renderInfoGuide`); notices are `lcards-message`.
- **Canvas toolbar:** the floating `.canvas-toolbar` with `.canvas-toolbar-button` circles, styled in `studioDialogStyles` and shared by the MSD, Chart and Data Grid studios.
- **Closing:** stop the dialog's `closed` event (`e.stopPropagation()`) so it doesn't close the card editor around it; pickers inside fire their own `closed`, so act only on the dialog's own.

## Opening one

Mount the studio inside `home-assistant`, never on `document.body`: HA's pickers and nested dialogs read Lit contexts provided there.

```js
import { mountDialogNearHomeAssistant } from '../../utils/lcards-shared-helpers.js';

async _openChartStudio() {
    const dialog = document.createElement('lcards-chart-studio-dialog');
    dialog.hass = this.hass;
    dialog.config = JSON.parse(JSON.stringify(this.config || {}));
    dialog.addEventListener('config-changed', (e) => { /* replace this.config with e.detail.config */ });
    dialog.addEventListener('closed', () => dialog.remove());
    mountDialogNearHomeAssistant(dialog, this);
}
```

The studio works on a copy and sends the whole config in `config-changed` on Save: the editor replaces its config (deleted keys must go) rather than merging.

## Tests

`tests/ha/ha.spec.js` opens each studio in the dev HA: the inset keeps one height across tabs, and the MSD, chart and data source studios have their own behaviour tests.
