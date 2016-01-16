document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM ready");
    // Save player object
    var player = document.getElementById('player');
    var trackHeading = document.getElementById('track-title');

    // Once URL is received, set it as the player.src
    //player.src="https://api.soundcloud.com/tracks/293/stream?client_id=86e82361b4e6d0f88da0838793618a92"
    player.src="https://api.soundcloud.com/tracks/53126096/stream?client_id=86e82361b4e6d0f88da0838793618a92"
    trackHeading.innerHTML = "Marijuana by Chrome Sparks";
    // After the player is ready and ws says play
    player.play();
});


// Setup connection with Webserver via websocket
var exampleSocket = new WebSocket("ws://www.example.com/socketserver", "streamSync");

//Error HANDLERS
exampleSocket.onerror = function (error){
    console.log("Error while establishing WS: ", error);
}

//Close HANDLERS
exampleSocket.onclose = function (event){
    console.log("WS Closed ", event);
    alert("Connecton to Server Closed");
}

// Connection ready listener
exampleSocket.onopen = function (event) {
  //exampleSocket.send("Here's some text that the server is urgently awaiting!"); 
  console.log("WebSocket Ready!");
};

// Once connection is setup wait for events to trigger
exampleSocket.onmessage = function (event) {
  console.log("Message Received: ", event.data);
}

/// WEBSOCKET EVENT HANDLERS


// Button control functions
function play (){
    player.play();
}

function pause(){
    player.pause();
}

var JSON = {
    streamURL: "https://api.soundcloud.com/tracks/53126096/stream?client_id=86e82361b4e6d0f88da0838793618a92",
    seek: "", // seek in seconds,
    buffered: 0.13, // decimal value?
    play: true,
    pause: false
}



// Send update message to server
function sendText(type) {

    switch(type){
        case "play":
            var msg = { type: type, play: true };
            break;
        case "pause":
            var msg = { type: type, pause: true };
            break;
        case "buffered":
            var msg = { type: type, buffered: true };
            break;
        default:
            alert("Error");
            console.log("sendText function received unhandled type: ", type); 
            return;
    }

  // Send the msg object as a JSON-formatted string.
  exampleSocket.send(JSON.stringify(msg));
  
  // Blank the text input element, ready to receive the next line of text from the user.
  //document.getElementById("text").value = "";
}
