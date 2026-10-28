import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import aiServiceClient from '../../services/ai.service.js';

describe('AIServiceClient URL Resolution (Service Bindings)', () => {
  const originalEnv = process.env.AI_SERVICE_URL;

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.AI_SERVICE_URL = originalEnv;
    } else {
      delete process.env.AI_SERVICE_URL;
    }
  });

  it('uses default fallback URL when AI_SERVICE_URL is not set', () => {
    delete process.env.AI_SERVICE_URL;
    const url = aiServiceClient.resolveUrl('api/resume/parse');
    expect(url).toBe('http://localhost:8000/api/resume/parse');
  });

  it('dynamically resolves URL from runtime-injected AI_SERVICE_URL binding without trailing slash', () => {
    process.env.AI_SERVICE_URL = 'https://ai-services-internal.vercel.app';
    const url = aiServiceClient.resolveUrl('api/resume/parse');
    expect(url).toBe('https://ai-services-internal.vercel.app/api/resume/parse');
  });

  it('dynamically resolves URL from runtime-injected AI_SERVICE_URL binding with trailing slash', () => {
    process.env.AI_SERVICE_URL = 'https://ai-services-internal.vercel.app/';
    const url = aiServiceClient.resolveUrl('api/screening/evaluate-candidate');
    expect(url).toBe('https://ai-services-internal.vercel.app/api/screening/evaluate-candidate');
  });

  it('handles leading slash in endpoint path gracefully', () => {
    process.env.AI_SERVICE_URL = 'https://ai-services-internal.vercel.app';
    const url = aiServiceClient.resolveUrl('/api/screening/generate-test');
    expect(url).toBe('https://ai-services-internal.vercel.app/api/screening/generate-test');
  });
});

