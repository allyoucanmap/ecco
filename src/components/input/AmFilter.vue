/* copyright 2018, stefano bovio @allyoucanmap. */

<style scoped>
    .am-selector {
        display: flex;
    }
    .am-selector + .am-selector{
        margin-top: 8px;
    }
    .am-selector input {
        flex: 1;
        height: 24px;
        text-align: center;
    }
    .am-selector button {
        height: 24px;
    }
    .am-selector .am-operator {
        border-left: none;
        border-right: none;
    }
    .am-selector .am-add-filter {
        border-left: none;
        width: 24px;
    }
    .am-operator-selector {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        padding: 8px;
        background-color: rgba(0, 0, 0, 0.1);
        z-index: 20;
    }
    .am-operator-selector > div {
        margin: auto;
    }

    .am-operator-selector > div > button {
        float: left;
    }
    .am-operator-selector > div > button + button {
        border-left: none;
    }
    .am-operator + .am-add-filter {
        border-left: 1px solid rgba(0, 0, 0, 0.12);
    }
</style>

<template lang="html">
    <div class="am-selector">
        <input
            :value="param"
            @change="event => $am_onChange('param', event.target.value)">
        <button
            class="am-operator"
            @click="() => selectOp = !selectOp">
            {{ operator }}
        </button>
        <input
            v-if="!hideValue"
            :value="value"
            @change="event => $am_onChange('value', event.target.value)">
        <button
            class="am-add-filter am-icon"
            v-if="onRemove"
            @click="() => onRemove()">
            X
        </button>
        <div
            class="am-operator-selector"
            v-if="selectOp"
            @click="() => selectOp = false">
            <div>
                <button
                    v-for="(key, operatorId) in Object.keys(operators)"
                    :key="operatorId"
                    @click="() => { operator = key; selectOp = false;}">
                    {{ key }}
                </button>
            </div>
        </div>
    </div>
</template>

<script>
    import {operators} from '../../utils/SLDUtils';

    export default {
        props: {
            filter: {
                type: Object,
                default: () => ({})
            },
            onRemove: {
                type: Function,
                default: null
            },
            onChange: {
                type: Function,
                default: null
            }
        },
        data(){
            return {
                param: '',
                value: '',
                operator: '',
                operators,
                selectOp: false,
                hideValue: false
            }
        },
        watch: {
            param(param) {
                this.onChange('param', param);
            },
            value(value) {
                this.onChange('value', value);
            },
            operator(operator) {
                this.hideValue = operators[operator] && operators[operator].hideValue;
                this.onChange('operator', operator);
            },
            filter(filter) {
                if (filter) {
                    this.operator = filter.operator;
                    this.param = filter.param;
                    this.value = filter.value;
                }
            }
        },
        created() {
            if (this.filter) {
                this.operator = this.filter.operator;
                this.param = this.filter.param;
                this.hideValue = operators[this.operator] && operators[this.operator].hideValue;
                this.value = this.filter.value; 
            }
        },
        methods: {
            $am_onChange(key, value) {
                this[key] = value;
            }
        }
    };
</script>