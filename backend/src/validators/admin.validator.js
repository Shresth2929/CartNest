const { z } = require('zod');

const uuidSchema = z.string().uuid();
const pageSchema = z.coerce.number().int().min(1).default(1);
const limitSchema = z.coerce.number().int().min(1).max(100).default(20);

const adminListQuerySchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  search: z.string().trim().max(100).optional(),
  status: z.enum(['PLACED', 'PAID', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  categoryId: uuidSchema.optional(),
  isActive: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
});

const productVariantSchema = z.object({
  id: uuidSchema.optional(),
  name: z.string().trim().min(1).max(120),
  sku: z.string().trim().min(1).max(80),
  priceAdjustment: z.coerce.number().finite().min(-999999).max(999999),
  stock: z.coerce.number().int().min(0).optional(),
  attributes: z.record(z.unknown()).optional(),
}).strict();

const productFields = {
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),
  description: z.string().trim().min(1).max(5000),
  basePrice: z.coerce.number().finite().positive().max(99999999),
  categoryId: uuidSchema,
  images: z.array(z.string().url().max(2048)).max(12),
  sku: z.string().trim().min(1).max(80),
  stock: z.coerce.number().int().min(0),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  variants: z.array(productVariantSchema).max(50).optional(),
};

const createProductSchema = z.object({
  ...productFields,
  stock: productFields.stock.default(0),
  images: productFields.images.default([]),
}).strict();

const updateProductSchema = z.object({
  name: productFields.name.optional(),
  slug: productFields.slug.optional(),
  description: productFields.description.optional(),
  basePrice: productFields.basePrice.optional(),
  categoryId: productFields.categoryId.optional(),
  images: productFields.images.optional(),
  sku: productFields.sku.optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
  variants: productFields.variants,
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one product field is required');

const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  description: z.string().trim().max(1000).optional().nullable(),
  imageUrl: z.string().url().max(2048).optional().nullable(),
  isActive: z.boolean().default(true),
}).strict();

const updateCategorySchema = createCategorySchema.partial().strict()
  .refine((value) => Object.keys(value).length > 0, 'At least one category field is required');

const inventoryQuerySchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  search: z.string().trim().max(100).optional(),
  lowStockOnly: z.enum(['true', 'false']).optional().transform((value) => value === 'true'),
  threshold: z.coerce.number().int().min(0).max(10000).default(10),
});

const inventoryAdjustmentSchema = z.object({
  productId: uuidSchema,
  variantId: uuidSchema.optional().nullable(),
  delta: z.number().int().min(-100000).max(100000).refine((value) => value !== 0, 'Adjustment must not be zero'),
  reason: z.string().trim().min(3).max(300),
}).strict();

const customerQuerySchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  search: z.string().trim().max(100).optional(),
});

const auditQuerySchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  action: z.string().trim().max(100).optional(),
  entityType: z.string().trim().max(60).optional(),
});

const orderStatusSchema = z.object({
  status: z.enum(['PLACED', 'PAID', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  notes: z.string().trim().max(500).optional().nullable(),
}).strict();

module.exports = {
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
};
