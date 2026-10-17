var w=Object.defineProperty;var n=(d,e)=>w(d,"name",{value:e,configurable:true});import{a as i,b as t,i as l,l as _,aO as k}from"./lcards-main-BW4hZuuz.js";import"./lcards-form-section-Bxom3ojy.js";const $=i`
  /* The info guide's body (renderInfoGuide: an lcards-form-section variant="guide") */
  .info-guide-body {
    color: var(--primary-text-color);
    font-size: 14px;
    line-height: 1.6;
  }

  .info-guide-body > :first-child {
    margin-top: 0;
  }

  .info-guide-body p {
    margin: 0 0 var(--ha-space-3);
    max-width: 75ch;
  }

  .info-guide-body ul,
  .info-guide-body ol {
    margin: 0 0 var(--ha-space-3);
    padding-left: var(--ha-space-5);
    max-width: 75ch;
  }

  .info-guide-body li {
    margin-bottom: var(--ha-space-1);
  }

  .info-guide-body code {
    background: color-mix(in srgb, var(--primary-text-color) 10%, transparent);
    padding: 1px 6px;
    border-radius: var(--ha-border-radius-sm);
    font-family: var(--code-font-family, monospace);
    font-size: 13px;
  }

  .info-guide-body a {
    color: var(--primary-color);
  }

  .info-guide-example {
    background: color-mix(in srgb, var(--primary-text-color) 6%, transparent);
    border-radius: var(--ha-border-radius-sm);
    padding: var(--ha-space-2) var(--ha-space-3);
    margin: 0 0 var(--ha-space-3);
    font-family: var(--code-font-family, monospace);
    font-size: 13px;
    white-space: pre;
    overflow-x: auto;
  }

  .info-guide-tip {
    margin: 0 0 var(--ha-space-3);
    padding: var(--ha-space-2) var(--ha-space-3);
    background: color-mix(in srgb, var(--primary-color) 10%, transparent);
    border-radius: var(--ha-border-radius-sm);
  }

  .info-guide-note {
    margin: 0 0 var(--ha-space-3);
    color: var(--secondary-text-color);
    font-size: 13px;
  }

  .info-guide-links {
    display: flex;
    gap: var(--ha-space-4);
    flex-wrap: wrap;
  }

  .info-guide-body lcards-message {
    display: block;
    margin-top: var(--ha-space-2);
  }
`,S=i`
    :host {
        display: block;
        padding: 0;
        background: var(--card-background-color, #fff);
    }

    .editor-container {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-2);
    }

    .tab-bar {
        border-bottom: var(--ha-border-width-sm) solid var(--divider-color, #e0e0e0);
        margin-bottom: var(--ha-space-3);
    }

    .tab-content {
        padding: var(--ha-space-2) 0;
        min-height: 400px;
    }

    /* HA tab group styling */
    ha-tab-group {
        display: block;
        margin-bottom: 0;
        padding: var(--ha-space-3) 0;
    }

    /* Form field spacing */
    .form-field {
        margin-bottom: var(--lcards-section-spacing, 16px);
    }

    /* Common tab content container (used in Effects tabs, etc.) */
    .tab-content-container {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-4);
    }

    /* Section spacing with CSS variables for density control */
    .section {
        margin-bottom: var(--lcards-section-spacing, 16px);
    }

    .section-header {
        font-size: var(--ha-font-size-l);
        font-weight: 500;
        margin-bottom: var(--ha-space-3);
        color: var(--primary-text-color, #212121);
        border-bottom: var(--ha-border-width-sm) solid var(--divider-color, #e0e0e0);
        padding-bottom: var(--ha-space-2);
    }

    .section-description {
        font-size: var(--ha-font-size-m);
        color: var(--secondary-text-color, #727272);
        margin-bottom: var(--ha-space-3);
        line-height: 1.5;
    }

    .form-row {
        margin-bottom: var(--lcards-section-spacing, 16px);
        display: grid;
        grid-template-columns: 100%;
        grid-gap: var(--ha-space-2);
    }

    .form-row.two-controls {
        grid-template-columns: 50% 50%;
    }

    .form-row-group {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--ha-space-3);
        margin-bottom: var(--lcards-section-spacing, 16px);
    }

    .form-row label {
        font-weight: 500;
        color: var(--primary-text-color, #212121);
        font-size: var(--ha-font-size-m);
        display: block;
        padding: 2px var(--ha-space-2);
    }

    .form-control {
        padding: 2px var(--ha-space-2);
        border-radius: 10px;
        box-sizing: border-box;
    }

    .helper-text {
        font-size: var(--ha-font-size-s);
        color: var(--secondary-text-color, #727272);
        margin-top: var(--ha-space-1);
        line-height: 1.4;
        padding: 0 var(--ha-space-2);
    }

    .error-message {
        color: var(--error-color, #f44336);
        background: var(--error-background-color, rgba(244, 67, 54, 0.1));
        padding: var(--ha-space-2) var(--ha-space-3);
        border-radius: var(--ha-border-radius-sm);
        margin: var(--ha-space-2) 0;
        font-size: var(--ha-font-size-m);
    }

    .error-message ul {
        margin: var(--ha-space-2) 0 0 0;
        padding-left: var(--ha-space-5);
    }

    .error-message li {
        margin: var(--ha-space-1) 0;
    }

    .warning-message {
        color: var(--warning-color, #ff9800);
        background: var(--warning-background-color, rgba(255, 152, 0, 0.1));
        padding: var(--ha-space-2) var(--ha-space-3);
        border-radius: var(--ha-border-radius-sm);
        margin: var(--ha-space-2) 0;
        font-size: var(--ha-font-size-m);
    }

    .info-message {
        color: var(--info-color, #2196f3);
        background: var(--info-background-color, rgba(33, 150, 243, 0.1));
        padding: var(--ha-space-2) var(--ha-space-3);
        border-radius: var(--ha-border-radius-sm);
        margin: var(--ha-space-2) 0;
        font-size: var(--ha-font-size-m);
    }

    /* Info card - standardized launcher card for tabs (Theme Browser, Provenance, Templates) */
    .info-card {
        background: var(--primary-background-color);
        border: var(--ha-border-width-sm) solid var(--divider-color);
        border-radius: var(--ha-card-border-radius, 12px);
        padding: var(--ha-space-6);
        margin-bottom: var(--lcards-section-spacing, 16px);
        box-shadow: var(--ha-box-shadow-s);
    }

    .info-card h3 {
        margin: 0 0 var(--ha-space-3) 0;
        color: var(--primary-text-color);
        font-size: 18px;
        font-weight: 500;
    }

    .info-card p {
        margin: var(--ha-space-2) 0;
        color: var(--secondary-text-color);
        line-height: 1.5;
    }

    .info-card code {
        background: var(--secondary-background-color);
        padding: 2px 6px;
        border-radius: 3px;
        font-family: 'Roboto Mono', monospace;
        font-size: 13px;
    }

    .info-card-content {
        margin-bottom: var(--ha-space-4);
    }

    .info-card-actions {
        display: flex;
        justify-content: flex-end;
        padding-top: var(--ha-space-2);
        border-top: var(--ha-border-width-sm) solid var(--divider-color);
        gap: var(--ha-space-2);
    }

    ha-input,
    ha-selector,
    ha-entity-picker {
        width: 100%;
    }

    /* Expansion panel styling to match legacy */
    ha-expansion-panel {
        margin-bottom: 10px;
        border-radius: var(--ha-card-border-radius, var(--ha-border-radius-3xl));
    }

    ha-expansion-panel[outlined] {
        border: var(--ha-border-width-md) solid var(--chip-background-color, #e0e0e0);
    }

    ha-expansion-panel[expanded] {
        background-color: var(--chip-background-color, #f5f5f5);
    }

    /* Icon spacing in headers - increased padding */
    h1 ha-icon,
    h2 ha-icon,
    h3 ha-icon,
    h4 ha-icon,
    h5 ha-icon,
    h6 ha-icon {
        margin-right: var(--lcards-icon-spacing, 12px);
        vertical-align: middle;
    }

    .button-group {
        display: flex;
        gap: var(--ha-space-2);
        margin-top: var(--ha-space-4);
    }

    .button-group mwc-button {
        flex: 1;
    }

    /* Monaco editor container */
    .monaco-container {
        height: 500px;
        border: var(--ha-border-width-sm) solid var(--divider-color, #e0e0e0);
        border-radius: var(--ha-border-radius-sm);
        overflow: hidden;
    }

    /* Horizontal rule styling */
    hr {
        width: 95%;
        border: var(--ha-border-width-sm) solid var(--chip-background-color, #e0e0e0);
        margin: var(--ha-space-4) auto;
    }

    /* YAML Editor Validation Errors */
    .validation-errors {
        margin-top: var(--ha-space-4);
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-2);
    }

    .validation-errors ha-alert {
        margin: 0;
    }

    /* Density Variants */

    /* Nested Section Spacing - tighter spacing for nested sections */
    lcards-form-section lcards-form-section {
        margin-bottom: var(--ha-space-2);
    }

    /* Section Content Variants */
    .section-content.nested {
        padding: var(--ha-space-2);
    }

    .section-content.compact {
        padding: var(--ha-space-2);
    }

    /* Compact Form Field Variant */
    .form-field.compact {
        margin-bottom: var(--ha-space-2);
        gap: 6px;
    }

    /* Form Row Variants */
    .form-row.compact {
        margin-bottom: var(--ha-space-2);
    }

    .form-row.nested {
        margin-bottom: var(--ha-space-2);
    }

    /* Responsive design */
    @media (max-width: 768px) {
        :host {
            padding: var(--ha-space-3);
        }

        .form-row-group,
        .form-row.two-controls {
            grid-template-columns: 1fr;
        }
    }


    ${$}
`,M=i`
  /* Status banners (tinted, outlined), for state the user should see at once. */
  .banner {
    display: flex;
    align-items: center;
    gap: var(--ha-space-3);
    padding: var(--ha-space-3) var(--ha-space-4);
    border-radius: var(--ha-border-radius-md);
    font-size: 0.9em;
    color: var(--primary-text-color);
  }
  .banner.info {
    background: color-mix(in srgb, var(--info-color, #03a9f4) 12%, transparent);
    border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--info-color, #03a9f4) 35%, transparent);
  }
  .banner.warning {
    background: color-mix(in srgb, var(--warning-color, #ff9800) 15%, transparent);
    border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--warning-color, #ff9800) 40%, transparent);
  }
  .banner.error {
    background: color-mix(in srgb, var(--error-color, #f44336) 15%, transparent);
    border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--error-color, #f44336) 40%, transparent);
  }
  .banner.success {
    background: color-mix(in srgb, var(--success-color, #4caf50) 15%, transparent);
    border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--success-color, #4caf50) 40%, transparent);
  }

  /* Helper text under a field or a section. */
  .hint {
    font-size: var(--ha-font-size-s);
    line-height: 1.4;
    color: var(--secondary-text-color);
  }
`,F=i`
  /* The inset content area: a darker card the content sits in. */
  .studio-layout,
  .inset-surface {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--primary-background-color);
    min-height: 0;
    border-radius: var(--ha-card-border-radius, var(--ha-border-radius-lg));
    padding: var(--ha-space-4);
  }

  /* The inset area's scrolling column; the gap spaces sections. */
  .scrollable-body,
  .scroll-body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    gap: var(--ha-space-4);
    padding-bottom: var(--ha-space-2);
    /* lcards-form-section's own margin is replaced by the gap */
    --lcards-section-spacing: 0;
  }

  ${M}
`;function P({header:d,body:e,icon:a="mdi:information-outline",open:r=false,id:o=void 0}){return t`
        <lcards-form-section
            variant="guide"
            class="info-guide"
            data-guide=${o??d}
            header=${d}
            icon=${a}
            ?expanded=${r}
            outlined>
            <div class="info-guide-body">${e}</div>
        </lcards-form-section>
    `}n(P,"renderInfoGuide");const u=class u2 extends l{static get properties(){return{value:{type:String},label:{type:String},helper:{type:String},disabled:{type:Boolean}}}constructor(){super(),this.value="center",this.label="",this.helper="",this.disabled=false}static get styles(){return i`
            :host {
                display: block;
            }

            .position-picker {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .label {
                font-weight: 500;
                color: var(--primary-text-color, #212121);
                font-size: 14px;
                padding: 2px 8px;
            }

            .grid-container {
                display: flex;
                gap: 12px;
                align-items: center;
                padding: 8px;
            }

            .position-grid {
                display: grid;
                grid-template-columns: repeat(3, 40px);
                grid-template-rows: repeat(3, 40px);
                gap: 6px;
                background: var(--card-background-color, #fff);
                border: var(--ha-border-width-md) solid var(--divider-color, #e0e0e0);
                border-radius: 8px;
                padding: 8px;
            }

            .position-cell {
                width: 40px;
                height: 40px;
                border: var(--ha-border-width-md) solid var(--divider-color, #e0e0e0);
                border-radius: 6px;
                background: var(--disabled-text-color, #9e9e9e);
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
            }

            .position-cell:hover:not(.disabled) {
                background: var(--primary-color, #03a9f4);
                border-color: var(--primary-color, #03a9f4);
                transform: scale(1.05);
            }

            .position-cell.selected {
                background: var(--primary-color, #03a9f4);
                border-color: var(--primary-color, #03a9f4);
                box-shadow: 0 0 0 2px var(--primary-color, #03a9f4);
            }

            .position-cell.selected::after {
                content: '✓';
                color: white;
                font-size: 24px;
                font-weight: bold;
            }

            .position-cell.disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .position-label {
                font-size: 12px;
                color: var(--secondary-text-color, #727272);
                min-width: 120px;
                padding: 8px;
                background: var(--secondary-background-color, #fafafa);
                border-radius: 4px;
                text-align: center;
            }

            .helper-text {
                font-size: 12px;
                color: var(--secondary-text-color, #727272);
                line-height: 1.4;
                padding: 0 8px;
            }
        `}_getPositionValue(e,a){return[["top-left","top-center","top-right"],["center-left","center","center-right"],["bottom-left","bottom-center","bottom-right"]][e][a]}_getGridCoordinates(e){const a={top:"top-center",bottom:"bottom-center",left:"center-left",right:"center-right","left-center":"center-left","right-center":"center-right"}[e]||e;return{"top-left":[0,0],"top-center":[0,1],"top-right":[0,2],"center-left":[1,0],center:[1,1],"center-right":[1,2],"bottom-left":[2,0],"bottom-center":[2,1],"bottom-right":[2,2]}[a]||[1,1]}_formatPositionLabel(e){return e?e.split("-").map(a=>a.charAt(0).toUpperCase()+a.slice(1)).join(" "):"None"}_isSelected(e,a){const[r,o]=this._getGridCoordinates(this.value);return e===r&&a===o}_handleCellClick(e,a){if(this.disabled)return;const r=this._getPositionValue(e,a);this.value=r,this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:r},bubbles:true,composed:true}))}render(){return t`
            <div class="position-picker">
                ${this.label?t`
                    <div class="label">${this.label}</div>
                `:""}

                <div class="grid-container">
                    <div class="position-grid">
                        ${[0,1,2].map(e=>t`
                            ${[0,1,2].map(a=>t`
                                <div
                                    class="position-cell ${this._isSelected(e,a)?"selected":""} ${this.disabled?"disabled":""}"
                                    @click=${()=>this._handleCellClick(e,a)}
                                    title=${this._formatPositionLabel(this._getPositionValue(e,a))}>
                                </div>
                            `)}
                        `)}
                    </div>

                    <div class="position-label">
                        ${this._formatPositionLabel(this.value)}
                    </div>
                </div>

                ${this.helper?t`
                    <div class="helper-text">${this.helper}</div>
                `:""}
            </div>
        `}};n(u,"LCARdSPositionPicker");let p=u;customElements.get("lcards-position-picker")||customElements.define("lcards-position-picker",p);const z=i`
  :host {
    --ha-generic-picker-width: max(var(--body-width, 0px), 480px);
    --ha-generic-picker-max-width: max(var(--body-width, 0px), 480px);
  }
`,v=class v2 extends l{static get properties(){return{hass:{type:Object},value:{type:String},disabled:{type:Boolean},showPreview:{type:Boolean},label:{type:String},helper:{type:String},_isCustomMode:{type:Boolean,state:true},_displayValue:{type:String,state:true}}}constructor(){super(),this.hass=void 0,this.value="",this.disabled=false,this.showPreview=false,this.label="Font Family",this.helper="",this._isCustomMode=false,this._displayValue=""}static get styles(){return[i`
            :host {
                display: block;
            }

            .font-selector {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .selector-row {
                display: flex;
                gap: 8px;
                align-items: flex-end;
            }

            .selector-main {
                flex: 1;
            }

            .toggle-button {
                flex-shrink: 0;
            }

            .preview {
                margin-top: 8px;
                padding: 12px;
                border: var(--ha-border-width-sm) solid var(--divider-color, #e0e0e0);
                border-radius: var(--ha-card-border-radius, 12px);
                background: var(--primary-background-color, #fff);
                font-size: 16px;
                text-align: center;
            }

            .input-label {
                font-size: var(--ha-font-size-s);
                font-weight: 500;
                color: var(--secondary-text-color, #727272);
                padding: 0 8px;
                margin-bottom: 4px;
            }

            .helper-text {
                font-size: var(--ha-font-size-s);
                color: var(--secondary-text-color, #727272);
                padding: 0 8px;
            }

            .migration-notice {
                font-size: var(--ha-font-size-s);
                color: var(--warning-color, #ff9800);
                padding: 4px 8px;
                font-style: italic;
            }
        `,z]}connectedCallback(){var s;super.connectedCallback();const e=(s=window.lcards)==null?void 0:s.core;if(!(e!=null&&e.assetManager)){_.error("[LCARdSFontSelector] AssetManager not available"),this._fontOptions=[];return}const a=e.assetManager.getFontsByCategory(),r=[];["Core","Standard","Alien"].forEach(x=>{a[x]&&a[x].forEach(y=>{r.push({value:y.key,label:y.displayName})})}),this._fontOptions=r;const o=this._migrateFontName(this.value);o!==this.value?(this._displayValue=o,setTimeout(()=>{this.value=o,this._emitChange()},0)):this._displayValue=this.value,this._displayValue&&!this._isKnownFont(this._displayValue)&&this._displayValue!=="__custom__"&&(this._isCustomMode=true)}render(){const e=this.value&&this.value!==this._displayValue;return t`
            <div class="font-selector">
                ${this.label?t`<div class="input-label">${this.label}</div>`:""}

                <div class="selector-row">
                    <div class="selector-main">
                        ${this._isCustomMode?this._renderCustomInput():this._renderDropdown()}
                    </div>
                    <ha-button
                        class="toggle-button"
                        appearance="plain"
                        size="s"
                        @click=${this._toggleMode}
                        ?disabled=${this.disabled}>
                        ${this._isCustomMode?"Use preset":"Custom"}
                    </ha-button>
                </div>

                ${e?t`
                    <div class="migration-notice">
                        Migrated from legacy name: ${this.value}
                    </div>
                `:""}

                ${this.helper?t`<div class="helper-text">${this.helper}</div>`:""}
                ${this.showPreview?this._renderPreview():""}
            </div>
        `}_renderDropdown(){const e=this._fontOptions||[];return t`
            <ha-selector
                .hass=${this.hass}
                .selector=${{select:{mode:"dropdown",custom_value:e.length>=10,options:e}}}
                .value=${this._displayValue||"Antonio"}
                .disabled=${this.disabled}
                @value-changed=${this._handleDropdownChange}>
            </ha-selector>
        `}_renderCustomInput(){return t`
            <ha-selector
                .hass=${this.hass}
                .selector=${{text:{}}}
                .value=${this._displayValue||""}
                .disabled=${this.disabled}
                @value-changed=${this._handleTextChange}>
            </ha-selector>
        `}_renderPreview(){var r;const e=this._displayValue||"Antonio",a=(r=window.lcards)==null?void 0:r.core;return a!=null&&a.assetManager&&a.assetManager.loadFont(e),t`
            <div class="preview" style="font-family: ${e}">
                Live Long and Prosper
            </div>
        `}async _handleDropdownChange(e){var o;const a=e.detail.value;this.value=a,this._displayValue=a;const r=(o=window.lcards)==null?void 0:o.core;r!=null&&r.assetManager&&a&&await r.assetManager.loadFont(a),this._emitChange()}_handleTextChange(e){this.value=e.detail.value,this._displayValue=e.detail.value,this._emitChange()}_toggleMode(){this._isCustomMode=!this._isCustomMode,!this._isCustomMode&&!this._isKnownFont(this._displayValue)&&(this.value="Antonio",this._displayValue="Antonio",this._emitChange())}_isKnownFont(e){var o;const a=(o=window.lcards)==null?void 0:o.core;return a!=null&&a.assetManager?a.assetManager.listFonts().some(s=>s.key===e||s.legacyName===e):false}_migrateFontName(e){var r;const a=(r=window.lcards)==null?void 0:r.core;return a!=null&&a.assetManager?a.assetManager._migrateLegacyFontName(e):e}_emitChange(){this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:this.value},bubbles:true,composed:true}))}};n(v,"LCARdSFontSelector");let h=v;customElements.get("lcards-font-selector")||customElements.define("lcards-font-selector",h);const c="__media__",f=class f2 extends l{static get properties(){return{hass:{type:Object},value:{type:String},audioAssets:{type:Array},disabled:{type:Boolean},schemeLabel:{type:String}}}constructor(){super(),this.hass=void 0,this.value="__scheme__",this.audioAssets=[],this.disabled=false,this.schemeLabel="(Use scheme default)",this._pendingMediaMode=false}get _isMediaSource(){return typeof this.value=="string"&&this.value.startsWith("media-source://")}willUpdate(e){e.has("value")&&!this._isMediaSource&&(this._pendingMediaMode=false)}_emit(e){this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:e},bubbles:true,composed:true}))}_handleDropdownChange(e){if(e===c){this._pendingMediaMode=true,this.requestUpdate();return}this._pendingMediaMode=false,this._emit(e)}render(){const e=this._isMediaSource||this._pendingMediaMode,a=e?c:this.value,r=this._isMediaSource?{media_content_id:this.value,media_content_type:""}:void 0;return t`
      <div class="selector-stack">
        <ha-selector
          .hass=${this.hass}
          .selector=${{select:{mode:"dropdown",custom_value:3+this.audioAssets.length>=10,options:[{value:"__scheme__",label:this.schemeLabel},{value:"__mute__",label:"Mute this event"},{value:c,label:"Browse HA Media…"},...this.audioAssets.map(o=>({value:o.key,label:`${o.key} (${o.pack})`}))]}}}
          .value=${a}
          ?disabled=${this.disabled}
          @value-changed=${o=>{o.stopPropagation(),this._handleDropdownChange(o.detail.value)}}
        ></ha-selector>
        ${e?t`
          <ha-selector
            .hass=${this.hass}
            .selector=${{media:{accept:["audio/*"]}}}
            .value=${r}
            ?disabled=${this.disabled}
            @value-changed=${o=>{var s;o.stopPropagation(),this._emit(((s=o.detail.value)==null?void 0:s.media_content_id)??"")}}
          ></ha-selector>
        `:""}
      </div>
    `}static get styles(){return i`
      :host { display: block; }
      .selector-stack { display: flex; flex-direction: column; gap: 6px; }
      ha-selector { display: block; width: 100%; }
    `}};n(f,"LCARdSSoundSourceSelector");let g=f;customElements.get("lcards-sound-source-selector")||customElements.define("lcards-sound-source-selector",g);const b=class b2 extends l{static get properties(){return{type:{type:String},title:{type:String},message:{type:String}}}constructor(){super(),this.type="info",this.title="",this.message=""}static get styles(){return i`
            :host {
                display: block;
                margin-bottom: 12px;
            }

            .form-control {
                padding: 2px 8px;
            }
        `}render(){return t`
            <div class="form-control">
                <ha-alert alert-type="${this.type}" .title="${this.title||""}">
                    ${k(this.message)}
                    <slot></slot>
                </ha-alert>
            </div>
        `}};n(b,"LCARdSMessage");let m=b;customElements.get("lcards-message")||customElements.define("lcards-message",m);export{F as a,S as e,$ as i,M as m,P as r,z as s};
//# sourceMappingURL=lcards-message-DJxE4eZn.js.map
