/* copyright 2018, stefano bovio @allyoucanmap. */

<style scoped>
    .am-list ul {
        list-style-type: circle;
        padding-right: 8px;
    }
    .am-list .am-item {
        font-size: 14px;
        margin: 4px;
        padding: 4px 0;
        display: flex;
        align-items: center;
        box-sizing: border-box;
        border: 1px solid rgba(0, 0, 0, 0.12);
    }
    .am-list .am-item.am-selected {
        background-color: #91f3f7;
    }
    .am-list .am-item.am-selected > div {
        color: #333333;
    }
    .am-list .am-item > div {
        height: 100%;
        padding: 0 4px;
    }
    .am-name {
        flex: 1;
    }
    .am-list .am-item + .am-item {
        border-top: 1px solid rgba(0, 0, 0, 0.12);
    }
    .am-list {
        display: flex;
        flex-direction: column;
    }
    .am-list .am-head {
        padding: 8px;
        display: flex;
        flex-direction: row-reverse;
        border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    }
    .am-list .am-head button + button {
        margin-right: 4px;
    }
    .am-list .am-body {
        flex: 1;
        overflow-y: auto;
    }
    .am-modal-container {
        display: flex;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 2000;
        background-color: rgba(0, 0, 0, 0.5);
    }
    .am-modal {
        margin: auto;
        background: #f2f2f2;
        padding: 8px;
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.24);
    }
    .am-field {
        display: flex;
    }
    .am-field > .am-label {
        width: 50px;
    }
    .am-field + .am-field {
        margin-top: 4px;
    }
    
    .am-field > input {
        flex: 1;
    }
    .am-footer {
        padding: 8px 0;
        display: flex;
        flex-direction: row-reverse;
    }
    .am-color-picker {
        top: 0;
        left: 0;
        position: absolute;
        z-index: 500;
        display: flex;
        width: 100%;
        height: 100%;
    }
    .am-color-picker .vc-chrome {
        box-shadow: 0 3px 6px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.24);
        border-radius: 0;
        margin: auto;
    }
    .am-disabled {
        pointer-events: none;
    }
</style>

<template lang="html">
    <div class="am-list">
        
        <div class="am-head">
            <button
                class="inverse am-icon"
                @click="() => $am_openModal('group')">
                I
            </button>
            <button
                class="am-icon"
                @click="() => $am_openModal('layer')">
                P
            </button>
            <button
                class="am-icon"
                @click="() => enablePicker = true">
                D
            </button>
        </div>
        <div class="am-body">
            <am-sortable-list
                :items="items"
                :selected-item="selectedLayer"
                :on-change="items => $am_updateLayers(items)"
                :on-select="itemId => $am_selectLayer(itemId)"/>
        </div>
        <div
            v-if="add"
            class="am-modal-container">
            <div class="am-modal">
                <div class="am-footer">
                    <button
                        class="am-icon"
                        @click="() => add = false">
                        X
                    </button>
                </div>
                <div
                    class="am-field"
                    v-for="(field, idx) in form"
                    :key="idx">
                    <div
                        class="am-label" 
                        v-if="(field.family === type || !field.family)">
                        <small>{{ field.name }}</small>
                    </div>
                    <input
                        v-if="(field.family === type || !field.family) && !field.type"
                        :placeholder="field.name"
                        v-model="field.value">
                    <am-dropdown
                        v-if="(field.family === type || !field.family) && field.type === 'dropdown'"
                        :value="field.value"
                        :options="layers"
                        :on-change="value => $am_onChange(idx, value)"/>
                </div>
                <div class="am-footer">
                    <button
                        :class="`am-icon ${type === 'layer' && form[0] && !form[0].value && 'am-disabled' || ''}`"
                        @click="() => $am_addLayer()">
                        P
                    </button>
                </div>
            </div>
        </div>
        <div
            @click="$am_toggleColor"
            class="am-color-picker"
            v-if="enablePicker">
            <chrome
                :value="colors"
                @input="$am_changeColor"/>
        </div>
    </div>
</template>

<script>
    import {mapGetters, mapActions} from 'vuex';
    import {Chrome} from 'vue-color';
    import AmSortableList from './list/AmSortableList.vue';
    import AmDropdown from './input/AmDropdown.vue';
    import {getSLD} from '../utils/SLDUtils';
    import uuidv1 from 'uuid/v1';

    export default {
        components: {
            Chrome,
            AmSortableList,
            AmDropdown
        },
        data() {
            return {
                form: [
                    {
                        name: 'name',
                        family: 'layer',
                        type: 'dropdown'
                    },
                    {
                        name: 'style',
                        family: 'layer'
                    },
                    {
                        name: 'prefix',
                        family: 'layer'
                    },
                    {
                        name: 'label'
                    }
                ],
                defaultLayer: {
                    service: 'WMS',
                    format: 'image/png',
                    style: ''
                },
                add: false,
                enablePicker: false,
                color: '',
                colors: {
                    hex: ''
                },
                type: ''
            };
        },
        computed: {
            ...mapGetters({
                items: 'app/items',
                selectedLayer: 'app/selectedLayer',
                backgroundColor: 'app/backgroundColor',
                layers: 'app/layersList'
            })
        },
         watch: {
            backgroundColor(color) {
                this.colors = { hex: color };
            },
            add(newAdd, oldAdd) {
                if (newAdd && !oldAdd) {
                    this.getCapabilities();
                }
            }
        },
        methods: {
            ...mapActions({
                addLayer: 'app/addLayer',
                selectLayer: 'app/selectLayer',
                setBackgroundColor: 'app/setBackgroundColor',
                updateLayers: 'app/updateLayers',
                updateAllSLD: 'app/updateAllSLD',
                getCapabilities: 'app/getCapabilities'
            }),
            $am_addLayer() {
                this.add = false;
                const id = uuidv1();
                const values = this.form.reduce((newValues, field) => ({...newValues, [field.name]: field.value}), {});
                this.addLayer({...(this.type === 'layer' ? this.defaultLayer : {}), id, ...values, type: this.type});
                this.form = this.form.map(field => ({...field, value: undefined}));
            },
            $am_selectLayer(id) {
                this.selectLayer(this.selectedLayer.id === id ? null : id);
            },
            $am_updateLayers(layers) {
                this.updateAllSLD(getSLD(layers));
                this.updateLayers([...layers]);
            },
            $am_toggleColor(e){
                if (e && e.target && e.target.getAttribute('class') === 'am-color-picker') {
                    this.enablePicker = !this.enablePicker;
                }
            },
            $am_changeColor(colors) {
                this.color = colors.hex;
                this.setBackgroundColor(this.color);
            },
            $am_openModal(type) {
                this.add = true;
                this.type = type;
            },
            $am_onChange(idx, value) {
                this.form = this.form.map((field, fieldId) => fieldId === idx ? {...field, value} : {...field});
            }
        }
    };
</script>
