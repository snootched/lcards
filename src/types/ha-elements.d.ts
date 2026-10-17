/**
 * Home Assistant frontend elements LCARdS creates or drives (document.createElement,
 * querySelector). HA doesn't publish types, so each lists only the properties we use,
 * named as in HA's source (~/code/frontend). Add a property here when a new one is
 * needed rather than casting at the call site.
 *
 * Our own elements are generated into elements.generated.d.ts.
 */
export {};

declare global {
    /** A Lit element as seen from outside. */
    interface HaLitElement extends HTMLElement {
        readonly updateComplete: Promise<boolean>;
        requestUpdate(name?: PropertyKey, oldValue?: unknown): void;
        readonly renderRoot: HTMLElement | DocumentFragment;
    }

    /**
     * Any Lovelace card element (ours, HA's or a third-party custom card), as created
     * from a tag name only known at runtime: createElement(cardType).
     */
    interface LovelaceCardElement extends HaLitElement {
        hass?: any;
        setConfig(config: Record<string, any>): void;
        getCardSize?(): number | Promise<number>;
    }

    /** ha-tab-group (Web Awesome tab group): `wa-tab-show` events come from it. */
    interface HaTabGroupElement extends HaLitElement {
        activeTab?: HTMLElement;
    }

    /** src/components/ha-dialog.ts */
    interface HaDialogElement extends HaLitElement {
        open: boolean;
        headerTitle?: string;
        headerSubtitle?: string;
        width?: 'small' | 'medium' | 'large' | 'full';
        type?: 'alert' | 'standard';
        preventScrimClose?: boolean;
    }

    /** src/components/ha-button.ts (Web Awesome button) */
    interface HaButtonElement extends HaLitElement {
        variant?: 'brand' | 'neutral' | 'danger' | 'warning' | 'success';
        appearance?: 'accent' | 'filled' | 'outlined' | 'plain';
        size?: 'small' | 'medium' | 'large';
        disabled?: boolean;
        label?: string;
    }

    /** src/components/input/ha-input.ts */
    interface HaInputElement extends HaLitElement {
        value: string;
        label?: string;
        type?: string;
        placeholder?: string;
        disabled?: boolean;
    }

    /** src/panels/lovelace/cards/hui-card.ts */
    interface HuiCardElement extends HaLitElement {
        config?: Record<string, any>;
        hass?: any;
        preview: boolean;
        layout?: string;
    }

    /** src/panels/lovelace/editor/card-editor/hui-card-picker.ts */
    interface HuiCardPickerElement extends HaLitElement {
        hass?: any;
        lovelace?: any;
        suggestedCards?: string[];
    }

    /** src/panels/lovelace/editor/hui-element-editor.ts */
    interface HuiCardElementEditorElement extends HaLitElement {
        hass: any;
        lovelace?: any;
        value?: Record<string, any>;
        sectionConfig?: any;
        refresh?(): void;
    }

    /** src/panels/lovelace/cards/hui-error-card.ts (also a Lovelace card) */
    interface HuiErrorCardElement extends HaLitElement {
        hass?: any;
        severity?: 'warning' | 'error';
        setConfig(config: Record<string, any>): void;
    }

    /**
     * HA's custom events (fired with fireEvent in the frontend). Declaring them here
     * types `addEventListener('config-changed', e => e.detail.config)` everywhere.
     */
    interface HTMLElementEventMap {
        /** Card/element editors (hui-card-element-editor, hui-card-picker, our editors). */
        'config-changed': CustomEvent<{ config: Record<string, any>; error?: string; guiModeAvailable?: boolean }>;
        /** Form controls (ha-form, ha-selector, pickers, ha-input wrappers). */
        'value-changed': CustomEvent<{ value: any }>;
    }

    interface HTMLElementTagNameMap {
        'ha-dialog': HaDialogElement;
        'ha-button': HaButtonElement;
        'ha-input': HaInputElement;
        'hui-card': HuiCardElement;
        'hui-card-picker': HuiCardPickerElement;
        'hui-card-element-editor': HuiCardElementEditorElement;
        'hui-error-card': HuiErrorCardElement;
    }
}
