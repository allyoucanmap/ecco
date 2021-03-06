/* copyright 2018, stefano bovio @allyoucanmap. */

import axios from 'axios';

const getStyle = ({options, settings}, response = () => {}, error = () => {}) => {
    axios.get(`${settings.source ? settings.source : 'http://localhost:8080/geoserver'}/rest/styles/${options.name.replace(/\:/g, '_')}`, {
        params: {
            ...options.params
        },
        auth: {
            username: settings.username,
            password: settings.password
        }
    })
    .then(({data}) => response(data))
    .catch(e => {
        if (e && e.response && e.response.status === 404) {
            error('Style not found');
        }
    });
};

const updateStyle = ({options, settings}, response = () => {}, error = () => {}) => {

    axios.put(`${settings.source ? settings.source : 'http://localhost:8080/geoserver'}/rest/styles/${options.name.replace(/\:/g, '_')}`, options.sld, {
        headers: {
            'Content-Type': 'application/vnd.ogc.sld+xml'
        },
        auth: {
            username: settings.username,
            password: settings.password
        }
    })
    .then(() => response({...options}))
    .catch(e => {
        if (e && e.response && (e.response.status === 404 || e.response.status === 400)) {
            error('Style not found');
            axios.post(`${settings.source ? settings.source : 'http://localhost:8080/geoserver'}/rest/styles`, options.sld, {
                params: {
                    name: options.name.replace(/\:/g, '_')
                },
                headers: {
                    'Content-Type': 'application/vnd.ogc.sld+xml'
                },
                auth: {
                    username: settings.username,
                    password: settings.password
                }
            })
            .then(() => response({...options}))
            .catch(() => error('Style not created'));
        }
    });
};

const deleteStyle = ({options, settings}) => {
    axios.delete(`${settings.source ? settings.source : 'http://localhost:8080/geoserver'}/rest/styles/${options.name.replace(/\:/g, '_')}`, {
        auth: {
            username: settings.username,
            password: settings.password
        }
    })
    .then(() => {})
    .catch(() => {});
};

export default {
    getStyle,
    updateStyle,
    deleteStyle
};
