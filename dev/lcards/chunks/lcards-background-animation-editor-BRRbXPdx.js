var _=Object.defineProperty;var f=(y,a)=>_(y,"name",{value:a,configurable:true});import{i as v,a as $,b as i,I as h,C as x,l as k}from"./lcards-main-BW4hZuuz.js";import"./lcards-form-section-Bxom3ojy.js";import"./lcards-color-list-ynmm09Za.js";import{i as w,s as C,r as S}from"./lcards-message-DJxE4eZn.js";import{B as E}from"./lcards-filter-editor-Da5JBbfk.js";const b=class b2 extends v{static get properties(){return{hass:{type:Object},config:{type:Object},_expandedIndex:{type:Number},_draggedIndex:{type:Number},_expandedEffects:{type:Object},_imageSrcModes:{type:Object,state:true},_insetEnabled:{type:Boolean,state:true}}}static get styles(){return[$`
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
    `,w,C]}constructor(){super(),this.hass=void 0,this.config=null,this._expandedIndex=null,this._draggedIndex=null,this._expandedEffects={},this._imageSrcModes={},this._insetEnabled=false}get _normalizedConfig(){const a=this.config;return a?Array.isArray(a)?{inset:null,fps:null,effects:a}:{inset:a.inset??null,fps:a.fps??null,effects:a.effects??[]}:{inset:null,fps:null,effects:[]}}render(){const{effects:a}=this._normalizedConfig;return i`
      <div class="effects-container">
        ${this._renderInfoBanner()}
        ${this._renderCanvasSettings()}

        <ha-button @click=${this._addEffect} class="add-button">
          <ha-icon icon="mdi:plus" slot="start"></ha-icon>
          Add Background Effect
        </ha-button>

        ${a.length===0?this._renderEmptyState():""}
        ${a.map((e,t)=>this._renderEffectItem(e,t))}
      </div>
    `}_renderCanvasSettings(){const{inset:a,fps:e}=this._normalizedConfig,t=this._insetEnabled||a!=null,l=a==="auto",r=a&&typeof a=="object"?a:{top:0,right:0,bottom:0,left:0};return i`
      <lcards-form-section
        header="Canvas Settings"
        icon="mdi:crop"
        ?expanded=${t}>

        <ha-selector
          .hass=${this.hass}
          .selector=${{number:{min:1,max:120,step:1,mode:"slider"}}}
          .value=${e??30}
          .label=${"Animation FPS"}
          .helper=${"Max frames per second for the background animation. Default 30 is recommended for most devices. Use 60 for high-refresh displays."}
          @value-changed=${s=>{const n=s.detail.value;this._emitChange(this._normalizedConfig.effects,this._normalizedConfig.inset,n===30?null:n)}}
        ></ha-selector>

        <ha-selector
          .hass=${this.hass}
          .selector=${{boolean:{}}}
          .value=${t}
          .label=${"Enable canvas inset"}
          .helper=${"Offset the animation canvas from card edges"}
          @value-changed=${s=>{this._insetEnabled=s.detail.value,s.detail.value?this._emitChange(this._normalizedConfig.effects,l?"auto":{top:0,right:0,bottom:0,left:0}):this._emitChange(this._normalizedConfig.effects,null)}}
        ></ha-selector>

        ${t?i`
          <ha-selector
            .hass=${this.hass}
            .selector=${{boolean:{}}}
            .value=${l}
            .label=${"Auto inset (elbow cards)"}
            .helper=${"Automatically offset canvas to avoid elbow card bars"}
            @value-changed=${s=>{s.detail.value?this._emitChange(this._normalizedConfig.effects,"auto"):this._emitChange(this._normalizedConfig.effects,{top:0,right:0,bottom:0,left:0})}}
          ></ha-selector>

          ${l?"":this._renderManualInsetControls(r)}
        `:""}
      </lcards-form-section>
    `}_renderManualInsetControls(a){return[["top","Top"],["right","Right"],["bottom","Bottom"],["left","Left"]].map(([t,l])=>i`
      <ha-selector
        .hass=${this.hass}
        .selector=${{number:{min:0,max:500,step:1,mode:"slider"}}}
        .value=${a[t]??0}
        .label=${l}
        @value-changed=${r=>{const s={...a,[t]:r.detail.value};this._emitChange(this._normalizedConfig.effects,s)}}
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
    `}_renderEffectItem(a,e){const t=this._expandedEffects[e]||false,l=a.preset||"grid",r=h[l],s=(r==null?void 0:r.name)||l,n=this._draggedIndex===e,d=a.zoom&&Object.keys(a.zoom).length>0;return i`
      <div
        class="effect-item ${n?"dragging":""}"
        @dragover=${o=>this._handleDragOver(o,e)}
        @drop=${o=>this._handleDrop(o,e)}>

        <div
          class="effect-header"
          draggable="true"
          @dragstart=${o=>this._handleDragStart(o,e)}
          @dragend=${o=>this._handleDragEnd(o)}
          @click=${()=>this._toggleExpanded(e)}>
          <!-- Drag Handle -->
          <ha-icon
            class="drag-handle"
            icon="mdi:drag"
            @click=${o=>o.stopPropagation()}>
          </ha-icon>

          <ha-icon
            class="effect-icon"
            icon=${this._getPresetIcon(l)}>
          </ha-icon>

          <div class="effect-info">
            <div class="effect-type-row">
              <span class="effect-type">${s}</span>
              ${d?i`<span class="layer-badge">ZOOM</span>`:""}
              <span class="layer-badge">Layer ${e+1}</span>
            </div>
            <div class="effect-details">${this._getEffectDetails(a)}</div>
          </div>

          <div class="effect-actions">
            <ha-icon-button
              @click=${o=>this._duplicateEffect(o,e)}
              .label=${"Duplicate"}
              .path=${"M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"}>
            </ha-icon-button>
            <ha-icon-button
              @click=${o=>this._deleteEffect(o,e)}
              .label=${"Delete"}
              .path=${"M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"}>
            </ha-icon-button>
          </div>

          <ha-icon
            class="expand-icon ${t?"expanded":""}"
            icon="mdi:chevron-down">
          </ha-icon>
        </div>

        ${t?i`
          <div class="effect-content">
            ${this._renderEffectForm(a,e)}
          </div>
        `:""}
      </div>
    `}_renderEffectForm(a,e){const t=a.preset||"grid";return i`
      <!-- Preset Selection -->
      <lcards-form-section
        header="Effect Preset"
        icon="mdi:palette"
        ?expanded=${true}>

        <ha-selector
          .hass=${this.hass}
          .selector=${{select:{mode:"dropdown",custom_value:true,options:this._getPresetOptions()}}}
          .value=${t}
          .label=${"Background effect type"}
          .helper=${this._getPresetHelp(t)}
          @value-changed=${l=>this._updateEffect(e,"preset",l.detail.value)}
        ></ha-selector>
      </lcards-form-section>

      ${this._renderEffectInfoGuide(t,e)}

      <!-- Preset Configuration -->
      ${this._renderPresetConfig(a,e)}

      <!-- Zoom Wrapper -->
      ${this._renderZoomSection(a,e)}
    `}_renderEffectInfoGuide(a,e){var s;const t=h[a];if(!(t!=null&&t.guide))return"";const l=`${E}#${a}`,r=t.guide;return i`
      ${S({header:`How ${t.name} works`,icon:"mdi:information-outline",body:i`
            ${this._splitIntoSentences(r.summary).map(n=>i`<p>${n}</p>`)}
            ${(s=r.params)!=null&&s.length?i`
              <strong>Params:</strong>
              <ul>
                ${r.params.map(n=>i`
                  <li>
                    <code>${n.key}</code>${n.default!==void 0?i` (default: <code>${JSON.stringify(n.default)}</code>)`:""}
                    ${n.description?`: ${n.description}`:""}
                  </li>
                `)}
              </ul>
            `:""}
            <strong>Example:</strong>
            <pre class="info-guide-example">${r.example}</pre>
            ${r.tip?i`
              <p class="info-guide-tip"><strong>Tip:</strong> ${r.tip}</p>
            `:""}
            ${this._renderEntityBindingNote()}
            <div class="info-guide-links">
              <a href=${l} target="_blank" rel="noopener noreferrer">View full docs →</a>
            </div>
          `})}
    `}_splitIntoSentences(a){return a?a.split(new RegExp("(?<=[.!?])\\s+(?=[A-Z`])")):[]}_renderPresetConfig(a,e){const t=a.preset||"grid",l=a.config||{};return t==="starfield"?i`
        ${this._renderStarfieldSection(l,e)}
        ${this._renderScrollingSection(l,e)}
      `:t==="nebula"?i`
        ${this._renderNebulaSection(l,e)}
        ${this._renderScrollingSection(l,e)}
      `:t==="contour-field"?i`
        ${this._renderContourFieldSection(l,e)}
        ${this._renderScrollingSection(l,e)}
      `:t==="cascade"?i`${this._renderCascadeSection(l,e)}`:t==="level"?i`${this._renderLevelSection(l,e)}`:["fluid","plasma","flow","shimmer","scanlines"].includes(t)?i`${this._renderTexturePresetSection(t,l,e)}`:t==="image"?i`${this._renderImageBackgroundSection(l,e)}`:t==="solid"?i`${this._renderSolidSection(l,e)}`:i`
      ${this._renderPatternSection(t,l,e)}
      ${this._renderMajorMinorSection(t,l,e)}
      ${this._renderScrollingSection(l,e)}
      ${this._renderColorSection(t,l,e)}
    `}_renderPatternSection(a,e,t){const l=[];return(a==="grid"||a==="grid-diagonal")&&l.push({key:"line_spacing",label:"Line Spacing (px)",type:"number",min:10,max:200,step:5,default:40}),a==="grid-hexagonal"&&l.push({key:"hex_radius",label:"Hex Radius (px)",type:"number",min:1,max:150,step:1,default:40}),a!=="grid-hexagonal"&&l.push({key:"line_width",label:"Line Width",type:"number",min:.5,max:10,step:.5,default:1}),a==="grid"&&(l.push({key:"pattern",label:"Pattern",type:"select",options:["both","horizontal","vertical","diagonal","hexagonal","dots"],default:"both"}),e.pattern==="dots"&&l.push({key:"dot_radius",label:"Dot Radius (px)",type:"number",min:.5,max:10,step:.5,default:2}),e.pattern==="hexagonal"&&l.push({key:"hex_radius",label:"Hex Radius (px)",type:"number",min:1,max:150,step:1,default:40})),l.push({key:"show_border_lines",label:"Show Border Lines",type:"boolean",default:true}),l.length===0?"":i`
      <lcards-form-section
        header="Pattern"
        icon="mdi:grid"
        ?expanded=${true}>
        <div class="param-grid">
          ${l.map(r=>this._renderField(r,e,t))}
        </div>
      </lcards-form-section>
    `}_renderMajorMinorSection(a,e,t){const l=[];return a==="grid"?l.push({key:"major_row_interval",label:"Major Row Interval (0=off)",type:"number",min:0,max:20,step:1,default:0},{key:"major_col_interval",label:"Major Col Interval (0=off)",type:"number",min:0,max:20,step:1,default:0},{key:"line_width_major",label:"Major Line Width",type:"number",min:.5,max:10,step:.5,default:2}):a==="grid-hexagonal"&&l.push({key:"line_width_minor",label:"Minor Line Width",type:"number",min:.5,max:10,step:.5,default:1},{key:"line_width_major",label:"Major Line Width",type:"number",min:.5,max:10,step:.5,default:2},{key:"major_row_interval",label:"Major Row Interval (0=off)",type:"number",min:0,max:10,step:1,default:0},{key:"major_col_interval",label:"Major Col Interval (0=off)",type:"number",min:0,max:10,step:1,default:0}),l.length===0?"":i`
      <lcards-form-section
        header="Major/Minor Lines"
        icon="mdi:format-line-weight"
        description="Configure major line divisions (set intervals to 0 to disable)"
        ?expanded=${true}>
        <div class="param-grid">
          ${l.map(r=>this._renderField(r,e,t))}
        </div>
      </lcards-form-section>
    `}_renderScrollingSection(a,e){return i`
      <lcards-form-section
        header="Scrolling"
        icon="mdi:arrow-all"
        ?expanded=${true}>
        <div class="param-grid">
          ${this._renderField({key:"scroll_speed_x",label:"Scroll Speed X (px/s)",type:"number",min:-200,max:200,step:5,default:20},a,e)}
          ${this._renderField({key:"scroll_speed_y",label:"Scroll Speed Y (px/s)",type:"number",min:-200,max:200,step:5,default:20},a,e)}
        </div>
      </lcards-form-section>
    `}_renderStarfieldSection(a,e){return i`
      <lcards-form-section
        header="Star Properties"
        icon="mdi:star-circle"
        ?expanded=${true}>
        <div class="param-grid">
          ${this._renderField({key:"seed",label:"Random Seed",type:"number",min:1,max:1e9,step:1,default:Math.floor(Math.random()*1e9),helper:"Change for different star patterns"},a,e)}
          ${this._renderField({key:"count",label:"Star Count",type:"number",min:50,max:500,step:10,default:150},a,e)}
          ${this._renderField({key:"min_radius",label:"Min Star Radius (px)",type:"number",min:.1,max:5,step:.1,default:.5},a,e)}
          ${this._renderField({key:"max_radius",label:"Max Star Radius (px)",type:"number",min:.5,max:10,step:.5,default:2},a,e)}
          ${this._renderField({key:"min_opacity",label:"Min Star Opacity",type:"number",min:0,max:1,step:.1,default:.3},a,e)}
          ${this._renderField({key:"max_opacity",label:"Max Star Opacity",type:"number",min:0,max:1,step:.1,default:1},a,e)}
        </div>
      </lcards-form-section>

      <lcards-form-section
        header="Colour"
        icon="mdi:palette"
        ?expanded=${true}>
        <lcards-color-list
          .hass=${this.hass}
          .colors=${a.colors||(a.color?[a.color]:[])}
          .label=${"Star Colours"}
          .description=${"Stars will randomly use one of these colors"}
          @colors-changed=${t=>this._updateEffectConfig(e,"colors",t.detail.colors)}
        ></lcards-color-list>
      </lcards-form-section>

      <lcards-form-section
        header="Parallax Depth"
        icon="mdi:layers"
        description="Multiple layers create depth effect - closer layers scroll faster"
        ?expanded=${true}>
        <div class="param-grid">
          ${this._renderField({key:"parallax_layers",label:"Parallax Layers",type:"number",min:1,max:5,step:1,default:3,helper:"More layers = more depth"},a,e)}
          ${this._renderField({key:"depth_factor",label:"Depth Factor",type:"number",min:0,max:1,step:.1,default:.5,helper:"Speed variation between layers"},a,e)}
        </div>
      </lcards-form-section>
    `}_renderNebulaSection(a,e){return i`
      <lcards-form-section
        header="Cloud Properties"
        icon="mdi:cloud"
        ?expanded=${true}>
        <div class="param-grid">
          ${this._renderField({key:"seed",label:"Random Seed",type:"number",min:1,max:1e9,step:1,default:Math.floor(Math.random()*1e9),helper:"Change for different cloud patterns"},a,e)}
          ${this._renderField({key:"cloud_count",label:"Cloud Count",type:"number",min:1,max:10,step:1,default:4},a,e)}
          ${this._renderField({key:"min_radius",label:"Min Cloud Radius",type:"number",min:.05,max:.5,step:.05,default:.15,helper:"Fraction of canvas size (0-1)"},a,e)}
          ${this._renderField({key:"max_radius",label:"Max Cloud Radius",type:"number",min:.1,max:1,step:.05,default:.4,helper:"Fraction of canvas size (0-1)"},a,e)}
          ${this._renderField({key:"min_opacity",label:"Min Cloud Opacity",type:"number",min:0,max:1,step:.1,default:.3},a,e)}
          ${this._renderField({key:"max_opacity",label:"Max Cloud Opacity",type:"number",min:0,max:1,step:.1,default:.8},a,e)}
        </div>
      </lcards-form-section>

      <lcards-form-section
        header="Colour"
        icon="mdi:palette"
        ?expanded=${true}>
        <lcards-color-list
          .hass=${this.hass}
          .colors=${a.colors||(a.color?[a.color]:[])}
          .label=${"Cloud Colours"}
          .description=${"Clouds will randomly use one of these colors"}
          @colors-changed=${t=>this._updateEffectConfig(e,"colors",t.detail.colors)}
        ></lcards-color-list>
      </lcards-form-section>

      <lcards-form-section
        header="Turbulence"
        icon="mdi:waves"
        description="Perlin noise creates organic cloud movement"
        ?expanded=${true}>
        <div class="param-grid">
          ${this._renderField({key:"turbulence",label:"Turbulence Intensity",type:"number",min:0,max:1,step:.1,default:.5,helper:"How much clouds distort (0=none, 1=max)"},a,e)}
          ${this._renderField({key:"noise_scale",label:"Noise Scale",type:"number",min:.001,max:.01,step:.001,default:.003,helper:"Smaller = larger noise features"},a,e)}
        </div>
      </lcards-form-section>
    `}_renderContourFieldSection(a,e){return i`
      <lcards-form-section
        header="Noise"
        icon="mdi:waves"
        description="Shapes the raw terrain the bands are sliced from"
        ?expanded=${true}>
        <div class="param-grid">
          ${this._renderField({key:"seed",label:"Random Seed",type:"number",min:1,max:1e9,step:1,default:Math.floor(Math.random()*1e9),helper:"Same seed + settings = same field every time; change it to get a different layout without touching anything else"},a,e)}
          ${this._renderField({key:"noise_scale",label:"Noise Scale",type:"number",min:.001,max:.05,step:.001,default:.01,helper:"Smaller = a few large drifting blobs; larger = many small, busy ripples"},a,e)}
          ${this._renderField({key:"num_octaves",label:"Noise Octaves",type:"number",min:1,max:8,step:1,default:4,helper:"Layers of fine detail added on top of the base shape; 1 = smooth blobs, 8 = rough, cloud-like fuzz"},a,e)}
        </div>
      </lcards-form-section>

      <lcards-form-section
        header="Contour Bands"
        icon="mdi:elevation-rise"
        description="Always sliced across the full peaks-and-valleys range, regardless of Fill below"
        ?expanded=${true}>
        <div class="param-grid">
          ${this._renderField({key:"num_bands",label:"Band Count",type:"number",min:2,max:64,step:1,default:8,helper:"Low (2-8) = bold stepped contour lines/rings; high (32+) = a smooth, almost continuous gradient"},a,e)}
          ${this._renderField({key:"cell_size",label:"Cell Size (px)",type:"number",min:1,max:16,step:1,default:3,helper:"Sample resolution. Larger = blockier/pixelated edges but cheaper to render; smaller = crisp smooth edges but more GPU/CPU cost"},a,e)}
        </div>
      </lcards-form-section>

      <lcards-form-section
        header="Fill"
        icon="mdi:water"
        description="Floods or drains a waterline over the terrain above; doesn't change the terrain itself"
        ?expanded=${true}>
        <div class="param-grid">
          ${this._renderField({key:"fill_level",label:"Fill Level",type:"number",min:0,max:.95,step:.05,default:0,helper:"0 = no water, full terrain visible. Raise it to flood the lowest rings: they become Fill Colour instead of their normal colour, leaving isolated nebula-like blobs at the peaks."},a,e)}
          ${this._renderField({key:"fill_color",label:"Fill Colour",type:"color",default:"",fullWidth:true,helper:'Leave empty for literal transparency (the card background shows through as "space"). Set a colour (e.g. black) to bake the void into the effect itself.'},a,e)}
        </div>
      </lcards-form-section>

      <lcards-form-section
        header="Colour"
        icon="mdi:palette"
        description="What fills each contour ring above the waterline"
        ?expanded=${true}>
        <div class="param-grid">
          ${this._renderField({key:"blend_colors",label:"Blend Between Colours",type:"boolean",default:true,helper:"On = colours (and the Fill waterline) fade smoothly. Off = every edge is a hard cutoff with no blending anywhere: flat, solid rings and a crisp shoreline, matching real contour maps and the reference site's look."},a,e)}
        </div>
        <lcards-color-list
          .hass=${this.hass}
          .colors=${a.colors||(a.color?[a.color]:[])}
          .label=${"Band Colours"}
          .description=${"One colour or several stops spread evenly across the full contour range, from lowest ring to highest"}
          @colors-changed=${t=>this._updateEffectConfig(e,"colors",t.detail.colors)}
        ></lcards-color-list>
      </lcards-form-section>
    `}_renderCascadeSection(a,e){return i`
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
            .value=${a.num_rows??""}
            placeholder="auto"
            @input=${t=>this._updateEffectConfig(e,"num_rows",t.target.value?Number(t.target.value):null)}
          ></ha-input>
          <ha-input
            type="number"
            label="Columns (blank = auto)"
            hint="Leave empty to fill card width automatically"
            min="1"
            max="100"
            step="1"
            .value=${a.num_cols??""}
            placeholder="auto"
            @input=${t=>this._updateEffectConfig(e,"num_cols",t.target.value?Number(t.target.value):null)}
          ></ha-input>
          ${this._renderField({key:"gap",label:"Cell Gap (px)",type:"number",min:0,max:20,step:1,default:4},a,e)}
        </div>
      </lcards-form-section>

      <!-- Data Format -->
      <lcards-form-section header="Data Format" icon="mdi:numeric" ?expanded=${true}>
        <ha-selector
          .hass=${this.hass}
          .selector=${{select:{mode:"dropdown",options:[{value:"hex",label:"Hex (A3F1, 00FF)"},{value:"digit",label:"Digit (0042, 1337)"},{value:"float",label:"Float (42.17, 3.14)"},{value:"alpha",label:"Alpha (AB, XY)"},{value:"mixed",label:"Mixed (various)"}]}}}
          .value=${a.format??"hex"}
          .label=${"Cell data format"}
          @value-changed=${t=>this._updateEffectConfig(e,"format",t.detail.value)}
        ></ha-selector>
        <ha-selector
          .hass=${this.hass}
          .selector=${{number:{min:0,max:6e4,step:500,mode:"box"}}}
          .value=${a.refresh_interval??0}
          .label=${"Refresh Interval (ms, 0 = static)"}
          .helper=${"How often to regenerate random cell values. 0 = never refresh."}
          @value-changed=${t=>this._updateEffectConfig(e,"refresh_interval",t.detail.value)}
        ></ha-selector>
      </lcards-form-section>

      <!-- Typography -->
      <lcards-form-section header="Typography" icon="mdi:format-size" ?expanded=${true}>
        <div class="param-grid">
          ${this._renderField({key:"font_size",label:"Font Size (px)",type:"number",min:6,max:48,step:1,default:10},a,e)}
          <ha-selector
            .hass=${this.hass}
            .selector=${{text:{}}}
            .value=${a.font_family??"'Antonio', monospace"}
            .label=${"Font Family"}
            .helper=${"CSS font-family string"}
            @value-changed=${t=>this._updateEffectConfig(e,"font_family",t.detail.value)}
          ></ha-selector>
        </div>
      </lcards-form-section>

      <!-- Cascade Animation Timing -->
      <lcards-form-section header="Cascade Timing" icon="mdi:timer-outline" ?expanded=${true}>
        <ha-selector
          .hass=${this.hass}
          .selector=${{select:{mode:"dropdown",options:[{value:"default",label:"Default (authentic LCARS rhythm)"},{value:"niagara",label:"Niagara (smooth uniform waterfall)"},{value:"fast",label:"Fast (rapid cycling)"},{value:"custom",label:"Custom (manual per-row timing)"}]}}}
          .value=${a.pattern??"default"}
          .label=${"Timing Pattern"}
          @value-changed=${t=>this._updateEffectConfig(e,"pattern",t.detail.value)}
        ></ha-selector>
        ${(a.pattern??"default")==="custom"?i`
          <lcards-message type="info" .message=${`Custom timing requires a YAML-supplied "timing" array of { duration, delay } objects, one per row. Edit this card's YAML directly to set the timing property.`}></lcards-message>
        `:""}
        <div class="param-grid">
          ${this._renderField({key:"speed_multiplier",label:"Speed Multiplier (1.0 = normal)",type:"number",min:.1,max:10,step:.1,default:1,helper:"2.0 = twice as fast, 0.5 = half speed"},a,e)}
          ${this._renderField({key:"duration",label:"Duration Override (ms, 0 = use pattern)",type:"number",min:0,max:3e4,step:100,default:0,helper:"Overrides all row durations if > 0"},a,e)}
        </div>
      </lcards-form-section>

      <!-- Cascade Colors -->
      <lcards-form-section header="Cascade Colours" icon="mdi:palette" ?expanded=${true}>
        ${[{key:"start",label:"Start Colour",helper:"Bright hold colour (dominant, ~75% of cycle)",def:"var(--lcards-blue-light, #93e1ff)"},{key:"text",label:"Middle / Text Colour",helper:"Dark snap-to colour (~10% of cycle)",def:"var(--lcards-blue-darkest, #002241)"},{key:"end",label:"End Colour",helper:"Pale fade-out colour (~10% of cycle)",def:"var(--lcards-moonlight, #dfe1e8)"}].map(t=>{var l;return i`
          <div style="margin-bottom: 12px;">
            <div style="font-size: 14px; font-weight: 500; margin-bottom: 8px; padding: 2px 8px;">${t.label}</div>
            <lcards-color-picker
              .hass=${this.hass}
              .value=${((l=a.colors)==null?void 0:l[t.key])??t.def}
              .variablePrefixes=${["--lcards-","--lcars-","--cblcars-"]}
              ?showPreview=${true}
              @value-changed=${r=>{const s={...a.colors??{},[t.key]:r.detail.value};this._updateEffectConfig(e,"colors",s)}}>
            </lcards-color-picker>
            <div style="font-size: 12px; color: var(--secondary-text-color); margin-top: 4px; padding: 0 8px;">${t.helper}</div>
          </div>
        `})}
      </lcards-form-section>
    `}_renderColorSection(a,e,t){const l=[{key:"color",label:"Line Colour",helper:"Main line colour"}];return(a==="grid"||a==="grid-hexagonal")&&l.push({key:"color_major",label:"Major Line Colour",helper:"Leave empty to use same as main colour"}),(a==="grid"||a==="grid-diagonal"||a==="grid-hexagonal")&&l.push({key:"fill_color",label:"Fill Colour",helper:"Cell/area background fill (leave empty for transparent)"}),i`
      <lcards-form-section header="Colours" icon="mdi:palette" ?expanded=${true}>
        ${l.map(r=>i`
          <div style="margin-bottom: 12px;">
            <div style="font-size: 14px; font-weight: 500; margin-bottom: 8px; padding: 2px 8px;">${r.label}</div>
            <lcards-color-picker
              .hass=${this.hass}
              .value=${e[r.key]||""}
              .variablePrefixes=${["--lcards-","--lcars-","--cblcars-"]}
              ?showPreview=${true}
              @value-changed=${s=>this._updateEffectConfig(t,r.key,s.detail.value)}>
            </lcards-color-picker>
            <div style="font-size: 12px; color: var(--secondary-text-color); margin-top: 4px; padding: 0 8px;">${r.helper}</div>
          </div>
        `)}
      </lcards-form-section>
    `}_renderLevelSection(a,e){return i`
      <lcards-form-section header="Fill" icon="mdi:water" ?expanded=${true}>
        <div class="param-grid">
          ${this._renderField({key:"fill_pct",label:"Fill %",type:"number",min:0,max:100,step:1,default:50},a,e)}
          <ha-selector
            .hass=${this.hass}
            .selector=${{select:{mode:"dropdown",options:[{value:"up",label:"Up"},{value:"down",label:"Down"},{value:"left",label:"Left"},{value:"right",label:"Right"}]}}}
            .value=${a.direction??"up"}
            .label=${"Fill Direction"}
            @value-changed=${t=>this._updateEffectConfig(e,"direction",t.detail.value)}
          ></ha-selector>
          ${this._renderField({key:"opacity",label:"Opacity",type:"number",min:0,max:1,step:.05,default:1},a,e)}
        </div>
      </lcards-form-section>

      <lcards-form-section header="Colours" icon="mdi:palette" ?expanded=${true}>
        <div style="margin-bottom:12px;">
          <div style="font-size:14px;font-weight:500;margin-bottom:8px;padding:2px 8px;">Primary Colour</div>
          <lcards-color-picker
            .hass=${this.hass}
            .value=${a.color_a??a.color??"rgba(0,200,100,0.7)"}
            .variablePrefixes=${["--lcards-","--lcars-","--cblcars-"]}
            ?showPreview=${true}
            @value-changed=${t=>this._updateEffectConfig(e,"color_a",t.detail.value)}
          ></lcards-color-picker>
        </div>
        <div style="margin-bottom:12px;">
          <div style="font-size:14px;font-weight:500;margin-bottom:8px;padding:2px 8px;">Secondary Colour (gradient, optional)</div>
          <lcards-color-picker
            .hass=${this.hass}
            .value=${a.color_b??""}
            .variablePrefixes=${["--lcards-","--lcars-","--cblcars-"]}
            ?showPreview=${true}
            @value-changed=${t=>this._updateEffectConfig(e,"color_b",t.detail.value||null)}
          ></lcards-color-picker>
        </div>
        <div class="param-grid">
          ${this._renderField({key:"gradient_crossover",label:"Gradient Crossover %",type:"number",min:0,max:100,step:5,default:80,helper:"Where colour A blends into colour B"},a,e)}
        </div>
      </lcards-form-section>

      <lcards-form-section header="Primary Wave" icon="mdi:sine-wave" ?expanded=${true}>
        <div class="param-grid">
          ${this._renderField({key:"wave_height",label:"Wave Height (px)",type:"number",min:0,max:30,step:1,default:4},a,e)}
          ${this._renderField({key:"wave_count",label:"Wave Count",type:"number",min:1,max:20,step:1,default:4},a,e)}
          ${this._renderField({key:"wave_speed",label:"Wave Speed (px/s)",type:"number",min:-100,max:100,step:5,default:20},a,e)}
        </div>
      </lcards-form-section>

      <lcards-form-section header="Secondary Wave" icon="mdi:sine-wave" ?expanded=${false}>
        <div class="param-grid">
          ${this._renderField({key:"wave2_height",label:"Wave 2 Height (px)",type:"number",min:0,max:30,step:1,default:0},a,e)}
          ${this._renderField({key:"wave2_count",label:"Wave 2 Count",type:"number",min:1,max:20,step:1,default:5},a,e)}
          ${this._renderField({key:"wave2_speed",label:"Wave 2 Speed (px/s)",type:"number",min:-100,max:100,step:5,default:-15},a,e)}
        </div>
      </lcards-form-section>

      <lcards-form-section header="Sloshing" icon="mdi:waves" ?expanded=${false}>
        <div class="param-grid">
          ${this._renderField({key:"slosh_amount",label:"Slosh Amount (px)",type:"number",min:0,max:50,step:1,default:0,helper:"0 = no sloshing physics"},a,e)}
          ${this._renderField({key:"slosh_period",label:"Slosh Period (s)",type:"number",min:.5,max:10,step:.5,default:3},a,e)}
        </div>
      </lcards-form-section>

      <lcards-form-section header="Edge Glow" icon="mdi:flare" ?expanded=${false}>
        <div class="param-grid">
          <ha-selector
            .hass=${this.hass}
            .selector=${{boolean:{}}}
            .value=${a.edge_glow??true}
            .label=${"Enable Edge Glow"}
            @value-changed=${t=>this._updateEffectConfig(e,"edge_glow",t.detail.value)}
          ></ha-selector>
          ${this._renderField({key:"edge_glow_width",label:"Glow Width (px)",type:"number",min:1,max:30,step:1,default:6},a,e)}
        </div>
        <div style="margin-top:12px;">
          <div style="font-size:14px;font-weight:500;margin-bottom:8px;padding:2px 8px;">Glow Colour</div>
          <lcards-color-picker
            .hass=${this.hass}
            .value=${a.edge_glow_color??"rgba(255,255,255,0.7)"}
            .variablePrefixes=${["--lcards-","--lcars-","--cblcars-"]}
            ?showPreview=${true}
            @value-changed=${t=>this._updateEffectConfig(e,"edge_glow_color",t.detail.value)}
          ></lcards-color-picker>
        </div>
      </lcards-form-section>
    `}_getAvailableImages(){var s,n,d,o;const a=(n=(s=window.lcards)==null?void 0:s.core)==null?void 0:n.assetManager;if(!a)return[];const e=f((u,m)=>{var c,p;return!!((p=(c=a.getMetadata)==null?void 0:c.call(a,u,m))!=null&&p.pack)},"isPackAsset"),t=(((d=a.listAssets)==null?void 0:d.call(a,"svg"))??[]).filter(u=>e("svg",u)),l=(((o=a.listImages)==null?void 0:o.call(a))??[]).filter(u=>e("image",u));return[...new Set([...t,...l])].sort().map(u=>({value:`builtin:${u}`,label:u}))}_handleImageSrcModeChange(a,e,t){if(this._imageSrcModes={...this._imageSrcModes,[a]:e},e==="asset"&&!(t!=null&&t.startsWith("builtin:"))){const l=this._getAvailableImages();l.length>0&&this._updateEffectConfig(a,"source",l[0].value)}}_renderImageBackgroundSection(a,e){var d;const t=a.source??a.url??"",l=this._imageSrcModes[e]??(t.startsWith("builtin:")?"asset":t.startsWith("media-source://")?"media":"custom"),r=this._getAvailableImages(),s=l==="custom"&&t.startsWith("http:")&&typeof location<"u"&&location.protocol==="https:",n=t.startsWith("media-source://")?{media_content_id:t,media_content_type:""}:void 0;return i`
      <lcards-form-section header="Image" icon="mdi:image" ?expanded=${true}>
        <div class="param-grid">
          <!-- Source mode selector (full width) -->
          <ha-selector
            .hass=${this.hass}
            .selector=${{select:{mode:"dropdown",options:[{value:"asset",label:"Asset Library (builtin images & SVGs)"},{value:"custom",label:"Custom URL / Template"},{value:"media",label:"Browse HA Media"}]}}}
            .value=${l}
            .label=${"Image Source"}
            @value-changed=${o=>this._handleImageSrcModeChange(e,o.detail.value,t)}
            style="grid-column: 1 / -1"
          ></ha-selector>

          ${l==="asset"?i`
            <!-- Asset picker -->
            <ha-selector
              .hass=${this.hass}
              .selector=${{select:{mode:"dropdown",custom_value:r.length>=10,options:r}}}
              .value=${r.some(o=>o.value===t)?t:((d=r[0])==null?void 0:d.value)??""}
              .label=${"Built-in Image"}
              .helper=${"Images and SVGs registered in the Asset Library"}
              @value-changed=${o=>this._updateEffectConfig(e,"source",o.detail.value)}
              style="grid-column: 1 / -1"
            ></ha-selector>
          `:l==="media"?i`
            <!-- HA media library picker -->
            <ha-selector
              .hass=${this.hass}
              .selector=${{media:{accept:["image/*"]}}}
              .value=${n}
              .label=${"HA Media"}
              .helper=${"Browse or upload an image via the Home Assistant media library"}
              @value-changed=${o=>{var u;return this._updateEffectConfig(e,"source",((u=o.detail.value)==null?void 0:u.media_content_id)??"")}}
              style="grid-column: 1 / -1"
            ></ha-selector>
          `:i`
            <!-- Custom URL / template input -->
            <ha-selector
              .hass=${this.hass}
              .selector=${{text:{}}}
              .value=${t}
              .label=${"Image URL"}
              .helper=${"Path to image: /local/images/room.jpg · https://… · or a template: {entity.attributes.entity_picture}"}
              @value-changed=${o=>this._updateEffectConfig(e,"source",o.detail.value)}
              style="grid-column: 1 / -1"
            ></ha-selector>
          `}

          ${s?i`
            <div style="grid-column:1/-1">
              <lcards-message type="warning" .message=${"http:// URLs will be blocked as mixed content when Home Assistant is served over HTTPS. Use an https:// URL or a /local/ path instead."}></lcards-message>
            </div>
          `:""}

          <!-- Size -->
          <ha-selector
            .hass=${this.hass}
            .selector=${{select:{mode:"dropdown",options:[{value:"cover",label:"Cover (fill, may crop)"},{value:"contain",label:"Contain (fit, may letterbox)"},{value:"fill",label:"Fill (stretch to canvas)"}]}}}
            .value=${a.size??"cover"}
            .label=${"Size"}
            .helper=${"How the image is scaled to fit the card background"}
            @value-changed=${o=>this._updateEffectConfig(e,"size",o.detail.value)}
          ></ha-selector>

          <!-- Position -->
          <ha-selector
            .hass=${this.hass}
            .selector=${{text:{}}}
            .value=${a.position??"center"}
            .label=${"Position"}
            .helper=${'CSS background-position value, e.g. "center", "top left", "50% 20%"'}
            @value-changed=${o=>this._updateEffectConfig(e,"position",o.detail.value)}
          ></ha-selector>

          <!-- Opacity -->
          ${this._renderField({key:"opacity",label:"Opacity",type:"number",min:0,max:1,step:.05,default:1},a,e)}

          <!-- Repeat/Tile -->
          ${this._renderField({key:"repeat",label:"Tile / Repeat",type:"boolean",default:false},a,e)}
        </div>
      </lcards-form-section>
    `}_renderTexturePresetSection(a,e,t){var s,n;const l=a==="plasma",r=["fluid","plasma","flow","scanlines"].includes(a);return i`
      <lcards-form-section header="Colour" icon="mdi:palette" ?expanded=${true}>
        ${l?i`
          <div style="margin-bottom:12px;">
            <div style="font-size:14px;font-weight:500;margin-bottom:8px;padding:2px 8px;">Colour A</div>
            <lcards-color-picker
              .hass=${this.hass}
              .value=${e.color_a??"rgba(80,0,255,0.9)"}
              .variablePrefixes=${["--lcards-","--lcars-","--cblcars-"]}
              ?showPreview=${true}
              @value-changed=${d=>this._updateEffectConfig(t,"color_a",d.detail.value)}
            ></lcards-color-picker>
          </div>
          <div style="margin-bottom:12px;">
            <div style="font-size:14px;font-weight:500;margin-bottom:8px;padding:2px 8px;">Colour B</div>
            <lcards-color-picker
              .hass=${this.hass}
              .value=${e.color_b??"rgba(255,40,120,0.9)"}
              .variablePrefixes=${["--lcards-","--lcars-","--cblcars-"]}
              ?showPreview=${true}
              @value-changed=${d=>this._updateEffectConfig(t,"color_b",d.detail.value)}
            ></lcards-color-picker>
          </div>
        `:i`
          <lcards-color-picker
            .hass=${this.hass}
            .value=${e.color??((n=(s=x[a])==null?void 0:s.defaults)==null?void 0:n.color)??"rgba(100,180,255,0.8)"}
            .variablePrefixes=${["--lcards-","--lcars-","--cblcars-"]}
            ?showPreview=${true}
            @value-changed=${d=>this._updateEffectConfig(t,"color",d.detail.value)}
          ></lcards-color-picker>
        `}
      </lcards-form-section>

      <lcards-form-section header="Parameters" icon="mdi:tune" ?expanded=${true}>
        <div class="param-grid">
          ${["fluid","plasma","flow"].includes(a)?this._renderField({key:"base_frequency",label:"Base Frequency",type:"number",min:.001,max:.1,step:.001,default:.01,helper:"Lower = larger features"},e,t):""}
          ${a==="fluid"?this._renderField({key:"num_octaves",label:"Noise Octaves",type:"number",min:1,max:8,step:1,default:4},e,t):""}
          ${a==="flow"?this._renderField({key:"wave_scale",label:"Wave Scale",type:"number",min:1,max:30,step:1,default:8},e,t):""}
          ${a==="shimmer"?i`
            ${this._renderField({key:"highlight_width",label:"Highlight Width (fraction)",type:"number",min:.05,max:.8,step:.05,default:.35},e,t)}
            ${this._renderField({key:"speed",label:"Sweep Speed",type:"number",min:.1,max:10,step:.1,default:2.5},e,t)}
            ${this._renderField({key:"angle",label:"Angle (degrees)",type:"number",min:-90,max:90,step:5,default:30},e,t)}
          `:""}
          ${a==="scanlines"?i`
            ${this._renderField({key:"line_spacing",label:"Line Spacing (px)",type:"number",min:1,max:20,step:1,default:4},e,t)}
            ${this._renderField({key:"line_width",label:"Line Width (px)",type:"number",min:.5,max:5,step:.5,default:1.5},e,t)}
            <ha-selector
              .hass=${this.hass}
              .selector=${{select:{mode:"dropdown",options:[{value:"horizontal",label:"Horizontal"},{value:"vertical",label:"Vertical"}]}}}
              .value=${e.direction??"horizontal"}
              .label=${"Direction"}
              @value-changed=${d=>this._updateEffectConfig(t,"direction",d.detail.value)}
            ></ha-selector>
          `:""}
          ${this._renderField({key:"opacity",label:"Opacity",type:"number",min:0,max:1,step:.05,default:1},e,t)}
        </div>
      </lcards-form-section>

      ${r?i`
        <lcards-form-section header="Scrolling" icon="mdi:arrow-all" ?expanded=${false}>
          <div class="param-grid">
            ${this._renderField({key:"scroll_speed_x",label:"Scroll Speed X (px/s)",type:"number",min:-200,max:200,step:5,default:0},e,t)}
            ${this._renderField({key:"scroll_speed_y",label:"Scroll Speed Y (px/s)",type:"number",min:-200,max:200,step:5,default:0},e,t)}
          </div>
        </lcards-form-section>
      `:""}
    `}_renderSolidSection(a,e){return i`
      <lcards-form-section header="Colour" icon="mdi:palette" ?expanded=${true}>
        <lcards-color-picker
          .hass=${this.hass}
          .value=${a.color??"rgba(0, 0, 0, 0.4)"}
          .variablePrefixes=${["--lcards-","--lcars-","--cblcars-"]}
          ?showPreview=${true}
          @value-changed=${t=>this._updateEffectConfig(e,"color",t.detail.value)}
        ></lcards-color-picker>
      </lcards-form-section>

      <lcards-form-section header="Parameters" icon="mdi:tune" ?expanded=${true}>
        <div class="param-grid">
          ${this._renderField({key:"opacity",label:"Opacity",type:"number",min:0,max:1,step:.05,default:1},a,e)}
        </div>
      </lcards-form-section>
    `}_renderField(a,e,t){const l=e[a.key]??a.default;return a.type==="color"?i`
        <lcards-color-picker
          .hass=${this.hass}
          .value=${l}
          .variablePrefixes=${["--lcards-","--lcars-","--cblcars-"]}
          ?showPreview=${true}
          @value-changed=${r=>this._updateEffectConfig(t,a.key,r.detail.value)}
        ></lcards-color-picker>
      `:i`
      <ha-selector
        .hass=${this.hass}
        .selector=${this._getFieldSelector(a)}
        .value=${l}
        .label=${a.label}
        .helper=${a.helper}
        @value-changed=${r=>this._updateEffectConfig(t,a.key,r.detail.value)}
      ></ha-selector>
    `}_renderEntityBindingNote(){return i`
      <p class="info-guide-tip"><strong>Follow an entity:</strong> any parameter can track an entity (speed to brightness,
        say), in this card's YAML. <code>map_range</code> is the usual way; a template is the advanced one.</p>
      <pre class="info-guide-example">scroll_speed_x: { map_range: { attribute: brightness, input: [0, 255], output: [-200, 200] } }
fill_pct: "[[[return entity.attributes.brightness / 2.55]]]"</pre>
    `}_renderZoomSection(a,e){const t=a.zoom||{},l=t&&Object.keys(t).length>0;return i`
      <div class="zoom-section">
        <div class="zoom-header">
          <div class="zoom-title">
            <ha-icon icon="mdi:magnify-expand"></ha-icon>
            <span>Zoom Effect (3D Depth)</span>
          </div>
          <ha-switch
            .checked=${l}
            @change=${r=>this._toggleZoom(e,r.target.checked)}
          ></ha-switch>
        </div>

        ${l?i`
          <div class="param-grid">
            <ha-selector
              .hass=${this.hass}
              .selector=${{number:{min:2,max:10,step:1,mode:"slider"}}}
              .value=${t.layers??4}
              .label=${"Zoom Layers"}
              .helper=${"Number of scaled instances (more = smoother but slower)"}
              @value-changed=${r=>this._updateZoomConfig(e,"layers",r.detail.value)}
            ></ha-selector>

            <ha-selector
              .hass=${this.hass}
              .selector=${{number:{min:.1,max:1,step:.1,mode:"slider"}}}
              .value=${t.scale_from??.5}
              .label=${"Scale From"}
              .helper=${"Starting scale (0.5 = half size)"}
              @value-changed=${r=>this._updateZoomConfig(e,"scale_from",r.detail.value)}
            ></ha-selector>

            <ha-selector
              .hass=${this.hass}
              .selector=${{number:{min:1,max:5,step:.1,mode:"slider"}}}
              .value=${t.scale_to??2}
              .label=${"Scale To"}
              .helper=${"Ending scale (2.0 = double size)"}
              @value-changed=${r=>this._updateZoomConfig(e,"scale_to",r.detail.value)}
            ></ha-selector>

            <ha-selector
              .hass=${this.hass}
              .selector=${{number:{min:5,max:60,step:1,mode:"slider"}}}
              .value=${t.duration??15}
              .label=${"Duration (seconds)"}
              .helper=${"Full zoom cycle duration"}
              @value-changed=${r=>this._updateZoomConfig(e,"duration",r.detail.value)}
            ></ha-selector>

            <ha-selector
              .hass=${this.hass}
              .selector=${{number:{min:0,max:100,step:5,mode:"slider"}}}
              .value=${t.opacity_fade_in??15}
              .label=${"Fade In (%)"}
              .helper=${"Opacity fade-in threshold"}
              @value-changed=${r=>this._updateZoomConfig(e,"opacity_fade_in",r.detail.value)}
            ></ha-selector>

            <ha-selector
              .hass=${this.hass}
              .selector=${{number:{min:0,max:100,step:5,mode:"slider"}}}
              .value=${t.opacity_fade_out??75}
              .label=${"Fade Out (%)"}
              .helper=${"Opacity fade-out threshold"}
              @value-changed=${r=>this._updateZoomConfig(e,"opacity_fade_out",r.detail.value)}
            ></ha-selector>
          </div>
        `:""}
      </div>
    `}_getPresetOptions(){return Object.entries(h).map(([a,e])=>({value:a,label:`${e.name} - ${e.description}`}))}_getPresetHelp(a){const e=h[a];return(e==null?void 0:e.description)||""}_getPresetIcon(a){return{grid:"mdi:grid","grid-diagonal":"mdi:grid-large","grid-hexagonal":"mdi:hexagon-multiple",starfield:"mdi:star-circle",nebula:"mdi:cloud","contour-field":"mdi:elevation-rise",cascade:"mdi:format-columns",level:"mdi:water",fluid:"mdi:water-wave",plasma:"mdi:fire",flow:"mdi:wave",shimmer:"mdi:shimmer",scanlines:"mdi:television-scan",image:"mdi:image",solid:"mdi:square-rounded"}[a]||"mdi:blur"}_getPresetFields(a,e){const t={scrolling:[{key:"scroll_speed_x",label:"Scroll Speed X (px/s)",type:"number",min:-200,max:200,step:5,default:20},{key:"scroll_speed_y",label:"Scroll Speed Y (px/s)",type:"number",min:-200,max:200,step:5,default:20}],styling:[{key:"color",label:"Colour",type:"color",default:"rgba(255, 153, 102, 0.3)",fullWidth:true},{key:"show_border_lines",label:"Show Border Lines",type:"boolean",default:true}]};switch(a){case"grid":return[{key:"line_spacing",label:"Line Spacing (px)",type:"number",min:10,max:200,step:5,default:40},{key:"line_width",label:"Line Width",type:"number",min:.5,max:10,step:.5,default:1},{key:"major_row_interval",label:"Major Row Interval (0=off)",type:"number",min:0,max:20,step:1,default:0},{key:"major_col_interval",label:"Major Col Interval (0=off)",type:"number",min:0,max:20,step:1,default:0},{key:"line_width_major",label:"Major Line Width",type:"number",min:.5,max:10,step:.5,default:2},{key:"color_major",label:"Major Line Colour",type:"color",default:"",fullWidth:true,helper:"Leave empty to use same as colour"},{key:"fill_color",label:"Fill Colour",type:"color",default:"",fullWidth:true,helper:"Cell background fill (leave empty for transparent)"},{key:"pattern",label:"Pattern",type:"select",options:["both","horizontal","vertical"],default:"both"},...t.scrolling,...t.styling];case"grid-diagonal":return[{key:"line_spacing",label:"Line Spacing (px)",type:"number",min:10,max:200,step:5,default:60},{key:"line_width",label:"Line Width",type:"number",min:.5,max:10,step:.5,default:1},{key:"fill_color",label:"Fill Colour",type:"color",default:"",fullWidth:true,helper:"Cell background fill (leave empty for transparent)"},...t.scrolling,...t.styling];case"grid-hexagonal":return[{key:"hex_radius",label:"Hex Radius (px)",type:"number",min:10,max:100,step:5,default:30},{key:"line_width_minor",label:"Minor Line Width",type:"number",min:.5,max:10,step:.5,default:1},{key:"line_width_major",label:"Major Line Width",type:"number",min:.5,max:10,step:.5,default:2},{key:"major_row_interval",label:"Major Row Interval (0=off)",type:"number",min:0,max:10,step:1,default:0},{key:"major_col_interval",label:"Major Col Interval (0=off)",type:"number",min:0,max:10,step:1,default:0},{key:"color_major",label:"Major Hex Colour",type:"color",default:"",fullWidth:true,helper:"Leave empty to use same as colour"},{key:"fill_color",label:"Fill Colour",type:"color",default:"",fullWidth:true,helper:"Cell background fill (leave empty for transparent)"},...t.scrolling,...t.styling];case"starfield":return[{key:"seed",label:"Random Seed",type:"number",min:1,max:1e9,step:1,default:Math.floor(Math.random()*1e9),helper:"Change for different star patterns"},{key:"count",label:"Star Count",type:"number",min:50,max:500,step:10,default:150},{key:"min_radius",label:"Min Star Radius (px)",type:"number",min:.1,max:5,step:.1,default:.5},{key:"max_radius",label:"Max Star Radius (px)",type:"number",min:.5,max:10,step:.5,default:2},{key:"min_opacity",label:"Min Star Opacity",type:"number",min:0,max:1,step:.1,default:.3},{key:"max_opacity",label:"Max Star Opacity",type:"number",min:0,max:1,step:.1,default:1},{key:"color",label:"Star Colour",type:"color",default:"#ffffff",fullWidth:true},{key:"parallax_layers",label:"Parallax Layers",type:"number",min:1,max:5,step:1,default:3,helper:"More layers = more depth"},{key:"depth_factor",label:"Depth Factor",type:"number",min:0,max:1,step:.1,default:.5,helper:"Speed variation between layers"},...t.scrolling];case"nebula":return[{key:"seed",label:"Random Seed",type:"number",min:1,max:1e9,step:1,default:Math.floor(Math.random()*1e9),helper:"Change for different cloud patterns"},{key:"cloud_count",label:"Cloud Count",type:"number",min:1,max:10,step:1,default:4},{key:"min_radius",label:"Min Cloud Radius",type:"number",min:.05,max:.5,step:.05,default:.15,helper:"Fraction of canvas size (0-1)"},{key:"max_radius",label:"Max Cloud Radius",type:"number",min:.1,max:1,step:.05,default:.4,helper:"Fraction of canvas size (0-1)"},{key:"min_opacity",label:"Min Cloud Opacity",type:"number",min:0,max:1,step:.1,default:.3},{key:"max_opacity",label:"Max Cloud Opacity",type:"number",min:0,max:1,step:.1,default:.8},{key:"color",label:"Cloud Colour",type:"color",default:"#FF00FF",fullWidth:true},{key:"turbulence",label:"Turbulence Intensity",type:"number",min:0,max:1,step:.1,default:.5,helper:"How much clouds distort (0=none, 1=max)"},{key:"noise_scale",label:"Noise Scale",type:"number",min:.001,max:.01,step:.001,default:.003,helper:"Smaller = larger noise features"},...t.scrolling];case"cascade":return[{key:"num_rows",label:"Rows",type:"number",min:1,max:50,step:1,default:null},{key:"num_cols",label:"Columns",type:"number",min:1,max:100,step:1,default:null},{key:"format",label:"Format",type:"select",options:["hex","digit","float","alpha","mixed"],default:"hex"},{key:"pattern",label:"Pattern",type:"select",options:["default","niagara","fast","custom"],default:"default"},{key:"speed_multiplier",label:"Speed Multiplier",type:"number",min:.1,max:10,step:.1,default:1}];default:return t.styling}}_getFieldSelector(a){switch(a.type){case"number":return{number:{min:a.min,max:a.max,step:a.step,mode:"slider"}};case"color":return{text:{}};case"boolean":return{boolean:{}};case"select":return{select:{mode:"dropdown",options:a.options.map(e=>({value:e,label:e}))}};default:return{text:{}}}}_getEffectDetails(a){const e=a.config||{},t=a.preset||"grid",l=[];if(e.line_spacing&&l.push(`spacing: ${e.line_spacing}px`),e.hex_radius&&l.push(`radius: ${e.hex_radius}px`),e.color&&l.push(`color: ${e.color}`),a.zoom&&l.push(`zoom: ${a.zoom.layers||4} layers`),t==="cascade"&&(e.format&&l.push(`format: ${e.format}`),e.pattern&&l.push(`pattern: ${e.pattern}`)),t==="contour-field"&&(e.num_bands!==void 0&&l.push(`bands: ${e.num_bands}`),e.cell_size!==void 0&&l.push(`cell: ${e.cell_size}px`),e.fill_level!==void 0&&l.push(`fill: ${e.fill_level}`),e.blend_colors===false&&l.push("solid bands")),t==="level"&&(e.fill_pct!==void 0&&l.push(`fill: ${e.fill_pct}%`),e.direction&&l.push(`dir: ${e.direction}`),e.edge_glow===false&&l.push("glow: off")),["fluid","plasma","flow","shimmer","scanlines"].includes(t)&&e.opacity!==void 0&&e.opacity!==1&&l.push(`opacity: ${e.opacity}`),t==="image"){const r=e.source??e.url??"";r.startsWith("builtin:")?l.push(r.slice(8)):r?l.push(r.split("/").pop()||r):l.push("no source")}return l.join(" • ")||"No configuration"}_toggleExpanded(a){this._expandedEffects={...this._expandedEffects,[a]:!this._expandedEffects[a]}}_addEffect(){const a={preset:"grid",config:{}},{effects:e,inset:t}=this._normalizedConfig,l=[...e,a];this._expandedEffects={...this._expandedEffects,[l.length-1]:true},this._emitChange(l,t)}_duplicateEffect(a,e){a.stopPropagation();const{effects:t,inset:l}=this._normalizedConfig,r=JSON.parse(JSON.stringify(t[e])),s=[...t];s.splice(e+1,0,r),this._expandedEffects={...this._expandedEffects,[e+1]:true},this._emitChange(s,l)}_deleteEffect(a,e){a.stopPropagation();const{effects:t,inset:l}=this._normalizedConfig,r=t.filter((d,o)=>o!==e),s={};Object.keys(this._expandedEffects).forEach(d=>{const o=parseInt(d);o<e?s[o]=this._expandedEffects[o]:o>e&&(s[o-1]=this._expandedEffects[o])}),this._expandedEffects=s;const n={};Object.keys(this._imageSrcModes).forEach(d=>{const o=parseInt(d);o<e?n[o]=this._imageSrcModes[o]:o>e&&(n[o-1]=this._imageSrcModes[o])}),this._imageSrcModes=n,this._emitChange(r,l)}_updateEffect(a,e,t){const{effects:l,inset:r}=this._normalizedConfig,s=[...l];s[a]={...s[a],[e]:t},e==="preset"&&(s[a].config=this._getDefaultConfig(t)),this._emitChange(s,r)}_updateEffectConfig(a,e,t){const{effects:l,inset:r}=this._normalizedConfig,s=[...l];s[a]={...s[a],config:{...s[a].config,[e]:t}},this._emitChange(s,r)}_toggleZoom(a,e){const{effects:t,inset:l}=this._normalizedConfig,r=[...t];e?r[a].zoom={layers:4,scale_from:.5,scale_to:2,duration:15,opacity_fade_in:15,opacity_fade_out:75}:delete r[a].zoom,this._emitChange(r,l)}_updateZoomConfig(a,e,t){const{effects:l,inset:r}=this._normalizedConfig,s=[...l];s[a]={...s[a],zoom:{...s[a].zoom,[e]:t}},this._emitChange(s,r)}_getDefaultConfig(a){switch(a){case"grid":case"grid-diagonal":case"grid-hexagonal":return{};case"starfield":return{seed:Math.floor(Math.random()*1e9)};case"nebula":return{seed:Math.floor(Math.random()*1e9)};case"scanlines":return{color:"rgba(255,255,255,0.15)"};case"cascade":return{format:"mixed",pattern:"default",font_size:24,gap:12};case"contour-field":return{seed:Math.floor(Math.random()*1e9),noise_scale:.005,num_octaves:2,num_bands:5,cell_size:1,blend_colors:true,fill_level:.45,fill_color:"alpha(var(--lcars-midnight-blue), 0.30)",colors:["alpha(#130b81, 0.08)","alpha(#130b81, 0.25)","alpha(#130b81, 0.42)","alpha(#130b81, 0.62)","alpha(#130b81, 0.80)"],scroll_speed_x:-3,scroll_speed_y:.45};default:return{}}}_handleDragStart(a,e){this._draggedIndex=e,a.dataTransfer&&(a.dataTransfer.effectAllowed="move"),a.dataTransfer.setData("text/html",a.target.innerHTML)}_handleDragEnd(a){var e;this._draggedIndex=null,(e=this.shadowRoot)==null||e.querySelectorAll(".effect-item").forEach(t=>{t.classList.remove("drag-over")})}_handleDragOver(a,e){var l,r;a.preventDefault(),a.dataTransfer&&(a.dataTransfer.dropEffect="move");const t=((l=this.shadowRoot)==null?void 0:l.querySelectorAll(".effect-item"))??[];t.forEach(s=>s.classList.remove("drag-over")),(r=t[e])==null||r.classList.add("drag-over")}_handleDrop(a,e){var u;a.preventDefault(),a.stopPropagation();const t=this._draggedIndex;if(t===null||t===e)return;const{effects:l,inset:r}=this._normalizedConfig,s=[...l],[n]=s.splice(t,1);s.splice(e,0,n);const d={};Object.keys(this._expandedEffects).forEach(m=>{const c=parseInt(m);let p=c;c===t?p=e:t<e&&c>t&&c<=e?p=c-1:t>e&&c>=e&&c<t&&(p=c+1),d[p]=this._expandedEffects[m]}),this._expandedEffects=d;const o={};Object.keys(this._imageSrcModes).forEach(m=>{const c=parseInt(m);let p=c;c===t?p=e:t<e&&c>t&&c<=e?p=c-1:t>e&&c>=e&&c<t&&(p=c+1),o[p]=this._imageSrcModes[m]}),this._imageSrcModes=o,this._draggedIndex=null,(u=this.shadowRoot)==null||u.querySelectorAll(".effect-item").forEach(m=>{m.classList.remove("drag-over")}),this._emitChange(s,r)}_emitChange(a,e,t){const l=t!==void 0?t:this._normalizedConfig.fps,r=e!=null,s=l!=null,n=r||s?{...s&&{fps:l},...r&&{inset:e},effects:a}:a;k.debug("[BackgroundAnimationEditor] Effects changed",n),this.dispatchEvent(new CustomEvent("effects-changed",{detail:{value:n},bubbles:true,composed:true}))}};f(b,"LCARdSBackgroundAnimationEditor");let g=b;customElements.get("lcards-background-animation-editor")||customElements.define("lcards-background-animation-editor",g);
//# sourceMappingURL=lcards-background-animation-editor-BRRbXPdx.js.map
