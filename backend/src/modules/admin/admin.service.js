const bcrypt = require('bcryptjs');
const pool = require('../../config/db');
const { signToken } = require('../../config/jwt');
const DEFAULT_RECHARGE_CHANNEL_OPTIONS = [
  { value: 'wechat', label: '微信' },
  { value: 'alipay', label: '支付宝' },
  { value: 'bank_card', label: '银行卡' },
  { value: 'cold_wallet', label: '冷钱包' },
  { value: 'manual', label: '人工代充' }
];
let hasRechargeOrderPayChannelCache = null;
let hasSupportRechargeRequestPayChannelCache = null;
let hasUserDailyGrowthTableCache = null;
let hasSupportFollowupTasksTableCache = null;
let hasFollowupPhase5ColumnsCache = null;
let hasGrowthEvidenceTableCache = null;
let hasIdentityBadgeUnlockTableCache = null;
const DEFAULT_ASSIST_REJECT_REASONS = [
  '客户信息不完整',
  '支付凭证无效',
  '超出今日代充限额',
  '需客户先补充资料'
];
const DEFAULT_INTERVENTION_TEMPLATES = [
  {
    key: 'low_energy_reactivate',
    title: '低能量唤醒',
    content: '你好，{username}。你不是做不到，而是最近能量波动较大。今天先完成一个最小行动，我们会陪你把节奏拉回来。'
  },
  {
    key: 'fear_stabilize',
    title: '恐惧安抚',
    content: '你好，{username}。你现在的压力是成长前的正常反应。先别追求完美，先完成一步，你会重新找回掌控感。'
  },
  {
    key: 'upgrade_conversion',
    title: '升级转化',
    content: '你好，{username}。你已经有了基础，建议进入更系统的21天重塑节奏，让改变稳定发生。'
  }
];

