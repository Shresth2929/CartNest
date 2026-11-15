const express = require('express');
const orderController = require('../controllers/order.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  checkoutSchema,
  cancelOrderSchema,
  updateOrderStatusSchema,
} = require('../validators/order.validator');

const router = express.Router();

// All order endpoints require authentication
router.use(authenticate);

// Customer endpoints
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.post('/:id/cancel', validate(cancelOrderSchema, 'body'), orderController.cancelOrder);

// Admin-only order status transition endpoint
router.patch('/:id/status', authorize('ADMIN'), validate(updateOrderStatusSchema, 'body'), orderController.updateStatus);

module.exports = router;
