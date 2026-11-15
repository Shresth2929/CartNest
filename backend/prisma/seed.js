const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding CartNest database...');

  // Clean existing data in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  // 1. Users
  const adminPasswordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'AdminPassword123!', 10);
  const customerPasswordHash = await bcrypt.hash(process.env.DEMO_CUSTOMER_PASSWORD || 'CustomerPassword123!', 10);

  const admin = await prisma.user.create({
    data: {
      email: process.env.ADMIN_EMAIL || 'admin@cartnest.com',
      passwordHash: adminPasswordHash,
      name: 'Admin Supervisor',
      role: 'ADMIN',
      phone: '+91 98000 11223',
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: process.env.DEMO_CUSTOMER_EMAIL || 'customer@cartnest.com',
      passwordHash: customerPasswordHash,
      name: 'Aarav Sharma',
      role: 'CUSTOMER',
      phone: '+91 98765 43210',
    },
  });

  console.log(`Created admin user: ${admin.email}`);
  console.log(`Created demo customer user: ${customer.email}`);

  // 2. Addresses
  const address = await prisma.address.create({
    data: {
      userId: customer.id,
      fullName: 'Aarav Sharma',
      addressLine1: 'Flat 402, Green Meadows Apt, 14th Main',
      addressLine2: 'Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560038',
      country: 'India',
      phone: '+91 98765 43210',
      isDefault: true,
    },
  });

  // 3. Categories
  const categories = [
    {
      name: 'Living & Workspace',
      slug: 'living-workspace',
      description: 'Ergonomic, natural wooden essentials and workspace accents.',
      imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Kitchen & Dining',
      slug: 'kitchen-dining',
      description: 'Artisanal ceramics, stoneware, and linen tabletop dining wares.',
      imageUrl: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Home Organizers',
      slug: 'home-organizers',
      description: 'Mindful storage boxes, woven canvas bins, and modular racks.',
      imageUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Aromatics & Wellness',
      slug: 'aromatics-wellness',
      description: 'Botanical soy candles, cold-pressed diffusers, and soothing incense.',
      imageUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const createdCategories = {};
  for (const cat of categories) {
    const created = await prisma.category.create({ data: cat });
    createdCategories[cat.slug] = created;
  }

  // 4. Products & Variants
  const products = [
    {
      name: 'Nordic Oak Monitor Stand',
      slug: 'nordic-oak-monitor-stand',
      description: 'Handcrafted solid oak desktop stand with brushed brass cable guide. Elevates monitors to eye level while keeping notebooks tucked away neatly.',
      basePrice: 2499.00,
      categoryId: createdCategories['living-workspace'].id,
      images: [
        'https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
      ],
      sku: 'LIV-OAK-01',
      stock: 45,
      isFeatured: true,
      variants: [
        { name: 'Natural Oak - Standard (80cm)', sku: 'LIV-OAK-01-STD', priceAdjustment: 0.00, stock: 25, attributes: { finish: 'Natural Oak', width: '80cm' } },
        { name: 'Walnut Tint - Wide (105cm)', sku: 'LIV-OAK-01-WIDE', priceAdjustment: 500.00, stock: 20, attributes: { finish: 'Walnut Tint', width: '105cm' } },
      ],
    },
    {
      name: 'Matte Stoneware Coffee Dripper Set',
      slug: 'matte-stoneware-coffee-dripper-set',
      description: 'Double-glazed ceramic pour-over cone paired with a 500ml ribbed heat-resistant server. Designed for slow mornings and clean flavor extraction.',
      basePrice: 1850.00,
      categoryId: createdCategories['kitchen-dining'].id,
      images: [
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
      ],
      sku: 'KIT-DRIP-02',
      stock: 30,
      isFeatured: true,
      variants: [
        { name: 'Chalk White', sku: 'KIT-DRIP-02-WHT', priceAdjustment: 0.00, stock: 15, attributes: { color: 'Chalk White' } },
        { name: 'Basalt Charcoal', sku: 'KIT-DRIP-02-BLK', priceAdjustment: 0.00, stock: 15, attributes: { color: 'Basalt Charcoal' } },
      ],
    },
    {
      name: 'Cedar & Amber Botanical Candle',
      slug: 'cedar-amber-botanical-candle',
      description: 'Slow-poured 100% soy wax candle with wooden crackling wick. Notes of atlas cedarwood, dark amber, and toasted cardamom.',
      basePrice: 950.00,
      categoryId: createdCategories['aromatics-wellness'].id,
      images: [
        'https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=800&q=80',
      ],
      sku: 'ARO-CND-03',
      stock: 60,
      isFeatured: true,
      variants: [
        { name: 'Amber Glass Jar (220g)', sku: 'ARO-CND-03-220', priceAdjustment: 0.00, stock: 35, attributes: { size: '220g' } },
        { name: 'Large Ceramic Vessel (400g)', sku: 'ARO-CND-03-400', priceAdjustment: 450.00, stock: 25, attributes: { size: '400g' } },
      ],
    },
    {
      name: 'Woven Cotton Storage Cube',
      slug: 'woven-cotton-storage-cube',
      description: 'Structured thick cotton cord basket with genuine saddle-stitched leather pull handles. Fits standard cube shelving units.',
      basePrice: 1290.00,
      categoryId: createdCategories['home-organizers'].id,
      images: [
        'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80',
      ],
      sku: 'ORG-CUBE-04',
      stock: 40,
      isFeatured: false,
      variants: [
        { name: 'Oatmeal Natural', sku: 'ORG-CUBE-04-NAT', priceAdjustment: 0.00, stock: 20, attributes: { color: 'Natural' } },
        { name: 'Forest Green', sku: 'ORG-CUBE-04-GRN', priceAdjustment: 50.00, stock: 20, attributes: { color: 'Forest Green' } },
      ],
    },
    {
      name: 'Minimalist Brass Desk Lamp',
      slug: 'minimalist-brass-desk-lamp',
      description: 'Warm 2700K integrated LED lamp with knurled dimmer switch and weighted sand-cast iron base.',
      basePrice: 3899.00,
      categoryId: createdCategories['living-workspace'].id,
      images: [
        'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
      ],
      sku: 'LIV-LAMP-05',
      stock: 18,
      isFeatured: true,
      variants: [],
    },
    {
      name: 'Raw Linen Table Runner',
      slug: 'raw-linen-table-runner',
      description: 'Washed European flax linen with frayed edge detail. Softened through stonewashing for an effortless organic drape.',
      basePrice: 1150.00,
      categoryId: createdCategories['kitchen-dining'].id,
      images: [
        'https://images.unsplash.com/photo-1584990347449-a681c7f1a307?auto=format&fit=crop&w=800&q=80',
      ],
      sku: 'KIT-RUN-06',
      stock: 35,
      isFeatured: false,
      variants: [
        { name: 'Natural Sand (180cm)', sku: 'KIT-RUN-06-S18', priceAdjustment: 0.00, stock: 20, attributes: { length: '180cm' } },
        { name: 'Natural Sand (240cm)', sku: 'KIT-RUN-06-S24', priceAdjustment: 200.00, stock: 15, attributes: { length: '240cm' } },
      ],
    },
    {
      name: 'Ceramic Ultrasonic Diffuser',
      slug: 'ceramic-ultrasonic-diffuser',
      description: 'Whisper-quiet cold mist aromatic diffuser housed in a fluted porcelain dome. Features 4-hour continuous or 8-hour interval diffusion.',
      basePrice: 2890.00,
      categoryId: createdCategories['aromatics-wellness'].id,
      images: [
        'https://images.unsplash.com/photo-1602928321679-560bb453f190?auto=format&fit=crop&w=800&q=80',
      ],
      sku: 'ARO-DIF-07',
      stock: 22,
      isFeatured: true,
      variants: [],
    },
    {
      name: 'Stackable Birch Wood Tray Organizers',
      slug: 'stackable-birch-wood-tray-organizers',
      description: 'Set of 3 interlocking drawer trays carved from FSC-certified sustainable birch veneer.',
      basePrice: 1490.00,
      categoryId: createdCategories['home-organizers'].id,
      images: [
        'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
      ],
      sku: 'ORG-TRAY-08',
      stock: 50,
      isFeatured: false,
      variants: [],
    },
  ];

  const createdProducts = [];
  for (const prodData of products) {
    const { variants, ...prodFields } = prodData;
    const prod = await prisma.product.create({
      data: {
        ...prodFields,
        variants: {
          create: variants,
        },
      },
      include: {
        variants: true,
      },
    });
    createdProducts.push(prod);
  }

  console.log(`Created ${createdProducts.length} products with variants.`);

  // 5. Initial Cart for demo customer
  const cart = await prisma.cart.create({
    data: {
      userId: customer.id,
      items: {
        create: [
          {
            productId: createdProducts[0].id,
            variantId: createdProducts[0].variants[0]?.id || null,
            quantity: 1,
          },
        ],
      },
    },
  });
  console.log(`Created cart with initial item for customer: ${customer.email}`);

  // 6. Sample Initial Completed Order for Realistic Admin Metrics
  const sampleOrder = await prisma.order.create({
    data: {
      orderNumber: 'CN-20261114-1001',
      userId: customer.id,
      status: 'DELIVERED',
      subtotal: 2499.00,
      tax: 449.82,
      shippingFee: 0.00,
      discount: 0.00,
      total: 2948.82,
      shippingAddressId: address.id,
      notes: 'Please leave with security if unavailable.',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      items: {
        create: [
          {
            productId: createdProducts[0].id,
            variantId: createdProducts[0].variants[0]?.id || null,
            productName: createdProducts[0].name,
            variantName: createdProducts[0].variants[0]?.name || null,
            unitPrice: 2499.00,
            quantity: 1,
            subtotal: 2499.00,
          },
        ],
      },
      payments: {
        create: [
          {
            paymentMethod: 'CARD',
            amount: 2948.82,
            status: 'SUCCESS',
            transactionId: 'TXN-SIM-20261114-001',
          },
        ],
      },
    },
  });

  // 7. Seed Initial Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'SYSTEM_SEED',
        entityType: 'SYSTEM',
        entityId: 'SYSTEM',
        metadata: { info: 'Initial database seed with catalog and demo accounts' },
      },
      {
        userId: customer.id,
        action: 'ORDER_PLACED',
        entityType: 'ORDER',
        entityId: sampleOrder.id,
        metadata: { orderNumber: sampleOrder.orderNumber, total: 2948.82 },
      },
    ],
  });

  console.log('Database seeding successfully finished!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