function normalizePayChannel(payChannel) {
  const value = String(payChannel || '').trim().toLowerCase();
  const allowed = new Set(DEFAULT_RECHARGE_CHANNEL_OPTIONS.map((item) => item.value));
  return allowed.has(value) ? value : 'manual';
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

async function hasSupportRechargeRequestPayChannel() {
  if (hasSupportRechargeRequestPayChannelCache !== null) {
    return hasSupportRechargeRequestPayChannelCache;
  }
  const [rows] = await pool.query(
    `SELECT COUNT(1) AS total
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'support_recharge_requests'
       AND COLUMN_NAME = 'pay_channel'`
  );
  hasSupportRechargeRequestPayChannelCache = Number(rows[0]?.total || 0) > 0;
  return hasSupportRechargeRequestPayChannelCache;
}

async function hasUserDailyGrowthTable() {
  if (hasUserDailyGrowthTableCache !== null) {
    return hasUserDailyGrowthTableCache;
  }
  const [rows] = await pool.query(
    `SELECT COUNT(1) AS total
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'user_daily_growth'`
  );
  hasUserDailyGrowthTableCache = Number(rows[0]?.total || 0) > 0;
  return hasUserDailyGrowthTableCache;
}

async function hasSupportFollowupTasksTable() {
  if (hasSupportFollowupTasksTableCache !== null) {
    return hasSupportFollowupTasksTableCache;
  }
  const [rows] = await pool.query(
    `SELECT COUNT(1) AS total
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'support_followup_tasks'`
  );
  hasSupportFollowupTasksTableCache = Number(rows[0]?.total || 0) > 0;
  return hasSupportFollowupTasksTableCache;
}

async function hasFollowupPhase5Columns() {
  if (hasFollowupPhase5ColumnsCache !== null) {
    return hasFollowupPhase5ColumnsCache;
  }
  if (!(await hasSupportFollowupTasksTable())) {
    hasFollowupPhase5ColumnsCache = false;
    return false;
  }
  const [rows] = await pool.query(
    `SELECT COUNT(1) AS total
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'support_followup_tasks'
       AND COLUMN_NAME = 'priority'`
  );
  hasFollowupPhase5ColumnsCache = Number(rows[0]?.total || 0) > 0;
  return hasFollowupPhase5ColumnsCache;
}

async function hasGrowthEvidenceTable() {
  if (hasGrowthEvidenceTableCache !== null) {
    return hasGrowthEvidenceTableCache;
  }
  const [rows] = await pool.query(
    `SELECT COUNT(1) AS total
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'user_growth_evidence'`
  );
  hasGrowthEvidenceTableCache = Number(rows[0]?.total || 0) > 0;
  return hasGrowthEvidenceTableCache;
}

async function hasIdentityBadgeUnlockTable() {
  if (hasIdentityBadgeUnlockTableCache !== null) {
    return hasIdentityBadgeUnlockTableCache;
  }
  const [rows] = await pool.query(
    `SELECT COUNT(1) AS total
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'user_identity_badge_unlocks'`
  );
  hasIdentityBadgeUnlockTableCache = Number(rows[0]?.total || 0) > 0;
  return hasIdentityBadgeUnlockTableCache;
}

function formatSqlDate(value) {
  if (!value) return '';
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(value);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function getEvidencePhaseByDay(dayIndex) {
  const safeDay = Math.max(1, Number(dayIndex) || 1);
  if (safeDay <= 7) return { phase: 'day_1_7', phase_label: '第1-7天' };
  if (safeDay <= 21) return { phase: 'day_8_21', phase_label: '第8-21天' };
  return { phase: 'day_22_90', phase_label: '第22-90天' };
}

async function adminLogin({ account, password }) {
  if (!account || !password) {
    throw new Error('账号和密码不能为空');
  }

  const [rows] = await pool.query(
    `SELECT id, username, password_hash, role, status
     FROM admin_users
     WHERE username = ?
     LIMIT 1`,
    [account]
  );

  if (rows.length === 0) {
    throw new Error('后台账号不存在');
  }

  const admin = rows[0];
  if (admin.status !== 1) {
    throw new Error('后台账号已禁用');
  }

  const isMatch = await bcrypt.compare(password, admin.password_hash);
  if (!isMatch) {
    throw new Error('账号或密码错误');
  }

  await pool.query(
    'UPDATE admin_users SET last_login_at = NOW() WHERE id = ?',
    [admin.id]
  );

  const token = signToken({
    adminId: admin.id,
    username: admin.username,
    role: admin.role
  });

  return {
    token,
    admin: {
      id: admin.id,
      username: admin.username,
      role: admin.role
    }
  };
}

async function listCustomers({ keyword = '', page = 1, pageSize = 20 }) {
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.max(1, Math.min(100, Number(pageSize) || 20));
  const offset = (safePage - 1) * safePageSize;
  const kw = `%${String(keyword || '').trim()}%`;

  const [rows] = await pool.query(
    `SELECT u.id, u.username, u.phone, u.email, u.status, u.created_at, u.last_login_at,
            w.points_balance, w.energy_balance,
            GROUP_CONCAT(ct.name ORDER BY ct.id SEPARATOR ',') AS tags
     FROM users u
     LEFT JOIN user_wallets w ON w.user_id = u.id
     LEFT JOIN customer_tag_links ctl ON ctl.customer_id = u.id
     LEFT JOIN customer_tags ct ON ct.id = ctl.tag_id
     WHERE (? = '%%' OR u.username LIKE ? OR u.phone LIKE ? OR u.email LIKE ?)
     GROUP BY u.id, u.username, u.phone, u.email, u.status, u.created_at, u.last_login_at, w.points_balance, w.energy_balance
     ORDER BY u.id DESC
     LIMIT ? OFFSET ?`,
    [kw, kw, kw, kw, safePageSize, offset]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(1) AS total
     FROM users u
     WHERE (? = '%%' OR u.username LIKE ? OR u.phone LIKE ? OR u.email LIKE ?)`,
    [kw, kw, kw, kw]
  );

  return {
    list: rows.map((item) => ({
      ...item,
      tags: item.tags ? item.tags.split(',') : []
    })),
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      total: countRows[0]?.total || 0
    }
  };
}

async function getCustomerDetail(userId) {
  const [users] = await pool.query(
    `SELECT u.id, u.username, u.phone, u.email, u.status, u.created_at, u.last_login_at,
            w.points_balance, w.energy_balance
     FROM users u
     LEFT JOIN user_wallets w ON w.user_id = u.id
     WHERE u.id = ?
     LIMIT 1`,
    [userId]
  );

  if (users.length === 0) {
    throw new Error('客户不存在');
  }

  const [lotteryRows] = await pool.query(
    `SELECT id, reward_type, reward_value, points_before, points_after, created_at
     FROM lottery_records
     WHERE user_id = ?
     ORDER BY id DESC
     LIMIT 20`,
    [userId]
  );

  const hasRechargePayChannel = await hasRechargeOrderPayChannel();
  const rechargePayChannelSelect = hasRechargePayChannel ? 'ro.pay_channel' : `'manual' AS pay_channel`;
  const [rechargeRows] = await pool.query(
    `SELECT ro.id, ro.order_no, ro.pay_amount, ${rechargePayChannelSelect}, ro.energy_value, ro.status, ro.created_at,
            rp.name AS package_name
     FROM recharge_orders ro
     LEFT JOIN recharge_packages rp ON rp.id = ro.package_id
     WHERE ro.user_id = ?
     ORDER BY ro.id DESC
     LIMIT 20`,
    [userId]
  );

  const [energyRows] = await pool.query(
    `SELECT id, type, change_amount, balance_after, source, remark, created_at
     FROM energy_logs
     WHERE user_id = ?
     ORDER BY id DESC
     LIMIT 20`,
    [userId]
  );

  const [tagsRows] = await pool.query(
    `SELECT ct.id, ct.name, ct.color
     FROM customer_tag_links ctl
     JOIN customer_tags ct ON ct.id = ctl.tag_id
     WHERE ctl.customer_id = ?
     ORDER BY ct.id ASC`,
    [userId]
  );

  const hasGrowthTable = await hasUserDailyGrowthTable();
  const mindsetRows = hasGrowthTable
    ? (await pool.query(
        `SELECT practice_date, affirmation_done, action_done, reflection_done,
                self_confirmation_score, fear_interference_index, action_consistency_index
         FROM user_daily_growth
         WHERE user_id = ?
         ORDER BY practice_date DESC
         LIMIT 14`,
        [userId]
      ))[0]
    : [];

  const latestMindset = mindsetRows[0] || null;
  const thisWeek = mindsetRows.slice(0, 7);
  const prevWeek = mindsetRows.slice(7, 14);
  const avg = (rows, key) => {
    if (!rows.length) return null;
    const total = rows.reduce((sum, row) => sum + Number(row[key] || 0), 0);
    return Number((total / rows.length).toFixed(1));
  };
  const mindsetSummary = {
    latest: latestMindset,
    thisWeek: {
      selfConfirmation: avg(thisWeek, 'self_confirmation_score'),
      actionConsistency: avg(thisWeek, 'action_consistency_index'),
      fearInterference: avg(thisWeek, 'fear_interference_index')
    },
    prevWeek: {
      selfConfirmation: avg(prevWeek, 'self_confirmation_score'),
      actionConsistency: avg(prevWeek, 'action_consistency_index'),
      fearInterference: avg(prevWeek, 'fear_interference_index')
    }
  };

  let identity = null;
  if (mindsetRows.length > 0) {
    const latest = mindsetRows[0] || {};
    const streakRows = [...mindsetRows].sort((a, b) => new Date(a.practice_date).getTime() - new Date(b.practice_date).getTime());
    let currentStreak = 0;
    for (let i = streakRows.length - 1; i >= 0; i -= 1) {
      if (Number(streakRows[i].action_done) === 1) currentStreak += 1;
      else break;
    }
    let evidenceCount = 0;
    if (await hasGrowthEvidenceTable()) {
      const [countRows] = await pool.query(
        `SELECT COUNT(1) AS total
         FROM user_growth_evidence
         WHERE user_id = ?`,
        [userId]
      );
      evidenceCount = Number(countRows[0]?.total || 0);
    }
    const levelScore = Number(
      (
        currentStreak * 1.2 +
        Number(latest.self_confirmation_score || 50) * 0.3 +
        Number(latest.action_consistency_index || 50) * 0.3 -
        Number(latest.fear_interference_index || 50) * 0.2 +
        evidenceCount * 2
      ).toFixed(2)
    );
    const levels = [
      { level: 1, name: '萌芽者', min: 0 },
      { level: 2, name: '觉醒者', min: 80 },
      { level: 3, name: '践行者', min: 140 },
      { level: 4, name: '进化者', min: 200 },
      { level: 5, name: '引领者', min: 280 }
    ];
    let currentLevel = levels[0];
    for (const item of levels) {
      if (levelScore >= item.min) currentLevel = item;
    }
    let badgeUnlocks = [];
    if (await hasIdentityBadgeUnlockTable()) {
      [badgeUnlocks] = await pool.query(
        `SELECT badge_key, badge_title, source_type, unlocked_at
         FROM user_identity_badge_unlocks
         WHERE user_id = ?
         ORDER BY unlocked_at DESC, id DESC
         LIMIT 20`,
        [userId]
      );
    }
    let evidenceRows = [];
    if (await hasGrowthEvidenceTable()) {
      [evidenceRows] = await pool.query(
        `SELECT id, title, content, source_type, evidence_date, created_at
         FROM user_growth_evidence
         WHERE user_id = ?
         ORDER BY id DESC
         LIMIT 20`,
        [userId]
      );
    }
    const userCreatedAt = profile.created_at ? new Date(profile.created_at) : new Date();
    evidenceRows = evidenceRows.map((row) => {
      const t = row.created_at || row.evidence_date;
      const cur = t ? new Date(t) : new Date();
      const diff = cur.getTime() - userCreatedAt.getTime();
      const dayIndex = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
      return {
        ...row,
        ...getEvidencePhaseByDay(dayIndex)
      };
    });
    identity = {
      level: currentLevel.level,
      levelName: currentLevel.name,
      levelScore,
      currentStreak,
      evidenceCount,
      badgeUnlocks,
      evidences: evidenceRows
    };
  }

  return {
    profile: users[0],
    tags: tagsRows,
    tests: lotteryRows,
    recharges: rechargeRows,
    energy: energyRows,
    mindset: mindsetSummary,
    identity
  };
}

async function createAssistRecharge({
  userId,
  packageId,
  payChannel = 'manual',
  paymentMode = 'manual_topup',
  remark,
  requestedBy
}) {
  if (!userId || !packageId) {
    throw new Error('客户和充值套餐不能为空');
  }

  const hasPayChannel = await hasSupportRechargeRequestPayChannel();
  const safeChannel = normalizePayChannel(payChannel);
  let result;
  if (hasPayChannel) {
    [result] = await pool.query(
      `INSERT INTO support_recharge_requests
        (user_id, package_id, pay_channel, payment_mode, status, remark, requested_by)
       VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
      [userId, packageId, safeChannel, paymentMode, (remark || '').trim() || null, requestedBy]
    );
  } else {
    [result] = await pool.query(
      `INSERT INTO support_recharge_requests
        (user_id, package_id, payment_mode, status, remark, requested_by)
       VALUES (?, ?, ?, 'pending', ?, ?)`,
      [userId, packageId, paymentMode, (remark || '').trim() || null, requestedBy]
    );
  }

  const payChannelSelect = hasPayChannel ? 'pay_channel' : `'manual' AS pay_channel`;
  const [rows] = await pool.query(
    `SELECT id, user_id, package_id, ${payChannelSelect}, payment_mode, status, remark, requested_by, created_at
     FROM support_recharge_requests
     WHERE id = ?
     LIMIT 1`,
    [result.insertId]
  );

  await createSupportNotification({
    userId: Number(userId),
    eventType: 'assist_recharge_created',
    title: '代充值申请已创建',
    content: `申请编号 #${rows[0].id} 已创建，正在等待审批。`,
    relatedType: 'support_recharge_request',
    relatedId: String(rows[0].id)
  });

  return rows[0];
}

async function createSupportNotification({
  userId = null,
  eventType,
  title,
  content,
  relatedType = null,
  relatedId = null
}) {
  await pool.query(
    `INSERT INTO support_notifications (user_id, event_type, title, content, related_type, related_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId || null, eventType, title, content, relatedType, relatedId]
  );
}

async function approveAssistRecharge({
  requestId,
  approvedBy,
  rechargeExecutor
}) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const hasPayChannel = await hasSupportRechargeRequestPayChannel();
    const payChannelSelect = hasPayChannel ? 'pay_channel' : `'manual' AS pay_channel`;
    const [rows] = await conn.query(
      `SELECT id, user_id, package_id, ${payChannelSelect}, status
       FROM support_recharge_requests
       WHERE id = ?
       FOR UPDATE`,
      [requestId]
    );

    if (rows.length === 0) {
      throw new Error('代充值请求不存在');
    }

    const request = rows[0];
    if (request.status !== 'pending') {
      throw new Error('该请求已处理');
    }

    const rechargeResultWithChannel = await rechargeExecutor(request.user_id, request.package_id, {
      payChannel: request.pay_channel
    });

    await conn.query(
      `UPDATE support_recharge_requests
       SET status = 'approved',
           approved_by = ?,
           processed_at = NOW()
       WHERE id = ?`,
      [approvedBy, request.id]
    );

    await conn.commit();

    await createSupportNotification({
      userId: request.user_id,
      eventType: 'assist_recharge_approved',
      title: '代充值审批通过',
      content: `申请 #${request.id} 已通过并完成充值，订单号：${rechargeResultWithChannel.orderNo || '-'}`,
      relatedType: 'support_recharge_request',
      relatedId: String(request.id)
    });

    return {
      requestId: request.id,
      rechargeResult: rechargeResultWithChannel
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function rejectAssistRecharge({ requestId, rejectedBy, reason }) {
  const textReason = String(reason || '').trim();
  if (!textReason) {
    throw new Error('驳回原因不能为空');
  }

  const [rows] = await pool.query(
    `SELECT id, status
     FROM support_recharge_requests
     WHERE id = ?
     LIMIT 1`,
    [requestId]
  );

  if (rows.length === 0) {
    throw new Error('代充值请求不存在');
  }
  if (rows[0].status !== 'pending') {
    throw new Error('该请求已处理');
  }

  await pool.query(
    `UPDATE support_recharge_requests
     SET status = 'rejected',
         approved_by = ?,
         reject_reason = ?,
         processed_at = NOW()
     WHERE id = ?`,
    [rejectedBy, textReason, requestId]
  );

  const [requestRows] = await pool.query(
    `SELECT user_id
     FROM support_recharge_requests
     WHERE id = ?
     LIMIT 1`,
    [requestId]
  );
  await createSupportNotification({
    userId: Number(requestRows[0]?.user_id || 0) || null,
    eventType: 'assist_recharge_rejected',
    title: '代充值申请已驳回',
    content: `申请 #${requestId} 驳回原因：${textReason}`,
    relatedType: 'support_recharge_request',
    relatedId: String(requestId)
  });

  return {
    requestId: Number(requestId),
    status: 'rejected',
    rejectReason: textReason
  };
}

async function cancelAssistRecharge({ requestId, cancelledBy, reason = '' }) {
  const [rows] = await pool.query(
    `SELECT id, user_id, status
     FROM support_recharge_requests
     WHERE id = ?
     LIMIT 1`,
    [requestId]
  );
  if (rows.length === 0) {
    throw new Error('代充值请求不存在');
  }
  const request = rows[0];
  if (request.status !== 'pending') {
    throw new Error('仅 pending 状态支持撤销');
  }
  const textReason = String(reason || '').trim() || '客服手动撤销';
  await pool.query(
    `UPDATE support_recharge_requests
     SET status = 'cancelled',
         approved_by = ?,
         reject_reason = ?,
         processed_at = NOW()
     WHERE id = ?`,
    [cancelledBy, textReason, requestId]
  );
  await createSupportNotification({
    userId: request.user_id,
    eventType: 'assist_recharge_cancelled',
    title: '代充值申请已撤销',
    content: `申请 #${requestId} 已撤销，原因：${textReason}`,
    relatedType: 'support_recharge_request',
    relatedId: String(requestId)
  });
  return { requestId: Number(requestId), status: 'cancelled', reason: textReason };
}

async function sweepAssistRechargeTimeout({ timeoutMinutes = 30 }) {
  const safeTimeout = Math.max(5, Math.min(1440, Number(timeoutMinutes) || 30));
  const [rows] = await pool.query(
    `SELECT id, user_id
     FROM support_recharge_requests
     WHERE status = 'pending'
       AND created_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)
     ORDER BY id ASC
     LIMIT 200`,
    [safeTimeout]
  );
  if (rows.length === 0) {
    return { timeoutMinutes: safeTimeout, affected: 0 };
  }
  const ids = rows.map((r) => r.id);
  await pool.query(
    `UPDATE support_recharge_requests
     SET status = 'timed_out',
         reject_reason = '审批超时自动关闭',
         processed_at = NOW()
     WHERE id IN (?)`,
    [ids]
  );
  await Promise.all(
    rows.map((row) =>
      createSupportNotification({
        userId: row.user_id,
        eventType: 'assist_recharge_timed_out',
        title: '代充值申请已超时',
        content: `申请 #${row.id} 超过 ${safeTimeout} 分钟未审批，已自动关闭。`,
        relatedType: 'support_recharge_request',
        relatedId: String(row.id)
      })
    )
  );
  return { timeoutMinutes: safeTimeout, affected: ids.length, requestIds: ids };
}

async function getAssistRejectReasonTemplates() {
  const [rows] = await pool.query(
    `SELECT config_value
     FROM system_configs
     WHERE config_key = 'ASSIST_REJECT_REASON_TEMPLATES'
     LIMIT 1`
  );
  if (rows.length === 0) {
    return DEFAULT_ASSIST_REJECT_REASONS;
  }
  try {
    const parsed = JSON.parse(rows[0].config_value);
    const valid = Array.isArray(parsed) ? parsed.map((v) => String(v || '').trim()).filter(Boolean) : [];
    return valid.length > 0 ? valid : DEFAULT_ASSIST_REJECT_REASONS;
  } catch (err) {
    return DEFAULT_ASSIST_REJECT_REASONS;
  }
}

async function getInterventionTemplates() {
  const [rows] = await pool.query(
    `SELECT config_value
     FROM system_configs
     WHERE config_key = 'INTERVENTION_TEMPLATES'
     LIMIT 1`
  );
  if (rows.length === 0) {
    return DEFAULT_INTERVENTION_TEMPLATES;
  }
  try {
    const parsed = JSON.parse(rows[0].config_value);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_INTERVENTION_TEMPLATES;
    const valid = parsed
      .map((item) => ({
        key: String(item?.key || '').trim(),
        title: String(item?.title || '').trim(),
        content: String(item?.content || '').trim()
      }))
      .filter((item) => item.key && item.title && item.content);
    return valid.length > 0 ? valid : DEFAULT_INTERVENTION_TEMPLATES;
  } catch (err) {
    return DEFAULT_INTERVENTION_TEMPLATES;
  }
}

async function getCustomerRiskProfile(userId) {
  const [userRows] = await pool.query(
    `SELECT id, username
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [userId]
  );
  if (userRows.length === 0) {
    throw new Error('客户不存在');
  }
  const hasGrowthTable = await hasUserDailyGrowthTable();
  if (!hasGrowthTable) {
    return {
      userId: Number(userId),
      username: userRows[0].username,
      riskLevel: 'medium',
      reason: '缺少行为数据，默认中风险'
    };
  }
  const [rows] = await pool.query(
    `SELECT self_confirmation_score, fear_interference_index, action_consistency_index
     FROM user_daily_growth
     WHERE user_id = ?
     ORDER BY practice_date DESC
     LIMIT 1`,
    [userId]
  );
  if (rows.length === 0) {
    return {
      userId: Number(userId),
      username: userRows[0].username,
      riskLevel: 'medium',
      reason: '暂无练习记录，默认中风险'
    };
  }
  const row = rows[0];
  let riskLevel = 'low';
  if (Number(row.fear_interference_index) >= 70 || Number(row.action_consistency_index) <= 35) {
    riskLevel = 'high';
  } else if (Number(row.fear_interference_index) >= 55 || Number(row.action_consistency_index) <= 50) {
    riskLevel = 'medium';
  }
  return {
    userId: Number(userId),
    username: userRows[0].username,
    riskLevel,
    scores: {
      selfConfirmation: Number(row.self_confirmation_score || 0),
      fearInterference: Number(row.fear_interference_index || 0),
      actionConsistency: Number(row.action_consistency_index || 0)
    },
    reason:
      riskLevel === 'high'
        ? '恐惧干扰高或行动稳定性偏低'
        : riskLevel === 'medium'
          ? '近期波动较明显，建议持续跟进'
          : '状态稳定，可做升级转化'
  };
}

async function fillInterventionTemplate({ templateKey, userId }) {
  const templates = await getInterventionTemplates();
  const [userRows] = await pool.query(
    `SELECT id, username
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [userId]
  );
  if (userRows.length === 0) {
    throw new Error('客户不存在');
  }
  const hit = templates.find((item) => item.key === String(templateKey || '').trim());
  if (!hit) {
    throw new Error('干预模板不存在');
  }
  return {
    key: hit.key,
    title: hit.title,
    content: hit.content.replaceAll('{username}', userRows[0].username || '用户'),
    userId: Number(userId),
    username: userRows[0].username
  };
}

async function listAssistRechargeRequests({ status = '', limit = 50 }) {
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50));
  const safeStatus = String(status || '').trim();
  const whereClause =
    safeStatus && ['pending', 'approved', 'rejected', 'cancelled', 'timed_out'].includes(safeStatus)
      ? 'WHERE sr.status = ?'
      : '';
  const params = whereClause ? [safeStatus, safeLimit] : [safeLimit];

  const hasPayChannel = await hasSupportRechargeRequestPayChannel();
  const payChannelSelect = hasPayChannel ? 'sr.pay_channel' : `'manual' AS pay_channel`;
  const [rows] = await pool.query(
    `SELECT sr.id, sr.user_id, sr.package_id, ${payChannelSelect}, sr.payment_mode, sr.status, sr.remark, sr.reject_reason, sr.processed_at, sr.created_at,
            u.username AS customer_username,
            rp.name AS package_name,
            req.username AS requested_by_username,
            apv.username AS approved_by_username
     FROM support_recharge_requests sr
     LEFT JOIN users u ON u.id = sr.user_id
     LEFT JOIN recharge_packages rp ON rp.id = sr.package_id
     LEFT JOIN admin_users req ON req.id = sr.requested_by
     LEFT JOIN admin_users apv ON apv.id = sr.approved_by
     ${whereClause}
     ORDER BY sr.id DESC
     LIMIT ?`,
    params
  );

  return rows;
}

