/**
 * Cliente HTTP centralizado para la API de Khazad-dûm.
 * Endpoints exactos del backend FastAPI (/api/v1).
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_PREFIX = '/api/v1';

class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

function getAuthToken() {
  try {
    const raw = localStorage.getItem('khazad-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.token ?? null;
  } catch {
    return null;
  }
}

async function request(path, { method = 'GET', body, headers = {}, signal } = {}) {
  const token = getAuthToken();
  const url = `${API_URL}${API_PREFIX}${path}`;

  const finalHeaders = {
    Accept: 'application/json',
    ...headers,
  };

  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders['Content-Type'] = 'application/json';
  }
  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
        ? body
        : JSON.stringify(body),
    signal,
  });

  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : await response.text();

  if (!response.ok) {
    const detail =
      (payload && typeof payload === 'object' && payload.detail) ||
      (typeof payload === 'string' && payload) ||
      `HTTP ${response.status}`;
    throw new ApiError(detail, response.status, payload);
  }

  return payload;
}

const qs = (params = {}) => {
  const clean = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  if (!clean.length) return '';
  return '?' + new URLSearchParams(clean).toString();
};

export const api = {
  // ─── Health ────────────────────────────────────────────────
  health: () => request('/health'),
  healthDb: () => request('/health/db'),

  // ─── Tenants ───────────────────────────────────────────────
  tenants: {
    list: () => request('/tenants'),
    get: (id) => request(`/tenants/${id}`),
    create: (data) => request('/tenants', { method: 'POST', body: data }),
    update: (id, data) => request(`/tenants/${id}`, { method: 'PATCH', body: data }),
    remove: (id) => request(`/tenants/${id}`, { method: 'DELETE' }),
  },

  // ─── Users ─────────────────────────────────────────────────
  users: {
    list: (tenantId, params) =>
      request(`/tenants/${tenantId}/users${qs(params)}`),
    get: (tenantId, userId) => request(`/tenants/${tenantId}/users/${userId}`),
    create: (tenantId, data) =>
      request(`/tenants/${tenantId}/users`, { method: 'POST', body: data }),
    update: (tenantId, userId, data) =>
      request(`/tenants/${tenantId}/users/${userId}`, {
        method: 'PATCH',
        body: data,
      }),
    remove: (tenantId, userId) =>
      request(`/tenants/${tenantId}/users/${userId}`, { method: 'DELETE' }),
  },

  // ─── Locations ─────────────────────────────────────────────
  locations: {
    list: (tenantId, params) =>
      request(`/tenants/${tenantId}/locations${qs(params)}`),
    get: (tenantId, id) => request(`/tenants/${tenantId}/locations/${id}`),
    create: (tenantId, data) =>
      request(`/tenants/${tenantId}/locations`, { method: 'POST', body: data }),
    update: (tenantId, id, data) =>
      request(`/tenants/${tenantId}/locations/${id}`, {
        method: 'PATCH',
        body: data,
      }),
    remove: (tenantId, id) =>
      request(`/tenants/${tenantId}/locations/${id}`, { method: 'DELETE' }),
  },

  // ─── Assets ────────────────────────────────────────────────
  assets: {
    list: (tenantId, params) =>
      request(`/tenants/${tenantId}/assets${qs(params)}`),
    get: (tenantId, id) => request(`/tenants/${tenantId}/assets/${id}`),
    create: (tenantId, data) =>
      request(`/tenants/${tenantId}/assets`, { method: 'POST', body: data }),
    update: (tenantId, id, data) =>
      request(`/tenants/${tenantId}/assets/${id}`, {
        method: 'PATCH',
        body: data,
      }),
    remove: (tenantId, id) =>
      request(`/tenants/${tenantId}/assets/${id}`, { method: 'DELETE' }),
    changeStatus: (tenantId, id, data) =>
      request(`/tenants/${tenantId}/assets/${id}/status`, {
        method: 'POST',
        body: data,
      }),
    statusHistory: (tenantId, id) =>
      request(`/tenants/${tenantId}/assets/${id}/status-history`),
  },

  // ─── Spare Parts ───────────────────────────────────────────
  spareParts: {
    list: (tenantId, params) =>
      request(`/tenants/${tenantId}/spare-parts${qs(params)}`),
    get: (tenantId, id) => request(`/tenants/${tenantId}/spare-parts/${id}`),
    create: (tenantId, data) =>
      request(`/tenants/${tenantId}/spare-parts`, {
        method: 'POST',
        body: data,
      }),
    update: (tenantId, id, data) =>
      request(`/tenants/${tenantId}/spare-parts/${id}`, {
        method: 'PATCH',
        body: data,
      }),
    remove: (tenantId, id) =>
      request(`/tenants/${tenantId}/spare-parts/${id}`, { method: 'DELETE' }),
    movements: (tenantId, params) =>
      request(`/tenants/${tenantId}/stock-movements${qs(params)}`),
    createMovement: (tenantId, data) =>
      request(`/tenants/${tenantId}/stock-movements`, {
        method: 'POST',
        body: data,
      }),
  },

  // ─── Work Orders ───────────────────────────────────────────
  workOrders: {
    list: (tenantId, params) =>
      request(`/tenants/${tenantId}/work-orders${qs(params)}`),
    get: (tenantId, id) => request(`/tenants/${tenantId}/work-orders/${id}`),
    create: (tenantId, data) =>
      request(`/tenants/${tenantId}/work-orders`, {
        method: 'POST',
        body: data,
      }),
    update: (tenantId, id, data) =>
      request(`/tenants/${tenantId}/work-orders/${id}`, {
        method: 'PATCH',
        body: data,
      }),
    remove: (tenantId, id) =>
      request(`/tenants/${tenantId}/work-orders/${id}`, { method: 'DELETE' }),
    tasks: {
      list: (tenantId, woId) =>
        request(`/tenants/${tenantId}/work-orders/${woId}/tasks`),
      create: (tenantId, woId, data) =>
        request(`/tenants/${tenantId}/work-orders/${woId}/tasks`, {
          method: 'POST',
          body: data,
        }),
    },
    parts: {
      list: (tenantId, woId) =>
        request(`/tenants/${tenantId}/work-orders/${woId}/parts`),
      create: (tenantId, woId, data) =>
        request(`/tenants/${tenantId}/work-orders/${woId}/parts`, {
          method: 'POST',
          body: data,
        }),
    },
  },

  // ─── Cost Entries (TCO) ────────────────────────────────────
  costEntries: {
    list: (tenantId, params) =>
      request(`/tenants/${tenantId}/cost-entries${qs(params)}`),
    create: (tenantId, data) =>
      request(`/tenants/${tenantId}/cost-entries`, {
        method: 'POST',
        body: data,
      }),
  },
};

export { ApiError };
export default api;
