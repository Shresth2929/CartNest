const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const ctrl = require('../controllers/admin.controller');
const {
  uuidSchema,
  adminListQuerySchema,
  createProductSchema,
  updateProductSchema,
  createCategorySchema,
  updateCategorySchema,
  inventoryQuerySchema,
  inventoryAdjustmentSchema,
  customerQuerySchema,
  auditQuerySchema,
  orderStatusSchema,
} = require('../validators/admin.validator');
const { z } = require('zod');

const router = express.Router();
const idParams = z.object({ id: uuidSchema });
const customerParams = idParams;
const orderQuerySchema = adminListQuerySchema;
const productQuerySchema = adminListQuerySchema;
const movementQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
});

router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', ctrl.getDashboard);
router.get('/reports', ctrl.getReports);

router.get('/orders', validate(orderQuerySchema, 'query'), ctrl.getOrders);
router.get('/orders/:id', validate(idParams, 'params'), ctrl.getOrder);
router.patch('/orders/:id/status', validate(idParams, 'params'), validate(orderStatusSchema), ctrl.updateOrderStatus);

router.get('/products', validate(productQuerySchema, 'query'), ctrl.getProducts);
router.post('/products', validate(createProductSchema), ctrl.createProduct);
router.put('/products/:id', validate(idParams, 'params'), validate(updateProductSchema), ctrl.updateProduct);
router.delete('/products/:id', validate(idParams, 'params'), ctrl.deleteProduct);

router.get('/categories', ctrl.getCategories);
router.post('/categories', validate(createCategorySchema), ctrl.createCategory);
router.put('/categories/:id', validate(idParams, 'params'), validate(updateCategorySchema), ctrl.updateCategory);
router.delete('/categories/:id', validate(idParams, 'params'), ctrl.deleteCategory);

router.get('/inventory', validate(inventoryQuerySchema, 'query'), ctrl.getInventory);
router.get('/inventory/movements', validate(movementQuerySchema, 'query'), ctrl.getInventoryMovements);
router.post('/inventory/adjustments', validate(inventoryAdjustmentSchema), ctrl.adjustInventory);

router.get('/customers', validate(customerQuerySchema, 'query'), ctrl.getCustomers);
router.get('/customers/:id', validate(customerParams, 'params'), ctrl.getCustomer);

router.get('/audit-logs', validate(auditQuerySchema, 'query'), ctrl.getAuditLogs);

module.exports = router;
