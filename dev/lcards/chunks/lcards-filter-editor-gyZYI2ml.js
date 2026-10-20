var U=Object.defineProperty;var C=(F,e)=>U(F,"name",{value:e,configurable:true});import{k as A,D as P,i as L,M as E,a as G,b as l,l as $,_ as W}from"./lcards-main-C10Twmlb.js";import"./lcards-form-section-DSoN9OMH.js";import{L as B,g as Y}from"./studio-dialog-styles-C5BrIaK5.js";import{i as V,s as z,r as H}from"./lcards-message-BMG6miXA.js";const Q=A(P.animationPresets),K=A(P.filterTypes),oe=A(P.backgroundPresets),ne=A(P.msdRoutingConcepts),J=new Set(["glitch","motionpath","sequence","chaos","physics-spring","pulse","fade","glow","draw","march","blink","shimmer","strobe","flicker","cascade","cascade-color","ripple","scale","scale-reset","set","slide","shake","color-shift","text-reveal","text-typewriter","text-scramble","text-glitch","stagger-grid","stagger-flash","stagger-wave","stagger-radial","timeline-cascade","timeline-attention"]),j={set:{hideDuration:true,hideEasing:true,hideLoop:true,hideAlternate:true},"scale-reset":{hideLoop:true,hideAlternate:true},glitch:{hideEasing:true},"text-typewriter":{hideDuration:true,hideEasing:true},"text-scramble":{hideEasing:true,hideAlternate:true},"text-glitch":{hideEasing:true},"physics-spring":{hideDuration:true,hideEasing:true,hideAlternate:true},march:{hideEasing:true,hideAlternate:true,hideStartDelay:true},"stagger-flash":{hideDuration:true,hideEasing:true,hideLoop:true,hideAlternate:true,hideStartDelay:true},sequence:{hideDuration:true,hideEasing:true},"timeline-cascade":{hideDuration:true,hideEasing:true},"timeline-attention":{hideDuration:true,hideEasing:true}},X={duration:"hideDuration",ease:"hideEasing",loop:"hideLoop",alternate:"hideAlternate",delay:"hideStartDelay"};function y(F,e,t){const a=X[e];return!!(j[F]||{})[a]&&t!==W[e]}C(y,"needsOwnCanonicalField");const f="https://animejs.com/documentation",Z={draw:`${f}/svg/createdrawable`,motionpath:`${f}/svg/createmotionpath`,"physics-spring":`${f}/easings/spring`,cascade:`${f}/utilities/stagger`,"stagger-grid":`${f}/utilities/stagger`,"stagger-wave":`${f}/utilities/stagger`,"stagger-radial":`${f}/utilities/stagger`,sequence:`${f}/timeline`,"timeline-cascade":`${f}/timeline`,"timeline-attention":`${f}/timeline`,"text-reveal":`${f}/text/splittext`,"text-scramble":`${f}/text/splittext`,"text-glitch":`${f}/text/splittext`,"text-typewriter":`${f}/text/splittext`},ee=`${f}/animation`,T=["above","at_least","below","at_most"],I={between:{loKey:"at_least",hiKey:"at_most"},between_exclusive:{loKey:"above",hiKey:"below"}},M=class M2 extends L{static get properties(){return{hass:{type:Object},animations:{type:Array,noAccessor:true},cardElement:{type:Object},searchRootSelector:{type:String},systemAnimationIds:{type:Array},_workingAnimations:{state:true},_expandedIndex:{type:Number},_pendingDeleteIndex:{type:Number}}}get animations(){return this._workingAnimations||[]}set animations(e){const t=e||[],a=this._workingAnimations||[],s=t.map(i=>i.id).filter(Boolean).sort().join(","),r=a.map(i=>i.id).filter(Boolean).sort().join(",");(!a.length||s!==r)&&(this._workingAnimations=JSON.parse(JSON.stringify(t)).map(i=>this._normalizeAnimation(i)))}_normalizeAnimation(e){var d;const t=["loop","alternate","duration","delay","ease"];if(!e.params)return e;const a=E[e.preset],s={},r={},i=[];for(const[n,c]of Object.entries(e.params)){const g=t.includes(n)&&y(e.preset,n,(d=a==null?void 0:a.properties)==null?void 0:d[n]);t.includes(n)&&!g?e[n]===void 0&&(s[n]=c):(r[n]=c,g&&e[n]!==void 0&&i.push(n))}const o={...e,...s,params:r};for(const n of i)delete o[n];return Object.keys(o.params).length===0&&delete o.params,o}static get styles(){return[G`
      :host {
        display: block;
        width: 100%;
      }

      .animations-container {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .animation-item {
        background: var(--card-background-color);
        border: var(--ha-border-width-sm) solid var(--divider-color);
        border-radius: var(--ha-card-border-radius, 12px);
        overflow: hidden;
      }

      .animation-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        cursor: pointer;
        user-select: none;
        background: var(--secondary-background-color);
      }

      .animation-header:hover {
        background: var(--primary-background-color);
      }

      .animation-icon {
        color: var(--primary-color);
        --mdc-icon-size: 24px;
      }

      .animation-info {
        flex: 1;
        min-width: 0;
      }

      .animation-id-row {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 4px;
      }

      .animation-id {
        font-weight: 600;
        font-size: 18px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .animation-unnamed {
        font-weight: 500;
        font-size: 13px;
        color: var(--warning-color, #ff9800);
        font-style: italic;
      }

      .animation-chips {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-wrap: wrap;
      }

      .animation-actions {
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

      .animation-content {
        padding: 20px;
        background: var(--card-background-color, #fff);
      }

      .section {
        margin-bottom: 24px;
      }

      .section:last-child {
        margin-bottom: 0;
      }

      .section-header {
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

      .form-row {
        margin-bottom: 16px;
      }

      .form-row:last-child {
        margin-bottom: 0;
      }

      .param-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
        margin-top: 12px;
      }

      /* Constrain slider widths */
      ha-selector {
        max-width: 100%;
        width: 100%;
      }

      .param-full {
        grid-column: 1 / -1;
      }

      .add-button {
        width: 100%;
        margin-top: 8px;
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

      ha-icon-button {
        --ha-icon-button-size: 36px;
        --mdc-icon-size: 20px;
      }

      .toggle-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px;
        background: var(--secondary-background-color, #fafafa);
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

      .field-label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        font-size: 14px;
        color: var(--primary-text-color);
      }

      .warning-banner {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px 16px;
        background: var(--warning-color, #ff9800);
        color: #fff;
        border-radius: 6px;
        margin-bottom: 16px;
        font-size: 13px;
        line-height: 1.4;
      }

      .warning-banner ha-icon {
        flex-shrink: 0;
        margin-top: 2px;
      }

      /* Target Selection Styles */
      .mode-selector {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
        padding: 8px 0;
      }

      .target-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .target-item {
        display: flex;
        align-items: flex-start;
        gap: 8px;
      }

      .target-item ha-selector {
        flex: 1;
      }

      .target-item ha-icon-button {
        margin-top: 8px;
        --ha-icon-button-size: 36px;
        --mdc-icon-size: 20px;
      }


      .animation-item.is-disabled .animation-icon {
        opacity: 0.35;
      }

      .animation-item.is-disabled .animation-type {
        opacity: 0.5;
      }

      .danger-zone {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding-top: 20px;
        border-top: var(--ha-border-width-sm) solid var(--divider-color);
        margin-top: 8px;
      }

      .confirm-delete-row {
        display: flex;
        align-items: center;
        gap: 8px;
        justify-content: flex-end;
        padding-top: 20px;
        border-top: var(--ha-border-width-sm) solid var(--error-color, #f44336);
        margin-top: 8px;
      }

      .confirm-delete-label {
        flex: 1;
        font-size: 13px;
        color: var(--error-color, #f44336);
        font-weight: 500;
      }

      @media (max-width: 600px) {
        .animation-header {
          padding: 12px;
        }

        .animation-content {
          padding: 16px;
        }
      }
    `,V,z]}constructor(){super(),this.searchRootSelector,this.hass=void 0,this.cardElement=null,this._workingAnimations=[],this.systemAnimationIds=[],this._expandedIndex=null,this._pendingDeleteIndex=null,this._targetRediscoveryTimer=null,this._targetRediscoveryAttempts=0}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this._targetRediscoveryTimer)}render(){return l`
      <div class="animations-container">
        <ha-button @click=${this._addAnimation} class="add-button">
          <ha-icon icon="mdi:plus" slot="start"></ha-icon>
          Add Animation
        </ha-button>
        ${this.animations.length===0?this._renderEmptyState():""}
        ${this.animations.map((e,t)=>this._renderAnimationItem(e,t))}
      </div>
    `}_renderEmptyState(){return l`
      <div class="empty-state">
        <ha-icon icon="mdi:animation-outline"></ha-icon>
        <div class="empty-state-title">No animations configured</div>
        <div class="empty-state-subtitle">Add an animation to bring your card to life</div>
      </div>
    `}_renderAnimationItem(e,t){var c;const a=this._expandedIndex===t,s=e.trigger||"on_load",r=e.type==="custom",i=e.preset||"pulse",o=e.enabled!==false,d=!!(e.id&&((c=this.systemAnimationIds)!=null&&c.includes(e.id))),n=!!e.id;return l`
      <div class="animation-item ${o?"":"is-disabled"} ${d?"is-system":""}">
        <div class="animation-header" @click=${()=>this._toggleExpanded(t)}>
          <ha-icon
            class="animation-icon"
            icon=${r?"mdi:code-braces":"mdi:animation"}>
          </ha-icon>

          <div class="animation-info">
            <div class="animation-id-row">
              ${n?l`<span class="animation-id">${e.id}</span>`:l`<span class="animation-unnamed">Unnamed animation</span>`}
            </div>
            <div class="animation-chips">
              <ha-assist-chip
                .filled=${true}
                style="--ha-assist-chip-filled-container-color: color-mix(in srgb, var(--primary-color) 80%, transparent); --md-sys-color-on-surface: var(--primary-text-color);"
                .label=${r?"custom":this._formatPresetName(i)}>
              </ha-assist-chip>
              <ha-assist-chip
                .filled=${true}
                style="--ha-assist-chip-filled-container-color: color-mix(in srgb, var(--primary-color) 80%, transparent); --md-sys-color-on-surface: var(--primary-text-color);"
                .label=${this._formatTrigger(s)}>
              </ha-assist-chip>
              ${d?l`<ha-assist-chip
                .filled=${true}
                style="--ha-assist-chip-filled-container-color: color-mix(in srgb, var(--info-color, #039be5) 80%, transparent); --md-sys-color-on-surface: var(--primary-text-color);"
                label="component">
                <ha-icon slot="icon" icon="mdi:puzzle-outline"></ha-icon>
              </ha-assist-chip>`:""}
              ${o?"":l`<ha-assist-chip
                .filled=${true}
                style="--ha-assist-chip-filled-container-color: color-mix(in srgb, var(--primary-background-color, #000000) 80%, transparent); --md-sys-color-on-surface: var(--primary-text-color);"
                label="disabled"></ha-assist-chip>`}
            </div>
          </div>

          <div class="animation-actions">
            ${d?"":l`
              <ha-icon-button
                @click=${g=>this._duplicateAnimation(g,t)}
                .label=${"Duplicate"}
                .path=${"M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"}>
              </ha-icon-button>
            `}
            <ha-icon-button
              @click=${g=>this._toggleEnabled(g,t)}
              .label=${o?"Disable animation":"Enable animation"}
              .path=${o?"M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9M12,4.5C17,4.5 21.27,7.61 23,12C21.27,16.39 17,19.5 12,19.5C7,19.5 2.73,16.39 1,12C2.73,7.61 7,4.5 12,4.5M3.18,12C4.83,15.36 8.24,17.5 12,17.5C15.76,17.5 19.17,15.36 20.82,12C19.17,8.64 15.76,6.5 12,6.5C8.24,6.5 4.83,8.64 3.18,12Z":"M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10.02 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.08L19.73,22L21,20.73L3.27,3M12,4.5C17,4.5 21.27,7.61 23,12C22.32,13.76 21.3,15.32 20.05,16.62L18.63,15.19C19.57,14.26 20.35,13.18 20.88,12C19.23,8.64 15.82,6.5 12,6.5C10.92,6.5 9.87,6.7 8.9,7.05L7.42,5.58C8.83,4.88 10.37,4.5 12,4.5Z"}>
            </ha-icon-button>
          </div>

          <ha-icon
            class="expand-icon ${a?"expanded":""}"
            icon="mdi:chevron-down">
          </ha-icon>
        </div>

        ${a?l`
          <div class="animation-content">
            ${this._renderAnimationForm(e,t)}
          </div>
        `:""}
      </div>
    `}_renderAnimationForm(e,t){var d;const a=e.type==="custom",s=e.preset||"pulse",r=this._isPlaceholderPreset(s),i=e.enabled!==false,o=!!(e.id&&((d=this.systemAnimationIds)!=null&&d.includes(e.id)));return l`
      <!-- ID field for user-defined animations -->
      ${o?"":l`
        ${(()=>{const n=e.id?this._validateAnimationId(e.id,t):null;return l`
            <ha-selector
              .hass=${this.hass}
              .selector=${{text:{}}}
              .value=${e.id||""}
              .label=${"Animation ID"}
              .helper=${"Letters, numbers, hyphens and underscores only, e.g. my-pulse"}
              @value-changed=${c=>this._handleIdChange(t,c.detail.value)}>
            </ha-selector>
            ${n?l`
              <lcards-message type="error">
                <p style="margin:0;font-size:13px;line-height:1.4;">${n}</p>
              </lcards-message>
            `:e.id?"":l`
              <lcards-message type="warning">
                <p style="margin:0;font-size:13px;line-height:1.4;">
                  Give this animation an <strong>ID</strong> so you can identify it in the list and reference it in YAML rules.
                </p>
              </lcards-message>
            `}
          `})()}
      `}

      <!-- Enabled Toggle -->
      <div class="toggle-row">
        <span class="toggle-label">
          <ha-icon icon=${i?"mdi:play-circle-outline":"mdi:pause-circle-outline"}></ha-icon>
          Animation Enabled
        </span>
        <ha-selector
          .hass=${this.hass}
          .selector=${{boolean:{}}}
          .value=${i}
          @value-changed=${n=>this._setEnabled(t,n.detail.value)}>
        </ha-selector>
      </div>

      <!-- Trigger Section -->
      <lcards-form-section
        header="Trigger"
        icon="mdi:lightning-bolt"
        ?expanded=${true}>
        <ha-selector
          .hass=${this.hass}
          .selector=${{select:{mode:"dropdown",options:[{value:"on_load",label:"On Load"},{value:"on_show",label:"On Show (Each Time It Appears)"},{value:"on_hover",label:"On Hover"},{value:"on_leave",label:"On Leave (Exit Hover)"},{value:"on_tap",label:"On Tap"},{value:"on_double_tap",label:"On Double Tap"},{value:"on_hold",label:"On Hold"},{value:"on_datasource_change",label:"On Data Change"},{value:"on_entity_change",label:"On Entity Change"}]}}}
          .value=${e.trigger||"on_load"}
          .label=${"When to trigger animation"}
          .helper=${this._getTriggerHelp(e.trigger||"on_load")}
          @value-changed=${n=>this._updateAnimation(t,"trigger",n.detail.value)}
        ></ha-selector>

        ${e.trigger==="on_entity_change"?this._renderEntityChangeTriggerConfig(e,t):""}
      </lcards-form-section>

      <!-- Target Selection Section -->
      ${o?"":this._renderTargetSelector(e,t)}

      <!-- Custom Toggle -->
      <ha-selector
        .hass=${this.hass}
        .selector=${{boolean:{}}}
        .value=${a}
        .label=${"Use Custom anime.js Code"}
        .helper=${"Switch to custom anime.js v4 configuration instead of preset"}
        @value-changed=${n=>this._toggleCustomMode(t,n.detail.value)}
      ></ha-selector>

      ${a?this._renderCustomForm(e,t):l`
        ${r?this._renderPlaceholderWarning(s):""}
        ${this._renderPresetForm(e,t,o)}
      `}

      ${o?"":this._renderDeleteSection(t)}
    `}_renderDeleteSection(e){return this._pendingDeleteIndex===e?l`
        <div class="confirm-delete-row">
          <span class="confirm-delete-label">Delete this animation permanently?</span>
          <ha-button @click=${()=>{this._pendingDeleteIndex=null,this.requestUpdate()}}>
            Cancel
          </ha-button>
          <ha-button
            variant="danger"
            @click=${()=>this._confirmDelete(e)}>
            <ha-icon icon="mdi:trash-can" slot="start"></ha-icon>
            Delete
          </ha-button>
        </div>
      `:l`
      <div class="danger-zone">
        <ha-button
          variant="danger"
          @click=${()=>{this._pendingDeleteIndex=e,this.requestUpdate()}}>
          <ha-icon icon="mdi:trash-can-outline" slot="start"></ha-icon>
          Delete Animation
        </ha-button>
      </div>
    `}_renderPresetForm(e,t,a=false){var o,d,n,c,g;const s=e.preset||"pulse",r=E[s],i={...e.params,...e.duration!==void 0&&!y(s,"duration",(o=r==null?void 0:r.properties)==null?void 0:o.duration)&&{duration:e.duration},...e.delay!==void 0&&!y(s,"delay",(d=r==null?void 0:r.properties)==null?void 0:d.delay)&&{delay:e.delay},...e.loop!==void 0&&!y(s,"loop",(n=r==null?void 0:r.properties)==null?void 0:n.loop)&&{loop:e.loop},...e.alternate!==void 0&&!y(s,"alternate",(c=r==null?void 0:r.properties)==null?void 0:c.alternate)&&{alternate:e.alternate},...e.ease!==void 0&&!y(s,"ease",(g=r==null?void 0:r.properties)==null?void 0:g.ease)&&{ease:e.ease}};return l`
      <!-- Preset Selection Section -->
      <lcards-form-section
        header="Animation Preset"
        icon="mdi:animation"
        ?expanded=${!a}>
        ${a?l`
          <lcards-message type="info" .message=${"Preset type is fixed for component animations. Edit parameters below."}></lcards-message>
        `:l`
          <ha-selector
            .hass=${this.hass}
            .selector=${{select:{mode:"dropdown",custom_value:true,options:this._getPresetOptions()}}}
            .value=${s}
            .label=${"Select animation type"}
            @value-changed=${S=>this._updatePreset(t,S.detail.value)}
          ></ha-selector>
        `}
      </lcards-form-section>

      ${a?"":this._renderPresetInfoGuide(s,t)}

      <lcards-form-section
        header="Animation Parameters"
        icon="mdi:tune"
        ?expanded=${true}>
        ${this._renderPresetParams(s,i,t)}
      </lcards-form-section>
    `}_renderPresetParams(e,t,a){const s=j[e]||{},r=this._renderCommonParams(t,a,s);if(J.has(e))return l`
        <lcards-form-section
          header="Preset Parameters"
          icon="mdi:tune-variant"
          ?expanded=${true}>
          ${this._renderSchemaDrivenParams(e,t,a)}
        </lcards-form-section>
        ${r}
      `;let i="";switch(e){case"rotate":{const o=!t.direction;i=l`
          <div class="param-grid">
            <ha-selector
              .hass=${this.hass}
              .selector=${{select:{mode:"dropdown",options:[{value:"clockwise",label:"Clockwise (0° → 360°)"},{value:"counterclockwise",label:"Counter-clockwise (0° → -360°)"},{value:"",label:"Custom range (from/to below)"}]}}}
              .value=${t.direction??""}
              .label=${"Direction"}
              @value-changed=${d=>this._updateParam(a,"direction",d.detail.value)}>
            </ha-selector>
            ${o?l`
              <ha-selector
                .hass=${this.hass}
                .selector=${{number:{min:-720,max:720,step:15,mode:"box"}}}
                .value=${t.from??0}
                .label=${"From (degrees)"}
                @value-changed=${d=>this._updateParam(a,"from",d.detail.value)}>
              </ha-selector>
              <ha-selector
                .hass=${this.hass}
                .selector=${{number:{min:-720,max:720,step:15,mode:"box"}}}
                .value=${t.to??360}
                .label=${"To (degrees)"}
                @value-changed=${d=>this._updateParam(a,"to",d.detail.value)}>
              </ha-selector>
            `:""}
          </div>
        `;break}case"bounce":i=l`
          <div class="param-grid">
            <ha-selector
              .hass=${this.hass}
              .selector=${{number:{min:.1,max:3,step:.1,mode:"slider"}}}
              .value=${t.scale_max??1.2}
              .label=${"Max Scale"}
              @value-changed=${o=>this._updateParam(a,"scale_max",o.detail.value)}>
            </ha-selector>
            <ha-selector
              .hass=${this.hass}
              .selector=${{number:{min:1,max:10,step:1,mode:"slider"}}}
              .value=${t.bounces??3}
              .label=${"Number of Bounces"}
              .helper=${"When > 1, this preset forces outQuad easing and multiplies duration by this count; see the info guide above."}
              @value-changed=${o=>this._updateParam(a,"bounces",o.detail.value)}>
            </ha-selector>
          </div>
        `;break;case"skew":i=l`
          <div class="param-grid">
            <ha-selector
              .hass=${this.hass}
              .selector=${{number:{min:-45,max:45,step:1,mode:"box"}}}
              .value=${t.skewX??0}
              .label=${"Skew X (degrees)"}
              @value-changed=${o=>this._updateParam(a,"skewX",o.detail.value)}>
            </ha-selector>
            <ha-selector
              .hass=${this.hass}
              .selector=${{number:{min:-45,max:45,step:1,mode:"box"}}}
              .value=${t.skewY??0}
              .label=${"Skew Y (degrees)"}
              @value-changed=${o=>this._updateParam(a,"skewY",o.detail.value)}>
            </ha-selector>
            <ha-selector
              .hass=${this.hass}
              .selector=${{number:{min:-45,max:45,step:1,mode:"box"}}}
              .value=${t.from_skewX??0}
              .label=${"From Skew X (degrees)"}
              .helper=${"Optional starting X skew: if either From field is set, the animation goes from these values to Skew X/Y above instead of from 0"}
              @value-changed=${o=>this._updateParam(a,"from_skewX",o.detail.value)}>
            </ha-selector>
            <ha-selector
              .hass=${this.hass}
              .selector=${{number:{min:-45,max:45,step:1,mode:"box"}}}
              .value=${t.from_skewY??0}
              .label=${"From Skew Y (degrees)"}
              .helper=${"Optional starting Y skew: see From Skew X"}
              @value-changed=${o=>this._updateParam(a,"from_skewY",o.detail.value)}>
            </ha-selector>
          </div>
        `;break}return l`
      ${i?l`
        <lcards-form-section
          header="Preset Parameters"
          icon="mdi:tune-variant"
          ?expanded=${true}>
          ${i}
        </lcards-form-section>
      `:""}
      ${r}
    `}_renderSchemaDrivenParams(e,t,a){const s=E[e];if(!(s!=null&&s.properties))return"";const r=new Set(["duration","ease","loop","alternate","delay"]);return this._schemaRenderCtx={presetSchema:s,params:t,index:a},l`
      <div class="param-grid">
        ${Object.entries(s.properties).filter(([i,o])=>!r.has(i)||y(e,i,o)).map(([i,o])=>{var d;return((d=o["x-ui-hints"])==null?void 0:d.widget)==="json"?this._renderJsonParamField(i,o,t,a):o.type==="object"&&o.properties?this._renderNestedObjectField(i,o,t):B.renderField(this,i,{})})}
      </div>
    `}_renderNestedObjectField(e,t,a){const r=(t["x-ui-hints"]||{}).label||e.replace(/_/g," ").replace(/\b\w/g,i=>i.toUpperCase());return l`
      <div class="param-full">
        <lcards-form-section .header=${r} .description=${t.description||""} ?expanded=${true}>
          <div class="param-grid">
            ${Object.entries(t.properties||{}).map(([i])=>B.renderField(this,`${e}.${i}`,{}))}
          </div>
        </lcards-form-section>
      </div>
    `}_resolveNestedFieldSchema(e){var a,s,r;const t=(a=this._schemaRenderCtx)==null?void 0:a.presetSchema;if(!(t!=null&&t.properties))return null;if(e.includes(".")){const[i,o]=e.split(".");return((r=(s=t.properties[i])==null?void 0:s.properties)==null?void 0:r[o])??null}return t.properties[e]??null}_getSchemaForPath(e){return this._resolveNestedFieldSchema(e)}_getConfigValue(e){var a;const t=(a=this._schemaRenderCtx)==null?void 0:a.params;if(t){if(e.includes(".")){const[s,r]=e.split("."),i=t[s];return i&&typeof i=="object"?i[r]:void 0}return t[e]}}_setConfigValue(e,t){var s,r;const a=(s=this._schemaRenderCtx)==null?void 0:s.index;if(e.includes(".")){const[i,o]=e.split("."),d=((r=this.animations[a])==null?void 0:r.params)||{},c={...d[i]&&typeof d[i]=="object"?d[i]:{},[o]:t};this._updateParam(a,i,c);return}this._updateParam(a,e,t)}_renderJsonParamField(e,t,a,s){const i=(t["x-ui-hints"]||{}).label||e,o=t.type==="array"?[]:{},d=a[e]??t.default??o;return l`
      <div class="param-full">
        <p class="field-label">${i}</p>
        <ha-yaml-editor
          auto-update
          .value=${d}
          @value-changed=${n=>{n.detail.isValid!==false&&this._updateParam(s,e,n.detail.value)}}>
        </ha-yaml-editor>
        ${t.description?l`<div class="help-text">${t.description}</div>`:""}
      </div>
    `}_renderCommonParams(e,t,a={}){const s=!(a.hideDuration&&a.hideStartDelay&&a.hideLoop&&a.hideAlternate);return l`
      ${s?l`<lcards-form-section
        header="Timing & Duration"
        icon="mdi:timer-outline"
        ?expanded=${true}>
        <div class="param-grid">
          ${a.hideDuration?"":l`<ha-input
            type="number"
            label="Duration (ms)"
            .value=${e.duration??1e3}
            min="0"
            step="100"
            @input=${r=>this._updateParam(t,"duration",Number(r.target.value))}>
          </ha-input>`}

          ${a.hideStartDelay?"":l`<ha-input
            type="number"
            label="Start Delay (ms)"
            .value=${e.delay??0}
            min="0"
            step="100"
            hint="Delay before animation starts"
            @input=${r=>this._updateParam(t,"delay",Number(r.target.value))}>
          </ha-input>`}

          ${a.hideLoop?"":l`
            <ha-selector
              .hass=${this.hass}
              .selector=${{boolean:{}}}
              .value=${typeof e.loop=="boolean"?e.loop:!!e.loop}
              .label=${"Loop Animation (Infinite)"}
              .helper=${"Toggle for infinite loop, or use Loop Count below for specific iterations"}
              @value-changed=${r=>this._updateParam(t,"loop",r.detail.value)}>
            </ha-selector>

            <ha-selector
              .hass=${this.hass}
              .selector=${{number:{min:0,max:100,step:1,mode:"box"}}}
              .value=${typeof e.loop=="number"?e.loop:""}
              .label=${"Loop Count (0 = off, leave empty for infinite)"}
              @value-changed=${r=>this._updateParam(t,"loop",r.detail.value||false)}>
            </ha-selector>
          `}

          ${a.hideAlternate?"":l`<ha-selector
            .hass=${this.hass}
            .selector=${{boolean:{}}}
            .value=${e.alternate??false}
            .label=${"Alternate Direction"}
            .helper=${"Reverse animation direction on each loop"}
            @value-changed=${r=>this._updateParam(t,"alternate",r.detail.value)}>
          </ha-selector>`}
        </div>
      </lcards-form-section>`:""}

      ${a.hideEasing?"":l`<lcards-form-section
        header="Easing Function"
        icon="mdi:chart-bell-curve"
        ?expanded=${true}>
        <div class="param-grid">
          <ha-selector
          .hass=${this.hass}
          .selector=${{select:{mode:"dropdown",custom_value:true,options:[{value:"linear",label:"Linear"},{value:"in",label:"Power - In"},{value:"out",label:"Power - Out"},{value:"inOut",label:"Power - In/Out"},{value:"outIn",label:"Power - Out/In"},{value:"inQuad",label:"Quad - In"},{value:"outQuad",label:"Quad - Out"},{value:"inOutQuad",label:"Quad - In/Out"},{value:"outInQuad",label:"Quad - Out/In"},{value:"inCubic",label:"Cubic - In"},{value:"outCubic",label:"Cubic - Out"},{value:"inOutCubic",label:"Cubic - In/Out"},{value:"outInCubic",label:"Cubic - Out/In"},{value:"inQuart",label:"Quart - In"},{value:"outQuart",label:"Quart - Out"},{value:"inOutQuart",label:"Quart - In/Out"},{value:"outInQuart",label:"Quart - Out/In"},{value:"inQuint",label:"Quint - In"},{value:"outQuint",label:"Quint - Out"},{value:"inOutQuint",label:"Quint - In/Out"},{value:"outInQuint",label:"Quint - Out/In"},{value:"inSine",label:"Sine - In"},{value:"outSine",label:"Sine - Out"},{value:"inOutSine",label:"Sine - In/Out"},{value:"outInSine",label:"Sine - Out/In"},{value:"inExpo",label:"Expo - In"},{value:"outExpo",label:"Expo - Out"},{value:"inOutExpo",label:"Expo - In/Out"},{value:"outInExpo",label:"Expo - Out/In"},{value:"inCirc",label:"Circ - In"},{value:"outCirc",label:"Circ - Out"},{value:"inOutCirc",label:"Circ - In/Out"},{value:"outInCirc",label:"Circ - Out/In"},{value:"inBack",label:"Back - In"},{value:"outBack",label:"Back - Out"},{value:"inOutBack",label:"Back - In/Out"},{value:"outInBack",label:"Back - Out/In"},{value:"inElastic",label:"Elastic - In"},{value:"outElastic",label:"Elastic - Out"},{value:"inOutElastic",label:"Elastic - In/Out"},{value:"outInElastic",label:"Elastic - Out/In"},{value:"inBounce",label:"Bounce - In"},{value:"outBounce",label:"Bounce - Out"},{value:"inOutBounce",label:"Bounce - In/Out"},{value:"outInBounce",label:"Bounce - Out/In"},{value:"cubicBezier",label:"Cubic Bézier - Custom curve"},{value:"spring",label:"Spring - Physics-based"},{value:"steps",label:"Steps - Frame-by-frame"},{value:"linear",label:"Linear - Custom linear points"},{value:"irregular",label:"Irregular - Randomized"},{value:"custom",label:"Custom - anime.js string"}]}}}
          .value=${e.ease??"inOutQuad"}
          .label=${"Easing Function"}
          @value-changed=${r=>this._updateParam(t,"ease",r.detail.value)}>
        </ha-selector>
        </div>

        ${this._renderParametricEasingFields(e,t)}
      </lcards-form-section>`}
    `}_renderParametricEasingFields(e,t){var s,r,i,o,d,n,c,g,S,k,_,x,p,u,m,v,b,w;const a=e.ease||"inOutQuad";if(["in","out","inOut","outIn"].includes(a))return l`
        <ha-input
          type="number"
          label="Power (exponent)"
          .value=${((s=e.ease_params)==null?void 0:s.power)??1.675}
          min="0.1"
          max="10"
          step="0.1"
          hint="Default: 1.675. Higher = steeper curve"
          @input=${h=>this._updateEaseParam(t,"power",Number(h.target.value))}>
        </ha-input>
      `;if(a.includes("Back"))return l`
        <ha-input
          type="number"
          label="Overshoot"
          .value=${((r=e.ease_params)==null?void 0:r.overshoot)??1.70158}
          min="0"
          max="5"
          step="0.1"
          hint="Default: 1.70158. Higher = more overshoot"
          @input=${h=>this._updateEaseParam(t,"overshoot",Number(h.target.value))}>
        </ha-input>
      `;if(a.includes("Elastic"))return l`
        <div class="param-grid" style="grid-template-columns: 1fr 1fr;">
          <ha-input
            type="number"
            label="Amplitude"
            .value=${((i=e.ease_params)==null?void 0:i.amplitude)??1}
            min="0.1"
            max="5"
            step="0.1"
            hint="Default: 1"
            @input=${h=>this._updateEaseParam(t,"amplitude",Number(h.target.value))}>
          </ha-input>

          <ha-input
            type="number"
            label="Period"
            .value=${((o=e.ease_params)==null?void 0:o.period)??.3}
            min="0.1"
            max="2"
            step="0.05"
            hint="Default: 0.3"
            @input=${h=>this._updateEaseParam(t,"period",Number(h.target.value))}>
          </ha-input>
        </div>
      `;if(a==="cubicBezier")return l`
        <div class="param-grid" style="grid-template-columns: 1fr 1fr;">
          <ha-selector
            .hass=${this.hass}
            .selector=${{number:{min:0,max:1,step:.01,mode:"box"}}}
            .value=${((d=e.ease_params)==null?void 0:d.x1)??.25}
            .label=${"X1"}
            @value-changed=${h=>this._updateEaseParam(t,"x1",h.detail.value)}>
          </ha-selector>
          <ha-selector
            .hass=${this.hass}
            .selector=${{number:{min:-2,max:2,step:.01,mode:"box"}}}
            .value=${((n=e.ease_params)==null?void 0:n.y1)??.1}
            .label=${"Y1"}
            @value-changed=${h=>this._updateEaseParam(t,"y1",h.detail.value)}>
          </ha-selector>
          <ha-selector
            .hass=${this.hass}
            .selector=${{number:{min:0,max:1,step:.01,mode:"box"}}}
            .value=${((c=e.ease_params)==null?void 0:c.x2)??.25}
            .label=${"X2"}
            @value-changed=${h=>this._updateEaseParam(t,"x2",h.detail.value)}>
          </ha-selector>
          <ha-selector
            .hass=${this.hass}
            .selector=${{number:{min:-2,max:2,step:.01,mode:"box"}}}
            .value=${((g=e.ease_params)==null?void 0:g.y2)??1}
            .label=${"Y2"}
            @value-changed=${h=>this._updateEaseParam(t,"y2",h.detail.value)}>
          </ha-selector>
        </div>
        <lcards-message type="info" .message=${"Define custom curve: (x1,y1) and (x2,y2) control points"}></lcards-message>
      `;if(a==="spring")return l`
        <div class="param-grid" style="grid-template-columns: 1fr 1fr;">
          <ha-selector
            .hass=${this.hass}
            .selector=${{number:{min:.1,max:10,step:.1,mode:"box"}}}
            .value=${((S=e.ease_params)==null?void 0:S.mass)??1}
            .label=${"Mass"}
            @value-changed=${h=>this._updateEaseParam(t,"mass",h.detail.value)}>
          </ha-selector>
          <ha-selector
            .hass=${this.hass}
            .selector=${{number:{min:1,max:1e3,step:10,mode:"box"}}}
            .value=${((k=e.ease_params)==null?void 0:k.stiffness)??100}
            .label=${"Stiffness"}
            @value-changed=${h=>this._updateEaseParam(t,"stiffness",h.detail.value)}>
          </ha-selector>
          <ha-selector
            .hass=${this.hass}
            .selector=${{number:{min:0,max:100,step:1,mode:"box"}}}
            .value=${((_=e.ease_params)==null?void 0:_.damping)??10}
            .label=${"Damping"}
            @value-changed=${h=>this._updateEaseParam(t,"damping",h.detail.value)}>
          </ha-selector>
          <ha-selector
            .hass=${this.hass}
            .selector=${{number:{min:-100,max:100,step:1,mode:"box"}}}
            .value=${((x=e.ease_params)==null?void 0:x.velocity)??0}
            .label=${"Velocity"}
            @value-changed=${h=>this._updateEaseParam(t,"velocity",h.detail.value)}>
          </ha-selector>
        </div>
        <lcards-message type="info" .message=${"Physics simulation. Try: mass=1, stiffness=170, damping=26"}></lcards-message>
      `;if(a==="steps")return l`
        <div class="param-grid" style="grid-template-columns: 2fr 1fr;">
          <ha-selector
            .hass=${this.hass}
            .selector=${{number:{min:1,max:100,step:1,mode:"box"}}}
            .value=${((p=e.ease_params)==null?void 0:p.steps)??10}
            .label=${"Number of Steps"}
            @value-changed=${h=>this._updateEaseParam(t,"steps",h.detail.value)}>
          </ha-selector>
          <ha-selector
            .hass=${this.hass}
            .selector=${{boolean:{}}}
            .value=${((u=e.ease_params)==null?void 0:u.fromStart)??false}
            .label=${"From Start"}
            @value-changed=${h=>this._updateEaseParam(t,"fromStart",h.detail.value)}>
          </ha-selector>
        </div>
        <lcards-message type="info" .message=${"Choppy frame-by-frame. fromStart: change at step start vs end"}></lcards-message>
      `;if(a==="linear"){const h=JSON.stringify(((m=e.ease_params)==null?void 0:m.points)??[0,.25,.75,1]);return l`
        <ha-selector
          .hass=${this.hass}
          .selector=${{text:{multiline:false}}}
          .value=${h}
          .label=${"Value Points (JSON)"}
          @value-changed=${q=>{try{const O=JSON.parse(q.detail.value);Array.isArray(O)&&this._updateEaseParam(t,"points",O)}catch{}}}>
        </ha-selector>
        <lcards-message type="info" .message=${'Linear between points: [0, 0.5, 1] or with timing: [0, "0.5 50%", 1]'}></lcards-message>
      `}return a==="irregular"?l`
        <div class="param-grid" style="grid-template-columns: 1fr 1fr;">
          <ha-selector
            .hass=${this.hass}
            .selector=${{number:{min:2,max:100,step:1,mode:"box"}}}
            .value=${((v=e.ease_params)==null?void 0:v.steps)??10}
            .label=${"Steps"}
            @value-changed=${h=>this._updateEaseParam(t,"steps",h.detail.value)}>
          </ha-selector>
          <ha-selector
            .hass=${this.hass}
            .selector=${{number:{min:.1,max:5,step:.1,mode:"box"}}}
            .value=${((b=e.ease_params)==null?void 0:b.randomness)??1}
            .label=${"Randomness"}
            @value-changed=${h=>this._updateEaseParam(t,"randomness",h.detail.value)}>
          </ha-selector>
        </div>
        <lcards-message type="info" .message=${"Erratic motion. Higher randomness = wilder jumps"}></lcards-message>
      `:a==="custom"?l`
        <ha-textarea
          label="anime.js Easing String"
          .value=${((w=e.ease_params)==null?void 0:w.customString)??""}
          @input=${h=>this._updateEaseParam(t,"customString",h.target.value)}
          rows="3"
          resize="auto"
          style="width: 100%; font-family: 'Roboto Mono', monospace;">
        </ha-textarea>
        <lcards-message type="info">
          Paste from <a href="https://animejs.com/easing-editor/spring/default" target="_blank">anime.js Easing Editor</a>.
          Example: <code>spring({ bounce: 0.4, duration: 500 })</code>
        </lcards-message>
      `:""}_updateEaseParam(e,t,a){var i;const s=[...this.animations],r=s[e];s[e]={...r,params:{...r.params,ease_params:{...(i=r.params)==null?void 0:i.ease_params,[t]:a}}},this._workingAnimations=s,this._fireChange()}_renderCustomForm(e,t){const a=e.animejs||{};return l`
      <lcards-form-section
        header="Custom anime.js Configuration"
        icon="mdi:code-braces"
        ?expanded=${true}>
        <ha-yaml-editor
          auto-update
          .value=${a}
          @value-changed=${s=>{s.detail.isValid!==false&&this._updateCustomConfig(t,s.detail.value)}}>
        </ha-yaml-editor>
        <lcards-message type="info">
          Enter a valid object for anime.js v4 configuration (JSON or YAML syntax both work).
          <a href="https://animejs.com/documentation/" target="_blank" rel="noopener noreferrer">
            View Documentation →
          </a>
        </lcards-message>
      </lcards-form-section>
    `}_renderPlaceholderWarning(e){return l`
      <div class="warning-banner">
        <ha-icon icon="mdi:alert-circle"></ha-icon>
        <div>
          <strong>Placeholder Preset:</strong> "${this._formatPresetName(e)}" is not yet implemented.
          You can still configure it, but it won't animate until the preset is completed.
        </div>
      </div>
    `}_formatTrigger(e){return{on_load:"Load",on_show:"Show",on_hover:"Hover",on_leave:"Leave",on_tap:"Tap",on_double_tap:"Double Tap",on_hold:"Hold",on_datasource_change:"Data Change",on_entity_change:"Entity Change"}[e]||e}_getTriggerIcon(e){return{on_load:"mdi:loading",on_show:"mdi:eye-outline",on_hover:"mdi:cursor-default-click",on_leave:"mdi:cursor-default-outline",on_tap:"mdi:gesture-tap",on_double_tap:"mdi:gesture-double-tap",on_hold:"mdi:gesture-tap-hold",on_datasource_change:"mdi:database-sync",on_entity_change:"mdi:state-machine"}[e]||"mdi:lightning-bolt"}_getTriggerHelp(e){return{on_load:"Executes once, when the card first renders",on_show:"Executes every time the card appears: when the view opens, when a visibility condition shows it, or when you come back from another view. Use it for entrance animations.",on_hover:"Executes when mouse enters the element",on_leave:"Executes when mouse leaves the element (use for exit animations)",on_tap:"Executes when the element is clicked/tapped",on_double_tap:"Executes when the element is double-tapped",on_hold:"Executes when the element is held (long press)",on_datasource_change:"Executes when associated data source value changes",on_entity_change:"Triggers when a monitored entity (or attribute) changes. Use from_state/to_state as fire-and-forget gates, and while to auto-stop a looping animation when a condition clears."}[e]||""}_renderEntityChangeTriggerConfig(e,t){var o,d;const a=this._getWhileConditionType(e),s=this._getWhileConditionValue(e),r=T.includes(a),i=this._getWhileConditionBounds(e);return l`
      <div style="margin-top: 16px; padding: 12px; background: var(--secondary-background-color); border-radius: 6px;">
        <label class="field-label">Entity Change Configuration</label>

        <ha-selector
          .hass=${this.hass}
          .selector=${{entity:{}}}
          .value=${e.entity||""}
          .label=${"Entity to Monitor"}
          .helper=${"Entity whose state changes will trigger this animation"}
          @value-changed=${n=>this._updateAnimation(t,"entity",n.detail.value)}
          style="margin-bottom: 12px;">
        </ha-selector>

        <ha-selector
          .hass=${this.hass}
          .label=${"Attribute (optional)"}
          .helper=${"Attribute to read instead of entity state. Applies to from_state, to_state, and while. Use brightness_pct for a computed 0–100 light brightness percentage."}
          .selector=${{select:{mode:"dropdown",custom_value:true,options:[{value:"__none__",label:"(Use entity state)"},...Y(this.hass,e.entity||((d=(o=this.cardElement)==null?void 0:o.config)==null?void 0:d.entity))]}}}
          .value=${e.attribute||"__none__"}
          @value-changed=${n=>{const c=(n.detail.value??"").trim();this._updateAnimation(t,"attribute",c==="__none__"||!c?void 0:c)}}
          style="width: 100%; margin-bottom: 12px;">
        </ha-selector>

        <lcards-message type="warning" .message=${"From and To state only decide when an animation starts; they never stop a loop. To stop a loop when a condition clears, add a While Condition below."}></lcards-message>

        <ha-input
          label="From State (optional)"
          .value=${e.from_state||""}
          .hint=${"Fire-and-forget gate: only trigger when transitioning FROM this value (leave empty for any)"}
          @input=${n=>this._updateAnimation(t,"from_state",n.target.value)}
          style="width: 100%; margin-bottom: 12px;">
        </ha-input>

        <ha-input
          label="To State (optional)"
          .value=${e.to_state||""}
          .hint=${"Fire-and-forget gate: only trigger when transitioning TO this value (leave empty for any)"}
          @input=${n=>this._updateAnimation(t,"to_state",n.target.value)}
          style="width: 100%; margin-bottom: 12px;">
        </ha-input>

        <label class="field-label" style="margin-top: 8px; display: block;">While Condition <span style="font-size: 0.85em; opacity: 0.7;">(requires loop: true)</span></label>
        <div style="display: flex; gap: 8px; margin-bottom: 8px; align-items: flex-start; flex-wrap: wrap;">
          <ha-selector
            .hass=${this.hass}
            .selector=${{select:{options:[{value:"none",label:"None (fire-and-forget)"},{value:"state",label:"State equals"},{value:"not_state",label:"State not equals"},{value:"above",label:"Above (numeric >)"},{value:"at_least",label:"At Least (numeric ≥)"},{value:"below",label:"Below (numeric <)"},{value:"at_most",label:"At Most (numeric ≤)"},{value:"between",label:"Between (inclusive, ≥ and ≤)"},{value:"between_exclusive",label:"Between (exclusive, > and <)"}]}}}
            .value=${a}
            .label=${"Play while..."}
            @value-changed=${n=>this._updateWhileConditionType(t,n.detail.value)}
            style="flex: 1; min-width: 160px;">
          </ha-selector>
          ${i?l`
            <ha-input
              label="Min"
              type="number"
              .value=${String(i.lo??"")}
              @input=${n=>this._updateWhileConditionBoundValue(t,i.loKey,n.target.value)}
              style="flex: 1; min-width: 100px;">
            </ha-input>
            <ha-input
              label="Max"
              type="number"
              .value=${String(i.hi??"")}
              @input=${n=>this._updateWhileConditionBoundValue(t,i.hiKey,n.target.value)}
              style="flex: 1; min-width: 100px;">
            </ha-input>
          `:a!=="none"?l`
            <ha-input
              label="Value"
              type=${r?"number":"text"}
              .value=${s}
              .hint=${r?"Numeric threshold":"State string (e.g. on, off, heating)"}
              @input=${n=>this._updateWhileConditionValue(t,a,n.target.value)}
              style="flex: 1;">
            </ha-input>
          `:""}
        </div>

        ${e.while?l`
          <lcards-message type="info" .message=${"The looping animation will play while the condition is true and stop automatically when it clears. Requires loop: true in the Animation Settings section above."}></lcards-message>
        `:""}

        <ha-selector
          .hass=${this.hass}
          .selector=${{boolean:{}}}
          .value=${e.check_on_load!==false}
          .label=${"Check on Load"}
          .helper=${"Evaluate the condition when the card first loads (default: on). For while conditions: starts immediately if condition already met. For to_state: fires if entity is already in that state. Disable to only react to state transitions after load."}
          @value-changed=${n=>this._updateAnimation(t,"check_on_load",n.detail.value)}
          style="margin-bottom: 12px;">
        </ha-selector>
      </div>
    `}_getWhileConditionType(e){const t=e.while;return!t||typeof t!="object"?"none":"state"in t?"state":"not_state"in t?"not_state":"at_least"in t&&"at_most"in t?"between":"above"in t&&"below"in t?"between_exclusive":"above"in t?"above":"at_least"in t?"at_least":"below"in t?"below":"at_most"in t?"at_most":"none"}_getWhileConditionValue(e){const t=this._getWhileConditionType(e);return t==="none"||I[t]?"":String(e.while[t]??"")}_getWhileConditionBounds(e){const t=this._getWhileConditionType(e),a=I[t];if(!a)return null;const s=e.while||{};return{loKey:a.loKey,hiKey:a.hiKey,lo:s[a.loKey],hi:s[a.hiKey]}}_updateWhileConditionType(e,t){const a=[...this.animations],s=I[t];if(t==="none"){const{while:r,...i}=a[e];a[e]=i}else if(s)a[e]={...a[e],while:{[s.loKey]:0,[s.hiKey]:100}};else{const r=this._getWhileConditionValue(a[e]),i=T.includes(t),o=r!==""?i?Number(r)||0:r:i?0:"";a[e]={...a[e],while:{[t]:o}}}this._workingAnimations=a,this._fireChange()}_updateWhileConditionValue(e,t,a){const s=[...this.animations],i=T.includes(t)?Number(a):a;s[e]={...s[e],while:{[t]:i}},this._workingAnimations=s,this._fireChange()}_updateWhileConditionBoundValue(e,t,a){const s=[...this.animations];s[e]={...s[e],while:{...s[e].while,[t]:Number(a)}},this._workingAnimations=s,this._fireChange()}_formatPresetName(e){return{pulse:"Pulse",fade:"Fade",glow:"Glow",draw:"Draw",march:"Marching Ants",blink:"Blink",shimmer:"Shimmer",strobe:"Strobe",flicker:"Flicker",cascade:"Cascade","cascade-color":"Cascade Colour",ripple:"Ripple",scale:"Scale","scale-reset":"Scale Reset",set:"Set Properties",motionpath:"Motion Path",slide:"Slide",rotate:"Rotate",shake:"Shake",bounce:"Bounce","color-shift":"Colour Shift",skew:"Skew",glitch:"Glitch","stagger-flash":"Stagger Flash","stagger-grid":"Stagger Grid","stagger-wave":"Stagger Wave","stagger-radial":"Stagger Radial"}[e]||e}_getAnimationDetails(e){const t={...e.params,...e.duration!==void 0&&{duration:e.duration},...e.delay!==void 0&&{delay:e.delay},...e.loop!==void 0&&{loop:e.loop},...e.alternate!==void 0&&{alternate:e.alternate},...e.ease!==void 0&&{ease:e.ease}},a=[];t.duration&&a.push(`${t.duration}ms`),t.ease&&t.ease!=="inOutQuad"&&a.push(t.ease),t.loop===true?a.push("loop: ∞"):typeof t.loop=="number"&&t.loop>0&&a.push(`loop: ${t.loop}×`),t.delay&&a.push(`delay: ${t.delay}ms`),t.alternate&&a.push("alternate");const s=e.preset||"pulse";return s==="pulse"&&t.max_scale&&a.push(`scale: ${t.max_scale}`),s==="fade"&&t.to!==void 0&&a.push(`opacity: ${t.to}`),s==="scale"&&t.scale&&a.push(`scale: ${t.scale}`),a.length>0?a.join(" • "):"Default settings"}_getPresetOptions(){return[{value:"pulse",label:"Pulse - Breathing scale + brightness"},{value:"fade",label:"Fade - Opacity transition"},{value:"glow",label:"Glow - Drop shadow pulsing"},{value:"draw",label:"Draw - SVG stroke drawing"},{value:"march",label:"Marching Ants - Dashed line animation"},{value:"blink",label:"Blink - Rapid opacity toggle"},{value:"shimmer",label:"Shimmer - Colour + opacity shimmer"},{value:"strobe",label:"Strobe - Fast flashing"},{value:"flicker",label:"Flicker - Random flickering"},{value:"cascade",label:"Cascade - Staggered animation"},{value:"cascade-color",label:"Cascade Colour - Row-by-row colour cycling"},{value:"ripple",label:"Ripple - Expanding wave effect"},{value:"scale",label:"Scale - Simple scale transform"},{value:"scale-reset",label:"Scale Reset - Return to original"},{value:"slide",label:"Slide - Translate/position animation"},{value:"rotate",label:"Rotate - Rotation animation"},{value:"shake",label:"Shake - Vibrate/shake effect"},{value:"bounce",label:"Bounce - Elastic bounce"},{value:"color-shift",label:"Colour Shift - Pure colour transition"},{value:"skew",label:"Skew - Slant transformation"},{value:"motionpath",label:"Motion Path - Follow SVG path"},{value:"sequence",label:"Sequence - Multi-step timeline of tweens"},{value:"chaos",label:"Chaos - Randomized multi-property glitch motion"},{value:"glitch",label:"Glitch - Digital distortion"},{value:"physics-spring",label:"Physics Spring - Spring physics simulation"},{value:"text-reveal",label:"Text Reveal - Character-by-character reveal"},{value:"text-typewriter",label:"Text Typewriter - Typing effect"},{value:"text-scramble",label:"Text Scramble - Matrix-style scramble"},{value:"text-glitch",label:"Text Glitch - Rapid jitter"},{value:"stagger-flash",label:"Stagger Flash - LCARS chasing bar effect"},{value:"stagger-grid",label:"Stagger Grid - Grid-based stagger"},{value:"stagger-wave",label:"Stagger Wave - Wave pattern"},{value:"stagger-radial",label:"Stagger Radial - Radial burst"},{value:"timeline-cascade",label:"Timeline Cascade - Sequential steps"},{value:"timeline-attention",label:"Timeline Attention - Attention-getter"},{value:"set",label:"Set - Immediate property change"}]}_splitIntoSentences(e){return e?e.split(new RegExp("(?<=[.!?])\\s+(?=[A-Z`])")):[]}_buildExampleYaml(e,t,a){const s=a.filter(([,o])=>o.default!==void 0),r=a.filter(([,o])=>o.default===void 0),i=["animations:","  - trigger: on_load",`    preset: ${e}`];if(s.length){i.push("    params:");for(const[o,d]of s)i.push(`      ${o}: ${JSON.stringify(d.default)}`)}return{yaml:i.join(`
`),missingFields:r.map(([o])=>o)}}_renderPresetInfoGuide(e,t){const a=E[e];if(!a)return"";const s=new Set(["duration","ease","loop","alternate","delay"]),r=Object.entries(a.properties||{}).filter(([c,g])=>!s.has(c)||y(e,c,g)),i=`${Q}#${e}`,o=e==="march"||e==="stagger-flash"?null:Z[e]||ee,{yaml:d,missingFields:n}=this._buildExampleYaml(e,a,r);return l`
      ${H({header:`How ${e} works`,icon:"mdi:information-outline",body:l`
            ${this._splitIntoSentences(a.description).map(c=>l`<p>${c}</p>`)}
            ${r.length?l`
              <strong>Params:</strong>
              <ul>
                ${r.map(([c,g])=>l`
                  <li>
                    <code>${c}</code>${g.default!==void 0?l` (default: <code>${JSON.stringify(g.default)}</code>)`:""}
                    ${g.description?`: ${g.description}`:""}
                  </li>
                `)}
              </ul>
            `:""}
            <strong>Example:</strong>
            <pre class="info-guide-example">${d}</pre>
            ${n.length?l`
              <p class="info-guide-note">
                No known default to show for: ${n.map(c=>l`<code>${c}</code>`)}. Add these yourself before using this example.
              </p>
            `:""}
            ${this._renderMapRangeNote()}
            <div class="info-guide-links">
              <a href=${i} target="_blank" rel="noopener noreferrer">View full docs →</a>
              ${o?l`<a href=${o} target="_blank" rel="noopener noreferrer">anime.js reference →</a>`:""}
            </div>
          `})}
    `}_renderMapRangeNote(){return l`
      <p class="info-guide-tip"><strong>Follow an entity:</strong> <code>duration</code>, <code>delay</code> and any param above
        can track an entity's value instead of a fixed number (in this animation's YAML). <code>output</code> can also be two
        colours, to blend between them.</p>
      <pre class="info-guide-example">speed: { map_range: { entity: sensor.grid_power, input: [0, 5000], output: [8, 0.5] } }</pre>
    `}_isPlaceholderPreset(e){return false}_toggleExpanded(e){this._expandedIndex=this._expandedIndex===e?null:e,this._pendingDeleteIndex=null}_addAnimation(){console.log("[AnimationEditor] 🎬 Add Animation button clicked!",{currentAnimations:this.animations.length,expandedIndex:this._expandedIndex});const e={trigger:"on_load",preset:"pulse",duration:1e3,ease:"inOutQuad",loop:true,alternate:true,params:{}};this._workingAnimations=[...this.animations,e],this._expandedIndex=this.animations.length-1,$.debug("[AnimationEditor] Animation added",{newCount:this.animations.length,newExpandedIndex:this._expandedIndex,newAnimation:e}),this._fireChange(),this.requestUpdate()}_duplicateAnimation(e,t){e.stopPropagation();const a=this.animations[t],s=JSON.parse(JSON.stringify(a));this._workingAnimations=[...this.animations.slice(0,t+1),s,...this.animations.slice(t+1)],this._expandedIndex=t+1,this._fireChange()}_deleteAnimation(e,t){e.stopPropagation(),this._workingAnimations=this.animations.filter((a,s)=>s!==t),this._expandedIndex===t?this._expandedIndex=null:this._expandedIndex>t&&this._expandedIndex--,this._pendingDeleteIndex=null,this._fireChange()}_confirmDelete(e){const t={stopPropagation:C(()=>{},"stopPropagation")};this._deleteAnimation(t,e)}_toggleEnabled(e,t){e.stopPropagation(),this._setEnabled(t,this.animations[t].enabled!==false?false:void 0)}_setEnabled(e,t){const a=[...this.animations],s={...a[e]};t===false?s.enabled=false:delete s.enabled,a[e]=s,this._workingAnimations=a,this._fireChange()}_validateAnimationId(e,t){return e?/^[a-zA-Z0-9_-]+$/.test(e)?(this._workingAnimations||[]).some((r,i)=>i!==t&&r.id===e)?`ID "${e}" is already used by another animation.`:null:"ID can only contain letters, numbers, hyphens (-) and underscores (_). No spaces or special characters.":null}_handleIdChange(e,t){const a=(t==null?void 0:t.trim())||void 0,s=[...this.animations];s[e]={...s[e],id:a},this._workingAnimations=s,this.requestUpdate(),(!a||!this._validateAnimationId(a,e))&&this._fireChange()}_updateAnimation(e,t,a){const s=[...this.animations];s[e]={...s[e],[t]:a},this._workingAnimations=s,this._fireChange()}_updatePreset(e,t){var o;const a=[...this.animations],s=a[e];if(s.preset===t)return;const r={...s,preset:t,params:{}},i=E[t];for(const d of["loop","alternate","duration","delay","ease"])y(t,d,(o=i==null?void 0:i.properties)==null?void 0:o[d])&&delete r[d];a[e]=r,this._workingAnimations=a,this._fireChange()}_updateParam(e,t,a){var i,o,d;if(["loop","alternate","duration","delay","ease"].includes(t)){const n=(i=this.animations[e])==null?void 0:i.preset,c=(d=(o=E[n])==null?void 0:o.properties)==null?void 0:d[t];if(!y(n,t,c))return this._updateAnimation(e,t,a)}const r=[...this.animations];r[e]={...r[e],params:{...r[e].params,[t]:a}},this._workingAnimations=r,this._fireChange()}_toggleCustomMode(e,t){const a=[...this.animations];if(t)a[e]={trigger:a[e].trigger||"on_load",type:"custom",animejs:{targets:"#your-overlay-id",scale:[1,1.1,1],duration:1e3,loop:true}};else{const{type:s,animejs:r,...i}=a[e];a[e]={...i,preset:"pulse",duration:1e3,loop:true,params:{}}}this._workingAnimations=a,this._fireChange()}_updateCustomConfig(e,t){const a=[...this.animations];a[e]={...a[e],animejs:t},this._workingAnimations=a,this._fireChange()}_fireChange(){this.dispatchEvent(new CustomEvent("animations-changed",{detail:{value:this.animations},bubbles:true,composed:true}))}_renderTargetSelector(e,t){const a=e.targets?"multiple":"single",s=!!(e.target||(Array.isArray(e.targets)?e.targets.length>0:e.targets)),r=s?e.targets?Array.isArray(e.targets)?e.targets.join(", "):e.targets:e.target:"Default (this element)";return l`
      <lcards-form-section
        header="Target"
        icon="mdi:crosshairs-gps"
        description="Select which element(s) to animate"
        secondary=${r}
        ?expanded=${s}>

        <lcards-message
            type="info"
            message="If the element list below looks empty or incomplete, click Refresh; the live preview reloads periodically and this list can go stale.">
        </lcards-message>
        <ha-button
            outlined
            @click=${()=>{this.dispatchEvent(new CustomEvent("refresh-targets",{bubbles:true,composed:true}))}}>
          <ha-icon icon="mdi:refresh" slot="icon"></ha-icon>
          Refresh Element List
        </ha-button>

        <div class="mode-selector">
          <ha-radio-group
            .value=${a}
            @change=${i=>this._setTargetMode(t,i.target.value)}>
            <ha-radio-option value="single">Single Element</ha-radio-option>
            <ha-radio-option value="multiple">Multiple Elements</ha-radio-option>
          </ha-radio-group>
        </div>

        ${a==="single"?this._renderSingleTarget(e,t):this._renderMultipleTargets(e,t)}
      </lcards-form-section>
    `}_renderSingleTarget(e,t){const a=this._getTargetOptions(),s=e.target||null;return l`
      <ha-selector
        .hass=${this.hass}
        .selector=${{select:{mode:"dropdown",custom_value:true,options:[{value:"_default",label:"Card (Default)"},...a]}}}
        .value=${s===null?"_default":s}
        .label=${"Target Element"}
        @value-changed=${r=>this._updateTarget(t,r.detail.value)}
      ></ha-selector>

      <div class="help-text">
        ${s&&s!=="_default"?this._renderValidation(s):l`<span>Leave empty to use card's default animation target</span>`}
      </div>
    `}_renderMultipleTargets(e,t){const a=this._getTargetOptions(),s=e.targets||[];return l`
      <div class="target-list">
        ${s.map((r,i)=>l`
          <div class="target-item">
            <ha-selector
              .hass=${this.hass}
              .selector=${{select:{mode:"dropdown",custom_value:true,options:a}}}
              .value=${r}
              .label=${`Target ${i+1}`}
              @value-changed=${o=>this._updateTargetItem(t,i,o.detail.value)}
            ></ha-selector>

            <ha-icon-button
              .label=${"Remove target"}
              @click=${()=>this._removeTarget(t,i)}
            >
              <ha-icon icon="mdi:close"></ha-icon>
            </ha-icon-button>
          </div>
        `)}

        <ha-button
          outlined
          @click=${()=>this._addTarget(t)}
        >
          <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
          Add Target
        </ha-button>

        ${s.length>0?this._renderMultiTargetValidation(s):""}
      </div>
    `}_getTargetOptions(){const e=[];if(!this.cardElement)return $.warn("[AnimationEditor] No card element provided for target discovery"),e;const t=this.cardElement.shadowRoot||this.cardElement.renderRoot;if(!t)return $.warn("[AnimationEditor] Card element has no shadow/render root:",{element:this.cardElement.tagName,hasShadowRoot:!!this.cardElement.shadowRoot,hasRenderRoot:!!this.cardElement.renderRoot}),e;let a=t;if(this.searchRootSelector){const r=t.querySelector(this.searchRootSelector);r?(a=r,this._targetRediscoveryAttempts=0):($.warn("[AnimationEditor] searchRootSelector not found, falling back to whole-card discovery:",{searchRootSelector:this.searchRootSelector}),this._requestTargetRediscovery())}try{a.querySelectorAll("[id], [data-button-id], [data-overlay-id], [data-segment-id], [data-lcards-segment]").forEach(p=>{const u=p.id||p.getAttribute("data-button-id")||p.getAttribute("data-overlay-id")||p.getAttribute("data-segment-id")||p.getAttribute("data-lcards-segment"),m=p.tagName.toLowerCase();let v="";p.classList&&p.classList.length>0&&(v="."+Array.from(p.classList).join(".")),!(u&&(u.startsWith("_")||u.startsWith("ha-")))&&u&&e.push({value:`#${u}`,label:`#${u} <${m}>${v||""}`})});const i=a.querySelectorAll("[data-field-id]"),o=new Set;i.forEach(p=>{const u=p.getAttribute("data-field-id");if(!u||o.has(u))return;o.add(u);const m=p.tagName.toLowerCase(),b=u.endsWith("-bg")?"text-bg":"text";e.push({value:`[data-field-id="${u}"]`,label:`[${b}] ${u} <${m}>`})});const d=a.querySelectorAll("[class]"),n=new Set;d.forEach(p=>{Array.from(p.classList).forEach(m=>{if(m&&!n.has(m)&&!m.startsWith("_")&&!m.match(/^(ha-|mdc-|button-svg)/)){n.add(m);const v=p.tagName.toLowerCase();e.push({value:`.${m}`,label:`.${m} <${v}>`})}})});const c=new Set(["svg","defs","style","script","title","desc","metadata","symbol"]),g=new Map;a.querySelectorAll("*").forEach(p=>{const u=p.tagName.toLowerCase();c.has(u)||g.set(u,(g.get(u)||0)+1)}),g.forEach((p,u)=>{e.push({value:u,label:`All <${u}> elements (${p} found)`,isTagOption:true})});const S={line:"Lines",shape:"Shapes",control:"Controls"},k={line:'path[data-animatable="true"]',shape:'[data-animatable="true"]'},_=new Map;a.querySelectorAll("[data-overlay-type]").forEach(p=>{const u=p.getAttribute("data-overlay-type");if(!u)return;_.has(u)||_.set(u,new Set);const m=p.getAttribute("data-overlay-id");m&&_.get(u).add(m)}),_.forEach((p,u)=>{if(p.size===0)return;const m=S[u]||u,v=k[u],b=v?`[data-overlay-type="${u}"] ${v}`:`[data-overlay-type="${u}"]`;e.push({value:b,label:`All ${m} overlays (${p.size} found)`,bulkRank:0})});const x=new Map;a.querySelectorAll("[data-overlay-id]").forEach(p=>{const u=p.getAttribute("data-overlay-id");if(!u)return;const m=u.indexOf("_");if(m<=0)return;const v=u.slice(0,m);x.has(v)||x.set(v,{ids:new Set,types:new Set});const b=x.get(v);b.ids.add(u);const w=p.getAttribute("data-overlay-type");w&&b.types.add(w)}),x.forEach(({ids:p,types:u},m)=>{if(p.size<2)return;const v=u.size===1?[...u][0]:null,b=v?k[v]:null,w=b?`[data-overlay-id^="${m}_"] ${b}`:`[data-overlay-id^="${m}_"]`;e.push({value:w,label:`All "${m}_*" overlays (${p.size} found)`,bulkRank:1})}),$.debug("[AnimationEditor] Discovered targets:",{count:e.length})}catch(r){$.error("[AnimationEditor] Error discovering targets:",r)}const s=C(r=>r.bulkRank??(r.isTagOption?2:3),"bulkRankOf");return e.sort((r,i)=>{const o=s(r)-s(i);return o!==0?o:r.label.localeCompare(i.label)}),e}_requestTargetRediscovery(){this._targetRediscoveryTimer||this._targetRediscoveryAttempts>=10||(this._targetRediscoveryAttempts++,this._targetRediscoveryTimer=setTimeout(()=>{this._targetRediscoveryTimer=null,this.dispatchEvent(new CustomEvent("refresh-targets",{bubbles:true,composed:true})),this.requestUpdate()},250))}_setTargetMode(e,t){var r;const a=[...this.animations],s={...a[e]};if(a[e]=s,t==="single"){const i=((r=s.targets)==null?void 0:r[0])||"";s.target=i,delete s.targets}else{const i=s.target||"";s.targets=i?[i]:[],delete s.target}this._workingAnimations=a,this._fireChange()}_updateTarget(e,t){const a=[...this.animations],s={...a[e]};a[e]=s,t===""||t===null||t==="_default"?delete s.target:s.target=t,delete s.targets,this._workingAnimations=a,this._fireChange()}_addTarget(e){const t=[...this.animations],a={...t[e]};a.targets=a.targets?[...a.targets]:[],t[e]=a,a.targets.push(""),this._workingAnimations=t,this._fireChange()}_updateTargetItem(e,t,a){const s=[...this.animations],r={...s[e]};r.targets=r.targets?[...r.targets]:[],s[e]=r,r.targets[t]=a,this._workingAnimations=s,this._fireChange()}_removeTarget(e,t){const a=[...this.animations],s={...a[e]};a[e]=s,s.targets&&(s.targets=[...s.targets],s.targets.splice(t,1),s.targets.length===0&&delete s.targets),this._workingAnimations=a,this._fireChange()}_validateSelector(e){var a,s;if(!e)return{valid:true,count:0,message:"",type:null};if(!((a=this.cardElement)!=null&&a.shadowRoot)&&!((s=this.cardElement)!=null&&s.renderRoot))return{valid:false,count:0,message:"Cannot validate: card preview not available",type:"warning"};const t=this.cardElement.shadowRoot||this.cardElement.renderRoot;try{const i=t.querySelectorAll(e).length;return i===0?{valid:true,count:0,message:"No elements match this selector",type:"warning"}:{valid:true,count:i,message:`${i} element${i===1?"":"s"} matched`,type:"success"}}catch(r){return{valid:false,count:0,message:`Invalid selector: ${r.message}`,type:"error"}}}_renderValidation(e){const t=this._validateSelector(e);return t.type?l`
      <lcards-message type=${t.type} .message=${t.message}></lcards-message>
    `:l``}_renderMultiTargetValidation(e){let t=0,a=false;return e.forEach(s=>{const r=this._validateSelector(s);r.valid||(a=true),t+=r.count}),a?l`<lcards-message type="error" message="Some selectors are invalid"></lcards-message>`:t===0?l`<lcards-message type="warning" message="No elements match any selector"></lcards-message>`:l`<lcards-message type="success" message="${t} total element${t===1?"":"s"} matched"></lcards-message>`}};C(M,"LCARdSAnimationEditor");let D=M;customElements.get("lcards-animation-editor")||customElements.define("lcards-animation-editor",D);const te={blur:{description:"Applies Gaussian blur to soften edges and create depth effects.",params:[{key:"value",default:"0px",description:"CSS length: e.g. 2px, 5px, 10px."}],example:`filters:
  - { mode: css, type: blur, value: '3px' }`},brightness:{description:"Adjusts the brightness level. 1 = normal, less than 1 = darker, greater than 1 = brighter.",params:[{key:"value",default:1,description:"0 = black, 1 = normal, 2+ = brighter."}],example:`filters:
  - { mode: css, type: brightness, value: 1.2 }`},contrast:{description:"Adjusts the contrast. 1 = normal, less than 1 = less contrast, greater than 1 = more contrast.",params:[{key:"value",default:1,description:"0 = gray, 1 = normal, 2+ = higher contrast."}],example:`filters:
  - { mode: css, type: contrast, value: 1.3 }`},saturate:{description:"Adjusts color saturation. 0 = grayscale, 1 = normal, greater than 1 = oversaturated.",params:[{key:"value",default:1,description:"0 = grayscale, 1 = normal, 2+ = oversaturated."}],example:`filters:
  - { mode: css, type: saturate, value: 0.8 }`},"hue-rotate":{description:"Rotates colors around the color wheel (0-360 degrees).",params:[{key:"value",default:"0deg",description:"Angle to rotate hue by."}],example:`filters:
  - { mode: css, type: hue-rotate, value: '90deg' }`},grayscale:{description:"Converts to grayscale. 0 = full color, 1 = complete grayscale.",params:[{key:"value",default:0,description:"0 = color, 1 = fully grayscale."}],example:`filters:
  - { mode: css, type: grayscale, value: 0.5 }`},sepia:{description:"Applies sepia tone effect. 0 = normal, 1 = full sepia (vintage look).",params:[{key:"value",default:0,description:"0 = normal, 1 = full sepia tone."}],example:`filters:
  - { mode: css, type: sepia, value: 0.3 }`},invert:{description:"Inverts colors. 0 = normal, 1 = fully inverted (negative).",params:[{key:"value",default:0,description:"0 = normal, 1 = fully inverted."}],example:`filters:
  - { mode: css, type: invert, value: 0.2 }`},opacity:{description:"Adjusts transparency. 0 = fully transparent, 1 = fully opaque.",params:[{key:"value",default:1,description:"0 = transparent, 1 = fully opaque."}],example:`filters:
  - { mode: css, type: opacity, value: 0.5 }`},"drop-shadow":{description:"Creates a drop shadow behind the element.",params:[{key:"x",default:0,description:"Horizontal offset in px."},{key:"y",default:0,description:"Vertical offset in px."},{key:"blur",default:"0px",description:"Shadow blur radius (CSS length)."},{key:"color",default:"#000000",description:"Shadow color."}],example:`filters:
  - { mode: css, type: drop-shadow, value: { x: 2, y: 2, blur: '4px', color: '#000000' } }`},feGaussianBlur:{description:"SVG blur filter: smoother than CSS blur, chains with other SVG filters.",params:[{key:"stdDeviation",default:0,description:"Amount of blur: 0 = none, higher = more blur."}],example:`filters:
  - { mode: svg, type: feGaussianBlur, value: { stdDeviation: 4 } }`},feColorMatrix:{description:"Powerful color transformation using matrix operations. Supports hue rotation, saturation, luminance-to-alpha, and custom 4x5 color mapping matrices.",params:[{key:"type",default:"saturate",description:"'matrix' | 'saturate' | 'hueRotate' | 'luminanceToAlpha'."},{key:"values",description:"Meaning depends on type: a saturation multiplier, a hue-rotate angle, or 20 space-separated matrix numbers."}],example:`filters:
  - { mode: svg, type: feColorMatrix, value: { type: saturate, values: 1.5 } }`},feOffset:{description:"Shifts the filter result by dx/dy pixels. Essential for creating shadow effects when combined with blur.",params:[{key:"dx",default:0,description:"Horizontal offset: positive = right, negative = left."},{key:"dy",default:0,description:"Vertical offset: positive = down, negative = up."}],example:`filters:
  - { mode: svg, type: feOffset, value: { dx: 3, dy: 3 } }`},feBlend:{description:"Blends the current filter result with another input (defaults to SourceGraphic) using any of the 16 standard CSS blend modes (multiply, screen, overlay, etc.).",params:[{key:"mode",default:"normal",description:"Blend mode: try screen/lighten after a blur for glow effects."}],example:`filters:
  - { mode: svg, type: feBlend, value: { mode: screen } }`},feComposite:{description:"Combines two inputs (the previous filter result and SourceGraphic by default) using Porter-Duff compositing operators, or a custom arithmetic formula.",params:[{key:"operator",default:"over",description:"'over' | 'in' | 'out' | 'atop' | 'xor' | 'arithmetic'."},{key:"k1",default:0,description:"Arithmetic coefficient (only used when operator is arithmetic)."},{key:"k2",default:0,description:"Arithmetic coefficient."},{key:"k3",default:0,description:"Arithmetic coefficient."},{key:"k4",default:0,description:"Arithmetic coefficient: result = k1·i1·i2 + k2·i1 + k3·i2 + k4."}],example:`filters:
  - { mode: svg, type: feComposite, value: { operator: over } }`},feMorphology:{description:"Erodes (thins) or dilates (fattens) shapes. Useful for creating outline effects or adjusting edge thickness.",params:[{key:"operator",default:"erode",description:"'erode' (thins shapes) | 'dilate' (fattens shapes)."},{key:"radius",default:1,description:"How far to erode/dilate, in filter units."}],example:`filters:
  - { mode: svg, type: feMorphology, value: { operator: dilate, radius: 2 } }`},feTurbulence:{description:"Generates Perlin noise patterns for organic textures. Commonly used with feDisplacementMap for distortion/warping effects.",params:[{key:"type",default:"turbulence",description:"'turbulence' (cloudy) | 'fractalNoise' (softer)."},{key:"baseFrequency",default:.05,description:"Noise detail: lower = larger features."},{key:"numOctaves",default:1,description:"Layers of noise detail."},{key:"seed",default:0,description:"Randomization seed: change for a different pattern."}],example:`filters:
  - { mode: svg, type: feTurbulence, value: { baseFrequency: 0.02, numOctaves: 3 } }`},feDisplacementMap:{description:"Warps/distorts the image based on color values from another source. Perfect for wavy, liquid, or turbulent effects.",params:[{key:"scale",default:10,description:"Displacement strength: higher = more distortion."},{key:"xChannelSelector",default:"R",description:"Color channel driving horizontal displacement: 'R' | 'G' | 'B' | 'A'."},{key:"yChannelSelector",default:"G",description:"Color channel driving vertical displacement: 'R' | 'G' | 'B' | 'A'."}],example:`filters:
  - { mode: svg, type: feTurbulence, value: { baseFrequency: 0.02, numOctaves: 3 } }
  - { mode: svg, type: feDisplacementMap, value: { scale: 20 } }`,tip:"Add a Turbulence filter right before this one: Turbulence generates the displacement map this filter distorts by."},tint:{description:"Composites a flat color wash over the content: a cheap way to apply an alert/status tint. Requires an SVG root (not supported on data-grid).",params:[{key:"color",default:"rgba(0,0,0,0.4)",description:"Tint color: the alpha channel controls how much content shows through."}],example:`filters:
  - { mode: svg, type: tint, value: { color: 'rgba(180,0,0,0.35)' } }`}},N=class N2 extends L{static get properties(){return{hass:{type:Object},filters:{type:Array},_expandedFilters:{type:Object}}}constructor(){super(),this.hass=void 0,this.filters=[],this._expandedFilters={},this._draggedIndex=null,$.debug("[FilterEditor] Initialized")}static get styles(){return[G`
            :host {
                display: block;
            }

            .filter-editor {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .add-button {
                width: 100%;
            }

            .filter-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .filter-item {
                background: var(--card-background-color);
                border: var(--ha-border-width-sm) solid var(--divider-color);
                border-radius: var(--ha-card-border-radius, 12px);
                overflow: hidden;
            }

            .filter-header {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                cursor: pointer;
                user-select: none;
                background: var(--secondary-background-color);
            }

            .filter-header:hover {
                background: var(--primary-background-color);
            }

            .drag-handle {
                cursor: grab;
                color: var(--secondary-text-color);
                padding: 4px;
                margin-left: -4px;
            }

            .drag-handle:hover {
                color: var(--primary-text-color);
            }

            .drag-handle:active {
                cursor: grabbing;
            }

            .filter-item.dragging {
                opacity: 0.5;
            }

            .filter-item.drag-over {
                border-top: 3px solid var(--primary-color);
            }

            .filter-icon {
                color: var(--primary-color);
                --mdc-icon-size: 24px;
            }

            .filter-info {
                flex: 1;
                min-width: 0;
            }

            .filter-type-row {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 4px;
            }

            .filter-type {
                font-weight: 600;
                font-size: 18px;
            }

            .filter-value {
                font-size: 12px;
                color: var(--secondary-text-color);
                font-family: monospace;
            }

            .filter-actions {
                display: flex;
                gap: 4px;
            }

            .expand-icon {
                transition: transform 0.2s;
            }

            .expand-icon.expanded {
                transform: rotate(180deg);
            }

            .filter-content {
                padding: 16px;
                border-top: var(--ha-border-width-sm) solid var(--divider-color);
            }

            .param-grid {
                display: grid;
                gap: 16px;
            }

            .param-grid.two-col {
                grid-template-columns: 1fr 1fr;
            }

            .param-grid.three-col {
                grid-template-columns: 1fr 1fr 1fr;
            }

            .empty-state {
                text-align: center;
                padding: 32px 16px;
                color: var(--secondary-text-color);
            }

            .empty-state ha-icon {
                font-size: 48px;
                opacity: 0.3;
                margin-bottom: 12px;
            }

            .filter-chain-info {
                background: var(--primary-background-color);
                border: var(--ha-border-width-sm) solid var(--divider-color);
                border-radius: var(--ha-card-border-radius, 12px);
                padding: 12px;
                margin-bottom: 12px;
                font-size: 13px;
            }

            .filter-chain-info strong {
                color: var(--primary-color);
            }
        `,V,z]}render(){var a,s;const e=((a=this.filters)==null?void 0:a.length)||0,t=(s=this.filters)==null?void 0:s.some(r=>r.mode==="svg");return l`
            <div class="filter-editor">
                <!-- Add Filter Button -->
                <ha-button
                    class="add-button"
                    @click=${this._addFilter}>
                    <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                    Add Filter
                </ha-button>

                <!-- Filter Chain Info -->
                ${t?this._renderFilterChainInfo():""}

                <!-- Filter List -->
                ${e===0?this._renderEmptyState():l`
                    <div class="filter-list">
                        ${this.filters.map((r,i)=>this._renderFilterItem(r,i))}
                    </div>
                `}
            </div>
        `}_renderFilterChainInfo(){return l`
            <div class="filter-chain-info">
                <ha-icon icon="mdi:information" style="float: left; margin-right: 8px;"></ha-icon>
                <strong>SVG Filters Auto-Chain:</strong> Each filter processes the output of the previous one.
                <strong>Order matters!</strong> Drag filters to reorder.
                <br><br>
                <strong>Common Patterns:</strong>
                <ul style="margin: 8px 0 0 0; padding-left: 24px;">
                    <li><strong>Glow:</strong> Blur → Blend (screen/lighten)</li>
                    <li><strong>Distortion:</strong> Turbulence → Displacement Map</li>
                    <li><strong>Drop Shadow:</strong> Offset → Blur → Blend</li>
                    <li><strong>Color Effects:</strong> Color Matrix (stack multiple)</li>
                </ul>
            </div>
        `}_renderEmptyState(){return l`
            <div class="empty-state">
                <ha-icon icon="mdi:blur"></ha-icon>
                <div style="font-weight: 500; margin-bottom: 8px;">No filters configured</div>
                <div style="font-size: 13px;">
                    Click "Add Filter" to apply visual effects like blur, brightness, saturation, etc.
                </div>
            </div>
        `}_renderFilterItem(e,t){const a=this._expandedFilters[t]||false,s=e.mode||"css",r=e.type||"blur",i=this._getFilterValueDisplay(e),o=this._draggedIndex===t;return l`
            <div
                class="filter-item ${o?"dragging":""}"
                @dragover=${d=>this._handleDragOver(d,t)}
                @drop=${d=>this._handleDrop(d,t)}>
                <!-- Filter Header -->
                <div
                    class="filter-header"
                    draggable="true"
                    @dragstart=${d=>this._handleDragStart(d,t)}
                    @dragend=${d=>this._handleDragEnd(d)}
                    @click=${()=>this._toggleExpanded(t)}>
                    <!-- Drag Handle -->
                    <ha-icon
                        class="drag-handle"
                        icon="mdi:drag"
                        @click=${d=>d.stopPropagation()}>
                    </ha-icon>

                    <ha-icon
                        class="filter-icon"
                        icon=${this._getFilterIcon(r)}>
                    </ha-icon>

                    <div class="filter-info">
                        <div class="filter-type-row">
                            <span class="filter-type">${this._getFilterDisplayName(r)}</span>
                            <ha-button
                                size="s"
                                appearance="filled"
                                variant="success"
                                .label=${s.toUpperCase()}
                                ?disabled=${false}>
                                ${s.toUpperCase()}
                            </ha-button>
                        </div>
                        <div class="filter-value">${i}</div>
                    </div>

                    <div class="filter-actions">
                        <ha-icon-button
                            @click=${d=>this._duplicateFilter(t,d)}
                            .label=${"Duplicate"}
                            .path=${"M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"}>
                        </ha-icon-button>
                        <ha-icon-button
                            @click=${d=>this._deleteFilter(t,d)}
                            .label=${"Delete"}
                            .path=${"M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"}>
                        </ha-icon-button>
                    </div>

                    <ha-icon
                        class="expand-icon ${a?"expanded":""}"
                        icon="mdi:chevron-down">
                    </ha-icon>
                </div>

                <!-- Filter Content (Expanded) -->
                ${a?l`
                    <div class="filter-content">
                        ${this._renderFilterForm(e,t)}
                    </div>
                `:""}
            </div>
        `}_renderFilterForm(e,t){e.mode;const a=e.type||"blur";return l`
            <lcards-form-section
                header="Filter Type"
                headerLevel="4"
                ?expanded=${true}>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{select:{mode:"dropdown",custom_value:true,options:this._getFilterTypeOptions()}}}
                    .value=${a}
                    .label=${"Filter Effect"}
                    @value-changed=${s=>this._updateFilter(t,"type",s.detail.value)}>
                </ha-selector>
            </lcards-form-section>

            ${this._renderFilterInfoGuide(a,t)}

            ${this._renderFilterParameters(e,t)}
        `}_renderFilterInfoGuide(e,t){var r;const a=te[e];if(!a)return"";const s=`${K}#${e.toLowerCase()}`;return l`
            ${H({header:`How ${this._getFilterDisplayName(e)} works`,icon:"mdi:information-outline",body:l`
                        ${this._splitIntoSentences(a.description).map(i=>l`<p>${i}</p>`)}
                        ${(r=a.params)!=null&&r.length?l`
                            <strong>Params:</strong>
                            <ul>
                                ${a.params.map(i=>l`
                                    <li>
                                        <code>${i.key}</code>${i.default!==void 0?l` (default: <code>${JSON.stringify(i.default)}</code>)`:""}
                                        ${i.description?`: ${i.description}`:""}
                                    </li>
                                `)}
                            </ul>
                        `:""}
                        <strong>Example:</strong>
                        <pre class="info-guide-example">${a.example}</pre>
                        ${a.tip?l`
                            <p class="info-guide-tip"><strong>Tip:</strong> ${a.tip}</p>
                        `:""}
                        <div class="info-guide-links">
                            <a href=${s} target="_blank" rel="noopener noreferrer">View full docs →</a>
                        </div>
                    `})}
        `}_splitIntoSentences(e){return e?e.split(new RegExp("(?<=[.!?])\\s+(?=[A-Z`])")):[]}_renderFilterParameters(e,t){const a=e.type||"blur";return l`
            <lcards-form-section
                header="Parameters"
                headerLevel="4"
                ?expanded=${true}>
                ${this._renderParametersForType(e,t,a)}
            </lcards-form-section>
        `}_renderParametersForType(e,t,a){switch(a){case"blur":return this._renderBlurParams(e,t);case"brightness":return this._renderBrightnessParams(e,t);case"contrast":return this._renderContrastParams(e,t);case"saturate":return this._renderSaturateParams(e,t);case"hue-rotate":return this._renderHueRotateParams(e,t);case"grayscale":return this._renderGrayscaleParams(e,t);case"sepia":return this._renderSepiaParams(e,t);case"invert":return this._renderInvertParams(e,t);case"opacity":return this._renderOpacityParams(e,t);case"drop-shadow":return this._renderDropShadowParams(e,t);case"tint":return this._renderTintParams(e,t);case"feGaussianBlur":return this._renderFeGaussianBlurParams(e,t);case"feColorMatrix":return this._renderFeColorMatrixParams(e,t);case"feOffset":return this._renderFeOffsetParams(e,t);case"feBlend":return this._renderFeBlendParams(e,t);case"feComposite":return this._renderFeCompositeParams(e,t);case"feMorphology":return this._renderFeMorphologyParams(e,t);case"feTurbulence":return this._renderFeTurbulenceParams(e,t);case"feDisplacementMap":return this._renderFeDisplacementMapParams(e,t);default:return l`<div style="color: var(--error-color);">Unknown filter type: ${a}</div>`}}_renderBlurParams(e,t){return l`
            <ha-input
                type="text"
                label="Blur Radius"
                .value=${e.value||"0px"}
                @input=${a=>this._updateFilter(t,"value",a.target.value)}
                hint="e.g., 0px, 2px, 5px, 10px">
            </ha-input>
        `}_renderBrightnessParams(e,t){return l`
            <ha-selector
                .hass=${this.hass}
                .selector=${{number:{min:0,max:3,step:.1,mode:"slider"}}}
                .value=${e.value??1}
                .label=${"Brightness"}
                @value-changed=${a=>this._updateFilter(t,"value",a.detail.value)}>
            </ha-selector>
        `}_renderContrastParams(e,t){return l`
            <ha-selector
                .hass=${this.hass}
                .selector=${{number:{min:0,max:3,step:.1,mode:"slider"}}}
                .value=${e.value??1}
                .label=${"Contrast"}
                @value-changed=${a=>this._updateFilter(t,"value",a.detail.value)}>
            </ha-selector>
        `}_renderSaturateParams(e,t){return l`
            <ha-selector
                .hass=${this.hass}
                .selector=${{number:{min:0,max:3,step:.1,mode:"slider"}}}
                .value=${e.value??1}
                .label=${"Saturation"}
                @value-changed=${a=>this._updateFilter(t,"value",a.detail.value)}>
            </ha-selector>
        `}_renderHueRotateParams(e,t){return l`
            <ha-selector
                .hass=${this.hass}
                .selector=${{number:{min:0,max:360,step:1,mode:"slider"}}}
                .value=${typeof e.value=="string"?parseInt(e.value):e.value??0}
                .label=${"Hue Rotation (degrees)"}
                @value-changed=${a=>this._updateFilter(t,"value",`${a.detail.value}deg`)}>
            </ha-selector>
        `}_renderGrayscaleParams(e,t){return l`
            <ha-selector
                .hass=${this.hass}
                .selector=${{number:{min:0,max:1,step:.1,mode:"slider"}}}
                .value=${e.value??0}
                .label=${"Grayscale Amount"}
                @value-changed=${a=>this._updateFilter(t,"value",a.detail.value)}>
            </ha-selector>
        `}_renderSepiaParams(e,t){return l`
            <ha-selector
                .hass=${this.hass}
                .selector=${{number:{min:0,max:1,step:.1,mode:"slider"}}}
                .value=${e.value??0}
                .label=${"Sepia Amount"}
                @value-changed=${a=>this._updateFilter(t,"value",a.detail.value)}>
            </ha-selector>
        `}_renderInvertParams(e,t){return l`
            <ha-selector
                .hass=${this.hass}
                .selector=${{number:{min:0,max:1,step:.1,mode:"slider"}}}
                .value=${e.value??0}
                .label=${"Invert Amount"}
                @value-changed=${a=>this._updateFilter(t,"value",a.detail.value)}>
            </ha-selector>
        `}_renderOpacityParams(e,t){return l`
            <ha-selector
                .hass=${this.hass}
                .selector=${{number:{min:0,max:1,step:.1,mode:"slider"}}}
                .value=${e.value??1}
                .label=${"Opacity"}
                @value-changed=${a=>this._updateFilter(t,"value",a.detail.value)}>
            </ha-selector>
        `}_renderDropShadowParams(e,t){const a=e.value||{x:0,y:0,blur:0,color:"#000000"};return l`
            <div class="param-grid two-col">
                <ha-input
                    type="number"
                    label="X Offset (px)"
                    .value=${a.x??0}
                    @input=${s=>this._updateDropShadowParam(t,"x",s.target.value)}>
                </ha-input>
                <ha-input
                    type="number"
                    label="Y Offset (px)"
                    .value=${a.y??0}
                    @input=${s=>this._updateDropShadowParam(t,"y",s.target.value)}>
                </ha-input>
            </div>
            <ha-input
                type="text"
                label="Blur Radius"
                .value=${a.blur||"0px"}
                @input=${s=>this._updateDropShadowParam(t,"blur",s.target.value)}
                hint="e.g., 0px, 2px, 5px">
            </ha-input>
            <lcards-color-picker
                .hass=${this.hass}
                .value=${a.color||"#000000"}
                .label=${"Shadow Color"}
                @value-changed=${s=>this._updateDropShadowParam(t,"color",s.detail.value)}>
            </lcards-color-picker>
        `}_updateDropShadowParam(e,t,a){const s={...this.filters[e]},r={...s.value||{}};r[t]=a,s.value=r;const i=[...this.filters];i[e]=s,this._emitChange(i)}_renderTintParams(e,t){const a=e.value||{color:"rgba(0,0,0,0.4)"};return l`
            <lcards-color-picker
                .hass=${this.hass}
                .value=${a.color||"rgba(0,0,0,0.4)"}
                .label=${"Tint Color"}
                @value-changed=${s=>this._updateTintParam(t,"color",s.detail.value)}>
            </lcards-color-picker>
        `}_updateTintParam(e,t,a){const s={...this.filters[e]},r={...s.value||{}};r[t]=a,s.value=r;const i=[...this.filters];i[e]=s,this._emitChange(i)}_renderFeGaussianBlurParams(e,t){const a=e.value||{stdDeviation:0};return l`
            <ha-selector
                .hass=${this.hass}
                .selector=${{number:{min:0,max:50,step:.5,mode:"slider"}}}
                .value=${a.stdDeviation??0}
                .label=${"Standard Deviation"}
                @value-changed=${s=>this._updateSvgFilterParam(t,"stdDeviation",s.detail.value)}>
            </ha-selector>
        `}_renderFeColorMatrixParams(e,t){const a=e.value||{type:"saturate",values:1};return l`
            <ha-selector
                .hass=${this.hass}
                .selector=${{select:{options:[{value:"matrix",label:"Matrix (4x5)"},{value:"saturate",label:"Saturate"},{value:"hueRotate",label:"Hue Rotate"},{value:"luminanceToAlpha",label:"Luminance to Alpha"}]}}}
                .value=${a.type||"saturate"}
                .label=${"Matrix Type"}
                @value-changed=${s=>this._updateSvgFilterParam(t,"type",s.detail.value)}>
            </ha-selector>

            ${a.type==="saturate"?l`
                <ha-selector
                    .hass=${this.hass}
                    .selector=${{number:{min:0,max:3,step:.1,mode:"slider"}}}
                    .value=${a.values??1}
                    .label=${"Saturation"}
                    @value-changed=${s=>this._updateSvgFilterParam(t,"values",s.detail.value)}
                    style="margin-top: 12px;">
                </ha-selector>
            `:""}

            ${a.type==="hueRotate"?l`
                <ha-selector
                    .hass=${this.hass}
                    .selector=${{number:{min:0,max:360,step:1,mode:"slider"}}}
                    .value=${a.values??0}
                    .label=${"Hue Rotation (degrees)"}
                    @value-changed=${s=>this._updateSvgFilterParam(t,"values",s.detail.value)}
                    style="margin-top: 12px;">
                </ha-selector>
            `:""}

            ${a.type==="matrix"?l`
                <ha-input
                    type="text"
                    label="Matrix Values (4x5 = 20 numbers)"
                    .value=${Array.isArray(a.values)?a.values.join(" "):a.values||""}
                    @input=${s=>this._updateSvgFilterParam(t,"values",s.target.value)}
                    hint="Space-separated numbers (e.g., 1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0)"
                    style="margin-top: 12px;">
                </ha-input>
            `:""}
        `}_renderFeOffsetParams(e,t){const a=e.value||{dx:0,dy:0};return l`
            <div class="param-grid two-col">
                <ha-input
                    type="number"
                    label="dx (horizontal offset)"
                    .value=${a.dx??0}
                    step="1"
                    @input=${s=>this._updateSvgFilterParam(t,"dx",s.target.value)}>
                </ha-input>
                <ha-input
                    type="number"
                    label="dy (vertical offset)"
                    .value=${a.dy??0}
                    step="1"
                    @input=${s=>this._updateSvgFilterParam(t,"dy",s.target.value)}>
                </ha-input>
            </div>
        `}_renderFeBlendParams(e,t){const a=e.value||{mode:"normal"};return l`
            <ha-selector
                .hass=${this.hass}
                .selector=${{select:{options:[{value:"normal",label:"Normal"},{value:"multiply",label:"Multiply"},{value:"screen",label:"Screen"},{value:"darken",label:"Darken"},{value:"lighten",label:"Lighten"},{value:"overlay",label:"Overlay"},{value:"color-dodge",label:"Color Dodge"},{value:"color-burn",label:"Color Burn"},{value:"hard-light",label:"Hard Light"},{value:"soft-light",label:"Soft Light"},{value:"difference",label:"Difference"},{value:"exclusion",label:"Exclusion"},{value:"hue",label:"Hue"},{value:"saturation",label:"Saturation"},{value:"color",label:"Color"},{value:"luminosity",label:"Luminosity"}]}}}
                .value=${a.mode||"normal"}
                .label=${"Blend Mode"}
                @value-changed=${s=>this._updateSvgFilterParam(t,"mode",s.detail.value)}>
            </ha-selector>
        `}_renderFeCompositeParams(e,t){const a=e.value||{operator:"over"};return l`
            <ha-selector
                .hass=${this.hass}
                .selector=${{select:{options:[{value:"over",label:"Over"},{value:"in",label:"In"},{value:"out",label:"Out"},{value:"atop",label:"Atop"},{value:"xor",label:"XOR"},{value:"arithmetic",label:"Arithmetic"}]}}}
                .value=${a.operator||"over"}
                .label=${"Composite Operator"}
                @value-changed=${s=>this._updateSvgFilterParam(t,"operator",s.detail.value)}>
            </ha-selector>

            ${a.operator==="arithmetic"?l`
                <div style="margin-top: 16px; padding: 12px; background: var(--card-background-color); border: var(--ha-border-width-sm) solid var(--divider-color); border-radius: 4px;">
                    <div style="font-weight: 500; margin-bottom: 12px;">Arithmetic Coefficients</div>
                    <div style="font-size: 12px; color: var(--secondary-text-color); margin-bottom: 12px;">
                        result = k1*i1*i2 + k2*i1 + k3*i2 + k4
                    </div>
                    <div class="param-grid">
                        <ha-input type="number" label="k1" .value=${a.k1??0} step="0.1" @input=${s=>this._updateSvgFilterParam(t,"k1",s.target.value)}></ha-input>
                        <ha-input type="number" label="k2" .value=${a.k2??0} step="0.1" @input=${s=>this._updateSvgFilterParam(t,"k2",s.target.value)}></ha-input>
                        <ha-input type="number" label="k3" .value=${a.k3??0} step="0.1" @input=${s=>this._updateSvgFilterParam(t,"k3",s.target.value)}></ha-input>
                        <ha-input type="number" label="k4" .value=${a.k4??0} step="0.1" @input=${s=>this._updateSvgFilterParam(t,"k4",s.target.value)}></ha-input>
                    </div>
                </div>
            `:""}
        `}_renderFeMorphologyParams(e,t){const a=e.value||{operator:"erode",radius:1};return l`
            <ha-selector
                .hass=${this.hass}
                .selector=${{select:{options:[{value:"erode",label:"Erode (Thin)"},{value:"dilate",label:"Dilate (Fatten)"}]}}}
                .value=${a.operator||"erode"}
                .label=${"Operator"}
                @value-changed=${s=>this._updateSvgFilterParam(t,"operator",s.detail.value)}>
            </ha-selector>

            <ha-selector
                .hass=${this.hass}
                .selector=${{number:{min:0,max:20,step:.5,mode:"slider"}}}
                .value=${a.radius??1}
                .label=${"Radius"}
                @value-changed=${s=>this._updateSvgFilterParam(t,"radius",s.detail.value)}
                style="margin-top: 12px;">
            </ha-selector>
        `}_renderFeTurbulenceParams(e,t){const a=e.value||{type:"turbulence",baseFrequency:.05,numOctaves:1};return l`
            <ha-selector
                .hass=${this.hass}
                .selector=${{select:{options:[{value:"turbulence",label:"Turbulence (Cloudy)"},{value:"fractalNoise",label:"Fractal Noise"}]}}}
                .value=${a.type||"turbulence"}
                .label=${"Noise Type"}
                @value-changed=${s=>this._updateSvgFilterParam(t,"type",s.detail.value)}>
            </ha-selector>

            <ha-selector
                .hass=${this.hass}
                .selector=${{number:{min:0,max:1,step:.01,mode:"slider"}}}
                .value=${a.baseFrequency??.05}
                .label=${"Base Frequency"}
                @value-changed=${s=>this._updateSvgFilterParam(t,"baseFrequency",s.detail.value)}
                style="margin-top: 12px;">
            </ha-selector>

            <ha-selector
                .hass=${this.hass}
                .selector=${{number:{min:1,max:10,step:1,mode:"slider"}}}
                .value=${a.numOctaves??1}
                .label=${"Octaves (Detail Level)"}
                @value-changed=${s=>this._updateSvgFilterParam(t,"numOctaves",s.detail.value)}
                style="margin-top: 12px;">
            </ha-selector>

            <ha-input
                type="number"
                label="Seed (randomization)"
                .value=${a.seed??0}
                @input=${s=>this._updateSvgFilterParam(t,"seed",s.target.value)}
                style="margin-top: 12px;">
            </ha-input>
        `}_renderFeDisplacementMapParams(e,t){const a=e.value||{scale:10,xChannelSelector:"R",yChannelSelector:"G"};return l`
            <ha-selector
                .hass=${this.hass}
                .selector=${{number:{min:0,max:200,step:5,mode:"slider"}}}
                .value=${a.scale??10}
                .label=${"Displacement Scale"}
                @value-changed=${s=>this._updateSvgFilterParam(t,"scale",s.detail.value)}>
            </ha-selector>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
                <ha-selector
                    .hass=${this.hass}
                    .selector=${{select:{options:[{value:"R",label:"Red"},{value:"G",label:"Green"},{value:"B",label:"Blue"},{value:"A",label:"Alpha"}]}}}
                    .value=${a.xChannelSelector||"R"}
                    .label=${"X Channel"}
                    @value-changed=${s=>this._updateSvgFilterParam(t,"xChannelSelector",s.detail.value)}>
                </ha-selector>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{select:{options:[{value:"R",label:"Red"},{value:"G",label:"Green"},{value:"B",label:"Blue"},{value:"A",label:"Alpha"}]}}}
                    .value=${a.yChannelSelector||"G"}
                    .label=${"Y Channel"}
                    @value-changed=${s=>this._updateSvgFilterParam(t,"yChannelSelector",s.detail.value)}>
                </ha-selector>
            </div>
        `}_updateSvgFilterParam(e,t,a){const s={...this.filters[e]},r={...s.value||{}};s.type&&s.type.startsWith("fe")&&(s.mode="svg"),r[t]=a,s.value=r;const i=[...this.filters];i[e]=s,this._emitChange(i)}_getFilterTypeOptions(){return[{value:"blur",label:"Blur (CSS)"},{value:"brightness",label:"Brightness (CSS)"},{value:"contrast",label:"Contrast (CSS)"},{value:"saturate",label:"Saturation (CSS)"},{value:"hue-rotate",label:"Hue Rotate (CSS)"},{value:"grayscale",label:"Grayscale (CSS)"},{value:"sepia",label:"Sepia (CSS)"},{value:"invert",label:"Invert (CSS)"},{value:"opacity",label:"Opacity (CSS)"},{value:"drop-shadow",label:"Drop Shadow (CSS)"},{value:"feGaussianBlur",label:"Gaussian Blur (SVG)"},{value:"feColorMatrix",label:"Color Matrix (SVG)"},{value:"feOffset",label:"Offset (SVG)"},{value:"feBlend",label:"Blend (SVG)"},{value:"feComposite",label:"Composite (SVG)"},{value:"feMorphology",label:"Morphology (SVG)"},{value:"feTurbulence",label:"Turbulence/Noise (SVG)"},{value:"feDisplacementMap",label:"Displacement Map (SVG)"},{value:"tint",label:"Color Tint (SVG)"}]}_getFilterIcon(e){return{blur:"mdi:blur",brightness:"mdi:brightness-6",contrast:"mdi:contrast-box",saturate:"mdi:palette","hue-rotate":"mdi:palette-swatch",grayscale:"mdi:image-filter-black-white",sepia:"mdi:image-filter-vintage",invert:"mdi:invert-colors",opacity:"mdi:opacity","drop-shadow":"mdi:shadow",feGaussianBlur:"mdi:blur-radial",feColorMatrix:"mdi:matrix",feOffset:"mdi:arrow-expand-all",feBlend:"mdi:layers-triple",feComposite:"mdi:vector-combine",feMorphology:"mdi:shape",feTurbulence:"mdi:waves",feDisplacementMap:"mdi:image-filter-drama",tint:"mdi:format-color-fill"}[e]||"mdi:filter"}_getFilterDisplayName(e){return{blur:"Blur",brightness:"Brightness",contrast:"Contrast",saturate:"Saturation","hue-rotate":"Hue Rotate",grayscale:"Grayscale",sepia:"Sepia",invert:"Invert",opacity:"Opacity","drop-shadow":"Drop Shadow",feGaussianBlur:"Gaussian Blur",feColorMatrix:"Color Matrix",feOffset:"Offset",feBlend:"Blend Mode",feComposite:"Composite",feMorphology:"Morphology",feTurbulence:"Turbulence",feDisplacementMap:"Displacement Map",tint:"Color Tint"}[e]||e}_getFilterValueDisplay(e){const t=e.type||"blur",a=e.value;if(t==="drop-shadow"){const s=a||{};return`${s.x||0}px ${s.y||0}px ${s.blur||"0px"} ${s.color||"#000000"}`}return t==="tint"?(a||{}).color||"Not set":typeof a=="string"?a:typeof a=="number"?t==="blur"?`${a}px`:t==="hue-rotate"?`${a}deg`:a.toString():"Not set"}_toggleExpanded(e){this._expandedFilters={...this._expandedFilters,[e]:!this._expandedFilters[e]},this.requestUpdate()}_addFilter(){const e={mode:"css",type:"blur",value:"0px"},t=[...this.filters||[],e];this._expandedFilters[t.length-1]=true,this._emitChange(t)}_duplicateFilter(e,t){t.stopPropagation();const a={...this.filters[e]},s=[...this.filters];s.splice(e+1,0,a),this._expandedFilters[e+1]=true,this._emitChange(s)}_deleteFilter(e,t){t.stopPropagation();const a=this.filters.filter((s,r)=>r!==e);delete this._expandedFilters[e],this._emitChange(a)}_updateFilter(e,t,a){const s=[...this.filters];if(s[e]={...s[e],[t]:a},t==="type"){const i=["feGaussianBlur","feColorMatrix","feOffset","feBlend","feComposite","feMorphology","feTurbulence","feDisplacementMap","tint"].includes(a)?"svg":"css";s[e].mode=i,a==="tint"?s[e].value={color:"rgba(0,0,0,0.4)"}:i==="svg"?s[e].value={}:s[e].value=a==="blur"?"0px":a==="hue-rotate"?"0deg":1,$.debug("[FilterEditor] Type changed, auto-set mode:",{type:a,mode:i})}this._emitChange(s)}_emitChange(e){$.debug("[FilterEditor] Filters changed:",e),this.filters=e,this.dispatchEvent(new CustomEvent("filters-changed",{detail:{value:e},bubbles:true,composed:true})),this.requestUpdate()}_handleDragStart(e,t){var a;this._draggedIndex=t,e.dataTransfer&&(e.dataTransfer.effectAllowed="move"),(a=e.dataTransfer)==null||a.setData("text/plain",String(t)),this.requestUpdate()}_handleDragEnd(e){var t;this._draggedIndex=null,(t=this.shadowRoot)==null||t.querySelectorAll(".filter-item").forEach(a=>{a.classList.remove("drag-over")}),this.requestUpdate()}_handleDragOver(e,t){var s,r;if(e.preventDefault(),e.dataTransfer&&(e.dataTransfer.dropEffect="move"),this._draggedIndex===null||this._draggedIndex===t)return;const a=((s=this.shadowRoot)==null?void 0:s.querySelectorAll(".filter-item"))??[];a.forEach(i=>i.classList.remove("drag-over")),(r=a[t])==null||r.classList.add("drag-over")}_handleDrop(e,t){var o;e.preventDefault(),e.stopPropagation();const a=this._draggedIndex;if(a===null||a===t)return;const s=[...this.filters],[r]=s.splice(a,1);s.splice(t,0,r);const i={};Object.keys(this._expandedFilters).forEach(d=>{const n=parseInt(d);let c=n;n===a?c=t:a<t&&n>a&&n<=t?c=n-1:a>t&&n>=t&&n<a&&(c=n+1),i[c]=this._expandedFilters[d]}),this._expandedFilters=i,this._draggedIndex=null,(o=this.shadowRoot)==null||o.querySelectorAll(".filter-item").forEach(d=>{d.classList.remove("drag-over")}),this._emitChange(s)}};C(N,"LCARdSFilterEditor");let R=N;customElements.get("lcards-filter-editor")||customElements.define("lcards-filter-editor",R);export{oe as B,ne as R};
//# sourceMappingURL=lcards-filter-editor-gyZYI2ml.js.map
