const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');

class ProductService {
  async getProducts(params = {}) {
    const {
      search,
      categoryId,
      category,
      minPrice,
      maxPrice,
      sortBy = 'featured',
      page = 1,
      limit = 12,
    } = params;

    // Build Prisma where clause
    const where = {
      isActive: true,
    };

    if (search && search.trim() !== '') {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    } else if (category) {
      where.category = { slug: category.trim() };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {};
      if (minPrice !== undefined) where.basePrice.gte = minPrice;
      if (maxPrice !== undefined) where.basePrice.lte = maxPrice;
    }

    // Build Prisma orderBy clause
    let orderBy = [];
    switch (sortBy) {
      case 'price-asc':
        orderBy = [{ basePrice: 'asc' }];
        break;
      case 'price-desc':
        orderBy = [{ basePrice: 'desc' }];
        break;
      case 'newest':
        orderBy = [{ createdAt: 'desc' }];
        break;
      case 'name':
        orderBy = [{ name: 'asc' }];
        break;
      case 'featured':
      default:
        orderBy = [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
        break;
    }

    const skip = (page - 1) * limit;

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          variants: {
            select: {
              id: true,
              name: true,
              sku: true,
              priceAdjustment: true,
              stock: true,
              attributes: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      products,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async getProductBySlug(slug) {
    const product = await prisma.product.findFirst({
      where: {
        slug,
        isActive: true,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        variants: {
          select: {
            id: true,
            name: true,
            sku: true,
            priceAdjustment: true,
            stock: true,
            attributes: true,
          },
        },
      },
    });

    if (!product) {
      throw ApiError.notFound(`Product with slug '${slug}' not found`);
    }

    return product;
  }

  async getCategories() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            products: {
              where: { isActive: true },
            },
          },
        },
      },
    });
  }
}

module.exports = new ProductService();
