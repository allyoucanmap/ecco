/* copyright 2018, stefano bovio @allyoucanmap. */

<style scoped>
    .am-head {
        display: flex;
        padding: 8px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    }
    .am-head div {
        flex: 1;
        padding-right: 4px;
        align-self: center;
    }
    .am-body {
        padding: 8px;
        background-color: #f8f8f8;
        border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    }
    .am-head button {
        margin-left: 4px;
    }
</style>

<template lang="html">
    <div class="am-panel">
        <div class="am-head">
            <div>
                <span>{{ head }}</span>
            </div>
            <button
                v-if="onRemove"
                class="am-icon"
                @click="(event) => onRemove(event)">
                X
            </button>
            <button
                class="am-icon"
                @click="() => $am_onChange()">
                {{ expanded ? 'M' : 'P' }}
            </button>
        </div>
        <div
            v-if="expanded"
            class="am-body">
            <slot/>
        </div>
    </div>
</template>

<script>
    export default {
        props: {
            collapsed: {
                type: Boolean,
                default: true
            },
            head: {
                type: String,
                default: ''
            },
            onRemove: {
                type: Function,
                default: null
            },
            onExpand: {
                type: Function,
                default: () => {}
            }
        },
        data() {
            return {
                expanded: false
            };
        },
        watch: {
            expanded(expanded) {
                this.onExpand(expanded);
            }
        },
        created() {
            this.expanded = !this.collapsed;
        },
        methods: {
            $am_onChange() {
                this.expanded = !this.expanded;
            }
        }
    };
</script>