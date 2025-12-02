You are an expert developer working on LCARdS - a comprehensive Star Trek LCARS interface system for Home Assistant. This is a production-grade project implementing advanced card systems with enterprise-level architecture.

## CRITICAL PROJECT CONTEXT

**CURRENT ARCHITECTURE (Dec 2025)**: LCARdS uses a two-tier card architecture:

1. **LCARdS Cards** (Primary pattern):
   - `src/base/LCARdSCard.js` - Foundation base class
   - `src/cards/lcards-button.js` - Button card (custom:lcards-button)
   - `src/cards/lcards-elbow.js` - Elbow card (custom:lcards-elbow)
   - `src/cards/lcards-chart.js` - Chart card (custom:lcards-chart)

2. **MSD Cards** (Complex layouts):
   - `src/cards/lcards-msd.js` - Master Systems Display card
   - Multi-overlay displays with SVG composition

## ARCHITECTURE PRINCIPLES

**DOM Context**: Always use `this.mountEl` for DOM operations, never `document`. We work within shadowRoots and card-specific mount elements.

**Core Systems**:
- MSD (Master Systems Display) in `src/msd/` - modular design with overlay/controls layers
- Global singletons (`lcardsCore`) for themes, rules, animations, datasources
- LCARdS cards connect directly to singletons without MSD pipeline dependency

**Template Processing**: Support button-card syntax `[[[return code]]]` and token replacement `{{token}}` with rich evaluation context (entity, hass, theme, variables).

## TECHNICAL REQUIREMENTS

**Animations**: Anime.js v4 ONLY. Key changes: `targets` is separate parameter, use `alternate`/`reversed` not `direction`. Create chainable LCARS-specific animations on `window.lcards.anim`.

**Code Standards**:
- Full JSDoc documentation
- Provide complete patched files/functions
- Include 3-5 lines context for edits
- Forward-thinking extensible design

**File Structure**:
```
src/
├── base/ - Foundation classes (LCARdSCard, LCARdSNativeCard, LCARdSActionHandler)
├── cards/ - Card implementations (lcards-button, lcards-elbow, lcards-chart, lcards-msd)
├── msd/ - Master Systems Display modules
├── core/ - Singleton systems (themes, rules, animations)
└── utils/ - Shared utilities
```

## DEVELOPMENT PATTERNS

**LCARdS Card Creation**: Extend `LCARdSCard`, use singleton helpers for template/style processing. Example:
```javascript
import { LCARdSCard } from '../base/LCARdSCard.js';

export class MyCard extends LCARdSCard {
  _renderCard() {
    return html`<div>My content</div>`;
  }
}
```

**Style Resolution**: Combine base + theme tokens + state overrides:
```javascript
const style = this.resolveStyle(baseStyle, ['theme.token'], stateOverrides);
```

**MSD Integration**: Use singleton pattern via `window.lcardsCore.getSystem('systemName')`. Systems: ThemeManager, RulesEngine, AnimationManager, DataSourceManager.

**Template Syntax**:
- JavaScript: `[[[return entity.state === 'on' ? 'Active' : 'Inactive']]]`
- Tokens: `{{entity.attributes.friendly_name}}`
- Variables: Access via `variables.ulcars_card_color`

## TESTING & VALIDATION

Use test HTML files for live testing. Build with `npm run build`. All components compile without errors.

**Architecture Goal**: Create the definitive, extensible LCARS interface solution for Home Assistant. Prioritize performance, maintainability, and clean architecture.