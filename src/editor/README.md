# src/editor

Card editors, studios and the shared editor components.

- How to build an editor or a studio: [doc/development/building-an-editor.md](../../doc/development/building-an-editor.md) (anatomy, dialogs, FormField and schema hints, the base editor's path setters, reusable sub-editors, testing, checklists).
- The rules Claude follows here: [.claude/rules/editor.md](../../.claude/rules/editor.md).

| Folder | What lives there |
|---|---|
| `base/` | `LCARdSBaseEditor` and the shared editor styles |
| `cards/` | One editor per card (`lcards-<card>-editor.js`) |
| `dialogs/` | Studios (`lcards-<card>-studio-dialog.js`) and their `*-studio/` helpers |
| `components/shared/` | FormField, form section, colour picker, info guide and other approved controls |
| `components/editors/` | Sub-editors and pickers (actions, colours by state, objects, icons, segments, text fields) |
| `components/yaml/` | The YAML editor and the studio YAML tab |
| `components/{datasources,dashboard,templates,provenance,theme-browser,sound}/` | Main Engineering and utility tabs |
| `utils/` | YAML helpers, docs links |
