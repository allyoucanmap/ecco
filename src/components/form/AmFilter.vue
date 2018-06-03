/* copyright 2018, stefano bovio @allyoucanmap. */

<style scoped>
    .am-filter-field {
        display: flex;
        
    }
    .am-filter-field > div:last-child {
        flex: 1;
    }
    .am-filter-field + .am-filter-field {
        margin-top: 8px;
    }
    .am-add-filter {
        display: flex;
        flex-direction: row-reverse;
        margin-bottom: 8px;
    }
    .am-add-filter button {
        height: 24px;
        min-width: 24px;
        border-left: none;
    }
    .am-filter-head {
        display: flex;
    }
    .am-filter-head > div:first-child {
        flex: 1;
    }
    .am-filter-field-line {
        width: 24px;
        height: 12px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.12);
        border-left: 1px solid rgba(0, 0, 0, 0.12);
    }
</style>

<template lang="html">
    <div class="am-filter-container">
        <div class="am-filter-head">
            <am-input-group
                key="operators"
                label=" "
                :active="true"
                :type="options"
                :value="filters.operator"
                :on-change="$am_onChangeOperator"/>
            <div class="am-add-filter">
                <button
                    v-if="id !== undefined"
                    class="am-icon"
                    @click="() => $am_onRemoveFilter(id, 'group')">
                    X
                </button>
                <button
                    class="am-icon"
                    @click="() => $am_onAddFilter('input')">
                    P
                </button>
                <button
                    class="am-icon"
                    @click="() => $am_onAddFilter('group')">
                    H
                </button>
            </div>
        </div>
        <div
            class="am-filter-field"
            v-for="(filter, filterId) in filters.rules"
            :key="filterId">
            <div class="am-filter-field-line"/>
            <am-filter-input
                v-if="filter.type === 'input'"
                :filter="filter"
                :on-remove="() => $am_onRemoveFilter(filterId, 'input')"
                :on-change="(param, value) => $am_onChangeFilter(filterId, {param, value}, 'input')"/>
            <am-filter
                v-if="filter.type === 'group'"
                :id="filterId"
                :filters="filter"
                :on-change="values => $am_onChangeFilter(filterId, values, 'group')"/>
        </div>
        
    </div>
</template>

<script>
    import AmFilterInput from '../input/AmFilter.vue';
    import AmInputGroup from '../input/AmInputGroup.vue';
    import {isNil} from 'lodash';

    export default {
        name: 'AmFilter',
        components: {
            AmFilterInput,
            AmInputGroup 
        },
        props: {
            id: {
                type: Number,
                default: undefined
            },
            filters: {
                type: Object,
                default: () => ({})
            },
            onChange: {
                type: Function,
                default: () => {}
            }
        },
        data() {
            return {
                options: {
                    format: 'select',
                    base: 'AND',
                    options: ['AND', 'OR']
                }
            };
        },
        methods: {
            $am_onAddFilter(type) {
                const filters = type === 'input' ? 
                {
                    ...this.filters,
                    rules: [
                        ...this.filters.rules,
                        {
                            type: 'input',
                            param: '',
                            value: '',
                            operator: '=='
                        }
                    ]
                } :
                {
                    ...this.filters,
                    rules: [
                        ...this.filters.rules,
                        {
                            type: 'group',
                            operator: 'AND',
                            rules: []
                        }
                    ]
                };
                this.onChange({...filters});
            },
            $am_onRemoveFilter(filterId, type) {
                const filters = type === 'input' ?
                {
                    ...this.filters,
                    rules: this.filters.rules.filter((filter, id) => id !== filterId)
                } :
                {
                    ...this.filters,
                    deleted: true
                };
                this.onChange({...filters});
            },
            $am_onChangeFilter(filterId, obj, type) {
                const filters =  type === 'input' ?
                {
                    ...this.filters,
                    rules: this.filters.rules.map((filter, id) => id !== filterId ? {...filter} : {...filter, [obj.param]: obj.value})
                } :
                {
                    ...this.filters,
                    rules: this.filters.rules.map((filter, id) => id !== filterId ? {...filter} : !obj.deleted ? {...obj} : null).filter(v => !isNil(v))
                };
                this.onChange({...filters});
            },
            $am_onChangeOperator(operator) {
                const filters = {...this.filters, operator};
                this.onChange({...filters});
            }
        }
    };
</script>