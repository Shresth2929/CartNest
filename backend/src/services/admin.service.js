const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');

class AdminService {
  // ─── Dashboard ───────────────────────────────────────────────────────────────

  async getDashboardMetrics() {
    const [
      totalCustomers,
      totalProducts,
      orderStats,
      recentOrders,
      topProducts,
      salesByDay,
      ordersByStatus,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.product.count(),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.orderItem.groupBy({
        by: ['productName'],
        _sum: { quantity: true, subtotal: true },
        orderBy: { _sum: { subtotal: 'desc' } },
        take: 5,
      }),
      // Last 7 days sales
      prisma.$queryRaw`
        SELECT 
          DATE("createdAt") as date,
          COUNT(*)::int as orders,
          SUM("totalAmount") as revenue
        FROM "Order"
        WHERE "createdAt" >= NOW() - INTERVAL '7 days'
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
      prisma.order.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    return {
      summary: {
        totalCustomers,
        totalProducts,
        totalOrders: orderStats._count.id,
        totalRevenue: Number(orderStats._sum.totalAmount || 0),
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        status: o.status,
        totalAmount: Number(o.totalAmount),
        customer: o.user.name,
        email: o.user.email,
        createdAt: o.createdAt,
      })),
      topProducts: topProducts.map((p) => ({
        name: p.productName,
        totalQuantity: p._sum.quantity,
        totalRevenue: Number(p._sum.subtotal || 0),
      })),
      salesByDay: salesByDay.map((r) => ({
        date: r.date,
        orders: r.orders,
        revenue: Number(r.revenue || 0),
      })),
      ordersByStatus: ordersByStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
    };
  }

  // ─── Orders ──────────────────────────────────────────────────────────────────

  async getOrders({ page = 1, limit = 20, status, search } = {}) {
    const skip = (page - 1) * limit;
    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: { select: { productName: true, quantity: true, unitPrice: true, subtotal: true } },
          payment: { select: { status: true, transactionRef: true } },
        },
      }),
    ]);
    return {
      data: orders.map((o) => ({ ...o, totalAmount: Number(o.totalAmount) })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateOrderStatus(orderId, newStatus) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw ApiError.notFound('Order not found');

    const transitions = {
      PLACED: ['PAID', 'CANCELLED'],
      PAID: ['PACKED', 'CANCELLED'],
      PACKED: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['DELIVERED'],
      DELIVERED: [],
      CANCELLED: [],
    };
    if (!transitions[order.status].includes(newStatus)) {
      throw ApiError.badRequest(`Cannot transition order from ${order.status} to ${newStatus}`);
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });
    return updated;
  }

  // ─── Products ─────────────────────────────────────────────────────────────────

  async getProducts({ page = 1, limit = 20, search, categoryId, isActive } = {}) {
    const skip = (page - 1) * limit;
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (isActive !== undefined) where.isActive = isActive;

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true } },
          variants: true,
        },
      }),
    ]);
    return {
      data: products.map((p) => ({ ...p, basePrice: Number(p.basePrice) })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async createProduct(data) {
    const { variants, ...productData } = data;

    // Check slug uniqueness
    const existing = await prisma.product.findUnique({ where: { slug: productData.slug } });
    if (existing) throw ApiError.conflict('A product with this slug already exists');

    const product = await prisma.product.create({
      data: {
        ...productData,
        variants: variants && variants.length > 0
          ? { create: variants }
          : undefined,
      },
      include: { category: true, variants: true },
    });
    return product;
  }

  async updateProduct(productId, data) {
    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) throw ApiError.notFound('Product not found');

    const { variants, ...productData } = data;

    const product = await prisma.product.update({
      where: { id: productId },
      data: productData,
      include: { category: true, variants: true },
    });
    return product;
  }

  async deleteProduct(productId) {
    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) throw ApiError.notFound('Product not found');

    // Soft delete — set isActive = false
    await prisma.product.update({ where: { id: productId }, data: { isActive: false } });
    return { message: 'Product deactivated successfully' };
  }

  // ─── Categories ───────────────────────────────────────────────────────────────

  async getCategories() {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    return categories;
  }

  async createCategory(data) {
    const existing = await prisma.category.findUnique({ where: { slug: data.slug } });
    if (existing) throw ApiError.conflict('A category with this slug already exists');

    return prisma.category.create({ data });
  }

  async updateCategory(categoryId, data) {
    const existing = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!existing) throw ApiError.notFound('Category not found');

    return prisma.category.update({ where: { id: categoryId }, data });
  }

  async deleteCategory(categoryId) {
    const existing = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { _count: { select: { products: true } } },
    });
    if (!existing) throw ApiError.notFound('Category not found');
    if (existing._count.products > 0) {
      throw ApiError.badRequest('Cannot delete a category that has products assigned to it');
    }
    await prisma.category.delete({ where: { id: categoryId } });
    return { message: 'Category deleted successfully' };
  }

  // ─── Customers ────────────────────────────────────────────────────────────────

  async getCustomers({ page = 1, limit = 20, search } = {}) {
    const skip = (page - 1) * limit;
    const where = { role: 'CUSTOMER' };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [total, customers] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
    ]);
    return {
      data: customers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Audit Logs ───────────────────────────────────────────────────────────────

  async getAuditLogs({ page = 1, limit = 30, action, userId } = {}) {
    const skip = (page - 1) * limit;
    const where = {};
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (userId) where.userId = userId;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);
    return {
      data: logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}

module.exports = new AdminService();
