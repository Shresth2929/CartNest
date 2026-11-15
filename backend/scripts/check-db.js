require('dotenv').config();
const prisma = require('../src/config/prisma');

async function check() {
  try {
    await prisma.$queryRawUnsafe('SELECT 1');
    const userCount = await prisma.user.count();
    const productCount = await prisma.product.count();
    console.log(`PG_CONNECTED_OK: ${userCount} users, ${productCount} products found.`);
    process.exit(0);
  } catch (err) {
    console.error('PG_CONNECT_ERR:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

check();
