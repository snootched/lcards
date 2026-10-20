var e=Object.defineProperty;var o=(l,t)=>e(l,"name",{value:t,configurable:true});import{i,a,b as c}from"./lcards-main-OH3P_lk4.js";const s=class s2 extends i{static get properties(){return{columns:{type:Number},gap:{type:String}}}constructor(){super(),this.columns=2,this.gap="12px"}static get styles(){return a`
            :host {
                display: block;
                margin-bottom: 12px; /* Reduced from 16px for consistency */
            }

            .grid-layout {
                display: grid;
                gap: var(--grid-gap, 12px); /* Changed from 8px to 12px for tighter layout */
                grid-template-columns: var(--grid-columns, 1fr 1fr);
            }

            @media (max-width: 768px) {
                .grid-layout {
                    grid-template-columns: 1fr;
                }
            }

            ::slotted(*) {
                display: block;
            }

            /* Match legacy two-controls styling */
            ::slotted(lcards-form-field) {
                margin-bottom: 0;
            }
        `}render(){const t=Array(this.columns).fill("1fr").join(" ");return c`
            <div class="grid-layout" style="
                --grid-gap: ${this.gap};
                --grid-columns: ${t};
            ">
                <slot></slot>
            </div>
        `}};o(s,"LCARdSGridLayout");let r=s;customElements.get("lcards-grid-layout")||customElements.define("lcards-grid-layout",r);
//# sourceMappingURL=lcards-grid-layout-6SBvDoVT.js.map
