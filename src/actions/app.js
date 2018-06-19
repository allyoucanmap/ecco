/* copyright 2018, stefano bovio @allyoucanmap. */

import {parseStyle} from '../utils/SLDUtils';
import styleAPI from '../api/style';
import wmsAPI from '../api/wms';

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
const LOADING = 'LOADING';
const UPDATE_SETTINGS = 'UPDATE_SETTINGS';
const GET_CAPABILITIES = 'GET_CAPABILITIES';

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

const loading = ({ commit }, load) => {
    commit({
        type: LOADING,
        load
    });
};

const clearInfo = ({commit}) => {
    commit({
        type: CLEAR_INFO
    });
};

export default {
    actions: {
        addLayer({ commit, state }, layer) {

            const settings = {...state.settings};

            loading({ commit }, true);
            if (layer.type === 'group') {
                commit({
                    type: ADD_LAYER,
                    layer
                });
                loading({ commit }, false);
            } else {
                styleAPI.getStyle({
                    options: {
                        name: (layer.style || layer.name + '~ecco~style') + '.sld'
                    },
                    settings
                }, sld => {
                    styleAPI.updateStyle({
                        options: {
                            name: layer.name + '~ecco~style~tmp',
                            sld
                        },
                        settings
                    });
                    parseStyle(sld, ({rules = []}) => {
                        if (rules.length > 0) {
                            rules.forEach((rule, idx) => {
                                commit({
                                    type: ADD_LAYER,
                                    layer: {...(rule.type === 'layer' ? layer : {}), ...rule}
                                });
                                if (idx === rules.length - 1) {
                                    loading({ commit }, false);
                                }
                            });
                        } else {
                            commit({
                                type: ADD_LAYER,
                                layer
                            });
                            loading({ commit }, false);
                        }
                    });
                }, () => {
                    commit({
                        type: ADD_LAYER,
                        layer
                    });
                    loading({ commit }, false);
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
        clearInfo,
        getInfo: ({commit, state}, options) => {
            loading({ commit }, true);
            clearInfo({commit});
            const settings = {...state.settings};
            wmsAPI.getInfo({options, settings},
                data => {
                    commit({
                        type: GET_INFO,
                        data
                    });
                    loading({ commit }, false);
                }, () => {
                    loading({ commit }, false);
                }
            );
        },
        updateStyle ({ commit, state }, options) {
            const settings = {...state.settings};
            loading({ commit }, true);
            styleAPI.updateStyle({
                options,
                settings
            }, () => {
                updateCurrentSLD({ commit }, {...options});
                loading({ commit }, false);
            },
            error => {
                errorSLD({ commit }, error);
                loading({ commit }, false);
            });
        },
        updateAllSLD ({ commit, state }, sldObj) {
            const settings = {...state.settings};
            loading({ commit }, true);
            Object.keys(sldObj).forEach(name => {
                styleAPI.updateStyle({
                    options: {
                        name: name + '~ecco~style',
                        sld: sldObj[name]
                    },
                    settings
                }, () => {
                    commit({
                        type: UPDATE_ALL_SLD,
                        options: {
                            name,
                            sld: sldObj[name]
                        }
                    });
                    loading({ commit }, false);
                },
                error => {
                    errorSLD({ commit }, error);
                    loading({ commit }, false);
                });
            });
        },
        updateSettings({ commit }, settings) {
            commit({
                type: UPDATE_SETTINGS,
                settings
            });
        },
        getCapabilities({ commit, state }) {
            loading({ commit }, true);
            const settings = {...state.settings};
            wmsAPI.getCapabilities({settings},
                capabilities => {
                    commit({
                        type: GET_CAPABILITIES,
                        capabilities
                    });
                    loading({ commit }, false);
                },
                () => loading({ commit }, false)
            )
        },
        loading
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
    GET_INFO,
    LOADING,
    UPDATE_SETTINGS,
    GET_CAPABILITIES
};
