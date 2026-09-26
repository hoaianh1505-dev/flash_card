const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  learnedCardIds: [{
    type: Number
  }],
  quizHistory: [{
    date: { type: Date, default: Date.now },
    score: Number,
    total: Number
  }],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('UserProgress', userProgressSchema);
