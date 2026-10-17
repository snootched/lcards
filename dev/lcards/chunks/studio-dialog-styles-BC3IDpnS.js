var R=Object.defineProperty;var p=(l,e)=>R(l,"name",{value:e,configurable:true});import{b as s,l as f,i as $,aD as Y,a as b,A as v,x as q,Q as W,z as k,D as P,aE as H}from"./lcards-main-BW4hZuuz.js";import{e as N,s as Z,m as M,r as G}from"./lcards-message-DJxE4eZn.js";import{o as J,c as I,g as X,i as Q,y as K}from"./lcards-yaml-editor-B_uxS34u.js";import"./lcards-form-section-Bxom3ojy.js";var L;(function(l){l.language="language",l.system="system",l.comma_decimal="comma_decimal",l.decimal_comma="decimal_comma",l.space_comma="space_comma",l.none="none"})(L||(L={}));var U;(function(l){l.language="language",l.system="system",l.am_pm="12",l.twenty_four="24"})(U||(U={}));const y=p((l,e,t,i)=>{i=i||{},t=t??{};const r=new Event(e,{bubbles:i.bubbles===void 0?true:i.bubbles,cancelable:!!i.cancelable,composed:i.composed===void 0?true:i.composed});return r.detail=t,l.dispatchEvent(r),r},"fireEvent");function ee(l,e){var r;if(!e||!((r=l==null?void 0:l.states)!=null&&r[e]))return[];const t=Object.keys(l.states[e].attributes||{}).sort(),i=[];for(const a of t)i.push({value:a,label:a}),a==="brightness"&&i.push({value:"brightness_pct",label:"brightness_pct  (auto 0–100%)"});return i}p(ee,"getAttributeOptions");function _(l,e){return(l==null?void 0:l.format)===e?true:Array.isArray(l==null?void 0:l.oneOf)?l.oneOf.some(t=>t.format===e):false}p(_,"hasFormat");function x(l,e){return(l==null?void 0:l.type)===e?true:Array.isArray(l==null?void 0:l.oneOf)?l.oneOf.some(t=>t.type===e):false}p(x,"isType");function w(l){return Array.isArray(l==null?void 0:l.enum)&&l.enum.length>0?true:Array.isArray(l==null?void 0:l.oneOf)?l.oneOf.some(e=>Array.isArray(e.enum)&&e.enum.length>0):false}p(w,"hasEnum");function te(l){if(!w(l))return false;const e=l.enum;return e&&e.some(t=>typeof t=="string"&&t.includes("-"))}p(te,"isPositionEnum");function D(l){return w(l)?l.enum.map(e=>{var t;return{value:e,label:((t=l["x-enum-labels"])==null?void 0:t[e])||B(String(e))}}):[]}p(D,"getEnumOptions");function B(l){if(!l)return"";let e=l.replace(/([A-Z])/g," $1");return e=e.replace(/[-_]/g," "),e=e.split(" ").map(t=>t.charAt(0).toUpperCase()+t.slice(1).toLowerCase()).join(" ").trim(),e}p(B,"formatLabel");function ie(l,e,t){if(l!=null&&l.title)return l.title;const i=e.split(".").pop();return B(i)}p(ie,"getEffectiveLabel");const S=class S2{static renderField(e,t,i={}){var u,g;if(!e||!t)return s`
                <ha-alert alert-type="error">
                    Form field requires 'editor' and 'path' parameters
                </ha-alert>
            `;const r=(u=e._getSchemaForPath)==null?void 0:u.call(e,t);if(!r)return s`
                <ha-alert alert-type="warning">
                    No schema found for path: ${t}
                </ha-alert>
            `;const a=((g=e._getConfigValue)==null?void 0:g.call(e,t))??(r==null?void 0:r.default),n=(r==null?void 0:r["x-ui-hints"])||{},d=i.selectorOverride||n.selector||this._getSelectorConfig(r),o=i.label||n.label||ie(r,t),c=i.helper||n.helper||(r==null?void 0:r.description)||"";if(_(r,"font-family"))return this._renderFontSelector(e,t,a,o,c,i.disabled);if(te(r))return this._renderPositionPicker(e,t,a,o,c,i.disabled);if(n.widget==="lcards-color-picker")return this._renderLcardsColorPicker(e,t,a,o,c,i.disabled);if(t==="tags")return this._renderTagsSelector(e,t,a,o,c);const h=this._prepareValueForSelector(a,d);return s`
            <ha-selector
                .hass=${e.hass}
                .selector=${d}
                .value=${h}
                .label=${o}
                .helper=${c}
                .disabled=${i.disabled||false}
                .required=${i.required||false}
                @value-changed=${C=>this._handleChange(C,e,t,d)}>
            </ha-selector>
        `}static _prepareValueForSelector(e,t){var n,d;if(!((n=t==null?void 0:t.choose)!=null&&n.choices))return e;const i=t.choose.choices;if(e==null){const o=Object.keys(i)[0],c=(d=i[o])==null?void 0:d.selector;c!=null&&c.number?e=c.number.min??0:c!=null&&c.text?e="":e=null}let r=null;typeof e=="number"?r=Object.keys(i).find(o=>{var c,h;return(h=(c=i[o])==null?void 0:c.selector)==null?void 0:h.number}):typeof e=="string"?((e.startsWith("{theme:")||e.includes("var(--"))&&(r=Object.keys(i).find(o=>{var c,h;return(o.includes("theme")||o==="theme_token")&&((h=(c=i[o])==null?void 0:c.selector)==null?void 0:h.text)})),!r&&e==="theme"&&(r=Object.keys(i).find(o=>o.includes("theme")||o.includes("binding"))),r||(r=Object.keys(i).find(o=>{var c,h,u,g;return((h=(c=i[o])==null?void 0:c.selector)==null?void 0:h.text)||((g=(u=i[o])==null?void 0:u.selector)==null?void 0:g.select)}))):typeof e=="object"&&e!==null&&!Array.isArray(e)&&(r=Object.keys(i).find(o=>{var c,h;return(h=(c=i[o])==null?void 0:c.selector)==null?void 0:h.object})),r||(r=Object.keys(i)[0]);const a={active_choice:r};return Object.keys(i).forEach(o=>{var c,h,u;if(o===r)a[o]=e;else{const g=(c=i[o])==null?void 0:c.selector;g!=null&&g.number?a[o]=g.number.min??0:g!=null&&g.text?a[o]="":g!=null&&g.select?a[o]=((u=(h=g.select.options)==null?void 0:h[0])==null?void 0:u.value)??"":a[o]=null}}),f.trace("[FormFieldHelper] Value prepared for choose selector:",{path:"(see render context)",rawValue:e,activeChoice:r,chooseValue:a}),a}static _handleChange(e,t,i,r){var n,d,o;if(e.stopPropagation(),!t||!i)return;let a;if(((n=e.target)==null?void 0:n.tagName)==="HA-SWITCH"?a=e.target.checked??e.target.__checked:a=(d=e.detail)==null?void 0:d.value,r!=null&&r.object&&!r.object.multiple&&a===""&&(a=void 0),a&&typeof a=="object"&&a.active_choice){const c=a.active_choice,h=a[c];f.trace("[FormFieldHelper] Choose value extracted:",{path:i,rawValue:a,activeChoice:c,extractedValue:h}),a=h}(o=t._setConfigValue)==null||o.call(t,i,a)}static _getSelectorConfig(e){if(!e)return{text:{}};const t=e["x-ui-hints"];return t!=null&&t.selector?t.selector:Array.isArray(e.oneOf)&&e.oneOf.length>0?this._generateChooseSelectorForOneOf(e):this._autoGenerateSelector(e)}static _autoGenerateSelector(e){return e?x(e,"number")||x(e,"integer")?{number:{mode:e.maximum&&e.maximum<=100?"slider":"box",min:e.minimum,max:e.maximum,step:e.type==="integer"?1:e.multipleOf||.1}}:x(e,"boolean")?{boolean:{}}:x(e,"string")?_(e,"entity")?{entity:{}}:_(e,"icon")?{icon:{}}:_(e,"color")?{ui_color:{}}:_(e,"action")?{ui_action:{}}:w(e)?{select:{mode:"dropdown",options:D(e)}}:{text:{}}:x(e,"object")?{object:{}}:w(e)?{select:{mode:"dropdown",options:D(e)}}:{text:{}}:{text:{}}}static _generateChooseSelectorForOneOf(e){const t={};return e.oneOf.forEach((i,r)=>{const a=this._getLabelForOneOfBranch(i),n=this._autoGenerateSelector(i),d=a.toLowerCase().replace(/\s+/g,"_").replace(/[^a-z0-9_]/g,"")||`option_${r}`;t[d]={selector:n}}),{choose:{choices:t}}}static _getLabelForOneOfBranch(e){var t,i,r;if(e.title)return e.title;if(e.type==="number"||e.type==="integer")return"Number";if(e.type==="string")return(t=e.pattern)!=null&&t.includes("theme:")||(i=e.pattern)!=null&&i.includes("\\{theme:")?"Theme Token":(r=e.enum)!=null&&r.includes("theme")?"Theme Binding":"Text";if(e.type==="object"){const a=e.properties||{};return a.top&&a.right&&a.bottom&&a.left?"Per Side":a.default&&a.active?"By State":a.top_left||a.top_right?"Per Corner":"Advanced"}return e.type==="boolean"?"Toggle":"Option"}static _renderFontSelector(e,t,i,r,a,n){return s`
            <lcards-font-selector
                .hass=${e.hass}
                .value=${i||"Antonio"}
                .label=${r}
                .helper=${a}
                .disabled=${n||false}
                .showPreview=${true}
                @value-changed=${d=>this._handleChange(d,e,t)}>
            </lcards-font-selector>
        `}static _renderLcardsColorPicker(e,t,i,r,a,n){return s`
            <div class="param-full">
                ${r?s`<label class="field-label">${r}</label>`:""}
                <lcards-color-picker
                    .hass=${e.hass}
                    .value=${i??""}
                    .disabled=${n||false}
                    @value-changed=${d=>this._handleChange(d,e,t)}>
                </lcards-color-picker>
                ${a?s`<div class="field-helper">${a}</div>`:""}
            </div>
        `}static _renderPositionPicker(e,t,i,r,a,n){return s`
            <lcards-position-picker
                .value=${i}
                .label=${r}
                .helper=${a}
                .disabled=${n||false}
                @value-changed=${d=>this._handleChange(d,e,t)}>
            </lcards-position-picker>
        `}static _renderTagsSelector(e,t,i,r,a){var c,h;const n=(h=(c=window.lcards)==null?void 0:c.core)==null?void 0:h.systemsManager,o=((n==null?void 0:n.getAllTags())||[]).map(u=>({value:u,label:u}));return s`
            <ha-selector
                .hass=${e.hass}
                .selector=${{select:{mode:"list",multiple:true,custom_value:true,options:o}}}
                .value=${i||[]}
                .label=${r}
                .helper=${a}
                @value-changed=${u=>this._handleChange(u,e,t)}>
            </ha-selector>
        `}};p(S,"LCARdSFormFieldHelper");let m=S;const E=class E2 extends ${static get properties(){return{editor:{type:Object},hass:{type:Object},events:{type:Array},_audioAssets:{type:Array,state:true}}}constructor(){super(),this.editor,this.hass=void 0,this.events=["card_tap","card_hold","card_double_tap","card_hover"],this._audioAssets=[]}connectedCallback(){super.connectedCallback(),this._loadAssets()}_loadAssets(){var t,i;const e=(i=(t=window.lcards)==null?void 0:t.core)==null?void 0:i.assetManager;if(e)try{const r=e.getRegistry("audio");this._audioAssets=Array.from(r.assets.entries()).map(([a,n])=>{var d,o;return{key:a,description:((d=n.metadata)==null?void 0:d.description)||a,pack:((o=n.metadata)==null?void 0:o.pack)||"unknown"}})}catch{this._audioAssets=[]}}get _sounds(){var e,t;return((t=(e=this.editor)==null?void 0:e.config)==null?void 0:t.sounds)??{}}_isMasterEnabled(){return this._sounds.enabled!==false}_overrideValueFor(e){const t=this._sounds;return e in t?t[e]===null?"__mute__":t[e]:"__scheme__"}_updateSounds(e){if(!this.editor)return;const t={...this._sounds,...e};t.enabled===true&&delete t.enabled;for(const[i,r]of Object.entries(t))r==="__scheme__"&&delete t[i];this._commitSounds(t)}_setMasterEnabled(e){if(e){const{enabled:t,...i}=this._sounds;this._commitSounds(i)}else this._updateSounds({enabled:false})}_setOverride(e,t){if(t==="__scheme__"){const i={...this._sounds};delete i[e],i.enabled===true&&delete i.enabled,this._commitSounds(i)}else t==="__mute__"?this._updateSounds({[e]:null}):this._updateSounds({[e]:t})}_clearAllOverrides(){const e={};this._sounds.enabled===false&&(e.enabled=false),this._commitSounds(e)}_commitSounds(e){if(!this.editor)return;const t={...this.editor.config};Object.keys(e).length===0?delete t.sounds:t.sounds=e,this.editor.config=t,y(this.editor,"config-changed",{config:t}),this.requestUpdate()}_previewAsset(e){var t,i,r;!e||e==="__scheme__"||e==="__mute__"||(r=(i=(t=window.lcards)==null?void 0:t.core)==null?void 0:i.soundManager)==null||r.preview(e)}_previewEvent(e){var t,i,r;(r=(i=(t=window.lcards)==null?void 0:t.core)==null?void 0:i.soundManager)==null||r.previewEvent(e)}render(){var a,n,d;const e=this._sounds,t=this._isMasterEnabled(),i=((d=(n=(a=this.hass)==null?void 0:a.states)==null?void 0:n["input_boolean.lcards_sound_enabled"])==null?void 0:d.state)==="on",r=Object.keys(e).filter(o=>o!=="enabled").length;return s`
      <div class="tab-body">

        <!-- Informational banner when global sounds are disabled -->
        ${i?"":s`
          <div class="banner info">
            <ha-icon icon="mdi:volume-off"></ha-icon>
            Global sounds are currently disabled. Enable them in
            <strong>Config Panel → Sound</strong> for card overrides to take effect.
          </div>
        `}

        <!-- ── Master card sound toggle ── -->
        <lcards-form-section
          header="Card Sound Control"
          icon="mdi:volume-high"
          description="Control whether this card participates in the global sound system"
          ?expanded=${true}
          ?outlined=${true}>

          <div class="control-row">
            <div class="control-label">
              <ha-icon icon="${t?"mdi:volume-high":"mdi:volume-off"}"></ha-icon>
              <span>
                Sounds enabled for this card
                <span class="hint">When off, this card is always silent regardless of global settings</span>
              </span>
            </div>
            <ha-switch
              .checked=${t}
              @change=${o=>this._setMasterEnabled(o.target.checked)}
            ></ha-switch>
          </div>

        </lcards-form-section>

        <!-- ── Per-event overrides ── -->
        <lcards-form-section
          header="Per-Event Overrides"
          icon="mdi:tune-variant"
          description="Override individual sounds for this card. Omitted events use the active global scheme."
          ?expanded=${true}
          ?outlined=${true}
          class="${t?"":"dimmed"}">

          ${this._audioAssets.length===0?s`
            <div class="empty-hint">
              <ha-icon icon="mdi:information-outline"></ha-icon>
              No audio assets registered. Load a sound pack to enable per-event overrides.
            </div>
          `:""}

          <div class="overrides-table-wrapper">
            <table class="overrides-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Override</th>
                  <th style="width:52px;"></th>
                </tr>
              </thead>
              <tbody>
                ${this.events.map(o=>{const c=Y[o]||o,h=this._overrideValueFor(o);return s`
                    <tr class="${h!=="__scheme__"?"has-override":""}">
                      <td class="event-label">${c}</td>
                      <td>
                        <lcards-sound-source-selector
                          .hass=${this.hass}
                          .value=${h}
                          .audioAssets=${this._audioAssets}
                          .schemeLabel=${"(use global)"}
                          ?disabled=${!t}
                          @value-changed=${g=>this._setOverride(o,g.detail.value)}
                        ></lcards-sound-source-selector>
                      </td>
                      <td>
                        ${h!=="__mute__"?s`
                          <ha-icon-button
                            .label=${"Preview"}
                            @click=${()=>h==="__scheme__"?this._previewEvent(o):this._previewAsset(h)}
                            ?disabled=${!t}
                          >
                            <ha-icon icon="mdi:play"></ha-icon>
                          </ha-icon-button>
                        `:""}
                      </td>
                    </tr>
                  `})}
              </tbody>
            </table>
          </div>

          ${r>0?s`
            <ha-button @click=${()=>this._clearAllOverrides()} style="margin-top:8px">
              <ha-icon slot="start" icon="mdi:close-circle-outline"></ha-icon>
              Clear all overrides
            </ha-button>
          `:""}

        </lcards-form-section>

      </div>
    `}static get styles(){return[N,b`
        :host {
          display: block;
          padding: 8px 0;
        }

        .tab-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding-bottom: 8px;
          --lcards-section-spacing: 0;
        }

        .banner {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 0.9em;
        }
        .banner.info {
          background: color-mix(in srgb, var(--info-color, #03a9f4) 15%, transparent);
          border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--info-color, #03a9f4) 40%, transparent);
          color: var(--primary-text-color);
        }

        .control-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 8px 4px;
        }
        .control-label {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 0.95em;
        }
        .control-label span {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .hint {
          font-size: 0.8em;
          color: var(--secondary-text-color);
        }

        /* Override table */
        .overrides-table-wrapper {
          overflow-x: auto;
        }
        .overrides-table {
          width: 100%;
          border-collapse: collapse;
        }
        .overrides-table th {
          text-align: left;
          padding: 6px 8px;
          color: var(--secondary-text-color);
          border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
          position: sticky;
          top: 0;
          background: var(--card-background-color, #1c1c1c);
        }
        .overrides-table td {
          padding: 4px 8px;
          vertical-align: middle;
          border-bottom: var(--ha-border-width-sm) solid
            color-mix(in srgb, var(--divider-color) 40%, transparent);
        }
        ha-icon-button {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        ha-icon-button ha-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .overrides-table tr.has-override td {
          background: color-mix(in srgb, var(--primary-color) 8%, transparent);
        }
        .event-label {
          white-space: nowrap;
        }

        .empty-hint {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--secondary-text-color);
          font-size: 0.85em;
          padding: 8px 0;
        }

        /* Dim the overrides section when card sounds are disabled */
        .dimmed {
          opacity: 0.5;
          pointer-events: none;
        }
      `,Z]}};p(E,"LCARdSCardSoundTab");let A=E;customElements.get("lcards-card-sound-tab")||customElements.define("lcards-card-sound-tab",A);const re=b`
    /* List Container */
    .editor-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 12px;
    }

    /* List Item */
    .editor-item {
        background: var(--card-background-color);
        border: var(--ha-border-width-sm) solid var(--divider-color);
        border-radius: var(--ha-card-border-radius, 12px);
        overflow: hidden;
        transition: border-color 0.2s;
    }

    .editor-item:hover {
        border-color: var(--primary-color);
    }

    /* Item Header (clickable, expandable) */
    .editor-item-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        cursor: pointer;
        user-select: none;
        background: var(--secondary-background-color);
        transition: background 0.2s;
    }

    .editor-item-header:hover {
        background: var(--primary-background-color);
    }

    /* Drag Handle */
    .drag-handle {
        cursor: grab;
        color: var(--secondary-text-color);
        padding: 4px;
        margin-left: -4px;
        transition: color 0.2s;
    }

    .drag-handle:hover {
        color: var(--primary-text-color);
    }

    .drag-handle:active {
        cursor: grabbing;
    }

    /* Item Icon */
    .editor-item-icon {
        color: var(--primary-color);
        --mdc-icon-size: 24px;
    }

    /* Item Info */
    .editor-item-info {
        flex: 1;
        min-width: 0;
    }

    .editor-item-title {
        font-weight: 600;
        font-size: 16px;
        color: var(--primary-text-color);
    }

    .editor-item-subtitle {
        font-size: 12px;
        color: var(--secondary-text-color);
        font-family: monospace;
        margin-top: 4px;
    }

    /* Item Actions */
    .editor-item-actions {
        display: flex;
        gap: 4px;
    }

    .editor-item-actions ha-icon-button {
        --ha-icon-button-size: 36px;
        --mdc-icon-size: 20px;
    }

    /* Expand Icon */
    .expand-icon {
        transition: transform 0.2s;
    }

    .expand-icon.expanded {
        transform: rotate(180deg);
    }

    /* Item Content (collapsible) */
    .editor-item-content {
        padding: 16px;
        background: var(--primary-background-color);
        border-top: var(--ha-border-width-sm) solid var(--divider-color);
    }

    /* Dragging States */
    .editor-item.dragging {
        opacity: 0.5;
    }

    .editor-item.drag-over {
        border-top: 3px solid var(--primary-color);
    }

    /* Add Button */
    .add-button {
        width: 100%;
        margin-top: 8px;
    }

    /* Form Sections within Item Content */
    .editor-item-content .section {
        margin-bottom: 24px;
    }

    .editor-item-content .section:last-child {
        margin-bottom: 0;
    }

    .editor-item-content .section-header {
        font-size: 15px;
        font-weight: 600;
        color: var(--primary-text-color);
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: var(--ha-border-width-md) solid var(--primary-color);
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .editor-item-content .form-row {
        margin-bottom: 16px;
    }

    .editor-item-content .form-row:last-child {
        margin-bottom: 0;
    }

    /* Help Text */
    .help-text {
        font-size: 12px;
        color: var(--secondary-text-color);
        margin-top: 6px;
        line-height: 1.4;
    }

    .help-icon {
        font-size: 16px;
        color: var(--secondary-text-color);
        cursor: help;
    }

    /* Toggle Row Pattern */
    .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px;
        background: var(--secondary-background-color);
        border-radius: 6px;
        margin-bottom: 16px;
    }

    .toggle-label {
        font-weight: 500;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    /* Field Label */
    .field-label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        font-size: 14px;
        color: var(--primary-text-color);
    }

    /* Warning Banner */
    .warning-banner {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px 16px;
        background: var(--warning-color);
        color: white;
        border-radius: 6px;
        margin-bottom: 16px;
        font-size: 13px;
        line-height: 1.4;
    }

    .warning-banner ha-icon {
        --mdc-icon-size: 20px;
        flex-shrink: 0;
    }
`,z=class z2 extends ${static get properties(){return{zones:{type:Object},_expandedIndex:{type:Number,state:true}}}constructor(){super(),this.zones={},this._expandedIndex=null,f.debug("[ZoneListEditor] Initialized")}static get styles(){return[re,b`
                :host {
                    display: block;
                }

                .zone-editor {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .empty-state {
                    text-align: center;
                    padding: 24px 16px;
                    color: var(--secondary-text-color);
                    border: 1px dashed var(--divider-color);
                    border-radius: var(--ha-card-border-radius, 12px);
                }

                .empty-state-title {
                    font-weight: 500;
                    margin-bottom: 8px;
                }

                .empty-state-desc {
                    font-size: 13px;
                    line-height: 1.5;
                }

                .unit-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .unit-row span {
                    font-size: 13px;
                    font-weight: 500;
                    color: var(--secondary-text-color);
                    white-space: nowrap;
                }

                .unit-select {
                    flex: 1;
                }

                .dim-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .help-text {
                    font-size: 12px;
                    color: var(--secondary-text-color);
                    line-height: 1.5;
                    padding: 10px 12px;
                    background: var(--secondary-background-color);
                    border-radius: 6px;
                    margin-top: 8px;
                }

                .help-text code {
                    font-family: monospace;
                    background: var(--code-editor-background-color, rgba(0,0,0,0.1));
                    padding: 1px 4px;
                    border-radius: 3px;
                }
            `]}_toArray(){return!this.zones||typeof this.zones!="object"?[]:Object.entries(this.zones).map(([e,t])=>({name:e,...t||{}}))}_toConfig(e){const t={};for(const{name:i,...r}of e)i&&(t[i]=r);return t}_emit(e){this.dispatchEvent(new CustomEvent("zones-changed",{detail:{value:this._toConfig(e)},bubbles:true,composed:true}))}_isPercent(e){return e.x_percent!=null||e.y_percent!=null||e.width_percent!=null||e.height_percent!=null}_subtitle(e){if(this._isPercent(e)){const n=e.x_percent??"?",d=e.y_percent??"?",o=e.width_percent??"?",c=e.height_percent??"?";return`x:${n}% y:${d}% w:${o}% h:${c}%`}const t=e.x??"?",i=e.y??"?",r=e.width??"?",a=e.height??"?";return`x:${t}px y:${i}px w:${r}px h:${a}px`}_addZone(){const e=this._toArray();let t=e.length+1;for(;e.some(i=>i.name===`zone_${t}`);)t++;e.push({name:`zone_${t}`,x:0,y:0,width:100,height:50}),this._expandedIndex=e.length-1,this._emit(e)}_deleteZone(e,t){e.stopPropagation();const i=this._toArray();i.splice(t,1),this._expandedIndex>=i.length&&(this._expandedIndex=null),this._emit(i)}_moveZone(e,t,i){e.stopPropagation();const r=this._toArray(),a=t+i;a<0||a>=r.length||([r[t],r[a]]=[r[a],r[t]],this._expandedIndex=a,this._emit(r))}_updateField(e,t,i){const r=this._toArray();r[e]={...r[e],[t]:i},this._emit(r)}_rename(e,t){const i=this._toArray();i[e]={...i[e],name:t},this._emit(i)}_toggleUnits(e,t){const i=this._toArray(),r=i[e];t?i[e]={name:r.name,x_percent:r.x_percent??(r.x!=null?parseFloat((r.x/5).toFixed(1)):0),y_percent:r.y_percent??(r.y!=null?parseFloat((r.y/5).toFixed(1)):0),width_percent:r.width_percent??(r.width!=null?parseFloat((r.width/5).toFixed(1)):50),height_percent:r.height_percent??(r.height!=null?parseFloat((r.height/5).toFixed(1)):100)}:i[e]={name:r.name,x:r.x??(r.x_percent!=null?Math.round(r.x_percent*5):0),y:r.y??(r.y_percent!=null?Math.round(r.y_percent*5):0),width:r.width??(r.width_percent!=null?Math.round(r.width_percent*5):100),height:r.height??(r.height_percent!=null?Math.round(r.height_percent*5):50)},this._emit(i)}render(){const e=this._toArray();return s`
            <div class="zone-editor">

                <ha-button class="add-button" @click=${this._addZone}>
                    <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                    Add Zone
                </ha-button>

                ${e.length===0?this._renderEmptyState():s`
                    <div class="editor-list">
                        ${e.map((t,i)=>this._renderItem(t,i,e.length))}
                    </div>
                `}

            </div>
        `}_renderEmptyState(){return s`
            <div class="empty-state">
                <div class="empty-state-title">No custom zones defined</div>
                <div class="empty-state-desc">
                    Custom zones let you define named rectangular areas that text fields
                    can target via <code>zone:</code>. They can override auto-calculated
                    card zones (e.g. <code>body</code>) or add entirely new ones.
                </div>
            </div>
        `}_renderItem(e,t,i){const r=this._expandedIndex===t,a=this._isPercent(e);return s`
            <div class="editor-item">

                <div class="editor-item-header"
                     @click=${()=>{this._expandedIndex=r?null:t,this.requestUpdate()}}>

                    <ha-icon class="editor-item-icon" icon="mdi:vector-rectangle"></ha-icon>

                    <div class="editor-item-info">
                        <div class="editor-item-title">${e.name||"(unnamed)"}</div>
                        <div class="editor-item-subtitle">${this._subtitle(e)}</div>
                    </div>

                    <div class="editor-item-actions">
                        <ha-icon-button
                            .label=${"Move Up"}
                            .disabled=${t===0}
                            @click=${n=>this._moveZone(n,t,-1)}>
                            <ha-icon icon="mdi:arrow-up"></ha-icon>
                        </ha-icon-button>
                        <ha-icon-button
                            .label=${"Move Down"}
                            .disabled=${t===i-1}
                            @click=${n=>this._moveZone(n,t,1)}>
                            <ha-icon icon="mdi:arrow-down"></ha-icon>
                        </ha-icon-button>
                        <ha-icon-button
                            .label=${"Delete"}
                            @click=${n=>this._deleteZone(n,t)}>
                            <ha-icon icon="mdi:delete"></ha-icon>
                        </ha-icon-button>
                    </div>

                    <ha-icon
                        class="expand-icon ${r?"expanded":""}"
                        icon="mdi:chevron-down">
                    </ha-icon>

                </div>

                ${r?this._renderItemContent(e,t,a):v}

            </div>
        `}_renderItemContent(e,t,i){return s`
            <div class="editor-item-content">

                <!-- Zone name -->
                <div class="form-row">
                    <ha-selector
                        .selector=${{text:{}}}
                        .value=${e.name}
                        .label=${"Zone name: referenced as zone: in text fields"}
                        @value-changed=${r=>this._rename(t,r.detail.value)}>
                    </ha-selector>
                </div>

                <!-- Unit mode toggle -->
                <div class="unit-row">
                    <span>Units:</span>
                    <div class="unit-select">
                        <ha-selector
                            .selector=${{select:{options:[{value:"px",label:"Pixels (px)"},{value:"percent",label:"Percent (%)"}],mode:"dropdown"}}}
                            .value=${i?"percent":"px"}
                            @value-changed=${r=>this._toggleUnits(t,r.detail.value==="percent")}>
                        </ha-selector>
                    </div>
                </div>

                <!-- Dimension inputs — px mode -->
                ${i?v:s`
                    <div class="dim-grid">
                        <ha-selector
                            .selector=${{number:{min:0,step:1,mode:"box",unit_of_measurement:"px"}}}
                            .value=${e.x??0}
                            .label=${"X  (left edge)"}
                            @value-changed=${r=>this._updateField(t,"x",r.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .selector=${{number:{min:0,step:1,mode:"box",unit_of_measurement:"px"}}}
                            .value=${e.y??0}
                            .label=${"Y  (top edge)"}
                            @value-changed=${r=>this._updateField(t,"y",r.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .selector=${{number:{min:0,step:1,mode:"box",unit_of_measurement:"px"}}}
                            .value=${e.width??100}
                            .label=${"Width"}
                            @value-changed=${r=>this._updateField(t,"width",r.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .selector=${{number:{min:0,step:1,mode:"box",unit_of_measurement:"px"}}}
                            .value=${e.height??50}
                            .label=${"Height"}
                            @value-changed=${r=>this._updateField(t,"height",r.detail.value)}>
                        </ha-selector>
                    </div>
                `}

                <!-- Dimension inputs — percent mode -->
                ${i?s`
                    <div class="dim-grid">
                        <ha-selector
                            .selector=${{number:{min:0,max:100,step:.1,mode:"box",unit_of_measurement:"%"}}}
                            .value=${e.x_percent??0}
                            .label=${"X  (left edge)"}
                            @value-changed=${r=>this._updateField(t,"x_percent",r.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .selector=${{number:{min:0,max:100,step:.1,mode:"box",unit_of_measurement:"%"}}}
                            .value=${e.y_percent??0}
                            .label=${"Y  (top edge)"}
                            @value-changed=${r=>this._updateField(t,"y_percent",r.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .selector=${{number:{min:0,max:100,step:.1,mode:"box",unit_of_measurement:"%"}}}
                            .value=${e.width_percent??50}
                            .label=${"Width"}
                            @value-changed=${r=>this._updateField(t,"width_percent",r.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .selector=${{number:{min:0,max:100,step:.1,mode:"box",unit_of_measurement:"%"}}}
                            .value=${e.height_percent??100}
                            .label=${"Height"}
                            @value-changed=${r=>this._updateField(t,"height_percent",r.detail.value)}>
                        </ha-selector>
                    </div>
                `:v}

                <div class="help-text">
                    Reference this zone in any text field with <code>zone: ${e.name||"zone_name"}</code>.
                    Percent values are resolved against the card's rendered pixel size at runtime.
                    You can also mix units per axis (e.g. <code>x: 10</code> with <code>height_percent: 100</code>).
                </div>

            </div>
        `}};p(z,"LCARdSZoneListEditor");let T=z;customElements.get("lcards-zone-list-editor")||customElements.define("lcards-zone-list-editor",T);const ae=b`
  .launcher {
    background: var(--primary-background-color);
    border: var(--ha-border-width-sm) solid var(--divider-color);
    border-radius: var(--ha-card-border-radius, var(--ha-border-radius-lg));
    padding: var(--ha-space-5) var(--ha-space-6);
    margin-bottom: var(--lcards-section-spacing, var(--ha-space-4));
    box-shadow: var(--ha-box-shadow-s);
  }
  .launcher-head {
    display: flex;
    align-items: center;
    gap: var(--ha-space-3);
    margin: 0 0 var(--ha-space-2);
  }
  .launcher-head ha-icon {
    --mdc-icon-size: 24px;
    color: var(--primary-color);
    flex: none;
  }
  .launcher-head h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    color: var(--primary-text-color);
  }
  .launcher-desc {
    margin: 0 0 var(--ha-space-3);
    font-size: 13px;
    line-height: 1.5;
    color: var(--secondary-text-color);
  }
  .launcher-stats {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ha-space-1) var(--ha-space-4);
    margin: 0 0 var(--ha-space-4);
    font-size: 14px;
    color: var(--primary-text-color);
  }
  .launcher-stats strong {
    font-weight: 600;
  }
  .launcher-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--ha-space-2);
    padding-top: var(--ha-space-3);
    border-top: var(--ha-border-width-sm) solid var(--divider-color);
  }
`;function ne({icon:l,title:e,description:t,stats:i=[],actions:r}){return s`
    <div class="launcher">
      <div class="launcher-head">
        <ha-icon icon=${l}></ha-icon>
        <h3>${e}</h3>
      </div>
      <p class="launcher-desc">${t}</p>
      ${i.length?s`
        <div class="launcher-stats">
          ${i.map(a=>s`<span><strong>${a.value}</strong> ${a.label}</span>`)}
        </div>
      `:v}
      <div class="launcher-actions">
        ${r.map((a,n)=>s`
          <ha-button variant="brand" appearance=${n===0?"accent":"outlined"} @click=${a.onClick}>
            <ha-icon icon=${a.icon} slot="start"></ha-icon>
            ${a.label}
          </ha-button>
        `)}
      </div>
    </div>
  `}p(ne,"renderLauncher");const oe="/lcards-config",se=W;function le(l){const t=[...(l==null?void 0:l.resolution_chain)??[]].reverse().find(i=>i.step==="value");return(t==null?void 0:t.value)??(l==null?void 0:l.resolved_value)}p(le,"tokenValue");function de(l){return Object.entries((l==null?void 0:l.theme_tokens)??{}).map(([e,t])=>({path:e,value:le(t),fields:t.used_by_fields??[],overridden:(t.resolution_chain??[]).some(i=>i.step==="override")})).sort((e,t)=>e.path.localeCompare(t.path))}p(de,"cardTokens");const F=class F2 extends ${static get properties(){return{config:{type:Object},hass:{type:Object},_provenance:{type:Object,state:true},_cardFound:{type:Boolean,state:true}}}constructor(){super(),this.config=void 0,this.hass=void 0,this._provenance=null,this._cardFound=false,this._card=null,this._unsubscribe=null}static get styles(){return[M,ae,b`
            :host {
                display: block;
            }

            .tokens {
                display: flex;
                flex-direction: column;
                background: var(--primary-background-color);
                border-radius: var(--ha-border-radius-lg);
                padding: var(--ha-space-1) var(--ha-space-4);
            }

            .token {
                display: flex;
                align-items: center;
                gap: var(--ha-space-3);
                padding: var(--ha-space-2) 0;
                border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
            }

            .token:last-child {
                border-bottom: none;
            }

            .swatch {
                flex: none;
                width: 24px;
                height: 24px;
                border-radius: var(--ha-border-radius-sm);
                border: var(--ha-border-width-sm) solid var(--divider-color);
            }

            .swatch.none {
                display: flex;
                align-items: center;
                justify-content: center;
                border: none;
                color: var(--secondary-text-color);
                --mdc-icon-size: 18px;
            }

            .main {
                flex: 1;
                min-width: 0;
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .path {
                font-family: var(--code-font-family, monospace);
                font-size: 13px;
                font-weight: 600;
                color: var(--primary-text-color);
                overflow-wrap: anywhere;
            }

            .sub {
                font-size: 12px;
                color: var(--secondary-text-color);
                overflow-wrap: anywhere;
            }

            .sub code {
                font-family: var(--code-font-family, monospace);
            }

            .chip {
                padding: 1px var(--ha-space-2);
                border-radius: var(--ha-border-radius-pill);
                font-size: 12px;
                font-weight: 600;
                background: color-mix(in srgb, var(--warning-color) 22%, transparent);
                color: var(--primary-text-color);
                white-space: nowrap;
            }

            ha-icon-button {
                --ha-icon-button-size: 32px;
                --mdc-icon-size: 18px;
                color: var(--primary-color);
            }

            .empty {
                margin: 0;
            }
        `]}disconnectedCallback(){var e;super.disconnectedCallback(),(e=this._unsubscribe)==null||e.call(this),this._unsubscribe=null,this._card=null}updated(e){e.has("config")&&this._load()}_load(){var t,i,r,a;let e=null;try{e=this.config?(i=(t=window.lcards)==null?void 0:t.findCardByConfig)==null?void 0:i.call(t,this.config):null}catch(n){f.debug("[CardThemeTab] No card for this config",{error:n==null?void 0:n.message})}typeof(e==null?void 0:e.getProvenance)!="function"&&(e=null),e!==this._card&&((r=this._unsubscribe)==null||r.call(this),this._unsubscribe=((a=e==null?void 0:e.subscribeProvenance)==null?void 0:a.call(e,()=>this._read()))??null,this._card=e),this._read()}_read(){this._cardFound=!!this._card,this._provenance=this._card?this._card.getProvenance():null}_openPanel(e){window.open(`${oe}?tab=${e}`,"_blank","noopener")}render(){var r,a,n,d;const e=de(this._provenance),t=e.filter(o=>o.overridden).length,i=(d=(n=(a=(r=window.lcards)==null?void 0:r.core)==null?void 0:a.themeManager)==null?void 0:n.getActiveTheme)==null?void 0:d.call(n);return s`
            ${ne({icon:"mdi:palette",title:"Theme",description:"The theme tokens this card uses and their values here. Browse every token, the alert mode lab and theme packs in the LCARdS panel.",stats:[...i!=null&&i.name?[{value:i.name,label:"theme"}]:[],{value:e.length,label:e.length===1?"token on this card":"tokens on this card"},...t?[{value:t,label:"overridden"}]:[]],actions:[{label:"Open Theme Studio",icon:"mdi:palette-swatch",onClick:p(()=>this._openPanel("theme"),"onClick")},{label:"Pack Explorer",icon:"mdi:package-variant",onClick:p(()=>this._openPanel("packs"),"onClick")}]})}
            ${this._cardFound?e.length?s`<div class="tokens">${e.map(o=>this._renderToken(o))}</div>`:s`<p class="hint empty">This card uses no theme tokens.</p>`:s`<p class="hint empty">No rendered card for this config yet: the tokens come from the card editor's preview.</p>`}
        `}_renderToken(e){const t=`theme:${e.path}`;return s`
            <div class="token" data-path=${e.path}>
                ${se(e.value)?s`<span class="swatch" style=${J({background:e.value})}></span>`:s`<span class="swatch none"><ha-icon icon="mdi:palette-outline"></ha-icon></span>`}
                <div class="main">
                    <span class="path">${t}</span>
                    <span class="sub"><code>${e.value===void 0?"-":String(e.value)}</code>${e.fields.length?s` · ${e.fields.join(", ")}`:v}</span>
                </div>
                ${e.overridden?s`<span class="chip" title="Changed by a theme override">override</span>`:v}
                <ha-icon-button .label=${"Copy token"} title="Copy token" @click=${()=>q(t)}>
                    <ha-icon icon="mdi:content-copy"></ha-icon>
                </ha-icon-button>
            </div>
        `}};p(F,"LCARdSCardThemeTab");let O=F;customElements.get("lcards-card-theme-tab")||customElements.define("lcards-card-theme-tab",O);const j=class j2 extends ${static get properties(){return{hass:{type:Object},config:{type:Object},cardType:{type:String},_selectedTab:{type:Number,state:true},_yamlValue:{type:String,state:true},_validationErrors:{type:Array,state:true},_singletons:{type:Object,state:true},_schemaMissing:{type:Boolean,state:true},_developerSubTab:{type:Number,state:true}}}constructor(){super(),this.hass=void 0,this.lovelace=void 0,this.config={},this.cardType="",this._selectedTab=0,this._yamlValue="",this._validationErrors=[],this._singletons=null,this._isUpdatingYaml=false,this._configUpdateDebounce=null,this._schemaMissing=false,this._developerSubTab=0}static get styles(){return[N,M,b`
            .main-engineering-hint {
                margin: 0 0 var(--ha-space-2);
            }
            ha-tab-group-tab ha-icon {
                --mdc-icon-size: 18px;
                margin-right: var(--ha-space-2);
            }
            /* "Docs" link at the top of each tab: opens the page in a new tab */
            .tab-docs {
                display: flex;
                justify-content: flex-end;
                margin: var(--ha-space-3) 0 var(--ha-space-3);
            }
            .tab-docs a {
                display: inline-flex;
                align-items: center;
                gap: var(--ha-space-1);
                padding: var(--ha-space-1) var(--ha-space-3);
                background: color-mix(in srgb, var(--primary-text-color) 10%, transparent);
                border-radius: var(--ha-border-radius-pill);
                color: var(--primary-text-color);
                font-size: var(--ha-font-size-m, 14px);
                font-weight: var(--ha-font-weight-medium, 500);
                line-height: 1.4;
                text-decoration: none;
            }
            .tab-docs a:hover {
                background: color-mix(in srgb, var(--primary-text-color) 20%, transparent);
            }
            .tab-docs ha-icon {
                --mdc-icon-size: 18px;
            }
        `]}setConfig(e){var t;if(!e)throw new Error("Invalid configuration");f.debug("[LCARdSBaseEditor] setConfig called with:",e),this.config=typeof globalThis.structuredClone=="function"?globalThis.structuredClone(e):JSON.parse(JSON.stringify(e)),!this.config.type&&this.cardType&&(f.warn('[LCARdSBaseEditor] Config is missing required "type" property! Auto-restoring...'),this.config.type=`custom:lcards-${this.cardType}`,f.warn(`[LCARdSBaseEditor] Auto-restored type to: ${this.config.type}`)),this._yamlValue=I(this.config),this._validateConfig(),f.debug("[LCARdSBaseEditor] Config initialized:",{config:this.config,yaml:this._yamlValue}),(t=window.lcards)!=null&&t.core&&(this._singletons=window.lcards.core),this.requestUpdate("config")}_handleChildConfigChange(e){var i;e.stopPropagation();const t=(i=e.detail)==null?void 0:i.config;t&&this._updateConfig(t)}_getTabDefinitions(){return[]}render(){const e=this._getTabDefinitions();return s`
            <div class="editor-container" @config-changed=${this._handleChildConfigChange}>
                ${this._schemaMissing?s`
                    <ha-alert alert-type="error" title="Schema Not Registered">
                        <p>
                            The schema for card type <code>${this.cardType}</code> is not registered.
                        </p>
                        <p>
                            <strong>For maintainers:</strong> Register a schema for this card type using:
                            <code>core.configManager.registerCardSchema('${this.cardType}', schema)</code>
                        </p>
                        <p>
                            See <a href=${k(P.buildingAnEditor)} target="_blank" rel="noopener">Building an Editor</a>
                            for more information on schema registration.
                        </p>
                    </ha-alert>
                `:""}

                ${this._renderValidationErrors()}

                <!-- Using HA native tab components (Issue #82) -->
                <ha-tab-group @wa-tab-show=${this._handleTabChange}>
                    ${e.map((t,i)=>s`
                        <ha-tab-group-tab value="${i}" ?active=${this._selectedTab===i}>
                            ${t.label}
                        </ha-tab-group-tab>
                    `)}

                    ${e.map((t,i)=>s`
                        <div class="tab-panel" ?hidden=${this._selectedTab!==i}>
                            ${this._renderTabContent(t)}
                        </div>
                    `)}
                </ha-tab-group>
            </div>
        `}_renderTabContent(e){if(!e||!e.content)return s`<div>No content available</div>`;const t=e.docs??X(this.cardType,e.label);return s`
            ${t?s`
                <div class="tab-docs">
                    <a href=${k(t)} target="_blank" rel="noopener noreferrer">
                        Docs<ha-icon icon="mdi:open-in-new"></ha-icon>
                    </a>
                </div>
            `:""}
            ${e.content()}
        `}_handleTabChange(e){var i;const t=(i=e.target.activeTab)==null?void 0:i.getAttribute("value");t!=null&&(this._selectedTab=parseInt(t,10),this.requestUpdate())}_updateConfig(e,t="visual"){if(!e||typeof e!="object"){f.warn("[LCARdSBaseEditor] Invalid config updates:"+JSON.stringify(e));return}this.config,this.config=H(this.config,e),this.config.type||(f.warn('[LCARdSBaseEditor] Config is missing required "type" property after merge! Auto-restoring...'),this.config.type=`custom:lcards-${this.cardType}`,f.warn(`[LCARdSBaseEditor] Auto-restored type to: ${this.config.type}`)),this._validateConfig(),t==="visual"&&!this._isUpdatingYaml&&(this._isUpdatingYaml=true,this._yamlValue=I(this.config),requestAnimationFrame(()=>{this._isUpdatingYaml=false})),this._configUpdateDebounce&&clearTimeout(this._configUpdateDebounce),this._configUpdateDebounce=setTimeout(()=>{y(this,"config-changed",{config:this.config}),this._configUpdateDebounce=null},50)}_handleYamlChange(e){if(this._isUpdatingYaml)return;this._yamlValue=e.detail.value;const t=Q(this._yamlValue);if(!t.valid){this._validationErrors=[{message:`YAML Syntax Error: ${t.error}`,line:t.lineNumber}],this.requestUpdate();return}try{const i=K(this._yamlValue),r=this._validateConfigWithSingleton(i);this._validationErrors=r.errors.map(a=>({path:a.field||"",message:a.message})),r.valid&&(this._isUpdatingYaml=true,this.config=i,y(this,"config-changed",{config:this.config}),requestAnimationFrame(()=>{this._isUpdatingYaml=false})),this.requestUpdate()}catch(i){this._validationErrors=[{message:`Parse Error: ${i.message}`}],this.requestUpdate()}}_validateConfigWithSingleton(e){var r,a;const t=(a=(r=window.lcards)==null?void 0:r.core)==null?void 0:a.validationService,i=this._getSchema();return!t||!i?{valid:true,errors:[],warnings:[]}:t.validate(e,i,{cardType:this.cardType,source:"editor"})}_validateConfig(){const e=this._validateConfigWithSingleton(this.config),t=(e.errors||[]).map(r=>({path:r.field||"",message:r.message,severity:"error"})),i=(e.warnings||[]).map(r=>({path:r.field||"",message:r.message,severity:"warning"}));this._validationErrors=[...t,...i]}get _isLightEntity(){var e;return typeof((e=this.config)==null?void 0:e.entity)=="string"&&this.config.entity.startsWith("light.")}_getSchema(){var i,r;const e=(r=(i=window.lcards)==null?void 0:i.core)==null?void 0:r.configManager;if(!e)return f.warn("⚠️ [LCARdSBaseEditor] CoreConfigManager not available"),this._schemaMissing=true,{};const t=e.getCardSchema(this.cardType);return t?(this._schemaMissing=false,t):(f.warn(`⚠️ [LCARdSBaseEditor] No schema registered for card type: ${this.cardType}`),this._schemaMissing=true,{})}_getConfigValue(e){if(!e)return;const t=e.split(".");let i=this.config;for(const r of t){if(i==null)return;i=i[r]}return i}_setConfigValue(e,t){if(!e){f.warn("⚠️ [LCARdSBaseEditor] Cannot set config value with empty path");return}const i=e.split(".");if(i.some(d=>!isNaN(Number(d)))){const d=JSON.parse(JSON.stringify(this.config||{}));let o=d;for(let u=0;u<i.length-1;u++){const g=i[u],C=i[u+1];!isNaN(Number(C))?Array.isArray(o[g])||(o[g]=[]):(!o[g]||typeof o[g]!="object")&&(o[g]={}),o=o[g]}const c=i[i.length-1];o[c]=t;const h=this.config;this.config=d,y(this,"config-changed",{config:this.config}),this.requestUpdate("config",h);return}const a={};let n=a;for(let d=0;d<i.length-1;d++)n[i[d]]={},n=n[i[d]];n[i[i.length-1]]=t,t==null||t===""?this._removeConfigPath(e):this._updateConfig(a)}_removeConfigPath(e){if(!e)return;const t=e.split("."),i=JSON.parse(JSON.stringify(this.config||{}));let r=i;for(let n=0;n<t.length-1;n++){if(!r[t[n]])return;r=r[t[n]]}delete r[t[t.length-1]];for(let n=t.length-2;n>=0;n--){const d=t.slice(0,n+1);let o=i;for(let u=0;u<d.length-1;u++)o=o[d[u]];const c=d[d.length-1],h=o[c];if(h&&typeof h=="object"&&!Array.isArray(h))if(Object.keys(h).length===0)delete o[c];else break;else break}const a=this.config;this.config=i,y(this,"config-changed",{config:this.config}),this.requestUpdate("config",a)}_getSchemaForPath(e){if(!e)return null;const t=this._getSchema();if(!t||!t.properties)return null;const i=e.split(".");let r=t;for(const a of i){if(!isNaN(Number(a))&&r.type==="array"&&r.items){r=r.items;continue}if(r.properties&&r.properties[a]){r=r.properties[a];continue}if(r.patternProperties){let n=false,d=0,o=null;for(const[c,h]of Object.entries(r.patternProperties))try{new RegExp(c).test(a)&&(d++,n||(r=h,o=c,n=true))}catch(u){f.warn("⚠️ [LCARdSBaseEditor] Invalid regex in patternProperties:",c,u)}if(d>1&&f.warn(`[BaseEditor] Multiple patternProperties matched key "${a}"; using first match.`),n)continue}if(r.additionalProperties){if(typeof r.additionalProperties=="object"){r=r.additionalProperties;continue}else if(r.additionalProperties===true)return{type:["string","number","boolean","object","array"],description:"Additional property (no specific schema defined)"}}if(Array.isArray(r.oneOf)){let n=false;for(const d of r.oneOf)if(d&&d.properties&&d.properties[a]){r=d.properties[a],n=true;break}if(n)continue}return null}return r}_evaluateCondition(e){if(!e)return true;try{return new Function("config","hass",`return ${e};`)(this.config,this.hass)}catch(t){return f.warn("⚠️ [LCARdSBaseEditor] Condition evaluation failed:",e,t),true}}_renderValidationErrors(){if(!this._validationErrors||this._validationErrors.length===0)return s``;const e=this._validationErrors.filter(i=>i.severity==="error"),t=this._validationErrors.filter(i=>i.severity==="warning");return s`
            ${e.length>0?s`
                <ha-alert alert-type="error" title="Validation Errors (${e.length})">
                    <ul>
                        ${e.map(i=>s`
                            <li>${i.path?`${i.path}: `:""}${i.message}</li>
                        `)}
                    </ul>
                </ha-alert>
            `:""}

            ${t.length>0?s`
                <ha-alert alert-type="warning" title="Validation Warnings (${t.length})">
                    <ul>
                        ${t.map(i=>s`
                            <li>${i.path?`${i.path}: `:""}${i.message}</li>
                        `)}
                    </ul>
                </ha-alert>
            `:""}
        `}_renderFromConfig(e){if(!e)return s``;if(Array.isArray(e))return s`${e.map(t=>this._renderFromConfig(t))}`;if(e.condition&&!this._evaluateCondition(e.condition))return s``;switch(e.type){case"section":return this._renderConfigSection(e);case"grid":return this._renderConfigGrid(e);case"field":return this._renderConfigField(e);case"custom":return this._renderConfigCustom(e);default:return f.warn("⚠️ [LCARdSBaseEditor] Unknown config type:",e.type),s``}}_renderConfigSection(e){const{header:t="",description:i="",icon:r="",expanded:a=false,outlined:n=true,headerLevel:d="4",children:o=[]}=e;return s`
            <lcards-form-section
                header="${t}"
                description="${i}"
                icon="${r}"
                ?expanded=${a}
                ?outlined=${n}
                headerLevel="${d}">
                ${this._renderFromConfig(o)}
            </lcards-form-section>
        `}_renderConfigGrid(e){const{children:t=[]}=e;return s`
            <lcards-grid-layout>
                ${this._renderFromConfig(t)}
            </lcards-grid-layout>
        `}_renderConfigField(e){const{path:t,label:i="",helper:r=""}=e;return t?m.renderField(this,t,{label:i,helper:r}):(f.warn('⚠️ [LCARdSBaseEditor] Field config missing required "path":',e),s``)}_renderConfigCustom(e){const{render:t}=e;return typeof t!="function"?(f.warn('⚠️ [LCARdSBaseEditor] Custom config missing "render" function:',e),s``):t.call(this)}_renderTextPadding(e){const t=this._getSchemaForPath(e);return t&&Array.isArray(t.oneOf)?m.renderField(this,e,{label:"Padding"}):s`
            <lcards-object-editor
                .editor=${this}
                .config=${this.config}
                path="${e}"
                .properties=${["top","right","bottom","left"]}
                controlType="number"
                .controlConfig=${{min:0,max:100,mode:"box"}}
                columns="2">
            </lcards-object-editor>
        `}_renderFontConfig(e){return s`
            <lcards-form-section
                header="Font Settings"
                description="Configure font size, weight, and family"
                icon="mdi:format-text"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="5">

                <lcards-grid-layout>
                    ${m.renderField(this,`${e}.font_size`,{label:"Font Size"})}

                    ${m.renderField(this,`${e}.font_weight`,{label:"Font Weight"})}

                    ${m.renderField(this,`${e}.font_family`,{label:"Font Family"})}
                </lcards-grid-layout>
            </lcards-form-section>
        `}_renderTextAlignment(e){return s`
            <lcards-form-section
                header="Text Alignment"
                description="Configure text alignment and positioning"
                icon="mdi:format-align-center"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="5">

                <lcards-grid-layout>
                    ${m.renderField(this,`${e}.position`,{label:"Position"})}

                    ${m.renderField(this,`${e}.rotation`,{label:"Rotation"})}

                    ${m.renderField(this,`${e}.justify`,{label:"Horizontal Align"})}

                    ${m.renderField(this,`${e}.align`,{label:"Vertical Align"})}
                </lcards-grid-layout>
            </lcards-form-section>
        `}_getRangesAttributeOptions(e=(t=>(t=this.config)==null?void 0:t.entity)()){return ee(this.hass,e)}_renderRangesAttributeSelector(){var r,a;const e=(r=this.config)==null?void 0:r.entity,t=((a=this.config)==null?void 0:a.ranges_attribute)||"",i=[{value:"__none__",label:"(Use entity state)"},...this._getRangesAttributeOptions()];return s`
            <ha-selector
                .hass=${this.hass}
                .label=${"Range Attribute"}
                .helper=${'Attribute value compared against range conditions (above:/below:/between:). Select "(Use entity state)" to clear.'}
                .disabled=${!e}
                .selector=${{select:{mode:"dropdown",options:i,custom_value:true}}}
                .value=${t||"__none__"}
                @value-changed=${n=>{let d=(n.detail.value??"").trim();if(d==="__none__"||!d){this._removeConfigPath("ranges_attribute");return}d==="brightness"&&(d="brightness_pct"),this._setConfigValue("ranges_attribute",d)}}>
            </ha-selector>
        `}_getStateAttributeOptions(){var r,a,n;const e=(r=this.config)==null?void 0:r.entity,t=[];if(!e||!((n=(a=this.hass)==null?void 0:a.states)!=null&&n[e]))return t;const i=Object.keys(this.hass.states[e].attributes||{}).sort();for(const d of i)t.push({value:d,label:d});return t}_renderStateAttributeSelector(){var a,n,d,o;const e=(a=this.config)==null?void 0:a.entity,t=((n=this.config)==null?void 0:n.state_attribute)||"",i=e&&((o=(d=this.hass)==null?void 0:d.states)!=null&&o[e])?Object.keys(this.hass.states[e].attributes||{}).sort().map(c=>({value:c,label:c})):[],r=[{value:"__none__",label:"(Use entity state)"},...i];return s`
            <ha-selector
                .hass=${this.hass}
                .label=${"State Attribute"}
                .helper=${'Attribute whose string value is matched against color-config keys (e.g. "fade", "true"). Select "(Use entity state)" to clear.'}
                .disabled=${!e}
                .selector=${{select:{mode:"dropdown",options:r,custom_value:true}}}
                .value=${t||"__none__"}
                @value-changed=${c=>{const h=(c.detail.value??"").trim();if(h==="__none__"||!h){this._removeConfigPath("state_attribute");return}this._setConfigValue("state_attribute",h)}}>
            </ha-selector>
        `}_renderStateClassificationElseSelector(){var i,r;const e=((r=(i=this.config)==null?void 0:i.state_classification)==null?void 0:r.else)??"__none__",t=[{value:"__none__",label:"(Inactive, default)"},{value:"default",label:"Default"},{value:"active",label:"Active"},{value:"inactive",label:"Inactive"}];return s`
            <ha-selector
                .hass=${this.hass}
                .label=${"Unmapped State Class"}
                .helper=${'Style bucket for states not in the active/inactive lists. Use "Default" so custom zones reach your default colour instead of the preset inactive colour.'}
                .selector=${{select:{mode:"dropdown",options:t}}}
                .value=${e}
                @value-changed=${a=>{var d,o;const n=(a.detail.value??"").trim();if(n==="__none__"||!n){const c={...((d=this.config)==null?void 0:d.state_classification)??{}};delete c.else,Object.keys(c).length===0?this._removeConfigPath("state_classification"):this._setConfigValue("state_classification",c);return}this._setConfigValue("state_classification",{...((o=this.config)==null?void 0:o.state_classification)??{},else:n})}}>
            </ha-selector>
        `}_buildConfigTab(e={}){const{infoMessage:t="Configure your LCARdS card settings.",modeSections:i=[],basicFields:r=[{path:"entity"},{path:"id",label:"Card ID",helper:"[Optional] Custom ID for targeting with rules and animations"},{path:"tags",label:"Tags",helper:"Select existing tags or type new ones for rule targeting"}],showBasicSection:a=true,basicSectionHeader:n="Card Identification",basicSectionDescription:d="Identification for rules engine targeting",basicSectionIcon:o="mdi:cog",basicSectionExpanded:c=false}=e,h=[{type:"custom",render:p(()=>s`
                    <lcards-message type="info" message="${t}"></lcards-message>
                `,"render")},...i];return a&&r.length>0&&h.push({type:"section",header:n,description:d,icon:o,expanded:c,outlined:true,children:r.map(u=>({type:"field",path:u.path,label:u.label||"",helper:u.helper||""}))}),h}_cleanConfigForMode(e,t,i=[]){const r=["type","entity","id","tap_action","hold_action","double_tap_action","style"],a={};return r.forEach(n=>{e[n]!==void 0&&(a[n]=e[n])}),i.forEach(n=>{e[n]!==void 0&&(a[n]=e[n])}),a}_renderLayoutCardHint(){return customElements.get("layout-card")?s`
            ${G({header:"Inside a custom:layout-card?",icon:"mdi:view-grid-outline",body:s`
                    <p>Cards can collapse to their minimum height in a <code>custom:layout-card</code> grid, and its
                        <code>card_margin</code> is ignored. Use LCARdS's own <strong>Layout Card</strong> instead:
                        change <code>type</code> to <code>custom:lcards-layout-card</code> and remove
                        <code>layout_type</code>. Your <code>layout</code> and <code>view_layout</code> keys stay the same.</p>
                    <div class="info-guide-links">
                        <a href=${k(P.sizingInLayoutCard)} target="_blank" rel="noopener noreferrer">Documentation</a>
                    </div>
                `})}
        `:s``}_renderDataSourcesTab(){return s`
            <lcards-datasource-editor-tab
                .editor=${this}
                .config=${this.config}
                .hass=${this.hass}>
            </lcards-datasource-editor-tab>
        `}_renderRulesTab(){return s`
            <lcards-rules-dashboard
                .editor=${this}
                .cardId=${this.config.id||this.config.cardId||""}
                .hass=${this.hass}>
            </lcards-rules-dashboard>
        `}_renderTemplatesTab(){return s`
            <lcards-template-evaluation-tab
                .editor=${this}
                .config=${this.config}
                .hass=${this.hass}>
            </lcards-template-evaluation-tab>
        `}_renderThemeTokensTab(){return s`
            <lcards-card-theme-tab
                .config=${this.config}
                .hass=${this.hass}>
            </lcards-card-theme-tab>
        `}_renderProvenanceTab(){return s`
            <lcards-provenance-tab
                .editor=${this}
                .config=${this.config}
                .hass=${this.hass}>
            </lcards-provenance-tab>
        `}_renderDeveloperTab(){var i;const e=this._developerSubTab||0,t=[{icon:"mdi:database",label:"Data Sources",render:p(()=>this._renderDataSourcesTab(),"render")},{icon:"mdi:format-list-checks",label:"Rules",render:p(()=>this._renderRulesTab(),"render")},{icon:"mdi:palette-swatch",label:"Theme",render:p(()=>this._renderThemeTokensTab(),"render")},{icon:"mdi:layers-search",label:"Provenance",render:p(()=>this._renderProvenanceTab(),"render")},{icon:"mdi:code-braces-box",label:"Templates",render:p(()=>this._renderTemplatesTab(),"render")}];return s`
            <p class="hint main-engineering-hint">
                This card's data sources, rules, theme tokens, templates, and where each setting comes from.
            </p>

            <ha-tab-group @wa-tab-show=${this._handleDeveloperSubTabChange}>
                ${t.map((r,a)=>s`
                    <ha-tab-group-tab value=${String(a)} ?active=${e===a}>
                        <ha-icon icon=${r.icon}></ha-icon>
                        ${r.label}
                    </ha-tab-group-tab>
                `)}
                <!-- Only the active sub-tab is rendered (the others would poll and load for nothing). -->
                <div class="tab-panel">${(i=t[e])==null?void 0:i.render()}</div>
            </ha-tab-group>
        `}_handleDeveloperSubTabChange(e){var i;e.stopPropagation();const t=(i=e.target.activeTab)==null?void 0:i.getAttribute("value");t!==null&&(this._developerSubTab=parseInt(t,10),this.requestUpdate())}_getUtilityTabs(){return[{label:"🖖 Main Engineering",content:p(()=>this._renderDeveloperTab(),"content")},{label:"YAML",content:p(()=>this._renderYamlTab(),"content")}]}_renderZonesTab(){var i,r;const e=((i=this.config)==null?void 0:i.zones)||{},t=((r=this.config)==null?void 0:r.debug_zones)===true;return s`
            <lcards-form-section
                header="Custom Zones"
                icon="mdi:vector-rectangle"
                ?expanded=${true}>
                <lcards-zone-list-editor
                    .zones=${e}
                    @zones-changed=${a=>{this.config={...this.config,zones:a.detail.value},this._updateConfig(this.config,"visual")}}>
                </lcards-zone-list-editor>
            </lcards-form-section>

            <lcards-form-section
                header="Developer Tools"
                icon="mdi:bug-outline"
                ?expanded=${t}>
                <div class="control-row" style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;">
                    <div class="control-label" style="display:flex;flex-direction:column;gap:2px;">
                        <span>Show zone debug overlay</span>
                        <span class="hint" style="font-size:0.8em;opacity:0.7;">Renders coloured outlines and labels over each zone</span>
                    </div>
                    <ha-switch
                        .checked=${t}
                        @change=${a=>{const n={...this.config};a.target.checked?n.debug_zones=true:delete n.debug_zones,this.config=n,this._updateConfig(this.config,"visual")}}
                    ></ha-switch>
                </div>
            </lcards-form-section>
        `}_renderSoundTab(e=["card_tap","card_hold","card_double_tap","card_hover"]){return s`
            <lcards-card-sound-tab
                .editor=${this}
                .hass=${this.hass}
                .events=${e}
            ></lcards-card-sound-tab>
        `}_renderYamlTab(){return s`
            <div class="section">
                <div class="section-description">
                    Advanced YAML editor with schema-based autocomplete and inline validation.
                    Changes made here will be reflected in the visual tabs.
                </div>

                <lcards-yaml-editor
                    .value=${this._yamlValue}
                    .schema=${this._getSchema()}
                    .hass=${this.hass}
                    .cardType=${this.cardType}
                    @value-changed=${this._handleYamlChange}>
                </lcards-yaml-editor>
            </div>
        `}};p(j,"LCARdSBaseEditor");let V=j;const me=b`
    /* Dialog Sizing - Web Awesome ha-dialog uses --ha-dialog-* CSS properties */
    ha-dialog {
        --ha-dialog-width-md: min(95vw, 95vw);
        --ha-dialog-width-lg: min(95vw, 95vw);
        --ha-dialog-min-height: 90vh;
        --ha-dialog-max-height: 90vh;
    }

    /* Ensure ha-dialog's internal structure respects height */
    ha-dialog::part(dialog) {
        max-height: 90vh;
        display: flex;
        flex-direction: column;
    }

    /* ha-dialog::part(body) is the scrollable body container in WA-based ha-dialog */
    ha-dialog::part(body) {
        flex: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    /* Footer: HA lays it out as a flex row aligned to the end (Cancel, then
       the brand Save). Secondary actions (Documentation, Reset) go in a
       .footer-start group, which sits at the left. */
    .footer-start {
        display: flex;
        align-items: center;
        gap: var(--ha-space-3);
        margin-inline-end: auto;
    }

    /* The ha-dialog needs the flexcontent attribute: it makes HA's own .body
       a flex column, so .dialog-content (and the inset) fill the fixed dialog
       height instead of shrinking to a short tab's content.

       .dialog-content is the direct light-DOM child slotted into that body —
       without its own flex sizing it defaults to its content's natural
       height, which can exceed the body and force the *whole dialog* to
       scroll instead of just .tab-content. Keeping it in the same flex chain
       (flex:1, min-height:0, overflow:hidden) means only .tab-content (which
       opts in below) ever actually scrolls; the tab headers and canvas
       toolbar stay put. */
    .dialog-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 0;
    }

    /* Split Panel Layout (50/50 ratio - balanced config and preview) */
    .studio-layout {
        flex: 1;
        display: grid;
        grid-template-columns: 50% 50%;
        gap: 0;
        overflow: hidden;
        background: var(--primary-background-color);
        min-height: 0;
        border-radius: var(--ha-card-border-radius, 12px);
    }

    .config-panel {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-right: 2px solid var(--divider-color);
        min-height: 0;
    }

    /* Tab content scrolling */
    /* .tab-content (the scrolling tab body) is defined below with its padding. */

    /* Never scrolls — always consumes exactly the space it's given. Overflow
       within the canvas is handled by d3-zoom pan/zoom, not a scrollbar. */
    .preview-panel {
        position: relative;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 0;
    }

    /* Floating Toolbar Pattern — a dark scrim is still needed here for icon
       legibility over arbitrary base_svg/canvas content behind it, but tinted
       with the theme's own accent color (rather than flat neutral black)
       so it reads as part of the LCARdS palette, matching the
       rgba(var(--rgb-primary-color, ...), alpha) pattern already used
       elsewhere in the Studio dialogs (e.g. lcards-data-grid-studio-dialog.js). */
    .canvas-toolbar {
        position: absolute;
        top: 12px;
        right: 12px;
        max-width: calc(100% - 24px);
        display: flex;
        gap: 8px;
        background: color-mix(in srgb, rgba(var(--rgb-primary-color, 3, 169, 244), 0.9) 12%, rgba(0, 0, 0, 0.8) 88%);
        backdrop-filter: blur(8px);
        border-radius: 20px;
        padding: 8px;
        box-shadow: var(--ha-box-shadow-l);
        z-index: 1000;
        transition: all 0.3s ease;
    }

    .canvas-toolbar-toggle {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--primary-color);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        flex-shrink: 0;
    }

    .canvas-toolbar-toggle:hover {
        background: var(--primary-color);
        filter: brightness(1.2);
    }

    .canvas-toolbar-toggle ha-icon {
        --mdc-icon-size: 24px;
        color: white;
    }

    .canvas-toolbar-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
    }

    /* Groups related buttons into a visually distinct "chip" (e.g. Tools,
       Edit Mode, View aids, Overlay toggles) — a subtly lighter capsule
       floating within the toolbar's own dark pill, so it's clear at a glance
       which buttons belong together without relying on a thin, easy-to-miss
       divider line. Never splits across a wrap boundary — the whole group
       moves to the next row together. */
    .canvas-toolbar-group {
        display: flex;
        flex-wrap: nowrap;
        flex-shrink: 0;
        gap: 4px;
        align-items: center;
        background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.18);
        border: 1px solid rgba(var(--rgb-primary-color, 3, 169, 244), 0.32);
        /* Full pill, not a fixed radius — each group is always exactly one
           row tall (button height + padding), so this keeps the chip's end
           curvature concentric with the fully-round buttons inside it. */
        border-radius: var(--ha-border-radius-pill, 9999px);
        padding: 4px;
    }

    /* Group caption — sits inline as the first item in its group's row, next
       to the buttons (not stacked above them, so the group's height/pill
       shape never changes). Muted relative to the icons so it reads as a
       label, not another control. */
    .canvas-toolbar-group-label {
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: white;
        opacity: 0.7;
        padding: 0 2px 0 8px;
        white-space: nowrap;
        flex-shrink: 0;
        user-select: none;
    }

    .canvas-toolbar-button {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.12);
        border: 2px solid transparent;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        flex-shrink: 0;
    }

    .canvas-toolbar-button:hover {
        background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.3);
        border-color: var(--primary-color);
    }

    .canvas-toolbar-button.active {
        background: var(--primary-color);
        border-color: var(--primary-color);
    }

    .canvas-toolbar-button ha-icon {
        --mdc-icon-size: 20px;
        color: white;
    }

    /* Zoom Controls Pattern — same palette-tinted dark scrim as .canvas-toolbar above */
    .zoom-controls {
        position: absolute;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 8px;
        align-items: center;
        background: color-mix(in srgb, rgba(var(--rgb-primary-color, 3, 169, 244), 0.9) 12%, rgba(0, 0, 0, 0.85) 88%);
        backdrop-filter: blur(8px);
        border-radius: 24px;
        padding: 8px 16px;
        box-shadow: var(--ha-box-shadow-l);
        z-index: 1000;
    }

    .zoom-level {
        font-size: 14px;
        font-weight: 600;
        color: white;
        min-width: 48px;
        text-align: center;
        user-select: none;
    }

    /* Tab Navigation */
    ha-tab-group {
        display: block;
        margin-bottom: 0;
        border-bottom: 2px solid var(--divider-color);
    }

    ha-tab-group-tab ha-icon {
        --mdc-icon-size: 18px;
        margin-right: 8px;
    }

    /* Tab Content - Independent Scrolling */
    .tab-content {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 16px;
        min-height: 0; /* Allow flex item to shrink */
    }

    /* Placeholder Content */
    .placeholder-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 24px;
        text-align: center;
        color: var(--secondary-text-color);
    }

    .placeholder-content ha-icon {
        --mdc-icon-size: 64px;
        margin-bottom: 16px;
        opacity: 0.5;
    }

    .placeholder-title {
        font-size: 20px;
        font-weight: 600;
        margin: 0 0 12px 0;
    }

    .placeholder-description {
        font-size: 14px;
        margin: 0;
        max-width: 500px;
    }

    /* Responsive: the default 50/50 layout stacks. A studio that sets its own
       grid-template-columns must set grid-template-rows too, or it keeps these
       two rows beside its two columns (tests/editor/studio-layout-css.test.js). */
    @media (max-width: 1024px) {
        .studio-layout {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr 1fr;
        }

        .config-panel {
            border-right: none;
            border-bottom: 2px solid var(--divider-color);
        }
    }
`;export{m as L,V as a,re as e,y as f,ee as g,ae as l,ne as r,me as s};
//# sourceMappingURL=studio-dialog-styles-BC3IDpnS.js.map
