const private = {
    private: this,

    ioapp: null,
    uuidV4: null,

    history: [],
    users: [],

    init: function (app) {
        var server = require('http').createServer(app);
        this.ioapp = require('socket.io')(server);

        let port = process.env.PORT || 1337;
        server.listen(port);

        this.uuidV4 = require('uuid/v4');

        this.initEvents();
    },
    initEvents: function () {
        private.ioapp.sockets.on('connection', function (socket) {
            console.log('user connected');
            socket.emit('history', { history: private.history });

            socket.on('outbox', function (message) {
                console.log(message);
                socket.emit('outboxack');

                message.id = private.uuidV4();
                message.sender = private.getUser(message.senderId);

                private.history.push(message);

                private.chat('/').emit('inbox', message);
            });

            socket.on('tokenpass', function (userToken) {
                var user = private.getUser(userToken);
                if (user) {
                    user.sessionId = socket.client.id;

                    let message = {
                        text: 'I have entered the chat...',
                        id: private.uuidV4(),
                        sender: user,
                    };

                    private.history.push(message);

                    private.chat('/').emit('inbox', message);
                }
            });

            socket.on('disconnect', function () {
                console.log('user disconnected');
                var user = private.getUserBySession(socket.client.id);
                if (user) {
                    private.chat('/').emit('leave', user);
                }
            });
        });
    },


    identifyUser: function (req, res) {
        let currentUser = null;

        if (!req.cookies.userToken) {
            let uuid = private.uuidV4();
            res.cookie('userToken', uuid, { httpOnly: false });

            currentUser = private.createNewUser(uuid);
        } else {
            currentUser = private.getUser(req.cookies.userToken);
            if (!currentUser) currentUser = private.createNewUser(req.cookies.userToken);
        }
    },
    getUser: function (uuid) {
        for (let i = 0; i < private.users.length; ++i) {
            if (private.users[i].id === uuid) return private.users[i];
        }

        return null;
    },
    getUserBySession: function (sessionId) {
        for (let i = 0; i < private.users.length; ++i) {
            if (private.users[i].sessionId === sessionId) return private.users[i];
        }

        return null;
    },
    createNewUser: function (uuid) {
        let newUser = {
            id: uuid,
            name: 'user' + private.users.length
        };
        private.users.push(newUser);

        return newUser;
    },

    chat: function (room) {
        return private.ioapp.of(room);
    }
};

module.exports = function (app) {
    private.init(app);

    return {
        identifyUser: private.identifyUser,
    }
};