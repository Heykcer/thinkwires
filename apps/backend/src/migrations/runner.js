import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import mongoose from 'mongoose';
import config from '../configs/dotenv.js';
import { connectMongoDB, disconnectMongoDB } from '../configs/mongodb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCRIPTS_DIR = path.join(__dirname, 'scripts');

// Ensure scripts directory exists
if (!fs.existsSync(SCRIPTS_DIR)) {
  fs.mkdirSync(SCRIPTS_DIR, { recursive: true });
}

// Migration schema
const migrationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    batch: { type: Number, required: true },
    appliedAt: { type: Date, default: Date.now },
  },
  { collection: '_migrations' }
);

const MigrationRecord =
  mongoose.models._Migration || mongoose.model('_Migration', migrationSchema);

const connectDB = async () => {
  return connectMongoDB();
};

const getMigrationFiles = () => {
  return fs
    .readdirSync(SCRIPTS_DIR)
    .filter((f) => f.endsWith('.js'))
    .sort();
};

export const getStatus = async () => {
  const connection = await connectDB();
  const appliedRecords = await MigrationRecord.find().sort({ name: 1 }).lean();
  const appliedMap = new Map(appliedRecords.map((r) => [r.name, r]));
  const allFiles = getMigrationFiles();

  console.log('\n================ MIGRATION PIPELINE STATUS ================');
  console.log(`Database: ${connection.name} | Total Files: ${allFiles.length}`);
  console.log('----------------------------------------------------------');

  if (allFiles.length === 0) {
    console.log('No migration scripts found in src/migrations/scripts/');
  }

  for (const file of allFiles) {
    const record = appliedMap.get(file);
    if (record) {
      const dateStr = new Date(record.appliedAt)
        .toISOString()
        .replace('T', ' ')
        .slice(0, 19);
      console.log(
        ` ✅ [APPLIED]  Batch #${record.batch} (${dateStr})  ${file}`
      );
    } else {
      console.log(` ⏳ [PENDING]  Not applied yet                   ${file}`);
    }
  }
  console.log('==========================================================\n');

  return {
    total: allFiles.length,
    applied: appliedRecords.length,
    pending: allFiles.length - appliedRecords.length,
  };
};

export const runUp = async () => {
  const connection = await connectDB();
  const db = connection.db;

  const appliedRecords = await MigrationRecord.find().lean();
  const appliedSet = new Set(appliedRecords.map((r) => r.name));
  const allFiles = getMigrationFiles();
  const pendingFiles = allFiles.filter((f) => !appliedSet.has(f));

  if (pendingFiles.length === 0) {
    console.log('✨ No pending migrations. Database is completely up to date!');
    return;
  }

  const latestRecord = await MigrationRecord.findOne()
    .sort({ batch: -1 })
    .lean();
  const nextBatch = (latestRecord?.batch || 0) + 1;

  console.log(`\n🚀 Starting Migration Pipeline [Batch #${nextBatch}]...`);
  console.log(`Found ${pendingFiles.length} pending migration(s):\n`);

  for (const file of pendingFiles) {
    console.log(`▶ Executing: ${file}...`);
    const scriptPath = path.join(SCRIPTS_DIR, file);
    const scriptUrl = pathToFileURL(scriptPath).href;

    try {
      const migrationModule = await import(scriptUrl);
      if (typeof migrationModule.up !== 'function') {
        throw new Error(`Migration ${file} must export an 'up' async function`);
      }

      await migrationModule.up({ db, mongoose });

      // Verify that migration changes actually exist in the database before recording success (P1 Migration Safety)
      if (typeof migrationModule.verify === 'function') {
        const isVerified = await migrationModule.verify({ db, mongoose });
        if (!isVerified) {
          throw new Error(
            `Verification check failed for migration '${file}': required indexes or schema states were not established in the database.`
          );
        }
      }

      await MigrationRecord.create({
        name: file,
        batch: nextBatch,
        appliedAt: new Date(),
      });

      console.log(`   ✔ Successfully applied ${file}`);
    } catch (err) {
      console.error(`\n❌ Migration failed on ${file}:`, err.message);
      console.error(
        'Aborting subsequent migrations to maintain database integrity.'
      );
      throw err;
    }
  }

  console.log(
    `\n🎉 All ${pendingFiles.length} migration(s) executed successfully in Batch #${nextBatch}!\n`
  );
};

