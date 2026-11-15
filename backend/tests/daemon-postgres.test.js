const { getDatabaseConfig } = require('../scripts/daemon-postgres');

describe('getDatabaseConfig', () => {
  it('uses the port, database, and credentials from a local DATABASE_URL', () => {
    expect(getDatabaseConfig('postgresql://cartuser:p%40ss@localhost:5433/cartnest?schema=public')).toEqual({
      port: 5433,
      user: 'cartuser',
      password: 'p@ss',
      initialDatabase: 'cartnest',
    });
  });

  it('keeps the existing local defaults when DATABASE_URL is absent', () => {
    expect(getDatabaseConfig('')).toEqual({
      port: 5432,
      user: 'postgres',
      password: 'postgrespassword',
      initialDatabase: 'cartnest',
    });
  });

  it('rejects a DATABASE_URL targeting a remote host', () => {
    expect(() => getDatabaseConfig('postgresql://cartuser:password@db.example.com:5432/cartnest'))
      .toThrow('The embedded PostgreSQL daemon only supports a local DATABASE_URL.');
  });
});
