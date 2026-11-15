const { z } = require('zod');

const productQuerySchema = z.object({
  search: z.string().trim().optional(),
  categoryId: z.string().trim().optional(),
  category: z.string().trim().optional(),
  minPrice: z.coerce.number().min(0, 'Min price cannot be negative').optional(),
  maxPrice: z.coerce.number().min(0, 'Max price cannot be negative').optional(),
  sortBy: z.enum(['price-asc', 'price-desc', 'newest', 'featured', 'name']).optional().default('featured'),
  page: z.coerce.number().int().min(1, 'Page must be at least 1').optional().default(1),
  limit: z.coerce.number().int().min(1).max(50, 'Limit cannot exceed 50').optional().default(12),
});

module.exports = {
  productQuerySchema,
};
