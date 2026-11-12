var x=Object.defineProperty;var f=(w,e)=>x(w,"name",{value:e,configurable:true});import{i as k,db as b,dc as z,dd as $,W as m,de as T,df as C,dg as S,dh as y,di as E,dj as L,dk as O,dl as R,l as q,b as c,a as W}from"./lcards-main-C148JfkA.js";const _=["backdrop","color","canvas"],v=class v2 extends k{static get properties(){return{hass:{attribute:false},config:{attribute:false},condition:{type:String},screenSize:{attribute:false},_dismissed:{state:true},_scale:{state:true},_screen:{state:true}}}constructor(){super(),this.hass=null,this.config=null,this.condition="red_alert",this.screenSize=null,this._dismissed=false,this._scale=.5,this._screen={width:window.innerWidth||1600,height:window.innerHeight||900},this._cleanups=[],this._contentEl=null,this._syncToken=0,this._syncTimer=null,this._resizeObserver=null,this._onWindowResize=()=>{this.screenSize||(this._screen={width:window.innerWidth,height:window.innerHeight}),this._measure()}}connectedCallback(){super.connectedCallback(),window.addEventListener("resize",this._onWindowResize),this._resizeObserver=new ResizeObserver(()=>this._measure()),this.updateComplete.then(()=>{var s;const e=this.renderRoot.querySelector(".frame");e&&((s=this._resizeObserver)==null||s.observe(e))})}disconnectedCallback(){var e;window.removeEventListener("resize",this._onWindowResize),(e=this._resizeObserver)==null||e.disconnect(),this._resizeObserver=null,this._syncTimer&&clearTimeout(this._syncTimer),this._clear(),super.disconnectedCallback()}setConfig(e){this.config=e}replay(){this._dismissed=false,this._scheduleSync(0)}_measure(){const e=this.renderRoot.querySelector(".frame");e!=null&&e.clientWidth&&(this._scale=e.clientWidth/this._screen.width)}willUpdate(e){e.has("condition")&&(this._dismissed=false),e.has("screenSize")&&this.screenSize&&(this._screen={...this.screenSize})}updated(e){e.has("_screen")&&this._measure(),e.has("config")||e.has("condition")||e.has("_dismissed")?this._scheduleSync(e.has("condition")?0:150):e.has("hass")&&this._contentEl&&this.hass&&b(this._contentEl,this.hass,"alert-preview")}_scheduleSync(e){this._syncTimer&&clearTimeout(this._syncTimer),this._syncTimer=setTimeout(()=>{this._syncTimer=null,this._sync()},e)}_clear(){var e;for(const s of this._cleanups)try{s()}catch{}this._cleanups=[],(e=this._contentEl)==null||e.remove(),this._contentEl=null;for(const s of _){const t=this.renderRoot.querySelector(`.layer-${s}`);t&&(t.replaceChildren(),t.removeAttribute("style"),t instanceof HTMLCanvasElement&&(t.width=1,t.height=1))}}async _sync(){const e=++this._syncToken;this._clear();const s=this.config??{},t=this.condition;if(this._dismissed)return;const n=z(s,t);if(!n)return;const o=await $(n,this.hass);if(e!==this._syncToken)return;const i=m(s,t)==="band",h=i?T(s,t):C(s,t);this._enterLayers(h);const a=this.renderRoot.querySelector(".content"),d=this.renderRoot.querySelector(".wrap");if(!a||!d)return;const l=i?{type:"custom:lcards-alert-band",condition:t,band:S(s,t),emblem:o}:o,g=y[i?"top-left":E(s,t)]??y.center,p=i?{width:"100%",height:"100%"}:L(s,t);d.style.alignItems=g.alignItems,d.style.justifyContent=g.justifyContent,a.style.width=p.width,a.style.height=p.height,a.classList.toggle("auto-height",p.height==="auto"),a.classList.toggle("pass-through",i);const r=await O(l.type,"alert-preview");if(e!==this._syncToken||!r){r==null||r.remove();return}this._contentEl=r,a.appendChild(r),this.hass&&b(r,this.hass,"alert-preview"),await R(r,l,"alert-preview")}_enterLayers(e){var t,n;const s=(n=(t=window.lcards)==null?void 0:t.core)==null?void 0:n.screenEffectManager;if(!(!e||!s))for(const o of _){const i=e[o];if(!(i!=null&&i.preset))continue;const h=this.renderRoot.querySelector(`.layer-${o}`);if(!h)continue;const{preset:a,...d}=i,l=s.enterPreset(h,a,d);l?this._cleanups.push(l):q.debug(`[AlertPreview] Layer '${a}' not shown in the preview`)}}_onBackdropClick(){m(this.config,this.condition)==="overlay"&&(this._dismissed=true)}_onBandDismiss(e){e.stopPropagation(),this._dismissed=true}render(){const{width:e,height:s}=this._screen;return c`
            <div class="frame" style="aspect-ratio: ${e} / ${s}; width: min(100cqw, calc(100cqh * ${e/s}))">
                <div class="screen" style="width: ${e}px; height: ${s}px; transform: scale(${this._scale})"
                    @lcards-alert-band-dismiss=${this._onBandDismiss}>
                    ${this._renderDashboard()}
                    <div class="dismiss-target" @click=${this._onBackdropClick}></div>
                    <div class="layer layer-backdrop"></div>
                    <div class="layer layer-color"></div>
                    <!-- The canvas presets draw into a <canvas>, as in the real overlay's canvas slot.
                         Their sizes are screen pixels (line height, grain, block size), so the canvas
                         is drawn at the size shown, not shrunk with the screen (3 px scanlines would
                         blur into grey): a box the frame's size, scaled back up inside the screen. -->
                    <div class="canvas-box" style="width: ${e*this._scale}px; height: ${s*this._scale}px; transform: scale(${1/this._scale})">
                        <canvas class="layer layer-canvas" width="1" height="1"></canvas>
                    </div>
                    <div class="wrap"><div class="content"></div></div>
                </div>
                ${this._dismissed?c`
                    <div class="dismissed">
                        <span>Dismissed</span>
                        <ha-button size="s" @click=${()=>this.replay()}>
                            <ha-icon icon="mdi:replay" slot="start"></ha-icon>
                            Show again
                        </ha-button>
                    </div>`:""}
            </div>
        `}_renderDashboard(){return c`
            <div class="dash" aria-hidden="true">
                <div class="dash-top"><div class="elbow"></div><div class="bar b1"></div><div class="bar b2"></div><div class="bar b3"></div></div>
                <div class="dash-side">
                    ${[1,2,3,4,5,6].map(e=>c`<div class="pill p${e%3}"></div>`)}
                </div>
                <div class="dash-main">
                    ${[1,2,3,4,5,6].map(e=>c`<div class="panel"><div class="panel-head h${e%3}"></div><div class="panel-body"></div></div>`)}
                </div>
            </div>
        `}static get styles(){return W`
            /* Fills its box (the studio's preview stage); the frame fits inside it at the screen's aspect ratio */
            :host {
                display: flex;
                align-items: center;
                justify-content: center;
                container-type: size;
            }
            .frame {
                position: relative;
                flex: none;
                overflow: hidden;
                border-radius: var(--ha-border-radius-md);
                border: var(--ha-border-width-sm) solid var(--divider-color);
                background: var(--primary-background-color);
            }
            .screen {
                position: absolute;
                top: 0;
                left: 0;
                transform-origin: 0 0;
                overflow: hidden;
                background: var(--primary-background-color);
            }
            .dash {
                position: absolute;
                inset: 0;
                display: grid;
                grid-template-columns: 220px 1fr;
                grid-template-rows: 120px 1fr;
                gap: 16px;
                padding: 24px;
            }
            .dash-top {
                grid-column: 1 / -1;
                display: flex;
                gap: 8px;
                align-items: flex-start;
            }
            .elbow {
                width: 220px;
                height: 100px;
                border-top-left-radius: 70px;
                background: var(--lcards-orange);
            }
            .bar {
                height: 32px;
                border-radius: 0 var(--ha-border-radius-pill) var(--ha-border-radius-pill) 0;
            }
            .b1 { flex: 2; background: var(--lcards-blue); }
            .b2 { flex: 1; background: var(--lcards-orange); }
            .b3 { flex: 3; background: var(--lcards-gray); }
            .dash-side {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .pill {
                height: 56px;
                border-radius: var(--ha-border-radius-pill);
            }
            .p0 { background: var(--lcards-orange); }
            .p1 { background: var(--lcards-blue); }
            .p2 { background: var(--lcards-gray); }
            .dash-main {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 16px;
                align-content: start;
            }
            .panel {
                height: 220px;
                border-radius: var(--ha-border-radius-lg);
                border: var(--ha-border-width-md) solid var(--lcards-gray);
                overflow: hidden;
            }
            .panel-head { height: 36px; }
            .h0 { background: var(--lcards-orange); }
            .h1 { background: var(--lcards-blue); }
            .h2 { background: var(--lcards-gray); }
            .canvas-box {
                position: absolute;
                top: 0;
                left: 0;
                transform-origin: 0 0;
                pointer-events: none;
            }
            .dismiss-target, .layer, .wrap {
                position: absolute;
                inset: 0;
            }
            .layer { pointer-events: none; }
            /* As the real slot: the buffer size changes, the box stays the whole screen */
            canvas.layer {
                width: 100%;
                height: 100%;
            }
            .wrap {
                display: flex;
                pointer-events: none;
            }
            .content {
                display: flex;
                align-items: stretch;
                pointer-events: auto;
            }
            .content.pass-through { pointer-events: none; }
            /* As the portal: fill a definite box; with height auto keep the card's aspect ratio */
            .content > * {
                width: 100% !important;
                min-height: 0 !important;
            }
            .content:not(.auto-height) > * {
                height: 100% !important;
                aspect-ratio: unset !important;
            }
            .content.auto-height > * {
                height: auto !important;
            }
            .dismissed {
                position: absolute;
                inset: 0;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: var(--ha-space-2);
                color: var(--secondary-text-color);
            }
        `}};f(v,"LCARdSAlertPreview");let u=v;customElements.get("lcards-alert-preview")||customElements.define("lcards-alert-preview",u);export{u as LCARdSAlertPreview};
//# sourceMappingURL=lcards-alert-preview-Bceo6KGC.js.map
