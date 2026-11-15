const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const prisma = require('./config/prisma');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/error.middleware');
const { setupSwagger } = require('./config/swagger');

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Setup Swagger UI Documentation at /api/docs
setupSwagger(app);

// Health Check Endpoint (Phase 1 verified)
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const userCount = await prisma.user.count();
    const productCount = await prisma.product.count();

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      metrics: {
        users: userCount,
        products: productCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
    });
  }
});

// Mount Main API Routes
app.use('/api', apiRoutes);

// Centralized 404 handler for unmatched routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error handler
app.use(errorHandler);

module.exports = app;
