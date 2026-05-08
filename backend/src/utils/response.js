function success(res, data = null, message = 'success') {
  return res.json({ success: true, message, data });
}

function fail(res, message = 'error', code = 400) {
  return res.status(code).json({ success: false, message });
}

module.exports = { success, fail };
