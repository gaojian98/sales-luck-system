const express = require('express');
const controller = require('./public.controller');

const router = express.Router();

router.get('/config', controller.getPublicConfig);

module.exports = router;
