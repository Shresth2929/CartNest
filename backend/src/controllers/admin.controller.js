const adminService = require('../services/admin.service');
const { sendSuccess } = require('../utils/response');

// Dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const data = await adminService.getDashboardMetrics();
    sendSuccess(res, data, 'Dashboard metrics');
  } catch (err) { next(err); }
};

// Orders
exports.getOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const data = await adminService.getOrders({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      search,
    });
    sendSuccess(res, data, 'Orders retrieved');
  } catch (err) { next(err); }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const order = await adminService.updateOrderStatus(id, status);
    sendSuccess(res, { order }, 'Order status updated');
  } catch (err) { next(err); }
};

// Products
exports.getProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, categoryId, isActive } = req.query;
    const data = await adminService.getProducts({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      categoryId,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
    sendSuccess(res, data, 'Products retrieved');
  } catch (err) { next(err); }
};

exports.createProduct = async (req, res, next) => {
  try {
    const product = await adminService.createProduct(req.body);
    sendSuccess(res, { product }, 'Product created', 201);
  } catch (err) { next(err); }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await adminService.updateProduct(req.params.id, req.body);
    sendSuccess(res, { product }, 'Product updated');
  } catch (err) { next(err); }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const result = await adminService.deleteProduct(req.params.id);
    sendSuccess(res, result, result.message);
  } catch (err) { next(err); }
};

// Categories
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await adminService.getCategories();
    sendSuccess(res, { categories }, 'Categories retrieved');
  } catch (err) { next(err); }
};

exports.createCategory = async (req, res, next) => {
  try {
    const category = await adminService.createCategory(req.body);
    sendSuccess(res, { category }, 'Category created', 201);
  } catch (err) { next(err); }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const category = await adminService.updateCategory(req.params.id, req.body);
    sendSuccess(res, { category }, 'Category updated');
  } catch (err) { next(err); }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const result = await adminService.deleteCategory(req.params.id);
    sendSuccess(res, result, result.message);
  } catch (err) { next(err); }
};

// Customers
exports.getCustomers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const data = await adminService.getCustomers({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
    });
    sendSuccess(res, data, 'Customers retrieved');
  } catch (err) { next(err); }
};

// Audit Logs
exports.getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, action, userId } = req.query;
    const data = await adminService.getAuditLogs({
      page: parseInt(page),
      limit: parseInt(limit),
      action,
      userId,
    });
    sendSuccess(res, data, 'Audit logs retrieved');
  } catch (err) { next(err); }
};
