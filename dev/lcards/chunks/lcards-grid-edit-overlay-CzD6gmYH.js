var H=Object.defineProperty;var Z=(_,e,t)=>e in _?H(_,e,{enumerable:true,configurable:true,writable:true,value:t}):_[e]=t;var C=(_,e)=>H(_,"name",{value:e,configurable:true});var R=(_,e,t)=>Z(_,typeof e!="symbol"?e+"":e,t);import{i as V,ai as J,aj as Q,ak as ee,a as te,A as x,b as g,al as re,am as f,an as ae,ao as se,ap as N,aq as M,ar as I,as as L,ad as O,at as U,au as ie,h as j,av as oe,aw as ne,l as q,ax as le,ay as Y,az as ce,aA as de,aB as he,aC as ue}from"./lcards-main-BW4hZuuz.js";import"./lcards-form-section-Bxom3ojy.js";const pe=[{value:"stretch",label:"Stretch (default)"},{value:"start",label:"Top"},{value:"center",label:"Center"},{value:"end",label:"Bottom"}],ge=[{value:"stretch",label:"Stretch (default)"},{value:"start",label:"Left"},{value:"center",label:"Center"},{value:"end",label:"Right"}],F=[{value:"visible",label:"Visible: bleeds beyond cell"},{value:"clip",label:"Clip: hard clip, no scroll"},{value:"hidden",label:"Hidden: clip + block context"},{value:"auto",label:"Scroll when needed (auto)"},{value:"scroll",label:"Always scroll"}],ve=[{value:"none",label:"None"},{value:"solid",label:"Solid"},{value:"dashed",label:"Dashed"},{value:"dotted",label:"Dotted"}],me=[{value:"cover",label:"Cover (fill & crop)"},{value:"contain",label:"Contain (fit whole)"},{value:"100% 100%",label:"Stretch"},{value:"auto",label:"Auto (natural size)"}],fe=[{value:"center",label:"Center"},{value:"top",label:"Top"},{value:"bottom",label:"Bottom"},{value:"left",label:"Left"},{value:"right",label:"Right"}],_e=[{value:"no-repeat",label:"No repeat"},{value:"repeat",label:"Repeat"},{value:"repeat-x",label:"Repeat X"},{value:"repeat-y",label:"Repeat Y"}],X=[{bg:"var(--lcars-ui-primary)",text:"var(--lcars-ui-primary)"},{bg:"var(--lcars-ui-quaternary)",text:"var(--lcars-ui-quaternary)"},{bg:"var(--lcars-ui-secondary)",text:"var(--lcars-ui-secondary)"},{bg:"var(--lcars-blue)",text:"var(--lcars-blue)"},{bg:"var(--lcards-green)",text:"var(--lcards-green)"},{bg:"var(--lcars-ui-tertiary)",text:"var(--lcars-ui-tertiary)"}];function be(_){let e=0;for(let t=0;t<_.length;t++)e=e*31+_.charCodeAt(t)|0;return X[Math.abs(e)%X.length]}C(be,"areaColor");const W=60,B="lcards-layout-area-tint";let K=(()=>{try{const _=Number(localStorage.getItem(B));return localStorage.getItem(B)!=null&&Number.isFinite(_)?Math.max(0,Math.min(100,_)):W}catch{return W}})();function we(_){K=_;try{localStorage.setItem(B,String(_))}catch{}}C(we,"setStickyAreaTint");const P=ue,E=3,z=10,y={cell:10,area:20,handle:30,header:40,gutterHandle:45,areaGrip:48,selection:50,bar:60,panel:70,chip:80},T=class T2 extends V{constructor(){super(),this.hass=void 0,this.columns=["1fr","1fr","1fr"],this.rows=["1fr","1fr","1fr"],this.areas=Array(3).fill(null).map(()=>Array(3).fill(".")),this.gap="5px",this.cardConfigs=[],this.layout={},this.measureColumns=void 0,this.measureRows=void 0,this.measureOffset=void 0,this.hideCardMode=false,this.hideSettings=false,this._selectedArea=null,this._renaming=null,this._trackPopover=null,this._showSettings=false,this._selStart=null,this._selEnd=null,this._selectionName="",this._showNameInput=false,this._nameError="",this._reorderPreview=null,this._areaSettings=null,this._dockWasOpen=false,this._areaTint=K,this._areaDrag=null,this._areaDragPreview=null,this._cells=[],this._overlayRect=null,this._measureScheduled=false,this._resizeDrag=null,this._reorderDrag=null,this._selDrag=false,this._selMoved=false,this._boundPointerMove=this._onAnyPointerMove.bind(this),this._boundPointerUp=this._onAnyPointerUp.bind(this),this._boundPointerCancel=this._onAnyPointerCancel.bind(this),this._boundKeydown=this._onDocKeydown.bind(this)}_qh(e){return this.renderRoot?this.renderRoot.querySelector(e):null}connectedCallback(){super.connectedCallback(),this.addEventListener("pointermove",this._boundPointerMove),this.addEventListener("pointerup",this._boundPointerUp),this.addEventListener("pointercancel",this._boundPointerCancel),document.addEventListener("keydown",this._boundKeydown,true),this._resizeObserver=new ResizeObserver(()=>this._scheduleMeasure()),this._resizeObserver.observe(this)}disconnectedCallback(){var e;super.disconnectedCallback(),this.removeEventListener("pointermove",this._boundPointerMove),this.removeEventListener("pointerup",this._boundPointerUp),this.removeEventListener("pointercancel",this._boundPointerCancel),document.removeEventListener("keydown",this._boundKeydown,true),(e=this._resizeObserver)==null||e.disconnect(),this._resizeObserver=null}_onDocKeydown(e){if(e.key!=="Escape")return;let t=true;this._renaming?this._renaming=null:this._trackPopover?this._trackPopover=null:this._showNameInput?this._cancelSelection():this._areaSettings?this._areaSettings=null:this._showSettings?this._showSettings=false:t=false,t&&(e.stopImmediatePropagation(),e.preventDefault())}_onAnyPointerMove(e){this._resizeDrag&&this._resizeMove(e),this._reorderDrag&&this._reorderMove(e),this._selDrag&&this._selMove(e),this._areaDrag&&this._areaDragMove(e)}_onAnyPointerUp(e){this._resizeDrag&&this._resizeUp(e),this._reorderDrag&&this._reorderUp(e),this._selDrag&&this._selUp(e),this._areaDrag&&this._areaDragEnd(e,true)}_onAnyPointerCancel(e){this._resizeDrag&&this._resizeUp(e),this._reorderDrag&&this._cancelReorder(),this._selDrag&&(this._selDrag=false,this._cancelSelection()),this._areaDrag&&this._areaDragEnd(e,false)}_cellAtPoint(e,t){var s;const{x:r,y:a}=this._toLocal(e,t);for(let o=0;o<this._cells.length;o++)for(let l=0;l<(((s=this._cells[o])==null?void 0:s.length)??0);l++){const i=this._cells[o][l];if(i&&r>=i.left&&r<=i.right&&a>=i.top&&a<=i.bottom)return{r:o,c:l}}return null}updated(){this.style.setProperty("--area-tint",`${this._areaTint}%`),this._scheduleMeasure();const e=this._dockOpen;e!==this._dockWasOpen&&(this._dockWasOpen=e,this.dispatchEvent(new CustomEvent("dock-changed",{detail:{open:e},bubbles:false})))}refresh(){this._scheduleMeasure()}_scheduleMeasure(){this._measureScheduled||(this._measureScheduled=true,requestAnimationFrame(()=>{this._measureScheduled=false,this._measure()}))}_scale(){const e=this.getBoundingClientRect();return{r:e,sx:this.offsetWidth&&e.width/this.offsetWidth||1,sy:this.offsetHeight&&e.height/this.offsetHeight||1}}_toLocal(e,t){const{r,sx:a,sy:s}=this._scale();return{x:(e-r.left)/a,y:(t-r.top)/s}}_measure(){const e=this._qh("#ghost-grid");if(!e)return;const{r:t,sx:r,sy:a}=this._scale();this._overlayRect={left:0,top:0,width:this.offsetWidth,height:this.offsetHeight};const s=[],o=this.rows.length,l=this.columns.length;for(let i=0;i<o;i++){s[i]=[];for(let n=0;n<l;n++){const c=e.querySelector(`.gc[data-r="${i}"][data-c="${n}"]`);if(c){const h=c.getBoundingClientRect();s[i][n]={left:(h.left-t.left)/r,top:(h.top-t.top)/a,right:(h.right-t.left)/r,bottom:(h.bottom-t.top)/a,width:h.width/r,height:h.height/a}}}}this._cells=s,this._positionElements()}_positionElements(){this._cells.length&&(this._positionColumnHeaders(),this._positionRowHeaders(),this._positionResizeHandles(),this._positionAreaOverlays(),this._positionCellTargets(),this._positionSelectionRect(),this._positionNamePopup(),this._positionAreaGrips(),this._positionAreaPreview())}render(){return g`
            ${this._renderGhostGrid()}
            ${this._renderColumnHeaders()}
            ${this._renderRowHeaders()}
            ${this._renderResizeHandles()}
            ${this._renderAreaOverlays()}
            ${this._renderCellTargets()}
            ${this._selStart&&this._selEnd?g`<div class="sel-rect" id="sel-rect"></div>`:x}
            ${this._showNameInput?this._renderNamePopup():x}
            ${this._renderAreaGrips()}
            ${this._areaDragPreview?g`<div class="area-preview ${this._areaDragPreview.ok?"ok":"blocked"}" id="area-preview"></div>`:x}
            ${this._renderToolbar()}
            ${this._renderDock()}
            <div class="drag-chip" id="drag-chip"></div>
        `}_renderGhostGrid(){var o,l;const e=(o=this.measureColumns)!=null&&o.length?this.measureColumns:this.columns,t=(l=this.measureRows)!=null&&l.length?this.measureRows:this.rows,r=this.measureOffset??re("grid"),a=[`padding: ${r.top}px 0 0 ${r.left}px`,`grid-template-columns: ${e.join(" ")}`,`grid-template-rows: ${t.join(" ")}`,`gap: ${this.gap}`].join("; "),s=[];for(let i=0;i<this.rows.length;i++)for(let n=0;n<this.columns.length;n++)s.push(g`<div class="gc" data-r="${i}" data-c="${n}"></div>`);return g`<div id="ghost-grid" style="${a}">${s}</div>`}_renderToolbar(){const e=this._selectedArea?`Area "${this._selectedArea}": drag its edges to resize, its name to move · ⋮ for more`:"Click or drag across empty cells to create an area · click a column or row header for its size";return g`
            <div class="edit-bar" id="toolbar" role="toolbar" aria-label="Layout editor">
                ${this.hideCardMode?x:g`
                    ${ae("grid",()=>this.dispatchEvent(new CustomEvent("switch-to-cards-mode",{bubbles:false})))}
                    <div class="edit-bar-sep"></div>
                `}
                <ha-button appearance="plain" size="s" @click=${()=>this._addTrack("col")}>
                    <ha-svg-icon slot="start" .path=${f.colAfter}></ha-svg-icon>
                    Column
                </ha-button>
                <ha-button appearance="plain" size="s" @click=${()=>this._addTrack("row")}>
                    <ha-svg-icon slot="start" .path=${f.rowAfter}></ha-svg-icon>
                    Row
                </ha-button>
                <div class="edit-bar-sep"></div>
                <label class="t-tint" title="Area tint: raise it when an area's colour is close to its cards">
                    <ha-svg-icon .path=${f.opacity}></ha-svg-icon>
                    <input type="range" min="0" max="100" step="5" aria-label="Area tint"
                        .value=${String(this._areaTint)}
                        @input=${t=>{this._areaTint=Number(t.target.value),we(this._areaTint)}}
                    >
                </label>
                ${this.hideSettings?x:g`
                    <div class="edit-bar-sep"></div>
                    <ha-icon-button
                        class=${this._showSettings?"active":""}
                        .path=${f.tune}
                        .label=${"Grid settings (gap, height, margins)"}
                        title="Grid settings (gap, height, margins)"
                        @click=${()=>this._openDock(this._showSettings?null:{settings:true})}
                    ></ha-icon-button>
                `}
                ${se(e)}
            </div>
        `}_openDock(e){this._showSettings=!!(e!=null&&e.settings)&&!this.hideSettings,this._trackPopover=(e==null?void 0:e.track)??null,this._areaSettings=(e==null?void 0:e.area)??null,e!=null&&e.area&&(this._selectedArea=e.area)}get _dockOpen(){return!!(this._areaSettings||this._trackPopover||this._showSettings&&!this.hideSettings)}_renderDock(){let e,t;if(this._areaSettings)e=`Area: ${this._areaSettings}`,t=this._renderAreaSettingsBody();else if(this._trackPopover){const{axis:r,index:a}=this._trackPopover;e=`${r==="col"?"Column":"Row"} ${a+1}`,t=this._renderTrackBody()}else if(this._showSettings&&!this.hideSettings)e="Grid settings",t=this._renderSettingsBody();else return x;return g`
            <aside class="edit-dock" id="dock" aria-label="${e}"
                @click=${r=>r.stopPropagation()}
                @keydown=${r=>{r.key!=="Escape"&&r.stopPropagation()}}>
                ${N(e,()=>this._openDock(null))}
                <div class="edit-dock-body">${t}</div>
            </aside>
        `}_renderSettingsBody(){const e=this.layout??{};return g`
            <div class="settings-hint">Press Enter or click away to apply each value.</div>
            <ha-input
                label="Gap"
                .value=${this.gap??""}
                title="Space between grid cells (e.g. 5px, 8px)"
                @change=${t=>this._emitGridState(this.columns,this.rows,this.areas,t.target.value)}
            ></ha-input>
            <ha-input
                label="Height"
                .value=${e.height??"calc(100dvh - var(--header-height, 56px))"}
                title="View height (e.g. calc(100dvh - 56px), 800px)"
                @change=${t=>this._emitLayoutProp("height",t.target.value)}
            ></ha-input>
            <ha-input
                label="Card margin"
                .value=${e.card_margin??""}
                placeholder="4px"
                title="Margin around each card (e.g. 4px, 0)"
                @change=${t=>this._emitLayoutProp("card_margin",t.target.value||void 0)}
            ></ha-input>
            <ha-input
                label="Padding"
                .value=${e.padding??""}
                placeholder="none"
                title="Inner padding of the grid container"
                @change=${t=>this._emitLayoutProp("padding",t.target.value||void 0)}
            ></ha-input>
        `}_renderTrackBody(){if(!this._trackPopover)return x;const{axis:e,index:t}=this._trackPopover,r=e==="col",a=r?this.columns[t]:this.rows[t],s=r?this.columns.length:this.rows.length,o=r?["1fr","2fr","3fr","auto","100px","200px","300px","50%","clamp(100px,12vw,200px)"]:["1fr","2fr","auto","60px","80px","120px","50%","clamp(40px,8vh,100px)"],l=M(I(a??""));return g`
            <div class="settings-hint">Size of this ${r?"column":"row"}${l?"":" (not resizable by dragging: set it here)"}.</div>
            <div class="tp-presets">
                ${o.map(i=>g`
                    <button class="tp-preset ${i===a?"current":""}"
                        @click=${()=>this._commitTrack(e,t,i)}
                    >${i}</button>
                `)}
            </div>
            <ha-input
                id="track-size"
                label="Custom size"
                .value=${a}
                placeholder="e.g. 1fr, 200px, 25%"
                @keydown=${i=>{i.key==="Enter"&&this._commitTrack(e,t,i.target.value)}}
                @change=${i=>this._commitTrack(e,t,i.target.value)}
            ></ha-input>
            <div class="edit-panel-actions">
                <ha-button appearance="plain" size="s" @click=${()=>this._insertTrackAt(e,t)}>
                    <ha-svg-icon slot="start" .path=${r?f.colBefore:f.rowBefore}></ha-svg-icon>
                    ${r?"Insert left":"Insert above"}
                </ha-button>
                <ha-button appearance="plain" size="s" @click=${()=>this._insertTrackAt(e,t+1)}>
                    <ha-svg-icon slot="start" .path=${r?f.colAfter:f.rowAfter}></ha-svg-icon>
                    ${r?"Insert right":"Insert below"}
                </ha-button>
                <ha-button appearance="plain" variant="danger" size="s" ?disabled=${s<=1}
                    @click=${()=>{this._openDock(null),this._deleteTrack(e,t)}}>
                    <ha-svg-icon slot="start" .path=${f.delete}></ha-svg-icon>
                    Delete
                </ha-button>
            </div>
        `}_openTrackPopover(e,t){this._openDock({track:{axis:e,index:t}})}_emitLayoutProp(e,t){const r={...this.layout??{}};t==null||t===""?delete r[e]:r[e]=t,this.dispatchEvent(new CustomEvent("layout-settings-changed",{detail:{layout:r},bubbles:false}))}_renderColumnHeaders(){return this.columns.map((e,t)=>this._renderTrackHeader("col",t,e))}_renderRowHeaders(){return this.rows.map((e,t)=>this._renderTrackHeader("row",t,e))}_renderTrackHeader(e,t,r){var i,n,c,h,d,p;const a=((i=this._reorderDrag)==null?void 0:i.axis)===e&&((n=this._reorderDrag)==null?void 0:n.fromIndex)===t,s=((c=this._reorderPreview)==null?void 0:c.axis)===e&&((h=this._reorderPreview)==null?void 0:h.to)===t,o=((d=this._trackPopover)==null?void 0:d.axis)===e&&((p=this._trackPopover)==null?void 0:p.index)===t,l=`${e==="col"?"Column":"Row"} ${t+1}`;return g`
            <div
                class="${e}-header ${a?"dragging":""} ${s?"drop-target":""} ${o?"open":""}"
                id="${e==="col"?"ch":"rh"}-${t}"
                role="button"
                tabindex="0"
                aria-label="${l}: ${r}. Click for size options, drag to reorder."
                title="${l}: ${r} · click for options, drag to reorder"
                @pointerdown=${m=>this._headerPointerDown(m,e,t)}
                @click=${m=>{m.stopPropagation(),!this._consumeReorderClick()&&this._openTrackPopover(e,t)}}
                @keydown=${m=>{(m.key==="Enter"||m.key===" ")&&(m.preventDefault(),this._openTrackPopover(e,t))}}
            >
                <span class="track-label">${r}</span>
            </div>
        `}_renderResizeHandles(){const e=[];for(const t of["col","row"]){const r=t==="col"?this.columns:this.rows,a=t==="col"?this.rows.length:this.columns.length;for(let s=0;s<r.length-1;s++){const o=M(I(r[s]))&&M(I(r[s+1])),l=o?c=>this._resizePointerDown(c,t,s):x,i=o?"Drag to resize":"Not resizable by dragging (clamp/minmax/auto track)",n=`rh-seg ${t} ${o?"":"disabled"}`;e.push(g`<div class="${n} gutter" id="rh-${t}-${s}-g" data-b="${t}-${s}" title=${i} @pointerdown=${l}></div>`);for(let c=0;c<a;c++)e.push(g`<div class="${n}" id="rh-${t}-${s}-${c}" data-b="${t}-${s}" title=${i} @pointerdown=${l}></div>`)}}return e}_insertTrackAt(e,t){const{grid2d:r,columns:a,rows:s}=L(this.areas,this.columns,this.rows,e,t,"1fr");this._emitGridState(a,s,r)}_renderAreaOverlays(){return O(this.areas).map(e=>{var i;const t=this._selectedArea===e,r=this._renaming===e,{bg:a}=be(e),s=(this.cardConfigs??[]).filter(n=>{var c;return((c=n==null?void 0:n.view_layout)==null?void 0:c["grid-area"])===e}).map(n=>String((n==null?void 0:n.type)??"card").replace("custom:","")),o=s.length>1?`${s.length} cards (stacked)`:s[0]??"empty",l=r?g`
                    <div class="area-rename" @click=${n=>n.stopPropagation()}>
                        <input
                            .value=${e}
                            placeholder="area-name"
                            aria-label="Area name"
                            @keydown=${n=>{n.stopPropagation(),n.key==="Enter"&&this._commitRenameFromBar(e,n.target.value),n.key==="Escape"&&(this._renaming=null)}}
                            @blur=${n=>{this._renaming===e&&this._commitRenameFromBar(e,n.target.value)}}
                        >
                        <ha-icon-button .path=${f.check} .label=${"Confirm rename"}
                            @pointerdown=${n=>n.preventDefault()}
                            @click=${n=>{const c=this._qh(`#ao-${e} .area-rename input`);c&&this._commitRenameFromBar(e,c.value)}}></ha-icon-button>
                        <ha-icon-button .path=${f.close} .label=${"Cancel rename"}
                            @pointerdown=${n=>n.preventDefault()}
                            @click=${()=>{this._renaming=null}}></ha-icon-button>
                    </div>`:g`
                    <ha-dropdown class="area-menu" placement="bottom-end"
                        @click=${n=>n.stopPropagation()}
                        @wa-select=${n=>{var c,h;return this._onAreaMenuSelect(e,(h=(c=n.detail)==null?void 0:c.item)==null?void 0:h.value)}}>
                        <ha-icon-button slot="trigger" .path=${f.dotsVertical} .label=${`Area ${e} options`}></ha-icon-button>
                        <ha-dropdown-item value="rename">
                            <ha-svg-icon slot="icon" .path=${f.rename}></ha-svg-icon>
                            Rename
                        </ha-dropdown-item>
                        <ha-dropdown-item value="add">
                            <ha-svg-icon slot="icon" .path=${f.plus}></ha-svg-icon>
                            ${s.length?"Add another card":"Add card"}
                        </ha-dropdown-item>
                        <ha-dropdown-item value="settings">
                            <ha-svg-icon slot="icon" .path=${f.tune}></ha-svg-icon>
                            Area settings
                        </ha-dropdown-item>
                        <div class="menu-sep" role="separator"></div>
                        <ha-dropdown-item value="delete" variant="danger">
                            <ha-svg-icon slot="icon" .path=${f.delete}></ha-svg-icon>
                            Delete area
                        </ha-dropdown-item>
                    </ha-dropdown>`;return g`
                <div
                    class="area-overlay ${t?"selected":""} ${r?"renaming":""} ${((i=this._areaDrag)==null?void 0:i.name)===e&&this._areaDrag.moved?"dragging":""}"
                    id="ao-${e}"
                    style="display:none; --area-color: ${a};"
                    @click=${n=>{n.stopPropagation(),!this._consumeReorderClick()&&this._selectArea(e)}}
                >
                    <div class="area-label">
                        <span class="area-name" title="Drag to move the area"
                            @pointerdown=${n=>this._areaDragStart(n,e,"move")}>${e}</span>
                        <span class="area-cards">${o}</span>
                    </div>
                    ${l}
                </div>
            `})}_onAreaMenuSelect(e,t){this._selectedArea=e,t==="rename"&&this._startBarRename(e),t==="add"&&this._addCardToArea(e),t==="settings"&&this._openAreaSettings(e),t==="delete"&&this._deleteArea(e)}_renderCellTargets(){var t;const e=[];for(let r=0;r<this.rows.length;r++)for(let a=0;a<this.columns.length;a++){if(((t=this.areas[r])==null?void 0:t[a])!==".")continue;const o=this._isCellInSel(r,a);e.push(g`
                    <div
                        class="cell-target ${o?"in-sel":""}"
                        id="ct-${r}-${a}"
                        data-r="${r}" data-c="${a}"
                        style="display:none;"
                        @pointerdown=${l=>this._cellPointerDown(l,r,a)}
                    >
                        <button
                            class="cell-add-btn"
                            title="Create area here (or drag across cells)"
                            @click=${l=>{l.stopPropagation(),l.detail===0&&this._createSingleCellArea(r,a)}}
                        >
                            <ha-svg-icon .path=${f.plus}></ha-svg-icon>
                            <span>Create area</span>
                        </button>
                    </div>
                `)}return e}_renderNamePopup(){return g`
            <div class="edit-panel name-popup" id="name-popup" style="display:none;">
                ${N("Name this area",()=>this._cancelSelection())}
                <div class="edit-panel-body">
                    <ha-input
                        .value=${this._selectionName}
                        placeholder="area-name"
                        hint="Letters, numbers, - and _"
                        ?invalid=${!!this._nameError}
                        validation-message=${this._nameError||""}
                        @input=${e=>{this._selectionName=e.target.value,this._nameError=""}}
                        @keydown=${this._nameInputKeydown}
                        autofocus
                    ></ha-input>
                    <div class="edit-panel-actions">
                        <ha-button appearance="plain" @click=${this._cancelSelection}>Cancel</ha-button>
                        <ha-button variant="brand" @click=${this._confirmSelection}>Create</ha-button>
                    </div>
                </div>
            </div>
        `}_positionColumnHeaders(){var t,r;const e=this._cells;if(!(!e.length||!((t=e[0])!=null&&t.length)))for(let a=0;a<this.columns.length;a++){const s=this._qh(`#ch-${a}`),o=(r=e[0])==null?void 0:r[a];!s||!o||(s.style.left=`${o.left+E}px`,s.style.width=`${Math.max(0,o.width-2*E)}px`,s.style.top=`${o.top-P+E}px`,s.style.height=`${P-2*E}px`)}}_positionRowHeaders(){var t;const e=this._cells;if(e.length)for(let r=0;r<this.rows.length;r++){const a=this._qh(`#rh-${r}`),s=(t=e[r])==null?void 0:t[0];!a||!s||(a.style.top=`${s.top+E}px`,a.style.height=`${Math.max(0,s.height-2*E)}px`,a.style.left=`${s.left-P+E}px`,a.style.width=`${P-2*E}px`)}}_positionResizeHandles(){var a,s,o,l,i,n,c,h,d,p,m,$;const e=this._cells;if(!e.length)return;const t=C((u,b,S,k,v)=>{u&&(u.style.display="flex",u.style.left=`${b}px`,u.style.top=`${S}px`,u.style.width=`${k}px`,u.style.height=`${v}px`)},"place"),r=C((u,b)=>u!=null&&u!=="."&&u===b,"sameArea");for(let u=0;u<this.columns.length-1;u++){const b=(a=e[0])==null?void 0:a[u],S=(s=e[0])==null?void 0:s[u+1];if(!b||!S)continue;const k=(b.right+S.left)/2-z/2;t(this._qh(`#rh-col-${u}-g`),k,b.top-P,z,P);for(let v=0;v<this.rows.length;v++){const A=this._qh(`#rh-col-${u}-${v}`),w=(o=e[v])==null?void 0:o[u];if(!A||!w)continue;if(r((l=this.areas[v])==null?void 0:l[u],(i=this.areas[v])==null?void 0:i[u+1])){A.style.display="none";continue}const D=(n=e[v+1])==null?void 0:n[u];t(A,k,w.top,z,(D?D.top:w.bottom)-w.top)}}for(let u=0;u<this.rows.length-1;u++){const b=(c=e[u])==null?void 0:c[0],S=(h=e[u+1])==null?void 0:h[0];if(!b||!S)continue;const k=(b.bottom+S.top)/2-z/2;t(this._qh(`#rh-row-${u}-g`),b.left-P,k,P,z);for(let v=0;v<this.columns.length;v++){const A=this._qh(`#rh-row-${u}-${v}`),w=(d=e[u])==null?void 0:d[v];if(!A||!w)continue;if(r((p=this.areas[u])==null?void 0:p[v],(m=this.areas[u+1])==null?void 0:m[v])){A.style.display="none";continue}const D=($=e[u])==null?void 0:$[v+1];t(A,w.left,k,(D?D.left:w.right)-w.left,z)}}}_positionAreaOverlays(){var t,r;const e=this._cells;if(e.length)for(const a of O(this.areas)){const s=this._qh(`#ao-${a}`);if(!s)continue;const o=U(this.areas,a);if(!o)continue;const{r1:l,c1:i,r2:n,c2:c}=o,h=(t=e[l])==null?void 0:t[i],d=(r=e[n-1])==null?void 0:r[c-1];!h||!d||(s.style.display="block",s.style.left=`${h.left}px`,s.style.top=`${h.top}px`,s.style.width=`${d.right-h.left}px`,s.style.height=`${d.bottom-h.top}px`)}}_positionCellTargets(){var t,r;const e=this._cells;if(e.length)for(let a=0;a<this.rows.length;a++)for(let s=0;s<this.columns.length;s++){if(((t=this.areas[a])==null?void 0:t[s])!==".")continue;const o=this._qh(`#ct-${a}-${s}`);if(!o)continue;const l=(r=e[a])==null?void 0:r[s];l&&(o.style.display="block",o.style.left=`${l.left}px`,o.style.top=`${l.top}px`,o.style.width=`${l.width}px`,o.style.height=`${l.height}px`)}}_positionSelectionRect(){var p,m;if(!this._selStart||!this._selEnd)return;const e=this._cells;if(!e.length)return;const{r:t,c:r}=this._selStart,{r:a,c:s}=this._selEnd,o=Math.min(t,a),l=Math.max(t,a),i=Math.min(r,s),n=Math.max(r,s),c=(p=e[o])==null?void 0:p[i],h=(m=e[l])==null?void 0:m[n];if(!c||!h)return;const d=this._qh("#sel-rect");d&&(d.style.left=`${c.left}px`,d.style.top=`${c.top}px`,d.style.width=`${h.right-c.left}px`,d.style.height=`${h.bottom-c.top}px`)}_positionNamePopup(){var k,v,A,w;if(!this._showNameInput||!this._selStart||!this._selEnd)return;const e=this._cells;if(!e.length)return;const{r:t,c:r}=this._selStart,{r:a,c:s}=this._selEnd,o=Math.min(t,a),l=Math.max(t,a),i=Math.min(r,s),n=Math.max(r,s),c=(k=e[o])==null?void 0:k[i],h=(v=e[l])==null?void 0:v[n];if(!c||!h)return;const d=this._qh("#name-popup");if(!d)return;d.style.display="block";const p=c.left+(h.right-c.left)/2,m=c.top+(h.bottom-c.top)/2,$=d.offsetWidth,u=d.offsetHeight,b=((A=this._overlayRect)==null?void 0:A.width)??800,S=((w=this._overlayRect)==null?void 0:w.height)??600;d.style.left=`${Math.max(4,Math.min(p-$/2,b-$-4))}px`,d.style.top=`${Math.max(ie+4,Math.min(m-u/2,S-u-4))}px`,d.dataset.focused||(d.dataset.focused="1",requestAnimationFrame(()=>{var D;return(D=d.querySelector("ha-input"))==null?void 0:D.focus()}))}_commitTrack(e,t,r){const a=r==null?void 0:r.trim();if(!a)return;const s=e==="col"?[...this.columns]:[...this.rows];s[t]=a,this._emitGridState(e==="col"?s:this.columns,e==="row"?s:this.rows)}_addTrack(e){const{grid2d:t,columns:r,rows:a}=L(this.areas,this.columns,this.rows,e,e==="col"?this.columns.length:this.rows.length,"1fr");this._emitGridState(r,a,t)}async _deleteTrack(e,t){if(e==="col"&&this.columns.length<=1||e==="row"&&this.rows.length<=1)return;const r=e==="col"?`column ${t+1}`:`row ${t+1}`;if(!await j({title:`Delete ${r}?`,message:`Removing this ${e==="col"?"column":"row"} will resize the grid and delete any areas (and the cards inside them) that fit only within it.`}))return;const{grid2d:s,columns:o,rows:l}=oe(this.areas,this.columns,this.rows,e,t);this._emitGridState(o,l,s)}_headerPointerDown(e,t,r){e.button===0&&(e.stopPropagation(),e.currentTarget.setPointerCapture(e.pointerId),this._reorderDrag={axis:t,fromIndex:r,currentIndex:r},this._reorderStart={x:e.clientX,y:e.clientY},this._reorderMoved=false,this._updateDragChip(e.clientX,e.clientY))}_consumeReorderClick(){return this._suppressClick?(this._suppressClick=false,true):false}_updateDragChip(e,t){const r=this._qh("#drag-chip");if(!r||!this._reorderDrag)return;const{axis:a,fromIndex:s,currentIndex:o}=this._reorderDrag,l=a==="col"?"Col":"Row";r.textContent=o!==s?`${l} ${s+1} → ${o+1}`:`${l} ${s+1}`;const{x:i,y:n}=this._toLocal(e,t);r.style.left=`${i+14}px`,r.style.top=`${n+14}px`,r.style.display="block"}_hideDragChip(){const e=this._qh("#drag-chip");e&&(e.style.display="none")}_reorderMove(e){var c,h;if(!this._reorderDrag)return;const{axis:t,fromIndex:r}=this._reorderDrag,a=this._cells;if(!a.length)return;if(!this._reorderMoved&&this._reorderStart){const d=e.clientX-this._reorderStart.x,p=e.clientY-this._reorderStart.y;d*d+p*p>16&&(this._reorderMoved=true)}const s=this._toLocal(e.clientX,e.clientY),o=t==="col"?s.x:s.y,l=t==="col"?this.columns.length:this.rows.length;let i=this._reorderDrag.currentIndex,n=1/0;for(let d=0;d<l;d++){const p=t==="col"?(c=a[0])==null?void 0:c[d]:(h=a[d])==null?void 0:h[0];if(!p)continue;const m=t==="col"?(p.left+p.right)/2:(p.top+p.bottom)/2,$=Math.abs(o-m);$<n&&(n=$,i=d)}i!==this._reorderDrag.currentIndex&&(this._reorderDrag={...this._reorderDrag,currentIndex:i},this._reorderPreview={axis:t,from:r,to:i},this.requestUpdate()),this._updateDragChip(e.clientX,e.clientY)}_cancelReorder(){this._reorderDrag=null,this._reorderPreview=null,this._reorderMoved=false,this._hideDragChip(),this.requestUpdate()}_reorderUp(e){if(!this._reorderDrag)return;const{axis:t,fromIndex:r,currentIndex:a}=this._reorderDrag;if(this._reorderDrag=null,this._reorderPreview=null,this._hideDragChip(),this._reorderMoved&&(this._suppressClick=true,setTimeout(()=>{this._suppressClick=false},0)),this._reorderMoved=false,r===a){this.requestUpdate();return}const s=t==="col"?this.columns:this.rows,o=ne(this.areas,s,t,r,a);if(!o.safe){q.warn(`[GridEditOverlay] Reorder blocked by: ${o.blockedBy}`),this.requestUpdate();return}this._emitGridState(t==="col"?o.tracks:this.columns,t==="row"?o.tracks:this.rows,o.grid2d)}_setBoundaryActive(e,t,r){var a;(a=this.renderRoot)==null||a.querySelectorAll(`[data-b="${e}-${t}"]`).forEach(s=>s.classList.toggle("active",r))}_resizePointerDown(e,t,r){if(e.button!==0)return;e.stopPropagation(),e.currentTarget.setPointerCapture(e.pointerId),this._setBoundaryActive(t,r,true);const a=this._qh("#ghost-grid"),s=t==="col"?(a==null?void 0:a.clientWidth)??800:(a==null?void 0:a.clientHeight)??600;this._resizeDrag={axis:t,index:r,startPos:t==="col"?e.clientX:e.clientY,scale:t==="col"?this._scale().sx:this._scale().sy,origTracks:t==="col"?[...this.columns]:[...this.rows],containerPx:s}}_resizeMove(e){if(!this._resizeDrag)return;const{axis:t,index:r,startPos:a,origTracks:s,containerPx:o,scale:l}=this._resizeDrag,i=((t==="col"?e.clientX:e.clientY)-a)/(l||1),n=le(s,r,i,o,this.gap);this._resizeDrag._pendingTracks=n;const c=this._qh("#ghost-grid");if(c){const h=t==="col"?"gridTemplateColumns":"gridTemplateRows";c.style[h]=n.join(" ")}this.dispatchEvent(new CustomEvent("grid-preview-changed",{detail:{columns:t==="col"?n:this.columns,rows:t==="row"?n:this.rows,gap:this.gap},bubbles:false})),this._scheduleMeasure()}_resizeUp(e){if(!this._resizeDrag)return;const{axis:t,index:r,_pendingTracks:a}=this._resizeDrag;if(this._resizeDrag=null,this._setBoundaryActive(t,r,false),!a)return;const s=this._qh("#ghost-grid");s&&(s.style.gridTemplateColumns="",s.style.gridTemplateRows=""),this._emitGridState(t==="col"?a:this.columns,t==="row"?a:this.rows)}_selectArea(e){this._selectedArea=e===this._selectedArea?null:e,this._renaming=null,this._areaSettings&&this._selectedArea&&(this._areaSettings=this._selectedArea)}_renderAreaGrips(){if(!this._selectedArea||this._renaming===this._selectedArea)return x;const e=this._selectedArea,t={n:"top",s:"bottom",e:"right",w:"left"};return["n","s","e","w"].map(r=>g`
            <div class="area-grip ${r}" id="ag-${r}" title="Drag to move the ${t[r]} edge"
                @pointerdown=${a=>this._areaDragStart(a,e,r)}></div>
        `)}_positionAreaGrips(){const e=this._selectedArea,t=e?this._qh(`#ao-${e}`):null;if(!e||!t)return;const r=parseFloat(t.style.left),a=parseFloat(t.style.top),s=parseFloat(t.style.width),o=parseFloat(t.style.height);if(![r,a,s,o].every(Number.isFinite))return;const l=Math.min(32,Math.max(16,Math.min(s,o)/3)),i=8,n={n:[r+s/2-l/2,a-i/2,l,i],s:[r+s/2-l/2,a+o-i/2,l,i],w:[r-i/2,a+o/2-l/2,i,l],e:[r+s-i/2,a+o/2-l/2,i,l]};for(const[c,[h,d,p,m]]of Object.entries(n)){const $=this._qh(`#ag-${c}`);$&&Object.assign($.style,{display:"block",left:`${h}px`,top:`${d}px`,width:`${p}px`,height:`${m}px`})}}_positionAreaPreview(){var s,o;const e=this._areaDragPreview,t=this._qh("#area-preview");if(!e||!t)return;const r=(s=this._cells[e.bounds.r1])==null?void 0:s[e.bounds.c1],a=(o=this._cells[e.bounds.r2-1])==null?void 0:o[e.bounds.c2-1];!r||!a||Object.assign(t.style,{left:`${r.left}px`,top:`${r.top}px`,width:`${a.right-r.left}px`,height:`${a.bottom-r.top}px`})}_areaDragStart(e,t,r){var s,o;if(e.button!==0||this._renaming===t)return;const a=U(this.areas,t);a&&(e.stopPropagation(),(o=(s=e.currentTarget).setPointerCapture)==null||o.call(s,e.pointerId),this._areaDrag={name:t,mode:r,orig:a,anchor:r==="move"?this._cellAtPoint(e.clientX,e.clientY):null,target:null,ok:false,moved:false})}_areaDragMove(e){const t=this._areaDrag;if(!t)return;const r=this._cellAtPoint(e.clientX,e.clientY);if(!r)return;const{r1:a,c1:s,r2:o,c2:l}=t.orig;let i={r1:a,c1:s,r2:o,c2:l};if(t.mode==="move"){if(!t.anchor){t.anchor=r;return}const c=this.rows.length,h=this.columns.length,d=Math.max(-a,Math.min(c-o,r.r-t.anchor.r)),p=Math.max(-s,Math.min(h-l,r.c-t.anchor.c));i={r1:a+d,c1:s+p,r2:o+d,c2:l+p}}else t.mode==="n"?i.r1=Math.min(r.r,o-1):t.mode==="s"?i.r2=Math.max(r.r+1,a+1):t.mode==="w"?i.c1=Math.min(r.c,l-1):t.mode==="e"&&(i.c2=Math.max(r.c+1,s+1));const n=i.r1===a&&i.c1===s&&i.r2===o&&i.c2===l;n||(t.moved=true),t.moved&&(t.target=i,t.ok=!n&&Y(this.areas,t.name,i).ok,this._areaDragPreview={bounds:i,ok:t.ok||n},this.updateComplete.then(()=>this._positionAreaPreview()))}_areaDragEnd(e,t){const r=this._areaDrag;if(this._areaDrag=null,this._areaDragPreview=null,!r||(r.moved&&(this._suppressClick=true,setTimeout(()=>{this._suppressClick=false},0)),!t||!r.moved||!r.ok||!r.target))return;const a=Y(this.areas,r.name,r.target);a.ok&&(this._selectedArea=r.name,this._emitGridState(this.columns,this.rows,a.grid2d))}_startBarRename(e){this._renaming=e,this.updateComplete.then(()=>{var t;(t=this._qh(`#ao-${e} .aab-rename-input`))==null||t.select()})}_commitRenameFromBar(e,t){this._renaming=null;const r=t==null?void 0:t.trim();r&&r!==e&&this._commitRename(e,r)}_commitRename(e,t){const r=t==null?void 0:t.trim();if(!r||r===e)return;if(!/^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(r)){q.warn(`[GridEditOverlay] Invalid area name: ${r}`);return}const a=ce(this.areas,e,r),s=(this.cardConfigs??[]).map(o=>{var l;return((l=o==null?void 0:o.view_layout)==null?void 0:l["grid-area"])===e?{...o,view_layout:{...o.view_layout,"grid-area":r}}:o});this._selectedArea=r,this._areaSettings===e&&(this._areaSettings=r),this.dispatchEvent(new CustomEvent("area-renamed",{detail:{from:e,to:r},bubbles:false})),this._emitGridState(this.columns,this.rows,a),this._emitAreaCards(s)}async _deleteArea(e){if(!await j({title:`Delete area "${e}"?`,message:"This will remove the area and all cards placed inside it.",confirmText:"Delete"}))return;const r=de(this.areas,e),a=(this.cardConfigs??[]).filter(s=>{var o;return((o=s==null?void 0:s.view_layout)==null?void 0:o["grid-area"])!==e});this._selectedArea=null,this._areaSettings===e&&(this._areaSettings=null),this._emitGridState(this.columns,this.rows,r),this._emitAreaCards(a)}_openAreaSettings(e){this._openDock({area:e})}_updateAreaSettings(e,t){this.dispatchEvent(new CustomEvent("area-settings-changed",{detail:{name:e,patch:t},bubbles:false}))}_renderAreaSettingsBody(){var s,o,l;const e=this._areaSettings;if(!e)return x;const t=((o=(s=this.layout)==null?void 0:s.areas)==null?void 0:o[e])??{},r=C((i,n)=>this._updateAreaSettings(e,{[i]:n}),"set"),a=C(i=>this._updateAreaSettings(e,i),"setMany");return g`
                <div class="area-body">
                    <lcards-form-section header="Surface" icon="mdi:palette-outline" ?expanded=${true} ?outlined=${true}>
                        <div class="ap-field">
                            <label>Background</label>
                            <lcards-color-picker
                                .hass=${this.hass}
                                .value=${t.background??""}
                                ?showPreview=${true}
                                ?showBuilder=${true}
                                @value-changed=${i=>r("background",i.detail.value||void 0)}
                            ></lcards-color-picker>
                        </div>
                        <div class="ap-field">
                            <label>Image</label>
                            <ha-input
                                .value=${t["background-image"]??""}
                                placeholder="url(...) or linear-gradient(...)"
                                @change=${i=>r("background-image",i.target.value||void 0)}
                            ></ha-input>
                        </div>
                        ${t["background-image"]?g`
                            <div class="ap-field">
                                <label>Fit</label>
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{select:{mode:"dropdown",options:me}}}
                                    .value=${t["background-size"]??"cover"}
                                    @value-changed=${i=>r("background-size",i.detail.value==="cover"?void 0:i.detail.value)}
                                ></ha-selector>
                            </div>
                            <div class="ap-field">
                                <label>Position</label>
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{select:{mode:"dropdown",options:fe}}}
                                    .value=${t["background-position"]??"center"}
                                    @value-changed=${i=>r("background-position",i.detail.value==="center"?void 0:i.detail.value)}
                                ></ha-selector>
                            </div>
                            <div class="ap-field">
                                <label>Repeat</label>
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{select:{mode:"dropdown",options:_e}}}
                                    .value=${t["background-repeat"]??"no-repeat"}
                                    @value-changed=${i=>r("background-repeat",i.detail.value==="no-repeat"?void 0:i.detail.value)}
                                ></ha-selector>
                            </div>
                        `:x}
                        <div class="ap-field">
                            <label>Border color</label>
                            <lcards-color-picker
                                .hass=${this.hass}
                                .value=${t["border-color"]??""}
                                ?showPreview=${true}
                                ?showBuilder=${true}
                                @value-changed=${i=>r("border-color",i.detail.value||void 0)}
                            ></lcards-color-picker>
                        </div>
                        <div class="ap-field">
                            <label>Border</label>
                            <div class="ap-inline">
                                <ha-input
                                    .value=${t["border-width"]??""}
                                    placeholder="2px"
                                    title="Border width"
                                    @change=${i=>r("border-width",i.target.value||void 0)}
                                ></ha-input>
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{select:{mode:"dropdown",options:ve}}}
                                    .value=${t["border-style"]??"none"}
                                    @value-changed=${i=>r("border-style",i.detail.value==="none"?void 0:i.detail.value)}
                                ></ha-selector>
                            </div>
                        </div>
                        <div class="ap-field">
                            <label>Radius</label>
                            <ha-input
                                .value=${t["border-radius"]??""}
                                placeholder="0"
                                title="Corner radius (e.g. 12px, var(--ha-border-radius-lg))"
                                @change=${i=>r("border-radius",i.target.value||void 0)}
                            ></ha-input>
                        </div>
                    </lcards-form-section>

                    <lcards-form-section header="Placement" icon="mdi:move-resize" ?expanded=${false} ?outlined=${true}>
                        <div class="ap-field">
                            <label>Align ↕</label>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select:{mode:"dropdown",options:pe}}}
                                .value=${t["align-self"]??t["place-self"]??"stretch"}
                                @value-changed=${i=>{const n=i.detail.value,c=t["justify-self"]??t["place-self"]??"stretch";a({"place-self":void 0,"align-self":n==="stretch"?void 0:n,"justify-self":c==="stretch"?void 0:c})}}
                            ></ha-selector>
                        </div>
                        <div class="ap-field">
                            <label>Align ↔</label>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select:{mode:"dropdown",options:ge}}}
                                .value=${t["justify-self"]??t["place-self"]??"stretch"}
                                @value-changed=${i=>{const n=t["align-self"]??t["place-self"]??"stretch",c=i.detail.value;a({"place-self":void 0,"align-self":n==="stretch"?void 0:n,"justify-self":c==="stretch"?void 0:c})}}
                            ></ha-selector>
                        </div>
                        <div class="ap-field">
                            <label>Inset</label>
                            <ha-input
                                .value=${t.margin??""}
                                placeholder=${((l=this.layout)==null?void 0:l.card_margin)??"none"}
                                title="Space around the card within the area (margin)"
                                @change=${i=>r("margin",i.target.value||void 0)}
                            ></ha-input>
                        </div>
                        <div class="ap-field">
                            <label>Overflow X</label>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select:{mode:"dropdown",options:F}}}
                                .value=${t["overflow-x"]??t.overflow??"visible"}
                                @value-changed=${i=>{const n=i.detail.value,c=t["overflow-y"]??t.overflow??"visible";a({overflow:void 0,"overflow-x":n==="visible"?void 0:n,"overflow-y":c==="visible"?void 0:c})}}
                            ></ha-selector>
                        </div>
                        <div class="ap-field">
                            <label>Overflow Y</label>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select:{mode:"dropdown",options:F}}}
                                .value=${t["overflow-y"]??t.overflow??"visible"}
                                @value-changed=${i=>{const n=t["overflow-x"]??t.overflow??"visible",c=i.detail.value;a({overflow:void 0,"overflow-x":n==="visible"?void 0:n,"overflow-y":c==="visible"?void 0:c})}}
                            ></ha-selector>
                        </div>
                        <div class="ap-field">
                            <label>Layer (z)</label>
                            <ha-input
                                type="number"
                                .value=${t["z-index"]??""}
                                placeholder="0"
                                title="Stacking order of this area's backing surface"
                                @change=${i=>r("z-index",i.target.value===""?void 0:Number(i.target.value))}
                            ></ha-input>
                        </div>
                    </lcards-form-section>
                </div>
        `}_addCardToArea(e){const t=(this.cardConfigs??[]).filter(r=>{var a;return((a=r==null?void 0:r.view_layout)==null?void 0:a["grid-area"])===e});t.length>0&&q.info(`[GridEditOverlay] Area "${e}" already has ${t.length} card(s). Use vertical-stack to group multiple cards.`),this.dispatchEvent(new CustomEvent("add-card-to-area",{detail:{areaName:e},bubbles:true,composed:true}))}_cellPointerDown(e,t,r){var a,s;this._showNameInput||e.button!==0||(e.stopPropagation(),(s=(a=e.currentTarget).setPointerCapture)==null||s.call(a,e.pointerId),this._selStart={r:t,c:r},this._selEnd={r:t,c:r},this._selDrag=true,this._selMoved=false,this._selectedArea=null)}_selMove(e){var r;if(!this._selDrag||!this._selStart||!this._selEnd)return;const t=this._cellAtPoint(e.clientX,e.clientY);if(t&&((r=this.areas[t.r])==null?void 0:r[t.c])==="."&&(t.r!==this._selEnd.r||t.c!==this._selEnd.c)){this._selEnd=t,this._selMoved=this._selMoved||t.r!==this._selStart.r||t.c!==this._selStart.c,this._positionSelectionRect();for(let a=0;a<this.rows.length;a++)for(let s=0;s<this.columns.length;s++){const o=this._qh(`#ct-${a}-${s}`);o&&o.classList.toggle("in-sel",this._isCellInSel(a,s))}}}_selUp(e){if(!this._selDrag)return;this._selDrag=false;const t=this._cellAtPoint(e.clientX,e.clientY);this._selStart&&this._selEnd&&(this._selMoved||t)?(this._showNameInput=true,this._selectionName=""):(this._selStart=null,this._selEnd=null),this.requestUpdate()}_createSingleCellArea(e,t){this._selStart={r:e,c:t},this._selEnd={r:e,c:t},this._showNameInput=true,this._selectionName="",this.requestUpdate()}_isCellInSel(e,t){if(!this._selStart||!this._selEnd)return false;const{r,c:a}=this._selStart,{r:s,c:o}=this._selEnd;return e>=Math.min(r,s)&&e<=Math.max(r,s)&&t>=Math.min(a,o)&&t<=Math.max(a,o)}_nameInputKeydown(e){e.key==="Enter"&&this._confirmSelection(),e.key==="Escape"&&this._cancelSelection()}_confirmSelection(){var i;const e=(i=this._selectionName)==null?void 0:i.trim();if(!e){this._nameError="Enter a name";return}if(!/^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(e)){this._nameError="Use letters, numbers, - and _ (no spaces; not starting with a number)";return}if(O(this.areas).includes(e)){this._nameError=`"${e}" is already used`;return}if(!this._selStart||!this._selEnd)return;const{r:t,c:r}=this._selStart,{r:a,c:s}=this._selEnd,o={r1:Math.min(t,a),c1:Math.min(r,s),r2:Math.max(t,a)+1,c2:Math.max(r,s)+1},l=he(this.areas,o,e);if(!l.ok){this._nameError=l.error??"Cannot create the area here";return}this._selStart=null,this._selEnd=null,this._showNameInput=false,this._nameError="",this._selectedArea=e,this._emitGridState(this.columns,this.rows,l.grid2d)}_cancelSelection(){this._nameError="",this._selStart=null,this._selEnd=null,this._showNameInput=false,this._selectionName=""}_emitGridState(e,t,r,a){this.dispatchEvent(new CustomEvent("grid-state-changed",{detail:{columns:e??this.columns,rows:t??this.rows,areas:r??this.areas,gap:a??this.gap},bubbles:false}))}_emitAreaCards(e){this.dispatchEvent(new CustomEvent("area-cards-changed",{detail:{cards:e},bubbles:false}))}};C(T,"LCARdSGridEditOverlay"),R(T,"properties",{hass:{attribute:false},columns:{attribute:false},rows:{attribute:false},areas:{attribute:false},gap:{attribute:false},measureColumns:{attribute:false},measureRows:{attribute:false},measureOffset:{attribute:false},cardConfigs:{attribute:false},layout:{attribute:false},hideCardMode:{attribute:false},hideSettings:{attribute:false},_selectedArea:{state:true},_renaming:{state:true},_trackPopover:{state:true},_selStart:{state:true},_selEnd:{state:true},_selectionName:{state:true},_showNameInput:{state:true},_nameError:{state:true},_showSettings:{state:true},_reorderPreview:{state:true},_areaSettings:{state:true},_areaDragPreview:{state:true},_areaTint:{state:true}}),R(T,"styles",[J,Q,ee,te`
        :host {
            display: block;
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 100;
            font-family: var(--ha-font-family-body);
        }

        /* ─── Ghost grid (measurement only) ──────────────────────────────── */
        /* Padded (inline style) by the real grid's content offset, so ghost
           cells line up with the real #grid-root cells. */
        #ghost-grid {
            position: absolute;
            inset: 0;
            display: grid;
            opacity: 0;
            pointer-events: none;
            box-sizing: border-box;
        }
        .gc { min-width: 0; min-height: 0; }

        .edit-bar { z-index: ${y.bar}; }

        .t-tint {
            display: flex;
            align-items: center;
            gap: var(--ha-space-1);
            color: var(--secondary-text-color);
            --mdc-icon-size: 18px;
        }
        .t-tint input[type=range] {
            width: 90px;
            accent-color: var(--primary-color);
            cursor: pointer;
        }

        /* ─── Column / row headers (live in the reserved gutter) ──────────── */
        .col-header,
        .row-header {
            position: absolute;
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            overflow: hidden;
            pointer-events: auto;
            cursor: grab;
            user-select: none;
            touch-action: none;
            background: var(--secondary-background-color);
            border: var(--ha-border-width-sm) solid var(--divider-color);
            border-radius: var(--ha-border-radius-sm);
            color: var(--secondary-text-color);
            z-index: ${y.header};
            transition: background var(--ha-animation-duration-fast, 150ms), color var(--ha-animation-duration-fast, 150ms), border-color var(--ha-animation-duration-fast, 150ms);
        }
        .row-header { writing-mode: vertical-rl; }
        .col-header:hover, .row-header:hover,
        .col-header.open, .row-header.open {
            background: color-mix(in srgb, var(--primary-color) 18%, var(--secondary-background-color));
            border-color: var(--primary-color);
            color: var(--primary-text-color);
        }
        .col-header.dragging, .row-header.dragging { opacity: 0.5; cursor: grabbing; }
        .col-header.drop-target, .row-header.drop-target {
            background: color-mix(in srgb, var(--primary-color) 35%, var(--secondary-background-color));
            border-color: var(--primary-color);
        }
        .track-label {
            font-size: 11px;
            font-weight: var(--ha-font-weight-medium, 500);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            padding: 0 var(--ha-space-1);
            max-width: 100%;
        }

        /* ─── Resize handles ──────────────────────────────────────────────── */
        /* One segment per row (column boundaries) or column (row boundaries),
           plus one in the header gutter. Segments inside an area that spans the
           boundary are hidden, so the middle of a spanning area stays the area. */
        .rh-seg {
            position: absolute;
            display: none;
            align-items: center;
            justify-content: center;
            pointer-events: auto;
            touch-action: none;
            z-index: ${y.handle};
        }
        .rh-seg.col { cursor: col-resize; }
        .rh-seg.row { cursor: row-resize; }
        .rh-seg.disabled { cursor: not-allowed; }
        .rh-seg::after {
            content: '';
            position: absolute;
            background: var(--primary-color);
            border-radius: var(--ha-border-radius-pill);
            opacity: 0;
            transition: opacity var(--ha-animation-duration-fast, 150ms);
        }
        .rh-seg.col::after { top: 4px; bottom: 4px; left: 50%; width: 3px; transform: translateX(-50%); }
        .rh-seg.row::after { left: 4px; right: 4px; top: 50%; height: 3px; transform: translateY(-50%); }
        .rh-seg:not(.disabled):hover::after,
        .rh-seg.active::after { opacity: 1; }
        .rh-seg.gutter { z-index: ${y.gutterHandle}; }
        /* ─── Area overlays ───────────────────────────────────────────────── */
        /* Outline areas: a coloured outline and a light tint (--area-color, set
           per area), so the real cards stay readable while laying out. */
        .area-overlay {
            position: absolute;
            pointer-events: auto;
            box-sizing: border-box;
            border: var(--ha-border-width-md) solid color-mix(in srgb, var(--area-color) 75%, transparent);
            border-radius: var(--ha-border-radius-md);
            background: color-mix(in srgb, var(--area-color) var(--area-tint, 60%), transparent);
            cursor: pointer;
            z-index: ${y.area};
            transition: background var(--ha-animation-duration-fast, 150ms);
        }
        .area-overlay:hover { background: color-mix(in srgb, var(--area-color) min(100%, calc(var(--area-tint, 60%) + 10%)), transparent); }
        .area-overlay.selected {
            border-color: var(--primary-color);
            box-shadow: inset 0 0 0 var(--ha-border-width-sm) var(--primary-color);
            background: color-mix(in srgb, var(--area-color) min(100%, calc(var(--area-tint, 60%) + 10%)), transparent);
        }
        .area-overlay.dragging { opacity: 0.4; }
        .area-label {
            position: absolute;
            top: 50%;
            left: var(--ha-space-2);
            right: var(--ha-space-2);
            transform: translateY(-50%);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
            pointer-events: none;
            text-align: center;
        }
        /* Area chips: the name (with the area's colour bar) and its card(s), on
           an HA card surface so they read over any card behind them. */
        .area-name, .area-cards {
            max-width: 100%;
            box-sizing: border-box;
            padding: var(--ha-space-1) var(--ha-space-3);
            border-radius: var(--ha-border-radius-md);
            background: var(--card-background-color, var(--primary-background-color));
            border: var(--ha-border-width-sm) solid var(--divider-color);
            box-shadow: var(--ha-box-shadow-s);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.3;
        }
        .area-name {
            pointer-events: auto;
            cursor: move;
            touch-action: none;
            border-left: 4px solid var(--area-color);
            font-size: var(--ha-font-size-l, 16px);
            font-weight: var(--ha-font-weight-bold, 700);
            color: var(--primary-text-color);
        }
        .area-cards {
            font-size: var(--ha-font-size-m, 14px);
            color: var(--secondary-text-color);
        }
        .area-label { gap: var(--ha-space-1); }
        /* The ⋮ area menu (HA's card edit-mode pattern). Always shown at reduced
           opacity so it can be found (and tapped on touch screens). */
        /* ha-dropdown is display: contents, so the trigger button is what gets
           positioned (as in hui-card-edit-mode). */
        .area-menu ha-icon-button {
            position: absolute;
            top: var(--ha-space-1);
            right: var(--ha-space-1);
            z-index: 1;
            --ha-icon-button-size: 32px;
            --mdc-icon-size: 20px;
            border-radius: var(--ha-border-radius-circle);
            background: var(--secondary-background-color);
            color: var(--primary-text-color);
            opacity: 0.75;
            transition: opacity var(--ha-animation-duration-fast, 150ms);
        }
        .area-overlay:hover .area-menu ha-icon-button,
        .area-overlay.selected .area-menu ha-icon-button,
        .area-menu ha-icon-button:focus-visible { opacity: 1; }
        .menu-sep {
            height: var(--ha-border-width-sm);
            margin: var(--ha-space-1) 0;
            background: var(--divider-color);
        }
        .area-rename {
            position: absolute;
            top: var(--ha-space-1);
            right: var(--ha-space-1);
            left: var(--ha-space-1);
            z-index: 1;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 2px;
        }
        .area-rename input {
            flex: 1;
            min-width: 0;
            max-width: 200px;
            font: inherit;
            font-size: 13px;
            padding: var(--ha-space-1) var(--ha-space-2);
            border: var(--ha-border-width-sm) solid var(--primary-color);
            border-radius: var(--ha-border-radius-sm);
            background: var(--card-background-color, var(--primary-background-color));
            color: var(--primary-text-color);
            outline: none;
        }
        .area-rename ha-icon-button {
            --ha-icon-button-size: 32px;
            border-radius: var(--ha-border-radius-circle);
            background: var(--secondary-background-color);
            color: var(--primary-text-color);
        }

        /* ─── Empty cells (click: create area; drag: rubber-band) ─────────── */
        .cell-target {
            position: absolute;
            pointer-events: auto;
            cursor: crosshair;
            box-sizing: border-box;
            touch-action: none;
            z-index: ${y.cell};
        }
        .cell-add-btn {
            position: absolute;
            inset: 0;
            opacity: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: var(--ha-space-1);
            border-radius: var(--ha-border-radius-md);
            border: var(--ha-border-width-md) dashed var(--primary-color);
            background: color-mix(in srgb, var(--primary-color) 8%, transparent);
            color: var(--primary-text-color);
            font: inherit;
            font-size: 12px;
            font-weight: var(--ha-font-weight-medium, 500);
            cursor: crosshair;
            pointer-events: none;
            transition: opacity var(--ha-animation-duration-fast, 150ms);
            --mdc-icon-size: 22px;
        }
        .cell-target:hover .cell-add-btn,
        .cell-add-btn:focus-visible { opacity: 1; }
        .cell-target.in-sel .cell-add-btn {
            opacity: 1;
            background: color-mix(in srgb, var(--primary-color) 20%, transparent);
        }

        /* ─── Rubber-band selection rect ──────────────────────────────────── */
        .sel-rect {
            position: absolute;
            pointer-events: none;
            z-index: ${y.selection};
            border: var(--ha-border-width-md) dashed var(--primary-color);
            border-radius: var(--ha-border-radius-md);
            background: color-mix(in srgb, var(--primary-color) 15%, transparent);
        }

        /* ─── Floating panels ─────────────────────────────────────────────── */
        .edit-panel { z-index: ${y.panel}; }
        .edit-dock { z-index: ${y.panel}; }
        .name-popup { width: 240px; }
        .edit-dock ha-input, .name-popup ha-input { display: block; width: 100%; }
        .settings-hint {
            font-size: 12px;
            color: var(--secondary-text-color);
        }
        .tp-presets {
            display: flex;
            flex-wrap: wrap;
            gap: var(--ha-space-1);
        }
        .tp-preset {
            padding: 2px var(--ha-space-2);
            border-radius: var(--ha-border-radius-pill);
            font: inherit;
            font-size: 12px;
            cursor: pointer;
            background: var(--secondary-background-color);
            color: var(--primary-text-color);
            border: var(--ha-border-width-sm) solid var(--divider-color);
        }
        .tp-preset:hover { border-color: var(--primary-color); }
        .tp-preset.current {
            background: color-mix(in srgb, var(--primary-color) 20%, var(--secondary-background-color));
            border-color: var(--primary-color);
        }

        /* Area move / resize: grips on the selected area's edges, and a preview
           of the target cells while dragging (red when it would overlap). */
        .area-grip {
            position: absolute;
            display: none;
            box-sizing: border-box;
            pointer-events: auto;
            touch-action: none;
            z-index: ${y.areaGrip};
            background: var(--primary-color);
            border: var(--ha-border-width-md) solid var(--card-background-color, var(--primary-background-color));
            border-radius: var(--ha-border-radius-pill);
            box-shadow: var(--ha-box-shadow-s);
        }
        .area-grip.n, .area-grip.s { cursor: ns-resize; }
        .area-grip.e, .area-grip.w { cursor: ew-resize; }
        .area-preview {
            position: absolute;
            pointer-events: none;
            box-sizing: border-box;
            z-index: ${y.selection};
            border: var(--ha-border-width-md) dashed var(--primary-color);
            border-radius: var(--ha-border-radius-md);
            background: color-mix(in srgb, var(--primary-color) 18%, transparent);
        }
        .area-preview.blocked {
            border-color: var(--error-color);
            background: color-mix(in srgb, var(--error-color) 18%, transparent);
        }

        /* Per-area settings in the dock */
        .area-body { display: flex; flex-direction: column; gap: var(--ha-space-2); }
        /* Each setting is its own row with a faint rule, so complex controls
           (e.g. the color picker's buttons + input) read as one unit. */
        .ap-field {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 0;
            border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
        }
        .ap-field:last-child { border-bottom: none; padding-bottom: 2px; }
        .ap-field > label {
            font-size: 14px;
            color: var(--primary-text-color);
            width: 92px;
            flex-shrink: 0;
        }
        .ap-field lcards-color-picker,
        .ap-field ha-input,
        .ap-field ha-selector { flex: 1; min-width: 0; }
        .ap-inline { display: flex; gap: 6px; flex: 1; min-width: 0; }
        .ap-inline ha-input,
        .ap-inline ha-selector { flex: 1; min-width: 0; }

        /* ─── Reorder drag chip (follows the cursor) ──────────────────────── */
        .drag-chip {
            position: absolute;
            display: none;
            z-index: ${y.chip};
            pointer-events: none;
            padding: var(--ha-space-1) var(--ha-space-2);
            border-radius: var(--ha-border-radius-pill);
            font-size: 12px;
            font-weight: var(--ha-font-weight-bold, 700);
            background: var(--primary-color);
            color: var(--text-primary-color);
            box-shadow: var(--ha-box-shadow-m);
            white-space: nowrap;
        }
    `]);let G=T;customElements.get("lcards-grid-edit-overlay")||customElements.define("lcards-grid-edit-overlay",G);export{G as LCARdSGridEditOverlay};
//# sourceMappingURL=lcards-grid-edit-overlay-CzD6gmYH.js.map
