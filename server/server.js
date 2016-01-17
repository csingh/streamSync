var WebSocketServer = require('websocket').server;
var http = require("http")
var express = require("express")
var app = express()
var port = process.env.PORT || 5000

// server static pages
app.use(express.static(__dirname + "/client/"))


var STREAM_URL = "https://soundcloud.com/futureclassic/chrome-sparks-lookin-at-me-2";
var CLIENTS = [];
var PINGTIMES = [];
var PLAY_MSG_RECEIVED_TIME = 0;
var PLAY_DELAY = 5000;

var server = http.createServer(app)
server.listen(port)
console.log("### LISTENING ON PORT " + port + ".");

// create the server
wsServer = new WebSocketServer({
    httpServer: server
});

// WebSocket server
wsServer.on('request', function(request) {
    var connection = request.accept(null, request.origin);

    // This is the most important callback for us, we'll handle
    // all messages from users here.
    connection.on('message', function(message) {
        console.log("### PROCESS MESSAGE:", message);
        if (message.type === 'utf8') {
            // process WebSocket message
            try {
                var json = JSON.parse(message.utf8Data);
            } catch (e) {
                console.log('This doesn\'t look like a valid JSON: ', message.data);
                return;
            }

            console.log("Message JSON:", json);

            if (json.message === 'connected') {
                var id = CLIENTS.length;
                sendJSON(connection, {
                    "id" : id,
                    "message" : "connection accepted"
                });
                sendJSON(connection, {
                    "message" : "newTrack",
                    "streamURL" : STREAM_URL,
                    "trackTitle" : "Fire Track by Flaming Lips"
                });
                CLIENTS.push(connection);
                PINGTIMES.push(0);
                console.log("Connection from user " + id + " accepted.");
            } else if (json.message === 'ping') {
                console.log("Ponging the ping.");
                sendMessage(connection, "pong")

            } else if (json.message === 'play') {
                PLAY_MSG_RECEIVED_TIME = new Date().getTime();
                console.log("Broadcasting play message to " + CLIENTS.length + " clients.");
                for (var i = 0; i < CLIENTS.length; i++) {
                    // send "ping" to get latency, send play instructions on "pong" from client
                    PINGTIMES[i] = new Date().getTime();
                    sendMessage(CLIENTS[i], "play_ping");
                }

                setTimeout(function() {
                    for (var i = 0; i < CLIENTS.length; i++) {
                        sendMessage(CLIENTS[i], "seektime");
                    }
                }, PLAY_DELAY * 2);

            } else if (json.message === 'play_pong') {
                var id = json.user_id;
                var client_timestamp = json.timestamp;
                var now = new Date().getTime();
                var latency = now - PINGTIMES[id];
                console.log("Latency for user", id, ":", latency, "ms.");

                var difference = client_timestamp - (latency/2) - PLAY_MSG_RECEIVED_TIME;

                console.log("Difference time: " + difference);
                var client_play_time = PLAY_MSG_RECEIVED_TIME + PLAY_DELAY + difference;

                sendJSON(CLIENTS[id], {
                    "message" : "play_at",
                    "play_time" : client_play_time
                });
            } else if (json.message === 'pause') {
                console.log("Broadcasting pause message to " + CLIENTS.length + " clients.");
                for (var i = 0; i < CLIENTS.length; i++) {
                    sendMessage(CLIENTS[i], "pause");
                }
            } else if (json.message === 'seek') {
                console.log("Broadcasting seek message to " + CLIENTS.length + " clients.");
                for (var i = 0; i < CLIENTS.length; i++) {
                    sendMessage(CLIENTS[i], "seek", "seek", json.seek);

                }
            } else if (json.message === 'seektime') {
                console.log("User", json.user_id, "seek time:", json.seektime);
            } else if (json.message === 'newTrack') {
                console.log("Broadcasting newTrack message to " + CLIENTS.length + " clients.");
                for (var i = 0; i < CLIENTS.length; i++) {
                    sendMessage(CLIENTS[i], "newTrack", "streamURL", json.streamURL);

                }
            }

        }
    });

    connection.on('close', function(connection) {
        // close user connection
        console.log("### USER CONNECTION CLOSED.");
    });
});

// helpers

function sendJSON(connection, json_obj) {
    console.log("### MESSAGE SENDING: ", JSON.stringify(json_obj));
    connection.send(JSON.stringify(json_obj));
}

function sendMessage(connection, msg, extra, value) {
    var obj = {"message" : msg};

    // Add in extra parameters for things like seek or new track
    if (extra && value){ 
        obj[extra] = value; 
    }

    sendJSON(connection, obj);
}