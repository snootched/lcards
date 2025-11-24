# LCARdS Documentation (ARCHIVE)

> ⚠️ **ARCHIVED DOCUMENTATION**
>
> This directory contains historical documentation that may be outdated.
> Please refer to `/doc/` for current documentation.
>
> **Last Active Version:** 1.10.70+
> **Archived:** November 2025

---

**Version:** 1.10.70+ (historical)
**Last Updated:** November 15, 2025
**Status:** ARCHIVED - See `/doc/` for current docs

---

## Documentation Structure

```
doc/
├── README.md                          (this file)
├── archive/                           Legacy documentation
├── architecture/                      Technical specifications
│   ├── simple-button-schema-definition.md
│   ├── simple-button-migration-plan.md
│   └── rules-engine-template-syntax.md
├── user-guide/                        End-user documentation
│   ├── configuration/                 Component configuration
│   │   ├── simple-button-quick-reference.md  ⭐ START HERE
│   │   ├── simple-button-card-legacy.md      (archived)
│   │   └── ...
│   └── testing/                       Testing guides
│       ├── simple-button-testing.md   ⭐ 20 TEST SCENARIOS
│       └── simple-button-testing-legacy.md   (archived)
└── ...
```

---

## Quick Links

### Simple Button Card
- **Quick Reference** → `user-guide/configuration/simple-button-quick-reference.md`
- **Testing Guide** → `user-guide/testing/simple-button-testing.md`
- **Schema Definition** → `architecture/simple-button-schema-definition.md`
- **Migration Plan** → `architecture/simple-button-migration-plan.md`

### Rules Engine
- **Template Syntax** → `architecture/rules-engine-template-syntax.md`

---

## Documentation Philosophy

1. **Lowercase filenames** - All documentation uses kebab-case naming
2. **Clear hierarchy** - User guides separate from technical specs
3. **Archive old docs** - Don't delete, move to archive with `-legacy` suffix
4. **Single source of truth** - One primary doc per topic, reference others
5. **Examples first** - Show working code, explain after

---

## Contributing

When updating documentation:
1. Use lowercase kebab-case for filenames
2. Keep examples up-to-date with latest schema
3. Archive old versions, don't overwrite
4. Update this README when adding new docs
5. Cross-reference related documents

---

## Schema Version: 1.10.70+

**Breaking Change:** Flat schema keys removed. Use nested CB-LCARS schema only.

**Migration:**
- ❌ `background_color` → ✅ `card.color.background.{state}`
- ❌ `text_color` → ✅ `text.default.color.{state}`
- ❌ `border_width` → ✅ `border.width`
- ❌ Rules `conditions:` → ✅ Rules `when:`/`apply:`

See `architecture/simple-button-migration-plan.md` for details.
