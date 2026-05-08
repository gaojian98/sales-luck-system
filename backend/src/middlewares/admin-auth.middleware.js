const jwt = require('jsonwebtoken');
require('dotenv').config();

function adminAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '未登录后台'
    });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.adminId) {
      return res.status(403).json({
        success: false,
        message: '后台权限不足'
      });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: '后台登录已过期或无效'
    });
  }
}

function requireAdminRoles(...allowedRoles) {
  return function checkRole(req, res, next) {
    const role = req.admin?.role;
    if (!role || (allowedRoles.length > 0 && !allowedRoles.includes(role))) {
      return res.status(403).json({
        success: false,
        message: '角色权限不足'
      });
    }
    next();
  };
}

module.exports = { adminAuthMiddleware, requireAdminRoles };
