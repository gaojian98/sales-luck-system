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
const DEFAULT_ENERGY_KEYWORDS = [
  '稳住节奏',
  '自我确认',
  '先做一步',
  '允许不完美',
  '持续微进步'
];
const DEFAULT_COSMIC_MICRO_CONTENTS = [
  '你不是在和别人赛跑，而是在训练一个更稳定的自己。先完成一个最小行动，能量就会流动起来。',
  '恐惧不是停止的理由，而是你正在靠近升级边界的信号。今天保持行动，就在改写旧剧本。',
  '你值得拥有更好的自己。把注意力从“我行不行”转到“我先做一小步”。'
];
let hasMindsetExtendedColumnsCache = null;
let hasWeeklyGoalsTableCache = null;
let hasPsychEmpowermentTableCache = null;
let hasGrowthEvidenceTableCache = null;
let hasIdentityBadgeUnlockTableCache = null;

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

async function hasMindsetExtendedColumns() {
  if (hasMindsetExtendedColumnsCache !== null) {
    return hasMindsetExtendedColumnsCache;
  }
  const [rows] = await pool.query(
    `SELECT COUNT(1) AS total
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'user_daily_growth'
       AND COLUMN_NAME IN (
         'self_eval_score',
         'self_eval_note',
         'weekly_fear_score',
         'weekly_inferiority_score',
         'weekly_assessment_note',
         'weekly_assessed_at'
       )`
  );
  hasMindsetExtendedColumnsCache = Number(rows[0]?.total || 0) >= 6;
  return hasMindsetExtendedColumnsCache;
}

async function hasWeeklyGoalsTable() {
  if (hasWeeklyGoalsTableCache !== null) {
    return hasWeeklyGoalsTableCache;
  }
  const [rows] = await pool.query(
    `SELECT COUNT(1) AS total
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'user_weekly_goals'`
  );
  hasWeeklyGoalsTableCache = Number(rows[0]?.total || 0) > 0;
  return hasWeeklyGoalsTableCache;
}

