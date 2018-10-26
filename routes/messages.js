const express = require('express');
const router = new express.Router();
const Message = require('../models/message');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config');
const { ensureLoggedIn } = require('../middleware/auth');
const axios = require('axios');

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id', ensureLoggedIn, async function(req, res, next) {
  try {
    let message = await Message.get(req.params.id);

    if (
      message.from_user.username === req.username ||
      message.to_user.username === req.username
    ) {
      return res.json({ message });
    }

    return next({ message: `Invalid user/message` });
    //TODO: Add status code
  } catch (err) {
    return next(err);
  }
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/', ensureLoggedIn, async function(req, res, next) {
  try {
    const { to_username, body } = req.body;
    let message = await Message.create({
      from_username: req.username,
      to_username,
      body
    });
    return res.json({ message });
  } catch (err) {
    return next(err);
  }
});

router.post('/sms', ensureLoggedIn, async function(req, res, next) {
  try {
    const { to_username, body } = req.body;
    let smsMessage = await Message.createSMS({
      from_username: req.username,
      to_username,
      body
    });

    return res.json({ smsMessage });
  } catch (err) {
    return next(err);
  }
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post('/:id/read', ensureLoggedIn, async function(req, res, next) {
  try {
    let message = await Message.markRead(req.params.id);
    if (message.to_username === req.username) {
      return res.json({ message });
    }
    let error = new Error(`Not intended recipient`);
    error.status = 404;
    throw error;
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
