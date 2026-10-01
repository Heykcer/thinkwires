/**
 * Job Service
 * Handles business logic for job requisitions and candidate matching.
 */

// Initial seed data for local testing
const INITIAL_JOBS = [
  {
    id: 'c56a4180-65aa-42ec-a945-5fd21dec0538',
    title: 'Senior Full Stack React/Node Engineer',
    company: 'ThinkWire Enterprise Labs',
    description:
      'Lead the architecture of real-time talent routing and AI vector pipelines.',
    requiredSkills: ['React', 'Node.js', 'Express', 'PostgreSQL', 'Docker'],
    requiredExperienceYears: 5,
    engagementMode: 'full_time',
    budgetMin: 130000,
    budgetMax: 165000,
    status: 'open',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'f83b1901-4412-4eb9-813c-738914bca821',
    title: 'DevOps & Cloud Infrastructure Lead',
    company: 'FinTech Velocity Inc.',
    description:
      'Maintain resilient Kubernetes clusters, Redis caching, and automated CI/CD.',
    requiredSkills: ['Kubernetes', 'AWS', 'Docker', 'Terraform', 'PostgreSQL'],
    requiredExperienceYears: 6,
    engagementMode: 'contract',
    budgetMin: 140000,
    budgetMax: 175000,
    status: 'open',
    createdAt: new Date().toISOString(),
  },
];

export class JobService {
  static async listJobs({ page = 1, limit = 10, search, engagementMode }) {
    let filtered = [...INITIAL_JOBS];

    if (engagementMode) {
      filtered = filtered.filter((j) => j.engagementMode === engagementMode);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.requiredSkills.some((s) => s.toLowerCase().includes(q))
      );
    }

    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return {
      data: paginated,
      pagination: {
        total: filtered.length,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(filtered.length / limit) || 1,
      },
    };
  }

  static async getJobById(id) {
    const job = INITIAL_JOBS.find((j) => j.id === id);
    if (!job) {
      const err = new Error(`Job requisition with ID '${id}' not found.`);
      err.statusCode = 404;
      err.code = 'JOB_NOT_FOUND';
      throw err;
    }
    return job;
  }

  static async createJob(jobData) {
    const newJob = {
      id: `job-${Date.now().toString(36)}`,
      ...jobData,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    INITIAL_JOBS.unshift(newJob);
    return newJob;
  }
}
