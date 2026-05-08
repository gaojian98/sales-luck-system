const jwt = require('jsonwebtoken');
require('dotenv').config();

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '未登录'
    });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // ⭐ 把用户信息挂到请求上

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: '登录已过期或无效'
    });
  }
}

module.exports = authMiddleware;
