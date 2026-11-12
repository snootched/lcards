var V=Object.defineProperty;var h=(d,e)=>V(d,"name",{value:e,configurable:true});import{i as m,a as v,b as l,y as D,s as Y,x as I,l as f,h as L,A as g}from"./lcards-main-OH3P_lk4.js";import{l as F,f as U,r as K}from"./studio-dialog-styles-CwIh7T_l.js";import"./lcards-form-section-CBBDqzr-.js";import{m as M}from"./lcards-message-DltBJ-tU.js";import{c as b,y as N}from"./lcards-yaml-editor-BhWzVC3x.js";import{D as B}from"./docs-links-BWj3kMUR.js";const S=class S2 extends m{static get properties(){return{editor:{type:Object},path:{type:String},label:{type:String},helper:{type:String},disabled:{type:Boolean}}}constructor(){super(),this.hass=void 0,this.editor=null,this.path="",this.label="Padding",this.helper="",this.disabled=false}static get styles(){return v`
            :host {
                display: block;
            }

            .padding-editor {
                display: flex;
                flex-direction: column;
                gap: 12px;
                padding: 8px;
            }

            .label {
                font-weight: 500;
                color: var(--primary-text-color, #212121);
                font-size: 14px;
                padding: 2px 8px;
            }

            .padding-grid {
                display: grid;
                grid-template-columns: 80px 80px 80px;
                grid-template-rows: 60px 60px 60px;
                gap: 8px;
                justify-content: center;
                align-items: center;
                padding: 16px 16px 24px 16px;
                background: var(--primary-background-color, #fff);
                border: var(--ha-border-width-md) solid var(--divider-color, #e0e0e0);
                border-radius: var(--ha-card-border-radius, 12px);
            }

            .padding-cell {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 4px;
            }

            .padding-cell.top {
                grid-column: 2;
                grid-row: 1;
            }

            .padding-cell.left {
                grid-column: 1;
                grid-row: 2;
            }

            .padding-cell.center {
                grid-column: 2;
                grid-row: 2;
                background: var(--primary-color, #f5f5f5);
                border: var(--ha-border-width-md) solid var(--divider-color, #e0e0e0);
                border-radius: 12px;
                font-size: 12px;
                color: var(--text-primary-color, #757575);
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .padding-cell.right {
                grid-column: 3;
                grid-row: 2;
            }

            .padding-cell.bottom {
                grid-column: 2;
                grid-row: 3;
            }

            .padding-label {
                font-size: 11px;
                font-weight: 700;
                color: var(--secondary-text-color, #757575);
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 2px;
            }

            input[type="number"] {
                width: 70px;
                height: 36px;
                padding: 8px;
                border: var(--ha-border-width-md) solid var(--divider-color, #e0e0e0);
                border-radius: 4px;
                background: var(--card-background-color, #fff);
                color: var(--primary-text-color, #212121);
                font-size: 14px;
                font-weight: 500;
                text-align: center;
                font-family: inherit;
                transition: all 0.2s ease;
                box-sizing: border-box;
            }

            input[type="number"]:focus {
                outline: none;
                border-color: var(--primary-color, #03a9f4);
                box-shadow: 0 0 0 1px var(--primary-color, #03a9f4);
            }

            input[type="number"]:hover:not(:disabled) {
                border-color: var(--primary-color, #03a9f4);
            }

            input[type="number"]:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                background: var(--disabled-color, #f0f0f0);
            }

            .helper {
                font-size: 12px;
                color: var(--secondary-text-color, #757575);
                padding: 0 8px;
                font-style: italic;
            }
        `}_getValue(){var e;return(e=this.editor)==null?void 0:e._getConfigValue(this.path)}_getSideValue(e){const t=this._getValue();return t==null?"":typeof t=="number"?t:typeof t=="object"&&t[e]||""}_isUniform(){const e=this._getValue();return typeof e=="number"||e===null||e===void 0}_handleSelectorChange(e,t){if(this.disabled)return;const a=t.detail.value,r=this._getValue();if(typeof r=="number"||r===null||r===void 0){const i=r||0,s={top:i,right:i,bottom:i,left:i};s[e]=a===""?0:Number(a),this.editor._setConfigValue(this.path,s)}else{const i={...r};i[e]=a===""?0:Number(a),this.editor._setConfigValue(this.path,i)}this.requestUpdate()}_renderSideInput(e,t){const a=this._getSideValue(e);return l`
            <div class="padding-cell ${e}">
                <div class="padding-label">${t}</div>
                <ha-selector
                    .hass=${this.hass}
                    .selector=${{number:{min:0,step:1,mode:"box"}}}
                    .value=${a}
                    .disabled=${this.disabled}
                    @value-changed=${r=>this._handleSelectorChange(e,r)}>
                </ha-selector>
            </div>
        `}render(){return l`
            <div class="padding-editor">
                ${this.label?l`<div class="label">${this.label}</div>`:""}

                <div class="padding-grid">
                    ${this._renderSideInput("top","TOP")}
                    ${this._renderSideInput("left","LEFT")}

                    <div class="padding-cell center">
                        Content
                    </div>

                    ${this._renderSideInput("right","RIGHT")}
                    ${this._renderSideInput("bottom","BOTTOM")}
                </div>

                ${this.helper?l`<div class="helper">${this.helper}</div>`:""}
            </div>
        `}};h(S,"LCARdSPaddingEditor");let $=S;customElements.get("lcards-padding-editor")||customElements.define("lcards-padding-editor",$);const W=[{category:"Entity",items:[{value:"entity",label:"Entity State"},{value:"entity_attr",label:"Entity Attribute"}]},{category:"Template",items:[{value:"jinja2",label:"Jinja2 Template"},{value:"javascript",label:"JavaScript Template"}]},{category:"Time",items:[{value:"time_between",label:"Time Between"},{value:"weekday_in",label:"Weekday"},{value:"sun_elevation",label:"Sun Elevation"}]},{category:"Advanced",items:[{value:"map_range_cond",label:"Map Range"},{value:"random_chance",label:"Random Chance"}]},{category:"Logic",items:[{value:"all",label:"ALL (AND sub-group)"},{value:"any",label:"ANY (OR sub-group)"},{value:"not",label:"NOT (negate)"}]}],H=W.flatMap(d=>d.items.map(e=>({value:e.value,label:`${d.category}: ${e.label}`}))),J=[{value:"equals",label:"equals"},{value:"not_equals",label:"not equals"},{value:"above",label:"above"},{value:"at_least",label:"at least (≥)"},{value:"below",label:"below"},{value:"at_most",label:"at most (≤)"},{value:"between",label:"between (≥ and ≤)"},{value:"between_exclusive",label:"between (exclusive, > and <)"},{value:"in",label:"in list"},{value:"not_in",label:"not in list"},{value:"regex",label:"regex match"}],_={between:{loKey:"at_least",hiKey:"at_most"},between_exclusive:{loKey:"above",hiKey:"below"}},G=["mon","tue","wed","thu","fri","sat","sun"],A=class A2 extends m{static get properties(){return{value:{type:Object},hass:{type:Object},_operator:{type:String,state:true},_conditions:{type:Array,state:true}}}constructor(){super(),this.value=null,this.hass=null,this._operator="single",this._conditions=[]}static get styles(){return v`
            :host { display: block; }

            .group-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 12px;
            }

            .group-header ha-selector {
                flex: 0 0 180px;
                margin-bottom: 0;
            }

            .conditions-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .condition-row {
                display: flex;
                gap: 8px;
                align-items: flex-start;
                background: var(--secondary-background-color, rgba(0,0,0,0.05));
                border-radius: 8px;
                padding: 8px;
                border: var(--ha-border-width-sm) solid var(--divider-color, #e0e0e0);
            }

            .condition-row .type-select {
                flex: 0 0 200px;
            }

            .condition-row .condition-fields {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .condition-row .delete-btn {
                flex: 0 0 auto;
            }

            .add-condition-row {
                margin-top: 8px;
            }

            .inline-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
            }

            .nested-group {
                border: var(--ha-border-width-sm) solid var(--primary-color, #03a9f4);
                border-radius: 8px;
                padding: 8px;
            }

            ha-selector {
                display: block;
            }
        `}willUpdate(e){e.has("value")&&this._parseValue(this.value)}_parseValue(e){if(!e||typeof e!="object"||Object.keys(e).length===0){this._operator="single",this._conditions=[];return}e.all?(this._operator="all",this._conditions=Array.isArray(e.all)?e.all.map(t=>this._deserializeCondition(t)):[]):e.any?(this._operator="any",this._conditions=Array.isArray(e.any)?e.any.map(t=>this._deserializeCondition(t)):[]):(this._operator="single",this._conditions=[this._deserializeCondition(e)])}_deserializeCondition(e){var t,a,r,i;if(!e||typeof e!="object")return{_type:"entity",entity:""};if(e.all)return{_type:"all",all:e.all};if(e.any)return{_type:"any",any:e.any};if(e.not!==void 0)return{_type:"not",not:e.not};if(e.entity_attr!==void 0||e.entity!==void 0&&e.attribute!==void 0){const s=this._detectOperator(e);return{_type:"entity_attr",entity:e.entity_attr||e.entity||"",attribute:e.attribute||"",operator:s.key,value:s.value}}if(e.entity!==void 0){const s=this._detectOperator(e);return{_type:"entity",entity:e.entity||"",operator:s.key,value:s.value}}if(e.condition!==void 0){const s=String(e.condition);return s.includes("[[[")&&s.includes("]]]")?{_type:"javascript",template:s.trim().slice(3,-3).trim()}:{_type:"jinja2",template:s}}if(e.jinja2!==void 0)return{_type:"jinja2",template:e.jinja2};if(e.javascript!==void 0)return{_type:"javascript",template:e.javascript};if(e.time_between!==void 0){const s=String(e.time_between).split("-");return{_type:"time_between",after:s[0]||"",before:s[1]||""}}if(e.weekday_in!==void 0)return{_type:"weekday_in",weekdays:e.weekday_in||[]};if(e.sun_elevation!==void 0){const s=e.sun_elevation||{};return{_type:"sun_elevation",above:s.above,below:s.below,at_least:s.at_least,at_most:s.at_most}}if(e.perf_metric!==void 0){const s=e.perf_metric||{};return{_type:"perf_metric",metric:s.key||"",above:s.above,below:s.below,at_least:s.at_least,at_most:s.at_most}}if(e.flag!==void 0){const s=e.flag||{};return{_type:"flag",flag:s.debugFlagName||"",is:s.is!==void 0?s.is:true}}if(e.random_chance!==void 0)return{_type:"random_chance",probability:e.random_chance};if(e.map_range_cond!==void 0){const s=e.map_range_cond||{};return{_type:"map_range_cond",entity:s.entity||"",input_min:((t=s.input)==null?void 0:t[0])??0,input_max:((a=s.input)==null?void 0:a[1])??100,output_min:((r=s.output)==null?void 0:r[0])??0,output_max:((i=s.output)==null?void 0:i[1])??100}}return e._type?e:{_type:"entity",entity:"",operator:"equals",value:""}}_detectOperator(e){for(const[t,{loKey:a,hiKey:r}]of Object.entries(_))if(e[a]!==void 0&&e[r]!==void 0)return{key:t,value:{lo:e[a],hi:e[r]}};for(const t of["equals","not_equals","above","at_least","below","at_most","in","not_in","regex"])if(e[t]!==void 0)return{key:t,value:e[t]};return e.state!==void 0?{key:"equals",value:e.state}:{key:"equals",value:""}}_serializeCondition(e){switch(e._type||this._getConditionType(e)){case"entity":{const a=e.operator||"equals",r=_[a];if(r){const s=e.value||{};return{entity:e.entity||"",[r.loKey]:Number(s.lo??0),[r.hiKey]:Number(s.hi??100)}}const i=e.value!==void 0?e.value:"";return{entity:e.entity||"",[a]:i}}case"entity_attr":{const a=e.operator||"equals",r=_[a];if(r){const s=e.value||{};return{entity:e.entity||"",attribute:e.attribute||"",[r.loKey]:Number(s.lo??0),[r.hiKey]:Number(s.hi??100)}}const i=e.value!==void 0?e.value:"";return{entity:e.entity||"",attribute:e.attribute||"",[a]:i}}case"jinja2":return{condition:e.template||""};case"javascript":return{condition:`[[[ ${(e.template||"").trim()} ]]]`};case"time_between":return{time_between:`${e.after||"00:00"}-${e.before||"23:59"}`};case"weekday_in":return{weekday_in:e.weekdays||[]};case"sun_elevation":{const a={};return e.above!==void 0&&e.above!==""&&(a.above=Number(e.above)),e.at_least!==void 0&&e.at_least!==""&&(a.at_least=Number(e.at_least)),e.below!==void 0&&e.below!==""&&(a.below=Number(e.below)),e.at_most!==void 0&&e.at_most!==""&&(a.at_most=Number(e.at_most)),{sun_elevation:a}}case"perf_metric":{const a={key:e.metric||""};return e.above!==void 0&&e.above!==""&&(a.above=Number(e.above)),e.at_least!==void 0&&e.at_least!==""&&(a.at_least=Number(e.at_least)),e.below!==void 0&&e.below!==""&&(a.below=Number(e.below)),e.at_most!==void 0&&e.at_most!==""&&(a.at_most=Number(e.at_most)),{perf_metric:a}}case"flag":return{flag:{debugFlagName:e.flag||"",is:e.is!==void 0?e.is:true}};case"random_chance":return{random_chance:e.probability!==void 0?Number(e.probability):.5};case"map_range_cond":return{map_range_cond:{entity:e.entity||"",input:[e.input_min??0,e.input_max??100],output:[e.output_min??0,e.output_max??100]}};case"all":return{all:e.all||[]};case"any":return{any:e.any||[]};case"not":return{not:e.not!==void 0?e.not:{}};default:{const{_type:a,...r}=e;return r}}}_emit(){const e=this._conditions.map(a=>this._serializeCondition(a));let t;this._operator==="all"?t=e.length>0?{all:e}:null:this._operator==="any"?t=e.length>0?{any:e}:null:t=e.length>0?e[0]:null,this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:t},bubbles:true,composed:true}))}_handleOperatorChange(e){const t=e.detail.value;t!==this._operator&&(t==="single"&&this._conditions.length>1&&(this._conditions=[this._conditions[0]]),this._operator=t,this._emit())}_handleAddCondition(){const e={_type:"entity",entity:""};this._operator==="single"&&this._conditions.length===0?this._conditions=[e]:this._operator==="single"?(this._operator="all",this._conditions=[...this._conditions,e]):this._conditions=[...this._conditions,e],this._emit()}_handleDeleteCondition(e){const t=[...this._conditions];t.splice(e,1),this._conditions=t,this._emit()}_handleConditionTypeChange(e,t){const a=[...this._conditions],r=a[e],i=this._getConditionType(r);(i==="entity"||i==="entity_attr")&&(t==="entity"||t==="entity_attr")?a[e]={_type:t,entity:r.entity||"",operator:r.operator||"equals",value:r.value}:a[e]={_type:t},this._conditions=a,this._emit()}_handleConditionFieldChange(e,t,a){const r=[...this._conditions];r[e]={...r[e],[t]:a},this._conditions=r,this._emit()}_handleNestedGroupChange(e,t){const a=[...this._conditions],r=a[e]._type||"all",i=t.detail.value;r==="not"?a[e]={_type:"not",not:i}:a[e]={_type:r,...i||{}},this._conditions=a,this._emit()}_getConditionType(e){return e?e._type?e._type:e.all?"all":e.any?"any":e.not?"not":e.entity!==void 0&&e.attribute!==void 0?"entity_attr":e.entity!==void 0?"entity":e.template!==void 0&&e.template_type==="javascript"?"javascript":e.template!==void 0?"jinja2":e.time_range!==void 0||e.after!==void 0?"time_between":e.weekdays!==void 0?"weekday_in":e.sun_elevation!==void 0||e.sun!==void 0?"sun_elevation":e.metric!==void 0?"perf_metric":e.flag!==void 0?"flag":e.probability!==void 0?"random_chance":e.datasource!==void 0?"map_range_cond":"entity":"entity"}render(){const e=[{value:"all",label:"ALL (AND)"},{value:"any",label:"ANY (OR)"},{value:"single",label:"Single condition"}];return l`
            <div @value-changed=${t=>t.stopPropagation()}>
                <div class="group-header">
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Operator"}
                        .selector=${{select:{mode:"dropdown",options:e}}}
                        .value=${this._operator}
                        @value-changed=${this._handleOperatorChange}>
                    </ha-selector>
                </div>

                <div class="conditions-list">
                    ${this._conditions.map((t,a)=>this._renderConditionRow(t,a))}
                </div>

                <div class="add-condition-row">
                    <ha-button @click=${this._handleAddCondition}>
                        <ha-icon icon="mdi:plus" slot="icon"></ha-icon>
                        Add Condition
                    </ha-button>
                </div>
            </div>
        `}_renderConditionRow(e,t){const a=this._getConditionType(e);return l`
            <div class="condition-row">
                <div class="type-select">
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Type"}
                        .selector=${{select:{mode:"dropdown",options:H}}}
                        .value=${a}
                        @value-changed=${r=>this._handleConditionTypeChange(t,r.detail.value)}>
                    </ha-selector>
                </div>
                <div class="condition-fields">
                    ${this._renderConditionFields(e,a,t)}
                </div>
                <ha-icon-button
                    .label=${"Remove condition"}
                    .path=${"M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"}
                    style="color: var(--error-color, #f44336); flex: 0 0 auto; align-self: flex-start; margin-top: 4px;"
                    @click=${()=>this._handleDeleteCondition(t)}>
                </ha-icon-button>
            </div>
        `}_renderConditionFields(e,t,a){const r=h((i,s)=>this._handleConditionFieldChange(a,i,s),"set");switch(t){case"entity":return this._renderEntityFields(e,a,false);case"entity_attr":return this._renderEntityFields(e,a,true);case"jinja2":return l`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Jinja2 Template"}
                        .helper=${"Must evaluate to true/false, e.g. {{ states('sensor.temp') | float > 20 }}"}
                        .selector=${{template:{}}}
                        .value=${e.template||""}
                        @value-changed=${i=>{r("template",i.detail.value),r("_type","jinja2")}}>
                    </ha-selector>
                `;case"javascript":return l`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"JavaScript Template"}
                        .helper=${"Return true/false, e.g. [[[ return states['sensor.temp'].state > 20; ]]]"}
                        .selector=${{text:{multiline:true}}}
                        .value=${e.template||""}
                        @value-changed=${i=>{r("template",i.detail.value),r("template_type","javascript"),r("_type","javascript")}}>
                    </ha-selector>
                `;case"time_between":return l`
                    <div class="inline-grid">
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Start time (HH:MM)"}
                            .selector=${{text:{}}}
                            .value=${e.after||""}
                            @value-changed=${i=>r("after",i.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"End time (HH:MM)"}
                            .selector=${{text:{}}}
                            .value=${e.before||""}
                            @value-changed=${i=>r("before",i.detail.value)}>
                        </ha-selector>
                    </div>
                `;case"weekday_in":return l`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Weekdays"}
                        .selector=${{select:{multiple:true,options:G.map(i=>({value:i,label:i.charAt(0).toUpperCase()+i.slice(1)}))}}}
                        .value=${e.weekdays||[]}
                        @value-changed=${i=>r("weekdays",i.detail.value)}>
                    </ha-selector>
                `;case"sun_elevation":return l`
                    <div class="inline-grid">
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Above (degrees)"}
                            .selector=${{number:{min:-90,max:90,mode:"box"}}}
                            .value=${e.above??""}
                            @value-changed=${i=>r("above",i.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Below (degrees)"}
                            .selector=${{number:{min:-90,max:90,mode:"box"}}}
                            .value=${e.below??""}
                            @value-changed=${i=>r("below",i.detail.value)}>
                        </ha-selector>
                    </div>
                    <div class="inline-grid">
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"At Least (degrees, ≥)"}
                            .selector=${{number:{min:-90,max:90,mode:"box"}}}
                            .value=${e.at_least??""}
                            @value-changed=${i=>r("at_least",i.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"At Most (degrees, ≤)"}
                            .selector=${{number:{min:-90,max:90,mode:"box"}}}
                            .value=${e.at_most??""}
                            @value-changed=${i=>r("at_most",i.detail.value)}>
                        </ha-selector>
                    </div>
                `;case"perf_metric":return l`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Metric Key"}
                        .selector=${{text:{}}}
                        .value=${e.metric||""}
                        @value-changed=${i=>r("metric",i.detail.value)}>
                    </ha-selector>
                    <div class="inline-grid">
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Above"}
                            .selector=${{number:{mode:"box"}}}
                            .value=${e.above??""}
                            @value-changed=${i=>r("above",i.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Below"}
                            .selector=${{number:{mode:"box"}}}
                            .value=${e.below??""}
                            @value-changed=${i=>r("below",i.detail.value)}>
                        </ha-selector>
                    </div>
                    <div class="inline-grid">
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"At Least (≥)"}
                            .selector=${{number:{mode:"box"}}}
                            .value=${e.at_least??""}
                            @value-changed=${i=>r("at_least",i.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"At Most (≤)"}
                            .selector=${{number:{mode:"box"}}}
                            .value=${e.at_most??""}
                            @value-changed=${i=>r("at_most",i.detail.value)}>
                        </ha-selector>
                    </div>
                `;case"flag":return l`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Flag Name"}
                        .selector=${{text:{}}}
                        .value=${e.flag||""}
                        @value-changed=${i=>r("flag",i.detail.value)}>
                    </ha-selector>
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Is Enabled"}
                        .selector=${{boolean:{}}}
                        .value=${e.is!==void 0?e.is:true}
                        @value-changed=${i=>r("is",i.detail.value)}>
                    </ha-selector>
                `;case"random_chance":return l`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Probability (0–1)"}
                        .helper=${"e.g. 0.3 = 30% chance"}
                        .selector=${{number:{min:0,max:1,step:.01,mode:"box"}}}
                        .value=${e.probability??.5}
                        @value-changed=${i=>r("probability",i.detail.value)}>
                    </ha-selector>
                `;case"map_range_cond":return l`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${"Entity"}
                        .selector=${{entity:{}}}
                        .value=${e.entity||""}
                        @value-changed=${i=>r("entity",i.detail.value)}>
                    </ha-selector>
                    <div class="inline-grid">
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Input Min"}
                            .selector=${{number:{mode:"box"}}}
                            .value=${e.input_min??0}
                            @value-changed=${i=>r("input_min",i.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Input Max"}
                            .selector=${{number:{mode:"box"}}}
                            .value=${e.input_max??100}
                            @value-changed=${i=>r("input_max",i.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Output Min"}
                            .selector=${{number:{mode:"box"}}}
                            .value=${e.output_min??0}
                            @value-changed=${i=>r("output_min",i.detail.value)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Output Max"}
                            .selector=${{number:{mode:"box"}}}
                            .value=${e.output_max??100}
                            @value-changed=${i=>r("output_max",i.detail.value)}>
                        </ha-selector>
                    </div>
                `;case"all":case"any":{const i=t==="all"?e.all?{all:e.all}:null:e.any?{any:e.any}:null;return l`
                    <div class="nested-group">
                        <lcards-condition-group-editor
                            .hass=${this.hass}
                            .value=${i}
                            @value-changed=${s=>this._handleNestedGroupChange(a,s)}>
                        </lcards-condition-group-editor>
                    </div>
                `}case"not":{const i=e.not||null;return l`
                    <div class="nested-group">
                        <lcards-condition-group-editor
                            .hass=${this.hass}
                            .value=${i}
                            @value-changed=${s=>this._handleConditionFieldChange(a,"not",s.detail.value)}>
                        </lcards-condition-group-editor>
                    </div>
                `}default:return l`<div>Unknown condition type: ${t}</div>`}}_getAttributeOptions(e){var t,a;return!e||!((a=(t=this.hass)==null?void 0:t.states)!=null&&a[e])?[]:Object.keys(this.hass.states[e].attributes||{}).map(r=>({value:r,label:r}))}_renderEntityFields(e,t,a){var s,n;const r=h((o,p)=>this._handleConditionFieldChange(t,o,p),"set"),i=a?this._getAttributeOptions(e.entity):[];return l`
            <ha-selector
                .hass=${this.hass}
                .label=${"Entity"}
                .selector=${{entity:{}}}
                .value=${e.entity||""}
                @value-changed=${o=>r("entity",o.detail.value)}>
            </ha-selector>
            ${a?l`
                ${i.length>0?l`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Attribute"}
                            .selector=${{select:{mode:"dropdown",custom_value:true,options:i}}}
                            .value=${e.attribute||""}
                            @value-changed=${o=>r("attribute",o.detail.value)}>
                        </ha-selector>`:l`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Attribute"}
                            .helper=${"Select an entity first to see available attributes"}
                            .selector=${{text:{}}}
                            .value=${e.attribute||""}
                            @value-changed=${o=>r("attribute",o.detail.value)}>
                        </ha-selector>`}
            `:""}
            <ha-selector
                .hass=${this.hass}
                .label=${"Operator"}
                .selector=${{select:{mode:"dropdown",options:J}}}
                .value=${e.operator||"equals"}
                @value-changed=${o=>r("operator",o.detail.value)}>
            </ha-selector>
            ${_[e.operator]?l`
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Min"}
                    .selector=${{text:{}}}
                    .value=${((s=e.value)==null?void 0:s.lo)!==void 0?String(e.value.lo):""}
                    @value-changed=${o=>r("value",{...e.value||{},lo:o.detail.value})}>
                </ha-selector>
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Max"}
                    .selector=${{text:{}}}
                    .value=${((n=e.value)==null?void 0:n.hi)!==void 0?String(e.value.hi):""}
                    @value-changed=${o=>r("value",{...e.value||{},hi:o.detail.value})}>
                </ha-selector>
            `:l`
                <ha-selector
                    .hass=${this.hass}
                    .label=${"Value"}
                    .selector=${{text:{}}}
                    .value=${e.value!==void 0?String(e.value):e.state!==void 0?String(e.state):""}
                    @value-changed=${o=>r("value",o.detail.value)}>
                </ha-selector>
            `}
        `}};h(A,"LCARdSConditionGroupEditor");let w=A;customElements.get("lcards-condition-group-editor")||customElements.define("lcards-condition-group-editor",w);const Z=new Set(["type","id","tags","rules","data_sources","grid_options","view_layout","visibility"]);function x(d){if(Array.isArray(d))return d.map(x);if(!d||typeof d!="object")return d;const e={};for(const[t,a]of Object.entries(d))t==="required"&&Array.isArray(a)||(e[t]=x(a));return e}h(x,"withoutRequired");function Q(d,e){if(!(d!=null&&d.properties))return{type:"object",description:e,additionalProperties:true};const t=Object.fromEntries(Object.entries(d.properties).filter(([a])=>!Z.has(a)));return{type:"object",description:e,properties:x(t),additionalProperties:true}}h(Q,"patchSchema");function P({overlays:d=[],card:e={},getCardSchema:t=h(()=>null,"getCardSchema")}={}){const a=D.items.properties.apply,r=new Map(d.filter(c=>c==null?void 0:c.id).map(c=>[c.id,c]));e.id&&!r.has(e.id)&&r.set(e.id,{id:e.id,type:e.type});const i=new Map,s=h(c=>{const u=c||"unknown";return i.has(u)||i.set(u,t(u)),i.get(u)},"patchFor"),n={};for(const{id:c,type:u}of r.values()){const q=u&&u!=="unknown"?`${u} card`:"overlay";n[c]=Q(s(u),`Changes to ${c} (${q}) while the rule matches`)}n.all={type:"object",description:"Changes to every overlay on the page (minus exclude)",additionalProperties:true},n.exclude={type:"array",items:{type:"string",enum:[...r.keys()]},description:"Overlay IDs the all/type:/tag:/pattern: selectors skip"};const o=[...new Set(d.flatMap(c=>c.tags??[]))],p=[...r.keys()],y=a.properties.animations.items;return{...a,properties:{...a.properties,overlays:{...a.properties.overlays,description:"What to change, per overlay ID, or per selector: type:<card type>, tag:<tag>, pattern:<regex>",properties:n,additionalProperties:{type:"object",description:"Changes for a type:, tag: or pattern: selector",additionalProperties:true}},animations:{...a.properties.animations,items:{...y,properties:{...y.properties,overlay:{...y.properties.overlay,...p.length?{examples:p}:{}},tag:{...y.properties.tag,...o.length?{examples:o}:{}}}}}}}}h(P,"ruleApplySchema");function X(d){const e=D.items;return{...e,properties:{...e.properties,apply:P(d)}}}h(X,"ruleSchema");const R=h(d=>String((d==null?void 0:d.type)??"").replace(/^custom:lcards-/,""),"cardTypeOf");function z(d){var r,i,s;const e=(r=window.lcards)==null?void 0:r.core,t=(d==null?void 0:d.config)??{};let a=[];try{a=((s=(i=e==null?void 0:e.systemsManager)==null?void 0:i.getAllTargetableOverlays)==null?void 0:s.call(i))??[]}catch{}return{overlays:a,card:{id:t.id,type:R(t)},getCardSchema:h(n=>{var o,p;return((p=(o=e==null?void 0:e.configManager)==null?void 0:o.getCardSchema)==null?void 0:p.call(o,n))??null},"getCardSchema")}}h(z,"pageSchemaOptions");const T=class T2 extends m{static get properties(){return{value:{type:Object},hass:{type:Object},editor:{type:Object},_yamlText:{type:String,state:true},_yamlError:{type:String,state:true},_refExpanded:{type:Boolean,state:true}}}constructor(){super(),this.hass=void 0,this.editor=void 0,this.value={},this._yamlText="",this._yamlError="",this._refExpanded=false,this._emitted=null,this._schema=null}static get styles(){return[M,v`
            :host { display: block; }

            .yaml-error {
                color: var(--error-color);
                font-size: 12px;
                margin-top: var(--ha-space-1);
            }

            .table-wrapper {
                overflow-x: auto;
            }

            .ref-table {
                min-width: 100%;
                width: max-content;
                border-collapse: collapse;
                font-size: 13px;
            }

            .ref-table th {
                padding: var(--ha-space-2) var(--ha-space-3);
                text-align: left;
                font-weight: 600;
                font-size: 12px;
                color: var(--secondary-text-color);
                border-bottom: var(--ha-border-width-md) solid var(--divider-color);
                white-space: nowrap;
            }

            .ref-table td {
                padding: var(--ha-space-1) var(--ha-space-3);
                border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
                white-space: nowrap;
                color: var(--secondary-text-color);
            }

            .ref-table tr:last-child td {
                border-bottom: none;
            }

            .ref-table tbody tr:hover {
                background: color-mix(in srgb, var(--primary-text-color) 6%, transparent);
            }

            .ref-id {
                font-family: var(--code-font-family, monospace);
                font-weight: 600;
                color: var(--primary-text-color);
            }

            .ref-table ha-icon-button {
                --ha-icon-button-size: 28px;
                --mdc-icon-size: 16px;
            }

            .ref-empty {
                margin: 0;
            }

            .starter {
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: var(--ha-space-2);
                margin-bottom: var(--ha-space-2);
            }

            .selectors {
                margin: var(--ha-space-2) 0 0;
            }

            .selectors code {
                font-family: var(--code-font-family, monospace);
            }
        `]}willUpdate(e){e.has("value")&&this.value!==this._emitted&&this._syncFromValue()}connectedCallback(){super.connectedCallback(),this._schema=null}_syncFromValue(){try{const e=this.value||{};this._yamlText=Object.keys(e).length?b(e):"",this._yamlError=""}catch(e){this._yamlError=String(e)}}_getDiscoverableOverlays(){var e,t,a;try{return((a=(t=(e=window.lcards)==null?void 0:e.core)==null?void 0:t.systemsManager)==null?void 0:a.getAllTargetableOverlays())||[]}catch{return[]}}_getSchema(){return this._schema||(this._schema=P(z(this.editor))),this._schema}flush(){var e,t,a;(a=(t=(e=this.renderRoot)==null?void 0:e.querySelector("lcards-yaml-editor"))==null?void 0:t.flush)==null||a.call(t)}_emit(e){this._emitted=e,this.value=e,this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:e},bubbles:true,composed:true}))}_handleYamlChange(e){e.stopPropagation();const t=e.detail.value;this._yamlText=t;try{const a=t.trim()?N(t):{};this._yamlError="",this._emit(a||{})}catch(a){this._yamlError=`YAML error: ${a.message}`}}async _startWithCard(){var a;const e=((a=this.editor)==null?void 0:a.config)??{};let t=e.id;if(!t){const r=new Set(this._getDiscoverableOverlays().map(n=>n.id)),i=String(e.entity??"").split(".")[1]||R(e).replace(/-/g,"_")||"card";let s=i;for(let n=2;r.has(s);n++)s=`${i}_${n}`;if(t=await Y({title:"Give this card an id",message:"Rules target cards by id. This card has none, so it gets a new random one on every page load.",label:"Card ID",value:s,confirmText:"Set id"}),!t)return;if(!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(t)){this._yamlError="A card id starts with a letter or _, then letters, digits, _ or -.";return}this.editor._updateConfig({id:t}),this._schema=null}this._yamlError="",this._yamlText=`overlays:
  ${t}:
    `}render(){var t,a;const e=(a=(t=this.editor)==null?void 0:t.config)==null?void 0:a.id;return l`
            ${this._yamlText.trim()?"":l`
                <div class="starter">
                    <span class="hint">Type an overlay ID, or start with this card. Ctrl+Space lists what can go next.</span>
                    <ha-button appearance="outlined" variant="brand" size="s" @click=${()=>this._startWithCard()}>
                        <ha-icon icon="mdi:target" slot="start"></ha-icon>
                        ${e?`Start with ${e}`:"Start with this card"}
                    </ha-button>
                </div>
            `}
            <lcards-yaml-editor
                .hass=${this.hass}
                .schema=${this._getSchema()}
                .value=${this._yamlText}
                @value-changed=${this._handleYamlChange}>
            </lcards-yaml-editor>
            ${this._yamlError?l`<div class="yaml-error">${this._yamlError}</div>`:""}

            <lcards-form-section
                header="Targets on this page"
                description="Overlay IDs, card types and tags you can change"
                icon="mdi:layers-search"
                ?expanded=${this._refExpanded}
                ?outlined=${false}
                @expanded-changed=${r=>this._refExpanded=r.detail.expanded}>
                ${this._renderOverlayReference()}
            </lcards-form-section>
        `}_renderOverlayReference(){const e=this._getDiscoverableOverlays();return e.length===0?l`<p class="hint ref-empty">No targets on this page yet: cards register when they render.</p>`:l`
            <div class="table-wrapper"><table class="ref-table">
                <thead>
                    <tr><th>ID</th><th>Type</th><th>Tags</th><th></th></tr>
                </thead>
                <tbody>
                    ${e.map(t=>{var a;return l`
                        <tr>
                            <td class="ref-id">${t.id}</td>
                            <td>${t.type||"-"}</td>
                            <td>${(a=t.tags)!=null&&a.length?t.tags.join(", "):"-"}</td>
                            <td>
                                <ha-icon-button .label=${"Copy ID"} title="Copy ID" @click=${()=>I(t.id)}>
                                    <ha-icon icon="mdi:content-copy"></ha-icon>
                                </ha-icon-button>
                            </td>
                        </tr>
                    `})}
                </tbody>
            </table></div>
            <p class="hint selectors">
                Selectors: <code>all</code>, <code>type:button</code>, <code>tag:name</code>,
                <code>pattern:regex</code>; <code>exclude: [id]</code> skips IDs.
            </p>
        `}};h(T,"LCARdSRuleApplyEditor");let C=T;customElements.get("lcards-rule-apply-editor")||customElements.define("lcards-rule-apply-editor",C);const j=class j2 extends m{static get properties(){return{hass:{type:Object},mode:{type:String},rule:{type:Object},open:{type:Boolean},editor:{type:Object},_ruleId:{type:String,state:true},_ruleName:{type:String,state:true},_priority:{type:Number,state:true},_enabled:{type:Boolean,state:true},_stop:{type:Boolean,state:true},_when:{type:Object,state:true},_apply:{type:Object,state:true},_errors:{type:Object,state:true},_applyWarning:{type:Boolean,state:true}}}constructor(){super(),this.editor=void 0,this.hass=void 0,this.mode="add",this.open=false,this.rule=null,this._resetForm()}static get styles(){return v`
            :host { display: block; }

            ha-dialog {
                --ha-dialog-width-md: min(900px, 95vw);
            }

            .form-content {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-4);
                padding: var(--ha-space-2) 0;
                --lcards-section-spacing: 0;
            }

            ha-selector {
                display: block;
                margin-bottom: var(--ha-space-3);
            }

            .identity-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: var(--ha-space-3);
                align-items: start;
            }

            .identity-right {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: var(--ha-space-3);
                align-items: start;
            }

            .error-text {
                color: var(--error-color);
                font-size: 12px;
                margin-top: calc(-1 * var(--ha-space-2));
                margin-bottom: var(--ha-space-1);
            }

            lcards-message {
                display: block;
                margin-bottom: var(--ha-space-2);
            }

            @media (max-width: 600px) {
                .identity-grid {
                    grid-template-columns: 1fr;
                }
                .identity-right {
                    grid-template-columns: 1fr;
                }
            }
        `}_resetForm(){const e=this.rule||{};this._ruleId=e.id||"",this._ruleName=e.name||"",this._priority=e.priority!==void 0?e.priority:0,this._enabled=e.enabled!==false,this._stop=e.stop===true,this._when=e.when||null,this._apply=e.apply||{},this._errors={},this._applyWarning=false}willUpdate(e){e.has("open")&&this.open&&this._resetForm()}_validateId(e=false){var r,i;const t=this._ruleId?this._ruleId.trim():"";let a=null;if(t?/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(t)?this.mode==="add"&&(((i=(r=this.editor)==null?void 0:r.config)==null?void 0:i.rules)||[]).some(n=>n.id===t)&&(a=`A rule with id "${t}" already exists`):a="ID must start with a letter or _, then letters/digits/_ or -":a="Rule ID is required",!e)if(a)this._errors={...this._errors,id:a};else{const s={...this._errors};delete s.id,this._errors=s}return a===null}_isValid(){return this._validateId(true)}_handleSave(){var r,i;if((i=(r=this.renderRoot.querySelector("lcards-rule-apply-editor"))==null?void 0:r.flush)==null||i.call(r),!this._validateId())return;const e={id:this._ruleId.trim(),name:this._ruleName||void 0,priority:this._priority,enabled:this._enabled,stop:this._stop,when:this._when||void 0,apply:this._apply||{}},t=Object.fromEntries(Object.entries(e).filter(([,s])=>s!==void 0));if(!(t.apply&&(Object.keys(t.apply.overlays||{}).length>0||t.apply.tags&&t.apply.tags.length>0||t.apply.animations&&t.apply.animations.length>0||!!t.apply.base_svg))&&!this._applyWarning){f.warn("[RuleEditorDialog] Apply section is empty — showing warning before save:",t.id),this._applyWarning=true;return}f.debug("[RuleEditorDialog] Saving rule:",t.id),this.dispatchEvent(new CustomEvent("save",{detail:{rule:t},bubbles:true,composed:true}))}_handleCancel(){this.dispatchEvent(new CustomEvent("cancel",{bubbles:true,composed:true}))}_handleDialogClosed(e){e.stopPropagation(),e.target===e.currentTarget&&this._handleCancel()}_ignoreKeydown(e){e.key.length===1&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&e.stopPropagation()}render(){var e;return this.open?l`
            <ha-dialog
                open
                prevent-scrim-close
                header-title=${this.mode==="add"?"Add Rule":`Edit Rule: ${((e=this.rule)==null?void 0:e.id)||""}`}
                @closed=${this._handleDialogClosed}>

                <div @keydown=${this._ignoreKeydown}>
                    ${this._renderForm()}
                </div>

                <div slot="footer">
                    <ha-button appearance="plain" @click=${this._handleCancel}>Cancel</ha-button>
                    <ha-button
                        variant="brand"
                        @click=${this._handleSave}
                        ?disabled=${!this._isValid()}>
                        <ha-icon icon="mdi:check" slot="start"></ha-icon>
                        ${this.mode==="add"?"Create rule":"Save rule"}
                    </ha-button>
                </div>
            </ha-dialog>
        `:l``}_renderForm(){return l`
            <div class="form-content">

                <!-- Rule Identity -->
                <lcards-form-section
                    header="Rule Identity"
                    icon="mdi:identifier"
                    ?expanded=${true}
                    ?outlined=${false}>

                    <!-- ID + Name row -->
                    <div class="identity-grid">
                        <div>
                            <ha-selector
                                .hass=${this.hass}
                                .label=${"Rule ID"}
                                .required=${true}
                                .helper=${"Unique identifier: letters, digits, _ or - (must start with letter or _)"}
                                .selector=${{text:{}}}
                                .value=${this._ruleId}
                                .disabled=${this.mode==="edit"}
                                @value-changed=${e=>{this._ruleId=e.detail.value,this._validateId()}}>
                            </ha-selector>
                            ${this._errors.id?l`<div class="error-text">${this._errors.id}</div>`:""}
                        </div>
                        <div>
                            <ha-selector
                                .hass=${this.hass}
                                .label=${"Name (optional)"}
                                .required=${false}
                                .helper=${"Human-readable label for this rule"}
                                .selector=${{text:{}}}
                                .value=${this._ruleName}
                                @value-changed=${e=>this._ruleName=e.detail.value}>
                            </ha-selector>
                        </div>
                    </div>

                    <!-- Priority + Enabled + Stop row -->
                    <div class="identity-right">
                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Priority"}
                            .required=${false}
                            .helper=${"Higher values execute first (0–1000)"}
                            .selector=${{number:{min:0,max:1e3,mode:"box"}}}
                            .value=${this._priority}
                            @value-changed=${e=>this._priority=e.detail.value}>
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Enabled"}
                            .helper=${"Disable to temporarily skip this rule"}
                            .selector=${{boolean:{}}}
                            .value=${this._enabled}
                            @value-changed=${e=>this._enabled=e.detail.value}>
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .label=${"Stop Processing"}
                            .helper=${"When true, lower-priority rules will not be evaluated after this one matches"}
                            .selector=${{boolean:{}}}
                            .value=${this._stop}
                            @value-changed=${e=>this._stop=e.detail.value}>
                        </ha-selector>
                    </div>
                </lcards-form-section>

                <!-- Conditions (when) -->
                <lcards-form-section
                    header="Conditions"
                    description="Rule fires when these conditions are met. Leave empty to always apply."
                    icon="mdi:filter"
                    ?expanded=${true}
                    ?outlined=${false}>

                    <lcards-condition-group-editor
                        .hass=${this.hass}
                        .value=${this._when}
                        @value-changed=${e=>this._when=e.detail.value}>
                    </lcards-condition-group-editor>
                </lcards-form-section>

                <!-- Apply -->
                <lcards-form-section
                    header="Apply"
                    description="What to change while the rule matches: an overlay ID (or selector) and its changes, as YAML."
                    icon="mdi:magic-staff"
                    ?expanded=${true}
                    ?outlined=${false}>

                    ${this._applyWarning?l`
                        <lcards-message type="warning">
                            Apply is empty: the rule will match but change nothing. Add at least one target.
                        </lcards-message>
                    `:""}

                    <lcards-rule-apply-editor
                        .hass=${this.hass}
                        .editor=${this.editor}
                        .value=${this._apply}
                        @value-changed=${e=>{this._apply=e.detail.value,this._applyWarning=false}}>
                    </lcards-rule-apply-editor>
                </lcards-form-section>

            </div>
        `}};h(j,"LCARdSRuleEditorDialog");let O=j;customElements.get("lcards-rule-editor-dialog")||customElements.define("lcards-rule-editor-dialog",O);const ee=`${B}/core/rules/`,te={new:"New: refresh if it has no effect",changed:"Changed: refresh to apply",removed:"Removed: refresh to apply"};function ae(d,e){const t=h(a=>Array.isArray(a)?a.map(t):a&&typeof a=="object"?Object.fromEntries(Object.keys(a).filter(r=>!r.startsWith("_")).sort().map(r=>[r,t(a[r])])):a,"canon");return JSON.stringify(t(d))===JSON.stringify(t(e))}h(ae,"sameRule");const ie=[["id","Rule"],["priority","Priority"],["enabled","Status"],["source","Source card"],["target","Target"],[null,"Conditions"],["actions","Changes"]],E=class E2 extends m{static get properties(){return{editor:{type:Object},cardId:{type:String},hass:{type:Object},_rules:{type:Array,state:true},_sortColumn:{type:String,state:true},_sortDirection:{type:String,state:true},_previewDialogOpen:{type:Boolean,state:true},_previewRule:{type:Object,state:true},_previewEditable:{type:Boolean,state:true},_previewError:{type:String,state:true},_editDialogOpen:{type:Boolean,state:true},_editingRule:{type:Object,state:true},_editMode:{type:String,state:true}}}constructor(){super(),this.editor=void 0,this.hass=void 0,this._rules=[],this._sortColumn="id",this._sortDirection="asc",this.cardId="",this._previewDialogOpen=false,this._previewRule=null,this._previewEditable=false,this._previewError="",this._refreshTimer=null,this._editDialogOpen=false,this._editingRule=null,this._editMode="add"}static get styles(){return[M,F,v`
            :host {
                display: block;
                padding: var(--ha-space-4) 0;
            }

            .rules-dashboard {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-3);
                --lcards-section-spacing: 0;
            }

            .empty {
                margin: 0;
            }

            /* The table on the black inset, so rows read clearly on any card background */
            .table-wrapper {
                overflow-x: auto;
                background: var(--primary-background-color);
                border-radius: var(--ha-border-radius-lg);
                padding: var(--ha-space-2) var(--ha-space-3);
            }

            .pending {
                margin-top: 2px;
                font-size: 12px;
                color: var(--warning-color);
            }

            ha-dialog.rule-details {
                --ha-dialog-width-md: min(900px, 95vw);
            }

            .rules-table {
                min-width: 100%;
                width: max-content;
                border-collapse: collapse;
                font-size: 13px;
            }

            .rules-table th {
                padding: var(--ha-space-2) var(--ha-space-3);
                text-align: left;
                font-weight: 600;
                font-size: 12px;
                color: var(--secondary-text-color);
                border-bottom: var(--ha-border-width-md) solid var(--divider-color);
                white-space: nowrap;
            }

            .rules-table th.sortable {
                cursor: pointer;
                user-select: none;
            }

            .rules-table th.sortable:hover,
            .rules-table th.sorted {
                color: var(--primary-text-color);
            }

            .rules-table th ha-icon {
                --mdc-icon-size: 14px;
                margin-left: var(--ha-space-1);
                opacity: 0.5;
            }

            .rules-table th.sorted ha-icon {
                opacity: 1;
            }

            .rules-table td {
                padding: var(--ha-space-2) var(--ha-space-3);
                border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
                white-space: nowrap;
                color: var(--primary-text-color);
            }

            .rules-table tr:last-child td {
                border-bottom: none;
            }

            .rules-table tbody tr:hover {
                background: color-mix(in srgb, var(--primary-text-color) 6%, transparent);
            }

            .rules-table tr.highlight {
                background: color-mix(in srgb, var(--primary-color) 12%, transparent);
                box-shadow: inset var(--ha-border-width-lg) 0 0 var(--primary-color);
            }

            .mono {
                font-family: var(--code-font-family, monospace);
            }

            .rule-id {
                font-weight: 600;
            }

            .sub {
                font-size: 12px;
                color: var(--secondary-text-color);
            }

            .muted {
                color: var(--secondary-text-color);
            }

            .status {
                display: inline-flex;
                align-items: center;
                gap: var(--ha-space-1);
            }

            .status-dot {
                width: 8px;
                height: 8px;
                border-radius: var(--ha-border-radius-circle);
                background: var(--error-color);
            }

            .status-dot.enabled {
                background: var(--success-color);
            }

            .stop-icon {
                --mdc-icon-size: 16px;
                color: var(--warning-color);
                vertical-align: middle;
                margin-left: var(--ha-space-1);
            }

            .row-actions {
                display: flex;
                align-items: center;
                justify-content: flex-end;
                --ha-icon-button-size: 32px;
                --mdc-icon-size: 18px;
                color: var(--primary-color);
            }

            .row-actions .danger {
                color: var(--error-color);
            }

            /* Rule details dialog */
            .details {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-3);
            }

            .details-inset {
                background: var(--primary-background-color);
                border-radius: var(--ha-border-radius-lg);
                padding: var(--ha-space-2) var(--ha-space-4);
            }

            .info-row {
                display: flex;
                justify-content: space-between;
                gap: var(--ha-space-4);
                padding: 6px 0;
                border-bottom: var(--ha-border-width-sm) solid var(--divider-color);
            }

            .info-row:last-child {
                border-bottom: none;
            }

            .info-row .label {
                font-weight: 500;
                color: var(--secondary-text-color);
            }

            .info-row .value {
                font-family: var(--code-font-family, monospace);
                text-align: right;
                overflow-wrap: anywhere;
            }

            .details ha-code-editor {
                --code-mirror-max-height: 40vh;
            }
        `]}connectedCallback(){super.connectedCallback(),this._loadRules()}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this._refreshTimer)}willUpdate(){this._loadRules()}_loadRules(){var t,a;const e=(a=(t=window.lcards)==null?void 0:t.core)==null?void 0:a.rulesManager;e&&typeof e.getAllRules=="function"?this._rules=[...e.getAllRules()||[]]:(f.warn("⚠️ [RulesDashboard] RulesManager not available or getAllRules not implemented"),this._rules=[])}_rows(){var s;const e=((s=this.editor)==null?void 0:s.config)??{},t=e.rules||[],a=new Set(t.map(n=>n.id)),r=new Map(this._rules.map(n=>[n.id,n])),i=[];for(const n of this._rules){if(a.has(n.id))continue;const o=this.cardId&&n._sourceCardId===this.cardId;i.push(o?{...n,_pending:"removed"}:n)}for(const n of t){const o=r.get(n.id);i.push({...n,_sourceCardId:(o==null?void 0:o._sourceCardId)??(this.cardId||"this card"),_sourceCardType:(o==null?void 0:o._sourceCardType)??`lcards-${R(e)}`,_pending:o?ae(o,n)?void 0:"changed":"new"})}return i}_isTargetingCard(e,t){return!e||!t?false:e.target===t||e.cardId===t||Array.isArray(e.target)&&e.target.includes(t)?true:e.tags&&Array.isArray(e.tags)?false:!!(e.apply&&e.apply.overlays&&Object.keys(e.apply.overlays).includes(t))}_isOwnedRule(e){var a,r;return e._pending==="removed"?false:(((r=(a=this.editor)==null?void 0:a.config)==null?void 0:r.rules)||[]).some(i=>i.id===e.id)}_handleAddRule(){this._editingRule=null,this._editMode="add",this._editDialogOpen=true}_handleEditRule(e){this._editingRule=typeof globalThis.structuredClone=="function"?globalThis.structuredClone(e):JSON.parse(JSON.stringify(e)),this._editMode="edit",this._editDialogOpen=true}async _handleDeleteRule(e){var r,i;if(!await L({title:`Delete ${e.id}?`,message:"It's removed from this card's config. Cards keep its effect until the page is refreshed."}))return;const a=((i=(r=this.editor)==null?void 0:r.config)==null?void 0:i.rules)||[];this._applyRulesChange(a.filter(s=>s.id!==e.id))}_handleToggleRule(e){var r,i;const a=(((i=(r=this.editor)==null?void 0:r.config)==null?void 0:i.rules)||[]).map(s=>s.id===e.id?{...s,enabled:s.enabled===false}:s);this._applyRulesChange(a)}_handleMoveUp(e){var r,i;const t=[...((i=(r=this.editor)==null?void 0:r.config)==null?void 0:i.rules)||[]],a=t.findIndex(s=>s.id===e.id);a<=0||([t[a-1],t[a]]=[t[a],t[a-1]],this._applyRulesChange(t))}_handleMoveDown(e){var r,i;const t=[...((i=(r=this.editor)==null?void 0:r.config)==null?void 0:i.rules)||[]],a=t.findIndex(s=>s.id===e.id);a<0||a>=t.length-1||([t[a],t[a+1]]=[t[a+1],t[a]],this._applyRulesChange(t))}_handleRuleSave(e){var r,i;const t=e.detail.rule,a=[...((i=(r=this.editor)==null?void 0:r.config)==null?void 0:i.rules)||[]];if(this._editMode==="add")a.push(t);else{const s=a.findIndex(n=>n.id===t.id);s>=0?a[s]=t:a.push(t)}this._applyRulesChange(a),this._editDialogOpen=false,this._editingRule=null}_handleRuleDialogClose(){this._editDialogOpen=false,this._editingRule=null}_applyRulesChange(e){this.editor&&(this.editor.config={...this.editor.config,rules:e},U(this.editor,"config-changed",{config:this.editor.config}),this.requestUpdate(),clearTimeout(this._refreshTimer),this._refreshTimer=setTimeout(()=>this.requestUpdate(),1e3))}_handleSort(e){this._sortColumn===e?this._sortDirection=this._sortDirection==="asc"?"desc":"asc":(this._sortColumn=e,this._sortDirection="asc"),this.requestUpdate()}_getSortedRules(e){const t=[...e],a=this._sortColumn,r=this._sortDirection;return t.sort((i,s)=>{let n,o;switch(a){case"id":n=i.id||"",o=s.id||"";break;case"type":n=i.type||"overlay",o=s.type||"overlay";break;case"priority":n=i.priority||0,o=s.priority||0;break;case"enabled":n=i.enabled!==false?1:0,o=s.enabled!==false?1:0;break;case"target":n=this._getRuleTargets(i),o=this._getRuleTargets(s);break;case"source":n=this._getSourceCard(i),o=this._getSourceCard(s);break;case"actions":n=this._getActionsCount(i),o=this._getActionsCount(s);break;default:return 0}return n<o?r==="asc"?-1:1:n>o?r==="asc"?1:-1:0}),t}_getConditionSummary(e){const t=e.when||e.conditions;if(!t)return"No conditions";const a=t.all?"all":t.any?"any":t.not?"not":null;if(a){const r=t[a],i=Array.isArray(r)?r.length:0;return`${a.toUpperCase()} (${i} condition${i!==1?"s":""})`}if(t.entity){let r=`entity: ${t.entity}`;return t.state&&(r+=`, state: ${t.state}`),t.above!==void 0&&(r+=`, above: ${t.above}`),t.below!==void 0&&(r+=`, below: ${t.below}`),r}return"Custom condition"}_getRuleTargets(e){if(e.target)return Array.isArray(e.target)?e.target.join(", "):e.target;if(e.apply&&e.apply.overlays){const t=Object.keys(e.apply.overlays);if(t.length>0)return t.join(", ")}return"Global"}_getActionsCount(e){if(e.actions&&Array.isArray(e.actions))return e.actions.length;if(e.apply){let t=0;return e.apply.overlays&&(t+=Object.keys(e.apply.overlays).length),e.apply.animations&&(t+=e.apply.animations.length),e.apply.base_svg&&(t+=1),t}return 0}_getSourceCard(e){if(e._sourceCardId)return e._sourceCardId;const t=this._getRuleTargets(e);return t&&t!=="Global"?t.split(", ")[0]:"Unknown"}_getSourceCardType(e){return e._sourceCardType||"unknown"}_ruleYaml(e){const t=Object.fromEntries(Object.entries(e).filter(([a])=>!a.startsWith("_")));return b([t])}_handleCopyYAML(e){I(this._ruleYaml(e)).then(t=>{t&&f.info("[RulesDashboard] Copied rule YAML to clipboard:",e.id)})}_handlePreview(e,t=false){this._previewRule=e,this._previewEditable=t,this._previewError="",this._previewDialogOpen=true}_closePreviewDialog(){this._previewDialogOpen=false,this._previewRule=null,this._previewError=""}_savePreviewYaml(){var i,s,n;const e=this.renderRoot.querySelector("ha-dialog.rule-details lcards-yaml-editor");(i=e==null?void 0:e.flush)==null||i.call(e);let t;try{t=N((e==null?void 0:e.value)??"")}catch(o){this._previewError=`YAML error: ${o.message}`;return}if(Array.isArray(t)&&(t=t[0]),!t||typeof t!="object"||typeof t.id!="string"||!t.id.trim()){this._previewError="A rule needs an id.";return}const a=[...((n=(s=this.editor)==null?void 0:s.config)==null?void 0:n.rules)||[]],r=a.findIndex(o=>o.id===this._previewRule.id);if(t.id!==this._previewRule.id&&a.some(o=>o.id===t.id)){this._previewError=`This card already has a rule with id ${t.id}.`;return}r>=0?a[r]=t:a.push(t),this._applyRulesChange(a),this._closePreviewDialog()}_renderRulesTable(e,t=false){const a=this._getSortedRules(e),r=h(i=>this._sortColumn!==i?"mdi:swap-vertical":this._sortDirection==="asc"?"mdi:arrow-up":"mdi:arrow-down","sortIcon");return l`
            <div class="table-wrapper">
                <table class="rules-table">
                    <thead>
                        <tr>
                            ${ie.map(([i,s])=>i?l`
                                <th class="sortable ${this._sortColumn===i?"sorted":""}"
                                    @click=${()=>this._handleSort(i)}>
                                    ${s}<ha-icon icon=${r(i)}></ha-icon>
                                </th>
                            `:l`<th>${s}</th>`)}
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${a.map(i=>{const s=i.enabled!==false,n=this._getActionsCount(i);return l`
                                <tr class=${t&&this._isTargetingCard(i,this.cardId)?"highlight":""}>
                                    <td class="mono rule-id">${i.id||"-"}</td>
                                    <td class="mono">
                                        ${i.priority??0}
                                        ${i.stop===true?l`<ha-icon class="stop-icon" icon="mdi:octagon" title="Stops lower-priority rules"></ha-icon>`:g}
                                    </td>
                                    <td>
                                        <span class="status">
                                            <span class="status-dot ${s?"enabled":""}"></span>
                                            ${s?"Enabled":"Disabled"}
                                        </span>
                                        ${i._pending?l`<div class="pending">${te[i._pending]}</div>`:g}
                                    </td>
                                    <td>
                                        <div class="mono">${this._getSourceCard(i)}</div>
                                        <div class="sub">${this._getSourceCardType(i)}</div>
                                    </td>
                                    <td class="mono muted">${this._getRuleTargets(i)}</td>
                                    <td class="muted">${this._getConditionSummary(i)}</td>
                                    <td>${n}</td>
                                    <td>${this._renderRowActions(i,s)}</td>
                                </tr>
                            `})}
                    </tbody>
                </table>
            </div>
        `}_renderRowActions(e,t){const a=h((r,i,s,n="")=>l`
            <ha-icon-button class=${n} .label=${r} title=${r} @click=${s}>
                <ha-icon icon=${i}></ha-icon>
            </ha-icon-button>
        `,"button");return l`
            <div class="row-actions">
                ${this._isOwnedRule(e)?a("Edit as YAML","mdi:code-braces",()=>this._handlePreview(e,true)):a("View rule","mdi:eye",()=>this._handlePreview(e))}
                ${a("Copy rule YAML","mdi:content-copy",()=>this._handleCopyYAML(e))}
                ${this._isOwnedRule(e)?l`
                    ${a("Edit rule","mdi:pencil",()=>this._handleEditRule(e))}
                    ${a(t?"Disable rule":"Enable rule",t?"mdi:toggle-switch":"mdi:toggle-switch-off",()=>this._handleToggleRule(e))}
                    ${a("Move up","mdi:arrow-up",()=>this._handleMoveUp(e))}
                    ${a("Move down","mdi:arrow-down",()=>this._handleMoveDown(e))}
                    ${a("Delete rule","mdi:delete",()=>this._handleDeleteRule(e),"danger")}
                `:g}
            </div>
        `}_renderPreviewDialog(){if(!this._previewRule)return g;const e=this._previewRule,t=this._previewEditable,a=this._getActionsCount(e),r=Object.fromEntries(Object.entries(e).filter(([s])=>!s.startsWith("_"))),i=[["Source card",`${this._getSourceCard(e)} (${this._getSourceCardType(e)})`],["Target",this._getRuleTargets(e)],["Conditions",this._getConditionSummary(e)],["Changes",`${a} change${a!==1?"s":""}`]];return l`
            <ha-dialog
                class="rule-details"
                .open=${this._previewDialogOpen}
                ?prevent-scrim-close=${t}
                @closed=${s=>{s.stopPropagation(),s.target===s.currentTarget&&this._closePreviewDialog()}}
                header-title=${t?`Edit ${e.id} as YAML`:e.id||"Rule"}>
                <div class="details">
                    <div class="details-inset">
                        ${i.map(([s,n])=>l`
                            <div class="info-row"><span class="label">${s}</span><span class="value">${n}</span></div>
                        `)}
                    </div>
                    ${t?l`<p class="hint">The whole rule: id, when, apply, priority, ... Ctrl+Space lists what can go next.</p>`:g}
                    <lcards-yaml-editor
                        .hass=${this.hass}
                        .schema=${X(z(this.editor))}
                        .value=${b(r)}
                        .readOnly=${!t}>
                    </lcards-yaml-editor>
                    ${this._previewError?l`<div class="banner error">${this._previewError}</div>`:g}
                </div>
                <div slot="footer">
                    <ha-button appearance="plain" @click=${()=>this._handleCopyYAML(e)}>
                        <ha-icon icon="mdi:content-copy" slot="start"></ha-icon>
                        Copy YAML
                    </ha-button>
                    ${t?l`
                        <ha-button appearance="plain" data-dialog="close">Cancel</ha-button>
                        <ha-button variant="brand" @click=${()=>this._savePreviewYaml()}>
                            <ha-icon icon="mdi:check" slot="start"></ha-icon>
                            Save
                        </ha-button>
                    `:l`<ha-button appearance="plain" data-dialog="close">Close</ha-button>`}
                </div>
            </ha-dialog>
        `}render(){const e=this._rows(),t=e.filter(i=>i._pending!=="removed"&&this._isTargetingCard(i,this.cardId)),a=e.filter(i=>i._pending!=="removed"),r=a.filter(i=>i.enabled!==false).length;return l`
            <div class="rules-dashboard">
                ${K({icon:"mdi:format-list-checks",title:"Rules",description:"Rules change cards' settings while their conditions are met, on any card on the page.",stats:[{value:t.length,label:"targeting this card"},{value:a.length,label:"on this page"},{value:r,label:"enabled"}],actions:[{label:"Add rule",icon:"mdi:plus",onClick:h(()=>this._handleAddRule(),"onClick")},{label:"Rules guide",icon:"mdi:book-open-variant",onClick:h(()=>window.open(ee,"_blank","noopener"),"onClick")}]})}

                <div class="banner info refresh-notice">
                    <ha-icon icon="mdi:information-outline"></ha-icon>
                    New rules apply right away. Changes to an existing rule, or removing one, apply after a page refresh.
                </div>

                <lcards-form-section
                    header="Rules targeting this card"
                    icon="mdi:target"
                    ?expanded=${true}>
                    ${t.length>0?this._renderRulesTable(t):l`<p class="hint empty">No rules target this card. Add one above, or write them on the YAML tab.</p>`}
                </lcards-form-section>

                <lcards-form-section
                    header="All rules on this page"
                    description="Rules that target this card are highlighted."
                    icon="mdi:format-list-bulleted"
                    ?expanded=${false}>
                    ${e.length>0?this._renderRulesTable(e,true):l`<p class="hint empty">No rules are registered on this page.</p>`}
                </lcards-form-section>
            </div>

            ${this._renderPreviewDialog()}
            ${this._renderEditDialog()}
        `}_renderEditDialog(){return l`
            <lcards-rule-editor-dialog
                .hass=${this.hass}
                .mode=${this._editMode}
                .rule=${this._editingRule}
                .open=${this._editDialogOpen}
                .editor=${this.editor}
                @save=${this._handleRuleSave}
                @cancel=${this._handleRuleDialogClose}>
            </lcards-rule-editor-dialog>
        `}};h(E,"LCARdSRulesDashboard");let k=E;customElements.get("lcards-rules-dashboard")||customElements.define("lcards-rules-dashboard",k);
//# sourceMappingURL=lcards-rules-dashboard-BO-ELZ5v.js.map
