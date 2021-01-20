
function main() {

  $("#selectable").selectable({
    selecting: function (event, ui) {
      var topic = $(ui.selecting);
      var topicId = topic.attr("id");
      var topicText = topic.text();
      $("#findMeeting").text("Meet About: "+topicText);
      $("#findMeeting").attr("href","/meetings?topicId="+topicId);
    }
  });

  //select and load first topic
  var first = $("#selectable").children().first();
  first.addClass("ui-selected");
}
