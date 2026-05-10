const env = require('../../config/env');
const pool = require('../../config/db');
const { getBindableChannelMeta } = require('../payment-binding/payment-binding.service');
const { getBusinessParamInt } = require('../../lib/business-param');

function filterBindableOptions(rawList) {
  const bindable = new Set(getBindableChannelMeta().map((c) => c.value));
  return rawList.filter((item) => item && bindable.has(String(item.value || '').toLowerCase()));
}

async function getPublicConfig(req, res) {
  const fallbackChannels = getBindableChannelMeta();
  try {
    const [rows] = await pool.query(
      `SELECT config_key, config_value
       FROM system_configs
       WHERE config_key IN ('LIVE_QA_URL', 'RECHARGE_CHANNEL_OPTIONS')
       ORDER BY id DESC`
    );

    const configMap = rows.reduce((acc, item) => {
      acc[item.config_key] = item.config_value;
      return acc;
    }, {});

    let payChannelOptions = fallbackChannels;
    try {
      const raw = configMap.RECHARGE_CHANNEL_OPTIONS;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = filterBindableOptions(parsed);
          payChannelOptions = filtered.length > 0 ? filtered : fallbackChannels;
        }
      }
    } catch (e) {
      payChannelOptions = fallbackChannels;
    }

    const dailyMaxSpin = await getBusinessParamInt('DAILY_MAX_SPIN', 20, { min: 1, max: 999 });
    const lotterySpinPointsCost = await getBusinessParamInt('LOTTERY_SPIN_POINTS_COST', 22, { min: 1, max: 9999 });
    const lotteryEnergyBoostCost = await getBusinessParamInt('LOTTERY_ENERGY_BOOST_COST', 1, { min: 1, max: 100 });

    res.json({
      success: true,
      data: {
        liveQaUrl: configMap.LIVE_QA_URL || env.liveQaUrl,
        payChannelOptions,
        dailyMaxSpin,
        lotterySpinPointsCost,
        lotteryEnergyBoostCost
      }
    });
  } catch (err) {
    res.json({
      success: true,
      data: {
        liveQaUrl: env.liveQaUrl,
        payChannelOptions: fallbackChannels,
        dailyMaxSpin: 20,
        lotterySpinPointsCost: 22,
        lotteryEnergyBoostCost: 1
      }
    });
  }
}

module.exports = { getPublicConfig };