async function listSupportNotifications({ userId = '', limit = 50 }) {
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50));
  const useUser = Number(userId) > 0;
  const params = useUser ? [Number(userId), safeLimit] : [safeLimit];
  const [rows] = await pool.query(
    `SELECT sn.id, sn.user_id, sn.event_type, sn.title, sn.content, sn.related_type, sn.related_id, sn.created_at,
            u.username AS customer_username
     FROM support_notifications sn
     LEFT JOIN users u ON u.id = sn.user_id
     ${useUser ? 'WHERE sn.user_id = ?' : ''}
     ORDER BY sn.id DESC
     LIMIT ?`,
    params
  );
  return rows;
}

async function listConfigItems() {
  const [rows] = await pool.query(
    `SELECT id, config_key, config_value, updated_by, updated_at
     FROM system_configs
     ORDER BY config_key ASC`
  );
  return rows;
}

async function upsertConfigItem({ key, value, updatedBy }) {
  const textValue = String(value || '').trim();
  if (!textValue) {
    throw new Error('配置值不能为空');
  }

  const [beforeRows] = await pool.query(
    `SELECT config_value
     FROM system_configs
     WHERE config_key = ?
     LIMIT 1`,
    [key]
  );
  const oldValue = beforeRows[0]?.config_value || null;

  await pool.query(
    `INSERT INTO system_configs (config_key, config_value, updated_by)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       config_value = VALUES(config_value),
       updated_by = VALUES(updated_by),
       updated_at = CURRENT_TIMESTAMP`,
    [key, textValue, updatedBy]
  );

  await pool.query(
    `INSERT INTO system_config_history (config_key, old_value, new_value, updated_by)
     VALUES (?, ?, ?, ?)`,
    [key, oldValue, textValue, updatedBy]
  );

  const [rows] = await pool.query(
    `SELECT id, config_key, config_value, updated_by, updated_at
     FROM system_configs
     WHERE config_key = ?
     LIMIT 1`,
    [key]
  );
  return rows[0];
}

