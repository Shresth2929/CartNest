const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'CartNest E-Commerce Platform API',
    version: '1.0.0',
    description: 'RESTful API documentation for CartNest E-Commerce Platform. Includes Authentication, Customer Profile & Addresses, Product Catalog, and Persistent Cart.',
    contact: {
      name: 'CartNest Engineering Team',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'Current Environment API Server',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT Bearer token obtained from /auth/login or /auth/register',
      },
    },
    schemas: {
      ApiResponseSuccess: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation successful' },
          data: { type: 'object' },
        },
      },
      ApiResponseError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Error message' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          role: { type: 'string', enum: ['CUSTOMER', 'ADMIN'] },
          phone: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Address: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          fullName: { type: 'string', example: 'Aarav Sharma' },
          addressLine1: { type: 'string', example: 'Flat 402, Green Meadows Apt' },
          addressLine2: { type: 'string', nullable: true, example: 'Indiranagar' },
          city: { type: 'string', example: 'Bengaluru' },
          state: { type: 'string', example: 'Karnataka' },
          postalCode: { type: 'string', example: '560038' },
          country: { type: 'string', example: 'India' },
          phone: { type: 'string', example: '+91 98765 43210' },
          isDefault: { type: 'boolean', example: true },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string' },
          basePrice: { type: 'number', example: 2499.00 },
          categoryId: { type: 'string' },
          images: { type: 'array', items: { type: 'string' } },
          sku: { type: 'string' },
          stock: { type: 'integer' },
          isFeatured: { type: 'boolean' },
          isActive: { type: 'boolean' },
        },
      },
      CartItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          productId: { type: 'string', format: 'uuid' },
          variantId: { type: 'string', format: 'uuid', nullable: true },
          productName: { type: 'string' },
          productSlug: { type: 'string' },
          productImage: { type: 'string', nullable: true },
          unitPrice: { type: 'number', example: 2499.00 },
          quantity: { type: 'integer', example: 1 },
          subtotal: { type: 'number', example: 2499.00 },
          availableStock: { type: 'integer', example: 25 },
          isAvailable: { type: 'boolean', example: true },
        },
      },
      Cart: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          items: { type: 'array', items: { $ref: '#/components/schemas/CartItem' } },
          totalItems: { type: 'integer', example: 2 },
          subtotal: { type: 'number', example: 4998.00 },
          hasUnavailableItems: { type: 'boolean', example: false },
        },
      },
      OrderItem: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          productId: { type: 'string', format: 'uuid' },
          variantId: { type: 'string', format: 'uuid', nullable: true },
          productName: { type: 'string' },
          variantName: { type: 'string', nullable: true },
          unitPrice: { type: 'number', example: 2499.00 },
          quantity: { type: 'integer', example: 1 },
          subtotal: { type: 'number', example: 2499.00 },
        },
      },
      Payment: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          orderId: { type: 'string', format: 'uuid' },
          paymentMethod: { type: 'string', example: 'CARD' },
          amount: { type: 'number', example: 2948.82 },
          status: { type: 'string', enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'] },
          transactionId: { type: 'string', example: 'TXN-SIM-20261115-001' },
          failureReason: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          orderNumber: { type: 'string', example: 'CN-M3X89-2045' },
          userId: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['PLACED', 'PAID', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] },
          subtotal: { type: 'number', example: 2499.00 },
          tax: { type: 'number', example: 449.82 },
          shippingFee: { type: 'number', example: 0.00 },
          discount: { type: 'number', example: 0.00 },
          total: { type: 'number', example: 2948.82 },
          shippingAddressId: { type: 'string', format: 'uuid' },
          idempotencyKey: { type: 'string', nullable: true },
          notes: { type: 'string', nullable: true },
          items: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
          payments: { type: 'array', items: { $ref: '#/components/schemas/Payment' } },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      CheckoutRequest: {
        type: 'object',
        required: ['shippingAddressId'],
        properties: {
          shippingAddressId: { type: 'string', format: 'uuid' },
          notes: { type: 'string', example: 'Leave with security' },
          paymentMethod: { type: 'string', enum: ['CARD', 'UPI', 'NET_BANKING', 'COD'], default: 'CARD' },
          paymentSimulation: { type: 'string', enum: ['SUCCESS', 'FAILED'], default: 'SUCCESS' },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new customer account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Priya Patel' },
                  email: { type: 'string', format: 'email', example: 'priya@example.com' },
                  password: { type: 'string', minLength: 8, example: 'SecurePassword123!' },
                  phone: { type: 'string', example: '+91 91234 56789' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Account registered successfully',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponseSuccess' } } },
          },
          400: { description: 'Validation failed' },
          409: { description: 'Email already exists' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Authenticate user and obtain JWT token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'customer@cartnest.com' },
                  password: { type: 'string', example: 'CustomerPassword123!' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponseSuccess' } } },
          },
          401: { description: 'Invalid email or password' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Retrieve authenticated user profile',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Current user profile',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponseSuccess' } } },
          },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/addresses': {
      get: {
        tags: ['Address Book'],
        summary: 'Get all addresses for authenticated customer',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'List of addresses' },
          401: { description: 'Unauthorized' },
        },
      },
      post: {
        tags: ['Address Book'],
        summary: 'Add a new shipping address',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fullName', 'addressLine1', 'city', 'state', 'postalCode', 'phone'],
                properties: {
                  fullName: { type: 'string', example: 'Aarav Sharma' },
                  addressLine1: { type: 'string', example: 'Flat 402, Green Meadows Apt' },
                  addressLine2: { type: 'string', example: 'Indiranagar' },
                  city: { type: 'string', example: 'Bengaluru' },
                  state: { type: 'string', example: 'Karnataka' },
                  postalCode: { type: 'string', example: '560038' },
                  country: { type: 'string', example: 'India' },
                  phone: { type: 'string', example: '+91 98765 43210' },
                  isDefault: { type: 'boolean', example: true },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Address created' },
          400: { description: 'Validation error' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/addresses/{id}': {
      put: {
        tags: ['Address Book'],
        summary: 'Update an existing address',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  fullName: { type: 'string' },
                  addressLine1: { type: 'string' },
                  city: { type: 'string' },
                  state: { type: 'string' },
                  postalCode: { type: 'string' },
                  phone: { type: 'string' },
                  isDefault: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Address updated' },
          404: { description: 'Address not found' },
        },
      },
      delete: {
        tags: ['Address Book'],
        summary: 'Delete an address',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Address deleted' },
          404: { description: 'Address not found' },
        },
      },
    },
    '/products': {
      get: {
        tags: ['Product Catalog'],
        summary: 'Search, filter and paginate products',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search term for name/description' },
          { name: 'categoryId', in: 'query', schema: { type: 'string' }, description: 'Filter by category ID' },
          { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Filter by category slug' },
          { name: 'minPrice', in: 'query', schema: { type: 'number' }, description: 'Minimum base price' },
          { name: 'maxPrice', in: 'query', schema: { type: 'number' }, description: 'Maximum base price' },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['featured', 'newest', 'price-asc', 'price-desc', 'name'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 12 } },
        ],
        responses: {
          200: { description: 'List of matching products with pagination metadata' },
        },
      },
    },
    '/products/{slug}': {
      get: {
        tags: ['Product Catalog'],
        summary: 'Get product details by slug',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Product details with variants' },
          404: { description: 'Product not found' },
        },
      },
    },
    '/categories': {
      get: {
        tags: ['Product Catalog'],
        summary: 'List all active product categories',
        responses: {
          200: { description: 'List of categories with active product count' },
        },
      },
    },
    '/cart': {
      get: {
        tags: ['Shopping Cart'],
        summary: 'Get customer persistent cart with real-time calculated prices',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Cart content with subtotal and item availability' },
          401: { description: 'Unauthorized' },
        },
      },
      delete: {
        tags: ['Shopping Cart'],
        summary: 'Clear all items from shopping cart',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Cart cleared' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/cart/items': {
      post: {
        tags: ['Shopping Cart'],
        summary: 'Add an item to the shopping cart',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['productId'],
                properties: {
                  productId: { type: 'string', format: 'uuid' },
                  variantId: { type: 'string', format: 'uuid', nullable: true },
                  quantity: { type: 'integer', default: 1, minimum: 1 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Item added to cart' },
          400: { description: 'Insufficient stock or invalid product' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/cart/items/{itemId}': {
      put: {
        tags: ['Shopping Cart'],
        summary: 'Update quantity of an item in the cart',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'itemId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['quantity'],
                properties: {
                  quantity: { type: 'integer', minimum: 1, maximum: 50 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Cart item updated' },
          400: { description: 'Insufficient stock' },
          404: { description: 'Item not found in cart' },
        },
      },
      delete: {
        tags: ['Shopping Cart'],
        summary: 'Remove an item from the cart',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'itemId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Item removed from cart' },
          404: { description: 'Item not found in cart' },
        },
      },
    },
    '/checkout': {
      post: {
        tags: ['Checkout & Orders'],
        summary: 'Process transactional checkout with idempotency and atomic stock deduction',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'Idempotency-Key',
            in: 'header',
            required: false,
            schema: { type: 'string' },
            description: 'Unique client-supplied idempotency key (UUID or string) to prevent duplicate orders on retry',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CheckoutRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Order placed, payment confirmed and cart cleared successfully',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponseSuccess' } } },
          },
          200: { description: 'Idempotent replay of previously confirmed order' },
          400: { description: 'Empty cart, insufficient stock, or simulated payment failure' },
          409: { description: 'Same idempotency key with conflicting request payload' },
        },
      },
    },
    '/orders': {
      get: {
        tags: ['Checkout & Orders'],
        summary: 'List customer orders with status filter and pagination',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['PLACED', 'PAID', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          200: { description: 'Paginated customer orders' },
        },
      },
    },
    '/orders/{id}': {
      get: {
        tags: ['Checkout & Orders'],
        summary: 'Retrieve single order details',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Order details with items, payment and shipping address' },
          404: { description: 'Order not found' },
        },
      },
    },
    '/orders/{id}/cancel': {
      post: {
        tags: ['Checkout & Orders'],
        summary: 'Cancel an eligible order (PLACED, PAID, PACKED) and restore stock exactly once',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  reason: { type: 'string', example: 'Changed my mind' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Order cancelled, inventory restored, payment marked as refunded' },
          400: { description: 'Order is not in a cancellable status or is already cancelled' },
          404: { description: 'Order not found' },
        },
      },
    },
    '/orders/{id}/status': {
      patch: {
        tags: ['Checkout & Orders'],
        summary: 'Admin-only: update order status following valid state transition rules',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['PLACED', 'PAID', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Order status updated' },
          400: { description: 'Invalid state machine transition' },
          403: { description: 'Requires ADMIN privilege' },
        },
      },
    },
  },
};

function setupSwagger(app) {
  // Raw JSON spec endpoint (registered before swaggerUi.serve)
  app.get('/api/docs/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(swaggerDocument);
  });

  // Swagger UI docs endpoint
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customSiteTitle: 'CartNest API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
  }));
}

module.exports = {
  setupSwagger,
  swaggerDocument,
};
