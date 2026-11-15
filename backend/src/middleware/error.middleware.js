const ApiError = require('../utils/apiError');
const { sendError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  // If headers already sent, delegate to default express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle custom ApiError
  if (err instanceof ApiError) {
    return sendError(res, {
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
    });
  }

  // Handle Prisma Known Request Errors
  if (err.code) {
    switch (err.code) {
      case 'P2002': {
        const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'field';
        return sendError(res, {
          statusCode: 409,
          message: `A record with this ${target} already exists.`,
          errors: [{ field: target, message: 'Must be unique' }],
        });
      }
      case 'P2025': {
        return sendError(res, {
          statusCode: 404,
          message: 'The requested resource was not found.',
        });
      }
      case 'P2003': {
        return sendError(res, {
          statusCode: 400,
          message: 'Foreign key constraint failed on related resource.',
        });
      }
    }
  }

  // Handle invalid JSON body syntax errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(res, {
      statusCode: 400,
      message: 'Malformed JSON payload in request body.',
    });
  }

  // Log unhandled server errors in non-test environments
  if (process.env.NODE_ENV !== 'test') {
    console.error('Unhandled Server Error:', err);
  }

  // Generic 500 fallback
  return sendError(res, {
    statusCode: 500,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : (err.message || 'Internal server error'),
  });
};

module.exports = errorHandler;
