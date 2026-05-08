const pool = require('../../config/db');

const DEFAULT_AFFIRMATIONS = [
  '我正在不断升级自己的能量级别',
  '我有力量超越恐惧与自卑',
  '我值得拥有更好的自己'
];

const DEFAULT_ACTION_TEMPLATES = [
  '完成一个最小行动',
  '向目标推进 15 分钟',
  '完成今天最关键的一步'
];

function parseJsonArray(text, fallback) {
  try {
    const parsed = JSON.parse(String(text || '[]'));
    const valid = Array.isArray(parsed)
      ? parsed.map((item) => String(item || '').trim()).filter(Boolean)
      : [];
    return valid.length > 0 ? valid : fallback;
  } catch (err) {
    return fallback;
  }
}

async function getConfigArray(key, fallback) {
  const [rows] = await pool.query(
    `SELECT config_value
     FROM system_configs
     WHERE config_key = ?
     LIMIT 1`,
    [key]
  );
  if (rows.length === 0) return fallback;
  return parseJsonArray(rows[0].config_value, fallback);
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function ensureTodayGrowthRow(userId, practiceDate) {
  await pool.query(
    `INSERT INTO user_daily_growth (user_id, practice_date)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`,
    [userId, practiceDate]
  );
}

async function getTodayPractice(userId) {
  const today = getTodayDateString();
  await ensureTodayGrowthRow(userId, today);

  const [rows] = await pool.query(
    `SELECT id, user_id, practice_date, affirmation_text, action_text, reflection_text,
            affirmation_done, action_done, reflection_done,
            self_confirmation_score, fear_interference_index, action_consistency_index,
            updated_at
     FROM user_daily_growth
     WHERE user_id = ? AND practice_date = ?
     LIMIT 1`,
    [userId, today]
  );

  const affirmations = await getConfigArray('DEFAULT_DAILY_AFFIRMATIONS', DEFAULT_AFFIRMATIONS);
  const actionTemplates = await getConfigArray('DEFAULT_DAILY_ACTION_TEMPLATES', DEFAULT_ACTION_TEMPLATES);

  return {
    today,
    practice: rows[0],
    suggestions: {
      affirmations,
      actionTemplates
    }
  };
}

async function completePracticeStep({
  userId,
  step,
  text = ''
}) {
  const allowed = new Set(['affirmation', 'action', 'reflection']);
  const safeStep = String(step || '').trim().toLowerCase();
  if (!allowed.has(safeStep)) {
    throw new Error('练习步骤非法');
  }

  const today = getTodayDateString();
  await ensureTodayGrowthRow(userId, today);

  const columnByStep = {
    affirmation: { done: 'affirmation_done', text: 'affirmation_text' },
    action: { done: 'action_done', text: 'action_text' },
    reflection: { done: 'reflection_done', text: 'reflection_text' }
  };
  const target = columnByStep[safeStep];

  await pool.query(
    `UPDATE user_daily_growth
     SET ${target.done} = 1,
         ${target.text} = ?,
         action_consistency_index = CASE
           WHEN ? = 'action' THEN LEAST(100, action_consistency_index + 5)
           ELSE action_consistency_index
         END,
         self_confirmation_score = CASE
           WHEN ? = 'affirmation' THEN LEAST(100, self_confirmation_score + 4)
           WHEN ? = 'reflection' THEN LEAST(100, self_confirmation_score + 3)
           ELSE self_confirmation_score
         END,
         fear_interference_index = CASE
           WHEN ? = 'reflection' THEN GREATEST(0, fear_interference_index - 3)
           ELSE fear_interference_index
         END
     WHERE user_id = ? AND practice_date = ?`,
    [
      String(text || '').trim() || null,
      safeStep,
      safeStep,
      safeStep,
      safeStep,
      userId,
      today
    ]
  );

  return getTodayPractice(userId);
}

async function getGrowthMetrics(userId, days = 14) {
  const safeDays = Math.max(7, Math.min(90, Number(days) || 14));
  const [rows] = await pool.query(
    `SELECT practice_date, affirmation_done, action_done, reflection_done,
            self_confirmation_score, fear_interference_index, action_consistency_index
     FROM user_daily_growth
     WHERE user_id = ?
       AND practice_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     ORDER BY practice_date ASC`,
    [userId, safeDays]
  );

  let currentStreak = 0;
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const row = rows[i];
    if (Number(row.action_done) === 1) {
      currentStreak += 1;
    } else {
      break;
    }
  }

  const latest = rows[rows.length - 1] || null;
  return {
    days: safeDays,
    currentStreak,
    latest,
    curve: rows
  };
}

module.exports = {
  getTodayPractice,
  completePracticeStep,
  getGrowthMetrics
};
