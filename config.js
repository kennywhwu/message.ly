/** Common config for message.ly */

// read .env files and make environmental variables

require('dotenv').config();

const SECRET_KEY = process.env.SECRET_KEY;
const ACCOUNT_SID = process.env.ACCOUNT_SID;
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const BCRYPT_WORK_ROUNDS = 10;

module.exports = {
  SECRET_KEY,
  BCRYPT_WORK_ROUNDS,
  ACCOUNT_SID,
  AUTH_TOKEN
};
