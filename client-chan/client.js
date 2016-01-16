// if user is running mozilla then use it's built-in WebSocket
window.WebSocket = window.WebSocket || window.MozWebSocket;

var connection = new WebSocket('ws://127.0.0.1:1337');

connection.onopen = function () {
    // connection is opened and ready to use
    console.log("### CONNECTION IS OPEN.");
    connection.send("connected")
};

connection.onerror = function (error) {
    // an error occurred when sending/receiving data
    console.log("### CONNECTION ERROR.");
};

connection.onmessage = function (message) {
    // try to decode json (I assume that each message from server is json)
    console.log("### MESSAGE RECEIVED: ", message);
    try {
        var json = JSON.parse(message.data);
    } catch (e) {
        console.log('This doesn\'t look like a valid JSON: ', message.data);
        return;
    }
    // handle incoming message
};

function heartbeat() {
    console.log("heartbeat");
    connection.send("ping");
    setTimeout(function() {
        heartbeat();
    }, 2000);
}
