require('dotenv').config();

const mongoose = require('mongoose');
mongoose.connect(process.env['MONGO_URI'],
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  }
);
mongoose.set('debug', true)
require('./models/User');
require('./models/Topic');
require('./models/Meeting');


var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var flash = require('connect-flash');

var app = express();

var cookieSession = require('cookie-session');

var app = express();
app.use(cookieSession({
  name: 'session',
  secret: process.env['SESSION_SECRET']
}))
app.use(flash());
var passport = require('passport');
passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (obj, done) {
  done(null, obj);
});
app.use(passport.initialize());
app.use(passport.session());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var indexRouter = require('./routes/index');
var meetingsRouter = require('./routes/meetings');
var findMeetingsRouter = require('./routes/find_meetings');
var authLocalRouter = require('./routes/auth_local');
//var authMSRouter = require('./routes/auth_ms');
//var authGithubRouter = require('./routes/auth_github');
//var authLinkedinRouter = require('./routes/auth_linkedin');
//var authGoogleRouter = require('./routes/auth_google');

app.use('/', indexRouter);
app.use('/meetings', meetingsRouter);
app.use('/find_meetings', findMeetingsRouter);
app.use('/login', authLocalRouter);
//app.use('/auth/microsoft', authMSRouter);
//app.use('/auth/github', authGithubRouter);
//app.use('/auth/linkedin', authLinkedinRouter);
//app.use('/auth/google', authGoogleRouter);

app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;