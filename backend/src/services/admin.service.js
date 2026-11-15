const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');
const orderService = require('./order.service');

const REVENUE_ORDER_FILTER = {
  status: { not: 'CANCELLED' },
  payments: { some: { status: 'SUCCESS' } },
};
const LOW_STOCK_THRESHOLD = 10;

function pageResult(page, limit, total, data) {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function writeAudit(tx, actorId, action, entityType, entityId, metadata = {}) {
  return tx.auditLog.create({
    data: {
      userId: actorId,
      action,
      entityType,
      entityId,
      metadata,
    },
  });
}

function lowStockWhere(threshold) {
  return {
    isActive: true,
    OR: [
      { stock: { lte: threshold } },
      { variants: { some: { stock: { lte: threshold } } } },
    ],
  };
}

class AdminService {
  async getDashboardMetrics() {
    const [
      totalCustomers,
      totalActiveProducts,
      totalOrders,
      revenueAggregate,
      lowStockProducts,
      recentOrders,
      orderStatusGroups,
      salesByDay,
      topProducts,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.order.aggregate({
        where: REVENUE_ORDER_FILTER,
        _sum: { total: true },
      }),
      prisma.product.count({ where: lowStockWhere(LOW_STOCK_THRESHOLD) }),
      prisma.order.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
          payments: {
            select: { status: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.order.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.$queryRaw`
        WITH eligible_orders AS (
          SELECT o."id", o."createdAt", o."total"
          FROM "Order" o
          WHERE o."status" <> 'CANCELLED'
            AND o."createdAt" >= CURRENT_DATE - INTERVAL '29 days'
            AND EXISTS (
              SELECT 1 FROM "Payment" p
              WHERE p."orderId" = o."id" AND p."status" = 'SUCCESS'
            )
        ),
        calendar AS (
          SELECT generate_series(
            CURRENT_DATE - INTERVAL '29 days',
            CURRENT_DATE,
            INTERVAL '1 day'
          )::date AS day
        )
        SELECT calendar.day AS date,
          COUNT(eligible_orders.id)::int AS orders,
          COALESCE(SUM(eligible_orders."total"), 0)::float8 AS revenue
        FROM calendar
        LEFT JOIN eligible_orders
          ON eligible_orders."createdAt"::date = calendar.day
        GROUP BY calendar.day
        ORDER BY calendar.day ASC
      `,
      prisma.$queryRaw`
        SELECT oi."productId" AS id,
          oi."productName" AS name,
          SUM(oi."quantity")::int AS quantity,
          SUM(oi."subtotal")::float8 AS revenue
        FROM "OrderItem" oi
        JOIN "Order" o ON o."id" = oi."orderId"
        WHERE o."status" <> 'CANCELLED'
          AND EXISTS (
            SELECT 1 FROM "Payment" p
            WHERE p."orderId" = o."id" AND p."status" = 'SUCCESS'
          )
        GROUP BY oi."productId", oi."productName"
        ORDER BY quantity DESC, revenue DESC
        LIMIT 5
      `,
    ]);

    return {
      summary: {
        totalRevenue: Number(revenueAggregate._sum.total || 0),
        totalOrders,
        totalCustomers,
        totalActiveProducts,
        lowStockProducts,
        lowStockThreshold: LOW_STOCK_THRESHOLD,
      },
      revenueDefinition: 'Sum of order totals for non-cancelled orders with a successful payment. Failed, pending, refunded, and cancelled orders are excluded.',
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: Number(order.total),
        createdAt: order.createdAt,
        customer: order.user,
        paymentStatus: order.payments[0]?.status || 'PENDING',
      })),
      topProducts: topProducts.map((product) => ({
        id: product.id,
        name: product.name,
        totalQuantity: product.quantity,
        totalRevenue: Number(product.revenue),
      })),
      salesByDay: salesByDay.map((day) => ({
        date: day.date instanceof Date ? day.date.toISOString().slice(0, 10) : String(day.date),
        orders: day.orders,
        revenue: Number(day.revenue),
      })),
      ordersByStatus: orderStatusGroups.map((group) => ({
        status: group.status,
        count: group._count._all,
      })),
    };
  }

  async getReports() {
    const [dashboard, inventory] = await Promise.all([
      this.getDashboardMetrics(),
      this.getInventory({ page: 1, limit: 100, lowStockOnly: true, threshold: LOW_STOCK_THRESHOLD }),
    ]);
    return {
      summary: dashboard.summary,
      revenueDefinition: dashboard.revenueDefinition,
      salesByDay: dashboard.salesByDay,
      ordersByStatus: dashboard.ordersByStatus,
      bestSellingProducts: dashboard.topProducts,
      lowStockItems: inventory.data.flatMap((product) => [
        ...(product.stock <= LOW_STOCK_THRESHOLD
          ? [{ productId: product.id, name: product.name, sku: product.sku, stock: product.stock, kind: 'PRODUCT' }]
          : []),
        ...product.variants
          .filter((variant) => variant.stock <= LOW_STOCK_THRESHOLD)
          .map((variant) => ({
            productId: product.id,
            variantId: variant.id,
            name: `${product.name} — ${variant.name}`,
            sku: variant.sku,
            stock: variant.stock,
            kind: 'VARIANT',
          })),
      ]),
    };
  }

  async getOrders({ page = 1, limit = 20, status, search } = {}) {
    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
          items: { select: { productName: true, quantity: true, unitPrice: true, subtotal: true } },
          payments: {
            select: { status: true, paymentMethod: true, amount: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
    ]);

    return pageResult(page, limit, total, orders.map((order) => ({
      ...order,
      total: Number(order.total),
      payments: order.payments.map((payment) => ({ ...payment, amount: Number(payment.amount) })),
    })));
  }

  async getOrderById(orderId) {
    const order = await prisma.order.findFirst({
      where: { OR: [{ id: orderId }, { orderNumber: orderId }] },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        subtotal: true,
        tax: true,
        shippingFee: true,
        discount: true,
        total: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
        shippingAddress: {
          select: {
            fullName: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
            phone: true,
          },
        },
        items: true,
        payments: {
          select: {
            id: true,
            paymentMethod: true,
            amount: true,
            status: true,
            failureReason: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          select: {
            fromStatus: true,
            toStatus: true,
            note: true,
            createdAt: true,
            actor: { select: { name: true, email: true } },
          },
        },
      },
    });
    if (!order) throw ApiError.notFound('Order not found');
    return order;
  }

  async updateOrderStatus(orderId, data, adminId) {
    return orderService.updateOrderStatus(orderId, data, adminId);
  }

  async getProducts({ page = 1, limit = 20, search, categoryId, isActive } = {}) {
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (isActive !== undefined) where.isActive = isActive;

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true, isActive: true } },
          variants: { orderBy: { createdAt: 'asc' } },
        },
      }),
    ]);
    return pageResult(page, limit, total, products);
  }

  async createProduct(data, adminId) {
    const { variants = [], ...productData } = data;
    const category = await prisma.category.findUnique({ where: { id: productData.categoryId } });
    if (!category || !category.isActive) throw ApiError.badRequest('Selected category does not exist or is inactive');
    if (variants.some((variant) => productData.basePrice + variant.priceAdjustment <= 0)) {
      throw ApiError.badRequest('A variant price must remain greater than zero');
    }

    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          ...productData,
          variants: {
            create: variants.map(({ id, ...variant }) => ({
              ...variant,
              stock: variant.stock ?? 0,
            })),
          },
        },
        include: { category: true, variants: true },
      });
      const initialMovements = [
        ...(product.stock > 0 ? [{
          productId: product.id,
          actorId: adminId,
          delta: product.stock,
          stockAfter: product.stock,
          reason: 'Opening stock on product creation',
        }] : []),
        ...product.variants
          .filter((variant) => variant.stock > 0)
          .map((variant) => ({
            productId: product.id,
            variantId: variant.id,
            actorId: adminId,
            delta: variant.stock,
            stockAfter: variant.stock,
            reason: 'Opening stock on product creation',
          })),
      ];
      if (initialMovements.length) {
        await tx.inventoryMovement.createMany({ data: initialMovements });
      }
      await writeAudit(tx, adminId, 'PRODUCT_CREATED', 'PRODUCT', product.id, {
        name: product.name,
        sku: product.sku,
      });
      return product;
    });
  }

  async updateProduct(productId, data, adminId) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.product.findUnique({
        where: { id: productId },
        include: { variants: true },
      });
      if (!existing) throw ApiError.notFound('Product not found');
      if (data.categoryId) {
        const category = await tx.category.findUnique({ where: { id: data.categoryId } });
        if (!category || !category.isActive) throw ApiError.badRequest('Selected category does not exist or is inactive');
      }

      const { variants, ...productData } = data;
      const targetBasePrice = data.basePrice === undefined ? Number(existing.basePrice) : data.basePrice;
      if (variants) {
        const suppliedIds = new Set(variants.filter((variant) => variant.id).map((variant) => variant.id));
        if (suppliedIds.size !== variants.filter((variant) => variant.id).length) {
          throw ApiError.badRequest('A product variant may only be supplied once');
        }

        for (const variant of variants) {
          if (targetBasePrice + variant.priceAdjustment <= 0) {
            throw ApiError.badRequest('A variant price must remain greater than zero');
          }
          if (variant.id) {
            if (variant.stock !== undefined) {
              throw ApiError.badRequest('Variant stock must be changed through inventory adjustments');
            }
            const existingVariant = existing.variants.find((item) => item.id === variant.id);
            if (!existingVariant) throw ApiError.badRequest('Variant does not belong to this product');
            const { id, ...variantData } = variant;
            await tx.productVariant.update({ where: { id }, data: variantData });
          } else {
            const { id, ...variantData } = variant;
            const createdVariant = await tx.productVariant.create({
              data: {
                ...variantData,
                productId,
                stock: variantData.stock ?? 0,
              },
            });
            if (createdVariant.stock > 0) {
              await tx.inventoryMovement.create({
                data: {
                  productId,
                  variantId: createdVariant.id,
                  actorId: adminId,
                  delta: createdVariant.stock,
                  stockAfter: createdVariant.stock,
                  reason: 'Opening stock on variant creation',
                },
              });
            }
          }
        }

        const removedIds = existing.variants
          .filter((variant) => !suppliedIds.has(variant.id))
          .map((variant) => variant.id);
        if (removedIds.length > 0) {
          const [historicalItems, cartItems] = await Promise.all([
            tx.orderItem.count({ where: { variantId: { in: removedIds } } }),
            tx.cartItem.count({ where: { variantId: { in: removedIds } } }),
          ]);
          if (historicalItems > 0 || cartItems > 0) {
            throw ApiError.badRequest('Variants used in orders or customer carts cannot be removed');
          }
          await tx.productVariant.deleteMany({ where: { id: { in: removedIds } } });
        }
      }

      if (!variants && data.basePrice !== undefined && existing.variants.some(
        (variant) => targetBasePrice + Number(variant.priceAdjustment) <= 0,
      )) {
        throw ApiError.badRequest('A variant price must remain greater than zero');
      }

      const product = await tx.product.update({
        where: { id: productId },
        data: productData,
        include: { category: true, variants: { orderBy: { createdAt: 'asc' } } },
      });
      await writeAudit(tx, adminId, 'PRODUCT_UPDATED', 'PRODUCT', productId, {
        fields: Object.keys(data),
      });
      return product;
    });
  }

  async deactivateProduct(productId, adminId) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw ApiError.notFound('Product not found');
      const updated = await tx.product.update({
        where: { id: productId },
        data: { isActive: false },
      });
      await writeAudit(tx, adminId, 'PRODUCT_DEACTIVATED', 'PRODUCT', productId, {
        name: product.name,
      });
      return updated;
    });
  }

  async getCategories() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  }

  async createCategory(data, adminId) {
    return prisma.$transaction(async (tx) => {
      const category = await tx.category.create({ data });
      await writeAudit(tx, adminId, 'CATEGORY_CREATED', 'CATEGORY', category.id, {
        name: category.name,
        slug: category.slug,
      });
      return category;
    });
  }

  async updateCategory(categoryId, data, adminId) {
    return prisma.$transaction(async (tx) => {
      const category = await tx.category.update({ where: { id: categoryId }, data });
      await writeAudit(tx, adminId, 'CATEGORY_UPDATED', 'CATEGORY', categoryId, {
        fields: Object.keys(data),
      });
      return category;
    });
  }

  async deleteCategory(categoryId, adminId) {
    return prisma.$transaction(async (tx) => {
      const category = await tx.category.findUnique({
        where: { id: categoryId },
        include: { _count: { select: { products: true } } },
      });
      if (!category) throw ApiError.notFound('Category not found');
      if (category._count.products > 0) {
        throw ApiError.badRequest('Cannot delete a category that has products assigned to it');
      }
      await tx.category.delete({ where: { id: categoryId } });
      await writeAudit(tx, adminId, 'CATEGORY_DELETED', 'CATEGORY', categoryId, {
        name: category.name,
      });
      return { message: 'Category deleted successfully' };
    });
  }

  async getInventory({ page = 1, limit = 20, search, lowStockOnly = false, threshold = LOW_STOCK_THRESHOLD } = {}) {
    const searchConditions = search
      ? [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { variants: { some: { OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
          ] } } },
        ]
      : null;
    const where = lowStockOnly ? lowStockWhere(threshold) : {};
    if (searchConditions) {
      if (lowStockOnly) where.AND = [{ OR: searchConditions }];
      else where.OR = searchConditions;
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ stock: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          sku: true,
          stock: true,
          isActive: true,
          category: { select: { id: true, name: true } },
          variants: { select: { id: true, name: true, sku: true, stock: true } },
        },
      }),
    ]);
    return pageResult(page, limit, total, products);
  }

  async adjustInventory({ productId, variantId, delta, reason }, adminId) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw ApiError.notFound('Product not found');

      let currentStock = product.stock;
      if (variantId) {
        const variant = await tx.productVariant.findFirst({
          where: { id: variantId, productId },
        });
        if (!variant) throw ApiError.badRequest('Variant does not belong to this product');
        currentStock = variant.stock;
      }
      if (currentStock + delta < 0) {
        throw ApiError.badRequest('Inventory adjustment would make stock negative');
      }

      const updatedRows = variantId
        ? await tx.$queryRaw`
            UPDATE "ProductVariant"
            SET "stock" = "stock" + ${delta}
            WHERE "id" = ${variantId} AND "productId" = ${productId}
              AND "stock" + ${delta} >= 0
            RETURNING "stock"
          `
        : await tx.$queryRaw`
            UPDATE "Product"
            SET "stock" = "stock" + ${delta}
            WHERE "id" = ${productId} AND "stock" + ${delta} >= 0
            RETURNING "stock"
          `;
      if (updatedRows.length === 0) {
        throw ApiError.conflict('Inventory changed concurrently; reload and try again');
      }

      const movement = await tx.inventoryMovement.create({
        data: {
          productId,
          variantId: variantId || null,
          actorId: adminId,
          delta,
          stockAfter: updatedRows[0].stock,
          reason,
        },
      });
      await writeAudit(tx, adminId, 'INVENTORY_ADJUSTED', 'PRODUCT', productId, {
        variantId: variantId || null,
        delta,
        stockAfter: updatedRows[0].stock,
        reason,
      });
      return movement;
    });
  }

  async getInventoryMovements({ page = 1, limit = 20, search } = {}) {
    const where = {};
    if (search) {
      where.OR = [
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { product: { sku: { contains: search, mode: 'insensitive' } } },
        { variant: { name: { contains: search, mode: 'insensitive' } } },
        { reason: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [total, movements] = await Promise.all([
      prisma.inventoryMovement.count({ where }),
      prisma.inventoryMovement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true, sku: true } },
          variant: { select: { name: true, sku: true } },
          actor: { select: { name: true } },
          order: { select: { orderNumber: true } },
        },
      }),
    ]);
    return pageResult(page, limit, total, movements);
  }

  async getCustomers({ page = 1, limit = 20, search } = {}) {
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
        skip: (page - 1) * limit,
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
    return pageResult(page, limit, total, customers.map((customer) => ({
      ...customer,
      orderCount: customer._count.orders,
      _count: undefined,
    })));
  }

  async getCustomerById(customerId) {
    const customer = await prisma.user.findFirst({
      where: { id: customerId, role: 'CUSTOMER' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 25,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
            items: { select: { productName: true, quantity: true } },
            payments: {
              select: { status: true },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });
    if (!customer) throw ApiError.notFound('Customer not found');
    return {
      ...customer,
      orders: customer.orders.map((order) => ({
        ...order,
        total: Number(order.total),
        paymentStatus: order.payments[0]?.status || 'PENDING',
        payments: undefined,
      })),
    };
  }

  async getAuditLogs({ page = 1, limit = 30, action, entityType } = {}) {
    const where = {};
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (entityType) where.entityType = entityType;
    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          metadata: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);
    return pageResult(page, limit, total, logs);
  }
}

module.exports = new AdminService();
