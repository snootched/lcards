var si=Object.defineProperty;var wo=(n3,e,t)=>e in n3?si(n3,e,{enumerable:true,configurable:true,writable:true,value:t}):n3[e]=t;var h=(n3,e)=>si(n3,"name",{value:e,configurable:true});var bt=(n3,e,t)=>wo(n3,typeof e!="symbol"?e+"":e,t);import{R as xo,S as So,i as Nt,c as gt,b as v,w as me,l as m,T as $o,d as ai,o as nt,m as rt,U as li,V as di,W as Co,X as fe,x as ci,D as hi,Y as ui,Z as ko}from"./lcards-main-Dyh7t6jw.js";import{s as Do,a as Fo,L as oe,f as Mo}from"./LCARdSBaseEditor-DKqLTaC3.js";import{c as Ao}from"./lcards-yaml-editor-BVTHq2uG.js";import{e as Po,m as Lo,s as Eo,i as zo,r as _e}from"./lcards-message-DwgRzp3Y.js";import"./lcards-form-section--YQsY5gW.js";import"./lcards-background-animation-editor-Zsdqq-O8.js";import{R as Ro}from"./docs-links-nymGRB-i.js";import"./lcards-filter-editor-QuI4zSYF.js";import"./lcards-color-section-v2-C_JrvWUu.js";import{c as To}from"./studio-history-CaTDxvJI.js";/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Kt=class Kt2 extends xo{};h(Kt,"t");let Be=Kt;Be.directiveName="unsafeSVG",Be.resultType=2;const xe=So(Be),Bo="50,8 62,14 58,26 74,22 68,36 88,38 76,48 90,58 72,60 78,78 60,68 54,90 46,68 28,78 34,60 16,58 30,48 18,38 38,36 32,22 48,26",Uo="50,8 74,22 88,38 78,78 54,90 28,78 16,58 32,22",qo="50,10 68,16 84,32 90,55 78,78 55,90 25,80 12,55 20,30",ut=class ut2 extends Nt{render(){return v`
            <div class="diagram-row">
                <div class="diagram-cell">
                    ${this._renderShape(Bo,false)}
                    <span class="diagram-label">Raw trace<br>(many points)</span>
                </div>
                <div class="diagram-cell">
                    ${this._renderShape(Uo,false)}
                    <span class="diagram-label">Simplified<br>(tolerance ↑)</span>
                </div>
                <div class="diagram-cell">
                    ${this._renderShape(qo,true)}
                    <span class="diagram-label">Roundness ↑<br>(toward ellipse)</span>
                </div>
            </div>
        `}_renderShape(e,t){const i=e.split(" ").map(o=>o.split(",").map(Number));return me`
            <svg viewBox="0 0 100 100">
                ${t?me`<ellipse class="ellipse-target" cx="50" cy="50" rx="40" ry="42" />`:""}
                <polygon class="outline" points="${e}" />
                ${i.map(([o,r])=>me`<circle class="vertex" cx="${o}" cy="${r}" r="2.5" />`)}
            </svg>
        `}};h(ut,"LCARdSShieldBubbleDiagram"),bt(ut,"styles",gt`
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
    `);let $t=ut;customElements.get("lcards-shield-bubble-diagram")||customElements.define("lcards-shield-bubble-diagram",$t);const pt=class pt2 extends Nt{constructor(){super(),this.hass=null,this.config=null,this.showRefreshButton=true,this._renderKey=0,this._debounceTimer=null}static get styles(){return gt`
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
        `}firstUpdated(e){super.firstUpdated(e),this._updatePreviewCard()}updated(e){var t;if(super.updated(e),e.has("config"))this._schedulePreviewUpdate();else if(e.has("hass")){const i=(t=this.shadowRoot)==null?void 0:t.querySelector(".preview-card-container lcards-msd-card");i?i.hass=this.hass:this._schedulePreviewUpdate()}}_schedulePreviewUpdate(){this._debounceTimer&&clearTimeout(this._debounceTimer),this._debounceTimer=setTimeout(()=>{this._renderKey++,this._updatePreviewCard(),this._debounceTimer=null,m.debug("[MSDLivePreview] Preview updated (debounced)")},300)}_forceRefresh(){this._debounceTimer&&(clearTimeout(this._debounceTimer),this._debounceTimer=null),this._renderKey++,this._updatePreviewCard(),m.debug("[MSDLivePreview] Preview refreshed (manual)")}_updatePreviewCard(){var i;const e=(i=this.shadowRoot)==null?void 0:i.querySelector(".preview-card-container");if(!e){m.warn("[MSDLivePreview] Card container not found");return}for(;e.firstChild;)e.firstChild.remove();if(!this._hasBaseSvg()){e.innerHTML=`
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
        `}};h(pt,"LCARdSMSDLivePreview"),bt(pt,"properties",{hass:{type:Object},config:{type:Object},showRefreshButton:{type:Boolean},_renderKey:{type:Number,state:true},_debounceTimer:{state:true}});let Ct=pt;customElements.get("lcards-msd-live-preview")||customElements.define("lcards-msd-live-preview",Ct);var Io={value:h(()=>{},"value")};function Ht(){for(var n3=0,e=arguments.length,t={},i;n3<e;++n3){if(!(i=arguments[n3]+"")||i in t||/[\s.]/.test(i))throw new Error("illegal type: "+i);t[i]=[]}return new et(t)}h(Ht,"dispatch");function et(n3){this._=n3}h(et,"Dispatch");function Oo(n3,e){return n3.trim().split(/^|\s+/).map(function(t){var i="",o=t.indexOf(".");if(o>=0&&(i=t.slice(o+1),t=t.slice(0,o)),t&&!e.hasOwnProperty(t))throw new Error("unknown type: "+t);return{type:t,name:i}})}h(Oo,"parseTypenames$1");et.prototype=Ht.prototype={constructor:et,on:h(function(n3,e){var t=this._,i=Oo(n3+"",t),o,r=-1,s=i.length;if(arguments.length<2){for(;++r<s;)if((o=(n3=i[r]).type)&&(o=No(t[o],n3.name)))return o;return}if(e!=null&&typeof e!="function")throw new Error("invalid callback: "+e);for(;++r<s;)if(o=(n3=i[r]).type)t[o]=pi(t[o],n3.name,e);else if(e==null)for(o in t)t[o]=pi(t[o],n3.name,null);return this},"on"),copy:h(function(){var n3={},e=this._;for(var t in e)n3[t]=e[t].slice();return new et(n3)},"copy"),call:h(function(n3,e){if((o=arguments.length-2)>0)for(var t=new Array(o),i=0,o,r;i<o;++i)t[i]=arguments[i+2];if(!this._.hasOwnProperty(n3))throw new Error("unknown type: "+n3);for(r=this._[n3],i=0,o=r.length;i<o;++i)r[i].value.apply(e,t)},"call"),apply:h(function(n3,e,t){if(!this._.hasOwnProperty(n3))throw new Error("unknown type: "+n3);for(var i=this._[n3],o=0,r=i.length;o<r;++o)i[o].value.apply(e,t)},"apply")};function No(n3,e){for(var t=0,i=n3.length,o;t<i;++t)if((o=n3[t]).name===e)return o.value}h(No,"get$1");function pi(n3,e,t){for(var i=0,o=n3.length;i<o;++i)if(n3[i].name===e){n3[i]=Io,n3=n3.slice(0,i).concat(n3.slice(i+1));break}return t!=null&&n3.push({name:e,value:t}),n3}h(pi,"set$1");var kt="http://www.w3.org/1999/xhtml";const gi={svg:"http://www.w3.org/2000/svg",xhtml:kt,xlink:"http://www.w3.org/1999/xlink",xml:"http://www.w3.org/XML/1998/namespace",xmlns:"http://www.w3.org/2000/xmlns/"};function mt(n3){var e=n3+="",t=e.indexOf(":");return t>=0&&(e=n3.slice(0,t))!=="xmlns"&&(n3=n3.slice(t+1)),gi.hasOwnProperty(e)?{space:gi[e],local:n3}:n3}h(mt,"namespace");function Ho(n3){return function(){var e=this.ownerDocument,t=this.namespaceURI;return t===kt&&e.documentElement.namespaceURI===kt?e.createElement(n3):e.createElementNS(t,n3)}}h(Ho,"creatorInherit");function Vo(n3){return function(){return this.ownerDocument.createElementNS(n3.space,n3.local)}}h(Vo,"creatorFixed");function Ni(n3){var e=mt(n3);return(e.local?Vo:Ho)(e)}h(Ni,"creator");function Wo(){}h(Wo,"none");function Vt(n3){return n3==null?Wo:function(){return this.querySelector(n3)}}h(Vt,"selector");function Yo(n3){typeof n3!="function"&&(n3=Vt(n3));for(var e=this._groups,t=e.length,i=new Array(t),o=0;o<t;++o)for(var r=e[o],s=r.length,a=i[o]=new Array(s),l,d,c=0;c<s;++c)(l=r[c])&&(d=n3.call(l,l.__data__,c,r))&&("__data__"in l&&(d.__data__=l.__data__),a[c]=d);return new ie(i,this._parents)}h(Yo,"selection_select");function Xo(n3){return n3==null?[]:Array.isArray(n3)?n3:Array.from(n3)}h(Xo,"array");function Go(){return[]}h(Go,"empty");function Hi(n3){return n3==null?Go:function(){return this.querySelectorAll(n3)}}h(Hi,"selectorAll");function jo(n3){return function(){return Xo(n3.apply(this,arguments))}}h(jo,"arrayAll");function Zo(n3){typeof n3=="function"?n3=jo(n3):n3=Hi(n3);for(var e=this._groups,t=e.length,i=[],o=[],r=0;r<t;++r)for(var s=e[r],a=s.length,l,d=0;d<a;++d)(l=s[d])&&(i.push(n3.call(l,l.__data__,d,s)),o.push(l));return new ie(i,o)}h(Zo,"selection_selectAll");function Vi(n3){return function(){return this.matches(n3)}}h(Vi,"matcher");function Wi(n3){return function(e){return e.matches(n3)}}h(Wi,"childMatcher");var Ko=Array.prototype.find;function Jo(n3){return function(){return Ko.call(this.children,n3)}}h(Jo,"childFind");function Qo(){return this.firstElementChild}h(Qo,"childFirst");function en(n3){return this.select(n3==null?Qo:Jo(typeof n3=="function"?n3:Wi(n3)))}h(en,"selection_selectChild");var tn=Array.prototype.filter;function on(){return Array.from(this.children)}h(on,"children");function nn(n3){return function(){return tn.call(this.children,n3)}}h(nn,"childrenFilter");function rn(n3){return this.selectAll(n3==null?on:nn(typeof n3=="function"?n3:Wi(n3)))}h(rn,"selection_selectChildren");function sn(n3){typeof n3!="function"&&(n3=Vi(n3));for(var e=this._groups,t=e.length,i=new Array(t),o=0;o<t;++o)for(var r=e[o],s=r.length,a=i[o]=[],l,d=0;d<s;++d)(l=r[d])&&n3.call(l,l.__data__,d,r)&&a.push(l);return new ie(i,this._parents)}h(sn,"selection_filter");function Yi(n3){return new Array(n3.length)}h(Yi,"sparse");function an(){return new ie(this._enter||this._groups.map(Yi),this._parents)}h(an,"selection_enter");function st(n3,e){this.ownerDocument=n3.ownerDocument,this.namespaceURI=n3.namespaceURI,this._next=null,this._parent=n3,this.__data__=e}h(st,"EnterNode");st.prototype={constructor:st,appendChild:h(function(n3){return this._parent.insertBefore(n3,this._next)},"appendChild"),insertBefore:h(function(n3,e){return this._parent.insertBefore(n3,e)},"insertBefore"),querySelector:h(function(n3){return this._parent.querySelector(n3)},"querySelector"),querySelectorAll:h(function(n3){return this._parent.querySelectorAll(n3)},"querySelectorAll")};function ln(n3){return function(){return n3}}h(ln,"constant$2");function dn(n3,e,t,i,o,r){for(var s=0,a,l=e.length,d=r.length;s<d;++s)(a=e[s])?(a.__data__=r[s],i[s]=a):t[s]=new st(n3,r[s]);for(;s<l;++s)(a=e[s])&&(o[s]=a)}h(dn,"bindIndex");function cn(n3,e,t,i,o,r,s){var a,l,d=new Map,c=e.length,u=r.length,p=new Array(c),g;for(a=0;a<c;++a)(l=e[a])&&(p[a]=g=s.call(l,l.__data__,a,e)+"",d.has(g)?o[a]=l:d.set(g,l));for(a=0;a<u;++a)g=s.call(n3,r[a],a,r)+"",(l=d.get(g))?(i[a]=l,l.__data__=r[a],d.delete(g)):t[a]=new st(n3,r[a]);for(a=0;a<c;++a)(l=e[a])&&d.get(p[a])===l&&(o[a]=l)}h(cn,"bindKey");function hn(n3){return n3.__data__}h(hn,"datum");function un(n3,e){if(!arguments.length)return Array.from(this,hn);var t=e?cn:dn,i=this._parents,o=this._groups;typeof n3!="function"&&(n3=ln(n3));for(var r=o.length,s=new Array(r),a=new Array(r),l=new Array(r),d=0;d<r;++d){var c=i[d],u=o[d],p=u.length,g=pn(n3.call(c,c&&c.__data__,d,i)),_=g.length,f=a[d]=new Array(_),b=s[d]=new Array(_),w=l[d]=new Array(p);t(c,u,f,b,w,g,e);for(var S=0,C=0,D,M;S<_;++S)if(D=f[S]){for(S>=C&&(C=S+1);!(M=b[C])&&++C<_;);D._next=M||null}}return s=new ie(s,i),s._enter=a,s._exit=l,s}h(un,"selection_data");function pn(n3){return typeof n3=="object"&&"length"in n3?n3:Array.from(n3)}h(pn,"arraylike");function gn(){return new ie(this._exit||this._groups.map(Yi),this._parents)}h(gn,"selection_exit");function mn(n3,e,t){var i=this.enter(),o=this,r=this.exit();return typeof n3=="function"?(i=n3(i),i&&(i=i.selection())):i=i.append(n3+""),e!=null&&(o=e(o),o&&(o=o.selection())),t==null?r.remove():t(r),i&&o?i.merge(o).order():o}h(mn,"selection_join");function fn(n3){for(var e=n3.selection?n3.selection():n3,t=this._groups,i=e._groups,o=t.length,r=i.length,s=Math.min(o,r),a=new Array(o),l=0;l<s;++l)for(var d=t[l],c=i[l],u=d.length,p=a[l]=new Array(u),g,_=0;_<u;++_)(g=d[_]||c[_])&&(p[_]=g);for(;l<o;++l)a[l]=t[l];return new ie(a,this._parents)}h(fn,"selection_merge");function _n(){for(var n3=this._groups,e=-1,t=n3.length;++e<t;)for(var i=n3[e],o=i.length-1,r=i[o],s;--o>=0;)(s=i[o])&&(r&&s.compareDocumentPosition(r)^4&&r.parentNode.insertBefore(s,r),r=s);return this}h(_n,"selection_order");function vn(n3){n3||(n3=bn);function e(u,p){return u&&p?n3(u.__data__,p.__data__):!u-!p}h(e,"compareNode");for(var t=this._groups,i=t.length,o=new Array(i),r=0;r<i;++r){for(var s=t[r],a=s.length,l=o[r]=new Array(a),d,c=0;c<a;++c)(d=s[c])&&(l[c]=d);l.sort(e)}return new ie(o,this._parents).order()}h(vn,"selection_sort");function bn(n3,e){return n3<e?-1:n3>e?1:n3>=e?0:NaN}h(bn,"ascending");function yn(){var n3=arguments[0];return arguments[0]=this,n3.apply(null,arguments),this}h(yn,"selection_call");function wn(){return Array.from(this)}h(wn,"selection_nodes");function xn(){for(var n3=this._groups,e=0,t=n3.length;e<t;++e)for(var i=n3[e],o=0,r=i.length;o<r;++o){var s=i[o];if(s)return s}return null}h(xn,"selection_node");function Sn(){let n3=0;for(const e of this)++n3;return n3}h(Sn,"selection_size");function $n(){return!this.node()}h($n,"selection_empty");function Cn(n3){for(var e=this._groups,t=0,i=e.length;t<i;++t)for(var o=e[t],r=0,s=o.length,a;r<s;++r)(a=o[r])&&n3.call(a,a.__data__,r,o);return this}h(Cn,"selection_each");function kn(n3){return function(){this.removeAttribute(n3)}}h(kn,"attrRemove$1");function Dn(n3){return function(){this.removeAttributeNS(n3.space,n3.local)}}h(Dn,"attrRemoveNS$1");function Fn(n3,e){return function(){this.setAttribute(n3,e)}}h(Fn,"attrConstant$1");function Mn(n3,e){return function(){this.setAttributeNS(n3.space,n3.local,e)}}h(Mn,"attrConstantNS$1");function An(n3,e){return function(){var t=e.apply(this,arguments);t==null?this.removeAttribute(n3):this.setAttribute(n3,t)}}h(An,"attrFunction$1");function Pn(n3,e){return function(){var t=e.apply(this,arguments);t==null?this.removeAttributeNS(n3.space,n3.local):this.setAttributeNS(n3.space,n3.local,t)}}h(Pn,"attrFunctionNS$1");function Ln(n3,e){var t=mt(n3);if(arguments.length<2){var i=this.node();return t.local?i.getAttributeNS(t.space,t.local):i.getAttribute(t)}return this.each((e==null?t.local?Dn:kn:typeof e=="function"?t.local?Pn:An:t.local?Mn:Fn)(t,e))}h(Ln,"selection_attr");function Xi(n3){return n3.ownerDocument&&n3.ownerDocument.defaultView||n3.document&&n3||n3.defaultView}h(Xi,"defaultView");function En(n3){return function(){this.style.removeProperty(n3)}}h(En,"styleRemove$1");function zn(n3,e,t){return function(){this.style.setProperty(n3,e,t)}}h(zn,"styleConstant$1");function Rn(n3,e,t){return function(){var i=e.apply(this,arguments);i==null?this.style.removeProperty(n3):this.style.setProperty(n3,i,t)}}h(Rn,"styleFunction$1");function Tn(n3,e,t){return arguments.length>1?this.each((e==null?En:typeof e=="function"?Rn:zn)(n3,e,t??"")):$e(this.node(),n3)}h(Tn,"selection_style");function $e(n3,e){return n3.style.getPropertyValue(e)||Xi(n3).getComputedStyle(n3,null).getPropertyValue(e)}h($e,"styleValue");function Bn(n3){return function(){delete this[n3]}}h(Bn,"propertyRemove");function Un(n3,e){return function(){this[n3]=e}}h(Un,"propertyConstant");function qn(n3,e){return function(){var t=e.apply(this,arguments);t==null?delete this[n3]:this[n3]=t}}h(qn,"propertyFunction");function In(n3,e){return arguments.length>1?this.each((e==null?Bn:typeof e=="function"?qn:Un)(n3,e)):this.node()[n3]}h(In,"selection_property");function Gi(n3){return n3.trim().split(/^|\s+/)}h(Gi,"classArray");function Wt(n3){return n3.classList||new ji(n3)}h(Wt,"classList");function ji(n3){this._node=n3,this._names=Gi(n3.getAttribute("class")||"")}h(ji,"ClassList");ji.prototype={add:h(function(n3){var e=this._names.indexOf(n3);e<0&&(this._names.push(n3),this._node.setAttribute("class",this._names.join(" ")))},"add"),remove:h(function(n3){var e=this._names.indexOf(n3);e>=0&&(this._names.splice(e,1),this._node.setAttribute("class",this._names.join(" ")))},"remove"),contains:h(function(n3){return this._names.indexOf(n3)>=0},"contains")};function Zi(n3,e){for(var t=Wt(n3),i=-1,o=e.length;++i<o;)t.add(e[i])}h(Zi,"classedAdd");function Ki(n3,e){for(var t=Wt(n3),i=-1,o=e.length;++i<o;)t.remove(e[i])}h(Ki,"classedRemove");function On(n3){return function(){Zi(this,n3)}}h(On,"classedTrue");function Nn(n3){return function(){Ki(this,n3)}}h(Nn,"classedFalse");function Hn(n3,e){return function(){(e.apply(this,arguments)?Zi:Ki)(this,n3)}}h(Hn,"classedFunction");function Vn(n3,e){var t=Gi(n3+"");if(arguments.length<2){for(var i=Wt(this.node()),o=-1,r=t.length;++o<r;)if(!i.contains(t[o]))return false;return true}return this.each((typeof e=="function"?Hn:e?On:Nn)(t,e))}h(Vn,"selection_classed");function Wn(){this.textContent=""}h(Wn,"textRemove");function Yn(n3){return function(){this.textContent=n3}}h(Yn,"textConstant$1");function Xn(n3){return function(){var e=n3.apply(this,arguments);this.textContent=e??""}}h(Xn,"textFunction$1");function Gn(n3){return arguments.length?this.each(n3==null?Wn:(typeof n3=="function"?Xn:Yn)(n3)):this.node().textContent}h(Gn,"selection_text");function jn(){this.innerHTML=""}h(jn,"htmlRemove");function Zn(n3){return function(){this.innerHTML=n3}}h(Zn,"htmlConstant");function Kn(n3){return function(){var e=n3.apply(this,arguments);this.innerHTML=e??""}}h(Kn,"htmlFunction");function Jn(n3){return arguments.length?this.each(n3==null?jn:(typeof n3=="function"?Kn:Zn)(n3)):this.node().innerHTML}h(Jn,"selection_html");function Qn(){this.nextSibling&&this.parentNode.appendChild(this)}h(Qn,"raise");function er(){return this.each(Qn)}h(er,"selection_raise");function tr(){this.previousSibling&&this.parentNode.insertBefore(this,this.parentNode.firstChild)}h(tr,"lower");function ir(){return this.each(tr)}h(ir,"selection_lower");function or(n3){var e=typeof n3=="function"?n3:Ni(n3);return this.select(function(){return this.appendChild(e.apply(this,arguments))})}h(or,"selection_append");function nr(){return null}h(nr,"constantNull");function rr(n3,e){var t=typeof n3=="function"?n3:Ni(n3),i=e==null?nr:typeof e=="function"?e:Vt(e);return this.select(function(){return this.insertBefore(t.apply(this,arguments),i.apply(this,arguments)||null)})}h(rr,"selection_insert");function sr(){var n3=this.parentNode;n3&&n3.removeChild(this)}h(sr,"remove");function ar(){return this.each(sr)}h(ar,"selection_remove");function lr(){var n3=this.cloneNode(false),e=this.parentNode;return e?e.insertBefore(n3,this.nextSibling):n3}h(lr,"selection_cloneShallow");function dr(){var n3=this.cloneNode(true),e=this.parentNode;return e?e.insertBefore(n3,this.nextSibling):n3}h(dr,"selection_cloneDeep");function cr(n3){return this.select(n3?dr:lr)}h(cr,"selection_clone");function hr(n3){return arguments.length?this.property("__data__",n3):this.node().__data__}h(hr,"selection_datum");function ur(n3){return function(e){n3.call(this,e,this.__data__)}}h(ur,"contextListener");function pr(n3){return n3.trim().split(/^|\s+/).map(function(e){var t="",i=e.indexOf(".");return i>=0&&(t=e.slice(i+1),e=e.slice(0,i)),{type:e,name:t}})}h(pr,"parseTypenames");function gr(n3){return function(){var e=this.__on;if(e){for(var t=0,i=-1,o=e.length,r;t<o;++t)r=e[t],(!n3.type||r.type===n3.type)&&r.name===n3.name?this.removeEventListener(r.type,r.listener,r.options):e[++i]=r;++i?e.length=i:delete this.__on}}}h(gr,"onRemove");function mr(n3,e,t){return function(){var i=this.__on,o,r=ur(e);if(i){for(var s=0,a=i.length;s<a;++s)if((o=i[s]).type===n3.type&&o.name===n3.name){this.removeEventListener(o.type,o.listener,o.options),this.addEventListener(o.type,o.listener=r,o.options=t),o.value=e;return}}this.addEventListener(n3.type,r,t),o={type:n3.type,name:n3.name,value:e,listener:r,options:t},i?i.push(o):this.__on=[o]}}h(mr,"onAdd");function fr(n3,e,t){var i=pr(n3+""),o,r=i.length,s;if(arguments.length<2){var a=this.node().__on;if(a){for(var l=0,d=a.length,c;l<d;++l)for(o=0,c=a[l];o<r;++o)if((s=i[o]).type===c.type&&s.name===c.name)return c.value}return}for(a=e?mr:gr,o=0;o<r;++o)this.each(a(i[o],e,t));return this}h(fr,"selection_on");function Ji(n3,e,t){var i=Xi(n3),o=i.CustomEvent;typeof o=="function"?o=new o(e,t):(o=i.document.createEvent("Event"),t?(o.initEvent(e,t.bubbles,t.cancelable),o.detail=t.detail):o.initEvent(e,false,false)),n3.dispatchEvent(o)}h(Ji,"dispatchEvent");function _r(n3,e){return function(){return Ji(this,n3,e)}}h(_r,"dispatchConstant");function vr(n3,e){return function(){return Ji(this,n3,e.apply(this,arguments))}}h(vr,"dispatchFunction");function br(n3,e){return this.each((typeof e=="function"?vr:_r)(n3,e))}h(br,"selection_dispatch");function*yr(){for(var n3=this._groups,e=0,t=n3.length;e<t;++e)for(var i=n3[e],o=0,r=i.length,s;o<r;++o)(s=i[o])&&(yield s)}h(yr,"selection_iterator");var Qi=[null];function ie(n3,e){this._groups=n3,this._parents=e}h(ie,"Selection$1");function We(){return new ie([[document.documentElement]],Qi)}h(We,"selection");function wr(){return this}h(wr,"selection_selection");ie.prototype=We.prototype={constructor:ie,select:Yo,selectAll:Zo,selectChild:en,selectChildren:rn,filter:sn,data:un,enter:an,exit:gn,join:mn,merge:fn,selection:wr,order:_n,sort:vn,call:yn,nodes:wn,node:xn,size:Sn,empty:$n,each:Cn,attr:Ln,style:Tn,property:In,classed:Vn,text:Gn,html:Jn,raise:er,lower:ir,append:or,insert:rr,remove:ar,clone:cr,datum:hr,on:fr,dispatch:br,[Symbol.iterator]:yr};function te(n3){return typeof n3=="string"?new ie([[document.querySelector(n3)]],[document.documentElement]):new ie([[n3]],Qi)}h(te,"select");function xr(n3){let e;for(;e=n3.sourceEvent;)n3=e;return n3}h(xr,"sourceEvent");function ve(n3,e){if(n3=xr(n3),e===void 0&&(e=n3.currentTarget),e){var t=e.ownerSVGElement||e;if(t.createSVGPoint){var i=t.createSVGPoint();return i.x=n3.clientX,i.y=n3.clientY,i=i.matrixTransform(e.getScreenCTM().inverse()),[i.x,i.y]}if(e.getBoundingClientRect){var o=e.getBoundingClientRect();return[n3.clientX-o.left-e.clientLeft,n3.clientY-o.top-e.clientTop]}}return[n3.pageX,n3.pageY]}h(ve,"pointer");const Dt={capture:true,passive:false};function Ft(n3){n3.preventDefault(),n3.stopImmediatePropagation()}h(Ft,"noevent$1");function Sr(n3){var e=n3.document.documentElement,t=te(n3).on("dragstart.drag",Ft,Dt);"onselectstart"in e?t.on("selectstart.drag",Ft,Dt):(e.__noselect=e.style.MozUserSelect,e.style.MozUserSelect="none")}h(Sr,"dragDisable");function $r(n3,e){var t=n3.document.documentElement,i=te(n3).on("dragstart.drag",null);e&&(i.on("click.drag",Ft,Dt),setTimeout(function(){i.on("click.drag",null)},0)),"onselectstart"in t?i.on("selectstart.drag",null):(t.style.MozUserSelect=t.__noselect,delete t.__noselect)}h($r,"yesdrag");function Yt(n3,e,t){n3.prototype=e.prototype=t,t.constructor=n3}h(Yt,"define");function eo(n3,e){var t=Object.create(n3.prototype);for(var i in e)t[i]=e[i];return t}h(eo,"extend");function Ye(){}h(Ye,"Color");var Ue=.7,at=1/Ue,Se="\\s*([+-]?\\d+)\\s*",qe="\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*",le="\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*",Cr=/^#([0-9a-f]{3,8})$/,kr=new RegExp(`^rgb\\(${Se},${Se},${Se}\\)$`),Dr=new RegExp(`^rgb\\(${le},${le},${le}\\)$`),Fr=new RegExp(`^rgba\\(${Se},${Se},${Se},${qe}\\)$`),Mr=new RegExp(`^rgba\\(${le},${le},${le},${qe}\\)$`),Ar=new RegExp(`^hsl\\(${qe},${le},${le}\\)$`),Pr=new RegExp(`^hsla\\(${qe},${le},${le},${qe}\\)$`),mi={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074};Yt(Ye,Ie,{copy(n3){return Object.assign(new this.constructor,this,n3)},displayable(){return this.rgb().displayable()},hex:fi,formatHex:fi,formatHex8:Lr,formatHsl:Er,formatRgb:_i,toString:_i});function fi(){return this.rgb().formatHex()}h(fi,"color_formatHex");function Lr(){return this.rgb().formatHex8()}h(Lr,"color_formatHex8");function Er(){return to(this).formatHsl()}h(Er,"color_formatHsl");function _i(){return this.rgb().formatRgb()}h(_i,"color_formatRgb");function Ie(n3){var e,t;return n3=(n3+"").trim().toLowerCase(),(e=Cr.exec(n3))?(t=e[1].length,e=parseInt(e[1],16),t===6?vi(e):t===3?new Q(e>>8&15|e>>4&240,e>>4&15|e&240,(e&15)<<4|e&15,1):t===8?Ze(e>>24&255,e>>16&255,e>>8&255,(e&255)/255):t===4?Ze(e>>12&15|e>>8&240,e>>8&15|e>>4&240,e>>4&15|e&240,((e&15)<<4|e&15)/255):null):(e=kr.exec(n3))?new Q(e[1],e[2],e[3],1):(e=Dr.exec(n3))?new Q(e[1]*255/100,e[2]*255/100,e[3]*255/100,1):(e=Fr.exec(n3))?Ze(e[1],e[2],e[3],e[4]):(e=Mr.exec(n3))?Ze(e[1]*255/100,e[2]*255/100,e[3]*255/100,e[4]):(e=Ar.exec(n3))?wi(e[1],e[2]/100,e[3]/100,1):(e=Pr.exec(n3))?wi(e[1],e[2]/100,e[3]/100,e[4]):mi.hasOwnProperty(n3)?vi(mi[n3]):n3==="transparent"?new Q(NaN,NaN,NaN,0):null}h(Ie,"color");function vi(n3){return new Q(n3>>16&255,n3>>8&255,n3&255,1)}h(vi,"rgbn");function Ze(n3,e,t,i){return i<=0&&(n3=e=t=NaN),new Q(n3,e,t,i)}h(Ze,"rgba");function zr(n3){return n3 instanceof Ye||(n3=Ie(n3)),n3?(n3=n3.rgb(),new Q(n3.r,n3.g,n3.b,n3.opacity)):new Q}h(zr,"rgbConvert");function Mt(n3,e,t,i){return arguments.length===1?zr(n3):new Q(n3,e,t,i??1)}h(Mt,"rgb");function Q(n3,e,t,i){this.r=+n3,this.g=+e,this.b=+t,this.opacity=+i}h(Q,"Rgb");Yt(Q,Mt,eo(Ye,{brighter(n3){return n3=n3==null?at:Math.pow(at,n3),new Q(this.r*n3,this.g*n3,this.b*n3,this.opacity)},darker(n3){return n3=n3==null?Ue:Math.pow(Ue,n3),new Q(this.r*n3,this.g*n3,this.b*n3,this.opacity)},rgb(){return this},clamp(){return new Q(ye(this.r),ye(this.g),ye(this.b),lt(this.opacity))},displayable(){return-.5<=this.r&&this.r<255.5&&-.5<=this.g&&this.g<255.5&&-.5<=this.b&&this.b<255.5&&0<=this.opacity&&this.opacity<=1},hex:bi,formatHex:bi,formatHex8:Rr,formatRgb:yi,toString:yi}));function bi(){return`#${be(this.r)}${be(this.g)}${be(this.b)}`}h(bi,"rgb_formatHex");function Rr(){return`#${be(this.r)}${be(this.g)}${be(this.b)}${be((isNaN(this.opacity)?1:this.opacity)*255)}`}h(Rr,"rgb_formatHex8");function yi(){const n3=lt(this.opacity);return`${n3===1?"rgb(":"rgba("}${ye(this.r)}, ${ye(this.g)}, ${ye(this.b)}${n3===1?")":`, ${n3})`}`}h(yi,"rgb_formatRgb");function lt(n3){return isNaN(n3)?1:Math.max(0,Math.min(1,n3))}h(lt,"clampa");function ye(n3){return Math.max(0,Math.min(255,Math.round(n3)||0))}h(ye,"clampi");function be(n3){return n3=ye(n3),(n3<16?"0":"")+n3.toString(16)}h(be,"hex");function wi(n3,e,t,i){return i<=0?n3=e=t=NaN:t<=0||t>=1?n3=e=NaN:e<=0&&(n3=NaN),new re(n3,e,t,i)}h(wi,"hsla");function to(n3){if(n3 instanceof re)return new re(n3.h,n3.s,n3.l,n3.opacity);if(n3 instanceof Ye||(n3=Ie(n3)),!n3)return new re;if(n3 instanceof re)return n3;n3=n3.rgb();var e=n3.r/255,t=n3.g/255,i=n3.b/255,o=Math.min(e,t,i),r=Math.max(e,t,i),s=NaN,a=r-o,l=(r+o)/2;return a?(e===r?s=(t-i)/a+(t<i)*6:t===r?s=(i-e)/a+2:s=(e-t)/a+4,a/=l<.5?r+o:2-r-o,s*=60):a=l>0&&l<1?0:s,new re(s,a,l,n3.opacity)}h(to,"hslConvert");function Tr(n3,e,t,i){return arguments.length===1?to(n3):new re(n3,e,t,i??1)}h(Tr,"hsl");function re(n3,e,t,i){this.h=+n3,this.s=+e,this.l=+t,this.opacity=+i}h(re,"Hsl");Yt(re,Tr,eo(Ye,{brighter(n3){return n3=n3==null?at:Math.pow(at,n3),new re(this.h,this.s,this.l*n3,this.opacity)},darker(n3){return n3=n3==null?Ue:Math.pow(Ue,n3),new re(this.h,this.s,this.l*n3,this.opacity)},rgb(){var n3=this.h%360+(this.h<0)*360,e=isNaN(n3)||isNaN(this.s)?0:this.s,t=this.l,i=t+(t<.5?t:1-t)*e,o=2*t-i;return new Q(yt(n3>=240?n3-240:n3+120,o,i),yt(n3,o,i),yt(n3<120?n3+240:n3-120,o,i),this.opacity)},clamp(){return new re(xi(this.h),Ke(this.s),Ke(this.l),lt(this.opacity))},displayable(){return(0<=this.s&&this.s<=1||isNaN(this.s))&&0<=this.l&&this.l<=1&&0<=this.opacity&&this.opacity<=1},formatHsl(){const n3=lt(this.opacity);return`${n3===1?"hsl(":"hsla("}${xi(this.h)}, ${Ke(this.s)*100}%, ${Ke(this.l)*100}%${n3===1?")":`, ${n3})`}`}}));function xi(n3){return n3=(n3||0)%360,n3<0?n3+360:n3}h(xi,"clamph");function Ke(n3){return Math.max(0,Math.min(1,n3||0))}h(Ke,"clampt");function yt(n3,e,t){return(n3<60?e+(t-e)*n3/60:n3<180?t:n3<240?e+(t-e)*(240-n3)/60:e)*255}h(yt,"hsl2rgb");const io=h(n3=>()=>n3,"constant$1");function Br(n3,e){return function(t){return n3+t*e}}h(Br,"linear");function Ur(n3,e,t){return n3=Math.pow(n3,t),e=Math.pow(e,t)-n3,t=1/t,function(i){return Math.pow(n3+i*e,t)}}h(Ur,"exponential");function qr(n3){return(n3=+n3)==1?oo:function(e,t){return t-e?Ur(e,t,n3):io(isNaN(e)?t:e)}}h(qr,"gamma");function oo(n3,e){var t=e-n3;return t?Br(n3,t):io(isNaN(n3)?e:n3)}h(oo,"nogamma");const Si=h(function n(e){var t=qr(e);function i(o,r){var s=t((o=Mt(o)).r,(r=Mt(r)).r),a=t(o.g,r.g),l=t(o.b,r.b),d=oo(o.opacity,r.opacity);return function(c){return o.r=s(c),o.g=a(c),o.b=l(c),o.opacity=d(c),o+""}}return h(i,"rgb$1"),i.gamma=n,i},"rgbGamma")(1);function ge(n3,e){return n3=+n3,e=+e,function(t){return n3*(1-t)+e*t}}h(ge,"interpolateNumber");var At=/[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,wt=new RegExp(At.source,"g");function Ir(n3){return function(){return n3}}h(Ir,"zero");function Or(n3){return function(e){return n3(e)+""}}h(Or,"one");function Nr(n3,e){var t=At.lastIndex=wt.lastIndex=0,i,o,r,s=-1,a=[],l=[];for(n3=n3+"",e=e+"";(i=At.exec(n3))&&(o=wt.exec(e));)(r=o.index)>t&&(r=e.slice(t,r),a[s]?a[s]+=r:a[++s]=r),(i=i[0])===(o=o[0])?a[s]?a[s]+=o:a[++s]=o:(a[++s]=null,l.push({i:s,x:ge(i,o)})),t=wt.lastIndex;return t<e.length&&(r=e.slice(t),a[s]?a[s]+=r:a[++s]=r),a.length<2?l[0]?Or(l[0].x):Ir(e):(e=l.length,function(d){for(var c=0,u;c<e;++c)a[(u=l[c]).i]=u.x(d);return a.join("")})}h(Nr,"interpolateString");var $i=180/Math.PI,Pt={translateX:0,translateY:0,rotate:0,skewX:0,scaleX:1,scaleY:1};function no(n3,e,t,i,o,r){var s,a,l;return(s=Math.sqrt(n3*n3+e*e))&&(n3/=s,e/=s),(l=n3*t+e*i)&&(t-=n3*l,i-=e*l),(a=Math.sqrt(t*t+i*i))&&(t/=a,i/=a,l/=a),n3*i<e*t&&(n3=-n3,e=-e,l=-l,s=-s),{translateX:o,translateY:r,rotate:Math.atan2(e,n3)*$i,skewX:Math.atan(l)*$i,scaleX:s,scaleY:a}}h(no,"decompose");var Je;function Hr(n3){const e=new(typeof DOMMatrix=="function"?DOMMatrix:WebKitCSSMatrix)(n3+"");return e.isIdentity?Pt:no(e.a,e.b,e.c,e.d,e.e,e.f)}h(Hr,"parseCss");function Vr(n3){return n3==null||(Je||(Je=document.createElementNS("http://www.w3.org/2000/svg","g")),Je.setAttribute("transform",n3),!(n3=Je.transform.baseVal.consolidate()))?Pt:(n3=n3.matrix,no(n3.a,n3.b,n3.c,n3.d,n3.e,n3.f))}h(Vr,"parseSvg");function ro(n3,e,t,i){function o(d){return d.length?d.pop()+" ":""}h(o,"pop");function r(d,c,u,p,g,_){if(d!==u||c!==p){var f=g.push("translate(",null,e,null,t);_.push({i:f-4,x:ge(d,u)},{i:f-2,x:ge(c,p)})}else(u||p)&&g.push("translate("+u+e+p+t)}h(r,"translate");function s(d,c,u,p){d!==c?(d-c>180?c+=360:c-d>180&&(d+=360),p.push({i:u.push(o(u)+"rotate(",null,i)-2,x:ge(d,c)})):c&&u.push(o(u)+"rotate("+c+i)}h(s,"rotate");function a(d,c,u,p){d!==c?p.push({i:u.push(o(u)+"skewX(",null,i)-2,x:ge(d,c)}):c&&u.push(o(u)+"skewX("+c+i)}h(a,"skewX");function l(d,c,u,p,g,_){if(d!==u||c!==p){var f=g.push(o(g)+"scale(",null,",",null,")");_.push({i:f-4,x:ge(d,u)},{i:f-2,x:ge(c,p)})}else(u!==1||p!==1)&&g.push(o(g)+"scale("+u+","+p+")")}return h(l,"scale"),function(d,c){var u=[],p=[];return d=n3(d),c=n3(c),r(d.translateX,d.translateY,c.translateX,c.translateY,u,p),s(d.rotate,c.rotate,u,p),a(d.skewX,c.skewX,u,p),l(d.scaleX,d.scaleY,c.scaleX,c.scaleY,u,p),d=c=null,function(g){for(var _=-1,f=p.length,b;++_<f;)u[(b=p[_]).i]=b.x(g);return u.join("")}}}h(ro,"interpolateTransform");var Wr=ro(Hr,"px, ","px)","deg)"),Yr=ro(Vr,", ",")",")"),Xr=1e-12;function Ci(n3){return((n3=Math.exp(n3))+1/n3)/2}h(Ci,"cosh");function Gr(n3){return((n3=Math.exp(n3))-1/n3)/2}h(Gr,"sinh");function jr(n3){return((n3=Math.exp(2*n3))-1)/(n3+1)}h(jr,"tanh");const Zr=h(function n2(e,t,i){function o(r,s){var a=r[0],l=r[1],d=r[2],c=s[0],u=s[1],p=s[2],g=c-a,_=u-l,f=g*g+_*_,b,w;if(f<Xr)w=Math.log(p/d)/e,b=h(function(F){return[a+F*g,l+F*_,d*Math.exp(e*F*w)]},"i");else{var S=Math.sqrt(f),C=(p*p-d*d+i*f)/(2*d*t*S),D=(p*p-d*d-i*f)/(2*p*t*S),M=Math.log(Math.sqrt(C*C+1)-C),k=Math.log(Math.sqrt(D*D+1)-D);w=(k-M)/e,b=h(function(F){var L=F*w,q=Ci(M),z=d/(t*S)*(q*jr(e*L+M)-Gr(M));return[a+z*g,l+z*_,d*q/Ci(e*L+M)]},"i")}return b.duration=w*1e3*e/Math.SQRT2,b}return h(o,"zoom"),o.rho=function(r){var s=Math.max(.001,+r),a=s*s,l=a*a;return n2(s,a,l)},o},"zoomRho")(Math.SQRT2,2,4);var Ce=0,ze=0,Pe=0,so=1e3,dt,Re,ct=0,we=0,ft=0,Oe=typeof performance=="object"&&performance.now?performance:Date,ao=typeof window=="object"&&window.requestAnimationFrame?window.requestAnimationFrame.bind(window):function(n3){setTimeout(n3,17)};function Xt(){return we||(ao(Kr),we=Oe.now()+ft)}h(Xt,"now");function Kr(){we=0}h(Kr,"clearNow");function ht(){this._call=this._time=this._next=null}h(ht,"Timer");ht.prototype=lo.prototype={constructor:ht,restart:h(function(n3,e,t){if(typeof n3!="function")throw new TypeError("callback is not a function");t=(t==null?Xt():+t)+(e==null?0:+e),!this._next&&Re!==this&&(Re?Re._next=this:dt=this,Re=this),this._call=n3,this._time=t,Lt()},"restart"),stop:h(function(){this._call&&(this._call=null,this._time=1/0,Lt())},"stop")};function lo(n3,e,t){var i=new ht;return i.restart(n3,e,t),i}h(lo,"timer");function Jr(){Xt(),++Ce;for(var n3=dt,e;n3;)(e=we-n3._time)>=0&&n3._call.call(void 0,e),n3=n3._next;--Ce}h(Jr,"timerFlush");function ki(){we=(ct=Oe.now())+ft,Ce=ze=0;try{Jr()}finally{Ce=0,es(),we=0}}h(ki,"wake");function Qr(){var n3=Oe.now(),e=n3-ct;e>so&&(ft-=e,ct=n3)}h(Qr,"poke");function es(){for(var n3,e=dt,t,i=1/0;e;)e._call?(i>e._time&&(i=e._time),n3=e,e=e._next):(t=e._next,e._next=null,e=n3?n3._next=t:dt=t);Re=n3,Lt(i)}h(es,"nap");function Lt(n3){if(!Ce){ze&&(ze=clearTimeout(ze));var e=n3-we;e>24?(n3<1/0&&(ze=setTimeout(ki,n3-Oe.now()-ft)),Pe&&(Pe=clearInterval(Pe))):(Pe||(ct=Oe.now(),Pe=setInterval(Qr,so)),Ce=1,ao(ki))}}h(Lt,"sleep");function Di(n3,e,t){var i=new ht;return e=e==null?0:+e,i.restart(o=>{i.stop(),n3(o+e)},e,t),i}h(Di,"timeout");var ts=Ht("start","end","cancel","interrupt"),is=[],co=0,Fi=1,Et=2,tt=3,Mi=4,zt=5,it=6;function _t(n3,e,t,i,o,r){var s=n3.__transition;if(!s)n3.__transition={};else if(t in s)return;os(n3,t,{name:e,index:i,group:o,on:ts,tween:is,time:r.time,delay:r.delay,duration:r.duration,ease:r.ease,timer:null,state:co})}h(_t,"schedule");function Gt(n3,e){var t=se(n3,e);if(t.state>co)throw new Error("too late; already scheduled");return t}h(Gt,"init");function de(n3,e){var t=se(n3,e);if(t.state>tt)throw new Error("too late; already running");return t}h(de,"set");function se(n3,e){var t=n3.__transition;if(!t||!(t=t[e]))throw new Error("transition not found");return t}h(se,"get");function os(n3,e,t){var i=n3.__transition,o;i[e]=t,t.timer=lo(r,0,t.time);function r(d){t.state=Fi,t.timer.restart(s,t.delay,t.time),t.delay<=d&&s(d-t.delay)}h(r,"schedule");function s(d){var c,u,p,g;if(t.state!==Fi)return l();for(c in i)if(g=i[c],g.name===t.name){if(g.state===tt)return Di(s);g.state===Mi?(g.state=it,g.timer.stop(),g.on.call("interrupt",n3,n3.__data__,g.index,g.group),delete i[c]):+c<e&&(g.state=it,g.timer.stop(),g.on.call("cancel",n3,n3.__data__,g.index,g.group),delete i[c])}if(Di(function(){t.state===tt&&(t.state=Mi,t.timer.restart(a,t.delay,t.time),a(d))}),t.state=Et,t.on.call("start",n3,n3.__data__,t.index,t.group),t.state===Et){for(t.state=tt,o=new Array(p=t.tween.length),c=0,u=-1;c<p;++c)(g=t.tween[c].value.call(n3,n3.__data__,t.index,t.group))&&(o[++u]=g);o.length=u+1}}h(s,"start");function a(d){for(var c=d<t.duration?t.ease.call(null,d/t.duration):(t.timer.restart(l),t.state=zt,1),u=-1,p=o.length;++u<p;)o[u].call(n3,c);t.state===zt&&(t.on.call("end",n3,n3.__data__,t.index,t.group),l())}h(a,"tick");function l(){t.state=it,t.timer.stop(),delete i[e];for(var d in i)return;delete n3.__transition}h(l,"stop")}h(os,"create");function ot(n3,e){var t=n3.__transition,i,o,r=true,s;if(t){e=e==null?null:e+"";for(s in t){if((i=t[s]).name!==e){r=false;continue}o=i.state>Et&&i.state<zt,i.state=it,i.timer.stop(),i.on.call(o?"interrupt":"cancel",n3,n3.__data__,i.index,i.group),delete t[s]}r&&delete n3.__transition}}h(ot,"interrupt");function ns(n3){return this.each(function(){ot(this,n3)})}h(ns,"selection_interrupt");function rs(n3,e){var t,i;return function(){var o=de(this,n3),r=o.tween;if(r!==t){i=t=r;for(var s=0,a=i.length;s<a;++s)if(i[s].name===e){i=i.slice(),i.splice(s,1);break}}o.tween=i}}h(rs,"tweenRemove");function ss(n3,e,t){var i,o;if(typeof t!="function")throw new Error;return function(){var r=de(this,n3),s=r.tween;if(s!==i){o=(i=s).slice();for(var a={name:e,value:t},l=0,d=o.length;l<d;++l)if(o[l].name===e){o[l]=a;break}l===d&&o.push(a)}r.tween=o}}h(ss,"tweenFunction");function as(n3,e){var t=this._id;if(n3+="",arguments.length<2){for(var i=se(this.node(),t).tween,o=0,r=i.length,s;o<r;++o)if((s=i[o]).name===n3)return s.value;return null}return this.each((e==null?rs:ss)(t,n3,e))}h(as,"transition_tween");function jt(n3,e,t){var i=n3._id;return n3.each(function(){var o=de(this,i);(o.value||(o.value={}))[e]=t.apply(this,arguments)}),function(o){return se(o,i).value[e]}}h(jt,"tweenValue");function ho(n3,e){var t;return(typeof e=="number"?ge:e instanceof Ie?Si:(t=Ie(e))?(e=t,Si):Nr)(n3,e)}h(ho,"interpolate");function ls(n3){return function(){this.removeAttribute(n3)}}h(ls,"attrRemove");function ds(n3){return function(){this.removeAttributeNS(n3.space,n3.local)}}h(ds,"attrRemoveNS");function cs(n3,e,t){var i,o=t+"",r;return function(){var s=this.getAttribute(n3);return s===o?null:s===i?r:r=e(i=s,t)}}h(cs,"attrConstant");function hs(n3,e,t){var i,o=t+"",r;return function(){var s=this.getAttributeNS(n3.space,n3.local);return s===o?null:s===i?r:r=e(i=s,t)}}h(hs,"attrConstantNS");function us(n3,e,t){var i,o,r;return function(){var s,a=t(this),l;return a==null?void this.removeAttribute(n3):(s=this.getAttribute(n3),l=a+"",s===l?null:s===i&&l===o?r:(o=l,r=e(i=s,a)))}}h(us,"attrFunction");function ps(n3,e,t){var i,o,r;return function(){var s,a=t(this),l;return a==null?void this.removeAttributeNS(n3.space,n3.local):(s=this.getAttributeNS(n3.space,n3.local),l=a+"",s===l?null:s===i&&l===o?r:(o=l,r=e(i=s,a)))}}h(ps,"attrFunctionNS");function gs(n3,e){var t=mt(n3),i=t==="transform"?Yr:ho;return this.attrTween(n3,typeof e=="function"?(t.local?ps:us)(t,i,jt(this,"attr."+n3,e)):e==null?(t.local?ds:ls)(t):(t.local?hs:cs)(t,i,e))}h(gs,"transition_attr");function ms(n3,e){return function(t){this.setAttribute(n3,e.call(this,t))}}h(ms,"attrInterpolate");function fs(n3,e){return function(t){this.setAttributeNS(n3.space,n3.local,e.call(this,t))}}h(fs,"attrInterpolateNS");function _s(n3,e){var t,i;function o(){var r=e.apply(this,arguments);return r!==i&&(t=(i=r)&&fs(n3,r)),t}return h(o,"tween"),o._value=e,o}h(_s,"attrTweenNS");function vs(n3,e){var t,i;function o(){var r=e.apply(this,arguments);return r!==i&&(t=(i=r)&&ms(n3,r)),t}return h(o,"tween"),o._value=e,o}h(vs,"attrTween");function bs(n3,e){var t="attr."+n3;if(arguments.length<2)return(t=this.tween(t))&&t._value;if(e==null)return this.tween(t,null);if(typeof e!="function")throw new Error;var i=mt(n3);return this.tween(t,(i.local?_s:vs)(i,e))}h(bs,"transition_attrTween");function ys(n3,e){return function(){Gt(this,n3).delay=+e.apply(this,arguments)}}h(ys,"delayFunction");function ws(n3,e){return e=+e,function(){Gt(this,n3).delay=e}}h(ws,"delayConstant");function xs(n3){var e=this._id;return arguments.length?this.each((typeof n3=="function"?ys:ws)(e,n3)):se(this.node(),e).delay}h(xs,"transition_delay");function Ss(n3,e){return function(){de(this,n3).duration=+e.apply(this,arguments)}}h(Ss,"durationFunction");function $s(n3,e){return e=+e,function(){de(this,n3).duration=e}}h($s,"durationConstant");function Cs(n3){var e=this._id;return arguments.length?this.each((typeof n3=="function"?Ss:$s)(e,n3)):se(this.node(),e).duration}h(Cs,"transition_duration");function ks(n3,e){if(typeof e!="function")throw new Error;return function(){de(this,n3).ease=e}}h(ks,"easeConstant");function Ds(n3){var e=this._id;return arguments.length?this.each(ks(e,n3)):se(this.node(),e).ease}h(Ds,"transition_ease");function Fs(n3,e){return function(){var t=e.apply(this,arguments);if(typeof t!="function")throw new Error;de(this,n3).ease=t}}h(Fs,"easeVarying");function Ms(n3){if(typeof n3!="function")throw new Error;return this.each(Fs(this._id,n3))}h(Ms,"transition_easeVarying");function As(n3){typeof n3!="function"&&(n3=Vi(n3));for(var e=this._groups,t=e.length,i=new Array(t),o=0;o<t;++o)for(var r=e[o],s=r.length,a=i[o]=[],l,d=0;d<s;++d)(l=r[d])&&n3.call(l,l.__data__,d,r)&&a.push(l);return new pe(i,this._parents,this._name,this._id)}h(As,"transition_filter");function Ps(n3){if(n3._id!==this._id)throw new Error;for(var e=this._groups,t=n3._groups,i=e.length,o=t.length,r=Math.min(i,o),s=new Array(i),a=0;a<r;++a)for(var l=e[a],d=t[a],c=l.length,u=s[a]=new Array(c),p,g=0;g<c;++g)(p=l[g]||d[g])&&(u[g]=p);for(;a<i;++a)s[a]=e[a];return new pe(s,this._parents,this._name,this._id)}h(Ps,"transition_merge");function Ls(n3){return(n3+"").trim().split(/^|\s+/).every(function(e){var t=e.indexOf(".");return t>=0&&(e=e.slice(0,t)),!e||e==="start"})}h(Ls,"start");function Es(n3,e,t){var i,o,r=Ls(e)?Gt:de;return function(){var s=r(this,n3),a=s.on;a!==i&&(o=(i=a).copy()).on(e,t),s.on=o}}h(Es,"onFunction");function zs(n3,e){var t=this._id;return arguments.length<2?se(this.node(),t).on.on(n3):this.each(Es(t,n3,e))}h(zs,"transition_on");function Rs(n3){return function(){var e=this.parentNode;for(var t in this.__transition)if(+t!==n3)return;e&&e.removeChild(this)}}h(Rs,"removeFunction");function Ts(){return this.on("end.remove",Rs(this._id))}h(Ts,"transition_remove");function Bs(n3){var e=this._name,t=this._id;typeof n3!="function"&&(n3=Vt(n3));for(var i=this._groups,o=i.length,r=new Array(o),s=0;s<o;++s)for(var a=i[s],l=a.length,d=r[s]=new Array(l),c,u,p=0;p<l;++p)(c=a[p])&&(u=n3.call(c,c.__data__,p,a))&&("__data__"in c&&(u.__data__=c.__data__),d[p]=u,_t(d[p],e,t,p,d,se(c,t)));return new pe(r,this._parents,e,t)}h(Bs,"transition_select");function Us(n3){var e=this._name,t=this._id;typeof n3!="function"&&(n3=Hi(n3));for(var i=this._groups,o=i.length,r=[],s=[],a=0;a<o;++a)for(var l=i[a],d=l.length,c,u=0;u<d;++u)if(c=l[u]){for(var p=n3.call(c,c.__data__,u,l),g,_=se(c,t),f=0,b=p.length;f<b;++f)(g=p[f])&&_t(g,e,t,f,p,_);r.push(p),s.push(c)}return new pe(r,s,e,t)}h(Us,"transition_selectAll");var qs=We.prototype.constructor;function Is(){return new qs(this._groups,this._parents)}h(Is,"transition_selection");function Os(n3,e){var t,i,o;return function(){var r=$e(this,n3),s=(this.style.removeProperty(n3),$e(this,n3));return r===s?null:r===t&&s===i?o:o=e(t=r,i=s)}}h(Os,"styleNull");function uo(n3){return function(){this.style.removeProperty(n3)}}h(uo,"styleRemove");function Ns(n3,e,t){var i,o=t+"",r;return function(){var s=$e(this,n3);return s===o?null:s===i?r:r=e(i=s,t)}}h(Ns,"styleConstant");function Hs(n3,e,t){var i,o,r;return function(){var s=$e(this,n3),a=t(this),l=a+"";return a==null&&(l=a=(this.style.removeProperty(n3),$e(this,n3))),s===l?null:s===i&&l===o?r:(o=l,r=e(i=s,a))}}h(Hs,"styleFunction");function Vs(n3,e){var t,i,o,r="style."+e,s="end."+r,a;return function(){var l=de(this,n3),d=l.on,c=l.value[r]==null?a||(a=uo(e)):void 0;(d!==t||o!==c)&&(i=(t=d).copy()).on(s,o=c),l.on=i}}h(Vs,"styleMaybeRemove");function Ws(n3,e,t){var i=(n3+="")=="transform"?Wr:ho;return e==null?this.styleTween(n3,Os(n3,i)).on("end.style."+n3,uo(n3)):typeof e=="function"?this.styleTween(n3,Hs(n3,i,jt(this,"style."+n3,e))).each(Vs(this._id,n3)):this.styleTween(n3,Ns(n3,i,e),t).on("end.style."+n3,null)}h(Ws,"transition_style");function Ys(n3,e,t){return function(i){this.style.setProperty(n3,e.call(this,i),t)}}h(Ys,"styleInterpolate");function Xs(n3,e,t){var i,o;function r(){var s=e.apply(this,arguments);return s!==o&&(i=(o=s)&&Ys(n3,s,t)),i}return h(r,"tween"),r._value=e,r}h(Xs,"styleTween");function Gs(n3,e,t){var i="style."+(n3+="");if(arguments.length<2)return(i=this.tween(i))&&i._value;if(e==null)return this.tween(i,null);if(typeof e!="function")throw new Error;return this.tween(i,Xs(n3,e,t??""))}h(Gs,"transition_styleTween");function js(n3){return function(){this.textContent=n3}}h(js,"textConstant");function Zs(n3){return function(){var e=n3(this);this.textContent=e??""}}h(Zs,"textFunction");function Ks(n3){return this.tween("text",typeof n3=="function"?Zs(jt(this,"text",n3)):js(n3==null?"":n3+""))}h(Ks,"transition_text");function Js(n3){return function(e){this.textContent=n3.call(this,e)}}h(Js,"textInterpolate");function Qs(n3){var e,t;function i(){var o=n3.apply(this,arguments);return o!==t&&(e=(t=o)&&Js(o)),e}return h(i,"tween"),i._value=n3,i}h(Qs,"textTween");function ea(n3){var e="text";if(arguments.length<1)return(e=this.tween(e))&&e._value;if(n3==null)return this.tween(e,null);if(typeof n3!="function")throw new Error;return this.tween(e,Qs(n3))}h(ea,"transition_textTween");function ta(){for(var n3=this._name,e=this._id,t=po(),i=this._groups,o=i.length,r=0;r<o;++r)for(var s=i[r],a=s.length,l,d=0;d<a;++d)if(l=s[d]){var c=se(l,e);_t(l,n3,t,d,s,{time:c.time+c.delay+c.duration,delay:0,duration:c.duration,ease:c.ease})}return new pe(i,this._parents,n3,t)}h(ta,"transition_transition");function ia(){var n3,e,t=this,i=t._id,o=t.size();return new Promise(function(r,s){var a={value:s},l={value:h(function(){--o===0&&r()},"value")};t.each(function(){var d=de(this,i),c=d.on;c!==n3&&(e=(n3=c).copy(),e._.cancel.push(a),e._.interrupt.push(a),e._.end.push(l)),d.on=e}),o===0&&r()})}h(ia,"transition_end");var oa=0;function pe(n3,e,t,i){this._groups=n3,this._parents=e,this._name=t,this._id=i}h(pe,"Transition");function po(){return++oa}h(po,"newId");var he=We.prototype;pe.prototype={constructor:pe,select:Bs,selectAll:Us,selectChild:he.selectChild,selectChildren:he.selectChildren,filter:As,merge:Ps,selection:Is,transition:ta,call:he.call,nodes:he.nodes,node:he.node,size:he.size,empty:he.empty,each:he.each,on:zs,attr:gs,attrTween:bs,style:Ws,styleTween:Gs,text:Ks,textTween:ea,remove:Ts,tween:as,delay:xs,duration:Cs,ease:Ds,easeVarying:Ms,end:ia,[Symbol.iterator]:he[Symbol.iterator]};function na(n3){return((n3*=2)<=1?n3*n3*n3:(n3-=2)*n3*n3+2)/2}h(na,"cubicInOut");var ra={time:null,delay:0,duration:250,ease:na};function sa(n3,e){for(var t;!(t=n3.__transition)||!(t=t[e]);)if(!(n3=n3.parentNode))throw new Error(`transition ${e} not found`);return t}h(sa,"inherit");function aa(n3){var e,t;n3 instanceof pe?(e=n3._id,n3=n3._name):(e=po(),(t=ra).time=Xt(),n3=n3==null?null:n3+"");for(var i=this._groups,o=i.length,r=0;r<o;++r)for(var s=i[r],a=s.length,l,d=0;d<a;++d)(l=s[d])&&_t(l,n3,e,d,s,t||sa(l,e));return new pe(i,this._parents,n3,e)}h(aa,"selection_transition");We.prototype.interrupt=ns;We.prototype.transition=aa;const Qe=h(n3=>()=>n3,"constant");function la(n3,{sourceEvent:e,target:t,transform:i,dispatch:o}){Object.defineProperties(this,{type:{value:n3,enumerable:true,configurable:true},sourceEvent:{value:e,enumerable:true,configurable:true},target:{value:t,enumerable:true,configurable:true},transform:{value:i,enumerable:true,configurable:true},_:{value:o}})}h(la,"ZoomEvent");function ue(n3,e,t){this.k=n3,this.x=e,this.y=t}h(ue,"Transform");ue.prototype={constructor:ue,scale:h(function(n3){return n3===1?this:new ue(this.k*n3,this.x,this.y)},"scale"),translate:h(function(n3,e){return n3===0&e===0?this:new ue(this.k,this.x+this.k*n3,this.y+this.k*e)},"translate"),apply:h(function(n3){return[n3[0]*this.k+this.x,n3[1]*this.k+this.y]},"apply"),applyX:h(function(n3){return n3*this.k+this.x},"applyX"),applyY:h(function(n3){return n3*this.k+this.y},"applyY"),invert:h(function(n3){return[(n3[0]-this.x)/this.k,(n3[1]-this.y)/this.k]},"invert"),invertX:h(function(n3){return(n3-this.x)/this.k},"invertX"),invertY:h(function(n3){return(n3-this.y)/this.k},"invertY"),rescaleX:h(function(n3){return n3.copy().domain(n3.range().map(this.invertX,this).map(n3.invert,n3))},"rescaleX"),rescaleY:h(function(n3){return n3.copy().domain(n3.range().map(this.invertY,this).map(n3.invert,n3))},"rescaleY"),toString:h(function(){return"translate("+this.x+","+this.y+") scale("+this.k+")"},"toString")};var Te=new ue(1,0,0);ue.prototype;function xt(n3){n3.stopImmediatePropagation()}h(xt,"nopropagation");function Le(n3){n3.preventDefault(),n3.stopImmediatePropagation()}h(Le,"noevent");function da(n3){return(!n3.ctrlKey||n3.type==="wheel")&&!n3.button}h(da,"defaultFilter");function ca(){var n3=this;return n3 instanceof SVGElement?(n3=n3.ownerSVGElement||n3,n3.hasAttribute("viewBox")?(n3=n3.viewBox.baseVal,[[n3.x,n3.y],[n3.x+n3.width,n3.y+n3.height]]):[[0,0],[n3.width.baseVal.value,n3.height.baseVal.value]]):[[0,0],[n3.clientWidth,n3.clientHeight]]}h(ca,"defaultExtent");function Ai(){return this.__zoom||Te}h(Ai,"defaultTransform");function ha(n3){return-n3.deltaY*(n3.deltaMode===1?.05:n3.deltaMode?1:.002)*(n3.ctrlKey?10:1)}h(ha,"defaultWheelDelta");function ua(){return navigator.maxTouchPoints||"ontouchstart"in this}h(ua,"defaultTouchable");function pa(n3,e,t){var i=n3.invertX(e[0][0])-t[0][0],o=n3.invertX(e[1][0])-t[1][0],r=n3.invertY(e[0][1])-t[0][1],s=n3.invertY(e[1][1])-t[1][1];return n3.translate(o>i?(i+o)/2:Math.min(0,i)||Math.max(0,o),s>r?(r+s)/2:Math.min(0,r)||Math.max(0,s))}h(pa,"defaultConstrain");function ga(){var n3=da,e=ca,t=pa,i=ha,o=ua,r=[0,1/0],s=[[-1/0,-1/0],[1/0,1/0]],a=250,l=Zr,d=Ht("start","zoom","end"),c,u,p,g=500,_=150,f=0,b=10;function w(y){y.property("__zoom",Ai).on("wheel.zoom",L,{passive:false}).on("mousedown.zoom",q).on("dblclick.zoom",z).filter(o).on("touchstart.zoom",U).on("touchmove.zoom",T).on("touchend.zoom touchcancel.zoom",N).style("-webkit-tap-highlight-color","rgba(0,0,0,0)")}h(w,"zoom"),w.transform=function(y,x,$,A){var P=y.selection?y.selection():y;P.property("__zoom",Ai),y!==P?M(y,x,$,A):P.interrupt().each(function(){k(this,arguments).event(A).start().zoom(null,typeof x=="function"?x.apply(this,arguments):x).end()})},w.scaleBy=function(y,x,$,A){w.scaleTo(y,function(){var P=this.__zoom.k,E=typeof x=="function"?x.apply(this,arguments):x;return P*E},$,A)},w.scaleTo=function(y,x,$,A){w.transform(y,function(){var P=e.apply(this,arguments),E=this.__zoom,B=$==null?D(P):typeof $=="function"?$.apply(this,arguments):$,I=E.invert(B),O=typeof x=="function"?x.apply(this,arguments):x;return t(C(S(E,O),B,I),P,s)},$,A)},w.translateBy=function(y,x,$,A){w.transform(y,function(){return t(this.__zoom.translate(typeof x=="function"?x.apply(this,arguments):x,typeof $=="function"?$.apply(this,arguments):$),e.apply(this,arguments),s)},null,A)},w.translateTo=function(y,x,$,A,P){w.transform(y,function(){var E=e.apply(this,arguments),B=this.__zoom,I=A==null?D(E):typeof A=="function"?A.apply(this,arguments):A;return t(Te.translate(I[0],I[1]).scale(B.k).translate(typeof x=="function"?-x.apply(this,arguments):-x,typeof $=="function"?-$.apply(this,arguments):-$),E,s)},A,P)};function S(y,x){return x=Math.max(r[0],Math.min(r[1],x)),x===y.k?y:new ue(x,y.x,y.y)}h(S,"scale");function C(y,x,$){var A=x[0]-$[0]*y.k,P=x[1]-$[1]*y.k;return A===y.x&&P===y.y?y:new ue(y.k,A,P)}h(C,"translate");function D(y){return[(+y[0][0]+ +y[1][0])/2,(+y[0][1]+ +y[1][1])/2]}h(D,"centroid");function M(y,x,$,A){y.on("start.zoom",function(){k(this,arguments).event(A).start()}).on("interrupt.zoom end.zoom",function(){k(this,arguments).event(A).end()}).tween("zoom",function(){var P=this,E=arguments,B=k(P,E).event(A),I=e.apply(P,E),O=$==null?D(I):typeof $=="function"?$.apply(P,E):$,V=Math.max(I[1][0]-I[0][0],I[1][1]-I[0][1]),H=P.__zoom,Y=typeof x=="function"?x.apply(P,E):x,X=l(H.invert(O).concat(V/H.k),Y.invert(O).concat(V/Y.k));return function(G){if(G===1)G=Y;else{var W=X(G),J=V/W[2];G=new ue(J,O[0]-W[0]*J,O[1]-W[1]*J)}B.zoom(null,G)}})}h(M,"schedule");function k(y,x,$){return!$&&y.__zooming||new F(y,x)}h(k,"gesture");function F(y,x){this.that=y,this.args=x,this.active=0,this.sourceEvent=null,this.extent=e.apply(y,x),this.taps=0}h(F,"Gesture"),F.prototype={event:h(function(y){return y&&(this.sourceEvent=y),this},"event"),start:h(function(){return++this.active===1&&(this.that.__zooming=this,this.emit("start")),this},"start"),zoom:h(function(y,x){return this.mouse&&y!=="mouse"&&(this.mouse[1]=x.invert(this.mouse[0])),this.touch0&&y!=="touch"&&(this.touch0[1]=x.invert(this.touch0[0])),this.touch1&&y!=="touch"&&(this.touch1[1]=x.invert(this.touch1[0])),this.that.__zoom=x,this.emit("zoom"),this},"zoom"),end:h(function(){return--this.active===0&&(delete this.that.__zooming,this.emit("end")),this},"end"),emit:h(function(y){var x=te(this.that).datum();d.call(y,this.that,new la(y,{sourceEvent:this.sourceEvent,target:w,transform:this.that.__zoom,dispatch:d}),x)},"emit")};function L(y,...x){if(!n3.apply(this,arguments))return;var $=k(this,x).event(y),A=this.__zoom,P=Math.max(r[0],Math.min(r[1],A.k*Math.pow(2,i.apply(this,arguments)))),E=ve(y);if($.wheel)($.mouse[0][0]!==E[0]||$.mouse[0][1]!==E[1])&&($.mouse[1]=A.invert($.mouse[0]=E)),clearTimeout($.wheel);else{if(A.k===P)return;$.mouse=[E,A.invert(E)],ot(this),$.start()}Le(y),$.wheel=setTimeout(B,_),$.zoom("mouse",t(C(S(A,P),$.mouse[0],$.mouse[1]),$.extent,s));function B(){$.wheel=null,$.end()}h(B,"wheelidled")}h(L,"wheeled");function q(y,...x){if(p||!n3.apply(this,arguments))return;var $=y.currentTarget,A=k(this,x,true).event(y),P=te(y.view).on("mousemove.zoom",O,true).on("mouseup.zoom",V,true),E=ve(y,$),B=y.clientX,I=y.clientY;Sr(y.view),xt(y),A.mouse=[E,this.__zoom.invert(E)],ot(this),A.start();function O(H){if(Le(H),!A.moved){var Y=H.clientX-B,X=H.clientY-I;A.moved=Y*Y+X*X>f}A.event(H).zoom("mouse",t(C(A.that.__zoom,A.mouse[0]=ve(H,$),A.mouse[1]),A.extent,s))}h(O,"mousemoved");function V(H){P.on("mousemove.zoom mouseup.zoom",null),$r(H.view,A.moved),Le(H),A.event(H).end()}h(V,"mouseupped")}h(q,"mousedowned");function z(y,...x){if(n3.apply(this,arguments)){var $=this.__zoom,A=ve(y.changedTouches?y.changedTouches[0]:y,this),P=$.invert(A),E=$.k*(y.shiftKey?.5:2),B=t(C(S($,E),A,P),e.apply(this,x),s);Le(y),a>0?te(this).transition().duration(a).call(M,B,A,y):te(this).call(w.transform,B,A,y)}}h(z,"dblclicked");function U(y,...x){if(n3.apply(this,arguments)){var $=y.touches,A=$.length,P=k(this,x,y.changedTouches.length===A).event(y),E,B,I,O;for(xt(y),B=0;B<A;++B)I=$[B],O=ve(I,this),O=[O,this.__zoom.invert(O),I.identifier],P.touch0?!P.touch1&&P.touch0[2]!==O[2]&&(P.touch1=O,P.taps=0):(P.touch0=O,E=true,P.taps=1+!!c);c&&(c=clearTimeout(c)),E&&(P.taps<2&&(u=O[0],c=setTimeout(function(){c=null},g)),ot(this),P.start())}}h(U,"touchstarted");function T(y,...x){if(this.__zooming){var $=k(this,x).event(y),A=y.changedTouches,P=A.length,E,B,I,O;for(Le(y),E=0;E<P;++E)B=A[E],I=ve(B,this),$.touch0&&$.touch0[2]===B.identifier?$.touch0[0]=I:$.touch1&&$.touch1[2]===B.identifier&&($.touch1[0]=I);if(B=$.that.__zoom,$.touch1){var V=$.touch0[0],H=$.touch0[1],Y=$.touch1[0],X=$.touch1[1],G=(G=Y[0]-V[0])*G+(G=Y[1]-V[1])*G,W=(W=X[0]-H[0])*W+(W=X[1]-H[1])*W;B=S(B,Math.sqrt(G/W)),I=[(V[0]+Y[0])/2,(V[1]+Y[1])/2],O=[(H[0]+X[0])/2,(H[1]+X[1])/2]}else if($.touch0)I=$.touch0[0],O=$.touch0[1];else return;$.zoom("touch",t(C(B,I,O),$.extent,s))}}h(T,"touchmoved");function N(y,...x){if(this.__zooming){var $=k(this,x).event(y),A=y.changedTouches,P=A.length,E,B;for(xt(y),p&&clearTimeout(p),p=setTimeout(function(){p=null},g),E=0;E<P;++E)B=A[E],$.touch0&&$.touch0[2]===B.identifier?delete $.touch0:$.touch1&&$.touch1[2]===B.identifier&&delete $.touch1;if($.touch1&&!$.touch0&&($.touch0=$.touch1,delete $.touch1),$.touch0)$.touch0[1]=this.__zoom.invert($.touch0[0]);else if($.end(),$.taps===2&&(B=ve(B,this),Math.hypot(u[0]-B[0],u[1]-B[1])<b)){var I=te(this).on("dblclick.zoom");I&&I.apply(this,arguments)}}}return h(N,"touchended"),w.wheelDelta=function(y){return arguments.length?(i=typeof y=="function"?y:Qe(+y),w):i},w.filter=function(y){return arguments.length?(n3=typeof y=="function"?y:Qe(!!y),w):n3},w.touchable=function(y){return arguments.length?(o=typeof y=="function"?y:Qe(!!y),w):o},w.extent=function(y){return arguments.length?(e=typeof y=="function"?y:Qe([[+y[0][0],+y[0][1]],[+y[1][0],+y[1][1]]]),w):e},w.scaleExtent=function(y){return arguments.length?(r[0]=+y[0],r[1]=+y[1],w):[r[0],r[1]]},w.translateExtent=function(y){return arguments.length?(s[0][0]=+y[0][0],s[1][0]=+y[1][0],s[0][1]=+y[0][1],s[1][1]=+y[1][1],w):[[s[0][0],s[0][1]],[s[1][0],s[1][1]]]},w.constrain=function(y){return arguments.length?(t=y,w):t},w.duration=function(y){return arguments.length?(a=+y,w):a},w.interpolate=function(y){return arguments.length?(l=y,w):l},w.on=function(){var y=d.on.apply(d,arguments);return y===d?w:y},w.clickDistance=function(y){return arguments.length?(f=(y=+y)*y,w):Math.sqrt(f)},w.tapDistance=function(y){return arguments.length?(b=+y,w):b},w}h(ga,"zoom");function ma(n3,e,t,i=null){const o=e.querySelector(".preview-panel");if(!o)return null;const r=o.querySelector("lcards-msd-live-preview");if(!r)return null;const s=r.shadowRoot;if(!s)return null;const a=s.querySelector(".preview-card-container");if(!a)return null;const l=a.querySelector("lcards-msd-card");if(!l)return null;const d=l.shadowRoot||l.renderRoot;if(!d)return null;const c=d.querySelector("svg");if(!c)return null;const u=c.viewBox.baseVal;if(!u||u.width<=0||u.height<=0)return null;const{x:p,y:g,width:_,height:f}=u,b=c.getBoundingClientRect(),w=o.getBoundingClientRect(),S=_/b.width,C=f/b.height,D=Math.max(S,C),M=_/D,k=f/D,F=(b.width-M)/2,L=(b.height-k)/2,q=n3.clientX-w.left,z=n3.clientY-w.top,U=b.left-w.left,T=b.top-w.top,N=q-U-F,y=z-T-L,x=N*D+p,$=y*D+g;return{x,y:$}}h(ma,"getPreviewCoordinatesFromMouseEvent");function Pi(n3,e,t,i){return[Math.round(n3/t)*t,Math.round(e/t)*t]}h(Pi,"snapToGrid");const fa=new Set(["hull_center","extremity_bow","extremity_stern","extremity_top","extremity_bottom","lateral_a","lateral_b"]);function _a(n3){const e={},t={};for(const[i,o]of Object.entries(n3))fa.has(i)?e[i]=o:t[i]=o;return{computed:e,harvested:t}}h(_a,"splitBaseSvgAnchorsBySource");function Zt(n3,e){var c,u,p,g,_,f;const t=(u=(c=n3.msd)==null?void 0:c.base_svg)==null?void 0:u.source;if(!t||!t.startsWith("builtin:"))return{};const i=e==null?void 0:e.querySelector("lcards-msd-live-preview");if(!i)return{};const o=i.shadowRoot;if(!o)return{};const r=o.querySelector(".preview-card-container");if(!r)return{};const s=r.querySelector("lcards-msd-card");if(!s)return{};const a=((_=(g=(p=s._msdPipeline)==null?void 0:p.getResolvedModel)==null?void 0:g.call(p))==null?void 0:_.anchors)||{},l=((f=n3.msd)==null?void 0:f.anchors)||{},d={};for(const[b,w]of Object.entries(a))l[b]||(d[b]=w);return d}h(Zt,"getBaseSvgAnchors");function go(n3,e,t){var i;if(m.debug("[MSDStudio] Resolving control position:",n3.id,"position:",n3.position,"anchor:",n3.anchor),n3.position&&Array.isArray(n3.position))return m.debug("[MSDStudio] Control has direct position:",n3.position),n3.position;if(n3.anchor){const o=((i=e.msd)==null?void 0:i.anchors)||{},r=Zt(e,t),a={...o,...r}[n3.anchor];return m.debug("[MSDStudio] Control resolved from anchor:",n3.anchor,"→",a),a||null}return m.warn("[MSDStudio] Control has no position or anchor:",n3.id),null}h(go,"resolveControlPosition");function va(n3,e,t,i){var d,c;const o=((d=t.msd)==null?void 0:d.overlays)||[],r=((c=t.msd)==null?void 0:c.anchors)||{},s=Zt(t,i),a={...r,...s};if(a[n3])return a[n3];const l=o.find(u=>u.id===n3&&u.type==="control");if(l){const u=go(l,t,i);if(!u)return null;const[p,g]=u,_=l.size||[100,100],[f,b]=_;if(!e||e==="center")return[p+f/2,g+b/2];switch(e){case"top":return[p+f/2,g];case"bottom":return[p+f/2,g+b];case"left":return[p,g+b/2];case"right":return[p+f,g+b/2];case"top-left":return[p,g];case"top-right":return[p+f,g];case"bottom-left":return[p,g+b];case"bottom-right":return[p+f,g+b];default:return[p+f/2,g+b/2]}}return null}h(va,"resolvePositionWithSide");const ba=gt`
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
        box-shadow: var(--ha-box-shadow-m);
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
        width: 300px;
        background: var(--card-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 12px;
        box-shadow: var(--ha-box-shadow-m);
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
        /* Set rows too: the shared sheet's <=1024px rule stacks into 1fr 1fr rows,
           which with these two columns left an empty half-height second row. */
        grid-template-rows: minmax(0, 1fr);
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
        box-shadow: var(--ha-box-shadow-s);
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
        box-shadow: var(--ha-box-shadow-s);
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

    /* Quick label: style picker panel, bottom-left where the other modes show
       their hint (the expanded canvas toolbar can wrap across the whole top) */
    .preview-container[data-mode="quick_label"],
    .preview-container[data-mode="quick_label"] * {
        cursor: crosshair;
    }

    .quick-label-panel {
        position: absolute;
        bottom: 12px;
        left: 12px;
        width: 300px;
        max-width: calc(100% - 24px);
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-2);
        padding: var(--ha-space-3);
        background: var(--card-background-color);
        border: var(--ha-border-width-sm) solid var(--divider-color);
        border-radius: var(--ha-card-border-radius, var(--ha-border-radius-lg));
        box-shadow: var(--ha-box-shadow-m);
        font-family: var(--ha-font-family-body);
        pointer-events: auto;
        cursor: default;
    }

    .quick-label-row {
        display: flex;
        flex-wrap: wrap;
    }

    .quick-label-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin: calc(-1 * var(--ha-space-2)) calc(-1 * var(--ha-space-2)) 0 0;
    }

    .quick-label-handle {
        flex: 1 1 auto;
        display: flex;
        align-items: center;
        gap: var(--ha-space-1);
        cursor: grab;
        touch-action: none;
        user-select: none;
        color: var(--secondary-text-color);
        font-size: var(--ha-font-size-s);
    }

    .quick-label-handle:active {
        cursor: grabbing;
    }

    .quick-label-step {
        font-weight: var(--ha-font-weight-medium);
    }

    .style-clipboard-bar {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--ha-space-2);
        margin-bottom: var(--ha-space-4);
        padding: var(--ha-space-2) var(--ha-space-3);
        border: var(--ha-border-width-sm) solid var(--divider-color);
        border-radius: var(--ha-border-radius-lg);
        font-size: var(--ha-font-size-s);
        color: var(--secondary-text-color);
    }

    .style-clipboard-bar span {
        flex: 1 1 auto;
    }

    .quick-label-fields {
        display: flex;
        gap: var(--ha-space-2);
    }

    .quick-label-text {
        flex: 1 1 0;
        min-width: 0;
    }

    .quick-label-panel wa-button-group ha-button::part(base) {
        min-height: 28px;
        height: 28px;
        padding-block: 0;
        font-size: var(--ha-font-size-s);
        border-radius: 0;
    }

    .quick-label-panel wa-button-group ha-button:not(:last-child)::part(base) {
        border-inline-end: none;
    }

    .quick-label-panel wa-button-group ha-button:first-child::part(base) {
        border-start-start-radius: var(--ha-border-radius-pill);
        border-end-start-radius: var(--ha-border-radius-pill);
    }

    .quick-label-panel wa-button-group ha-button:last-child::part(base) {
        border-start-end-radius: var(--ha-border-radius-pill);
        border-end-end-radius: var(--ha-border-radius-pill);
    }
`,ya=gt`
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
`,Jt=class Jt2{constructor(e){this.dialog=e,this._cardPickerLoadThrottle=null,this._isLoaded=false}async ensureComponentsLoaded(){let t=0;if(customElements.get("hui-card-picker"))return this._isLoaded=true,true;for(m.debug("[MSDCardPickerManager] 🔄 Attempting to load card picker...");!customElements.get("hui-card-picker")&&t<10;){m.debug(`[MSDCardPickerManager] Load attempt ${t+1}/10`);try{if(await this.loadCustomElements(),customElements.get("hui-card-picker"))return this._isLoaded=true,m.debug(`[MSDCardPickerManager] ✅ Card picker loaded after ${t+1} attempts`),true}catch(i){m.trace("[MSDCardPickerManager] Load attempt failed:",i)}await new Promise(i=>setTimeout(i,100)),t++}return this._isLoaded||(m.debug("[MSDCardPickerManager] ℹ️ Card picker not available"),m.debug('[MSDCardPickerManager] 💡 To enable: Close this dialog, click dashboard "Add Card" button, then cancel and reopen MSD Studio')),false}async loadCustomElements(){var e;if(customElements.get("hui-card-picker")){m.debug("[MSDCardPickerManager] hui-card-picker already available");return}try{let t=document.querySelector("home-assistant");if(!t){m.trace("[MSDCardPickerManager] home-assistant element not found");return}if(t=t.shadowRoot,!t){m.trace("[MSDCardPickerManager] home-assistant shadowRoot not found");return}if(t=t.querySelector("home-assistant-main"),t=t&&t.shadowRoot,t=t&&t.querySelector("app-drawer-layout partial-panel-resolver, ha-drawer partial-panel-resolver"),t=t&&t.shadowRoot||t,t=t&&t.querySelector("ha-panel-lovelace"),!t){m.trace("[MSDCardPickerManager] ha-panel-lovelace not found in shadow DOM");return}if(t=t.shadowRoot,t=t&&t.querySelector("hui-root"),!t){m.trace("[MSDCardPickerManager] hui-root not found");return}const i=(t.shadowRoot||t).querySelector("hui-view");if(!i){m.trace("[MSDCardPickerManager] hui-view not found");return}i.dispatchEvent(new CustomEvent("ll-create-card",{bubbles:true,composed:true,detail:{path:["views",i.index,"cards"],suggested:["lcards-button","lcards-slider","lcards-elbow","lcards-chart","lcards-data-grid"]}}));const o=document.querySelector("home-assistant"),r=20;let s=false;for(let a=0;a<r&&!s;a++){await new Promise(d=>setTimeout(d,50));const l=(e=o==null?void 0:o.shadowRoot)==null?void 0:e.querySelector("hui-dialog-create-card");if(l){m.trace(`[MSDCardPickerManager] Found hui-dialog-create-card (attempt ${a+1}), closing it...`),typeof l.closeDialog=="function"?l.closeDialog():l.close?l.close():l.opened!==void 0&&(l.opened=false);try{l.remove(),m.trace("[MSDCardPickerManager] Removed hui-dialog-create-card from DOM")}catch(d){m.trace("[MSDCardPickerManager] Could not remove dialog:",d.message)}s=true}}s||m.trace("[MSDCardPickerManager] hui-dialog-create-card never appeared within the poll window"),await new Promise(a=>setTimeout(a,100)),customElements.get("hui-card-picker")?m.debug("[MSDCardPickerManager] ✅ hui-card-picker loaded via ll-create-card event"):m.trace("[MSDCardPickerManager] hui-card-picker not loaded after event")}catch(t){m.trace("[MSDCardPickerManager] loadCustomElements failed:",t.message)}}isLoaded(){return this._isLoaded}cleanup(){this._cardPickerLoadThrottle&&(clearTimeout(this._cardPickerLoadThrottle),this._cardPickerLoadThrottle=null),m.debug("[MSDCardPickerManager] 🧹 Cleanup complete")}};h(Jt,"MSDCardPickerManager");let Rt=Jt;const Qt=class Qt2{constructor(e){this.dialog=e,this._boundCardPickerHandler=null,this._boundDialogClosedHandler=null,this._boundElementEditorHandler=null,this._elementEditSession={active:false,timestamp:0,savedState:null},this._lastElementEditorLogTime=0,this._elementEditorLogThrottle=1e3}setupEventInterception(){this._boundCardPickerHandler=e=>{var t,i,o;if(this._isElementEditorEvent(e)){m.debug("[MSDEventInterceptor] Element editor event, allowing propagation"),this._elementEditSession.active=true,this._elementEditSession.timestamp=Date.now();return}if(e.type==="config-changed"&&((t=e.detail)!=null&&t.config)&&((o=(i=e.target)==null?void 0:i.tagName)==null?void 0:o.toLowerCase())==="hui-card-picker"){const r=e.composedPath?e.composedPath():[];if(this._isEventFromOurStudio(r)){m.debug("[MSDEventInterceptor] 🎯 Card picker selection captured:",e.detail.config.type),e.stopImmediatePropagation&&e.stopImmediatePropagation(),e.stopPropagation(),this.dialog._handleCardPickerSelection(e.detail.config);return}}},this._boundDialogClosedHandler=e=>{var t,i;if(((t=e.target)==null?void 0:t.tagName)==="HUI-DIALOG-EDIT-CARD"){const o=e.target;(i=this.dialog._activeChildEditors)!=null&&i.has(o)&&(m.debug("[MSDEventInterceptor] 🔒 Child editor closed"),this.dialog._activeChildEditors.delete(o),o._handlingElementEdit&&setTimeout(()=>{this._elementEditSession.active&&Date.now()-this._elementEditSession.timestamp>500&&(this._elementEditSession.active=false)},500),this.dialog.requestUpdate())}},this._boundElementEditorHandler=e=>{(e.type==="element-updated"||e.type==="show-edit-element")&&!this._elementEditSession.active&&(m.debug("[MSDEventInterceptor] 🎨 Element editor session started"),this._elementEditSession.active=true,this._elementEditSession.timestamp=Date.now())},document.addEventListener("config-changed",this._boundCardPickerHandler,{capture:true}),document.addEventListener("dialog-closed",this._boundDialogClosedHandler,{capture:true}),document.addEventListener("element-updated",this._boundElementEditorHandler,{capture:true}),document.addEventListener("show-edit-element",this._boundElementEditorHandler,{capture:true}),m.debug("[MSDEventInterceptor] ✅ Event interception setup complete")}_isElementEditorEvent(e){if(!e)return false;const t=Date.now(),i=t-this._lastElementEditorLogTime>this._elementEditorLogThrottle;if(e.detail&&(e.detail.fromElementEditor||e.detail.elementConfig||e.detail.elementToEdit||e.detail.element))return i&&(m.debug("[MSDEventInterceptor] 🔍 Element editor detected via event detail"),this._lastElementEditorLogTime=t),true;const o=e.composedPath?e.composedPath():[];for(const r of o)if(!(!r||!r.localName)&&(r.localName==="hui-element-editor"||r.localName==="hui-dialog-edit-element"||r.localName==="hui-card-element-editor"||r.localName.includes("element-editor")))return i&&(m.debug("[MSDEventInterceptor] 🔍 Element editor detected via path:",r.localName),this._lastElementEditorLogTime=t),true;return!!(this._elementEditSession.active&&Date.now()-this._elementEditSession.timestamp<5e3)}_isEventFromOurStudio(e){return e.some(t=>t===this.dialog||t.shadowRoot&&t.shadowRoot.contains(this.dialog)||this.dialog.shadowRoot&&this.dialog.shadowRoot.contains(t))}cleanupEventInterception(){this._boundCardPickerHandler&&document.removeEventListener("config-changed",this._boundCardPickerHandler,{capture:true}),this._boundDialogClosedHandler&&document.removeEventListener("dialog-closed",this._boundDialogClosedHandler,{capture:true}),this._boundElementEditorHandler&&(document.removeEventListener("element-updated",this._boundElementEditorHandler,{capture:true}),document.removeEventListener("show-edit-element",this._boundElementEditorHandler,{capture:true})),m.debug("[MSDEventInterceptor] 🧹 Event interception cleanup complete")}};h(Qt,"MSDEventInterceptor");let Tt=Qt;const wa="var(--lcars-card-top-color, var(--lcards-gray-medium))",St="theme:colors.ui.secondary",Ne={classic:{label:"Classic sweep",description:"Out of the side, one broad round bend into the part.",px:{font:13,line:2,gap:6}},picard:{label:"Picard tight",description:"Out of the side, one small bend; a thicker line.",px:{font:13,line:2.5,gap:6,radius:10}},bracket:{label:"Picard bracket",description:"A bar beside the label; the line leaves the top or bottom of the bar, straight or into one sharp diagonal.",px:{font:13,line:2.5,bar:6,stub:64}},tag:{label:"Picard tag",description:"A filled block; the line leaves its side.",px:{font:13,line:2.5,radius:10}}},xa={level:{label:"Level",description:"Straight out: the end of the bar sits at the part's height."},angled:{label:"Angled",description:"A stub along the bar, then one sharp diagonal."}},mo="NEW LABEL",ee=h(n3=>Math.round(n3*10)/10,"r1");function Sa(n3,e){return String(n3||"").length*e*.5}h(Sa,"estimateTextWidth");function fo(n3,e){return e?n3:8}h(fo,"labelTextPad");function _o(n3,e,t){return ee(Sa(n3,e)+fo(e,t)*2+e)}h(_o,"labelBoxWidth");function Li(n3){var i,o;const e=Array.isArray(n3)?n3:[],t=new Map(e.filter(r=>r==null?void 0:r.id).map(r=>[r.id,r]));for(const r of e){if((r==null?void 0:r.type)!=="line"||typeof r.anchor!="string")continue;const s=t.get(r.anchor),a=(s==null?void 0:s.type)==="control"?s.card:null;if(!a||a.type!=="custom:lcards-button")continue;if(a.preset==="panel-dark"||a.preset==="panel-light")return{style:"tag",bracketKind:"level"};if(a.preset!=="text-only")continue;const l=(o=(i=a.style)==null?void 0:i.border)==null?void 0:o.width;return l&&typeof l=="object"&&(l.left||l.right)?{style:"bracket",bracketKind:r.route==="angled"?"angled":"level"}:r.corner_radius!==void 0&&r.corner_radius!==null?{style:"picard",bracketKind:"level"}:{style:"classic",bracketKind:"level"}}return null}h(Li,"guessQuickLabelStyle");const He={xsmall:{label:"XS",name:"Extra small",width:1e3},small:{label:"S",name:"Small",width:700},medium:{label:"M",name:"Medium",width:500},large:{label:"L",name:"Large",width:360},xlarge:{label:"XL",name:"Extra large",width:260}};function $a(n3,e){const t=(He[e]||He.medium).width;return n3>0?n3/t:1}h($a,"unitsPerPxForSize");function Ca(n3,e){var t,i;for(const o of Array.isArray(n3)?n3:[]){const r=(o==null?void 0:o.type)==="control"?o.card:null;if(!r||r.type!=="custom:lcards-button"||!["text-only","panel-dark","panel-light"].includes(r.preset))continue;const s=Number((i=(t=r.text)==null?void 0:t.label)==null?void 0:i.font_size);if(!(s>0)||!(e>0))continue;const a=e*Ne.classic.px.font/s;let l="medium";for(const[d,c]of Object.entries(He))Math.abs(Math.log(a/c.width))<Math.abs(Math.log(a/He[l].width))&&(l=d);return l}return null}h(Ca,"guessQuickLabelSize");function Ei(n3,e,t=new Set){const i=new Set([...(n3||[]).map(r=>r==null?void 0:r.id),...t]);let o=1;for(;i.has(`${e}_${o}`);)o++;return`${e}_${o}`}h(Ei,"nextOverlayId");function ka(n3){const e=Ne[n3.style]?n3.style:"classic",t=Ne[e].px,i=n3.bracketKind==="angled"?"angled":"level",o=n3.unitsPerPx>0?n3.unitsPerPx:1,r=n3.text||mo,s=Array.isArray(n3.target)?n3.target:n3.targetPoint||n3.labelPoint,[a,l]=n3.labelPoint,d=s[0]>=a?"right":"left",c=ee(t.font*o),u=ee(c*1.45),p=s[1]<l?"top":"bottom",g=e==="bracket"&&i==="level"?s[1]+(p==="top"?u/2:-u/2):l,_=fo(c,e==="bracket"),f=_o(r,c,e==="bracket"),b=n3.overlays||[],w=Ei(b,"lbl"),S=Ei(b,"ln",new Set([w])),C={content:r,show:true,position:d==="right"?"center-right":"center-left",font_size:c,color:St},D={type:"custom:lcards-button",preset:e==="tag"?"panel-dark":"text-only",min_height:0,text:{label:C}};e==="bracket"&&(D.style={border:{width:{[d]:ee(t.bar*o)},color:St}},C.padding={[d]:ee(_)});const M={id:w,type:"control",attachment:d==="right"?"right":"left",position:[ee(a),ee(g)],size:[f,u],card:D},k={id:S,type:"line",anchor:w,attach_to:Array.isArray(n3.target)?[ee(n3.target[0]),ee(n3.target[1])]:n3.target,anchor_side:d,route:"manhattan",style:{color:e==="bracket"?St:wa,width:ee(t.line*o)}};return Array.isArray(n3.target)||(k.attach_side=n3.targetSide||"center"),(e==="classic"||e==="picard")&&(k.anchor_gap=ee(t.gap*o)),(e==="picard"||e==="tag")&&(k.corner_radius=ee(t.radius*o)),e==="bracket"&&(k.anchor_side=`${p}-${d}`,k.route_hint="xy",k.corner_style="miter",i==="angled"&&(k.route="angled",k.stub_length=ee(t.stub*o))),{label:M,line:k,side:d}}h(ka,"buildQuickLabel");const Da=["text-only","panel-dark","panel-light"];function ke(n3){var e;return(n3==null?void 0:n3.type)==="control"&&((e=n3.card)==null?void 0:e.type)==="custom:lcards-button"&&Da.includes(n3.card.preset)}h(ke,"isLabelOverlay");const zi={"top-left":[0,0],top:[-.5,0],"top-center":[-.5,0],"top-right":[-1,0],left:[0,-.5],"center-left":[0,-.5],center:[-.5,-.5],right:[-1,-.5],"center-right":[-1,-.5],"bottom-left":[0,-1],bottom:[-.5,-1],"bottom-center":[-.5,-1],"bottom-right":[-1,-1]};function vo(n3){const e=n3==null?void 0:n3.position,t=n3==null?void 0:n3.size;if(!Array.isArray(e)||!Array.isArray(t))return null;const[i,o]=t.map(Number),[r,s]=zi[n3.attachment||"center"]||zi.center;return{x:Number(e[0])+r*i,y:Number(e[1])+s*o,w:i,h:o}}h(vo,"controlBox");function Fa(n3,e,t){let[i,o]=n3,r=null,s=null,a=t,l=t;for(const d of Array.isArray(e)?e:[]){if(!ke(d))continue;const c=vo(d);if(!c)continue;for(const g of[c.x,c.x+c.w]){const _=Math.abs(n3[0]-g);_<=a&&(a=_,i=g,r=g)}const u=c.y+c.h/2,p=Math.abs(n3[1]-u);p<=l&&(l=p,o=u,s=u)}return{point:[i,o],guideX:r,guideY:s}}h(Fa,"snapLabelPoint");function Ma(n3,e,t){let i=null,o=t;for(const r of e){const s=Math.hypot(n3[0]-r.point[0],n3[1]-r.point[1]);s<=o&&(o=s,i=r)}return i}h(Ma,"nearestSnapTarget");function Ri(n3){const e=vo(n3);if(!e)return[];const{x:t,y:i,w:o,h:r}=e;return[[null,t+o/2,i+r/2],["top",t+o/2,i],["bottom",t+o/2,i+r],["left",t,i+r/2],["right",t+o,i+r/2],["top-left",t,i],["top-right",t+o,i],["bottom-left",t,i+r],["bottom-right",t+o,i+r]].map(([a,l,d])=>({id:n3.id,side:a,point:[l,d]}))}h(Ri,"controlConnectionPoints");function Aa(n3){return!/^(g|path|rect|circle|ellipse|polygon|polyline|line|text|tspan|use|image|layer|svg|defs|group|shape)[-_]?\d[\w-]*$/i.test(String(n3))}h(Aa,"isNamedAnchor");const Bt=["style","anchor_gap","attach_gap","route","route_hint","route_hint_last","clearance","corner_style","corner_radius","corner_radius_mode","corner_room_weight","corner_angle","stub_length","smoothing_mode","smoothing_iterations"],bo=["preset","style","min_height"],Ve=h(n3=>n3===void 0?void 0:JSON.parse(JSON.stringify(n3)),"clone");function Ut(n3,e=""){if(Array.isArray(n3))return n3.map(t=>Ut(t));if(n3&&typeof n3=="object"){const t={};for(const[i,o]of Object.entries(n3))t[Ti(i)]=Ut(o,i);return t}return typeof n3=="string"&&/(^|_)(position|align|text_align|anchor_side)$/.test(e)?Ti(n3):n3}h(Ut,"mirror");function Ti(n3){return n3.replace(/left|right/g,e=>e==="left"?"right":"left")}h(Ti,"swapLR");function yo(n3,e){return(e||[]).filter(t=>(t==null?void 0:t.type)==="line"&&t.anchor===n3)}h(yo,"leaderLinesOf");function qt(n3,e){var o,r,s,a;const t=typeof(e==null?void 0:e.anchor_side)=="string"?(o=e.anchor_side.match(/left|right/))==null?void 0:o[0]:null;if(t)return t;if((n3==null?void 0:n3.attachment)==="left"||(n3==null?void 0:n3.attachment)==="right")return n3.attachment;const i=(a=(s=(r=n3==null?void 0:n3.card)==null?void 0:r.text)==null?void 0:s.label)==null?void 0:a.position;return typeof i=="string"&&i.includes("left")?"left":"right"}h(qt,"labelSide");function Pa(n3,e){if(ke(n3)){const t=yo(n3.id,e)[0]||null,i=n3.card,o={};for(const s of bo)i[s]!==void 0&&(o[s]=Ve(i[s]));const r={};for(const[s,a]of Object.entries(i.text||{})){if(!a||typeof a!="object")continue;const{content:l,...d}=a;r[s]=Ve(d)}return o.text=r,o.height=Array.isArray(n3.size)?n3.size[1]:void 0,{kind:"label",sourceId:n3.id,side:qt(n3,t),label:o,line:t?Bi(t):null}}return(n3==null?void 0:n3.type)==="line"?{kind:"line",sourceId:n3.id,side:null,label:null,line:Bi(n3)}:null}h(Pa,"copyStyle");function Bi(n3){var i;const e={};for(const o of Bt)n3[o]!==void 0&&(e[o]=Ve(n3[o]));const t=typeof n3.anchor_side=="string"?(i=n3.anchor_side.match(/^(top|bottom)-/))==null?void 0:i[1]:null;return e._end=t||null,e}h(Bi,"lineStyleOf");function Ui(n3,e,t=null){const i={...n3};for(const o of Bt)delete i[o];for(const o of Bt)e[o]!==void 0&&(i[o]=Ve(e[o]));if(t){const o=e._end?t.partAbove===null?e._end:t.partAbove?"top":"bottom":null;i.anchor_side=o?`${o}-${t.side}`:t.side}return i}h(Ui,"applyLineStyle");function La(n3,e,t,i){var u,p,g,_,f,b,w,S,C,D,M;const r=t&&t!==i?Ut(e):Ve(e),s={...n3.card};for(const k of bo)r[k]!==void 0?s[k]=r[k]:delete s[k];const a={...((u=n3.card)==null?void 0:u.text)||{}};for(const[k,F]of Object.entries(r.text||{})){const L=(_=(g=(p=n3.card)==null?void 0:p.text)==null?void 0:g[k])==null?void 0:_.content;a[k]=L!==void 0?{...F,content:L}:F}s.text=a;const l={...n3,card:s},d=Number((f=a.label)==null?void 0:f.font_size),c=Number((S=(w=(b=n3.card)==null?void 0:b.text)==null?void 0:w.label)==null?void 0:S.font_size);if(Array.isArray(n3.size)&&(r.height||d>0&&d!==c)){const k=(D=(C=s.style)==null?void 0:C.border)==null?void 0:D.width,F=!!(k&&typeof k=="object"&&(k.left||k.right)),L=d>0&&d!==c?_o(String(((M=a.label)==null?void 0:M.content)??""),d,F):n3.size[0];l.size=[L,r.height||n3.size[1]]}return l}h(La,"applyLabelStyle");function qi(n3,e,t,i=()=>null){const o=[...n3||[]],r=new Map(o.map((a,l)=>[a==null?void 0:a.id,l])),s=new Set(e);for(const a of s){const l=r.get(a);if(l===void 0)continue;const d=o[l];if(ke(d)){const c=yo(d.id,o),u=qt(d,c[0]);if(t.kind==="label"&&t.label&&(o[l]=La(d,t.label,t.side,u)),t.line)for(const p of c){if(s.has(p.id))continue;const g=r.get(p.id);o[g]=Ui(o[g],t.line,{side:u,partAbove:Ii(o[l],p,i)})}}else if((d==null?void 0:d.type)==="line"&&t.line){const c=o[r.get(d.anchor)??-1],u=ke(c)?{side:qt(c,d),partAbove:Ii(c,d,i)}:null;o[l]=Ui(d,t.line,u)}}return o}h(qi,"pasteStyle");function Ii(n3,e,t){const i=Array.isArray(e.attach_to)?e.attach_to:t(e.attach_to),o=Array.isArray(n3.position)?Number(n3.position[1]):null;return!i||o===null?null:Number(i[1])<=o}h(Ii,"partAbove");const Ea=400,R={VIEW:"view",PLACE_ANCHOR:"place_anchor",PLACE_CONTROL:"place_control",CONNECT_LINE:"connect_line",DRAW_CHANNEL:"draw_channel",ADD_WAYPOINT:"add_waypoint",DRAW_SHAPE:"draw_shape",QUICK_LABEL:"quick_label"},Ee=60,Z={BASE_SVG:"base_svg",ANCHORS:"anchors",CONTROLS:"controls",LINES:"lines",SHAPES:"shapes",ROUTING:"routing",YAML:"yaml"},za=new Set(["type","id","kind","points","closed","position","size","z_index","locked","obstacle","entity","state_attribute","ranges_attribute","animations","corner_style","corner_radius","corner_angle","smoothing_mode","smoothing_iterations","style","_editorSelected"]),Ra=new Set(["color","width","opacity","dash_array","fill","fill_opacity","line_cap","line_join","miter_limit","marker_end","marker_start"]),Ta=new Set(["type","id","anchor","attach_to","route","z_index","entity","state_attribute","ranges_attribute","anchor_side","attach_side","anchor_gap","attach_gap","clearance","stub_length","route_hint","route_hint_last","waypoints","route_channels","animations","corner_style","corner_radius","corner_radius_mode","corner_room_weight","corner_angle","smoothing_mode","smoothing_iterations","style","_editorSelected"]),Ba=new Set(["color","width","opacity","dash_array","marker_end","marker_start"]);function Oi(n3,e,t,i){if(!n3)return e;const o={};for(const[s,a]of Object.entries(n3))t.has(s)||(o[s]=a);Object.assign(o,e);const r=n3.style&&typeof n3.style=="object"?n3.style:null;if(r){const s=Object.fromEntries(Object.entries(r).filter(([a])=>!i.has(a)));Object.keys(s).length&&(o.style={...s,...e.style||{}})}return o}h(Oi,"mergeFormOverlay");const ei=class ei2 extends Nt{static get properties(){return{hass:{type:Object},lovelace:{type:Object},_initialConfig:{type:Object},_workingConfig:{type:Object,state:true},_activeTab:{type:String,state:true},_activeMode:{type:String,state:true},_validationErrors:{type:Array,state:true},_debugSettings:{type:Object,state:true},_viewBoxMode:{type:String,state:true},_svgSourceMode:{type:String,state:true},_extractedViewBox:{type:Array,state:true},_customFiltersEnabled:{type:Boolean,state:true},_showAnchorForm:{type:Boolean,state:true},_editingAnchorName:{type:String,state:true},_anchorFormName:{type:String,state:true},_anchorFormPosition:{type:Array,state:true},_anchorFormUnit:{type:String,state:true},_showGrid:{type:Boolean,state:true},_showGridSettings:{type:Boolean,state:true},_gridSpacing:{type:Number,state:true},_snapToGrid:{type:Boolean,state:true},_cursorPosition:{type:Object,state:true},_highlightedAnchor:{type:String,state:true},_highlightedControl:{type:String,state:true},_highlightedLine:{type:String,state:true},_highlightedChannel:{type:String,state:true},_canvasToolbarExpanded:{type:Boolean,state:true},_showCrosshairs:{type:Boolean,state:true},_enableSnapping:{type:Boolean,state:true},_showAnchorMarkers:{type:Boolean,state:true},_showBoundingBoxes:{type:Boolean,state:true},_showRoutingPaths:{type:Boolean,state:true},_showRoutingChannels:{type:Boolean,state:true},_showAttachmentPoints:{type:Boolean,state:true},_showRoutingGrid:{type:Boolean,state:true},_showTrunks:{type:Boolean,state:true},_baseSvgPreviewDimmed:{type:Boolean,state:true},_liveInteractionEnabled:{type:Boolean,state:true},_altKeyHeld:{type:Boolean,state:true},_editModeAutoShown:{type:Object,state:true},_showControlForm:{type:Boolean,state:true},_editingControlId:{type:String,state:true},_controlFormId:{type:String,state:true},_controlFormPosition:{type:Array,state:true},_controlFormSize:{type:Array,state:true},_controlFormAttachment:{type:String,state:true},_controlFormPositionSide:{type:String,state:true},_controlFormObstacle:{type:Boolean,state:true},_controlFormZIndex:{type:Number,state:true},_controlFormLocked:{type:Boolean,state:true},_controlFormCard:{type:Object,state:true},_controlFormAnimations:{type:Array,state:true},_controlFormActiveSubtab:{type:String,state:true},_showCardEditorForm:{type:Boolean,state:true},_cardEditorTempConfig:{type:Object,state:true},_showLineForm:{type:Boolean,state:true},_editingLineId:{type:String,state:true},_lineFormData:{type:Object,state:true},_lineFormActiveSubtab:{type:String,state:true},_connectLineState:{type:Object,state:true},_quickLabelState:{type:Object,state:true},_quickLabelPanelPos:{type:Object,state:true},_styleClipboard:{type:Object,state:true},_historyVersion:{type:Number,state:true},_selectedLineIds:{type:Object,state:true},_showShapeForm:{type:Boolean,state:true},_editingShapeId:{type:String,state:true},_shapeFormData:{type:Object,state:true},_shapeFormActiveSubtab:{type:String,state:true},_drawShapeState:{type:Object,state:true},_selectedShapeId:{type:String,state:true},_shapeDragState:{type:Object,state:true},_shapeResizeState:{type:Object,state:true},_shapeVertexDragState:{type:Object,state:true},_selectedShapeIds:{type:Object,state:true},_bulkEditKind:{type:String,state:true},_bulkEditTargetIds:{type:Array,state:true},_bulkEditSnapshot:{type:Object,state:true},_shieldBubbleState:{type:Object,state:true},_editingChannelId:{type:String,state:true},_channelFormData:{type:Object,state:true},_dragState:{type:Object,state:true},_draggedWaypointIndex:{type:Number,state:true},_resizeState:{type:Object,state:true},_anchorDragState:{type:Object,state:true},_channelResizeState:{type:Object,state:true},_lineEndpointDragState:{type:Object,state:true},_selectedLineId:{type:String,state:true},_waypointEditingLineId:{type:String,state:true},_waypointDragState:{type:Object,state:true},_cornerRadiusDragState:{type:Object,state:true},_showWaypointMarkers:{type:Boolean,state:true},_clickTimeout:{type:Number,state:true},_previewZoom:{type:Number,state:true},_currentZoom:{type:Number,state:true},_zoomBehavior:{type:Object,state:true},_zoomSvg:{type:Object,state:true},_haComponentsAvailable:{type:Boolean,state:true}}}constructor(){super(),m.debug("[MSDStudio] Constructor called"),this.hass=null,this._initialConfig=null,this._workingConfig={},this._activeTab=Z.BASE_SVG,this._activeMode=R.VIEW,this._validationErrors=[],this._cardPickerRequestId=0,this._pendingCardPickerRequests=new Map,this._baseSvgPerformanceExpanded=null,this._debugSettings={anchors:true,bounding_boxes:true,attachment_points:false,routing_channels:false,line_paths:true,show_coordinates:false,grid_color:"#cccccc",grid_opacity:.3,debug_scale:1,auto_refresh:true,interactive_preview:false,anchor_color:"#00FFFF",bbox_color:"#FFA500",attachment_color:"#00FF00",bundling_color:"#00FF00",avoiding_color:"#FF0000",waypoint_color:"#0000FF"},this._previewUpdateTimer=null,this._previewReadyRafHandle=null,this._viewBoxMode="auto",this._extractedViewBox=null,this._svgSourceMode="asset",this._customFiltersEnabled=false,this._showAnchorForm=false,this._editingAnchorName=null,this._anchorFormName="",this._anchorFormPosition=[0,0],this._anchorFormUnit="vb",this._showGrid=true,this._showGridSettings=false,this._gridSpacing=50,this._snapToGrid=false,this._showCrosshairs=true,this._cursorPosition=null,this._highlightedAnchor=null,this._showAnchorMarkers=false,this._anchorFilterQuery="",this._showBoundingBoxes=false,this._showRoutingPaths=false,this._showRoutingChannels=false,this._showRoutingGrid=false,this._showTrunks=false,this._baseSvgPreviewDimmed=false,this._liveInteractionEnabled=true,this._altKeyHeld=false,this._editModeAutoShown=null,this._previewZoom=1,this._currentZoom={x:0,y:0,k:1},this._zoomBehavior=null,this._zoomContainer=null,this._zoomWrapper=null,this._zoomBaseWidth=0,this._zoomBaseHeight=0,this._fitPending=false,this._panJustEnded=false,this._zoomGestureStartTransform=null,this._showControlForm=false,this._editingControlId=null,this._placeControlDrawState={startPoint:null,currentPoint:null,drawing:false},this._controlDrawDragCandidate=null,this._controlFormId="",this._controlFormPosition=[0,0],this._controlFormSize=[100,100],this._controlFormAttachment="center",this._controlFormPositionSide="center",this._controlFormObstacle=true,this._controlFormZIndex=null,this._controlFormLocked=false,this._controlFormTriggersUpdateMode="specific",this._controlFormTriggersUpdateEntities=[],this._controlFormTriggersUpdateExpanded=false,this._controlFormCard={type:""},this._controlFormActiveSubtab="placement",this._showCardEditorForm=false,this._cardEditorTempConfig=null,this._showLineForm=false,this._editingLineId=null,this._waypointEditingLineId=null,this._waypointDragState=null,this._cornerRadiusDragState=null,this._showWaypointMarkers=true,this._lineFormData={id:"",anchor:"",attach_to:"",anchor_side:"center",attach_side:"center",route:"auto",style:{color:"var(--lcars-orange)",width:2,dash_array:"",marker_end:null}},this._lineFormActiveSubtab="basic",this._connectLineState={source:null,tempLineElement:null},this._quickLabelState={style:null,bracketKind:"level",text:mo,size:null,target:null,targetSide:null,targetPoint:null,currentPoint:null,snap:null},this._styleClipboard=null,this._quickLabelPanelPos=null,this._history=To(),this._historyVersion=0,this._historyBase=null,this._historyTimer=null,this._selectedLineIds=new Set,this._bulkEditKind=null,this._bulkEditTargetIds=null,this._bulkEditSnapshot=null,this._showShapeForm=false,this._editingShapeId=null,this._shapeFormData={id:"",kind:"rect",position:[0,0],size:[100,60],points:[],closed:false,entity:"",state_attribute:"",ranges_attribute:"",z_index:null,locked:false,corner_style:"round",corner_radius:8,corner_angle:45,smoothing_mode:"none",smoothing_iterations:1,animations:[],style:{color:{default:"var(--lcars-orange)"},width:2,opacity:1,dash_array:"",fill:{default:"none"},fill_opacity:1,line_cap:"butt",line_join:"",miter_limit:4}},this._shapeFormActiveSubtab="geometry",this._drawShapeState={kind:null,points:[],drawing:false,currentPoint:null},this._shapeDrawDragCandidate=null,this._shieldBubbleState=this._defaultShieldBubbleState(),this._selectedShapeId=null,this._selectedShapeIds=new Set,this._shapeDragState={active:false,shapeId:null,startPos:null,originalPos:null,offsetX:0,offsetY:0},this._shapeResizeState={active:false,shapeId:null,handle:null,startPos:null,startSize:null,startPosition:null},this._shapeVertexDragState=null,this._editingChannelId=null,this._channelFormData={id:"",mode:"prefer",direction:"auto",bounds:[0,0,100,50],weight:.5,line_spacing:8,discoverable:true},this._drawChannelState={startPoint:null,currentPoint:null,drawing:false,tempRectElement:null},this._channelDrawDragCandidate=null,this._dragState={active:false,controlId:null,startPos:null,originalPos:null,offsetX:0,offsetY:0},this._resizeState={active:false,controlId:null,handle:null,startPos:null,startSize:null,startPosition:null},this._anchorDragState={active:false,anchorName:null,startPos:null,originalPos:null},this._channelResizeState={active:false,channelId:null,handle:null,startPos:null,startBounds:null},this._channelDragState={active:false,channelId:null,startPos:null,startBounds:null},this._lineEndpointDragState={active:false,lineId:null,endpoint:null,startPos:null,originalTarget:null},this._haComponentsAvailable=false,this._cardConfigMode="graphical",this._cardPickerManager=null,this._eventInterceptor=null,this._activeChildEditors=new Set,m.debug("[MSDStudio] Initialized")}get config(){return this._workingConfig}set config(e){this._initialConfig=e,(!this._workingConfig||Object.keys(this._workingConfig).length===0)&&(this._workingConfig=JSON.parse(JSON.stringify(e||{})))}connectedCallback(){super.connectedCallback(),this._workingConfig=JSON.parse(JSON.stringify(this._initialConfig||{})),this._workingConfig.type||(this._workingConfig.type="custom:lcards-msd"),this._workingConfig.msd||(this._workingConfig.msd={}),this._history.clear(),this._historyBase=JSON.stringify(this._workingConfig),this._historyVersion++,this._cardPickerManager=new Rt(this),this._eventInterceptor=new Tt(this),this._eventInterceptor.setupEventInterception(),setTimeout(async()=>{const e=this._cardPickerManager;if(e){try{await e.ensureComponentsLoaded()}catch{m.debug("[MSDStudio] Warning: Could not load card picker components")}e.isLoaded()?(m.debug("[MSDStudio] ✅ Card picker loaded successfully"),this.requestUpdate()):m.debug("[MSDStudio] ⚠️ Card picker not available, using manual config")}},50),this._boundKeyDownHandler=this._handleKeyDown.bind(this),window.addEventListener("keydown",this._boundKeyDownHandler,true),this._boundMouseUpHandler=this._handleDragEnd.bind(this),document.addEventListener("mouseup",this._boundMouseUpHandler),this._boundCardPickerResultHandler=this._handleCardPickerResult.bind(this),document.addEventListener("card-picker-result",this._boundCardPickerResultHandler),m.debug("[MSDStudio] Listening for card-picker-result events from editor"),this._detectSvgSourceMode(),this._detectViewBoxMode(),this._autoExtractViewBox(),this._haComponentsAvailable=!!customElements.get("hui-card-element-editor"),m.debug("[MSDStudio] Component availability:",{editor:!!customElements.get("hui-card-element-editor"),picker:!!customElements.get("hui-card-picker")}),m.debug("[MSDStudio] Opened with config:",this._workingConfig),this.updateComplete.then(()=>this._schedulePreviewUpdate())}disconnectedCallback(){var t,i,o;super.disconnectedCallback(),this._previewUpdateTimer&&clearTimeout(this._previewUpdateTimer??void 0),this._previewReadyRafHandle&&(cancelAnimationFrame(this._previewReadyRafHandle),this._previewReadyRafHandle=null),(t=this._eventInterceptor)==null||t.cleanupEventInterception(),(i=this._cardPickerManager)==null||i.cleanup(),this._boundKeyDownHandler&&window.removeEventListener("keydown",this._boundKeyDownHandler,true),this._boundMouseUpHandler&&document.removeEventListener("mouseup",this._boundMouseUpHandler),this._boundCardPickerResultHandler&&document.removeEventListener("card-picker-result",this._boundCardPickerResultHandler);const e=[["_boundDragMouseMove","mousemove"],["_boundDragMouseUp","mouseup"],["_boundResizeMouseMove","mousemove"],["_boundResizeMouseUp","mouseup"],["_boundAnchorDragMouseMove","mousemove"],["_boundAnchorDragMouseUp","mouseup"],["_boundChannelDragMouseMove","mousemove"],["_boundChannelDragMouseUp","mouseup"],["_boundChannelResizeMouseMove","mousemove"],["_boundChannelResizeMouseUp","mouseup"],["_boundShapeDragMouseMove","mousemove"],["_boundShapeDragMouseUp","mouseup"],["_boundShapeResizeMouseMove","mousemove"],["_boundShapeResizeMouseUp","mouseup"],["_boundShapeVertexMouseMove","mousemove"],["_boundShapeVertexMouseUp","mouseup"],["_boundWaypointMouseMove","mousemove"],["_boundWaypointMouseUp","mouseup"],["_boundCornerRadiusMouseMove","mousemove"],["_boundCornerRadiusMouseUp","mouseup"]];for(const[r,s]of e)this[r]&&(document.removeEventListener(s,this[r]),this[r]=null);(o=this._baseSvgDimObserver)==null||o.disconnect(),this._baseSvgDimObserver=null}async firstUpdated(e){super.firstUpdated(e),m.debug("[MSDStudio] firstUpdated called"),await this.updateComplete,m.debug("[MSDStudio] updateComplete, scheduling zoom init"),requestAnimationFrame(()=>{m.debug("[MSDStudio] requestAnimationFrame fired, calling _initializeZoom"),this._initializeZoom()})}updated(e){super.updated(e),this._scheduleHistoryCheck(),e.has("_workingConfig")&&requestAnimationFrame(()=>{this._reinitializeZoomIfNeeded(),this._applyBaseSvgPreviewDimming()})}_applyBaseSvgPreviewDimming(e=10){var s,a,l;const t=(s=this.shadowRoot)==null?void 0:s.querySelector("lcards-msd-live-preview"),i=(a=t==null?void 0:t.shadowRoot)==null?void 0:a.querySelector(".preview-card-container"),o=i==null?void 0:i.querySelector("lcards-msd-card"),r=(l=(o==null?void 0:o.shadowRoot)||(o==null?void 0:o.renderRoot))==null?void 0:l.querySelector("#__msd-base-content");r?r.style.opacity=this._baseSvgPreviewDimmed?"0.15":"":e>0&&setTimeout(()=>this._applyBaseSvgPreviewDimming(e-1),200),i&&!this._baseSvgDimObserver&&(this._baseSvgDimObserver=new MutationObserver(()=>{requestAnimationFrame(()=>this._applyBaseSvgPreviewDimming())}),this._baseSvgDimObserver.observe(i,{childList:true}))}_reinitializeZoomIfNeeded(){const e=this._getCurrentZoomContainer();if(e&&(!this._zoomContainer||e!==this._zoomContainer)){m.debug("[MSDStudio] Zoom container changed, re-initializing zoom");const t=this._getZoomTransform();this._initializeZoom(),t&&t.k!==1&&this._zoomBehavior&&this._zoomContainer&&te(this._zoomContainer).call(this._zoomBehavior.transform,Te.translate(t.x,t.y).scale(t.k))}}_getCurrentZoomContainer(){var t;const e=(t=this.shadowRoot)==null?void 0:t.querySelector(".preview-panel");return e?e.querySelector(".preview-scroll-container"):null}_initializeZoom(){var s;m.debug("[MSDStudio][ZOOM] _initializeZoom called");const e=(s=this.shadowRoot)==null?void 0:s.querySelector(".preview-panel");if(!e){m.warn("[MSDStudio] Preview panel not found for zoom initialization");return}m.debug("[MSDStudio][ZOOM] Found preview panel");const t=e.querySelector(".preview-scroll-container");if(!t){m.warn("[MSDStudio] Preview scroll container not found for zoom initialization");return}m.debug("[MSDStudio][ZOOM] Found scroll container");const i=t.querySelector(".msd-zoom-wrapper");if(!i){m.warn("[MSDStudio] Zoomable wrapper not found for zoom initialization");return}m.debug("[MSDStudio][ZOOM] Found zoomable wrapper");const{width:o,height:r}=this._previewNaturalSize;this._zoomBaseWidth=o,this._zoomBaseHeight=r,this._zoomBehavior=ga().scaleExtent([.25,10]).filter(a=>{var d;return["place_anchor","place_control","draw_channel","connect_line","quick_label"].includes(this._activeMode)?false:a.type==="wheel"||a.type==="touchstart"&&((d=a.touches)==null?void 0:d.length)===2?true:a.type==="mousedown"?!!(a.button===1||a.button===0&&a.shiftKey||a.button===0&&this._activeMode===R.VIEW):false}).on("zoom",a=>{const l=a.transform;i.style.transform=`translate(${l.x}px, ${l.y}px) scale(${l.k})`,i.style.transformOrigin="top left",this._currentZoom={x:l.x,y:l.y,k:l.k},this.requestUpdate(),m.trace("[MSDStudio][ZOOM] Transform applied:",{x:l.x,y:l.y,k:l.k})}).on("start",a=>{this._zoomContainer&&this._zoomContainer.classList.add("panning"),this._zoomGestureStartTransform=a.transform}).on("end",a=>{this._zoomContainer&&this._zoomContainer.classList.remove("panning");const l=this._zoomGestureStartTransform,d=a.transform,c=!l||l.x!==d.x||l.y!==d.y||l.k!==d.k;this._zoomGestureStartTransform=null,c&&(this._panJustEnded=true,setTimeout(()=>{this._panJustEnded=false},0)),this.requestUpdate(),m.trace("[MSDStudio] Zoom/pan ended, refreshing overlays")}),te(t).call(this._zoomBehavior),this._zoomContainer=t,this._zoomWrapper=i,m.debug("[MSDStudio][ZOOM] Zoom initialization complete with scroll sync"),m.debug("[MSDStudio] 🔍 Zoom behavior initialized on preview container"),this._fitPending||(this._fitPending=true,setTimeout(()=>{this._fitPending=false,this._fitToViewport()},400))}get _previewNaturalSize(){var i,o;const e=((o=(i=this._workingConfig)==null?void 0:i.msd)==null?void 0:o.view_box)||this._extractedViewBox;if(Array.isArray(e)&&e.length>=4&&e[2]>0&&e[3]>0)return{width:e[2],height:e[3]};const t=this._getPreviewSvgAndViewBox();return t?{width:t.viewBoxWidth,height:t.viewBoxHeight}:{width:1920,height:1080}}_fitToViewport(){if(!this._zoomBehavior||!this._zoomContainer)return;const e=this._zoomContainer.getBoundingClientRect(),t=parseFloat(getComputedStyle(this._zoomContainer).paddingTop)||0,i=e.width,o=e.height-t;if(!i||!o)return;const{width:r,height:s}=this._previewNaturalSize;this._zoomBaseWidth=r,this._zoomBaseHeight=s;const a=Math.min(1,(i-32)/r,(o-32)/s),l=(i-r*a)/2,d=Math.max(16,(o-s*a)/2);te(this._zoomContainer).call(this._zoomBehavior.transform,Te.translate(l,d).scale(a)),this.requestUpdate(),m.debug("[MSDStudio][ZOOM] Fit to viewport applied:",{k:a,tx:l,ty:d,natW:r,natH:s,availW:i,availH:o})}_zoomReset(){this._reinitializeZoomIfNeeded(),!(!this._zoomBehavior||!this._zoomContainer)&&(te(this._zoomContainer).transition().duration(500).call(this._zoomBehavior.transform,Te),setTimeout(()=>this.requestUpdate(),550))}_getZoomTransform(){return this._zoomContainer?te(this._zoomContainer).property("__zoom")||{x:0,y:0,k:1}:{x:0,y:0,k:1}}static get styles(){return[Po,Do,Lo,ba,ya,Eo,zo]}async _setMode(e){var t,i,o,r;if(m.debug(`[MSDStudio] _setMode ENTRY: ${this._activeMode} → ${e}`),this._activeMode===e?(m.debug(`[MSDStudio] _setMode: Toggling off mode ${e}`),this._activeMode=R.VIEW):(m.debug(`[MSDStudio] _setMode: Activating mode ${e}`),this._activeMode=e),this._activeMode!==R.DRAW_CHANNEL&&(this._drawChannelState={startPoint:null,currentPoint:null,drawing:false,tempRectElement:null},this._channelDrawDragCandidate=null),this._activeMode!==R.CONNECT_LINE&&(this._connectLineState={source:null,tempLineElement:null}),this._quickLabelState={...this._quickLabelState,target:null,targetPoint:null,currentPoint:null},this._activeMode===R.QUICK_LABEL&&!this._quickLabelState.style){const s=Li((t=this._workingConfig.msd)==null?void 0:t.overlays);this._quickLabelState={...this._quickLabelState,style:(s==null?void 0:s.style)||"classic",bracketKind:(s==null?void 0:s.bracketKind)||"level"}}if(this._activeMode===R.QUICK_LABEL&&!this._quickLabelState.size){const s=((i=this._getPreviewSvgAndViewBox())==null?void 0:i.viewBoxWidth)||0;this._quickLabelState={...this._quickLabelState,size:Ca((o=this._workingConfig.msd)==null?void 0:o.overlays,s)||"medium"}}if(this._activeMode!==R.PLACE_CONTROL&&(this._placeControlDrawState={startPoint:null,currentPoint:null,drawing:false},this._controlDrawDragCandidate=null),this._activeMode!==R.DRAW_SHAPE&&(this._drawShapeState={kind:null,points:[],drawing:false,currentPoint:null},this._shapeDrawDragCandidate=null),this._activeMode!==R.ADD_WAYPOINT&&this._showWaypointMarkers){if(m.debug("[MSDStudio] _setMode: Clearing waypoint markers"),this._showWaypointMarkers=false,this._selectedLineId&&((r=this._workingConfig.msd)!=null&&r.overlays)){const s=this._workingConfig.msd.overlays.find(a=>a.id===this._selectedLineId);s&&delete s._editorSelected}this._selectedLineId=null}m.debug("[MSDStudio] Mode changed:",this._activeMode,"- requesting update"),this.requestUpdate(),m.debug("[MSDStudio] _setMode: Awaiting updateComplete..."),await this.updateComplete,m.debug(`[MSDStudio] _setMode EXIT: Mode ${this._activeMode} is now active, DOM updated`)}_setActiveTab(e){this._activeTab=e,m.debug("[MSDStudio] Tab changed:",this._activeTab),this.requestUpdate()}_handleMainTabChange(e){var i;e.stopPropagation();const t=(i=e.target.activeTab)==null?void 0:i.getAttribute("value");t&&this._setActiveTab(t)}_scheduleHistoryCheck(){this._historyTimer||(this._historyTimer=setTimeout(()=>{this._historyTimer=null,this._recordHistory()},Ea))}_recordHistory({step:e=false}={}){this._historyTimer&&(clearTimeout(this._historyTimer),this._historyTimer=null);const t=JSON.stringify(this._workingConfig??{});if(this._historyBase===null){this._historyBase=t;return}t!==this._historyBase&&(this._history.push(JSON.parse(this._historyBase),JSON.parse(t),{step:e}),this._historyBase=t,this._historyVersion++)}_historyBlocked(){return!!(this._showCardEditorForm||this._showLineForm||this._showShapeForm||this._showControlForm||this._showAnchorForm||this._editingChannelId!==null||this._bulkEditKind)}_undo(){if(this._historyBlocked())return;this._recordHistory();const e=this._history.undo(JSON.parse(this._historyBase??"{}"));e&&this._showHistoryConfig(e)}_redo(){if(this._historyBlocked())return;this._recordHistory();const e=this._history.redo(JSON.parse(this._historyBase??"{}"));e&&this._showHistoryConfig(e)}_showHistoryConfig(e){var i;this._workingConfig=e,this._historyBase=JSON.stringify(e),this._historyVersion++,this._activeMode!==R.VIEW&&this._setMode(R.VIEW);const t=new Set((((i=e.msd)==null?void 0:i.overlays)||[]).map(o=>o==null?void 0:o.id));this._selectedLineIds=new Set([...this._selectedLineIds].filter(o=>t.has(o))),this._selectedShapeId&&!t.has(this._selectedShapeId)&&(this._selectedShapeId=null),this._schedulePreviewUpdate(),this.requestUpdate()}_setNestedValue(e,t){const i=e.split(".");let o=this._workingConfig;for(let s=0;s<i.length-1;s++){const a=i[s];if(a==="__proto__"||a==="constructor"||a==="prototype")return;o[a]||(o[a]={}),o=o[a]}const r=i[i.length-1];r==="__proto__"||r==="constructor"||r==="prototype"||(o[r]=t,m.debug("[MSDStudio] Config updated:",{path:e,value:t}),this._schedulePreviewUpdate(),this.requestUpdate())}_schedulePreviewUpdate(){this._previewUpdateTimer&&clearTimeout(this._previewUpdateTimer??void 0),this._previewUpdateTimer=setTimeout(()=>{var e,t;this._previewUpdateTimer=null,this.requestUpdate(),(t=(e=this.shadowRoot)==null?void 0:e.querySelector("lcards-msd-live-preview"))==null||t._forceRefresh()},300)}_markDirty(){this._schedulePreviewUpdate()}_zoom(e){if(this._reinitializeZoomIfNeeded(),!this._zoomBehavior||!this._zoomContainer){this._previewZoom=Math.max(.25,Math.min(10,this._previewZoom*e)),this.requestUpdate();return}te(this._zoomContainer).transition().duration(200).call(this._zoomBehavior.scaleBy,e),setTimeout(()=>this.requestUpdate(),250)}_resetZoom(){this._zoomReset()}_detectSvgSourceMode(){var t,i;const e=((i=(t=this._workingConfig.msd)==null?void 0:t.base_svg)==null?void 0:i.source)||"";e==="none"||e===""?this._svgSourceMode="none":e.startsWith("builtin:")||!e.includes("/")&&!e.includes("http")?this._svgSourceMode="asset":e.startsWith("media-source://")?this._svgSourceMode="media":this._svgSourceMode="custom"}_detectViewBoxMode(){var t;const e=(t=this._workingConfig.msd)==null?void 0:t.view_box;this._viewBoxMode=Array.isArray(e)&&e.length===4?"custom":"auto"}_handleSave(){var e;if(this._validationErrors=this._validateConfiguration(),this._validationErrors.length>0){this.requestUpdate(),this._showValidationErrors();return}for(const t of((e=this._workingConfig.msd)==null?void 0:e.overlays)||[])delete t._editorSelected;m.debug("[MSDStudio] Saving config:",this._workingConfig),this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this._workingConfig},bubbles:true,composed:true})),this._showSuccessToast("Configuration saved successfully!"),this._handleClose()}_handleCancel(){if(this._configHasChanges()){this._confirmAction("Discard unsaved changes?").then(e=>{e&&(m.debug("[MSDStudio] Cancelled - changes discarded"),this._handleClose())});return}m.debug("[MSDStudio] Cancelled"),this._handleClose()}_configHasChanges(){const e=JSON.stringify(this._initialConfig),t=JSON.stringify(this._workingConfig);return e!==t}async _handleReset(){await this._confirmAction("Reset to the configuration the Studio opened with? Undo brings your changes back.")&&(m.debug("[MSDStudio] Resetting to initial config"),this._recordHistory(),this._workingConfig=JSON.parse(JSON.stringify(this._initialConfig)),this._recordHistory({step:true}),this._validationErrors=[],this._showSuccessToast("Configuration reset to initial state"),this._schedulePreviewUpdate(),this.requestUpdate())}_onDialogClosed(e){e.stopPropagation(),e.target===e.currentTarget&&this._handleClose()}_handleClose(){this.dispatchEvent(new CustomEvent("closed",{bubbles:true,composed:true}))}_toggleEditMode(){var e,t,i;this._liveInteractionEnabled=!this._liveInteractionEnabled,this._liveInteractionEnabled?((e=this._editModeAutoShown)!=null&&e.boundingBoxes&&(this._showBoundingBoxes=false),(t=this._editModeAutoShown)!=null&&t.anchorMarkers&&(this._showAnchorMarkers=false),(i=this._editModeAutoShown)!=null&&i.routingChannels&&(this._showRoutingChannels=false),this._editModeAutoShown=null):(this._editModeAutoShown={boundingBoxes:!this._showBoundingBoxes,anchorMarkers:!this._showAnchorMarkers,routingChannels:!this._showRoutingChannels},this._showBoundingBoxes=true,this._showAnchorMarkers=true,this._showRoutingChannels=true),this.requestUpdate()}_renderCanvasToolbar(){const e=[{mode:R.VIEW,icon:"mdi:cursor-default",tooltip:"View Mode"},{mode:R.PLACE_ANCHOR,icon:"mdi:map-marker-plus",tooltip:"Place Anchor"},{mode:R.PLACE_CONTROL,icon:"mdi:widgets",tooltip:"Place Control"},{mode:R.CONNECT_LINE,icon:"mdi:vector-line",tooltip:"Connect Line"},{mode:R.QUICK_LABEL,icon:"mdi:label-outline",tooltip:"Quick label (a label and its leader line)"},{mode:R.DRAW_CHANNEL,icon:"mdi:chart-timeline-variant",tooltip:"Draw Channel"},{mode:R.ADD_WAYPOINT,icon:"mdi:map-marker-path",tooltip:"Add Waypoint (Select line first)"}],t=[{key:"show_anchor_markers",prop:"_showAnchorMarkers",icon:"mdi:map-marker",tooltip:"Anchors"},{key:"show_bounding_boxes",prop:"_showBoundingBoxes",icon:"mdi:border-outside",tooltip:"Bounding Boxes"},{key:"show_routing_paths",prop:"_showRoutingPaths",icon:"mdi:vector-line",tooltip:"Routing Paths"},{key:"show_channels",prop:"_showRoutingChannels",icon:"mdi:chart-timeline-variant",tooltip:"Routing Channels"},{key:"show_attachment_points",prop:"_showAttachmentPoints",icon:"mdi:target-variant",tooltip:"Attachment Points"},{key:"show_routing_grid",prop:"_showRoutingGrid",icon:"mdi:grid-large",tooltip:"Routing Grid (router's own search resolution)"},{key:"show_trunks",prop:"_showTrunks",icon:"mdi:source-branch",tooltip:"Discovered Trunks (trunk-and-branch bundling)"}];return v`
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
                                    class="canvas-toolbar-button ${this._activeMode===R.DRAW_SHAPE&&this._drawShapeState.kind===i.kind?"active":""}"
                                    @click=${async o=>{o.stopPropagation(),this._activeMode===R.DRAW_SHAPE?(this._drawShapeState.kind===i.kind?(this._activeMode=R.VIEW,this._drawShapeState={kind:null,points:[],drawing:false,currentPoint:null}):this._drawShapeState={kind:i.kind,points:[],drawing:false,currentPoint:null},this._shapeDrawDragCandidate=null,this.requestUpdate()):(await this._setMode(R.DRAW_SHAPE),this._drawShapeState={kind:i.kind,points:[],drawing:false,currentPoint:null},this._shapeDrawDragCandidate=null,this.requestUpdate())}}
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
        `:""}_renderTabNav(){const e=[{id:Z.BASE_SVG,label:"Base SVG",icon:"mdi:image"},{id:Z.ANCHORS,label:"Anchors",icon:"mdi:map-marker"},{id:Z.CONTROLS,label:"Controls",icon:"mdi:widgets"},{id:Z.LINES,label:"Lines",icon:"mdi:vector-line"},{id:Z.SHAPES,label:"Shapes",icon:"mdi:shape"},{id:Z.ROUTING,label:"Routing",icon:"mdi:routes"},{id:Z.YAML,label:"YAML",icon:"mdi:code-braces"}];return v`
            <ha-tab-group @wa-tab-show=${this._handleMainTabChange}>
                ${e.map(t=>v`
                    <ha-tab-group-tab value="${t.id}" ?active=${this._activeTab===t.id}>
                        <ha-icon icon="${t.icon}"></ha-icon>
                        ${t.label}
                    </ha-tab-group-tab>
                `)}
            </ha-tab-group>
        `}_renderTabContent(){switch(this._activeTab){case Z.BASE_SVG:return this._renderBaseSvgTab();case Z.ANCHORS:return this._renderAnchorsTab();case Z.CONTROLS:return this._renderControlsTab();case Z.LINES:return this._renderLinesTab();case Z.SHAPES:return this._renderShapesTab();case Z.ROUTING:return this._renderRoutingTab();case Z.YAML:return this._renderYamlTab();default:return v`<div>Unknown tab</div>`}}_renderSvgSourceHelper(e=""){var a,l;let t=null,i=null,o=false;e.startsWith("builtin:")?i=e.replace("builtin:",""):e.startsWith("/local/")||e.startsWith("/hacsfiles/")||e.startsWith("/lcards/")||e.startsWith($o())||e.startsWith("http://")||e.startsWith("https://")?(i=e.trim(),o=true):e.startsWith("media-source://")?(i=e,o=true):e&&(i=e);const r=(l=(a=window.lcards)==null?void 0:a.core)==null?void 0:l.assetManager;if(r&&i&&(t=r.getMetadata("svg",i)),t&&Object.keys(t).length>2)return v`
                <div style="
                    margin-top: 12px;
                    padding: 16px;
                    background: linear-gradient(135deg, #4A5C7A 0%, #2C3E50 100%);
                    border-radius: 8px;
                    color: white;
                    box-shadow: var(--ha-box-shadow-m);
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
            `;if(o&&e){const d=e.split("/").pop(),c=e.substring(0,e.lastIndexOf("/"));return v`
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
                            <code style="background: var(--markdown-code-background-color, var(--primary-background-color)); padding: 2px 6px; border-radius: 3px; font-size: 11px;">${d}</code>
                        </div>
                        <div>
                            <span style="opacity: 0.7;">Path:</span>
                            <code style="background: var(--markdown-code-background-color, var(--primary-background-color)); padding: 2px 6px; border-radius: 3px; font-size: 11px;">${c}/</code>
                        </div>
                        <div>
                            <span style="opacity: 0.7;">Full URL:</span>
                            <code style="background: var(--markdown-code-background-color, var(--primary-background-color)); padding: 2px 6px; border-radius: 3px; font-size: 11px;">${e}</code>
                        </div>
                    </div>

                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--divider-color); font-size: 11px; opacity: 0.7;">
                        External SVGs don't have embedded metadata. The file will be loaded from the specified path when the card renders.
                    </div>
                </div>
            `}return v`
            <lcards-message type="info">
                A path Home Assistant serves, usually <code>/local/my-ship.svg</code> for a file in your
                <code>www</code> folder, or a full URL (<code>https://…/my-ship.svg</code>; the site must allow it).
            </lcards-message>
        `}_renderViewBoxHelper(){return v`
            <lcards-message type="info">
                The viewBox is the MSD's coordinate system. <strong>Auto</strong> takes it from the SVG (recommended);
                <strong>Custom</strong> sets [minX, minY, width, height].
            </lcards-message>
        `}_handleFiltersChanged(e){m.debug("[MSDStudio] Filters changed:",e.detail.value),this._setNestedValue("msd.base_svg.filters",e.detail.value)}async _handleViewBoxModeChange(e){var t;if(this._viewBoxMode=e,e==="auto")(t=this._workingConfig.msd)!=null&&t.view_box&&(delete this._workingConfig.msd.view_box,this._schedulePreviewUpdate()),await this._autoExtractViewBox();else if(!this._workingConfig.msd.view_box){const i=await this._extractViewBoxFromSvg();i?this._setNestedValue("msd.view_box",i):this._setNestedValue("msd.view_box",[0,0,400,200])}this.requestUpdate()}async _handleSvgSourceChange(e){this._setNestedValue("msd.base_svg.source",e),this._viewBoxMode==="auto"&&await this._autoExtractViewBox()}async _autoExtractViewBox(){var i,o;const e=(o=(i=this._workingConfig.msd)==null?void 0:i.base_svg)==null?void 0:o.source;if(!e||e==="none")return;const t=await this._extractViewBoxFromSvg();t&&this._viewBoxMode==="auto"&&(this._extractedViewBox=t,setTimeout(()=>this._fitToViewport(),50),m.trace("[MSDStudio] Auto-extracted viewBox for preview:",t))}async _extractViewBoxFromSvg(){var t,i;const e=(i=(t=this._workingConfig.msd)==null?void 0:t.base_svg)==null?void 0:i.source;if(!e||e==="none")return null;try{const{getSvgContent:o,getSvgViewBox:r}=await import("./lcards-main-Dyh7t6jw.js").then(a=>a.e3),s=o(e);if(s){const a=r(s);return m.trace("[MSDStudio] Extracted viewBox from SVG:",a),a}}catch(o){m.error("[MSDStudio] Error extracting viewBox:",o)}return null}_updateViewBoxValue(e,t){var o;const i=[...((o=this._workingConfig.msd)==null?void 0:o.view_box)||[0,0,400,200]];i[e]=parseFloat(t)||0,this._setNestedValue("msd.view_box",i)}_handleSvgSourceModeChange(e,t=this._svgSourceMode){this._svgSourceMode=e,e==="none"?this._viewBoxMode==="auto"&&this._handleViewBoxModeChange("custom"):t==="none"&&this._viewBoxMode==="custom"&&this._handleViewBoxModeChange("auto"),this._schedulePreviewUpdate(),this.requestUpdate()}_getAvailableSvgs(){var t,i;const e=(i=(t=window.lcards)==null?void 0:t.core)==null?void 0:i.assetManager;if(!e)return[{value:"",label:"AssetManager not available"}];try{const r=e.listAssets("svg").filter(s=>{var a;return!!((a=e.getMetadata("svg",s))!=null&&a.pack)}).map(s=>({value:`builtin:${s}`,label:s}));return r.sort((s,a)=>s.label.localeCompare(a.label)),r.length===0?[{value:"",label:"No SVG assets available"}]:r}catch(o){return m.error("[MSDStudio] Error listing SVG assets:",o),[{value:"",label:"Error loading SVG assets"}]}}_renderYamlTab(){return v`
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
        `}_getMsdSchema(){var e,t;try{const i=(t=(e=window.lcards)==null?void 0:e.core)==null?void 0:t.configManager;if(!i)return m.warn("[MSDStudio] CoreConfigManager not available"),null;const o=i.getCardSchema("msd");return o?(m.debug("[MSDStudio] Retrieved MSD schema for YAML editor autocomplete"),o):(m.warn("[MSDStudio] MSD schema not found in registry"),null)}catch(i){return m.error("[MSDStudio] Error getting MSD schema:",i),null}}_renderBaseSvgTab(){var o,r,s,a,l;this._workingConfig.msd||(this._workingConfig.msd={}),this._workingConfig.msd.base_svg||(this._workingConfig.msd.base_svg={source:""});const e=this._workingConfig.msd.base_svg,t=this._workingConfig.msd.view_box||[],i=this._getAvailableSvgs();return this._baseSvgPerformanceExpanded===null&&(this._baseSvgPerformanceExpanded=((o=this._workingConfig.msd)==null?void 0:o.triggers_update)==="all"),v`
            <div style="padding: 8px;">
                <!-- SVG Source Section -->
                <lcards-form-section
                    header="SVG Source"
                    description="Configure the base SVG template for your MSD display"
                    icon="mdi:image"
                    ?expanded=${true}>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <lcards-asset-source-picker .hass=${this.hass} .value=${e.source||""}
                            .assetTypes=${["svg"]} .assetOptions=${i} bareKeys
                            .accept=${["image/svg+xml"]}
                            .label=${"SVG Source Mode"} .assetLabel=${"SVG Asset"}
                            .customLabel=${"Custom SVG Path"} .customHelper=${"Enter custom path (e.g., /local/my-ship.svg)"}
                            .mediaHelper=${"Browse or upload an SVG via the Home Assistant media library"}
                            .noneLabel=${"None (ViewBox Only)"}
                            @value-changed=${d=>{d.stopPropagation(),this._handleSvgSourceChange(d.detail.value)}}
                            @mode-changed=${d=>{d.stopPropagation(),this._handleSvgSourceModeChange(d.detail.mode,d.detail.previous)}}>
                        </lcards-asset-source-picker>
                        ${this._svgSourceMode==="none"?v`
                            <lcards-message type="info">
                                No base SVG: overlays draw on a transparent canvas, so set the viewBox below by hand.
                            </lcards-message>
                        `:""}
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
                        .helper=${"Turn off to use a Background Layer (below) as the visual background instead; the SVG is still parsed for anchors either way."}
                        .selector=${{boolean:{}}}
                        .value=${e.render_visual!==false}
                        @value-changed=${d=>{this._setNestedValue("msd.base_svg.render_visual",d.detail.value)}}>
                    </ha-selector>

                    <ha-selector
                        style="margin-top: 12px; display: block;"
                        .hass=${this.hass}
                        .label=${"Dim base SVG in this preview (not saved)"}
                        .helper=${"Editor convenience only: makes lines/controls easier to see while working here. Never affects the saved config or the live card."}
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
                    description="Animate elements inside the base SVG by id/class, separate from the whole-group filter crossfades above"
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
                    description="Bulk-target overlays by CSS selector, e.g. animate every overlay whose id starts with 'shield_' with one declaration"
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
                    description="Animated or static-image backgrounds (grids, starfields, images, etc.), the same layer system used by buttons/elbows"
                    icon="mdi:layers-triple-outline"
                    ?expanded=${false}>

                    <lcards-background-animation-editor
                        .hass=${this.hass}
                        .config=${((s=this._workingConfig.msd)==null?void 0:s.background_animation)??[]}
                        @effects-changed=${d=>{this._setNestedValue("msd.background_animation",d.detail.value)}}>
                    </lcards-background-animation-editor>

                </lcards-form-section>

                <!-- Performance (Advanced) Section -->
                <lcards-form-section
                    header="Performance (Advanced)"
                    description="Card-wide override for how controls receive updates"
                    icon="mdi:speedometer-slow"
                    secondary=${((a=this._workingConfig.msd)==null?void 0:a.triggers_update)==="all"?"Always update all controls":"Default (per-control optimization)"}
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
                        .value=${((l=this._workingConfig.msd)==null?void 0:l.triggers_update)==="all"}
                        @value-changed=${d=>{d.detail.value?(this._setNestedValue("msd.triggers_update","all"),this._baseSvgPerformanceExpanded=true):(this._workingConfig.msd&&delete this._workingConfig.msd.triggers_update,this._schedulePreviewUpdate(),this.requestUpdate())}}>
                    </ha-selector>
                </lcards-form-section>
            </div>
        `}_renderAnchorsTab(){this._workingConfig.msd||(this._workingConfig.msd={}),this._workingConfig.msd.anchors||(this._workingConfig.msd.anchors={});const e=this._workingConfig.msd.anchors,t=Object.entries(e),i=this._getBaseSvgAnchors(),{computed:o,harvested:r}=_a(i),s=Object.entries(r),a=Object.entries(o),l=(this._anchorFilterQuery||"").trim().toLowerCase(),d=h(_=>_.filter(([f])=>!l||f.toLowerCase().includes(l)),"applyFilter"),c=d(s),u=d(a),p=d(t),g=this._workingConfig.msd.base_svg||{};return v`
            <div style="padding: 8px;">
                <!-- Anchor Actions & Visualization Helpers -->
                <div style="display: flex; gap: 8px; margin-bottom: 16px; align-items: center;">
                    <ha-button @click=${this._openAnchorForm}>
                        <ha-icon icon="mdi:map-marker-plus" slot="start"></ha-icon>
                        Add Anchor
                    </ha-button>
                    <ha-button @click=${async _=>{_.stopPropagation(),await this._setMode(R.PLACE_ANCHOR)}}
                               ?disabled=${this._activeMode===R.PLACE_ANCHOR}>
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
                ${s.length>0?v`
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
                            <ha-button @click=${()=>this._promoteAllAnchors(c)}>
                                <ha-icon icon="mdi:content-duplicate" slot="start"></ha-icon>
                                Promote All${l?` (${c.length})`:""}
                            </ha-button>
                        </div>
                        ${c.length===0?v`
                            <div style="text-align: center; padding: 16px; color: var(--secondary-text-color);">
                                No harvested anchors match "${this._anchorFilterQuery}".
                            </div>
                        `:v`
                            <div style="display: flex; flex-direction: column; gap: 12px;">
                                ${c.map(([_,f])=>this._renderBaseSvgAnchorItem(_,f))}
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
                            <ha-button @click=${()=>this._promoteAllAnchors(u)}>
                                <ha-icon icon="mdi:content-duplicate" slot="start"></ha-icon>
                                Promote All${l?` (${u.length})`:""}
                            </ha-button>
                        </div>
                        ${u.length===0?v`
                            <div style="text-align: center; padding: 16px; color: var(--secondary-text-color);">
                                No computed anchors match "${this._anchorFilterQuery}".
                            </div>
                        `:v`
                            <div style="display: flex; flex-direction: column; gap: 12px;">
                                ${u.map(([_,f])=>this._renderBaseSvgAnchorItem(_,f))}
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
        `}_getLivePreviewCardElement(){var i,o;const e=(i=this.shadowRoot)==null?void 0:i.querySelector("lcards-msd-live-preview"),t=(o=e==null?void 0:e.shadowRoot)==null?void 0:o.querySelector(".preview-card-container");return(t==null?void 0:t.querySelector("lcards-msd-card"))||null}_getBaseSvgAnchors(){return Zt(this._workingConfig,this._root)}_renderBaseSvgAnchorItem(e,t){const[i,o]=Array.isArray(t)?t:[0,0];return v`
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
                @closed=${r=>{r.stopPropagation(),r.target===r.currentTarget&&this._closeAnchorForm()}}
                .headerTitle=${t}
                style="--ha-dialog-width-md: 500px;">
                <div style="padding: 12px 8px;">
                    ${o?v`
                        <lcards-message type="info" style="margin-bottom: 16px;">
                            This name exists in the base_svg. Your custom anchor will override the SVG anchor.
                        </lcards-message>
                    `:""}

                    <ha-input
                        autofocus
                        label="Anchor Name"
                        .value=${this._anchorFormName}
                        @input=${r=>{this._anchorFormName=r.target.value,this.requestUpdate()}}
                        required
                        hint="Unique identifier for this anchor"
                        style="width: 100%; margin-bottom: 16px;">
                    </ha-input>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <ha-input
                            type="number"
                            label="X Position"
                            .value=${String(this._anchorFormPosition[0]||0)}
                            @input=${r=>this._updateAnchorFormPosition(0,r.target.value)}>
                        </ha-input>
                        <ha-input
                            type="number"
                            label="Y Position"
                            .value=${String(this._anchorFormPosition[1]||0)}
                            @input=${r=>this._updateAnchorFormPosition(1,r.target.value)}>
                        </ha-input>
                    </div>
                </div>

                <ha-dialog-footer slot="footer">
                    <ha-button slot="secondaryAction" @click=${this._closeAnchorForm} appearance="plain">
                        <ha-icon icon="mdi:close" slot="start"></ha-icon>
                        Cancel
                    </ha-button>
                    <ha-button slot="primaryAction" @click=${this._saveAnchor}>
                        <ha-icon icon="mdi:content-save" slot="start"></ha-icon>
                        Save
                    </ha-button>
                </ha-dialog-footer>
            </ha-dialog>
        `}_openAnchorForm(){this._showAnchorForm=true,this._editingAnchorName=null,this._anchorFormName=this._generateAnchorName(),this._anchorFormPosition=[0,0],this._anchorFormUnit="vb",this.requestUpdate()}_editAnchor(e){var i,o;const t=(o=(i=this._workingConfig.msd)==null?void 0:i.anchors)==null?void 0:o[e];t&&(this._showAnchorForm=true,this._editingAnchorName=e,this._anchorFormName=e,this._anchorFormPosition=Array.isArray(t)?[...t]:[0,0],this._anchorFormUnit="vb",this.requestUpdate())}_promoteAnchorToUser(e,t){this._showAnchorForm=true,this._editingAnchorName=null,this._anchorFormName=e,this._anchorFormPosition=Array.isArray(t)?[...t]:[0,0],this._anchorFormUnit="vb",this.requestUpdate()}async _promoteAllAnchors(e){var r;const t=((r=this._workingConfig.msd)==null?void 0:r.anchors)||{},i=e.filter(([s])=>!t[s]);if(i.length===0){await this._showDialog("Nothing to Promote","All listed anchors already exist as user anchors.","info");return}if(await this._showConfirmDialog("Promote All",`Copy ${i.length} base SVG anchor${i.length===1?"":"s"} into User Anchors?`,{confirmLabel:"Promote",variant:"primary"})){for(const[s,a]of i){const l=[this._roundToPrecision(a[0]),this._roundToPrecision(a[1])];this._setNestedValue(`msd.anchors.${s}`,l)}m.debug(`[MSDStudio] Promoted ${i.length} base SVG anchors to user anchors`),this._schedulePreviewUpdate(),this.requestUpdate()}}async _saveAnchor(){var i;if(!this._anchorFormName||this._anchorFormName.trim()===""){await this._showDialog("Missing Name","Anchor name is required","error");return}if(!this._editingAnchorName&&(((i=this._workingConfig.msd)==null?void 0:i.anchors)||{})[this._anchorFormName]){await this._showDialog("Duplicate Anchor",`Anchor name "${this._anchorFormName}" already exists`,"error");return}this._editingAnchorName&&this._editingAnchorName!==this._anchorFormName&&delete this._workingConfig.msd.anchors[this._editingAnchorName];const e=`msd.anchors.${this._anchorFormName}`,t=[this._roundToPrecision(this._anchorFormPosition[0]),this._roundToPrecision(this._anchorFormPosition[1])];this._setNestedValue(e,t),this._closeAnchorForm(),m.debug("[MSDStudio] Anchor saved:",this._anchorFormName,t)}async _deleteAnchor(e){var i,o;await this._showConfirmDialog("Delete Anchor",`Are you sure you want to delete anchor "${e}"?`)&&(o=(i=this._workingConfig.msd)==null?void 0:i.anchors)!=null&&o[e]&&(delete this._workingConfig.msd.anchors[e],this._schedulePreviewUpdate(),this.requestUpdate(),m.debug("[MSDStudio] Anchor deleted:",e))}async _showConfirmDialog(e,t,i={}){const{confirmLabel:o="Delete",variant:r="danger"}=i;return new Promise(s=>{const a=document.createElement("ha-dialog");a.headerTitle=e,a.open=true;const l=document.createElement("div");l.innerHTML=t,l.style.padding="16px",l.style.lineHeight="1.5",a.appendChild(l);const d=document.createElement("ha-button");d.textContent="Cancel",d.setAttribute("appearance","plain"),r==="danger"&&(d.autofocus=true),d.addEventListener("click",()=>{a.open=false,s(false)});const c=document.createElement("ha-button");c.textContent=o,c.setAttribute("variant",r),r!=="danger"&&(c.autofocus=true),c.addEventListener("click",()=>{a.open=false,s(true)}),a.appendChild(ai({secondary:[d],primary:[c]})),nt(a,()=>{a.remove()}),rt(a,this)})}_closeAnchorForm(){this._showAnchorForm=false,this._editingAnchorName=null,this._anchorFormName="",this._anchorFormPosition=[0,0],this.requestUpdate()}_highlightAnchorInPreview(e){m.trace("[MSDStudio] Highlight anchor in preview:",e),this._highlightedAnchor=e,this.requestUpdate(),setTimeout(()=>{this._highlightedAnchor=null,this.requestUpdate()},2500)}_updateAnchorFormPosition(e,t){this._anchorFormPosition=[...this._anchorFormPosition],this._anchorFormPosition[e]=this._roundToPrecision(parseFloat(t)||0),this.requestUpdate()}_generateAnchorName(){var o;const e=((o=this._workingConfig.msd)==null?void 0:o.anchors)||{};let t=1,i=`anchor_${t}`;for(;e[i];)t++,i=`anchor_${t}`;return i}_handlePreviewDoubleClick(e){var o,r,s;const i=e.composedPath()[0];if(this._lineClickTimer&&(clearTimeout(this._lineClickTimer??void 0),this._lineClickTimer=null),this._activeMode===R.DRAW_SHAPE&&this._drawShapeState.kind==="polyline"){e.stopPropagation(),e.preventDefault(),this._finishDrawShapePolyline();return}if(i.tagName==="path"&&i.classList.contains("line-path")||i.tagName==="path"&&i.classList.contains("line-hit-area")){let a;if(i.classList.contains("line-hit-area")){const l=i.nextElementSibling;a=l==null?void 0:l.getAttribute("data-line-id")}else a=i.getAttribute("data-line-id");if(a){m.debug("[MSDStudioDialog] Double-click on line:",a),this._activeMode===R.ADD_WAYPOINT&&this._exitWaypointMode();const d=(((o=this._workingConfig.msd)==null?void 0:o.overlays)||[]).find(c=>c.id===a&&c.type==="line");d?this._editLine(d):m.warn("[MSDStudioDialog] Line not found:",a),e.stopPropagation(),e.preventDefault();return}}if(this._shapeClickTimer&&(clearTimeout(this._shapeClickTimer??void 0),this._shapeClickTimer=null),(r=i.classList)!=null&&r.contains("shape-path")||i.tagName==="path"&&i.classList.contains("shape-hit-area")){let a;if(i.classList.contains("shape-hit-area")){const l=i.nextElementSibling;a=l==null?void 0:l.getAttribute("data-shape-id")}else a=i.getAttribute("data-shape-id");if(a){const d=(((s=this._workingConfig.msd)==null?void 0:s.overlays)||[]).find(c=>c.id===a&&c.type==="shape");d?this._editShape(d):m.warn("[MSDStudioDialog] Shape not found:",a),e.stopPropagation(),e.preventDefault();return}}}_handlePreviewClick(e){var o,r,s,a,l,d;const i=e.composedPath()[0];if(m.debug("[MSDStudioDialog] Preview click:",{mode:this._activeMode,tagName:i.tagName,classList:i.classList?Array.from(i.classList):[],dataset:i.dataset||{},hasAnchorName:(o=i.hasAttribute)==null?void 0:o.call(i,"data-anchor-name")}),this._activeMode===R.VIEW||this._activeMode===R.ADD_WAYPOINT){if(i.tagName==="path"&&i.classList.contains("line-path")||i.tagName==="path"&&i.classList.contains("line-hit-area")){let c;if(i.classList.contains("line-hit-area")){const u=i.nextElementSibling;c=u==null?void 0:u.getAttribute("data-line-id")}else c=i.getAttribute("data-line-id");if(c){this._lineClickTimer&&(clearTimeout(this._lineClickTimer??void 0),this._lineClickTimer=null),this._lineClickTimer=setTimeout(()=>{this._selectLine(c),this._lineClickTimer=null},250),e.stopPropagation();return}}if(i.tagName==="path"&&i.classList.contains("shape-path")||i.tagName==="path"&&i.classList.contains("shape-hit-area")){let c;if(i.classList.contains("shape-hit-area")){const u=i.nextElementSibling;c=u==null?void 0:u.getAttribute("data-shape-id")}else c=i.getAttribute("data-shape-id");if(c){this._shapeClickTimer&&(clearTimeout(this._shapeClickTimer??void 0),this._shapeClickTimer=null),this._shapeClickTimer=setTimeout(()=>{this._selectedShapeId=c,this.requestUpdate(),this._shapeClickTimer=null},250),e.stopPropagation();return}}if(this._activeMode===R.VIEW){if(this._panJustEnded)return;this._selectedLineId=null,this._selectedShapeId=null,this.requestUpdate();return}}if(this._activeMode===R.ADD_WAYPOINT){if(((r=i.classList)==null?void 0:r.contains("anchor-marker"))||((s=i.classList)==null?void 0:s.contains("interactive-anchor"))||((a=i.hasAttribute)==null?void 0:a.call(i,"data-anchor-name"))){const p=i.getAttribute("data-anchor-name");if(p&&this._selectedLineId){this._addNamedWaypoint(p),e.stopPropagation();return}}if((l=i.classList)!=null&&l.contains("waypoint-marker")||(d=i.classList)!=null&&d.contains("corner-radius-handle")){e.stopPropagation();return}if(i.tagName==="DIV"&&(i.classList.contains("preview-scroll-container")||i.classList.contains("preview-container"))&&!this._waypointDragInProgress&&!this._cornerRadiusDragInProgress){this._exitWaypointMode(),e.stopPropagation();return}if(this._selectedLineId){this._handleAddWaypointClick(e);return}}this._activeMode===R.PLACE_ANCHOR?this._handlePlaceAnchorClick(e):this._activeMode===R.PLACE_CONTROL?this._handlePlaceControlClick(e):this._activeMode===R.CONNECT_LINE?this._handleConnectLineClick(e):this._activeMode===R.DRAW_CHANNEL?this._handleDrawChannelClick(e):this._activeMode===R.DRAW_SHAPE?this._handleDrawShapeClick(e):this._activeMode===R.QUICK_LABEL&&this._handleQuickLabelClick(e)}_handlePreviewMouseDown(e){if(this._activeMode===R.DRAW_SHAPE&&(this._drawShapeState.kind==="rect"||this._drawShapeState.kind==="circle")&&this._drawShapeState.points.length===0){const t=this._getPreviewCoordinates(e);if(!t)return;this._shapeDrawDragCandidate={startClientX:e.clientX,startClientY:e.clientY,startCoords:[t.x,t.y],converted:false};return}if(this._activeMode===R.DRAW_CHANNEL&&!this._drawChannelState.startPoint){const t=this._getPreviewCoordinates(e);if(!t)return;this._channelDrawDragCandidate={startClientX:e.clientX,startClientY:e.clientY,startCoords:[t.x,t.y],converted:false};return}if(this._activeMode===R.PLACE_CONTROL&&!this._placeControlDrawState.startPoint){const t=this._getPreviewCoordinates(e);if(!t)return;this._controlDrawDragCandidate={startClientX:e.clientX,startClientY:e.clientY,startCoords:[t.x,t.y],converted:false}}}_handlePreviewMouseMove(e){if(this._shapeDrawDragCandidate&&!this._shapeDrawDragCandidate.converted){const i=e.clientX-this._shapeDrawDragCandidate.startClientX,o=e.clientY-this._shapeDrawDragCandidate.startClientY;Math.hypot(i,o)>4&&(this._shapeDrawDragCandidate.converted=true,this._drawShapeState={kind:this._drawShapeState.kind,points:[this._shapeDrawDragCandidate.startCoords],drawing:true,currentPoint:null})}if(this._channelDrawDragCandidate&&!this._channelDrawDragCandidate.converted){const i=e.clientX-this._channelDrawDragCandidate.startClientX,o=e.clientY-this._channelDrawDragCandidate.startClientY;Math.hypot(i,o)>4&&(this._channelDrawDragCandidate.converted=true,this._drawChannelState={startPoint:this._channelDrawDragCandidate.startCoords,currentPoint:null,drawing:true,tempRectElement:null})}if(this._controlDrawDragCandidate&&!this._controlDrawDragCandidate.converted){const i=e.clientX-this._controlDrawDragCandidate.startClientX,o=e.clientY-this._controlDrawDragCandidate.startClientY;Math.hypot(i,o)>4&&(this._controlDrawDragCandidate.converted=true,this._placeControlDrawState={startPoint:this._controlDrawDragCandidate.startCoords,currentPoint:null,drawing:true})}if(this._showCrosshairs||this._activeMode===R.PLACE_ANCHOR||this._activeMode===R.PLACE_CONTROL){const i=this._getPreviewCoordinatesWithPixels(e);i&&(this._cursorPosition=i,this.requestUpdate())}if(this._activeMode===R.DRAW_CHANNEL&&this._drawChannelState.drawing){const i=this._getPreviewCoordinates(e);i&&(this._drawChannelState.currentPoint=[i.x,i.y],this.requestUpdate())}if(this._activeMode===R.PLACE_CONTROL&&this._placeControlDrawState.drawing){const i=this._getPreviewCoordinates(e);i&&(this._placeControlDrawState.currentPoint=[i.x,i.y],this.requestUpdate())}if(this._activeMode===R.QUICK_LABEL){const i=this._quickLabelSnap(e);i&&(this._quickLabelState={...this._quickLabelState,currentPoint:this._quickLabelState.targetPoint?i.point:null,snap:i})}if(this._activeMode===R.DRAW_SHAPE&&this._drawShapeState.points.length>0){const i=this._getPreviewCoordinates(e);i&&(this._drawShapeState.currentPoint=[i.x,i.y],this.requestUpdate())}}_handlePreviewMouseLeave(){this._cursorPosition=null,this._drawChannelState.drawing&&(this._drawChannelState.currentPoint=null),this._placeControlDrawState.drawing&&(this._placeControlDrawState.currentPoint=null),(this._quickLabelState.currentPoint||this._quickLabelState.snap)&&(this._quickLabelState={...this._quickLabelState,currentPoint:null,snap:null}),this._shapeDrawDragCandidate&&!this._shapeDrawDragCandidate.converted&&(this._shapeDrawDragCandidate=null),this._channelDrawDragCandidate&&!this._channelDrawDragCandidate.converted&&(this._channelDrawDragCandidate=null),this._controlDrawDragCandidate&&!this._controlDrawDragCandidate.converted&&(this._controlDrawDragCandidate=null),this.requestUpdate()}_handlePlaceAnchorClick(e){m.debug(`[MSDStudio] _handlePlaceAnchorClick ENTRY - mode: ${this._activeMode}`);const t=this._getPreviewCoordinates(e);if(!t){m.warn("[MSDStudio] Could not get preview coordinates");return}m.debug("[MSDStudio] Place anchor at:",t);const{x:i,y:o}=t;this._showAnchorForm=true,this._editingAnchorName=null,this._anchorFormName=this._generateAnchorName(),this._anchorFormPosition=[i,o],this._anchorFormUnit="vb",this._activeMode=R.VIEW,this.requestUpdate()}_handlePlaceControlClick(e){m.debug(`[MSDStudio] _handlePlaceControlClick ENTRY - mode: ${this._activeMode}`);const t=this._getPreviewCoordinates(e);if(!t){m.warn("[MSDStudio] Could not get preview coordinates");return}if(!this._placeControlDrawState.startPoint){this._placeControlDrawState.startPoint=[t.x,t.y],this._placeControlDrawState.drawing=true,this._controlDrawDragCandidate=null,m.trace("[MSDStudio] Place control draw started at:",t),this.requestUpdate();return}this._finishPlaceControl(this._placeControlDrawState.startPoint,[t.x,t.y])}_finishPlaceControl(e,t){var b;const[i,o]=e,[r,s]=t,a=Math.abs(r-i),l=Math.abs(s-o);let d,c,u,p;if(a<10&&l<10)d=i,c=o,u=100,p=100;else{const w=Math.min(i,r),S=Math.min(o,s);u=a,p=l,d=w+u/2,c=S+p/2}this._placeControlDrawState={startPoint:null,currentPoint:null,drawing:false},this._controlDrawDragCandidate=null;const g=((b=this._workingConfig.msd)==null?void 0:b.overlays)||[];let _=g.filter(w=>w.type==="control").length+1,f=`control_${_}`;for(;g.find(w=>w.id===f);)_++,f=`control_${_}`;this._editingControlId=f,this._controlFormId=f,this._controlFormPosition=[Math.round(d),Math.round(c)],this._controlFormSize=[Math.round(u),Math.round(p)],this._controlFormAttachment="center",this._controlFormPositionSide="center",this._controlFormObstacle=true,this._controlFormZIndex=null,this._controlFormLocked=false,this._controlFormTriggersUpdateMode="specific",this._controlFormTriggersUpdateEntities=[],this._controlFormTriggersUpdateExpanded=false,this._controlFormCard={type:""},this._controlFormAnimations=[],this._controlFormActiveSubtab="placement",this._showControlForm=true,this._activeMode=R.VIEW,this.requestUpdate()}_handleDragStart(e,t){var _,f;e.stopPropagation(),e.preventDefault(),m.debug("[MSDStudio] Drag start:",t);const i=this._findControl(t);if(!i){m.warn("[MSDStudio] Control not found for drag:",t);return}if(i.locked)return;const o=this._root.querySelector("lcards-msd-live-preview"),r=o==null?void 0:o.shadowRoot,s=r==null?void 0:r.querySelector(".preview-card-container"),a=s==null?void 0:s.querySelector("lcards-msd-card"),l=((f=(_=a==null?void 0:a._msdPipeline)==null?void 0:_.getResolvedModel())==null?void 0:f.anchors)||{};let d;if(i.position&&Array.isArray(i.position))d=[...i.position];else if(i.position||i.anchor){if(d=this._resolveEditorControlPosition(i,l),!d){m.warn("[MSDStudio] Could not resolve position for drag:",i.position||i.anchor);return}d=[...d]}else{m.warn("[MSDStudio] Control has no position or anchor");return}const c=this._getPreviewCoordinatesFromMouseEvent(e);if(!c){m.warn("[MSDStudio] Could not get coordinates for drag start");return}const u=c.x-d[0],p=c.y-d[1];this._dragState={active:true,controlId:t,startPos:[c.x,c.y],originalPos:d,offsetX:u,offsetY:p};const g=this._root.querySelector(".preview-panel");g&&g.classList.add("dragging"),this._boundDragMouseMove&&document.removeEventListener("mousemove",this._boundDragMouseMove),this._boundDragMouseUp&&document.removeEventListener("mouseup",this._boundDragMouseUp),this._boundDragMouseMove=this._handleDrag.bind(this),this._boundDragMouseUp=this._handleDragMouseUp.bind(this),document.addEventListener("mousemove",this._boundDragMouseMove),document.addEventListener("mouseup",this._boundDragMouseUp),this.requestUpdate()}_roundToPrecision(e,t=2){const i=Math.pow(10,t);return Math.round(e*i)/i}_handleDrag(e){if(!this._dragState.active)return;const t=this._getPreviewCoordinatesFromMouseEvent(e);if(!t)return;let i=t.x-this._dragState.offsetX,o=t.y-this._dragState.offsetY;this._enableSnapping&&this._gridSpacing&&(i=Math.round(i/this._gridSpacing)*this._gridSpacing,o=Math.round(o/this._gridSpacing)*this._gridSpacing);const r=this._findControl(this._dragState.controlId);r&&(typeof r.position=="string"||r.anchor&&delete r.anchor,r.position=[this._roundToPrecision(i),this._roundToPrecision(o)],this.requestUpdate())}_handleDragMouseUp(e){if(!this._dragState.active)return;m.debug("[MSDStudio] Drag end:",this._dragState.controlId);const t=this._root.querySelector(".preview-panel");t&&t.classList.remove("dragging"),this._dragState={active:false,controlId:null,startPos:null,originalPos:null,offsetX:0,offsetY:0},this._boundDragMouseMove&&(document.removeEventListener("mousemove",this._boundDragMouseMove),this._boundDragMouseMove=null),this._boundDragMouseUp&&(document.removeEventListener("mouseup",this._boundDragMouseUp),this._boundDragMouseUp=null),this._schedulePreviewUpdate(),this.requestUpdate()}_handleDragEnd(e){var t,i,o;if(this._mouseDownPos=null,(t=this._shapeDrawDragCandidate)!=null&&t.converted){const r=this._getPreviewCoordinates(e);r&&this._drawShapeState.points.length?(this._finishDrawShapeRect(this._drawShapeState.kind,this._drawShapeState.points[0],[r.x,r.y]),this.requestUpdate()):this._shapeDrawDragCandidate=null}if((i=this._channelDrawDragCandidate)!=null&&i.converted){const r=this._getPreviewCoordinates(e);r&&this._drawChannelState.startPoint?(this._finishDrawChannel(this._drawChannelState.startPoint,[r.x,r.y]),this.requestUpdate()):this._channelDrawDragCandidate=null}if((o=this._controlDrawDragCandidate)!=null&&o.converted){const r=this._getPreviewCoordinates(e);r&&this._placeControlDrawState.startPoint?(this._finishPlaceControl(this._placeControlDrawState.startPoint,[r.x,r.y]),this.requestUpdate()):this._controlDrawDragCandidate=null}}_getAttachmentOffset(e,t,i){const o={"top-left":[0,0],top:[-t/2,0],"top-center":[-t/2,0],"top-right":[-t,0],left:[0,-i/2],center:[-t/2,-i/2],"middle-center":[-t/2,-i/2],right:[-t,-i/2],"bottom-left":[0,-i],bottom:[-t/2,-i],"bottom-center":[-t/2,-i],"bottom-right":[-t,-i]};return o[e]||o["top-left"]}_renderLiveCoordBadge(e,t,i,o){if(t&&Array.isArray(o)){const[r,s]=o;return v`
                <div class="live-coord-badge" style="top: 50%; left: 50%; transform: translate(-50%, -50%);">
                    ${Math.round(r)} × ${Math.round(s)}
                </div>
            `}if(e&&Array.isArray(i)){const[r,s]=i;return v`
                <div class="live-coord-badge" style="bottom: -28px; left: 50%; transform: translateX(-50%);">
                    ${Math.round(r)}, ${Math.round(s)}
                </div>
            `}return""}_renderResizeHandles(e,t,i,o){return v`
            ${["tl","t","tr","r","br","b","bl","l"].map(s=>{const a=o&&this._resizeState.handle===s;return v`
                    <div
                        class="resize-handle ${s} ${a?"active":""}"
                        data-handle="${s}"
                        @mousedown=${l=>this._handleResizeStart(l,e,s)}>
                    </div>
                `})}
        `}_handleResizeStart(e,t,i){var b,w;e.stopPropagation(),e.preventDefault(),m.debug("[MSDStudio] Resize start:",t,i);const o=this._findControl(t);if(!o){m.warn("[MSDStudio] Control not found for resize:",t);return}if(o.locked)return;const r=this._root.querySelector("lcards-msd-live-preview"),s=r==null?void 0:r.shadowRoot,a=s==null?void 0:s.querySelector(".preview-card-container"),l=a==null?void 0:a.querySelector("lcards-msd-card"),d=((w=(b=l==null?void 0:l._msdPipeline)==null?void 0:b.getResolvedModel())==null?void 0:w.anchors)||{};let c;if(o.position&&Array.isArray(o.position))c=[...o.position];else if(o.position||o.anchor){if(c=this._resolveEditorControlPosition(o,d),!c){m.warn("[MSDStudio] Could not resolve position for resize:",o.position||o.anchor);return}c=[...c]}else{m.warn("[MSDStudio] Control has no position or anchor");return}const u=o.size?[...o.size]:[100,100],p=this._getPreviewCoordinatesFromMouseEvent(e);if(!p){m.warn("[MSDStudio] Could not get coordinates for resize start");return}const g=o.attachment||"center",_=this._getAttachmentOffset(g,u[0],u[1]),f=[c[0]+_[0],c[1]+_[1]];this._resizeState={active:true,controlId:t,handle:i,startPos:[p.x,p.y],startSize:u,startPosition:f},this._boundResizeMouseMove&&document.removeEventListener("mousemove",this._boundResizeMouseMove),this._boundResizeMouseUp&&document.removeEventListener("mouseup",this._boundResizeMouseUp),this._boundResizeMouseMove=this._handleResize.bind(this),this._boundResizeMouseUp=this._handleResizeMouseUp.bind(this),document.addEventListener("mousemove",this._boundResizeMouseMove),document.addEventListener("mouseup",this._boundResizeMouseUp),this.requestUpdate()}_handleResize(e){if(!this._resizeState.active)return;const t=this._getPreviewCoordinatesFromMouseEvent(e);if(!t)return;const i=t.x-this._resizeState.startPos[0],o=t.y-this._resizeState.startPos[1],r=this._findControl(this._resizeState.controlId);if(!r)return;typeof r.position=="string"||r.anchor&&delete r.anchor,r.size||(r.size=[100,100]);const[s,a]=this._resizeState.startSize,[l,d]=this._resizeState.startPosition,c=this._resizeState.handle;let u=s,p=a,g=l,_=d;switch(c){case"tl":u=s-i,p=a-o,g=l+i,_=d+o;break;case"t":p=a-o,_=d+o;break;case"tr":u=s+i,p=a-o,_=d+o;break;case"r":u=s+i;break;case"br":u=s+i,p=a+o;break;case"b":p=a+o;break;case"bl":u=s-i,p=a+o,g=l+i;break;case"l":u=s-i,g=l+i;break}const f=20;u<f&&(u=f,c.includes("l")&&(g=l+s-f)),p<f&&(p=f,c.includes("t")&&(_=d+a-f)),this._enableSnapping&&this._gridSpacing&&(u=Math.round(u/this._gridSpacing)*this._gridSpacing,p=Math.round(p/this._gridSpacing)*this._gridSpacing,g=Math.round(g/this._gridSpacing)*this._gridSpacing,_=Math.round(_/this._gridSpacing)*this._gridSpacing);const b=r.attachment||"center",w=this._getAttachmentOffset(b,u,p),S=g-w[0],C=_-w[1];r.size=[this._roundToPrecision(u),this._roundToPrecision(p)],r.position=[this._roundToPrecision(S),this._roundToPrecision(C)],this.requestUpdate()}_handleResizeMouseUp(e){this._resizeState.active&&(m.debug("[MSDStudio] Resize end:",this._resizeState.controlId),this._resizeState={active:false,controlId:null,handle:null,startPos:null,startSize:null,startPosition:null},this._boundResizeMouseMove&&(document.removeEventListener("mousemove",this._boundResizeMouseMove),this._boundResizeMouseMove=null),this._boundResizeMouseUp&&(document.removeEventListener("mouseup",this._boundResizeMouseUp),this._boundResizeMouseUp=null),this._schedulePreviewUpdate(),this.requestUpdate())}_handleShapeDragStart(e,t){e.stopPropagation(),e.preventDefault();const i=this._findControl(t);if(!i||!Array.isArray(i.position)){m.warn("[MSDStudio] Shape not found or has no literal position for drag:",t);return}if(i.locked)return;const o=this._getPreviewCoordinatesFromMouseEvent(e);if(!o)return;const r=[...i.position];this._shapeDragState={active:true,shapeId:t,startPos:[o.x,o.y],originalPos:r,offsetX:o.x-r[0],offsetY:o.y-r[1]};const s=this._root.querySelector(".preview-panel");s&&s.classList.add("dragging"),this._boundShapeDragMouseMove&&document.removeEventListener("mousemove",this._boundShapeDragMouseMove),this._boundShapeDragMouseUp&&document.removeEventListener("mouseup",this._boundShapeDragMouseUp),this._boundShapeDragMouseMove=this._handleShapeDrag.bind(this),this._boundShapeDragMouseUp=this._handleShapeDragMouseUp.bind(this),document.addEventListener("mousemove",this._boundShapeDragMouseMove),document.addEventListener("mouseup",this._boundShapeDragMouseUp),this.requestUpdate()}_handleShapeDrag(e){if(!this._shapeDragState.active)return;const t=this._getPreviewCoordinatesFromMouseEvent(e);if(!t)return;let i=t.x-this._shapeDragState.offsetX,o=t.y-this._shapeDragState.offsetY;this._enableSnapping&&this._gridSpacing&&(i=Math.round(i/this._gridSpacing)*this._gridSpacing,o=Math.round(o/this._gridSpacing)*this._gridSpacing);const r=this._findControl(this._shapeDragState.shapeId);r&&(r.position=[this._roundToPrecision(i),this._roundToPrecision(o)],this.requestUpdate())}_handleShapeDragMouseUp(e){if(!this._shapeDragState.active)return;m.debug("[MSDStudio] Shape drag end:",this._shapeDragState.shapeId);const t=this._root.querySelector(".preview-panel");t&&t.classList.remove("dragging"),this._shapeDragState={active:false,shapeId:null,startPos:null,originalPos:null,offsetX:0,offsetY:0},this._boundShapeDragMouseMove&&(document.removeEventListener("mousemove",this._boundShapeDragMouseMove),this._boundShapeDragMouseMove=null),this._boundShapeDragMouseUp&&(document.removeEventListener("mouseup",this._boundShapeDragMouseUp),this._boundShapeDragMouseUp=null),this._schedulePreviewUpdate(),this.requestUpdate()}_renderShapeResizeHandles(e,t,i,o){return v`
            ${["tl","t","tr","r","br","b","bl","l"].map(s=>{const a=o&&this._shapeResizeState.handle===s;return v`
                    <div
                        class="resize-handle ${s} ${a?"active":""}"
                        data-handle="${s}"
                        @mousedown=${l=>this._handleShapeResizeStart(l,e,s)}>
                    </div>
                `})}
        `}_handleShapeResizeStart(e,t,i){e.stopPropagation(),e.preventDefault();const o=this._findControl(t);if(!o||!Array.isArray(o.position)){m.warn("[MSDStudio] Shape not found or has no literal position for resize:",t);return}if(o.locked)return;const r=this._getPreviewCoordinatesFromMouseEvent(e);r&&(this._shapeResizeState={active:true,shapeId:t,handle:i,startPos:[r.x,r.y],startSize:o.size?[...o.size]:[100,60],startPosition:[...o.position]},this._boundShapeResizeMouseMove&&document.removeEventListener("mousemove",this._boundShapeResizeMouseMove),this._boundShapeResizeMouseUp&&document.removeEventListener("mouseup",this._boundShapeResizeMouseUp),this._boundShapeResizeMouseMove=this._handleShapeResize.bind(this),this._boundShapeResizeMouseUp=this._handleShapeResizeMouseUp.bind(this),document.addEventListener("mousemove",this._boundShapeResizeMouseMove),document.addEventListener("mouseup",this._boundShapeResizeMouseUp),this.requestUpdate())}_handleShapeResize(e){if(!this._shapeResizeState.active)return;const t=this._getPreviewCoordinatesFromMouseEvent(e);if(!t)return;const i=t.x-this._shapeResizeState.startPos[0],o=t.y-this._shapeResizeState.startPos[1],r=this._findControl(this._shapeResizeState.shapeId);if(!r)return;const[s,a]=this._shapeResizeState.startSize,[l,d]=this._shapeResizeState.startPosition,c=this._shapeResizeState.handle;let u=s,p=a,g=l,_=d;switch(c){case"tl":u=s-i,p=a-o,g=l+i,_=d+o;break;case"t":p=a-o,_=d+o;break;case"tr":u=s+i,p=a-o,_=d+o;break;case"r":u=s+i;break;case"br":u=s+i,p=a+o;break;case"b":p=a+o;break;case"bl":u=s-i,p=a+o,g=l+i;break;case"l":u=s-i,g=l+i;break}const f=10;u<f&&(u=f,c.includes("l")&&(g=l+s-f)),p<f&&(p=f,c.includes("t")&&(_=d+a-f)),this._enableSnapping&&this._gridSpacing&&(u=Math.round(u/this._gridSpacing)*this._gridSpacing,p=Math.round(p/this._gridSpacing)*this._gridSpacing,g=Math.round(g/this._gridSpacing)*this._gridSpacing,_=Math.round(_/this._gridSpacing)*this._gridSpacing),r.size=[this._roundToPrecision(u),this._roundToPrecision(p)],r.position=[this._roundToPrecision(g),this._roundToPrecision(_)],this.requestUpdate()}_handleShapeResizeMouseUp(e){this._shapeResizeState.active&&(m.debug("[MSDStudio] Shape resize end:",this._shapeResizeState.shapeId),this._shapeResizeState={active:false,shapeId:null,handle:null,startPos:null,startSize:null,startPosition:null},this._boundShapeResizeMouseMove&&(document.removeEventListener("mousemove",this._boundShapeResizeMouseMove),this._boundShapeResizeMouseMove=null),this._boundShapeResizeMouseUp&&(document.removeEventListener("mouseup",this._boundShapeResizeMouseUp),this._boundShapeResizeMouseUp=null),this._schedulePreviewUpdate(),this.requestUpdate())}_handleShapeVertexMouseDown(e,t,i){e.stopPropagation(),e.preventDefault();const o=this._findControl(t);o!=null&&o.locked||(this._shapeVertexDragInProgress=true,this._shapeVertexDragState={shapeId:t,vertexIndex:i,startX:e.clientX,startY:e.clientY},this._boundShapeVertexMouseMove=this._handleShapeVertexMouseMove.bind(this),this._boundShapeVertexMouseUp=this._handleShapeVertexMouseUp.bind(this),document.addEventListener("mousemove",this._boundShapeVertexMouseMove),document.addEventListener("mouseup",this._boundShapeVertexMouseUp),this.requestUpdate())}_handleShapeVertexMouseMove(e){var d,c;if(!this._shapeVertexDragState)return;e.preventDefault();const{shapeId:t,vertexIndex:i}=this._shapeVertexDragState,o=this._getPreviewCoordinatesFromMouseEvent(e);if(!o)return;let{x:r,y:s}=o;if(this._enableSnapping&&this._gridSpacing>0){const u=Pi(r,s,this._gridSpacing);r=u[0],s=u[1]}const l=(((d=this._workingConfig.msd)==null?void 0:d.overlays)||[]).find(u=>u.id===t&&u.type==="shape");l&&Array.isArray(l.points)&&l.points[i]!==void 0&&(l.points[i]=[this._roundToPrecision(r),this._roundToPrecision(s)],((c=this._shapeFormData)==null?void 0:c.id)===t&&this._shapeFormData.points&&(this._shapeFormData.points[i]=l.points[i]),this._schedulePreviewUpdate(),this.requestUpdate())}_handleShapeVertexMouseUp(e){this._shapeVertexDragState&&(e.preventDefault(),e.stopPropagation(),this._shapeVertexDragState=null,this._boundShapeVertexMouseMove&&(document.removeEventListener("mousemove",this._boundShapeVertexMouseMove),this._boundShapeVertexMouseMove=null),this._boundShapeVertexMouseUp&&(document.removeEventListener("mouseup",this._boundShapeVertexMouseUp),this._boundShapeVertexMouseUp=null),setTimeout(()=>{this._shapeVertexDragInProgress=false},150),this.requestUpdate())}_handleShapeVertexDoubleClick(e,t,i){var s,a;e.stopPropagation(),e.preventDefault();const r=(((s=this._workingConfig.msd)==null?void 0:s.overlays)||[]).find(l=>l.id===t&&l.type==="shape");if(!r||!Array.isArray(r.points)||r.points.length<=2){m.warn("[MSDStudio] Cannot delete vertex — polyline needs at least 2 points");return}r.points.splice(i,1),((a=this._shapeFormData)==null?void 0:a.id)===t&&(this._shapeFormData.points=[...r.points]),this._schedulePreviewUpdate(),this.requestUpdate()}_handleShapeSegmentInsertClick(e,t,i,o,r){var l,d;e.stopPropagation(),e.preventDefault();const a=(((l=this._workingConfig.msd)==null?void 0:l.overlays)||[]).find(c=>c.id===t&&c.type==="shape");!a||!Array.isArray(a.points)||(a.points.splice(i,0,[this._roundToPrecision(o),this._roundToPrecision(r)]),((d=this._shapeFormData)==null?void 0:d.id)===t&&(this._shapeFormData.points=[...a.points]),this._schedulePreviewUpdate(),this.requestUpdate())}_handleAnchorDragStart(e,t){var s;e.stopPropagation(),e.preventDefault(),m.debug("[MSDStudio] Anchor drag start:",t);const o=(((s=this._workingConfig.msd)==null?void 0:s.anchors)||{})[t];if(!o||!Array.isArray(o)){m.warn("[MSDStudio] Anchor not found for drag:",t);return}const r=this._getPreviewCoordinatesFromMouseEvent(e);if(!r){m.warn("[MSDStudio] Could not get coordinates for anchor drag start");return}this._anchorDragState={active:true,anchorName:t,startPos:[r.x,r.y],originalPos:[...o]},this._boundAnchorDragMouseMove&&document.removeEventListener("mousemove",this._boundAnchorDragMouseMove),this._boundAnchorDragMouseUp&&document.removeEventListener("mouseup",this._boundAnchorDragMouseUp),this._boundAnchorDragMouseMove=this._handleAnchorDrag.bind(this),this._boundAnchorDragMouseUp=this._handleAnchorDragMouseUp.bind(this),document.addEventListener("mousemove",this._boundAnchorDragMouseMove),document.addEventListener("mouseup",this._boundAnchorDragMouseUp),this.requestUpdate()}_handleAnchorDrag(e){var s;if(!this._anchorDragState.active)return;const t=this._getPreviewCoordinatesFromMouseEvent(e);if(!t)return;let i=t.x,o=t.y;this._enableSnapping&&this._gridSpacing&&(i=Math.round(i/this._gridSpacing)*this._gridSpacing,o=Math.round(o/this._gridSpacing)*this._gridSpacing);const r=((s=this._workingConfig.msd)==null?void 0:s.anchors)||{};r[this._anchorDragState.anchorName]&&(r[this._anchorDragState.anchorName]=[this._roundToPrecision(i),this._roundToPrecision(o)],this.requestUpdate())}_handleAnchorDragMouseUp(e){this._anchorDragState.active&&(m.debug("[MSDStudio] Anchor drag end:",this._anchorDragState.anchorName),this._anchorDragState={active:false,anchorName:null,startPos:null,originalPos:null},this._boundAnchorDragMouseMove&&(document.removeEventListener("mousemove",this._boundAnchorDragMouseMove),this._boundAnchorDragMouseMove=null),this._boundAnchorDragMouseUp&&(document.removeEventListener("mouseup",this._boundAnchorDragMouseUp),this._boundAnchorDragMouseUp=null),this._schedulePreviewUpdate(),this.requestUpdate())}_handleAnchorDoubleClick(e,t){var r;e.stopPropagation(),e.preventDefault(),m.debug("[MSDStudio] Anchor double-click:",t);const o=(((r=this._workingConfig.msd)==null?void 0:r.anchors)||{})[t];if(!o||!Array.isArray(o)){m.warn("[MSDStudio] Anchor not found:",t);return}this._editingAnchorName=t,this._anchorFormName=t,this._anchorFormPosition=[...o],this._anchorFormUnit="vb",this._showAnchorForm=true,this.requestUpdate()}_renderChannelResizeHandles(e,t,i,o){return v`
            ${["tl","t","tr","r","br","b","bl","l"].map(s=>{const a=o&&this._channelResizeState.handle===s;return v`
                    <div
                        class="resize-handle ${s} ${a?"active":""}"
                        data-handle="${s}"
                        style="background: #00FFAA; border-color: #00FFAA;"
                        @mousedown=${l=>this._handleChannelResizeStart(l,e,s)}>
                    </div>
                `})}
        `}_handleChannelDragStart(e,t){var s;e.stopPropagation(),e.preventDefault();const o=(((s=this._workingConfig.msd)==null?void 0:s.channels)||{})[t];if(!o||!o.bounds){m.warn("[MSDStudio] Channel not found or has no bounds for drag:",t);return}const r=this._getPreviewCoordinatesFromMouseEvent(e);if(!r){m.warn("[MSDStudio] Could not get coordinates for channel drag start");return}this._channelDragState={active:true,channelId:t,startPos:[r.x,r.y],startBounds:[...o.bounds]},this._boundChannelDragMouseMove&&document.removeEventListener("mousemove",this._boundChannelDragMouseMove),this._boundChannelDragMouseUp&&document.removeEventListener("mouseup",this._boundChannelDragMouseUp),this._boundChannelDragMouseMove=this._handleChannelDrag.bind(this),this._boundChannelDragMouseUp=this._handleChannelDragMouseUp.bind(this),document.addEventListener("mousemove",this._boundChannelDragMouseMove),document.addEventListener("mouseup",this._boundChannelDragMouseUp),this.requestUpdate()}_handleChannelDrag(e){var g;if(!this._channelDragState.active)return;const t=this._getPreviewCoordinatesFromMouseEvent(e);if(!t)return;const i=t.x-this._channelDragState.startPos[0],o=t.y-this._channelDragState.startPos[1],s=(((g=this._workingConfig.msd)==null?void 0:g.channels)||{})[this._channelDragState.channelId];if(!s)return;const[a,l,d,c]=this._channelDragState.startBounds;let u=a+i,p=l+o;this._enableSnapping&&this._gridSpacing&&(u=Math.round(u/this._gridSpacing)*this._gridSpacing,p=Math.round(p/this._gridSpacing)*this._gridSpacing),s.bounds=[this._roundToPrecision(u),this._roundToPrecision(p),d,c],this.requestUpdate()}_handleChannelDragMouseUp(e){this._channelDragState.active&&(m.debug("[MSDStudio] Channel drag end:",this._channelDragState.channelId),this._channelDragState={active:false,channelId:null,startPos:null,startBounds:null},this._boundChannelDragMouseMove&&(document.removeEventListener("mousemove",this._boundChannelDragMouseMove),this._boundChannelDragMouseMove=null),this._boundChannelDragMouseUp&&(document.removeEventListener("mouseup",this._boundChannelDragMouseUp),this._boundChannelDragMouseUp=null),this._schedulePreviewUpdate(),this.requestUpdate())}_handleChannelResizeStart(e,t,i){var a;e.stopPropagation(),e.preventDefault(),m.debug("[MSDStudio] Channel resize start:",t,i);const r=(((a=this._workingConfig.msd)==null?void 0:a.channels)||{})[t];if(!r||!r.bounds){m.warn("[MSDStudio] Channel not found or has no bounds:",t);return}const s=this._getPreviewCoordinatesFromMouseEvent(e);if(!s){m.warn("[MSDStudio] Could not get coordinates for channel resize start");return}this._channelResizeState={active:true,channelId:t,handle:i,startPos:[s.x,s.y],startBounds:[...r.bounds]},this._boundChannelResizeMouseMove&&document.removeEventListener("mousemove",this._boundChannelResizeMouseMove),this._boundChannelResizeMouseUp&&document.removeEventListener("mouseup",this._boundChannelResizeMouseUp),this._boundChannelResizeMouseMove=this._handleChannelResize.bind(this),this._boundChannelResizeMouseUp=this._handleChannelResizeMouseUp.bind(this),document.addEventListener("mousemove",this._boundChannelResizeMouseMove),document.addEventListener("mouseup",this._boundChannelResizeMouseUp),this.requestUpdate()}_handleChannelResize(e){var w;if(!this._channelResizeState.active)return;const t=this._getPreviewCoordinatesFromMouseEvent(e);if(!t)return;const i=t.x-this._channelResizeState.startPos[0],o=t.y-this._channelResizeState.startPos[1],s=(((w=this._workingConfig.msd)==null?void 0:w.channels)||{})[this._channelResizeState.channelId];if(!s)return;const[a,l,d,c]=this._channelResizeState.startBounds,u=this._channelResizeState.handle;let p=a,g=l,_=d,f=c;switch(u){case"tl":_=d-i,f=c-o,p=a+i,g=l+o;break;case"t":f=c-o,g=l+o;break;case"tr":_=d+i,f=c-o,g=l+o;break;case"r":_=d+i;break;case"br":_=d+i,f=c+o;break;case"b":f=c+o;break;case"bl":_=d-i,f=c+o,p=a+i;break;case"l":_=d-i,p=a+i;break}const b=50;_<b&&(_=b,u.includes("l")&&(p=a+d-b)),f<b&&(f=b,u.includes("t")&&(g=l+c-b)),this._enableSnapping&&this._gridSpacing&&(_=Math.round(_/this._gridSpacing)*this._gridSpacing,f=Math.round(f/this._gridSpacing)*this._gridSpacing,p=Math.round(p/this._gridSpacing)*this._gridSpacing,g=Math.round(g/this._gridSpacing)*this._gridSpacing),s.bounds=[this._roundToPrecision(p),this._roundToPrecision(g),this._roundToPrecision(_),this._roundToPrecision(f)],this.requestUpdate()}_handleChannelResizeMouseUp(e){this._channelResizeState.active&&(m.debug("[MSDStudio] Channel resize end:",this._channelResizeState.channelId),this._channelResizeState={active:false,channelId:null,handle:null,startPos:null,startBounds:null},this._boundChannelResizeMouseMove&&(document.removeEventListener("mousemove",this._boundChannelResizeMouseMove),this._boundChannelResizeMouseMove=null),this._boundChannelResizeMouseUp&&(document.removeEventListener("mouseup",this._boundChannelResizeMouseUp),this._boundChannelResizeMouseUp=null),this._schedulePreviewUpdate(),this.requestUpdate())}_handleChannelDoubleClick(e,t){var r;e.stopPropagation(),e.preventDefault(),m.debug("[MSDStudio] Channel double-click:",t);const o=(((r=this._workingConfig.msd)==null?void 0:r.channels)||{})[t];if(!o){m.warn("[MSDStudio] Channel not found:",t);return}this._editChannel(t,o)}_resolveControlPosition(e){return go(e,this._workingConfig,this._root)}_resolvePositionWithSide(e,t){return va(e,t,this._workingConfig,this._root)}_getAttachmentTargetAt(e){var u,p;const[t,i]=e,o=30;m.trace("[MSDStudio] Checking snap at:",t,i);const s=(((u=this._workingConfig.msd)==null?void 0:u.overlays)||[]).filter(g=>g.type==="control");for(const g of s){const _=this._resolveControlPosition(g);if(!_)continue;const[f,b]=_,w=g.size||[100,100],[S,C]=w,D={center:[f+S/2,b+C/2],top:[f+S/2,b],bottom:[f+S/2,b+C],left:[f,b+C/2],right:[f+S,b+C/2],"top-left":[f,b],"top-right":[f+S,b],"bottom-left":[f,b+C],"bottom-right":[f+S,b+C]};for(const[M,[k,F]]of Object.entries(D)){const L=Math.sqrt(Math.pow(t-k,2)+Math.pow(i-F,2));if(L<o)return m.trace("[MSDStudio] Snap found on control:",g.id,"side:",M,"dist:",L),{type:"control",id:g.id,side:M==="center"?null:M}}}const a=this._getShapeOverlays();for(const g of a){if(g.kind==="polyline"){if(!Array.isArray(g.points))continue;for(let C=0;C<g.points.length;C++){const D=g.points[C];if(!Array.isArray(D)||D.length<2)continue;const[M,k]=D,F=Math.sqrt(Math.pow(t-M,2)+Math.pow(i-k,2));if(F<o)return m.trace("[MSDStudio] Snap found on shape vertex:",g.id,"vertex:",C,"dist:",F),{type:"shape",id:g.id,side:`vertex${C}`}}continue}if(!Array.isArray(g.position)||!Array.isArray(g.size))continue;const[_,f]=g.position,[b,w]=g.size,S={center:[_+b/2,f+w/2],top:[_+b/2,f],bottom:[_+b/2,f+w],left:[_,f+w/2],right:[_+b,f+w/2],"top-left":[_,f],"top-right":[_+b,f],"bottom-left":[_,f+w],"bottom-right":[_+b,f+w]};for(const[C,[D,M]]of Object.entries(S)){const k=Math.sqrt(Math.pow(t-D,2)+Math.pow(i-M,2));if(k<o)return m.trace("[MSDStudio] Snap found on shape:",g.id,"side:",C,"dist:",k),{type:"shape",id:g.id,side:C==="center"?null:C}}}const l=((p=this._workingConfig.msd)==null?void 0:p.anchors)||{},d=this._getBaseSvgAnchors(),c={...l,...d};if(!c||typeof c!="object"||Array.isArray(c))return m.warn("[MSDStudio] Invalid anchors data:",c),null;for(const[g,_]of Object.entries(c)){if(!Array.isArray(_)||_.length<2){m.trace("[MSDStudio] Invalid anchor position for",g,":",_);continue}const[f,b]=_;if(Math.sqrt(Math.pow(t-f,2)+Math.pow(i-b,2))<o)return{type:"anchor",id:g,side:null}}return null}_handleLineEndpointDragStart(e,t,i){var c;if(e.stopPropagation(),e.preventDefault(),this._activeMode===R.ADD_WAYPOINT){m.debug("[MSDStudio] Endpoint dragging disabled in waypoint mode");return}m.debug("[MSDStudio] Line endpoint drag start:",t,i);const r=(((c=this._workingConfig.msd)==null?void 0:c.overlays)||[]).find(u=>u.id===t&&u.type==="line");if(!r){m.warn("[MSDStudio] Line not found:",t);return}const s=this._getPreviewCoordinatesFromMouseEvent(e);if(!s){m.warn("[MSDStudio] Could not get coordinates");return}let a=null;if(i==="start")a=r.anchor;else if(i==="end"){const u=r.attach_to;Array.isArray(u)?a=u[u.length-1]:a=u}this._lineEndpointDragState={active:true,lineId:t,endpoint:i,startPos:[s.x,s.y],currentPos:[s.x,s.y],originalTarget:a,originalShowAttachmentPoints:this._showAttachmentPoints},this._showAttachmentPoints=true;const l=h(u=>this._handleLineEndpointDrag(u),"handleMouseMove"),d=h(()=>{this._finishLineEndpointDrag(),document.removeEventListener("mousemove",l),document.removeEventListener("mouseup",d);const u=this._lineEndpointDragState.originalShowAttachmentPoints;this._lineEndpointDragState={active:false,lineId:null,endpoint:null,startPos:null,originalTarget:null},this._showAttachmentPoints=u,this.requestUpdate()},"handleMouseUp");document.addEventListener("mousemove",l),document.addEventListener("mouseup",d),m.trace("[MSDStudio] Line endpoint drag listeners added"),this.requestUpdate()}_handleLineEndpointDrag(e){if(!this._lineEndpointDragState.active)return;const t=this._getPreviewCoordinatesFromMouseEvent(e);t&&(this._lineEndpointDragState.currentPos=[t.x,t.y],this.requestUpdate())}_finishLineEndpointDrag(){var d;if(!this._lineEndpointDragState.active||!this._lineEndpointDragState.currentPos)return;const{lineId:e,endpoint:t,currentPos:i,originalTarget:o}=this._lineEndpointDragState,r=this._getAttachmentTargetAt(i);if(!r){m.debug("[MSDStudio] No valid target found - canceling drag");return}const a=(((d=this._workingConfig.msd)==null?void 0:d.overlays)||[]).find(c=>c.id===e&&c.type==="line");if(!a)return;t==="start"?(a.anchor=r.id,(r.type==="control"||r.type==="shape")&&r.side?a.anchor_side=r.side:delete a.anchor_side,m.debug("[MSDStudio] Updated line start to:",r.id,"side:",r.side)):t==="end"&&(typeof a.attach_to=="string"||!a.attach_to?a.attach_to=r.id:Array.isArray(a.attach_to)&&(a.attach_to.length===0?a.attach_to.push(r.id):a.attach_to[a.attach_to.length-1]=r.id),(r.type==="control"||r.type==="shape")&&r.side?a.attach_side=r.side:delete a.attach_side,m.debug("[MSDStudio] Updated line end to:",r.id,"side:",r.side)),this._schedulePreviewUpdate(),this._showRoutingPaths?(this._showRoutingPaths=false,this.requestUpdate(),setTimeout(()=>{this._showRoutingPaths=true,this.requestUpdate()},50)):this.requestUpdate()}_handleControlDoubleClick(e,t){e.stopPropagation(),e.preventDefault(),m.debug("[MSDStudio] Control double-click:",t);const i=this._findControl(t);if(!i){m.warn("[MSDStudio] Control not found:",t);return}this._editControl(i)}_findControl(e){var i;return(((i=this._workingConfig.msd)==null?void 0:i.overlays)||[]).find(o=>o.id===e)||null}_getPreviewCoordinatesFromMouseEvent(e){const t=this._getZoomTransform();return ma(e,this._root,this._workingConfig,t)}_getPreviewCoordinates(e){const t=this._getPreviewSvgAndViewBox();if(!t)return m.warn("[MSDStudio] No preview SVG found for coordinate conversion"),null;const{svg:i,viewBoxX:o,viewBoxY:r,viewBoxWidth:s,viewBoxHeight:a}=t,l=i.getBoundingClientRect(),d=e.clientX-l.left,c=e.clientY-l.top,u=s/l.width,p=a/l.height,g=Math.max(u,p),_=s/g,f=a/g,b=(l.width-_)/2,w=(l.height-f)/2;let S=o+(d-b)*g,C=r+(c-w)*g;const D=this._enableSnapping||this._snapToGrid;if(D){const M=this._gridSpacing||50;S=Math.round(S/M)*M,C=Math.round(C/M)*M}return m.trace("[MSDStudio] Converted coordinates:",{screen:{x:d,y:c},viewBox:{x:S,y:C},scale:g,rect:{width:l.width,height:l.height}}),D?{x:S,y:C}:{x:this._roundToPrecision(S),y:this._roundToPrecision(C)}}_getPreviewCoordinatesWithPixels(e){const t=e.currentTarget,i=this._getPreviewSvgAndViewBox();if(!i)return null;const{svg:o,viewBoxX:r,viewBoxY:s,viewBoxWidth:a,viewBoxHeight:l}=i,d=o.getBoundingClientRect(),c=t.getBoundingClientRect(),u=e.clientX-d.left,p=e.clientY-d.top,g=a/d.width,_=l/d.height,f=Math.max(g,_),b=a/f,w=l/f,S=(d.width-b)/2,C=(d.height-w)/2,D=u-S,M=p-C;let k=r+D*f,F=s+M*f,L=e.clientX-c.left,q=e.clientY-c.top;const z=this._getDebugSettings();if(this._enableSnapping||this._snapToGrid){const T=z.grid_spacing||50;k=Math.round(k/T)*T,F=Math.round(F/T)*T;const N=(k-r)/f+S,y=(F-s)/f+C;L=d.left-c.left+N,q=d.top-c.top+y}return{x:Math.round(k),y:Math.round(F),pixelX:L,pixelY:q,panelWidth:c.width,panelHeight:c.height}}_handleDrawChannelClick(e){const t=this._getPreviewCoordinates(e);if(!t){m.warn("[MSDStudio] Could not get preview coordinates");return}this._drawChannelState.startPoint?this._finishDrawChannel(this._drawChannelState.startPoint,[t.x,t.y]):(this._drawChannelState.startPoint=[t.x,t.y],this._drawChannelState.drawing=true,this._channelDrawDragCandidate=null,m.trace("[MSDStudio] Draw channel started at:",t))}_finishDrawChannel(e,t){const[i,o]=e,[r,s]=t,a=Math.min(i,r),l=Math.min(o,s),d=Math.abs(r-i),c=Math.abs(s-o);m.trace("[MSDStudio] Draw channel finished:",{x:a,y:l,width:d,height:c}),this._drawChannelState.startPoint=null,this._drawChannelState.drawing=false,this._channelDrawDragCandidate=null;const u={x:a,y:l,width:d,height:c},p=this._findLinesIntersectingChannel(u);this._editingChannelId="",this._channelFormData={id:this._generateChannelId(),mode:"prefer",direction:"auto",bounds:[a,l,d,c],weight:.5,line_spacing:8,discoverable:true,suggestedLines:p.length>0?p.map(g=>g.id):null},this._activeMode=R.VIEW,this.requestUpdate()}_handleDrawShapeClick(e){const t=this._getPreviewCoordinates(e);if(!t){m.warn("[MSDStudio] Could not get preview coordinates");return}const i=this._drawShapeState.kind;if(i==="polyline"){this._drawShapeState.points=[...this._drawShapeState.points,[t.x,t.y]],this._drawShapeState.drawing=true,m.trace("[MSDStudio] Added polyline point:",t,"total:",this._drawShapeState.points.length),this.requestUpdate();return}if(!this._drawShapeState.points.length){this._drawShapeState.points=[[t.x,t.y]],this._drawShapeState.drawing=true,this._shapeDrawDragCandidate=null,m.trace("[MSDStudio] Draw shape started at:",t),this.requestUpdate();return}this._finishDrawShapeRect(i,this._drawShapeState.points[0],[t.x,t.y])}_finishDrawShapeRect(e,t,i){const[o,r]=t,[s,a]=i,l=Math.min(o,s),d=Math.min(r,a),c=Math.abs(s-o),u=Math.abs(a-r);if(this._drawShapeState={kind:null,points:[],drawing:false,currentPoint:null},this._shapeDrawDragCandidate=null,this._activeMode=R.VIEW,c<1||u<1){m.warn("[MSDStudio] Shape too small, ignoring"),this.requestUpdate();return}this._openShapeForm(e,{position:[l,d],size:[c,u]})}_finishDrawShapePolyline(){let e=this._drawShapeState.points;if(e.length>=2){const[t,i]=e[e.length-2],[o,r]=e[e.length-1];Math.abs(t-o)<=2&&Math.abs(i-r)<=2&&(e=e.slice(0,-1))}if(e.length<2){m.warn("[MSDStudio] Polyline needs at least 2 points to finish");return}this._drawShapeState={kind:null,points:[],drawing:false,currentPoint:null},this._activeMode=R.VIEW,this._openShapeForm("polyline",{points:e})}_injectLineHighlightStyles(){var a;const e=(a=this.shadowRoot)==null?void 0:a.querySelector("lcards-msd-live-preview");if(!e)return;const t=e.shadowRoot;if(!t)return;const i=t.querySelector(".preview-card-container");if(!i)return;const o=i.querySelector("lcards-msd-card");if(!o)return;const r=o.shadowRoot||o.renderRoot;if(!r)return;const s=document.createElement("style");s.id="msd-studio-highlight-styles",s.textContent=`
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
        `,r.appendChild(s),m.debug("[MSDStudioDialog] Injected line highlight styles (hover only)"),m.debug("[MSDStudioDialog] Injected line highlight styles")}_selectLine(e){var t,i;if(m.debug(`[MSDStudioDialog] Selecting line: ${e}`),this._selectedLineId&&((t=this._workingConfig.msd)!=null&&t.overlays)){const o=this._workingConfig.msd.overlays.find(r=>r.id===this._selectedLineId);o&&delete o._editorSelected}if(this._selectedLineId=e,this._showWaypointMarkers=true,(i=this._workingConfig.msd)!=null&&i.overlays){const o=this._workingConfig.msd.overlays.find(r=>r.id===e);o&&(o._editorSelected=true)}m.debug(`[MSDStudio] Selected line: ${e} (waypoint markers enabled, static indicator added)`),this.requestUpdate()}_addNamedWaypoint(e){var r,s;if(!this._selectedLineId)return;const t=((r=this._workingConfig.msd)==null?void 0:r.overlays)||[],i=t.findIndex(a=>a.id===this._selectedLineId&&a.type==="line");if(i===-1){m.warn(`[MSDStudio] Cannot find line overlay: ${this._selectedLineId}`);return}const o=t[i];o.route!=="manual"&&(m.debug(`[MSDStudio] Auto-converting line ${o.id} to manual mode`),o.route="manual",o.waypoints=[]),o.waypoints||(o.waypoints=[]),o.waypoints.push(e),((s=this._lineFormData)==null?void 0:s.id)===o.id&&(this._lineFormData.route="manual",this._lineFormData.waypoints=[...o.waypoints]),m.debug(`[MSDStudio] Added named waypoint "${e}" to line ${o.id} (total: ${o.waypoints.length})`),this.requestUpdate()}_exitWaypointMode(){var e;if(m.debug("[MSDStudioDialog] Exiting waypoint mode"),this._selectedLineId&&((e=this._workingConfig.msd)!=null&&e.overlays)){const t=this._workingConfig.msd.overlays.find(i=>i.id===this._selectedLineId);t&&delete t._editorSelected}this._selectedLineId=null,this._showWaypointMarkers=false,this._activeMode=R.VIEW,this.requestUpdate()}_handleAddWaypointClick(e){if(!this._selectedLineId){m.warn("[MSDStudio] No line selected - click a line first");return}if(this._waypointDragInProgress||this._cornerRadiusDragInProgress){m.debug("[MSDStudio] Click ignored - waypoint/corner-radius drag in progress");return}this._clickTimeout&&(clearTimeout(this._clickTimeout??void 0),this._clickTimeout=null);const t=this._getPreviewCoordinates(e);if(!t){m.warn("[MSDStudio] Could not get preview coordinates");return}this._clickTimeout=setTimeout(()=>{this._addWaypointAtPosition(t.x,t.y),this._clickTimeout=null},250)}_addWaypointAtPosition(e,t){var l,d;const i=((l=this._workingConfig.msd)==null?void 0:l.overlays)||[],o=i.findIndex(c=>c.id===this._selectedLineId);if(o===-1){m.warn("[MSDStudio] Selected line not found");return}const r=i[o];r.route!=="manual"&&(m.debug(`[MSDStudio] Auto-converting line ${r.id} to manual mode`),r.route="manual",r.waypoints=[]),r.waypoints||(r.waypoints=[]);const s=Math.round(e),a=Math.round(t);r.waypoints.push([s,a]),((d=this._lineFormData)==null?void 0:d.id)===r.id&&(this._lineFormData.route="manual",this._lineFormData.waypoints=[...r.waypoints]),m.debug(`[MSDStudio] Added waypoint to ${r.id} at [${s}, ${a}] (total: ${r.waypoints.length})`),this._schedulePreviewUpdate(),this.requestUpdate()}_renderCrosshairGuidelines(){const e=this._showCrosshairs||this._activeMode===R.PLACE_ANCHOR||this._activeMode===R.PLACE_CONTROL;if(!this._cursorPosition||!e)return"";let{x:t,y:i,pixelX:o,pixelY:r,panelWidth:s,panelHeight:a}=this._cursorPosition;const l=this._enableSnapping||this._snapToGrid;let d=t,c=i,u=o,p=r;if(l){const M=this._gridSpacing||50;d=Math.round(t/M)*M,c=Math.round(i/M)*M}const g=l?"rgba(0, 255, 0, 0.5)":"rgba(255, 153, 0, 0.5)",_=15,f=130,b=30,w=u+_+f>s;let S=null,C=null;w?C=Math.max(4,s-u+_):S=Math.max(4,Math.min(u+_,s-4));let D=p-30;return D<0&&(D=p+20),D=Math.max(4,Math.min(D,a-b-4)),v`
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
                    left: ${u}px;
                    top: 0;
                    width: 2px;
                    height: 100%;
                    background: ${g};
                    box-shadow: 0 0 4px ${g};
                "></div>

                <!-- X coordinate label on vertical line -->
                <div style="
                    position: absolute;
                    left: ${u}px;
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
                    box-shadow: var(--ha-box-shadow-s);
                ">
                    X: ${d}
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
                    box-shadow: var(--ha-box-shadow-s);
                ">
                    Y: ${c}
                </div>

                <!-- Floating coordinate tooltip near cursor -->
                <div style="
                    position: absolute;
                    ${S!==null?`left: ${S}px;`:`right: ${C}px;`}
                    top: ${D}px;
                    background: rgba(0, 0, 0, 0.85);
                    color: ${l?"#00FF00":"#FF9900"};
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 11px;
                    font-weight: 600;
                    white-space: nowrap;
                    box-shadow: var(--ha-box-shadow-s);
                    pointer-events: none;
                ">
                    ${d}, ${c}${l?" ⊞":""}
                </div>
            </div>
        `}get _root(){return this.shadowRoot}_getPreviewSvgAndViewBox(){var p,g;const e=(p=this.shadowRoot)==null?void 0:p.querySelector("lcards-msd-live-preview");if(!e)return null;const t=e.shadowRoot;if(!t)return null;const i=t.querySelector(".preview-card-container");if(!i)return null;const o=i.querySelector("lcards-msd-card");if(!o)return null;const r=o.shadowRoot||o.renderRoot;if(!r)return null;const s=r.querySelector("svg");if(!s)return null;const a=(g=this._workingConfig.msd)==null?void 0:g.view_box;let l=0,d=0,c=1920,u=1200;if(Array.isArray(a)&&a.length===4)[l,d,c,u]=a;else{const _=s.viewBox.baseVal;_&&_.width>0&&_.height>0&&({x:l,y:d,width:c,height:u}=_)}return{msdCard:o,svg:s,viewBoxX:l,viewBoxY:d,viewBoxWidth:c,viewBoxHeight:u}}_handlePreviewReady(e=30){if(this.requestUpdate(),this._getPreviewSvgAndViewBox()){this._previewReadyRafHandle=null;return}if(e<=0){this._previewReadyRafHandle=null;return}this._previewReadyRafHandle=requestAnimationFrame(()=>this._handlePreviewReady(e-1))}_renderAnchorHighlight(){var q,z;if(!this._highlightedAnchor)return"";let t=(((q=this._workingConfig.msd)==null?void 0:q.anchors)||{})[this._highlightedAnchor];if(t||(t=this._getBaseSvgAnchors()[this._highlightedAnchor]),!t||!Array.isArray(t))return"";const[i,o]=t,r=this._getPreviewSvgAndViewBox();if(!r)return"";const{svg:s,viewBoxX:a,viewBoxY:l,viewBoxWidth:d,viewBoxHeight:c}=r,u=s.getBoundingClientRect(),p=(z=this.shadowRoot)==null?void 0:z.querySelector(".preview-panel");if(!p)return"";const g=p.getBoundingClientRect(),_=d/u.width,f=c/u.height,b=Math.max(_,f),w=d/b,S=c/b,C=(u.width-w)/2,D=(u.height-S)/2,M=(i-a)/b+C,k=(o-l)/b+D,F=u.left-g.left+M,L=u.top-g.top+k;return v`
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
                    left: ${F}px;
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
                    left: ${F}px;
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
                    left: ${F}px;
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
                    box-shadow: var(--ha-box-shadow-m);
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
        `}_renderControlHighlight(){var E,B,I,O;if(!this._highlightedControl)return"";const t=(((E=this._workingConfig.msd)==null?void 0:E.overlays)||[]).find(V=>V.id===this._highlightedControl);if(!t)return"";const i=this._getPreviewSvgAndViewBox();if(!i)return"";const{msdCard:o,svg:r,viewBoxX:s,viewBoxY:a,viewBoxWidth:l,viewBoxHeight:d}=i,c=((I=(B=o._msdPipeline)==null?void 0:B.getResolvedModel())==null?void 0:I.anchors)||{},u=this._resolveEditorControlPosition(t,c);if(!u)return m.warn(`⚠️ [MSD Studio] Could not resolve position for control '${t.id}'`),"";const p=t.size||[100,100];if(!Array.isArray(p))return"";let[g,_]=u;const[f,b]=p,w=t.attachment||"center",S=this._getAttachmentOffset(w,f,b);g+=S[0],_+=S[1];const C=r.getBoundingClientRect(),D=(O=this.shadowRoot)==null?void 0:O.querySelector(".preview-panel");if(!D)return"";const M=D.getBoundingClientRect(),k=l/C.width,F=d/C.height,L=Math.max(k,F),q=l/L,z=d/L,U=(C.width-q)/2,T=(C.height-z)/2,N=(g-s)/L+U,y=(_-a)/L+T,x=f/L,$=b/L,A=C.left-M.left+N,P=C.top-M.top+y;return v`
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
                    top: ${P}px;
                    width: ${x}px;
                    height: ${$}px;
                    border: 3px solid #FF0099;
                    box-shadow: 0 0 20px rgba(255, 0, 153, 0.8);
                    animation: control-pulse 1s ease-in-out infinite;
                "></div>

                <!-- Control ID label -->
                <div style="
                    position: absolute;
                    left: ${A+x/2}px;
                    top: ${P-10}px;
                    transform: translate(-50%, -100%);
                    background: rgba(255, 0, 153, 0.95);
                    color: white;
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    font-weight: 700;
                    white-space: nowrap;
                    box-shadow: var(--ha-box-shadow-m);
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
        `}_renderLineHighlight(){var $,A,P,E,B;if(!this._highlightedLine)return"";const i=((($=this._workingConfig.msd)==null?void 0:$.overlays)||[]).filter(I=>I.type==="line").find(I=>I.id===this._highlightedLine);if(!i||!i.anchor||!i.attach_to)return"";const o={...((A=this._workingConfig.msd)==null?void 0:A.anchors)||{}},r=this._getBaseSvgAnchors();Object.assign(o,r);let s=o[i.anchor];if(!s){const O=(((P=this._workingConfig.msd)==null?void 0:P.overlays)||[]).find(V=>V.id===i.anchor);O&&(s=this._resolveEditorControlPosition(O,o))}let a=o[i.attach_to];if(!a){const O=(((E=this._workingConfig.msd)==null?void 0:E.overlays)||[]).find(V=>V.id===i.attach_to);O&&(a=this._resolveEditorControlPosition(O,o))}if(!s||!a)return"";const[l,d]=s,[c,u]=a,p=this._getPreviewSvgAndViewBox();if(!p)return"";const{svg:g,viewBoxX:_,viewBoxY:f,viewBoxWidth:b,viewBoxHeight:w}=p,S=g.getBoundingClientRect(),C=(B=this.shadowRoot)==null?void 0:B.querySelector(".preview-panel");if(!C)return"";const D=C.getBoundingClientRect(),M=b/S.width,k=w/S.height,F=Math.max(M,k),L=b/F,q=w/F,z=(S.width-L)/2,U=(S.height-q)/2,T=(l-_)/F+z+(S.left-D.left),N=(d-f)/F+U+(S.top-D.top),y=(c-_)/F+z+(S.left-D.left),x=(u-f)/F+U+(S.top-D.top);return v`
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
                        x1="${T}"
                        y1="${N}"
                        x2="${y}"
                        y2="${x}"
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
                        cx="${T}"
                        cy="${N}"
                        r="6"
                        fill="#00FFFF"
                        stroke="white"
                        stroke-width="2"
                    />

                    <!-- End point marker -->
                    <circle
                        cx="${y}"
                        cy="${x}"
                        r="6"
                        fill="#00FFFF"
                        stroke="white"
                        stroke-width="2"
                    />
                </svg>

                <!-- Line ID label at midpoint -->
                <div style="
                    position: absolute;
                    left: ${(T+y)/2}px;
                    top: ${(N+x)/2-10}px;
                    transform: translate(-50%, -100%);
                    background: rgba(0, 255, 255, 0.95);
                    color: black;
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    font-weight: 700;
                    white-space: nowrap;
                    box-shadow: var(--ha-box-shadow-m);
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
        `}_renderGridOverlay(){var y;if(!this._showGrid)return"";m.trace("[MSDStudio] _renderGridOverlay called, _showGrid:",this._showGrid);const e=this._getPreviewSvgAndViewBox();if(!e)return m.trace("[MSDStudio] Could not find preview SVG for grid overlay"),"";const{svg:t,viewBoxX:i,viewBoxY:o,viewBoxWidth:r,viewBoxHeight:s}=e,a=this._debugSettings.grid_color||"#cccccc",l=this._gridSpacing||50,d=[],c=i+r;for(let x=Math.ceil(i/l)*l;x<=c;x+=l)d.push(x);const u=[],p=o+s;for(let x=Math.ceil(o/l)*l;x<=p;x+=l)u.push(x);m.trace("[MSDStudio] Found SVG, calculating grid..."),m.trace("[MSDStudio] Grid lines:",{verticalLines:d.length,horizontalLines:u.length}),m.trace("[MSDStudio] ViewBox:",{viewBoxX:i,viewBoxY:o,viewBoxWidth:r,viewBoxHeight:s});const g=t.getBoundingClientRect(),_=(y=this.shadowRoot)==null?void 0:y.querySelector(".preview-panel");if(!_)return"";const f=_.getBoundingClientRect(),b=r/g.width,w=s/g.height,S=Math.max(b,w),C=r/S,D=s/S,M=(g.width-C)/2,k=(g.height-D)/2,F=g.left-f.left+M,L=g.top-f.top+k,q=C,z=D,U=this._debugSettings.grid_opacity??.3,T=Math.min(U+.2,1),N=`
            background: rgba(0, 0, 0, 0.7);
            color: ${a};
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 10px;
            white-space: nowrap;
            opacity: ${T};
            pointer-events: none;
        `;return v`
            <div style="
                position: absolute;
                left: ${F}px;
                top: ${L}px;
                width: ${q}px;
                height: ${z}px;
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
                    opacity: ${T};
                "></div>

                <!-- View box dimension labels -->
                <div style="position: absolute; left: 4px; top: 4px; ${N}">
                    (${Math.round(i)}, ${Math.round(o)})
                </div>
                <div style="position: absolute; right: 4px; bottom: 4px; ${N}">
                    (${Math.round(i+r)}, ${Math.round(o+s)})
                </div>
                <div style="position: absolute; left: 50%; top: -18px; transform: translateX(-50%); ${N}">
                    ${Math.round(r)} × ${Math.round(s)}
                </div>

                <!-- Grid Lines -->
                ${d.map(x=>{const $=(x-i)/S;return v`
                        <div style="
                            position: absolute;
                            left: ${$}px;
                            top: 0;
                            width: 1px;
                            height: 100%;
                            background: ${a};
                            opacity: ${U};
                        "></div>
                    `})}
                ${u.map(x=>{const $=(x-o)/S;return v`
                        <div style="
                            position: absolute;
                            left: 0;
                            top: ${$}px;
                            width: 100%;
                            height: 1px;
                            background: ${a};
                            opacity: ${U};
                        "></div>
                    `})}
            </div>
        `}_renderRoutingGridOverlay(){var U,T,N;if(!this._showRoutingGrid)return"";const e=this._getPreviewSvgAndViewBox();if(!e)return"";const{svg:t,viewBoxX:i,viewBoxY:o,viewBoxWidth:r,viewBoxHeight:s,msdCard:a}=e,l=(T=(U=a._msdPipeline)==null?void 0:U.coordinator)==null?void 0:T.router;if(!l||typeof l.resolvedGridResolution!="function")return"";const d=l.resolvedGridResolution();if(!(d>0))return"";const c="#ffaa00",u=[],p=i+r;for(let y=Math.ceil(i/d)*d;y<=p;y+=d)u.push(y);const g=[],_=o+s;for(let y=Math.ceil(o/d)*d;y<=_;y+=d)g.push(y);const f=t.getBoundingClientRect(),b=(N=this.shadowRoot)==null?void 0:N.querySelector(".preview-panel");if(!b)return"";const w=b.getBoundingClientRect(),S=r/f.width,C=s/f.height,D=Math.max(S,C),M=r/D,k=s/D,F=(f.width-M)/2,L=(f.height-k)/2,q=f.left-w.left+F,z=f.top-w.top+L;return v`
            <div style="
                position: absolute;
                left: ${q}px;
                top: ${z}px;
                width: ${M}px;
                height: ${k}px;
                pointer-events: none;
                z-index: 995;
            ">
                <div style="
                    position: absolute;
                    left: 4px;
                    top: 4px;
                    background: rgba(0, 0, 0, 0.7);
                    color: ${c};
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-family: 'Courier New', monospace;
                    font-size: 10px;
                    white-space: nowrap;
                    opacity: 0.9;
                ">routing grid: ${d%1===0?d:d.toFixed(2)}vb</div>
                ${u.map(y=>v`
                    <div style="
                        position: absolute;
                        left: ${(y-i)/D}px;
                        top: 0;
                        width: 1px;
                        height: 100%;
                        background: ${c};
                        opacity: 0.25;
                    "></div>
                `)}
                ${g.map(y=>v`
                    <div style="
                        position: absolute;
                        left: 0;
                        top: ${(y-o)/D}px;
                        width: 100%;
                        height: 1px;
                        background: ${c};
                        opacity: 0.25;
                    "></div>
                `)}
            </div>
        `}_renderTrunksOverlay(){var F,L,q;if(!this._showTrunks)return"";const e=this._getPreviewSvgAndViewBox();if(!e)return"";const{svg:t,viewBoxX:i,viewBoxY:o,viewBoxWidth:r,viewBoxHeight:s,msdCard:a}=e,l=(L=(F=a._msdPipeline)==null?void 0:F.coordinator)==null?void 0:L.router;if(!l||typeof l.trunks!="function")return"";const d=l.trunks().filter(z=>z.origin==="discovered"&&z.members.length>0);if(!d.length)return"";const c=t.getBoundingClientRect(),u=(q=this.shadowRoot)==null?void 0:q.querySelector(".preview-panel");if(!u)return"";const p=u.getBoundingClientRect(),g=r/c.width,_=s/c.height,f=Math.max(g,_),b=r/f,w=s/f,S=(c.width-b)/2,C=(c.height-w)/2,D=c.left-p.left+S,M=c.top-p.top+C,k="#00e5ff";return v`
            <div style="
                position: absolute;
                left: ${D}px;
                top: ${M}px;
                width: ${b}px;
                height: ${w}px;
                pointer-events: none;
                z-index: 997;
            ">
                ${d.map(z=>{const U=(z.bounds.x1-i)/f,T=(z.bounds.y1-o)/f,N=(z.bounds.x2-z.bounds.x1)/f,y=(z.bounds.y2-z.bounds.y1)/f,x=z.direction==="horizontal",$=x?(z.crossCenter-o)/f-T:(z.crossCenter-i)/f-U;return v`
                        <div style="
                            position: absolute;
                            left: ${U}px;
                            top: ${T}px;
                            width: ${N}px;
                            height: ${y}px;
                            background: ${k};
                            opacity: 0.12;
                            border: 1px dashed ${k};
                            box-sizing: border-box;
                        "></div>
                        <div style="
                            position: absolute;
                            left: ${x?U:U+$}px;
                            top: ${x?T+$:T}px;
                            width: ${x?N:1}px;
                            height: ${x?1:y}px;
                            background: ${k};
                            opacity: 0.6;
                        "></div>
                        <div style="
                            position: absolute;
                            left: ${U+3}px;
                            top: ${T+2}px;
                            background: rgba(0, 0, 0, 0.7);
                            color: ${k};
                            padding: 1px 5px;
                            border-radius: 3px;
                            font-family: 'Courier New', monospace;
                            font-size: 9px;
                            white-space: nowrap;
                        ">${z.id} · ${z.members.length} line${z.members.length===1?"":"s"}</div>
                    `})}
            </div>
        `}_renderAnchorMarkers(){var D,M;if(!this._showAnchorMarkers)return"";const e=((D=this._workingConfig.msd)==null?void 0:D.anchors)||{},t=this._getBaseSvgAnchors(),i={...e,...t};if(Object.keys(i).length===0)return"";const o=this._getPreviewSvgAndViewBox();if(!o)return"";const{svg:r,viewBoxX:s,viewBoxY:a,viewBoxWidth:l,viewBoxHeight:d}=o,c=r.getBoundingClientRect(),u=(M=this.shadowRoot)==null?void 0:M.querySelector(".preview-panel");if(!u)return"";const p=u.getBoundingClientRect(),g=l/c.width,_=d/c.height,f=Math.max(g,_),b=l/f,w=d/f,S=(c.width-b)/2,C=(c.height-w)/2;return v`
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 997;
            ">
                ${Object.entries(i).map(([k,F],L)=>{if(!Array.isArray(F))return"";const[q,z]=F,U=(q-s)/f+S,T=(z-a)/f+C,N=c.left-p.left+U,y=c.top-p.top+T;L===0&&m.debug("[MSDStudio][ANCHOR] First anchor position:",{name:k,viewBox:{x:q,y:z},svgPixel:{x:U,y:T},finalPixel:{x:N,y},calculation:`(${q} - ${s}) / ${f} + ${S} = ${U}`});const x=!e[k],$=x?"#888888":"#FFFF00",A=this._anchorDragState.active&&this._anchorDragState.anchorName===k,P=this._activeMode===R.ADD_WAYPOINT;return v`
                        <!-- Anchor marker -->
                        <div
                            class="${x?"":"interactive-anchor"} ${A?"anchor-dragging":""} anchor-marker"
                            data-anchor-name="${k}"
                            data-is-base-svg="${x}"
                            style="
                                position: absolute;
                                left: ${N}px;
                                top: ${y}px;
                                transform: translate(-50%, -50%);
                                width: ${P?"16px":"12px"};
                                height: ${P?"16px":"12px"};
                                background: ${$};
                                border: 2px solid ${P?"#00FFFF":"white"};
                                border-radius: 50%;
                                box-shadow: 0 0 ${P?"8px":"4px"} rgba(0, 0, 0, 0.5);
                                pointer-events: ${!x||P?"auto":"none"};
                                cursor: ${P?"pointer":"default"};
                                transition: all 0.2s ease;
                                z-index: ${P?"1001":"997"};
                            "
                            @mousedown=${!x&&this._activeMode!==R.ADD_WAYPOINT?E=>this._handleAnchorDragStart(E,k):null}
                            @dblclick=${!x&&this._activeMode!==R.ADD_WAYPOINT?E=>this._handleAnchorDoubleClick(E,k):null}>
                        </div>
                        <!-- Anchor label -->
                        <div style="
                            position: absolute;
                            left: ${N}px;
                            top: ${y+8}px;
                            transform: translateX(-50%);
                            background: rgba(0, 0, 0, 0.7);
                            color: ${$};
                            padding: 2px 6px;
                            border-radius: 3px;
                            font-family: 'Courier New', monospace;
                            font-size: 10px;
                            white-space: nowrap;
                        ">
                            ${k}
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
        `}_renderControlBboxItem(e,t){const{rect:i,panelRect:o,scale:r,offsetX:s,offsetY:a,viewBoxX:l,viewBoxY:d,anchors:c}=t;if(!e.position&&!e.anchor)return m.warn("[MSDStudio] Control has no valid position:",e.id),"";const u=this._resolveEditorControlPosition(e,c);if(!u)return m.warn("[MSDStudio] Failed to resolve position:",e.position||e.anchor,e.id),"";const p=e.size||[100,100];if(!Array.isArray(p))return"";let[g,_]=u;const[f,b]=p,w=e.attachment||"center",S=this._getAttachmentOffset(w,f,b);g+=S[0],_+=S[1];const C=(g-l)/r+s,D=(_-d)/r+a,M=f/r,k=b/r,F=i.left-o.left+C,L=i.top-o.top+D,q=this._dragState.active&&this._dragState.controlId===e.id,z=this._resizeState.active&&this._resizeState.controlId===e.id,U=e.locked===true;return v`
            <!-- Bounding box (interactive) -->
            <div
                class="interactive-bbox ${q?"bbox-dragging":""} ${z?"bbox-resizing":""} ${U?"bbox-locked":""}"
                data-control-id="${e.id}"
                style="
                    position: absolute;
                    left: ${F}px;
                    top: ${L}px;
                    width: ${M}px;
                    height: ${k}px;
                    border: ${U?"2px dashed #888888":"2px solid #0088FF"};
                    opacity: 0.6;
                    pointer-events: ${U?"none":"auto"};
                "
                @mousedown=${T=>this._handleDragStart(T,e.id)}
                @dblclick=${T=>this._handleControlDoubleClick(T,e.id)}>

                <!-- Resize Handles — omitted entirely when locked: .resize-handle sets
                     pointer-events:auto on itself, which an ancestor's pointer-events:none
                     does NOT override, so simply not rendering them is required, not just
                     cosmetic. -->
                ${U?"":this._renderResizeHandles(e.id,M,k,z)}

                <!-- Live W×H / attach-point readout while actively dragging or resizing -->
                ${this._renderLiveCoordBadge(q,z,e.position,e.size)}

                ${U?this._renderLockBadge(e):""}
            </div>
            <!-- Control ID label -->
            <div style="
                position: absolute;
                left: ${F+4}px;
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
        `}_renderShapeBboxItem(e,t){const{rect:i,panelRect:o,scale:r,offsetX:s,offsetY:a,viewBoxX:l,viewBoxY:d}=t,[c,u]=e.position,[p,g]=e.size||[100,60],_=(c-l)/r+s,f=(u-d)/r+a,b=p/r,w=g/r,S=i.left-o.left+_,C=i.top-o.top+f,D=this._shapeDragState.active&&this._shapeDragState.shapeId===e.id,M=this._shapeResizeState.active&&this._shapeResizeState.shapeId===e.id,k=e.locked===true,F=e.kind==="circle"?"50%":"0";return v`
            <div
                class="interactive-bbox ${D?"bbox-dragging":""} ${M?"bbox-resizing":""} ${k?"bbox-locked":""}"
                data-shape-id="${e.id}"
                style="
                    position: absolute;
                    left: ${S}px;
                    top: ${C}px;
                    width: ${b}px;
                    height: ${w}px;
                    border: ${k?"2px dashed #888888":"2px solid #00CC88"};
                    border-radius: ${F};
                    opacity: 0.6;
                    pointer-events: ${k?"none":"auto"};
                "
                @mousedown=${L=>this._handleShapeDragStart(L,e.id)}
                @dblclick=${L=>{L.stopPropagation(),this._editShape(e)}}>
                ${k?"":this._renderShapeResizeHandles(e.id,b,w,M)}
                ${this._renderLiveCoordBadge(D,M,e.position,e.size)}
                ${k?this._renderLockBadge(e):""}
            </div>
            <div style="
                position: absolute;
                left: ${S+4}px;
                top: ${C+4}px;
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
        `}_renderInteractiveHitLayer(){var z,U,T,N;if(!this._showBoundingBoxes)return"";const e=((z=this._workingConfig.msd)==null?void 0:z.overlays)||[],t=e.filter(y=>y.type==="control"),i=e.filter(y=>y.type==="shape"&&(y.kind==="rect"||y.kind==="circle")&&Array.isArray(y.position));if(t.length===0&&i.length===0)return"";const o=this._getPreviewSvgAndViewBox();if(!o)return"";const{msdCard:r,svg:s,viewBoxX:a,viewBoxY:l,viewBoxWidth:d,viewBoxHeight:c}=o,u=s.getBoundingClientRect(),p=(U=this.shadowRoot)==null?void 0:U.querySelector(".preview-panel");if(!p)return"";const g=p.getBoundingClientRect(),_=d/u.width,f=c/u.height,b=Math.max(_,f),w=d/b,S=c/b,C=(u.width-w)/2,D=(u.height-S)/2,M=(N=(T=r._msdPipeline)==null?void 0:T.getResolvedModel)==null?void 0:N.call(T),k=(M==null?void 0:M.anchors)||{},F={rect:u,panelRect:g,scale:b,offsetX:C,offsetY:D,viewBoxX:a,viewBoxY:l,anchors:k},L=li.buildDeclOrderMap(e),q=[...t.map(y=>({kind:"control",overlay:y})),...i.map(y=>({kind:"shape",overlay:y}))].sort((y,x)=>li.compareByZIndex(y.overlay,x.overlay,L));return v`
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
            ">
                ${q.map(({kind:y,overlay:x})=>y==="control"?this._renderControlBboxItem(x,F):this._renderShapeBboxItem(x,F))}
            </div>
        `}_renderShapeSegmentInsertMarkers(){var s;if(!this._selectedShapeId)return"";const t=(((s=this._workingConfig.msd)==null?void 0:s.overlays)||[]).find(a=>a.id===this._selectedShapeId&&a.type==="shape"&&a.kind==="polyline");if(!t||!Array.isArray(t.points)||t.points.length<2||t.locked||t.points.length>Ee)return"";const i=this._getViewBoxToPixelConverter();if(!i)return"";const o=t.points,r=[];for(let a=0;a<o.length-1;a++)r.push({a:o[a],b:o[a+1],insertIndex:a+1});return t.closed&&r.push({a:o[o.length-1],b:o[0],insertIndex:o.length}),v`
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1000;">
                ${r.map(({a,b:l,insertIndex:d})=>{if(!Array.isArray(a)||a.length<2||!Array.isArray(l)||l.length<2)return"";const c=(a[0]+l[0])/2,u=(a[1]+l[1])/2,[p,g]=i(c,u);return v`
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
                                box-shadow: var(--ha-box-shadow-s);
                                z-index: 1000;
                            "
                            @click=${_=>this._handleShapeSegmentInsertClick(_,t.id,d,c,u)}
                            title="Click to insert a point here">
                        </div>
                    `})}
            </div>
        `}_renderShapeVertexMarkers(){var k,F,L,q,z;if(!this._selectedShapeId)return"";const t=(((k=this._workingConfig.msd)==null?void 0:k.overlays)||[]).find(U=>U.id===this._selectedShapeId&&U.type==="shape"&&U.kind==="polyline");if(!t||!Array.isArray(t.points)||t.points.length===0||t.locked||t.points.length>Ee)return"";const i=(F=this.shadowRoot)==null?void 0:F.querySelector("lcards-msd-live-preview");if(!i)return"";const o=i.shadowRoot;if(!o)return"";const r=o.querySelector(".preview-card-container");if(!r)return"";const s=r.querySelector("lcards-msd-card");if(!s)return"";const a=s.shadowRoot||s.renderRoot;if(!a)return"";const l=a.querySelector("svg");if(!l)return"";const d=(L=l.getAttribute("viewBox"))==null?void 0:L.split(" ").map(Number);if(!d||d.length!==4)return"";const[c,u,p,g]=d,_=l.getBoundingClientRect(),f=(z=(q=this.shadowRoot)==null?void 0:q.querySelector(".preview-panel"))==null?void 0:z.getBoundingClientRect();if(!f)return"";const b=Math.max(p/_.width,g/_.height),w=p/b,S=g/b,C=(_.width-w)/2,D=(_.height-S)/2,M=h((U,T)=>{const N=(U-c)/b+C,y=(T-u)/b+D;return[N+(_.left-f.left),y+(_.top-f.top)]},"vbToPixel");return v`
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1000;">
                ${t.points.map((U,T)=>{var $,A;if(!Array.isArray(U)||U.length<2)return"";const[N,y]=M(U[0],U[1]),x=(($=this._shapeVertexDragState)==null?void 0:$.shapeId)===t.id&&((A=this._shapeVertexDragState)==null?void 0:A.vertexIndex)===T;return v`
                        <div
                            class="waypoint-marker editing ${x?"dragging":""}"
                            style="
                                position: absolute;
                                left: ${N}px;
                                top: ${y}px;
                                transform: translate(-50%, -50%);
                                width: 24px;
                                height: 24px;
                                border-radius: 50%;
                                background: ${x?"#FFAA00":"#00CC88"};
                                border: 2px solid #FFF;
                                cursor: move;
                                pointer-events: auto;
                                box-shadow: var(--ha-box-shadow-m);
                                z-index: ${x?"1002":"1001"};
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-family: 'Antonio', sans-serif;
                                font-size: 12px;
                                font-weight: 700;
                                color: #000;
                            "
                            @mousedown=${P=>this._handleShapeVertexMouseDown(P,t.id,T)}
                            @dblclick=${P=>this._handleShapeVertexDoubleClick(P,t.id,T)}
                            title="Point ${T+1} (Drag to move, Double-click to delete)">
                            ${T+1}
                        </div>
                    `})}
            </div>
        `}_renderRoutingPaths(){var M,k,F;if(!this._showRoutingPaths)return"";m.trace("[MSDStudio] _renderRoutingPaths called, _showRoutingPaths:",this._showRoutingPaths);const t=(((M=this._workingConfig.msd)==null?void 0:M.overlays)||[]).filter(L=>L.type==="line");if(t.length===0)return m.trace("[MSDStudio] No line overlays found"),"";m.trace("[MSDStudio] Found",t.length,"line overlays");const i=((k=this._workingConfig.msd)==null?void 0:k.anchors)||{},o=this._getBaseSvgAnchors();({...i,...o});const r=this._getPreviewSvgAndViewBox();if(!r)return"";const{svg:s,viewBoxX:a,viewBoxY:l,viewBoxWidth:d,viewBoxHeight:c}=r,u=s.getBoundingClientRect(),p=(F=this.shadowRoot)==null?void 0:F.querySelector(".preview-panel");if(!p)return"";const g=p.getBoundingClientRect(),_=d/u.width,f=c/u.height,b=Math.max(_,f),w=d/b,S=c/b,C=(u.width-w)/2,D=(u.height-S)/2;return v`
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 997;
            ">
                ${t.map(L=>{var W;const q=this._resolvePositionWithSide(L.anchor,L.anchor_side);if(!q)return"";let z=L.attach_to;Array.isArray(z)&&(z=z[z.length-1]);const U=this._resolvePositionWithSide(z,L.attach_side);if(!U||!q||!U)return"";const[T,N]=q,[y,x]=U,$=(T-a)/b+C,A=(N-l)/b+D,P=(y-a)/b+C,E=(x-l)/b+D,B=u.left-g.left+$,I=u.top-g.top+A,O=u.left-g.left+P,V=u.top-g.top+E,H=(W=L.style)==null?void 0:W.color,Y=typeof H=="object"&&H!==null?H.default||H.active||Object.values(H)[0]||"#00FFAA":H||"#00FFAA",X=Math.sqrt(Math.pow(O-B,2)+Math.pow(V-I,2)),G=Math.atan2(V-I,O-B)*180/Math.PI;return v`
                        <!-- Line -->
                        <div style="
                            position: absolute;
                            left: ${B}px;
                            top: ${I}px;
                            width: ${X}px;
                            height: 2px;
                            background: ${Y};
                            opacity: 0.7;
                            transform-origin: 0 0;
                            transform: rotate(${G}deg);
                        "></div>
                        <!-- Start marker -->
                        <div style="
                            position: absolute;
                            left: ${B}px;
                            top: ${I}px;
                            width: 8px;
                            height: 8px;
                            background: ${Y};
                            border-radius: 50%;
                            transform: translate(-50%, -50%);
                        "></div>
                        <!-- End marker -->
                        <div style="
                            position: absolute;
                            left: ${O}px;
                            top: ${V}px;
                            width: 8px;
                            height: 8px;
                            background: ${Y};
                            border-radius: 50%;
                            transform: translate(-50%, -50%);
                        "></div>
                    `})}
            </div>
        `}_renderLineEndpointMarkers(){var q,z,U,T,N,y;if(!this._showRoutingPaths)return"";const t=(((q=this._workingConfig.msd)==null?void 0:q.overlays)||[]).filter(x=>x.type==="line");if(t.length===0)return"";const i=((z=this._workingConfig.msd)==null?void 0:z.anchors)||{},o=this._getBaseSvgAnchors();({...i,...o});const r=(U=this.shadowRoot)==null?void 0:U.querySelector("lcards-msd-live-preview");if(!r)return"";const s=r.shadowRoot;if(!s)return"";const a=s.querySelector(".preview-card-container");if(!a)return"";const l=a.querySelector("lcards-msd-card");if(!l)return"";const d=l.shadowRoot||l.renderRoot;if(!d)return"";const c=d.querySelector("svg");if(!c)return"";const u=(T=c.getAttribute("viewBox"))==null?void 0:T.split(" ").map(Number);if(!u||u.length!==4)return"";const[p,g,_,f]=u,b=c.getBoundingClientRect(),w=(y=(N=this.shadowRoot)==null?void 0:N.querySelector(".preview-panel"))==null?void 0:y.getBoundingClientRect();if(!w)return"";const S=Math.max(_/b.width,f/b.height),C=_/S,D=f/S,M=(b.width-C)/2,k=(b.height-D)/2,F=new Map;t.forEach(x=>{const $=this._resolvePositionWithSide(x.anchor,x.anchor_side);if($){const E=`${$[0]},${$[1]}`;F.has(E)||F.set(E,[]),F.get(E).push({line:x,endpoint:"start",pos:$})}let A=x.attach_to;Array.isArray(A)&&(A=A[A.length-1]);const P=this._resolvePositionWithSide(A,x.attach_side);if(P){const E=`${P[0]},${P[1]}`;F.has(E)||F.set(E,[]),F.get(E).push({line:x,endpoint:"end",pos:P})}});const L=new Map;return F.forEach((x,$)=>{x.length>1&&x.forEach((P,E)=>{const B=E/x.length*2*Math.PI,I=Math.cos(B)*16,O=Math.sin(B)*16;L.set(`${P.line.id}:${P.endpoint}`,{dx:I,dy:O})})}),v`
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 999;
            ">
                ${t.map(x=>{const $=this._resolvePositionWithSide(x.anchor,x.anchor_side);if(!$)return"";let A=x.attach_to;Array.isArray(A)&&(A=A[A.length-1]);const P=this._resolvePositionWithSide(A,x.attach_side);if(!P)return"";const[E,B]=$,[I,O]=P,V=(E-p)/S+M,H=(B-g)/S+k,Y=(I-p)/S+M,X=(O-g)/S+k,G=b.left-w.left+V,W=b.top-w.top+H,J=b.left-w.left+Y,ne=b.top-w.top+X,K=this._lineEndpointDragState.active&&this._lineEndpointDragState.lineId===x.id,ae=K?this._lineEndpointDragState.endpoint:null,ce=L.get(`${x.id}:start`)||{dx:0,dy:0},Xe=L.get(`${x.id}:end`)||{dx:0,dy:0};let De=0,Fe=0;if(K&&this._lineEndpointDragState.currentPos){const[j,Me]=this._lineEndpointDragState.currentPos,Ae=(j-p)/S+M,Ge=(Me-g)/S+k;De=b.left-w.left+Ae,Fe=b.top-w.top+Ge}return this._activeMode===R.ADD_WAYPOINT&&this._selectedLineId===x.id?"":v`
                        <div class="line-endpoint-marker start"
                             data-line-id="${x.id}"
                             data-endpoint="start"
                             style="position: absolute;
                                    left: ${(ae==="start"&&K?De:G)+ce.dx}px;
                                    top: ${(ae==="start"&&K?Fe:W)+ce.dy}px;
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
                             @mousedown=${j=>this._handleLineEndpointDragStart(j,x.id,"start")}
                             @mouseenter=${j=>{j.target.style.transform="translate(-50%, -50%) scale(1.8)",j.target.style.zIndex="1100",j.target.style.boxShadow="0 0 12px rgba(153, 153, 255, 0.9), 0 0 20px rgba(153, 153, 255, 0.5)"}}
                             @mouseleave=${j=>{j.target.style.transform="translate(-50%, -50%) scale(1)",j.target.style.zIndex="1000",j.target.style.boxShadow="none"}}>
                        </div>
                        <div class="line-endpoint-marker end"
                             data-line-id="${x.id}"
                             data-endpoint="end"
                             style="position: absolute;
                                    left: ${(ae==="end"&&K?De:J)+Xe.dx}px;
                                    top: ${(ae==="end"&&K?Fe:ne)+Xe.dy}px;
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
                             @mousedown=${j=>this._handleLineEndpointDragStart(j,x.id,"end")}
                             @mouseenter=${j=>{j.target.style.transform="translate(-50%, -50%) scale(1.8)",j.target.style.zIndex="1100",j.target.style.boxShadow="0 0 12px rgba(255, 102, 102, 0.9), 0 0 20px rgba(255, 102, 102, 0.5)"}}
                             @mouseleave=${j=>{j.target.style.transform="translate(-50%, -50%) scale(1)",j.target.style.zIndex="1000",j.target.style.boxShadow="none"}}>
                        </div>
                    `})}
            </div>
        `}_renderDragAttachPoints(){return""}_renderChannelsOverlay(){var S,C;if(!this._showRoutingChannels)return"";m.trace("[MSDStudio] _renderChannelsOverlay called, _showRoutingChannels:",this._showRoutingChannels);const e=((S=this._workingConfig.msd)==null?void 0:S.channels)||{};if(Object.keys(e).length===0)return m.trace("[MSDStudio] No channels found"),"";m.trace("[MSDStudio] Found",Object.keys(e).length,"channels");const t=this._getPreviewSvgAndViewBox();if(!t)return"";const{svg:i,viewBoxX:o,viewBoxY:r,viewBoxWidth:s,viewBoxHeight:a}=t,l=i.getBoundingClientRect(),d=(C=this.shadowRoot)==null?void 0:C.querySelector(".preview-panel");if(!d)return"";const c=d.getBoundingClientRect(),u=s/l.width,p=a/l.height,g=Math.max(u,p),_=s/g,f=a/g,b=(l.width-_)/2,w=(l.height-f)/2;return v`
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 997;
            ">
                ${Object.entries(e).map(([D,M])=>{if(!M.bounds||!Array.isArray(M.bounds)||M.bounds.length!==4)return"";const[k,F,L,q]=M.bounds,z=(k-o)/g+b,U=(F-r)/g+w,T=L/g,N=q/g,y=l.left-c.left+z,x=l.top-c.top+U,$=M.color||"#00FFAA",A=this._channelResizeState.active&&this._channelResizeState.channelId===D,P=this._channelDragState.active&&this._channelDragState.channelId===D;let E=(M.direction||"auto").toLowerCase();E==="auto"&&(E=L>=q?"horizontal":"vertical");const B=Math.min(T,N)*.3,I=T/2,O=N/2,V=E==="horizontal"?`M ${I-B} ${O} L ${I+B} ${O} M ${I+B-6} ${O-4} L ${I+B} ${O} L ${I+B-6} ${O+4}`:`M ${I} ${O-B} L ${I} ${O+B} M ${I-4} ${O+B-6} L ${I} ${O+B} L ${I+4} ${O+B-6}`;return v`
                        <!-- Channel rectangle (interactive) -->
                        <div
                            class="interactive-channel ${A?"channel-resizing":""} ${P?"channel-dragging":""}"
                            data-channel-id="${D}"
                            style="
                                position: absolute;
                                left: ${y}px;
                                top: ${x}px;
                                width: ${T}px;
                                height: ${N}px;
                                border: 2px dashed ${$};
                                background: ${$}22;
                                opacity: 0.6;
                                pointer-events: auto;
                                cursor: grab;
                            "
                            @mousedown=${H=>this._handleChannelDragStart(H,D)}
                            @dblclick=${H=>this._handleChannelDoubleClick(H,D)}>

                            <!-- Resize Handles (only render when not dragging) -->
                            ${this._renderChannelResizeHandles(D,T,N,A)}
                            ${this._renderLiveCoordBadge(P,A,[k,F],[L,q])}
                        </div>
                        <!-- Channel ID label -->
                        <div style="
                            position: absolute;
                            left: ${y+4}px;
                            top: ${x+4}px;
                            background: ${$};
                            color: black;
                            padding: 2px 6px;
                            border-radius: 3px;
                            font-family: 'Courier New', monospace;
                            font-size: 10px;
                            font-weight: 700;
                            white-space: nowrap;
                            pointer-events: none;
                        ">
                            ${D}
                        </div>
                        <!-- Direction arrow indicator -->
                        <svg style="
                            position: absolute;
                            left: ${y}px;
                            top: ${x}px;
                            width: ${T}px;
                            height: ${N}px;
                            pointer-events: none;
                            overflow: visible;
                        ">
                            <path
                                d="${V}"
                                stroke="${$}"
                                stroke-width="2"
                                fill="none"
                                opacity="0.8"
                            />
                        </svg>
                        ${this._renderChannelCenterlineOverlay(D,M,E,$,y,x,T,N)}
                    `})}
            </div>
        `}_renderChannelCenterlineOverlay(e,t,i,o,r,s,a,l){const[d,c,u,p]=t.bounds,g=i==="horizontal"?c+p/2:d+u/2,_=i==="horizontal",f=_?0:a/2,b=_?l/2:0,w=_?a:a/2,S=_?l/2:l;return v`
            <svg style="
                position: absolute;
                left: ${r}px;
                top: ${s}px;
                width: ${a}px;
                height: ${l}px;
                pointer-events: none;
                overflow: visible;
            ">
                <line
                    x1="${f}" y1="${b}" x2="${w}" y2="${S}"
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
        `}_renderWaypointInsertMarkers(){var g,_;if(!this._showWaypointMarkers||!this._selectedLineId)return"";const t=(((g=this._workingConfig.msd)==null?void 0:g.overlays)||[]).find(f=>f.id===this._selectedLineId&&f.type==="line");if(!t)return"";const i=this._resolvePositionWithSide(t.anchor,t.anchor_side);if(!i)return"";let o=t.attach_to;Array.isArray(o)&&(o=o[o.length-1]);const r=this._resolvePositionWithSide(o,t.attach_side);if(!r)return"";const s=this._getViewBoxToPixelConverter();if(!s)return"";const a=((_=this._workingConfig.msd)==null?void 0:_.anchors)||{},d={...this._getBaseSvgAnchors(),...a},c=Array.isArray(t.waypoints)?t.waypoints:[],u=h(f=>Array.isArray(f)&&f.length>=2?[f[0],f[1]]:typeof f=="string"&&d[f]?d[f]:null,"resolveEntry"),p=[];for(let f=0;f<=c.length;f++){const b=f===0?i:u(c[f-1]),w=f===c.length?r:u(c[f]);!b||!w||p.push({segStart:b,segEnd:w,insertIndex:f})}return v`
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1000;">
                ${p.map(({segStart:f,segEnd:b,insertIndex:w})=>{const S=(f[0]+b[0])/2,C=(f[1]+b[1])/2,[D,M]=s(S,C);return v`
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
                                box-shadow: var(--ha-box-shadow-s);
                                z-index: 1000;
                            "
                            @click=${k=>this._handleWaypointInsertClick(k,t.id,w,S,C)}
                            title="Click to insert a waypoint here">
                        </div>
                    `})}
            </div>
        `}_renderWaypointMarkers(){var q,z,U,T,N,y;if(!this._showWaypointMarkers||!this._selectedLineId)return"";const t=(((q=this._workingConfig.msd)==null?void 0:q.overlays)||[]).find(x=>x.id===this._selectedLineId);if(!t||!t.waypoints||t.waypoints.length===0)return"";const i=(z=this.shadowRoot)==null?void 0:z.querySelector("lcards-msd-live-preview");if(!i)return"";const o=i.shadowRoot;if(!o)return"";const r=o.querySelector(".preview-card-container");if(!r)return"";const s=r.querySelector("lcards-msd-card");if(!s)return"";const a=s.shadowRoot||s.renderRoot;if(!a)return"";const l=a.querySelector("svg");if(!l)return"";const d=(U=l.getAttribute("viewBox"))==null?void 0:U.split(" ").map(Number);if(!d||d.length!==4)return"";const[c,u,p,g]=d,_=l.getBoundingClientRect(),f=(N=(T=this.shadowRoot)==null?void 0:T.querySelector(".preview-panel"))==null?void 0:N.getBoundingClientRect();if(!f)return"";const b=Math.max(p/_.width,g/_.height),w=p/b,S=g/b,C=(_.width-w)/2,D=(_.height-S)/2,M=h((x,$)=>{const A=(x-c)/b+C,P=($-u)/b+D,E=A+(_.left-f.left),B=P+(_.top-f.top);return[E,B]},"vbToPixel"),k=((y=this._workingConfig.msd)==null?void 0:y.anchors)||{},L={...this._getBaseSvgAnchors(),...k};return v`
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1000;
            ">
                ${t.waypoints.map((x,$)=>{var H,Y;let A,P,E=false,B="";if(Array.isArray(x)&&x.length>=2)[A,P]=x;else if(typeof x=="string"&&L[x])E=true,B=x,[A,P]=L[x];else return"";const[I,O]=M(A,P),V=((H=this._waypointDragState)==null?void 0:H.lineId)===t.id&&((Y=this._waypointDragState)==null?void 0:Y.waypointIndex)===$;return v`
                        <div
                            class="waypoint-marker editing ${V?"dragging":""} ${E?"named-anchor":""}"
                            style="
                                position: absolute;
                                left: ${I}px;
                                top: ${O}px;
                                transform: translate(-50%, -50%);
                                width: 24px;
                                height: 24px;
                                border-radius: 50%;
                                background: ${V?"#FFAA00":E?"#FFFF00":"#00FF88"};
                                border: 2px solid ${E?"#FF9900":"#FFF"};
                                cursor: move;
                                pointer-events: auto;
                                box-shadow: var(--ha-box-shadow-m);
                                transition: all 0.2s ease;
                                z-index: ${V?"1002":"1001"};
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-family: 'Antonio', sans-serif;
                                font-size: 12px;
                                font-weight: 700;
                                color: #000;
                            "
                            @mousedown=${X=>this._handleWaypointMouseDown(X,t.id,$)}
                            @dblclick=${X=>this._handleWaypointDoubleClick(X,t.id,$)}
                            title="${E?`Named waypoint: ${B}`:`Waypoint ${$+1}`} (Drag to move, Double-click to delete)">
                            ${$+1}
                        </div>
                    `})}
            </div>
        `}_resolveCornerGeometry(e,t){var U;const i=Array.isArray(e.waypoints)?e.waypoints:[],o=i[t];if(!Array.isArray(o))return null;const r=this._resolvePositionWithSide(e.anchor,e.anchor_side);let s=e.attach_to;Array.isArray(s)&&(s=s[s.length-1]);const a=this._resolvePositionWithSide(s,e.attach_side);if(!r||!a)return null;const l=((U=this._workingConfig.msd)==null?void 0:U.anchors)||{},c={...this._getBaseSvgAnchors(),...l},u=h(T=>Array.isArray(T)&&T.length>=2?[T[0],T[1]]:typeof T=="string"&&c[T]?c[T]:null,"resolveEntry"),p=[r,...i.map(u),a],g=t+1,_=p[g-1],f=p[g],b=p[g+1];if(!_||!f||!b)return null;const w=[f[0]-_[0],f[1]-_[1]],S=[b[0]-f[0],b[1]-f[1]],C=Math.hypot(w[0],w[1]),D=Math.hypot(S[0],S[1]);if(C<.01||D<.01)return null;const M=[w[0]/C,w[1]/C],k=[S[0]/D,S[1]/D],F=w[0]*S[1]-w[1]*S[0],L=w[0]*S[0]+w[1]*S[1];if(F===0&&L>0)return null;const q=[k[0]-M[0],k[1]-M[1]],z=Math.hypot(q[0],q[1]);return z<.001?null:{p:f,bisectorUnit:[q[0]/z,q[1]/z],lenIn:C,lenOut:D}}_renderCornerRadiusHandles(){var a;if(!this._showWaypointMarkers||!this._selectedLineId)return"";const t=(((a=this._workingConfig.msd)==null?void 0:a.overlays)||[]).find(l=>l.id===this._selectedLineId&&l.type==="line");if(!t||t.route!=="manual"||(t.corner_style||"round")==="miter")return"";const i=Array.isArray(t.waypoints)?t.waypoints:[];if(!i.length)return"";const o=this._getViewBoxToPixelConverter();if(!o)return"";const r=Number(t.corner_radius??34),s=[];for(let l=0;l<i.length;l++){const d=i[l];if(!Array.isArray(d))continue;const c=this._resolveCornerGeometry(t,l);if(!c)continue;const u=d.length>=3&&Number.isFinite(Number(d[2]))?Number(d[2]):r,p=[c.p[0]+u*c.bisectorUnit[0],c.p[1]+u*c.bisectorUnit[1]];s.push({wpIndex:l,handlePt:p,radius:u})}return s.length?v`
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1001;">
                ${s.map(({wpIndex:l,handlePt:d,radius:c})=>{var _,f;const[u,p]=o(d[0],d[1]),g=((_=this._cornerRadiusDragState)==null?void 0:_.lineId)===t.id&&((f=this._cornerRadiusDragState)==null?void 0:f.waypointIndex)===l;return v`
                        <div
                            class="corner-radius-handle ${g?"dragging":""}"
                            style="
                                position: absolute;
                                left: ${u}px;
                                top: ${p}px;
                                transform: translate(-50%, -50%);
                                width: 14px;
                                height: 14px;
                                border-radius: 50%;
                                background: ${g?"#FF66FF":"#CC66FF"};
                                border: 2px solid #FFF;
                                cursor: ew-resize;
                                pointer-events: auto;
                                box-shadow: var(--ha-box-shadow-s);
                                z-index: ${g?"1003":"1001"};
                            "
                            @mousedown=${b=>this._handleCornerRadiusMouseDown(b,t.id,l)}
                            @dblclick=${b=>this._handleCornerRadiusDoubleClick(b,t.id,l)}
                            title="Corner radius: ${Math.round(c)} (drag to adjust, double-click to reset to line default)">
                        </div>
                        ${g?v`
                            <div class="live-coord-badge" style="position: absolute; left: ${u}px; top: ${p-24}px; transform: translate(-50%, -50%);">
                                ${Math.round(c)} vb
                            </div>
                        `:""}
                    `})}
            </div>
        `:""}_handleCornerRadiusMouseDown(e,t,i){e.stopPropagation(),e.preventDefault(),this._cornerRadiusDragInProgress=true,this._cornerRadiusDragState={lineId:t,waypointIndex:i},this._boundCornerRadiusMouseMove=this._handleCornerRadiusMouseMove.bind(this),this._boundCornerRadiusMouseUp=this._handleCornerRadiusMouseUp.bind(this),document.addEventListener("mousemove",this._boundCornerRadiusMouseMove),document.addEventListener("mouseup",this._boundCornerRadiusMouseUp),this.requestUpdate()}_handleCornerRadiusMouseMove(e){var g,_;if(!this._cornerRadiusDragState)return;e.preventDefault();const{lineId:t,waypointIndex:i}=this._cornerRadiusDragState,r=(((g=this._workingConfig.msd)==null?void 0:g.overlays)||[]).find(f=>f.id===t);if(!r)return;const s=this._resolveCornerGeometry(r,i);if(!s)return;const a=this._getPreviewCoordinatesFromMouseEvent(e);if(!a)return;const l=a.x-s.p[0],d=a.y-s.p[1];let c=Math.max(0,l*s.bisectorUnit[0]+d*s.bisectorUnit[1]);c=this._enableSnapping&&this._gridSpacing>0?Math.round(c/this._gridSpacing)*this._gridSpacing:this._roundToPrecision(c);const u=r.waypoints[i],p=[u[0],u[1],c];r.waypoints[i]=p,((_=this._lineFormData)==null?void 0:_.id)===t&&Array.isArray(this._lineFormData.waypoints)&&(this._lineFormData.waypoints[i]=p),this._schedulePreviewUpdate(),this.requestUpdate()}_handleCornerRadiusMouseUp(e){this._cornerRadiusDragState&&(e.preventDefault(),e.stopPropagation(),this._cornerRadiusDragState=null,this._boundCornerRadiusMouseMove&&(document.removeEventListener("mousemove",this._boundCornerRadiusMouseMove),this._boundCornerRadiusMouseMove=null),this._boundCornerRadiusMouseUp&&(document.removeEventListener("mouseup",this._boundCornerRadiusMouseUp),this._boundCornerRadiusMouseUp=null),setTimeout(()=>{this._cornerRadiusDragInProgress=false},150),this.requestUpdate())}_handleCornerRadiusDoubleClick(e,t,i){var a,l,d;e.stopPropagation(),e.preventDefault();const r=(((a=this._workingConfig.msd)==null?void 0:a.overlays)||[]).find(c=>c.id===t),s=(l=r==null?void 0:r.waypoints)==null?void 0:l[i];if(Array.isArray(s)&&s.length>=3){s.splice(2,s.length-2);const c=((d=this._lineFormData)==null?void 0:d.id)===t&&Array.isArray(this._lineFormData.waypoints)?this._lineFormData.waypoints[i]:null;Array.isArray(c)&&c.length>=3&&c.splice(2,c.length-2),this._schedulePreviewUpdate(),this.requestUpdate()}}_handleWaypointMouseDown(e,t,i){e.stopPropagation(),e.preventDefault(),this._waypointEditingLineId!==t&&(this._waypointEditingLineId=t),this._waypointDragInProgress=true,this._waypointDragState={lineId:t,waypointIndex:i,startX:e.clientX,startY:e.clientY},this._boundWaypointMouseMove=this._handleWaypointMouseMove.bind(this),this._boundWaypointMouseUp=this._handleWaypointMouseUp.bind(this),document.addEventListener("mousemove",this._boundWaypointMouseMove),document.addEventListener("mouseup",this._boundWaypointMouseUp),this.requestUpdate()}_handleWaypointMouseMove(e){var _,f,b;if(!this._waypointDragState)return;e.preventDefault();const{lineId:t,waypointIndex:i}=this._waypointDragState,o=this._getPreviewCoordinatesFromMouseEvent(e);if(!o)return;let{x:r,y:s}=o;if(this._enableSnapping&&this._gridSpacing>0){const w=Pi(r,s,this._gridSpacing);r=w[0],s=w[1]}let a=[this._roundToPrecision(r),this._roundToPrecision(s)];const l=30,d=((_=this._workingConfig.msd)==null?void 0:_.anchors)||{},c=this._getBaseSvgAnchors(),u={...d,...c};if(u&&typeof u=="object"&&!Array.isArray(u)){for(const[w,S]of Object.entries(u))if(Array.isArray(S)&&S.length>=2){const[C,D]=S;if(Math.sqrt(Math.pow(r-C,2)+Math.pow(s-D,2))<l){a=w,m.debug(`[MSDStudio] Waypoint ${i} snapped to anchor: ${w}`);break}}}const p=((f=this._workingConfig.msd)==null?void 0:f.overlays)||[],g=p.findIndex(w=>w.id===t);if(g!==-1){const w=p[g];w.waypoints&&w.waypoints[i]!==void 0&&(w.waypoints[i]=a,((b=this._lineFormData)==null?void 0:b.id)===t&&this._lineFormData.waypoints&&(this._lineFormData.waypoints[i]=a),this._schedulePreviewUpdate(),this.requestUpdate())}}_handleWaypointMouseUp(e){this._waypointDragState&&(e.preventDefault(),e.stopPropagation(),this._waypointDragState=null,this._boundWaypointMouseMove&&(document.removeEventListener("mousemove",this._boundWaypointMouseMove),this._boundWaypointMouseMove=null),this._boundWaypointMouseUp&&(document.removeEventListener("mouseup",this._boundWaypointMouseUp),this._boundWaypointMouseUp=null),setTimeout(()=>{this._waypointDragInProgress=false},150),this.requestUpdate())}_handleWaypointDoubleClick(e,t,i){var s,a;e.stopPropagation(),e.preventDefault(),this._clickTimeout&&(clearTimeout(this._clickTimeout??void 0),this._clickTimeout=null);const o=((s=this._workingConfig.msd)==null?void 0:s.overlays)||[],r=o.findIndex(l=>l.id===t);if(r!==-1){const l=o[r];l.waypoints&&l.waypoints.length>0&&(l.waypoints.splice(i,1),((a=this._lineFormData)==null?void 0:a.id)===t&&this._lineFormData.waypoints&&this._lineFormData.waypoints.splice(i,1),l.waypoints.length,m.debug(`[MSDStudio] Deleted waypoint ${i} from line ${t}`),this._schedulePreviewUpdate(),this.requestUpdate())}}_handleWaypointInsertClick(e,t,i,o,r){var l,d;e.stopPropagation(),e.preventDefault();const a=(((l=this._workingConfig.msd)==null?void 0:l.overlays)||[]).find(c=>c.id===t&&c.type==="line");a&&(a.route!=="manual"&&(a.route="manual"),Array.isArray(a.waypoints)||(a.waypoints=[]),a.waypoints.splice(i,0,[this._roundToPrecision(o),this._roundToPrecision(r)]),((d=this._lineFormData)==null?void 0:d.id)===t&&(this._lineFormData.route="manual",this._lineFormData.waypoints=[...a.waypoints]),m.debug(`[MSDStudio] Inserted waypoint at index ${i} on line ${t}`),this._schedulePreviewUpdate(),this.requestUpdate())}_convertLineToManual(e){var p;const t=(p=this.shadowRoot)==null?void 0:p.querySelector("lcards-msd-live-preview");if(!t){m.warn("[MSDStudio] Cannot convert to manual: preview not found");return}const i=t.shadowRoot;if(!i)return;const o=i.querySelector(".preview-card-container");if(!o)return;const r=o.querySelector("lcards-msd-card");if(!r)return;const s=r.shadowRoot||r.renderRoot;if(!s)return;const a=s.querySelector("svg");if(!a)return;const l=a.querySelector(`g[data-overlay-id="${e}"] path.line-path`);if(!l){m.warn("[MSDStudio] Cannot convert to manual: line path not found in SVG");return}const d=l.getAttribute("d");if(!d)return;const c=[],u=d.match(/[ML]\s*[\d.]+,[\d.]+/g)||[];u.forEach((g,_)=>{if(_===0||_===u.length-1)return;const f=g.replace(/[ML]\s*/,"").split(",").map(Number);f.length===2&&c.push([f[0],f[1]])}),this._lineFormData.route="manual",this._lineFormData.waypoints=c,m.debug(`[MSDStudio] Converted line ${e} to manual mode with ${c.length} waypoints`),this.requestUpdate()}_renderChannelHighlight(){var N,y;if(!this._highlightedChannel)return"";const t=(((N=this._workingConfig.msd)==null?void 0:N.channels)||{})[this._highlightedChannel];if(!t||!t.bounds)return"";const[i,o,r,s]=t.bounds,a=this._getPreviewSvgAndViewBox();if(!a)return"";const{svg:l,viewBoxX:d,viewBoxY:c,viewBoxWidth:u,viewBoxHeight:p}=a,g=l.getBoundingClientRect(),_=(y=this.shadowRoot)==null?void 0:y.querySelector(".preview-panel");if(!_)return"";const f=_.getBoundingClientRect(),b=u/g.width,w=p/g.height,S=Math.max(b,w),C=u/S,D=p/S,M=(g.width-C)/2,k=(g.height-D)/2,F=(i-d)/S+M,L=(o-c)/S+k,q=r/S,z=s/S,U=g.left-f.left+F,T=g.top-f.top+L;return v`
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
                    top: ${T}px;
                    width: ${q}px;
                    height: ${z}px;
                    border: 3px solid #FFAA00;
                    box-shadow: 0 0 20px rgba(255, 170, 0, 0.8);
                    animation: channel-pulse 1s ease-in-out infinite;
                "></div>

                <!-- Channel ID label -->
                <div style="
                    position: absolute;
                    left: ${U+q/2}px;
                    top: ${T-10}px;
                    transform: translate(-50%, -100%);
                    background: rgba(255, 170, 0, 0.95);
                    color: black;
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    font-weight: 700;
                    white-space: nowrap;
                    box-shadow: var(--ha-box-shadow-m);
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
        `}_renderAttachmentPointsOverlay(){var N,y;if(this._activeMode===R.ADD_WAYPOINT||this._activeMode!==R.CONNECT_LINE&&!this._showAttachmentPoints)return"";const e=((N=this._workingConfig.msd)==null?void 0:N.anchors)||{},i={...this._getBaseSvgAnchors(),...e},o=this._getControlOverlays(),r=this._getPreviewSvgAndViewBox();if(!r)return"";const{svg:s,viewBoxX:a,viewBoxY:l,viewBoxWidth:d,viewBoxHeight:c}=r,u=s.getBoundingClientRect(),p=(y=this.shadowRoot)==null?void 0:y.querySelector(".preview-panel");if(!p)return"";const g=p.getBoundingClientRect(),_=d/u.width,f=c/u.height,b=Math.max(_,f),w=d/b,S=c/b,C=(u.width-w)/2,D=(u.height-S)/2,M=h((x,$)=>{const A=(x-a)/b+C,P=($-l)/b+D;return{x:u.left-g.left+A,y:u.top-g.top+P}},"toPixelPos"),k=[{name:"top-left",dx:-1,dy:-1},{name:"top",dx:0,dy:-1},{name:"top-right",dx:1,dy:-1},{name:"left",dx:-1,dy:0},{name:"center",dx:0,dy:0},{name:"right",dx:1,dy:0},{name:"bottom-left",dx:-1,dy:1},{name:"bottom",dx:0,dy:1},{name:"bottom-right",dx:1,dy:1}],F=Object.entries(i).map(([x,$])=>{var H,Y,X;if(!Array.isArray($))return"";const[A,P]=$,E=M(A,P),B={name:"center"},I=E.x,O=E.y,V=((H=this._connectLineState.source)==null?void 0:H.type)==="anchor"&&((Y=this._connectLineState.source)==null?void 0:Y.id)===x&&((X=this._connectLineState.source)==null?void 0:X.point)===B.name;return v`
                <div
                    class="attachment-point"
                    data-connection-type="anchor"
                    data-connection-id="${x}"
                    data-connection-point="${B.name}"
                    @click=${this._handleAttachmentPointClick}
                    style="
                        position: absolute;
                        left: ${I}px;
                        top: ${O}px;
                        transform: translate(-50%, -50%);
                        width: 12px;
                        height: 12px;
                        background: ${V?"#2196F3":"#00FFFF"};
                        border: 2px solid ${V?"#1976D2":"#00BCD4"};
                        border-radius: 50%;
                        cursor: pointer;
                        box-shadow: 0 0 8px ${V?"rgba(33, 150, 243, 0.8)":"rgba(0, 255, 255, 0.6)"};
                        transition: all 0.2s;
                        pointer-events: auto;
                        z-index: 1000;
                    "
                    @mouseenter=${G=>G.target.style.transform="translate(-50%, -50%) scale(1.5)"}
                    @mouseleave=${G=>G.target.style.transform="translate(-50%, -50%) scale(1)"}
                ></div>
            `}),L=this._showControlForm&&typeof this._controlFormPosition=="string"?this._controlFormPosition:null,q=this._controlFormPositionSide||"center",z=o.map((x,$)=>{if(!x.position&&!x.anchor)return m.warn("[MSDStudio] Control has neither position nor anchor:",x.id),"";const A=this._resolveEditorControlPosition(x,i);if(!A)return m.warn("[MSDStudio] Failed to resolve position for control:",x.id,x.position||x.anchor),"";if(!x.size)return m.warn("[MSDStudio] Control missing size:",x.id),"";const[P,E]=A,[B,I]=x.size,O=x.attachment||"center",V=this._getAttachmentOffset(O,B,I),H=P+V[0],Y=E+V[1],X=M(H,Y),G=M(H+B,Y+I),W=(X.x+G.x)/2,J=(X.y+G.y)/2,ne=G.x-X.x,K=G.y-X.y,ae=this._showControlForm&&this._editingControlId===x.id?this._controlFormAttachment||"center":x.attachment||"center";return k.map(ce=>{var oi,ni,ri;const Xe=W+ce.dx*ne/2,De=J+ce.dy*K/2,Fe=((oi=this._connectLineState.source)==null?void 0:oi.type)==="control"&&((ni=this._connectLineState.source)==null?void 0:ni.id)===x.id&&((ri=this._connectLineState.source)==null?void 0:ri.point)===ce.name,ii=L===x.id&&ce.name===q,j=ce.name===ae;let Me="#FF9900",Ae="#F57C00",Ge="none",je="0 0 8px rgba(255, 153, 0, 0.6)";return Fe?(Me="#2196F3",Ae="#1976D2",je="0 0 8px rgba(33, 150, 243, 0.8)"):ii?(Me="#E040FB",Ae="#AA00FF",je="0 0 8px rgba(224, 64, 251, 0.8)"):j&&(Ge="2px solid #FFFFFF",je="0 0 8px rgba(255, 153, 0, 0.6), 0 0 0 4px rgba(255, 255, 255, 0.35)"),v`
                    <div
                        class="attachment-point"
                        data-connection-type="control"
                        data-connection-id="${x.id}"
                        data-connection-point="${ce.name}"
                        @click=${this._handleAttachmentPointClick}
                        style="
                            position: absolute;
                            left: ${Xe}px;
                            top: ${De}px;
                            transform: translate(-50%, -50%);
                            width: 12px;
                            height: 12px;
                            background: ${Me};
                            border: 2px solid ${Ae};
                            outline: ${Ge};
                            outline-offset: 2px;
                            border-radius: 50%;
                            cursor: pointer;
                            box-shadow: ${je};
                            transition: all 0.2s;
                            pointer-events: auto;
                            z-index: 1000;
                        "
                        @mouseenter=${vt=>vt.target.style.transform="translate(-50%, -50%) scale(1.5)"}
                        @mouseleave=${vt=>vt.target.style.transform="translate(-50%, -50%) scale(1)"}
                    ></div>
                `})}),T=this._getShapeOverlays().map(x=>{const $=h(W=>{var J,ne,K;return((J=this._connectLineState.source)==null?void 0:J.type)==="shape"&&((ne=this._connectLineState.source)==null?void 0:ne.id)===x.id&&((K=this._connectLineState.source)==null?void 0:K.point)===W},"isSourceAt"),A=h((W,J,ne)=>{const K=$(W);return v`
                    <div
                        class="attachment-point"
                        data-connection-type="shape"
                        data-connection-id="${x.id}"
                        data-connection-point="${W}"
                        @click=${this._handleAttachmentPointClick}
                        style="
                            position: absolute;
                            left: ${J}px;
                            top: ${ne}px;
                            transform: translate(-50%, -50%);
                            width: 12px;
                            height: 12px;
                            background: ${K?"#2196F3":"#00CC88"};
                            border: 2px solid ${K?"#1976D2":"#009966"};
                            border-radius: 50%;
                            cursor: pointer;
                            box-shadow: 0 0 8px ${K?"rgba(33, 150, 243, 0.8)":"rgba(0, 204, 136, 0.6)"};
                            transition: all 0.2s;
                            pointer-events: auto;
                            z-index: 1000;
                        "
                        @mouseenter=${ae=>ae.target.style.transform="translate(-50%, -50%) scale(1.5)"}
                        @mouseleave=${ae=>ae.target.style.transform="translate(-50%, -50%) scale(1)"}
                    ></div>
                `},"renderDot");if(x.kind==="polyline")return!Array.isArray(x.points)||x.points.length>Ee?"":x.points.map((W,J)=>{if(!Array.isArray(W)||W.length<2)return"";const ne=M(W[0],W[1]);return A(`vertex${J}`,ne.x,ne.y)});if(!Array.isArray(x.position)||!Array.isArray(x.size))return"";const[P,E]=x.position,[B,I]=x.size,O=M(P,E),V=M(P+B,E+I),H=(O.x+V.x)/2,Y=(O.y+V.y)/2,X=V.x-O.x,G=V.y-O.y;return k.map(W=>A(W.name,H+W.dx*X/2,Y+W.dy*G/2))});return v`
            <div style="
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1000;
            ">
                ${F}
                ${z}
                ${T}
            </div>
        `}_handleAttachmentPointClick(e){if(e.stopPropagation(),this._activeMode===R.QUICK_LABEL){const o=e.currentTarget;this._handleQuickLabelDotClick(o.dataset.connectionId||"",o.dataset.connectionPoint||"center");return}const t=e.currentTarget,i={type:t.dataset.connectionType,id:t.dataset.connectionId,point:t.dataset.connectionPoint,gap:0};this._connectLineState.source?(m.debug("[MSDStudio] Connect line target set:",i),this._openLineFormWithConnection(this._connectLineState.source,i),this._clearConnectLineState()):(this._connectLineState={...this._connectLineState,source:i},m.debug("[MSDStudio] Connect line source set:",i),this.requestUpdate())}_getViewBoxToPixelConverter(){var f;const e=this._getPreviewSvgAndViewBox();if(!e)return null;const{svg:t,viewBoxX:i,viewBoxY:o,viewBoxWidth:r,viewBoxHeight:s}=e,a=t.getBoundingClientRect(),l=(f=this.shadowRoot)==null?void 0:f.querySelector(".preview-panel");if(!l)return null;const d=l.getBoundingClientRect(),c=Math.max(r/a.width,s/a.height),u=r/c,p=s/c,g=(a.width-u)/2,_=(a.height-p)/2;return(b,w)=>{const S=(b-i)/c+g,C=(w-o)/c+_;return[S+(a.left-d.left),C+(a.top-d.top)]}}_renderDrawChannelOverlay(){if(this._activeMode!==R.DRAW_CHANNEL||!this._drawChannelState.drawing)return"";const e=this._renderModeHintLabel("Drag, or click twice, to draw · Esc to cancel");if(!this._drawChannelState.currentPoint)return v`
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 1000;">
                    ${e}
                </div>
            `;const t=this._getViewBoxToPixelConverter();if(!t)return"";const i=this._drawChannelState.startPoint;if(!i)return"";const[o,r]=t(i[0],i[1]),[s,a]=t(this._drawChannelState.currentPoint[0],this._drawChannelState.currentPoint[1]),l=Math.min(o,s),d=Math.min(r,a),c=Math.abs(s-o),u=Math.abs(a-r);return v`
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
                        x="${l}px"
                        y="${d}px"
                        width="${c}px"
                        height="${u}px"
                        fill="rgba(0, 255, 255, 0.2)"
                        stroke="#00FFFF"
                        stroke-width="2"
                        stroke-dasharray="5,5" />
                </svg>
                ${e}
            </div>
        `}_renderPlaceControlOverlay(){if(this._activeMode!==R.PLACE_CONTROL||!this._placeControlDrawState.drawing)return"";const e=this._renderModeHintLabel("Drag, or click twice, to size the control · Esc to cancel");if(!this._placeControlDrawState.currentPoint)return v`
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 1000;">
                    ${e}
                </div>
            `;const t=this._getViewBoxToPixelConverter();if(!t)return"";const i=this._placeControlDrawState.startPoint;if(!i)return"";const[o,r]=t(i[0],i[1]),[s,a]=t(this._placeControlDrawState.currentPoint[0],this._placeControlDrawState.currentPoint[1]),l=Math.min(o,s),d=Math.min(r,a),c=Math.abs(s-o),u=Math.abs(a-r);return v`
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
                        x="${l}px"
                        y="${d}px"
                        width="${c}px"
                        height="${u}px"
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
                box-shadow: var(--ha-box-shadow-s);
            ">${e}</div>
        `}_handleQuickLabelClick(e){const t=this._quickLabelSnap(e);if(!t)return;const i=t.point;if(!this._quickLabelState.targetPoint){this._quickLabelState={...this._quickLabelState,target:t.target??i,targetSide:t.targetSide??null,targetPoint:i,currentPoint:null,snap:null};return}this._placeQuickLabel(i)}_handleQuickLabelDotClick(e,t){const i=t&&t!=="center"?t:null,o=this._quickLabelSnapTargets().find(r=>r.name===e&&r.side===i);if(o){if(!this._quickLabelState.targetPoint){this._quickLabelState={...this._quickLabelState,target:o.id??o.point,targetSide:o.id?i:null,targetPoint:o.point,currentPoint:null,snap:null};return}this._placeQuickLabel(o.point)}}_placeQuickLabel(e){var d,c;const t=this._getPreviewSvgAndViewBox(),i=this._quickLabelState.style==="copied"&&((d=this._styleClipboard)==null?void 0:d.kind)==="label"?this._styleClipboard:null,o=i?Li([{id:"__src",type:"control",card:{type:"custom:lcards-button",...i.label}},{id:"__ln",type:"line",anchor:"__src",...i.line||{}}]):null,r=$a((t==null?void 0:t.viewBoxWidth)||0,this._quickLabelState.size||"medium");let s=[...((c=this._workingConfig.msd)==null?void 0:c.overlays)||[]];const{label:a,line:l}=ka({style:(o==null?void 0:o.style)||(i?"classic":this._quickLabelState.style||"classic"),bracketKind:(o==null?void 0:o.bracketKind)||this._quickLabelState.bracketKind,labelPoint:e,target:this._quickLabelState.target,targetSide:this._quickLabelState.targetSide,targetPoint:this._quickLabelState.targetPoint||void 0,unitsPerPx:r,overlays:s,text:this._quickLabelState.text});s.push(a,l),i&&(s=qi(s,[a.id],i,u=>this._stylePointOf(u))),this._setNestedValue("msd.overlays",s),this._quickLabelState={...this._quickLabelState,target:null,targetSide:null,targetPoint:null,currentPoint:null,snap:null},m.debug("[MSDStudio] Quick label added",{label:a.id,line:l.id})}_quickLabelEscape(){var t,i;const e=((t=this.renderRoot)==null?void 0:t.activeElement)||null;(i=e==null?void 0:e.closest)!=null&&i.call(e,".quick-label-panel")&&e.blur(),this._setMode(R.VIEW)}_startQuickLabelPanelDrag(e){if(e.button!==0)return;const t=e.currentTarget.closest(".quick-label-panel"),i=(t==null?void 0:t.offsetParent)||(t==null?void 0:t.parentElement)||null;if(!t||!i)return;e.preventDefault();const o={x:e.clientX,y:e.clientY,left:t.offsetLeft,top:t.offsetTop},r=h(a=>{const l=Math.max(0,i.clientWidth-t.offsetWidth),d=Math.max(0,i.clientHeight-t.offsetHeight);this._quickLabelPanelPos={left:Math.min(l,Math.max(0,o.left+a.clientX-o.x)),top:Math.min(d,Math.max(0,o.top+a.clientY-o.y))}},"move"),s=h(()=>{window.removeEventListener("pointermove",r),window.removeEventListener("pointerup",s),window.removeEventListener("pointercancel",s)},"up");window.addEventListener("pointermove",r),window.addEventListener("pointerup",s),window.addEventListener("pointercancel",s)}_previewUnitsPerScreenPx(){const e=this._getPreviewSvgAndViewBox(),t=e==null?void 0:e.svg.getBoundingClientRect();return!e||!t||!(t.width>0)||!(t.height>0)?1:Math.max(e.viewBoxWidth/t.width,e.viewBoxHeight/t.height)}_quickLabelSnap(e){var s;const t=this._getPreviewCoordinates(e);if(!t)return null;const i=[t.x,t.y],o=((s=this._workingConfig.msd)==null?void 0:s.overlays)||[];if(!this._quickLabelState.targetPoint){const a=e.composedPath().find(c=>c instanceof Element&&(c.hasAttribute("data-anchor-name")||c.hasAttribute("data-connection-id"))),l=(a==null?void 0:a.getAttribute("data-anchor-name"))||(a==null?void 0:a.getAttribute("data-connection-id"))||null;if(l){const c=a==null?void 0:a.getAttribute("data-connection-point"),u=c&&c!=="center"?c:null,p=this._quickLabelSnapTargets().find(g=>g.name===l&&g.side===u);return p?{point:p.point,named:true,target:p.id??void 0,targetSide:p.id?u:null,guideX:null,guideY:null}:{point:i,named:true,target:l,targetSide:null,guideX:null,guideY:null}}if(e.altKey)return{point:i,named:false,guideX:null,guideY:null};const d=Ma(i,this._quickLabelSnapTargets(),12*this._previewUnitsPerScreenPx());return d?{point:d.point,named:true,target:d.id??void 0,targetSide:d.side,guideX:null,guideY:null}:{point:i,named:false,guideX:null,guideY:null}}if(e.altKey)return{point:i,named:false,guideX:null,guideY:null};const r=Fa(i,o,8*this._previewUnitsPerScreenPx());return{point:r.point,named:false,guideX:r.guideX,guideY:r.guideY}}_quickLabelSnapTargets(){var o,r,s;const e=[],t={...this._getBaseSvgAnchors(),...((o=this._workingConfig.msd)==null?void 0:o.anchors)||{}},i=((r=this._workingConfig.msd)==null?void 0:r.anchors)||{};for(const[a,l]of Object.entries(t))!Array.isArray(l)||l.length<2||e.push({id:i[a]||Aa(a)?a:null,name:a,side:null,point:[Number(l[0]),Number(l[1])]});for(const a of((s=this._workingConfig.msd)==null?void 0:s.overlays)||[])if((a==null?void 0:a.type)==="control"){const l=this._resolveControlPosition(a);l&&e.push(...Ri({...a,position:l,size:a.size||[100,100]}).map(d=>({...d,name:a.id})))}for(const a of this._getShapeOverlays())a.kind==="polyline"?(a.points||[]).forEach((l,d)=>{Array.isArray(l)&&l.length>=2&&e.push({id:a.id,name:a.id,side:`vertex${d}`,point:[Number(l[0]),Number(l[1])]})}):Array.isArray(a.position)&&Array.isArray(a.size)&&e.push(...Ri({...a,attachment:"top-left"}).map(l=>({...l,name:a.id})));return e}_stylePointOf(e){if(typeof e!="string")return null;const t=this._resolvePositionWithSide(e,null);return Array.isArray(t)?[Number(t[0]),Number(t[1])]:null}_copyOverlayStyle(e){var i;const t=Pa(e,((i=this._workingConfig.msd)==null?void 0:i.overlays)||[]);t&&(this._styleClipboard=t,m.debug("[MSDStudio] Style copied",{from:t.sourceId,kind:t.kind}))}_pasteOverlayStyle(e){var o;const t=this._styleClipboard;if(!t||!e.length)return;const i=qi(((o=this._workingConfig.msd)==null?void 0:o.overlays)||[],e,t,r=>this._stylePointOf(r));this._setNestedValue("msd.overlays",i),m.debug("[MSDStudio] Style pasted",{from:t.sourceId,to:e})}_renderStyleClipboardButtons(e){const t=this._styleClipboard;if(!((e==null?void 0:e.type)==="line"||ke(e)))return v``;const o=t&&t.sourceId!==e.id&&(e.type==="line"?!!t.line:true);return v`
            <ha-icon-button
                class="${(t==null?void 0:t.sourceId)===e.id?"active":""}"
                @click=${()=>this._copyOverlayStyle(e)}
                .label=${"Copy style"}>
                <ha-icon icon="mdi:format-paint"></ha-icon>
            </ha-icon-button>
            ${o?v`
                <ha-icon-button
                    @click=${()=>this._pasteOverlayStyle([e.id])}
                    .label=${"Paste style"}>
                    <ha-icon icon="mdi:clipboard-arrow-down-outline"></ha-icon>
                </ha-icon-button>
            `:""}
        `}_renderStyleClipboardBar(e){var s;const t=this._styleClipboard;if(!t)return v``;const i=((s=this._workingConfig.msd)==null?void 0:s.overlays)||[],o=(e==="label"?i.filter(ke):i.filter(a=>(a==null?void 0:a.type)==="line")).map(a=>a.id).filter(a=>a!==t.sourceId);if(e==="line"&&!t.line)return v``;const r=e==="line"?[...this._selectedLineIds].filter(a=>a!==t.sourceId):[];return v`
            <div class="style-clipboard-bar">
                <ha-icon icon="mdi:format-paint"></ha-icon>
                <span>Style of ${t.sourceId}</span>
                ${r.length?v`
                    <ha-button size="s" @click=${()=>this._pasteOverlayStyle(r)}>Paste to selected (${r.length})</ha-button>
                `:""}
                <ha-button size="s" ?disabled=${!o.length} @click=${()=>this._pasteOverlayStyle(o)}>
                    Paste to all ${e==="label"?"labels":"lines"} (${o.length})
                </ha-button>
                <ha-icon-button @click=${()=>{this._styleClipboard=null,this._quickLabelState.style==="copied"&&(this._quickLabelState={...this._quickLabelState,style:"classic"})}} .label=${"Clear copied style"}>
                    <ha-icon icon="mdi:close"></ha-icon>
                </ha-icon-button>
            </div>
        `}_renderQuickLabelOverlay(){var l,d,c,u;if(this._activeMode!==R.QUICK_LABEL)return"";const e=this._quickLabelState,t=e.style||"classic";let i=v``;const o=e.targetPoint||e.snap?this._getViewBoxToPixelConverter():null;if(o){const p=e.targetPoint?o(e.targetPoint[0],e.targetPoint[1]):null,g=e.currentPoint?o(e.currentPoint[0],e.currentPoint[1]):null,_=!e.targetPoint&&((l=e.snap)!=null&&l.named)?o(e.snap.point[0],e.snap.point[1]):null,f=e.targetPoint&&((d=e.snap)==null?void 0:d.guideX)!=null?o(e.snap.guideX,0)[0]:null,b=e.targetPoint&&((c=e.snap)==null?void 0:c.guideY)!=null?o(0,e.snap.guideY)[1]:null;i=v`
                <svg class="quick-label-feedback" style="width: 100%; height: 100%; position: absolute; top: 0; left: 0; pointer-events: none;">
                    ${f!==null?me`<line class="quick-label-guide" x1="${f}" y1="0" x2="${f}" y2="100%" stroke="#00FFFF" stroke-width="1" stroke-dasharray="3,4" opacity="0.7"></line>`:""}
                    ${b!==null?me`<line class="quick-label-guide" x1="0" y1="${b}" x2="100%" y2="${b}" stroke="#00FFFF" stroke-width="1" stroke-dasharray="3,4" opacity="0.7"></line>`:""}
                    ${_?me`<circle class="quick-label-snap" cx="${_[0]}" cy="${_[1]}" r="9" fill="none" stroke="#00FFFF" stroke-width="2"></circle>`:""}
                    ${p?me`<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="#00FFFF"></circle>`:""}
                    ${p&&g?me`<line x1="${p[0]}" y1="${p[1]}" x2="${g[0]}" y2="${g[1]}" stroke="#00FFFF" stroke-width="2" stroke-dasharray="5,5"></line>`:""}
                </svg>`}const r=e.targetPoint?"Click where the label goes (the line leaves it there) · Esc: cancel":"Click the part to label · Alt: no snap · Esc: cancel",s=this._quickLabelPanelPos,a=h(p=>p.stopPropagation(),"stop");return v`
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 1000;">
                ${i}
                <div class="quick-label-panel" @click=${a} @mousedown=${a} @pointerdown=${a} @wheel=${a}
                    style=${s?`left: ${s.left}px; top: ${s.top}px; bottom: auto;`:""}>
                    <div class="quick-label-header">
                        <div class="quick-label-handle" title="Drag to move" @pointerdown=${p=>this._startQuickLabelPanelDrag(p)}>
                            <ha-icon icon="mdi:drag"></ha-icon>
                            <span>Quick label</span>
                        </div>
                        <ha-icon-button class="quick-label-close" .label=${"Close quick label"} @click=${()=>this._setMode(R.VIEW)}>
                            <ha-icon icon="mdi:close"></ha-icon>
                        </ha-icon-button>
                    </div>
                    <div class="quick-label-step">${r}</div>
                    ${[["classic","picard"],["bracket","tag"]].map(p=>v`
                        <div class="quick-label-row">
                            <wa-button-group childSelector="ha-button">
                                ${p.map(g=>v`
                                    <ha-button iconTag="ha-svg-icon" variant="brand" size="s"
                                        title=${Ne[g].description}
                                        .appearance=${t===g?"accent":"filled"}
                                        @click=${()=>{this._quickLabelState={...this._quickLabelState,style:g}}}>
                                        ${Ne[g].label}
                                    </ha-button>
                                `)}
                            </wa-button-group>
                        </div>
                    `)}
                    ${((u=this._styleClipboard)==null?void 0:u.kind)==="label"?v`
                        <div class="quick-label-row">
                            <wa-button-group childSelector="ha-button">
                                <ha-button iconTag="ha-svg-icon" variant="brand" size="s"
                                    title="New labels in the style copied from ${this._styleClipboard.sourceId}"
                                    .appearance=${t==="copied"?"accent":"filled"}
                                    @click=${()=>{this._quickLabelState={...this._quickLabelState,style:"copied"}}}>
                                    Copied style (${this._styleClipboard.sourceId})
                                </ha-button>
                            </wa-button-group>
                        </div>
                    `:""}
                    ${t==="bracket"?v`
                        <div class="quick-label-row">
                            <wa-button-group childSelector="ha-button">
                                ${Object.entries(xa).map(([p,g])=>v`
                                    <ha-button iconTag="ha-svg-icon" variant="brand" size="s"
                                        title=${g.description}
                                        .appearance=${e.bracketKind===p?"accent":"filled"}
                                        @click=${()=>{this._quickLabelState={...this._quickLabelState,bracketKind:p}}}>
                                        ${g.label}
                                    </ha-button>
                                `)}
                            </wa-button-group>
                        </div>
                    `:""}
                    ${t==="copied"?"":v`<div class="quick-label-row">
                        <wa-button-group childSelector="ha-button">
                            ${Object.entries(He).map(([p,g])=>v`
                                <ha-button iconTag="ha-svg-icon" variant="brand" size="s"
                                    title="${g.name}: label size as a share of the drawing (it scales with the MSD)"
                                    .appearance=${(e.size||"medium")===p?"accent":"filled"}
                                    @click=${()=>{this._quickLabelState={...this._quickLabelState,size:p}}}>
                                    ${g.label}
                                </ha-button>
                            `)}
                        </wa-button-group>
                    </div>`}
                    <div class="quick-label-fields">
                        <ha-input
                            class="quick-label-text"
                            label="Label text"
                            .value=${e.text}
                            @input=${p=>{const g=p.target.value;this._quickLabelState={...this._quickLabelState,text:g}}}>
                        </ha-input>
                    </div>
                </div>
            </div>
        `}_renderConnectLineHint(){if(this._activeMode!==R.CONNECT_LINE)return"";const e=this._connectLineState.source?"Click a target anchor/control point to connect · Esc to cancel":"Click a source anchor/control point to start · Esc to cancel";return v`
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 1000;">
                ${this._renderModeHintLabel(e)}
            </div>
        `}_renderDrawShapeOverlay(){if(this._activeMode!==R.DRAW_SHAPE||!this._drawShapeState.drawing)return"";const{kind:e,points:t,currentPoint:i}=this._drawShapeState,o=e==="polyline"?"Click to add point · Enter/dbl-click to finish · Esc to cancel":"Drag, or click twice, to draw · Esc to cancel",r=this._renderModeHintLabel(o),s=this._getViewBoxToPixelConverter();if(!s)return"";if(e==="polyline"){if(t.length===0)return"";const b=t.map(F=>s(F[0],F[1])),w=b.map((F,L)=>`${L===0?"M":"L"} ${F[0]} ${F[1]}`).join(" "),S=b[b.length-1],C=i?(()=>{const[F,L]=s(i[0],i[1]);return`M ${S[0]} ${S[1]} L ${F} ${L}`})():"",D=b.map(F=>`<circle cx="${F[0]}" cy="${F[1]}" r="4" fill="#00FFFF" />`).join(""),M=C?`<path d="${C}" fill="none" stroke="#00FFFF" stroke-width="2" stroke-dasharray="5,5" />`:"",k=`<path d="${w}" fill="none" stroke="#00FFFF" stroke-width="2" />${D}${M}`;return v`
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 1000;">
                    <svg style="width: 100%; height: 100%; position: absolute;">
                        ${xe(k)}
                    </svg>
                    ${r}
                </div>
            `}if(!i)return v`
                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 1000;">
                    ${r}
                </div>
            `;const[a,l]=s(t[0][0],t[0][1]),[d,c]=s(i[0],i[1]),u=Math.min(a,d),p=Math.min(l,c),g=Math.abs(d-a),_=Math.abs(c-l),f=e==="circle"?`<ellipse
                    cx="${u+g/2}px" cy="${p+_/2}px"
                    rx="${g/2}px" ry="${_/2}px"
                    fill="rgba(0, 255, 255, 0.2)" stroke="#00FFFF" stroke-width="2" stroke-dasharray="5,5" />`:`<rect
                    x="${u}px" y="${p}px" width="${g}px" height="${_}px"
                    fill="rgba(0, 255, 255, 0.2)" stroke="#00FFFF" stroke-width="2" stroke-dasharray="5,5" />`;return v`
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 1000;">
                <svg style="width: 100%; height: 100%; position: absolute;">
                    ${xe(f)}
                </svg>
                ${r}
            </div>
        `}_getDebugSettings(){const e={...this._debugSettings,grid:this._showGrid,gridSpacing:this._gridSpacing,grid_spacing:this._gridSpacing,snap_to_grid:this._snapToGrid,routing_channels:true,highlighted_anchor:this._highlightedAnchor};return this._activeTab===Z.CONTROLS&&(e.bounding_boxes=true),e}_updateDebugSetting(e,t){this._debugSettings={...this._debugSettings,[e]:t},this._schedulePreviewUpdate(),this.requestUpdate()}_renderControlsTab(){const e=this._getControlOverlays(),t=e.length;return v`
            <div style="padding: 8px;">
                <!-- Control Actions & Visualization Helpers -->
                <div style="display: flex; gap: 8px; margin-bottom: 16px; align-items: center;">
                    <ha-button @click=${this._openControlForm}>
                        <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                        Add Control
                    </ha-button>
                    <ha-button @click=${async i=>{i.stopPropagation(),await this._setMode("place_control")}}
                               ?disabled=${this._activeMode===R.PLACE_CONTROL}>
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

                ${this._renderStyleClipboardBar("label")}
                <!-- Controls Management -->
                <lcards-form-section
                    header="Control Overlays"
                    description="Home Assistant cards positioned on the MSD canvas"
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
        `}_getControlOverlays(){var t;return(((t=this._workingConfig.msd)==null?void 0:t.overlays)||[]).filter(i=>i.type==="control")}_resolveEditorControlPosition(e,t,i=new Set){const o=e.position??e.anchor;if(Array.isArray(o))return o;if(typeof o!="string")return null;if(t&&t[o])return t[o];if(i.has(e.id))return null;i.add(e.id);const r=this._getControlOverlays().find(_=>_.id===o);if(!r)return null;const s=this._resolveEditorControlPosition(r,t,i);if(!s)return null;const[a,l]=r.size||[100,100],d={"top-left":[0,0],top:[-a/2,0],"top-right":[-a,0],left:[0,-l/2],center:[-a/2,-l/2],right:[-a,-l/2],"bottom-left":[0,-l],bottom:[-a/2,-l],"bottom-right":[-a,-l]},c=d[r.attachment||"center"]||d["top-left"],u=s[0]+c[0],p=s[1]+c[1],g={center:[u+a/2,p+l/2],top:[u+a/2,p],bottom:[u+a/2,p+l],left:[u,p+l/2],right:[u+a,p+l/2],"top-left":[u,p],"top-right":[u+a,p],"bottom-left":[u,p+l],"bottom-right":[u+a,p+l]};return g[e.position_side||"center"]||g.center}_getRoutingModeInfo(e){const t={auto:{title:"Auto (Recommended)",icon:"mdi:auto-fix",description:"Always uses full pathfinding: automatically avoids obstacles, bundles with nearby parallel lines into shared trunks, and avoids crossing other lines, whether or not obstacles or channels are present. Best for most use cases. See Bundling and Crossing Avoidance below for how those two behaviors work.",diagram:v`
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
                `},angled:{title:"Angled (Leader Line)",icon:"mdi:vector-polyline",description:"A short straight stub out of the anchor side (and into the attach side when set), then one straight run at any angle between them, like a callout leader line. No pathfinding: obstacles and other lines are ignored. Stub length: stub_length.",diagram:v`
                    <svg viewBox="0 0 200 80" style="width: 100%; height: auto;">
                        <!-- Source -->
                        <rect x="10" y="45" width="30" height="30" fill="var(--lcars-blue)" rx="4"/>
                        <!-- Target -->
                        <rect x="160" y="5" width="30" height="30" fill="var(--lcars-green)" rx="4"/>
                        <!-- Stub, angled run, stub -->
                        <path d="M 40 60 L 60 60 L 140 20 L 160 20"
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
        `}_toggleOverlayLocked(e){var r;const t=[...((r=this._workingConfig.msd)==null?void 0:r.overlays)||[]],i=t.findIndex(s=>s.id===e.id);if(i===-1)return;const o={...t[i]};o.locked?delete o.locked:o.locked=true,t[i]=o,this._setNestedValue("msd.overlays",t)}_renderControlItem(e){var a;const t=e.id||"unnamed",i=((a=e.card)==null?void 0:a.type)||"unknown",o=e.position||e.anchor||"not set",r=Array.isArray(o)?`[${o[0]}, ${o[1]}]`:o;e.card&&e.card.type;const s=e.locked===true;return v`
            <div class="list-item-card ${s?"locked":""}">
                <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                    <ha-icon icon="mdi:card-outline" style="--mdc-icon-size: 32px; color: var(--primary-color); flex-shrink: 0;"></ha-icon>
                    <div style="flex: 1; min-width: 140px;">
                        <div style="font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                            ${t}
                            ${s?v`<ha-icon icon="mdi:lock" style="--mdc-icon-size: 16px; color: var(--secondary-text-color);" title="Locked"></ha-icon>`:""}
                        </div>
                        <div style="font-size: 12px; color: var(--secondary-text-color); font-family: monospace; word-break: break-word;">
                            ${i} @ ${r}
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px; flex-shrink: 0; margin-left: auto;">
                        <ha-icon-button
                            @click=${()=>this._toggleOverlayLocked(e)}
                            .label=${s?"Unlock":"Lock"}>
                            <ha-icon icon="mdi:${s?"lock":"lock-open-variant"}"></ha-icon>
                        </ha-icon-button>
                        <ha-icon-button
                            @click=${()=>this._editControl(e)}
                            .label=${"Edit"}
                            .path=${"M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"}>
                        </ha-icon-button>
                        ${this._renderStyleClipboardButtons(e)}
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
            ${_e({header:"About control overlays",body:v`
                    <ul>
                        <li>Control overlays are Home Assistant cards (buttons, entities, custom cards) placed on the MSD.</li>
                        <li>Place them by anchor or by coordinates.</li>
                        <li>Lines can connect them, for visual flow.</li>
                        <li>For example: a button card at anchor <code>warp_drive</code> showing its power state.</li>
                    </ul>
                `})}
        `}_openControlForm(){var o;const e=((o=this._workingConfig.msd)==null?void 0:o.overlays)||[];let t=e.filter(r=>r.type==="control").length+1,i=`control_${t}`;for(;e.find(r=>r.id===i);)t++,i=`control_${t}`;this._editingControlId=i,this._controlFormId=i,this._controlFormPosition=[0,0],this._controlFormSize=[100,100],this._controlFormAttachment="center",this._controlFormPositionSide="center",this._controlFormObstacle=true,this._controlFormZIndex=null,this._controlFormLocked=false,this._controlFormTriggersUpdateMode="specific",this._controlFormTriggersUpdateEntities=[],this._controlFormTriggersUpdateExpanded=false,this._controlFormCard={type:""},this._controlFormAnimations=[],this._controlFormActiveSubtab="placement",this._showControlForm=true,this.requestUpdate()}_editControl(e){this._editingControlId=e.id,this._controlFormId=e.id,this._controlFormPosition=e.position||e.anchor||[0,0],this._controlFormSize=e.size||[100,100],this._controlFormAttachment=e.attachment||"center",this._controlFormPositionSide=e.position_side||"center",this._controlFormObstacle=e.obstacle===true,this._controlFormZIndex=e.z_index??null,this._controlFormLocked=e.locked===true,this._controlFormTriggersUpdateMode=e.triggers_update==="all"?"all":"specific",this._controlFormTriggersUpdateEntities=Array.isArray(e.triggers_update)?e.triggers_update:[],this._controlFormTriggersUpdateExpanded=this._controlFormTriggersUpdateMode==="all"||this._controlFormTriggersUpdateEntities.length>0,this._controlFormCard=e.card||{type:""},this._controlFormAnimations=e.animations||[],this._controlFormActiveSubtab="placement",this._showControlForm=true,this.requestUpdate()}_duplicateControl(e){var s;const t=((s=this._workingConfig.msd)==null?void 0:s.overlays)||[];let i=t.filter(a=>a.type==="control").length+1,o=`control_${i}`;for(;t.find(a=>a.id===o);)i++,o=`control_${i}`;const r={...JSON.parse(JSON.stringify(e)),id:o};this._setNestedValue("msd.overlays",[...t,r]),this._editControl(r)}_highlightControlInPreview(e){this._highlightedControl=e.id,this._debugSettings={...this._debugSettings,bounding_boxes:true,highlighted_control:e.id},this._schedulePreviewUpdate(),this.requestUpdate(),setTimeout(()=>{this._highlightedControl=null;const{highlighted_control:t,...i}=this._debugSettings;this._debugSettings=i,this._schedulePreviewUpdate(),this.requestUpdate()},2500)}async _deleteControl(e){var r;if(!await this._showConfirmDialog("Delete Control",`Delete control "${e.id}"? This will remove the overlay and its configuration.`))return;const i=[...((r=this._workingConfig.msd)==null?void 0:r.overlays)||[]],o=i.findIndex(s=>s.id===e.id);o>-1&&(i.splice(o,1),this._setNestedValue("msd.overlays",i))}_saveControl(){var a,l,d;const e=[...((a=this._workingConfig.msd)==null?void 0:a.overlays)||[]],t=this._editingControlId?e.findIndex(c=>c.id===this._editingControlId):-1,i=t>=0?e[t]:null,o=this._controlFormTriggersUpdateMode==="all"?"all":(l=this._controlFormTriggersUpdateEntities)!=null&&l.length?[...this._controlFormTriggersUpdateEntities]:void 0,r={...i||{},type:"control",id:this._controlFormId,position:this._controlFormPosition,size:this._controlFormSize,attachment:this._controlFormAttachment,obstacle:this._controlFormObstacle||void 0,z_index:this._controlFormZIndex??void 0,locked:this._controlFormLocked||void 0,triggers_update:o,card:this._controlFormCard,animations:(d=this._controlFormAnimations)!=null&&d.length?this._controlFormAnimations:void 0};typeof this._controlFormPosition=="string"&&e.some(c=>c.type==="control"&&c.id===this._controlFormPosition)&&this._controlFormPositionSide&&this._controlFormPositionSide!=="center"?r.position_side=this._controlFormPositionSide:delete r.position_side,t>=0?e[t]=r:e.push(r),this._setNestedValue("msd.overlays",e),this._closeControlForm()}_closeControlForm(){this._showControlForm=false,this._editingControlId=null,this.requestUpdate()}_handleControlFormTabChange(e){var i;e.stopPropagation();const t=(i=e.target.activeTab)==null?void 0:i.getAttribute("value");t&&(this._controlFormActiveSubtab=t,this.requestUpdate())}_renderControlFormDialog(){var i;const t=!!this._editingControlId&&(((i=this._workingConfig.msd)==null?void 0:i.overlays)||[]).some(o=>o.id===this._editingControlId)?`Edit Control: ${this._controlFormId}`:"Add Control";return v`
            <ha-dialog
                class="subform-dialog"
                open
                @closed=${o=>{o.stopPropagation(),o.target===o.currentTarget&&this._closeControlForm()}}
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

                <ha-dialog-footer slot="footer">
                    <ha-button slot="secondaryAction" @click=${this._closeControlForm} appearance="plain">
                        <ha-icon icon="mdi:close" slot="start"></ha-icon>
                        Cancel
                    </ha-button>
                    <ha-button slot="primaryAction" @click=${this._saveControl}>
                        <ha-icon icon="mdi:content-save" slot="start"></ha-icon>
                        Save
                    </ha-button>
                </ha-dialog-footer>
            </ha-dialog>
        `}_getAllAvailableAnchors(){var o,r;const e=this._getBaseSvgAnchors()||{},t=((o=this._workingConfig.msd)==null?void 0:o.anchors)||{},i=(((r=this._workingConfig.msd)==null?void 0:r.overlays)||[]).filter(s=>s.type==="control"&&s.id!==this._editingControlId).map(s=>s.id);return{...e,...t,...Object.fromEntries(i.map(s=>[s,null]))}}_renderControlFormPlacement(){var s,a;const e=this._getAllAvailableAnchors(),t=[{value:"",label:"Use Coordinates"},...Object.keys(e).sort().map(l=>({value:l,label:l}))],i=typeof this._controlFormPosition=="string",o=i?this._controlFormPosition:"",r=i&&(((s=this._workingConfig.msd)==null?void 0:s.overlays)||[]).some(l=>l.type==="control"&&l.id===o);return v`
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
                            @value-changed=${l=>{const d={"top-center":"top","bottom-center":"bottom","center-left":"left","center-right":"right"};this._controlFormAttachment=d[l.detail.value]||l.detail.value,this.requestUpdate()}}>
                        </lcards-position-picker>
                    </div>

                    ${r?v`
                        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--divider-color);">
                            <lcards-position-picker
                                .value=${this._controlFormPositionSide||"center"}
                                .label=${"Target Attachment Point"}
                                .helper=${`Which point of "${o}" to attach to (instead of its center)`}
                                @value-changed=${l=>{const d={"top-center":"top","bottom-center":"bottom","center-left":"left","center-right":"right"};this._controlFormPositionSide=d[l.detail.value]||l.detail.value,this.requestUpdate()}}>
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
                        @input=${l=>{const d=l.target.value;this._controlFormZIndex=d===""?null:Number(d),this.requestUpdate()}}
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
                                    @value-changed=${r=>{r.detail.isValid&&(this._controlFormCard=r.detail.value,this.requestUpdate())}}>
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
                                    @value-changed=${r=>{r.detail.isValid&&(this._controlFormCard=r.detail.value,this.requestUpdate())}}>
                                </ha-yaml-editor>
                            `}
                        </div>
                    </lcards-form-section>
                `:v`
                    <!-- Card Picker Button (opens in editor context) -->
                    <div style="padding: 16px; background: var(--card-background-color); border-radius: 8px; text-align: center;">
                        <div style="margin-bottom: 12px; font-weight: 500;">Quick Add Card</div>
                        <ha-button
                            @click=${async()=>{try{const r=await this._requestCardFromPicker("control");r&&(this._controlFormCard=r,this._previousCardConfig=null,m.debug("[MSDStudio] Card selected:",r),this.requestUpdate())}catch(r){m.error("[MSDStudio] Card picker failed:",r)}}}>
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
                                .selector=${{select:{mode:"dropdown",custom_value:i.length>=10,options:i.map(r=>({value:r.type,label:r.name,icon:r.icon}))}}}
                                .value=${e}
                                .label=${"Card Type"}
                                @keydown=${r=>{r.key==="Escape"&&r.stopPropagation()}}
                                @value-changed=${r=>{const s=r.detail.value;s&&this._selectCardType(s)}}>
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
        `}async _createPreviewCardInTab(e,t){var o;const i=(o=this.shadowRoot)==null?void 0:o.getElementById(e);if(!i){m.trace("[MSDStudio] Preview container not found:",e);return}i.innerHTML="";try{const r=t.type,s=di(r);if(!s)throw new Error(`No card type given (${r})`);m.trace("[MSDStudio] Creating preview card in tab:",{cardType:r,normalizedType:s});let a=null;if(customElements.get(s))a=document.createElement(s),m.trace("[MSDStudio] Preview card created via createElement:",s);else if(i.innerHTML='<div style="padding: 20px; text-align: center; color: var(--secondary-text-color);">Loading card...</div>',await new Promise(l=>setTimeout(l,500)),customElements.get(s))a=document.createElement(s);else throw new Error(`Card type "${r}" not registered`);if(!a)throw new Error(`Failed to create card element for type: ${r}`);if(this.hass&&(a.hass=this.hass),typeof a.setConfig=="function")a.setConfig(t),m.trace("[MSDStudio] Preview card config set successfully");else{m.warn("[MSDStudio] Preview card has no setConfig method:",s),i.innerHTML='<div style="padding: 20px; text-align: center; color: var(--warning-color);">Card does not support configuration</div>';return}a.style.width="100%",a.style.display="block",i.innerHTML="",i.appendChild(a),m.trace("[MSDStudio] Preview card mounted successfully in tab")}catch(r){m.error("[MSDStudio] Failed to create preview card in tab:",r),i.innerHTML=`<div style="padding: 20px; text-align: center; color: var(--error-color);">
                <ha-icon icon="mdi:alert-circle" style="--mdc-icon-size: 32px; display: block; margin: 0 auto 8px;"></ha-icon>
                <strong>Preview Error</strong><br/>
                <span style="font-size: 12px;">${r.message}</span>
            </div>`}}_getAvailableCardTypes(){const e=[],t=[{type:"entities",name:"Entities",icon:"mdi:format-list-bulleted"},{type:"button",name:"Button",icon:"mdi:gesture-tap-button"},{type:"entity",name:"Entity",icon:"mdi:card-bulleted"},{type:"glance",name:"Glance",icon:"mdi:view-dashboard"},{type:"light",name:"Light",icon:"mdi:lightbulb"},{type:"thermostat",name:"Thermostat",icon:"mdi:thermostat"},{type:"sensor",name:"Sensor",icon:"mdi:eye"},{type:"gauge",name:"Gauge",icon:"mdi:gauge"},{type:"markdown",name:"Markdown",icon:"mdi:language-markdown"},{type:"media-control",name:"Media Control",icon:"mdi:play-circle"},{type:"weather-forecast",name:"Weather",icon:"mdi:weather-partly-cloudy"},{type:"history-graph",name:"History Graph",icon:"mdi:chart-line"},{type:"statistics-graph",name:"Statistics Graph",icon:"mdi:chart-box"},{type:"picture",name:"Picture",icon:"mdi:image"},{type:"picture-entity",name:"Picture Entity",icon:"mdi:image-frame"},{type:"picture-glance",name:"Picture Glance",icon:"mdi:view-carousel"},{type:"grid",name:"Grid",icon:"mdi:grid"},{type:"horizontal-stack",name:"Horizontal Stack",icon:"mdi:view-column"},{type:"vertical-stack",name:"Vertical Stack",icon:"mdi:view-sequential"},{type:"conditional",name:"Conditional",icon:"mdi:eye-check"},{type:"iframe",name:"iFrame",icon:"mdi:application-brackets"},{type:"map",name:"Map",icon:"mdi:map"},{type:"logbook",name:"Logbook",icon:"mdi:format-list-text"},{type:"humidifier",name:"Humidifier",icon:"mdi:air-humidifier"},{type:"alarm-panel",name:"Alarm Panel",icon:"mdi:shield-home"},{type:"area",name:"Area",icon:"mdi:texture-box"},{type:"tile",name:"Tile",icon:"mdi:view-dashboard-variant"},{type:"manual",name:"Manual (YAML)",icon:"mdi:code-braces"}];return e.push(...t),window.customCards&&window.customCards.filter(i=>{var o;return!((o=i.type)!=null&&o.startsWith("custom:lcards-"))}).forEach(i=>{e.push({type:i.type,name:i.name||i.type,icon:"mdi:puzzle"})}),e}_selectCardType(e){if(m.debug("[MSDStudio] Card type selected:",e),e==="manual"){this._controlFormCard={type:""},this._cardConfigMode="yaml",this.requestUpdate();return}const t=this._normalizeCardTypeForConfig(e),i=this._getCardStubConfig(t);this._controlFormCard=i,this._previousCardConfig=null,this.requestUpdate()}_cancelCardTypeChange(){this._previousCardConfig&&(m.debug("[MSDStudio] Restoring previous card config:",this._previousCardConfig),this._controlFormCard={...this._previousCardConfig},this._previousCardConfig=null,this.requestUpdate())}_normalizeCardTypeForConfig(e){return e==="manual"||e.startsWith("custom:")?e:e.includes("-")&&!Co(e)?`custom:${e}`:e}_getCardStubConfig(e){var t;try{const i=e.startsWith("custom:")?e.substring(7):`hui-${e}-card`,o=(t=window.customElements)==null?void 0:t.get(i);if(o&&typeof o.getStubConfig=="function")return o.getStubConfig()}catch{}return{type:e}}_handleCardPicked(e){var o,r;if(e.stopPropagation(),m.debug("[MSDStudio] Card picked from hui-card-picker:",e.detail),!((r=(o=e.detail)==null?void 0:o.config)!=null&&r.type)){m.warn("[MSDStudio] Invalid card picked:",e.detail);return}const t=e.detail.config,i=this._getEnhancedStubConfig(t);this._controlFormCard=i,this._previousCardConfig=null,m.debug("[MSDStudio] Card set to:",this._controlFormCard),this.requestUpdate()}async _requestCardFromPicker(e="control"){return new Promise((t,i)=>{const o=++this._cardPickerRequestId;this._pendingCardPickerRequests.set(o,{resolve:t,reject:i,context:e}),m.debug("[MSDStudio] Requesting card picker:",{requestId:o,context:e});const r=new CustomEvent("open-card-picker",{bubbles:true,composed:true,detail:{requestId:o,context:e}});this.dispatchEvent(r),setTimeout(()=>{this._pendingCardPickerRequests.has(o)&&(this._pendingCardPickerRequests.delete(o),i(new Error("Card picker request timed out")))},6e4)})}_handleCardPickerResult(e){const{requestId:t,context:i,config:o}=e.detail;m.debug("[MSDStudio] Card picker result received:",{requestId:t,context:i,type:o==null?void 0:o.type});const r=this._pendingCardPickerRequests.get(t);if(r){this._pendingCardPickerRequests.delete(t);const s=this._getEnhancedStubConfig(o);r.resolve(s)}else m.warn("[MSDStudio] Received result for unknown requestId:",t)}_getEnhancedStubConfig(e){try{const t=e.type,i=t.startsWith("custom:")?t.substring(7):`hui-${t}-card`,o=customElements.get(i);if(o&&typeof o.getStubConfig=="function"){const r=o.getStubConfig();return m.debug("[MSDStudio] Using card stub config from:",i,r),{...r,...e}}}catch(t){m.warn("[MSDStudio] Failed to get stub config:",t)}return e}_resetCardPicker(){this._controlFormCard={type:""},this.requestUpdate()}_getCardTypeName(e){return e?e.replace(/^custom:/,""):"Unknown"}_getCardIcon(e){if(!e)return"mdi:card-outline";const t={button:"mdi:gesture-tap-button",entities:"mdi:format-list-bulleted",entity:"mdi:card-bulleted",glance:"mdi:view-dashboard",light:"mdi:lightbulb",thermostat:"mdi:thermostat","media-control":"mdi:play-circle","weather-forecast":"mdi:weather-partly-cloudy",sensor:"mdi:eye",gauge:"mdi:gauge","history-graph":"mdi:chart-line",markdown:"mdi:language-markdown",picture:"mdi:image","picture-entity":"mdi:image-frame","picture-glance":"mdi:view-carousel",conditional:"mdi:eye-check",map:"mdi:map","custom:lcards-button":"mdi:gesture-tap-button","custom:lcards-gauge":"mdi:gauge","custom:lcards-slider":"mdi:tune","custom:lcards-label":"mdi:label","custom:lcards-chart":"mdi:chart-line"},i=e.replace(/^custom:/,"");return t[e]||t[i]||"mdi:puzzle"}_getRealLovelace(){try{let e=document.querySelector("home-assistant");if(e=e&&e.shadowRoot,e=e&&e.querySelector("home-assistant-main"),e=e&&e.shadowRoot,e=e&&e.querySelector("app-drawer-layout partial-panel-resolver, ha-drawer partial-panel-resolver"),e=e&&e.shadowRoot||e,e=e&&e.querySelector("ha-panel-lovelace"),e=e&&e.shadowRoot,e=e&&e.querySelector("hui-root"),e&&e.lovelace)return e.lovelace}catch(e){m.warn("[MSDStudio] Failed to get real Lovelace:",e)}return null}_getLovelace(){var i,o,r,s,a;if((o=(i=this.hass)==null?void 0:i.connection)!=null&&o.lovelace)return m.debug("[MSDStudio] Got Lovelace from hass.connection"),this.hass.connection.lovelace;const e=document.querySelector("home-assistant");if(e){const l=(a=(s=(r=e.shadowRoot)==null?void 0:r.querySelector("home-assistant-main"))==null?void 0:s.shadowRoot)==null?void 0:a.querySelector("ha-panel-lovelace");if(l!=null&&l.lovelace)return m.debug("[MSDStudio] Got Lovelace from ha-panel-lovelace"),l.lovelace;if(e.lovelace)return m.debug("[MSDStudio] Got Lovelace from home-assistant element"),e.lovelace}if(window.lovelace)return m.warn("[MSDStudio] Using deprecated window.lovelace"),window.lovelace;const t=this._getRealLovelace();return t?(m.debug("[MSDStudio] Got Lovelace from _getRealLovelace()"),t):(m.error("[MSDStudio] Could not access Lovelace instance"),null)}_openCardEditorModal(){this._cardEditorTempConfig=JSON.parse(JSON.stringify(this._controlFormCard)),this._showCardEditorForm=true,m.debug("[MSDStudio] Opening card editor form with config:",this._cardEditorTempConfig),this.requestUpdate()}_closeCardEditorForm(){this._showCardEditorForm=false,this._cardEditorTempConfig=null,this.requestUpdate()}_saveCardEditorForm(){var t;let e=this._cardEditorTempConfig;(!e||!e.type)&&(m.error("[MSDStudio] Invalid card config from card editor form - missing type:",e),(t=this._controlFormCard)!=null&&t.type&&(e={...e,type:this._controlFormCard.type})),this._controlFormCard=JSON.parse(JSON.stringify(e)),m.debug("[MSDStudio] Card config saved:",this._controlFormCard),this._closeCardEditorForm()}_handleCardEditorConfigChanged(e){var i,o;const t=((i=e.detail)==null?void 0:i.config)??((o=e.detail)==null?void 0:o.value);t&&typeof t=="object"&&!Array.isArray(t)&&t.type?(this._cardEditorTempConfig=t,m.trace("[MSDStudio] Card editor form config updated:",t),this.requestUpdate()):m.warn("[MSDStudio] Ignoring invalid card config from editor:",t)}_renderCardEditorFormDialog(){const e=this._getLovelace();return v`
            <ha-dialog
                class="subform-dialog"
                open
                @closed=${t=>{t.stopPropagation(),t.target===t.currentTarget&&this._closeCardEditorForm()}}
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

                <ha-dialog-footer slot="footer">
                    <ha-button slot="secondaryAction" @click=${this._closeCardEditorForm} appearance="plain">
                        <ha-icon icon="mdi:close" slot="start"></ha-icon>
                        Cancel
                    </ha-button>
                    <ha-button slot="primaryAction" @click=${this._saveCardEditorForm}>
                        <ha-icon icon="mdi:content-save" slot="start"></ha-icon>
                        Save
                    </ha-button>
                </ha-dialog-footer>
            </ha-dialog>
        `}_renderCardEditorPreview(){var e;return(e=this._cardEditorTempConfig)!=null&&e.type?customElements.get("hui-card")?v`
            <div class="card-editor-preview-surface">
                <hui-card
                    .hass=${this.hass}
                    .config=${this._cardEditorTempConfig}
                    .preview=${true}>
                </hui-card>
            </div>
        `:v`<lcards-message type="warning">Live preview unavailable in this context.</lcards-message>`:v`<lcards-message type="info">Select a card type to see a preview.</lcards-message>`}_debugHAComponents(){var o,r,s;const e=customElements.get("hui-card-picker"),t=customElements.get("hui-card-element-editor"),i=this._getLovelace();m.debug("[MSDStudio] HA Component State:",{haComponentsAvailable:this._haComponentsAvailable,HuiCardPicker:!!e,HuiCardElementEditor:!!t,lovelace:!!i,lovelaceConfig:i!=null&&i.config?"present":"missing",lovelaceResources:((r=(o=i==null?void 0:i.config)==null?void 0:o.resources)==null?void 0:r.length)||0,hass:!!this.hass,hassStates:Object.keys(((s=this.hass)==null?void 0:s.states)||{}).length}),i||(m.error("[MSDStudio] Lovelace not accessible - tried:"),m.error("  - hass.connection.lovelace"),m.error("  - ha-panel-lovelace.lovelace"),m.error("  - home-assistant.lovelace"),m.error("  - window.lovelace"),m.error("  - _getRealLovelace()"))}_renderControlPreview(){var s;const e=this._controlFormPosition,t=this._controlFormSize,i=this._controlFormAttachment,o=((s=this._controlFormCard)==null?void 0:s.type)||"none",r=typeof e=="string"?`Anchor: ${e}`:`Coords: [${e[0]}, ${e[1]}]`;return v`
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
                        <span>${r}</span>
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
        `}async _createPreviewCard(e,t){var o;const i=(o=this.shadowRoot)==null?void 0:o.getElementById(e);if(!i){m.warn("[MSD Studio] Preview container not found:",e);return}i.innerHTML="";try{const r=t.type,s=di(r);if(!s)throw new Error(`No card type given (${r})`);m.debug("[MSD Studio] Creating preview card:",{cardType:r,normalizedType:s});let a=null;if(window.customElements&&window.customElements.get(s)){const l=window.customElements.get(s);a=new l,m.debug("[MSD Studio] Card created via customElements.get:",s)}else a=document.createElement(s),m.debug("[MSD Studio] Card created via createElement:",s),await new Promise(l=>setTimeout(l,100));if(!a)throw new Error(`Failed to create card element for type: ${r}`);if(this.hass&&(a.hass=this.hass),typeof a.setConfig=="function")a.setConfig(t),m.debug("[MSD Studio] Card config set successfully");else{m.warn("[MSD Studio] Card element has no setConfig method:",s),i.innerHTML='<div style="padding: 8px; color: var(--error-color); font-size: 11px;">Card does not support configuration</div>';return}a.style.width="100%",a.style.height="100%",a.style.display="block",i.appendChild(a),m.debug("[MSD Studio] Card preview mounted successfully")}catch(r){m.error("[MSD Studio] Failed to create card preview:",r),i.innerHTML=`<div style="padding: 8px; color: var(--error-color); font-size: 11px;">Error: ${r.message}</div>`}}_renderLinesTab(){const e=this._getLineOverlays(),t=e.length;return v`
            <div style="padding: 8px;">
                <!-- Line Actions & Visualization Helpers -->
                <div style="display: flex; gap: 8px; margin-bottom: 16px; align-items: center;">
                    <ha-button @click=${this._openLineForm}>
                        <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                        Add Line
                    </ha-button>
                    <ha-button @click=${async i=>{i.stopPropagation(),await this._setMode("connect_line")}}
                               ?disabled=${this._activeMode===R.CONNECT_LINE}>
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

                ${this._renderStyleClipboardBar("line")}
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
            ${_e({header:"About shape overlays",body:v`
                    <ul>
                        <li>Shapes draw free geometry on the MSD: polylines (walls, connectors), rectangles and circles (rooms, zones).</li>
                        <li>Draw them with the Polyline, Rectangle and Circle buttons on the canvas toolbar.</li>
                        <li>Select a shape to drag its points or resize handles on the canvas.</li>
                        <li>They style like lines: dashed or gradient strokes, state-based fill, animations and rules.</li>
                        <li>Lines can attach to a shape's corners or vertices, as they do to controls.</li>
                    </ul>
                `})}
        `}_hasBaseSvgContent(){var t,i;const e=(i=(t=this._workingConfig.msd)==null?void 0:t.base_svg)==null?void 0:i.source;return!!e&&e!=="none"}_defaultShieldBubbleState(){return{active:false,loading:false,dilateRadius:18,simplifyTolerance:4,roundness:0,mode:"single",sectionCount:4,startAngleDeg:0,rawPoints:null,rawW:0,rawH:0,rawViewBox:null,points:null,error:null}}async _openShieldBubblePanel(){this._shieldBubbleState={...this._shieldBubbleState,active:true,error:null},await this._regenerateShieldBubblePreview()}_recomputeShieldBubblePoints(){var r;const e=this._shieldBubbleState;if(!((r=e.rawPoints)!=null&&r.length))return;const t=fe.simplifyClosedPolyline(e.rawPoints,e.simplifyTolerance),i=fe.blendTowardEllipse(t,e.roundness),o=fe.mapRasterPointsToViewBox(i,e.rawViewBox,e.rawW,e.rawH);this._shieldBubbleState={...this._shieldBubbleState,points:o}}async _regenerateShieldBubblePreview(){var t,i;const e=(i=(t=this._workingConfig.msd)==null?void 0:t.base_svg)==null?void 0:i.source;if(!(!e||e==="none")){if(this._shieldBubbleState.loading){this._shieldBubblePendingRegenerate=true;return}this._shieldBubbleState={...this._shieldBubbleState,loading:true,error:null},this.requestUpdate(),await new Promise(o=>setTimeout(o,0));try{const{getSvgContent:o,getSvgViewBox:r}=await import("./lcards-main-Dyh7t6jw.js").then(p=>p.e3),s=o(e);if(!s)throw new Error("Base SVG not yet loaded");const a=r(s),{points:l,W:d,H:c,viewBox:u}=await fe.analyzeShieldBubbleRaw(s,a,{dilateRadius:this._shieldBubbleState.dilateRadius});this._shieldBubbleState={...this._shieldBubbleState,rawPoints:l,rawW:d,rawH:c,rawViewBox:u,loading:false},this._recomputeShieldBubblePoints()}catch(o){m.error("[MSDStudio] Shield-bubble generation failed:",o),this._shieldBubbleState={...this._shieldBubbleState,loading:false,error:o.message,points:null,rawPoints:null}}this.requestUpdate(),this._shieldBubblePendingRegenerate&&(this._shieldBubblePendingRegenerate=false,await this._regenerateShieldBubblePreview())}}_cancelShieldBubble(){this._shieldBubbleState={...this._shieldBubbleState,active:false,points:null,error:null,rawPoints:null,rawW:0,rawH:0,rawViewBox:null}}_shieldSectionNames(e){return e===4?["shield_fore","shield_starboard","shield_aft","shield_port"]:Array.from({length:e},(t,i)=>`shield_section_${i+1}`)}_generateUniqueOverlayId(e){var o;const t=((o=this._workingConfig.msd)==null?void 0:o.overlays)||[];if(!t.find(r=>r.id===e))return e;let i=2;for(;t.find(r=>r.id===`${e}_${i}`);)i++;return`${e}_${i}`}_acceptShieldBubble(){var s,a;const e=this._shieldBubbleState;if(!((s=e==null?void 0:e.points)!=null&&s.length))return;const t=((a=this._workingConfig.msd)==null?void 0:a.overlays)||[],i=[],o={color:{default:"var(--lcars-orange)"},width:2,opacity:.9,fill:{default:"none"},fill_opacity:1},r=h(()=>({...o,color:{...o.color},fill:{...o.fill}}),"cloneStyle");if(e.mode==="single")i.push({type:"shape",kind:"polyline",id:this._generateUniqueOverlayId("shield_bubble"),points:e.points,closed:true,style:r()});else{const l=fe.splitBoundaryIntoSections(e.points,e.sectionCount,{startAngleDeg:e.startAngleDeg}),d=this._shieldSectionNames(e.sectionCount);l.forEach((c,u)=>{i.push({type:"shape",kind:"polyline",id:this._generateUniqueOverlayId(d[u]),points:c,closed:false,style:r()})})}this._setNestedValue("msd.overlays",[...t,...i]),this._shieldBubbleState=this._defaultShieldBubbleState()}_renderShieldBubblePanel(){var i,o,r;const e=this._shieldBubbleState,t=e.mode==="sections"&&((i=e.points)!=null&&i.length)?fe.splitBoundaryIntoSections(e.points,e.sectionCount,{startAngleDeg:e.startAngleDeg}):null;return v`
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
                        @value-changed=${s=>{this._shieldBubbleState={...this._shieldBubbleState,mode:s.detail.value},this.requestUpdate()}}>
                    </ha-selector>

                    ${e.mode==="sections"?v`
                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{number:{mode:"box",min:2,max:16,step:1}}}
                            .value=${e.sectionCount}
                            .label=${"Section count"}
                            @value-changed=${s=>{this._shieldBubbleState={...this._shieldBubbleState,sectionCount:Number(s.detail.value)},this.requestUpdate()}}>
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{number:{mode:"box",min:-180,max:180,step:1}}}
                            .value=${e.startAngleDeg}
                            .label=${"Section start angle (° from bow, clockwise)"}
                            @value-changed=${s=>{this._shieldBubbleState={...this._shieldBubbleState,startAngleDeg:Number(s.detail.value)},this.requestUpdate()}}>
                        </ha-selector>
                    `:""}

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{number:{mode:"box",min:0,max:100,step:1}}}
                        .value=${e.dilateRadius}
                        .label=${"Dilate radius (px offset from hull)"}
                        @value-changed=${s=>{this._shieldBubbleState={...this._shieldBubbleState,dilateRadius:Number(s.detail.value)},this.requestUpdate()}}>
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
                            @input=${s=>{this._shieldBubbleState={...this._shieldBubbleState,simplifyTolerance:parseFloat(s.target.value)},this._recomputeShieldBubblePoints(),this.requestUpdate()}}>
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
                            @input=${s=>{this._shieldBubbleState={...this._shieldBubbleState,roundness:parseFloat(s.target.value)},this._recomputeShieldBubblePoints(),this.requestUpdate()}}>
                    </div>

                    <div style="font-size: 12px; color: var(--secondary-text-color); font-family: monospace;">
                        ${((o=e.points)==null?void 0:o.length)||0} points
                        ${t?v`
                            <br>${this._shieldSectionNames(e.sectionCount).map((s,a)=>{var l;return`${s}: ${((l=t[a])==null?void 0:l.length)||0} pts`}).join(" · ")}
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
                        <ha-button @click=${()=>this._acceptShieldBubble()} ?disabled=${!((r=e.points)!=null&&r.length)||e.loading}>
                            <ha-icon icon="mdi:check" slot="start"></ha-icon>
                            Accept
                        </ha-button>
                        <ha-button appearance="plain" @click=${()=>this._cancelShieldBubble()}>
                            Cancel
                        </ha-button>
                    </div>
                </div>
            </lcards-form-section>
        `}_renderRoutingCheatSheet(){return _e({header:"Quick Tips: common routing goals",icon:"mdi:lightbulb-outline",id:"msd-routing-tips",body:v`
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
                            <a href="${Ro}" target="_blank" rel="noopener">Line Routing</a> guide.
                        </p>
            `})}_renderShieldBubbleGuide(){return v`
            ${_e({header:"How shield bubble generation works",icon:"mdi:information-outline",body:v`
                        <p><strong>Dilate radius</strong> offsets the traced boundary outward from the ship's own silhouette by this many pixels before tracing. This is the expensive step - it only re-runs when you click Preview.</p>
                        <p><strong>Simplify tolerance</strong> reduces the point count by dropping points that don't meaningfully change the outline's shape (corner-preserving simplification) - higher values mean fewer points but a coarser silhouette. Updates live as you drag.</p>
                        <p><strong>Roundness</strong> blends the traced outline toward a smooth best-fit oval, from 0% (exact traced shape) to 100% (pure ellipse) - useful for a cleaner, more stylized shield-bubble look instead of a literal hull outline. Updates live as you drag.</p>
                        <lcards-shield-bubble-diagram></lcards-shield-bubble-diagram>
                    `})}
        `}_renderShieldBubblePreview(){var r;const e=this._shieldBubbleState;if(!(e!=null&&e.active)||!((r=e.points)!=null&&r.length))return"";const t=this._getViewBoxToPixelConverter();if(!t)return"";const i=h((s,a)=>s.map(d=>t(d[0],d[1])).map((d,c)=>`${c===0?"M":"L"} ${d[0]} ${d[1]}`).join(" ")+(a?" Z":""),"toPath");let o;if(e.mode==="single")o=`<path d="${i(e.points,true)}" fill="rgba(255,159,10,0.15)" stroke="#FF9F0A" stroke-width="2" stroke-dasharray="6,4" />`;else{const s=fe.splitBoundaryIntoSections(e.points,e.sectionCount,{startAngleDeg:e.startAngleDeg}),a=["#FF9F0A","#0AFFEF","#FF0A8C","#8CFF0A","#0A8CFF","#FF0A0A","#FFF00A","#B00AFF"];o=s.map((l,d)=>`<path d="${i(l,false)}" fill="none" stroke="${a[d%a.length]}" stroke-width="3" stroke-dasharray="6,4" />`).join("")}return v`
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 1000;">
                <svg style="width: 100%; height: 100%; position: absolute;">
                    ${xe(o)}
                </svg>
            </div>
        `}_getShapeOverlays(){var t;return(((t=this._workingConfig.msd)==null?void 0:t.overlays)||[]).filter(i=>i.type==="shape")}_toggleShapeSelection(e){const t=new Set(this._selectedShapeIds);t.has(e.id)?t.delete(e.id):t.add(e.id),this._selectedShapeIds=t}_toggleSelectAllShapes(){const e=this._getShapeOverlays();e.length>0&&this._selectedShapeIds.size===e.length?this._selectedShapeIds=new Set:this._selectedShapeIds=new Set(e.map(t=>t.id))}_openBulkStyleForm(e){var r;const t=e==="shape"?[...this._selectedShapeIds]:[...this._selectedLineIds];if(t.length<2)return;const o=(((r=this._workingConfig.msd)==null?void 0:r.overlays)||[]).find(s=>s.id===t[0]);o&&(this._bulkEditKind=e,this._bulkEditTargetIds=t,e==="shape"?(this._editShape(o),this._editingShapeId=null,this._shapeFormActiveSubtab="style",this._bulkEditSnapshot=JSON.parse(JSON.stringify(this._shapeFormData))):(this._editLine(o),this._editingLineId=null,this._lineFormActiveSubtab="style",this._bulkEditSnapshot=JSON.parse(JSON.stringify(this._lineFormData))),this.requestUpdate())}_diffStyleFields(e,t){const i={};for(const a of new Set([...Object.keys(e),...Object.keys(t)]))a!=="style"&&JSON.stringify(e[a])!==JSON.stringify(t[a])&&(i[a]=e[a]);const o=e.style||{},r=t.style||{},s={};for(const a of new Set([...Object.keys(o),...Object.keys(r)]))JSON.stringify(o[a])!==JSON.stringify(r[a])&&(s[a]=o[a]);return Object.keys(s).length>0&&(i.style=s),i}_applyTouchedFields(e,t){const i={...e};for(const[o,r]of Object.entries(t))o!=="style"&&(r===void 0?delete i[o]:i[o]=r);if(t.style){const o={...i.style||{}};for(const[r,s]of Object.entries(t.style))s===void 0?delete o[r]:o[r]=s;Object.keys(o).length>0?i.style=o:delete i.style}return i}_renderShapeItem(e){var d;const t=e.id||"unnamed",i=e.kind||"polyline",o=(d=e.style)==null?void 0:d.color,r=typeof o=="object"&&o!==null?o.default||Object.values(o)[0]||"var(--lcars-orange)":o||"var(--lcars-orange)",s=i==="rect"?"mdi:rectangle-outline":i==="circle"?"mdi:circle-outline":"mdi:vector-polyline",a=i==="polyline"?`${(e.points||[]).length} points${e.closed?" (closed)":""}`:`${(e.size||[0,0]).join("×")}`,l=e.locked===true;return v`
            <div class="list-item-card ${l?"locked":""}">
                <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                    <!-- Bulk-select checkbox, for Bulk Edit Style -->
                    <ha-checkbox
                        .checked=${this._selectedShapeIds.has(e.id)}
                        @change=${c=>{c.stopPropagation(),this._toggleShapeSelection(e)}}
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
                        <ha-icon icon="${s}" style="color: ${r};"></ha-icon>
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
        `}_generateShapeId(){var o;const e=((o=this._workingConfig.msd)==null?void 0:o.overlays)||[];let t=e.filter(r=>r.type==="shape").length+1,i=`shape_${t}`;for(;e.find(r=>r.id===i);)t++,i=`shape_${t}`;return i}_openShapeForm(e="rect",t={}){this._editingShapeId=null,this._shapeFormData={id:this._generateShapeId(),kind:e,position:t.position||[100,100],size:t.size||[100,60],points:t.points||(e==="polyline"?[[100,100],[200,100]]:[]),closed:false,entity:"",state_attribute:"",ranges_attribute:"",z_index:null,locked:false,corner_style:"round",corner_radius:e==="rect"?8:34,corner_angle:45,smoothing_mode:"none",smoothing_iterations:1,animations:[],style:{color:{default:"var(--lcars-orange)"},width:2,opacity:1,dash_array:"",fill:{default:"none"},fill_opacity:1,line_cap:"butt",line_join:"",miter_limit:4,marker_end:null,marker_start:null}},this._shapeFormActiveSubtab="geometry",this._showShapeForm=true,this.requestUpdate()}_editShape(e){var s,a,l,d,c,u,p,g,_,f,b;this._editingShapeId=e.id;const t=(s=e.style)==null?void 0:s.color,i=typeof t=="object"&&t!==null?t:{default:t||"var(--lcars-orange)"},o=(a=e.style)==null?void 0:a.fill,r=typeof o=="object"&&o!==null?o:{default:o||"none"};this._shapeFormData={id:e.id,kind:e.kind||"polyline",position:e.position||[100,100],size:e.size||[100,60],points:e.points||[],closed:e.closed===true,entity:e.entity||"",state_attribute:e.state_attribute||"",ranges_attribute:e.ranges_attribute||"",z_index:e.z_index??null,locked:e.locked===true,obstacle:e.obstacle===true,corner_style:e.corner_style||"round",corner_radius:e.corner_radius??(e.kind==="rect"?8:34),corner_angle:e.corner_angle??45,smoothing_mode:e.smoothing_mode||"none",smoothing_iterations:e.smoothing_iterations||1,animations:e.animations||[],style:{color:i,width:((l=e.style)==null?void 0:l.width)||2,opacity:((d=e.style)==null?void 0:d.opacity)??1,dash_array:((c=e.style)==null?void 0:c.dash_array)||"",fill:r,fill_opacity:((u=e.style)==null?void 0:u.fill_opacity)??1,line_cap:((p=e.style)==null?void 0:p.line_cap)||"butt",line_join:((g=e.style)==null?void 0:g.line_join)||"",miter_limit:((_=e.style)==null?void 0:_.miter_limit)??4,marker_end:((f=e.style)==null?void 0:f.marker_end)||null,marker_start:((b=e.style)==null?void 0:b.marker_start)||null}},this._shapeFormActiveSubtab="geometry",this._showShapeForm=true,this.requestUpdate()}_duplicateShape(e){var r;const t=((r=this._workingConfig.msd)==null?void 0:r.overlays)||[],i=this._generateShapeId(),o={...JSON.parse(JSON.stringify(e)),id:i};this._setNestedValue("msd.overlays",[...t,o]),this._editShape(o)}async _deleteShape(e){var o;if(!await this._showConfirmDialog("Delete Shape",`Delete shape "${e.id}"?`))return;const t=((o=this._workingConfig.msd)==null?void 0:o.overlays)||[],i=t.findIndex(r=>r.id===e.id);i>=0&&(t.splice(i,1),m.debug("[MSDStudio] Deleted shape:",e.id),this.requestUpdate(),this._schedulePreviewUpdate())}_buildShapeStyleFields(e){const t=e.kind,i={};e.corner_style&&e.corner_style!=="round"?i.corner_style=e.corner_style:e.corner_style==="round"&&e.corner_radius>0&&(i.corner_style="round"),e.corner_radius!=null&&e.corner_radius!==0&&(i.corner_radius=e.corner_radius),t==="polyline"&&(e.corner_style==="bevel"&&e.corner_angle!=null&&e.corner_angle!==45&&(i.corner_angle=e.corner_angle),e.smoothing_mode&&e.smoothing_mode!=="none"&&(i.smoothing_mode=e.smoothing_mode),e.smoothing_iterations!=null&&e.smoothing_iterations!==1&&(i.smoothing_iterations=e.smoothing_iterations));const o={},r=e.style||{};if(r.color!=null){const s=r.color,a=typeof s=="object"&&s!==null?Object.keys(s):null;o.color=a&&a.length===1&&a[0]==="default"?s.default:s}if(r.width!=null&&(o.width=r.width),r.opacity!=null&&r.opacity!==1&&(o.opacity=r.opacity),r.dash_array&&(o.dash_array=r.dash_array),r.fill!=null){const s=r.fill,a=typeof s=="object"&&s!==null?Object.keys(s):null,l=a&&a.length===1&&a[0]==="default"?s.default:s;l!=="none"&&l!==""&&(o.fill=l)}return r.fill_opacity!=null&&r.fill_opacity!==1&&(o.fill_opacity=r.fill_opacity),t==="polyline"&&(r.line_cap&&r.line_cap!=="butt"&&(o.line_cap=r.line_cap),r.line_join&&(o.line_join=r.line_join),r.miter_limit!=null&&r.miter_limit!==4&&(o.miter_limit=r.miter_limit),r.marker_end&&(o.marker_end=r.marker_end),r.marker_start&&(o.marker_start=r.marker_start)),Object.keys(o).length>0&&(i.style=o),i}_saveShape(e=false){if(!this._shapeFormData.id){m.warn("[MSDStudio] Cannot save shape without ID");return}const t=this._shapeFormData.kind,i={type:"shape",id:this._shapeFormData.id,kind:t};t==="polyline"?(i.points=this._shapeFormData.points||[],this._shapeFormData.closed&&(i.closed=true)):(i.position=this._shapeFormData.position||[0,0],i.size=this._shapeFormData.size||[100,60]),this._shapeFormData.z_index!=null&&(i.z_index=this._shapeFormData.z_index),this._shapeFormData.obstacle&&t!=="polyline"&&(i.obstacle=true),this._shapeFormData.locked&&(i.locked=true),this._shapeFormData.entity&&(i.entity=this._shapeFormData.entity),this._shapeFormData.state_attribute&&(i.state_attribute=this._shapeFormData.state_attribute),this._shapeFormData.ranges_attribute&&(i.ranges_attribute=this._shapeFormData.ranges_attribute),this._shapeFormData.animations&&this._shapeFormData.animations.length>0&&(i.animations=this._shapeFormData.animations),Object.assign(i,this._buildShapeStyleFields(this._shapeFormData)),this._workingConfig.msd||(this._workingConfig.msd={}),this._workingConfig.msd.overlays||(this._workingConfig.msd.overlays=[]);const o=this._editingShapeId?this._workingConfig.msd.overlays.findIndex(r=>r.id===this._editingShapeId):-1;if(o>=0){const r=this._workingConfig.msd.overlays[o];r._editorSelected&&(i._editorSelected=true),this._workingConfig.msd.overlays[o]=Oi(r,i,za,Ra),m.debug("[MSDStudio] Updated shape:",this._shapeFormData.id)}else this._workingConfig.msd.overlays.push(i),m.debug("[MSDStudio] Added shape:",this._shapeFormData.id);e||this._closeShapeForm(),this._schedulePreviewUpdate()}_saveBulkShapeStyle(){var o;const e=this._bulkEditTargetIds||[];if(e.length===0){this._closeShapeForm();return}const t=this._diffStyleFields(this._buildShapeStyleFields(this._shapeFormData),this._buildShapeStyleFields(this._bulkEditSnapshot));for(const r of["entity","state_attribute","ranges_attribute"])this._shapeFormData[r]!==this._bulkEditSnapshot[r]&&(t[r]=this._shapeFormData[r]||void 0);if(Object.keys(t).length===0){this._selectedShapeIds=new Set,this._closeShapeForm();return}const i=((o=this._workingConfig.msd)==null?void 0:o.overlays)||[];for(const r of e){const s=i.findIndex(a=>a.id===r);s<0||(i[s]=this._applyTouchedFields(i[s],t))}m.debug("[MSDStudio] Bulk-applied shape style to",e.length,"shapes:",Object.keys(t)),this._selectedShapeIds=new Set,this._closeShapeForm(),this._schedulePreviewUpdate()}_closeShapeForm(){this._showShapeForm=false,this._editingShapeId=null,this._bulkEditKind=null,this._bulkEditTargetIds=null,this._bulkEditSnapshot=null,this.requestUpdate()}_renderLineItem(e){var c,u,p;const t=e.id||"unnamed",i=this._formatConnectionPoint(e.source||e.anchor),o=this._formatConnectionPoint(e.target||e.attach_to),r=e.route||"auto",s=(c=e.style)==null?void 0:c.color,a=typeof s=="object"&&s!==null?s.default||s.active||Object.values(s)[0]||"#FF9900":s||"#FF9900",l=((u=e.style)==null?void 0:u.width)||2;let d=r;if(r==="auto"){const g=this._getControlOverlays().some(f=>f.obstacle===true);e.route_channels&&e.route_channels.length>0||g?d="auto → smart":d="auto → manhattan"}return v`
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
                        ">${d}</span>
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
                    ${this._renderStyleClipboardButtons(e)}
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
        `}_formatConnectionPoint(e){if(!e)return"not set";if(typeof e=="string")return e;if(Array.isArray(e))return`[${e[0]}, ${e[1]}]`;if(e.type==="anchor")return`anchor:${e.id}`;if(e.type==="control"){const t=e.point?`@${e.point}`:"";return`control:${e.id}${t}`}return e.type==="coords"&&Array.isArray(e.position)?`[${e.position[0]}, ${e.position[1]}]`:"unknown"}_renderLineHelp(){return v`
            ${_e({header:"About line overlays",body:v`
                    <ul>
                        <li>Lines connect anchors and controls to show relationships or data flow.</li>
                        <li>"Enter Connect Mode" lets you click a source, then a target, to draw one.</li>
                        <li>Routing modes: direct (straight), manhattan (right angles), bezier (curved) and more.</li>
                        <li>Style: colour, width, dash pattern, markers and animations.</li>
                    </ul>
                `})}
        `}_renderRoutingTab(){var o,r,s,a;const e=((o=this._workingConfig.msd)==null?void 0:o.routing)||{},t=((r=this._workingConfig.msd)==null?void 0:r.channels)||{},i=Object.keys(t).length;return v`
            <div style="padding: 8px;">
                <!-- Channel Actions & Visualization Helpers -->
                <div style="display: flex; gap: 8px; margin-bottom: 16px; align-items: center;">
                    <ha-button @click=${this._openChannelForm}>
                        <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                        Add Channel
                    </ha-button>
                    <ha-button @click=${async l=>{l.stopPropagation(),await this._setMode("draw_channel")}}
                               ?disabled=${this._activeMode===R.DRAW_CHANNEL}>
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
                        .selector=${{select:{options:[{value:"auto",label:"Auto (Recommended)"},{value:"bundling",label:"Bundling (Trunk-and-Branch)"},{value:"crossing",label:"Crossing Avoidance"},{value:"direct",label:"Direct (Straight Line)"},{value:"angled",label:"Angled (Leader Line)"},{value:"manual",label:"Manual (Custom Waypoints)"}]}}}
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
                        ${_e({header:"How routing channels work",body:v`
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
                            ${Object.entries(t).map(([l,d])=>this._renderChannelItem(l,d))}
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
                            .selector=${{number:{min:0,step:10,mode:"box"}}}
                            .value=${e.trunk_bundle_discount_cap}
                            .label=${"Bundling Reward Cap"}
                            @value-changed=${l=>this._updateRoutingConfig("trunk_bundle_discount_cap",l.detail.value)}
                            helper="Longest stretch of a bundle that earns the reward, so a long detour along one never pays (default: 150)">
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
                        <a href=${ci(hi.msdRouting)} target="_blank" rel="noopener noreferrer">Routing documentation</a>
                    </lcards-message>

                    <!-- Parameter Explanations -->
                    ${_e({header:"Parameter guide",body:v`
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
                                .value=${(s=e.cost_defaults)==null?void 0:s.bend}
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
        `}_renderChannelItem(e,t){const i={bundling:"#00FF00",avoiding:"#FF0000",waypoint:"#0000FF"},o={bundling:"Bundling",avoiding:"Avoiding",waypoint:"Waypoint"},[r,s,a,l]=t.bounds||[0,0,0,0],d=h(w=>{const S=Math.round(w*10)/10;return S%1===0?S.toFixed(0):S.toFixed(1)},"fmt"),c=`[${d(r)}, ${d(s)}] ${d(a)}×${d(l)}`,u={prefer:{label:"Prefer",color:"#4CAF50"},avoid:{label:"Avoid",color:"#F44336"},force:{label:"Force",color:"#FF9800"}},p={auto:{label:"Auto",icon:"↔"},horizontal:{label:"Horizontal",icon:"→"},vertical:{label:"Vertical",icon:"↓"}},g=t.mode||"prefer",_=t.direction||"auto",f=u[g]||u.prefer,b=p[_]||p.auto;return v`
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
                        ">${b.icon} ${b.label}</span>
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
                        ${c}
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
                @closed=${o=>{o.stopPropagation(),o.target===o.currentTarget&&this._closeChannelForm()}}
                .headerTitle=${e?"Add Routing Channel":`Edit Channel: ${t}`}
                style="--ha-dialog-width-md: 640px;">

                <div style="padding: 8px 16px;">
                    <ha-input
                        label="Channel ID"
                        ?autofocus=${e}
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
                <ha-dialog-footer slot="footer">
                    <ha-button slot="secondaryAction" @click=${this._closeChannelForm} appearance="plain">
                        <ha-icon icon="mdi:close" slot="start"></ha-icon>
                        Cancel
                    </ha-button>
                    <ha-button slot="primaryAction" @click=${this._saveChannel}>
                        <ha-icon icon="mdi:content-save" slot="start"></ha-icon>
                        ${e?"Add":"Save"}
                    </ha-button>
                </ha-dialog-footer>
            </ha-dialog>
        `}_openChannelForm(){this._editingChannelId="",this._channelFormData={id:"",mode:"prefer",direction:"auto",bounds:[0,0,100,50],weight:.5,line_spacing:8,discoverable:true},this.requestUpdate()}_editChannel(e,t){this._editingChannelId=e;let i=t.mode;!i&&t.type&&(i={bundling:"prefer",avoiding:"avoid",waypoint:"force"}[t.type]||"prefer"),this._channelFormData={id:e,mode:i||"prefer",direction:t.direction||"auto",bounds:[...t.bounds||[0,0,100,50]],weight:t.weight||.5,line_spacing:t.line_spacing??8,discoverable:t.discoverable!==false},this.requestUpdate()}_closeChannelForm(){this._editingChannelId=null,this.requestUpdate()}_updateChannelFormField(e,t){this._channelFormData[e]=t,this.requestUpdate()}_updateChannelBounds(e,t){this._channelFormData.bounds[e]=t,this.requestUpdate()}async _saveChannel(){const e=this._channelFormData.id;if(!e||e.trim()===""){await this._showDialog("Missing ID","Channel ID is required","error");return}this._workingConfig.msd||(this._workingConfig.msd={}),this._workingConfig.msd.channels||(this._workingConfig.msd.channels={}),this._workingConfig.msd.channels[e]={mode:this._channelFormData.mode||"prefer",direction:this._channelFormData.direction||"auto",bounds:this._channelFormData.bounds,weight:this._channelFormData.weight||.5,line_spacing:this._channelFormData.line_spacing??8,discoverable:this._channelFormData.discoverable!==false},this._setNestedValue("msd.channels",this._workingConfig.msd.channels),this._closeChannelForm(),this._schedulePreviewUpdate()}async _deleteChannel(e){var i;if(!await this._showConfirmDialog("Delete Channel",`Delete routing channel "${e}"?<br><br>Lines using this channel may be affected.`))return;const t={...((i=this._workingConfig.msd)==null?void 0:i.channels)||{}};delete t[e],this._setNestedValue("msd.channels",t),this._schedulePreviewUpdate()}_highlightChannelInPreview(e){this._highlightedChannel=e,this.requestUpdate(),setTimeout(()=>{this._highlightedChannel=null,this.requestUpdate()},2500)}_generateChannelId(){var o;const e=((o=this._workingConfig.msd)==null?void 0:o.channels)||{};let t=Object.keys(e).length+1,i=`channel_${t}`;for(;e[i];)t++,i=`channel_${t}`;return i}_findLinesIntersectingChannel(e){var u,p;const t=((u=this._workingConfig.msd)==null?void 0:u.overlays)||[],i=((p=this._workingConfig.msd)==null?void 0:p.anchors)||{},{x:o,y:r,width:s,height:a}=e,l=o+s,d=r+a,c=[];for(const g of t){if(g.type!=="line")continue;const _=g.anchor?i[g.anchor]:null,f=g.attach_to?i[g.attach_to]:null;if(!_||!f)continue;const[b,w]=_,[S,C]=f,D=Math.min(b,S),M=Math.max(b,S),k=Math.min(w,C),F=Math.max(w,C),L=M>=o&&D<=l,q=F>=r&&k<=d;if(L&&q){const z=b>=o&&b<=l&&w>=r&&w<=d,U=S>=o&&S<=l&&C>=r&&C<=d,T=D<o&&M>l,N=k<r&&F>d;(z||U||T||N)&&c.push(g)}}return m.debug(`[MSDStudio] Found ${c.length} line(s) intersecting channel bounds:`,c.map(g=>g.id).join(", ")),c}_applyChannelToLines(e,t,i="prefer"){var s;m.debug(`[MSDStudio] Applying channel '${e}' to ${t.length} line(s) with mode: ${i}`);const o=((s=this._workingConfig.msd)==null?void 0:s.overlays)||[];let r=0;for(const a of o)a.type==="line"&&t.includes(a.id)&&(a.route_channels||(a.route_channels=[]),a.route_channels.includes(e)||a.route_channels.push(e),r++,m.debug(`[MSDStudio] Updated line '${a.id}' with channel routing`));this._setNestedValue("msd.overlays",o),this._channelFormData&&(this._channelFormData.suggestedLines=null),this._showDialog("Lines Configured",`Successfully configured ${r} line(s) to route through channel "${e}" (${i} mode is set on the channel itself).`,"success"),this._schedulePreviewUpdate(),this.requestUpdate()}_dismissChannelSuggestions(){m.debug("[MSDStudio] Dismissing channel suggestions"),this._channelFormData&&(this._channelFormData.suggestedLines=null),this.requestUpdate()}_openLineForm(){var o;const e=((o=this._workingConfig.msd)==null?void 0:o.overlays)||[];let t=e.filter(r=>r.type==="line").length+1,i=`line_${t}`;for(;e.find(r=>r.id===i);)t++,i=`line_${t}`;this._editingLineId=null,this._lineFormData={id:i,entity:"",state_attribute:"",ranges_attribute:"",anchor:"",attach_to:"",anchor_side:"center",attach_side:"center",anchor_gap:0,attach_gap:0,route:"auto",z_index:null,clearance:void 0,stub_length:void 0,corner_style:"round",corner_radius:34,corner_radius_mode:"auto",corner_room_weight:void 0,corner_angle:45,smoothing_mode:"none",smoothing_iterations:1,route_channels:[],channel_mode:"prefer",style:{color:{default:"var(--lcars-orange)"},width:2,dash_array:"",marker_end:null}},this._lineFormActiveSubtab="basic",this._showLineForm=true,this.requestUpdate()}_editLine(e){var o,r,s,a,l,d,c,u;this._editingLineId=e.id;const t=((o=e.style)==null?void 0:o.color)??((r=e.style)==null?void 0:r.stroke),i=typeof t=="object"&&t!==null?t:{default:t||"var(--lcars-orange)"};this._lineFormData={id:e.id,entity:e.entity||"",state_attribute:e.state_attribute||"",ranges_attribute:e.ranges_attribute||"",anchor:e.anchor||"",attach_to:e.attach_to||"",anchor_side:e.anchor_side||"center",attach_side:e.attach_side||"center",anchor_gap:e.anchor_gap||0,attach_gap:e.attach_gap||0,route:e.route||"auto",z_index:e.z_index??null,clearance:e.clearance,stub_length:e.stub_length,route_hint:e.route_hint,route_hint_last:e.route_hint_last,waypoints:(e.waypoints||[]).map(p=>Array.isArray(p)?[...p]:p),corner_style:e.corner_style||"round",corner_radius:e.corner_radius??34,corner_radius_mode:e.corner_radius_mode||"auto",corner_room_weight:e.corner_room_weight,corner_angle:e.corner_angle??45,smoothing_mode:e.smoothing_mode||"none",smoothing_iterations:e.smoothing_iterations||1,route_channels:e.route_channels||[],animations:e.animations||[],style:{color:i,width:((s=e.style)==null?void 0:s.width)||((a=e.style)==null?void 0:a.stroke_width)||2,opacity:((l=e.style)==null?void 0:l.opacity)??1,dash_array:((d=e.style)==null?void 0:d.dash_array)||"",marker_end:((c=e.style)==null?void 0:c.marker_end)||null,marker_start:((u=e.style)==null?void 0:u.marker_start)||null}},this._lineFormActiveSubtab="basic",this._showLineForm=true,this.requestUpdate()}_duplicateLine(e){var s;const t=((s=this._workingConfig.msd)==null?void 0:s.overlays)||[];let i=t.filter(a=>a.type==="line").length+1,o=`line_${i}`;for(;t.find(a=>a.id===o);)i++,o=`line_${i}`;const r={...JSON.parse(JSON.stringify(e)),id:o};this._setNestedValue("msd.overlays",[...t,r]),this._editLine(r)}_isOverlayId(e){var i;return!e||typeof e!="string"?false:(((i=this._workingConfig.msd)==null?void 0:i.overlays)||[]).some(o=>o.id===e&&o.type!=="line")}_buildLineStyleFields(e){const t={};if(e.corner_style&&e.corner_style!=="round"&&(t.corner_style=e.corner_style),e.corner_radius!=null&&e.corner_radius!==34&&(t.corner_radius=e.corner_radius),e.corner_radius_mode==="forced"&&(t.corner_radius_mode=e.corner_radius_mode),e.corner_room_weight!=null&&(t.corner_room_weight=e.corner_room_weight),e.corner_style==="bevel"&&e.corner_angle!=null&&e.corner_angle!==45&&(t.corner_angle=e.corner_angle),e.smoothing_mode&&e.smoothing_mode!=="none"&&(t.smoothing_mode=e.smoothing_mode),e.smoothing_iterations!=null&&e.smoothing_iterations!==1&&(t.smoothing_iterations=e.smoothing_iterations),e.style&&Object.keys(e.style).length>0){const i={};if(e.style.color!=null){const o=e.style.color,r=typeof o=="object"&&o!==null?Object.keys(o):null;i.color=r&&r.length===1&&r[0]==="default"?o.default:o}e.style.width!=null&&(i.width=e.style.width),e.style.opacity!=null&&e.style.opacity!==1&&(i.opacity=e.style.opacity),e.style.dash_array&&(i.dash_array=e.style.dash_array),e.style.marker_end&&(i.marker_end=e.style.marker_end),e.style.marker_start&&(i.marker_start=e.style.marker_start),Object.keys(i).length>0&&(t.style=i)}return t}_saveLine(e=false){if(!this._lineFormData.id){m.warn("[MSDStudio] Cannot save line without ID");return}const t={type:"line",id:this._lineFormData.id,anchor:this._lineFormData.anchor,attach_to:this._lineFormData.attach_to,route:this._lineFormData.route||"auto"};this._lineFormData.z_index!=null&&(t.z_index=this._lineFormData.z_index),this._lineFormData.entity&&(t.entity=this._lineFormData.entity),this._lineFormData.state_attribute&&(t.state_attribute=this._lineFormData.state_attribute),this._lineFormData.ranges_attribute&&(t.ranges_attribute=this._lineFormData.ranges_attribute),this._lineFormData.anchor_side&&(t.anchor_side=this._lineFormData.anchor_side),this._lineFormData.attach_side&&(t.attach_side=this._lineFormData.attach_side),this._lineFormData.anchor_gap!=null&&this._lineFormData.anchor_gap!==0&&(t.anchor_gap=this._lineFormData.anchor_gap),this._lineFormData.attach_gap!=null&&this._lineFormData.attach_gap!==0&&(t.attach_gap=this._lineFormData.attach_gap),this._lineFormData.clearance!=null&&(t.clearance=this._lineFormData.clearance),this._lineFormData.stub_length!=null&&(t.stub_length=this._lineFormData.stub_length),this._lineFormData.route_hint&&(t.route_hint=this._lineFormData.route_hint),this._lineFormData.route_hint_last&&(t.route_hint_last=this._lineFormData.route_hint_last),this._lineFormData.waypoints&&this._lineFormData.waypoints.length>0&&(t.waypoints=this._lineFormData.waypoints),this._lineFormData.route_channels&&this._lineFormData.route_channels.length>0&&(t.route_channels=this._lineFormData.route_channels),Object.assign(t,this._buildLineStyleFields(this._lineFormData)),this._lineFormData.animations&&this._lineFormData.animations.length>0&&(t.animations=this._lineFormData.animations),this._workingConfig.msd||(this._workingConfig.msd={}),this._workingConfig.msd.overlays||(this._workingConfig.msd.overlays=[]);const i=this._editingLineId?this._workingConfig.msd.overlays.findIndex(o=>o.id===this._editingLineId):-1;if(i>=0){const o=this._workingConfig.msd.overlays[i];o._editorSelected&&(t._editorSelected=true),this._workingConfig.msd.overlays[i]=Oi(o,t,Ta,Ba),m.debug("[MSDStudio] Updated line:",this._lineFormData.id)}else this._workingConfig.msd.overlays.push(t),m.debug("[MSDStudio] Added line:",this._lineFormData.id);e||this._closeLineForm(),this._schedulePreviewUpdate()}_saveBulkLineStyle(){var o;const e=this._bulkEditTargetIds||[];if(e.length===0){this._closeLineForm();return}const t=this._diffStyleFields(this._buildLineStyleFields(this._lineFormData),this._buildLineStyleFields(this._bulkEditSnapshot));for(const r of["entity","state_attribute","ranges_attribute"])this._lineFormData[r]!==this._bulkEditSnapshot[r]&&(t[r]=this._lineFormData[r]||void 0);if(Object.keys(t).length===0){this._selectedLineIds=new Set,this._closeLineForm();return}const i=((o=this._workingConfig.msd)==null?void 0:o.overlays)||[];for(const r of e){const s=i.findIndex(a=>a.id===r);s<0||(i[s]=this._applyTouchedFields(i[s],t))}m.debug("[MSDStudio] Bulk-applied line style to",e.length,"lines:",Object.keys(t)),this._selectedLineIds=new Set,this._closeLineForm(),this._schedulePreviewUpdate()}_closeLineForm(){m.trace("[MSDStudio] _closeLineForm called",new Error().stack),this._showLineForm=false,this._editingLineId=null,this._bulkEditKind=null,this._bulkEditTargetIds=null,this._bulkEditSnapshot=null,this.requestUpdate()}_handleShapeFormTabChange(e){var i;e.stopPropagation();const t=(i=e.target.activeTab)==null?void 0:i.getAttribute("value");t&&(this._shapeFormActiveSubtab=t,this.requestUpdate())}_renderShapeFormTabContent(){switch(this._shapeFormActiveSubtab){case"geometry":return this._renderShapeFormGeometry();case"style":return this._renderShapeFormStyle();case"animation":return this._renderShapeFormAnimation();default:return this._renderShapeFormGeometry()}}_renderShapeFormAnimation(){const e=this._editingShapeId||this._shapeFormData.id;return v`
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
                        ${(this._shapeFormData.points||[]).length>Ee?v`
                            <lcards-message type="info">
                                ${(this._shapeFormData.points||[]).length} points: too many to edit here. Drag them on the canvas,
                                or edit them on the YAML tab.
                                <ha-button
                                    @click=${()=>{this._closeShapeForm(),this._activeTab=Z.YAML,this.requestUpdate()}}>
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
                                    @value-changed=${o=>{const r=[...this._shapeFormData.points];r[i]=[Number(o.detail.value),Array.isArray(t)?t[1]:0],this._shapeFormData={...this._shapeFormData,points:r},this.requestUpdate()}}
                                    style="flex: 1;">
                                </ha-selector>
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{number:{mode:"box"}}}
                                    .value=${Array.isArray(t)?t[1]:0}
                                    .label=${"Y"}
                                    @value-changed=${o=>{const r=[...this._shapeFormData.points];r[i]=[Array.isArray(t)?t[0]:0,Number(o.detail.value)],this._shapeFormData={...this._shapeFormData,points:r},this.requestUpdate()}}
                                    style="flex: 1;">
                                </ha-selector>
                                <ha-icon-button
                                    @click=${()=>{const o=this._shapeFormData.points.filter((r,s)=>s!==i);this._shapeFormData={...this._shapeFormData,points:o},this.requestUpdate()}}
                                    ?disabled=${(this._shapeFormData.points||[]).length<=2}
                                    .label=${"Remove point"}
                                    .path=${"M19,13H5V11H19V13Z"}>
                                </ha-icon-button>
                            </div>
                        `)}
                        ${(this._shapeFormData.points||[]).length>Ee?"":v`
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

                ${this._shapeFormData.kind!=="polyline"?v`
                    <lcards-form-section
                        header="Routing"
                        description="Whether routed lines go round this shape"
                        icon="mdi:sign-direction"
                        secondary=${this._shapeFormData.obstacle?"Obstacle":"Lines pass over"}
                        ?expanded=${this._shapeFormData.obstacle===true}>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Treat as obstacle for line routing"}
                            .helper=${"When enabled, lines with route: auto go round this shape"}
                            .selector=${{boolean:{}}}
                            .value=${this._shapeFormData.obstacle===true}
                            @value-changed=${t=>{this._shapeFormData={...this._shapeFormData,obstacle:t.detail.value},this.requestUpdate()}}>
                        </ha-selector>
                    </lcards-form-section>
                `:""}

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
        `}_getShapeColorEditorAdapter(){const e=this;return{hass:this.hass,config:this._shapeFormData,_getConfigValue(t){return t.split(".").reduce((i,o)=>i==null?void 0:i[o],e._shapeFormData)},_setConfigValue(t,i){const o=t.split("."),r=o.pop();if(r==="__proto__"||r==="constructor"||r==="prototype")return;let s=e._shapeFormData;for(const a of o){if(a==="__proto__"||a==="constructor"||a==="prototype")return;(!s[a]||typeof s[a]!="object")&&(s[a]={}),s=s[a]}s[r]=i,e.requestUpdate()}}}_renderShapeEntityBindingSection(){var r,s;const e=this._shapeFormData.entity||"",t=e&&((s=(r=this.hass)==null?void 0:r.states)!=null&&s[e])?Object.keys(this.hass.states[e].attributes||{}).sort().map(a=>({value:a,label:a})):[],i=[...t],o=i.findIndex(a=>a.value==="brightness");return o>=0&&i.splice(o+1,0,{value:"brightness_pct",label:"brightness_pct  (auto 0–100%)"}),v`
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
                            @value-changed=${r=>{this._shapeFormData.style={...this._shapeFormData.style,width:r.detail.value},this.requestUpdate()}}
                            style="margin-top: 12px;">
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{number:{min:0,max:1,step:.01,mode:"slider"}}}
                            .value=${t.opacity??1}
                            .label=${"Opacity"}
                            @value-changed=${r=>{this._shapeFormData.style={...this._shapeFormData.style,opacity:r.detail.value},this.requestUpdate()}}
                            style="margin-top: 12px;">
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{select:{options:[{value:"solid",label:"Solid"},{value:"dashed",label:"Dashed"},{value:"dotted",label:"Dotted"},{value:"dash-dot",label:"Dash-Dot"},{value:"custom",label:"Custom"}]}}}
                            .value=${o}
                            .label=${"Pattern"}
                            @value-changed=${r=>{const s=r.detail.value;let a=i,l=t.line_cap;s==="dashed"?a="5,5":s==="dotted"?(a="0,4",l="round"):s==="dash-dot"?(a="8,4,0,4",l="round"):s==="solid"&&(a=""),s!=="custom"&&(this._shapeFormData.style={...this._shapeFormData.style,dash_array:a,line_cap:l},this.requestUpdate())}}
                            style="margin-top: 12px;">
                        </ha-selector>

                        <!-- Dash Pattern Customization (conditional - all non-solid presets) -->
                        ${o!=="solid"?v`
                            <lcards-form-section
                                header="${o==="custom"?"Custom":"Customize"} Dash Pattern"
                                icon="mdi:dots-horizontal"
                                ?nested=${true}
                                ?expanded=${true}>

                                ${(()=>{const r=(i||"").split(",").map(c=>parseFloat(c.trim())||0),s=r[0]??5,a=r[1]??5,l=r[2]||0,d=r[3]||0;return v`
                                        <ha-selector
                                            .hass=${this.hass}
                                            .selector=${{number:{min:0,max:50,step:1,mode:"slider"}}}
                                            .value=${s}
                                            .label=${"Dash Length"}
                                            @value-changed=${c=>{const u=c.detail.value,p=l>0?`${u},${a},${l},${d}`:`${u},${a}`;this._shapeFormData.style={...this._shapeFormData.style,dash_array:p},this.requestUpdate()}}>
                                        </ha-selector>

                                        <ha-selector
                                            .hass=${this.hass}
                                            .selector=${{number:{min:0,max:50,step:1,mode:"slider"}}}
                                            .value=${a}
                                            .label=${"Gap Length"}
                                            @value-changed=${c=>{const u=c.detail.value,p=l>0?`${s},${u},${l},${d}`:`${s},${u}`;this._shapeFormData.style={...this._shapeFormData.style,dash_array:p},this.requestUpdate()}}
                                            style="margin-top: 12px;">
                                        </ha-selector>

                                        <ha-selector
                                            style="margin-top: 12px; display: block;"
                                            .hass=${this.hass}
                                            .label=${"Add secondary dash/gap"}
                                            .selector=${{boolean:{}}}
                                            .value=${l>0}
                                            @value-changed=${c=>{const u=c.detail.value?`${s},${a},2,2`:`${s},${a}`;this._shapeFormData.style={...this._shapeFormData.style,dash_array:u},this.requestUpdate()}}>
                                        </ha-selector>

                                        ${l>0?v`
                                            <ha-selector
                                                .hass=${this.hass}
                                                .selector=${{number:{min:0,max:50,step:1,mode:"slider"}}}
                                                .value=${l}
                                                .label=${"Secondary Dash"}
                                                @value-changed=${c=>{const u=`${s},${a},${c.detail.value},${d}`;this._shapeFormData.style={...this._shapeFormData.style,dash_array:u},this.requestUpdate()}}
                                                style="margin-top: 12px;">
                                            </ha-selector>

                                            <ha-selector
                                                .hass=${this.hass}
                                                .selector=${{number:{min:0,max:50,step:1,mode:"slider"}}}
                                                .value=${d}
                                                .label=${"Secondary Gap"}
                                                @value-changed=${c=>{const u=`${s},${a},${l},${c.detail.value}`;this._shapeFormData.style={...this._shapeFormData.style,dash_array:u},this.requestUpdate()}}
                                                style="margin-top: 12px;">
                                            </ha-selector>
                                        `:""}

                                        <div style="margin-top: 12px; font-size: 12px; color: var(--secondary-text-color); font-family: monospace;">
                                            Pattern: ${l>0?`${s},${a},${l},${d}`:`${s},${a}`}
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
                                @value-changed=${r=>{this._shapeFormData={...this._shapeFormData,corner_style:r.detail.value},this.requestUpdate()}}>
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
                                    @value-changed=${r=>{this._shapeFormData={...this._shapeFormData,corner_style:r.detail.value?"round":"miter"},this.requestUpdate()}}>
                                </ha-selector>
                            `:""}

                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select:{options:[{value:"butt",label:"Butt (Flat)"},{value:"round",label:"Round"},{value:"square",label:"Square (Extended)"}]}}}
                                .value=${t.line_cap||"butt"}
                                .label=${"Line Cap"}
                                helper="Shape of each dash segment's ends: set to Round for circular dots"
                                @value-changed=${r=>{this._shapeFormData.style={...this._shapeFormData.style,line_cap:r.detail.value},this.requestUpdate()}}
                                style="margin-top: 12px;">
                            </ha-selector>
                        `}

                        ${this._shapeFormData.corner_style==="round"&&e!=="circle"?v`
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number:{min:0,max:100,step:1,mode:"slider",unit_of_measurement:"vb"}}}
                                .value=${this._shapeFormData.corner_radius??(e==="rect"?8:34)}
                                .label=${"Corner Radius"}
                                @value-changed=${r=>{this._shapeFormData={...this._shapeFormData,corner_radius:r.detail.value},this.requestUpdate()}}
                                style="margin-top: 12px;">
                            </ha-selector>
                        `:""}

                        ${e==="polyline"&&this._shapeFormData.corner_style==="bevel"?v`
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number:{min:0,max:100,step:1,mode:"slider",unit_of_measurement:"vb"}}}
                                .value=${this._shapeFormData.corner_radius??34}
                                .label=${"Cut Size"}
                                @value-changed=${r=>{this._shapeFormData={...this._shapeFormData,corner_radius:r.detail.value},this.requestUpdate()}}
                                style="margin-top: 12px;">
                            </ha-selector>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number:{min:0,max:90,step:1,mode:"slider",unit_of_measurement:"°"}}}
                                .value=${this._shapeFormData.corner_angle??45}
                                .label=${"Cut Angle"}
                                @value-changed=${r=>{this._shapeFormData={...this._shapeFormData,corner_angle:r.detail.value},this.requestUpdate()}}
                                style="margin-top: 12px;">
                            </ha-selector>
                        `:""}

                        ${e==="polyline"?v`
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select:{options:[{value:"none",label:"None"},{value:"chaikin",label:"Chaikin (Corner-cutting)"}]}}}
                                .value=${this._shapeFormData.smoothing_mode||"none"}
                                .label=${"Smoothing Mode"}
                                @value-changed=${r=>{this._shapeFormData={...this._shapeFormData,smoothing_mode:r.detail.value},this.requestUpdate()}}
                                style="margin-top: 12px;">
                            </ha-selector>

                            ${this._shapeFormData.smoothing_mode==="chaikin"?v`
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{number:{min:1,max:5,step:1,mode:"slider"}}}
                                    .value=${this._shapeFormData.smoothing_iterations||1}
                                    .label=${"Smoothing Iterations"}
                                    @value-changed=${r=>{this._shapeFormData={...this._shapeFormData,smoothing_iterations:r.detail.value},this.requestUpdate()}}
                                    style="margin-top: 12px;">
                                </ha-selector>
                            `:""}

                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select:{options:[{value:"butt",label:"Butt (Flat)"},{value:"round",label:"Round"},{value:"square",label:"Square (Extended)"}]}}}
                                .value=${t.line_cap||"butt"}
                                .label=${"Line Cap"}
                                @value-changed=${r=>{this._shapeFormData.style={...this._shapeFormData.style,line_cap:r.detail.value},this.requestUpdate()}}
                                style="margin-top: 12px;">
                            </ha-selector>

                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select:{options:[{value:"miter",label:"Miter (Sharp)"},{value:"round",label:"Round"},{value:"bevel",label:"Bevel (Cut)"}]}}}
                                .value=${t.line_join||this._shapeFormData.corner_style||"miter"}
                                .label=${"Line Join"}
                                @value-changed=${r=>{this._shapeFormData.style={...this._shapeFormData.style,line_join:r.detail.value},this.requestUpdate()}}
                                style="margin-top: 12px;">
                            </ha-selector>

                            ${t.line_join==="miter"||!t.line_join&&this._shapeFormData.corner_style==="miter"?v`
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{number:{min:1,max:20,step:.5,mode:"slider"}}}
                                    .value=${t.miter_limit||4}
                                    .label=${"Miter Limit"}
                                    @value-changed=${r=>{this._shapeFormData.style={...this._shapeFormData.style,miter_limit:r.detail.value},this.requestUpdate()}}
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
                        @value-changed=${r=>{this._shapeFormData.style={...this._shapeFormData.style,fill_opacity:r.detail.value},this.requestUpdate()}}
                        style="margin-top: 12px;">
                    </ha-selector>
                </lcards-form-section>
            </div>
        `}_renderShapeFormDialog(){var o,r;const e=this._bulkEditKind==="shape"&&this._bulkEditTargetIds!==null,t=!!this._editingShapeId,i=e?`Bulk Edit Style: ${(o=this._bulkEditTargetIds)==null?void 0:o.length} shapes selected`:t?`Edit Shape: ${this._shapeFormData.id}`:"Add Shape";return v`
            <ha-dialog
                class="subform-dialog"
                open
                @closed=${s=>{s.stopPropagation(),s.target===s.currentTarget&&this._closeShapeForm()}}
                .headerTitle=${i}
                prevent-scrim-close>

                <div class="subform-layout">
                    <div class="subform-config">
                        ${e?v`
                            <lcards-message type="info" style="margin-bottom: 12px;">
                                Only fields you change below are applied; untouched fields are left as-is on each of the ${(r=this._bulkEditTargetIds)==null?void 0:r.length} selected shapes.
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

                <ha-dialog-footer slot="footer">
                    <ha-button slot="secondaryAction" @click=${this._closeShapeForm} appearance="plain">
                        <ha-icon icon="mdi:close" slot="start"></ha-icon>
                        Cancel
                    </ha-button>
                    <ha-button slot="primaryAction" @click=${()=>e?this._saveBulkShapeStyle():this._saveShape()}>
                        <ha-icon icon="mdi:content-save" slot="start"></ha-icon>
                        ${e?"Apply to Selected":"Save"}
                    </ha-button>
                </ha-dialog-footer>
            </ha-dialog>
        `}_handleWaypointDragStart(e,t){var i;m.trace("[MSDStudio] Waypoint drag start:",t),this._draggedWaypointIndex=t,e.dataTransfer&&(e.dataTransfer.effectAllowed="move"),(i=e.dataTransfer)==null||i.setData("text/plain",String(t)),this.requestUpdate()}_handleWaypointDragEnd(e){m.trace("[MSDStudio] Waypoint drag end"),this._draggedWaypointIndex=null,this.requestUpdate()}_handleWaypointDragOver(e,t){e.preventDefault(),e.dataTransfer&&(e.dataTransfer.dropEffect="move"),!(this._draggedWaypointIndex===null||this._draggedWaypointIndex===t)&&m.trace("[MSDStudio] Waypoint drag over:",t)}_handleWaypointDrop(e,t){m.trace("[MSDStudio] Waypoint drop at:",t),e.preventDefault(),e.stopPropagation();const i=this._draggedWaypointIndex;if(i===null||i===t){m.trace("[MSDStudio] Drop ignored - same position");return}const o=[...this._lineFormData.waypoints],[r]=o.splice(i,1);o.splice(t,0,r),this._lineFormData={...this._lineFormData,waypoints:o},this._draggedWaypointIndex=null,m.trace("[MSDStudio] Waypoints reordered"),this._schedulePreviewUpdate(),this.requestUpdate()}_handleLineFormTabChange(e){var i;e.stopPropagation();const t=(i=e.target.activeTab)==null?void 0:i.getAttribute("value");t&&(this._lineFormActiveSubtab=t,this.requestUpdate())}async _deleteLine(e){var o;if(!await this._showConfirmDialog("Delete Line",`Delete line "${e.id}"?`))return;const t=((o=this._workingConfig.msd)==null?void 0:o.overlays)||[],i=t.findIndex(r=>r.id===e.id);i>=0&&(t.splice(i,1),m.debug("[MSDStudio] Deleted line:",e.id),this.requestUpdate(),this._schedulePreviewUpdate())}_highlightLineInPreview(e){m.debug("[MSDStudio] Highlight line:",e.id),this._highlightedLine=e.id,this._debugSettings={...this._debugSettings,line_paths:true,highlighted_line:e.id},this._schedulePreviewUpdate(),this.requestUpdate(),setTimeout(()=>{this._highlightedLine=null;const{highlighted_line:t,...i}=this._debugSettings;this._debugSettings=i,this._schedulePreviewUpdate(),this.requestUpdate()},2500)}_openLineFormWithConnection(e,t){this._openLineForm(),this._lineFormData.anchor=e.id,this._lineFormData.attach_to=t.id,e.point&&(this._lineFormData.anchor_side=this._convertPointToSide(e.point)),t.point&&(this._lineFormData.attach_side=this._convertPointToSide(t.point)),this.requestUpdate()}_convertPointToSide(e){return new Set(["top-left","top","top-right","left","center","right","bottom-left","bottom","bottom-right"]).has(e)||/^vertex\d+$/.test(e||"")?e:"center"}_handleConnectLineClick(e){const t=e.target.closest("[data-connection-type]");if(!t){m.debug("[MSDStudio] Connect line click on non-connection element");return}const i={type:t.dataset.connectionType,id:t.dataset.connectionId,point:t.dataset.connectionPoint||null,gap:0};this._connectLineState.source?(m.debug("[MSDStudio] Connect line target set:",i),this._openLineFormWithConnection(this._connectLineState.source,i),this._clearConnectLineState()):(this._connectLineState.source=i,m.debug("[MSDStudio] Connect line source set:",i),this.requestUpdate())}_clearConnectLineState(){this._connectLineState={source:null,tempLineElement:null},this._activeMode=R.VIEW,this.requestUpdate()}_renderLineFormDialog(){var o,r;const e=this._bulkEditKind==="line"&&this._bulkEditTargetIds!==null,t=!!this._editingLineId,i=e?`Bulk Edit Style: ${(o=this._bulkEditTargetIds)==null?void 0:o.length} lines selected`:t?`Edit Line: ${this._lineFormData.id}`:"Add Line";return v`
            <ha-dialog
                class="subform-dialog"
                open
                @closed=${s=>{s.stopPropagation(),s.target===s.currentTarget&&this._closeLineForm()}}
                .headerTitle=${i}
                prevent-scrim-close>

                <!-- Split Layout: Content Left, Preview Right -->
                <div class="subform-layout">

                    <!-- Left Panel: Tabs and Content -->
                    <div class="subform-config">
                        ${e?v`
                            <lcards-message type="info" style="margin-bottom: 12px;">
                                Only fields you change below are applied; untouched fields are left as-is on each of the ${(r=this._bulkEditTargetIds)==null?void 0:r.length} selected lines.
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

                <ha-dialog-footer slot="footer">
                    <ha-button slot="secondaryAction" @click=${this._closeLineForm} appearance="plain">
                        <ha-icon icon="mdi:close" slot="start"></ha-icon>
                        Cancel
                    </ha-button>
                    <ha-button slot="primaryAction" @click=${()=>e?this._saveBulkLineStyle():this._saveLine()}>
                        <ha-icon icon="mdi:content-save" slot="start"></ha-icon>
                        ${e?"Apply to Selected":"Save"}
                    </ha-button>
                </ha-dialog-footer>
            </ha-dialog>
        `}_renderLineFormTabContent(){switch(this._lineFormActiveSubtab){case"basic":return this._renderLineFormBasic();case"style":return this._renderLineFormStyle();case"markers":return this._renderLineFormMarkers();case"routing":return this._renderLineFormRouting();case"animation":return this._renderLineFormAnimation();default:return this._renderLineFormBasic()}}_renderLineFormBasic(){var l;const e=((l=this._workingConfig.msd)==null?void 0:l.anchors)||{},t=this._getBaseSvgAnchors(),i=[...this._getControlOverlays(),...this._getShapeOverlays()],o=Object.keys(e).map(d=>({value:d,label:`Anchor: ${d}`})),r=Object.keys(t).map(d=>({value:d,label:`Base SVG: ${d}`})),s=i.map(d=>({value:d.id,label:`Overlay: ${d.id} (${d.type})`})),a=[...o,...r,...s];return this._isOverlayId(this._lineFormData.anchor),this._isOverlayId(this._lineFormData.attach_to),this._getRoutingModeInfo(this._lineFormData.route||"auto"),v`
            <div class="subform-field-stack">
                <!-- Line ID -->
                <ha-input
                    label="Line ID"
                    .value=${this._lineFormData.id}
                    @input=${d=>{this._lineFormData.id=d.target.value,this.requestUpdate()}}
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
                                @value-changed=${d=>{this._lineFormData.anchor=d.detail.value,this.requestUpdate()}}>
                            </ha-selector>

                            <div class="subform-row-aside">
                                <lcards-position-picker
                                    .value=${this._lineFormData.anchor_side||"center"}
                                    .label=${"Anchor Side"}
                                    .helper=${"Select attachment point on the source"}
                                    @value-changed=${d=>{const c={"top-center":"top","bottom-center":"bottom","center-left":"left","center-right":"right"};this._lineFormData.anchor_side=c[d.detail.value]||d.detail.value,this.requestUpdate()}}>
                                </lcards-position-picker>

                                <ha-input
                                    style="width: 100%; box-sizing: border-box;"
                                    type="number"
                                    label="Gap (vb units)"
                                    .value=${String(this._lineFormData.anchor_gap||0)}
                                    @input=${d=>{this._lineFormData.anchor_gap=Number(d.target.value),this.requestUpdate()}}
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
                                @value-changed=${d=>{this._lineFormData.attach_to=d.detail.value,this.requestUpdate()}}>
                            </ha-selector>

                            <div class="subform-row-aside">
                                <lcards-position-picker
                                    .value=${this._lineFormData.attach_side||"center"}
                                    .label=${"Attach Side"}
                                    .helper=${"Select attachment point on the target"}
                                    @value-changed=${d=>{const c={"top-center":"top","bottom-center":"bottom","center-left":"left","center-right":"right"};this._lineFormData.attach_side=c[d.detail.value]||d.detail.value,this.requestUpdate()}}>
                                </lcards-position-picker>

                                <ha-input
                                    style="width: 100%; box-sizing: border-box;"
                                    type="number"
                                    label="Gap (vb units)"
                                    .value=${String(this._lineFormData.attach_gap||0)}
                                    @input=${d=>{this._lineFormData.attach_gap=Number(d.target.value),this.requestUpdate()}}
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
                        @input=${d=>{const c=d.target.value;this._lineFormData.z_index=c===""?null:Number(c),this.requestUpdate()}}
                        hint="Higher values paint on top. Leave blank to use the default (100, so lines paint under controls).">
                    </ha-input>
                </lcards-form-section>
            </div>
        `}_renderLineFormRouting(){const e=this._lineFormData.route||"auto",t={direct:{icon:"mdi:vector-line",title:"Direct",description:"Straight line from source to target"},angled:{icon:"mdi:vector-polyline",title:"Angled",description:"A short straight stub out of the start side (and into the end side when one is set), then one straight run at any angle. No pathfinding. Set the start side so the stub leaves the label toward the part."},manual:{icon:"mdi:map-marker-path",title:"Manual",description:"Draw custom path through explicit waypoints"},auto:{icon:"mdi:routes",title:"Auto",description:"Full pathfinding: obstacle avoidance, trunk bundling with nearby lines, and crossing avoidance, always, whether or not obstacles/channels are present"},manhattan:{icon:"mdi:vector-polyline",title:"Manhattan (Advanced)",description:"A fixed single-bend elbow shape: no pathfinding, no obstacle avoidance, no bundling, no crossing avoidance. The cheap, fully predictable opt-out from Auto."},grid:{icon:"mdi:grid",title:"Grid (Advanced)",description:"Same full pathfinding as Auto: obstacle avoidance, bundling, crossing avoidance, but skips the extra local-search refinement pass Auto/Smart adds on top."}},i=t[e]||t.auto;let o="";if(e==="auto"){const r=this._getControlOverlays().some(a=>a.obstacle===true);this._lineFormData.route_channels&&this._lineFormData.route_channels.length>0?o="This line routes through its configured channel(s).":r?o="Obstacles are present on this card, so this line will avoid them.":o="No obstacles or channels on this card: a direct path with no avoidance needed. Still bundles with nearby parallel lines and avoids crossing them."}return v`
            <div class="subform-field-stack">
                <!-- Routing Mode -->
                <lcards-form-section
                    header="Routing Mode"
                    description="How the line is drawn between points"
                    icon="mdi:routes"
                    ?expanded=${true}>

                    <ha-selector
                        .hass=${this.hass}
                        .selector=${{select:{mode:"dropdown",options:[{value:"auto",label:"Auto (Recommended)"},{value:"direct",label:"Direct (Straight line)"},{value:"angled",label:"Angled (Side stub, then straight)"},{value:"manual",label:"Manual (Custom waypoints)"},{value:"manhattan",label:"Manhattan (Advanced: opt out of bundling)"},{value:"grid",label:"Grid (Advanced: skip refinement pass)"}]}}}
                        .value=${e}
                        .label=${"Route"}
                        @value-changed=${r=>{this._lineFormData.route=r.detail.value,this.requestUpdate()}}>
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

                    ${e==="auto"||e==="direct"||e==="angled"?v`
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
                            @value-changed=${r=>{const s=r.detail.value;s===""?delete this._lineFormData.route_hint:this._lineFormData.route_hint=s,this.requestUpdate()}}>
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .selector=${{select:{options:[{value:"",label:"Auto (No preference)"},{value:"xy",label:"Horizontal Last (xy)"},{value:"yx",label:"Vertical Last (yx)"}]}}}
                            .value=${this._lineFormData.route_hint_last||""}
                            .label=${"Final Direction"}
                            helper="xy = horizontal then vertical, yx = vertical then horizontal"
                            @value-changed=${r=>{const s=r.detail.value;s===""?delete this._lineFormData.route_hint_last:this._lineFormData.route_hint_last=s,this.requestUpdate()}}
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
                                        @click=${()=>{var l;this._lineFormData.waypoints||(this._lineFormData.waypoints=[]);const r=((l=this._workingConfig.msd)==null?void 0:l.view_box)||this._extractedViewBox||[0,0,1920,1080],s=r[0]+r[2]/2,a=r[1]+r[3]/2;this._lineFormData.waypoints.push([s,a]),this._waypointEditingLineId=this._lineFormData.id,this._showWaypointMarkers=true,this.requestUpdate()}}
                                        size="s">
                                        <ha-icon icon="mdi:plus" slot="start"></ha-icon>
                                        Add Waypoint
                                    </ha-button>
                                </div>

                                ${(this._lineFormData.waypoints||[]).length>0?v`
                                    <div style="display: flex; flex-direction: column; gap: 8px;">
                                        ${(this._lineFormData.waypoints||[]).map((r,s)=>v`
                                            <div style="
                                                display: flex;
                                                align-items: center;
                                                gap: 12px;
                                                padding: 12px;
                                                background: var(--card-background-color);
                                                border-radius: 42px;
                                                border: 1px solid ${this._draggedWaypointIndex===s?"var(--primary-color)":"var(--divider-color)"};
                                                opacity: ${this._draggedWaypointIndex===s?"0.5":"1"};
                                                transition: opacity 0.2s, border-color 0.2s;
                                                cursor: ${this._draggedWaypointIndex===s?"grabbing":"grab"};
                                            "
                                            draggable="true"
                                            @dragstart=${a=>this._handleWaypointDragStart(a,s)}
                                            @dragend=${a=>this._handleWaypointDragEnd(a)}
                                            @dragover=${a=>this._handleWaypointDragOver(a,s)}
                                            @drop=${a=>this._handleWaypointDrop(a,s)}>
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
                                                ">${s+1}</div>

                                                <!-- Waypoint Content (Coordinates or Named Anchor) -->
                                                ${typeof r=="string"?v`
                                                    <!-- Named Anchor -->
                                                    <ha-input
                                                        label="Anchor"
                                                        .value=${r}
                                                        @input=${a=>{this._lineFormData.waypoints[s]=a.target.value,this._schedulePreviewUpdate(),this.requestUpdate()}}
                                                        style="flex: 1; min-width: 120px;">
                                                    </ha-input>
                                                `:v`
                                                    <!-- Coordinates -->
                                                    <div style="flex: 1; display: flex; gap: 8px; min-width: 0;">
                                                        <ha-input
                                                            type="number"
                                                            label="X"
                                                            .value=${String(r[0]||0)}
                                                            @input=${a=>{this._lineFormData.waypoints[s][0]=this._roundToPrecision(Number(a.target.value)),this._schedulePreviewUpdate(),this.requestUpdate()}}
                                                            style="flex: 1; min-width: 80px;">
                                                        </ha-input>
                                                        <ha-input
                                                            type="number"
                                                            label="Y"
                                                            .value=${String(r[1]||0)}
                                                            @input=${a=>{this._lineFormData.waypoints[s][1]=this._roundToPrecision(Number(a.target.value)),this._schedulePreviewUpdate(),this.requestUpdate()}}
                                                            style="flex: 1; min-width: 80px;">
                                                        </ha-input>
                                                        <ha-input
                                                            type="number"
                                                            label=${this._lineFormData.corner_style==="bevel"?"Cut Size":"Radius"}
                                                            .value=${String(r[2]??"")}
                                                            @input=${a=>{const l=a.target.value,d=this._lineFormData.waypoints[s];if(l==="")d.length>=3&&d.splice(2,d.length-2);else{const c=Math.max(0,this._roundToPrecision(Number(l)));d.length>=3?d[2]=c:d.push(c)}this._schedulePreviewUpdate(),this.requestUpdate()}}
                                                            style="flex: 0.8; min-width: 70px;"
                                                            title="Overrides this corner's ${this._lineFormData.corner_style==="bevel"?"cut size":"radius"}. Blank inherits the line default (${this._lineFormData.corner_radius??34})">
                                                        </ha-input>
                                                    </div>
                                                `}

                                                <!-- Toggle Type Button -->
                                                <ha-icon-button
                                                    @click=${()=>{var a;if(typeof r=="string"){const l=((a=this._workingConfig.msd)==null?void 0:a.view_box)||this._extractedViewBox||[0,0,1920,1080];this._lineFormData.waypoints[s]=[l[0]+l[2]/2,l[1]+l[3]/2]}else this._lineFormData.waypoints[s]="";this._schedulePreviewUpdate(),this.requestUpdate()}}
                                                    .label=${typeof r=="string"?"Switch to coordinates":"Switch to anchor"}
                                                    style="flex-shrink: 0;">
                                                    <ha-icon icon="${typeof r=="string"?"mdi:map-marker-outline":"mdi:crosshairs-gps"}"></ha-icon>
                                                </ha-icon-button>

                                                <!-- Delete Button -->
                                                <ha-icon-button
                                                    @click=${()=>{this._lineFormData.waypoints.splice(s,1),this._schedulePreviewUpdate(),this.requestUpdate()}}
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
                                @input=${r=>{const s=r.target.value;s===""?delete this._lineFormData.clearance:this._lineFormData.clearance=Number(s),this.requestUpdate()}}
                                hint="Minimum distance from obstacles, vb units (leave empty for default: 8)"
                                style="width: 100%;">
                            </ha-input>

                            <ha-input
                                type="number"
                                label="Stub Length (vb units)"
                                .value=${String(this._lineFormData.stub_length??"")}
                                @input=${r=>{const s=r.target.value;s===""?delete this._lineFormData.stub_length:this._lineFormData.stub_length=Number(s),this.requestUpdate()}}
                                hint="Overrides the mandatory departure/arrival stub length (leave empty to use the router's own auto/forced resolution: see Corner Size Mode on the Style tab). Going below one grid cell risks re-triggering an internal same-cell short-circuit; check window.lcards.debug.msd.routing.inspect(id).meta.debug for the router's resolved value first."
                                style="width: 100%; margin-top: 12px;">
                            </ha-input>

                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{number:{min:0,max:20,step:1,mode:"slider"}}}
                                .value=${this._lineFormData.corner_room_weight??4}
                                .label=${"Corner Room Weight"}
                                @value-changed=${r=>{this._lineFormData.corner_room_weight=r.detail.value,this.requestUpdate()}}
                                helper="How hard this line fights to keep its full Corner Radius when a tight detour would otherwise squash it: 0 = never bend the route for it (this line opts out), higher = more willing to accept a longer or more-bent route to keep corners full. Card-wide default is 4; a line with a small custom Corner Radius may need a higher value for a similar effect."
                                style="margin-top: 12px;">
                            </ha-selector>
                        </lcards-form-section>
                    `:""}
            </div>
        `}_getLineColorEditorAdapter(){const e=this;return{hass:this.hass,config:this._lineFormData,_getConfigValue(t){return t.split(".").reduce((i,o)=>i==null?void 0:i[o],e._lineFormData)},_setConfigValue(t,i){const o=t.split("."),r=o.pop();if(r==="__proto__"||r==="constructor"||r==="prototype")return;let s=e._lineFormData;for(const a of o){if(a==="__proto__"||a==="constructor"||a==="prototype")return;(!s[a]||typeof s[a]!="object")&&(s[a]={}),s=s[a]}s[r]=i,e.requestUpdate()}}}_renderLineColorSection(){var r,s;const e=this._lineFormData.entity||"",t=e&&((s=(r=this.hass)==null?void 0:r.states)!=null&&s[e])?Object.keys(this.hass.states[e].attributes||{}).sort().map(a=>({value:a,label:a})):[],i=[...t],o=i.findIndex(a=>a.value==="brightness");return o>=0&&i.splice(o+1,0,{value:"brightness_pct",label:"brightness_pct  (auto 0–100%)"}),v`
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
        `}_renderMarkerColorField(e,t,i){var s;const o=((s=this._lineFormData.style)==null?void 0:s[e])||{},r=o[t]==="match_line";return v`
            <div>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <div style="font-size: 14px; font-weight: 500; color: var(--primary-text-color);">${i}</div>
                    <ha-switch
                        .checked=${r}
                        @change=${a=>{this._lineFormData.style={...this._lineFormData.style,[e]:{...this._lineFormData.style[e],[t]:a.target.checked?"match_line":""}},this.requestUpdate()}}>Match Line Color</ha-switch>
                </div>
                ${r?"":v`
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
        `:""}_renderLineFormMarkers(){var e,t,i,o,r,s,a,l;return v`
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
                        @value-changed=${d=>{var u,p;const c=d.detail.value;if(c==="none"){const{marker_start:g,..._}=this._lineFormData.style||{};this._lineFormData.style=_}else{const g=((p=(u=this._lineFormData.style)==null?void 0:u.marker_start)==null?void 0:p.size)??10;this._lineFormData.style={...this._lineFormData.style,marker_start:{type:c,size:g}}}this.requestUpdate()}}>
                    </ha-selector>

                    ${(o=(i=this._lineFormData.style)==null?void 0:i.marker_start)!=null&&o.type&&this._lineFormData.style.marker_start.type!=="none"?v`
                        <ha-input
                            type="number"
                            label="Size (vb units)"
                            .value=${String(this._lineFormData.style.marker_start.size??10)}
                            step="1"
                            min="1"
                            style="margin-top: 12px;"
                            @input=${d=>{this._lineFormData.style={...this._lineFormData.style,marker_start:{...this._lineFormData.style.marker_start,size:Number(d.target.value)||10}},this.requestUpdate()}}>
                        </ha-input>

                        ${this._lineFormData.style.marker_start.type==="rect"?v`
                            <ha-selector
                                style="display: block; margin-top: 12px;"
                                .hass=${this.hass}
                                .label=${"Filled"}
                                .selector=${{boolean:{}}}
                                .value=${this._lineFormData.style.marker_start.filled===true}
                                @value-changed=${d=>{this._lineFormData.style={...this._lineFormData.style,marker_start:{...this._lineFormData.style.marker_start,filled:d.detail.value}},this.requestUpdate()}}>
                            </ha-selector>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
                                <ha-input
                                    type="number"
                                    label="Width (vb units)"
                                    .value=${String(this._lineFormData.style.marker_start.width??this._lineFormData.style.marker_start.size??10)}
                                    step="1"
                                    min="1"
                                    @input=${d=>{this._lineFormData.style={...this._lineFormData.style,marker_start:{...this._lineFormData.style.marker_start,width:Number(d.target.value)||10}},this.requestUpdate()}}>
                                </ha-input>
                                <ha-input
                                    type="number"
                                    label="Height (vb units)"
                                    .value=${String(this._lineFormData.style.marker_start.height??this._lineFormData.style.marker_start.size??10)}
                                    step="1"
                                    min="1"
                                    @input=${d=>{this._lineFormData.style={...this._lineFormData.style,marker_start:{...this._lineFormData.style.marker_start,height:Number(d.target.value)||10}},this.requestUpdate()}}>
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
                                @input=${d=>{this._lineFormData.style={...this._lineFormData.style,marker_start:{...this._lineFormData.style.marker_start,stroke_width:Number(d.target.value)||0}},this.requestUpdate()}}>
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
                        .value=${((s=(r=this._lineFormData.style)==null?void 0:r.marker_end)==null?void 0:s.type)||"none"}
                        .label=${"Type"}
                        @value-changed=${d=>{var u,p;const c=d.detail.value;if(c==="none")this._lineFormData.style={...this._lineFormData.style,marker_end:null};else{const g=((p=(u=this._lineFormData.style)==null?void 0:u.marker_end)==null?void 0:p.size)??10;this._lineFormData.style={...this._lineFormData.style,marker_end:{type:c,size:g}}}this.requestUpdate()}}>
                    </ha-selector>

                    ${(l=(a=this._lineFormData.style)==null?void 0:a.marker_end)!=null&&l.type&&this._lineFormData.style.marker_end.type!=="none"?v`
                        <ha-input
                            type="number"
                            label="Size (vb units)"
                            .value=${String(this._lineFormData.style.marker_end.size??10)}
                            step="1"
                            min="1"
                            style="margin-top: 12px;"
                            @input=${d=>{this._lineFormData.style={...this._lineFormData.style,marker_end:{...this._lineFormData.style.marker_end,size:Number(d.target.value)||10}},this.requestUpdate()}}>
                        </ha-input>

                        ${this._lineFormData.style.marker_end.type==="rect"?v`
                            <ha-selector
                                style="display: block; margin-top: 12px;"
                                .hass=${this.hass}
                                .label=${"Filled"}
                                .selector=${{boolean:{}}}
                                .value=${this._lineFormData.style.marker_end.filled===true}
                                @value-changed=${d=>{this._lineFormData.style={...this._lineFormData.style,marker_end:{...this._lineFormData.style.marker_end,filled:d.detail.value}},this.requestUpdate()}}>
                            </ha-selector>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
                                <ha-input
                                    type="number"
                                    label="Width (vb units)"
                                    .value=${String(this._lineFormData.style.marker_end.width??this._lineFormData.style.marker_end.size??10)}
                                    step="1"
                                    min="1"
                                    @input=${d=>{this._lineFormData.style={...this._lineFormData.style,marker_end:{...this._lineFormData.style.marker_end,width:Number(d.target.value)||10}},this.requestUpdate()}}>
                                </ha-input>
                                <ha-input
                                    type="number"
                                    label="Height (vb units)"
                                    .value=${String(this._lineFormData.style.marker_end.height??this._lineFormData.style.marker_end.size??10)}
                                    step="1"
                                    min="1"
                                    @input=${d=>{this._lineFormData.style={...this._lineFormData.style,marker_end:{...this._lineFormData.style.marker_end,height:Number(d.target.value)||10}},this.requestUpdate()}}>
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
                                @input=${d=>{this._lineFormData.style={...this._lineFormData.style,marker_end:{...this._lineFormData.style.marker_end,stroke_width:Number(d.target.value)||0}},this.requestUpdate()}}>
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
        `}_renderLineFormStyle(){var o,r,s,a,l,d,c,u;const e=((o=this._lineFormData.style)==null?void 0:o.dash_array)||"";let t="solid";return e==="5,5"?t="dashed":e==="2,2"||e==="0,4"?t="dotted":e==="8,4,2,4"||e==="8,4,0,4"?t="dash-dot":e&&e!==""&&(t="custom"),[...(((r=this._workingConfig.msd)==null?void 0:r.animations)||[]).map(p=>({value:p.id,label:p.id}))],v`
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
                            .value=${((s=this._lineFormData.style)==null?void 0:s.width)||2}
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
                            @value-changed=${p=>{var b;const g=p.detail.value;let _="",f=(b=this._lineFormData.style)==null?void 0:b.line_cap;g==="dashed"?_="5,5":g==="dotted"?(_="0,4",f="round"):g==="dash-dot"?(_="8,4,0,4",f="round"):g==="solid"&&(_=""),g!=="custom"&&(this._lineFormData.style={...this._lineFormData.style,dash_array:_,line_cap:f},this.requestUpdate())}}
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
                                ${(()=>{const p=(e||"").split(",").map(w=>parseFloat(w.trim())||0),g=p[0]??5,_=p[1]??5,f=p[2]||0,b=p[3]||0;return v`
                                        <!-- Dash 1 -->
                                        <ha-selector
                                            .hass=${this.hass}
                                            .selector=${{number:{min:0,max:50,step:1,mode:"slider"}}}
                                            .value=${g}
                                            .label=${"Dash Length"}
                                            @value-changed=${w=>{const S=w.detail.value;let C;f>0?C=`${S},${_},${f},${b}`:C=`${S},${_}`,this._lineFormData.style={...this._lineFormData.style,dash_array:C},this.requestUpdate()}}>
                                        </ha-selector>

                                        <!-- Gap 1 -->
                                        <ha-selector
                                            .hass=${this.hass}
                                            .selector=${{number:{min:0,max:50,step:1,mode:"slider"}}}
                                            .value=${_}
                                            .label=${"Gap Length"}
                                            @value-changed=${w=>{const S=w.detail.value;let C;f>0?C=`${g},${S},${f},${b}`:C=`${g},${S}`,this._lineFormData.style={...this._lineFormData.style,dash_array:C},this.requestUpdate()}}
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
                                                @value-changed=${w=>{const S=w.detail.value,C=`${g},${_},${S},${b}`;this._lineFormData.style={...this._lineFormData.style,dash_array:C},this.requestUpdate()}}
                                                style="margin-top: 12px;">
                                            </ha-selector>

                                            <!-- Gap 2 -->
                                            <ha-selector
                                                .hass=${this.hass}
                                                .selector=${{number:{min:0,max:50,step:1,mode:"slider"}}}
                                                .value=${b}
                                                .label=${"Secondary Gap"}
                                                @value-changed=${w=>{const S=w.detail.value,C=`${g},${_},${f},${S}`;this._lineFormData.style={...this._lineFormData.style,dash_array:C},this.requestUpdate()}}
                                                style="margin-top: 12px;">
                                            </ha-selector>
                                        `:""}

                                        <!-- Current Pattern Display -->
                                        <div style="margin-top: 12px; font-size: 12px; color: var(--secondary-text-color); font-family: monospace;">
                                            Pattern: ${f>0?`${g},${_},${f},${b}`:`${g},${_}`}
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
                                    .selector=${{number:{min:1,max:5,step:1,mode:"slider"}}}
                                    .value=${this._lineFormData.smoothing_iterations||1}
                                    .label=${"Smoothing Iterations"}
                                    @value-changed=${p=>{this._lineFormData.smoothing_iterations=p.detail.value,this.requestUpdate()}}
                                    helper="More iterations = smoother curves (default: 1)"
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
                                .value=${((d=this._lineFormData.style)==null?void 0:d.line_join)||this._lineFormData.corner_style||"miter"}
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
                                .value=${((c=this._lineFormData.style)==null?void 0:c.stroke)||""}
                                @input=${p=>{const g=p.target.value.trim();if(g===""){const{stroke:_,...f}=this._lineFormData.style||{};this._lineFormData.style=f}else this._lineFormData.style={...this._lineFormData.style,stroke:g};this.requestUpdate()}}
                                hint="Override color with custom stroke (e.g., url(#gradient))"
                                style="width: 100%;">
                            </ha-input>

                            <!-- Dash Offset -->
                            <ha-input
                                type="number"
                                label="Dash Offset"
                                .value=${String(((u=this._lineFormData.style)==null?void 0:u.dash_offset)||0)}
                                @input=${p=>{this._lineFormData.style={...this._lineFormData.style,dash_offset:Number(p.target.value)||0},this.requestUpdate()}}
                                hint="Shifts the dash pattern (vb units)"
                                style="margin-top: 12px; width: 100%;">
                            </ha-input>
                        </div>
                    </div>
                </lcards-form-section>
            </div>
        `}_renderLineStylePreviewVertical(){var f,b,w,S,C,D,M,k;const e=(f=this._lineFormData.style)==null?void 0:f.color,t=typeof e=="object"&&e!==null?e.default||e.active||Object.values(e)[0]:e,i=typeof t=="string"&&(t.includes("{{")||t.includes("{%")||t.includes("[[[")),o=i?"var(--lcars-orange)":t||"var(--lcars-orange)",r=((b=this._lineFormData.style)==null?void 0:b.width)||2,s=((w=this._lineFormData.style)==null?void 0:w.opacity)??1,a=((S=this._lineFormData.style)==null?void 0:S.dash_array)||"",l=(C=this._lineFormData.style)==null?void 0:C.marker_start,d=(D=this._lineFormData.style)==null?void 0:D.marker_end,c=this._lineFormData.corner_style||"round",u=((M=this._lineFormData.style)==null?void 0:M.line_cap)||"butt",p=((k=this._lineFormData.style)==null?void 0:k.line_join)||c;let g="M 20,40 L 20,240 L 180,240";try{const F=new ui({},{},[0,0,200,280]),L=this._lineFormData.route==="manual"?"manhattan":this._lineFormData.route||"auto",q={id:"style-preview",_raw:{...this._lineFormData,route:L}},z=F.buildRouteRequest(q,[20,40],[180,240]),U=F.computePath(z);U!=null&&U.d&&(g=U.d)}catch(F){m.warn("[MSDStudio] Line style preview routing failed, using fallback path",F)}const _=h((F,L,q)=>{if(!(F!=null&&F.type)||F.type==="none")return"";const z={...F,fill:F.fill==="match_line"?o:F.fill,stroke:F.stroke==="match_line"?o:F.stroke};return ko.prototype._createMarkerDefinition(z,L,q,s)},"createMarker");return v`
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; padding: 20px; background: #0a0a0a; border-radius: 8px; border: 1px solid #333; overflow: hidden;">
                ${i?v`
                    <lcards-message type="info" message="Templates aren't evaluated in this preview: showing the default color." style="width: 100%;">
                    </lcards-message>
                `:""}
                <!-- color: sets currentColor fallback for unfilled markers (card host normally provides this) -->
                <svg viewBox="0 0 200 280" preserveAspectRatio="xMidYMid meet" style="flex: 1; width: 100%; min-height: 0; max-height: 500px; color: ${o};">
                    <defs>
                        ${xe(_(l,"start-preview-v","start"))}
                        ${xe(_(d,"end-preview-v","end"))}
                    </defs>
                    <path
                        d="${g}"
                        stroke="${o}"
                        stroke-width="${r}"
                        stroke-opacity="${s}"
                        stroke-dasharray="${a}"
                        stroke-linecap="${u}"
                        stroke-linejoin="${p}"
                        fill="none"
                        marker-start="${l!=null&&l.type&&l.type!=="none"?"url(#start-preview-v)":""}"
                        marker-end="${d!=null&&d.type&&d.type!=="none"?"url(#end-preview-v)":""}"
                    />
                </svg>
            </div>
        `}_renderShapeStylePreviewVertical(){const e=this._shapeFormData.kind,t=this._shapeFormData.style||{},i=h((_,f)=>{const b=typeof _=="object"&&_!==null?_.default||_.active||Object.values(_)[0]:_,w=typeof b=="string"&&(b.includes("{{")||b.includes("{%")||b.includes("[[["));return{value:w?f:b||f,isTemplate:w}},"resolveCandidate"),o=i(t.color,"var(--lcars-orange)"),r=i(t.fill,"none"),s=o.value,a=r.value,l=o.isTemplate||r.isTemplate,d=t.width??2,c=t.opacity??1,u=t.dash_array||"",p=t.fill_opacity??1;let g;if(e==="polyline"){const _=t.line_cap||"butt",f=t.line_join||this._shapeFormData.corner_style||"miter";let b="M 20,40 L 20,240 L 180,240";try{const w=new ui({},{},[0,0,200,280]),S={id:"shape-style-preview",_raw:{route:"manual",corner_style:this._shapeFormData.corner_style,corner_radius:this._shapeFormData.corner_radius,corner_angle:this._shapeFormData.corner_angle,smoothing_mode:this._shapeFormData.smoothing_mode,smoothing_iterations:this._shapeFormData.smoothing_iterations}},C=w.buildRouteRequest(S,[20,40],[180,240]),D=w.computePath(C);D!=null&&D.d&&(b=this._shapeFormData.closed?`${D.d} Z`:D.d)}catch(w){m.warn("[MSDStudio] Shape style preview routing failed, using fallback path",w)}g=`<path
                    d="${b}"
                    stroke="${s}"
                    stroke-width="${d}"
                    stroke-opacity="${c}"
                    stroke-dasharray="${u}"
                    stroke-linecap="${_}"
                    stroke-linejoin="${f}"
                    fill="${this._shapeFormData.closed?a:"none"}"
                    fill-opacity="${p}"
                />`}else if(e==="rect"){const _=this._shapeFormData.corner_style==="round"?this._shapeFormData.corner_radius??8:0;g=`<rect x="20" y="40" width="160" height="200" rx="${_}" ry="${_}"
                      stroke="${s}" stroke-width="${d}" stroke-opacity="${c}"
                      stroke-dasharray="${u}" fill="${a}" fill-opacity="${p}" />`}else g=`<ellipse cx="100" cy="140" rx="80" ry="100"
                         stroke="${s}" stroke-width="${d}" stroke-opacity="${c}"
                         stroke-dasharray="${u}" fill="${a}" fill-opacity="${p}" />`;return v`
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; padding: 20px; background: #0a0a0a; border-radius: 8px; border: 1px solid #333; overflow: hidden;">
                ${l?v`
                    <lcards-message type="info" message="Templates aren't evaluated in this preview: showing the default color." style="width: 100%;">
                    </lcards-message>
                `:""}
                <svg viewBox="0 0 200 280" preserveAspectRatio="xMidYMid meet" style="flex: 1; width: 100%; min-height: 0; max-height: 500px; color: ${s};">
                    ${xe(g)}
                </svg>
            </div>
        `}_handleKeyDown(e){var s,a,l,d;if(e.key==="Escape"&&this._activeMode===R.QUICK_LABEL&&!this._showCardEditorForm&&!this._showLineForm&&!this._showShapeForm&&!this._showControlForm&&!this._showAnchorForm&&this._editingChannelId===null){e.preventDefault(),e.stopPropagation(),this._quickLabelEscape();return}const t=(a=(s=e.composedPath)==null?void 0:s.call(e))==null?void 0:a[0],i=((l=t==null?void 0:t.tagName)==null?void 0:l.toLowerCase())??"";if(i==="input"||i==="textarea"||i==="select"||i.includes("input")||i.includes("textfield")||i.includes("textarea")||t!=null&&t.isContentEditable)return;const o=((d=e.target)==null?void 0:d.tagName)??"";if(o==="INPUT"||o==="TEXTAREA"||o==="SELECT"||o==="HA-TEXTFIELD")return;if(e.key==="Escape"){e.preventDefault(),e.stopPropagation(),this._showCardEditorForm?this._closeCardEditorForm():this._showLineForm?this._closeLineForm():this._showShapeForm?this._closeShapeForm():this._showControlForm?this._closeControlForm():this._showAnchorForm?this._closeAnchorForm():this._editingChannelId!==null?this._closeChannelForm():this._activeMode!==R.VIEW?this._setMode(R.VIEW):this._selectedShapeId&&(this._selectedShapeId=null,this.requestUpdate());return}const r=e.key.toLowerCase();if((e.ctrlKey||e.metaKey)&&!e.altKey&&(r==="z"||r==="y")){e.preventDefault(),e.stopPropagation(),r==="y"||e.shiftKey?this._redo():this._undo();return}if(e.key==="Enter"&&this._activeMode===R.DRAW_SHAPE&&this._drawShapeState.kind==="polyline"){e.preventDefault(),e.stopPropagation(),this._finishDrawShapePolyline();return}if((e.ctrlKey||e.metaKey)&&e.key==="s"){e.preventDefault(),this._handleSave();return}if(e.key==="Delete"){e.preventDefault(),m.debug("[MSDStudio] Delete key pressed - no item selected");return}if(e.key==="g"||e.key==="G"){e.preventDefault(),this._showGrid=!this._showGrid,this.requestUpdate();return}if(e.key==="e"||e.key==="E"){e.preventDefault(),this._toggleEditMode();return}}_updateRoutingConfig(e,t){this._workingConfig.msd||(this._workingConfig.msd={}),this._workingConfig.msd.routing||(this._workingConfig.msd.routing={}),t==null||t===""?delete this._workingConfig.msd.routing[e]:this._workingConfig.msd.routing[e]=t,this._markDirty(),this.requestUpdate()}_updateRoutingCostDefaults(e,t){this._workingConfig.msd||(this._workingConfig.msd={}),this._workingConfig.msd.routing||(this._workingConfig.msd.routing={}),this._workingConfig.msd.routing.cost_defaults||(this._workingConfig.msd.routing.cost_defaults={}),t==null||t===""?(delete this._workingConfig.msd.routing.cost_defaults[e],Object.keys(this._workingConfig.msd.routing.cost_defaults).length===0&&delete this._workingConfig.msd.routing.cost_defaults):this._workingConfig.msd.routing.cost_defaults[e]=t,this._markDirty(),this.requestUpdate()}_validateConfiguration(){const e=[],t=this._workingConfig.msd||{},i=t.anchors||{},r={...this._getBaseSvgAnchors(),...i},s=t.overlays||[];s.filter(c=>c.type==="line").forEach(c=>{c.anchor&&typeof c.anchor=="string"&&(r[c.anchor]||s.find(p=>p.id===c.anchor&&p.type!=="line")||e.push({type:"line",id:c.id,field:"anchor",message:`Line "${c.id}": Source anchor "${c.anchor}" does not exist`})),c.attach_to&&typeof c.attach_to=="string"&&(r[c.attach_to]||s.find(p=>p.id===c.attach_to&&p.type!=="line")||e.push({type:"line",id:c.id,field:"attach_to",message:`Line "${c.id}": Target "${c.attach_to}" does not exist`}))});const l=t.channels||{};return Object.entries(l).forEach(([c,u])=>{if(u.bounds&&Array.isArray(u.bounds)){const[p,g,_,f]=u.bounds;(_<=0||f<=0)&&e.push({type:"channel",id:c,field:"bounds",message:`Channel "${c}": Width and height must be positive (got ${_}×${f})`})}}),s.filter(c=>c.type==="control").forEach(c=>{if(c.size&&Array.isArray(c.size)){const[u,p]=c.size;(u<=0||p<=0)&&e.push({type:"control",id:c.id,field:"size",message:`Control "${c.id}": Width and height must be positive (got ${u}×${p})`})}c.position&&typeof c.position=="string"&&(c.position===c.id?e.push({type:"control",id:c.id,field:"position",message:`Control "${c.id}": cannot use itself as its own position anchor`}):r[c.position]||s.find(p=>p.id===c.position&&p.type!=="line")||e.push({type:"control",id:c.id,field:"position",message:`Control "${c.id}": position anchor "${c.position}" does not exist`}))}),e}_getValidationErrorCount(){return this._validationErrors.length}async _showValidationErrors(){const e=this._validationErrors.map(t=>`• ${t.message}`).join("<br>");await this._showDialog("Validation Errors",`${e}<br><br><strong>Please fix these issues before saving.</strong>`,"warning")}_showSuccessToast(e){const t=document.createElement("div");t.textContent=e,t.style.cssText=`
            position: fixed;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--success-color, #4caf50);
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            box-shadow: var(--ha-box-shadow-m);
            z-index: 10000;
            font-weight: 500;
        `,document.body.appendChild(t),setTimeout(()=>{t.remove()},3e3)}async _confirmAction(e){return await this._showConfirmDialog("Confirm Action",e,{confirmLabel:"Discard",variant:"danger"})}async _showDialog(e,t,i="info"){return new Promise(o=>{const r=document.createElement("ha-dialog");r.headerTitle=e,r.open=true;const s=document.createElement("div");s.innerHTML=t,s.style.padding="16px",r.appendChild(s);const a=document.createElement("ha-button");a.textContent="OK",a.autofocus=true,a.addEventListener("click",()=>{r.open=false,o(void 0)}),r.appendChild(ai({primary:[a]})),nt(r,()=>{r.remove()}),rt(r,this)})}render(){var e;return setTimeout(()=>this._injectLineHighlightStyles(),100),v`
            <ha-dialog
                open
                @closed=${this._onDialogClosed}
                prevent-scrim-close
                flexcontent
                header-title="MSD Configuration Studio">

                <ha-dialog-footer slot="footer">
                    <div slot="secondaryAction" class="footer-start">
                        <ha-button @click=${()=>window.open(ci(hi.msd),"_blank","noopener")} appearance="plain">
                            <ha-icon icon="mdi:book-open-variant" slot="start"></ha-icon>
                            Documentation
                        </ha-button>
                        <ha-button class="history-undo" @click=${()=>this._undo()} appearance="plain"
                            title="Undo (Ctrl+Z)" ?disabled=${!this._history.canUndo||this._historyBlocked()}>
                            <ha-icon icon="mdi:undo" slot="start"></ha-icon>
                            Undo
                        </ha-button>
                        <ha-button class="history-redo" @click=${()=>this._redo()} appearance="plain"
                            title="Redo (Ctrl+Shift+Z)" ?disabled=${!this._history.canRedo||this._historyBlocked()}>
                            <ha-icon icon="mdi:redo" slot="start"></ha-icon>
                            Redo
                        </ha-button>
                        <ha-button @click=${this._handleReset} appearance="plain" variant="warning">
                            <ha-icon icon="mdi:restore" slot="start"></ha-icon>
                            Reset
                        </ha-button>
                    </div>
                    <ha-button slot="secondaryAction" @click=${this._handleCancel} appearance="plain">Cancel</ha-button>
                    <ha-button slot="primaryAction" variant="brand" @click=${this._handleSave}>
                        <ha-icon icon="mdi:check" slot="start"></ha-icon>
                        Save
                    </ha-button>
                </ha-dialog-footer>

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
                            ${this._renderQuickLabelOverlay()}
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
        `}};h(ei,"LCARdSMSDStudioDialog");let It=ei;customElements.get("lcards-msd-studio-dialog")||customElements.define("lcards-msd-studio-dialog",It);const ti=class ti2 extends Fo{constructor(){super(),this.cardType="msd",this._cardPickerDialogRef=null,this._studio=null,m.debug("[LCARdSMSDEditor] Editor initialized with cardType: msd (1 tab: Configuration Studio launcher)")}updated(e){super.updated(e),e.has("hass")&&this._studio&&(this._studio.hass=this.hass)}connectedCallback(){super.connectedCallback(),this._boundHandleCardPickerRequest=this._handleCardPickerRequest.bind(this),document.addEventListener("open-card-picker",this._boundHandleCardPickerRequest),m.debug("[MSDEditor] Listening for card picker requests from MSD Studio")}disconnectedCallback(){super.disconnectedCallback(),this._boundHandleCardPickerRequest&&document.removeEventListener("open-card-picker",this._boundHandleCardPickerRequest),this._cardPickerDialogRef&&(this._cardPickerDialogRef.remove(),this._cardPickerDialogRef=null)}_getTabDefinitions(){return[{label:"Configuration",content:h(()=>this._renderConfigurationTab(),"content")},...this._getUtilityTabs()]}_renderConfigurationTab(){return v`
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

                ${oe.renderField(this,"id",{label:"Card ID",helper:"Unique identifier for rules engine targeting"})}

                ${oe.renderField(this,"tags",{label:"Tags",helper:"Tags for rules engine categorization"})}
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
                    ${oe.renderField(this,"height")}

                    ${oe.renderField(this,"width")}

                    ${oe.renderField(this,"min_height")}

                    ${oe.renderField(this,"min_width")}

                    ${oe.renderField(this,"max_height")}

                    ${oe.renderField(this,"max_width")}

                    ${oe.renderField(this,"overflow")}

                    ${oe.renderField(this,"z_index")}

                    ${oe.renderField(this,"overflow_x")}

                    ${oe.renderField(this,"overflow_y")}
                </div>
                ${this._renderLayoutCardHint()}
            </lcards-form-section>
        `}async _handleCardPickerRequest(e){e.stopPropagation();const{requestId:t,context:i}=e.detail;m.debug("[MSDEditor] Card picker requested:",{requestId:t,context:i}),this._cardPickerDialogRef&&(this._cardPickerDialogRef.remove(),this._cardPickerDialogRef=null);const o=document.createElement("ha-dialog");o.headerTitle="Select Card Type";const r=this._getLovelace();this._cardPickerDialogRef=o,rt(o,this),o.open=true,await o.updateComplete;const s=document.createElement("hui-card-picker");s.hass=this.hass,s.lovelace=r,s.style.padding="24px",s.style.display="block",o.appendChild(s),await new Promise(a=>setTimeout(a,100)),s?(typeof s.requestUpdate=="function"&&s.requestUpdate(),s.updateComplete&&await s.updateComplete,s.addEventListener("config-changed",a=>{var d,c;m.debug("[MSDEditor] Card selected:",(c=(d=a.detail)==null?void 0:d.config)==null?void 0:c.type);const l=new CustomEvent("card-picker-result",{bubbles:true,composed:true,detail:{requestId:t,context:i,config:a.detail.config}});document.dispatchEvent(l),o.open=false})):m.error("[MSDEditor] Failed to create hui-card-picker"),nt(o,()=>{o.remove(),this._cardPickerDialogRef===o&&(this._cardPickerDialogRef=null)})}_getLovelace(){var t;let e=((t=this.lovelace)==null?void 0:t.config)||this.lovelace||{};return e.views||(e={...e,views:[]}),e.views.length===0&&(e={...e,views:[{title:"Home",path:"home",cards:[]}]}),e}async _openMsdStudio(){m.debug("[MSDEditor] Opening MSD Configuration Studio");const e=document.createElement("lcards-msd-studio-dialog");e.hass=this.hass,e.config=JSON.parse(JSON.stringify(this.config||{})),this._studio=e;const t=h(i=>{i.target===this&&(m.debug("[MSDEditor] Forwarding card-picker-result to dialog:",i.detail),e.dispatchEvent(new CustomEvent("card-picker-result",{detail:i.detail})))},"cardPickerResultHandler");this.addEventListener("card-picker-result",t),e.addEventListener("config-changed",i=>{m.debug("[MSDEditor] Studio config changed:",i.detail.config),this.config=i.detail.config,this._isUpdatingYaml=true,this._yamlValue=Ao(this.config),requestAnimationFrame(()=>{this._isUpdatingYaml=false}),Mo(this,"config-changed",{config:this.config}),this.requestUpdate()}),nt(e,()=>{this.removeEventListener("card-picker-result",t),e.remove(),this._studio===e&&(this._studio=null)}),rt(e,this)}};h(ti,"LCARdSMSDEditor");let Ot=ti;customElements.get("lcards-msd-editor")||customElements.define("lcards-msd-editor",Ot);export{Ot as LCARdSMSDEditor};
//# sourceMappingURL=lcards-msd-editor-C-RuGJkp.js.map
