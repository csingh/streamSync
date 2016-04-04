var playerReady = false;
var trackHeading;
var bufferView;
var USER_ID = -1;
var exampleSocket;
var PINGTIME = 0;
var PONGTIME = 0;
var TRACK_LIST = {};

// ---- INIT ----

console.log("Running script.js");

// Save player object
var player = document.getElementById('player');
player.preload = "auto";

console.log("player object is exposed as window.player");
window.player = player;

// --- mobile stuff

var CACHED_SONG = null;
var KEEP_LOOPING = true;

function loop() {
    console.log("loop()");
    if (KEEP_LOOPING) {
        console.log("loop-de-loop");
        player.play();        
        window.setTimeout(loop, 1000);
    }
}

function cache_song(song_url) {
    console.log("cache_song:", song_url);
    CACHED_SONG = song_url;
    var CACHER = new Audio(song_url);
    CACHER.preload = "auto";
}

function play_song() {
    KEEP_LOOPING = false
    player.src = CACHED_SONG;
    player.play();
}


$("#ready").click(function() {
    loop();
});

// --- end mobile stuff ---

trackHeading = document.getElementById('track-title');
bufferView = document.getElementById("track-buffered");

// After the player is ready and ws says play
// playerReady = true;
player.src = "blank_1000ms.mp3";
player.controls = true;

// access client either through heroku or through localhost:
// heroku link: "https://whispering-journey-4483.herokuapp.com/"
// local host links: "http://localhost:5000/" or "http://127.0.0.1:5000/"
var loc = location.origin
if (loc.indexOf("127") > -1 || loc.indexOf("localhost") > -1  ){
    exampleSocket = new WebSocket('ws://127.0.0.1:5000');
} else {
    var host = loc.replace(/^http/, 'ws');
    exampleSocket = new WebSocket(host);
}

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
            setUserDetails(json.id);
            getSongQueue();
            break;
        case "setUsername":
            setUserDetails(USER_ID, json.username);
            break;
        case "newTrack":
            setTrack(json.streamURL, json.trackTitle);
            // Send confirmation back to server?
            break;
        case "seek":
            setPlayerTime(json.seek);
            break;
        case "play":
            play(json.offset);
            break;
        case "play_at":
            console.log("Server is telling me to play at:", json.play_time);
            var timeout = json.play_time - (new Date().getTime());
            console.log("timeout:", timeout);

            // display countdown to play song
            countdown = timeout;
            var interval = setInterval(function() {
                if (countdown < -2000) clearInterval(interval); //break the interval
                countdown = countdown - 1000;
                output = Math.floor(countdown/1000)

                // output to client
                if (output >= 0) {
                    $("#countdown").show();
                    $("#countdown_sec").text(Math.floor(countdown/1000));
                } else {
                    $("#countdown").hide();
                }

                console.log("Countdown: ", countdown)
            }, 1000);



            setTimeout(function() {
                console.log("Play!");
                play();
            }, timeout);
            break;
        case "pause":
            pause();
            break;
        case "getBufferedValue":
            var bufferRatio = getBufferedValue();
            sendBufferValue(bufferRatio);
            break;
        case "play_ping":
            console.log("Got play_ping");
            sendMessage("play_pong");
            break;
        case "pong":
            PONGTIME = new Date().getTime();
            console.log("Latency:", PONGTIME-PINGTIME, "ms.");
            break;
        case "seektime":
            sendCurrentSeekTime();
            break;
        case "queueTrack":
            // console.log("queueTrack", json);
            addToQueueData(json);
            break;
        case "getQueue":
            console.log("getQueue", json);
            digestQueueStream(json.queue);
            break;
        case "nextTrack":
            playNextTrack();
            break;
        default:
            console.log("Un-recognized Request", json.type);
            break;
    }

}

// ---- END INIT ----

function l(object){ console.log(object); }
    // streamURL: "https://api.soundcloud.com/tracks/53126096/stream?client_id=86e82361b4e6d0f88da0838793618a92",
    // seek: "", // seek in seconds,
    // buffered: 0.13, // decimal value?
    // play: true,
    // pause: false

// VIEW Manipulations //

function setUserDetails(user_id, username){
    USER_ID = user_id
    if (!username){
        $("#user_id").html(user_id);
    } else {
        $("#user_id").html(username);
    }
}

