var q=Object.defineProperty;var Y=(x,e,t)=>e in x?q(x,e,{enumerable:true,configurable:true,writable:true,value:t}):x[e]=t;var $=(x,e)=>q(x,"name",{value:e,configurable:true});var I=(x,e,t)=>Y(x,typeof e!="symbol"?e+"":e,t);import{i as j,ae as U,a as X,A as _,b as u,af as T,ag as E,ah as B,ab as N,ai as Z,h as O,aj as K,ak as F,l as M,al as W,am as J,an as Q,ao as ee}from"./lcards-main-OH3P_lk4.js";import"./lcards-form-section-CBBDqzr-.js";const te=[{value:"stretch",label:"Stretch (default)"},{value:"start",label:"Top"},{value:"center",label:"Center"},{value:"end",label:"Bottom"}],re=[{value:"stretch",label:"Stretch (default)"},{value:"start",label:"Left"},{value:"center",label:"Center"},{value:"end",label:"Right"}],V=[{value:"visible",label:"Visible: bleeds beyond cell"},{value:"clip",label:"Clip: hard clip, no scroll"},{value:"hidden",label:"Hidden: clip + block context"},{value:"auto",label:"Scroll when needed (auto)"},{value:"scroll",label:"Always scroll"}],ae=[{value:"none",label:"None"},{value:"solid",label:"Solid"},{value:"dashed",label:"Dashed"},{value:"dotted",label:"Dotted"}],ie=[{value:"cover",label:"Cover (fill & crop)"},{value:"contain",label:"Contain (fit whole)"},{value:"100% 100%",label:"Stretch"},{value:"auto",label:"Auto (natural size)"}],oe=[{value:"center",label:"Center"},{value:"top",label:"Top"},{value:"bottom",label:"Bottom"},{value:"left",label:"Left"},{value:"right",label:"Right"}],se=[{value:"no-repeat",label:"No repeat"},{value:"repeat",label:"Repeat"},{value:"repeat-x",label:"Repeat X"},{value:"repeat-y",label:"Repeat Y"}],G=[{bg:"var(--lcars-ui-primary)",text:"var(--lcars-ui-primary)"},{bg:"var(--lcars-ui-quaternary)",text:"var(--lcars-ui-quaternary)"},{bg:"var(--lcars-ui-secondary)",text:"var(--lcars-ui-secondary)"},{bg:"var(--lcars-blue)",text:"var(--lcars-blue)"},{bg:"var(--lcards-green)",text:"var(--lcards-green)"},{bg:"var(--lcars-ui-tertiary)",text:"var(--lcars-ui-tertiary)"}];function ne(x){let e=0;for(let t=0;t<x.length;t++)e=e*31+x.charCodeAt(t)|0;return G[Math.abs(e)%G.length]}$(ne,"areaColor");const w=U,P=10,A=class A2 extends j{constructor(){super(),this.hass=void 0,this.columns=["1fr","1fr","1fr"],this.rows=["1fr","1fr","1fr"],this.areas=Array(3).fill(null).map(()=>Array(3).fill(".")),this.gap="5px",this.cardConfigs=[],this.layout={},this.measureColumns=void 0,this.measureRows=void 0,this.hideCardMode=false,this.hideSettings=false,this._selectedArea=null,this._renaming=null,this._trackPopover=null,this._showSettings=false,this._selStart=null,this._selEnd=null,this._selectionName="",this._showNameInput=false,this._reorderPreview=null,this._areaSettings=null,this._areaPanelPos=null,this._areaPanelAnchor=null,this._areaPanelDrag=null,this._overlayOpacity=50,this._headerOpacity=20,this._cells=[],this._overlayRect=null,this._measureScheduled=false,this._resizeDrag=null,this._reorderDrag=null,this._selDrag=false,this._selMoved=false,this._toolbarPos=null,this._toolbarDrag=null,this._boundPointerMove=this._onAnyPointerMove.bind(this),this._boundPointerUp=this._onAnyPointerUp.bind(this),this._boundKeydown=this._onDocKeydown.bind(this)}_qh(e){return this.renderRoot?this.renderRoot.querySelector(e):null}connectedCallback(){super.connectedCallback(),this.addEventListener("pointermove",this._boundPointerMove),this.addEventListener("pointerup",this._boundPointerUp),document.addEventListener("keydown",this._boundKeydown,true),this._resizeObserver=new ResizeObserver(()=>this._scheduleMeasure()),this._resizeObserver.observe(this)}disconnectedCallback(){var e;super.disconnectedCallback(),this.removeEventListener("pointermove",this._boundPointerMove),this.removeEventListener("pointerup",this._boundPointerUp),document.removeEventListener("keydown",this._boundKeydown,true),(e=this._resizeObserver)==null||e.disconnect(),this._resizeObserver=null}_onDocKeydown(e){e.key==="Escape"&&(this._renaming?(e.stopImmediatePropagation(),e.preventDefault(),this._renaming=null):this._trackPopover&&(e.stopImmediatePropagation(),e.preventDefault(),this._trackPopover=null))}_onAnyPointerMove(e){this._resizeDrag&&this._resizeMove(e),this._reorderDrag&&this._reorderMove(e),this._selDrag&&this._selMove(e),this._toolbarDrag&&this._toolbarDragMove(e),this._areaPanelDrag&&this._areaPanelDragMove(e)}_onAnyPointerUp(e){this._resizeDrag&&this._resizeUp(e),this._reorderDrag&&this._reorderUp(e),this._selDrag&&this._selUp(e),this._toolbarDrag&&this._toolbarDragEnd(e),this._areaPanelDrag&&this._areaPanelDragEnd(e)}_toolbarDragStart(e){e.stopPropagation();const t=this._qh("#toolbar"),a=t==null?void 0:t.getBoundingClientRect(),r=this.getBoundingClientRect();this._toolbarDrag={offsetX:e.clientX-((a==null?void 0:a.left)??0),offsetY:e.clientY-((a==null?void 0:a.top)??0),oLeft:r.left,oTop:r.top},t==null||t.classList.add("dragging")}_toolbarDragMove(e){if(!this._toolbarDrag)return;const{offsetX:t,offsetY:a,oLeft:r,oTop:i}=this._toolbarDrag;this._toolbarPos={left:e.clientX-r-t,top:e.clientY-i-a}}_toolbarDragEnd(e){var t;this._toolbarDrag=null,(t=this._qh("#toolbar"))==null||t.classList.remove("dragging")}_cellAtPoint(e,t){var s,n,l;const a=((s=this._overlayRect)==null?void 0:s.left)??0,r=((n=this._overlayRect)==null?void 0:n.top)??0,i=e-a,o=t-r;for(let d=0;d<this._cells.length;d++)for(let p=0;p<(((l=this._cells[d])==null?void 0:l.length)??0);p++){const c=this._cells[d][p];if(c&&i>=c.left&&i<=c.right&&o>=c.top&&o<=c.bottom)return{r:d,c:p}}return null}updated(e){this._scheduleMeasure(),e.has("_headerOpacity")&&this.style.setProperty("--lcards-header-opacity",String(this._headerOpacity/100))}refresh(){this._scheduleMeasure()}_scheduleMeasure(){this._measureScheduled||(this._measureScheduled=true,requestAnimationFrame(()=>{this._measureScheduled=false,this._measure()}))}_measure(){const e=this._qh("#ghost-grid");if(!e)return;const t=this.getBoundingClientRect();this._overlayRect=t;const a=[],r=this.rows.length,i=this.columns.length;for(let o=0;o<r;o++){a[o]=[];for(let s=0;s<i;s++){const n=e.querySelector(`.gc[data-r="${o}"][data-c="${s}"]`);if(n){const l=n.getBoundingClientRect();a[o][s]={left:l.left-t.left,top:l.top-t.top,right:l.right-t.left,bottom:l.bottom-t.top,width:l.width,height:l.height}}}}this._cells=a,this._positionElements()}_positionElements(){this._cells.length&&(this._positionColumnHeaders(),this._positionRowHeaders(),this._positionResizeHandles(),this._positionAreaOverlays(),this._positionCellTargets(),this._positionSelectionRect(),this._positionNamePopup(),this._positionSettingsPanel())}render(){return u`
            ${this._renderGhostGrid()}
            ${this._renderColumnHeaders()}
            ${this._renderRowHeaders()}
            ${this._renderResizeHandles()}
            ${this._renderAreaOverlays()}
            ${this._renderCellTargets()}
            ${this._selStart&&this._selEnd?u`<div class="sel-rect" id="sel-rect"></div>`:_}
            ${this._showNameInput?this._renderNamePopup():_}
            ${this._trackPopover?this._renderTrackPopover():_}
            ${this._areaSettings?this._renderAreaSettingsPanel():_}
            ${this._renderToolbar()}
            <div class="drag-chip" id="drag-chip"></div>
        `}_renderGhostGrid(){var i,o;const e=(i=this.measureColumns)!=null&&i.length?this.measureColumns:this.columns,t=(o=this.measureRows)!=null&&o.length?this.measureRows:this.rows,a=[`grid-template-columns: ${e.join(" ")}`,`grid-template-rows: ${t.join(" ")}`,`gap: ${this.gap}`].join("; "),r=[];for(let s=0;s<this.rows.length;s++)for(let n=0;n<this.columns.length;n++)r.push(u`<div class="gc" data-r="${s}" data-c="${n}"></div>`);return u`<div id="ghost-grid" style="${a}">${r}</div>`}_renderToolbar(){return u`
            <div class="toolbar" id="toolbar" style=${this._toolbarPos?`top:${this._toolbarPos.top}px; left:${this._toolbarPos.left}px; transform:none;`:""}>
                <div class="drag-grip" @pointerdown=${this._toolbarDragStart} title="Drag to move">
                    <ha-icon icon="mdi:drag"></ha-icon>
                </div>
                <span class="toolbar-label">Layout Mode</span>
                <div class="t-sep"></div>
                <button class="t-btn" title="Add column" @click=${()=>this._addTrack("col")}>
                    <ha-icon icon="mdi:table-column-plus-after"></ha-icon>
                    <span>+ Col</span>
                </button>
                <button class="t-btn" title="Add row" @click=${()=>this._addTrack("row")}>
                    <ha-icon icon="mdi:table-row-plus-after"></ha-icon>
                    <span>+ Row</span>
                </button>
                <div class="t-sep"></div>
                <div class="t-opacity" title="Area overlay opacity">
                    <ha-icon icon="mdi:opacity"></ha-icon>
                    <input type="range" min="0" max="100" step="5"
                        .value=${String(this._overlayOpacity)}
                        style="--pct:${this._overlayOpacity}%"
                        @input=${e=>{this._overlayOpacity=Number(e.target.value),e.target.style.setProperty("--pct",`${this._overlayOpacity}%`)}}
                    >
                </div>
                <div class="t-opacity" title="Track header opacity">
                    <ha-icon icon="mdi:table-headers-eye"></ha-icon>
                    <input type="range" min="0" max="100" step="5"
                        .value=${String(this._headerOpacity)}
                        style="--pct:${this._headerOpacity}%"
                        @input=${e=>{this._headerOpacity=Number(e.target.value),e.target.style.setProperty("--pct",`${this._headerOpacity}%`),this.style.setProperty("--lcards-header-opacity",String(this._headerOpacity/100))}}
                    >
                </div>
                ${this.hideSettings?_:u`
                    <div class="t-sep"></div>
                    <button
                        class="t-btn ${this._showSettings?"primary":""}"
                        title="Layout settings (gap, margins)"
                        @click=${()=>{this._showSettings=!this._showSettings}}
                    >
                        <ha-icon icon="mdi:tune-variant"></ha-icon>
                    </button>
                `}
                ${this.hideCardMode?_:u`
                    <div class="t-sep"></div>
                    <button
                        class="t-btn primary"
                        title="Switch to card editing mode"
                        @click=${()=>this.dispatchEvent(new CustomEvent("switch-to-cards-mode",{bubbles:false}))}
                    >
                        <ha-icon icon="mdi:card-multiple-outline"></ha-icon>
                        <span>Switch to Edit Cards</span>
                    </button>
                `}
            </div>
            ${this._showSettings?this._renderSettingsPanel():_}
        `}_renderSettingsPanel(){const e=this.layout??{};return u`
            <div class="settings-panel">
                <div class="settings-title">Grid Settings</div>
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
                <div class="settings-actions">
                    <ha-button @click=${()=>{this._showSettings=false}}>Done</ha-button>
                </div>
            </div>
        `}_renderTrackPopover(){const{axis:e,index:t}=this._trackPopover,a=e==="col"?this.columns[t]:this.rows[t],r=e==="col"?`Column ${t+1}`:`Row ${t+1}`,i=e==="col"?["1fr","2fr","3fr","auto","100px","200px","300px","50%","clamp(100px,12vw,200px)"]:["1fr","2fr","auto","60px","80px","120px","50%","clamp(40px,8vh,100px)"],o=$(s=>{s.stopPropagation(),this._trackPopover=null},"closePopover");return u`
            <div class="track-popover" id="track-popover"
                @click=${s=>s.stopPropagation()}
                @keydown=${s=>{s.key==="Escape"?o(s):s.stopPropagation()}}>
                <div class="tp-header">
                    <span class="tp-title">${r} size</span>
                    <button class="tp-close" title="Close" @click=${o}>×</button>
                </div>
                <div class="tp-presets">
                    ${i.map(s=>u`
                        <button
                            class="tp-preset"
                            @click=${()=>{this._commitTrack(e,t,s),this._trackPopover=null}}
                        >${s}</button>
                    `)}
                </div>
                <div class="tp-custom">
                    <ha-input
                        label="Custom size"
                        .value=${a}
                        placeholder="e.g. 1fr, 200px, 25%"
                        @keydown=${s=>{s.stopPropagation(),s.key==="Enter"&&(this._commitTrack(e,t,s.target.value),this._trackPopover=null),s.key==="Escape"&&(this._trackPopover=null)}}
                    ></ha-input>
                </div>
            </div>
        `}_openTrackPopover(e,t,a){this._trackPopover={axis:e,index:t},this.updateComplete.then(()=>{var b;const r=this._qh("#track-popover");if(!r)return;const i=e==="col"?`ch-${t}`:`rh-${t}`,o=this._qh(`#${i}`);if(!o)return;const s=o.getBoundingClientRect(),n=this.getBoundingClientRect(),l=r.offsetHeight,d=210,p=s.left-n.left,c=Math.max(0,Math.min(p,n.width-d-4)),v=s.bottom-n.top+4,h=s.top-n.top-l-4,g=v+l>n.height&&h>=0?h:v;r.style.left=`${c}px`,r.style.top=`${Math.max(0,g)}px`,r.style.bottom="auto",(b=r.querySelector("ha-input"))==null||b.focus()})}_emitLayoutProp(e,t){const a={...this.layout??{}};t==null||t===""?delete a[e]:a[e]=t,this.dispatchEvent(new CustomEvent("layout-settings-changed",{detail:{layout:a},bubbles:false}))}_renderColumnHeaders(){return this.columns.map((e,t)=>{var o,s,n,l,d,p;const a=((o=this._editingTrack)==null?void 0:o.axis)==="col"&&((s=this._editingTrack)==null?void 0:s.index)===t,r=((n=this._reorderDrag)==null?void 0:n.axis)==="col"&&((l=this._reorderDrag)==null?void 0:l.fromIndex)===t,i=((d=this._reorderPreview)==null?void 0:d.axis)==="col"&&((p=this._reorderPreview)==null?void 0:p.to)===t;return u`
                <div
                    class="col-header ${r?"dragging":""} ${i?"drop-target":""}"
                    id="ch-${t}"
                    @pointerdown=${c=>this._headerPointerDown(c,"col",t)}
                    @click=${c=>{c.stopPropagation(),!this._consumeReorderClick()&&this._openTrackPopover("col",t,c)}}
                >
                    ${a?u`<input
                            class="track-edit-input"
                            .value=${e}
                            @keydown=${c=>this._trackInputKeydown(c,"col",t)}
                            @blur=${c=>this._commitTrack("col",t,c.target.value)}
                            @click=${c=>c.stopPropagation()}
                          />`:u`<span class="track-label">${e}</span>`}
                    <div
                        class="del-btn"
                        @click=${c=>{c.stopPropagation(),this._deleteTrack("col",t)}}
                        title="Delete column"
                    >
                        <ha-icon icon="mdi:close"></ha-icon>
                    </div>
                </div>
            `})}_renderRowHeaders(){return this.rows.map((e,t)=>{var o,s,n,l,d,p;const a=((o=this._editingTrack)==null?void 0:o.axis)==="row"&&((s=this._editingTrack)==null?void 0:s.index)===t,r=((n=this._reorderDrag)==null?void 0:n.axis)==="row"&&((l=this._reorderDrag)==null?void 0:l.fromIndex)===t,i=((d=this._reorderPreview)==null?void 0:d.axis)==="row"&&((p=this._reorderPreview)==null?void 0:p.to)===t;return u`
                <div
                    class="row-header ${r?"dragging":""} ${i?"drop-target":""}"
                    id="rh-${t}"
                    @pointerdown=${c=>this._headerPointerDown(c,"row",t)}
                    @click=${c=>{c.stopPropagation(),!this._consumeReorderClick()&&this._openTrackPopover("row",t,c)}}
                >
                    ${a?u`<input
                            class="track-edit-input"
                            .value=${e}
                            @keydown=${c=>this._trackInputKeydown(c,"row",t)}
                            @blur=${c=>this._commitTrack("row",t,c.target.value)}
                            @click=${c=>c.stopPropagation()}
                          />`:u`<span class="track-label">${e}</span>`}
                    <div
                        class="del-btn"
                        @click=${c=>{c.stopPropagation(),this._deleteTrack("row",t)}}
                        title="Delete row"
                    >
                        <ha-icon icon="mdi:close"></ha-icon>
                    </div>
                </div>
            `})}_renderResizeHandles(){const e=this.columns.slice(0,-1).map((a,r)=>{const i=T(E(this.columns[r]))&&T(E(this.columns[r+1]));return u`
                <div
                    class="resize-handle rh-col ${i?"":"disabled"}"
                    id="rhc-${r}"
                    @pointerdown=${i?o=>this._resizePointerDown(o,"col",r):_}
                    title="${i?"Drag to resize":"Non-resizable track (clamp/minmax)"}"
                >
                    <button class="insert-btn" title="Insert column here"
                        @pointerdown=${o=>o.stopPropagation()}
                        @click=${o=>{o.stopPropagation(),this._insertTrackAt("col",r+1)}}
                    >+</button>
                </div>
            `}),t=this.rows.slice(0,-1).map((a,r)=>{const i=T(E(this.rows[r]))&&T(E(this.rows[r+1]));return u`
                <div
                    class="resize-handle rh-row ${i?"":"disabled"}"
                    id="rhr-${r}"
                    @pointerdown=${i?o=>this._resizePointerDown(o,"row",r):_}
                    title="${i?"Drag to resize":"Non-resizable track"}"
                >
                    <button class="insert-btn" title="Insert row here"
                        @pointerdown=${o=>o.stopPropagation()}
                        @click=${o=>{o.stopPropagation(),this._insertTrackAt("row",r+1)}}
                    >+</button>
                </div>
            `});return[...e,...t]}_insertTrackAt(e,t){const{grid2d:a,columns:r,rows:i}=B(this.areas,this.columns,this.rows,e,t,"1fr");this._emitGridState(r,i,a)}_renderAreaOverlays(){const e=N(this.areas),t=$((l,d=18)=>u`<svg viewBox="0 0 24 24" width="${d}" height="${d}" fill="currentColor" aria-hidden="true"><path d="${l}"/></svg>`,"ico"),a="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z",r="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z",i="M8 13C6.14 13 4.59 14.28 4.14 16H2V18H4.14C4.59 19.72 6.14 21 8 21S11.41 19.72 11.86 18H22V16H11.86C11.41 14.28 9.86 13 8 13M8 19C6.9 19 6 18.1 6 17C6 15.9 6.9 15 8 15S10 15.9 10 17C10 18.1 9.1 19 8 19M19.86 6C19.41 4.28 17.86 3 16 3S12.59 4.28 12.14 6H2V8H12.14C12.59 9.72 14.14 11 16 11S19.41 9.72 19.86 8H22V6H19.86M16 9C14.9 9 14 8.1 14 7C14 5.9 14.9 5 16 5S18 5.9 18 7C18 8.1 17.1 9 16 9Z",o="M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19M8,9H16V19H8V9M15.5,4L14.5,3H9.5L8.5,4H5V6H19V4H15.5Z",s="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z",n="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z";return e.map(l=>{const d=this._selectedArea===l,p=this._renaming===l,{bg:c}=ne(l),v=p?u`
                    <input class="aab-rename-input"
                        .value=${l}
                        placeholder="area-name"
                        @keydown=${h=>{h.stopPropagation(),h.key==="Enter"&&this._commitRenameFromBar(l,h.target.value),h.key==="Escape"&&(this._renaming=null)}}
                        @blur=${h=>{this._renaming===l&&this._commitRenameFromBar(l,h.target.value)}}
                    >
                    <button class="aab-btn aab-rename-confirm" title="Confirm rename"
                        @click=${h=>{h.stopPropagation();const g=h.currentTarget.previousElementSibling;g&&this._commitRenameFromBar(l,g.value)}}>${t(s,16)}</button>
                    <button class="aab-btn" title="Cancel rename"
                        @click=${h=>{h.stopPropagation(),this._renaming=null}}
                    >${t(n,16)}</button>
                  `:u`
                    <button class="aab-btn" title="Rename area"
                        @click=${h=>{h.stopPropagation(),this._startBarRename(l)}}
                    >${t(a)}</button>
                    <button class="aab-btn" title="Add card to area"
                        @click=${h=>{h.stopPropagation(),this._addCardToArea(l)}}
                    >${t(r)}</button>
                    <div class="aab-sep"></div>
                    <button class="aab-btn" title="Area background, border &amp; spacing"
                        @click=${h=>{h.stopPropagation(),this._openAreaSettings(l)}}
                    >${t(i)}</button>
                    <button class="aab-btn danger" title="Delete area (and its cards)"
                        @click=${h=>{h.stopPropagation(),this._deleteArea(l)}}
                    >${t(o)}</button>
                  `;return u`
                <div
                    class="area-overlay ${d?"selected":""} ${p?"renaming":""}"
                    id="ao-${l}"
                    style="display:none; background: color-mix(in oklab, ${c} ${this._overlayOpacity}%, transparent);"
                    @click=${h=>{h.stopPropagation(),this._selectArea(l)}}
                >
                    <div class="area-label">${l}</div>
                    <div class="area-action-bar" @click=${h=>h.stopPropagation()}>
                        ${v}
                    </div>
                </div>
            `})}_renderCellTargets(){var t;const e=[];for(let a=0;a<this.rows.length;a++)for(let r=0;r<this.columns.length;r++){if(((t=this.areas[a])==null?void 0:t[r])!==".")continue;const o=this._isCellInSel(a,r);e.push(u`
                    <div
                        class="cell-target ${o?"in-sel":""}"
                        id="ct-${a}-${r}"
                        data-r="${a}" data-c="${r}"
                        style="display:none;"
                        @pointerdown=${s=>this._cellPointerDown(s,a,r)}
                    >
                        <button
                            class="cell-add-btn"
                            title="Create area here"
                            @click=${s=>{s.stopPropagation(),this._createSingleCellArea(a,r)}}
                        >
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/></svg>
                            <span>Create area</span>
                        </button>
                    </div>
                `)}return e}_renderNamePopup(){return u`
            <div class="name-popup" id="name-popup" style="display:none;">
                <div class="name-popup-title">Name this area</div>
                <ha-input
                    .value=${this._selectionName}
                    placeholder="area-name"
                    @input=${e=>{this._selectionName=e.target.value}}
                    @keydown=${this._nameInputKeydown}
                    autofocus
                ></ha-input>
                <div class="name-popup-actions">
                    <ha-button @click=${this._cancelSelection}>Cancel</ha-button>
                    <ha-button unelevated @click=${this._confirmSelection}>Create</ha-button>
                </div>
            </div>
        `}_positionColumnHeaders(){var a,r,i;const e=this._cells;if(!e.length||!((a=e[0])!=null&&a.length))return;for(let o=0;o<this.columns.length;o++){const s=this._qh(`#ch-${o}`);if(!s)continue;const n=(r=e[0])==null?void 0:r[o];n&&(s.style.left=`${n.left}px`,s.style.width=`${n.width}px`,s.style.height=`${w}px`,s.style.top=`${n.top}px`,s.classList.toggle("edge-start",o===0),s.classList.toggle("edge-end",o===this.columns.length-1))}const t=(i=e[0])==null?void 0:i[this.columns.length-1];if(t){const o=this._qh(".add-col-btn");o&&(o.style.left=`${t.right+4}px`,o.style.top=`${t.top}px`)}}_positionRowHeaders(){var a,r;const e=this._cells;if(!e.length)return;for(let i=0;i<this.rows.length;i++){const o=this._qh(`#rh-${i}`);if(!o)continue;const s=(a=e[i])==null?void 0:a[0];s&&(o.style.top=`${s.top}px`,o.style.height=`${s.height}px`,o.style.width=`${w}px`,o.style.left=`${s.left}px`,o.classList.toggle("edge-start",i===0),o.classList.toggle("edge-end",i===this.rows.length-1))}const t=(r=e[this.rows.length-1])==null?void 0:r[0];if(t){const i=this._qh(".add-row-btn");i&&(i.style.top=`${t.bottom+4}px`,i.style.left=`${t.left}px`)}}_positionResizeHandles(){var c,v,h,g,b,k,y,C,S,z;const e=this._cells;if(!e.length)return;const t=this.rows.length-1,a=this.columns.length-1,r=(c=e[0])==null?void 0:c[0],i=(v=e[t])==null?void 0:v[0],o=(h=e[0])==null?void 0:h[0],s=(g=e[0])==null?void 0:g[a],n=(r==null?void 0:r.top)??0,l=(i==null?void 0:i.bottom)??0,d=(o==null?void 0:o.left)??0,p=(s==null?void 0:s.right)??0;for(let f=0;f<this.columns.length-1;f++){const m=this._qh(`#rhc-${f}`);if(!m)continue;const R=(b=e[0])==null?void 0:b[f],D=(k=e[0])==null?void 0:k[f+1];if(!R||!D)continue;const L=(R.right+D.left)/2-P/2;m.style.display="block",m.style.left=`${L}px`,m.style.width=`${P}px`,m.style.top=`${n}px`,m.style.bottom=`${((y=this._overlayRect)==null?void 0:y.height)-l}px`}for(let f=0;f<this.rows.length-1;f++){const m=this._qh(`#rhr-${f}`);if(!m)continue;const R=(C=e[f])==null?void 0:C[0],D=(S=e[f+1])==null?void 0:S[0];if(!R||!D)continue;const L=(R.bottom+D.top)/2-P/2;m.style.display="block",m.style.top=`${L}px`,m.style.height=`${P}px`,m.style.left=`${d}px`,m.style.right=`${((z=this._overlayRect)==null?void 0:z.width)-p}px`}}_positionAreaOverlays(){var t,a;const e=this._cells;if(e.length)for(const r of N(this.areas)){const i=this._qh(`#ao-${r}`);if(!i)continue;const o=Z(this.areas,r);if(!o)continue;const{r1:s,c1:n,r2:l,c2:d}=o,p=(t=e[s])==null?void 0:t[n],c=(a=e[l-1])==null?void 0:a[d-1];!p||!c||(i.style.display="block",i.style.left=`${p.left}px`,i.style.top=`${p.top}px`,i.style.width=`${c.right-p.left}px`,i.style.height=`${c.bottom-p.top}px`)}}_positionCellTargets(){var t,a;const e=this._cells;if(e.length)for(let r=0;r<this.rows.length;r++)for(let i=0;i<this.columns.length;i++){if(((t=this.areas[r])==null?void 0:t[i])!==".")continue;const o=this._qh(`#ct-${r}-${i}`);if(!o)continue;const s=(a=e[r])==null?void 0:a[i];s&&(o.style.display="block",o.style.left=`${s.left}px`,o.style.top=`${s.top}px`,o.style.width=`${s.width}px`,o.style.height=`${s.height}px`)}}_positionSelectionRect(){var v,h;if(!this._selStart||!this._selEnd)return;const e=this._cells;if(!e.length)return;const{r:t,c:a}=this._selStart,{r,c:i}=this._selEnd,o=Math.min(t,r),s=Math.max(t,r),n=Math.min(a,i),l=Math.max(a,i),d=(v=e[o])==null?void 0:v[n],p=(h=e[s])==null?void 0:h[l];if(!d||!p)return;const c=this._qh("#sel-rect");c&&(c.style.left=`${d.left}px`,c.style.top=`${d.top}px`,c.style.width=`${p.right-d.left}px`,c.style.height=`${p.bottom-d.top}px`)}_positionNamePopup(){var k,y,C,S;if(!this._showNameInput||!this._selStart||!this._selEnd)return;const e=this._cells;if(!e.length)return;const{r:t,c:a}=this._selStart,{r,c:i}=this._selEnd,o=Math.min(t,r),s=Math.max(t,r),n=Math.min(a,i),l=Math.max(a,i),d=(k=e[o])==null?void 0:k[n],p=(y=e[s])==null?void 0:y[l];if(!d||!p)return;const c=this._qh("#name-popup");if(!c)return;c.style.display="flex";const v=d.left+(p.right-d.left)/2,h=d.top+(p.bottom-d.top)/2,g=220,b=130;c.style.left=`${Math.max(4,Math.min(v-g/2,(((C=this._overlayRect)==null?void 0:C.width)??800)-g-4))}px`,c.style.top=`${Math.max(4,Math.min(h-b/2,(((S=this._overlayRect)==null?void 0:S.height)??600)-b-4))}px`,requestAnimationFrame(()=>{var z;return(z=c.querySelector("ha-input"))==null?void 0:z.focus()})}_positionSettingsPanel(){if(!this._showSettings)return;const e=this._qh(".settings-panel"),t=this._qh("#toolbar");if(!e||!t)return;const a=t.getBoundingClientRect(),r=this._overlayRect??this.getBoundingClientRect(),i=e.offsetWidth||240;let o=a.left-r.left,s=a.bottom-r.top+8;o=Math.max(4,Math.min(o,(r.width??800)-i-4)),s=Math.max(4,s),e.style.left=`${o}px`,e.style.top=`${s}px`,e.style.right="auto",e.style.bottom="auto"}_editTrack(e,t){this._editingTrack={axis:e,index:t},this.updateComplete.then(()=>{var r;const a=e==="col"?`#ch-${t} input`:`#rh-${t} input`;(r=this._qh(a))==null||r.focus()})}_trackInputKeydown(e,t,a){e.key==="Enter"&&e.target.blur(),e.key==="Escape"&&(this._editingTrack=null)}_commitTrack(e,t,a){this._editingTrack=null;const r=a==null?void 0:a.trim();if(!r)return;const i=e==="col"?[...this.columns]:[...this.rows];i[t]=r,this._emitGridState(e==="col"?i:this.columns,e==="row"?i:this.rows)}_addTrack(e){const{grid2d:t,columns:a,rows:r}=B(this.areas,this.columns,this.rows,e,e==="col"?this.columns.length:this.rows.length,"1fr");this._emitGridState(a,r,t)}async _deleteTrack(e,t){if(e==="col"&&this.columns.length<=1||e==="row"&&this.rows.length<=1)return;const a=e==="col"?`column ${t+1}`:`row ${t+1}`;if(!await O({title:`Delete ${a}?`,message:`Removing this ${e==="col"?"column":"row"} will resize the grid and delete any areas (and the cards inside them) that fit only within it. This cannot be undone.`}))return;const{grid2d:i,columns:o,rows:s}=K(this.areas,this.columns,this.rows,e,t);this._emitGridState(o,s,i)}_headerPointerDown(e,t,a){e.target.tagName==="INPUT"||e.target.closest(".del-btn")||(e.stopPropagation(),e.currentTarget.setPointerCapture(e.pointerId),this._reorderDrag={axis:t,fromIndex:a,currentIndex:a},this._reorderStart={x:e.clientX,y:e.clientY},this._reorderMoved=false,this._updateDragChip(e.clientX,e.clientY))}_consumeReorderClick(){return this._suppressClick?(this._suppressClick=false,true):false}_updateDragChip(e,t){const a=this._qh("#drag-chip");if(!a||!this._reorderDrag)return;const{axis:r,fromIndex:i,currentIndex:o}=this._reorderDrag,s=r==="col"?"Col":"Row";a.textContent=o!==i?`${s} ${i+1} → ${o+1}`:`${s} ${i+1}`;const n=this._overlayRect??this.getBoundingClientRect();a.style.left=`${e-n.left+14}px`,a.style.top=`${t-n.top+14}px`,a.style.display="block"}_hideDragChip(){const e=this._qh("#drag-chip");e&&(e.style.display="none")}_reorderMove(e){var p,c,v,h;if(!this._reorderDrag)return;const{axis:t,fromIndex:a}=this._reorderDrag,r=this._cells;if(!r.length)return;if(!this._reorderMoved&&this._reorderStart){const g=e.clientX-this._reorderStart.x,b=e.clientY-this._reorderStart.y;g*g+b*b>16&&(this._reorderMoved=true)}const i=((p=this._overlayRect)==null?void 0:p.left)??0,o=((c=this._overlayRect)==null?void 0:c.top)??0,s=t==="col"?e.clientX-i:e.clientY-o,n=t==="col"?this.columns.length:this.rows.length;let l=this._reorderDrag.currentIndex,d=1/0;for(let g=0;g<n;g++){const b=t==="col"?(v=r[0])==null?void 0:v[g]:(h=r[g])==null?void 0:h[0];if(!b)continue;const k=t==="col"?(b.left+b.right)/2:(b.top+b.bottom)/2,y=Math.abs(s-k);y<d&&(d=y,l=g)}l!==this._reorderDrag.currentIndex&&(this._reorderDrag={...this._reorderDrag,currentIndex:l},this._reorderPreview={axis:t,from:a,to:l},this.requestUpdate()),this._updateDragChip(e.clientX,e.clientY)}_reorderUp(e){if(!this._reorderDrag)return;const{axis:t,fromIndex:a,currentIndex:r}=this._reorderDrag;if(this._reorderDrag=null,this._reorderPreview=null,this._hideDragChip(),this._reorderMoved&&(this._suppressClick=true,setTimeout(()=>{this._suppressClick=false},0)),this._reorderMoved=false,a===r){this.requestUpdate();return}const i=t==="col"?this.columns:this.rows,o=F(this.areas,i,t,a,r);if(!o.safe){M.warn(`[GridEditOverlay] Reorder blocked by: ${o.blockedBy}`),this.requestUpdate();return}this._emitGridState(t==="col"?o.tracks:this.columns,t==="row"?o.tracks:this.rows,o.grid2d)}_resizePointerDown(e,t,a){e.stopPropagation(),e.currentTarget.setPointerCapture(e.pointerId),e.currentTarget.classList.add("active");const r=this._qh("#ghost-grid"),i=t==="col"?(r==null?void 0:r.clientWidth)??800:(r==null?void 0:r.clientHeight)??600;this._resizeDrag={axis:t,index:a,startPos:t==="col"?e.clientX:e.clientY,origTracks:t==="col"?[...this.columns]:[...this.rows],containerPx:i,el:e.currentTarget}}_resizeMove(e){if(!this._resizeDrag)return;const{axis:t,index:a,startPos:r,origTracks:i,containerPx:o}=this._resizeDrag,s=(t==="col"?e.clientX:e.clientY)-r,n=W(i,a,s,o,this.gap);this._resizeDrag._pendingTracks=n;const l=this._qh("#ghost-grid");if(l){const d=t==="col"?"gridTemplateColumns":"gridTemplateRows";l.style[d]=n.join(" ")}this.dispatchEvent(new CustomEvent("grid-preview-changed",{detail:{columns:t==="col"?n:this.columns,rows:t==="row"?n:this.rows,gap:this.gap},bubbles:false})),this._scheduleMeasure()}_resizeUp(e){if(!this._resizeDrag)return;const{axis:t,_pendingTracks:a,el:r}=this._resizeDrag;if(this._resizeDrag=null,r==null||r.classList.remove("active"),!a)return;const i=this._qh("#ghost-grid");i&&(i.style.gridTemplateColumns="",i.style.gridTemplateRows=""),this._emitGridState(t==="col"?a:this.columns,t==="row"?a:this.rows)}_selectArea(e){this._selectedArea=e===this._selectedArea?null:e,this._renaming=null,this._editingTrack=null}_startBarRename(e){this._renaming=e,this.updateComplete.then(()=>{var t;(t=this._qh(`#ao-${e} .aab-rename-input`))==null||t.select()})}_commitRenameFromBar(e,t){this._renaming=null;const a=t==null?void 0:t.trim();a&&a!==e&&this._commitRename(e,a)}_commitRename(e,t){const a=t==null?void 0:t.trim();if(!a||a===e)return;if(!/^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(a)){M.warn(`[GridEditOverlay] Invalid area name: ${a}`);return}const r=J(this.areas,e,a),i=(this.cardConfigs??[]).map(o=>{var s;return((s=o==null?void 0:o.view_layout)==null?void 0:s["grid-area"])===e?{...o,view_layout:{...o.view_layout,"grid-area":a}}:o});this._selectedArea=a,this._areaSettings===e&&(this._areaSettings=a),this.dispatchEvent(new CustomEvent("area-renamed",{detail:{from:e,to:a},bubbles:false})),this._emitGridState(this.columns,this.rows,r),this._emitAreaCards(i)}async _deleteArea(e){if(!await O({title:`Delete area "${e}"?`,message:"This will remove the area and all cards placed inside it.",confirmText:"Delete"}))return;const a=Q(this.areas,e),r=(this.cardConfigs??[]).filter(i=>{var o;return((o=i==null?void 0:i.view_layout)==null?void 0:o["grid-area"])!==e});this._selectedArea=null,this._areaSettings===e&&(this._areaSettings=null),this._emitGridState(this.columns,this.rows,a),this._emitAreaCards(r)}_openAreaSettings(e){this._selectedArea=e;const t=this.getBoundingClientRect(),a=this._qh(`#ao-${e}`),r=a==null?void 0:a.getBoundingClientRect(),i=360,o=10;if(r){let s=r.right-t.left+o;s+i>t.width-4&&(s=r.left-t.left-i-o),s=Math.max(4,Math.min(s,t.width-i-4));const n=Math.max(4,Math.min(r.top-t.top,t.height-220));this._areaPanelAnchor={top:n,left:s}}else this._areaPanelAnchor={top:60,left:16};this._areaPanelPos=null,this._areaSettings=e}_updateAreaSetting(e,t,a){this.dispatchEvent(new CustomEvent("area-settings-changed",{detail:{name:e,key:t,value:a},bubbles:false}))}_areaPanelDragStart(e){var i,o;e.stopPropagation();const t=this._qh(".area-panel"),a=t==null?void 0:t.getBoundingClientRect(),r=this.getBoundingClientRect();(o=(i=e.currentTarget).setPointerCapture)==null||o.call(i,e.pointerId),this._areaPanelDrag={offsetX:e.clientX-((a==null?void 0:a.left)??0),offsetY:e.clientY-((a==null?void 0:a.top)??0),oLeft:r.left,oTop:r.top},t==null||t.classList.add("dragging")}_areaPanelDragMove(e){if(!this._areaPanelDrag)return;const{offsetX:t,offsetY:a,oLeft:r,oTop:i}=this._areaPanelDrag;this._areaPanelPos={left:e.clientX-r-t,top:e.clientY-i-a}}_areaPanelDragEnd(e){var t;this._areaPanelDrag&&(this._areaPanelDrag=null,(t=this._qh(".area-panel"))==null||t.classList.remove("dragging"))}_renderAreaSettingsPanel(){var i,o,s;const e=this._areaSettings,t=((o=(i=this.layout)==null?void 0:i.areas)==null?void 0:o[e])??{},a=this._areaPanelPos??this._areaPanelAnchor??{top:60,left:16},r=$((n,l)=>this._updateAreaSetting(e,n,l),"set");return u`
            <div class="area-panel" style="top:${a.top}px; left:${a.left}px;" @click=${n=>n.stopPropagation()}>
                <div class="ap-header">
                    <div class="drag-grip" @pointerdown=${this._areaPanelDragStart} title="Drag to move">
                        <ha-icon icon="mdi:drag"></ha-icon>
                    </div>
                    <div class="ap-title">Area: ${e}</div>
                    <button class="ap-close" title="Close" @click=${()=>{this._areaSettings=null}}>×</button>
                </div>
                <div class="ap-body">
                    <lcards-form-section header="Surface" icon="mdi:palette-outline" ?expanded=${false} ?outlined=${true}>
                        <div class="ap-field">
                            <label>Background</label>
                            <lcards-color-picker
                                .hass=${this.hass}
                                .value=${t.background??""}
                                ?showPreview=${true}
                                ?showBuilder=${true}
                                @value-changed=${n=>r("background",n.detail.value||void 0)}
                            ></lcards-color-picker>
                        </div>
                        <div class="ap-field">
                            <label>Image</label>
                            <ha-input
                                .value=${t["background-image"]??""}
                                placeholder="url(...) or linear-gradient(...)"
                                @change=${n=>r("background-image",n.target.value||void 0)}
                            ></ha-input>
                        </div>
                        ${t["background-image"]?u`
                            <div class="ap-field">
                                <label>Fit</label>
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{select:{mode:"dropdown",options:ie}}}
                                    .value=${t["background-size"]??"cover"}
                                    @value-changed=${n=>r("background-size",n.detail.value==="cover"?void 0:n.detail.value)}
                                ></ha-selector>
                            </div>
                            <div class="ap-field">
                                <label>Position</label>
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{select:{mode:"dropdown",options:oe}}}
                                    .value=${t["background-position"]??"center"}
                                    @value-changed=${n=>r("background-position",n.detail.value==="center"?void 0:n.detail.value)}
                                ></ha-selector>
                            </div>
                            <div class="ap-field">
                                <label>Repeat</label>
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{select:{mode:"dropdown",options:se}}}
                                    .value=${t["background-repeat"]??"no-repeat"}
                                    @value-changed=${n=>r("background-repeat",n.detail.value==="no-repeat"?void 0:n.detail.value)}
                                ></ha-selector>
                            </div>
                        `:_}
                        <div class="ap-field">
                            <label>Border color</label>
                            <lcards-color-picker
                                .hass=${this.hass}
                                .value=${t["border-color"]??""}
                                ?showPreview=${true}
                                ?showBuilder=${true}
                                @value-changed=${n=>r("border-color",n.detail.value||void 0)}
                            ></lcards-color-picker>
                        </div>
                        <div class="ap-field">
                            <label>Border</label>
                            <div class="ap-inline">
                                <ha-input
                                    .value=${t["border-width"]??""}
                                    placeholder="2px"
                                    title="Border width"
                                    @change=${n=>r("border-width",n.target.value||void 0)}
                                ></ha-input>
                                <ha-selector
                                    .hass=${this.hass}
                                    .selector=${{select:{mode:"dropdown",options:ae}}}
                                    .value=${t["border-style"]??"none"}
                                    @value-changed=${n=>r("border-style",n.detail.value==="none"?void 0:n.detail.value)}
                                ></ha-selector>
                            </div>
                        </div>
                        <div class="ap-field">
                            <label>Radius</label>
                            <ha-input
                                .value=${t["border-radius"]??""}
                                placeholder="0"
                                title="Corner radius (e.g. 12px, var(--ha-border-radius-lg))"
                                @change=${n=>r("border-radius",n.target.value||void 0)}
                            ></ha-input>
                        </div>
                    </lcards-form-section>

                    <lcards-form-section header="Placement" icon="mdi:move-resize" ?expanded=${false} ?outlined=${true}>
                        <div class="ap-field">
                            <label>Align ↕</label>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select:{mode:"dropdown",options:te}}}
                                .value=${t["align-self"]??t["place-self"]??"stretch"}
                                @value-changed=${n=>{const l=n.detail.value,d=t["justify-self"]??t["place-self"]??"stretch";r("place-self",void 0),r("align-self",l==="stretch"?void 0:l),r("justify-self",d==="stretch"?void 0:d)}}
                            ></ha-selector>
                        </div>
                        <div class="ap-field">
                            <label>Align ↔</label>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select:{mode:"dropdown",options:re}}}
                                .value=${t["justify-self"]??t["place-self"]??"stretch"}
                                @value-changed=${n=>{const l=t["align-self"]??t["place-self"]??"stretch",d=n.detail.value;r("place-self",void 0),r("align-self",l==="stretch"?void 0:l),r("justify-self",d==="stretch"?void 0:d)}}
                            ></ha-selector>
                        </div>
                        <div class="ap-field">
                            <label>Inset</label>
                            <ha-input
                                .value=${t.margin??""}
                                placeholder=${((s=this.layout)==null?void 0:s.card_margin)??"none"}
                                title="Space around the card within the area (margin)"
                                @change=${n=>r("margin",n.target.value||void 0)}
                            ></ha-input>
                        </div>
                        <div class="ap-field">
                            <label>Overflow X</label>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select:{mode:"dropdown",options:V}}}
                                .value=${t["overflow-x"]??t.overflow??"visible"}
                                @value-changed=${n=>{const l=n.detail.value,d=t["overflow-y"]??t.overflow??"visible";r("overflow",void 0),r("overflow-x",l==="visible"?void 0:l),r("overflow-y",d==="visible"?void 0:d)}}
                            ></ha-selector>
                        </div>
                        <div class="ap-field">
                            <label>Overflow Y</label>
                            <ha-selector
                                .hass=${this.hass}
                                .selector=${{select:{mode:"dropdown",options:V}}}
                                .value=${t["overflow-y"]??t.overflow??"visible"}
                                @value-changed=${n=>{const l=t["overflow-x"]??t.overflow??"visible",d=n.detail.value;r("overflow",void 0),r("overflow-x",l==="visible"?void 0:l),r("overflow-y",d==="visible"?void 0:d)}}
                            ></ha-selector>
                        </div>
                        <div class="ap-field">
                            <label>Layer (z)</label>
                            <ha-input
                                type="number"
                                .value=${t["z-index"]??""}
                                placeholder="0"
                                title="Stacking order of this area's backing surface"
                                @change=${n=>r("z-index",n.target.value===""?void 0:Number(n.target.value))}
                            ></ha-input>
                        </div>
                    </lcards-form-section>

                    <div class="ap-actions">
                        <ha-button @click=${()=>{this._areaSettings=null}}>Done</ha-button>
                    </div>
                </div>
            </div>
        `}_renderAreaCardList(e){const t=(this.cardConfigs??[]).map((a,r)=>({c:a,i:r})).filter(({c:a})=>{var r;return((r=a==null?void 0:a.view_layout)==null?void 0:r["grid-area"])===e});return t.length?u`
            <div class="card-list" @click=${a=>a.stopPropagation()}>
                ${t.map(({c:a,i:r})=>{const i=(a.type??"").replace("custom:","");return u`
                        <div class="card-row">
                            <span class="card-type" title="${a.type}">${i}</span>
                            <ha-icon-button
                                class="danger"
                                .label=${"Remove card"}
                                title="Remove card from area"
                                @click=${o=>{o.stopPropagation(),this._deleteCardFromArea(r)}}
                            ><ha-icon icon="mdi:close"></ha-icon></ha-icon-button>
                        </div>
                    `})}
            </div>
        `:_}async _deleteCardFromArea(e){const t=(this.cardConfigs??[])[e],a=((t==null?void 0:t.type)??"card").replace("custom:","");if(!await O({title:"Remove card?",message:`Remove the "${a}" card from this area? This cannot be undone.`,confirmText:"Remove"}))return;const i=[...this.cardConfigs??[]];i.splice(e,1),this._emitAreaCards(i)}_addCardToArea(e){const t=(this.cardConfigs??[]).filter(a=>{var r;return((r=a==null?void 0:a.view_layout)==null?void 0:r["grid-area"])===e});t.length>0&&M.info(`[GridEditOverlay] Area "${e}" already has ${t.length} card(s). Use vertical-stack to group multiple cards.`),this.dispatchEvent(new CustomEvent("add-card-to-area",{detail:{areaName:e},bubbles:true,composed:true}))}_cellPointerDown(e,t,a){this._showNameInput||(e.stopPropagation(),this._selStart={r:t,c:a},this._selEnd={r:t,c:a},this._selDrag=true,this._selMoved=false,this._selectedArea=null)}_selMove(e){var a;if(!this._selDrag)return;const t=this._cellAtPoint(e.clientX,e.clientY);if(t&&((a=this.areas[t.r])==null?void 0:a[t.c])==="."&&(t.r!==this._selEnd.r||t.c!==this._selEnd.c)){this._selEnd=t,this._selMoved=this._selMoved||t.r!==this._selStart.r||t.c!==this._selStart.c,this._positionSelectionRect();for(let r=0;r<this.rows.length;r++)for(let i=0;i<this.columns.length;i++){const o=this._qh(`#ct-${r}-${i}`);o&&o.classList.toggle("in-sel",this._isCellInSel(r,i))}}}_selUp(e){this._selDrag&&(this._selDrag=false,this._selMoved&&this._selStart&&this._selEnd?(this._showNameInput=true,this._selectionName="",this.requestUpdate()):(this._selStart=null,this._selEnd=null,this.requestUpdate()))}_createSingleCellArea(e,t){this._selStart={r:e,c:t},this._selEnd={r:e,c:t},this._showNameInput=true,this._selectionName="",this.requestUpdate()}_isCellInSel(e,t){if(!this._selStart||!this._selEnd)return false;const{r:a,c:r}=this._selStart,{r:i,c:o}=this._selEnd;return e>=Math.min(a,i)&&e<=Math.max(a,i)&&t>=Math.min(r,o)&&t<=Math.max(r,o)}_nameInputKeydown(e){e.key==="Enter"&&this._confirmSelection(),e.key==="Escape"&&this._cancelSelection()}_confirmSelection(){var n;const e=(n=this._selectionName)==null?void 0:n.trim();if(!e||!/^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(e)){this._cancelSelection();return}const{r:t,c:a}=this._selStart,{r,c:i}=this._selEnd,o={r1:Math.min(t,r),c1:Math.min(a,i),r2:Math.max(t,r)+1,c2:Math.max(a,i)+1},s=ee(this.areas,o,e);if(!s.ok){M.warn(`[GridEditOverlay] Cannot create area: ${s.error}`);return}this._selStart=null,this._selEnd=null,this._showNameInput=false,this._selectedArea=e,this._emitGridState(this.columns,this.rows,s.grid2d)}_cancelSelection(){this._selStart=null,this._selEnd=null,this._showNameInput=false,this._selectionName=""}_emitGridState(e,t,a,r){this.dispatchEvent(new CustomEvent("grid-state-changed",{detail:{columns:e??this.columns,rows:t??this.rows,areas:a??this.areas,gap:r??this.gap},bubbles:false}))}_emitAreaCards(e){this.dispatchEvent(new CustomEvent("area-cards-changed",{detail:{cards:e},bubbles:false}))}};$(A,"LCARdSGridEditOverlay"),I(A,"properties",{hass:{attribute:false},columns:{attribute:false},rows:{attribute:false},areas:{attribute:false},gap:{attribute:false},measureColumns:{attribute:false},measureRows:{attribute:false},cardConfigs:{attribute:false},layout:{attribute:false},hideCardMode:{attribute:false},hideSettings:{attribute:false},_selectedArea:{state:true},_renaming:{state:true},_trackPopover:{state:true},_selStart:{state:true},_selEnd:{state:true},_selectionName:{state:true},_showNameInput:{state:true},_showSettings:{state:true},_reorderPreview:{state:true},_toolbarPos:{state:true},_areaSettings:{state:true},_areaPanelPos:{state:true},_overlayOpacity:{state:true},_headerOpacity:{state:true}}),I(A,"styles",X`
        :host {
            display: block;
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 100;
        }

        /* ─── Ghost grid (measurement only) ──────────────────────────────── */
        /* Top/left padding reserves a gutter for the column/row headers so the
           ghost cells line up with the real #grid-root cells (which the view
           pads by the same amount during grid editing). */
        #ghost-grid {
            position: absolute;
            inset: 0;
            display: grid;
            opacity: 0;
            pointer-events: none;
            box-sizing: border-box;
            padding: 0;
        }
        .gc { min-width: 0; min-height: 0; }

        /* ─── Toolbar (floating, draggable) ───────────────────────────────── */
        .toolbar {
            position: absolute;
            top: 12px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 200;
            pointer-events: auto;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 14px;
            background: color-mix(in oklab, var(--card-background-color, rgba(0,0,0,.6)) 88%, transparent);
            backdrop-filter: blur(12px) saturate(1.1);
            border: var(--ha-border-width-sm, 1px) solid color-mix(in oklab, var(--divider-color, rgba(255,255,255,.1)) 60%, transparent);
            border-radius: var(--ha-border-radius-pill, 9999px);
            box-shadow: 0 4px 16px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.07);
            white-space: nowrap;
        }
        .toolbar.dragging { transition: none; cursor: grabbing; }
        .drag-grip {
            display: flex;
            align-items: center;
            cursor: grab;
            color: var(--secondary-text-color);
            --mdc-icon-size: 18px;
            padding: 0 2px;
            opacity: 0.6;
        }
        .drag-grip:hover { opacity: 1; }
        .toolbar-label {
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: var(--primary-text-color);
            padding: 0 2px;
        }
        .t-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 36px;
            min-width: 36px;
            padding: 0 12px;
            gap: 5px;
            border: none;
            border-radius: var(--ha-border-radius-pill, 9999px);
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            background: rgba(255,255,255,.08);
            color: var(--primary-text-color);
            transition: background var(--ha-animation-duration-fast,.15s), transform .08s ease;
            pointer-events: auto;
        }
        .t-btn:hover { background: rgba(255,255,255,.14); transform: translateY(-1px); }
        .t-btn ha-icon { --mdc-icon-size: 16px; }
        .t-btn.primary {
            background: var(--lcars-ui-primary, var(--primary-color));
            color: var(--text-primary-color, #fff);
        }
        .t-btn.primary:hover { filter: brightness(1.1); }
        .t-sep {
            width: 1px;
            height: 20px;
            background: var(--divider-color, rgba(255,255,255,.12));
            margin: 0 2px;
        }
        /* Opacity slider — sits in the toolbar next to the Areas/Cells toggle */
        .t-opacity {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 0 4px;
            color: var(--secondary-text-color);
            --mdc-icon-size: 15px;
        }
        .t-opacity ha-icon { opacity: 0.7; flex-shrink: 0; }
        .t-opacity input[type=range] {
            width: 72px;
            height: 4px;
            cursor: pointer;
            appearance: none;
            -webkit-appearance: none;
            background: linear-gradient(
                to right,
                var(--lcars-ui-primary, var(--primary-color)) 0%,
                var(--lcars-ui-primary, var(--primary-color)) var(--pct, 50%),
                rgba(255,255,255,.18) var(--pct, 50%)
            );
            border-radius: 2px;
            outline: none;
        }
        .t-opacity input[type=range]::-webkit-slider-thumb {
            appearance: none;
            -webkit-appearance: none;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: var(--lcars-ui-primary, var(--primary-color));
            border: 2px solid var(--card-background-color, #111);
            box-shadow: 0 1px 4px rgba(0,0,0,.4);
        }
        .t-opacity input[type=range]::-moz-range-thumb {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: var(--lcars-ui-primary, var(--primary-color));
            border: 2px solid var(--card-background-color, #111);
        }

        /* ─── Column headers ──────────────────────────────────────────────── */
        .col-header {
            position: absolute;
            height: ${w}px;
            top: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: auto;
            cursor: grab;
            user-select: none;
            background: color-mix(in oklab, var(--card-background-color, rgba(0,0,0,.5)) 75%, transparent);
            backdrop-filter: blur(8px);
            border: var(--ha-border-width-sm, 1px) solid color-mix(in oklab, var(--divider-color) 50%, transparent);
            border-radius: var(--ha-border-radius-sm, 4px) var(--ha-border-radius-sm, 4px) 0 0;
            box-sizing: border-box;
            overflow: hidden;
            opacity: var(--lcards-header-opacity, 0.2);
            transition: background var(--ha-animation-duration-fast,.15s), opacity var(--ha-animation-duration-fast,.15s), transform var(--ha-animation-duration-fast,.15s);
            transform-origin: center top;
            z-index: 30;
        }
        .col-header:hover { opacity: 1; transform: scaleX(1.25) scaleY(1.1); z-index: 40; background: color-mix(in oklab, var(--lcars-ui-primary, var(--primary-color)) 20%, var(--card-background-color, rgba(0,0,0,.5))); }
        .col-header.edge-start { transform-origin: left top; }
        .col-header.edge-end   { transform-origin: right top; }
        .col-header.dragging { opacity: 0.5; cursor: grabbing; }
        .col-header.drop-target { opacity: 1; background: color-mix(in oklab, var(--lcars-ui-primary, var(--primary-color)) 35%, transparent); }

        /* ─── Row headers ─────────────────────────────────────────────────── */
        .row-header {
            position: absolute;
            width: ${w}px;
            left: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: auto;
            cursor: grab;
            user-select: none;
            writing-mode: vertical-rl;
            background: color-mix(in oklab, var(--card-background-color, rgba(0,0,0,.5)) 75%, transparent);
            backdrop-filter: blur(8px);
            border: var(--ha-border-width-sm, 1px) solid color-mix(in oklab, var(--divider-color) 50%, transparent);
            border-radius: var(--ha-border-radius-sm, 4px) 0 0 var(--ha-border-radius-sm, 4px);
            box-sizing: border-box;
            overflow: hidden;
            opacity: var(--lcards-header-opacity, 0.2);
            transition: background var(--ha-animation-duration-fast,.15s), opacity var(--ha-animation-duration-fast,.15s), transform var(--ha-animation-duration-fast,.15s);
            transform-origin: left center;
            z-index: 30;
        }
        .row-header:hover { opacity: 1; transform: scaleX(1.1) scaleY(1.25); z-index: 40; background: color-mix(in oklab, var(--lcars-ui-primary, var(--primary-color)) 20%, var(--card-background-color, rgba(0,0,0,.5))); }
        .row-header.edge-start { transform-origin: left top; }
        .row-header.edge-end   { transform-origin: left bottom; }
        .row-header.dragging { opacity: 0.5; cursor: grabbing; }
        .row-header.drop-target { opacity: 1; background: color-mix(in oklab, var(--lcars-ui-primary, var(--primary-color)) 35%, transparent); }

        /* ─── Track size label ────────────────────────────────────────────── */
        .track-label {
            font-size: 11px;
            font-weight: 600;
            color: var(--primary-text-color);
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            padding: 0 4px;
            max-width: calc(100% - 36px);
        }
        /* Row headers use vertical writing-mode, so the inline axis is the
           HEIGHT. The default max-width (cross axis = 28px header width) would
           collapse to 0 and hide the label — constrain max-height instead so the
           track size is always visible without having to click the header. */
        .row-header .track-label {
            writing-mode: vertical-rl;
            max-width: none;
            max-height: calc(100% - 24px);
            padding: 4px 0;
        }
        .track-edit-input {
            font-size: 11px;
            width: 72px;
            background: rgba(255,255,255,.12);
            border: var(--ha-border-width-sm,1px) solid var(--primary-color);
            border-radius: 4px;
            color: var(--primary-text-color);
            padding: 2px 4px;
            outline: none;
        }

        /* ─── Delete track button ─────────────────────────────────────────── */
        .del-btn {
            position: absolute;
            right: 2px;
            top: 50%;
            transform: translateY(-50%);
            display: none;
            align-items: center;
            justify-content: center;
            width: 18px;
            height: 18px;
            background: linear-gradient(135deg, rgba(236,72,72,.9), rgba(255,85,85,1));
            border-radius: 4px;
            cursor: pointer;
            pointer-events: auto;
            --mdc-icon-size: 12px;
            color: #fff;
            /* Row headers use vertical-rl writing-mode; reset it here so the icon
               glyph is centered in the button (matches the column header). */
            writing-mode: horizontal-tb;
            line-height: 0;
        }
        .col-header:hover .del-btn,
        .row-header:hover .del-btn { display: flex; }
        .row-header .del-btn { right: auto; bottom: 2px; top: auto; transform: none; }

        /* ─── Add track buttons ───────────────────────────────────────────── */
        .add-btn {
            position: absolute;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: auto;
            cursor: pointer;
            background: color-mix(in oklab, var(--lcars-ui-primary, var(--primary-color)) 20%, transparent);
            border: var(--ha-border-width-sm,1px) dashed var(--lcars-ui-primary, var(--primary-color));
            color: var(--lcars-ui-primary, var(--primary-color));
            border-radius: var(--ha-border-radius-sm,4px);
            font-size: 18px;
            font-weight: 300;
            line-height: 1;
            transition: background var(--ha-animation-duration-fast,.15s);
            z-index: 30;
        }
        .add-btn:hover { background: color-mix(in oklab, var(--lcars-ui-primary, var(--primary-color)) 35%, transparent); }
        .add-col-btn { width: ${w}px; height: ${w}px; top: 0; }
        .add-row-btn { width: ${w}px; height: ${w}px; left: 0; }

        /* ─── Resize handles ──────────────────────────────────────────────── */
        .resize-handle {
            position: absolute;
            pointer-events: auto;
            z-index: 40;
            transition: background var(--ha-animation-duration-fast,.15s), opacity var(--ha-animation-duration-fast,.15s);
        }
        .rh-col {
            cursor: col-resize;
            width: ${P}px;
            top: 0;
        }
        .rh-row {
            cursor: row-resize;
            height: ${P}px;
            left: 0;
        }
        .resize-handle::after {
            content: '';
            position: absolute;
            background: var(--lcars-ui-primary, var(--primary-color));
            border-radius: 2px;
            opacity: 0;
            transition: opacity .15s;
        }
        .rh-col::after  { top: 20%; bottom: 20%; left: 50%; width: 3px; transform: translateX(-50%); }
        .rh-row::after  { left: 20%; right: 20%; top: 50%; height: 3px; transform: translateY(-50%); }
        .resize-handle:hover::after { opacity: 1; }
        .resize-handle.active::after { opacity: 1; background: var(--lcars-ui-primary, var(--primary-color)); }
        .resize-handle.disabled { cursor: not-allowed; }
        .resize-handle { display: flex; align-items: center; justify-content: center; }
        .insert-btn {
            opacity: 0;
            width: 22px;
            height: 22px;
            flex-shrink: 0;
            border-radius: var(--ha-border-radius-circle, 50%);
            border: var(--ha-border-width-sm,1px) solid var(--lcars-ui-primary, var(--primary-color));
            background: color-mix(in oklab, var(--card-background-color, rgba(0,0,0,.8)) 80%, transparent);
            color: var(--lcars-ui-primary, var(--primary-color));
            font-size: 15px;
            line-height: 1;
            cursor: pointer;
            pointer-events: auto;
            transition: opacity .12s, background .12s, transform .08s;
            z-index: 45;
        }
        .resize-handle:hover .insert-btn { opacity: 1; }
        .insert-btn:hover { background: var(--lcars-ui-primary, var(--primary-color)); color: var(--text-primary-color, #fff); transform: scale(1.1); }

        /* ─── Area overlays ───────────────────────────────────────────────── */
        .area-overlay {
            position: absolute;
            pointer-events: auto;
            box-sizing: border-box;
            border-radius: var(--ha-border-radius-sm, 4px);
            cursor: pointer;
            transition: filter var(--ha-animation-duration-fast,.15s), outline var(--ha-animation-duration-fast,.15s);
            z-index: 20;
        }
        .area-overlay:hover { filter: brightness(1.15); }
        .area-overlay.selected {
            outline: 3px solid var(--lcars-ui-primary, var(--primary-color));
            outline-offset: -2px;
            /* Raise above col/row headers (z-index 30) so rename input and
               toolbar are never clipped under a header when the area abuts an edge. */
            z-index: 35;
        }

        /* Label centered in cell body — never reaches the top-right toolbar corner. */
        .area-label {
            position: absolute;
            top: 50%;
            left: 8px;
            right: 8px;
            transform: translateY(-50%);
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-shadow: 0 1px 3px rgba(0,0,0,.6);
            color: white;
            pointer-events: none;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        /* ─── Area action bar ─────────────────────────────────────────────────
           Positioned inside the area overlay at the top-right corner, inset
           from the edge so gutters never clip it. Appears on hover or select. */
        .area-action-bar {
            position: absolute;
            top: 8px;
            right: 8px;
            display: flex;
            align-items: center;
            gap: 2px;
            background: color-mix(in oklab, var(--card-background-color, #1c1c28) 85%, rgba(0,0,0,.3));
            backdrop-filter: blur(10px);
            border: var(--ha-border-width-sm,1px) solid rgba(255,255,255,.14);
            border-radius: var(--ha-border-radius-md, 8px);
            padding: 4px;
            box-shadow: var(--ha-box-shadow-m, 0 4px 16px rgba(0,0,0,.5));
            opacity: 0;
            pointer-events: none;
            transition: opacity var(--ha-animation-duration-fast,.15s) ease;
            white-space: nowrap;
            z-index: 50;
        }
        /* Bar shows on hover, click (selected), or while renaming */
        .area-overlay:hover .area-action-bar,
        .area-overlay.selected .area-action-bar,
        .area-overlay.renaming .area-action-bar {
            opacity: 1;
            pointer-events: auto;
        }

        /* Individual action buttons in the bar */
        .aab-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: var(--ha-card-border-radius, 34px);
            height: var(--ha-card-border-radius, 34px);
            border: none;
            background: transparent;
            color: rgba(255,255,255,.82);
            cursor: pointer;
            border-radius: var(--ha-border-radius-sm, 4px);
            padding: 0;
            flex-shrink: 0;
            transition: background var(--ha-animation-duration-fast,.15s), color var(--ha-animation-duration-fast,.15s);
        }
        .aab-btn:hover { background: rgba(255,255,255,.12); color: white; }
        .aab-btn.danger:hover { background: color-mix(in oklab, var(--error-color, #ef4444) 18%, transparent); color: var(--error-color, #ef4444); }
        .aab-btn svg { pointer-events: none; }
        /* Thin separator between button groups */
        .aab-sep {
            width: var(--ha-border-width-sm, 1px);
            height: 20px;
            background: rgba(255,255,255,.15);
            flex-shrink: 0;
            margin: 0 2px;
        }

        /* Rename input inside the bar (replaces buttons in-place) */
        .aab-rename-input {
            flex: 1;
            min-width: 120px;
            max-width: 200px;
            font-size: 13px;
            font-weight: 600;
            padding: 5px var(--ha-space-2, 8px);
            border: var(--ha-border-width-sm,1px) solid var(--primary-color);
            border-radius: var(--ha-border-radius-sm, 4px);
            background: rgba(255,255,255,.1);
            color: white;
            outline: none;
        }
        .aab-rename-input::placeholder { color: rgba(255,255,255,.4); }
        .aab-rename-confirm { color: var(--success-color, #4ade80) !important; }
        .aab-rename-confirm:hover { background: color-mix(in oklab, var(--success-color, #4ade80) 18%, transparent) !important; }

        /* ─── Cell selection targets (unoccupied cells for rubber-band) ───── */
        .cell-target {
            position: absolute;
            pointer-events: auto;
            cursor: crosshair;
            box-sizing: border-box;
            border-radius: var(--ha-card-border-radius, 34px);
            touch-action: none;
        }
        .cell-add-btn {
            position: absolute;
            inset: 0;
            opacity: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: var(--ha-space-1, 4px);
            border-radius: var(--ha-card-border-radius, 34px);
            border: var(--ha-border-width-md, 2px) dashed var(--primary-color, var(--lcars-ui-primary));
            background: color-mix(in oklab, var(--lcars-ui-primary, var(--primary-color)) 6%, transparent);
            color: var(--primary-text-color, #fff);
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.04em;
            cursor: crosshair;
            pointer-events: auto;
            transition: opacity .12s, background .12s;
        }
        .cell-target:hover .cell-add-btn { opacity: 1; }
        .cell-add-btn:hover {
            background: color-mix(in oklab, var(--lcars-ui-primary, var(--primary-color)) 16%, transparent);
        }
        .cell-target.in-sel .cell-add-btn {
            opacity: 1;
            background: color-mix(in oklab, var(--primary-color) 18%, transparent);
            border-color: var(--primary-color);
        }

        /* ─── Rubber-band selection rect ──────────────────────────────────── */
        .sel-rect {
            position: absolute;
            pointer-events: none;
            z-index: 60;
            border: 2px dashed color-mix(in oklab, var(--primary-color) 80%, rgba(147,197,253,.8));
            border-radius: var(--ha-border-radius-sm,4px);
            background: color-mix(in oklab, var(--primary-color) 15%, transparent);
            box-shadow:
                inset 0 0 0 1px rgba(224,242,254,.35),
                inset 0 0 20px color-mix(in oklab, var(--primary-color) 8%, transparent);
        }

        /* ─── Name input popup ────────────────────────────────────────────── */
        .name-popup {
            position: absolute;
            z-index: 70;
            pointer-events: auto;
            background: color-mix(in oklab, var(--card-background-color, rgba(0,0,0,.7)) 90%, transparent);
            backdrop-filter: blur(12px);
            border: var(--ha-border-width-sm,1px) solid var(--divider-color);
            border-radius: var(--ha-border-radius-md, 8px);
            padding: 10px 14px;
            min-width: 200px;
            box-shadow: 0 4px 20px rgba(0,0,0,.4);
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .name-popup-title {
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: var(--secondary-text-color);
        }
        .name-popup ha-input { width: 100%; }
        .name-popup-actions { display: flex; gap: 6px; justify-content: flex-end; }

        /* ─── Settings panel ─────────────────────────────────────────────── */
        /* top/left are set imperatively in _positionSettingsPanel() so the panel
           tracks the floating toolbar wherever it is dragged. */
        .settings-panel {
            position: absolute;
            top: 0;
            left: 0;
            z-index: 210;
            pointer-events: auto;
            width: 280px;
            min-width: 220px;
            overflow: auto;
            resize: both;
            box-sizing: border-box;
            background: color-mix(in oklab, var(--card-background-color, rgba(0,0,0,.85)) 92%, transparent);
            backdrop-filter: blur(12px);
            border: var(--ha-border-width-sm,1px) solid var(--divider-color);
            border-radius: var(--ha-border-radius-md, 8px);
            padding: 10px 14px;
            box-shadow: 0 4px 20px rgba(0,0,0,.4);
        }
        .settings-title {
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: var(--secondary-text-color);
            margin-bottom: 8px;
        }
        .settings-panel ha-input {
            display: block;
            width: 100%;
            margin-bottom: 8px;
        }
        .settings-hint {
            font-size: 11px;
            color: var(--secondary-text-color);
            margin-bottom: 8px;
            font-style: italic;
            opacity: 0.85;
        }
        .settings-actions {
            display: flex;
            justify-content: flex-end;
            margin-top: 8px;
            padding-top: 8px;
            border-top: var(--ha-border-width-sm,1px) solid var(--divider-color);
        }

        /* ─── Track size popover ──────────────────────────────────────────── */
        .track-popover {
            position: absolute;
            z-index: 220;
            pointer-events: auto;
            background: color-mix(in oklab, var(--card-background-color, rgba(0,0,0,.9)) 93%, transparent);
            backdrop-filter: blur(12px);
            border: var(--ha-border-width-sm,1px) solid var(--divider-color);
            border-radius: var(--ha-border-radius-md, 8px);
            padding: 10px 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,.5);
            min-width: 200px;
        }
        .tp-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        .tp-title {
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 0.07em;
            text-transform: uppercase;
            color: var(--secondary-text-color);
        }
        .tp-close {
            flex-shrink: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            background: transparent;
            color: var(--secondary-text-color);
            cursor: pointer;
            border-radius: var(--ha-border-radius-sm, 4px);
            padding: 0;
            font-size: 16px;
            line-height: 1;
            margin: -2px -4px -2px 4px;
        }
        .tp-close:hover { background: rgba(255,255,255,.1); color: var(--primary-text-color); }
        .tp-presets {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-bottom: 8px;
        }
        .tp-preset {
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
            background: rgba(255,255,255,.08);
            color: var(--primary-text-color);
            border: var(--ha-border-width-sm,1px) solid rgba(255,255,255,.1);
            transition: background .1s;
        }
        .tp-preset:hover { background: rgba(255,255,255,.18); }
        .tp-custom {
            border-top: var(--ha-border-width-sm,1px) solid var(--divider-color);
            padding-top: 8px;
        }
        .tp-custom ha-input { display: block; width: 100%; }

        /* ─── Per-area settings panel ─────────────────────────────────────── */
        .area-panel {
            position: absolute;
            z-index: 230;
            pointer-events: auto;
            width: 460px;
            min-width: 300px;
            max-width: min(600px, calc(100vw - 24px));
            max-height: calc(100% - 24px);
            overflow: auto;
            resize: both;
            background: color-mix(in oklab, var(--card-background-color, rgba(0,0,0,.9)) 95%, transparent);
            backdrop-filter: blur(12px);
            border: var(--ha-border-width-sm,1px) solid var(--divider-color);
            border-radius: var(--ha-border-radius-md, 8px);
            box-shadow: 0 4px 24px rgba(0,0,0,.5);
        }
        .area-panel.dragging { cursor: grabbing; }
        .ap-header {
            position: sticky;
            top: 0;
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 10px 8px 10px 12px;
            background: var(--card-background-color, #1c1c1c);
            border-bottom: var(--ha-border-width-sm,1px) solid var(--divider-color);
            z-index: 1;
        }
        .ap-header .drag-grip {
            display: flex;
            align-items: center;
            cursor: grab;
            color: var(--secondary-text-color);
            --mdc-icon-size: 18px;
            opacity: 0.6;
            touch-action: none;
        }
        .ap-header .drag-grip:hover { opacity: 1; }
        .ap-title {
            flex: 1;
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: var(--secondary-text-color);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .ap-close {
            flex-shrink: 0;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;
            background: transparent;
            color: var(--secondary-text-color);
            cursor: pointer;
            border-radius: var(--ha-border-radius-sm, 4px);
            padding: 0;
            font-size: 18px;
            line-height: 1;
        }
        .ap-close:hover { background: rgba(255,255,255,.1); color: var(--primary-text-color); }
        .ap-body { padding: var(--ha-space-2, 8px); display: flex; flex-direction: column; }
        .ap-actions {
            display: flex;
            justify-content: flex-end;
            margin-top: 6px;
            padding-top: 8px;
            border-top: var(--ha-border-width-sm, 1px) solid var(--divider-color);
        }
        /* Each setting is its own row with a faint accent rule, so complex
           controls (e.g. the color picker's buttons + input) read as one unit. */
        .ap-field {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 0;
            border-bottom: var(--ha-border-width-sm,1px) solid color-mix(in oklab, var(--lcars-ui-primary, var(--primary-color)) 22%, transparent);
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
            z-index: 250;
            pointer-events: none;
            padding: 4px 9px;
            border-radius: var(--ha-border-radius-pill, 9999px);
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.03em;
            background: var(--lcars-ui-primary, var(--primary-color));
            color: var(--text-primary-color, #fff);
            box-shadow: 0 2px 8px rgba(0,0,0,.4);
            white-space: nowrap;
        }
    `);let H=A;customElements.get("lcards-grid-edit-overlay")||customElements.define("lcards-grid-edit-overlay",H);export{H as LCARdSGridEditOverlay};
//# sourceMappingURL=lcards-grid-edit-overlay-ig_h-wQF.js.map
