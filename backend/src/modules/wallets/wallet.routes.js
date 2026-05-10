const express = require('express');
const router = express.Router();
const controller = require('./wallet.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

router.get('/', authMiddleware, controller.getWallet);
router.post('/energy/gift', authMiddleware, controller.giftEnergy);
router.post('/energy/redeem-cash', authMiddleware, controller.redeemEnergyForCash);

module.exports = router;