function updatePlayerTrackDetails(title, thumbnail_url, artist){
    $('#albumart').attr("src", thumbnail_url);
    trackHeading.innerHTML = title +" by "+ artist;
}

function addToQueueView(track_title){
    console.log("addToQueueView",track_title);
    if (!track_title) return;

    var playlist = $('#playlist');

    // Append element to playlist
    var row = document.createElement("TR");
    var col = document.createElement("TD");
    var text = document.createTextNode(track_title);
    col.appendChild(text);
    row.appendChild(col);
    playlist.append(row); // jQuery object method
    
}

function removeTopQueueItem(){
    var playlist = $('#playlist');
    // Remove first element in the list for when the track is done
    playlist.find('tr:first').remove();
}

// END VIEW Manipulations //

//***************** START::: Player control functions/API *****************
function setTrack(url, trackTitle){
    // Parse the SC URL
    if (url){
        return parseSoundCloudLink(url)
        .then(setStreamSource);
    }
}

function setStreamSource(sc_obj){
    console.log("Setting Stream Source: ",sc_obj);
    // Set track URL

    cache_song(sc_obj.stream_url);
    // update view
    updatePlayerTrackDetails(sc_obj.title, sc_obj.artwork_url, sc_obj.user.username);

    return sc_obj;
}

function play (offset){
    if (offset) player.currentTime += offset;
    play_song();
    millisecondCounter();

    // Set the track ended listener
    player.onended = function() {
        console.log("The track has ended");
        sendSynchronizedNextSongRequest();
    };
}

function pause(){
    player.pause();
}

function playNextTrack(offset){
    console.log("playNextTrack");
    // Get next track
    var trackObj = TRACK_LIST.getNext();
    if (trackObj){
        console.log(trackObj);
        // Play next track
        // player.src = trackObj.streamLink;
        cache_song(trackObj.streamLink);
        // Update player view
        updatePlayerTrackDetails(trackObj.title, trackObj.albumart, trackObj.artist);
        // Update queue view
        removeTopQueueItem();

    } else { console.log("Queue is empty!"); }
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
    console.log( "setPlayerTime", seconds );
    player.currentTime = seconds;
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

function applyFudgeFactorUpdate(){
    var fudge = parseInt($('#fudge-input').val())/1000;
    player.currentTime += fudge;
    console.log("FudgeFactor value set: ", fudge, player.currentTime);
}
//***************** END::: Player control functions/API *****************

// Queue Manipulation //
function digestQueueStream(streamList){
    // Loop through all the links and retrive the SC information
    var promises = [];
    for (i = 0; i < streamList.length; i++){
        promises.push(parseSoundCloudLink(streamList[i]));
    }
    // Add a promise all condition to make sure the tracks are added in order
    SC.Promise.all(promises).then(function(){
        // arguments is JS keyword for a function args, the [0] is because this is a nested function?
        console.log(arguments[0]);
        var args = arguments[0];

        // Set the first item as the current track
        setStreamSource(args[0]);//{ streamLink: args[0].stream_url, title: args[0].title, artist: args[0].user, albumart: args[0].artwork_url});

        for (i = 1; i < args.length; i++){
            // Update queue with retrived information and update views
            TRACK_LIST.addToQueue({ streamLink: args[i].stream_url, title: args[i].title, artist: args[i].user.username, albumart: args[i].artwork_url});
            addToQueueView(args[i].title);
        }
        // Return argument to continue chain if needed
        return args;
    });
}

function addToQueueData(trackObj){
    // Parse the SC URL
    if (trackObj.streamURL){
        return parseSoundCloudLink(trackObj.streamURL)
        .then(function (sc_json){
            
            TRACK_LIST.addToQueue({ streamLink: sc_json.stream_url, title: sc_json.title, artist: sc_json.user.username, albumart: sc_json.artwork_url});
            addToQueueView(sc_json.title);
            return sc_json;
        
        });
    } else { console.log(trackObj); alert("STREAM URL from Server is MISSING"); }
}

// END Queue Manip //

function updateBufferVals(){
    var bufferVal = getBufferedValue();
    bufferView.innerHTML = String(bufferVal);
    console.log("Current buffer value: ", bufferVal);
    return bufferVal;
}
// Buffer reference -- https://developer.mozilla.org/en-US/Apps/Build/Audio_and_video_delivery/buffering_seeking_time_ranges



//***************** Server control functions/API *****************

// Send requests
function sendSynchronizedPlayRequest() {
    sendMessage("play");
}

function sendSynchronizedPauseRequest(){
    sendMessage("pause");
}

function sendSynchronizedSeekRequest(seek){
    if (!seek){
        // Get the seek time from id = seek-input
        var seekInput = parseInt( $("#seek-input").val() );//.html(USER_ID);
        if ( seekInput < playerEndingTime() ){
            sendJSON({ message: "seek", "seek": seekInput });

        } else { console.log("Value is longer than track length! ", seekInput); }
    }
}

function sendNewTrackUrl(url){
    if (!url){
        url = $('#new-song-url').val();
    }
    // console.log("Sending SC Link: ", url);
    sendMessage("newTrack", "streamURL", url);

}

function queueNewTrackUrl(url){
    if (!url){
        url = $('#new-song-url').val();
    }
    console.log("Sending SC Link: ", url);
    sendMessage("queueTrack", "streamURL", url);

}

function getSongQueue(){
    sendMessage("getQueue");
}

function sendSynchronizedNextSongRequest(){
    sendMessage("nextTrack");
}

function sendFudgeFactorUpdate(){
    var fudge = $('#fudge-input').val();
    sendMessage("fudgeFactor", "fudgeFactor", fudge);
    console.log("FudgeFactor value set: ", fudge);
}

function sendBufferValue(){}

function sendCurrentSeekTime(){
    sendMessage("seekTime", "seekTime", player.currentTime);
    console.log("seekTime: "+player.currentTime);
}

function setUserName(){
    var username = prompt("What shall we call you then?", "Jesus Christ Superstar");
    
    if (username != null) {
        sendMessage("setUsername", "username", username);
    }
}
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
    json_obj.user_id = USER_ID;
    json_obj.timestamp = new Date().getTime();
    console.log("### MESSAGE SENDING: ", JSON.stringify(json_obj), json_obj);
    exampleSocket.send(JSON.stringify(json_obj));
}

