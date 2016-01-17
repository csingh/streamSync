var playerReady = false;
var trackHeading;
var bufferView;
var USER_ID = -1;
var exampleSocket;

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM ready");
    // Save player object
    var player = document.getElementById('player');

    console.log("player object is exposed as window.player");
    window.player = player;

    trackHeading = document.getElementById('track-title');
    bufferView = document.getElementById("track-buffered");

    // Once URL is received, set it as the player.src
    //player.src="https://api.soundcloud.com/tracks/293/stream?client_id=86e82361b4e6d0f88da0838793618a92"
    // player.src="https://api.soundcloud.com/tracks/53126096/stream?client_id=86e82361b4e6d0f88da0838793618a92"
    // trackHeading.innerHTML = "Marijuana by Chrome Sparks";
    // After the player is ready and ws says play
    playerReady = true;
    player.controls = true;
    //player.play();

    // Setup connection with Webserver via websocket
    exampleSocket = new WebSocket('ws://127.0.0.1:1337');

    //Error HANDLERS
    exampleSocket.onerror = function (error){
        console.log("Error while establishing WS: ", error);
    }

    //Close HANDLERS
    exampleSocket.onclose = function (event){
        console.log("WS Closed ", event);
        //alert("Connecton to Server Closed");
    }

    // Connection ready listener
    exampleSocket.onopen = function (event) {
      //exampleSocket.send("Here's some text that the server is urgently awaiting!"); 
      console.log("WebSocket Ready!");
      sendMessage("connected");
    };

    // Once connection is setup wait for events to trigger
    exampleSocket.onmessage = function (event) {
        var data = event.data;
        console.log("### MESSAGE RECEIVED: ", event, data);

        try {
            var json = JSON.parse(event.data);
        } catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', event.data);
            return;
        }

        switch(json.message){
            case "connection accepted":
                USER_ID = json.id;
                $("#user_id").html(USER_ID);
                break;
            case "newTrack":
                setTrack(json.streamURL);
                // Send confirmation back to server?
                break;
            case "seek":
                setPlayerTime(json.seek);
                break;
            case "play":
                play();
                break;
            case "pause":
                pause();
                break;
            case "getBufferedValue":
                var bufferRatio = getBufferedValue();
                sendBufferValue(bufferRatio);
                break;
            default:
                console.log("Un-recognized Request", json.type);
                break;
        }

    }
});

function l(object){ console.log(object); }
    // streamURL: "https://api.soundcloud.com/tracks/53126096/stream?client_id=86e82361b4e6d0f88da0838793618a92",
    // seek: "", // seek in seconds,
    // buffered: 0.13, // decimal value?
    // play: true,
    // pause: false

/// WEBSOCKET EVENT HANDLERS


//***************** Player control functions/API *****************
function setTrack(url){
    player.src = url;
}

function play (){
    player.play();
}

function pause(){
    player.pause();
}

function playerStartTime(){
    console.log( "playerStartTime", player.seekable.start(0) );
    return player.seekable.start(0);  // Returns the starting time (in seconds)
}

function playerEndingTime(){
    console.log( "playerEndingTime", player.seekable.end(0) );
    return player.seekable.end(0);    // Returns the ending time (in seconds)
}

function setPlayerTime(seconds){
    console.log( "setPlayerTime", player.currentTime = seconds );
    return player.currentTime = seconds; // Seek to 122 seconds
}

function getPlayerCurrentTime(){
    console.log("getPlayerCurrentTime", player.currentTime);
    return player.currentTime;  
}

function getBufferedValue(){
    // Return what decimal of track has been buffered
    //console.log( "getBufferedValue", player.buffered );
    var timeRanges = player.buffered;

    if (timeRanges.length > 0){
        // If length is greater than 0 then there is atleast some buffering done
        // Only check the first buffer to see if it starts are zero
        var start = timeRanges.start(0);
        if (start === 0) {
        // If it starts at zero then check for where it ends, that is the buffer length
            return timeRanges.end(0) / playerEndingTime();

        } else { return 0; } // Else return zer0

    } else { return 0; } // Else return zer0

}
//***************** Player control functions/API *****************

function updateBufferVals(){
    var bufferVal = getBufferedValue();
    bufferView.innerHTML = String(bufferVal);
    console.log("Current buffer value: ", bufferVal);
}

// Buffer reference -- https://developer.mozilla.org/en-US/Apps/Build/Audio_and_video_delivery/buffering_seeking_time_ranges

//***************** Server control functions/API *****************

// Send requests
function sendSynchronizedPlayRequest() {
    sendMessage("play");
}

function sendSynchronizedPauseRequest(){}

function sendSynchronizedSeekRequest(){}

function sendNewTrackUrl(url){}

function sendBufferValue(){}

//***************** Server control functions/API *****************


// Send update message to server
function createServerMessage(type) {

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
  
  // Blank the text input element, ready to receive the next line of text from the user.
  //document.getElementById("text").value = "";
}

function sendJSON(json_obj) {
    exampleSocket.send(JSON.stringify(json_obj));
}

function sendMessage(msg) {
    sendJSON({"message" : msg});
}
