const pool = require('../../config/db');
let hasRechargeOrderPayChannelCache = null;

function generateOrderNo() {
  return 'RC' + Date.now() + Math.floor(Math.random() * 1000);
}

async function hasRechargeOrderPayChannel() {
  if (hasRechargeOrderPayChannelCache !== null) {
    return hasRechargeOrderPayChannelCache;
  }
  const [rows] = await pool.query(
    `SELECT COUNT(1) AS total
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'recharge_orders'
       AND COLUMN_NAME = 'pay_channel'`
  );
  hasRechargeOrderPayChannelCache = Number(rows[0]?.total || 0) > 0;
  return hasRechargeOrderPayChannelCache;
}

async function getPackages() {
  const [rows] = await pool.query(
    `SELECT id, name, amount, energy_value
     FROM recharge_packages
     WHERE is_enabled = 1
     ORDER BY id ASC`
  );

  return rows;
}

function normalizePayChannel(payChannel) {
  const value = String(payChannel || '').trim().toLowerCase();
  const allowed = new Set(['wechat', 'alipay', 'bank_card', 'manual', 'cold_wallet']);
  return allowed.has(value) ? value : 'manual';
}

async function createRecharge(userId, packageId, options = {}) {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [pkgRows] = await conn.query(
      `SELECT id, name, amount, energy_value
       FROM recharge_packages
       WHERE id = ? AND is_enabled = 1
       LIMIT 1`,
      [packageId]
    );

    if (pkgRows.length === 0) {
      throw new Error('充值套餐不存在');
    }

    const pkg = pkgRows[0];

    const [walletRows] = await conn.query(
      `SELECT energy_balance
       FROM user_wallets
       WHERE user_id = ?
       FOR UPDATE`,
      [userId]
    );

    if (walletRows.length === 0) {
      throw new Error('钱包不存在');
    }

    const beforeEnergy = walletRows[0].energy_balance;
    const afterEnergy = beforeEnergy + pkg.energy_value;
    const orderNo = generateOrderNo();
    const channel = normalizePayChannel(options.payChannel);

    const hasPayChannel = await hasRechargeOrderPayChannel();
    if (hasPayChannel) {
      await conn.query(
        `INSERT INTO recharge_orders
        (order_no, user_id, package_id, pay_amount, pay_channel, energy_value, status)
        VALUES (?, ?, ?, ?, ?, ?, 'success')`,
        [orderNo, userId, pkg.id, pkg.amount, channel, pkg.energy_value]
      );
    } else {
      await conn.query(
        `INSERT INTO recharge_orders
        (order_no, user_id, package_id, pay_amount, energy_value, status)
        VALUES (?, ?, ?, ?, ?, 'success')`,
        [orderNo, userId, pkg.id, pkg.amount, pkg.energy_value]
      );
    }

    await conn.query(
      `UPDATE user_wallets
       SET energy_balance = ?
       WHERE user_id = ?`,
      [afterEnergy, userId]
    );

    await conn.query(
      `INSERT INTO energy_logs
      (user_id, type, change_amount, balance_after, source, remark)
      VALUES (?, 'recharge', ?, ?, 'recharge', ?)`,
      [userId, pkg.energy_value, afterEnergy, `充值套餐：${pkg.name}`]
    );

    await conn.commit();

    return {
      orderNo,
      payChannel: channel,
      package: pkg,
      energyBefore: beforeEnergy,
      energyAfter: afterEnergy
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function getRechargeRecords(userId) {
  const hasPayChannel = await hasRechargeOrderPayChannel();
  const payChannelSelect = hasPayChannel ? 'ro.pay_channel' : `'manual' AS pay_channel`;
  const [rows] = await pool.query(
    `SELECT ro.id, ro.order_no, ro.pay_amount, ${payChannelSelect}, ro.energy_value, ro.status, ro.created_at,
            rp.name AS package_name
     FROM recharge_orders ro
     LEFT JOIN recharge_packages rp ON rp.id = ro.package_id
     WHERE ro.user_id = ?
     ORDER BY ro.id DESC
     LIMIT 100`,
    [userId]
  );

  return rows;
}

module.exports = { getPackages, createRecharge, getRechargeRecords };
