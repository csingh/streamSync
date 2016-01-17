// attach event handlers
$("#play").click(play);

// if user is running mozilla then use it's built-in WebSocket
window.WebSocket = window.WebSocket || window.MozWebSocket;

var host = location.origin.replace(/^http/, 'ws')
var connection = new WebSocket(host);

var USER_ID = -1;

connection.onopen = function () {
    // connection is opened and ready to use
    console.log("### CONNECTION IS OPEN.");
    sendMessage("connected");
};

connection.onerror = function (error) {
    // an error occurred when sending/receiving data
    console.log("### CONNECTION ERROR.");
};

connection.onmessage = function (message) {
    // try to decode json (I assume that each message from server is json)
    console.log("### MESSAGE RECEIVED: ", message.data);
    try {
        var json = JSON.parse(message.data);
    } catch (e) {
        console.log('This doesn\'t look like a valid JSON: ', message.data);
        return;
    }

    if (json.message == "connection accepted") {
        USER_ID = json.id;
        $("#user_id").html(USER_ID);
    }

};

// helpers

function heartbeat() {
    console.log("heartbeat");
    sendMessage("ping");
    setTimeout(function() {
        heartbeat();
    }, 2000);
}

function sendJSON(json_obj) {
    connection.send(JSON.stringify(json_obj));
}

function sendMessage(msg) {
    sendJSON({"message" : msg});
}

function play() {
    sendMessage("play");
}