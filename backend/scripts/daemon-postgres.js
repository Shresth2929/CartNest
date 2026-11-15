const path = require('path');

async function main() {
  const { default: EmbeddedPostgres } = await import('embedded-postgres');
  const dataDir = path.join(__dirname, '..', '.pgdata');
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    port: 5432,
    user: 'postgres',
    password: 'postgrespassword',
    initialDatabase: 'cartnest',
    persistent: true,
  });

  console.log('[Postgres Daemon] Starting PostgreSQL on port 5432...');
  await pg.start();
  console.log('[Postgres Daemon] PostgreSQL 18 is RUNNING on port 5432.');
  console.log('[Postgres Daemon] Database: cartnest, User: postgres');

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

main().catch((err) => {
  console.error('[Postgres Daemon] Failed:', err);
  process.exit(1);
});
