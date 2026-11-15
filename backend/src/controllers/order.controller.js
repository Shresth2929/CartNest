const orderService = require('../services/order.service');
const { sendSuccess } = require('../utils/response');

class OrderController {
  async checkout(req, res, next) {
    try {
      const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey || null;
      const order = await orderService.checkout(req.user.id, req.body, idempotencyKey);

      const statusCode = order.isIdempotentReplay ? 200 : 201;
      const message = order.isIdempotentReplay
        ? 'Order already processed (idempotent replay)'
        : 'Order created and paid successfully';

      return sendSuccess(res, {
        statusCode,
        message,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrders(req, res, next) {
    try {
      const { orders, meta } = await orderService.getOrders(req.user.id, req.query);
      return sendSuccess(res, {
        statusCode: 200,
        message: 'Orders retrieved successfully',
        data: orders,
        meta,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      const order = await orderService.getOrderById(req.user.id, id, req.user.role);
      return sendSuccess(res, {
        statusCode: 200,
        message: 'Order retrieved successfully',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelOrder(req, res, next) {
    try {
      const { id } = req.params;
      const order = await orderService.cancelOrder(req.user.id, id, req.body, req.user.role);
      return sendSuccess(res, {
        statusCode: 200,
        message: 'Order cancelled successfully and inventory restored',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const order = await orderService.updateOrderStatus(id, req.body, req.user.id);
      return sendSuccess(res, {
        statusCode: 200,
        message: `Order status updated to ${order.status}`,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();
