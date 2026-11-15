const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

describe('Persistent Shopping Cart APIs', () => {
  let user1Token = '';
  let user2Token = '';
  let user1Id = '';
  let user2Id = '';
  let sampleProduct = null;
  let cartItemId = '';

  beforeAll(async () => {
    // Register User 1
    const res1 = await request(app).post('/api/auth/register').send({
      name: 'Cart Shopper 1',
      email: `shopper1_${Date.now()}@cartnest.com`,
      password: 'Password123!',
    });
    user1Token = res1.body.data.token;
    user1Id = res1.body.data.user.id;

    // Register User 2
    const res2 = await request(app).post('/api/auth/register').send({
      name: 'Cart Shopper 2',
      email: `shopper2_${Date.now()}@cartnest.com`,
      password: 'Password123!',
    });
    user2Token = res2.body.data.token;
    user2Id = res2.body.data.user.id;

    // Fetch a sample product with variants from seeded database
    sampleProduct = await prisma.product.findFirst({
      where: { isActive: true, variants: { some: {} } },
      include: { variants: true },
    });
  });

  afterAll(async () => {
    try {
      await prisma.cartItem.deleteMany({ where: { cart: { userId: { in: [user1Id, user2Id] } } } });
      await prisma.cart.deleteMany({ where: { userId: { in: [user1Id, user2Id] } } });
      await prisma.auditLog.deleteMany({ where: { userId: { in: [user1Id, user2Id] } } });
      await prisma.user.deleteMany({ where: { id: { in: [user1Id, user2Id] } } });
    } catch (e) {}
  });

  it('should reject unauthenticated cart access', async () => {
    const res = await request(app).get('/api/cart');
    expect(res.status).toBe(401);
  });

  it('should return empty cart initially for new user', async () => {
    const res = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalItems).toBe(0);
    expect(res.body.data.subtotal).toBe(0);
  });

  it('should add item with variant and calculate price from database', async () => {
    const variant = sampleProduct.variants[0];
    const expectedUnitPrice = Number((Number(sampleProduct.basePrice) + Number(variant.priceAdjustment)).toFixed(2));

    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        productId: sampleProduct.id,
        variantId: variant.id,
        quantity: 2,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalItems).toBe(2);

    const item = res.body.data.items[0];
    expect(item.productId).toBe(sampleProduct.id);
    expect(item.variantId).toBe(variant.id);
    expect(item.unitPrice).toBe(expectedUnitPrice);
    expect(item.subtotal).toBe(Number((expectedUnitPrice * 2).toFixed(2)));
    expect(res.body.data.subtotal).toBe(item.subtotal);

    cartItemId = item.id;
  });

  it('should reject invalid quantity (>50 or <1) via Zod validation', async () => {
    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        productId: sampleProduct.id,
        quantity: 99999,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Validation failed');
  });

  it('should prevent adding more items than available database stock', async () => {
    const variant = sampleProduct.variants[0];
    const exceedingQuantity = Math.min(variant.stock + 1, 50);

    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        productId: sampleProduct.id,
        variantId: variant.id,
        quantity: exceedingQuantity,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message.toLowerCase()).toContain('stock');
  });

  it('should update quantity of an existing item in the cart', async () => {
    const res = await request(app)
      .put(`/api/cart/items/${cartItemId}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ quantity: 3 });

    expect(res.status).toBe(200);
    expect(res.body.data.totalItems).toBe(3);
    const item = res.body.data.items.find((i) => i.id === cartItemId);
    expect(item.quantity).toBe(3);
  });

  it('should prevent User 2 from updating or accessing User 1’s cart item', async () => {
    const res = await request(app)
      .put(`/api/cart/items/${cartItemId}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ quantity: 5 });

    expect(res.status).toBe(404);
  });

  it('should prevent User 2 from deleting User 1’s cart item', async () => {
    const res = await request(app)
      .delete(`/api/cart/items/${cartItemId}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.status).toBe(404);
  });

  it('should remove an item from the cart', async () => {
    const res = await request(app)
      .delete(`/api/cart/items/${cartItemId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalItems).toBe(0);
    expect(res.body.data.items.length).toBe(0);
  });

  it('should clear all items in the cart', async () => {
    // Add item first
    await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        productId: sampleProduct.id,
        quantity: 1,
      });

    const res = await request(app)
      .delete('/api/cart')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items.length).toBe(0);
    expect(res.body.data.totalItems).toBe(0);
    expect(res.body.data.subtotal).toBe(0);
  });
});
