$(function () {
    var ioUrl = '//' + window.location.hostname + ':' + window.ioport;

    $.getScript(ioUrl + '/socket.io/socket.io.js', function () {
        var socket = io.connect(ioUrl);

        socket.on('history', function (data) {
            if (data.history) {
                $(data.history).each(function () {
                    renderMessage(this);
                });
            }

            socket.emit('tokenpass', getCookie('userToken'));
        }).on('inbox', function (data) {
            renderMessage(data);
            socket.emit('inboxack');
        }).on('outboxack', function (data) {
            $('#outbox').val('');
        }).on('leave', function (data) {
            renderMessage({ sender: data, text: 'I have left the chat...' });
        });

        $('#outbox').on('keypress', function (e) {
            if (e.which === 13) {
                socket.emit('outbox', { text: $(this).val(), senderId: getCookie('userToken') });
            }
            if (e.which === 10) {
                var text = $(this).val();
                $(this).val(text + '\r\n');
            }
        });
    });
});

function renderMessage(message) {
    $('#messages').append(
        '<p data-message-id="' + message.id + '">' +
            '<b>' +
                showSender(message) +
            ':&nbsp;</b>' +
            '<pre>' +
                message.text +
            '</pre>' +
        '</p>');

}

function showSender(message) {
    var myId = getCookie('userToken');
    if (message.sender) {
        return myId === message.sender.id ? "Me" : message.sender.name;
    } else {
        return myId === message.senderId ? "Me" : message.senderId;
    }
}

function getCookie(name) {
    var matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
}