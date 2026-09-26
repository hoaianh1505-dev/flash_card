const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '') || req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'Không tìm thấy token xác thực.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'toeic_flashcard_jwt_secret_key_2026_super_secure');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
};