async function listConfigHistory({ key = '', limit = 50 }) {
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50));
  const safeKey = String(key || '').trim().toUpperCase();
  const whereClause = safeKey ? 'WHERE h.config_key = ?' : '';
  const params = safeKey ? [safeKey, safeLimit] : [safeLimit];

  const [rows] = await pool.query(
    `SELECT h.id, h.config_key, h.old_value, h.new_value, h.created_at,
            au.username AS updated_by_username
     FROM system_config_history h
     LEFT JOIN admin_users au ON au.id = h.updated_by
     ${whereClause}
     ORDER BY h.id DESC
     LIMIT ?`,
    params
  );
  return rows;
}

async function rollbackConfig({ historyId, updatedBy }) {
  const [rows] = await pool.query(
    `SELECT id, config_key, old_value, new_value
     FROM system_config_history
     WHERE id = ?
     LIMIT 1`,
    [historyId]
  );
  if (rows.length === 0) {
    throw new Error('配置历史记录不存在');
  }

  const history = rows[0];
  const rollbackValue = history.old_value !== null ? history.old_value : history.new_value;
  return upsertConfigItem({
    key: history.config_key,
    value: rollbackValue,
    updatedBy
  });
}

async function getRechargeChannelOptions() {
  const [rows] = await pool.query(
    `SELECT config_value
     FROM system_configs
     WHERE config_key = 'RECHARGE_CHANNEL_OPTIONS'
     LIMIT 1`
  );
  if (rows.length === 0) return DEFAULT_RECHARGE_CHANNEL_OPTIONS;
  try {
    const parsed = JSON.parse(rows[0].config_value);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_RECHARGE_CHANNEL_OPTIONS;
    const valid = parsed.filter((item) => item && item.value && item.label);
    return valid.length > 0 ? valid : DEFAULT_RECHARGE_CHANNEL_OPTIONS;
  } catch (err) {
    return DEFAULT_RECHARGE_CHANNEL_OPTIONS;
  }
}

