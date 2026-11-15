const request = require('supertest');
const app = require('../src/app');
const { clientOrigins, parseClientOrigins } = require('../src/config/env');

describe('CORS origin policy', () => {
  it('accepts comma-separated exact HTTPS origins and deduplicates them', () => {
    expect(parseClientOrigins('https://cartnest.vercel.app, https://preview.vercel.app,https://cartnest.vercel.app'))
      .toEqual(['https://cartnest.vercel.app', 'https://preview.vercel.app']);
  });

  it('rejects wildcard, non-HTTP, and path-based origins', () => {
    expect(() => parseClientOrigins('*')).toThrow('valid absolute URL origin');
    expect(() => parseClientOrigins('ftp://cartnest.example')).toThrow('HTTP(S) origin');
    expect(() => parseClientOrigins('https://cartnest.example/path')).toThrow('without a path');
  });

  it('allows only an origin from the configured allow list', async () => {
    const allowedResponse = await request(app)
      .options('/api/auth/login')
      .set('Origin', clientOrigins[0])
      .set('Access-Control-Request-Method', 'POST');
    expect(allowedResponse.headers['access-control-allow-origin']).toBe(clientOrigins[0]);

    const blockedResponse = await request(app)
      .options('/api/auth/login')
      .set('Origin', 'https://untrusted.example')
      .set('Access-Control-Request-Method', 'POST');
    expect(blockedResponse.headers['access-control-allow-origin']).toBeUndefined();
  });
});
