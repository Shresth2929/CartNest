const adminService = require('../services/admin.service');
const { sendSuccess } = require('../utils/response');

const handle = (message, action) => async (req, res, next) => {
  try {
    const result = await action(req);
    const data = result && Object.prototype.hasOwnProperty.call(result, 'data') ? result.data : result;
    const meta = result && result.pagination ? result.pagination : null;
    return sendSuccess(res, {
      statusCode: result?.statusCode || 200,
      message,
      data,
      meta,
    });
  } catch (error) {
    return next(error);
  }
};

exports.getDashboard = handle('Dashboard metrics retrieved', () => adminService.getDashboardMetrics());
exports.getReports = handle('Reports retrieved', () => adminService.getReports());

exports.getOrders = handle('Orders retrieved', (req) => adminService.getOrders(req.query));
exports.getOrder = handle('Order retrieved', (req) => adminService.getOrderById(req.params.id));
exports.updateOrderStatus = handle('Order status updated', (req) =>
  adminService.updateOrderStatus(req.params.id, req.body, req.user.id));

exports.getProducts = handle('Products retrieved', (req) => adminService.getProducts(req.query));
exports.createProduct = handle('Product created', async (req) => ({
  statusCode: 201,
  data: await adminService.createProduct(req.body, req.user.id),
}));
exports.updateProduct = handle('Product updated', (req) =>
  adminService.updateProduct(req.params.id, req.body, req.user.id));
exports.deleteProduct = handle('Product deactivated', (req) =>
  adminService.deactivateProduct(req.params.id, req.user.id));

exports.getCategories = handle('Categories retrieved', () => adminService.getCategories());
exports.createCategory = handle('Category created', async (req) => ({
  statusCode: 201,
  data: await adminService.createCategory(req.body, req.user.id),
}));
exports.updateCategory = handle('Category updated', (req) =>
  adminService.updateCategory(req.params.id, req.body, req.user.id));
exports.deleteCategory = handle('Category deleted', (req) =>
  adminService.deleteCategory(req.params.id, req.user.id));

exports.getInventory = handle('Inventory retrieved', (req) => adminService.getInventory(req.query));
exports.adjustInventory = handle('Inventory adjusted', (req) =>
  adminService.adjustInventory(req.body, req.user.id));
exports.getInventoryMovements = handle('Inventory movements retrieved', (req) =>
  adminService.getInventoryMovements(req.query));

exports.getCustomers = handle('Customers retrieved', (req) => adminService.getCustomers(req.query));
exports.getCustomer = handle('Customer retrieved', (req) => adminService.getCustomerById(req.params.id));

exports.getAuditLogs = handle('Audit logs retrieved', (req) => adminService.getAuditLogs(req.query));