async function hasPsychEmpowermentTable() {
  if (hasPsychEmpowermentTableCache !== null) {
    return hasPsychEmpowermentTableCache;
  }
  const [rows] = await pool.query(
    `SELECT COUNT(1) AS total
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'user_psych_empowerment_logs'`
  );
  hasPsychEmpowermentTableCache = Number(rows[0]?.total || 0) > 0;
  return hasPsychEmpowermentTableCache;
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

function getEvidencePhaseByDay(dayIndex) {
  const safeDay = Math.max(1, Number(dayIndex) || 1);
  if (safeDay <= 7) return { phase: 'day_1_7', phase_label: '第1-7天' };
  if (safeDay <= 21) return { phase: 'day_8_21', phase_label: '第8-21天' };
  return { phase: 'day_22_90', phase_label: '第22-90天' };
}

function getBadgeRules(metrics, weeklyGoal) {
  const streak = Number(metrics?.currentStreak || 0);
  return [
    { key: 'streak_7', title: '7天连胜', unlocked: streak >= 7, source_type: 'streak' },
    { key: 'streak_21', title: '21天重塑', unlocked: streak >= 21, source_type: 'streak' },
    { key: 'streak_90', title: '90天升级', unlocked: streak >= 90, source_type: 'streak' },
    { key: 'weekly_goal_done', title: '周目标达成', unlocked: Number(weeklyGoal?.completion_rate || 0) >= 100, source_type: 'weekly_goal' }
  ];
}

function clampScore(value, min = 0, max = 100) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function pickFearTag(text) {
  const s = String(text || '');
  if (/失败|做不到|不行/.test(s)) return '失败恐惧';
  if (/被拒|评价|看法|嘲笑/.test(s)) return '被评价恐惧';
  if (/钱|收入|成本|亏/.test(s)) return '资源匮乏恐惧';
  return '不确定性恐惧';
}

function rewriteBelief(text) {
  const src = String(text || '').trim();
  if (!src) {
    return {
      oldBelief: '',
      newBelief: '我可以先做一小步，再用结果修正自我认知。',
      confirmation: '我允许自己从不完美开始，行动会证明我在成长。'
    };
  }
  const cleaned = src.replace(/[。！!,.，]/g, '');
  return {
    oldBelief: src,
    newBelief: `过去我以为“${cleaned}”，现在我选择“即使不完美，我也能稳定行动并持续变好”。`,
    confirmation: '我不是在证明自己完美，而是在训练自己稳定。'
  };
}

function getWeekStartDate(inputDate = new Date()) {
  const d = new Date(inputDate);
  const day = d.getDay() || 7; // Monday=1...Sunday=7
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dayNum = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dayNum}`;
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
  const hasExt = await hasMindsetExtendedColumns();
  const extCols = hasExt
    ? `, self_eval_score, self_eval_note, weekly_fear_score, weekly_inferiority_score,
       weekly_assessment_note, weekly_assessed_at`
    : `, NULL AS self_eval_score, NULL AS self_eval_note, NULL AS weekly_fear_score,
       NULL AS weekly_inferiority_score, NULL AS weekly_assessment_note, NULL AS weekly_assessed_at`;

  const [rows] = await pool.query(
    `SELECT id, user_id, practice_date, affirmation_text, action_text, reflection_text,
            affirmation_done, action_done, reflection_done,
            self_confirmation_score, fear_interference_index, action_consistency_index
            ${extCols},
            updated_at
     FROM user_daily_growth
     WHERE user_id = ? AND practice_date = ?
     LIMIT 1`,
    [userId, today]
  );

  const affirmations = await getConfigArray('DEFAULT_DAILY_AFFIRMATIONS', DEFAULT_AFFIRMATIONS);
  const actionTemplates = await getConfigArray('DEFAULT_DAILY_ACTION_TEMPLATES', DEFAULT_ACTION_TEMPLATES);
  const keywords = await getConfigArray('DEFAULT_ENERGY_KEYWORDS', DEFAULT_ENERGY_KEYWORDS);
  const microContents = await getConfigArray('DEFAULT_COSMIC_MICRO_CONTENTS', DEFAULT_COSMIC_MICRO_CONTENTS);
  const now = new Date();
  const dayIdx = now.getDate() % Math.max(1, keywords.length);
  const contentIdx = now.getDay() % Math.max(1, microContents.length);

  return {
    today,
    practice: rows[0],
    suggestions: {
      affirmations,
      actionTemplates,
      energyKeyword: keywords[dayIdx] || keywords[0] || '稳住节奏',
      cosmicMicroContent: microContents[contentIdx] || microContents[0] || ''
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

async function submitDailySelfEval({
  userId,
  score,
  note = ''
}) {
  const safeScore = clampScore(score, 1, 100);
  if (safeScore === null) {
    throw new Error('每日自评分必须在 1-100');
  }
  const hasExt = await hasMindsetExtendedColumns();
  if (!hasExt) {
    throw new Error('请先执行 mindset 扩展迁移（自评字段）');
  }
  const today = getTodayDateString();
  await ensureTodayGrowthRow(userId, today);
  await pool.query(
    `UPDATE user_daily_growth
     SET self_eval_score = ?,
         self_eval_note = ?,
         self_confirmation_score = ROUND((self_confirmation_score * 0.7) + (? * 0.3))
     WHERE user_id = ? AND practice_date = ?`,
    [safeScore, String(note || '').trim() || null, safeScore, userId, today]
  );
  return getTodayPractice(userId);
}

async function submitWeeklyAssessment({
  userId,
  fearScore,
  inferiorityScore,
  note = ''
}) {
  const fear = clampScore(fearScore, 1, 100);
  const inferiority = clampScore(inferiorityScore, 1, 100);
  if (fear === null || inferiority === null) {
    throw new Error('每周测评分数必须在 1-100');
  }
  const hasExt = await hasMindsetExtendedColumns();
  if (!hasExt) {
    throw new Error('请先执行 mindset 扩展迁移（每周测评字段）');
  }
  const today = getTodayDateString();
  await ensureTodayGrowthRow(userId, today);
  const avgInterference = Math.round((fear + inferiority) / 2);
  await pool.query(
    `UPDATE user_daily_growth
     SET weekly_fear_score = ?,
         weekly_inferiority_score = ?,
         weekly_assessment_note = ?,
         weekly_assessed_at = NOW(),
         fear_interference_index = ROUND((fear_interference_index * 0.6) + (? * 0.4))
     WHERE user_id = ? AND practice_date = ?`,
    [fear, inferiority, String(note || '').trim() || null, avgInterference, userId, today]
  );
  return getTodayPractice(userId);
}

async function getWeeklyGoal(userId) {
  if (!(await hasWeeklyGoalsTable())) {
    return null;
  }
  const weekStart = getWeekStartDate(new Date());
  const [rows] = await pool.query(
    `SELECT id, user_id, week_start_date, goal_title, goal_description, split_tasks,
            status, completion_rate, evidence_note, created_at, updated_at
     FROM user_weekly_goals
     WHERE user_id = ? AND week_start_date = ?
     LIMIT 1`,
    [userId, weekStart]
  );
  if (rows.length === 0) {
    return {
      week_start_date: weekStart,
      goal_title: '',
      goal_description: '',
      split_tasks: [],
      status: 'pending',
      completion_rate: 0,
      evidence_note: ''
    };
  }
  const row = rows[0];
  return {
    ...row,
    split_tasks: parseJsonArray(row.split_tasks, [])
  };
}

async function upsertWeeklyGoal({
  userId,
  goalTitle = '',
  goalDescription = '',
  splitTasks = [],
  completionRate = 0,
  status = 'pending',
  evidenceNote = ''
}) {
  if (!(await hasWeeklyGoalsTable())) {
    throw new Error('请先执行周目标迁移（user_weekly_goals）');
  }
  const weekStart = getWeekStartDate(new Date());
  const title = String(goalTitle || '').trim();
  if (!title) {
    throw new Error('周目标标题不能为空');
  }
  const safeTasks = Array.isArray(splitTasks)
    ? splitTasks.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 8)
    : String(splitTasks || '')
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 8);
  const safeRate = Math.max(0, Math.min(100, Number(completionRate) || 0));
  const safeStatus = ['pending', 'in_progress', 'done'].includes(String(status || '').trim())
    ? String(status || '').trim()
    : safeRate >= 100
      ? 'done'
      : safeRate > 0
        ? 'in_progress'
        : 'pending';

  await pool.query(
    `INSERT INTO user_weekly_goals
      (user_id, week_start_date, goal_title, goal_description, split_tasks, status, completion_rate, evidence_note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
      goal_title = VALUES(goal_title),
      goal_description = VALUES(goal_description),
      split_tasks = VALUES(split_tasks),
      status = VALUES(status),
      completion_rate = VALUES(completion_rate),
      evidence_note = VALUES(evidence_note)`,
    [
      userId,
      weekStart,
      title,
      String(goalDescription || '').trim() || null,
      JSON.stringify(safeTasks),
      safeStatus,
      safeRate,
      String(evidenceNote || '').trim() || null
    ]
  );
  return getWeeklyGoal(userId);
}

async function createPsychEmpowermentLog({
  userId,
  toolType,
  inputText = '',
  outputText = '',
  distressBefore = null,
  distressAfter = null
}) {
  if (!(await hasPsychEmpowermentTable())) {
    return null;
  }
  const safeType = String(toolType || '').trim();
  if (!safeType) return null;
  await pool.query(
    `INSERT INTO user_psych_empowerment_logs
      (user_id, tool_type, input_text, output_text, distress_before, distress_after)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      userId,
      safeType,
      String(inputText || '').trim() || null,
      String(outputText || '').trim() || null,
      distressBefore === null ? null : Number(distressBefore),
      distressAfter === null ? null : Number(distressAfter)
    ]
  );
  return true;
}

