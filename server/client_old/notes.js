Seeking
buffering
play
pause

var parse_location = "https://connect.soundcloud.com/sdk/sdk-3.0.0.js";
var script = document.createElement('script');
script.type = 'text/javascript';
script.src = parse_location;
document.head.appendChild(script);

https://developers.soundcloud.com/docs/api/guide#playing

PLAY
<script src="https://connect.soundcloud.com/sdk/sdk-3.0.0.js"/></script>
<script>
SC.initialize({
  //client_id: 'YOUR_CLIENT_ID'
  client_id: '86e82361b4e6d0f88da0838793618a92'
});


// stream track id 293
SC.stream('/tracks/293').then(function(player){
  player.play();
});
</script>

SC.resolve('https://soundcloud.com/chrome-sparks/marijuana');

https://developers.soundcloud.com/docs/api/html5-widget#methods

play()
pause()
seekTo(milliseconds)

getPosition(callback)
isPaused(callback)


SC.Widget.Events.LOAD_PROGRESS // fired periodically for 




var iframeElement   = document.querySelector('iframe');
var iframeElementID = iframeElement.id;
var widget1         = SC.Widget(iframeElement);
var widget2         = SC.Widget(iframeElementID);

Client ID
86e82361b4e6d0f88da0838793618a92