const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

describe('Customer Address APIs', () => {
  let userAToken = '';
  let userBToken = '';
  let userAId = '';
  let userBId = '';
  let addressIdA = '';

  beforeAll(async () => {
    // Register User A
    const resA = await request(app).post('/api/auth/register').send({
      name: 'User Alpha',
      email: `alpha_${Date.now()}@cartnest.com`,
      password: 'Password123!',
    });
    userAToken = resA.body.data.token;
    userAId = resA.body.data.user.id;

    // Register User B
    const resB = await request(app).post('/api/auth/register').send({
      name: 'User Beta',
      email: `beta_${Date.now()}@cartnest.com`,
      password: 'Password123!',
    });
    userBToken = resB.body.data.token;
    userBId = resB.body.data.user.id;
  });

  afterAll(async () => {
    await prisma.address.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
    await prisma.cart.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
    await prisma.auditLog.deleteMany({ where: { userId: { in: [userAId, userBId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId] } } });
  });

  it('should reject address access without authentication', async () => {
    const res = await request(app).get('/api/addresses');
    expect(res.status).toBe(401);
  });

  it('should create first address and automatically mark it as default', async () => {
    const res = await request(app)
      .post('/api/addresses')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        fullName: 'Alpha Home',
        addressLine1: '123 Tech Residency',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        phone: '+91 91111 22222',
        isDefault: false, // Even if requested false, first address becomes default
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isDefault).toBe(true);
    expect(res.body.data.userId).toBe(userAId);
    addressIdA = res.body.data.id;
  });

  it('should create second address without overriding default unless specified', async () => {
    const res = await request(app)
      .post('/api/addresses')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        fullName: 'Alpha Office',
        addressLine1: '456 Innovation Park',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560100',
        phone: '+91 91111 33333',
        isDefault: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.isDefault).toBe(false);
  });

  it('should list all addresses for the authenticated customer', async () => {
    const res = await request(app)
      .get('/api/addresses')
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0].isDefault).toBe(true); // Default address sorted first
  });

  it('should prevent User B from updating User A’s address (Cross-user isolation)', async () => {
    const res = await request(app)
      .put(`/api/addresses/${addressIdA}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        fullName: 'Hacked Address Name',
      });

    expect(res.status).toBe(404);
  });

  it('should prevent User B from deleting User A’s address', async () => {
    const res = await request(app)
      .delete(`/api/addresses/${addressIdA}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.status).toBe(404);
  });

  it('should allow User A to delete their own address', async () => {
    const res = await request(app)
      .delete(`/api/addresses/${addressIdA}`)
      .set('Authorization', `Bearer ${userAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify remaining address was promoted to default
    const listRes = await request(app)
      .get('/api/addresses')
      .set('Authorization', `Bearer ${userAToken}`);
    expect(listRes.body.data.length).toBe(1);
    expect(listRes.body.data[0].isDefault).toBe(true);
  });
});
