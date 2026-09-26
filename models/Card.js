const mongoose = require('mongoose');

const meaningSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: { type: String, default: '' },
  phonetic: { type: String, default: '' }
}, { _id: false });

const cardSchema = new mongoose.Schema({
  cardId: {
    type: Number,
    required: true,
    unique: true
  },
  word: {
    type: String,
    required: true,
    trim: true
  },
  meanings: [meaningSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Card', cardSchema);
