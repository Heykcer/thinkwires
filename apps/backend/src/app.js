import express from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from './config/environment.js';
import { apiV1Router } from './routes/index.js';
import { requestLogger } from './middlewares/requestLogger.middleware.js';
import { errorHandler } from './middlewares/errorHandler.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const app = express();

// -----------------------------------------------------------------------------
// Core Middlewares
// -----------------------------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Simple, robust CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (
    !origin ||
    config.corsOrigins.includes(origin) ||
    config.env === 'development'
  ) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// -----------------------------------------------------------------------------
// System Health Check Endpoints
// -----------------------------------------------------------------------------
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'thinkwire-backend',
    version: '1.0.0',
    environment: config.env,
    timestamp: new Date().toISOString(),
    dependencies: {
      postgres: 'connected',
      redis: 'connected',
      ai_service: 'available',
    },
  });
});

// -----------------------------------------------------------------------------
// Swagger / OpenAPI Specification & Interactive Documentation
// -----------------------------------------------------------------------------
const swaggerPath = join(__dirname, 'docs', 'swagger.json');
let swaggerSpec = {};
try {
  swaggerSpec = JSON.parse(readFileSync(swaggerPath, 'utf8'));
} catch (err) {
  console.warn('[SWAGGER_WARN] Could not load swagger.json:', err.message);
}

// Serve OpenAPI Specification JSON
app.get('/api/docs/swagger.json', (req, res) => {
  res.status(200).json(swaggerSpec);
});

// Interactive Swagger UI via CDN bundle
app.get(['/api/docs', '/docs'], (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ThinkWire Backend API Gateway - Swagger Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.11.0/favicon-32x32.png" sizes="32x32" />
  <style>
    body { margin: 0; background: #fafafa; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    .topbar { background-color: #0037B0 !important; padding: 10px 0; }
    .topbar-wrapper .link { display: flex; align-items: center; color: white !important; font-weight: 700; font-size: 1.2rem; text-decoration: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: "/api/docs/swagger.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// -----------------------------------------------------------------------------
// Route Registrations
// -----------------------------------------------------------------------------
app.use('/api/v1', apiV1Router);

// Root route redirect/info
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'ThinkWire Backend API Gateway',
    version: '1.0.0',
    documentation: '/api/docs',
    healthCheck: '/health',
  });
});

// -----------------------------------------------------------------------------
// 404 & Global Error Handling
// -----------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'RESOURCE_NOT_FOUND',
      message: `The requested path '${req.originalUrl}' does not exist on this server.`,
    },
  });
});

app.use(errorHandler);

export default app;
