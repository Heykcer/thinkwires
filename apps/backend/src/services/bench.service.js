/**
 * Bench Service
 * Tracks internal staff awaiting client deployment and calculates financial burn rate.
 */

const BENCH_TALENT = [
  {
    id: 'bnch-01',
    candidateId: 'd47ac10b-58cc-4372-a567-0e02b2c3d479',
    name: 'Jordan Lee',
    primarySkill: 'Full Stack Node/React',
    benchStatus: 'on_bench',
    benchSince: new Date(Date.now() - 12 * 86400000).toISOString(),
    dailyCost: 650,
    currentClientProject: null,
  },
  {
    id: 'bnch-02',
    candidateId: 'e89fc21c-69dd-5483-b678-1f13c3d4e580',
    name: 'Elena Rostova',
    primarySkill: 'Python & Data Engineering',
    benchStatus: 'on_bench',
    benchSince: new Date(Date.now() - 5 * 86400000).toISOString(),
    dailyCost: 720,
    currentClientProject: null,
  },
  {
    id: 'bnch-03',
    candidateId: 'c12ba34d-70ee-6594-c789-2a24d4e5f691',
    name: 'Marcus Vance',
    primarySkill: 'DevOps & Site Reliability',
    benchStatus: 'assigned',
    benchSince: new Date(Date.now() - 30 * 86400000).toISOString(),
    dailyCost: 800,
    currentClientProject: 'FinTech Velocity Inc.',
  },
];

export class BenchService {
  static async getBenchSummary() {
    const onBench = BENCH_TALENT.filter((b) => b.benchStatus === 'on_bench');
    const totalDailyBurn = onBench.reduce(
      (acc, curr) => acc + curr.dailyCost,
      0
    );

    return {
      summary: {
        totalOnBench: onBench.length,
        totalAssigned: BENCH_TALENT.filter((b) => b.benchStatus === 'assigned')
          .length,
        totalDailyBurn,
        averageDaysOnBench: 8.5,
      },
      benchCandidates: BENCH_TALENT,
    };
  }

  static async assignBenchTalent({
    candidateId,
    jobId,
    startDate,
    billingRate,
  }) {
    const talent = BENCH_TALENT.find(
      (b) => b.candidateId === candidateId || b.id === candidateId
    );
    if (!talent) {
      const err = new Error(`Bench talent with ID '${candidateId}' not found.`);
      err.statusCode = 404;
      err.code = 'BENCH_TALENT_NOT_FOUND';
      throw err;
    }

    talent.benchStatus = 'assigned';
    talent.currentClientProject = jobId;
    talent.assignedAt = startDate || new Date().toISOString();
    talent.billingRate = billingRate || 100;

    return talent;
  }
}
