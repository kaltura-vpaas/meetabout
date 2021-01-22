const Topic = require('../models/Topic');
const User = require('../models/User');
var fs = require('fs');

var getTransporter = require('../lib/mailer');
var express = require('express');
var router = express.Router();

var createRoom = require('../lib/createroom');
var joinRoom = require('../lib/joinroom');

//handles creation of meeting between specified users
//the first time a new meeting is created
router.get('/', function (req, res, next) {
  if (!req.isAuthenticated()) return next();

  Topic.findById(req.query.topicId).exec(function (err, topic) {
    if (err) {
      console.log(err);  // handle errors
    } else {
      var topicName = topic.name;
      console.log("TOPIC NAME " + topicName);
      var user = req.session.passport.user;
      const [firstName, lastName ] = nameSplit(user.name);

      if (topic.kalturaResourceId) {
        notifyMeeting(topic);
        joinRoom(topic.kalturaResourceId, firstName, lastName, user.email, function (joinLink) {
          res.redirect(joinLink);
        });
      } else {
        createRoom(topicName, function (kalturaResponse) {
          console.log("creating room");
          topic.kalturaResourceId = kalturaResponse.id;
          topic.save(function (err, doc) {
            if (err) {
              console.error(err);
            } else {
              notifyMeeting(topic);
              joinRoom(kalturaResponse.id, firstName, lastName, user.email, function (joinLink) {
                res.redirect(joinLink);
              });
            }
          });
        });
      }
    }
  });
});

function nameSplit(name) {
  var names = name.split(" ");
  var firstName, lastName;
  if (names.length > 1) {
    firstName = names[0];
    lastName = names[1];
  } else {
    firstName = names[0];
    lastName = "_";
  }
  return [firstName, lastName];
}

//send a notification to everyone interested in this topic
function notifyMeeting(topic) {
  User.find({ topics: topic }).exec(function (err, users) {
    if (err) {
      console.log(err);  // handle errors
    } else {
      var emailCss;
      try {
        emailCss = fs.readFileSync('public/stylesheets/email.css');
      } catch (e) {
        console.log('Error:', e.stack);
      }
      users.forEach(function (user) {
        //only notify subscribed users
        if (!user.subscribed) {
          return
        }
        
        const [ firstName, lastName ] = nameSplit(user.name);
        joinRoom(topic.kalturaResourceId, firstName, lastName, user.email, function (joinLink) {
          getTransporter().sendMail({
            from: '"MeetAbout" ' + process.env.SMTP_FROM, // sender address
            to: user.email, // list of receivers
            subject: "MeetAbout [New Message]! on: " + topic.name, // Subject line
            html: buildMail(emailCss, topic.name, joinLink, user._id),
          }, function (error, info) {
            console.log(error);
            console.log(info);
          });
        });
      });
    }
  });
}

function buildMail(emailCss, topic, meetingLink, userId) {
  return `<html>
  <head> 
  <style>
  ${emailCss}
  </style>
  </head>
  <body>
  <h3>A meeting is happening now about: ${topic}</h3>
  Meet live: <a href="${meetingLink}">Here</a>
  <br>
  <hr>
  <br>
  From <a href="${process.env.SERVER_HOST_URL}">Meetabout</a>
  <br>
  <br>
  Too many emails? 
  <a href="${process.env.SERVER_HOST_URL}/meetings/unsub?userId=${userId}">Unsubscribe</a>
  </body>
  </html>
  `;
}

router.get('/unsub', function (req, res, next) {
  User.findById(req.query.userId).exec(function (err, user) {
    if (err) {
      console.log(err);  // handle errors
    } else {
      user.subscribed = false;
      user.save(function (err) {
        if (err) return handleError(err);
        res.send("You have been unsubscribed");
      });
    }
  });
});

module.exports = router;