const service = require('./wallet.service');

async function getWallet(req, res) {
  try {
    const data = await service.getWallet(req.user.userId);
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

module.exports = { getWallet };
