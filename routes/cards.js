const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Card = require('../models/Card');
const auth = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'toeic_flashcard_jwt_secret_key_2026_super_secure';

// GET /api/cards - Get global 1205 cards + user's own private custom cards
router.get('/', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.query.token;
    let userId = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (e) {}
    }

    const { search } = req.query;

    // Show global cards (createdBy: null) AND user's own custom cards
    let userFilter = {
      $or: [
        { createdBy: null },
        ...(userId ? [{ createdBy: userId }] : [])
      ]
    };

    let query = userFilter;

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query = {
        $and: [
          userFilter,
          {
            $or: [
              { word: searchRegex },
              { 'meanings.text': searchRegex }
            ]
          }
        ]
      };
    }

    const cards = await Card.find(query).sort({ cardId: 1 });
    res.json({ count: cards.length, cards });
  } catch (err) {
    console.error('Fetch cards error:', err);
    res.status(500).json({ error: 'Không thể lấy danh sách từ vựng từ server.' });
  }
});

// POST /api/cards - Add or Merge card for current user
router.post('/', auth, async (req, res) => {
  try {
    let { word, meaning, meanings } = req.body;

    if (!word || !word.trim()) {
      return res.status(400).json({ error: 'Từ tiếng Anh không được để trống.' });
    }

    const cleanWord = word.trim();
    let newMeaningText = '';

    if (typeof meaning === 'string' && meaning.trim()) {
      newMeaningText = meaning.trim();
    } else if (Array.isArray(meanings) && meanings[0]) {
      newMeaningText = typeof meanings[0] === 'string' ? meanings[0].trim() : (meanings[0].text || '').trim();
    }

    if (!newMeaningText) {
      return res.status(400).json({ error: 'Nghĩa tiếng Việt không được để trống.' });
    }

    // Check if word already exists in user's deck or global deck
    const escapedWord = cleanWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let existingCard = await Card.findOne({
      word: new RegExp(`^${escapedWord}$`, 'i'),
      $or: [{ createdBy: null }, { createdBy: req.user.id }]
    });

    if (existingCard) {
      // Word exists -> Merge / Append new meaning to card
      const alreadyHasMeaning = existingCard.meanings.some(
        m => m.text.toLowerCase() === newMeaningText.toLowerCase()
      );

      if (!alreadyHasMeaning) {
        existingCard.meanings.push({ text: newMeaningText, type: '', phonetic: '' });
        await existingCard.save();
      }

      return res.json({
        message: `Đã gộp thêm 1 nghĩa mới vào từ "${existingCard.word}"!`,
        card: existingCard,
        merged: true
      });
    }

    // Create new custom card owned by current user
    const maxCard = await Card.findOne().sort({ cardId: -1 });
    const newCardId = maxCard && maxCard.cardId ? maxCard.cardId + 1 : 1;

    const newCard = new Card({
      cardId: newCardId,
      word: cleanWord,
      meanings: [{ text: newMeaningText, type: '', phonetic: '' }],
      createdBy: req.user.id
    });

    await newCard.save();
    res.status(201).json({
      message: `Thêm từ mới "${newCard.word}" vào kho từ riêng thành công!`,
      card: newCard,
      merged: false
    });
  } catch (err) {
    console.error('Add/Merge card error:', err);
    res.status(500).json({ error: 'Lỗi server khi thêm hoặc gộp từ.' });
  }
});

// PUT /api/cards/:cardId - Update card
router.put('/:cardId', auth, async (req, res) => {
  try {
    const { cardId } = req.params;
    const { word, meaning, meanings } = req.body;

    const card = await Card.findOne({
      cardId: parseInt(cardId),
      $or: [{ createdBy: null }, { createdBy: req.user.id }]
    });

    if (!card) {
      return res.status(404).json({ error: 'Không tìm thấy thẻ từ vựng hoặc không có quyền chỉnh sửa.' });
    }

    if (word && word.trim()) card.word = word.trim();

    if (typeof meaning === 'string' && meaning.trim()) {
      card.meanings = [{ text: meaning.trim(), type: '', phonetic: '' }];
    } else if (Array.isArray(meanings)) {
      card.meanings = meanings.map(m => ({
        text: typeof m === 'string' ? m : m.text || '',
        type: m.type || '',
        phonetic: m.phonetic || ''
      }));
    }

    await card.save();
    res.json({ message: 'Cập nhật từ thành công!', card });
  } catch (err) {
    console.error('Update card error:', err);
    res.status(500).json({ error: 'Lỗi server khi cập nhật từ.' });
  }
});

// DELETE /api/cards/:cardId - Delete custom card
router.delete('/:cardId', auth, async (req, res) => {
  try {
    const { cardId } = req.params;
    // Only allow deleting user's own created cards or if admin
    const deleted = await Card.findOneAndDelete({
      cardId: parseInt(cardId),
      $or: [{ createdBy: req.user.id }, ...(req.user.role === 'admin' ? [{}] : [])]
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Không tìm thấy thẻ hoặc không có quyền xoá thẻ này.' });
    }

    res.json({ message: 'Đã xoá thẻ từ vựng thành công!', cardId: parseInt(cardId) });
  } catch (err) {
    console.error('Delete card error:', err);
    res.status(500).json({ error: 'Lỗi server khi xoá thẻ.' });
  }
});

module.exports = router;
