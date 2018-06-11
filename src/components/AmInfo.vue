/* copyright 2018, stefano bovio @allyoucanmap. */

<style scoped>
    .am-info {
        display: flex;
        flex-direction: column;
    }
    .am-info.am-close {
        position: absolute;
        width: 100%;
        bottom: 0;
    }
    .am-panel {
        background-color: #f2f2f2;
    }
    .am-body {
        flex: 1;
        overflow-y: auto;
    }
    .am-head {
        display: flex;
        height: 39px;
        padding: 0 8px;
        align-items: center;
        border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    }
    .am-info.am-close .am-head {
        border-bottom: none;
    }
    .am-label {
        flex: 1;
    }
    .am-property {
        border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    }
</style>

<template lang="html">
    <div :class="`am-info ${expanded ? '' : 'am-close'}`">
        <div class="am-head">
            <div class="am-label"/>
            <button
                class="am-icon"
                @click="() => expanded = !expanded">
                M
            </button>
        </div>
        <div
            v-if="expanded"
            class="am-body">
            <am-panel
                v-for="(feature, idx) in info.features"
                :key="idx"
                :head="feature.id">
                <div
                    v-for="key in Object.keys(feature.properties).filter(key => feature.properties[key])"
                    :key="key">
                    <small>{{ key }}</small>
                    <div class="am-property">{{ feature.properties[key] }}</div>
                </div>
            </am-panel>
        </div>
    </div>
</template>

<script>
    import {mapGetters} from 'vuex';
    import AmPanel from './panel/AmPanel.vue';

    export default {
        components: {
            AmPanel
        },
        data() {
            return {
                expanded: false
            }
        },
        computed: {
            ...mapGetters({
                info: 'app/info'
            })
        },
    };
</script>