// Admin and CMS API Client with Secure HttpOnly Cookie Authentication & Anti-CSRF
const API_BASE = '/api/admin';

// Security hygiene: Purge any legacy tokens from localStorage/sessionStorage
try {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('tw_admin_token');
  }
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('tw_admin_token');
  }
} catch {
  // Ignore in restricted environments
}

// In-memory Anti-CSRF Token state
let currentCsrfToken = null;

export const setCsrfToken = (token) => {
  currentCsrfToken = token || null;
};

export const getCsrfToken = () => {
  if (currentCsrfToken) return currentCsrfToken;
  try {
    if (typeof document !== 'undefined' && document.cookie) {
      const match = document.cookie.match(
        /(?:^|;\s*)thinkwires_csrf_token=([^;]+)/
      );
      if (match) {
        currentCsrfToken = decodeURIComponent(match[1]);
        return currentCsrfToken;
      }
    }
  } catch {
    // Ignore error
  }
  return null;
};

/**
 * Legacy getter maintained for backwards compatibility.
 * Security: Authentication tokens are strictly server-managed via HttpOnly cookies
 * and are never accessible to client-side scripts.
 */
export const getAdminToken = () => {
  return null;
};

export const getAdminUser = () => {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem('tw_admin_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getAdminRole = () => {
  const user = getAdminUser();
  return user?.role ? user.role.toLowerCase() : '';
};

export const setAdminSession = (param1, param2) => {
  // Support both setAdminSession(user) and legacy setAdminSession(token, user)
  const user =
    param2 ||
    (param1 && typeof param1 === 'object' && !param1.token ? param1 : null);

  // Security: Ensure admin token is NEVER stored in localStorage or sessionStorage
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('tw_admin_token');
      if (user) {
        localStorage.setItem('tw_admin_user', JSON.stringify(user));
        localStorage.setItem(
          'tw_admin_role',
          user.role ? user.role.toLowerCase() : ''
        );
      }
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('tw_admin_token');
    }
  } catch (e) {
    console.warn('Could not update admin session storage:', e);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('tw_admin_auth_changed', { detail: { user } })
    );
  }
};

export const clearAdminSession = () => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('tw_admin_token');
      localStorage.removeItem('tw_admin_user');
      localStorage.removeItem('tw_admin_role');
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('tw_admin_token');
    }
  } catch {
    // Ignore error
  }
  currentCsrfToken = null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('tw_admin_auth_changed', { detail: null })
    );
  }
};

export const isAdminAuthenticated = () => {
  // Fast client-side indicator based on cached profile;
  // Authoritative validation is always performed server-side via getMe().
  return Boolean(getAdminUser());
};

// Legacy setter maintained for compatibility
export const setAdminRole = (role) => {
  const user = getAdminUser();
  if (user) {
    user.role = role;
    try {
      localStorage.setItem('tw_admin_user', JSON.stringify(user));
    } catch {
      // Ignore
    }
  }
  try {
    localStorage.setItem('tw_admin_role', role);
  } catch {
    // Ignore
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tw_role_changed', { detail: role }));
  }
};

export const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  const csrf = getCsrfToken();
  if (csrf) {
    headers['X-CSRF-Token'] = csrf;
  }
  return headers;
};

/**
 * Standard HTTP client for admin API calls.
 * Ensures credentials: 'include' for HttpOnly cookies and injects anti-CSRF token on mutations.
 */
const adminFetch = async (endpoint, options = {}) => {
  const method = (options.method || 'GET').toUpperCase();
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  };

  // Attach anti-CSRF token to all state-changing requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    let csrfToken = getCsrfToken();
    if (!csrfToken) {
      try {
        const tokenRes = await fetch(`${API_BASE}/auth/csrf-token`, {
          credentials: 'include',
        });
        if (tokenRes.ok) {
          const data = await tokenRes.json();
          if (data && data.csrfToken) {
            setCsrfToken(data.csrfToken);
            csrfToken = data.csrfToken;
          }
        }
      } catch {
        // Fallback gracefully
      }
    }
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    method,
    headers,
    credentials: 'include', // Automatically transmits HttpOnly thinkwires_admin_jwt cookie
  });

  // Automatically invalidate client session on 401 Unauthorized
  if (res.status === 401 && !endpoint.startsWith('/auth/login')) {
    clearAdminSession();
  }

  return res;
};

