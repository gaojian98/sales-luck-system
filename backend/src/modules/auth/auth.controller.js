const service = require('./auth.service');

async function register(req, res) {
  try {
    const data = await service.register(req.body);
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function login(req, res) {
  try {
    const data = await service.login(req.body);
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

module.exports = { register, login };
