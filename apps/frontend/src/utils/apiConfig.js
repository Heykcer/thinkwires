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
export default API_BASE;
