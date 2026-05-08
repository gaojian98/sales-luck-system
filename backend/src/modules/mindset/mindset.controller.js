const service = require('./mindset.service');

async function getTodayPractice(req, res) {
  try {
    const data = await service.getTodayPractice(req.user.userId);
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function completePracticeStep(req, res) {
  try {
    const data = await service.completePracticeStep({
      userId: req.user.userId,
      step: req.body?.step,
      text: req.body?.text
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function getGrowthMetrics(req, res) {
  try {
    const data = await service.getGrowthMetrics(req.user.userId, req.query?.days);
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

module.exports = {
  getTodayPractice,
  completePracticeStep,
  getGrowthMetrics
};
