const { verifyToken } = require('../utils/jwt');
const prisma = require('../config/prisma');
const ApiError = require('../utils/apiError');

/**
 * Authentication middleware: ensures request contains valid JWT token.
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(ApiError.unauthorized('Authentication token is required'));
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(ApiError.unauthorized('Token has expired, please log in again'));
      }
      return next(ApiError.unauthorized('Invalid authentication token'));
    }

    // Verify user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true,
      },
    });

    if (!user) {
      return next(ApiError.unauthorized('User associated with this token no longer exists'));
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based authorization middleware.
 * @param  {...string} roles - e.g. 'ADMIN', 'CUSTOMER'
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Access forbidden: Requires ${roles.join(' or ')} privilege`));
    }

    next();
  };
};

/**
 * Optional authentication: decodes user if token is present, but allows guest access.
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = verifyToken(token);
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { id: true, email: true, name: true, role: true },
        });
        if (user) {
          req.user = user;
        }
      } catch (e) {
        // Ignore invalid token for optional auth
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
};
