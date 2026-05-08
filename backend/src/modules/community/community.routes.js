const express = require('express');
const router = express.Router();
const controller = require('./community.controller');
const authMiddleware = require('../../middlewares/auth.middleware');

router.get('/posts', authMiddleware, controller.listPosts);
router.post('/posts', authMiddleware, controller.createPost);

module.exports = router;
