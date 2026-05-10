const pool = require('../../config/db');
const { getBusinessParamInt } = require('../../lib/business-param');

async function loadEnergyPolicies() {
  const energyPerYuan = await getBusinessParamInt('ENERGY_PER_YUAN_REDEEM', 100, { min: 1, max: 100000 });
  const minRedeemEnergy = await getBusinessParamInt('MIN_REDEEM_ENERGY', 100, { min: 1, max: 100000 });
  const maxGiftPerTx = await getBusinessParamInt('MAX_GIFT_ENERGY_PER_TX', 5000, { min: 1, max: 1000000 });
  return {
    energyPerYuan,
    minRedeemEnergy,
    minGiftEnergy: 1,
    maxGiftPerTx
  };
}

async function loadLotteryEconomy() {
  return {
    spinPointsCost: await getBusinessParamInt('LOTTERY_SPIN_POINTS_COST', 22, { min: 1, max: 9999 }),
    energyBoostCost: await getBusinessParamInt('LOTTERY_ENERGY_BOOST_COST', 1, { min: 1, max: 100 })
  };
}

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

  const energyPolicies = await loadEnergyPolicies();
  const lotteryEconomy = await loadLotteryEconomy();
  return { ...rows[0], energyPolicies, lotteryEconomy };
}

/**
 * 转赠能量（按登录用户名）。双钱包按 user_id 升序加锁，避免死锁。
 */
async function giftEnergy(fromUserId, toUsername, amount) {
  const policies = await loadEnergyPolicies();
  const cleanTo = String(toUsername || '').trim();
  const n = Math.floor(Number(amount));

  if (!cleanTo) {
    throw new Error('请输入对方登录用户名');
  }
  if (!Number.isFinite(n) || n < policies.minGiftEnergy) {
    throw new Error(`赠送能量至少为 ${policies.minGiftEnergy}`);
  }
  if (n > policies.maxGiftPerTx) {
    throw new Error(`单次最多赠送 ${policies.maxGiftPerTx} 点能量`);
  }

  const [toRows] = await pool.query(
    `SELECT id, username FROM users WHERE username = ? LIMIT 1`,
    [cleanTo]
  );
  if (!toRows.length) {
    throw new Error('对方用户不存在');
  }
  const toUser = toRows[0];
  const toId = Number(toUser.id);
  const fromId = Number(fromUserId);
  if (toId === fromId) {
    throw new Error('不能给自己赠送');
  }

  const [fromRows] = await pool.query(`SELECT username FROM users WHERE id = ? LIMIT 1`, [fromUserId]);
  const fromName = fromRows.length ? String(fromRows[0].username) : String(fromUserId);

  const firstId = Math.min(fromId, toId);
  const secondId = Math.max(fromId, toId);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[rowA]] = await conn.query(
      `SELECT user_id, energy_balance FROM user_wallets WHERE user_id = ? FOR UPDATE`,
      [firstId]
    );
    const [[rowB]] = await conn.query(
      `SELECT user_id, energy_balance FROM user_wallets WHERE user_id = ? FOR UPDATE`,
      [secondId]
    );
    if (!rowA || !rowB) {
      throw new Error('钱包不存在');
    }

    const bal = (uid) => (Number(rowA.user_id) === uid ? Number(rowA.energy_balance) : Number(rowB.energy_balance));
    const fromBal = bal(fromId);
    const toBal = bal(toId);

    if (fromBal < n) {
      throw new Error('能量不足');
    }

    await conn.query(
      `UPDATE user_wallets SET energy_balance = energy_balance - ? WHERE user_id = ?`,
      [n, fromId]
    );
    await conn.query(
      `UPDATE user_wallets SET energy_balance = energy_balance + ? WHERE user_id = ?`,
      [n, toId]
    );

    const [[fromAfter]] = await conn.query(
      `SELECT energy_balance FROM user_wallets WHERE user_id = ?`,
      [fromId]
    );
    const [[toAfter]] = await conn.query(`SELECT energy_balance FROM user_wallets WHERE user_id = ?`, [toId]);

    await conn.query(
      `INSERT INTO energy_logs
        (user_id, type, change_amount, balance_after, source, remark)
       VALUES (?, 'gift_send', ?, ?, 'gift', ?)`,
      [fromId, -n, fromAfter.energy_balance, `赠送给 @${cleanTo}`]
    );
    await conn.query(
      `INSERT INTO energy_logs
        (user_id, type, change_amount, balance_after, source, remark)
       VALUES (?, 'gift_receive', ?, ?, 'gift', ?)`,
      [toId, n, toAfter.energy_balance, `来自 @${fromName} 赠送`]
    );

    await conn.commit();
    return {
      sent: n,
      toUsername: cleanTo,
      energyAfter: fromAfter.energy_balance
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * 能量兑换现金：扣除能量并生成待打款单（运营按 payment_binding 线下转账）。
 */
async function redeemEnergyForCash(userId, energyAmount, paymentBindingId = null) {
  const policies = await loadEnergyPolicies();
  const amount = Math.floor(Number(energyAmount));
  if (!Number.isFinite(amount) || amount < policies.minRedeemEnergy) {
    throw new Error(`单次兑换至少 ${policies.minRedeemEnergy} 点能量`);
  }

  const energyPerYuan = policies.energyPerYuan;
  const cashCents = Math.floor((amount * 100) / energyPerYuan);
  const cashAmount = cashCents / 100;
  if (cashAmount < 0.01) {
    throw new Error('折算现金不足 0.01 元，请提高兑换能量数量');
  }

  let bindingId = null;
  if (paymentBindingId != null && String(paymentBindingId).trim() !== '') {
    const bid = Math.floor(Number(paymentBindingId));
    if (!Number.isFinite(bid)) {
      throw new Error('收款方式无效');
    }
    const [bindRows] = await pool.query(
      `SELECT id FROM user_payment_bindings WHERE id = ? AND user_id = ? AND status = 1 LIMIT 1`,
      [bid, userId]
    );
    if (!bindRows.length) {
      throw new Error('请选择本人已保存的收款方式');
    }
    bindingId = bid;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [upd] = await conn.query(
      `UPDATE user_wallets SET energy_balance = energy_balance - ? WHERE user_id = ? AND energy_balance >= ?`,
      [amount, userId, amount]
    );
    if (upd.affectedRows !== 1) {
      throw new Error('能量不足');
    }

    const [[after]] = await conn.query(
      `SELECT energy_balance FROM user_wallets WHERE user_id = ?`,
      [userId]
    );

    const [ins] = await conn.query(
      `INSERT INTO energy_cash_redemptions
        (user_id, energy_amount, cash_amount, energy_per_yuan_snapshot, payment_binding_id, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [userId, amount, cashAmount, energyPerYuan, bindingId]
    );

    await conn.query(
      `INSERT INTO energy_logs
        (user_id, type, change_amount, balance_after, source, remark)
       VALUES (?, 'cash_redeem_hold', ?, ?, 'redeem', ?)`,
      [
        userId,
        -amount,
        after.energy_balance,
        `申请兑换现金 ¥${cashAmount.toFixed(2)}，单号 #${ins.insertId}，待打款`
      ]
    );

    await conn.commit();
    return {
      redemptionId: ins.insertId,
      energyDeducted: amount,
      cashAmount,
      energyPerYuanSnapshot: energyPerYuan,
      energyAfter: after.energy_balance
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = {
  getWallet,
  loadEnergyPolicies,
  loadLotteryEconomy,
  giftEnergy,
  redeemEnergyForCash
};
