import { app } from './app.js';
import { config } from './config/environment.js';

const PORT = config.port;
const HOST = config.host;

const server = app.listen(PORT, HOST, () => {
  console.log('\n======================================================');
  console.log('🚀 ThinkWire Backend API Gateway is LIVE');
  console.log('======================================================');
  console.log(
    `🌐 Server Address   : http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`
  );
  console.log(`📖 Swagger API Docs : http://localhost:${PORT}/api/docs`);
  console.log(
    `📄 OpenAPI Spec JSON: http://localhost:${PORT}/api/docs/swagger.json`
  );
  console.log(`🩺 Health Check     : http://localhost:${PORT}/health`);
  console.log(`🌍 Environment      : ${config.env}`);
  console.log(`🤖 AI Microservice  : ${config.aiServiceUrl}`);
  console.log('======================================================\n');
});

// Graceful shutdown handling
function handleShutdown(signal) {
  console.log(
    `\n[SHUTDOWN] Received ${signal}. Closing HTTP server gracefully...`
  );
  server.close(() => {
    console.log('[SHUTDOWN] HTTP server closed cleanly. Exiting process.');
    process.exit(0);
  });

  // Force shutdown after timeout if pending connections hang
  setTimeout(() => {
    console.error('[SHUTDOWN] Forced shutdown after timeout.');
    process.exit(1);
  }, 5000).unref();
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

export default server;
