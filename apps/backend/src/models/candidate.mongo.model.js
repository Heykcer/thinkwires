import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Candidate name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Candidate email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    currentRole: {
      type: String,
      default: 'Software Engineer',
    },
    headline: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    technicalSkills: {
      type: [String],
      default: [],
    },
    experience: {
      type: Number,
      default: 0,
      min: 0,
    },
    expectedSalary: {
      type: String,
      default: 'Market Standard',
    },
    resumeUrl: {
      type: String,
      default: '',
    },
    portfolioUrl: {
      type: String,
      default: '',
    },
    githubUrl: {
      type: String,
      default: '',
    },
    linkedinUrl: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
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
    workMode: {
      type: String,
      enum: ['Full-Time Looking', 'Freelancer', 'On-Bench'],
      default: 'Full-Time Looking',
    },
    noticePeriod: {
      type: String,
      default: '30 Days',
    },
    assessmentScore: {
      type: Number,
      default: null,
    },
    fitScore: {
      type: Number,
      default: null,
    },
    vettingScore: {
      type: Number,
      default: 85,
    },
    isVetted: {
      type: Boolean,
      default: false,
    },
    specialty: {
      type: String,
      default: 'Systems & Distributed',
    },
    rubric: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    dossier: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      default: null,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      default: null,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation in development
const Candidate =
  mongoose.models.Candidate || mongoose.model('Candidate', candidateSchema);

export default Candidate;