async function fearIdentify({
  userId,
  fearText = '',
  triggerText = ''
}) {
  const fear = String(fearText || '').trim();
  if (!fear) {
    throw new Error('请先填写你在害怕什么');
  }
  const trigger = String(triggerText || '').trim();
  const tag = pickFearTag(fear + ' ' + trigger);
  const action = trigger
    ? `当“${trigger}”出现时，只做一个 10 分钟可完成动作。`
    : '现在立刻做一个 10 分钟可完成动作。';
  const result = {
    fearTag: tag,
    insight: `你当前最核心的是“${tag}”，这不代表你弱，而代表你正在靠近成长边界。`,
    reframe: '把“我会失败”改成“我先做一步，再用结果修正判断”。',
    tinyAction: action
  };
  await createPsychEmpowermentLog({
    userId,
    toolType: 'fear_identify',
    inputText: fear + (trigger ? ` | 触发:${trigger}` : ''),
    outputText: JSON.stringify(result)
  });
  return result;
}

async function inferiorityRewrite({
  userId,
  negativeBelief = ''
}) {
  const rewritten = rewriteBelief(negativeBelief);
  await createPsychEmpowermentLog({
    userId,
    toolType: 'inferiority_rewrite',
    inputText: rewritten.oldBelief,
    outputText: JSON.stringify(rewritten)
  });
  return rewritten;
}

