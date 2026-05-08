const service = require('./growth.service');

async function getTrajectory(req, res) {
  try {
    const data = await service.getTrajectory(req.user.userId);
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

module.exports = { getTrajectory };
