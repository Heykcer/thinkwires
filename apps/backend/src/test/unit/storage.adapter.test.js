import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { StorageService, SigV4Client } from '../../utils/storage.adapter.js';

describe('P1 Object Storage Service & SigV4 Client Suite', () => {
  const tmpDir = path.resolve(process.cwd(), 'uploads/test_storage');

  beforeEach(() => {
    vi.restoreAllMocks();
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  describe('Local Storage Driver Operations', () => {
    it('persists file buffer to local disk and returns relative url', async () => {
      const storage = new StorageService({
        driver: 'local',
        localBaseDir: tmpDir,
      });

      const buffer = Buffer.from('Test candidate resume document content');
      const result = await storage.saveFile(buffer, 'resume_john_doe.pdf', 'application/pdf', 'resumes');

      expect(result).toContain('/uploads/resumes/resume_john_doe.pdf');

      const filePath = path.resolve(tmpDir, 'resumes', 'resume_john_doe.pdf');
      expect(fs.existsSync(filePath)).toBe(true);
      expect(fs.readFileSync(filePath, 'utf8')).toBe('Test candidate resume document content');
    });

    it('streams stored file from local disk', async () => {
      const storage = new StorageService({
        driver: 'local',
        localBaseDir: tmpDir,
      });

      const buffer = Buffer.from('Readable stream test content');
      await storage.saveFile(buffer, 'stream_test.pdf', 'application/pdf', 'resumes');

      const stream = await storage.getFileStream('stream_test.pdf', 'resumes');
      expect(stream).toBeDefined();

      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      expect(Buffer.concat(chunks).toString('utf8')).toBe('Readable stream test content');
    });

    it('deletes stored file from local disk', async () => {
      const storage = new StorageService({
        driver: 'local',
        localBaseDir: tmpDir,
      });

      const buffer = Buffer.from('Content to delete');
      await storage.saveFile(buffer, 'delete_me.pdf', 'application/pdf', 'resumes');

      const filePath = path.resolve(tmpDir, 'resumes', 'delete_me.pdf');
      expect(fs.existsSync(filePath)).toBe(true);

      const deleted = await storage.deleteFile('delete_me.pdf', 'resumes');
      expect(deleted).toBe(true);
      expect(fs.existsSync(filePath)).toBe(false);
    });

    it('throws error when streaming non-existent local file', async () => {
      const storage = new StorageService({
        driver: 'local',
        localBaseDir: tmpDir,
      });

      await expect(storage.getFileStream('missing_file.pdf', 'resumes')).rejects.toThrow(
        /not found in storage/
      );
    });
  });

  describe('SigV4 Client & S3 / Cloudflare R2 Operations', () => {
    const s3Config = {
      bucket: 'thinkwires-cloud-resumes',
      region: 'auto',
      endpoint: 'https://test-account.r2.cloudflarestorage.com',
      accessKeyId: 'test_access_key_12345',
      secretAccessKey: 'test_secret_key_67890abcdef',
    };

    it('generates authentic AWS SigV4 signed headers for PUT upload requests', async () => {
      const client = new SigV4Client(s3Config);
      const fileBuffer = Buffer.from('PDF byte stream payload');

      // Mock global fetch
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('', { status: 200, statusText: 'OK' })
      );

      const response = await client.request({
        method: 'PUT',
        key: 'resumes/cand_1001.pdf',
        headers: { 'content-type': 'application/pdf' },
        body: fileBuffer,
      });

      expect(response.ok).toBe(true);
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      const [calledUrl, calledOptions] = fetchSpy.mock.calls[0];
      expect(calledUrl).toBe('https://test-account.r2.cloudflarestorage.com/thinkwires-cloud-resumes/resumes/cand_1001.pdf');
      expect(calledOptions.method).toBe('PUT');

      const headers = calledOptions.headers;
      expect(headers['authorization']).toContain('AWS4-HMAC-SHA256 Credential=test_access_key_12345/');
      expect(headers['authorization']).toContain('SignedHeaders=');
      expect(headers['authorization']).toContain('Signature=');
      expect(headers['x-amz-date']).toBeDefined();
      expect(headers['x-amz-content-sha256']).toBeDefined();
    });

    it('generates pre-signed GET URL with 15-minute expiration parameters', () => {
      const client = new SigV4Client(s3Config);
      const presignedUrl = client.generatePresignedUrl('resumes/cand_1001.pdf', 900);

      expect(presignedUrl).toContain('https://test-account.r2.cloudflarestorage.com/thinkwires-cloud-resumes/resumes/cand_1001.pdf?');
      expect(presignedUrl).toContain('X-Amz-Algorithm=AWS4-HMAC-SHA256');
      expect(presignedUrl).toContain('X-Amz-Credential=test_access_key_12345%2F');
      expect(presignedUrl).toContain('X-Amz-Expires=900');
      expect(presignedUrl).toContain('X-Amz-SignedHeaders=host');
      expect(presignedUrl).toContain('X-Amz-Signature=');
    });

    it('rejects cloud requests when access keys are missing', async () => {
      const client = new SigV4Client({
        bucket: 'thinkwires-cloud-resumes',
        region: 'us-east-1',
      });

      await expect(
        client.request({ method: 'PUT', key: 'resumes/cand.pdf', body: Buffer.from('') })
      ).rejects.toThrow(/S3 credentials .* are required/);
    });

    it('handles S3 upload failure without corrupting caller', async () => {
      const storage = new StorageService({
        driver: 's3',
        bucket: s3Config.bucket,
        endpoint: s3Config.endpoint,
        accessKeyId: s3Config.accessKeyId,
        secretAccessKey: s3Config.secretAccessKey,
      });

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('AccessDenied: Bucket access restricted', { status: 403, statusText: 'Forbidden' })
      );

      await expect(
        storage.saveFile(Buffer.from('Resume'), 'cand.pdf', 'application/pdf', 'resumes')
      ).rejects.toThrow(/S3 upload failed with status 403/);
    });
  });
});
