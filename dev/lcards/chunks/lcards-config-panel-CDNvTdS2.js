var tt=Object.defineProperty;var vt=(u,e,t)=>e in u?tt(u,e,{enumerable:true,configurable:true,writable:true,value:t}):u[e]=t;var b=(u,e)=>tt(u,"name",{value:e,configurable:true});var A=(u,e,t)=>vt(u,typeof e!="symbol"?e+"":e,t);import{i as M,a as H,b as o,w as P,bu as me,c3 as Oe,l as d,A as ge,c4 as ft,c5 as Z,c6 as pe,c7 as I,c8 as bt,c9 as _t,ca as yt,a1 as wt,J as W,cb as xt,cc as $t,cd as Je,ce as Ct,_ as St,C as at,cf as rt,U as kt,b6 as Ue,cg as V,ch as D,ci as O,cj as j,o as ie,r as oe,D as ve,ck as At,cl as Tt,cm as st,cn as Et,co as Lt,cp as De,cq as N,cr as ee,cs as fe,ct as be,cu as _e,cv as ye,cw as U,cx as we,cy as xe,cz as z,cA as te,cB as $e,cC as Ce,cD as Se,cE as ke,cF as Ae,cG as Te,cH as He,cI as ae,cJ as Me,cK as ue,cL as Pe,cM as Re,cN as Ie,cO as re,X as T,cP as Vt,cQ as it}from"./lcards-main-C148JfkA.js";import{F as ot,a as Ot,b as Dt,c as Ht,d as Mt,g as nt,e as Pt}from"./lcards-form-section-BK3OqcgA.js";import{a as R,e as Rt,r as It}from"./lcards-message-CF99Ox_M.js";import{i as Nt}from"./keyed-yp_zPRhi.js";const ce=class ce2 extends M{constructor(){super(),this.anchorConfig=void 0,this.hueShift=void 0,this.originalColors=void 0,this.showArrows=void 0,this.transformedColors=void 0,this.hiddenVariables=new Set}render(){return o`
      <div class="color-wheel-container">
        <svg viewBox="-130 -130 260 260" xmlns="http://www.w3.org/2000/svg">
          <!-- Define arrow markers -->
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="rgba(255, 255, 255, 0.8)" />
            </marker>
            <marker
              id="transform-arrowhead"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="2.5"
              orient="auto">
              <polygon points="0 0, 8 2.5, 0 5" fill="rgba(255, 255, 255, 0.5)" />
            </marker>
          </defs>

          <!-- Background HSL wheel -->
          ${this._renderHSLWheel()}

          <!-- Anchor range (if configured) -->
          ${this.anchorConfig?this._renderAnchorRange():""}

          <!-- Hue shift target indicator -->
          ${this.hueShift!==null&&this.hueShift!==void 0?this._renderHueShiftTarget():""}

          <!-- Transformation arrows -->
          ${this.showArrows?this._renderTransformationArrows():""}

          <!-- Original color positions -->
          ${this._renderOriginalDots()}

          <!-- Transformed color positions -->
          ${this._renderTransformedDots()}

          <!-- Center circle for reference -->
          <circle cx="0" cy="0" r="20" fill="none" stroke="var(--divider-color)" stroke-width="1" />
        </svg>
      </div>

      ${this._renderInteractiveLegend()}
    `}_renderInteractiveLegend(){return!this.originalColors||this.originalColors.length===0?o``:o`
      <div class="legend">
        ${this.originalColors.map((e,t)=>{const a=this.hiddenVariables.has(e.varName),r=this.transformedColors[t];return o`
            <div
              class="legend-item ${a?"hidden":""}"
              @click="${()=>this._toggleVariable(e.varName)}"
              title="${a?"Click to show":"Click to hide"}"
            >
              <div class="legend-shapes">
                <div class="legend-circle" style="background-color: ${e.color};"></div>
                <div class="legend-square" style="background-color: ${(r==null?void 0:r.color)||e.color};"></div>
              </div>
              <span class="legend-label" title="${e.varName}">${e.name}</span>
            </div>
          `})}
      </div>
    `}_toggleVariable(e){this.hiddenVariables.has(e)?this.hiddenVariables.delete(e):this.hiddenVariables.add(e),this.hiddenVariables=new Set(this.hiddenVariables),this.requestUpdate()}_renderHSLWheel(){return P`
      <g class="hsl-wheel">
        ${Array.from({length:36}).map((r,s)=>{const i=s*360/36,n=(s+1)*360/36,l=(i+n)/2,c=this._hslToRgb(l,70,60);return P`
            <path
              class="hsl-wheel-segment"
              d="${this._createArcPath(25,100,i,n)}"
              fill="${c}"
            />
          `})}
      </g>
    `}_renderAnchorRange(){const{centerHue:e,range:t}=this.anchorConfig,a=(e-t+360)%360,r=(e+t)%360;return P`
      <path
        class="anchor-range"
        d="${this._createArcPath(95,115,a,r)}"
      />
      <text
        x="0"
        y="-110"
        class="wheel-label"
        style="font-weight: 600;">
        Anchor Range
      </text>
    `}_renderHueShiftTarget(){const e=this.hueShift*Math.PI/180,t=105,a=125,r=Math.cos(e-Math.PI/2)*t,s=Math.sin(e-Math.PI/2)*t,i=Math.cos(e-Math.PI/2)*a,n=Math.sin(e-Math.PI/2)*a;return P`
      <line
        class="hue-shift-indicator"
        x1="${r}"
        y1="${s}"
        x2="${i}"
        y2="${n}"
      />
      <text
        x="${i*1.1}"
        y="${n*1.1}"
        class="wheel-label"
        style="font-weight: 600;">
        Target Hue: ${this.hueShift}°
      </text>
    `}_renderTransformationArrows(){return this.originalColors.length!==this.transformedColors.length?"":P`
      <g class="transform-arrows">
        ${this.originalColors.filter(e=>!this.hiddenVariables.has(e.varName)).map((e,t)=>{const a=this.originalColors.indexOf(e),r=this.transformedColors[a],s=this._colorToPosition(e.color),i=this._colorToPosition(r.color);return Math.sqrt(Math.pow(i.x-s.x,2)+Math.pow(i.y-s.y,2))<2?"":P`
              <line
                class="transform-arrow"
                x1="${s.x}"
                y1="${s.y}"
                x2="${i.x}"
                y2="${i.y}"
              />
            `})}
      </g>
    `}_renderOriginalDots(){return P`
      <g class="original-dots">
        ${this.originalColors.filter(e=>!this.hiddenVariables.has(e.varName)).map(e=>{const t=this._colorToPosition(e.color);return P`
              <circle
                class="original-dot"
                cx="${t.x}"
                cy="${t.y}"
                r="5"
                fill="${e.color}"
                stroke="#000000"
                stroke-width="1"
                @mouseenter="${a=>this._handleDotHover(a,true)}"
                @mouseleave="${a=>this._handleDotHover(a,false)}"
              >
                <title>Original: ${e.name||e.varName||"Color"}
${e.color}</title>
              </circle>
            `})}
      </g>
    `}_renderTransformedDots(){return P`
      <g class="transformed-dots">
        ${this.transformedColors.filter((e,t)=>{var a;return!this.hiddenVariables.has((a=this.originalColors[t])==null?void 0:a.varName)}).map(e=>{const t=this._colorToPosition(e.color),a=9;return P`
              <rect
                class="transformed-dot"
                x="${t.x-a/2}"
                y="${t.y-a/2}"
                width="${a}"
                height="${a}"
                fill="${e.color}"
                stroke="#ffffff"
                stroke-width="1"
                @mouseenter="${r=>this._handleDotHover(r,true)}"
                @mouseleave="${r=>this._handleDotHover(r,false)}"
              >
                <title>Transformed: ${e.name||"Color"}
${e.color}</title>
              </rect>
            `})}
      </g>
    `}_handleDotHover(e,t){const a=e.target;if(t){if(a.tagName==="circle")a.setAttribute("r","7");else{const s=parseFloat(a.getAttribute("x")),i=parseFloat(a.getAttribute("y")),n=parseFloat(a.getAttribute("width")),l=13,c=(l-n)/2;a.setAttribute("x",s-c),a.setAttribute("y",i-c),a.setAttribute("width",l),a.setAttribute("height",l)}a.setAttribute("stroke-width","2")}else{if(a.tagName==="circle")a.setAttribute("r","5");else{const s=parseFloat(a.getAttribute("x")),i=parseFloat(a.getAttribute("y")),n=parseFloat(a.getAttribute("width")),l=9,c=(n-l)/2;a.setAttribute("x",s+c),a.setAttribute("y",i+c),a.setAttribute("width",l),a.setAttribute("height",l)}a.setAttribute("stroke-width","1")}}_colorToPosition(e){const t=this._parseHSL(e);if(!t)return{x:0,y:0};const{hue:a,saturation:r}=t,s=a*Math.PI/180-Math.PI/2,i=25+r/100*75;return{x:Math.cos(s)*i,y:Math.sin(s)*i}}_createArcPath(e,t,a,r){const s=(a-90)*Math.PI/180,i=(r-90)*Math.PI/180,n=Math.cos(s)*e,l=Math.sin(s)*e,c=Math.cos(i)*e,h=Math.sin(i)*e,p=Math.cos(i)*t,g=Math.sin(i)*t,v=Math.cos(s)*t,_=Math.sin(s)*t,m=r-a>180?1:0;return`
      M ${n} ${l}
      A ${e} ${e} 0 ${m} 1 ${c} ${h}
      L ${p} ${g}
      A ${t} ${t} 0 ${m} 0 ${v} ${_}
      Z
    `}_parseHSL(e){if(!e)return null;if(e.startsWith("hsl")){const a=e.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);if(a)return{hue:parseInt(a[1]),saturation:parseInt(a[2]),lightness:parseInt(a[3])}}const t=this._parseRGB(e);return t?this._rgbToHsl(t.r,t.g,t.b):null}_parseRGB(e){const t=me.parseColor(e);return t?{r:t[0],g:t[1],b:t[2]}:null}_rgbToHsl(e,t,a){const[r,s,i]=me.rgbToHsl(e,t,a);return{hue:Math.round(r),saturation:Math.round(s),lightness:Math.round(i)}}_hslToRgb(e,t,a){return me.hslToRgb(e,t,a)}};b(ce,"AlertModeColorWheel"),A(ce,"properties",{originalColors:{type:Array},transformedColors:{type:Array},anchorConfig:{type:Object},hueShift:{type:Number},showLabels:{type:Boolean},showArrows:{type:Boolean},hiddenVariables:{type:Set,state:true}}),A(ce,"styles",H`
    :host {
      display: block;
      width: 100%;
    }

    .color-wheel-container {
      width: 100%;
      max-width: 500px;
      margin: 0 auto;
      aspect-ratio: 1;
    }

    svg {
      width: 100%;
      height: 100%;
    }

    .hsl-wheel-segment {
      opacity: 0.7;
      transition: opacity 0.2s;
    }

    .hsl-wheel-segment:hover {
      opacity: 1;
      filter: brightness(1.1);
    }

    .anchor-range {
      fill: rgba(255, 255, 255, 0.15);
      stroke: rgba(255, 255, 255, 0.4);
      stroke-width: 2;
      stroke-dasharray: 5, 5;
    }

    .hue-shift-indicator {
      stroke: rgba(255, 255, 255, 0.8);
      stroke-width: 3;
      fill: none;
      marker-end: url(#arrowhead);
    }

    .original-dot {
      stroke: rgba(0, 0, 0, 0.8);
      stroke-width: 1;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .original-dot:hover {
      stroke-width: 2;
      filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.5));
      transform-origin: center;
    }

    .transformed-dot {
      stroke: rgba(255, 255, 255, 0.9);
      stroke-width: 1;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .transformed-dot:hover {
      stroke-width: 2;
      filter: drop-shadow(0 0 4px rgba(255, 255, 255, 0.8));
    }

    .transform-arrow {
      stroke: rgba(255, 255, 255, 0.5);
      stroke-width: 1.5;
      fill: none;
      marker-end: url(#transform-arrowhead);
    }

    .wheel-label {
      font-size: 8px;
      fill: var(--primary-text-color);
      text-anchor: middle;
      pointer-events: none;
    }

    .legend {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 8px 12px;
      margin-top: 16px;
      font-size: 12px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      user-select: none;
      border: var(--ha-border-width-sm) solid transparent;
    }

    .legend-item:hover {
      background: var(--secondary-background-color);
      border-color: var(--divider-color);
    }

    .legend-item.hidden {
      opacity: 0.4;
      text-decoration: line-through;
    }

    .legend-shapes {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }

    .legend-circle {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: var(--ha-border-width-sm) solid rgba(0, 0, 0, 0.8);
      flex-shrink: 0;
    }

    .legend-square {
      width: 8px;
      height: 8px;
      border: var(--ha-border-width-sm) solid rgba(255, 255, 255, 0.9);
      flex-shrink: 0;
    }

    .legend-label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `);let ze=ce;customElements.get("alert-mode-color-wheel")||customElements.define("alert-mode-color-wheel",ze);function ne({options:u,selected:e,onSelect:t,className:a="",disabled:r=false}){return o`
        <div class="filter-chips ${a}" role="radiogroup"
            style="display: flex; flex-wrap: wrap; gap: var(--ha-space-2);">
            ${u.map(s=>o`
                <ha-button
                    role="radio"
                    aria-checked=${e===s.value?"true":"false"}
                    variant=${e===s.value?"brand":"neutral"}
                    appearance=${e===s.value?"accent":"filled"}
                    title=${s.title??""}
                    ?disabled=${r}
                    @click=${()=>{e!==s.value&&t(s.value)}}>
                    ${s.icon?o`<ha-icon slot="start" icon=${s.icon}></ha-icon>`:""}
                    ${s.swatch?o`<span slot="start" style="display: inline-block; width: 10px; height: 10px; border-radius: var(--ha-border-radius-circle); border: var(--ha-border-width-sm) solid var(--divider-color); background-color: ${s.swatch};"></span>`:""}
                    ${s.label}
                </ha-button>
            `)}
        </div>
    `}b(ne,"renderFilterChips");const Le=class Le2 extends M{constructor(){super(),this.hass=void 0,this.showGlobal=false,this.disabled=false,this._scopeTab="user",this._adminScopeUserId=null,this._adminScopeDeviceId=null,this._adminUserList=[],this._adminDeviceList=[],this._adminListsLoaded=false,this._globalWasShown=false,this._announcePending=false}_globalShown(){return this.showGlobal===true&&Oe(this.hass)}willUpdate(e){if(!e.has("showGlobal")&&!e.has("hass"))return;const t=this._globalShown();t!==this._globalWasShown&&(this._globalWasShown=t,t?(this._scopeTab="global",this._announcePending=true):this._scopeTab==="global"&&(this._scopeTab="user",this._announcePending=true))}updated(){this._announcePending&&(this._announcePending=false,this._fireChange())}connectedCallback(){super.connectedCallback(),this._loadAdminLists()}setScope(e){e==="global"&&!this._globalShown()||typeof e=="string"&&(this._scopeTab=e)}getCurrentScope(){return this._buildScopeDescriptor()}_isAdmin(){var e,t;return((t=(e=this.hass)==null?void 0:e.user)==null?void 0:t.is_admin)===true}_buildScopeDescriptor(){const e=this._scopeTab,t=e==="user"?this._adminScopeUserId??null:null,a=e==="device"?this._adminScopeDeviceId??null:null,r=this._isAdmin()&&(e==="user"&&t!==null||e==="device"&&a!==null);return{scope:e,userId:t,deviceId:a,isAdminTarget:r}}_fireChange(){this.dispatchEvent(new CustomEvent("scope-changed",{detail:this._buildScopeDescriptor(),bubbles:true,composed:true}))}_adminTargetName(){const e=this._scopeTab;if(e==="user"&&this._adminScopeUserId){const t=this._adminUserList.find(a=>a.id===this._adminScopeUserId);return(t==null?void 0:t.name)??this._adminScopeUserId}if(e==="device"&&this._adminScopeDeviceId){const t=this._adminDeviceList.find(a=>a.id===this._adminScopeDeviceId);return(t==null?void 0:t.name)??this._adminScopeDeviceId}return null}async _loadAdminLists(){var t;if(!this._isAdmin()||this._adminListsLoaded)return;const e=(t=this.hass)==null?void 0:t.connection;if(e){try{const[a,r,s]=await Promise.all([e.sendMessagePromise({type:"lcards/storage/users/list"}).catch(()=>({users:{}})),e.sendMessagePromise({type:"lcards/storage/devices/list"}).catch(()=>({devices:{}})),e.sendMessagePromise({type:"config/auth/list"}).catch(()=>[])]),i=new Set(Object.keys((a==null?void 0:a.users)??{}));this._adminUserList=(Array.isArray(s)?s:[]).filter(n=>(n==null?void 0:n.id)&&!n.system_generated).map(n=>({id:n.id,name:n.name??n.id})),this._adminDeviceList=Object.entries((r==null?void 0:r.devices)??{}).map(([n,l])=>({id:n,name:(l==null?void 0:l.display_name)??n})),this._adminListsLoaded=true,d.debug("[ScopeSelector] Loaded admin lists",{users:this._adminUserList.length,devices:this._adminDeviceList.length})}catch(a){d.warn("[ScopeSelector] Failed to load admin lists:",a)}this.requestUpdate()}}_onTabClick(e){this._scopeTab!==e&&(this._scopeTab=e,this._adminScopeUserId=null,this._adminScopeDeviceId=null,this._fireChange())}_onAdminTargetChange(e){const t=e.detail.value==="__own__"?null:e.detail.value||null,a=this._scopeTab==="user"?this._adminScopeUserId:this._adminScopeDeviceId;t!==a&&(this._scopeTab==="user"?this._adminScopeUserId=t:this._adminScopeDeviceId=t,this._fireChange())}static get styles(){return H`
      :host { display: block; }

      .scope-tabs {
        margin-bottom: var(--ha-space-2);
      }

      .admin-selector-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      .admin-selector-label {
        font-size: var(--ha-font-size-s);
        color: var(--secondary-text-color);
        white-space: nowrap;
      }
      .admin-selector-input {
        flex: 1;
        min-width: 0;
      }

      .scope-context-banner {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: var(--ha-font-size-s);
        background: color-mix(in srgb, var(--info-color, #03a9f4) 12%, transparent);
        border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--info-color, #03a9f4) 30%, transparent);
        margin-bottom: 8px;
      }
      .scope-context-banner.admin {
        background: color-mix(in srgb, var(--warning-color, #ff9800) 12%, transparent);
        border-color: color-mix(in srgb, var(--warning-color, #ff9800) 30%, transparent);
      }
    `}render(){const e=this._scopeTab,t=this._isAdmin(),a=e==="user"?this._adminScopeUserId:this._adminScopeDeviceId,r=t&&a!==null,s=this._adminTargetName();return o`
      <!-- ── SCOPE PILL SWITCHER ── -->
      ${ne({className:"scope-tabs",options:[...this._globalShown()?[{value:"global",label:"Global",icon:"mdi:earth"}]:[],{value:"user",label:"User",icon:"mdi:account"},{value:"device",label:"Device",icon:"mdi:laptop"}],selected:e,disabled:this.disabled,onSelect:b(i=>this._onTabClick(i),"onSelect")})}

      <!-- ── ADMIN SUBJECT SELECTOR (non-Global scopes only) ── -->
      ${t&&this._adminListsLoaded&&e!=="global"?o`
        <div class="admin-selector-row">
          <ha-icon icon="mdi:shield-account" style="color:var(--warning-color,#ff9800);flex-shrink:0;"></ha-icon>
          <span class="admin-selector-label">Edit as admin:</span>
          <ha-selector
            class="admin-selector-input"
            .hass=${this.hass}
            .selector=${{select:{options:[{value:"__own__",label:e==="user"?"My user (own)":"This device (own)"},...e==="user"?this._adminUserList.map(i=>({value:i.id,label:i.name||i.id})):this._adminDeviceList.map(i=>({value:i.id,label:i.name||i.id}))],mode:"dropdown"}}}
            .value=${a??"__own__"}
            @value-changed=${this._onAdminTargetChange}
          ></ha-selector>
        </div>
      `:ge}

      <!-- ── SCOPE CONTEXT BANNER ── -->
      <div class="scope-context-banner ${r?"admin":"own"}">
        <ha-icon icon="${e==="device"?"mdi:laptop":e==="global"?"mdi:earth":"mdi:account-circle"}"></ha-icon>
        <span>
          ${r?o`Editing <strong>${e}</strong> overrides for <strong>${s}</strong>`:e==="global"?o`Editing <strong>global</strong> overrides: applied to all users on this install`:o`Editing your own <strong>${e}</strong> overrides`}
        </span>
      </div>
    `}};b(Le,"LCARdSScopeSelector"),A(Le,"properties",{hass:{type:Object},showGlobal:{type:Boolean},disabled:{type:Boolean},_scopeTab:{type:String,state:true},_adminScopeUserId:{type:String,state:true},_adminScopeDeviceId:{type:String,state:true},_adminUserList:{type:Array,state:true},_adminDeviceList:{type:Array,state:true},_adminListsLoaded:{type:Boolean,state:true}});let Fe=Le;customElements.get("lcards-scope-selector")||customElements.define("lcards-scope-selector",Fe);const L=b(u=>`Text colour rendered on top of ${u}.`,"textOn"),Ut=b(u=>`Icon colour rendered on top of ${u}.`,"iconOn"),q=b(u=>`Indicator colour HA-LCARS switches --lcars-alert-color to during a ${u} alert.`,"alertVariant"),se=b(u=>`Background colour for a ${u}-variant ha-label-badge.`,"labelBadgeVariant"),zt=[{key:"primary-color",label:"Primary Colour",group:"Core",role:"primary",tone:40,description:"Home Assistant's own accent colour: buttons, active toggles, selected tabs, and focus rings across stock Home Assistant UI."},{key:"accent-color",label:"Accent Colour",group:"Core",role:"primary",tone:40,description:"A secondary accent used alongside Primary Colour for less prominent highlights in stock Home Assistant components."},{key:"primary-background-color",label:"Primary Background",group:"Core",live:true,description:"The base page background behind every card and panel."},{key:"secondary-background-color",label:"Secondary Background",group:"Core",role:"neutral",tone:20,description:"Background for secondary surfaces: dialogs, list rows, form fields."},{key:"card-background-color",label:"Card Background",group:"Core",role:"neutral",tone:20,description:"Background colour of ha-card and every Lovelace card by default."},{key:"lcars-background-color",label:"LCARS Background",group:"Core",live:true,description:"HA-LCARS's own page background, layered under Primary Background for the LCARS look."},{key:"divider-color",label:"Divider",group:"Core",live:true,description:"Colour of divider lines between list items and sections (HA-LCARS's own default is transparent)."},{key:"primary-text-color",label:"Primary Text",group:"Text",live:true,description:"Default text colour used almost everywhere in stock Home Assistant UI."},{key:"secondary-text-color",label:"Secondary Text",group:"Text",live:true,description:"Muted/secondary text: captions, helper text, timestamps."},{key:"text-primary-color",label:"Text on Primary Background",group:"Text",live:true,description:"Text/icon colour placed on surfaces coloured with Primary Colour (e.g. filled buttons)."},{key:"text-accent-color",label:"Text on Accent Background",group:"Text",live:true,description:"Text/icon colour placed on surfaces coloured with Accent Colour."},{key:"disabled-text-color",label:"Disabled Text",group:"Text",live:true,description:"Text colour for disabled controls and unavailable entities."},{key:"lcars-primary-text",label:"LCARS Primary Text",group:"Text",live:true,description:"Default LCARS-styled text colour, layered under Home Assistant's own Primary Text."},{key:"lcars-secondary-text",label:"LCARS Secondary Text",group:"Text",fixed:"#bebebe",fixedDark:"#ffffff",description:"A dimmer LCARS text tone, derived from LCARS Primary Text for less prominent labels."},{key:"lcars-background-text",label:"LCARS Background Text",group:"Text",live:true,description:L("LCARS Background")},{key:"success-color",label:"Success",group:"Status Colours",role:"green",tone:40,description:"Colour for success alerts, badges, and positive indicators across stock Home Assistant UI."},{key:"warning-color",label:"Warning",group:"Status Colours",role:"orange",tone:40,description:"Colour for warning alerts and caution indicators."},{key:"error-color",label:"Error",group:"Status Colours",role:"red",tone:40,description:"Colour for error alerts and failure indicators."},{key:"info-color",label:"Info",group:"Status Colours",role:"primary",tone:40,description:"Colour for informational alerts and neutral notices."},{key:"state-active-color",label:"State: Active",group:"Status Colours",live:true,description:"Global Fallback: an entity icon's colour for any 'active' state with no more specific var set (see Domain & State Colours)."},{key:"state-inactive-color",label:"State: Inactive",group:"Status Colours",live:true,description:"Global Fallback: an entity icon's colour for any 'inactive' state with no more specific var set."},{key:"state-unavailable-color",label:"State: Unavailable",group:"Status Colours",live:true,description:"Icon colour for an entity whose state is unavailable."},{key:"state-unknown-color",label:"State: Unknown",group:"Status Colours",live:true,description:"Icon colour for an entity whose state is unknown."},{key:"state-color",label:"State: Default Icon",group:"Status Colours",live:true,description:"Default icon colour for domains/states with no active/inactive distinction at all."},{key:"label-badge-text-color",label:"Label Badge Text",group:"Status Colours",live:true,description:"Text colour shown on every ha-label-badge, regardless of its background variant."},{key:"label-badge-red",label:"Label Badge: Red",group:"Status Colours",role:"red",tone:40,description:se("red")},{key:"label-badge-yellow",label:"Label Badge: Yellow",group:"Status Colours",role:"orange",tone:40,description:se("yellow")},{key:"label-badge-blue",label:"Label Badge: Blue",group:"Status Colours",role:"primary",tone:40,description:se("blue")},{key:"label-badge-green",label:"Label Badge: Green",group:"Status Colours",role:"green",tone:40,description:se("green")},{key:"label-badge-grey",label:"Label Badge: Grey",group:"Status Colours",role:"neutral",tone:60,description:se("grey")},{key:"energy-non-fossil-color",label:"Energy: Non-Fossil",group:"Status Colours",role:"green",tone:40,description:"Colour for the non-fossil energy indicator on the Energy dashboard's distribution card."},{key:"lcars-ui-primary",label:"LCARS UI Primary",group:"LCARS UI",role:"primary",tone:40,description:"The boldest of HA-LCARS's 4 UI colour tiers: the most prominent chrome elements (see UI Colour Tiers preview)."},{key:"lcars-ui-primary-text",label:"LCARS UI Primary Text",group:"LCARS UI",live:true,description:L("LCARS UI Primary")},{key:"lcars-ui-secondary",label:"LCARS UI Secondary",group:"LCARS UI",role:"neutral",tone:60,description:"The second of HA-LCARS's 4 UI colour tiers."},{key:"lcars-ui-secondary-text",label:"LCARS UI Secondary Text",group:"LCARS UI",live:true,description:L("LCARS UI Secondary")},{key:"lcars-ui-tertiary",label:"LCARS UI Tertiary",group:"LCARS UI",role:"primary",tone:40,description:"The third of HA-LCARS's 4 UI colour tiers."},{key:"lcars-ui-tertiary-text",label:"LCARS UI Tertiary Text",group:"LCARS UI",live:true,description:L("LCARS UI Tertiary")},{key:"lcars-ui-quaternary",label:"LCARS UI Quaternary",group:"LCARS UI",role:"neutral",tone:20,description:"The most muted of HA-LCARS's 4 UI colour tiers."},{key:"lcars-ui-quaternary-text",label:"LCARS UI Quaternary Text",group:"LCARS UI",role:"neutral",tone:90,description:L("LCARS UI Quaternary")},{key:"lcars-ui-accent-color",label:"LCARS UI Accent",group:"LCARS UI",role:"primary",tone:40,description:"A dedicated accent tier, separate from the primary/secondary/tertiary/quaternary stack, for standout chrome elements."},{key:"lcars-ui-accent-text",label:"LCARS UI Accent Text",group:"LCARS UI",live:true,description:L("LCARS UI Accent")},{key:"lcars-ui-text-heading",label:"LCARS UI Heading Text",group:"LCARS UI",role:"neutral",tone:90,description:"Heading text colour for LCARS-styled panels and section titles."},{key:"lcars-ui-app-header-background-color",label:"App Header Background",group:"LCARS UI",role:"primary",tone:40,description:"Background colour of Home Assistant's top app header bar."},{key:"lcars-ui-app-header-text-color",label:"App Header Text",group:"LCARS UI",live:true,description:L("App Header Background")},{key:"lcars-ui-app-header-clock",label:"App Header Clock",group:"LCARS UI",role:"neutral",tone:90,description:"Colour of the clock shown in the app header, if enabled."},{key:"lcars-ui-config-button",label:"Config Button",group:"LCARS UI",role:"primary",tone:40,description:"Background colour of the settings/config button chip."},{key:"lcars-ui-config-icon",label:"Config Icon",group:"LCARS UI",live:true,description:Ut("Config Button")},{key:"lcars-card-top-color",label:"Card Top",group:"Cards",role:"primary",tone:40,description:"Top band colour for HA-LCARS's card_mod card styling (header-*/top card_mod classes)."},{key:"lcars-card-top-text",label:"Card Top Text",group:"Cards",live:true,description:L("Card Top")},{key:"lcars-card-mid-color",label:"Card Middle",group:"Cards",role:"neutral",tone:60,description:"Middle band colour for HA-LCARS's card_mod card styling (middle-* card_mod classes)."},{key:"lcars-card-mid-text",label:"Card Middle Text",group:"Cards",live:true,description:L("Card Middle")},{key:"lcars-card-button-color",label:"Card Button",group:"Cards",role:"primary",tone:40,description:"Colour for HA-LCARS's card_mod button classes (button-small/-large/-lozenge/-bullet)."},{key:"lcars-card-button-text",label:"Card Button Text",group:"Cards",live:true,description:L("Card Button")},{key:"lcars-card-bottom-color",label:"Card Bottom",group:"Cards",role:"neutral",tone:60,description:"Bottom band colour for HA-LCARS's card_mod card styling (footer-*/bottom card_mod classes)."},{key:"lcars-card-bottom-text",label:"Card Bottom Text",group:"Cards",live:true,description:L("Card Bottom")},{key:"lcars-settings-card-color",label:"Settings Card",group:"Cards",role:"neutral",tone:60,description:"Background colour for HA-LCARS's settings-card card_mod class."},{key:"lcars-settings-card-text",label:"Settings Card Text",group:"Cards",role:"neutral",tone:90,description:L("Settings Card")},{key:"mdc-theme-primary",label:"MDC Theme Primary",group:"Cards",role:"neutral",tone:90,description:"Primary colour for legacy Material (MWC) components still used in Home Assistant: dialogs, radio/checkbox lists, entity pickers."},{key:"mdc-theme-secondary",label:"MDC Theme Secondary",group:"Cards",role:"neutral",tone:90,description:"Secondary colour for the same legacy Material components."},{key:"mdc-theme-on-primary",label:"MDC Theme On Primary",group:"Cards",live:true,description:L("MDC Theme Primary")},{key:"mdc-theme-on-secondary",label:"MDC Theme On Secondary",group:"Cards",live:true,description:L("MDC Theme Secondary")},{key:"control-circular-slider-background",label:"Thermostat Slider Background",group:"Cards",role:"neutral",tone:20,description:"Track background colour for the circular thermostat/climate slider control."},{key:"lcars-sidebar-background",label:"Sidebar Background",group:"Sidebar",live:true,description:"Background colour of the Home Assistant sidebar navigation panel."},{key:"lcars-sidebar-text",label:"Sidebar Text",group:"Sidebar",role:"neutral",tone:90,description:"Heading/label text colour in the sidebar, distinct from individual item text."},{key:"lcars-sidebar-icon-color",label:"Sidebar Icon",group:"Sidebar",role:"neutral",tone:90,description:"Icon colour for unselected sidebar navigation items."},{key:"lcars-sidebar-icon-background",label:"Sidebar Icon Background",group:"Sidebar",role:"neutral",tone:20,description:"Background chip colour behind each sidebar item's icon."},{key:"lcars-sidebar-item-color",label:"Sidebar Item",group:"Sidebar",role:"neutral",tone:90,description:"Text colour for unselected sidebar navigation items."},{key:"lcars-sidebar-selected-color",label:"Sidebar Selected",group:"Sidebar",role:"primary",tone:40,description:"Colour used for the currently-selected sidebar item (icon and text)."},{key:"lcars-sidebar-notification-color",label:"Sidebar Notification",group:"Sidebar",role:"red",tone:40,description:"Background colour for the notification-count badge on sidebar items."},{key:"lcars-tooltip-background",label:"Tooltip Background",group:"Tooltip & Misc",role:"neutral",tone:60,description:"Background colour of Home Assistant's hover tooltips (e.g. an entity's more-info tooltip)."},{key:"lcars-tooltip-text",label:"Tooltip Text",group:"Tooltip & Misc",live:true,description:L("Tooltip Background")},{key:"lcars-ripple-color",label:"Ripple Effect",group:"Tooltip & Misc",role:"primary",tone:40,description:"Tint colour for the press/hover ripple effect on interactive HA-LCARS elements."},{key:"input-dropdown-icon-color",label:"Input Dropdown Icon",group:"Tooltip & Misc",role:"neutral",tone:90,description:"Dropdown-arrow icon colour on multi-select form fields."},{key:"ha-outlined-field-container-color",label:"Outlined Field Container",group:"Tooltip & Misc",role:"neutral",tone:90,description:"Border/container colour for Home Assistant's newer outlined text-field component."},{key:"markdown-code-text-color",label:"Markdown Code Text",group:"Tooltip & Misc",live:true,description:"Text colour for inline code blocks rendered inside markdown cards and the assist chat."},{key:"code-editor-background-color",label:"Code Editor Background",group:"Tooltip & Misc",live:true,description:"Background colour of Home Assistant's built-in YAML/code editor."},{key:"lcars-alert-color",label:"Alert (current)",group:"Alert Colours",live:true,description:"The currently-active alert indicator colour. HA-LCARS switches this between the variants below at runtime."},{key:"lcars-alert-red",label:"Alert: Red",group:"Alert Colours",live:true,description:q("Red")},{key:"lcars-alert-yellow",label:"Alert: Yellow",group:"Alert Colours",live:true,description:q("Yellow")},{key:"lcars-alert-blue",label:"Alert: Blue",group:"Alert Colours",live:true,description:q("Blue")},{key:"lcars-alert-white",label:"Alert: White",group:"Alert Colours",live:true,description:q("White")},{key:"lcars-alert-uv",label:"Alert: UV",group:"Alert Colours",live:true,description:q("UV")},{key:"lcars-alert-uvc",label:"Alert: UVC",group:"Alert Colours",live:true,description:q("UVC")}],Ft=new Set(zt.map(u=>u.key)),Ne=[{value:"green_alert",label:"Green alert (normal)",short:"GRN",dot:"var(--success-color)"},{value:"red_alert",label:"Red alert",short:"RED",dot:"var(--error-color)"},{value:"blue_alert",label:"Blue alert",short:"BLU",dot:"var(--info-color)"},{value:"yellow_alert",label:"Yellow alert",short:"YEL",dot:"var(--warning-color)"},{value:"gray_alert",label:"Gray alert",short:"GRY",dot:"var(--disabled-color)"},{value:"black_alert",label:"Black alert",short:"BLK",dot:"var(--primary-background-color)"}],Bt=[{title:"UI Colours",colors:[{name:"Primary",key:"lcars-ui-primary"},{name:"Secondary",key:"lcars-ui-secondary"},{name:"Tertiary",key:"lcars-ui-tertiary"},{name:"Quaternary",key:"lcars-ui-quaternary"},{name:"Accent",key:"lcars-ui-accent-color"}]},{title:"Card Colours",colors:[{name:"Top",key:"lcars-card-top-color"},{name:"Mid",key:"lcars-card-mid-color"},{name:"Button",key:"lcars-card-button-color"},{name:"Bottom",key:"lcars-card-bottom-color"},{name:"Settings",key:"lcars-settings-card-color"}]},{title:"Alert Colours",colors:[{name:"Current",key:"lcars-alert-color"},{name:"Red",key:"lcars-alert-red"},{name:"Yellow",key:"lcars-alert-yellow"},{name:"Blue",key:"lcars-alert-blue"},{name:"White",key:"lcars-alert-white"},{name:"UV",key:"lcars-alert-uv"},{name:"UVC",key:"lcars-alert-uvc"}]},{title:"State Colours",colors:[{name:"Success",key:"success-color"},{name:"Warning",key:"warning-color"},{name:"Error",key:"error-color"},{name:"Info",key:"info-color"},{name:"Active",key:"state-active-color"},{name:"Inactive",key:"state-inactive-color"},{name:"Unavailable",key:"state-unavailable-color"},{name:"Unknown",key:"state-unknown-color"}]}];function lt(){return Bt.map(u=>({title:u.title,colors:u.colors.filter(e=>Ft.has(e.key)).map(e=>({name:e.name,cssVar:`--${e.key}`}))}))}b(lt,"getAlertLabColorGroups");const Xe=class Xe2 extends M{static get properties(){return{hass:{type:Object},_tokens:{type:Array,state:true},_filteredTokens:{type:Array,state:true},_searchQuery:{type:String,state:true},_selectedCategory:{type:String,state:true},_isLoading:{type:Boolean,state:true},_activeTheme:{type:Object,state:true},_sortColumn:{type:String,state:true},_sortDirection:{type:String,state:true},_activeView:{type:String,state:true},_cssVariables:{type:Array,state:true},_filteredCssVars:{type:Array,state:true},_haThemeName:{type:String,state:true},_allCssVariables:{type:Array,state:true},_filteredAllVars:{type:Array,state:true},_selectedAllVarsCategory:{type:String,state:true},_selectedFamily:{type:String,state:true},_cssVarSortColumn:{type:String,state:true},_cssVarSortDirection:{type:String,state:true},_alertModePreview:{type:Boolean,state:true},_selectedAlertMode:{type:String,state:true},_alertLabParams:{type:Object,state:true},_livePreviewEnabled:{type:Boolean,state:true},_originalLcarsColors:{type:Object,state:true},_showFullPreview:{type:Boolean,state:true},_activeVizTab:{type:String,state:true},_helperSaveMessage:{type:Object,state:true},_overridesScopeInfo:{type:Object,state:true},_overridesError:{type:String,state:true},_overridesFilter:{type:String,state:true},_activeEditToken:{type:String,state:true},_editPendingValue:{type:String,state:true},_scopeOverridesCache:{type:Object,state:true},_overridesLoading:{type:Boolean,state:true}}}constructor(){super(),this.hass=void 0,this._tokens=[],this._filteredTokens=[],this._searchQuery="",this._selectedCategory="all",this._isLoading=false,this._selectedFamily="all",this._activeTheme=null,this._sortColumn="path",this._sortDirection="asc",this._cssVarSortColumn="hue",this._cssVarSortDirection="asc",this._activeView="alert-lab",this._cssVariables=[],this._filteredCssVars=[],this._haThemeName="Unknown",this._allCssVariables=[],this._filteredAllVars=[],this._selectedAllVarsCategory="all",this._expandedCategories=new Set,this._expandedTokenCategories=new Set,this._alertModePreview=false,this._selectedAlertMode="red_alert",this._alertLabParams={},this._livePreviewEnabled=false,this._originalLcarsColors=null,this._showFullPreview=false,this._activeVizTab="preview",this._helperSaveMessage=null,this._overridesScopeInfo={scope:"user",userId:null,deviceId:null,isAdminTarget:false},this._overridesError=null,this._overridesFilter="",this._activeEditToken=null,this._editPendingValue="",this._scopeOverridesCache=null,this._overridesLoading=false,this._handleKeydown=this._handleKeydown.bind(this)}connectedCallback(){super.connectedCallback(),document.addEventListener("keydown",this._handleKeydown,true),this._initialize()}_initialize(){var e;d.debug("[ThemeTokenBrowser] Initializing"),this._scanCssVariables(),this._scanAllCssVariables(),this._detectHaTheme(),this._applyFilters(),this._originalLcarsColors=ft(document.documentElement),(e=window.lcards)!=null&&e.getAlertMode&&(this._selectedAlertMode=window.lcards.getAlertMode(),d.debug("[AlertLab] Initialized with current mode:",this._selectedAlertMode)),this._loadAlertLabFromHelpers()}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("keydown",this._handleKeydown,true)}_handleKeydown(e){var t;if((e.ctrlKey||e.metaKey)&&e.key==="f"){e.preventDefault(),e.stopPropagation();const a=(t=this.shadowRoot)==null?void 0:t.querySelector(".dialog-search");a&&a.focus();return}}static get styles(){return[R,Rt,H`
        :host {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }

        /* Studio Layout Container */

        /* Dialog styles */
        ha-dialog {
          --ha-dialog-width-md: 90vw;
          --ha-dialog-min-height: 80vh;
          --ha-dialog-max-height: 80vh;
        }

        ha-tab-group-tab ha-icon {
          --mdc-icon-size: 18px;
          margin-right: var(--ha-space-2);
        }

      .dialog-content {
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
        overflow: hidden;

      .tabs-container {
        display: flex;
        overflow-x: auto;
        overflow-y: hidden;
        flex-wrap: nowrap;
        scroll-behavior: smooth;
        scrollbar-width: thin;
        border-bottom: var(--ha-border-width-md) solid var(--divider-color);
        margin-bottom: 0;
      }

      .tabs-container::-webkit-scrollbar {
        height: 4px;
      }

      .tabs-container::-webkit-scrollbar-thumb {
        background: var(--primary-color);
        border-radius: 2px;
      }

      /* HA native tab styling (Issue #82) */
      ha-tab-group {
        display: block;
        margin-bottom: var(--ha-space-3);
        padding: 0;
      }

      .theme-info {
        display: flex;
        gap: var(--ha-space-3);
        padding: var(--ha-space-3) var(--ha-space-6);
        border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
        background: var(--secondary-background-color);
      }

      .theme-info-badge {
        padding: var(--ha-space-2) var(--ha-space-4);
        background: var(--secondary-background-color);
        border: var(--ha-border-width-sm) solid var(--divider-color);
        border-radius: var(--ha-border-radius-sm);
        font-size: var(--ha-font-size-m);
        font-weight: 500;
        color: var(--primary-text-color);
        display: flex;
        align-items: center;
        gap: var(--ha-space-2);
      }

      .theme-info-badge strong {
        color: var(--secondary-text-color);
        font-weight: normal;
      }

      .theme-info-badge .theme-name {
        color: var(--primary-color);
        font-weight: 600;
      }

      .search-container {
        padding: var(--ha-space-3) var(--ha-space-6);
        border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
        display: flex;
        gap: var(--ha-space-3);
        align-items: center;
      }

      .search-wrapper {
        flex: 1;
        position: relative;
        min-width: 400px;
      }

      .dialog-search {
        width: 100%;
      }

      .search-clear {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        --ha-icon-button-size: 32px;
      }

      .search-result-count {
        color: var(--secondary-text-color);
        font-size: var(--ha-font-size-m);
        white-space: nowrap;
        padding: 0 var(--ha-space-2);
      }

      .category-filters {
        display: flex;
        gap: var(--ha-space-2);
        flex-wrap: wrap;
        padding: var(--ha-space-4) var(--ha-space-6);
        border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
      }

      .chip-swatch {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: var(--ha-border-radius-circle);
        border: var(--ha-border-width-sm) solid var(--divider-color);
      }

      .dialog-body {
        flex: 1;
        overflow: auto;
        padding: 0;
      }

      /* Alert Lab: dialog-body becomes flex container without scroll */
      .dialog-body:has(.alert-lab-container) {
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }

      .css-vars-columns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0;
        height: 100%;
      }

      .css-vars-column {
        overflow: auto;
        border-right: var(--ha-border-width-sm) solid var(--divider-color);
      }

      .css-vars-column:last-child {
        border-right: none;
      }

      .css-vars-column h4 {
        position: sticky;
        top: 0;
        background: var(--primary-background-color);
        padding: var(--ha-space-4) var(--ha-space-6) var(--ha-space-2);
        margin: 0;
        color: var(--primary-text-color);
        border-bottom: var(--ha-border-width-md) solid var(--divider-color);
        z-index: 1;
      }

      .token-table {
        width: 100%;
        border-collapse: collapse;
        background: var(--primary-background-color);
      }

      .token-table thead {
        position: sticky;
        top: 0;
        background: var(--primary-background-color);
        z-index: 1;
        box-shadow: var(--ha-box-shadow-s);
      }

      .token-table th {
        text-align: left;
        padding: var(--ha-space-3) var(--ha-space-4);
        font-weight: 600;
        color: var(--primary-text-color);
        border-bottom: var(--ha-border-width-md) solid var(--divider-color);
        cursor: pointer;
        user-select: none;
      }

      .token-table th:hover {
        background: var(--secondary-background-color);
      }

      .token-table th .sort-indicator {
        margin-left: var(--ha-space-1);
        font-size: var(--ha-font-size-xs);
        color: var(--secondary-text-color);
      }

      .token-table td {
        padding: var(--ha-space-3) var(--ha-space-4);
        border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
        vertical-align: middle;
      }

      .token-table tbody tr:hover {
        background: var(--secondary-background-color);
      }

      .token-path-cell {
        font-family: 'Courier New', monospace;
        font-size: var(--ha-font-size-s);
        color: var(--primary-color);
        word-break: break-all;
        max-width: 300px;
      }

      .token-value-cell {
        font-family: 'Courier New', monospace;
        font-size: var(--ha-font-size-s);
        color: var(--secondary-text-color);
        word-break: break-all;
        max-width: 300px;
      }

      .token-resolution {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-1);
      }

      .raw-value {
        color: var(--secondary-text-color);
        font-size: var(--ha-font-size-s);
        opacity: 0.8;
      }

      .resolution-arrow {
        color: var(--primary-color);
        font-size: var(--ha-font-size-xs);
        font-weight: bold;
        padding: 2px 0;
      }

      .resolved-value {
        color: var(--primary-text-color);
        font-weight: 500;
        font-size: var(--ha-font-size-s);
      }

      .token-preview-cell {
        width: 60px;
        text-align: center;
      }

      .color-preview {
        width: 32px;
        height: 32px;
        border-radius: var(--ha-border-radius-sm);
        border: var(--ha-border-width-md) solid var(--divider-color);
        display: inline-block;
        box-shadow: inset 0 0 0 var(--ha-border-width-sm) var(--divider-color);
      }

      /* Alert mode preview swatches */
      .alert-mode-swatches {
        display: flex;
        gap: 3px;
        flex-wrap: nowrap;
        align-items: center;
        justify-content: flex-start;
      }

      .alert-swatch {
        width: 22px;
        height: 22px;
        border-radius: 3px;
        border: var(--ha-border-width-sm) solid var(--divider-color);
        cursor: pointer;
        transition: transform 0.1s ease;
        box-shadow: inset 0 0 0 var(--ha-border-width-sm) var(--divider-color);
        position: relative;
        flex-shrink: 0;
      }

      .alert-swatch:hover {
        transform: scale(1.3);
        z-index: 10;
      }

      .alert-swatch.active-mode {
        border: var(--ha-border-width-md) solid var(--primary-color);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color) 30%, transparent);
      }

      /* Alert mode toggle button in header */
      .alert-mode-toggle {
        display: flex;
        align-items: center;
        gap: var(--ha-space-2);
        padding: var(--ha-space-2) var(--ha-space-4);
        background: var(--secondary-background-color);
        border-radius: var(--ha-border-radius-md);
        cursor: pointer;
        user-select: none;
        transition: background var(--ha-animation-duration-normal, 0.2s) ease;
      }

      .alert-mode-toggle:hover {
        background: var(--divider-color);
      }

      .alert-mode-toggle.active {
        background: var(--primary-color);
        color: var(--text-primary-color);
      }

      .alert-mode-toggle ha-icon {
        --mdc-icon-size: 20px;
      }

      .alert-mode-toggle-label {
        font-size: var(--ha-font-size-m);
        font-weight: 500;
      }

      .alert-mode-info {
        display: flex;
        align-items: center;
        gap: var(--ha-space-3);
        flex-wrap: wrap;
      }

      .hsl-formula-info {
        display: flex;
        align-items: center;
        gap: var(--ha-space-2);
        padding: 6px var(--ha-space-3);
        background: var(--secondary-background-color);
        border-radius: 6px;
      }

      /* HSL Formula Table */
      .hsl-formula-table {
        margin-top: var(--ha-space-3);
        border-radius: var(--ha-border-radius-md);
        overflow: hidden;
        border: var(--ha-border-width-sm) solid var(--divider-color);
      }

      .hsl-formula-table table {
        width: 100%;
        border-collapse: collapse;
      }

      .hsl-formula-table th,
      .hsl-formula-table td {
        padding: var(--ha-space-2) var(--ha-space-3);
        text-align: left;
        border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
        font-size: var(--ha-font-size-m);
      }

      .hsl-formula-table th {
        font-weight: 600;
        color: var(--primary-text-color);
      }

      .hsl-formula-table td {
        font-family: 'Courier New', monospace;
        color: var(--secondary-text-color);
      }

      .hsl-formula-table tr:last-child td {
        border-bottom: none;
      }

      .hsl-formula-table .mode-name {
        font-weight: 500;
        color: var(--primary-text-color);
        font-family: inherit;
      }

      .hsl-formula-table .mode-dot {
        display: inline-block;
        width: 10px;
        height: 10px;
        margin-right: 6px;
        border-radius: var(--ha-border-radius-circle);
        border: var(--ha-border-width-sm) solid var(--divider-color);
        vertical-align: middle;
      }

      /* Alert mode swatch legend */
      .alert-mode-legend {
        display: flex;
        gap: 3px;
        flex-wrap: nowrap;
        align-items: center;
        justify-content: flex-start;
        margin-top: 2px;
      }

      .alert-legend-label {
        width: 22px;
        height: 12px;
        font-size: 9px;
        text-align: center;
        color: var(--secondary-text-color);
        flex-shrink: 0;
        line-height: 12px;
        font-weight: 600;
        font-size: var(--ha-font-size-s);
        color: var(--secondary-text-color);
        border: var(--ha-border-width-sm) solid var(--divider-color);
      }

      .hsl-formula-info code {
        background: var(--secondary-background-color);
        padding: 2px 6px;
        border-radius: 3px;
        font-family: 'Roboto Mono', monospace;
        font-size: var(--ha-font-size-s);
        color: var(--primary-text-color);
      }

      .hsl-formula-info strong {
        color: var(--primary-text-color);
      }

      .token-actions-cell {
        width: 100px;
        text-align: right;
      }

      .token-actions {
        display: flex;
        gap: var(--ha-space-1);
        justify-content: flex-end;
      }

      .token-actions ha-icon-button {
        --ha-icon-button-size: 36px;
        --mdc-icon-size: 20px;
        color: var(--primary-text-color);
      }

      .token-actions ha-icon-button:hover {
        color: var(--primary-color);
      }

      .text-preview {
        font-family: var(--token-font-family, inherit);
        font-size: var(--token-font-size, 14px);
        font-weight: var(--token-font-weight, normal);
        line-height: 1.5;
        padding: var(--ha-space-1) var(--ha-space-2);
        background: var(--secondary-background-color);
        border-radius: var(--ha-border-radius-sm);
        display: inline-block;
      }

      .empty-state {
        text-align: center;
        padding: var(--ha-space-12) var(--ha-space-6);
        color: var(--secondary-text-color);
      }

      .loading-state {
        text-align: center;
        padding: var(--ha-space-12) var(--ha-space-6);
      }

      /* Alert Mode Lab Styles */
      .alert-lab-container {
        padding: var(--ha-space-5);
        display: grid;
        grid-template-columns: 450px 1fr;
        gap: var(--ha-space-8);
        min-height: 0;
        flex: 1;
      }

      @media (max-width: 1200px) {
        .alert-lab-container {
          grid-template-columns: 1fr;
        }
      }

      .alert-lab-left-column {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-3);
        align-self: start;
        overflow-y: auto;
        overflow-x: hidden;
        max-height: 100%;
      }

      .alert-lab-right-column {
        display: flex;
        flex-direction: column;
        min-height: 0;
        flex: 1;
        overflow: hidden;
      }

      /* Alert Lab: HA native tab styling for visualization tabs (Issue #82) */
      .alert-lab-right-column ha-tab-group {
        display: block;
        margin-bottom: var(--ha-space-3);
        flex-shrink: 0;
      }

      /* Alert Lab: Scrollable visualization content container (like main dialog-body) */
      .alert-lab-viz-content {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 0;
        min-height: 0;
      }

      /* Alert Lab: Scrollable content containers */
      .preview-section,
      .visualization-section,
      .comparison-section {
        padding: var(--ha-space-4);
      }

      .preview-section h4,
      .visualization-section h4 {
        margin-top: 0;
      }

      .alert-lab-header {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-3);
        padding-bottom: var(--ha-space-4);
        border-bottom: var(--ha-border-width-md) solid var(--divider-color);
      }

      .mode-selection-controls {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-3);
      }


      .live-preview-toggle {
        display: flex;
        align-items: center;
      }

      .live-preview-toggle label {
        display: flex;
        align-items: center;
        gap: var(--ha-space-2);
        cursor: pointer;
        color: var(--secondary-text-color);
        font-size: var(--ha-font-size-m);
      }

      .live-preview-toggle input[type="checkbox"] {
        cursor: pointer;
      }

      .parameter-controls {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-3);
        margin-bottom: var(--ha-space-3);
      }

      .slider-control {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-2);
        padding: var(--ha-space-3) 0;
      }

      .slider-label-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .slider-label-row label {
        font-size: 14px;
        color: var(--primary-text-color);
        font-weight: 500;
      }

      .slider-value {
        font-size: var(--ha-font-size-m);
        color: var(--primary-color);
        font-weight: 600;
        font-family: 'Roboto Mono', monospace;
        min-width: 60px;
        text-align: right;
      }

      .parameter-slider {
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: var(--divider-color);
        outline: none;
        -webkit-appearance: none;
        appearance: none;
      }

      .parameter-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: var(--ha-border-radius-circle);
        background: var(--primary-color);
        cursor: pointer;
        box-shadow: var(--ha-box-shadow-s);
      }

      .parameter-slider::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: var(--ha-border-radius-circle);
        background: var(--primary-color);
        cursor: pointer;
        border: none;
        box-shadow: var(--ha-box-shadow-s);
      }

      .parameter-slider:focus::-webkit-slider-thumb {
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 20%, transparent);
      }

      .parameter-slider:focus::-moz-range-thumb {
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-color) 20%, transparent);
      }

      .alert-lab-actions {
        display: flex;
        gap: var(--ha-space-3);
        margin-bottom: var(--ha-space-3);
        flex-wrap: wrap;
      }

      .alert-lab-actions ha-button {
        flex: 1;
        min-width: 140px;
      }

      .preview-section {
        background: color-mix(in srgb, var(--secondary-background-color) 50%, color-mix(in srgb, var(--primary-background-color) 25%, transparent));
        border: var(--ha-border-width-sm) solid var(--divider-color);
        border-radius: var(--ha-card-border-radius, 12px);
        padding: var(--ha-space-5);
      }

      .preview-section h4 {
        margin: 0 0 var(--ha-space-2) 0;
        color: var(--primary-text-color);
        font-size: 16px;
        font-weight: 500;
      }

      .preview-hint {
        margin: 0 0 var(--ha-space-4) 0;
        color: var(--secondary-text-color);
        font-size: var(--ha-font-size-m);
      }

      .preview-swatches-container {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-3);
      }

      .preview-swatch-group {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-3);
      }

      .swatch-group-title {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--primary-text-color);
        padding-bottom: var(--ha-space-2);
        border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
      }

      .preview-swatches-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: var(--ha-space-3);
      }

      .preview-swatch-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--ha-space-2);
      }

      .preview-swatch {
        width: 60px;
        height: 60px;
        border-radius: var(--ha-border-radius-md);
        border: var(--ha-border-width-md) solid var(--divider-color);
        box-shadow: var(--ha-box-shadow-s);
        transition: transform var(--ha-animation-duration-normal, 0.2s);
      }

      .preview-swatch:hover {
        transform: scale(1.1);
      }

      .swatch-label {
        font-size: var(--ha-font-size-s);
        color: var(--secondary-text-color);
        text-align: center;
      }

      /* Color Comparison Grid Styles */
      .comparison-grid-container {
        display: flex;
        flex-direction: column;
        border: var(--ha-border-width-sm) solid var(--divider-color);
        border-radius: var(--ha-border-radius-sm);
        overflow: auto;
      }

      .comparison-grid-header {
        display: grid;
        grid-template-columns: 200px 1fr 1fr;
        gap: var(--ha-space-3);
        padding: var(--ha-space-3) var(--ha-space-4);
        border-bottom: var(--ha-border-width-md) solid var(--divider-color);
        font-weight: 600;
        font-size: var(--ha-font-size-m);
      }

      .comparison-column-label {
        color: var(--primary-text-color);
      }

      .comparison-grid-body {
        display: flex;
        flex-direction: column;
      }

      .comparison-row {
        display: grid;
        grid-template-columns: 200px 1fr 1fr;
        gap: var(--ha-space-3);
        padding: var(--ha-space-3) var(--ha-space-4);
        border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
        transition: background-color var(--ha-animation-duration-normal, 0.2s);
      }

      .comparison-row:hover {
        background-color: var(--secondary-background-color);
      }

      .comparison-var-name {
        display: flex;
        align-items: center;
      }

      .comparison-var-name code {
        font-size: var(--ha-font-size-s);
        color: var(--primary-color);
        word-break: break-all;
      }

      .comparison-color-cell {
        display: flex;
        align-items: center;
        gap: var(--ha-space-3);
      }

      .comparison-swatch {
        width: 40px;
        height: 40px;
        border-radius: var(--ha-border-radius-sm);
        border: var(--ha-border-width-sm) solid var(--divider-color);
        flex-shrink: 0;
      }

      .comparison-hex {
        font-size: var(--ha-font-size-s);
        color: var(--secondary-text-color);
        font-family: monospace;
      }

      /* Color Wheel Visualization Styles */
      .visualization-section {
        padding: var(--ha-space-5);
        border-radius: var(--ha-card-border-radius, 12px);
        background: color-mix(in srgb, var(--secondary-background-color) 50%, color-mix(in srgb, var(--primary-background-color) 25%, transparent));
        border: var(--ha-border-width-sm) solid var(--divider-color);
      }

      .visualization-section h4 {
        margin: 0 0 var(--ha-space-2) 0;
        font-size: 16px;
        font-weight: 600;
      }

      .visualization-section .preview-hint {
        margin: 0 0 var(--ha-space-4) 0;
        font-size: var(--ha-font-size-m);
        color: var(--secondary-text-color);
      }

      .color-wheel-layout {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--ha-space-8);
        align-items: start;
      }

      .color-wheel-visual {
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .color-wheel-explanation {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-3);
      }

      .color-wheel-explanation h5 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--primary-text-color);
      }

      .color-wheel-explanation h6 {
        margin: 0 0 var(--ha-space-2) 0;
        font-size: 14px;
        font-weight: 600;
        color: var(--primary-text-color);
      }

      .explanation-section {
        padding: var(--ha-space-3) var(--ha-space-4);
        background: var(--secondary-background-color);
        border-radius: var(--ha-border-radius-sm);
        border-left: var(--ha-border-width-lg) solid var(--primary-color);
      }

      .explanation-section p {
        margin: 0;
        font-size: var(--ha-font-size-m);
        line-height: 1.5;
        color: var(--secondary-text-color);
      }

      .explanation-section ul {
        margin: var(--ha-space-2) 0 0 0;
        padding-left: var(--ha-space-5);
        font-size: var(--ha-font-size-m);
        line-height: 1.6;
      }

      .explanation-section li {
        margin-bottom: 6px;
        color: var(--secondary-text-color);
      }

      .explanation-tip {
        padding: var(--ha-space-3) var(--ha-space-4);
        background: color-mix(in srgb, var(--info-color) 10%, transparent);
        border-radius: var(--ha-border-radius-sm);
        border-left: var(--ha-border-width-lg) solid var(--info-color);
        font-size: var(--ha-font-size-m);
        line-height: 1.5;
        color: var(--secondary-text-color);
      }

      /* Responsive: stack on smaller screens */
      @media (max-width: 900px) {
        .color-wheel-layout {
          grid-template-columns: 1fr;
        }
      }

      /* ── Overrides View ───────────────────────────────────────── */
      .overrides-view {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-3);
        padding: var(--ha-space-3) 0;
      }

      .overrides-toolbar {
        display: flex;
        align-items: center;
        gap: var(--ha-space-3);
        padding: 0 var(--ha-space-4);
      }

      .overrides-filter-wrapper {
        flex: 1;
      }

      .overrides-summary {
        font-size: var(--ha-font-size-m);
        color: var(--secondary-text-color);
        white-space: nowrap;
      }

      .overrides-load-hint {
        padding: 0 var(--ha-space-4);
      }

      .overrides-table-wrapper {
        overflow-x: auto;
        padding: 0 var(--ha-space-4) var(--ha-space-4);
      }

      .overrides-table {
        width: 100%;
      }

      .override-token-row.has-override {
        background: color-mix(in srgb, var(--accent-color) 6%, transparent);
      }

      .override-token-row.is-editing {
        background: color-mix(in srgb, var(--accent-color) 12%, transparent);
      }

      .override-path-cell {
        vertical-align: middle;
      }

      .override-token-path {
        font-family: monospace;
        font-size: var(--ha-font-size-s);
      }

      .override-origin-badge {
        display: inline-block;
        margin-left: 6px;
        padding: 1px 6px;
        border-radius: var(--ha-border-radius-pill);
        background: var(--accent-color);
        color: var(--text-accent-color, var(--text-primary-color));
        font-size: var(--ha-font-size-xs);
        font-weight: 600;
        vertical-align: middle;
      }

      .override-default-cell,
      .override-value-cell {
        vertical-align: middle;
        max-width: 180px;
      }

      .override-color-swatch {
        display: inline-block;
        width: 14px;
        height: 14px;
        border-radius: 3px;
        border: var(--ha-border-width-sm) solid var(--divider-color);
        vertical-align: middle;
        margin-right: var(--ha-space-1);
      }

      .override-value-text {
        font-family: monospace;
        font-size: var(--ha-font-size-s);
        vertical-align: middle;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 160px;
        display: inline-block;
      }

      .override-value-active {
        color: var(--accent-color);
        font-weight: 600;
      }

      .override-value-empty {
        color: var(--disabled-text-color);
      }

      .override-actions-cell {
        vertical-align: middle;
        white-space: nowrap;
      }

      .override-actions {
        display: flex;
        align-items: center;
        gap: 2px;
      }

      .override-edit-panel-row td {
        padding: 0;
      }

      .override-edit-panel {
        margin: var(--ha-space-1) var(--ha-space-2) var(--ha-space-3);
        padding: var(--ha-space-4);
        border: var(--ha-border-width-sm) solid var(--accent-color);
        border-radius: 6px;
        background: var(--card-background-color);
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-3);
      }

      .override-edit-panel-header {
        display: flex;
        align-items: baseline;
        gap: var(--ha-space-4);
        flex-wrap: wrap;
      }

      .override-edit-token-path {
        font-family: monospace;
        font-size: var(--ha-font-size-m);
        font-weight: 600;
      }

      .override-edit-default {
        font-size: var(--ha-font-size-s);
        color: var(--secondary-text-color);
      }

      .override-edit-default code {
        font-family: monospace;
      }

      .override-edit-control {
        min-height: 40px;
      }

      .override-edit-actions {
        display: flex;
        gap: var(--ha-space-2);
      }
      `]}firstUpdated(){this._loadTokens()}render(){return o`
      <div class="studio-layout">
        <div class="dialog-content">
          ${this._renderDialogHeader()}
          ${this._activeView==="tokens"?this._renderCategoryFilters():""}
          ${this._activeView==="all-vars"?this._renderAllVarsCategoryFilters():""}
          ${this._activeView==="css-vars"?this._renderFamilyFilters(this._cssVariables.filter(e=>e.category==="lcars")):""}
          ${this._activeView==="all-vars"?this._renderFamilyFilters(this._allCssVariables):""}
          ${this._renderDialogBody()}
        </div>
      </div>
    `}_renderDialogHeader(){return o`
      <div class="dialog-header">
        <!-- Using HA native tab components (Issue #82) -->
        <ha-tab-group @wa-tab-show=${this._handleTabChange}>
          <ha-tab-group-tab value="alert-lab" ?active=${this._activeView==="alert-lab"}>
            <ha-icon icon="mdi:flask-outline"></ha-icon>
            LCARdS Alert Mode Lab
          </ha-tab-group-tab>
          <ha-tab-group-tab value="generator" ?active=${this._activeView==="generator"}>
            <ha-icon icon="mdi:auto-fix"></ha-icon>
            HA-LCARS Theme Lab
          </ha-tab-group-tab>
          <ha-tab-group-tab value="tokens" ?active=${this._activeView==="tokens"}>
            LCARdS Theme Tokens (${this._tokens.length})
          </ha-tab-group-tab>
          <ha-tab-group-tab value="css-vars" ?active=${this._activeView==="css-vars"}>
            LCARS CSS Variables (${this._cssVariables.length})
          </ha-tab-group-tab>
          <ha-tab-group-tab value="all-vars" ?active=${this._activeView==="all-vars"}>
            All CSS Variables (${this._allCssVariables.length})
          </ha-tab-group-tab>
          <ha-tab-group-tab value="overrides" ?active=${this._activeView==="overrides"}>
            Token Overrides
          </ha-tab-group-tab>
        </ha-tab-group>
        ${this._activeView==="css-vars"?o`
          <lcards-form-section
            .header=${"Alert Mode Transformation Values"}
            .description=${"HSL transformation parameters for each alert mode"}
            ?expanded=${this._alertModePreviewExpanded}
            @expanded-changed=${this._toggleAlertModePreviewSection}>
            <div class="hsl-formula-table">
              <table>
                <thead>
                  <tr>
                    <th>Mode</th>
                    <th>Hue Shift</th>
                    <th>Hue Strength</th>
                    <th>Saturation ×</th>
                    <th>Lightness ×</th>
                    <th>Additional Settings</th>
                  </tr>
                </thead>
                <tbody>
                  ${Ne.map(e=>this._renderAlertModeConfigRow(e))}
                </tbody>
              </table>
            </div>
          </lcards-form-section>
        `:""}
        ${this._activeView!=="alert-lab"&&this._activeView!=="overrides"&&this._activeView!=="generator"?o`
          <div class="search-container">
            <div class="search-wrapper">
              <ha-input
                class="dialog-search"
                .value=${this._searchQuery}
                @input=${this._handleSearchInput}
                placeholder="${this._activeView==="tokens"?"Search tokens... (Ctrl+F)":this._activeView==="all-vars"?"Search all variables... (Ctrl+F)":"Search CSS variables... (Ctrl+F)"}"
                .label=${"Search"}>
                <ha-icon slot="leadingIcon" icon="mdi:magnify"></ha-icon>
              </ha-input>
              ${this._searchQuery?o`
                <ha-icon-button
                  class="search-clear"
                  @click=${this._clearSearch}
                  .label=${"Clear search"}
                  .path=${"M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"}>
                </ha-icon-button>
              `:""}
            </div>
            ${this._renderResultCount()}
          </div>
        `:""}
      </div>
    `}_renderResultCount(){if(!this._searchQuery)return"";let e,t;return this._activeView==="tokens"?(e=this._tokens.length,t=this._filteredTokens.length):this._activeView==="css-vars"?(e=this._cssVariables.length,t=this._filteredCssVars.length):(e=this._allCssVariables.length,t=this._filteredAllVars.length),o`
      <div class="search-result-count">
        Showing ${t} of ${e}
      </div>
    `}_clearSearch(){var t;this._searchQuery="",this._activeView==="tokens"?this._applyFilters():this._activeView==="css-vars"?this._applyCssVarFilters():this._activeView==="all-vars"&&this._applyAllVarsFilters();const e=(t=this.shadowRoot)==null?void 0:t.querySelector(".dialog-search");e&&e.focus()}_renderCategoryFilters(){const e=this._getCategories(),t=[{label:"All",value:"all",count:this._tokens.length},...e];return ne({className:"category-filters",options:t.map(a=>({value:a.value,label:`${a.label} (${a.count})`})),selected:this._selectedCategory,onSelect:b(a=>this._selectCategory(a),"onSelect")})}_renderAllVarsCategoryFilters(){const e=this._allCssVariables||[],t={"ha-legacy":{label:"Home Assistant Legacy",count:0},"ha-color":{label:"Home Assistant Color",count:0},"ha-space":{label:"Home Assistant Spacing",count:0},"ha-shape":{label:"Home Assistant Shape",count:0},"ha-motion":{label:"Home Assistant Motion",count:0},"ha-type":{label:"Home Assistant Typography",count:0},"ha-elevation":{label:"Home Assistant Elevation",count:0},"ha-system":{label:"Home Assistant System",count:0},material:{label:"Material",count:0},wa:{label:"WebAwesome",count:0},states:{label:"States",count:0},"card-mod":{label:"Card-Mod",count:0},lcars:{label:"LCARS",count:0},lcards:{label:"LCARdS",count:0},app:{label:"App",count:0},other:{label:"Other",count:0}};e.forEach(r=>{t[r.category]&&t[r.category].count++});const a=[{label:"All",value:"all",count:e.length},...Object.entries(t).filter(([r,s])=>s.count>0).map(([r,s])=>({label:s.label,value:r,count:s.count}))];return ne({className:"category-filters",options:a.map(r=>({value:r.value,label:`${r.label} (${r.count})`})),selected:this._selectedAllVarsCategory,onSelect:b(r=>this._selectAllVarsCategory(r),"onSelect")})}_renderDialogBody(){var e;if(this._activeView==="css-vars")return this._renderCssVarsView();if(this._activeView==="all-vars")return this._renderAllVarsView();if(this._activeView==="alert-lab")return this._renderAlertLab();if(this._activeView==="generator")return import("./lcards-theme-generator-view-DuINrh9x.js").catch(t=>d.error("[ThemeTokenBrowser] Failed to load the theme generator:",t)),o`
        <div class="dialog-body">
          <lcards-theme-generator-view .hass=${this.hass}></lcards-theme-generator-view>
        </div>
      `;if(this._activeView==="overrides")return this._renderOverridesView();try{if(d.debug("[ThemeTokenBrowser] Rendering dialog body",{filteredTokens:(e=this._filteredTokens)==null?void 0:e.length}),!this._filteredTokens||this._filteredTokens.length===0)return o`
          <div class="empty-state">
            <ha-icon icon="mdi:${this._searchQuery?"magnify-remove-outline":"palette"}"></ha-icon>
            <p>${this._searchQuery?`No tokens found matching "${this._searchQuery}"`:"No tokens found"}</p>
            <p style="font-size: var(--ha-font-size-m); color: var(--secondary-text-color); max-width: 400px;">
              ${this._searchQuery?"Try a different search term, or clear the search to see all tokens.":this._selectedCategory!=="all"?'Try selecting a different category or "All" to see more tokens.':"No theme tokens are available in the current theme."}
            </p>
          </div>
        `;const t=this._groupTokensByCategory(this._getSortedTokens());return o`
        <div class="dialog-body">
          ${Object.entries(t).map(([a,r])=>{const s=this._expandedTokenCategories.has(`token-${a}`);return o`
              <lcards-form-section
                .header=${this._formatCategoryName(a)}
                .secondary=${`${r.length} tokens`}
                ?expanded=${s}
                @expanded-changed=${()=>this._toggleTokenCategory(a)}>
                <table class="token-table">
                  <thead>
                    <tr>
                      <th @click=${()=>this._sortBy("path")}>
                        Token Path
                        ${this._sortColumn==="path"?o`<span class="sort-indicator">${this._sortDirection==="asc"?"▲":"▼"}</span>`:""}
                      </th>
                      <th @click=${()=>this._sortBy("value")}>
                        Value
                        ${this._sortColumn==="value"?o`<span class="sort-indicator">${this._sortDirection==="asc"?"▲":"▼"}</span>`:""}
                      </th>
                      <th>Preview</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${r.map(i=>this._renderTokenRow(i))}
                  </tbody>
                </table>
              </lcards-form-section>
            `})}
        </div>
      `}catch(t){return d.error("[ThemeTokenBrowser] Error rendering dialog body:",t),o`
        <div class="empty-state">
          <ha-icon icon="mdi:alert-circle"></ha-icon>
          <p>Error loading tokens</p>
          <p style="font-size: var(--ha-font-size-s);">Check console for details</p>
        </div>
      `}}_formatTokenValue(e){if(e==null)return"(no value)";if(typeof e=="object"){if(Array.isArray(e))return`[Array: ${e.length} items]`;try{const t=JSON.stringify(e,null,2);return t.length<100?t:`{Object: ${Object.keys(e).length} keys}`}catch{return"[Complex Object]"}}return String(e)}_renderTokenRow(e){const t=this._formatTokenValue(e.value),a=e.resolvedFrom&&e.resolvedFrom!==e.value,r=this._formatTokenValue(e.rawValue!==void 0?e.rawValue:e.value);return o`
      <tr>
        <td class="token-path-cell">theme:${e.path}</td>
        <td class="token-value-cell">
          ${a?o`
            <div class="token-resolution">
              <div class="raw-value" title="Raw value in theme">
                ${r}
              </div>
              <div class="resolution-arrow">↓ resolves to</div>
              <div class="resolved-value" title="Fully resolved value">
                ${t}
              </div>
            </div>
          `:o`
            <div title="${t}">${t}</div>
          `}
        </td>
        <td class="token-preview-cell">
          ${this._renderTokenPreview(e)}
        </td>
        <td class="token-actions-cell">
          <div class="token-actions">
            <ha-icon-button
              @click=${s=>this._copyTokenSyntax(e.path,s)}
              .label=${"Copy token syntax"}
              .path=${"M8 3C9.66 3 11 4.34 11 6S9.66 9 8 9 5 7.66 5 6 6.34 3 8 3M8 11C10.76 11 16 12.36 16 15V17H0V15C0 12.36 5.24 11 8 11M6 8C6 9.11 6.9 10 8 10 9.11 10 10 9.11 10 8V7H12V8C12 10.21 10.21 12 8 12S4 10.21 4 8V7H6V8M13.54 5.29C13.54 6.31 13.08 7.2 12.38 7.83L13.5 8.95L14.91 7.54C16.18 6.27 16.95 4.55 16.95 2.67V1H15.28V2.67C15.28 4.03 14.77 5.3 13.91 6.24L12.5 7.65C12.13 7.28 11.85 6.82 11.68 6.31L10 6.31C10.15 7.19 10.6 7.97 11.26 8.55L9.85 9.96C9.11 9.32 8.54 8.47 8.22 7.5H6.5C6.82 8.93 7.65 10.2 8.85 11.09L10.26 9.68C9.6 9.09 9.08 8.32 8.75 7.45L10.43 7.45C10.77 8.31 11.37 9.05 12.15 9.55L13.56 8.14C14.63 7.07 15.21 5.63 15.21 4.04V2.37H13.54V4.04C13.54 4.47 13.54 4.88 13.54 5.29Z"}>
            </ha-icon-button>
            <ha-icon-button
              @click=${s=>this._copyValue(e.value,s)}
              .label=${"Copy value"}
              .path=${"M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"}>
            </ha-icon-button>
          </div>
        </td>
      </tr>
    `}_renderTokenPreview(e){try{const t=String(e.finalValue||e.value||"");return e.category==="colors"||this._isColorValue(t)?this._alertModePreviewExpanded?this._renderAlertModeSwatches(t,e.path):o`
          <div
            class="color-preview"
            style="background-color: ${t}; cursor: pointer;"
            title="${t} (click to copy hex value)"
            @click=${a=>this._copyResolvedColor(t,a)}>
          </div>
        `:e.category==="fonts"||e.category==="typography"?this._renderTextPreview(e):o``}catch(t){return d.warn("[ThemeTokenBrowser] Error rendering preview:",t),o``}}_renderAlertModeSwatches(e,t,a=false){var l;const r=Ne.map(c=>({name:c.value,label:c.label,shortLabel:c.short})),s=this._getCurrentAlertMode(),i=a?t:`--lcards-${t.split(".").pop()}`,n=((l=this._originalLcarsColors)==null?void 0:l[i])||e;return o`
      <div>
        <div class="alert-mode-swatches">
          ${r.map(c=>{const h=c.name==="green_alert"?n:this._getAlertModeColor(n,i,c.name),p=c.name===s;return o`
              <div
                class="alert-swatch ${p?"active-mode":""}"
                style="background-color: ${h};"
                title="${c.label}: ${h}"
                @click=${g=>this._copyResolvedColor(h,g)}>
              </div>
            `})}
        </div>
        <div class="alert-mode-legend">
          ${r.map(c=>o`
            <div class="alert-legend-label">${c.shortLabel}</div>
          `)}
        </div>
      </div>
    `}_renderTextPreview(e){try{const t=e.path.toLowerCase(),a=e.value;let r="";if(t.includes("family")&&typeof a=="string")r=`font-family: ${a};`;else if(t.includes("size")&&typeof a=="string")r=`font-size: ${a};`;else if(t.includes("weight")&&(typeof a=="string"||typeof a=="number"))r=`font-weight: ${a};`;else if(t.includes("line-height")&&typeof a=="string")r=`line-height: ${a};`;else return o``;return o`
        <div class="text-preview" style="${r}">Aa</div>
      `}catch(t){return d.warn("[ThemeTokenBrowser] Error rendering text preview:",t),o``}}_renderCssVarsView(){const e=this._filteredCssVars||this._cssVariables||[];if(e.length===0)return o`
        <div class="empty-state">
          <ha-icon icon="mdi:palette-swatch-outline"></ha-icon>
          <p>No CSS variables found</p>
        </div>
      `;const t=b(i=>{var n;return this._selectedFamily==="all"||i.isColor&&((n=i.colorSortKey)==null?void 0:n.family)===this._selectedFamily},"matchesFamily");let a=e.filter(i=>i.category==="lcars"&&t(i)),r=e.filter(i=>i.category==="lcards"&&t(i));const s=this._getCssVarComparator();return a=[...a].sort(s),r=[...r].sort(s),o`
      <div class="dialog-body">
        <div class="css-vars-columns">
          <div class="css-vars-column">
            ${a.length>0?o`
              <h4>HA-LCARS Theme (${a.length})</h4>
              <table class="token-table">
                <thead>
                  <tr>
                    ${this._renderCssVarSortHeader("name","Variable Name")}
                    ${this._renderCssVarSortHeader("value","Value")}
                    ${this._renderCssVarSortHeader("hue","Preview")}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${a.map(i=>this._renderCssVarRow(i))}
                </tbody>
              </table>
            `:o`
              <h4>HA-LCARS Theme (0)</h4>
              <div style="padding: 24px; text-align: center; color: var(--secondary-text-color);">
                No HA-LCARS variables found
              </div>
            `}
          </div>

          <div class="css-vars-column">
            ${r.length>0?o`
              <h4>LCARdS Injected (${r.length})</h4>
              <table class="token-table">
                <thead>
                  <tr>
                    ${this._renderCssVarSortHeader("name","Variable Name")}
                    ${this._renderCssVarSortHeader("value","Value")}
                    ${this._renderCssVarSortHeader("hue","Preview")}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${r.map(i=>this._renderCssVarRow(i))}
                </tbody>
              </table>
            `:o`
              <h4>LCARdS Injected (0)</h4>
              <div style="padding: 24px; text-align: center; color: var(--secondary-text-color);">
                No LCARdS variables found
              </div>
            `}
          </div>
        </div>
      </div>
    `}_renderAllVarsView(){let e=this._filteredAllVars||this._allCssVariables||[];if(this._selectedFamily!=="all"&&(e=e.filter(r=>{var s;return!r.isColor||((s=r.colorSortKey)==null?void 0:s.family)===this._selectedFamily})),e.length===0)return o`
        <div class="empty-state">
          <ha-icon icon="mdi:palette-swatch-outline"></ha-icon>
          <p>No CSS variables found</p>
        </div>
      `;const t={"ha-legacy":{title:"Home Assistant Legacy Semantic (--primary-*, --text-*, etc.)",vars:[]},"ha-color":{title:"Home Assistant Color System (--ha-color-*)",vars:[]},"ha-space":{title:"Home Assistant Spacing Scale (--ha-space-*)",vars:[]},"ha-shape":{title:"Home Assistant Shape: Border Radius & Width",vars:[]},"ha-motion":{title:"Home Assistant Motion: Animation Durations",vars:[]},"ha-type":{title:"Home Assistant Typography: Font & Line Height",vars:[]},"ha-elevation":{title:"Home Assistant Elevation: Box Shadows",vars:[]},"ha-system":{title:"Home Assistant System (icons, chips, dialogs, …)",vars:[]},material:{title:"Material Design (--mdc-*, --md-*)",vars:[]},wa:{title:"WebAwesome (--wa-*)",vars:[]},states:{title:"Entity State Colours (--state-*)",vars:[]},"card-mod":{title:"Card-Mod Variables",vars:[]},lcars:{title:"HA-LCARS Theme (--lcars-*)",vars:[]},lcards:{title:"LCARdS Injected (--lcards-*)",vars:[]},app:{title:"App-Specific (--app-*)",vars:[]},other:{title:"Other Variables",vars:[]}};e.forEach(r=>{t[r.category]&&t[r.category].vars.push(r)});const a=this._selectedAllVarsCategory==="all"?t:{[this._selectedAllVarsCategory]:t[this._selectedAllVarsCategory]};return o`
      <div class="dialog-body">
        ${Object.entries(a).map(([r,s])=>{if(!s||s.vars.length===0)return"";const i=this._expandedCategories.has(r);return o`
            <lcards-form-section
              .header=${s.title}
              .secondary=${`${s.vars.length} variables`}
              ?expanded=${i}
              @expanded-changed=${()=>this._toggleCategory(r)}>
              <table class="token-table">
                <thead>
                  <tr>
                    <th>Variable Name</th>
                    <th>Value</th>
                    <th>Preview</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${s.vars.map(n=>this._renderCssVarRow(n))}
                </tbody>
              </table>
            </lcards-form-section>
          `})}
      </div>
    `}_toggleCategory(e){this._expandedCategories.has(e)?this._expandedCategories.delete(e):this._expandedCategories.add(e),this.requestUpdate()}_toggleTokenCategory(e){const t=`token-${e}`;this._expandedTokenCategories.has(t)?this._expandedTokenCategories.delete(t):this._expandedTokenCategories.add(t),this.requestUpdate()}_renderCssVarRow(e){return o`
      <tr>
        <td class="token-path-cell">
          <code>${e.name}</code>
        </td>
        <td class="token-value-cell">
          <div title="${e.value}">${e.value}</div>
        </td>
        <td class="token-preview-cell">
          ${e.isColor?this._alertModePreviewExpanded?this._renderAlertModeSwatches(e.value,e.name,true):o`
                <div
                  class="color-preview"
                  style="background-color: var(${e.name});"
                  title="Live preview of ${e.name}">
                </div>
              `:""}
        </td>
        <td class="token-actions-cell">
          <div class="token-actions">
            <ha-icon-button
              @click=${t=>this._copyCssVar(e.name,t)}
              .label=${"Copy CSS variable syntax"}
              title="Copy var(${e.name})"
              .path=${"M12,2A2,2 0 0,1 14,4V8H20A2,2 0 0,1 22,10V20A2,2 0 0,1 20,22H4A2,2 0 0,1 2,20V10A2,2 0 0,1 4,10H10V4A2,2 0 0,1 12,2M12,4V8H14V4H12M4,10V20H20V10H4M7,12H9V18H7V12M11,12H13V18H11V12M15,12H17V18H15V12Z"}>
            </ha-icon-button>
            <ha-icon-button
              @click=${t=>this._copyValue(e.value,t)}
              .label=${"Copy value"}
              .path=${"M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"}>
            </ha-icon-button>
          </div>
        </td>
      </tr>
    `}_renderAlertLab(){var t;const e=Z(this._selectedAlertMode);return o`
      <div class="alert-lab-container">
        <!-- LEFT COLUMN: Controls -->
        <div class="alert-lab-left-column">
          <!-- Mode Selection Section -->
          <lcards-form-section
            .header=${"Alert mode"}
            .description=${"The mode to tune, and whether choosing it applies it"}
            ?expanded=${true}
            noCollapse
          >
            <div class="mode-selection-controls">
              <ha-selector
                .hass=${this.hass}
                .label=${"Alert mode"}
                .value=${this._selectedAlertMode}
                .selector=${{select:{mode:"dropdown",options:Ne.map(a=>({value:a.value,label:a.label}))}}}
                @value-changed=${this._handleModeChange}
              ></ha-selector>

              <ha-selector
                .hass="${this.hass}"
                .label="${"Apply the mode when selected"}"
                .value="${this._livePreviewEnabled}"
                .selector=${{boolean:{}}}
                @value-changed="${a=>this._livePreviewEnabled=a.detail.value}"
              ></ha-selector>
            </div>
          </lcards-form-section>

          <!-- Parameter Controls -->
          ${this._selectedAlertMode!=="green_alert"?o`
            <div class="parameter-controls">
              <lcards-form-section
                .header=${"Core Transform Parameters"}
                .description=${"Fundamental HSL transformation settings"}
                ?expanded=${true}
              >
                ${this._renderParameterSlider("hueShift","Hue Target",0,360,1,"°",e.hueShift)}
                ${this._renderParameterSlider("hueStrength","Hue Strength",0,1,.05,"",e.hueStrength)}
                ${this._renderParameterSlider("saturationMultiplier","Saturation",0,3,.05,"×",e.saturationMultiplier)}
                ${this._renderParameterSlider("lightnessMultiplier","Lightness",0,2,.05,"×",e.lightnessMultiplier)}
              </lcards-form-section>

              ${e.hueAnchor?o`
                <lcards-form-section
                  .header=${"Hue Anchoring"}
                  .description=${"Pull colors toward a target hue range"}
                  ?expanded=${false}
                >
                  ${this._renderParameterSlider("hueAnchor.centerHue","Center Hue",0,360,1,"°",e.hueAnchor.centerHue)}
                  ${this._renderParameterSlider("hueAnchor.range","Range",0,180,5,"°",e.hueAnchor.range)}
                  ${this._renderParameterSlider("hueAnchor.strength","Pull Strength",0,1,.05,"",e.hueAnchor.strength)}
                </lcards-form-section>
              `:""}

              ${(t=e.contrastEnhancement)!=null&&t.enabled?o`
                <lcards-form-section
                  .header=${"Contrast Enhancement"}
                  .description=${"Improve readability in dark modes"}
                  ?expanded=${false}
                >
                  ${this._renderParameterSlider("contrastEnhancement.threshold","Threshold",0,100,1,"%",e.contrastEnhancement.threshold)}
                  ${this._renderParameterSlider("contrastEnhancement.darkMultiplier","Dark Multiplier",0,1,.05,"",e.contrastEnhancement.darkMultiplier)}
                  ${this._renderParameterSlider("contrastEnhancement.lightMultiplier","Light Multiplier",1,2,.05,"",e.contrastEnhancement.lightMultiplier)}
                </lcards-form-section>
              `:""}
            </div>
          `:o`
            <div class="parameter-controls">
              <lcards-message type="info" message="Green alert is the baseline: the theme's own colours. Pick another mode to tune it."></lcards-message>
            </div>
          `}

          <!-- Action Buttons -->
          <div class="alert-lab-actions">
            <ha-button @click="${this._applyAlertMode}">
              <ha-icon icon="mdi:play" slot="start"></ha-icon>
              Apply Live
            </ha-button>
            <ha-button @click="${this._resetToDefaults}">
              <ha-icon icon="mdi:restore" slot="start"></ha-icon>
              Reset
            </ha-button>
            <ha-button @click="${this._saveToHelpers}">
              <ha-icon icon="mdi:content-save" slot="start"></ha-icon>
              Save to helpers
            </ha-button>
          </div>

          <!-- Helper Save Feedback Message -->
          ${this._helperSaveMessage?o`
            <lcards-message
              .type=${this._helperSaveMessage.type}
              .message=${this._helperSaveMessage.message}
              @dismissed=${()=>{this._helperSaveMessage=null,this.requestUpdate()}}
            ></lcards-message>
          `:""}
        </div>

        <!-- RIGHT COLUMN: Visualizations -->
        <div class="alert-lab-right-column">
          <!-- Visualization Tabs using HA native components (Issue #82) -->
          <ha-tab-group @wa-tab-show=${this._handleVizTabChange}>
            <ha-tab-group-tab value="preview" ?active=${this._activeVizTab==="preview"}>
              Live Preview
            </ha-tab-group-tab>
            <ha-tab-group-tab value="wheel" ?active=${this._activeVizTab==="wheel"}>
              HSL Wheel
            </ha-tab-group-tab>
            <ha-tab-group-tab value="comparison" ?active=${this._activeVizTab==="comparison"}>
              Full Comparison
            </ha-tab-group-tab>
          </ha-tab-group>

          <!-- Tab Content - Wrapped in scrollable container like main tabs -->
          <div class="alert-lab-viz-content">
            ${this._activeVizTab==="preview"?o`
              <div class="preview-section">
                <h4>Live Preview</h4>
                <p class="preview-hint">Key LCARS colors in selected alert mode:</p>
                ${this._renderAlertModePreviewSwatches()}
              </div>
            `:""}

            ${this._activeVizTab==="wheel"?o`
              <div class="visualization-section">
                <h4>HSL colour wheel</h4>
                <p class="preview-hint">How the Live Preview colours move in HSL space. Click a legend item to hide or show it.</p>
                ${this._renderColorWheel()}
              </div>
            `:""}

            ${this._activeVizTab==="comparison"?o`
              <div class="comparison-section">
                <lcards-form-section
                  .header=${"Full Color Comparison"}
                  .description=${"Side-by-side comparison of all LCARS color variables"}
                  ?expanded=${true}
                >
                  ${this._renderColorComparisonGrid()}
                </lcards-form-section>
              </div>
            `:""}
          </div>
        </div>
      </div>
    `}_renderParameterSlider(e,t,a,r,s,i,n){return o`
      <ha-selector
        .hass="${this.hass}"
        .label="${t}"
        .value="${n||a}"
        .selector=${{number:{min:a,max:r,step:s,mode:"slider",unit_of_measurement:i}}}
        @value-changed="${l=>this._handleParamChange(e,l.detail.value)}"
      ></ha-selector>
    `}_renderAlertModePreviewSwatches(){const e=lt();return o`
      <div class="preview-swatches-container">
        ${e.map(t=>o`
          <div class="preview-swatch-group">
            <h5 class="swatch-group-title">${t.title}</h5>
            <div class="preview-swatches-grid">
              ${t.colors.map(a=>{var i;const r=((i=this._originalLcarsColors)==null?void 0:i[a.cssVar])||getComputedStyle(document.documentElement).getPropertyValue(a.cssVar).trim(),s=pe(r,this._selectedAlertMode);return o`
                  <div class="preview-swatch-item">
                    <div
                      class="preview-swatch"
                      style="background-color: ${s}"
                      title="${a.name}: ${s}"
                    ></div>
                    <span class="swatch-label">${a.name}</span>
                  </div>
                `})}
            </div>
          </div>
        `)}
      </div>
    `}_renderColorComparisonGrid(){if(!this._originalLcarsColors||Object.keys(this._originalLcarsColors).length===0)return o`
        <lcards-message type="warning" message="The theme's original colours weren't captured. Reload the page to compare."></lcards-message>
      `;const e=Object.keys(this._originalLcarsColors).sort();return o`
      <div class="comparison-grid-container">
        <div class="comparison-grid-header">
          <div class="comparison-column-label">Variable Name</div>
          <div class="comparison-column-label">Original (Green Alert)</div>
          <div class="comparison-column-label">Transformed (${this._selectedAlertMode.replace("_"," ").replace(/\b\w/g,t=>t.toUpperCase())})</div>
        </div>
        <div class="comparison-grid-body">
          ${e.map(t=>{const a=this._originalLcarsColors[t],r=pe(a,this._selectedAlertMode);return o`
              <div class="comparison-row">
                <div class="comparison-var-name">
                  <code>${t}</code>
                </div>
                <div class="comparison-color-cell">
                  <div class="comparison-swatch" style="background-color: ${a}"></div>
                  <code class="comparison-hex">${a}</code>
                </div>
                <div class="comparison-color-cell">
                  <div class="comparison-swatch" style="background-color: ${r}"></div>
                  <code class="comparison-hex">${r}</code>
                </div>
              </div>
            `})}
        </div>
      </div>
    `}_renderColorWheel(){if(!this._originalLcarsColors||Object.keys(this._originalLcarsColors).length===0)return o`
        <lcards-message type="warning" message="The theme's original colours weren't captured. Reload the page to see the wheel."></lcards-message>
      `;const t=lt().flatMap(s=>s.colors).filter(s=>this._originalLcarsColors[s.cssVar]).map(s=>({color:this._originalLcarsColors[s.cssVar],varName:s.cssVar,name:s.name})),a=t.map(s=>({color:pe(s.color,this._selectedAlertMode),name:s.name})),r=Z(this._selectedAlertMode);return o`
      <div class="color-wheel-layout">
        <div class="color-wheel-visual">
          <alert-mode-color-wheel
            .originalColors=${t}
            .transformedColors=${a}
            .anchorConfig=${r.hueAnchor||null}
            .hueShift=${r.hueShift}
            .showArrows=${true}
          ></alert-mode-color-wheel>
        </div>

        <div class="color-wheel-explanation">
          ${It({header:"Reading the wheel",icon:"mdi:help-circle-outline",open:true,body:o`
              <ul>
                <li><strong>Circles</strong> (black border): the theme's colours in green alert.</li>
                <li><strong>Squares</strong> (white border): the same colours in ${this._getModeName(this._selectedAlertMode)}.</li>
                <li><strong>Arrows</strong>: how each colour moves. Hover a shape to enlarge it.</li>
                <li><strong>Distance from the centre</strong> is saturation (grey in the middle, vivid at the edge); <strong>angle</strong> is hue (0° red, 120° green, 240° blue).</li>
              </ul>
              ${r.hueAnchor?o`<p><strong>Hue anchor:</strong> the shaded arc is the target range (${r.hueAnchor.centerHue-r.hueAnchor.range}° to ${r.hueAnchor.centerHue+r.hueAnchor.range}°); colours are pulled toward it at ${Math.round(r.hueAnchor.strength*100)}% strength.</p>`:""}
              ${r.hueShift!==void 0?o`<p><strong>Hue shift:</strong> toward ${r.hueShift}° (${this._getHueName(r.hueShift)}) at ${Math.round(r.hueStrength*100)}% strength.</p>`:""}
              <p><strong>Saturation</strong> ${r.saturationMultiplier}× (${r.saturationMultiplier>1?"more vivid":"more muted"}), <strong>lightness</strong> ${r.lightnessMultiplier}× (${r.lightnessMultiplier>1?"brighter":"darker"}).</p>
              <p class="info-guide-tip">Move the sliders and watch the squares follow.</p>
            `})}
        </div>
      </div>
    `}_getModeName(e){return{green_alert:"Green Alert",red_alert:"Red Alert",blue_alert:"Blue Alert",yellow_alert:"Yellow Alert",gray_alert:"Gray Alert",black_alert:"Black Alert"}[e]||e}_getHueName(e){return e<30||e>=330?"Red":e<60?"Orange":e<90?"Yellow":e<150?"Green":e<210?"Cyan":e<270?"Blue":e<330?"Magenta":"Red"}_loadAlertLabFromHelpers(){var t,a;if(!((a=(t=window.lcards)==null?void 0:t.core)!=null&&a.helperManager)){d.debug("[AlertLab] HelperManager not available, skipping helper load");return}const e=window.lcards.core.helperManager;["red","yellow","blue","gray","black"].forEach(r=>{const s=`alert_lab_${r}_hue`,i=`alert_lab_${r}_hue_strength`,n=`alert_lab_${r}_saturation`,l=`alert_lab_${r}_lightness`;if(e.helperExists(s)){const c=parseFloat(e.getHelperValue(s)),h=e.helperExists(i)?parseFloat(e.getHelperValue(i)):0,p=parseFloat(e.getHelperValue(n))/100,g=parseFloat(e.getHelperValue(l))/100,v=`${r}_alert`;I(v,"hueShift",c),I(v,"hueStrength",h),I(v,"saturationMultiplier",p),I(v,"lightnessMultiplier",g),d.debug(`[AlertLab] Loaded ${v} from helpers:`,{hue:c,hueStrength:h,saturation:p,lightness:g})}if(["red","yellow","blue"].includes(r)){const c=`alert_lab_${r}_center_hue`,h=`alert_lab_${r}_range`,p=`alert_lab_${r}_strength`;if(e.helperExists(c)){const g=parseFloat(e.getHelperValue(c)),v=parseFloat(e.getHelperValue(h)),_=parseFloat(e.getHelperValue(p)),m=`${r}_alert`;I(m,"hueAnchor",{centerHue:g,range:v,strength:_}),d.debug(`[AlertLab] Loaded ${m} hue anchor from helpers:`,{centerHue:g,range:v,strength:_})}}if(r==="black"){const c="alert_lab_black_threshold",h="alert_lab_black_dark_multiplier",p="alert_lab_black_light_multiplier";if(e.helperExists(c)){const g=parseFloat(e.getHelperValue(c)),v=parseFloat(e.getHelperValue(h)),_=parseFloat(e.getHelperValue(p));I("black_alert","contrastEnhancement",{enabled:true,threshold:g,darkMultiplier:v,lightMultiplier:_}),d.debug("[AlertLab] Loaded black_alert contrast enhancement from helpers:",{threshold:g,darkMultiplier:v,lightMultiplier:_})}}}),this.requestUpdate()}_handleTabChange(e){var a;e.stopPropagation();const t=(a=e.target.activeTab)==null?void 0:a.getAttribute("value");t&&this._switchView(t)}_switchView(e){this._activeView=e,this._searchQuery="",this._selectedFamily="all",e==="all-vars"&&(this._selectedAllVarsCategory="all"),e==="tokens"?this._applyFilters():e==="css-vars"?this._applyCssVarFilters():e==="all-vars"?this._applyAllVarsFilters():e==="overrides"&&this._scopeOverridesCache===null&&!this._overridesLoading&&this._loadScopeOverrides(),this.requestUpdate()}_handleSearchInput(e){this._searchQuery=e.target.value.toLowerCase(),this._activeView==="tokens"?this._applyFilters():this._activeView==="css-vars"?this._applyCssVarFilters():this._activeView==="all-vars"&&this._applyAllVarsFilters()}_selectCategory(e){this._selectedCategory=e,this._applyFilters()}_handleVizTabChange(e){var a;e.stopPropagation();const t=(a=e.target.activeTab)==null?void 0:a.getAttribute("value");t&&(this._activeVizTab=t,this.requestUpdate())}_selectAllVarsCategory(e){this._selectedAllVarsCategory=e,this.requestUpdate()}_matchesFamilySearch(e){var a;const t=(a=e.colorSortKey)==null?void 0:a.family;return t?ot[t].toLowerCase().includes(this._searchQuery):false}_selectFamily(e){this._selectedFamily=e,this.requestUpdate()}_buildFamilyFilters(e){const t={};let a=0;return e.forEach(r=>{var i;const s=(i=r.colorSortKey)==null?void 0:i.family;s&&(a++,t[s]=(t[s]||0)+1)}),[{label:"All",value:"all",count:a},...Ot.filter(r=>t[r]>0).map(r=>({label:ot[r],value:r,count:t[r]}))]}_renderFamilyFilters(e){const t=this._buildFamilyFilters(e);return ne({className:"category-filters color-family-filters",options:t.map(a=>({value:a.value,label:`${a.label} (${a.count})`,title:Ht[a.value]||"",swatch:a.value!=="all"?Dt[a.value]:void 0})),selected:this._selectedFamily,onSelect:b(a=>this._selectFamily(a),"onSelect")})}_sortBy(e){this._sortColumn===e?this._sortDirection=this._sortDirection==="asc"?"desc":"asc":(this._sortColumn=e,this._sortDirection="asc"),this.requestUpdate()}_sortCssVarsBy(e){this._cssVarSortColumn===e?this._cssVarSortDirection=this._cssVarSortDirection==="asc"?"desc":"asc":(this._cssVarSortColumn=e,this._cssVarSortDirection="asc"),this.requestUpdate()}_getCssVarComparator(){const e=this._cssVarSortDirection==="asc"?1:-1;switch(this._cssVarSortColumn){case"name":return(t,a)=>e*t.name.localeCompare(a.name);case"value":return(t,a)=>e*String(t.value).localeCompare(String(a.value));case"hue":default:return(t,a)=>e*(Mt(t.colorSortKey,a.colorSortKey)||t.name.localeCompare(a.name))}}_renderCssVarSortHeader(e,t){return o`
      <th @click=${()=>this._sortCssVarsBy(e)}>
        ${t}
        ${this._cssVarSortColumn===e?o`<span class="sort-indicator">${this._cssVarSortDirection==="asc"?"▲":"▼"}</span>`:""}
      </th>
    `}_getSortedTokens(){try{if(!this._filteredTokens||!Array.isArray(this._filteredTokens))return d.warn("[ThemeTokenBrowser] Invalid filtered tokens:",this._filteredTokens),[];const e=[...this._filteredTokens];return e.sort((t,a)=>{let r,s;this._sortColumn==="path"?(r=t.path||"",s=a.path||""):this._sortColumn==="value"&&(r=String(t.value||""),s=String(a.value||""));const i=r.localeCompare(s);return this._sortDirection==="asc"?i:-i}),e}catch(e){return d.error("[ThemeTokenBrowser] Error sorting tokens:",e),this._filteredTokens||[]}}_groupTokensByCategory(e){const t={};e.forEach(r=>{const s=r.path.split(".")[0]||"other";t[s]||(t[s]=[]),t[s].push(r)});const a={};return Object.keys(t).sort().forEach(r=>{a[r]=t[r]}),a}_formatCategoryName(e){return e.split(/[_-]/).map(t=>t.charAt(0).toUpperCase()+t.slice(1)).join(" ")}_getCategories(){const e={};return this._tokens.forEach(t=>{e[t.category]=(e[t.category]||0)+1}),Object.entries(e).map(([t,a])=>({value:t,label:t.charAt(0).toUpperCase()+t.slice(1),count:a}))}_applyFilters(){let e=this._tokens;this._selectedCategory!=="all"&&(e=e.filter(t=>t.category===this._selectedCategory)),this._searchQuery&&(e=e.filter(t=>t.path.toLowerCase().includes(this._searchQuery)||String(t.value).toLowerCase().includes(this._searchQuery))),this._filteredTokens=e,this.requestUpdate()}_scanCssVariables(){try{const e=[],t=getComputedStyle(document.documentElement);for(let a=0;a<t.length;a++){const r=t[a];if(r.startsWith("--lcars-")||r.startsWith("--lcards-")){const s=t.getPropertyValue(r).trim(),i=r.startsWith("--lcars-")?"HA-LCARS Theme":"LCARdS Injected",n=r.startsWith("--lcars-")?"lcars":"lcards",l=this._isColorValue(s);e.push({name:r,value:s,source:i,category:n,isColor:l,colorSortKey:l?nt(s):null})}}e.sort((a,r)=>a.name.localeCompare(r.name)),this._cssVariables=e,this._filteredCssVars=e,d.debug("[ThemeTokenBrowser] Scanned CSS variables",{total:e.length,lcars:e.filter(a=>a.category==="lcars").length,lcards:e.filter(a=>a.category==="lcards").length})}catch(e){d.error("[ThemeTokenBrowser] Error scanning CSS variables:",e),this._cssVariables=[],this._filteredCssVars=[]}}_detectHaTheme(){this._haThemeName=bt(this.hass)||"Default",d.debug("[ThemeTokenBrowser] Detected HA theme:",this._haThemeName)}_applyCssVarFilters(){let e=this._cssVariables;this._searchQuery&&(e=e.filter(t=>t.name.toLowerCase().includes(this._searchQuery)||t.value.toLowerCase().includes(this._searchQuery)||t.source.toLowerCase().includes(this._searchQuery)||this._matchesFamilySearch(t))),this._filteredCssVars=e,this.requestUpdate()}_scanAllCssVariables(){try{const e=[],t=getComputedStyle(document.documentElement);for(let a=0;a<t.length;a++){const r=t[a];if(r.startsWith("--")){const s=t.getPropertyValue(r).trim(),i=Pt(r),n=this._isColorValue(s);e.push({name:r,value:s,category:i,isColor:n,colorSortKey:n?nt(s):null})}}e.sort((a,r)=>{if(a.category!==r.category){const s=["ha-legacy","ha-color","ha-space","ha-shape","ha-motion","ha-type","ha-elevation","ha-system","material","wa","states","card-mod","lcars","lcards","app","other"];return s.indexOf(a.category)-s.indexOf(r.category)}return a.name.localeCompare(r.name)}),this._allCssVariables=e,this._filteredAllVars=e,d.debug("[ThemeTokenBrowser] Scanned all CSS variables",{total:e.length,byCategory:{"ha-legacy":e.filter(a=>a.category==="ha-legacy").length,"ha-color":e.filter(a=>a.category==="ha-color").length,"ha-space":e.filter(a=>a.category==="ha-space").length,"ha-shape":e.filter(a=>a.category==="ha-shape").length,"ha-motion":e.filter(a=>a.category==="ha-motion").length,"ha-type":e.filter(a=>a.category==="ha-type").length,"ha-elevation":e.filter(a=>a.category==="ha-elevation").length,"ha-system":e.filter(a=>a.category==="ha-system").length,material:e.filter(a=>a.category==="material").length,wa:e.filter(a=>a.category==="wa").length,states:e.filter(a=>a.category==="states").length,"card-mod":e.filter(a=>a.category==="card-mod").length,lcars:e.filter(a=>a.category==="lcars").length,lcards:e.filter(a=>a.category==="lcards").length,app:e.filter(a=>a.category==="app").length,other:e.filter(a=>a.category==="other").length}})}catch(e){d.error("[ThemeTokenBrowser] Error scanning all CSS variables:",e),this._allCssVariables=[],this._filteredAllVars=[]}}_applyAllVarsFilters(){let e=this._allCssVariables;this._searchQuery&&(e=e.filter(t=>t.name.toLowerCase().includes(this._searchQuery)||t.value.toLowerCase().includes(this._searchQuery)||t.category.toLowerCase().includes(this._searchQuery)||this._matchesFamilySearch(t))),this._filteredAllVars=e,this.requestUpdate()}async _loadTokens(){var e,t;this._isLoading=true,this.requestUpdate();try{const a=(t=(e=window.lcards)==null?void 0:e.core)==null?void 0:t.themeManager;if(!a){d.warn("[ThemeTokenBrowser] ThemeManager not available (unexpected at editor load time)"),this._tokens=[],this._filteredTokens=[],this._isLoading=false,this.requestUpdate();return}const r=a.getActiveTheme();if(!r||!r.tokens){d.warn("[ThemeTokenBrowser] No active theme or tokens available"),this._tokens=[],this._filteredTokens=[],this._isLoading=false,this.requestUpdate();return}this._activeTheme={name:r.name||"Unknown Theme",description:r.description||""};const s=this._extractTokensFromObject(r.tokens);this._tokens=s,this._filteredTokens=s,d.debug("[ThemeTokenBrowser] Loaded tokens",{count:s.length,categories:Object.keys(r.tokens)})}catch(a){d.error("[ThemeTokenBrowser] Error loading tokens:",a),this._tokens=[],this._filteredTokens=[]}finally{this._isLoading=false,this.requestUpdate()}}_extractTokensFromObject(e){const t=[];return!e||typeof e!="object"||this._extractTokensRecursive(e,"",t),t}_extractTokensRecursive(e,t,a,r=""){if(!(!e||typeof e!="object"))for(const[s,i]of Object.entries(e)){const n=t?`${t}.${s}`:s,l=r||s;if(typeof i=="object"&&i!==null&&!Array.isArray(i))this._extractTokensRecursive(i,n,a,l);else{const c=this._fullyResolveTokenValue(n,i);a.push({path:n,value:c.finalValue,rawValue:i,resolvedFrom:c.resolvedFrom,resolutionChain:c.chain,category:l})}}}_fullyResolveTokenValue(e,t,a=new Set,r=[]){var i,n;if(a.has(e)||r.length>=10)return d.warn("[ThemeTokenBrowser] Circular reference or max depth:",e,r),{finalValue:t,resolvedFrom:null,chain:[...r,"circular reference or too deep"],error:"Circular reference or max recursion depth"};a.add(e),r.push(e);try{const l=(n=(i=window.lcards)==null?void 0:i.core)==null?void 0:n.themeManager;if(!l)return{finalValue:t,resolvedFrom:null,chain:[...r]};if(typeof t!="string")return{finalValue:t,resolvedFrom:null,chain:[...r]};if(this._isUnprefixedTokenReference(t)){const c=this._getTokenByPath(t);if(c!=null){const h=this._fullyResolveTokenValue(t,c,a,[...r,`→ ${t}`]);return{finalValue:h.finalValue,resolvedFrom:t,chain:h.chain}}else return{finalValue:t,resolvedFrom:t,chain:[...r,"not found"],error:`Token reference not found: ${t}`}}if(this._looksLikeComputedToken(t)){const c={value:`theme:${t}`},h=_t(c,l);return{finalValue:h.value,resolvedFrom:t,chain:[...r,`computed → ${h.value}`]}}return{finalValue:t,resolvedFrom:null,chain:[...r]}}catch(l){return d.warn("[ThemeTokenBrowser] Error resolving token:",e,l),{finalValue:t,resolvedFrom:null,chain:[...r,"error"],error:l.message}}}_isUnprefixedTokenReference(e){return typeof e!="string"?false:["colors","typography","spacing","borders","effects","animations","components"].some(a=>e.startsWith(`${a}.`))}_getTokenByPath(e){var t,a;try{const r=(a=(t=window.lcards)==null?void 0:t.core)==null?void 0:a.themeManager;if(!r)return;const s=r.getActiveTheme();if(!s||!s.tokens)return;const i=e.split(".");let n=s.tokens;for(const l of i)if(n&&typeof n=="object"&&l in n)n=n[l];else return;return n}catch(r){d.warn("[ThemeTokenBrowser] Error getting token by path:",e,r);return}}_looksLikeComputedToken(e){return typeof e!="string"?false:yt(e.replace(/^theme:/,""))}_isColorValue(e){return wt(e)}async _copyTokenSyntax(e,t){const a=`theme:${e}`,r=t.target.closest("ha-icon-button");if(!r)return;const s=r.icon;try{if(!await W(a))throw new Error("Clipboard write returned failure");d.info("[ThemeTokenBrowser] Copied token syntax:",a),r.icon="mdi:check",r.style.color="var(--success-color)",setTimeout(()=>{r.icon=s,r.style.color=""},2e3)}catch(i){d.error("[ThemeTokenBrowser] Failed to copy to clipboard:",i),r.icon="mdi:alert-circle",r.style.color="var(--error-color)",setTimeout(()=>{r.icon=s,r.style.color=""},2e3)}}async _copyCssVar(e,t){const a=`var(${e})`,r=t.target.closest("ha-icon-button");if(!r)return;const s=r.icon;try{if(!await W(a))throw new Error("Clipboard write returned failure");d.info("[ThemeTokenBrowser] Copied CSS var syntax:",a),r.icon="mdi:check",r.style.color="var(--success-color)",setTimeout(()=>{r.icon=s,r.style.color=""},2e3)}catch(i){d.error("[ThemeTokenBrowser] Failed to copy to clipboard:",i),r.icon="mdi:alert-circle",r.style.color="var(--error-color)",setTimeout(()=>{r.icon=s,r.style.color=""},2e3)}}_toggleAlertModePreview(){this._alertModePreview=!this._alertModePreview,d.debug("[ThemeTokenBrowser] Alert mode preview:",this._alertModePreview)}_toggleAlertModePreviewSection(e){this._alertModePreviewExpanded=e.detail.expanded,d.debug("[ThemeTokenBrowser] Alert mode preview section expanded:",this._alertModePreviewExpanded),this.requestUpdate()}_renderAlertModeConfigRow({value:e,label:t,dot:a}){const r=Z(e);if(!r)return o`<tr><td colspan="6">Unknown mode ${e}</td></tr>`;let s="-";if(e==="black_alert"&&r.contrastEnhancement){const i=r.contrastEnhancement;s=o`
        <div style="font-size: 0.9em; line-height: 1.4;">
          <div><strong>Contrast:</strong> ${i.enabled?"Enabled":"Disabled"}</div>
          <div>Threshold: ${i.threshold}</div>
          <div>Dark ×: ${i.darkMultiplier}</div>
          <div>Light ×: ${i.lightMultiplier}</div>
        </div>
      `}else if(r.hueAnchor){const i=r.hueAnchor;s=o`
        <div style="font-size: 0.9em; line-height: 1.4;">
          <div><strong>Hue Anchor:</strong></div>
          <div>Center: ${i.centerHue}°</div>
          <div>Range: ±${i.range}°</div>
          <div>Strength: ${i.strength}</div>
        </div>
      `}return o`
      <tr>
        <td><span class="mode-dot" style="background: ${a}"></span><span class="mode-name">${t}</span></td>
        <td>${r.hueShift}°</td>
        <td>${r.hueStrength}</td>
        <td>${r.saturationMultiplier}</td>
        <td>${r.lightnessMultiplier}</td>
        <td>${s}</td>
      </tr>
    `}_getAlertModeColor(e,t,a){try{return pe(e,a)}catch(r){return d.warn("[ThemeTokenBrowser] Error transforming color:",r),e}}_getCurrentAlertMode(){var e,t,a,r;return((r=(a=(t=(e=window.lcards)==null?void 0:e.core)==null?void 0:t.themeManager)==null?void 0:a.getAlertMode)==null?void 0:r.call(a))||"green_alert"}async _copyValue(e,t){const a=t.target.closest("ha-icon-button");if(!a)return;const r=a.icon;try{if(!await W(String(e)))throw new Error("Clipboard write returned failure");d.info("[ThemeTokenBrowser] Copied value:",e),a.icon="mdi:check",a.style.color="var(--success-color)",setTimeout(()=>{a.icon=r,a.style.color=""},2e3)}catch(s){d.error("[ThemeTokenBrowser] Failed to copy to clipboard:",s),a.icon="mdi:alert-circle",a.style.color="var(--error-color)",setTimeout(()=>{a.icon=r,a.style.color=""},2e3)}}async _copyResolvedColor(e,t){const a=t.target;if(a)try{const r=this._getHexColor(e);if(!await W(r))throw new Error("Clipboard write returned failure");d.info("[ThemeTokenBrowser] Copied hex color:",r);const i=a.style.border;a.style.border="var(--ha-border-width-lg) solid var(--success-color)",a.style.boxShadow="0 0 8px var(--success-color)",setTimeout(()=>{a.style.border=i,a.style.boxShadow=""},1e3)}catch(r){d.error("[ThemeTokenBrowser] Failed to copy color:",r);const s=a.style.border;a.style.border="var(--ha-border-width-lg) solid var(--error-color)",setTimeout(()=>{a.style.border=s},1e3)}}_getHexColor(e){return/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(e)?e:me.toHex(e)??e}async _handleModeChange(e){var t;!((t=e.detail)!=null&&t.value)||e.detail.value===this._selectedAlertMode||(this._selectedAlertMode=e.detail.value,d.debug("[AlertLab] Mode changed to:",this._selectedAlertMode),this._livePreviewEnabled&&await this._applyAlertMode(),this.requestUpdate())}_handleParamChange(e,t){if(d.debug("[AlertLab] Parameter changed:",e,t),e.includes(".")){const[a,r]=e.split("."),i={...Z(this._selectedAlertMode)[a],[r]:t};I(this._selectedAlertMode,a,i)}else I(this._selectedAlertMode,e,t);this.requestUpdate(),this._livePreviewEnabled&&(clearTimeout(this._applyDebounceTimeout),this._applyDebounceTimeout=setTimeout(()=>{this._applyAlertMode()},150))}async _applyAlertMode(){var t,a,r,s;d.info("[AlertLab] Applying alert mode:",this._selectedAlertMode);const e=this.hass||((a=(t=window.lcards)==null?void 0:t.core)==null?void 0:a._currentHass);if(!e){d.warn("[AlertLab] No hass instance available");return}try{(s=(r=window.lcards)==null?void 0:r.core)!=null&&s.themeManager&&(window.lcards.core.themeManager.updateHass(e),await window.lcards.core.themeManager.setAlertMode(this._selectedAlertMode,{skipHelperLoad:true}),d.info("[AlertLab] Alert mode applied successfully"),this.requestUpdate())}catch(i){d.error("[AlertLab] Error applying alert mode:",i)}}async _resetToDefaults(){d.info("[AlertLab] Resetting to defaults:",this._selectedAlertMode),xt(this._selectedAlertMode),this.requestUpdate(),this._livePreviewEnabled&&await this._applyAlertMode()}async _saveToHelpers(){var r,s;if(!((s=(r=window.lcards)==null?void 0:r.core)!=null&&s.helperManager)){d.error("[AlertLab] HelperManager not available"),this._showSaveError("Helper Manager is not initialized. Cannot save parameters.");return}const e=window.lcards.core.helperManager,t=Z(this._selectedAlertMode),a=this._selectedAlertMode.replace("_alert","");if(a==="green"){d.warn("[AlertLab] Cannot save green_alert parameters"),this._showSaveError("Green Alert is the baseline mode and cannot be saved.");return}try{const i=`alert_lab_${a}_hue`,n=`alert_lab_${a}_hue_strength`,l=`alert_lab_${a}_saturation`,c=`alert_lab_${a}_lightness`;if(!(e.helperExists(i)&&e.helperExists(n)&&e.helperExists(l)&&e.helperExists(c))){const p=[];e.helperExists(i)||p.push(i),e.helperExists(n)||p.push(n),e.helperExists(l)||p.push(l),e.helperExists(c)||p.push(c),d.warn("[AlertLab] Missing helpers:",p),this._showSaveError(`Required helpers not found: ${p.join(", ")}. Please create these input_number helpers in Home Assistant first.`);return}if(await e.setHelperValue(i,t.hueShift),await e.setHelperValue(n,t.hueStrength),await e.setHelperValue(l,t.saturationMultiplier*100),await e.setHelperValue(c,t.lightnessMultiplier*100),t.hueAnchor){const p=`alert_lab_${a}_center_hue`,g=`alert_lab_${a}_range`,v=`alert_lab_${a}_strength`;e.helperExists(p)&&e.helperExists(g)&&e.helperExists(v)?(await e.setHelperValue(p,t.hueAnchor.centerHue),await e.setHelperValue(g,t.hueAnchor.range),await e.setHelperValue(v,t.hueAnchor.strength),d.info("[AlertLab] Saved hue anchor parameters:",{centerHue:t.hueAnchor.centerHue,range:t.hueAnchor.range,strength:t.hueAnchor.strength})):d.debug("[AlertLab] Hue anchor helpers not found, skipping")}if(a==="black"&&t.contrastEnhancement){const p="alert_lab_black_threshold",g="alert_lab_black_dark_multiplier",v="alert_lab_black_light_multiplier";if(e.helperExists(p)&&e.helperExists(g)&&e.helperExists(v)){const m=t.contrastEnhancement;await e.setHelperValue(p,m.threshold),await e.setHelperValue(g,m.darkMultiplier),await e.setHelperValue(v,m.lightMultiplier),d.info("[AlertLab] Saved contrast enhancement parameters:",{threshold:m.threshold,darkMultiplier:m.darkMultiplier,lightMultiplier:m.lightMultiplier})}else d.debug("[AlertLab] Contrast enhancement helpers not found, skipping")}d.info("[AlertLab] Saved parameters to helpers:",{mode:this._selectedAlertMode,hue:t.hueShift,hueStrength:t.hueStrength,saturation:t.saturationMultiplier,lightness:t.lightnessMultiplier}),this._showSaveSuccess()}catch(i){d.error("[AlertLab] Failed to save to helpers:",i),this._showSaveError(`Failed to save parameters: ${i.message}`)}}_showSaveSuccess(){this._helperSaveMessage={type:"info",message:`Successfully saved ${this._getModeName(this._selectedAlertMode)} parameters to helpers.`},this.requestUpdate()}_showSaveError(e){this._helperSaveMessage={type:"error",message:e},this.requestUpdate()}_onOverridesScopeChanged(e){this._overridesScopeInfo=e.detail,this._overridesError=null,this._activeEditToken=null,this._editPendingValue="",this._scopeOverridesCache=null,this._loadScopeOverrides()}async _loadScopeOverrides(){var t,a,r;const e=(a=(t=window.lcards)==null?void 0:t.core)==null?void 0:a.scopedSettingsService;if(!e){this._scopeOverridesCache={};return}this._overridesLoading=true,this.requestUpdate();try{const s=((r=this._overridesScopeInfo)==null?void 0:r.scope)??"user",i=await e.read($t,[s])??{};this._scopeOverridesCache=i}catch(s){d.error("[ThemeTokenBrowser] Failed to load scope overrides:",s),this._scopeOverridesCache={}}finally{this._overridesLoading=false,this.requestUpdate()}}_startEditOverride(e,t,a){const r=String(t!==void 0?t:a??"");this._activeEditToken=e,this._editPendingValue=r,this.requestUpdate()}_cancelEditOverride(){this._activeEditToken=null,this._editPendingValue="",this.requestUpdate()}async _saveOverride(){var i,n,l;const e=this._activeEditToken;if(!e)return;const t=(n=(i=window.lcards)==null?void 0:i.core)==null?void 0:n.themeManager;if(!t){d.error("[ThemeTokenBrowser] No themeManager available");return}const a=((l=this._overridesScopeInfo)==null?void 0:l.scope)??"user",r=this._editPendingValue,s=r!==""&&!isNaN(Number(r))&&!r.includes(" ")?Number(r):r;try{const c=await t.setOverride(e,s,a);if(this._overridesError=c?null:this._overrideWriteError(a),!c)return;this._activeEditToken=null,this._editPendingValue="",await this._loadScopeOverrides()}catch(c){d.error("[ThemeTokenBrowser] Failed to save override:",c)}}_overrideWriteError(e){return e==="global"&&!Oe(this.hass)?Je:"Could not save the override."}async _clearScopeOverride(e){var r,s,i;const t=(s=(r=window.lcards)==null?void 0:r.core)==null?void 0:s.themeManager;if(!t)return;const a=((i=this._overridesScopeInfo)==null?void 0:i.scope)??"user";try{const n=await t.clearOverride(e,a);if(this._overridesError=n?null:this._overrideWriteError(a),!n)return;this._activeEditToken===e&&(this._activeEditToken=null,this._editPendingValue=""),await this._loadScopeOverrides()}catch(n){d.error("[ThemeTokenBrowser] Failed to clear override:",n)}}_getTokenEditorType(e){return e.startsWith("colors.")?"color":/fontSize|radius|width|gap|height|padding|margin|size/i.test(e)?"number":/fontWeight/i.test(e)?"select-weight":/textTransform/i.test(e)?"select-transform":"text"}_renderOverrideEditPanel(e,t){const a=this._getTokenEditorType(e),r=this._editPendingValue,s=a==="color",i=typeof r=="string"&&r.trim().startsWith("var("),n=s&&r&&!i;return o`
      <tr class="override-edit-panel-row">
        <td colspan="4">
          <div class="override-edit-panel">
            <div class="override-edit-panel-header">
              <span class="override-edit-token-path">theme:${e}</span>
              <span class="override-edit-default">Default: <code>${String(t??"-")}</code></span>
            </div>

            ${n?o`
              <lcards-message type="warning">
                Using a fixed colour value (not <code>var(--lcars-…)</code>) will pin this token and it won't respond to Alert Mode transformations.
              </lcards-message>
            `:""}

            <div class="override-edit-control">
              ${a==="color"?o`
                <lcards-color-picker
                  .hass=${this.hass}
                  .value=${r}
                  showBuilder
                  showPreview
                  @value-changed=${l=>{this._editPendingValue=l.detail.value,this.requestUpdate()}}>
                </lcards-color-picker>
              `:a==="select-weight"?o`
                <ha-selector
                  .hass=${this.hass}
                  .selector=${{select:{options:["normal","bold","100","200","300","400","500","600","700","800","900"].map(l=>({value:l,label:l}))}}}
                  .value=${r}
                  @value-changed=${l=>{this._editPendingValue=l.detail.value,this.requestUpdate()}}>
                </ha-selector>
              `:a==="select-transform"?o`
                <ha-selector
                  .hass=${this.hass}
                  .selector=${{select:{options:["none","uppercase","lowercase","capitalize"].map(l=>({value:l,label:l}))}}}
                  .value=${r}
                  @value-changed=${l=>{this._editPendingValue=l.detail.value,this.requestUpdate()}}>
                </ha-selector>
              `:a==="number"?o`
                <ha-selector
                  .hass=${this.hass}
                  .selector=${{number:{mode:"box"}}}
                  .value=${Number(r)||0}
                  @value-changed=${l=>{this._editPendingValue=String(l.detail.value),this.requestUpdate()}}>
                </ha-selector>
              `:o`
                <ha-input
                  .value=${r}
                  placeholder="Enter value (e.g. #93e1ff, var(--lcars-blue), 14px)"
                  style="width: 100%"
                  @input=${l=>{this._editPendingValue=l.target.value}}>
                </ha-input>
              `}
            </div>

            <div class="override-edit-actions">
              <ha-button @click=${()=>this._saveOverride()}>
                <ha-icon icon="mdi:content-save" slot="start"></ha-icon>
                Save
              </ha-button>
              <ha-button appearance="plain" @click=${()=>this._cancelEditOverride()}>
                Cancel
              </ha-button>
            </div>
          </div>
        </td>
      </tr>
    `}_renderOverrideTokenRow(e){var l,c,h;const t=(l=this._scopeOverridesCache)==null?void 0:l[e.path],a=t!=null,r=(h=(c=window.lcards)==null?void 0:c.core)==null?void 0:h.themeManager,s=r==null?void 0:r.getThemeDefault(e.path,e.value??""),i=this._activeEditToken===e.path,n=this._getTokenEditorType(e.path)==="color";return o`
      <tr class="override-token-row ${a?"has-override":""} ${i?"is-editing":""}">
        <td class="override-path-cell">
          <span class="override-token-path">theme:${e.path}</span>
          ${a?o`<span class="override-origin-badge">overridden</span>`:""}
        </td>
        <td class="override-default-cell">
          ${n?o`
            <span class="override-color-swatch" style="background:${s}"></span>
          `:""}
          <span class="override-value-text" title="${s}">${String(s??"-")}</span>
        </td>
        <td class="override-value-cell">
          ${a?o`
            ${n?o`
              <span class="override-color-swatch" style="background:${t}"></span>
            `:""}
            <span class="override-value-text override-value-active" title="${t}">${String(t)}</span>
          `:o`<span class="override-value-empty">-</span>`}
        </td>
        <td class="override-actions-cell">
          <div class="override-actions">
            <ha-icon-button
              @click=${()=>i?this._cancelEditOverride():this._startEditOverride(e.path,t,s)}
              .label=${i?"Cancel edit":"Edit override"}
              .path=${"M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"}>
            </ha-icon-button>
            ${a?o`
              <ha-icon-button
                @click=${()=>this._clearScopeOverride(e.path)}
                .label=${"Clear override"}
                .path=${"M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"}>
              </ha-icon-button>
            `:""}
          </div>
        </td>
      </tr>
      ${i?this._renderOverrideEditPanel(e.path,s):""}
    `}_renderOverridesView(){const e=this._overridesFilter.toLowerCase(),t=this._scopeOverridesCache??{},a=this._tokens.filter(s=>e?s.path.toLowerCase().includes(e):true),r=Object.keys(t).length;return o`
      <div class="dialog-body overrides-view">
        <!-- Scope selector -->
        <lcards-scope-selector
          .hass=${this.hass}
          showGlobal
          @scope-changed=${this._onOverridesScopeChanged}>
        </lcards-scope-selector>
        ${this._overridesError?o`
          <lcards-message type="error" .message=${this._overridesError}></lcards-message>
        `:""}

        <!-- Filter + summary bar -->
        <div class="overrides-toolbar">
          <div class="overrides-filter-wrapper">
            <ha-input
              .value=${this._overridesFilter}
              @input=${s=>{this._overridesFilter=s.target.value,this.requestUpdate()}}
              placeholder="Filter tokens..."
              label="Filter">
              <ha-icon slot="leadingIcon" icon="mdi:magnify"></ha-icon>
            </ha-input>
          </div>
          <div class="overrides-summary">
            ${this._overridesLoading?o`<ha-spinner size="small"></ha-spinner>`:o`<span>${r} override${r!==1?"s":""} in this scope</span>`}
          </div>
        </div>

        ${!this._scopeOverridesCache&&!this._overridesLoading?o`
          <div class="overrides-load-hint">
            <ha-button @click=${()=>this._loadScopeOverrides()}>Load overrides</ha-button>
          </div>
        `:""}

        <!-- Token table -->
        <div class="overrides-table-wrapper">
          <table class="token-table overrides-table">
            <thead>
              <tr>
                <th>Token Path</th>
                <th>Theme Default</th>
                <th>Override (this scope)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${a.length===0?o`
                <tr><td colspan="4" style="text-align:center;padding:24px;color:var(--secondary-text-color)">
                  No tokens match your filter.
                </td></tr>
              `:a.map(s=>this._renderOverrideTokenRow(s))}
            </tbody>
          </table>
        </div>
      </div>
    `}};b(Xe,"LCARdSThemeTokenBrowserTab");let Be=Xe;customElements.get("lcards-theme-token-browser-tab")||customElements.define("lcards-theme-token-browser-tab",Be);function Yt(u){return o`
    <div class="theme-preview">
      <div class="preview-label">Theme Preview</div>
      <div class="preview-note">
        Theme contains ${u.tokenCount||0} design tokens.
        ${u.hasCssFile?"Includes custom CSS file.":""}
      </div>
    </div>
  `}b(Yt,"renderThemePreview");const Gt=H`
  .theme-preview,
  .preset-preview,
  .animation-preview,
  .svg-preview {
    background: color-mix(in srgb, var(--secondary-background-color) 50%, color-mix(in srgb, var(--primary-background-color) 25%, transparent));
    border: 1px solid var(--divider-color);
    border-radius: var(--ha-card-border-radius, 12px);
    padding: 16px;
    margin: 12px 0;
  }

  .preview-label {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--primary-text-color);
  }

  .preview-note {
    font-size: 13px;
    color: var(--secondary-text-color);
    margin-bottom: 12px;
  }

  .preview-placeholder {
    background: rgba(255,255,255,0.5);
    border: 2px dashed var(--divider-color);
    border-radius: var(--ha-card-border-radius, 12px);
    padding: 24px;
    text-align: center;
    color: var(--secondary-text-color);
    font-style: italic;
  }

  .animation-details {
    font-size: 13px;
    line-height: 1.6;
  }

  .animation-details div {
    margin: 4px 0;
  }

  .animation-details strong {
    color: var(--primary-text-color);
  }
`,Ze=class Ze2 extends M{static get properties(){return{hass:{type:Object},_selectedNode:{type:Object,state:true},_expandedNodes:{state:true,attribute:false},_treeData:{type:Array,state:true},_loadingSvg:{type:Boolean,state:true},_svgContent:{type:String,state:true}}}constructor(){super(),this.hass,this._selectedNode=null,this._expandedNodes=new Set,this._treeData=[],this._loadingSvg=false,this._svgContent=null,this._cardPreviews=new Map}static get styles(){return[R,Gt,H`
      :host {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow: hidden;
        font-family: var(--ha-font-family-body);
      }

      /* Split pane: tree | detail */
      .split-pane-container {
        display: grid;
        grid-template-columns: minmax(240px, 35%) 1fr;
        grid-template-rows: minmax(0, 1fr);
        gap: var(--ha-space-4);
        flex: 1;
        min-height: 0;
        overflow: hidden;
      }

      /* Tree pane: a section card on the inset, like lcards-form-section */
      .tree-pane {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 0;
        border: var(--ha-border-width-md) solid var(--chip-background-color);
        border-radius: var(--ha-card-border-radius, var(--ha-border-radius-lg));
        background-color: color-mix(
          in srgb,
          var(--secondary-background-color) 30%,
          color-mix(in srgb, var(--primary-background-color) 25%, transparent)
        );
      }

      .tree-pane-header {
        display: flex;
        align-items: center;
        gap: var(--ha-space-2);
        padding: var(--ha-space-3) var(--ha-space-4);
        border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
        flex-shrink: 0;
        font-weight: 600;
        font-size: var(--ha-font-size-m);
        color: var(--primary-text-color);
      }

      .tree-pane-header ha-icon {
        --mdc-icon-size: 20px;
      }

      .tree-count {
        margin-left: auto;
        font-weight: var(--ha-font-weight-normal, 400);
        color: var(--secondary-text-color);
      }

      .tree-container {
        flex: 1;
        overflow-y: auto;
        padding: var(--ha-space-2);
      }

      /* Tree nodes */
      .tree-node {
        margin-left: calc(var(--node-level, 0) * var(--ha-space-4));
        margin-bottom: 2px;
      }

      .tree-node-content {
        display: flex;
        align-items: center;
        gap: var(--ha-space-2);
        padding: 6px var(--ha-space-2);
        border-radius: var(--ha-border-radius-md);
        cursor: pointer;
        transition: background var(--ha-animation-duration-fast, 0.15s);
        user-select: none;
      }

      .tree-node-content:hover {
        background: color-mix(in srgb, var(--secondary-background-color) 70%, transparent);
      }

      .tree-node-content.selected {
        background: var(--primary-color);
        color: var(--text-primary-color);
      }

      .tree-node-content.selected .node-icon {
        color: inherit;
      }

      .tree-expander {
        --mdc-icon-size: 18px;
        flex: none;
        transition: transform var(--ha-animation-duration-fast, 0.15s);
      }

      .tree-expander.leaf {
        visibility: hidden;
      }

      .tree-expander.expanded {
        transform: rotate(90deg);
      }

      .node-icon {
        --mdc-icon-size: 16px;
        flex: none;
        color: var(--secondary-text-color);
      }

      .node-label {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* Detail pane: the inset's scrolling column (scroll-body) of form sections */
      .detail-pane {
        min-height: 0;
      }

      .detail-panel-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--secondary-text-color);
        gap: var(--ha-space-3);
      }

      .detail-panel-empty ha-icon {
        --mdc-icon-size: 48px;
        opacity: 0.5;
      }

      .detail-panel {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-4);
        /* lcards-form-section's own margin is replaced by the gap */
        --lcards-section-spacing: 0;
      }

      .detail-header {
        display: flex;
        align-items: center;
        gap: var(--ha-space-3);
      }

      .detail-header h3 {
        margin: 0;
        flex: 1;
        min-width: 0;
        font-size: var(--ha-font-size-xl, 20px);
        font-weight: var(--ha-font-weight-medium, 500);
        overflow-wrap: anywhere;
      }

      .type-chip {
        --ha-assist-chip-filled-container-color:
          color-mix(in srgb, var(--primary-color) 18%, transparent);
        --ha-assist-chip-label-text-color: var(--primary-color);
        flex-shrink: 0;
      }

      .detail-content {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-4);
      }

      .detail-grid {
        display: grid;
        gap: var(--ha-space-1);
      }

      /* Key/value rows (the Users tab's field rows) */
      .detail-item {
        display: grid;
        grid-template-columns: minmax(120px, 30%) 1fr;
        gap: var(--ha-space-3);
        align-items: baseline;
        padding: var(--ha-space-1) 0;
      }

      .detail-label {
        color: var(--secondary-text-color);
      }

      .detail-value {
        color: var(--primary-text-color);
        overflow-wrap: anywhere;
      }

      .empty-state {
        padding: var(--ha-space-12) var(--ha-space-4);
        text-align: center;
        color: var(--secondary-text-color);
      }

      ha-code-editor {
        display: block;
        border: var(--ha-border-width-sm) solid var(--divider-color);
        border-radius: var(--ha-border-radius-md);
        overflow: hidden;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
        gap: 8px;
        margin-bottom: 16px;
      }

      .stat-card {
        background: color-mix(in srgb, var(--primary-color) 18%, transparent);
        border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--primary-color) 35%, transparent);
        padding: 10px var(--ha-space-2);
        border-radius: var(--ha-border-radius-md);
        text-align: center;
        color: var(--primary-text-color);
      }

      .stat-card .stat-icon {
        color: var(--primary-color);
      }

      .stat-card.zero {
        opacity: 0.35;
      }

      .stat-card .stat-icon {
        --mdc-icon-size: 20px;
        margin-bottom: var(--ha-space-1);
      }

      .stat-value {
        font-size: var(--ha-font-size-2xl);
        font-weight: 600;
        line-height: 1;
      }

      .stat-label {
        font-size: var(--ha-font-size-s);
        color: var(--secondary-text-color);
        margin-top: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .svg-preview-container {
        background: color-mix(in srgb, var(--secondary-background-color) 50%, color-mix(in srgb, var(--primary-background-color) 25%, transparent));
        border-radius: var(--ha-card-border-radius, 12px);
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        max-height: 600px;
        overflow: auto;
      }

      .svg-preview-container svg {
        max-width: 100%;
        max-height: 550px;
        height: auto;
      }

      .preview-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 32px;
        gap: 12px;
      }

      .preview-placeholder {
        background: color-mix(in srgb, var(--secondary-background-color) 50%, color-mix(in srgb, var(--primary-background-color) 25%, transparent));
        border: var(--ha-border-width-md) dashed var(--divider-color);
        border-radius: var(--ha-card-border-radius, 12px);
        padding: 24px;
        text-align: center;
      }

      .preview-note {
        font-size: var(--ha-font-size-s);
        color: var(--secondary-text-color);
        margin-top: 8px;
      }

      .font-preview-container {
        background: var(--card-background-color);
        border: var(--ha-border-width-sm) solid var(--divider-color);
        border-radius: var(--ha-border-radius-md);
        padding: var(--ha-space-6);
      }

      .font-sample {
        font-size: var(--ha-font-size-l);
        line-height: 1.8;
        color: var(--primary-text-color);
        margin: 0;
      }

      .audio-preview-container {
        background: color-mix(in srgb, var(--secondary-background-color) 50%, color-mix(in srgb, var(--primary-background-color) 25%, transparent));
        border-radius: var(--ha-card-border-radius, 12px);
        padding: 16px;
        display: flex;
        justify-content: center;
      }

      .audio-preview-container audio {
        width: 100%;
        max-width: 400px;
      }

      .image-preview-container {
        background: var(--secondary-background-color);
        border-radius: var(--ha-card-border-radius, 12px);
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 120px;
        overflow: hidden;
      }

      .image-preview-container img {
        max-width: 100%;
        max-height: 400px;
        border-radius: 6px;
        object-fit: contain;
      }

      .texture-swatch {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-family: var(--ha-font-family-code);
        font-size: var(--ha-font-size-s);
      }

      .texture-swatch-dot {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: var(--ha-border-width-sm) solid var(--divider-color);
        flex-shrink: 0;
      }

      .preset-preview-frame > * {
        width: 100%;
        height: 100%;
      }

      .preset-preview-container {
        background: color-mix(in srgb, var(--secondary-background-color) 50%, color-mix(in srgb, var(--primary-background-color) 25%, transparent));
        border: var(--ha-border-width-sm) solid var(--divider-color);
        border-radius: var(--ha-card-border-radius, 12px);
        padding: 24px;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100px;
      }

      @media (max-width: 768px) {
        .split-pane-container {
          grid-template-columns: 1fr;
          grid-template-rows: auto minmax(0, 1fr);
        }

        .tree-pane {
          max-height: 300px;
        }
      }
    `]}connectedCallback(){super.connectedCallback(),this._buildTreeData()}updated(e){super.updated(e),e.has("hass")&&this.hass&&this._buildTreeData()}_buildTreeData(){var r,s;const e=(r=window.lcards)==null?void 0:r.core;if(!e){d.warn("[PackExplorer] LCARdS core not available"),this._treeData=[];return}const t=[];(((s=e.packManager)==null?void 0:s.getLoadedPacks())||[]).forEach(i=>{var _,m;const n={id:`pack_${i.id}`,type:"pack",label:i.id,icon:"mdi:package-variant",data:i,children:[]};if(i.themeCount>0){const w={id:`${n.id}_themes`,type:"category",label:`Themes (${i.themeCount})`,icon:"mdi:palette",data:{category:"themes",packId:i.id},children:[]};(((_=e.themeManager)==null?void 0:_.getThemesByPack(i.id))||[]).forEach($=>{w.children.push({id:`theme_${$.id}`,type:"theme",label:$.name||$.id,icon:"mdi:palette",data:$})}),n.children.push(w)}if(i.presetCount>0){const w={id:`${n.id}_presets`,type:"category",label:`Presets (${i.presetCount})`,icon:"mdi:tune-variant",data:{category:"presets",packId:i.id},children:[]},f=(m=e.packManager)==null?void 0:m.getPackMetadata(i.id);f!=null&&f.presets&&Object.entries(f.presets).forEach(([$,C])=>{const S={id:`${n.id}_presets_${$}`,type:"preset-type",label:`${$} (${C.length})`,icon:"mdi:tune-variant",data:{presetType:$,packId:i.id},children:[]};C.forEach(k=>{S.children.push({id:`preset_${$}_${k.id}`,type:"preset",label:k.id,icon:"mdi:tune-variant",data:k})}),w.children.push(S)}),n.children.push(w)}const l=this._getComponentsForPack(i.id);if(l.length>0){const w={id:`${n.id}_components`,type:"category",label:`Components (${l.length})`,icon:"mdi:puzzle",data:{category:"components",packId:i.id},children:[]};l.forEach(f=>{var S;const $=(S=f.definition)!=null&&S.presets?Object.keys(f.definition.presets):[],C={id:`component_${f.name}`,type:"component",label:f.name,icon:"mdi:puzzle",data:f,children:$.map(k=>({id:`component_${f.name}_preset_${k}`,type:"component-preset",label:k,icon:"mdi:tune-variant",data:{componentName:f.name,presetName:k,preset:f.definition.presets[k],pack:i.id}}))};w.children.push(C)}),n.children.push(w)}const c=this._getAnimationPresetsForPack(i.id);if(c.length>0){const w={id:`${n.id}_animations`,type:"category",label:`Animations (${c.length})`,icon:"mdi:animation-play",data:{category:"animations",packId:i.id},children:[]},f=new Map;c.forEach($=>{const C=$.category||"other";f.has(C)||f.set(C,[]),f.get(C).push($)}),f.forEach(($,C)=>{w.children.push({id:`${n.id}_animations_${C}`,type:"preset-type",label:`${C} (${$.length})`,icon:"mdi:animation-play",data:{presetType:C,packId:i.id},children:$.map(S=>({id:`animation_${i.id}_${S.name}`,type:"animation",label:S.name,icon:"mdi:animation-play",data:S}))})}),n.children.push(w)}const h=this._getAssetsForPack("svg",i.id);if(h.length>0){const w={id:`${n.id}_svg_assets`,type:"category",label:`SVG Assets (${h.length})`,icon:"mdi:image-outline",data:{category:"svg_assets",packId:i.id},children:[]};h.forEach(f=>{w.children.push({id:`svg_${f.key}`,type:"svg_asset",label:f.key,icon:"mdi:image-outline",data:f})}),n.children.push(w)}const p=this._getAssetsForPack("font",i.id);if(p.length>0){const w={id:`${n.id}_font_assets`,type:"category",label:`Font Assets (${p.length})`,icon:"mdi:format-font",data:{category:"font_assets",packId:i.id},children:[]};p.forEach(f=>{w.children.push({id:`font_${f.key}`,type:"font_asset",label:f.key,icon:"mdi:format-font",data:f})}),n.children.push(w)}const g=this._getAssetsForPack("audio",i.id);if(g.length>0){const w={id:`${n.id}_audio_assets`,type:"category",label:`Audio Assets (${g.length})`,icon:"mdi:volume-high",data:{category:"audio_assets",packId:i.id},children:[]};g.forEach(f=>{w.children.push({id:`audio_${f.key}`,type:"audio_asset",label:f.key,icon:"mdi:volume-high",data:f})}),n.children.push(w)}const v=this._getAssetsForPack("image",i.id);if(v.length>0){const w={id:`${n.id}_image_assets`,type:"category",label:`Images (${v.length})`,icon:"mdi:image-outline",data:{category:"image_assets",packId:i.id},children:[]};v.forEach(f=>{w.children.push({id:`image_${f.key}`,type:"image_asset",label:f.label||f.key,icon:"mdi:image-outline",data:f})}),n.children.push(w)}if(i.id==="lcards_textures"){const w=Object.entries(at),f={id:`${n.id}_texture_presets`,type:"category",label:`Texture Presets (${w.length})`,icon:"mdi:texture-box",data:{category:"texture_presets",packId:i.id},children:[]};w.forEach(([$,C])=>{f.children.push({id:`texture_${$}`,type:"texture_preset",label:C.name,icon:"mdi:texture-box",data:{key:$,...C}})}),n.children.push(f)}t.push(n)}),this._treeData=t,d.debug("[PackExplorer] Tree data built:",t)}_getAssetCountForPack(e){const t=this._getAssetsForPack("svg",e).length,a=this._getAssetsForPack("font",e).length,r=this._getAssetsForPack("audio",e).length,s=this._getAssetsForPack("image",e).length;return t+a+r+s}_getComponentsForPack(e){var a,r;const t=(r=(a=window.lcards)==null?void 0:a.core)==null?void 0:r.componentManager;return t?t.getAllComponentNames().map(s=>({name:s,definition:t.getComponent(s)})).filter(({definition:s})=>{var n;return((s==null?void 0:s.pack)||((n=s==null?void 0:s.metadata)==null?void 0:n.pack)||"core")===e}).map(({name:s,definition:i})=>({name:s,definition:i,pack:e})):[]}_getAssetsForPack(e,t){var r;const a=(r=window.lcards)==null?void 0:r.core;if(!(a!=null&&a.assetManager))return[];try{const s=a.assetManager.getRegistry(e),i=[];return s.assets.forEach((n,l)=>{var h;(((h=n.metadata)==null?void 0:h.pack)||n.pack)===t&&i.push({key:l,...n.metadata,hasContent:!!n.content,url:n.url})}),i}catch(s){return d.warn(`[PackExplorer] Failed to get ${e} assets for pack ${t}:`,s),[]}}_handleNodeClick(e){this._selectedNode=e,this._svgContent=null,this._loadingSvg=false,e.children&&e.children.length>0&&(this._expandedNodes.has(e.id)?this._expandedNodes.delete(e.id):this._expandedNodes.add(e.id),this.requestUpdate())}_renderTreeNode(e,t=0){var i;const a=this._expandedNodes.has(e.id),r=((i=this._selectedNode)==null?void 0:i.id)===e.id,s=e.children&&e.children.length>0;return o`
      <div class="tree-node" style="--node-level: ${t}">
        <div
          class="tree-node-content ${r?"selected":""}"
          @click=${()=>this._handleNodeClick(e)}>
          <ha-icon
            class="tree-expander ${s?a?"expanded":"":"leaf"}"
            icon="mdi:chevron-right"></ha-icon>
          ${e.icon?o`<ha-icon class="node-icon" icon=${e.icon}></ha-icon>`:""}
          <span class="node-label">${e.label}</span>
        </div>
      </div>
      ${s&&a?e.children.map(n=>this._renderTreeNode(n,t+1)):""}
    `}_countItems(e){return(e.children??[]).reduce((t,a)=>t+(a.type==="preset-type"?this._countItems(a):1),0)}_renderCode(e){return o`<ha-code-editor mode="yaml" read-only .value=${e}></ha-code-editor>`}_renderTreeNodes(e){return e.map(t=>this._renderTreeNode(t))}_renderDetailPanel(){if(!this._selectedNode)return o`
        <div class="detail-panel-empty">
          <ha-icon icon="mdi:package-variant"></ha-icon>
          <p>Select an item from the tree to view details</p>
        </div>
      `;const e=this._selectedNode;return o`
      <div class="detail-panel">
        <div class="detail-header">
          <h3>${e.label}</h3>
          <ha-assist-chip
            class="type-chip"
            .filled=${true}
            .label=${String(e.type).replace(/[_-]/g," ")}
          ></ha-assist-chip>
        </div>
        <div class="detail-content">
          ${this._renderDetailContent(e)}
        </div>
      </div>
    `}_renderDetailContent(e){switch(e.type){case"pack":return this._renderPackDetail(e.data);case"theme":return this._renderThemeDetail(e.data);case"preset":return this._renderPresetDetail(e.data);case"component":return this._renderComponentDetail(e.data);case"component-preset":return this._renderComponentPresetDetail(e.data);case"animation":return this._renderAnimationDetail(e.data);case"svg_asset":return this._renderSvgAssetDetail(e.data);case"font_asset":return this._renderFontAssetDetail(e.data);case"audio_asset":return this._renderAudioAssetDetail(e.data);case"image_asset":return this._renderImageAssetDetail(e.data);case"texture_preset":return this._renderTexturePresetDetail(e.data);case"category":case"preset-type":return this._renderCategoryDetail(e);default:return o`
          <lcards-form-section header="Information" icon="mdi:information-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Type</span>
                <span class="detail-value">${e.type}</span>
              </div>
            </div>
          </lcards-form-section>
        `}}_renderCategoryDetail(e){var a,r;const t=this._countItems(e);return o`
      <lcards-form-section header="Details" icon="mdi:information-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Category</span>
            <span class="detail-value">${((a=e.data)==null?void 0:a.category)||((r=e.data)==null?void 0:r.presetType)||"Unknown"}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Items</span>
            <span class="detail-value">${t}</span>
          </div>
        </div>
      </lcards-form-section>
    `}_renderPackDetail(e){return o`
      <lcards-form-section header="Details" icon="mdi:information-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">ID</span>
            <span class="detail-value">${e.id}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Description</span>
            <span class="detail-value">${e.description||"No description available"}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Version</span>
            <span class="detail-value">${e.version||"Unknown"}</span>
          </div>
        </div>
      </lcards-form-section>

      <lcards-form-section header="Statistics" icon="mdi:chart-box-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        <div class="stats-grid">
          ${this._renderStatCard("mdi:palette",e.themeCount||0,"Themes")}
          ${this._renderStatCard("mdi:tune-variant",e.presetCount||0,"Presets")}
          ${this._renderStatCard("mdi:puzzle",this._getComponentsForPack(e.id).length,"Components")}
          ${this._renderStatCard("mdi:format-list-checks",e.ruleCount||0,"Rules")}
          ${this._renderStatCard("mdi:animation-play",this._getAnimationCountForPack(e.id),"Animations")}
          ${this._renderStatCard("mdi:image-outline",this._getAssetsForPack("svg",e.id).length,"SVG")}
          ${this._renderStatCard("mdi:format-font",this._getAssetsForPack("font",e.id).length,"Fonts")}
          ${this._renderStatCard("mdi:volume-high",this._getAssetsForPack("audio",e.id).length,"Audio")}
          ${this._renderStatCard("mdi:image",this._getAssetsForPack("image",e.id).length,"Images")}
          ${this._renderStatCard("mdi:texture-box",this._getTextureCountForPack(e.id),"Textures")}
        </div>
      </lcards-form-section>
    `}_renderStatCard(e,t,a){return o`
      <div class="stat-card ${t===0?"zero":""}">
        <ha-icon class="stat-icon" icon=${e}></ha-icon>
        <div class="stat-value">${t}</div>
        <div class="stat-label">${a}</div>
      </div>
    `}_getAnimationPresetsForPack(e){return Ct().filter(t=>(t.pack||"core")===e)}_getAnimationCountForPack(e){return this._getAnimationPresetsForPack(e).length}_animationPresetParams(e){const t=(e==null?void 0:e.properties)||{},a=St;return Object.entries(t).filter(([r,s])=>a[r]!==s).map(([r,s])=>{var n;const i=s.type??((n=s.oneOf)==null?void 0:n.map(l=>l.type).filter(Boolean))??(s.enum?"enum":"");return{key:r,type:Array.isArray(i)?[...new Set(i.flat())].join(" / "):String(i||""),def:s.default,description:s.description||""}})}_getTextureCountForPack(e){return e==="lcards_textures"?Object.keys(at).length:0}_renderThemeDetail(e){return o`
      <lcards-form-section header="Details" icon="mdi:information-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">ID</span>
            <span class="detail-value">${e.id}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Name</span>
            <span class="detail-value">${e.name||e.id}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Description</span>
            <span class="detail-value">${e.description||"No description available"}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Pack</span>
            <span class="detail-value">${e.pack||"unknown"}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Version</span>
            <span class="detail-value">${e.version||"Unknown"}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Token Count</span>
            <span class="detail-value">${e.tokenCount||0}</span>
          </div>
        </div>
      </lcards-form-section>

      <lcards-form-section header="Preview" icon="mdi:eye-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        ${Yt(e)}
      </lcards-form-section>
    `}_renderPresetDetail(e){return o`
      <lcards-form-section header="Details" icon="mdi:information-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">ID</span>
            <span class="detail-value">${e.id}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Description</span>
            <span class="detail-value">${e.description||"No description available"}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Type</span>
            <span class="detail-value">${e.presetType||e.type}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Pack</span>
            <span class="detail-value">${e.pack||"unknown"}</span>
          </div>
          ${e.extends?o`
            <div class="detail-item">
              <span class="detail-label">Extends</span>
              <span class="detail-value">${e.extends}</span>
            </div>
          `:""}
        </div>
      </lcards-form-section>

      <lcards-form-section header="Live Preview" icon="mdi:eye-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        ${this._renderPresetLivePreview(e)}
      </lcards-form-section>
    `}_renderPresetLivePreview(e){const t=e.presetType||e.type,a=e.id;let r,s,i;if(t==="button"||t!=null&&t.includes("button"))r="lcards-button",a.startsWith("bar-label")?(s="width: 100%; max-width: 520px; height: 48px;",i={preset:a,interactive:false,text:{label:{content:"ENGINEERING"}}}):a.startsWith("panel-")?(s="width: 240px; height: 120px;",i={preset:a}):(s="width: 240px; height: 60px;",i={preset:a,icon:"mdi:lightbulb",...a==="icon"?{}:{text:{label:{content:"MAIN LIGHTS",show:true}}}});else if(t==="slider"||t!=null&&t.includes("slider"))r="lcards-slider",s=a.includes("vertical")?"width: 160px; height: 320px;":"width: 100%; max-width: 360px; height: 80px;",i={preset:a};else return o`<div class="preview-placeholder">Preview not available for this preset type</div>`;return this._renderCardPreview(`preset:${r}:${a}`,r,i,s)}_renderCardPreview(e,t,a,r){let s=this._cardPreviews.get(e);if(!s){s=document.createElement(t);try{s.setConfig({type:`custom:${t}`,...a})}catch(i){return d.error("[PackExplorer] Failed to set config on preview card:",i),o`<div class="preview-placeholder">Error creating preview: ${i.message}</div>`}this._cardPreviews.set(e,s)}return s.hass=this.hass,o`
      <div class="preset-preview-container">
        <div class="preset-preview-frame" style=${r}>${s}</div>
      </div>
    `}_componentPreview(e,t,a){return t==="lcards_buttons"?{cardType:"lcards-button",config:{component:e},size:"width: 220px; height: 220px;"}:t==="lcards_sliders"?{cardType:"lcards-slider",config:{component:e},size:a==="vertical"?"width: 160px; height: 320px;":"width: 100%; max-width: 360px; height: 80px;"}:t==="lcards_elbows"?{cardType:"lcards-elbow",config:{elbow:{type:e,segment:{bar_width:90,bar_height:20}}},size:"width: 100%; max-width: 360px; height: 140px;"}:null}_renderComponentDetail(e){var s,i;const t=e.definition||{},a=((s=t.svg)==null?void 0:s.length)||0,r=t.features&&t.features.length>0;return o`
      <lcards-form-section header="Details" icon="mdi:information-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Name</span>
            <span class="detail-value">${e.name}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Pack</span>
            <span class="detail-value">${e.pack||"unknown"}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Orientation</span>
            <span class="detail-value">${t.orientation||((i=t.metadata)==null?void 0:i.orientation)||"auto"}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">SVG Size</span>
            <span class="detail-value">${a} characters</span>
          </div>
          ${r?o`
            <div class="detail-item">
              <span class="detail-label">Features</span>
              <span class="detail-value">${t.features.join(", ")}</span>
            </div>
          `:""}
        </div>
      </lcards-form-section>

      ${this._renderComponentPreviewSection(e.name,e.pack,t)}
    `}_renderComponentPreviewSection(e,t,a){var i;const r=(a==null?void 0:a.orientation)??((i=a==null?void 0:a.metadata)==null?void 0:i.orientation),s=this._componentPreview(e,t,r);return s?o`
        <lcards-form-section header="Preview" icon="mdi:eye-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
          ${this._renderCardPreview(`component:${t}:${e}`,s.cardType,s.config,s.size)}
        </lcards-form-section>
      `:a!=null&&a.svg?o`
      <lcards-form-section header="SVG Preview" icon="mdi:eye-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        <div class="svg-preview-container">
          ${rt(a.svg)}
        </div>
      </lcards-form-section>
    `:""}_renderComponentPresetDetail(e){const{componentName:t,presetName:a,preset:r,pack:s}=e,i=r!=null&&r.segments?Object.keys(r.segments):[],n=(r==null?void 0:r.text)&&Object.keys(r.text).length>0,l=(r==null?void 0:r.animations)&&r.animations.length>0;return o`
      <lcards-form-section header="Details" icon="mdi:information-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Preset</span>
            <span class="detail-value">${a}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Component</span>
            <span class="detail-value">${t}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Pack</span>
            <span class="detail-value">${s}</span>
          </div>
          ${i.length?o`
            <div class="detail-item">
              <span class="detail-label">Segments</span>
              <span class="detail-value">${i.join(", ")}</span>
            </div>
          `:""}
          ${l?o`
            <div class="detail-item">
              <span class="detail-label">Animations</span>
              <span class="detail-value">${r.animations.map(c=>c.id).join(", ")}</span>
            </div>
          `:""}
          ${n?o`
            <div class="detail-item">
              <span class="detail-label">Text overrides</span>
              <span class="detail-value">${Object.keys(r.text).join(", ")}</span>
            </div>
          `:""}
        </div>
      </lcards-form-section>

      ${this._renderComponentPreviewSection(t,s,null)}

      <lcards-form-section header="Usage" icon="mdi:code-braces" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        ${this._renderCode(`component: ${t}
preset: ${a}`)}
      </lcards-form-section>
    `}_renderAnimationDetail(e){const a=kt[e.name],r=this._animationPresetParams(a);return o`
      <lcards-form-section header="Details" icon="mdi:information-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Name</span>
            <span class="detail-value">${e.name}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Pack</span>
            <span class="detail-value">${e.pack||"core"}</span>
          </div>
          ${e.category?o`
            <div class="detail-item">
              <span class="detail-label">Category</span>
              <span class="detail-value">${e.category}</span>
            </div>
          `:""}
          ${a!=null&&a.description?o`
            <div class="detail-item">
              <span class="detail-label">Description</span>
              <span class="detail-value">${a.description}</span>
            </div>
          `:""}
        </div>
      </lcards-form-section>

      ${r.length?o`
        <lcards-form-section header="Params" icon="mdi:tune-variant" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
          <div class="detail-grid">
            ${r.map(s=>o`
              <div class="detail-item">
                <span class="detail-label">${s.key}</span>
                <span class="detail-value">
                  ${s.description}
                  ${s.type||s.def!==void 0?o`<br><span class="detail-label">${[s.type,s.def!==void 0?`default ${JSON.stringify(s.def)}`:""].filter(Boolean).join(" · ")}</span>`:""}
                </span>
              </div>
            `)}
          </div>
        </lcards-form-section>
      `:""}

      <lcards-form-section header="Usage" icon="mdi:code-braces" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        ${this._renderCode(`animations:
  - trigger: on_tap
    preset: ${e.name}`)}
      </lcards-form-section>
    `}_renderSvgAssetDetail(e){return o`
      <lcards-form-section header="Details" icon="mdi:information-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Key</span>
            <span class="detail-value">${e.key}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Loaded</span>
            <span class="detail-value">${e.hasContent?"Yes":"Not yet"}</span>
          </div>
          ${e.url?o`
            <div class="detail-item">
              <span class="detail-label">URL</span>
              <span class="detail-value">${e.url}</span>
            </div>
          `:""}
          ${e.ship?o`
            <div class="detail-item">
              <span class="detail-label">Ship</span>
              <span class="detail-value">${e.ship}</span>
            </div>
          `:""}
          ${e.registry?o`
            <div class="detail-item">
              <span class="detail-label">Registry</span>
              <span class="detail-value">${e.registry}</span>
            </div>
          `:""}
          ${e.class?o`
            <div class="detail-item">
              <span class="detail-label">Class</span>
              <span class="detail-value">${e.class}</span>
            </div>
          `:""}
          ${e.era?o`
            <div class="detail-item">
              <span class="detail-label">Era</span>
              <span class="detail-value">${e.era}</span>
            </div>
          `:""}
          ${e.approximate_size?o`
            <div class="detail-item">
              <span class="detail-label">Size</span>
              <span class="detail-value">${e.approximate_size}</span>
            </div>
          `:""}
        </div>
      </lcards-form-section>

      ${e.description?o`
        <lcards-form-section header="Description" icon="mdi:text" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
          <p>${e.description}</p>
        </lcards-form-section>
      `:""}

      <lcards-form-section header="Preview" icon="mdi:eye-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        ${this._renderSvgPreview(e)}
      </lcards-form-section>

      ${e.author||e.license?o`
        <lcards-form-section header="Attribution" icon="mdi:copyright" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
          <div class="detail-grid">
            ${e.author?o`
              <div class="detail-item">
                <span class="detail-label">Author</span>
                <span class="detail-value">${e.author}</span>
              </div>
            `:""}
            ${e.license?o`
              <div class="detail-item">
                <span class="detail-label">License</span>
                <span class="detail-value">${e.license}</span>
              </div>
            `:""}
          </div>
        </lcards-form-section>
      `:""}
    `}_renderSvgPreview(e){var t;if(e.hasContent){const a=(t=window.lcards)==null?void 0:t.core;a!=null&&a.assetManager&&a.assetManager.get("svg",e.key).then(r=>{r&&r!==this._svgContent&&(this._svgContent=r,this._loadingSvg=false,this.requestUpdate())}).catch(r=>{d.error("[PackExplorer] Failed to load SVG:",r),this._loadingSvg=false,this.requestUpdate()})}return this._loadingSvg?o`
        <div class="preview-loading">
          <ha-spinner size="small"></ha-spinner>
          <p>Loading SVG preview</p>
        </div>
      `:this._svgContent?o`
        <div class="svg-preview-container">
          ${rt(this._svgContent)}
        </div>
      `:e.url?o`
        <div class="preview-placeholder">
          <ha-button @click=${()=>this._loadSvgPreview(e)}>
            <ha-icon slot="start" icon="mdi:eye-outline"></ha-icon>
            Load Preview
          </ha-button>
          <p class="preview-note">Click to load ${e.approximate_size||"SVG"}</p>
        </div>
      `:o`
      <div class="preview-placeholder">
        <p>No preview available</p>
      </div>
    `}async _loadSvgPreview(e){var a;const t=(a=window.lcards)==null?void 0:a.core;if(t!=null&&t.assetManager){this._loadingSvg=true,this._svgContent=null,this.requestUpdate();try{const r=await t.assetManager.get("svg",e.key);this._svgContent=r,this._loadingSvg=false,this.requestUpdate()}catch(r){d.error("[PackExplorer] Failed to load SVG preview:",r),this._loadingSvg=false,this.requestUpdate()}}}_loadPreviewFont(e){var t,a,r,s,i,n;return e&&((n=(i=(s=(r=(a=(t=window.lcards)==null?void 0:t.core)==null?void 0:a.assetManager)==null?void 0:r.loadFont)==null?void 0:s.call(r,e))==null?void 0:i.catch)==null||n.call(i,()=>{})),""}_renderFontAssetDetail(e){return o`
      <lcards-form-section header="Details" icon="mdi:information-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Key</span>
            <span class="detail-value">${e.key}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Loaded</span>
            <span class="detail-value">${e.hasContent?"Yes":"Not yet"}</span>
          </div>
          ${e.url?o`
            <div class="detail-item">
              <span class="detail-label">URL</span>
              <span class="detail-value">${e.url}</span>
            </div>
          `:""}
          ${e.family?o`
            <div class="detail-item">
              <span class="detail-label">Family</span>
              <span class="detail-value">${e.family}</span>
            </div>
          `:""}
          ${e.weight?o`
            <div class="detail-item">
              <span class="detail-label">Weight</span>
              <span class="detail-value">${e.weight}</span>
            </div>
          `:""}
          ${e.style?o`
            <div class="detail-item">
              <span class="detail-label">Style</span>
              <span class="detail-value">${e.style}</span>
            </div>
          `:""}
        </div>
      </lcards-form-section>

      ${this._loadPreviewFont(e.key)}
      ${e.key?o`
        <lcards-form-section header="Preview" icon="mdi:eye-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
          <div class="font-preview-container">
            <p class="font-sample" style="font-family: '${e.family||e.key}', sans-serif;">
              ABCDEFGHIJKLMNOPQRSTUVWXYZ<br>
              abcdefghijklmnopqrstuvwxyz<br>
              0123456789
            </p>
          </div>
        </lcards-form-section>
      `:""}
    `}_renderImageAssetDetail(e){return o`
      <lcards-form-section header="Details" icon="mdi:information-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Key</span>
            <span class="detail-value">${e.key}</span>
          </div>
          ${e.label?o`
            <div class="detail-item">
              <span class="detail-label">Label</span>
              <span class="detail-value">${e.label}</span>
            </div>
          `:""}
          ${e.category?o`
            <div class="detail-item">
              <span class="detail-label">Category</span>
              <span class="detail-value">${e.category}</span>
            </div>
          `:""}
          ${e.url?o`
            <div class="detail-item">
              <span class="detail-label">URL</span>
              <span class="detail-value" style="word-break:break-all">${e.url}</span>
            </div>
          `:""}
          ${e.description?o`
            <div class="detail-item">
              <span class="detail-label">Description</span>
              <span class="detail-value">${e.description}</span>
            </div>
          `:""}
        </div>
      </lcards-form-section>

      ${e.url?o`
        <lcards-form-section header="Preview" icon="mdi:eye-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
          <div class="image-preview-container">
            <img
              src="${Ue(e.url)}"
              alt="${e.label||e.key}"
              @error=${t=>{t.target.style.display="none",t.target.insertAdjacentHTML("afterend",'<span style="color:var(--secondary-text-color)">Image not found</span>')}}
            />
          </div>
        </lcards-form-section>
        <lcards-form-section header="Usage" icon="mdi:code-braces" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
          ${this._renderCode(`source: builtin:${e.key}`)}
        </lcards-form-section>
      `:""}
    `}_renderTexturePresetDetail(e){const{key:t,name:a,description:r,defaults:s}=e,i=Object.entries(s||{}).filter(([l,c])=>typeof c=="string"&&c.startsWith("rgba")),n=JSON.stringify(Object.fromEntries(Object.entries(s||{}).map(([l,c])=>[l,c])),null,2);return o`
      <lcards-form-section header="Details" icon="mdi:information-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Key</span>
            <span class="detail-value">${t}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Name</span>
            <span class="detail-value">${a}</span>
          </div>
          ${r?o`
            <div class="detail-item">
              <span class="detail-label">Description</span>
              <span class="detail-value">${r}</span>
            </div>
          `:""}
        </div>
      </lcards-form-section>

      ${i.length>0?o`
        <lcards-form-section header="Default Colours" icon="mdi:palette-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
          <div class="detail-grid">
            ${i.map(([l,c])=>o`
              <div class="detail-item">
                <span class="detail-label">${l}</span>
                <span class="texture-swatch">
                  <span class="texture-swatch-dot" style="background:${c}"></span>
                  ${c}
                </span>
              </div>
            `)}
          </div>
        </lcards-form-section>
      `:""}

      <lcards-form-section header="Preview" icon="mdi:eye-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        ${this._renderCardPreview(`texture:${t}`,"lcards-button",{preset:"lozenge",shape_texture:{preset:t},text:{label:{content:a||t,show:true}}},"width: 100%; max-width: 360px; height: 80px;")}
      </lcards-form-section>

      <lcards-form-section header="Default Config" icon="mdi:cog-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        ${this._renderCode(n)}
      </lcards-form-section>

      <lcards-form-section header="Usage" icon="mdi:code-braces" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        ${this._renderCode(`shape_texture:
  preset: ${t}`)}
      </lcards-form-section>
    `}_renderAudioAssetDetail(e){return o`
      <lcards-form-section header="Details" icon="mdi:information-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Key</span>
            <span class="detail-value">${e.key}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Loaded</span>
            <span class="detail-value">${e.hasContent?"Yes":"Not yet"}</span>
          </div>
          ${e.url?o`
            <div class="detail-item">
              <span class="detail-label">URL</span>
              <span class="detail-value">${e.url}</span>
            </div>
          `:""}
        </div>
      </lcards-form-section>

      ${e.description?o`
        <lcards-form-section header="Description" icon="mdi:text" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
          <p>${e.description}</p>
        </lcards-form-section>
      `:""}

      ${e.url?o`
        <lcards-form-section header="Preview" icon="mdi:eye-outline" ?expanded=${true} ?outlined=${true} ?noCollapse=${true}>
          <div class="audio-preview-container">
            <audio controls src="${Ue(e.url)}">
              Your browser does not support the audio element.
            </audio>
          </div>
        </lcards-form-section>
      `:""}
    `}render(){return o`
      <div class="studio-layout">
        <div class="split-pane-container">
          <!-- Left pane: tree -->
          <div class="tree-pane">
            <div class="tree-pane-header">
              <ha-icon icon="mdi:package-variant"></ha-icon>
              <span>Packs</span>
              <span class="tree-count">${this._treeData.length}</span>
            </div>
            <div class="tree-container">
              ${this._treeData.length===0?o`<p class="empty-state">No packs loaded</p>`:this._renderTreeNodes(this._treeData)}
            </div>
          </div>

          <!-- Right pane: detail -->
          <div class="detail-pane scroll-body">
            ${this._renderDetailPanel()}
          </div>
        </div>
      </div>
    `}};b(Ze,"LCARdSPackExplorerTab");let Ye=Ze;customElements.get("lcards-pack-explorer-tab")||customElements.define("lcards-pack-explorer-tab",Ye);function le(u,e=false){return o`<ha-assist-chip
      .filled=${true}
      .label=${e?"override":u}
      style="
        --ha-assist-chip-filled-container-color: ${u==="user"?"color-mix(in srgb, var(--info-color, #03a9f4) 25%, transparent)":u==="device"?"color-mix(in srgb, var(--success-color, #4caf50) 25%, transparent)":"color-mix(in srgb, var(--primary-color, #7b6ff0) 30%, transparent)"};
        --ha-assist-chip-label-text-color: ${u==="user"?"var(--info-color, #03a9f4)":u==="device"?"var(--success-color, #4caf50)":"var(--primary-color, #7b6ff0)"};
      "
    ></ha-assist-chip>`}b(le,"originBadge");const ct={cards:"Card Interactions",ui:"UI Navigation",alerts:"Alerts & System"},dt={cards:"color-mix(in srgb, var(--info-color, #03a9f4) 20%, transparent)",ui:"color-mix(in srgb, var(--success-color, #4caf50) 20%, transparent)",alerts:"color-mix(in srgb, var(--warning-color, #ff9800) 20%, transparent)"},ht={cards:"var(--info-color, #03a9f4)",ui:"var(--success-color, #4caf50)",alerts:"var(--warning-color, #ff9800)"},de=class de2 extends M{constructor(){super(),this.hass=void 0,this._helpers=[],this._audioAssets=[],this._overrides={},this._overridesScheme=void 0,this._schemeNames=["none"],this._eventTypes=[],this._creatingHelpers=false,this._helperSubscriptions=[],this._scopeTab="user",this._scopedValues=null,this._scopedLoading=false,this._scopedOverrides=null,this._scopedOverridesLoading=false,this._adminScopeUserId=null,this._adminScopeDeviceId=null,this._adminTargetBasic=null,this._savingScheme=false,this._newSchemeName="",this._saveSchemeError=null,this._overridesError=null,this._overridesDirty=false}connectedCallback(){super.connectedCallback(),this._refresh(),this._subscribeToHelpers()}disconnectedCallback(){super.disconnectedCallback(),this._helperSubscriptions.forEach(e=>e()),this._helperSubscriptions=[]}willUpdate(e){super.willUpdate(e),e.has("hass")&&this.hass&&this._refresh()}_refresh(){var r,s,i,n,l,c;const e=(s=(r=window.lcards)==null?void 0:r.core)==null?void 0:s.soundManager,t=(n=(i=window.lcards)==null?void 0:i.core)==null?void 0:n.helperManager,a=(c=(l=window.lcards)==null?void 0:l.core)==null?void 0:c.assetManager;if(t){if(this._helpers=(t.getHelpersByCategory("sound")||[]).map(h=>{var g,v;const p=(v=(g=this.hass)==null?void 0:g.states)==null?void 0:v[h.entity_id];return{...h,exists:!!p,currentValue:p?p.state:t.getHelperValue(h.key)??h.default_value}}),a)try{const h=a.getRegistry("audio");this._audioAssets=Array.from(h.assets.entries()).map(([p,g])=>{var v,_;return{key:p,description:((v=g.metadata)==null?void 0:v.description)||p,pack:((_=g.metadata)==null?void 0:_.pack)||"unknown"}})}catch{this._audioAssets=[]}if(e){this._schemeNames=e.getSchemeNames(),this._eventTypes=e.getEventTypes();const h=this._getHelperValue("sound_scheme")||"none";(!this._overridesDirty||h!==this._overridesScheme)&&this._reloadOverridesForActiveScheme()}this.requestUpdate()}}_reloadOverridesForActiveScheme(){var a,r;const e=(r=(a=window.lcards)==null?void 0:a.core)==null?void 0:r.soundManager;if(!e)return;const t=this._getHelperValue("sound_scheme")||"none";this._overridesScheme=t,this._overrides=e.isCustomScheme(t)?e.getSchemeMapping(t):e.getOverrides("global"),this._overridesDirty=false}_subscribeToHelpers(){var a,r;const e=(r=(a=window.lcards)==null?void 0:a.core)==null?void 0:r.helperManager;if(!e)return;const t=(e.getHelpersByCategory("sound")||[]).map(s=>s.key);t.forEach(s=>{const i=e.subscribeToHelper(s,n=>{this._helpers=this._helpers.map(l=>l.key===s?{...l,currentValue:n}:l),s==="sound_scheme"&&this._reloadOverridesForActiveScheme(),this.requestUpdate(),d.trace(`[SoundConfigTab] Helper updated: ${s} = ${n}`)});this._helperSubscriptions.push(i)}),d.debug(`[SoundConfigTab] Subscribed to ${t.length} sound helpers`)}async _createAllMissingHelpers(){var t,a;const e=(a=(t=window.lcards)==null?void 0:t.core)==null?void 0:a.helperManager;if(e){this._creatingHelpers=true,this.requestUpdate();try{for(const r of this._helpers.filter(s=>!s.exists))await e.ensureHelper(r.key),d.info(`[SoundConfigTab] Created helper: ${r.key}`)}catch(r){d.error("[SoundConfigTab] Failed to create helpers:",r)}this._creatingHelpers=false,this._refresh()}}async _createHelper(e){var a,r;const t=(r=(a=window.lcards)==null?void 0:a.core)==null?void 0:r.helperManager;if(t)try{await t.ensureHelper(e),this._refresh()}catch(s){d.error(`[SoundConfigTab] Failed to create helper ${e}:`,s)}}async _setHelperValue(e,t){var r,s;const a=(s=(r=window.lcards)==null?void 0:r.core)==null?void 0:s.helperManager;if(a)try{await a.setHelperValue(e,t),this._helpers=this._helpers.map(i=>i.key===e?{...i,currentValue:t}:i),this.requestUpdate()}catch(i){d.error(`[SoundConfigTab] Failed to set ${e}:`,i)}}async _selectScheme(e){var a,r;const t=(r=(a=window.lcards)==null?void 0:a.core)==null?void 0:r.soundManager;t&&await t.waitForSchemeSync(),await this._setHelperValue("sound_scheme",e)}async _loadScopedValues(){var a,r,s,i;const e=(r=(a=window.lcards)==null?void 0:a.core)==null?void 0:r.scopedSettingsService,t=(i=(s=window.lcards)==null?void 0:s.core)==null?void 0:i.helperManager;if(!(!e||this._scopedLoading)){this._scopedLoading=true,this.requestUpdate();try{const[n,l,c]=await Promise.all([e.readAllScopes(V,()=>t==null?void 0:t.getHelperValue("sound_volume")),e.readAllScopes(D,()=>t==null?void 0:t.getHelperValue("sound_scheme")),e.readAllScopes(O,()=>t==null?void 0:t.getHelperValue("sound_enabled"))]);this._scopedValues={[V]:n,[D]:l,[O]:c},d.debug("[SoundConfigTab] Loaded scoped values",this._scopedValues)}catch(n){d.error("[SoundConfigTab] Failed to load scoped values:",n)}finally{this._scopedLoading=false,this.requestUpdate()}}}async _setScopedValue(e,t,a){var s,i,n,l,c;const r=(i=(s=window.lcards)==null?void 0:s.core)==null?void 0:i.scopedSettingsService;if(r){try{await r.write(e,t,a),d.info(`[SoundConfigTab] Wrote ${e}=${t} to ${a} scope`)}catch(h){d.error(`[SoundConfigTab] Failed to write ${e} to ${a}:`,h)}this._scopedValues=null,await this._loadScopedValues(),await((c=(l=(n=window.lcards)==null?void 0:n.core)==null?void 0:l.soundManager)==null?void 0:c.refreshScopedCache())}}async _clearScopedValue(e,t){var r,s,i,n,l;const a=(s=(r=window.lcards)==null?void 0:r.core)==null?void 0:s.scopedSettingsService;if(a){try{await a.clear(e,t),d.info(`[SoundConfigTab] Cleared ${e} from ${t} scope`)}catch(c){d.error(`[SoundConfigTab] Failed to clear ${e} from ${t}:`,c)}this._scopedValues=null,await this._loadScopedValues(),await((l=(n=(i=window.lcards)==null?void 0:i.core)==null?void 0:n.soundManager)==null?void 0:l.refreshScopedCache())}}async _setScopedValueAdmin(e,t,a){var s;const r=(s=this.hass)==null?void 0:s.connection;if(r)try{a==="user"&&this._adminScopeUserId?await r.sendMessagePromise({type:"lcards/storage/users/set",user_id:this._adminScopeUserId,data:{[e]:t}}):a==="device"&&this._adminScopeDeviceId&&await r.sendMessagePromise({type:"lcards/storage/devices/set",device_id:this._adminScopeDeviceId,data:{[e]:t}}),await this._loadScopedOverrides()}catch(i){d.error(`[SoundConfigTab] Admin write ${e} failed:`,i)}}_onScopeChanged(e){const{scope:t,userId:a,deviceId:r}=e.detail;this._scopeTab=t,this._adminScopeUserId=a??null,this._adminScopeDeviceId=r??null,this._scopedValues=null,this._scopedOverrides=null,this._adminTargetBasic=null,this._loadScopedValues(),this._loadScopedOverrides()}async _loadScopedOverrides(){var a,r,s,i,n;const e=(a=this.hass)==null?void 0:a.connection,t=(s=(r=window.lcards)==null?void 0:r.core)==null?void 0:s.scopedSettingsService;if(!(!t||!e)){this._scopedOverridesLoading=true,this.requestUpdate();try{const l=this._scopeTab;let c=null;if(l==="user"){const h=this._adminScopeUserId;if(h){const p=await e.sendMessagePromise({type:"lcards/storage/users/get",user_id:h}),g=(p==null?void 0:p.value)??{};c=g[j]??null,this._adminTargetBasic={[V]:g[V]??null,[D]:g[D]??null,[O]:g[O]??null}}else{const p=await t.readAllScopes(j,()=>({}));c=(p==null?void 0:p.user)??null,this._adminTargetBasic=null}}else{const h=(n=(i=window.lcards)==null?void 0:i.core)==null?void 0:n.deviceIdentityManager,p=this._adminScopeDeviceId??(h==null?void 0:h.deviceId);if(p){const g=await e.sendMessagePromise({type:"lcards/storage/device/get",device_id:p}),v=(g==null?void 0:g.value)??{};c=v[j]??null,this._adminScopeDeviceId?this._adminTargetBasic={[V]:v[V]??null,[D]:v[D]??null,[O]:v[O]??null}:this._adminTargetBasic=null}}this._scopedOverrides=c??{},d.debug("[SoundConfigTab] Loaded scoped overrides:",this._scopedOverrides)}catch(l){d.error("[SoundConfigTab] Failed to load scoped overrides:",l),this._scopedOverrides={}}finally{this._scopedOverridesLoading=false,this.requestUpdate()}}}_scopedTargetOpts(e){return e==="user"&&this._adminScopeUserId?{targetUserId:this._adminScopeUserId}:e==="device"&&this._adminScopeDeviceId?{targetDeviceId:this._adminScopeDeviceId}:{}}async _setScopedOverride(e,t,a){var l,c,h,p,g;const r=(c=(l=window.lcards)==null?void 0:l.core)==null?void 0:c.scopedSettingsService;if(!r)return;const s=t==="__scheme__"?void 0:t==="__mute__"?null:t,i={...this._scopedOverrides??{}};s===void 0?delete i[e]:i[e]=s;const n=this._scopedTargetOpts(a);try{(Object.keys(i).length>0?await r.write(j,i,a,n):await r.clear(j,a,n))||d.warn(`[SoundConfigTab] Scoped override for ${e} not saved to ${a}`),await this._loadScopedOverrides(),await((g=(p=(h=window.lcards)==null?void 0:h.core)==null?void 0:p.soundManager)==null?void 0:g.refreshScopedCache())}catch(v){d.error("[SoundConfigTab] Failed to set scoped override:",v)}}async _clearScopedOverride(e,t){return this._setScopedOverride(e,"__scheme__",t)}async _clearAllScopedOverrides(e){var a,r,s,i,n;const t=(r=(a=window.lcards)==null?void 0:a.core)==null?void 0:r.scopedSettingsService;if(t)try{await t.clear(j,e,this._scopedTargetOpts(e)),await this._loadScopedOverrides(),await((n=(i=(s=window.lcards)==null?void 0:s.core)==null?void 0:i.soundManager)==null?void 0:n.refreshScopedCache())}catch(l){d.error("[SoundConfigTab] Failed to clear all scoped overrides:",l)}}_isAdmin(){var e,t;return((t=(e=this.hass)==null?void 0:e.user)==null?void 0:t.is_admin)===true}_canEditGlobal(){return Oe(this.hass)}_globalWriteError(e){return this._canEditGlobal()?e||"Could not save.":Je}_isPreviewEnabled(){var e,t,a,r;return((r=(a=(t=(e=window.lcards)==null?void 0:e.core)==null?void 0:t.integrationService)==null?void 0:a.options)==null?void 0:r.enable_previews)??false}_getHelperValue(e){var t;return(t=this._helpers.find(a=>a.key===e))==null?void 0:t.currentValue}_helperExists(e){var t;return((t=this._helpers.find(a=>a.key===e))==null?void 0:t.exists)??false}_masterEnabled(){const e=this._getHelperValue("sound_enabled");return e===true||e==="on"}async _previewScheme(e){var t,a,r;(r=(a=(t=window.lcards)==null?void 0:t.core)==null?void 0:a.soundManager)==null||r.previewScheme(e)}async _previewAsset(e){var t,a,r;!e||e==="__scheme__"||e==="__mute__"||(r=(a=(t=window.lcards)==null?void 0:t.core)==null?void 0:a.soundManager)==null||r.preview(e)}_previewEvent(e){var t,a,r;(r=(a=(t=window.lcards)==null?void 0:t.core)==null?void 0:a.soundManager)==null||r.previewEvent(e)}_setOverride(e,t){const a={...this._overrides};t==="__scheme__"?delete a[e]:t==="__mute__"?a[e]=null:a[e]=t,this._overrides=a,this._overridesDirty=true,this.requestUpdate()}async _saveOverrideChanges(){var a,r;const e=(r=(a=window.lcards)==null?void 0:a.core)==null?void 0:r.soundManager;if(!e)return;const t=this._getHelperValue("sound_scheme")||"none";if(e.isCustomScheme(t)){const s=await e.updateCustomScheme(t,this._overrides);if(!s.ok){d.error("[SoundConfigTab] Failed to save custom scheme changes:",s.error),this._overridesError=this._globalWriteError(s.error),this.requestUpdate();return}}else if(!await e.saveGlobalOverrides(this._overrides)){this._overridesError=this._globalWriteError("Could not save the overrides."),this.requestUpdate();return}this._overridesError=null,this._overridesDirty=false,this.requestUpdate()}_discardOverrideChanges(){this._reloadOverridesForActiveScheme(),this.requestUpdate()}async _askResetOverrides(){const e=Object.keys(this._overrides).length;await ie({title:"Reset to scheme defaults?",message:`This clears all ${e} event override${e!==1?"s":""} and restores the scheme's own sounds.`,confirmText:"Reset all"})&&await this._resetOverrides()}async _resetOverrides(){var t,a;const e=(a=(t=window.lcards)==null?void 0:t.core)==null?void 0:a.soundManager;if(e){if(!await e.clearAllOverrides("global")){this._overridesError=this._globalWriteError("Could not reset the overrides."),await e.refreshScopedCache(),this._overrides=e.getOverrides("global"),this.requestUpdate();return}this._overridesError=null,this._overrides=e.getOverrides("global"),this._overridesDirty=false,this.requestUpdate()}}_askSaveScheme(){this._savingScheme=true,this._newSchemeName="",this._saveSchemeError=null,this.requestUpdate()}_cancelSaveScheme(){this._savingScheme=false,this._saveSchemeError=null,this.requestUpdate()}async _confirmSaveScheme(){var i,n;const e=(n=(i=window.lcards)==null?void 0:i.core)==null?void 0:n.soundManager;if(!e)return;const t=this._getHelperValue("sound_scheme")||"none",r=!e.isCustomScheme(t)?{...e.getActiveSchemeMapping(),...this._overrides}:{...this._overrides},s=await e.saveCustomScheme(this._newSchemeName,r);if(!s.ok){this._saveSchemeError=this._globalWriteError(s.error),this.requestUpdate();return}await e.waitForSchemeSync(),this._schemeNames=e.getSchemeNames(),this._savingScheme=false,this._saveSchemeError=null,await this._setHelperValue("sound_scheme",s.name),this._reloadOverridesForActiveScheme(),this.requestUpdate()}async _askDeleteScheme(){const e=this._getHelperValue("sound_scheme");await ie({title:"Delete custom scheme?",message:`Permanently delete the custom scheme "${String(e).slice(7)}"? This cannot be undone.`})&&await this._deleteScheme(e)}async _deleteScheme(e){var r,s;const t=(s=(r=window.lcards)==null?void 0:r.core)==null?void 0:s.soundManager;if(!t)return;const a=await t.deleteCustomScheme(e);if(!a.ok){d.error("[SoundConfigTab] Failed to delete custom scheme:",a.error),this._overridesError=this._globalWriteError(a.error),this.requestUpdate();return}await t.waitForSchemeSync(),this._schemeNames=t.getSchemeNames(),await this._setHelperValue("sound_scheme","none"),this._reloadOverridesForActiveScheme(),this.requestUpdate()}_overrideValueFor(e){if(e in this._overrides){const t=this._overrides[e];return t===null?"__mute__":t}return"__scheme__"}render(){var i,n,l,c,h,p,g,v,_;const e=this._helpers.filter(m=>!m.exists),t=this._masterEnabled(),a=this._getHelperValue("sound_scheme")||"none",r=parseFloat(this._getHelperValue("sound_volume")??.5),s=this._canEditGlobal();return o`
      <div class="studio-layout"><div class="scrollable-body">

        <!-- ── MISSING HELPERS BANNER ── -->
        ${e.length>0?o`
          <div class="banner warning">
            <ha-icon icon="mdi:alert-circle"></ha-icon>
            <span>${e.length} sound helper${e.length>1?"s are":" is"} missing in Home Assistant.</span>
            <ha-button
              @click=${this._createAllMissingHelpers}
              ?disabled=${this._creatingHelpers}
            >
              ${this._creatingHelpers?"Creating…":"Create All"}
            </ha-button>
          </div>
        `:""}

        <!-- ── BROWSER AUTOPLAY NOTICE ── -->
        <lcards-message
          type="info"
          .message=${`Most sounds play after your first tap. <em>System Ready</em> plays on page load only if the browser allows autoplay here. <a href="${oe(ve.soundAutoplay)}" target="_blank" rel="noopener noreferrer">Browser setup</a>`}
        ></lcards-message>

        <!-- ── GLOBAL SETTINGS GROUP ── -->
        <lcards-form-section
          header=${s?"Global Settings":"Shared Defaults"}
          icon="mdi:earth"
          description=${s?"Default sound behaviour for all users and devices. Per-user / per-device overrides are in the section below. Note: Sound Categories are global-only.":"The sound defaults every user and device starts from."}
          ?expanded=${true}
          ?outlined=${true}>
          <div class="nested-sections">
          ${s?"":o`
            <lcards-message
              type="info"
              message="An administrator sets these defaults. To change sound for yourself or this device, use Per-User / Per-Device Overrides below."
            ></lcards-message>
          `}

        <!-- ── MASTER CONTROLS ── -->
        <lcards-form-section
          header="Master Controls"
          icon="mdi:volume-high"
          ?expanded=${true}
          ?outlined=${true}>

          <div class="control-row">
            <ha-selector
              .hass=${this.hass}
              .label=${"Sound effects enabled"}
              .helper=${"Master on/off for all LCARdS sounds"}
              .selector=${{boolean:{}}}
              .value=${t}
              ?disabled=${!this._helperExists("sound_enabled")||!s}
              @value-changed=${m=>{m.stopPropagation(),this._setHelperValue("sound_enabled",m.detail.value)}}
            ></ha-selector>
          </div>

          <div class="control-row ${t?"":"dimmed"}">
            <ha-selector
              .hass=${this.hass}
              .label=${"Volume"}
              .helper=${"Master volume for all sound effects"}
              .selector=${{number:{min:0,max:1,step:.05,mode:"slider"}}}
              .value=${r}
              ?disabled=${!this._helperExists("sound_volume")||!t||!s}
              @value-changed=${m=>this._setHelperValue("sound_volume",m.detail.value)}
            ></ha-selector>
          </div>
        </lcards-form-section>

        <!-- ── CATEGORY TOGGLES ── -->
        <lcards-form-section
          header="Sound Categories"
          icon="mdi:tune"
          ?expanded=${false}
          ?outlined=${true}
          class="${t?"":"dimmed"}">

          ${[{key:"sound_cards_enabled",label:"Card interaction sounds",hint:"Button taps, holds, sliders, toggles"},{key:"sound_ui_enabled",label:"UI navigation sounds",hint:"Sidebar, page transitions, menus"},{key:"sound_alerts_enabled",label:"Alert and system sounds",hint:"Alert mode changes, system events"}].map(m=>o`
            <div class="control-row">
              <ha-selector
                .hass=${this.hass}
                .label=${m.label}
                .helper=${m.hint}
                .selector=${{boolean:{}}}
                .value=${this._getHelperValue(m.key)!=="off"&&this._getHelperValue(m.key)!==false}
                ?disabled=${!this._helperExists(m.key)||!t||!s}
                @value-changed=${w=>{w.stopPropagation(),this._setHelperValue(m.key,w.detail.value)}}
              ></ha-selector>
            </div>
          `)}
        </lcards-form-section>

        <!-- ── SOUND SCHEME ── -->
        <lcards-form-section
          header="Sound Scheme"
          icon="mdi:music-box-multiple"
          ?expanded=${false}
          ?outlined=${true}
          class="${t?"":"dimmed"}">

          ${this._schemeNames.length<=1?o`
            <div class="empty-hint">
              <ha-icon icon="mdi:information-outline"></ha-icon>
              No audio packs loaded. Add an audio pack to get sound schemes.
            </div>
          `:""}

          <div class="control-row">
            <div class="scheme-row">
              <ha-selector
                .hass=${this.hass}
                .label=${"Active scheme"}
                .helper=${'"None (silent)" plays nothing by default; per-event overrides below still apply on top of it'}
                .selector=${{select:{options:this._schemeNames.map(m=>({value:m,label:m==="none"?"None (silent)":m.startsWith("custom:")?`${m.slice(7)} (custom)`:m})),mode:"dropdown"}}}
                .value=${a}
                ?disabled=${!this._helperExists("sound_scheme")||!t||!s}
                @value-changed=${m=>this._selectScheme(m.detail.value)}
              ></ha-selector>
              ${a!=="none"?o`
                <ha-button
                  @click=${()=>this._previewScheme(a)}
                  ?disabled=${!t}
                >
                  <ha-icon slot="start" icon="mdi:play-circle"></ha-icon>
                  Preview
                </ha-button>
              `:""}
              ${this._canEditGlobal()&&((l=(n=(i=window.lcards)==null?void 0:i.core)==null?void 0:n.soundManager)!=null&&l.isCustomScheme(a))?o`
                <ha-button
                  @click=${this._askDeleteScheme}
                  variant="danger"
                  ?disabled=${!t}
                >
                  <ha-icon slot="start" icon="mdi:delete"></ha-icon>
                  Delete
                </ha-button>
              `:""}
            </div>
          </div>

          <!-- ── PER-EVENT OVERRIDES (subsection — reflects whichever scheme is selected above;
               global overrides still apply on top of 'none', which is a genuine empty scheme) ── -->
          <lcards-form-section
              header="Per-Event Overrides"
              icon="mdi:tune-variant"
              description=${(p=(h=(c=window.lcards)==null?void 0:c.core)==null?void 0:h.soundManager)!=null&&p.isCustomScheme(a)?`Editing "${a.slice(7)}" directly: click Save to commit changes to this custom scheme`:"Override individual events on top of the active (built-in) scheme. Click Save to commit changes"}
              ?expanded=${false}
              ?outlined=${true}
              class="${t?"":"dimmed"}">

              ${this._audioAssets.length===0?o`
                <div class="empty-hint">
                  <ha-icon icon="mdi:information-outline"></ha-icon>
                  No audio assets registered. Load an audio pack to enable overrides.
                </div>
              `:""}

              ${this._eventTypes.length>0?o`
                ${this._canEditGlobal()?o`
                  <lcards-message
                    type="info"
                    message="Overrides are stored in LCARdS Integration persistent storage.  See Storage tab for details."
                  ></lcards-message>
                `:o`
                  <lcards-message
                    type="info"
                    message="Only an administrator can change these overrides and custom schemes. Set your own sounds under Per-User / Per-Device Overrides below."
                  ></lcards-message>
                `}
                ${this._overridesError?o`
                  <lcards-message type="error" .message=${this._overridesError}></lcards-message>
                `:""}

                <!-- ── One dynamic action area — save-scheme form, reset confirm, or the
                     steady-state action row are mutually exclusive, so they share a single slot
                     instead of stacking as separate banners. ── -->
                ${this._canEditGlobal()?this._savingScheme?o`
                  <div class="banner info save-scheme-banner">
                    <div class="save-scheme-header">
                      <ha-icon icon="mdi:content-save-plus"></ha-icon>
                      <span>Save the current ${Object.keys(this._overrides).length} event${Object.keys(this._overrides).length!==1?"s":""} as a new, named sound scheme. Nothing currently active is changed.</span>
                    </div>
                    <ha-selector
                      .hass=${this.hass}
                      .selector=${{text:{}}}
                      .value=${this._newSchemeName}
                      .label=${"Scheme Name"}
                      @value-changed=${m=>{this._newSchemeName=m.detail.value}}
                    ></ha-selector>
                    ${this._saveSchemeError?o`<span class="error-text">${this._saveSchemeError}</span>`:""}
                    <div class="confirm-actions">
                      <ha-button @click=${this._confirmSaveScheme}>Save</ha-button>
                      <ha-button appearance="plain" @click=${this._cancelSaveScheme}>Cancel</ha-button>
                    </div>
                  </div>
                `:this._overridesDirty||Object.keys(this._overrides).length>0?o`
                  <div class="overrides-action-row ${this._overridesDirty?"dirty":""}">
                    ${this._overridesDirty?o`
                      <span class="dirty-indicator">
                        <ha-icon icon="mdi:content-save-alert"></ha-icon>
                        Unsaved changes
                      </span>
                      <ha-button @click=${this._saveOverrideChanges}>
                        <ha-icon slot="start" icon="mdi:content-save"></ha-icon>
                        Save
                      </ha-button>
                      <ha-button class="danger-btn" variant="danger" @click=${this._discardOverrideChanges}>Discard</ha-button>
                    `:""}
                    ${Object.keys(this._overrides).length>0?o`
                      <ha-button @click=${this._askSaveScheme} class="save-scheme-btn">
                        <ha-icon slot="start" icon="mdi:content-save-plus"></ha-icon>
                        Save as new scheme…
                      </ha-button>
                    `:""}
                    ${!((_=(v=(g=window.lcards)==null?void 0:g.core)==null?void 0:v.soundManager)!=null&&_.isCustomScheme(a))&&Object.keys(this._overrides).length>0?o`
                      <ha-button @click=${this._askResetOverrides} class="reset-overrides-btn" variant="warning">
                        <ha-icon slot="start" icon="mdi:restore"></ha-icon>
                        Reset to scheme defaults
                      </ha-button>
                    `:""}
                  </div>
                `:"":""}

                <div class="overrides-table-wrapper">
                  <table class="overrides-table">
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Category</th>
                        <th>Override</th>
                        <th style="width:60px;"></th>
                      </tr>
                    </thead>
                    <tbody>
                      ${this._eventTypes.map(m=>{var $,C,S;const w=this._overrideValueFor(m.key);return o`
                          <tr class="${w!=="__scheme__"?"has-override":""}">
                            <td class="event-label">${m.label}</td>
                            <td>
                              <ha-assist-chip
                                .filled=${true}
                                .label=${ct[m.category]||m.category}
                                style="
                                  --ha-assist-chip-filled-container-color: ${dt[m.category]||"var(--secondary-background-color)"};
                                  --ha-assist-chip-label-text-color: ${ht[m.category]||"var(--primary-text-color)"};
                                "
                              ></ha-assist-chip>
                            </td>
                            <td>
                              <lcards-sound-source-selector
                                .hass=${this.hass}
                                .value=${w}
                                .audioAssets=${this._audioAssets}
                                .schemeLabel=${(S=(C=($=window.lcards)==null?void 0:$.core)==null?void 0:C.soundManager)!=null&&S.isCustomScheme(a)?"(Not set in this scheme: silent)":"(Use scheme default)"}
                                ?disabled=${!t||!this._canEditGlobal()}
                                @value-changed=${k=>this._setOverride(m.key,k.detail.value)}
                              ></lcards-sound-source-selector>
                            </td>
                            <td>
                              ${w!=="__mute__"?o`
                                <ha-icon-button
                                  .label=${"Preview"}
                                  @click=${()=>w==="__scheme__"?this._previewEvent(m.key):this._previewAsset(w)}
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
              `:""}
            </lcards-form-section>
        </lcards-form-section>

          </div><!-- /nested-sections -->
        </lcards-form-section><!-- /global-settings-group -->

        <!-- ── SCOPED OVERRIDES (User / Device level) ── -->
        ${this._renderScopedSection()}

        <!-- ── HELPER STATUS ── -->
        <lcards-form-section
          header="Sound Helpers Status"
          icon="mdi:cog"
          ?expanded=${false}
          ?outlined=${true}>
          <table class="helper-status-table">
            <thead>
              <tr>
                <th>Helper</th>
                <th>Entity ID</th>
                <th style="width:100px">Status</th>
                <th style="width:80px"></th>
              </tr>
            </thead>
            <tbody>
              ${this._helpers.map(m=>o`
                <tr>
                  <td>
                    <ha-icon icon="${m.icon||"mdi:cog"}" style="color: var(--primary-color);"></ha-icon>
                    <span class="helper-name">${m.name}</span>
                  </td>
                  <td><span class="entity-id">${m.entity_id}</span></td>
                  <td>
                    <ha-assist-chip
                      .label=${m.exists?"Exists":"Missing"}
                      style="
                        --ha-assist-chip-filled-container-color: ${m.exists?"var(--success-color)":"var(--error-color)"};
                        --ha-assist-chip-label-text-color: white;
                      "
                    >
                      <ha-icon icon="${m.exists?"mdi:check-circle":"mdi:alert-circle"}" slot="icon"></ha-icon>
                    </ha-assist-chip>
                  </td>
                  <td>
                    ${m.exists?"":o`
                      <ha-button @click=${()=>this._createHelper(m.key)}>
                        <ha-icon slot="start" icon="mdi:plus"></ha-icon>
                        Create
                      </ha-button>
                    `}
                  </td>
                </tr>
              `)}
            </tbody>
          </table>
        </lcards-form-section>

      </div></div>
    `}_renderScopedSection(){var w,f,$,C,S,k,X,y;if(!(((f=(w=window.lcards)==null?void 0:w.core)==null?void 0:f.scopedSettingsService)&&((k=(S=(C=($=window.lcards)==null?void 0:$.core)==null?void 0:C.integrationService)==null?void 0:S.capabilities)==null?void 0:k.has("scoped_storage"))))return o`
        <lcards-form-section
          header="Per-User / Per-Device Overrides"
          icon="mdi:account-cog"
          ?expanded=${false}
          ?outlined=${true}>
          <lcards-message
            type="info"
            message="Needs the LCARdS integration, which stores these overrides per user and per device."
          ></lcards-message>
        </lcards-form-section>
      `;const a=this._scopeTab,r=this._isAdmin(),s=this._masterEnabled(),i=this._schemeNames;!this._scopedValues&&!this._scopedLoading&&this._loadScopedValues(),this._scopedOverrides===null&&!this._scopedOverridesLoading&&this._loadScopedOverrides();const n=a==="user"?this._adminScopeUserId:this._adminScopeDeviceId,l=r&&!!n,c=this._scopedValues,h=b(x=>{var E,G;return l?((E=this._adminTargetBasic)==null?void 0:E[x])??null:((G=c==null?void 0:c[x])==null?void 0:G[a])??null},"basicVal"),p=b(x=>h(x)!==null&&h(x)!==void 0,"basicHasOverride"),g=b((x,E)=>{l?this._setScopedValueAdmin(x,E,a):this._setScopedValue(x,E,a)},"setBasic"),v=b(x=>{l?this._setScopedValueAdmin(x,null,a):this._clearScopedValue(x,a)},"clearBasic"),_=b(x=>{var G;const E=(G=this._scopedOverrides)==null?void 0:G[x];return E===null?"__mute__":E===void 0||!(x in(this._scopedOverrides??{}))?"__scheme__":E},"scopedOverrideValueFor"),m=Object.keys(this._scopedOverrides??{}).length>0;return o`
      <lcards-form-section
        header="Per-User / Per-Device Overrides"
        icon="mdi:account-cog"
        description="Override sound settings for a specific user or device, without changing the global defaults."
        ?expanded=${false}
        ?outlined=${true}>

        <!-- ── SCOPE SELECTOR (tabs + admin subject + context banner) ── -->
        <lcards-scope-selector
          .hass=${this.hass}
          .showGlobal=${false}
          @scope-changed=${this._onScopeChanged}
        ></lcards-scope-selector>

        <!-- ── LOADING / SETTINGS BODY ── -->
        ${this._scopedLoading&&!l||this._scopedOverridesLoading?o`
          <div class="scoped-loading">
            <ha-spinner size="small"></ha-spinner>
            Loading…
          </div>
        `:o`

          <!-- ╴╴╴ BASIC SETTINGS ╴╴╴ -->
          <!-- Master Enabled (user and device scope) -->
          <div class="scoped-row">
            <div class="scoped-label">
              <span>Sound Effects Enabled</span>
              ${le(p(O)?a:"global",l)}
            </div>
            <div class="scoped-control">
              <ha-selector
                .hass=${this.hass}
                .selector=${{boolean:{}}}
                .value=${h(O)!==null?h(O)===true||h(O)==="on":s}
                @value-changed=${x=>{x.stopPropagation(),g(O,x.detail.value)}}
              ></ha-selector>
              ${p(O)?o`
                <ha-icon-button
                  .label=${"Clear override"}
                  @click=${()=>v(O)}
                ><ha-icon icon="mdi:close-circle-outline"></ha-icon></ha-icon-button>
              `:""}
            </div>
          </div>

          <!-- Volume -->
          <div class="scoped-row">
            <div class="scoped-label">
              <span>Volume</span>
              ${le(p(V)?a:"global",l)}
            </div>
            <div class="scoped-control">
              <ha-selector
                .hass=${this.hass}
                .selector=${{number:{min:0,max:1,step:.05,mode:"slider"}}}
                .value=${h(V)!==null?parseFloat(h(V)):parseFloat(((X=c==null?void 0:c[V])==null?void 0:X.resolved)??.5)}
                @value-changed=${x=>g(V,x.detail.value)}
              ></ha-selector>
              ${p(V)?o`
                <ha-icon-button
                  .label=${"Clear override"}
                  @click=${()=>v(V)}
                ><ha-icon icon="mdi:close-circle-outline"></ha-icon></ha-icon-button>
              `:""}
            </div>
          </div>

          <!-- Scheme -->
          <div class="scoped-row">
            <div class="scoped-label">
              <span>Sound Scheme</span>
              ${le(p(D)?a:"global",l)}
            </div>
            <div class="scoped-control">
              <ha-selector
                .hass=${this.hass}
                .selector=${{select:{options:i.map(x=>({value:x,label:x==="none"?"None (silent)":x})),mode:"dropdown"}}}
                .value=${h(D)??((y=c==null?void 0:c[D])==null?void 0:y.resolved)??"none"}
                ?disabled=${!s}
                @value-changed=${x=>g(D,x.detail.value)}
              ></ha-selector>
              ${p(D)?o`
                <ha-icon-button
                  .label=${"Clear override"}
                  @click=${()=>v(D)}
                ><ha-icon icon="mdi:close-circle-outline"></ha-icon></ha-icon-button>
              `:""}
            </div>
          </div>

          <!-- ╴╴╴ PER-EVENT OVERRIDES ╴╴╴ -->
          <div class="scoped-overrides-header">
            <ha-icon icon="mdi:tune"></ha-icon>
            <span>Per-Event Overrides
              <span class="hint">&nbsp;·&nbsp;override individual events at the ${a} level</span>
            </span>
            ${m?o`
              <ha-button
                class="clear-all-btn"
                @click=${()=>this._clearAllScopedOverrides(a)}
              >
                <ha-icon slot="start" icon="mdi:close-circle-outline"></ha-icon>
                Clear All
              </ha-button>
            `:""}
          </div>

          ${this._eventTypes.length===0?o`
            <div class="scoped-loading">No event types loaded yet.</div>
          `:o`
            <div class="overrides-table-wrapper">
              <table class="overrides-table scoped-overrides-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Category</th>
                    <th>Override</th>
                    <th style="width:60px;"></th>
                  </tr>
                </thead>
                <tbody>
                  ${this._eventTypes.map(x=>{const E=_(x.key);return o`
                      <tr class="${E!=="__scheme__"?"has-override":""}">
                        <td class="event-label">${x.label}</td>
                        <td>
                          <ha-assist-chip
                            .filled=${true}
                            .label=${ct[x.category]||x.category}
                            style="
                              --ha-assist-chip-filled-container-color: ${dt[x.category]??"transparent"};
                              --ha-assist-chip-label-text-color: ${ht[x.category]??"inherit"};
                            "
                          ></ha-assist-chip>
                        </td>
                        <td>
                          <lcards-sound-source-selector
                            .hass=${this.hass}
                            .value=${E}
                            .audioAssets=${this._audioAssets}
                            .schemeLabel=${"Use scheme default"}
                            ?disabled=${!s}
                            @value-changed=${gt=>this._setScopedOverride(x.key,gt.detail.value,a)}
                          ></lcards-sound-source-selector>
                        </td>
                        <td>
                          ${E!=="__mute__"?o`
                            <ha-icon-button
                              .label=${"Preview"}
                              @click=${()=>E==="__scheme__"?this._previewEvent(x.key):this._previewAsset(E)}
                              ?disabled=${!s}
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
          `}

        `}
      </lcards-form-section>
    `}};b(de,"LCARdSSoundConfigTab"),A(de,"properties",{hass:{type:Object},_helpers:{type:Array,state:true},_audioAssets:{type:Array,state:true},_overrides:{type:Object,state:true},_schemeNames:{type:Array,state:true},_eventTypes:{type:Array,state:true},_creatingHelpers:{type:Boolean,state:true},_scopeTab:{type:String,state:true},_scopedValues:{type:Object,state:true},_scopedLoading:{type:Boolean,state:true},_scopedOverrides:{type:Object,state:true},_scopedOverridesLoading:{type:Boolean,state:true},_adminScopeUserId:{type:String,state:true},_adminScopeDeviceId:{type:String,state:true},_adminTargetBasic:{type:Object,state:true},_savingScheme:{type:Boolean,state:true},_newSchemeName:{type:String,state:true},_saveSchemeError:{type:String,state:true},_overridesError:{type:String,state:true},_overridesDirty:{type:Boolean,state:true}}),A(de,"styles",[R,H`
    :host {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }



    .banner ha-button {
      margin-left: auto;
    }
    .save-scheme-banner {
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
    }
    .save-scheme-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .save-scheme-header ha-icon {
      flex-shrink: 0;
    }
    .error-text {
      color: var(--error-color, #db4437);
      font-size: 0.85em;
    }
    .confirm-actions {
      display: flex;
      gap: 8px;
      margin-left: auto;
    }

    /* Dim sections or individual rows when sound is globally disabled */
    .dimmed {
      opacity: 0.5;
      pointer-events: none;
    }

    .control-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 0;
      border-bottom: var(--ha-border-width-sm) solid color-mix(in srgb, var(--divider-color) 50%, transparent);
    }
    .control-row:last-child { border-bottom: none; }
    .control-row > ha-selector { flex: 1; min-width: 0; }

    .scheme-row {
      flex: 1;
      display: flex;
      align-items: center;
      gap: var(--ha-space-2);
      min-width: 280px;
    }
    .scheme-row ha-selector {
      flex: 1;
    }

    .empty-hint {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--secondary-text-color);
      font-size: 0.85em;
      padding: 8px 0;
    }

    /* Overrides table */
    .overrides-table-wrapper {
      overflow-x: auto;
      max-height: 400px;
      overflow-y: auto;
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
      z-index: 1;
      /* Use a fully-opaque surface colour so content doesn't bleed through when scrolling.
         Cascade through the most-specific HA surface tokens to the primary BG fallback. */
      background: var(--ha-card-background, var(--card-background-color, var(--primary-background-color, #1c1c1c)));
    }
    .overrides-table td {
      padding: 4px 8px;
      vertical-align: middle;
      border-bottom: var(--ha-border-width-sm) solid color-mix(in srgb, var(--divider-color) 40%, transparent);
    }
    .overrides-table tr.has-override td {
      background: color-mix(in srgb, var(--primary-color) 8%, transparent);
    }
    .event-label {
      white-space: nowrap;
    }
    .overrides-action-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      padding: 8px 4px;
      margin-top: 4px;
    }
    .overrides-action-row.dirty {
      background: color-mix(in srgb, var(--warning-color, #ff9800) 10%, transparent);
      border-radius: var(--ha-border-radius-md);
      padding: 8px 12px;
    }
    .dirty-indicator {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.9em;
      font-weight: 500;
      color: var(--warning-color, #ff9800);
    }
    .reset-overrides-btn,
    .save-scheme-btn {
      flex-shrink: 0;
    }

    /* Helper status table */
    .helper-status-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85em;
    }
    .helper-status-table th {
      text-align: left;
      padding: 6px 8px;
      color: var(--secondary-text-color);
      border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
    }
    .helper-status-table td {
      padding: 6px 8px;
      vertical-align: middle;
      border-bottom: var(--ha-border-width-sm) solid color-mix(in srgb, var(--divider-color) 40%, transparent);
    }
    .helper-status-table tr:last-child td { border-bottom: none; }
    .helper-name {
      margin-left: 6px;
      vertical-align: middle;
    }
    .entity-id {
      font-family: monospace;
      font-size: 0.85em;
      color: var(--secondary-text-color);
    }

    /* ── Scoped Overrides section ─────────────────────────────────────── */

    .scope-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }

    .scoped-loading {
      padding: 8px;
      color: var(--secondary-text-color);
      font-size: 0.85rem;
    }

    .scoped-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 6px 0;
      border-bottom: var(--ha-border-width-sm) solid var(--divider-color, rgba(255,255,255,0.06));
    }
    .scoped-row:last-child { border-bottom: none; }

    .scoped-label {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 180px;
      font-size: 0.9rem;
      color: var(--primary-text-color);
    }

    .scoped-control {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .scoped-control ha-selector { flex: 1; }

    /* ── Admin Selector ── */
    .nested-sections {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .admin-selector-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      margin: 4px 0;
      background: color-mix(in srgb, var(--warning-color, #ff9800) 10%, transparent);
      border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--warning-color, #ff9800) 30%, transparent);
      border-radius: var(--ha-border-radius-md);
    }
    .admin-selector-label {
      font-size: 0.85rem;
      color: var(--secondary-text-color);
      white-space: nowrap;
      flex-shrink: 0;
    }
    .admin-selector-input {
      flex: 1;
      min-width: 0;
    }

    /* ── Scope Context Banner ── */
    .scope-context-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 12px;
      border-radius: 6px;
      font-size: 0.85rem;
      margin: 4px 0 8px;
    }
    .scope-context-banner.own {
      background: color-mix(in srgb, var(--info-color, #03a9f4) 10%, transparent);
      border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--info-color, #03a9f4) 25%, transparent);
      color: var(--primary-text-color);
    }
    .scope-context-banner.own ha-icon {
      color: var(--info-color, #03a9f4);
      --mdc-icon-size: 18px;
    }
    .scope-context-banner.admin {
      background: color-mix(in srgb, var(--warning-color, #ff9800) 12%, transparent);
      border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--warning-color, #ff9800) 35%, transparent);
      color: var(--primary-text-color);
    }
    .scope-context-banner.admin ha-icon {
      color: var(--warning-color, #ff9800);
      --mdc-icon-size: 18px;
    }

    /* ── Per-Event Overrides Sub-header ── */
    .scoped-overrides-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 0 6px;
      margin-top: 8px;
      border-top: var(--ha-border-width-sm) solid var(--divider-color, rgba(255,255,255,0.08));
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .scoped-overrides-header ha-icon {
      color: var(--primary-color);
      --mdc-icon-size: 18px;
    }
    .scoped-overrides-header .hint {
      font-weight: 400;
      font-size: 0.82rem;
      color: var(--secondary-text-color);
    }
    .scoped-overrides-header .clear-all-btn {
      margin-left: auto;
    }

    /* Scoped overrides table inherits .overrides-table but can add specifics */
    .scoped-overrides-table {
      font-size: 0.88rem;
    }
  `]);let Ge=de;customElements.get("lcards-sound-config-tab")||customElements.define("lcards-sound-config-tab",Ge);const jt=100,qt=[{id:"devices",prefix:"_device_",label:"Devices",icon:"mdi:devices",description:"Per-device identity and overrides, one key per browser."},{id:"users",prefix:"_user_",label:"Users",icon:"mdi:account-multiple",description:"Per-user overrides."}];function Kt(u){const e={id:"settings",label:"Settings",icon:"mdi:database-cog",description:"LCARdS-wide data. Use with care: deleting keys may reset service configuration.",keys:[]},t=qt.map(a=>({...a,keys:[]}));for(const a of u)(t.find(s=>a.startsWith(s.prefix))??e).keys.push(a);return[e,...t].filter(a=>a.keys.length>0)}b(Kt,"groupStorageKeys");const he=class he2 extends M{constructor(){super(),this.hass=void 0,this._data={},this._loading=false,this._error=null,this._expandedKeys=new Set,this._editingKey=null,this._editDraft="",this._editError=null,this._savingKey=null,this._deletingKey=null,this._resetting=false,this._available=false,this._loaded=false,this._filter="",this._openGroups=new Set(["settings"])}connectedCallback(){super.connectedCallback(),this._load()}willUpdate(e){var t;super.willUpdate(e),e.has("hass")&&((t=this.hass)!=null&&t.connection)&&!this._loaded&&!this._loading&&this._load()}async _load(){var t,a,r;const e=(a=(t=window.lcards)==null?void 0:t.core)==null?void 0:a.integrationService;this._loading=true,this._error=null;try{e&&!e.isReady&&await e.onReady(),this._available=!!(e!=null&&e.available);const s=(r=this.hass)==null?void 0:r.connection;if(!this._available||!s)return;const i=await s.sendMessagePromise({type:"lcards/storage/get"}),n=i==null?void 0:i.value;this._data=n&&typeof n=="object"&&!Array.isArray(n)?n:{},this._loaded=true,d.debug("[StorageExplorer] Loaded",Object.keys(this._data).length,"keys")}catch(s){this._error=`Failed to load storage: ${(s==null?void 0:s.message)??s}`,d.error("[StorageExplorer] Load failed:",s)}finally{this._loading=false}}_beginEdit(e){this._editingKey=e,this._editDraft=JSON.stringify(this._data[e],null,2),this._editError=null,this.requestUpdate(),this.updateComplete.then(()=>{var t,a;(a=(t=this.shadowRoot)==null?void 0:t.querySelector(".edit-area"))==null||a.focus()})}_cancelEdit(){this._editingKey=null,this._editDraft="",this._editError=null,this.requestUpdate()}async _saveEdit(e){var r,s;let t;try{t=JSON.parse(this._editDraft)}catch(i){this._editError=`Invalid JSON: ${i.message}`,this.requestUpdate();return}const a=(s=(r=window.lcards)==null?void 0:r.core)==null?void 0:s.integrationService;if(a!=null&&a.available){this._savingKey=e,this._editError=null,this.requestUpdate();try{await a.writeStorage({[e]:t}),this._data={...this._data,[e]:t},this._editingKey=null,this._editDraft="",d.info(`[StorageExplorer] Saved key "${e}"`)}catch(i){this._editError=`Save failed: ${i.message??i}`,d.error("[StorageExplorer] Save failed:",i)}finally{this._savingKey=null,this.requestUpdate()}}}async _askDelete(e){await ie({title:"Delete storage key?",message:`Delete "${e}" from LCARdS storage? Services that use it go back to their defaults.`})&&await this._deleteKey(e)}async _deleteKey(e){var a,r;const t=(r=(a=window.lcards)==null?void 0:a.core)==null?void 0:r.integrationService;if(t!=null&&t.available){this._deletingKey=e;try{await t.deleteStorage(e);const s={...this._data};delete s[e],this._data=s,this._expandedKeys.delete(e),this._editingKey===e&&this._cancelEdit(),d.info(`[StorageExplorer] Deleted key "${e}"`)}catch(s){this._error=`Delete failed: ${s.message??s}`,d.error("[StorageExplorer] Delete failed:",s)}finally{this._deletingKey=null,this.requestUpdate()}}}async _askReset(){const e=Object.keys(this._data).length;await ie({title:"Reset all storage?",message:`This permanently wipes all ${e} stored key${e!==1?"s":""}.`,confirmText:"Reset all"})&&await this._resetAll()}async _askResetGroup(e,t){const a=e.keys.length,r=t?`the ${a} ${e.label} key${a!==1?"s":""} matching "${this._filter}"`:`all ${a} ${e.label} key${a!==1?"s":""}`;if(await ie({title:`Reset ${e.label}?`,message:`This permanently deletes ${r}. Other sections are kept.`+(e.id==="devices"?" Browsers register again on their next load, without their device overrides.":""),confirmText:"Delete"})){this._resetting=true;try{const i=await this.hass.connection.sendMessagePromise({type:"lcards/storage/delete_many",keys:e.keys}),n={...this._data};for(const l of e.keys)delete n[l],this._expandedKeys.delete(l);this._data=n,e.keys.includes(this._editingKey)&&this._cancelEdit(),d.info(`[StorageExplorer] Deleted ${(i==null?void 0:i.removed)??a} key(s) from ${e.label}`)}catch(i){this._error=`Reset failed: ${(i==null?void 0:i.message)??i}`,d.error("[StorageExplorer] Group reset failed:",i)}finally{this._resetting=false}}}async _resetAll(){var t,a,r,s;const e=(a=(t=window.lcards)==null?void 0:t.core)==null?void 0:a.integrationService;if(e!=null&&e.available){this._resetting=true;try{await e.resetStorage(),this._data={},this._expandedKeys=new Set,this._cancelEdit();const i=(s=(r=window.lcards)==null?void 0:r.core)==null?void 0:s.soundManager;i&&(i._overridesCache={},i._overridesLoaded=true,d.debug("[StorageExplorer] SoundManager cache cleared after reset")),d.info("[StorageExplorer] Reset all storage")}catch(i){this._error=`Reset failed: ${i.message??i}`,d.error("[StorageExplorer] Reset failed:",i)}finally{this._resetting=false,this.requestUpdate()}}}_formatPreview(e){const t=JSON.stringify(e);return t.length>80?t.slice(0,80)+"…":t}_typeLabel(e){return e===null?"null":Array.isArray(e)?`array[${e.length}]`:typeof e=="object"?`object{${Object.keys(e).length}}`:typeof e}render(){if(!this._available)return o`
        <div class="studio-layout">
          ${this._loading?o`
            <div class="empty-state">
              <ha-spinner size="small"></ha-spinner>
              <p>Loading storage</p>
            </div>
          `:o`
            <div class="empty-state">
              <ha-icon icon="mdi:connection"></ha-icon>
              <p class="empty-title">Integration not available</p>
              <p class="hint">The LCARdS integration isn't installed or set up yet. Backend storage needs it.</p>
            </div>
          `}
        </div>
      `;const e=Object.keys(this._data).sort(),t=this._filter.trim().toLowerCase(),a=t?e.filter(s=>s.toLowerCase().includes(t)):e,r=Kt(a);return o`
      <div class="studio-layout">
        <div class="toolbar">
          <ha-input-search
            appearance="outlined"
            placeholder="Search keys"
            .value=${this._filter}
            @input=${s=>{this._filter=s.target.value??""}}
            @wa-clear=${()=>{this._filter=""}}>
          </ha-input-search>
          <ha-button appearance="plain" @click=${()=>{this._loaded=false,this._load()}} ?disabled=${this._loading}>
            <ha-icon slot="start" icon="mdi:refresh"></ha-icon>
            Refresh
          </ha-button>
          <ha-button
            variant="danger"
            @click=${this._askReset}
            ?disabled=${this._resetting||e.length===0}
          >
            <ha-icon slot="start" icon="mdi:delete-sweep"></ha-icon>
            Reset All
          </ha-button>
        </div>

        <div class="scrollable-body">
          ${this._error?o`
            <div class="banner error">
              <ha-icon icon="mdi:alert-circle"></ha-icon>
              <span class="banner-text">${this._error}</span>
              <ha-button appearance="plain" @click=${()=>{this._loaded=false,this._load()}}>Retry</ha-button>
            </div>
          `:""}

          ${this._loading&&!this._loaded?o`
            <div class="empty-state">
              <ha-spinner size="small"></ha-spinner>
              <p>Loading storage</p>
            </div>
          `:e.length===0&&this._loaded?o`
            <div class="empty-state">
              <ha-icon icon="mdi:database-off-outline"></ha-icon>
              <p>No keys stored yet.</p>
              <p class="hint">Values written by LCARdS services (sound overrides, for example) appear here.</p>
            </div>
          `:t&&a.length===0?o`
            <div class="empty-state">
              <ha-icon icon="mdi:filter-off"></ha-icon>
              <p>No keys match "${this._filter}"</p>
            </div>
          `:r.map(s=>this._renderGroup(s,!!t))}
        </div>
      </div>
    `}_renderGroup(e,t){var s;const a=t||this._openGroups.has(e.id),r=(s=this._showAll)!=null&&s.has(e.id)?1/0:jt;return o`
      <lcards-form-section
        header=${e.label}
        icon=${e.icon}
        secondary=${`${e.keys.length} key${e.keys.length!==1?"s":""}`}
        description=${e.description}
        ?expanded=${a}
        ?outlined=${true}
        @expanded-changed=${i=>{const n=new Set(this._openGroups);i.detail.expanded?n.add(e.id):n.delete(e.id),this._openGroups=n}}>
        <ha-button
          slot="header-icons"
          variant="danger"
          appearance="plain"
          size="s"
          ?disabled=${this._resetting}
          @click=${i=>{i.stopPropagation(),this._askResetGroup(e,t)}}>
          <ha-icon slot="start" icon="mdi:delete-sweep"></ha-icon>
          ${t?"Delete matches":"Reset section"}
        </ha-button>
        ${a?o`
          ${e.keys.slice(0,r).map(i=>this._renderKeyRow(i))}
          ${e.keys.length>r?o`
            <div class="more-row">
              <span class="hint">Showing ${r} of ${e.keys.length}. Search to narrow the list.</span>
              <ha-button appearance="plain" @click=${()=>{this._showAll=new Set([...this._showAll??[],e.id]),this.requestUpdate()}}>
                Show all
              </ha-button>
            </div>
          `:""}
        `:""}
      </lcards-form-section>
    `}_renderKeyRow(e){const t=this._data[e],a=this._expandedKeys.has(e),r=this._editingKey===e,s=this._deletingKey===e,i=this._savingKey===e;return o`
      <ha-expansion-panel
        class="key-panel ${s?"busy":""}"
        .header=${e}
        outlined
        ?expanded=${a||r}
        @expanded-changed=${n=>{n.stopPropagation();const l=new Set(this._expandedKeys);n.detail.expanded?l.add(e):l.delete(e),this._expandedKeys=l}}
      >
        <!-- ── TYPE CHIP + PREVIEW in header ── -->
        <div slot="description" class="panel-description">
          <ha-assist-chip
            .filled=${true}
            .label=${this._typeLabel(t)}
            class="type-chip"
          ></ha-assist-chip>
          ${!r&&!a?o`
            <span class="preview">${this._formatPreview(t)}</span>
          `:""}
        </div>

        <!-- ── ACTION BUTTONS in icons slot ── -->
        <div slot="icons" class="panel-icons" @click=${n=>n.stopPropagation()}>
          ${r?o`
            <ha-button
              @click=${n=>{n.stopPropagation(),this._saveEdit(e)}}
              ?disabled=${i}
            >
              ${i?o`<ha-spinner size="small"></ha-spinner>`:"Save"}
            </ha-button>
            <ha-button appearance="plain" @click=${n=>{n.stopPropagation(),this._cancelEdit()}}>Cancel</ha-button>
          `:o`
            <ha-icon-button
              .label=${"Edit"}
              @click=${n=>{n.stopPropagation(),this._beginEdit(e)}}
              ?disabled=${s||i}
            >
              <ha-icon icon="mdi:pencil"></ha-icon>
            </ha-icon-button>
            <ha-icon-button
              .label=${"Delete"}
              class="danger-icon"
              @click=${n=>{n.stopPropagation(),this._askDelete(e)}}
              ?disabled=${s}
            >
              <ha-icon icon="mdi:delete"></ha-icon>
            </ha-icon-button>
          `}
        </div>

        <!-- ── PANEL CONTENT ── -->
        <div class="panel-content">

          <!-- EDIT AREA -->
          ${r?o`
            <!-- JSON is valid YAML: the YAML mode highlights it; the value is parsed as JSON. -->
            <ha-code-editor
              class="edit-area"
              mode="yaml"
              linewrap
              .value=${this._editDraft}
              @value-changed=${n=>{n.stopPropagation(),this._editDraft=n.detail.value,this._editError=null}}
            ></ha-code-editor>
            ${this._editError?o`
              <div class="edit-error">
                <ha-icon icon="mdi:alert-circle"></ha-icon>
                ${this._editError}
              </div>
            `:""}
          `:""}

          <!-- JSON VIEW (only while open: each one is a code editor) -->
          ${!r&&a?o`
            <ha-code-editor
              mode="yaml"
              read-only
              linewrap
              .value=${JSON.stringify(t,null,2)}
            ></ha-code-editor>
          `:""}

        </div>
      </ha-expansion-panel>
    `}};b(he,"LCARdSStorageExplorerTab"),A(he,"properties",{hass:{type:Object},_data:{state:true},_loading:{state:true},_error:{state:true},_expandedKeys:{state:true},_editingKey:{state:true},_editDraft:{state:true},_editError:{state:true},_savingKey:{state:true},_deletingKey:{state:true},_resetting:{state:true},_available:{state:true},_loaded:{state:true},_filter:{state:true},_openGroups:{state:true}}),A(he,"styles",[R,H`
    :host {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }

    .banner-text {
      flex: 1;
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: var(--ha-space-2);
      margin-bottom: var(--ha-space-3);
    }

    .toolbar ha-input-search {
      flex: 1;
    }

    .more-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--ha-space-2);
      padding-top: var(--ha-space-2);
    }

    /* ── Loading / empty / unavailable ── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--ha-space-2);
      padding: var(--ha-space-12) var(--ha-space-6);
      text-align: center;
      color: var(--secondary-text-color);
    }

    .empty-state ha-icon {
      --mdc-icon-size: 48px;
      opacity: 0.5;
    }

    .empty-state p {
      margin: 0;
      max-width: 480px;
    }

    .empty-title {
      color: var(--primary-text-color);
      font-weight: var(--ha-font-weight-medium, 500);
    }

    /* ── Key panels (ha-expansion-panel per key) ── */
    .key-panel {
      display: block;
      margin-bottom: 6px;
    }

    .key-panel.busy {
      opacity: 0.6;
      pointer-events: none;
    }

    /* Description row below the panel header (type chip + preview) */
    .panel-description {
      display: flex;
      align-items: center;
      gap: var(--ha-space-2);
      padding-top: 2px;
    }

    .type-chip {
      --ha-assist-chip-filled-container-color:
        color-mix(in srgb, var(--primary-color) 18%, transparent);
      --ha-assist-chip-label-text-color: var(--primary-color);
      flex-shrink: 0;
    }

    .preview {
      font-family: var(--ha-font-family-code);
      font-size: 0.8em;
      color: var(--secondary-text-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
      min-width: 0;
    }

    .panel-icons {
      display: flex;
      align-items: center;
      gap: 2px;
    }

    .danger-icon {
      color: var(--error-color);
    }

    .panel-content {
      display: flex;
      flex-direction: column;
      gap: var(--ha-space-2);
      padding: var(--ha-space-2) 0 var(--ha-space-1);
    }

    ha-code-editor {
      display: block;
      border: var(--ha-border-width-sm) solid var(--divider-color);
      border-radius: var(--ha-border-radius-md);
      overflow: hidden;
    }

    .edit-error {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--error-color);
      font-size: 0.85em;
    }
  `]);let je=he;customElements.get("lcards-storage-explorer-tab")||customElements.define("lcards-storage-explorer-tab",je);const B=class B2 extends M{constructor(){super(),this.hass=void 0,this._report=null,this._reportLoading=false,this._includeConfig=false,this._supportNotice="",this._noticeTimer=null}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this._noticeTimer??void 0)}updated(e){e.has("hass")&&this.hass&&!this._report&&!this._reportLoading&&this._refreshSupport()}async _refreshSupport(){this._reportLoading=true;try{this._report=await At({hass:this.hass,includeConfig:this._includeConfig})}catch(e){d.error("[AboutTab] Failed to collect support info",e)}finally{this._reportLoading=false}}_flashNotice(e){this._supportNotice=e,clearTimeout(this._noticeTimer??void 0),this._noticeTimer=setTimeout(()=>{this._supportNotice=""},6e3)}async _copySupport(){if(!this._report)return;const e=await W(this._report.markdown);this._flashNotice(e?"Support info copied to the clipboard.":"Copy failed: select the text in the preview below and copy it manually.")}_openIssue(){if(!this._report)return;const{truncated:e,copied:t}=Tt(this._report);t.then(a=>this._flashNotice(a?e?'GitHub opened with a summary: full support info is on your clipboard; paste it into "LCARdS support info".':"GitHub opened with your support info prefilled (also copied to the clipboard). Review it and describe the problem.":'GitHub opened: copy failed, so paste the preview text below into "LCARdS support info".'))}_toggleIncludeConfig(e){this._includeConfig=e.target.checked,this._refreshSupport()}_renderSupportSection(){var i,n,l,c;const e={ok:"mdi:check-circle",warn:"mdi:alert",error:"mdi:close-circle",info:"mdi:information-outline"},t=this._report,a=(t==null?void 0:t.checks)??[],r=a.filter(h=>h.status==="warn"||h.status==="error"),s=t==null?void 0:t.info;return o`
      <div class="section">
        <div class="section-header">
          <ha-icon icon="mdi:lifebuoy"></ha-icon>
          Support &amp; system info
        </div>
        <p class="section-intro">
          A health check of your setup. If something isn't working, copy this info or open a pre-filled
          GitHub bug report: it's opened for you to review; nothing is sent automatically.
        </p>

        ${t?o`
          ${r.length?o`
            <lcards-message type="${r.some(h=>h.status==="error")?"error":"warning"}">
              <strong>${r.length} issue${r.length===1?"":"s"} found</strong>. See the checks below for fixes.
            </lcards-message>
          `:""}

          <div class="support-versions">
            <span><b>LCARdS</b> ${((i=s==null?void 0:s.lcards)==null?void 0:i.version)??"-"}</span>
            <span><b>Integration</b> ${((n=s==null?void 0:s.lcards)==null?void 0:n.backendVersion)??"-"}</span>
            <span><b>Home Assistant</b> ${((l=s==null?void 0:s.ha)==null?void 0:l.version)??"-"}</span>
            <span><b>Frontend</b> ${((c=s==null?void 0:s.ha)==null?void 0:c.frontendVersion)??"-"}</span>
          </div>

          <ul class="support-checks">
            ${a.map(h=>o`
              <li class="check ${h.status}">
                <ha-icon icon="${e[h.status]??"mdi:circle-small"}"></ha-icon>
                <div class="check-body">
                  <span class="check-title">${h.title}</span>
                  ${h.detail?o`<span class="check-detail">${h.detail}</span>`:""}
                  ${h.fix?o`<span class="check-fix">Fix: ${h.fix}</span>`:""}
                </div>
              </li>
            `)}
          </ul>

          <div class="support-actions">
            <ha-button appearance="filled" @click=${this._openIssue} ?disabled=${this._reportLoading}>
              <ha-icon icon="mdi:bug-outline" slot="start"></ha-icon>Report an issue
            </ha-button>
            <ha-button appearance="outlined" @click=${this._copySupport} ?disabled=${this._reportLoading}>
              <ha-icon icon="mdi:content-copy" slot="start"></ha-icon>Copy support info
            </ha-button>
            <ha-button appearance="plain" @click=${this._refreshSupport} ?disabled=${this._reportLoading}>
              <ha-icon icon="mdi:refresh" slot="start"></ha-icon>Refresh
            </ha-button>
            <ha-checkbox .checked=${this._includeConfig} @change=${this._toggleIncludeConfig}>
              Include data-source names &amp; entity IDs
            </ha-checkbox>
          </div>

          ${this._supportNotice?o`<div class="support-notice">${this._supportNotice}</div>`:""}

          <details class="support-preview">
            <summary>Preview what will be shared</summary>
            <pre>${t.markdown}</pre>
          </details>
        `:o`
          <div class="support-loading">${this._reportLoading?"Collecting system info…":"System info unavailable."}</div>
        `}
      </div>
    `}static get _TAB_GUIDE(){return[{index:1,icon:"mdi:cog",label:"Helpers",desc:"Create and manage the Home Assistant input helpers LCARdS and HA-LCARS use to store dynamic configuration values"},{index:2,icon:"mdi:palette-swatch",label:"Theme Studio",desc:"LCARdS Alert Mode Lab (fully customize alert colour transforms), HA-LCARS Theme Lab, browsable LCARdS/Home Assistant CSS variable references"},{index:3,icon:"mdi:wifi-off",label:"Connectivity",desc:'Configure the connection-lost overlay: what is shown when Home Assistant loses its WebSocket connection, and the "connection restored" confirmation banner'},{index:4,icon:"mdi:volume-high",label:"Sounds",desc:"Select sound schemes and customize/preview sounds for alert modes and interactions types"},{index:6,icon:"mdi:package-variant",label:"Pack Explorer",desc:"Browse the pre-built content packs that add cards styles, fonts, sounds, images and more"},{index:7,icon:"mdi:database-cog",label:"Storage",desc:"Advanced: Inspect and manage the raw key/value data LCARdS stores for persistent configuration (data that is not stored in Home Assistant helpers - use with caution)"}]}static get _RESOURCE_LINKS(){return[{icon:"mdi:book-open-variant",title:"Documentation",caption:"lcards.unimatrix01.ca",href:oe(ve.home)},{icon:"mdi:lifebuoy",title:"Getting Help",caption:"Troubleshooting & reporting problems",href:oe(ve.gettingHelp)},{icon:"mdi:forum-outline",title:"Discussions",caption:"Questions, config help & showcase",href:"https://github.com/snootched/LCARdS/discussions"},{icon:"mdi:github",title:"GitHub Repository",caption:"github.com/snootched/LCARdS",href:"https://github.com/snootched/LCARdS"},{icon:"mdi:tag-multiple-outline",title:"Releases",caption:"What's new in each version",href:"https://github.com/snootched/LCARdS/releases"},{icon:"mdi:source-branch",title:"HA-LCARS Theme",caption:"github.com/th3jesta/ha-lcars",href:"https://github.com/th3jesta/ha-lcars"},{icon:"mdi:puzzle-outline",title:"UI eXtension (UIX)",caption:"Required by HA-LCARS (replaces card-mod)",href:"https://github.com/Lint-Free-Technology/uix"}]}_isDevFeaturesEnabled(){return new URLSearchParams(window.location.search).get("lcards_dev_features")==="true"}_navigateToTab(e){this.dispatchEvent(new CustomEvent("lcards-navigate-tab",{detail:{tab:e},bubbles:true,composed:true})),d.debug(`[AboutTab] Navigating to tab ${e}`)}render(){return o`
      <div class="scrollable-body">

      <!-- ── Getting Started ───────────────────────────────────────── -->
      <div class="section">
        <div class="section-header">
          <ha-icon icon="mdi:rocket-launch-outline"></ha-icon>
          Getting Started
        </div>
        <p class="section-intro">Welcome to LCARdS for Home Assistant!   Follow these steps to get started:</p>
        <ol class="steps-list">
          <li class="step">
            <div class="step-number">1</div>
            <div class="step-body">
              <span class="step-title">Create Helpers</span>
              <span class="step-desc">Setup LCARdS and HA-LCARS input helper entities - used to dynamically configure certain settings</span>
            </div>
          </li>
          <li class="step">
            <div class="step-number">2</div>
            <div class="step-body">
              <span class="step-title">Customize ALERT Modes</span>
              <span class="step-desc">Customize your LCARS alert mode visuals from the Alert Lab</span>
            </div>
          </li>
          <li class="step">
            <div class="step-number">3</div>
            <div class="step-body">
              <span class="step-title">Customize Sounds</span>
              <span class="step-desc">Configure audio feedback for alert modes and card interactions: assign sounds and adjust volume levels</span>
            </div>
          </li>
        </ol>
      </div>

      <!-- ── Panel Guide ───────────────────────────────────────── -->
      <div class="section">
        <div class="section-header">
          <ha-icon icon="mdi:view-dashboard-outline"></ha-icon>
          Panel Guide
        </div>
        <div class="tab-guide-grid">
          ${B2._TAB_GUIDE.map(e=>o`
            <div
              class="tab-guide-card"
              role="button"
              tabindex="0"
              @click=${()=>this._navigateToTab(e.index)}
              @keydown=${t=>t.key==="Enter"&&this._navigateToTab(e.index)}
            >
              <div class="tab-guide-icon">
                <ha-icon icon="${e.icon}"></ha-icon>
              </div>
              <div class="tab-guide-body">
                <span class="tab-guide-title">${e.label}</span>
                <span class="tab-guide-desc">${e.desc}</span>
              </div>
              <ha-icon icon="mdi:arrow-right" class="tab-guide-arrow"></ha-icon>
            </div>
          `)}
          <div
              class="tab-guide-card"
              role="button"
              tabindex="0"
              @click=${()=>this._navigateToTab(5)}
              @keydown=${e=>e.key==="Enter"&&this._navigateToTab(5)}
            >
              <div class="tab-guide-icon">
                <ha-icon icon="mdi:account-multiple-outline"></ha-icon>
              </div>
              <div class="tab-guide-body">
                <span class="tab-guide-title">Users &amp; Devices</span>
                <span class="tab-guide-desc">Manage registered devices and users with stored per-user / per-device overrides. Edit or clear scoped settings centrally (admin only).</span>
              </div>
              <ha-icon icon="mdi:arrow-right" class="tab-guide-arrow"></ha-icon>
            </div>
          ${this._isDevFeaturesEnabled()?o`
            <div
                class="tab-guide-card"
                role="button"
                tabindex="0"
                @click=${()=>this._navigateToTab(8)}
                @keydown=${e=>e.key==="Enter"&&this._navigateToTab(8)}
              >
              <div class="tab-guide-icon">
                <ha-icon icon="mdi:view-grid-plus-outline"></ha-icon>
              </div>
              <div class="tab-guide-body">
                <span class="tab-guide-title">Layouts</span>
                <span class="tab-guide-desc">Dev preview: compose reusable card layouts with a WYSIWYG grid editor (enabled via the ?lcards_dev_features=true URL parameter).</span>
              </div>
              <ha-icon icon="mdi:arrow-right" class="tab-guide-arrow"></ha-icon>
            </div>
          `:""}
        </div>
      </div>

      <!-- ── Support & system info ───────────────────────────────── -->
      ${this._renderSupportSection()}

      <!-- ── Resources ─────────────────────────────────────────── -->
      <div class="section">
        <div class="section-header">
          <ha-icon icon="mdi:link-variant"></ha-icon>
          Resources
        </div>
        <div class="links-grid">
          ${B2._RESOURCE_LINKS.map(e=>o`
            <a class="link-card" href="${e.href}" target="_blank" rel="noopener">
              <ha-icon icon="${e.icon}"></ha-icon>
              <div class="link-body">
                <span class="link-title">${e.title}</span>
                <span class="link-url">${e.caption}</span>
              </div>
              <ha-icon icon="mdi:open-in-new" class="link-external"></ha-icon>
            </a>
          `)}
        </div>
      </div>

      <!-- ── Legal / attribution ───────────────────────────────── -->
      <div class="footer">
        LCARdS is licensed <a href="https://github.com/snootched/lcards/blob/main/LICENSE" target="_blank" rel="noopener">MIT</a>
        · LCARS aesthetics inspired by Star Trek <a href=${oe(ve.credits)} target="_blank" rel="noopener">[disclaimer]</a>
      </div>

      </div>
    `}};b(B,"LCARdSAboutTab"),A(B,"properties",{hass:{type:Object},_report:{type:Object,state:true},_reportLoading:{type:Boolean,state:true},_includeConfig:{type:Boolean,state:true},_supportNotice:{type:String,state:true}}),A(B,"styles",[R,H`
    :host {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }

    /* Scrollable content area — same pattern as sound/storage tabs */
    .scrollable-body {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding-bottom: 8px;
    }

    /* ── Sections — matches lcards-form-section background ─────── */
    .section {
      background: color-mix(
          in srgb,
          var(--secondary-background-color) 50%,
          color-mix(in srgb, var(--primary-background-color) 25%, transparent)
      );
      border-radius: var(--ha-card-border-radius, 12px);
      padding: 12px 16px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1em;
      font-weight: 600;
      color: var(--primary-text-color);
      padding-bottom: 12px;
      border-bottom: var(--ha-border-width-sm) solid color-mix(in srgb, var(--divider-color) 60%, transparent);
      margin-bottom: 12px;
    }

    .section-header ha-icon {
      --mdc-icon-size: 20px;
      color: var(--primary-color);
    }

    /* ── Get Started steps ───────────────────────────── */
    .section-intro {
      margin: 0 0 12px 0;
      color: var(--secondary-text-color);
      line-height: 1.5;
    }

    .steps-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .step {
      display: flex;
      align-items: flex-start;
      gap: 14px;
    }

    .step-number {
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--primary-color, #1b4f8a);
      color: white;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--lcars-font), var(--lcars-fallback-font), 'Antonio', sans-serif;
      letter-spacing: 0.05em;
      margin-top: 1px;
    }

    .step-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .step-title {
      font-weight: 600;
      color: var(--primary-text-color);
    }

    .step-desc {
      color: var(--secondary-text-color);
      line-height: 1.5;
      font-size: 0.9em;
    }

    /* ── Panel Guide grid ────────────────────────────── */
    .tab-guide-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 6px;
    }

    .tab-guide-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: var(--ha-card-border-radius, 12px);
      border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--divider-color) 60%, transparent);
      background: var(--secondary-background-color);
      cursor: pointer;
      color: var(--primary-text-color);
      transition: background var(--ha-animation-duration-fast), border-color var(--ha-animation-duration-fast);
    }

    .tab-guide-card:hover {
      background: color-mix(in srgb, var(--primary-color) 15%, var(--secondary-background-color));
      border-color: var(--primary-color);
    }

    .tab-guide-card:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    .tab-guide-icon {
      flex-shrink: 0;
      --mdc-icon-size: 22px;
      color: var(--primary-color);
    }

    .tab-guide-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      min-width: 0;
    }

    .tab-guide-title {
      font-weight: 600;
    }

    .tab-guide-desc {
      color: var(--secondary-text-color);
      line-height: 1.4;
      font-size: 0.9em;
    }

    .tab-guide-arrow {
      --mdc-icon-size: 16px;
      color: var(--secondary-text-color);
      flex-shrink: 0;
      transition: color var(--ha-animation-duration-fast);
    }

    .tab-guide-card:hover .tab-guide-arrow {
      color: var(--primary-color);
    }

    /* ── Links grid ──────────────────────────────────── */
    /* ── Support & system info ── */
    .support-loading,
    .support-notice {
      color: var(--secondary-text-color);
      font-size: var(--ha-font-size-s, 0.875rem);
      padding: var(--ha-space-2) 0;
    }

    .support-notice {
      color: var(--primary-text-color);
    }

    .support-versions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--ha-space-2) var(--ha-space-5);
      margin: var(--ha-space-3) 0;
      color: var(--secondary-text-color);
      font-size: var(--ha-font-size-s, 0.875rem);
    }

    .support-versions b {
      color: var(--primary-text-color);
      font-weight: 500;
    }

    .support-checks {
      list-style: none;
      margin: 0 0 var(--ha-space-3);
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: var(--ha-space-2);
    }

    .check {
      display: flex;
      gap: var(--ha-space-2);
      align-items: flex-start;
    }

    .check ha-icon {
      --mdc-icon-size: 20px;
      flex-shrink: 0;
    }

    .check.ok ha-icon    { color: var(--success-color); }
    .check.warn ha-icon  { color: var(--warning-color); }
    .check.error ha-icon { color: var(--error-color); }
    .check.info ha-icon  { color: var(--secondary-text-color); }

    .check-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .check-title {
      color: var(--primary-text-color);
    }

    .check-detail,
    .check-fix {
      color: var(--secondary-text-color);
      font-size: var(--ha-font-size-s, 0.875rem);
      overflow-wrap: anywhere;
    }

    .check-fix {
      color: var(--primary-text-color);
    }

    .support-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--ha-space-2);
    }

    .support-preview {
      margin-top: var(--ha-space-3);
    }

    .support-preview summary {
      cursor: pointer;
      color: var(--secondary-text-color);
    }

    .support-preview pre {
      max-height: 320px;
      overflow: auto;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      font-family: var(--ha-font-family-code, monospace);
      font-size: var(--ha-font-size-xs, 0.75rem);
      padding: var(--ha-space-3);
      border-radius: var(--ha-border-radius-md);
      background: var(--secondary-background-color);
      border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--divider-color) 60%, transparent);
    }

    .links-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 6px;
    }

    .link-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: var(--ha-card-border-radius, 12px);
      border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--divider-color) 60%, transparent);
      background: var(--secondary-background-color);
      text-decoration: none;
      color: var(--primary-text-color);
      transition: background var(--ha-animation-duration-fast), border-color var(--ha-animation-duration-fast);
    }

    .link-card:hover {
      background: color-mix(in srgb, var(--primary-color) 15%, var(--secondary-background-color));
      border-color: var(--primary-color);
    }

    .link-card > ha-icon:first-child {
      --mdc-icon-size: 20px;
      color: var(--primary-color);
      flex-shrink: 0;
    }

    .link-body {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
    }

    .link-title {
      font-weight: 500;
    }

    .link-url {
      color: var(--secondary-text-color);
      font-size: 0.85em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .link-external {
      --mdc-icon-size: 14px;
      color: var(--secondary-text-color);
      flex-shrink: 0;
    }

    /* ── Footer ──────────────────────────────────────── */
    .footer {
      text-align: center;
      font-size: 0.9em;
      color: var(--secondary-text-color);
      padding: 4px 0 12px;
    }

    .footer a {
      color: var(--primary-color);
      text-decoration: none;
    }

    .footer a:hover {
      text-decoration: underline;
    }
  `]);let qe=B;customElements.get("lcards-about-tab")||customElements.define("lcards-about-tab",qe);const et=class et2 extends M{static get properties(){return{hass:{type:Object},_users:{type:Array,state:true},_devices:{type:Array,state:true},_userNameMap:{type:Object,state:true},_deviceName:{type:String,state:true},_editingName:{type:Boolean,state:true},_confirmDeleteUserId:{type:String,state:true},_confirmDeleteDeviceId:{type:String,state:true},_renamingDeviceId:{type:String,state:true},_renameValue:{type:String,state:true},_loading:{type:Boolean,state:true},_error:{type:String,state:true}}}constructor(){super(),this.hass=void 0,this._users=[],this._devices=[],this._userNameMap={},this._deviceName="",this._editingName=false,this._confirmDeleteUserId=null,this._confirmDeleteDeviceId=null,this._renamingDeviceId=null,this._renameValue="",this._loading=false,this._error=null}connectedCallback(){super.connectedCallback(),this._refresh()}updated(e){var t,a;if(super.updated(e),e.has("hass")&&this.hass&&!this._loading){const r=(a=(t=window.lcards)==null?void 0:t.core)==null?void 0:a.deviceIdentityManager;r&&!this._editingName&&(this._deviceName=r.displayName??"")}}async _refresh(){var t,a;this._loading=true,this._error=null;const e=(a=(t=window.lcards)==null?void 0:t.core)==null?void 0:a.deviceIdentityManager;e&&(this._deviceName=e.displayName??"");try{this._isAdmin()&&await Promise.all([this._loadUsers(),this._loadDevices(),this._loadUserNames()])}catch(r){d.error("[UsersDevicesTab] Failed to load data:",r),this._error=`Failed to load data: ${r.message??r}`}finally{this._loading=false,this.requestUpdate()}}async _loadUsers(){var r;const e=(r=this.hass)==null?void 0:r.connection;if(!e)return;const t=await e.sendMessagePromise({type:"lcards/storage/users/list"}),a=(t==null?void 0:t.users)??{};this._users=Object.entries(a).map(([s,i])=>({id:s,data:i}))}async _loadDevices(){var r;const e=(r=this.hass)==null?void 0:r.connection;if(!e)return;const t=await e.sendMessagePromise({type:"lcards/storage/devices/list"}),a=(t==null?void 0:t.devices)??{};this._devices=Object.entries(a).map(([s,i])=>({id:s,data:i}))}async _loadUserNames(){var t;const e=(t=this.hass)==null?void 0:t.connection;if(!(!e||!this._isAdmin()))try{const a=await e.sendMessagePromise({type:"config/auth/list"}),r={};(Array.isArray(a)?a:[]).forEach(s=>{s!=null&&s.id&&(r[s.id]=s.name??s.username??s.id)}),this._userNameMap=r,d.debug("[UsersDevicesTab] Loaded user name map:",this._userNameMap)}catch(a){d.warn("[UsersDevicesTab] Could not fetch HA user names:",a)}}async _saveDeviceName(){var a,r;const e=(r=(a=window.lcards)==null?void 0:a.core)==null?void 0:r.deviceIdentityManager;if(!e)return;const t=this._deviceName.trim();if(t)try{await e.setDisplayName(t),this._editingName=false,d.info("[UsersDevicesTab] Device name updated:",t),this._isAdmin()&&await this._loadDevices()}catch(s){d.error("[UsersDevicesTab] Failed to save device name:",s),this._error=`Failed to save device name: ${s.message??s}`}}_cancelEditName(){var t,a;const e=(a=(t=window.lcards)==null?void 0:t.core)==null?void 0:a.deviceIdentityManager;this._deviceName=(e==null?void 0:e.displayName)??"",this._editingName=false}_startDeleteUser(e){this._confirmDeleteUserId=e,this._confirmDeleteDeviceId=null,this._renamingDeviceId=null}_cancelDeleteUser(){this._confirmDeleteUserId=null}async _executeDeleteUser(){var a;const e=this._confirmDeleteUserId;if(!e)return;const t=(a=this.hass)==null?void 0:a.connection;if(t)try{await t.sendMessagePromise({type:"lcards/storage/users/clear",user_id:e}),this._confirmDeleteUserId=null,await this._loadUsers(),d.info("[UsersDevicesTab] Cleared overrides for user:",e)}catch(r){d.error("[UsersDevicesTab] Failed to delete user data:",r),this._error=`Failed to delete user data: ${r.message??r}`,this._confirmDeleteUserId=null}}_startRenameDevice(e,t){this._renamingDeviceId=e,this._renameValue=t??"",this._confirmDeleteDeviceId=null}_cancelRenameDevice(){this._renamingDeviceId=null,this._renameValue=""}async _executeRenameDevice(){var r;const e=this._renamingDeviceId,t=this._renameValue.trim();if(!e||!t)return;const a=(r=this.hass)==null?void 0:r.connection;if(a)try{await a.sendMessagePromise({type:"lcards/storage/devices/set",device_id:e,data:{[st]:t}}),this._renamingDeviceId=null,this._renameValue="",await this._loadDevices()}catch(s){d.error("[UsersDevicesTab] Failed to rename device:",s),this._error=`Failed to rename device: ${s.message??s}`,this._renamingDeviceId=null}}_startDeleteDevice(e){this._confirmDeleteDeviceId=e,this._confirmDeleteUserId=null,this._renamingDeviceId=null}_cancelDeleteDevice(){this._confirmDeleteDeviceId=null}async _executeDeleteDevice(){var a;const e=this._confirmDeleteDeviceId;if(!e)return;const t=(a=this.hass)==null?void 0:a.connection;if(t)try{await t.sendMessagePromise({type:"lcards/storage/devices/clear",device_id:e}),this._confirmDeleteDeviceId=null,await this._loadDevices(),d.info("[UsersDevicesTab] Removed device record:",e)}catch(r){d.error("[UsersDevicesTab] Failed to delete device data:",r),this._error=`Failed to delete device data: ${r.message??r}`,this._confirmDeleteDeviceId=null}}_isAdmin(){var e,t;return((t=(e=this.hass)==null?void 0:e.user)==null?void 0:t.is_admin)===true}_dim(){var e,t;return(t=(e=window.lcards)==null?void 0:e.core)==null?void 0:t.deviceIdentityManager}_formatDate(e){if(!e)return"-";try{return new Date(e).toLocaleString()}catch{return e}}_userName(e){var t;return((t=this._userNameMap)==null?void 0:t[e])??null}render(){return o`
      <div class="studio-layout">
        ${this._error?o`
          <div class="banner error">
            <ha-icon icon="mdi:alert-circle"></ha-icon>
            <span>${this._error}</span>
            <ha-button @click=${()=>{this._error=null}}>Dismiss</ha-button>
          </div>
        `:""}
        <div class="scrollable-body">
          ${this._renderCurrentSession()}
          ${this._isAdmin()?this._renderUsersSection():""}
          ${this._isAdmin()?this._renderDevicesSection():""}
        </div>
      </div>
    `}_renderCurrentSession(){var i,n,l,c;const e=this._dim(),t=(e==null?void 0:e.deviceId)??"-",a=this._formatDate(e==null?void 0:e.lastSeen),r=((n=(i=this.hass)==null?void 0:i.user)==null?void 0:n.name)??"Unknown",s=((c=(l=this.hass)==null?void 0:l.user)==null?void 0:c.id)??"-";return o`
      <lcards-form-section
        header="This Session"
        icon="mdi:laptop"
        description="Identity of this browser/device and the logged-in user."
        ?expanded=${true}
        ?outlined=${true}>

        <div class="field-group">
          <div class="field-row">
            <span class="field-label">
              <ha-icon icon="mdi:account"></ha-icon>
              Logged-in User
            </span>
            <span class="field-value">${r}</span>
          </div>
          <div class="field-row">
            <span class="field-label">
              <ha-icon icon="mdi:identifier"></ha-icon>
              User ID
            </span>
            <span class="field-value mono small muted">${s}</span>
          </div>
        </div>

        <div class="field-group">
          <div class="field-row">
            <span class="field-label">
              <ha-icon icon="mdi:fingerprint"></ha-icon>
              Device ID
            </span>
            <span class="field-value mono small">${t}</span>
          </div>

          <div class="field-row">
            <span class="field-label">
              <ha-icon icon="mdi:tag-text"></ha-icon>
              Display Name
            </span>
            <div class="field-value">
              ${this._editingName?o`
                  <div class="inline-edit-row">
                    <input
                      class="inline-input"
                      .value=${this._deviceName}
                      @input=${h=>this._deviceName=h.target.value}
                      @keydown=${h=>{h.key==="Enter"&&this._saveDeviceName(),h.key==="Escape"&&this._cancelEditName()}}
                      placeholder="e.g. Kitchen Tablet"
                    />
                    <ha-button @click=${this._saveDeviceName}>Save</ha-button>
                    <ha-button appearance="plain" @click=${this._cancelEditName}>Cancel</ha-button>
                  </div>
                `:o`
                  <div class="inline-edit-row">
                    <span>${this._deviceName||o`<em class="muted">Not set</em>`}</span>
                    <ha-icon-button
                      .label=${"Edit display name"}
                      @click=${()=>{this._editingName=true}}
                    ><ha-icon icon="mdi:pencil"></ha-icon></ha-icon-button>
                  </div>
                `}
            </div>
          </div>

          <div class="field-row">
            <span class="field-label">
              <ha-icon icon="mdi:clock-outline"></ha-icon>
              Last Seen
            </span>
            <span class="field-value">${a}</span>
          </div>

          <div class="field-row">
            <span class="field-label">
              <ha-icon icon="mdi:web"></ha-icon>
              User Agent
            </span>
            <span class="field-value mono small wrap">${(e==null?void 0:e.userAgent)??navigator.userAgent}</span>
          </div>
        </div>

      </lcards-form-section>
    `}_renderUsersSection(){return o`
      <lcards-form-section
        header="Users with Scoped Settings"
        icon="mdi:account-group"
        description="Home Assistant users who have stored per-user sound or other overrides."
        ?expanded=${false}
        ?outlined=${true}>

        <div class="section-actions">
          <ha-button @click=${this._loadUsers}>
            <ha-icon slot="start" icon="mdi:refresh"></ha-icon>
            Refresh
          </ha-button>
        </div>

        ${this._loading?o`
          <div class="loading-row">
            <ha-spinner size="small"></ha-spinner>
            Loading users…
          </div>
        `:this._users.length===0?o`
          <div class="empty-state">
            <ha-icon icon="mdi:account-off-outline"></ha-icon>
            <p>No per-user overrides stored yet.</p>
          </div>
        `:o`
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Stored Keys</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${this._users.map(e=>{var r;const t=this._userName(e.id),a=this._confirmDeleteUserId===e.id;return o`
                    <tr class="${a?"confirming":""}">
                      <td>
                        <div class="user-cell">
                          ${t?o`<span class="user-display-name">${t}</span>`:o`<em class="muted">Unknown user</em>`}
                          <span class="mono small muted">${e.id}</span>
                        </div>
                      </td>
                      <td class="key-count">${((r=e.data)==null?void 0:r.key_count)??0}</td>
                      <td class="actions-cell">
                        ${a?o`
                            <div class="inline-confirm">
                              <ha-icon icon="mdi:alert"></ha-icon>
                              <span>Clear all overrides for <strong>${t??e.id}</strong>?</span>
                              <div class="confirm-actions">
                                <ha-button class="danger-btn" variant="danger" @click=${this._executeDeleteUser}>Delete</ha-button>
                                <ha-button appearance="plain" @click=${this._cancelDeleteUser}>Cancel</ha-button>
                              </div>
                            </div>
                          `:o`
                            <ha-icon-button
                              class="danger-icon"
                              .label=${"Clear all overrides for this user"}
                              @click=${()=>this._startDeleteUser(e.id)}
                            ><ha-icon icon="mdi:delete"></ha-icon></ha-icon-button>
                          `}
                      </td>
                    </tr>
                  `})}
              </tbody>
            </table>
          </div>
        `}
      </lcards-form-section>
    `}_renderDevicesSection(){return o`
      <lcards-form-section
        header="Registered Devices"
        icon="mdi:devices"
        description="Browsers/devices that have registered a device identity or device-level overrides."
        ?expanded=${false}
        ?outlined=${true}>

        <div class="section-actions">
          <ha-button @click=${this._loadDevices}>
            <ha-icon slot="start" icon="mdi:refresh"></ha-icon>
            Refresh
          </ha-button>
        </div>

        ${this._loading?o`
          <div class="loading-row">
            <ha-spinner size="small"></ha-spinner>
            Loading devices…
          </div>
        `:this._devices.length===0?o`
          <div class="empty-state">
            <ha-icon icon="mdi:laptop-off"></ha-icon>
            <p>No device registrations stored yet.</p>
          </div>
        `:o`
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Display Name</th>
                  <th>Device ID</th>
                  <th>Last Seen</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${this._devices.map(e=>{var s,i;const t=(s=e.data)==null?void 0:s[st],a=this._renamingDeviceId===e.id,r=this._confirmDeleteDeviceId===e.id;return o`
                    <tr class="${a||r?"confirming":""}">
                      <td>
                        ${a?o`
                            <div class="inline-edit-row">
                              <input
                                class="inline-input"
                                .value=${this._renameValue}
                                @input=${n=>this._renameValue=n.target.value}
                                @keydown=${n=>{n.key==="Enter"&&this._executeRenameDevice(),n.key==="Escape"&&this._cancelRenameDevice()}}
                                placeholder="Device name…"
                              />
                              <ha-button @click=${this._executeRenameDevice}>Save</ha-button>
                              <ha-button appearance="plain" @click=${this._cancelRenameDevice}>Cancel</ha-button>
                            </div>
                          `:o`<span>${t??o`<em class="muted">Unnamed</em>`}</span>`}
                      </td>
                      <td class="mono small">${e.id}</td>
                      <td>${this._formatDate((i=e.data)==null?void 0:i[Et])}</td>
                      <td class="actions-cell">
                        ${r?o`
                            <div class="inline-confirm">
                              <ha-icon icon="mdi:alert"></ha-icon>
                              <span>Remove <strong>${t??e.id}</strong>?</span>
                              <div class="confirm-actions">
                                <ha-button class="danger-btn" variant="danger" @click=${this._executeDeleteDevice}>Delete</ha-button>
                                <ha-button appearance="plain" @click=${this._cancelDeleteDevice}>Cancel</ha-button>
                              </div>
                            </div>
                          `:o`
                            <ha-icon-button
                              .label=${"Rename device"}
                              @click=${()=>this._startRenameDevice(e.id,t)}
                            ><ha-icon icon="mdi:pencil"></ha-icon></ha-icon-button>
                            <ha-icon-button
                              class="danger-icon"
                              .label=${"Remove device record"}
                              @click=${()=>this._startDeleteDevice(e.id)}
                            ><ha-icon icon="mdi:delete"></ha-icon></ha-icon-button>
                          `}
                      </td>
                    </tr>
                  `})}
              </tbody>
            </table>
          </div>
        `}
      </lcards-form-section>
    `}static get styles(){return[R,H`
      :host {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow: hidden;
      }



      /* ── Banners ── */
      .banner {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
        padding: 10px 14px;
        border-radius: var(--ha-border-radius-md);
        font-size: 0.9em;
        flex-shrink: 0;
        margin-bottom: 8px;
      }
      .banner ha-button { margin-left: auto; }

      /* ── Section header actions ── */
      .section-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        padding-bottom: 8px;
      }

      /* ── Field groups ── */
      .field-group {
        display: flex;
        flex-direction: column;
        padding: 8px 0;
        border-bottom: var(--ha-border-width-sm) solid color-mix(in srgb, var(--divider-color) 40%, transparent);
      }
      .field-group:last-child { border-bottom: none; }

      .field-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 5px 0;
      }

      .field-label {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 150px;
        font-size: 0.8em;
        color: var(--secondary-text-color);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        flex-shrink: 0;
        padding-top: 2px;
      }
      .field-label ha-icon {
        --mdc-icon-size: 16px;
        color: var(--primary-color);
      }

      .field-value {
        flex: 1;
        font-size: 0.9em;
        color: var(--primary-text-color);
        word-break: break-all;
      }
      .field-value.wrap { word-break: break-word; }

      /* ── Inline edit ── */
      .inline-edit-row {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }

      .inline-input {
        flex: 1;
        min-width: 160px;
        background: var(--input-fill-color, rgba(255,255,255,0.05));
        border: var(--ha-border-width-sm) solid var(--divider-color);
        border-radius: var(--ha-border-radius-sm);
        color: var(--primary-text-color);
        padding: 5px 8px;
        font-size: 0.9em;
        outline: none;
      }
      .inline-input:focus {
        border-color: var(--primary-color);
      }

      /* ── Tables ── */
      .table-wrapper {
        overflow-x: auto;
      }

      .data-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.85em;
      }

      .data-table th {
        text-align: left;
        padding: 6px 8px;
        font-size: 0.85em;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--secondary-text-color);
        font-weight: 600;
        border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
      }

      .data-table td {
        padding: 6px 8px;
        border-bottom: var(--ha-border-width-sm) solid color-mix(in srgb, var(--divider-color) 40%, transparent);
        vertical-align: middle;
      }

      .data-table tr:last-child td { border-bottom: none; }

      .data-table tr:hover td {
        background: var(--secondary-background-color, rgba(255,255,255,0.04));
      }

      .data-table tr.confirming td {
        background: color-mix(in srgb, var(--error-color, #f44336) 6%, transparent);
      }

      /* User cell: stacked display name + ID */
      .user-cell {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .user-display-name {
        font-weight: 500;
        color: var(--primary-text-color);
      }

      .key-count {
        text-align: center;
        color: var(--secondary-text-color);
      }

      .actions-cell {
        white-space: nowrap;
        text-align: right;
      }

      /* ── Inline confirm strip ── */
      .inline-confirm {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        background: color-mix(in srgb, var(--error-color, #f44336) 10%, transparent);
        border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--error-color, #f44336) 30%, transparent);
        border-radius: var(--ha-border-radius-md);
        font-size: 0.85em;
        flex-wrap: wrap;
      }
      .inline-confirm ha-icon {
        color: var(--error-color, #f44336);
        flex-shrink: 0;
      }
      .inline-confirm span { flex: 1; }
      .confirm-actions {
        display: flex;
        gap: 8px;
        margin-left: auto;
      }
      .danger-icon {
        color: var(--error-color, #f44336);
      }

      /* ── Loading / empty ── */
      .loading-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 24px;
        color: var(--secondary-text-color);
        justify-content: center;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 32px 24px;
        text-align: center;
        color: var(--secondary-text-color);
        gap: 8px;
      }
      .empty-state ha-icon { --mdc-icon-size: 40px; opacity: 0.4; }
      .empty-state p { margin: 0; font-size: 0.9em; }

      /* ── Utilities ── */
      .mono { font-family: monospace; }
      .small { font-size: 0.75em; }
      .muted { color: var(--secondary-text-color); font-style: italic; }
    `]}};b(et,"LCARdsUsersDevicesTab");let Ke=et;customElements.get("lcards-users-devices-tab")||customElements.define("lcards-users-devices-tab",Ke);function pt(u){return/^(true|false|null)$/i.test(u)||/^[0-9]/.test(u)||/[:#[\]{}&*!|>'"%@`]/.test(u)||u.includes(`
`)}b(pt,"_needsQuote");function F(u,e=0){const t="  ".repeat(e);if(u==null)return"null";if(typeof u=="boolean")return u?"true":"false";if(typeof u=="number")return String(u);if(typeof u=="string")return pt(u)?`'${u.replace(/'/g,"''")}'`:u;if(Array.isArray(u))return u.length?u.map(a=>{if(a!==null&&typeof a=="object"){const r="  ".repeat(e+1),s=F(a,e+1).split(`
`),i=s[0].startsWith(r)?s[0].slice(r.length):s[0];return`${t}- ${i}
${s.slice(1).join(`
`)}`}return`${t}- ${F(a,e)}`}).join(`
`):"[]";if(typeof u=="object"){const a=Object.keys(u);return a.length?a.map(r=>{const s=u[r],i=pt(r)?`'${r.replace(/'/g,"''")}'`:r;return s!==null&&typeof s=="object"&&!Array.isArray(s)&&Object.keys(s).length?`${t}${i}:
${F(s,e+1)}`:Array.isArray(s)&&s.length&&typeof s[0]=="object"?`${t}${i}:
${F(s,e+1)}`:`${t}${i}: ${F(s,e)}`}).join(`
`):"{}"}return String(u)}b(F,"_toYaml");const K="grid-layout { --layout-height: 100% !important; }";function Wt(){return['"header-border header-border header-border header-border header-border header-border header-border header-border"','"border-left header-left . header header header header sidebar-right"','"border-left header-left . . . . . sidebar-right"','"border-left header-left . content-panel content-panel content-panel . sidebar-right"','"sidebar-left sidebar-left . content-panel content-panel content-panel . sidebar-right"','"footer-left footer-left footer-left content-panel content-panel content-panel . sidebar-right"','"footer-left footer-left footer-left . . . . sidebar-right"','"footer-left footer-left footer-left . footer footer footer sidebar-right"','"footer-left footer-left footer-left . footer-border footer-border footer-border sidebar-right"'].join(" ")}b(Wt,"_shellGridAreas");function ut(u,e){const t=(u.title||"LCARdS Dashboard").trim(),a=t.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"")||"lcards-dashboard",r=(u.page_names||"HOME, LIGHTS, SECURITY").split(",").map(h=>h.trim().toUpperCase()).filter(Boolean),s=e==="9inch"?"clamp(80px, 11vw, 150px)":"clamp(100px, 12vw, 180px)",i=e==="9inch"?820:1010,n={height:"calc(100dvh - var(--header-height, 56px))","grid-gap":"5px",card_margin:0,margin:0,padding:0,"grid-template-columns":`45px ${s} 5px 40px 1fr 40px 5px minmax(0, auto)`,"grid-template-rows":"minmax(0,auto) clamp(25px, 5vh, 95px) 5px 40px 1fr 40px 5px clamp(25px, 5vh, 95px) 45px","grid-template-areas":Wt(),mediaquery:{[`(max-width: ${i}px)`]:{"grid-template-rows":"minmax(0,auto) clamp(25px, 5vh, 95px) 5px 40px minmax(0,1fr) 40px 5px clamp(25px, 5vh, 95px) 45px","grid-gap":"5px","grid-template-columns":`45px ${s} 5px 40px 1fr 40px 1px minmax(0,auto)`}}},l={title:t,path:a,type:"custom:grid-layout",layout:n,card_mod:{style:K},cards:[{type:"custom:lcards-elbow",elbow:{type:"footer-left",radius:{outer:"auto"},style:"segmented",segments:{gap:5,outer_segment:{bar_width:45,bar_height:45,outer_curve:160,inner_curve:115,color:{default:"var(--lcars-ui-primary)"}},inner_segment:{bar_width:s,bar_height:"clamp(25px, 5vh, 95px)",inner_curve:35,color:{default:"var(--lcars-ui-quaternary)",hover:"var(--lcards-green)"}}}},width:`calc(50px + ${s} + 50px + 5px)`,view_layout:{"grid-area":"footer-left"}},{type:"custom:lcards-button",preset:"panel-light",min_width:10,text:{label:{show:false}},view_layout:{"grid-area":"border-left"}},{type:"custom:layout-card",layout_type:"custom:grid-layout",layout:{"grid-template-columns":"1fr","grid-gap":"5px","grid-template-rows":"1fr","grid-auto-rows":"1fr",padding:0,card_margin:0,margin:0},cards:[{type:"custom:lcards-button",preset:"panel-dark",min_height:10,entity:"input_boolean.lcars_ui_top_bar",interactive:true},{type:"custom:lcards-button",preset:"panel-dark",min_height:10,entity:"input_boolean.lcars_ui_right_sidebar",interactive:true}],view_layout:{"grid-area":"header-left"},card_mod:{style:K}},{type:"custom:layout-card",layout_type:"custom:grid-layout",layout:{"grid-template-columns":"45px 1fr","grid-template-rows":"1fr","grid-auto-rows":"auto","grid-gap":"5px",padding:0,card_margin:0,margin:0},cards:[{type:"custom:lcards-button",preset:"panel-light",text:{label:{show:false}}},{type:"custom:lcards-select-menu",entity:"input_select.lcars_ui_page_selector",preset:"outline",grid:{columns:1,gap:"5px","grid-auto-rows":"auto"},button_template:{min_height:"10",text:{label:{show:true,position:"center-right"}}}},{type:"custom:lcards-button",preset:"panel-light",text:{label:{show:false}}},{type:"custom:lcards-button",preset:"panel-dark",tap_action:{action:"toggle"}}],view_layout:{"grid-area":"sidebar-left"},card_mod:{style:K}},{type:"custom:lcards-button",preset:"panel-light",min_height:10,text:{label:{show:true,content:"[ header: customize me ]"}},view_layout:{"grid-area":"header"}},{type:"custom:lcards-button",preset:"outline",text:{label:{show:true,content:"[ content-panel: paste a content panel card here ]"}},view_layout:{"grid-area":"content-panel"}},{type:"custom:lcards-button",preset:"panel-dark",text:{label:{show:true,content:"[ right sidebar ]"}},view_layout:{"grid-area":"sidebar-right"},width:"clamp(100px, 16vw, 230px)",visibility:[{condition:"state",entity:"input_boolean.lcars_ui_right_sidebar",state:"on"}]},{type:"custom:layout-card",layout_type:"custom:grid-layout",layout:{"grid-template-columns":"auto 1fr","grid-gap":"5px","grid-template-rows":"1fr","grid-auto-rows":"1fr",padding:0,card_margin:0,margin:0},cards:[{type:"custom:lcards-elbow",visibility:[{condition:"state",entity:"input_select.lcars_ui_page_selector",state:r[0]||"HOME"}],elbow:{type:"header-left",style:"segmented",segments:{gap:5,outer_segment:{bar_width:45,bar_height:45,outer_curve:120,inner_curve:75,color:{default:"var(--lcars-ui-primary)"}},inner_segment:{bar_width:`calc(${s})`,bar_height:.01,inner_curve:75,color:{default:"var(--lcars-ui-quaternary)"}}}},height:"10vh",width:`calc(45px + ${s} + 5px + 40px)`},{type:"custom:layout-card",layout_type:"custom:grid-layout",layout:{"grid-template-columns":"1fr","grid-gap":"5px","grid-template-rows":"45px minmax(10px,50px)",padding:0,card_margin:0,margin:0,height:"8vh"},cards:[{type:"custom:lcards-button",preset:"panel-light",min_height:10},{type:"custom:lcards-button",preset:"text-only",min_height:10,interactive:false,text:{label:{show:true,content:"[ banner / ticker area ]"}},style:{border:{color:{default:"transparent"},width:3}}}],card_mod:{style:K}}],visibility:[{condition:"state",entity:"input_boolean.lcars_ui_top_bar",state:"on"}],view_layout:{"grid-area":"header-border"},card_mod:{style:K}},{type:"custom:lcards-button",preset:"panel-light",min_height:10,view_layout:{"grid-area":"footer"}},{type:"custom:layout-card",layout_type:"custom:grid-layout",layout:{"grid-template-columns":"1fr","grid-gap":"5px","grid-template-rows":"1fr","grid-auto-rows":"1fr",padding:0,card_margin:0,margin:0},cards:[{type:"custom:lcards-button",preset:"panel-light",min_height:1}],view_layout:{"grid-area":"footer-border"},card_mod:{style:K}}]},c=["input_select:","  lcars_ui_page_selector:","    name: LCARS Page Selector","    options:",...r.map(h=>`      - ${h}`),"  lcars_ui_room_selector:","    name: LCARS Room Selector","    options:","      - Living Room    # Replace with your actual Home Assistant area names","      - Kitchen","      - Bedroom","input_boolean:","  lcars_ui_top_bar:","    name: LCARS Top Bar","  lcars_ui_right_sidebar:","    name: LCARS Right Sidebar"].join(`
`);return{view:l,helpers:c}}b(ut,"_generateShellAdaptive");function Qt(u){const e=u.card_type||"custom:lcards-slider",t=u.preset||"pills-left-border",a=`[{% for e in area_entities(states('input_select.lcars_ui_room_selector')) %}{% if e.startswith('light.') %}{'entity': '{{ e }}','type': '${e}','preset': '${t}','view_layout': {'grid-column': '1'},'text': {'name': {'show': 'true'}}},{% endif %}{% endfor %}]`,r={type:"custom:lcards-elbow",elbow:{type:"frame",frame:{bar_width:40,bar_height:20,top:{enabled:true,bar_height:40},bottom:{enabled:true,bar_height:40},right:{enabled:false},left:{enabled:false}}},symbiont:{enabled:true,overflow_y:"auto",overflow_x:"hidden",position:{top:10,right:10,bottom:10,left:10},size:{width:"95%",height:"95%"},anchor:"center",card:{type:"custom:layout-card",layout_type:"custom:grid-layout",layout:{"grid-template-columns":"minmax(60px, 200px) 20px 1fr","grid-template-rows":"auto 1fr auto","grid-template-areas":'"header header header" "selector . list" "footer footer footer"',"grid-gap":"5px",padding:0,card_margin:0,margin:0,height:"100%"},card_mod:{style:":host { height: 100%; min-height: 0; } grid-layout { --layout-height: 100% !important; overflow: hidden !important; }"},cards:[{type:"custom:lcards-elbow",min_height:"60px",view_layout:{"grid-area":"header"}},{type:"custom:lcards-select-menu",entity:"input_select.lcars_ui_room_selector",preset:"lozenge",grid:{columns:1,gap:"5px"},view_layout:{"grid-area":"selector"}},{type:"custom:auto-entities",filter:{template:a},card_param:"cards",card:{type:"custom:layout-card",layout_type:"custom:grid-layout",layout:{"grid-template-columns":"1fr","grid-template-rows":"minmax(45px, 56px)","grid-auto-rows":"minmax(45px, 56px)","grid-gap":"5px",padding:0,card_margin:0,margin:0}},view_layout:{"grid-area":"list"}},{type:"custom:lcards-elbow",elbow:{type:"footer-left",segment:{bar_width:90,bar_height:20,outer_curve:"auto"}},height:"60px",view_layout:{"grid-area":"footer"}}]}},view_layout:{"grid-area":"content-panel"}},s=["input_select:","  lcars_ui_room_selector:","    name: LCARS Room Selector","    options:","      - Living Room    # Replace with your actual Home Assistant area names","      - Kitchen","      - Bedroom"].join(`
`);return{card:r,helpers:s}}b(Qt,"_generatePanelRoomLights");const Q=[{id:"shell-tablet-9",section:"shell",label:'Adaptive Shell: 9"',icon:"mdi:tablet",description:'Full adaptive shell with page-selector sidebar, header, footer, and content-panel zone. Tuned for 9" tablets.',inputs:[{key:"title",label:"Dashboard Title",hint:"Used as the view title and URL path.",type:"text",selector:{text:{}},defaultValue:"My Dashboard"},{key:"page_names",label:"Page Names",hint:"Comma-separated. Become the sidebar selector options.",type:"text",selector:{text:{}},defaultValue:"HOME, LIGHTS, SECURITY"}],generate:b(u=>ut(u,"9inch"),"generate")},{id:"shell-tablet-11",section:"shell",label:'Adaptive Shell: 11"',icon:"mdi:tablet-dashboard",description:'Full adaptive shell with page-selector sidebar, header, footer, and content-panel zone. Tuned for 11" tablets.',inputs:[{key:"title",label:"Dashboard Title",hint:"Used as the view title and URL path.",type:"text",selector:{text:{}},defaultValue:"My Dashboard"},{key:"page_names",label:"Page Names",hint:"Comma-separated. Become the sidebar selector options.",type:"text",selector:{text:{}},defaultValue:"HOME, LIGHTS, SECURITY"}],generate:b(u=>ut(u,"11inch"),"generate")},{id:"panel-room-lights",section:"panel",label:"Room Lights",icon:"mdi:lightbulb-group-outline",description:"Room selector with auto-populated light controls per area. Drop into a shell's content-panel zone. Requires auto-entities (HACS).",inputs:[{key:"card_type",label:"Entity Card",hint:"Card type rendered for each light entity.",type:"select",selector:{select:{options:[{value:"custom:lcards-slider",label:"Slider: brightness control"},{value:"custom:lcards-button",label:"Button: on/off toggle"}],mode:"dropdown"}},defaultValue:"custom:lcards-slider"},{key:"preset",label:"Card Preset",hint:"Visual preset applied to each entity card.",type:"text",selector:{text:{}},defaultValue:"pills-left-border"}],generate:b(u=>Qt(u),"generate")}],Jt=Q.filter(u=>u.section==="shell"),Xt=Q.filter(u=>u.section==="panel"),Ve=class Ve2 extends M{constructor(){super(),this.hass=void 0,this._selectedId=Q[0].id,this._params={},this._generating=false,this._copyFeedback=false,this._generatedYaml="",this._initParams(Q[0])}_initParams(e){const t={};for(const a of e.inputs??[])t[a.key]=a.defaultValue;this._params=t}_getTemplate(e){return Q.find(t=>t.id===e)??Q[0]}_selectTemplate(e){this._selectedId=e,this._generatedYaml="",this._initParams(this._getTemplate(e))}_handleParamChange(e,t){t.stopPropagation(),this._params={...this._params,[e]:t.detail.value},this._generatedYaml=""}async _handleGenerate(){const e=this._getTemplate(this._selectedId);this._generating=true,this._generatedYaml="",this.requestUpdate();try{const t=e.generate(this._params),r=`# LCARdS Layout Library: ${new Date().toLocaleDateString()}
# Requires: layout-card (HACS: custom:grid-layout)
#
`;t.view?this._generatedYaml=r+`# ── PART 1: Dashboard View ──────────────────────────────────────────
# Paste under 'views:' in your dashboard raw editor.

`+F(t.view,0)+(t.helpers?`

# ── PART 2: Home Assistant Helpers ──────────────────────────────────────────────
# Add to configuration.yaml, then restart Home Assistant.

`+t.helpers:""):t.card&&(this._generatedYaml=r+`# Requires also: auto-entities (HACS)
#
# ── Content Panel Card ──────────────────────────────────────────────
# Replace the content-panel placeholder in your shell with this card.

`+F(t.card,0)+(t.helpers?`

# ── Required Home Assistant Helpers ─────────────────────────────────────────────
# Add to configuration.yaml, then restart Home Assistant.

`+t.helpers:"")),d.debug("[LCARdSLayoutsTab] YAML generated",{bytes:this._generatedYaml.length})}catch(t){d.error("[LCARdSLayoutsTab] generate() failed",t),this._generatedYaml=`# Error generating layout:
# ${t.message}`}finally{this._generating=false}}async _handleCopy(){this._generatedYaml&&await W(this._generatedYaml)&&(this._copyFeedback=true,this.requestUpdate(),setTimeout(()=>{this._copyFeedback=false,this.requestUpdate()},2e3))}_renderTemplateCard(e){const t=e.id===this._selectedId;return o`
      <div
        class="template-card ${t?"selected":""}"
        role="button"
        tabindex="0"
        @click=${()=>this._selectTemplate(e.id)}
        @keydown=${a=>a.key==="Enter"&&this._selectTemplate(e.id)}
      >
        <div class="template-icon"><ha-icon icon="${e.icon}"></ha-icon></div>
        <div class="template-body">
          <span class="template-name">${e.label}</span>
          <span class="template-desc">${e.description}</span>
        </div>
        ${t?o`<ha-icon icon="mdi:check-circle" class="template-check"></ha-icon>`:""}
      </div>
    `}render(){const e=this._getTemplate(this._selectedId),a=e.section==="shell"?o`Paste <strong>Part 1</strong> under <code>views:</code> in your dashboard raw editor. Add <strong>Part 2</strong> to <code>configuration.yaml</code>.`:o`Replace the <code>content-panel</code> placeholder in your shell with this card.`;return o`
      <div class="studio-layout"><div class="scrollable-body">

        <!-- ── Prerequisite banner ── -->
        <div class="banner warning">
          <ha-icon icon="mdi:information-outline"></ha-icon>
          <span>
            Layouts require <strong>layout-card</strong> from HACS (<code>custom:grid-layout</code>).
            Content panels also require <strong>auto-entities</strong> (HACS).
          </span>
        </div>

        <!-- ── Template picker ── -->
        <lcards-form-section
          header="Choose a Template"
          icon="mdi:view-grid-plus-outline"
          description="Select a shell (outer dashboard structure) or a content panel (card that slots into a shell's content-panel zone), fill in the inputs, then copy the generated YAML."
          ?expanded=${true}
          ?outlined=${true}>

          <div class="section-label">
            <ha-icon icon="mdi:monitor-dashboard"></ha-icon>
            <span>Shells</span>
          </div>
          <div class="template-grid">
            ${Jt.map(r=>this._renderTemplateCard(r))}
          </div>

          <div class="section-label" style="margin-top: 12px;">
            <ha-icon icon="mdi:view-module-outline"></ha-icon>
            <span>Content Panels</span>
          </div>
          <div class="template-grid">
            ${Xt.map(r=>this._renderTemplateCard(r))}
          </div>
        </lcards-form-section>

        <!-- ── Parameters ── -->
        <lcards-form-section
          header="Inputs"
          icon="mdi:tune-variant"
          ?expanded=${true}
          ?outlined=${true}>

          ${(e.inputs??[]).map(r=>o`
            <div class="control-row">
              <ha-selector
                .hass=${this.hass}
                .label=${r.label}
                .helper=${r.hint}
                .selector=${r.selector}
                .value=${this._params[r.key]}
                @value-changed=${s=>this._handleParamChange(r.key,s)}
              ></ha-selector>
            </div>
          `)}

          <div class="generate-row">
            <ha-button unelevated ?disabled=${this._generating} @click=${this._handleGenerate}>
              <ha-icon slot="icon" icon="mdi:code-tags"></ha-icon>
              ${this._generating?"Generating…":"Generate YAML"}
            </ha-button>
          </div>
        </lcards-form-section>

        <!-- ── Output ── -->
        ${this._generatedYaml?o`
          <lcards-form-section
            header="Generated YAML"
            icon="mdi:code-tags"
            ?expanded=${true}
            ?outlined=${true}>

            <div class="yaml-actions">
              <span class="yaml-hint">${a}</span>
              <ha-button @click=${this._handleCopy}>
                <ha-icon slot="icon" icon=${this._copyFeedback?"mdi:check":"mdi:content-copy"}></ha-icon>
                ${this._copyFeedback?"Copied!":"Copy"}
              </ha-button>
            </div>
            <pre class="yaml-block"><code>${this._generatedYaml}</code></pre>
          </lcards-form-section>
        `:""}

      </div></div>
    `}static get styles(){return[R,H`
      :host {
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow: hidden;
      }



      /* Prerequisite banner */
      .banner {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-radius: var(--ha-border-radius-md);
        font-size: 0.9em;
      }
      .banner ha-icon { flex-shrink: 0; color: var(--warning-color, #ff9800); }
      .banner code, .banner strong {
        font-family: monospace;
        background: color-mix(in srgb, var(--primary-text-color) 10%, transparent);
        padding: 1px 5px;
        border-radius: 3px;
      }
      .banner strong { font-family: inherit; }

      /* Section labels */
      .section-label {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 2px 6px;
        font-size: 0.72em;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--secondary-text-color);
        border-bottom: var(--ha-border-width-sm) solid color-mix(in srgb, var(--divider-color) 40%, transparent);
        margin-bottom: 6px;
      }
      .section-label ha-icon { --mdc-icon-size: 13px; }

      /* Template picker cards */
      .template-grid {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding-bottom: 4px;
      }

      .template-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border-radius: var(--ha-card-border-radius, 12px);
        border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--divider-color) 60%, transparent);
        background: var(--secondary-background-color);
        cursor: pointer;
        color: var(--primary-text-color);
        transition: background var(--ha-animation-duration-fast), border-color var(--ha-animation-duration-fast);
      }
      .template-card:hover {
        background: color-mix(in srgb, var(--primary-color) 15%, var(--secondary-background-color));
        border-color: var(--primary-color);
      }
      .template-card.selected {
        background: color-mix(in srgb, var(--primary-color) 22%, var(--secondary-background-color));
        border-color: var(--primary-color);
      }
      .template-card:focus-visible { outline: 2px solid var(--primary-color); outline-offset: 2px; }

      .template-icon { flex-shrink: 0; --mdc-icon-size: 22px; color: var(--primary-color); }
      .template-body { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
      .template-name { font-weight: 600; font-size: 0.95em; }
      .template-desc { color: var(--secondary-text-color); font-size: 0.85em; line-height: 1.4; }
      .template-check { flex-shrink: 0; --mdc-icon-size: 18px; color: var(--primary-color); }

      /* Parameter control rows */
      .control-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 8px 0;
        border-bottom: var(--ha-border-width-sm) solid color-mix(in srgb, var(--divider-color) 50%, transparent);
      }
      .control-row:last-child { border-bottom: none; }

      .control-row > ha-selector { flex: 1; min-width: 200px; }

      .generate-row { display: flex; justify-content: flex-end; padding-top: 12px; }

      /* YAML output */
      .yaml-actions {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 4px 0 10px;
        border-bottom: var(--ha-border-width-sm) solid color-mix(in srgb, var(--divider-color) 50%, transparent);
        margin-bottom: 10px;
      }
      .yaml-hint { flex: 1; font-size: 0.85em; color: var(--secondary-text-color); }
      .yaml-hint code {
        font-family: monospace;
        background: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
        padding: 1px 4px;
        border-radius: 3px;
      }

      .yaml-block {
        background: var(--primary-background-color);
        color: var(--primary-text-color);
        border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--divider-color) 60%, transparent);
        border-radius: 6px;
        padding: 14px 16px;
        font-family: 'Fira Code', 'Consolas', 'Menlo', monospace;
        font-size: 0.78em;
        line-height: 1.7;
        overflow-x: auto;
        white-space: pre;
        margin: 0;
        max-height: 50vh;
        overflow-y: auto;
      }
    `]}};b(Ve,"LCARdSLayoutsTab"),A(Ve,"properties",{hass:{type:Object},_selectedId:{type:String,state:true},_params:{type:Object,state:true},_generatedYaml:{type:String,state:true},_generating:{type:Boolean,state:true},_copyFeedback:{type:Boolean,state:true}});let We=Ve;customElements.get("lcards-layouts-tab")||customElements.define("lcards-layouts-tab",We);const Zt=[{value:"text",label:"Simple text"},{value:"card",label:"Custom card (YAML)"},{value:"borg",label:"Resistance is Futile"}],ea=[{value:"uppercase",label:"UPPERCASE"},{value:"capitalize",label:"Title Case"},{value:"none",label:"None"}],mt={text:Te,color:Ae,font:ke,size:Se,weight:Ce,transform:$e},ta={text:xe,color:we,font:ye,size:_e,weight:be,transform:fe},J=class J2 extends M{constructor(){super(),this.hass=void 0,this._scope="user",this._scopeInfo={scope:"user",userId:null,deviceId:null,isAdminTarget:false},this._scopeChosen=false,this._editConfig=null,this._contentYaml="",this._contentYamlError=null,this._reconnectedContentYaml="",this._reconnectedContentYamlError=null,this._loading=false,this._saving=false,this._error=null,this._testActive=false,this._scopedValues=null,this._scopedLoading=false,this._loadGeneration=0,this._isDirty=false,this._confirmClear=false,this._remoteUpdatePending=false,this._reloadSent=null,this._dirtyServiceKeys=new Set,this._boundHandleOverlayDismiss=()=>{this._testActive=false},this._boundHandleRemoteConfigChange=()=>this._handleRemoteConfigChange()}willUpdate(e){var t;if(e.has("hass")&&((t=this.hass)!=null&&t.user)&&!this._scopeChosen){this._scopeChosen=true;const a=Lt(this.hass);a!==this._scope&&(this._scope=a,this._scopeInfo={...this._scopeInfo,scope:a},this._scopedValues&&(this._editConfig=this._buildEffectiveConfig()))}}connectedCallback(){super.connectedCallback(),this._loadConfig(),document.addEventListener("lcards-connection-overlay-dismissed",this._boundHandleOverlayDismiss),document.addEventListener("lcards-connection-config-changed",this._boundHandleRemoteConfigChange)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("lcards-connection-overlay-dismissed",this._boundHandleOverlayDismiss),document.removeEventListener("lcards-connection-config-changed",this._boundHandleRemoteConfigChange)}async _loadScopedValues(e=false,t=null){var i,n,l,c,h;const a=(n=(i=window.lcards)==null?void 0:i.core)==null?void 0:n.scopedSettingsService;if(!a||!e&&this._scopedLoading||!((h=(c=(l=window.lcards)==null?void 0:l.core)==null?void 0:c.integrationService)!=null&&h.available))return;this._scopedLoading=true;const r=++this._loadGeneration,s=t??this._scopeInfoOpts();d.debug("[ConnectivityTab] _loadScopedValues start",{gen:r,force:e,opts:s});try{const p=await Promise.all(De.map(g=>a.readAllScopes(g,null,s)));if(r!==this._loadGeneration){d.debug("[ConnectivityTab] _loadScopedValues discarded (gen mismatch)",{gen:r,current:this._loadGeneration});return}this._scopedValues=Object.fromEntries(De.map((g,v)=>[g,p[v]])),d.debug("[ConnectivityTab] _loadScopedValues complete",{gen:r,enabled:this._scopedValues[N]})}catch(p){d.warn("[ConnectivityTab] Failed to load scope data:",p),r===this._loadGeneration&&(this._scopedValues=null)}finally{r===this._loadGeneration&&(this._scopedLoading=false)}}_scopeInfoOpts(){return{...this._scopeInfo.userId?{targetUserId:this._scopeInfo.userId}:{},...this._scopeInfo.deviceId?{targetDeviceId:this._scopeInfo.deviceId}:{}}}_buildEffectiveConfig(){const e=this._scopedValues,t=this._defaultConfig(),a=this._scope,r=b((s,i)=>{var n,l;return((n=e==null?void 0:e[s])==null?void 0:n[a])??((l=e==null?void 0:e[s])==null?void 0:l.global)??i},"r");return{enabled:r(N,t.enabled),dismiss:r(re,t.dismiss),position:r(Ie,t.position),width:r(Re,t.width),height:r(Pe,t.height),content:r(ue,t.content),layers:r(Me,t.layers),disconnect_delay_ms:r(ae,t.disconnect_delay_ms),message:{mode:r(He,t.message.mode),text:r(Te,t.message.text),color:r(Ae,t.message.color),font:r(ke,t.message.font),size:r(Se,t.message.size),weight:r(Ce,t.message.weight),transform:r($e,t.message.transform),borgLayers:r(te,t.message.borgLayers)},reconnected:{enabled:r(z,t.reconnected.enabled),text:r(xe,t.reconnected.text),color:r(we,t.reconnected.color),auto_dismiss_seconds:r(U,t.reconnected.auto_dismiss_seconds),font:r(ye,t.reconnected.font),size:r(_e,t.reconnected.size),weight:r(be,t.reconnected.weight),transform:r(fe,t.reconnected.transform),content:r(ee,t.reconnected.content)}}}_loadConfig(){return this._loadConfigPromise??(this._loadConfigPromise=this._doLoadConfig().finally(()=>{this._loadConfigPromise=null})),this._loadConfigPromise}async _doLoadConfig(){var e,t,a,r,s;this._loading=true,this._error=null;try{const i=(t=(e=window.lcards)==null?void 0:e.core)==null?void 0:t.integrationService;if(i&&!i.isReady&&await i.onReady(),!this.isConnected)return;if(!(i!=null&&i.available)){this._editConfig=this._defaultConfig();return}if(await this._loadScopedValues(true),!this._scopedValues&&this._scopedLoading)return;if(!this._scopedValues)throw new Error("scoped settings read failed");this._editConfig=this._buildEffectiveConfig(),this._isDirty=false;const n=this._editConfig;this._contentYaml=n.content?T.dump(n.content,{indent:2}):"",this._reconnectedContentYaml=(a=n.reconnected)!=null&&a.content?T.dump(n.reconnected.content,{indent:2}):"",await((s=(r=window.lcards)==null?void 0:r.connectionOverlay)==null?void 0:s.loadConfig())}catch(i){d.warn("[ConnectivityTab] Config load failed:",i),this._error="Could not load settings from server.",this._editConfig=this._defaultConfig(),this._contentYaml="",this._reconnectedContentYaml=""}finally{this._loading=false}}async _saveConfig(){var n,l,c,h,p,g,v;if(!this._editConfig)return;const e=this._scope,t=this._scopeInfoOpts(),a=((n=this._editConfig.message)==null?void 0:n.mode)??"text";let r=null,s=null;if(a==="card"){if((l=this._contentYaml)!=null&&l.trim())try{r=T.load(this._contentYaml),this._contentYamlError=null}catch(_){this._contentYamlError=`Invalid YAML: ${_.message}`;return}if((c=this._reconnectedContentYaml)!=null&&c.trim())try{s=T.load(this._reconnectedContentYaml),this._reconnectedContentYamlError=null}catch(_){this._reconnectedContentYamlError=`Invalid YAML: ${_.message}`;return}}const i=this._buildSparseConfig(this._editConfig,r,s);this._saving=true,this._error=null,d.info("[ConnectivityTab] _saveConfig start",{savedScope:e,savedOpts:t,dirtyKeys:[...this._dirtyServiceKeys]});try{if(await((p=(h=window.lcards)==null?void 0:h.connectionOverlay)==null?void 0:p.saveConfig(i,e,t))===false){this._error=this._writeErrorText(e,"Could not save settings.");return}d.info("[ConnectivityTab] _saveConfig write complete — force-reloading"),this._scopedValues=null,await this._loadScopedValues(true,t),d.info("[ConnectivityTab] _saveConfig reload complete",{enabledSv:(g=this._scopedValues)==null?void 0:g[N],scope:this._scope}),this._editConfig=this._buildEffectiveConfig(),this._isDirty=false,this._dirtyServiceKeys=new Set;const m=this._editConfig;this._contentYaml=m.content?T.dump(m.content,{indent:2}):"",this._reconnectedContentYaml=(v=m.reconnected)!=null&&v.content?T.dump(m.reconnected.content,{indent:2}):""}catch(_){d.warn("[ConnectivityTab] Config save failed:",_),this._error="Could not save settings."}finally{this._saving=false}}_writeErrorText(e,t){return e==="global"&&!Oe(this.hass)?Je:t}async _resetScope(){var a,r,s;const e=this._scope,t=this._scopeInfoOpts();this._saving=true,this._error=null,this._confirmClear=false;try{if(await((r=(a=window.lcards)==null?void 0:a.connectionOverlay)==null?void 0:r.clearConfig(e,t))===false){this._error=this._writeErrorText(e,"Could not reset settings.");return}this._scopedValues=null,await this._loadScopedValues(true,t),this._editConfig=this._buildEffectiveConfig(),this._isDirty=false,this._dirtyServiceKeys=new Set;const n=this._editConfig;this._contentYaml=n.content?T.dump(n.content,{indent:2}):"",this._reconnectedContentYaml=(s=n.reconnected)!=null&&s.content?T.dump(n.reconnected.content,{indent:2}):""}catch(i){d.warn("[ConnectivityTab] Config reset failed:",i),this._error="Could not reset settings."}finally{this._saving=false}}async _reloadAllDevices(){var t;const e=(t=this.hass)==null?void 0:t.connection;if(e){this._saving=true,this._error=null;try{await e.sendMessagePromise({type:"lcards/fire_event",action:"reload_connection_config"}),d.info("[ConnectivityTab] Broadcast reload sent to all connected devices"),this._reloadSent="config",setTimeout(()=>{this._reloadSent=null},2e3)}catch(a){d.warn("[ConnectivityTab] Failed to broadcast reload:",a),this._error="Could not broadcast reload: requires admin access."}finally{this._saving=false}}}async _reloadAllPages(){var t;const e=(t=this.hass)==null?void 0:t.connection;if(e){this._saving=true,this._error=null;try{await e.sendMessagePromise({type:"lcards/fire_event",action:"reload"}),d.info("[ConnectivityTab] Broadcast page reload sent to all devices"),this._reloadSent="pages",setTimeout(()=>{this._reloadSent=null},2e3)}catch(a){d.warn("[ConnectivityTab] Failed to broadcast page reload:",a),this._error="Could not broadcast page reload: requires admin."}finally{this._saving=false}}}_handleRemoteConfigChange(){if(this._isDirty)this._remoteUpdatePending=true;else{const e=this._scopeInfoOpts();this._loadScopedValues(false,e).then(()=>{this._editConfig=this._buildEffectiveConfig()}).catch(()=>{})}}_applyRemoteUpdate(){this._isDirty=false,this._dirtyServiceKeys=new Set,this._remoteUpdatePending=false;const e=this._scopeInfoOpts();this._loadScopedValues(true,e).then(()=>{this._editConfig=this._buildEffectiveConfig()}).catch(()=>{})}_discardChanges(){var t;this._isDirty=false,this._dirtyServiceKeys=new Set,this._editConfig=this._buildEffectiveConfig();const e=this._editConfig;this._contentYaml=e.content?T.dump(e.content,{indent:2}):"",this._reconnectedContentYaml=(t=e.reconnected)!=null&&t.content?T.dump(e.reconnected.content,{indent:2}):""}_requestClearScope(){this._confirmClear=true}_cancelClearScope(){this._confirmClear=false}async _clearScopedValue(e){var s,i,n,l,c;const t=(i=(s=window.lcards)==null?void 0:s.core)==null?void 0:i.scopedSettingsService;if(!t)return;const a=this._scope,r=this._scopeInfoOpts();this._saving=true;try{await t.clear(e,a,r),this._scopedValues=null,await this._loadScopedValues(true,r),this._editConfig=this._buildEffectiveConfig();const h=this._editConfig;this._contentYaml=h.content?T.dump(h.content,{indent:2}):"",this._reconnectedContentYaml=(n=h.reconnected)!=null&&n.content?T.dump(h.reconnected.content,{indent:2}):"",await((c=(l=window.lcards)==null?void 0:l.connectionOverlay)==null?void 0:c.loadConfig())}catch(h){d.warn("[ConnectivityTab] Failed to clear field override:",h)}finally{this._saving=false}}_defaultConfig(){return{enabled:false,dismiss:true,position:"center",width:"auto",height:"auto",disconnect_delay_ms:2500,message:{text:"Connection Lost",color:"var(--error-color)",mode:"text",font:"Antonio",size:42,weight:"400",transform:"uppercase",borgLayers:{canvas:{preset:"borg-assimilation",siteCount:8,tendrilsPerSite:5,tendrilLength:600,particleCount:2,color:"var(--lcars-martian)",glowColor:"var(--lcards-yellow)"},backdrop:{preset:"saturate",amount:"200%"},color:{preset:"color-tint",color:"rgba(0,60,0,0.25)"},paletteHue:110,fontSwap:true}},reconnected:{enabled:true,text:"Connection Established",color:"var(--primary-color)",auto_dismiss_seconds:3,font:"Antonio",size:42,weight:"400",transform:"uppercase",content:null},layers:{backdrop:null,color:{preset:"color-tint",color:"rgba(0,0,0,0.55)"},canvas:{preset:"static",opacity:.55}},content:null}}_parseYamlContent(){var e;if(!((e=this._contentYaml)!=null&&e.trim()))return null;try{return T.load(this._contentYaml)}catch{return null}}_parseReconnectedYamlContent(){var e;if(!((e=this._reconnectedContentYaml)!=null&&e.trim()))return null;try{return T.load(this._reconnectedContentYaml)}catch{return null}}_handleTestShow(){var s,i,n,l,c,h,p,g,v,_;const e=((i=(s=this._editConfig)==null?void 0:s.message)==null?void 0:i.mode)??"text";if(e==="borg"){const m=Vt((l=(n=this._editConfig)==null?void 0:n.message)==null?void 0:l.borgLayers);(p=(h=(c=window.lcards)==null?void 0:c.core)==null?void 0:h.borgAssimilationManager)==null||p.assimilate(m),this._testActive=true;return}const t=e==="card"?this._parseYamlContent():null,a=e==="card"?this._parseReconnectedYamlContent():null,r={...this._editConfig,content:t,reconnected:{...((g=this._editConfig)==null?void 0:g.reconnected)??{},content:a}};(_=(v=window.lcards)==null?void 0:v.connectionOverlay)==null||_.showWith(r),this._testActive=true}_handleTestHide(){var t,a,r,s,i,n,l;if((((a=(t=this._editConfig)==null?void 0:t.message)==null?void 0:a.mode)??"text")==="borg"){(i=(s=(r=window.lcards)==null?void 0:r.core)==null?void 0:s.borgAssimilationManager)==null||i.deassimilate(),this._testActive=false;return}(l=(n=window.lcards)==null?void 0:n.connectionOverlay)==null||l.hide(),this._testActive=false}_handleTestReconnect(){var s,i,n,l,c,h,p,g;const e=((i=(s=this._editConfig)==null?void 0:s.message)==null?void 0:i.mode)??"text";if(e==="borg"){(c=(l=(n=window.lcards)==null?void 0:n.core)==null?void 0:l.borgAssimilationManager)==null||c.deassimilate(),this._testActive=false;return}const t=e==="card"?this._parseYamlContent():null,a=e==="card"?this._parseReconnectedYamlContent():null,r={...this._editConfig,content:t,reconnected:{...((h=this._editConfig)==null?void 0:h.reconnected)??{},content:a}};(g=(p=window.lcards)==null?void 0:p.connectionOverlay)==null||g.simulateReconnect(r)}_set(e,t){const a=e.split("."),r=JSON.parse(JSON.stringify(this._editConfig??this._defaultConfig()));let s=r;for(let n=0;n<a.length-1;n++)(s[a[n]]==null||typeof s[a[n]]!="object")&&(s[a[n]]={}),s=s[a[n]];s[a[a.length-1]]=t,this._editConfig=r,this._isDirty=true;const i=e.startsWith("layers")?Me:J2._PATH_TO_KEY[e]??null;i&&this._dirtyServiceKeys.add(i)}_buildSparseConfig(e,t,a){var g,v;const r=this._dirtyServiceKeys,s=e,i={},n=[[N,"enabled"],[re,"dismiss"],[Ie,"position"],[Re,"width"],[Pe,"height"],[ae,"disconnect_delay_ms"],[Me,"layers"]];for(const[_,m]of n)r.has(_)&&(i[m]=s[m]);r.has(ue)&&(i.content=t);const c=[[He,"mode"],[Te,"text"],[Ae,"color"],[ke,"font"],[Se,"size"],[Ce,"weight"],[$e,"transform"],[te,"borgLayers"]].filter(([_])=>r.has(_));if(c.length){i.message={};for(const[,_]of c)i.message[_]=(g=s.message)==null?void 0:g[_]}const p=[[z,"enabled"],[xe,"text"],[we,"color"],[U,"auto_dismiss_seconds"],[ye,"font"],[_e,"size"],[be,"weight"],[fe,"transform"]].filter(([_])=>r.has(_));if(p.length||r.has(ee)){i.reconnected={};for(const[,_]of p)i.reconnected[_]=(v=s.reconnected)==null?void 0:v[_];r.has(ee)&&(i.reconnected.content=a)}return i}_resolvePath(e){return e.split(".").reduce((t,a)=>t==null?void 0:t[a],this._editConfig)}_getLayerPreset(e,t="layers"){var a,r;return((r=(a=this._resolvePath(t))==null?void 0:a[e])==null?void 0:r.preset)??"__none__"}_getLayerParam(e,t,a="layers"){var r,s;return((s=(r=this._resolvePath(a))==null?void 0:r[e])==null?void 0:s[t])??""}_setLayerPreset(e,t,a="layers"){var r;if(t==="__none__")this._set(`${a}.${e}`,null);else{const s=((r=this._resolvePath(a))==null?void 0:r[e])??{};this._set(`${a}.${e}`,s.preset===t?s:{preset:t})}}_setLayerParam(e,t,a,r="layers"){var i;const s=((i=this._resolvePath(r))==null?void 0:i[e])??{};this._set(`${r}.${e}`,{...s,[t]:a})}async _handleScopeChange(e){var s;const t=e.detail??{},a=t.scope??"user";if(this._scopeChosen=true,this._scope=a,this._scopeInfo={scope:a,userId:t.userId??null,deviceId:t.deviceId??null,isAdminTarget:t.isAdminTarget??false},this._isDirty=false,this._dirtyServiceKeys=new Set,this._confirmClear=false,this._scopedValues=null,await this._loadScopedValues(true),!this.isConnected||!this._scopedValues||this._isDirty)return;this._editConfig=this._buildEffectiveConfig();const r=this._editConfig;this._contentYaml=r.content?T.dump(r.content,{indent:2}):"",this._reconnectedContentYaml=(s=r.reconnected)!=null&&s.content?T.dump(r.reconnected.content,{indent:2}):""}render(){var g,v,_,m,w,f,$,C,S,k,X;if(this._loading||!this._editConfig&&!this._error)return o`<div class="loading">Loading settings…</div>`;const e=this._editConfig??this._defaultConfig(),t=((g=e.message)==null?void 0:g.mode)??"text",a=((v=e.reconnected)==null?void 0:v.enabled)??false,r=this._scopedValues,s=this._scope,i=((_=this._scopeInfo)==null?void 0:_.isAdminTarget)??false,n=b(y=>{var x;return(((x=r==null?void 0:r[y])==null?void 0:x[s])??null)!==null},"hasOverride"),l=b(y=>{var x;return s!=="global"&&(((x=r==null?void 0:r[y])==null?void 0:x.global)??null)!==null},"hasGlobal"),c=b(y=>!r||this._scopedLoading?ge:n(y)?le(s,i):l(y)?le("global",i):ge,"fieldBadge"),h=b(y=>n(y)?o`<ha-icon-button
              .label=${"Clear override"}
              style="--ha-icon-button-size:32px; --mdc-icon-size:18px;"
              @click=${()=>this._clearScopedValue(y)}
            ><ha-icon icon="mdi:close-circle-outline"></ha-icon></ha-icon-button>`:ge,"fieldClearBtn"),p=De.some(y=>n(y));return o`
          <div class="studio-layout">

            ${this._error?o`
              <div class="banner warning">
                <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
                ${this._error}
              </div>
            `:""}

            ${this._remoteUpdatePending?o`
              <div class="banner info">
                <ha-icon icon="mdi:information-outline"></ha-icon>
                Settings were updated from another device.
                <ha-button @click=${this._applyRemoteUpdate}>Discard edits &amp; refresh</ha-button>
              </div>
            `:""}

          <div class="scrollable-body">

            <!-- ── Feature overview ──────────────────────────────────── -->
            <lcards-message type="info">
              Shows a full-screen overlay when the browser loses its connection to Home Assistant (useful for kiosks).
              Preview it with <em>Simulate Disconnect</em> at the bottom.
            </lcards-message>

            <!-- ── Scope selector ────────────────────────────────────── -->
            <lcards-scope-selector
              .hass=${this.hass}
              showGlobal
              ?disabled=${this._saving||this._loading}
              @scope-changed=${this._handleScopeChange}>
            </lcards-scope-selector>

            ${this._isDirty?o`
              <lcards-message type="warning">
                <strong>Unsaved changes</strong>: your edits won't take effect until you click <em>Save</em> below.
              </lcards-message>
            `:""}

            <!-- ── General ────────────────────────────────────────────── -->
            <lcards-form-section
              header="General"
              icon="mdi:wifi-off"
              ?expanded=${true}
              ?outlined=${true}>
              <div class="control-row">
                <ha-selector
                  .hass=${this.hass}
                  .label=${"Enable connection overlay"}
                  .helper=${"Show full-screen overlay when Home Assistant connection is lost"}
                  .selector=${{boolean:{}}}
                  .value=${e.enabled}
                  @value-changed=${y=>this._set("enabled",y.detail.value)}>
                </ha-selector>
                ${c(N)}
                ${h(N)}
              </div>
              <div class="control-row">
                <ha-selector
                  .hass=${this.hass}
                  .label=${"Allow user to dismiss"}
                  .helper=${"User can click the overlay backdrop to dismiss it"}
                  .selector=${{boolean:{}}}
                  .value=${e.dismiss}
                  @value-changed=${y=>this._set("dismiss",y.detail.value)}>
                </ha-selector>
                ${c(re)}
                ${h(re)}
              </div>
              <div class="control-row">
                <ha-selector
                  .hass=${this.hass}
                  .label=${"Disconnect tolerance (ms)"}
                  .helper=${"Delay before showing the overlay after a disconnect. Use 2000–5000 on mobile or unstable connections to avoid spurious triggers."}
                  .selector=${{number:{min:0,max:3e4,step:500,mode:"box",unit_of_measurement:"ms"}}}
                  .value=${e.disconnect_delay_ms??2500}
                  @value-changed=${y=>this._set("disconnect_delay_ms",y.detail.value)}>
                </ha-selector>
                ${c(ae)}
                ${h(ae)}
              </div>
            </lcards-form-section>

            <!-- ── Screen Overlay ────────────────────────────────────────────── -->
            <lcards-form-section
              header="Screen Overlay"
              icon="mdi:message-text-outline"
              ?expanded=${false}
              ?outlined=${true}>

              <!-- Mode selector -->
              <div class="control-row">
                <ha-selector
                  .hass=${this.hass}
                  .label=${"Display style"}
                  .helper=${"Simple text with basic styling controls; Custom card renders any Home Assistant card YAML"}
                  .selector=${{select:{mode:"dropdown",options:Zt}}}
                  .value=${t}
                  @value-changed=${y=>this._set("message.mode",y.detail.value)}>
                </ha-selector>
              </div>

              ${t==="borg"?o`

                <lcards-message type="info">
                  On disconnect the Borg assimilation sequence runs instead of the overlay, and reverses on reconnect.
                  Messages and custom cards aren't used.
                </lcards-message>

                ${this._renderSlotPanel("canvas","Canvas Effect","mdi:monitor-shimmer","message.borgLayers",{lockPreset:true})}
                ${this._renderSlotPanel("backdrop","Backdrop Filter","mdi:image-filter","message.borgLayers")}
                ${this._renderSlotPanel("color","Colour Tint","mdi:palette","message.borgLayers")}

                <lcards-form-section
                  header="Palette Hue"
                  icon="mdi:palette-swatch"
                  description="The UI colour palette is shifted toward this hue when assimilation is active. Default is 110° (Borg yellow-green)."
                  ?expanded=${true}
                  ?outlined=${true}>
                  <ha-selector
                    .hass=${this.hass}
                    .label=${"Palette hue (degrees)"}
                    .helper=${"0° = red · 60° = yellow · 110° = Borg green (default) · 180° = cyan · 240° = blue · 300° = magenta"}
                    .selector=${{number:{min:0,max:359,step:1,mode:"slider"}}}
                    .value=${((f=(w=(m=this._editConfig)==null?void 0:m.message)==null?void 0:w.borgLayers)==null?void 0:f.paletteHue)??110}
                    @value-changed=${y=>{this._set("message.borgLayers.paletteHue",y.detail.value)}}>
                  </ha-selector>
                </lcards-form-section>

                <lcards-form-section
                  header="Font Swap"
                  icon="mdi:format-font"
                  description="Replace the dashboard font with the Borg typeface during assimilation."
                  ?expanded=${true}
                  ?outlined=${true}>
                  <ha-selector
                    .hass=${this.hass}
                    .label=${"Enable Borg font replacement"}
                    .helper=${"When disabled, all other assimilation effects still run; only the font stays unchanged"}
                    .selector=${{boolean:{}}}
                    .value=${((S=(C=($=this._editConfig)==null?void 0:$.message)==null?void 0:C.borgLayers)==null?void 0:S.fontSwap)??true}
                    @value-changed=${y=>{this._set("message.borgLayers.fontSwap",y.detail.value)}}>
                  </ha-selector>
                </lcards-form-section>

              `:t==="text"?o`

                <!-- Text mode: Connection Lost subsection -->
                <lcards-form-section
                  header="Connection Lost"
                  icon="mdi:wifi-off"
                  description="Text and style shown when the connection is lost."
                  ?expanded=${true}
                  ?outlined=${true}>
                  ${this._renderTextStyleControls(mt,e.message,"#93e1ff",c,h)}
                </lcards-form-section>

                <!-- Text mode: Connection Restored subsection -->
                <lcards-form-section
                  header="Connection Restored"
                  icon="mdi:wifi-check"
                  description="Optional brief confirmation when the connection returns."
                  ?expanded=${a}
                  ?outlined=${true}>
                  <div class="control-row">
                    <ha-selector
                      .hass=${this.hass}
                      .label=${"Show reconnect message"}
                      .selector=${{boolean:{}}}
                      .value=${a}
                      @value-changed=${y=>this._set("reconnected.enabled",y.detail.value)}>
                    </ha-selector>
                    ${c(z)}
                    ${h(z)}
                  </div>
                  <div class="${a?"":"dimmed"}">
                    ${this._renderTextStyleControls(ta,e.reconnected,"#4caf50",c,h)}
                    <div class="control-row">
                      <ha-selector
                        .hass=${this.hass}
                        .label=${"Auto-dismiss after (seconds)"}
                        .helper=${"Overlay clears automatically after this many seconds"}
                        .selector=${{number:{min:1,max:30,step:1,mode:"box"}}}
                        .value=${((k=e.reconnected)==null?void 0:k.auto_dismiss_seconds)??3}
                        @value-changed=${y=>this._set("reconnected.auto_dismiss_seconds",y.detail.value)}>
                      </ha-selector>
                      ${c(U)}
                      ${h(U)}
                    </div>
                  </div>
                </lcards-form-section>

              `:o`

                <!-- Card mode: Connection Lost Card subsection -->
                <lcards-form-section
                  header="Connection Lost Card"
                  icon="mdi:wifi-off"
                  description="Any Home Assistant card shown when disconnected. Replaces the text message."
                  ?expanded=${true}
                  ?outlined=${true}>
                  ${this._contentYamlError?o`
                    <div class="banner warning" style="margin-bottom:8px">
                      <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
                      ${this._contentYamlError}
                    </div>
                  `:""}
                  <ha-code-editor
                    .hass=${this.hass}
                    .value=${this._contentYaml}
                    mode="yaml"
                    @value-changed=${y=>{this._contentYaml=y.detail.value,this._contentYamlError=null,this._isDirty=true,this._dirtyServiceKeys.add(ue)}}>
                  </ha-code-editor>
                  <div class="control-row" style="margin-top:12px">
                    <lcards-position-picker
                      .value=${e.position??"center"}
                      .label=${"Position"}
                      .helper=${"Where to anchor the card within the overlay"}
                      @value-changed=${y=>this._set("position",y.detail.value)}>
                    </lcards-position-picker>
                  </div>
                  <lcards-message type="info">
                    Layout cards (grids, stacks) may need a size here: CSS units such as 400px, 30vw or auto.
                  </lcards-message>
                  <div class="control-row">
                    <ha-selector
                      .hass=${this.hass}
                      .label=${"Width"}
                      .helper=${"CSS width: e.g. 400px, 40vw, auto"}
                      .selector=${{text:{}}}
                      .value=${e.width??"auto"}
                      @value-changed=${y=>this._set("width",y.detail.value)}>
                    </ha-selector>
                  </div>
                  <div class="control-row">
                    <ha-selector
                      .hass=${this.hass}
                      .label=${"Height"}
                      .helper=${"CSS height: e.g. 300px, 30vh, auto"}
                      .selector=${{text:{}}}
                      .value=${e.height??"auto"}
                      @value-changed=${y=>this._set("height",y.detail.value)}>
                    </ha-selector>
                  </div>
                </lcards-form-section>

                <!-- Card mode: Connection Restored Card subsection -->
                <lcards-form-section
                  header="Connection Restored Card"
                  icon="mdi:wifi-check"
                  description="Optional card shown briefly when the connection returns. Leave empty to fall back to a text message."
                  ?expanded=${a}
                  ?outlined=${true}>
                  <div class="control-row">
                    <ha-selector
                      .hass=${this.hass}
                      .label=${"Show reconnect message"}
                      .selector=${{boolean:{}}}
                      .value=${a}
                      @value-changed=${y=>this._set("reconnected.enabled",y.detail.value)}>
                    </ha-selector>
                    ${c(z)}
                    ${h(z)}
                  </div>
                  <div class="${a?"":"dimmed"}">
                    ${this._reconnectedContentYamlError?o`
                      <div class="banner warning" style="margin-bottom:8px">
                        <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
                        ${this._reconnectedContentYamlError}
                      </div>
                    `:""}
                    <ha-code-editor
                      .hass=${this.hass}
                      .value=${this._reconnectedContentYaml}
                      mode="yaml"
                      @value-changed=${y=>{this._reconnectedContentYaml=y.detail.value,this._reconnectedContentYamlError=null,this._isDirty=true,this._dirtyServiceKeys.add(ee)}}>
                    </ha-code-editor>
                    <div class="control-row" style="margin-top:12px">
                      <ha-selector
                        .hass=${this.hass}
                        .label=${"Auto-dismiss after (seconds)"}
                        .helper=${"Overlay clears automatically after this many seconds"}
                        .selector=${{number:{min:1,max:30,step:1,mode:"box"}}}
                        .value=${((X=e.reconnected)==null?void 0:X.auto_dismiss_seconds)??3}
                        @value-changed=${y=>this._set("reconnected.auto_dismiss_seconds",y.detail.value)}>
                      </ha-selector>
                      ${c(U)}
                      ${h(U)}
                    </div>
                  </div>
                </lcards-form-section>

              `}

            </lcards-form-section>

            <!-- ── Effect Layers ──────────────────────────────────────── -->
            ${t!=="borg"?o`
            <lcards-form-section
              header="Effect Layers"
              icon="mdi:layers-triple"
              description="Configure each effect layer independently. Leave a slot set to None to disable it."
              ?expanded=${false}
              ?outlined=${true}>
              <lcards-message type="info">
                <strong>Screen Effect Layers</strong>
                <p style="margin:8px 0 0 0; font-size: var(--ha-font-size-s); line-height:1.4;">
                  Configure the full-screen effect composition applied during disconnection.
                  Presets and parameters are loaded from the registered SEM catalog.
                </p>
              </lcards-message>
              ${this._renderSlotPanel("canvas","Canvas Effect","mdi:image-multiple")}
              ${this._renderSlotPanel("color","Colour Overlay","mdi:palette")}
              ${this._renderSlotPanel("backdrop","Backdrop Filter","mdi:blur")}
            </lcards-form-section>
            `:""}

            <!-- ── Test Controls ──────────────────────────────────────── -->
            <lcards-form-section
              header="Test Controls"
              icon="mdi:flask-outline"
              description="Trigger the overlay live to preview your current panel settings. No save required."
              ?expanded=${true}
              ?outlined=${true}>
              <div class="control-row">
                <ha-button
                  ?disabled=${this._testActive}
                  @click=${this._handleTestShow}>
                  <ha-icon slot="icon" icon="mdi:wifi-off"></ha-icon>
                  Simulate Disconnect
                </ha-button>
                <ha-button
                  @click=${this._handleTestReconnect}>
                  <ha-icon slot="icon" icon="mdi:wifi"></ha-icon>
                  Simulate Reconnect
                </ha-button>
                <ha-button
                  @click=${this._handleTestHide}>
                  <ha-icon slot="icon" icon="mdi:close-circle-outline"></ha-icon>
                  Clear Test
                </ha-button>
              </div>
            </lcards-form-section>

            <!-- ── Actions ────────────────────────────────────────────── -->
            ${this._confirmClear?o`
              <div class="banner warning">
                <ha-icon icon="mdi:alert"></ha-icon>
                <span>This will remove <strong>all ${this._scopeInfo.scope}-scoped overrides</strong> for the connection overlay: fields will fall back to lower scopes. Are you sure?</span>
                <div class="confirm-actions">
                  <ha-button variant="danger" ?disabled=${this._saving} @click=${this._resetScope}>
                    ${this._saving?"Resetting…":"Yes, reset all"}
                  </ha-button>
                  <ha-button appearance="plain" ?disabled=${this._saving} @click=${this._cancelClearScope}>Cancel</ha-button>
                </div>
              </div>
            `:""}
            <div class="action-row">
              <ha-button
                variant="danger"
                ?disabled=${this._saving||!p||this._confirmClear}
                title="Remove all stored overrides at this scope; fields fall back to lower scopes"
                @click=${this._requestClearScope}>
                <ha-icon slot="icon" icon="mdi:delete-sweep-outline"></ha-icon>
                Reset ${this._scopeInfo.scope}
              </ha-button>
              <ha-button
                ?disabled=${this._saving||!this._isDirty}
                title="Discard unsaved changes and revert to stored values"
                @click=${this._discardChanges}>
                <ha-icon slot="icon" icon="mdi:undo"></ha-icon>
                Discard changes
              </ha-button>
              <ha-button
                ?disabled=${this._saving||!this._isDirty}
                @click=${this._saveConfig}>
                ${this._saving?"Saving…":`Save (${this._scopeInfo.scope})`}
              </ha-button>
              <ha-button
                ?disabled=${this._saving||this._reloadSent==="config"}
                title="Push current stored config to all connected browsers"
                @click=${this._reloadAllDevices}>
                <ha-icon slot="icon" icon=${this._reloadSent==="config"?"mdi:check":"mdi:refresh-auto"}></ha-icon>
                ${this._reloadSent==="config"?"Sent!":"Push Live Config"}
              </ha-button>
              <ha-button
                variant="warning"
                ?disabled=${this._saving||this._reloadSent==="pages"}
                title="Force a full page reload on all connected browsers (disruptive)"
                @click=${this._reloadAllPages}>
                <ha-icon slot="icon" icon=${this._reloadSent==="pages"?"mdi:check":"mdi:reload-alert"}></ha-icon>
                ${this._reloadSent==="pages"?"Sent!":"Reload All Clients"}
              </ha-button>
            </div>

          </div></div>
        `}_getSlotPresets(e){var t,a;return(((a=(t=window.lcards)==null?void 0:t.screenEffect)==null?void 0:a.catalog())??[]).filter(r=>r.slot===e)}_renderSlotPanel(e,t,a,r="layers",{lockPreset:s=false}={}){var h;const i=this._getSlotPresets(e),n=this._getLayerPreset(e,r),l=i.find(p=>p.name===n),c=[{value:"__none__",label:"None (disabled)"},...i.map(p=>({value:p.name,label:p.label??p.name}))];return o`
          <lcards-form-section
            header=${t}
            icon=${a}
            ?expanded=${!!n&&n!=="__none__"}
            ?outlined=${true}>
            ${s?o`
              <lcards-message type="info">
                Configure settings for the <strong>${n}</strong> screen effect.  Lower settings may be required for some devices.
              </lcards-message>
            `:o`
              ${Nt(n,o`
                <ha-selector
                  .hass=${this.hass}
                  .label=${"Effect Preset"}
                  .selector=${{select:{mode:"dropdown",options:c}}}
                  .value=${n}
                  @value-changed=${p=>this._setLayerPreset(e,p.detail.value,r)}>
                </ha-selector>
              `)}
            `}

            ${(h=l==null?void 0:l.params_schema)!=null&&h.length?o`
              ${l.params_schema.map(p=>{var g;return this._renderParamField({spec:p,value:this._getLayerParam(e,p.key,r),fallback:((g=l.defaults)==null?void 0:g[p.key])??p.placeholder,onChange:b(v=>this._setLayerParam(e,p.key,v,r),"onChange")})})}
            `:""}

          </lcards-form-section>
        `}_renderParamField({spec:e,value:t,fallback:a,onChange:r}){if(e.type==="number"){const i=typeof t=="number"?t:typeof a=="number"?a:e.min??0;return o`
              <ha-selector
                .hass=${this.hass}
                .label=${e.label}
                .helper=${e.helper??""}
                .selector=${{number:{min:e.min??0,max:e.max??1,step:e.step??.1,mode:"slider"}}}
                .value=${i}
                @value-changed=${n=>r(n.detail.value)}>
              </ha-selector>
            `}if(e.type==="boolean")return o`
            <ha-selector
                .hass=${this.hass}
                .label=${e.label}
                .helper=${e.helper??""}
                .selector=${{boolean:{}}}
                .value=${typeof t=="boolean"?t:a!==false}
                @value-changed=${i=>r(i.detail.value)}>
            </ha-selector>
            `;if(e.type==="select")return o`
            <ha-selector
                .hass=${this.hass}
                .label=${e.label}
                .helper=${e.helper??""}
                .selector=${{select:{mode:"dropdown",options:e.options??[]}}}
                .value=${t??a??""}
                @value-changed=${i=>r(i.detail.value||void 0)}>
            </ha-selector>
            `;const s=t!=null&&t!==void 0?String(t):a!=null&&a!==void 0?String(a):"";return e.type==="color-text"?o`
              <div class="color-field">
                <div class="field-label">${e.label}</div>
                <lcards-color-picker
                  .hass=${this.hass}
                  .value=${s}
                  .showPreview=${true}
                  @value-changed=${i=>r(i.detail.value||void 0)}>
                </lcards-color-picker>
                ${e.helper?o`
                  <div style="font-size: var(--ha-font-size-s);color:var(--secondary-text-color);margin-top:2px;">
                    ${e.helper}
                  </div>`:""}
              </div>
            `:o`
          <ha-selector
            .hass=${this.hass}
            .label=${e.label}
            .helper=${e.helper??(e.placeholder?`e.g. ${e.placeholder}`:"")}
            .selector=${{text:{}}}
            .value=${s}
            @value-changed=${i=>r(i.detail.value||void 0)}>
          </ha-selector>
        `}_renderTextStyleControls(e,t,a="#93e1ff",r,s){const i=e===mt?"message":"reconnected";return o`
          <div class="control-row">
            <ha-selector
              .hass=${this.hass}
              .label=${"Message text"}
              .selector=${{text:{}}}
              .value=${(t==null?void 0:t.text)??""}
              @value-changed=${n=>this._set(`${i}.text`,n.detail.value)}>
            </ha-selector>
            ${r(e.text)}
            ${s(e.text)}
          </div>
          <div class="color-field">
            <div class="field-label-row">
              <div class="field-label">Text colour</div>
              ${r(e.color)}
              ${s(e.color)}
            </div>
            <lcards-color-picker
              .hass=${this.hass}
              .value=${(t==null?void 0:t.color)??a}
              .showPreview=${true}
              @value-changed=${n=>this._set(`${i}.color`,n.detail.value)}>
            </lcards-color-picker>
          </div>
          <div class="font-field">
            <lcards-font-selector
              .hass=${this.hass}
              label="Font"
              .value=${(t==null?void 0:t.font)??"Antonio"}
              .showPreview=${true}
              @value-changed=${n=>this._set(`${i}.font`,n.detail.value)}>
            </lcards-font-selector>
            <div class="field-badge-row">
              ${r(e.font)}
              ${s(e.font)}
            </div>
          </div>
          <div class="typo-row">
            <div class="typo-cell">
              <ha-selector
                .hass=${this.hass}
                .label=${"Size"}
                .selector=${{number:{min:1,max:200,step:1,mode:"box",unit_of_measurement:"px"}}}
                .value=${(t==null?void 0:t.size)??26}
                @value-changed=${n=>this._set(`${i}.size`,n.detail.value)}>
              </ha-selector>
              <div class="field-badge-row">
                ${r(e.size)}
                ${s(e.size)}
              </div>
            </div>
            <div class="typo-cell">
              <ha-selector
                .hass=${this.hass}
                .label=${"Weight"}
                .helper=${"e.g. 400, 700, bold, lighter"}
                .selector=${{text:{}}}
                .value=${(t==null?void 0:t.weight)??"400"}
                @value-changed=${n=>this._set(`${i}.weight`,n.detail.value)}>
              </ha-selector>
              <div class="field-badge-row">
                ${r(e.weight)}
                ${s(e.weight)}
              </div>
            </div>
            <div class="typo-cell">
              <ha-selector
                .hass=${this.hass}
                .label=${"Transform"}
                .selector=${{select:{mode:"dropdown",options:ea}}}
                .value=${(t==null?void 0:t.transform)??"uppercase"}
                @value-changed=${n=>this._set(`${i}.transform`,n.detail.value)}>
              </ha-selector>
              <div class="field-badge-row">
                ${r(e.transform)}
                ${s(e.transform)}
              </div>
            </div>
          </div>
        `}static get styles(){return[R,H`
            :host {
                flex: 1;
                display: flex;
                flex-direction: column;
                min-height: 0;
                overflow: hidden;
            }



            /* Re-establish spacing between form sections nested inside a parent section. */
            lcards-form-section lcards-form-section {
                --lcards-section-spacing: 12px;
            }

            .banner {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                border-radius: var(--ha-border-radius-md);
                font-size: 0.9em;
            }

            .dimmed {
                opacity: 0.5;
                pointer-events: none;
            }

            .control-row {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 8px 0;
                border-bottom: var(--ha-border-width-sm) solid color-mix(in srgb, var(--divider-color) 50%, transparent);
            }
            .control-row:last-child { border-bottom: none; }
            .control-row ha-selector { flex: 1; }

            .action-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 12px;
                padding: 8px 0;
            }

            .confirm-actions {
                display: flex;
                gap: 8px;
                margin-left: auto;
                flex-shrink: 0;
            }

            .loading {
                padding: 2rem;
                text-align: center;
                color: var(--secondary-text-color);
            }

            ha-code-editor {
                display: block;
                border-radius: 6px;
                overflow: hidden;
            }

            .color-field {
                padding: 8px 0;
                border-bottom: var(--ha-border-width-sm) solid color-mix(in srgb, var(--divider-color) 50%, transparent);
            }
            .color-field:last-child { border-bottom: none; }

            .font-field {
                padding: 8px 0;
                border-bottom: var(--ha-border-width-sm) solid color-mix(in srgb, var(--divider-color) 50%, transparent);
            }

            .typo-row {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 8px;
                padding: 8px 0;
                border-bottom: var(--ha-border-width-sm) solid color-mix(in srgb, var(--divider-color) 50%, transparent);
            }
            .typo-row:last-child { border-bottom: none; }

            .field-label {
                font-size: var(--ha-font-size-s);
                font-weight: 500;
                color: var(--secondary-text-color);
                margin-bottom: 4px;
                padding: 0 2px;
            }

            /* Label row: label text + scope badge + clear button inline */
            .field-label-row {
                display: flex;
                align-items: center;
                gap: 6px;
                flex-wrap: wrap;
                margin-bottom: 4px;
                padding: 0 2px;
            }
            .field-label-row .field-label {
                margin-bottom: 0;
            }

            /* Badge + clear button row beneath a standalone control (font, typo cells) */
            .field-badge-row {
                display: flex;
                align-items: center;
                gap: 4px;
                min-height: 20px;
                margin-top: 2px;
                padding: 0 2px;
            }

            /* Wrapper for each cell in the 2×2 typography grid */
            .typo-cell {
                display: flex;
                flex-direction: column;
            }
        `]}};b(J,"LCARdSConnectivityTab"),A(J,"properties",{hass:{type:Object},_scope:{type:String,state:true},_scopeInfo:{type:Object,state:true},_editConfig:{type:Object,state:true},_contentYaml:{type:String,state:true},_contentYamlError:{type:String,state:true},_loading:{type:Boolean,state:true},_saving:{type:Boolean,state:true},_error:{type:String,state:true},_testActive:{type:Boolean,state:true},_reconnectedContentYaml:{type:String,state:true},_reconnectedContentYamlError:{type:String,state:true},_scopedValues:{type:Object,state:true},_scopedLoading:{type:Boolean,state:true},_isDirty:{type:Boolean,state:true},_confirmClear:{type:Boolean,state:true},_remoteUpdatePending:{type:Boolean,state:true},_reloadSent:{type:String,state:true}}),A(J,"_PATH_TO_KEY",{enabled:N,dismiss:re,position:Ie,width:Re,height:Pe,disconnect_delay_ms:ae,content:ue,"message.mode":He,"message.text":Te,"message.color":Ae,"message.font":ke,"message.size":Se,"message.weight":Ce,"message.transform":$e,"message.borgLayers":te,"message.borgLayers.paletteHue":te,"message.borgLayers.fontSwap":te,"reconnected.enabled":z,"reconnected.text":xe,"reconnected.color":we,"reconnected.auto_dismiss_seconds":U,"reconnected.font":ye,"reconnected.size":_e,"reconnected.weight":be,"reconnected.transform":fe,"reconnected.content":ee});let Qe=J;customElements.get("lcards-connectivity-tab")||customElements.define("lcards-connectivity-tab",Qe);const aa={alert_system:"mdi:alert-octagon-outline",ha_lcars_theme:"mdi:palette-outline",sound:"mdi:volume-high"},Y=class Y2 extends M{constructor(){super(),this.hass=void 0,this._selectedTab=Y2.TAB_NAMES[new URLSearchParams(window.location.search).get("tab")??""]??0,this._helpers=[],this._missingHelpers=[],this._createInProgress=false,this._filterText="",this._initialLoadDone=false,this._selectedCategory="all",this._expandedCategories=new Set,this._helperSubscriptions=[]}willUpdate(e){var t,a,r;super.willUpdate(e),e.has("hass")&&this.hass&&((t=window.lcards)!=null&&t.core&&(d.debug("[ConfigPanel] Propagating hass to Core via initialize()"),window.lcards.core.initialize(this.hass).catch(s=>{d.warn("[ConfigPanel] Core initialize error:",s)})),(r=(a=window.lcards)==null?void 0:a.core)!=null&&r.helperManager&&(d.debug("[ConfigPanel] Propagating hass to HelperManager"),window.lcards.core.helperManager.updateHass(this.hass),this._initialLoadDone||(this._initialLoadDone=true,setTimeout(()=>this._loadHelperStatus(),100))))}connectedCallback(){var t,a,r,s;super.connectedCallback(),this._visibilityHandler=()=>{document.visibilityState==="visible"&&this.requestUpdate()},document.addEventListener("visibilitychange",this._visibilityHandler),(a=(t=window.lcards)==null?void 0:t.core)!=null&&a.helperManager||(d.warn("[ConfigPanel] LCARdS core not yet loaded"),setTimeout(()=>{var i,n;(n=(i=window.lcards)==null?void 0:i.core)!=null&&n.helperManager||this._showWarning("LCARdS core did not initialize. Hard-refresh the browser (Ctrl+Shift+R). If this persists, check Settings → Integrations → LCARdS.")},2e3)),this._loadHelperStatus(),this._subscribeToHelperChanges();const e=(s=(r=window.lcards)==null?void 0:r.core)==null?void 0:s.integrationService;e&&(e.isReady?e.refreshOptions():e.onReady()).then(()=>this.requestUpdate()),d.debug("[ConfigPanel] Panel connected")}disconnectedCallback(){super.disconnectedCallback(),this._visibilityHandler&&(document.removeEventListener("visibilitychange",this._visibilityHandler),this._visibilityHandler=null),this._helperSubscriptions.forEach(e=>e()),this._helperSubscriptions=[],d.debug("[ConfigPanel] Panel disconnected, cleaned up subscriptions")}_subscribeToHelperChanges(){var t,a;if(!((a=(t=window.lcards)==null?void 0:t.core)!=null&&a.helperManager))return;const e=window.lcards.core.helperManager;this._helpers.forEach(r=>{const s=e.subscribeToHelper(r.key,i=>{const n=this._helpers.findIndex(l=>l.key===r.key);n>=0&&(this._helpers[n]={...this._helpers[n],currentValue:i},this.requestUpdate())});this._helperSubscriptions.push(s)}),d.debug(`[ConfigPanel] Subscribed to ${this._helperSubscriptions.length} helper state changes`)}async _loadHelperStatus(){var t,a;if(!this.hass||!((a=(t=window.lcards)==null?void 0:t.core)!=null&&a.helperManager)){d.warn("[ConfigPanel] HASS or HelperManager not available");return}const e=window.lcards.core.helperManager;this._helpers=e.getAllHelpers().map(r=>({...r,exists:e.helperExists(r.key),currentValue:e.getHelperValue(r.key)})),this._missingHelpers=e.getMissingHelpers(),d.debug("[ConfigPanel] Loaded helper status:",{total:this._helpers.length,missing:this._missingHelpers.length}),this._helperSubscriptions.forEach(r=>r()),this._helperSubscriptions=[],this._subscribeToHelperChanges()}async _createAllHelpers(){var t,a;if(!((a=(t=window.lcards)==null?void 0:t.core)!=null&&a.helperManager)){this._showError("Helper Manager not available");return}this._createInProgress=true;const e=window.lcards.core.helperManager;try{const r=await e.ensureAllHelpers();r.created>0&&this._showSuccess(`Created ${r.created} helper(s)`),r.failed>0&&this._showError(`Failed to create ${r.failed} helper(s)`),await this._loadHelperStatus()}catch(r){d.error("[ConfigPanel] Failed to create helpers:",r),this._showError(`Error: ${r.message}`)}finally{this._createInProgress=false}}async _createHelper(e){var a,r;if(!((r=(a=window.lcards)==null?void 0:a.core)!=null&&r.helperManager))return;const t=window.lcards.core.helperManager;try{await t.ensureHelper(e),this._showSuccess(`Created helper: ${e}`),await new Promise(s=>setTimeout(s,500)),await this._loadHelperStatus(),this.requestUpdate()}catch(s){d.error(`[ConfigPanel] Failed to create helper ${e}:`,s),this._showError(`Failed to create ${e}: ${s.message}`)}}async _resetCategoryToDefaults(e){var a,r;if(!((r=(a=window.lcards)==null?void 0:a.core)!=null&&r.helperManager)){this._showError("Helper Manager not available");return}const t=window.lcards.core.helperManager;try{const s=await t.resetCategoryToDefaults(e);s.success>0?this._showSuccess(`Reset ${s.success} helper(s) to defaults`):s.skipped>0&&s.failed===0&&this._showSuccess("All helpers already at defaults (or none exist yet)"),s.failed>0&&this._showError(`Failed to reset ${s.failed} helper(s)`),await this._loadHelperStatus(),this.requestUpdate()}catch(s){d.error("[ConfigPanel] Failed to reset category to defaults:",s),this._showError(`Error: ${s.message}`)}}async _setHelperValue(e,t){var s,i;if(!((i=(s=window.lcards)==null?void 0:s.core)!=null&&i.helperManager))return;const a=window.lcards.core.helperManager,r=this._helpers.find(n=>n.key===e);try{if((r==null?void 0:r.domain)==="input_boolean"){const n=t?"turn_on":"turn_off";d.debug(`[ConfigPanel] Calling input_boolean.${n} for ${r.entity_id} (value: ${t})`),await this.hass.callService("input_boolean",n,{entity_id:r.entity_id}),setTimeout(()=>this._loadHelperStatus(),300)}else await a.setHelperValue(e,t),d.debug(`[ConfigPanel] Set helper value: ${e} = ${t}`)}catch(n){d.error("[ConfigPanel] Failed to set helper value:",n),this._showError(`Failed to set value: ${n.message}`)}}_showSuccess(e){d.info(`[ConfigPanel] Success: ${e}`),this.dispatchEvent(new CustomEvent("hass-notification",{detail:{message:e},bubbles:true,composed:true}))}_showError(e){d.error(`[ConfigPanel] Error: ${e}`),this.dispatchEvent(new CustomEvent("hass-notification",{detail:{message:`Error: ${e}`},bubbles:true,composed:true}))}_showWarning(e){d.warn(`[ConfigPanel] Warning: ${e}`),this.dispatchEvent(new CustomEvent("hass-notification",{detail:{message:`Warning: ${e}`},bubbles:true,composed:true}))}_showMoreInfo(e){this.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:e},bubbles:true,composed:true}))}_getVersion(){var e;return((e=window.lcards)==null?void 0:e.version)??""}render(){const e=this._getVersion();return o`
      <div class="panel-container">
        <div class="header">
          <img
            class="banner-logo"
            src=${Ue("/lcards/brand/icon@2x.png")}
            alt="LCARdS"
            @error=${t=>{t.target.style.display="none"}}
          />
          <div class="banner-content">
            <div class="banner-title">LCARdS</div>
            <div class="banner-subtitle">LCARS Card System for Home Assistant</div>
          </div>
          <div class="banner-version">${e?o`v${e}`:""}</div>
        </div>

        <ha-tab-group @wa-tab-show=${this._handleTabChange}>
          <ha-tab-group-tab value="0" ?active=${this._selectedTab===0}>
            <ha-icon icon="mdi:information-outline"></ha-icon>
            Welcome
          </ha-tab-group-tab>
          <ha-tab-group-tab value="1" ?active=${this._selectedTab===1}>
            <ha-icon icon="mdi:cog"></ha-icon>
            Helpers
          </ha-tab-group-tab>
          <ha-tab-group-tab value="2" ?active=${this._selectedTab===2}>
            <ha-icon icon="mdi:palette-swatch"></ha-icon>
            Theme Studio
          </ha-tab-group-tab>
          <ha-tab-group-tab value="3" ?active=${this._selectedTab===3}>
            <ha-icon icon="mdi:wifi-off"></ha-icon>
            Connectivity
          </ha-tab-group-tab>
          <ha-tab-group-tab value="4" ?active=${this._selectedTab===4}>
            <ha-icon icon="mdi:volume-high"></ha-icon>
            Sounds
          </ha-tab-group-tab>
          <ha-tab-group-tab value="5" ?active=${this._selectedTab===5}>
            <ha-icon icon="mdi:account-multiple-outline"></ha-icon>
            Users & Devices
          </ha-tab-group-tab>
          <ha-tab-group-tab value="6" ?active=${this._selectedTab===6}>
            <ha-icon icon="mdi:package-variant"></ha-icon>
            Pack Explorer
          </ha-tab-group-tab>
          ${this._isAdmin()?o`
          <ha-tab-group-tab value="7" ?active=${this._selectedTab===7}>
            <ha-icon icon="mdi:database-cog"></ha-icon>
            Storage
          </ha-tab-group-tab>
          `:""}
          ${this._isDevFeaturesEnabled()?o`
          <ha-tab-group-tab value="8" ?active=${this._selectedTab===8}>
            <ha-icon icon="mdi:view-grid-plus-outline"></ha-icon>
            Layouts
          </ha-tab-group-tab>
          `:""}
        </ha-tab-group>

        <div class="tab-content">
          ${it[this._selectedTab]?o`
            <div class="tab-docs">
              <a href=${oe(it[this._selectedTab])} target="_blank" rel="noopener noreferrer">
                Docs<ha-icon icon="mdi:open-in-new"></ha-icon>
              </a>
            </div>
          `:""}
          ${this._renderTabContent()}
        </div>
      </div>
    `}_handleTabChange(e){var a;const t=(a=e.target.activeTab)==null?void 0:a.getAttribute("value");t!=null&&(this._selectedTab=parseInt(t,10),this.requestUpdate())}_isAdmin(){var e,t;return((t=(e=this.hass)==null?void 0:e.user)==null?void 0:t.is_admin)===true}_isDevFeaturesEnabled(){return new URLSearchParams(window.location.search).get("lcards_dev_features")==="true"}_renderTabContent(){switch(this._selectedTab){case 0:return this._renderAboutTab();case 1:return this._renderHelpersTab();case 2:return this._renderThemeBrowserTab();case 3:return this._renderConnectivityTab();case 4:return this._renderSoundTab();case 5:return this._renderUsersDevicesTab();case 6:return this._renderPackExplorerTab();case 7:return this._isAdmin()?this._renderStorageTab():o``;case 8:return this._isDevFeaturesEnabled()?this._renderLayoutsTab():o``;default:return o`<div>Unknown tab</div>`}}_renderConnectivityTab(){return o`
      <lcards-connectivity-tab
        .hass=${this.hass}
      ></lcards-connectivity-tab>
    `}_renderAboutTab(){return o`
      <div class="studio-layout">
        <lcards-about-tab
          .hass=${this.hass}
          @lcards-navigate-tab=${e=>{this._selectedTab=e.detail.tab,this.requestUpdate()}}
        ></lcards-about-tab>
      </div>
    `}_renderHelpersTab(){let e=this._helpers;if(this._filterText){const r=this._filterText.toLowerCase();e=e.filter(s=>s.name.toLowerCase().includes(r)||s.description.toLowerCase().includes(r)||s.key.toLowerCase().includes(r)||s.entity_id.toLowerCase().includes(r))}this._selectedCategory!=="all"&&(e=e.filter(r=>(r.category||"other")===this._selectedCategory));const t=e.reduce((r,s)=>{const i=s.category||"other";return r[i]||(r[i]=[]),r[i].push(s),r},{}),a={alert_system:"Alert Lab Configuration",ha_lcars_theme:"HA-LCARS Theme Settings",sound:"Sound System",other:"Other"};return o`
      <div class="studio-layout">
        ${this._missingHelpers.length>0?o`
          <div class="banner warning">
            <ha-icon icon="mdi:alert-circle"></ha-icon>
            <span class="banner-text">
              ${this._missingHelpers.length} helper${this._missingHelpers.length>1?"s are":" is"} missing in Home Assistant.
              Create them all here, or one at a time from the tables below.
            </span>
            <ha-button
              @click=${this._createAllHelpers}
              ?disabled=${this._createInProgress}>
              ${this._createInProgress?o`<ha-spinner slot="start" size="small"></ha-spinner>`:o`<ha-icon slot="start" icon="mdi:plus-circle"></ha-icon>`}
              Create All
            </ha-button>
          </div>
        `:""}

        <div class="search-container">
          <ha-input-search
            appearance="outlined"
            placeholder="Search helpers"
            .value=${this._filterText}
            @input=${r=>{this._filterText=r.target.value??""}}
            @wa-clear=${()=>{this._filterText=""}}>
          </ha-input-search>
          ${this._filterText?o`
            <span class="hint">Showing ${e.length} of ${this._helpers.length}</span>
          `:""}
        </div>

        ${this._renderCategoryFilters()}

        <div class="scrollable-body">
        ${Object.entries(t).length>0?Object.entries(t).map(([r,s])=>{const i=this._helpers.filter(c=>(c.category||"other")===r),n=i.filter(c=>c.exists).length,l=i.length;return o`
            <lcards-form-section
              header=${a[r]||r}
              icon=${aa[r]||"mdi:cog"}
              secondary=${`${n} / ${l} created`}
              ?expanded=${this._expandedCategories.has(r)}
              ?outlined=${true}
              @expanded-changed=${c=>this._setCategoryExpanded(r,c.detail.expanded)}>
              <div class="category-actions">
                <ha-button
                  appearance="plain"
                  @click=${()=>this._resetCategoryToDefaults(r)}
                  title="Reset all helpers in this section to their registry default values">
                  <ha-icon slot="start" icon="mdi:restore"></ha-icon>
                  Reset to Defaults
                </ha-button>
              </div>
              <table class="helper-table">
                <thead>
                  <tr>
                    <th class="col-icon"></th>
                    <th>Helper</th>
                    <th>Entity ID</th>
                    <th class="col-status">Status</th>
                    <th>Value</th>
                    <th class="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${s.map(c=>this._renderHelperRow(c))}
                </tbody>
              </table>
            </lcards-form-section>
          `}):""}

        ${e.length===0&&this._filterText?o`
          <div class="empty-state">
            <ha-icon icon="mdi:filter-off"></ha-icon>
            <p>No helpers match "${this._filterText}"</p>
            <p class="hint">Try a different search term or category.</p>
          </div>
        `:""}

        ${this._helpers.length===0&&!this._filterText?o`
          <div class="empty-state">
            <ha-spinner size="small"></ha-spinner>
            <p>Loading helpers</p>
          </div>
        `:""}
        </div>
      </div>
    `}_renderCategoryFilters(){const e=this._helpers.reduce((a,r)=>{const s=r.category||"other";return a[s]=(a[s]||0)+1,a},{}),t=[{id:"all",label:"All",count:this._helpers.length},{id:"alert_system",label:"Alert Lab",count:e.alert_system||0},{id:"ha_lcars_theme",label:"HA-LCARS Theme",count:e.ha_lcars_theme||0},{id:"sound",label:"Sounds",count:e.sound||0}];return ne({className:"category-filters",options:t.map(a=>({value:a.id,label:`${a.label} (${a.count})`})),selected:this._selectedCategory,onSelect:b(a=>{this._selectedCategory=a},"onSelect")})}_setCategoryExpanded(e,t){const a=new Set(this._expandedCategories);t?a.add(e):a.delete(e),this._expandedCategories=a}_renderHelperRow(e){return o`
      <tr>
        <td>
          <ha-icon class="helper-icon" icon="${e.icon||"mdi:cog"}"></ha-icon>
        </td>
        <td>
          <div class="helper-name">${e.name}</div>
          <div class="helper-description">${e.description}</div>
        </td>
        <td>
          <span class="helper-entity-id">${e.entity_id}</span>
        </td>
        <td>
          <ha-assist-chip
            .label=${e.exists?"Exists":"Missing"}
            .type=${e.exists?"filled":"outlined"}
            .filled=${true}
            style="
              --ha-assist-chip-filled-container-color: ${e.exists?"var(--success-color)":"var(--error-color)"};
              --ha-assist-chip-label-text-color: white;
            "
          >
            <ha-icon icon="${e.exists?"mdi:check-circle":"mdi:alert-circle"}" slot="icon"></ha-icon>
          </ha-assist-chip>
        </td>
        <td>
          ${e.exists?this._renderValueControl(e):"-"}
        </td>
        <td>
          ${e.exists?o`
            <ha-button
              @click=${()=>this._showMoreInfo(e.entity_id)}
            >
              <ha-icon slot="start" icon="mdi:magnify"></ha-icon>
              Inspect
            </ha-button>
          `:e.ws_create_params!==null?o`
            <ha-button
              @click=${()=>this._createHelper(e.key)}
            >
              <ha-icon slot="start" icon="mdi:plus"></ha-icon>
              Create
            </ha-button>
          `:o`
            <span class="manual-setup">Manual setup required</span>
          `}
        </td>
      </tr>
    `}_renderValueControl(e){var t,a,r,s,i,n;if(e.domain==="input_select"){const l=(a=(t=this.hass)==null?void 0:t.states)==null?void 0:a[e.entity_id],c=(l==null?void 0:l.state)||e.currentValue,h=((r=l==null?void 0:l.attributes)==null?void 0:r.options)??e.ws_create_params.options??[];return o`
        <ha-selector
          .hass=${this.hass}
          .selector=${{select:{options:h.map(p=>({value:p,label:p})),mode:"dropdown"}}}
          .value=${c}
          @value-changed=${p=>this._setHelperValue(e.key,p.detail.value)}
        ></ha-selector>
      `}else{if(e.domain==="input_number")return o`
        <ha-selector
          .hass=${this.hass}
          .selector=${{number:{min:e.ws_create_params.min,max:e.ws_create_params.max,step:e.ws_create_params.step,mode:"box",unit_of_measurement:e.ws_create_params.unit_of_measurement}}}
          .value=${e.currentValue}
          @value-changed=${l=>this._setHelperValue(e.key,l.detail.value)}
        ></ha-selector>
      `;if(e.domain==="input_boolean"){const l=((n=(i=(s=this.hass)==null?void 0:s.states)==null?void 0:i[e.entity_id])==null?void 0:n.state)??e.currentValue;return o`
        <ha-selector
          .hass=${this.hass}
          .selector=${{boolean:{}}}
          .value=${l==="on"}
          @value-changed=${c=>{c.stopPropagation();const h=c.detail.value;d.debug("[ConfigPanel] Boolean selector changed:",{key:e.key,newValue:h,detail:c.detail}),this._setHelperValue(e.key,h)}}
        ></ha-selector>
      `}}return e.currentValue}_renderSoundTab(){return o`
      <lcards-sound-config-tab
        .hass=${this.hass}
      ></lcards-sound-config-tab>
    `}_renderThemeBrowserTab(){return o`
      <lcards-theme-token-browser-tab
        .hass=${this.hass}
        ._dialogOpen=${true}
        ._inlineMode=${true}
      ></lcards-theme-token-browser-tab>
    `}_renderUsersDevicesTab(){return o`
      <lcards-users-devices-tab
        .hass=${this.hass}
      ></lcards-users-devices-tab>
    `}_renderStorageTab(){return o`
      <lcards-storage-explorer-tab
        .hass=${this.hass}
      ></lcards-storage-explorer-tab>
    `}_renderPackExplorerTab(){return o`
      <lcards-pack-explorer-tab
        .hass=${this.hass}
      ></lcards-pack-explorer-tab>
    `}_renderLayoutsTab(){return o`
      <lcards-layouts-tab
        .hass=${this.hass}
      ></lcards-layouts-tab>
    `}};b(Y,"LCARdSConfigPanel"),A(Y,"TAB_NAMES",{welcome:0,helpers:1,theme:2,connectivity:3,sounds:4,users:5,packs:6,storage:7,layouts:8}),A(Y,"properties",{hass:{type:Object},narrow:{type:Boolean},panel:{type:Object},_selectedTab:{type:Number,state:true},_helpers:{type:Array,state:true},_missingHelpers:{type:Array,state:true},_createInProgress:{type:Boolean,state:true},_filterText:{type:String,state:true},_initialLoadDone:{type:Boolean,state:true},_selectedCategory:{type:String,state:true},_expandedCategories:{type:Set,state:true}}),A(Y,"styles",[R,H`
    :host {
      display: block;
      height: 100vh;
      background: var(--primary-background-color);
      overflow: hidden;
      /* HA's panel typography (haStyle): without it text inherits the page's
         hardcoded Roboto while HA controls follow the theme font. */
      font-family: var(--ha-font-family-body);
      -webkit-font-smoothing: var(--ha-font-smoothing);
      -moz-osx-font-smoothing: var(--ha-moz-osx-font-smoothing);
      font-size: var(--ha-font-size-m);
      font-weight: var(--ha-font-weight-normal);
      line-height: var(--ha-line-height-normal);
    }

    .panel-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      margin: 0 auto;
      background-color: var(--lcars-ui-primary, var(--card-background-color, #1b4f8a));
    }

    .header {
      display: flex;
      align-items: center;
      gap: 0;
      background: var(--lcars-ui-primary, #1b4f8a);
      overflow: hidden;
      min-height: 68px;
      flex-shrink: 0;
    }

    .banner-logo {
      height: 52px;
      width: auto;
      margin: 0 16px 0 12px;
      flex-shrink: 0;
      object-fit: contain;
    }

    .banner-content {
      flex: 1;
      padding: 14px 20px;
    }

    .banner-title {
      font-size: 2em;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: var(--lcards-moonlight);
      line-height: 1;
      text-transform: uppercase;
      font-family: var(--lcars-font), var(--lcars-fallback-font), 'Antonio', sans-serif;
    }

    .banner-subtitle {
      font-size: 0.82em;
      color: var(--secondary-text-color);
      margin-top: 3px;
      letter-spacing: 0.04em;
    }

    .banner-version {
      padding: 0 20px;
      font-size: 0.95em;
      font-weight: 600;
      color: var(--secondary-text-color);
      letter-spacing: 0.1em;
      white-space: nowrap;
      font-family: var(--lcars-font), var(--lcars-fallback-font), 'Antonio', sans-serif;
    }

    /* HA Native Tab Styling */
    ha-tab-group {
      display: block;
      margin: 0;
      border-bottom: 2px solid var(--divider-color);
      background: var(--card-background-color);
      flex-shrink: 0;
      border-top-left-radius: 17px;
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
    ha-tab-group-tab ha-icon {
      --mdc-icon-size: 18px;
      margin-right: 8px;
    }

    .tab-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: var(--ha-space-2);
      min-height: 0;
      background: var(--secondary-background-color);
    }

    .helper-table {
      width: 100%;
      border-collapse: collapse;
    }

    .helper-table th,
    .helper-table td {
      padding: var(--ha-space-2);
      text-align: left;
      border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
      color: var(--primary-text-color);
    }

    .helper-table th {
      font-weight: var(--ha-font-weight-bold, 600);
    }

    .helper-table tr:hover td {
      background: color-mix(in srgb, var(--secondary-background-color) 50%, transparent);
    }

    .col-icon { width: 40px; }
    .col-status { width: 120px; }
    .col-actions { width: 100px; }

    .helper-icon {
      color: var(--primary-color);
    }

    .helper-name {
      font-weight: var(--ha-font-weight-medium, 500);
    }

    .helper-entity-id {
      font-family: var(--ha-font-family-code);
      font-size: 0.9em;
      color: var(--secondary-text-color);
    }

    .helper-description {
      color: var(--secondary-text-color);
      font-size: 0.9em;
      margin-top: var(--ha-space-1);
    }

    .manual-setup {
      font-size: var(--ha-font-size-s);
      color: var(--secondary-text-color);
      font-style: italic;
    }

    .helper-value {
      display: flex;
      align-items: center;
      gap: var(--ha-space-2);
    }

    /* Helpers tab: missing-helpers banner, search, category chips */
    .studio-layout > .banner {
      margin-bottom: var(--ha-space-3);
    }

    .banner-text {
      flex: 1;
    }

    .search-container {
      display: flex;
      align-items: center;
      gap: var(--ha-space-3);
      margin-bottom: var(--ha-space-3);
    }

    .search-container ha-input-search {
      flex: 1;
    }

    .category-filters {
      margin-bottom: var(--ha-space-3);
    }

    .category-actions {
      display: flex;
      justify-content: flex-end;
      padding-bottom: var(--ha-space-2);
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--ha-space-2);
      padding: var(--ha-space-12) var(--ha-space-6);
      text-align: center;
      color: var(--secondary-text-color);
    }

    .empty-state ha-icon {
      --mdc-icon-size: 48px;
      opacity: 0.5;
    }

    .empty-state p {
      margin: 0;
    }
  `]);let Ee=Y;customElements.get("lcards-config-panel-impl")||customElements.define("lcards-config-panel-impl",Ee);const la=Object.freeze(Object.defineProperty({__proto__:null,LCARdSConfigPanel:Ee},Symbol.toStringTag,{value:"Module"}));export{zt as L,la as l,ne as r};
//# sourceMappingURL=lcards-config-panel-CDNvTdS2.js.map