function sendMessage(msg, extra, value) {
    var obj = { "message" : msg};

    // Add in extra parameters for things like seek or new track
    if (extra && value){ 
        obj[extra] = value; 
    }

    sendJSON(obj);
}

// SOUNDCLOUD PARSING LOGIC
function parseSoundCloudLink (url){
    return SC.resolve(url)
        .then(function (json_msg){ 
            console.log("Link Resolved: ", json_msg);
            json_msg.stream_url += "?client_id=86e82361b4e6d0f88da0838793618a92";
            return json_msg;
        });
}

// PLAYLIST OBJ STRUCT
// initialize it as a linked list
TRACK_LIST.getCurrent = function(){ 
    return TRACK_LIST.head; 
}
TRACK_LIST.getNext = function(){ 
    // If next is undefined, head is undefined but tail still holds a reference
    if (!TRACK_LIST.head){
        console.log("The queue is empty!", this);
        return;

    } else if (!TRACK_LIST.head.next){ 
        var track = TRACK_LIST.head;
        TRACK_LIST.head = undefined;
        TRACK_LIST.tail = undefined;
        return track;
    } else {
        TRACK_LIST.head = TRACK_LIST.head.next;
    return TRACK_LIST.head; 
    }
}
TRACK_LIST.addToQueue = function(trackObj){

    if (TRACK_LIST.head){
        // If queue is not empty
        TRACK_LIST.tail.next = trackObj;
        TRACK_LIST.tail = TRACK_LIST.tail.next;
    } else {
        // IF queue is empty head and tail will be same track
        TRACK_LIST.head = TRACK_LIST.tail = trackObj
    }
}

function heartbeat() {
    console.log("heartbeat");
    PINGTIME = new Date().getTime();
    sendMessage("ping");
    setTimeout(function() {
        heartbeat();
    }, 2000);
}

function setBufferRefresh(){

    var bufRef = setInterval(function(){ 
        var bufferVal = updateBufferVals();
        if (bufferVal === 1) { clearInterval(bufRef); }
    }, 2000);

}

function millisecondCounter(){
    var counterView = document.getElementById('player-current');
    window.playerMSCounter = setInterval(function(){ 
        counterView.innerHTML = String(player.currentTime);
    }, 100);

}
