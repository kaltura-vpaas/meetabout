var express = require('express');
const Util = require('../lib/util');
var router = express.Router();

/* GET users listing. */
router.get('/', Util.ensureAuthenticated, function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
