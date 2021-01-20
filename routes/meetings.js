const Topic = require('../models/Topic');
const User = require('../models/User');
const Meeting = require('../models/Meeting');
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

  Topic.findById(req.query.topicId).exec(function (err, topic) {
    if (err) {
      console.log(err);  // handle errors
    } else {
      var topicName = topic.name;
      console.log("TOPIC NAME " + topicName);
      console.log("NED");

      createRoom(topicName, function (kalturaResponse) {
        new Meeting({
          topic: topic._id,
          kalturaResourceId: kalturaResponse.id
        }).save(function (err, doc) {
          if (err){
            console.log("HEYA");
            console.error(err);
          }
    
          var user = req.session.passport.user;
          joinRoom(kalturaResponse.id, user.name, user.email, function (joinLink) {
            res.redirect(joinLink);
          });
        });
      });
    }
  });
});

/*
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
          from: '"MeetAbout" ' + process.env.SMTP_FROM, // sender address
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
          Continue the conversation or Meet live at: <a href="${meetingLink}">Here</a>
          <hr>
          Converse live on <a href="${process.env.SERVER_HOST_URL}">Meetabout</a>
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
*/
module.exports = router;