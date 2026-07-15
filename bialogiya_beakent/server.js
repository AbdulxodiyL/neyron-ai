require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { connectDB } = require('./src/config/db');
const errorHandler = require('./src/middleware/error.middleware');

const app = express();

// Connect to PostgreSQL (Neon)
connectDB();

// Trust proxy (Render sits behind a reverse proxy)
app.set('trust proxy', 1);

// Security & utilities
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiters
const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500, message: 'Too many requests' });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: 'Too many login attempts' });
// Story audio / explainer video / realtime speaking all call paid AI/TTS APIs,
// so they get a tighter per-user-IP cap than the general API limiter.
const aiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60, message: 'Too many AI requests, please slow down' });

app.use('/api', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/speaking', aiLimiter);
app.use('/api/voice', aiLimiter);
app.use((req, res, next) => {
  if (req.path.includes('/ai/')) return aiLimiter(req, res, next);
  next();
});

// Routes
app.use('/api', require('./src/routes/index'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), service: 'Abdora AI Backend' });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Abdora AI Server running on http://localhost:${PORT}`);
  console.log(`📚 Environment: ${process.env.NODE_ENV}`);
  console.log(`🤖 OpenAI Model: ${process.env.OPENAI_MODEL || 'gpt-4o'}\n`);
});

module.exports = app;
