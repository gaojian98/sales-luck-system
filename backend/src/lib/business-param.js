const pool = require('../config/db');

/**
 * 读取 business_params；无记录或非法数字时返回 defaultValue。
 */
async function getBusinessParam(key, defaultValue) {
  const [rows] = await pool.query(
    `SELECT param_value FROM business_params WHERE param_key = ? LIMIT 1`,
    [key]
  );
  if (!rows.length) return defaultValue;
  const raw = rows[0].param_value;
  const n = Number(String(raw ?? '').trim());
  return Number.isFinite(n) ? n : defaultValue;
}

/**
 * 读取并取整，可选 min/max 夹紧。
 */
async function getBusinessParamInt(key, defaultValue, { min = null, max = null } = {}) {
  let v = Math.floor(await getBusinessParam(key, defaultValue));
  if (min != null) v = Math.max(min, v);
  if (max != null) v = Math.min(max, v);
  return v;
}

module.exports = {
  getBusinessParam,
  getBusinessParamInt
};
