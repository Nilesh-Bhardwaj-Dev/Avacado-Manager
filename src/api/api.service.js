import { API_BASE } from '../constants/api.constants.js';

/** CSRF token from readable cookie (set on login). */
let csrfToken = null;

export const setCsrfToken = (token) => {
  csrfToken = token || null;
};

export const getCsrfToken = () => csrfToken;

/** Read CSRF cookie set by server after login. */
export function syncCsrfFromCookie() {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  if (match) {
    csrfToken = decodeURIComponent(match[1]);
  }
}

let unauthorizedListener = null;

export const setUnauthorizedListener = (listener) => {
  unauthorizedListener = listener;
};

let refreshPromise = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(async (res) => {
        const text = await res.text();
        let data;
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = {};
        }
        if (!res.ok) throw new Error(data.error || 'Session expired');
        syncCsrfFromCookie();
        return data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function getTenantHeaders() {
  const headers = {};
  const orgId = localStorage.getItem('currentOrganizationId');
  const projectId = localStorage.getItem('currentProjectId');
  if (orgId) headers['X-Organization-Id'] = orgId;
  if (projectId) headers['X-Project-Id'] = projectId;
  return headers;
}

export const fetchAPI = async (endpoint, options = {}, retry = true) => {
  const method = (options.method || 'GET').toUpperCase();
  const headers = {
    'Content-Type': 'application/json',
    ...getTenantHeaders(),
    ...options.headers,
  };

  if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (response.status === 401 && !endpoint.includes('/auth/login')) {
    if (retry) {
      try {
        await refreshAccessToken();
        return fetchAPI(endpoint, options, false);
      } catch {
        if (unauthorizedListener) {
          unauthorizedListener();
        }
      }
    } else {
      if (unauthorizedListener) {
        unauthorizedListener();
      }
    }
  }

  if (!response.ok) {
    let message = data.error || data.message;
    if (!message && text) {
      const preMatch = text.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
      if (preMatch) {
        message = preMatch[1].replace(/<[^>]+>/g, '').trim();
      } else if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        message = `Server error (${response.status}). Restart the backend and try again.`;
      } else {
        message = text.slice(0, 200);
      }
    }
    throw new Error(message || response.statusText);
  }

  return data;
};

/** @deprecated Access tokens are HttpOnly cookies — no localStorage token. */
export const setAuthToken = () => {};
export const getAuthToken = () => null;
