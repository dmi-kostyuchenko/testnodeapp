'use strict';

var express = require('express');
//var io = require('socket.io');
var path = require('path');
var cookieParser = require('cookie-parser');

var app = express();

let chatService = require('./services/chatProcessingService')(app);

var port = process.env.PORT || 1337;

//var ioapp = io.listen(8080);

app.use(cookieParser());
app.use(express.static('public'));
app.use(express.static('/clientscripts'));

app.route('/')
    .get(function (req, res) {

        chatService.identifyUser(req, res);

        res.sendFile(path.join(__dirname + '/views/home.html'));
    });
//var history = [];

//ioapp.sockets.on('connection', function (socket) {
//    console.log('user connected');
//    socket.emit('news', { history: history });
//
//    socket.on('outbox', function (data) {
//        console.log(data);
//        socket.emit('outboxack');
//
//        data.id = uuidV4();
//        history.push(data);
//
//        var chat = ioapp.of('/');
//        chat.emit('inbox', data);
//    });
//
//    socket.on('disconnect', function () {
//        console.log('user disconnected');
//    });
//});