/**
 * Safely resolves the API Base URL.
 * In production or deployed environments (any non-localhost hostname),
 * always use relative '/api' unless a valid HTTPS remote URL is explicitly configured.
 * Never attempt to connect to 'http://localhost' from a live HTTPS production domain.
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
    // If rawUrl is missing, or points to http://localhost, force relative '/api'
    if (!rawUrl || rawUrl.includes('localhost') || rawUrl.includes('127.0.0.1')) {
      return '/api';
    }
    return rawUrl.replace(/\/+$/, '');
  }

  // Local development
  if (rawUrl) {
    const clean = rawUrl.replace(/\/+$/, '');
    if (!clean.endsWith('/api') && !envBase) {
      return `${clean}/api`;
    }
    return clean;
  }

  return '/api';
};

export const API_BASE = getApiBaseUrl();
export default API_BASE;

