const mysql = require('mysql2/promise');
const env = require('./env');

console.log('DB CONFIG DEBUG:', {
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  passwordExists: env.db.password !== undefined,
  database: env.db.database
});

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;

