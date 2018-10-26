/** Express app for message.ly. */

const express = require('express');
const nunjucks = require('nunjucks');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

// allow both form-encoded and json body parsing
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// import/instantiate front-end parts
nunjucks.configure('templates', {
  autoescape: true,
  express: app
});

// First "static" is the prefix on which "static" will be used in the URL
// Second "static" is the local directory in which the files will be called from (ie. script.js)
app.use('/static', express.static('static/'));

// allow connections to all routes from any browser
app.use(cors());

/** routes */

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/messages', messageRoutes);

// Homepage
app.get('/', function(req, res, next) {
  res.render('base.html');
});

/** 404 handler */

app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;

  // pass the error to the next piece of middleware
  return next(err);
});

/** general error handler */

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  console.error(err.stack);

  return res.json({
    error: err,
    message: err.message
  });
});

module.exports = app;
