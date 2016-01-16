document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM ready");
    // Save player object
    var player = document.getElementById('player');

    // Once URL is received, set it as the player.src
    //player.src="https://api.soundcloud.com/tracks/293/stream?client_id=86e82361b4e6d0f88da0838793618a92"
    player.src="https://api.soundcloud.com/tracks/53126096/stream?client_id=86e82361b4e6d0f88da0838793618a92"

    // After the player is ready and ws says play
    player.play();
});


// Setup connection with Webserver via websocket
var exampleSocket = new WebSocket("ws://www.example.com/socketserver", "streamSync");

// Once connection is setup wait for events to trigger


/// WEBSOCKET EVENT HANDLERS


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
