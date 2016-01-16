var WebSocketServer = require('websocket').server;
var http = require('http');

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
            if (message.utf8Data === 'connected') {
                var id = CLIENTS.length;
                connection.send(JSON.stringify({
                    "id" : id,
                    "message" : "connection accepted"
                }));
                CLIENTS.push(connection);
            } else if (message.utf8Data === 'ping') {
                connection.sendUTF("pong")
            }

        }
    });

    connection.on('close', function(connection) {
        // close user connection
        console.log("### USER CONNECTION CLOSED.");
    });
});