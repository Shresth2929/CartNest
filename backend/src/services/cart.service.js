const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');

class CartService {
  /**
   * Helper to ensure user has a cart in DB
   */
  async getOrCreateCart(userId) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    return cart;
  }

  /**
   * Format cart items with calculated prices and availability status
   */
  formatCart(cart) {
    let totalItems = 0;
    let subtotal = 0;
    let hasUnavailableItems = false;

    const formattedItems = (cart.items || []).map((item) => {
      const basePrice = Number(item.product.basePrice);
      const adjustment = item.variant ? Number(item.variant.priceAdjustment) : 0;
      const unitPrice = Number((basePrice + adjustment).toFixed(2));
      const itemSubtotal = Number((unitPrice * item.quantity).toFixed(2));

      const availableStock = item.variant ? item.variant.stock : item.product.stock;
      const isAvailable = item.product.isActive && availableStock >= item.quantity;

      if (!isAvailable) {
        hasUnavailableItems = true;
      }

      totalItems += item.quantity;
      subtotal += itemSubtotal;

      return {
        id: item.id,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.product.name,
        productSlug: item.product.slug,
        productImage: item.product.images[0] || null,
        variantName: item.variant ? item.variant.name : null,
        variantSku: item.variant ? item.variant.sku : item.product.sku,
        unitPrice,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        availableStock,
        isAvailable,
        isActive: item.product.isActive,
      };
    });

    return {
      id: cart.id,
      userId: cart.userId,
      items: formattedItems,
      totalItems,
      subtotal: Number(subtotal.toFixed(2)),
      hasUnavailableItems,
      updatedAt: cart.updatedAt,
    };
  }

  async getCart(userId) {
    const cart = await this.getOrCreateCart(userId);

    const fullCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                basePrice: true,
                images: true,
                stock: true,
                isActive: true,
                sku: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                sku: true,
                priceAdjustment: true,
                stock: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return this.formatCart(fullCart);
  }

  async addItem(userId, { productId, variantId, quantity }) {
    const cart = await this.getOrCreateCart(userId);

    // 1. Verify product existence and status
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isActive) {
      throw ApiError.badRequest('Product is not available for purchase');
    }

    // 2. Verify variant if specified
    let variant = null;
    if (variantId) {
      variant = await prisma.productVariant.findFirst({
        where: { id: variantId, productId },
      });
      if (!variant) {
        throw ApiError.badRequest('Selected product variant does not exist');
      }
    }

    // 3. Determine available stock
    const availableStock = variant ? variant.stock : product.stock;
    if (availableStock <= 0) {
      throw ApiError.badRequest('This product is currently out of stock');
    }

    // 4. Check if item already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        variantId: variantId || null,
      },
    });

    const targetQuantity = existingItem ? existingItem.quantity + quantity : quantity;

    if (targetQuantity > availableStock) {
      throw ApiError.badRequest(
        `Cannot add ${quantity} more item(s). Only ${availableStock} unit(s) available in stock (you have ${existingItem ? existingItem.quantity : 0} in cart)`
      );
    }

    // 5. Update or create cart item
    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: targetQuantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId: variantId || null,
          quantity,
        },
      });
    }

    return this.getCart(userId);
  }

  async updateItem(userId, itemId, { quantity }) {
    const cart = await this.getOrCreateCart(userId);

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: {
        product: true,
        variant: true,
      },
    });

    if (!cartItem) {
      throw ApiError.notFound('Cart item not found in your cart');
    }

    if (!cartItem.product.isActive) {
      throw ApiError.badRequest('This product is no longer active');
    }

    const availableStock = cartItem.variant ? cartItem.variant.stock : cartItem.product.stock;

    if (quantity > availableStock) {
      throw ApiError.badRequest(`Requested quantity (${quantity}) exceeds available stock (${availableStock})`);
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return this.getCart(userId);
  }

  async removeItem(userId, itemId) {
    const cart = await this.getOrCreateCart(userId);

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });

    if (!cartItem) {
      throw ApiError.notFound('Cart item not found in your cart');
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    return this.getCart(userId);
  }

  async clearCart(userId) {
    const cart = await this.getOrCreateCart(userId);

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return this.getCart(userId);
  }
}

module.exports = new CartService();
