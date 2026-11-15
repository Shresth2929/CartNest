const cartService = require('../services/cart.service');
const { sendSuccess } = require('../utils/response');

class CartController {
  async getCart(req, res, next) {
    try {
      const cart = await cartService.getCart(req.user.id);
      return sendSuccess(res, {
        statusCode: 200,
        message: 'Cart retrieved successfully',
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  async addItem(req, res, next) {
    try {
      const cart = await cartService.addItem(req.user.id, req.body);
      return sendSuccess(res, {
        statusCode: 200,
        message: 'Item added to cart',
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateItem(req, res, next) {
    try {
      const { itemId } = req.params;
      const { quantity } = req.body;
      const cart = await cartService.updateItem(req.user.id, itemId, { quantity });
      return sendSuccess(res, {
        statusCode: 200,
        message: 'Cart item updated',
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  async removeItem(req, res, next) {
    try {
      const { itemId } = req.params;
      const cart = await cartService.removeItem(req.user.id, itemId);
      return sendSuccess(res, {
        statusCode: 200,
        message: 'Item removed from cart',
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  async clearCart(req, res, next) {
    try {
      const cart = await cartService.clearCart(req.user.id);
      return sendSuccess(res, {
        statusCode: 200,
        message: 'Cart cleared successfully',
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CartController();
