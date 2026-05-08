const service = require('./recharge.service');

async function getPackages(req, res) {
  try {
    const data = await service.getPackages();
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function createRecharge(req, res) {
  try {
    const { packageId, payChannel } = req.body;
    const data = await service.createRecharge(req.user.userId, packageId, {
      payChannel: payChannel || 'wechat'
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function getRechargeRecords(req, res) {
  try {
    const data = await service.getRechargeRecords(req.user.userId);
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

module.exports = { getPackages, createRecharge, getRechargeRecords };
