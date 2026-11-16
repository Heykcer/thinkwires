/**
 * Migration: 001_create_core_indexes.js
 * Creates performance indexes across core collections for instant search and filtering (P1 Migration Safety)
 */

export const up = async ({ db }) => {
  console.log('   Creating performance indexes on core collections...');

  // Job Requirements
  await db
    .collection('jobrequirements')
    .createIndex({ department: 1, location: 1, workMode: 1 });
  await db.collection('jobrequirements').createIndex({ status: 1 });
  await db.collection('jobrequirements').createIndex({ requiredSkills: 1 });

  // Candidates
  await db.collection('candidates').createIndex({ technicalSkills: 1 });
  await db.collection('candidates').createIndex({ experience: 1 });
  await db.collection('candidates').createIndex({ status: 1 });

  // Articles
  await db.collection('articles').createIndex({ category: 1, status: 1 });

  // Pages
  await db.collection('pages').createIndex({ category: 1, status: 1 });

  console.log('   Performance indexes established successfully.');
};

export const verify = async ({ db }) => {
  const [jobIdx, candIdx, artIdx, pageIdx] = await Promise.all([
    db.collection('jobrequirements').indexes(),
    db.collection('candidates').indexes(),
    db.collection('articles').indexes(),
    db.collection('pages').indexes(),
  ]);

  const hasJob = jobIdx.some((i) => i.key && i.key.department === 1);
  const hasCand = candIdx.some((i) => i.key && i.key.technicalSkills === 1);
  const hasArt = artIdx.some((i) => i.key && i.key.category === 1);
  const hasPage = pageIdx.some((i) => i.key && i.key.category === 1);

  return hasJob && hasCand && hasArt && hasPage;
};

export const down = async ({ db }) => {
  console.log('   Reverting performance indexes...');
  try {
    await db
      .collection('jobrequirements')
      .dropIndex('department_1_location_1_workMode_1');
    await db.collection('jobrequirements').dropIndex('status_1');
    await db.collection('jobrequirements').dropIndex('requiredSkills_1');
  } catch { }
  try {
    await db.collection('candidates').dropIndex('technicalSkills_1');
    await db.collection('candidates').dropIndex('experience_1');
    await db.collection('candidates').dropIndex('status_1');
  } catch { }
  try {
    await db.collection('articles').dropIndex('category_1_status_1');
  } catch { }
  try {
    await db.collection('pages').dropIndex('category_1_status_1');
  } catch { }
};
