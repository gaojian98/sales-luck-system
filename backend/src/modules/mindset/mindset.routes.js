const express = require('express');
const controller = require('./mindset.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

const router = express.Router();

router.get('/today', authMiddleware, controller.getTodayPractice);
router.post('/practice/complete', authMiddleware, controller.completePracticeStep);
router.get('/metrics', authMiddleware, controller.getGrowthMetrics);

module.exports = router;
