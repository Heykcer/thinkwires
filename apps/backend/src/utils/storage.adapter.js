import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Readable } from 'stream';

/**
 * AWS Signature Version 4 client for standard AWS S3 and Cloudflare R2 compatibility (P1 Fix Object Storage)
 */
export class SigV4Client {
  constructor({ endpoint, bucket, region, accessKeyId, secretAccessKey }) {
    this.endpoint = endpoint ? endpoint.replace(/\/+$/, '') : null;
    this.bucket = bucket;
    this.region = region || 'us-east-1';
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
  }

  getService() {
    return 's3';
  }

  hmac(key, string) {
    return crypto.createHmac('sha256', key).update(string, 'utf8').digest();
  }

  sha256Hex(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  getSigningKey(dateStamp) {
    const kDate = this.hmac('AWS4' + this.secretAccessKey, dateStamp);
    const kRegion = this.hmac(kDate, this.region);
    const kService = this.hmac(kRegion, this.getService());
    return this.hmac(kService, 'aws4_request');
  }

  /**
   * Resolves URL for an object key.
   * Supports Cloudflare R2 (https://<account_id>.r2.cloudflarestorage.com/<bucket>/<key>)
   * and standard AWS S3 path-style or virtual-hosted-style URLs.
   */
  resolveObjectUrl(key) {
    const cleanKey = key.replace(/^\/+/, '');
    if (this.endpoint) {
      return new URL(`${this.endpoint}/${this.bucket}/${cleanKey}`);
    }
    return new URL(`https://${this.bucket}.s3.${this.region}.amazonaws.com/${cleanKey}`);
  }

  /**
   * Signs and executes an HTTP request to S3/R2
   */
  async request({ method, key, headers = {}, body = null }) {
    if (!this.accessKeyId || !this.secretAccessKey) {
      throw new Error('S3 credentials (accessKeyId and secretAccessKey) are required for cloud storage operations.');
    }

    const url = this.resolveObjectUrl(key);
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);

    const payloadHash = body ? this.sha256Hex(body) : this.sha256Hex('');
    const host = url.host;

    const requestHeaders = {
      host,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      ...headers,
    };

    if (body && !requestHeaders['content-length']) {
      requestHeaders['content-length'] = Buffer.byteLength(body).toString();
    }

    // Canonical Headers and Signed Headers
    const sortedHeaderKeys = Object.keys(requestHeaders)
      .map((k) => k.toLowerCase())
      .sort();
    const canonicalHeaders = sortedHeaderKeys
      .map((k) => `${k}:${requestHeaders[k].trim()}\n`)
      .join('');
    const signedHeaders = sortedHeaderKeys.join(';');

    // Canonical Request
    const canonicalUri = url.pathname;
    const canonicalQuery = url.search ? url.search.slice(1).split('&').sort().join('&') : '';
    const canonicalRequest = [
      method,
      canonicalUri,
      canonicalQuery,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    // String to sign
    const credentialScope = `${dateStamp}/${this.region}/${this.getService()}/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      this.sha256Hex(canonicalRequest),
    ].join('\n');

    // Signature
    const signingKey = this.getSigningKey(dateStamp);
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign, 'utf8').digest('hex');

    requestHeaders['authorization'] = `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const response = await fetch(url.toString(), {
      method,
      headers: requestHeaders,
      body: method === 'GET' || method === 'HEAD' ? null : body,
    });

    return response;
  }

  /**
   * Generates a pre-signed GET URL for secure temporary client downloads
   */
  generatePresignedUrl(key, expiresInSeconds = 900) {
    if (!this.accessKeyId || !this.secretAccessKey) {
      return null;
    }

    const url = this.resolveObjectUrl(key);
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const credentialScope = `${dateStamp}/${this.region}/${this.getService()}/aws4_request`;

    const queryParams = {
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Credential': `${this.accessKeyId}/${credentialScope}`,
      'X-Amz-Date': amzDate,
      'X-Amz-Expires': String(expiresInSeconds),
      'X-Amz-SignedHeaders': 'host',
    };

    const sortedQuery = Object.keys(queryParams)
      .sort()
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(queryParams[k])}`)
      .join('&');

    const canonicalHeaders = `host:${url.host}\n`;
    const signedHeaders = 'host';
    const payloadHash = 'UNSIGNED-PAYLOAD';

    const canonicalRequest = [
      'GET',
      url.pathname,
      sortedQuery,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      this.sha256Hex(canonicalRequest),
    ].join('\n');

    const signingKey = this.getSigningKey(dateStamp);
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign, 'utf8').digest('hex');

    return `${url.origin}${url.pathname}?${sortedQuery}&X-Amz-Signature=${signature}`;
  }
}

/**
 * Pluggable Storage Service (DEP-01, DEP-STA-01, P1 Fix Object Storage)
 * Decouples file persistence from ephemeral container storage.
 * Supports S3-compatible cloud object storage (AWS S3, Cloudflare R2, MinIO, GCS)
 * and local directory storage for development and testing.
 */
export class StorageService {
  constructor(options = {}) {
    this.driver =
      options.driver ||
      process.env.STORAGE_DRIVER ||
      (process.env.S3_BUCKET ? 's3' : 'local');

    this.bucket = options.bucket || process.env.S3_BUCKET || 'thinkwires-storage';
    this.region = options.region || process.env.S3_REGION || 'us-east-1';
    this.endpoint = options.endpoint || process.env.S3_ENDPOINT || null;
    this.cdnDomain = options.cdnDomain || process.env.CDN_DOMAIN || '';
    this.accessKeyId =
      options.accessKeyId ||
      process.env.S3_ACCESS_KEY_ID ||
      process.env.AWS_ACCESS_KEY_ID;
    this.secretAccessKey =
      options.secretAccessKey ||
      process.env.S3_SECRET_ACCESS_KEY ||
      process.env.AWS_SECRET_ACCESS_KEY;

    this.localBaseDir =
      options.localBaseDir ||
      (process.env.VERCEL
        ? path.resolve('/tmp', 'uploads')
        : path.resolve(process.cwd(), 'uploads'));

    this.s3Client = new SigV4Client({
      endpoint: this.endpoint,
      bucket: this.bucket,
      region: this.region,
      accessKeyId: this.accessKeyId,
      secretAccessKey: this.secretAccessKey,
    });
  }

  /**
   * Sanitizes filename against directory traversal attacks.
   */
  sanitizeFilename(filename) {
    const safe = path.basename(filename || '').replace(/[^a-zA-Z0-9_.-]/g, '_');
    return safe || `file-${Date.now()}`;
  }

  /**
   * Resolves local absolute path for a folder and file.
   */
  resolveLocalPath(folder, filename) {
    const safeFolder = path.basename(folder || 'resumes');
    const safeFile = this.sanitizeFilename(filename);
    const targetDir = path.resolve(this.localBaseDir, safeFolder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    return path.resolve(targetDir, safeFile);
  }

  /**
   * Persists a file buffer into object storage or local disk.
   *
   * @param {Buffer} fileBuffer The file data buffer
   * @param {string} filename The target filename
   * @param {string} mimeType The file MIME type
   * @param {string} folder Target folder or bucket prefix
   * @returns {Promise<{ key: string, url: string, driver: string, filename: string, size: number }>}
   */
  async saveFile(fileBuffer, filename, mimeType = 'application/octet-stream', folder = 'resumes') {
    const safeName = this.sanitizeFilename(filename);
    const key = `${folder}/${safeName}`;

    if (this.driver === 's3') {
      if (this.accessKeyId && this.secretAccessKey) {
        const response = await this.s3Client.request({
          method: 'PUT',
          key,
          headers: {
            'content-type': mimeType,
          },
          body: fileBuffer,
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          throw new Error(`S3 upload failed with status ${response.status}: ${errorText || response.statusText}`);
        }
      }

      return this.getFileUrl(key, folder);
    }

    // Default: Local persistent or /tmp directory
    const filePath = this.resolveLocalPath(folder, safeName);
    await fs.promises.writeFile(filePath, fileBuffer);
    return `/uploads/${folder}/${safeName}`;
  }

  /**
   * Returns a readable stream for a stored file.
   */
  async getFileStream(keyOrFilename, folder = 'resumes') {
    const key = keyOrFilename.includes('/') ? keyOrFilename : `${folder}/${this.sanitizeFilename(keyOrFilename)}`;

    if (this.driver === 's3') {
      const response = await this.s3Client.request({
        method: 'GET',
        key,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch object '${key}' from S3: HTTP ${response.status}`);
      }

      if (response.body && typeof response.body.getReader === 'function') {
        return Readable.fromWeb(response.body);
      }
      return response.body;
    }

    const safeName = path.basename(key);
    const filePath = this.resolveLocalPath(folder, safeName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File '${safeName}' not found in storage.`);
    }
    return fs.createReadStream(filePath);
  }

  /**
   * Deletes a file from storage.
   */
  async deleteFile(keyOrFilename, folder = 'resumes') {
    const key = keyOrFilename.includes('/') ? keyOrFilename : `${folder}/${this.sanitizeFilename(keyOrFilename)}`;

    if (this.driver === 's3') {
      try {
        const response = await this.s3Client.request({
          method: 'DELETE',
          key,
        });
        return response.status === 204 || response.status === 200 || response.status === 404;
      } catch (err) {
        console.warn('[Storage] S3 object delete error:', err.message);
        throw err;
      }
    }

    const safeName = path.basename(key);
    const filePath = this.resolveLocalPath(folder, safeName);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  }

  /**
   * Returns signed download URL for an object (valid for expiresInSeconds, default 15 min).
   */
  getSignedDownloadUrl(keyOrFilename, folder = 'resumes', expiresInSeconds = 900) {
    const key = keyOrFilename.includes('/') ? keyOrFilename : `${folder}/${this.sanitizeFilename(keyOrFilename)}`;

    if (this.driver === 's3') {
      const presigned = this.s3Client.generatePresignedUrl(key, expiresInSeconds);
      if (presigned) return presigned;
    }

    const safeName = path.basename(key);
    return `/uploads/${folder}/${safeName}`;
  }

  /**
   * Returns public URL for a stored file.
   */
  getFileUrl(keyOrFilename, folder = 'resumes') {
    const key = keyOrFilename.includes('/') ? keyOrFilename : `${folder}/${this.sanitizeFilename(keyOrFilename)}`;
    if (this.driver === 's3') {
      if (this.cdnDomain) return `https://${this.cdnDomain}/${key}`;
      if (this.endpoint) return `${this.endpoint.replace(/\/+$/, '')}/${this.bucket}/${key}`;
      return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    }
    const safeName = path.basename(key);
    return `/uploads/${folder}/${safeName}`;
  }
}

export const storageService = new StorageService();
export default storageService;