async function emotionalFirstAid({
  userId,
  distressScore = 0,
  scenario = ''
}) {
  const before = clampScore(distressScore, 0, 100);
  if (before === null) {
    throw new Error('情绪强度需为 0-100');
  }
  const after = Math.max(0, before - 18);
  const scene = String(scenario || '').trim() || '当前压力场景';
  const result = {
    distressBefore: before,
    distressAfterSuggestion: after,
    steps: [
      `1）停止内耗 60 秒：在心里说“我正在经历${scene}，但我依然安全”。`,
      '2）呼吸 4 轮：吸气 4 秒，停 2 秒，呼气 6 秒。',
      '3）回到行动：写下现在就能做的最小动作，并在 3 分钟内开始。'
    ],
    closing: '先稳定，再行动；先行动，再增强信念。'
  };
  await createPsychEmpowermentLog({
    userId,
    toolType: 'emotional_first_aid',
    inputText: scene,
    outputText: JSON.stringify(result),
    distressBefore: before,
    distressAfter: after
  });
  return result;
}

async function listPsychEmpowermentLogs(userId, limit = 20) {
  if (!(await hasPsychEmpowermentTable())) {
    return [];
  }
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
  const [rows] = await pool.query(
    `SELECT id, tool_type, input_text, output_text, distress_before, distress_after, created_at
     FROM user_psych_empowerment_logs
     WHERE user_id = ?
     ORDER BY id DESC
     LIMIT ?`,
    [userId, safeLimit]
  );
  return rows;
}

async function createGrowthEvidence({
  userId,
  title = '',
  content = '',
  sourceType = 'manual'
}) {
  if (!(await hasGrowthEvidenceTable())) {
    throw new Error('请先执行身份升级迁移（user_growth_evidence）');
  }
  const safeTitle = String(title || '').trim();
  const safeContent = String(content || '').trim();
  if (!safeTitle) throw new Error('证据标题不能为空');
  if (!safeContent) throw new Error('证据内容不能为空');
  await pool.query(
    `INSERT INTO user_growth_evidence
      (user_id, title, content, source_type, evidence_date)
     VALUES (?, ?, ?, ?, CURDATE())`,
    [userId, safeTitle, safeContent, String(sourceType || 'manual').trim() || 'manual']
  );
  return true;
}

