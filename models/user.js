/** User class for message.ly */
const db = require('../db');
const bcrypt = require('bcrypt');
const { BCRYPT_WORK_ROUNDS } = require('../config');

/** User of the site. */

class User {
  static _404UserError(results) {
    if (results.rows.length === 0) {
      let error = new Error(`User does not exist.`);
      error.status = 404;
      throw error;
    }
  }
  static _404MessageError(results) {
    if (results.rows.length === 0) {
      let error = new Error(`User has no messages.`);
      error.status = 404;
      throw error;
    }
  }
  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    //Hash password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_ROUNDS);
    //Create and insert into db
    let newUser = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone, join_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone]
    );
    this._404UserError(newUser);
    return newUser.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password FROM users WHERE username = $1`,
      [username]
    );
    this._404UserError(result);
    const user = result.rows[0];

    return user && (await bcrypt.compare(password, user.password));
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    return await db.query(
      `UPDATE users
      SET last_login_at = CURRENT_TIMESTAMP
      WHERE username = $1`,
      [username]
    );
    //TODO: Do we want to return anything from this function even if it isn't required.
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    let users = await db.query(
      `SELECT username, first_name, last_name
      FROM users`
    );
    return users.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    let getUser = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at
      FROM users
      WHERE username = $1
      `,
      [username]
    );

    console.log(`DOES THIS WORK ${getUser}`);
    this._404UserError(getUser);
    return getUser.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    let messages = db.query(
      `SELECT id, body, sent_at, read_at
      FROM messages
      WHERE from_username = $1
      `,
      [username]
    );

    let userSent = db.query(
      `SELECT username, first_name, last_name, phone
      FROM users JOIN messages ON users.username = messages.to_username
      WHERE messages.from_username = $1`,
      [username]
    );

    [messages, userSent] = await Promise.all([messages, userSent]);

    this._404MessageError(messages);
    this._404MessageError(userSent);

    //TODO: Get rid of the extra lines of code and chain rows with map
    let userSentArr = userSent.rows;
    let messagesArr = messages.rows;

    let toUserObject = userSentArr.map(function(val) {
      return {
        username: val.username,
        first_name: val.first_name,
        last_name: val.last_name,
        phone: val.phone
      };
    });

    let messageObject = messagesArr.map(function(val) {
      return {
        id: val.id,
        to_user: toUserObject,
        body: val.body,
        sent_at: val.sent_at,
        read_at: val.read_at
      };
    });

    return messageObject;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    let messages = db.query(
      `SELECT id, body, sent_at, read_at
      FROM messages
      WHERE to_username = $1
      `,
      [username]
    );

    let userReceived = db.query(
      `SELECT username, first_name, last_name, phone
      FROM users JOIN messages ON users.username = messages.from_username
      WHERE messages.to_username = $1`,
      [username]
    );

    [messages, userReceived] = await Promise.all([messages, userReceived]);

    this._404MessageError(messages);
    this._404MessageError(userReceived);

    let userReceivedArr = userReceived.rows;
    let messagesArr = messages.rows;

    let fromUserObject = userReceivedArr.map(function(val) {
      return {
        username: val.username,
        first_name: val.first_name,
        last_name: val.last_name,
        phone: val.phone
      };
    });

    let messageObject = messagesArr.map(function(val) {
      return {
        id: val.id,
        to_user: fromUserObject,
        body: val.body,
        sent_at: val.sent_at,
        read_at: val.read_at
      };
    });

    return messageObject;
  }
}

module.exports = User;