export const runDown = async () => {
  const connection = await connectDB();
  const db = connection.db;

  const latestRecord = await MigrationRecord.findOne()
    .sort({ batch: -1 })
    .lean();
  if (!latestRecord) {
    console.log('ℹ️ No applied migrations found to roll back.');
    return;
  }

  const targetBatch = latestRecord.batch;
  const batchRecords = await MigrationRecord.find({ batch: targetBatch })
    .sort({ name: -1 })
    .lean();

  console.log(
    `\n⏪ Rolling back Migration Batch #${targetBatch} (${batchRecords.length} migration(s))...\n`
  );

  for (const record of batchRecords) {
    console.log(`◀ Reverting: ${record.name}...`);
    const scriptPath = path.join(SCRIPTS_DIR, record.name);
    if (!fs.existsSync(scriptPath)) {
      console.warn(
        `   ⚠️ Warning: Migration file ${record.name} no longer exists on disk!`
      );
      await MigrationRecord.deleteOne({ _id: record._id });
      continue;
    }

    const scriptUrl = pathToFileURL(scriptPath).href;
    try {
      const migrationModule = await import(scriptUrl);
      if (typeof migrationModule.down === 'function') {
        await migrationModule.down({ db, mongoose });
      } else {
        console.warn(
          `   ⚠️ Warning: Migration ${record.name} does not export a 'down' function.`
        );
      }

      await MigrationRecord.deleteOne({ _id: record._id });
      console.log(`   ✔ Successfully reverted ${record.name}`);
    } catch (err) {
      console.error(`\n❌ Rollback failed on ${record.name}:`, err.message);
      throw err;
    }
  }

  console.log(
    `\n✨ Rollback for Batch #${targetBatch} completed successfully.\n`
  );
};

export const createMigration = (rawName) => {
  if (!rawName) {
    console.error(
      '❌ Please specify a migration name. Example: npm run migrate:create add_indexes'
    );
    process.exit(1);
  }

  const cleanName = rawName
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const existingFiles = getMigrationFiles();
  let nextNumber = 1;

  if (existingFiles.length > 0) {
    const lastFile = existingFiles[existingFiles.length - 1];
    const match = lastFile.match(/^(\d+)_/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  const prefix = String(nextNumber).padStart(3, '0');
  const filename = `${prefix}_${cleanName}.js`;
  const filePath = path.join(SCRIPTS_DIR, filename);

  const template = `/**
 * Migration: ${filename}
 * Created at: ${new Date().toISOString()}
 */

export const up = async ({ db, mongoose }) => {
  console.log('   Performing up migration: ${filename}...');
  // Example:
  // await db.collection('my_collection').updateMany({}, { $set: { newField: true } });
};

export const down = async ({ db, mongoose }) => {
  console.log('   Reverting migration: ${filename}...');
  // Example:
  // await db.collection('my_collection').updateMany({}, { $unset: { newField: '' } });
};
`;

  fs.writeFileSync(filePath, template, 'utf8');
  console.log(
    `\n✨ Created new migration template: src/migrations/scripts/${filename}\n`
  );
};

// CLI entrypoint
const main = async () => {
  const command = process.argv[2] || 'status';

  try {
    if (command === 'status') {
      await getStatus();
    } else if (command === 'up') {
      await runUp();
    } else if (command === 'down') {
      await runDown();
    } else if (command === 'create') {
      createMigration(process.argv[3]);
      process.exit(0);
    } else {
      console.log(
        `Unknown command '${command}'. Available commands: up, down, status, create <name>`
      );
    }
  } catch (err) {
    console.error('Pipeline Error:', err.message);
    process.exit(1);
  } finally {
    await disconnectMongoDB();
    process.exit(0);
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
