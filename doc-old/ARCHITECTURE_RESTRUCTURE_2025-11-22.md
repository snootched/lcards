# Architecture Documentation Restructure - November 22, 2025

## What Was Done

### 1. Streamlined Overview
- **Before:** 931 lines with extensive singleton details
- **After:** 221 lines - high-level architecture only
- Moved detailed content to archive for future extraction if needed

### 2. Cleaned Root Directory
Architecture root (`doc/architecture/`) now contains only:
- `README.md` - Main navigation and index
- `overview.md` - High-level architecture (221 lines)
- `simple-card-foundation.md` - Go-forward card architecture
- `rules-template-syntax.md` - Template syntax reference

### 3. Organized Subdirectories
- `api/` - All API documentation (api-reference.md, debug-api.md, runtime-api.md)
- `subsystems/` - Detailed singleton system docs (12+ files)
- `schemas/` - Configuration schemas (YAML and MD)
- `diagrams/` - MSD flow diagrams

### 4. Filename Standardization
All filenames now lowercase (except README.md):
- ✅ `api-reference.md` (was `API_REFERENCE.md`)
- ✅ `debug-api.md` (already lowercase)
- ✅ `runtime-api.md` (already lowercase)
- ✅ `rules-template-syntax.md` (was `rules-engine-template-syntax.md`)

### 5. Archive Management
- Moved 931-line detailed overview to `doc-old/architecture/overview-detailed-931lines.md`
- Can extract specific sections later if needed for dedicated files

---

## New Structure

```
doc/architecture/
├── README.md                      # Main index with navigation
├── overview.md                    # High-level architecture (221 lines)
├── simple-card-foundation.md      # Go-forward card architecture
├── rules-template-syntax.md       # Template syntax
├── api/                           # API documentation
│   ├── api-reference.md          # Debug API reference
│   ├── debug-api.md              # Debug API details
│   └── runtime-api.md            # Runtime API
├── diagrams/                      # Visual documentation
│   ├── MSD Flow - Part 1.md
│   └── MSD Flow - Part 2.md
├── schemas/                       # Configuration schemas
│   ├── simple-button-schema-definition.md
│   ├── MSD_SCHEMA_V1_Ratified.yaml
│   ├── MSD_SCHEMA_V1_Routing_Details.yaml
│   ├── MSD_SCHEMA_V1_Text_Details.yaml
│   └── MSD_LINE_ATTACHMENT_SCHEMA.yaml
└── subsystems/                    # Singleton system docs
    ├── README.md
    ├── core-systems-manager.md
    ├── rules-engine.md
    ├── datasource-system.md
    └── [9 more subsystem docs]
```

---

## Benefits

1. **Clean Root** - Only essential high-level docs in architecture root
2. **Easy Navigation** - Clear folder structure by topic
3. **Maintainable** - Smaller files easier to keep current
4. **Consistent Naming** - All lowercase (except README.md)
5. **Scalable** - Easy to add new dedicated docs without cluttering root

---

## Overview.md Content

The streamlined overview now includes:
- Core philosophy and design principles
- Card architecture hierarchy (Simple vs MSD)
- System architecture diagram (Mermaid)
- Key concepts (singletons, BaseService, multi-card)
- Links to detailed documentation

**Removed from overview:**
- Detailed singleton descriptions (→ subsystems/)
- Rendering pipeline details (available in MSD Flow diagrams)
- Data flow details (available in subsystem docs)
- Design pattern details (can create dedicated file if needed)

---

## Next Steps (Optional)

If more detail needed, can create:
- `core-components.md` - Extracted singleton details
- `rendering-pipeline.md` - Extracted rendering flow
- `data-flow.md` - Extracted data processing flow
- `design-patterns.md` - Extracted pattern descriptions

For now, users can refer to:
- Individual subsystem docs for singleton details
- MSD Flow diagrams for rendering pipeline
- Subsystem docs for data flow information

---

*Restructure completed: November 22, 2025*
