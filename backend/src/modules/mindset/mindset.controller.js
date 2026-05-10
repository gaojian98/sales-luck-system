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

async function submitDailySelfEval(req, res) {
  try {
    const data = await service.submitDailySelfEval({
      userId: req.user.userId,
      score: req.body?.score,
      note: req.body?.note
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function submitWeeklyAssessment(req, res) {
  try {
    const data = await service.submitWeeklyAssessment({
      userId: req.user.userId,
      fearScore: req.body?.fearScore,
      inferiorityScore: req.body?.inferiorityScore,
      note: req.body?.note
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function getWeeklyGoal(req, res) {
  try {
    const data = await service.getWeeklyGoal(req.user.userId);
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function upsertWeeklyGoal(req, res) {
  try {
    const data = await service.upsertWeeklyGoal({
      userId: req.user.userId,
      goalTitle: req.body?.goalTitle,
      goalDescription: req.body?.goalDescription,
      splitTasks: req.body?.splitTasks,
      completionRate: req.body?.completionRate,
      status: req.body?.status,
      evidenceNote: req.body?.evidenceNote
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function fearIdentify(req, res) {
  try {
    const data = await service.fearIdentify({
      userId: req.user.userId,
      fearText: req.body?.fearText,
      triggerText: req.body?.triggerText
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function inferiorityRewrite(req, res) {
  try {
    const data = await service.inferiorityRewrite({
      userId: req.user.userId,
      negativeBelief: req.body?.negativeBelief
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function emotionalFirstAid(req, res) {
  try {
    const data = await service.emotionalFirstAid({
      userId: req.user.userId,
      distressScore: req.body?.distressScore,
      scenario: req.body?.scenario
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function listPsychEmpowermentLogs(req, res) {
  try {
    const data = await service.listPsychEmpowermentLogs(req.user.userId, req.query?.limit);
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function createGrowthEvidence(req, res) {
  try {
    const data = await service.createGrowthEvidence({
      userId: req.user.userId,
      title: req.body?.title,
      content: req.body?.content,
      sourceType: req.body?.sourceType
    });
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function listGrowthEvidence(req, res) {
  try {
    const data = await service.listGrowthEvidence(req.user.userId, req.query?.limit);
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function getIdentityProfile(req, res) {
  try {
    const data = await service.getIdentityProfile(req.user.userId);
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
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
