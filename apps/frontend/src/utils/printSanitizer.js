/**
 * Print & Export Security Utility (P0 Security Requirement B)
 * Defends against Stored XSS in candidate dossier and evaluation printing.
 * Ensures untrusted candidate text is contextually escaped and CSP-restricted.
 */

export const escapeHtml = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Validates and sanitizes URLs to prevent javascript: or data: URI execution
 */
export const sanitizeUrl = (url, fallback = '#') => {
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:')
  ) {
    return fallback;
  }
  return escapeHtml(trimmed);
};

/**
 * Strict Content Security Policy meta tag for print preview windows.
 * Blocks all script execution (inline scripts, event handlers, external scripts).
 */
export const PRINT_CSP_META =
  '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; font-src \'self\' data: https://fonts.gstatic.com;">';
