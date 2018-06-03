/* copyright 2018, stefano bovio @allyoucanmap. */

/* eslint-disable no-console */

const express = require("express");
const path = require('path');
const port = 3000;
const app = express();
const proxy = require('express-http-proxy');

const application = (before = () => {}) => {

    before(app);

    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
        if ('OPTIONS' === req.method && req.url && req.url.indexOf('geoserver') !== -1) {
            res.send(200);
        } else {
            next();
        }
    });

    app.use(express.static('./'));

    app.use('/', proxy('http://localhost:8080/geoserver'));

    app.use('http://localhost:3000/', function (req, res) {
        res.sendFile(path.resolve('./index.html'));
    });

    app.listen(port, function (error) {
        if (error) throw error;
        console.warn("Express server listening on port", port);
    });
};

module.exports = application;
