require('dotenv').config();
const { Prisma, PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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

const products = [
  {
    name: 'Nordic Oak Monitor Stand',
    slug: 'nordic-oak-monitor-stand',
    description: 'Handcrafted solid oak desktop stand with brushed brass cable guide. Elevates monitors to eye level while keeping notebooks tucked away neatly.',
    basePrice: 2499.00,
    categorySlug: 'living-workspace',
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
    categorySlug: 'kitchen-dining',
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
    categorySlug: 'aromatics-wellness',
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
    categorySlug: 'home-organizers',
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
    categorySlug: 'living-workspace',
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
    categorySlug: 'kitchen-dining',
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
    categorySlug: 'aromatics-wellness',
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
    categorySlug: 'home-organizers',
    images: [
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
    ],
    sku: 'ORG-TRAY-08',
    stock: 50,
    isFeatured: false,
    variants: [],
  },
];

const models = [
  'user',
  'address',
  'category',
  'product',
  'productVariant',
  'cart',
  'cartItem',
  'order',
  'orderItem',
  'payment',
  'auditLog',
  'inventoryMovement',
  'orderStatusHistory',
  'idempotencyRecord',
];

async function main() {
  const result = await prisma.$transaction(async (transaction) => {
    const counts = await Promise.all(models.map(async (model) => ({
      model,
      count: await transaction[model].count(),
    })));
    const nonEmptyModels = counts.filter(({ count }) => count > 0);

    if (nonEmptyModels.length > 0) {
      throw new Error(`Refusing to seed a non-empty database (${nonEmptyModels.map(({ model }) => model).join(', ')}).`);
    }

    const categoryBySlug = new Map();
    for (const category of categories) {
      const created = await transaction.category.create({ data: category });
      categoryBySlug.set(category.slug, created);
    }

    for (const product of products) {
      const { categorySlug, variants, ...fields } = product;
      const category = categoryBySlug.get(categorySlug);
      if (!category) {
        throw new Error(`Unknown category slug for product ${product.slug}.`);
      }

      await transaction.product.create({
        data: {
          ...fields,
          categoryId: category.id,
          variants: { create: variants },
        },
      });
    }

    return { categories: categories.length, products: products.length };
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 10000,
    timeout: 30000,
  });

  console.log(`Catalog seeded successfully: ${result.categories} categories and ${result.products} products.`);
}

if (require.main === module) {
  main()
    .catch((error) => {
      const message = error.message.replace(/postgres(?:ql)?:\/\/\S+/gi, '[redacted database URL]');
      console.error(`Catalog seed failed (${error.name}): ${message}`);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
