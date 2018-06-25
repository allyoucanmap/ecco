/* copyright 2018, stefano bovio @allyoucanmap. */

<style scoped>
    .am-tools {
        display: flex;
        flex-direction: row-reverse;
        padding: 0 8px;
        align-items: center;
    }
    .am-tools button + button {
        margin-right: 4px;
    }
    .am-tools input {
        margin-right: 4px;
        text-align: center;
        width: 250px;
    }
</style>

<template lang="html">
    <div class="am-tools">

        <button
            v-for="(tool, toolId) in tools"
            :key="toolId"
            :id="`am-direction-${tool.id}`"
            :class="`am-icon ${tool.selected ? 'am-selected' : ''}`"
            @click="() => tool.onClick()">
            <span :style="tool.style || ''">{{ tool.icon }}</span>
        </button>

        <input
            disabled="true"
            :value="'lng ' + center[0].toFixed(8) + ' lat ' + center[1].toFixed(8)">
    </div>
</template>

<script>
    import {mapGetters, mapActions} from 'vuex';
    import {pseudo, wgs84} from '../utils/PrjUtils';

    export default {
        data() {
            return {
                tools: [
                    {
                        icon: 'T',
                        id: 'right',
                        style: 'transform: rotate(90deg);',
                        onClick: () => this.$am_onMove(1, 0)
                    },
                    {
                        icon: 'T',
                        style: 'transform: rotate(-90deg);',
                        id: 'left',
                        onClick: () => this.$am_onMove(-1, 0)
                    },
                    {
                        icon: 'T',
                        style: '',
                        id: 'up',
                        onClick: () => this.$am_onMove(0, 1)
                    },
                    {
                        icon: 'T',
                        style: 'transform: rotate(180deg);',
                        id: 'down',
                        onClick: () => this.$am_onMove(0, -1)
                    }
                ],
                keys: {},
                pressed: false
            };
        },
        computed: {
            ...mapGetters({
                zoom: 'app/zoom',
                resolutions: 'app/resolutions',
                center: 'app/center',
                width: 'app/width',
                height: 'app/height'
            })
        },
        watch: {
            keys(keys) {
                if (keys.Control) {
                    if (keys.ArrowRight) {
                        this.$am_onMove(1, 0);
                        this.$am_onSelect('right');
                    } else if (keys.ArrowLeft) {
                        this.$am_onMove(-1, 0);
                        this.$am_onSelect('left');
                    } else if (keys.ArrowUp) {
                        this.$am_onMove(0, 1);
                        this.$am_onSelect('up');
                    } else if (keys.ArrowDown) {
                        this.$am_onMove(0, -1);
                        this.$am_onSelect('down');
                    }
                }
            }
        },
        mounted() {
            window.addEventListener('keydown', this.$am_onKeyDown);
            window.addEventListener('keyup', this.$am_onKeyUp);
        },
        beforeDestroy() {
            window.removeEventListener('keydown', this.$am_onKeyDown);
            window.removeEventListener('keyup', this.$am_onKeyUp);
        },
        methods: {
            ...mapActions({
                setCenter: 'app/setMapCenter'
            }),
            $am_onKeyDown(e) {
                if (!this.keys[e.key]) {
                    this.keys = {...this.keys, [e.key]: true};
                }
            },
            $am_onSelect(id){
                this.tools = this.tools.map(tool => tool.id === id ? {...tool, selected: true} : {...tool});
            
            },
            $am_onKeyUp(e) {
                this.keys = {...this.keys, [e.key]: false};
                this.tools = this.tools.map(tool => ({...tool, selected: false}));
            },
            $am_onMove(x, y) {
                const center = pseudo(this.center);
                const deltaX = x * this.width / 2 * this.resolutions[this.zoom];
                const deltaY = y * this.height / 2 * this.resolutions[this.zoom];
                this.setCenter(wgs84([
                    center[0] + deltaX,
                    center[1] + deltaY
                ]));
            }
        }
    };
</script>