const path = require('path');

async function test() {
  console.log('Testing embedded-postgres initialization...');
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

  try {
    console.log('Initialising database...');
    await pg.initialise();
    console.log('Starting database...');
    await pg.start();
    console.log('PostgreSQL is running on port 5432! Connection URL:');
    console.log('postgresql://postgres:postgrespassword@localhost:5432/cartnest?schema=public');
    await pg.stop();
    console.log('Database stopped cleanly.');
  } catch (err) {
    console.error('Error starting embedded-postgres:', err);
    process.exit(1);
  }
}

test();
