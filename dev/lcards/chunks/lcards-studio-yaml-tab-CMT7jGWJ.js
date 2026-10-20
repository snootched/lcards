var r=Object.defineProperty;var n=(o,e)=>r(o,"name",{value:e,configurable:true});import{i as h,a as c,b as l,l as g}from"./lcards-main-C10Twmlb.js";import{c as d,y as p}from"./lcards-yaml-editor-kz8qT51r.js";import"./lcards-message-BMG6miXA.js";const a=class a2 extends h{static get properties(){return{hass:{type:Object},config:{type:Object},schema:{type:Object},cardType:{type:String},note:{type:String},_text:{type:String,state:true}}}constructor(){super(),this.hass=null,this.config=null,this.schema=null,this.cardType="",this.note="",this._text="",this._lastJson=null,this._echoPending=false}static get styles(){return c`
            :host {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-3);
            }
        `}willUpdate(e){if(!e.has("config"))return;const t=JSON.stringify(this.config??{}),s=this._echoPending;this._echoPending=false,t!==this._lastJson&&(this._lastJson=t,!s&&(this._text=d(this.config??{})))}render(){return l`
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
        `}_onChange(e){e.stopPropagation();let t;try{t=p(e.detail.value)}catch(s){g.debug("[StudioYamlTab] YAML does not parse yet; not applied",s==null?void 0:s.message);return}!t||typeof t!="object"||Array.isArray(t)||(this._text=e.detail.value,this._lastJson=JSON.stringify(t),this._echoPending=true,this.dispatchEvent(new CustomEvent("yaml-config-changed",{detail:{config:t}})))}};n(a,"LCARdSStudioYamlTab");let i=a;customElements.get("lcards-studio-yaml-tab")||customElements.define("lcards-studio-yaml-tab",i);
//# sourceMappingURL=lcards-studio-yaml-tab-CMT7jGWJ.js.map
