export function normalizeApiBaseUrl(value) {
  const base = (value || '/api').trim().replace(/\/+$/, '');
  const baseWithoutApiSuffix = base.replace(/(?:\/api)+$/i, '');
  return `${baseWithoutApiSuffix}/api`;
}

export function buildApiUrl(baseUrl, endpoint) {
  const base = normalizeApiBaseUrl(baseUrl);
  const path = String(endpoint || '')
    .replace(/^\/+/, '')
    .replace(/^api(?:\/|$)/i, '');

  return path ? `${base}/${path}` : base;
}
