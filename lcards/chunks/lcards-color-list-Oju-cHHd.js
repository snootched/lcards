var v=Object.defineProperty;var h=(p,o)=>v(p,"name",{value:o,configurable:true});import{i as u,a as b,b as c,H as m}from"./lcards-main-OH3P_lk4.js";import"./lcards-form-section-CBBDqzr-.js";const n=class n2 extends u{static get properties(){return{hass:{type:Object},colors:{type:Array},label:{type:String},description:{type:String},disabled:{type:Boolean},_expandedItems:{type:Object,state:true}}}constructor(){super(),this.hass=void 0,this.colors=[],this.label="Colours",this.description="",this.disabled=false,this._expandedItems={}}static get styles(){return b`
      :host {
        display: block;
      }

      .add-button {
        width: 100%;
        margin-bottom: 12px;
      }

      .color-list {
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-2);
      }

      .color-item {
        background: var(--secondary-background-color);
        border: var(--ha-border-width-sm) solid var(--divider-color);
        border-radius: var(--ha-card-border-radius, 12px);
        overflow: hidden;
        transition: all var(--ha-animation-duration-normal, 0.2s) ease;
      }

      .color-item:hover {
        border-color: var(--primary-color);
      }

      .color-header {
        display: flex;
        align-items: center;
        padding: var(--ha-space-3);
        cursor: pointer;
        background: var(--card-background-color);
        gap: var(--ha-space-3);
        user-select: none;
      }

      .color-header:hover {
        background: var(--primary-background-color);
      }

      .color-index {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--primary-color);
        color: var(--text-primary-color);
        font-weight: 500;
        font-size: var(--ha-font-size-m);
        flex-shrink: 0;
      }

      .color-preview {
        width: 40px;
        height: 32px;
        border-radius: 6px;
        border: var(--ha-border-width-md) solid var(--divider-color);
        flex-shrink: 0;
        background-image:
          linear-gradient(45deg, #ccc 25%, transparent 25%),
          linear-gradient(-45deg, #ccc 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #ccc 75%),
          linear-gradient(-45deg, transparent 75%, #ccc 75%);
        background-size: 8px 8px;
        background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
        background-color: white;
      }

      .color-preview-fill {
        width: 100%;
        height: 100%;
        border-radius: var(--ha-border-radius-sm);
      }

      .color-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: var(--ha-space-1);
      }

      .color-value {
        font-weight: 500;
        font-size: var(--ha-font-size-m);
        color: var(--primary-text-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .color-description {
        font-size: var(--ha-font-size-s);
        color: var(--secondary-text-color);
      }

      .color-actions {
        display: flex;
        gap: var(--ha-space-1);
        flex-shrink: 0;
      }

      .expand-icon {
        transition: transform var(--ha-animation-duration-normal, 0.2s) ease;
        flex-shrink: 0;
        color: var(--secondary-text-color);
      }

      .expand-icon.expanded {
        transform: rotate(180deg);
      }

      .color-content {
        padding: var(--ha-space-4);
        background: var(--primary-background-color);
        border-top: var(--ha-border-width-sm) solid var(--divider-color);
      }

      .empty-state {
        text-align: center;
        padding: var(--ha-space-6);
        color: var(--secondary-text-color);
        font-size: var(--ha-font-size-m);
        background: var(--card-background-color);
        border: 2px dashed var(--divider-color);
        border-radius: var(--ha-card-border-radius, 12px);
      }

      ha-icon-button {
        --ha-icon-button-size: 36px;
        --mdc-icon-size: 20px;
      }

    `}render(){const o=Array.isArray(this.colors)?this.colors:[],r=o.length;return c`
      <ha-button class="add-button" @click=${this._addColor} ?disabled=${this.disabled}>
        <ha-icon icon="mdi:plus" slot="start"></ha-icon>
        Add Color
      </ha-button>

      ${r===0?c`
        <div class="empty-state">
          No colors configured. Click "Add Color" to begin.
        </div>
      `:c`
        <div class="color-list">
          ${o.map((t,e)=>this._renderColorItem(t,e))}
        </div>
      `}
    `}_renderColorItem(o,r){const e=(Array.isArray(this.colors)?this.colors:[]).length,a=this._expandedItems[r]||false,s=o||"Not set",i=s.length>35?s.substring(0,35)+"...":s;return c`
      <div class="color-item">
        <!-- Collapsible Header -->
        <div class="color-header" @click=${()=>this._toggleExpanded(r)}>
          <!-- Index Badge -->
          <div class="color-index">${r+1}</div>

          <!-- Color Preview -->
          <div class="color-preview">
            <div class="color-preview-fill" style="background-color: ${this._resolveColorForPreview(o)};"></div>
          </div>

          <!-- Color Info -->
          <div class="color-info">
            <div class="color-value">${i}</div>
            <div class="color-description">Click to ${a?"collapse":"expand and edit"}</div>
          </div>

          <!-- Actions -->
          <div class="color-actions">
            <ha-icon-button
              @click=${d=>this._moveColor(r,-1,d)}
              .label=${"Move Up"}
              .disabled=${r===0||this.disabled}>
              <ha-icon icon="mdi:arrow-up"></ha-icon>
            </ha-icon-button>
            <ha-icon-button
              @click=${d=>this._moveColor(r,1,d)}
              .label=${"Move Down"}
              .disabled=${r===e-1||this.disabled}>
              <ha-icon icon="mdi:arrow-down"></ha-icon>
            </ha-icon-button>
            <ha-icon-button
              @click=${d=>this._removeColor(r,d)}
              .label=${"Delete"}
              .disabled=${this.disabled}>
              <ha-icon icon="mdi:delete"></ha-icon>
            </ha-icon-button>
          </div>

          <!-- Expand Icon -->
          <ha-icon
            class="expand-icon ${a?"expanded":""}"
            icon="mdi:chevron-down">
          </ha-icon>
        </div>

        <!-- Expandable Content -->
        ${a?c`
          <div class="color-content">
            <lcards-color-picker
              .hass=${this.hass}
              .value=${o}
              .disabled=${this.disabled}
              @value-changed=${d=>this._updateColor(r,d.detail.value)}>
            </lcards-color-picker>
          </div>
        `:""}
      </div>
    `}_toggleExpanded(o){this._expandedItems={...this._expandedItems,[o]:!this._expandedItems[o]}}_resolveColorForPreview(o){return o?m(o,{concrete:true,element:this,fallback:o}):"transparent"}_addColor(){if(this.disabled)return;const o=Array.isArray(this.colors)?[...this.colors]:[];o.push("var(--lcars-blue)"),this._expandedItems={...this._expandedItems,[o.length-1]:true},this._emitChange(o)}_removeColor(o,r){if(this.disabled)return;r==null||r.stopPropagation();const t=Array.isArray(this.colors)?[...this.colors]:[];t.splice(o,1);const e={...this._expandedItems};delete e[o];const a={};Object.keys(e).forEach(s=>{const i=parseInt(s);i<o?a[i]=e[i]:i>o&&(a[i-1]=e[i])}),this._expandedItems=a,this._emitChange(t)}_updateColor(o,r){if(this.disabled)return;const t=Array.isArray(this.colors)?[...this.colors]:[];t[o]=r,this._emitChange(t)}_moveColor(o,r,t){if(this.disabled)return;t==null||t.stopPropagation();const e=Array.isArray(this.colors)?[...this.colors]:[],a=o+r;if(a<0||a>=e.length)return;[e[o],e[a]]=[e[a],e[o]];const s={...this._expandedItems},i=s[o];s[o]=s[a],s[a]=i,this._expandedItems=s,this._emitChange(e)}_emitChange(o){console.log("[lcards-color-list] Emitting colors-changed:",o),this.dispatchEvent(new CustomEvent("colors-changed",{detail:{colors:o},bubbles:true,composed:true}))}};h(n,"LCARdSColorList");let l=n;customElements.get("lcards-color-list")||customElements.define("lcards-color-list",l);
//# sourceMappingURL=lcards-color-list-Oju-cHHd.js.map
