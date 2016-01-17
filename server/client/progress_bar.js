window.onload = function(){

  var myAudio = document.getElementById('player');

  myAudio.addEventListener('progress', function() {
    var bufferedEnd = myAudio.buffered.end(myAudio.buffered.length - 1);
    var duration =  myAudio.duration;
    if (duration > 0) {
      document.getElementById('buffered-amount').style.width = ((bufferedEnd / duration)*100) + "%";
    }
  });

  myAudio.addEventListener('timeupdate', function() {
    var duration =  myAudio.duration;
    if (duration > 0) {
      document.getElementById('progress-amount').style.width = ((myAudio.currentTime / duration)*100) + "%";
    }
  });

  var cursor = document.getElementById('position-cursor');

  $( ".position" ).click(function(event){
    console.log(event.offsetX);
    var position = event.offsetX;
    var total = player.seekable.end(0);
    var timePosition = position * total / 300;

    player.currentTime = parseInt(timePosition);
    cursor.style.marginLeft = String(position - 5)+"px";

  });
}