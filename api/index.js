require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dns = require('dns');

// DNS resolver fix for MongoDB SRV lookup
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection caching for Vercel Serverless Functions
let isConnected = false;

async function connectDb() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://anhd78428_db_user:4yTOlqW0Y9pgl3TN@cluster0.tvuehob.mongodb.net/toeic_flashcards?retryWrites=true&w=majority&appName=Cluster0';
  await mongoose.connect(mongoUri);
  isConnected = true;
}

// Middleware to ensure DB connection before handling API routes
app.use(async (req, res, next) => {
  try {
    await connectDb();
    next();
  } catch (err) {
    console.error('Vercel Serverless DB Error:', err);
    next(); // Continue so non-db fallback endpoints work if needed
  }
});

// API Routes
app.use('/api/auth', require('../routes/auth'));
app.use('/api/cards', require('../routes/cards'));
app.use('/api/progress', require('../routes/progress'));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    dbConnected: mongoose.connection.readyState === 1,
    timestamp: new Date()
  });
});

module.exports = app;
