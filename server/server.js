var WebSocketServer = require('websocket').server;
var http = require('http');

var STREAM_URL = "https://api.soundcloud.com/tracks/53126096/stream?client_id=86e82361b4e6d0f88da0838793618a92";
var CLIENTS = [];

var server = http.createServer(function(request, response) {
    // process HTTP request. Since we're writing just WebSockets server
    // we don't have to implement anything.
});
server.listen(1337, function() {
    console.log("### LISTENING ON PORT 1337.");
});

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
    connection.send(JSON.stringify(json_obj));
}

function sendMessage(connection, msg) {
    sendJSON(connection, {"message" : msg});
}
