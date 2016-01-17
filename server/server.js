var WebSocketServer = require('websocket').server;
var http = require("http")
var express = require("express")
var app = express()
var port = process.env.PORT || 5000

// server static pages
app.use(express.static(__dirname + "/client/"))


var STREAM_URL = "https://api.soundcloud.com/tracks/53126096/stream?client_id=86e82361b4e6d0f88da0838793618a92";
var CLIENTS = [];

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
                console.log("Connection from user " + id + " accepted.");

            } else if (json.message === 'ping') {
                console.log("Ponging the ping.");
                sendMessage(connection, "pong")

            } else if (json.message === 'play') {
                console.log("Broadcasting play message to " + CLIENTS.length + " clients.");
                for (var i = 0; i < CLIENTS.length; i++) {
                    sendMessage(CLIENTS[i], "play");
                }

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