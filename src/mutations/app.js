/* copyright 2018, stefano bovio @allyoucanmap. */

import actions from '../actions/app';
import {head, trim, isEmpty} from 'lodash';
import {minZoom, maxZoom, zooms, resolutions, scales} from '../utils/PrjUtils';

export default {
    state: {
        layers: [],
        selectedLayer: null,
        backgroundColor: '#f2f2f2',
        currentSLD: '',
        errorSLD: '',
        zoom: 14,
        minZoom,
        maxZoom,
        zooms,
        resolutions,
        scales,
        size: {
            width: 0,
            height: 0
        },
        center: [139.753372, 35.685360],
        info: {}
    },
    mutations: {
        [actions.ADD_LAYER](state, payload) {
            state.layers = [...state.layers, { ...payload.layer }];
        },
        [actions.UPDATE_CURRENT_SLD](state, payload) {
            const {sld, general, filters, rule} = payload.options || {};
            const label = general && head(general.filter(field => field.name === 'Name').map(field => field.value));
            state.layers = [...state.layers.map(layer => state.selectedLayer && layer.id === state.selectedLayer ? {...layer, label, general, filters, rule, sld} : {...layer})];
            state.currentSLD = sld;
        },
        [actions.ERROR_SLD](state, payload) {
            state.errorSLD = payload.error || '';
        },
        [actions.SELECT_LAYER](state, payload) {
            state.selectedLayer = payload.id || null;
        },
        [actions.SET_BACKGROUND_COLOR](state, payload) {
            state.backgroundColor = payload.color;
        },
        [actions.SET_ZOOM](state, payload) {
            const id = payload.zoom && payload.zoom.layerId;
            const scales = payload.zoom && payload.zoom.scales;
            if (id && scales) {
                state.layers = state.layers.map(layer => layer.id === id ? {...layer, scales} : {...layer});
            }
            const currentZoom =  payload.zoom && payload.zoom.currentZoom;
            state.zoom = currentZoom;
        },
        [actions.SET_MAP_SIZE](state, payload) {
            state.size = payload.size;
        },
        [actions.SET_MAP_CENTER](state, payload) {
            state.center = payload.center;
        },
        [actions.UPDATE_LAYERS](state, payload) {
            state.layers = [...payload.layers];
        },
        [actions.UPDATE_LAYER](state, payload) {
            const id = payload.id;
            const options = payload.options;
            state.layers = state.layers.map(layer => layer.id === id ? {...layer, ...options} : {...layer});
        },
        [actions.UPDATE_ALL_SLD](state, payload) {
            const {options} = payload;
            state.layers = state.layers.map(layer => layer.name === options.name ? {...layer, sld: options.sld} : {...layer});
        },
        [actions.CLEAR_INFO](state) {
            state.info = {};
        },
        [actions.GET_INFO](state, payload) {
            const {data = {}} = payload;

            const features = data.split('--------------------------------------------').map(feature => {
                return feature.split(/\n/).filter(val => val).reduce((newFeature, param) => {
                    const splittedParam = param.split('=');
                    const key = trim(splittedParam[0]);
                    const value = trim(splittedParam[1]);
                    return {
                        ...newFeature,
                        ...(value ? {[key]: value} : {})
                    }
                }, {});
            }).filter(feature => !isEmpty(feature)).map((feature, id) => ({id: 'feature:' + id, properties: feature}));

            state.info = {features};
        }
    }
};
