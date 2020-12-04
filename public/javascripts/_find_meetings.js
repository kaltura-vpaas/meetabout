
function main(myId) {

  $("#selectable").selectable({
    selecting: function (event, ui) {
      loadInterested(ui.selecting.id, myId);
    }
  });

  //select and load first topic
  var first = $("#selectable").children().first();
  first.addClass("ui-selected");
  loadInterested(first[0].id, myId);
}

function loadInterested(topicId, myId) {
  console.log("topicId " + topicId);
  getJax("/find_meetings/interested?topicId=" + topicId,
    function (result, status) {
      $("#interested").empty();
      //iterate over all the users interested in this topic
      result['users'].forEach(function (user) {
        var inMeetingId = alreadyInMeeting(user,result['myMeetings'])
        if (inMeetingId) {
          //meeting already exists with this user
          var mtgLink = "/meetings/meeting?meetingId="+inMeetingId
          var mtgRow = `<div class="user userexist"><a href='${mtgLink}'>
                  <img style="width:32px;height:32px" src="${user.profile_photo_url}">
                  ${user.name}<div class="userdesc">${user.desc}</div></a></div>`;
          $(mtgRow).appendTo($("#interested"));
        }
        else {
          //then we create new meeting:
          var mtgLink = "/meetings/newmeeting?topicId=" + topicId + "&uid1=" + myId + "&uid2=" + user._id;
          var mtgRow = `<div class="user"><a href='${mtgLink}'>
                  <img style="width:32px;height:32px" src="${user.profile_photo_url}">
                  ${user.name}<div class="userdesc">${user.desc}</div></a></div>`;
          $(mtgRow).appendTo($("#interested"));
        }
      });
    },
    function (request, status, error) {
      console.error(error);
    }
  );
}

//return meetingId if in a meeting with otherUser
//return null if not
function alreadyInMeeting(otherUser,myMeetings) {
  let ret = null;
  
  myMeetings.forEach(function (meeting) {
    if(meeting.user1 == otherUser._id || meeting.user2 == otherUser._id){
      ret = meeting._id;
    }
  });

  console.log(ret);
  return ret;
}