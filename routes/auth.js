const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const auth = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'toeic_flashcard_jwt_secret_key_2026_super_secure';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, name } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập đầy đủ tên đăng nhập, email và mật khẩu.' });
    }

    const existingUser = await User.findOne({
      $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Tên đăng nhập hoặc email đã tồn tại.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name || username
    });

    await user.save();

    await UserProgress.create({
      userId: user._id,
      learnedCardIds: [],
      quizHistory: []
    });

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Đăng ký thành công!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Lỗi hệ thống khi đăng ký tài khoản.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: 'Vui lòng nhập tài khoản và mật khẩu.' });
    }

    const search = usernameOrEmail.toLowerCase();
    const user = await User.findOne({
      $or: [{ username: search }, { email: search }]
    });

    if (!user) {
      return res.status(400).json({ error: 'Tài khoản hoặc mật khẩu không chính xác.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Tài khoản hoặc mật khẩu không chính xác.' });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Đăng nhập thành công!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Lỗi hệ thống khi đăng nhập.' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
