var WebSocketServer = require("ws").Server
var http = require("http")
var express = require("express")
var app = express()
var port = process.env.PORT || 5000

// server static pages
app.use(express.static(__dirname + "/"))


var CLIENTS = [];

var server = http.createServer(app)

// maybe change
server.listen(port, function() {
    console.log("### LISTENING ON PORT " + port + ".");
});

// create the server
var wsServer = new WebSocketServer({server: server})

// WebSocket server
wsServer.on('request', function(request) {

  
    var connection = request.accept(null, request.origin);

    var id = setInterval(function() {
        connection.send(JSON.stringify(new Date()), function() {  })
    }, 1000)


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
                CLIENTS.push(connection);
                console.log("Connection from user " + id + " accepted.");
            } else if (json.message === 'ping') {
                console.log("Ponging the ping.");
                sendMessage(connection, "pong")
            } else if (json.message === 'play') {
                console.log("Broadcasting play message to " + CLIENTS.length + " clients.");
                for (var i = 0; i < CLIENTS.length; i++) {
                    sendMessage(CLIENTS[i], "playing");
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
