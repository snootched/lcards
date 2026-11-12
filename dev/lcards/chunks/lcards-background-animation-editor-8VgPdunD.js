var S=Object.defineProperty;var p=(d,e)=>S(d,"name",{value:e,configurable:true});import{i as k,A as $,b as i,a as C,bq as E,br as h,C as F,l as z}from"./lcards-main-C148JfkA.js";import"./lcards-form-section-BK3OqcgA.js";import"./lcards-color-list-UVQhJ4eh.js";import{i as M,s as P,r as L}from"./lcards-message-CF99Ox_M.js";import{B as A}from"./docs-links-7RFmimYW.js";import{c as H}from"./grid-surface-model-DOWBJmGy.js";function O(d){var a,r,l,s;const e=(r=(a=window.lcards)==null?void 0:a.core)==null?void 0:r.assetManager;if(!e)return[];const t=new Map;for(const o of d){let n=[];try{n=((l=e.listAssets)==null?void 0:l.call(e,o))??[]}catch{n=[]}for(const c of n){const u=(s=e.getMetadata)==null?void 0:s.call(e,o,c);!(u!=null&&u.pack)||t.has(c)||t.set(c,u.label?`${u.label} (${c})`:c)}}return[...t].sort((o,n)=>o[0].localeCompare(n[0])).map(([o,n])=>({value:`builtin:${o}`,label:n}))}p(O,"assetLibraryOptions");function x(d,e={}){const t=typeof d=="string"?d:"";return e.none&&(t===""||t==="none")?"none":t.startsWith("builtin:")?"asset":t.startsWith("media-source://")?"media":e.bareKeys&&t&&!t.includes("/")&&!t.includes(":")?"asset":"custom"}p(x,"sourceMode");const _=class _2 extends k{static get properties(){return{hass:{attribute:false},value:{type:String},assetTypes:{attribute:false},assetOptions:{attribute:false},accept:{attribute:false},label:{type:String},assetLabel:{type:String},assetHelper:{type:String},customLabel:{type:String},customHelper:{type:String},mediaHelper:{type:String},noneLabel:{type:String},bareKeys:{type:Boolean},disabled:{type:Boolean},_mode:{state:true}}}constructor(){super(),this.hass=null,this.value="",this.assetTypes=["image","svg"],this.assetOptions=null,this.accept=["image/*"],this.label="Source",this.assetLabel="Built-in file",this.assetHelper="",this.customLabel="Path or URL",this.customHelper="A file in /config/www as /local/..., or an https:// URL.",this.mediaHelper="Browse the Home Assistant media library.",this.noneLabel="",this.bareKeys=false,this.disabled=false,this._mode=void 0}get _opts(){return{none:!!this.noneLabel,bareKeys:this.bareKeys}}willUpdate(e){(this._mode===void 0||e.has("value")&&!(this._mode==="custom"&&!this.value))&&(this._mode=x(this.value,this._opts))}get _options(){return this.assetOptions??O(this.assetTypes)}_emitValue(e){this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:e},bubbles:true,composed:true}))}_setMode(e){var a;const t=this._mode;if(e!==t){if(this._mode=e,e==="asset"&&x(this.value,this._opts)!=="asset"){const r=(a=this._options[0])==null?void 0:a.value;r&&this._emitValue(r)}else e==="none"&&this._emitValue("none");this.dispatchEvent(new CustomEvent("mode-changed",{detail:{mode:e,previous:t},bubbles:true,composed:true}))}}render(){var s;const e=this._mode??"custom",t=typeof this.value=="string"?this.value:"",a=[{value:"asset",label:"Asset library"},{value:"custom",label:"Custom path"},{value:"media",label:"Browse Home Assistant media"},...this.noneLabel?[{value:"none",label:this.noneLabel}]:[]],r=this._options,l=e==="custom"&&t.startsWith("http:")&&typeof location<"u"&&location.protocol==="https:";return i`
      <ha-selector class="mode" .hass=${this.hass} ?disabled=${this.disabled}
        .selector=${{select:{mode:"dropdown",options:a}}}
        .value=${e} .label=${this.label}
        @value-changed=${o=>{o.stopPropagation(),this._setMode(o.detail.value)}}
      ></ha-selector>
      ${e==="asset"?i`
        <ha-selector class="asset" .hass=${this.hass} ?disabled=${this.disabled}
          .selector=${{select:{mode:"dropdown",custom_value:r.length>=10,options:r}}}
          .value=${r.some(o=>o.value===t)||this.bareKeys?t:((s=r[0])==null?void 0:s.value)??""}
          .label=${this.assetLabel} .helper=${this.assetHelper}
          @value-changed=${o=>{o.stopPropagation(),this._emitValue(o.detail.value)}}
        ></ha-selector>`:e==="media"?i`
        <ha-selector class="media" .hass=${this.hass} ?disabled=${this.disabled}
          .selector=${{media:{accept:this.accept}}}
          .value=${t.startsWith("media-source://")?{media_content_id:t,media_content_type:""}:void 0}
          .label=${"Home Assistant media"} .helper=${this.mediaHelper}
          @value-changed=${o=>{var n;o.stopPropagation(),this._emitValue(((n=o.detail.value)==null?void 0:n.media_content_id)??"")}}
        ></ha-selector>`:e==="custom"?i`
        <ha-selector class="custom" .hass=${this.hass} ?disabled=${this.disabled}
          .selector=${{text:{}}}
          .value=${this.noneLabel&&t==="none"?"":t}
          .label=${this.customLabel} .helper=${this.customHelper}
          @value-changed=${o=>{o.stopPropagation(),this._emitValue(o.detail.value??"")}}
        ></ha-selector>`:$}
      ${l?i`<lcards-message type="warning"
        .message=${"http:// URLs are blocked as mixed content when Home Assistant is served over HTTPS. Use an https:// URL or a /local/ path instead."}></lcards-message>`:$}
    `}static get styles(){return C`
      :host { display: flex; flex-direction: column; gap: var(--ha-space-3); }
      ha-selector { display: block; width: 100%; }
    `}};p(_,"LCARdSAssetSourcePicker");let g=_;customElements.get("lcards-asset-source-picker")||customElements.define("lcards-asset-source-picker",g);const j=["view","surface","surface_size","surface_length","well_shape","well_throat","well_profile","well_profile_to","well_morph","well_ripple","well_ripple_waves","well_ripple_speed","surface_axis","surface_rotate_x","surface_rotate_y","surface_rotate_z","surface_side","back_opacity","camera_tilt","camera_yaw","camera_roll","camera_distance","fov","scan_period","scan_color"],w={"warp-starfield":[{header:"Stars",icon:"mdi:star-shooting",keys:["seed","count","min_radius","max_radius","streak","spectrum","spectrum_direction","opacity"]},{header:"Camera",icon:"mdi:axis-arrow",keys:["camera_tilt","camera_yaw","camera_roll","fov"]}],"holo-sphere":[{header:"Sphere",icon:"mdi:earth",keys:["size","position_x","position_y","tilt","rotate_speed","latitude_lines","longitude_lines","line_width","back_opacity","opacity"]},{header:"Scan band",icon:"mdi:radar",keys:["scan_period"]},{header:"Colours",icon:"mdi:palette",keys:["color","scan_color"]}]},D=["grid","grid-diagonal","grid-hexagonal"],R=p(d=>{const e=d.replace(/_/g," ");return e.charAt(0).toUpperCase()+e.slice(1)},"labelFor"),I=p(d=>d?d.split(new RegExp("(?<=\\.)\\s"))[0]:void 0,"firstSentence");function W(d,e){var l,s,o;const t={key:d,label:R(d),default:e.default,helper:I(e.description)};if(((l=e["x-ui-hints"])==null?void 0:l.widget)==="lcards-color-picker")return{...t,type:"color"};if(e.type==="boolean")return{...t,type:"boolean"};if(e.type==="array")return{...t,type:"list"};if(Array.isArray(e.enum))return{...t,type:"select",options:e.enum};const a=((o=(s=e["x-ui-hints"])==null?void 0:s.selector)==null?void 0:o.number)??{},r=e.type==="integer";return{...t,type:"number",min:a.min??e.minimum??0,max:a.max??e.maximum??100,step:a.step??(r?1:.1)}}p(W,"schemaField");function b(d,e){var a;const t=((a=E[d])==null?void 0:a.properties)??{};return e.filter(r=>t[r]).map(r=>W(r,t[r]))}p(b,"schemaFields");function T(d,e){const t=e.view==="floor",a=e.surface&&e.surface!=="plane";return d.key==="camera_tilt"&&a?{...d,default:H(e.surface,e.surface_side)}:d.key==="camera_tilt"?{...d,default:t?10:90}:d.key==="scan_period"?{...d,default:t?7:0}:d}p(T,"withViewDefault");const v=class v2 extends k{static get properties(){return{hass:{type:Object},config:{type:Object},_expandedIndex:{type:Number},_draggedIndex:{type:Number},_expandedEffects:{type:Object},_insetEnabled:{type:Boolean,state:true}}}static get styles(){return[C`
      :host {
        display: block;
        width: 100%;
      }

      .effects-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .effect-item {
        background: var(--card-background-color);
        border: var(--ha-border-width-sm) solid var(--divider-color);
        border-radius: var(--ha-card-border-radius, 12px);
        overflow: hidden;
        transition: transform 0.2s, opacity 0.2s;
      }

      .effect-item.dragging {
        opacity: 0.5;
      }

      .effect-item.drag-over {
        transform: translateY(-4px);
        border-color: var(--primary-color);
      }

      .effect-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        cursor: pointer;
        user-select: none;
        background: var(--secondary-background-color);
      }

      .effect-header:hover {
        background: var(--primary-background-color);
      }

      .drag-handle {
        cursor: grab;
        color: var(--secondary-text-color);
        --mdc-icon-size: 20px;
      }

      .drag-handle:active {
        cursor: grabbing;
      }

      .effect-icon {
        color: var(--primary-color);
        --mdc-icon-size: 24px;
      }

      .effect-info {
        flex: 1;
        min-width: 0;
      }

      .effect-type-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
      }

      .effect-type {
        font-weight: 600;
        font-size: 18px;
      }

      .effect-details {
        font-size: 12px;
        color: var(--secondary-text-color);
        font-family: monospace;
      }

      .effect-actions {
        display: flex;
        gap: 4px;
      }

      .expand-icon {
        transition: transform 0.2s;
      }

      .expand-icon.expanded {
        transform: rotate(180deg);
      }

      .add-button {
        margin-bottom: 16px;
        align-self: flex-start;
      }

      .effect-content {
        padding: 20px;
        background: var(--card-background-color, #fff);
      }

      .section {
        margin-bottom: 24px;
      }

      .section:last-child {
        margin-bottom: 0;
      }

      .empty-state {
        text-align: center;
        padding: 32px 16px;
        color: var(--secondary-text-color);
      }

      .empty-state ha-icon {
        font-size: 64px;
        opacity: 0.3;
        margin-bottom: 16px;
      }

      .empty-state-title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 8px;
      }

      .empty-state-subtitle {
        font-size: 14px;
        opacity: 0.7;
      }

      .zoom-section {
        background: var(--secondary-background-color, #fafafa);
        border-radius: 8px;
        padding: 16px;
        margin-top: 16px;
      }

      .zoom-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }

      .zoom-title {
        font-weight: 600;
        font-size: 15px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .param-grid {
        display: grid;
        /* minmax(0, 1fr) — a bare 1fr track's automatic minimum is content-based
           (min-content), so a long unbroken string (e.g. a picked HA media path)
           inside any field blows the track — and everything else in the row —
           wider than the section. Flooring the minimum at 0 lets descendants'
           own overflow/ellipsis rules (e.g. ha-selector-media's .title) actually
           take effect instead of forcing the grid to grow to fit them. */
        grid-template-columns: minmax(0, 1fr);
        gap: 16px;
      }

      .param-full {
        /* No longer needed with single column */
      }

      ha-selector {
        max-width: 100%;
        width: 100%;
        min-width: 0;
      }

      ha-icon-button {
        --ha-icon-button-size: 36px;
        --mdc-icon-size: 20px;
      }

      .layer-badge {
        font-size: 11px;
        padding: 2px 8px;
        background: var(--primary-color);
        color: var(--text-primary-color);
        border-radius: 12px;
        font-weight: 600;
      }

      @media (max-width: 600px) {
        .param-grid {
          grid-template-columns: minmax(0, 1fr);
        }

        .effect-header {
          padding: 12px;
        }

        .effect-content {
          padding: 16px;
        }
      }
    `,M,P]}constructor(){super(),this.hass=void 0,this.config=null,this._expandedIndex=null,this._draggedIndex=null,this._expandedEffects={},this._insetEnabled=false}get _normalizedConfig(){const e=this.config;return e?Array.isArray(e)?{inset:null,fps:null,effects:e}:{inset:e.inset??null,fps:e.fps??null,effects:e.effects??[]}:{inset:null,fps:null,effects:[]}}render(){const{effects:e}=this._normalizedConfig;return i`
      <div class="effects-container">
        ${this._renderInfoBanner()}
        ${this._renderCanvasSettings()}

        <ha-button @click=${this._addEffect} class="add-button">
          <ha-icon icon="mdi:plus" slot="start"></ha-icon>
          Add Background Effect
        </ha-button>

        ${e.length===0?this._renderEmptyState():""}
        ${e.map((t,a)=>this._renderEffectItem(t,a))}
      </div>
    `}_renderCanvasSettings(){const{inset:e,fps:t}=this._normalizedConfig,a=this._insetEnabled||e!=null,r=e==="auto",l=e&&typeof e=="object"?e:{top:0,right:0,bottom:0,left:0};return i`
      <lcards-form-section
        header="Canvas Settings"
        icon="mdi:crop"
        ?expanded=${a}>

        <ha-selector
          .hass=${this.hass}
          .selector=${{number:{min:1,max:120,step:1,mode:"slider"}}}
          .value=${t??30}
          .label=${"Animation FPS"}
          .helper=${"Max frames per second for the background animation. Default 30 is recommended for most devices. Use 60 for high-refresh displays."}
          @value-changed=${s=>{const o=s.detail.value;this._emitChange(this._normalizedConfig.effects,this._normalizedConfig.inset,o===30?null:o)}}
        ></ha-selector>

        <ha-selector
          .hass=${this.hass}
          .selector=${{boolean:{}}}
          .value=${a}
          .label=${"Enable canvas inset"}
          .helper=${"Offset the animation canvas from card edges"}
          @value-changed=${s=>{this._insetEnabled=s.detail.value,s.detail.value?this._emitChange(this._normalizedConfig.effects,r?"auto":{top:0,right:0,bottom:0,left:0}):this._emitChange(this._normalizedConfig.effects,null)}}
        ></ha-selector>

        ${a?i`
          <ha-selector
            .hass=${this.hass}
            .selector=${{boolean:{}}}
            .value=${r}
            .label=${"Auto inset (elbow cards)"}
            .helper=${"Automatically offset canvas to avoid elbow card bars"}
            @value-changed=${s=>{s.detail.value?this._emitChange(this._normalizedConfig.effects,"auto"):this._emitChange(this._normalizedConfig.effects,{top:0,right:0,bottom:0,left:0})}}
          ></ha-selector>

          ${r?"":this._renderManualInsetControls(l)}
        `:""}
      </lcards-form-section>
    `}_renderManualInsetControls(e){return[["top","Top"],["right","Right"],["bottom","Bottom"],["left","Left"]].map(([a,r])=>i`
      <ha-selector
        .hass=${this.hass}
        .selector=${{number:{min:0,max:500,step:1,mode:"slider"}}}
        .value=${e[a]??0}
        .label=${r}
        @value-changed=${l=>{const s={...e,[a]:l.detail.value};this._emitChange(this._normalizedConfig.effects,s)}}
      ></ha-selector>
    `)}_renderInfoBanner(){return i`
      <lcards-message type="info">
        <strong>Effect Stacking:</strong> Each effect renders as a layer. First effect = bottom layer, last = top layer.
        <strong>Drag to reorder!</strong>
      </lcards-message>
    `}_renderEmptyState(){return i`
      <div class="empty-state">
        <ha-icon icon="mdi:grid"></ha-icon>
        <div class="empty-state-title">No background effects configured</div>
        <div class="empty-state-subtitle">Add animated canvas backgrounds like grids, hexagons, or diagonals</div>
      </div>
    `}_renderEffectItem(e,t){const a=this._expandedEffects[t]||false,r=e.preset||"grid",l=h[r],s=(l==null?void 0:l.name)||r,o=this._draggedIndex===t,n=e.zoom&&Object.keys(e.zoom).length>0;return i`
      <div
        class="effect-item ${o?"dragging":""}"
        @dragover=${c=>this._handleDragOver(c,t)}
        @drop=${c=>this._handleDrop(c,t)}>

        <div
          class="effect-header"
          draggable="true"
          @dragstart=${c=>this._handleDragStart(c,t)}
          @dragend=${c=>this._handleDragEnd(c)}
          @click=${()=>this._toggleExpanded(t)}>
          <!-- Drag Handle -->
          <ha-icon
            class="drag-handle"
            icon="mdi:drag"
            @click=${c=>c.stopPropagation()}>
          </ha-icon>

          <ha-icon
            class="effect-icon"
            icon=${this._getPresetIcon(r)}>
          </ha-icon>

          <div class="effect-info">
            <div class="effect-type-row">
              <span class="effect-type">${s}</span>
              ${n?i`<span class="layer-badge">ZOOM</span>`:""}
              <span class="layer-badge">Layer ${t+1}</span>
            </div>
            <div class="effect-details">${this._getEffectDetails(e)}</div>
          </div>

          <div class="effect-actions">
            <ha-icon-button
              @click=${c=>this._duplicateEffect(c,t)}
              .label=${"Duplicate"}
              .path=${"M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"}>
            </ha-icon-button>
            <ha-icon-button
              @click=${c=>this._deleteEffect(c,t)}
              .label=${"Delete"}
              .path=${"M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"}>
            </ha-icon-button>
          </div>

          <ha-icon
            class="expand-icon ${a?"expanded":""}"
            icon="mdi:chevron-down">
          </ha-icon>
        </div>

        ${a?i`
          <div class="effect-content">
            ${this._renderEffectForm(e,t)}
          </div>
        `:""}
      </div>
    `}_renderEffectForm(e,t){var r;const a=e.preset||"grid";return i`
      <!-- Preset Selection -->
      <lcards-form-section
        header="Effect Preset"
        icon="mdi:palette"
        ?expanded=${true}>

        <ha-selector
          .hass=${this.hass}
          .selector=${{select:{mode:"dropdown",custom_value:true,options:this._getPresetOptions()}}}
          .value=${a}
          .label=${"Background effect type"}
          .helper=${this._getPresetHelp(a)}
          @value-changed=${l=>this._updateEffect(t,"preset",l.detail.value)}
        ></ha-selector>
        ${((r=h[a])==null?void 0:r.renderer)==="webgl"?i`
          <ha-selector
            .hass=${this.hass}
            .selector=${{select:{mode:"dropdown",options:[{value:"auto",label:"Auto: WebGL when available"},{value:"webgl",label:"WebGL (Canvas2D without it)"},{value:"canvas",label:"Canvas2D only"}]}}}
            .value=${e.renderer??"auto"}
            .label=${"Renderer"}
            .helper=${"How this effect is drawn. Canvas2D only uses no GPU."}
            @value-changed=${l=>this._updateEffect(t,"renderer",l.detail.value==="auto"?void 0:l.detail.value)}
          ></ha-selector>
        `:""}
      </lcards-form-section>

      ${this._renderEffectInfoGuide(a,t)}

      <!-- Preset Configuration -->
      ${this._renderPresetConfig(e,t)}

      <!-- Speed + binding glide -->
      ${this._renderTimingSection(e,t)}

      <!-- Zoom Wrapper -->
      ${this._renderZoomSection(e,t)}
    `}_renderTimingSection(e,t){const a=e.preset||"grid",r=e.config||{},l=!["shimmer","image","solid"].includes(a),s=typeof r.speed=="number"?r.speed:1;return i`
      <lcards-form-section header="Timing" icon="mdi:timer-outline" ?expanded=${false}>
        <div class="param-grid">
          ${l?i`
            <ha-selector
              .hass=${this.hass}
              .selector=${{number:{min:0,max:10,step:.1,mode:"slider"}}}
              .value=${s}
              .label=${"Speed"}
              .helper=${"Time multiplier for the whole effect: 2 is twice as fast, 0 freezes it"}
              @value-changed=${o=>this._updateEffectConfig(t,"speed",o.detail.value)}
            ></ha-selector>
          `:""}
          <ha-selector
            .hass=${this.hass}
            .selector=${{number:{min:0,max:5e3,step:50,mode:"box",unit_of_measurement:"ms"}}}
            .value=${e.transition??500}
            .label=${"Binding transition"}
            .helper=${"How long an entity-bound value glides to its new value (0 snaps)"}
            @value-changed=${o=>this._updateEffect(t,"transition",o.detail.value)}
          ></ha-selector>
        </div>
      </lcards-form-section>
    `}_renderEffectInfoGuide(e,t){var s;const a=h[e];if(!(a!=null&&a.guide))return"";const r=`${A}#${e}`,l=a.guide;return i`
      ${L({header:`How ${a.name} works`,icon:"mdi:information-outline",body:i`
            ${this._splitIntoSentences(l.summary).map(o=>i`<p>${o}</p>`)}
            ${(s=l.params)!=null&&s.length?i`
              <strong>Params:</strong>
              <ul>
                ${l.params.map(o=>i`
                  <li>
                    <code>${o.key}</code>${o.default!==void 0?i` (default: <code>${JSON.stringify(o.default)}</code>)`:""}
                    ${o.description?`: ${o.description}`:""}
                  </li>
                `)}
              </ul>
            `:""}
            <strong>Example:</strong>
            <pre class="info-guide-example">${l.example}</pre>
            ${l.tip?i`
              <p class="info-guide-tip"><strong>Tip:</strong> ${l.tip}</p>
            `:""}
            ${this._renderEntityBindingNote()}
            <div class="info-guide-links">
              <a href=${r} target="_blank" rel="noopener noreferrer">View full docs →</a>
            </div>
          `})}
    `}_splitIntoSentences(e){return e?e.split(new RegExp("(?<=[.!?])\\s+(?=[A-Z`])")):[]}_renderPresetConfig(e,t){const a=e.preset||"grid",r=e.config||{};return w[a]?i`${this._renderSchemaSections(a,r,t)}`:a==="starfield"?i`
        ${this._renderStarfieldSection(r,t)}
        ${this._renderScrollingSection(r,t)}
      `:a==="nebula"?i`
        ${this._renderNebulaSection(r,t)}
        ${this._renderScrollingSection(r,t)}
      `:a==="contour-field"?i`
        ${this._renderContourFieldSection(r,t)}
        ${this._renderScrollingSection(r,t)}
      `:a==="cascade"?i`${this._renderCascadeSection(r,t)}`:a==="level"?i`${this._renderLevelSection(r,t)}`:["fluid","plasma","flow","shimmer","scanlines"].includes(a)?i`${this._renderTexturePresetSection(a,r,t)}`:a==="image"?i`${this._renderImageBackgroundSection(r,t)}`:a==="solid"?i`${this._renderSolidSection(r,t)}`:i`
      ${this._renderPatternSection(a,r,t)}
      ${this._renderMajorMinorSection(a,r,t)}
      ${this._renderScrollingSection(r,t)}
      ${this._renderColorSection(a,r,t)}
      ${D.includes(a)?this._renderGridViewSection(a,r,t):""}
    `}_renderSchemaSections(e,t,a){return i`
      ${w[e].map(r=>this._renderSchemaSection(r.header,r.icon,b(e,r.keys),t,a))}
      ${e==="warp-starfield"?i`
        <lcards-form-section header="Colours" icon="mdi:palette" ?expanded=${true}>
          <lcards-color-list
            .hass=${this.hass}
            .colors=${t.colors||(t.color?[t.color]:[])}
            .label=${"Star colours"}
            .description=${"Each star takes one of these. Empty: moonlight, which follows the alert palette."}
            @colors-changed=${r=>this._updateEffectConfig(a,"colors",r.detail.colors)}
          ></lcards-color-list>
        </lcards-form-section>
      `:""}
    `}_renderSchemaSection(e,t,a,r,l){const s=a.filter(n=>n.type!=="color"),o=a.filter(n=>n.type==="color");return i`
      <lcards-form-section header=${e} icon=${t} ?expanded=${true}>
        ${s.length?i`<div class="param-grid">${s.map(n=>this._renderField(n,r,l))}</div>`:""}
        ${o.map(n=>this._renderColorSlot(n,r,l))}
      </lcards-form-section>
    `}_renderGridViewSection(e,t,a){const r=b(e,j).map(l=>T(l,t));return i`
      <lcards-form-section header="View, surface and camera (WebGL)" icon="mdi:axis-arrow" ?expanded=${false}>
        <div class="param-grid">${r.filter(l=>l.type!=="color").map(l=>this._renderField(l,t,a))}</div>
        ${r.filter(l=>l.type==="color").map(l=>this._renderColorSlot(l,t,a))}
      </lcards-form-section>
    `}_renderColorSlot(e,t,a){return i`
      <div style="margin-bottom: 12px;">
        <div style="font-size: 14px; font-weight: 500; margin-bottom: 8px; padding: 2px 8px;">${e.label}</div>
        <lcards-color-picker
          .hass=${this.hass}
          .value=${t[e.key]||""}
          .variablePrefixes=${["--lcards-","--lcars-","--cblcars-"]}
          ?showPreview=${true}
          @value-changed=${r=>this._updateEffectConfig(a,e.key,r.detail.value)}>
        </lcards-color-picker>
        ${e.helper?i`<div style="font-size: 12px; color: var(--secondary-text-color); margin-top: 4px; padding: 0 8px;">${e.helper}</div>`:""}
      </div>
    `}_renderPatternSection(e,t,a){const r=[];return(e==="grid"||e==="grid-diagonal")&&r.push({key:"line_spacing",label:"Line Spacing (px)",type:"number",min:10,max:200,step:5,default:40}),e==="grid-hexagonal"&&r.push({key:"hex_radius",label:"Hex Radius (px)",type:"number",min:1,max:150,step:1,default:40}),e!=="grid-hexagonal"&&r.push({key:"line_width",label:"Line Width",type:"number",min:.5,max:10,step:.5,default:1}),e==="grid"&&(r.push({key:"pattern",label:"Pattern",type:"select",options:["both","horizontal","vertical","diagonal","hexagonal","dots","polar"],default:"both"}),t.pattern==="polar"&&r.push(...b("grid",["spoke_count","polar_x","polar_y"])),t.pattern==="dots"&&r.push({key:"dot_radius",label:"Dot Radius (px)",type:"number",min:.5,max:10,step:.5,default:2}),t.pattern==="hexagonal"&&r.push({key:"hex_radius",label:"Hex Radius (px)",type:"number",min:1,max:150,step:1,default:40})),r.push({key:"show_border_lines",label:"Show Border Lines",type:"boolean",default:true}),r.length===0?"":i`
      <lcards-form-section
        header="Pattern"
        icon="mdi:grid"
        ?expanded=${true}>
        <div class="param-grid">
          ${r.map(l=>this._renderField(l,t,a))}
        </div>
      </lcards-form-section>
    `}_renderMajorMinorSection(e,t,a){const r=[];return e==="grid"?r.push({key:"major_row_interval",label:"Major Row Interval (0=off)",type:"number",min:0,max:20,step:1,default:0},{key:"major_col_interval",label:"Major Col Interval (0=off)",type:"number",min:0,max:20,step:1,default:0},{key:"line_width_major",label:"Major Line Width",type:"number",min:.5,max:10,step:.5,default:2}):e==="grid-hexagonal"&&r.push({key:"line_width_minor",label:"Minor Line Width",type:"number",min:.5,max:10,step:.5,default:1},{key:"line_width_major",label:"Major Line Width",type:"number",min:.5,max:10,step:.5,default:2},{key:"major_row_interval",label:"Major Row Interval (0=off)",type:"number",min:0,max:10,step:1,default:0},{key:"major_col_interval",label:"Major Col Interval (0=off)",type:"number",min:0,max:10,step:1,default:0}),r.length===0?"":i`
      <lcards-form-section
        header="Major/Minor Lines"
        icon="mdi:format-line-weight"
        description="Configure major line divisions (set intervals to 0 to disable)"
        ?expanded=${true}>
        <div class="param-grid">
          ${r.map(l=>this._renderField(l,t,a))}
        </div>
      </lcards-form-section>
    `}_renderScrollingSection(e,t){return i`
      <lcards-form-section
        header="Scrolling"
        icon="mdi:arrow-all"
        ?expanded=${true}>
        <div class="param-grid">
          ${this._renderField({key:"scroll_speed_x",label:"Scroll Speed X (px/s)",type:"number",min:-200,max:200,step:5,default:20},e,t)}
          ${this._renderField({key:"scroll_speed_y",label:"Scroll Speed Y (px/s)",type:"number",min:-200,max:200,step:5,default:20},e,t)}
        </div>
      </lcards-form-section>
    `}_renderStarfieldSection(e,t){return i`
      <lcards-form-section
        header="Star Properties"
        icon="mdi:star-circle"
        ?expanded=${true}>
        <div class="param-grid">
          ${this._renderField({key:"seed",label:"Random Seed",type:"number",min:1,max:1e9,step:1,default:Math.floor(Math.random()*1e9),helper:"Change for different star patterns"},e,t)}
          ${this._renderField({key:"count",label:"Star Count",type:"number",min:50,max:500,step:10,default:150},e,t)}
          ${this._renderField({key:"min_radius",label:"Min Star Radius (px)",type:"number",min:.1,max:5,step:.1,default:.5},e,t)}
          ${this._renderField({key:"max_radius",label:"Max Star Radius (px)",type:"number",min:.5,max:10,step:.5,default:2},e,t)}
          ${this._renderField({key:"min_opacity",label:"Min Star Opacity",type:"number",min:0,max:1,step:.1,default:.3},e,t)}
          ${this._renderField({key:"max_opacity",label:"Max Star Opacity",type:"number",min:0,max:1,step:.1,default:1},e,t)}
        </div>
      </lcards-form-section>

      <lcards-form-section
        header="Colour"
        icon="mdi:palette"
        ?expanded=${true}>
        <lcards-color-list
          .hass=${this.hass}
          .colors=${e.colors||(e.color?[e.color]:[])}
          .label=${"Star Colours"}
          .description=${"Stars will randomly use one of these colors"}
          @colors-changed=${a=>this._updateEffectConfig(t,"colors",a.detail.colors)}
        ></lcards-color-list>
      </lcards-form-section>

      <lcards-form-section
        header="Parallax Depth"
        icon="mdi:layers"
        description="Multiple layers create depth effect - closer layers scroll faster"
        ?expanded=${true}>
        <div class="param-grid">
          ${this._renderField({key:"parallax_layers",label:"Parallax Layers",type:"number",min:1,max:5,step:1,default:3,helper:"More layers = more depth"},e,t)}
          ${this._renderField({key:"depth_factor",label:"Depth Factor",type:"number",min:0,max:1,step:.1,default:.5,helper:"Speed variation between layers"},e,t)}
        </div>
      </lcards-form-section>
    `}_renderNebulaSection(e,t){return i`
      <lcards-form-section
        header="Cloud Properties"
        icon="mdi:cloud"
        ?expanded=${true}>
        <div class="param-grid">
          ${this._renderField({key:"seed",label:"Random Seed",type:"number",min:1,max:1e9,step:1,default:Math.floor(Math.random()*1e9),helper:"Change for different cloud patterns"},e,t)}
          ${this._renderField({key:"cloud_count",label:"Cloud Count",type:"number",min:1,max:10,step:1,default:4},e,t)}
          ${this._renderField({key:"min_radius",label:"Min Cloud Radius",type:"number",min:.05,max:.5,step:.05,default:.15,helper:"Fraction of canvas size (0-1)"},e,t)}
          ${this._renderField({key:"max_radius",label:"Max Cloud Radius",type:"number",min:.1,max:1,step:.05,default:.4,helper:"Fraction of canvas size (0-1)"},e,t)}
          ${this._renderField({key:"min_opacity",label:"Min Cloud Opacity",type:"number",min:0,max:1,step:.1,default:.3},e,t)}
          ${this._renderField({key:"max_opacity",label:"Max Cloud Opacity",type:"number",min:0,max:1,step:.1,default:.8},e,t)}
          ${b("nebula",["volumetric"]).map(a=>this._renderField(a,e,t))}
        </div>
      </lcards-form-section>

      <lcards-form-section
        header="Colour"
        icon="mdi:palette"
        ?expanded=${true}>
        <lcards-color-list
          .hass=${this.hass}
          .colors=${e.colors||(e.color?[e.color]:[])}
          .label=${"Cloud Colours"}
          .description=${"Clouds will randomly use one of these colors"}
          @colors-changed=${a=>this._updateEffectConfig(t,"colors",a.detail.colors)}
        ></lcards-color-list>
      </lcards-form-section>

      <lcards-form-section
        header="Turbulence"
        icon="mdi:waves"
        description="Perlin noise creates organic cloud movement"
        ?expanded=${true}>
        <div class="param-grid">
          ${this._renderField({key:"turbulence",label:"Turbulence Intensity",type:"number",min:0,max:1,step:.1,default:.5,helper:"How much clouds distort (0=none, 1=max)"},e,t)}
          ${this._renderField({key:"noise_scale",label:"Noise Scale",type:"number",min:.001,max:.01,step:.001,default:.003,helper:"Smaller = larger noise features"},e,t)}
        </div>
      </lcards-form-section>
    `}_renderContourFieldSection(e,t){return i`
      <lcards-form-section
        header="Noise"
        icon="mdi:waves"
        description="Shapes the raw terrain the bands are sliced from"
        ?expanded=${true}>
        <div class="param-grid">
          ${this._renderField({key:"seed",label:"Random Seed",type:"number",min:1,max:1e9,step:1,default:Math.floor(Math.random()*1e9),helper:"Same seed + settings = same field every time; change it to get a different layout without touching anything else"},e,t)}
          ${this._renderField({key:"noise_scale",label:"Noise Scale",type:"number",min:.001,max:.05,step:.001,default:.01,helper:"Smaller = a few large drifting blobs; larger = many small, busy ripples"},e,t)}
          ${this._renderField({key:"num_octaves",label:"Noise Octaves",type:"number",min:1,max:8,step:1,default:4,helper:"Layers of fine detail added on top of the base shape; 1 = smooth blobs, 8 = rough, cloud-like fuzz"},e,t)}
        </div>
      </lcards-form-section>

      <lcards-form-section
        header="Contour Bands"
        icon="mdi:elevation-rise"
        description="Always sliced across the full peaks-and-valleys range, regardless of Fill below"
        ?expanded=${true}>
        <div class="param-grid">
          ${this._renderField({key:"num_bands",label:"Band Count",type:"number",min:2,max:64,step:1,default:8,helper:"Low (2-8) = bold stepped contour lines/rings; high (32+) = a smooth, almost continuous gradient"},e,t)}
          ${this._renderField({key:"cell_size",label:"Cell Size (px)",type:"number",min:1,max:16,step:1,default:3,helper:"Sample resolution. Larger = blockier/pixelated edges but cheaper to render; smaller = crisp smooth edges but more GPU/CPU cost"},e,t)}
        </div>
      </lcards-form-section>

      <lcards-form-section
        header="Fill"
        icon="mdi:water"
        description="Floods or drains a waterline over the terrain above; doesn't change the terrain itself"
        ?expanded=${true}>
        <div class="param-grid">
          ${this._renderField({key:"fill_level",label:"Fill Level",type:"number",min:0,max:.95,step:.05,default:0,helper:"0 = no water, full terrain visible. Raise it to flood the lowest rings: they become Fill Colour instead of their normal colour, leaving isolated nebula-like blobs at the peaks."},e,t)}
          ${this._renderField({key:"fill_color",label:"Fill Colour",type:"color",default:"",fullWidth:true,helper:'Leave empty for literal transparency (the card background shows through as "space"). Set a colour (e.g. black) to bake the void into the effect itself.'},e,t)}
        </div>
      </lcards-form-section>

      <lcards-form-section
        header="Colour"
        icon="mdi:palette"
        description="What fills each contour ring above the waterline"
        ?expanded=${true}>
        <div class="param-grid">
          ${this._renderField({key:"blend_colors",label:"Blend Between Colours",type:"boolean",default:true,helper:"On = colours (and the Fill waterline) fade smoothly. Off = every edge is a hard cutoff with no blending anywhere: flat, solid rings and a crisp shoreline, matching real contour maps and the reference site's look."},e,t)}
        </div>
        <lcards-color-list
          .hass=${this.hass}
          .colors=${e.colors||(e.color?[e.color]:[])}
          .label=${"Band Colours"}
          .description=${"One colour or several stops spread evenly across the full contour range, from lowest ring to highest"}
          @colors-changed=${a=>this._updateEffectConfig(t,"colors",a.detail.colors)}
        ></lcards-color-list>
      </lcards-form-section>
    `}_renderCascadeSection(e,t){return i`
      <!-- Grid Sizing -->
      <lcards-form-section header="Grid" icon="mdi:grid" ?expanded=${true}>
        <div class="param-grid">
          <ha-input
            type="number"
            label="Rows (blank = auto)"
            hint="Leave empty to fill card height automatically"
            min="1"
            max="50"
            step="1"
            .value=${e.num_rows??""}
            placeholder="auto"
            @input=${a=>this._updateEffectConfig(t,"num_rows",a.target.value?Number(a.target.value):null)}
          ></ha-input>
          <ha-input
            type="number"
            label="Columns (blank = auto)"
            hint="Leave empty to fill card width automatically"
            min="1"
            max="100"
            step="1"
            .value=${e.num_cols??""}
            placeholder="auto"
            @input=${a=>this._updateEffectConfig(t,"num_cols",a.target.value?Number(a.target.value):null)}
          ></ha-input>
          ${this._renderField({key:"gap",label:"Cell Gap (px)",type:"number",min:0,max:20,step:1,default:4},e,t)}
        </div>
      </lcards-form-section>

      <!-- Data Format -->
      <lcards-form-section header="Data Format" icon="mdi:numeric" ?expanded=${true}>
        <ha-selector
          .hass=${this.hass}
          .selector=${{select:{mode:"dropdown",options:[{value:"hex",label:"Hex (A3F1, 00FF)"},{value:"digit",label:"Digit (0042, 1337)"},{value:"float",label:"Float (42.17, 3.14)"},{value:"alpha",label:"Alpha (AB, XY)"},{value:"mixed",label:"Mixed (various)"}]}}}
          .value=${e.format??"hex"}
          .label=${"Cell data format"}
          @value-changed=${a=>this._updateEffectConfig(t,"format",a.detail.value)}
        ></ha-selector>
        <ha-selector
          .hass=${this.hass}
          .selector=${{number:{min:0,max:6e4,step:500,mode:"box"}}}
          .value=${e.refresh_interval??0}
          .label=${"Refresh Interval (ms, 0 = static)"}
          .helper=${"How often to regenerate random cell values. 0 = never refresh."}
          @value-changed=${a=>this._updateEffectConfig(t,"refresh_interval",a.detail.value)}
        ></ha-selector>
      </lcards-form-section>

      <!-- Typography -->
      <lcards-form-section header="Typography" icon="mdi:format-size" ?expanded=${true}>
        <div class="param-grid">
          ${this._renderField({key:"font_size",label:"Font Size (px)",type:"number",min:6,max:48,step:1,default:10},e,t)}
          <ha-selector
            .hass=${this.hass}
            .selector=${{text:{}}}
            .value=${e.font_family??"'Antonio', monospace"}
            .label=${"Font Family"}
            .helper=${"CSS font-family string"}
            @value-changed=${a=>this._updateEffectConfig(t,"font_family",a.detail.value)}
          ></ha-selector>
        </div>
      </lcards-form-section>

      <!-- Cascade Animation Timing -->
      <lcards-form-section header="Cascade Timing" icon="mdi:timer-outline" ?expanded=${true}>
        <ha-selector
          .hass=${this.hass}
          .selector=${{select:{mode:"dropdown",options:[{value:"default",label:"Default (authentic LCARS rhythm)"},{value:"niagara",label:"Niagara (smooth uniform waterfall)"},{value:"fast",label:"Fast (rapid cycling)"},{value:"custom",label:"Custom (manual per-row timing)"}]}}}
          .value=${e.pattern??"default"}
          .label=${"Timing Pattern"}
          @value-changed=${a=>this._updateEffectConfig(t,"pattern",a.detail.value)}
        ></ha-selector>
        ${(e.pattern??"default")==="custom"?i`
          <lcards-message type="info" .message=${`Custom timing requires a YAML-supplied "timing" array of { duration, delay } objects, one per row. Edit this card's YAML directly to set the timing property.`}></lcards-message>
        `:""}
        <div class="param-grid">
          ${this._renderField({key:"speed_multiplier",label:"Speed Multiplier (1.0 = normal)",type:"number",min:.1,max:10,step:.1,default:1,helper:"2.0 = twice as fast, 0.5 = half speed"},e,t)}
          ${this._renderField({key:"duration",label:"Duration Override (ms, 0 = use pattern)",type:"number",min:0,max:3e4,step:100,default:0,helper:"Overrides all row durations if > 0"},e,t)}
        </div>
      </lcards-form-section>

      <!-- Cascade Colors -->
      <lcards-form-section header="Cascade Colours" icon="mdi:palette" ?expanded=${true}>
        ${[{key:"start",label:"Start Colour",helper:"Bright hold colour (dominant, ~75% of cycle)",def:"var(--lcards-blue-light, #93e1ff)"},{key:"text",label:"Middle / Text Colour",helper:"Dark snap-to colour (~10% of cycle)",def:"var(--lcards-blue-darkest, #002241)"},{key:"end",label:"End Colour",helper:"Pale fade-out colour (~10% of cycle)",def:"var(--lcards-moonlight, #dfe1e8)"}].map(a=>{var r;return i`
          <div style="margin-bottom: 12px;">
            <div style="font-size: 14px; font-weight: 500; margin-bottom: 8px; padding: 2px 8px;">${a.label}</div>
            <lcards-color-picker
              .hass=${this.hass}
              .value=${((r=e.colors)==null?void 0:r[a.key])??a.def}
              .variablePrefixes=${["--lcards-","--lcars-","--cblcars-"]}
              ?showPreview=${true}
              @value-changed=${l=>{const s={...e.colors??{},[a.key]:l.detail.value};this._updateEffectConfig(t,"colors",s)}}>
            </lcards-color-picker>
            <div style="font-size: 12px; color: var(--secondary-text-color); margin-top: 4px; padding: 0 8px;">${a.helper}</div>
          </div>
        `})}
      </lcards-form-section>
    `}_renderColorSection(e,t,a){const r=[{key:"color",label:"Line Colour",helper:"Main line colour"}];return(e==="grid"||e==="grid-hexagonal")&&r.push({key:"color_major",label:"Major Line Colour",helper:"Leave empty to use same as main colour"}),(e==="grid"||e==="grid-diagonal"||e==="grid-hexagonal")&&r.push({key:"fill_color",label:"Fill Colour",helper:"Cell/area background fill (leave empty for transparent)"}),i`
      <lcards-form-section header="Colours" icon="mdi:palette" ?expanded=${true}>
        ${r.map(l=>this._renderColorSlot(l,t,a))}
      </lcards-form-section>
    `}_renderLevelSection(e,t){return i`
      <lcards-form-section header="Fill" icon="mdi:water" ?expanded=${true}>
        <div class="param-grid">
          ${this._renderField({key:"fill_pct",label:"Fill %",type:"number",min:0,max:100,step:1,default:50},e,t)}
          <ha-selector
            .hass=${this.hass}
            .selector=${{select:{mode:"dropdown",options:[{value:"up",label:"Up"},{value:"down",label:"Down"},{value:"left",label:"Left"},{value:"right",label:"Right"}]}}}
            .value=${e.direction??"up"}
            .label=${"Fill Direction"}
            @value-changed=${a=>this._updateEffectConfig(t,"direction",a.detail.value)}
          ></ha-selector>
          ${this._renderField({key:"opacity",label:"Opacity",type:"number",min:0,max:1,step:.05,default:1},e,t)}
        </div>
      </lcards-form-section>

      <lcards-form-section header="Colours" icon="mdi:palette" ?expanded=${true}>
        <div style="margin-bottom:12px;">
          <div style="font-size:14px;font-weight:500;margin-bottom:8px;padding:2px 8px;">Primary Colour</div>
          <lcards-color-picker
            .hass=${this.hass}
            .value=${e.color_a??e.color??"rgba(0,200,100,0.7)"}
            .variablePrefixes=${["--lcards-","--lcars-","--cblcars-"]}
            ?showPreview=${true}
            @value-changed=${a=>this._updateEffectConfig(t,"color_a",a.detail.value)}
          ></lcards-color-picker>
        </div>
        <div style="margin-bottom:12px;">
          <div style="font-size:14px;font-weight:500;margin-bottom:8px;padding:2px 8px;">Secondary Colour (gradient, optional)</div>
          <lcards-color-picker
            .hass=${this.hass}
            .value=${e.color_b??""}
            .variablePrefixes=${["--lcards-","--lcars-","--cblcars-"]}
            ?showPreview=${true}
            @value-changed=${a=>this._updateEffectConfig(t,"color_b",a.detail.value||null)}
          ></lcards-color-picker>
        </div>
        <div class="param-grid">
          ${this._renderField({key:"gradient_crossover",label:"Gradient Crossover %",type:"number",min:0,max:100,step:5,default:80,helper:"Where colour A blends into colour B"},e,t)}
        </div>
      </lcards-form-section>

      <lcards-form-section header="Primary Wave" icon="mdi:sine-wave" ?expanded=${true}>
        <div class="param-grid">
          ${this._renderField({key:"wave_height",label:"Wave Height (px)",type:"number",min:0,max:30,step:1,default:4},e,t)}
          ${this._renderField({key:"wave_count",label:"Wave Count",type:"number",min:1,max:20,step:1,default:4},e,t)}
          ${this._renderField({key:"wave_speed",label:"Wave Speed (px/s)",type:"number",min:-100,max:100,step:5,default:20},e,t)}
        </div>
      </lcards-form-section>

      <lcards-form-section header="Secondary Wave" icon="mdi:sine-wave" ?expanded=${false}>
        <div class="param-grid">
          ${this._renderField({key:"wave2_height",label:"Wave 2 Height (px)",type:"number",min:0,max:30,step:1,default:0},e,t)}
          ${this._renderField({key:"wave2_count",label:"Wave 2 Count",type:"number",min:1,max:20,step:1,default:5},e,t)}
          ${this._renderField({key:"wave2_speed",label:"Wave 2 Speed (px/s)",type:"number",min:-100,max:100,step:5,default:-15},e,t)}
        </div>
      </lcards-form-section>

      <lcards-form-section header="Sloshing" icon="mdi:waves" ?expanded=${false}>
        <div class="param-grid">
          ${this._renderField({key:"slosh_amount",label:"Slosh Amount (px)",type:"number",min:0,max:50,step:1,default:0,helper:"0 = no sloshing physics"},e,t)}
          ${this._renderField({key:"slosh_period",label:"Slosh Period (s)",type:"number",min:.5,max:10,step:.5,default:3},e,t)}
        </div>
      </lcards-form-section>

      <lcards-form-section header="Edge Glow" icon="mdi:flare" ?expanded=${false}>
        <div class="param-grid">
          <ha-selector
            .hass=${this.hass}
            .selector=${{boolean:{}}}
            .value=${e.edge_glow??true}
            .label=${"Enable Edge Glow"}
            @value-changed=${a=>this._updateEffectConfig(t,"edge_glow",a.detail.value)}
          ></ha-selector>
          ${this._renderField({key:"edge_glow_width",label:"Glow Width (px)",type:"number",min:1,max:30,step:1,default:6},e,t)}
        </div>
        <div style="margin-top:12px;">
          <div style="font-size:14px;font-weight:500;margin-bottom:8px;padding:2px 8px;">Glow Colour</div>
          <lcards-color-picker
            .hass=${this.hass}
            .value=${e.edge_glow_color??"rgba(255,255,255,0.7)"}
            .variablePrefixes=${["--lcards-","--lcars-","--cblcars-"]}
            ?showPreview=${true}
            @value-changed=${a=>this._updateEffectConfig(t,"edge_glow_color",a.detail.value)}
          ></lcards-color-picker>
        </div>
      </lcards-form-section>
    `}_renderImageBackgroundSection(e,t){const a=e.source??e.url??"";return i`
      <lcards-form-section header="Image" icon="mdi:image" ?expanded=${true}>
        <div class="param-grid">
          <lcards-asset-source-picker .hass=${this.hass} .value=${a}
            .label=${"Image Source"} .assetLabel=${"Built-in Image"}
            .assetHelper=${"Images and SVGs registered in the Asset Library"}
            .customLabel=${"Image URL"}
            .customHelper=${"Path to image: /local/images/room.jpg · https://… · or a template: {entity.attributes.entity_picture}"}
            .mediaHelper=${"Browse or upload an image via the Home Assistant media library"}
            @value-changed=${r=>{r.stopPropagation(),this._updateEffectConfig(t,"source",r.detail.value)}}
            style="grid-column: 1 / -1"
          ></lcards-asset-source-picker>

          <!-- Size -->
          <ha-selector
            .hass=${this.hass}
            .selector=${{select:{mode:"dropdown",options:[{value:"cover",label:"Cover (fill, may crop)"},{value:"contain",label:"Contain (fit, may letterbox)"},{value:"fill",label:"Fill (stretch to canvas)"}]}}}
            .value=${e.size??"cover"}
            .label=${"Size"}
            .helper=${"How the image is scaled to fit the card background"}
            @value-changed=${r=>this._updateEffectConfig(t,"size",r.detail.value)}
          ></ha-selector>

          <!-- Position -->
          <ha-selector
            .hass=${this.hass}
            .selector=${{text:{}}}
            .value=${e.position??"center"}
            .label=${"Position"}
            .helper=${'CSS background-position value, e.g. "center", "top left", "50% 20%"'}
            @value-changed=${r=>this._updateEffectConfig(t,"position",r.detail.value)}
          ></ha-selector>

          <!-- Opacity -->
          ${this._renderField({key:"opacity",label:"Opacity",type:"number",min:0,max:1,step:.05,default:1},e,t)}

          <!-- Repeat/Tile -->
          ${this._renderField({key:"repeat",label:"Tile / Repeat",type:"boolean",default:false},e,t)}
        </div>
      </lcards-form-section>
    `}_renderTexturePresetSection(e,t,a){var s,o;const r=e==="plasma",l=["fluid","plasma","flow","scanlines"].includes(e);return i`
      <lcards-form-section header="Colour" icon="mdi:palette" ?expanded=${true}>
        ${r?i`
          <div style="margin-bottom:12px;">
            <div style="font-size:14px;font-weight:500;margin-bottom:8px;padding:2px 8px;">Colour A</div>
            <lcards-color-picker
              .hass=${this.hass}
              .value=${t.color_a??"rgba(80,0,255,0.9)"}
              .variablePrefixes=${["--lcards-","--lcars-","--cblcars-"]}
              ?showPreview=${true}
              @value-changed=${n=>this._updateEffectConfig(a,"color_a",n.detail.value)}
            ></lcards-color-picker>
          </div>
          <div style="margin-bottom:12px;">
            <div style="font-size:14px;font-weight:500;margin-bottom:8px;padding:2px 8px;">Colour B</div>
            <lcards-color-picker
              .hass=${this.hass}
              .value=${t.color_b??"rgba(255,40,120,0.9)"}
              .variablePrefixes=${["--lcards-","--lcars-","--cblcars-"]}
              ?showPreview=${true}
              @value-changed=${n=>this._updateEffectConfig(a,"color_b",n.detail.value)}
            ></lcards-color-picker>
          </div>
        `:i`
          <lcards-color-picker
            .hass=${this.hass}
            .value=${t.color??((o=(s=F[e])==null?void 0:s.defaults)==null?void 0:o.color)??"rgba(100,180,255,0.8)"}
            .variablePrefixes=${["--lcards-","--lcars-","--cblcars-"]}
            ?showPreview=${true}
            @value-changed=${n=>this._updateEffectConfig(a,"color",n.detail.value)}
          ></lcards-color-picker>
        `}
      </lcards-form-section>

      <lcards-form-section header="Parameters" icon="mdi:tune" ?expanded=${true}>
        <div class="param-grid">
          ${["fluid","plasma","flow"].includes(e)?this._renderField({key:"base_frequency",label:"Base Frequency",type:"number",min:.001,max:.1,step:.001,default:.01,helper:"Lower = larger features"},t,a):""}
          ${e==="fluid"?this._renderField({key:"num_octaves",label:"Noise Octaves",type:"number",min:1,max:8,step:1,default:4},t,a):""}
          ${e==="flow"?this._renderField({key:"wave_scale",label:"Wave Scale",type:"number",min:1,max:30,step:1,default:8},t,a):""}
          ${e==="shimmer"?i`
            ${this._renderField({key:"highlight_width",label:"Highlight Width (fraction)",type:"number",min:.05,max:.8,step:.05,default:.35},t,a)}
            ${this._renderField({key:"speed",label:"Sweep Speed",type:"number",min:.1,max:10,step:.1,default:2.5},t,a)}
            ${this._renderField({key:"angle",label:"Angle (degrees)",type:"number",min:-90,max:90,step:5,default:30},t,a)}
          `:""}
          ${e==="scanlines"?i`
            ${this._renderField({key:"line_spacing",label:"Line Spacing (px)",type:"number",min:1,max:20,step:1,default:4},t,a)}
            ${this._renderField({key:"line_width",label:"Line Width (px)",type:"number",min:.5,max:5,step:.5,default:1.5},t,a)}
            <ha-selector
              .hass=${this.hass}
              .selector=${{select:{mode:"dropdown",options:[{value:"horizontal",label:"Horizontal"},{value:"vertical",label:"Vertical"}]}}}
              .value=${t.direction??"horizontal"}
              .label=${"Direction"}
              @value-changed=${n=>this._updateEffectConfig(a,"direction",n.detail.value)}
            ></ha-selector>
          `:""}
          ${this._renderField({key:"opacity",label:"Opacity",type:"number",min:0,max:1,step:.05,default:1},t,a)}
        </div>
      </lcards-form-section>

      ${l?i`
        <lcards-form-section header="Scrolling" icon="mdi:arrow-all" ?expanded=${false}>
          <div class="param-grid">
            ${this._renderField({key:"scroll_speed_x",label:"Scroll Speed X (px/s)",type:"number",min:-200,max:200,step:5,default:0},t,a)}
            ${this._renderField({key:"scroll_speed_y",label:"Scroll Speed Y (px/s)",type:"number",min:-200,max:200,step:5,default:0},t,a)}
          </div>
        </lcards-form-section>
      `:""}
    `}_renderSolidSection(e,t){return i`
      <lcards-form-section header="Colour" icon="mdi:palette" ?expanded=${true}>
        <lcards-color-picker
          .hass=${this.hass}
          .value=${e.color??"rgba(0, 0, 0, 0.4)"}
          .variablePrefixes=${["--lcards-","--lcars-","--cblcars-"]}
          ?showPreview=${true}
          @value-changed=${a=>this._updateEffectConfig(t,"color",a.detail.value)}
        ></lcards-color-picker>
      </lcards-form-section>

      <lcards-form-section header="Parameters" icon="mdi:tune" ?expanded=${true}>
        <div class="param-grid">
          ${this._renderField({key:"opacity",label:"Opacity",type:"number",min:0,max:1,step:.05,default:1},e,t)}
        </div>
      </lcards-form-section>
    `}_renderField(e,t,a){const r=t[e.key]??e.default;return e.type==="color"?i`
        <lcards-color-picker
          .hass=${this.hass}
          .value=${r}
          .variablePrefixes=${["--lcards-","--lcars-","--cblcars-"]}
          ?showPreview=${true}
          @value-changed=${l=>this._updateEffectConfig(a,e.key,l.detail.value)}
        ></lcards-color-picker>
      `:e.type==="list"?i`
        <ha-selector
          .hass=${this.hass}
          .selector=${{text:{}}}
          .value=${Array.isArray(r)?r.join(", "):""}
          .label=${e.label}
          .helper=${e.helper}
          @value-changed=${l=>{const s=String(l.detail.value??"").split(",").map(o=>o.trim()).filter(Boolean).map(Number);s.some(o=>!Number.isFinite(o))||this._updateEffectConfig(a,e.key,s.length?s:void 0)}}
        ></ha-selector>
      `:i`
      <ha-selector
        .hass=${this.hass}
        .selector=${this._getFieldSelector(e)}
        .value=${r}
        .label=${e.label}
        .helper=${e.helper}
        @value-changed=${l=>this._updateEffectConfig(a,e.key,l.detail.value)}
      ></ha-selector>
    `}_renderEntityBindingNote(){return i`
      <p class="info-guide-tip"><strong>Follow an entity:</strong> any parameter can track an entity (speed to brightness,
        say), in this card's YAML. <code>map_range</code> is the usual way; a template is the advanced one.</p>
      <pre class="info-guide-example">scroll_speed_x: { map_range: { attribute: brightness, input: [0, 255], output: [-200, 200] } }
fill_pct: "[[[return entity.attributes.brightness / 2.55]]]"</pre>
    `}_renderZoomSection(e,t){const a=e.zoom||{},r=a&&Object.keys(a).length>0;return i`
      <div class="zoom-section">
        <div class="zoom-header">
          <div class="zoom-title">
            <ha-icon icon="mdi:magnify-expand"></ha-icon>
            <span>Zoom Effect (3D Depth)</span>
          </div>
          <ha-switch
            .checked=${r}
            @change=${l=>this._toggleZoom(t,l.target.checked)}
          ></ha-switch>
        </div>

        ${r?i`
          <div class="param-grid">
            <ha-selector
              .hass=${this.hass}
              .selector=${{number:{min:2,max:10,step:1,mode:"slider"}}}
              .value=${a.layers??4}
              .label=${"Zoom Layers"}
              .helper=${"Number of scaled instances (more = smoother but slower)"}
              @value-changed=${l=>this._updateZoomConfig(t,"layers",l.detail.value)}
            ></ha-selector>

            <ha-selector
              .hass=${this.hass}
              .selector=${{number:{min:.1,max:1,step:.1,mode:"slider"}}}
              .value=${a.scale_from??.5}
              .label=${"Scale From"}
              .helper=${"Starting scale (0.5 = half size)"}
              @value-changed=${l=>this._updateZoomConfig(t,"scale_from",l.detail.value)}
            ></ha-selector>

            <ha-selector
              .hass=${this.hass}
              .selector=${{number:{min:1,max:5,step:.1,mode:"slider"}}}
              .value=${a.scale_to??2}
              .label=${"Scale To"}
              .helper=${"Ending scale (2.0 = double size)"}
              @value-changed=${l=>this._updateZoomConfig(t,"scale_to",l.detail.value)}
            ></ha-selector>

            <ha-selector
              .hass=${this.hass}
              .selector=${{number:{min:5,max:60,step:1,mode:"slider"}}}
              .value=${a.duration??15}
              .label=${"Duration (seconds)"}
              .helper=${"Full zoom cycle duration"}
              @value-changed=${l=>this._updateZoomConfig(t,"duration",l.detail.value)}
            ></ha-selector>

            <ha-selector
              .hass=${this.hass}
              .selector=${{number:{min:0,max:100,step:5,mode:"slider"}}}
              .value=${a.opacity_fade_in??15}
              .label=${"Fade In (%)"}
              .helper=${"Opacity fade-in threshold"}
              @value-changed=${l=>this._updateZoomConfig(t,"opacity_fade_in",l.detail.value)}
            ></ha-selector>

            <ha-selector
              .hass=${this.hass}
              .selector=${{number:{min:0,max:100,step:5,mode:"slider"}}}
              .value=${a.opacity_fade_out??75}
              .label=${"Fade Out (%)"}
              .helper=${"Opacity fade-out threshold"}
              @value-changed=${l=>this._updateZoomConfig(t,"opacity_fade_out",l.detail.value)}
            ></ha-selector>
          </div>
        `:""}
      </div>
    `}_getPresetOptions(){return Object.entries(h).map(([e,t])=>({value:e,label:`${t.name} - ${t.description}`}))}_getPresetHelp(e){const t=h[e];return(t==null?void 0:t.description)||""}_getPresetIcon(e){return{grid:"mdi:grid","grid-diagonal":"mdi:grid-large","grid-hexagonal":"mdi:hexagon-multiple",starfield:"mdi:star-circle",nebula:"mdi:cloud","contour-field":"mdi:elevation-rise",cascade:"mdi:format-columns",level:"mdi:water",fluid:"mdi:water-wave",plasma:"mdi:fire",flow:"mdi:wave",shimmer:"mdi:shimmer",scanlines:"mdi:television-scan",image:"mdi:image",solid:"mdi:square-rounded"}[e]||"mdi:blur"}_getPresetFields(e,t){const a={scrolling:[{key:"scroll_speed_x",label:"Scroll Speed X (px/s)",type:"number",min:-200,max:200,step:5,default:20},{key:"scroll_speed_y",label:"Scroll Speed Y (px/s)",type:"number",min:-200,max:200,step:5,default:20}],styling:[{key:"color",label:"Colour",type:"color",default:"rgba(255, 153, 102, 0.3)",fullWidth:true},{key:"show_border_lines",label:"Show Border Lines",type:"boolean",default:true}]};switch(e){case"grid":return[{key:"line_spacing",label:"Line Spacing (px)",type:"number",min:10,max:200,step:5,default:40},{key:"line_width",label:"Line Width",type:"number",min:.5,max:10,step:.5,default:1},{key:"major_row_interval",label:"Major Row Interval (0=off)",type:"number",min:0,max:20,step:1,default:0},{key:"major_col_interval",label:"Major Col Interval (0=off)",type:"number",min:0,max:20,step:1,default:0},{key:"line_width_major",label:"Major Line Width",type:"number",min:.5,max:10,step:.5,default:2},{key:"color_major",label:"Major Line Colour",type:"color",default:"",fullWidth:true,helper:"Leave empty to use same as colour"},{key:"fill_color",label:"Fill Colour",type:"color",default:"",fullWidth:true,helper:"Cell background fill (leave empty for transparent)"},{key:"pattern",label:"Pattern",type:"select",options:["both","horizontal","vertical"],default:"both"},...a.scrolling,...a.styling];case"grid-diagonal":return[{key:"line_spacing",label:"Line Spacing (px)",type:"number",min:10,max:200,step:5,default:60},{key:"line_width",label:"Line Width",type:"number",min:.5,max:10,step:.5,default:1},{key:"fill_color",label:"Fill Colour",type:"color",default:"",fullWidth:true,helper:"Cell background fill (leave empty for transparent)"},...a.scrolling,...a.styling];case"grid-hexagonal":return[{key:"hex_radius",label:"Hex Radius (px)",type:"number",min:10,max:100,step:5,default:30},{key:"line_width_minor",label:"Minor Line Width",type:"number",min:.5,max:10,step:.5,default:1},{key:"line_width_major",label:"Major Line Width",type:"number",min:.5,max:10,step:.5,default:2},{key:"major_row_interval",label:"Major Row Interval (0=off)",type:"number",min:0,max:10,step:1,default:0},{key:"major_col_interval",label:"Major Col Interval (0=off)",type:"number",min:0,max:10,step:1,default:0},{key:"color_major",label:"Major Hex Colour",type:"color",default:"",fullWidth:true,helper:"Leave empty to use same as colour"},{key:"fill_color",label:"Fill Colour",type:"color",default:"",fullWidth:true,helper:"Cell background fill (leave empty for transparent)"},...a.scrolling,...a.styling];case"starfield":return[{key:"seed",label:"Random Seed",type:"number",min:1,max:1e9,step:1,default:Math.floor(Math.random()*1e9),helper:"Change for different star patterns"},{key:"count",label:"Star Count",type:"number",min:50,max:500,step:10,default:150},{key:"min_radius",label:"Min Star Radius (px)",type:"number",min:.1,max:5,step:.1,default:.5},{key:"max_radius",label:"Max Star Radius (px)",type:"number",min:.5,max:10,step:.5,default:2},{key:"min_opacity",label:"Min Star Opacity",type:"number",min:0,max:1,step:.1,default:.3},{key:"max_opacity",label:"Max Star Opacity",type:"number",min:0,max:1,step:.1,default:1},{key:"color",label:"Star Colour",type:"color",default:"#ffffff",fullWidth:true},{key:"parallax_layers",label:"Parallax Layers",type:"number",min:1,max:5,step:1,default:3,helper:"More layers = more depth"},{key:"depth_factor",label:"Depth Factor",type:"number",min:0,max:1,step:.1,default:.5,helper:"Speed variation between layers"},...a.scrolling];case"nebula":return[{key:"seed",label:"Random Seed",type:"number",min:1,max:1e9,step:1,default:Math.floor(Math.random()*1e9),helper:"Change for different cloud patterns"},{key:"cloud_count",label:"Cloud Count",type:"number",min:1,max:10,step:1,default:4},{key:"min_radius",label:"Min Cloud Radius",type:"number",min:.05,max:.5,step:.05,default:.15,helper:"Fraction of canvas size (0-1)"},{key:"max_radius",label:"Max Cloud Radius",type:"number",min:.1,max:1,step:.05,default:.4,helper:"Fraction of canvas size (0-1)"},{key:"min_opacity",label:"Min Cloud Opacity",type:"number",min:0,max:1,step:.1,default:.3},{key:"max_opacity",label:"Max Cloud Opacity",type:"number",min:0,max:1,step:.1,default:.8},{key:"color",label:"Cloud Colour",type:"color",default:"#FF00FF",fullWidth:true},{key:"turbulence",label:"Turbulence Intensity",type:"number",min:0,max:1,step:.1,default:.5,helper:"How much clouds distort (0=none, 1=max)"},{key:"noise_scale",label:"Noise Scale",type:"number",min:.001,max:.01,step:.001,default:.003,helper:"Smaller = larger noise features"},...a.scrolling];case"cascade":return[{key:"num_rows",label:"Rows",type:"number",min:1,max:50,step:1,default:null},{key:"num_cols",label:"Columns",type:"number",min:1,max:100,step:1,default:null},{key:"format",label:"Format",type:"select",options:["hex","digit","float","alpha","mixed"],default:"hex"},{key:"pattern",label:"Pattern",type:"select",options:["default","niagara","fast","custom"],default:"default"},{key:"speed_multiplier",label:"Speed Multiplier",type:"number",min:.1,max:10,step:.1,default:1}];default:return a.styling}}_getFieldSelector(e){switch(e.type){case"number":return{number:{min:e.min,max:e.max,step:e.step,mode:"slider"}};case"color":return{text:{}};case"boolean":return{boolean:{}};case"select":return{select:{mode:"dropdown",options:e.options.map(t=>({value:t,label:t}))}};default:return{text:{}}}}_getEffectDetails(e){const t=e.config||{},a=e.preset||"grid",r=[];if(t.line_spacing&&r.push(`spacing: ${t.line_spacing}px`),t.hex_radius&&r.push(`radius: ${t.hex_radius}px`),t.color&&r.push(`color: ${t.color}`),e.zoom&&r.push(`zoom: ${e.zoom.layers||4} layers`),a==="cascade"&&(t.format&&r.push(`format: ${t.format}`),t.pattern&&r.push(`pattern: ${t.pattern}`)),a==="contour-field"&&(t.num_bands!==void 0&&r.push(`bands: ${t.num_bands}`),t.cell_size!==void 0&&r.push(`cell: ${t.cell_size}px`),t.fill_level!==void 0&&r.push(`fill: ${t.fill_level}`),t.blend_colors===false&&r.push("solid bands")),a==="level"&&(t.fill_pct!==void 0&&r.push(`fill: ${t.fill_pct}%`),t.direction&&r.push(`dir: ${t.direction}`),t.edge_glow===false&&r.push("glow: off")),["fluid","plasma","flow","shimmer","scanlines"].includes(a)&&t.opacity!==void 0&&t.opacity!==1&&r.push(`opacity: ${t.opacity}`),a==="image"){const l=t.source??t.url??"";l.startsWith("builtin:")?r.push(l.slice(8)):l?r.push(l.split("/").pop()||l):r.push("no source")}return r.join(" • ")||"No configuration"}_toggleExpanded(e){this._expandedEffects={...this._expandedEffects,[e]:!this._expandedEffects[e]}}_addEffect(){const e={preset:"grid",config:{}},{effects:t,inset:a}=this._normalizedConfig,r=[...t,e];this._expandedEffects={...this._expandedEffects,[r.length-1]:true},this._emitChange(r,a)}_duplicateEffect(e,t){e.stopPropagation();const{effects:a,inset:r}=this._normalizedConfig,l=JSON.parse(JSON.stringify(a[t])),s=[...a];s.splice(t+1,0,l),this._expandedEffects={...this._expandedEffects,[t+1]:true},this._emitChange(s,r)}_deleteEffect(e,t){e.stopPropagation();const{effects:a,inset:r}=this._normalizedConfig,l=a.filter((o,n)=>n!==t),s={};Object.keys(this._expandedEffects).forEach(o=>{const n=parseInt(o);n<t?s[n]=this._expandedEffects[n]:n>t&&(s[n-1]=this._expandedEffects[n])}),this._expandedEffects=s,this._emitChange(l,r)}_updateEffect(e,t,a){const{effects:r,inset:l}=this._normalizedConfig,s=[...r];s[e]={...s[e],[t]:a},a===void 0&&delete s[e][t],t==="preset"&&(s[e].config=this._getDefaultConfig(a)),this._emitChange(s,l)}_updateEffectConfig(e,t,a){const{effects:r,inset:l}=this._normalizedConfig,s=[...r],o={...s[e].config,[t]:a};a===void 0&&delete o[t],s[e]={...s[e],config:o},this._emitChange(s,l)}_toggleZoom(e,t){const{effects:a,inset:r}=this._normalizedConfig,l=[...a];t?l[e].zoom={layers:4,scale_from:.5,scale_to:2,duration:15,opacity_fade_in:15,opacity_fade_out:75}:delete l[e].zoom,this._emitChange(l,r)}_updateZoomConfig(e,t,a){const{effects:r,inset:l}=this._normalizedConfig,s=[...r];s[e]={...s[e],zoom:{...s[e].zoom,[t]:a}},this._emitChange(s,l)}_getDefaultConfig(e){switch(e){case"grid":case"grid-diagonal":case"grid-hexagonal":return{};case"starfield":return{seed:Math.floor(Math.random()*1e9)};case"nebula":return{seed:Math.floor(Math.random()*1e9)};case"scanlines":return{color:"rgba(255,255,255,0.15)"};case"cascade":return{format:"mixed",pattern:"default",font_size:24,gap:12};case"contour-field":return{seed:Math.floor(Math.random()*1e9),noise_scale:.005,num_octaves:2,num_bands:5,cell_size:1,blend_colors:true,fill_level:.45,fill_color:"alpha(var(--lcars-midnight-blue), 0.30)",colors:["alpha(#130b81, 0.08)","alpha(#130b81, 0.25)","alpha(#130b81, 0.42)","alpha(#130b81, 0.62)","alpha(#130b81, 0.80)"],scroll_speed_x:-3,scroll_speed_y:.45};default:return{}}}_handleDragStart(e,t){this._draggedIndex=t,e.dataTransfer&&(e.dataTransfer.effectAllowed="move"),e.dataTransfer.setData("text/html",e.target.innerHTML)}_handleDragEnd(e){var t;this._draggedIndex=null,(t=this.shadowRoot)==null||t.querySelectorAll(".effect-item").forEach(a=>{a.classList.remove("drag-over")})}_handleDragOver(e,t){var r,l;e.preventDefault(),e.dataTransfer&&(e.dataTransfer.dropEffect="move");const a=((r=this.shadowRoot)==null?void 0:r.querySelectorAll(".effect-item"))??[];a.forEach(s=>s.classList.remove("drag-over")),(l=a[t])==null||l.classList.add("drag-over")}_handleDrop(e,t){var c;e.preventDefault(),e.stopPropagation();const a=this._draggedIndex;if(a===null||a===t)return;const{effects:r,inset:l}=this._normalizedConfig,s=[...r],[o]=s.splice(a,1);s.splice(t,0,o);const n={};Object.keys(this._expandedEffects).forEach(u=>{const m=parseInt(u);let f=m;m===a?f=t:a<t&&m>a&&m<=t?f=m-1:a>t&&m>=t&&m<a&&(f=m+1),n[f]=this._expandedEffects[u]}),this._expandedEffects=n,this._draggedIndex=null,(c=this.shadowRoot)==null||c.querySelectorAll(".effect-item").forEach(u=>{u.classList.remove("drag-over")}),this._emitChange(s,l)}_emitChange(e,t,a){const r=a!==void 0?a:this._normalizedConfig.fps,l=t!=null,s=r!=null,o=l||s?{...s&&{fps:r},...l&&{inset:t},effects:e}:e;z.debug("[BackgroundAnimationEditor] Effects changed",o),this.dispatchEvent(new CustomEvent("effects-changed",{detail:{value:o},bubbles:true,composed:true}))}};p(v,"LCARdSBackgroundAnimationEditor");let y=v;customElements.get("lcards-background-animation-editor")||customElements.define("lcards-background-animation-editor",y);
//# sourceMappingURL=lcards-background-animation-editor-8VgPdunD.js.map
