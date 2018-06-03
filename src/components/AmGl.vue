/* copyright 2018, stefano bovio @allyoucanmap. */

<style scoped>
    #am-gl {
        font-family: serif;
    }
    canvas {
        font-family: serif;
    }
</style>

<template lang="html">
    <div
        id="am-gl"
        class="am-gl"/>
</template>

<script>
    import gl from '../gl/index';
    import {mapGetters, mapActions} from 'vuex';
    import {join, isEqual} from 'lodash';
    import {pseudo} from '../utils/PrjUtils';

    export default {
        data() {
            return {
                gl: null,
                entities: [],
                bbox: [],
                width: 0,
                height: 0,
                oldSLD: '',
                oldLayers: [],
                oldZoom: 0,
                oldPseudo: []
            };
        },
        computed: {
            ...mapGetters({
                layers: 'app/layers',
                selectedLayer: 'app/selectedLayer',
                currentSLD: 'app/currentSLD',
                backgroundColor: 'app/backgroundColor',
                zoom: 'app/zoom',
                zooms: 'app/zooms',
                resolutions: 'app/resolutions',
                scales: 'app/scales',
                center: 'app/center',
                projectName: 'app/projectName'
            })
        },
        watch: {
            center(center) {
                this.pseudo = pseudo(center);
            },
            width(width) {
                this.setSize({width, height: this.height});
            },
            height(height) {
                this.setSize({width: this.width, height});
            }
        },
        mounted() {
            this.oldZoom = this.zoom;
            gl.start('#am-gl', {
                view: {
                    before: ({gl, backgroundColor, entity, width, height, camera}) => {
                        camera.type = 'ortho';
                        this.gl = gl;
                        backgroundColor(this.backgroundColor);

                        camera.near = 1;
                        camera.far = 200;
             
                        this.pseudo = pseudo(this.center);
                        this.width = width;
                        this.height = height;

                        this.bbox = this.$am_getBBOX({
                            pseudo: this.pseudo,
                            width: this.width,
                            height: this.height,
                            zoom: this.zoom
                        });

                        this.entities =  this.$am_getEntities({
                            layers: this.$am_getLayers(),
                            entity,
                            bbox: this.bbox,
                            width: this.width,
                            height: this.height
                        });
                    },
                    loop: ({backgroundColor, drawEntity, camera, updateEntityTexture, destroyEntity, entity}) => {

                        backgroundColor(this.backgroundColor);

                        camera.position = [this.pseudo[0], this.pseudo[1], 100];
                        camera.target = [this.pseudo[0], this.pseudo[1], 0];
                        camera.zoom = 1 / this.resolutions[this.zoom];

                        const layers = this.$am_getLayers();

                        if (this.oldZoom !== this.zoom
                        || !isEqual(this.pseudo, this.oldPseudo)) {
                            this.bbox = this.$am_getBBOX({
                                pseudo: this.pseudo,
                                width: this.width,
                                height: this.height,
                                zoom: this.zoom
                            });
                        }
                        
                        this.entities.forEach(ent => {
                            if (ent) {
                                drawEntity(ent);
                                if (this.oldSLD !== this.currentSLD && this.selectedLayer && ent.id === this.selectedLayer.name) {
                                    updateEntityTexture(ent,  this.$am_getLayerUrl({
                                        layer: this.selectedLayer,
                                        bbox: this.bbox,
                                        width: this.width,
                                        height: this.height
                                    }));
                                }
                            }
                        });
                        if (this.oldLayers.length !== layers.length
                        || this.oldZoom !== this.zoom
                        || !isEqual(this.pseudo, this.oldPseudo)) {
                            this.entities.forEach(ent => {
                                destroyEntity(ent);
                            });
                            this.entities =  this.$am_getEntities({
                                layers,
                                entity,
                                bbox: this.bbox,
                                width: this.width,
                                height: this.height
                            });
                            
                        }
                        this.oldSLD = this.currentSLD;
                        this.oldLayers = [...layers];
                        this.oldZoom = this.zoom;
                        this.oldPseudo = [...this.pseudo];
                    },
                    resize: ({destroyEntity, entity, width, height}) => {
                        this.width = width;
                        this.height = height;

                        this.bbox = this.$am_getBBOX({
                            pseudo: this.pseudo,
                            width: this.width,
                            height: this.height,
                            zoom: this.zoom
                        });

                        this.entities.forEach(ent => {
                            destroyEntity(ent);
                        });

                        const layers = this.$am_getLayers();

                        this.entities =  this.$am_getEntities({
                            layers,
                            entity,
                            bbox: this.bbox,
                            width: this.width,
                            height: this.height
                        });
                    }
                }
            })
        },
        methods: {
            ...mapActions({
                setSize: 'app/setMapSize'
            }),
            $am_getLayerUrl({layer, bbox, width, height}) {
                const params = {
                    SERVICE: layer.service,
                    VERSION: '1.1.1',
                    REQUEST: 'GetMap',
                    FORMAT: layer.format,
                    LAYERS: layer.name,
                    SRS: 'EPSG:900913',
                    TRANSPARENT: 'true',
                    STYLES: this.projectName + (layer.style || layer.name) + '~ecco~style',
                    WIDTH: width,
                    HEIGHT: height,
                    BBOX: join(bbox, ','),
                    _d: Date.now()
                };
                return 'http://localhost:8080/geoserver/wms?'+ join(Object.keys(params).map(key => key + '=' + params[key]), '&');
            },
            $am_getLayers() {
                const layers = this.layers.reduce((mergedLayers, layer) => ({...mergedLayers, [layer.name]: {...layer}}), {});
                return Object.keys(layers).map(name => ({...layers[name]}));
            },
            $am_getEntities({layers, entity, bbox, width, height}) {
                return layers.map((layer, z) => {
                    return entity({
                        id: layer.name,
                        color: '#333333',
                        textureUrl: this.$am_getLayerUrl({layer, bbox, width, height}),
                        position: [0, 0, z],
                        feature: {
                            type: 'Polygon',
                            scale: 5,
                            coordinates: [
                                [
                                    [bbox[0], bbox[1]],
                                    [bbox[0], bbox[3]],
                                    [bbox[2], bbox[3]],
                                    [bbox[2], bbox[1]]
                                ]
                            ]
                        }
                    });
                });
            },
            $am_getBBOX({pseudo, width, height, zoom}) {
                return [
                    pseudo[0] - this.resolutions[zoom] * width / 2,
                    pseudo[1] - this.resolutions[zoom] * height / 2,
                    pseudo[0] + this.resolutions[zoom] * width / 2,
                    pseudo[1] + this.resolutions[zoom] * height / 2
                ];
            }
        }
    };
</script>