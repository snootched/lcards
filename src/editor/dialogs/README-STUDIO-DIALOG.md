# Studio dialogs

The studios in this folder (MSD, chart, data grid, layout, alert, astrometrics, data source) share one shell. How to build, launch and test one is documented on the developer docs page **Building a Studio Editor**: `doc/development/building-an-editor.md` (published at `/development/building-an-editor`). The editor rules are in `.github/instructions/editor.instructions.md` ("Dialogs, surfaces and messages").

The short version, for reading the code here:

- Shell: `ha-dialog open flexcontent header-title=...` > `.dialog-content` > `.studio-layout` > `.config-panel` (`ha-tab-group`, `.tab-content`) and `.preview-panel`; styles from `studio-dialog-styles.js` (nested add/edit forms on top of a studio use `studio-subform-dialog-styles.js`).
- A studio that changes `.studio-layout`'s `grid-template-columns` sets `grid-template-rows: minmax(0, 1fr)` in the same rule (`tests/editor/studio-layout-css.test.js`).
- Footer: `<ha-dialog-footer slot="footer">`, `.footer-start` (Documentation, Reset), Cancel (`appearance="plain"`, `secondaryAction`), Save (`variant="brand"`, `mdi:check`, `primaryAction`).
- Edits change only the studio's working copy; Save sends the whole config in `config-changed` and the card editor replaces its config (deleted keys must go); Cancel sends only `closed`.
- The card editor mounts the studio with `mountDialogNearHomeAssistant(dialog, this)` (`src/utils/lcards-shared-helpers.js`), never on `document.body`.
