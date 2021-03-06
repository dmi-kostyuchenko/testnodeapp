var chatlog = document.getElementById("chatlog");
var message = document.getElementById("message");
var connection_num = document.getElementById("connection_num");
var room_link = document.getElementById("room_link");

var PeerConnection = window.RTCPeerConnection;
var SessionDescription = window.RTCSessionDescription;
var IceCandidate = window.RTCIceCandidate;

function uuid() {
    var s4 = function () {
        return Math.floor(Math.random() * 0x10000).toString(16);
    };
    return s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4();
}

var ROOM = location.hash.substr(1);

if (!ROOM) {
    ROOM = uuid();
}
room_link.innerHTML = "<a href='#" + ROOM + "'>Link to the room</a>";

var ME = uuid();

// ?????????, ??? ??? ???????? ????????? ????? ????????? ??????? ?????????? ?? ????
var socket = io.connect("", { "sync disconnect on unload": true });
socket.on("webrtc", socketReceived);
socket.on("new", socketNewPeer);
// ????? ?????????? ?????? ?? ???? ? ???????
socket.emit("room", { id: ME, room: ROOM });

// ??????????????? ??????? ??? ???????? ???????? ?????????, ????????? ? WebRTC
function sendViaSocket(type, message, to) {
    console.log(message.sdp);
    socket.emit("webrtc", { id: ME, to: to, type: type, data: message });
}

var server = {
    iceServers: [
        { url: "stun:stun.l.google.com:19302" },
        { url: "stun:stun1.l.google.com:19302" },
        { url: "stun:2stun.services.mozilla.com" },
        { url: "stun:stun.voipstunt.com" },
        { url: "turn:numb.viagenie.ca", credential: "awdrgyjilp", username: "mquewmor@sharklasers.com" }
    ]
};

var options = {
    //optional: [
    //    { DtlsSrtpKeyAgreement: true }, // ????????? ??? ?????????? ????? Chrome ? Firefox
    //    { RtpDataChannels: true } // ????????? ? Firefox ??? ????????????? DataChannels API
    //]
}

var peers = {};

function socketNewPeer(data) {
    peers[data] = {
        candidateCache: []
    };

    // ??????? ????? ???????????
    var pc = new PeerConnection(server, options);
    // ??????????????? ???
    initConnection(pc, data, "offer");

    // ????????? ???? ? ?????? ?????
    peers[data].connection = pc;

    var channel = pc.createDataChannel("mychannel", {});
    channel.owner = data;
    peers[data].channel = channel;

    bindEvents(channel);

    // ??????? SDP offer
    pc.createOffer(function (offer) {
        pc.setLocalDescription(offer);
    },
    function (err) {
        console.log(err);
    });
}

function initConnection(pc, id, sdpType) {
    console.log('init connection called');

    pc.onicecandidate = function (event) {
        console.log('onicecandidate');
        console.log(event.candidate);
        if (event.candidate) {
            // ??? ??????????? ?????? ICE ????????? ????????? ??? ? ?????? ??? ?????????? ????????
            peers[id].candidateCache.push(event.candidate);
        } else {
            // ????? ??????????? ?????????? ?????????, ?????????? ????? ?????? ??? ???, ?? ??? ?????????
            // ? ???? ?????? ?? ?????????? ???? ??????? SDP offer ??? SDP answer (? ??????????? ?? ????????? ???????)...
            sendViaSocket(sdpType, pc.localDescription, id);
            // ...? ????? ??? ????????? ????? ICE ?????????
            for (var i = 0; i < peers[id].candidateCache.length; i++) {
                sendViaSocket("candidate", peers[id].candidateCache[i], id);
            }
        }
    }
    pc.oniceconnectionstatechange = function (event) {
        console.log('ice candidate state cnage');
        console.log(pc.iceConnectionState);
        if (pc.iceConnectionState === "disconnected") {
            connection_num.innerText = parseInt(connection_num.innerText) - 1;
            delete peers[id];
        }
    }
    pc.ondatachannel = function (e) {
        peers[id].channel = e.channel;
        peers[id].channel.owner = id;
        bindEvents(peers[id].channel);
    }
}

function bindEvents(channel) {
    channel.onopen = function () {
        connection_num.innerText = parseInt(connection_num.innerText) + 1;
    };
    channel.onmessage = function (e) {
        chatlog.innerHTML += "<div>Peer says: " + e.data + "</div>";
    };
}

function socketReceived(json) {
    console.log(json.data.sdp);
    switch (json.type) {
        case "candidate":
            remoteCandidateReceived(json.id, json.data);
            break;
        case "offer":
            remoteOfferReceived(json.id, json.data);
            break;
        case "answer":
            remoteAnswerReceived(json.id, json.data);
            break;
    }
}

function remoteOfferReceived(id, data) {
    createConnection(id);
    var pc = peers[id].connection;

    pc.setRemoteDescription(new SessionDescription(data), function () {
        pc.createAnswer(function (answer) {
            console.log('remote description set');
            console.log(answer);
            pc.setLocalDescription(answer);
        },
        function (err) {
            console.log(err);
        });
    }, function (err) {
        console.log(err);
    });
    
}
function createConnection(id) {
    if (!peers[id]) {
        peers[id] = {
            candidateCache: []
        };
        var pc = new PeerConnection(server, options);
        initConnection(pc, id, "answer");

        peers[id].connection = pc;
    }
}

function remoteAnswerReceived(id, data) {
    var pc = peers[id].connection;
    pc.setRemoteDescription(new SessionDescription(data), function () {
        console.log('remote description on answer set');
        console.log(data);
    },
    function () {
        console.log(err);
    });
}

function remoteCandidateReceived(id, data) {
    createConnection(id);
    var pc = peers[id].connection;
    pc.addIceCandidate(new IceCandidate(data));
}

function sendMessage() {
    var msg = message.value;
    for (var peer in peers) {
        if (peers.hasOwnProperty(peer)) {
            if (peers[peer].channel !== undefined) {
                try {
                    peers[peer].channel.send(msg);
                } catch (e) {
                    console.log(e);
                }
            }
        }
    }
    chatlog.innerHTML += "<div>Peer says: " + msg + "</div>";
    message.value = "";
}

window.addEventListener("beforeunload", onBeforeUnload);

function onBeforeUnload(e) {
    for (var peer in peers) {
        if (peers.hasOwnProperty(peer)) {
            if (peers[peer].channel !== undefined) {
                try {
                    peers[peer].channel.close();
                } catch (e) {
                    console.log(e);
                }
            }
        }
    }
}