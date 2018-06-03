/* copyright 2018, stefano bovio @allyoucanmap. */

<style scoped>
    .am-zoom-slider {
        padding-top: 16px;
        display: flex;
        flex-direction: column;
    }
    #am-zoom-slider {
        position: relative;
        flex: 1;
        width: 4px;
        margin: 0 8px;
    }
    button {
        margin: 24px auto 6px auto;
    }
</style>

<template lang="html">
    <div class="am-zoom-slider">
        <div id="am-zoom-slider"/>
        <button
            class="am-icon"
            @click="() => $am_onToggle()">
            {{ showTooltips ? '0' : '1' }}
        </button>
    </div>
</template>

<script>
    import slider from 'nouislider';
    import {isEqual} from 'lodash';
    import {mapGetters, mapActions} from 'vuex';

    export default {
        props: {
            
        },
        data() {
            return {
                slider: null,
                minZoom: 0,
                maxZoom: 21,
                showTooltips: true
            };
        },
        computed: {
            ...mapGetters({
                zoom: 'app/zoom',
                scales: 'app/scalesRound',
                scalesDenominator: 'app/scalesDenominator',
                layerId: 'app/selectedLayerId'
            })
        },
        watch: {
            zoom(newZoom, oldZoom) {
                if (this.slider && newZoom !== oldZoom) {
                    this.$am_updateZoom(newZoom, this.scalesDenominator);
                }
            },
            scalesDenominator(newScales, oldScales) {
                if (this.slider && !isEqual(newScales, oldScales)) {
                    this.$am_updateZoom(this.zoom, newScales);
                }
            }
        },
        mounted() {
            const div = this.$el.querySelector('#am-zoom-slider');

            if (div) {
                this.slider = slider.create(div, {
                    orientation: 'vertical',
                    start: [this.minZoom, this.zoom, this.maxZoom],
                    connect: true,
                    tooltips: [true, true, true],
                    range: {
                        min: 0,
                        max: 21
                    },
                    format: {
                        to: value => '1 : ' + this.scales[Math.round(value)],
                        from: value => value
                    },
                    step: 1
                });

                this.slider.on('change', (value) => {

                    const minZoom = value && value[0] && this.$am_nearIndex(parseFloat(value[0].substring(4, value[0].length))) || this.minZoom;
                    const zoom = value && value[1] && this.$am_nearIndex(parseFloat(value[1].substring(4, value[1].length))) || 0;
                    const maxZoom = value && value[2] && this.$am_nearIndex(parseFloat(value[2].substring(4, value[2].length))) || this.maxZoom;
                    this.setZoom({
                        layerId: this.layerId,
                        scales: {
                            ...(this.minZoom === minZoom ? {} : {minZoom, maxScaleDenominator: this.scales[minZoom]}),
                            ...(this.maxZoom === maxZoom ? {} : {maxZoom, minScaleDenominator: this.scales[maxZoom]})
                        },
                        currentZoom: Math.round(zoom)
                    });
                });
            }
        },
        beforeDestroy() {
            if (this.slider) {
                this.slider.destroy();
            }
        },
        methods: {
            ...mapActions({
                setZoom: 'app/setZoom'
            }),
            $am_onToggle() {
                this.showTooltips = !this.showTooltips;
                const tooltips = this.slider && this.slider.target && this.slider.target.getElementsByClassName && [...this.slider.target.getElementsByClassName('noUi-tooltip')] || [];
                tooltips.forEach(tooltip => {
                    tooltip.style.display = this.showTooltips ? 'block' : 'none';
                });
            },
            $am_updateZoom(zoom, scales) {
                const minZoom = scales.minZoom || this.minZoom;
                const maxZoom = scales.maxZoom || this.maxZoom;
                const isBetween = zoom <= maxZoom && zoom >= minZoom;
                this.slider.set([minZoom, isBetween ? this.zoom : Math.round((minZoom + maxZoom) / 2), maxZoom]);
                if (!isBetween) {
                    this.setZoom({
                        layerId: this.layerId,
                        scales: {
                            ...(this.minZoom === minZoom ? {} : {minZoom, maxScaleDenominator: this.scales[minZoom]}),
                            ...(this.maxZoom === maxZoom ? {} : {maxZoom, minScaleDenominator: this.scales[maxZoom]})
                        },
                        currentZoom: Math.round((minZoom + maxZoom) / 2)
                    });
                }
            },
            $am_nearIndex(scale) {
                const scaleValue = scale && this.scales.reduce((previous, current) => {
                    return Math.abs(current - scale) < Math.abs(previous - scale) ? current : previous;
                });
                return this.scales.indexOf(scaleValue);
            }
        }
    };
</script>