var O=Object.defineProperty;var b=(T,e)=>O(T,"name",{value:e,configurable:true});import{i as A,a9 as m,aa as L,ab as P,ac as N,ad as y,ae as D,b as h,A as k,af as R,h as I,c as G,m as S,ag as B,ah as z,a as x,z as J,D as j,l as q}from"./lcards-main-BW4hZuuz.js";import{s as H,a as M,f as F}from"./studio-dialog-styles-BC3IDpnS.js";import{c as Y}from"./lcards-yaml-editor-B_uxS34u.js";import{e as U,m as V}from"./lcards-message-DJxE4eZn.js";import"./lcards-form-section-Bxom3ojy.js";import"./lcards-studio-yaml-tab-Lg6_-7nV.js";import"./lcards-grid-edit-overlay-CzD6gmYH.js";const W=[{value:"stretch",label:"Stretch (default)"},{value:"start",label:"Top"},{value:"center",label:"Center"},{value:"end",label:"Bottom"}],K=[{value:"stretch",label:"Stretch (default)"},{value:"start",label:"Left"},{value:"center",label:"Center"},{value:"end",label:"Right"}],_=[{value:"visible",label:"Visible: bleeds beyond cell"},{value:"clip",label:"Clip: hard clip, no scroll"},{value:"hidden",label:"Hidden: clip + block context"},{value:"auto",label:"Scroll when needed (auto)"},{value:"scroll",label:"Always scroll"}],Q=[{value:"none",label:"None"},{value:"solid",label:"Solid"},{value:"dashed",label:"Dashed"},{value:"dotted",label:"Dotted"}],X=[{value:"cover",label:"Cover (fill & crop)"},{value:"contain",label:"Contain (fit whole)"},{value:"100% 100%",label:"Stretch"},{value:"auto",label:"Auto (natural size)"}],Z=[{value:"center",label:"Center"},{value:"top",label:"Top"},{value:"bottom",label:"Bottom"},{value:"left",label:"Left"},{value:"right",label:"Right"}],ee=[{value:"no-repeat",label:"No repeat"},{value:"repeat",label:"Repeat"},{value:"repeat-x",label:"Repeat X"},{value:"repeat-y",label:"Repeat Y"}],C=class C2 extends A{static get properties(){return{hass:{attribute:false},_workingConfig:{state:true},_activeTab:{state:true}}}set config(e){this._handled=false,this._initialConfig=JSON.parse(JSON.stringify(e??{})),this._workingConfig=JSON.parse(JSON.stringify(e??{}))}get config(){return this._workingConfig}constructor(){super(),this.hass=void 0,this._initialConfig={},this._workingConfig={},this._handled=false,this._activeTab="layout",this._previewEl=null,this._overlayEl=null,this._pickerDialog=null}disconnectedCallback(){var e,t,a,i;super.disconnectedCallback(),(e=this._realGridObserver)==null||e.disconnect(),this._realGridObserver=null,(t=this._previewEl)==null||t.remove(),(a=this._overlayEl)==null||a.remove(),(i=this._pickerDialog)==null||i.remove(),this._previewEl=this._overlayEl=null}updated(){this._syncCanvas()}_cardIndexFromTab(){return typeof this._activeTab=="string"&&this._activeTab.startsWith("card-")?Number(this._activeTab.slice(5)):null}_syncCanvas(){var o,d,u,g,v,p,f;const e=(o=this.renderRoot)==null?void 0:o.querySelector("#canvas");if(!e)return;if(this._previewEl||(this._previewEl=document.createElement("lcards-layout-card"),e.appendChild(this._previewEl)),this._previewEl.editing=true,this._previewEl.hass=this.hass,(u=(d=this._previewEl).setConfig)==null||u.call(d,JSON.parse(JSON.stringify(this.config??{}))),(g=this._previewEl.updateComplete)==null||g.then(()=>{var n,c;const r=(c=(n=this._previewEl)==null?void 0:n.renderRoot)==null?void 0:c.querySelector("#grid-root");r&&!this._realGridObserver&&(this._realGridObserver=new ResizeObserver(()=>this._syncMeasureTracks()),this._realGridObserver.observe(r)),this._syncMeasureTracks()}),!this._overlayEl){const r=document.createElement("lcards-grid-edit-overlay");r.hideCardMode=true,r.hideSettings=true,r.addEventListener("grid-state-changed",n=>this._onGridStateChanged(n)),r.addEventListener("grid-preview-changed",n=>this._onGridPreviewChanged(n)),r.addEventListener("area-settings-changed",n=>this._onAreaSettingsChanged(n)),r.addEventListener("area-renamed",n=>this._onAreaRenamed(n)),r.addEventListener("layout-settings-changed",n=>this._onLayoutSettingsChanged(n)),r.addEventListener("area-cards-changed",n=>this._onAreaCardsChanged(n)),r.addEventListener("add-card-to-area",n=>this._onAddCardToArea(n)),r.addEventListener("dock-changed",n=>{var c;e.classList.toggle("dock-open",!!((c=n.detail)!=null&&c.open))}),e.appendChild(r),this._overlayEl=r,requestAnimationFrame(()=>{var n,c;return(c=(n=this._overlayEl)==null?void 0:n.refresh)==null?void 0:c.call(n)}),setTimeout(()=>{var n,c;return(c=(n=this._overlayEl)==null?void 0:n.refresh)==null?void 0:c.call(n)},250)}const{columns:t,rows:a,areas:i,gap:l}=m((v=this.config)==null?void 0:v.layout),s=this._overlayEl;s.hass=this.hass,s.columns=t,s.rows=a,s.areas=i,s.gap=l,s.cardConfigs=((p=this.config)==null?void 0:p.cards)??[],s.layout=((f=this.config)==null?void 0:f.layout)??{}}_syncMeasureTracks(){var t,a,i,l;const e=(a=(t=this._previewEl)==null?void 0:t.renderRoot)==null?void 0:a.querySelector("#grid-root");!e||!this._overlayEl||(Object.assign(this._overlayEl,L(e,this._overlayEl)),(l=(i=this._overlayEl).refresh)==null||l.call(i))}_refreshPreview(){var e,t,a,i,l;if((t=(e=this._previewEl)==null?void 0:e.setConfig)==null||t.call(e,JSON.parse(JSON.stringify(this.config??{}))),this._overlayEl){const{columns:s,rows:o,areas:d,gap:u}=m((a=this.config)==null?void 0:a.layout);this._overlayEl.columns=s,this._overlayEl.rows=o,this._overlayEl.areas=d,this._overlayEl.gap=u,this._overlayEl.cardConfigs=((i=this.config)==null?void 0:i.cards)??[],this._overlayEl.layout=((l=this.config)==null?void 0:l.layout)??{}}}_commit(e){this._workingConfig=e,this.requestUpdate(),this.updateComplete.then(()=>this._syncCanvas())}_commitQuiet(){this._refreshPreview()}_onGridPreviewChanged(e){var s,o;e.stopPropagation();const{columns:t,rows:a,gap:i}=e.detail,l=(o=(s=this._previewEl)==null?void 0:s.renderRoot)==null?void 0:o.querySelector("#grid-root");l&&(t&&(l.style.gridTemplateColumns=t.join(" ")),a&&(l.style.gridTemplateRows=a.join(" ")),i&&(l.style.gap=i))}_onGridStateChanged(e){var o;e.stopPropagation();const{columns:t,rows:a,areas:i,gap:l}=e.detail;let s=P(t,a,i,l,((o=this.config)==null?void 0:o.layout)??{});s.areas&&(s={...s,areas:N(s.areas,y(i))}),this._commit({...this.config,layout:s})}_onAreaRenamed(e){var l;e.stopPropagation();const{from:t,to:a}=e.detail??{},i=(l=this.config)==null?void 0:l.layout;!(i!=null&&i.areas)||i.areas[t]===void 0||this._commit({...this.config,layout:{...i,areas:D(i.areas,t,a)}})}_onAreaSettingsChanged(e){e.stopPropagation();const{name:t,patch:a}=e.detail??{};if(!(!t||!a))for(const[i,l]of Object.entries(a))this._setAreaSetting(t,i,l)}_setAreaSetting(e,t,a){var o;const i=((o=this.config)==null?void 0:o.layout)??{},l={...i.areas??{}},s={...l[e]??{}};a==null||a===""?delete s[t]:s[t]=a,Object.keys(s).length>0?l[e]=s:delete l[e],this._commit({...this.config,layout:{...i,areas:l}})}_onLayoutSettingsChanged(e){e.stopPropagation(),this._commit({...this.config,layout:e.detail.layout})}_onAreaCardsChanged(e){e.stopPropagation(),this._commit({...this.config,cards:e.detail.cards})}_onAddCardToArea(e){var t;e.stopPropagation(),this._addCard((t=e.detail)==null?void 0:t.areaName)}render(){var a;const e=((a=this.config)==null?void 0:a.cards)??[],t=this._cardIndexFromTab();return h`
            <ha-dialog
                open
                @closed=${i=>{i.stopPropagation(),this._handleCancel()}}
                flexcontent
                header-title="Layout Studio">

                <div class="dialog-content">
                    <div class="studio-layout">
                        <!-- Left: config tabs -->
                        <div class="config-panel">
                            <ha-tab-group @wa-tab-show=${this._handleTabChange}>
                                <ha-tab-group-tab value="layout" ?active=${this._activeTab==="layout"}>
                                    <ha-icon icon="mdi:grid"></ha-icon>
                                    Layout
                                </ha-tab-group-tab>
                                ${e.map((i,l)=>h`
                                    <ha-tab-group-tab value="card-${l}" ?active=${this._activeTab===`card-${l}`}>
                                        <ha-icon icon="mdi:card-outline"></ha-icon>
                                        ${l+1}: ${(i.type??"card").replace("custom:","")}
                                    </ha-tab-group-tab>
                                `)}
                                <ha-tab-group-tab value="yaml" ?active=${this._activeTab==="yaml"}>
                                    <ha-icon icon="mdi:code-braces"></ha-icon>
                                    YAML
                                </ha-tab-group-tab>
                            </ha-tab-group>

                            <div class="tab-content">
                                ${this._activeTab==="layout"?this._renderLayoutTab():this._activeTab==="yaml"?this._renderYamlTab():this._renderCardTab(t)}
                            </div>
                        </div>

                        <!-- Right: live preview canvas + overlay. Cards are added per
                             area via the overlay's area tools, so there's no global
                             "add card" here. -->
                        <div class="preview-panel">
                            <div class="preview-container">
                                <div id="canvas" class="canvas"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div slot="footer">
                    <ha-button appearance="plain" @click=${this._handleCancel}>
                        Cancel
                    </ha-button>
                    <ha-button variant="brand" @click=${this._handleSave}>
                        <ha-icon icon="mdi:check" slot="start"></ha-icon>
                        Save
                    </ha-button>
                </div>
            </ha-dialog>
        `}_renderLayoutTab(){var a;const e=((a=this.config)==null?void 0:a.layout)??{},t=b((i,l)=>{const s={...e};l==null||l===""?delete s[i]:s[i]=l,this._commit({...this.config,layout:s})},"setLayout");return h`
            <div class="layout-tab">
                <div class="hint">Drag the handles on the canvas to size tracks, draw areas, and use each
                    area's tools for backgrounds &amp; cards.</div>
                <lcards-form-section
                    header="Grid settings"
                    description="Spacing and sizing for the whole grid"
                    icon="mdi:cog"
                    ?expanded=${true}
                    ?outlined=${true}
                    headerLevel="4">
                    <div class="grid2">
                        <label>Gap</label>
                        <ha-input .value=${e["grid-gap"]??e.gap??""} placeholder="5px"
                            @change=${i=>t("grid-gap",i.target.value||void 0)}></ha-input>
                        <label>Height</label>
                        <ha-input .value=${e.height??""} placeholder="100%"
                            @change=${i=>t("height",i.target.value||void 0)}></ha-input>
                        <label>Card margin</label>
                        <ha-input .value=${e.card_margin??""} placeholder="none"
                            @change=${i=>t("card_margin",i.target.value||void 0)}></ha-input>
                        <label>Card overflow</label>
                        <ha-selector .hass=${this.hass}
                            .selector=${{select:{mode:"dropdown",options:_}}}
                            .value=${e.card_overflow??"visible"}
                            @value-changed=${i=>t("card_overflow",i.detail.value==="visible"?void 0:i.detail.value)}></ha-selector>
                        <label>Padding</label>
                        <ha-input .value=${e.padding??""} placeholder="none"
                            @change=${i=>t("padding",i.target.value||void 0)}></ha-input>
                        <label>Margin</label>
                        <ha-input .value=${e.margin??""} placeholder="none"
                            @change=${i=>t("margin",i.target.value||void 0)}></ha-input>
                    </div>
                </lcards-form-section>
            </div>
        `}_renderCardTab(e){var u,g,v,p,f;const t=(g=(u=this.config)==null?void 0:u.cards)==null?void 0:g[e];if(e==null||!t)return h`<div class="hint">Select a card tab, or add a card.</div>`;const a=t.view_layout??{},{view_layout:i,...l}=t,s=y(m((v=this.config)==null?void 0:v.layout).areas),o=[{value:"",label:"(none)"},...s.map(r=>({value:r,label:r}))],d=a["grid-area"];return h`
            <div class="card-tab">
                <lcards-form-section
                    header="Card placement"
                    description="Where this card sits and how it fills its area"
                    icon="mdi:card-outline"
                    ?expanded=${true}
                    ?outlined=${true}
                    headerLevel="4">
                    <div class="ct-remove">
                        <ha-button variant="danger" appearance="plain" @click=${()=>this._removeCard(e)}>
                            <ha-icon icon="mdi:delete-outline" slot="start"></ha-icon>Remove card
                        </ha-button>
                    </div>
                    <div class="grid2">
                        <label>Area</label>
                        <ha-selector .hass=${this.hass}
                            .selector=${{select:{mode:"dropdown",options:o}}}
                            .value=${a["grid-area"]??""}
                            @value-changed=${r=>this._setPlacement(e,"grid-area",r.detail.value||void 0)}></ha-selector>
                        <label>Align ↕</label>
                        <ha-selector .hass=${this.hass}
                            .selector=${{select:{mode:"dropdown",options:W}}}
                            .value=${a["align-self"]??a["place-self"]??"stretch"}
                            @value-changed=${r=>this._setAlignment(e,r.detail.value,a["justify-self"]??a["place-self"]??"stretch")}></ha-selector>
                        <label>Align ↔</label>
                        <ha-selector .hass=${this.hass}
                            .selector=${{select:{mode:"dropdown",options:K}}}
                            .value=${a["justify-self"]??a["place-self"]??"stretch"}
                            @value-changed=${r=>this._setAlignment(e,a["align-self"]??a["place-self"]??"stretch",r.detail.value)}></ha-selector>
                        <label>Margin</label>
                        <ha-input .value=${a.margin??""} placeholder=${((f=(p=this.config)==null?void 0:p.layout)==null?void 0:f.card_margin)??"none"}
                            @change=${r=>this._setPlacement(e,"margin",r.target.value||void 0)}></ha-input>
                        <label>Overflow X</label>
                        <ha-selector .hass=${this.hass}
                            .selector=${{select:{mode:"dropdown",options:_}}}
                            .value=${a["overflow-x"]??a.overflow??"visible"}
                            @value-changed=${r=>this._setOverflow(e,r.detail.value,a["overflow-y"]??a.overflow??"visible")}></ha-selector>
                        <label>Overflow Y</label>
                        <ha-selector .hass=${this.hass}
                            .selector=${{select:{mode:"dropdown",options:_}}}
                            .value=${a["overflow-y"]??a.overflow??"visible"}
                            @value-changed=${r=>this._setOverflow(e,a["overflow-x"]??a.overflow??"visible",r.detail.value)}></ha-selector>
                    </div>
                </lcards-form-section>

                ${d?this._renderAreaStyleSection(d):k}

                <div class="card-editor-host">
                    <hui-card-element-editor
                        .hass=${this.hass}
                        .lovelace=${this._childLovelace()}
                        .value=${l}
                        @config-changed=${r=>this._onChildConfigChanged(e,r)}
                    ></hui-card-element-editor>
                </div>
            </div>
        `}_renderAreaStyleSection(e){var i,l,s;const t=((s=(l=(i=this.config)==null?void 0:i.layout)==null?void 0:l.areas)==null?void 0:s[e])??{},a=b((o,d)=>this._setAreaSetting(e,o,d),"set");return h`
            <lcards-form-section
                header="Area background"
                description=${`Backing surface for area "${e}" (shows even when empty)`}
                icon="mdi:palette"
                ?outlined=${true}
                headerLevel="4">
                <div class="grid2">
                    <label>Background</label>
                    <lcards-color-picker .hass=${this.hass} .value=${t.background??""}
                        ?showPreview=${true} ?showBuilder=${true}
                        @value-changed=${o=>a("background",o.detail.value||void 0)}></lcards-color-picker>
                    <label>Image</label>
                    <ha-input .value=${t["background-image"]??""} placeholder="url(...) or linear-gradient(...)"
                        @change=${o=>a("background-image",o.target.value||void 0)}></ha-input>
                    ${t["background-image"]?h`
                        <label>Fit</label>
                        <ha-selector .hass=${this.hass} .selector=${{select:{mode:"dropdown",options:X}}}
                            .value=${t["background-size"]??"cover"}
                            @value-changed=${o=>a("background-size",o.detail.value==="cover"?void 0:o.detail.value)}></ha-selector>
                        <label>Position</label>
                        <ha-selector .hass=${this.hass} .selector=${{select:{mode:"dropdown",options:Z}}}
                            .value=${t["background-position"]??"center"}
                            @value-changed=${o=>a("background-position",o.detail.value==="center"?void 0:o.detail.value)}></ha-selector>
                        <label>Repeat</label>
                        <ha-selector .hass=${this.hass} .selector=${{select:{mode:"dropdown",options:ee}}}
                            .value=${t["background-repeat"]??"no-repeat"}
                            @value-changed=${o=>a("background-repeat",o.detail.value==="no-repeat"?void 0:o.detail.value)}></ha-selector>
                    `:k}
                    <label>Border color</label>
                    <lcards-color-picker .hass=${this.hass} .value=${t["border-color"]??""}
                        ?showPreview=${true} ?showBuilder=${true}
                        @value-changed=${o=>a("border-color",o.detail.value||void 0)}></lcards-color-picker>
                    <label>Border</label>
                    <div class="inline2">
                        <ha-input .value=${t["border-width"]??""} placeholder="2px"
                            @change=${o=>a("border-width",o.target.value||void 0)}></ha-input>
                        <ha-selector .hass=${this.hass} .selector=${{select:{mode:"dropdown",options:Q}}}
                            .value=${t["border-style"]??"none"}
                            @value-changed=${o=>a("border-style",o.detail.value==="none"?void 0:o.detail.value)}></ha-selector>
                    </div>
                    <label>Radius</label>
                    <ha-input .value=${t["border-radius"]??""} placeholder="0"
                        @change=${o=>a("border-radius",o.target.value||void 0)}></ha-input>
                </div>
            </lcards-form-section>
        `}_renderYamlTab(){return h`
            <div class="yaml-tab">
                <lcards-studio-yaml-tab
                    .hass=${this.hass}
                    .config=${this.config??{}}
                    .schema=${R}
                    cardType="layout-card"
                    @yaml-config-changed=${e=>this._commit(e.detail.config)}>
                </lcards-studio-yaml-tab>
            </div>
        `}_handleTabChange(e){var a,i;const t=(i=(a=e.target)==null?void 0:a.activeTab)==null?void 0:i.getAttribute("value");t!=null&&(this._activeTab=t,this.requestUpdate())}_setPlacement(e,t,a){var o;const i=[...((o=this.config)==null?void 0:o.cards)??[]],l=i[e];if(!l)return;const s={...l.view_layout??{}};a==null||a===""?delete s[t]:s[t]=a,i[e]={...l,view_layout:s},this._commit({...this.config,cards:i})}_setAlignment(e,t,a){var o;const i=[...((o=this.config)==null?void 0:o.cards)??[]],l=i[e];if(!l)return;const s={...l.view_layout??{}};delete s["place-self"],delete s["align-self"],delete s["justify-self"],t===a?t!=="stretch"&&(s["place-self"]=t):(t!=="stretch"&&(s["align-self"]=t),a!=="stretch"&&(s["justify-self"]=a)),i[e]={...l,view_layout:s},this._commit({...this.config,cards:i})}_setOverflow(e,t,a){var o;const i=[...((o=this.config)==null?void 0:o.cards)??[]],l=i[e];if(!l)return;const s={...l.view_layout??{}};delete s.overflow,delete s["overflow-x"],delete s["overflow-y"],t===a?t!=="visible"&&(s.overflow=t):(t!=="visible"&&(s["overflow-x"]=t),a!=="visible"&&(s["overflow-y"]=a)),i[e]={...l,view_layout:s},this._commit({...this.config,cards:i})}_onChildConfigChanged(e,t){var s,o,d;t.stopPropagation();const a=((s=t.detail)==null?void 0:s.config)??((o=t.detail)==null?void 0:o.value);if(!(a!=null&&a.type))return;const i=(d=this.config)==null?void 0:d.cards;if(!(i!=null&&i[e]))return;const l=i[e].view_layout;i[e]=l?{...a,view_layout:l}:{...a},this._commitQuiet()}async _removeCard(e){var s,o,d;const t=(o=(s=this.config)==null?void 0:s.cards)==null?void 0:o[e],a=((t==null?void 0:t.type)??"card").replace("custom:","");if(!await I({title:"Remove card?",message:`Remove the "${a}" card from this layout? This cannot be undone.`,confirmText:"Remove"}))return;const l=[...((d=this.config)==null?void 0:d.cards)??[]];l.splice(e,1),this._activeTab=l.length?`card-${Math.min(e,l.length-1)}`:"layout",this._commit({...this.config,cards:l})}_addCard(e){this._openCardPicker(t=>{var s;const a=e?{"grid-area":e}:null,i=a?{...t,view_layout:a}:{...t},l=[...((s=this.config)==null?void 0:s.cards)??[],i];this._activeTab=`card-${l.length-1}`,this._commit({...this.config,cards:l})})}_childLovelace(){return{views:[{title:"Home",path:"home",cards:[]}]}}async _openCardPicker(e){var i,l;if(!customElements.get("hui-card-picker")){G({title:"Card picker not ready",message:"Home Assistant hasn’t loaded its card picker yet. On any dashboard, click “Add card” once (you can cancel it), then come back and try again."});return}(i=this._pickerDialog)==null||i.remove();const t=document.createElement("ha-dialog");t.headerTitle="Select a card",this._pickerDialog=t,S(t,this),t.open=true,await t.updateComplete;const a=document.createElement("hui-card-picker");a.hass=this.hass,a.lovelace=this._childLovelace(),a.style.cssText="padding:24px; display:block;",t.appendChild(a),await new Promise(s=>setTimeout(s,80)),(l=a.requestUpdate)==null||l.call(a),a.addEventListener("config-changed",s=>{var d;const o=(d=s.detail)==null?void 0:d.config;t.open=false,o&&e(JSON.parse(JSON.stringify(o)))}),t.addEventListener("closed",()=>{t.remove(),this._pickerDialog===t&&(this._pickerDialog=null)})}_handleSave(){this._handled||(this._handled=true,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this._workingConfig},bubbles:true,composed:true})),this._handleClose())}_handleCancel(){this._handled||(this._handled=true,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this._initialConfig},bubbles:true,composed:true})),this._handleClose())}_handleClose(){this.dispatchEvent(new CustomEvent("closed",{bubbles:true,composed:true}))}static get styles(){return[U,H,V,x`
                :host { display: block; }

                /* Left config pane ~1/3, preview ~2/3. Explicit row so panels take the
                   full height and scroll internally rather than sizing to content. */
                .studio-layout {
                    grid-template-columns: 1fr 2fr;
                    grid-template-rows: minmax(0, 1fr);
                    min-height: 0;
                }

                ha-tab-group { flex-shrink: 0; }
                ha-tab-group-tab { flex-shrink: 0; white-space: nowrap; }

                /* Preview element wraps the interactive canvas (matches other studios:
                   padded panel + framed inner surface). */
                .preview-panel { overflow: hidden; min-height: 0; }
                .preview-container {
                    flex: 1;
                    min-height: 0;
                    padding: 16px;
                    background: var(--primary-background-color);
                    display: flex;
                }
                /* No fill behind the grid — the user's own cell/area backgrounds
                   (colors, gradients, images) must show as-is. The opaque
                   preview-container behind prevents anything bleeding through. */
                .canvas {
                    flex: 1;
                    position: relative;
                    min-height: 0;
                    border-radius: var(--ha-border-radius-lg, 12px);
                    border: var(--ha-border-width-sm, 1px) solid var(--divider-color);
                    overflow: hidden;
                }
                .canvas lcards-layout-card { display: block; width: 100%; height: 100%; }
                .canvas.dock-open { padding-right: ${B}px; }
                @media (max-width: ${z}px) {
                    .canvas.dock-open { padding-right: 0; }
                }

                .layout-tab { display: flex; flex-direction: column; gap: 12px; }
                .yaml-tab { display: flex; flex-direction: column; height: 100%; }
                .yaml-tab lcards-studio-yaml-tab { flex: 1; min-height: 0; }

                .card-tab { display: flex; flex-direction: column; gap: 14px; }
                .grid2 { display: grid; grid-template-columns: 92px 1fr; align-items: center; gap: 8px 10px; }
                .grid2 > label { font-size: 12px; color: var(--secondary-text-color); }
                .grid2 lcards-color-picker,
                .grid2 ha-input,
                .grid2 ha-selector { min-width: 0; }
                .inline2 { display: flex; gap: 6px; min-width: 0; }
                .inline2 ha-input,
                .inline2 ha-selector { flex: 1; min-width: 0; }
                .ct-remove { display: flex; justify-content: flex-end; margin-bottom: 8px; }
                
                .card-editor-host {
                    border-top: var(--ha-border-width-sm, 1px) solid var(--divider-color);
                    padding-top: 12px;
                }
            `]}};b(C,"LCARdSLayoutStudioDialog");let w=C;customElements.get("lcards-layout-studio-dialog")||customElements.define("lcards-layout-studio-dialog",w);const E=class E2 extends M{constructor(){super(),this.cardType="layout-card",this._studioDialog=null}disconnectedCallback(){var e,t;(e=super.disconnectedCallback)==null||e.call(this),(t=this._studioDialog)==null||t.remove(),this._studioDialog=null}render(){var s,o;const e=((s=this.config)==null?void 0:s.cards)??[],{columns:t,rows:a,areas:i}=m((o=this.config)==null?void 0:o.layout),l=y(i);return h`
            <div class="info-card">
                <div class="info-card-content">
                    <h3>Layout Studio</h3>
                    <p>
                        <strong>Full-screen grid workspace</strong> with live preview
                        <br />
                        Size tracks, draw areas, style backgrounds, and place cards visually.
                    </p>
                    <div class="lc-stats">
                        <span><b>${t.length}</b> cols × <b>${a.length}</b> rows</span>
                        <span><b>${l.length}</b> area${l.length===1?"":"s"}</span>
                        <span><b>${e.length}</b> card${e.length===1?"":"s"}</span>
                    </div>
                </div>
                <div class="info-card-actions">
                    <ha-button appearance="plain" @click=${()=>window.open(J(j.layoutCard),"_blank","noopener")}>
                        Docs
                        <ha-icon icon="mdi:open-in-new" slot="end"></ha-icon>
                    </ha-button>
                    <ha-button @click=${this._openStudio}>
                        <ha-icon icon="mdi:view-grid-plus" slot="start"></ha-icon>
                        Open Layout Studio
                    </ha-button>
                </div>
            </div>
        `}_openStudio(){const e=document.createElement("lcards-layout-studio-dialog");e.hass=this.hass,e.config=JSON.parse(JSON.stringify(this.config??{})),this._studioDialog=e,e.addEventListener("config-changed",t=>{var i;const a=(i=t.detail)==null?void 0:i.config;a&&(this.config=a,this._yamlValue=Y(this.config),F(this,"config-changed",{config:this.config}),this.requestUpdate())}),e.addEventListener("closed",()=>{e.remove(),this._studioDialog===e&&(this._studioDialog=null)}),S(e,this),q.debug("[LayoutCardEditor] Opened Layout Studio")}static get styles(){return[...super.styles,x`
                .lc-stats { display: flex; gap: 16px; margin: 8px 0 4px; font-size: 13px; color: var(--primary-text-color); }
                .lc-stats b { color: var(--lcars-ui-primary, var(--primary-color)); }
            `]}};b(E,"LCARdSLayoutCardEditor");let $=E;customElements.get("lcards-layout-card-editor")||customElements.define("lcards-layout-card-editor",$);export{$ as LCARdSLayoutCardEditor};
//# sourceMappingURL=lcards-layout-card-editor-G4PZ4vaA.js.map
