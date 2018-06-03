/* copyright 2018, stefano bovio @allyoucanmap. */

<style scoped>
    .am-slider-container {
        flex: 1;
        display: flex;
        flex-direction: column;
    }
    .am-slider-container .am-slider {
        margin-top: 6px;
    }
    .am-slider-container.am-compact .am-slider {
        margin-top: 0;
    }
    .am-slider-container.am-compact {
        height: 24px;
    }
    .am-slider-container.am-compact input {
        height: 20px;
        margin-top: 0;
    }
    .am-slider {
        width: 100%;
    }
</style>

<template lang="html">
    <div :class="`am-slider-container ${compact && 'am-compact'}`">
        <input
            :value="number"
            @change="event => $am_Change(event.target.value)">
        <div
            id="am-slider"
            class="am-slider"/>
    </div>
</template>

<script>

    import slider from 'nouislider';
    import {isNil} from 'lodash';

    export default {
        props: {
            value: {
                type: [Number, String],
                default: 0
            },
            onChange: {
                type: Function,
                default: () => {}
            },
            range: {
                type: Object,
                default: () => ({})
            },
            compact: {
                type: Boolean,
                default: false
            }
        },
        data(){
            return {
                number: 0,
                slider: null
            }
        },
        watch: {
            value(newValue, oldValue) {
                if (newValue !== oldValue) {
                    if (!isNil(newValue)) {
                        this.number = newValue;
                    } else {
                        this.number = 0;
                    }
                    this.slider.set([this.number]);
                }
            }
        },
        created() {
            if (!isNil(this.value)) {
                this.number = this.value;
            }
        },
        mounted() {
            const div = this.$el.querySelector('#am-slider');
            if (div && !this.disabled) {
                this.slider = slider.create(div, {
                    start: [this.number],
                    range: this.range
                });
                this.slider.on('change', (value) => {
                    const number = value && parseFloat(value[0]) || 0;
                    this.number = number;
                    this.onChange(number);
                });
            }
        },
        beforeDestroy() {
            if (this.slider) {
                this.slider.destroy();
            }
        },
        methods: {
            $am_Change(number) {
                this.number = number;
                this.slider.set([number]);
                this.onChange(number);
            }
        }
    };
</script>