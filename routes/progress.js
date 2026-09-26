const express = require('express');
const router = express.Router();
const UserProgress = require('../models/UserProgress');
const auth = require('../middleware/auth');

// GET /api/progress - Get learned card IDs and stats
router.get('/', auth, async (req, res) => {
  try {
    let progress = await UserProgress.findOne({ userId: req.user.id });
    if (!progress) {
      progress = await UserProgress.create({
        userId: req.user.id,
        learnedCardIds: [],
        quizHistory: []
      });
    }
    res.json({
      learnedCardIds: progress.learnedCardIds || [],
      quizHistory: progress.quizHistory || []
    });
  } catch (err) {
    console.error('Fetch progress error:', err);
    res.status(500).json({ error: 'Lỗi server khi tải tiến độ.' });
  }
});

// POST /api/progress/mark - Toggle card learned state
router.post('/mark', auth, async (req, res) => {
  try {
    const { cardId, learned } = req.body;

    if (cardId === undefined) {
      return res.status(400).json({ error: 'Thiếu cardId.' });
    }

    let progress = await UserProgress.findOne({ userId: req.user.id });
    if (!progress) {
      progress = new UserProgress({ userId: req.user.id, learnedCardIds: [] });
    }

    const numericId = parseInt(cardId);
    const existingIndex = progress.learnedCardIds.indexOf(numericId);

    if (learned && existingIndex === -1) {
      progress.learnedCardIds.push(numericId);
    } else if (!learned && existingIndex !== -1) {
      progress.learnedCardIds.splice(existingIndex, 1);
    }

    progress.updatedAt = Date.now();
    await progress.save();

    res.json({
      message: learned ? 'Đã đánh dấu thuộc!' : 'Đã đánh dấu chưa thuộc!',
      learnedCardIds: progress.learnedCardIds
    });
  } catch (err) {
    console.error('Mark progress error:', err);
    res.status(500).json({ error: 'Lỗi server khi lưu trạng thái học.' });
  }
});

// POST /api/progress/quiz - Record quiz result
router.post('/quiz', auth, async (req, res) => {
  try {
    const { score, total } = req.body;
    let progress = await UserProgress.findOne({ userId: req.user.id });
    if (!progress) {
      progress = new UserProgress({ userId: req.user.id, learnedCardIds: [] });
    }

    progress.quizHistory.push({
      date: new Date(),
      score: score || 0,
      total: total || 10
    });

    await progress.save();
    res.json({ message: 'Lưu kết quả trắc nghiệm thành công!', quizHistory: progress.quizHistory });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server khi lưu kết quả bài kiểm tra.' });
  }
});

module.exports = router;
