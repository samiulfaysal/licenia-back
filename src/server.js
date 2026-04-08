require('dotenv').config();
const express = require('express');
const cors = require('cors');
const licenseRoutes = require('./routes/license');
const productRoutes = require('./routes/product');
const snippetRoutes = require('./routes/snippets');
const authRoutes = require('./routes/auth');
const { authMiddleware } = require('./middleware/authMiddleware');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(apiLimiter);

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * PUBLIC ROUTES
 */

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Documentation
app.get('/api', (req, res) => {
  res.json({
    name: 'License Management SaaS API',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        verify: 'POST /api/auth/verify'
      },
      licenses: {
        validate: 'POST /api/licenses/validate (public)',
        activate: 'POST /api/licenses/activate (public)',
        getAll: 'GET /api/licenses',
        getOne: 'GET /api/licenses/:id',
        generate: 'POST /api/licenses/generate',
        revoke: 'DELETE /api/licenses/:id',
        deactivateDomain: 'POST /api/licenses/:id/deactivate'
      },
      products: {
        getAll: 'GET /api/products',
        getOne: 'GET /api/products/:id',
        getStats: 'GET /api/products/:id/stats',
        create: 'POST /api/products',
        update: 'PUT /api/products/:id',
        delete: 'DELETE /api/products/:id'
      },
      snippets: {
        list: 'GET /api/snippets/list/:licenseId',
        preview: 'GET /api/snippets/preview?licenseId=X&language=php',
        download: 'GET /api/snippets?licenseId=X&language=php'
      }
    }
  });
});

/**
 * AUTHENTICATION ROUTES (Public)
 */
app.use('/api/auth', authRoutes);

/**
 * LICENSE VALIDATION ROUTES (Public)
 */
app.use('/api/licenses', licenseRoutes);

/**
 * SNIPPET ROUTES (Public)
 */
app.use('/api/snippets', snippetRoutes);

/**
 * PROTECTED ROUTES
 */
app.use('/api/products', productRoutes);

/**
 * 404 Handler
 */
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method
  });
});

/**
 * Error Handling Middleware
 */
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  
  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.details
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token'
    });
  }

  // Rate limit errors
  if (err.status === 429) {
    return res.status(429).json({
      error: 'Too many requests'
    });
  }

  // Default error
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║  License Management SaaS API Started   ║
  ║  🚀 Server running on port ${PORT}         ║
  ║  🔗 http://localhost:${PORT}             ║
  ║  📚 API Docs: http://localhost:${PORT}/api ║
  ╚═══════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

module.exports = app;
