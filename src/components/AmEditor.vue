/* copyright 2018, stefano bovio @allyoucanmap. */

<style scoped>
    .am-editor {
        display: flex;
        flex-direction: column;
    }
    .am-editor .am-head {
        display: flex;
        flex-direction: row-reverse;
        padding: 8px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    }
    .am-editor .am-head button {
        margin-left: 4px;
    }
    .am-editor .am-body {
        flex: 1;
        overflow-y: auto;
    }
    .am-add-filter {
        width: 100%;
        height: 24px;
        display: flex;
        margin-bottom: 8px;
    }
    .am-add-filter button {
        margin: auto;
        margin-right: 0;
    }
    .am-placeholder {
        font-size: 50px;
        margin: auto;
        padding: 0 15px;
        font-family: icone;
        color: #ddd;
    }
</style>

<template lang="html">
    <div class="am-editor">
        <div
            class="am-head"
            v-if="selectedLayer.id">
            <button
                class="am-icon"
                v-for="(tool, idx) in toolbar"
                :key="idx"
                @click="() => $am_addSymbolizer(tool.symbol)">
                {{ tool.icon }}
            </button>
        </div>
        <div
            class="am-body"
            v-if="selectedLayer.id"
            :key="selectedLayer.id + 'body'">
            <am-panel head="General">
                <am-input-group
                    v-for="(info, infoId) in general"
                    :key="infoId"
                    :label="info.name"
                    :value="info.value"
                    :type="{format: 'text'}"
                    :on-change="value => $am_onChangeGeneral(info.name, value)"/>
            </am-panel>

            <am-panel head="Filter">
                <am-filter
                    :filters="filters"
                    :on-change="$am_onChangeFilter"/>
            </am-panel>

            <am-panel
                v-for="(symbol, symbolId) in rule"
                :key="symbolId"
                :head="symbol._"
                :on-remove="() => $am_onRemove(symbolId)">
                <am-input-group
                    v-for="(param, valueId) in symbolizers[symbol._]"
                    :key="valueId"
                    :value="symbol[param]"
                    :default-option="types[param] && types[param].base"
                    :label="param.replace('-', ' ')"
                    :type="types[param]"
                    :on-change="value => $am_onChange(symbolId, param, value)"/>
            </am-panel>
        </div>
        <div
            class="am-placeholder"
            v-if="!selectedLayer.id">
            E22C
        </div>
    </div>
</template>

