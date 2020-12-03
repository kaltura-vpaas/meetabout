var express = require('express');

const Topic = require('../models/Topic');
const User = require('../models/User');
var router = express.Router();

router.get('/', async function (req, res, next) {
  try {
    var user;
    if (req.session.passport) {
      user = req.session.passport.user
    }

    Promise.allSettled([
      User.findById(user),
      Topic.find().limit(15),
      //we map the field names to make jquery's autocomplete work
      Topic.aggregate([
        {
          $project: {
            _id: '$_id',
            label: '$name',
            value: '$name'
          }
        }])
    ]).then(([_user, _topics, _allTopics]) => {
      _allTopics = _allTopics.value;
      _user = _user.value;
      _topics = _topics.value;
 
      res.render('index', {messages: req.flash('info'), user: _user, topics: _topics, allTopics: _allTopics });
    });
  } catch (e) {
    console.log(e.message);
    res.render('error', { errorMessage: e.message });
  }
});

//ajax handler to add a topic
router.post('/', function (req, res, next) {
  if (!req.isAuthenticated()) return next();
  console.log(req.body);

  User.findById(req.session.passport.user, function (err, user) {
    if (err) {
      console.log(err);  // handle errors
    } else {
      user.topics.push(req.body['topicId']);
      user.save(function (err) {
        if (err) return handleError(err);
        console.log("saved topic" + req.body['topicId']);
        res.end('{"success" : "Updated Successfully", "status" : 200}');
      });
    }
  });
});

//ajax remove topic from user's interested
router.delete('/', function (req, res, next) {
  if (!req.isAuthenticated()) return next();
  console.log(req.body);
  User.findByIdAndUpdate(req.session.passport.user,
    { $pull: { "topics": req.body.topicId } },
    { new: false },
    function (err, data) {
      if (err) return handleError(err);
      console.log("deleted topic from user " + req.body['topicId']);
      res.end('{"success" : "Updated Successfully", "status" : 200}');
    }
  );
});

router.post('/addtopic', function (req, res, next) {
  if (!req.isAuthenticated()) return next();

  var user = req.session.passport.user;
  
  //prevent dupes
  if(user.topics.includes(req.body['newtopic-id'])) {
    res.redirect('/');
    return;
  }

  new Topic({ name: req.body.newtopic }).save(function (err, topic) {
    if (err) return handleError(err);
    console.log("saved topic" + topic._id);
  
    //since they added the topic...we save it to them
    User.findByIdAndUpdate(req.session.passport.user,
      { $push: { "topics": topic } },
      { new: false },
      function (err, data) {
        if (err) return handleError(err);
        res.redirect('/');
      }
    );
  });
});

router.post('/updatedesc', function (req, res, next) {
  if (!req.isAuthenticated()) return next();
  var user = req.session.passport.user;
  
  User.findByIdAndUpdate(user, {desc:req.body.desc},
    function (err, data) {
      if (err) return handleError(err);
      res.redirect('/find_meetings');
    }
  );
});

module.exports = router;