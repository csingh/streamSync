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
}