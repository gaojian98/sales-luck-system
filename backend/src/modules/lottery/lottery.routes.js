const express = require('express');
const router = express.Router();
const controller = require('./lottery.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

router.post('/spin', authMiddleware, controller.spin);
router.get('/records', authMiddleware, controller.records);

module.exports = router;
