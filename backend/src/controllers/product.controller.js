const productService = require('../services/product.service');
const { sendSuccess } = require('../utils/response');

class ProductController {
  async getProducts(req, res, next) {
    try {
      const { products, meta } = await productService.getProducts(req.query);
      return sendSuccess(res, {
        statusCode: 200,
        message: 'Products retrieved successfully',
        data: products,
        meta,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const product = await productService.getProductBySlug(slug);
      return sendSuccess(res, {
        statusCode: 200,
        message: 'Product retrieved successfully',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategories(req, res, next) {
    try {
      const categories = await productService.getCategories();
      return sendSuccess(res, {
        statusCode: 200,
        message: 'Categories retrieved successfully',
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();
