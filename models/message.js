/** Message class for message.ly */

const db = require('../db');

/** Message on the site. */

class Message {
  static _404Error(results) {
    if (results.rows.length === 0) {
      let error = new Error(`Message does not exist.`);
      error.status = 404;
      throw error;
    }
  }
  /** register new message -- returns
   *    {id, from_username, to_username, body, sent_at}
   */

  static async create({ from_username, to_username, body }) {
    //Create and insert into db
    let newMessage = await db.query(
      `INSERT INTO messages (from_username, to_username, body, sent_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        RETURNING from_username, to_username, body, sent_at`,
      [from_username, to_username, body]
    );
    this._404Error(newMessage);
    return newMessage.rows[0];
  }

  /** Update read_at for message */

  static async markRead(id) {
    return await db.query(
      `UPDATE messages
      SET read_at = CURRENT_TIMESTAMP
      WHERE id = $1`,
      [id]
    );
  }

  /** Get: get message by id
   *
   * returns {id, from_user, to_user, body, sent_at, read_at}
   *
   * both to_user and from_user = {username, first_name, last_name, phone}
   */

  static async get(id) {
    let getMessage = db.query(
      `SELECT id, from_username, to_username, body, sent_at, read_at
      FROM messages
      WHERE id = $1
      RETURNING id, from_username, to_username, body, sent_at, read_at
      `,
      [id]
    );
    let toUser = db.query(
      `SELECT username, first_name, last_name, phone
      FROM messages JOIN users ON messages.to_user = users.username
      WHERE messages.id = $1
      `,
      [id]
    );

    let fromUser = db.query(
      `SELECT username, first_name, last_name, phone
      FROM messages JOIN users ON messages.from_user = users.username
      WHERE messages.id = $1
      `,
      [id]
    );

    [getMessage, toUser, fromUser] = await Promise.all([
      getMessage,
      toUser,
      fromUser
    ]);

    this._404Error(getMessage);
    this._404Error(toUser);
    this._404Error(fromUser);

    //TODO: Get rid of the extra lines of code and chain rows with map
    let toUserArr = toUser.rows;
    let fromUserArr = fromUser.rows;
    let getMessagesArr = getMessage.rows;

    let toUserObject = toUserArr.map(val => {
      return {
        username: val.username,
        first_name: val.first_name,
        last_name: val.last_name,
        phone: val.phone
      };
    });

    let fromUserObject = fromUserArr.map(val => {
      return {
        username: val.username,
        first_name: val.first_name,
        last_name: val.last_name,
        phone: val.phone
      };
    });

    let getMessagesObject = getMessagesArr.map(val => {
      return {
        id: val.id,
        from_user: fromUserObject,
        to_user: toUserObject,
        body: val.body,
        sent_at: val.sent_at,
        read_at: val.read_at
      };
    });

    return getMessagesObject;
  }
}

module.exports = Message;
