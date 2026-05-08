const service = require('./lottery.service');

async function spin(req, res) {
  try {
    const data = await service.spin(req.user.userId);
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function records(req, res) {
  try {
    const data = await service.records(req.user.userId);
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

module.exports = { spin, records };
