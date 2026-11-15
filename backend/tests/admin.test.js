const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const prisma = require('../src/config/prisma');
const { generateToken } = require('../src/utils/jwt');

describe('Admin APIs', () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const testEmail = `admin-test-${suffix}@cartnest.test`;
  const customerEmail = `admin-customer-${suffix}@cartnest.test`;
  const productIds = [];
  const categoryIds = [];
  const orderIds = [];
  let admin;
  let customer;
  let adminToken;
  let customerToken;
  let activeCategory;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('TestOnlyPassword123!', 4);
    [admin, customer] = await Promise.all([
      prisma.user.create({
        data: { name: 'Admin API Test', email: testEmail, passwordHash, role: 'ADMIN' },
        select: { id: true, email: true, role: true },
      }),
      prisma.user.create({
        data: { name: 'Admin Customer Test', email: customerEmail, passwordHash, role: 'CUSTOMER' },
        select: { id: true, email: true, role: true },
      }),
    ]);
    activeCategory = await prisma.category.findFirst({ where: { isActive: true } });
    adminToken = generateToken({ id: admin.id, email: admin.email, role: admin.role });
    customerToken = generateToken({ id: customer.id, email: customer.email, role: customer.role });
  });

  afterAll(async () => {
    await prisma.$transaction(async (tx) => {
      if (productIds.length) {
        await tx.inventoryMovement.deleteMany({ where: { productId: { in: productIds } } });
      }
      if (orderIds.length) {
        await tx.order.deleteMany({ where: { id: { in: orderIds } } });
      }
      if (productIds.length) {
        await tx.product.deleteMany({ where: { id: { in: productIds } } });
      }
      if (categoryIds.length) {
        await tx.category.deleteMany({ where: { id: { in: categoryIds } } });
      }
      await tx.auditLog.deleteMany({
        where: {
          OR: [
            { userId: { in: [admin.id, customer.id] } },
            { entityId: { in: [...productIds, ...categoryIds, ...orderIds] } },
          ],
        },
      });
      await tx.user.deleteMany({ where: { id: { in: [admin.id, customer.id] } } });
    });
  });

  it('requires ADMIN role on every admin route', async () => {
    const anonymous = await request(app).get('/api/admin/dashboard');
    expect(anonymous.status).toBe(401);

    const customerResponse = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(customerResponse.status).toBe(403);

    const adminResponse = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminResponse.status).toBe(200);
    expect(adminResponse.body.data.summary).toEqual(expect.objectContaining({
      totalActiveProducts: expect.any(Number),
      lowStockProducts: expect.any(Number),
      totalRevenue: expect.any(Number),
    }));
  });

  it('validates product input and supports create, update and safe deactivation', async () => {
    const invalid = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Bad Product',
        slug: 'bad-product',
        description: 'Invalid price should be rejected',
        basePrice: -1,
        categoryId: activeCategory.id,
        sku: `BAD-${suffix}`,
      });
    expect(invalid.status).toBe(400);

    const created = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Admin API Test Product',
        slug: `admin-api-test-${suffix}`,
        description: 'Created by the admin integration suite',
        basePrice: 125,
        categoryId: activeCategory.id,
        images: [],
        sku: `ADMIN-TEST-${suffix}`,
        stock: 5,
        variants: [{
          name: 'Test finish',
          sku: `ADMIN-TEST-V-${suffix}`,
          priceAdjustment: 15,
          stock: 3,
          attributes: { finish: 'Test' },
        }],
      });
    expect(created.status).toBe(201);
    const product = created.body.data;
    productIds.push(product.id);
    expect(product.variants).toHaveLength(1);

    const updated = await request(app)
      .put(`/api/admin/products/${product.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Updated Admin API Product',
        variants: [{
          id: product.variants[0].id,
          name: 'Test finish',
          sku: product.variants[0].sku,
          priceAdjustment: 20,
          attributes: { finish: 'Updated' },
        }],
      });
    expect(updated.status).toBe(200);
    expect(updated.body.data.name).toBe('Updated Admin API Product');
    expect(Number(updated.body.data.variants[0].priceAdjustment)).toBe(20);

    const customerDenied = await request(app)
      .get('/api/admin/products')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(customerDenied.status).toBe(403);

    const deactivated = await request(app)
      .delete(`/api/admin/products/${product.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deactivated.status).toBe(200);
    expect(deactivated.body.data.isActive).toBe(false);

    const audit = await prisma.auditLog.findFirst({
      where: { entityType: 'PRODUCT', entityId: product.id, action: 'PRODUCT_CREATED' },
    });
    expect(audit).not.toBeNull();
  });

  it('manages category activation and prevents deletion while products depend on it', async () => {
    const created = await request(app)
      .post('/api/admin/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `Admin Test ${suffix}`, slug: `admin-test-${suffix}` });
    expect(created.status).toBe(201);
    const category = created.body.data;
    categoryIds.push(category.id);

    const inactive = await request(app)
      .put(`/api/admin/categories/${category.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });
    expect(inactive.status).toBe(200);
    expect(inactive.body.data.isActive).toBe(false);

    const storefrontCategories = await request(app).get('/api/categories');
    expect(storefrontCategories.body.data.some((item) => item.id === category.id)).toBe(false);

    const product = await prisma.product.create({
      data: {
        name: `Category dependency ${suffix}`,
        slug: `category-dependency-${suffix}`,
        description: 'Temporary product',
        basePrice: 10,
        categoryId: category.id,
        sku: `CAT-DEP-${suffix}`,
        stock: 1,
      },
    });
    productIds.push(product.id);

    const hiddenCategoryProduct = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: product.id, quantity: 1 });
    expect(hiddenCategoryProduct.status).toBe(400);

    const blockedDelete = await request(app)
      .delete(`/api/admin/categories/${category.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(blockedDelete.status).toBe(400);
  });

  it('records safe inventory adjustments and rejects negative stock', async () => {
    const product = await prisma.product.create({
      data: {
        name: `Inventory test ${suffix}`,
        slug: `inventory-test-${suffix}`,
        description: 'Temporary inventory fixture',
        basePrice: 25,
        categoryId: activeCategory.id,
        sku: `INV-TEST-${suffix}`,
        stock: 2,
      },
    });
    productIds.push(product.id);

    const rejected = await request(app)
      .post('/api/admin/inventory/adjustments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: product.id, delta: -3, reason: 'Invalid negative stock test' });
    expect(rejected.status).toBe(400);
    expect((await prisma.product.findUnique({ where: { id: product.id } })).stock).toBe(2);

    const adjusted = await request(app)
      .post('/api/admin/inventory/adjustments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: product.id, delta: -1, reason: 'Cycle count correction' });
    expect(adjusted.status).toBe(200);
    expect(adjusted.body.data.stockAfter).toBe(1);

    const [movement, audit] = await Promise.all([
      prisma.inventoryMovement.findFirst({ where: { productId: product.id, actorId: admin.id } }),
      prisma.auditLog.findFirst({ where: { action: 'INVENTORY_ADJUSTED', entityId: product.id, userId: admin.id } }),
    ]);
    expect(movement).not.toBeNull();
    expect(audit).not.toBeNull();
  });

  it('enforces order transitions, exposes customer summaries safely, and tracks history', async () => {
    const order = await prisma.order.create({
      data: {
        orderNumber: `CN-ADMIN-TEST-${suffix}`,
        userId: customer.id,
        status: 'PAID',
        subtotal: 100,
        tax: 18,
        shippingFee: 0,
        discount: 0,
        total: 118,
      },
    });
    orderIds.push(order.id);

    const customerDetail = await request(app)
      .get(`/api/admin/customers/${customer.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(customerDetail.status).toBe(200);
    expect(customerDetail.body.data.email).toBe(customer.email);
    expect(customerDetail.body.data.passwordHash).toBeUndefined();
    expect(customerDetail.body.data.orders[0].orderNumber).toBe(order.orderNumber);

    const invalidTransition = await request(app)
      .patch(`/api/admin/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'DELIVERED' });
    expect(invalidTransition.status).toBe(400);

    const updated = await request(app)
      .patch(`/api/admin/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'PACKED', notes: 'Packed for dispatch' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.status).toBe('PACKED');

    const [history, audit] = await Promise.all([
      prisma.orderStatusHistory.findFirst({ where: { orderId: order.id, toStatus: 'PACKED' } }),
      prisma.auditLog.findFirst({ where: { entityId: order.id, action: 'ORDER_STATUS_UPDATED' } }),
    ]);
    expect(history.fromStatus).toBe('PAID');
    expect(history.actorId).toBe(admin.id);
    expect(audit).not.toBeNull();
  });

  it('calculates report revenue from successful, non-cancelled payment records', async () => {
    const report = await request(app)
      .get('/api/admin/reports')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(report.status).toBe(200);

    const eligible = await prisma.order.aggregate({
      where: {
        status: { not: 'CANCELLED' },
        payments: { some: { status: 'SUCCESS' } },
      },
      _sum: { total: true },
    });
    expect(report.body.data.summary.totalRevenue).toBe(Number(eligible._sum.total || 0));
    expect(report.body.data.bestSellingProducts).toEqual(expect.any(Array));
    expect(report.body.data.lowStockItems).toEqual(expect.any(Array));
  });
});
