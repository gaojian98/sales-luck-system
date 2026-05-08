const express = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const walletRoutes = require('../modules/wallets/wallet.routes');
const lotteryRoutes = require('../modules/lottery/lottery.routes');
const rechargeRoutes = require('../modules/recharge/recharge.routes');
const communityRoutes = require('../modules/community/community.routes');
const growthRoutes = require('../modules/growth/growth.routes');
const mindsetRoutes = require('../modules/mindset/mindset.routes');
const publicRoutes = require('../modules/public/public.routes');
const adminRoutes = require('../modules/admin/admin.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/wallet', walletRoutes);
router.use('/lottery', lotteryRoutes);
router.use('/recharge', rechargeRoutes);
router.use('/community', communityRoutes);
router.use('/growth', growthRoutes);
router.use('/mindset', mindsetRoutes);
router.use('/public', publicRoutes);
router.use('/admin', adminRoutes);


module.exports = router;


