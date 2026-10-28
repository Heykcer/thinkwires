import mongoose from 'mongoose';

const jobApplicationSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: [true, 'Candidate ID is required'],
      index: true,
    },
    // Selected Job Reference & Context
    jobId: {
      type: String, // Accepts both string ID (from mock/seed jobs) and ObjectId
      required: [true, 'Job identifier is required'],
      index: true,
    },
    jobTitle: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    department: {
      type: String,
      default: 'Engineering',
      trim: true,
    },
    location: {
      type: String,
      default: 'Remote',
      trim: true,
    },
    employmentType: {
      type: String,
      default: 'Permanent',
      trim: true,
    },
    postingDate: {
      type: String,
      default: '',
      trim: true,
    },

    // Resume Details
    resumeOriginalName: {
      type: String,
      default: '',
      trim: true,
    },
    resumeFileName: {
      type: String,
      default: '',
      trim: true,
    },
    resumePath: {
      type: String,
      default: '',
      trim: true,
    },
    resumeUrl: {
      type: String,
      default: '',
      trim: true,
    },
    avatarUrl: {
      type: String,
      default: '',
      trim: true,
    },
    anonymousCode: {
      type: String,
      default: '',
      trim: true,
    },

    // Basic Information
    lastName: {
      type: String,
      default: '',
      trim: true,
    },
    firstName: {
      type: String,
      default: '',
      trim: true,
    },
    mobileNumber: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      default: '',
      lowercase: true,
      trim: true,
    },
    applicationType: {
      type: String,
      enum: ['Permanent', 'Contract', 'Freelancer'],
      default: 'Permanent',
    },
    noticePeriod: {
      type: String,
      enum: [
        'Immediate',
        '15 Days',
        'Serving NP',
        '30 Days',
        '60 Days',
        '90 Days',
      ],
      default: 'Immediate',
    },
    city: {
      type: String,
      default: '',
      trim: true,
    },
    state: {
      type: String,
      default: '',
      trim: true,
    },

    // Professional Details
    totalExperienceYears: {
      type: String,
      default: '',
      trim: true,
    },
    relevantExperienceYears: {
      type: String,
      default: '',
      trim: true,
    },
    currentEmployer: {
      type: String,
      default: '',
      trim: true,
    },
    currentCTC: {
      type: String,
      default: '',
      trim: true,
    },
    expectedCTC: {
      type: String,
      default: '',
      trim: true,
    },
    skillSet: {
      type: String,
      default: '',
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    linkedInLink: {
      type: String,
      default: '',
      trim: true,
    },
    facebookLink: {
      type: String,
      default: '',
      trim: true,
    },
    candidateNote: {
      type: String,
      default: '',
      trim: true,
    },

    // Candidate Legacy Compatibility fields
    candidateName: {
      type: String,
      default: '',
      trim: true,
    },
    candidateEmail: {
      type: String,
      default: '',
      lowercase: true,
      trim: true,
    },
    candidatePhone: {
      type: String,
      default: '',
      trim: true,
    },
    experience: {
      type: String,
      default: '',
    },
    coverLetter: {
      type: String,
      default: '',
    },

    // Application Status & Lifecycle
    status: {
      type: String,
      enum: [
        'Applied',
        'Screening',
        'Interview',
        'Offered',
        'Hired',
        'Rejected',
        'Withdrawn',
      ],
      default: 'Applied',
    },
    stage: {
      type: String,
      default: 'Application Received',
    },
    emailNotificationStatus: {
      type: String,
      enum: ['Pending', 'Sent', 'Failed', 'Disabled'],
      default: 'Pending',
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: '',
    },

    // AI ATS Fit Scoring & Assessment Gatekeeper
    fitScore: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    fitBadge: {
      type: String,
      enum: ['Top Match', 'Moderate Match', 'Below Threshold', null],
      default: null,
    },
    aiAnalysis: {
      skillsMatch: { type: Number, default: 0 },
      experienceMatch: { type: Number, default: 0 },
      matchedSkills: { type: [String], default: [] },
      missingSkills: { type: [String], default: [] },
      strengths: { type: [String], default: [] },
      growthAreas: { type: [String], default: [] },
      recommendation: { type: String, default: '' },
    },
    evaluationReport: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    assessment: {
      testId: { type: String, default: '' },
      totalPoints: { type: Number, default: 100 },
      passingThreshold: { type: Number, default: 75 },
      timeLimitMinutes: { type: Number, default: 20 },
      questions: { type: [mongoose.Schema.Types.Mixed], default: [] },
    },
    assessmentScore: {
      type: Number,
      default: null,
    },
    assessmentStatus: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Passed', 'Failed'],
      default: 'Not Started',
    },
    screeningPassed: {
      type: Boolean,
      default: null,
    },
    agreedToTerms: {
      type: Boolean,
      default: false,
    },
    agreedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to populate legacy candidate fields for backwards compatibility with candidate portal & admin views
jobApplicationSchema.pre('save', function (next) {
  if (!this.candidateName) {
    this.candidateName =
      `${this.firstName || ''} ${this.lastName || ''}`.trim() || 'Candidate';
  }
  if (!this.candidateEmail) {
    this.candidateEmail = this.email;
  }
  if (!this.candidatePhone) {
    this.candidatePhone = this.mobileNumber;
  }
  if (!this.experience) {
    this.experience = this.totalExperienceYears
      ? `${this.totalExperienceYears} Years`
      : '3 - 5 Years';
  }
  if (!this.coverLetter) {
    this.coverLetter = this.candidateNote || '';
  }
  next();
});

// Compound unique index so a candidate cannot accidentally apply twice for the exact same job
jobApplicationSchema.index({ candidate: 1, jobId: 1 }, { unique: true });

const JobApplication =
  mongoose.models.JobApplication ||
  mongoose.model('JobApplication', jobApplicationSchema);

export default JobApplication;
