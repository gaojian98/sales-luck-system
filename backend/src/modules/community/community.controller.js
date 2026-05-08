const service = require('./community.service');

async function createPost(req, res) {
  try {
    const data = await service.createPost(req.user.userId, req.body.content);
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

async function listPosts(req, res) {
  try {
    const data = await service.listPosts(req.query.limit);
    res.json({ success: true, data });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
}

module.exports = { createPost, listPosts };
