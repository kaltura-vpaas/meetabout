var express = require('express');
var router = express.Router();
var passport = require('passport');

var User = require('../models/User.js');
var LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
  function (name, email, done) {
    User.findOne({ email: email }, function (err, user) {
      if (err) {
        console.log(err);  // handle errors!
      }
      if (!err && user !== null) {
        done(null, user);
      } else {
        user = new User({
          userid: email,
          name: name,
          email: email
        });
        user.save(function (err) {
          if (err) {
            console.log(err);  // handle errors!
          } else {
            console.log("saving user ...");
            done(null, user);
          }
        });
      }
    });
  }
));

/*
disallow this security hole in production
router.post('/', 
  passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  }
);*/

module.exports = router;