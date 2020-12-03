const Topic = require('../models/Topic');
const User = require('../models/User');
const Meeting = require('../models/Meeting');
const MeetingMessage = require('../models/MeetingMessage');
var fs = require('fs');

var getTransporter = require('../lib/mailer');
var express = require('express');
var router = express.Router();

var createRoom = require('../lib/createroom');
var joinRoom = require('../lib/joinroom');

//handles creation of meeting between specified users
//the first time a new meeting is created
router.get('/newmeeting', function (req, res, next) {
  if (!req.isAuthenticated()) return next();
  const { uid1, uid2, topicId } = req.query;
  var user = req.session.passport.user;

  //make sure only participant can see meeting
  if (!(user._id == uid1 || user._id == uid2)) {
    res.render('error', { message: "You don't have access to this meeting" });
  }

  Promise.allSettled([
    User.findById(uid1),
    User.findById(uid2),
    Topic.findById(topicId)
  ]).then(([user1, user2, topic]) => {
    var topicName = topic.value.name;
    console.log("TOPIC NAME " + topicName);
    console.log("NED");

    createRoom(topicName, function (kalturaResponse) {
      new Meeting({
        topic: topicId,
        user1: uid1,
        user2: uid2,
        kalturaResourceId: kalturaResponse.id
      }).save(function (err, doc) {
        if (err) console.error(err);
        var meetingId = doc._id;
        var meetingLink = process.env.SERVER_HOST_URL +
          "/meetings/meeting?meetingId=" + meetingId;

        var user = req.session.passport.user;
        joinRoom(kalturaResponse.id, user.name, user.email, function (joinLink) {
          res.render('meeting',
            {
              user: req.session.passport.user,
              user1: user1.value,
              user2: user2.value,
              topic: topic.value,
              meetingLink: meetingLink,
              joinLink: joinLink,
              meetingId: meetingId
            });
        });
      });
    })
  });
});

//displays meeting when meetingId is supplied in url
//and refreshes the joinroom link
router.get('/meeting', function (req, res, next) {
  if (!req.isAuthenticated()) return next();

  Promise.allSettled([
    Meeting.
      findById(req.query.meetingId).
      populate('topic user1 user2'),
    MeetingMessage.find({ meetingId: req.query.meetingId }).populate('user')

  ]).then(([meeting, meetingMsgs]) => {
    meeting = meeting.value;
    //make sure only participant can see meeting
    user = req.session.passport.user;
    if (!(user._id == meeting.user1._id || user._id == meeting.user2._id)) {
      res.render('error', { message: "You don't have access to this meeting" });
    }

    var meetingLink = process.env.SERVER_HOST_URL +
      "/meetings/meeting?meetingId=" + meeting._id;

    var user = req.session.passport.user;
    joinRoom(meeting.kalturaResourceId, user.name, user.email, function (joinLink) {
      res.render('meeting',
        {
          user: req.session.passport.user,
          user1: meeting.user1,
          user2: meeting.user2,
          topic: meeting.topic,
          meetingLink: meetingLink,
          joinLink: joinLink,
          meetingId: meeting._id,
          messages: meetingMsgs.value
        });
    });
  }
  );
});

//when a user posts a message for this meeting.
router.post('/msg', function (req, res, next) {
  var user;
  if (req.session.passport) {
    user = req.session.passport.user
  }

  Meeting.findById(req.body.meetingId).populate('topic user1 user2').exec(function (err, meeting) {
    if (err) {
      console.log(err);  // handle errors
    } else {
      //make sure only participant can access
      if (!(user._id == meeting.user1.id || user._id == meeting.user2.id)) {
        res.render('error', { message: "You don't have access to this meeting" });
      }
      var meetMsg = new MeetingMessage({
        meetingId: meeting._id,
        user: user._id,
        message: req.body.msg
      });

      meetMsg.save(async function (err, msg) {
        if (err) console.error(err);
        var otherUser;
        if (user._id == meeting.user1.id) {
          otherUser = meeting.user2;
        } else {
          otherUser = meeting.user1;
        }

        var meetingLink = process.env.SERVER_HOST_URL + "/meetings/meeting?meetingId=" + meeting._id;

        var emailCss;
        try {
          emailCss = fs.readFileSync('public/stylesheets/email.css');
        } catch (e) {
          console.log('Error:', e.stack);
        }

        getTransporter().sendMail({
          from: '"MeetAbout" <kmeetabout@gmail.com>', // sender address
          to: otherUser.email, // list of receivers
          subject: "MeetAbout [New Message]! on: " + meeting.topic.name, // Subject line
          html: `
          <html>
          <head> 
          <style>
          ${emailCss}
          </style>
          </head>
          <body>
          <p class="quote">
          ${req.body.msg}
          <cite>-${user.name}</cite>
          </p>
          Continue the conversation or Meet live at: <a href="${meetingLink}"> This Link</a>
          </body>
          </html>
          `,
        }, function (error, info) {
          console.log(error);
          console.log(info);
        });
        res.redirect('/meetings/meeting?meetingId=' + meeting._id);

      });
    }
  });
});

module.exports = router;