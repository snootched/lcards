# Architecture Documentation Review - November 22, 2025

## Overview.md Updates

### Fixed Issues
1. **Corrupted Introduction** - Fixed mangled text at line 9 that merged two sections
2. **Outdated Card Names** - Changed "V2 Button Card" → "SimpleButton Card"
3. **Unclear Future Direction** - Added explicit notes about go-forward architecture

### Key Changes Made

#### 1. New Card Architecture Section
Added clear explanation of the LitElement → LCARdSNativeCard foundation with two branches:
- **LCARdSSimpleCard** → Simple Cards (go-forward architecture) ⭐
- **LCARdSMSDCard** → MSD Cards (will be refactored)

#### 2. Architecture Principles
Added explicit design principles:
- Singleton systems for shared intelligence
- Minimal card logic (presentation only)
- Explicit over magic
- Performance through entity caching (80-90% improvement)

#### 3. Future Direction
Clarified that:
- SimpleCard foundation is the **go-forward architecture**
- SimpleButton is the first production Simple Card
- MSD will eventually be refactored to use Simple Cards for overlays

#### 4. Updated References
Changed all references from:
- "V2 cards" → "Simple Cards"
- "V2 Button Card" → "SimpleButton Card"
- "future non-MSD cards" → "All Simple Cards (SimpleButton, future Simple Cards)"

#### 5. Diagram Updates
- Updated Mermaid diagram labels to show "SimpleButton Card"
- Changed style class from `v2card` to `simplecard`
- Clarified rendering as "Direct Rendering" vs complex pipeline

### Current State

The `overview.md` now accurately reflects:
- ✅ Singleton-based architecture with BaseService pattern
- ✅ Dual card foundation (Simple vs MSD)
- ✅ SimpleButton as first production Simple Card
- ✅ Clear go-forward direction
- ✅ CoreSystemsManager for Simple Cards vs DataSourceManager for MSD
- ✅ Performance characteristics and benefits

### Files Updated
- `doc/architecture/overview.md` - Main architecture document

### Next Steps for Full Review
1. Review `simple-card-foundation.md` for accuracy
2. Check all subsystem docs match current singleton implementation
3. Verify schema docs reflect latest API
4. Update any remaining legacy references in other docs

---

*Review completed: November 22, 2025*
