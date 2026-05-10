const express = require('express');
const authMiddleware = require('../../middlewares/auth.middleware');
const controller = require('./payment-binding.controller');

const router = express.Router();

router.get('/', authMiddleware, controller.listBindings);
router.post('/', authMiddleware, controller.createBinding);
router.patch('/:id/default', authMiddleware, controller.setDefaultBinding);
router.delete('/:id', authMiddleware, controller.deleteBinding);

module.exports = router;