async function listBusinessParams() {
  const [rows] = await pool.query(
    `SELECT id, param_key, param_value, updated_by, updated_at
     FROM business_params
     ORDER BY param_key ASC`
  );
  return rows;
}

async function upsertBusinessParam({ key, value, updatedBy }) {
  const textValue = String(value || '').trim();
  if (!textValue) {
    throw new Error('参数值不能为空');
  }

  await pool.query(
    `INSERT INTO business_params (param_key, param_value, updated_by)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       param_value = VALUES(param_value),
       updated_by = VALUES(updated_by),
       updated_at = CURRENT_TIMESTAMP`,
    [key, textValue, updatedBy]
  );

  const [rows] = await pool.query(
    `SELECT id, param_key, param_value, updated_by, updated_at
     FROM business_params
     WHERE param_key = ?
     LIMIT 1`,
    [key]
  );
  return rows[0];
}

async function listAuditLogs({ limit = 50, action = '', admin = '' } = {}) {
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50));
  const actionFilter = String(action || '').trim();
  const adminFilter = `%${String(admin || '').trim()}%`;
  const hasAction = !!actionFilter;
  const hasAdmin = adminFilter !== '%%';
  const [rows] = await pool.query(
    `SELECT al.id, al.action, al.target_type, al.target_id, al.detail, al.ip_address, al.created_at,
            au.username AS admin_username
     FROM admin_audit_logs al
     LEFT JOIN admin_users au ON au.id = al.admin_user_id
     WHERE (? = 0 OR al.action = ?)
       AND (? = 0 OR au.username LIKE ?)
     ORDER BY al.id DESC
     LIMIT ?`,
    [hasAction ? 1 : 0, actionFilter, hasAdmin ? 1 : 0, adminFilter, safeLimit]
  );
  return rows;
}

async function listCustomerTags() {
  const [rows] = await pool.query(
    `SELECT id, name, color, created_at
     FROM customer_tags
     ORDER BY id DESC`
  );
  return rows;
}

async function createCustomerTag({ name, color = '#64748b', createdBy }) {
  const tagName = String(name || '').trim();
  if (!tagName) {
    throw new Error('标签名不能为空');
  }
  const [result] = await pool.query(
    `INSERT INTO customer_tags (name, color, created_by)
     VALUES (?, ?, ?)`,
    [tagName, String(color || '#64748b').trim(), createdBy]
  );
  const [rows] = await pool.query(
    `SELECT id, name, color, created_at
     FROM customer_tags
     WHERE id = ?
     LIMIT 1`,
    [result.insertId]
  );
  return rows[0];
}

