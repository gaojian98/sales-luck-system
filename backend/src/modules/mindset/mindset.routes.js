const express = require('express');
const controller = require('./mindset.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

const router = express.Router();

router.get('/today', authMiddleware, controller.getTodayPractice);
router.post('/practice/complete', authMiddleware, controller.completePracticeStep);
router.post('/self-eval', authMiddleware, controller.submitDailySelfEval);
router.post('/weekly-assessment', authMiddleware, controller.submitWeeklyAssessment);
router.get('/weekly-goal', authMiddleware, controller.getWeeklyGoal);
router.post('/weekly-goal', authMiddleware, controller.upsertWeeklyGoal);
router.post('/psych/fear-identify', authMiddleware, controller.fearIdentify);
router.post('/psych/inferiority-rewrite', authMiddleware, controller.inferiorityRewrite);
router.post('/psych/first-aid', authMiddleware, controller.emotionalFirstAid);
router.get('/psych/history', authMiddleware, controller.listPsychEmpowermentLogs);
router.post('/identity/evidence', authMiddleware, controller.createGrowthEvidence);
router.get('/identity/evidence', authMiddleware, controller.listGrowthEvidence);
router.get('/identity/profile', authMiddleware, controller.getIdentityProfile);
router.get('/metrics', authMiddleware, controller.getGrowthMetrics);

module.exports = router;
