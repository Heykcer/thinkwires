/**
 * Candidate Controller
 * Handles HTTP requests for candidate searching, filtering, and profiles.
 */

const CANDIDATES = [
  {
    id: 'd47ac10b-58cc-4372-a567-0e02b2c3d479',
    fullName: 'Jordan Lee',
    title: 'Senior Backend Specialist',
    skills: ['Node.js', 'Express', 'PostgreSQL', 'Docker', 'Redis'],
    totalExperienceYears: 6,
    engagementMode: 'bench',
    benchStatus: 'on_bench',
    hourlyRate: 85,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'a12bc45d-98ee-4172-b890-1f12a3b4c567',
    fullName: 'Sophia Martinez',
    title: 'Senior Frontend React Architect',
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Redux Toolkit'],
    totalExperienceYears: 5,
    engagementMode: 'full_time',
    benchStatus: 'active',
    hourlyRate: 90,
    createdAt: new Date().toISOString(),
  },
];

export class CandidateController {
  static async list(req, res, next) {
    try {
      const { benchStatus, skill } = req.query;
      let data = [...CANDIDATES];

      if (benchStatus) {
        data = data.filter((c) => c.benchStatus === benchStatus);
      }
      if (skill) {
        const q = skill.toLowerCase();
        data = data.filter((c) =>
          c.skills.some((s) => s.toLowerCase().includes(q))
        );
      }

      res.status(200).json({
        success: true,
        data,
        pagination: { total: data.length, page: 1, limit: 10, totalPages: 1 },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const candidate = CANDIDATES.find((c) => c.id === req.params.id);
      if (!candidate) {
        const err = new Error(
          `Candidate with ID '${req.params.id}' not found.`
        );
        err.statusCode = 404;
        err.code = 'CANDIDATE_NOT_FOUND';
        throw err;
      }
      res.status(200).json({ success: true, candidate });
    } catch (error) {
      next(error);
    }
  }
}
