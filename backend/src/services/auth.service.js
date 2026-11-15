const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');
const { generateToken } = require('../utils/jwt');

class AuthService {
  async register({ name, email, password, phone }) {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw ApiError.conflict('Email is already registered');
    }

    // Hash password securely with bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user strictly as CUSTOMER (never allow self-assigning ADMIN)
    // Run inside transaction to create user, their personal persistent cart, and audit log
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          passwordHash,
          phone: phone || null,
          role: 'CUSTOMER',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Create persistent cart for the customer
      await tx.cart.create({
        data: {
          userId: user.id,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_REGISTERED',
          entityType: 'USER',
          entityId: user.id,
          metadata: { email: user.email, name: user.name },
        },
      });

      return user;
    });

    // Generate JWT token
    const token = generateToken({
      id: result.id,
      email: result.email,
      role: result.role,
    });

    return { user: result, token };
  }

  async login({ email, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Ensure customer has a cart created if they registered earlier before cart creation
    if (user.role === 'CUSTOMER') {
      const cart = await prisma.cart.findUnique({ where: { userId: user.id } });
      if (!cart) {
        await prisma.cart.create({ data: { userId: user.id } });
      }
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Strip passwordHash
    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return { user: safeUser, token };
  }

  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            addresses: true,
            orders: true,
          },
        },
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user;
  }
}

module.exports = new AuthService();
