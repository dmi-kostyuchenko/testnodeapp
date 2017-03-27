const private = {
    path: require('path'),
    mustache: require('mustache'),
    fs: require('fs'),

    dir: null,
    enc: 'utf-8',

    init: function () {
        this.dir = private.path.join(private.path.dirname(require.main.filename), '/app/views/');

        this.fs.readFileAsync = function (filename, encoding) {
            return new Promise(function (resolve, reject) {
                try {
                    private.fs.readFile(filename, encoding, function (err, buffer) {
                        if (err) reject(err); else resolve(buffer);
                    });
                } catch (err) {
                    reject(err);
                }
            });
        };
    },

    renderView: function (res, viewPath, model) {
        private.fs.readFileAsync(private.mapViewPath(viewPath), private.enc).then(function (template) {
            res.setHeader('content-type', 'text/html');
            res.write(private.mustache.render(template, model));
            res.end();
        });
    },

    mapViewPath: function (viewPath) {
        return private.path.join(private.dir, viewPath)
    }
};

//const path = require('path');
//const mustache = require('mustache');
//const Promise = require('bluebird');
//const fs = Promise.promisifyAll(require('fs'));
//
//const appDir = path.dirname(require.main.filename);
//const enc = 'utf-8';
//
//fs.readFileAsync = function (filename, encoding) {
//    return new Promise(function (resolve, reject) {
//        try {
//            fs.readFile(filename, encoding, function (err, buffer) {
//                if (err) reject(err); else resolve(buffer);
//            });
//        } catch (err) {
//            reject(err);
//        }
//    });
//};

private.init();

module.exports = private.renderView;