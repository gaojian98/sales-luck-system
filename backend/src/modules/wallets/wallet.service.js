const pool = require('../../config/db');

async function getWallet(userId) {
  const [rows] = await pool.query(
    `SELECT user_id, points_balance, energy_balance, updated_at
     FROM user_wallets
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );

  if (rows.length === 0) {
    throw new Error('钱包不存在');
  }

  return rows[0];
}

module.exports = { getWallet };
