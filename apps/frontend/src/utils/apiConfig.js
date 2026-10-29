/**
 * Safely resolves the API Base URL.
 * Handles both unified single-domain deployments (relative '/api')
 * and decoupled cross-origin architectures (e.g. Frontend on Vercel, Backend on Render).
 */
export const getApiBaseUrl = () => {
  const envBase = (import.meta.env.VITE_API_BASE_URL || '').trim();
  const envUrl = (import.meta.env.VITE_API_URL || '').trim();
  const rawUrl = envBase || envUrl;

  // In browser on production/preview hostnames (e.g. thinkwires.vercel.app)
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    // If rawUrl is missing, or points to localhost, fallback to relative '/api'
    if (!rawUrl || rawUrl.includes('localhost') || rawUrl.includes('127.0.0.1')) {
      return '/api';
    }
    const clean = rawUrl.replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }

  // Local development
  if (rawUrl) {
    const clean = rawUrl.replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }

  return '/api';
};

export const API_BASE = getApiBaseUrl();

const CANDIDATE_TOKEN_KEY = 'thinkwires_candidate_jwt';

export const getCandidateToken = () => {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(CANDIDATE_TOKEN_KEY);
    }
  } catch {
    // Ignore in private/restricted storage modes
  }
  return null;
};

export const setCandidateToken = (token) => {
  try {
    if (typeof localStorage !== 'undefined') {
      if (token) {
        localStorage.setItem(CANDIDATE_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(CANDIDATE_TOKEN_KEY);
      }
    }
  } catch {
    // Ignore in private/restricted storage modes
  }
};

export const clearCandidateToken = () => {
  setCandidateToken(null);
};

/**
 * Returns authorization headers including Bearer token if available.
 * Transmits credentials in dual-mode (HttpOnly cookie + Authorization header)
 * for maximum resilience across cross-domain deployments.
 */
export const getCandidateAuthHeaders = (additionalHeaders = {}) => {
  const headers = { ...additionalHeaders };
  const token = getCandidateToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export default API_BASE;
