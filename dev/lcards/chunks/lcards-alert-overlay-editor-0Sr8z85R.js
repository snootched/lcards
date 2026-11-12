var f=Object.defineProperty;var c=(h,t)=>f(h,"name",{value:t,configurable:true});import{V as d,W as u,r as m,D as b,b as g,m as y,a as _}from"./lcards-main-C148JfkA.js";import{a as v,f as k}from"./LCARdSBaseEditor-B4auBUbY.js";import{c as w}from"./yaml-docs-links-UEyTsmzQ.js";import"./lcards-message-CF99Ox_M.js";const S={dismiss:"Dismiss (hide only)",reset:"Reset to green alert","auto-dismiss":"Auto-dismiss","auto-reset":"Auto-reset to green alert"},p=class p2 extends v{constructor(){super(),this.cardType="alert-overlay",this._studio=null}updated(t){super.updated(t),t.has("hass")&&this._studio&&(this._studio.hass=this.hass)}setConfig(t){const e=this._stripLegacyKeys(t);super.setConfig(e)}_stripLegacyKeys(t){if(!t||typeof t!="object")return t;const e=["backdrop_effect","backdrop_params"],s={...t};for(const i of e)delete s[i];if("backdrop"in s&&(typeof s.backdrop!="object"||s.backdrop===null)&&delete s.backdrop,s.conditions&&typeof s.conditions=="object"){const i={};for(const[n,a]of Object.entries(s.conditions))if(a&&typeof a=="object"){const o={...a};for(const r of e)delete o[r];"backdrop"in o&&(typeof o.backdrop!="object"||o.backdrop===null)&&delete o.backdrop,i[n]=o}else i[n]=a;s.conditions=i}return s}_getTabDefinitions(){return[{label:"Configuration",content:c(()=>this._renderConfigurationTab(),"content")},...this._getUtilityTabs()]}_renderConfigurationTab(){const t=this.config??{},e=d.filter(a=>u(t,a)==="band").length,s=d.filter(a=>{var o,r;return(r=(o=t.conditions)==null?void 0:o[a])==null?void 0:r.content}).length,i=e===0?"Overlay":e===d.length?"Band":`Overlay, band for ${e}`,n=S[t.dismiss_mode??"dismiss"]??t.dismiss_mode;return g`
            <div class="info-card">
                <div class="info-card-content">
                    <h3>Alert Studio</h3>
                    <p>
                        <strong>Full-screen workspace</strong> with a mock screen that shows each alert condition:
                        the alert symbol or your card, or the band, with its size, position and screen effects.
                        The preview never changes the alert mode.
                    </p>
                    <div class="alert-stats">
                        <span><b>${i}</b></span>
                        <span><b>${n}</b></span>
                        <span><b>${s}</b> custom card${s===1?"":"s"}</span>
                    </div>
                </div>
                <div class="info-card-actions">
                    <ha-button @click=${this._openAlertStudio}>
                        <ha-icon icon="mdi:alert-rhombus-outline" slot="start"></ha-icon>
                        Open Alert Studio
                    </ha-button>
                    <ha-button appearance="plain" @click=${()=>window.open(m(b.alertOverlay),"_blank","noopener")}>
                        Docs
                        <ha-icon icon="mdi:open-in-new" slot="end"></ha-icon>
                    </ha-button>
                </div>
            </div>
            <lcards-message type="info">
                Shows while <code>input_select.lcards_alert_mode</code> is an alert (red, yellow, blue, black or gray).
                Add one per dashboard; it takes no space on the dashboard.
            </lcards-message>
        `}async _openAlertStudio(){await import("./lcards-alert-overlay-studio-dialog-ConKidju.js");const t=document.createElement("lcards-alert-overlay-studio-dialog");t.hass=this.hass,t.config=JSON.parse(JSON.stringify(this.config||{})),this._studio=t,t.addEventListener("config-changed",e=>{this.config=e.detail.config,this._isUpdatingYaml=true,this._yamlValue=w(this.config),requestAnimationFrame(()=>{this._isUpdatingYaml=false}),k(this,"config-changed",{config:this.config}),this.requestUpdate()}),t.addEventListener("closed",()=>{t.remove(),this._studio===t&&(this._studio=null)}),y(t,this)}static get styles(){return[...super.styles,_`
                .alert-stats { display: flex; flex-wrap: wrap; gap: var(--ha-space-4); margin: var(--ha-space-2) 0 var(--ha-space-1); font-size: 13px; color: var(--primary-text-color); }
                .alert-stats b { color: var(--lcars-ui-primary, var(--primary-color)); }
            `]}};c(p,"LCARdSAlertOverlayEditor");let l=p;customElements.get("lcards-alert-overlay-editor")||customElements.define("lcards-alert-overlay-editor",l);export{l as LCARdSAlertOverlayEditor};
//# sourceMappingURL=lcards-alert-overlay-editor-0Sr8z85R.js.map
