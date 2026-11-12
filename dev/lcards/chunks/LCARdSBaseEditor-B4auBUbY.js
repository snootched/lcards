var R=Object.defineProperty;var p=(l,e)=>R(l,"name",{value:e,configurable:true});import{b as o,l as f,i as w,bv as Y,a as _,A as b,a2 as q,J as W,a1 as Z,r as k,D as P,bw as H}from"./lcards-main-C148JfkA.js";import{e as D,s as G,m as M,r as J}from"./lcards-message-CF99Ox_M.js";import{c as I,e as X,v as Q,y as K}from"./yaml-docs-links-UEyTsmzQ.js";import"./lcards-form-section-BK3OqcgA.js";var U;(function(l){l.language="language",l.system="system",l.comma_decimal="comma_decimal",l.decimal_comma="decimal_comma",l.space_comma="space_comma",l.none="none"})(U||(U={}));var L;(function(l){l.language="language",l.system="system",l.am_pm="12",l.twenty_four="24"})(L||(L={}));const x=p((l,e,t,i)=>{i=i||{},t=t??{};const r=new Event(e,{bubbles:i.bubbles===void 0?true:i.bubbles,cancelable:!!i.cancelable,composed:i.composed===void 0?true:i.composed});return r.detail=t,l.dispatchEvent(r),r},"fireEvent");function ee(l,e){var r;if(!e||!((r=l==null?void 0:l.states)!=null&&r[e]))return[];const t=Object.keys(l.states[e].attributes||{}).sort(),i=[];for(const a of t)i.push({value:a,label:a}),a==="brightness"&&i.push({value:"brightness_pct",label:"brightness_pct  (auto 0–100%)"});return i}p(ee,"getAttributeOptions");function v(l,e){return(l==null?void 0:l.format)===e?true:Array.isArray(l==null?void 0:l.oneOf)?l.oneOf.some(t=>t.format===e):false}p(v,"hasFormat");function y(l,e){return(l==null?void 0:l.type)===e?true:Array.isArray(l==null?void 0:l.oneOf)?l.oneOf.some(t=>t.type===e):false}p(y,"isType");function $(l){return Array.isArray(l==null?void 0:l.enum)&&l.enum.length>0?true:Array.isArray(l==null?void 0:l.oneOf)?l.oneOf.some(e=>Array.isArray(e.enum)&&e.enum.length>0):false}p($,"hasEnum");const te=/^(top|bottom|left|right|center|middle)(-(top|bottom|left|right|center|middle))?$/;function ie(l){if(!$(l))return false;const e=l.enum;return Array.isArray(e)&&e.every(t=>typeof t=="string"&&te.test(t))&&e.some(t=>t.includes("-"))}p(ie,"isPositionEnum");function V(l){return $(l)?l.enum.map(e=>{var t;return{value:e,label:((t=l["x-enum-labels"])==null?void 0:t[e])||B(String(e))}}):[]}p(V,"getEnumOptions");function B(l){if(!l)return"";let e=l.replace(/([A-Z])/g," $1");return e=e.replace(/[-_]/g," "),e=e.split(" ").map(t=>t.charAt(0).toUpperCase()+t.slice(1).toLowerCase()).join(" ").trim(),e}p(B,"formatLabel");function re(l,e,t){if(l!=null&&l.title)return l.title;const i=e.split(".").pop();return B(i)}p(re,"getEffectiveLabel");const E=class E2{static renderField(e,t,i={}){var u,g;if(!e||!t)return o`
                <ha-alert alert-type="error">
                    Form field requires 'editor' and 'path' parameters
                </ha-alert>
            `;const r=(u=e._getSchemaForPath)==null?void 0:u.call(e,t);if(!r)return o`
                <ha-alert alert-type="warning">
                    No schema found for path: ${t}
                </ha-alert>
            `;const a=i.value!==void 0?i.value:((g=e._getConfigValue)==null?void 0:g.call(e,t))??(r==null?void 0:r.default),n=(r==null?void 0:r["x-ui-hints"])||{},c=i.selectorOverride||n.selector||this._getSelectorConfig(r),s=i.label||n.label||re(r,t),d=i.helper||n.helper||(r==null?void 0:r.description)||"";if(v(r,"font-family"))return this._renderFontSelector(e,t,a,s,d,i.disabled);if(ie(r))return this._renderPositionPicker(e,t,a,s,d,i.disabled);if(n.widget==="lcards-color-picker")return this._renderLcardsColorPicker(e,t,a,s,d,i.disabled);if(t==="tags")return this._renderTagsSelector(e,t,a,s,d);const h=this._prepareValueForSelector(a,c);return o`
            <ha-selector
                .hass=${e.hass}
                .selector=${c}
                .value=${h}
                .label=${s}
                .helper=${d}
                .disabled=${i.disabled||false}
                .required=${i.required||false}
                @value-changed=${C=>this._handleChange(C,e,t,c)}>
            </ha-selector>
        `}static _prepareValueForSelector(e,t){var n,c;if(!((n=t==null?void 0:t.choose)!=null&&n.choices))return e;const i=t.choose.choices;if(e==null){const s=Object.keys(i)[0],d=(c=i[s])==null?void 0:c.selector;d!=null&&d.number?e=d.number.min??0:d!=null&&d.text?e="":e=null}let r=null;typeof e=="number"?r=Object.keys(i).find(s=>{var d,h;return(h=(d=i[s])==null?void 0:d.selector)==null?void 0:h.number}):typeof e=="string"?((e.startsWith("{theme:")||e.includes("var(--"))&&(r=Object.keys(i).find(s=>{var d,h;return(s.includes("theme")||s==="theme_token")&&((h=(d=i[s])==null?void 0:d.selector)==null?void 0:h.text)})),!r&&e==="theme"&&(r=Object.keys(i).find(s=>s.includes("theme")||s.includes("binding"))),r||(r=Object.keys(i).find(s=>{var d,h,u,g;return((h=(d=i[s])==null?void 0:d.selector)==null?void 0:h.text)||((g=(u=i[s])==null?void 0:u.selector)==null?void 0:g.select)}))):typeof e=="object"&&e!==null&&!Array.isArray(e)&&(r=Object.keys(i).find(s=>{var d,h;return(h=(d=i[s])==null?void 0:d.selector)==null?void 0:h.object})),r||(r=Object.keys(i)[0]);const a={active_choice:r};return Object.keys(i).forEach(s=>{var d,h,u;if(s===r)a[s]=e;else{const g=(d=i[s])==null?void 0:d.selector;g!=null&&g.number?a[s]=g.number.min??0:g!=null&&g.text?a[s]="":g!=null&&g.select?a[s]=((u=(h=g.select.options)==null?void 0:h[0])==null?void 0:u.value)??"":a[s]=null}}),f.trace("[FormFieldHelper] Value prepared for choose selector:",{path:"(see render context)",rawValue:e,activeChoice:r,chooseValue:a}),a}static _handleChange(e,t,i,r){var n,c,s;if(e.stopPropagation(),!t||!i)return;let a;if(((n=e.target)==null?void 0:n.tagName)==="HA-SWITCH"?a=e.target.checked??e.target.__checked:a=(c=e.detail)==null?void 0:c.value,r!=null&&r.object&&!r.object.multiple&&a===""&&(a=void 0),a&&typeof a=="object"&&a.active_choice){const d=a.active_choice,h=a[d];f.trace("[FormFieldHelper] Choose value extracted:",{path:i,rawValue:a,activeChoice:d,extractedValue:h}),a=h}(s=t._setConfigValue)==null||s.call(t,i,a)}static _getSelectorConfig(e){if(!e)return{text:{}};const t=e["x-ui-hints"];return t!=null&&t.selector?t.selector:Array.isArray(e.oneOf)&&e.oneOf.length>0?this._generateChooseSelectorForOneOf(e):this._autoGenerateSelector(e)}static _autoGenerateSelector(e){return e?y(e,"number")||y(e,"integer")?{number:{mode:e.maximum&&e.maximum<=100?"slider":"box",min:e.minimum,max:e.maximum,step:e.type==="integer"?1:e.multipleOf||.1}}:y(e,"boolean")?{boolean:{}}:y(e,"string")?v(e,"entity")?{entity:{}}:v(e,"icon")?{icon:{}}:v(e,"color")?{ui_color:{}}:v(e,"action")?{ui_action:{}}:$(e)?{select:{mode:"dropdown",options:V(e)}}:{text:{}}:y(e,"object")?{object:{}}:$(e)?{select:{mode:"dropdown",options:V(e)}}:{text:{}}:{text:{}}}static _generateChooseSelectorForOneOf(e){const t={};return e.oneOf.forEach((i,r)=>{const a=this._getLabelForOneOfBranch(i),n=this._autoGenerateSelector(i),c=a.toLowerCase().replace(/\s+/g,"_").replace(/[^a-z0-9_]/g,"")||`option_${r}`;t[c]={selector:n}}),{choose:{choices:t}}}static _getLabelForOneOfBranch(e){var t,i,r;if(e.title)return e.title;if(e.type==="number"||e.type==="integer")return"Number";if(e.type==="string")return(t=e.pattern)!=null&&t.includes("theme:")||(i=e.pattern)!=null&&i.includes("\\{theme:")?"Theme Token":(r=e.enum)!=null&&r.includes("theme")?"Theme Binding":"Text";if(e.type==="object"){const a=e.properties||{};return a.top&&a.right&&a.bottom&&a.left?"Per Side":a.default&&a.active?"By State":a.top_left||a.top_right?"Per Corner":"Advanced"}return e.type==="boolean"?"Toggle":"Option"}static _renderFontSelector(e,t,i,r,a,n){return o`
            <lcards-font-selector
                .hass=${e.hass}
                .value=${i||"Antonio"}
                .label=${r}
                .helper=${a}
                .disabled=${n||false}
                .showPreview=${true}
                @value-changed=${c=>this._handleChange(c,e,t)}>
            </lcards-font-selector>
        `}static _renderLcardsColorPicker(e,t,i,r,a,n){return o`
            <div class="param-full">
                ${r?o`<label class="field-label">${r}</label>`:""}
                <lcards-color-picker
                    .hass=${e.hass}
                    .value=${i??""}
                    .disabled=${n||false}
                    @value-changed=${c=>this._handleChange(c,e,t)}>
                </lcards-color-picker>
                ${a?o`<div class="field-helper">${a}</div>`:""}
            </div>
        `}static _renderPositionPicker(e,t,i,r,a,n){return o`
            <lcards-position-picker
                .value=${i}
                .label=${r}
                .helper=${a}
                .disabled=${n||false}
                @value-changed=${c=>this._handleChange(c,e,t)}>
            </lcards-position-picker>
        `}static _renderTagsSelector(e,t,i,r,a){var d,h;const n=(h=(d=window.lcards)==null?void 0:d.core)==null?void 0:h.systemsManager,s=((n==null?void 0:n.getAllTags())||[]).map(u=>({value:u,label:u}));return o`
            <ha-selector
                .hass=${e.hass}
                .selector=${{select:{mode:"list",multiple:true,custom_value:true,options:s}}}
                .value=${i||[]}
                .label=${r}
                .helper=${a}
                @value-changed=${u=>this._handleChange(u,e,t)}>
            </ha-selector>
        `}};p(E,"LCARdSFormFieldHelper");let m=E;const S=class S2 extends w{static get properties(){return{editor:{type:Object},hass:{type:Object},events:{type:Array},_audioAssets:{type:Array,state:true}}}constructor(){super(),this.editor,this.hass=void 0,this.events=["card_tap","card_hold","card_double_tap","card_hover"],this._audioAssets=[]}connectedCallback(){super.connectedCallback(),this._loadAssets()}_loadAssets(){var t,i;const e=(i=(t=window.lcards)==null?void 0:t.core)==null?void 0:i.assetManager;if(e)try{const r=e.getRegistry("audio");this._audioAssets=Array.from(r.assets.entries()).map(([a,n])=>{var c,s;return{key:a,description:((c=n.metadata)==null?void 0:c.description)||a,pack:((s=n.metadata)==null?void 0:s.pack)||"unknown"}})}catch{this._audioAssets=[]}}get _sounds(){var e,t;return((t=(e=this.editor)==null?void 0:e.config)==null?void 0:t.sounds)??{}}_isMasterEnabled(){return this._sounds.enabled!==false}_overrideValueFor(e){const t=this._sounds;return e in t?t[e]===null?"__mute__":t[e]:"__scheme__"}_updateSounds(e){if(!this.editor)return;const t={...this._sounds,...e};t.enabled===true&&delete t.enabled;for(const[i,r]of Object.entries(t))r==="__scheme__"&&delete t[i];this._commitSounds(t)}_setMasterEnabled(e){if(e){const{enabled:t,...i}=this._sounds;this._commitSounds(i)}else this._updateSounds({enabled:false})}_setOverride(e,t){if(t==="__scheme__"){const i={...this._sounds};delete i[e],i.enabled===true&&delete i.enabled,this._commitSounds(i)}else t==="__mute__"?this._updateSounds({[e]:null}):this._updateSounds({[e]:t})}_clearAllOverrides(){const e={};this._sounds.enabled===false&&(e.enabled=false),this._commitSounds(e)}_commitSounds(e){if(!this.editor)return;const t={...this.editor.config};Object.keys(e).length===0?delete t.sounds:t.sounds=e,this.editor.config=t,x(this.editor,"config-changed",{config:t}),this.requestUpdate()}_previewAsset(e){var t,i,r;!e||e==="__scheme__"||e==="__mute__"||(r=(i=(t=window.lcards)==null?void 0:t.core)==null?void 0:i.soundManager)==null||r.preview(e)}_previewEvent(e){var t,i,r;(r=(i=(t=window.lcards)==null?void 0:t.core)==null?void 0:i.soundManager)==null||r.previewEvent(e)}render(){var a,n,c;const e=this._sounds,t=this._isMasterEnabled(),i=((c=(n=(a=this.hass)==null?void 0:a.states)==null?void 0:n["input_boolean.lcards_sound_enabled"])==null?void 0:c.state)==="on",r=Object.keys(e).filter(s=>s!=="enabled").length;return o`
      <div class="tab-body">

        <!-- Informational banner when global sounds are disabled -->
        ${i?"":o`
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
              @change=${s=>this._setMasterEnabled(s.target.checked)}
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

          ${this._audioAssets.length===0?o`
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
                ${this.events.map(s=>{const d=Y[s]||s,h=this._overrideValueFor(s);return o`
                    <tr class="${h!=="__scheme__"?"has-override":""}">
                      <td class="event-label">${d}</td>
                      <td>
                        <lcards-sound-source-selector
                          .hass=${this.hass}
                          .value=${h}
                          .audioAssets=${this._audioAssets}
                          .schemeLabel=${"(use global)"}
                          ?disabled=${!t}
                          @value-changed=${g=>this._setOverride(s,g.detail.value)}
                        ></lcards-sound-source-selector>
                      </td>
                      <td>
                        ${h!=="__mute__"?o`
                          <ha-icon-button
                            .label=${"Preview"}
                            @click=${()=>h==="__scheme__"?this._previewEvent(s):this._previewAsset(h)}
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

          ${r>0?o`
            <ha-button @click=${()=>this._clearAllOverrides()} style="margin-top:8px">
              <ha-icon slot="start" icon="mdi:close-circle-outline"></ha-icon>
              Clear all overrides
            </ha-button>
          `:""}

        </lcards-form-section>

      </div>
    `}static get styles(){return[D,_`
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
      `,G]}};p(S,"LCARdSCardSoundTab");let A=S;customElements.get("lcards-card-sound-tab")||customElements.define("lcards-card-sound-tab",A);const ae=_`
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
`,F=class F2 extends w{static get properties(){return{zones:{type:Object},_expandedIndex:{type:Number,state:true}}}constructor(){super(),this.zones={},this._expandedIndex=null,f.debug("[ZoneListEditor] Initialized")}static get styles(){return[ae,_`
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
            `]}_toArray(){return!this.zones||typeof this.zones!="object"?[]:Object.entries(this.zones).map(([e,t])=>({name:e,...t||{}}))}_toConfig(e){const t={};for(const{name:i,...r}of e)i&&(t[i]=r);return t}_emit(e){this.dispatchEvent(new CustomEvent("zones-changed",{detail:{value:this._toConfig(e)},bubbles:true,composed:true}))}_isPercent(e){return e.x_percent!=null||e.y_percent!=null||e.width_percent!=null||e.height_percent!=null}_subtitle(e){if(this._isPercent(e)){const n=e.x_percent??"?",c=e.y_percent??"?",s=e.width_percent??"?",d=e.height_percent??"?";return`x:${n}% y:${c}% w:${s}% h:${d}%`}const t=e.x??"?",i=e.y??"?",r=e.width??"?",a=e.height??"?";return`x:${t}px y:${i}px w:${r}px h:${a}px`}_addZone(){const e=this._toArray();let t=e.length+1;for(;e.some(i=>i.name===`zone_${t}`);)t++;e.push({name:`zone_${t}`,x:0,y:0,width:100,height:50}),this._expandedIndex=e.length-1,this._emit(e)}_deleteZone(e,t){e.stopPropagation();const i=this._toArray();i.splice(t,1),this._expandedIndex>=i.length&&(this._expandedIndex=null),this._emit(i)}_moveZone(e,t,i){e.stopPropagation();const r=this._toArray(),a=t+i;a<0||a>=r.length||([r[t],r[a]]=[r[a],r[t]],this._expandedIndex=a,this._emit(r))}_updateField(e,t,i){const r=this._toArray();r[e]={...r[e],[t]:i},this._emit(r)}_rename(e,t){const i=this._toArray();i[e]={...i[e],name:t},this._emit(i)}_toggleUnits(e,t){const i=this._toArray(),r=i[e];t?i[e]={name:r.name,x_percent:r.x_percent??(r.x!=null?parseFloat((r.x/5).toFixed(1)):0),y_percent:r.y_percent??(r.y!=null?parseFloat((r.y/5).toFixed(1)):0),width_percent:r.width_percent??(r.width!=null?parseFloat((r.width/5).toFixed(1)):50),height_percent:r.height_percent??(r.height!=null?parseFloat((r.height/5).toFixed(1)):100)}:i[e]={name:r.name,x:r.x??(r.x_percent!=null?Math.round(r.x_percent*5):0),y:r.y??(r.y_percent!=null?Math.round(r.y_percent*5):0),width:r.width??(r.width_percent!=null?Math.round(r.width_percent*5):100),height:r.height??(r.height_percent!=null?Math.round(r.height_percent*5):50)},this._emit(i)}render(){const e=this._toArray();return o`
            <div class="zone-editor">

                <ha-button class="add-button" @click=${this._addZone}>
                    <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                    Add Zone
                </ha-button>

                ${e.length===0?this._renderEmptyState():o`
                    <div class="editor-list">
                        ${e.map((t,i)=>this._renderItem(t,i,e.length))}
                    </div>
                `}

            </div>
        `}_renderEmptyState(){return o`
            <div class="empty-state">
                <div class="empty-state-title">No custom zones defined</div>
                <div class="empty-state-desc">
                    Custom zones let you define named rectangular areas that text fields
                    can target via <code>zone:</code>. They can override auto-calculated
                    card zones (e.g. <code>body</code>) or add entirely new ones.
                </div>
            </div>
        `}_renderItem(e,t,i){const r=this._expandedIndex===t,a=this._isPercent(e);return o`
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

                ${r?this._renderItemContent(e,t,a):b}

            </div>
        `}_renderItemContent(e,t,i){return o`
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
                ${i?b:o`
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
                ${i?o`
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
                `:b}

                <div class="help-text">
                    Reference this zone in any text field with <code>zone: ${e.name||"zone_name"}</code>.
                    Percent values are resolved against the card's rendered pixel size at runtime.
                    You can also mix units per axis (e.g. <code>x: 10</code> with <code>height_percent: 100</code>).
                </div>

            </div>
        `}};p(F,"LCARdSZoneListEditor");let T=F;customElements.get("lcards-zone-list-editor")||customElements.define("lcards-zone-list-editor",T);const ne=_`
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
`;function se({icon:l,title:e,description:t,stats:i=[],actions:r}){return o`
    <div class="launcher">
      <div class="launcher-head">
        <ha-icon icon=${l}></ha-icon>
        <h3>${e}</h3>
      </div>
      <p class="launcher-desc">${t}</p>
      ${i.length?o`
        <div class="launcher-stats">
          ${i.map(a=>o`<span><strong>${a.value}</strong> ${a.label}</span>`)}
        </div>
      `:b}
      <div class="launcher-actions">
        ${r.map((a,n)=>o`
          <ha-button variant="brand" appearance=${n===0?"accent":"outlined"} @click=${a.onClick}>
            <ha-icon icon=${a.icon} slot="start"></ha-icon>
            ${a.label}
          </ha-button>
        `)}
      </div>
    </div>
  `}p(se,"renderLauncher");const oe="/lcards-config",le=Z;function ce(l){const t=[...(l==null?void 0:l.resolution_chain)??[]].reverse().find(i=>i.step==="value");return(t==null?void 0:t.value)??(l==null?void 0:l.resolved_value)}p(ce,"tokenValue");function de(l){return Object.entries((l==null?void 0:l.theme_tokens)??{}).map(([e,t])=>({path:e,value:ce(t),fields:t.used_by_fields??[],overridden:(t.resolution_chain??[]).some(i=>i.step==="override")})).sort((e,t)=>e.path.localeCompare(t.path))}p(de,"cardTokens");const j=class j2 extends w{static get properties(){return{config:{type:Object},hass:{type:Object},_provenance:{type:Object,state:true},_cardFound:{type:Boolean,state:true}}}constructor(){super(),this.config=void 0,this.hass=void 0,this._provenance=null,this._cardFound=false,this._card=null,this._unsubscribe=null}static get styles(){return[M,ne,_`
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
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
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
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
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
        `]}disconnectedCallback(){var e;super.disconnectedCallback(),(e=this._unsubscribe)==null||e.call(this),this._unsubscribe=null,this._card=null}updated(e){e.has("config")&&this._load()}_load(){var t,i,r,a;let e=null;try{e=this.config?(i=(t=window.lcards)==null?void 0:t.findCardByConfig)==null?void 0:i.call(t,this.config):null}catch(n){f.debug("[CardThemeTab] No card for this config",{error:n==null?void 0:n.message})}typeof(e==null?void 0:e.getProvenance)!="function"&&(e=null),e!==this._card&&((r=this._unsubscribe)==null||r.call(this),this._unsubscribe=((a=e==null?void 0:e.subscribeProvenance)==null?void 0:a.call(e,()=>this._read()))??null,this._card=e),this._read()}_read(){this._cardFound=!!this._card,this._provenance=this._card?this._card.getProvenance():null}_openPanel(e){window.open(`${oe}?tab=${e}`,"_blank","noopener")}render(){var r,a,n,c;const e=de(this._provenance),t=e.filter(s=>s.overridden).length,i=(c=(n=(a=(r=window.lcards)==null?void 0:r.core)==null?void 0:a.themeManager)==null?void 0:n.getActiveTheme)==null?void 0:c.call(n);return o`
            ${se({icon:"mdi:palette",title:"Theme",description:"The theme tokens this card uses and their values here. Browse every token, the alert mode lab and theme packs in the LCARdS panel.",stats:[...i!=null&&i.name?[{value:i.name,label:"theme"}]:[],{value:e.length,label:e.length===1?"token on this card":"tokens on this card"},...t?[{value:t,label:"overridden"}]:[]],actions:[{label:"Open Theme Studio",icon:"mdi:palette-swatch",onClick:p(()=>this._openPanel("theme"),"onClick")},{label:"Pack Explorer",icon:"mdi:package-variant",onClick:p(()=>this._openPanel("packs"),"onClick")}]})}
            ${this._cardFound?e.length?o`<div class="tokens">${e.map(s=>this._renderToken(s))}</div>`:o`<p class="hint empty">This card uses no theme tokens.</p>`:o`<p class="hint empty">No rendered card for this config yet: the tokens come from the card editor's preview.</p>`}
        `}_renderToken(e){const t=`theme:${e.path}`;return o`
            <div class="token" data-path=${e.path}>
                ${le(e.value)?o`<span class="swatch" style=${q({background:e.value})}></span>`:o`<span class="swatch none"><ha-icon icon="mdi:palette-outline"></ha-icon></span>`}
                <div class="main">
                    <span class="path">${t}</span>
                    <span class="sub"><code>${e.value===void 0?"-":String(e.value)}</code>${e.fields.length?o` · ${e.fields.join(", ")}`:b}</span>
                </div>
                ${e.overridden?o`<span class="chip" title="Changed by a theme override">override</span>`:b}
                <ha-icon-button .label=${"Copy token"} title="Copy token" @click=${()=>W(t)}>
                    <ha-icon icon="mdi:content-copy"></ha-icon>
                </ha-icon-button>
            </div>
        `}};p(j,"LCARdSCardThemeTab");let O=j;customElements.get("lcards-card-theme-tab")||customElements.define("lcards-card-theme-tab",O);const z=class z2 extends w{static get properties(){return{hass:{type:Object},config:{type:Object},cardType:{type:String},_selectedTab:{type:Number,state:true},_yamlValue:{type:String,state:true},_validationErrors:{type:Array,state:true},_singletons:{type:Object,state:true},_schemaMissing:{type:Boolean,state:true},_developerSubTab:{type:Number,state:true}}}constructor(){super(),this.hass=void 0,this.lovelace=void 0,this.config={},this.cardType="",this._selectedTab=0,this._yamlValue="",this._validationErrors=[],this._singletons=null,this._isUpdatingYaml=false,this._configUpdateDebounce=null,this._schemaMissing=false,this._developerSubTab=0}static get styles(){return[D,M,_`
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
        `]}setConfig(e){var t;if(!e)throw new Error("Invalid configuration");f.debug("[LCARdSBaseEditor] setConfig called with:",e),this.config=typeof globalThis.structuredClone=="function"?globalThis.structuredClone(e):JSON.parse(JSON.stringify(e)),!this.config.type&&this.cardType&&(f.warn('[LCARdSBaseEditor] Config is missing required "type" property! Auto-restoring...'),this.config.type=`custom:lcards-${this.cardType}`,f.warn(`[LCARdSBaseEditor] Auto-restored type to: ${this.config.type}`)),this._yamlValue=I(this.config),this._validateConfig(),f.debug("[LCARdSBaseEditor] Config initialized:",{config:this.config,yaml:this._yamlValue}),(t=window.lcards)!=null&&t.core&&(this._singletons=window.lcards.core),this.requestUpdate("config")}_handleChildConfigChange(e){var i;e.stopPropagation();const t=(i=e.detail)==null?void 0:i.config;t&&this._updateConfig(t)}_getTabDefinitions(){return[]}render(){const e=this._getTabDefinitions();return o`
            <div class="editor-container" @config-changed=${this._handleChildConfigChange}>
                ${this._schemaMissing?o`
                    <ha-alert alert-type="error" title="Schema Not Registered">
                        <p>
                            The schema for card type <code>${this.cardType}</code> is not registered.
                        </p>
                        <p>
                            <strong>For maintainers:</strong> Register a schema for this card type using:
                            <code>core.configManager.registerCardSchema('${this.cardType}', schema)</code>
                        </p>
                        <p>
                            See <a href=${k(P.buildingAnEditor)} target="_blank" rel="noopener">Building a Studio Editor</a>
                            for more information on schema registration.
                        </p>
                    </ha-alert>
                `:""}

                ${this._renderValidationErrors()}

                <!-- Using HA native tab components (Issue #82) -->
                <ha-tab-group @wa-tab-show=${this._handleTabChange}>
                    ${e.map((t,i)=>o`
                        <ha-tab-group-tab value="${i}" ?active=${this._selectedTab===i}>
                            ${t.label}
                        </ha-tab-group-tab>
                    `)}

                    ${e.map((t,i)=>o`
                        <div class="tab-panel" ?hidden=${this._selectedTab!==i}>
                            ${this._renderTabContent(t)}
                        </div>
                    `)}
                </ha-tab-group>
            </div>
        `}_renderTabContent(e){if(!e||!e.content)return o`<div>No content available</div>`;const t=e.docs??X(this.cardType,e.label);return o`
            ${t?o`
                <div class="tab-docs">
                    <a href=${k(t)} target="_blank" rel="noopener noreferrer">
                        Docs<ha-icon icon="mdi:open-in-new"></ha-icon>
                    </a>
                </div>
            `:""}
            ${e.content()}
        `}_handleTabChange(e){var i;const t=(i=e.target.activeTab)==null?void 0:i.getAttribute("value");t!=null&&(this._selectedTab=parseInt(t,10),this.requestUpdate())}_updateConfig(e,t="visual"){if(!e||typeof e!="object"){f.warn("[LCARdSBaseEditor] Invalid config updates:"+JSON.stringify(e));return}this.config,this.config=H(this.config,e),this.config.type||(f.warn('[LCARdSBaseEditor] Config is missing required "type" property after merge! Auto-restoring...'),this.config.type=`custom:lcards-${this.cardType}`,f.warn(`[LCARdSBaseEditor] Auto-restored type to: ${this.config.type}`)),this._validateConfig(),t==="visual"&&!this._isUpdatingYaml&&(this._isUpdatingYaml=true,this._yamlValue=I(this.config),requestAnimationFrame(()=>{this._isUpdatingYaml=false})),this._configUpdateDebounce&&clearTimeout(this._configUpdateDebounce),this._configUpdateDebounce=setTimeout(()=>{x(this,"config-changed",{config:this.config}),this._configUpdateDebounce=null},50)}_handleYamlChange(e){if(this._isUpdatingYaml)return;this._yamlValue=e.detail.value;const t=Q(this._yamlValue);if(!t.valid){this._validationErrors=[{message:`YAML Syntax Error: ${t.error}`,line:t.lineNumber}],this.requestUpdate();return}try{const i=K(this._yamlValue),r=this._validateConfigWithSingleton(i);this._validationErrors=r.errors.map(a=>({path:a.field||"",message:a.message})),r.valid&&(this._isUpdatingYaml=true,this.config=i,x(this,"config-changed",{config:this.config}),requestAnimationFrame(()=>{this._isUpdatingYaml=false})),this.requestUpdate()}catch(i){this._validationErrors=[{message:`Parse Error: ${i.message}`}],this.requestUpdate()}}_validateConfigWithSingleton(e){var r,a;const t=(a=(r=window.lcards)==null?void 0:r.core)==null?void 0:a.validationService,i=this._getSchema();return!t||!i?{valid:true,errors:[],warnings:[]}:t.validate(e,i,{cardType:this.cardType,source:"editor"})}_validateConfig(){const e=this._validateConfigWithSingleton(this.config),t=(e.errors||[]).map(r=>({path:r.field||"",message:r.message,severity:"error"})),i=(e.warnings||[]).map(r=>({path:r.field||"",message:r.message,severity:"warning"}));this._validationErrors=[...t,...i]}get _isLightEntity(){var e;return typeof((e=this.config)==null?void 0:e.entity)=="string"&&this.config.entity.startsWith("light.")}_getSchema(){var i,r;const e=(r=(i=window.lcards)==null?void 0:i.core)==null?void 0:r.configManager;if(!e)return f.warn("⚠️ [LCARdSBaseEditor] CoreConfigManager not available"),this._schemaMissing=true,{};const t=e.getCardSchema(this.cardType);return t?(this._schemaMissing=false,t):(f.warn(`⚠️ [LCARdSBaseEditor] No schema registered for card type: ${this.cardType}`),this._schemaMissing=true,{})}_getConfigValue(e){if(!e)return;const t=e.split(".");let i=this.config;for(const r of t){if(i==null)return;i=i[r]}return i}_setConfigValue(e,t){if(!e){f.warn("⚠️ [LCARdSBaseEditor] Cannot set config value with empty path");return}const i=e.split(".");if(i.some(c=>!isNaN(Number(c)))){const c=JSON.parse(JSON.stringify(this.config||{}));let s=c;for(let u=0;u<i.length-1;u++){const g=i[u],C=i[u+1];!isNaN(Number(C))?Array.isArray(s[g])||(s[g]=[]):(!s[g]||typeof s[g]!="object")&&(s[g]={}),s=s[g]}const d=i[i.length-1];s[d]=t;const h=this.config;this.config=c,x(this,"config-changed",{config:this.config}),this.requestUpdate("config",h);return}const a={};let n=a;for(let c=0;c<i.length-1;c++)n[i[c]]={},n=n[i[c]];n[i[i.length-1]]=t,t==null||t===""?this._removeConfigPath(e):this._updateConfig(a)}_removeConfigPath(e){if(!e)return;const t=e.split("."),i=JSON.parse(JSON.stringify(this.config||{}));let r=i;for(let n=0;n<t.length-1;n++){if(!r[t[n]])return;r=r[t[n]]}delete r[t[t.length-1]];for(let n=t.length-2;n>=0;n--){const c=t.slice(0,n+1);let s=i;for(let u=0;u<c.length-1;u++)s=s[c[u]];const d=c[c.length-1],h=s[d];if(h&&typeof h=="object"&&!Array.isArray(h))if(Object.keys(h).length===0)delete s[d];else break;else break}const a=this.config;this.config=i,x(this,"config-changed",{config:this.config}),this.requestUpdate("config",a)}_getSchemaForPath(e){if(!e)return null;const t=this._getSchema();if(!t||!t.properties)return null;const i=e.split(".");let r=t;for(const a of i){if(!isNaN(Number(a))&&r.type==="array"&&r.items){r=r.items;continue}if(r.properties&&r.properties[a]){r=r.properties[a];continue}if(r.patternProperties){let n=false,c=0,s=null;for(const[d,h]of Object.entries(r.patternProperties))try{new RegExp(d).test(a)&&(c++,n||(r=h,s=d,n=true))}catch(u){f.warn("⚠️ [LCARdSBaseEditor] Invalid regex in patternProperties:",d,u)}if(c>1&&f.warn(`[BaseEditor] Multiple patternProperties matched key "${a}"; using first match.`),n)continue}if(r.additionalProperties){if(typeof r.additionalProperties=="object"){r=r.additionalProperties;continue}else if(r.additionalProperties===true)return{type:["string","number","boolean","object","array"],description:"Additional property (no specific schema defined)"}}if(Array.isArray(r.oneOf)){let n=false;for(const c of r.oneOf)if(c&&c.properties&&c.properties[a]){r=c.properties[a],n=true;break}if(n)continue}return null}return r}_evaluateCondition(e){if(!e)return true;try{return new Function("config","hass",`return ${e};`)(this.config,this.hass)}catch(t){return f.warn("⚠️ [LCARdSBaseEditor] Condition evaluation failed:",e,t),true}}_renderValidationErrors(){if(!this._validationErrors||this._validationErrors.length===0)return o``;const e=this._validationErrors.filter(i=>i.severity==="error"),t=this._validationErrors.filter(i=>i.severity==="warning");return o`
            ${e.length>0?o`
                <ha-alert alert-type="error" title="Validation Errors (${e.length})">
                    <ul>
                        ${e.map(i=>o`
                            <li>${i.path?`${i.path}: `:""}${i.message}</li>
                        `)}
                    </ul>
                </ha-alert>
            `:""}

            ${t.length>0?o`
                <ha-alert alert-type="warning" title="Validation Warnings (${t.length})">
                    <ul>
                        ${t.map(i=>o`
                            <li>${i.path?`${i.path}: `:""}${i.message}</li>
                        `)}
                    </ul>
                </ha-alert>
            `:""}
        `}_renderFromConfig(e){if(!e)return o``;if(Array.isArray(e))return o`${e.map(t=>this._renderFromConfig(t))}`;if(e.condition&&!this._evaluateCondition(e.condition))return o``;switch(e.type){case"section":return this._renderConfigSection(e);case"grid":return this._renderConfigGrid(e);case"field":return this._renderConfigField(e);case"custom":return this._renderConfigCustom(e);default:return f.warn("⚠️ [LCARdSBaseEditor] Unknown config type:",e.type),o``}}_renderConfigSection(e){const{header:t="",description:i="",icon:r="",expanded:a=false,outlined:n=true,headerLevel:c="4",children:s=[]}=e;return o`
            <lcards-form-section
                header="${t}"
                description="${i}"
                icon="${r}"
                ?expanded=${a}
                ?outlined=${n}
                headerLevel="${c}">
                ${this._renderFromConfig(s)}
            </lcards-form-section>
        `}_renderConfigGrid(e){const{children:t=[]}=e;return o`
            <lcards-grid-layout>
                ${this._renderFromConfig(t)}
            </lcards-grid-layout>
        `}_renderConfigField(e){const{path:t,label:i="",helper:r=""}=e;return t?m.renderField(this,t,{label:i,helper:r}):(f.warn('⚠️ [LCARdSBaseEditor] Field config missing required "path":',e),o``)}_renderConfigCustom(e){const{render:t}=e;return typeof t!="function"?(f.warn('⚠️ [LCARdSBaseEditor] Custom config missing "render" function:',e),o``):t.call(this)}_renderTextPadding(e){const t=this._getSchemaForPath(e);return t&&Array.isArray(t.oneOf)?m.renderField(this,e,{label:"Padding"}):o`
            <lcards-object-editor
                .editor=${this}
                .config=${this.config}
                path="${e}"
                .properties=${["top","right","bottom","left"]}
                controlType="number"
                .controlConfig=${{min:0,max:100,mode:"box"}}
                columns="2">
            </lcards-object-editor>
        `}_renderFontConfig(e){return o`
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
        `}_renderTextAlignment(e){return o`
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
        `}_getRangesAttributeOptions(e=(t=>(t=this.config)==null?void 0:t.entity)()){return ee(this.hass,e)}_renderRangesAttributeSelector(){var r,a;const e=(r=this.config)==null?void 0:r.entity,t=((a=this.config)==null?void 0:a.ranges_attribute)||"",i=[{value:"__none__",label:"(Use entity state)"},...this._getRangesAttributeOptions()];return o`
            <ha-selector
                .hass=${this.hass}
                .label=${"Range Attribute"}
                .helper=${'Attribute value compared against range conditions (above:/below:/between:). Select "(Use entity state)" to clear.'}
                .disabled=${!e}
                .selector=${{select:{mode:"dropdown",options:i,custom_value:true}}}
                .value=${t||"__none__"}
                @value-changed=${n=>{let c=(n.detail.value??"").trim();if(c==="__none__"||!c){this._removeConfigPath("ranges_attribute");return}c==="brightness"&&(c="brightness_pct"),this._setConfigValue("ranges_attribute",c)}}>
            </ha-selector>
        `}_getStateAttributeOptions(){var r,a,n;const e=(r=this.config)==null?void 0:r.entity,t=[];if(!e||!((n=(a=this.hass)==null?void 0:a.states)!=null&&n[e]))return t;const i=Object.keys(this.hass.states[e].attributes||{}).sort();for(const c of i)t.push({value:c,label:c});return t}_renderStateAttributeSelector(){var a,n,c,s;const e=(a=this.config)==null?void 0:a.entity,t=((n=this.config)==null?void 0:n.state_attribute)||"",i=e&&((s=(c=this.hass)==null?void 0:c.states)!=null&&s[e])?Object.keys(this.hass.states[e].attributes||{}).sort().map(d=>({value:d,label:d})):[],r=[{value:"__none__",label:"(Use entity state)"},...i];return o`
            <ha-selector
                .hass=${this.hass}
                .label=${"State Attribute"}
                .helper=${'Attribute whose string value is matched against color-config keys (e.g. "fade", "true"). Select "(Use entity state)" to clear.'}
                .disabled=${!e}
                .selector=${{select:{mode:"dropdown",options:r,custom_value:true}}}
                .value=${t||"__none__"}
                @value-changed=${d=>{const h=(d.detail.value??"").trim();if(h==="__none__"||!h){this._removeConfigPath("state_attribute");return}this._setConfigValue("state_attribute",h)}}>
            </ha-selector>
        `}_renderStateClassificationElseSelector(){var i,r;const e=((r=(i=this.config)==null?void 0:i.state_classification)==null?void 0:r.else)??"__none__",t=[{value:"__none__",label:"(Inactive, default)"},{value:"default",label:"Default"},{value:"active",label:"Active"},{value:"inactive",label:"Inactive"}];return o`
            <ha-selector
                .hass=${this.hass}
                .label=${"Unmapped State Class"}
                .helper=${'Style bucket for states not in the active/inactive lists. Use "Default" so custom zones reach your default colour instead of the preset inactive colour.'}
                .selector=${{select:{mode:"dropdown",options:t}}}
                .value=${e}
                @value-changed=${a=>{var c,s;const n=(a.detail.value??"").trim();if(n==="__none__"||!n){const d={...((c=this.config)==null?void 0:c.state_classification)??{}};delete d.else,Object.keys(d).length===0?this._removeConfigPath("state_classification"):this._setConfigValue("state_classification",d);return}this._setConfigValue("state_classification",{...((s=this.config)==null?void 0:s.state_classification)??{},else:n})}}>
            </ha-selector>
        `}_buildConfigTab(e={}){const{infoMessage:t="Configure your LCARdS card settings.",modeSections:i=[],basicFields:r=[{path:"entity"},{path:"id",label:"Card ID",helper:"[Optional] Custom ID for targeting with rules and animations"},{path:"tags",label:"Tags",helper:"Select existing tags or type new ones for rule targeting"}],showBasicSection:a=true,basicSectionHeader:n="Card Identification",basicSectionDescription:c="Identification for rules engine targeting",basicSectionIcon:s="mdi:cog",basicSectionExpanded:d=false}=e,h=[{type:"custom",render:p(()=>o`
                    <lcards-message type="info" message="${t}"></lcards-message>
                `,"render")},...i];return a&&r.length>0&&h.push({type:"section",header:n,description:c,icon:s,expanded:d,outlined:true,children:r.map(u=>({type:"field",path:u.path,label:u.label||"",helper:u.helper||""}))}),h}_cleanConfigForMode(e,t,i=[]){const r=["type","entity","id","tap_action","hold_action","double_tap_action","style"],a={};return r.forEach(n=>{e[n]!==void 0&&(a[n]=e[n])}),i.forEach(n=>{e[n]!==void 0&&(a[n]=e[n])}),a}_renderLayoutCardHint(){return customElements.get("layout-card")?o`
            ${J({header:"Inside a custom:layout-card?",icon:"mdi:view-grid-outline",body:o`
                    <p>Cards can collapse to their minimum height in a <code>custom:layout-card</code> grid, and its
                        <code>card_margin</code> is ignored. Use LCARdS's own <strong>Layout Card</strong> instead:
                        change <code>type</code> to <code>custom:lcards-layout-card</code> and remove
                        <code>layout_type</code>. Your <code>layout</code> and <code>view_layout</code> keys stay the same.</p>
                    <div class="info-guide-links">
                        <a href=${k(P.sizingInLayoutCard)} target="_blank" rel="noopener noreferrer">Documentation</a>
                    </div>
                `})}
        `:o``}_renderDataSourcesTab(){return o`
            <lcards-datasource-editor-tab
                .editor=${this}
                .config=${this.config}
                .hass=${this.hass}>
            </lcards-datasource-editor-tab>
        `}_renderRulesTab(){return o`
            <lcards-rules-dashboard
                .editor=${this}
                .cardId=${this.config.id||this.config.cardId||""}
                .hass=${this.hass}>
            </lcards-rules-dashboard>
        `}_renderTemplatesTab(){return o`
            <lcards-template-evaluation-tab
                .editor=${this}
                .config=${this.config}
                .hass=${this.hass}>
            </lcards-template-evaluation-tab>
        `}_renderThemeTokensTab(){return o`
            <lcards-card-theme-tab
                .config=${this.config}
                .hass=${this.hass}>
            </lcards-card-theme-tab>
        `}_renderProvenanceTab(){return o`
            <lcards-provenance-tab
                .editor=${this}
                .config=${this.config}
                .hass=${this.hass}>
            </lcards-provenance-tab>
        `}_renderDeveloperTab(){var i;const e=this._developerSubTab||0,t=[{icon:"mdi:database",label:"Data Sources",render:p(()=>this._renderDataSourcesTab(),"render")},{icon:"mdi:format-list-checks",label:"Rules",render:p(()=>this._renderRulesTab(),"render")},{icon:"mdi:palette-swatch",label:"Theme",render:p(()=>this._renderThemeTokensTab(),"render")},{icon:"mdi:layers-search",label:"Provenance",render:p(()=>this._renderProvenanceTab(),"render")},{icon:"mdi:code-braces-box",label:"Templates",render:p(()=>this._renderTemplatesTab(),"render")}];return o`
            <p class="hint main-engineering-hint">
                This card's data sources, rules, theme tokens, templates, and where each setting comes from.
            </p>

            <ha-tab-group @wa-tab-show=${this._handleDeveloperSubTabChange}>
                ${t.map((r,a)=>o`
                    <ha-tab-group-tab value=${String(a)} ?active=${e===a}>
                        <ha-icon icon=${r.icon}></ha-icon>
                        ${r.label}
                    </ha-tab-group-tab>
                `)}
                <!-- Only the active sub-tab is rendered (the others would poll and load for nothing). -->
                <div class="tab-panel">${(i=t[e])==null?void 0:i.render()}</div>
            </ha-tab-group>
        `}_handleDeveloperSubTabChange(e){var i;e.stopPropagation();const t=(i=e.target.activeTab)==null?void 0:i.getAttribute("value");t!==null&&(this._developerSubTab=parseInt(t,10),this.requestUpdate())}_getUtilityTabs(){return[{label:"🖖 Main Engineering",content:p(()=>this._renderDeveloperTab(),"content")},{label:"YAML",content:p(()=>this._renderYamlTab(),"content")}]}_renderZonesTab(){var i,r;const e=((i=this.config)==null?void 0:i.zones)||{},t=((r=this.config)==null?void 0:r.debug_zones)===true;return o`
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
        `}_renderSoundTab(e=["card_tap","card_hold","card_double_tap","card_hover"]){return o`
            <lcards-card-sound-tab
                .editor=${this}
                .hass=${this.hass}
                .events=${e}
            ></lcards-card-sound-tab>
        `}_renderYamlTab(){return o`
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
        `}};p(z,"LCARdSBaseEditor");let N=z;export{m as L,N as a,ae as e,x as f,ee as g,ne as l,se as r};
//# sourceMappingURL=LCARdSBaseEditor-B4auBUbY.js.map
