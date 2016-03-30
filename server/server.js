var WebSocketServer = require('websocket').server;
var http = require("http")
var express = require("express")
var app = express()
var port = process.env.PORT || 5000

// server static pages
app.use(express.static(__dirname + "/client/"))


var STREAM_URL = "https://soundcloud.com/futureclassic/chrome-sparks-lookin-at-me-2";
//var firstQueue = { streamURL: STREAM_URL };
var CLIENTS = [];
var PINGTIMES = [];
var PLAY_MSG_RECEIVED_TIME = 0;
var PLAY_DELAY = 5000;
var PING_DICTIONARY = {};
var TRACK_LIST = { /*head: firstQueue, tail: firstQueue*/ };

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

                CLIENTS.push({ connection: connection });
                PINGTIMES.push(0);
                console.log("Connection from user " + id + " accepted.", connection);

                sendJSON(CLIENTS[id], {
                    "id" : id,
                    "message" : "connection accepted"
                });
                // DEFAULT STREAM
                // sendJSON(connection, {
                //     "message" : "newTrack",
                //     "streamURL" : STREAM_URL,
                //     "trackTitle" : "Fire Track by Flaming Lips"
                // }); 
                // On connection now triggers a getQueue on the client side
                // DEFAULT STREAM

            } else if (json.message === 'ping') {
                console.log("Ponging the ping.");
                sendMessage({ connection: connection }, "pong")

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
                }, PLAY_DELAY * 3);

            } else if (json.message === 'play_pong') {
                var id = json.user_id;
                var client_timestamp = json.timestamp;
                var now = new Date().getTime();
                var latency = now - PINGTIMES[id];
                console.log("Latency for user", id, ":", latency, "ms.");

                // ACCUMULATE AN AVERAGE PING FOR 3 Values
                // If entry exists, add accummulating average
                if (PING_DICTIONARY[id]){
                    var newAverage = latency + PING_DICTIONARY[id].averagePing * PING_DICTIONARY[id].loopCount;
                    PING_DICTIONARY[id].loopCount++;
                    PING_DICTIONARY[id].averagePing = newAverage / PING_DICTIONARY[id].loopCount;

                    // loop pings count
                    if (PING_DICTIONARY[id].loopCount < 5){
                        // After resetting the markers restart the loop
                        PINGTIMES[id] = new Date().getTime();
                        sendMessage(CLIENTS[id], "play_ping");
                        return;
                    }
                }

                // If entry does not exist, initialize with first ping and send another ping loop
                else {
                    PING_DICTIONARY[id] = { averagePing: latency, loopCount: 1 };

                    // After resetting the markers restart the loop
                    PINGTIMES[id] = new Date().getTime();
                    sendMessage(CLIENTS[id], "play_ping");
                    return;
                }

                console.log("AVERAGE Latency for user", id, ":", PING_DICTIONARY[id].averagePing, "ms.");

                //var difference = client_timestamp - (latency/2) - PLAY_MSG_RECEIVED_TIME;
                var difference = client_timestamp - parseInt(PING_DICTIONARY[id].averagePing) - PLAY_MSG_RECEIVED_TIME;

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

            } else if (json.message === 'queueTrack') {
                TRACK_LIST.addToQueue(json.streamURL);
                console.log(TRACK_LIST);

                console.log("Broadcasting queueTrack message to " + CLIENTS.length + " clients.");
                for (var i = 0; i < CLIENTS.length; i++) {
                    sendMessage(CLIENTS[i], "queueTrack", "streamURL", json.streamURL);

                }
            } else if (json.message === 'getQueue') {
                var queue = TRACK_LIST.getQueue();
                // console.log("Broadcasting getQueue message to " + CLIENTS.length + " clients.");
                // for (var i = 0; i < CLIENTS.length; i++) {
                //     

                // }
                sendMessage(CLIENTS[json.user_id], "getQueue", "queue", queue);

            } else if (json.message === 'nextTrack') {
                console.log("nextTrack: ", TRACK_LIST.getNext(), " Remaining ", TRACK_LIST);

                console.log("Broadcasting nextTrack message to " + CLIENTS.length + " clients.");
                for (var i = 0; i < CLIENTS.length; i++) {
                    sendMessage(CLIENTS[i], "nextTrack");

                }
            } else if (json.message === 'setUsername') {
                console.log("setUsername: ", json.username);

                var id =  json.user_id;
                console.log("### SETTING USERNAME: ", CLIENTS[id], json.username);
                CLIENTS[id].username = json.username;
                sendMessage(CLIENTS[id], "setUsername", "username", CLIENTS[id].username);
            }

        }
    });

    connection.on('close', function(connection) {
        // close user connection
        console.log("### USER CONNECTION CLOSED.");
    });
});

// initialize TRACK_LIST as a linked list
TRACK_LIST.getCurrent = function(){ 
    return TRACK_LIST.head; 
}
TRACK_LIST.getNext = function(){ 
    console.log("getNext:", TRACK_LIST);
    
    if (!TRACK_LIST.head){
    // If head is undefined return undefined
        // Stops firing of other conditions
        return TRACK_LIST.head;

    } else if (!TRACK_LIST.head.next){ 
    // If next is undefined, then new head is undefined but tail would still hold a reference
        var temp = TRACK_LIST.head;

        TRACK_LIST.head = undefined;
        TRACK_LIST.tail = undefined;

        return temp;

    } else {
        // Otherwise new head is next in line
        TRACK_LIST.head = TRACK_LIST.head.next; 
        return TRACK_LIST.head; 
    }
}
TRACK_LIST.addToQueue = function(newTrack){

    var trackObj = { id: TRACK_LIST.trackingID, streamURL: newTrack };
    TRACK_LIST.trackingID++;

    if (TRACK_LIST.head !== undefined){
        // If queue is not empty then add object to the end of the tail
        TRACK_LIST.tail.next = trackObj;
        TRACK_LIST.tail = trackObj; //TRACK_LIST.tail.next;
    } else {
        // IF queue is empty head and tail will be same track
        TRACK_LIST.head = trackObj;
        TRACK_LIST.tail = trackObj;
    }
}
TRACK_LIST.getQueue = function(){ 
    // Send an array with the remaining queue
    var queue = [];
    var currentTrack = TRACK_LIST.head;
    while (currentTrack){
        queue.push(currentTrack.streamURL);
        currentTrack = currentTrack.next;
    }

    return queue;
}
TRACK_LIST.trackingID = 0;

//console.log(TRACK_LIST);

// helpers

function sendJSON(user_obj, json_obj) {
    console.log("CLIENTS: ", CLIENTS);
    console.log("### MESSAGE SENDING: ", JSON.stringify(json_obj));
    user_obj.connection.send(JSON.stringify(json_obj));
}

function sendMessage(user_obj, msg, extra, value) {
    var obj = {"message" : msg};

    // Add in extra parameters for things like seek or new track
    if (extra && value){ 
        obj[extra] = value; 
    }

    sendJSON(user_obj, obj);
}