<script>
    import {head, isEqual} from 'lodash';
    import AmPanel from './panel/AmPanel.vue';
    import AmInputGroup from './input/AmInputGroup.vue';
    import AmFilter from './form/AmFilter.vue';
    import {types, symbolizers, styleFunctions, filtersFunctions} from '../utils/SLDUtils';
    import xml2js from 'xml2js';
    import {mapActions, mapGetters} from 'vuex';

    const xmlBuilder = new xml2js.Builder({
        xmldec: {
            version: '1.0',
            encoding: 'ISO-8859-1',
            standalone: false
        },
        renderOpts: {
            pretty: false,
            indent: '',
            newline: ''
        }
    });

    export default {
        components: {
            AmPanel,
            AmInputGroup,
            AmFilter
        },
        data() {
            return {
                types,
                symbolizers,
                general: [],
                testValue: '',
                filters: {
                    type: 'group',
                    operator: 'AND',
                    rules: []
                },
                rule: [],
                scales: {},
                toolbar: [
                    {
                        icon: '2',
                        symbol: 'TextSymbolizer'
                    },
                    {
                        icon: 'Y',
                        symbol: 'PolygonSymbolizer'
                    },
                    {
                        icon: 'R',
                        symbol: 'LineSymbolizer'
                    },
                    {
                        icon: 'C',
                        symbol: 'PointSymbolizer'
                    }
                ]
            };
        },
        computed: {
            ...mapGetters({
                selectedLayer: 'app/selectedLayer',
                layers: 'app/layers',
                projectName: 'app/projectName'
            })
        },
        watch: {
            filters(newFilters, oldFilters) {
                if (this.selectedLayer.id && !isEqual(newFilters, oldFilters)) {
                    this.$am_onUpdateSLD(this.general, newFilters, this.rule, this.scales);
                }
            },
            rule(newRule, oldRule) {
                if (this.selectedLayer.id && !isEqual(newRule, oldRule)) {
                    this.$am_onUpdateSLD(this.general, this.filters, newRule, this.scales);
                }
            },
            general(newGeneral, oldGeneral) {
                if (this.selectedLayer.id && !isEqual(newGeneral, oldGeneral)) {
                    this.$am_onUpdateSLD(newGeneral, this.filters, this.rule, this.scales);
                }
            },
            scales(newScales, oldScales) {
                if (this.selectedLayer.id && !isEqual(newScales, oldScales)) {
                    this.$am_onUpdateSLD(this.general, this.filters, this.rule, newScales);
                }
            },
            selectedLayer(newLayer, oldLayer) {
                if (!isEqual(newLayer, oldLayer)) {
                    this.general = newLayer.general || [
                        {
                            name: 'Name',
                            value: newLayer.label
                        },
                        {
                            name: 'Title',
                            value: undefined
                        },
                        {
                            name: 'Abstract',
                            value: undefined
                        }
                    ];
                    this.filters = newLayer.filters || {
                        type: 'group',
                        operator: 'AND',
                        rules: []
                    };
                    this.rule = newLayer.rule || [];
                    this.scales = newLayer.scales || {}
                }
            }
        },
        methods: {
            $am_testFilter(value) {
                this.testValue = {...value};
            },
            ...mapActions({
                $am_updateSLD: 'app/updateStyle'
            }),
            $am_onChangeGeneral(key, value) {
                if (key) {
                    const general = this.general.map((info) => info.name === key ? {...info, value} : {...info});
                    this.general = general;
                }
            },
            $am_onChange(symbolId, key, value) {
                if (key) {
                    const rule = this.rule.map((symbol, idx) => idx === symbolId ? {...symbol, [key]: value} : {...symbol});
                    this.rule = [...rule];
                }
            },
            $am_addSymbolizer(symbol) {
                const rule = [...this.rule, { _: symbol}];
                this.rule = [...rule];
            },
            $am_onRemove(symbolId) {
                const rule = this.rule.filter((symbol, id) => id !== symbolId);
                this.rule = [...rule];
            },
            $am_onChangeFilter(filters) {
                this.filters = {...filters};
            },
            $am_generateRules(currentFilter) {
                return this.layers
                    .filter(({general, filters, rule, name}) =>
                        general && filters && rule && name === this.selectedLayer.name)
                    .map(layer => {
                        const {general, filters, rule, scales} = this.selectedLayer.id === layer.id ? currentFilter : layer;
                        const sldSymbolizers = rule && rule
                        .map((symbol) => styleFunctions[symbol._] && styleFunctions[symbol._](symbol))
                        .reduce((json, symbol) => {
                            const key = head(Object.keys(symbol));
                            return key && {...json, ...(symbol[key] ? {[key]: json[key] && [...json[key], symbol[key]] || [symbol[key]]} : {}) } || {...json};
                        }, {}) || {};
                        const sldInfoRule = general.reduce((infoRule, info) => info.value && {...infoRule, [info.name]: [info.value]} || {...infoRule}, {});    
                        const filterRule = filtersFunctions.filters([filters]);
                        const scalesDenominators = filtersFunctions.scalesDenominators(scales);
                        return {...sldInfoRule, ...filterRule, ...scalesDenominators, ...sldSymbolizers};
                    });
            },
            $am_onUpdateSLD(general, filters, rule, scales) {
                const styledLayerDescriptor = styleFunctions.StyledLayerDescriptor(this.selectedLayer.name, this.selectedLayer.name, this.selectedLayer.name, [...this.$am_generateRules({general, filters, rule, scales})]);
                const sld = xmlBuilder.buildObject(styledLayerDescriptor).replace(/\<\$_am\>|<\/\$_am\>/g, '');
                this.$am_updateSLD({
                    name: this.projectName + (this.selectedLayer.style || this.selectedLayer.name) + '~ecco~style',
                    sld,
                    general: [...general],
                    filters: {...filters},
                    rule: [...rule]
                });
            }
        }
    };
</script>