async function listGrowthEvidence(userId, limit = 50) {
  const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50));
  const rows = [];
  const [userRows] = await pool.query(
    `SELECT created_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [userId]
  );
  const userCreatedAt = userRows[0]?.created_at ? new Date(userRows[0].created_at) : new Date();
  const addPhase = (row) => {
    const evidenceAt = row.created_at || row.evidence_date;
    const evidenceTime = evidenceAt ? new Date(evidenceAt) : new Date();
    const diffMs = evidenceTime.getTime() - userCreatedAt.getTime();
    const dayIndex = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
    return {
      ...row,
      ...getEvidencePhaseByDay(dayIndex)
    };
  };
  if (await hasGrowthEvidenceTable()) {
    const [manualRows] = await pool.query(
      `SELECT id, title, content, source_type, evidence_date, created_at
       FROM user_growth_evidence
       WHERE user_id = ?
       ORDER BY id DESC
       LIMIT ?`,
      [userId, safeLimit]
    );
    rows.push(...manualRows.map((r) => addPhase({
      ...r,
      source_type: r.source_type || 'manual'
    })));
  }
  const weekly = await getWeeklyGoal(userId);
  if (weekly?.evidence_note) {
    rows.push(addPhase({
      id: 'weekly_goal',
      title: '周目标成长证据',
      content: weekly.evidence_note,
      source_type: 'weekly_goal',
      evidence_date: weekly.week_start_date,
      created_at: weekly.updated_at || null
    }));
  }
  const psych = await listPsychEmpowermentLogs(userId, 20);
  psych
    .filter((r) => r.distress_before != null && r.distress_after != null && Number(r.distress_before) > Number(r.distress_after))
    .slice(0, 5)
    .forEach((r) => {
      rows.push(addPhase({
        id: `psych_${r.id}`,
        title: `情绪恢复证据（${r.tool_type}）`,
        content: `情绪强度 ${r.distress_before} → ${r.distress_after}`,
        source_type: 'psych',
        evidence_date: r.created_at,
        created_at: r.created_at
      }));
    });
  return rows
    .sort((a, b) => new Date(b.created_at || b.evidence_date || 0).getTime() - new Date(a.created_at || a.evidence_date || 0).getTime())
    .slice(0, safeLimit);
}

async function getIdentityProfile(userId) {
  const metrics = await getGrowthMetrics(userId, 90);
  const latest = metrics.latest || {};
  const evidenceRows = await listGrowthEvidence(userId, 100);
  const weeklyGoal = await getWeeklyGoal(userId);
  const levelScore = Number(
    (
      (metrics.currentStreak || 0) * 1.2 +
      Number(latest.self_confirmation_score || 50) * 0.3 +
      Number(latest.action_consistency_index || 50) * 0.3 -
      Number(latest.fear_interference_index || 50) * 0.2 +
      evidenceRows.length * 2
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
  const nextLevel = levels.find((item) => item.level === currentLevel.level + 1) || null;
  const badgeRules = getBadgeRules(metrics, weeklyGoal);
  const unlockedBadgeKeys = badgeRules.filter((b) => b.unlocked).map((b) => b.key);
  if ((await hasIdentityBadgeUnlockTable()) && unlockedBadgeKeys.length > 0) {
    for (const key of unlockedBadgeKeys) {
      const rule = badgeRules.find((b) => b.key === key);
      await pool.query(
        `INSERT INTO user_identity_badge_unlocks
          (user_id, badge_key, badge_title, source_type)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          badge_title = VALUES(badge_title),
          source_type = VALUES(source_type)`,
        [userId, key, rule?.title || key, rule?.source_type || 'system']
      );
    }
  }
  let unlockRows = [];
  if (await hasIdentityBadgeUnlockTable()) {
    [unlockRows] = await pool.query(
      `SELECT badge_key, badge_title, source_type, unlocked_at
       FROM user_identity_badge_unlocks
       WHERE user_id = ?
       ORDER BY unlocked_at DESC, id DESC`,
      [userId]
    );
  }
  const unlockMap = new Map(unlockRows.map((r) => [r.badge_key, r]));
  const badges = badgeRules.map((rule) => {
    const row = unlockMap.get(rule.key);
    return {
      key: rule.key,
      title: rule.title,
      unlocked: rule.unlocked,
      unlockedAt: row?.unlocked_at || null,
      sourceType: row?.source_type || (rule.unlocked ? rule.source_type : null)
    };
  });
  return {
    level: currentLevel.level,
    levelName: currentLevel.name,
    levelScore,
    nextLevel: nextLevel ? { level: nextLevel.level, name: nextLevel.name, needScore: nextLevel.min } : null,
    badges,
    badgeUnlockLogs: unlockRows,
    evidenceCount: evidenceRows.length
  };
}

async function getGrowthMetrics(userId, days = 14) {
  const safeDays = Math.max(7, Math.min(90, Number(days) || 14));
  const hasExt = await hasMindsetExtendedColumns();
  const extCols = hasExt
    ? `, self_eval_score, weekly_fear_score, weekly_inferiority_score, weekly_assessed_at`
    : `, NULL AS self_eval_score, NULL AS weekly_fear_score, NULL AS weekly_inferiority_score, NULL AS weekly_assessed_at`;
  const [rows] = await pool.query(
    `SELECT practice_date, affirmation_done, action_done, reflection_done,
            self_confirmation_score, fear_interference_index, action_consistency_index
            ${extCols}
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
  const selfEvalRows = rows.filter((r) => Number(r.self_eval_score || 0) > 0);
  const selfEvalAvg = selfEvalRows.length > 0
    ? Number((selfEvalRows.reduce((sum, r) => sum + Number(r.self_eval_score || 0), 0) / selfEvalRows.length).toFixed(2))
    : null;
  const weeklyRows = rows
    .filter((r) => Number(r.weekly_fear_score || 0) > 0 && Number(r.weekly_inferiority_score || 0) > 0)
    .map((r) => ({
      practice_date: r.practice_date,
      fearScore: Number(r.weekly_fear_score || 0),
      inferiorityScore: Number(r.weekly_inferiority_score || 0),
      interferenceAvg: Number((((Number(r.weekly_fear_score || 0) + Number(r.weekly_inferiority_score || 0)) / 2).toFixed(2))),
      assessedAt: r.weekly_assessed_at || null
    }));
  return {
    days: safeDays,
    currentStreak,
    selfEvalAvg,
    latest,
    curve: rows.map((r) => ({
      ...r,
      self_confirmation_score: Number(r.self_confirmation_score || 0),
      action_consistency_index: Number(r.action_consistency_index || 0),
      fear_interference_index: Number(r.fear_interference_index || 0),
      self_eval_score: Number(r.self_eval_score || 0)
    })),
    weeklyAssessments: weeklyRows
  };
}

module.exports = {
  getTodayPractice,
  completePracticeStep,
  submitDailySelfEval,
  submitWeeklyAssessment,
  getWeeklyGoal,
  upsertWeeklyGoal,
  fearIdentify,
  inferiorityRewrite,
  emotionalFirstAid,
  listPsychEmpowermentLogs,
  createGrowthEvidence,
  listGrowthEvidence,
  getIdentityProfile,
  getGrowthMetrics
};
