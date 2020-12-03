var express = require('express');
var router = express.Router();
var passport = require('passport');
var User = require('../models/User.js');

var LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;

passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_KEY,
  clientSecret: process.env.LINKEDIN_SECRET,
  callbackURL: process.env.SERVER_HOST_URL + "/auth/linkedin/callback",
  scope: ['r_emailaddress', 'r_liteprofile']
  //state: true
}, function (accessToken, refreshToken, profile, done) {
  // asynchronous verification, for effect...
  process.nextTick(function () {
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
   
  });
}));

router.get('/',
  passport.authenticate('linkedin'),
  function (req, res) {
    // The request will be redirected to LinkedIn for authentication, so this
    // function will not be called.
  }
);

router.get('/callback',
  function (req, res, next) {
    passport.authenticate('linkedin', {
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