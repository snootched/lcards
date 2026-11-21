var Qt=Object.defineProperty;var u=(o,e)=>Qt(o,"name",{value:e,configurable:true});import{b as n,l as $,i as S,bn as ea,c as w,A as v,bo as U,Q as E,bp as Re,bq as ta,br as aa,S as sa,bs as R,bt as Dt,bu as ia,bv as ra,x as N,D as I,bw as oa,bx as Mt,u as Ie,by as zt,bz as na,b1 as Nt,bA as ft,bB as ce,bC as la,bD as ca,bE as Pt,s as da,aK as Rt,aO as It,bF as Ft,bG as ha}from"./lcards-main-Dyh7t6jw.js";import{e as ee,s as ua,m as T,a as pa,r as fa}from"./lcards-message-DwgRzp3Y.js";import{c as M,y as K,M as ma,D as ga,V as va,E as ae,a as ba,v as _a,h as ya,p as $a,b as wa,k as xa,d as ka,e as Ca,f as Sa,s as mt,g as Ta,i as Aa}from"./lcards-yaml-editor-BVTHq2uG.js";import"./lcards-color-picker-MJVPREQD.js";import"./lcards-form-section--YQsY5gW.js";var gt;(function(o){o.language="language",o.system="system",o.comma_decimal="comma_decimal",o.decimal_comma="decimal_comma",o.space_comma="space_comma",o.none="none"})(gt||(gt={}));var vt;(function(o){o.language="language",o.system="system",o.am_pm="12",o.twenty_four="24"})(vt||(vt={}));const D=u((o,e,t,a)=>{a=a||{},t=t??{};const s=new Event(e,{bubbles:a.bubbles===void 0?true:a.bubbles,cancelable:!!a.cancelable,composed:a.composed===void 0?true:a.composed});return s.detail=t,o.dispatchEvent(s),s},"fireEvent");function Oa(o,e){var s;if(!e||!((s=o==null?void 0:o.states)!=null&&s[e]))return[];const t=Object.keys(o.states[e].attributes||{}).sort(),a=[];for(const i of t)a.push({value:i,label:i}),i==="brightness"&&a.push({value:"brightness_pct",label:"brightness_pct  (auto 0–100%)"});return a}u(Oa,"getAttributeOptions");function B(o,e){return(o==null?void 0:o.format)===e?true:Array.isArray(o==null?void 0:o.oneOf)?o.oneOf.some(t=>t.format===e):false}u(B,"hasFormat");function L(o,e){return(o==null?void 0:o.type)===e?true:Array.isArray(o==null?void 0:o.oneOf)?o.oneOf.some(t=>t.type===e):false}u(L,"isType");function G(o){return Array.isArray(o==null?void 0:o.enum)&&o.enum.length>0?true:Array.isArray(o==null?void 0:o.oneOf)?o.oneOf.some(e=>Array.isArray(e.enum)&&e.enum.length>0):false}u(G,"hasEnum");const Ea=/^(top|bottom|left|right|center|middle)(-(top|bottom|left|right|center|middle))?$/;function ja(o){if(!G(o))return false;const e=o.enum;return Array.isArray(e)&&e.every(t=>typeof t=="string"&&Ea.test(t))&&e.some(t=>t.includes("-"))}u(ja,"isPositionEnum");function bt(o){return G(o)?o.enum.map(e=>{var t;return{value:e,label:((t=o["x-enum-labels"])==null?void 0:t[e])||Bt(String(e))}}):[]}u(bt,"getEnumOptions");function Bt(o){if(!o)return"";let e=o.replace(/([A-Z])/g," $1");return e=e.replace(/[-_]/g," "),e=e.split(" ").map(t=>t.charAt(0).toUpperCase()+t.slice(1).toLowerCase()).join(" ").trim(),e}u(Bt,"formatLabel");function Da(o,e,t){if(o!=null&&o.title)return o.title;const a=e.split(".").pop();return Bt(a)}u(Da,"getEffectiveLabel");const Ue=class Ue2{static renderField(e,t,a={}){var p,f;if(!e||!t)return n`
                <ha-alert alert-type="error">
                    Form field requires 'editor' and 'path' parameters
                </ha-alert>
            `;const s=(p=e._getSchemaForPath)==null?void 0:p.call(e,t);if(!s)return n`
                <ha-alert alert-type="warning">
                    No schema found for path: ${t}
                </ha-alert>
            `;const i=a.value!==void 0?a.value:((f=e._getConfigValue)==null?void 0:f.call(e,t))??(s==null?void 0:s.default),r=(s==null?void 0:s["x-ui-hints"])||{},l=a.selectorOverride||r.selector||this._getSelectorConfig(s),c=a.label||r.label||Da(s,t),d=a.helper||r.helper||(s==null?void 0:s.description)||"";if(B(s,"font-family"))return this._renderFontSelector(e,t,i,c,d,a.disabled);if(ja(s))return this._renderPositionPicker(e,t,i,c,d,a.disabled);if(r.widget==="lcards-color-picker")return this._renderLcardsColorPicker(e,t,i,c,d,a.disabled);if(t==="tags")return this._renderTagsSelector(e,t,i,c,d);const h=this._prepareValueForSelector(i,l);return n`
            <ha-selector
                .hass=${e.hass}
                .selector=${l}
                .value=${h}
                .label=${c}
                .helper=${d}
                .disabled=${a.disabled||false}
                .required=${a.required||false}
                @value-changed=${b=>this._handleChange(b,e,t,l)}>
            </ha-selector>
        `}static _prepareValueForSelector(e,t){var r,l;if(!((r=t==null?void 0:t.choose)!=null&&r.choices))return e;const a=t.choose.choices;if(e==null){const c=Object.keys(a)[0],d=(l=a[c])==null?void 0:l.selector;d!=null&&d.number?e=d.number.min??0:d!=null&&d.text?e="":e=null}let s=null;typeof e=="number"?s=Object.keys(a).find(c=>{var d,h;return(h=(d=a[c])==null?void 0:d.selector)==null?void 0:h.number}):typeof e=="string"?((e.startsWith("{theme:")||e.includes("var(--"))&&(s=Object.keys(a).find(c=>{var d,h;return(c.includes("theme")||c==="theme_token")&&((h=(d=a[c])==null?void 0:d.selector)==null?void 0:h.text)})),!s&&e==="theme"&&(s=Object.keys(a).find(c=>c.includes("theme")||c.includes("binding"))),s||(s=Object.keys(a).find(c=>{var d,h,p,f;return((h=(d=a[c])==null?void 0:d.selector)==null?void 0:h.text)||((f=(p=a[c])==null?void 0:p.selector)==null?void 0:f.select)}))):typeof e=="object"&&e!==null&&!Array.isArray(e)&&(s=Object.keys(a).find(c=>{var d,h;return(h=(d=a[c])==null?void 0:d.selector)==null?void 0:h.object})),s||(s=Object.keys(a)[0]);const i={active_choice:s};return Object.keys(a).forEach(c=>{var d,h,p;if(c===s)i[c]=e;else{const f=(d=a[c])==null?void 0:d.selector;f!=null&&f.number?i[c]=f.number.min??0:f!=null&&f.text?i[c]="":f!=null&&f.select?i[c]=((p=(h=f.select.options)==null?void 0:h[0])==null?void 0:p.value)??"":i[c]=null}}),$.trace("[FormFieldHelper] Value prepared for choose selector:",{path:"(see render context)",rawValue:e,activeChoice:s,chooseValue:i}),i}static _handleChange(e,t,a,s){var r,l,c;if(e.stopPropagation(),!t||!a)return;let i;if(((r=e.target)==null?void 0:r.tagName)==="HA-SWITCH"?i=e.target.checked??e.target.__checked:i=(l=e.detail)==null?void 0:l.value,s!=null&&s.object&&!s.object.multiple&&i===""&&(i=void 0),i&&typeof i=="object"&&i.active_choice){const d=i.active_choice,h=i[d];$.trace("[FormFieldHelper] Choose value extracted:",{path:a,rawValue:i,activeChoice:d,extractedValue:h}),i=h}(c=t._setConfigValue)==null||c.call(t,a,i)}static _getSelectorConfig(e){if(!e)return{text:{}};const t=e["x-ui-hints"];return t!=null&&t.selector?t.selector:Array.isArray(e.oneOf)&&e.oneOf.length>0?this._generateChooseSelectorForOneOf(e):this._autoGenerateSelector(e)}static _autoGenerateSelector(e){return e?L(e,"number")||L(e,"integer")?{number:{mode:e.maximum&&e.maximum<=100?"slider":"box",min:e.minimum,max:e.maximum,step:e.type==="integer"?1:e.multipleOf||.1}}:L(e,"boolean")?{boolean:{}}:L(e,"string")?B(e,"entity")?{entity:{}}:B(e,"icon")?{icon:{}}:B(e,"color")?{ui_color:{}}:B(e,"action")?{ui_action:{}}:G(e)?{select:{mode:"dropdown",options:bt(e)}}:{text:{}}:L(e,"object")?{object:{}}:G(e)?{select:{mode:"dropdown",options:bt(e)}}:{text:{}}:{text:{}}}static _generateChooseSelectorForOneOf(e){const t={};return e.oneOf.forEach((a,s)=>{const i=this._getLabelForOneOfBranch(a),r=this._autoGenerateSelector(a),l=i.toLowerCase().replace(/\s+/g,"_").replace(/[^a-z0-9_]/g,"")||`option_${s}`;t[l]={selector:r}}),{choose:{choices:t}}}static _getLabelForOneOfBranch(e){var t,a,s;if(e.title)return e.title;if(e.type==="number"||e.type==="integer")return"Number";if(e.type==="string")return(t=e.pattern)!=null&&t.includes("theme:")||(a=e.pattern)!=null&&a.includes("\\{theme:")?"Theme Token":(s=e.enum)!=null&&s.includes("theme")?"Theme Binding":"Text";if(e.type==="object"){const i=e.properties||{};return i.top&&i.right&&i.bottom&&i.left?"Per Side":i.default&&i.active?"By State":i.top_left||i.top_right?"Per Corner":"Advanced"}return e.type==="boolean"?"Toggle":"Option"}static _renderFontSelector(e,t,a,s,i,r){return n`
            <lcards-font-selector
                .hass=${e.hass}
                .value=${a||"Antonio"}
                .label=${s}
                .helper=${i}
                .disabled=${r||false}
                .showPreview=${true}
                @value-changed=${l=>this._handleChange(l,e,t)}>
            </lcards-font-selector>
        `}static _renderLcardsColorPicker(e,t,a,s,i,r){return n`
            <div class="param-full">
                ${s?n`<label class="field-label">${s}</label>`:""}
                <lcards-color-picker
                    .hass=${e.hass}
                    .value=${a??""}
                    .disabled=${r||false}
                    @value-changed=${l=>this._handleChange(l,e,t)}>
                </lcards-color-picker>
                ${i?n`<div class="field-helper">${i}</div>`:""}
            </div>
        `}static _renderPositionPicker(e,t,a,s,i,r){return n`
            <lcards-position-picker
                .value=${a}
                .label=${s}
                .helper=${i}
                .disabled=${r||false}
                @value-changed=${l=>this._handleChange(l,e,t)}>
            </lcards-position-picker>
        `}static _renderTagsSelector(e,t,a,s,i){var d,h;const r=(h=(d=window.lcards)==null?void 0:d.core)==null?void 0:h.systemsManager,c=((r==null?void 0:r.getAllTags())||[]).map(p=>({value:p,label:p}));return n`
            <ha-selector
                .hass=${e.hass}
                .selector=${{select:{mode:"list",multiple:true,custom_value:true,options:c}}}
                .value=${a||[]}
                .label=${s}
                .helper=${i}
                @value-changed=${p=>this._handleChange(p,e,t)}>
            </ha-selector>
        `}};u(Ue,"LCARdSFormFieldHelper");let O=Ue;const Ve=class Ve2 extends S{static get properties(){return{editor:{type:Object},hass:{type:Object},events:{type:Array},_audioAssets:{type:Array,state:true}}}constructor(){super(),this.editor,this.hass=void 0,this.events=["card_tap","card_hold","card_double_tap","card_hover"],this._audioAssets=[]}connectedCallback(){super.connectedCallback(),this._loadAssets()}_loadAssets(){var t,a;const e=(a=(t=window.lcards)==null?void 0:t.core)==null?void 0:a.assetManager;if(e)try{const s=e.getRegistry("audio");this._audioAssets=Array.from(s.assets.entries()).map(([i,r])=>{var l,c;return{key:i,description:((l=r.metadata)==null?void 0:l.description)||i,pack:((c=r.metadata)==null?void 0:c.pack)||"unknown"}})}catch{this._audioAssets=[]}}get _sounds(){var e,t;return((t=(e=this.editor)==null?void 0:e.config)==null?void 0:t.sounds)??{}}_isMasterEnabled(){return this._sounds.enabled!==false}_overrideValueFor(e){const t=this._sounds;return e in t?t[e]===null?"__mute__":t[e]:"__scheme__"}_updateSounds(e){if(!this.editor)return;const t={...this._sounds,...e};t.enabled===true&&delete t.enabled;for(const[a,s]of Object.entries(t))s==="__scheme__"&&delete t[a];this._commitSounds(t)}_setMasterEnabled(e){if(e){const{enabled:t,...a}=this._sounds;this._commitSounds(a)}else this._updateSounds({enabled:false})}_setOverride(e,t){if(t==="__scheme__"){const a={...this._sounds};delete a[e],a.enabled===true&&delete a.enabled,this._commitSounds(a)}else t==="__mute__"?this._updateSounds({[e]:null}):this._updateSounds({[e]:t})}_clearAllOverrides(){const e={};this._sounds.enabled===false&&(e.enabled=false),this._commitSounds(e)}_commitSounds(e){if(!this.editor)return;const t={...this.editor.config};Object.keys(e).length===0?delete t.sounds:t.sounds=e,this.editor.config=t,D(this.editor,"config-changed",{config:t}),this.requestUpdate()}_previewAsset(e){var t,a,s;!e||e==="__scheme__"||e==="__mute__"||(s=(a=(t=window.lcards)==null?void 0:t.core)==null?void 0:a.soundManager)==null||s.preview(e)}_previewEvent(e){var t,a,s;(s=(a=(t=window.lcards)==null?void 0:t.core)==null?void 0:a.soundManager)==null||s.previewEvent(e)}render(){var i,r,l;const e=this._sounds,t=this._isMasterEnabled(),a=((l=(r=(i=this.hass)==null?void 0:i.states)==null?void 0:r["input_boolean.lcards_sound_enabled"])==null?void 0:l.state)==="on",s=Object.keys(e).filter(c=>c!=="enabled").length;return n`
      <div class="tab-body">

        <!-- Informational banner when global sounds are disabled -->
        ${a?"":n`
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
              @change=${c=>this._setMasterEnabled(c.target.checked)}
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

          ${this._audioAssets.length===0?n`
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
                ${this.events.map(c=>{const d=ea[c]||c,h=this._overrideValueFor(c);return n`
                    <tr class="${h!=="__scheme__"?"has-override":""}">
                      <td class="event-label">${d}</td>
                      <td>
                        <lcards-sound-source-selector
                          .hass=${this.hass}
                          .value=${h}
                          .audioAssets=${this._audioAssets}
                          .schemeLabel=${"(use global)"}
                          ?disabled=${!t}
                          @value-changed=${f=>this._setOverride(c,f.detail.value)}
                        ></lcards-sound-source-selector>
                      </td>
                      <td>
                        ${h!=="__mute__"?n`
                          <ha-icon-button
                            .label=${"Preview"}
                            @click=${()=>h==="__scheme__"?this._previewEvent(c):this._previewAsset(h)}
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

          ${s>0?n`
            <ha-button @click=${()=>this._clearAllOverrides()} style="margin-top:8px">
              <ha-icon slot="start" icon="mdi:close-circle-outline"></ha-icon>
              Clear all overrides
            </ha-button>
          `:""}

        </lcards-form-section>

      </div>
    `}static get styles(){return[ee,w`
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
      `,ua]}};u(Ve,"LCARdSCardSoundTab");let de=Ve;customElements.get("lcards-card-sound-tab")||customElements.define("lcards-card-sound-tab",de);const Ma=w`
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
`,Ke=class Ke2 extends S{static get properties(){return{zones:{type:Object},_expandedIndex:{type:Number,state:true}}}constructor(){super(),this.zones={},this._expandedIndex=null,$.debug("[ZoneListEditor] Initialized")}static get styles(){return[Ma,w`
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
            `]}_toArray(){return!this.zones||typeof this.zones!="object"?[]:Object.entries(this.zones).map(([e,t])=>({name:e,...t||{}}))}_toConfig(e){const t={};for(const{name:a,...s}of e)a&&(t[a]=s);return t}_emit(e){this.dispatchEvent(new CustomEvent("zones-changed",{detail:{value:this._toConfig(e)},bubbles:true,composed:true}))}_isPercent(e){return e.x_percent!=null||e.y_percent!=null||e.width_percent!=null||e.height_percent!=null}_subtitle(e){if(this._isPercent(e)){const r=e.x_percent??"?",l=e.y_percent??"?",c=e.width_percent??"?",d=e.height_percent??"?";return`x:${r}% y:${l}% w:${c}% h:${d}%`}const t=e.x??"?",a=e.y??"?",s=e.width??"?",i=e.height??"?";return`x:${t}px y:${a}px w:${s}px h:${i}px`}_addZone(){const e=this._toArray();let t=e.length+1;for(;e.some(a=>a.name===`zone_${t}`);)t++;e.push({name:`zone_${t}`,x:0,y:0,width:100,height:50}),this._expandedIndex=e.length-1,this._emit(e)}_deleteZone(e,t){e.stopPropagation();const a=this._toArray();a.splice(t,1),this._expandedIndex>=a.length&&(this._expandedIndex=null),this._emit(a)}_moveZone(e,t,a){e.stopPropagation();const s=this._toArray(),i=t+a;i<0||i>=s.length||([s[t],s[i]]=[s[i],s[t]],this._expandedIndex=i,this._emit(s))}_updateField(e,t,a){const s=this._toArray();s[e]={...s[e],[t]:a},this._emit(s)}_rename(e,t){const a=this._toArray();a[e]={...a[e],name:t},this._emit(a)}_toggleUnits(e,t){const a=this._toArray(),s=a[e];t?a[e]={name:s.name,x_percent:s.x_percent??(s.x!=null?parseFloat((s.x/5).toFixed(1)):0),y_percent:s.y_percent??(s.y!=null?parseFloat((s.y/5).toFixed(1)):0),width_percent:s.width_percent??(s.width!=null?parseFloat((s.width/5).toFixed(1)):50),height_percent:s.height_percent??(s.height!=null?parseFloat((s.height/5).toFixed(1)):100)}:a[e]={name:s.name,x:s.x??(s.x_percent!=null?Math.round(s.x_percent*5):0),y:s.y??(s.y_percent!=null?Math.round(s.y_percent*5):0),width:s.width??(s.width_percent!=null?Math.round(s.width_percent*5):100),height:s.height??(s.height_percent!=null?Math.round(s.height_percent*5):50)},this._emit(a)}render(){const e=this._toArray();return n`
            <div class="zone-editor">

                <ha-button class="add-button" @click=${this._addZone}>
                    <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                    Add Zone
                </ha-button>

                ${e.length===0?this._renderEmptyState():n`
                    <div class="editor-list">
                        ${e.map((t,a)=>this._renderItem(t,a,e.length))}
                    </div>
                `}

            </div>
        `}_renderEmptyState(){return n`
            <div class="empty-state">
                <div class="empty-state-title">No custom zones defined</div>
                <div class="empty-state-desc">
                    Custom zones let you define named rectangular areas that text fields
                    can target via <code>zone:</code>. They can override auto-calculated
                    card zones (e.g. <code>body</code>) or add entirely new ones.
                </div>
            </div>
        `}_renderItem(e,t,a){const s=this._expandedIndex===t,i=this._isPercent(e);return n`
            <div class="editor-item">

                <div class="editor-item-header"
                     @click=${()=>{this._expandedIndex=s?null:t,this.requestUpdate()}}>

                    <ha-icon class="editor-item-icon" icon="mdi:vector-rectangle"></ha-icon>

                    <div class="editor-item-info">
                        <div class="editor-item-title">${e.name||"(unnamed)"}</div>
                        <div class="editor-item-subtitle">${this._subtitle(e)}</div>
                    </div>

                    <div class="editor-item-actions">
                        <ha-icon-button
                            .label=${"Move Up"}
                            .disabled=${t===0}
                            @click=${r=>this._moveZone(r,t,-1)}>
                            <ha-icon icon="mdi:arrow-up"></ha-icon>
                        </ha-icon-button>
                        <ha-icon-button
                            .label=${"Move Down"}
                            .disabled=${t===a-1}
                            @click=${r=>this._moveZone(r,t,1)}>
                            <ha-icon icon="mdi:arrow-down"></ha-icon>
                        </ha-icon-button>
                        <ha-icon-button
                            .label=${"Delete"}
                            @click=${r=>this._deleteZone(r,t)}>
                            <ha-icon icon="mdi:delete"></ha-icon>
                        </ha-icon-button>
                    </div>

                    <ha-icon
                        class="expand-icon ${s?"expanded":""}"
                        icon="mdi:chevron-down">
                    </ha-icon>

                </div>

                ${s?this._renderItemContent(e,t,i):v}

            </div>
        `}_renderItemContent(e,t,a){return n`
            <div class="editor-item-content">

                <!-- Zone name -->
                <div class="form-row">
                    <ha-selector
                        .selector=${{text:{}}}
                        .value=${e.name}
                        .label=${"Zone name: referenced as zone: in text fields"}
                        @value-changed=${s=>this._rename(t,s.detail.value)}>
                    </ha-selector>
                </div>

                <!-- Unit mode toggle -->
                <div class="unit-row">
                    <span>Units:</span>
                    <div class="unit-select">
                        <ha-selector
                            .selector=${{select:{options:[{value:"px",label:"Pixels (px)"},{value:"percent",label:"Percent (%)"}],mode:"dropdown"}}}
                            .value=${a?"percent":"px"}
                            @value-changed=${s=>this._toggleUnits(t,s.detail.value==="percent")}>
                        </ha-selector>
                    </div>
                </div>

                <!-- Dimension inputs — px mode -->
                ${a?v:n`
                    <div class="dim-grid">
                        <ha-selector
                            .selector=${{number:{min:0,step:1,mode:"box",unit_of_measurement:"px"}}}
                            .value=${e.x??0}
                            .label=${"X  (left edge)"}
                            @value-changed=${s=>this._updateField(t,"x",s.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .selector=${{number:{min:0,step:1,mode:"box",unit_of_measurement:"px"}}}
                            .value=${e.y??0}
                            .label=${"Y  (top edge)"}
                            @value-changed=${s=>this._updateField(t,"y",s.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .selector=${{number:{min:0,step:1,mode:"box",unit_of_measurement:"px"}}}
                            .value=${e.width??100}
                            .label=${"Width"}
                            @value-changed=${s=>this._updateField(t,"width",s.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .selector=${{number:{min:0,step:1,mode:"box",unit_of_measurement:"px"}}}
                            .value=${e.height??50}
                            .label=${"Height"}
                            @value-changed=${s=>this._updateField(t,"height",s.detail.value)}>
                        </ha-selector>
                    </div>
                `}

                <!-- Dimension inputs — percent mode -->
                ${a?n`
                    <div class="dim-grid">
                        <ha-selector
                            .selector=${{number:{min:0,max:100,step:.1,mode:"box",unit_of_measurement:"%"}}}
                            .value=${e.x_percent??0}
                            .label=${"X  (left edge)"}
                            @value-changed=${s=>this._updateField(t,"x_percent",s.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .selector=${{number:{min:0,max:100,step:.1,mode:"box",unit_of_measurement:"%"}}}
                            .value=${e.y_percent??0}
                            .label=${"Y  (top edge)"}
                            @value-changed=${s=>this._updateField(t,"y_percent",s.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .selector=${{number:{min:0,max:100,step:.1,mode:"box",unit_of_measurement:"%"}}}
                            .value=${e.width_percent??50}
                            .label=${"Width"}
                            @value-changed=${s=>this._updateField(t,"width_percent",s.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .selector=${{number:{min:0,max:100,step:.1,mode:"box",unit_of_measurement:"%"}}}
                            .value=${e.height_percent??100}
                            .label=${"Height"}
                            @value-changed=${s=>this._updateField(t,"height_percent",s.detail.value)}>
                        </ha-selector>
                    </div>
                `:v}

                <div class="help-text">
                    Reference this zone in any text field with <code>zone: ${e.name||"zone_name"}</code>.
                    Percent values are resolved against the card's rendered pixel size at runtime.
                    You can also mix units per axis (e.g. <code>x: 10</code> with <code>height_percent: 100</code>).
                </div>

            </div>
        `}};u(Ke,"LCARdSZoneListEditor");let he=Ke;customElements.get("lcards-zone-list-editor")||customElements.define("lcards-zone-list-editor",he);const W=w`
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
`;function H({icon:o,title:e,description:t,stats:a=[],actions:s}){return n`
    <div class="launcher">
      <div class="launcher-head">
        <ha-icon icon=${o}></ha-icon>
        <h3>${e}</h3>
      </div>
      <p class="launcher-desc">${t}</p>
      ${a.length?n`
        <div class="launcher-stats">
          ${a.map(i=>n`<span><strong>${i.value}</strong> ${i.label}</span>`)}
        </div>
      `:v}
      <div class="launcher-actions">
        ${s.map((i,r)=>n`
          <ha-button variant="brand" appearance=${r===0?"accent":"outlined"} @click=${i.onClick}>
            <ha-icon icon=${i.icon} slot="start"></ha-icon>
            ${i.label}
          </ha-button>
        `)}
      </div>
    </div>
  `}u(H,"renderLauncher");const za="/lcards-config",Na=Re;function Pa(o){const t=[...(o==null?void 0:o.resolution_chain)??[]].reverse().find(a=>a.step==="value");return(t==null?void 0:t.value)??(o==null?void 0:o.resolved_value)}u(Pa,"tokenValue");function Ra(o){return Object.entries((o==null?void 0:o.theme_tokens)??{}).map(([e,t])=>({path:e,value:Pa(t),fields:t.used_by_fields??[],overridden:(t.resolution_chain??[]).some(a=>a.step==="override")})).sort((e,t)=>e.path.localeCompare(t.path))}u(Ra,"cardTokens");const We=class We2 extends S{static get properties(){return{config:{type:Object},hass:{type:Object},_provenance:{type:Object,state:true},_cardFound:{type:Boolean,state:true}}}constructor(){super(),this.config=void 0,this.hass=void 0,this._provenance=null,this._cardFound=false,this._card=null,this._unsubscribe=null}static get styles(){return[T,W,w`
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
        `]}disconnectedCallback(){var e;super.disconnectedCallback(),(e=this._unsubscribe)==null||e.call(this),this._unsubscribe=null,this._card=null}updated(e){e.has("config")&&this._load()}_load(){var t,a,s,i;let e=null;try{e=this.config?(a=(t=window.lcards)==null?void 0:t.findCardByConfig)==null?void 0:a.call(t,this.config):null}catch(r){$.debug("[CardThemeTab] No card for this config",{error:r==null?void 0:r.message})}typeof(e==null?void 0:e.getProvenance)!="function"&&(e=null),e!==this._card&&((s=this._unsubscribe)==null||s.call(this),this._unsubscribe=((i=e==null?void 0:e.subscribeProvenance)==null?void 0:i.call(e,()=>this._read()))??null,this._card=e),this._read()}_read(){this._cardFound=!!this._card,this._provenance=this._card?this._card.getProvenance():null}_openPanel(e){window.open(`${za}?tab=${e}`,"_blank","noopener")}render(){var s,i,r,l;const e=Ra(this._provenance),t=e.filter(c=>c.overridden).length,a=(l=(r=(i=(s=window.lcards)==null?void 0:s.core)==null?void 0:i.themeManager)==null?void 0:r.getActiveTheme)==null?void 0:l.call(r);return n`
            ${H({icon:"mdi:palette",title:"Theme",description:"The theme tokens this card uses and their values here. Browse every token, the alert mode lab and theme packs in the LCARdS panel.",stats:[...a!=null&&a.name?[{value:a.name,label:"theme"}]:[],{value:e.length,label:e.length===1?"token on this card":"tokens on this card"},...t?[{value:t,label:"overridden"}]:[]],actions:[{label:"Open Theme Studio",icon:"mdi:palette-swatch",onClick:u(()=>this._openPanel("theme"),"onClick")},{label:"Pack Explorer",icon:"mdi:package-variant",onClick:u(()=>this._openPanel("packs"),"onClick")}]})}
            ${this._cardFound?e.length?n`<div class="tokens">${e.map(c=>this._renderToken(c))}</div>`:n`<p class="hint empty">This card uses no theme tokens.</p>`:n`<p class="hint empty">No rendered card for this config yet: the tokens come from the card editor's preview.</p>`}
        `}_renderToken(e){const t=`theme:${e.path}`;return n`
            <div class="token" data-path=${e.path}>
                ${Na(e.value)?n`<span class="swatch" style=${U({background:e.value})}></span>`:n`<span class="swatch none"><ha-icon icon="mdi:palette-outline"></ha-icon></span>`}
                <div class="main">
                    <span class="path">${t}</span>
                    <span class="sub"><code>${e.value===void 0?"-":String(e.value)}</code>${e.fields.length?n` · ${e.fields.join(", ")}`:v}</span>
                </div>
                ${e.overridden?n`<span class="chip" title="Changed by a theme override">override</span>`:v}
                <ha-icon-button .label=${"Copy token"} title="Copy token" @click=${()=>E(t)}>
                    <ha-icon icon="mdi:content-copy"></ha-icon>
                </ha-icon-button>
            </div>
        `}};u(We,"LCARdSCardThemeTab");let ue=We;customElements.get("lcards-card-theme-tab")||customElements.define("lcards-card-theme-tab",ue);const He=class He2 extends S{static get properties(){return{columns:{type:Number},gap:{type:String}}}constructor(){super(),this.columns=2,this.gap="12px"}static get styles(){return w`
            :host {
                display: block;
                margin-bottom: 12px; /* Reduced from 16px for consistency */
            }

            .grid-layout {
                display: grid;
                gap: var(--grid-gap, 12px); /* Changed from 8px to 12px for tighter layout */
                grid-template-columns: var(--grid-columns, 1fr 1fr);
            }

            @media (max-width: 768px) {
                .grid-layout {
                    grid-template-columns: 1fr;
                }
            }

            ::slotted(*) {
                display: block;
            }

            /* Match legacy two-controls styling */
            ::slotted(lcards-form-field) {
                margin-bottom: 0;
            }
        `}render(){const e=Array(this.columns).fill("1fr").join(" ");return n`
            <div class="grid-layout" style="
                --grid-gap: ${this.gap};
                --grid-columns: ${e};
            ">
                <slot></slot>
            </div>
        `}};u(He,"LCARdSGridLayout");let pe=He;customElements.get("lcards-grid-layout")||customElements.define("lcards-grid-layout",pe);const Ye=class Ye2 extends S{static get properties(){return{editor:{type:Object},path:{type:String},properties:{type:Array},controlType:{type:String},controlConfig:{type:Object},columns:{type:Number},gap:{type:String},disabled:{type:Boolean}}}constructor(){super(),this.editor=null,this.path="",this.properties=[],this.controlType="number",this.controlConfig={},this.columns=2,this.gap="8px",this.disabled=false}static get styles(){return w`
            :host {
                display: block;
            }

            .object-editor {
                display: grid;
                gap: var(--grid-gap, 8px);
            }

            .object-editor.cols-1 {
                grid-template-columns: 1fr;
            }

            .object-editor.cols-2 {
                grid-template-columns: 1fr 1fr;
            }

            .object-editor.cols-3 {
                grid-template-columns: 1fr 1fr 1fr;
            }

            .object-editor.cols-4 {
                grid-template-columns: 1fr 1fr 1fr 1fr;
            }

            @media (max-width: 768px) {
                .object-editor.cols-2,
                .object-editor.cols-3,
                .object-editor.cols-4 {
                    grid-template-columns: 1fr;
                }
            }

            @media (min-width: 769px) and (max-width: 1024px) {
                .object-editor.cols-3,
                .object-editor.cols-4 {
                    grid-template-columns: 1fr 1fr;
                }
            }

            .property-field {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .property-label {
                font-size: 12px;
                font-weight: 500;
                color: var(--secondary-text-color, #727272);
                padding: 0 8px;
            }

            .property-control {
                padding: 2px 8px;
            }

            ha-selector {
                width: 100%;
            }
        `}render(){return this.querySelector("[slot]")||this.children.length>0?this._renderSlottedMode():this._renderAutoGeneratedMode()}_renderAutoGeneratedMode(){return!this.editor||!this.path||!this.properties.length?n`
                <ha-alert alert-type="error">
                    Object editor requires 'editor', 'path', and 'properties'
                </ha-alert>
            `:n`
            <div
                class="object-editor cols-${this.columns}"
                style="--grid-gap: ${this.gap}">
                ${this.properties.map(e=>this._renderProperty(e))}
            </div>
        `}_renderSlottedMode(){return n`
            <div
                class="object-editor cols-${this.columns}"
                style="--grid-gap: ${this.gap}">
                <slot></slot>
            </div>
        `}_renderProperty(e){const t=`${this.path}.${e}`,a=this._formatPropertyLabel(e),s=this.editor._getConfigValue(t);return n`
            <div class="property-field">
                <div class="property-label">${a}</div>
                <div class="property-control">
                    ${this._renderControl(t,s)}
                </div>
            </div>
        `}_renderControl(e,t){switch(this.controlType){case"number":return this._renderNumberControl(e,t);case"text":return this._renderTextControl(e,t);case"boolean":return this._renderBooleanControl(e,t);case"select":return this._renderSelectControl(e,t);default:return this._renderTextControl(e,t)}}_renderNumberControl(e,t){var s;const a={mode:"box",...this.controlConfig};return n`
            <ha-selector
                .hass=${(s=this.editor)==null?void 0:s.hass}
                .selector=${{number:a}}
                .value=${t??a.min??0}
                .disabled=${this.disabled}
                @value-changed=${i=>this._handleValueChange(e,i)}>
            </ha-selector>
        `}_renderTextControl(e,t){var a;return n`
            <ha-selector
                .hass=${(a=this.editor)==null?void 0:a.hass}
                .selector=${{text:this.controlConfig}}
                .value=${t||""}
                .disabled=${this.disabled}
                @value-changed=${s=>this._handleValueChange(e,s)}>
            </ha-selector>
        `}_renderBooleanControl(e,t){var a;return n`
            <ha-selector
                .hass=${(a=this.editor)==null?void 0:a.hass}
                .selector=${{boolean:{}}}
                .value=${t??false}
                .disabled=${this.disabled}
                @value-changed=${s=>this._handleValueChange(e,s)}>
            </ha-selector>
        `}_renderSelectControl(e,t){var s;const a={mode:"dropdown",...this.controlConfig};return n`
            <ha-selector
                .hass=${(s=this.editor)==null?void 0:s.hass}
                .selector=${{select:a}}
                .value=${t||""}
                .disabled=${this.disabled}
                @value-changed=${i=>this._handleValueChange(e,i)}>
            </ha-selector>
        `}_handleValueChange(e,t){if(this.disabled)return;const a=t.detail.value;this.editor._setConfigValue(e,a),this.dispatchEvent(new CustomEvent("property-changed",{detail:{path:e,value:a},bubbles:true,composed:true}))}_formatPropertyLabel(e){return e.split(/[-_]/).map(t=>t.charAt(0).toUpperCase()+t.slice(1)).join(" ")}};u(Ye,"LCARdSObjectEditor");let fe=Ye;customElements.get("lcards-object-editor")||customElements.define("lcards-object-editor",fe);/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const V=u((o,e)=>{var a;const t=o._$AN;if(t===void 0)return false;for(const s of t)(a=s._$AO)==null||a.call(s,e,false),V(s,e);return true},"s"),Z=u(o=>{let e,t;do{if((e=o._$AM)===void 0)break;t=e._$AN,t.delete(o),o=e}while((t==null?void 0:t.size)===0)},"o$1"),Lt=u(o=>{for(let e;e=o._$AM;o=e){let t=e._$AN;if(t===void 0)e._$AN=t=new Set;else if(t.has(o))break;t.add(o),Ba(e)}},"r");function Ia(o){this._$AN!==void 0?(Z(this),this._$AM=o,Lt(this)):this._$AM=o}u(Ia,"h$1");function Fa(o,e=false,t=0){const a=this._$AH,s=this._$AN;if(s!==void 0&&s.size!==0)if(e)if(Array.isArray(a))for(let i=t;i<a.length;i++)V(a[i],false),Z(a[i]);else a!=null&&(V(a,false),Z(a));else V(this,o)}u(Fa,"n$1");const Ba=u(o=>{o.type==aa.CHILD&&(o._$AP??(o._$AP=Fa),o._$AQ??(o._$AQ=Ia))},"c"),qe=class qe2 extends ta{constructor(){super(...arguments),this._$AN=void 0}_$AT(e,t,a){super._$AT(e,t,a),Lt(this),this.isConnected=e._$AU}_$AO(e,t=true){var a,s;e!==this.isConnected&&(this.isConnected=e,e?(a=this.reconnected)==null||a.call(this):(s=this.disconnected)==null||s.call(this)),t&&(V(this,e),Z(this))}setValue(e){if(pa(this._$Ct))this._$Ct._$AI(e,this);else{const t=[...this._$Ct._$AH];t[this._$Ci]=e,this._$Ct._$AI(t,this,0)}}disconnected(){}reconnected(){}};u(qe,"f");let me=qe;/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const La=u(()=>new ge,"e"),Je=class Je2{};u(Je,"h");let ge=Je;const se=new WeakMap,Ua=sa(class extends me{render(o){return v}update(o,[e]){var a;const t=e!==this.G;return t&&this.G!==void 0&&this.rt(void 0),(t||this.lt!==this.ct)&&(this.G=e,this.ht=(a=o.options)==null?void 0:a.host,this.rt(this.ct=o.element)),v}rt(o){if(this.isConnected||(o=void 0),typeof this.G=="function"){const e=this.ht??globalThis;let t=se.get(e);t===void 0&&(t=new WeakMap,se.set(e,t)),t.get(this.G)!==void 0&&this.G.call(this.ht,void 0),t.set(this.G,o),o!==void 0&&this.G.call(this.ht,o)}else this.G.value=o}get lt(){var o,e;return typeof this.G=="function"?(o=se.get(this.ht??globalThis))==null?void 0:o.get(this.G):(e=this.G)==null?void 0:e.value}disconnected(){this.lt===this.ct&&this.rt(void 0)}reconnected(){this.rt(this.ct)}}),Ut=w`
  .datasources-list {
    display: flex;
    flex-direction: column;
    gap: var(--ha-space-3);
    --lcards-section-spacing: 0;
  }

  .datasource-details {
    padding: var(--ha-space-2);
  }

  .info-row {
    display: flex;
    justify-content: space-between;
    gap: var(--ha-space-3);
    padding: 6px 0;
    border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
  }

  .info-row:last-of-type {
    border-bottom: none;
  }

  .info-row .label {
    font-weight: 500;
    color: var(--secondary-text-color);
  }

  .info-row .value {
    color: var(--primary-text-color);
    font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
    text-align: right;
    overflow-wrap: anywhere;
  }

  .info-row .value.name {
    font-weight: 600;
    color: var(--primary-color);
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ha-space-1);
    justify-content: flex-end;
  }

  .chip {
    padding: 2px var(--ha-space-2);
    border-radius: var(--ha-border-radius-pill);
    background: color-mix(in srgb, var(--primary-color) 18%, transparent);
    color: var(--primary-text-color);
    font-size: 12px;
    font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
  }

  .chip.auto {
    background: color-mix(in srgb, var(--warning-color, #ff9800) 22%, transparent);
  }

  .action-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: var(--ha-space-2);
    margin-top: var(--ha-space-3);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--ha-space-2);
    padding: var(--ha-space-10) var(--ha-space-6);
    text-align: center;
    color: var(--secondary-text-color);
  }

  .empty-state ha-icon {
    --mdc-icon-size: 48px;
    color: var(--disabled-text-color);
  }

  .empty-state p {
    margin: 0;
  }
`,Ge=class Ge2 extends S{static get properties(){return{editor:{type:Object},config:{type:Object},hass:{type:Object},_expandedSources:{state:true}}}constructor(){super(),this.config,this._expandedSources=new Set}static get styles(){return[T,Ut,w`
      :host {
        display: block;
      }
    `]}render(){var a;const e=((a=this.config)==null?void 0:a.data_sources)||{},t=Object.keys(e);return t.length===0?n`
        <div class="empty-state">
          <ha-icon icon="mdi:database-off-outline"></ha-icon>
          <p>This card has no data sources.</p>
          <p class="hint">Add one, or write them on the YAML tab.</p>
        </div>
      `:n`
      <div class="datasources-list">
        ${t.map(s=>this._renderDataSource(s,e[s]))}
      </div>
    `}_renderDataSource(e,t){const a=this._expandedSources.has(e);return n`
      <lcards-form-section
        header="${e}"
        secondary="${t.entity||"No entity"}"
        icon="mdi:database"
        ?expanded=${a}
        ?outlined=${true}
        headerLevel="4"
        @expanded-changed=${s=>this._toggleExpanded(e,s)}>

        ${a?n`
          <div class="datasource-details">
            <div class="info-row">
              <span class="label">Name</span>
              <span class="value name">${e}</span>
            </div>

            <!-- Basic Info -->
            <div class="info-row">
              <span class="label">Entity</span>
              <span class="value">${t.entity||"N/A"}</span>
            </div>

            ${t.attribute?n`
              <div class="info-row">
                <span class="label">Attribute</span>
                <span class="value">${t.attribute}</span>
              </div>
            `:""}

            <div class="info-row">
              <span class="label">Window</span>
              <span class="value">${t.window_seconds??t.windowSeconds??60}s</span>
            </div>

            <!-- Processors -->
            ${t.processing?n`
              <div class="info-row">
                <span class="label">Processors</span>
                <span class="value">${Object.keys(t.processing).length}</span>
              </div>
            `:""}

            <!-- History preload (on by default) -->
            <div class="info-row">
              <span class="label">History</span>
              <span class="value">${R(t).enabled?`last ${R(t).hours} h preloaded`:"not preloaded"}</span>
            </div>

            <!-- Edit and Remove Actions -->
            <div class="action-buttons">
              <ha-button
                @click=${()=>this._handleInspect(e)}>
                <ha-icon icon="mdi:magnify" slot="start"></ha-icon>
                Inspect
              </ha-button>
              <ha-button
                @click=${()=>this._handleEdit(e,t)}>
                <ha-icon icon="mdi:pencil" slot="start"></ha-icon>
                Edit
              </ha-button>
              <ha-button
                appearance="filled"
                variant="danger"
                @click=${()=>this._handleDelete(e)}>
                <ha-icon icon="mdi:delete" slot="start"></ha-icon>
                Remove
              </ha-button>
            </div>
          </div>
        `:""}
      </lcards-form-section>
    `}_toggleExpanded(e,t){t.detail.expanded?this._expandedSources.add(e):this._expandedSources.delete(e),this.requestUpdate()}_handleInspect(e){this.dispatchEvent(new CustomEvent("inspect-source",{detail:{sourceName:e},bubbles:true,composed:true}))}_handleEdit(e,t){this.dispatchEvent(new CustomEvent("edit-datasource",{detail:{name:e,config:t},bubbles:true,composed:true}))}_handleDelete(e){this.dispatchEvent(new CustomEvent("delete-datasource",{detail:{name:e},bubbles:true,composed:true}))}};u(Ge,"LCARdSCardDataSourcesList");let ve=Ge;customElements.get("lcards-card-datasources-list")||customElements.define("lcards-card-datasources-list",ve);const Ze=class Ze2 extends S{static get properties(){return{hass:{type:Object},_stats:{type:Object,state:true}}}constructor(){super(),this._stats=null,this._refreshInterval=null}static get styles(){return[T,Ut,w`
      :host {
        display: block;
      }

      .intro {
        margin: var(--ha-space-3) 0;
      }
    `]}connectedCallback(){super.connectedCallback(),this._refreshStats(),this._refreshInterval=setInterval(()=>this._refreshStats(),5e3)}disconnectedCallback(){this._refreshInterval&&clearInterval(this._refreshInterval),super.disconnectedCallback()}_refreshStats(){var t,a;const e=(a=(t=window.lcards)==null?void 0:t.core)==null?void 0:a.dataSourceManager;if(!e){this._stats=null;return}try{this._stats=e.getStats(),this.requestUpdate()}catch(s){$.error("❌ [GlobalDataSourcesPanel] Error fetching stats:",s)}}render(){if(!this._stats)return n`
        <lcards-message type="warning"
          message="The data source manager isn't running yet: it starts with the first LCARdS card on the page.">
        </lcards-message>
      `;const e=Object.entries(this._stats.sources||{});return e.length===0?n`
        <div class="empty-state">
          <ha-icon icon="mdi:database-off-outline"></ha-icon>
          <p>No data sources are running on this page.</p>
          <p class="hint">They appear here when cards create them.</p>
        </div>
      `:n`
      <p class="hint intro">Every data source running on this page, shared by all its cards. Read-only; updates every few seconds.</p>
      <div class="datasources-list">
        ${e.map(([t,a])=>this._renderGlobalSource(t,a))}
      </div>
    `}_renderGlobalSource(e,t){var l,c,d,h,p;const a=t.autoCreated||false,s=t.usedByCards||[],i=((l=t.buffer)==null?void 0:l.size)||0,r=((c=t.processors)==null?void 0:c.size)||0;return n`
      <lcards-form-section
        header=${e}
        secondary=${((d=t.config)==null?void 0:d.entity)||"-"}
        icon=${a?"mdi:auto-fix":"mdi:database"}
        ?outlined=${true}
        headerLevel="4">
        <div class="datasource-details">
          <div class="info-row">
            <span class="label">Created</span>
            <span class="chips"><span class="chip ${a?"auto":""}">${a?"automatically (from a template or chart)":"from a card config"}</span></span>
          </div>
          <div class="info-row">
            <span class="label">Entity</span>
            <span class="value">${((h=t.config)==null?void 0:h.entity)||"-"}</span>
          </div>
          <div class="info-row">
            <span class="label">Window</span>
            <span class="value">${((p=t.config)==null?void 0:p.windowSeconds)||60}s</span>
          </div>
          ${r>0?n`
            <div class="info-row">
              <span class="label">Processors</span>
              <span class="value">${r}</span>
            </div>
          `:""}
          <div class="info-row">
            <span class="label">Buffer</span>
            <span class="value">${i} points</span>
          </div>
          <div class="info-row">
            <span class="label">Used by</span>
            ${s.length?n`<span class="chips">${s.map(f=>n`<span class="chip">${f}</span>`)}</span>`:n`<span class="value">no cards</span>`}
          </div>
          ${t.sourceCard?n`
            <div class="info-row">
              <span class="label">Defined in</span>
              <span class="value">${t.sourceCard}</span>
            </div>
          `:""}
          ${t.lastUpdate?n`
            <div class="info-row">
              <span class="label">Last update</span>
              <span class="value">${this._formatTimestamp(t.lastUpdate)}</span>
            </div>
          `:""}
        </div>
      </lcards-form-section>
    `}_formatTimestamp(e){const t=Math.floor((Date.now()-e)/1e3);if(t<60)return`${t}s ago`;const a=Math.floor(t/60);return a<60?`${a}m ago`:`${Math.floor(a/60)}h ago`}};u(Ze,"LCARdSGlobalDataSourcesPanel");let be=Ze;customElements.get("lcards-global-datasources-panel")||customElements.define("lcards-global-datasources-panel",be);const te=w`
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
       toolbar stay put.

       font-family: Home Assistant's panel typography (as haStyle and the
       config panel host). Without it LCARdS text inherits the page's
       hardcoded Roboto while HA controls follow the theme font (Antonio
       under HA-LCARS), so one studio showed two fonts. */
    .dialog-content {
        font-family: var(--ha-font-family-body);
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
`,Va=new Set(["oldest","newest","window","t","duration_human","in_condition"]),_t=5;function Ka(o,e){if(typeof e=="number")return Number.isFinite(e)?[[o,e]]:[];const t=Array.isArray(e)?e[e.length-1]:e;return!t||typeof t!="object"?[]:"duration_ms"in t?[[`${o} (min)`,t.duration_ms/6e4]]:Object.entries(t).filter(([a,s])=>!Va.has(a)&&typeof s=="number"&&Number.isFinite(s)).map(([a,s])=>[`${o}.${a}`,s])}u(Ka,"numericFields");function Wa(o){const e=u(a=>Number.isInteger(a)?String(a):Number(a.toPrecision(6)).toString(),"num");if(o==null)return"-";if(typeof o=="number")return Number.isFinite(o)?e(o):String(o);const t=Array.isArray(o)?o[o.length-1]:o;return t&&typeof t=="object"?Object.entries(t).filter(([a])=>!["oldest","newest","t"].includes(a)).map(([a,s])=>`${a}: ${typeof s=="number"?e(s):s}`).join(" · "):String(t)}u(Wa,"formatResult");const yt=u(o=>o.reduce((e,t)=>Math.max(e,Math.abs(t.v)),0),"magnitude");function Vt(o,e,{entityState:t=null}={}){const a=[],s=o==null?void 0:o.processing,i=(e??[]).filter(g=>Number.isFinite(g==null?void 0:g.v)&&Number.isFinite(g==null?void 0:g.t)),l={order:[],series:[{name:"raw",points:i,axis:0,raw:true}],latest:[],errors:a};if(s!==void 0&&(s===null||typeof s!="object"||Array.isArray(s)))return a.push("processing must be a map of processor names to processors."),l;for(const[g,y]of Object.entries(s??{}))!y||typeof y!="object"?a.push(`${g}: a processor needs a type, e.g. type: smooth.`):y.from!==void 0&&y.type!=="convert_unit"&&a.push(`${g}: "from" is not a chaining key (it is convert_unit's unit). Use input_source: <processor>.`);if(a.length)return l;const{capacity:c}=Dt(o),d=new ia(c),h={cfg:{entity:o==null?void 0:o.entity},hass:{states:o!=null&&o.entity&&t?{[o.entity]:t}:{}}},p=new ra(h,s??{});try{p.initialize(s??{},d)}catch(g){return a.push(g.message),l}const f=p._executionOrder??[],b=new Set,_=new Map,m=[{name:"raw",points:i,axis:0,raw:true}];for(const g of i){d.push(g.t,g.v);const y=p.process(g.v,g.t,d);for(const j of f){y[j]!==null&&y[j]!==void 0&&b.add(j);for(const[F,Y]of Ka(j,y[j])){let z=_.get(F);z||(z={name:F,points:[],axis:0},_.set(F,z),m.push(z)),z.points.push({t:g.t,v:Y})}}}const k=yt(i);for(const g of m.slice(1)){const y=yt(g.points);k>0&&y>0&&(y/k>_t||k/y>_t)&&(g.axis=1)}const C=p.getStats().processorStats;for(const{key:g,stats:y}of C)y!=null&&y.errors&&a.push(`${g}: ${y.errors} of ${y.executions+y.errors} samples failed (see the browser console).`);if(i.length)for(const g of f)b.has(g)||a.push(`${g}: produced no values (check its settings).`);const x=f.map(g=>{var Y;const y=p.getProcessor(g),j=(y==null?void 0:y.getDependency())??null,F=(((Y=y==null?void 0:y.getDependencies)==null?void 0:Y.call(y))??[]).filter(z=>z!==j);return{key:g,type:(y==null?void 0:y.type)??"",input:[j??"raw",...F].join(" + "),value:Wa(p.processorResults.get(g))}});return{order:f,series:m,latest:x,errors:a}}u(Vt,"runProcessorPreview");const Ha=N(I.processors),Kt=[{type:"smooth",label:"Smooth",description:"Reduce noise: exponential, moving average or gaussian",defaults:{method:"exponential",alpha:.3}},{type:"scale",label:"Scale",description:"Map an input range to an output range (optionally curved)",defaults:{input_range:[0,100],output_range:[0,1]}},{type:"convert_unit",label:"Convert unit",description:"Unit conversion, e.g. °C to °F or W to kW",defaults:{from:"c",to:"f"}},{type:"round",label:"Round",description:"Round to a number of decimals (round, floor or ceil)",defaults:{precision:1}},{type:"clamp",label:"Clamp",description:"Keep the value within a minimum and maximum",defaults:{min:0,max:100}},{type:"delta",label:"Delta",description:"Change since the previous value",defaults:{}},{type:"rate",label:"Rate",description:"Rate of change per second, minute or hour",defaults:{unit:"per_hour"}},{type:"statistics",label:"Statistics",description:"Min, max, mean and more over a time window",defaults:{window:"1h",stats:["min","max","mean"]}},{type:"trend",label:"Trend",description:"Increasing, decreasing or stable (a word, not charted)",defaults:{samples:5,threshold:.01}},{type:"threshold",label:"Threshold",description:"Two outputs (1/0 by default) either side of a threshold",defaults:{threshold:0,hysteresis:0}},{type:"duration",label:"Duration",description:"Time spent while a condition holds",defaults:{condition:"> 0"}},{type:"expression",label:"Expression",description:"A JavaScript expression of value, sources and Math",defaults:{expression:"value"}}],J=u(o=>Kt.find(e=>e.type===o),"processorType"),Ya=u(o=>`${Ha}#${String(o).replace(/_/g,"-")}`,"processorDocsUrl"),Wt=[{label:"Temperature",units:[["c","°C"],["f","°F"],["k","K"]]},{label:"Power",units:[["w","W"],["kw","kW"],["mw","MW"],["gw","GW"]]},{label:"Energy",units:[["wh","Wh"],["kwh","kWh"],["mwh","MWh"],["j","J"]]},{label:"Distance",units:[["mm","mm"],["cm","cm"],["m","m"],["km","km"],["in","in"],["ft","ft"],["yd","yd"],["mi","mi"]]},{label:"Speed",units:[["ms","m/s"],["kmh","km/h"],["mph","mph"],["knot","kn"]]},{label:"Pressure",units:[["hpa","hPa"],["bar","bar"],["psi","psi"],["mmhg","mmHg"],["inhg","inHg"]]},{label:"Data",units:[["b","B"],["kb","kB"],["mb","MB"],["gb","GB"],["tb","TB"]]},{label:"Volume",units:[["ml","mL"],["l","L"],["gal","gal"]]},{label:"Mass",units:[["g","g"],["kg","kg"],["lb","lb"],["oz","oz"]]},{label:"Light",units:[["brightness","brightness (0-255)"],["percent","percent (0-100)"]]}];function $t(o=null){return Wt.flatMap(e=>e.units.filter(([t])=>!o||o.includes(t)).map(([t,a])=>({value:t,label:`${e.label}: ${a}`})))}u($t,"unitOptions");function wt(o){return Wt.flatMap(e=>e.units.map(([t])=>t)).filter(e=>{if(e===o)return false;try{return new oa({key:"check",type:"convert_unit",from:o,to:e}),true}catch{return false}})}u(wt,"unitTargets");function qa(o,e,t){if(!(o!=null&&o[e])||!t||t===e||o[t])return o;const a={};for(const[s,i]of Object.entries(o)){const r={...i};r.input_source===e&&(r.input_source=t),Array.isArray(r.sources)&&(r.sources=r.sources.map(l=>l===e?t:l)),a[s===e?t:s]=r}return a}u(qa,"renameProcessor");function xt(o,e){const t=String(e||"processor").toLowerCase().replace(/[^a-z0-9_]/g,"_");if(!(o!=null&&o[t]))return t;let a=2;for(;o[`${t}_${a}`];)a++;return`${t}_${a}`}u(xt,"uniqueProcessorKey");const Ht=/^[a-z_][a-z0-9_]*$/,Ja=Mt.additionalProperties.properties.processing.additionalProperties,ie="__raw__",Ga=[["min","Minimum"],["max","Maximum"],["mean","Mean"],["median","Median"],["std_dev","Standard deviation"],["q1","Q1 (25th percentile)"],["q3","Q3 (75th percentile)"],["range","Range (max - min)"],["count","Count"],["sum","Sum"]],Xe=class Xe2 extends S{static get properties(){return{hass:{attribute:false},processorKey:{type:String},config:{attribute:false},processorKeys:{attribute:false},latestValue:{type:String},_yaml:{state:true},_yamlError:{state:true},_nameError:{state:true}}}constructor(){super(),this.hass=void 0,this.processorKey="",this.config={},this.processorKeys=[],this.latestValue="",this._yaml=null,this._yamlError="",this._nameError=""}static get styles(){return w`
      :host {
        display: block;
      }
      .head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--ha-space-2);
        margin-bottom: var(--ha-space-3);
      }
      .type {
        padding: 2px var(--ha-space-2);
        border-radius: var(--ha-border-radius-pill);
        background: var(--primary-color);
        color: var(--text-primary-color);
        font-size: 12px;
        font-weight: 600;
      }
      .description {
        flex: 1 1 200px;
        font-size: 13px;
        color: var(--secondary-text-color);
      }
      .description a {
        color: var(--primary-color);
      }
      .fields {
        display: grid;
        gap: var(--ha-space-3);
      }
      .row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--ha-space-3);
      }
      @media (max-width: 600px) {
        .row {
          grid-template-columns: 1fr;
        }
      }
      ha-selector {
        display: block;
      }
      .help {
        margin-top: calc(var(--ha-space-2) * -1);
        font-size: 12px;
        color: var(--secondary-text-color);
      }
      .help code {
        font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
      }
      .latest {
        font-size: 13px;
        color: var(--secondary-text-color);
      }
      .latest strong {
        color: var(--primary-text-color);
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--ha-space-2);
        margin-top: var(--ha-space-4);
      }
      .error {
        color: var(--error-color);
        font-size: 12px;
      }
    `}willUpdate(e){e.has("processorKey")&&e.get("processorKey")!==void 0&&(this._yaml=null,this._yamlError="",this._nameError="")}render(){var a;const e=(a=this.config)==null?void 0:a.type,t=J(e);return n`
      <div class="head">
        <span class="type">${(t==null?void 0:t.label)??e}</span>
        <span class="description">
          ${(t==null?void 0:t.description)??""}
          <a href=${Ya(e)} target="_blank" rel="noreferrer">Docs</a>
        </span>
      </div>

      <div class="fields">
        <ha-selector
          .hass=${this.hass}
          .selector=${{text:{}}}
          .label=${"Name"}
          .value=${this.processorKey}
          .helper=${"Used in templates as {source.name} and by other processors as their input"}
          @value-changed=${this._rename}>
        </ha-selector>
        ${this._nameError?n`<div class="error">${this._nameError}</div>`:v}

        ${this._renderInput()}

        ${this._yaml===null?this._renderTypeFields(e):this._renderYaml()}

        ${this.latestValue?n`<div class="latest">Latest value in the preview: <strong>${this.latestValue}</strong></div>`:v}
      </div>

      <div class="actions">
        <ha-button appearance="plain" @click=${this._toggleYaml}>
          <ha-icon icon=${this._yaml===null?"mdi:code-braces":"mdi:form-select"} slot="start"></ha-icon>
          ${this._yaml===null?"Edit as YAML":"Back to the form"}
        </ha-button>
        <ha-button appearance="plain" @click=${()=>this._fire("processor-duplicate",{key:this.processorKey})}>
          <ha-icon icon="mdi:content-copy" slot="start"></ha-icon>
          Duplicate
        </ha-button>
        <ha-button appearance="plain" variant="danger" @click=${()=>this._fire("processor-delete",{key:this.processorKey})}>
          <ha-icon icon="mdi:delete" slot="start"></ha-icon>
          Delete
        </ha-button>
      </div>
    `}_renderInput(){var t;const e=this.processorKeys.filter(a=>a!==this.processorKey);return n`
      <ha-selector
        .hass=${this.hass}
        .selector=${{select:{mode:"dropdown",options:[{value:ie,label:"(Raw entity value)"},...e.map(a=>({value:a,label:a}))]}}}
        .label=${"Input"}
        .required=${false}
        .value=${((t=this.config)==null?void 0:t.input_source)??ie}
        .helper=${"What this processor works on: the raw value, or another processor's output (input_source)"}
        @value-changed=${a=>this._set("input_source",a.detail.value===ie?"":a.detail.value)}>
      </ha-selector>
    `}_num(e,t,a,s={}){var i;return n`
      <ha-selector
        .hass=${this.hass}
        .selector=${{number:{mode:s.mode??"box",step:s.step??"any",...s.min!==void 0&&{min:s.min},...s.max!==void 0&&{max:s.max}}}}
        .label=${t}
        .value=${((i=this.config)==null?void 0:i[e])??a}
        @value-changed=${r=>this._set(e,r.detail.value)}>
      </ha-selector>
    `}_select(e,t,a,s,i={}){var r;return n`
      <ha-selector
        .hass=${this.hass}
        .selector=${{select:{mode:"dropdown",options:a,...i}}}
        .label=${t}
        .required=${false}
        .value=${((r=this.config)==null?void 0:r[e])??s}
        @value-changed=${l=>this._set(e,l.detail.value)}>
      </ha-selector>
    `}_text(e,t,a="",s=""){var i;return n`
      <ha-selector
        .hass=${this.hass}
        .selector=${{text:{}}}
        .label=${t}
        .helper=${s}
        .value=${((i=this.config)==null?void 0:i[e])??a}
        @value-changed=${r=>this._set(e,r.detail.value)}>
      </ha-selector>
    `}_renderTypeFields(e){const t=this.config??{};switch(e){case"smooth":{const a=t.method??"exponential";return n`
          ${this._select("method","Method",[{value:"exponential",label:"Exponential (weights recent values)"},{value:"moving_average",label:"Moving average (last N samples)"},{value:"gaussian",label:"Gaussian (bell-weighted last N samples)"}],"exponential")}
          ${a==="exponential"?n`${this._num("alpha","Alpha",.3,{mode:"slider",min:.01,max:1,step:.01})}
                <div class="help">Lower is smoother but lags more; higher follows the value closely.</div>`:n`${this._num("window","Window (samples)",10,{min:2,step:1})}`}
        `}case"scale":return n`
          <div class="row">${this._range("input_range","Input",[0,100])}</div>
          <div class="row">${this._range("output_range","Output",[0,1])}</div>
          ${this._select("curve","Curve",["linear","exponential","logarithmic","sigmoid"].map(a=>({value:a,label:a})),"linear")}
        `;case"convert_unit":{const a=t.from??"c";return n`
          <div class="row">
            <ha-selector
              .hass=${this.hass}
              .selector=${{select:{mode:"dropdown",options:$t()}}}
              .label=${"From"}
              .value=${a}
              @value-changed=${s=>this._setUnits(s.detail.value)}>
            </ha-selector>
            ${this._select("to","To",$t(wt(a)),"")}
          </div>
          <div class="help">To lists the units this conversion supports from the chosen unit.</div>
        `}case"round":return n`
          <div class="row">
            ${this._num("precision","Decimal places",0,{min:0,max:10,step:1})}
            ${this._select("method","Method",[{value:"round",label:"Round (nearest)"},{value:"floor",label:"Floor (down)"},{value:"ceil",label:"Ceil (up)"}],"round")}
          </div>
        `;case"clamp":return n`
          <div class="row">${this._num("min","Minimum","")}${this._num("max","Maximum","")}</div>
          <div class="help">Leave one empty for no limit on that side.</div>
        `;case"delta":return n`
          <ha-selector .hass=${this.hass} .selector=${{boolean:{}}} .label=${"Absolute (always positive)"}
            .value=${t.absolute??false} @value-changed=${a=>this._set("absolute",a.detail.value)}></ha-selector>
          <div class="help">The change since the previous value.</div>
        `;case"rate":return n`
          <div class="row">
            ${this._select("unit","Per",[{value:"per_second",label:"Second"},{value:"per_minute",label:"Minute"},{value:"per_hour",label:"Hour"}],"per_second")}
            <ha-selector .hass=${this.hass} .selector=${{boolean:{}}} .label=${"Smooth the rate"}
              .value=${t.smoothing??false} @value-changed=${a=>this._set("smoothing",a.detail.value)}></ha-selector>
          </div>
          <div class="help">(Change in value) / (time between values). A kWh meter per hour gives kW.</div>
        `;case"statistics":return n`
          ${this._select("window","Window",[{value:"session",label:"Session (since the dashboard loaded)"},...["15m","1h","6h","12h","24h"].map(a=>({value:a,label:`Last ${a}`}))],"session",{custom_value:true})}
          <ha-selector .hass=${this.hass}
            .selector=${{select:{multiple:true,mode:"list",options:Ga.map(([a,s])=>({value:a,label:s}))}}}
            .label=${"Statistics"} .value=${t.stats??["min","max","mean"]}
            @value-changed=${a=>this._set("stats",a.detail.value)}></ha-selector>
          <div class="help">A time window covers this processor's recent inputs, up to the data source's buffer (see the Timing tab). Output is an object: use <code>{source.name.mean}</code> in templates.</div>
        `;case"trend":return n`
          <div class="row">${this._num("samples","Samples",5,{min:2,step:1})}${this._num("threshold","Stable below (slope per sample)",.01,{min:0})}</div>
          <div class="help">Outputs a word (increasing, decreasing or stable), so it shows in templates, not on charts.</div>
        `;case"threshold":return n`
          ${this._num("threshold","Threshold",0)}
          <div class="row">${this._num("above","Output when above",1)}${this._num("below","Output when below",0)}</div>
          ${this._num("hysteresis","Hysteresis",0,{min:0})}
          <div class="help">A dead band of this width centred on the threshold: it switches up at threshold + hysteresis / 2 and down at threshold - hysteresis / 2.</div>
        `;case"duration":return n`
          ${this._text("condition","Condition","> 0","A comparison with a number: >, >=, <, <=, == or !=, e.g. > 20. On/off entities are 1/0.")}
          ${this._text("reset_on","Reset when (optional)","","Same form, e.g. < 15")}
          <div class="help">Outputs { duration_ms, duration_human, in_condition }; the chart shows minutes.</div>
        `;case"expression":{const a=this.processorKeys.filter(s=>s!==this.processorKey);return n`
          <ha-selector .hass=${this.hass} .selector=${{text:{multiline:true}}} .label=${"Expression"}
            .value=${t.expression??""} @value-changed=${s=>this._set("expression",s.detail.value)}></ha-selector>
          ${a.length?n`
            <ha-selector .hass=${this.hass}
              .selector=${{select:{multiple:true,mode:"list",options:a.map(s=>({value:s,label:s}))}}}
              .label=${"Sources (sources[0], sources[1], ...)"} .value=${t.sources??[]}
              @value-changed=${s=>this._set("sources",s.detail.value)}></ha-selector>
          `:v}
          <div class="help">
            One JavaScript expression (no statements). Available: <code>value</code> (<code>v</code>), <code>sources[n]</code>,
            <code>timestamp</code> (<code>t</code>), <code>entity</code>, <code>Math</code>, <code>abs</code>, <code>min</code>,
            <code>max</code>, <code>round</code>. E.g. <code>value * 1.8 + 32</code> or <code>value &gt; 20 ? 1 : 0</code>.
          </div>
        `}default:return n`<lcards-message type="warning" .message=${`Unknown processor type "${e}": edit it as YAML.`}></lcards-message>`}}_range(e,t,a){var r;const s=Array.isArray((r=this.config)==null?void 0:r[e])?this.config[e]:a,i=u((l,c)=>{const d=[...s];d[l]=c,this._set(e,d)},"set");return n`
      <ha-selector .hass=${this.hass} .selector=${{number:{mode:"box",step:"any"}}} .label=${`${t} min`}
        .value=${s[0]} @value-changed=${l=>i(0,l.detail.value)}></ha-selector>
      <ha-selector .hass=${this.hass} .selector=${{number:{mode:"box",step:"any"}}} .label=${`${t} max`}
        .value=${s[1]} @value-changed=${l=>i(1,l.detail.value)}></ha-selector>
    `}_renderYaml(){return n`
      <lcards-yaml-editor
        .hass=${this.hass}
        .value=${this._yaml}
        .schema=${Ja}
        cardType="processor-lab"
        @value-changed=${e=>{e.stopPropagation(),this._applyYaml(e.detail.value)}}>
      </lcards-yaml-editor>
      ${this._yamlError?n`<div class="error">${this._yamlError}</div>`:n`<div class="help">Applies a moment after you stop typing.</div>`}
    `}_toggleYaml(){this._yamlError="",this._yaml=this._yaml===null?M(this.config??{}):null}_applyYaml(e){this._yaml=e;let t;try{t=K(e)}catch(a){this._yamlError=`YAML: ${a.message}`;return}if(!t||typeof t!="object"||!t.type){this._yamlError="A processor needs a type, e.g. type: smooth";return}this._yamlError="",this._fire("processor-change",{config:t})}_set(e,t){const a={...this.config??{}};t===""||t===null||t===void 0||Array.isArray(t)&&t.length===0&&e==="sources"?delete a[e]:a[e]=t,this._fire("processor-change",{config:a})}_setUnits(e){var s;const t=wt(e),a=t.includes((s=this.config)==null?void 0:s.to)?this.config.to:t[0];this._fire("processor-change",{config:{...this.config??{},from:e,...a&&{to:a}}})}_rename(e){const t=String(e.detail.value??"").trim();if(t===this.processorKey){this._nameError="";return}if(!Ht.test(t)){this._nameError="Use lowercase letters, digits and underscores, starting with a letter or underscore.";return}if(this.processorKeys.includes(t)){this._nameError=`"${t}" is already used by another processor.`;return}this._nameError="",this._fire("processor-rename",{from:this.processorKey,to:t})}_fire(e,t){this.dispatchEvent(new CustomEvent(e,{detail:t,bubbles:true,composed:true}))}};u(Xe,"LCARdSProcessorForm");let _e=Xe;customElements.get("lcards-processor-form")||customElements.define("lcards-processor-form",_e);const Qe=class Qe2 extends S{static get properties(){return{hass:{attribute:false},value:{attribute:false},previewResult:{attribute:false},label:{type:String},_selectedKey:{state:true},_adding:{state:true},_newType:{state:true},_newName:{state:true}}}constructor(){super(),this.hass=void 0,this.value={},this.previewResult=null,this.label="Processors",this._selectedKey="",this._adding=false,this._newType="smooth",this._newName=""}static get styles(){return w`
      :host {
        display: block;
        container-type: inline-size;
      }
      .errors {
        display: grid;
        gap: var(--ha-space-1);
        margin-bottom: var(--ha-space-3);
      }
      .split {
        display: grid;
        grid-template-columns: minmax(200px, 32%) 1fr;
        gap: var(--ha-space-4);
        min-height: 280px;
      }
      /* Tree above the form when the pane is narrow */
      @container (max-width: 560px) {
        .split {
          grid-template-columns: 1fr;
        }
      }
      .tree {
        border: var(--ha-border-width-sm) solid var(--divider-color);
        border-radius: var(--ha-border-radius-md);
        padding: var(--ha-space-2);
        align-self: start;
      }
      .tree-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--ha-space-2);
        padding: var(--ha-space-1) var(--ha-space-1) var(--ha-space-2);
        font-weight: 600;
        color: var(--primary-text-color);
      }
      .node {
        display: flex;
        align-items: center;
        gap: var(--ha-space-2);
        width: 100%;
        box-sizing: border-box;
        padding: var(--ha-space-2);
        padding-left: calc(var(--ha-space-2) + var(--depth, 0) * var(--ha-space-4));
        border: none;
        border-radius: var(--ha-border-radius-sm);
        background: none;
        color: var(--primary-text-color);
        font: inherit;
        text-align: left;
        cursor: pointer;
      }
      .node:hover {
        background: var(--secondary-background-color);
      }
      .node.selected {
        background: var(--primary-color);
        color: var(--text-primary-color);
      }
      .order {
        flex: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        border-radius: var(--ha-border-radius-circle);
        background: color-mix(in srgb, var(--primary-color) 20%, transparent);
        font-size: 11px;
        font-weight: 600;
      }
      .node.selected .order {
        background: color-mix(in srgb, var(--text-primary-color) 25%, transparent);
      }
      .name {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        font-weight: 500;
      }
      .node-type {
        flex: none;
        font-size: 12px;
        opacity: 0.8;
      }
      .empty {
        padding: var(--ha-space-4) var(--ha-space-2);
        color: var(--secondary-text-color);
        font-size: 13px;
        text-align: center;
      }
      .add {
        display: grid;
        gap: var(--ha-space-2);
        padding: var(--ha-space-2);
        margin-bottom: var(--ha-space-2);
        border-radius: var(--ha-border-radius-sm);
        background-color: color-mix(
          in srgb,
          var(--secondary-background-color) 50%,
          color-mix(in srgb, var(--primary-background-color) 25%, transparent)
        );
      }
      .add-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--ha-space-2);
      }
      .add-help {
        font-size: 12px;
        color: var(--secondary-text-color);
      }
      .detail-empty {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        color: var(--secondary-text-color);
        text-align: center;
      }
    `}get _structure(){return Vt({processing:this.value??{}},[])}willUpdate(e){if(e.has("value")){const t=Object.keys(this.value??{});t.includes(this._selectedKey)||(this._selectedKey=t[0]??"")}}updated(e){e.has("_selectedKey")&&this.dispatchEvent(new CustomEvent("processor-selected",{detail:{key:this._selectedKey},bubbles:true,composed:true}))}render(){var l,c;const e=this.value??{},t=Object.keys(e),a=this._structure,s=(((l=this.previewResult)==null?void 0:l.errors)??[]).filter(d=>!a.errors.includes(d)),i=[...a.errors,...s],r=Object.fromEntries((((c=this.previewResult)==null?void 0:c.latest)??[]).map(d=>[d.key,d.value]));return n`
      ${i.length?n`
        <div class="errors">
          ${i.map(d=>n`<lcards-message type="error" .message=${d}></lcards-message>`)}
        </div>
      `:v}

      <div class="split">
        <div class="tree">
          <div class="tree-head">
            <span>${this.label} (${t.length})</span>
            ${this._adding?v:n`
              <ha-button appearance="filled" variant="brand" size="s" @click=${this._startAdd}>
                <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                Add
              </ha-button>
            `}
          </div>
          ${this._adding?this._renderAdd(e):v}
          ${t.length?this._renderTree(e,a.order):this._adding?v:n`
            <div class="empty">No processors yet. Add one to smooth, convert, scale or analyse the values.</div>
          `}
        </div>

        <div class="detail">
          ${this._selectedKey&&e[this._selectedKey]?n`
            <lcards-processor-form
              .hass=${this.hass}
              .processorKey=${this._selectedKey}
              .config=${e[this._selectedKey]}
              .processorKeys=${t}
              .latestValue=${r[this._selectedKey]??""}
              @processor-change=${this._onChange}
              @processor-rename=${this._onRename}
              @processor-duplicate=${this._onDuplicate}
              @processor-delete=${this._onDelete}>
            </lcards-processor-form>
          `:n`<div class="detail-empty">${t.length?"Select a processor to edit it.":"Its settings will appear here."}</div>`}
        </div>
      </div>
    `}_renderTree(e,t){var d;const a=Object.keys(e),s=new Map(a.map(h=>[h,[]])),i=[];for(const h of a){const p=(d=e[h])==null?void 0:d.input_source,f=p&&p!==h?s.get(p):void 0;f?f.push(h):i.push(h)}const r=new Set,l=[],c=u((h,p)=>{if(!r.has(h)){r.add(h),l.push({key:h,depth:p});for(const f of s.get(h)??[])c(f,p+1)}},"walk");return i.forEach(h=>c(h,0)),a.filter(h=>!r.has(h)).forEach(h=>c(h,0)),l.map(({key:h,depth:p})=>{var _,m;const f=t.indexOf(h),b=(_=e[h])==null?void 0:_.type;return n`
        <button type="button" class="node ${h===this._selectedKey?"selected":""}" style="--depth: ${p}"
          @click=${()=>{this._selectedKey=h}}>
          <span class="order">${f>=0?f+1:"!"}</span>
          <span class="name">${h}</span>
          <span class="node-type">${((m=J(b))==null?void 0:m.label)??b}</span>
        </button>
      `})}_renderAdd(e){var s;const t=this._newName||xt(e,this._newType),a=Ht.test(t)?e[t]?`"${t}" is already used.`:"":"Lowercase letters, digits and underscores, starting with a letter or underscore.";return n`
      <div class="add">
        <ha-selector
          .hass=${this.hass}
          .selector=${{select:{mode:"dropdown",options:Kt.map(i=>({value:i.type,label:i.label}))}}}
          .label=${"Type"}
          .required=${false}
          .value=${this._newType}
          @value-changed=${i=>{this._newType=i.detail.value||"smooth",this._newName=""}}>
        </ha-selector>
        <div class="add-help">${((s=J(this._newType))==null?void 0:s.description)??""}</div>
        <ha-selector
          .hass=${this.hass}
          .selector=${{text:{}}}
          .label=${"Name"}
          .value=${t}
          @value-changed=${i=>{this._newName=String(i.detail.value??"").trim()}}>
        </ha-selector>
        ${a?n`<div class="add-help" style="color: var(--error-color)">${a}</div>`:n`<div class="add-help">It starts on the raw entity value; pick another processor as its Input to chain them.</div>`}
        <div class="add-actions">
          <ha-button appearance="plain" size="s" @click=${()=>{this._adding=false}}>Cancel</ha-button>
          <ha-button variant="brand" size="s" .disabled=${!!a} @click=${()=>this._add(t)}>Create</ha-button>
        </div>
      </div>
    `}_startAdd(){this._adding=true,this._newType="smooth",this._newName=""}_add(e){const t=J(this._newType);this._emit({...this.value??{},[e]:{type:this._newType,...structuredClone((t==null?void 0:t.defaults)??{})}}),this._adding=false,this._selectedKey=e}_onChange(e){e.stopPropagation(),this._emit({...this.value??{},[this._selectedKey]:e.detail.config})}_onRename(e){e.stopPropagation();const{from:t,to:a}=e.detail,s=qa(this.value??{},t,a);s!==this.value&&(this._selectedKey=a,this._emit(s))}_onDuplicate(e){e.stopPropagation();const t=e.detail.key,a=xt(this.value,t);this._emit({...this.value??{},[a]:structuredClone(this.value[t])}),this._selectedKey=a}async _onDelete(e){e.stopPropagation();const t=e.detail.key,a=Object.entries(this.value??{}).filter(([i,r])=>i!==t&&(r.input_source===t||Array.isArray(r.sources)&&r.sources.includes(t))).map(([i])=>i);if(a.length&&!await Ie({title:`Delete ${t}?`,message:`${a.join(", ")} ${a.length>1?"use":"uses"} it as input. ${a.length>1?"They switch":"It switches"} to the raw value.`}))return;const s={};for(const[i,r]of Object.entries(this.value??{})){if(i===t)continue;const l={...r};l.input_source===t&&delete l.input_source,Array.isArray(l.sources)&&(l.sources=l.sources.filter(c=>c!==t)),s[i]=l}this._emit(s)}_emit(e){this.dispatchEvent(new CustomEvent("change",{detail:{value:e},bubbles:true,composed:true}))}};u(Qe,"LCARdSProcessorTreeEditor");let ye=Qe;customElements.get("lcards-processor-tree-editor")||customElements.define("lcards-processor-tree-editor",ye);const Yt=["#ff9966","#99ccff","#ffcc66","#cc99ff","#66cc99","#ff6666","#9999ff","#ffaacc"];function Za(o){if(!Number.isFinite(o))return"";const e=Math.abs(o);return e>=100?o.toFixed(0):e>=1?o.toFixed(1):e===0?"0":o.toPrecision(2)}u(Za,"formatAxisValue");function Xa(o){return String(o).replace(/ \(min\)$/,"").replace(/\.[a-z_]+$/,"")}u(Xa,"seriesProcessorKey");function Qa(o,{colors:e=Yt,rawColor:t="#8a8a99",textColor:a="#cfcfd8",gridColor:s="#333",selected:i=null,height:r=260,mode:l="dark"}={}){var b;const d=(o.length?o:[{name:"raw",points:[],axis:0,raw:true}]).map((_,m)=>({..._,color:_.raw?t:e[(m-1)%e.length]})),h=(b=d.find(_=>_.axis===1))==null?void 0:b.name,p=u(_=>!_.raw&&i&&Xa(_.name)===i,"isSelected"),f=u(_=>_.raw?1.5:p(_)?3.5:i?1.5:2.5,"width");return{chart:{type:"line",height:r,background:"transparent",foreColor:a,animations:{enabled:false},toolbar:{show:false},zoom:{enabled:false}},theme:{mode:l},series:d.map(_=>({name:_.name,data:_.points.map(m=>[m.t,m.v])})),colors:d.map(_=>_.color),stroke:{width:d.map(f),curve:"straight",dashArray:d.map(_=>_.raw?3:0)},xaxis:{type:"datetime",labels:{datetimeUTC:false}},yaxis:d.map((_,m)=>({seriesName:_.axis===1?h:"raw",opposite:_.axis===1,show:m===0||_.name===h,labels:{formatter:Za}})),legend:{show:true,position:"top",horizontalAlign:"left"},grid:{borderColor:s},tooltip:{theme:l,x:{format:"HH:mm"}}}}u(Qa,"processorPreviewChartOptions");const re=new Map,es=5*6e4,ts={statistics:"hourly long-term statistics",history:"state history",rest:"state history",none:"no history"},oe=[[1,"1 h"],[6,"6 h"],[12,"12 h"],[24,"24 h"],[48,"48 h"],[168,"7 days"]],as=["--lcars-orange","--lcars-blue","--lcars-yellow","--lcars-violet","--lcars-green","--lcars-red","--lcars-lilac","--lcars-african-violet"],et=class et2 extends S{static get properties(){return{hass:{attribute:false},entry:{attribute:false},selectedKey:{type:String},showErrors:{type:Boolean},_span:{state:true},_status:{state:true},_result:{state:true},_history:{state:true}}}constructor(){super(),this.hass=void 0,this.entry={},this.selectedKey="",this.showErrors=true,this._span=null,this._status="empty",this._result=null,this._history=null,this._chart=null,this._timer=null,this._historyKey="",this._run=0}static get styles(){return w`
      :host {
        display: block;
      }
      .head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--ha-space-2);
        margin-bottom: var(--ha-space-1);
      }
      .title {
        font-weight: 600;
        color: var(--primary-text-color);
      }
      .meta {
        flex: 1;
        font-size: 12px;
        color: var(--secondary-text-color);
      }
      .span {
        width: 170px;
      }
      .panel {
        position: relative;
        min-height: 200px;
        padding: var(--ha-space-2);
        border-radius: var(--ha-border-radius-md);
        background-color: color-mix(
          in srgb,
          var(--secondary-background-color) 50%,
          color-mix(in srgb, var(--primary-background-color) 25%, transparent)
        );
      }
      .overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--ha-space-2);
        color: var(--secondary-text-color);
        font-size: 13px;
      }
      .messages {
        display: grid;
        gap: var(--ha-space-1);
        margin-top: var(--ha-space-2);
      }
      .caveat {
        margin-top: var(--ha-space-1);
        font-size: 12px;
        color: var(--secondary-text-color);
      }
    `}render(){var s,i;const e=this._history,t=(s=this.entry)==null?void 0:s.entity,a=this.showErrors||this._status==="error"?((i=this._result)==null?void 0:i.errors)??[]:[];return n`
      <div class="head">
        <span class="title">Preview</span>
        <span class="meta">${e&&t?`${t} · ${e.points.length} points from ${ts[e.method]??e.method}`:""}</span>
        <ha-selector
          class="span"
          .hass=${this.hass}
          .selector=${{select:{mode:"dropdown",options:this._spans().map(([r,l])=>({value:String(r),label:`Last ${l}`}))}}}
          .label=${"Preview span"}
          .required=${false}
          .value=${String(this._hours())}
          @value-changed=${r=>{r.detail.value&&(this._span=Number(r.detail.value),this._schedule())}}>
        </ha-selector>
      </div>
      <div class="panel">
        <div class="chart"></div>
        ${this._status==="empty"?n`<div class="overlay">Choose an entity on the Source tab to preview its history.</div>`:v}
        ${this._status==="loading"?n`<div class="overlay"><ha-spinner size="small"></ha-spinner>Loading history...</div>`:v}
        ${this._status==="ready"&&!(e!=null&&e.points.length)?n`<div class="overlay">${this._noPointsText()}</div>`:v}
      </div>
      ${a.length||e!=null&&e.previewOnly?n`
        <div class="messages">
          ${a.map(r=>n`<lcards-message type="error" .message=${r}></lcards-message>`)}
          ${e!=null&&e.previewOnly?n`<lcards-message type="info"
            .message=${"History preload is off for this data source, so on a dashboard it starts empty and fills as values arrive. The preview still loads history to show the processors."}></lcards-message>`:v}
        </div>
      `:v}
      <div class="caveat">
        The real processors, run over this history in order. A data source keeps its last
        ${this._capacityText()} points; between state changes, live-only behaviour (such as a duration's ticking) isn't shown.
      </div>
    `}_hours(){return this._span??R(this.entry??{}).hours}_noPointsText(){var a,s,i,r,l,c,d;const e=(a=this.entry)==null?void 0:a.entity,t=(r=(i=(s=this.hass)==null?void 0:s.states)==null?void 0:i[e])==null?void 0:r.state;return t!==void 0&&!Number.isFinite(parseFloat(t))&&!((l=this.entry)!=null&&l.enum_mapping)&&!((c=this.entry)!=null&&c.attribute)?`No numeric history for ${e} (state "${t}"). Map text states to numbers with enum_mapping on the YAML tab.`:`No history recorded for ${e} in the last ${((d=this._history)==null?void 0:d.hours)??zt} hours.`}_spans(){const e=R(this.entry??{}).hours;return oe.some(([a])=>a===e)?oe:[...oe,[e,`${e} h`]].sort((a,s)=>a[0]-s[0])}_capacityText(){var t;const e=Number((t=this.entry)==null?void 0:t.window_seconds);return String(Math.min(1e3,Math.max(60,Math.floor((Number.isFinite(e)&&e>0?e:60)*10))))}updated(e){(e.has("entry")||e.has("selectedKey")||e.has("hass")&&!this._history)&&this._schedule()}disconnectedCallback(){var e;super.disconnectedCallback(),clearTimeout(this._timer??void 0),(e=this._chart)==null||e.destroy(),this._chart=null}_schedule(){clearTimeout(this._timer??void 0),this._timer=setTimeout(()=>this._refresh(),300)}async _refresh(){var l;const e=this.entry??{};if(!e.entity||!this.hass){this._status="empty",this._result=null;return}const t=++this._run,a=R(e),s=this._hours(),i=JSON.stringify([e.entity,e.attribute??"",e.attribute_path??"",e.enum_mapping??null,s]);if(i!==this._historyKey||!this._history){this._status="loading";try{const{points:c,method:d}=await this._fetchHistory(i,e,s);if(t!==this._run)return;this._historyKey=i,this._history={points:c,method:d,hours:s,previewOnly:!a.enabled}}catch(c){if($.warn("[ProcessorPreview] History fetch failed:",c),t!==this._run)return;this._status="error",this._result={errors:[`Could not load history: ${c.message}`]};return}}else this._history={...this._history,previewOnly:!a.enabled};if(!this.isConnected)return;const r=Vt(e,this._history.points,{entityState:((l=this.hass.states)==null?void 0:l[e.entity])??null});this._result=r,this._status="ready",this.dispatchEvent(new CustomEvent("preview-result",{detail:{...r,hours:this._history.hours},bubbles:true,composed:true})),await this.updateComplete,await this._draw(r.series)}_fetchHistory(e,t,a){const s=re.get(e);if(s&&Date.now()-s.at<es)return s.promise;const i=na(this.hass,t,{hours:a});return re.set(e,{at:Date.now(),promise:i}),i.catch(()=>re.delete(e)),i}_themeColors(){var a,s;const e=getComputedStyle(this),t=u((i,r)=>e.getPropertyValue(i).trim()||r,"read");return{colors:as.map((i,r)=>t(i,Yt[r])),rawColor:t("--primary-text-color","#cfcfd8"),textColor:t("--primary-text-color","#cfcfd8"),gridColor:t("--divider-color","#333"),mode:((s=(a=this.hass)==null?void 0:a.themes)==null?void 0:s.darkMode)===false?"light":"dark"}}async _draw(e){var s;const t=this.renderRoot.querySelector(".chart");if(!t)return;const a=Qa(e,{...this._themeColors(),selected:this.selectedKey||null,height:240});try{const i=(await import("./apexcharts.esm-Dl8NxLZF.js")).default;if(!this.isConnected||!t.isConnected)return;(s=this._chart)==null||s.destroy(),this._chart=new i(t,a),await this._chart.render()}catch(i){this.isConnected&&$.error("[ProcessorPreview] Chart failed:",i)}}};u(et,"LCARdSProcessorPreview");let $e=et;customElements.get("lcards-processor-preview")||customElements.define("lcards-processor-preview",$e);const tt=class tt2 extends S{static get properties(){return{hass:{type:Object},config:{type:Object},schema:{type:Object},cardType:{type:String},note:{type:String},_text:{type:String,state:true}}}constructor(){super(),this.hass=null,this.config=null,this.schema=null,this.cardType="",this.note="",this._text="",this._lastJson=null,this._echoPending=false}static get styles(){return w`
            :host {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-3);
            }
        `}willUpdate(e){if(!e.has("config"))return;const t=JSON.stringify(this.config??{}),a=this._echoPending;this._echoPending=false,t!==this._lastJson&&(this._lastJson=t,!a&&(this._text=M(this.config??{})))}render(){return n`
            <lcards-message type="info">
                ${this.note||"Edit the whole configuration as YAML. Changes show in the preview; Save keeps them."}
            </lcards-message>
            <lcards-yaml-editor
                .value=${this._text}
                .schema=${this.schema}
                .cardType=${this.cardType}
                .hass=${this.hass}
                @value-changed=${this._onChange}>
            </lcards-yaml-editor>
        `}_onChange(e){e.stopPropagation();let t;try{t=K(e.detail.value)}catch(a){$.debug("[StudioYamlTab] YAML does not parse yet; not applied",a==null?void 0:a.message);return}!t||typeof t!="object"||Array.isArray(t)||(this._text=e.detail.value,this._lastJson=JSON.stringify(t),this._echoPending=true,this.dispatchEvent(new CustomEvent("yaml-config-changed",{detail:{config:t}})))}};u(tt,"LCARdSStudioYamlTab");let we=tt;customElements.get("lcards-studio-yaml-tab")||customElements.define("lcards-studio-yaml-tab",we);function ss(o,e){return o||String(e??"").split(".").pop().replace(/[^a-z0-9_]/gi,"_")||"source"}u(ss,"sourceName");function is(o,e,{name:t,hours:a}={}){var p,f,b,_;if(!(o!=null&&o.entity)||!(e!=null&&e.length))return null;const s=ss(t,o.entity),i=a??((p=o.history)==null?void 0:p.hours)??24,r={...o.processing??{}},l=[],c=e.some(m=>m.axis===1),d=[];for(const m of e){const k=m.raw?{datasource:s,name:"Raw",stroke_dash:4}:{datasource:s};if(!m.raw){const C=/^(.+)\.([a-z_]+)$/.exec(m.name),x=/^(.+) \(min\)$/.exec(m.name);let g=m.name;C&&((f=r[C[1]])==null?void 0:f.type)==="statistics"?(g=`${C[1]}_${C[2]}`,r[g]={type:"expression",sources:[C[1]],expression:`sources[0] ? sources[0].${C[2]} : null`},l.push(g)):x&&((b=r[x[1]])==null?void 0:b.type)==="duration"&&(g=`${x[1]}_minutes`,r[g]={type:"expression",sources:[x[1]],expression:"sources[0] ? sources[0].duration_ms / 60000 : null"},l.push(g)),k.buffer=g,k.name=m.name}c&&m.axis===1&&(k.yaxis_id="second"),d.push(k)}const h={type:"custom:lcards-chart",graph_span:`${i}h`,data_sources:{[s]:{entity:o.entity,history:((_=o.history)==null?void 0:_.enabled)===false?o.history:{...o.history??{},hours:i},...Object.fromEntries(Object.entries(o).filter(([m])=>!["entity","history","processing"].includes(m))),processing:r}},sources:d};return c&&(h.yaxis=[{id:"main"},{id:"second",opposite:true}]),{chart:h,helpers:l}}u(is,"processorChartConfig");function rs(o,e,t={}){const a=is(o,e,t);return a?(a.helpers.length?`# Added for the chart (a series plots numbers): ${a.helpers.join(", ")}
`:"")+Nt.dump(a.chart,{lineWidth:120,noRefs:true,flowLevel:-1}):""}u(rs,"processorChartYaml");const os=[{id:"basic",icon:"mdi:database",label:"Source"},{id:"timing",icon:"mdi:history",label:"History & Timing"},{id:"transform",icon:"mdi:function-variant",label:"Processing"},{id:"advanced",icon:"mdi:cog",label:"Advanced"},{id:"yaml",icon:"mdi:code-braces",label:"YAML"}],at=class at2 extends S{static get properties(){return{hass:{type:Object},mode:{type:String},sourceName:{type:String},sourceConfig:{type:Object},cardConfig:{type:Object},open:{type:Boolean},_activeTab:{type:String,state:true},_name:{type:String,state:true},_workingConfig:{type:Object,state:true},_validationErrors:{type:Array,state:true},_showErrors:{type:Boolean,state:true},_selectedProcessor:{type:String,state:true},_preview:{state:true},_copied:{type:Boolean,state:true}}}constructor(){super(),this.hass=null,this.mode="add",this.sourceName="",this.sourceConfig=null,this.cardConfig=null,this.open=false,this._activeTab="basic",this._name="",this._workingConfig={},this._validationErrors=[],this._showErrors=false,this._selectedProcessor="",this._preview=null,this._copied=false}static get styles(){return[ee,te,T,w`
                :host {
                    display: block;
                }

                /* Config | preview, as in the chart studio */
                .studio-layout {
                    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
                    grid-template-rows: minmax(0, 1fr); /* one row at every width (see studio-dialog-styles.js) */
                }

                .validation-errors {
                    display: grid;
                    gap: var(--ha-space-1);
                    padding: var(--ha-space-3) var(--ha-space-4) 0;
                }

                .tab-content lcards-form-section {
                    display: block;
                    margin-bottom: var(--ha-space-4);
                }

                .grid-2col {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: var(--ha-space-3);
                }

                @media (max-width: 600px) {
                    .grid-2col {
                        grid-template-columns: 1fr;
                    }
                }

                ha-selector {
                    display: block;
                    margin-bottom: var(--ha-space-3);
                }

                .tab-hint {
                    margin: 0 0 var(--ha-space-3);
                }

                .tab-hint a,
                .hint a {
                    color: var(--primary-color);
                }

                /* Preview pane */
                .preview-panel {
                    overflow-y: auto;
                    padding: var(--ha-space-4);
                    gap: var(--ha-space-4);
                }

                .chart-yaml summary {
                    cursor: pointer;
                    font-weight: 600;
                    color: var(--primary-text-color);
                }

                .chart-yaml-body {
                    display: grid;
                    gap: var(--ha-space-2);
                    margin-top: var(--ha-space-2);
                }

                .chart-yaml-actions {
                    display: flex;
                    align-items: center;
                    gap: var(--ha-space-2);
                }

                ha-code-editor.chart-yaml-code {
                    display: block;
                    border: var(--ha-border-width-sm) solid var(--divider-color);
                    border-radius: var(--ha-border-radius-md);
                    overflow: hidden;
                    max-height: 320px;
                    overflow-y: auto;
                }
            `]}willUpdate(e){e.has("open")&&this.open&&this._resetForm()}render(){if(!this.open)return n``;const e=this._showErrors?this._validationErrors:[];return n`
            <ha-dialog
                open
                flexcontent
                @closed=${this._handleDialogClosed}
                header-title=${this.mode==="add"?"Add Data Source":`Edit Data Source: ${this.sourceName}`}>

                <div class="dialog-content">
                    <div class="studio-layout">
                        <div class="config-panel">
                            <ha-tab-group @wa-tab-show=${this._handleTabChange}>
                                ${os.map(t=>n`
                                    <ha-tab-group-tab value=${t.id} ?active=${this._activeTab===t.id}>
                                        <ha-icon icon=${t.icon}></ha-icon>
                                        ${t.label}
                                    </ha-tab-group-tab>
                                `)}
                            </ha-tab-group>

                            ${e.length?n`
                                <div class="validation-errors">
                                    ${e.map(t=>n`<lcards-message type="error" .message=${t}></lcards-message>`)}
                                </div>
                            `:v}

                            <div class="tab-content" @click=${this._handleContentClick}>
                                ${this._renderTab()}
                            </div>
                        </div>

                        <div class="preview-panel">
                            ${this._renderPreview()}
                        </div>
                    </div>
                </div>

                <ha-dialog-footer slot="footer">
                    <ha-button slot="secondaryAction" appearance="plain" @click=${this._handleCancel}>Cancel</ha-button>
                    <ha-button slot="primaryAction" variant="brand" @click=${this._handleSave} .disabled=${!this._isValid()}>
                        <ha-icon icon="mdi:check" slot="start"></ha-icon>
                        ${this.mode==="add"?"Create":"Save"}
                    </ha-button>
                </ha-dialog-footer>
            </ha-dialog>
        `}_renderTab(){switch(this._activeTab){case"timing":return this._renderTimingTab();case"transform":return this._renderTransformTab();case"advanced":return this._renderAdvancedTab();case"yaml":return n`
                <lcards-studio-yaml-tab
                    .hass=${this.hass}
                    .config=${this._workingConfig}
                    .schema=${Mt.additionalProperties}
                    cardType="datasource"
                    note="This data source as YAML (its name is on the Source tab)."
                    @yaml-config-changed=${e=>{this._workingConfig=e.detail.config,this._validate()}}>
                </lcards-studio-yaml-tab>
            `;default:return this._renderBasicTab()}}_renderPreview(){var t,a,s;const e=(a=(t=this._preview)==null?void 0:t.series)!=null&&a.length&&!((s=this._preview.errors)!=null&&s.length)?rs(this._workingConfig,this._preview.series,{name:this._name||void 0,hours:this._preview.hours}):"";return n`
            <lcards-processor-preview
                .hass=${this.hass}
                .entry=${this._workingConfig}
                .selectedKey=${this._activeTab==="transform"?this._selectedProcessor:""}
                .showErrors=${this._activeTab!=="transform"}
                @preview-result=${i=>{i.stopPropagation(),this._preview=i.detail}}>
            </lcards-processor-preview>

            ${e?n`
                <details class="chart-yaml">
                    <summary>Use in a chart</summary>
                    <div class="chart-yaml-body">
                        <div class="hint">An lcards-chart card that plots this data source the way the preview does.</div>
                        <div class="chart-yaml-actions">
                            <ha-button size="s" @click=${()=>this._copyChart(e)}>
                                <ha-icon icon=${this._copied?"mdi:check":"mdi:content-copy"} slot="start"></ha-icon>
                                ${this._copied?"Copied":"Copy chart YAML"}
                            </ha-button>
                        </div>
                        <ha-code-editor class="chart-yaml-code" mode="yaml" read-only .value=${e}></ha-code-editor>
                    </div>
                </details>
            `:v}
        `}async _copyChart(e){await E(e),this._copied=true,setTimeout(()=>{this._copied=false},1500)}_renderBasicTab(){return n`
            <lcards-form-section header="Source" icon="mdi:database" ?expanded=${true} noCollapse
                description="What to track. The name is how cards and templates refer to it, e.g. {ds:name}.">
                <ha-selector
                    .hass=${this.hass}
                    .selector=${{text:{}}}
                    .value=${this._name}
                    .label=${"Name"}
                    .helper=${"Lowercase letters, digits and underscores, e.g. living_room_temp"}
                    .disabled=${this.mode==="edit"}
                    .required=${true}
                    @value-changed=${e=>{this._name=e.detail.value,this._showErrors=true,this._validate()}}>
                </ha-selector>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{entity:{}}}
                    .value=${this._workingConfig.entity||""}
                    .label=${"Entity"}
                    .required=${true}
                    @value-changed=${e=>this._updateConfig("entity",e.detail.value)}>
                </ha-selector>

                ${this._workingConfig.entity?n`
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{select:{mode:"dropdown",options:this._getAttributeOptions(this._workingConfig.entity)}}}
                        .value=${this._workingConfig.attribute||"__state__"}
                        .label=${"Attribute"}
                        .helper=${"Track the state, or one of its attributes"}
                        .required=${false}
                        @value-changed=${e=>this._setAttribute(e.detail.value)}>
                    </ha-selector>
                `:v}
            </lcards-form-section>
        `}_renderTimingTab(){const e=R(this._workingConfig);return n`
            <lcards-form-section header="History" icon="mdi:history" ?expanded=${true} noCollapse
                description="Recent history loaded from Home Assistant when the data source starts, so charts aren't empty.">
                <ha-selector
                    .hass=${this.hass}
                    .selector=${{boolean:{}}}
                    .value=${e.enabled}
                    .label=${"Preload history"}
                    @value-changed=${t=>this._setHistory({enabled:t.detail.value})}>
                </ha-selector>
                ${e.enabled?n`
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{number:{min:1,max:168,mode:"box",unit_of_measurement:"h"}}}
                        .value=${e.hours}
                        .label=${"Hours to load"}
                        .helper=${`1 to 168 (default ${zt}). Every recorded change; hourly statistics fill in when none are recorded.`}
                        @value-changed=${t=>this._setHistory({hours:t.detail.value})}>
                    </ha-selector>
                `:v}
            </lcards-form-section>

            <lcards-form-section header="Buffer and updates" icon="mdi:timer-outline" ?expanded=${true} noCollapse
                description="How many points the data source keeps, and how often it updates cards.">
                <div class="grid-2col">
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{number:{min:1,max:3600,mode:"box",unit_of_measurement:"s"}}}
                        .value=${this._workingConfig.window_seconds||60}
                        .label=${"Window"}
                        .helper=${`Keeps about 10 points per second of window (now ${Dt(this._workingConfig).capacity}). Charts and window-based processors see only these.`}
                        @value-changed=${t=>this._updateConfig("window_seconds",t.detail.value)}>
                    </ha-selector>
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{number:{min:10,max:5e3,mode:"box",unit_of_measurement:"ms"}}}
                        .value=${this._workingConfig.min_emit_ms||100}
                        .label=${"Update rate"}
                        .helper=${"Minimum time between card updates"}
                        @value-changed=${t=>this._updateConfig("min_emit_ms",t.detail.value)}>
                    </ha-selector>
                </div>
            </lcards-form-section>
        `}_renderTransformTab(){return n`
            <p class="hint tab-hint">
                Smooth, convert or analyse the values. Chain processors by picking another one as a processor's Input.
                <a href=${N(I.processors)} target="_blank" rel="noreferrer">Processor reference</a>
            </p>
            <lcards-processor-tree-editor
                .value=${this._workingConfig.processing||{}}
                .hass=${this.hass}
                .previewResult=${this._preview}
                @change=${this._handleProcessingChange}
                @processor-selected=${e=>{this._selectedProcessor=e.detail.key}}
                label="Processors">
            </lcards-processor-tree-editor>
        `}_renderAdvancedTab(){return n`
            <lcards-form-section header="Rate control" icon="mdi:timer-sand" ?expanded=${true} noCollapse
                description="Merge rapid changes into fewer updates. The defaults suit most sensors.">
                <div class="grid-2col">
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{number:{min:0,max:1e3,mode:"box",unit_of_measurement:"ms"}}}
                        .value=${this._workingConfig.coalesce_ms||0}
                        .label=${"Coalesce"}
                        .helper=${"Merge changes within this time (0: off)"}
                        @value-changed=${e=>this._updateConfig("coalesce_ms",e.detail.value)}>
                    </ha-selector>
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{number:{min:0,max:1e4,mode:"box",unit_of_measurement:"ms"}}}
                        .value=${this._workingConfig.max_delay_ms||0}
                        .label=${"Max delay"}
                        .helper=${"Longest a merged update may wait (0: no limit)"}
                        @value-changed=${e=>this._updateConfig("max_delay_ms",e.detail.value)}>
                    </ha-selector>
                </div>
            </lcards-form-section>

            <lcards-form-section header="Behaviour" icon="mdi:cog" ?expanded=${true} noCollapse>
                <ha-selector
                    .hass=${this.hass}
                    .selector=${{boolean:{}}}
                    .value=${this._workingConfig.emit_on_same_value??true}
                    .label=${"Update when the value is unchanged"}
                    @value-changed=${e=>this._updateConfig("emit_on_same_value",e.detail.value)}>
                </ha-selector>
            </lcards-form-section>
        `}_handleTabChange(e){var a;e.stopPropagation();const t=(a=e.target.activeTab)==null?void 0:a.getAttribute("value");t&&(this._activeTab=t)}_handleContentClick(e){e.type==="closed"&&e.stopPropagation()}_handleDialogClosed(e){e.stopPropagation(),e.target.tagName==="HA-DIALOG"&&(this.open=false,this.dispatchEvent(new CustomEvent("cancel",{bubbles:true,composed:true})))}_resetForm(){this._activeTab="basic",this._name=this.sourceName||"",this._validationErrors=[],this._showErrors=false,this.sourceConfig?this._workingConfig=JSON.parse(JSON.stringify(this.sourceConfig)):this._workingConfig={entity:"",window_seconds:60,min_emit_ms:100,emit_on_same_value:true,coalesce_ms:0,max_delay_ms:0},$.debug("[DataSourceStudio] Form reset:",{mode:this.mode,name:this._name,config:this._workingConfig})}_updateConfig(e,t){const a=e.split("."),s=JSON.parse(JSON.stringify(this._workingConfig));let i=s;for(let l=0;l<a.length-1;l++){const c=a[l];if(c==="__proto__"||c==="constructor"||c==="prototype")return;i[c]||(i[c]={}),i=i[c]}const r=a[a.length-1];r==="__proto__"||r==="constructor"||r==="prototype"||(i[r]=t,this._workingConfig=s,this._showErrors=true,this._validate(),$.debug("[DataSourceStudio] Config updated:",{path:e,value:t}))}_setAttribute(e){const t={...this._workingConfig};!e||e==="__state__"?delete t.attribute:t.attribute=e,this._workingConfig=t,this._showErrors=true,this._validate()}_setHistory(e){this._workingConfig=ft(this._workingConfig,e),this._showErrors=true,this._validate()}_handleProcessingChange(e){const t=e.detail.value,a=JSON.parse(JSON.stringify(this._workingConfig));Object.keys(t).length===0?delete a.processing:a.processing=t,this._workingConfig=a}_validate(){return this._validationErrors=this._errors(),this._validationErrors.length===0}_errors(){const e=[];return!this._name||this._name.trim()===""?e.push("DataSource name is required"):/^[a-z_][a-z0-9_]*$/.test(this._name)?this.mode==="add"&&this._isNameAlreadyDefined(this._name)&&e.push(`DataSource "${this._name}" already exists. Choose a different name.`):e.push("Name must start with lowercase letter or underscore, and contain only lowercase letters, numbers, and underscores"),(!this._workingConfig.entity||this._workingConfig.entity.trim()==="")&&e.push("Entity is required"),e}_isNameAlreadyDefined(e){var a,s,i,r;if((a=this.cardConfig)!=null&&a.data_sources&&this.cardConfig.data_sources[e])return true;const t=(i=(s=window.lcards)==null?void 0:s.core)==null?void 0:i.dataSourceManager;return!!((r=t==null?void 0:t.sources)!=null&&r.has(e))}_isValid(){return this._errors().length===0}_handleSave(){if(this._showErrors=true,!this._validate()){$.warn("[DataSourceStudio] Validation failed:",this._validationErrors);return}const e=JSON.parse(JSON.stringify(this._workingConfig));(!e.attribute||e.attribute==="__state__")&&delete e.attribute;const{history:t}=ft(e,{});t?e.history=t:delete e.history,e.coalesce_ms===0&&delete e.coalesce_ms,e.max_delay_ms===0&&delete e.max_delay_ms,e.processing&&Object.keys(e.processing).length===0&&delete e.processing,$.debug("[DataSourceStudio] Saving DataSource:",{name:this._name,config:e}),this.dispatchEvent(new CustomEvent("save",{detail:{name:this._name,config:e},bubbles:true,composed:true})),this.open=false}_handleCancel(){this.open=false,this.dispatchEvent(new CustomEvent("cancel",{bubbles:true,composed:true}))}_getAttributeOptions(e){if(!e||!this.hass)return[{value:"__state__",label:"State"}];const t=this.hass.states[e];if(!t)return[{value:"__state__",label:"State"}];const a=[{value:"__state__",label:"State"}];return t.attributes&&Object.keys(t.attributes).forEach(s=>{a.push({value:s,label:s.replace(/_/g," ").replace(/\b\w/g,i=>i.toUpperCase())})}),a}};u(at,"LCARdSDataSourceStudioDialog");let xe=at;customElements.get("lcards-datasource-studio-dialog")||customElements.define("lcards-datasource-studio-dialog",xe);const st=class st2 extends S{static get properties(){return{hass:{type:Object},cardConfig:{type:Object},open:{type:Boolean},_selectedNode:{type:Object,state:true},_expandedNodes:{state:true,attribute:false},_treeData:{type:Array,state:true},_subscriptions:{state:true,attribute:false}}}constructor(){super(),this.hass,this.cardConfig,this.open=false,this._selectedNode=null,this._expandedNodes=new Set,this._treeData=[],this._subscriptions=new Map}updated(e){super.updated(e),e.has("open")&&this.open&&(this._buildTreeData(),this._subscribeToDataSources()),e.has("open")&&!this.open&&this._unsubscribeAll()}selectDataSource(e){const t=this._treeData.find(a=>a.label===e);t?(this._selectedNode=t,this._expandedNodes.add(t.id),this.requestUpdate()):$.warn(`[DataSourceBrowser] DataSource "${e}" not found in tree`)}_handleClose(){this._unsubscribeAll(),this.dispatchEvent(new CustomEvent("close"))}disconnectedCallback(){super.disconnectedCallback(),this._unsubscribeAll()}_buildTreeData(){var s,i;const e=(i=(s=window.lcards)==null?void 0:s.core)==null?void 0:i.dataSourceManager;if(!e){$.warn("[DataSourceBrowser] DataSourceManager not available"),this._treeData=[];return}const t=[];(e.sources||new Map).forEach((r,l)=>{var h;const c={id:`ds_${l}`,type:"datasource",label:l,icon:"mdi:database",data:r,children:[]};if((h=r.cfg)!=null&&h.entity&&c.children.push({id:`${c.id}_entity`,type:"entity",label:r.cfg.entity,icon:"mdi:home-assistant",data:{entityId:r.cfg.entity},children:[]}),r.processorManager&&r.processorManager.processors.size>0){const p={id:`${c.id}_processors`,type:"processors",label:`Processors (${r.processorManager.processors.size})`,icon:"mdi:cog-outline",data:Array.from(r.processorManager.processors.entries()),children:[]};let f=0;r.processorManager.processors.forEach((b,_)=>{p.children.push({id:`${c.id}_processor_${f}`,type:"processor",label:`${_} (${b.config.type})`,icon:"mdi:function-variant",data:{key:_,processor:b,type:b.config.type},children:[]}),f++}),c.children.push(p)}const d={id:`${c.id}_buffers`,type:"buffers",label:"Buffers",icon:"mdi:database-outline",data:{},children:[]};r.buffer&&d.children.push({id:`${c.id}_buffer_main`,type:"buffer",label:`Main Buffer (${r.buffer.size()} values)`,icon:"mdi:database-outline",data:{buffer:r.buffer,bufferType:"main"},children:[]}),r.processorManager&&r.processorManager.processorBuffers.size>0&&r.processorManager.processorBuffers.forEach((p,f)=>{d.children.push({id:`${c.id}_buffer_${f}`,type:"buffer",label:`${f} Buffer (${p.size()} values)`,icon:"mdi:database-outline",data:{buffer:p,bufferType:f},children:[]})}),d.children.length>0&&c.children.push(d),t.push(c)}),this._treeData=t,$.debug("[DataSourceBrowser] Tree data built",{nodeCount:t.length})}_subscribeToDataSources(){var a,s;const e=(s=(a=window.lcards)==null?void 0:a.core)==null?void 0:s.dataSourceManager;if(!e)return;(e.sources||new Map).forEach((i,r)=>{if(i.subscribe){const l=i.subscribe(()=>{this.requestUpdate()});this._subscriptions.set(r,l)}}),$.debug("[DataSourceBrowser] Subscribed to datasources",{count:this._subscriptions.size})}_unsubscribeAll(){this._subscriptions.forEach(e=>{typeof e=="function"&&e()}),this._subscriptions.clear()}_toggleNode(e){this._expandedNodes.has(e)?this._expandedNodes.delete(e):this._expandedNodes.add(e),this.requestUpdate()}_selectNode(e){this._selectedNode=e,this.requestUpdate()}_renderTreeNodes(e,t=0){return e.map(a=>{var s;return n`
      <div class="tree-node" style="--node-level: ${t}">
        <div
          class="tree-node-content ${((s=this._selectedNode)==null?void 0:s.id)===a.id?"selected":""}"
          @click=${()=>this._selectNode(a)}>
          <span
            class="tree-expander ${a.children.length===0?"leaf":""} ${this._expandedNodes.has(a.id)?"expanded":""}"
            @click=${i=>{i.stopPropagation(),a.children.length>0&&this._toggleNode(a.id)}}>
            ${a.children.length>0?this._expandedNodes.has(a.id)?"▼":"▶":""}
          </span>
          <ha-icon icon="${a.icon}"></ha-icon>
          <span class="node-label">${a.label}</span>
        </div>
        ${this._expandedNodes.has(a.id)&&a.children.length>0?n`<div class="tree-node-children">${this._renderTreeNodes(a.children,t+1)}</div>`:""}
      </div>
    `})}_renderNodeDetail(){if(!this._selectedNode)return n`
        <div class="detail-panel-empty">
          <ha-icon icon="mdi:cursor-pointer"></ha-icon>
          <p>Select a data source, entity, processor or buffer on the left.</p>
        </div>
      `;const{type:e,label:t,data:a}=this._selectedNode;return n`
      <div class="detail-panel">
        <div class="detail-header">
          <ha-icon icon="${this._selectedNode.icon}"></ha-icon>
          <h3>${t}</h3>
          <span class="type-chip">${e}</span>
        </div>

        ${this._renderActionButtons()}

        <div class="detail-content">
          ${this._renderDetailContent(e,a,t)}
        </div>
      </div>
    `}_renderActionButtons(){if(!this._selectedNode)return n``;const{type:e,label:t}=this._selectedNode;if(e!=="datasource")return n``;const a=this._isCardLocalSource(t);return n`
      <div class="action-buttons">
        ${a?n`
          <ha-button
            appearance="filled"
            variant="neutral"
            @click=${()=>this._handleEditSource(t)}>
            <ha-icon icon="mdi:pencil" slot="start"></ha-icon>
            Edit source
          </ha-button>
        `:""}
        <ha-button
          appearance="filled"
          variant="neutral"
          @click=${()=>this._handleCopyConfig(t)}>
          <ha-icon icon="mdi:content-copy" slot="start"></ha-icon>
          Copy config
        </ha-button>
      </div>
    `}_isCardLocalSource(e){var a;const t=((a=this.cardConfig)==null?void 0:a.data_sources)||{};return e in t}_handleEditSource(e){this.dispatchEvent(new CustomEvent("edit-source",{detail:{sourceName:e},bubbles:true,composed:true}))}async _handleCopyConfig(e){var l,c,d;const t=(c=(l=window.lcards)==null?void 0:l.core)==null?void 0:c.dataSourceManager;if(!t)return;const a=(d=t.sources)==null?void 0:d.get(e);if(!a)return;const s={...a.cfg};delete s.hass;const i=JSON.stringify(s,null,2),r=await E(i);this.dispatchEvent(new CustomEvent("hass-notification",{detail:{message:r?`Config for "${e}" copied to clipboard`:"Failed to copy config to clipboard"},bubbles:true,composed:true}))}_renderDetailContent(e,t,a){switch(e){case"datasource":return this._renderDataSourceDetail(t);case"entity":return this._renderEntityDetail(t);case"processors":return this._renderProcessorsOverview(t);case"processor":return this._renderProcessorDetail(t);case"buffers":return this._renderBuffersOverview(t);case"buffer":return this._renderBufferDetail(t);default:return n`<p>No detail view for ${e}</p>`}}_renderDataSourceDetail(e){var t,a,s,i,r,l,c;return n`
      <div class="detail-section">
        <h4>Configuration</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Entity ID:</span>
            <span class="detail-value">${((t=e.cfg)==null?void 0:t.entity)||"N/A"}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Attribute:</span>
            <span class="detail-value">${((a=e.cfg)==null?void 0:a.attribute)||"State"}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Window:</span>
            <span class="detail-value">${e.windowSeconds||60}s</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Min Emit:</span>
            <span class="detail-value">${e.minEmitMs||0}ms</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Buffer Size:</span>
            <span class="detail-value">${((s=e.buffer)==null?void 0:s.size())||0} / ${((i=e.buffer)==null?void 0:i.capacity)||0}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Subscribers:</span>
            <span class="detail-value">${((r=e.subscribers)==null?void 0:r.size)||0}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h4>Current Value</h4>
        <div class="current-value">
          ${e.buffer&&e.buffer.size()>0?n`
              <div class="value-display">
                <div><strong>Value:</strong> ${((l=e.buffer.last())==null?void 0:l.v)??"N/A"}</div>
                <div><strong>Timestamp:</strong> ${(c=e.buffer.last())!=null&&c.t?new Date(e.buffer.last().t).toLocaleString():"N/A"}</div>
              </div>
            `:n`<em>No data</em>`}
        </div>
      </div>
    `}_renderEntityDetail(e){var a,s;const t=(s=(a=this.hass)==null?void 0:a.states)==null?void 0:s[e.entityId];return t?n`
      <div class="detail-section">
        <h4>Entity State</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">State:</span>
            <span class="detail-value">${ce(this.hass,t)}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Last Changed:</span>
            <span class="detail-value">${new Date(t.last_changed).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h4>Attributes</h4>
        <div class="attributes-table">
          ${Object.entries(t.attributes).map(([i,r])=>n`
            <div class="attribute-row">
              <span class="attribute-key">${la(this.hass,t,i)}:</span>
              <span class="attribute-value">${ca(this.hass,t,i)}</span>
            </div>
          `)}
        </div>
      </div>
    `:n`<p>Entity not found: ${e.entityId}</p>`}_renderProcessorDetail(e){var d;const{key:t,processor:a,type:s}=e,i=a.buffer?a.buffer.size():0,r=a.buffer?a.buffer.capacity:0,l=(d=a.config)!=null&&d.from?[a.config.from]:[],c=this._sanitizeForDisplay(a.config);return n`
      <div class="detail-section">
        <h4>Processor: ${t}</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Type:</span>
            <span class="detail-value">${s}</span>
          </div>
          ${l.length>0?n`
            <div class="detail-item">
              <span class="detail-label">Dependencies:</span>
              <span class="detail-value">${l.join(", ")}</span>
            </div>
          `:""}
          <div class="detail-item">
            <span class="detail-label">Buffer:</span>
            <span class="detail-value">${i} / ${r} points</span>
          </div>
          ${a.lastValue!==void 0?n`
            <div class="detail-item">
              <span class="detail-label">Current Value:</span>
              <span class="detail-value">${a.lastValue}</span>
            </div>
          `:""}
        </div>
      </div>

      <div class="detail-section">
        <h4>Configuration</h4>
        <pre class="config-block">${JSON.stringify(c,null,2)}</pre>
      </div>
    `}_sanitizeForDisplay(e,t=0,a=new WeakSet){if(t>10)return"[Max Depth]";if(e==null||typeof e!="object"&&typeof e!="function")return e;if(typeof e=="function")return"[Function]";if(a.has(e))return"[Circular]";if(a.add(e),Array.isArray(e))return e.map(i=>this._sanitizeForDisplay(i,t+1,a));const s={};for(const[i,r]of Object.entries(e)){if(i==="hass"||i==="_hass"||i==="hassInstance"){s[i]="[HASS Object - Hidden]";continue}typeof r!="function"&&(s[i]=this._sanitizeForDisplay(r,t+1,a))}return s}_renderBufferDetail(e){const{buffer:t,bufferType:a}=e;if(!t||!t.size||t.size()===0)return n`
        <div class="detail-section">
          <h4>${a} Buffer</h4>
          <p><em>No data in buffer</em></p>
        </div>
      `;const s=t.size(),r=t.getAll().slice(-10).reverse();return n`
      <div class="detail-section">
        <h4>${a} Buffer (${s} / ${t.capacity} values)</h4>
        <div class="buffer-table">
          ${r.map((l,c)=>n`
            <div class="buffer-row">
              <span class="buffer-index">#${s-c}</span>
              <span class="buffer-time">${new Date(l.t).toLocaleTimeString()}</span>
              <span class="buffer-value">${l.v}</span>
            </div>
          `)}
        </div>
        ${s>10?n`<p class="buffer-note">Showing last 10 of ${s} values</p>`:""}
      </div>
    `}_renderProcessorsOverview(e){if(!e||e.length===0)return n`<p><em>No processors configured</em></p>`;const t={},a=new Map;return e.forEach(([s,i])=>{var l,c;const r=((l=i.config)==null?void 0:l.type)||"unknown";t[r]=(t[r]||0)+1,(c=i.config)!=null&&c.from&&a.set(s,i.config.from)}),n`
      <div class="detail-section">
        <h4>Processing Pipeline Summary</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Total Processors:</span>
            <span class="detail-value">${e.length}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Dependencies:</span>
            <span class="detail-value">${a.size} processors with dependencies</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h4>By Type</h4>
        <div class="detail-grid">
          ${Object.entries(t).sort((s,i)=>i[1]-s[1]).map(([s,i])=>n`
            <div class="detail-item">
              <span class="detail-label">${s}:</span>
              <span class="detail-value">${i}</span>
            </div>
          `)}
        </div>
      </div>

      <div class="detail-section">
        <h4>All Processors</h4>
        <div class="detail-grid">
          ${e.map(([s,i])=>{var h,p;const r=((h=i.config)==null?void 0:h.type)||"unknown",l=(p=i.config)==null?void 0:p.from,c=l?` ← ${l}`:"",d=i.buffer?i.buffer.size():0;return n`
              <div class="detail-item">
                <span class="detail-label">${s}:</span>
                <span class="detail-value">${r}${c} (${d} points)</span>
              </div>
            `})}
        </div>
      </div>

      ${a.size>0?n`
        <div class="detail-section">
          <h4>Dependency Graph</h4>
          <div class="dependency-tree">
            ${e.map(([s,i])=>{var l;const r=(l=i.config)==null?void 0:l.from;return r?n`
                <div class="dependency-item">
                  <span class="dep-source">${r}</span>
                  <span class="dep-arrow">→</span>
                  <span class="dep-target">${s}</span>
                </div>
              `:""})}
          </div>
        </div>
      `:""}
    `}_renderBuffersOverview(e){var h,p,f,b,_;const t=(p=(h=this._selectedNode)==null?void 0:h.id)==null?void 0:p.split("_");if(!t||t.length<3||t[0]!=="ds")return n`<p><em>Could not determine datasource from node ID</em></p>`;const a=t.slice(1,-1).join("_"),s=(b=(f=window.lcards)==null?void 0:f.core)==null?void 0:b.dataSourceManager,i=s==null?void 0:s.getSource(a);if(!i)return n`<p><em>DataSource "${a}" not found</em></p>`;const r=[];i.buffer&&r.push({name:"Main",buffer:i.buffer,size:i.buffer.size(),capacity:i.buffer.capacity}),(_=i.processorManager)!=null&&_.processorBuffers&&i.processorManager.processorBuffers.size>0&&i.processorManager.processorBuffers.forEach((m,k)=>{r.push({name:`Processor: ${k}`,buffer:m,size:m.size(),capacity:m.capacity})});const l=r.reduce((m,k)=>m+k.size,0),c=r.reduce((m,k)=>m+k.capacity,0),d=l*16;return n`
      <div class="detail-section">
        <h4>Buffers Summary</h4>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Total Buffers:</span>
            <span class="detail-value">${r.length}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Total Entries:</span>
            <span class="detail-value">${l} / ${c}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Est. Memory:</span>
            <span class="detail-value">${d<1024?`${d} B`:`${(d/1024).toFixed(1)} KB`}</span>
          </div>
        </div>
      </div>

      <div class="detail-section">
        <h4>All Buffers</h4>
        <div class="detail-grid">
          ${r.map(m=>n`
            <div class="detail-item">
              <span class="detail-label">${m.name}:</span>
              <span class="detail-value">${m.size} / ${m.capacity} (${Math.round(m.size/m.capacity*100)}%)</span>
            </div>
          `)}
        </div>
      </div>
    `}static get styles(){return[te,T,w`
      :host {
        display: block;
      }

      /* Tree | detail, as a studio's config | preview */
      .studio-layout {
        grid-template-columns: minmax(240px, 32%) 1fr;
        grid-template-rows: minmax(0, 1fr); /* one row at every width (see studio-dialog-styles.js) */
      }

      .tree-head {
        padding: var(--ha-space-3) var(--ha-space-4);
        font-weight: 600;
        color: var(--primary-text-color);
        border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
      }

      .tree-container {
        flex: 1;
        overflow-y: auto;
        padding: var(--ha-space-2);
        min-height: 0;
      }

      .tree-empty {
        padding: var(--ha-space-6);
        text-align: center;
      }

      .tree-node-content {
        display: flex;
        align-items: center;
        gap: var(--ha-space-2);
        padding: var(--ha-space-2);
        padding-left: calc(var(--ha-space-2) + var(--node-level, 0) * var(--ha-space-4));
        border-radius: var(--ha-border-radius-sm);
        color: var(--primary-text-color);
        cursor: pointer;
        user-select: none;
      }

      .tree-node-content:hover {
        background: var(--secondary-background-color);
      }

      .tree-node-content.selected {
        background: var(--primary-color);
        color: var(--text-primary-color);
      }

      .tree-expander {
        width: 16px;
        flex: none;
        text-align: center;
        font-size: 12px;
      }

      .tree-expander.leaf {
        visibility: hidden;
      }

      .tree-node-content ha-icon {
        --mdc-icon-size: 18px;
        flex: none;
      }

      .node-label {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* Detail pane */
      .preview-panel {
        overflow-y: auto;
        padding: var(--ha-space-4);
      }

      .detail-panel-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--ha-space-3);
        height: 100%;
        color: var(--secondary-text-color);
      }

      .detail-panel-empty ha-icon {
        --mdc-icon-size: 48px;
        opacity: 0.5;
      }

      .detail-header {
        display: flex;
        align-items: center;
        gap: var(--ha-space-3);
        margin-bottom: var(--ha-space-3);
      }

      .detail-header h3 {
        flex: 1;
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: var(--primary-text-color);
      }

      .type-chip {
        padding: 2px var(--ha-space-2);
        border-radius: var(--ha-border-radius-pill);
        background: var(--primary-color);
        color: var(--text-primary-color);
        font-size: 12px;
        font-weight: 600;
      }

      .action-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: var(--ha-space-2);
        margin-bottom: var(--ha-space-4);
      }

      /* Each block reads like an lcards-form-section card */
      .detail-section {
        margin-bottom: var(--ha-space-3);
        padding: var(--ha-space-3);
        border-radius: var(--ha-border-radius-lg);
        background-color: color-mix(
          in srgb,
          var(--secondary-background-color) 30%,
          color-mix(in srgb, var(--primary-background-color) 25%, transparent)
        );
      }

      .detail-section h4 {
        margin: 0 0 var(--ha-space-3);
        font-size: 14px;
        font-weight: 600;
        color: var(--primary-text-color);
      }

      .detail-grid,
      .attributes-table {
        display: grid;
        gap: var(--ha-space-1);
      }

      .detail-item,
      .attribute-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--ha-space-3);
        padding: 6px 0;
        border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
      }

      .detail-item:last-child,
      .attribute-row:last-child {
        border-bottom: none;
      }

      .detail-label,
      .attribute-key {
        font-weight: 500;
        color: var(--secondary-text-color);
      }

      .detail-value,
      .attribute-value {
        font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
        color: var(--primary-text-color);
        text-align: right;
        overflow-wrap: anywhere;
      }

      /* Code-like blocks */
      .current-value,
      .config-block,
      .value-display,
      .dependency-tree,
      .buffer-table {
        padding: var(--ha-space-3);
        border-radius: var(--ha-border-radius-md);
        background: var(--primary-background-color);
        font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
        font-size: 13px;
        color: var(--primary-text-color);
        overflow-x: auto;
      }

      .value-display div {
        margin: var(--ha-space-1) 0;
      }

      .dependency-tree,
      .buffer-table {
        display: grid;
        gap: var(--ha-space-1);
      }

      .buffer-table {
        max-height: 400px;
        overflow-y: auto;
      }

      .dependency-item,
      .buffer-row {
        display: grid;
        align-items: center;
        gap: var(--ha-space-3);
        padding: 6px var(--ha-space-2);
        border-radius: var(--ha-border-radius-sm);
        background: color-mix(in srgb, var(--secondary-background-color) 50%, transparent);
      }

      .dependency-item {
        display: flex;
      }

      .buffer-row {
        grid-template-columns: 48px 120px 1fr;
      }

      .dep-source,
      .buffer-value {
        color: var(--primary-color);
        overflow-wrap: anywhere;
      }

      .dep-arrow,
      .buffer-index,
      .buffer-time {
        color: var(--secondary-text-color);
      }

      .dep-target {
        color: var(--accent-color, var(--primary-color));
      }

      .buffer-note {
        margin-top: var(--ha-space-2);
      }
    `]}render(){return this.open?n`
      <ha-dialog
        open
        flexcontent
        @closed=${e=>{e.stopPropagation(),e.target===e.currentTarget&&this._handleClose()}}
        header-title="Data Source Browser">
        <div class="dialog-content">
          <div class="studio-layout">
            <div class="config-panel">
              <div class="tree-head">Data sources on this page (${this._treeData.length})</div>
              <div class="tree-container">
                ${this._treeData.length>0?this._renderTreeNodes(this._treeData):n`<p class="hint tree-empty">No data sources are running on this page.</p>`}
              </div>
            </div>
            <div class="preview-panel">
              ${this._renderNodeDetail()}
            </div>
          </div>
        </div>

        <ha-dialog-footer slot="footer">
          <ha-button slot="primaryAction" @click=${this._handleClose} data-dialog="close">Close</ha-button>
        </ha-dialog-footer>
      </ha-dialog>
    `:n``}};u(st,"LCARdSDataSourceBrowser");let ke=st;customElements.get("lcards-datasource-browser")||customElements.define("lcards-datasource-browser",ke);const it=class it2 extends S{static get properties(){return{editor:{type:Object},hass:{type:Object},_activeSubTab:{type:String,state:true},_dialogOpen:{type:Boolean,state:true},_dialogMode:{type:String,state:true},_editingSource:{type:Object,state:true},_browserOpen:{type:Boolean,state:true}}}constructor(){super(),this.editor=void 0,this.hass=void 0,this._activeSubTab="card",this._dialogOpen=false,this._dialogMode="add",this._editingSource=null,this._browserOpen=false,this._browserRef=La()}static get styles(){return[ee,T,W,w`
        :host {
          display: block;
        }

        ha-tab-group {
          display: block;
          margin-top: var(--ha-space-4);
        }

        ha-tab-group-tab ha-icon {
          --mdc-icon-size: 18px;
          margin-right: var(--ha-space-2);
        }

        .card-sources-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--ha-space-3);
          margin: var(--ha-space-3) 0;
        }
      `]}render(){var i,r,l,c,d,h,p,f,b;const e=((r=(i=this.editor)==null?void 0:i.config)==null?void 0:r.data_sources)||{},t=Object.keys(e).length,a=(c=(l=window.lcards)==null?void 0:l.core)==null?void 0:c.dataSourceManager,s=((d=a==null?void 0:a.sources)==null?void 0:d.size)||0;return n`
      ${H({icon:"mdi:database-search",title:"Data sources",description:"Live state of every data source on this page: values, buffers and processors.",stats:[{value:t,label:t===1?"card source":"card sources"},{value:s,label:"running on this page"}],actions:[{label:"Browse sources",icon:"mdi:database-search",onClick:u(()=>this._openBrowser(),"onClick")}]})}

      <ha-tab-group @wa-tab-show=${this._handleTabChange}>
        <ha-tab-group-tab value="card" ?active=${this._activeSubTab==="card"}>
          <ha-icon icon="mdi:card-outline"></ha-icon>
          This card
        </ha-tab-group-tab>
        <ha-tab-group-tab value="global" ?active=${this._activeSubTab==="global"}>
          <ha-icon icon="mdi:earth"></ha-icon>
          All on this page
        </ha-tab-group-tab>

        <div class="tab-panel">
          ${this._activeSubTab==="global"?this._renderGlobalSources():this._renderCardSources()}
        </div>
      </ha-tab-group>

      <lcards-datasource-studio-dialog
        .hass=${this.hass}
        .mode=${this._dialogMode}
        .sourceName=${(h=this._editingSource)==null?void 0:h.name}
        .sourceConfig=${(p=this._editingSource)==null?void 0:p.config}
        .cardConfig=${(f=this.editor)==null?void 0:f.config}
        .open=${this._dialogOpen}
        @save=${this._handleDialogSave}
        @cancel=${()=>this._dialogOpen=false}>
      </lcards-datasource-studio-dialog>

      <lcards-datasource-browser
        ${Ua(this._browserRef)}
        .hass=${this.hass}
        .cardConfig=${(b=this.editor)==null?void 0:b.config}
        .open=${this._browserOpen}
        @close=${()=>this._browserOpen=false}
        @edit-source=${this._handleBrowserEditSource}>
      </lcards-datasource-browser>
    `}_renderCardSources(){return n`
      <div class="card-sources-header">
        <span class="hint">Data sources defined in this card's config.</span>
        <ha-button variant="brand" appearance="accent" @click=${this._handleAddSource}>
          <ha-icon slot="start" icon="mdi:plus"></ha-icon>
          Add source
        </ha-button>
      </div>

      <lcards-card-datasources-list
        .editor=${this.editor}
        .config=${this.editor.config}
        .hass=${this.hass}
        @edit-datasource=${this._handleEditRequest}
        @delete-datasource=${this._handleDeleteRequest}
        @inspect-source=${this._handleInspectSource}>
      </lcards-card-datasources-list>
    `}_renderGlobalSources(){return n`
      <lcards-global-datasources-panel
        .hass=${this.hass}>
      </lcards-global-datasources-panel>
    `}_handleTabChange(e){var a;e.stopPropagation();const t=(a=e.target.activeTab)==null?void 0:a.getAttribute("value");t&&this._setActiveTab(t)}_setActiveTab(e){this._activeSubTab=e}_openBrowser(){this._browserOpen=true}_handleInspectSource(e){const{sourceName:t}=e.detail;this._browserOpen=true,requestAnimationFrame(()=>{this._browserRef.value&&this._browserRef.value.selectDataSource(t)})}_handleBrowserEditSource(e){var i,r;const{sourceName:t}=e.detail;this._browserOpen=false,this._activeSubTab="card";const s=(((r=(i=this.editor)==null?void 0:i.config)==null?void 0:r.data_sources)||{})[t];if(!s){$.warn(`⚠️ [DataSourceEditorTab] Source "${t}" not found in card config`);return}this._dialogMode="edit",this._editingSource={name:t,config:s},this._dialogOpen=true}_handleAddSource(){this._dialogMode="add",this._editingSource=null,this._dialogOpen=true}_handleEditRequest(e){this._dialogMode="edit",this._editingSource=e.detail,this._dialogOpen=true}async _handleDeleteRequest(e){var r,l;const{name:t}=e.detail,a=(l=(r=window.lcards)==null?void 0:r.core)==null?void 0:l.dataSourceManager;if(!a){$.warn("⚠️ [LCARdS] DataSourceManager not available");return}const s=a.getSourceDependents(t);if(s.length>0&&!await this._showDependencyWarningDialog(t,s))return;const i={...this.editor.config.data_sources||{}};if(delete i[t],this.editor.config.data_sources=i,D(this.editor,"config-changed",{config:this.editor.config}),this.editor._yamlValue!==void 0){this.editor._isUpdatingYaml=true;const{configToYaml:c}=await import("./lcards-yaml-editor-BVTHq2uG.js").then(d=>d.j);this.editor._yamlValue=c(this.editor.config),requestAnimationFrame(()=>{this.editor._isUpdatingYaml=false})}a.removeCardFromSource(t,this.editor.config.id||this.editor._cardGuid),this.editor.requestUpdate(),this.requestUpdate()}_handleDialogSave(e){var i,r;const{name:t,config:a}=e.detail,s={...this.editor.config.data_sources||{}};if(s[t]=a,this.editor.config={...this.editor.config,data_sources:s},D(this.editor,"config-changed",{config:this.editor.config}),this._dialogMode==="add"){const l=(r=(i=window.lcards)==null?void 0:i.core)==null?void 0:r.dataSourceManager;l&&l.createDataSource(t,a,this.editor.config.id||this.editor._cardGuid,false)}this._dialogOpen=false,this._activeSubTab="card",this.requestUpdate()}_showDependencyWarningDialog(e,t){return Ie({title:`Delete ${e}?`,message:`Other cards use it: ${t.join(", ")}. They show errors until their configs stop referring to it. This can't be undone.`,confirmText:"Delete anyway"})}};u(it,"LCARdSDataSourceEditorTab");let Ce=it;customElements.get("lcards-datasource-editor-tab")||customElements.define("lcards-datasource-editor-tab",Ce);const ns=[{category:"Entity",items:[{value:"entity",label:"Entity State"},{value:"entity_attr",label:"Entity Attribute"}]},{category:"Template",items:[{value:"jinja2",label:"Jinja2 Template"},{value:"javascript",label:"JavaScript Template"}]},{category:"Time",items:[{value:"time_between",label:"Time Between"},{value:"weekday_in",label:"Weekday"},{value:"sun_elevation",label:"Sun Elevation"}]},{category:"Advanced",items:[{value:"map_range_cond",label:"Map Range"},{value:"random_chance",label:"Random Chance"}]},{category:"Logic",items:[{value:"all",label:"ALL (AND sub-group)"},{value:"any",label:"ANY (OR sub-group)"},{value:"not",label:"NOT (negate)"}]}],ls=ns.flatMap(o=>o.items.map(e=>({value:e.value,label:`${o.category}: ${e.label}`}))),cs=[{value:"equals",label:"equals"},{value:"not_equals",label:"not equals"},{value:"above",label:"above"},{value:"at_least",label:"at least (≥)"},{value:"below",label:"below"},{value:"at_most",label:"at most (≤)"},{value:"between",label:"between (≥ and ≤)"},{value:"between_exclusive",label:"between (exclusive, > and <)"},{value:"in",label:"in list"},{value:"not_in",label:"not in list"},{value:"regex",label:"regex match"}],q={between:{loKey:"at_least",hiKey:"at_most"},between_exclusive:{loKey:"above",hiKey:"below"}},ds=["mon","tue","wed","thu","fri","sat","sun"],rt=class rt2 extends S{static get properties(){return{value:{type:Object},hass:{type:Object},_operator:{type:String,state:true},_conditions:{type:Array,state:true}}}constructor(){super(),this.value=null,this.hass=null,this._operator="single",this._conditions=[]}static get styles(){return w`
            :host { display: block; }

            .group-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 12px;
            }

            .group-header ha-selector {
                flex: 0 0 180px;
                margin-bottom: 0;
            }

            .conditions-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .condition-row {
                display: flex;
                gap: 8px;
                align-items: flex-start;
                background: var(--secondary-background-color, rgba(0,0,0,0.05));
                border-radius: 8px;
                padding: 8px;
                border: var(--ha-border-width-sm) solid var(--divider-color, #e0e0e0);
            }

            .condition-row .type-select {
                flex: 0 0 200px;
            }

            .condition-row .condition-fields {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .condition-row .delete-btn {
                flex: 0 0 auto;
            }

            .add-condition-row {
                margin-top: 8px;
            }

            .inline-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
            }

            .nested-group {
                border: var(--ha-border-width-sm) solid var(--primary-color, #03a9f4);
                border-radius: 8px;
                padding: 8px;
            }

            ha-selector {
                display: block;
            }
        `}willUpdate(e){e.has("value")&&this._parseValue(this.value)}_parseValue(e){if(!e||typeof e!="object"||Object.keys(e).length===0){this._operator="single",this._conditions=[];return}e.all?(this._operator="all",this._conditions=Array.isArray(e.all)?e.all.map(t=>this._deserializeCondition(t)):[]):e.any?(this._operator="any",this._conditions=Array.isArray(e.any)?e.any.map(t=>this._deserializeCondition(t)):[]):(this._operator="single",this._conditions=[this._deserializeCondition(e)])}_deserializeCondition(e){if(!e||typeof e!="object")return{_type:"entity",entity:""};if(e.all)return{_type:"all",all:e.all};if(e.any)return{_type:"any",any:e.any};if(e.not!==void 0)return{_type:"not",not:e.not};if(e.entity_attr!==void 0||e.entity!==void 0&&e.attribute!==void 0){const t=this._detectOperator(e);return{_type:"entity_attr",entity:e.entity_attr||e.entity||"",attribute:e.attribute||"",operator:t.key,value:t.value}}if(e.entity!==void 0){const t=this._detectOperator(e);return{_type:"entity",entity:e.entity||"",operator:t.key,value:t.value}}if(e.condition!==void 0){const t=String(e.condition);return t.includes("[[[")&&t.includes("]]]")?{_type:"javascript",template:t.trim().slice(3,-3).trim()}:{_type:"jinja2",template:t}}if(e.jinja2!==void 0)return{_type:"jinja2",template:e.jinja2};if(e.javascript!==void 0)return{_type:"javascript",template:e.javascript};if(e.time_between!==void 0){const t=String(e.time_between).split("-");return{_type:"time_between",after:t[0]||"",before:t[1]||""}}if(e.weekday_in!==void 0)return{_type:"weekday_in",weekdays:e.weekday_in||[]};if(e.sun_elevation!==void 0){const t=e.sun_elevation||{};return{_type:"sun_elevation",above:t.above,below:t.below,at_least:t.at_least,at_most:t.at_most}}if(e.random_chance!==void 0)return{_type:"random_chance",probability:e.random_chance};if(e.map_range_cond!==void 0){const t=e.map_range_cond||{},{entity:a,input:s,output:i,...r}=t;return{_type:"map_range_cond",entity:a||"",input_min:(s==null?void 0:s[0])??0,input_max:(s==null?void 0:s[1])??100,output_min:(i==null?void 0:i[0])??0,output_max:(i==null?void 0:i[1])??100,_kept:r}}return e._type?e:{_type:"entity",entity:"",operator:"equals",value:""}}_detectOperator(e){for(const[t,{loKey:a,hiKey:s}]of Object.entries(q))if(e[a]!==void 0&&e[s]!==void 0)return{key:t,value:{lo:e[a],hi:e[s]}};for(const t of["equals","not_equals","above","at_least","below","at_most","in","not_in","regex"])if(e[t]!==void 0)return{key:t,value:e[t]};return e.state!==void 0?{key:"equals",value:e.state}:{key:"equals",value:""}}_serializeCondition(e){switch(e._type||this._getConditionType(e)){case"entity":{const a=e.operator||"equals",s=q[a];if(s){const r=e.value||{};return{entity:e.entity||"",[s.loKey]:Number(r.lo??0),[s.hiKey]:Number(r.hi??100)}}const i=e.value!==void 0?e.value:"";return{entity:e.entity||"",[a]:i}}case"entity_attr":{const a=e.operator||"equals",s=q[a];if(s){const r=e.value||{};return{entity:e.entity||"",attribute:e.attribute||"",[s.loKey]:Number(r.lo??0),[s.hiKey]:Number(r.hi??100)}}const i=e.value!==void 0?e.value:"";return{entity:e.entity||"",attribute:e.attribute||"",[a]:i}}case"jinja2":return{condition:e.template||""};case"javascript":return{condition:`[[[ ${(e.template||"").trim()} ]]]`};case"time_between":return{time_between:`${e.after||"00:00"}-${e.before||"23:59"}`};case"weekday_in":return{weekday_in:e.weekdays||[]};case"sun_elevation":{const a={};return e.above!==void 0&&e.above!==""&&(a.above=Number(e.above)),e.at_least!==void 0&&e.at_least!==""&&(a.at_least=Number(e.at_least)),e.below!==void 0&&e.below!==""&&(a.below=Number(e.below)),e.at_most!==void 0&&e.at_most!==""&&(a.at_most=Number(e.at_most)),{sun_elevation:a}}case"random_chance":return{random_chance:e.probability!==void 0?Number(e.probability):.5};case"map_range_cond":return{map_range_cond:{...e._kept||{},entity:e.entity||"",input:[e.input_min??0,e.input_max??100],output:[e.output_min??0,e.output_max??100]}};case"all":return{all:e.all||[]};case"any":return{any:e.any||[]};case"not":return{not:e.not!==void 0?e.not:{}};default:{const{_type:a,...s}=e;return s}}}_emit(){const e=this._conditions.map(a=>this._serializeCondition(a));let t;this._operator==="all"?t=e.length>0?{all:e}:null:this._operator==="any"?t=e.length>0?{any:e}:null:t=e.length>0?e[0]:null,this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:t},bubbles:true,composed:true}))}_handleOperatorChange(e){const t=e.detail.value;t!==this._operator&&(t==="single"&&this._conditions.length>1&&(this._conditions=[this._conditions[0]]),this._operator=t,this._emit())}_handleAddCondition(){const e={_type:"entity",entity:""};this._operator==="single"&&this._conditions.length===0?this._conditions=[e]:this._operator==="single"?(this._operator="all",this._conditions=[...this._conditions,e]):this._conditions=[...this._conditions,e],this._emit()}_handleDeleteCondition(e){const t=[...this._conditions];t.splice(e,1),this._conditions=t,this._emit()}_handleConditionTypeChange(e,t){const a=[...this._conditions],s=a[e],i=this._getConditionType(s);(i==="entity"||i==="entity_attr")&&(t==="entity"||t==="entity_attr")?a[e]={_type:t,entity:s.entity||"",operator:s.operator||"equals",value:s.value}:a[e]={_type:t},this._conditions=a,this._emit()}_handleConditionFieldChange(e,t,a){const s=[...this._conditions];s[e]={...s[e],[t]:a},this._conditions=s,this._emit()}_handleNestedGroupChange(e,t){const a=[...this._conditions],s=a[e]._type||"all",i=t.detail.value;s==="not"?a[e]={_type:"not",not:i}:a[e]={_type:s,...i||{}},this._conditions=a,this._emit()}_getConditionType(e){return e?e._type?e._type:e.all?"all":e.any?"any":e.not?"not":e.entity!==void 0&&e.attribute!==void 0?"entity_attr":e.entity!==void 0?"entity":e.template!==void 0&&e.template_type==="javascript"?"javascript":e.template!==void 0?"jinja2":e.time_range!==void 0||e.after!==void 0?"time_between":e.weekdays!==void 0?"weekday_in":e.sun_elevation!==void 0||e.sun!==void 0?"sun_elevation":e.probability!==void 0?"random_chance":e.datasource!==void 0?"map_range_cond":"entity":"entity"}render(){const e=[{value:"all",label:"ALL (AND)"},{value:"any",label:"ANY (OR)"},{value:"single",label:"Single condition"}];return n`
            <div @value-changed=${t=>t.stopPropagation()}>
                <div class="group-header">
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Operator"}
                        .selector=${{select:{mode:"dropdown",options:e}}}
                        .value=${this._operator}
                        @value-changed=${this._handleOperatorChange}>
                    </ha-selector>
                </div>

                <div class="conditions-list">
                    ${this._conditions.map((t,a)=>this._renderConditionRow(t,a))}
                </div>

                <div class="add-condition-row">
                    <ha-button @click=${this._handleAddCondition}>
                        <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
                        Add Condition
                    </ha-button>
                </div>
            </div>
        `}_renderConditionRow(e,t){const a=this._getConditionType(e);return n`
            <div class="condition-row">
                <div class="type-select">
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Type"}
                        .selector=${{select:{mode:"dropdown",options:ls}}}
                        .value=${a}
                        @value-changed=${s=>this._handleConditionTypeChange(t,s.detail.value)}>
                    </ha-selector>
                </div>
                <div class="condition-fields">
                    ${this._renderConditionFields(e,a,t)}
                </div>
                <ha-icon-button
                    .label=${"Remove condition"}
                    .path=${"M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"}
                    style="color: var(--error-color, #f44336); flex: 0 0 auto; align-self: flex-start; margin-top: 4px;"
                    @click=${()=>this._handleDeleteCondition(t)}>
                </ha-icon-button>
            </div>
        `}_renderConditionFields(e,t,a){const s=u((i,r)=>this._handleConditionFieldChange(a,i,r),"set");switch(t){case"entity":return this._renderEntityFields(e,a,false);case"entity_attr":return this._renderEntityFields(e,a,true);case"jinja2":return n`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Jinja2 Template"}
                        .helper=${"Must evaluate to true/false, e.g. {{ states('sensor.temp') | float > 20 }}"}
                        .selector=${{template:{}}}
                        .value=${e.template||""}
                        @value-changed=${i=>{s("template",i.detail.value),s("_type","jinja2")}}>
                    </ha-selector>
                `;case"javascript":return n`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"JavaScript Template"}
                        .helper=${"Return true/false, e.g. [[[ return states['sensor.temp'].state > 20; ]]]"}
                        .selector=${{text:{multiline:true}}}
                        .value=${e.template||""}
                        @value-changed=${i=>{s("template",i.detail.value),s("template_type","javascript"),s("_type","javascript")}}>
                    </ha-selector>
                `;case"time_between":return n`
                    <div class="inline-grid">
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Start time (HH:MM)"}
                            .selector=${{text:{}}}
                            .value=${e.after||""}
                            @value-changed=${i=>s("after",i.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"End time (HH:MM)"}
                            .selector=${{text:{}}}
                            .value=${e.before||""}
                            @value-changed=${i=>s("before",i.detail.value)}>
                        </ha-selector>
                    </div>
                `;case"weekday_in":return n`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Weekdays"}
                        .selector=${{select:{multiple:true,options:ds.map(i=>({value:i,label:i.charAt(0).toUpperCase()+i.slice(1)}))}}}
                        .value=${e.weekdays||[]}
                        @value-changed=${i=>s("weekdays",i.detail.value)}>
                    </ha-selector>
                `;case"sun_elevation":return n`
                    <div class="inline-grid">
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Above (degrees)"}
                            .selector=${{number:{min:-90,max:90,mode:"box"}}}
                            .value=${e.above??""}
                            @value-changed=${i=>s("above",i.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Below (degrees)"}
                            .selector=${{number:{min:-90,max:90,mode:"box"}}}
                            .value=${e.below??""}
                            @value-changed=${i=>s("below",i.detail.value)}>
                        </ha-selector>
                    </div>
                    <div class="inline-grid">
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"At Least (degrees, ≥)"}
                            .selector=${{number:{min:-90,max:90,mode:"box"}}}
                            .value=${e.at_least??""}
                            @value-changed=${i=>s("at_least",i.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"At Most (degrees, ≤)"}
                            .selector=${{number:{min:-90,max:90,mode:"box"}}}
                            .value=${e.at_most??""}
                            @value-changed=${i=>s("at_most",i.detail.value)}>
                        </ha-selector>
                    </div>
                `;case"random_chance":return n`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Probability (0–1)"}
                        .helper=${"e.g. 0.3 = 30% chance"}
                        .selector=${{number:{min:0,max:1,step:.01,mode:"box"}}}
                        .value=${e.probability??.5}
                        @value-changed=${i=>s("probability",i.detail.value)}>
                    </ha-selector>
                `;case"map_range_cond":return n`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Entity"}
                        .selector=${{entity:{}}}
                        .value=${e.entity||""}
                        @value-changed=${i=>s("entity",i.detail.value)}>
                    </ha-selector>
                    <div class="inline-grid">
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Input Min"}
                            .selector=${{number:{mode:"box"}}}
                            .value=${e.input_min??0}
                            @value-changed=${i=>s("input_min",i.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Input Max"}
                            .selector=${{number:{mode:"box"}}}
                            .value=${e.input_max??100}
                            @value-changed=${i=>s("input_max",i.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Output Min"}
                            .selector=${{number:{mode:"box"}}}
                            .value=${e.output_min??0}
                            @value-changed=${i=>s("output_min",i.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Output Max"}
                            .selector=${{number:{mode:"box"}}}
                            .value=${e.output_max??100}
                            @value-changed=${i=>s("output_max",i.detail.value)}>
                        </ha-selector>
                    </div>
                `;case"all":case"any":{const i=t==="all"?e.all?{all:e.all}:null:e.any?{any:e.any}:null;return n`
                    <div class="nested-group">
                        <lcards-condition-group-editor
                            .hass=${this.hass}
                            .value=${i}
                            @value-changed=${r=>this._handleNestedGroupChange(a,r)}>
                        </lcards-condition-group-editor>
                    </div>
                `}case"not":{const i=e.not||null;return n`
                    <div class="nested-group">
                        <lcards-condition-group-editor
                            .hass=${this.hass}
                            .value=${i}
                            @value-changed=${r=>this._handleConditionFieldChange(a,"not",r.detail.value)}>
                        </lcards-condition-group-editor>
                    </div>
                `}default:return n`<div>Unknown condition type: ${t}</div>`}}_getAttributeOptions(e){var t,a;return!e||!((a=(t=this.hass)==null?void 0:t.states)!=null&&a[e])?[]:Object.keys(this.hass.states[e].attributes||{}).map(s=>({value:s,label:s}))}_renderEntityFields(e,t,a){var r,l;const s=u((c,d)=>this._handleConditionFieldChange(t,c,d),"set"),i=a?this._getAttributeOptions(e.entity):[];return n`
            <ha-selector
                .hass=${this.hass}
                .label=${"Entity"}
                .selector=${{entity:{}}}
                .value=${e.entity||""}
                @value-changed=${c=>s("entity",c.detail.value)}>
            </ha-selector>
            ${a?n`
                ${i.length>0?n`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Attribute"}
                            .selector=${{select:{mode:"dropdown",custom_value:true,options:i}}}
                            .value=${e.attribute||""}
                            @value-changed=${c=>s("attribute",c.detail.value)}>
                        </ha-selector>`:n`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Attribute"}
                            .helper=${"Select an entity first to see available attributes"}
                            .selector=${{text:{}}}
                            .value=${e.attribute||""}
                            @value-changed=${c=>s("attribute",c.detail.value)}>
                        </ha-selector>`}
            `:""}
            <ha-selector
                .hass=${this.hass}
                .label=${"Operator"}
                .selector=${{select:{mode:"dropdown",options:cs}}}
                .value=${e.operator||"equals"}
                @value-changed=${c=>s("operator",c.detail.value)}>
            </ha-selector>
            ${q[e.operator]?n`
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Min"}
                    .selector=${{text:{}}}
                    .value=${((r=e.value)==null?void 0:r.lo)!==void 0?String(e.value.lo):""}
                    @value-changed=${c=>s("value",{...e.value||{},lo:c.detail.value})}>
                </ha-selector>
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Max"}
                    .selector=${{text:{}}}
                    .value=${((l=e.value)==null?void 0:l.hi)!==void 0?String(e.value.hi):""}
                    @value-changed=${c=>s("value",{...e.value||{},hi:c.detail.value})}>
                </ha-selector>
            `:n`
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Value"}
                    .selector=${{text:{}}}
                    .value=${e.value!==void 0?String(e.value):e.state!==void 0?String(e.state):""}
                    @value-changed=${c=>s("value",c.detail.value)}>
                </ha-selector>
            `}
        `}};u(rt,"LCARdSConditionGroupEditor");let Se=rt;customElements.get("lcards-condition-group-editor")||customElements.define("lcards-condition-group-editor",Se);const hs=new Set(["type","id","tags","rules","data_sources","grid_options","view_layout","visibility"]);function Te(o){if(Array.isArray(o))return o.map(Te);if(!o||typeof o!="object")return o;const e={};for(const[t,a]of Object.entries(o))t==="required"&&Array.isArray(a)||(e[t]=Te(a));return e}u(Te,"withoutRequired");function us(o,e){if(!(o!=null&&o.properties))return{type:"object",description:e,additionalProperties:true};const t=Object.fromEntries(Object.entries(o.properties).filter(([a])=>!hs.has(a)));return{type:"object",description:e,properties:Te(t),additionalProperties:true}}u(us,"patchSchema");function qt({overlays:o=[],card:e={},getCardSchema:t=u(()=>null,"getCardSchema")}={}){const a=Pt.items.properties.apply,s=new Map(o.filter(p=>p==null?void 0:p.id).map(p=>[p.id,p]));e.id&&!s.has(e.id)&&s.set(e.id,{id:e.id,type:e.type});const i=new Map,r=u(p=>{const f=p||"unknown";return i.has(f)||i.set(f,t(f)),i.get(f)},"patchFor"),l={};for(const{id:p,type:f}of s.values()){const b=f&&f!=="unknown"?`${f} card`:"overlay";l[p]=us(r(f),`Changes to ${p} (${b}) while the rule matches`)}l.all={type:"object",description:"Changes to every overlay on the page (minus exclude)",additionalProperties:true},l.exclude={type:"array",items:{type:"string",enum:[...s.keys()]},description:"Overlay IDs the all/type:/tag:/pattern: selectors skip"};const c=[...new Set(o.flatMap(p=>p.tags??[]))],d=[...s.keys()],h=a.properties.animations.items;return{...a,properties:{...a.properties,overlays:{...a.properties.overlays,description:"What to change, per overlay ID, or per selector: type:<card type>, tag:<tag>, pattern:<regex>",properties:l,additionalProperties:{type:"object",description:"Changes for a type:, tag: or pattern: selector",additionalProperties:true}},animations:{...a.properties.animations,items:{...h,properties:{...h.properties,overlay:{...h.properties.overlay,...d.length?{examples:d}:{}},tag:{...h.properties.tag,...c.length?{examples:c}:{}}}}}}}}u(qt,"ruleApplySchema");function ps(o){const e=Pt.items;return{...e,properties:{...e.properties,apply:qt(o)}}}u(ps,"ruleSchema");const Fe=u(o=>String((o==null?void 0:o.type)??"").replace(/^custom:lcards-/,""),"cardTypeOf");function Jt(o){var s,i,r;const e=(s=window.lcards)==null?void 0:s.core,t=(o==null?void 0:o.config)??{};let a=[];try{a=((r=(i=e==null?void 0:e.systemsManager)==null?void 0:i.getAllTargetableOverlays)==null?void 0:r.call(i))??[]}catch{}return{overlays:a,card:{id:t.id,type:Fe(t)},getCardSchema:u(l=>{var c,d;return((d=(c=e==null?void 0:e.configManager)==null?void 0:c.getCardSchema)==null?void 0:d.call(c,l))??null},"getCardSchema")}}u(Jt,"pageSchemaOptions");const ot=class ot2 extends S{static get properties(){return{value:{type:Object},hass:{type:Object},editor:{type:Object},_yamlText:{type:String,state:true},_yamlError:{type:String,state:true},_refExpanded:{type:Boolean,state:true}}}constructor(){super(),this.hass=void 0,this.editor=void 0,this.value={},this._yamlText="",this._yamlError="",this._refExpanded=false,this._emitted=null,this._schema=null}static get styles(){return[T,w`
            :host { display: block; }

            .yaml-error {
                color: var(--error-color);
                font-size: 12px;
                margin-top: var(--ha-space-1);
            }

            .table-wrapper {
                overflow-x: auto;
            }

            .ref-table {
                min-width: 100%;
                width: max-content;
                border-collapse: collapse;
                font-size: 13px;
            }

            .ref-table th {
                padding: var(--ha-space-2) var(--ha-space-3);
                text-align: left;
                font-weight: 600;
                font-size: 12px;
                color: var(--secondary-text-color);
                border-bottom: var(--ha-border-width-md) solid var(--divider-color);
                white-space: nowrap;
            }

            .ref-table td {
                padding: var(--ha-space-1) var(--ha-space-3);
                border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
                white-space: nowrap;
                color: var(--secondary-text-color);
            }

            .ref-table tr:last-child td {
                border-bottom: none;
            }

            .ref-table tbody tr:hover {
                background: color-mix(in srgb, var(--primary-text-color) 6%, transparent);
            }

            .ref-id {
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
                font-weight: 600;
                color: var(--primary-text-color);
            }

            .ref-table ha-icon-button {
                --ha-icon-button-size: 28px;
                --mdc-icon-size: 16px;
            }

            .ref-empty {
                margin: 0;
            }

            .starter {
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: var(--ha-space-2);
                margin-bottom: var(--ha-space-2);
            }

            .selectors {
                margin: var(--ha-space-2) 0 0;
            }

            .selectors code {
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
            }
        `]}willUpdate(e){e.has("value")&&this.value!==this._emitted&&this._syncFromValue()}connectedCallback(){super.connectedCallback(),this._schema=null}_syncFromValue(){try{const e=this.value||{};this._yamlText=Object.keys(e).length?M(e):"",this._yamlError=""}catch(e){this._yamlError=String(e)}}_getDiscoverableOverlays(){var e,t,a;try{return((a=(t=(e=window.lcards)==null?void 0:e.core)==null?void 0:t.systemsManager)==null?void 0:a.getAllTargetableOverlays())||[]}catch{return[]}}_getSchema(){return this._schema||(this._schema=qt(Jt(this.editor))),this._schema}flush(){var e,t,a;(a=(t=(e=this.renderRoot)==null?void 0:e.querySelector("lcards-yaml-editor"))==null?void 0:t.flush)==null||a.call(t)}_emit(e){this._emitted=e,this.value=e,this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:e},bubbles:true,composed:true}))}_handleYamlChange(e){e.stopPropagation();const t=e.detail.value;this._yamlText=t;try{const a=t.trim()?K(t):{};this._yamlError="",this._emit(a||{})}catch(a){this._yamlError=`YAML error: ${a.message}`}}async _startWithCard(){var a;const e=((a=this.editor)==null?void 0:a.config)??{};let t=e.id;if(!t){const s=new Set(this._getDiscoverableOverlays().map(l=>l.id)),i=String(e.entity??"").split(".")[1]||Fe(e).replace(/-/g,"_")||"card";let r=i;for(let l=2;s.has(r);l++)r=`${i}_${l}`;if(t=await da({title:"Give this card an id",message:"Rules target cards by id. This card has none, so it gets a new random one on every page load.",label:"Card ID",value:r,confirmText:"Set id"}),!t)return;if(!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(t)){this._yamlError="A card id starts with a letter or _, then letters, digits, _ or -.";return}this.editor._updateConfig({id:t}),this._schema=null}this._yamlError="",this._yamlText=`overlays:
  ${t}:
    `}render(){var t,a;const e=(a=(t=this.editor)==null?void 0:t.config)==null?void 0:a.id;return n`
            ${this._yamlText.trim()?"":n`
                <div class="starter">
                    <span class="hint">Type an overlay ID, or start with this card. Ctrl+Space lists what can go next.</span>
                    <ha-button appearance="outlined" variant="brand" size="s" @click=${()=>this._startWithCard()}>
                        <ha-icon icon="mdi:target" slot="start"></ha-icon>
                        ${e?`Start with ${e}`:"Start with this card"}
                    </ha-button>
                </div>
            `}
            <lcards-yaml-editor
                .hass=${this.hass}
                .schema=${this._getSchema()}
                .value=${this._yamlText}
                @value-changed=${this._handleYamlChange}>
            </lcards-yaml-editor>
            ${this._yamlError?n`<div class="yaml-error">${this._yamlError}</div>`:""}

            <lcards-form-section
                header="Targets on this page"
                description="Overlay IDs, card types and tags you can change"
                icon="mdi:layers-search"
                ?expanded=${this._refExpanded}
                ?outlined=${false}
                @expanded-changed=${s=>this._refExpanded=s.detail.expanded}>
                ${this._renderOverlayReference()}
            </lcards-form-section>
        `}_renderOverlayReference(){const e=this._getDiscoverableOverlays();return e.length===0?n`<p class="hint ref-empty">No targets on this page yet: cards register when they render.</p>`:n`
            <div class="table-wrapper"><table class="ref-table">
                <thead>
                    <tr><th>ID</th><th>Type</th><th>Tags</th><th></th></tr>
                </thead>
                <tbody>
                    ${e.map(t=>{var a;return n`
                        <tr>
                            <td class="ref-id">${t.id}</td>
                            <td>${t.type||"-"}</td>
                            <td>${(a=t.tags)!=null&&a.length?t.tags.join(", "):"-"}</td>
                            <td>
                                <ha-icon-button .label=${"Copy ID"} title="Copy ID" @click=${()=>E(t.id)}>
                                    <ha-icon icon="mdi:content-copy"></ha-icon>
                                </ha-icon-button>
                            </td>
                        </tr>
                    `})}
                </tbody>
            </table></div>
            <p class="hint selectors">
                Selectors: <code>all</code>, <code>type:button</code>, <code>tag:name</code>,
                <code>pattern:regex</code>; <code>exclude: [id]</code> skips IDs.
            </p>
        `}};u(ot,"LCARdSRuleApplyEditor");let Ae=ot;customElements.get("lcards-rule-apply-editor")||customElements.define("lcards-rule-apply-editor",Ae);const nt=class nt2 extends S{static get properties(){return{hass:{type:Object},mode:{type:String},rule:{type:Object},open:{type:Boolean},editor:{type:Object},_ruleId:{type:String,state:true},_ruleName:{type:String,state:true},_priority:{type:Number,state:true},_enabled:{type:Boolean,state:true},_stop:{type:Boolean,state:true},_when:{type:Object,state:true},_apply:{type:Object,state:true},_errors:{type:Object,state:true},_applyWarning:{type:Boolean,state:true}}}constructor(){super(),this.editor=void 0,this.hass=void 0,this.mode="add",this.open=false,this.rule=null,this._resetForm()}static get styles(){return w`
            :host { display: block; }

            ha-dialog {
                --ha-dialog-width-md: min(900px, 95vw);
            }

            .form-content {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-4);
                padding: var(--ha-space-2) 0;
                --lcards-section-spacing: 0;
            }

            ha-selector {
                display: block;
                margin-bottom: var(--ha-space-3);
            }

            .identity-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: var(--ha-space-3);
                align-items: start;
            }

            .identity-right {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: var(--ha-space-3);
                align-items: start;
            }

            .error-text {
                color: var(--error-color);
                font-size: 12px;
                margin-top: calc(-1 * var(--ha-space-2));
                margin-bottom: var(--ha-space-1);
            }

            lcards-message {
                display: block;
                margin-bottom: var(--ha-space-2);
            }

            @media (max-width: 600px) {
                .identity-grid {
                    grid-template-columns: 1fr;
                }
                .identity-right {
                    grid-template-columns: 1fr;
                }
            }
        `}_resetForm(){const e=this.rule||{};this._ruleId=e.id||"",this._ruleName=e.name||"",this._priority=e.priority!==void 0?e.priority:0,this._enabled=e.enabled!==false,this._stop=e.stop===true,this._when=e.when||null,this._apply=e.apply||{},this._errors={},this._applyWarning=false}willUpdate(e){e.has("open")&&this.open&&this._resetForm()}_validateId(e=false){var s,i;const t=this._ruleId?this._ruleId.trim():"";let a=null;if(t?/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(t)?this.mode==="add"&&(((i=(s=this.editor)==null?void 0:s.config)==null?void 0:i.rules)||[]).some(l=>l.id===t)&&(a=`A rule with id "${t}" already exists`):a="ID must start with a letter or _, then letters/digits/_ or -":a="Rule ID is required",!e)if(a)this._errors={...this._errors,id:a};else{const r={...this._errors};delete r.id,this._errors=r}return a===null}_isValid(){return this._validateId(true)}_handleSave(){var s,i;if((i=(s=this.renderRoot.querySelector("lcards-rule-apply-editor"))==null?void 0:s.flush)==null||i.call(s),!this._validateId())return;const e={id:this._ruleId.trim(),name:this._ruleName||void 0,priority:this._priority,enabled:this._enabled,stop:this._stop,when:this._when||void 0,apply:this._apply||{}},t=Object.fromEntries(Object.entries(e).filter(([,r])=>r!==void 0));if(!(t.apply&&(Object.keys(t.apply.overlays||{}).length>0||t.apply.tags&&t.apply.tags.length>0||t.apply.animations&&t.apply.animations.length>0||!!t.apply.base_svg))&&!this._applyWarning){$.warn("[RuleEditorDialog] Apply section is empty — showing warning before save:",t.id),this._applyWarning=true;return}$.debug("[RuleEditorDialog] Saving rule:",t.id),this.dispatchEvent(new CustomEvent("save",{detail:{rule:t},bubbles:true,composed:true}))}_handleCancel(){this.dispatchEvent(new CustomEvent("cancel",{bubbles:true,composed:true}))}_handleDialogClosed(e){e.stopPropagation(),e.target===e.currentTarget&&this._handleCancel()}_ignoreKeydown(e){e.key.length===1&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&e.stopPropagation()}render(){var e;return this.open?n`
            <ha-dialog
                open
                prevent-scrim-close
                header-title=${this.mode==="add"?"Add Rule":`Edit Rule: ${((e=this.rule)==null?void 0:e.id)||""}`}
                @closed=${this._handleDialogClosed}>

                <div @keydown=${this._ignoreKeydown}>
                    ${this._renderForm()}
                </div>

                <ha-dialog-footer slot="footer">
                    <ha-button slot="secondaryAction" appearance="plain" @click=${this._handleCancel}>Cancel</ha-button>
                    <ha-button slot="primaryAction"
                        variant="brand"
                        @click=${this._handleSave}
                        ?disabled=${!this._isValid()}>
                        <ha-icon icon="mdi:check" slot="start"></ha-icon>
                        ${this.mode==="add"?"Create rule":"Save rule"}
                    </ha-button>
                </ha-dialog-footer>
            </ha-dialog>
        `:n``}_renderForm(){return n`
            <div class="form-content">

                <!-- Rule Identity -->
                <lcards-form-section
                    header="Rule Identity"
                    icon="mdi:identifier"
                    ?expanded=${true}
                    ?outlined=${false}>

                    <!-- ID + Name row -->
                    <div class="identity-grid">
                        <div>
                            <ha-selector
                                ?autofocus=${this.mode!=="edit"}
                                .hass=${this.hass}
                                .label=${"Rule ID"}
                                .required=${true}
                                .helper=${"Unique identifier: letters, digits, _ or - (must start with letter or _)"}
                                .selector=${{text:{}}}
                                .value=${this._ruleId}
                                .disabled=${this.mode==="edit"}
                                @value-changed=${e=>{this._ruleId=e.detail.value,this._validateId()}}>
                            </ha-selector>
                            ${this._errors.id?n`<div class="error-text">${this._errors.id}</div>`:""}
                        </div>
                        <div>
                            <ha-selector
                                .hass=${this.hass}
                                .label=${"Name (optional)"}
                                .required=${false}
                                .helper=${"Human-readable label for this rule"}
                                .selector=${{text:{}}}
                                .value=${this._ruleName}
                                @value-changed=${e=>this._ruleName=e.detail.value}>
                            </ha-selector>
                        </div>
                    </div>

                    <!-- Priority + Enabled + Stop row -->
                    <div class="identity-right">
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Priority"}
                            .required=${false}
                            .helper=${"Higher values execute first (0–1000)"}
                            .selector=${{number:{min:0,max:1e3,mode:"box"}}}
                            .value=${this._priority}
                            @value-changed=${e=>this._priority=e.detail.value}>
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Enabled"}
                            .helper=${"Disable to temporarily skip this rule"}
                            .selector=${{boolean:{}}}
                            .value=${this._enabled}
                            @value-changed=${e=>this._enabled=e.detail.value}>
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Stop Processing"}
                            .helper=${"When true, lower-priority rules will not be evaluated after this one matches"}
                            .selector=${{boolean:{}}}
                            .value=${this._stop}
                            @value-changed=${e=>this._stop=e.detail.value}>
                        </ha-selector>
                    </div>
                </lcards-form-section>

                <!-- Conditions (when) -->
                <lcards-form-section
                    header="Conditions"
                    description="Rule fires when these conditions are met. Leave empty to always apply."
                    icon="mdi:filter"
                    ?expanded=${true}
                    ?outlined=${false}>

                    <lcards-condition-group-editor
                        .hass=${this.hass}
                        .value=${this._when}
                        @value-changed=${e=>this._when=e.detail.value}>
                    </lcards-condition-group-editor>
                </lcards-form-section>

                <!-- Apply -->
                <lcards-form-section
                    header="Apply"
                    description="What to change while the rule matches: an overlay ID (or selector) and its changes, as YAML."
                    icon="mdi:magic-staff"
                    ?expanded=${true}
                    ?outlined=${false}>

                    ${this._applyWarning?n`
                        <lcards-message type="warning">
                            Apply is empty: the rule will match but change nothing. Add at least one target.
                        </lcards-message>
                    `:""}

                    <lcards-rule-apply-editor
                        .hass=${this.hass}
                        .editor=${this.editor}
                        .value=${this._apply}
                        @value-changed=${e=>{this._apply=e.detail.value,this._applyWarning=false}}>
                    </lcards-rule-apply-editor>
                </lcards-form-section>

            </div>
        `}};u(nt,"LCARdSRuleEditorDialog");let Oe=nt;customElements.get("lcards-rule-editor-dialog")||customElements.define("lcards-rule-editor-dialog",Oe);const fs=N(I.rules),ms={new:"New: applies when you save",changed:"Changed: applies when you save",removed:"Removed: applies when you save"};function gs(o,e){const t=u(a=>Array.isArray(a)?a.map(t):a&&typeof a=="object"?Object.fromEntries(Object.keys(a).filter(s=>!s.startsWith("_")).sort().map(s=>[s,t(a[s])])):a,"canon");return JSON.stringify(t(o))===JSON.stringify(t(e))}u(gs,"sameRule");const vs=[["id","Rule"],["priority","Priority"],["enabled","Status"],["source","Source card"],["target","Target"],[null,"Conditions"],["actions","Changes"]],lt=class lt2 extends S{static get properties(){return{editor:{type:Object},cardId:{type:String},hass:{type:Object},_rules:{type:Array,state:true},_sortColumn:{type:String,state:true},_sortDirection:{type:String,state:true},_previewDialogOpen:{type:Boolean,state:true},_previewRule:{type:Object,state:true},_previewEditable:{type:Boolean,state:true},_previewError:{type:String,state:true},_editDialogOpen:{type:Boolean,state:true},_editingRule:{type:Object,state:true},_editMode:{type:String,state:true}}}constructor(){super(),this.editor=void 0,this.hass=void 0,this._rules=[],this._sortColumn="id",this._sortDirection="asc",this.cardId="",this._previewDialogOpen=false,this._previewRule=null,this._previewEditable=false,this._previewError="",this._refreshTimer=null,this._editDialogOpen=false,this._editingRule=null,this._editMode="add"}static get styles(){return[T,W,w`
            :host {
                display: block;
                padding: var(--ha-space-4) 0;
            }

            .rules-dashboard {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-3);
                --lcards-section-spacing: 0;
            }

            .empty {
                margin: 0;
            }

            /* The table on the black inset, so rows read clearly on any card background */
            .table-wrapper {
                overflow-x: auto;
                background: var(--primary-background-color);
                border-radius: var(--ha-border-radius-lg);
                padding: var(--ha-space-2) var(--ha-space-3);
            }

            .pending {
                margin-top: 2px;
                font-size: 12px;
                color: var(--warning-color);
            }

            ha-dialog.rule-details {
                --ha-dialog-width-md: min(900px, 95vw);
            }

            .rules-table {
                min-width: 100%;
                width: max-content;
                border-collapse: collapse;
                font-size: 13px;
            }

            .rules-table th {
                padding: var(--ha-space-2) var(--ha-space-3);
                text-align: left;
                font-weight: 600;
                font-size: 12px;
                color: var(--secondary-text-color);
                border-bottom: var(--ha-border-width-md) solid var(--divider-color);
                white-space: nowrap;
            }

            .rules-table th.sortable {
                cursor: pointer;
                user-select: none;
            }

            .rules-table th.sortable:hover,
            .rules-table th.sorted {
                color: var(--primary-text-color);
            }

            .rules-table th ha-icon {
                --mdc-icon-size: 14px;
                margin-left: var(--ha-space-1);
                opacity: 0.5;
            }

            .rules-table th.sorted ha-icon {
                opacity: 1;
            }

            .rules-table td {
                padding: var(--ha-space-2) var(--ha-space-3);
                border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
                white-space: nowrap;
                color: var(--primary-text-color);
            }

            .rules-table tr:last-child td {
                border-bottom: none;
            }

            .rules-table tbody tr:hover {
                background: color-mix(in srgb, var(--primary-text-color) 6%, transparent);
            }

            .rules-table tr.highlight {
                background: color-mix(in srgb, var(--primary-color) 12%, transparent);
                box-shadow: inset var(--ha-border-width-lg) 0 0 var(--primary-color);
            }

            .mono {
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
            }

            .rule-id {
                font-weight: 600;
            }

            .sub {
                font-size: 12px;
                color: var(--secondary-text-color);
            }

            .muted {
                color: var(--secondary-text-color);
            }

            .status {
                display: inline-flex;
                align-items: center;
                gap: var(--ha-space-1);
            }

            .status-dot {
                width: 8px;
                height: 8px;
                border-radius: var(--ha-border-radius-circle);
                background: var(--error-color);
            }

            .status-dot.enabled {
                background: var(--success-color);
            }

            .stop-icon {
                --mdc-icon-size: 16px;
                color: var(--warning-color);
                vertical-align: middle;
                margin-left: var(--ha-space-1);
            }

            .row-actions {
                display: flex;
                align-items: center;
                justify-content: flex-end;
                --ha-icon-button-size: 32px;
                --mdc-icon-size: 18px;
                color: var(--primary-color);
            }

            .row-actions .danger {
                color: var(--error-color);
            }

            /* Rule details dialog */
            .details {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-3);
            }

            .details-inset {
                background: var(--primary-background-color);
                border-radius: var(--ha-border-radius-lg);
                padding: var(--ha-space-2) var(--ha-space-4);
            }

            .info-row {
                display: flex;
                justify-content: space-between;
                gap: var(--ha-space-4);
                padding: 6px 0;
                border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
            }

            .info-row:last-child {
                border-bottom: none;
            }

            .info-row .label {
                font-weight: 500;
                color: var(--secondary-text-color);
            }

            .info-row .value {
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
                text-align: right;
                overflow-wrap: anywhere;
            }

            .details ha-code-editor {
                --code-mirror-max-height: 40vh;
            }
        `]}connectedCallback(){super.connectedCallback(),this._loadRules()}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this._refreshTimer??void 0)}willUpdate(){this._loadRules()}_loadRules(){var t,a;const e=(a=(t=window.lcards)==null?void 0:t.core)==null?void 0:a.rulesManager;e&&typeof e.getAllRules=="function"?this._rules=[...e.getAllRules()||[]]:($.warn("⚠️ [RulesDashboard] RulesManager not available or getAllRules not implemented"),this._rules=[])}_rows(){var r;const e=((r=this.editor)==null?void 0:r.config)??{},t=e.rules||[],a=new Set(t.map(l=>l.id)),s=new Map(this._rules.map(l=>[l.id,l])),i=[];for(const l of this._rules){if(a.has(l.id))continue;const c=this.cardId&&l._sourceCardId===this.cardId;i.push(c?{...l,_pending:"removed"}:l)}for(const l of t){const c=s.get(l.id);i.push({...l,_sourceCardId:(c==null?void 0:c._sourceCardId)??(this.cardId||"this card"),_sourceCardType:(c==null?void 0:c._sourceCardType)??`lcards-${Fe(e)}`,_pending:c?gs(c,l)?void 0:"changed":"new"})}return i}_isTargetingCard(e,t){return!e||!t?false:e.target===t||e.cardId===t||Array.isArray(e.target)&&e.target.includes(t)?true:e.tags&&Array.isArray(e.tags)?false:!!(e.apply&&e.apply.overlays&&Object.keys(e.apply.overlays).includes(t))}_isOwnedRule(e){var a,s;return e._pending==="removed"?false:(((s=(a=this.editor)==null?void 0:a.config)==null?void 0:s.rules)||[]).some(i=>i.id===e.id)}_handleAddRule(){this._editingRule=null,this._editMode="add",this._editDialogOpen=true}_handleEditRule(e){this._editingRule=typeof globalThis.structuredClone=="function"?globalThis.structuredClone(e):JSON.parse(JSON.stringify(e)),this._editMode="edit",this._editDialogOpen=true}async _handleDeleteRule(e){var s,i;if(!await Ie({title:`Delete ${e.id}?`,message:"It's removed from this card's config. Cards keep its effect until you save the card."}))return;const a=((i=(s=this.editor)==null?void 0:s.config)==null?void 0:i.rules)||[];this._applyRulesChange(a.filter(r=>r.id!==e.id))}_handleToggleRule(e){var s,i;const a=(((i=(s=this.editor)==null?void 0:s.config)==null?void 0:i.rules)||[]).map(r=>r.id===e.id?{...r,enabled:r.enabled===false}:r);this._applyRulesChange(a)}_handleMoveUp(e){var s,i;const t=[...((i=(s=this.editor)==null?void 0:s.config)==null?void 0:i.rules)||[]],a=t.findIndex(r=>r.id===e.id);a<=0||([t[a-1],t[a]]=[t[a],t[a-1]],this._applyRulesChange(t))}_handleMoveDown(e){var s,i;const t=[...((i=(s=this.editor)==null?void 0:s.config)==null?void 0:i.rules)||[]],a=t.findIndex(r=>r.id===e.id);a<0||a>=t.length-1||([t[a],t[a+1]]=[t[a+1],t[a]],this._applyRulesChange(t))}_handleRuleSave(e){var s,i;const t=e.detail.rule,a=[...((i=(s=this.editor)==null?void 0:s.config)==null?void 0:i.rules)||[]];if(this._editMode==="add")a.push(t);else{const r=a.findIndex(l=>l.id===t.id);r>=0?a[r]=t:a.push(t)}this._applyRulesChange(a),this._editDialogOpen=false,this._editingRule=null}_handleRuleDialogClose(){this._editDialogOpen=false,this._editingRule=null}_applyRulesChange(e){this.editor&&(this.editor.config={...this.editor.config,rules:e},D(this.editor,"config-changed",{config:this.editor.config}),this.requestUpdate(),clearTimeout(this._refreshTimer??void 0),this._refreshTimer=setTimeout(()=>this.requestUpdate(),1e3))}_handleSort(e){this._sortColumn===e?this._sortDirection=this._sortDirection==="asc"?"desc":"asc":(this._sortColumn=e,this._sortDirection="asc"),this.requestUpdate()}_getSortedRules(e){const t=[...e],a=this._sortColumn,s=this._sortDirection;return t.sort((i,r)=>{let l,c;switch(a){case"id":l=i.id||"",c=r.id||"";break;case"type":l=i.type||"overlay",c=r.type||"overlay";break;case"priority":l=i.priority||0,c=r.priority||0;break;case"enabled":l=i.enabled!==false?1:0,c=r.enabled!==false?1:0;break;case"target":l=this._getRuleTargets(i),c=this._getRuleTargets(r);break;case"source":l=this._getSourceCard(i),c=this._getSourceCard(r);break;case"actions":l=this._getActionsCount(i),c=this._getActionsCount(r);break;default:return 0}return l<c?s==="asc"?-1:1:l>c?s==="asc"?1:-1:0}),t}_getConditionSummary(e){const t=e.when||e.conditions;if(!t)return"No conditions";const a=t.all?"all":t.any?"any":t.not?"not":null;if(a){const s=t[a],i=Array.isArray(s)?s.length:0;return`${a.toUpperCase()} (${i} condition${i!==1?"s":""})`}if(t.entity){let s=`entity: ${t.entity}`;return t.state&&(s+=`, state: ${t.state}`),t.above!==void 0&&(s+=`, above: ${t.above}`),t.below!==void 0&&(s+=`, below: ${t.below}`),s}return"Custom condition"}_getRuleTargets(e){if(e.target)return Array.isArray(e.target)?e.target.join(", "):e.target;if(e.apply&&e.apply.overlays){const t=Object.keys(e.apply.overlays);if(t.length>0)return t.join(", ")}return"Global"}_getActionsCount(e){if(e.actions&&Array.isArray(e.actions))return e.actions.length;if(e.apply){let t=0;return e.apply.overlays&&(t+=Object.keys(e.apply.overlays).length),e.apply.animations&&(t+=e.apply.animations.length),e.apply.base_svg&&(t+=1),t}return 0}_getSourceCard(e){if(e._sourceCardId)return e._sourceCardId;const t=this._getRuleTargets(e);return t&&t!=="Global"?t.split(", ")[0]:"Unknown"}_getSourceCardType(e){return e._sourceCardType||"unknown"}_ruleYaml(e){const t=Object.fromEntries(Object.entries(e).filter(([a])=>!a.startsWith("_")));return M([t])}_handleCopyYAML(e){E(this._ruleYaml(e)).then(t=>{t&&$.info("[RulesDashboard] Copied rule YAML to clipboard:",e.id)})}_handlePreview(e,t=false){this._previewRule=e,this._previewEditable=t,this._previewError="",this._previewDialogOpen=true}_closePreviewDialog(){this._previewDialogOpen=false,this._previewRule=null,this._previewError=""}_savePreviewYaml(){var i,r,l;const e=this.renderRoot.querySelector("ha-dialog.rule-details lcards-yaml-editor");(i=e==null?void 0:e.flush)==null||i.call(e);let t;try{t=K((e==null?void 0:e.value)??"")}catch(c){this._previewError=`YAML error: ${c.message}`;return}if(Array.isArray(t)&&(t=t[0]),!t||typeof t!="object"||typeof t.id!="string"||!t.id.trim()){this._previewError="A rule needs an id.";return}const a=[...((l=(r=this.editor)==null?void 0:r.config)==null?void 0:l.rules)||[]],s=a.findIndex(c=>c.id===this._previewRule.id);if(t.id!==this._previewRule.id&&a.some(c=>c.id===t.id)){this._previewError=`This card already has a rule with id ${t.id}.`;return}s>=0?a[s]=t:a.push(t),this._applyRulesChange(a),this._closePreviewDialog()}_renderRulesTable(e,t=false){const a=this._getSortedRules(e),s=u(i=>this._sortColumn!==i?"mdi:swap-vertical":this._sortDirection==="asc"?"mdi:arrow-up":"mdi:arrow-down","sortIcon");return n`
            <div class="table-wrapper">
                <table class="rules-table">
                    <thead>
                        <tr>
                            ${vs.map(([i,r])=>i?n`
                                <th class="sortable ${this._sortColumn===i?"sorted":""}"
                                    @click=${()=>this._handleSort(i)}>
                                    ${r}<ha-icon icon=${s(i)}></ha-icon>
                                </th>
                            `:n`<th>${r}</th>`)}
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${a.map(i=>{const r=i.enabled!==false,l=this._getActionsCount(i);return n`
                                <tr class=${t&&this._isTargetingCard(i,this.cardId)?"highlight":""}>
                                    <td class="mono rule-id">${i.id||"-"}</td>
                                    <td class="mono">
                                        ${i.priority??0}
                                        ${i.stop===true?n`<ha-icon class="stop-icon" icon="mdi:octagon" title="Stops lower-priority rules"></ha-icon>`:v}
                                    </td>
                                    <td>
                                        <span class="status">
                                            <span class="status-dot ${r?"enabled":""}"></span>
                                            ${r?"Enabled":"Disabled"}
                                        </span>
                                        ${i._pending?n`<div class="pending">${ms[i._pending]}</div>`:v}
                                    </td>
                                    <td>
                                        <div class="mono">${this._getSourceCard(i)}</div>
                                        <div class="sub">${this._getSourceCardType(i)}</div>
                                    </td>
                                    <td class="mono muted">${this._getRuleTargets(i)}</td>
                                    <td class="muted">${this._getConditionSummary(i)}</td>
                                    <td>${l}</td>
                                    <td>${this._renderRowActions(i,r)}</td>
                                </tr>
                            `})}
                    </tbody>
                </table>
            </div>
        `}_renderRowActions(e,t){const a=u((s,i,r,l="")=>n`
            <ha-icon-button class=${l} .label=${s} title=${s} @click=${r}>
                <ha-icon icon=${i}></ha-icon>
            </ha-icon-button>
        `,"button");return n`
            <div class="row-actions">
                ${this._isOwnedRule(e)?a("Edit as YAML","mdi:code-braces",()=>this._handlePreview(e,true)):a("View rule","mdi:eye",()=>this._handlePreview(e))}
                ${a("Copy rule YAML","mdi:content-copy",()=>this._handleCopyYAML(e))}
                ${this._isOwnedRule(e)?n`
                    ${a("Edit rule","mdi:pencil",()=>this._handleEditRule(e))}
                    ${a(t?"Disable rule":"Enable rule",t?"mdi:toggle-switch":"mdi:toggle-switch-off",()=>this._handleToggleRule(e))}
                    ${a("Move up","mdi:arrow-up",()=>this._handleMoveUp(e))}
                    ${a("Move down","mdi:arrow-down",()=>this._handleMoveDown(e))}
                    ${a("Delete rule","mdi:delete",()=>this._handleDeleteRule(e),"danger")}
                `:v}
            </div>
        `}_renderPreviewDialog(){if(!this._previewRule)return v;const e=this._previewRule,t=this._previewEditable,a=this._getActionsCount(e),s=Object.fromEntries(Object.entries(e).filter(([r])=>!r.startsWith("_"))),i=[["Source card",`${this._getSourceCard(e)} (${this._getSourceCardType(e)})`],["Target",this._getRuleTargets(e)],["Conditions",this._getConditionSummary(e)],["Changes",`${a} change${a!==1?"s":""}`]];return n`
            <ha-dialog
                class="rule-details"
                .open=${this._previewDialogOpen}
                ?prevent-scrim-close=${t}
                @closed=${r=>{r.stopPropagation(),r.target===r.currentTarget&&this._closePreviewDialog()}}
                header-title=${t?`Edit ${e.id} as YAML`:e.id||"Rule"}>
                <div class="details">
                    <div class="details-inset">
                        ${i.map(([r,l])=>n`
                            <div class="info-row"><span class="label">${r}</span><span class="value">${l}</span></div>
                        `)}
                    </div>
                    ${t?n`<p class="hint">The whole rule: id, when, apply, priority, ... Ctrl+Space lists what can go next.</p>`:v}
                    <lcards-yaml-editor
                        .hass=${this.hass}
                        .schema=${ps(Jt(this.editor))}
                        .value=${M(s)}
                        .readOnly=${!t}>
                    </lcards-yaml-editor>
                    ${this._previewError?n`<div class="banner error">${this._previewError}</div>`:v}
                </div>
                <ha-dialog-footer slot="footer">
                    <ha-button slot="secondaryAction" appearance="plain" @click=${()=>this._handleCopyYAML(e)}>
                        <ha-icon icon="mdi:content-copy" slot="start"></ha-icon>
                        Copy YAML
                    </ha-button>
                    ${t?n`
                        <ha-button slot="secondaryAction" appearance="plain" data-dialog="close">Cancel</ha-button>
                        <ha-button slot="primaryAction" variant="brand" @click=${()=>this._savePreviewYaml()}>
                            <ha-icon icon="mdi:check" slot="start"></ha-icon>
                            Save
                        </ha-button>
                    `:n`<ha-button slot="primaryAction" data-dialog="close">Close</ha-button>`}
                </ha-dialog-footer>
            </ha-dialog>
        `}render(){const e=this._rows(),t=e.filter(i=>i._pending!=="removed"&&this._isTargetingCard(i,this.cardId)),a=e.filter(i=>i._pending!=="removed"),s=a.filter(i=>i.enabled!==false).length;return n`
            <div class="rules-dashboard">
                ${H({icon:"mdi:format-list-checks",title:"Rules",description:"Rules change cards' settings while their conditions are met, on any card on the page.",stats:[{value:t.length,label:"targeting this card"},{value:a.length,label:"on this page"},{value:s,label:"enabled"}],actions:[{label:"Add rule",icon:"mdi:plus",onClick:u(()=>this._handleAddRule(),"onClick")},{label:"Rules guide",icon:"mdi:book-open-variant",onClick:u(()=>window.open(fs,"_blank","noopener"),"onClick")}]})}

                <div class="banner info refresh-notice">
                    <ha-icon icon="mdi:information-outline"></ha-icon>
                    Rule changes show in the preview straight away and on the dashboard when you save the card.
                </div>

                <lcards-form-section
                    header="Rules targeting this card"
                    icon="mdi:target"
                    ?expanded=${true}>
                    ${t.length>0?this._renderRulesTable(t):n`<p class="hint empty">No rules target this card. Add one above, or write them on the YAML tab.</p>`}
                </lcards-form-section>

                <lcards-form-section
                    header="All rules on this page"
                    description="Rules that target this card are highlighted."
                    icon="mdi:format-list-bulleted"
                    ?expanded=${false}>
                    ${e.length>0?this._renderRulesTable(e,true):n`<p class="hint empty">No rules are registered on this page.</p>`}
                </lcards-form-section>
            </div>

            ${this._renderPreviewDialog()}
            ${this._renderEditDialog()}
        `}_renderEditDialog(){return n`
            <lcards-rule-editor-dialog
                .hass=${this.hass}
                .mode=${this._editMode}
                .rule=${this._editingRule}
                .open=${this._editDialogOpen}
                .editor=${this.editor}
                @save=${this._handleRuleSave}
                @cancel=${this._handleRuleDialogClose}>
            </lcards-rule-editor-dialog>
        `}};u(lt,"LCARdSRulesDashboard");let Ee=lt;customElements.get("lcards-rules-dashboard")||customElements.define("lcards-rules-dashboard",Ee);function Gt({hass:o,config:e={},entity:t=null,variables:a={},theme:s}={}){return{entity:t,config:e,hass:o,states:o==null?void 0:o.states,variables:{...(e==null?void 0:e.variables)||{},...a},theme:s,displayFormat:"friendly"}}u(Gt,"templateContext");function bs(o){if(typeof o!="string"||!o)return false;const e=Rt.detectTemplateTypes(o);return e.hasJavaScript||e.hasTokens||e.hasDatasources||e.hasJinja2}u(bs,"hasTemplate");function Zt(o){if(typeof o!="string")return[];const e=Rt.detectTemplateTypes(o),t=[];return e.hasJavaScript&&t.push("JavaScript"),/\{theme:/.test(o)&&t.push("Theme"),/\{(?:datasource|ds):/.test(o)&&t.push("Data source"),/\{(?!theme:|datasource:|ds:|\{|%)[a-z_][\w.]*\}/i.test(o)&&t.push("Token"),e.hasJinja2&&t.push("Jinja2"),t}u(Zt,"templateKinds");const _s=[[/\{\{\s*theme:[^}]*\}\}/g,"Theme tokens use single braces: {theme:colors.text.onDark}"],[/\{(?:datasource|ds)\.[^}]*\}/g,"Data sources use a colon: {ds:name}"],[/\{(?:colors|typography|components|palette)\.[^}]*\}/g,"Missing the theme: prefix: {theme:colors.text.onDark}"]];function ys(o){if(typeof o!="string")return[];const e=[];for(const[t,a]of _s)for(const s of o.matchAll(t))e.push({match:s[0],message:a});return e}u(ys,"templateMistakes");function $s(o){const e=[],t=new Set(["type","rules","data_sources","grid_options","view_layout","visibility"]),a=u((s,i)=>{if(typeof s=="string"){const r=ys(s);(bs(s)||r.length)&&e.push({path:i,value:s,kinds:Zt(s),mistakes:r});return}if(Array.isArray(s)){s.forEach((r,l)=>a(r,`${i}[${l}]`));return}if(s&&typeof s=="object")for(const[r,l]of Object.entries(s))!i&&t.has(r)||a(l,i?`${i}.${r}`:r)},"walk");return a(o??{},""),e}u($s,"templateFields");function Be(o){const e=[];for(const t of String(o).split(".")){const a=/^([^[\]]*)((?:\[\d+\])*)$/.exec(t);if(!a){e.push(t);continue}a[1]&&e.push(a[1]);for(const s of a[2].matchAll(/\[(\d+)\]/g))e.push(Number(s[1]))}return e}u(Be,"pathSegments");function ws(o,e,t){const a=Be(e),s=u((i,r)=>{if(r===a.length)return t;const l=a[r],c=Array.isArray(i)?[...i]:{...i??{}};return c[l]=s(i==null?void 0:i[l],r+1),c},"set");return s(o,0)}u(ws,"withValueAt");function xs(o){if(!String(o??"").trim())return{value:{},error:""};try{const e=Nt.load(o);return e==null?{value:{},error:""}:typeof e!="object"||Array.isArray(e)?{value:{},error:"Write name: value lines (a YAML mapping)."}:{value:e,error:""}}catch(e){return{value:{},error:`YAML error: ${String(e.message).split(`
`)[0]}`}}}u(xs,"parseTestValues");function Xt(o){const e=String(o??""),t=[...e.matchAll(/\[\[\[[\s\S]*?\]\]\]/g),...e.matchAll(/\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}/g),...e.matchAll(/\{(?:theme|datasource|ds):[^}]*\}/g),...e.matchAll(/\{(?:entity|states|config|variables|hass)\.[^}]*\}/g),...e.matchAll(/\{(?:entity|states|config|variables|hass)\.[^{}]*$|\{(?:theme|datasource|ds):[^{}]*$/g)].map(a=>a[0]);return[...new Set(t)]}u(Xt,"unresolvedParts");function kt(o,e,t){const a=new Date().toISOString();return{entity_id:o,last_changed:a,last_updated:a,context:{id:"lcards-test",parent_id:null,user_id:null},...e??{},state:String((t==null?void 0:t.state)??(e==null?void 0:e.state)??""),attributes:{...(e==null?void 0:e.attributes)??{},...(t==null?void 0:t.attributes)??{}}}}u(kt,"testState");function Ct({hass:o,entityId:e,test:t={}}){var h,p;const a=t&&typeof t=="object"?t:{},s=u(f=>f&&typeof f=="object"&&!Array.isArray(f),"isObj"),i=e?((h=o==null?void 0:o.states)==null?void 0:h[e])??null:null,r=s(a.entity)?kt(e||"test.entity",i,a.entity):i,l={};if(s(a.states))for(const[f,b]of Object.entries(a.states))l[f]=kt(f,(p=o==null?void 0:o.states)==null?void 0:p[f],s(b)?b:{state:b});s(a.entity)&&e&&(l[e]=r);const c=Object.keys(l);return{hass:c.length?{...o,states:{...(o==null?void 0:o.states)??{},...l}}:o,entity:r,variables:s(a.variables)?a.variables:{},ds:s(a.ds)?a.ds:{},testEntities:c}}u(Ct,"withTestValues");const je={"entity-state":{name:"The card's entity state",template:"{entity.state}",description:"The state, as Home Assistant shows it"},"entity-attribute":{name:"An attribute",template:"Brightness: {entity.attributes.brightness}",description:"Any attribute of the entity",test:{entity:{state:"on",attributes:{brightness:200}}}},"other-entity":{name:"Another entity's state",template:"Outside: {states.sensor.outdoor_temperature.state}",description:"Any entity, by its full ID",test:{states:{"sensor.outdoor_temperature":{state:"12.5",attributes:{unit_of_measurement:"°C"}}}}},datasource:{name:"A data source, formatted",template:"Core temperature: {ds:core_temp:.1f} °C",description:"A data source value with a number format",test:{ds:{core_temp:87.468}}},variables:{name:"A card variable",template:"Deck {variables.deck}: {variables.section}",description:"Values from the card's variables",test:{variables:{deck:7,section:"Sickbay"}}},"theme-token":{name:"A theme token",template:"{theme:colors.text.onDark}",description:"A value from the active LCARdS theme"},user:{name:"The current user",template:"Welcome aboard, {hass.user.name}",description:"Who is looking at the dashboard"},"js-conditional":{name:"JavaScript: a condition",template:"[[[ return entity.state === 'on' ? 'ACTIVE' : 'STANDBY' ]]]",description:"JavaScript with entity, states, variables, config, hass, theme and user",test:{entity:{state:"on",attributes:{}}}},"js-calculation":{name:"JavaScript: a calculation",template:"[[[ return Math.round(parseFloat(entity.state) * 1.8 + 32) + ' °F' ]]]",description:"Convert a Celsius reading to Fahrenheit",test:{entity:{state:"21",attributes:{unit_of_measurement:"°C"}}}},"jinja-state":{name:"Jinja2: a state",template:"{{ states('sun.sun') }}",description:"Home Assistant's own template engine (runs in Home Assistant)"},"jinja-conditional":{name:"Jinja2: a condition",template:"{% if is_state('sun.sun', 'above_horizon') %}Day watch{% else %}Night watch{% endif %}",description:"Jinja2 if / else"},mixed:{name:"Mixed: tokens, a data source and JavaScript",template:"{entity.state} · {ds:core_temp:.0f}° · [[[ return new Date().getHours() < 12 ? 'AM' : 'PM' ]]]",description:"All four kinds can share one string; they run in order JavaScript, tokens, data sources, Jinja2",test:{entity:{state:"on",attributes:{}},ds:{core_temp:87.4}}}};function ks(){return Object.keys(je)}u(ks,"getExampleIds");const Cs=[{label:"entity.",detail:"the card's entity",type:"namespace"},{label:"states.",detail:"another entity",type:"namespace"},{label:"ds:",detail:"data source value",type:"namespace"},{label:"theme:",detail:"theme token",type:"namespace"},{label:"variables.",detail:"the card's variables",type:"namespace"},{label:"config.",detail:"card config",type:"namespace"},{label:"hass.user.name",apply:"hass.user.name}",detail:"current user",type:"property"}];function Le(o){if(o==null)return"";if(typeof o=="object")return Array.isArray(o)?`list (${o.length})`:"object";const e=String(o);return e.length>28?`${e.slice(0,27)}…`:e}u(Le,"preview");function P(o,e="}"){return!o||typeof o!="object"?[]:Object.entries(o).map(([t,a])=>a&&typeof a=="object"&&!Array.isArray(a)?{label:t,apply:`${t}.`,detail:"object",type:"namespace"}:{label:t,apply:`${t}${e}`,detail:Le(a),type:"property"})}u(P,"keyOptions");function De(o,e){return Object.entries(o||{}).map(([t,a])=>{var s;return{label:t,apply:`${t}${e}`,detail:Le(((s=a==null?void 0:a.attributes)==null?void 0:s.friendly_name)??(a==null?void 0:a.state)),type:"variable"}})}u(De,"entityOptions");const St=u(o=>[{label:"state",apply:"state}",detail:Le(o==null?void 0:o.state),type:"property"},{label:"attributes.",detail:"attributes",type:"namespace"}],"stateParts");function Ss(o,e){var l,c;if(!/[.:]/.test(o))return{offset:0,options:Cs};for(const d of["ds:","datasource:"])if(o.startsWith(d))return{offset:d.length,options:(e.datasources||[]).map(h=>({label:h,apply:`${h}}`,detail:"data source",type:"variable"}))};if(o.startsWith("theme:")){const d=o.slice(6).split(".");d.pop();let h=e.themeTokens;for(const p of d)h=h==null?void 0:h[p];return{offset:o.lastIndexOf(".")>=6?o.lastIndexOf(".")+1:6,options:P(h)}}if(o.startsWith("states.")){const d=o.slice(7),h=/^([a-z_]+\.[a-z0-9_]+)\.(.*)$/i.exec(d);if(!h)return{offset:7,options:De(e.states,".")};const p=(l=e.states)==null?void 0:l[h[1]],f=h[2].split("."),b=7+h[1].length+1;return f.length===1?{offset:b,options:St(p)}:f[0]==="attributes"&&f.length===2?{offset:b+11,options:P(p==null?void 0:p.attributes)}:null}const t=o.split("."),a=o.length-t[t.length-1].length,s=t.slice(0,-1),[i,...r]=s;if(i==="entity")return r.length===0?{offset:a,options:St(e.entity)}:r.length===1&&r[0]==="attributes"?{offset:a,options:P((c=e.entity)==null?void 0:c.attributes)}:null;if(i==="variables"||i==="config"){let d=i==="variables"?e.variables:e.config;for(const h of r)d=d==null?void 0:d[h];return{offset:a,options:P(d)}}if(i==="hass"){if(r.length===0)return{offset:a,options:[{label:"user.",detail:"current user",type:"namespace"}]};if(r.length===1&&r[0]==="user")return{offset:a,options:[{label:"name",apply:"name}",detail:"user name",type:"property"}]}}return null}u(Ss,"tokenOptions");function Ts(o,e={}){var r;const t=/\b(?:states|is_state|state_attr|has_value)\(\s*['"]([\w.]*)$/.exec(o);if(t)return{from:o.length-t[1].length,options:De(e.states,"")};const a=o.lastIndexOf("[[[");if(a>=0&&o.indexOf("]]]",a)<0){const l=/(?:\b(entity\.attributes|variables)\.|states\[\s*['"])([\w.]*)$/.exec(o);if(!l)return null;const c=l[2],d=l[1]==="entity.attributes"?P((r=e.entity)==null?void 0:r.attributes,""):l[1]==="variables"?P(e.variables,""):De(e.states,"");return{from:o.length-c.length,options:d}}const s=/\{([^{}\s]*)$/.exec(o);if(!s||o[s.index-1]==="{"||s[1].startsWith("%"))return null;const i=Ss(s[1],e);return i?{from:s.index+1+i.offset,options:i.options}:null}u(Ts,"templateCompletions");const Tt=new ma({regexp:/\[\[\[|\]\]\]|\{\{[^\n]*?\}\}|\{%[^\n]*?%\}|\{(?:theme|ds|datasource):[^{}\n]*\}|\{[a-z_][\w.]*\}/gi,decoration:u(o=>ga.mark({class:o[0].startsWith("[[[")||o[0].startsWith("]]]")?"tpl-js":o[0].startsWith("{{")||o[0].startsWith("{%")?"tpl-jinja":"tpl-token"}),"decoration")}),As=va.fromClass(class{constructor(o){this.decorations=Tt.createDeco(o)}update(o){this.decorations=Tt.updateDeco(o,this.decorations)}},{decorations:u(o=>o.decorations,"decorations")}),ct=class ct2 extends S{static get properties(){return{value:{type:String},placeholder:{type:String},getCompletionData:{attribute:false}}}constructor(){super(),this.value="",this.placeholder="Type a template. Ctrl+Space lists what can go next.",this.getCompletionData=()=>({}),this._view=null,this._timer=null,this._updating=false}static get styles(){return w`
            :host {
                display: block;
            }
            .mount {
                border-radius: var(--ha-border-radius-md);
                overflow: hidden;
                border: var(--ha-border-width-sm) solid var(--divider-color);
            }
            .mount:focus-within {
                border-color: var(--primary-color);
            }
            .cm-editor {
                min-height: 140px;
                max-height: 40vh;
                font-size: 14px;
            }
            .cm-editor.cm-focused {
                outline: none;
            }
            .cm-scroller {
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
                line-height: 1.6;
            }
            .tpl-token {
                color: #4ec9b0;
            }
            .tpl-jinja {
                color: #c586c0;
            }
            .tpl-js {
                color: #dcdcaa;
                font-weight: 600;
            }
        `}render(){return n`<div class="mount" @keydown=${this._keepKeys}></div>`}_keepKeys(e){e.key.length===1&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&e.stopPropagation(),e.key==="Escape"&&e.defaultPrevented&&e.stopPropagation()}firstUpdated(){const e=u(t=>{var l;const a=t.state.doc.lineAt(t.pos),s=t.state.sliceDoc(Math.max(0,t.pos-400),t.pos),i=Ts(s,((l=this.getCompletionData)==null?void 0:l.call(this))??{});if(!i)return null;const r=t.pos-(s.length-i.from);return r<a.from&&!t.explicit?null:{from:r,options:i.options,validFor:/^[\w.]*$/}},"source");this._view=new ae({parent:this.renderRoot.querySelector(".mount")??void 0,state:ba.create({doc:this.value??"",extensions:[ya(),ae.lineWrapping,$a(this.placeholder),wa({override:[e],activateOnTyping:true,maxRenderedOptions:40}),xa.of([...ka,...Ca,...Sa]),_a,As,ae.updateListener.of(t=>{if(t.docChanged&&!this._updating&&this._schedule(),t.docChanged&&t.transactions.some(a=>a.isUserEvent("input.type"))){let a="";t.changes.iterChanges((s,i,r,l,c)=>{a=c.toString()}),/[.:{'"[]$/.test(a)&&queueMicrotask(()=>this._view&&mt(this._view))}})]})})}updated(e){e.has("value")&&this._view&&this.value!==this._view.state.doc.toString()&&(this._updating=true,this._view.dispatch({changes:{from:0,to:this._view.state.doc.length,insert:this.value??""}}),this._updating=false)}disconnectedCallback(){var e;super.disconnectedCallback(),clearTimeout(this._timer??void 0),(e=this._view)==null||e.destroy(),this._view=null}_schedule(){clearTimeout(this._timer??void 0),this._timer=setTimeout(()=>this._emit(),300)}_emit(){var t;this._timer=null;const e=((t=this._view)==null?void 0:t.state.doc.toString())??this.value;this.value=e,this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:e},bubbles:true,composed:true}))}flush(){this._timer&&(clearTimeout(this._timer??void 0),this._emit())}insert(e,t=0){const a=this._view;if(!a)return;const{from:s,to:i}=a.state.selection.main;a.dispatch({changes:{from:s,to:i,insert:e},selection:{anchor:s+e.length+t}}),a.focus(),/[.:{]$/.test(e)&&t===0&&mt(a)}focus(){var e;(e=this._view)==null||e.focus()}};u(ct,"LCARdSTemplateEditor");let Me=ct;customElements.get("lcards-template-editor")||customElements.define("lcards-template-editor",Me);const Os=N(I.templates),Es=[{label:"Entity",text:"{entity."},{label:"Other entity",text:"{states."},{label:"Data source",text:"{ds:"},{label:"Theme",text:"{theme:"},{label:"Variable",text:"{variables."},{label:"JavaScript",text:"[[[ return  ]]]",caret:-4},{label:"Jinja2",text:"{{  }}",caret:-3}],js=[["{entity.state}","The card's entity (also entity.attributes.NAME)"],["{states.light.desk.state}","Any entity by its ID"],["{ds:name:.1f}","A data source value, with an optional number format"],["{theme:colors.text.onDark}","A theme token"],["{variables.NAME}","One of the card's variables"],["[[[ return ... ]]]","JavaScript: entity, states, variables, config, hass, theme, user"],["{{ states('sun.sun') }}","Jinja2, run by Home Assistant (test values don't apply)"]],Ds={ok:{icon:"mdi:check-circle",text:"Resolved"},partial:{icon:"mdi:alert",text:"Resolved with gaps"},failed:{icon:"mdi:close-circle",text:"Didn't resolve"},empty:{icon:"mdi:circle-outline",text:"Empty result"}},dt=class dt2 extends S{static get properties(){return{hass:{type:Object},config:{type:Object},open:{type:Boolean},initialData:{type:Object},_template:{type:String,state:true},_path:{type:String,state:true},_entityId:{type:String,state:true},_testText:{type:String,state:true},_result:{type:Object,state:true},_evaluating:{type:Boolean,state:true}}}constructor(){super(),this.hass=void 0,this.config=void 0,this.open=false,this.initialData=null,this._template="",this._path="",this._entityId="",this._testText="",this._result=null,this._evaluating=false,this._run=0,this._subscriptions=new Map,this._seenStates=new Map}static get styles(){return[te,T,w`
            .studio-layout {
                grid-template-columns: minmax(320px, 1fr) minmax(300px, 1fr);
                grid-template-rows: minmax(0, 1fr); /* one row at every width (see studio-dialog-styles.js) */
            }

            .tab-content {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-3);
                --lcards-section-spacing: 0;
            }

            .preview-panel {
                overflow-y: auto;
                padding: var(--ha-space-4);
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-3);
                --lcards-section-spacing: 0;
            }

            .editor-head {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: var(--ha-space-2);
                flex-wrap: wrap;
            }

            .editor-head h3 {
                margin: 0;
                font-size: 15px;
                font-weight: 600;
                color: var(--primary-text-color);
            }

            .kinds {
                display: flex;
                gap: var(--ha-space-1);
                flex-wrap: wrap;
            }

            .kind {
                padding: 2px var(--ha-space-2);
                border-radius: var(--ha-border-radius-pill);
                font-size: 12px;
                font-weight: 600;
                background: color-mix(in srgb, var(--primary-color) 18%, transparent);
                color: var(--primary-text-color);
            }

            .inserts {
                display: flex;
                flex-wrap: wrap;
                gap: var(--ha-space-1);
                align-items: center;
            }

            .inserts .hint {
                margin-right: var(--ha-space-1);
            }

            .inserts ha-button {
                --ha-button-height: 28px;
            }

            .examples ha-selector {
                display: block;
            }

            .entity-live {
                margin: var(--ha-space-1) 0 0;
            }

            /* Result: the black inset */
            .result {
                background: var(--primary-background-color);
                border-radius: var(--ha-border-radius-lg);
                padding: var(--ha-space-4);
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-3);
            }

            .status {
                display: flex;
                align-items: center;
                gap: var(--ha-space-2);
                font-weight: 600;
                font-size: 13px;
            }

            .status ha-icon {
                --mdc-icon-size: 18px;
            }

            .status.ok { color: var(--success-color); }
            .status.partial, .status.empty { color: var(--warning-color); }
            .status.failed { color: var(--error-color); }

            .status .time {
                margin-left: auto;
                font-weight: 400;
                color: var(--secondary-text-color);
            }

            .value {
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
                font-size: 20px;
                line-height: 1.4;
                color: var(--primary-text-color);
                white-space: pre-wrap;
                overflow-wrap: anywhere;
                min-height: 1.4em;
            }

            .value.placeholder {
                font-size: 14px;
                color: var(--secondary-text-color);
                font-family: inherit;
            }

            .gaps {
                margin: 0;
                padding-left: var(--ha-space-5);
                font-size: 12px;
                color: var(--secondary-text-color);
            }

            .gaps code {
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
                color: var(--warning-color);
            }

            /* What it used */
            .used {
                width: 100%;
                border-collapse: collapse;
                font-size: 13px;
            }

            .used td {
                padding: 6px var(--ha-space-2);
                border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
                vertical-align: middle;
            }

            .used tr:last-child td {
                border-bottom: none;
            }

            .used .name {
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
                color: var(--primary-text-color);
                overflow-wrap: anywhere;
            }

            .used .val {
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
                color: var(--secondary-text-color);
                overflow-wrap: anywhere;
            }

            .used ha-icon {
                --mdc-icon-size: 16px;
                color: var(--secondary-text-color);
            }

            .swatch {
                display: inline-block;
                width: 12px;
                height: 12px;
                border-radius: var(--ha-border-radius-sm);
                border: var(--ha-border-width-sm) solid var(--divider-color);
                vertical-align: middle;
                margin-right: var(--ha-space-1);
            }

            .src {
                font-size: 12px;
                padding: 1px var(--ha-space-2);
                border-radius: var(--ha-border-radius-pill);
                white-space: nowrap;
            }

            .src.live { background: color-mix(in srgb, var(--success-color) 20%, transparent); }
            .src.test { background: color-mix(in srgb, var(--info-color, #03a9f4) 22%, transparent); }
            .src.missing { background: color-mix(in srgb, var(--error-color) 22%, transparent); }

            /* Syntax reference */
            .syntax {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-1);
            }

            .syntax button {
                all: unset;
                cursor: pointer;
                display: grid;
                grid-template-columns: minmax(160px, auto) 1fr;
                gap: var(--ha-space-3);
                padding: var(--ha-space-1) var(--ha-space-2);
                border-radius: var(--ha-border-radius-sm);
                font-size: 12px;
            }

            .syntax button:hover,
            .syntax button:focus-visible {
                background: color-mix(in srgb, var(--primary-color) 14%, transparent);
            }

            .syntax code {
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
                color: var(--primary-color);
            }

            .syntax span {
                color: var(--secondary-text-color);
            }

            .docs {
                margin: var(--ha-space-2) 0 0;
                font-size: 12px;
            }

            .docs a {
                color: var(--primary-color);
            }

            .test-error {
                margin-top: var(--ha-space-1);
            }
        `]}disconnectedCallback(){super.disconnectedCallback(),this._unsubscribeAll()}willUpdate(e){e.has("open")&&this.open&&this._reset()}updated(e){e.has("open")&&!this.open&&this._unsubscribeAll(),e.has("hass")&&this.open&&this._result&&this._usedStatesChanged()&&this._evaluate()}_reset(){var t;const e=this.initialData||{};this._template=e.template??"",this._path=e.path??"",this._entityId=e.entity??((t=this.config)==null?void 0:t.entity)??"",this._testText="",this._result=null,this._evaluate()}get _test(){return xs(this._testText)}_dataSourceManager(e){var a,s;const t=(s=(a=window.lcards)==null?void 0:a.core)==null?void 0:s.dataSourceManager;return{sources:(t==null?void 0:t.sources)??new Map,getSource:u(i=>{var r;if(e[i]!==void 0){const l=e[i];return{id:i,_isTest:true,getCurrentData:u(()=>({v:l,value:l,t:Date.now(),metadata:{}}),"getCurrentData"),subscribe:u(()=>()=>{},"subscribe"),unsubscribe(){}}}return((r=t==null?void 0:t.getSource)==null?void 0:r.call(t,i))??null},"getSource")}}async _evaluate(){var b,_,m,k;const e=this._template,t=++this._run;if(!e.trim()){this._result=null,this._syncSubscriptions([]);return}const{value:a}=this._test,s=Ct({hass:this.hass,entityId:this._entityId,test:a}),i=It(e,{entityId:this._entityId});this._syncSubscriptions(i.datasources),this._evaluating=true;const r=performance.now();let l="",c="";try{const C=new Ft({hass:s.hass,context:Gt({hass:s.hass,config:this.config??{},entity:s.entity,variables:s.variables,theme:(k=(m=(_=(b=window.lcards)==null?void 0:b.core)==null?void 0:_.themeManager)==null?void 0:m.getActiveTheme)==null?void 0:k.call(m)}),dataSourceManager:this._dataSourceManager(s.ds)});l=String(await C.evaluateAsync(e)??"")}catch(C){c=(C==null?void 0:C.message)??String(C),$.debug("[TemplateSandbox] Evaluation failed",{error:c})}if(t!==this._run)return;const d=this._used(i,s),h=Xt(l),p=d.filter(C=>C.source==="missing"),f=c||h.length&&l.trim()===e.trim()?"failed":h.length||p.length?"partial":l.trim()?"ok":"empty";this._result={value:l,error:c,gaps:h,used:d,status:f,ms:Math.round(performance.now()-r)},this._rememberStates(i.entities),this._evaluating=false}_used(e,t){var c,d,h,p,f,b,_,m,k,C;const a=[],s=((c=t.hass)==null?void 0:c.states)??{};for(const x of e.entities){const g=s[x];a.push({kind:"entity",icon:"mdi:home-outline",name:x,value:g?ce(t.hass,g):"",source:g?t.testEntities.includes(x)?"test":"live":"missing"})}const i=(h=(d=window.lcards)==null?void 0:d.core)==null?void 0:h.dataSourceManager;for(const x of e.datasources){const g=t.ds[x]!==void 0,y=g?{v:t.ds[x]}:(b=(f=(p=i==null?void 0:i.getSource)==null?void 0:p.call(i,x))==null?void 0:f.getCurrentData)==null?void 0:b.call(f);a.push({kind:"ds",icon:"mdi:database",name:x,value:y&&y.v!==void 0&&y.v!==null?String(y.v):"",source:g?"test":y?"live":"missing"})}const r=((_=this.config)==null?void 0:_.variables)??{};for(const x of e.variables){const g=t.variables[x]!==void 0,y=g?t.variables[x]:r[x];a.push({kind:"variable",icon:"mdi:variable",name:x,value:y===void 0?"":typeof y=="object"?JSON.stringify(y):String(y),source:g?"test":y!==void 0?"card":"missing"})}const l=(k=(m=window.lcards)==null?void 0:m.core)==null?void 0:k.themeManager;for(const x of e.themeTokens){const g=(C=l==null?void 0:l.getToken)==null?void 0:C.call(l,x);a.push({kind:"theme",icon:"mdi:palette",name:x,value:g==null?"":typeof g=="object"?JSON.stringify(g):String(g),source:g==null?"missing":"theme"})}return a}_rememberStates(e){this._seenStates=new Map(e.map(t=>{var a,s;return[t,(s=(a=this.hass)==null?void 0:a.states)==null?void 0:s[t]]}))}_usedStatesChanged(){var e,t;for(const[a,s]of this._seenStates)if(((t=(e=this.hass)==null?void 0:e.states)==null?void 0:t[a])!==s)return true;return false}_syncSubscriptions(e){var a,s,i;const t=(s=(a=window.lcards)==null?void 0:a.core)==null?void 0:s.dataSourceManager;for(const[r,l]of this._subscriptions)e.includes(r)||(l==null||l(),this._subscriptions.delete(r));for(const r of e){if(this._subscriptions.has(r))continue;const l=(i=t==null?void 0:t.getSource)==null?void 0:i.call(t,r);typeof(l==null?void 0:l.subscribe)=="function"&&this._subscriptions.set(r,l.subscribe(()=>this._scheduleEvaluate()))}}_unsubscribeAll(){for(const e of this._subscriptions.values())e==null||e();this._subscriptions.clear(),clearTimeout(this._evalTimer)}_scheduleEvaluate(){clearTimeout(this._evalTimer),this._evalTimer=setTimeout(()=>this._evaluate(),250)}_completionData(){var s,i,r,l,c,d,h,p,f,b,_;const{value:e}=this._test,t=Ct({hass:this.hass,entityId:this._entityId,test:e}),a=(i=(s=window.lcards)==null?void 0:s.core)==null?void 0:i.dataSourceManager;return{entity:t.entity,states:((r=t.hass)==null?void 0:r.states)??{},datasources:[...new Set([...((c=(l=a==null?void 0:a.sources)==null?void 0:l.keys)==null?void 0:c.call(l))??[],...Object.keys(t.ds)])],themeTokens:((b=(f=(p=(h=(d=window.lcards)==null?void 0:d.core)==null?void 0:h.themeManager)==null?void 0:p.getActiveTheme)==null?void 0:f.call(p))==null?void 0:b.tokens)??{},variables:{...((_=this.config)==null?void 0:_.variables)??{},...t.variables},config:this.config??{}}}get _editor(){return this.renderRoot.querySelector("lcards-template-editor")}_onTemplate(e){e.stopPropagation(),this._template=e.detail.value,this._evaluate()}_insert(e,t=0){const a=this._editor;a==null||a.insert(e,t)}_loadExample(e){const t=je[e];t&&(this._template=t.template,this._testText=t.test?M(t.test):"",this._evaluate())}_onEntity(e){e.stopPropagation(),this._entityId=e.detail.value??"",this._evaluate()}_onTestValues(e){e.stopPropagation(),this._testText=e.detail.value??"",this._scheduleEvaluate()}_close(){this.open=false,this.dispatchEvent(new CustomEvent("sandbox-closed",{bubbles:true,composed:true}))}_save(){var e;(e=this._editor)==null||e.flush(),this.dispatchEvent(new CustomEvent("template-save",{detail:{path:this._path,value:this._template},bubbles:true,composed:true})),this._close()}render(){return this.open?n`
            <ha-dialog
                open
                flexcontent
                ?prevent-scrim-close=${!!this._path}
                header-title=${this._path?`Template: ${this._path}`:"Template Sandbox"}
                @closed=${e=>{e.stopPropagation(),e.target===e.currentTarget&&this._close()}}>
                <div class="dialog-content">
                    <div class="studio-layout">
                        <div class="config-panel">
                            <div class="tab-content">
                                ${this._renderEditor()}
                                ${this._renderContext()}
                            </div>
                        </div>
                        <div class="preview-panel">
                            ${this._renderResult()}
                            ${this._renderUsed()}
                            ${this._renderSyntax()}
                        </div>
                    </div>
                </div>
                <ha-dialog-footer slot="footer">
                    <ha-button slot="secondaryAction" appearance="plain" @click=${()=>{var e;return E(((e=this._editor)==null?void 0:e.value)??this._template)}}>
                        <ha-icon icon="mdi:content-copy" slot="start"></ha-icon>
                        Copy template
                    </ha-button>
                    ${this._path?n`
                        <ha-button slot="secondaryAction" appearance="plain" data-dialog="close">Cancel</ha-button>
                        <ha-button slot="primaryAction" variant="brand" @click=${this._save}>
                            <ha-icon icon="mdi:check" slot="start"></ha-icon>
                            Save to ${this._path}
                        </ha-button>
                    `:n`<ha-button slot="primaryAction" data-dialog="close">Close</ha-button>`}
                </ha-dialog-footer>
            </ha-dialog>
        `:v}_renderEditor(){const e=Zt(this._template);return n`
            <div class="editor-head">
                <h3>Template</h3>
                <div class="kinds">${e.map(t=>n`<span class="kind">${t}</span>`)}</div>
            </div>
            <lcards-template-editor
                .value=${this._template}
                .getCompletionData=${()=>this._completionData()}
                @value-changed=${this._onTemplate}>
            </lcards-template-editor>
            <div class="inserts">
                <span class="hint">Insert</span>
                ${Es.map(t=>n`
                    <ha-button size="s" appearance="outlined" variant="brand" @click=${()=>this._insert(t.text,t.caret??0)}>${t.label}</ha-button>
                `)}
            </div>
            <div class="examples">
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Load an example"}
                    .required=${false}
                    .selector=${{select:{mode:"dropdown",options:ks().map(t=>({value:t,label:je[t].name}))}}}
                    .value=${""}
                    @value-changed=${t=>{t.stopPropagation(),t.detail.value&&this._loadExample(t.detail.value)}}>
                </ha-selector>
            </div>
        `}_renderContext(){var a,s;const e=this._entityId?(s=(a=this.hass)==null?void 0:a.states)==null?void 0:s[this._entityId]:null,{error:t}=this._test;return n`
            <lcards-form-section
                header="Context"
                description="What entity means, and test values to try the template with"
                icon="mdi:tune"
                ?expanded=${true}>
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Entity"}
                    .required=${false}
                    .selector=${{entity:{}}}
                    .value=${this._entityId}
                    @value-changed=${this._onEntity}>
                </ha-selector>
                <p class="hint entity-live">
                    ${this._entityId?e?`Live: ${ce(this.hass,e)} · ${Object.keys(e.attributes??{}).length} attributes`:`${this._entityId} isn't in Home Assistant: give it test values below.`:"No entity: {entity.…} has nothing to read."}
                </p>
                <p class="hint">
                    Test values (YAML) replace live ones: <code>entity:</code> state and attributes,
                    <code>states:</code> other entities by ID, <code>ds:</code> data sources, <code>variables:</code>.
                </p>
                <ha-code-editor
                    mode="yaml"
                    class="test-values"
                    .hass=${this.hass}
                    .value=${this._testText}
                    @value-changed=${this._onTestValues}>
                </ha-code-editor>
                ${t?n`<div class="banner error test-error">${t}</div>`:v}
            </lcards-form-section>
        `}_renderResult(){const e=this._result;if(!e)return n`
                <div class="result">
                    <div class="value placeholder">The result shows here as you type.</div>
                </div>
            `;const t=Ds[e.status];return n`
            <div class="result">
                <div class="status ${e.status}">
                    <ha-icon icon=${t.icon}></ha-icon>
                    ${t.text}
                    <span class="time">${this._evaluating?"Running…":`${e.ms} ms`}</span>
                </div>
                <div class="value">${e.error||e.value||" "}</div>
                ${e.gaps.length?n`
                    <ul class="gaps">${e.gaps.map(a=>n`<li>Not resolved: <code>${a}</code></li>`)}</ul>
                `:v}
            </div>
        `}_renderUsed(){var t;const e=((t=this._result)==null?void 0:t.used)??[];return e.length?n`
            <lcards-form-section header="What it used" icon="mdi:link-variant" ?expanded=${true}>
                <table class="used">
                    ${e.map(a=>n`
                        <tr>
                            <td><ha-icon icon=${a.icon}></ha-icon></td>
                            <td class="name">${a.name}</td>
                            <td class="val">
                                ${a.kind==="theme"&&Re(a.value)?n`<span class="swatch" style=${U({background:a.value})}></span>`:v}
                                ${a.value||"-"}
                            </td>
                            <td><span class="src ${a.source==="card"||a.source==="theme"?"live":a.source}">${a.source}</span></td>
                        </tr>
                    `)}
                </table>
            </lcards-form-section>
        `:v}_renderSyntax(){return n`
            <lcards-form-section header="Syntax" icon="mdi:code-braces" ?expanded=${!this._template}>
                <div class="syntax">
                    ${js.map(([e,t])=>n`
                        <button @click=${()=>this._insert(e)} title="Insert">
                            <code>${e}</code><span>${t}</span>
                        </button>
                    `)}
                </div>
                <p class="docs"><a href=${Os} target="_blank" rel="noopener">Templates guide</a></p>
            </lcards-form-section>
        `}};u(dt,"LCARdSTemplateSandbox");let ze=dt;customElements.get("lcards-template-sandbox")||customElements.define("lcards-template-sandbox",ze);const ht=class ht2 extends S{static get properties(){return{editor:{type:Object},config:{type:Object},hass:{type:Object},_rows:{type:Array,state:true},_sandboxOpen:{type:Boolean,state:true},_sandboxInitialData:{type:Object,state:true}}}constructor(){super(),this.editor=void 0,this.config=void 0,this.hass=void 0,this._rows=[],this._sandboxOpen=false,this._sandboxInitialData=null,this._run=0,this._seenStates=new Map}static get styles(){return[T,W,w`
            :host {
                display: block;
            }

            .fields {
                display: flex;
                flex-direction: column;
                background: var(--primary-background-color);
                border-radius: var(--ha-border-radius-lg);
                padding: var(--ha-space-1) var(--ha-space-4);
            }

            .field {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-1);
                padding: var(--ha-space-3) 0;
                border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
            }

            .field:last-child {
                border-bottom: none;
            }

            .field-head {
                display: flex;
                align-items: center;
                gap: var(--ha-space-2);
            }

            .path {
                flex: 1;
                min-width: 0;
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
                font-size: 13px;
                font-weight: 600;
                color: var(--primary-text-color);
                overflow-wrap: anywhere;
            }

            .kind {
                padding: 1px var(--ha-space-2);
                border-radius: var(--ha-border-radius-pill);
                font-size: 12px;
                font-weight: 600;
                background: color-mix(in srgb, var(--primary-color) 18%, transparent);
                color: var(--primary-text-color);
                white-space: nowrap;
            }

            .actions {
                display: flex;
                --ha-icon-button-size: 32px;
                --mdc-icon-size: 18px;
                color: var(--primary-color);
            }

            .template {
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
                font-size: 12px;
                color: var(--secondary-text-color);
                white-space: pre-wrap;
                overflow-wrap: anywhere;
                max-height: 6.5em;
                overflow-y: auto;
            }

            .result {
                display: flex;
                align-items: flex-start;
                gap: var(--ha-space-2);
                font-size: 13px;
                color: var(--primary-text-color);
            }

            .result ha-icon {
                --mdc-icon-size: 16px;
                flex: none;
                margin-top: 1px;
            }

            .result.ok ha-icon { color: var(--success-color); }
            .result.partial ha-icon { color: var(--warning-color); }
            .result.failed ha-icon { color: var(--error-color); }

            .result .value {
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
                overflow-wrap: anywhere;
                white-space: pre-wrap;
            }

            .result.pending {
                color: var(--secondary-text-color);
            }

            .mistake {
                font-size: 12px;
                color: var(--warning-color);
            }

            .mistake code {
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
            }

            .empty {
                margin: 0;
            }
        `]}updated(e){e.has("config")?this._discover():e.has("hass")&&this._statesChanged()&&this._evaluate()}_discover(){this._rows=$s(this.config??{}).map(e=>({...e,status:"pending",result:""})),this._evaluate()}async _evaluate(){var r,l;const e=++this._run,t=this.config??{},a=t.entity?((l=(r=this.hass)==null?void 0:r.states)==null?void 0:l[t.entity])??null:null,s=new Set,i=await Promise.all(this._rows.map(async c=>{var d,h,p,f,b,_;It(c.value,{entityId:t.entity}).entities.forEach(m=>s.add(m));try{const m=new Ft({hass:this.hass,context:Gt({hass:this.hass,config:t,entity:a,theme:(f=(p=(h=(d=window.lcards)==null?void 0:d.core)==null?void 0:h.themeManager)==null?void 0:p.getActiveTheme)==null?void 0:f.call(p)}),dataSourceManager:(_=(b=window.lcards)==null?void 0:b.core)==null?void 0:_.dataSourceManager}),k=String(await m.evaluateAsync(c.value)??""),C=Xt(k),x=C.length&&k.trim()===c.value.trim()?"failed":C.length?"partial":"ok";return{...c,result:k,status:x}}catch(m){return $.debug("[TemplateEvaluationTab] Evaluation failed",{path:c.path,error:m==null?void 0:m.message}),{...c,result:(m==null?void 0:m.message)??String(m),status:"failed"}}}));e===this._run&&(this._seenStates=new Map([...s].map(c=>{var d,h;return[c,(h=(d=this.hass)==null?void 0:d.states)==null?void 0:h[c]]})),this._rows=i)}_statesChanged(){var e,t;for(const[a,s]of this._seenStates)if(((t=(e=this.hass)==null?void 0:e.states)==null?void 0:t[a])!==s)return true;return false}render(){const e=new Set(this._rows.flatMap(a=>a.kinds)),t=this._rows.filter(a=>a.status==="failed"||a.status==="partial"||a.mistakes.length).length;return n`
            ${H({icon:"mdi:code-braces-box",title:"Templates",description:"Every template in this card's config, evaluated live. Test one, or try new ones, in the sandbox.",stats:[{value:this._rows.length,label:this._rows.length===1?"field with a template":"fields with templates"},{value:e.size,label:e.size===1?"kind":"kinds"},...t?[{value:t,label:t===1?"needs a look":"need a look"}]:[]],actions:[{label:"Open sandbox",icon:"mdi:flask-outline",onClick:u(()=>this._openSandbox(),"onClick")}]})}
            ${this._rows.length?n`
                <div class="fields">${this._rows.map(a=>this._renderRow(a))}</div>
            `:n`<p class="hint empty">No templates in this card's config yet. Try one in the sandbox.</p>`}
            <lcards-template-sandbox
                .hass=${this.hass}
                .config=${this.config}
                .open=${this._sandboxOpen}
                .initialData=${this._sandboxInitialData}
                @sandbox-closed=${this._handleSandboxClosed}
                @template-save=${this._handleSave}>
            </lcards-template-sandbox>
        `}_renderRow(e){const t={ok:"mdi:check-circle",partial:"mdi:alert",failed:"mdi:close-circle",pending:"mdi:timer-sand"}[e.status];return n`
            <div class="field">
                <div class="field-head">
                    <span class="path">${e.path}</span>
                    ${e.kinds.map(a=>n`<span class="kind">${a}</span>`)}
                    <div class="actions">
                        <ha-icon-button .label=${"Copy template"} title="Copy template" @click=${()=>E(e.value)}>
                            <ha-icon icon="mdi:content-copy"></ha-icon>
                        </ha-icon-button>
                        <ha-icon-button .label=${"Open in sandbox"} title="Open in sandbox" @click=${()=>this._openSandbox({template:e.value,path:e.path})}>
                            <ha-icon icon="mdi:flask-outline"></ha-icon>
                        </ha-icon-button>
                    </div>
                </div>
                <div class="template">${e.value}</div>
                <div class="result ${e.status}">
                    <ha-icon icon=${t}></ha-icon>
                    <span class="value">${e.status==="pending"?"Evaluating…":e.result||"(empty)"}</span>
                </div>
                ${e.mistakes.map(a=>n`<div class="mistake"><code>${a.match}</code>: ${a.message}</div>`)}
            </div>
        `}_openSandbox(e={}){var t;this._sandboxInitialData={entity:(t=this.config)==null?void 0:t.entity,...e},this._sandboxOpen=true}_handleSandboxClosed(){this._sandboxOpen=false,this._sandboxInitialData=null}_handleSave(e){var r;const{path:t,value:a}=e.detail??{};if(!t||!((r=this.editor)!=null&&r._updateConfig))return;const s=Be(t)[0],i=ws(this.editor.config??this.config??{},t,a);this.editor._updateConfig({[s]:i[s]}),$.debug("[TemplateEvaluationTab] Saved template to",t)}};u(ht,"LCARdSTemplateEvaluationTab");let Ne=ht;customElements.get("lcards-template-evaluation-tab")||customElements.define("lcards-template-evaluation-tab",Ne);const X={card_defaults:{label:"Card defaults",icon:"mdi:cog"},theme_defaults:{label:"Theme defaults",icon:"mdi:palette"},user_config:{label:"Your config",icon:"mdi:account"}},Q={"built-in":{label:"Built-in default",icon:"mdi:cog-outline"},component:{label:"Component",icon:"mdi:puzzle"},"component-preset":{label:"Component preset",icon:"mdi:puzzle-star"},range:{label:"Range",icon:"mdi:arrow-expand-horizontal"},"preset-default":{label:"Preset default",icon:"mdi:package-variant"},state:{label:"State branch",icon:"mdi:toggle-switch"}},ne={override:{label:"Override",icon:"mdi:account-edit"},lookup:{label:"Theme token",icon:"mdi:palette"},reference:{label:"Refers to",icon:"mdi:arrow-right"},computed:{label:"Computed",icon:"mdi:function-variant"},"css-var":{label:"CSS variable",icon:"mdi:variable"},value:{label:"Value on this card",icon:"mdi:eyedropper"},missing:{label:"Not in the theme",icon:"mdi:alert"},circular:{label:"Circular reference",icon:"mdi:alert"}},Ms=[{value:"all",label:"All fields"},{value:"changed",label:"Changed from defaults"},{value:"rules",label:"Set by rules now"},{value:"templates",label:"Templates"},{value:"tokens",label:"Theme tokens"},{value:"runtime",label:"Set by the card"}];function le(o){if(X[o])return X[o].label;if(Q[o])return Q[o].label;if(o==="rules")return"Rule";const e=/^(preset|component)_(.+)$/.exec(o??"");return e?`${e[1]==="preset"?"Preset":"Component"}: ${e[2]}`:o??""}u(le,"layerLabel");function At(o){return X[o]?X[o].icon:Q[o]?Q[o].icon:o==="rules"?"mdi:format-list-checks":/^preset_/.test(o??"")?"mdi:package-variant-closed":/^component_/.test(o??"")?"mdi:puzzle":"mdi:circle-small"}u(At,"layerIcon");function zs(o){return o==="user_config"?"user":o==="rules"?"rule":/^preset|^component/.test(o??"")?"preset":o==="theme_defaults"?"theme":"card"}u(zs,"badgeClass");function A(o){if(o===void 0)return"(not set)";if(o===null)return"null";if(typeof o=="object")try{return JSON.stringify(o)}catch{return String(o)}return String(o)}u(A,"show");const Ot=Re,Et=u(o=>/^[\w[\].-]+$/.test(o),"isFieldPath");function Ns(o,e){let t=o;for(const a of Be(e)){if(t==null)return;t=t[a]}return t}u(Ns,"valueAt");const ut=class ut2 extends S{static get properties(){return{editor:{type:Object},config:{type:Object},hass:{type:Object},_provenance:{type:Object,state:true},_cardConfig:{type:Object,state:true},_open:{type:Boolean,state:true},_view:{type:String,state:true},_search:{type:String,state:true},_show:{type:String,state:true},_selected:{type:String,state:true},_selectedToken:{type:String,state:true},_live:{type:Boolean,state:true},_stale:{type:Boolean,state:true},_collapsed:{type:Object,state:true}}}constructor(){super(),this.editor=void 0,this.config=void 0,this.hass=void 0,this._provenance=null,this._provenanceTracker=null,this._card=void 0,this._cardConfig=null,this._open=false,this._view="fields",this._search="",this._show="all",this._selected="",this._selectedToken="",this._live=true,this._stale=false,this._collapsed=new Set,this._unsubscribe=null}static get styles(){return[te,T,W,w`
            :host {
                display: block;
            }

            .studio-layout {
                grid-template-columns: minmax(280px, 38%) 1fr;
                grid-template-rows: minmax(0, 1fr); /* one row at every width (see studio-dialog-styles.js) */
            }

            .left-head {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-2);
                padding: var(--ha-space-3) var(--ha-space-4) var(--ha-space-2);
                border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
            }

            .left-head ha-input,
            .left-head ha-selector {
                display: block;
                width: 100%;
            }

            .list {
                flex: 1;
                overflow-y: auto;
                padding: var(--ha-space-2);
                min-height: 0;
            }

            .row {
                display: flex;
                align-items: center;
                gap: var(--ha-space-2);
                padding: 5px var(--ha-space-2);
                padding-left: calc(var(--ha-space-2) + var(--depth, 0) * var(--ha-space-4));
                border-radius: var(--ha-border-radius-sm);
                cursor: pointer;
                color: var(--primary-text-color);
                font-size: 14px;
                user-select: none;
            }

            .row:hover {
                background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
            }

            .row.selected {
                background: color-mix(in srgb, var(--primary-color) 28%, transparent);
            }

            .row .name {
                flex: 1;
                min-width: 0;
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .row .twisty {
                --mdc-icon-size: 16px;
                width: 16px;
                flex: none;
                color: var(--secondary-text-color);
            }

            .row .marks {
                display: flex;
                gap: 2px;
                --mdc-icon-size: 14px;
                color: var(--secondary-text-color);
            }

            .badge {
                flex: none;
                font-size: 12px;
                font-weight: 600;
                padding: 2px var(--ha-space-2);
                border-radius: var(--ha-border-radius-pill);
                white-space: nowrap;
                color: var(--primary-text-color);
                background: color-mix(in srgb, var(--secondary-text-color) 22%, transparent);
            }

            .badge.user { background: color-mix(in srgb, var(--success-color) 30%, transparent); }
            .badge.preset { background: color-mix(in srgb, var(--warning-color) 30%, transparent); }
            .badge.theme { background: color-mix(in srgb, var(--info-color, #03a9f4) 30%, transparent); }
            .badge.rule { background: color-mix(in srgb, var(--error-color) 32%, transparent); }

            .empty {
                padding: var(--ha-space-6) var(--ha-space-4);
                text-align: center;
            }

            /* Detail pane */
            .preview-panel {
                overflow-y: auto;
                padding: var(--ha-space-4);
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-3);
            }

            .head-row {
                display: flex;
                align-items: center;
                gap: var(--ha-space-2);
                flex-wrap: wrap;
            }

            .head-row .live {
                display: flex;
                align-items: center;
                gap: var(--ha-space-1);
                margin-left: auto;
            }

            .chip {
                font-size: 12px;
                padding: 2px var(--ha-space-2);
                border-radius: var(--ha-border-radius-pill);
                background: color-mix(in srgb, var(--primary-text-color) 10%, transparent);
                color: var(--secondary-text-color);
            }

            .chip.alert {
                background: color-mix(in srgb, var(--error-color) 30%, transparent);
                color: var(--primary-text-color);
            }

            .detail-title {
                display: flex;
                align-items: center;
                gap: var(--ha-space-2);
            }

            .detail-title h3 {
                margin: 0;
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
                font-size: 16px;
                color: var(--primary-text-color);
                overflow-wrap: anywhere;
            }

            .detail-title ha-icon-button,
            .head-row ha-icon-button {
                --ha-icon-button-size: 32px;
                --mdc-icon-size: 18px;
                color: var(--secondary-text-color);
            }

            .now {
                background: var(--primary-background-color);
                border-radius: var(--ha-border-radius-lg);
                padding: var(--ha-space-3) var(--ha-space-4);
            }

            .now .label {
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: var(--secondary-text-color);
            }

            .now .value {
                display: flex;
                align-items: center;
                gap: var(--ha-space-2);
                margin-top: var(--ha-space-1);
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
                font-size: 18px;
                color: var(--primary-text-color);
                overflow-wrap: anywhere;
            }

            .now .hint {
                margin: var(--ha-space-1) 0 0;
            }

            .swatch {
                flex: none;
                display: inline-block;
                width: 16px;
                height: 16px;
                border-radius: var(--ha-border-radius-sm);
                border: var(--ha-border-width-sm) solid var(--divider-color);
            }

            .trail-title {
                margin: var(--ha-space-2) 0 0;
                font-size: 14px;
                font-weight: 600;
                color: var(--primary-text-color);
            }

            .trail {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-2);
                background: var(--primary-background-color);
                border-radius: var(--ha-border-radius-lg);
                padding: var(--ha-space-3);
            }

            .step {
                display: grid;
                grid-template-columns: 24px 1fr;
                gap: var(--ha-space-2);
                align-items: start;
                padding: var(--ha-space-2);
                border-radius: var(--ha-border-radius-md);
                background: color-mix(in srgb, var(--primary-text-color) 5%, transparent);
            }

            .step.wins {
                box-shadow: inset var(--ha-border-width-lg) 0 0 var(--primary-color);
                background: color-mix(in srgb, var(--primary-color) 12%, transparent);
            }

            .step.overridden {
                opacity: 0.6;
            }

            .step > ha-icon {
                --mdc-icon-size: 18px;
                color: var(--secondary-text-color);
                margin-top: 1px;
            }

            .step .what {
                font-size: 13px;
                font-weight: 600;
                color: var(--primary-text-color);
            }

            .step .what .tag {
                font-weight: 400;
                color: var(--secondary-text-color);
                margin-left: var(--ha-space-1);
            }

            .step .val {
                display: flex;
                align-items: center;
                gap: var(--ha-space-2);
                margin-top: 2px;
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
                font-size: 13px;
                color: var(--secondary-text-color);
                overflow-wrap: anywhere;
            }

            .step .swatch {
                width: 12px;
                height: 12px;
            }

            .step .sub {
                font-size: 12px;
                color: var(--secondary-text-color);
                margin-top: 2px;
                overflow-wrap: anywhere;
            }

            .chain {
                display: flex;
                flex-direction: column;
                gap: 2px;
                margin-top: var(--ha-space-1);
            }

            .uses {
                display: flex;
                flex-wrap: wrap;
                gap: var(--ha-space-1);
            }

            .uses button,
            .link {
                all: unset;
                cursor: pointer;
                font-family: var(--code-font-family, var(--ha-font-family-code, monospace));
                font-size: 13px;
                padding: 2px var(--ha-space-2);
                border-radius: var(--ha-border-radius-pill);
                background: color-mix(in srgb, var(--primary-color) 18%, transparent);
                color: var(--primary-text-color);
            }

            .uses button:focus-visible,
            .uses button:hover,
            .link:focus-visible,
            .link:hover {
                background: color-mix(in srgb, var(--primary-color) 32%, transparent);
            }

            .placeholder {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: var(--ha-space-2);
                flex: 1;
                color: var(--secondary-text-color);
                text-align: center;
            }

            .placeholder ha-icon {
                --mdc-icon-size: 40px;
                opacity: 0.6;
            }
        `]}disconnectedCallback(){var e;super.disconnectedCallback(),(e=this._unsubscribe)==null||e.call(this),this._unsubscribe=null,this._card=void 0}updated(e){e.has("config")&&this.config&&this._loadProvenance()}async _loadProvenance(){var e,t;try{const a=this.config?(t=(e=window.lcards)==null?void 0:e.findCardByConfig)==null?void 0:t.call(e,this.config):null;this._setCard(a&&typeof a.getProvenance=="function"?a:null)}catch(a){$.error("[ProvenanceTab] Failed to load provenance:",a),this._setCard(null)}}_setCard(e){var t,a;e!==this._card&&((t=this._unsubscribe)==null||t.call(this),this._unsubscribe=((a=e==null?void 0:e.subscribeProvenance)==null?void 0:a.call(e,()=>{this._live?this._read():this._stale=true}))??null,this._card=e),this._read()}_read(){const e=this._card;this._provenance=e?e.getProvenance():null,this._provenanceTracker=(e==null?void 0:e._provenanceTracker)??null,this._cardConfig=(e==null?void 0:e.config)??null,this._stale=false}_fields(){var s;const e=this._provenance;if(!e)return[];const t=new Map,a=u(i=>(t.has(i)||t.set(i,{path:i,layers:null,final:null,runtime:[],rule:null,template:null,tokens:[]}),t.get(i)),"get");for(const[i,r]of Object.entries(((s=e.config)==null?void 0:s.field_sources)??{})){const l=a(i);l.layers=typeof r=="string"?{[r]:void 0}:r.layers,l.final=typeof r=="string"?r:r.final}for(const[i,r]of Object.entries(e.runtime??{}))a(i).runtime=r;for(const[i,r]of Object.entries(e.rule_patches??{}))a(i).rule=r;for(const[i,r]of Object.entries(e.templates??{}))i.startsWith("template:")||(a(i).template=r);for(const[i,r]of Object.entries(e.theme_tokens??{}))for(const l of r.used_by_fields??[])Et(l)&&a(l).tokens.push(i);for(const i of t.values())i.source=i.rule?"rules":i.final??(i.runtime.length?i.runtime[i.runtime.length-1].layer:null);return[...t.values()].sort((i,r)=>i.path.localeCompare(r.path))}_filtered(){const e=this._search.trim().toLowerCase(),t={all:u(()=>true,"all"),changed:u(a=>a.final==="user_config"||!!a.rule||!!a.template,"changed"),rules:u(a=>!!a.rule,"rules"),templates:u(a=>!!a.template,"templates"),tokens:u(a=>a.tokens.length>0,"tokens"),runtime:u(a=>a.runtime.length>0,"runtime")}[this._show]??(()=>true);return this._fields().filter(a=>t(a)&&(!e||a.path.toLowerCase().includes(e)))}_rows(e){const t={children:new Map};for(const r of e){const l=r.path.split(".");let c=t;l.forEach((d,h)=>{const p=l.slice(0,h+1).join(".");c.children.has(d)||c.children.set(d,{seg:d,path:p,children:new Map,field:null}),c=c.children.get(d)}),c.field=r}const a=[],s=!!this._search.trim()||this._show!=="all",i=u((r,l)=>{for(const c of[...r.children.values()].sort((d,h)=>d.seg.localeCompare(h.seg))){const d=c.children.size>0,h=s||!this._collapsed.has(c.path);a.push({...c,depth:l,folder:d,open:h}),d&&h&&i(c,l+1)}},"walk");return i(t,0),a}_tokens(){var t;const e=this._search.trim().toLowerCase();return Object.entries(((t=this._provenance)==null?void 0:t.theme_tokens)??{}).map(([a,s])=>({path:a,...s})).filter(a=>!e||a.path.toLowerCase().includes(e)||(a.used_by_fields??[]).some(s=>s.toLowerCase().includes(e))).sort((a,s)=>a.path.localeCompare(s.path))}_concrete(e){const a=[...(e==null?void 0:e.resolution_chain)??[]].reverse().find(s=>s.step==="value");return(a==null?void 0:a.value)??(e==null?void 0:e.resolved_value)}_openInspector(){this._loadProvenance(),this._open=true}_close(){this._open=false}_toggleLive(e){this._live=e.target.checked,this._live&&this._read()}_toggleFolder(e){const t=new Set(this._collapsed);t.has(e)?t.delete(e):t.add(e),this._collapsed=t}_selectField(e){this._view="fields",this._selected=e}_selectToken(e){this._view="tokens",this._selectedToken=e}render(){const e=this._provenance,t=this._fields();return n`
            ${H({icon:"mdi:layers-search",title:"Provenance",description:"Where each of this card's values comes from: its config and preset, the theme, rules, templates and the card itself.",stats:e?[{value:t.length,label:"fields"},{value:Object.keys(e.theme_tokens??{}).length,label:"theme tokens"},{value:new Set(Object.values(e.rule_patches??{}).map(a=>a.rule_id)).size,label:"rules applying now"},{value:t.filter(a=>a.template).length,label:"templates"}]:[],actions:[{label:"Open inspector",icon:"mdi:file-tree",onClick:u(()=>this._openInspector(),"onClick")}]})}
            ${!e&&this._card===null?n`<p class="hint">No rendered card for this config yet: provenance comes from the card editor's preview. Layout cards and the alert overlay don't record provenance.</p>`:v}
            ${this._open?this._renderInspector():v}
        `}_renderInspector(){const e=this._provenance,t=(e==null?void 0:e.context)??{};return n`
            <ha-dialog
                open
                flexcontent
                header-title=${`Provenance: ${t.card_id||t.card_type||"card"}`}
                @closed=${a=>{a.stopPropagation(),a.target===a.currentTarget&&this._close()}}>
                <div class="dialog-content">
                    <div class="studio-layout">
                        <div class="config-panel">
                            <ha-tab-group @wa-tab-show=${a=>{var i,r;a.stopPropagation();const s=(r=(i=a.target.activeTab)==null?void 0:i.getAttribute)==null?void 0:r.call(i,"value");s&&(this._view=s)}}>
                                <ha-tab-group-tab value="fields" ?active=${this._view==="fields"}>
                                    <ha-icon icon="mdi:file-tree"></ha-icon>
                                    Fields
                                </ha-tab-group-tab>
                                <ha-tab-group-tab value="tokens" ?active=${this._view==="tokens"}>
                                    <ha-icon icon="mdi:palette"></ha-icon>
                                    Tokens
                                </ha-tab-group-tab>
                            </ha-tab-group>
                            ${this._renderLeft()}
                        </div>
                        <div class="preview-panel">
                            ${this._renderHeadRow(t)}
                            ${e?this._view==="tokens"?this._renderTokenDetail():this._renderFieldDetail():n`<div class="placeholder"><ha-icon icon="mdi:card-search-outline"></ha-icon><p>No rendered card for this config.</p></div>`}
                        </div>
                    </div>
                </div>
                <ha-dialog-footer slot="footer">
                    <ha-button slot="primaryAction" data-dialog="close">Close</ha-button>
                </ha-dialog-footer>
            </ha-dialog>
        `}_renderHeadRow(e){return n`
            <div class="head-row">
                ${e.theme?n`<span class="chip">Theme: ${e.theme}</span>`:v}
                ${e.alert_mode&&e.alert_mode!=="green_alert"?n`<span class="chip alert">Alert mode: ${e.alert_mode}</span>`:v}
                ${e.token_overrides?n`<span class="chip">${e.token_overrides} token overrides</span>`:v}
                ${e.entity?n`<span class="chip">${e.entity}: ${e.entity_state??"-"}</span>`:v}
                <span class="live">
                    ${this._live?v:n`
                        <ha-icon-button class="refresh" .label=${"Refresh"} title="Refresh" @click=${()=>this._read()}>
                            <ha-icon icon=${this._stale?"mdi:refresh-circle":"mdi:refresh"}></ha-icon>
                        </ha-icon-button>
                    `}
                    <ha-switch class="live-switch" .checked=${this._live} @change=${this._toggleLive}>${this._live?"Live":this._stale?"Paused (changed)":"Paused"}</ha-switch>
                </span>
            </div>
        `}_renderLeft(){return n`
            <div class="left-head">
                <ha-input
                    class="search"
                    .value=${this._search}
                    .label=${this._view==="tokens"?"Search tokens or fields":"Search fields"}
                    @input=${e=>{this._search=e.target.value??""}}>
                </ha-input>
                ${this._view==="fields"?n`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Show"}
                        .required=${false}
                        .selector=${{select:{mode:"dropdown",options:Ms}}}
                        .value=${this._show}
                        @value-changed=${e=>{e.stopPropagation(),this._show=e.detail.value||"all"}}>
                    </ha-selector>
                `:v}
            </div>
            <div class="list">
                ${this._view==="tokens"?this._renderTokenList():this._renderFieldList()}
            </div>
        `}_renderFieldList(){const e=this._filtered();return e.length?this._rows(e).map(t=>n`
            <div class="row field-row ${t.field&&t.path===this._selected?"selected":""}"
                data-path=${t.path}
                style=${U({"--depth":String(t.depth)})}
                @click=${()=>t.folder&&!t.field?this._toggleFolder(t.path):this._selectField(t.path)}>
                ${t.folder?n`<ha-icon class="twisty" icon=${t.open?"mdi:chevron-down":"mdi:chevron-right"}
                        @click=${a=>{a.stopPropagation(),this._toggleFolder(t.path)}}></ha-icon>`:n`<span class="twisty"></span>`}
                <span class="name">${t.seg}</span>
                ${t.field?n`
                    <span class="marks">
                        ${t.field.template?n`<ha-icon icon="mdi:code-braces" title="Template"></ha-icon>`:v}
                        ${t.field.tokens.length?n`<ha-icon icon="mdi:palette" title="Theme token"></ha-icon>`:v}
                    </span>
                    <span class="badge ${zs(t.field.source)}">${le(t.field.source)}</span>
                `:v}
            </div>
        `):n`<p class="hint empty">No fields match.</p>`}_renderTokenList(){const e=this._tokens();return e.length?e.map(t=>{const a=this._concrete(t);return n`
                <div class="row token-row ${t.path===this._selectedToken?"selected":""}" data-path=${t.path} @click=${()=>this._selectToken(t.path)}>
                    ${Ot(a)?n`<span class="swatch" style=${U({background:a})}></span>`:n`<ha-icon class="twisty" icon="mdi:palette"></ha-icon>`}
                    <span class="name">${t.path}</span>
                    <span class="badge" title="Fields using it">${(t.used_by_fields??[]).length}</span>
                </div>
            `}):n`<p class="hint empty">No theme tokens recorded for this card.</p>`}_renderFieldDetail(){var r,l;const e=this._fields().find(c=>c.path===this._selected);if(!e)return n`<div class="placeholder"><ha-icon icon="mdi:cursor-default-click-outline"></ha-icon>
                <p>Select a field to see its value and how it got there.</p></div>`;const t=e.runtime.find(c=>c.layer==="state"),a=Ns(this._cardConfig,e.path),s=t?t.value:a!==void 0?a:((r=e.rule)==null?void 0:r.patched_value)??((l=e.runtime[e.runtime.length-1])==null?void 0:l.value),i=e.tokens.length?this._concrete(this._provenance.theme_tokens[e.tokens[0]]):void 0;return n`
            <div class="detail-title">
                <h3>${e.path}</h3>
                <ha-icon-button .label=${"Copy field path"} title="Copy field path" @click=${()=>E(e.path)}>
                    <ha-icon icon="mdi:content-copy"></ha-icon>
                </ha-icon-button>
            </div>
            <div class="now">
                <div class="label">Value now</div>
                <div class="value">${this._swatch(i??s)}${A(s)}</div>
                ${i!==void 0&&i!==s?n`<p class="hint">On this card: ${A(i)}</p>`:v}
            </div>
            <p class="trail-title">How it got here</p>
            <div class="trail">
                ${this._configSteps(e)}
                ${e.runtime.map(c=>this._runtimeStep(c))}
                ${e.tokens.map(c=>this._tokenStep(c))}
                ${e.template?this._templateStep(e.template):v}
                ${e.rule?this._ruleStep(e.rule):v}
            </div>
        `}_configSteps(e){var a;return e.layers?(((a=this._provenance.config)==null?void 0:a.merge_order)??Object.keys(e.layers)).filter(s=>s in e.layers).map(s=>{const i=s===e.final&&!e.rule;return n`
                <div class="step config-step ${i?"wins":"overridden"}">
                    <ha-icon icon=${At(s)}></ha-icon>
                    <div>
                        <div class="what">${le(s)}<span class="tag">${i?"sets it":"replaced below"}</span></div>
                        <div class="val">${this._swatch(e.layers[s])}${A(e.layers[s])}</div>
                    </div>
                </div>
            `}):v}_runtimeStep(e){const t=e.detail??{},a=[e.layer==="state"&&`branch "${t.state??"none"}" for state ${t.entityState??"-"}${t.classified?` (${t.classified})`:""}`,t.matchLight!==void 0&&`light colour ${t.matchLight}`,t.component&&`component ${t.component}`,t.preset&&`preset ${t.preset}`,t.token&&`from theme:${t.token}${t.fallback?" (not in the theme: the card's fallback)":""}`,t.from].filter(Boolean);return n`
            <div class="step runtime-step" data-layer=${e.layer}>
                <ha-icon icon=${At(e.layer)}></ha-icon>
                <div>
                    <div class="what">${le(e.layer)}<span class="tag">applied by the card</span></div>
                    <div class="val">${this._swatch(e.value)}${A(e.value)}</div>
                    ${a.length?n`<div class="sub">${a.join(" · ")}</div>`:v}
                </div>
            </div>
        `}_tokenStep(e){const t=this._provenance.theme_tokens[e];return t?n`
            <div class="step token-step">
                <ha-icon icon="mdi:palette"></ha-icon>
                <div>
                    <div class="what">Theme token<span class="tag">${t.original_ref}</span></div>
                    <div class="chain">${(t.resolution_chain??[]).map(a=>this._chainLine(a))}</div>
                    <div class="sub"><button class="link" @click=${()=>this._selectToken(e)}>Open token</button></div>
                </div>
            </div>
        `:v}_templateStep(e){var t;return n`
            <div class="step template-step">
                <ha-icon icon="mdi:code-braces"></ha-icon>
                <div>
                    <div class="what">Template<span class="tag">${e.processor}</span></div>
                    <div class="val">${e.original}</div>
                    <div class="sub">Result: ${A(e.processed)}</div>
                    ${(t=e.dependencies)!=null&&t.length?n`<div class="sub">Uses: ${e.dependencies.join(", ")}</div>`:v}
                </div>
            </div>
        `}_ruleStep(e){return n`
            <div class="step rule-step wins">
                <ha-icon icon="mdi:format-list-checks"></ha-icon>
                <div>
                    <div class="what">Rule ${e.rule_id}<span class="tag">applying now</span></div>
                    <div class="val">${this._swatch(e.patched_value)}${A(e.patched_value)}</div>
                    <div class="sub">Was ${A(e.original_value)} · when ${e.rule_condition}</div>
                </div>
            </div>
        `}_chainLine(e){var s;const t=((s=ne[e.step])==null?void 0:s.label)??e.step,a=e.path??e.variable??e.expression;return n`
            <div class="val">
                ${this._swatch(e.value)}
                <span>${t}${e.scope?` (${e.scope})`:""}: ${a??""}${a&&e.value!==void 0?" → ":""}${e.value!==void 0?A(e.value):""}</span>
            </div>
        `}_swatch(e){return Ot(e)?n`<span class="swatch" style=${U({background:e})}></span>`:v}_renderTokenDetail(){var a;const e=(a=this._provenance.theme_tokens)==null?void 0:a[this._selectedToken];if(!e)return n`<div class="placeholder"><ha-icon icon="mdi:palette-outline"></ha-icon>
                <p>Select a theme token to see how it resolves and where this card uses it.</p></div>`;const t=this._concrete(e);return n`
            <div class="detail-title">
                <h3>theme:${this._selectedToken}</h3>
                <ha-icon-button .label=${"Copy token"} title="Copy token" @click=${()=>E(`theme:${this._selectedToken}`)}>
                    <ha-icon icon="mdi:content-copy"></ha-icon>
                </ha-icon-button>
            </div>
            <div class="now">
                <div class="label">Value on this card</div>
                <div class="value">${this._swatch(t)}${A(t)}</div>
            </div>
            <p class="trail-title">How it resolves</p>
            <div class="trail">
                ${(e.resolution_chain??[]).map(s=>{var i,r;return n`
                    <div class="step chain-step ${s.step==="value"||s.step==="override"?"wins":""}" data-step=${s.step}>
                        <ha-icon icon=${((i=ne[s.step])==null?void 0:i.icon)??"mdi:circle-small"}></ha-icon>
                        <div>
                            <div class="what">${((r=ne[s.step])==null?void 0:r.label)??s.step}${s.scope?n`<span class="tag">${s.scope} scope</span>`:v}</div>
                            <div class="val">${this._swatch(s.value)}${s.path??s.variable??s.expression??A(s.value)}${(s.path||s.variable||s.expression)&&s.value!==void 0?` → ${A(s.value)}`:""}</div>
                        </div>
                    </div>
                `})}
            </div>
            <p class="trail-title">Used by</p>
            <div class="uses">
                ${(e.used_by_fields??[]).map(s=>Et(s)?n`<button @click=${()=>this._selectField(s)}>${s}</button>`:n`<span class="chip">${s}</span>`)}
            </div>
        `}};u(ut,"LCARdSProvenanceTab");let Pe=ut;customElements.get("lcards-provenance-tab")||customElements.define("lcards-provenance-tab",Pe);const pt=class pt2 extends S{static get properties(){return{hass:{type:Object},config:{type:Object},cardType:{type:String},_selectedTab:{type:Number,state:true},_yamlValue:{type:String,state:true},_validationErrors:{type:Array,state:true},_singletons:{type:Object,state:true},_schemaMissing:{type:Boolean,state:true},_developerSubTab:{type:Number,state:true}}}constructor(){super(),this.hass=void 0,this.lovelace=void 0,this.config={},this.cardType="",this._selectedTab=0,this._yamlValue="",this._validationErrors=[],this._singletons=null,this._isUpdatingYaml=false,this._configUpdateDebounce=null,this._schemaMissing=false,this._developerSubTab=0}static get styles(){return[ee,T,w`
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
        `]}setConfig(e){var t;if(!e)throw new Error("Invalid configuration");$.debug("[LCARdSBaseEditor] setConfig called with:",e),this.config=typeof globalThis.structuredClone=="function"?globalThis.structuredClone(e):JSON.parse(JSON.stringify(e)),!this.config.type&&this.cardType&&($.warn('[LCARdSBaseEditor] Config is missing required "type" property! Auto-restoring...'),this.config.type=`custom:lcards-${this.cardType}`,$.warn(`[LCARdSBaseEditor] Auto-restored type to: ${this.config.type}`)),this._yamlValue=M(this.config),this._validateConfig(),$.debug("[LCARdSBaseEditor] Config initialized:",{config:this.config,yaml:this._yamlValue}),(t=window.lcards)!=null&&t.core&&(this._singletons=window.lcards.core),this.requestUpdate("config")}_handleChildConfigChange(e){var a;e.stopPropagation();const t=(a=e.detail)==null?void 0:a.config;t&&this._updateConfig(t)}_getTabDefinitions(){return[]}render(){const e=this._getTabDefinitions();return n`
            <div class="editor-container" @config-changed=${this._handleChildConfigChange}>
                ${this._schemaMissing?n`
                    <ha-alert alert-type="error" title="Schema Not Registered">
                        <p>
                            The schema for card type <code>${this.cardType}</code> is not registered.
                        </p>
                        <p>
                            <strong>For maintainers:</strong> Register a schema for this card type using:
                            <code>core.configManager.registerCardSchema('${this.cardType}', schema)</code>
                        </p>
                        <p>
                            See <a href=${N(I.buildingAnEditor)} target="_blank" rel="noopener">Building a Studio Editor</a>
                            for more information on schema registration.
                        </p>
                    </ha-alert>
                `:""}

                ${this._renderValidationErrors()}

                <!-- Using HA native tab components (Issue #82) -->
                <ha-tab-group @wa-tab-show=${this._handleTabChange}>
                    ${e.map((t,a)=>n`
                        <ha-tab-group-tab value="${a}" ?active=${this._selectedTab===a}>
                            ${t.label}
                        </ha-tab-group-tab>
                    `)}

                    ${e.map((t,a)=>n`
                        <div class="tab-panel" ?hidden=${this._selectedTab!==a}>
                            ${this._renderTabContent(t)}
                        </div>
                    `)}
                </ha-tab-group>
            </div>
        `}_renderTabContent(e){if(!e||!e.content)return n`<div>No content available</div>`;const t=e.docs??Ta(this.cardType,e.label);return n`
            ${t?n`
                <div class="tab-docs">
                    <a href=${N(t)} target="_blank" rel="noopener noreferrer">
                        Docs<ha-icon icon="mdi:open-in-new"></ha-icon>
                    </a>
                </div>
            `:""}
            ${e.content()}
        `}_handleTabChange(e){var a;const t=(a=e.target.activeTab)==null?void 0:a.getAttribute("value");t!=null&&(this._selectedTab=parseInt(t,10),this.requestUpdate())}_updateConfig(e,t="visual"){if(!e||typeof e!="object"){$.warn("[LCARdSBaseEditor] Invalid config updates:"+JSON.stringify(e));return}this.config,this.config=ha(this.config,e),this.config.type||($.warn('[LCARdSBaseEditor] Config is missing required "type" property after merge! Auto-restoring...'),this.config.type=`custom:lcards-${this.cardType}`,$.warn(`[LCARdSBaseEditor] Auto-restored type to: ${this.config.type}`)),this._validateConfig(),t==="visual"&&!this._isUpdatingYaml&&(this._isUpdatingYaml=true,this._yamlValue=M(this.config),requestAnimationFrame(()=>{this._isUpdatingYaml=false})),this._configUpdateDebounce&&clearTimeout(this._configUpdateDebounce),this._configUpdateDebounce=setTimeout(()=>{D(this,"config-changed",{config:this.config}),this._configUpdateDebounce=null},50)}_handleYamlChange(e){if(this._isUpdatingYaml)return;this._yamlValue=e.detail.value;const t=Aa(this._yamlValue);if(!t.valid){this._validationErrors=[{message:`YAML Syntax Error: ${t.error}`,line:t.lineNumber}],this.requestUpdate();return}try{const a=K(this._yamlValue),s=this._validateConfigWithSingleton(a);this._validationErrors=s.errors.map(i=>({path:i.field||"",message:i.message})),s.valid&&(this._isUpdatingYaml=true,this.config=a,D(this,"config-changed",{config:this.config}),requestAnimationFrame(()=>{this._isUpdatingYaml=false})),this.requestUpdate()}catch(a){this._validationErrors=[{message:`Parse Error: ${a.message}`}],this.requestUpdate()}}_validateConfigWithSingleton(e){var s,i;const t=(i=(s=window.lcards)==null?void 0:s.core)==null?void 0:i.validationService,a=this._getSchema();return!t||!a?{valid:true,errors:[],warnings:[]}:t.validate(e,a,{cardType:this.cardType,source:"editor"})}_validateConfig(){const e=this._validateConfigWithSingleton(this.config),t=(e.errors||[]).map(s=>({path:s.field||"",message:s.message,severity:"error"})),a=(e.warnings||[]).map(s=>({path:s.field||"",message:s.message,severity:"warning"}));this._validationErrors=[...t,...a]}get _isLightEntity(){var e;return typeof((e=this.config)==null?void 0:e.entity)=="string"&&this.config.entity.startsWith("light.")}_getSchema(){var a,s;const e=(s=(a=window.lcards)==null?void 0:a.core)==null?void 0:s.configManager;if(!e)return $.warn("⚠️ [LCARdSBaseEditor] CoreConfigManager not available"),this._schemaMissing=true,{};const t=e.getCardSchema(this.cardType);return t?(this._schemaMissing=false,t):($.warn(`⚠️ [LCARdSBaseEditor] No schema registered for card type: ${this.cardType}`),this._schemaMissing=true,{})}_getConfigValue(e){if(!e)return;const t=e.split(".");let a=this.config;for(const s of t){if(a==null)return;a=a[s]}return a}_setConfigValue(e,t){if(!e){$.warn("⚠️ [LCARdSBaseEditor] Cannot set config value with empty path");return}const a=e.split(".");if(a.some(c=>!isNaN(Number(c)))){const c=JSON.parse(JSON.stringify(this.config||{}));let d=c;for(let f=0;f<a.length-1;f++){const b=a[f];if(b==="__proto__"||b==="constructor"||b==="prototype")return;const _=a[f+1];!isNaN(Number(_))?Array.isArray(d[b])||(d[b]=[]):(!d[b]||typeof d[b]!="object")&&(d[b]={}),d=d[b]}const h=a[a.length-1];if(h==="__proto__"||h==="constructor"||h==="prototype")return;d[h]=t;const p=this.config;this.config=c,D(this,"config-changed",{config:this.config}),this.requestUpdate("config",p);return}const i={};let r=i;for(let c=0;c<a.length-1;c++){const d=a[c];if(d==="__proto__"||d==="constructor"||d==="prototype")return;r[d]={},r=r[d]}const l=a[a.length-1];l==="__proto__"||l==="constructor"||l==="prototype"||(r[l]=t,t==null||t===""?this._removeConfigPath(e):this._updateConfig(i))}_removeConfigPath(e){if(!e)return;const t=e.split(".");if(t.some(r=>r==="__proto__"||r==="constructor"||r==="prototype"))return;const a=JSON.parse(JSON.stringify(this.config||{}));let s=a;for(let r=0;r<t.length-1;r++){if(!s[t[r]])return;s=s[t[r]]}delete s[t[t.length-1]];for(let r=t.length-2;r>=0;r--){const l=t.slice(0,r+1);let c=a;for(let p=0;p<l.length-1;p++)c=c[l[p]];const d=l[l.length-1],h=c[d];if(h&&typeof h=="object"&&!Array.isArray(h))if(Object.keys(h).length===0)delete c[d];else break;else break}const i=this.config;this.config=a,D(this,"config-changed",{config:this.config}),this.requestUpdate("config",i)}_getSchemaForPath(e){if(!e)return null;const t=this._getSchema();if(!t||!t.properties)return null;const a=e.split(".");let s=t;for(const i of a){if(!isNaN(Number(i))&&s.type==="array"&&s.items){s=s.items;continue}if(s.properties&&s.properties[i]){s=s.properties[i];continue}if(s.patternProperties){let r=false,l=0,c=null;for(const[d,h]of Object.entries(s.patternProperties))try{new RegExp(d).test(i)&&(l++,r||(s=h,c=d,r=true))}catch(p){$.warn("⚠️ [LCARdSBaseEditor] Invalid regex in patternProperties:",d,p)}if(l>1&&$.warn(`[BaseEditor] Multiple patternProperties matched key "${i}"; using first match.`),r)continue}if(s.additionalProperties){if(typeof s.additionalProperties=="object"){s=s.additionalProperties;continue}else if(s.additionalProperties===true)return{type:["string","number","boolean","object","array"],description:"Additional property (no specific schema defined)"}}if(Array.isArray(s.oneOf)){let r=false;for(const l of s.oneOf)if(l&&l.properties&&l.properties[i]){s=l.properties[i],r=true;break}if(r)continue}return null}return s}_evaluateCondition(e){if(!e)return true;try{return new Function("config","hass",`return ${e};`)(this.config,this.hass)}catch(t){return $.warn("⚠️ [LCARdSBaseEditor] Condition evaluation failed:",e,t),true}}_renderValidationErrors(){if(!this._validationErrors||this._validationErrors.length===0)return n``;const e=this._validationErrors.filter(a=>a.severity==="error"),t=this._validationErrors.filter(a=>a.severity==="warning");return n`
            ${e.length>0?n`
                <ha-alert alert-type="error" title="Validation Errors (${e.length})">
                    <ul>
                        ${e.map(a=>n`
                            <li>${a.path?`${a.path}: `:""}${a.message}</li>
                        `)}
                    </ul>
                </ha-alert>
            `:""}

            ${t.length>0?n`
                <ha-alert alert-type="warning" title="Validation Warnings (${t.length})">
                    <ul>
                        ${t.map(a=>n`
                            <li>${a.path?`${a.path}: `:""}${a.message}</li>
                        `)}
                    </ul>
                </ha-alert>
            `:""}
        `}_renderFromConfig(e){if(!e)return n``;if(Array.isArray(e))return n`${e.map(t=>this._renderFromConfig(t))}`;if(e.condition&&!this._evaluateCondition(e.condition))return n``;switch(e.type){case"section":return this._renderConfigSection(e);case"grid":return this._renderConfigGrid(e);case"field":return this._renderConfigField(e);case"custom":return this._renderConfigCustom(e);default:return $.warn("⚠️ [LCARdSBaseEditor] Unknown config type:",e.type),n``}}_renderConfigSection(e){const{header:t="",description:a="",icon:s="",expanded:i=false,outlined:r=true,headerLevel:l="4",children:c=[]}=e;return n`
            <lcards-form-section
                header="${t}"
                description="${a}"
                icon="${s}"
                ?expanded=${i}
                ?outlined=${r}
                headerLevel="${l}">
                ${this._renderFromConfig(c)}
            </lcards-form-section>
        `}_renderConfigGrid(e){const{children:t=[]}=e;return n`
            <lcards-grid-layout>
                ${this._renderFromConfig(t)}
            </lcards-grid-layout>
        `}_renderConfigField(e){const{path:t,label:a="",helper:s=""}=e;return t?O.renderField(this,t,{label:a,helper:s}):($.warn('⚠️ [LCARdSBaseEditor] Field config missing required "path":',e),n``)}_renderConfigCustom(e){const{render:t}=e;return typeof t!="function"?($.warn('⚠️ [LCARdSBaseEditor] Custom config missing "render" function:',e),n``):t.call(this)}_renderTextPadding(e){const t=this._getSchemaForPath(e);return t&&Array.isArray(t.oneOf)?O.renderField(this,e,{label:"Padding"}):n`
            <lcards-object-editor
                .editor=${this}
                .config=${this.config}
                path="${e}"
                .properties=${["top","right","bottom","left"]}
                controlType="number"
                .controlConfig=${{min:0,max:100,mode:"box"}}
                columns="2">
            </lcards-object-editor>
        `}_renderFontConfig(e){return n`
            <lcards-form-section
                header="Font Settings"
                description="Configure font size, weight, and family"
                icon="mdi:format-text"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="5">

                <lcards-grid-layout>
                    ${O.renderField(this,`${e}.font_size`,{label:"Font Size"})}

                    ${O.renderField(this,`${e}.font_weight`,{label:"Font Weight"})}

                    ${O.renderField(this,`${e}.font_family`,{label:"Font Family"})}
                </lcards-grid-layout>
            </lcards-form-section>
        `}_renderTextAlignment(e){return n`
            <lcards-form-section
                header="Text Alignment"
                description="Configure text alignment and positioning"
                icon="mdi:format-align-center"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="5">

                <lcards-grid-layout>
                    ${O.renderField(this,`${e}.position`,{label:"Position"})}

                    ${O.renderField(this,`${e}.rotation`,{label:"Rotation"})}

                    ${O.renderField(this,`${e}.justify`,{label:"Horizontal Align"})}

                    ${O.renderField(this,`${e}.align`,{label:"Vertical Align"})}
                </lcards-grid-layout>
            </lcards-form-section>
        `}_getRangesAttributeOptions(e=(t=>(t=this.config)==null?void 0:t.entity)()){return Oa(this.hass,e)}_renderRangesAttributeSelector(){var s,i;const e=(s=this.config)==null?void 0:s.entity,t=((i=this.config)==null?void 0:i.ranges_attribute)||"",a=[{value:"__none__",label:"(Use entity state)"},...this._getRangesAttributeOptions()];return n`
            <ha-selector
                .hass=${this.hass}
                .label=${"Range Attribute"}
                .helper=${'Attribute value compared against range conditions (above:/below:/between:). Select "(Use entity state)" to clear.'}
                .disabled=${!e}
                .selector=${{select:{mode:"dropdown",options:a,custom_value:true}}}
                .value=${t||"__none__"}
                @value-changed=${r=>{let l=(r.detail.value??"").trim();if(l==="__none__"||!l){this._removeConfigPath("ranges_attribute");return}l==="brightness"&&(l="brightness_pct"),this._setConfigValue("ranges_attribute",l)}}>
            </ha-selector>
        `}_getStateAttributeOptions(){var s,i,r;const e=(s=this.config)==null?void 0:s.entity,t=[];if(!e||!((r=(i=this.hass)==null?void 0:i.states)!=null&&r[e]))return t;const a=Object.keys(this.hass.states[e].attributes||{}).sort();for(const l of a)t.push({value:l,label:l});return t}_renderStateAttributeSelector(){var i,r,l,c;const e=(i=this.config)==null?void 0:i.entity,t=((r=this.config)==null?void 0:r.state_attribute)||"",a=e&&((c=(l=this.hass)==null?void 0:l.states)!=null&&c[e])?Object.keys(this.hass.states[e].attributes||{}).sort().map(d=>({value:d,label:d})):[],s=[{value:"__none__",label:"(Use entity state)"},...a];return n`
            <ha-selector
                .hass=${this.hass}
                .label=${"State Attribute"}
                .helper=${'Attribute whose string value is matched against color-config keys (e.g. "fade", "true"). Select "(Use entity state)" to clear.'}
                .disabled=${!e}
                .selector=${{select:{mode:"dropdown",options:s,custom_value:true}}}
                .value=${t||"__none__"}
                @value-changed=${d=>{const h=(d.detail.value??"").trim();if(h==="__none__"||!h){this._removeConfigPath("state_attribute");return}this._setConfigValue("state_attribute",h)}}>
            </ha-selector>
        `}_renderStateClassificationElseSelector(){var a,s;const e=((s=(a=this.config)==null?void 0:a.state_classification)==null?void 0:s.else)??"__none__",t=[{value:"__none__",label:"(Inactive, default)"},{value:"default",label:"Default"},{value:"active",label:"Active"},{value:"inactive",label:"Inactive"}];return n`
            <ha-selector
                .hass=${this.hass}
                .label=${"Unmapped State Class"}
                .helper=${'Style bucket for states not in the active/inactive lists. Use "Default" so custom zones reach your default colour instead of the preset inactive colour.'}
                .selector=${{select:{mode:"dropdown",options:t}}}
                .value=${e}
                @value-changed=${i=>{var l,c;const r=(i.detail.value??"").trim();if(r==="__none__"||!r){const d={...((l=this.config)==null?void 0:l.state_classification)??{}};delete d.else,Object.keys(d).length===0?this._removeConfigPath("state_classification"):this._setConfigValue("state_classification",d);return}this._setConfigValue("state_classification",{...((c=this.config)==null?void 0:c.state_classification)??{},else:r})}}>
            </ha-selector>
        `}_buildConfigTab(e={}){const{infoMessage:t="Configure your LCARdS card settings.",modeSections:a=[],basicFields:s=[{path:"entity"},{path:"id",label:"Card ID",helper:"[Optional] Custom ID for targeting with rules and animations"},{path:"tags",label:"Tags",helper:"Select existing tags or type new ones for rule targeting"}],showBasicSection:i=true,basicSectionHeader:r="Card Identification",basicSectionDescription:l="Identification for rules engine targeting",basicSectionIcon:c="mdi:cog",basicSectionExpanded:d=false}=e,h=[{type:"custom",render:u(()=>n`
                    <lcards-message type="info" message="${t}"></lcards-message>
                `,"render")},...a];return i&&s.length>0&&h.push({type:"section",header:r,description:l,icon:c,expanded:d,outlined:true,children:s.map(p=>({type:"field",path:p.path,label:p.label||"",helper:p.helper||""}))}),h}_cleanConfigForMode(e,t,a=[]){const s=["type","entity","id","tap_action","hold_action","double_tap_action","style"],i={};return s.forEach(r=>{e[r]!==void 0&&(i[r]=e[r])}),a.forEach(r=>{e[r]!==void 0&&(i[r]=e[r])}),i}_renderLayoutCardHint(){return customElements.get("layout-card")?n`
            ${fa({header:"Inside a custom:layout-card?",icon:"mdi:view-grid-outline",body:n`
                    <p>Cards can collapse to their minimum height in a <code>custom:layout-card</code> grid, and its
                        <code>card_margin</code> is ignored. Use LCARdS's own <strong>Layout Card</strong> instead:
                        change <code>type</code> to <code>custom:lcards-layout-card</code> and remove
                        <code>layout_type</code>. Your <code>layout</code> and <code>view_layout</code> keys stay the same.</p>
                    <div class="info-guide-links">
                        <a href=${N(I.sizingInLayoutCard)} target="_blank" rel="noopener noreferrer">Documentation</a>
                    </div>
                `})}
        `:n``}_renderDataSourcesTab(){return n`
            <lcards-datasource-editor-tab
                .editor=${this}
                .config=${this.config}
                .hass=${this.hass}>
            </lcards-datasource-editor-tab>
        `}_renderRulesTab(){return n`
            <lcards-rules-dashboard
                .editor=${this}
                .cardId=${this.config.id||this.config.cardId||""}
                .hass=${this.hass}>
            </lcards-rules-dashboard>
        `}_renderTemplatesTab(){return n`
            <lcards-template-evaluation-tab
                .editor=${this}
                .config=${this.config}
                .hass=${this.hass}>
            </lcards-template-evaluation-tab>
        `}_renderThemeTokensTab(){return n`
            <lcards-card-theme-tab
                .config=${this.config}
                .hass=${this.hass}>
            </lcards-card-theme-tab>
        `}_renderProvenanceTab(){return n`
            <lcards-provenance-tab
                .editor=${this}
                .config=${this.config}
                .hass=${this.hass}>
            </lcards-provenance-tab>
        `}_renderDeveloperTab(){var a;const e=this._developerSubTab||0,t=[{icon:"mdi:database",label:"Data Sources",render:u(()=>this._renderDataSourcesTab(),"render")},{icon:"mdi:format-list-checks",label:"Rules",render:u(()=>this._renderRulesTab(),"render")},{icon:"mdi:palette-swatch",label:"Theme",render:u(()=>this._renderThemeTokensTab(),"render")},{icon:"mdi:layers-search",label:"Provenance",render:u(()=>this._renderProvenanceTab(),"render")},{icon:"mdi:code-braces-box",label:"Templates",render:u(()=>this._renderTemplatesTab(),"render")}];return n`
            <p class="hint main-engineering-hint">
                This card's data sources, rules, theme tokens, templates, and where each setting comes from.
            </p>

            <ha-tab-group @wa-tab-show=${this._handleDeveloperSubTabChange}>
                ${t.map((s,i)=>n`
                    <ha-tab-group-tab value=${String(i)} ?active=${e===i}>
                        <ha-icon icon=${s.icon}></ha-icon>
                        ${s.label}
                    </ha-tab-group-tab>
                `)}
                <!-- Only the active sub-tab is rendered (the others would poll and load for nothing). -->
                <div class="tab-panel">${(a=t[e])==null?void 0:a.render()}</div>
            </ha-tab-group>
        `}_handleDeveloperSubTabChange(e){var a;e.stopPropagation();const t=(a=e.target.activeTab)==null?void 0:a.getAttribute("value");t!==null&&(this._developerSubTab=parseInt(t,10),this.requestUpdate())}_getUtilityTabs(){return[{label:"🖖 Main Engineering",content:u(()=>this._renderDeveloperTab(),"content")},{label:"YAML",content:u(()=>this._renderYamlTab(),"content")}]}_renderZonesTab(){var a,s;const e=((a=this.config)==null?void 0:a.zones)||{},t=((s=this.config)==null?void 0:s.debug_zones)===true;return n`
            <lcards-form-section
                header="Custom Zones"
                icon="mdi:vector-rectangle"
                ?expanded=${true}>
                <lcards-zone-list-editor
                    .zones=${e}
                    @zones-changed=${i=>{this.config={...this.config,zones:i.detail.value},this._updateConfig(this.config,"visual")}}>
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
                        @change=${i=>{const r={...this.config};i.target.checked?r.debug_zones=true:delete r.debug_zones,this.config=r,this._updateConfig(this.config,"visual")}}
                    ></ha-switch>
                </div>
            </lcards-form-section>
        `}_renderSoundTab(e=["card_tap","card_hold","card_double_tap","card_hover"]){return n`
            <lcards-card-sound-tab
                .editor=${this}
                .hass=${this.hass}
                .events=${e}
            ></lcards-card-sound-tab>
        `}_renderYamlTab(){return n`
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
        `}};u(pt,"LCARdSBaseEditor");let jt=pt;export{O as L,jt as a,La as b,Ma as e,D as f,Oa as g,Ua as n,te as s};
//# sourceMappingURL=LCARdSBaseEditor-DKqLTaC3.js.map
