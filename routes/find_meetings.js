const User = require('../models/User');
const Meeting = require('../models/Meeting');

var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {
  var user;
  if (req.session.passport) {
    user = req.session.passport.user
  }

  //now we will populate User to only display topics they are interested in
  User.findById(req.session.passport.user, function (err, user) {
    if (err) {
      console.log(err);  // handle errors
    } else {
      console.log(user);
      res.render('find_meetings', { user: user });
    }
  }).populate("topics");
});

//ajax handler to return other interested users when user clicks on a topic
router.get('/interested', function (req, res, next) {
  if (!req.isAuthenticated()) return next();
  console.log(req.body);
  const user = req.session.passport.user;

  try {
    Promise.allSettled([
      User.find({
        "topics": { "$in": [req.query.topicId] },
        "_id": { $ne: user._id }
      },'name desc profile_photo_url'),
      //find the meetings with this topic that current user is already in
      Meeting.find({$and :[
        { $or: [{ 'user1': user._id }, { 'user2': user._id }]},
        { topic: req.query.topicId }
      ]})
    ]).then(([_users, _myMeetings]) => {
      _users = _users.value;
      _myMeetings = _myMeetings.value;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ "users": _users, "mymeeting": _myMeetings[0] }));
    });
  } catch (e) {
    console.log(e.message);
    res.render('error', { errorMessage: e.message });
  }

});

module.exports = router;