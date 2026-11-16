import config from './dotenv.js';

const REQUIRED_PRODUCTION_VARS = [
  'JWT_SECRET',
  'JWT_ADMIN_SECRET',
  'JWT_CANDIDATE_SECRET',
  'MONGODB_URI',
];

export const validateBootEnvironment = (env = process.env) => {
  const isProduction = env.NODE_ENV === 'production';
  const missing = [];

  for (const varName of REQUIRED_PRODUCTION_VARS) {
    if (!env[varName] || String(env[varName]).trim() === '') {
      missing.push(varName);
    }
  }

  if (isProduction && missing.length > 0) {
    const errorMsg = `🚨 [FATAL] Production boot halted. Missing required environment variables:\n${missing.map((v) => `   - ${v}`).join('\n')}\nPlease configure these secrets in your cloud platform (Railway/Render/AWS/K8s/Docker).`;
    console.error(errorMsg);
    if (!env.VITEST && env.NODE_ENV === 'production') {
      process.exit(1);
    }
    const err = new Error(errorMsg);
    err.missingVars = missing;
    throw err;
  }

  if (isProduction) {
    const mongoUri = env.MONGODB_URI || config.MONGODB_URI || '';
    if (mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1')) {
      const errorMsg = '🚨 [FATAL] MONGODB_URI points to localhost/127.0.0.1 in production mode.';
      console.error(errorMsg);
      if (!env.VITEST && env.NODE_ENV === 'production') {
        process.exit(1);
      }
      throw new Error(errorMsg);
    }

    if (env.INITIAL_SUPERADMIN_PASSWORD) {
      const loweredPass = env.INITIAL_SUPERADMIN_PASSWORD.toLowerCase();
      const knownDefaults = ['thinkwires@admin2026', 'thinkwires@2026', 'admin123', 'password'];
      if (knownDefaults.some((d) => loweredPass.includes(d)) || env.INITIAL_SUPERADMIN_PASSWORD.length < 16) {
        const errorMsg = '🚨 [FATAL] INITIAL_SUPERADMIN_PASSWORD cannot be a known default, demo password, or under 16 characters in production.';
        console.error(errorMsg);
        if (!env.VITEST && env.NODE_ENV === 'production') {
          process.exit(1);
        }
        throw new Error(errorMsg);
      }
    }
  }

  return { isValid: true, isProduction, checkedVars: REQUIRED_PRODUCTION_VARS };
};

export default validateBootEnvironment;
