const express = require('express');
const router = express.Router();
const controller = require('./growth.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

router.get('/trajectory', authMiddleware, controller.getTrajectory);

module.exports = router;
