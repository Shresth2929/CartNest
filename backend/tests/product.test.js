const request = require('supertest');
const app = require('../src/app');

describe('Product Catalogue APIs', () => {
  it('should retrieve list of products with pagination metadata', async () => {
    const res = await request(app).get('/api/products');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.page).toBe(1);
    expect(res.body.meta.total).toBeGreaterThan(0);
  });

  it('should search products by text query in name or description', async () => {
    const res = await request(app).get('/api/products?search=monitor');

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    const item = res.body.data[0];
    const match = item.name.toLowerCase().includes('monitor') || item.description.toLowerCase().includes('monitor');
    expect(match).toBe(true);
  });

  it('should filter products by category slug', async () => {
    const res = await request(app).get('/api/products?category=living-workspace');

    expect(res.status).toBe(200);
    res.body.data.forEach((p) => {
      expect(p.category.slug).toBe('living-workspace');
    });
  });

  it('should filter products by minPrice and maxPrice range', async () => {
    const min = 1000;
    const max = 2000;
    const res = await request(app).get(`/api/products?minPrice=${min}&maxPrice=${max}`);

    expect(res.status).toBe(200);
    res.body.data.forEach((p) => {
      const price = Number(p.basePrice);
      expect(price).toBeGreaterThanOrEqual(min);
      expect(price).toBeLessThanOrEqual(max);
    });
  });

  it('should sort products by price ascending', async () => {
    const res = await request(app).get('/api/products?sortBy=price-asc');

    expect(res.status).toBe(200);
    const products = res.body.data;
    for (let i = 0; i < products.length - 1; i++) {
      expect(Number(products[i].basePrice)).toBeLessThanOrEqual(Number(products[i + 1].basePrice));
    }
  });

  it('should retrieve individual product details by slug', async () => {
    const res = await request(app).get('/api/products/nordic-oak-monitor-stand');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.slug).toBe('nordic-oak-monitor-stand');
    expect(res.body.data.variants).toBeDefined();
    expect(res.body.data.variants.length).toBeGreaterThan(0);
  });

  it('should return 404 for non-existent product slug', async () => {
    const res = await request(app).get('/api/products/non-existent-fancy-lamp');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should list all active categories with product counts', async () => {
    const res = await request(app).get('/api/categories');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]._count).toBeDefined();
  });
});
