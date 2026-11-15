const sendSuccess = (res, { statusCode = 200, message = 'Success', data = null, meta = null }) => {
  const response = {
    success: true,
    message,
    ...(data !== null && { data }),
    ...(meta !== null && { meta }),
  };
  return res.status(statusCode).json(response);
};

const sendError = (res, { statusCode = 500, message = 'Error', errors = [] }) => {
  const response = {
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
  };
  return res.status(statusCode).json(response);
};

module.exports = {
  sendSuccess,
  sendError,
};
