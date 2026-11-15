require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET;
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
const configuredClientUrls = process.env.CLIENT_URL;

if (!jwtSecret || jwtSecret.length < 32 || /^(change|replace|your)[-_]/i.test(jwtSecret)) {
  throw new Error('JWT_SECRET must be set to a unique value of at least 32 characters.');
}

if (process.env.NODE_ENV === 'production' && !configuredClientUrls?.trim()) {
  throw new Error('CLIENT_URL must be set in production.');
}

function parseClientOrigins(value) {
  const entries = value ? value.split(',') : ['http://localhost:5173'];
  return [...new Set(entries.map((entry) => {
    const rawUrl = entry.trim();
    let url;
    try {
      url = new URL(rawUrl);
    } catch {
      throw new Error('Each CLIENT_URL entry must be a valid absolute URL origin.');
    }

    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      throw new Error('Each CLIENT_URL entry must be an HTTP(S) origin without a path.');
    }
    return url.origin;
  }))];
}

const clientOrigins = parseClientOrigins(configuredClientUrls);

module.exports = {
  jwtSecret,
  jwtExpiresIn,
  clientOrigins,
  parseClientOrigins,
};
