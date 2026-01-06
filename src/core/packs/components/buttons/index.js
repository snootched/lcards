/**
 * Button Component Registry
 *
 * Registry of button component/preset types for LCARdS Button cards.
 * These map to style presets in the lcards_buttons pack, providing
 * reusable button designs with consistent styling patterns.
 *
 * Each component represents a visual style preset that can be applied
 * to button cards, with metadata for discovery and documentation.
 *
 * @module core/packs/components/buttons
 */

/**
 * Button components registry
 * Maps button preset names to their metadata for AssetManager registration
 * 
 * These correspond to the button style presets defined in 
 * src/core/packs/loadBuiltinPacks.js (LCARDS_BUTTONS_PACK)
 * 
 * @type {Object.<string, Object>}
 */
export const BUTTON_COMPONENTS = {
    'base': {
        name: 'Base Button',
        description: 'Foundation button with standard styling',
        category: 'base'
    },
    'lozenge': {
        name: 'Lozenge',
        description: 'Fully rounded button with icon on left',
        category: 'rounded'
    },
    'lozenge-right': {
        name: 'Lozenge (Right)',
        description: 'Fully rounded button with icon on right',
        category: 'rounded'
    },
    'bullet': {
        name: 'Bullet',
        description: 'Half-rounded button (right side rounded)',
        category: 'rounded'
    },
    'bullet-right': {
        name: 'Bullet (Right)',
        description: 'Half-rounded button (left side rounded)',
        category: 'rounded'
    },
    'capped': {
        name: 'Capped',
        description: 'Single side rounded button (left side)',
        category: 'rounded'
    },
    'capped-right': {
        name: 'Capped (Right)',
        description: 'Single side rounded button (right side)',
        category: 'rounded'
    },
    'barrel': {
        name: 'Barrel',
        description: 'Solid rectangular button with no rounding',
        category: 'filled'
    },
    'barrel-right': {
        name: 'Barrel (Right)',
        description: 'Solid rectangular button with icon on right',
        category: 'filled'
    },
    'filled': {
        name: 'Filled',
        description: 'Filled button with large text (Picard style)',
        category: 'filled'
    },
    'filled-right': {
        name: 'Filled (Right)',
        description: 'Filled button with large text and icon on right',
        category: 'filled'
    },
    'outline': {
        name: 'Outline',
        description: 'Border-only button with large text (Picard style)',
        category: 'outline'
    },
    'outline-right': {
        name: 'Outline (Right)',
        description: 'Border-only button with icon on right',
        category: 'outline'
    },
    'icon': {
        name: 'Icon',
        description: 'Icon-only compact square button',
        category: 'special'
    },
    'text-only': {
        name: 'Text Only',
        description: 'Text-only button without icon or divider',
        category: 'special'
    },
    'bar-label-base': {
        name: 'Bar Label Base',
        description: 'Base style for bar label buttons',
        category: 'bar-label'
    },
    'bar-label-left': {
        name: 'Bar Label Left',
        description: 'Bar label with left alignment',
        category: 'bar-label'
    },
    'bar-label-center': {
        name: 'Bar Label Center',
        description: 'Bar label with center alignment',
        category: 'bar-label'
    },
    'bar-label-right': {
        name: 'Bar Label Right',
        description: 'Bar label with right alignment',
        category: 'bar-label'
    },
    'bar-label-square': {
        name: 'Bar Label Square',
        description: 'Square bar label button',
        category: 'bar-label'
    },
    'bar-label-lozenge': {
        name: 'Bar Label Lozenge',
        description: 'Fully rounded bar label',
        category: 'bar-label'
    },
    'bar-label-bullet-left': {
        name: 'Bar Label Bullet Left',
        description: 'Half-rounded bar label (right side rounded)',
        category: 'bar-label'
    },
    'bar-label-bullet-right': {
        name: 'Bar Label Bullet Right',
        description: 'Half-rounded bar label (left side rounded)',
        category: 'bar-label'
    }
};

/**
 * Get a button component by name
 * @param {string} name - Component name
 * @returns {Object|undefined} Component object or undefined if not found
 */
export function getButtonComponent(name) {
    return BUTTON_COMPONENTS[name];
}

/**
 * Check if a button component exists
 * @param {string} name - Component name
 * @returns {boolean} True if component exists
 */
export function hasButtonComponent(name) {
    return name in BUTTON_COMPONENTS;
}

/**
 * Get all available button component names
 * @returns {string[]} Array of component names
 */
export function getButtonComponentNames() {
    return Object.keys(BUTTON_COMPONENTS);
}

/**
 * Register all button components with AssetManager
 * Called during core initialization to enable unified asset discovery
 * 
 * @param {AssetManager} assetManager - AssetManager instance
 */
export function registerButtonComponents(assetManager) {
    if (!assetManager) {
        console.warn('[ButtonComponents] AssetManager not provided - skipping registration');
        return;
    }

    Object.entries(BUTTON_COMPONENTS).forEach(([key, component]) => {
        assetManager.register('button', key, component, {
            pack: 'lcards_buttons',
            type: 'svg-function',
            registeredAt: Date.now()
        });
    });

    console.info(`[ButtonComponents] Registered ${Object.keys(BUTTON_COMPONENTS).length} components with AssetManager`);
}
