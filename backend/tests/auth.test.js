const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

describe('Authentication & Security APIs', () => {
  const testUser = {
    name: 'Test Customer',
    email: `test_${Date.now()}@cartnest.com`,
    password: 'SecurePassword123!',
    phone: '+91 99999 88888',
  };

  let authToken = '';

  afterAll(async () => {
    // Clean up created test user
    try {
      const user = await prisma.user.findUnique({ where: { email: testUser.email } });
      if (user) {
        await prisma.cartItem.deleteMany({ where: { cart: { userId: user.id } } });
        await prisma.cart.deleteMany({ where: { userId: user.id } });
        await prisma.auditLog.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
      }
    } catch (e) {
      // Ignore cleanup error
    }
  });

  describe('POST /api/auth/register', () => {
    it('should register a new customer account successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.data.user.role).toBe('CUSTOMER');
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.passwordHash).toBeUndefined(); // Never expose password hash

      authToken = res.body.data.token;
    });

    it('should disallow self-assigning ADMIN role during registration', async () => {
      const maliciousUser = {
        name: 'Hacker User',
        email: `hacker_${Date.now()}@cartnest.com`,
        password: 'HackerPassword123!',
        role: 'ADMIN', // Attempting privilege escalation
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(maliciousUser);

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('CUSTOMER'); // Must be forced to CUSTOMER

      // Cleanup
      await prisma.cart.deleteMany({ where: { userId: res.body.data.user.id } });
      await prisma.auditLog.deleteMany({ where: { userId: res.body.data.user.id } });
      await prisma.user.delete({ where: { id: res.body.data.user.id } });
    });

    it('should reject registration if email is already taken', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already registered');
    });

    it('should reject registration with invalid email or weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'A', // too short (<2)
          email: 'not-an-email',
          password: '123', // too short (<8)
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
      expect(res.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'IncorrectPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nobody_123456789@cartnest.com',
          password: 'AnyPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile when authenticated', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email.toLowerCase());
      expect(res.body.data.role).toBe('CUSTOMER');
      expect(res.body.data.passwordHash).toBeUndefined();
    });

    it('should reject access when no token is provided', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject access with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_bogus_token_123');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
