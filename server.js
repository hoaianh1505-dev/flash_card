require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dns = require('dns');

// Fix Windows DNS issues for MongoDB SRV lookup
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.log('DNS setup note:', e.message);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static frontend assets from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Connect MongoDB Atlas
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://anhd78428_db_user:4yTOlqW0Y9pgl3TN@cluster0.tvuehob.mongodb.net/toeic_flashcards?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('✅ Connected to MongoDB Atlas Cloud Database');

    // Auto seed default cards and admin account if empty
    const Card = require('./models/Card');
    const count = await Card.countDocuments();
    if (count === 0) {
      console.log('🌱 Database is empty. Auto-seeding initial cards & account...');
      try {
        const { exec } = require('child_process');
        exec('node seed.js', (err, stdout) => {
          if (err) console.error('Auto-seed error:', err);
          else console.log(stdout);
        });
      } catch (e) {
        console.error('Seed trigger error:', e);
      }
    }
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
  });

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cards', require('./routes/cards'));
app.use('/api/progress', require('./routes/progress'));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date()
  });
});

// Fallback to index.html for SPA frontend routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Flashcard TOEIC Server running on http://localhost:${PORT}`);
});
