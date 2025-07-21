const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.API_PORT || 3001;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// API Key Authentication Middleware
const authenticateApiKey = async (req, res, next) => {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  
  if (!apiKey) {
    return res.status(401).json({
      error: {
        code: 'MISSING_API_KEY',
        message: 'API key is required',
        timestamp: new Date().toISOString()
      }
    });
  }

  try {
    // TODO: Implement proper API key validation
    // For now, we'll use a simple check against environment variable
    if (apiKey !== process.env.API_KEY) {
      return res.status(401).json({
        error: {
          code: 'INVALID_API_KEY',
          message: 'Invalid API key',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    req.apiKey = apiKey;
    next();
  } catch (error) {
    console.error('API key validation error:', error);
    res.status(500).json({
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Authentication service error',
        timestamp: new Date().toISOString()
      }
    });
  }
};

// Apply authentication to all API routes
app.use('/api/', authenticateApiKey);

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Import route modules
const guildRoutes = require('./routes/guilds');
const actionItemRoutes = require('./routes/action-items');
const sweepRoutes = require('./routes/sweep');
const analyticsRoutes = require('./routes/analytics');

// Mount routes
app.use('/api/guilds', guildRoutes);
app.use('/api/action-items', actionItemRoutes);
app.use('/api/sweep', sweepRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'ENDPOINT_NOT_FOUND',
      message: `Endpoint ${req.method} ${req.originalUrl} not found`,
      timestamp: new Date().toISOString()
    }
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('API Error:', error);
  
  res.status(error.status || 500).json({
    error: {
      code: error.code || 'INTERNAL_SERVER_ERROR',
      message: error.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      request_id: req.headers['x-request-id'] || 'unknown'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = { app, pool }; 