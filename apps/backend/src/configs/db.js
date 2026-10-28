import { Sequelize } from 'sequelize';
import config from './dotenv.js';

const isProduction = config.NODE_ENV === 'production';
const isServerless = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
);

// Auto-detect cloud providers (Neon, Supabase, RDS) to configure SSL defaults
// while leaving local dev/docker connections unencrypted unless DB_SSL is explicitly set.
const isLocalhost =
  !config.DATABASE_URL ||
  config.DATABASE_URL.includes('localhost') ||
  config.DATABASE_URL.includes('127.0.0.1') ||
  config.DATABASE_URL.includes('::1');

const isCloudManaged =
  typeof config.DATABASE_URL === 'string' &&
  (config.DATABASE_URL.includes('neon.tech') ||
    config.DATABASE_URL.includes('supabase.co') ||
    config.DATABASE_URL.includes('rds.amazonaws.com') ||
    config.DATABASE_URL.includes('render.com') ||
    config.DATABASE_URL.includes('azure.com') ||
    config.DATABASE_URL.includes('sslmode=require') ||
    config.DATABASE_URL.includes('ssl=true'));

const enableSsl =
  process.env.DB_SSL === 'true' ||
  (process.env.DB_SSL !== 'false' && (isCloudManaged || (isProduction && !isLocalhost)));

export const sequelize = new Sequelize(config.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  dialectOptions: {
    connectTimeout: isServerless ? 3000 : (isCloudManaged ? 10000 : 5000),
    ...(enableSsl
      ? {
          ssl: {
            require: true,
            // Cloud poolers (Neon/Supabase) present TLS certs requiring relaxed verification in Node
            rejectUnauthorized: false,
          },
        }
      : {}),
  },
  pool: {
    max: isProduction ? 10 : 5,
    min: 0,
    acquire: 15000,
    idle: 5000,
  },
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    const target = isLocalhost ? 'Local PostgreSQL' : 'Cloud PostgreSQL';
    console.log(
      `[PostgreSQL] Connection established successfully (${target}, SSL: ${enableSsl}).`
    );
  } catch (error) {
    console.error('[PostgreSQL] Unable to connect to the database:', error);
    throw error;
  }
};
