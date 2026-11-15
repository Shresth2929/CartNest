require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET;
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
const configuredClientUrl = process.env.CLIENT_URL;

if (!jwtSecret || jwtSecret.length < 32 || /^(change|replace|your)[-_]/i.test(jwtSecret)) {
  throw new Error('JWT_SECRET must be set to a unique value of at least 32 characters.');
}

if (process.env.NODE_ENV === 'production' && !configuredClientUrl) {
  throw new Error('CLIENT_URL must be set in production.');
}

const clientUrl = configuredClientUrl || 'http://localhost:5173';
try {
  new URL(clientUrl);
} catch {
  throw new Error('CLIENT_URL must be a valid absolute URL.');
}

module.exports = {
  jwtSecret,
  jwtExpiresIn,
  clientUrl,
};
