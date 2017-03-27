'use strict';

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const server = require('http').createServer(app);

const view = require('./app/services/simpleRenderingService');
const chat = require('./app/services/vChatService')(server);

process.env.PORT = process.env.PORT || 1337;

app.use(express.static('public'));

app.route('/')
    .get(function (req, res) {
        var model = {
            test: 'ololo'
        };
        view(res, 'index.html', model);
    });


server.listen(process.env.PORT);