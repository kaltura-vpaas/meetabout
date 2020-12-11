function onMeeting() {
    window.setInterval("reloadFrame();", 5000);
}

function reloadFrame() {
    var frame = $('#chatFrame')
    frame.attr('src', frame.attr('src'));
    //var contents = frame.contents();
    //contents.scrollTop(contents.height());
}