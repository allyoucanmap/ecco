/* copyright 2018, stefano bovio @allyoucanmap. */

import { head } from 'lodash';

const selectedLayer = state => state.layers && head(state.layers.filter(layer => state.selectedLayer && layer.id === state.selectedLayer)) || {};

export default {
    layers: state => state.layers && state.layers.filter(layer => layer.type !== 'group') || [],
    items: state => state.layers || [],
    selectedLayer,
    scalesDenominator: state => selectedLayer(state).scales || {},
    selectedLayerId: state => selectedLayer(state).id,
    currentSLD: state => state.currentSLD || '',
    backgroundColor: state => state.backgroundColor || '#f2f2f2',
    zoom: state => state.zoom || 1,
    minZoom: state => state.minZoom || 0,
    maxZoom: state => state.maxZoom || 21,
    zooms: state => state.zooms || [],
    resolutions: state => state.resolutions || [],
    scales: state => state.scales || [],
    scalesRound: state => state.scales && state.scales.map(scale => Math.round(scale)) || [],
    center: state => state.center || [],
    size: state => state.size || {width: 0, height: 0},
    width: state => state.size && state.size.width || 0,
    height: state => state.size && state.size.height || 0,
    projectName: () => '',
    info: state => state.info || {},
    loading: state => state.loading ? true : false,
    layersList: state => state.capabilities && state.capabilities.layers || [],
    settings: state => state.settings || {}
};
