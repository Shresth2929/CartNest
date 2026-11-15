const { z } = require('zod');

const createAddressSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
  addressLine1: z.string().trim().min(3, 'Address line 1 must be at least 3 characters').max(200),
  addressLine2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(2, 'City is required').max(100),
  state: z.string().trim().min(2, 'State is required').max(100),
  postalCode: z.string().trim().min(3, 'Postal code is required').max(20),
  country: z.string().trim().min(2).max(100).default('India'),
  phone: z.string().trim().min(5, 'Valid phone number is required').max(20),
  isDefault: z.boolean().optional().default(false),
});

const updateAddressSchema = createAddressSchema.partial();

module.exports = {
  createAddressSchema,
  updateAddressSchema,
};
