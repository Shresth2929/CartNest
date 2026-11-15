const { z } = require('zod');

const checkoutSchema = z.object({
  shippingAddressId: z.string().min(1, 'Shipping address ID is required'),
  notes: z.string().trim().max(500, 'Notes cannot exceed 500 characters').optional().nullable(),
  paymentMethod: z.enum(['CARD', 'UPI', 'NET_BANKING', 'COD']).default('CARD'),
  paymentSimulation: z.enum(['SUCCESS', 'FAILED']).default('SUCCESS'),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['PLACED', 'PAID', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  notes: z.string().trim().max(500).optional().nullable(),
});

const cancelOrderSchema = z.object({
  reason: z.string().trim().max(500).optional().nullable(),
});

module.exports = {
  checkoutSchema,
  updateOrderStatusSchema,
  cancelOrderSchema,
};
