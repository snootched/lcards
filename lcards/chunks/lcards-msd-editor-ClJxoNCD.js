var jt=Object.defineProperty;var Vi=(n3,e,t)=>e in n3?jt(n3,e,{enumerable:true,configurable:true,writable:true,value:t}):n3[e]=t;var u=(n3,e)=>jt(n3,"name",{value:e,configurable:true});var ct=(n3,e,t)=>Vi(n3,typeof e!="symbol"?e+"":e,t);import{z as Wi,B as Yi,i as At,a as nt,b as v,w as ht,l as m,m as je,O as Zt,D as Jt,F as Xi,S as me,R as Kt,L as Gi}from"./lcards-main-OH3P_lk4.js";import{s as ji,a as Zi,L as ie,f as Ji}from"./studio-dialog-styles-CwIh7T_l.js";import{c as Ki}from"./lcards-yaml-editor-BhWzVC3x.js";import{e as Qi,m as eo,s as to,i as io,r as fe}from"./lcards-message-DltBJ-tU.js";import"./lcards-form-section-CBBDqzr-.js";import{R as oo}from"./docs-links-BWj3kMUR.js";import"./lcards-filter-editor-BkLaAOv5.js";import"./lcards-background-animation-editor-COyo4GEe.js";import"./lcards-studio-yaml-tab-BawoHhTg.js";/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const It=class It2 extends Wi{};u(It,"t");let Le=It;Le.directiveName="unsafeSVG",Le.resultType=2;const we=Yi(Le),no="50,8 62,14 58,26 74,22 68,36 88,38 76,48 90,58 72,60 78,78 60,68 54,90 46,68 28,78 34,60 16,58 30,48 18,38 38,36 32,22 48,26",so="50,8 74,22 88,38 78,78 54,90 28,78 16,58 32,22",ro="50,10 68,16 84,32 90,55 78,78 55,90 25,80 12,55 20,30",it=class it2 extends At{render(){return v`
            <div class="diagram-row">
                <div class="diagram-cell">
                    ${this._renderShape(no,false)}
                    <span class="diagram-label">Raw trace<br>(many points)</span>
                </div>
                <div class="diagram-cell">
                    ${this._renderShape(so,false)}
                    <span class="diagram-label">Simplified<br>(tolerance ↑)</span>
                </div>
                <div class="diagram-cell">
                    ${this._renderShape(ro,true)}
                    <span class="diagram-label">Roundness ↑<br>(toward ellipse)</span>
                </div>
            </div>
        `}_renderShape(e,t){const i=e.split(" ").map(o=>o.split(",").map(Number));return ht`
            <svg viewBox="0 0 100 100">
                ${t?ht`<ellipse class="ellipse-target" cx="50" cy="50" rx="40" ry="42" />`:""}
                <polygon class="outline" points="${e}" />
                ${i.map(([o,s])=>ht`<circle class="vertex" cx="${o}" cy="${s}" r="2.5" />`)}
            </svg>
        `}};u(it,"LCARdSShieldBubbleDiagram"),ct(it,"styles",nt`
        :host {
            display: block;
            padding: var(--ha-space-2) 0;
        }
        .diagram-row {
            display: flex;
            gap: var(--ha-space-4);
            justify-content: center;
            flex-wrap: wrap;
        }
        .diagram-cell {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--ha-space-1);
        }
        .diagram-cell svg {
            width: 100px;
            height: 100px;
        }
        .diagram-label {
            font-size: 11px;
            color: var(--secondary-text-color);
            text-align: center;
            line-height: 1.3;
        }
        .outline {
            fill: rgba(255, 159, 10, 0.15);
            stroke: #FF9F0A;
            stroke-width: 2;
        }
        .vertex {
            fill: #FF9F0A;
        }
        .ellipse-target {
            fill: none;
            stroke: var(--secondary-text-color);
            stroke-width: 1;
            stroke-dasharray: 3, 3;
        }
    `);let mt=it;customElements.get("lcards-shield-bubble-diagram")||customElements.define("lcards-shield-bubble-diagram",mt);const ot=class ot2 extends At{constructor(){super(),this.hass=null,this.config=null,this.showRefreshButton=true,this._renderKey=0,this._debounceTimer=null}static get styles(){return nt`
            :host {
                display: block;
                height: 100%;
            }

            .preview-container {
                display: flex;
                flex-direction: column;
                height: 100%;
                background: var(--secondary-background-color, #fafafa);
                border-radius: 8px;
                overflow: hidden;
            }

            .preview-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0px 16px;
                background: var(--card-background-color, white);
                border-bottom: var(--ha-border-width-md) solid var(--divider-color, #e0e0e0);
                font-weight: 600;
                font-size: 14px;
            }

            .preview-title {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .preview-card-container {
                flex: 1;
                padding: 16px;
                overflow: visible;  /* Allow zoomed content to extend beyond bounds */
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--primary-background-color, #fafafa);
            }

            .zoom-wrapper {
                width: 100%;
                height: 100%;
                transform-origin: 0 0;
            }

            lcards-msd-card {
                max-width: 100%;
                max-height: 100%;
                box-shadow: var(--ha-box-shadow-m);
                border-radius: 4px;
            }

            .preview-footer {
                padding: 8px 16px;
                background: var(--card-background-color, white);
                border-top: var(--ha-border-width-sm) solid var(--divider-color, #e0e0e0);
                font-size: 12px;
                color: var(--secondary-text-color, #727272);
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .preview-empty {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 48px 24px;
                color: var(--disabled-text-color, #9e9e9e);
                text-align: center;
                height: 100%;
            }

            .preview-empty ha-icon {
                --mdc-icon-size: 64px;
                margin-bottom: 16px;
            }

            .empty-message {
                font-size: 16px;
                font-weight: 500;
                margin: 0 0 8px 0;
            }

            .empty-helper {
                font-size: 14px;
                margin: 0;
            }

            .preview-error {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 48px 24px;
                color: var(--error-color, #ff0000);
                text-align: center;
                height: 100%;
            }

            .preview-error ha-icon {
                --mdc-icon-size: 64px;
                margin-bottom: 16px;
            }

            .error-message {
                font-size: 16px;
                font-weight: 500;
                margin: 0 0 8px 0;
            }

            .error-details {
                font-size: 14px;
                margin: 0;
                font-family: monospace;
            }
        `}firstUpdated(){super.firstUpdated(),this._updatePreviewCard()}updated(e){super.updated(e),(e.has("config")||e.has("hass"))&&this._schedulePreviewUpdate()}_schedulePreviewUpdate(){this._debounceTimer&&clearTimeout(this._debounceTimer),this._debounceTimer=setTimeout(()=>{this._renderKey++,this._updatePreviewCard(),this._debounceTimer=null,m.debug("[MSDLivePreview] Preview updated (debounced)")},300)}_forceRefresh(){this._debounceTimer&&(clearTimeout(this._debounceTimer),this._debounceTimer=null),this._renderKey++,this._updatePreviewCard(),m.debug("[MSDLivePreview] Preview refreshed (manual)")}_updatePreviewCard(){var i;const e=(i=this.shadowRoot)==null?void 0:i.querySelector(".preview-card-container");if(!e){m.warn("[MSDLivePreview] Card container not found");return}for(;e.firstChild;)e.firstChild.remove();if(!this._hasBaseSvg()){e.innerHTML=`
                <div class="preview-empty">
                    <ha-icon icon="mdi:image-off"></ha-icon>
                    <p class="empty-message">No base SVG configured</p>
                    <p class="empty-helper">
                        Configure a base SVG in the "Base SVG" tab to see the preview
                    </p>
                </div>
            `;return}const t=this._getPreviewConfig();if(!t){m.warn("[MSDLivePreview] No valid config for preview");return}try{const o=document.createElement("lcards-msd-card");m.debug("[MSDLivePreview] Creating preview card with config:",t),m.debug("[MSDLivePreview] HASS object available:",!!this.hass),o.setConfig(t),this.hass&&(o.hass=this.hass),e.appendChild(o),m.debug("[MSDLivePreview] Preview card configured and appended"),this._waitForPipelineReady(o).then(()=>{this.dispatchEvent(new CustomEvent("preview-ready",{bubbles:true,composed:true}))})}catch(o){m.error("[MSDLivePreview] Failed to update preview:",o),this._renderErrorInContainer(e,o)}}async _waitForPipelineReady(e,t=5e3){const i=Date.now();for(;!e._msdPipeline&&Date.now()-i<t&&(await e.updateComplete,!e._msdPipeline);)await new Promise(o=>setTimeout(o,50))}_renderErrorInContainer(e,t){e.innerHTML=`
            <div class="preview-error">
                <ha-icon icon="mdi:alert-circle"></ha-icon>
                <p class="error-message">Preview Error</p>
                <p class="error-details">${t.message}</p>
            </div>
        `}_getPreviewConfig(){const e=JSON.parse(JSON.stringify(this.config||{}));return e.msd||(e.msd={}),e}_hasBaseSvg(){var e,t;return!!((t=(e=this.config)==null?void 0:e.msd)!=null&&t.base_svg)}render(){return v`
            <div class="preview-container">
                <!-- Preview Card Container (populated by _updatePreviewCard) -->
                <!-- Parent .msd-zoom-wrapper provides CSS transform for zoom -->
                <div class="preview-card-container">
                </div>
            </div>
        `}};u(ot,"LCARdSMSDLivePreview"),ct(ot,"properties",{hass:{type:Object},config:{type:Object},showRefreshButton:{type:Boolean},_renderKey:{type:Number,state:true},_debounceTimer:{state:true}});let ft=ot;customElements.get("lcards-msd-live-preview")||customElements.define("lcards-msd-live-preview",ft);var ao={value:u(()=>{},"value")};function Pt(){for(var n3=0,e=arguments.length,t={},i;n3<e;++n3){if(!(i=arguments[n3]+"")||i in t||/[\s.]/.test(i))throw new Error("illegal type: "+i);t[i]=[]}return new We(t)}u(Pt,"dispatch");function We(n3){this._=n3}u(We,"Dispatch");function lo(n3,e){return n3.trim().split(/^|\s+/).map(function(t){var i="",o=t.indexOf(".");if(o>=0&&(i=t.slice(o+1),t=t.slice(0,o)),t&&!e.hasOwnProperty(t))throw new Error("unknown type: "+t);return{type:t,name:i}})}u(lo,"parseTypenames$1");We.prototype=Pt.prototype={constructor:We,on:u(function(n3,e){var t=this._,i=lo(n3+"",t),o,s=-1,r=i.length;if(arguments.length<2){for(;++s<r;)if((o=(n3=i[s]).type)&&(o=co(t[o],n3.name)))return o;return}if(e!=null&&typeof e!="function")throw new Error("invalid callback: "+e);for(;++s<r;)if(o=(n3=i[s]).type)t[o]=Qt(t[o],n3.name,e);else if(e==null)for(o in t)t[o]=Qt(t[o],n3.name,null);return this},"on"),copy:u(function(){var n3={},e=this._;for(var t in e)n3[t]=e[t].slice();return new We(n3)},"copy"),call:u(function(n3,e){if((o=arguments.length-2)>0)for(var t=new Array(o),i=0,o,s;i<o;++i)t[i]=arguments[i+2];if(!this._.hasOwnProperty(n3))throw new Error("unknown type: "+n3);for(s=this._[n3],i=0,o=s.length;i<o;++i)s[i].value.apply(e,t)},"call"),apply:u(function(n3,e,t){if(!this._.hasOwnProperty(n3))throw new Error("unknown type: "+n3);for(var i=this._[n3],o=0,s=i.length;o<s;++o)i[o].value.apply(e,t)},"apply")};function co(n3,e){for(var t=0,i=n3.length,o;t<i;++t)if((o=n3[t]).name===e)return o.value}u(co,"get$1");function Qt(n3,e,t){for(var i=0,o=n3.length;i<o;++i)if(n3[i].name===e){n3[i]=ao,n3=n3.slice(0,i).concat(n3.slice(i+1));break}return t!=null&&n3.push({name:e,value:t}),n3}u(Qt,"set$1");var _t="http://www.w3.org/1999/xhtml";const ei={svg:"http://www.w3.org/2000/svg",xhtml:_t,xlink:"http://www.w3.org/1999/xlink",xml:"http://www.w3.org/XML/1998/namespace",xmlns:"http://www.w3.org/2000/xmlns/"};function st(n3){var e=n3+="",t=e.indexOf(":");return t>=0&&(e=n3.slice(0,t))!=="xmlns"&&(n3=n3.slice(t+1)),ei.hasOwnProperty(e)?{space:ei[e],local:n3}:n3}u(st,"namespace");function ho(n3){return function(){var e=this.ownerDocument,t=this.namespaceURI;return t===_t&&e.documentElement.namespaceURI===_t?e.createElement(n3):e.createElementNS(t,n3)}}u(ho,"creatorInherit");function uo(n3){return function(){return this.ownerDocument.createElementNS(n3.space,n3.local)}}u(uo,"creatorFixed");function vi(n3){var e=st(n3);return(e.local?uo:ho)(e)}u(vi,"creator");function po(){}u(po,"none");function Et(n3){return n3==null?po:function(){return this.querySelector(n3)}}u(Et,"selector");function go(n3){typeof n3!="function"&&(n3=Et(n3));for(var e=this._groups,t=e.length,i=new Array(t),o=0;o<t;++o)for(var s=e[o],r=s.length,a=i[o]=new Array(r),l,c,d=0;d<r;++d)(l=s[d])&&(c=n3.call(l,l.__data__,d,s))&&("__data__"in l&&(c.__data__=l.__data__),a[d]=c);return new te(i,this._parents)}u(go,"selection_select");function mo(n3){return n3==null?[]:Array.isArray(n3)?n3:Array.from(n3)}u(mo,"array");function fo(){return[]}u(fo,"empty");function bi(n3){return n3==null?fo:function(){return this.querySelectorAll(n3)}}u(bi,"selectorAll");function _o(n3){return function(){return mo(n3.apply(this,arguments))}}u(_o,"arrayAll");function vo(n3){typeof n3=="function"?n3=_o(n3):n3=bi(n3);for(var e=this._groups,t=e.length,i=[],o=[],s=0;s<t;++s)for(var r=e[s],a=r.length,l,c=0;c<a;++c)(l=r[c])&&(i.push(n3.call(l,l.__data__,c,r)),o.push(l));return new te(i,o)}u(vo,"selection_selectAll");function yi(n3){return function(){return this.matches(n3)}}u(yi,"matcher");function wi(n3){return function(e){return e.matches(n3)}}u(wi,"childMatcher");var bo=Array.prototype.find;function yo(n3){return function(){return bo.call(this.children,n3)}}u(yo,"childFind");function wo(){return this.firstElementChild}u(wo,"childFirst");function xo(n3){return this.select(n3==null?wo:yo(typeof n3=="function"?n3:wi(n3)))}u(xo,"selection_selectChild");var So=Array.prototype.filter;function $o(){return Array.from(this.children)}u($o,"children");function Co(n3){return function(){return So.call(this.children,n3)}}u(Co,"childrenFilter");function ko(n3){return this.selectAll(n3==null?$o:Co(typeof n3=="function"?n3:wi(n3)))}u(ko,"selection_selectChildren");function Do(n3){typeof n3!="function"&&(n3=yi(n3));for(var e=this._groups,t=e.length,i=new Array(t),o=0;o<t;++o)for(var s=e[o],r=s.length,a=i[o]=[],l,c=0;c<r;++c)(l=s[c])&&n3.call(l,l.__data__,c,s)&&a.push(l);return new te(i,this._parents)}u(Do,"selection_filter");function xi(n3){return new Array(n3.length)}u(xi,"sparse");function Fo(){return new te(this._enter||this._groups.map(xi),this._parents)}u(Fo,"selection_enter");function Ze(n3,e){this.ownerDocument=n3.ownerDocument,this.namespaceURI=n3.namespaceURI,this._next=null,this._parent=n3,this.__data__=e}u(Ze,"EnterNode");Ze.prototype={constructor:Ze,appendChild:u(function(n3){return this._parent.insertBefore(n3,this._next)},"appendChild"),insertBefore:u(function(n3,e){return this._parent.insertBefore(n3,e)},"insertBefore"),querySelector:u(function(n3){return this._parent.querySelector(n3)},"querySelector"),querySelectorAll:u(function(n3){return this._parent.querySelectorAll(n3)},"querySelectorAll")};function Mo(n3){return function(){return n3}}u(Mo,"constant$2");function Ao(n3,e,t,i,o,s){for(var r=0,a,l=e.length,c=s.length;r<c;++r)(a=e[r])?(a.__data__=s[r],i[r]=a):t[r]=new Ze(n3,s[r]);for(;r<l;++r)(a=e[r])&&(o[r]=a)}u(Ao,"bindIndex");function Po(n3,e,t,i,o,s,r){var a,l,c=new Map,d=e.length,h=s.length,p=new Array(d),g;for(a=0;a<d;++a)(l=e[a])&&(p[a]=g=r.call(l,l.__data__,a,e)+"",c.has(g)?o[a]=l:c.set(g,l));for(a=0;a<h;++a)g=r.call(n3,s[a],a,s)+"",(l=c.get(g))?(i[a]=l,l.__data__=s[a],c.delete(g)):t[a]=new Ze(n3,s[a]);for(a=0;a<d;++a)(l=e[a])&&c.get(p[a])===l&&(o[a]=l)}u(Po,"bindKey");function Eo(n3){return n3.__data__}u(Eo,"datum");function Lo(n3,e){if(!arguments.length)return Array.from(this,Eo);var t=e?Po:Ao,i=this._parents,o=this._groups;typeof n3!="function"&&(n3=Mo(n3));for(var s=o.length,r=new Array(s),a=new Array(s),l=new Array(s),c=0;c<s;++c){var d=i[c],h=o[c],p=h.length,g=zo(n3.call(d,d&&d.__data__,c,i)),_=g.length,f=a[c]=new Array(_),y=r[c]=new Array(_),w=l[c]=new Array(p);t(d,h,f,y,w,g,e);for(var x=0,$=0,D,M;x<_;++x)if(D=f[x]){for(x>=$&&($=x+1);!(M=y[$])&&++$<_;);D._next=M||null}}return r=new te(r,i),r._enter=a,r._exit=l,r}u(Lo,"selection_data");function zo(n3){return typeof n3=="object"&&"length"in n3?n3:Array.from(n3)}u(zo,"arraylike");function Ro(){return new te(this._exit||this._groups.map(xi),this._parents)}u(Ro,"selection_exit");function To(n3,e,t){var i=this.enter(),o=this,s=this.exit();return typeof n3=="function"?(i=n3(i),i&&(i=i.selection())):i=i.append(n3+""),e!=null&&(o=e(o),o&&(o=o.selection())),t==null?s.remove():t(s),i&&o?i.merge(o).order():o}u(To,"selection_join");function Bo(n3){for(var e=n3.selection?n3.selection():n3,t=this._groups,i=e._groups,o=t.length,s=i.length,r=Math.min(o,s),a=new Array(o),l=0;l<r;++l)for(var c=t[l],d=i[l],h=c.length,p=a[l]=new Array(h),g,_=0;_<h;++_)(g=c[_]||d[_])&&(p[_]=g);for(;l<o;++l)a[l]=t[l];return new te(a,this._parents)}u(Bo,"selection_merge");function Uo(){for(var n3=this._groups,e=-1,t=n3.length;++e<t;)for(var i=n3[e],o=i.length-1,s=i[o],r;--o>=0;)(r=i[o])&&(s&&r.compareDocumentPosition(s)^4&&s.parentNode.insertBefore(r,s),s=r);return this}u(Uo,"selection_order");function Io(n3){n3||(n3=qo);function e(h,p){return h&&p?n3(h.__data__,p.__data__):!h-!p}u(e,"compareNode");for(var t=this._groups,i=t.length,o=new Array(i),s=0;s<i;++s){for(var r=t[s],a=r.length,l=o[s]=new Array(a),c,d=0;d<a;++d)(c=r[d])&&(l[d]=c);l.sort(e)}return new te(o,this._parents).order()}u(Io,"selection_sort");function qo(n3,e){return n3<e?-1:n3>e?1:n3>=e?0:NaN}u(qo,"ascending");function No(){var n3=arguments[0];return arguments[0]=this,n3.apply(null,arguments),this}u(No,"selection_call");function Oo(){return Array.from(this)}u(Oo,"selection_nodes");function Ho(){for(var n3=this._groups,e=0,t=n3.length;e<t;++e)for(var i=n3[e],o=0,s=i.length;o<s;++o){var r=i[o];if(r)return r}return null}u(Ho,"selection_node");function Vo(){let n3=0;for(const e of this)++n3;return n3}u(Vo,"selection_size");function Wo(){return!this.node()}u(Wo,"selection_empty");function Yo(n3){for(var e=this._groups,t=0,i=e.length;t<i;++t)for(var o=e[t],s=0,r=o.length,a;s<r;++s)(a=o[s])&&n3.call(a,a.__data__,s,o);return this}u(Yo,"selection_each");function Xo(n3){return function(){this.removeAttribute(n3)}}u(Xo,"attrRemove$1");function Go(n3){return function(){this.removeAttributeNS(n3.space,n3.local)}}u(Go,"attrRemoveNS$1");function jo(n3,e){return function(){this.setAttribute(n3,e)}}u(jo,"attrConstant$1");function Zo(n3,e){return function(){this.setAttributeNS(n3.space,n3.local,e)}}u(Zo,"attrConstantNS$1");function Jo(n3,e){return function(){var t=e.apply(this,arguments);t==null?this.removeAttribute(n3):this.setAttribute(n3,t)}}u(Jo,"attrFunction$1");function Ko(n3,e){return function(){var t=e.apply(this,arguments);t==null?this.removeAttributeNS(n3.space,n3.local):this.setAttributeNS(n3.space,n3.local,t)}}u(Ko,"attrFunctionNS$1");function Qo(n3,e){var t=st(n3);if(arguments.length<2){var i=this.node();return t.local?i.getAttributeNS(t.space,t.local):i.getAttribute(t)}return this.each((e==null?t.local?Go:Xo:typeof e=="function"?t.local?Ko:Jo:t.local?Zo:jo)(t,e))}u(Qo,"selection_attr");function Si(n3){return n3.ownerDocument&&n3.ownerDocument.defaultView||n3.document&&n3||n3.defaultView}u(Si,"defaultView");function en(n3){return function(){this.style.removeProperty(n3)}}u(en,"styleRemove$1");function tn(n3,e,t){return function(){this.style.setProperty(n3,e,t)}}u(tn,"styleConstant$1");function on(n3,e,t){return function(){var i=e.apply(this,arguments);i==null?this.style.removeProperty(n3):this.style.setProperty(n3,i,t)}}u(on,"styleFunction$1");function nn(n3,e,t){return arguments.length>1?this.each((e==null?en:typeof e=="function"?on:tn)(n3,e,t??"")):Se(this.node(),n3)}u(nn,"selection_style");function Se(n3,e){return n3.style.getPropertyValue(e)||Si(n3).getComputedStyle(n3,null).getPropertyValue(e)}u(Se,"styleValue");function sn(n3){return function(){delete this[n3]}}u(sn,"propertyRemove");function rn(n3,e){return function(){this[n3]=e}}u(rn,"propertyConstant");function an(n3,e){return function(){var t=e.apply(this,arguments);t==null?delete this[n3]:this[n3]=t}}u(an,"propertyFunction");function ln(n3,e){return arguments.length>1?this.each((e==null?sn:typeof e=="function"?an:rn)(n3,e)):this.node()[n3]}u(ln,"selection_property");function $i(n3){return n3.trim().split(/^|\s+/)}u($i,"classArray");function Lt(n3){return n3.classList||new Ci(n3)}u(Lt,"classList");function Ci(n3){this._node=n3,this._names=$i(n3.getAttribute("class")||"")}u(Ci,"ClassList");Ci.prototype={add:u(function(n3){var e=this._names.indexOf(n3);e<0&&(this._names.push(n3),this._node.setAttribute("class",this._names.join(" ")))},"add"),remove:u(function(n3){var e=this._names.indexOf(n3);e>=0&&(this._names.splice(e,1),this._node.setAttribute("class",this._names.join(" ")))},"remove"),contains:u(function(n3){return this._names.indexOf(n3)>=0},"contains")};function ki(n3,e){for(var t=Lt(n3),i=-1,o=e.length;++i<o;)t.add(e[i])}u(ki,"classedAdd");function Di(n3,e){for(var t=Lt(n3),i=-1,o=e.length;++i<o;)t.remove(e[i])}u(Di,"classedRemove");function dn(n3){return function(){ki(this,n3)}}u(dn,"classedTrue");function cn(n3){return function(){Di(this,n3)}}u(cn,"classedFalse");function hn(n3,e){return function(){(e.apply(this,arguments)?ki:Di)(this,n3)}}u(hn,"classedFunction");function un(n3,e){var t=$i(n3+"");if(arguments.length<2){for(var i=Lt(this.node()),o=-1,s=t.length;++o<s;)if(!i.contains(t[o]))return false;return true}return this.each((typeof e=="function"?hn:e?dn:cn)(t,e))}u(un,"selection_classed");function pn(){this.textContent=""}u(pn,"textRemove");function gn(n3){return function(){this.textContent=n3}}u(gn,"textConstant$1");function mn(n3){return function(){var e=n3.apply(this,arguments);this.textContent=e??""}}u(mn,"textFunction$1");function fn(n3){return arguments.length?this.each(n3==null?pn:(typeof n3=="function"?mn:gn)(n3)):this.node().textContent}u(fn,"selection_text");function _n(){this.innerHTML=""}u(_n,"htmlRemove");function vn(n3){return function(){this.innerHTML=n3}}u(vn,"htmlConstant");function bn(n3){return function(){var e=n3.apply(this,arguments);this.innerHTML=e??""}}u(bn,"htmlFunction");function yn(n3){return arguments.length?this.each(n3==null?_n:(typeof n3=="function"?bn:vn)(n3)):this.node().innerHTML}u(yn,"selection_html");function wn(){this.nextSibling&&this.parentNode.appendChild(this)}u(wn,"raise");function xn(){return this.each(wn)}u(xn,"selection_raise");function Sn(){this.previousSibling&&this.parentNode.insertBefore(this,this.parentNode.firstChild)}u(Sn,"lower");function $n(){return this.each(Sn)}u($n,"selection_lower");function Cn(n3){var e=typeof n3=="function"?n3:vi(n3);return this.select(function(){return this.appendChild(e.apply(this,arguments))})}u(Cn,"selection_append");function kn(){return null}u(kn,"constantNull");function Dn(n3,e){var t=typeof n3=="function"?n3:vi(n3),i=e==null?kn:typeof e=="function"?e:Et(e);return this.select(function(){return this.insertBefore(t.apply(this,arguments),i.apply(this,arguments)||null)})}u(Dn,"selection_insert");function Fn(){var n3=this.parentNode;n3&&n3.removeChild(this)}u(Fn,"remove");function Mn(){return this.each(Fn)}u(Mn,"selection_remove");function An(){var n3=this.cloneNode(false),e=this.parentNode;return e?e.insertBefore(n3,this.nextSibling):n3}u(An,"selection_cloneShallow");function Pn(){var n3=this.cloneNode(true),e=this.parentNode;return e?e.insertBefore(n3,this.nextSibling):n3}u(Pn,"selection_cloneDeep");function En(n3){return this.select(n3?Pn:An)}u(En,"selection_clone");function Ln(n3){return arguments.length?this.property("__data__",n3):this.node().__data__}u(Ln,"selection_datum");function zn(n3){return function(e){n3.call(this,e,this.__data__)}}u(zn,"contextListener");function Rn(n3){return n3.trim().split(/^|\s+/).map(function(e){var t="",i=e.indexOf(".");return i>=0&&(t=e.slice(i+1),e=e.slice(0,i)),{type:e,name:t}})}u(Rn,"parseTypenames");function Tn(n3){return function(){var e=this.__on;if(e){for(var t=0,i=-1,o=e.length,s;t<o;++t)s=e[t],(!n3.type||s.type===n3.type)&&s.name===n3.name?this.removeEventListener(s.type,s.listener,s.options):e[++i]=s;++i?e.length=i:delete this.__on}}}u(Tn,"onRemove");function Bn(n3,e,t){return function(){var i=this.__on,o,s=zn(e);if(i){for(var r=0,a=i.length;r<a;++r)if((o=i[r]).type===n3.type&&o.name===n3.name){this.removeEventListener(o.type,o.listener,o.options),this.addEventListener(o.type,o.listener=s,o.options=t),o.value=e;return}}this.addEventListener(n3.type,s,t),o={type:n3.type,name:n3.name,value:e,listener:s,options:t},i?i.push(o):this.__on=[o]}}u(Bn,"onAdd");function Un(n3,e,t){var i=Rn(n3+""),o,s=i.length,r;if(arguments.length<2){var a=this.node().__on;if(a){for(var l=0,c=a.length,d;l<c;++l)for(o=0,d=a[l];o<s;++o)if((r=i[o]).type===d.type&&r.name===d.name)return d.value}return}for(a=e?Bn:Tn,o=0;o<s;++o)this.each(a(i[o],e,t));return this}u(Un,"selection_on");function Fi(n3,e,t){var i=Si(n3),o=i.CustomEvent;typeof o=="function"?o=new o(e,t):(o=i.document.createEvent("Event"),t?(o.initEvent(e,t.bubbles,t.cancelable),o.detail=t.detail):o.initEvent(e,false,false)),n3.dispatchEvent(o)}u(Fi,"dispatchEvent");function In(n3,e){return function(){return Fi(this,n3,e)}}u(In,"dispatchConstant");function qn(n3,e){return function(){return Fi(this,n3,e.apply(this,arguments))}}u(qn,"dispatchFunction");function Nn(n3,e){return this.each((typeof e=="function"?qn:In)(n3,e))}u(Nn,"selection_dispatch");function*On(){for(var n3=this._groups,e=0,t=n3.length;e<t;++e)for(var i=n3[e],o=0,s=i.length,r;o<s;++o)(r=i[o])&&(yield r)}u(On,"selection_iterator");var Mi=[null];function te(n3,e){this._groups=n3,this._parents=e}u(te,"Selection$1");function Ue(){return new te([[document.documentElement]],Mi)}u(Ue,"selection");function Hn(){return this}u(Hn,"selection_selection");te.prototype=Ue.prototype={constructor:te,select:go,selectAll:vo,selectChild:xo,selectChildren:ko,filter:Do,data:Lo,enter:Fo,exit:Ro,join:To,merge:Bo,selection:Hn,order:Uo,sort:Io,call:No,nodes:Oo,node:Ho,size:Vo,empty:Wo,each:Yo,attr:Qo,style:nn,property:ln,classed:un,text:fn,html:yn,raise:xn,lower:$n,append:Cn,insert:Dn,remove:Mn,clone:En,datum:Ln,on:Un,dispatch:Nn,[Symbol.iterator]:On};function ee(n3){return typeof n3=="string"?new te([[document.querySelector(n3)]],[document.documentElement]):new te([[n3]],Mi)}u(ee,"select");function Vn(n3){let e;for(;e=n3.sourceEvent;)n3=e;return n3}u(Vn,"sourceEvent");function _e(n3,e){if(n3=Vn(n3),e===void 0&&(e=n3.currentTarget),e){var t=e.ownerSVGElement||e;if(t.createSVGPoint){var i=t.createSVGPoint();return i.x=n3.clientX,i.y=n3.clientY,i=i.matrixTransform(e.getScreenCTM().inverse()),[i.x,i.y]}if(e.getBoundingClientRect){var o=e.getBoundingClientRect();return[n3.clientX-o.left-e.clientLeft,n3.clientY-o.top-e.clientTop]}}return[n3.pageX,n3.pageY]}u(_e,"pointer");const vt={capture:true,passive:false};function bt(n3){n3.preventDefault(),n3.stopImmediatePropagation()}u(bt,"noevent$1");function Wn(n3){var e=n3.document.documentElement,t=ee(n3).on("dragstart.drag",bt,vt);"onselectstart"in e?t.on("selectstart.drag",bt,vt):(e.__noselect=e.style.MozUserSelect,e.style.MozUserSelect="none")}u(Wn,"dragDisable");function Yn(n3,e){var t=n3.document.documentElement,i=ee(n3).on("dragstart.drag",null);e&&(i.on("click.drag",bt,vt),setTimeout(function(){i.on("click.drag",null)},0)),"onselectstart"in t?i.on("selectstart.drag",null):(t.style.MozUserSelect=t.__noselect,delete t.__noselect)}u(Yn,"yesdrag");function zt(n3,e,t){n3.prototype=e.prototype=t,t.constructor=n3}u(zt,"define");function Ai(n3,e){var t=Object.create(n3.prototype);for(var i in e)t[i]=e[i];return t}u(Ai,"extend");function Ie(){}u(Ie,"Color");var ze=.7,Je=1/ze,xe="\\s*([+-]?\\d+)\\s*",Re="\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*",se="\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*",Xn=/^#([0-9a-f]{3,8})$/,Gn=new RegExp(`^rgb\\(${xe},${xe},${xe}\\)$`),jn=new RegExp(`^rgb\\(${se},${se},${se}\\)$`),Zn=new RegExp(`^rgba\\(${xe},${xe},${xe},${Re}\\)$`),Jn=new RegExp(`^rgba\\(${se},${se},${se},${Re}\\)$`),Kn=new RegExp(`^hsl\\(${Re},${se},${se}\\)$`),Qn=new RegExp(`^hsla\\(${Re},${se},${se},${Re}\\)$`),ti={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074};zt(Ie,Te,{copy(n3){return Object.assign(new this.constructor,this,n3)},displayable(){return this.rgb().displayable()},hex:ii,formatHex:ii,formatHex8:es,formatHsl:ts,formatRgb:oi,toString:oi});function ii(){return this.rgb().formatHex()}u(ii,"color_formatHex");function es(){return this.rgb().formatHex8()}u(es,"color_formatHex8");function ts(){return Pi(this).formatHsl()}u(ts,"color_formatHsl");function oi(){return this.rgb().formatRgb()}u(oi,"color_formatRgb");function Te(n3){var e,t;return n3=(n3+"").trim().toLowerCase(),(e=Xn.exec(n3))?(t=e[1].length,e=parseInt(e[1],16),t===6?ni(e):t===3?new K(e>>8&15|e>>4&240,e>>4&15|e&240,(e&15)<<4|e&15,1):t===8?Ne(e>>24&255,e>>16&255,e>>8&255,(e&255)/255):t===4?Ne(e>>12&15|e>>8&240,e>>8&15|e>>4&240,e>>4&15|e&240,((e&15)<<4|e&15)/255):null):(e=Gn.exec(n3))?new K(e[1],e[2],e[3],1):(e=jn.exec(n3))?new K(e[1]*255/100,e[2]*255/100,e[3]*255/100,1):(e=Zn.exec(n3))?Ne(e[1],e[2],e[3],e[4]):(e=Jn.exec(n3))?Ne(e[1]*255/100,e[2]*255/100,e[3]*255/100,e[4]):(e=Kn.exec(n3))?ai(e[1],e[2]/100,e[3]/100,1):(e=Qn.exec(n3))?ai(e[1],e[2]/100,e[3]/100,e[4]):ti.hasOwnProperty(n3)?ni(ti[n3]):n3==="transparent"?new K(NaN,NaN,NaN,0):null}u(Te,"color");function ni(n3){return new K(n3>>16&255,n3>>8&255,n3&255,1)}u(ni,"rgbn");function Ne(n3,e,t,i){return i<=0&&(n3=e=t=NaN),new K(n3,e,t,i)}u(Ne,"rgba");function is(n3){return n3 instanceof Ie||(n3=Te(n3)),n3?(n3=n3.rgb(),new K(n3.r,n3.g,n3.b,n3.opacity)):new K}u(is,"rgbConvert");function yt(n3,e,t,i){return arguments.length===1?is(n3):new K(n3,e,t,i??1)}u(yt,"rgb");function K(n3,e,t,i){this.r=+n3,this.g=+e,this.b=+t,this.opacity=+i}u(K,"Rgb");zt(K,yt,Ai(Ie,{brighter(n3){return n3=n3==null?Je:Math.pow(Je,n3),new K(this.r*n3,this.g*n3,this.b*n3,this.opacity)},darker(n3){return n3=n3==null?ze:Math.pow(ze,n3),new K(this.r*n3,this.g*n3,this.b*n3,this.opacity)},rgb(){return this},clamp(){return new K(be(this.r),be(this.g),be(this.b),Ke(this.opacity))},displayable(){return-.5<=this.r&&this.r<255.5&&-.5<=this.g&&this.g<255.5&&-.5<=this.b&&this.b<255.5&&0<=this.opacity&&this.opacity<=1},hex:si,formatHex:si,formatHex8:os,formatRgb:ri,toString:ri}));function si(){return`#${ve(this.r)}${ve(this.g)}${ve(this.b)}`}u(si,"rgb_formatHex");function os(){return`#${ve(this.r)}${ve(this.g)}${ve(this.b)}${ve((isNaN(this.opacity)?1:this.opacity)*255)}`}u(os,"rgb_formatHex8");function ri(){const n3=Ke(this.opacity);return`${n3===1?"rgb(":"rgba("}${be(this.r)}, ${be(this.g)}, ${be(this.b)}${n3===1?")":`, ${n3})`}`}u(ri,"rgb_formatRgb");function Ke(n3){return isNaN(n3)?1:Math.max(0,Math.min(1,n3))}u(Ke,"clampa");function be(n3){return Math.max(0,Math.min(255,Math.round(n3)||0))}u(be,"clampi");function ve(n3){return n3=be(n3),(n3<16?"0":"")+n3.toString(16)}u(ve,"hex");function ai(n3,e,t,i){return i<=0?n3=e=t=NaN:t<=0||t>=1?n3=e=NaN:e<=0&&(n3=NaN),new oe(n3,e,t,i)}u(ai,"hsla");function Pi(n3){if(n3 instanceof oe)return new oe(n3.h,n3.s,n3.l,n3.opacity);if(n3 instanceof Ie||(n3=Te(n3)),!n3)return new oe;if(n3 instanceof oe)return n3;n3=n3.rgb();var e=n3.r/255,t=n3.g/255,i=n3.b/255,o=Math.min(e,t,i),s=Math.max(e,t,i),r=NaN,a=s-o,l=(s+o)/2;return a?(e===s?r=(t-i)/a+(t<i)*6:t===s?r=(i-e)/a+2:r=(e-t)/a+4,a/=l<.5?s+o:2-s-o,r*=60):a=l>0&&l<1?0:r,new oe(r,a,l,n3.opacity)}u(Pi,"hslConvert");function ns(n3,e,t,i){return arguments.length===1?Pi(n3):new oe(n3,e,t,i??1)}u(ns,"hsl");function oe(n3,e,t,i){this.h=+n3,this.s=+e,this.l=+t,this.opacity=+i}u(oe,"Hsl");zt(oe,ns,Ai(Ie,{brighter(n3){return n3=n3==null?Je:Math.pow(Je,n3),new oe(this.h,this.s,this.l*n3,this.opacity)},darker(n3){return n3=n3==null?ze:Math.pow(ze,n3),new oe(this.h,this.s,this.l*n3,this.opacity)},rgb(){var n3=this.h%360+(this.h<0)*360,e=isNaN(n3)||isNaN(this.s)?0:this.s,t=this.l,i=t+(t<.5?t:1-t)*e,o=2*t-i;return new K(ut(n3>=240?n3-240:n3+120,o,i),ut(n3,o,i),ut(n3<120?n3+240:n3-120,o,i),this.opacity)},clamp(){return new oe(li(this.h),Oe(this.s),Oe(this.l),Ke(this.opacity))},displayable(){return(0<=this.s&&this.s<=1||isNaN(this.s))&&0<=this.l&&this.l<=1&&0<=this.opacity&&this.opacity<=1},formatHsl(){const n3=Ke(this.opacity);return`${n3===1?"hsl(":"hsla("}${li(this.h)}, ${Oe(this.s)*100}%, ${Oe(this.l)*100}%${n3===1?")":`, ${n3})`}`}}));function li(n3){return n3=(n3||0)%360,n3<0?n3+360:n3}u(li,"clamph");function Oe(n3){return Math.max(0,Math.min(1,n3||0))}u(Oe,"clampt");function ut(n3,e,t){return(n3<60?e+(t-e)*n3/60:n3<180?t:n3<240?e+(t-e)*(240-n3)/60:e)*255}u(ut,"hsl2rgb");const Ei=u(n3=>()=>n3,"constant$1");function ss(n3,e){return function(t){return n3+t*e}}u(ss,"linear");function rs(n3,e,t){return n3=Math.pow(n3,t),e=Math.pow(e,t)-n3,t=1/t,function(i){return Math.pow(n3+i*e,t)}}u(rs,"exponential");function as(n3){return(n3=+n3)==1?Li:function(e,t){return t-e?rs(e,t,n3):Ei(isNaN(e)?t:e)}}u(as,"gamma");function Li(n3,e){var t=e-n3;return t?ss(n3,t):Ei(isNaN(n3)?e:n3)}u(Li,"nogamma");const di=u(function n(e){var t=as(e);function i(o,s){var r=t((o=yt(o)).r,(s=yt(s)).r),a=t(o.g,s.g),l=t(o.b,s.b),c=Li(o.opacity,s.opacity);return function(d){return o.r=r(d),o.g=a(d),o.b=l(d),o.opacity=c(d),o+""}}return u(i,"rgb$1"),i.gamma=n,i},"rgbGamma")(1);function ue(n3,e){return n3=+n3,e=+e,function(t){return n3*(1-t)+e*t}}u(ue,"interpolateNumber");var wt=/[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,pt=new RegExp(wt.source,"g");function ls(n3){return function(){return n3}}u(ls,"zero");function ds(n3){return function(e){return n3(e)+""}}u(ds,"one");function cs(n3,e){var t=wt.lastIndex=pt.lastIndex=0,i,o,s,r=-1,a=[],l=[];for(n3=n3+"",e=e+"";(i=wt.exec(n3))&&(o=pt.exec(e));)(s=o.index)>t&&(s=e.slice(t,s),a[r]?a[r]+=s:a[++r]=s),(i=i[0])===(o=o[0])?a[r]?a[r]+=o:a[++r]=o:(a[++r]=null,l.push({i:r,x:ue(i,o)})),t=pt.lastIndex;return t<e.length&&(s=e.slice(t),a[r]?a[r]+=s:a[++r]=s),a.length<2?l[0]?ds(l[0].x):ls(e):(e=l.length,function(c){for(var d=0,h;d<e;++d)a[(h=l[d]).i]=h.x(c);return a.join("")})}u(cs,"interpolateString");var ci=180/Math.PI,xt={translateX:0,translateY:0,rotate:0,skewX:0,scaleX:1,scaleY:1};function zi(n3,e,t,i,o,s){var r,a,l;return(r=Math.sqrt(n3*n3+e*e))&&(n3/=r,e/=r),(l=n3*t+e*i)&&(t-=n3*l,i-=e*l),(a=Math.sqrt(t*t+i*i))&&(t/=a,i/=a,l/=a),n3*i<e*t&&(n3=-n3,e=-e,l=-l,r=-r),{translateX:o,translateY:s,rotate:Math.atan2(e,n3)*ci,skewX:Math.atan(l)*ci,scaleX:r,scaleY:a}}u(zi,"decompose");var He;function hs(n3){const e=new(typeof DOMMatrix=="function"?DOMMatrix:WebKitCSSMatrix)(n3+"");return e.isIdentity?xt:zi(e.a,e.b,e.c,e.d,e.e,e.f)}u(hs,"parseCss");function us(n3){return n3==null||(He||(He=document.createElementNS("http://www.w3.org/2000/svg","g")),He.setAttribute("transform",n3),!(n3=He.transform.baseVal.consolidate()))?xt:(n3=n3.matrix,zi(n3.a,n3.b,n3.c,n3.d,n3.e,n3.f))}u(us,"parseSvg");function Ri(n3,e,t,i){function o(c){return c.length?c.pop()+" ":""}u(o,"pop");function s(c,d,h,p,g,_){if(c!==h||d!==p){var f=g.push("translate(",null,e,null,t);_.push({i:f-4,x:ue(c,h)},{i:f-2,x:ue(d,p)})}else(h||p)&&g.push("translate("+h+e+p+t)}u(s,"translate");function r(c,d,h,p){c!==d?(c-d>180?d+=360:d-c>180&&(c+=360),p.push({i:h.push(o(h)+"rotate(",null,i)-2,x:ue(c,d)})):d&&h.push(o(h)+"rotate("+d+i)}u(r,"rotate");function a(c,d,h,p){c!==d?p.push({i:h.push(o(h)+"skewX(",null,i)-2,x:ue(c,d)}):d&&h.push(o(h)+"skewX("+d+i)}u(a,"skewX");function l(c,d,h,p,g,_){if(c!==h||d!==p){var f=g.push(o(g)+"scale(",null,",",null,")");_.push({i:f-4,x:ue(c,h)},{i:f-2,x:ue(d,p)})}else(h!==1||p!==1)&&g.push(o(g)+"scale("+h+","+p+")")}return u(l,"scale"),function(c,d){var h=[],p=[];return c=n3(c),d=n3(d),s(c.translateX,c.translateY,d.translateX,d.translateY,h,p),r(c.rotate,d.rotate,h,p),a(c.skewX,d.skewX,h,p),l(c.scaleX,c.scaleY,d.scaleX,d.scaleY,h,p),c=d=null,function(g){for(var _=-1,f=p.length,y;++_<f;)h[(y=p[_]).i]=y.x(g);return h.join("")}}}u(Ri,"interpolateTransform");var ps=Ri(hs,"px, ","px)","deg)"),gs=Ri(us,", ",")",")"),ms=1e-12;function hi(n3){return((n3=Math.exp(n3))+1/n3)/2}u(hi,"cosh");function fs(n3){return((n3=Math.exp(n3))-1/n3)/2}u(fs,"sinh");function _s(n3){return((n3=Math.exp(2*n3))-1)/(n3+1)}u(_s,"tanh");const vs=u(function n2(e,t,i){function o(s,r){var a=s[0],l=s[1],c=s[2],d=r[0],h=r[1],p=r[2],g=d-a,_=h-l,f=g*g+_*_,y,w;if(f<ms)w=Math.log(p/c)/e,y=u(function(k){return[a+k*g,l+k*_,c*Math.exp(e*k*w)]},"i");else{var x=Math.sqrt(f),$=(p*p-c*c+i*f)/(2*c*t*x),D=(p*p-c*c-i*f)/(2*p*t*x),M=Math.log(Math.sqrt($*$+1)-$),P=Math.log(Math.sqrt(D*D+1)-D);w=(P-M)/e,y=u(function(k){var L=k*w,E=hi(M),B=c/(t*x)*(E*_s(e*L+M)-fs(M));return[a+B*g,l+B*_,c*E/hi(e*L+M)]},"i")}return y.duration=w*1e3*e/Math.SQRT2,y}return u(o,"zoom"),o.rho=function(s){var r=Math.max(.001,+s),a=r*r,l=a*a;return n2(r,a,l)},o},"zoomRho")(Math.SQRT2,2,4);var $e=0,Ae=0,De=0,Ti=1e3,Qe,Pe,et=0,ye=0,rt=0,Be=typeof performance=="object"&&performance.now?performance:Date,Bi=typeof window=="object"&&window.requestAnimationFrame?window.requestAnimationFrame.bind(window):function(n3){setTimeout(n3,17)};function Rt(){return ye||(Bi(bs),ye=Be.now()+rt)}u(Rt,"now");function bs(){ye=0}u(bs,"clearNow");function tt(){this._call=this._time=this._next=null}u(tt,"Timer");tt.prototype=Ui.prototype={constructor:tt,restart:u(function(n3,e,t){if(typeof n3!="function")throw new TypeError("callback is not a function");t=(t==null?Rt():+t)+(e==null?0:+e),!this._next&&Pe!==this&&(Pe?Pe._next=this:Qe=this,Pe=this),this._call=n3,this._time=t,St()},"restart"),stop:u(function(){this._call&&(this._call=null,this._time=1/0,St())},"stop")};function Ui(n3,e,t){var i=new tt;return i.restart(n3,e,t),i}u(Ui,"timer");function ys(){Rt(),++$e;for(var n3=Qe,e;n3;)(e=ye-n3._time)>=0&&n3._call.call(void 0,e),n3=n3._next;--$e}u(ys,"timerFlush");function ui(){ye=(et=Be.now())+rt,$e=Ae=0;try{ys()}finally{$e=0,xs(),ye=0}}u(ui,"wake");function ws(){var n3=Be.now(),e=n3-et;e>Ti&&(rt-=e,et=n3)}u(ws,"poke");function xs(){for(var n3,e=Qe,t,i=1/0;e;)e._call?(i>e._time&&(i=e._time),n3=e,e=e._next):(t=e._next,e._next=null,e=n3?n3._next=t:Qe=t);Pe=n3,St(i)}u(xs,"nap");function St(n3){if(!$e){Ae&&(Ae=clearTimeout(Ae));var e=n3-ye;e>24?(n3<1/0&&(Ae=setTimeout(ui,n3-Be.now()-rt)),De&&(De=clearInterval(De))):(De||(et=Be.now(),De=setInterval(ws,Ti)),$e=1,Bi(ui))}}u(St,"sleep");function pi(n3,e,t){var i=new tt;return e=e==null?0:+e,i.restart(o=>{i.stop(),n3(o+e)},e,t),i}u(pi,"timeout");var Ss=Pt("start","end","cancel","interrupt"),$s=[],Ii=0,gi=1,$t=2,Ye=3,mi=4,Ct=5,Xe=6;function at(n3,e,t,i,o,s){var r=n3.__transition;if(!r)n3.__transition={};else if(t in r)return;Cs(n3,t,{name:e,index:i,group:o,on:Ss,tween:$s,time:s.time,delay:s.delay,duration:s.duration,ease:s.ease,timer:null,state:Ii})}u(at,"schedule");function Tt(n3,e){var t=ne(n3,e);if(t.state>Ii)throw new Error("too late; already scheduled");return t}u(Tt,"init");function re(n3,e){var t=ne(n3,e);if(t.state>Ye)throw new Error("too late; already running");return t}u(re,"set");function ne(n3,e){var t=n3.__transition;if(!t||!(t=t[e]))throw new Error("transition not found");return t}u(ne,"get");function Cs(n3,e,t){var i=n3.__transition,o;i[e]=t,t.timer=Ui(s,0,t.time);function s(c){t.state=gi,t.timer.restart(r,t.delay,t.time),t.delay<=c&&r(c-t.delay)}u(s,"schedule");function r(c){var d,h,p,g;if(t.state!==gi)return l();for(d in i)if(g=i[d],g.name===t.name){if(g.state===Ye)return pi(r);g.state===mi?(g.state=Xe,g.timer.stop(),g.on.call("interrupt",n3,n3.__data__,g.index,g.group),delete i[d]):+d<e&&(g.state=Xe,g.timer.stop(),g.on.call("cancel",n3,n3.__data__,g.index,g.group),delete i[d])}if(pi(function(){t.state===Ye&&(t.state=mi,t.timer.restart(a,t.delay,t.time),a(c))}),t.state=$t,t.on.call("start",n3,n3.__data__,t.index,t.group),t.state===$t){for(t.state=Ye,o=new Array(p=t.tween.length),d=0,h=-1;d<p;++d)(g=t.tween[d].value.call(n3,n3.__data__,t.index,t.group))&&(o[++h]=g);o.length=h+1}}u(r,"start");function a(c){for(var d=c<t.duration?t.ease.call(null,c/t.duration):(t.timer.restart(l),t.state=Ct,1),h=-1,p=o.length;++h<p;)o[h].call(n3,d);t.state===Ct&&(t.on.call("end",n3,n3.__data__,t.index,t.group),l())}u(a,"tick");function l(){t.state=Xe,t.timer.stop(),delete i[e];for(var c in i)return;delete n3.__transition}u(l,"stop")}u(Cs,"create");function Ge(n3,e){var t=n3.__transition,i,o,s=true,r;if(t){e=e==null?null:e+"";for(r in t){if((i=t[r]).name!==e){s=false;continue}o=i.state>$t&&i.state<Ct,i.state=Xe,i.timer.stop(),i.on.call(o?"interrupt":"cancel",n3,n3.__data__,i.index,i.group),delete t[r]}s&&delete n3.__transition}}u(Ge,"interrupt");function ks(n3){return this.each(function(){Ge(this,n3)})}u(ks,"selection_interrupt");function Ds(n3,e){var t,i;return function(){var o=re(this,n3),s=o.tween;if(s!==t){i=t=s;for(var r=0,a=i.length;r<a;++r)if(i[r].name===e){i=i.slice(),i.splice(r,1);break}}o.tween=i}}u(Ds,"tweenRemove");function Fs(n3,e,t){var i,o;if(typeof t!="function")throw new Error;return function(){var s=re(this,n3),r=s.tween;if(r!==i){o=(i=r).slice();for(var a={name:e,value:t},l=0,c=o.length;l<c;++l)if(o[l].name===e){o[l]=a;break}l===c&&o.push(a)}s.tween=o}}u(Fs,"tweenFunction");function Ms(n3,e){var t=this._id;if(n3+="",arguments.length<2){for(var i=ne(this.node(),t).tween,o=0,s=i.length,r;o<s;++o)if((r=i[o]).name===n3)return r.value;return null}return this.each((e==null?Ds:Fs)(t,n3,e))}u(Ms,"transition_tween");function Bt(n3,e,t){var i=n3._id;return n3.each(function(){var o=re(this,i);(o.value||(o.value={}))[e]=t.apply(this,arguments)}),function(o){return ne(o,i).value[e]}}u(Bt,"tweenValue");function qi(n3,e){var t;return(typeof e=="number"?ue:e instanceof Te?di:(t=Te(e))?(e=t,di):cs)(n3,e)}u(qi,"interpolate");function As(n3){return function(){this.removeAttribute(n3)}}u(As,"attrRemove");function Ps(n3){return function(){this.removeAttributeNS(n3.space,n3.local)}}u(Ps,"attrRemoveNS");function Es(n3,e,t){var i,o=t+"",s;return function(){var r=this.getAttribute(n3);return r===o?null:r===i?s:s=e(i=r,t)}}u(Es,"attrConstant");function Ls(n3,e,t){var i,o=t+"",s;return function(){var r=this.getAttributeNS(n3.space,n3.local);return r===o?null:r===i?s:s=e(i=r,t)}}u(Ls,"attrConstantNS");function zs(n3,e,t){var i,o,s;return function(){var r,a=t(this),l;return a==null?void this.removeAttribute(n3):(r=this.getAttribute(n3),l=a+"",r===l?null:r===i&&l===o?s:(o=l,s=e(i=r,a)))}}u(zs,"attrFunction");function Rs(n3,e,t){var i,o,s;return function(){var r,a=t(this),l;return a==null?void this.removeAttributeNS(n3.space,n3.local):(r=this.getAttributeNS(n3.space,n3.local),l=a+"",r===l?null:r===i&&l===o?s:(o=l,s=e(i=r,a)))}}u(Rs,"attrFunctionNS");function Ts(n3,e){var t=st(n3),i=t==="transform"?gs:qi;return this.attrTween(n3,typeof e=="function"?(t.local?Rs:zs)(t,i,Bt(this,"attr."+n3,e)):e==null?(t.local?Ps:As)(t):(t.local?Ls:Es)(t,i,e))}u(Ts,"transition_attr");function Bs(n3,e){return function(t){this.setAttribute(n3,e.call(this,t))}}u(Bs,"attrInterpolate");function Us(n3,e){return function(t){this.setAttributeNS(n3.space,n3.local,e.call(this,t))}}u(Us,"attrInterpolateNS");function Is(n3,e){var t,i;function o(){var s=e.apply(this,arguments);return s!==i&&(t=(i=s)&&Us(n3,s)),t}return u(o,"tween"),o._value=e,o}u(Is,"attrTweenNS");function qs(n3,e){var t,i;function o(){var s=e.apply(this,arguments);return s!==i&&(t=(i=s)&&Bs(n3,s)),t}return u(o,"tween"),o._value=e,o}u(qs,"attrTween");function Ns(n3,e){var t="attr."+n3;if(arguments.length<2)return(t=this.tween(t))&&t._value;if(e==null)return this.tween(t,null);if(typeof e!="function")throw new Error;var i=st(n3);return this.tween(t,(i.local?Is:qs)(i,e))}u(Ns,"transition_attrTween");function Os(n3,e){return function(){Tt(this,n3).delay=+e.apply(this,arguments)}}u(Os,"delayFunction");function Hs(n3,e){return e=+e,function(){Tt(this,n3).delay=e}}u(Hs,"delayConstant");function Vs(n3){var e=this._id;return arguments.length?this.each((typeof n3=="function"?Os:Hs)(e,n3)):ne(this.node(),e).delay}u(Vs,"transition_delay");function Ws(n3,e){return function(){re(this,n3).duration=+e.apply(this,arguments)}}u(Ws,"durationFunction");function Ys(n3,e){return e=+e,function(){re(this,n3).duration=e}}u(Ys,"durationConstant");function Xs(n3){var e=this._id;return arguments.length?this.each((typeof n3=="function"?Ws:Ys)(e,n3)):ne(this.node(),e).duration}u(Xs,"transition_duration");function Gs(n3,e){if(typeof e!="function")throw new Error;return function(){re(this,n3).ease=e}}u(Gs,"easeConstant");function js(n3){var e=this._id;return arguments.length?this.each(Gs(e,n3)):ne(this.node(),e).ease}u(js,"transition_ease");function Zs(n3,e){return function(){var t=e.apply(this,arguments);if(typeof t!="function")throw new Error;re(this,n3).ease=t}}u(Zs,"easeVarying");function Js(n3){if(typeof n3!="function")throw new Error;return this.each(Zs(this._id,n3))}u(Js,"transition_easeVarying");function Ks(n3){typeof n3!="function"&&(n3=yi(n3));for(var e=this._groups,t=e.length,i=new Array(t),o=0;o<t;++o)for(var s=e[o],r=s.length,a=i[o]=[],l,c=0;c<r;++c)(l=s[c])&&n3.call(l,l.__data__,c,s)&&a.push(l);return new ce(i,this._parents,this._name,this._id)}u(Ks,"transition_filter");function Qs(n3){if(n3._id!==this._id)throw new Error;for(var e=this._groups,t=n3._groups,i=e.length,o=t.length,s=Math.min(i,o),r=new Array(i),a=0;a<s;++a)for(var l=e[a],c=t[a],d=l.length,h=r[a]=new Array(d),p,g=0;g<d;++g)(p=l[g]||c[g])&&(h[g]=p);for(;a<i;++a)r[a]=e[a];return new ce(r,this._parents,this._name,this._id)}u(Qs,"transition_merge");function er(n3){return(n3+"").trim().split(/^|\s+/).every(function(e){var t=e.indexOf(".");return t>=0&&(e=e.slice(0,t)),!e||e==="start"})}u(er,"start");function tr(n3,e,t){var i,o,s=er(e)?Tt:re;return function(){var r=s(this,n3),a=r.on;a!==i&&(o=(i=a).copy()).on(e,t),r.on=o}}u(tr,"onFunction");function ir(n3,e){var t=this._id;return arguments.length<2?ne(this.node(),t).on.on(n3):this.each(tr(t,n3,e))}u(ir,"transition_on");function or(n3){return function(){var e=this.parentNode;for(var t in this.__transition)if(+t!==n3)return;e&&e.removeChild(this)}}u(or,"removeFunction");function nr(){return this.on("end.remove",or(this._id))}u(nr,"transition_remove");function sr(n3){var e=this._name,t=this._id;typeof n3!="function"&&(n3=Et(n3));for(var i=this._groups,o=i.length,s=new Array(o),r=0;r<o;++r)for(var a=i[r],l=a.length,c=s[r]=new Array(l),d,h,p=0;p<l;++p)(d=a[p])&&(h=n3.call(d,d.__data__,p,a))&&("__data__"in d&&(h.__data__=d.__data__),c[p]=h,at(c[p],e,t,p,c,ne(d,t)));return new ce(s,this._parents,e,t)}u(sr,"transition_select");function rr(n3){var e=this._name,t=this._id;typeof n3!="function"&&(n3=bi(n3));for(var i=this._groups,o=i.length,s=[],r=[],a=0;a<o;++a)for(var l=i[a],c=l.length,d,h=0;h<c;++h)if(d=l[h]){for(var p=n3.call(d,d.__data__,h,l),g,_=ne(d,t),f=0,y=p.length;f<y;++f)(g=p[f])&&at(g,e,t,f,p,_);s.push(p),r.push(d)}return new ce(s,r,e,t)}u(rr,"transition_selectAll");var ar=Ue.prototype.constructor;function lr(){return new ar(this._groups,this._parents)}u(lr,"transition_selection");function dr(n3,e){var t,i,o;return function(){var s=Se(this,n3),r=(this.style.removeProperty(n3),Se(this,n3));return s===r?null:s===t&&r===i?o:o=e(t=s,i=r)}}u(dr,"styleNull");function Ni(n3){return function(){this.style.removeProperty(n3)}}u(Ni,"styleRemove");function cr(n3,e,t){var i,o=t+"",s;return function(){var r=Se(this,n3);return r===o?null:r===i?s:s=e(i=r,t)}}u(cr,"styleConstant");function hr(n3,e,t){var i,o,s;return function(){var r=Se(this,n3),a=t(this),l=a+"";return a==null&&(l=a=(this.style.removeProperty(n3),Se(this,n3))),r===l?null:r===i&&l===o?s:(o=l,s=e(i=r,a))}}u(hr,"styleFunction");function ur(n3,e){var t,i,o,s="style."+e,r="end."+s,a;return function(){var l=re(this,n3),c=l.on,d=l.value[s]==null?a||(a=Ni(e)):void 0;(c!==t||o!==d)&&(i=(t=c).copy()).on(r,o=d),l.on=i}}u(ur,"styleMaybeRemove");function pr(n3,e,t){var i=(n3+="")=="transform"?ps:qi;return e==null?this.styleTween(n3,dr(n3,i)).on("end.style."+n3,Ni(n3)):typeof e=="function"?this.styleTween(n3,hr(n3,i,Bt(this,"style."+n3,e))).each(ur(this._id,n3)):this.styleTween(n3,cr(n3,i,e),t).on("end.style."+n3,null)}u(pr,"transition_style");function gr(n3,e,t){return function(i){this.style.setProperty(n3,e.call(this,i),t)}}u(gr,"styleInterpolate");function mr(n3,e,t){var i,o;function s(){var r=e.apply(this,arguments);return r!==o&&(i=(o=r)&&gr(n3,r,t)),i}return u(s,"tween"),s._value=e,s}u(mr,"styleTween");function fr(n3,e,t){var i="style."+(n3+="");if(arguments.length<2)return(i=this.tween(i))&&i._value;if(e==null)return this.tween(i,null);if(typeof e!="function")throw new Error;return this.tween(i,mr(n3,e,t??""))}u(fr,"transition_styleTween");function _r(n3){return function(){this.textContent=n3}}u(_r,"textConstant");function vr(n3){return function(){var e=n3(this);this.textContent=e??""}}u(vr,"textFunction");function br(n3){return this.tween("text",typeof n3=="function"?vr(Bt(this,"text",n3)):_r(n3==null?"":n3+""))}u(br,"transition_text");function yr(n3){return function(e){this.textContent=n3.call(this,e)}}u(yr,"textInterpolate");function wr(n3){var e,t;function i(){var o=n3.apply(this,arguments);return o!==t&&(e=(t=o)&&yr(o)),e}return u(i,"tween"),i._value=n3,i}u(wr,"textTween");function xr(n3){var e="text";if(arguments.length<1)return(e=this.tween(e))&&e._value;if(n3==null)return this.tween(e,null);if(typeof n3!="function")throw new Error;return this.tween(e,wr(n3))}u(xr,"transition_textTween");function Sr(){for(var n3=this._name,e=this._id,t=Oi(),i=this._groups,o=i.length,s=0;s<o;++s)for(var r=i[s],a=r.length,l,c=0;c<a;++c)if(l=r[c]){var d=ne(l,e);at(l,n3,t,c,r,{time:d.time+d.delay+d.duration,delay:0,duration:d.duration,ease:d.ease})}return new ce(i,this._parents,n3,t)}u(Sr,"transition_transition");function $r(){var n3,e,t=this,i=t._id,o=t.size();return new Promise(function(s,r){var a={value:r},l={value:u(function(){--o===0&&s()},"value")};t.each(function(){var c=re(this,i),d=c.on;d!==n3&&(e=(n3=d).copy(),e._.cancel.push(a),e._.interrupt.push(a),e._.end.push(l)),c.on=e}),o===0&&s()})}u($r,"transition_end");var Cr=0;function ce(n3,e,t,i){this._groups=n3,this._parents=e,this._name=t,this._id=i}u(ce,"Transition");function Oi(){return++Cr}u(Oi,"newId");var le=Ue.prototype;ce.prototype={constructor:ce,select:sr,selectAll:rr,selectChild:le.selectChild,selectChildren:le.selectChildren,filter:Ks,merge:Qs,selection:lr,transition:Sr,call:le.call,nodes:le.nodes,node:le.node,size:le.size,empty:le.empty,each:le.each,on:ir,attr:Ts,attrTween:Ns,style:pr,styleTween:fr,text:br,textTween:xr,remove:nr,tween:Ms,delay:Vs,duration:Xs,ease:js,easeVarying:Js,end:$r,[Symbol.iterator]:le[Symbol.iterator]};function kr(n3){return((n3*=2)<=1?n3*n3*n3:(n3-=2)*n3*n3+2)/2}u(kr,"cubicInOut");var Dr={time:null,delay:0,duration:250,ease:kr};function Fr(n3,e){for(var t;!(t=n3.__transition)||!(t=t[e]);)if(!(n3=n3.parentNode))throw new Error(`transition ${e} not found`);return t}u(Fr,"inherit");function Mr(n3){var e,t;n3 instanceof ce?(e=n3._id,n3=n3._name):(e=Oi(),(t=Dr).time=Rt(),n3=n3==null?null:n3+"");for(var i=this._groups,o=i.length,s=0;s<o;++s)for(var r=i[s],a=r.length,l,c=0;c<a;++c)(l=r[c])&&at(l,n3,e,c,r,t||Fr(l,e));return new ce(i,this._parents,n3,e)}u(Mr,"selection_transition");Ue.prototype.interrupt=ks;Ue.prototype.transition=Mr;const Ve=u(n3=>()=>n3,"constant");function Ar(n3,{sourceEvent:e,target:t,transform:i,dispatch:o}){Object.defineProperties(this,{type:{value:n3,enumerable:true,configurable:true},sourceEvent:{value:e,enumerable:true,configurable:true},target:{value:t,enumerable:true,configurable:true},transform:{value:i,enumerable:true,configurable:true},_:{value:o}})}u(Ar,"ZoomEvent");function de(n3,e,t){this.k=n3,this.x=e,this.y=t}u(de,"Transform");de.prototype={constructor:de,scale:u(function(n3){return n3===1?this:new de(this.k*n3,this.x,this.y)},"scale"),translate:u(function(n3,e){return n3===0&e===0?this:new de(this.k,this.x+this.k*n3,this.y+this.k*e)},"translate"),apply:u(function(n3){return[n3[0]*this.k+this.x,n3[1]*this.k+this.y]},"apply"),applyX:u(function(n3){return n3*this.k+this.x},"applyX"),applyY:u(function(n3){return n3*this.k+this.y},"applyY"),invert:u(function(n3){return[(n3[0]-this.x)/this.k,(n3[1]-this.y)/this.k]},"invert"),invertX:u(function(n3){return(n3-this.x)/this.k},"invertX"),invertY:u(function(n3){return(n3-this.y)/this.k},"invertY"),rescaleX:u(function(n3){return n3.copy().domain(n3.range().map(this.invertX,this).map(n3.invert,n3))},"rescaleX"),rescaleY:u(function(n3){return n3.copy().domain(n3.range().map(this.invertY,this).map(n3.invert,n3))},"rescaleY"),toString:u(function(){return"translate("+this.x+","+this.y+") scale("+this.k+")"},"toString")};var Ee=new de(1,0,0);de.prototype;function gt(n3){n3.stopImmediatePropagation()}u(gt,"nopropagation");function Fe(n3){n3.preventDefault(),n3.stopImmediatePropagation()}u(Fe,"noevent");function Pr(n3){return(!n3.ctrlKey||n3.type==="wheel")&&!n3.button}u(Pr,"defaultFilter");function Er(){var n3=this;return n3 instanceof SVGElement?(n3=n3.ownerSVGElement||n3,n3.hasAttribute("viewBox")?(n3=n3.viewBox.baseVal,[[n3.x,n3.y],[n3.x+n3.width,n3.y+n3.height]]):[[0,0],[n3.width.baseVal.value,n3.height.baseVal.value]]):[[0,0],[n3.clientWidth,n3.clientHeight]]}u(Er,"defaultExtent");function fi(){return this.__zoom||Ee}u(fi,"defaultTransform");function Lr(n3){return-n3.deltaY*(n3.deltaMode===1?.05:n3.deltaMode?1:.002)*(n3.ctrlKey?10:1)}u(Lr,"defaultWheelDelta");function zr(){return navigator.maxTouchPoints||"ontouchstart"in this}u(zr,"defaultTouchable");function Rr(n3,e,t){var i=n3.invertX(e[0][0])-t[0][0],o=n3.invertX(e[1][0])-t[1][0],s=n3.invertY(e[0][1])-t[0][1],r=n3.invertY(e[1][1])-t[1][1];return n3.translate(o>i?(i+o)/2:Math.min(0,i)||Math.max(0,o),r>s?(s+r)/2:Math.min(0,s)||Math.max(0,r))}u(Rr,"defaultConstrain");function Tr(){var n3=Pr,e=Er,t=Rr,i=Lr,o=zr,s=[0,1/0],r=[[-1/0,-1/0],[1/0,1/0]],a=250,l=vs,c=Pt("start","zoom","end"),d,h,p,g=500,_=150,f=0,y=10;function w(b){b.property("__zoom",fi).on("wheel.zoom",L,{passive:false}).on("mousedown.zoom",E).on("dblclick.zoom",B).filter(o).on("touchstart.zoom",U).on("touchmove.zoom",I).on("touchend.zoom touchcancel.zoom",F).style("-webkit-tap-highlight-color","rgba(0,0,0,0)")}u(w,"zoom"),w.transform=function(b,C,S,A){var z=b.selection?b.selection():b;z.property("__zoom",fi),b!==z?M(b,C,S,A):z.interrupt().each(function(){P(this,arguments).event(A).start().zoom(null,typeof C=="function"?C.apply(this,arguments):C).end()})},w.scaleBy=function(b,C,S,A){w.scaleTo(b,function(){var z=this.__zoom.k,T=typeof C=="function"?C.apply(this,arguments):C;return z*T},S,A)},w.scaleTo=function(b,C,S,A){w.transform(b,function(){var z=e.apply(this,arguments),T=this.__zoom,R=S==null?D(z):typeof S=="function"?S.apply(this,arguments):S,q=T.invert(R),O=typeof C=="function"?C.apply(this,arguments):C;return t($(x(T,O),R,q),z,r)},S,A)},w.translateBy=function(b,C,S,A){w.transform(b,function(){return t(this.__zoom.translate(typeof C=="function"?C.apply(this,arguments):C,typeof S=="function"?S.apply(this,arguments):S),e.apply(this,arguments),r)},null,A)},w.translateTo=function(b,C,S,A,z){w.transform(b,function(){var T=e.apply(this,arguments),R=this.__zoom,q=A==null?D(T):typeof A=="function"?A.apply(this,arguments):A;return t(Ee.translate(q[0],q[1]).scale(R.k).translate(typeof C=="function"?-C.apply(this,arguments):-C,typeof S=="function"?-S.apply(this,arguments):-S),T,r)},A,z)};function x(b,C){return C=Math.max(s[0],Math.min(s[1],C)),C===b.k?b:new de(C,b.x,b.y)}u(x,"scale");function $(b,C,S){var A=C[0]-S[0]*b.k,z=C[1]-S[1]*b.k;return A===b.x&&z===b.y?b:new de(b.k,A,z)}u($,"translate");function D(b){return[(+b[0][0]+ +b[1][0])/2,(+b[0][1]+ +b[1][1])/2]}u(D,"centroid");function M(b,C,S,A){b.on("start.zoom",function(){P(this,arguments).event(A).start()}).on("interrupt.zoom end.zoom",function(){P(this,arguments).event(A).end()}).tween("zoom",function(){var z=this,T=arguments,R=P(z,T).event(A),q=e.apply(z,T),O=S==null?D(q):typeof S=="function"?S.apply(z,T):S,V=Math.max(q[1][0]-q[0][0],q[1][1]-q[0][1]),H=z.__zoom,Y=typeof C=="function"?C.apply(z,T):C,X=l(H.invert(O).concat(V/H.k),Y.invert(O).concat(V/Y.k));return function(W){if(W===1)W=Y;else{var j=X(W),Z=V/j[2];W=new de(Z,O[0]-j[0]*Z,O[1]-j[1]*Z)}R.zoom(null,W)}})}u(M,"schedule");function P(b,C,S){return!S&&b.__zooming||new k(b,C)}u(P,"gesture");function k(b,C){this.that=b,this.args=C,this.active=0,this.sourceEvent=null,this.extent=e.apply(b,C),this.taps=0}u(k,"Gesture"),k.prototype={event:u(function(b){return b&&(this.sourceEvent=b),this},"event"),start:u(function(){return++this.active===1&&(this.that.__zooming=this,this.emit("start")),this},"start"),zoom:u(function(b,C){return this.mouse&&b!=="mouse"&&(this.mouse[1]=C.invert(this.mouse[0])),this.touch0&&b!=="touch"&&(this.touch0[1]=C.invert(this.touch0[0])),this.touch1&&b!=="touch"&&(this.touch1[1]=C.invert(this.touch1[0])),this.that.__zoom=C,this.emit("zoom"),this},"zoom"),end:u(function(){return--this.active===0&&(delete this.that.__zooming,this.emit("end")),this},"end"),emit:u(function(b){var C=ee(this.that).datum();c.call(b,this.that,new Ar(b,{sourceEvent:this.sourceEvent,target:w,transform:this.that.__zoom,dispatch:c}),C)},"emit")};function L(b,...C){if(!n3.apply(this,arguments))return;var S=P(this,C).event(b),A=this.__zoom,z=Math.max(s[0],Math.min(s[1],A.k*Math.pow(2,i.apply(this,arguments)))),T=_e(b);if(S.wheel)(S.mouse[0][0]!==T[0]||S.mouse[0][1]!==T[1])&&(S.mouse[1]=A.invert(S.mouse[0]=T)),clearTimeout(S.wheel);else{if(A.k===z)return;S.mouse=[T,A.invert(T)],Ge(this),S.start()}Fe(b),S.wheel=setTimeout(R,_),S.zoom("mouse",t($(x(A,z),S.mouse[0],S.mouse[1]),S.extent,r));function R(){S.wheel=null,S.end()}u(R,"wheelidled")}u(L,"wheeled");function E(b,...C){if(p||!n3.apply(this,arguments))return;var S=b.currentTarget,A=P(this,C,true).event(b),z=ee(b.view).on("mousemove.zoom",O,true).on("mouseup.zoom",V,true),T=_e(b,S),R=b.clientX,q=b.clientY;Wn(b.view),gt(b),A.mouse=[T,this.__zoom.invert(T)],Ge(this),A.start();function O(H){if(Fe(H),!A.moved){var Y=H.clientX-R,X=H.clientY-q;A.moved=Y*Y+X*X>f}A.event(H).zoom("mouse",t($(A.that.__zoom,A.mouse[0]=_e(H,S),A.mouse[1]),A.extent,r))}u(O,"mousemoved");function V(H){z.on("mousemove.zoom mouseup.zoom",null),Yn(H.view,A.moved),Fe(H),A.event(H).end()}u(V,"mouseupped")}u(E,"mousedowned");function B(b,...C){if(n3.apply(this,arguments)){var S=this.__zoom,A=_e(b.changedTouches?b.changedTouches[0]:b,this),z=S.invert(A),T=S.k*(b.shiftKey?.5:2),R=t($(x(S,T),A,z),e.apply(this,C),r);Fe(b),a>0?ee(this).transition().duration(a).call(M,R,A,b):ee(this).call(w.transform,R,A,b)}}u(B,"dblclicked");function U(b,...C){if(n3.apply(this,arguments)){var S=b.touches,A=S.length,z=P(this,C,b.changedTouches.length===A).event(b),T,R,q,O;for(gt(b),R=0;R<A;++R)q=S[R],O=_e(q,this),O=[O,this.__zoom.invert(O),q.identifier],z.touch0?!z.touch1&&z.touch0[2]!==O[2]&&(z.touch1=O,z.taps=0):(z.touch0=O,T=true,z.taps=1+!!d);d&&(d=clearTimeout(d)),T&&(z.taps<2&&(h=O[0],d=setTimeout(function(){d=null},g)),Ge(this),z.start())}}u(U,"touchstarted");function I(b,...C){if(this.__zooming){var S=P(this,C).event(b),A=b.changedTouches,z=A.length,T,R,q,O;for(Fe(b),T=0;T<z;++T)R=A[T],q=_e(R,this),S.touch0&&S.touch0[2]===R.identifier?S.touch0[0]=q:S.touch1&&S.touch1[2]===R.identifier&&(S.touch1[0]=q);if(R=S.that.__zoom,S.touch1){var V=S.touch0[0],H=S.touch0[1],Y=S.touch1[0],X=S.touch1[1],W=(W=Y[0]-V[0])*W+(W=Y[1]-V[1])*W,j=(j=X[0]-H[0])*j+(j=X[1]-H[1])*j;R=x(R,Math.sqrt(W/j)),q=[(V[0]+Y[0])/2,(V[1]+Y[1])/2],O=[(H[0]+X[0])/2,(H[1]+X[1])/2]}else if(S.touch0)q=S.touch0[0],O=S.touch0[1];else return;S.zoom("touch",t($(R,q,O),S.extent,r))}}u(I,"touchmoved");function F(b,...C){if(this.__zooming){var S=P(this,C).event(b),A=b.changedTouches,z=A.length,T,R;for(gt(b),p&&clearTimeout(p),p=setTimeout(function(){p=null},g),T=0;T<z;++T)R=A[T],S.touch0&&S.touch0[2]===R.identifier?delete S.touch0:S.touch1&&S.touch1[2]===R.identifier&&delete S.touch1;if(S.touch1&&!S.touch0&&(S.touch0=S.touch1,delete S.touch1),S.touch0)S.touch0[1]=this.__zoom.invert(S.touch0[0]);else if(S.end(),S.taps===2&&(R=_e(R,this),Math.hypot(h[0]-R[0],h[1]-R[1])<y)){var q=ee(this).on("dblclick.zoom");q&&q.apply(this,arguments)}}}return u(F,"touchended"),w.wheelDelta=function(b){return arguments.length?(i=typeof b=="function"?b:Ve(+b),w):i},w.filter=function(b){return arguments.length?(n3=typeof b=="function"?b:Ve(!!b),w):n3},w.touchable=function(b){return arguments.length?(o=typeof b=="function"?b:Ve(!!b),w):o},w.extent=function(b){return arguments.length?(e=typeof b=="function"?b:Ve([[+b[0][0],+b[0][1]],[+b[1][0],+b[1][1]]]),w):e},w.scaleExtent=function(b){return arguments.length?(s[0]=+b[0],s[1]=+b[1],w):[s[0],s[1]]},w.translateExtent=function(b){return arguments.length?(r[0][0]=+b[0][0],r[1][0]=+b[1][0],r[0][1]=+b[0][1],r[1][1]=+b[1][1],w):[[r[0][0],r[0][1]],[r[1][0],r[1][1]]]},w.constrain=function(b){return arguments.length?(t=b,w):t},w.duration=function(b){return arguments.length?(a=+b,w):a},w.interpolate=function(b){return arguments.length?(l=b,w):l},w.on=function(){var b=c.on.apply(c,arguments);return b===c?w:b},w.clickDistance=function(b){return arguments.length?(f=(b=+b)*b,w):Math.sqrt(f)},w.tapDistance=function(b){return arguments.length?(y=+b,w):y},w}u(Tr,"zoom");function Br(n3,e,t,i=null){const o=e.querySelector(".preview-panel");if(!o)return null;const s=o.querySelector("lcards-msd-live-preview");if(!s)return null;const r=s.shadowRoot;if(!r)return null;const a=r.querySelector(".preview-card-container");if(!a)return null;const l=a.querySelector("lcards-msd-card");if(!l)return null;const c=l.shadowRoot||l.renderRoot;if(!c)return null;const d=c.querySelector("svg");if(!d)return null;const h=d.viewBox.baseVal;if(!h||h.width<=0||h.height<=0)return null;const{x:p,y:g,width:_,height:f}=h,y=d.getBoundingClientRect(),w=o.getBoundingClientRect(),x=_/y.width,$=f/y.height,D=Math.max(x,$),M=_/D,P=f/D,k=(y.width-M)/2,L=(y.height-P)/2,E=n3.clientX-w.left,B=n3.clientY-w.top,U=y.left-w.left,I=y.top-w.top,F=E-U-k,b=B-I-L,C=F*D+p,S=b*D+g;return{x:C,y:S}}u(Br,"getPreviewCoordinatesFromMouseEvent");function _i(n3,e,t,i){return[Math.round(n3/t)*t,Math.round(e/t)*t]}u(_i,"snapToGrid");const Ur=new Set(["hull_center","extremity_bow","extremity_stern","extremity_top","extremity_bottom","lateral_a","lateral_b"]);function Ir(n3){const e={},t={};for(const[i,o]of Object.entries(n3))Ur.has(i)?e[i]=o:t[i]=o;return{computed:e,harvested:t}}u(Ir,"splitBaseSvgAnchorsBySource");function Ut(n3,e){var d,h,p,g,_,f;const t=(h=(d=n3.msd)==null?void 0:d.base_svg)==null?void 0:h.source;if(!t||!t.startsWith("builtin:"))return{};const i=e==null?void 0:e.querySelector("lcards-msd-live-preview");if(!i)return{};const o=i.shadowRoot;if(!o)return{};const s=o.querySelector(".preview-card-container");if(!s)return{};const r=s.querySelector("lcards-msd-card");if(!r)return{};const a=((_=(g=(p=r._msdPipeline)==null?void 0:p.getResolvedModel)==null?void 0:g.call(p))==null?void 0:_.anchors)||{},l=((f=n3.msd)==null?void 0:f.anchors)||{},c={};for(const[y,w]of Object.entries(a))l[y]||(c[y]=w);return c}u(Ut,"getBaseSvgAnchors");function Hi(n3,e,t){var i;if(m.debug("[MSDStudio] Resolving control position:",n3.id,"position:",n3.position,"anchor:",n3.anchor),n3.position&&Array.isArray(n3.position))return m.debug("[MSDStudio] Control has direct position:",n3.position),n3.position;if(n3.anchor){const o=((i=e.msd)==null?void 0:i.anchors)||{},s=Ut(e,t),a={...o,...s}[n3.anchor];return m.debug("[MSDStudio] Control resolved from anchor:",n3.anchor,"→",a),a||null}return m.warn("[MSDStudio] Control has no position or anchor:",n3.id),null}u(Hi,"resolveControlPosition");function qr(n3,e,t,i){var c,d;const o=((c=t.msd)==null?void 0:c.overlays)||[],s=((d=t.msd)==null?void 0:d.anchors)||{},r=Ut(t,i),a={...s,...r};if(a[n3])return a[n3];const l=o.find(h=>h.id===n3&&h.type==="control");if(l){const h=Hi(l,t,i);if(!h)return null;const[p,g]=h,_=l.size||[100,100],[f,y]=_;if(!e||e==="center")return[p+f/2,g+y/2];switch(e){case"top":return[p+f/2,g];case"bottom":return[p+f/2,g+y];case"left":return[p,g+y/2];case"right":return[p+f,g+y/2];case"top-left":return[p,g];case"top-right":return[p+f,g];case"bottom-left":return[p,g+y];case"bottom-right":return[p+f,g+y];default:return[p+f/2,g+y/2]}}return null}u(qr,"resolvePositionWithSide");const Nr=nt`
    :host {
        display: block;
        color: var(--primary-text-color);
    }

    /* List item styled like ha-card but without transition:all or color inheritance issues */
    .list-item-card {
        background: var(--ha-card-background, var(--card-background-color, white));
        box-shadow: var(--ha-card-box-shadow, none);
        box-sizing: border-box;
        border-radius: var(--ha-card-border-radius, var(--ha-border-radius-lg));
        border-width: var(--ha-card-border-width, var(--ha-border-width-sm));
        border-style: solid;
        border-color: var(--ha-card-border-color, var(--divider-color, #e0e0e0));
        padding: var(--ha-space-3);
        margin-bottom: var(--ha-space-2);
    }

    /* Locked control/shape overlay — its canvas hit-box is pointer-events:none
       (see _renderControlBboxItem/_renderShapeBboxItem), so this list row is
       the primary way to edit or unlock it; the dashed border/reduced opacity
       make locked items scannable at a glance. */
    .list-item-card.locked {
        opacity: 0.7;
        border-style: dashed;
    }

    /* Dialog Content */
    .dialog-content {
        display: flex;
        flex-direction: column;
        min-height: 70vh;
        max-height: 80vh;
        gap: 0;
    }

    /* Canvas Toolbar collapsed-state modifier (base .canvas-toolbar comes from studioDialogStyles) */
    .canvas-toolbar.collapsed {
        padding: 8px;
    }

    /* Zoom Level Display in Canvas Toolbar */
    .zoom-level-display {
        font-size: 14px;
        font-weight: 600;
        color: white;
        padding: 0 8px;
        min-width: 52px;
        text-align: center;
        user-select: none;
        font-family: var(--lcars-font, var(--lcars-fallback-font, 'Antonio', sans-serif));
        letter-spacing: 0.5px;
    }

    /* Tab header icon button toggles - match canvas toolbar styling */
    ha-icon-button {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        border: 2px solid transparent;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        margin: 0;
        --ha-icon-button-size: 40px;
        --mdc-icon-size: 20px;
    }

    ha-icon-button:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: var(--primary-color);
    }

    ha-icon-button.active {
        background: var(--primary-color);
        border-color: var(--primary-color);
    }

    ha-icon-button ha-icon {
        --mdc-icon-size: 20px;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    /* Zoom Controls (Floating) - MSD uses a bluish tint + border vs. the shared sheet's plain black */
    .zoom-controls {
        position: absolute;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 8px;
        align-items: center;
        background: rgba(30, 40, 60, 0.82);
        backdrop-filter: blur(8px);
        border-radius: 24px;
        padding: 8px 16px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
        z-index: 1000;
    }

    .zoom-control-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: transparent;
        border: 1px solid transparent;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s;
        flex-shrink: 0;
        padding: 0;
        color: white;
        --mdc-icon-size: 18px;
    }

    .zoom-control-btn ha-icon {
        --mdc-icon-size: 18px;
        color: white;
    }

    .zoom-control-btn:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: var(--primary-color);
    }

    .zoom-control-divider {
        width: 1px;
        height: 20px;
        background: rgba(255, 255, 255, 0.2);
        margin: 0 2px;
    }

    /* Grid Settings Popup — must sit above .canvas-toolbar (z-index: 1000),
       which opens it and can now wrap to multiple rows tall enough to
       otherwise cover this popup's top: 60px position. */
    .grid-settings-popup {
        position: absolute;
        top: 60px;
        right: 12px;
        width: 280px;
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
        z-index: 1001;
        animation: slideIn 0.2s ease;
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .grid-settings-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid var(--divider-color);
    }

    .grid-settings-content {
        padding: 16px;
        max-height: 400px;
        overflow-y: auto;
    }

    /* Split Panel Layout override - MSD uses a 33.3/66.6 config/preview ratio
       (shared studioDialogStyles defaults to 50/50) */
    .studio-layout {
        grid-template-columns: 33.3% 66.6%;
    }

    /* .preview-panel override - MSD needs plain overflow:hidden because
       d3-zoom owns pan itself; native scroll (the shared sheet's default)
       would fight the CSS transform it applies. */
    .preview-panel {
        overflow: hidden;
    }

    .preview-scroll-container {
        flex: 1;
        overflow: hidden;   /* d3-zoom owns pan — native scroll would fight the CSS transform */
        position: relative;
        padding-top: 48px;  /* Push content down below action bar */
    }

    /* Cursor feedback based on mode */
    .preview-panel.mode-view {
        cursor: default;
    }

    /* Grab cursor hints that the canvas can be panned by dragging */
    .preview-panel.mode-view .preview-scroll-container {
        cursor: grab;
    }

    /* Grabbing cursor while a pan drag is in progress (class added by d3-zoom start/end) */
    .preview-panel.mode-view .preview-scroll-container.panning {
        cursor: grabbing !important;
    }

    .preview-panel.mode-view.dragging {
        cursor: grabbing !important;
    }

    .preview-panel.mode-place_anchor,
    .preview-panel.mode-place_control {
        cursor: crosshair;
    }

    .preview-panel.mode-connect_line {
        cursor: crosshair;
    }

    .preview-panel.mode-draw_channel {
        cursor: crosshair;
    }

    .preview-panel.mode-draw_channel.drawing {
        cursor: crosshair;
    }

    .preview-panel.mode-add_waypoint {
        cursor: crosshair;
    }

    /* Tab Navigation override - MSD keeps 12px spacing below the tab group
       (shared sheet defaults to 0) */
    ha-tab-group {
        margin-bottom: 12px;
    }

    /* Card Picker Button Styling */
    .card-picker-button {
        height: 80px;
        flex-direction: column;
    }

    .card-picker-button ha-icon {
        --mdc-icon-size: 32px;
        margin-bottom: 8px;
    }

    .card-picker-button div {
        font-size: 12px;
    }

    /* Mode Status Badge */
    .mode-status {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        background: var(--primary-background-color);
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        color: var(--primary-text-color);
        margin-left: auto;
    }

    /* Line Dialog - Connection Flow Layout */
    .line-connection-flow {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        gap: 16px;
        align-items: start;
        margin: 16px 0;
    }

    .connection-source,
    .connection-target {
        min-width: 0;
    }

    .connection-arrow {
        display: flex;
        align-items: center;
        justify-content: center;
        padding-top: 32px;
        color: var(--lcars-orange);
    }

    .connection-arrow ha-icon {
        --mdc-icon-size: 32px;
    }

    /* Routing Info Panel */
    .routing-info-panel {
        margin-top: 16px;
        padding: 16px;
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 8px;
    }

    .routing-info-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        font-size: 14px;
        color: var(--primary-text-color);
        margin-bottom: 8px;
    }

    .routing-info-header ha-icon {
        --mdc-icon-size: 20px;
        color: var(--lcars-orange);
    }

    .routing-info-description {
        font-size: 13px;
        color: var(--secondary-text-color);
        line-height: 1.5;
        margin-bottom: 12px;
    }

    .routing-info-diagram {
        display: flex;
        justify-content: center;
        padding: 12px;
        background: var(--primary-background-color);
        border-radius: 4px;
    }

    .routing-info-diagram svg {
        max-width: 300px;
    }

    /* Routing 2-Column Layout */
    .routing-columns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        align-items: start;
    }

    .routing-mode-column,
    .routing-advanced-column {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    /* Interactive Bounding Boxes */
    .interactive-bbox {
        cursor: grab;
        transition: border-color 0.2s, box-shadow 0.2s;
    }

    .interactive-bbox:hover {
        border-color: #00CCFF !important;
        border-width: 3px !important;
        box-shadow: 0 0 12px rgba(0, 204, 255, 0.6);
    }

    .interactive-bbox:active {
        cursor: grabbing;
    }

    .bbox-dragging {
        cursor: grabbing !important;
        border-color: #FF9900 !important;
        border-width: 3px !important;
        box-shadow: 0 0 16px rgba(255, 153, 0, 0.8);
        opacity: 0.8;
    }

    .bbox-resizing {
        border-color: #9900FF !important;
        border-width: 3px !important;
        box-shadow: 0 0 16px rgba(153, 0, 255, 0.8);
        opacity: 0.8;
    }

    /* Locked overlay bbox is pointer-events:none (clicks fall through to
       whatever's underneath), so :hover/:active/cursor never actually
       trigger — this is purely self-documenting. */
    .bbox-locked {
        cursor: default;
    }

    /* Resize Handles */
    .resize-handle {
        position: absolute;
        background: white;
        border: 2px solid #0088FF;
        width: 10px;
        height: 10px;
        pointer-events: auto;
        z-index: 1000;
        transition: all 0.2s;
    }

    .resize-handle:hover {
        background: #00CCFF;
        border-color: #00CCFF;
        width: 12px;
        height: 12px;
        box-shadow: 0 0 8px rgba(0, 204, 255, 0.8);
    }

    .resize-handle.active {
        background: #9900FF;
        border-color: #9900FF;
        box-shadow: 0 0 12px rgba(153, 0, 255, 0.8);
    }

    /* Handle positions */
    .resize-handle.tl { top: -5px; left: -5px; cursor: nwse-resize; }
    .resize-handle.t  { top: -5px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
    .resize-handle.tr { top: -5px; right: -5px; cursor: nesw-resize; }
    .resize-handle.r  { top: 50%; right: -5px; transform: translateY(-50%); cursor: ew-resize; }
    .resize-handle.br { bottom: -5px; right: -5px; cursor: nwse-resize; }
    .resize-handle.b  { bottom: -5px; left: 50%; transform: translateX(-50%); cursor: ns-resize; }
    .resize-handle.bl { bottom: -5px; left: -5px; cursor: nesw-resize; }
    .resize-handle.l  { top: 50%; left: -5px; transform: translateY(-50%); cursor: ew-resize; }

    /* Live dimension/coordinate readout shown only while actively dragging or
       resizing a control/shape/channel — see _renderLiveCoordBadge. Matches
       the existing "Control ID label" diagnostic-badge styling (fixed blue,
       not theme-tinted — intentional: this overlays arbitrary base_svg/canvas
       content, same reasoning as anchor/bbox/route debug colors). */
    .live-coord-badge {
        position: absolute;
        background: rgba(0, 136, 255, 0.9);
        color: white;
        padding: 3px 8px;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
        pointer-events: none;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    }

    /* Interactive Anchors */
    .interactive-anchor {
        cursor: grab;
        transition: all 0.2s;
    }

    .interactive-anchor:hover {
        background: #FFFF00 !important;
        width: 16px !important;
        height: 16px !important;
        box-shadow: 0 0 12px rgba(255, 255, 0, 0.8) !important;
    }

    .interactive-anchor:active {
        cursor: grabbing;
    }

    .anchor-dragging {
        cursor: grabbing !important;
        background: #FF9900 !important;
        width: 16px !important;
        height: 16px !important;
        box-shadow: 0 0 16px rgba(255, 153, 0, 0.9) !important;
        opacity: 0.9;
    }

    /* Interactive Channels */
    .interactive-channel {
        transition: border-color 0.2s, box-shadow 0.2s;
    }

    .interactive-channel:hover {
        border-color: #00FFFF !important;
        border-width: 3px !important;
        box-shadow: 0 0 12px rgba(0, 255, 255, 0.6);
    }

    .channel-resizing {
        border-color: #9900FF !important;
        border-width: 3px !important;
        box-shadow: 0 0 16px rgba(153, 0, 255, 0.8);
        opacity: 0.8;
    }

    .channel-dragging {
        cursor: grabbing !important;
        border-color: #FF9900 !important;
        border-width: 3px !important;
        box-shadow: 0 0 16px rgba(255, 153, 0, 0.8);
        opacity: 0.8;
    }

    /* Responsive - only MSD-specific rules; .studio-layout/.config-panel
       single-column fallback comes from the shared studioDialogStyles */
    @media (max-width: 1024px) {
        .line-connection-flow {
            grid-template-columns: 1fr;
            gap: 8px;
        }

        .connection-arrow {
            padding-top: 0;
            transform: rotate(90deg);
        }

        .routing-columns {
            grid-template-columns: 1fr;
            gap: 16px;
        }
    }

    /* HA Native Card Picker Styles */
    .card-picker-container {
        min-height: 300px;
        max-height: 500px;
        overflow-y: auto;
        padding: 16px;
        background: var(--card-background-color);
        border-radius: 8px;
    }

    .card-picker-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        min-height: 200px;
        color: var(--secondary-text-color);
    }

    hui-card-picker {
        display: block;
        width: 100%;
    }

    /* HA Native Card Editor Styles */
    .card-editor-container {
        min-height: 200px;
    }

    /* Selected Card Header */
    .selected-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px;
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        transition: all 0.2s ease;
    }

    .selected-card-header:hover {
        border-color: var(--primary-color);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    /* Preview Tab Styles */
    .control-preview-panel {
        background: var(--card-background-color);
        border-radius: 8px;
        min-height: 400px;
    }

    .preview-card-wrapper {
        background: var(--primary-background-color);
        border: 2px solid var(--divider-color);
        border-radius: 12px;
        padding: 20px;
        transition: border-color 0.3s ease;
    }

    .preview-card-wrapper:hover {
        border-color: var(--primary-color);
    }

    .preview-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--divider-color);
    }

    .preview-footer {
        padding-top: 12px;
        border-top: 1px solid var(--divider-color);
        font-size: 12px;
        color: var(--secondary-text-color);
        text-align: center;
    }

    /* Channel Suggestion Panel */
    .channel-suggestion-panel {
        margin-top: 16px;
        padding: 12px;
        background: rgba(0, 255, 170, 0.1);
        border: 1px solid rgba(0, 255, 170, 0.3);
        border-radius: 4px;
    }

    .channel-suggestion-header {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
    }

    .channel-suggestion-header ha-icon {
        color: #00FFAA;
        margin-right: 8px;
        --mdc-icon-size: 20px;
    }

    .channel-suggestion-title {
        margin: 0;
        color: #00FFAA;
        font-size: 14px;
        font-weight: 600;
    }

    .channel-suggestion-description {
        margin-bottom: 12px;
        font-size: 13px;
        color: var(--secondary-text-color);
    }

    .channel-suggestion-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
    }

    .channel-suggestion-actions ha-button[primary] {
        --primary-color: #00FFAA;
    }

    .channel-suggestion-affected-lines {
        margin-top: 8px;
        font-size: 11px;
        color: var(--disabled-text-color);
    }

    /* Waypoint Markers (Visual Editing) */
    .waypoint-marker {
        cursor: grab;
        transition: all 0.15s ease;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
    }

    .waypoint-marker:hover {
        filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.6));
    }

    .waypoint-marker.editing {
        cursor: grab;
    }

    .waypoint-marker.dragging {
        cursor: grabbing;
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.8));
    }

    .waypoint-marker circle {
        stroke-width: 2;
    }

    .waypoint-marker:hover circle {
        stroke-width: 3;
    }

    .waypoint-marker.dragging circle {
        stroke-width: 4;
    }

    /* Corner-Radius Handles (Visual Editing) — visuals are inline (see
       _renderCornerRadiusHandles), same as .waypoint-marker; these just add
       the hover/drag transition/shadow polish that div's inline style block
       doesn't cover. */
    .corner-radius-handle {
        transition: all 0.15s ease;
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
    }

    .corner-radius-handle:hover {
        filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.6));
    }

    .corner-radius-handle.dragging {
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.8));
    }

    /* Line paths should capture pointer events for hover/click */
    .line-path {
        pointer-events: auto !important;
    }

    /* Selected line highlighting for waypoint editing */
    .line-path.line-selected {
        filter: drop-shadow(0 0 8px var(--lcars-blue)) drop-shadow(0 0 4px var(--lcars-blue)) !important;
        stroke-width: 4 !important;
    }

    /* Hover effect for lines - same intensity as selection for visibility */
    .line-path:hover {
        filter: drop-shadow(0 0 8px var(--lcars-blue)) drop-shadow(0 0 4px var(--lcars-blue)) !important;
        stroke-width: 4 !important;
        cursor: pointer;
    }

    /* Don't apply hover when already selected */
    .line-path.line-selected:hover {
        filter: drop-shadow(0 0 8px var(--lcars-blue)) drop-shadow(0 0 4px var(--lcars-blue)) !important;
        stroke-width: 4 !important;
    }

    /* Crosshair cursor when in ADD_WAYPOINT mode */
    .preview-container[data-mode="add-waypoint"] {
        cursor: crosshair !important;
    }

    .preview-container[data-mode="add-waypoint"] * {
        cursor: crosshair !important;
    }
`,Or=nt`
    /* Dialog sizing - canonical subform size, adopted from the line-edit form */
    .subform-dialog {
        --ha-dialog-width-md: 90vw;
        --ha-dialog-min-height: 80vh;
        --ha-dialog-max-height: 80vh;
    }

    /* Split Layout: config content (left) + live preview (right) */
    .subform-layout {
        display: grid;
        grid-template-columns: 70% 30%;
        height: 70vh;
        overflow: hidden;
    }

    .subform-config {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-right: var(--ha-border-width-md) solid var(--divider-color);
    }

    .subform-tabs {
        padding: 0 var(--ha-space-4);
        flex-shrink: 0;
    }

    .subform-tab-content {
        flex: 1;
        overflow-y: auto;
        padding: var(--ha-space-4);
    }

    .subform-preview {
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    /* Modifier for previews that are bare content (e.g. an SVG) needing the
       panel itself to supply background/padding - the line-edit form's case. */
    .subform-preview.padded {
        padding: var(--ha-space-4);
        background: var(--secondary-background-color);
    }

    /* Modifier for forms whose preview should stay in view while the config
       column scrolls (e.g. the control-edit form) rather than matching the
       line-edit form's fixed-height side-by-side split. Its preview content
       already boxes itself (background/border/padding), so this modifier
       intentionally does not add its own padding/background. */
    .subform-preview.sticky {
        overflow-y: auto;
        position: sticky;
        top: 0;
        height: fit-content;
    }

    .subform-preview-label {
        font-size: var(--ha-font-size-m);
        font-weight: 600;
        margin-bottom: var(--ha-space-3);
        color: var(--primary-text-color);
    }

    /* Wraps a live card preview (card editor sub-form, and the control form's
       own card preview) - background matches HA's own .element-preview
       treatment in hui-dialog-edit-card; padding is more generous than HA's
       (4px) since a small padded card reads as cramped inside Studio's larger
       preview panes. Shared by both preview surfaces so they look consistent
       with each other, not just with HA. Distinct from .subform-preview.padded's
       --secondary-background-color (used by the line editor's SVG canvas),
       which should not change. */
    .card-editor-preview-surface {
        background: var(--primary-background-color);
        padding: var(--ha-space-6);
        border-radius: var(--ha-border-radius-md);
    }

    /* Vertical stack of fields with consistent spacing - replaces the
       repeated inline style="display:flex;flex-direction:column;gap:16px"
       (and per-field style="margin-top:12px") pattern in subform tab content */
    .subform-field-stack {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-4);
    }

    .subform-field-stack > * {
        margin-top: 0;
    }

    /* Two-column layout for subform tab content (distinct from editorStyles'
       .form-row.two-controls, which is sized/spaced for compact config-panel
       field rows rather than a pair of full lcards-form-section blocks) */
    .subform-columns-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--ha-space-4);
        align-items: start;
    }

    /* A primary control with a secondary control stacked below it (e.g. a
       position picker paired with a small numeric gap input) - distinct
       from editorStyles' .form-row.two-controls (even 50/50 split). Always
       stacked, not side-by-side: this only ever appears inside a
       .connection-source/.connection-target column (already squeezed to
       ~1/3 of the dialog width by .line-connection-flow's 3-column grid),
       where a fixed 120px second column routinely overflowed past the
       picker's own minimum width. */
    .subform-row-aside {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--ha-space-3);
        align-items: start;
    }

    @media (max-width: 1024px) {
        .subform-layout {
            grid-template-columns: 1fr;
            height: auto;
        }

        .subform-config {
            border-right: none;
            border-bottom: var(--ha-border-width-md) solid var(--divider-color);
        }

        .subform-columns-2 {
            grid-template-columns: 1fr;
        }
    }
`,qt=class qt2{constructor(e){this.dialog=e,this._cardPickerLoadThrottle=null,this._isLoaded=false}async ensureComponentsLoaded(){let t=0;if(customElements.get("hui-card-picker"))return this._isLoaded=true,true;for(m.debug("[MSDCardPickerManager] 🔄 Attempting to load card picker...");!customElements.get("hui-card-picker")&&t<10;){m.debug(`[MSDCardPickerManager] Load attempt ${t+1}/10`);try{if(await this.loadCustomElements(),customElements.get("hui-card-picker"))return this._isLoaded=true,m.debug(`[MSDCardPickerManager] ✅ Card picker loaded after ${t+1} attempts`),true}catch(i){m.trace("[MSDCardPickerManager] Load attempt failed:",i)}await new Promise(i=>setTimeout(i,100)),t++}return this._isLoaded||(m.info("[MSDCardPickerManager] ℹ️ Card picker not available"),m.info('[MSDCardPickerManager] 💡 To enable: Close this dialog, click dashboard "Add Card" button, then cancel and reopen MSD Studio')),false}async loadCustomElements(){var e;if(customElements.get("hui-card-picker")){m.debug("[MSDCardPickerManager] hui-card-picker already available");return}try{let t=document.querySelector("home-assistant");if(!t){m.trace("[MSDCardPickerManager] home-assistant element not found");return}if(t=t.shadowRoot,!t){m.trace("[MSDCardPickerManager] home-assistant shadowRoot not found");return}if(t=t.querySelector("home-assistant-main"),t=t&&t.shadowRoot,t=t&&t.querySelector("app-drawer-layout partial-panel-resolver, ha-drawer partial-panel-resolver"),t=t&&t.shadowRoot||t,t=t&&t.querySelector("ha-panel-lovelace"),!t){m.trace("[MSDCardPickerManager] ha-panel-lovelace not found in shadow DOM");return}if(t=t.shadowRoot,t=t&&t.querySelector("hui-root"),!t){m.trace("[MSDCardPickerManager] hui-root not found");return}const i=t.shadowRoot,o=i||t,s=[o.querySelector("hui-view"),o.querySelector("hui-sections-view"),o.querySelector("hui-grid-section"),o.querySelector("hui-section")].filter(Boolean);if(m.trace("[MSDCardPickerManager] hui-root shadowRoot:",!!i),m.trace("[MSDCardPickerManager] Found view elements:",s.map(c=>c.tagName).join(", ")),s.length===0){m.trace("[MSDCardPickerManager] No view elements found - trying to fire on hui-root directly");const c=new CustomEvent("ll-create-card",{bubbles:true,composed:true,cancelable:true,detail:{suggested:["lcards-button","lcards-slider","lcards-elbow","lcards-chart","lcards-data-grid"]}});t.dispatchEvent(c),c.stopPropagation(),c.preventDefault(),await new Promise(d=>setTimeout(d,150)),customElements.get("hui-card-picker")&&m.debug("[MSDCardPickerManager] ✅ hui-card-picker loaded via ll-create-card on hui-root");return}for(const c of s){m.trace(`[MSDCardPickerManager] Firing ll-create-card on ${c.tagName}...`);const d=new CustomEvent("ll-create-card",{bubbles:true,composed:true,cancelable:true,detail:{suggested:["lcards-button","lcards-slider","lcards-elbow","lcards-chart","lcards-data-grid"]}});c.dispatchEvent(d)}const r=document.querySelector("home-assistant"),a=20;let l=false;for(let c=0;c<a&&!l;c++){await new Promise(h=>setTimeout(h,50));const d=(e=r==null?void 0:r.shadowRoot)==null?void 0:e.querySelector("hui-dialog-create-card");if(d){m.trace(`[MSDCardPickerManager] Found hui-dialog-create-card (attempt ${c+1}), closing it...`),typeof d.closeDialog=="function"?d.closeDialog():d.close?d.close():d.opened!==void 0&&(d.opened=false);try{d.remove(),m.trace("[MSDCardPickerManager] Removed hui-dialog-create-card from DOM")}catch(h){m.trace("[MSDCardPickerManager] Could not remove dialog:",h.message)}l=true}}l||m.trace("[MSDCardPickerManager] hui-dialog-create-card never appeared within the poll window"),await new Promise(c=>setTimeout(c,100)),customElements.get("hui-card-picker")?m.debug("[MSDCardPickerManager] ✅ hui-card-picker loaded via ll-create-card event"):m.trace("[MSDCardPickerManager] hui-card-picker not loaded after event")}catch(t){m.trace("[MSDCardPickerManager] loadCustomElements failed:",t.message)}}isLoaded(){return this._isLoaded}cleanup(){this._cardPickerLoadThrottle&&(clearTimeout(this._cardPickerLoadThrottle),this._cardPickerLoadThrottle=null),m.debug("[MSDCardPickerManager] 🧹 Cleanup complete")}};u(qt,"MSDCardPickerManager");let kt=qt;const Nt=class Nt2{constructor(e){this.dialog=e,this._boundCardPickerHandler=null,this._boundDialogClosedHandler=null,this._boundElementEditorHandler=null,this._elementEditSession={active:false,timestamp:null,savedState:null},this._lastElementEditorLogTime=0,this._elementEditorLogThrottle=1e3}setupEventInterception(){this._boundCardPickerHandler=e=>{var t,i,o;if(this._isElementEditorEvent(e)){m.debug("[MSDEventInterceptor] Element editor event, allowing propagation"),this._elementEditSession.active=true,this._elementEditSession.timestamp=Date.now();return}if(e.type==="config-changed"&&((t=e.detail)!=null&&t.config)&&((o=(i=e.target)==null?void 0:i.tagName)==null?void 0:o.toLowerCase())==="hui-card-picker"){const s=e.composedPath?e.composedPath():[];if(this._isEventFromOurStudio(s))return m.debug("[MSDEventInterceptor] 🎯 Card picker selection captured:",e.detail.config.type),e.stopImmediatePropagation&&e.stopImmediatePropagation(),e.stopPropagation(),this.dialog._handleCardPickerSelection(e.detail.config),false}},this._boundDialogClosedHandler=e=>{var t,i;if(((t=e.target)==null?void 0:t.tagName)==="HUI-DIALOG-EDIT-CARD"){const o=e.target;(i=this.dialog._activeChildEditors)!=null&&i.has(o)&&(m.debug("[MSDEventInterceptor] 🔒 Child editor closed"),this.dialog._activeChildEditors.delete(o),o._handlingElementEdit&&setTimeout(()=>{this._elementEditSession.active&&Date.now()-this._elementEditSession.timestamp>500&&(this._elementEditSession.active=false)},500),this.dialog.requestUpdate())}},this._boundElementEditorHandler=e=>{(e.type==="element-updated"||e.type==="show-edit-element")&&!this._elementEditSession.active&&(m.debug("[MSDEventInterceptor] 🎨 Element editor session started"),this._elementEditSession.active=true,this._elementEditSession.timestamp=Date.now())},document.addEventListener("config-changed",this._boundCardPickerHandler,{capture:true}),document.addEventListener("dialog-closed",this._boundDialogClosedHandler,{capture:true}),document.addEventListener("element-updated",this._boundElementEditorHandler,{capture:true}),document.addEventListener("show-edit-element",this._boundElementEditorHandler,{capture:true}),m.debug("[MSDEventInterceptor] ✅ Event interception setup complete")}_isElementEditorEvent(e){if(!e)return false;const t=Date.now(),i=t-this._lastElementEditorLogTime>this._elementEditorLogThrottle;if(e.detail&&(e.detail.fromElementEditor||e.detail.elementConfig||e.detail.elementToEdit||e.detail.element))return i&&(m.debug("[MSDEventInterceptor] 🔍 Element editor detected via event detail"),this._lastElementEditorLogTime=t),true;const o=e.composedPath?e.composedPath():[];for(const s of o)if(!(!s||!s.localName)&&(s.localName==="hui-element-editor"||s.localName==="hui-dialog-edit-element"||s.localName==="hui-card-element-editor"||s.localName.includes("element-editor")))return i&&(m.debug("[MSDEventInterceptor] 🔍 Element editor detected via path:",s.localName),this._lastElementEditorLogTime=t),true;return!!(this._elementEditSession.active&&Date.now()-this._elementEditSession.timestamp<5e3)}_isEventFromOurStudio(e){return e.some(t=>t===this.dialog||t.shadowRoot&&t.shadowRoot.contains(this.dialog)||this.dialog.shadowRoot&&this.dialog.shadowRoot.contains(t))}cleanupEventInterception(){this._boundCardPickerHandler&&document.removeEventListener("config-changed",this._boundCardPickerHandler,{capture:true}),this._boundDialogClosedHandler&&document.removeEventListener("dialog-closed",this._boundDialogClosedHandler,{capture:true}),this._boundElementEditorHandler&&(document.removeEventListener("element-updated",this._boundElementEditorHandler,{capture:true}),document.removeEventListener("show-edit-element",this._boundElementEditorHandler,{capture:true})),m.debug("[MSDEventInterceptor] 🧹 Event interception cleanup complete")}};u(Nt,"MSDEventInterceptor");let Dt=Nt;const N={VIEW:"view",PLACE_ANCHOR:"place_anchor",PLACE_CONTROL:"place_control",CONNECT_LINE:"connect_line",DRAW_CHANNEL:"draw_channel",ADD_WAYPOINT:"add_waypoint",DRAW_SHAPE:"draw_shape"},Me=60,J={BASE_SVG:"base_svg",ANCHORS:"anchors",CONTROLS:"controls",LINES:"lines",SHAPES:"shapes",ROUTING:"routing",YAML:"yaml"},Ot=class Ot2 extends At{static get properties(){return{hass:{type:Object},lovelace:{type:Object},_initialConfig:{type:Object},_workingConfig:{type:Object,state:true},_activeTab:{type:String,state:true},_activeMode:{type:String,state:true},_validationErrors:{type:Array,state:true},_debugSettings:{type:Object,state:true},_viewBoxMode:{type:String,state:true},_svgSourceMode:{type:String,state:true},_extractedViewBox:{type:Array,state:true},_customFiltersEnabled:{type:Boolean,state:true},_showAnchorForm:{type:Boolean,state:true},_editingAnchorName:{type:String,state:true},_anchorFormName:{type:String,state:true},_anchorFormPosition:{type:Array,state:true},_anchorFormUnit:{type:String,state:true},_showGrid:{type:Boolean,state:true},_showGridSettings:{type:Boolean,state:true},_gridSpacing:{type:Number,state:true},_snapToGrid:{type:Boolean,state:true},_cursorPosition:{type:Object,state:true},_highlightedAnchor:{type:String,state:true},_highlightedControl:{type:String,state:true},_highlightedLine:{type:String,state:true},_highlightedChannel:{type:String,state:true},_canvasToolbarExpanded:{type:Boolean,state:true},_showCrosshairs:{type:Boolean,state:true},_enableSnapping:{type:Boolean,state:true},_showAnchorMarkers:{type:Boolean,state:true},_showBoundingBoxes:{type:Boolean,state:true},_showRoutingPaths:{type:Boolean,state:true},_showRoutingChannels:{type:Boolean,state:true},_showAttachmentPoints:{type:Boolean,state:true},_showRoutingGrid:{type:Boolean,state:true},_showTrunks:{type:Boolean,state:true},_baseSvgPreviewDimmed:{type:Boolean,state:true},_liveInteractionEnabled:{type:Boolean,state:true},_altKeyHeld:{type:Boolean,state:true},_editModeAutoShown:{type:Object,state:true},_showControlForm:{type:Boolean,state:true},_editingControlId:{type:String,state:true},_controlFormId:{type:String,state:true},_controlFormPosition:{type:Array,state:true},_controlFormSize:{type:Array,state:true},_controlFormAttachment:{type:String,state:true},_controlFormPositionSide:{type:String,state:true},_controlFormObstacle:{type:Boolean,state:true},_controlFormZIndex:{type:Number,state:true},_controlFormLocked:{type:Boolean,state:true},_controlFormCard:{type:Object,state:true},_controlFormAnimations:{type:Array,state:true},_controlFormActiveSubtab:{type:String,state:true},_showCardEditorForm:{type:Boolean,state:true},_cardEditorTempConfig:{type:Object,state:true},_showLineForm:{type:Boolean,state:true},_editingLineId:{type:String,state:true},_lineFormData:{type:Object,state:true},_lineFormActiveSubtab:{type:String,state:true},_connectLineState:{type:Object,state:true},_selectedLineIds:{type:Object,state:true},_showShapeForm:{type:Boolean,state:true},_editingShapeId:{type:String,state:true},_shapeFormData:{type:Object,state:true},_shapeFormActiveSubtab:{type:String,state:true},_drawShapeState:{type:Object,state:true},_selectedShapeId:{type:String,state:true},_shapeDragState:{type:Object,state:true},_shapeResizeState:{type:Object,state:true},_shapeVertexDragState:{type:Object,state:true},_selectedShapeIds:{type:Object,state:true},_bulkEditKind:{type:String,state:true},_bulkEditTargetIds:{type:Array,state:true},_bulkEditSnapshot:{type:Object,state:true},_shieldBubbleState:{type:Object,state:true},_editingChannelId:{type:String,state:true},_channelFormData:{type:Object,state:true},_dragState:{type:Object,state:true},_draggedWaypointIndex:{type:Number,state:true},_resizeState:{type:Object,state:true},_anchorDragState:{type:Object,state:true},_channelResizeState:{type:Object,state:true},_lineEndpointDragState:{type:Object,state:true},_selectedLineId:{type:String,state:true},_waypointEditingLineId:{type:String,state:true},_waypointDragState:{type:Object,state:true},_cornerRadiusDragState:{type:Object,state:true},_showWaypointMarkers:{type:Boolean,state:true},_clickTimeout:{type:Number,state:true},_previewZoom:{type:Number,state:true},_currentZoom:{type:Number,state:true},_zoomBehavior:{type:Object,state:true},_zoomSvg:{type:Object,state:true},_haComponentsAvailable:{type:Boolean,state:true}}}constructor(){super(),m.debug("[MSDStudio] Constructor called"),this.hass=null,this._initialConfig=null,this._workingConfig={},this._activeTab=J.BASE_SVG,this._activeMode=N.VIEW,this._validationErrors=[],this._cardPickerRequestId=0,this._pendingCardPickerRequests=new Map,this._baseSvgPerformanceExpanded=null,this._debugSettings={anchors:true,bounding_boxes:true,attachment_points:false,routing_channels:false,line_paths:true,show_coordinates:false,grid_color:"#cccccc",grid_opacity:.3,debug_scale:1,auto_refresh:true,interactive_preview:false,anchor_color:"#00FFFF",bbox_color:"#FFA500",attachment_color:"#00FF00",bundling_color:"#00FF00",avoiding_color:"#FF0000",waypoint_color:"#0000FF"},this._previewUpdateTimer=null,this._previewReadyRafHandle=null,this._viewBoxMode="auto",this._extractedViewBox=null,this._svgSourceMode="asset",this._customFiltersEnabled=false,this._showAnchorForm=false,this._editingAnchorName=null,this._anchorFormName="",this._anchorFormPosition=[0,0],this._anchorFormUnit="vb",this._showGrid=true,this._showGridSettings=false,this._gridSpacing=50,this._snapToGrid=false,this._showCrosshairs=true,this._cursorPosition=null,this._highlightedAnchor=null,this._showAnchorMarkers=false,this._anchorFilterQuery="",this._showBoundingBoxes=false,this._showRoutingPaths=false,this._showRoutingChannels=false,this._showRoutingGrid=false,this._showTrunks=false,this._baseSvgPreviewDimmed=false,this._liveInteractionEnabled=true,this._altKeyHeld=false,this._editModeAutoShown=null,this._previewZoom=1,this._currentZoom={x:0,y:0,k:1},this._zoomBehavior=null,this._zoomContainer=null,this._zoomWrapper=null,this._zoomBaseWidth=0,this._zoomBaseHeight=0,this._fitPending=false,this._panJustEnded=false,this._zoomGestureStartTransform=null,this._showControlForm=false,this._editingControlId=null,this._placeControlDrawState={startPoint:null,currentPoint:null,drawing:false},this._controlDrawDragCandidate=null,this._controlFormId="",this._controlFormPosition=[0,0],this._controlFormSize=[100,100],this._controlFormAttachment="center",this._controlFormPositionSide="center",this._controlFormObstacle=true,this._controlFormZIndex=null,this._controlFormLocked=false,this._controlFormTriggersUpdateMode="specific",this._controlFormTriggersUpdateEntities=[],this._controlFormTriggersUpdateExpanded=false,this._controlFormCard={type:""},this._controlFormActiveSubtab="placement",this._showCardEditorForm=false,this._cardEditorTempConfig=null,this._showLineForm=false,this._editingLineId=null,this._waypointEditingLineId=null,this._waypointDragState=null,this._cornerRadiusDragState=null,this._showWaypointMarkers=true,this._lineFormData={id:"",anchor:"",attach_to:"",anchor_side:"center",attach_side:"center",route:"auto",style:{color:"var(--lcars-orange)",width:2,dash_array:"",marker_end:null}},this._lineFormActiveSubtab="basic",this._connectLineState={source:null,tempLineElement:null},this._selectedLineIds=new Set,this._bulkEditKind=null,this._bulkEditTargetIds=null,this._bulkEditSnapshot=null,this._showShapeForm=false,this._editingShapeId=null,this._shapeFormData={id:"",kind:"rect",position:[0,0],size:[100,60],points:[],closed:false,entity:"",state_attribute:"",ranges_attribute:"",z_index:null,locked:false,corner_style:"round",corner_radius:8,corner_angle:45,smoothing_mode:"none",smoothing_iterations:0,animations:[],style:{color:{default:"var(--lcars-orange)"},width:2,opacity:1,dash_array:"",fill:{default:"none"},fill_opacity:1,line_cap:"butt",line_join:"",miter_limit:4}},this._shapeFormActiveSubtab="geometry",this._drawShapeState={kind:null,points:[],drawing:false,currentPoint:null},this._shapeDrawDragCandidate=null,this._shieldBubbleState=this._defaultShieldBubbleState(),this._selectedShapeId=null,this._selectedShapeIds=new Set,this._shapeDragState={active:false,shapeId:null,startPos:null,originalPos:null,offsetX:0,offsetY:0},this._shapeResizeState={active:false,shapeId:null,handle:null,startPos:null,startSize:null,startPosition:null},this._shapeVertexDragState=null,this._editingChannelId=null,this._channelFormData={id:"",mode:"prefer",direction:"auto",bounds:[0,0,100,50],weight:.5,line_spacing:8,discoverable:true},this._drawChannelState={startPoint:null,currentPoint:null,drawing:false,tempRectElement:null},this._channelDrawDragCandidate=null,this._dragState={active:false,controlId:null,startPos:null,originalPos:null,offsetX:0,offsetY:0},this._resizeState={active:false,controlId:null,handle:null,startPos:null,startSize:null,startPosition:null},this._anchorDragState={active:false,anchorName:null,startPos:null,originalPos:null},this._channelResizeState={active:false,channelId:null,handle:null,startPos:null,startBounds:null},this._channelDragState={active:false,channelId:null,startPos:null,startBounds:null},this._lineEndpointDragState={active:false,lineId:null,endpoint:null,startPos:null,originalTarget:null},this._haComponentsAvailable=false,this._cardConfigMode="graphical",this._cardPickerManager=null,this._eventInterceptor=null,this._activeChildEditors=new Set,m.debug("[MSDStudio] Initialized")}get config(){return this._workingConfig}set config(e){this._initialConfig=e,(!this._workingConfig||Object.keys(this._workingConfig).length===0)&&(this._workingConfig=JSON.parse(JSON.stringify(e||{})))}connectedCallback(){super.connectedCallback(),this._workingConfig=JSON.parse(JSON.stringify(this._initialConfig||{})),this._workingConfig.type||(this._workingConfig.type="custom:lcards-msd"),this._workingConfig.msd||(this._workingConfig.msd={}),this._cardPickerManager=new kt(this),this._eventInterceptor=new Dt(this),this._eventInterceptor.setupEventInterception(),setTimeout(async()=>{try{await this._cardPickerManager.ensureComponentsLoaded()}catch{m.debug("[MSDStudio] Warning: Could not load card picker components")}this._cardPickerManager.isLoaded()?(m.debug("[MSDStudio] ✅ Card picker loaded successfully"),this.requestUpdate()):m.debug("[MSDStudio] ⚠️ Card picker not available, using manual config")},50),this._boundKeyDownHandler=this._handleKeyDown.bind(this),window.addEventListener("keydown",this._boundKeyDownHandler,true),this._boundMouseUpHandler=this._handleDragEnd.bind(this),document.addEventListener("mouseup",this._boundMouseUpHandler),this._boundCardPickerResultHandler=this._handleCardPickerResult.bind(this),document.addEventListener("card-picker-result",this._boundCardPickerResultHandler),m.debug("[MSDStudio] Listening for card-picker-result events from editor"),this._detectSvgSourceMode(),this._detectViewBoxMode(),this._autoExtractViewBox(),this._haComponentsAvailable=!!customElements.get("hui-card-element-editor"),m.debug("[MSDStudio] Component availability:",{editor:!!customElements.get("hui-card-element-editor"),picker:!!customElements.get("hui-card-picker")}),m.debug("[MSDStudio] Opened with config:",this._workingConfig),this.updateComplete.then(()=>this._schedulePreviewUpdate())}disconnectedCallback(){var t,i,o;super.disconnectedCallback(),this._previewUpdateTimer&&clearTimeout(this._previewUpdateTimer),this._previewReadyRafHandle&&(cancelAnimationFrame(this._previewReadyRafHandle),this._previewReadyRafHandle=null),(t=this._eventInterceptor)==null||t.cleanupEventInterception(),(i=this._cardPickerManager)==null||i.cleanup(),this._boundKeyDownHandler&&window.removeEventListener("keydown",this._boundKeyDownHandler,true),this._boundMouseUpHandler&&document.removeEventListener("mouseup",this._boundMouseUpHandler),this._boundCardPickerResultHandler&&document.removeEventListener("card-picker-result",this._boundCardPickerResultHandler);const e=[["_boundDragMouseMove","mousemove"],["_boundDragMouseUp","mouseup"],["_boundResizeMouseMove","mousemove"],["_boundResizeMouseUp","mouseup"],["_boundAnchorDragMouseMove","mousemove"],["_boundAnchorDragMouseUp","mouseup"],["_boundChannelDragMouseMove","mousemove"],["_boundChannelDragMouseUp","mouseup"],["_boundChannelResizeMouseMove","mousemove"],["_boundChannelResizeMouseUp","mouseup"],["_boundShapeDragMouseMove","mousemove"],["_boundShapeDragMouseUp","mouseup"],["_boundShapeResizeMouseMove","mousemove"],["_boundShapeResizeMouseUp","mouseup"],["_boundShapeVertexMouseMove","mousemove"],["_boundShapeVertexMouseUp","mouseup"],["_boundWaypointMouseMove","mousemove"],["_boundWaypointMouseUp","mouseup"],["_boundCornerRadiusMouseMove","mousemove"],["_boundCornerRadiusMouseUp","mouseup"]];for(const[s,r]of e)this[s]&&(document.removeEventListener(r,this[s]),this[s]=null);(o=this._baseSvgDimObserver)==null||o.disconnect(),this._baseSvgDimObserver=null}async firstUpdated(e){super.firstUpdated(e),m.debug("[MSDStudio] firstUpdated called"),await this.updateComplete,m.debug("[MSDStudio] updateComplete, scheduling zoom init"),requestAnimationFrame(()=>{m.debug("[MSDStudio] requestAnimationFrame fired, calling _initializeZoom"),this._initializeZoom()})}updated(e){super.updated(e),e.has("_workingConfig")&&requestAnimationFrame(()=>{this._reinitializeZoomIfNeeded(),this._applyBaseSvgPreviewDimming()})}_applyBaseSvgPreviewDimming(e=10){var r,a,l;const t=(r=this.shadowRoot)==null?void 0:r.querySelector("lcards-msd-live-preview"),i=(a=t==null?void 0:t.shadowRoot)==null?void 0:a.querySelector(".preview-card-container"),o=i==null?void 0:i.querySelector("lcards-msd-card"),s=(l=(o==null?void 0:o.shadowRoot)||(o==null?void 0:o.renderRoot))==null?void 0:l.querySelector("#__msd-base-content");s?s.style.opacity=this._baseSvgPreviewDimmed?"0.15":"":e>0&&setTimeout(()=>this._applyBaseSvgPreviewDimming(e-1),200),i&&!this._baseSvgDimObserver&&(this._baseSvgDimObserver=new MutationObserver(()=>{requestAnimationFrame(()=>this._applyBaseSvgPreviewDimming())}),this._baseSvgDimObserver.observe(i,{childList:true}))}_reinitializeZoomIfNeeded(){const e=this._getCurrentZoomContainer();if(e&&(!this._zoomContainer||e!==this._zoomContainer)){m.debug("[MSDStudio] Zoom container changed, re-initializing zoom");const t=this._getZoomTransform();this._initializeZoom(),t&&t.k!==1&&this._zoomBehavior&&this._zoomContainer&&ee(this._zoomContainer).call(this._zoomBehavior.transform,Ee.translate(t.x,t.y).scale(t.k))}}_getCurrentZoomContainer(){const e=this.shadowRoot.querySelector(".preview-panel");return e?e.querySelector(".preview-scroll-container"):null}_initializeZoom(){m.debug("[MSDStudio][ZOOM] _initializeZoom called");const e=this.shadowRoot.querySelector(".preview-panel");if(!e){m.warn("[MSDStudio] Preview panel not found for zoom initialization");return}m.debug("[MSDStudio][ZOOM] Found preview panel");const t=e.querySelector(".preview-scroll-container");if(!t){m.warn("[MSDStudio] Preview scroll container not found for zoom initialization");return}m.debug("[MSDStudio][ZOOM] Found scroll container");const i=t.querySelector(".msd-zoom-wrapper");if(!i){m.warn("[MSDStudio] Zoomable wrapper not found for zoom initialization");return}m.debug("[MSDStudio][ZOOM] Found zoomable wrapper");const{width:o,height:s}=this._previewNaturalSize;this._zoomBaseWidth=o,this._zoomBaseHeight=s,this._zoomBehavior=Tr().scaleExtent([.25,10]).filter(r=>{var l;return["place_anchor","place_control","draw_channel","connect_line"].includes(this._activeMode)?false:r.type==="wheel"||r.type==="touchstart"&&((l=r.touches)==null?void 0:l.length)===2?true:r.type==="mousedown"?!!(r.button===1||r.button===0&&r.shiftKey||r.button===0&&this._activeMode===N.VIEW):false}).on("zoom",r=>{const a=r.transform;i.style.transform=`translate(${a.x}px, ${a.y}px) scale(${a.k})`,i.style.transformOrigin="top left",this._currentZoom={x:a.x,y:a.y,k:a.k},this.requestUpdate(),m.trace("[MSDStudio][ZOOM] Transform applied:",{x:a.x,y:a.y,k:a.k})}).on("start",r=>{this._zoomContainer&&this._zoomContainer.classList.add("panning"),this._zoomGestureStartTransform=r.transform}).on("end",r=>{this._zoomContainer&&this._zoomContainer.classList.remove("panning");const a=this._zoomGestureStartTransform,l=r.transform,c=!a||a.x!==l.x||a.y!==l.y||a.k!==l.k;this._zoomGestureStartTransform=null,c&&(this._panJustEnded=true,setTimeout(()=>{this._panJustEnded=false},0)),this.requestUpdate(),m.trace("[MSDStudio] Zoom/pan ended, refreshing overlays")}),ee(t).call(this._zoomBehavior),this._zoomContainer=t,this._zoomWrapper=i,m.debug("[MSDStudio][ZOOM] Zoom initialization complete with scroll sync"),m.info("[MSDStudio] 🔍 Zoom behavior initialized on preview container"),this._fitPending||(this._fitPending=true,setTimeout(()=>{this._fitPending=false,this._fitToViewport()},400))}get _previewNaturalSize(){var i,o;const e=((o=(i=this._workingConfig)==null?void 0:i.msd)==null?void 0:o.view_box)||this._extractedViewBox;if(Array.isArray(e)&&e.length>=4&&e[2]>0&&e[3]>0)return{width:e[2],height:e[3]};const t=this._getPreviewSvgAndViewBox();return t?{width:t.viewBoxWidth,height:t.viewBoxHeight}:{width:1920,height:1080}}_fitToViewport(){if(!this._zoomBehavior||!this._zoomContainer)return;const e=this._zoomContainer.getBoundingClientRect(),t=parseFloat(getComputedStyle(this._zoomContainer).paddingTop)||0,i=e.width,o=e.height-t;if(!i||!o)return;const{width:s,height:r}=this._previewNaturalSize;this._zoomBaseWidth=s,this._zoomBaseHeight=r;const a=Math.min(1,(i-32)/s,(o-32)/r),l=(i-s*a)/2,c=Math.max(16,(o-r*a)/2);ee(this._zoomContainer).call(this._zoomBehavior.transform,Ee.translate(l,c).scale(a)),this.requestUpdate(),m.debug("[MSDStudio][ZOOM] Fit to viewport applied:",{k:a,tx:l,ty:c,natW:s,natH:r,availW:i,availH:o})}_zoomReset(){this._reinitializeZoomIfNeeded(),!(!this._zoomBehavior||!this._zoomContainer)&&(ee(this._zoomContainer).transition().duration(500).call(this._zoomBehavior.transform,Ee),setTimeout(()=>this.requestUpdate(),550))}_getZoomTransform(){return this._zoomContainer?ee(this._zoomContainer).property("__zoom")||{x:0,y:0,k:1}:{x:0,y:0,k:1}}static get styles(){return[Qi,ji,eo,Nr,Or,to,io]}async _setMode(e){var t;if(m.debug(`[MSDStudio] _setMode ENTRY: ${this._activeMode} → ${e}`),this._activeMode===e?(m.debug(`[MSDStudio] _setMode: Toggling off mode ${e}`),this._activeMode=N.VIEW):(m.debug(`[MSDStudio] _setMode: Activating mode ${e}`),this._activeMode=e),this._activeMode!==N.DRAW_CHANNEL&&(this._drawChannelState={startPoint:null,currentPoint:null,drawing:false,tempRectElement:null},this._channelDrawDragCandidate=null),this._activeMode!==N.CONNECT_LINE&&(this._connectLineState={source:null,tempLineElement:null}),this._activeMode!==N.PLACE_CONTROL&&(this._placeControlDrawState={startPoint:null,currentPoint:null,drawing:false},this._controlDrawDragCandidate=null),this._activeMode!==N.DRAW_SHAPE&&(this._drawShapeState={kind:null,points:[],drawing:false,currentPoint:null},this._shapeDrawDragCandidate=null),this._activeMode!==N.ADD_WAYPOINT&&this._showWaypointMarkers){if(m.debug("[MSDStudio] _setMode: Clearing waypoint markers"),this._showWaypointMarkers=false,this._selectedLineId&&((t=this._workingConfig.msd)!=null&&t.overlays)){const i=this._workingConfig.msd.overlays.find(o=>o.id===this._selectedLineId);i&&delete i._editorSelected}this._selectedLineId=null}m.debug("[MSDStudio] Mode changed:",this._activeMode,"- requesting update"),this.requestUpdate(),m.debug("[MSDStudio] _setMode: Awaiting updateComplete..."),await this.updateComplete,m.debug(`[MSDStudio] _setMode EXIT: Mode ${this._activeMode} is now active, DOM updated`)}_setActiveTab(e){this._activeTab=e,m.debug("[MSDStudio] Tab changed:",this._activeTab),this.requestUpdate()}_handleMainTabChange(e){var i;e.stopPropagation();const t=(i=e.target.activeTab)==null?void 0:i.getAttribute("value");t&&this._setActiveTab(t)}_setNestedValue(e,t){const i=e.split(".");let o=this._workingConfig;for(let s=0;s<i.length-1;s++)o[i[s]]||(o[i[s]]={}),o=o[i[s]];o[i[i.length-1]]=t,m.debug("[MSDStudio] Config updated:",{path:e,value:t}),this._schedulePreviewUpdate(),this.requestUpdate()}_schedulePreviewUpdate(){this._previewUpdateTimer&&clearTimeout(this._previewUpdateTimer),this._previewUpdateTimer=setTimeout(()=>{var e,t;this._previewUpdateTimer=null,this.requestUpdate(),(t=(e=this.shadowRoot)==null?void 0:e.querySelector("lcards-msd-live-preview"))==null||t._forceRefresh()},300)}_markDirty(){this._schedulePreviewUpdate()}_zoom(e){if(this._reinitializeZoomIfNeeded(),!this._zoomBehavior||!this._zoomContainer){this._previewZoom=Math.max(.25,Math.min(10,this._previewZoom*e)),this.requestUpdate();return}ee(this._zoomContainer).transition().duration(200).call(this._zoomBehavior.scaleBy,e),setTimeout(()=>this.requestUpdate(),250)}_resetZoom(){this._zoomReset()}_detectSvgSourceMode(){var t,i;const e=((i=(t=this._workingConfig.msd)==null?void 0:t.base_svg)==null?void 0:i.source)||"";e==="none"||e===""?this._svgSourceMode="none":e.startsWith("builtin:")||!e.includes("/")&&!e.includes("http")?this._svgSourceMode="asset":e.startsWith("media-source://")?this._svgSourceMode="media":this._svgSourceMode="custom"}_detectViewBoxMode(){var t;const e=(t=this._workingConfig.msd)==null?void 0:t.view_box;this._viewBoxMode=Array.isArray(e)&&e.length===4?"custom":"auto"}_handleSave(){var e;if(this._validationErrors=this._validateConfiguration(),this._validationErrors.length>0){this.requestUpdate(),this._showValidationErrors();return}for(const t of((e=this._workingConfig.msd)==null?void 0:e.overlays)||[])delete t._editorSelected;m.debug("[MSDStudio] Saving config:",this._workingConfig),this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this._workingConfig},bubbles:true,composed:true})),this._showSuccessToast("Configuration saved successfully!"),this._handleClose()}_handleCancel(){if(this._configHasChanges()){this._confirmAction("Discard unsaved changes?").then(e=>{e&&(m.debug("[MSDStudio] Cancelled - changes discarded"),this._handleClose())});return}m.debug("[MSDStudio] Cancelled"),this._handleClose()}_configHasChanges(){const e=JSON.stringify(this._initialConfig),t=JSON.stringify(this._workingConfig);return e!==t}_handleReset(){this._confirmAction("Reset to initial configuration? All changes will be lost.")&&(m.debug("[MSDStudio] Resetting to initial config"),this._workingConfig=JSON.parse(JSON.stringify(this._initialConfig)),this._validationErrors=[],this._showSuccessToast("Configuration reset to initial state"),this._schedulePreviewUpdate(),this.requestUpdate())}_handleClose(){this.dispatchEvent(new CustomEvent("closed",{bubbles:true,composed:true}))}_toggleEditMode(){var e,t,i;this._liveInteractionEnabled=!this._liveInteractionEnabled,this._liveInteractionEnabled?((e=this._editModeAutoShown)!=null&&e.boundingBoxes&&(this._showBoundingBoxes=false),(t=this._editModeAutoShown)!=null&&t.anchorMarkers&&(this._showAnchorMarkers=false),(i=this._editModeAutoShown)!=null&&i.routingChannels&&(this._showRoutingChannels=false),this._editModeAutoShown=null):(this._editModeAutoShown={boundingBoxes:!this._showBoundingBoxes,anchorMarkers:!this._showAnchorMarkers,routingChannels:!this._showRoutingChannels},this._showBoundingBoxes=true,this._showAnchorMarkers=true,this._showRoutingChannels=true),this.requestUpdate()}_renderCanvasToolbar(){const e=[{mode:N.VIEW,icon:"mdi:cursor-default",tooltip:"View Mode"},{mode:N.PLACE_ANCHOR,icon:"mdi:map-marker-plus",tooltip:"Place Anchor"},{mode:N.PLACE_CONTROL,icon:"mdi:widgets",tooltip:"Place Control"},{mode:N.CONNECT_LINE,icon:"mdi:vector-line",tooltip:"Connect Line"},{mode:N.DRAW_CHANNEL,icon:"mdi:chart-timeline-variant",tooltip:"Draw Channel"},{mode:N.ADD_WAYPOINT,icon:"mdi:map-marker-path",tooltip:"Add Waypoint (Select line first)"}],t=[{key:"show_anchor_markers",prop:"_showAnchorMarkers",icon:"mdi:map-marker",tooltip:"Anchors"},{key:"show_bounding_boxes",prop:"_showBoundingBoxes",icon:"mdi:border-outside",tooltip:"Bounding Boxes"},{key:"show_routing_paths",prop:"_showRoutingPaths",icon:"mdi:vector-line",tooltip:"Routing Paths"},{key:"show_channels",prop:"_showRoutingChannels",icon:"mdi:chart-timeline-variant",tooltip:"Routing Channels"},{key:"show_attachment_points",prop:"_showAttachmentPoints",icon:"mdi:target-variant",tooltip:"Attachment Points"},{key:"show_routing_grid",prop:"_showRoutingGrid",icon:"mdi:grid-large",tooltip:"Routing Grid (router's own search resolution)"},{key:"show_trunks",prop:"_showTrunks",icon:"mdi:source-branch",tooltip:"Discovered Trunks (trunk-and-branch bundling)"}];return v`
            <div class="canvas-toolbar ${this._canvasToolbarExpanded?"":"collapsed"}">
                ${this._canvasToolbarExpanded?v`
                    <div class="canvas-toolbar-buttons">
                        <!-- Tools group: canvas mode selection — changes what clicking on
                             the canvas does (place/draw/connect vs. plain view/select). -->
                        <div class="canvas-toolbar-group">
                            <span class="canvas-toolbar-group-label">Tools</span>
                            ${e.map(i=>v`
                                <button
                                    class="canvas-toolbar-button ${this._activeMode===i.mode?"active":""}"
                                    @click=${async o=>{o.stopPropagation(),await this._setMode(i.mode)}}
                                    title="${i.tooltip}">
                                    <ha-icon icon="${i.icon}"></ha-icon>
                                </button>
                            `)}

                            <!-- Draw Shape buttons: one per kind, since DRAW_SHAPE is a single
                                 mode whose behavior branches on _drawShapeState.kind. All three
                                 share the same mode identifier, so _setMode's own toggle-by-
                                 identity check can't distinguish "switch kind while staying in
                                 draw mode" from "toggle the whole mode off" - handled explicitly
                                 here instead. -->
                            ${[{kind:"polyline",icon:"mdi:vector-polyline",tooltip:"Draw Polyline/Path"},{kind:"rect",icon:"mdi:rectangle-outline",tooltip:"Draw Rectangle"},{kind:"circle",icon:"mdi:circle-outline",tooltip:"Draw Circle"}].map(i=>v`
                                <button
                                    class="canvas-toolbar-button ${this._activeMode===N.DRAW_SHAPE&&this._drawShapeState.kind===i.kind?"active":""}"
                                    @click=${async o=>{o.stopPropagation(),this._activeMode===N.DRAW_SHAPE?(this._drawShapeState.kind===i.kind?(this._activeMode=N.VIEW,this._drawShapeState={kind:null,points:[],drawing:false,currentPoint:null}):this._drawShapeState={kind:i.kind,points:[],drawing:false,currentPoint:null},this._shapeDrawDragCandidate=null,this.requestUpdate()):(await this._setMode(N.DRAW_SHAPE),this._drawShapeState={kind:i.kind,points:[],drawing:false,currentPoint:null},this._shapeDrawDragCandidate=null,this.requestUpdate())}}
                                    title="${i.tooltip}">
                                    <ha-icon icon="${i.icon}"></ha-icon>
                                </button>
                            `)}
                        </div>

                        <!-- Interaction group: Edit Mode (discussion #389) — pauses live-card
                             click interception so overlays can be dragged/resized directly. -->
                        <div class="canvas-toolbar-group">
                            <span class="canvas-toolbar-group-label">Interaction</span>
                            <button
                                class="canvas-toolbar-button ${this._liveInteractionEnabled?"":"active"}"
                                @click=${i=>{i.stopPropagation(),this._toggleEditMode()}}
                                title="${this._liveInteractionEnabled?"Live Preview (click or press E for Edit Mode)":"Edit Mode (click or press E to return to Live Preview)"}">
                                <ha-icon icon="${this._liveInteractionEnabled?"mdi:eye":"mdi:cursor-move"}"></ha-icon>
                            </button>
                        </div>

                        <!-- View-aids group: canvas guides/behavior that don't change what's
                             in the config, only how you see and interact with the canvas. -->
                        <div class="canvas-toolbar-group">
                            <span class="canvas-toolbar-group-label">View</span>
                            <button
                                class="canvas-toolbar-button ${this._showCrosshairs?"active":""}"
                                @click=${i=>{i.stopPropagation(),this._showCrosshairs=!this._showCrosshairs,this.requestUpdate()}}
                                title="Crosshairs">
                                <ha-icon icon="mdi:crosshairs"></ha-icon>
                            </button>

                            <button
                                class="canvas-toolbar-button ${this._showGrid?"active":""}"
                                @click=${i=>{i.stopPropagation(),this._showGridSettings=!this._showGridSettings,this.requestUpdate()}}
                                title="Grid Settings">
                                <ha-icon icon="mdi:grid"></ha-icon>
                            </button>

                            <button
                                class="canvas-toolbar-button ${this._enableSnapping?"active":""}"
                                @click=${i=>{i.stopPropagation(),this._enableSnapping=!this._enableSnapping,this.requestUpdate()}}
                                title="Grid Snapping">
                                <ha-icon icon="mdi:magnet"></ha-icon>
                            </button>
                        </div>

                        <!-- Overlays group: show/hide overlay-type visualizations on the canvas. -->
                        <div class="canvas-toolbar-group">
                            <span class="canvas-toolbar-group-label">Overlays</span>
                            ${t.map(i=>v`
                                <button
                                    class="canvas-toolbar-button ${this[i.prop]?"active":""}"
                                    @click=${o=>{o.stopPropagation(),this[i.prop]=!this[i.prop],this.requestUpdate()}}
                                    title="${i.tooltip}">
                                    <ha-icon icon="${i.icon}"></ha-icon>
                                </button>
                            `)}
                        </div>
                    </div>

                    <!-- Toggle Button (expanded state - right side) -->
                    <button
                        class="canvas-toolbar-toggle"
                        @click=${()=>{this._canvasToolbarExpanded=!this._canvasToolbarExpanded,this.requestUpdate()}}
                        title="Collapse Toolbar">
                        <ha-icon icon="mdi:chevron-right"></ha-icon>
                    </button>
                `:v`
                    <!-- Toggle Button (collapsed state - left side) -->
                    <button
                        class="canvas-toolbar-toggle"
                        @click=${()=>{this._canvasToolbarExpanded=!this._canvasToolbarExpanded,this.requestUpdate()}}
                        title="Expand Toolbar">
                        <ha-icon icon="mdi:tools"></ha-icon>
                    </button>
                `}
            </div>
        `}_renderGridSettingsPopup(){return this._showGridSettings?v`
            <div class="grid-settings-popup">
                <div class="grid-settings-header">
                    <span style="font-weight: 600; font-size: 14px;">Grid Settings</span>
                    <ha-icon-button
                        @click=${()=>{this._showGridSettings=false,this.requestUpdate()}}
                        style="--mdc-icon-size: 20px;">
                        <ha-icon icon="mdi:close"></ha-icon>
                    </ha-icon-button>
                </div>

                <div class="grid-settings-content">
                    <!-- Enable/Disable Grid -->
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Show Grid"}
                        .selector=${{boolean:{}}}
                        .value=${this._showGrid}
                        @value-changed=${e=>{this._showGrid=e.detail.value,this._updateDebugSetting("grid",e.detail.value)}}>
                    </ha-selector>

                    ${this._showGrid?v`
                        <!-- Grid Spacing Slider -->
                        <div style="margin-top: 16px;">
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number:{min:10,max:150,step:5,mode:"slider"}}}
                                .value=${this._gridSpacing}
                                .label=${"Grid Size (vb units)"}
                                @value-changed=${e=>{this._gridSpacing=e.detail.value,this._updateDebugSetting("gridSpacing",e.detail.value)}}>
                            </ha-selector>
                        </div>

                        <!-- Snap to Grid -->
                        <ha-selector
                            style="margin-top: 12px; display: block;"
                            .hass=${this.hass}
                            .label=${"Snap to Grid"}
                            .selector=${{boolean:{}}}
                            .value=${this._enableSnapping}
                            @value-changed=${e=>{this._enableSnapping=e.detail.value}}>
                        </ha-selector>

                        <!-- Grid Color -->
                        <div style="margin-top: 12px;">
                            <label style="display: block; margin-bottom: 4px; font-size: 13px;">
                                Grid Color
                            </label>
                            <input
                                type="color"
                                .value=${this._debugSettings.grid_color||"#cccccc"}
                                @input=${e=>this._updateDebugSetting("grid_color",e.target.value)}
                                style="width: 100%; height: 32px; border: 1px solid var(--divider-color); border-radius: 4px; cursor: pointer;">
                        </div>

                        <!-- Grid Opacity -->
                        <div style="margin-top: 12px;">
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number:{min:.1,max:1,step:.1,mode:"slider"}}}
                                .value=${this._debugSettings.grid_opacity||.3}
                                .label=${"Grid Opacity"}
                                @value-changed=${e=>this._updateDebugSetting("grid_opacity",e.detail.value)}>
                            </ha-selector>
                        </div>
                    `:""}
                </div>
            </div>
        `:""}_renderTabNav(){const e=[{id:J.BASE_SVG,label:"Base SVG",icon:"mdi:image"},{id:J.ANCHORS,label:"Anchors",icon:"mdi:map-marker"},{id:J.CONTROLS,label:"Controls",icon:"mdi:widgets"},{id:J.LINES,label:"Lines",icon:"mdi:vector-line"},{id:J.SHAPES,label:"Shapes",icon:"mdi:shape"},{id:J.ROUTING,label:"Routing",icon:"mdi:routes"},{id:J.YAML,label:"YAML",icon:"mdi:code-braces"}];return v`
            <ha-tab-group @wa-tab-show=${this._handleMainTabChange}>
                ${e.map(t=>v`
                    <ha-tab-group-tab value="${t.id}" ?active=${this._activeTab===t.id}>
                        <ha-icon icon="${t.icon}"></ha-icon>
                        ${t.label}
                    </ha-tab-group-tab>
                `)}
            </ha-tab-group>
        `}_renderTabContent(){switch(this._activeTab){case J.BASE_SVG:return this._renderBaseSvgTab();case J.ANCHORS:return this._renderAnchorsTab();case J.CONTROLS:return this._renderControlsTab();case J.LINES:return this._renderLinesTab();case J.SHAPES:return this._renderShapesTab();case J.ROUTING:return this._renderRoutingTab();case J.YAML:return this._renderYamlTab();default:return v`<div>Unknown tab</div>`}}_renderSvgSourceHelper(e=""){var a,l;let t=null,i=null,o=false;e.startsWith("builtin:")?i=e.replace("builtin:",""):e.startsWith("/local/")||e.startsWith("/hacsfiles/")||e.startsWith("/lcards/")||e.startsWith("http://")||e.startsWith("https://")?(i=e.split("/").pop().replace(".svg",""),o=true):e.startsWith("media-source://")?(i=e,o=true):e&&(i=e);const s=(l=(a=window.lcards)==null?void 0:a.core)==null?void 0:l.assetManager;if(s&&i&&(t=s.getMetadata("svg",i)),t&&Object.keys(t).length>2)return v`
                <div style="
                    margin-top: 12px;
                    padding: 16px;
                    background: linear-gradient(135deg, #4A5C7A 0%, #2C3E50 100%);
                    border-radius: 8px;
                    color: white;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    font-family: var(--lcars-font, var(--lcars-fallback-font, 'Antonio', sans-serif));
                ">
                    <!-- Header -->
                    <div style="
                        display: flex;
                        flex-wrap: wrap;
                        justify-content: space-between;
                        align-items: flex-start;
                        gap: 8px;
                        margin-bottom: 12px;
                        border-bottom: 2px solid rgba(255,255,255,0.3);
                        padding-bottom: 10px;
                    ">
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-size: 20px; font-weight: 700; letter-spacing: 1px; line-height: 1.2;">
                                ${t.ship||i}
                            </div>
                            ${t.registry?v`
                                <div style="font-size: 16px; font-weight: 300; letter-spacing: 2px; opacity: 0.9; margin-top: 2px;">
                                    ${t.registry}
                                </div>
                            `:""}
                        </div>
                        ${t.era?v`
                            <div style="
                                background: rgba(255,255,255,0.2);
                                padding: 4px 10px;
                                border-radius: 4px;
                                font-size: 11px;
                                font-weight: 600;
                                letter-spacing: 0.5px;
                                text-transform: uppercase;
                                max-width: 100%;
                                text-align: right;
                                word-break: break-word;
                            ">
                                ${t.era}
                            </div>
                        `:""}
                    </div>

                    <!-- Ship Details Grid -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px 16px; margin-bottom: 12px; font-size: 13px; line-height: 1.5;">
                        ${t.class?v`
                            <div>
                                <div style="opacity: 0.8; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">Class</div>
                                <div style="font-weight: 500;">${t.class}</div>
                            </div>
                        `:""}

                        ${t.author?v`
                            <div>
                                <div style="opacity: 0.8; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">Author</div>
                                <div style="font-weight: 500;">${t.author}</div>
                            </div>
                        `:""}

                        ${t.source?v`
                            <div>
                                <div style="opacity: 0.8; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">Source</div>
                                <div style="font-weight: 500;">${t.source}</div>
                            </div>
                        `:""}

                        ${t.license?v`
                            <div>
                                <div style="opacity: 0.8; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">License</div>
                                <div style="font-weight: 500;">${t.license}</div>
                            </div>
                        `:""}
                    </div>

                    <!-- Description -->
                    ${t.description?v`
                        <div style="
                            font-size: 12px;
                            line-height: 1.6;
                            opacity: 0.95;
                            font-style: italic;
                            background: rgba(0,0,0,0.15);
                            padding: 8px 10px;
                            border-radius: 4px;
                            margin-bottom: 8px;
                        ">
                            ${t.description}
                        </div>
                    `:""}

                    <!-- Variant Badge -->
                    ${t.variant?v`
                        <div style="
                            display: inline-block;
                            background: rgba(255,255,255,0.25);
                            padding: 4px 10px;
                            border-radius: 12px;
                            font-size: 11px;
                            font-weight: 600;
                            letter-spacing: 0.5px;
                        ">
                            ${t.variant}
                        </div>
                    `:""}
                </div>
            `;if(o&&e){const c=e.split("/").pop(),d=e.substring(0,e.lastIndexOf("/"));return v`
                <div style="
                    margin-top: 12px;
                    padding: 14px;
                    background: var(--secondary-background-color);
                    border-left: 4px solid var(--info-color, #2196F3);
                    border-radius: 4px;
                    font-size: 13px;
                    line-height: 1.6;
                ">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <ha-icon icon="mdi:file-document-outline" style="--mdc-icon-size: 20px; color: var(--info-color, #2196F3);"></ha-icon>
                        <strong style="font-size: 14px;">External SVG File</strong>
                    </div>

                    <div style="display: grid; gap: 6px; font-size: 12px;">
                        <div>
                            <span style="opacity: 0.7;">Filename:</span>
                            <code style="background: var(--code-background-color, rgba(0,0,0,0.1)); padding: 2px 6px; border-radius: 3px; font-size: 11px;">${c}</code>
                        </div>
                        <div>
                            <span style="opacity: 0.7;">Path:</span>
                            <code style="background: var(--code-background-color, rgba(0,0,0,0.1)); padding: 2px 6px; border-radius: 3px; font-size: 11px;">${d}/</code>
                        </div>
                        <div>
                            <span style="opacity: 0.7;">Full URL:</span>
                            <code style="background: var(--code-background-color, rgba(0,0,0,0.1)); padding: 2px 6px; border-radius: 3px; font-size: 11px;">${e}</code>
                        </div>
                    </div>

                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--divider-color); font-size: 11px; opacity: 0.7;">
                        External SVGs don't have embedded metadata. The file will be loaded from the specified path when the card renders.
                    </div>
                </div>
            `}return v`
            <lcards-message type="info">
                A URL or local path to your SVG: <code>/local/my-ship.svg</code> (from the www folder),
                <code>/lcards/ships/custom.svg</code> or <code>https://…/my-ship.svg</code>.
            </lcards-message>
        `}_renderViewBoxHelper(){return v`
            <lcards-message type="info">
                The viewBox is the MSD's coordinate system. <strong>Auto</strong> takes it from the SVG (recommended);
                <strong>Custom</strong> sets [minX, minY, width, height].
            </lcards-message>
        `}_handleFiltersChanged(e){m.debug("[MSDStudio] Filters changed:",e.detail.value),this._setNestedValue("msd.base_svg.filters",e.detail.value)}async _handleViewBoxModeChange(e){var t;if(this._viewBoxMode=e,e==="auto")(t=this._workingConfig.msd)!=null&&t.view_box&&(delete this._workingConfig.msd.view_box,this._schedulePreviewUpdate()),await this._autoExtractViewBox();else if(!this._workingConfig.msd.view_box){const i=await this._extractViewBoxFromSvg();i?this._setNestedValue("msd.view_box",i):this._setNestedValue("msd.view_box",[0,0,400,200])}this.requestUpdate()}async _handleSvgSourceChange(e){this._setNestedValue("msd.base_svg.source",e),this._viewBoxMode==="auto"&&await this._autoExtractViewBox()}async _autoExtractViewBox(){var i,o;const e=(o=(i=this._workingConfig.msd)==null?void 0:i.base_svg)==null?void 0:o.source;if(!e||e==="none")return;const t=await this._extractViewBoxFromSvg();t&&this._viewBoxMode==="auto"&&(this._extractedViewBox=t,setTimeout(()=>this._fitToViewport(),50),m.trace("[MSDStudio] Auto-extracted viewBox for preview:",t))}async _extractViewBoxFromSvg(){var t,i;const e=(i=(t=this._workingConfig.msd)==null?void 0:t.base_svg)==null?void 0:i.source;if(!e||e==="none")return null;try{const{getSvgContent:o,getSvgViewBox:s}=await import("./lcards-main-OH3P_lk4.js").then(a=>a.bC),r=o(e);if(r){const a=s(r);return m.trace("[MSDStudio] Extracted viewBox from SVG:",a),a}}catch(o){m.error("[MSDStudio] Error extracting viewBox:",o)}return null}_updateViewBoxValue(e,t){var o;const i=[...((o=this._workingConfig.msd)==null?void 0:o.view_box)||[0,0,400,200]];i[e]=parseFloat(t)||0,this._setNestedValue("msd.view_box",i)}_handleSvgSourceModeChange(e){var i,o;const t=this._svgSourceMode;if(this._svgSourceMode=e,e==="none"?(this._setNestedValue("msd.base_svg.source","none"),this._viewBoxMode==="auto"&&this._handleViewBoxModeChange("custom")):t==="none"&&this._viewBoxMode==="custom"&&this._handleViewBoxModeChange("auto"),e==="asset"){const s=(o=(i=this._workingConfig.msd)==null?void 0:i.base_svg)==null?void 0:o.source;if(!s||!s.startsWith("builtin:")){const r=this._getAvailableSvgs();r.length>0&&r[0].value&&this._setNestedValue("msd.base_svg.source",r[0].value)}}this._schedulePreviewUpdate(),this.requestUpdate()}_getAvailableSvgs(){var t,i;const e=(i=(t=window.lcards)==null?void 0:t.core)==null?void 0:i.assetManager;if(!e)return[{value:"",label:"AssetManager not available"}];try{const s=e.listAssets("svg").filter(r=>{var a;return!!((a=e.getMetadata("svg",r))!=null&&a.pack)}).map(r=>({value:`builtin:${r}`,label:r}));return s.sort((r,a)=>r.label.localeCompare(a.label)),s.length===0?[{value:"",label:"No SVG assets available"}]:s}catch(o){return m.error("[MSDStudio] Error listing SVG assets:",o),[{value:"",label:"Error loading SVG assets"}]}}_renderYamlTab(){return v`
            <div style="padding: 8px;">
                <lcards-studio-yaml-tab
                    .hass=${this.hass}
                    .config=${this._workingConfig}
                    .schema=${this._getMsdSchema()}
                    cardType="msd"
                    note="Edit the complete MSD configuration as YAML. Changes are applied when you save the dialog."
                    @yaml-config-changed=${e=>{this._workingConfig=e.detail.config,this.requestUpdate()}}>
                </lcards-studio-yaml-tab>
            </div>
        `}_getMsdSchema(){var e,t;try{const i=(t=(e=window.lcards)==null?void 0:e.core)==null?void 0:t.configManager;if(!i)return m.warn("[MSDStudio] CoreConfigManager not available"),null;const o=i.getCardSchema("msd");return o?(m.debug("[MSDStudio] Retrieved MSD schema for YAML editor autocomplete"),o):(m.warn("[MSDStudio] MSD schema not found in registry"),null)}catch(i){return m.error("[MSDStudio] Error getting MSD schema:",i),null}}_renderBaseSvgTab(){var o,s,r,a,l,c;this._workingConfig.msd||(this._workingConfig.msd={}),this._workingConfig.msd.base_svg||(this._workingConfig.msd.base_svg={source:""});const e=this._workingConfig.msd.base_svg,t=this._workingConfig.msd.view_box||[],i=this._getAvailableSvgs();return this._baseSvgPerformanceExpanded===null&&(this._baseSvgPerformanceExpanded=((o=this._workingConfig.msd)==null?void 0:o.triggers_update)==="all"),v`
            <div style="padding: 8px;">
                <!-- SVG Source Section -->
                <lcards-form-section
                    header="SVG Source"
                    description="Configure the base SVG template for your MSD display"
                    icon="mdi:image"
                    ?expanded=${true}>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <!-- Source Mode Selector -->
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{select:{options:[{value:"asset",label:"Asset Library"},{value:"custom",label:"Custom Path"},{value:"media",label:"Browse HA Media"},{value:"none",label:"None (ViewBox Only)"}]}}}
                            .value=${this._svgSourceMode}
                            .label=${"SVG Source Mode"}
                            @value-changed=${d=>this._handleSvgSourceModeChange(d.detail.value)}>
                        </ha-selector>

                        <!-- Conditional Content Based on Mode -->
                        ${this._svgSourceMode==="asset"?v`
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select:{mode:"dropdown",custom_value:i.length>=10,options:i}}}
                                .value=${e.source||""}
                                .label=${"SVG Asset"}
                                @value-changed=${d=>this._handleSvgSourceChange(d.detail.value)}>
                            </ha-selector>
                        `:this._svgSourceMode==="custom"?v`
                            <ha-input
                                label="Custom SVG Path"
                                .value=${e.source||""}
                                @input=${d=>this._handleSvgSourceChange(d.target.value)}
                                hint="Enter custom path (e.g., /local/my-ship.svg)">
                            </ha-input>
                        `:this._svgSourceMode==="media"?v`
                            <!-- HA media library picker — filtered to SVG's real MIME type
                                 (image/svg+xml), not the broader image/* used for raster
                                 backgrounds elsewhere, since base_svg needs actual SVG markup. -->
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{media:{accept:["image/svg+xml"]}}}
                                .value=${(s=e.source)!=null&&s.startsWith("media-source://")?{media_content_id:e.source,media_content_type:""}:void 0}
                                .label=${"HA Media"}
                                .helper=${"Browse or upload an SVG via the Home Assistant media library"}
                                @value-changed=${d=>{var h;return this._handleSvgSourceChange(((h=d.detail.value)==null?void 0:h.media_content_id)??"")}}>
                            </ha-selector>
                        `:v`
                            <lcards-message type="info">
                                No base SVG: overlays draw on a transparent canvas, so set the viewBox below by hand.
                            </lcards-message>
                        `}
                        ${this._renderSvgSourceHelper(e.source)}
                    </div>
                </lcards-form-section>

                <!-- Visibility Section -->
                <lcards-form-section
                    header="Visibility"
                    description="Control whether the base SVG is shown as the visual background"
                    icon="mdi:eye-outline"
                    ?expanded=${false}>
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Render base SVG as visible background"}
                        .helper=${"Turn off to use a Background Layer (below) as the visual background instead — the SVG is still parsed for anchors either way."}
                        .selector=${{boolean:{}}}
                        .value=${e.render_visual!==false}
                        @value-changed=${d=>{this._setNestedValue("msd.base_svg.render_visual",d.detail.value)}}>
                    </ha-selector>

                    <ha-selector
                        style="margin-top: 12px; display: block;"
                        .hass=${this.hass}
                        .label=${"Dim base SVG in this preview (not saved)"}
                        .helper=${"Editor convenience only — makes lines/controls easier to see while working here. Never affects the saved config or the live card."}
                        .selector=${{boolean:{}}}
                        .value=${this._baseSvgPreviewDimmed===true}
                        @value-changed=${d=>{this._baseSvgPreviewDimmed=d.detail.value,this._applyBaseSvgPreviewDimming()}}>
                    </ha-selector>
                </lcards-form-section>

                <!-- ViewBox Section -->
                <lcards-form-section
                    header="ViewBox"
                    description="Configure the coordinate system for your MSD display"
                    icon="mdi:grid"
                    ?expanded=${false}>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <ha-radio-group
                            .value=${this._viewBoxMode}
                            @change=${d=>this._handleViewBoxModeChange(d.target.value)}>
                            <ha-radio-option value="auto">Auto-detect from SVG</ha-radio-option>
                            <ha-radio-option value="custom">Custom viewBox</ha-radio-option>
                        </ha-radio-group>

                        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 8px;">
                            <ha-input
                                style="width: 100%; box-sizing: border-box; min-width: 0;"
                                type="number"
                                label="Min X"
                                .value=${String(t[0]||0)}
                                ?disabled=${this._viewBoxMode==="auto"}
                                @input=${d=>this._updateViewBoxValue(0,d.target.value)}>
                            </ha-input>
                            <ha-input
                                style="width: 100%; box-sizing: border-box; min-width: 0;"
                                type="number"
                                label="Min Y"
                                .value=${String(t[1]||0)}
                                ?disabled=${this._viewBoxMode==="auto"}
                                @input=${d=>this._updateViewBoxValue(1,d.target.value)}>
                            </ha-input>
                            <ha-input
                                style="width: 100%; box-sizing: border-box; min-width: 0;"
                                type="number"
                                label="Width"
                                .value=${String(t[2]||400)}
                                ?disabled=${this._viewBoxMode==="auto"}
                                @input=${d=>this._updateViewBoxValue(2,d.target.value)}>
                            </ha-input>
                            <ha-input
                                style="width: 100%; box-sizing: border-box; min-width: 0;"
                                type="number"
                                label="Height"
                                .value=${String(t[3]||200)}
                                ?disabled=${this._viewBoxMode==="auto"}
                                @input=${d=>this._updateViewBoxValue(3,d.target.value)}>
                            </ha-input>
                        </div>
                        ${this._renderViewBoxHelper()}
                    </div>
                </lcards-form-section>

                <!-- Filters Section -->
                <lcards-form-section
                    header="Filters (base_svg)"
                    description="Apply stackable visual filters to the base SVG"
                    icon="mdi:auto-fix"
                    ?expanded=${false}>

                    <lcards-filter-editor
                        .hass=${this.hass}
                        .filters=${e.filters||[]}
                        @filters-changed=${this._handleFiltersChanged}>
                    </lcards-filter-editor>

                </lcards-form-section>

                <!-- Animations Section -->
                <lcards-form-section
                    header="Animations (base_svg)"
                    description="Animate elements inside the base SVG by id/class — separate from the whole-group filter crossfades above"
                    icon="mdi:play-box-outline"
                    ?expanded=${false}>

                    <lcards-animation-editor
                        .hass=${this.hass}
                        .animations=${e.animations||[]}
                        .cardElement=${this._getLivePreviewCardElement()}
                        .searchRootSelector=${"#__msd-base-content"}
                        @animations-changed=${d=>{this._setNestedValue("msd.base_svg.animations",d.detail.value)}}
                        @refresh-targets=${()=>this.requestUpdate()}>
                    </lcards-animation-editor>

                </lcards-form-section>

                <!-- Overlay Group Animations Section -->
                <lcards-form-section
                    header="Animations (Overlay Groups)"
                    description="Bulk-target overlays by CSS selector — e.g. animate every overlay whose id starts with 'shield_' with one declaration"
                    icon="mdi:play-box-multiple-outline"
                    ?expanded=${false}>

                    <lcards-animation-editor
                        .hass=${this.hass}
                        .animations=${((r=this._workingConfig.msd)==null?void 0:r.animations)||[]}
                        .cardElement=${this._getLivePreviewCardElement()}
                        .searchRootSelector=${"#msd-overlay-container"}
                        @animations-changed=${d=>{this._setNestedValue("msd.animations",d.detail.value)}}
                        @refresh-targets=${()=>this.requestUpdate()}>
                    </lcards-animation-editor>

                </lcards-form-section>

                <!-- Background Layers Section -->
                <lcards-form-section
                    header="Background Effects (MSD Background)"
                    description="Animated or static-image backgrounds (grids, starfields, images, etc.) — same layer system used by buttons/elbows"
                    icon="mdi:layers-triple-outline"
                    ?expanded=${false}>

                    <lcards-background-animation-editor
                        .hass=${this.hass}
                        .config=${((a=this._workingConfig.msd)==null?void 0:a.background_animation)??[]}
                        @effects-changed=${d=>{this._setNestedValue("msd.background_animation",d.detail.value)}}>
                    </lcards-background-animation-editor>

                </lcards-form-section>

                <!-- Performance (Advanced) Section -->
                <lcards-form-section
                    header="Performance (Advanced)"
                    description="Card-wide override for how controls receive updates"
                    icon="mdi:speedometer-slow"
                    secondary=${((l=this._workingConfig.msd)==null?void 0:l.triggers_update)==="all"?"Always update all controls":"Default (per-control optimization)"}
                    ?expanded=${this._baseSvgPerformanceExpanded}
                    @expanded-changed=${d=>{this._baseSvgPerformanceExpanded=d.detail.expanded}}>

                    <lcards-message type="warning">
                        Not recommended: every control here then refreshes on every state change, which can make their
                        animations restart. Prefer Update Behavior on the one control that needs it (Controls tab).
                    </lcards-message>

                    <ha-selector
                        style="margin-top: 12px; display: block;"
                        .hass=${this.hass}
                        .label=${"Update all controls on every HASS change"}
                        .selector=${{boolean:{}}}
                        .value=${((c=this._workingConfig.msd)==null?void 0:c.triggers_update)==="all"}
                        @value-changed=${d=>{d.detail.value?(this._setNestedValue("msd.triggers_update","all"),this._baseSvgPerformanceExpanded=true):(this._workingConfig.msd&&delete this._workingConfig.msd.triggers_update,this._schedulePreviewUpdate(),this.requestUpdate())}}>
                    </ha-selector>
                </lcards-form-section>
            </div>
        `}_renderAnchorsTab(){this._workingConfig.msd||(this._workingConfig.msd={}),this._workingConfig.msd.anchors||(this._workingConfig.msd.anchors={});const e=this._workingConfig.msd.anchors,t=Object.entries(e),i=this._getBaseSvgAnchors(),{computed:o,harvested:s}=Ir(i),r=Object.entries(s),a=Object.entries(o),l=(this._anchorFilterQuery||"").trim().toLowerCase(),c=u(_=>_.filter(([f])=>!l||f.toLowerCase().includes(l)),"applyFilter"),d=c(r),h=c(a),p=c(t),g=this._workingConfig.msd.base_svg||{};return v`
            <div style="padding: 8px;">
                <!-- Anchor Actions & Visualization Helpers -->
                <div style="display: flex; gap: 8px; margin-bottom: 16px; align-items: center;">
                    <ha-button @click=${this._openAnchorForm}>
                        <ha-icon icon="mdi:map-marker-plus" slot="start"></ha-icon>
                        Add Anchor
                    </ha-button>
                    <ha-button @click=${async _=>{_.stopPropagation(),await this._setMode(N.PLACE_ANCHOR)}}
                               ?disabled=${this._activeMode===N.PLACE_ANCHOR}>
                        <ha-icon icon="mdi:cursor-default-click" slot="start"></ha-icon>
                        Place on Canvas
                    </ha-button>

                    <!-- Right-aligned visualization helpers -->
                    <div style="flex: 1;"></div>
                    <ha-icon-button
                        class="${this._showAnchorMarkers?"active":""}"
                        @click=${()=>{this._showAnchorMarkers=!this._showAnchorMarkers,this.requestUpdate()}}
                        .label=${"Anchor Markers"}>
                        <ha-icon icon="mdi:map-marker"></ha-icon>
                    </ha-icon-button>
                </div>

                <!-- Base SVG Harvesting Controls -->
                <lcards-form-section
                    header="Anchor Harvesting"
                    description="Control which automatic anchor sources run against the base SVG"
                    icon="mdi:image-search-outline"
                    ?expanded=${false}
                    style="margin-bottom: 16px;">
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Harvest SVG elements"}
                        .helper=${"Named <circle>/<ellipse>/<text>/<rect>/<g> elements embedded in the base SVG."}
                        .selector=${{boolean:{}}}
                        .value=${g.harvest_svg_elements!==false}
                        @value-changed=${_=>{this._setNestedValue("msd.base_svg.harvest_svg_elements",_.detail.value)}}>
                    </ha-selector>

                    <ha-selector
                        style="margin-top: 12px; display: block;"
                        .hass=${this.hass}
                        .label=${"Compute landmark anchors"}
                        .helper=${"hull_center, extremity_bow/stern/top/bottom, lateral_a/b - derived from the SVG silhouette."}
                        .selector=${{boolean:{}}}
                        .value=${g.harvest_landmarks!==false}
                        @value-changed=${_=>{this._setNestedValue("msd.base_svg.harvest_landmarks",_.detail.value)}}>
                    </ha-selector>
                </lcards-form-section>

                <div style="position: relative; margin-bottom: 16px;">
                    <ha-input
                        label="Filter anchors"
                        placeholder="Filter by name..."
                        .value=${this._anchorFilterQuery}
                        @input=${_=>{this._anchorFilterQuery=_.target.value,this.requestUpdate()}}
                        style="width: 100%;">
                        <ha-icon slot="leadingIcon" icon="mdi:magnify"></ha-icon>
                    </ha-input>
                    ${this._anchorFilterQuery?v`
                        <ha-icon-button
                            style="position: absolute; right: 4px; top: 4px;"
                            @click=${()=>{this._anchorFilterQuery="",this.requestUpdate()}}
                            .label=${"Clear filter"}
                            .path=${"M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"}>
                        </ha-icon-button>
                    `:""}
                </div>

                <!-- Base SVG: Harvested (named <circle>/<ellipse>/<text>/<rect>/<g> elements, read-only) -->
                ${r.length>0?v`
                    <lcards-form-section
                        header="Base SVG: Harvested"
                        description="Named elements harvested from the base SVG (read-only)"
                        icon="mdi:image-marker"
                        ?expanded=${false}
                        style="margin-bottom: 16px;">
                        <lcards-message type="info" style="margin-bottom: 12px;">
                            Anchors from named elements in your base SVG (ids may be tool-generated, like g293).
                            Define an anchor with the same name to override one, or Promote it into User Anchors to rename it.
                        </lcards-message>
                        <div style="display: flex; margin-bottom: 12px;">
                            <ha-button @click=${()=>this._promoteAllAnchors(d)}>
                                <ha-icon icon="mdi:content-duplicate" slot="start"></ha-icon>
                                Promote All${l?` (${d.length})`:""}
                            </ha-button>
                        </div>
                        ${d.length===0?v`
                            <div style="text-align: center; padding: 16px; color: var(--secondary-text-color);">
                                No harvested anchors match "${this._anchorFilterQuery}".
                            </div>
                        `:v`
                            <div style="display: flex; flex-direction: column; gap: 12px;">
                                ${d.map(([_,f])=>this._renderBaseSvgAnchorItem(_,f))}
                            </div>
                        `}
                    </lcards-form-section>
                `:""}

                <!-- Base SVG: Computed (SvgStructureAnalyzer landmarks, read-only) -->
                ${a.length>0?v`
                    <lcards-form-section
                        header="Base SVG: Computed"
                        description="Geometric landmark anchors computed from the SVG silhouette (read-only)"
                        icon="mdi:target"
                        ?expanded=${false}
                        style="margin-bottom: 16px;">
                        <lcards-message type="info" style="margin-bottom: 12px;">
                            These anchors are algorithmically derived from your base SVG's silhouette.
                            <strong>Define a custom anchor with the same name to override, or use Promote to copy one into User Anchors.</strong>
                        </lcards-message>
                        <div style="display: flex; margin-bottom: 12px;">
                            <ha-button @click=${()=>this._promoteAllAnchors(h)}>
                                <ha-icon icon="mdi:content-duplicate" slot="start"></ha-icon>
                                Promote All${l?` (${h.length})`:""}
                            </ha-button>
                        </div>
                        ${h.length===0?v`
                            <div style="text-align: center; padding: 16px; color: var(--secondary-text-color);">
                                No computed anchors match "${this._anchorFilterQuery}".
                            </div>
                        `:v`
                            <div style="display: flex; flex-direction: column; gap: 12px;">
                                ${h.map(([_,f])=>this._renderBaseSvgAnchorItem(_,f))}
                            </div>
                        `}
                    </lcards-form-section>
                `:""}

                <!-- User Anchors (Editable) -->
                <lcards-form-section
                    header="User Anchors"
                    description="Named reference points for positioning overlays"
                    icon="mdi:map-marker-multiple"
                    ?expanded=${true}>
                    ${t.length===0?v`
                        <div style="text-align: center; padding: 24px; color: var(--secondary-text-color);">
                            <ha-icon icon="mdi:map-marker-off" style="--mdc-icon-size: 48px; opacity: 0.5;"></ha-icon>
                            <p>No user anchors defined. Click "Add Anchor" or "Place on Canvas" to create one.</p>
                        </div>
                    `:p.length===0?v`
                        <div style="text-align: center; padding: 16px; color: var(--secondary-text-color);">
                            No user anchors match "${this._anchorFilterQuery}".
                        </div>
                    `:v`
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            ${p.map(([_,f])=>this._renderAnchorItem(_,f))}
                        </div>
                    `}
                </lcards-form-section>

            </div>
        `}_getLivePreviewCardElement(){var i,o;const e=(i=this.shadowRoot)==null?void 0:i.querySelector("lcards-msd-live-preview"),t=(o=e==null?void 0:e.shadowRoot)==null?void 0:o.querySelector(".preview-card-container");return(t==null?void 0:t.querySelector("lcards-msd-card"))||null}_getBaseSvgAnchors(){return Ut(this._workingConfig,this.shadowRoot)}_renderBaseSvgAnchorItem(e,t){const[i,o]=Array.isArray(t)?t:[0,0];return v`
            <div class="list-item-card" style="opacity: 0.85;">
                <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                    <ha-icon icon="mdi:image-marker" style="--mdc-icon-size: 32px; color: var(--info-color, #2196F3); flex-shrink: 0;"></ha-icon>
                    <div style="flex: 1; min-width: 140px;">
                        <div style="font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            ${e}
                            <span style="font-size: 11px; background: var(--info-color, #2196F3); color: white; padding: 2px 6px; border-radius: 4px;">BASE SVG</span>
                        </div>
                        <div style="font-size: 12px; color: var(--secondary-text-color);">
                            Position: [${i}, ${o}]
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; flex-shrink: 0; margin-left: auto;">
                        <ha-icon-button
                            @click=${()=>this._promoteAnchorToUser(e,t)}
                            .label=${"Promote to User Anchor"}
                            .path=${"M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"}>
                        </ha-icon-button>
                        <ha-icon-button
                            @click=${()=>this._highlightAnchorInPreview(e)}
                            .label=${"Highlight"}
                            .path=${"M12,2A7,7 0 0,1 19,9C19,11.38 17.19,13.47 14.39,17.31C13.57,18.45 12.61,19.74 12,20.65C11.39,19.74 10.43,18.45 9.61,17.31C6.81,13.47 5,11.38 5,9A7,7 0 0,1 12,2M12,6A3,3 0 0,0 9,9A3,3 0 0,0 12,12A3,3 0 0,0 15,9A3,3 0 0,0 12,6Z"}>
                        </ha-icon-button>
                    </div>
                </div>
            </div>
        `}_renderAnchorItem(e,t){const[i,o]=Array.isArray(t)?t:[0,0];return v`
            <div class="list-item-card">
                <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                    <ha-icon icon="mdi:map-marker" style="--mdc-icon-size: 32px; color: var(--primary-color); flex-shrink: 0;"></ha-icon>
                    <div style="flex: 1; min-width: 140px;">
                        <div style="font-weight: 600; margin-bottom: 4px;">${e}</div>
                        <div style="font-size: 12px; color: var(--secondary-text-color);">
                            Position: [${i}, ${o}]
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; flex-shrink: 0; margin-left: auto;">
                        <ha-icon-button
                            @click=${()=>this._editAnchor(e)}
                            .label=${"Edit"}
                            .path=${"M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"}>
                        </ha-icon-button>
                        <ha-icon-button
                            @click=${()=>this._highlightAnchorInPreview(e)}
                            .label=${"Highlight"}
                            .path=${"M12,2A7,7 0 0,1 19,9C19,11.38 17.19,13.47 14.39,17.31C13.57,18.45 12.61,19.74 12,20.65C11.39,19.74 10.43,18.45 9.61,17.31C6.81,13.47 5,11.38 5,9A7,7 0 0,1 12,2M12,6A3,3 0 0,0 9,9A3,3 0 0,0 12,12A3,3 0 0,0 15,9A3,3 0 0,0 12,6Z"}>
                        </ha-icon-button>
                        <ha-icon-button
                            @click=${()=>this._deleteAnchor(e)}
                            .label=${"Delete"}
                            .path=${"M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"}>
                        </ha-icon-button>
                    </div>
                </div>
            </div>
        `}_renderAnchorFormDialog(){const t=!!this._editingAnchorName?`Edit Anchor: ${this._editingAnchorName}`:"Add Anchor",i=this._getBaseSvgAnchors(),o=this._anchorFormName&&i[this._anchorFormName];return v`
            <ha-dialog
                open
                @closed=${s=>{s.stopPropagation(),this._closeAnchorForm()}}
                .headerTitle=${t}
                style="--ha-dialog-width-md: 500px;">
                <div style="padding: 12px 8px;">
                    ${o?v`
                        <lcards-message type="info" style="margin-bottom: 16px;">
                            This name exists in the base_svg. Your custom anchor will override the SVG anchor.
                        </lcards-message>
                    `:""}

                    <ha-input
                        label="Anchor Name"
                        .value=${this._anchorFormName}
                        @input=${s=>{this._anchorFormName=s.target.value,this.requestUpdate()}}
                        required
                        hint="Unique identifier for this anchor"
                        style="width: 100%; margin-bottom: 16px;">
                    </ha-input>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <ha-input
                            type="number"
                            label="X Position"
                            .value=${String(this._anchorFormPosition[0]||0)}
                            @input=${s=>this._updateAnchorFormPosition(0,s.target.value)}>
                        </ha-input>
                        <ha-input
                            type="number"
                            label="Y Position"
                            .value=${String(this._anchorFormPosition[1]||0)}
                            @input=${s=>this._updateAnchorFormPosition(1,s.target.value)}>
                        </ha-input>
                    </div>
                </div>

                <div slot="footer">
                    <ha-button @click=${this._closeAnchorForm} appearance="plain">
                        <ha-icon icon="mdi:close" slot="start"></ha-icon>
                        Cancel
                    </ha-button>
                    <ha-button @click=${this._saveAnchor}>
                        <ha-icon icon="mdi:content-save" slot="start"></ha-icon>
                        Save
                    </ha-button>
                </div>
            </ha-dialog>
        `}_openAnchorForm(){this._showAnchorForm=true,this._editingAnchorName=null,this._anchorFormName=this._generateAnchorName(),this._anchorFormPosition=[0,0],this._anchorFormUnit="vb",this.requestUpdate()}_editAnchor(e){var i,o;const t=(o=(i=this._workingConfig.msd)==null?void 0:i.anchors)==null?void 0:o[e];t&&(this._showAnchorForm=true,this._editingAnchorName=e,this._anchorFormName=e,this._anchorFormPosition=Array.isArray(t)?[...t]:[0,0],this._anchorFormUnit="vb",this.requestUpdate())}_promoteAnchorToUser(e,t){this._showAnchorForm=true,this._editingAnchorName=null,this._anchorFormName=e,this._anchorFormPosition=Array.isArray(t)?[...t]:[0,0],this._anchorFormUnit="vb",this.requestUpdate()}async _promoteAllAnchors(e){var s;const t=((s=this._workingConfig.msd)==null?void 0:s.anchors)||{},i=e.filter(([r])=>!t[r]);if(i.length===0){await this._showDialog("Nothing to Promote","All listed anchors already exist as user anchors.","info");return}if(await this._showConfirmDialog("Promote All",`Copy ${i.length} base SVG anchor${i.length===1?"":"s"} into User Anchors?`,{confirmLabel:"Promote",variant:"primary"})){for(const[r,a]of i){const l=[this._roundToPrecision(a[0]),this._roundToPrecision(a[1])];this._setNestedValue(`msd.anchors.${r}`,l)}m.info(`[MSDStudio] Promoted ${i.length} base SVG anchors to user anchors`),this._schedulePreviewUpdate(),this.requestUpdate()}}async _saveAnchor(){var i;if(!this._anchorFormName||this._anchorFormName.trim()===""){await this._showDialog("Missing Name","Anchor name is required","error");return}if(!this._editingAnchorName&&(((i=this._workingConfig.msd)==null?void 0:i.anchors)||{})[this._anchorFormName]){await this._showDialog("Duplicate Anchor",`Anchor name "${this._anchorFormName}" already exists`,"error");return}this._editingAnchorName&&this._editingAnchorName!==this._anchorFormName&&delete this._workingConfig.msd.anchors[this._editingAnchorName];const e=`msd.anchors.${this._anchorFormName}`,t=[this._roundToPrecision(this._anchorFormPosition[0]),this._roundToPrecision(this._anchorFormPosition[1])];this._setNestedValue(e,t),this._closeAnchorForm(),m.debug("[MSDStudio] Anchor saved:",this._anchorFormName,t)}async _deleteAnchor(e){var i,o;await this._showConfirmDialog("Delete Anchor",`Are you sure you want to delete anchor "${e}"?`)&&(o=(i=this._workingConfig.msd)==null?void 0:i.anchors)!=null&&o[e]&&(delete this._workingConfig.msd.anchors[e],this._schedulePreviewUpdate(),this.requestUpdate(),m.debug("[MSDStudio] Anchor deleted:",e))}async _showConfirmDialog(e,t,i={}){const{confirmLabel:o="Delete",variant:s="danger"}=i;return new Promise(r=>{const a=document.createElement("ha-dialog");a.headerTitle=e,a.open=true;const l=document.createElement("div");l.innerHTML=t,l.style.padding="16px",l.style.lineHeight="1.5",a.appendChild(l);const c=document.createElement("ha-button");c.slot="footer",c.textContent="Cancel",c.setAttribute("appearance","plain"),c.addEventListener("click",()=>{a.open=false,r(false)});const d=document.createElement("ha-button");d.slot="footer",d.textContent=o,d.setAttribute("variant",s),d.addEventListener("click",()=>{a.open=false,r(true)});const h=document.createElement("div");h.slot="footer",h.appendChild(c),h.appendChild(d),a.appendChild(h),a.addEventListener("closed",()=>{a.remove()}),je(a,this)})}_closeAnchorForm(){this._showAnchorForm=false,this._editingAnchorName=null,this._anchorFormName="",this._anchorFormPosition=[0,0],this.requestUpdate()}_highlightAnchorInPreview(e){m.trace("[MSDStudio] Highlight anchor in preview:",e),this._highlightedAnchor=e,this.requestUpdate(),setTimeout(()=>{this._highlightedAnchor=null,this.requestUpdate()},2500)}_updateAnchorFormPosition(e,t){this._anchorFormPosition=[...this._anchorFormPosition],this._anchorFormPosition[e]=this._roundToPrecision(parseFloat(t)||0),this.requestUpdate()}_generateAnchorName(){var o;const e=((o=this._workingConfig.msd)==null?void 0:o.anchors)||{};let t=1,i=`anchor_${t}`;for(;e[i];)t++,i=`anchor_${t}`;return i}_handlePreviewDoubleClick(e){var o,s,r;const i=e.composedPath()[0];if(this._lineClickTimer&&(clearTimeout(this._lineClickTimer),this._lineClickTimer=null),this._activeMode===N.DRAW_SHAPE&&this._drawShapeState.kind==="polyline"){e.stopPropagation(),e.preventDefault(),this._finishDrawShapePolyline();return}if(i.tagName==="path"&&i.classList.contains("line-path")||i.tagName==="path"&&i.classList.contains("line-hit-area")){let a;if(i.classList.contains("line-hit-area")){const l=i.nextElementSibling;a=l==null?void 0:l.getAttribute("data-line-id")}else a=i.getAttribute("data-line-id");if(a){m.debug("[MSDStudioDialog] Double-click on line:",a),this._activeMode===N.ADD_WAYPOINT&&this._exitWaypointMode();const c=(((o=this._workingConfig.msd)==null?void 0:o.overlays)||[]).find(d=>d.id===a&&d.type==="line");c?this._editLine(c):m.warn("[MSDStudioDialog] Line not found:",a),e.stopPropagation(),e.preventDefault();return}}if(this._shapeClickTimer&&(clearTimeout(this._shapeClickTimer),this._shapeClickTimer=null),(s=i.classList)!=null&&s.contains("shape-path")||i.tagName==="path"&&i.classList.contains("shape-hit-area")){let a;if(i.classList.contains("shape-hit-area")){const l=i.nextElementSibling;a=l==null?void 0:l.getAttribute("data-shape-id")}else a=i.getAttribute("data-shape-id");if(a){const c=(((r=this._workingConfig.msd)==null?void 0:r.overlays)||[]).find(d=>d.id===a&&d.type==="shape");c?this._editShape(c):m.warn("[MSDStudioDialog] Shape not found:",a),e.stopPropagation(),e.preventDefault();return}}}_handlePreviewClick(e){var o,s,r,a,l,c;const i=e.composedPath()[0];if(m.debug("[MSDStudioDialog] Preview click:",{mode:this._activeMode,tagName:i.tagName,classList:i.classList?Array.from(i.classList):[],dataset:i.dataset||{},hasAnchorName:(o=i.hasAttribute)==null?void 0:o.call(i,"data-anchor-name")}),this._activeMode===N.VIEW||this._activeMode===N.ADD_WAYPOINT){if(i.tagName==="path"&&i.classList.contains("line-path")||i.tagName==="path"&&i.classList.contains("line-hit-area")){let d;if(i.classList.contains("line-hit-area")){const h=i.nextElementSibling;d=h==null?void 0:h.getAttribute("data-line-id")}else d=i.getAttribute("data-line-id");if(d){this._lineClickTimer&&(clearTimeout(this._lineClickTimer),this._lineClickTimer=null),this._lineClickTimer=setTimeout(()=>{this._selectLine(d),this._lineClickTimer=null},250),e.stopPropagation();return}}if(i.tagName==="path"&&i.classList.contains("shape-path")||i.tagName==="path"&&i.classList.contains("shape-hit-area")){let d;if(i.classList.contains("shape-hit-area")){const h=i.nextElementSibling;d=h==null?void 0:h.getAttribute("data-shape-id")}else d=i.getAttribute("data-shape-id");if(d){this._shapeClickTimer&&(clearTimeout(this._shapeClickTimer),this._shapeClickTimer=null),this._shapeClickTimer=setTimeout(()=>{this._selectedShapeId=d,this.requestUpdate(),this._shapeClickTimer=null},250),e.stopPropagation();return}}if(this._activeMode===N.VIEW){if(this._panJustEnded)return;this._selectedLineId=null,this._selectedShapeId=null,this.requestUpdate();return}}if(this._activeMode===N.ADD_WAYPOINT){if(((s=i.classList)==null?void 0:s.contains("anchor-marker"))||((r=i.classList)==null?void 0:r.contains("interactive-anchor"))||((a=i.hasAttribute)==null?void 0:a.call(i,"data-anchor-name"))){const p=i.getAttribute("data-anchor-name");if(p&&this._selectedLineId){this._addNamedWaypoint(p),e.stopPropagation();return}}if((l=i.classList)!=null&&l.contains("waypoint-marker")||(c=i.classList)!=null&&c.contains("corner-radius-handle")){e.stopPropagation();return}if(i.tagName==="DIV"&&(i.classList.contains("preview-scroll-container")||i.classList.contains("preview-container"))&&!this._waypointDragInProgress&&!this._cornerRadiusDragInProgress){this._exitWaypointMode(),e.stopPropagation();return}if(this._selectedLineId){this._handleAddWaypointClick(e);return}}this._activeMode===N.PLACE_ANCHOR?this._handlePlaceAnchorClick(e):this._activeMode===N.PLACE_CONTROL?this._handlePlaceControlClick(e):this._activeMode===N.CONNECT_LINE?this._handleConnectLineClick(e):this._activeMode===N.DRAW_CHANNEL?this._handleDrawChannelClick(e):this._activeMode===N.DRAW_SHAPE&&this._handleDrawShapeClick(e)}_handlePreviewMouseDown(e){if(this._activeMode===N.DRAW_SHAPE&&(this._drawShapeState.kind==="rect"||this._drawShapeState.kind==="circle")&&this._drawShapeState.points.length===0){const t=this._getPreviewCoordinates(e);if(!t)return;this._shapeDrawDragCandidate={startClientX:e.clientX,startClientY:e.clientY,startCoords:[t.x,t.y],converted:false};return}if(this._activeMode===N.DRAW_CHANNEL&&!this._drawChannelState.startPoint){const t=this._getPreviewCoordinates(e);if(!t)return;this._channelDrawDragCandidate={startClientX:e.clientX,startClientY:e.clientY,startCoords:[t.x,t.y],converted:false};return}if(this._activeMode===N.PLACE_CONTROL&&!this._placeControlDrawState.startPoint){const t=this._getPreviewCoordinates(e);if(!t)return;this._controlDrawDragCandidate={startClientX:e.clientX,startClientY:e.clientY,startCoords:[t.x,t.y],converted:false}}}_handlePreviewMouseMove(e){if(this._shapeDrawDragCandidate&&!this._shapeDrawDragCandidate.converted){const i=e.clientX-this._shapeDrawDragCandidate.startClientX,o=e.clientY-this._shapeDrawDragCandidate.startClientY;Math.hypot(i,o)>4&&(this._shapeDrawDragCandidate.converted=true,this._drawShapeState={kind:this._drawShapeState.kind,points:[this._shapeDrawDragCandidate.startCoords],drawing:true,currentPoint:null})}if(this._channelDrawDragCandidate&&!this._channelDrawDragCandidate.converted){const i=e.clientX-this._channelDrawDragCandidate.startClientX,o=e.clientY-this._channelDrawDragCandidate.startClientY;Math.hypot(i,o)>4&&(this._channelDrawDragCandidate.converted=true,this._drawChannelState={startPoint:this._channelDrawDragCandidate.startCoords,currentPoint:null,drawing:true,tempRectElement:null})}if(this._controlDrawDragCandidate&&!this._controlDrawDragCandidate.converted){const i=e.clientX-this._controlDrawDragCandidate.startClientX,o=e.clientY-this._controlDrawDragCandidate.startClientY;Math.hypot(i,o)>4&&(this._controlDrawDragCandidate.converted=true,this._placeControlDrawState={startPoint:this._controlDrawDragCandidate.startCoords,currentPoint:null,drawing:true})}if(this._showCrosshairs||this._activeMode===N.PLACE_ANCHOR||this._activeMode===N.PLACE_CONTROL){const i=this._getPreviewCoordinatesWithPixels(e);i&&(this._cursorPosition=i,this.requestUpdate())}if(this._activeMode===N.DRAW_CHANNEL&&this._drawChannelState.drawing){const i=this._getPreviewCoordinates(e);i&&(this._drawChannelState.currentPoint=[i.x,i.y],this.requestUpdate())}if(this._activeMode===N.PLACE_CONTROL&&this._placeControlDrawState.drawing){const i=this._getPreviewCoordinates(e);i&&(this._placeControlDrawState.currentPoint=[i.x,i.y],this.requestUpdate())}if(this._activeMode===N.DRAW_SHAPE&&this._drawShapeState.points.length>0){const i=this._getPreviewCoordinates(e);i&&(this._drawShapeState.currentPoint=[i.x,i.y],this.requestUpdate())}}_handlePreviewMouseLeave(){this._cursorPosition=null,this._drawChannelState.drawing&&(this._drawChannelState.currentPoint=null),this._placeControlDrawState.drawing&&(this._placeControlDrawState.currentPoint=null),this._shapeDrawDragCandidate&&!this._shapeDrawDragCandidate.converted&&(this._shapeDrawDragCandidate=null),this._channelDrawDragCandidate&&!this._channelDrawDragCandidate.converted&&(this._channelDrawDragCandidate=null),this._controlDrawDragCandidate&&!this._controlDrawDragCandidate.converted&&(this._controlDrawDragCandidate=null),this.requestUpdate()}_handlePlaceAnchorClick(e){m.debug(`[MSDStudio] _handlePlaceAnchorClick ENTRY - mode: ${this._activeMode}`);const t=this._getPreviewCoordinates(e);if(!t){m.warn("[MSDStudio] Could not get preview coordinates");return}m.debug("[MSDStudio] Place anchor at:",t);const{x:i,y:o}=t;this._showAnchorForm=true,this._editingAnchorName=null,this._anchorFormName=this._generateAnchorName(),this._anchorFormPosition=[i,o],this._anchorFormUnit="vb",this._activeMode=N.VIEW,this.requestUpdate()}_handlePlaceControlClick(e){m.debug(`[MSDStudio] _handlePlaceControlClick ENTRY - mode: ${this._activeMode}`);const t=this._getPreviewCoordinates(e);if(!t){m.warn("[MSDStudio] Could not get preview coordinates");return}if(!this._placeControlDrawState.startPoint){this._placeControlDrawState.startPoint=[t.x,t.y],this._placeControlDrawState.drawing=true,this._controlDrawDragCandidate=null,m.trace("[MSDStudio] Place control draw started at:",t),this.requestUpdate();return}this._finishPlaceControl(this._placeControlDrawState.startPoint,[t.x,t.y])}_finishPlaceControl(e,t){var y;const[i,o]=e,[s,r]=t,a=Math.abs(s-i),l=Math.abs(r-o);let c,d,h,p;if(a<10&&l<10)c=i,d=o,h=100,p=100;else{const w=Math.min(i,s),x=Math.min(o,r);h=a,p=l,c=w+h/2,d=x+p/2}this._placeControlDrawState={startPoint:null,currentPoint:null,drawing:false},this._controlDrawDragCandidate=null;const g=((y=this._workingConfig.msd)==null?void 0:y.overlays)||[];let _=g.filter(w=>w.type==="control").length+1,f=`control_${_}`;for(;g.find(w=>w.id===f);)_++,f=`control_${_}`;this._editingControlId=f,this._controlFormId=f,this._controlFormPosition=[Math.round(c),Math.round(d)],this._controlFormSize=[Math.round(h),Math.round(p)],this._controlFormAttachment="center",this._controlFormPositionSide="center",this._controlFormObstacle=true,this._controlFormZIndex=null,this._controlFormLocked=false,this._controlFormTriggersUpdateMode="specific",this._controlFormTriggersUpdateEntities=[],this._controlFormTriggersUpdateExpanded=false,this._controlFormCard={type:""},this._controlFormAnimations=[],this._controlFormActiveSubtab="placement",this._showControlForm=true,this._activeMode=N.VIEW,this.requestUpdate()}_handleDragStart(e,t){var _,f;e.stopPropagation(),e.preventDefault(),m.debug("[MSDStudio] Drag start:",t);const i=this._findControl(t);if(!i){m.warn("[MSDStudio] Control not found for drag:",t);return}if(i.locked)return;const o=this.shadowRoot.querySelector("lcards-msd-live-preview"),s=o==null?void 0:o.shadowRoot,r=s==null?void 0:s.querySelector(".preview-card-container"),a=r==null?void 0:r.querySelector("lcards-msd-card"),l=((f=(_=a==null?void 0:a._msdPipeline)==null?void 0:_.getResolvedModel())==null?void 0:f.anchors)||{};let c;if(i.position&&Array.isArray(i.position))c=[...i.position];else if(i.position||i.anchor){if(c=this._resolveEditorControlPosition(i,l),!c){m.warn("[MSDStudio] Could not resolve position for drag:",i.position||i.anchor);return}c=[...c]}else{m.warn("[MSDStudio] Control has no position or anchor");return}const d=this._getPreviewCoordinatesFromMouseEvent(e);if(!d){m.warn("[MSDStudio] Could not get coordinates for drag start");return}const h=d.x-c[0],p=d.y-c[1];this._dragState={active:true,controlId:t,startPos:[d.x,d.y],originalPos:c,offsetX:h,offsetY:p};const g=this.shadowRoot.querySelector(".preview-panel");g&&g.classList.add("dragging"),this._boundDragMouseMove&&document.removeEventListener("mousemove",this._boundDragMouseMove),this._boundDragMouseUp&&document.removeEventListener("mouseup",this._boundDragMouseUp),this._boundDragMouseMove=this._handleDrag.bind(this),this._boundDragMouseUp=this._handleDragMouseUp.bind(this),document.addEventListener("mousemove",this._boundDragMouseMove),document.addEventListener("mouseup",this._boundDragMouseUp),this.requestUpdate()}_roundToPrecision(e,t=2){const i=Math.pow(10,t);return Math.round(e*i)/i}_handleDrag(e){if(!this._dragState.active)return;const t=this._getPreviewCoordinatesFromMouseEvent(e);if(!t)return;let i=t.x-this._dragState.offsetX,o=t.y-this._dragState.offsetY;this._enableSnapping&&this._gridSpacing&&(i=Math.round(i/this._gridSpacing)*this._gridSpacing,o=Math.round(o/this._gridSpacing)*this._gridSpacing);const s=this._findControl(this._dragState.controlId);s&&(typeof s.position=="string"||s.anchor&&delete s.anchor,s.position=[this._roundToPrecision(i),this._roundToPrecision(o)],this.requestUpdate())}_handleDragMouseUp(e){if(!this._dragState.active)return;m.debug("[MSDStudio] Drag end:",this._dragState.controlId);const t=this.shadowRoot.querySelector(".preview-panel");t&&t.classList.remove("dragging"),this._dragState={active:false,controlId:null,startPos:null,originalPos:null,offsetX:0,offsetY:0},this._boundDragMouseMove&&(document.removeEventListener("mousemove",this._boundDragMouseMove),this._boundDragMouseMove=null),this._boundDragMouseUp&&(document.removeEventListener("mouseup",this._boundDragMouseUp),this._boundDragMouseUp=null),this._schedulePreviewUpdate(),this.requestUpdate()}_handleDragEnd(e){var t,i,o;if(this._mouseDownPos=null,(t=this._shapeDrawDragCandidate)!=null&&t.converted){const s=this._getPreviewCoordinates(e);s&&this._drawShapeState.points.length?(this._finishDrawShapeRect(this._drawShapeState.kind,this._drawShapeState.points[0],[s.x,s.y]),this.requestUpdate()):this._shapeDrawDragCandidate=null}if((i=this._channelDrawDragCandidate)!=null&&i.converted){const s=this._getPreviewCoordinates(e);s&&this._drawChannelState.startPoint?(this._finishDrawChannel(this._drawChannelState.startPoint,[s.x,s.y]),this.requestUpdate()):this._channelDrawDragCandidate=null}if((o=this._controlDrawDragCandidate)!=null&&o.converted){const s=this._getPreviewCoordinates(e);s&&this._placeControlDrawState.startPoint?(this._finishPlaceControl(this._placeControlDrawState.startPoint,[s.x,s.y]),this.requestUpdate()):this._controlDrawDragCandidate=null}}_getAttachmentOffset(e,t,i){const o={"top-left":[0,0],top:[-t/2,0],"top-center":[-t/2,0],"top-right":[-t,0],left:[0,-i/2],center:[-t/2,-i/2],"middle-center":[-t/2,-i/2],right:[-t,-i/2],"bottom-left":[0,-i],bottom:[-t/2,-i],"bottom-center":[-t/2,-i],"bottom-right":[-t,-i]};return o[e]||o["top-left"]}_renderLiveCoordBadge(e,t,i,o){if(t&&Array.isArray(o)){const[s,r]=o;return v`
                <div class="live-coord-badge" style="top: 50%; left: 50%; transform: translate(-50%, -50%);">
                    ${Math.round(s)} × ${Math.round(r)}
                </div>
            `}if(e&&Array.isArray(i)){const[s,r]=i;return v`
                <div class="live-coord-badge" style="bottom: -28px; left: 50%; transform: translateX(-50%);">
                    ${Math.round(s)}, ${Math.round(r)}
                </div>
            `}return""}_renderResizeHandles(e,t,i,o){return v`
            ${["tl","t","tr","r","br","b","bl","l"].map(r=>{const a=o&&this._resizeState.handle===r;return v`
                    <div
                        class="resize-handle ${r} ${a?"active":""}"
                        data-handle="${r}"
                        @mousedown=${l=>this._handleResizeStart(l,e,r)}>
                    </div>
                `})}
        `}_handleResizeStart(e,t,i){var y,w;e.stopPropagation(),e.preventDefault(),m.debug("[MSDStudio] Resize start:",t,i);const o=this._findControl(t);if(!o){m.warn("[MSDStudio] Control not found for resize:",t);return}if(o.locked)return;const s=this.shadowRoot.querySelector("lcards-msd-live-preview"),r=s==null?void 0:s.shadowRoot,a=r==null?void 0:r.querySelector(".preview-card-container"),l=a==null?void 0:a.querySelector("lcards-msd-card"),c=((w=(y=l==null?void 0:l._msdPipeline)==null?void 0:y.getResolvedModel())==null?void 0:w.anchors)||{};let d;if(o.position&&Array.isArray(o.position))d=[...o.position];else if(o.position||o.anchor){if(d=this._resolveEditorControlPosition(o,c),!d){m.warn("[MSDStudio] Could not resolve position for resize:",o.position||o.anchor);return}d=[...d]}else{m.warn("[MSDStudio] Control has no position or anchor");return}const h=o.size?[...o.size]:[100,100],p=this._getPreviewCoordinatesFromMouseEvent(e);if(!p){m.warn("[MSDStudio] Could not get coordinates for resize start");return}const g=o.attachment||"center",_=this._getAttachmentOffset(g,h[0],h[1]),f=[d[0]+_[0],d[1]+_[1]];this._resizeState={active:true,controlId:t,handle:i,startPos:[p.x,p.y],startSize:h,startPosition:f},this._boundResizeMouseMove&&document.removeEventListener("mousemove",this._boundResizeMouseMove),this._boundResizeMouseUp&&document.removeEventListener("mouseup",this._boundResizeMouseUp),this._boundResizeMouseMove=this._handleResize.bind(this),this._boundResizeMouseUp=this._handleResizeMouseUp.bind(this),document.addEventListener("mousemove",this._boundResizeMouseMove),document.addEventListener("mouseup",this._boundResizeMouseUp),this.requestUpdate()}_handleResize(e){if(!this._resizeState.active)return;const t=this._getPreviewCoordinatesFromMouseEvent(e);if(!t)return;const i=t.x-this._resizeState.startPos[0],o=t.y-this._resizeState.startPos[1],s=this._findControl(this._resizeState.controlId);if(!s)return;typeof s.position=="string"||s.anchor&&delete s.anchor,s.size||(s.size=[100,100]);const[r,a]=this._resizeState.startSize,[l,c]=this._resizeState.startPosition,d=this._resizeState.handle;let h=r,p=a,g=l,_=c;switch(d){case"tl":h=r-i,p=a-o,g=l+i,_=c+o;break;case"t":p=a-o,_=c+o;break;case"tr":h=r+i,p=a-o,_=c+o;break;case"r":h=r+i;break;case"br":h=r+i,p=a+o;break;case"b":p=a+o;break;case"bl":h=r-i,p=a+o,g=l+i;break;case"l":h=r-i,g=l+i;break}const f=20;h<f&&(h=f,d.includes("l")&&(g=l+r-f)),p<f&&(p=f,d.includes("t")&&(_=c+a-f)),this._enableSnapping&&this._gridSpacing&&(h=Math.round(h/this._gridSpacing)*this._gridSpacing,p=Math.round(p/this._gridSpacing)*this._gridSpacing,g=Math.round(g/this._gridSpacing)*this._gridSpacing,_=Math.round(_/this._gridSpacing)*this._gridSpacing);const y=s.attachment||"center",w=this._getAttachmentOffset(y,h,p),x=g-w[0],$=_-w[1];s.size=[this._roundToPrecision(h),this._roundToPrecision(p)],s.position=[this._roundToPrecision(x),this._roundToPrecision($)],this.requestUpdate()}_handleResizeMouseUp(e){this._resizeState.active&&(m.debug("[MSDStudio] Resize end:",this._resizeState.controlId),this._resizeState={active:false,controlId:null,handle:null,startPos:null,startSize:null,startPosition:null},this._boundResizeMouseMove&&(document.removeEventListener("mousemove",this._boundResizeMouseMove),this._boundResizeMouseMove=null),this._boundResizeMouseUp&&(document.removeEventListener("mouseup",this._boundResizeMouseUp),this._boundResizeMouseUp=null),this._schedulePreviewUpdate(),this.requestUpdate())}_handleShapeDragStart(e,t){e.stopPropagation(),e.preventDefault();const i=this._findControl(t);if(!i||!Array.isArray(i.position)){m.warn("[MSDStudio] Shape not found or has no literal position for drag:",t);return}if(i.locked)return;const o=this._getPreviewCoordinatesFromMouseEvent(e);if(!o)return;const s=[...i.position];this._shapeDragState={active:true,shapeId:t,startPos:[o.x,o.y],originalPos:s,offsetX:o.x-s[0],offsetY:o.y-s[1]};const r=this.shadowRoot.querySelector(".preview-panel");r&&r.classList.add("dragging"),this._boundShapeDragMouseMove&&document.removeEventListener("mousemove",this._boundShapeDragMouseMove),this._boundShapeDragMouseUp&&document.removeEventListener("mouseup",this._boundShapeDragMouseUp),this._boundShapeDragMouseMove=this._handleShapeDrag.bind(this),this._boundShapeDragMouseUp=this._handleShapeDragMouseUp.bind(this),document.addEventListener("mousemove",this._boundShapeDragMouseMove),document.addEventListener("mouseup",this._boundShapeDragMouseUp),this.requestUpdate()}_handleShapeDrag(e){if(!this._shapeDragState.active)return;const t=this._getPreviewCoordinatesFromMouseEvent(e);if(!t)return;let i=t.x-this._shapeDragState.offsetX,o=t.y-this._shapeDragState.offsetY;this._enableSnapping&&this._gridSpacing&&(i=Math.round(i/this._gridSpacing)*this._gridSpacing,o=Math.round(o/this._gridSpacing)*this._gridSpacing);const s=this._findControl(this._shapeDragState.shapeId);s&&(s.position=[this._roundToPrecision(i),this._roundToPrecision(o)],this.requestUpdate())}_handleShapeDragMouseUp(e){if(!this._shapeDragState.active)return;m.debug("[MSDStudio] Shape drag end:",this._shapeDragState.shapeId);const t=this.shadowRoot.querySelector(".preview-panel");t&&t.classList.remove("dragging"),this._shapeDragState={active:false,shapeId:null,startPos:null,originalPos:null,offsetX:0,offsetY:0},this._boundShapeDragMouseMove&&(document.removeEventListener("mousemove",this._boundShapeDragMouseMove),this._boundShapeDragMouseMove=null),this._boundShapeDragMouseUp&&(document.removeEventListener("mouseup",this._boundShapeDragMouseUp),this._boundShapeDragMouseUp=null),this._schedulePreviewUpdate(),this.requestUpdate()}_renderShapeResizeHandles(e,t,i,o){return v`
            ${["tl","t","tr","r","br","b","bl","l"].map(r=>{const a=o&&this._shapeResizeState.handle===r;return v`
                    <div
                        class="resize-handle ${r} ${a?"active":""}"
                        data-handle="${r}"
                        @mousedown=${l=>this._handleShapeResizeStart(l,e,r)}>
                    </div>
                `})}
        `}_handleShapeResizeStart(e,t,i){e.stopPropagation(),e.preventDefault();const o=this._findControl(t);if(!o||!Array.isArray(o.position)){m.warn("[MSDStudio] Shape not found or has no literal position for resize:",t);return}if(o.locked)return;const s=this._getPreviewCoordinatesFromMouseEvent(e);s&&(this._shapeResizeState={active:true,shapeId:t,handle:i,startPos:[s.x,s.y],startSize:o.size?[...o.size]:[100,60],startPosition:[...o.position]},this._boundShapeResizeMouseMove&&document.removeEventListener("mousemove",this._boundShapeResizeMouseMove),this._boundShapeResizeMouseUp&&document.removeEventListener("mouseup",this._boundShapeResizeMouseUp),this._boundShapeResizeMouseMove=this._handleShapeResize.bind(this),this._boundShapeResizeMouseUp=this._handleShapeResizeMouseUp.bind(this),document.addEventListener("mousemove",this._boundShapeResizeMouseMove),document.addEventListener("mouseup",this._boundShapeResizeMouseUp),this.requestUpdate())}_handleShapeResize(e){if(!this._shapeResizeState.active)return;const t=this._getPreviewCoordinatesFromMouseEvent(e);if(!t)return;const i=t.x-this._shapeResizeState.startPos[0],o=t.y-this._shapeResizeState.startPos[1],s=this._findControl(this._shapeResizeState.shapeId);if(!s)return;const[r,a]=this._shapeResizeState.startSize,[l,c]=this._shapeResizeState.startPosition,d=this._shapeResizeState.handle;let h=r,p=a,g=l,_=c;switch(d){case"tl":h=r-i,p=a-o,g=l+i,_=c+o;break;case"t":p=a-o,_=c+o;break;case"tr":h=r+i,p=a-o,_=c+o;break;case"r":h=r+i;break;case"br":h=r+i,p=a+o;break;case"b":p=a+o;break;case"bl":h=r-i,p=a+o,g=l+i;break;case"l":h=r-i,g=l+i;break}const f=10;h<f&&(h=f,d.includes("l")&&(g=l+r-f)),p<f&&(p=f,d.includes("t")&&(_=c+a-f)),this._enableSnapping&&this._gridSpacing&&(h=Math.round(h/this._gridSpacing)*this._gridSpacing,p=Math.round(p/this._gridSpacing)*this._gridSpacing,g=Math.round(g/this._gridSpacing)*this._gridSpacing,_=Math.round(_/this._gridSpacing)*this._gridSpacing),s.size=[this._roundToPrecision(h),this._roundToPrecision(p)],s.position=[this._roundToPrecision(g),this._roundToPrecision(_)],this.requestUpdate()}_handleShapeResizeMouseUp(e){this._shapeResizeState.active&&(m.debug("[MSDStudio] Shape resize end:",this._shapeResizeState.shapeId),this._shapeResizeState={active:false,shapeId:null,handle:null,startPos:null,startSize:null,startPosition:null},this._boundShapeResizeMouseMove&&(document.removeEventListener("mousemove",this._boundShapeResizeMouseMove),this._boundShapeResizeMouseMove=null),this._boundShapeResizeMouseUp&&(document.removeEventListener("mouseup",this._boundShapeResizeMouseUp),this._boundShapeResizeMouseUp=null),this._schedulePreviewUpdate(),this.requestUpdate())}_handleShapeVertexMouseDown(e,t,i){e.stopPropagation(),e.preventDefault();const o=this._findControl(t);o!=null&&o.locked||(this._shapeVertexDragInProgress=true,this._shapeVertexDragState={shapeId:t,vertexIndex:i,startX:e.clientX,startY:e.clientY},this._boundShapeVertexMouseMove=this._handleShapeVertexMouseMove.bind(this),this._boundShapeVertexMouseUp=this._handleShapeVertexMouseUp.bind(this),document.addEventListener("mousemove",this._boundShapeVertexMouseMove),document.addEventListener("mouseup",this._boundShapeVertexMouseUp),this.requestUpdate())}_handleShapeVertexMouseMove(e){var c,d;if(!this._shapeVertexDragState)return;e.preventDefault();const{shapeId:t,vertexIndex:i}=this._shapeVertexDragState,o=this._getPreviewCoordinatesFromMouseEvent(e);if(!o)return;let{x:s,y:r}=o;if(this._enableSnapping&&this._gridSpacing>0){const h=_i(s,r,this._gridSpacing);s=h[0],r=h[1]}const l=(((c=this._workingConfig.msd)==null?void 0:c.overlays)||[]).find(h=>h.id===t&&h.type==="shape");l&&Array.isArray(l.points)&&l.points[i]!==void 0&&(l.points[i]=[this._roundToPrecision(s),this._roundToPrecision(r)],((d=this._shapeFormData)==null?void 0:d.id)===t&&this._shapeFormData.points&&(this._shapeFormData.points[i]=l.points[i]),this._schedulePreviewUpdate(),this.requestUpdate())}_handleShapeVertexMouseUp(e){this._shapeVertexDragState&&(e.preventDefault(),e.stopPropagation(),this._shapeVertexDragState=null,this._boundShapeVertexMouseMove&&(document.removeEventListener("mousemove",this._boundShapeVertexMouseMove),this._boundShapeVertexMouseMove=null),this._boundShapeVertexMouseUp&&(document.removeEventListener("mouseup",this._boundShapeVertexMouseUp),this._boundShapeVertexMouseUp=null),setTimeout(()=>{this._shapeVertexDragInProgress=false},150),this.requestUpdate())}_handleShapeVertexDoubleClick(e,t,i){var r,a;e.stopPropagation(),e.preventDefault();const s=(((r=this._workingConfig.msd)==null?void 0:r.overlays)||[]).find(l=>l.id===t&&l.type==="shape");if(!s||!Array.isArray(s.points)||s.points.length<=2){m.warn("[MSDStudio] Cannot delete vertex — polyline needs at least 2 points");return}s.points.splice(i,1),((a=this._shapeFormData)==null?void 0:a.id)===t&&(this._shapeFormData.points=[...s.points]),this._schedulePreviewUpdate(),this.requestUpdate()}_handleShapeSegmentInsertClick(e,t,i,o,s){var l,c;e.stopPropagation(),e.preventDefault();const a=(((l=this._workingConfig.msd)==null?void 0:l.overlays)||[]).find(d=>d.id===t&&d.type==="shape");!a||!Array.isArray(a.points)||(a.points.splice(i,0,[this._roundToPrecision(o),this._roundToPrecision(s)]),((c=this._shapeFormData)==null?void 0:c.id)===t&&(this._shapeFormData.points=[...a.points]),this._schedulePreviewUpdate(),this.requestUpdate())}_handleAnchorDragStart(e,t){var r;e.stopPropagation(),e.preventDefault(),m.debug("[MSDStudio] Anchor drag start:",t);const o=(((r=this._workingConfig.msd)==null?void 0:r.anchors)||{})[t];if(!o||!Array.isArray(o)){m.warn("[MSDStudio] Anchor not found for drag:",t);return}const s=this._getPreviewCoordinatesFromMouseEvent(e);if(!s){m.warn("[MSDStudio] Could not get coordinates for anchor drag start");return}this._anchorDragState={active:true,anchorName:t,startPos:[s.x,s.y],originalPos:[...o]},this._boundAnchorDragMouseMove&&document.removeEventListener("mousemove",this._boundAnchorDragMouseMove),this._boundAnchorDragMouseUp&&document.removeEventListener("mouseup",this._boundAnchorDragMouseUp),this._boundAnchorDragMouseMove=this._handleAnchorDrag.bind(this),this._boundAnchorDragMouseUp=this._handleAnchorDragMouseUp.bind(this),document.addEventListener("mousemove",this._boundAnchorDragMouseMove),document.addEventListener("mouseup",this._boundAnchorDragMouseUp),this.requestUpdate()}_handleAnchorDrag(e){var r;if(!this._anchorDragState.active)return;const t=this._getPreviewCoordinatesFromMouseEvent(e);if(!t)return;let i=t.x,o=t.y;this._enableSnapping&&this._gridSpacing&&(i=Math.round(i/this._gridSpacing)*this._gridSpacing,o=Math.round(o/this._gridSpacing)*this._gridSpacing);const s=((r=this._workingConfig.msd)==null?void 0:r.anchors)||{};s[this._anchorDragState.anchorName]&&(s[this._anchorDragState.anchorName]=[this._roundToPrecision(i),this._roundToPrecision(o)],this.requestUpdate())}_handleAnchorDragMouseUp(e){this._anchorDragState.active&&(m.debug("[MSDStudio] Anchor drag end:",this._anchorDragState.anchorName),this._anchorDragState={active:false,anchorName:null,startPos:null,originalPos:null},this._boundAnchorDragMouseMove&&(document.removeEventListener("mousemove",this._boundAnchorDragMouseMove),this._boundAnchorDragMouseMove=null),this._boundAnchorDragMouseUp&&(document.removeEventListener("mouseup",this._boundAnchorDragMouseUp),this._boundAnchorDragMouseUp=null),this._schedulePreviewUpdate(),this.requestUpdate())}_handleAnchorDoubleClick(e,t){var s;e.stopPropagation(),e.preventDefault(),m.debug("[MSDStudio] Anchor double-click:",t);const o=(((s=this._workingConfig.msd)==null?void 0:s.anchors)||{})[t];if(!o||!Array.isArray(o)){m.warn("[MSDStudio] Anchor not found:",t);return}this._editingAnchorName=t,this._anchorFormName=t,this._anchorFormPosition=[...o],this._anchorFormUnit="vb",this._showAnchorForm=true,this.requestUpdate()}_renderChannelResizeHandles(e,t,i,o){return v`
            ${["tl","t","tr","r","br","b","bl","l"].map(r=>{const a=o&&this._channelResizeState.handle===r;return v`
                    <div
                        class="resize-handle ${r} ${a?"active":""}"
                        data-handle="${r}"
                        style="background: #00FFAA; border-color: #00FFAA;"
                        @mousedown=${l=>this._handleChannelResizeStart(l,e,r)}>
                    </div>
                `})}
        `}_handleChannelDragStart(e,t){var r;e.stopPropagation(),e.preventDefault();const o=(((r=this._workingConfig.msd)==null?void 0:r.channels)||{})[t];if(!o||!o.bounds){m.warn("[MSDStudio] Channel not found or has no bounds for drag:",t);return}const s=this._getPreviewCoordinatesFromMouseEvent(e);if(!s){m.warn("[MSDStudio] Could not get coordinates for channel drag start");return}this._channelDragState={active:true,channelId:t,startPos:[s.x,s.y],startBounds:[...o.bounds]},this._boundChannelDragMouseMove&&document.removeEventListener("mousemove",this._boundChannelDragMouseMove),this._boundChannelDragMouseUp&&document.removeEventListener("mouseup",this._boundChannelDragMouseUp),this._boundChannelDragMouseMove=this._handleChannelDrag.bind(this),this._boundChannelDragMouseUp=this._handleChannelDragMouseUp.bind(this),document.addEventListener("mousemove",this._boundChannelDragMouseMove),document.addEventListener("mouseup",this._boundChannelDragMouseUp),this.requestUpdate()}_handleChannelDrag(e){var g;if(!this._channelDragState.active)return;const t=this._getPreviewCoordinatesFromMouseEvent(e);if(!t)return;const i=t.x-this._channelDragState.startPos[0],o=t.y-this._channelDragState.startPos[1],r=(((g=this._workingConfig.msd)==null?void 0:g.channels)||{})[this._channelDragState.channelId];if(!r)return;const[a,l,c,d]=this._channelDragState.startBounds;let h=a+i,p=l+o;this._enableSnapping&&this._gridSpacing&&(h=Math.round(h/this._gridSpacing)*this._gridSpacing,p=Math.round(p/this._gridSpacing)*this._gridSpacing),r.bounds=[this._roundToPrecision(h),this._roundToPrecision(p),c,d],this.requestUpdate()}_handleChannelDragMouseUp(e){this._channelDragState.active&&(m.debug("[MSDStudio] Channel drag end:",this._channelDragState.channelId),this._channelDragState={active:false,channelId:null,startPos:null,startBounds:null},this._boundChannelDragMouseMove&&(document.removeEventListener("mousemove",this._boundChannelDragMouseMove),this._boundChannelDragMouseMove=null),this._boundChannelDragMouseUp&&(document.removeEventListener("mouseup",this._boundChannelDragMouseUp),this._boundChannelDragMouseUp=null),this._schedulePreviewUpdate(),this.requestUpdate())}_handleChannelResizeStart(e,t,i){var a;e.stopPropagation(),e.preventDefault(),m.debug("[MSDStudio] Channel resize start:",t,i);const s=(((a=this._workingConfig.msd)==null?void 0:a.channels)||{})[t];if(!s||!s.bounds){m.warn("[MSDStudio] Channel not found or has no bounds:",t);return}const r=this._getPreviewCoordinatesFromMouseEvent(e);if(!r){m.warn("[MSDStudio] Could not get coordinates for channel resize start");return}this._channelResizeState={active:true,channelId:t,handle:i,startPos:[r.x,r.y],startBounds:[...s.bounds]},this._boundChannelResizeMouseMove&&document.removeEventListener("mousemove",this._boundChannelResizeMouseMove),this._boundChannelResizeMouseUp&&document.removeEventListener("mouseup",this._boundChannelResizeMouseUp),this._boundChannelResizeMouseMove=this._handleChannelResize.bind(this),this._boundChannelResizeMouseUp=this._handleChannelResizeMouseUp.bind(this),document.addEventListener("mousemove",this._boundChannelResizeMouseMove),document.addEventListener("mouseup",this._boundChannelResizeMouseUp),this.requestUpdate()}_handleChannelResize(e){var w;if(!this._channelResizeState.active)return;const t=this._getPreviewCoordinatesFromMouseEvent(e);if(!t)return;const i=t.x-this._channelResizeState.startPos[0],o=t.y-this._channelResizeState.startPos[1],r=(((w=this._workingConfig.msd)==null?void 0:w.channels)||{})[this._channelResizeState.channelId];if(!r)return;const[a,l,c,d]=this._channelResizeState.startBounds,h=this._channelResizeState.handle;let p=a,g=l,_=c,f=d;switch(h){case"tl":_=c-i,f=d-o,p=a+i,g=l+o;break;case"t":f=d-o,g=l+o;break;case"tr":_=c+i,f=d-o,g=l+o;break;case"r":_=c+i;break;case"br":_=c+i,f=d+o;break;case"b":f=d+o;break;case"bl":_=c-i,f=d+o,p=a+i;break;case"l":_=c-i,p=a+i;break}const y=50;_<y&&(_=y,h.includes("l")&&(p=a+c-y)),f<y&&(f=y,h.includes("t")&&(g=l+d-y)),this._enableSnapping&&this._gridSpacing&&(_=Math.round(_/this._gridSpacing)*this._gridSpacing,f=Math.round(f/this._gridSpacing)*this._gridSpacing,p=Math.round(p/this._gridSpacing)*this._gridSpacing,g=Math.round(g/this._gridSpacing)*this._gridSpacing),r.bounds=[this._roundToPrecision(p),this._roundToPrecision(g),this._roundToPrecision(_),this._roundToPrecision(f)],this.requestUpdate()}_handleChannelResizeMouseUp(e){this._channelResizeState.active&&(m.debug("[MSDStudio] Channel resize end:",this._channelResizeState.channelId),this._channelResizeState={active:false,channelId:null,handle:null,startPos:null,startBounds:null},this._boundChannelResizeMouseMove&&(document.removeEventListener("mousemove",this._boundChannelResizeMouseMove),this._boundChannelResizeMouseMove=null),this._boundChannelResizeMouseUp&&(document.removeEventListener("mouseup",this._boundChannelResizeMouseUp),this._boundChannelResizeMouseUp=null),this._schedulePreviewUpdate(),this.requestUpdate())}_handleChannelDoubleClick(e,t){var s;e.stopPropagation(),e.preventDefault(),m.debug("[MSDStudio] Channel double-click:",t);const o=(((s=this._workingConfig.msd)==null?void 0:s.channels)||{})[t];if(!o){m.warn("[MSDStudio] Channel not found:",t);return}this._editChannel(t,o)}_resolveControlPosition(e){return Hi(e,this._workingConfig,this.shadowRoot)}_resolvePositionWithSide(e,t){return qr(e,t,this._workingConfig,this.shadowRoot)}_getAttachmentTargetAt(e){var h,p;const[t,i]=e,o=30;m.trace("[MSDStudio] Checking snap at:",t,i);const r=(((h=this._workingConfig.msd)==null?void 0:h.overlays)||[]).filter(g=>g.type==="control");for(const g of r){const _=this._resolveControlPosition(g);if(!_)continue;const[f,y]=_,w=g.size||[100,100],[x,$]=w,D={center:[f+x/2,y+$/2],top:[f+x/2,y],bottom:[f+x/2,y+$],left:[f,y+$/2],right:[f+x,y+$/2],"top-left":[f,y],"top-right":[f+x,y],"bottom-left":[f,y+$],"bottom-right":[f+x,y+$]};for(const[M,[P,k]]of Object.entries(D)){const L=Math.sqrt(Math.pow(t-P,2)+Math.pow(i-k,2));if(L<o)return m.trace("[MSDStudio] Snap found on control:",g.id,"side:",M,"dist:",L),{type:"control",id:g.id,side:M==="center"?null:M}}}const a=this._getShapeOverlays();for(const g of a){if(g.kind==="polyline"){if(!Array.isArray(g.points))continue;for(let $=0;$<g.points.length;$++){const D=g.points[$];if(!Array.isArray(D)||D.length<2)continue;const[M,P]=D,k=Math.sqrt(Math.pow(t-M,2)+Math.pow(i-P,2));if(k<o)return m.trace("[MSDStudio] Snap found on shape vertex:",g.id,"vertex:",$,"dist:",k),{type:"shape",id:g.id,side:`vertex${$}`}}continue}if(!Array.isArray(g.position)||!Array.isArray(g.size))continue;const[_,f]=g.position,[y,w]=g.size,x={center:[_+y/2,f+w/2],top:[_+y/2,f],bottom:[_+y/2,f+w],left:[_,f+w/2],right:[_+y,f+w/2],"top-left":[_,f],"top-right":[_+y,f],"bottom-left":[_,f+w],"bottom-right":[_+y,f+w]};for(const[$,[D,M]]of Object.entries(x)){const P=Math.sqrt(Math.pow(t-D,2)+Math.pow(i-M,2));if(P<o)return m.trace("[MSDStudio] Snap found on shape:",g.id,"side:",$,"dist:",P),{type:"shape",id:g.id,side:$==="center"?null:$}}}const l=((p=this._workingConfig.msd)==null?void 0:p.anchors)||{},c=this._getBaseSvgAnchors(),d={...l,...c};if(!d||typeof d!="object"||Array.isArray(d))return m.warn("[MSDStudio] Invalid anchors data:",d),null;for(const[g,_]of Object.entries(d)){if(!Array.isArray(_)||_.length<2){m.trace("[MSDStudio] Invalid anchor position for",g,":",_);continue}const[f,y]=_;if(Math.sqrt(Math.pow(t-f,2)+Math.pow(i-y,2))<o)return{type:"anchor",id:g,side:null}}return null}_handleLineEndpointDragStart(e,t,i){var d;if(e.stopPropagation(),e.preventDefault(),this._activeMode===N.ADD_WAYPOINT){m.debug("[MSDStudio] Endpoint dragging disabled in waypoint mode");return}m.debug("[MSDStudio] Line endpoint drag start:",t,i);const s=(((d=this._workingConfig.msd)==null?void 0:d.overlays)||[]).find(h=>h.id===t&&h.type==="line");if(!s){m.warn("[MSDStudio] Line not found:",t);return}const r=this._getPreviewCoordinatesFromMouseEvent(e);if(!r){m.warn("[MSDStudio] Could not get coordinates");return}let a=null;if(i==="start")a=s.anchor;else if(i==="end"){const h=s.attach_to;Array.isArray(h)?a=h[h.length-1]:a=h}this._lineEndpointDragState={active:true,lineId:t,endpoint:i,startPos:[r.x,r.y],currentPos:[r.x,r.y],originalTarget:a,originalShowAttachmentPoints:this._showAttachmentPoints},this._showAttachmentPoints=true;const l=u(h=>this._handleLineEndpointDrag(h),"handleMouseMove"),c=u(()=>{this._finishLineEndpointDrag(),document.removeEventListener("mousemove",l),document.removeEventListener("mouseup",c);const h=this._lineEndpointDragState.originalShowAttachmentPoints;this._lineEndpointDragState={active:false,lineId:null,endpoint:null,startPos:null,originalTarget:null},this._showAttachmentPoints=h,this.requestUpdate()},"handleMouseUp");document.addEventListener("mousemove",l),document.addEventListener("mouseup",c),m.trace("[MSDStudio] Line endpoint drag listeners added"),this.requestUpdate()}_handleLineEndpointDrag(e){if(!this._lineEndpointDragState.active)return;const t=this._getPreviewCoordinatesFromMouseEvent(e);t&&(this._lineEndpointDragState.currentPos=[t.x,t.y],this.requestUpdate())}_finishLineEndpointDrag(){var c;if(!this._lineEndpointDragState.active||!this._lineEndpointDragState.currentPos)return;const{lineId:e,endpoint:t,currentPos:i,originalTarget:o}=this._lineEndpointDragState,s=this._getAttachmentTargetAt(i);if(!s){m.debug("[MSDStudio] No valid target found - canceling drag");return}const a=(((c=this._workingConfig.msd)==null?void 0:c.overlays)||[]).find(d=>d.id===e&&d.type==="line");if(!a)return;t==="start"?(a.anchor=s.id,(s.type==="control"||s.type==="shape")&&s.side?a.anchor_side=s.side:delete a.anchor_side,m.debug("[MSDStudio] Updated line start to:",s.id,"side:",s.side)):t==="end"&&(typeof a.attach_to=="string"||!a.attach_to?a.attach_to=s.id:Array.isArray(a.attach_to)&&(a.attach_to.length===0?a.attach_to.push(s.id):a.attach_to[a.attach_to.length-1]=s.id),(s.type==="control"||s.type==="shape")&&s.side?a.attach_side=s.side:delete a.attach_side,m.debug("[MSDStudio] Updated line end to:",s.id,"side:",s.side)),this._schedulePreviewUpdate(),this._showRoutingPaths?(this._showRoutingPaths=false,this.requestUpdate(),setTimeout(()=>{this._showRoutingPaths=true,this.requestUpdate()},50)):this.requestUpdate()}_handleControlDoubleClick(e,t){e.stopPropagation(),e.preventDefault(),m.debug("[MSDStudio] Control double-click:",t);const i=this._findControl(t);if(!i){m.warn("[MSDStudio] Control not found:",t);return}this._editControl(i)}_findControl(e){var i;return(((i=this._workingConfig.msd)==null?void 0:i.overlays)||[]).find(o=>o.id===e)||null}_getPreviewCoordinatesFromMouseEvent(e){const t=this._getZoomTransform();return Br(e,this.shadowRoot,this._workingConfig,t)}_getPreviewCoordinates(e){const t=this._getPreviewSvgAndViewBox();if(!t)return m.warn("[MSDStudio] No preview SVG found for coordinate conversion"),null;const{svg:i,viewBoxX:o,viewBoxY:s,viewBoxWidth:r,viewBoxHeight:a}=t,l=i.getBoundingClientRect(),c=e.clientX-l.left,d=e.clientY-l.top,h=r/l.width,p=a/l.height,g=Math.max(h,p),_=r/g,f=a/g,y=(l.width-_)/2,w=(l.height-f)/2;let x=o+(c-y)*g,$=s+(d-w)*g;const D=this._enableSnapping||this._snapToGrid;if(D){const M=this._gridSpacing||50;x=Math.round(x/M)*M,$=Math.round($/M)*M}return m.trace("[MSDStudio] Converted coordinates:",{screen:{x:c,y:d},viewBox:{x,y:$},scale:g,rect:{width:l.width,height:l.height}}),D?{x,y:$}:{x:this._roundToPrecision(x),y:this._roundToPrecision($)}}_getPreviewCoordinatesWithPixels(e){const t=e.currentTarget,i=this._getPreviewSvgAndViewBox();if(!i)return null;const{svg:o,viewBoxX:s,viewBoxY:r,viewBoxWidth:a,viewBoxHeight:l}=i,c=o.getBoundingClientRect(),d=t.getBoundingClientRect(),h=e.clientX-c.left,p=e.clientY-c.top,g=a/c.width,_=l/c.height,f=Math.max(g,_),y=a/f,w=l/f,x=(c.width-y)/2,$=(c.height-w)/2,D=h-x,M=p-$;let P=s+D*f,k=r+M*f,L=e.clientX-d.left,E=e.clientY-d.top;const B=this._getDebugSettings();if(this._enableSnapping||this._snapToGrid){const I=B.grid_spacing||50;P=Math.round(P/I)*I,k=Math.round(k/I)*I;const F=(P-s)/f+x,b=(k-r)/f+$;L=c.left-d.left+F,E=c.top-d.top+b}return{x:Math.round(P),y:Math.round(k),pixelX:L,pixelY:E,panelWidth:d.width,panelHeight:d.height}}_handleDrawChannelClick(e){const t=this._getPreviewCoordinates(e);if(!t){m.warn("[MSDStudio] Could not get preview coordinates");return}this._drawChannelState.startPoint?this._finishDrawChannel(this._drawChannelState.startPoint,[t.x,t.y]):(this._drawChannelState.startPoint=[t.x,t.y],this._drawChannelState.drawing=true,this._channelDrawDragCandidate=null,m.trace("[MSDStudio] Draw channel started at:",t))}_finishDrawChannel(e,t){const[i,o]=e,[s,r]=t,a=Math.min(i,s),l=Math.min(o,r),c=Math.abs(s-i),d=Math.abs(r-o);m.trace("[MSDStudio] Draw channel finished:",{x:a,y:l,width:c,height:d}),this._drawChannelState.startPoint=null,this._drawChannelState.drawing=false,this._channelDrawDragCandidate=null;const h={x:a,y:l,width:c,height:d},p=this._findLinesIntersectingChannel(h);this._editingChannelId="",this._channelFormData={id:this._generateChannelId(),mode:"prefer",direction:"auto",bounds:[a,l,c,d],weight:.5,line_spacing:8,discoverable:true,suggestedLines:p.length>0?p.map(g=>g.id):null},this._activeMode=N.VIEW,this.requestUpdate()}_handleDrawShapeClick(e){const t=this._getPreviewCoordinates(e);if(!t){m.warn("[MSDStudio] Could not get preview coordinates");return}const i=this._drawShapeState.kind;if(i==="polyline"){this._drawShapeState.points=[...this._drawShapeState.points,[t.x,t.y]],this._drawShapeState.drawing=true,m.trace("[MSDStudio] Added polyline point:",t,"total:",this._drawShapeState.points.length),this.requestUpdate();return}if(!this._drawShapeState.points.length){this._drawShapeState.points=[[t.x,t.y]],this._drawShapeState.drawing=true,this._shapeDrawDragCandidate=null,m.trace("[MSDStudio] Draw shape started at:",t),this.requestUpdate();return}this._finishDrawShapeRect(i,this._drawShapeState.points[0],[t.x,t.y])}_finishDrawShapeRect(e,t,i){const[o,s]=t,[r,a]=i,l=Math.min(o,r),c=Math.min(s,a),d=Math.abs(r-o),h=Math.abs(a-s);if(this._drawShapeState={kind:null,points:[],drawing:false,currentPoint:null},this._shapeDrawDragCandidate=null,this._activeMode=N.VIEW,d<1||h<1){m.warn("[MSDStudio] Shape too small, ignoring"),this.requestUpdate();return}this._openShapeForm(e,{position:[l,c],size:[d,h]})}_finishDrawShapePolyline(){let e=this._drawShapeState.points;if(e.length>=2){const[t,i]=e[e.length-2],[o,s]=e[e.length-1];Math.abs(t-o)<=2&&Math.abs(i-s)<=2&&(e=e.slice(0,-1))}if(e.length<2){m.warn("[MSDStudio] Polyline needs at least 2 points to finish");return}this._drawShapeState={kind:null,points:[],drawing:false,currentPoint:null},this._activeMode=N.VIEW,this._openShapeForm("polyline",{points:e})}_injectLineHighlightStyles(){var a;const e=(a=this.shadowRoot)==null?void 0:a.querySelector("lcards-msd-live-preview");if(!e)return;const t=e.shadowRoot;if(!t)return;const i=t.querySelector(".preview-card-container");if(!i)return;const o=i.querySelector("lcards-msd-card");if(!o)return;const s=o.shadowRoot||o.renderRoot;if(!s)return;const r=document.createElement("style");r.id="msd-studio-highlight-styles",r.textContent=`
            .line-path {
                pointer-events: none !important;
                transition: none !important;
            }
            .line-hit-area {
                pointer-events: stroke !important;
                cursor: pointer !important;
            }
            /* Hover on hit area highlights the next sibling (visible path) */
            .line-hit-area:hover + .line-selection-indicator + .line-path,
            .line-hit-area:hover + .line-path {
                filter: drop-shadow(0 0 12px #66B0FF) drop-shadow(0 0 6px #66B0FF) !important;
                transition: none !important;
            }
        `,s.appendChild(r),m.debug("[MSDStudioDialog] Injected line highlight styles (hover only)"),m.debug("[MSDStudioDialog] Injected line highlight styles")}_selectLine(e){var t,i;if(m.debug(`[MSDStudioDialog] Selecting line: ${e}`),this._selectedLineId&&((t=this._workingConfig.msd)!=null&&t.overlays)){const o=this._workingConfig.msd.overlays.find(s=>s.id===this._selectedLineId);o&&delete o._editorSelected}if(this._selectedLineId=e,this._showWaypointMarkers=true,(i=this._workingConfig.msd)!=null&&i.overlays){const o=this._workingConfig.msd.overlays.find(s=>s.id===e);o&&(o._editorSelected=true)}m.info(`[MSDStudio] Selected line: ${e} (waypoint markers enabled, static indicator added)`),this.requestUpdate()}_addNamedWaypoint(e){var s,r;if(!this._selectedLineId)return;const t=((s=this._workingConfig.msd)==null?void 0:s.overlays)||[],i=t.findIndex(a=>a.id===this._selectedLineId&&a.type==="line");if(i===-1){m.warn(`[MSDStudio] Cannot find line overlay: ${this._selectedLineId}`);return}const o=t[i];o.route!=="manual"&&(m.info(`[MSDStudio] Auto-converting line ${o.id} to manual mode`),o.route="manual",o.waypoints=[]),o.waypoints||(o.waypoints=[]),o.waypoints.push(e),((r=this._lineFormData)==null?void 0:r.id)===o.id&&(this._lineFormData.route="manual",this._lineFormData.waypoints=[...o.waypoints]),m.info(`[MSDStudio] Added named waypoint "${e}" to line ${o.id} (total: ${o.waypoints.length})`),this.requestUpdate()}_exitWaypointMode(){var e;if(m.debug("[MSDStudioDialog] Exiting waypoint mode"),this._selectedLineId&&((e=this._workingConfig.msd)!=null&&e.overlays)){const t=this._workingConfig.msd.overlays.find(i=>i.id===this._selectedLineId);t&&delete t._editorSelected}this._selectedLineId=null,this._showWaypointMarkers=false,this._activeMode=N.VIEW,this.requestUpdate()}_handleAddWaypointClick(e){if(!this._selectedLineId){m.warn("[MSDStudio] No line selected - click a line first");return}if(this._waypointDragInProgress||this._cornerRadiusDragInProgress){m.debug("[MSDStudio] Click ignored - waypoint/corner-radius drag in progress");return}this._clickTimeout&&(clearTimeout(this._clickTimeout),this._clickTimeout=null);const t=this._getPreviewCoordinates(e);if(!t){m.warn("[MSDStudio] Could not get preview coordinates");return}this._clickTimeout=setTimeout(()=>{this._addWaypointAtPosition(t.x,t.y),this._clickTimeout=null},250)}_addWaypointAtPosition(e,t){var l,c;const i=((l=this._workingConfig.msd)==null?void 0:l.overlays)||[],o=i.findIndex(d=>d.id===this._selectedLineId);if(o===-1){m.warn("[MSDStudio] Selected line not found");return}const s=i[o];s.route!=="manual"&&(m.info(`[MSDStudio] Auto-converting line ${s.id} to manual mode`),s.route="manual",s.waypoints=[]),s.waypoints||(s.waypoints=[]);const r=Math.round(e),a=Math.round(t);s.waypoints.push([r,a]),((c=this._lineFormData)==null?void 0:c.id)===s.id&&(this._lineFormData.route="manual",this._lineFormData.waypoints=[...s.waypoints]),m.info(`[MSDStudio] Added waypoint to ${s.id} at [${r}, ${a}] (total: ${s.waypoints.length})`),this._schedulePreviewUpdate(),this.requestUpdate()}_renderCrosshairGuidelines(){const e=this._showCrosshairs||this._activeMode===N.PLACE_ANCHOR||this._activeMode===N.PLACE_CONTROL;if(!this._cursorPosition||!e)return"";let{x:t,y:i,pixelX:o,pixelY:s,panelWidth:r,panelHeight:a}=this._cursorPosition;const l=this._enableSnapping||this._snapToGrid;let c=t,d=i,h=o,p=s;if(l){const M=this._gridSpacing||50;c=Math.round(t/M)*M,d=Math.round(i/M)*M}const g=l?"rgba(0, 255, 0, 0.5)":"rgba(255, 153, 0, 0.5)",_=15,f=130,y=30,w=h+_+f>r;let x=null,$=null;w?$=Math.max(4,r-h+_):x=Math.max(4,Math.min(h+_,r-4));let D=p-30;return D<0&&(D=p+20),D=Math.max(4,Math.min(D,a-y-4)),v`
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 999;
                overflow: hidden;
            ">
                <!-- Vertical guideline -->
                <div style="
                    position: absolute;
                    left: ${h}px;
                    top: 0;
                    width: 2px;
                    height: 100%;
                    background: ${g};
                    box-shadow: 0 0 4px ${g};
                "></div>

                <!-- X coordinate label on vertical line -->
                <div style="
                    position: absolute;
                    left: ${h}px;
                    top: 8px;
                    transform: translateX(-50%);
                    background: rgba(0, 0, 0, 0.75);
                    color: ${l?"#00FF00":"#FF9900"};
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-family: 'Courier New', monospace;
                    font-size: 11px;
                    font-weight: 600;
                    white-space: nowrap;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.4);
                ">
                    X: ${c}
                </div>

                <!-- Horizontal guideline -->
                <div style="
                    position: absolute;
                    top: ${p}px;
                    left: 0;
                    height: 2px;
                    width: 100%;
                    background: ${g};
                    box-shadow: 0 0 4px ${g};
                "></div>

                <!-- Y coordinate label on horizontal line -->
                <div style="
                    position: absolute;
                    left: 8px;
                    top: ${p}px;
                    transform: translateY(-50%);
                    background: rgba(0, 0, 0, 0.75);
                    color: ${l?"#00FF00":"#FF9900"};
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-family: 'Courier New', monospace;
                    font-size: 11px;
                    font-weight: 600;
                    white-space: nowrap;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.4);
                ">
                    Y: ${d}
                </div>

                <!-- Floating coordinate tooltip near cursor -->
                <div style="
                    position: absolute;
                    ${x!==null?`left: ${x}px;`:`right: ${$}px;`}
                    top: ${D}px;
                    background: rgba(0, 0, 0, 0.85);
                    color: ${l?"#00FF00":"#FF9900"};
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 11px;
                    font-weight: 600;
                    white-space: nowrap;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.5);
                    pointer-events: none;
                ">
                    ${c}, ${d}${l?" ⊞":""}
                </div>
            </div>
        `}_getPreviewSvgAndViewBox(){var p,g;const e=(p=this.shadowRoot)==null?void 0:p.querySelector("lcards-msd-live-preview");if(!e)return null;const t=e.shadowRoot;if(!t)return null;const i=t.querySelector(".preview-card-container");if(!i)return null;const o=i.querySelector("lcards-msd-card");if(!o)return null;const s=o.shadowRoot||o.renderRoot;if(!s)return null;const r=s.querySelector("svg");if(!r)return null;const a=(g=this._workingConfig.msd)==null?void 0:g.view_box;let l=0,c=0,d=1920,h=1200;if(Array.isArray(a)&&a.length===4)[l,c,d,h]=a;else{const _=r.viewBox.baseVal;_&&_.width>0&&_.height>0&&({x:l,y:c,width:d,height:h}=_)}return{msdCard:o,svg:r,viewBoxX:l,viewBoxY:c,viewBoxWidth:d,viewBoxHeight:h}}_handlePreviewReady(e=30){if(this.requestUpdate(),this._getPreviewSvgAndViewBox()){this._previewReadyRafHandle=null;return}if(e<=0){this._previewReadyRafHandle=null;return}this._previewReadyRafHandle=requestAnimationFrame(()=>this._handlePreviewReady(e-1))}_renderAnchorHighlight(){var E;if(!this._highlightedAnchor)return"";let t=(((E=this._workingConfig.msd)==null?void 0:E.anchors)||{})[this._highlightedAnchor];if(t||(t=this._getBaseSvgAnchors()[this._highlightedAnchor]),!t||!Array.isArray(t))return"";const[i,o]=t,s=this._getPreviewSvgAndViewBox();if(!s)return"";const{svg:r,viewBoxX:a,viewBoxY:l,viewBoxWidth:c,viewBoxHeight:d}=s,h=r.getBoundingClientRect(),p=this.shadowRoot.querySelector(".preview-panel");if(!p)return"";const g=p.getBoundingClientRect(),_=c/h.width,f=d/h.height,y=Math.max(_,f),w=c/y,x=d/y,$=(h.width-w)/2,D=(h.height-x)/2,M=(i-a)/y+$,P=(o-l)/y+D,k=h.left-g.left+M,L=h.top-g.top+P;return v`
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 998;
            ">
                <!-- Pulsing circle around anchor -->
                <div style="
                    position: absolute;
                    left: ${k}px;
                    top: ${L}px;
                    transform: translate(-50%, -50%);
                    width: 40px;
                    height: 40px;
                    border: 3px solid #FF9900;
                    border-radius: 50%;
                    box-shadow: 0 0 20px rgba(255, 153, 0, 0.8);
                    animation: anchor-pulse 1s ease-in-out infinite;
                "></div>

                <!-- Center dot -->
                <div style="
                    position: absolute;
                    left: ${k}px;
                    top: ${L}px;
                    transform: translate(-50%, -50%);
                    width: 8px;
                    height: 8px;
                    background: #FF9900;
                    border-radius: 50%;
                    box-shadow: 0 0 10px rgba(255, 153, 0, 0.8);
                "></div>

                <!-- Anchor name label -->
                <div style="
                    position: absolute;
                    left: ${k}px;
                    top: ${L-35}px;
                    transform: translateX(-50%);
                    background: rgba(255, 153, 0, 0.95);
                    color: black;
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    font-weight: 700;
                    white-space: nowrap;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
                ">
                    ${this._highlightedAnchor}
                </div>
            </div>

            <style>
                @keyframes anchor-pulse {
                    0%, 100% {
                        transform: translate(-50%, -50%) scale(1);
                        opacity: 1;
                    }
                    50% {
                        transform: translate(-50%, -50%) scale(1.5);
                        opacity: 0.3;
                    }
                }
            </style>
        `}_renderControlHighlight(){var T,R,q;if(!this._highlightedControl)return"";const t=(((T=this._workingConfig.msd)==null?void 0:T.overlays)||[]).find(O=>O.id===this._highlightedControl);if(!t)return"";const i=this._getPreviewSvgAndViewBox();if(!i)return"";const{msdCard:o,svg:s,viewBoxX:r,viewBoxY:a,viewBoxWidth:l,viewBoxHeight:c}=i,d=((q=(R=o._msdPipeline)==null?void 0:R.getResolvedModel())==null?void 0:q.anchors)||{},h=this._resolveEditorControlPosition(t,d);if(!h)return m.warn(`⚠️ [MSD Studio] Could not resolve position for control '${t.id}'`),"";const p=t.size||[100,100];if(!Array.isArray(p))return"";let[g,_]=h;const[f,y]=p,w=t.attachment||"center",x=this._getAttachmentOffset(w,f,y);g+=x[0],_+=x[1];const $=s.getBoundingClientRect(),D=this.shadowRoot.querySelector(".preview-panel");if(!D)return"";const M=D.getBoundingClientRect(),P=l/$.width,k=c/$.height,L=Math.max(P,k),E=l/L,B=c/L,U=($.width-E)/2,I=($.height-B)/2,F=(g-r)/L+U,b=(_-a)/L+I,C=f/L,S=y/L,A=$.left-M.left+F,z=$.top-M.top+b;return v`
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 998;
            ">
                <!-- Pulsing rectangle around control -->
                <div style="
                    position: absolute;
                    left: ${A}px;
                    top: ${z}px;
                    width: ${C}px;
                    height: ${S}px;
                    border: 3px solid #FF0099;
                    box-shadow: 0 0 20px rgba(255, 0, 153, 0.8);
                    animation: control-pulse 1s ease-in-out infinite;
                "></div>

                <!-- Control ID label -->
                <div style="
                    position: absolute;
                    left: ${A+C/2}px;
                    top: ${z-10}px;
                    transform: translate(-50%, -100%);
                    background: rgba(255, 0, 153, 0.95);
                    color: white;
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    font-weight: 700;
                    white-space: nowrap;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
                ">
                    ${t.id}
                </div>
            </div>

            <style>
                @keyframes control-pulse {
                    0%, 100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.5;
                        transform: scale(1.05);
                    }
                }
            </style>
        `}_renderLineHighlight(){var S,A,z,T;if(!this._highlightedLine)return"";const i=(((S=this._workingConfig.msd)==null?void 0:S.overlays)||[]).filter(R=>R.type==="line").find(R=>R.id===this._highlightedLine);if(!i||!i.anchor||!i.attach_to)return"";const o={...((A=this._workingConfig.msd)==null?void 0:A.anchors)||{}},s=this._getBaseSvgAnchors();Object.assign(o,s);let r=o[i.anchor];if(!r){const q=(((z=this._workingConfig.msd)==null?void 0:z.overlays)||[]).find(O=>O.id===i.anchor);q&&(r=this._resolveEditorControlPosition(q,o))}let a=o[i.attach_to];if(!a){const q=(((T=this._workingConfig.msd)==null?void 0:T.overlays)||[]).find(O=>O.id===i.attach_to);q&&(a=this._resolveEditorControlPosition(q,o))}if(!r||!a)return"";const[l,c]=r,[d,h]=a,p=this._getPreviewSvgAndViewBox();if(!p)return"";const{svg:g,viewBoxX:_,viewBoxY:f,viewBoxWidth:y,viewBoxHeight:w}=p,x=g.getBoundingClientRect(),$=this.shadowRoot.querySelector(".preview-panel");if(!$)return"";const D=$.getBoundingClientRect(),M=y/x.width,P=w/x.height,k=Math.max(M,P),L=y/k,E=w/k,B=(x.width-L)/2,U=(x.height-E)/2,I=(l-_)/k+B+(x.left-D.left),F=(c-f)/k+U+(x.top-D.top),b=(d-_)/k+B+(x.left-D.left),C=(h-f)/k+U+(x.top-D.top);return v`
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 998;
            ">
                <svg style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                ">
                    <!-- Pulsing line path -->
                    <line
                        x1="${I}"
                        y1="${F}"
                        x2="${b}"
                        y2="${C}"
                        stroke="#00FFFF"
                        stroke-width="4"
                        opacity="0.9"
                        style="
                            filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.8));
                            animation: line-pulse 1s ease-in-out infinite;
                        "
                    />

                    <!-- Start point marker -->
                    <circle
                        cx="${I}"
                        cy="${F}"
                        r="6"
                        fill="#00FFFF"
                        stroke="white"
                        stroke-width="2"
                    />

                    <!-- End point marker -->
                    <circle
                        cx="${b}"
                        cy="${C}"
                        r="6"
                        fill="#00FFFF"
                        stroke="white"
                        stroke-width="2"
                    />
                </svg>

                <!-- Line ID label at midpoint -->
                <div style="
                    position: absolute;
                    left: ${(I+b)/2}px;
                    top: ${(F+C)/2-10}px;
                    transform: translate(-50%, -100%);
                    background: rgba(0, 255, 255, 0.95);
                    color: black;
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    font-weight: 700;
                    white-space: nowrap;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
                ">
                    ${i.id}
                </div>
            </div>

            <style>
                @keyframes line-pulse {
                    0%, 100% {
                        opacity: 0.9;
                    }
                    50% {
                        opacity: 0.4;
                    }
                }
            </style>
        `}_renderGridOverlay(){if(!this._showGrid)return"";m.trace("[MSDStudio] _renderGridOverlay called, _showGrid:",this._showGrid);const e=this._getPreviewSvgAndViewBox();if(!e)return m.trace("[MSDStudio] Could not find preview SVG for grid overlay"),"";const{svg:t,viewBoxX:i,viewBoxY:o,viewBoxWidth:s,viewBoxHeight:r}=e,a=this._debugSettings.grid_color||"#cccccc",l=this._gridSpacing||50,c=[],d=i+s;for(let b=Math.ceil(i/l)*l;b<=d;b+=l)c.push(b);const h=[],p=o+r;for(let b=Math.ceil(o/l)*l;b<=p;b+=l)h.push(b);m.trace("[MSDStudio] Found SVG, calculating grid..."),m.trace("[MSDStudio] Grid lines:",{verticalLines:c.length,horizontalLines:h.length}),m.trace("[MSDStudio] ViewBox:",{viewBoxX:i,viewBoxY:o,viewBoxWidth:s,viewBoxHeight:r});const g=t.getBoundingClientRect(),_=this.shadowRoot.querySelector(".preview-panel");if(!_)return"";const f=_.getBoundingClientRect(),y=s/g.width,w=r/g.height,x=Math.max(y,w),$=s/x,D=r/x,M=(g.width-$)/2,P=(g.height-D)/2,k=g.left-f.left+M,L=g.top-f.top+P,E=$,B=D,U=this._debugSettings.grid_opacity??.3,I=Math.min(U+.2,1),F=`
            background: rgba(0, 0, 0, 0.7);
            color: ${a};
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 10px;
            white-space: nowrap;
            opacity: ${I};
            pointer-events: none;
        `;return v`
            <div style="
                position: absolute;
                left: ${k}px;
                top: ${L}px;
                width: ${E}px;
                height: ${B}px;
                pointer-events: none;
                z-index: 996;
            ">
                <!-- Base SVG Boundary -->
                <div style="
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    border: 2px dashed ${a};
                    opacity: ${I};
                "></div>

                <!-- View box dimension labels -->
                <div style="position: absolute; left: 4px; top: 4px; ${F}">
                    (${Math.round(i)}, ${Math.round(o)})
                </div>
                <div style="position: absolute; right: 4px; bottom: 4px; ${F}">
                    (${Math.round(i+s)}, ${Math.round(o+r)})
                </div>
                <div style="position: absolute; left: 50%; top: -18px; transform: translateX(-50%); ${F}">
                    ${Math.round(s)} × ${Math.round(r)}
                </div>

                <!-- Grid Lines -->
                ${c.map(b=>{const C=(b-i)/x;return v`
                        <div style="
                            position: absolute;
                            left: ${C}px;
                            top: 0;
                            width: 1px;
                            height: 100%;
                            background: ${a};
                            opacity: ${U};
                        "></div>
                    `})}
                ${h.map(b=>{const C=(b-o)/x;return v`
                        <div style="
                            position: absolute;
                            left: 0;
                            top: ${C}px;
                            width: 100%;
                            height: 1px;
                            background: ${a};
                            opacity: ${U};
                        "></div>
                    `})}
            </div>
        `}_renderRoutingGridOverlay(){var U,I;if(!this._showRoutingGrid)return"";const e=this._getPreviewSvgAndViewBox();if(!e)return"";const{svg:t,viewBoxX:i,viewBoxY:o,viewBoxWidth:s,viewBoxHeight:r,msdCard:a}=e,l=(I=(U=a._msdPipeline)==null?void 0:U.coordinator)==null?void 0:I.router;if(!l||typeof l.resolvedGridResolution!="function")return"";const c=l.resolvedGridResolution();if(!(c>0))return"";const d="#ffaa00",h=[],p=i+s;for(let F=Math.ceil(i/c)*c;F<=p;F+=c)h.push(F);const g=[],_=o+r;for(let F=Math.ceil(o/c)*c;F<=_;F+=c)g.push(F);const f=t.getBoundingClientRect(),y=this.shadowRoot.querySelector(".preview-panel");if(!y)return"";const w=y.getBoundingClientRect(),x=s/f.width,$=r/f.height,D=Math.max(x,$),M=s/D,P=r/D,k=(f.width-M)/2,L=(f.height-P)/2,E=f.left-w.left+k,B=f.top-w.top+L;return v`
            <div style="
                position: absolute;
                left: ${E}px;
                top: ${B}px;
                width: ${M}px;
                height: ${P}px;
                pointer-events: none;
                z-index: 995;
            ">
                <div style="
                    position: absolute;
                    left: 4px;
                    top: 4px;
                    background: rgba(0, 0, 0, 0.7);
                    color: ${d};
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-family: 'Courier New', monospace;
                    font-size: 10px;
                    white-space: nowrap;
                    opacity: 0.9;
                ">routing grid: ${c%1===0?c:c.toFixed(2)}vb</div>
                ${h.map(F=>v`
                    <div style="
                        position: absolute;
                        left: ${(F-i)/D}px;
                        top: 0;
                        width: 1px;
                        height: 100%;
                        background: ${d};
                        opacity: 0.25;
                    "></div>
                `)}
                ${g.map(F=>v`
                    <div style="
                        position: absolute;
                        left: 0;
                        top: ${(F-o)/D}px;
                        width: 100%;
                        height: 1px;
                        background: ${d};
                        opacity: 0.25;
                    "></div>
                `)}
            </div>
        `}_renderTrunksOverlay(){var k,L;if(!this._showTrunks)return"";const e=this._getPreviewSvgAndViewBox();if(!e)return"";const{svg:t,viewBoxX:i,viewBoxY:o,viewBoxWidth:s,viewBoxHeight:r,msdCard:a}=e,l=(L=(k=a._msdPipeline)==null?void 0:k.coordinator)==null?void 0:L.router;if(!l||typeof l.trunks!="function")return"";const c=l.trunks().filter(E=>E.origin==="discovered"&&E.members.length>0);if(!c.length)return"";const d=t.getBoundingClientRect(),h=this.shadowRoot.querySelector(".preview-panel");if(!h)return"";const p=h.getBoundingClientRect(),g=s/d.width,_=r/d.height,f=Math.max(g,_),y=s/f,w=r/f,x=(d.width-y)/2,$=(d.height-w)/2,D=d.left-p.left+x,M=d.top-p.top+$,P="#00e5ff";return v`
            <div style="
                position: absolute;
                left: ${D}px;
                top: ${M}px;
                width: ${y}px;
                height: ${w}px;
                pointer-events: none;
                z-index: 997;
            ">
                ${c.map(E=>{const B=(E.bounds.x1-i)/f,U=(E.bounds.y1-o)/f,I=(E.bounds.x2-E.bounds.x1)/f,F=(E.bounds.y2-E.bounds.y1)/f,b=E.direction==="horizontal",C=b?(E.crossCenter-o)/f-U:(E.crossCenter-i)/f-B;return v`
                        <div style="
                            position: absolute;
                            left: ${B}px;
                            top: ${U}px;
                            width: ${I}px;
                            height: ${F}px;
                            background: ${P};
                            opacity: 0.12;
                            border: 1px dashed ${P};
                            box-sizing: border-box;
                        "></div>
                        <div style="
                            position: absolute;
                            left: ${b?B:B+C}px;
                            top: ${b?U+C:U}px;
                            width: ${b?I:1}px;
                            height: ${b?1:F}px;
                            background: ${P};
                            opacity: 0.6;
                        "></div>
                        <div style="
                            position: absolute;
                            left: ${B+3}px;
                            top: ${U+2}px;
                            background: rgba(0, 0, 0, 0.7);
                            color: ${P};
                            padding: 1px 5px;
                            border-radius: 3px;
                            font-family: 'Courier New', monospace;
                            font-size: 9px;
                            white-space: nowrap;
                        ">${E.id} · ${E.members.length} line${E.members.length===1?"":"s"}</div>
                    `})}
            </div>
        `}_renderAnchorMarkers(){var D;if(!this._showAnchorMarkers)return"";const e=((D=this._workingConfig.msd)==null?void 0:D.anchors)||{},t=this._getBaseSvgAnchors(),i={...e,...t};if(Object.keys(i).length===0)return"";const o=this._getPreviewSvgAndViewBox();if(!o)return"";const{svg:s,viewBoxX:r,viewBoxY:a,viewBoxWidth:l,viewBoxHeight:c}=o,d=s.getBoundingClientRect(),h=this.shadowRoot.querySelector(".preview-panel");if(!h)return"";const p=h.getBoundingClientRect(),g=l/d.width,_=c/d.height,f=Math.max(g,_),y=l/f,w=c/f,x=(d.width-y)/2,$=(d.height-w)/2;return v`
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 997;
            ">
                ${Object.entries(i).map(([M,P],k)=>{if(!Array.isArray(P))return"";const[L,E]=P,B=(L-r)/f+x,U=(E-a)/f+$,I=d.left-p.left+B,F=d.top-p.top+U;k===0&&m.debug("[MSDStudio][ANCHOR] First anchor position:",{name:M,viewBox:{x:L,y:E},svgPixel:{x:B,y:U},finalPixel:{x:I,y:F},calculation:`(${L} - ${r}) / ${f} + ${x} = ${B}`});const b=!e[M],C=b?"#888888":"#FFFF00",S=this._anchorDragState.active&&this._anchorDragState.anchorName===M,A=this._activeMode===N.ADD_WAYPOINT;return v`
                        <!-- Anchor marker -->
                        <div
                            class="${b?"":"interactive-anchor"} ${S?"anchor-dragging":""} anchor-marker"
                            data-anchor-name="${M}"
                            data-is-base-svg="${b}"
                            style="
                                position: absolute;
                                left: ${I}px;
                                top: ${F}px;
                                transform: translate(-50%, -50%);
                                width: ${A?"16px":"12px"};
                                height: ${A?"16px":"12px"};
                                background: ${C};
                                border: 2px solid ${A?"#00FFFF":"white"};
                                border-radius: 50%;
                                box-shadow: 0 0 ${A?"8px":"4px"} rgba(0, 0, 0, 0.5);
                                pointer-events: ${!b||A?"auto":"none"};
                                cursor: ${A?"pointer":"default"};
                                transition: all 0.2s ease;
                                z-index: ${A?"1001":"997"};
                            "
                            @mousedown=${!b&&this._activeMode!==N.ADD_WAYPOINT?z=>this._handleAnchorDragStart(z,M):null}
                            @dblclick=${!b&&this._activeMode!==N.ADD_WAYPOINT?z=>this._handleAnchorDoubleClick(z,M):null}>
                        </div>
                        <!-- Anchor label -->
                        <div style="
                            position: absolute;
                            left: ${I}px;
                            top: ${F+8}px;
                            transform: translateX(-50%);
                            background: rgba(0, 0, 0, 0.7);
                            color: ${C};
                            padding: 2px 6px;
                            border-radius: 3px;
                            font-family: 'Courier New', monospace;
                            font-size: 10px;
                            white-space: nowrap;
                        ">
                            ${M}
                        </div>
                    `})}
            </div>
        `}_renderLockBadge(e){return v`
            <div
                style="
                    position: absolute;
                    top: 2px;
                    right: 2px;
                    pointer-events: auto;
                    cursor: pointer;
                    background: rgba(0, 0, 0, 0.6);
                    border-radius: 3px;
                    padding: 2px;
                    display: flex;
                "
                title="Unlock this overlay"
                @mousedown=${t=>t.stopPropagation()}
                @click=${t=>{t.stopPropagation(),this._toggleOverlayLocked(e)}}>
                <ha-icon icon="mdi:lock" style="--mdc-icon-size: 14px; color: #cccccc;"></ha-icon>
            </div>
        `}_renderControlBboxItem(e,t){const{rect:i,panelRect:o,scale:s,offsetX:r,offsetY:a,viewBoxX:l,viewBoxY:c,anchors:d}=t;if(!e.position&&!e.anchor)return m.warn("[MSDStudio] Control has no valid position:",e.id),"";const h=this._resolveEditorControlPosition(e,d);if(!h)return m.warn("[MSDStudio] Failed to resolve position:",e.position||e.anchor,e.id),"";const p=e.size||[100,100];if(!Array.isArray(p))return"";let[g,_]=h;const[f,y]=p,w=e.attachment||"center",x=this._getAttachmentOffset(w,f,y);g+=x[0],_+=x[1];const $=(g-l)/s+r,D=(_-c)/s+a,M=f/s,P=y/s,k=i.left-o.left+$,L=i.top-o.top+D,E=this._dragState.active&&this._dragState.controlId===e.id,B=this._resizeState.active&&this._resizeState.controlId===e.id,U=e.locked===true;return v`
            <!-- Bounding box (interactive) -->
            <div
                class="interactive-bbox ${E?"bbox-dragging":""} ${B?"bbox-resizing":""} ${U?"bbox-locked":""}"
                data-control-id="${e.id}"
                style="
                    position: absolute;
                    left: ${k}px;
                    top: ${L}px;
                    width: ${M}px;
                    height: ${P}px;
                    border: ${U?"2px dashed #888888":"2px solid #0088FF"};
                    opacity: 0.6;
                    pointer-events: ${U?"none":"auto"};
                "
                @mousedown=${I=>this._handleDragStart(I,e.id)}
                @dblclick=${I=>this._handleControlDoubleClick(I,e.id)}>

                <!-- Resize Handles — omitted entirely when locked: .resize-handle sets
                     pointer-events:auto on itself, which an ancestor's pointer-events:none
                     does NOT override, so simply not rendering them is required, not just
                     cosmetic. -->
                ${U?"":this._renderResizeHandles(e.id,M,P,B)}

                <!-- Live W×H / attach-point readout while actively dragging or resizing -->
                ${this._renderLiveCoordBadge(E,B,e.position,e.size)}

                ${U?this._renderLockBadge(e):""}
            </div>
            <!-- Control ID label -->
            <div style="
                position: absolute;
                left: ${k+4}px;
                top: ${L+4}px;
                background: rgba(0, 136, 255, 0.8);
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
                font-family: 'Courier New', monospace;
                font-size: 10px;
                white-space: nowrap;
                pointer-events: none;
            ">
                ${e.id}
            </div>
        `}_renderShapeBboxItem(e,t){const{rect:i,panelRect:o,scale:s,offsetX:r,offsetY:a,viewBoxX:l,viewBoxY:c}=t,[d,h]=e.position,[p,g]=e.size||[100,60],_=(d-l)/s+r,f=(h-c)/s+a,y=p/s,w=g/s,x=i.left-o.left+_,$=i.top-o.top+f,D=this._shapeDragState.active&&this._shapeDragState.shapeId===e.id,M=this._shapeResizeState.active&&this._shapeResizeState.shapeId===e.id,P=e.locked===true,k=e.kind==="circle"?"50%":"0";return v`
            <div
                class="interactive-bbox ${D?"bbox-dragging":""} ${M?"bbox-resizing":""} ${P?"bbox-locked":""}"
                data-shape-id="${e.id}"
                style="
                    position: absolute;
                    left: ${x}px;
                    top: ${$}px;
                    width: ${y}px;
                    height: ${w}px;
                    border: ${P?"2px dashed #888888":"2px solid #00CC88"};
                    border-radius: ${k};
                    opacity: 0.6;
                    pointer-events: ${P?"none":"auto"};
                "
                @mousedown=${L=>this._handleShapeDragStart(L,e.id)}
                @dblclick=${L=>{L.stopPropagation(),this._editShape(e)}}>
                ${P?"":this._renderShapeResizeHandles(e.id,y,w,M)}
                ${this._renderLiveCoordBadge(D,M,e.position,e.size)}
                ${P?this._renderLockBadge(e):""}
            </div>
            <div style="
                position: absolute;
                left: ${x+4}px;
                top: ${$+4}px;
                background: rgba(0, 204, 136, 0.8);
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
                font-family: 'Courier New', monospace;
                font-size: 10px;
                white-space: nowrap;
                pointer-events: none;
            ">
                ${e.id}
            </div>
        `}_renderInteractiveHitLayer(){var B,U,I;if(!this._showBoundingBoxes)return"";const e=((B=this._workingConfig.msd)==null?void 0:B.overlays)||[],t=e.filter(F=>F.type==="control"),i=e.filter(F=>F.type==="shape"&&(F.kind==="rect"||F.kind==="circle")&&Array.isArray(F.position));if(t.length===0&&i.length===0)return"";const o=this._getPreviewSvgAndViewBox();if(!o)return"";const{msdCard:s,svg:r,viewBoxX:a,viewBoxY:l,viewBoxWidth:c,viewBoxHeight:d}=o,h=r.getBoundingClientRect(),p=this.shadowRoot.querySelector(".preview-panel");if(!p)return"";const g=p.getBoundingClientRect(),_=c/h.width,f=d/h.height,y=Math.max(_,f),w=c/y,x=d/y,$=(h.width-w)/2,D=(h.height-x)/2,M=(I=(U=s._msdPipeline)==null?void 0:U.getResolvedModel)==null?void 0:I.call(U),P=(M==null?void 0:M.anchors)||{},k={rect:h,panelRect:g,scale:y,offsetX:$,offsetY:D,viewBoxX:a,viewBoxY:l,anchors:P},L=Zt.buildDeclOrderMap(e),E=[...t.map(F=>({kind:"control",overlay:F})),...i.map(F=>({kind:"shape",overlay:F}))].sort((F,b)=>Zt.compareByZIndex(F.overlay,b.overlay,L));return v`
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
            ">
                ${E.map(({kind:F,overlay:b})=>F==="control"?this._renderControlBboxItem(b,k):this._renderShapeBboxItem(b,k))}
            </div>
        `}_renderShapeSegmentInsertMarkers(){var r;if(!this._selectedShapeId)return"";const t=(((r=this._workingConfig.msd)==null?void 0:r.overlays)||[]).find(a=>a.id===this._selectedShapeId&&a.type==="shape"&&a.kind==="polyline");if(!t||!Array.isArray(t.points)||t.points.length<2||t.locked||t.points.length>Me)return"";const i=this._getViewBoxToPixelConverter();if(!i)return"";const o=t.points,s=[];for(let a=0;a<o.length-1;a++)s.push({a:o[a],b:o[a+1],insertIndex:a+1});return t.closed&&s.push({a:o[o.length-1],b:o[0],insertIndex:o.length}),v`
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1000;">
                ${s.map(({a,b:l,insertIndex:c})=>{if(!Array.isArray(a)||a.length<2||!Array.isArray(l)||l.length<2)return"";const d=(a[0]+l[0])/2,h=(a[1]+l[1])/2,[p,g]=i(d,h);return v`
                        <div
                            class="shape-segment-insert-marker"
                            style="
                                position: absolute;
                                left: ${p}px;
                                top: ${g}px;
                                transform: translate(-50%, -50%) rotate(45deg);
                                width: 12px;
                                height: 12px;
                                background: rgba(0, 204, 136, 0.55);
                                border: 1px dashed #FFF;
                                cursor: pointer;
                                pointer-events: auto;
                                box-shadow: 0 1px 4px rgba(0,0,0,0.3);
                                z-index: 1000;
                            "
                            @click=${_=>this._handleShapeSegmentInsertClick(_,t.id,c,d,h)}
                            title="Click to insert a point here">
                        </div>
                    `})}
            </div>
        `}_renderShapeVertexMarkers(){var P,k,L;if(!this._selectedShapeId)return"";const t=(((P=this._workingConfig.msd)==null?void 0:P.overlays)||[]).find(E=>E.id===this._selectedShapeId&&E.type==="shape"&&E.kind==="polyline");if(!t||!Array.isArray(t.points)||t.points.length===0||t.locked||t.points.length>Me)return"";const i=this.shadowRoot.querySelector("lcards-msd-live-preview");if(!i)return"";const o=i.shadowRoot;if(!o)return"";const s=o.querySelector(".preview-card-container");if(!s)return"";const r=s.querySelector("lcards-msd-card");if(!r)return"";const a=r.shadowRoot||r.renderRoot;if(!a)return"";const l=a.querySelector("svg");if(!l)return"";const c=(k=l.getAttribute("viewBox"))==null?void 0:k.split(" ").map(Number);if(!c||c.length!==4)return"";const[d,h,p,g]=c,_=l.getBoundingClientRect(),f=(L=this.shadowRoot.querySelector(".preview-panel"))==null?void 0:L.getBoundingClientRect();if(!f)return"";const y=Math.max(p/_.width,g/_.height),w=p/y,x=g/y,$=(_.width-w)/2,D=(_.height-x)/2,M=u((E,B)=>{const U=(E-d)/y+$,I=(B-h)/y+D;return[U+(_.left-f.left),I+(_.top-f.top)]},"vbToPixel");return v`
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1000;">
                ${t.points.map((E,B)=>{var b,C;if(!Array.isArray(E)||E.length<2)return"";const[U,I]=M(E[0],E[1]),F=((b=this._shapeVertexDragState)==null?void 0:b.shapeId)===t.id&&((C=this._shapeVertexDragState)==null?void 0:C.vertexIndex)===B;return v`
                        <div
                            class="waypoint-marker editing ${F?"dragging":""}"
                            style="
                                position: absolute;
                                left: ${U}px;
                                top: ${I}px;
                                transform: translate(-50%, -50%);
                                width: 24px;
                                height: 24px;
                                border-radius: 50%;
                                background: ${F?"#FFAA00":"#00CC88"};
                                border: 2px solid #FFF;
                                cursor: move;
                                pointer-events: auto;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                                z-index: ${F?"1002":"1001"};
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-family: 'Antonio', sans-serif;
                                font-size: 12px;
                                font-weight: 700;
                                color: #000;
                            "
                            @mousedown=${S=>this._handleShapeVertexMouseDown(S,t.id,B)}
                            @dblclick=${S=>this._handleShapeVertexDoubleClick(S,t.id,B)}
                            title="Point ${B+1} (Drag to move, Double-click to delete)">
                            ${B+1}
                        </div>
                    `})}
            </div>
        `}_renderRoutingPaths(){var M,P;if(!this._showRoutingPaths)return"";m.trace("[MSDStudio] _renderRoutingPaths called, _showRoutingPaths:",this._showRoutingPaths);const t=(((M=this._workingConfig.msd)==null?void 0:M.overlays)||[]).filter(k=>k.type==="line");if(t.length===0)return m.trace("[MSDStudio] No line overlays found"),"";m.trace("[MSDStudio] Found",t.length,"line overlays");const i=((P=this._workingConfig.msd)==null?void 0:P.anchors)||{},o=this._getBaseSvgAnchors();({...i,...o});const s=this._getPreviewSvgAndViewBox();if(!s)return"";const{svg:r,viewBoxX:a,viewBoxY:l,viewBoxWidth:c,viewBoxHeight:d}=s,h=r.getBoundingClientRect(),p=this.shadowRoot.querySelector(".preview-panel");if(!p)return"";const g=p.getBoundingClientRect(),_=c/h.width,f=d/h.height,y=Math.max(_,f),w=c/y,x=d/y,$=(h.width-w)/2,D=(h.height-x)/2;return v`
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 997;
            ">
                ${t.map(k=>{var W;const L=this._resolvePositionWithSide(k.anchor,k.anchor_side);if(!L)return"";let E=k.attach_to;Array.isArray(E)&&(E=E[E.length-1]);const B=this._resolvePositionWithSide(E,k.attach_side);if(!B||!L||!B)return"";const[U,I]=L,[F,b]=B,C=(U-a)/y+$,S=(I-l)/y+D,A=(F-a)/y+$,z=(b-l)/y+D,T=h.left-g.left+C,R=h.top-g.top+S,q=h.left-g.left+A,O=h.top-g.top+z,V=(W=k.style)==null?void 0:W.color,H=typeof V=="object"&&V!==null?V.default||V.active||Object.values(V)[0]||"#00FFAA":V||"#00FFAA",Y=Math.sqrt(Math.pow(q-T,2)+Math.pow(O-R,2)),X=Math.atan2(O-R,q-T)*180/Math.PI;return v`
                        <!-- Line -->
                        <div style="
                            position: absolute;
                            left: ${T}px;
                            top: ${R}px;
                            width: ${Y}px;
                            height: 2px;
                            background: ${H};
                            opacity: 0.7;
                            transform-origin: 0 0;
                            transform: rotate(${X}deg);
                        "></div>
                        <!-- Start marker -->
                        <div style="
                            position: absolute;
                            left: ${T}px;
                            top: ${R}px;
                            width: 8px;
                            height: 8px;
                            background: ${H};
                            border-radius: 50%;
                            transform: translate(-50%, -50%);
                        "></div>
                        <!-- End marker -->
                        <div style="
                            position: absolute;
                            left: ${q}px;
                            top: ${O}px;
                            width: 8px;
                            height: 8px;
                            background: ${H};
                            border-radius: 50%;
                            transform: translate(-50%, -50%);
                        "></div>
                    `})}
            </div>
        `}_renderLineEndpointMarkers(){var E,B,U,I;if(!this._showRoutingPaths)return"";const t=(((E=this._workingConfig.msd)==null?void 0:E.overlays)||[]).filter(F=>F.type==="line");if(t.length===0)return"";const i=((B=this._workingConfig.msd)==null?void 0:B.anchors)||{},o=this._getBaseSvgAnchors();({...i,...o});const s=this.shadowRoot.querySelector("lcards-msd-live-preview");if(!s)return"";const r=s.shadowRoot;if(!r)return"";const a=r.querySelector(".preview-card-container");if(!a)return"";const l=a.querySelector("lcards-msd-card");if(!l)return"";const c=l.shadowRoot||l.renderRoot;if(!c)return"";const d=c.querySelector("svg");if(!d)return"";const h=(U=d.getAttribute("viewBox"))==null?void 0:U.split(" ").map(Number);if(!h||h.length!==4)return"";const[p,g,_,f]=h,y=d.getBoundingClientRect(),w=(I=this.shadowRoot.querySelector(".preview-panel"))==null?void 0:I.getBoundingClientRect();if(!w)return"";const x=Math.max(_/y.width,f/y.height),$=_/x,D=f/x,M=(y.width-$)/2,P=(y.height-D)/2,k=new Map;t.forEach(F=>{const b=this._resolvePositionWithSide(F.anchor,F.anchor_side);if(b){const A=`${b[0]},${b[1]}`;k.has(A)||k.set(A,[]),k.get(A).push({line:F,endpoint:"start",pos:b})}let C=F.attach_to;Array.isArray(C)&&(C=C[C.length-1]);const S=this._resolvePositionWithSide(C,F.attach_side);if(S){const A=`${S[0]},${S[1]}`;k.has(A)||k.set(A,[]),k.get(A).push({line:F,endpoint:"end",pos:S})}});const L=new Map;return k.forEach((F,b)=>{F.length>1&&F.forEach((S,A)=>{const z=A/F.length*2*Math.PI,T=Math.cos(z)*16,R=Math.sin(z)*16;L.set(`${S.line.id}:${S.endpoint}`,{dx:T,dy:R})})}),v`
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 999;
            ">
                ${t.map(F=>{const b=this._resolvePositionWithSide(F.anchor,F.anchor_side);if(!b)return"";let C=F.attach_to;Array.isArray(C)&&(C=C[C.length-1]);const S=this._resolvePositionWithSide(C,F.attach_side);if(!S)return"";const[A,z]=b,[T,R]=S,q=(A-p)/x+M,O=(z-g)/x+P,V=(T-p)/x+M,H=(R-g)/x+P,Y=y.left-w.left+q,X=y.top-w.top+O,W=y.left-w.left+V,j=y.top-w.top+H,Z=this._lineEndpointDragState.active&&this._lineEndpointDragState.lineId===F.id,Q=Z?this._lineEndpointDragState.endpoint:null,he=L.get(`${F.id}:start`)||{dx:0,dy:0},ae=L.get(`${F.id}:end`)||{dx:0,dy:0};let Ce=0,ke=0;if(Z&&this._lineEndpointDragState.currentPos){const[G,lt]=this._lineEndpointDragState.currentPos;let pe=(G-p)/x+M,ge=(lt-g)/x+P;pe=pe*zoomK+zoomX,ge=ge*zoomK+zoomY,Ce=y.left-w.left+pe,ke=y.top-w.top+ge}return this._activeMode===N.ADD_WAYPOINT&&this._selectedLineId===F.id?"":v`
                        <div class="line-endpoint-marker start"
                             data-line-id="${F.id}"
                             data-endpoint="start"
                             style="position: absolute;
                                    left: ${(Q==="start"&&Z?Ce:Y)+he.dx}px;
                                    top: ${(Q==="start"&&Z?ke:X)+he.dy}px;
                                    width: 12px;
                                    height: 12px;
                                    background: var(--lcars-blue, #9999ff);
                                    border: 2px solid var(--lcars-gold, #ff9900);
                                    border-radius: 50%;
                                    transform: translate(-50%, -50%);
                                    pointer-events: auto;
                                    cursor: move;
                                    z-index: 1000;
                                    transition: all 0.2s;"
                             @mousedown=${G=>this._handleLineEndpointDragStart(G,F.id,"start")}
                             @mouseenter=${G=>{G.target.style.transform="translate(-50%, -50%) scale(1.8)",G.target.style.zIndex="1100",G.target.style.boxShadow="0 0 12px rgba(153, 153, 255, 0.9), 0 0 20px rgba(153, 153, 255, 0.5)"}}
                             @mouseleave=${G=>{G.target.style.transform="translate(-50%, -50%) scale(1)",G.target.style.zIndex="1000",G.target.style.boxShadow="none"}}>
                        </div>
                        <div class="line-endpoint-marker end"
                             data-line-id="${F.id}"
                             data-endpoint="end"
                             style="position: absolute;
                                    left: ${(Q==="end"&&Z?Ce:W)+ae.dx}px;
                                    top: ${(Q==="end"&&Z?ke:j)+ae.dy}px;
                                    width: 12px;
                                    height: 12px;
                                    background: var(--lcars-red, #ff6666);
                                    border: 2px solid var(--lcars-gold, #ff9900);
                                    border-radius: 50%;
                                    transform: translate(-50%, -50%);
                                    pointer-events: auto;
                                    cursor: move;
                                    z-index: 1000;
                                    transition: all 0.2s;"
                             @mousedown=${G=>this._handleLineEndpointDragStart(G,F.id,"end")}
                             @mouseenter=${G=>{G.target.style.transform="translate(-50%, -50%) scale(1.8)",G.target.style.zIndex="1100",G.target.style.boxShadow="0 0 12px rgba(255, 102, 102, 0.9), 0 0 20px rgba(255, 102, 102, 0.5)"}}
                             @mouseleave=${G=>{G.target.style.transform="translate(-50%, -50%) scale(1)",G.target.style.zIndex="1000",G.target.style.boxShadow="none"}}>
                        </div>
                    `})}
            </div>
        `}_renderDragAttachPoints(){return""}_renderChannelsOverlay(){var x;if(!this._showRoutingChannels)return"";m.trace("[MSDStudio] _renderChannelsOverlay called, _showRoutingChannels:",this._showRoutingChannels);const e=((x=this._workingConfig.msd)==null?void 0:x.channels)||{};if(Object.keys(e).length===0)return m.trace("[MSDStudio] No channels found"),"";m.trace("[MSDStudio] Found",Object.keys(e).length,"channels");const t=this._getPreviewSvgAndViewBox();if(!t)return"";const{svg:i,viewBoxX:o,viewBoxY:s,viewBoxWidth:r,viewBoxHeight:a}=t,l=i.getBoundingClientRect(),c=this.shadowRoot.querySelector(".preview-panel");if(!c)return"";const d=c.getBoundingClientRect(),h=r/l.width,p=a/l.height,g=Math.max(h,p),_=r/g,f=a/g,y=(l.width-_)/2,w=(l.height-f)/2;return v`
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 997;
            ">
                ${Object.entries(e).map(([$,D])=>{if(!D.bounds||!Array.isArray(D.bounds)||D.bounds.length!==4)return"";const[M,P,k,L]=D.bounds,E=(M-o)/g+y,B=(P-s)/g+w,U=k/g,I=L/g,F=l.left-d.left+E,b=l.top-d.top+B,C=D.color||"#00FFAA",S=this._channelResizeState.active&&this._channelResizeState.channelId===$,A=this._channelDragState.active&&this._channelDragState.channelId===$;let z=(D.direction||"auto").toLowerCase();z==="auto"&&(z=k>=L?"horizontal":"vertical");const T=Math.min(U,I)*.3,R=U/2,q=I/2,O=z==="horizontal"?`M ${R-T} ${q} L ${R+T} ${q} M ${R+T-6} ${q-4} L ${R+T} ${q} L ${R+T-6} ${q+4}`:`M ${R} ${q-T} L ${R} ${q+T} M ${R-4} ${q+T-6} L ${R} ${q+T} L ${R+4} ${q+T-6}`;return v`
                        <!-- Channel rectangle (interactive) -->
                        <div
                            class="interactive-channel ${S?"channel-resizing":""} ${A?"channel-dragging":""}"
                            data-channel-id="${$}"
                            style="
                                position: absolute;
                                left: ${F}px;
                                top: ${b}px;
                                width: ${U}px;
                                height: ${I}px;
                                border: 2px dashed ${C};
                                background: ${C}22;
                                opacity: 0.6;
                                pointer-events: auto;
                                cursor: grab;
                            "
                            @mousedown=${V=>this._handleChannelDragStart(V,$)}
                            @dblclick=${V=>this._handleChannelDoubleClick(V,$)}>

                            <!-- Resize Handles (only render when not dragging) -->
                            ${this._renderChannelResizeHandles($,U,I,S)}
                            ${this._renderLiveCoordBadge(A,S,[M,P],[k,L])}
                        </div>
                        <!-- Channel ID label -->
                        <div style="
                            position: absolute;
                            left: ${F+4}px;
                            top: ${b+4}px;
                            background: ${C};
                            color: black;
                            padding: 2px 6px;
                            border-radius: 3px;
                            font-family: 'Courier New', monospace;
                            font-size: 10px;
                            font-weight: 700;
                            white-space: nowrap;
                            pointer-events: none;
                        ">
                            ${$}
                        </div>
                        <!-- Direction arrow indicator -->
                        <svg style="
                            position: absolute;
                            left: ${F}px;
                            top: ${b}px;
                            width: ${U}px;
                            height: ${I}px;
                            pointer-events: none;
                            overflow: visible;
                        ">
                            <path
                                d="${O}"
                                stroke="${C}"
                                stroke-width="2"
                                fill="none"
                                opacity="0.8"
                            />
                        </svg>
                        ${this._renderChannelCenterlineOverlay($,D,z,C,F,b,U,I)}
                    `})}
            </div>
        `}_renderChannelCenterlineOverlay(e,t,i,o,s,r,a,l){const[c,d,h,p]=t.bounds,g=i==="horizontal"?d+p/2:c+h/2,_=i==="horizontal",f=_?0:a/2,y=_?l/2:0,w=_?a:a/2,x=_?l/2:l;return v`
            <svg style="
                position: absolute;
                left: ${s}px;
                top: ${r}px;
                width: ${a}px;
                height: ${l}px;
                pointer-events: none;
                overflow: visible;
            ">
                <line
                    x1="${f}" y1="${y}" x2="${w}" y2="${x}"
                    stroke="${o}"
                    stroke-width="1.5"
                    stroke-dasharray="6,3"
                    opacity="0.95"
                />
                <text
                    x="${_?4:a/2+4}"
                    y="${_?l/2-4:12}"
                    fill="${o}"
                    font-family="'Courier New', monospace"
                    font-size="9"
                    font-weight="700"
                >crossCenter: ${g.toFixed(1)}</text>
            </svg>
        `}_renderWaypointInsertMarkers(){var g,_;if(!this._showWaypointMarkers||!this._selectedLineId)return"";const t=(((g=this._workingConfig.msd)==null?void 0:g.overlays)||[]).find(f=>f.id===this._selectedLineId&&f.type==="line");if(!t)return"";const i=this._resolvePositionWithSide(t.anchor,t.anchor_side);if(!i)return"";let o=t.attach_to;Array.isArray(o)&&(o=o[o.length-1]);const s=this._resolvePositionWithSide(o,t.attach_side);if(!s)return"";const r=this._getViewBoxToPixelConverter();if(!r)return"";const a=((_=this._workingConfig.msd)==null?void 0:_.anchors)||{},c={...this._getBaseSvgAnchors(),...a},d=Array.isArray(t.waypoints)?t.waypoints:[],h=u(f=>Array.isArray(f)&&f.length>=2?[f[0],f[1]]:typeof f=="string"&&c[f]?c[f]:null,"resolveEntry"),p=[];for(let f=0;f<=d.length;f++){const y=f===0?i:h(d[f-1]),w=f===d.length?s:h(d[f]);!y||!w||p.push({segStart:y,segEnd:w,insertIndex:f})}return v`
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1000;">
                ${p.map(({segStart:f,segEnd:y,insertIndex:w})=>{const x=(f[0]+y[0])/2,$=(f[1]+y[1])/2,[D,M]=r(x,$);return v`
                        <div
                            class="waypoint-insert-marker"
                            style="
                                position: absolute;
                                left: ${D}px;
                                top: ${M}px;
                                transform: translate(-50%, -50%) rotate(45deg);
                                width: 12px;
                                height: 12px;
                                background: rgba(0, 255, 136, 0.5);
                                border: 1px dashed #FFF;
                                cursor: pointer;
                                pointer-events: auto;
                                box-shadow: 0 1px 4px rgba(0,0,0,0.3);
                                z-index: 1000;
                            "
                            @click=${P=>this._handleWaypointInsertClick(P,t.id,w,x,$)}
                            title="Click to insert a waypoint here">
                        </div>
                    `})}
            </div>
        `}_renderWaypointMarkers(){var E,B,U,I;if(!this._showWaypointMarkers||!this._selectedLineId)return"";const t=(((E=this._workingConfig.msd)==null?void 0:E.overlays)||[]).find(F=>F.id===this._selectedLineId);if(!t||!t.waypoints||t.waypoints.length===0)return"";const i=this.shadowRoot.querySelector("lcards-msd-live-preview");if(!i)return"";const o=i.shadowRoot;if(!o)return"";const s=o.querySelector(".preview-card-container");if(!s)return"";const r=s.querySelector("lcards-msd-card");if(!r)return"";const a=r.shadowRoot||r.renderRoot;if(!a)return"";const l=a.querySelector("svg");if(!l)return"";const c=(B=l.getAttribute("viewBox"))==null?void 0:B.split(" ").map(Number);if(!c||c.length!==4)return"";const[d,h,p,g]=c,_=l.getBoundingClientRect(),f=(U=this.shadowRoot.querySelector(".preview-panel"))==null?void 0:U.getBoundingClientRect();if(!f)return"";const y=Math.max(p/_.width,g/_.height),w=p/y,x=g/y,$=(_.width-w)/2,D=(_.height-x)/2,M=u((F,b)=>{const C=(F-d)/y+$,S=(b-h)/y+D,A=C+(_.left-f.left),z=S+(_.top-f.top);return[A,z]},"vbToPixel"),P=((I=this._workingConfig.msd)==null?void 0:I.anchors)||{},L={...this._getBaseSvgAnchors(),...P};return v`
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1000;
            ">
                ${t.waypoints.map((F,b)=>{var O,V;let C,S,A=false,z="";if(Array.isArray(F)&&F.length>=2)[C,S]=F;else if(typeof F=="string"&&L[F])A=true,z=F,[C,S]=L[F];else return"";const[T,R]=M(C,S),q=((O=this._waypointDragState)==null?void 0:O.lineId)===t.id&&((V=this._waypointDragState)==null?void 0:V.waypointIndex)===b;return v`
                        <div
                            class="waypoint-marker editing ${q?"dragging":""} ${A?"named-anchor":""}"
                            style="
                                position: absolute;
                                left: ${T}px;
                                top: ${R}px;
                                transform: translate(-50%, -50%);
                                width: 24px;
                                height: 24px;
                                border-radius: 50%;
                                background: ${q?"#FFAA00":A?"#FFFF00":"#00FF88"};
                                border: 2px solid ${A?"#FF9900":"#FFF"};
                                cursor: move;
                                pointer-events: auto;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                                transition: all 0.2s ease;
                                z-index: ${q?"1002":"1001"};
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-family: 'Antonio', sans-serif;
                                font-size: 12px;
                                font-weight: 700;
                                color: #000;
                            "
                            @mousedown=${H=>this._handleWaypointMouseDown(H,t.id,b)}
                            @dblclick=${H=>this._handleWaypointDoubleClick(H,t.id,b)}
                            title="${A?`Named waypoint: ${z}`:`Waypoint ${b+1}`} (Drag to move, Double-click to delete)">
                            ${b+1}
                        </div>
                    `})}
            </div>
        `}_resolveCornerGeometry(e,t){var U;const i=Array.isArray(e.waypoints)?e.waypoints:[],o=i[t];if(!Array.isArray(o))return null;const s=this._resolvePositionWithSide(e.anchor,e.anchor_side);let r=e.attach_to;Array.isArray(r)&&(r=r[r.length-1]);const a=this._resolvePositionWithSide(r,e.attach_side);if(!s||!a)return null;const l=((U=this._workingConfig.msd)==null?void 0:U.anchors)||{},d={...this._getBaseSvgAnchors(),...l},h=u(I=>Array.isArray(I)&&I.length>=2?[I[0],I[1]]:typeof I=="string"&&d[I]?d[I]:null,"resolveEntry"),p=[s,...i.map(h),a],g=t+1,_=p[g-1],f=p[g],y=p[g+1];if(!_||!f||!y)return null;const w=[f[0]-_[0],f[1]-_[1]],x=[y[0]-f[0],y[1]-f[1]],$=Math.hypot(w[0],w[1]),D=Math.hypot(x[0],x[1]);if($<.01||D<.01)return null;const M=[w[0]/$,w[1]/$],P=[x[0]/D,x[1]/D],k=w[0]*x[1]-w[1]*x[0],L=w[0]*x[0]+w[1]*x[1];if(k===0&&L>0)return null;const E=[P[0]-M[0],P[1]-M[1]],B=Math.hypot(E[0],E[1]);return B<.001?null:{p:f,bisectorUnit:[E[0]/B,E[1]/B],lenIn:$,lenOut:D}}_renderCornerRadiusHandles(){var a;if(!this._showWaypointMarkers||!this._selectedLineId)return"";const t=(((a=this._workingConfig.msd)==null?void 0:a.overlays)||[]).find(l=>l.id===this._selectedLineId&&l.type==="line");if(!t||t.route!=="manual"||(t.corner_style||"round")==="miter")return"";const i=Array.isArray(t.waypoints)?t.waypoints:[];if(!i.length)return"";const o=this._getViewBoxToPixelConverter();if(!o)return"";const s=Number(t.corner_radius??34),r=[];for(let l=0;l<i.length;l++){const c=i[l];if(!Array.isArray(c))continue;const d=this._resolveCornerGeometry(t,l);if(!d)continue;const h=c.length>=3&&Number.isFinite(Number(c[2]))?Number(c[2]):s,p=[d.p[0]+h*d.bisectorUnit[0],d.p[1]+h*d.bisectorUnit[1]];r.push({wpIndex:l,handlePt:p,radius:h})}return r.length?v`
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1001;">
                ${r.map(({wpIndex:l,handlePt:c,radius:d})=>{var _,f;const[h,p]=o(c[0],c[1]),g=((_=this._cornerRadiusDragState)==null?void 0:_.lineId)===t.id&&((f=this._cornerRadiusDragState)==null?void 0:f.waypointIndex)===l;return v`
                        <div
                            class="corner-radius-handle ${g?"dragging":""}"
                            style="
                                position: absolute;
                                left: ${h}px;
                                top: ${p}px;
                                transform: translate(-50%, -50%);
                                width: 14px;
                                height: 14px;
                                border-radius: 50%;
                                background: ${g?"#FF66FF":"#CC66FF"};
                                border: 2px solid #FFF;
                                cursor: ew-resize;
                                pointer-events: auto;
                                box-shadow: 0 2px 6px rgba(0,0,0,0.35);
                                z-index: ${g?"1003":"1001"};
                            "
                            @mousedown=${y=>this._handleCornerRadiusMouseDown(y,t.id,l)}
                            @dblclick=${y=>this._handleCornerRadiusDoubleClick(y,t.id,l)}
                            title="Corner radius: ${Math.round(d)} (drag to adjust, double-click to reset to line default)">
                        </div>
                        ${g?v`
                            <div class="live-coord-badge" style="position: absolute; left: ${h}px; top: ${p-24}px; transform: translate(-50%, -50%);">
                                ${Math.round(d)} vb
                            </div>
                        `:""}
                    `})}
            </div>
        `:""}_handleCornerRadiusMouseDown(e,t,i){e.stopPropagation(),e.preventDefault(),this._cornerRadiusDragInProgress=true,this._cornerRadiusDragState={lineId:t,waypointIndex:i},this._boundCornerRadiusMouseMove=this._handleCornerRadiusMouseMove.bind(this),this._boundCornerRadiusMouseUp=this._handleCornerRadiusMouseUp.bind(this),document.addEventListener("mousemove",this._boundCornerRadiusMouseMove),document.addEventListener("mouseup",this._boundCornerRadiusMouseUp),this.requestUpdate()}_handleCornerRadiusMouseMove(e){var g,_;if(!this._cornerRadiusDragState)return;e.preventDefault();const{lineId:t,waypointIndex:i}=this._cornerRadiusDragState,s=(((g=this._workingConfig.msd)==null?void 0:g.overlays)||[]).find(f=>f.id===t);if(!s)return;const r=this._resolveCornerGeometry(s,i);if(!r)return;const a=this._getPreviewCoordinatesFromMouseEvent(e);if(!a)return;const l=a.x-r.p[0],c=a.y-r.p[1];let d=Math.max(0,l*r.bisectorUnit[0]+c*r.bisectorUnit[1]);d=this._enableSnapping&&this._gridSpacing>0?Math.round(d/this._gridSpacing)*this._gridSpacing:this._roundToPrecision(d);const h=s.waypoints[i],p=[h[0],h[1],d];s.waypoints[i]=p,((_=this._lineFormData)==null?void 0:_.id)===t&&Array.isArray(this._lineFormData.waypoints)&&(this._lineFormData.waypoints[i]=p),this._schedulePreviewUpdate(),this.requestUpdate()}_handleCornerRadiusMouseUp(e){this._cornerRadiusDragState&&(e.preventDefault(),e.stopPropagation(),this._cornerRadiusDragState=null,this._boundCornerRadiusMouseMove&&(document.removeEventListener("mousemove",this._boundCornerRadiusMouseMove),this._boundCornerRadiusMouseMove=null),this._boundCornerRadiusMouseUp&&(document.removeEventListener("mouseup",this._boundCornerRadiusMouseUp),this._boundCornerRadiusMouseUp=null),setTimeout(()=>{this._cornerRadiusDragInProgress=false},150),this.requestUpdate())}_handleCornerRadiusDoubleClick(e,t,i){var a,l,c;e.stopPropagation(),e.preventDefault();const s=(((a=this._workingConfig.msd)==null?void 0:a.overlays)||[]).find(d=>d.id===t),r=(l=s==null?void 0:s.waypoints)==null?void 0:l[i];if(Array.isArray(r)&&r.length>=3){r.splice(2,r.length-2);const d=((c=this._lineFormData)==null?void 0:c.id)===t&&Array.isArray(this._lineFormData.waypoints)?this._lineFormData.waypoints[i]:null;Array.isArray(d)&&d.length>=3&&d.splice(2,d.length-2),this._schedulePreviewUpdate(),this.requestUpdate()}}_handleWaypointMouseDown(e,t,i){e.stopPropagation(),e.preventDefault(),this._waypointEditingLineId!==t&&(this._waypointEditingLineId=t),this._waypointDragInProgress=true,this._waypointDragState={lineId:t,waypointIndex:i,startX:e.clientX,startY:e.clientY},this._boundWaypointMouseMove=this._handleWaypointMouseMove.bind(this),this._boundWaypointMouseUp=this._handleWaypointMouseUp.bind(this),document.addEventListener("mousemove",this._boundWaypointMouseMove),document.addEventListener("mouseup",this._boundWaypointMouseUp),this.requestUpdate()}_handleWaypointMouseMove(e){var _,f,y;if(!this._waypointDragState)return;e.preventDefault();const{lineId:t,waypointIndex:i}=this._waypointDragState,o=this._getPreviewCoordinatesFromMouseEvent(e);if(!o)return;let{x:s,y:r}=o;if(this._enableSnapping&&this._gridSpacing>0){const w=_i(s,r,this._gridSpacing);s=w[0],r=w[1]}let a=[this._roundToPrecision(s),this._roundToPrecision(r)];const l=30,c=((_=this._workingConfig.msd)==null?void 0:_.anchors)||{},d=this._getBaseSvgAnchors(),h={...c,...d};if(h&&typeof h=="object"&&!Array.isArray(h)){for(const[w,x]of Object.entries(h))if(Array.isArray(x)&&x.length>=2){const[$,D]=x;if(Math.sqrt(Math.pow(s-$,2)+Math.pow(r-D,2))<l){a=w,m.debug(`[MSDStudio] Waypoint ${i} snapped to anchor: ${w}`);break}}}const p=((f=this._workingConfig.msd)==null?void 0:f.overlays)||[],g=p.findIndex(w=>w.id===t);if(g!==-1){const w=p[g];w.waypoints&&w.waypoints[i]!==void 0&&(w.waypoints[i]=a,((y=this._lineFormData)==null?void 0:y.id)===t&&this._lineFormData.waypoints&&(this._lineFormData.waypoints[i]=a),this._schedulePreviewUpdate(),this.requestUpdate())}}_handleWaypointMouseUp(e){this._waypointDragState&&(e.preventDefault(),e.stopPropagation(),this._waypointDragState=null,this._boundWaypointMouseMove&&(document.removeEventListener("mousemove",this._boundWaypointMouseMove),this._boundWaypointMouseMove=null),this._boundWaypointMouseUp&&(document.removeEventListener("mouseup",this._boundWaypointMouseUp),this._boundWaypointMouseUp=null),setTimeout(()=>{this._waypointDragInProgress=false},150),this.requestUpdate())}_handleWaypointDoubleClick(e,t,i){var r,a;e.stopPropagation(),e.preventDefault(),this._clickTimeout&&(clearTimeout(this._clickTimeout),this._clickTimeout=null);const o=((r=this._workingConfig.msd)==null?void 0:r.overlays)||[],s=o.findIndex(l=>l.id===t);if(s!==-1){const l=o[s];l.waypoints&&l.waypoints.length>0&&(l.waypoints.splice(i,1),((a=this._lineFormData)==null?void 0:a.id)===t&&this._lineFormData.waypoints&&this._lineFormData.waypoints.splice(i,1),l.waypoints.length,m.debug(`[MSDStudio] Deleted waypoint ${i} from line ${t}`),this._schedulePreviewUpdate(),this.requestUpdate())}}_handleWaypointInsertClick(e,t,i,o,s){var l,c;e.stopPropagation(),e.preventDefault();const a=(((l=this._workingConfig.msd)==null?void 0:l.overlays)||[]).find(d=>d.id===t&&d.type==="line");a&&(a.route!=="manual"&&(a.route="manual"),Array.isArray(a.waypoints)||(a.waypoints=[]),a.waypoints.splice(i,0,[this._roundToPrecision(o),this._roundToPrecision(s)]),((c=this._lineFormData)==null?void 0:c.id)===t&&(this._lineFormData.route="manual",this._lineFormData.waypoints=[...a.waypoints]),m.debug(`[MSDStudio] Inserted waypoint at index ${i} on line ${t}`),this._schedulePreviewUpdate(),this.requestUpdate())}_convertLineToManual(e){const t=this.shadowRoot.querySelector("lcards-msd-live-preview");if(!t){m.warn("[MSDStudio] Cannot convert to manual: preview not found");return}const i=t.shadowRoot;if(!i)return;const o=i.querySelector(".preview-card-container");if(!o)return;const s=o.querySelector("lcards-msd-card");if(!s)return;const r=s.shadowRoot||s.renderRoot;if(!r)return;const a=r.querySelector("svg");if(!a)return;const l=a.querySelector(`g[data-overlay-id="${e}"] path.line-path`);if(!l){m.warn("[MSDStudio] Cannot convert to manual: line path not found in SVG");return}const c=l.getAttribute("d");if(!c)return;const d=[],h=c.match(/[ML]\s*[\d.]+,[\d.]+/g)||[];h.forEach((p,g)=>{if(g===0||g===h.length-1)return;const _=p.replace(/[ML]\s*/,"").split(",").map(Number);_.length===2&&d.push([_[0],_[1]])}),this._lineFormData.route="manual",this._lineFormData.waypoints=d,m.info(`[MSDStudio] Converted line ${e} to manual mode with ${d.length} waypoints`),this.requestUpdate()}_renderChannelHighlight(){var F;if(!this._highlightedChannel)return"";const t=(((F=this._workingConfig.msd)==null?void 0:F.channels)||{})[this._highlightedChannel];if(!t||!t.bounds)return"";const[i,o,s,r]=t.bounds,a=this._getPreviewSvgAndViewBox();if(!a)return"";const{svg:l,viewBoxX:c,viewBoxY:d,viewBoxWidth:h,viewBoxHeight:p}=a,g=l.getBoundingClientRect(),_=this.shadowRoot.querySelector(".preview-panel");if(!_)return"";const f=_.getBoundingClientRect(),y=h/g.width,w=p/g.height,x=Math.max(y,w),$=h/x,D=p/x,M=(g.width-$)/2,P=(g.height-D)/2,k=(i-c)/x+M,L=(o-d)/x+P,E=s/x,B=r/x,U=g.left-f.left+k,I=g.top-f.top+L;return v`
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 998;
            ">
                <!-- Pulsing rectangle around channel -->
                <div style="
                    position: absolute;
                    left: ${U}px;
                    top: ${I}px;
                    width: ${E}px;
                    height: ${B}px;
                    border: 3px solid #FFAA00;
                    box-shadow: 0 0 20px rgba(255, 170, 0, 0.8);
                    animation: channel-pulse 1s ease-in-out infinite;
                "></div>

                <!-- Channel ID label -->
                <div style="
                    position: absolute;
                    left: ${U+E/2}px;
                    top: ${I-10}px;
                    transform: translate(-50%, -100%);
                    background: rgba(255, 170, 0, 0.95);
                    color: black;
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    font-weight: 700;
                    white-space: nowrap;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
                ">
                    ${this._highlightedChannel}
                </div>
            </div>

            <style>
                @keyframes channel-pulse {
                    0%, 100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.5;
                        transform: scale(1.03);
                    }
                }
            </style>
        `}_renderAttachmentPointsOverlay(){var F;if(this._activeMode===N.ADD_WAYPOINT||this._activeMode!==N.CONNECT_LINE&&!this._showAttachmentPoints)return"";const e=((F=this._workingConfig.msd)==null?void 0:F.anchors)||{},i={...this._getBaseSvgAnchors(),...e},o=this._getControlOverlays(),s=this._getPreviewSvgAndViewBox();if(!s)return"";const{svg:r,viewBoxX:a,viewBoxY:l,viewBoxWidth:c,viewBoxHeight:d}=s,h=r.getBoundingClientRect(),p=this.shadowRoot.querySelector(".preview-panel");if(!p)return"";const g=p.getBoundingClientRect(),_=c/h.width,f=d/h.height,y=Math.max(_,f),w=c/y,x=d/y,$=(h.width-w)/2,D=(h.height-x)/2,M=u((b,C)=>{const S=(b-a)/y+$,A=(C-l)/y+D;return{x:h.left-g.left+S,y:h.top-g.top+A}},"toPixelPos"),P=[{name:"top-left",dx:-1,dy:-1},{name:"top",dx:0,dy:-1},{name:"top-right",dx:1,dy:-1},{name:"left",dx:-1,dy:0},{name:"center",dx:0,dy:0},{name:"right",dx:1,dy:0},{name:"bottom-left",dx:-1,dy:1},{name:"bottom",dx:0,dy:1},{name:"bottom-right",dx:1,dy:1}],k=Object.entries(i).map(([b,C])=>{var V,H,Y;if(!Array.isArray(C))return"";const[S,A]=C,z=M(S,A),T={name:"center"},R=z.x,q=z.y,O=((V=this._connectLineState.source)==null?void 0:V.type)==="anchor"&&((H=this._connectLineState.source)==null?void 0:H.id)===b&&((Y=this._connectLineState.source)==null?void 0:Y.point)===T.name;return v`
                <div
                    class="attachment-point"
                    data-connection-type="anchor"
                    data-connection-id="${b}"
                    data-connection-point="${T.name}"
                    @click=${this._handleAttachmentPointClick}
                    style="
                        position: absolute;
                        left: ${R}px;
                        top: ${q}px;
                        transform: translate(-50%, -50%);
                        width: 12px;
                        height: 12px;
                        background: ${O?"#2196F3":"#00FFFF"};
                        border: 2px solid ${O?"#1976D2":"#00BCD4"};
                        border-radius: 50%;
                        cursor: pointer;
                        box-shadow: 0 0 8px ${O?"rgba(33, 150, 243, 0.8)":"rgba(0, 255, 255, 0.6)"};
                        transition: all 0.2s;
                        pointer-events: auto;
                        z-index: 1000;
                    "
                    @mouseenter=${X=>X.target.style.transform="translate(-50%, -50%) scale(1.5)"}
                    @mouseleave=${X=>X.target.style.transform="translate(-50%, -50%) scale(1)"}
                ></div>
            `}),L=this._showControlForm&&typeof this._controlFormPosition=="string"?this._controlFormPosition:null,E=this._controlFormPositionSide||"center",B=o.map((b,C)=>{if(!b.position&&!b.anchor)return m.warn("[MSDStudio] Control has neither position nor anchor:",b.id),"";const S=this._resolveEditorControlPosition(b,i);if(!S)return m.warn("[MSDStudio] Failed to resolve position for control:",b.id,b.position||b.anchor),"";if(!b.size)return m.warn("[MSDStudio] Control missing size:",b.id),"";const[A,z]=S,[T,R]=b.size,q=b.attachment||"center",O=this._getAttachmentOffset(q,T,R),V=A+O[0],H=z+O[1],Y=M(V,H),X=M(V+T,H+R),W=(Y.x+X.x)/2,j=(Y.y+X.y)/2,Z=X.x-Y.x,Q=X.y-Y.y,he=this._showControlForm&&this._editingControlId===b.id?this._controlFormAttachment||"center":b.attachment||"center";return P.map(ae=>{var Yt,Xt,Gt;const Ce=W+ae.dx*Z/2,ke=j+ae.dy*Q/2,Vt=((Yt=this._connectLineState.source)==null?void 0:Yt.type)==="control"&&((Xt=this._connectLineState.source)==null?void 0:Xt.id)===b.id&&((Gt=this._connectLineState.source)==null?void 0:Gt.point)===ae.name,G=L===b.id&&ae.name===E,lt=ae.name===he;let pe="#FF9900",ge="#F57C00",Wt="none",qe="0 0 8px rgba(255, 153, 0, 0.6)";return Vt?(pe="#2196F3",ge="#1976D2",qe="0 0 8px rgba(33, 150, 243, 0.8)"):G?(pe="#E040FB",ge="#AA00FF",qe="0 0 8px rgba(224, 64, 251, 0.8)"):lt&&(Wt="2px solid #FFFFFF",qe="0 0 8px rgba(255, 153, 0, 0.6), 0 0 0 4px rgba(255, 255, 255, 0.35)"),v`
                    <div
                        class="attachment-point"
                        data-connection-type="control"
                        data-connection-id="${b.id}"
                        data-connection-point="${ae.name}"
                        @click=${this._handleAttachmentPointClick}
                        style="
                            position: absolute;
                            left: ${Ce}px;
                            top: ${ke}px;
                            transform: translate(-50%, -50%);
                            width: 12px;
                            height: 12px;
                            background: ${pe};
                            border: 2px solid ${ge};
                            outline: ${Wt};
                            outline-offset: 2px;
                            border-radius: 50%;
                            cursor: pointer;
                            box-shadow: ${qe};
                            transition: all 0.2s;
                            pointer-events: auto;
                            z-index: 1000;
                        "
                        @mouseenter=${dt=>dt.target.style.transform="translate(-50%, -50%) scale(1.5)"}
                        @mouseleave=${dt=>dt.target.style.transform="translate(-50%, -50%) scale(1)"}
                    ></div>
                `})}),I=this._getShapeOverlays().map(b=>{const C=u(W=>{var j,Z,Q;return((j=this._connectLineState.source)==null?void 0:j.type)==="shape"&&((Z=this._connectLineState.source)==null?void 0:Z.id)===b.id&&((Q=this._connectLineState.source)==null?void 0:Q.point)===W},"isSourceAt"),S=u((W,j,Z)=>{const Q=C(W);return v`
                    <div
                        class="attachment-point"
                        data-connection-type="shape"
                        data-connection-id="${b.id}"
                        data-connection-point="${W}"
                        @click=${this._handleAttachmentPointClick}
                        style="
                            position: absolute;
                            left: ${j}px;
                            top: ${Z}px;
                            transform: translate(-50%, -50%);
                            width: 12px;
                            height: 12px;
                            background: ${Q?"#2196F3":"#00CC88"};
                            border: 2px solid ${Q?"#1976D2":"#009966"};
                            border-radius: 50%;
                            cursor: pointer;
                            box-shadow: 0 0 8px ${Q?"rgba(33, 150, 243, 0.8)":"rgba(0, 204, 136, 0.6)"};
                            transition: all 0.2s;
                            pointer-events: auto;
                            z-index: 1000;
                        "
                        @mouseenter=${he=>he.target.style.transform="translate(-50%, -50%) scale(1.5)"}
                        @mouseleave=${he=>he.target.style.transform="translate(-50%, -50%) scale(1)"}
                    ></div>
                `},"renderDot");if(b.kind==="polyline")return!Array.isArray(b.points)||b.points.length>Me?"":b.points.map((W,j)=>{if(!Array.isArray(W)||W.length<2)return"";const Z=M(W[0],W[1]);return S(`vertex${j}`,Z.x,Z.y)});if(!Array.isArray(b.position)||!Array.isArray(b.size))return"";const[A,z]=b.position,[T,R]=b.size,q=M(A,z),O=M(A+T,z+R),V=(q.x+O.x)/2,H=(q.y+O.y)/2,Y=O.x-q.x,X=O.y-q.y;return P.map(W=>S(W.name,V+W.dx*Y/2,H+W.dy*X/2))});return v`
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1000;
            ">
                ${k}
                ${B}
                ${I}
            </div>
        `}_handleAttachmentPointClick(e){e.stopPropagation();const t=e.currentTarget,i={type:t.dataset.connectionType,id:t.dataset.connectionId,point:t.dataset.connectionPoint,gap:0};this._connectLineState.source?(m.debug("[MSDStudio] Connect line target set:",i),this._openLineFormWithConnection(this._connectLineState.source,i),this._clearConnectLineState()):(this._connectLineState={...this._connectLineState,source:i},m.debug("[MSDStudio] Connect line source set:",i),this.requestUpdate())}_getViewBoxToPixelConverter(){const e=this._getPreviewSvgAndViewBox();if(!e)return null;const{svg:t,viewBoxX:i,viewBoxY:o,viewBoxWidth:s,viewBoxHeight:r}=e,a=t.getBoundingClientRect(),l=this.shadowRoot.querySelector(".preview-panel");if(!l)return null;const c=l.getBoundingClientRect(),d=Math.max(s/a.width,r/a.height),h=s/d,p=r/d,g=(a.width-h)/2,_=(a.height-p)/2;return(f,y)=>{const w=(f-i)/d+g,x=(y-o)/d+_;return[w+(a.left-c.left),x+(a.top-c.top)]}}_renderDrawChannelOverlay(){if(this._activeMode!==N.DRAW_CHANNEL||!this._drawChannelState.drawing)return"";const e=this._renderModeHintLabel("Drag, or click twice, to draw · Esc to cancel");if(!this._drawChannelState.currentPoint)return v`
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 1000;">
                    ${e}
                </div>
            `;const t=this._getViewBoxToPixelConverter();if(!t)return"";const[i,o]=t(...this._drawChannelState.startPoint),[s,r]=t(...this._drawChannelState.currentPoint),a=Math.min(i,s),l=Math.min(o,r),c=Math.abs(s-i),d=Math.abs(r-o);return v`
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                pointer-events: none;
                z-index: 1000;
            ">
                <svg style="width: 100%; height: 100%; position: absolute;">
                    <rect
                        x="${a}px"
                        y="${l}px"
                        width="${c}px"
                        height="${d}px"
                        fill="rgba(0, 255, 255, 0.2)"
                        stroke="#00FFFF"
                        stroke-width="2"
                        stroke-dasharray="5,5" />
                </svg>
                ${e}
            </div>
        `}_renderPlaceControlOverlay(){if(this._activeMode!==N.PLACE_CONTROL||!this._placeControlDrawState.drawing)return"";const e=this._renderModeHintLabel("Drag, or click twice, to size the control · Esc to cancel");if(!this._placeControlDrawState.currentPoint)return v`
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 1000;">
                    ${e}
                </div>
            `;const t=this._getViewBoxToPixelConverter();if(!t)return"";const[i,o]=t(...this._placeControlDrawState.startPoint),[s,r]=t(...this._placeControlDrawState.currentPoint),a=Math.min(i,s),l=Math.min(o,r),c=Math.abs(s-i),d=Math.abs(r-o);return v`
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                pointer-events: none;
                z-index: 1000;
            ">
                <svg style="width: 100%; height: 100%; position: absolute;">
                    <rect
                        x="${a}px"
                        y="${l}px"
                        width="${c}px"
                        height="${d}px"
                        fill="rgba(0, 255, 255, 0.2)"
                        stroke="#00FFFF"
                        stroke-width="2"
                        stroke-dasharray="5,5" />
                </svg>
                ${e}
            </div>
        `}_renderModeHintLabel(e){return v`
            <div style="
                position: absolute;
                bottom: 12px;
                left: 12px;
                max-width: 260px;
                background: rgba(0, 0, 0, 0.85);
                color: #00FFFF;
                padding: 5px 10px;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
                font-size: 13px;
                font-weight: 600;
                line-height: 1.4;
                white-space: normal;
                box-shadow: 0 2px 6px rgba(0,0,0,0.5);
            ">${e}</div>
        `}_renderConnectLineHint(){if(this._activeMode!==N.CONNECT_LINE)return"";const e=this._connectLineState.source?"Click a target anchor/control point to connect · Esc to cancel":"Click a source anchor/control point to start · Esc to cancel";return v`
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 1000;">
                ${this._renderModeHintLabel(e)}
            </div>
        `}_renderDrawShapeOverlay(){if(this._activeMode!==N.DRAW_SHAPE||!this._drawShapeState.drawing)return"";const{kind:e,points:t,currentPoint:i}=this._drawShapeState,o=e==="polyline"?"Click to add point · Enter/dbl-click to finish · Esc to cancel":"Drag, or click twice, to draw · Esc to cancel",s=this._renderModeHintLabel(o),r=this._getViewBoxToPixelConverter();if(!r)return"";if(e==="polyline"){if(t.length===0)return"";const y=t.map(k=>r(k[0],k[1])),w=y.map((k,L)=>`${L===0?"M":"L"} ${k[0]} ${k[1]}`).join(" "),x=y[y.length-1],$=i?(()=>{const[k,L]=r(i[0],i[1]);return`M ${x[0]} ${x[1]} L ${k} ${L}`})():"",D=y.map(k=>`<circle cx="${k[0]}" cy="${k[1]}" r="4" fill="#00FFFF" />`).join(""),M=$?`<path d="${$}" fill="none" stroke="#00FFFF" stroke-width="2" stroke-dasharray="5,5" />`:"",P=`<path d="${w}" fill="none" stroke="#00FFFF" stroke-width="2" />${D}${M}`;return v`
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 1000;">
                    <svg style="width: 100%; height: 100%; position: absolute;">
                        ${we(P)}
                    </svg>
                    ${s}
                </div>
            `}if(!i)return v`
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 1000;">
                    ${s}
                </div>
            `;const[a,l]=r(t[0][0],t[0][1]),[c,d]=r(i[0],i[1]),h=Math.min(a,c),p=Math.min(l,d),g=Math.abs(c-a),_=Math.abs(d-l),f=e==="circle"?`<ellipse
                    cx="${h+g/2}px" cy="${p+_/2}px"
                    rx="${g/2}px" ry="${_/2}px"
                    fill="rgba(0, 255, 255, 0.2)" stroke="#00FFFF" stroke-width="2" stroke-dasharray="5,5" />`:`<rect
                    x="${h}px" y="${p}px" width="${g}px" height="${_}px"
                    fill="rgba(0, 255, 255, 0.2)" stroke="#00FFFF" stroke-width="2" stroke-dasharray="5,5" />`;return v`
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 1000;">
                <svg style="width: 100%; height: 100%; position: absolute;">
                    ${we(f)}
                </svg>
                ${s}
            </div>
        `}_getDebugSettings(){const e={...this._debugSettings,grid:this._showGrid,gridSpacing:this._gridSpacing,grid_spacing:this._gridSpacing,snap_to_grid:this._snapToGrid,routing_channels:true,highlighted_anchor:this._highlightedAnchor};return this._activeTab===J.CONTROLS&&(e.bounding_boxes=true),e}_updateDebugSetting(e,t){this._debugSettings={...this._debugSettings,[e]:t},this._schedulePreviewUpdate(),this.requestUpdate()}_renderControlsTab(){const e=this._getControlOverlays(),t=e.length;return v`
            <div style="padding: 8px;">
                <!-- Control Actions & Visualization Helpers -->
                <div style="display: flex; gap: 8px; margin-bottom: 16px; align-items: center;">
                    <ha-button @click=${this._openControlForm}>
                        <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                        Add Control
                    </ha-button>
                    <ha-button @click=${async i=>{i.stopPropagation(),await this._setMode("place_control")}}
                               ?disabled=${this._activeMode===N.PLACE_CONTROL}>
                        <ha-icon icon="mdi:cursor-default-click" slot="start"></ha-icon>
                        Place on Canvas
                    </ha-button>

                    <!-- Right-aligned visualization helpers -->
                    <div style="flex: 1;"></div>
                    <ha-icon-button
                        class="${this._showBoundingBoxes?"active":""}"
                        @click=${()=>{this._showBoundingBoxes=!this._showBoundingBoxes,this.requestUpdate()}}
                        .label=${"Bounding Boxes"}>
                        <ha-icon icon="mdi:border-outside"></ha-icon>
                    </ha-icon-button>
                    <ha-icon-button
                        class="${this._showAttachmentPoints?"active":""}"
                        @click=${()=>{this._showAttachmentPoints=!this._showAttachmentPoints,this.requestUpdate()}}
                        .label=${"Attachment Points"}>
                        <ha-icon icon="mdi:target-variant"></ha-icon>
                    </ha-icon-button>
                </div>

                <!-- Controls Management -->
                <lcards-form-section
                    header="Control Overlays"
                    description="HA cards positioned on the MSD canvas"
                    icon="mdi:card-multiple"
                    ?expanded=${true}>

                    ${t===0?v`
                        <lcards-message type="info">
                            <strong>No control overlays defined yet.</strong>
                            <p style="margin: 8px 0; font-size: 13px;">
                                Control overlays are Home Assistant cards positioned on your MSD canvas.
                                Click "Add Control" to place your first control.
                            </p>
                        </lcards-message>
                    `:v`
                        <div class="control-list">
                            ${e.map(i=>this._renderControlItem(i))}
                        </div>
                    `}
                </lcards-form-section>

                ${this._renderControlHelp()}
            </div>
        `}_getControlOverlays(){var t;return(((t=this._workingConfig.msd)==null?void 0:t.overlays)||[]).filter(i=>i.type==="control")}_resolveEditorControlPosition(e,t,i=new Set){const o=e.position??e.anchor;if(Array.isArray(o))return o;if(typeof o!="string")return null;if(t&&t[o])return t[o];if(i.has(e.id))return null;i.add(e.id);const s=this._getControlOverlays().find(_=>_.id===o);if(!s)return null;const r=this._resolveEditorControlPosition(s,t,i);if(!r)return null;const[a,l]=s.size||[100,100],c={"top-left":[0,0],top:[-a/2,0],"top-right":[-a,0],left:[0,-l/2],center:[-a/2,-l/2],right:[-a,-l/2],"bottom-left":[0,-l],bottom:[-a/2,-l],"bottom-right":[-a,-l]},d=c[s.attachment||"center"]||c["top-left"],h=r[0]+d[0],p=r[1]+d[1],g={center:[h+a/2,p+l/2],top:[h+a/2,p],bottom:[h+a/2,p+l],left:[h,p+l/2],right:[h+a,p+l/2],"top-left":[h,p],"top-right":[h+a,p],"bottom-left":[h,p+l],"bottom-right":[h+a,p+l]};return g[e.position_side||"center"]||g.center}_getRoutingModeInfo(e){const t={auto:{title:"Auto (Recommended)",icon:"mdi:auto-fix",description:"Always uses full pathfinding: automatically avoids obstacles, bundles with nearby parallel lines into shared trunks, and avoids crossing other lines, whether or not obstacles or channels are present. Best for most use cases. See Bundling and Crossing Avoidance below for how those two behaviors work.",diagram:v`
                    <svg viewBox="0 0 200 80" style="width: 100%; height: auto;">
                        <!-- Source -->
                        <rect x="10" y="25" width="30" height="30" fill="var(--lcars-blue)" rx="4"/>
                        <!-- Obstacle -->
                        <rect x="85" y="20" width="30" height="40" fill="var(--lcars-gray)" rx="4"/>
                        <!-- Target -->
                        <rect x="160" y="25" width="30" height="30" fill="var(--lcars-green)" rx="4"/>
                        <!-- Path around obstacle -->
                        <path d="M 40 40 L 75 40 L 75 15 L 125 15 L 125 40 L 160 40"
                              stroke="var(--lcars-orange)" stroke-width="3" fill="none"/>
                        <!-- Auto badge -->
                        <text x="100" y="75" text-anchor="middle" font-size="10" fill="var(--secondary-text-color)">Avoids obstacles automatically</text>
                    </svg>
                `},bundling:{title:"Bundling (Trunk-and-Branch)",icon:"mdi:transit-connection-variant",description:"Lines that run close and parallel automatically bundle into a shared trunk: the first line keeps its path as the centerline, and later lines ride evenly-spaced lanes beside it, branching apart where their destinations diverge. This happens spontaneously between any two auto-routed lines running near each other; no configuration or shared channel needed. Tunables: Trace Bundling & Crossings section.",diagram:v`
                    <svg viewBox="0 0 200 80" style="width: 100%; height: auto;">
                        <!-- Source A -->
                        <rect x="10" y="8" width="28" height="20" fill="var(--lcars-blue)" rx="4"/>
                        <!-- Source B -->
                        <rect x="10" y="52" width="28" height="20" fill="var(--lcars-blue)" rx="4"/>
                        <!-- Target A -->
                        <rect x="162" y="8" width="28" height="20" fill="var(--lcars-green)" rx="4"/>
                        <!-- Target B -->
                        <rect x="162" y="52" width="28" height="20" fill="var(--lcars-green)" rx="4"/>
                        <!-- Line A: converges into shared trunk, then diverges -->
                        <path d="M 38 18 L 70 18 L 70 37 L 130 37 L 130 18 L 162 18"
                              stroke="var(--lcars-orange)" stroke-width="3" fill="none"/>
                        <!-- Line B: converges into shared trunk (adjacent lane), then diverges -->
                        <path d="M 38 62 L 70 62 L 70 43 L 130 43 L 130 62 L 162 62"
                              stroke="var(--lcars-blue)" stroke-width="3" fill="none"/>
                        <text x="100" y="75" text-anchor="middle" font-size="10" fill="var(--secondary-text-color)">Parallel lines bundle, then branch apart</text>
                    </svg>
                `},crossing:{title:"Crossing Avoidance",icon:"mdi:vector-intersection",description:"A line's path is discouraged from cutting across another line's already-drawn segment: a soft deterrent, not a hard block. If the only alternative is a long detour, the line crosses cleanly rather than pay for an expensive detour. Tunables: Trace Bundling & Crossings section (Crossing Penalty).",diagram:v`
                    <svg viewBox="0 0 200 80" style="width: 100%; height: auto;">
                        <!-- Source -->
                        <rect x="10" y="8" width="28" height="20" fill="var(--lcars-blue)" rx="4"/>
                        <!-- Target -->
                        <rect x="162" y="52" width="28" height="20" fill="var(--lcars-green)" rx="4"/>
                        <!-- Another line's already-drawn segment -->
                        <path d="M 60 40 L 140 40" stroke="var(--lcars-red)" stroke-width="3" fill="none"/>
                        <text x="100" y="32" text-anchor="middle" font-size="9" fill="var(--lcars-red)">another line</text>
                        <!-- This line detours sideways rather than cross it -->
                        <path d="M 38 18 L 45 18 L 45 62 L 162 62"
                              stroke="var(--lcars-orange)" stroke-width="3" fill="none"/>
                        <text x="100" y="75" text-anchor="middle" font-size="10" fill="var(--secondary-text-color)">Detours around rather than crossing</text>
                    </svg>
                `},direct:{title:"Direct (Straight Line)",icon:"mdi:minus",description:"Simple straight line from source to target. No routing or obstacle avoidance. Best when you want a direct connection regardless of obstacles.",diagram:v`
                    <svg viewBox="0 0 200 80" style="width: 100%; height: auto;">
                        <!-- Source -->
                        <rect x="10" y="25" width="30" height="30" fill="var(--lcars-blue)" rx="4"/>
                        <!-- Target -->
                        <rect x="160" y="25" width="30" height="30" fill="var(--lcars-green)" rx="4"/>
                        <!-- Direct path -->
                        <path d="M 40 40 L 160 40"
                              stroke="var(--lcars-orange)" stroke-width="3" fill="none"/>
                    </svg>
                `},manual:{title:"Manual (Custom Waypoints)",icon:"mdi:map-marker-path",description:"Draw your own custom path by placing waypoints. Gives you complete control over the line shape. Best when you need precise, artistic routing that auto mode cannot achieve.",diagram:v`
                    <svg viewBox="0 0 200 80" style="width: 100%; height: auto;">
                        <!-- Source -->
                        <rect x="10" y="40" width="30" height="30" fill="var(--lcars-blue)" rx="4"/>
                        <!-- Waypoints -->
                        <circle cx="80" cy="20" r="4" fill="var(--lcars-orange)"/>
                        <circle cx="120" cy="60" r="4" fill="var(--lcars-orange)"/>
                        <!-- Target -->
                        <rect x="160" y="40" width="30" height="30" fill="var(--lcars-green)" rx="4"/>
                        <!-- Manual path through waypoints -->
                        <path d="M 40 55 L 80 20 L 120 60 L 160 55"
                              stroke="var(--lcars-orange)" stroke-width="3" fill="none"/>
                    </svg>
                `}};return t[e]||t.auto}_renderChannelRoutingOptions(){var i;const e=((i=this._workingConfig.msd)==null?void 0:i.channels)||{},t=Object.keys(e);return this._lineFormData.route_channels||(this._lineFormData.route_channels=[]),t.length===0?v`
                <lcards-form-section
                    header="Channel Routing"
                    description="Route through specific channels (none defined)"
                    icon="mdi:vector-polyline"
                    ?expanded=${false}>

                    <div style="padding: 12px; background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 4px; font-size: 13px; color: var(--secondary-text-color);">
                        <ha-icon icon="mdi:information" style="vertical-align: middle; --mdc-icon-size: 18px;"></ha-icon>
                        No routing channels defined. Create channels in the Channels tab to enable channel-based routing.
                    </div>
                </lcards-form-section>
            `:v`
            <lcards-form-section
                header="Channel Routing"
                description="Route through specific channels for bundling/organizing lines"
                icon="mdi:vector-polyline"
                ?expanded=${false}>

                <ha-selector
                    .hass=${this.hass}
                    .selector=${{select:{options:t,multiple:true,mode:"list"}}}
                    .value=${this._lineFormData.route_channels||[]}
                    .label=${"Select Channels"}
                    helper="Lines will route through selected channels based on channel behavior (prefer/avoid/force)"
                    @value-changed=${o=>{this._lineFormData.route_channels=o.detail.value||[],this.requestUpdate()}}>
                </ha-selector>

                ${this._lineFormData.route_channels&&this._lineFormData.route_channels.length>0?v`
                    <div style="margin-top: 12px; padding: 8px; background: var(--secondary-background-color); border-radius: 4px; font-size: 12px; color: var(--secondary-text-color);">
                        <ha-icon icon="mdi:information-outline" style="vertical-align: middle; --mdc-icon-size: 16px;"></ha-icon>
                        Channel behavior (mode: prefer/avoid/force) and line spacing are configured on the channel, not per-line.
                    </div>
                `:""}
            </lcards-form-section>
        `}_toggleOverlayLocked(e){var s;const t=[...((s=this._workingConfig.msd)==null?void 0:s.overlays)||[]],i=t.findIndex(r=>r.id===e.id);if(i===-1)return;const o={...t[i]};o.locked?delete o.locked:o.locked=true,t[i]=o,this._setNestedValue("msd.overlays",t)}_renderControlItem(e){var a;const t=e.id||"unnamed",i=((a=e.card)==null?void 0:a.type)||"unknown",o=e.position||e.anchor||"not set",s=Array.isArray(o)?`[${o[0]}, ${o[1]}]`:o;e.card&&e.card.type;const r=e.locked===true;return v`
            <div class="list-item-card ${r?"locked":""}">
                <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                    <ha-icon icon="mdi:card-outline" style="--mdc-icon-size: 32px; color: var(--primary-color); flex-shrink: 0;"></ha-icon>
                    <div style="flex: 1; min-width: 140px;">
                        <div style="font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                            ${t}
                            ${r?v`<ha-icon icon="mdi:lock" style="--mdc-icon-size: 16px; color: var(--secondary-text-color);" title="Locked"></ha-icon>`:""}
                        </div>
                        <div style="font-size: 12px; color: var(--secondary-text-color); font-family: monospace; word-break: break-word;">
                            ${i} @ ${s}
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; flex-shrink: 0; margin-left: auto;">
                        <ha-icon-button
                            @click=${()=>this._toggleOverlayLocked(e)}
                            .label=${r?"Unlock":"Lock"}>
                            <ha-icon icon="mdi:${r?"lock":"lock-open-variant"}"></ha-icon>
                        </ha-icon-button>
                        <ha-icon-button
                            @click=${()=>this._editControl(e)}
                            .label=${"Edit"}
                            .path=${"M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"}>
                        </ha-icon-button>
                        <ha-icon-button
                            @click=${()=>this._duplicateControl(e)}
                            .label=${"Duplicate"}
                            .path=${"M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"}>
                        </ha-icon-button>
                        <ha-icon-button
                            @click=${()=>this._highlightControlInPreview(e)}
                            .label=${"Highlight"}
                            .path=${"M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9M12,4.5C17,4.5 21.27,7.61 23,12C21.27,16.39 17,19.5 12,19.5C7,19.5 2.73,16.39 1,12C2.73,7.61 7,4.5 12,4.5M3.18,12C4.83,15.36 8.24,17.5 12,17.5C15.76,17.5 19.17,15.36 20.82,12C19.17,8.64 15.76,6.5 12,6.5C8.24,6.5 4.83,8.64 3.18,12Z"}>
                        </ha-icon-button>
                        <ha-icon-button
                            @click=${()=>this._deleteControl(e)}
                            .label=${"Delete"}
                            .path=${"M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"}>
                        </ha-icon-button>
                    </div>
                </div>
            </div>
        `}_renderControlHelp(){return v`
            ${fe({header:"About control overlays",body:v`
                    <ul>
                        <li>Control overlays are HA cards (buttons, entities, custom cards) placed on the MSD.</li>
                        <li>Place them by anchor or by coordinates.</li>
                        <li>Lines can connect them, for visual flow.</li>
                        <li>For example: a button card at anchor <code>warp_drive</code> showing its power state.</li>
                    </ul>
                `})}
        `}_openControlForm(){var o;const e=((o=this._workingConfig.msd)==null?void 0:o.overlays)||[];let t=e.filter(s=>s.type==="control").length+1,i=`control_${t}`;for(;e.find(s=>s.id===i);)t++,i=`control_${t}`;this._editingControlId=i,this._controlFormId=i,this._controlFormPosition=[0,0],this._controlFormSize=[100,100],this._controlFormAttachment="center",this._controlFormPositionSide="center",this._controlFormObstacle=true,this._controlFormZIndex=null,this._controlFormLocked=false,this._controlFormTriggersUpdateMode="specific",this._controlFormTriggersUpdateEntities=[],this._controlFormTriggersUpdateExpanded=false,this._controlFormCard={type:""},this._controlFormAnimations=[],this._controlFormActiveSubtab="placement",this._showControlForm=true,this.requestUpdate()}_editControl(e){this._editingControlId=e.id,this._controlFormId=e.id,this._controlFormPosition=e.position||e.anchor||[0,0],this._controlFormSize=e.size||[100,100],this._controlFormAttachment=e.attachment||"center",this._controlFormPositionSide=e.position_side||"center",this._controlFormObstacle=e.obstacle===true,this._controlFormZIndex=e.z_index??null,this._controlFormLocked=e.locked===true,this._controlFormTriggersUpdateMode=e.triggers_update==="all"?"all":"specific",this._controlFormTriggersUpdateEntities=Array.isArray(e.triggers_update)?e.triggers_update:[],this._controlFormTriggersUpdateExpanded=this._controlFormTriggersUpdateMode==="all"||this._controlFormTriggersUpdateEntities.length>0,this._controlFormCard=e.card||{type:""},this._controlFormAnimations=e.animations||[],this._controlFormActiveSubtab="placement",this._showControlForm=true,this.requestUpdate()}_duplicateControl(e){var r;const t=((r=this._workingConfig.msd)==null?void 0:r.overlays)||[];let i=t.filter(a=>a.type==="control").length+1,o=`control_${i}`;for(;t.find(a=>a.id===o);)i++,o=`control_${i}`;const s={...JSON.parse(JSON.stringify(e)),id:o};this._setNestedValue("msd.overlays",[...t,s]),this._editControl(s)}_highlightControlInPreview(e){this._highlightedControl=e.id,this._debugSettings={...this._debugSettings,bounding_boxes:true,highlighted_control:e.id},this._schedulePreviewUpdate(),this.requestUpdate(),setTimeout(()=>{this._highlightedControl=null;const{highlighted_control:t,...i}=this._debugSettings;this._debugSettings=i,this._schedulePreviewUpdate(),this.requestUpdate()},2500)}async _deleteControl(e){var s;if(!await this._showConfirmDialog("Delete Control",`Delete control "${e.id}"? This will remove the overlay and its configuration.`))return;const i=[...((s=this._workingConfig.msd)==null?void 0:s.overlays)||[]],o=i.findIndex(r=>r.id===e.id);o>-1&&(i.splice(o,1),this._setNestedValue("msd.overlays",i))}_saveControl(){var a,l,c;const e=[...((a=this._workingConfig.msd)==null?void 0:a.overlays)||[]],t=this._editingControlId?e.findIndex(d=>d.id===this._editingControlId):-1,i=t>=0?e[t]:null,o=this._controlFormTriggersUpdateMode==="all"?"all":(l=this._controlFormTriggersUpdateEntities)!=null&&l.length?[...this._controlFormTriggersUpdateEntities]:void 0,s={...i||{},type:"control",id:this._controlFormId,position:this._controlFormPosition,size:this._controlFormSize,attachment:this._controlFormAttachment,obstacle:this._controlFormObstacle||void 0,z_index:this._controlFormZIndex??void 0,locked:this._controlFormLocked||void 0,triggers_update:o,card:this._controlFormCard,animations:(c=this._controlFormAnimations)!=null&&c.length?this._controlFormAnimations:void 0};typeof this._controlFormPosition=="string"&&e.some(d=>d.type==="control"&&d.id===this._controlFormPosition)&&this._controlFormPositionSide&&this._controlFormPositionSide!=="center"?s.position_side=this._controlFormPositionSide:delete s.position_side,t>=0?e[t]=s:e.push(s),this._setNestedValue("msd.overlays",e),this._closeControlForm()}_closeControlForm(){this._showControlForm=false,this._editingControlId=null,this.requestUpdate()}_handleControlFormTabChange(e){var i;e.stopPropagation();const t=(i=e.target.activeTab)==null?void 0:i.getAttribute("value");t&&(this._controlFormActiveSubtab=t,this.requestUpdate())}_renderControlFormDialog(){var i;const t=!!this._editingControlId&&(((i=this._workingConfig.msd)==null?void 0:i.overlays)||[]).some(o=>o.id===this._editingControlId)?`Edit Control: ${this._controlFormId}`:"Add Control";return v`
            <ha-dialog
                class="subform-dialog"
                open
                @closed=${o=>{o.stopPropagation(),this._closeControlForm()}}
                .headerTitle=${t}
                prevent-scrim-close>

                <!-- Split Layout: Config (Left) + Preview (Right), unified with the line-edit form's shell -->
                <div class="subform-layout">

                    <!-- LEFT COLUMN: Configuration Panel -->
                    <div class="subform-config">
                        <!-- Subtabs -->
                        <ha-tab-group @wa-tab-show=${this._handleControlFormTabChange} class="subform-tabs">
                            <ha-tab-group-tab value="placement" ?active=${this._controlFormActiveSubtab==="placement"}>Placement</ha-tab-group-tab>
                            <ha-tab-group-tab value="card" ?active=${this._controlFormActiveSubtab==="card"}>Card</ha-tab-group-tab>
                            <ha-tab-group-tab value="animation" ?active=${this._controlFormActiveSubtab==="animation"}>Animation</ha-tab-group-tab>
                        </ha-tab-group>

                        <!-- Subtab Content -->
                        <div class="subform-tab-content">
                            ${this._controlFormActiveSubtab==="placement"?this._renderControlFormPlacement():this._controlFormActiveSubtab==="card"?this._renderControlFormCard():this._renderControlFormAnimation()}
                        </div>
                    </div>

                    <!-- RIGHT COLUMN: Preview Panel (Sticky) -->
                    <div class="subform-preview sticky">
                        ${this._renderControlPreview()}
                    </div>

                </div>

                <div slot="footer">
                    <ha-button @click=${this._closeControlForm} appearance="plain">
                        <ha-icon icon="mdi:close" slot="start"></ha-icon>
                        Cancel
                    </ha-button>
                    <ha-button @click=${this._saveControl}>
                        <ha-icon icon="mdi:content-save" slot="start"></ha-icon>
                        Save
                    </ha-button>
                </div>
            </ha-dialog>
        `}_getAllAvailableAnchors(){var o,s;const e=this._getBaseSvgAnchors()||{},t=((o=this._workingConfig.msd)==null?void 0:o.anchors)||{},i=(((s=this._workingConfig.msd)==null?void 0:s.overlays)||[]).filter(r=>r.type==="control"&&r.id!==this._editingControlId).map(r=>r.id);return{...e,...t,...Object.fromEntries(i.map(r=>[r,null]))}}_renderControlFormPlacement(){var r,a;const e=this._getAllAvailableAnchors(),t=[{value:"",label:"Use Coordinates"},...Object.keys(e).sort().map(l=>({value:l,label:l}))],i=typeof this._controlFormPosition=="string",o=i?this._controlFormPosition:"",s=i&&(((r=this._workingConfig.msd)==null?void 0:r.overlays)||[]).some(l=>l.type==="control"&&l.id===o);return v`
            <div class="subform-field-stack">
                <ha-input
                    label="Control ID"
                    .value=${this._controlFormId}
                    @input=${l=>this._controlFormId=l.target.value}
                    required
                    hint="Unique identifier for this control">
                </ha-input>

                <lcards-form-section
                    header="Position"
                    description="Set control position using anchor or coordinates"
                    icon="mdi:crosshairs-gps"
                    ?expanded=${true}>

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{select:{mode:"dropdown",custom_value:t.length>=10,options:t}}}
                        .value=${o}
                        .label=${"Anchor (or use coordinates)"}
                        @value-changed=${l=>{l.detail.value?this._controlFormPosition=l.detail.value:this._controlFormPosition=[0,0],this.requestUpdate()}}>
                    </ha-selector>

                    ${i?"":v`
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
                            <ha-input
                                type="number"
                                label="X Position"
                                .value=${String(this._controlFormPosition[0]||0)}
                                @input=${l=>{this._controlFormPosition=[this._roundToPrecision(Number(l.target.value)),this._controlFormPosition[1]],this.requestUpdate()}}>
                            </ha-input>
                            <ha-input
                                type="number"
                                label="Y Position"
                                .value=${String(this._controlFormPosition[1]||0)}
                                @input=${l=>{this._controlFormPosition=[this._controlFormPosition[0],this._roundToPrecision(Number(l.target.value))],this.requestUpdate()}}>
                            </ha-input>
                        </div>
                    `}

                    <!-- Attachment Point - defines where on control the position refers to -->
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--divider-color);">
                        <lcards-position-picker
                            .value=${this._controlFormAttachment||"center"}
                            .label=${"Attachment Point"}
                            .helper=${"Which point of the control the position refers to (e.g., 'center' means coordinates specify the control's center)"}
                            @value-changed=${l=>{const c={"top-center":"top","bottom-center":"bottom","center-left":"left","center-right":"right"};this._controlFormAttachment=c[l.detail.value]||l.detail.value,this.requestUpdate()}}>
                        </lcards-position-picker>
                    </div>

                    ${s?v`
                        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--divider-color);">
                            <lcards-position-picker
                                .value=${this._controlFormPositionSide||"center"}
                                .label=${"Target Attachment Point"}
                                .helper=${`Which point of "${o}" to attach to (instead of its center)`}
                                @value-changed=${l=>{const c={"top-center":"top","bottom-center":"bottom","center-left":"left","center-right":"right"};this._controlFormPositionSide=c[l.detail.value]||l.detail.value,this.requestUpdate()}}>
                            </lcards-position-picker>
                        </div>
                    `:""}
                </lcards-form-section>

                <lcards-form-section
                    header="Size"
                    description="Control dimensions in pixels"
                    icon="mdi:resize"
                    ?expanded=${true}>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <ha-input
                            type="number"
                            label="Width"
                            .value=${String(this._controlFormSize[0]||100)}
                            @input=${l=>{this._controlFormSize=[this._roundToPrecision(Number(l.target.value)),this._controlFormSize[1]],this.requestUpdate()}}>
                        </ha-input>
                        <ha-input
                            type="number"
                            label="Height"
                            .value=${String(this._controlFormSize[1]||100)}
                            @input=${l=>{this._controlFormSize=[this._controlFormSize[0],this._roundToPrecision(Number(l.target.value))],this.requestUpdate()}}>
                        </ha-input>
                    </div>
                </lcards-form-section>

                <lcards-form-section
                    header="Routing Behavior"
                    description="Control how lines route around this overlay"
                    icon="mdi:vector-polyline-remove"
                    ?expanded=${false}>
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Treat as obstacle for line routing"}
                        .helper=${"When enabled, lines with route: auto will avoid this control overlay"}
                        .selector=${{boolean:{}}}
                        .value=${this._controlFormObstacle===true}
                        @value-changed=${l=>{this._controlFormObstacle=l.detail.value,this.requestUpdate()}}>
                    </ha-selector>
                </lcards-form-section>

                <lcards-form-section
                    header="Stacking Order"
                    description="Control paint order relative to other controls and lines"
                    icon="mdi:layers-outline"
                    secondary=${this._controlFormZIndex!=null?`Z-Index: ${this._controlFormZIndex} (custom)`:"Z-Index: 200 (default)"}
                    ?expanded=${this._controlFormZIndex!=null}>
                    <ha-input
                        type="number"
                        label="Z-Index"
                        .value=${this._controlFormZIndex!=null?String(this._controlFormZIndex):""}
                        @input=${l=>{const c=l.target.value;this._controlFormZIndex=c===""?null:Number(c),this.requestUpdate()}}
                        hint="Higher values paint on top. Leave blank to use the default (200, so controls paint over lines).">
                    </ha-input>
                </lcards-form-section>

                <lcards-form-section
                    header="Editor Lock"
                    description="Prevent accidental drag/resize on the MSD Studio canvas"
                    icon="mdi:lock-outline"
                    secondary=${this._controlFormLocked?"Locked":"Unlocked"}
                    ?expanded=${this._controlFormLocked}>
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Lock this overlay"}
                        .helper=${"When enabled, this overlay can't be dragged or resized on the canvas. A large overlay that mostly covers other overlays (e.g. an elbow spanning a big area) can otherwise block clicks meant for whatever is visually underneath it. Edit it via this form or the list panel's Lock icon instead."}
                        .selector=${{boolean:{}}}
                        .value=${this._controlFormLocked===true}
                        @value-changed=${l=>{this._controlFormLocked=l.detail.value,this.requestUpdate()}}>
                    </ha-selector>
                </lcards-form-section>

                <lcards-form-section
                    header="Update Behavior (Advanced)"
                    description="Fine-tune which entity changes cause this control to refresh"
                    icon="mdi:refresh-circle"
                    secondary=${this._controlFormTriggersUpdateMode==="all"?"Always update":(a=this._controlFormTriggersUpdateEntities)!=null&&a.length?`${this._controlFormTriggersUpdateEntities.length} extra ${this._controlFormTriggersUpdateEntities.length===1?"entity":"entities"}`:"Default (auto-detected)"}
                    ?expanded=${this._controlFormTriggersUpdateExpanded}
                    @expanded-changed=${l=>{this._controlFormTriggersUpdateExpanded=l.detail.expanded}}>

                    <lcards-message type="info">
                        Most entities are detected automatically. List them here only when the card finds entities
                        at runtime (computed keys, wildcards, device classes).
                    </lcards-message>

                    <ha-radio-group
                        style="margin-top: 12px; display: block;"
                        .value=${this._controlFormTriggersUpdateMode}
                        @change=${l=>{this._controlFormTriggersUpdateMode=l.target.value,this._controlFormTriggersUpdateExpanded=true,this.requestUpdate()}}>
                        <ha-radio-option value="specific">Specific entities</ha-radio-option>
                        <ha-radio-option value="all">Always update (any entity change)</ha-radio-option>
                    </ha-radio-group>

                    ${this._controlFormTriggersUpdateMode==="specific"?v`
                        <ha-selector
                            style="margin-top: 12px; display: block;"
                            .hass=${this.hass}
                            .selector=${{entity:{multiple:true}}}
                            .value=${this._controlFormTriggersUpdateEntities}
                            .label=${"Extra Entities"}
                            .helper=${"Entities this control depends on beyond what's auto-detected"}
                            @value-changed=${l=>{this._controlFormTriggersUpdateEntities=l.detail.value||[],this._controlFormTriggersUpdateExpanded=true,this.requestUpdate()}}>
                        </ha-selector>
                    `:v`
                        <lcards-message type="warning" style="margin-top: 12px;">
                            This control refreshes on every state change. Use it only when the card's entities can't be
                            listed; prefer "Specific entities".
                        </lcards-message>
                    `}
                </lcards-form-section>
            </div>
        `}_renderControlFormAnimation(){const e=this._editingControlId||this._controlFormId;return v`
            <div class="subform-field-stack">
                <lcards-form-section
                    header="Control Animations"
                    description="Configure animations for this control's positioned wrapper (opacity/transform/glow-style effects), not the embedded card's own internals"
                    icon="mdi:animation"
                    ?expanded=${true}>

                    <lcards-animation-editor
                        .hass=${this.hass}
                        .animations=${this._controlFormAnimations||[]}
                        .cardElement=${this._getLivePreviewCardElement()}
                        .searchRootSelector=${e?`[data-overlay-id="${e}"]`:""}
                        @animations-changed=${t=>{this._controlFormAnimations=t.detail.value,this.requestUpdate()}}
                        @refresh-targets=${()=>this.requestUpdate()}
                    ></lcards-animation-editor>
                </lcards-form-section>
            </div>
        `}_renderControlFormCard(){return this._debugHAComponents(),this._renderControlFormCardLegacy()}_renderControlFormCardLegacy(){var o;const e=((o=this._controlFormCard)==null?void 0:o.type)||"",t=this._getLovelace(),i=this._getAvailableCardTypes();return m.trace("[MSDStudio] Rendering Tier 2 Card tab (dropdown mode), cardType:",e),v`
            <div class="subform-field-stack">
                ${e?v`
                    <!-- Selected Card Info + Change Button -->
                    <div class="selected-card-info" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: var(--primary-background-color, #03a9f4); color: white; border-radius: var(--ha-card-border-radius, 12px); margin-bottom: 16px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <ha-icon icon="${this._getCardIcon(e)}" style="--mdc-icon-size: 28px; color: white;"></ha-icon>
                            <div>
                                <div style="font-weight: 600; font-size: 15px;">${this._getCardTypeName(e)}</div>
                                <div style="font-size: 12px; opacity: 0.9;">Selected card type</div>
                            </div>
                        </div>
                        <ha-button
                            @click=${()=>{this._previousCardConfig={...this._controlFormCard},this._controlFormCard={type:""},this.requestUpdate()}}>
                            <ha-icon icon="mdi:swap-horizontal" slot="start"></ha-icon>
                            Change
                        </ha-button>
                    </div>

                    <!-- HA Native Card Configuration Editor (same as Tier 1) -->
                    <lcards-form-section
                        header="Card Configuration"
                        description="Configure the card using graphical editor or view YAML"
                        icon="mdi:cog"
                        ?expanded=${true}>

                        <div class="card-editor-container" style="padding: 16px;">
                            ${this._cardConfigMode==="yaml"?v`
                                <!-- YAML Editor with Show Code toggle -->
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                    <div style="font-weight: 500;">YAML Configuration</div>
                                    <ha-button
                                        @click=${()=>{this._cardConfigMode="graphical",this.requestUpdate()}}>
                                        <ha-icon icon="mdi:form-select" slot="start"></ha-icon>
                                        Switch to Editor
                                    </ha-button>
                                </div>
                                <ha-yaml-editor
                                    .hass=${this.hass}
                                    .defaultValue=${this._controlFormCard}
                                    @value-changed=${s=>{s.detail.isValid&&(this._controlFormCard=s.detail.value,this.requestUpdate())}}>
                                </ha-yaml-editor>
                            `:t&&customElements.get("hui-card-element-editor")?v`
                                <!-- Graphical Editor (Modal) -->
                                <ha-button
                                    @click=${this._openCardEditorModal}
                                    style="width: 100%; margin-bottom: 12px;">
                                    <ha-icon icon="mdi:pencil" slot="start"></ha-icon>
                                    Open Card Editor
                                </ha-button>

                                <!-- Show Code toggle button (like HA dialogs) -->
                                <ha-button
                                    @click=${()=>{this._cardConfigMode="yaml",this.requestUpdate()}}
                                    style="width: 100%;">
                                    <ha-icon icon="mdi:code-braces" slot="start"></ha-icon>
                                    Show Code
                                </ha-button>
                            `:v`
                                <!-- Fallback: Basic UI Editor -->
                                <lcards-message type="warning">
                                    Graphical editor unavailable. Using YAML mode.
                                </lcards-message>
                                <ha-yaml-editor
                                    .hass=${this.hass}
                                    .defaultValue=${this._controlFormCard}
                                    @value-changed=${s=>{s.detail.isValid&&(this._controlFormCard=s.detail.value,this.requestUpdate())}}>
                                </ha-yaml-editor>
                            `}
                        </div>
                    </lcards-form-section>
                `:v`
                    <!-- Card Picker Button (opens in editor context) -->
                    <div style="padding: 16px; background: var(--card-background-color); border-radius: 8px; text-align: center;">
                        <div style="margin-bottom: 12px; font-weight: 500;">Quick Add Card</div>
                        <ha-button
                            @click=${async()=>{try{const s=await this._requestCardFromPicker("control");s&&(this._controlFormCard=s,this._previousCardConfig=null,m.debug("[MSDStudio] Card selected:",s),this.requestUpdate())}catch(s){m.error("[MSDStudio] Card picker failed:",s)}}}>
                            <ha-icon icon="mdi:card-plus" slot="start"></ha-icon>
                            Open Card Picker
                        </ha-button>
                        <div style="margin-top: 8px; font-size: 12px; color: var(--secondary-text-color);">
                            Opens card picker in a separate dialog
                        </div>
                    </div>

                    <div style="text-align: center; color: var(--secondary-text-color); font-size: 12px; margin: -8px 0;">
                        - OR -
                    </div>

                    <!-- Enhanced Dropdown Card Selector -->
                    <lcards-form-section
                        header="Select Card Type"
                        description="Choose a card to display in this control overlay"
                        icon="mdi:card-search"
                        ?expanded=${true}>
                        <div style="padding: 16px;">
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select:{mode:"dropdown",custom_value:i.length>=10,options:i.map(s=>({value:s.type,label:s.name,icon:s.icon}))}}}
                                .value=${e}
                                .label=${"Card Type"}
                                @keydown=${s=>{s.key==="Escape"&&s.stopPropagation()}}
                                @value-changed=${s=>{const r=s.detail.value;r&&this._selectCardType(r)}}>
                            </ha-selector>

                            <!-- Cancel button if we had a previous card -->
                            ${this._previousCardConfig?v`
                                <div style="margin-top: 12px;">
                                    <ha-button
                                        @click=${this._cancelCardTypeChange}
                                        style="width: 100%;">
                                        <ha-icon icon="mdi:undo" slot="start"></ha-icon>
                                        Cancel - Keep Current Card
                                    </ha-button>
                                </div>
                            `:""}
                        </div>
                    </lcards-form-section>
                `}
            </div>
        `}async _createPreviewCardInTab(e,t){var o;const i=(o=this.shadowRoot)==null?void 0:o.getElementById(e);if(!i){m.trace("[MSDStudio] Preview container not found:",e);return}i.innerHTML="";try{const s=t.type,r=Jt(s);m.trace("[MSDStudio] Creating preview card in tab:",{cardType:s,normalizedType:r});let a=null;if(customElements.get(r))a=document.createElement(r),m.trace("[MSDStudio] Preview card created via createElement:",r);else if(i.innerHTML='<div style="padding: 20px; text-align: center; color: var(--secondary-text-color);">Loading card...</div>',await new Promise(l=>setTimeout(l,500)),customElements.get(r))a=document.createElement(r);else throw new Error(`Card type "${s}" not registered`);if(!a)throw new Error(`Failed to create card element for type: ${s}`);if(this.hass&&(a.hass=this.hass),typeof a.setConfig=="function")a.setConfig(t),m.trace("[MSDStudio] Preview card config set successfully");else{m.warn("[MSDStudio] Preview card has no setConfig method:",r),i.innerHTML='<div style="padding: 20px; text-align: center; color: var(--warning-color);">Card does not support configuration</div>';return}a.style.width="100%",a.style.display="block",i.innerHTML="",i.appendChild(a),m.trace("[MSDStudio] Preview card mounted successfully in tab")}catch(s){m.error("[MSDStudio] Failed to create preview card in tab:",s),i.innerHTML=`<div style="padding: 20px; text-align: center; color: var(--error-color);">
                <ha-icon icon="mdi:alert-circle" style="--mdc-icon-size: 32px; display: block; margin: 0 auto 8px;"></ha-icon>
                <strong>Preview Error</strong><br/>
                <span style="font-size: 12px;">${s.message}</span>
            </div>`}}_getAvailableCardTypes(){const e=[],t=[{type:"entities",name:"Entities",icon:"mdi:format-list-bulleted"},{type:"button",name:"Button",icon:"mdi:gesture-tap-button"},{type:"entity",name:"Entity",icon:"mdi:card-bulleted"},{type:"glance",name:"Glance",icon:"mdi:view-dashboard"},{type:"light",name:"Light",icon:"mdi:lightbulb"},{type:"thermostat",name:"Thermostat",icon:"mdi:thermostat"},{type:"sensor",name:"Sensor",icon:"mdi:eye"},{type:"gauge",name:"Gauge",icon:"mdi:gauge"},{type:"markdown",name:"Markdown",icon:"mdi:language-markdown"},{type:"media-control",name:"Media Control",icon:"mdi:play-circle"},{type:"weather-forecast",name:"Weather",icon:"mdi:weather-partly-cloudy"},{type:"history-graph",name:"History Graph",icon:"mdi:chart-line"},{type:"statistics-graph",name:"Statistics Graph",icon:"mdi:chart-box"},{type:"picture",name:"Picture",icon:"mdi:image"},{type:"picture-entity",name:"Picture Entity",icon:"mdi:image-frame"},{type:"picture-glance",name:"Picture Glance",icon:"mdi:view-carousel"},{type:"grid",name:"Grid",icon:"mdi:grid"},{type:"horizontal-stack",name:"Horizontal Stack",icon:"mdi:view-column"},{type:"vertical-stack",name:"Vertical Stack",icon:"mdi:view-sequential"},{type:"conditional",name:"Conditional",icon:"mdi:eye-check"},{type:"iframe",name:"iFrame",icon:"mdi:application-brackets"},{type:"map",name:"Map",icon:"mdi:map"},{type:"logbook",name:"Logbook",icon:"mdi:format-list-text"},{type:"humidifier",name:"Humidifier",icon:"mdi:air-humidifier"},{type:"alarm-panel",name:"Alarm Panel",icon:"mdi:shield-home"},{type:"area",name:"Area",icon:"mdi:texture-box"},{type:"tile",name:"Tile",icon:"mdi:view-dashboard-variant"},{type:"manual",name:"Manual (YAML)",icon:"mdi:code-braces"}];return e.push(...t),window.customCards&&window.customCards.filter(i=>{var o;return!((o=i.type)!=null&&o.startsWith("custom:lcards-"))}).forEach(i=>{e.push({type:i.type,name:i.name||i.type,icon:"mdi:puzzle"})}),e}_selectCardType(e){if(m.debug("[MSDStudio] Card type selected:",e),e==="manual"){this._controlFormCard={type:""},this._cardConfigMode="yaml",this.requestUpdate();return}const t=this._normalizeCardTypeForConfig(e),i=this._getCardStubConfig(t);this._controlFormCard=i,this._previousCardConfig=null,this.requestUpdate()}_cancelCardTypeChange(){this._previousCardConfig&&(m.debug("[MSDStudio] Restoring previous card config:",this._previousCardConfig),this._controlFormCard={...this._previousCardConfig},this._previousCardConfig=null,this.requestUpdate())}_normalizeCardTypeForConfig(e){return e==="manual"||e.startsWith("custom:")?e:e.includes("-")&&!Xi(e)?`custom:${e}`:e}_getCardStubConfig(e){var t;try{const i=e.startsWith("custom:")?e.substring(7):`hui-${e}-card`,o=(t=window.customElements)==null?void 0:t.get(i);if(o&&typeof o.getStubConfig=="function")return o.getStubConfig()}catch{}return{type:e}}_handleCardPicked(e){var o,s;if(e.stopPropagation(),m.debug("[MSDStudio] Card picked from hui-card-picker:",e.detail),!((s=(o=e.detail)==null?void 0:o.config)!=null&&s.type)){m.warn("[MSDStudio] Invalid card picked:",e.detail);return}const t=e.detail.config,i=this._getEnhancedStubConfig(t);this._controlFormCard=i,this._previousCardConfig=null,m.debug("[MSDStudio] Card set to:",this._controlFormCard),this.requestUpdate()}async _requestCardFromPicker(e="control"){return new Promise((t,i)=>{const o=++this._cardPickerRequestId;this._pendingCardPickerRequests.set(o,{resolve:t,reject:i,context:e}),m.debug("[MSDStudio] Requesting card picker:",{requestId:o,context:e});const s=new CustomEvent("open-card-picker",{bubbles:true,composed:true,detail:{requestId:o,context:e}});this.dispatchEvent(s),setTimeout(()=>{this._pendingCardPickerRequests.has(o)&&(this._pendingCardPickerRequests.delete(o),i(new Error("Card picker request timed out")))},6e4)})}_handleCardPickerResult(e){const{requestId:t,context:i,config:o}=e.detail;m.debug("[MSDStudio] Card picker result received:",{requestId:t,context:i,type:o==null?void 0:o.type});const s=this._pendingCardPickerRequests.get(t);if(s){this._pendingCardPickerRequests.delete(t);const r=this._getEnhancedStubConfig(o);s.resolve(r)}else m.warn("[MSDStudio] Received result for unknown requestId:",t)}_getEnhancedStubConfig(e){try{const t=e.type,i=t.startsWith("custom:")?t.substring(7):`hui-${t}-card`,o=customElements.get(i);if(o&&typeof o.getStubConfig=="function"){const s=o.getStubConfig();return m.debug("[MSDStudio] Using card stub config from:",i,s),{...s,...e}}}catch(t){m.warn("[MSDStudio] Failed to get stub config:",t)}return e}_resetCardPicker(){this._controlFormCard={type:""},this.requestUpdate()}_getCardTypeName(e){return e?e.replace(/^custom:/,""):"Unknown"}_getCardIcon(e){if(!e)return"mdi:card-outline";const t={button:"mdi:gesture-tap-button",entities:"mdi:format-list-bulleted",entity:"mdi:card-bulleted",glance:"mdi:view-dashboard",light:"mdi:lightbulb",thermostat:"mdi:thermostat","media-control":"mdi:play-circle","weather-forecast":"mdi:weather-partly-cloudy",sensor:"mdi:eye",gauge:"mdi:gauge","history-graph":"mdi:chart-line",markdown:"mdi:language-markdown",picture:"mdi:image","picture-entity":"mdi:image-frame","picture-glance":"mdi:view-carousel",conditional:"mdi:eye-check",map:"mdi:map","custom:lcards-button":"mdi:gesture-tap-button","custom:lcards-gauge":"mdi:gauge","custom:lcards-slider":"mdi:tune","custom:lcards-label":"mdi:label","custom:lcards-chart":"mdi:chart-line"},i=e.replace(/^custom:/,"");return t[e]||t[i]||"mdi:puzzle"}_getRealLovelace(){try{let e=document.querySelector("home-assistant");if(e=e&&e.shadowRoot,e=e&&e.querySelector("home-assistant-main"),e=e&&e.shadowRoot,e=e&&e.querySelector("app-drawer-layout partial-panel-resolver, ha-drawer partial-panel-resolver"),e=e&&e.shadowRoot||e,e=e&&e.querySelector("ha-panel-lovelace"),e=e&&e.shadowRoot,e=e&&e.querySelector("hui-root"),e&&e.lovelace)return e.lovelace}catch(e){m.warn("[MSDStudio] Failed to get real Lovelace:",e)}return null}_getLovelace(){var i,o,s,r,a;if((o=(i=this.hass)==null?void 0:i.connection)!=null&&o.lovelace)return m.debug("[MSDStudio] Got Lovelace from hass.connection"),this.hass.connection.lovelace;const e=document.querySelector("home-assistant");if(e){const l=(a=(r=(s=e.shadowRoot)==null?void 0:s.querySelector("home-assistant-main"))==null?void 0:r.shadowRoot)==null?void 0:a.querySelector("ha-panel-lovelace");if(l!=null&&l.lovelace)return m.debug("[MSDStudio] Got Lovelace from ha-panel-lovelace"),l.lovelace;if(e.lovelace)return m.debug("[MSDStudio] Got Lovelace from home-assistant element"),e.lovelace}if(window.lovelace)return m.warn("[MSDStudio] Using deprecated window.lovelace"),window.lovelace;const t=this._getRealLovelace();return t?(m.debug("[MSDStudio] Got Lovelace from _getRealLovelace()"),t):(m.error("[MSDStudio] Could not access Lovelace instance"),null)}_openCardEditorModal(){this._cardEditorTempConfig=JSON.parse(JSON.stringify(this._controlFormCard)),this._showCardEditorForm=true,m.debug("[MSDStudio] Opening card editor form with config:",this._cardEditorTempConfig),this.requestUpdate()}_closeCardEditorForm(){this._showCardEditorForm=false,this._cardEditorTempConfig=null,this.requestUpdate()}_saveCardEditorForm(){var t;let e=this._cardEditorTempConfig;(!e||!e.type)&&(m.error("[MSDStudio] Invalid card config from card editor form - missing type:",e),(t=this._controlFormCard)!=null&&t.type&&(e={...e,type:this._controlFormCard.type})),this._controlFormCard=JSON.parse(JSON.stringify(e)),m.debug("[MSDStudio] Card config saved:",this._controlFormCard),this._closeCardEditorForm()}_handleCardEditorConfigChanged(e){var i,o;const t=((i=e.detail)==null?void 0:i.config)??((o=e.detail)==null?void 0:o.value);t&&typeof t=="object"&&!Array.isArray(t)&&t.type?(this._cardEditorTempConfig=t,m.trace("[MSDStudio] Card editor form config updated:",t),this.requestUpdate()):m.warn("[MSDStudio] Ignoring invalid card config from editor:",t)}_renderCardEditorFormDialog(){const e=this._getLovelace();return v`
            <ha-dialog
                class="subform-dialog"
                open
                @closed=${t=>{t.stopPropagation(),this._closeCardEditorForm()}}
                .headerTitle=${"Edit Card Configuration"}
                prevent-scrim-close>

                <div class="subform-layout">
                    <div class="subform-config">
                        <div class="subform-tab-content">
                            <hui-card-element-editor
                                .hass=${this.hass}
                                .lovelace=${e}
                                .value=${this._cardEditorTempConfig}
                                @config-changed=${this._handleCardEditorConfigChanged}
                                @value-changed=${this._handleCardEditorConfigChanged}>
                            </hui-card-element-editor>
                        </div>
                    </div>

                    <div class="subform-preview sticky">
                        <div class="subform-preview-label">Live Preview</div>
                        ${this._renderCardEditorPreview()}
                    </div>
                </div>

                <div slot="footer">
                    <ha-button @click=${this._closeCardEditorForm} appearance="plain">
                        <ha-icon icon="mdi:close" slot="start"></ha-icon>
                        Cancel
                    </ha-button>
                    <ha-button @click=${this._saveCardEditorForm}>
                        <ha-icon icon="mdi:content-save" slot="start"></ha-icon>
                        Save
                    </ha-button>
                </div>
            </ha-dialog>
        `}_renderCardEditorPreview(){var e;return(e=this._cardEditorTempConfig)!=null&&e.type?customElements.get("hui-card")?v`
            <div class="card-editor-preview-surface">
                <hui-card
                    .hass=${this.hass}
                    .config=${this._cardEditorTempConfig}
                    .preview=${true}>
                </hui-card>
            </div>
        `:v`<lcards-message type="warning">Live preview unavailable in this context.</lcards-message>`:v`<lcards-message type="info">Select a card type to see a preview.</lcards-message>`}_debugHAComponents(){var o,s,r;const e=customElements.get("hui-card-picker"),t=customElements.get("hui-card-element-editor"),i=this._getLovelace();m.debug("[MSDStudio] HA Component State:",{haComponentsAvailable:this._haComponentsAvailable,HuiCardPicker:!!e,HuiCardElementEditor:!!t,lovelace:!!i,lovelaceConfig:i!=null&&i.config?"present":"missing",lovelaceResources:((s=(o=i==null?void 0:i.config)==null?void 0:o.resources)==null?void 0:s.length)||0,hass:!!this.hass,hassStates:Object.keys(((r=this.hass)==null?void 0:r.states)||{}).length}),i||(m.error("[MSDStudio] Lovelace not accessible - tried:"),m.error("  - hass.connection.lovelace"),m.error("  - ha-panel-lovelace.lovelace"),m.error("  - home-assistant.lovelace"),m.error("  - window.lovelace"),m.error("  - _getRealLovelace()"))}_renderControlPreview(){var r;const e=this._controlFormPosition,t=this._controlFormSize,i=this._controlFormAttachment,o=((r=this._controlFormCard)==null?void 0:r.type)||"none",s=typeof e=="string"?`Anchor: ${e}`:`Coords: [${e[0]}, ${e[1]}]`;return v`
            <div style="background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 8px; padding: 16px;">
                <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">Control Preview</h3>

                <!-- Preview Info -->
                <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; font-size: 13px;">
                        <strong>Card Type:</strong>
                        <span style="color: var(--primary-color);">${o}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 13px;">
                        <strong>Position:</strong>
                        <span>${s}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 13px;">
                        <strong>Size:</strong>
                        <span>${t[0]}px × ${t[1]}px</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 13px;">
                        <strong>Attachment:</strong>
                        <span>${i}</span>
                    </div>
                </div>

                <!-- Card Preview -->
                ${o!=="none"?v`
                    <div style="padding: var(--ha-space-4); background: var(--card-background-color); border-radius: var(--ha-border-radius-md); border: var(--ha-border-width-sm) solid var(--divider-color);">
                        <div style="font-size: 12px; font-weight: 500; margin-bottom: var(--ha-space-3); color: var(--secondary-text-color);">Card Preview</div>
                        <div class="card-editor-preview-surface" style="display: flex; justify-content: center; align-items: center; min-height: ${t[1]+20}px;">
                            <div style="width: ${t[0]}px; height: ${t[1]}px; overflow: hidden; box-shadow: var(--ha-box-shadow-s);">
                                ${this._renderControlCardPreview()}
                            </div>
                        </div>
                    </div>
                `:v`
                    <div style="padding: 20px; text-align: center; color: var(--secondary-text-color);">
                        <ha-icon icon="mdi:card-outline" style="font-size: 48px; opacity: 0.3;"></ha-icon>
                        <div style="margin-top: 8px;">Select a card type to preview</div>
                    </div>
                `}
            </div>
        `}_renderControlCardPreview(){const e={...this._controlFormCard};if(!e.type)return v`<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--secondary-text-color); font-size: 12px;">No card type selected</div>`;const t="control-card-preview-container",i=JSON.stringify(e);return this._lastPreviewConfigKey!==i&&(this._lastPreviewConfigKey=i,requestAnimationFrame(()=>{this._createPreviewCard(t,e)})),v`
            <div id="${t}" style="width: 100%; height: 100%;"></div>
        `}async _createPreviewCard(e,t){var o;const i=(o=this.shadowRoot)==null?void 0:o.getElementById(e);if(!i){m.warn("[MSD Studio] Preview container not found:",e);return}i.innerHTML="";try{const s=t.type,r=Jt(s);m.debug("[MSD Studio] Creating preview card:",{cardType:s,normalizedType:r});let a=null;if(window.customElements&&window.customElements.get(r)){const l=window.customElements.get(r);a=new l,m.debug("[MSD Studio] Card created via customElements.get:",r)}else a=document.createElement(r),m.debug("[MSD Studio] Card created via createElement:",r),await new Promise(l=>setTimeout(l,100));if(!a)throw new Error(`Failed to create card element for type: ${s}`);if(this.hass&&(a.hass=this.hass),typeof a.setConfig=="function")a.setConfig(t),m.debug("[MSD Studio] Card config set successfully");else{m.warn("[MSD Studio] Card element has no setConfig method:",r),i.innerHTML='<div style="padding: 8px; color: var(--error-color); font-size: 11px;">Card does not support configuration</div>';return}a.style.width="100%",a.style.height="100%",a.style.display="block",i.appendChild(a),m.debug("[MSD Studio] Card preview mounted successfully")}catch(s){m.error("[MSD Studio] Failed to create card preview:",s),i.innerHTML=`<div style="padding: 8px; color: var(--error-color); font-size: 11px;">Error: ${s.message}</div>`}}_renderLinesTab(){const e=this._getLineOverlays(),t=e.length;return v`
            <div style="padding: 8px;">
                <!-- Line Actions & Visualization Helpers -->
                <div style="display: flex; gap: 8px; margin-bottom: 16px; align-items: center;">
                    <ha-button @click=${this._openLineForm}>
                        <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                        Add Line
                    </ha-button>
                    <ha-button @click=${async i=>{i.stopPropagation(),await this._setMode("connect_line")}}
                               ?disabled=${this._activeMode===N.CONNECT_LINE}>
                        <ha-icon icon="mdi:vector-line" slot="start"></ha-icon>
                        Enter Connect Mode
                    </ha-button>
                    ${this._selectedLineIds.size>=2?v`
                        <ha-button @click=${()=>this._openBulkStyleForm("line")}>
                            <ha-icon icon="mdi:pencil-box-multiple-outline" slot="start"></ha-icon>
                            Bulk Edit Style (${this._selectedLineIds.size})
                        </ha-button>
                    `:""}

                    <!-- Right-aligned visualization helpers -->
                    <div style="flex: 1;"></div>
                    <ha-icon-button
                        class="${this._showRoutingPaths?"active":""}"
                        @click=${()=>{this._showRoutingPaths=!this._showRoutingPaths,this.requestUpdate()}}
                        .label=${"Routing Paths"}>
                        <ha-icon icon="mdi:vector-line"></ha-icon>
                    </ha-icon-button>
                    <ha-icon-button
                        class="${this._showRoutingChannels?"active":""}"
                        @click=${()=>{this._showRoutingChannels=!this._showRoutingChannels,this.requestUpdate()}}
                        .label=${"Routing Channels"}>
                        <ha-icon icon="mdi:chart-timeline-variant"></ha-icon>
                    </ha-icon-button>
                </div>

                <!-- Lines Management -->
                <lcards-form-section
                    header="Line Overlays"
                    description="Connect controls and anchors with lines"
                    icon="mdi:vector-line"
                    ?expanded=${true}>

                    ${t===0?v`
                        <lcards-message type="info">
                            <strong>No line overlays defined yet.</strong>
                            <p style="margin: 8px 0; font-size: 13px;">
                                Line overlays connect anchors and controls on your MSD canvas.
                                Click "Add Line" to create your first connection.
                            </p>
                        </lcards-message>
                    `:v`
                        <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px; color: var(--secondary-text-color); cursor: pointer;">
                            <ha-checkbox
                                .checked=${t>0&&this._selectedLineIds.size===t}
                                @change=${()=>this._toggleSelectAllLines()}>
                            </ha-checkbox>
                            Select All
                        </label>
                        <div class="line-list">
                            ${e.map(i=>this._renderLineItem(i))}
                        </div>
                    `}
                </lcards-form-section>

                ${this._renderLineHelp()}
            </div>
        `}_getLineOverlays(){var t;return(((t=this._workingConfig.msd)==null?void 0:t.overlays)||[]).filter(i=>i.type==="line")}_toggleLineSelection(e){const t=new Set(this._selectedLineIds);t.has(e.id)?t.delete(e.id):t.add(e.id),this._selectedLineIds=t}_toggleSelectAllLines(){const e=this._getLineOverlays();e.length>0&&this._selectedLineIds.size===e.length?this._selectedLineIds=new Set:this._selectedLineIds=new Set(e.map(t=>t.id))}_renderShapesTab(){var i;const e=this._getShapeOverlays(),t=e.length;return v`
            <div style="padding: 8px;">
                <div style="display: flex; gap: 8px; margin-bottom: 16px; align-items: center;">
                    <ha-button @click=${()=>this._openShapeForm()}>
                        <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                        Add Shape
                    </ha-button>
                    <ha-button @click=${()=>this._openShieldBubblePanel()} ?disabled=${!this._hasBaseSvgContent()}>
                        <ha-icon icon="mdi:shield-outline" slot="start"></ha-icon>
                        Suggest Shield Bubble
                    </ha-button>
                    ${this._selectedShapeIds.size>=2?v`
                        <ha-button @click=${()=>this._openBulkStyleForm("shape")}>
                            <ha-icon icon="mdi:pencil-box-multiple-outline" slot="start"></ha-icon>
                            Bulk Edit Style (${this._selectedShapeIds.size})
                        </ha-button>
                    `:""}

                    <!-- Right-aligned visualization helpers -->
                    <div style="flex: 1;"></div>
                    <ha-icon-button
                        class="${this._showBoundingBoxes?"active":""}"
                        @click=${()=>{this._showBoundingBoxes=!this._showBoundingBoxes,this.requestUpdate()}}
                        .label=${"Bounding Boxes"}>
                        <ha-icon icon="mdi:border-outside"></ha-icon>
                    </ha-icon-button>
                    <ha-icon-button
                        class="${this._showAttachmentPoints?"active":""}"
                        @click=${()=>{this._showAttachmentPoints=!this._showAttachmentPoints,this.requestUpdate()}}
                        .label=${"Attachment Points"}>
                        <ha-icon icon="mdi:target-variant"></ha-icon>
                    </ha-icon-button>
                </div>

                ${(i=this._shieldBubbleState)!=null&&i.active?this._renderShieldBubblePanel():""}

                <lcards-form-section
                    header="Shape Overlays"
                    description="Freeform decorative/structural geometry: polylines, rectangles, circles. Draw directly on the canvas with the toolbar buttons, or add one here."
                    icon="mdi:shape"
                    ?expanded=${true}>

                    ${t===0?v`
                        <lcards-message type="info">
                            <strong>No shape overlays defined yet.</strong>
                            <p style="margin: 8px 0; font-size: 13px;">
                                Use the Draw Polyline/Rectangle/Circle buttons on the canvas
                                toolbar, or click "Add Shape" to create one manually.
                            </p>
                        </lcards-message>
                    `:v`
                        <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px; color: var(--secondary-text-color); cursor: pointer;">
                            <ha-checkbox
                                .checked=${t>0&&this._selectedShapeIds.size===t}
                                @change=${()=>this._toggleSelectAllShapes()}>
                            </ha-checkbox>
                            Select All
                        </label>
                        <div class="line-list">
                            ${e.map(o=>this._renderShapeItem(o))}
                        </div>
                    `}
                </lcards-form-section>

                ${this._renderShapeHelp()}
            </div>
        `}_renderShapeHelp(){return v`
            ${fe({header:"About shape overlays",body:v`
                    <ul>
                        <li>Shapes draw free geometry on the MSD: polylines (walls, connectors), rectangles and circles (rooms, zones).</li>
                        <li>Draw them with the Polyline, Rectangle and Circle buttons on the canvas toolbar.</li>
                        <li>Select a shape to drag its points or resize handles on the canvas.</li>
                        <li>They style like lines: dashed or gradient strokes, state-based fill, animations and rules.</li>
                        <li>Lines can attach to a shape's corners or vertices, as they do to controls.</li>
                    </ul>
                `})}
        `}_hasBaseSvgContent(){var t,i;const e=(i=(t=this._workingConfig.msd)==null?void 0:t.base_svg)==null?void 0:i.source;return!!e&&e!=="none"}_defaultShieldBubbleState(){return{active:false,loading:false,dilateRadius:18,simplifyTolerance:4,roundness:0,mode:"single",sectionCount:4,startAngleDeg:0,rawPoints:null,rawW:0,rawH:0,rawViewBox:null,points:null,error:null}}async _openShieldBubblePanel(){this._shieldBubbleState={...this._shieldBubbleState,active:true,error:null},await this._regenerateShieldBubblePreview()}_recomputeShieldBubblePoints(){var s;const e=this._shieldBubbleState;if(!((s=e.rawPoints)!=null&&s.length))return;const t=me.simplifyClosedPolyline(e.rawPoints,e.simplifyTolerance),i=me.blendTowardEllipse(t,e.roundness),o=me.mapRasterPointsToViewBox(i,e.rawViewBox,e.rawW,e.rawH);this._shieldBubbleState={...this._shieldBubbleState,points:o}}async _regenerateShieldBubblePreview(){var t,i;const e=(i=(t=this._workingConfig.msd)==null?void 0:t.base_svg)==null?void 0:i.source;if(!(!e||e==="none")){if(this._shieldBubbleState.loading){this._shieldBubblePendingRegenerate=true;return}this._shieldBubbleState={...this._shieldBubbleState,loading:true,error:null},this.requestUpdate(),await new Promise(o=>setTimeout(o,0));try{const{getSvgContent:o,getSvgViewBox:s}=await import("./lcards-main-OH3P_lk4.js").then(p=>p.bC),r=o(e);if(!r)throw new Error("Base SVG not yet loaded");const a=s(r),{points:l,W:c,H:d,viewBox:h}=await me.analyzeShieldBubbleRaw(r,a,{dilateRadius:this._shieldBubbleState.dilateRadius});this._shieldBubbleState={...this._shieldBubbleState,rawPoints:l,rawW:c,rawH:d,rawViewBox:h,loading:false},this._recomputeShieldBubblePoints()}catch(o){m.error("[MSDStudio] Shield-bubble generation failed:",o),this._shieldBubbleState={...this._shieldBubbleState,loading:false,error:o.message,points:null,rawPoints:null}}this.requestUpdate(),this._shieldBubblePendingRegenerate&&(this._shieldBubblePendingRegenerate=false,await this._regenerateShieldBubblePreview())}}_cancelShieldBubble(){this._shieldBubbleState={...this._shieldBubbleState,active:false,points:null,error:null,rawPoints:null,rawW:0,rawH:0,rawViewBox:null}}_shieldSectionNames(e){return e===4?["shield_fore","shield_starboard","shield_aft","shield_port"]:Array.from({length:e},(t,i)=>`shield_section_${i+1}`)}_generateUniqueOverlayId(e){var o;const t=((o=this._workingConfig.msd)==null?void 0:o.overlays)||[];if(!t.find(s=>s.id===e))return e;let i=2;for(;t.find(s=>s.id===`${e}_${i}`);)i++;return`${e}_${i}`}_acceptShieldBubble(){var r,a;const e=this._shieldBubbleState;if(!((r=e==null?void 0:e.points)!=null&&r.length))return;const t=((a=this._workingConfig.msd)==null?void 0:a.overlays)||[],i=[],o={color:{default:"var(--lcars-orange)"},width:2,opacity:.9,fill:{default:"none"},fill_opacity:1},s=u(()=>({...o,color:{...o.color},fill:{...o.fill}}),"cloneStyle");if(e.mode==="single")i.push({type:"shape",kind:"polyline",id:this._generateUniqueOverlayId("shield_bubble"),points:e.points,closed:true,style:s()});else{const l=me.splitBoundaryIntoSections(e.points,e.sectionCount,{startAngleDeg:e.startAngleDeg}),c=this._shieldSectionNames(e.sectionCount);l.forEach((d,h)=>{i.push({type:"shape",kind:"polyline",id:this._generateUniqueOverlayId(c[h]),points:d,closed:false,style:s()})})}this._setNestedValue("msd.overlays",[...t,...i]),this._shieldBubbleState=this._defaultShieldBubbleState()}_renderShieldBubblePanel(){var i,o,s;const e=this._shieldBubbleState,t=e.mode==="sections"&&((i=e.points)!=null&&i.length)?me.splitBoundaryIntoSections(e.points,e.sectionCount,{startAngleDeg:e.startAngleDeg}):null;return v`
            <lcards-form-section
                header="Suggest Shield Bubble"
                description="Generate a shield-bubble outline (or angular sections) from the base SVG's own silhouette. Adjust settings, then click Preview. Nothing is saved to config until you Accept."
                icon="mdi:shield-outline"
                ?expanded=${true}
                style="margin-bottom: 16px;">

                <div class="subform-field-stack">
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{select:{options:[{value:"single",label:"Single shape"},{value:"sections",label:"N sections"}]}}}
                        .value=${e.mode}
                        .label=${"Mode"}
                        @value-changed=${r=>{this._shieldBubbleState={...this._shieldBubbleState,mode:r.detail.value},this.requestUpdate()}}>
                    </ha-selector>

                    ${e.mode==="sections"?v`
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{number:{mode:"box",min:2,max:16,step:1}}}
                            .value=${e.sectionCount}
                            .label=${"Section count"}
                            @value-changed=${r=>{this._shieldBubbleState={...this._shieldBubbleState,sectionCount:Number(r.detail.value)},this.requestUpdate()}}>
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{number:{mode:"box",min:-180,max:180,step:1}}}
                            .value=${e.startAngleDeg}
                            .label=${"Section start angle (° from bow, clockwise)"}
                            @value-changed=${r=>{this._shieldBubbleState={...this._shieldBubbleState,startAngleDeg:Number(r.detail.value)},this.requestUpdate()}}>
                        </ha-selector>
                    `:""}

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{number:{mode:"box",min:0,max:100,step:1}}}
                        .value=${e.dilateRadius}
                        .label=${"Dilate radius (px offset from hull)"}
                        @value-changed=${r=>{this._shieldBubbleState={...this._shieldBubbleState,dilateRadius:Number(r.detail.value)},this.requestUpdate()}}>
                    </ha-selector>

                    <div class="subform-field-stack" style="gap: var(--ha-space-1);">
                        <label style="font-size: 14px; color: var(--primary-text-color);">
                            Simplify tolerance: ${e.simplifyTolerance} (higher = fewer points)
                        </label>
                        <input
                            type="range"
                            min="0" max="20" step="0.5"
                            .value=${String(e.simplifyTolerance)}
                            style="width: 100%;"
                            @input=${r=>{this._shieldBubbleState={...this._shieldBubbleState,simplifyTolerance:parseFloat(r.target.value)},this._recomputeShieldBubblePoints(),this.requestUpdate()}}>
                    </div>

                    <div class="subform-field-stack" style="gap: var(--ha-space-1);">
                        <label style="font-size: 14px; color: var(--primary-text-color);">
                            Roundness: ${Math.round(e.roundness*100)}% (blend toward best-fit ellipse)
                        </label>
                        <input
                            type="range"
                            min="0" max="1" step="0.01"
                            .value=${String(e.roundness)}
                            style="width: 100%;"
                            @input=${r=>{this._shieldBubbleState={...this._shieldBubbleState,roundness:parseFloat(r.target.value)},this._recomputeShieldBubblePoints(),this.requestUpdate()}}>
                    </div>

                    <div style="font-size: 12px; color: var(--secondary-text-color); font-family: monospace;">
                        ${((o=e.points)==null?void 0:o.length)||0} points
                        ${t?v`
                            <br>${this._shieldSectionNames(e.sectionCount).map((r,a)=>{var l;return`${r}: ${((l=t[a])==null?void 0:l.length)||0} pts`}).join(" · ")}
                        `:""}
                    </div>

                    ${this._renderShieldBubbleGuide()}

                    ${e.error?v`<lcards-message type="error">${e.error}</lcards-message>`:""}

                    <div style="display: flex; gap: 8px; margin-top: 8px;">
                        <ha-button @click=${()=>this._regenerateShieldBubblePreview()} ?disabled=${e.loading}>
                            ${e.loading?v`
                                <ha-spinner size="small" slot="start"></ha-spinner>
                                Generating…
                            `:v`
                                <ha-icon icon="mdi:refresh" slot="start"></ha-icon>
                                Preview
                            `}
                        </ha-button>
                        <ha-button @click=${()=>this._acceptShieldBubble()} ?disabled=${!((s=e.points)!=null&&s.length)||e.loading}>
                            <ha-icon icon="mdi:check" slot="start"></ha-icon>
                            Accept
                        </ha-button>
                        <ha-button @click=${()=>this._cancelShieldBubble()}>
                            Cancel
                        </ha-button>
                    </div>
                </div>
            </lcards-form-section>
        `}_renderRoutingCheatSheet(){return fe({header:"Quick Tips: common routing goals",icon:"mdi:lightbulb-outline",id:"msd-routing-tips",body:v`
                        <ul>
                            <li><strong>Bundle two or more lines to run together:</strong> point them at the same channel and leave "Discoverable by nearby lines" on: no need to list it in every line's <code>route_channels</code>.</li>
                            <li><strong>A channel must always be used, no matter the cost:</strong> set its mode to <code>force</code>.</li>
                            <li><strong>A channel is just a suggestion, only worth it if it's actually shorter/cleaner:</strong> set its mode to <code>prefer</code>. It's compared against the plain route and only wins on real cost.</li>
                            <li><strong>Keep lines away from a region entirely:</strong> set its mode to <code>avoid</code>.</li>
                            <li><strong>Chaining two or more channels on one line</strong> (<code>route_channels: [a, b, ...]</code>): pick any order. The router figures out which one to visit first based on geometry, not the order you checked them in.</li>
                            <li><strong>Force a straight run north/south instead of east/west (or vice versa):</strong> set the channel's Flow Direction explicitly to <code>vertical</code>/<code>horizontal</code> instead of <code>auto</code>.</li>
                            <li><strong>A bundled corridor's lead-in run is longer than it looks like it needs to be:</strong> lower that line's <code>corner_radius</code>. It drives both the lane-separation reservation before a bundled line's first turn and (in <code>forced</code> mode) the mandatory cardinal stub. <code>min_stub_length_factor</code> (Common Routing Options) only affects the small safety floor underneath that, not the <code>corner_radius</code>-driven part.</li>
                            <li><strong>Lines splitting onto their own lanes get a tight/squashed corner right where they separate:</strong> increase Lane Spacing (per-channel, or <code>trunk_line_spacing</code> card-wide) instead of raising <code>corner_radius</code>. Those specific corners are capped by lane spacing, not by <code>corner_radius</code>.</li>
                            <li><strong>A corner elsewhere in the route (a tight detour, not a lane split) looks squashed:</strong> check Corner Room Weight (Common Routing Options, on by default). It's the general-purpose mechanism for recovering a tight detour's corner toward its full configured radius.</li>
                            <li><strong>A specific line's corner must render at its exact configured size everywhere, no matter what else is nearby:</strong> set that line's <code>corner_radius_mode</code> to <code>forced</code>. This accepts the tradeoff of removing its lead-in from crossing-avoidance consideration entirely, which can force otherwise-avoidable detours or line crossings near tight geometry.</li>
                        </ul>
                        <p>
                            For the full mental model (a decision-flow diagram of how routing modes interact), see the
                            <a href="${oo}" target="_blank" rel="noopener">Routing Concepts</a> guide.
                        </p>
            `})}_renderShieldBubbleGuide(){return v`
            ${fe({header:"How shield bubble generation works",icon:"mdi:information-outline",body:v`
                        <p><strong>Dilate radius</strong> offsets the traced boundary outward from the ship's own silhouette by this many pixels before tracing. This is the expensive step - it only re-runs when you click Preview.</p>
                        <p><strong>Simplify tolerance</strong> reduces the point count by dropping points that don't meaningfully change the outline's shape (corner-preserving simplification) - higher values mean fewer points but a coarser silhouette. Updates live as you drag.</p>
                        <p><strong>Roundness</strong> blends the traced outline toward a smooth best-fit oval, from 0% (exact traced shape) to 100% (pure ellipse) - useful for a cleaner, more stylized shield-bubble look instead of a literal hull outline. Updates live as you drag.</p>
                        <lcards-shield-bubble-diagram></lcards-shield-bubble-diagram>
                    `})}
        `}_renderShieldBubblePreview(){var s;const e=this._shieldBubbleState;if(!(e!=null&&e.active)||!((s=e.points)!=null&&s.length))return"";const t=this._getViewBoxToPixelConverter();if(!t)return"";const i=u((r,a)=>r.map(c=>t(c[0],c[1])).map((c,d)=>`${d===0?"M":"L"} ${c[0]} ${c[1]}`).join(" ")+(a?" Z":""),"toPath");let o;if(e.mode==="single")o=`<path d="${i(e.points,true)}" fill="rgba(255,159,10,0.15)" stroke="#FF9F0A" stroke-width="2" stroke-dasharray="6,4" />`;else{const r=me.splitBoundaryIntoSections(e.points,e.sectionCount,{startAngleDeg:e.startAngleDeg}),a=["#FF9F0A","#0AFFEF","#FF0A8C","#8CFF0A","#0A8CFF","#FF0A0A","#FFF00A","#B00AFF"];o=r.map((l,c)=>`<path d="${i(l,false)}" fill="none" stroke="${a[c%a.length]}" stroke-width="3" stroke-dasharray="6,4" />`).join("")}return v`
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 1000;">
                <svg style="width: 100%; height: 100%; position: absolute;">
                    ${we(o)}
                </svg>
            </div>
        `}_getShapeOverlays(){var t;return(((t=this._workingConfig.msd)==null?void 0:t.overlays)||[]).filter(i=>i.type==="shape")}_toggleShapeSelection(e){const t=new Set(this._selectedShapeIds);t.has(e.id)?t.delete(e.id):t.add(e.id),this._selectedShapeIds=t}_toggleSelectAllShapes(){const e=this._getShapeOverlays();e.length>0&&this._selectedShapeIds.size===e.length?this._selectedShapeIds=new Set:this._selectedShapeIds=new Set(e.map(t=>t.id))}_openBulkStyleForm(e){var s;const t=e==="shape"?[...this._selectedShapeIds]:[...this._selectedLineIds];if(t.length<2)return;const o=(((s=this._workingConfig.msd)==null?void 0:s.overlays)||[]).find(r=>r.id===t[0]);o&&(this._bulkEditKind=e,this._bulkEditTargetIds=t,e==="shape"?(this._editShape(o),this._editingShapeId=null,this._shapeFormActiveSubtab="style",this._bulkEditSnapshot=JSON.parse(JSON.stringify(this._shapeFormData))):(this._editLine(o),this._editingLineId=null,this._lineFormActiveSubtab="style",this._bulkEditSnapshot=JSON.parse(JSON.stringify(this._lineFormData))),this.requestUpdate())}_diffStyleFields(e,t){const i={};for(const a of new Set([...Object.keys(e),...Object.keys(t)]))a!=="style"&&JSON.stringify(e[a])!==JSON.stringify(t[a])&&(i[a]=e[a]);const o=e.style||{},s=t.style||{},r={};for(const a of new Set([...Object.keys(o),...Object.keys(s)]))JSON.stringify(o[a])!==JSON.stringify(s[a])&&(r[a]=o[a]);return Object.keys(r).length>0&&(i.style=r),i}_applyTouchedFields(e,t){const i={...e};for(const[o,s]of Object.entries(t))o!=="style"&&(s===void 0?delete i[o]:i[o]=s);if(t.style){const o={...i.style||{}};for(const[s,r]of Object.entries(t.style))r===void 0?delete o[s]:o[s]=r;Object.keys(o).length>0?i.style=o:delete i.style}return i}_renderShapeItem(e){var c;const t=e.id||"unnamed",i=e.kind||"polyline",o=(c=e.style)==null?void 0:c.color,s=typeof o=="object"&&o!==null?o.default||Object.values(o)[0]||"var(--lcars-orange)":o||"var(--lcars-orange)",r=i==="rect"?"mdi:rectangle-outline":i==="circle"?"mdi:circle-outline":"mdi:vector-polyline",a=i==="polyline"?`${(e.points||[]).length} points${e.closed?" (closed)":""}`:`${(e.size||[0,0]).join("×")}`,l=e.locked===true;return v`
            <div class="list-item-card ${l?"locked":""}">
                <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                    <!-- Bulk-select checkbox, for Bulk Edit Style -->
                    <ha-checkbox
                        .checked=${this._selectedShapeIds.has(e.id)}
                        @change=${d=>{d.stopPropagation(),this._toggleShapeSelection(e)}}
                        style="flex-shrink: 0;">
                    </ha-checkbox>

                    <!-- Shape Preview -->
                    <div style="
                        width: 40px;
                        height: 40px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border: 1px solid var(--divider-color);
                        border-radius: 4px;
                        background: var(--card-background-color);
                        flex-shrink: 0;
                    ">
                        <ha-icon icon="${r}" style="color: ${s};"></ha-icon>
                    </div>

                    <!-- Shape Info -->
                    <div style="flex: 1; min-width: 140px;">
                        <div style="font-weight: 600; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            ${t}
                            <span style="
                                font-size: 10px;
                                padding: 2px 6px;
                                background: var(--primary-color);
                                color: var(--text-primary-color);
                                border-radius: 3px;
                                font-weight: 500;
                            ">${i}</span>
                            ${l?v`<ha-icon icon="mdi:lock" style="--mdc-icon-size: 16px; color: var(--secondary-text-color);" title="Locked"></ha-icon>`:""}
                        </div>
                        <div style="font-size: 12px; color: var(--secondary-text-color); font-family: monospace;">
                            ${a}
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div style="display: flex; gap: 8px; flex-shrink: 0; margin-left: auto;">
                        <ha-icon-button
                            @click=${()=>this._toggleOverlayLocked(e)}
                            .label=${l?"Unlock":"Lock"}>
                            <ha-icon icon="mdi:${l?"lock":"lock-open-variant"}"></ha-icon>
                        </ha-icon-button>
                        <ha-icon-button
                            @click=${()=>this._editShape(e)}
                            .label=${"Edit"}
                            .path=${"M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"}>
                        </ha-icon-button>
                        <ha-icon-button
                            @click=${()=>this._duplicateShape(e)}
                            .label=${"Duplicate"}
                            .path=${"M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"}>
                        </ha-icon-button>
                        <ha-icon-button
                            @click=${()=>this._deleteShape(e)}
                            .label=${"Delete"}
                            .path=${"M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"}>
                        </ha-icon-button>
                    </div>
                </div>
            </div>
        `}_generateShapeId(){var o;const e=((o=this._workingConfig.msd)==null?void 0:o.overlays)||[];let t=e.filter(s=>s.type==="shape").length+1,i=`shape_${t}`;for(;e.find(s=>s.id===i);)t++,i=`shape_${t}`;return i}_openShapeForm(e="rect",t={}){this._editingShapeId=null,this._shapeFormData={id:this._generateShapeId(),kind:e,position:t.position||[100,100],size:t.size||[100,60],points:t.points||(e==="polyline"?[[100,100],[200,100]]:[]),closed:false,entity:"",state_attribute:"",ranges_attribute:"",z_index:null,locked:false,corner_style:"round",corner_radius:e==="rect"?8:34,corner_angle:45,smoothing_mode:"none",smoothing_iterations:0,animations:[],style:{color:{default:"var(--lcars-orange)"},width:2,opacity:1,dash_array:"",fill:{default:"none"},fill_opacity:1,line_cap:"butt",line_join:"",miter_limit:4,marker_end:null,marker_start:null}},this._shapeFormActiveSubtab="geometry",this._showShapeForm=true,this.requestUpdate()}_editShape(e){var r,a,l,c,d,h,p,g,_,f,y;this._editingShapeId=e.id;const t=(r=e.style)==null?void 0:r.color,i=typeof t=="object"&&t!==null?t:{default:t||"var(--lcars-orange)"},o=(a=e.style)==null?void 0:a.fill,s=typeof o=="object"&&o!==null?o:{default:o||"none"};this._shapeFormData={id:e.id,kind:e.kind||"polyline",position:e.position||[100,100],size:e.size||[100,60],points:e.points||[],closed:e.closed===true,entity:e.entity||"",state_attribute:e.state_attribute||"",ranges_attribute:e.ranges_attribute||"",z_index:e.z_index??null,locked:e.locked===true,corner_style:e.corner_style||"round",corner_radius:e.corner_radius??(e.kind==="rect"?8:34),corner_angle:e.corner_angle??45,smoothing_mode:e.smoothing_mode||"none",smoothing_iterations:e.smoothing_iterations||0,animations:e.animations||[],style:{color:i,width:((l=e.style)==null?void 0:l.width)||2,opacity:((c=e.style)==null?void 0:c.opacity)??1,dash_array:((d=e.style)==null?void 0:d.dash_array)||"",fill:s,fill_opacity:((h=e.style)==null?void 0:h.fill_opacity)??1,line_cap:((p=e.style)==null?void 0:p.line_cap)||"butt",line_join:((g=e.style)==null?void 0:g.line_join)||"",miter_limit:((_=e.style)==null?void 0:_.miter_limit)??4,marker_end:((f=e.style)==null?void 0:f.marker_end)||null,marker_start:((y=e.style)==null?void 0:y.marker_start)||null}},this._shapeFormActiveSubtab="geometry",this._showShapeForm=true,this.requestUpdate()}_duplicateShape(e){var s;const t=((s=this._workingConfig.msd)==null?void 0:s.overlays)||[],i=this._generateShapeId(),o={...JSON.parse(JSON.stringify(e)),id:i};this._setNestedValue("msd.overlays",[...t,o]),this._editShape(o)}async _deleteShape(e){var o;if(!await this._showConfirmDialog("Delete Shape",`Delete shape "${e.id}"?`))return;const t=((o=this._workingConfig.msd)==null?void 0:o.overlays)||[],i=t.findIndex(s=>s.id===e.id);i>=0&&(t.splice(i,1),m.debug("[MSDStudio] Deleted shape:",e.id),this.requestUpdate(),this._schedulePreviewUpdate())}_buildShapeStyleFields(e){const t=e.kind,i={};e.corner_style&&e.corner_style!=="round"?i.corner_style=e.corner_style:e.corner_style==="round"&&e.corner_radius>0&&(i.corner_style="round"),e.corner_radius!=null&&e.corner_radius!==0&&(i.corner_radius=e.corner_radius),t==="polyline"&&(e.corner_style==="bevel"&&e.corner_angle!=null&&e.corner_angle!==45&&(i.corner_angle=e.corner_angle),e.smoothing_mode&&e.smoothing_mode!=="none"&&(i.smoothing_mode=e.smoothing_mode),e.smoothing_iterations!=null&&e.smoothing_iterations!==0&&(i.smoothing_iterations=e.smoothing_iterations));const o={},s=e.style||{};if(s.color!=null){const r=s.color,a=typeof r=="object"&&r!==null?Object.keys(r):null;o.color=a&&a.length===1&&a[0]==="default"?r.default:r}if(s.width!=null&&(o.width=s.width),s.opacity!=null&&s.opacity!==1&&(o.opacity=s.opacity),s.dash_array&&(o.dash_array=s.dash_array),s.fill!=null){const r=s.fill,a=typeof r=="object"&&r!==null?Object.keys(r):null,l=a&&a.length===1&&a[0]==="default"?r.default:r;l!=="none"&&(o.fill=l)}return s.fill_opacity!=null&&s.fill_opacity!==1&&(o.fill_opacity=s.fill_opacity),t==="polyline"&&(s.line_cap&&s.line_cap!=="butt"&&(o.line_cap=s.line_cap),s.line_join&&(o.line_join=s.line_join),s.miter_limit!=null&&s.miter_limit!==4&&(o.miter_limit=s.miter_limit),s.marker_end&&(o.marker_end=s.marker_end),s.marker_start&&(o.marker_start=s.marker_start)),Object.keys(o).length>0&&(i.style=o),i}_saveShape(e=false){if(!this._shapeFormData.id){m.warn("[MSDStudio] Cannot save shape without ID");return}const t=this._shapeFormData.kind,i={type:"shape",id:this._shapeFormData.id,kind:t};t==="polyline"?(i.points=this._shapeFormData.points||[],this._shapeFormData.closed&&(i.closed=true)):(i.position=this._shapeFormData.position||[0,0],i.size=this._shapeFormData.size||[100,60]),this._shapeFormData.z_index!=null&&(i.z_index=this._shapeFormData.z_index),this._shapeFormData.locked&&(i.locked=true),this._shapeFormData.entity&&(i.entity=this._shapeFormData.entity),this._shapeFormData.state_attribute&&(i.state_attribute=this._shapeFormData.state_attribute),this._shapeFormData.ranges_attribute&&(i.ranges_attribute=this._shapeFormData.ranges_attribute),this._shapeFormData.animations&&this._shapeFormData.animations.length>0&&(i.animations=this._shapeFormData.animations),Object.assign(i,this._buildShapeStyleFields(this._shapeFormData)),this._workingConfig.msd||(this._workingConfig.msd={}),this._workingConfig.msd.overlays||(this._workingConfig.msd.overlays=[]);const o=this._editingShapeId?this._workingConfig.msd.overlays.findIndex(s=>s.id===this._editingShapeId):-1;o>=0?(this._workingConfig.msd.overlays[o]._editorSelected&&(i._editorSelected=true),this._workingConfig.msd.overlays[o]=i,m.debug("[MSDStudio] Updated shape:",this._shapeFormData.id)):(this._workingConfig.msd.overlays.push(i),m.debug("[MSDStudio] Added shape:",this._shapeFormData.id)),e||this._closeShapeForm(),this._schedulePreviewUpdate()}_saveBulkShapeStyle(){var o;const e=this._bulkEditTargetIds||[];if(e.length===0){this._closeShapeForm();return}const t=this._diffStyleFields(this._buildShapeStyleFields(this._shapeFormData),this._buildShapeStyleFields(this._bulkEditSnapshot));for(const s of["entity","state_attribute","ranges_attribute"])this._shapeFormData[s]!==this._bulkEditSnapshot[s]&&(t[s]=this._shapeFormData[s]||void 0);if(Object.keys(t).length===0){this._selectedShapeIds=new Set,this._closeShapeForm();return}const i=((o=this._workingConfig.msd)==null?void 0:o.overlays)||[];for(const s of e){const r=i.findIndex(a=>a.id===s);r<0||(i[r]=this._applyTouchedFields(i[r],t))}m.debug("[MSDStudio] Bulk-applied shape style to",e.length,"shapes:",Object.keys(t)),this._selectedShapeIds=new Set,this._closeShapeForm(),this._schedulePreviewUpdate()}_closeShapeForm(){this._showShapeForm=false,this._editingShapeId=null,this._bulkEditKind=null,this._bulkEditTargetIds=null,this._bulkEditSnapshot=null,this.requestUpdate()}_renderLineItem(e){var d,h,p;const t=e.id||"unnamed",i=this._formatConnectionPoint(e.source||e.anchor),o=this._formatConnectionPoint(e.target||e.attach_to),s=e.route||"auto",r=(d=e.style)==null?void 0:d.color,a=typeof r=="object"&&r!==null?r.default||r.active||Object.values(r)[0]||"#FF9900":r||"#FF9900",l=((h=e.style)==null?void 0:h.width)||2;let c=s;if(s==="auto"){const g=this._getControlOverlays().some(f=>f.obstacle===true);e.route_channels&&e.route_channels.length>0||g?c="auto → smart":c="auto → manhattan"}return v`
            <div class="list-item-card">
                <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                    <!-- Bulk-select checkbox, for Bulk Edit Style -->
                    <ha-checkbox
                        .checked=${this._selectedLineIds.has(e.id)}
                        @change=${g=>{g.stopPropagation(),this._toggleLineSelection(e)}}
                        style="flex-shrink: 0;">
                    </ha-checkbox>

                    <!-- Line Style Preview -->
                    <div style="
                        width: 40px;
                        height: 40px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border: 1px solid var(--divider-color);
                        border-radius: 4px;
                        background: var(--card-background-color);
                        flex-shrink: 0;
                    ">
                        <svg width="30" height="20" style="overflow: visible;">
                            <line
                                x1="0" y1="10"
                            x2="30" y2="10"
                            stroke="${a}"
                            stroke-width="${l}"
                            stroke-dasharray="${((p=e.style)==null?void 0:p.dash_array)||""}">
                        </line>
                    </svg>
                </div>

                <!-- Line Info -->
                <div style="flex: 1; min-width: 140px;">
                    <div style="font-weight: 600; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        ${t}
                        <span style="
                            font-size: 10px;
                            padding: 2px 6px;
                            background: var(--primary-color);
                            color: var(--text-primary-color);
                            border-radius: 3px;
                            font-weight: 500;
                        ">${c}</span>
                    </div>
                    <div style="font-size: 12px; color: var(--secondary-text-color); font-family: monospace; word-break: break-word;">
                        ${i} → ${o}
                    </div>
                </div>

                <!-- Action Buttons -->
                <div style="display: flex; gap: 8px; flex-shrink: 0; margin-left: auto;">
                    <ha-icon-button
                        @click=${()=>this._editLine(e)}
                        .label=${"Edit"}
                        .path=${"M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"}>
                    </ha-icon-button>
                    <ha-icon-button
                        @click=${()=>this._duplicateLine(e)}
                        .label=${"Duplicate"}
                        .path=${"M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"}>
                    </ha-icon-button>
                    <ha-icon-button
                        @click=${()=>this._highlightLineInPreview(e)}
                        .label=${"Highlight"}
                        .path=${"M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9M12,4.5C17,4.5 21.27,7.61 23,12C21.27,16.39 17,19.5 12,19.5C7,19.5 2.73,16.39 1,12C2.73,7.61 7,4.5 12,4.5M3.18,12C4.83,15.36 8.24,17.5 12,17.5C15.76,17.5 19.17,15.36 20.82,12C19.17,8.64 15.76,6.5 12,6.5C8.24,6.5 4.83,8.64 3.18,12Z"}>
                    </ha-icon-button>
                    <ha-icon-button
                        @click=${()=>this._deleteLine(e)}
                        .label=${"Delete"}
                        .path=${"M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"}>
                    </ha-icon-button>
                </div>
            </div>
            </div>
        `}_formatConnectionPoint(e){if(!e)return"not set";if(typeof e=="string")return e;if(e.type==="anchor")return`anchor:${e.id}`;if(e.type==="control"){const t=e.point?`@${e.point}`:"";return`control:${e.id}${t}`}return e.type==="coords"&&Array.isArray(e.position)?`[${e.position[0]}, ${e.position[1]}]`:"unknown"}_renderLineHelp(){return v`
            ${fe({header:"About line overlays",body:v`
                    <ul>
                        <li>Lines connect anchors and controls to show relationships or data flow.</li>
                        <li>"Enter Connect Mode" lets you click a source, then a target, to draw one.</li>
                        <li>Routing modes: direct (straight), manhattan (right angles), bezier (curved) and more.</li>
                        <li>Style: colour, width, dash pattern, markers and animations.</li>
                    </ul>
                `})}
        `}_renderRoutingTab(){var o,s,r,a;const e=((o=this._workingConfig.msd)==null?void 0:o.routing)||{},t=((s=this._workingConfig.msd)==null?void 0:s.channels)||{},i=Object.keys(t).length;return v`
            <div style="padding: 8px;">
                <!-- Channel Actions & Visualization Helpers -->
                <div style="display: flex; gap: 8px; margin-bottom: 16px; align-items: center;">
                    <ha-button @click=${this._openChannelForm}>
                        <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                        Add Channel
                    </ha-button>
                    <ha-button @click=${async l=>{l.stopPropagation(),await this._setMode("draw_channel")}}
                               ?disabled=${this._activeMode===N.DRAW_CHANNEL}>
                        <ha-icon icon="mdi:vector-rectangle" slot="start"></ha-icon>
                        Draw on Canvas
                    </ha-button>

                    <!-- Right-aligned visualization helpers -->
                    <div style="flex: 1;"></div>
                    <ha-icon-button
                        class="${this._showRoutingChannels?"active":""}"
                        @click=${()=>{this._showRoutingChannels=!this._showRoutingChannels,this.requestUpdate()}}
                        .label=${"Routing Channels"}>
                        <ha-icon icon="mdi:chart-timeline-variant"></ha-icon>
                    </ha-icon-button>
                </div>

                <!-- Routing Modes Reference -->
                <lcards-form-section
                    variant="guide"
                    header="Routing Modes Reference"
                    description="Quick reference for routing behavior"
                    icon="mdi:book-open-variant"
                    ?expanded=${false}
                    style="margin-bottom: 16px;">

                    <!-- Topic selector for reference display -->
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{select:{options:[{value:"auto",label:"Auto (Recommended)"},{value:"bundling",label:"Bundling (Trunk-and-Branch)"},{value:"crossing",label:"Crossing Avoidance"},{value:"direct",label:"Direct (Straight Line)"},{value:"manual",label:"Manual (Custom Waypoints)"}]}}}
                        .value=${this._routingModeReference||"auto"}
                        .label=${"Show Info For"}
                        @value-changed=${l=>{this._routingModeReference=l.detail.value,this.requestUpdate()}}
                        style="margin-bottom: 16px;">
                    </ha-selector>

                    <!-- Display routing info panel -->
                    ${this._renderRoutingModeInfoPanel(this._routingModeReference||"auto")}
                </lcards-form-section>

                ${this._renderRoutingCheatSheet()}

                <!-- Routing Channels -->
                <lcards-form-section
                    header="Routing Channels"
                    description="Define regions that influence line routing behavior"
                    icon="mdi:chart-timeline-variant"
                    ?expanded=${true}
                    style="margin-bottom: 16px;">

                    <!-- Channels List -->
                    ${i===0?v`
                        <lcards-message type="info">No routing channels yet.</lcards-message>
                        ${fe({header:"How routing channels work",body:v`
                                <p>Channels are rectangular corridors that guide line routing:</p>
                                <ul>
                                    <li><strong>Prefer</strong>: lines are rewarded for running through, and bundle into evenly spaced lanes.</li>
                                    <li><strong>Avoid</strong>: lines are penalised for entering.</li>
                                    <li><strong>Force</strong>: lines that reference the channel must route through it.</li>
                                </ul>
                                <p>Lines opt in with <code>route_channels: [channel_id]</code>. Lines routing nearby can also find
                                    and bundle with a channel on their own; turn off "Discoverable by nearby lines" to limit a
                                    channel to the lines that reference it.</p>
                            `})}
                    `:v`
                        <div class="channel-list">
                            ${Object.entries(t).map(([l,c])=>this._renderChannelItem(l,c))}
                        </div>
                    `}
                </lcards-form-section>

                <!-- Common Routing Options (general grid/A* tunables users adjust most) -->
                <lcards-form-section
                    header="Common Routing Options"
                    description="The big levers: how tightly lines can bend and detour, and how much they favor straight paths"
                    icon="mdi:routes"
                    ?expanded=${false}
                    style="margin-bottom: 16px;">

                    <lcards-message type="info" style="margin-bottom: 16px;">
                        Applies to <code>route: auto</code> (the default), <code>smart</code> and <code>grid</code> lines, not
                        manhattan, direct or manual. Separate from the canvas snap grid, which only affects editing here.
                    </lcards-message>

                    <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px;">
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{number:{min:5,mode:"box",unit_of_measurement:"vb"}}}
                            .value=${e.grid_resolution}
                            .label=${"Grid Resolution"}
                            @value-changed=${l=>this._updateRoutingConfig("grid_resolution",l.detail.value)}
                            helper="Pathfinding cell size. Left blank: auto-scales from your view_box size (~1/12th of the shorter dimension, clamped 16-64). Smaller = tighter turns/detours, more precise, slower; values ≤ 4 are coerced to 32.">
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{number:{min:0,step:.1,mode:"box"}}}
                            .value=${e.min_stub_length_factor}
                            .label=${"Min Stub Length Factor"}
                            @value-changed=${l=>this._updateRoutingConfig("min_stub_length_factor",l.detail.value)}
                            helper="Multiplier on Grid Resolution for the minimum mandatory lead-out/lead-in every line reserves before routing runs (default: 1, i.e. one grid cell). Lower it on a small view_box, where a flat minimum would otherwise force lines to travel disproportionately far before their first turn.">
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{number:{min:0,step:.5,mode:"box"}}}
                            .value=${e.turn_penalty}
                            .label=${"Turn Penalty"}
                            @value-changed=${l=>this._updateRoutingConfig("turn_penalty",l.detail.value)}
                            helper="Cost for direction changes (default: 2). Higher = straighter paths with fewer bends.">
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{number:{min:0,mode:"box",unit_of_measurement:"vb"}}}
                            .value=${e.clearance}
                            .label=${"Clearance"}
                            @value-changed=${l=>this._updateRoutingConfig("clearance",l.detail.value)}
                            helper="Min distance from obstacles (default: 0).">
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{number:{min:0,mode:"box"}}}
                            .value=${e.corner_room_weight}
                            .label=${"Corner Room Weight"}
                            @value-changed=${l=>this._updateRoutingConfig("corner_room_weight",l.detail.value)}
                            helper="How strongly a tight detour's corner tries to recover its full corner_radius (default: 4, on; set 0 to disable). Also settable per-line. See Pathfinding Refinement under Advanced Routing Configuration for the related Proximity Band option.">
                        </ha-selector>
                    </div>
                </lcards-form-section>

                <!-- Trace Bundling & Crossing Avoidance (common tunables) -->
                <lcards-form-section
                    header="Trace Bundling & Crossings"
                    description="Cable-raceway behavior: lines travel together and avoid cutting across each other"
                    icon="mdi:transit-connection-variant"
                    ?expanded=${false}
                    style="margin-bottom: 16px;">

                    <lcards-message type="info" style="margin-bottom: 16px;">
                        Tunables for the bundling and crossing avoidance every <code>route: auto</code> line gets. See Bundling
                        and Crossing Avoidance in the Routing Modes Reference above. YAML order never changes the result.
                    </lcards-message>

                    <ha-selector
                        style="display: block; margin-bottom: 12px;"
                        .hass=${this.hass}
                        .selector=${{boolean:{}}}
                        .value=${e.trunk_bundling_enabled!==false}
                        .label=${"Bundle parallel lines (trunk-and-branch)"}
                        @value-changed=${l=>this._updateRoutingConfig("trunk_bundling_enabled",l.detail.value?void 0:false)}>
                    </ha-selector>
                    <ha-selector
                        style="display: block; margin-bottom: 16px;"
                        .hass=${this.hass}
                        .selector=${{boolean:{}}}
                        .value=${e.crossing_avoid_enabled!==false}
                        .label=${"Avoid line crossings"}
                        @value-changed=${l=>this._updateRoutingConfig("crossing_avoid_enabled",l.detail.value?void 0:false)}>
                    </ha-selector>

                    <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px;">
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{number:{min:0,mode:"box",unit_of_measurement:"vb"}}}
                            .value=${e.trunk_line_spacing}
                            .label=${"Lane Spacing"}
                            @value-changed=${l=>this._updateRoutingConfig("trunk_line_spacing",l.detail.value)}
                            helper="Gap between bundled lines (default: 8). Also sets how rounded their lane-separation corners can get, independent of corner_radius: wider spacing allows a bigger achieved radius right where lines split onto their own lanes.">
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{number:{min:0,mode:"box",unit_of_measurement:"vb"}}}
                            .value=${e.trunk_proximity}
                            .label=${"Bundling Proximity"}
                            @value-changed=${l=>this._updateRoutingConfig("trunk_proximity",l.detail.value)}
                            helper="How close lines must run to bundle (default: 32)">
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{number:{min:0,step:.1,mode:"box"}}}
                            .value=${e.trunk_bundle_weight}
                            .label=${"Bundling Pull"}
                            @value-changed=${l=>this._updateRoutingConfig("trunk_bundle_weight",l.detail.value)}
                            helper="How strongly joining a bundle is rewarded (default: 0.5)">
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{number:{min:0,mode:"box"}}}
                            .value=${e.crossing_avoid_bias}
                            .label=${"Crossing Penalty"}
                            @value-changed=${l=>this._updateRoutingConfig("crossing_avoid_bias",l.detail.value)}
                            helper="Deterrent per crossing, not a hard block (default: 4; higher = longer detours accepted)">
                        </ha-selector>
                    </div>
                </lcards-form-section>

                <!-- Global Routing Defaults (Advanced) -->
                <lcards-form-section
                    header="Advanced Routing Configuration"
                    description="Deep router internals: rarely needed"
                    icon="mdi:tune"
                    ?expanded=${false}
                    style="margin-bottom: 16px;">

                    <!-- Help Text -->
                    <lcards-message type="info" style="margin-bottom: 16px;">
                        These affect every line that pathfinds (<code>route: auto</code>, <code>smart</code> or <code>grid</code>),
                        with or without obstacles and channels; manhattan, direct and manual lines never do.
                        <a href="https://lcards.unimatrix01.ca/cards/msd/routing.html" target="_blank" rel="noopener noreferrer">Routing documentation</a>
                    </lcards-message>

                    <!-- Parameter Explanations -->
                    ${fe({header:"Parameter guide",body:v`
                            <p><strong>Grid Resolution, Min Stub Length Factor, Corner Room Weight, Turn Penalty and Clearance</strong>
                                are common tunables: see Common Routing Options above. Corner Room Weight is one of the two main levers
                                for corner appearance (the other is each line's <code>corner_radius</code>).</p>
                            <p><strong>Path smoothing</strong></p>
                            <ul>
                                <li><strong>Chaikin smoothing</strong> rounds sharp corners by subdivision.</li>
                                <li><strong>Iterations</strong>: more is smoother but less grid-aligned.</li>
                                <li><strong>Max Points</strong> limits path complexity, for performance.</li>
                            </ul>
                            <p><strong>Pathfinding refinement</strong> (runs when Proximity Band here or Corner Room Weight above is above 0)</p>
                            <ul>
                                <li><strong>Proximity Band</strong>: extra distance from obstacles (0 turns this trigger off).</li>
                                <li><strong>Detour Span</strong>: how far ahead it looks for better paths.</li>
                                <li><strong>Max Extra Bends</strong>: extra turns allowed for a better path.</li>
                                <li><strong>Max Detours</strong>: alternate routes considered per segment.</li>
                            </ul>
                            <p><strong>Channel routing</strong></p>
                            <ul>
                                <li><strong>Force Penalty</strong>: the cost of not using a forced channel.</li>
                                <li><strong>Avoid Multiplier</strong>: how strongly "avoid" channels repel.</li>
                                <li><strong>Prefer / Avoid Bias</strong>: per-cell discount or penalty inside those channels.</li>
                            </ul>
                            <p><strong>Bundling and crossing internals</strong></p>
                            <ul>
                                <li><strong>Min Trunk Length / Overlap</strong>: how long a straight run must be to bundle with, and how much shared travel makes joining worth it.</li>
                                <li><strong>Max Join Candidates</strong>: nearby trunks one line considers chaining through.</li>
                                <li><strong>Discovery Passes</strong>: a cap on pre-render routing passes (order independence).</li>
                                <li><strong>Min Crossing Length</strong>: the shortest segment other lines still avoid crossing.</li>
                            </ul>
                            <p><strong>Cost function weights</strong></p>
                            <ul>
                                <li><strong>Bend / Proximity Cost</strong>: per-bend and per-obstacle-proximity costs.</li>
                                <li><strong>Hint Penalty</strong>: the cost of a first or last move against <code>route_hint</code> (soft: obstacles still win).</li>
                            </ul>
                        `})}

                    <!-- Path Smoothing -->
                    <div style="margin-bottom: 16px;">
                        <div style="font-weight: 500; margin-bottom: 8px;">Path Smoothing</div>
                        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px;">
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select:{options:[{value:"none",label:"None"},{value:"chaikin",label:"Chaikin"}]}}}
                                .value=${e.smoothing_mode??"none"}
                                .label=${"Smoothing Mode"}
                                @value-changed=${l=>this._updateRoutingConfig("smoothing_mode",l.detail.value)}>
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number:{min:1,max:5,mode:"box"}}}
                                .value=${e.smoothing_iterations}
                                .label=${"Iterations"}
                                @value-changed=${l=>this._updateRoutingConfig("smoothing_iterations",l.detail.value)}
                                helper="1-5 (default: 1)">
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number:{min:1,mode:"box"}}}
                                .value=${e.smoothing_max_points}
                                .label=${"Max Points"}
                                @value-changed=${l=>this._updateRoutingConfig("smoothing_max_points",l.detail.value)}
                                helper="Default: 160">
                            </ha-selector>
                        </div>
                    </div>

                    <!-- Smart Routing (renamed) -->
                    <div style="margin-bottom: 16px;">
                        <div style="font-weight: 500; margin-bottom: 8px;">
                            Pathfinding Refinement
                            <span style="font-weight: 400; font-size: 12px; color: var(--secondary-text-color); margin-left: 8px;">
                                (Runs whenever Proximity Band below is above 0, or Corner Room Weight (moved to Common Routing Options above, on by default) is above 0)
                            </span>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px;">
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number:{min:0,mode:"box",unit_of_measurement:"vb"}}}
                                .value=${e.smart_proximity}
                                .label=${"Proximity Band"}
                                @value-changed=${l=>this._updateRoutingConfig("smart_proximity",l.detail.value)}
                                helper="Extra obstacle avoidance distance (default: 0, off unless > 0)">
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number:{min:1,mode:"box",unit_of_measurement:"vb"}}}
                                .value=${e.smart_detour_span}
                                .label=${"Detour Span"}
                                @value-changed=${l=>this._updateRoutingConfig("smart_detour_span",l.detail.value)}
                                helper="Max elbow shift (default: 48)">
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number:{min:0,mode:"box"}}}
                                .value=${e.smart_max_extra_bends}
                                .label=${"Max Extra Bends"}
                                @value-changed=${l=>this._updateRoutingConfig("smart_max_extra_bends",l.detail.value)}
                                helper="Max added bends (default: 3)">
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number:{min:0,mode:"box",unit_of_measurement:"vb"}}}
                                .value=${e.smart_min_improvement}
                                .label=${"Min Improvement"}
                                @value-changed=${l=>this._updateRoutingConfig("smart_min_improvement",l.detail.value)}
                                helper="Min cost gain (default: 4)">
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number:{min:1,mode:"box"}}}
                                .value=${e.smart_max_detours_per_elbow}
                                .label=${"Max Detours Per Elbow"}
                                @value-changed=${l=>this._updateRoutingConfig("smart_max_detours_per_elbow",l.detail.value)}
                                helper="Default: 4">
                            </ha-selector>
                        </div>
                    </div>

                    <!-- Channel Configuration -->
                    <div style="margin-bottom: 16px;">
                        <div style="font-weight: 500; margin-bottom: 8px;">
                            Channel Routing
                            <span style="font-weight: 400; font-size: 12px; color: var(--secondary-text-color); margin-left: 8px;">
                                (Only when route_channels defined)
                            </span>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px;">
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number:{min:0,mode:"box"}}}
                                .value=${e.channel_force_penalty}
                                .label=${"Force Penalty"}
                                @value-changed=${l=>this._updateRoutingConfig("channel_force_penalty",l.detail.value)}
                                helper="Penalty for exiting forced channels (default: 800)">
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number:{min:0,step:.1,mode:"box"}}}
                                .value=${e.channel_avoid_multiplier}
                                .label=${"Avoid Multiplier"}
                                @value-changed=${l=>this._updateRoutingConfig("channel_avoid_multiplier",l.detail.value)}
                                helper="Avoid channel strength (default: 1.0)">
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number:{min:0,step:.1,mode:"box"}}}
                                .value=${e.channel_prefer_bias}
                                .label=${"Prefer Bias"}
                                @value-changed=${l=>this._updateRoutingConfig("channel_prefer_bias",l.detail.value)}
                                helper="Per-cell discount in prefer channels (default: 0.9)">
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number:{min:0,step:.5,mode:"box"}}}
                                .value=${e.channel_avoid_bias}
                                .label=${"Avoid Bias"}
                                @value-changed=${l=>this._updateRoutingConfig("channel_avoid_bias",l.detail.value)}
                                helper="Per-cell penalty in avoid channels (default: 3)">
                            </ha-selector>
                        </div>
                    </div>

                    <!-- Bundling & Crossing Internals -->
                    <div style="margin-bottom: 16px;">
                        <div style="font-weight: 500; margin-bottom: 8px;">
                            Bundling &amp; Crossing Internals
                            <span style="font-weight: 400; font-size: 12px; color: var(--secondary-text-color); margin-left: 8px;">
                                (Common tunables are in the Trace Bundling &amp; Crossings section above)
                            </span>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px;">
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number:{min:0,mode:"box",unit_of_measurement:"vb"}}}
                                .value=${e.trunk_min_length}
                                .label=${"Min Trunk Length"}
                                @value-changed=${l=>this._updateRoutingConfig("trunk_min_length",l.detail.value)}
                                helper="Straight run needed to become a joinable trunk (default: 60)">
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number:{min:0,mode:"box",unit_of_measurement:"vb"}}}
                                .value=${e.trunk_min_overlap}
                                .label=${"Min Overlap"}
                                @value-changed=${l=>this._updateRoutingConfig("trunk_min_overlap",l.detail.value)}
                                helper="Shared travel needed for joining to be worthwhile (default: 60)">
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number:{min:1,mode:"box"}}}
                                .value=${e.trunk_max_join_candidates}
                                .label=${"Max Join Candidates"}
                                @value-changed=${l=>this._updateRoutingConfig("trunk_max_join_candidates",l.detail.value)}
                                helper="Trunks one line will consider chaining through (default: 2)">
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number:{min:1,mode:"box"}}}
                                .value=${e.trunk_discovery_max_passes}
                                .label=${"Discovery Passes"}
                                @value-changed=${l=>this._updateRoutingConfig("trunk_discovery_max_passes",l.detail.value)}
                                helper="Pre-render routing pass cap (default: 4)">
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number:{min:0,mode:"box",unit_of_measurement:"vb"}}}
                                .value=${e.crossing_min_length}
                                .label=${"Min Crossing Length"}
                                @value-changed=${l=>this._updateRoutingConfig("crossing_min_length",l.detail.value)}
                                helper="Shortest segment others still avoid crossing (default: 12)">
                            </ha-selector>
                        </div>
                    </div>

                    <!-- Cost Function Weights -->
                    <div>
                        <div style="font-weight: 500; margin-bottom: 8px;">Cost Function Weights</div>
                        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px;">
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number:{min:0,mode:"box"}}}
                                .value=${(r=e.cost_defaults)==null?void 0:r.bend}
                                .label=${"Bend Cost"}
                                @value-changed=${l=>this._updateRoutingCostDefaults("bend",l.detail.value)}
                                helper="Cost per bend (default: 10)">
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number:{min:0,mode:"box"}}}
                                .value=${(a=e.cost_defaults)==null?void 0:a.proximity}
                                .label=${"Proximity Cost"}
                                @value-changed=${l=>this._updateRoutingCostDefaults("proximity",l.detail.value)}
                                helper="Cost for obstacle proximity (default: 4)">
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number:{min:0,step:.5,mode:"box"}}}
                                .value=${e.route_hint_penalty}
                                .label=${"Hint Penalty"}
                                @value-changed=${l=>this._updateRoutingConfig("route_hint_penalty",l.detail.value)}
                                helper="Cost for ignoring route_hint (default: 6)">
                            </ha-selector>
                        </div>
                    </div>
                </lcards-form-section>
        `}_renderRoutingModeInfoPanel(e){const t=this._getRoutingModeInfo(e);return v`
            <div class="routing-info-panel">
                <div class="routing-info-header">
                    <ha-icon icon="${t.icon}"></ha-icon>
                    <span>${t.title}</span>
                </div>
                <div class="routing-info-description">
                    ${t.description}
                </div>
                <div class="routing-info-diagram">
                    ${t.diagram}
                </div>
            </div>
        `}_renderChannelItem(e,t){const i={bundling:"#00FF00",avoiding:"#FF0000",waypoint:"#0000FF"},o={bundling:"Bundling",avoiding:"Avoiding",waypoint:"Waypoint"},[s,r,a,l]=t.bounds||[0,0,0,0],c=u(w=>{const x=Math.round(w*10)/10;return x%1===0?x.toFixed(0):x.toFixed(1)},"fmt"),d=`[${c(s)}, ${c(r)}] ${c(a)}×${c(l)}`,h={prefer:{label:"Prefer",color:"#4CAF50"},avoid:{label:"Avoid",color:"#F44336"},force:{label:"Force",color:"#FF9800"}},p={auto:{label:"Auto",icon:"↔"},horizontal:{label:"Horizontal",icon:"→"},vertical:{label:"Vertical",icon:"↓"}},g=t.mode||"prefer",_=t.direction||"auto",f=h[g]||h.prefer,y=p[_]||p.auto;return v`
            <div class="channel-item" style="
                display: flex;
                align-items: center;
                gap: 12px;
                flex-wrap: wrap;
                padding: 12px;
                border: 2px solid ${i[t.type]||"#888"};
                border-radius: 4px;
                margin-bottom: 8px;
                background: ${i[t.type]}22;
            ">
                <!-- Type Indicator -->
                <div style="
                    width: 40px;
                    height: 40px;
                    background: ${i[t.type]||"#888"};
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #000;
                    font-weight: bold;
                    font-size: 10px;
                    text-align: center;
                    line-height: 1.2;
                    flex-shrink: 0;
                ">
                    ${o[t.type]}
                </div>

                <!-- Channel Info -->
                <div style="flex: 1; min-width: 140px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; flex-wrap: wrap;">
                        <div style="font-weight: 600;">${e}</div>
                        <!-- Mode Badge -->
                        <span style="
                            display: inline-flex;
                            align-items: center;
                            padding: 2px 8px;
                            border-radius: 12px;
                            background: ${f.color};
                            color: white;
                            font-size: 10px;
                            font-weight: 600;
                            white-space: nowrap;
                        ">${f.label}</span>
                        <!-- Direction Badge -->
                        <span style="
                            display: inline-flex;
                            align-items: center;
                            padding: 2px 8px;
                            border-radius: 12px;
                            background: var(--secondary-text-color);
                            color: var(--primary-background-color);
                            font-size: 10px;
                            font-weight: 600;
                            white-space: nowrap;
                        ">${y.icon} ${y.label}</span>
                        <!-- Discoverable Badge — only shown when explicitly scoped off,
                             matching the boolean field's own "off = exception" framing
                             (default true stays quiet, same as the other badges only
                             ever showing the channel's actual configured value). -->
                        ${t.discoverable===false?v`
                            <span
                                title="Only lines that explicitly list this channel in route_channels can use it"
                                style="
                                    display: inline-flex;
                                    align-items: center;
                                    padding: 2px 8px;
                                    border-radius: 12px;
                                    background: var(--secondary-text-color);
                                    color: var(--primary-background-color);
                                    font-size: 10px;
                                    font-weight: 600;
                                    white-space: nowrap;
                                ">Scoped</span>
                        `:""}
                    </div>
                    <div style="font-size: 12px; color: var(--secondary-text-color); font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${d}
                    </div>
                </div>

                <!-- Actions -->
                <div style="display: flex; gap: 8px; flex-shrink: 0;">
                    <ha-icon-button
                        @click=${()=>this._editChannel(e,t)}
                        .label=${"Edit"}
                        .path=${"M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"}>
                    </ha-icon-button>
                    <ha-icon-button
                        @click=${()=>this._highlightChannelInPreview(e)}
                        .label=${"Highlight"}
                        .path=${"M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9M12,4.5C17,4.5 21.27,7.61 23,12C21.27,16.39 17,19.5 12,19.5C7,19.5 2.73,16.39 1,12C2.73,7.61 7,4.5 12,4.5M3.18,12C4.83,15.36 8.24,17.5 12,17.5C15.76,17.5 19.17,15.36 20.82,12C19.17,8.64 15.76,6.5 12,6.5C8.24,6.5 4.83,8.64 3.18,12Z"}>
                    </ha-icon-button>
                    <ha-icon-button
                        @click=${()=>this._deleteChannel(e)}
                        .label=${"Delete"}
                        .path=${"M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"}>
                    </ha-icon-button>
                </div>
            </div>
        `}_renderChannelFormDialog(){const e=this._editingChannelId==="",t=e?"":this._editingChannelId,i=this._channelFormData;return v`
            <ha-dialog
                open
                @closed=${o=>{o.stopPropagation(),this._closeChannelForm()}}
                .headerTitle=${e?"Add Routing Channel":`Edit Channel: ${t}`}
                style="--ha-dialog-width-md: 640px;">

                <div style="padding: 8px 16px;">
                    <ha-input
                        label="Channel ID"
                        .value=${i.id}
                        ?disabled=${!e}
                        @input=${o=>this._updateChannelFormField("id",o.target.value)}
                        placeholder="power_corridor"
                        hint=${e?"Unique identifier (e.g., power_corridor)":""}
                        style="width: 100%; margin-bottom: 16px;">
                    </ha-input>

                    <!-- Full width: the 4-input bounds row needs more room than a
                         two-column layout can spare without forcing it to scroll. -->
                    <lcards-form-section
                        header="Channel Bounds"
                        description="Rectangle this channel covers, in viewBox units (x, y, w, h)"
                        icon="mdi:vector-rectangle"
                        ?expanded=${true}
                        style="margin-bottom: 16px;">
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 16px;">
                            <ha-input
                                type="number"
                                .value=${String(i.bounds[0])}
                                @input=${o=>this._updateChannelBounds(0,Number(o.target.value))}
                                label="X">
                            </ha-input>
                            <ha-input
                                type="number"
                                .value=${String(i.bounds[1])}
                                @input=${o=>this._updateChannelBounds(1,Number(o.target.value))}
                                label="Y">
                            </ha-input>
                            <ha-input
                                type="number"
                                .value=${String(i.bounds[2])}
                                @input=${o=>this._updateChannelBounds(2,Number(o.target.value))}
                                label="W">
                            </ha-input>
                            <ha-input
                                type="number"
                                .value=${String(i.bounds[3])}
                                @input=${o=>this._updateChannelBounds(3,Number(o.target.value))}
                                label="H">
                            </ha-input>
                        </div>
                    </lcards-form-section>

                    <!-- Two-column layout for the remaining, single-field settings -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px 20px;">

                        <!-- Left Column -->
                        <div style="display: flex; flex-direction: column; gap: 16px;">
                            <ha-selector
                                .hass=${this.hass}
                                .label=${"Channel Mode"}
                                .helper=${"How lines interact with this channel"}
                                .selector=${{select:{options:[{value:"prefer",label:"Prefer (bundling)"},{value:"avoid",label:"Avoid (repel)"},{value:"force",label:"Force (mandatory)"}]}}}
                                .value=${i.mode}
                                @value-changed=${o=>this._updateChannelFormField("mode",o.detail.value)}>
                            </ha-selector>

                            <ha-selector
                                .hass=${this.hass}
                                .label=${"Flow Direction"}
                                .selector=${{select:{options:[{value:"auto",label:"Auto-detect"},{value:"horizontal",label:"Horizontal →"},{value:"vertical",label:"Vertical ↓"}]}}}
                                .value=${i.direction||"auto"}
                                @value-changed=${o=>this._updateChannelFormField("direction",o.detail.value)}>
                            </ha-selector>
                        </div>

                        <!-- Right Column -->
                        <div style="display: flex; flex-direction: column; gap: 16px;">
                            <ha-selector
                                .hass=${this.hass}
                                .label=${"Channel Weight (0-1)"}
                                .helper=${"Influence strength (higher = stronger)"}
                                .selector=${{number:{min:0,max:1,step:.1,mode:"slider"}}}
                                .value=${i.weight||.5}
                                @value-changed=${o=>this._updateChannelFormField("weight",o.detail.value)}>
                            </ha-selector>

                            <ha-selector
                                .hass=${this.hass}
                                .label=${"Line Spacing (vb units)"}
                                .helper=${"Gap between bundled lines (typical: 5-20). Also sets how rounded their lane-separation corners can get, independent of corner_radius."}
                                .selector=${{number:{min:0,max:100,step:1,mode:"slider"}}}
                                .value=${i.line_spacing??8}
                                @value-changed=${o=>this._updateChannelFormField("line_spacing",o.detail.value)}>
                            </ha-selector>
                        </div>
                    </div>

                    <ha-selector
                        style="margin-top: 16px; display: block;"
                        .hass=${this.hass}
                        .label=${"Discoverable by nearby lines"}
                        .helper=${"When off, only lines that explicitly list this channel in route_channels can ever use it. A nearby line that does NOT reference it will never spontaneously bundle into it, even if it routes close and parallel."}
                        .selector=${{boolean:{}}}
                        .value=${i.discoverable!==false}
                        @value-changed=${o=>this._updateChannelFormField("discoverable",o.detail.value)}>
                    </ha-selector>

                    <!-- Smart Routing Suggestions (full width if present) -->
                    ${i.suggestedLines&&i.suggestedLines.length>0?v`
                        <div class="channel-suggestion-panel" style="margin-top: 16px;">
                            <div class="channel-suggestion-header">
                                <ha-icon icon="mdi:auto-fix"></ha-icon>
                                <label class="channel-suggestion-title">Smart Routing Detected</label>
                            </div>
                            <div class="channel-suggestion-description">
                                ${i.suggestedLines.length} line(s) pass through this channel area.
                                Auto-configure them to route through this channel?
                            </div>
                            <div class="channel-suggestion-actions">
                                <ha-button
                                    primary
                                    @click=${()=>this._applyChannelToLines(i.id,i.suggestedLines,"prefer")}>
                                    <ha-icon icon="mdi:check-circle" slot="start"></ha-icon>
                                    Route Through (Prefer)
                                </ha-button>
                                <ha-button
                                    @click=${()=>this._applyChannelToLines(i.id,i.suggestedLines,"force")}>
                                    <ha-icon icon="mdi:lock" slot="start"></ha-icon>
                                    Force Through
                                </ha-button>
                                <ha-button
                                    @click=${()=>this._dismissChannelSuggestions()}>
                                    Skip
                                </ha-button>
                            </div>
                            <div class="channel-suggestion-affected-lines">
                                Affected lines: ${i.suggestedLines.join(", ")}
                            </div>
                        </div>
                    `:""}
                </div>

                <!-- Dialog Actions -->
                <div slot="footer">
                    <ha-button @click=${this._closeChannelForm} appearance="plain">
                        <ha-icon icon="mdi:close" slot="start"></ha-icon>
                        Cancel
                    </ha-button>
                    <ha-button @click=${this._saveChannel}>
                        <ha-icon icon="mdi:content-save" slot="start"></ha-icon>
                        ${e?"Add":"Save"}
                    </ha-button>
                </div>
            </ha-dialog>
        `}_openChannelForm(){this._editingChannelId="",this._channelFormData={id:"",mode:"prefer",direction:"auto",bounds:[0,0,100,50],weight:.5,line_spacing:8,discoverable:true},this.requestUpdate()}_editChannel(e,t){this._editingChannelId=e;let i=t.mode;!i&&t.type&&(i={bundling:"prefer",avoiding:"avoid",waypoint:"force"}[t.type]||"prefer"),this._channelFormData={id:e,mode:i||"prefer",direction:t.direction||"auto",bounds:[...t.bounds||[0,0,100,50]],weight:t.weight||.5,line_spacing:t.line_spacing??8,discoverable:t.discoverable!==false},this.requestUpdate()}_closeChannelForm(){this._editingChannelId=null,this.requestUpdate()}_updateChannelFormField(e,t){this._channelFormData[e]=t,this.requestUpdate()}_updateChannelBounds(e,t){this._channelFormData.bounds[e]=t,this.requestUpdate()}async _saveChannel(){const e=this._channelFormData.id;if(!e||e.trim()===""){await this._showDialog("Missing ID","Channel ID is required","error");return}this._workingConfig.msd||(this._workingConfig.msd={}),this._workingConfig.msd.channels||(this._workingConfig.msd.channels={}),this._workingConfig.msd.channels[e]={mode:this._channelFormData.mode||"prefer",direction:this._channelFormData.direction||"auto",bounds:this._channelFormData.bounds,weight:this._channelFormData.weight||.5,line_spacing:this._channelFormData.line_spacing??8,discoverable:this._channelFormData.discoverable!==false},this._setNestedValue("msd.channels",this._workingConfig.msd.channels),this._closeChannelForm(),this._schedulePreviewUpdate()}async _deleteChannel(e){var i;if(!await this._showConfirmDialog("Delete Channel",`Delete routing channel "${e}"?<br><br>Lines using this channel may be affected.`))return;const t={...((i=this._workingConfig.msd)==null?void 0:i.channels)||{}};delete t[e],this._setNestedValue("msd.channels",t),this._schedulePreviewUpdate()}_highlightChannelInPreview(e){this._highlightedChannel=e,this.requestUpdate(),setTimeout(()=>{this._highlightedChannel=null,this.requestUpdate()},2500)}_generateChannelId(){var o;const e=((o=this._workingConfig.msd)==null?void 0:o.channels)||{};let t=Object.keys(e).length+1,i=`channel_${t}`;for(;e[i];)t++,i=`channel_${t}`;return i}_findLinesIntersectingChannel(e){var h,p;const t=((h=this._workingConfig.msd)==null?void 0:h.overlays)||[],i=((p=this._workingConfig.msd)==null?void 0:p.anchors)||{},{x:o,y:s,width:r,height:a}=e,l=o+r,c=s+a,d=[];for(const g of t){if(g.type!=="line")continue;const _=g.anchor?i[g.anchor]:null,f=g.attach_to?i[g.attach_to]:null;if(!_||!f)continue;const[y,w]=_,[x,$]=f,D=Math.min(y,x),M=Math.max(y,x),P=Math.min(w,$),k=Math.max(w,$),L=M>=o&&D<=l,E=k>=s&&P<=c;if(L&&E){const B=y>=o&&y<=l&&w>=s&&w<=c,U=x>=o&&x<=l&&$>=s&&$<=c,I=D<o&&M>l,F=P<s&&k>c;(B||U||I||F)&&d.push(g)}}return m.debug(`[MSDStudio] Found ${d.length} line(s) intersecting channel bounds:`,d.map(g=>g.id).join(", ")),d}_applyChannelToLines(e,t,i="prefer"){var r;m.debug(`[MSDStudio] Applying channel '${e}' to ${t.length} line(s) with mode: ${i}`);const o=((r=this._workingConfig.msd)==null?void 0:r.overlays)||[];let s=0;for(const a of o)a.type==="line"&&t.includes(a.id)&&(a.route_channels||(a.route_channels=[]),a.route_channels.includes(e)||a.route_channels.push(e),s++,m.debug(`[MSDStudio] Updated line '${a.id}' with channel routing`));this._setNestedValue("msd.overlays",o),this._channelFormData&&(this._channelFormData.suggestedLines=null),this._showDialog("Lines Configured",`Successfully configured ${s} line(s) to route through channel "${e}" (${i} mode is set on the channel itself).`,"success"),this._schedulePreviewUpdate(),this.requestUpdate()}_dismissChannelSuggestions(){m.debug("[MSDStudio] Dismissing channel suggestions"),this._channelFormData&&(this._channelFormData.suggestedLines=null),this.requestUpdate()}_openLineForm(){var o;const e=((o=this._workingConfig.msd)==null?void 0:o.overlays)||[];let t=e.filter(s=>s.type==="line").length+1,i=`line_${t}`;for(;e.find(s=>s.id===i);)t++,i=`line_${t}`;this._editingLineId=null,this._lineFormData={id:i,entity:"",state_attribute:"",ranges_attribute:"",anchor:"",attach_to:"",anchor_side:"center",attach_side:"center",anchor_gap:0,attach_gap:0,route:"auto",z_index:null,clearance:void 0,stub_length:void 0,corner_style:"round",corner_radius:34,corner_radius_mode:"auto",corner_room_weight:void 0,corner_angle:45,smoothing_mode:"none",smoothing_iterations:0,route_channels:[],channel_mode:"prefer",style:{color:{default:"var(--lcars-orange)"},width:2,dash_array:"",marker_end:null}},this._lineFormActiveSubtab="basic",this._showLineForm=true,this.requestUpdate()}_editLine(e){var o,s,r,a,l,c,d,h;this._editingLineId=e.id;const t=((o=e.style)==null?void 0:o.color)??((s=e.style)==null?void 0:s.stroke),i=typeof t=="object"&&t!==null?t:{default:t||"var(--lcars-orange)"};this._lineFormData={id:e.id,entity:e.entity||"",state_attribute:e.state_attribute||"",ranges_attribute:e.ranges_attribute||"",anchor:e.anchor||"",attach_to:e.attach_to||"",anchor_side:e.anchor_side||"center",attach_side:e.attach_side||"center",anchor_gap:e.anchor_gap||0,attach_gap:e.attach_gap||0,route:e.route||"auto",z_index:e.z_index??null,clearance:e.clearance,stub_length:e.stub_length,route_hint:e.route_hint,route_hint_last:e.route_hint_last,waypoints:(e.waypoints||[]).map(p=>Array.isArray(p)?[...p]:p),corner_style:e.corner_style||"round",corner_radius:e.corner_radius??34,corner_radius_mode:e.corner_radius_mode||"auto",corner_room_weight:e.corner_room_weight,corner_angle:e.corner_angle??45,smoothing_mode:e.smoothing_mode||"none",smoothing_iterations:e.smoothing_iterations||0,route_channels:e.route_channels||[],animations:e.animations||[],style:{color:i,width:((r=e.style)==null?void 0:r.width)||((a=e.style)==null?void 0:a.stroke_width)||2,opacity:((l=e.style)==null?void 0:l.opacity)??1,dash_array:((c=e.style)==null?void 0:c.dash_array)||"",marker_end:((d=e.style)==null?void 0:d.marker_end)||null,marker_start:((h=e.style)==null?void 0:h.marker_start)||null}},this._lineFormActiveSubtab="basic",this._showLineForm=true,this.requestUpdate()}_duplicateLine(e){var r;const t=((r=this._workingConfig.msd)==null?void 0:r.overlays)||[];let i=t.filter(a=>a.type==="line").length+1,o=`line_${i}`;for(;t.find(a=>a.id===o);)i++,o=`line_${i}`;const s={...JSON.parse(JSON.stringify(e)),id:o};this._setNestedValue("msd.overlays",[...t,s]),this._editLine(s)}_isOverlayId(e){var i;return!e||typeof e!="string"?false:(((i=this._workingConfig.msd)==null?void 0:i.overlays)||[]).some(o=>o.id===e&&o.type!=="line")}_buildLineStyleFields(e){const t={};if(e.corner_style&&e.corner_style!=="round"&&(t.corner_style=e.corner_style),e.corner_radius!=null&&e.corner_radius!==34&&(t.corner_radius=e.corner_radius),e.corner_radius_mode==="forced"&&(t.corner_radius_mode=e.corner_radius_mode),e.corner_room_weight!=null&&(t.corner_room_weight=e.corner_room_weight),e.corner_style==="bevel"&&e.corner_angle!=null&&e.corner_angle!==45&&(t.corner_angle=e.corner_angle),e.smoothing_mode&&e.smoothing_mode!=="none"&&(t.smoothing_mode=e.smoothing_mode),e.smoothing_iterations!=null&&e.smoothing_iterations!==0&&(t.smoothing_iterations=e.smoothing_iterations),e.style&&Object.keys(e.style).length>0){const i={};if(e.style.color!=null){const o=e.style.color,s=typeof o=="object"&&o!==null?Object.keys(o):null;i.color=s&&s.length===1&&s[0]==="default"?o.default:o}e.style.width!=null&&(i.width=e.style.width),e.style.opacity!=null&&e.style.opacity!==1&&(i.opacity=e.style.opacity),e.style.dash_array&&(i.dash_array=e.style.dash_array),e.style.marker_end&&(i.marker_end=e.style.marker_end),e.style.marker_start&&(i.marker_start=e.style.marker_start),Object.keys(i).length>0&&(t.style=i)}return t}_saveLine(e=false){if(!this._lineFormData.id){m.warn("[MSDStudio] Cannot save line without ID");return}const t={type:"line",id:this._lineFormData.id,anchor:this._lineFormData.anchor,attach_to:this._lineFormData.attach_to,route:this._lineFormData.route||"auto"};this._lineFormData.z_index!=null&&(t.z_index=this._lineFormData.z_index),this._lineFormData.entity&&(t.entity=this._lineFormData.entity),this._lineFormData.state_attribute&&(t.state_attribute=this._lineFormData.state_attribute),this._lineFormData.ranges_attribute&&(t.ranges_attribute=this._lineFormData.ranges_attribute),this._lineFormData.anchor_side&&(t.anchor_side=this._lineFormData.anchor_side),this._lineFormData.attach_side&&(t.attach_side=this._lineFormData.attach_side),this._lineFormData.anchor_gap!=null&&this._lineFormData.anchor_gap!==0&&(t.anchor_gap=this._lineFormData.anchor_gap),this._lineFormData.attach_gap!=null&&this._lineFormData.attach_gap!==0&&(t.attach_gap=this._lineFormData.attach_gap),this._lineFormData.clearance!=null&&(t.clearance=this._lineFormData.clearance),this._lineFormData.stub_length!=null&&(t.stub_length=this._lineFormData.stub_length),this._lineFormData.route_hint&&(t.route_hint=this._lineFormData.route_hint),this._lineFormData.route_hint_last&&(t.route_hint_last=this._lineFormData.route_hint_last),this._lineFormData.waypoints&&this._lineFormData.waypoints.length>0&&(t.waypoints=this._lineFormData.waypoints),this._lineFormData.route_channels&&this._lineFormData.route_channels.length>0&&(t.route_channels=this._lineFormData.route_channels),Object.assign(t,this._buildLineStyleFields(this._lineFormData)),this._lineFormData.animations&&this._lineFormData.animations.length>0&&(t.animations=this._lineFormData.animations),this._workingConfig.msd||(this._workingConfig.msd={}),this._workingConfig.msd.overlays||(this._workingConfig.msd.overlays=[]);const i=this._editingLineId?this._workingConfig.msd.overlays.findIndex(o=>o.id===this._editingLineId):-1;i>=0?(this._workingConfig.msd.overlays[i]._editorSelected&&(t._editorSelected=true),this._workingConfig.msd.overlays[i]=t,m.debug("[MSDStudio] Updated line:",this._lineFormData.id)):(this._workingConfig.msd.overlays.push(t),m.debug("[MSDStudio] Added line:",this._lineFormData.id)),e||this._closeLineForm(),this._schedulePreviewUpdate()}_saveBulkLineStyle(){var o;const e=this._bulkEditTargetIds||[];if(e.length===0){this._closeLineForm();return}const t=this._diffStyleFields(this._buildLineStyleFields(this._lineFormData),this._buildLineStyleFields(this._bulkEditSnapshot));for(const s of["entity","state_attribute","ranges_attribute"])this._lineFormData[s]!==this._bulkEditSnapshot[s]&&(t[s]=this._lineFormData[s]||void 0);if(Object.keys(t).length===0){this._selectedLineIds=new Set,this._closeLineForm();return}const i=((o=this._workingConfig.msd)==null?void 0:o.overlays)||[];for(const s of e){const r=i.findIndex(a=>a.id===s);r<0||(i[r]=this._applyTouchedFields(i[r],t))}m.debug("[MSDStudio] Bulk-applied line style to",e.length,"lines:",Object.keys(t)),this._selectedLineIds=new Set,this._closeLineForm(),this._schedulePreviewUpdate()}_closeLineForm(){m.trace("[MSDStudio] _closeLineForm called",new Error().stack),this._showLineForm=false,this._editingLineId=null,this._bulkEditKind=null,this._bulkEditTargetIds=null,this._bulkEditSnapshot=null,this.requestUpdate()}_handleShapeFormTabChange(e){var i;e.stopPropagation();const t=(i=e.target.activeTab)==null?void 0:i.getAttribute("value");t&&(this._shapeFormActiveSubtab=t,this.requestUpdate())}_renderShapeFormTabContent(){switch(this._shapeFormActiveSubtab){case"geometry":return this._renderShapeFormGeometry();case"style":return this._renderShapeFormStyle();case"animation":return this._renderShapeFormAnimation();default:return this._renderShapeFormGeometry()}}_renderShapeFormAnimation(){const e=this._editingShapeId||this._shapeFormData.id;return v`
            <div class="subform-field-stack">
                <lcards-form-section
                    header="Shape Animations"
                    description="Configure animations for this shape"
                    icon="mdi:animation"
                    ?expanded=${true}>

                    <lcards-animation-editor
                        .hass=${this.hass}
                        .animations=${this._shapeFormData.animations||[]}
                        .cardElement=${this._getLivePreviewCardElement()}
                        .searchRootSelector=${e?`[data-overlay-id="${e}"]`:""}
                        @animations-changed=${t=>{this._shapeFormData.animations=t.detail.value,this.requestUpdate()}}
                        @refresh-targets=${()=>this.requestUpdate()}
                    ></lcards-animation-editor>
                </lcards-form-section>
            </div>
        `}_renderShapeFormGeometry(){const e=this._shapeFormData.kind;return v`
            <div class="subform-field-stack">
                <lcards-form-section header="Shape Kind" icon="mdi:shape" ?expanded=${true}>
                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{select:{options:[{value:"polyline",label:"Polyline / Path"},{value:"rect",label:"Rectangle"},{value:"circle",label:"Circle / Ellipse"}]}}}
                        .value=${e}
                        .label=${"Kind"}
                        @value-changed=${t=>{const i=t.detail.value;this._shapeFormData={...this._shapeFormData,kind:i},i==="polyline"&&(!this._shapeFormData.points||this._shapeFormData.points.length<2)&&(this._shapeFormData.points=[[100,100],[200,100]]),this.requestUpdate()}}>
                    </ha-selector>
                </lcards-form-section>

                ${e==="polyline"?v`
                    <lcards-form-section header="Points" description="Ordered vertex list, in viewBox units" icon="mdi:vector-point" ?expanded=${true}>
                        ${(this._shapeFormData.points||[]).length>Me?v`
                            <lcards-message type="info">
                                ${(this._shapeFormData.points||[]).length} points: too many to edit here. Drag them on the canvas,
                                or edit them on the YAML tab.
                                <ha-button
                                    @click=${()=>{this._closeShapeForm(),this._activeTab=J.YAML,this.requestUpdate()}}>
                                    <ha-icon icon="mdi:code-braces" slot="start"></ha-icon>
                                    Edit in YAML
                                </ha-button>
                            </lcards-message>
                        `:(this._shapeFormData.points||[]).map((t,i)=>v`
                            <div style="display: flex; gap: 8px; align-items: center; margin-top: 8px;">
                                <span style="width: 20px; font-size: 12px; color: var(--secondary-text-color);">${i+1}</span>
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{number:{mode:"box"}}}
                                    .value=${Array.isArray(t)?t[0]:0}
                                    .label=${"X"}
                                    @value-changed=${o=>{const s=[...this._shapeFormData.points];s[i]=[Number(o.detail.value),Array.isArray(t)?t[1]:0],this._shapeFormData={...this._shapeFormData,points:s},this.requestUpdate()}}
                                    style="flex: 1;">
                                </ha-selector>
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{number:{mode:"box"}}}
                                    .value=${Array.isArray(t)?t[1]:0}
                                    .label=${"Y"}
                                    @value-changed=${o=>{const s=[...this._shapeFormData.points];s[i]=[Array.isArray(t)?t[0]:0,Number(o.detail.value)],this._shapeFormData={...this._shapeFormData,points:s},this.requestUpdate()}}
                                    style="flex: 1;">
                                </ha-selector>
                                <ha-icon-button
                                    @click=${()=>{const o=this._shapeFormData.points.filter((s,r)=>r!==i);this._shapeFormData={...this._shapeFormData,points:o},this.requestUpdate()}}
                                    ?disabled=${(this._shapeFormData.points||[]).length<=2}
                                    .label=${"Remove point"}
                                    .path=${"M19,13H5V11H19V13Z"}>
                                </ha-icon-button>
                            </div>
                        `)}
                        ${(this._shapeFormData.points||[]).length>Me?"":v`
                        <ha-button
                            @click=${()=>{const t=[...this._shapeFormData.points||[]],i=t[t.length-1]||[100,100];t.push([Array.isArray(i)?i[0]+50:150,Array.isArray(i)?i[1]:100]),this._shapeFormData={...this._shapeFormData,points:t},this.requestUpdate()}}
                            style="margin-top: 12px;">
                            <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                            Add Point
                        </ha-button>
                        `}

                        <ha-selector
                            style="margin-top: 16px; display: block;"
                            .hass=${this.hass}
                            .label=${"Closed (connect back to first point, allows fill)"}
                            .selector=${{boolean:{}}}
                            .value=${!!this._shapeFormData.closed}
                            @value-changed=${t=>{this._shapeFormData={...this._shapeFormData,closed:t.detail.value},this.requestUpdate()}}>
                        </ha-selector>
                    </lcards-form-section>
                `:v`
                    <lcards-form-section header="Position &amp; Size" icon="mdi:arrow-expand-all" ?expanded=${true}>
                        <div class="subform-columns-2">
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number:{mode:"box"}}}
                                .value=${(this._shapeFormData.position||[0,0])[0]}
                                .label=${"X"}
                                @value-changed=${t=>{const i=[...this._shapeFormData.position||[0,0]];i[0]=Number(t.detail.value),this._shapeFormData={...this._shapeFormData,position:i},this.requestUpdate()}}>
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number:{mode:"box"}}}
                                .value=${(this._shapeFormData.position||[0,0])[1]}
                                .label=${"Y"}
                                @value-changed=${t=>{const i=[...this._shapeFormData.position||[0,0]];i[1]=Number(t.detail.value),this._shapeFormData={...this._shapeFormData,position:i},this.requestUpdate()}}>
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number:{mode:"box",min:1}}}
                                .value=${(this._shapeFormData.size||[100,60])[0]}
                                .label=${"Width"}
                                @value-changed=${t=>{const i=[...this._shapeFormData.size||[100,60]];i[0]=Number(t.detail.value),this._shapeFormData={...this._shapeFormData,size:i},this.requestUpdate()}}>
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number:{mode:"box",min:1}}}
                                .value=${(this._shapeFormData.size||[100,60])[1]}
                                .label=${"Height"}
                                @value-changed=${t=>{const i=[...this._shapeFormData.size||[100,60]];i[1]=Number(t.detail.value),this._shapeFormData={...this._shapeFormData,size:i},this.requestUpdate()}}>
                            </ha-selector>
                        </div>
                        <div style="margin-top: 8px; font-size: 12px; color: var(--secondary-text-color);">
                            Corner rounding, smoothing, and stroke details are on the Style tab.
                        </div>
                    </lcards-form-section>
                `}

                <lcards-form-section
                    header="Stacking Order"
                    description="Control paint order relative to other lines and controls"
                    icon="mdi:layers-outline"
                    secondary=${this._shapeFormData.z_index!=null?`Z-Index: ${this._shapeFormData.z_index} (custom)`:"Z-Index: 50 (default)"}
                    ?expanded=${this._shapeFormData.z_index!=null}>
                    <ha-input
                        type="number"
                        label="Z-Index"
                        .value=${this._shapeFormData.z_index!=null?String(this._shapeFormData.z_index):""}
                        @input=${t=>{const i=t.target.value;this._shapeFormData.z_index=i===""?null:Number(i),this.requestUpdate()}}
                        hint="Higher values paint on top. Leave blank to use the default (50, so shapes paint under lines and controls).">
                    </ha-input>
                </lcards-form-section>

                <lcards-form-section
                    header="Editor Lock"
                    description="Prevent accidental drag/resize on the MSD Studio canvas"
                    icon="mdi:lock-outline"
                    secondary=${this._shapeFormData.locked?"Locked":"Unlocked"}
                    ?expanded=${this._shapeFormData.locked}>
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Lock this overlay"}
                        .helper=${"When enabled, this overlay can't be dragged, resized, or (for polylines) have its vertices edited on the canvas. Edit it via this form or the list panel's Lock icon instead."}
                        .selector=${{boolean:{}}}
                        .value=${this._shapeFormData.locked===true}
                        @value-changed=${t=>{this._shapeFormData={...this._shapeFormData,locked:t.detail.value},this.requestUpdate()}}>
                    </ha-selector>
                </lcards-form-section>
            </div>
        `}_getShapeColorEditorAdapter(){const e=this;return{hass:this.hass,config:this._shapeFormData,_getConfigValue(t){return t.split(".").reduce((i,o)=>i==null?void 0:i[o],e._shapeFormData)},_setConfigValue(t,i){const o=t.split("."),s=o.pop();let r=e._shapeFormData;for(const a of o)(!r[a]||typeof r[a]!="object")&&(r[a]={}),r=r[a];r[s]=i,e.requestUpdate()}}}_renderShapeEntityBindingSection(){var s,r;const e=this._shapeFormData.entity||"",t=e&&((r=(s=this.hass)==null?void 0:s.states)!=null&&r[e])?Object.keys(this.hass.states[e].attributes||{}).sort().map(a=>({value:a,label:a})):[],i=[...t],o=i.findIndex(a=>a.value==="brightness");return o>=0&&i.splice(o+1,0,{value:"brightness_pct",label:"brightness_pct  (auto 0–100%)"}),v`
            <ha-selector
                .hass=${this.hass}
                .selector=${{entity:{}}}
                .value=${e}
                .label=${"Entity"}
                .helper=${"Bind this shape's color and/or fill to an entity's state (optional). Leave blank for fixed colors"}
                @value-changed=${a=>{this._shapeFormData.entity=a.detail.value||"",this.requestUpdate()}}
                style="display: block; margin-bottom: 12px;">
            </ha-selector>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <ha-selector
                    .hass=${this.hass}
                    .label=${"State Attribute"}
                    .helper=${"Match this attribute's value instead of raw entity state"}
                    .disabled=${!e}
                    .selector=${{select:{mode:"dropdown",options:[{value:"__none__",label:"(Use entity state)"},...t],custom_value:true}}}
                    .value=${this._shapeFormData.state_attribute||"__none__"}
                    @value-changed=${a=>{const l=(a.detail.value??"").trim();this._shapeFormData.state_attribute=l==="__none__"||!l?"":l,this.requestUpdate()}}>
                </ha-selector>
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Range Attribute"}
                    .helper=${"Attribute compared against above:/below:/between: keys"}
                    .disabled=${!e}
                    .selector=${{select:{mode:"dropdown",options:[{value:"__none__",label:"(Use entity state)"},...i],custom_value:true}}}
                    .value=${this._shapeFormData.ranges_attribute||"__none__"}
                    @value-changed=${a=>{let l=(a.detail.value??"").trim();l==="brightness"&&(l="brightness_pct"),this._shapeFormData.ranges_attribute=l==="__none__"||!l?"":l,this.requestUpdate()}}>
                </ha-selector>
            </div>
        `}_renderShapeFormStyle(){const e=this._shapeFormData.kind,t=this._shapeFormData.style||{},i=t.dash_array||"";let o="solid";return i==="5,5"?o="dashed":i==="2,2"||i==="0,4"?o="dotted":i==="8,4,2,4"||i==="8,4,0,4"?o="dash-dot":i&&(o="custom"),v`
            <div class="subform-field-stack">
                <!-- Line Style | Shape, side by side -->
                <div class="subform-columns-2">
                    <lcards-form-section header="Line Style" description="Width, opacity and dash pattern" icon="mdi:ruler" ?expanded=${true}>
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{number:{min:0,max:30,step:.5,mode:"slider"}}}
                            .value=${t.width??2}
                            .label=${"Width"}
                            @value-changed=${s=>{this._shapeFormData.style={...this._shapeFormData.style,width:s.detail.value},this.requestUpdate()}}
                            style="margin-top: 12px;">
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{number:{min:0,max:1,step:.01,mode:"slider"}}}
                            .value=${t.opacity??1}
                            .label=${"Opacity"}
                            @value-changed=${s=>{this._shapeFormData.style={...this._shapeFormData.style,opacity:s.detail.value},this.requestUpdate()}}
                            style="margin-top: 12px;">
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{select:{options:[{value:"solid",label:"Solid"},{value:"dashed",label:"Dashed"},{value:"dotted",label:"Dotted"},{value:"dash-dot",label:"Dash-Dot"},{value:"custom",label:"Custom"}]}}}
                            .value=${o}
                            .label=${"Pattern"}
                            @value-changed=${s=>{const r=s.detail.value;let a=i,l=t.line_cap;r==="dashed"?a="5,5":r==="dotted"?(a="0,4",l="round"):r==="dash-dot"?(a="8,4,0,4",l="round"):r==="solid"&&(a=""),r!=="custom"&&(this._shapeFormData.style={...this._shapeFormData.style,dash_array:a,line_cap:l},this.requestUpdate())}}
                            style="margin-top: 12px;">
                        </ha-selector>

                        <!-- Dash Pattern Customization (conditional - all non-solid presets) -->
                        ${o!=="solid"?v`
                            <lcards-form-section
                                header="${o==="custom"?"Custom":"Customize"} Dash Pattern"
                                icon="mdi:dots-horizontal"
                                ?nested=${true}
                                ?expanded=${true}>

                                ${(()=>{const s=(i||"").split(",").map(d=>parseFloat(d.trim())||0),r=s[0]??5,a=s[1]??5,l=s[2]||0,c=s[3]||0;return v`
                                        <ha-selector
                                            .hass=${this.hass}
                                            .selector=${{number:{min:0,max:50,step:1,mode:"slider"}}}
                                            .value=${r}
                                            .label=${"Dash Length"}
                                            @value-changed=${d=>{const h=d.detail.value,p=l>0?`${h},${a},${l},${c}`:`${h},${a}`;this._shapeFormData.style={...this._shapeFormData.style,dash_array:p},this.requestUpdate()}}>
                                        </ha-selector>

                                        <ha-selector
                                            .hass=${this.hass}
                                            .selector=${{number:{min:0,max:50,step:1,mode:"slider"}}}
                                            .value=${a}
                                            .label=${"Gap Length"}
                                            @value-changed=${d=>{const h=d.detail.value,p=l>0?`${r},${h},${l},${c}`:`${r},${h}`;this._shapeFormData.style={...this._shapeFormData.style,dash_array:p},this.requestUpdate()}}
                                            style="margin-top: 12px;">
                                        </ha-selector>

                                        <ha-selector
                                            style="margin-top: 12px; display: block;"
                                            .hass=${this.hass}
                                            .label=${"Add secondary dash/gap"}
                                            .selector=${{boolean:{}}}
                                            .value=${l>0}
                                            @value-changed=${d=>{const h=d.detail.value?`${r},${a},2,2`:`${r},${a}`;this._shapeFormData.style={...this._shapeFormData.style,dash_array:h},this.requestUpdate()}}>
                                        </ha-selector>

                                        ${l>0?v`
                                            <ha-selector
                                                .hass=${this.hass}
                                                .selector=${{number:{min:0,max:50,step:1,mode:"slider"}}}
                                                .value=${l}
                                                .label=${"Secondary Dash"}
                                                @value-changed=${d=>{const h=`${r},${a},${d.detail.value},${c}`;this._shapeFormData.style={...this._shapeFormData.style,dash_array:h},this.requestUpdate()}}
                                                style="margin-top: 12px;">
                                            </ha-selector>

                                            <ha-selector
                                                .hass=${this.hass}
                                                .selector=${{number:{min:0,max:50,step:1,mode:"slider"}}}
                                                .value=${c}
                                                .label=${"Secondary Gap"}
                                                @value-changed=${d=>{const h=`${r},${a},${l},${d.detail.value}`;this._shapeFormData.style={...this._shapeFormData.style,dash_array:h},this.requestUpdate()}}
                                                style="margin-top: 12px;">
                                            </ha-selector>
                                        `:""}

                                        <div style="margin-top: 12px; font-size: 12px; color: var(--secondary-text-color); font-family: monospace;">
                                            Pattern: ${l>0?`${r},${a},${l},${c}`:`${r},${a}`}
                                        </div>
                                    `})()}
                            </lcards-form-section>
                        `:""}
                    </lcards-form-section>

                    <lcards-form-section header="Shape" description="Corner and smoothing settings" icon="mdi:vector-curve" ?expanded=${true}>
                        ${e==="polyline"?v`
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select:{options:[{value:"miter",label:"Miter (Sharp)"},{value:"round",label:"Round (Arc)"},{value:"bevel",label:"Bevel (Cut)"}]}}}
                                .value=${this._shapeFormData.corner_style||"round"}
                                .label=${"Corner Style"}
                                @value-changed=${s=>{this._shapeFormData={...this._shapeFormData,corner_style:s.detail.value},this.requestUpdate()}}>
                            </ha-selector>
                        `:v`
                            <div style="font-size: 13px; color: var(--secondary-text-color); margin-bottom: 8px;">
                                ${e==="rect"?"Rectangle corners: sharp or rounded.":"Corner settings not applicable to circle/ellipse."}
                            </div>
                            ${e==="rect"?v`
                                <ha-selector
                                    style="display: block; margin-bottom: 12px;"
                                    .hass=${this.hass}
                                    .label=${"Rounded Corners"}
                                    .selector=${{boolean:{}}}
                                    .value=${this._shapeFormData.corner_style==="round"}
                                    @value-changed=${s=>{this._shapeFormData={...this._shapeFormData,corner_style:s.detail.value?"round":"miter"},this.requestUpdate()}}>
                                </ha-selector>
                            `:""}

                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select:{options:[{value:"butt",label:"Butt (Flat)"},{value:"round",label:"Round"},{value:"square",label:"Square (Extended)"}]}}}
                                .value=${t.line_cap||"butt"}
                                .label=${"Line Cap"}
                                helper="Shape of each dash segment's ends: set to Round for circular dots"
                                @value-changed=${s=>{this._shapeFormData.style={...this._shapeFormData.style,line_cap:s.detail.value},this.requestUpdate()}}
                                style="margin-top: 12px;">
                            </ha-selector>
                        `}

                        ${this._shapeFormData.corner_style==="round"&&e!=="circle"?v`
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number:{min:0,max:100,step:1,mode:"slider",unit_of_measurement:"vb"}}}
                                .value=${this._shapeFormData.corner_radius??(e==="rect"?8:34)}
                                .label=${"Corner Radius"}
                                @value-changed=${s=>{this._shapeFormData={...this._shapeFormData,corner_radius:s.detail.value},this.requestUpdate()}}
                                style="margin-top: 12px;">
                            </ha-selector>
                        `:""}

                        ${e==="polyline"&&this._shapeFormData.corner_style==="bevel"?v`
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number:{min:0,max:100,step:1,mode:"slider",unit_of_measurement:"vb"}}}
                                .value=${this._shapeFormData.corner_radius??34}
                                .label=${"Cut Size"}
                                @value-changed=${s=>{this._shapeFormData={...this._shapeFormData,corner_radius:s.detail.value},this.requestUpdate()}}
                                style="margin-top: 12px;">
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number:{min:0,max:90,step:1,mode:"slider",unit_of_measurement:"°"}}}
                                .value=${this._shapeFormData.corner_angle??45}
                                .label=${"Cut Angle"}
                                @value-changed=${s=>{this._shapeFormData={...this._shapeFormData,corner_angle:s.detail.value},this.requestUpdate()}}
                                style="margin-top: 12px;">
                            </ha-selector>
                        `:""}

                        ${e==="polyline"?v`
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select:{options:[{value:"none",label:"None"},{value:"chaikin",label:"Chaikin (Corner-cutting)"}]}}}
                                .value=${this._shapeFormData.smoothing_mode||"none"}
                                .label=${"Smoothing Mode"}
                                @value-changed=${s=>{this._shapeFormData={...this._shapeFormData,smoothing_mode:s.detail.value},this.requestUpdate()}}
                                style="margin-top: 12px;">
                            </ha-selector>

                            ${this._shapeFormData.smoothing_mode==="chaikin"?v`
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{number:{min:0,max:5,step:1,mode:"slider"}}}
                                    .value=${this._shapeFormData.smoothing_iterations||0}
                                    .label=${"Smoothing Iterations"}
                                    @value-changed=${s=>{this._shapeFormData={...this._shapeFormData,smoothing_iterations:s.detail.value},this.requestUpdate()}}
                                    style="margin-top: 12px;">
                                </ha-selector>
                            `:""}

                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select:{options:[{value:"butt",label:"Butt (Flat)"},{value:"round",label:"Round"},{value:"square",label:"Square (Extended)"}]}}}
                                .value=${t.line_cap||"butt"}
                                .label=${"Line Cap"}
                                @value-changed=${s=>{this._shapeFormData.style={...this._shapeFormData.style,line_cap:s.detail.value},this.requestUpdate()}}
                                style="margin-top: 12px;">
                            </ha-selector>

                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select:{options:[{value:"miter",label:"Miter (Sharp)"},{value:"round",label:"Round"},{value:"bevel",label:"Bevel (Cut)"}]}}}
                                .value=${t.line_join||this._shapeFormData.corner_style||"miter"}
                                .label=${"Line Join"}
                                @value-changed=${s=>{this._shapeFormData.style={...this._shapeFormData.style,line_join:s.detail.value},this.requestUpdate()}}
                                style="margin-top: 12px;">
                            </ha-selector>

                            ${t.line_join==="miter"||!t.line_join&&this._shapeFormData.corner_style==="miter"?v`
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{number:{min:1,max:20,step:.5,mode:"slider"}}}
                                    .value=${t.miter_limit||4}
                                    .label=${"Miter Limit"}
                                    @value-changed=${s=>{this._shapeFormData.style={...this._shapeFormData.style,miter_limit:s.detail.value},this.requestUpdate()}}
                                    style="margin-top: 12px;">
                                </ha-selector>
                            `:""}
                        `:""}
                    </lcards-form-section>
                </div>

                <!-- Shared entity binding for both Color and Fill below -->
                <lcards-form-section header="Entity Binding" description="Optional: powers state-based color and/or fill below" icon="mdi:target" ?expanded=${true}>
                    ${this._renderShapeEntityBindingSection()}
                </lcards-form-section>

                <lcards-form-section header="Color" description="Stroke color: fixed, or state/range keys bound to the entity above" icon="mdi:palette" ?expanded=${true}>
                    <lcards-color-section-v2
                        .editor=${this._getShapeColorEditorAdapter()}
                        .config=${this._shapeFormData}
                        .entityId=${this._shapeFormData.entity||""}
                        basePath="style.color"
                        header="Shape Color"
                        description="Fixed color, or add state/range keys to bind it to the entity above"
                        ?expanded=${true}>
                    </lcards-color-section-v2>
                </lcards-form-section>

                <lcards-form-section header="Fill" description="Only visible on closed shapes: fixed, or state/range keys bound to the same entity above" icon="mdi:format-color-fill" ?expanded=${true}>
                    <lcards-color-section-v2
                        .editor=${this._getShapeColorEditorAdapter()}
                        .config=${this._shapeFormData}
                        .entityId=${this._shapeFormData.entity||""}
                        basePath="style.fill"
                        header="Fill Color"
                        description="Fixed color, or add state/range keys to bind it to the entity above"
                        ?expanded=${true}>
                    </lcards-color-section-v2>

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{number:{min:0,max:1,step:.01,mode:"slider"}}}
                        .value=${t.fill_opacity??1}
                        .label=${"Fill Opacity"}
                        @value-changed=${s=>{this._shapeFormData.style={...this._shapeFormData.style,fill_opacity:s.detail.value},this.requestUpdate()}}
                        style="margin-top: 12px;">
                    </ha-selector>
                </lcards-form-section>
            </div>
        `}_renderShapeFormDialog(){const e=this._bulkEditKind==="shape"&&this._bulkEditTargetIds!==null,t=!!this._editingShapeId,i=e?`Bulk Edit Style: ${this._bulkEditTargetIds.length} shapes selected`:t?`Edit Shape: ${this._shapeFormData.id}`:"Add Shape";return v`
            <ha-dialog
                class="subform-dialog"
                open
                @closed=${o=>{o.stopPropagation(),this._closeShapeForm()}}
                .headerTitle=${i}
                prevent-scrim-close>

                <div class="subform-layout">
                    <div class="subform-config">
                        ${e?v`
                            <lcards-message type="info" style="margin-bottom: 12px;">
                                Only fields you change below are applied; untouched fields are left as-is on each of the ${this._bulkEditTargetIds.length} selected shapes.
                            </lcards-message>
                        `:v`
                            <ha-tab-group @wa-tab-show=${this._handleShapeFormTabChange} class="subform-tabs">
                                <ha-tab-group-tab value="geometry" ?active=${this._shapeFormActiveSubtab==="geometry"}>Geometry</ha-tab-group-tab>
                                <ha-tab-group-tab value="style" ?active=${this._shapeFormActiveSubtab==="style"}>Style</ha-tab-group-tab>
                                <ha-tab-group-tab value="animation" ?active=${this._shapeFormActiveSubtab==="animation"}>Animation</ha-tab-group-tab>
                            </ha-tab-group>
                        `}

                        <div class="subform-tab-content">
                            ${e?this._renderShapeFormStyle():this._renderShapeFormTabContent()}
                        </div>
                    </div>

                    <div class="subform-preview padded">
                        <div class="subform-preview-label">Live Preview</div>
                        ${this._renderShapeStylePreviewVertical()}
                    </div>
                </div>

                <div slot="footer">
                    <ha-button @click=${this._closeShapeForm} appearance="plain">
                        <ha-icon icon="mdi:close" slot="start"></ha-icon>
                        Cancel
                    </ha-button>
                    <ha-button @click=${()=>e?this._saveBulkShapeStyle():this._saveShape()}>
                        <ha-icon icon="mdi:content-save" slot="start"></ha-icon>
                        ${e?"Apply to Selected":"Save"}
                    </ha-button>
                </div>
            </ha-dialog>
        `}_handleWaypointDragStart(e,t){m.trace("[MSDStudio] Waypoint drag start:",t),this._draggedWaypointIndex=t,e.dataTransfer.effectAllowed="move",e.dataTransfer.setData("text/plain",t),this.requestUpdate()}_handleWaypointDragEnd(e){m.trace("[MSDStudio] Waypoint drag end"),this._draggedWaypointIndex=null,this.requestUpdate()}_handleWaypointDragOver(e,t){e.preventDefault(),e.dataTransfer.dropEffect="move",!(this._draggedWaypointIndex===null||this._draggedWaypointIndex===t)&&m.trace("[MSDStudio] Waypoint drag over:",t)}_handleWaypointDrop(e,t){m.trace("[MSDStudio] Waypoint drop at:",t),e.preventDefault(),e.stopPropagation();const i=this._draggedWaypointIndex;if(i===null||i===t){m.trace("[MSDStudio] Drop ignored - same position");return}const o=[...this._lineFormData.waypoints],[s]=o.splice(i,1);o.splice(t,0,s),this._lineFormData={...this._lineFormData,waypoints:o},this._draggedWaypointIndex=null,m.trace("[MSDStudio] Waypoints reordered"),this._schedulePreviewUpdate(),this.requestUpdate()}_handleLineFormTabChange(e){var i;e.stopPropagation();const t=(i=e.target.activeTab)==null?void 0:i.getAttribute("value");t&&(this._lineFormActiveSubtab=t,this.requestUpdate())}async _deleteLine(e){var o;if(!await this._showConfirmDialog("Delete Line",`Delete line "${e.id}"?`))return;const t=((o=this._workingConfig.msd)==null?void 0:o.overlays)||[],i=t.findIndex(s=>s.id===e.id);i>=0&&(t.splice(i,1),m.debug("[MSDStudio] Deleted line:",e.id),this.requestUpdate(),this._schedulePreviewUpdate())}_highlightLineInPreview(e){m.debug("[MSDStudio] Highlight line:",e.id),this._highlightedLine=e.id,this._debugSettings={...this._debugSettings,line_paths:true,highlighted_line:e.id},this._schedulePreviewUpdate(),this.requestUpdate(),setTimeout(()=>{this._highlightedLine=null;const{highlighted_line:t,...i}=this._debugSettings;this._debugSettings=i,this._schedulePreviewUpdate(),this.requestUpdate()},2500)}_openLineFormWithConnection(e,t){this._openLineForm(),this._lineFormData.anchor=e.id,this._lineFormData.attach_to=t.id,e.point&&(this._lineFormData.anchor_side=this._convertPointToSide(e.point)),t.point&&(this._lineFormData.attach_side=this._convertPointToSide(t.point)),this.requestUpdate()}_convertPointToSide(e){return new Set(["top-left","top","top-right","left","center","right","bottom-left","bottom","bottom-right"]).has(e)||/^vertex\d+$/.test(e||"")?e:"center"}_handleConnectLineClick(e){const t=e.target.closest("[data-connection-type]");if(!t){m.debug("[MSDStudio] Connect line click on non-connection element");return}const i={type:t.dataset.connectionType,id:t.dataset.connectionId,point:t.dataset.connectionPoint||null,gap:0};this._connectLineState.source?(m.debug("[MSDStudio] Connect line target set:",i),this._openLineFormWithConnection(this._connectLineState.source,i),this._clearConnectLineState()):(this._connectLineState.source=i,m.debug("[MSDStudio] Connect line source set:",i),this.requestUpdate())}_clearConnectLineState(){this._connectLineState={source:null,tempLineElement:null},this._activeMode=N.VIEW,this.requestUpdate()}_renderLineFormDialog(){const e=this._bulkEditKind==="line"&&this._bulkEditTargetIds!==null,t=!!this._editingLineId,i=e?`Bulk Edit Style: ${this._bulkEditTargetIds.length} lines selected`:t?`Edit Line: ${this._lineFormData.id}`:"Add Line";return v`
            <ha-dialog
                class="subform-dialog"
                open
                @closed=${o=>{o.stopPropagation(),this._closeLineForm()}}
                .headerTitle=${i}
                prevent-scrim-close>

                <!-- Split Layout: Content Left, Preview Right -->
                <div class="subform-layout">

                    <!-- Left Panel: Tabs and Content -->
                    <div class="subform-config">
                        ${e?v`
                            <lcards-message type="info" style="margin-bottom: 12px;">
                                Only fields you change below are applied; untouched fields are left as-is on each of the ${this._bulkEditTargetIds.length} selected lines.
                            </lcards-message>
                        `:v`
                            <!-- Subtabs -->
                            <ha-tab-group @wa-tab-show=${this._handleLineFormTabChange} class="subform-tabs">
                                <ha-tab-group-tab value="basic" ?active=${this._lineFormActiveSubtab==="basic"}>Basic</ha-tab-group-tab>
                                <ha-tab-group-tab value="style" ?active=${this._lineFormActiveSubtab==="style"}>Style</ha-tab-group-tab>
                                <ha-tab-group-tab value="markers" ?active=${this._lineFormActiveSubtab==="markers"}>Markers</ha-tab-group-tab>
                                <ha-tab-group-tab value="animation" ?active=${this._lineFormActiveSubtab==="animation"}>Animation</ha-tab-group-tab>
                                <ha-tab-group-tab value="routing" ?active=${this._lineFormActiveSubtab==="routing"}>Routing</ha-tab-group-tab>
                            </ha-tab-group>
                        `}

                        <!-- Scrollable Content -->
                        <div class="subform-tab-content">
                            ${e?this._renderLineFormStyle():this._renderLineFormTabContent()}
                        </div>
                    </div>

                    <!-- Right Panel: Vertical Line Preview -->
                    <div class="subform-preview padded">
                        <div class="subform-preview-label">Live Preview</div>
                        ${this._renderLineStylePreviewVertical()}
                    </div>
                </div>

                <div slot="footer">
                    <ha-button @click=${this._closeLineForm} appearance="plain">
                        <ha-icon icon="mdi:close" slot="start"></ha-icon>
                        Cancel
                    </ha-button>
                    <ha-button @click=${()=>e?this._saveBulkLineStyle():this._saveLine()}>
                        <ha-icon icon="mdi:content-save" slot="start"></ha-icon>
                        ${e?"Apply to Selected":"Save"}
                    </ha-button>
                </div>
            </ha-dialog>
        `}_renderLineFormTabContent(){switch(this._lineFormActiveSubtab){case"basic":return this._renderLineFormBasic();case"style":return this._renderLineFormStyle();case"markers":return this._renderLineFormMarkers();case"routing":return this._renderLineFormRouting();case"animation":return this._renderLineFormAnimation();default:return this._renderLineFormBasic()}}_renderLineFormBasic(){var l;const e=((l=this._workingConfig.msd)==null?void 0:l.anchors)||{},t=this._getBaseSvgAnchors(),i=[...this._getControlOverlays(),...this._getShapeOverlays()],o=Object.keys(e).map(c=>({value:c,label:`Anchor: ${c}`})),s=Object.keys(t).map(c=>({value:c,label:`Base SVG: ${c}`})),r=i.map(c=>({value:c.id,label:`Overlay: ${c.id} (${c.type})`})),a=[...o,...s,...r];return this._isOverlayId(this._lineFormData.anchor),this._isOverlayId(this._lineFormData.attach_to),this._getRoutingModeInfo(this._lineFormData.route||"auto"),v`
            <div class="subform-field-stack">
                <!-- Line ID -->
                <ha-input
                    label="Line ID"
                    .value=${this._lineFormData.id}
                    @input=${c=>{this._lineFormData.id=c.target.value,this.requestUpdate()}}
                    required
                    hint="Unique identifier for this line">
                </ha-input>

                <!-- Horizontal Source → Target Layout -->
                <div class="line-connection-flow">
                    <!-- Source Column -->
                    <lcards-form-section
                        header="Source (Anchor)"
                        description="Starting point for the line"
                        icon="mdi:ray-start"
                        class="connection-source"
                        ?expanded=${true}>

                        <div class="subform-field-stack">
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select:{mode:"dropdown",custom_value:a.length>=10,options:a}}}
                                .value=${this._lineFormData.anchor}
                                .label=${"Select Anchor or Overlay"}
                                @value-changed=${c=>{this._lineFormData.anchor=c.detail.value,this.requestUpdate()}}>
                            </ha-selector>

                            <div class="subform-row-aside">
                                <lcards-position-picker
                                    .value=${this._lineFormData.anchor_side||"center"}
                                    .label=${"Anchor Side"}
                                    .helper=${"Select attachment point on the source"}
                                    @value-changed=${c=>{const d={"top-center":"top","bottom-center":"bottom","center-left":"left","center-right":"right"};this._lineFormData.anchor_side=d[c.detail.value]||c.detail.value,this.requestUpdate()}}>
                                </lcards-position-picker>

                                <ha-input
                                    style="width: 100%; box-sizing: border-box;"
                                    type="number"
                                    label="Gap (vb units)"
                                    .value=${String(this._lineFormData.anchor_gap||0)}
                                    @input=${c=>{this._lineFormData.anchor_gap=Number(c.target.value),this.requestUpdate()}}
                                    hint="Distance from point">
                                </ha-input>
                            </div>
                        </div>
                    </lcards-form-section>

                    <!-- Flow Arrow -->
                    <div class="connection-arrow">
                        <ha-icon icon="mdi:arrow-right-thick"></ha-icon>
                    </div>

                    <!-- Target Column -->
                    <lcards-form-section
                        header="Target (Attach To)"
                        description="Ending point for the line"
                        icon="mdi:ray-end"
                        class="connection-target"
                        ?expanded=${true}>

                        <div class="subform-field-stack">
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select:{mode:"dropdown",custom_value:a.length>=10,options:a}}}
                                .value=${this._lineFormData.attach_to}
                                .label=${"Select Anchor or Overlay"}
                                @value-changed=${c=>{this._lineFormData.attach_to=c.detail.value,this.requestUpdate()}}>
                            </ha-selector>

                            <div class="subform-row-aside">
                                <lcards-position-picker
                                    .value=${this._lineFormData.attach_side||"center"}
                                    .label=${"Attach Side"}
                                    .helper=${"Select attachment point on the target"}
                                    @value-changed=${c=>{const d={"top-center":"top","bottom-center":"bottom","center-left":"left","center-right":"right"};this._lineFormData.attach_side=d[c.detail.value]||c.detail.value,this.requestUpdate()}}>
                                </lcards-position-picker>

                                <ha-input
                                    style="width: 100%; box-sizing: border-box;"
                                    type="number"
                                    label="Gap (vb units)"
                                    .value=${String(this._lineFormData.attach_gap||0)}
                                    @input=${c=>{this._lineFormData.attach_gap=Number(c.target.value),this.requestUpdate()}}
                                    hint="Distance from point">
                                </ha-input>
                            </div>
                        </div>
                    </lcards-form-section>
                </div>

                <lcards-form-section
                    header="Stacking Order"
                    description="Control paint order relative to other lines and controls"
                    icon="mdi:layers-outline"
                    secondary=${this._lineFormData.z_index!=null?`Z-Index: ${this._lineFormData.z_index} (custom)`:"Z-Index: 100 (default)"}
                    ?expanded=${this._lineFormData.z_index!=null}>
                    <ha-input
                        type="number"
                        label="Z-Index"
                        .value=${this._lineFormData.z_index!=null?String(this._lineFormData.z_index):""}
                        @input=${c=>{const d=c.target.value;this._lineFormData.z_index=d===""?null:Number(d),this.requestUpdate()}}
                        hint="Higher values paint on top. Leave blank to use the default (100, so lines paint under controls).">
                    </ha-input>
                </lcards-form-section>
            </div>
        `}_renderLineFormRouting(){const e=this._lineFormData.route||"auto",t={direct:{icon:"mdi:vector-line",title:"Direct",description:"Straight line from source to target"},manual:{icon:"mdi:map-marker-path",title:"Manual",description:"Draw custom path through explicit waypoints"},auto:{icon:"mdi:routes",title:"Auto",description:"Full pathfinding: obstacle avoidance, trunk bundling with nearby lines, and crossing avoidance, always, whether or not obstacles/channels are present"},manhattan:{icon:"mdi:vector-polyline",title:"Manhattan (Advanced)",description:"A fixed single-bend elbow shape: no pathfinding, no obstacle avoidance, no bundling, no crossing avoidance. The cheap, fully predictable opt-out from Auto."},grid:{icon:"mdi:grid",title:"Grid (Advanced)",description:"Same full pathfinding as Auto: obstacle avoidance, bundling, crossing avoidance, but skips the extra local-search refinement pass Auto/Smart adds on top."}},i=t[e]||t.auto;let o="";if(e==="auto"){const s=this._getControlOverlays().some(a=>a.obstacle===true);this._lineFormData.route_channels&&this._lineFormData.route_channels.length>0?o="This line routes through its configured channel(s).":s?o="Obstacles are present on this card, so this line will avoid them.":o="No obstacles or channels on this card: a direct path with no avoidance needed. Still bundles with nearby parallel lines and avoids crossing them."}return v`
            <div class="subform-field-stack">
                <!-- Routing Mode -->
                <lcards-form-section
                    header="Routing Mode"
                    description="How the line is drawn between points"
                    icon="mdi:routes"
                    ?expanded=${true}>

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{select:{mode:"dropdown",options:[{value:"auto",label:"Auto (Recommended)"},{value:"direct",label:"Direct (Straight line)"},{value:"manual",label:"Manual (Custom waypoints)"},{value:"manhattan",label:"Manhattan (Advanced: opt out of bundling)"},{value:"grid",label:"Grid (Advanced: skip refinement pass)"}]}}}
                        .value=${e}
                        .label=${"Route"}
                        @value-changed=${s=>{this._lineFormData.route=s.detail.value,this.requestUpdate()}}>
                    </ha-selector>

                    <!-- Info Panel -->
                    <lcards-message
                        type="info"
                        .title=${i.title}
                        .message=${i.description}
                        style="margin-top: 12px;">
                    </lcards-message>

                    ${e==="auto"?v`
                        <lcards-message
                            type="tip"
                            .title=${"What this line will do"}
                            .message=${o}>
                        </lcards-message>
                    `:""}

                    ${e==="manhattan"?v`
                        <lcards-message
                            type="warning"
                            .title=${"Opting out of bundling and crossing avoidance"}
                            .message=${"This line won't bundle with nearby parallel lines, won't avoid obstacles, and won't avoid crossing other lines. Its geometry still registers, so other Auto/Smart/Grid lines can bundle alongside it or avoid crossing it."}>
                        </lcards-message>
                    `:""}

                    ${e==="grid"?v`
                        <lcards-message
                            type="tip"
                            .title=${"What this line will do"}
                            .message=${"Same bundling, crossing avoidance, and obstacle avoidance as Auto, just without the extra refinement pass. Rarely needed; use Auto unless you have a specific reason to skip refinement."}>
                        </lcards-message>
                    `:""}

                    ${e==="auto"||e==="direct"?v`
                        <ha-button
                            @click=${()=>this._convertLineToManual(this._lineFormData.id)}
                            size="s">
                            <ha-icon icon="mdi:content-save-edit" slot="start"></ha-icon>
                            Freeze to Manual Mode
                        </ha-button>
                        <div class="hint">
                            Convert current auto-routed path to manual waypoints
                        </div>
                    `:""}
                </lcards-form-section>

                ${e==="auto"?v`
                    <!-- Routing Hints (only for Auto mode) -->
                    <lcards-form-section
                        header="Flow Direction Preferences"
                        description="Hint the router to prefer horizontal or vertical segments"
                        icon="mdi:arrow-decision"
                        ?expanded=${false}>

                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{select:{options:[{value:"",label:"Auto (No preference)"},{value:"xy",label:"Horizontal First (xy)"},{value:"yx",label:"Vertical First (yx)"}]}}}
                            .value=${this._lineFormData.route_hint||""}
                            .label=${"Initial Direction"}
                            helper="xy = horizontal then vertical, yx = vertical then horizontal"
                            @value-changed=${s=>{const r=s.detail.value;r===""?delete this._lineFormData.route_hint:this._lineFormData.route_hint=r,this.requestUpdate()}}>
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{select:{options:[{value:"",label:"Auto (No preference)"},{value:"xy",label:"Horizontal Last (xy)"},{value:"yx",label:"Vertical Last (yx)"}]}}}
                            .value=${this._lineFormData.route_hint_last||""}
                            .label=${"Final Direction"}
                            helper="xy = horizontal then vertical, yx = vertical then horizontal"
                            @value-changed=${s=>{const r=s.detail.value;r===""?delete this._lineFormData.route_hint_last:this._lineFormData.route_hint_last=r,this.requestUpdate()}}
                            style="margin-top: 12px;">
                        </ha-selector>
                    </lcards-form-section>
                `:""}

                <!-- Manual Waypoints -->
                ${this._lineFormData.route==="manual"?v`
                        <lcards-form-section
                            header="Waypoints"
                            description="Define explicit path coordinates"
                            icon="mdi:map-marker-path"
                            ?expanded=${true}>

                            <!-- Waypoint List -->
                            <div style="margin-bottom: 12px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                    <span style="font-weight: 500;">Waypoints (${(this._lineFormData.waypoints||[]).length})</span>
                                    <ha-button
                                        @click=${()=>{var l;this._lineFormData.waypoints||(this._lineFormData.waypoints=[]);const s=((l=this._workingConfig.msd)==null?void 0:l.view_box)||this._extractedViewBox||[0,0,1920,1080],r=s[0]+s[2]/2,a=s[1]+s[3]/2;this._lineFormData.waypoints.push([r,a]),this._waypointEditingLineId=this._lineFormData.id,this._showWaypointMarkers=true,this.requestUpdate()}}
                                        size="s">
                                        <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                                        Add Waypoint
                                    </ha-button>
                                </div>

                                ${(this._lineFormData.waypoints||[]).length>0?v`
                                    <div style="display: flex; flex-direction: column; gap: 8px;">
                                        ${(this._lineFormData.waypoints||[]).map((s,r)=>v`
                                            <div style="
                                                display: flex;
                                                align-items: center;
                                                gap: 12px;
                                                padding: 12px;
                                                background: var(--card-background-color);
                                                border-radius: 42px;
                                                border: 1px solid ${this._draggedWaypointIndex===r?"var(--primary-color)":"var(--divider-color)"};
                                                opacity: ${this._draggedWaypointIndex===r?"0.5":"1"};
                                                transition: opacity 0.2s, border-color 0.2s;
                                                cursor: ${this._draggedWaypointIndex===r?"grabbing":"grab"};
                                            "
                                            draggable="true"
                                            @dragstart=${a=>this._handleWaypointDragStart(a,r)}
                                            @dragend=${a=>this._handleWaypointDragEnd(a)}
                                            @dragover=${a=>this._handleWaypointDragOver(a,r)}
                                            @drop=${a=>this._handleWaypointDrop(a,r)}>
                                                <!-- Drag Handle -->
                                                <ha-icon
                                                    icon="mdi:drag-vertical"
                                                    style="
                                                        --mdc-icon-size: 20px;
                                                        color: var(--secondary-text-color);
                                                        flex-shrink: 0;
                                                    "
                                                    title="Drag to reorder">
                                                </ha-icon>

                                                <!-- Index Badge -->
                                                <div style="
                                                    min-width: 28px;
                                                    height: 28px;
                                                    display: flex;
                                                    align-items: center;
                                                    justify-content: center;
                                                    font-weight: 600;
                                                    font-size: 13px;
                                                    color: white;
                                                    background: var(--primary-color);
                                                    border-radius: 50%;
                                                    flex-shrink: 0;
                                                ">${r+1}</div>

                                                <!-- Waypoint Content (Coordinates or Named Anchor) -->
                                                ${typeof s=="string"?v`
                                                    <!-- Named Anchor -->
                                                    <ha-input
                                                        label="Anchor"
                                                        .value=${s}
                                                        @input=${a=>{this._lineFormData.waypoints[r]=a.target.value,this._schedulePreviewUpdate(),this.requestUpdate()}}
                                                        style="flex: 1; min-width: 120px;">
                                                    </ha-input>
                                                `:v`
                                                    <!-- Coordinates -->
                                                    <div style="flex: 1; display: flex; gap: 8px; min-width: 0;">
                                                        <ha-input
                                                            type="number"
                                                            label="X"
                                                            .value=${String(s[0]||0)}
                                                            @input=${a=>{this._lineFormData.waypoints[r][0]=this._roundToPrecision(Number(a.target.value)),this._schedulePreviewUpdate(),this.requestUpdate()}}
                                                            style="flex: 1; min-width: 80px;">
                                                        </ha-input>
                                                        <ha-input
                                                            type="number"
                                                            label="Y"
                                                            .value=${String(s[1]||0)}
                                                            @input=${a=>{this._lineFormData.waypoints[r][1]=this._roundToPrecision(Number(a.target.value)),this._schedulePreviewUpdate(),this.requestUpdate()}}
                                                            style="flex: 1; min-width: 80px;">
                                                        </ha-input>
                                                        <ha-input
                                                            type="number"
                                                            label=${this._lineFormData.corner_style==="bevel"?"Cut Size":"Radius"}
                                                            .value=${String(s[2]??"")}
                                                            @input=${a=>{const l=a.target.value,c=this._lineFormData.waypoints[r];if(l==="")c.length>=3&&c.splice(2,c.length-2);else{const d=Math.max(0,this._roundToPrecision(Number(l)));c.length>=3?c[2]=d:c.push(d)}this._schedulePreviewUpdate(),this.requestUpdate()}}
                                                            style="flex: 0.8; min-width: 70px;"
                                                            title="Overrides this corner's ${this._lineFormData.corner_style==="bevel"?"cut size":"radius"}. Blank inherits the line default (${this._lineFormData.corner_radius??34})">
                                                        </ha-input>
                                                    </div>
                                                `}

                                                <!-- Toggle Type Button -->
                                                <ha-icon-button
                                                    @click=${()=>{var a;if(typeof s=="string"){const l=((a=this._workingConfig.msd)==null?void 0:a.view_box)||this._extractedViewBox||[0,0,1920,1080];this._lineFormData.waypoints[r]=[l[0]+l[2]/2,l[1]+l[3]/2]}else this._lineFormData.waypoints[r]="";this._schedulePreviewUpdate(),this.requestUpdate()}}
                                                    .label=${typeof s=="string"?"Switch to coordinates":"Switch to anchor"}
                                                    style="flex-shrink: 0;">
                                                    <ha-icon icon="${typeof s=="string"?"mdi:map-marker-outline":"mdi:crosshairs-gps"}"></ha-icon>
                                                </ha-icon-button>

                                                <!-- Delete Button -->
                                                <ha-icon-button
                                                    @click=${()=>{this._lineFormData.waypoints.splice(r,1),this._schedulePreviewUpdate(),this.requestUpdate()}}
                                                    .label=${"Delete waypoint"}
                                                    style="flex-shrink: 0;">
                                                    <ha-icon icon="mdi:delete"></ha-icon>
                                                </ha-icon-button>
                                            </div>
                                        `)}
                                    </div>
                                `:v`
                                    <div style="padding: 16px; text-align: center; color: var(--secondary-text-color); font-size: 0.875rem; border: 1px dashed var(--divider-color); border-radius: 12px;">
                                        No waypoints defined. Click "Add Waypoint" to begin.
                                    </div>
                                `}
                            </div>

                        </lcards-form-section>
                    `:""}

                    <!-- Channel Routing (only for auto/direct modes) -->
                    ${e!=="manual"?this._renderChannelRoutingOptions():""}

                    <!-- Auto Routing: Clearance -->
                    ${e==="auto"?v`
                        <lcards-form-section
                            header="Advanced Options"
                            description="Fine-tune pathfinding behavior"
                            icon="mdi:cog"
                            ?expanded=${false}>

                            <ha-input
                                type="number"
                                label="Clearance (vb units)"
                                .value=${String(this._lineFormData.clearance||"")}
                                @input=${s=>{const r=s.target.value;r===""?delete this._lineFormData.clearance:this._lineFormData.clearance=Number(r),this.requestUpdate()}}
                                hint="Minimum distance from obstacles, vb units (leave empty for default: 8)"
                                style="width: 100%;">
                            </ha-input>

                            <ha-input
                                type="number"
                                label="Stub Length (vb units)"
                                .value=${String(this._lineFormData.stub_length??"")}
                                @input=${s=>{const r=s.target.value;r===""?delete this._lineFormData.stub_length:this._lineFormData.stub_length=Number(r),this.requestUpdate()}}
                                hint="Overrides the mandatory departure/arrival stub length (leave empty to use the router's own auto/forced resolution: see Corner Size Mode on the Style tab). Going below one grid cell risks re-triggering an internal same-cell short-circuit; check window.lcards.debug.msd.routing.inspect(id).meta.debug for the router's resolved value first."
                                style="width: 100%; margin-top: 12px;">
                            </ha-input>

                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number:{min:0,max:20,step:1,mode:"slider"}}}
                                .value=${this._lineFormData.corner_room_weight??4}
                                .label=${"Corner Room Weight"}
                                @value-changed=${s=>{this._lineFormData.corner_room_weight=s.detail.value,this.requestUpdate()}}
                                helper="How hard this line fights to keep its full Corner Radius when a tight detour would otherwise squash it: 0 = never bend the route for it (this line opts out), higher = more willing to accept a longer or more-bent route to keep corners full. Card-wide default is 4; a line with a small custom Corner Radius may need a higher value for a similar effect."
                                style="margin-top: 12px;">
                            </ha-selector>
                        </lcards-form-section>
                    `:""}
            </div>
        `}_getLineColorEditorAdapter(){const e=this;return{hass:this.hass,config:this._lineFormData,_getConfigValue(t){return t.split(".").reduce((i,o)=>i==null?void 0:i[o],e._lineFormData)},_setConfigValue(t,i){const o=t.split("."),s=o.pop();let r=e._lineFormData;for(const a of o)(!r[a]||typeof r[a]!="object")&&(r[a]={}),r=r[a];r[s]=i,e.requestUpdate()}}}_renderLineColorSection(){var s,r;const e=this._lineFormData.entity||"",t=e&&((r=(s=this.hass)==null?void 0:s.states)!=null&&r[e])?Object.keys(this.hass.states[e].attributes||{}).sort().map(a=>({value:a,label:a})):[],i=[...t],o=i.findIndex(a=>a.value==="brightness");return o>=0&&i.splice(o+1,0,{value:"brightness_pct",label:"brightness_pct  (auto 0–100%)"}),v`
            <div style="margin-bottom: 12px;">
                <ha-selector
                    .hass=${this.hass}
                    .selector=${{entity:{}}}
                    .value=${e}
                    .label=${"Entity"}
                    .helper=${"Bind this line's color to an entity's state (optional). Leave blank for a fixed color"}
                    @value-changed=${a=>{this._lineFormData.entity=a.detail.value||"",this.requestUpdate()}}
                    style="display: block; margin-bottom: 12px;">
                </ha-selector>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"State Attribute"}
                        .helper=${"Match this attribute's value instead of raw entity state"}
                        .disabled=${!e}
                        .selector=${{select:{mode:"dropdown",options:[{value:"__none__",label:"(Use entity state)"},...t],custom_value:true}}}
                        .value=${this._lineFormData.state_attribute||"__none__"}
                        @value-changed=${a=>{const l=(a.detail.value??"").trim();this._lineFormData.state_attribute=l==="__none__"||!l?"":l,this.requestUpdate()}}>
                    </ha-selector>
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Range Attribute"}
                        .helper=${"Attribute compared against above:/below:/between: keys"}
                        .disabled=${!e}
                        .selector=${{select:{mode:"dropdown",options:[{value:"__none__",label:"(Use entity state)"},...i],custom_value:true}}}
                        .value=${this._lineFormData.ranges_attribute||"__none__"}
                        @value-changed=${a=>{let l=(a.detail.value??"").trim();l==="brightness"&&(l="brightness_pct"),this._lineFormData.ranges_attribute=l==="__none__"||!l?"":l,this.requestUpdate()}}>
                    </ha-selector>
                </div>

                <lcards-color-section-v2
                    .editor=${this._getLineColorEditorAdapter()}
                    .config=${this._lineFormData}
                    .entityId=${e}
                    basePath="style.color"
                    header="Line Color"
                    description="Fixed color, or add state/range keys to bind it to the entity above"
                    ?expanded=${true}>
                </lcards-color-section-v2>
            </div>
        `}_renderMarkerColorField(e,t,i){var r;const o=((r=this._lineFormData.style)==null?void 0:r[e])||{},s=o[t]==="match_line";return v`
            <div>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <div style="font-size: 14px; font-weight: 500; color: var(--primary-text-color);">${i}</div>
                    <ha-switch
                        .checked=${s}
                        @change=${a=>{this._lineFormData.style={...this._lineFormData.style,[e]:{...this._lineFormData.style[e],[t]:a.target.checked?"match_line":""}},this.requestUpdate()}}>Match Line Color</ha-switch>
                </div>
                ${s?"":v`
                    <lcards-color-picker
                        .hass=${this.hass}
                        .value=${o[t]||""}
                        ?showPreview=${true}
                        @value-changed=${a=>{this._lineFormData.style={...this._lineFormData.style,[e]:{...this._lineFormData.style[e],[t]:a.detail.value}},this.requestUpdate()}}>
                    </lcards-color-picker>
                `}
            </div>
        `}_renderMarkerAlignField(e){var i;const t=((i=this._lineFormData.style)==null?void 0:i[e])||{};return["arrow","triangle","diamond","rect","square"].includes(t.type)?v`
            <ha-selector
                style="display: block; margin-top: 12px;"
                .hass=${this.hass}
                .selector=${{select:{mode:"dropdown",options:[{value:"center",label:"Center (default)"},{value:"edge",label:"Edge (projects past line end; hides thick-line overshoot)"}]}}}
                .value=${t.align==="edge"?"edge":"center"}
                .label=${"Attach Point"}
                .helper=${"Edge hides thick-line overshoot but extends past the anchor point; use Center if the marker must land exactly on it"}
                @value-changed=${o=>{this._lineFormData.style={...this._lineFormData.style,[e]:{...this._lineFormData.style[e],align:o.detail.value}},this.requestUpdate()}}>
            </ha-selector>
        `:""}_renderLineFormMarkers(){var e,t,i,o,s,r,a,l;return v`
            <div class="subform-field-stack">
                <!-- Start/End Marker side-by-side (independent/parallel settings, see Phase 6.5) -->
                <div class="subform-columns-2">
                <lcards-form-section
                    header="Start Marker"
                    description="Marker at the beginning of the line"
                    icon="mdi:map-marker-plus"
                    ?expanded=${true}>

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{select:{mode:"dropdown",options:[{value:"none",label:"None"},{value:"arrow",label:"Arrow"},{value:"dot",label:"Dot"},{value:"diamond",label:"Diamond"},{value:"line",label:"Line (Orthogonal)"},{value:"rect",label:"Rectangle"}]}}}
                        .value=${((t=(e=this._lineFormData.style)==null?void 0:e.marker_start)==null?void 0:t.type)||"none"}
                        .label=${"Type"}
                        @value-changed=${c=>{var h,p;const d=c.detail.value;if(d==="none"){const{marker_start:g,..._}=this._lineFormData.style||{};this._lineFormData.style=_}else{const g=((p=(h=this._lineFormData.style)==null?void 0:h.marker_start)==null?void 0:p.size)??10;this._lineFormData.style={...this._lineFormData.style,marker_start:{type:d,size:g}}}this.requestUpdate()}}>
                    </ha-selector>

                    ${(o=(i=this._lineFormData.style)==null?void 0:i.marker_start)!=null&&o.type&&this._lineFormData.style.marker_start.type!=="none"?v`
                        <ha-input
                            type="number"
                            label="Size (vb units)"
                            .value=${String(this._lineFormData.style.marker_start.size??10)}
                            step="1"
                            min="1"
                            style="margin-top: 12px;"
                            @input=${c=>{this._lineFormData.style={...this._lineFormData.style,marker_start:{...this._lineFormData.style.marker_start,size:Number(c.target.value)||10}},this.requestUpdate()}}>
                        </ha-input>

                        ${this._lineFormData.style.marker_start.type==="rect"?v`
                            <ha-selector
                                style="display: block; margin-top: 12px;"
                                .hass=${this.hass}
                                .label=${"Filled"}
                                .selector=${{boolean:{}}}
                                .value=${this._lineFormData.style.marker_start.filled===true}
                                @value-changed=${c=>{this._lineFormData.style={...this._lineFormData.style,marker_start:{...this._lineFormData.style.marker_start,filled:c.detail.value}},this.requestUpdate()}}>
                            </ha-selector>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
                                <ha-input
                                    type="number"
                                    label="Width (vb units)"
                                    .value=${String(this._lineFormData.style.marker_start.width??this._lineFormData.style.marker_start.size??10)}
                                    step="1"
                                    min="1"
                                    @input=${c=>{this._lineFormData.style={...this._lineFormData.style,marker_start:{...this._lineFormData.style.marker_start,width:Number(c.target.value)||10}},this.requestUpdate()}}>
                                </ha-input>
                                <ha-input
                                    type="number"
                                    label="Height (vb units)"
                                    .value=${String(this._lineFormData.style.marker_start.height??this._lineFormData.style.marker_start.size??10)}
                                    step="1"
                                    min="1"
                                    @input=${c=>{this._lineFormData.style={...this._lineFormData.style,marker_start:{...this._lineFormData.style.marker_start,height:Number(c.target.value)||10}},this.requestUpdate()}}>
                                </ha-input>
                            </div>
                        `:""}

                        ${this._renderMarkerAlignField("marker_start")}

                        <div style="margin-top: 12px;">
                            ${this._renderMarkerColorField("marker_start","fill","Fill Color")}
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 120px; gap: 12px; margin-top: 12px;">
                            ${this._renderMarkerColorField("marker_start","stroke","Stroke Color")}

                            <ha-input
                                type="number"
                                label="Stroke Width"
                                .value=${String(this._lineFormData.style.marker_start.stroke_width||0)}
                                @input=${c=>{this._lineFormData.style={...this._lineFormData.style,marker_start:{...this._lineFormData.style.marker_start,stroke_width:Number(c.target.value)||0}},this.requestUpdate()}}>
                            </ha-input>
                        </div>
                    `:""}
                </lcards-form-section>

                <lcards-form-section
                    header="End Marker"
                    description="Marker at the end of the line"
                    icon="mdi:map-marker-check"
                    ?expanded=${true}>

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{select:{mode:"dropdown",options:[{value:"none",label:"None"},{value:"arrow",label:"Arrow"},{value:"dot",label:"Dot"},{value:"diamond",label:"Diamond"},{value:"line",label:"Line (Orthogonal)"},{value:"rect",label:"Rectangle"}]}}}
                        .value=${((r=(s=this._lineFormData.style)==null?void 0:s.marker_end)==null?void 0:r.type)||"none"}
                        .label=${"Type"}
                        @value-changed=${c=>{var h,p;const d=c.detail.value;if(d==="none")this._lineFormData.style={...this._lineFormData.style,marker_end:null};else{const g=((p=(h=this._lineFormData.style)==null?void 0:h.marker_end)==null?void 0:p.size)??10;this._lineFormData.style={...this._lineFormData.style,marker_end:{type:d,size:g}}}this.requestUpdate()}}>
                    </ha-selector>

                    ${(l=(a=this._lineFormData.style)==null?void 0:a.marker_end)!=null&&l.type&&this._lineFormData.style.marker_end.type!=="none"?v`
                        <ha-input
                            type="number"
                            label="Size (vb units)"
                            .value=${String(this._lineFormData.style.marker_end.size??10)}
                            step="1"
                            min="1"
                            style="margin-top: 12px;"
                            @input=${c=>{this._lineFormData.style={...this._lineFormData.style,marker_end:{...this._lineFormData.style.marker_end,size:Number(c.target.value)||10}},this.requestUpdate()}}>
                        </ha-input>

                        ${this._lineFormData.style.marker_end.type==="rect"?v`
                            <ha-selector
                                style="display: block; margin-top: 12px;"
                                .hass=${this.hass}
                                .label=${"Filled"}
                                .selector=${{boolean:{}}}
                                .value=${this._lineFormData.style.marker_end.filled===true}
                                @value-changed=${c=>{this._lineFormData.style={...this._lineFormData.style,marker_end:{...this._lineFormData.style.marker_end,filled:c.detail.value}},this.requestUpdate()}}>
                            </ha-selector>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
                                <ha-input
                                    type="number"
                                    label="Width (vb units)"
                                    .value=${String(this._lineFormData.style.marker_end.width??this._lineFormData.style.marker_end.size??10)}
                                    step="1"
                                    min="1"
                                    @input=${c=>{this._lineFormData.style={...this._lineFormData.style,marker_end:{...this._lineFormData.style.marker_end,width:Number(c.target.value)||10}},this.requestUpdate()}}>
                                </ha-input>
                                <ha-input
                                    type="number"
                                    label="Height (vb units)"
                                    .value=${String(this._lineFormData.style.marker_end.height??this._lineFormData.style.marker_end.size??10)}
                                    step="1"
                                    min="1"
                                    @input=${c=>{this._lineFormData.style={...this._lineFormData.style,marker_end:{...this._lineFormData.style.marker_end,height:Number(c.target.value)||10}},this.requestUpdate()}}>
                                </ha-input>
                            </div>
                        `:""}

                        ${this._renderMarkerAlignField("marker_end")}

                        <div style="margin-top: 12px;">
                            ${this._renderMarkerColorField("marker_end","fill","Fill Color")}
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 120px; gap: 12px; margin-top: 12px;">
                            ${this._renderMarkerColorField("marker_end","stroke","Stroke Color")}

                            <ha-input
                                type="number"
                                label="Stroke Width"
                                .value=${String(this._lineFormData.style.marker_end.stroke_width||0)}
                                @input=${c=>{this._lineFormData.style={...this._lineFormData.style,marker_end:{...this._lineFormData.style.marker_end,stroke_width:Number(c.target.value)||0}},this.requestUpdate()}}>
                            </ha-input>
                        </div>
                    `:""}
                </lcards-form-section>
                </div>
            </div>
        `}_renderLineFormAnimation(){const e=this._editingLineId||this._lineFormData.id;return v`
            <div class="subform-field-stack">
                <lcards-form-section
                    header="Line Animations"
                    description="Configure animations for this line"
                    icon="mdi:animation"
                    ?expanded=${true}>

                    <lcards-animation-editor
                        .hass=${this.hass}
                        .animations=${this._lineFormData.animations||[]}
                        .cardElement=${this._getLivePreviewCardElement()}
                        .searchRootSelector=${e?`[data-overlay-id="${e}"]`:""}
                        @animations-changed=${t=>{this._lineFormData.animations=t.detail.value,this.requestUpdate()}}
                        @refresh-targets=${()=>this.requestUpdate()}
                    ></lcards-animation-editor>
                </lcards-form-section>
            </div>
        `}_renderLineFormStyle(){var o,s,r,a,l,c,d,h;const e=((o=this._lineFormData.style)==null?void 0:o.dash_array)||"";let t="solid";return e==="5,5"?t="dashed":e==="2,2"||e==="0,4"?t="dotted":e==="8,4,2,4"||e==="8,4,0,4"?t="dash-dot":e&&e!==""&&(t="custom"),[...(((s=this._workingConfig.msd)==null?void 0:s.animations)||[]).map(p=>({value:p.id,label:p.id}))],v`
            <div class="subform-field-stack">
                <!-- Color & Entity Binding (full width - pulled out of Line Style so the two
                     columns below stay balanced in height; see Phase 6.5) -->
                <lcards-form-section
                    header="Color"
                    description="Entity/state binding and color"
                    icon="mdi:palette"
                    ?expanded=${true}>
                    ${this._renderLineColorSection()}
                </lcards-form-section>

                <!-- Line Style / Line Shape stacked one-per-row (not the shared
                     .subform-columns-2's default 1fr-1fr) - side by side caused
                     horizontal scroll here, especially with the advanced stroke
                     properties section expanded. -->
                <div class="subform-columns-2" style="grid-template-columns: 1fr;">

                    <!-- Left Column: Width, Style -->
                    <lcards-form-section
                        header="Line Style"
                        description="Width, opacity and dash pattern"
                        icon="mdi:ruler"
                        ?expanded=${true}>

                        <!-- Width Slider -->
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{number:{min:1,max:30,step:.5,mode:"slider"}}}
                            .value=${((r=this._lineFormData.style)==null?void 0:r.width)||2}
                            .label=${"Width"}
                            @value-changed=${p=>{this._lineFormData.style={...this._lineFormData.style,width:p.detail.value},this.requestUpdate()}}
                            style="margin-top: 12px;">
                        </ha-selector>

                        <!-- Opacity Slider -->
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{number:{min:0,max:1,step:.01,mode:"slider"}}}
                            .value=${((a=this._lineFormData.style)==null?void 0:a.opacity)??1}
                            .label=${"Opacity"}
                            @value-changed=${p=>{this._lineFormData.style={...this._lineFormData.style,opacity:p.detail.value},this.requestUpdate()}}
                            helper="Line opacity (0 = transparent, 1 = opaque)"
                            style="margin-top: 12px;">
                        </ha-selector>

                        <!-- Line Style Dropdown -->
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{select:{options:[{value:"solid",label:"Solid"},{value:"dashed",label:"Dashed"},{value:"dotted",label:"Dotted"},{value:"dash-dot",label:"Dash-Dot"},{value:"custom",label:"Custom"}]}}}
                            .value=${t}
                            .label=${"Style"}
                            @value-changed=${p=>{var y;const g=p.detail.value;let _="",f=(y=this._lineFormData.style)==null?void 0:y.line_cap;g==="dashed"?_="5,5":g==="dotted"?(_="0,4",f="round"):g==="dash-dot"?(_="8,4,0,4",f="round"):g==="solid"&&(_=""),g!=="custom"&&(this._lineFormData.style={...this._lineFormData.style,dash_array:_,line_cap:f},this.requestUpdate())}}
                            style="margin-top: 12px;">
                        </ha-selector>

                        <!-- Dash Pattern Customization (conditional - all non-solid presets) -->
                        ${t!=="solid"?v`
                            <lcards-form-section
                                header="${t==="custom"?"Custom":"Customize"} Dash Pattern"
                                icon="mdi:dots-horizontal"
                                ?nested=${true}
                                ?expanded=${true}>

                                <!-- Parse existing dash_array -->
                                ${(()=>{const p=(e||"").split(",").map(w=>parseFloat(w.trim())||0),g=p[0]??5,_=p[1]??5,f=p[2]||0,y=p[3]||0;return v`
                                        <!-- Dash 1 -->
                                        <ha-selector
                                            .hass=${this.hass}
                                            .selector=${{number:{min:0,max:50,step:1,mode:"slider"}}}
                                            .value=${g}
                                            .label=${"Dash Length"}
                                            @value-changed=${w=>{const x=w.detail.value;let $;f>0?$=`${x},${_},${f},${y}`:$=`${x},${_}`,this._lineFormData.style={...this._lineFormData.style,dash_array:$},this.requestUpdate()}}>
                                        </ha-selector>

                                        <!-- Gap 1 -->
                                        <ha-selector
                                            .hass=${this.hass}
                                            .selector=${{number:{min:0,max:50,step:1,mode:"slider"}}}
                                            .value=${_}
                                            .label=${"Gap Length"}
                                            @value-changed=${w=>{const x=w.detail.value;let $;f>0?$=`${g},${x},${f},${y}`:$=`${g},${x}`,this._lineFormData.style={...this._lineFormData.style,dash_array:$},this.requestUpdate()}}
                                            style="margin-top: 12px;">
                                        </ha-selector>

                                        <!-- Toggle for complex pattern (only show for simple patterns) -->
                                        ${t==="dotted"||t==="dashed"||t==="custom"?v`
                                            <ha-selector
                                                style="margin-top: 12px; display: block;"
                                                .hass=${this.hass}
                                                .label=${"Add secondary dash/gap"}
                                                .selector=${{boolean:{}}}
                                                .value=${f>0}
                                                @value-changed=${w=>{w.detail.value?this._lineFormData.style={...this._lineFormData.style,dash_array:`${g},${_},2,2`}:this._lineFormData.style={...this._lineFormData.style,dash_array:`${g},${_}`},this.requestUpdate()}}>
                                            </ha-selector>
                                        `:""}

                                        ${f>0?v`
                                            <!-- Dash 2 -->
                                            <ha-selector
                                                .hass=${this.hass}
                                                .selector=${{number:{min:0,max:50,step:1,mode:"slider"}}}
                                                .value=${f}
                                                .label=${"Secondary Dash"}
                                                @value-changed=${w=>{const x=w.detail.value,$=`${g},${_},${x},${y}`;this._lineFormData.style={...this._lineFormData.style,dash_array:$},this.requestUpdate()}}
                                                style="margin-top: 12px;">
                                            </ha-selector>

                                            <!-- Gap 2 -->
                                            <ha-selector
                                                .hass=${this.hass}
                                                .selector=${{number:{min:0,max:50,step:1,mode:"slider"}}}
                                                .value=${y}
                                                .label=${"Secondary Gap"}
                                                @value-changed=${w=>{const x=w.detail.value,$=`${g},${_},${f},${x}`;this._lineFormData.style={...this._lineFormData.style,dash_array:$},this.requestUpdate()}}
                                                style="margin-top: 12px;">
                                            </ha-selector>
                                        `:""}

                                        <!-- Current Pattern Display -->
                                        <div style="margin-top: 12px; font-size: 12px; color: var(--secondary-text-color); font-family: monospace;">
                                            Pattern: ${f>0?`${g},${_},${f},${y}`:`${g},${_}`}
                                        </div>
                                    `})()}
                            </lcards-form-section>
                        `:""}
                    </lcards-form-section>

                    <!-- Right Column: Line Shape -->
                    <lcards-form-section
                        header="Line Shape"
                        description="Corner and smoothing settings"
                        icon="mdi:vector-curve"
                        ?expanded=${true}>

                    <div class="subform-columns-2">
                        <!-- Left Column: Corner Settings -->
                        <div>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select:{options:[{value:"miter",label:"Miter (Sharp)"},{value:"round",label:"Round (Arc)"},{value:"bevel",label:"Bevel (Cut)"}]}}}
                                .value=${this._lineFormData.corner_style||"round"}
                                .label=${"Corner Style"}
                                @value-changed=${p=>{this._lineFormData.corner_style=p.detail.value,this.requestUpdate()}}>
                            </ha-selector>

                            ${this._lineFormData.corner_style==="round"?v`
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{number:{min:0,max:100,step:1,mode:"slider",unit_of_measurement:"vb"}}}
                                    .value=${this._lineFormData.corner_radius??34}
                                    .label=${"Corner Radius"}
                                    @value-changed=${p=>{this._lineFormData.corner_radius=p.detail.value,this.requestUpdate()}}
                                    helper="Arc radius for rounded corners (default: 34)"
                                    style="margin-top: 12px;">
                                </ha-selector>
                            `:""}

                            ${this._lineFormData.corner_style==="bevel"?v`
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{number:{min:0,max:100,step:1,mode:"slider",unit_of_measurement:"vb"}}}
                                    .value=${this._lineFormData.corner_radius??34}
                                    .label=${"Cut Size"}
                                    @value-changed=${p=>{this._lineFormData.corner_radius=p.detail.value,this.requestUpdate()}}
                                    helper="Diagonal chamfer cut size, same concept as the elbow card's corner size (default: 34)"
                                    style="margin-top: 12px;">
                                </ha-selector>
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{number:{min:0,max:90,step:1,mode:"slider",unit_of_measurement:"°"}}}
                                    .value=${this._lineFormData.corner_angle??45}
                                    .label=${"Cut Angle"}
                                    @value-changed=${p=>{this._lineFormData.corner_angle=p.detail.value,this.requestUpdate()}}
                                    helper="45° = symmetric diagonal, 0°/90° = flush with one edge (no visible cut) (default: 45)"
                                    style="margin-top: 12px;">
                                </ha-selector>
                            `:""}

                            ${this._lineFormData.corner_style==="round"||this._lineFormData.corner_style==="bevel"?v`
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{select:{options:[{value:"auto",label:"Auto (target size)"},{value:"forced",label:"Forced (always full size)"}]}}}
                                    .value=${this._lineFormData.corner_radius_mode||"auto"}
                                    .label=${"Corner Size Mode"}
                                    @value-changed=${p=>{this._lineFormData.corner_radius_mode=p.detail.value,this.requestUpdate()}}
                                    helper=${this._lineFormData.corner_radius_mode==="forced"?"Forced always reserves the full corner size, which can cause routing detours or line crossings near tight geometry.":"Auto (recommended): corner size may shrink so the router stays free to avoid forcing a detour or an unnecessary line crossing."}
                                    style="margin-top: 12px;">
                                </ha-selector>
                            `:""}

                            ${this._lineFormData.corner_style==="miter"?v`
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{number:{min:1,max:20,step:.5,mode:"slider"}}}
                                    .value=${this._lineFormData.miter_limit||4}
                                    .label=${"Miter Limit"}
                                    @value-changed=${p=>{this._lineFormData.miter_limit=p.detail.value,this.requestUpdate()}}
                                    helper="Max ratio before clipping sharp corners (default: 4)"
                                    style="margin-top: 12px;">
                                </ha-selector>
                            `:""}

                        <!-- Smoothing Settings -->
                        <ha-selector
                                .hass=${this.hass}
                                .selector=${{select:{options:[{value:"none",label:"None"},{value:"chaikin",label:"Chaikin (Corner-cutting)"}]}}}
                                .value=${this._lineFormData.smoothing_mode||"none"}
                                .label=${"Smoothing Mode"}
                                @value-changed=${p=>{this._lineFormData.smoothing_mode=p.detail.value,this.requestUpdate()}}
                                style="margin-top: 16px;">
                            </ha-selector>

                            ${this._lineFormData.smoothing_mode==="chaikin"?v`
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{number:{min:0,max:5,step:1,mode:"slider"}}}
                                    .value=${this._lineFormData.smoothing_iterations||0}
                                    .label=${"Smoothing Iterations"}
                                    @value-changed=${p=>{this._lineFormData.smoothing_iterations=p.detail.value,this.requestUpdate()}}
                                    helper="More iterations = smoother curves (default: 0)"
                                    style="margin-top: 12px;">
                                </ha-selector>
                            `:""}
                    </lcards-form-section>
                </div>

                <!-- Advanced Stroke Properties (Full Width) -->
                <lcards-form-section
                    header="Advanced stroke properties"
                    description="Fine-tune SVG stroke rendering (for advanced users)"
                    icon="mdi:cog"
                    ?expanded=${false}>

                    <div class="subform-columns-2">
                        <!-- Left Column -->
                        <div>
                            <!-- Line Cap -->
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select:{options:[{value:"butt",label:"Butt (Flat)"},{value:"round",label:"Round"},{value:"square",label:"Square (Extended)"}]}}}
                                .value=${((l=this._lineFormData.style)==null?void 0:l.line_cap)||"butt"}
                                .label=${"Line Cap"}
                                @value-changed=${p=>{this._lineFormData.style={...this._lineFormData.style,line_cap:p.detail.value},this.requestUpdate()}}
                                helper="How line endpoints are drawn">
                            </ha-selector>

                            <!-- Line Join -->
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select:{options:[{value:"miter",label:"Miter (Sharp)"},{value:"round",label:"Round"},{value:"bevel",label:"Bevel (Cut)"}]}}}
                                .value=${((c=this._lineFormData.style)==null?void 0:c.line_join)||this._lineFormData.corner_style||"miter"}
                                .label=${"Line Join"}
                                @value-changed=${p=>{this._lineFormData.style={...this._lineFormData.style,line_join:p.detail.value},this.requestUpdate()}}
                                helper="How line segments connect"
                                style="margin-top: 12px;">
                            </ha-selector>
                        </div>

                        <!-- Right Column -->
                        <div>
                            <!-- Stroke Override -->
                            <ha-input
                                label="Stroke Override"
                                .value=${((d=this._lineFormData.style)==null?void 0:d.stroke)||""}
                                @input=${p=>{const g=p.target.value.trim();if(g===""){const{stroke:_,...f}=this._lineFormData.style||{};this._lineFormData.style=f}else this._lineFormData.style={...this._lineFormData.style,stroke:g};this.requestUpdate()}}
                                hint="Override color with custom stroke (e.g., url(#gradient))"
                                style="width: 100%;">
                            </ha-input>

                            <!-- Dash Offset -->
                            <ha-input
                                type="number"
                                label="Dash Offset"
                                .value=${String(((h=this._lineFormData.style)==null?void 0:h.dash_offset)||0)}
                                @input=${p=>{this._lineFormData.style={...this._lineFormData.style,dash_offset:Number(p.target.value)||0},this.requestUpdate()}}
                                hint="Shifts the dash pattern (vb units)"
                                style="margin-top: 12px; width: 100%;">
                            </ha-input>
                        </div>
                    </div>
                </lcards-form-section>
            </div>
        `}_renderLineStylePreviewVertical(){var f,y,w,x,$,D,M,P;const e=(f=this._lineFormData.style)==null?void 0:f.color,t=typeof e=="object"&&e!==null?e.default||e.active||Object.values(e)[0]:e,i=typeof t=="string"&&(t.includes("{{")||t.includes("{%")||t.includes("[[[")),o=i?"var(--lcars-orange)":t||"var(--lcars-orange)",s=((y=this._lineFormData.style)==null?void 0:y.width)||2,r=((w=this._lineFormData.style)==null?void 0:w.opacity)??1,a=((x=this._lineFormData.style)==null?void 0:x.dash_array)||"",l=($=this._lineFormData.style)==null?void 0:$.marker_start,c=(D=this._lineFormData.style)==null?void 0:D.marker_end,d=this._lineFormData.corner_style||"round",h=((M=this._lineFormData.style)==null?void 0:M.line_cap)||"butt",p=((P=this._lineFormData.style)==null?void 0:P.line_join)||d;let g="M 20,40 L 20,240 L 180,240";try{const k=new Kt({},{},[0,0,200,280]),L=this._lineFormData.route==="manual"?"manhattan":this._lineFormData.route||"auto",E={id:"style-preview",_raw:{...this._lineFormData,route:L}},B=k.buildRouteRequest(E,[20,40],[180,240]),U=k.computePath(B);U!=null&&U.d&&(g=U.d)}catch(k){m.warn("[MSDStudio] Line style preview routing failed, using fallback path",k)}const _=u((k,L,E)=>{if(!(k!=null&&k.type)||k.type==="none")return"";const B={...k,fill:k.fill==="match_line"?o:k.fill,stroke:k.stroke==="match_line"?o:k.stroke};return Gi.prototype._createMarkerDefinition(B,L,E,r)},"createMarker");return v`
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; padding: 20px; background: #0a0a0a; border-radius: 8px; border: 1px solid #333; overflow: hidden;">
                ${i?v`
                    <lcards-message type="info" message="Templates aren't evaluated in this preview: showing the default color." style="width: 100%;">
                    </lcards-message>
                `:""}
                <!-- color: sets currentColor fallback for unfilled markers (card host normally provides this) -->
                <svg viewBox="0 0 200 280" preserveAspectRatio="xMidYMid meet" style="flex: 1; width: 100%; min-height: 0; max-height: 500px; color: ${o};">
                    <defs>
                        ${we(_(l,"start-preview-v","start"))}
                        ${we(_(c,"end-preview-v","end"))}
                    </defs>
                    <path
                        d="${g}"
                        stroke="${o}"
                        stroke-width="${s}"
                        stroke-opacity="${r}"
                        stroke-dasharray="${a}"
                        stroke-linecap="${h}"
                        stroke-linejoin="${p}"
                        fill="none"
                        marker-start="${l!=null&&l.type&&l.type!=="none"?"url(#start-preview-v)":""}"
                        marker-end="${c!=null&&c.type&&c.type!=="none"?"url(#end-preview-v)":""}"
                    />
                </svg>
            </div>
        `}_renderShapeStylePreviewVertical(){const e=this._shapeFormData.kind,t=this._shapeFormData.style||{},i=u((_,f)=>{const y=typeof _=="object"&&_!==null?_.default||_.active||Object.values(_)[0]:_,w=typeof y=="string"&&(y.includes("{{")||y.includes("{%")||y.includes("[[["));return{value:w?f:y||f,isTemplate:w}},"resolveCandidate"),o=i(t.color,"var(--lcars-orange)"),s=i(t.fill,"none"),r=o.value,a=s.value,l=o.isTemplate||s.isTemplate,c=t.width??2,d=t.opacity??1,h=t.dash_array||"",p=t.fill_opacity??1;let g;if(e==="polyline"){const _=t.line_cap||"butt",f=t.line_join||this._shapeFormData.corner_style||"miter";let y="M 20,40 L 20,240 L 180,240";try{const w=new Kt({},{},[0,0,200,280]),x={id:"shape-style-preview",_raw:{route:"manual",corner_style:this._shapeFormData.corner_style,corner_radius:this._shapeFormData.corner_radius,corner_angle:this._shapeFormData.corner_angle,smoothing_mode:this._shapeFormData.smoothing_mode,smoothing_iterations:this._shapeFormData.smoothing_iterations}},$=w.buildRouteRequest(x,[20,40],[180,240]),D=w.computePath($);D!=null&&D.d&&(y=this._shapeFormData.closed?`${D.d} Z`:D.d)}catch(w){m.warn("[MSDStudio] Shape style preview routing failed, using fallback path",w)}g=`<path
                    d="${y}"
                    stroke="${r}"
                    stroke-width="${c}"
                    stroke-opacity="${d}"
                    stroke-dasharray="${h}"
                    stroke-linecap="${_}"
                    stroke-linejoin="${f}"
                    fill="${this._shapeFormData.closed?a:"none"}"
                    fill-opacity="${p}"
                />`}else if(e==="rect"){const _=this._shapeFormData.corner_style==="round"?this._shapeFormData.corner_radius??8:0;g=`<rect x="20" y="40" width="160" height="200" rx="${_}" ry="${_}"
                      stroke="${r}" stroke-width="${c}" stroke-opacity="${d}"
                      stroke-dasharray="${h}" fill="${a}" fill-opacity="${p}" />`}else g=`<ellipse cx="100" cy="140" rx="80" ry="100"
                         stroke="${r}" stroke-width="${c}" stroke-opacity="${d}"
                         stroke-dasharray="${h}" fill="${a}" fill-opacity="${p}" />`;return v`
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; padding: 20px; background: #0a0a0a; border-radius: 8px; border: 1px solid #333; overflow: hidden;">
                ${l?v`
                    <lcards-message type="info" message="Templates aren't evaluated in this preview: showing the default color." style="width: 100%;">
                    </lcards-message>
                `:""}
                <svg viewBox="0 0 200 280" preserveAspectRatio="xMidYMid meet" style="flex: 1; width: 100%; min-height: 0; max-height: 500px; color: ${r};">
                    ${we(g)}
                </svg>
            </div>
        `}_handleKeyDown(e){var s,r,a,l;const t=(r=(s=e.composedPath)==null?void 0:s.call(e))==null?void 0:r[0],i=((a=t==null?void 0:t.tagName)==null?void 0:a.toLowerCase())??"";if(i==="input"||i==="textarea"||i==="select"||i.includes("input")||i.includes("textfield")||i.includes("textarea")||t!=null&&t.isContentEditable)return;const o=((l=e.target)==null?void 0:l.tagName)??"";if(!(o==="INPUT"||o==="TEXTAREA"||o==="SELECT"||o==="HA-TEXTFIELD")){if(e.key==="Escape"){e.preventDefault(),e.stopPropagation(),this._showCardEditorForm?this._closeCardEditorForm():this._showLineForm?this._closeLineForm():this._showShapeForm?this._closeShapeForm():this._showControlForm?this._closeControlForm():this._showAnchorForm?this._closeAnchorForm():this._editingChannelId!==null?this._closeChannelForm():this._activeMode!==N.VIEW?this._setMode(N.VIEW):this._selectedShapeId&&(this._selectedShapeId=null,this.requestUpdate());return}if(e.key==="Enter"&&this._activeMode===N.DRAW_SHAPE&&this._drawShapeState.kind==="polyline"){e.preventDefault(),e.stopPropagation(),this._finishDrawShapePolyline();return}if((e.ctrlKey||e.metaKey)&&e.key==="s"){e.preventDefault(),this._handleSave();return}if(e.key==="Delete"){e.preventDefault(),m.debug("[MSDStudio] Delete key pressed - no item selected");return}if(e.key==="g"||e.key==="G"){e.preventDefault(),this._showGrid=!this._showGrid,this.requestUpdate();return}if(e.key==="e"||e.key==="E"){e.preventDefault(),this._toggleEditMode();return}}}_updateRoutingConfig(e,t){this._workingConfig.msd||(this._workingConfig.msd={}),this._workingConfig.msd.routing||(this._workingConfig.msd.routing={}),t==null||t===""?delete this._workingConfig.msd.routing[e]:this._workingConfig.msd.routing[e]=t,this._markDirty(),this.requestUpdate()}_updateRoutingCostDefaults(e,t){this._workingConfig.msd||(this._workingConfig.msd={}),this._workingConfig.msd.routing||(this._workingConfig.msd.routing={}),this._workingConfig.msd.routing.cost_defaults||(this._workingConfig.msd.routing.cost_defaults={}),t==null||t===""?(delete this._workingConfig.msd.routing.cost_defaults[e],Object.keys(this._workingConfig.msd.routing.cost_defaults).length===0&&delete this._workingConfig.msd.routing.cost_defaults):this._workingConfig.msd.routing.cost_defaults[e]=t,this._markDirty(),this.requestUpdate()}_validateConfiguration(){const e=[],t=this._workingConfig.msd||{},i=t.anchors||{},s={...this._getBaseSvgAnchors(),...i},r=t.overlays||[];r.filter(d=>d.type==="line").forEach(d=>{d.anchor&&typeof d.anchor=="string"&&(s[d.anchor]||r.find(p=>p.id===d.anchor&&p.type!=="line")||e.push({type:"line",id:d.id,field:"anchor",message:`Line "${d.id}": Source anchor "${d.anchor}" does not exist`})),d.attach_to&&typeof d.attach_to=="string"&&(s[d.attach_to]||r.find(p=>p.id===d.attach_to&&p.type!=="line")||e.push({type:"line",id:d.id,field:"attach_to",message:`Line "${d.id}": Target "${d.attach_to}" does not exist`}))});const l=t.channels||{};return Object.entries(l).forEach(([d,h])=>{if(h.bounds&&Array.isArray(h.bounds)){const[p,g,_,f]=h.bounds;(_<=0||f<=0)&&e.push({type:"channel",id:d,field:"bounds",message:`Channel "${d}": Width and height must be positive (got ${_}×${f})`})}}),r.filter(d=>d.type==="control").forEach(d=>{if(d.size&&Array.isArray(d.size)){const[h,p]=d.size;(h<=0||p<=0)&&e.push({type:"control",id:d.id,field:"size",message:`Control "${d.id}": Width and height must be positive (got ${h}×${p})`})}d.position&&typeof d.position=="string"&&(d.position===d.id?e.push({type:"control",id:d.id,field:"position",message:`Control "${d.id}": cannot use itself as its own position anchor`}):s[d.position]||r.find(p=>p.id===d.position&&p.type!=="line")||e.push({type:"control",id:d.id,field:"position",message:`Control "${d.id}": position anchor "${d.position}" does not exist`}))}),e}_getValidationErrorCount(){return this._validationErrors.length}async _showValidationErrors(){const e=this._validationErrors.map(t=>`• ${t.message}`).join("<br>");await this._showDialog("Validation Errors",`${e}<br><br><strong>Please fix these issues before saving.</strong>`,"warning")}_showSuccessToast(e){const t=document.createElement("div");t.textContent=e,t.style.cssText=`
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--success-color, #4caf50);
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            z-index: 10000;
            font-weight: 500;
        `,document.body.appendChild(t),setTimeout(()=>{t.remove()},3e3)}async _confirmAction(e){return await this._showConfirmDialog("Confirm Action",e,{confirmLabel:"Discard",variant:"danger"})}async _showDialog(e,t,i="info"){return new Promise(o=>{const s=document.createElement("ha-dialog");s.headerTitle=e,s.open=true;const r=document.createElement("div");r.innerHTML=t,r.style.padding="16px",s.appendChild(r);const a=document.createElement("ha-button");a.slot="footer",a.textContent="OK",a.addEventListener("click",()=>{s.open=false,o()}),s.appendChild(a),s.addEventListener("closed",()=>{s.remove()}),je(s,this)})}render(){var e;return setTimeout(()=>this._injectLineHighlightStyles(),100),v`
            <ha-dialog
                open
                @closed=${t=>{t.stopPropagation(),this._handleClose()}}
                prevent-scrim-close
                flexcontent
                header-title="MSD Configuration Studio">

                <div slot="footer">
                    <div class="footer-start">
                        <ha-button @click=${()=>window.open("https://lcards.unimatrix01.ca/cards/msd/","_blank")} appearance="plain">
                            <ha-icon icon="mdi:book-open-variant" slot="start"></ha-icon>
                            Documentation
                        </ha-button>
                        <ha-button @click=${this._handleReset} appearance="plain" variant="warning">
                            <ha-icon icon="mdi:restore" slot="start"></ha-icon>
                            Reset
                        </ha-button>
                    </div>
                    <ha-button @click=${this._handleCancel} appearance="plain">Cancel</ha-button>
                    <ha-button variant="brand" @click=${this._handleSave}>
                        <ha-icon icon="mdi:check" slot="start"></ha-icon>
                        Save
                    </ha-button>
                </div>

                <div class="dialog-content">
                    <!-- Split Panel Layout -->
                    <div class="studio-layout">
                        <!-- Configuration Panel (50%) -->
                        <div class="config-panel">
                            ${this._renderTabNav()}
                            <div class="tab-content">
                                ${this._renderTabContent()}
                            </div>
                        </div>

                        <!-- Preview Panel (50%) -->
                        <div class="preview-panel mode-${this._activeMode}">

                            <!-- Scrollable content container -->
                            <div class="preview-scroll-container preview-container"
                                 data-mode="${this._activeMode}"
                                 @click=${this._handlePreviewClick}
                                 @dblclick=${this._handlePreviewDoubleClick}
                                 @mousedown=${this._handlePreviewMouseDown}
                                 @mousemove=${this._handlePreviewMouseMove}
                                 @mouseleave=${this._handlePreviewMouseLeave}>

                                <!-- Zoomable preview container (d3-zoom applies transform dynamically) -->
                                <!-- Explicit px dimensions from viewBox are required: lcards-msd-live-preview
                                     uses height:100% throughout, so without a concrete parent height the
                                     entire chain collapses to 0 and the SVG renders as a tiny dot. -->
                                <div class="msd-zoom-wrapper" style="transform-origin: top left; width: ${this._previewNaturalSize.width}px; height: ${this._previewNaturalSize.height}px;">
                                    <lcards-msd-live-preview
                                        .hass=${this.hass}
                                        .config=${this._workingConfig}
                                        .showRefreshButton=${true}
                                        @preview-ready=${()=>this._handlePreviewReady()}>
                                    </lcards-msd-live-preview>
                                </div>

                            </div>
                            <!-- End scrollable container -->

                            <!-- Overlays rendered OUTSIDE scroll container to prevent scroll affecting them -->
                            ${this._renderDrawChannelOverlay()}
                            ${this._renderDrawShapeOverlay()}
                            ${this._renderPlaceControlOverlay()}
                            ${this._renderConnectLineHint()}
                            ${this._renderShieldBubblePreview()}
                            ${this._renderCrosshairGuidelines()}
                            ${this._renderGridOverlay()}
                            ${this._renderRoutingGridOverlay()}
                            ${this._renderAnchorMarkers()}
                            ${this._renderInteractiveHitLayer()}
                            ${this._renderRoutingPaths()}
                            ${this._renderLineEndpointMarkers()}
                            ${this._renderWaypointInsertMarkers()}
                            ${this._renderWaypointMarkers()}
                            ${this._renderCornerRadiusHandles()}
                            ${this._renderShapeSegmentInsertMarkers()}
                            ${this._renderShapeVertexMarkers()}
                            ${this._renderDragAttachPoints()}
                            ${this._renderChannelsOverlay()}
                            ${this._renderTrunksOverlay()}
                            ${this._renderAnchorHighlight()}
                            ${this._renderControlHighlight()}
                            ${this._renderLineHighlight()}
                            ${this._renderChannelHighlight()}
                            ${this._renderAttachmentPointsOverlay()}

                            <!-- Canvas Toolbar (Floating - outside scroll) -->
                            ${this._renderCanvasToolbar()}

                            <!-- Zoom Controls (outside scroll) -->
                            <div class="zoom-controls">
                                <button class="zoom-control-btn"
                                    @click=${t=>{t.stopPropagation(),this._zoom(.9)}}
                                    title="Zoom Out">
                                    <ha-icon icon="mdi:magnify-minus"></ha-icon>
                                </button>
                                <span class="zoom-level">${Math.round((((e=this._currentZoom)==null?void 0:e.k)||1)*100)}%</span>
                                <button class="zoom-control-btn"
                                    @click=${t=>{t.stopPropagation(),this._zoom(1.1)}}
                                    title="Zoom In">
                                    <ha-icon icon="mdi:magnify-plus"></ha-icon>
                                </button>
                                <div class="zoom-control-divider"></div>
                                <button class="zoom-control-btn"
                                    @click=${t=>{t.stopPropagation(),this._fitToViewport()}}
                                    title="Fit to viewport">
                                    <ha-icon icon="mdi:fit-to-page-outline"></ha-icon>
                                </button>
                                <button class="zoom-control-btn"
                                    @click=${t=>{t.stopPropagation(),this._resetZoom()}}
                                    title="Reset to 100%">
                                    <ha-icon icon="mdi:restore"></ha-icon>
                                </button>
                            </div>

                            <!-- Grid Settings Popup (when opened) -->
                            ${this._renderGridSettingsPopup()}
                        </div>
                    </div>
                </div>
            </ha-dialog>

            <!-- Anchor Form Dialog (outside main dialog, always available) -->
            ${this._showAnchorForm?this._renderAnchorFormDialog():""}

            <!-- Control Form Dialog -->
            ${this._showControlForm?this._renderControlFormDialog():""}

            <!-- Card Editor Sub-form Dialog (nested inside Control form's Card tab) -->
            ${this._showCardEditorForm?this._renderCardEditorFormDialog():""}

            <!-- Line Form Dialog -->
            ${this._showLineForm?this._renderLineFormDialog():""}

            <!-- Shape Form Dialog -->
            ${this._showShapeForm?this._renderShapeFormDialog():""}

            <!-- Channel Form Dialog -->
            ${this._editingChannelId!==null?this._renderChannelFormDialog():""}
        `}};u(Ot,"LCARdSMSDStudioDialog");let Ft=Ot;customElements.get("lcards-msd-studio-dialog")||customElements.define("lcards-msd-studio-dialog",Ft);const Ht=class Ht2 extends Zi{constructor(){super(),this.cardType="msd",this._cardPickerDialogRef=null,m.debug("[LCARdSMSDEditor] Editor initialized with cardType: msd (1 tab: Configuration Studio launcher)")}connectedCallback(){super.connectedCallback(),this._boundHandleCardPickerRequest=this._handleCardPickerRequest.bind(this),document.addEventListener("open-card-picker",this._boundHandleCardPickerRequest),m.debug("[MSDEditor] Listening for card picker requests from MSD Studio")}disconnectedCallback(){super.disconnectedCallback(),this._boundHandleCardPickerRequest&&document.removeEventListener("open-card-picker",this._boundHandleCardPickerRequest),this._cardPickerDialogRef&&(this._cardPickerDialogRef.remove(),this._cardPickerDialogRef=null)}_getTabDefinitions(){return[{label:"Configuration",content:u(()=>this._renderConfigurationTab(),"content")},...this._getUtilityTabs()]}_renderConfigurationTab(){return v`
            <!-- Studio Launcher Card (Top Priority) -->
            <div class="info-card">
                <div class="info-card-content">
                    <h3>MSD Configuration Studio</h3>
                    <p>
                        <strong>Full-screen visual editor</strong> with live preview
                        <br />
                        Build your Master Systems Display visually with instant feedback.
                        Configure backgroups, place controls, connect lines, add animations, and manage routing channels graphically.
                    </p>
                </div>
                <div class="info-card-actions">
                    <ha-button
                        @click=${this._openMsdStudio}>
                        <ha-icon icon="mdi:monitor-dashboard" slot="start"></ha-icon>
                        Open Configuration Studio
                    </ha-button>
                </div>
            </div>

            <!-- Card Identification -->
            <lcards-form-section
                header="Card Identification"
                description="Unique identifier for rules engine targeting"
                icon="mdi:tag"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                ${ie.renderField(this,"id",{label:"Card ID",helper:"Unique identifier for rules engine targeting"})}

                ${ie.renderField(this,"tags",{label:"Tags",helper:"Tags for rules engine categorization"})}
            </lcards-form-section>

            <!-- Sizing -->
            <lcards-form-section
                header="Sizing"
                description="Override card dimensions: useful in stacks, overlays, or any auto-height container"
                icon="mdi:resize"
                ?expanded=${false}
                ?outlined=${true}
                headerLevel="4">

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    ${ie.renderField(this,"height")}

                    ${ie.renderField(this,"width")}

                    ${ie.renderField(this,"min_height")}

                    ${ie.renderField(this,"min_width")}

                    ${ie.renderField(this,"max_height")}

                    ${ie.renderField(this,"max_width")}

                    ${ie.renderField(this,"overflow")}

                    ${ie.renderField(this,"z_index")}

                    ${ie.renderField(this,"overflow_x")}

                    ${ie.renderField(this,"overflow_y")}
                </div>
                ${this._renderLayoutCardHint()}
            </lcards-form-section>
        `}async _handleCardPickerRequest(e){e.stopPropagation();const{requestId:t,context:i}=e.detail;m.debug("[MSDEditor] Card picker requested:",{requestId:t,context:i}),this._cardPickerDialogRef&&(this._cardPickerDialogRef.remove(),this._cardPickerDialogRef=null);const o=document.createElement("ha-dialog");o.headerTitle="Select Card Type";const s=this._getLovelace();this._cardPickerDialogRef=o,je(o,this),o.open=true,await o.updateComplete;const r=document.createElement("hui-card-picker");r.hass=this.hass,r.lovelace=s,r.style.padding="24px",r.style.display="block",o.appendChild(r),await new Promise(a=>setTimeout(a,100)),r?(typeof r.requestUpdate=="function"&&r.requestUpdate(),r.updateComplete&&await r.updateComplete,r.addEventListener("config-changed",a=>{var c,d;m.debug("[MSDEditor] Card selected:",(d=(c=a.detail)==null?void 0:c.config)==null?void 0:d.type);const l=new CustomEvent("card-picker-result",{bubbles:true,composed:true,detail:{requestId:t,context:i,config:a.detail.config}});document.dispatchEvent(l),o.open=false})):m.error("[MSDEditor] Failed to create hui-card-picker"),o.addEventListener("closed",()=>{o.remove(),this._cardPickerDialogRef===o&&(this._cardPickerDialogRef=null)})}_getLovelace(){var t;let e=((t=this.lovelace)==null?void 0:t.config)||this.lovelace||{};return e.views||(e={...e,views:[]}),e.views.length===0&&(e={...e,views:[{title:"Home",path:"home",cards:[]}]}),e}async _openMsdStudio(){m.debug("[MSDEditor] Opening MSD Configuration Studio");const e=document.createElement("lcards-msd-studio-dialog");e.hass=this.hass,e.config=JSON.parse(JSON.stringify(this.config||{}));const t=u(i=>{i.target===this&&(m.debug("[MSDEditor] Forwarding card-picker-result to dialog:",i.detail),e.dispatchEvent(new CustomEvent("card-picker-result",{detail:i.detail})))},"cardPickerResultHandler");this.addEventListener("card-picker-result",t),e.addEventListener("config-changed",i=>{m.debug("[MSDEditor] Studio config changed:",i.detail.config),this.config=i.detail.config,this._isUpdatingYaml=true,this._yamlValue=Ki(this.config),requestAnimationFrame(()=>{this._isUpdatingYaml=false}),Ji(this,"config-changed",{config:this.config}),this.requestUpdate()}),e.addEventListener("closed",()=>{this.removeEventListener("card-picker-result",t),e.remove()}),je(e,this)}};u(Ht,"LCARdSMSDEditor");let Mt=Ht;customElements.get("lcards-msd-editor")||customElements.define("lcards-msd-editor",Mt);export{Mt as LCARdSMSDEditor};
//# sourceMappingURL=lcards-msd-editor-ClJxoNCD.js.map
