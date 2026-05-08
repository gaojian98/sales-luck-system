const express = require('express');
const router = express.Router();
const controller = require('./wallet.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

router.get('/', authMiddleware, controller.getWallet);

module.exports = router;