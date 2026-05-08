require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  liveQaUrl: process.env.LIVE_QA_URL || 'https://www.tiktok.com/live',
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  },
  jwtSecret: process.env.JWT_SECRET || 'change_this_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d'
};
