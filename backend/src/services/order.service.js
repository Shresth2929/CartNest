const crypto = require('crypto');
const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');

// Valid state machine transitions
const VALID_TRANSITIONS = {
  PLACED: ['PAID', 'CANCELLED'],
  PAID: ['PACKED', 'CANCELLED'],
  PACKED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

class OrderService {
  /**
   * Generates a request hash for idempotency checking
   */
  hashPayload(payload) {
    return crypto.createHash('sha256').update(JSON.stringify(payload || {})).digest('hex');
  }

  /**
   * Transactional Checkout with Idempotency, Price Snapshots, and Atomic Stock Deduction
   */
  async checkout(userId, payload, idempotencyKey = null) {
    const requestHash = this.hashPayload(payload);

    // 1. Check Idempotency Key if provided
    if (idempotencyKey) {
      const existingIdempotency = await prisma.idempotencyRecord.findUnique({
        where: { key: idempotencyKey },
      });

      if (existingIdempotency) {
        if (existingIdempotency.userId !== userId) {
          throw ApiError.forbidden('Idempotency key belongs to another user');
        }
        if (existingIdempotency.requestHash !== requestHash) {
          throw ApiError.conflict('Same idempotency key used with different request payload');
        }
        // Return original stored response
        return {
          isIdempotentReplay: true,
          ...existingIdempotency.responseBody,
        };
      }
    }

    // 2. Validate shipping address exists and belongs to the customer
    const address = await prisma.address.findFirst({
      where: { id: payload.shippingAddressId, userId },
    });

    if (!address) {
      throw ApiError.badRequest('Invalid shipping address selected');
    }

    // 3. Fetch customer's persistent cart and cart items from DB
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw ApiError.badRequest('Your shopping cart is empty');
    }

    // 4. Handle Simulated Payment Failure
    // If client requested failed payment simulation, reject immediately without deducting stock
    if (payload.paymentSimulation === 'FAILED') {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'PAYMENT_FAILED_SIMULATED',
          entityType: 'CHECKOUT',
          entityId: cart.id,
          metadata: { reason: 'Simulated payment was declined by issuing bank' },
        },
      });

      throw ApiError.badRequest('Payment processing failed: Simulated payment was declined by issuing bank');
    }

    // 5. Execute transactional checkout with atomic conditional inventory deductions
    const orderResult = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemsToCreate = [];

      // Revalidate each product and execute atomic conditional stock update
      for (const item of cart.items) {
        // Fetch fresh product & variant record to ensure active and current price
        const freshProduct = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!freshProduct || !freshProduct.isActive) {
          throw ApiError.badRequest(`Product "${item.product.name}" is no longer active`);
        }

        let freshVariant = null;
        if (item.variantId) {
          freshVariant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
          });
          if (!freshVariant) {
            throw ApiError.badRequest(`Variant for "${item.product.name}" is no longer available`);
          }

          // Atomic conditional stock decrement for variant
          // Fails immediately if stock < requested quantity
          const updatedVariant = await tx.$executeRaw`
            UPDATE "ProductVariant"
            SET stock = stock - ${item.quantity}
            WHERE id = ${item.variantId} AND stock >= ${item.quantity}
          `;

          if (updatedVariant === 0) {
            throw ApiError.badRequest(
              `Insufficient inventory for variant "${freshVariant.name}". Available stock: ${freshVariant.stock}, Requested: ${item.quantity}`
            );
          }
        }

        // Atomic conditional stock decrement for product
        const updatedProduct = await tx.$executeRaw`
          UPDATE "Product"
          SET stock = stock - ${item.quantity}
          WHERE id = ${item.productId} AND stock >= ${item.quantity}
        `;

        if (updatedProduct === 0) {
          throw ApiError.badRequest(
            `Insufficient inventory for product "${freshProduct.name}". Available stock: ${freshProduct.stock}, Requested: ${item.quantity}`
          );
        }

        // Calculate immutable price snapshot from database (never trust client)
        const basePrice = Number(freshProduct.basePrice);
        const adjustment = freshVariant ? Number(freshVariant.priceAdjustment) : 0;
        const unitPrice = Number((basePrice + adjustment).toFixed(2));
        const itemSubtotal = Number((unitPrice * item.quantity).toFixed(2));

        subtotal += itemSubtotal;

        orderItemsToCreate.push({
          productId: freshProduct.id,
          variantId: freshVariant ? freshVariant.id : null,
          productName: freshProduct.name,
          variantName: freshVariant ? freshVariant.name : null,
          unitPrice,
          quantity: item.quantity,
          subtotal: itemSubtotal,
        });
      }

      // Compute Order Totals
      subtotal = Number(subtotal.toFixed(2));
      const tax = Number((subtotal * 0.18).toFixed(2)); // 18% GST
      const shippingFee = subtotal >= 1500 ? 0.00 : 99.00; // Free shipping over ₹1500
      const discount = 0.00;
      const total = Number((subtotal + tax + shippingFee - discount).toFixed(2));

      // Human-readable Order Number
      const orderNumber = `CN-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: 'PAID', // Simulated payment succeeded, order confirmed & paid
          subtotal,
          tax,
          shippingFee,
          discount,
          total,
          shippingAddressId: address.id,
          idempotencyKey: idempotencyKey || null,
          notes: payload.notes || null,
          items: {
            create: orderItemsToCreate,
          },
          payments: {
            create: [
              {
                paymentMethod: payload.paymentMethod || 'CARD',
                amount: total,
                status: 'SUCCESS',
                transactionId: `TXN-SIM-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
              },
            ],
          },
        },
        include: {
          items: true,
          payments: true,
          shippingAddress: true,
        },
      });

      // Clear Customer Cart atomically
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'ORDER_PLACED',
          entityType: 'ORDER',
          entityId: newOrder.id,
          metadata: {
            orderNumber: newOrder.orderNumber,
            total,
            itemsCount: orderItemsToCreate.length,
            paymentStatus: 'SUCCESS',
          },
        },
      });

      return newOrder;
    });

    // 6. Record Idempotency Result if idempotencyKey was provided
    if (idempotencyKey) {
      await prisma.idempotencyRecord.create({
        data: {
          key: idempotencyKey,
          userId,
          requestHash,
          statusCode: 201,
          responseBody: orderResult,
          orderId: orderResult.id,
        },
      });
    }

    return orderResult;
  }

  /**
   * Get paginated customer orders
   */
  async getOrders(userId, { page = 1, limit = 10, status } = {}) {
    const where = { userId };
    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          payments: true,
          shippingAddress: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      orders,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Get single order by ID with ownership check
   */
  async getOrderById(userId, orderId, userRole = 'CUSTOMER') {
    const where = { id: orderId };
    if (userRole !== 'ADMIN') {
      where.userId = userId;
    }

    const order = await prisma.order.findFirst({
      where,
      include: {
        items: true,
        payments: true,
        shippingAddress: true,
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    return order;
  }

  /**
   * Cancel order with exact-once stock restoration
   */
  async cancelOrder(userId, orderId, { reason } = {}, userRole = 'CUSTOMER') {
    const where = { id: orderId };
    if (userRole !== 'ADMIN') {
      where.userId = userId;
    }

    const order = await prisma.order.findFirst({
      where,
      include: {
        items: true,
        payments: true,
      },
    });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    if (order.status === 'CANCELLED') {
      throw ApiError.badRequest('Order is already cancelled');
    }

    // Only orders in PLACED, PAID, or PACKED status can be cancelled
    if (!['PLACED', 'PAID', 'PACKED'].includes(order.status)) {
      throw ApiError.badRequest(`Cannot cancel order in '${order.status}' status (only PLACED, PAID or PACKED orders can be cancelled)`);
    }

    // Atomic cancellation and stock restoration in transaction
    return prisma.$transaction(async (tx) => {
      // 1. Update order status to CANCELLED
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
        include: { items: true, payments: true, shippingAddress: true },
      });

      // 2. Restore inventory exactly once
      for (const item of order.items) {
        if (item.variantId) {
          await tx.$executeRaw`
            UPDATE "ProductVariant"
            SET stock = stock + ${item.quantity}
            WHERE id = ${item.variantId}
          `;
        }

        await tx.$executeRaw`
          UPDATE "Product"
          SET stock = stock + ${item.quantity}
          WHERE id = ${item.productId}
        `;
      }

      // 3. Update successful payments to REFUNDED
      await tx.payment.updateMany({
        where: { orderId, status: 'SUCCESS' },
        data: { status: 'REFUNDED' },
      });

      // 4. Record Audit Log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'ORDER_CANCELLED',
          entityType: 'ORDER',
          entityId: orderId,
          metadata: {
            reason: reason || 'Customer requested cancellation',
            orderNumber: order.orderNumber,
            restoredItemsCount: order.items.length,
          },
        },
      });

      return updatedOrder;
    });
  }

  /**
   * Admin order status update with state machine validation
   */
  async updateOrderStatus(orderId, { status: nextStatus, notes }, adminUserId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, payments: true },
    });

    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    const currentStatus = order.status;

    // Check valid state transition
    const allowedNextStatuses = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowedNextStatuses.includes(nextStatus)) {
      throw ApiError.badRequest(
        `Invalid status transition from '${currentStatus}' to '${nextStatus}'. Allowed transitions: ${allowedNextStatuses.length > 0 ? allowedNextStatuses.join(', ') : 'None (terminal state)'}`
      );
    }

    // If transitioning to CANCELLED, invoke cancelOrder to ensure atomic stock restoration
    if (nextStatus === 'CANCELLED') {
      return this.cancelOrder(adminUserId, orderId, { reason: notes || 'Admin cancelled' }, 'ADMIN');
    }

    // Standard forward state transition
    return prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: nextStatus,
          notes: notes || order.notes,
        },
        include: { items: true, payments: true, shippingAddress: true },
      });

      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'ORDER_STATUS_UPDATED',
          entityType: 'ORDER',
          entityId: orderId,
          metadata: {
            from: currentStatus,
            to: nextStatus,
            orderNumber: order.orderNumber,
          },
        },
      });

      return updated;
    });
  }
}

module.exports = new OrderService();
