//see https://docs.microsoft.com/en-us/graph/tutorials/node?WT.mc_id=Portal-Microsoft_AAD_RegisteredApps
var express = require('express');
var router = express.Router();
var passport = require('passport');
var request = require('request');
var User = require('../models/User.js');
var fs = require('fs');

const KalturaImageUploader = require('../lib/KalturaImageUploader');

var OIDCStrategy = require('passport-azure-ad').OIDCStrategy;

// Configure OIDC strategy
passport.use(new OIDCStrategy(
  {
    identityMetadata: `${process.env.AZURE_AD_AUTHORITY}${process.env.AZURE_AD_ID_METADATA}`,
    clientID: process.env.AZURE_AD_APP_ID,
    responseType: 'code id_token',
    responseMode: 'form_post',
    redirectUrl: process.env.SERVER_HOST_URL + "/auth/microsoft/callback",
    allowHttpForRedirectUrl: true,
    clientSecret: process.env.AZURE_AD_APP_PASSWORD,
    validateIssuer: false,
    passReqToCallback: false,
    scope: process.env.AZURE_AD_SCOPES.split(' ')
  },
  function (iss, sub, profile, accessToken, refreshToken, params, done) {
    console.log(profile);
    console.log("ACCESS: " + accessToken);
    User.findOne({ userid: profile.oid }, function (err, user) {
      if (err) {
        console.log("ERRORHERE");
        console.log(err);  // handle errors!
      }
      if (!err && user !== null) {
        getProfilePhoto(accessToken, user, done);
        done(null, user);
      } else {
        user = new User({
          userid: profile.oid,
          name: profile.displayName,
          email: profile._json.email
        });
        user.save(function (err) {
          if (err) {
            console.log("ERRHERE");
            console.log(err);  // handle errors!
          } else {
            console.log("saving user ...");
            getProfilePhoto(accessToken, user, done);

          }
        });
      }
    });
  }
));

/* GET auth callback. */
router.get('/',
  function (req, res, next) {
    passport.authenticate('azuread-openidconnect',
      {
        response: res,
        prompt: 'login',
        failureRedirect: '/',
        failureFlash: true,
        successRedirect: '/'
      }
    )(req, res, next);
  }
);

router.post('/callback',
  function (req, res, next) {
    passport.authenticate('azuread-openidconnect',
      {
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

function getProfilePhoto(accessToken, user, callback) {

  request.get({
    url: "https://graph.microsoft.com/beta/me/Photos('120x120')/$value",
    headers: {
      "Content-Type": "image/jpeg",
      "Authorization": "Bearer " + accessToken
    }
  }).pipe(fs.createWriteStream(user.id + '.jpg')).on('close',
    async function () {
      let imageUploader = await new KalturaImageUploader();
      imageUploader.upload(user.id + '.jpg', function (result) {
        user.profile_photo_url = result.downloadUrl;
        user.save(function (err) {
          if (err) {
            console.log("ERRHERE");
            console.log(err);  // handle errors!
          } else {
            //delete jpg once finished
            fs.unlink(user.id + '.jpg', function (err, result) {
              if (err) console.log('error', err);
            })
          }
        });
      });
    }
  );
}

module.exports = router;