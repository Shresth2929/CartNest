require('dotenv').config();
const app = require('./app');
const prisma = require('./config/prisma');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Check DB connection on startup
    await prisma.$connect();
    console.log('✅ PostgreSQL connected successfully via Prisma');

    const server = app.listen(PORT, () => {
      console.log(`🚀 CartNest Backend running on http://localhost:${PORT}`);
    });

    const gracefulShutdown = async () => {
      console.log('Shutting down server gracefully...');
      server.close(async () => {
        await prisma.$disconnect();
        console.log('Database disconnected.');
        process.exit(0);
      });
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
