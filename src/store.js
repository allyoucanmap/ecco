/* copyright 2018, stefano bovio @allyoucanmap. */

import Vue from 'vue';
import Vuex from 'vuex';
import createLogger from 'vuex/dist/logger';
import {cloneDeep} from 'lodash';
import history from './history';
Vue.use(Vuex);

const undoRedo = store => {
    history.init(store);
    history.add(cloneDeep({...store.state}));
    store.subscribe((mutation, state) => {
        history.add(cloneDeep({...state}));
    });
};

const debug = window.location && window.location.search && window.location.search === '?debug';

const requireActions = require.context('./actions/', true, /\.js$/);
const requireMutations = require.context('./mutations/', true, /\.js$/);
const requireGetters = require.context('./getters/', true, /\.js$/);
const modules = requireActions.keys().reduce((mdls, key) => {
    const { actions } = requireActions(key).default;
    const { mutations, state = {} } = requireMutations(key).default;
    const getters = requireGetters(key).default;
    return actions && mutations && {
        ...mdls,
        [key.replace(/\.js|\.\//g, '')]: {
            namespaced: true,
            actions: { ...actions },
            mutations: { ...mutations },
            state: { ...state },
            getters: { ...getters }
        }
    } || { ...mdls };
}, {});

const store = new Vuex.Store({
    modules,
    plugins: process.env.NODE_ENV !== 'production' && debug
        ? [undoRedo, createLogger({ collapsed: false })]
        : [undoRedo]
});

export default store;