async function bindCustomerTag({ customerId, tagId }) {
  await pool.query(
    `INSERT INTO customer_tag_links (customer_id, tag_id)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE customer_id = VALUES(customer_id)`,
    [customerId, tagId]
  );
  return { customerId: Number(customerId), tagId: Number(tagId) };
}

async function listSupportTickets({ status = '', limit = 50 }) {
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50));
  const safeStatus = String(status || '').trim();
  const whereClause =
    safeStatus && ['open', 'processing', 'resolved', 'closed'].includes(safeStatus)
      ? 'WHERE st.status = ?'
      : '';
  const params = whereClause ? [safeStatus, safeLimit] : [safeLimit];

  const [rows] = await pool.query(
    `SELECT st.id, st.user_id, st.title, st.content, st.status, st.priority, st.sla_due_at, st.created_at, st.updated_at,
            u.username AS customer_username,
            a1.username AS created_by_username,
            a2.username AS assigned_to_username
     FROM support_tickets st
     LEFT JOIN users u ON u.id = st.user_id
     LEFT JOIN admin_users a1 ON a1.id = st.created_by
     LEFT JOIN admin_users a2 ON a2.id = st.assigned_to
     ${whereClause}
     ORDER BY st.id DESC
     LIMIT ?`,
    params
  );
  const now = Date.now();
  return rows.map((row) => {
    const due = row.sla_due_at ? new Date(row.sla_due_at).getTime() : null;
    const isClosed = row.status === 'resolved' || row.status === 'closed';
    const slaStatus = due && !isClosed && due < now ? 'overdue' : 'normal';
    return {
      ...row,
      sla_status: slaStatus
    };
  });
}

async function createSupportTicket({
  userId,
  title,
  content,
  priority = 'normal',
  createdBy
}) {
  const safeTitle = String(title || '').trim();
  if (!safeTitle) {
    throw new Error('工单标题不能为空');
  }
  const [result] = await pool.query(
    `INSERT INTO support_tickets (user_id, title, content, status, priority, sla_due_at, created_by, updated_by)
     VALUES (?, ?, ?, 'open', ?, DATE_ADD(NOW(), INTERVAL 24 HOUR), ?, ?)`,
    [userId || null, safeTitle, String(content || '').trim() || null, priority, createdBy, createdBy]
  );
  const [rows] = await pool.query(
    `SELECT id, user_id, title, content, status, priority, sla_due_at, created_at
     FROM support_tickets
     WHERE id = ?
     LIMIT 1`,
    [result.insertId]
  );
  return rows[0];
}

async function updateSupportTicketStatus({
  ticketId,
  status,
  assignedTo = null,
  updatedBy
}) {
  const safeStatus = String(status || '').trim();
  if (!['open', 'processing', 'resolved', 'closed'].includes(safeStatus)) {
    throw new Error('工单状态非法');
  }
  await pool.query(
    `UPDATE support_tickets
     SET status = ?,
         assigned_to = ?,
         updated_by = ?
     WHERE id = ?`,
    [safeStatus, assignedTo || null, updatedBy, ticketId]
  );
  return { ticketId: Number(ticketId), status: safeStatus, assignedTo };
}

async function listTicketComments(ticketId, limit = 50) {
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50));
  const [rows] = await pool.query(
    `SELECT c.id, c.ticket_id, c.comment, c.created_at, au.username AS created_by_username
     FROM support_ticket_comments c
     LEFT JOIN admin_users au ON au.id = c.created_by
     WHERE c.ticket_id = ?
     ORDER BY c.id DESC
     LIMIT ?`,
    [ticketId, safeLimit]
  );
  return rows;
}

async function createTicketComment({ ticketId, comment, createdBy }) {
  const text = String(comment || '').trim();
  if (!text) {
    throw new Error('评论内容不能为空');
  }
  const [result] = await pool.query(
    `INSERT INTO support_ticket_comments (ticket_id, comment, created_by)
     VALUES (?, ?, ?)`,
    [ticketId, text, createdBy]
  );
  const [rows] = await pool.query(
    `SELECT id, ticket_id, comment, created_at
     FROM support_ticket_comments
     WHERE id = ?
     LIMIT 1`,
    [result.insertId]
  );
  return rows[0];
}

function enrichFollowupRow(row) {
  if (!row) return row;
  const due = row.due_at ? new Date(row.due_at).getTime() : null;
  const now = Date.now();
  row.is_overdue = row.status === 'pending' && due !== null && !Number.isNaN(due) && due < now;
  if (row.priority === undefined || row.priority === null) {
    const stagePri = { D7: 40, D3: 25, D1: 15 };
    row.priority = stagePri[row.stage] ?? 0;
  }
  return row;
}

async function createFollowupTasks({ userId, createdBy, assignedTo = null, customContent = '' }) {
  const hasTable = await hasSupportFollowupTasksTable();
  if (!hasTable) {
    throw new Error('跟进任务表不存在，请先执行迁移');
  }
  const ext = await hasFollowupPhase5Columns();
  const uid = Number(userId || 0);
  if (!uid) {
    throw new Error('客户ID不能为空');
  }
  const stages = [
    { stage: 'D1', hours: 24, title: 'D1 新客激活跟进', priority: 15 },
    { stage: 'D3', hours: 72, title: 'D3 节奏巩固跟进', priority: 25 },
    { stage: 'D7', hours: 168, title: 'D7 转化升级跟进', priority: 40 }
  ];
  const content = String(customContent || '').trim() || null;
  const createdIds = [];
  for (const item of stages) {
    if (ext) {
      const [result] = await pool.query(
        `INSERT INTO support_followup_tasks
         (user_id, stage, task_title, task_content, priority, status, due_at, assigned_to, created_by)
         VALUES (?, ?, ?, ?, ?, 'pending', DATE_ADD(NOW(), INTERVAL ? HOUR), ?, ?)`,
        [uid, item.stage, item.title, content, item.priority, item.hours, assignedTo || null, createdBy]
      );
      createdIds.push(result.insertId);
    } else {
      const [result] = await pool.query(
        `INSERT INTO support_followup_tasks
         (user_id, stage, task_title, task_content, status, due_at, assigned_to, created_by)
         VALUES (?, ?, ?, ?, 'pending', DATE_ADD(NOW(), INTERVAL ? HOUR), ?, ?)`,
        [uid, item.stage, item.title, content, item.hours, assignedTo || null, createdBy]
      );
      createdIds.push(result.insertId);
    }
  }
  const selectCols = ext
    ? `id, user_id, stage, task_title, task_content, priority, status, due_at, assigned_to, completed_at, completed_by, overdue_reminder_at, created_at`
    : `id, user_id, stage, task_title, task_content, status, due_at, assigned_to, completed_at, created_at`;
  const [rows] = await pool.query(
    `SELECT ${selectCols}
     FROM support_followup_tasks
     WHERE id IN (?)
     ORDER BY id ASC`,
    [createdIds]
  );
  return rows.map(enrichFollowupRow);
}

