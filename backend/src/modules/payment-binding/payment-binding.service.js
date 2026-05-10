const pool = require('../../config/db');

const BINDABLE_CHANNELS = [
  { value: 'wechat', label: '微信' },
  { value: 'alipay', label: '支付宝' },
  { value: 'bank_card', label: '银行卡' },
  { value: 'cold_wallet', label: '冷钱包' }
];

function getBindableChannelMeta() {
  return BINDABLE_CHANNELS;
}

function normalizeChannelType(type) {
  const v = String(type || '').trim().toLowerCase();
  const allowed = new Set(BINDABLE_CHANNELS.map((c) => c.value));
  if (!allowed.has(v)) {
    throw new Error('不支持的支付渠道，请选择微信/支付宝/银行卡/冷钱包');
  }
  return v;
}

async function listBindings(userId) {
  const [rows] = await pool.query(
    `SELECT id, channel_type, label, account_mask, account_ref, extra_note, is_default, status, created_at, updated_at
     FROM user_payment_bindings
     WHERE user_id = ? AND status = 1
     ORDER BY is_default DESC, id DESC`,
    [userId]
  );
  return rows;
}

async function createBinding({
  userId,
  channelType,
  label = '',
  accountMask = '',
  accountRef = '',
  extraNote = '',
  setDefault = false
}) {
  const ch = normalizeChannelType(channelType);
  const mask = String(accountMask || '').trim();
  if (mask.length < 2) {
    throw new Error('请填写账户标识（脱敏信息即可，勿提交完整卡号或支付密码）');
  }
  if (mask.length > 120) throw new Error('账户标识过长');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [[row]] = await conn.query(
      `SELECT COUNT(1) AS c FROM user_payment_bindings WHERE user_id = ? AND status = 1`,
      [userId]
    );
    const hasAny = Number(row.c) > 0;
    const [[defRow]] = await conn.query(
      `SELECT COUNT(1) AS c FROM user_payment_bindings WHERE user_id = ? AND status = 1 AND is_default = 1`,
      [userId]
    );
    const hasDefault = Number(defRow.c) > 0;

    let isDef = 0;
    if (setDefault || !hasAny || !hasDefault) {
      isDef = 1;
      await conn.query(
        `UPDATE user_payment_bindings SET is_default = 0 WHERE user_id = ? AND status = 1`,
        [userId]
      );
    }

    const [result] = await conn.query(
      `INSERT INTO user_payment_bindings
        (user_id, channel_type, label, account_mask, account_ref, extra_note, is_default, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        userId,
        ch,
        String(label || '').trim().slice(0, 64) || null,
        mask.slice(0, 120),
        String(accountRef || '').trim().slice(0, 128) || null,
        String(extraNote || '').trim().slice(0, 255) || null,
        isDef
      ]
    );

    await conn.commit();
    return { id: result.insertId };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function setDefaultBinding(userId, bindingId) {
  const [rows] = await pool.query(
    `SELECT id FROM user_payment_bindings WHERE id = ? AND user_id = ? AND status = 1 LIMIT 1`,
    [bindingId, userId]
  );
  if (!rows.length) throw new Error('支付方式不存在');

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      `UPDATE user_payment_bindings SET is_default = 0 WHERE user_id = ? AND status = 1`,
      [userId]
    );
    await conn.query(
      `UPDATE user_payment_bindings SET is_default = 1 WHERE id = ? AND user_id = ?`,
      [bindingId, userId]
    );
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  return true;
}

async function deleteBinding(userId, bindingId) {
  const [rows] = await pool.query(
    `SELECT id, is_default FROM user_payment_bindings WHERE id = ? AND user_id = ? AND status = 1 LIMIT 1`,
    [bindingId, userId]
  );
  if (!rows.length) throw new Error('支付方式不存在');

  await pool.query(
    `UPDATE user_payment_bindings SET status = 0, is_default = 0 WHERE id = ?`,
    [bindingId]
  );

  if (Number(rows[0].is_default) === 1) {
    const [next] = await pool.query(
      `SELECT id FROM user_payment_bindings WHERE user_id = ? AND status = 1 ORDER BY id DESC LIMIT 1`,
      [userId]
    );
    if (next.length) {
      await pool.query(
        `UPDATE user_payment_bindings SET is_default = 0 WHERE user_id = ? AND status = 1`,
        [userId]
      );
      await pool.query(
        `UPDATE user_payment_bindings SET is_default = 1 WHERE id = ?`,
        [next[0].id]
      );
    }
  }

  return true;
}

module.exports = {
  getBindableChannelMeta,
  listBindings,
  createBinding,
  setDefaultBinding,
  deleteBinding
};
