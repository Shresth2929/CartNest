const { z } = require('zod');

const addToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional().nullable(),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').max(50, 'Max quantity per item is 50').default(1),
});

const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').max(50, 'Max quantity per item is 50'),
});

module.exports = {
  addToCartSchema,
  updateCartItemSchema,
};
