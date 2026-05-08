const pool = require('../../config/db');
let hasRechargeOrderPayChannelCache = null;

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

async function getTrajectory(userId) {
  const [energyRows] = await pool.query(
    `SELECT id, type, change_amount, balance_after, source, remark, created_at
     FROM energy_logs
     WHERE user_id = ?
     ORDER BY id DESC
     LIMIT 100`,
    [userId]
  );

  const [lotteryRows] = await pool.query(
    `SELECT id, reward_type, reward_value, points_before, points_after, created_at
     FROM lottery_records
     WHERE user_id = ?
     ORDER BY id DESC
     LIMIT 100`,
    [userId]
  );

  const hasPayChannel = await hasRechargeOrderPayChannel();
  const payChannelSelect = hasPayChannel ? 'ro.pay_channel' : `'manual' AS pay_channel`;
  const [rechargeRows] = await pool.query(
    `SELECT ro.id, ro.order_no, ro.pay_amount, ${payChannelSelect}, ro.energy_value, ro.status, ro.created_at,
            rp.name AS package_name
     FROM recharge_orders ro
     LEFT JOIN recharge_packages rp ON rp.id = ro.package_id
     WHERE ro.user_id = ?
     ORDER BY ro.id DESC
     LIMIT 100`,
    [userId]
  );

  return {
    energy: energyRows,
    tests: lotteryRows,
    recharges: rechargeRows
  };
}

module.exports = { getTrajectory };
