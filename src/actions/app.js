/* copyright 2018, stefano bovio @allyoucanmap. */

import axios from 'axios';
import {parseStyle} from '../utils/SLDUtils';

const ADD_LAYER = 'ADD_LAYER';
const UPDATE_CURRENT_SLD = 'UPDATE_CURRENT_SLD';
const ERROR_SLD = 'ERROR_SLD';
const SELECT_LAYER = 'SELECT_LAYER';
const SET_BACKGROUND_COLOR = 'SET_BACKGROUND_COLOR';
const SET_ZOOM = 'SET_ZOOM';
const SET_MAP_SIZE = 'SET_MAP_SIZE';
const SET_MAP_CENTER = 'SET_MAP_CENTER';
const UPDATE_LAYERS = 'UPDATE_LAYERS';
const UPDATE_LAYER = 'UPDATE_LAYER';
const UPDATE_ALL_SLD = 'UPDATE_ALL_SLD';
const GET_INFO = 'GET_INFO';
const CLEAR_INFO = 'CLEAR_INFO';

const errorSLD = ({ commit }, error) => {
    commit({
        type: ERROR_SLD,
        error
    });
};

const updateCurrentSLD = ({ commit }, options) => {
    commit({
        type: UPDATE_CURRENT_SLD,
        options
    });
};

const getStyle = (options, response = () => {}, error = () => {}) => {
    axios.get(`/geoserver/rest/styles/${options.name}`, {
        params: {
            ...options.params
        }
    })
    .then(({data}) => {
        response(data);
    })
    .catch(e => {
        if (e && e.response && e.response.status === 404) {
            error('Style not found');
        }
    });
};

const updateStyle = (options, response = () => {}, error = () => {}) => {
    axios.put(`/geoserver/rest/styles/${options.name}`, options.sld, {
        headers: {
            'Content-Type': 'application/vnd.ogc.sld+xml'
        }
    })
    .then(() => {
        response({...options});
    })
    .catch(e => {
        if (e && e.response && (e.response.status === 404 || e.response.status === 400)) {
            error('Style not found');
            axios.post('/geoserver/rest/styles', options.sld, {
                params: {
                    name: options.name
                },
                headers: {
                    'Content-Type': 'application/vnd.ogc.sld+xml'
                }
            })
            .then(() => {
                response({...options});
            })
            .catch(() => {
                error('Style not created');
            });
        }
    });
};

const deleteStyle = ({ commit }, options) => {
    axios.delete(`/geoserver/rest/styles/${options.name}`)
    .then(() => {})
    .catch(() => {});
};

const clearInfo = ({commit}) => {
    commit({
        type: CLEAR_INFO
    });
};

const getInfo = ({commit}, options) => {
    clearInfo({commit});
    axios.get('/geoserver/wms', {
        params: {
            ...(options.params ? options.params : {})
        }
    }).then(({data}) => {
        commit({
            type: GET_INFO,
            data
        });
    });
};


export default {
    actions: {
        addLayer({ commit }, layer) {
            if (layer.type === 'group') {
                commit({
                    type: ADD_LAYER,
                    layer
                });
            } else {
                getStyle({
                    name: (layer.style || layer.name + '~ecco~style') + '.sld'
                }, sld => {
                    updateStyle({
                        name: layer.name + '~ecco~style~tmp',
                        sld
                    });
                    parseStyle(sld, ({rules = []}) => {
                        if (rules.length > 0) {
                            rules.forEach(rule => {
                                commit({
                                    type: ADD_LAYER,
                                    layer: {...(rule.type === 'layer' ? layer : {}), ...rule}
                                });
                            });
                        } else {
                            commit({
                                type: ADD_LAYER,
                                layer
                            });
                        }
                    });
                }, () => {
                    commit({
                        type: ADD_LAYER,
                        layer
                    });
                });
            }
        },
        selectLayer({ commit }, id) {
            commit({
                type: SELECT_LAYER,
                id
            });
        },
        updateLayers({ commit }, layers) {
            commit({
                type: UPDATE_LAYERS,
                layers
            });
        },
        updateLayer({ commit }, options) {
            commit({
                type: UPDATE_LAYER,
                options
            });
        },
        setBackgroundColor({ commit }, color) {
            commit({
                type: SET_BACKGROUND_COLOR,
                color
            });
        },
        setZoom({ commit }, zoom) {
            commit({
                type: SET_ZOOM,
                zoom
            });
        },
        setMapSize({ commit }, size) {
            commit({
                type: SET_MAP_SIZE,
                size
            });
        },
        setMapCenter({ commit }, center) {
            commit({
                type: SET_MAP_CENTER,
                center
            });
        },
        updateCurrentSLD,
        getStyle,
        clearInfo,
        getInfo,
        updateStyle ({ commit }, options) {
            updateStyle(options, () => {
                updateCurrentSLD({ commit }, {...options});
            },
            error => {
                errorSLD({ commit }, error);
            });
        },
        updateAllSLD ({ commit }, sldObj) {
            Object.keys(sldObj).forEach(name => {
                updateStyle({
                    name: name + '~ecco~style',
                    sld: sldObj[name]
                }, () => {
                    commit({
                        type: UPDATE_ALL_SLD,
                        options: {
                            name,
                            sld: sldObj[name]
                        }
                    });
                },
                error => {
                    errorSLD({ commit }, error);
                });
            });
        },
        deleteStyle
    },
    ADD_LAYER,
    UPDATE_CURRENT_SLD,
    ERROR_SLD,
    SELECT_LAYER,
    SET_BACKGROUND_COLOR,
    SET_ZOOM,
    SET_MAP_SIZE,
    SET_MAP_CENTER,
    UPDATE_LAYERS,
    UPDATE_LAYER,
    UPDATE_ALL_SLD,
    CLEAR_INFO,
    GET_INFO
};
