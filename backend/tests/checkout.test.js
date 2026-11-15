const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/config/prisma');

describe('Checkout, Transactional Inventory, Idempotency & Order Lifecycle APIs', () => {
  let customerToken = '';
  let customerId = '';
  let otherCustomerToken = '';
  let otherCustomerId = '';
  let adminToken = '';
  let shippingAddressId = '';
  let testProduct = null;

  beforeAll(async () => {
    // 1. Register main test customer
    const resCust = await request(app).post('/api/auth/register').send({
      name: 'Checkout Tester',
      email: `checkout_${Date.now()}@cartnest.com`,
      password: 'Password123!',
    });
    customerToken = resCust.body.data.token;
    customerId = resCust.body.data.user.id;

    // 2. Register secondary customer for cross-user tests
    const resOther = await request(app).post('/api/auth/register').send({
      name: 'Other Shopper',
      email: `other_${Date.now()}@cartnest.com`,
      password: 'Password123!',
    });
    otherCustomerToken = resOther.body.data.token;
    otherCustomerId = resOther.body.data.user.id;

    // 3. Login seeded admin
    const resAdmin = await request(app).post('/api/auth/login').send({
      email: process.env.ADMIN_EMAIL || 'admin@cartnest.com',
      password: process.env.ADMIN_PASSWORD || 'AdminPassword123!',
    });
    adminToken = resAdmin.body.data.token;

    // 4. Create shipping address for customer
    const resAddr = await request(app)
      .post('/api/addresses')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        fullName: 'Checkout Tester',
        addressLine1: '404 Silicon Boulevard',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        phone: '+91 98888 77777',
        isDefault: true,
      });
    shippingAddressId = resAddr.body.data.id;

    // 5. Create a dedicated test product with controlled stock for deterministic tests
    const category = await prisma.category.findFirst();
    testProduct = await prisma.product.create({
      data: {
        name: `Deterministic Oak Desk ${Date.now()}`,
        slug: `det-oak-desk-${Date.now()}`,
        description: 'Test desk with controlled inventory',
        basePrice: 1500.00,
        categoryId: category.id,
        sku: `DET-DESK-${Date.now()}`,
        stock: 5, // Exact initial stock = 5
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    try {
      // Clean up orders, cart items, carts, addresses, and test users
      const userIds = [customerId, otherCustomerId];
      await prisma.payment.deleteMany({ where: { order: { userId: { in: userIds } } } });
      await prisma.orderItem.deleteMany({ where: { order: { userId: { in: userIds } } } });
      await prisma.order.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.idempotencyRecord.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.cartItem.deleteMany({ where: { cart: { userId: { in: userIds } } } });
      await prisma.cart.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.address.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.auditLog.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      if (testProduct) {
        await prisma.inventoryMovement.deleteMany({ where: { productId: testProduct.id } });
        await prisma.product.delete({ where: { id: testProduct.id } });
      }
    } catch (e) {
      // Ignore cleanup error
    }
  });

  describe('1. Cart Validation & Revalidation during Checkout', () => {
    it('should reject checkout if shopping cart is empty', async () => {
      const res = await request(app)
        .post('/api/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddressId,
          paymentMethod: 'CARD',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('cart is empty');
    });

    it('should reject checkout if shipping address is invalid or not owned by user', async () => {
      // Add 1 item to cart first
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: testProduct.id, quantity: 1 });

      const res = await request(app)
        .post('/api/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddressId: 'c1f7a0b3-82a1-42db-9a8d-000000000000', // Non-existent address
          paymentMethod: 'CARD',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid shipping address');

      // Clear cart
      await request(app).delete('/api/cart').set('Authorization', `Bearer ${customerToken}`);
    });
  });

  describe('2. Simulated Payment Handling', () => {
    it('should handle failed simulated payment without deducting stock or confirming order', async () => {
      // Initial product stock is 5
      const initialProduct = await prisma.product.findUnique({ where: { id: testProduct.id } });
      expect(initialProduct.stock).toBe(5);

      // Add item to cart
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: testProduct.id, quantity: 2 });

      // Checkout with paymentSimulation = 'FAILED'
      const res = await request(app)
        .post('/api/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddressId,
          paymentMethod: 'CARD',
          paymentSimulation: 'FAILED',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Payment processing failed');

      // VERIFY: Stock was NOT deducted (still 5)
      const afterProduct = await prisma.product.findUnique({ where: { id: testProduct.id } });
      expect(afterProduct.stock).toBe(5);

      // VERIFY: Cart remains intact so customer can retry
      const cartRes = await request(app).get('/api/cart').set('Authorization', `Bearer ${customerToken}`);
      expect(cartRes.body.data.totalItems).toBe(2);

      // Clean up cart for next test
      await request(app).delete('/api/cart').set('Authorization', `Bearer ${customerToken}`);
    });
  });

  describe('3. Successful Checkout & Atomic Stock Deduction', () => {
    let createdOrderId = '';
    const idempotencyKey = `idemp-key-${Date.now()}`;

    it('should successfully place order, deduct stock atomically, create payment record, and clear cart', async () => {
      // Add 2 units of testProduct (stock is 5)
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: testProduct.id, quantity: 2 });

      const res = await request(app)
        .post('/api/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          shippingAddressId,
          paymentMethod: 'CARD',
          paymentSimulation: 'SUCCESS',
          notes: 'Handle with care',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderNumber).toMatch(/^CN-/);
      expect(res.body.data.status).toBe('PAID');
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].quantity).toBe(2);

      // Verify immutable pricing calculations: 2 * 1500 = 3000 subtotal, 18% tax = 540, shipping = 0 (>= 1500), total = 3540
      expect(Number(res.body.data.subtotal)).toBe(3000.00);
      expect(Number(res.body.data.tax)).toBe(540.00);
      expect(Number(res.body.data.shippingFee)).toBe(0.00);
      expect(Number(res.body.data.total)).toBe(3540.00);

      // Verify payment record
      expect(res.body.data.payments.length).toBe(1);
      expect(res.body.data.payments[0].status).toBe('SUCCESS');
      expect(res.body.data.payments[0].transactionId).toMatch(/^TXN-SIM-/);

      createdOrderId = res.body.data.id;

      // VERIFY: Stock was deducted atomically from 5 to 3
      const updatedProduct = await prisma.product.findUnique({ where: { id: testProduct.id } });
      expect(updatedProduct.stock).toBe(3);

      // VERIFY: Cart was cleared automatically
      const cartRes = await request(app).get('/api/cart').set('Authorization', `Bearer ${customerToken}`);
      expect(cartRes.body.data.totalItems).toBe(0);
      expect(cartRes.body.data.items.length).toBe(0);
    });

    it('should return identical cached response on duplicate request with same idempotency key', async () => {
      const res = await request(app)
        .post('/api/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          shippingAddressId,
          paymentMethod: 'CARD',
          paymentSimulation: 'SUCCESS',
          notes: 'Handle with care',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('idempotent replay');
      expect(res.body.data.id).toBe(createdOrderId);
      expect(res.body.data.orderNumber).toBeDefined();

      // VERIFY: Stock was NOT deducted again (still 3)
      const checkProduct = await prisma.product.findUnique({ where: { id: testProduct.id } });
      expect(checkProduct.stock).toBe(3);
    });

    it('should reject request with 409 Conflict if same idempotency key is used with different payload', async () => {
      const res = await request(app)
        .post('/api/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          shippingAddressId,
          paymentMethod: 'UPI', // Different payment method
          paymentSimulation: 'SUCCESS',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('different request payload');
    });
  });

  describe('4. Insufficient & Negative Stock Prevention', () => {
    it('should reject checkout if inventory was depleted below required quantity (prevent negative stock)', async () => {
      // Remaining stock of testProduct is 3.
      // Customer puts remaining 3 in cart.
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: testProduct.id, quantity: 3 });

      // Concurrently simulate stock being reduced in DB directly to 1
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { stock: 1 },
      });

      // Checkout requires 3, but available stock is only 1
      const res = await request(app)
        .post('/api/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          shippingAddressId,
          paymentMethod: 'CARD',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Insufficient inventory');

      // VERIFY: Stock remains positive (1) and never becomes negative
      const p = await prisma.product.findUnique({ where: { id: testProduct.id } });
      expect(p.stock).toBe(1);

      // Restore stock back to 3 for subsequent tests and clear cart
      await prisma.product.update({ where: { id: testProduct.id }, data: { stock: 3 } });
      await request(app).delete('/api/cart').set('Authorization', `Bearer ${customerToken}`);
    });
  });

  describe('5. Concurrency Race-Condition Verification', () => {
    it('should handle simultaneous checkout requests safely without overselling', async () => {
      // Set testProduct stock to exactly 1
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { stock: 1 },
      });

      // Customer 1 adds 1 unit to cart
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: testProduct.id, quantity: 1 });

      // Create address for Customer 2
      const resAddr2 = await request(app)
        .post('/api/addresses')
        .set('Authorization', `Bearer ${otherCustomerToken}`)
        .send({
          fullName: 'Shopper Two',
          addressLine1: '808 Tech Park',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560002',
          phone: '+91 91234 56789',
          isDefault: true,
        });

      // Customer 2 adds 1 unit of same product to cart
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${otherCustomerToken}`)
        .send({ productId: testProduct.id, quantity: 1 });

      // Fire BOTH checkouts simultaneously using Promise.all
      const [req1, req2] = await Promise.all([
        request(app)
          .post('/api/checkout')
          .set('Authorization', `Bearer ${customerToken}`)
          .send({ shippingAddressId, paymentMethod: 'CARD' }),
        request(app)
          .post('/api/checkout')
          .set('Authorization', `Bearer ${otherCustomerToken}`)
          .send({ shippingAddressId: resAddr2.body.data.id, paymentMethod: 'CARD' }),
      ]);

      const statuses = [req1.status, req2.status];
      // Exactly ONE request must succeed (201) and the other must fail (400)
      expect(statuses).toContain(201);
      expect(statuses).toContain(400);

      // VERIFY: Final stock is exactly 0, NEVER -1
      const finalProduct = await prisma.product.findUnique({ where: { id: testProduct.id } });
      expect(finalProduct.stock).toBe(0);

      // Cleanup remaining cart
      await request(app).delete('/api/cart').set('Authorization', `Bearer ${customerToken}`);
      await request(app).delete('/api/cart').set('Authorization', `Bearer ${otherCustomerToken}`);
    });
  });

  describe('6. Order Cancellation & Exact-Once Stock Restoration', () => {
    let orderToCancel = null;

    beforeAll(async () => {
      // Replenish stock to 10
      await prisma.product.update({ where: { id: testProduct.id }, data: { stock: 10 } });

      // Place an order of 3 units
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: testProduct.id, quantity: 3 });

      const checkoutRes = await request(app)
        .post('/api/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ shippingAddressId, paymentMethod: 'CARD' });

      orderToCancel = checkoutRes.body.data;
      expect(orderToCancel.status).toBe('PAID');

      // Stock was 10 - 3 = 7
      const p = await prisma.product.findUnique({ where: { id: testProduct.id } });
      expect(p.stock).toBe(7);
    });

    it('should cancel order and restore stock exactly once', async () => {
      const res = await request(app)
        .post(`/api/orders/${orderToCancel.id}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ reason: 'Found better price elsewhere' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('CANCELLED');

      // VERIFY: Stock restored exactly once: 7 + 3 = 10
      const restoredProduct = await prisma.product.findUnique({ where: { id: testProduct.id } });
      expect(restoredProduct.stock).toBe(10);

      // VERIFY: Payment status updated to REFUNDED
      const updatedPayment = await prisma.payment.findFirst({ where: { orderId: orderToCancel.id } });
      expect(updatedPayment.status).toBe('REFUNDED');
    });

    it('should reject repeated cancellation request and prevent double stock restoration', async () => {
      const res = await request(app)
        .post(`/api/orders/${orderToCancel.id}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ reason: 'Trying to cancel again' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already cancelled');

      // VERIFY: Stock remained 10, was NOT restored a second time
      const p = await prisma.product.findUnique({ where: { id: testProduct.id } });
      expect(p.stock).toBe(10);
    });
  });

  describe('7. Order Lifecycle State Transitions & Authorization', () => {
    let orderId = '';

    beforeAll(async () => {
      // Place an order to test transitions
      await request(app)
        .post('/api/cart/items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ productId: testProduct.id, quantity: 1 });

      const res = await request(app)
        .post('/api/checkout')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ shippingAddressId, paymentMethod: 'CARD' });

      orderId = res.body.data.id;
    });

    it('should prevent Customer from updating order operational status (admin only)', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'PACKED' });

      expect(res.status).toBe(403);
    });

    it('should allow Admin to transition order from PAID to PACKED', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PACKED', notes: 'Packed in warehouse 1' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('PACKED');
    });

    it('should allow Admin to transition order from PACKED to SHIPPED', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'SHIPPED', notes: 'Dispatched via BlueDart tracking #BD98765' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('SHIPPED');
    });

    it('should reject cancellation of an order that has already SHIPPED', async () => {
      const res = await request(app)
        .post(`/api/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ reason: 'Too late' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot cancel order in \'SHIPPED\' status');
    });

    it('should allow Admin to transition order from SHIPPED to DELIVERED', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'DELIVERED', notes: 'Delivered to resident' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('DELIVERED');
    });

    it('should reject invalid transition from DELIVERED to CANCELLED (terminal state)', async () => {
      const res = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CANCELLED' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid status transition');
    });

    it('should prevent User 2 from accessing User 1’s order (Cross-user isolation)', async () => {
      const res = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${otherCustomerToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should allow User 1 to view their own order details and order list', async () => {
      const res = await request(app)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(orderId);
      expect(res.body.data.items.length).toBeGreaterThan(0);
      expect(res.body.data.payments.length).toBeGreaterThan(0);

      const listRes = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.length).toBeGreaterThan(0);
      expect(listRes.body.meta.total).toBeGreaterThan(0);
    });
  });
});
