const pool = require('../../config/db');
const bcrypt = require('bcryptjs');
const { signToken } = require('../../config/jwt');
const { getBusinessParamInt } = require('../../lib/business-param');

async function register(data) {
  const { username, phone, email, password } = data;

  if (!username || !password) {
    throw new Error('用户名和密码不能为空');
  }

  const [rows] = await pool.query(
    'SELECT id FROM users WHERE username = ? LIMIT 1',
    [username]
  );

  if (rows.length > 0) {
    throw new Error('用户名已存在');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [result] = await pool.query(
    `INSERT INTO users (username, phone, email, password_hash, nickname)
     VALUES (?, ?, ?, ?, ?)`,
    [username, phone || null, email || null, passwordHash, username]
  );

  const userId = result.insertId;

  const giftPoints = await getBusinessParamInt('REGISTER_GIFT_POINTS', 48, { min: 0, max: 100000 });

  await pool.query(
    `INSERT INTO user_wallets (user_id, points_balance, energy_balance)
     VALUES (?, ?, 0)`,
    [userId, giftPoints]
  );

  await pool.query(
    `INSERT INTO point_logs (user_id, type, change_amount, balance_after, source, remark)
     VALUES (?, 'register_gift', ?, ?, 'system', '注册赠送积分')`,
    [userId, giftPoints, giftPoints]
  );

  return {
    userId,
    username,
    points: giftPoints
  };
}

async function login(data) {
  const { account, password } = data;

  if (!account || !password) {
    throw new Error('账号和密码不能为空');
  }

  const [rows] = await pool.query(
    `SELECT id, username, phone, email, password_hash, status
     FROM users
     WHERE username = ? OR phone = ? OR email = ?
     LIMIT 1`,
    [account, account, account]
  );

  if (rows.length === 0) {
    throw new Error('账号不存在');
  }

  const user = rows[0];

  if (user.status !== 1) {
    throw new Error('账号已被禁用');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new Error('密码错误');
  }

  await pool.query(
    'UPDATE users SET last_login_at = NOW() WHERE id = ?',
    [user.id]
  );

  const token = signToken({
    userId: user.id,
    username: user.username,
    role: 'member'
  });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      phone: user.phone,
      email: user.email
    }
  };
}

module.exports = { register, login };

