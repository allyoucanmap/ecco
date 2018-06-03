/* copyright 2018, stefano bovio @allyoucanmap. */

<style scoped>
    .am-item {
        font-size: 14px;
        margin: 4px;
        padding: 4px;
        display: flex;
        align-items: center;
        box-sizing: border-box;
        border: 1px solid rgba(0, 0, 0, 0.12);
        box-sizing: border-box;
        pointer-events: none;
    }
    .am-item > .am-label {
        flex: 1;
        overflow: hidden;
        padding-right: 4px;
    }
    .am-item > .am-label > div {
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
    }
    .am-item .am-btns {
        pointer-events: auto;
        display: flex;
    }
    .am-item .am-btns button + button {
        margin-left: 4px;
    }
    .am-group .am-item .am-btns button {
        color: #aaaaaa;
        border-color: #aaaaaa;
    }
    .am-item-container {
        box-sizing: border-box;
        overflow: hidden;
        transition: all 0.3s;
        background-color: transparent;
    }
    .am-hide {
        display: none;
    }
    .am-item.am-selected {
        background-color: #eeeeee;
    }
    .am-group .am-item {
        background-color: #333333;
        transition: all 0.3s;
    }
    .am-group .am-item > div > div {
        color: #f2f2f2;
    }
    .am-group.am-collapsed .am-item {
        background-color: #444444;
    }
</style>

<template lang="html">
    <div
        class="am-sortable-list"
        @dragstart="$_am_dragstart"
        @dragend="$_am_dragend"
        @dragover="$_am_dragover"
        @dragenter="$_am_dragenter"
        @drop="$_am_drop">
        <div
            v-for="(item, itemId) in items"
            :class="`am-item-container ${item.type === 'group' && item.collapsed && 'am-collapsed'} ${(oldID === item.id || item.collapsed === true && item.type !== 'group') && 'am-hide'} ${item.type === 'group' && 'am-group'}`"
            :key="itemId"
            :data-id="item.id"
            :draggable="true"
            @click="() => item.type !== 'group' && onSelect(item.id)">
            <div
                :class="`am-item ${item.id === selectedItem.id && 'am-selected'}`"
                :data-id="item.id">
                <div class="am-label">
                    <div>{{ item.label }}</div>
                </div>
                <div class="am-btns">
                    <button
                        class="am-icon"
                        @click="() => $am_onRemove(item.id)">
                        X
                    </button>
                    <button
                        v-if="item.type === 'group'"
                        class="inverse am-icon"
                        @click="() => $am_onExpand(item.id)">
                        {{ item.collapsed ? 'M' : 'P' }}
                    </button>
                    <!--button
                        class="am-icon"
                        v-if="item.type !== 'group'">
                        4
                    </button-->
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import {head} from 'lodash';

    export default {
        props: {
            items: {
                type: Array,
                default: () => []
            },
            onChange: {
                type: Function,
                default: () => {}
            },
            onSelect: {
                type: Function,
                default: () => {}
            },
            selectedItem: {
                type: Object,
                default: () => {}
            }
        },
        data() {
            return {
                oldID: -1,
                hoverID: -1,
                currentID: -1,
                position: ''
            };
        },
        methods: {
            $_am_dragover(event) {
                const hoverID = event.target.getAttribute('data-id');
                const containerRect = this.$el.getBoundingClientRect();
                const targetRect = event.target.getBoundingClientRect();
                const mouseY = event.clientY - containerRect.top;
                const targetY = targetRect.top - containerRect.top;
                const items = [...this.$el.getElementsByClassName('am-item-container')];

                items.forEach(item => {
                    item.style.paddingBottom = 0;
                    item.style.paddingTop = 0;
                    item.style.backgroundColor = 'transparent';
                    item.style.color = '#333333';
                });

                if (hoverID) {
                    if (mouseY >= targetY + targetRect.height / 2) {
                        event.target.style.paddingBottom = 27 + 'px';
                        this.position = 'DOWN';
                    } else if (mouseY < targetY + (targetRect.height / 2)) {
                        event.target.style.paddingTop = 27 + 'px';
                        this.position = 'UP';
                    }
                }
                event.preventDefault();
            },
            $_am_dragend(event) {
                const items = [...this.$el.getElementsByClassName('am-item-container')];

                items.forEach(item => {
                    item.style.paddingBottom = 0;
                    item.style.paddingTop = 0;
                    item.style.backgroundColor = 'transparent';
                    item.style.color = '#333333';
                });
                this.currentID = -1;
                this.oldID = -1;
                event.preventDefault();
            },
            $_am_dragenter(event) {
                event.preventDefault();
            },
            $_am_drop(event) {
                this.currentID = parseFloat(event.target.getAttribute('data-id'));
                if (this.currentID !== this.oldID) {
                    const oldItem = head(this.items.filter(item => item.id === this.oldID));
                    const collapsedItems = this.items.filter(item => item.type !== 'group' && item.collapsed);
                    const oldGroupTail = oldItem.type === 'group' && collapsedItems.filter(collapsed => collapsed.groupId === oldItem.id) || [];
                    const items = this.items.filter(item => (item.type !== 'group' && !item.collapsed) || item.type === 'group').reduce((newItems, item) => {
                        const groupTail = item.type === 'group' && collapsedItems.filter(collapsed => collapsed.groupId === item.id) || [];
                        if (this.position === 'UP' && item.id === this.currentID) {
                            return [...newItems, {...oldItem},  ...oldGroupTail, {...item}, ...groupTail];
                        }
                        if (this.position === 'DOWN' && item.id === this.currentID) {
                            return [...newItems, {...item}, ...groupTail, {...oldItem}, ...oldGroupTail];
                        }
                        if (item.id === this.oldID) {
                            return [...newItems];
                        }
                        return [...newItems, {...item}, ...groupTail];
                    }, []).reduce((newItems, item) => {
                        const groupId = newItems.length > 0 && newItems[newItems.length - 1]
                        && (newItems[newItems.length - 1].type === 'group' && newItems[newItems.length - 1].id
                        || newItems[newItems.length - 1].groupId);
                        return [...newItems, {...item, groupId}];
                    }, []);
                    this.onChange(items);
                }
                this.currentID = -1;
                this.oldID = -1;
            },
            $_am_dragstart(event) {
                this.oldID = parseFloat(event.target.getAttribute('data-id'));
            },
            $am_onExpand(itemId) {
                const items = this.items.map((item) => {
                    return item.id === itemId ? {...item, collapsed: !item.collapsed} : {...item};
                }).reduce((newItems, item) => {
                    const groupId = newItems.length > 0 && newItems[newItems.length - 1]
                    && (newItems[newItems.length - 1].type === 'group' && newItems[newItems.length - 1].id
                    || newItems[newItems.length - 1].groupId);
                    const collapsed = newItems.length > 0 && newItems[newItems.length - 1]
                    && (newItems[newItems.length - 1].type === 'group' && newItems[newItems.length - 1].collapsed
                    || newItems[newItems.length - 1].collapsed);
                    return item.type === 'group' ? [...newItems, {...item}] : [...newItems, {...item, groupId, collapsed}];
                }, []);
                this.onChange(items);
            },
            $am_onRemove(id) {
                const items = this.items.filter(item => item.id !== id);
                this.onChange(items);
            }
        }
    };
</script>