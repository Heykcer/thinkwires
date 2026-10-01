import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';

test('ThinkWire Backend API Gateway Test Suite', async (t) => {
  let server;
  let baseUrl;

  // Start test server on ephemeral port
  await t.test('Server boots up cleanly', async () => {
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
    assert.ok(baseUrl);
  });

  await t.test('GET /health returns healthy status', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.status, 'healthy');
    assert.equal(body.service, 'thinkwire-backend');
  });

  await t.test('GET /api/docs/swagger.json returns OpenAPI spec', async () => {
    const res = await fetch(`${baseUrl}/api/docs/swagger.json`);
    assert.equal(res.status, 200);
    const spec = await res.json();
    assert.equal(spec.openapi, '3.0.0');
    assert.equal(spec.info.title, 'ThinkWire Backend API Gateway');
  });

  await t.test('GET /api/docs serves Swagger UI HTML', async () => {
    const res = await fetch(`${baseUrl}/api/docs`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.match(html, /SwaggerUIBundle/);
    assert.match(html, /swagger-ui/);
  });

  await t.test('POST /api/v1/auth/login validates credentials', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@thinkwire.internal',
        password: 'AdminPass123!',
      }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.user.role, 'admin');
    assert.ok(body.tokens.accessToken);
  });

  await t.test('GET /api/v1/jobs returns paginated job list', async () => {
    const res = await fetch(`${baseUrl}/api/v1/jobs`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.pagination.total >= 1);
  });

  await t.test(
    'Protected route /api/v1/bench requires Bearer token',
    async () => {
      const res = await fetch(`${baseUrl}/api/v1/bench`);
      assert.equal(res.status, 401);
      const body = await res.json();
      assert.equal(body.error.code, 'UNAUTHORIZED');
    }
  );

  await t.test(
    'Protected route /api/v1/bench succeeds with valid dev token',
    async () => {
      const res = await fetch(`${baseUrl}/api/v1/bench`, {
        headers: { Authorization: 'Bearer dev-admin-token' },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.summary);
    }
  );

  // Close server
  await t.test('Server shuts down cleanly', async () => {
    await new Promise((resolve) => server.close(resolve));
  });
});
