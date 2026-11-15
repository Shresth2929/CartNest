import { buildApiUrl, normalizeApiBaseUrl } from '../utils/apiUrl';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const defaultApiUrl = import.meta.env.DEV
  ? '/api'
  : 'https://cartnest-wlg9.onrender.com/api';
const BASE_URL = normalizeApiBaseUrl(configuredApiUrl || defaultApiUrl);

/**
 * Universal API client for CartNest
 */
async function request(endpoint, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    idempotencyKey,
  } = options;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const token = localStorage.getItem('cartnest_token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  if (idempotencyKey) {
    defaultHeaders['Idempotency-Key'] = idempotencyKey;
  }

  const config = {
    method,
    headers: { ...defaultHeaders, ...headers },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const url = buildApiUrl(BASE_URL, endpoint);
  let response;

  try {
    response = await fetch(url, config);
  } catch (netErr) {
    throw new Error('Unable to connect to CartNest server. Please check your network connection.');
  }

  // Parse JSON response
  let data;
  try {
    data = await response.json();
  } catch (parseErr) {
    throw new Error(`Server returned non-JSON response (${response.status})`);
  }

  if (!response.ok) {
    // If unauthorized, clear invalid token
    if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
      localStorage.removeItem('cartnest_token');
      localStorage.removeItem('cartnest_user');
      window.dispatchEvent(new Event('auth-change'));
    }

    const err = new Error(data.message || 'An unexpected error occurred');
    err.status = response.status;
    err.errors = data.errors || [];
    throw err;
  }

  return data;
}

export const api = {
  // Generic methods
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options) => request(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),

  // Auth endpoints
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getMe: () => api.get('/auth/me'),
  },

  // Product Catalog
  products: {
    list: (params = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, val);
        }
      });
      const qStr = query.toString();
      return api.get(`/products${qStr ? `?${qStr}` : ''}`);
    },
    getBySlug: (slug) => api.get(`/products/${slug}`),
    categories: () => api.get('/categories'),
  },

  // Cart
  cart: {
    get: () => api.get('/cart'),
    addItem: (productId, variantId, quantity = 1) =>
      api.post('/cart/items', { productId, variantId, quantity }),
    updateItem: (itemId, quantity) =>
      api.put(`/cart/items/${itemId}`, { quantity }),
    removeItem: (itemId) =>
      api.delete(`/cart/items/${itemId}`),
    clear: () =>
      api.delete('/cart'),
  },

  // Addresses
  addresses: {
    list: () => api.get('/addresses'),
    create: (addressData) => api.post('/addresses', addressData),
    update: (id, addressData) => api.put(`/addresses/${id}`, addressData),
    delete: (id) => api.delete(`/addresses/${id}`),
  },

  // Checkout & Orders
  checkout: {
    placeOrder: (checkoutData, idempotencyKey) =>
      api.post('/checkout', checkoutData, { idempotencyKey }),
  },
  orders: {
    list: (params = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.append(key, val);
        }
      });
      const qStr = query.toString();
      return api.get(`/orders${qStr ? `?${qStr}` : ''}`);
    },
    getById: (id) => api.get(`/orders/${id}`),
    cancel: (id, reason) => api.post(`/orders/${id}/cancel`, { reason }),
  },
};

export default api;
