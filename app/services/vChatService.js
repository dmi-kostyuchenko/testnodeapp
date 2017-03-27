const private = {
    io: null,

    users: {},

    init: function (server) {
        this.io = require('socket.io')(server);

        this.events();
    },
    events: function () {
        private.io.sockets.on('connection', function (socket) {

            socket.on("room", function (json) {
                private.users[json.id] = socket;
                if (socket.room !== undefined) {
                    // Если сокет уже находится в какой-то комнате, выходим из нее
                    socket.leave(socket.room);
                }
                // Входим в запрошенную комнату
                socket.room = json.room;
                socket.join(socket.room);
                socket.user_id = json.id;
                // Отправялем остальным клиентам в этой комнате сообщение о присоединении нового участника
                socket.broadcast.to(socket.room).emit("new", json.id);
            });

            socket.on("webrtc", function (json) {
                if (json.to !== undefined && private.users[json.to] !== undefined) {
                    // Если в сообщении указан получатель и этот получатель известен серверу, отправляем сообщение только ему...
                    private.users[json.to].emit("webrtc", json);
                } else {
                    // ...иначе считаем сообщение широковещательным
                    socket.broadcast.to(socket.room).emit("webrtc", json);
                }
            });

            socket.on("disconnect", function () {
                // При отсоединении клиента, оповещаем об этом остальных
                socket.broadcast.to(socket.room).emit("leave", socket.user_id);
                delete private.users[socket.user_id];
            });
        });
    }
};

module.exports = function (server) {
    private.init(server);

    return {
    };
};