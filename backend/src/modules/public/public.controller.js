const env = require('../../config/env');
const pool = require('../../config/db');

async function getPublicConfig(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT config_key, config_value
       FROM system_configs
       WHERE config_key IN ('LIVE_QA_URL')
       ORDER BY id DESC`
    );

    const configMap = rows.reduce((acc, item) => {
      acc[item.config_key] = item.config_value;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        liveQaUrl: configMap.LIVE_QA_URL || env.liveQaUrl
      }
    });
  } catch (err) {
    res.json({
      success: true,
      data: {
        liveQaUrl: env.liveQaUrl
      }
    });
  }
}

module.exports = { getPublicConfig };
