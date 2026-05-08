const pool = require('../../config/db');

async function createPost(userId, content) {
  const text = (content || '').trim();
  if (!text) {
    throw new Error('分享内容不能为空');
  }

  if (text.length > 500) {
    throw new Error('分享内容不能超过500字');
  }

  const [result] = await pool.query(
    `INSERT INTO community_posts (user_id, content)
     VALUES (?, ?)`,
    [userId, text]
  );

  const [rows] = await pool.query(
    `SELECT cp.id, cp.content, cp.created_at, u.username
     FROM community_posts cp
     LEFT JOIN users u ON u.id = cp.user_id
     WHERE cp.id = ?
     LIMIT 1`,
    [result.insertId]
  );

  return rows[0];
}

async function listPosts(limit = 20) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 100));
  const [rows] = await pool.query(
    `SELECT cp.id, cp.content, cp.created_at, u.username
     FROM community_posts cp
     LEFT JOIN users u ON u.id = cp.user_id
     ORDER BY cp.id DESC
     LIMIT ?`,
    [safeLimit]
  );

  return rows;
}

module.exports = { createPost, listPosts };