export const adminApi = {
  // Authentication
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `Login failed (${res.status})`);
    if (json.csrfToken) {
      setCsrfToken(json.csrfToken);
    }
    if (json.user) {
      setAdminSession(json.user);
    }
    return json;
  },

  async logout() {
    try {
      await adminFetch('/auth/logout', {
        method: 'POST',
      });
    } catch (e) {
      console.warn('Logout network notice:', e.message);
    } finally {
      clearAdminSession();
    }
    return { success: true };
  },

  // Current user & role validation (Session restoration)
  async getMe() {
    const res = await adminFetch('/auth/me');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    if (data.csrfToken) {
      setCsrfToken(data.csrfToken);
    }
    if (data && data.user) {
      setAdminSession(data.user);
    }
    return data;
  },

  // Fetch CSRF Token explicitly
  async getCsrfToken() {
    try {
      const res = await adminFetch('/auth/csrf-token');
      if (res.ok) {
        const data = await res.json();
        if (data.csrfToken) {
          setCsrfToken(data.csrfToken);
          return data.csrfToken;
        }
      }
    } catch {
      // Ignore
    }
    return getCsrfToken();
  },

  // Dashboard Overview & Charts
  async getDashboardStats(period = 'month') {
    const res = await adminFetch(`/stats?period=${period}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  },

  async getActivities() {
    const res = await adminFetch('/activities');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  },

  // Employees
  async getEmployees(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await adminFetch(`/employees${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  },

  async createEmployee(data) {
    const res = await adminFetch('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  async updateEmployee(id, data) {
    const res = await adminFetch(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  async deleteEmployee(id) {
    const res = await adminFetch(`/employees/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  // Candidates
  async getCandidates(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await adminFetch(`/candidates${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  },

  async createCandidate(data) {
    const res = await adminFetch('/candidates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  async updateCandidateStatus(id, status) {
    const res = await adminFetch(`/candidates/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  async updateCandidate(id, data) {
    const res = await adminFetch(`/candidates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  async deleteCandidate(id) {
    const res = await adminFetch(`/candidates/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  async getCandidateDossier(id) {
    const res = await adminFetch(`/candidates/${id}/dossier`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  async reEvaluateCandidate(id, jdText = '') {
    const res = await adminFetch(`/candidates/${id}/re-evaluate`, {
      method: 'POST',
      body: JSON.stringify({ jdText }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  // Clients
  async getClients(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await adminFetch(`/clients${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  },

  async createClient(data) {
    const res = await adminFetch('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  async updateClient(id, data) {
    const res = await adminFetch(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  async deleteClient(id) {
    const res = await adminFetch(`/clients/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  // Jobs & Requisitions
  async getJobs(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await adminFetch(`/jobs${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  },

  async getRequisitions(params = {}) {
    return this.getJobs({ ...params, type: 'requisitions' });
  },

  async createJob(data) {
    const res = await adminFetch('/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  async createRequisition(data) {
    return this.createJob({
      ...data,
      isRequisition: true,
      category: 'Client Requisition',
      source: 'Client Mandate',
    });
  },

  async updateJob(id, data) {
    const res = await adminFetch(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  async approveRequisition(id, updates = {}) {
    return this.updateJob(id, {
      status: 'Approved',
      ...updates,
    });
  },

  async deleteJob(id) {
    const res = await adminFetch(`/jobs/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  // Placements
  async getPlacements() {
    const res = await adminFetch('/placements');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  },

  async createPlacement(data) {
    const res = await adminFetch('/placements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  async updatePlacement(id, data) {
    const res = await adminFetch(`/placements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  async deletePlacement(id) {
    const res = await adminFetch(`/placements/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  // CMS Stats
  async getCmsStats() {
    const res = await adminFetch('/cms/stats');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  },

  // CMS Pages
  async getCmsPages() {
    const res = await adminFetch('/cms/pages');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  },

  async createCmsPage(data) {
    const res = await adminFetch('/cms/pages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  async updateCmsPage(id, data) {
    const res = await adminFetch(`/cms/pages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  async togglePublishCmsPage(id) {
    const res = await adminFetch(`/cms/pages/${id}/publish`, {
      method: 'PATCH',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  async deleteCmsPage(id) {
    const res = await adminFetch(`/cms/pages/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  // CMS Articles
  async getCmsArticles(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await adminFetch(`/cms/articles${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  },

  async createCmsArticle(data) {
    const res = await adminFetch('/cms/articles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  async updateCmsArticle(id, data) {
    const res = await adminFetch(`/cms/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  async togglePublishCmsArticle(id) {
    const res = await adminFetch(`/cms/articles/${id}/publish`, {
      method: 'PATCH',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  async deleteCmsArticle(id) {
    const res = await adminFetch(`/cms/articles/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  // CMS Media
  async getCmsMedia() {
    const res = await adminFetch('/cms/media');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  },

  async createCmsMedia(data) {
    const res = await adminFetch('/cms/media', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  async deleteCmsMedia(id) {
    const res = await adminFetch(`/cms/media/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  // CMS SEO
  async getSeoSettings() {
    const res = await adminFetch('/cms/seo');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  },

  async updateSeoSettings(data) {
    const res = await adminFetch('/cms/seo', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  // CMS Announcements
  async getAnnouncements() {
    const res = await adminFetch('/cms/announcements');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return res.json();
  },

  async createAnnouncement(data) {
    const res = await adminFetch('/cms/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  async togglePublishAnnouncement(id) {
    const res = await adminFetch(`/cms/announcements/${id}/publish`, {
      method: 'PATCH',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  async deleteAnnouncement(id) {
    const res = await adminFetch(`/cms/announcements/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  // System Members (Superadmin Exclusive)
  async getSystemMembers() {
    const res = await adminFetch('/system-members');
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  async createSystemMember(data) {
    const res = await adminFetch('/system-members', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  async updateSystemMember(id, data) {
    const res = await adminFetch(`/system-members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },

  async deleteSystemMember(id) {
    const res = await adminFetch(`/system-members/${id}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || `HTTP error ${res.status}`);
    return json;
  },
};

export default adminApi;
