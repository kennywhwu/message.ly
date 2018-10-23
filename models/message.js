/** Message class for message.ly */

const db = require('../db');
const { ACCOUNT_SID, AUTH_TOKEN } = require('../config');
const client = require('twilio')(ACCOUNT_SID, AUTH_TOKEN);

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
        RETURNING id, from_username, to_username, body, sent_at`,
      [from_username, to_username, body]
    );
    this._404Error(newMessage);
    return newMessage.rows[0];
  }

  /** Update read_at for message */

  static async markRead(id) {
    let read = await db.query(
      `UPDATE messages
      SET read_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, read_at, to_username`,
      [id]
    );
    return read.rows[0];
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
      `,
      [id]
    );
    let toUser = db.query(
      `SELECT username, first_name, last_name, phone
      FROM messages JOIN users ON messages.to_username = users.username
      WHERE messages.id = $1
      `,
      [id]
    );

    let fromUser = db.query(
      `SELECT username, first_name, last_name, phone
      FROM messages JOIN users ON messages.from_username = users.username
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
    let toUserObj = toUser.rows[0];
    let fromUserObj = fromUser.rows[0];
    let getMessagesObj = getMessage.rows[0];

    let { body, sent_at, read_at } = getMessagesObj;

    let finalMessagesObj = {
      id,
      from_user: fromUserObj,
      to_user: toUserObj,
      body,
      sent_at,
      read_at
    };
    return finalMessagesObj;
  }

  static async createSMS({ from_username, to_username, body }) {
    //Create and insert into db
    let message = await this.create({ from_username, to_username, body });
    console.log(message.id);
    let smsMessage = await db.query(
      `SELECT ufrom.phone as from_phone,
              uto.phone as to_phone,
              m.body
        FROM messages m
        JOIN users ufrom
          ON m.from_username = ufrom.username
        JOIN users uto
          ON m.to_username = uto.username
        WHERE m.id = $1
      `,
      [message.id]
    );
    console.log('smsMessage ', smsMessage.rows[0]);
    this._404Error(smsMessage);
    client.messages
      .create({
        from: `+19783102885`,
        body: smsMessage.rows[0].body,
        to: `+1${smsMessage.rows[0].to_phone}`
      })
      .then(message =>
        console.log(message.sid)
        })
      )
      .done();

    // axios.post(
    //   `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`,
    //   res => {
    //     return res.json({ message });
    //   }
    // );
    return smsMessage.rows[0];
  }

  static async sendSMS({ from_phone, to_phone, body }) {
    client.messages
      .create({ from: `+${from_phone}`, body, to: `+${to_phone}` })
      .then(message => console.log(message.sid))
      .done();
  }
}

module.exports = Message;
