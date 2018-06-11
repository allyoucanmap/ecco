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
            v-if="selectedLayer.id && selectedLayer.type === 'layer'">
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
            <am-panel
                v-if="selectedLayer.type === 'layer'"
                head="General">
                <am-input-group
                    v-for="(info, infoId) in general"
                    :key="infoId"
                    :label="info.name"
                    :value="info.value"
                    :type="{format: 'text'}"
                    :on-change="value => $am_onChangeGeneral(info.name, value)"/>
            </am-panel>

            <am-panel
                v-if="selectedLayer.type === 'layer'"
                head="Filter">
                <am-filter
                    :filters="filters"
                    :on-change="$am_onChangeFilter"/>
            </am-panel>

            <am-panel
                v-if="selectedLayer.type === 'layer'"
                head="Scales">
                <am-input-group
                    label="min-scale-denominator"
                    :type="{format: 'text'}"
                    :value="scalesDenominator.minScaleDenominator"
                    :on-change="value => $am_onChangeScale('minScaleDenominator', 'maxZoom', value)"/>
                <am-input-group
                    
                    label="max-scale-denominator"
                    :type="{format: 'text'}"
                    :value="scalesDenominator.maxScaleDenominator"
                    :on-change="value => $am_onChangeScale('maxScaleDenominator', 'minZoom', value)"/>
            </am-panel>

            <am-sortable-list
                :items="rule.map((symbol, id) => ({
                    panel: true,
                    id: 'rule:' + symbol._id,
                    expanded: symbol._expanded,
                    head: symbol._,
                    _id: symbol._id, 
                    _: symbol._, 
                    params: symbolizers[symbol._].map(param => ({
                        value: symbol[param],
                        label: param.replace('-', ' '),
                        option: types[param] && types[param].base,
                        type: types[param],
                        name: param
                    }))
                }))"
                :on-change="(items) => $am_onChange(items)"/>
        </div>
        <div
            class="am-placeholder"
            v-if="!selectedLayer.id">
            E22C
        </div>
    </div>
</template>

<script>
    import {isEqual, isNil, isEmpty} from 'lodash';
    import AmPanel from './panel/AmPanel.vue';
    import AmInputGroup from './input/AmInputGroup.vue';
    import AmSortableList from './list/AmSortableList.vue';
    import AmFilter from './form/AmFilter.vue';
    import {types, symbolizers} from '../utils/SLDUtils';
    import {mapActions, mapGetters} from 'vuex';
    import {getSLD} from '../utils/SLDUtils';
    import uuidv1 from 'uuid/v1';

    export default {
        components: {
            AmPanel,
            AmInputGroup,
            AmFilter,
            AmSortableList
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
                projectName: 'app/projectName',
                scalesDenominator: 'app/scalesDenominator',
                scalesRound: 'app/scalesRound',
                zoom: 'app/zoom',
                items: 'app/items'
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
                    this.general = newLayer.general || newLayer.type === 'layer' && [
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
                    this.rule = newLayer.rule || newLayer.type === 'layer' && [] || [
                        {
                            _: 'FeatureTypeStyle',
                            _id: uuidv1(),
                            label: newLayer.label
                        }
                    ];
                    this.scales = newLayer.scales || {}
                }
            }
        },
        methods: {
            ...mapActions({
                $am_updateSLD: 'app/updateStyle',
                setZoom: 'app/setZoom',
                updateLayers: 'app/updateLayers',
                updateAllSLD: 'app/updateAllSLD',
            }),
            $am_onChangeGeneral(key, value) {
                if (key) {
                    const general = this.general.map((info) => info.name === key ? {...info, value} : {...info});
                    this.general = general;
                }
            },
            $am_parseParams(params) {
                return (params || [])
                    .filter(param => param && !isNil(param.name) && !isNil(param.value))
                    .reduce((newParams, param) => {
                        return {
                            ...newParams,
                            [param.name]: param.value
                        };
                    }, {});
            },
            $am_onChange(items) {
                const rule = items.map(item => ({_id: item._id, _: item._, _expanded: item.expanded, ...this.$am_parseParams(item.params || [])}));
                this.rule = [...rule];
            },
            $am_addSymbolizer(symbol) {
                const rule = [...this.rule, {_id: uuidv1(), _: symbol}];
                this.rule = [...rule];
            },
            $am_onChangeFilter(filters) {
                this.filters = {...filters};
            },
            $am_onChangeScale(key, zoom, value) {
                const scale = parseFloat(value);
                this.setZoom({
                    layerId: this.selectedLayer.id,
                    scales: {
                        ...this.scalesDenominator,
                        [key]: scale,
                        [zoom]: this.$am_nearIndex(scale)
                    },
                    currentZoom: Math.round(this.zoom)
                })
                
            },
            $am_onUpdateSLD(general, filters, rule, scales) {
                if (this.selectedLayer.type === 'layer') {
                    const sldObj = getSLD(this.items, this.selectedLayer.name, this.selectedLayer.id, {general, filters, rule, scales});
                    const sld = sldObj[this.selectedLayer.name];
                    
                    if (sld) {
                        this.$am_updateSLD({
                            name: this.projectName + this.selectedLayer.name + '~ecco~style',
                            sld,
                            general: [...general],
                            filters: {...filters},
                            rule: [...rule]
                        });
                    }
                } else {
                    const label = rule[0] && rule[0].label;
                    const items = this.items.map(item => item.id === this.selectedLayer.id ? {...item, label, rule} : {...item});
                    const layers = items.filter(item => item.groupId === this.selectedLayer.id).map(item => item.name).filter(name => !isNil(name));
                    const sld = getSLD(items);
                    const filteredSld = layers.reduce((newSld, name) => {
                        return {
                            ...newSld,
                            [name]: sld[name]
                        };
                    }, {});
                    if (!isEmpty(filteredSld)) {
                        this.updateAllSLD(filteredSld);
                    }
                    
                    this.updateLayers([...items]);
                }
            },
            $am_nearIndex(scale) {
                const scaleValue = scale && this.scalesRound.reduce((previous, current) => {
                    return Math.abs(current - scale) < Math.abs(previous - scale) ? current : previous;
                });
                return this.scalesRound.indexOf(scaleValue);
            }
        }
    };
</script>