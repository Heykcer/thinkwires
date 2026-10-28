import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Static require allows @vercel/nft to trace and bundle these JSON seed files into the serverless deployment artifact
let staticMockData = null;
try {
  staticMockData = require('../seeds/mockData.json');
} catch {
  // Handled dynamically if missing
}

let staticAdminData = null;
try {
  staticAdminData = require('../seeds/adminSeedData.json');
} catch {
  // Handled dynamically if missing
}

/**
 * Robustly resolves and loads JSON seed files across various execution environments:
 * Local development, Docker, monorepo workspaces, tests, and Vercel Serverless Functions.
 *
 * @param {string} filename - The name of the seed JSON file (e.g. 'mockData.json')
 * @param {Object} defaultValue - Fallback value if the file cannot be read
 * @returns {Object} Parsed JSON data or defaultValue
 */
export const loadSeedJson = (filename, defaultValue = {}) => {
  if (filename === 'mockData.json' && staticMockData) {
    return staticMockData;
  }
  if (filename === 'adminSeedData.json' && staticAdminData) {
    return staticAdminData;
  }

  const candidatePaths = [
    // Standard relative path from src/utils -> src/seeds
    path.resolve(__dirname, '..', 'seeds', filename),
    // Monorepo root cwd path (Vercel serverless function cwd is /var/task)
    path.resolve(process.cwd(), 'apps', 'backend', 'src', 'seeds', filename),
    // If running with apps/backend as cwd
    path.resolve(process.cwd(), 'src', 'seeds', filename),
    // Direct seeds folder in cwd
    path.resolve(process.cwd(), 'seeds', filename),
    // From api/index.js relative path
    path.resolve(__dirname, '..', '..', '..', 'apps', 'backend', 'src', 'seeds', filename),
  ];

  for (const candidate of candidatePaths) {
    try {
      if (fs.existsSync(candidate)) {
        const raw = fs.readFileSync(candidate, 'utf8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn(`[SeedLoader] Warning reading seed file ${candidate}:`, err.message);
    }
  }

  console.warn(`[SeedLoader] Notice: Seed file ${filename} not found in candidate paths. Using fallback dataset.`);
  return defaultValue;
};

export default loadSeedJson;
