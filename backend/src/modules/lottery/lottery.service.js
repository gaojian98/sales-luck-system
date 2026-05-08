const pool = require('../../config/db');

function drawReward(hasEnergyBoost = false) {
  const rand = Math.random() * 100;

  if (!hasEnergyBoost) {
    if (rand < 40) return { type: 'none', value: 0 };
    if (rand < 70) return { type: 'points', value: 10 };
    if (rand < 85) return { type: 'points', value: 50 };
    if (rand < 95) return { type: 'points', value: 100 };
    return { type: 'retry', value: 0 };
  }

  if (rand < 25) return { type: 'none', value: 0 };
  if (rand < 60) return { type: 'points', value: 10 };
  if (rand < 80) return { type: 'points', value: 50 };
  if (rand < 95) return { type: 'points', value: 100 };
  return { type: 'retry', value: 0 };
}


async function spin(userId) {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [walletRows] = await conn.query(
  'SELECT points_balance, energy_balance FROM user_wallets WHERE user_id = ? FOR UPDATE',
  [userId]
);

    if (walletRows.length === 0) {
      throw new Error('钱包不存在');
    }

    let points = walletRows[0].points_balance;
let energy = walletRows[0].energy_balance;
let usedEnergy = 0;
let hasEnergyBoost = false;

if (energy > 0) {
  hasEnergyBoost = true;
  usedEnergy = 1;
  energy -= 1;
}

    if (points < 10) {
      throw new Error('积分不足');
    }

    const pointsBefore = points;

    // 扣积分
    points -= 10;

    const reward = drawReward(hasEnergyBoost);

    if (reward.type === 'points') {
      points += reward.value;
    }

    const pointsAfter = points;

    // 更新钱包
    await conn.query(
  'UPDATE user_wallets SET points_balance = ?, energy_balance = ? WHERE user_id = ?',
  [pointsAfter, energy, userId]
);

    // 写记录
    await conn.query(
      `INSERT INTO lottery_records 
      (user_id, reward_type, reward_value, points_before, points_after)
      VALUES (?, ?, ?, ?, ?)`,
      [userId, reward.type, reward.value, pointsBefore, pointsAfter]
    );

if (usedEnergy > 0) {
  await conn.query(
    `INSERT INTO energy_logs
    (user_id, type, change_amount, balance_after, source, remark)
    VALUES (?, 'lottery_boost', ?, ?, 'lottery', '抽奖使用能量值提升中奖率')`,
    [userId, -usedEnergy, energy]
  );
}
    await conn.commit();

   return {
  reward_type: reward.type,
  reward_value: reward.value,
  pointsBefore,
  pointsAfter,
  usedEnergy,
  energyAfter: energy,
  boosted: hasEnergyBoost
};

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
async function records(userId) {
  const [rows] = await pool.query(
    `SELECT id, reward_type, reward_value, points_before, points_after, created_at
     FROM lottery_records
     WHERE user_id = ?
     ORDER BY id DESC
     LIMIT 100`,
    [userId]
  );

  return rows;
}

module.exports = { spin,records };


