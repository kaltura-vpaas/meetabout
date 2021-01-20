const User = require('../models/User');

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

module.exports = router;