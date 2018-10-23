const express = require('express');
const router = new express.Router();
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config');

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post('/login', async function(req, res, next) {
  try {
    const { username, password } = req.body;
    if (await User.authenticate(username, password)) {
      let token = jwt.sign({ username }, SECRET_KEY, {
        expiresIn: 24 * 60 * 60
      });
      User.updateLoginTimestamp(username);
      return res.json({ token });
    }
    return next({ message: `Invalid username/password` });
    //TODO: Add status code
  } catch (err) {
    return next(err);
  }
});

/** POST /register - register user: registers, logs in, and returns token.
 *
 * The JWT payload hould be {username}
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post('/register', async function(req, res, next) {
  try {
    let userInputObject = req.body;
    let { username } = await User.register(userInputObject);
    let token = jwt.sign({ username }, SECRET_KEY, { expiresIn: 24 * 60 * 60 });

    User.updateLoginTimestamp(username);
    return res.json({ token });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
