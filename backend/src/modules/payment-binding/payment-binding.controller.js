const service = require('./payment-binding.service');

async function listBindings(req, res) {
  try {
    const data = await service.listBindings(req.user.userId);
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function createBinding(req, res) {
  try {
    await service.createBinding({
      userId: req.user.userId,
      channelType: req.body?.channelType,
      label: req.body?.label,
      accountMask: req.body?.accountMask,
      accountRef: req.body?.accountRef,
      extraNote: req.body?.extraNote,
      setDefault: Boolean(req.body?.setDefault)
    });
    const data = await service.listBindings(req.user.userId);
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function setDefaultBinding(req, res) {
  try {
    await service.setDefaultBinding(req.user.userId, req.params.id);
    const data = await service.listBindings(req.user.userId);
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function deleteBinding(req, res) {
  try {
    await service.deleteBinding(req.user.userId, req.params.id);
    const data = await service.listBindings(req.user.userId);
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

module.exports = {
  listBindings,
  createBinding,
  setDefaultBinding,
  deleteBinding
};