async function listFollowupTasks({
  status = '',
  stage = '',
  userId = '',
  assignedTo = '',
  overdueOnly = '',
  limit = 50
}) {
  const hasTable = await hasSupportFollowupTasksTable();
  if (!hasTable) return [];
  const ext = await hasFollowupPhase5Columns();
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50));
  const safeStatus = String(status || '').trim();
  const safeStage = String(stage || '').trim().toUpperCase();
  const safeUserId = Number(userId || 0);
  const safeAssigned = Number(assignedTo || 0);
  const onlyOverdue =
    overdueOnly === true ||
    overdueOnly === 1 ||
    String(overdueOnly || '').toLowerCase() === 'true' ||
    String(overdueOnly || '') === '1';
  const conditions = [];
  const params = [];
  if (['pending', 'done', 'cancelled'].includes(safeStatus)) {
    conditions.push('ft.status = ?');
    params.push(safeStatus);
  }
  if (['D1', 'D3', 'D7'].includes(safeStage)) {
    conditions.push('ft.stage = ?');
    params.push(safeStage);
  }
  if (safeUserId > 0) {
    conditions.push('ft.user_id = ?');
    params.push(safeUserId);
  }
  if (safeAssigned > 0) {
    conditions.push('ft.assigned_to = ?');
    params.push(safeAssigned);
  }
  if (onlyOverdue) {
    conditions.push(`ft.status = 'pending'`);
    conditions.push('ft.due_at < NOW()');
  }
  const whereClause = conditions.length ? ('WHERE ' + conditions.join(' AND ')) : '';
  params.push(safeLimit);
  const orderSql = ext
    ? 'ORDER BY ft.priority DESC, ft.due_at ASC, ft.id DESC'
    : `ORDER BY CASE ft.stage WHEN 'D7' THEN 3 WHEN 'D3' THEN 2 WHEN 'D1' THEN 1 ELSE 0 END DESC, ft.due_at ASC, ft.id DESC`;
  const extraCols = ext
    ? `, ft.priority, ft.completed_by, ft.overdue_reminder_at, a3.username AS completed_by_username`
    : `, 0 AS priority, NULL AS completed_by, NULL AS overdue_reminder_at, NULL AS completed_by_username`;
  const joinCompleted = ext ? 'LEFT JOIN admin_users a3 ON a3.id = ft.completed_by' : '';
  const [rows] = await pool.query(
    `SELECT ft.id, ft.user_id, ft.stage, ft.task_title, ft.task_content, ft.status, ft.due_at,
            ft.assigned_to, ft.completed_at, ft.created_at,
            u.username AS customer_username,
            a1.username AS assigned_to_username,
            a2.username AS created_by_username
            ${extraCols}
     FROM support_followup_tasks ft
     LEFT JOIN users u ON u.id = ft.user_id
     LEFT JOIN admin_users a1 ON a1.id = ft.assigned_to
     LEFT JOIN admin_users a2 ON a2.id = ft.created_by
     ${joinCompleted}
     ${whereClause}
     ${orderSql}
     LIMIT ?`,
    params
  );
  return rows.map(enrichFollowupRow);
}

async function updateFollowupTaskStatus({ taskId, status, updatedBy }) {
  const hasTable = await hasSupportFollowupTasksTable();
  if (!hasTable) {
    throw new Error('跟进任务表不存在，请先执行迁移');
  }
  const ext = await hasFollowupPhase5Columns();
  const safeStatus = String(status || '').trim().toLowerCase();
  if (!['pending', 'done', 'cancelled'].includes(safeStatus)) {
    throw new Error('跟进任务状态非法');
  }
  if (ext) {
    await pool.query(
      `UPDATE support_followup_tasks
       SET status = ?,
           completed_at = CASE WHEN ? = 'done' THEN NOW() ELSE NULL END,
           assigned_to = COALESCE(assigned_to, ?),
           completed_by = CASE WHEN ? = 'done' THEN ? ELSE NULL END
       WHERE id = ?`,
      [safeStatus, safeStatus, updatedBy, safeStatus, updatedBy, taskId]
    );
  } else {
    await pool.query(
      `UPDATE support_followup_tasks
       SET status = ?,
           completed_at = CASE WHEN ? = 'done' THEN NOW() ELSE NULL END,
           assigned_to = COALESCE(assigned_to, ?)
       WHERE id = ?`,
      [safeStatus, safeStatus, updatedBy, taskId]
    );
  }
  return { taskId: Number(taskId), status: safeStatus };
}

async function remindFollowupOverdue({ limit = 30 } = {}) {
  const hasTable = await hasSupportFollowupTasksTable();
  if (!hasTable) {
    throw new Error('跟进任务表不存在，请先执行迁移');
  }
  const ext = await hasFollowupPhase5Columns();
  if (!ext) {
    throw new Error('请先执行跟进任务 Phase5 迁移（逾期提醒依赖 priority/completed_by 等字段）');
  }
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 30));
  const [rows] = await pool.query(
    `SELECT id, user_id, stage, task_title, due_at
     FROM support_followup_tasks
     WHERE status = 'pending'
       AND due_at < NOW()
       AND (overdue_reminder_at IS NULL OR overdue_reminder_at < DATE_SUB(NOW(), INTERVAL 24 HOUR))
     ORDER BY due_at ASC
     LIMIT ?`,
    [safeLimit]
  );
  let notified = 0;
  for (const task of rows) {
    await createSupportNotification({
      userId: Number(task.user_id),
      eventType: 'followup_task_overdue',
      title: '跟进任务已逾期',
      content: `阶段 ${task.stage}：${task.task_title} 已逾期，请及时联系客户或协调处理（任务 #${task.id}）。`,
      relatedType: 'support_followup_task',
      relatedId: String(task.id)
    });
    await pool.query(
      `UPDATE support_followup_tasks SET overdue_reminder_at = NOW() WHERE id = ?`,
      [task.id]
    );
    notified += 1;
  }
  return { notified, taskIds: rows.map((r) => r.id) };
}

