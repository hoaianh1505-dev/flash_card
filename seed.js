require('dotenv').config();
const dns = require('dns');
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const Card = require('./models/Card');
const User = require('./models/User');
const UserProgress = require('./models/UserProgress');

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI environment variable is missing.');
      process.exit(1);
    }

    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected successfully!');

    // Seed Admin Account (username: admin, password: 123456)
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || '123456';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@toeic.com';

    let adminUser = await User.findOne({
      $or: [{ username: adminUsername }, { email: adminEmail }]
    });

    if (!adminUser) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      adminUser = await User.create({
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword,
        name: 'Quản trị viên (Admin)',
        role: 'admin'
      });
      console.log(`✅ Created admin account: ${adminUsername}`);
    } else {
      // Ensure password is updated to 123456
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      adminUser.password = hashedPassword;
      adminUser.role = 'admin';
      await adminUser.save();
      console.log(`✅ Updated password for account: ${adminUser.username}`);
    }

    // Ensure UserProgress entry exists
    let progress = await UserProgress.findOne({ userId: adminUser._id });
    if (!progress) {
      await UserProgress.create({
        userId: adminUser._id,
        learnedCardIds: [],
        quizHistory: []
      });
      console.log(`✅ Created progress entry for user: ${adminUser.username}`);
    }

    // Seed Flashcards if empty
    const cardCount = await Card.countDocuments();
    if (cardCount === 0) {
      const cardsFile = path.join(__dirname, 'seed_cards.json');
      if (fs.existsSync(cardsFile)) {
        const rawCards = JSON.parse(fs.readFileSync(cardsFile, 'utf8'));
        console.log(`Seeding ${rawCards.length} flashcards into MongoDB...`);

        const formattedCards = rawCards.map(c => ({
          cardId: c.id,
          word: c.word,
          meanings: c.meanings || []
        }));

        await Card.insertMany(formattedCards);
        console.log(`✅ Successfully seeded ${formattedCards.length} flashcards!`);
      }
    } else {
      console.log(`ℹ️ Database already contains ${cardCount} cards.`);
    }

    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
}

seed();
