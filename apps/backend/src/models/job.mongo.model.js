import mongoose from 'mongoose';

const jobRequirementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    client: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    jobId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    category: {
      type: String,
      default: 'Engineering',
    },
    badge: {
      type: String,
      default: '',
    },
    badgeColor: {
      type: String,
      default: 'blue',
    },
    logo: {
      type: String,
      default: 'TW',
    },
    experience: {
      type: String,
      default: '',
    },
    experienceTier: {
      type: String,
      default: '',
    },
    experienceRequired: {
      type: Number,
      default: 3,
      min: 0,
    },
    salary: {
      type: String,
      default: '',
    },
    joining: {
      type: String,
      default: 'Immediate',
    },
    industry: {
      type: String,
      default: 'Information Technology & Cloud',
    },
    jobMode: {
      type: String,
      enum: ['Permanent', 'Contract', 'Contract to Hire'],
      default: 'Permanent',
    },
    noticePeriod: {
      type: String,
      default: 'Immediate',
    },
    noticePeriodOther: {
      type: String,
      default: '',
    },
    officeLocation: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    requirements: {
      type: String,
      default: '',
    },
    skills: {
      type: [String],
      default: [],
    },
    department: {
      type: String,
      default: 'Technology',
    },
    postedDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
    openingsCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    fulfilledCount: {
      type: Number,
      default: 0,
    },
    location: {
      type: String,
      default: 'Remote (India/US)',
    },
    workMode: {
      type: String,
      default: 'Remote',
    },
    priority: {
      type: mongoose.Schema.Types.Mixed,
      default: 'Medium',
    },
    status: {
      type: String,
      default: 'Open',
    },
    budget: {
      type: String,
      default: 'Competitive CTC',
    },
    jobCreationDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
    expectedJoiningDate: {
      type: String,
      default: '',
    },
    targetCloseDate: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: true,
    strict: false,
    id: false,
  }
);

jobRequirementSchema.index({ isRequisition: 1, status: 1, createdAt: -1 });
jobRequirementSchema.index({ status: 1, isRequisition: 1, createdAt: -1 });
jobRequirementSchema.index({ title: 1, client: 1 });
jobRequirementSchema.index({ jobId: 1 });

const JobRequirement =
  mongoose.models.JobRequirement ||
  mongoose.model('JobRequirement', jobRequirementSchema);

export default JobRequirement;
