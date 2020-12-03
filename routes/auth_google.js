var express = require('express');
var router = express.Router();
var passport = require('passport');
var User = require('../models/User.js');

var GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_KEY,
  clientSecret: process.env.GOOGLE_SECRET,
  callbackURL: process.env.SERVER_HOST_URL + "/auth/google/callback"
},
  function (accessToken, refreshToken, profile, done) {
    console.log(profile);
    User.findOne({ userid: profile.id}, function (err, user) {
      if (err) {
        console.log(err);  
      }
      if (!err && user !== null) {
        //user already exists
        done(null, user);
      } else {
        user = new User({
          userid: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          profile_photo_url: profile.photos[0].value
        });
        user.save(function (err) {
          if (err) {
            console.log("ERRHERE");
            console.log(err); 
          } else {
            console.log("saving user ...");
            done(null, user);
          }
        });
      }
    });
  }
));

router.get('/',
  passport.authenticate('google', { scope: ['profile','email'] }));

router.get('/callback',
  function (req, res, next) {
    passport.authenticate('google', {
      successRedirect: '/',
      failureRedirect: '/'
    }
    )(req, res, next);
  },
  function (req, res) {
    console.log('error_msg', { message: 'Access token', debug: req.user.accessToken })
    res.redirect('/');
  }
);

module.exports = router;