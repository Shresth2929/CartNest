const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function getDatabaseConfig(databaseUrl = process.env.DATABASE_URL) {
  const defaultConfig = {
    port: 5432,
    user: 'postgres',
    password: 'postgrespassword',
    initialDatabase: 'cartnest',
  };

  if (!databaseUrl) {
    return defaultConfig;
  }

  const url = new URL(databaseUrl);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error('DATABASE_URL must use the PostgreSQL protocol.');
  }
  if (!['localhost', '127.0.0.1'].includes(url.hostname)) {
    throw new Error('The embedded PostgreSQL daemon only supports a local DATABASE_URL.');
  }

  const port = url.port ? Number(url.port) : defaultConfig.port;
  const initialDatabase = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
  if (!Number.isInteger(port) || port < 1 || port > 65535 || !initialDatabase) {
    throw new Error('DATABASE_URL must include a valid port and database name.');
  }

  return {
    port,
    user: decodeURIComponent(url.username || defaultConfig.user),
    password: decodeURIComponent(url.password || defaultConfig.password),
    initialDatabase,
  };
}

async function main() {
  const { default: EmbeddedPostgres } = await import('embedded-postgres');
  const dataDir = path.join(__dirname, '..', '.pgdata');
  const databaseConfig = getDatabaseConfig();
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    ...databaseConfig,
    persistent: true,
  });

  console.log(`[Postgres Daemon] Starting PostgreSQL on port ${databaseConfig.port}...`);
  await pg.start();
  console.log(`[Postgres Daemon] PostgreSQL 18 is RUNNING on port ${databaseConfig.port}.`);
  console.log(`[Postgres Daemon] Database: ${databaseConfig.initialDatabase}`);

  const shutdown = async () => {
    console.log('[Postgres Daemon] Shutting down PostgreSQL...');
    try {
      await pg.stop();
    } catch (e) {
      // Ignore
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Keep alive
  setInterval(() => {}, 60000);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[Postgres Daemon] Failed:', err.message);
    process.exit(1);
  });
}

module.exports = { getDatabaseConfig };
