/* copyright 2018, stefano bovio @allyoucanmap. */

<style scoped>
    .am-head {
        display: flex;
        margin-bottom: 4px;
    }
    .am-head input {
        flex: 1;
    }
    .am-filed {
        display: flex;
    }
    .am-transformation-filter > .am-input {
        margin-bottom: 4px;
    }
    .am-filed input {
        flex: 1;
    }
    .am-filed + .am-filed input {
        border-top: none;
    }
    input + input {
        border-left: none;
    }
    button {
        min-width: 24px;
        height: 24px;
        border-left: none; 
    }
    .am-btn-top {
        border-top: none;
    }
</style>

<template lang="html">
    <div class="am-transformation-filter">
        <div class="am-head">
            <input
                :value="name"
                @change="event => $am_onChangeName(event.target.value)">
            <button
                v-if="onToggle"
                class="am-icon"
                @click="() => onToggle()">
                8
            </button>
        </div>
        <am-input
            :value="type"
            format="select"
            :options="['recode', 'categorize', 'interpolate']"
            default-option="recode"
            :on-change="option => $am_onSelect(option)"/>
        <div
            class="am-filed"
            v-for="(field, idx) in list"
            :key="idx">
            <input
                v-if="field.literal !== undefined"
                :value="field.literal"
                @change="event => $am_onChange(idx, 'literal', event.target.value)">
            <am-input
                :compact="true"
                :value="field.value"
                :format="format"
                :options="options"
                :range="range"
                :default-option="defaultOption"
                :on-change="val => $am_onChange(idx, 'value', val)"/>
            <button
                class="am-btn-top am-icon"
                v-if="type !== 'categorize' && idx !== 0 || type === 'categorize' && idx !== list.length - 1 && idx !== 0"
                @click="() => $am_onRemove(idx)">
                X
            </button>
            <button
                v-if="idx === 0"
                class="am-icon"
                @click="() => $am_onAdd()">
                P
            </button>
        </div>
    </div>
</template>

<script>

    import {isNil, isEqual, isObject} from 'lodash';
    import AmInput from './AmInput.vue';

    export default {
        components: {
            AmInput
        },
        props: {
            value: {
                type: [Object, Number, String],
                default: () => ({})
            },
            onChange: {
                type: Function,
                default: () => {}
            },
            onToggle: {
                type: Function,
                default: null
            },
            format: {
                type: String,
                default: 'color'
            },
            options: {
                type: Array,
                default: () => []
            },
            range: {
                type: Object,
                default: () => ({})
            },
            defaultOption: {
                type: String,
                default: ''
            }
        },
        data() {
            return {
                name: '',
                list: [{
                    literal: '',
                    value: ''
                }],
                type: 'recode'
            };
        },
        watch: {
            name(name) {
                if (!isNil(name)) {
                    this.onChange({
                        name,
                        list: [...this.list],
                        type: this.type
                    });
                }
            },
            value(newValue, oldValue) {
                if (!isEqual(newValue, oldValue)) {
                    this.$am_getValue(newValue);
                }
            }
        },
        created() {
            this.$am_getValue(this.value);
        },
        methods: {
            $am_getValue(value) {
                this.name = isObject(value) && value.name || '';
                this.list = isObject(value) && value.list || [{
                    literal: '',
                    value: ''
                }];
                this.type = isObject(value) && value.type || 'recode';
            },
            $am_onChange(idx, key, value) {
                const list = this.list.map((field, fieldId) => idx === fieldId ? {...field, [key]: value} : {...field});
                this.onChange({
                    name: this.name,
                    list,
                    type: this.type
                });
            },
            $am_onSelect(type) {
                const list = type !== 'categorize' ? [{
                    literal: '',
                    value: ''
                }] : [{
                    literal: '',
                    value: ''
                }, {
                    value: ''
                }];
                this.type = type;
                this.onChange({
                    name: this.name,
                    list,
                    type
                });
            },
            $am_onAdd() {
                const list = [{
                    literal: '',
                    value: ''
                }, ...this.list];
                this.onChange({
                    name: this.name,
                    list,
                    type: this.type
                });
            },
            $am_onRemove(idx) {
                const list = this.list.filter((field, fieldId) => fieldId !== idx);
                this.onChange({
                    name: this.name,
                    list,
                    type: this.type
                });
            },
            $am_onChangeName(name) {
                this.name = name;
            }
        }
    };
</script>