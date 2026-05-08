const express = require('express');
const router = express.Router();
const controller = require('./recharge.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

router.get('/packages', authMiddleware, controller.getPackages);
router.get('/records', authMiddleware, controller.getRechargeRecords);
router.post('/create', authMiddleware, controller.createRecharge);

module.exports = router;
