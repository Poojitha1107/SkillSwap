/**
 * SkillSwap - Centralized REST API Client for React
 * Handles credentials (cookies) and standardized error handling.
 */

export const API = {
  async request(endpoint, options = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config = {
      credentials: 'include', // Ensure session cookies are sent
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(endpoint, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // If user is banned, trigger ban event and notification
        if (response.status === 403 && data.isBanned) {
          window.dispatchEvent(new CustomEvent('skillswap:banned', { detail: data }));
        }

        const error = new Error(data.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      console.error(`[API Error] ${endpoint}:`, err);
      throw err;
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },
};

export default API;

