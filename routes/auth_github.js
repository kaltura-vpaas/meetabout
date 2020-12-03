//see https://docs.microsoft.com/en-us/graph/tutorials/node?WT.mc_id=Portal-Microsoft_AAD_RegisteredApps
var express = require('express');
var router = express.Router();
var passport = require('passport');
var request = require('request');
var User = require('../models/User.js');
var fs = require('fs');

const KalturaImageUploader = require('../lib/KalturaImageUploader');

const GithubStrategy = require('passport-github').Strategy;

// Configure OIDC strategy
passport.use(new GithubStrategy(
  {
    clientID: process.env.GITHUB_CLIENTID,
    clientSecret: process.env.GITHUB_SECRET,
    callbackURL: process.env.SERVER_HOST_URL+ "/auth/github/callback",
    scope: ['user:email']
  },
  function (accessToken, refreshToken, profile, done) {
    console.log(profile);
    console.log("ACCESS: " + accessToken);
    User.findOne({ userid: profile._json.node_id }, function (err, user) {
      if (err) {
        console.log("ERRORHERE");
        console.log(err);  // handle errors!
      }
      if (!err && user !== null) {
        //user already exists
        done(null, user);
      } else {
        user = new User({
          userid: profile._json.node_id,
          name: profile.displayName,
          email: profile._json.email,
          profile_photo_url: profile._json.avatar_url
        });
        user.save(function (err) {
          if (err) {
            console.log("ERRHERE");
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

/* GET auth callback. */
router.get('/',
  function (req, res, next) {
    console.log("AUTHING GITHUB")
    passport.authenticate('github', {
      response: res,
      prompt: 'login',
      failureRedirect: '/',
      failureFlash: true,
      successRedirect: '/'
    }
    )(req, res, next);
  }
);

router.get('/callback',
  function (req, res, next) {
    passport.authenticate('github', {
      response: res,
      failureRedirect: '/',
      failureFlash: false
    }
    )(req, res, next);
  }, 
  function (req, res) {
    console.log('error_msg', { message: 'Access token', debug: req.user.accessToken })
    res.redirect('/');
  }
);

module.exports = router;