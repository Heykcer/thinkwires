/**
 * Migration: 002_create_esr_and_text_indexes.js
 * Establishes compound Equality-Sort-Range (ESR) and full-text search indexes across Mongoose collections (SEC-DB-02, SEC-DB-05, P1 Migration Safety).
 */
export const up = async ({ db }) => {
  console.log('   Creating compound ESR and text search indexes on collections...');

  // 1. Job Requirements ESR and Full-Text Indexes
  await db.collection('jobrequirements').createIndex(
    { isRequisition: 1, createdAt: -1, status: 1 },
    { name: 'idx_job_openings_esr' }
  );
  await db.collection('jobrequirements').createIndex(
    { isRequisition: 1, status: 1, createdAt: -1 },
    { name: 'idx_job_requisitions_esr' }
  );
  await db.collection('jobrequirements').createIndex(
    { title: 'text', description: 'text', requirements: 'text', requiredSkills: 'text', client: 'text' },
    { name: 'idx_job_text_search' }
  );

  // 2. Candidates ESR and Full-Text Indexes
  await db.collection('candidates').createIndex(
    { jobId: 1, createdAt: -1 },
    { name: 'idx_candidates_job_date_esr' }
  );
  await db.collection('candidates').createIndex(
    { name: 'text', currentRole: 'text', technicalSkills: 'text', positionApplied: 'text' },
    { name: 'idx_candidate_text_search' }
  );

  // 3. Job Applications ESR Index
  await db.collection('jobapplications').createIndex(
    { jobId: 1, status: 1, createdAt: -1 },
    { name: 'idx_jobapp_job_status_date_esr' }
  );

  // 4. Clients ESR Index
  await db.collection('clients').createIndex(
    { status: 1, createdAt: -1 },
    { name: 'idx_clients_status_date_esr' }
  );

  // 5. Placements ESR Index
  await db.collection('placements').createIndex(
    { assignmentStatus: 1, createdAt: -1 },
    { name: 'idx_placements_status_date_esr' }
  );
  await db.collection('placements').createIndex(
    { clientName: 1, createdAt: -1 },
    { name: 'idx_placements_client_date_esr' }
  );

  // 6. Articles ESR Index
  await db.collection('articles').createIndex(
    { category: 1, status: 1, createdAt: -1 },
    { name: 'idx_articles_cat_status_date_esr' }
  );

  // 7. Employees ESR Index
  await db.collection('employees').createIndex(
    { deploymentStatus: 1, createdAt: -1 },
    { name: 'idx_employees_status_date_esr' }
  );

  // 8. Pages ESR Index
  await db.collection('pages').createIndex(
    { status: 1, isDeleted: 1, updatedAt: -1 },
    { name: 'idx_pages_status_del_date_esr' }
  );

  // 9. Media ESR Index
  await db.collection('media').createIndex(
    { isDeleted: 1, createdAt: -1 },
    { name: 'idx_media_del_date_esr' }
  );

  // 10. Announcements ESR Index
  await db.collection('announcements').createIndex(
    { status: 1, isDeleted: 1, createdAt: -1 },
    { name: 'idx_announcements_status_del_date_esr' }
  );

  console.log('   ✓ Compound ESR and text search indexes established successfully.');
};

export const verify = async ({ db }) => {
  const [jobIdx, candIdx, appIdx, cliIdx, plIdx, artIdx, empIdx, pageIdx, medIdx, annIdx] = await Promise.all([
    db.collection('jobrequirements').indexes(),
    db.collection('candidates').indexes(),
    db.collection('jobapplications').indexes(),
    db.collection('clients').indexes(),
    db.collection('placements').indexes(),
    db.collection('articles').indexes(),
    db.collection('employees').indexes(),
    db.collection('pages').indexes(),
    db.collection('media').indexes(),
    db.collection('announcements').indexes(),
  ]);

  const hasJobEsr = jobIdx.some((i) => i.name === 'idx_job_openings_esr');
  const hasCandEsr = candIdx.some((i) => i.name === 'idx_candidates_job_date_esr');
  const hasAppEsr = appIdx.some((i) => i.name === 'idx_jobapp_job_status_date_esr');
  const hasCliEsr = cliIdx.some((i) => i.name === 'idx_clients_status_date_esr');
  const hasPlEsr = plIdx.some((i) => i.name === 'idx_placements_status_date_esr');
  const hasArtEsr = artIdx.some((i) => i.name === 'idx_articles_cat_status_date_esr');
  const hasEmpEsr = empIdx.some((i) => i.name === 'idx_employees_status_date_esr');
  const hasPageEsr = pageIdx.some((i) => i.name === 'idx_pages_status_del_date_esr');
  const hasMedEsr = medIdx.some((i) => i.name === 'idx_media_del_date_esr');
  const hasAnnEsr = annIdx.some((i) => i.name === 'idx_announcements_status_del_date_esr');

  return (
    hasJobEsr &&
    hasCandEsr &&
    hasAppEsr &&
    hasCliEsr &&
    hasPlEsr &&
    hasArtEsr &&
    hasEmpEsr &&
    hasPageEsr &&
    hasMedEsr &&
    hasAnnEsr
  );
};

export const down = async ({ db }) => {
  console.log('   Reverting compound ESR and text search indexes...');
  const drops = [
    { col: 'jobrequirements', idx: 'idx_job_openings_esr' },
    { col: 'jobrequirements', idx: 'idx_job_requisitions_esr' },
    { col: 'jobrequirements', idx: 'idx_job_text_search' },
    { col: 'candidates', idx: 'idx_candidates_job_date_esr' },
    { col: 'candidates', idx: 'idx_candidate_text_search' },
    { col: 'jobapplications', idx: 'idx_jobapp_job_status_date_esr' },
    { col: 'clients', idx: 'idx_clients_status_date_esr' },
    { col: 'placements', idx: 'idx_placements_status_date_esr' },
    { col: 'placements', idx: 'idx_placements_client_date_esr' },
    { col: 'articles', idx: 'idx_articles_cat_status_date_esr' },
    { col: 'employees', idx: 'idx_employees_status_date_esr' },
    { col: 'pages', idx: 'idx_pages_status_del_date_esr' },
    { col: 'media', idx: 'idx_media_del_date_esr' },
    { col: 'announcements', idx: 'idx_announcements_status_del_date_esr' },
  ];

  for (const { col, idx } of drops) {
    try {
      await db.collection(col).dropIndex(idx);
    } catch {}
  }
};
