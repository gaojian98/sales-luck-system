const pool = require('../../config/db');

async function writeAdminAuditLog({
  adminId,
  action,
  targetType,
  targetId = null,
  detail = null,
  req = null
}) {
  const ipAddress =
    req?.headers?.['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
    req?.socket?.remoteAddress ||
    null;

  await pool.query(
    `INSERT INTO admin_audit_logs
      (admin_user_id, action, target_type, target_id, detail, ip_address)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [adminId, action, targetType, targetId, detail, ipAddress]
  );
}

module.exports = { writeAdminAuditLog };
