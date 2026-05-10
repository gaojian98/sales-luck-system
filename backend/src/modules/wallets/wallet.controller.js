const service = require('./wallet.service');

async function getWallet(req, res) {
  try {
    const data = await service.getWallet(req.user.userId);
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function giftEnergy(req, res) {
  try {
    const { toUsername, amount } = req.body || {};
    const result = await service.giftEnergy(req.user.userId, toUsername, amount);
    const wallet = await service.getWallet(req.user.userId);
    res.json({ success: true, data: { ...result, wallet } });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function redeemEnergyForCash(req, res) {
  try {
    const { energyAmount, paymentBindingId } = req.body || {};
    const result = await service.redeemEnergyForCash(
      req.user.userId,
      energyAmount,
      paymentBindingId
    );
    const wallet = await service.getWallet(req.user.userId);
    res.json({ success: true, data: { ...result, wallet } });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

module.exports = { getWallet, giftEnergy, redeemEnergyForCash };
