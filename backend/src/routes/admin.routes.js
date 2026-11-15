const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/admin.controller');

// All admin routes require authentication + ADMIN role
router.use(authenticate, authorize('ADMIN'));

// Dashboard
router.get('/dashboard', ctrl.getDashboard);

// Orders
router.get('/orders', ctrl.getOrders);
router.patch('/orders/:id/status', ctrl.updateOrderStatus);

// Products
router.get('/products', ctrl.getProducts);
router.post('/products', ctrl.createProduct);
router.put('/products/:id', ctrl.updateProduct);
router.delete('/products/:id', ctrl.deleteProduct);

// Categories
router.get('/categories', ctrl.getCategories);
router.post('/categories', ctrl.createCategory);
router.put('/categories/:id', ctrl.updateCategory);
router.delete('/categories/:id', ctrl.deleteCategory);

// Customers
router.get('/customers', ctrl.getCustomers);

// Audit Logs
router.get('/audit-logs', ctrl.getAuditLogs);

module.exports = router;