async function getConversionDashboard({ days = 7, includeTrend = false } = {}) {
  const safeDays = Math.max(1, Math.min(90, Number(days) || 7));
  const wantTrend =
    includeTrend === true ||
    includeTrend === 1 ||
    String(includeTrend || '').toLowerCase() === 'true' ||
    String(includeTrend || '') === '1';
  const [registerRows] = await pool.query(
    `SELECT COUNT(1) AS total
     FROM users
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [safeDays]
  );
  const [paidRows] = await pool.query(
    `SELECT COUNT(DISTINCT user_id) AS total
     FROM recharge_orders
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [safeDays]
  );
  const [orderRows] = await pool.query(
    `SELECT COUNT(1) AS order_count, COALESCE(SUM(pay_amount), 0) AS total_amount
     FROM recharge_orders
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [safeDays]
  );
  const [followupRows] = await pool.query(
    `SELECT
       COUNT(1) AS total_tasks,
       SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) AS done_tasks
     FROM support_followup_tasks
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [safeDays]
  ).catch(() => [[{ total_tasks: 0, done_tasks: 0 }]]);

  const registered = Number(registerRows[0]?.total || 0);
  const paidUsers = Number(paidRows[0]?.total || 0);
  const orderCount = Number(orderRows[0]?.order_count || 0);
  const totalAmount = Number(orderRows[0]?.total_amount || 0);
  const followupTotal = Number(followupRows[0]?.total_tasks || 0);
  const followupDone = Number(followupRows[0]?.done_tasks || 0);

  let dailyTrend = [];
  if (wantTrend) {
    const [uDay] = await pool.query(
      `SELECT DATE(created_at) AS d, COUNT(1) AS c
       FROM users
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY d`,
      [safeDays]
    );
    const [oDay] = await pool.query(
      `SELECT DATE(created_at) AS d,
              COUNT(DISTINCT user_id) AS paid_users,
              COUNT(1) AS order_count,
              COALESCE(SUM(pay_amount), 0) AS total_amount
       FROM recharge_orders
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY d`,
      [safeDays]
    );
    const map = new Map();
    for (const r of uDay) {
      const key = formatSqlDate(r.d);
      map.set(key, {
        date: key,
        registeredUsers: Number(r.c || 0),
        paidUsers: 0,
        orderCount: 0,
        totalAmount: 0
      });
    }
    for (const r of oDay) {
      const key = formatSqlDate(r.d);
      const cur = map.get(key) || {
        date: key,
        registeredUsers: 0,
        paidUsers: 0,
        orderCount: 0,
        totalAmount: 0
      };
      cur.paidUsers = Number(r.paid_users || 0);
      cur.orderCount = Number(r.order_count || 0);
      cur.totalAmount = Number(r.total_amount || 0);
      map.set(key, cur);
    }
    dailyTrend = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  return {
    days: safeDays,
    registeredUsers: registered,
    paidUsers,
    conversionRate: registered > 0 ? Number(((paidUsers / registered) * 100).toFixed(2)) : 0,
    orderCount,
    totalAmount,
    arppu: paidUsers > 0 ? Number((totalAmount / paidUsers).toFixed(2)) : 0,
    followupTotal,
    followupDone,
    followupDoneRate: followupTotal > 0 ? Number(((followupDone / followupTotal) * 100).toFixed(2)) : 0,
    dailyTrend
  };
}

async function getCsPerformanceDashboard({
  days = 7,
  adminId = null,
  viewerRole = '',
  viewerAdminId = 0
}) {
  const safeDays = Math.max(1, Math.min(90, Number(days) || 7));
  const vid = Number(viewerAdminId || 0);
  let filterId = adminId !== null && adminId !== undefined && String(adminId).trim() !== ''
    ? Number(adminId)
    : null;
  if (viewerRole === 'cs') {
    if (filterId && filterId !== vid) {
      throw new Error('无权查看其他客服数据');
    }
    filterId = vid;
  }
  const params = [safeDays, safeDays, safeDays];
  let whereAdmin = `au.status = 1 AND au.role IN ('cs', 'cs_lead')`;
  if (filterId > 0) {
    whereAdmin += ' AND au.id = ?';
    params.push(filterId);
  }
  const q = `
    SELECT
      au.id AS admin_id,
      au.username,
      (SELECT COUNT(1) FROM support_followup_tasks ft
        WHERE ft.completed_by = au.id AND ft.status = 'done'
          AND ft.completed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)) AS followup_done,
      (SELECT COUNT(1) FROM support_followup_tasks ft
        WHERE ft.assigned_to = au.id AND ft.status = 'pending') AS followup_pending,
      (SELECT COUNT(1) FROM support_followup_tasks ft
        WHERE ft.assigned_to = au.id AND ft.status = 'pending' AND ft.due_at < NOW()) AS followup_overdue,
      (SELECT COUNT(1) FROM support_recharge_requests sr
        WHERE sr.approved_by = au.id AND sr.status = 'approved'
          AND sr.processed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)) AS assist_approved,
      (SELECT COALESCE(SUM(p.amount), 0) FROM support_recharge_requests sr
        JOIN recharge_packages p ON p.id = sr.package_id
        WHERE sr.approved_by = au.id AND sr.status = 'approved'
          AND sr.processed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)) AS assist_amount
    FROM admin_users au
    WHERE ${whereAdmin}
    ORDER BY au.id ASC`;
  const [rows] = await pool.query(q, params);
  return {
    days: safeDays,
    rows: rows.map((r) => {
      const done = Number(r.followup_done || 0);
      const pending = Number(r.followup_pending || 0);
      const denom = done + pending;
      return {
        adminId: r.admin_id,
        username: r.username,
        followupDone: done,
        followupPending: pending,
        followupOverdue: Number(r.followup_overdue || 0),
        followupCompletionRate:
          denom > 0 ? Number(((done / denom) * 100).toFixed(2)) : done > 0 ? 100 : 0,
        assistApproved: Number(r.assist_approved || 0),
        assistAmount: Number(r.assist_amount || 0)
      };
    })
  };
}

module.exports = {
  adminLogin,
  listCustomers,
  getCustomerDetail,
  createAssistRecharge,
  approveAssistRecharge,
  rejectAssistRecharge,
  cancelAssistRecharge,
  sweepAssistRechargeTimeout,
  getAssistRejectReasonTemplates,
  getInterventionTemplates,
  getCustomerRiskProfile,
  fillInterventionTemplate,
  listAssistRechargeRequests,
  listSupportNotifications,
  getRechargeChannelOptions,
  listConfigItems,
  upsertConfigItem,
  listConfigHistory,
  rollbackConfig,
  listBusinessParams,
  upsertBusinessParam,
  listAuditLogs,
  listCustomerTags,
  createCustomerTag,
  bindCustomerTag,
  listSupportTickets,
  createSupportTicket,
  updateSupportTicketStatus,
  listTicketComments,
  createTicketComment,
  createFollowupTasks,
  listFollowupTasks,
  updateFollowupTaskStatus,
  remindFollowupOverdue,
  getConversionDashboard,
  getCsPerformanceDashboard
};
