import API_BASE from '../../utils/apiConfig';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Resolved safely via apiConfig (defaults to relative '/api' on production)
// API_BASE is imported above

export const fallbackPayrollData = {
  hero: {
    badge: 'THIRD-PARTY PAYROLL OUTSOURCING • 100% STATUTORY COMPLIANCE',
    heading: 'Streamline Complex Multi-Jurisdiction Payroll With',
    headingHighlight: 'Zero Compliance Risk',
    description:
      'Automate salary disbursements, tax withholdings, EPF/ESI statutory contributions, and labor compliance in India and cross-border with 100% precision and guaranteed on-time credit.',
    ctaConsultationText: 'Request Payroll Consultation',
    ctaComplianceText: 'Download Compliance Checklist',
    trustMetrics: [
      { value: '100%', label: 'Regulatory Compliance', icon: 'policy' },
      { value: '0% Error', label: 'Processing SLA', icon: 'timer_off' },
      { value: '10 - 10k+', label: 'Employee Headcount', icon: 'groups' },
    ],
    telemetryCard: {
      title: 'Monthly Auto-Disbursement Engine',
      statusBadge: 'LIVE AUDIT PASS',
      batchMonth: 'Current Batch Run (October 2025)',
      reconciledText: '100% Reconciled',
      totalAmount: '₹ 8,42,19,450',
      breakdown: [
        {
          label: 'Net Salary Disbursement',
          percentage: '74.2%',
          color: 'cobalt-bright',
        },
        {
          label: 'EPF + ESI + Professional Tax Filings',
          percentage: '16.8%',
          color: 'emerald-accent',
        },
        {
          label: 'TDS Deductions (Form 24Q SLA)',
          percentage: '9.0%',
          color: 'secondary-container',
        },
      ],
      auditLogs: [
        {
          icon: 'check_circle',
          title: 'Form 16 Automated Issuance',
          status: 'Instant',
          color: 'emerald-accent',
        },
        {
          icon: 'security',
          title: 'SOC 2 Type II Regulated Ledger',
          status: 'Verified',
          color: 'text-muted',
        },
        {
          icon: 'account_balance',
          title: 'HDFC / ICICI / Axis Direct API Batch',
          status: 'Zero-Bounce',
          color: 'cobalt-glow',
        },
      ],
    },
  },
  pillarsSection: {
    eyebrow: 'End-to-End Governance',
    heading: 'Four Pillars of Thinkwires Institutional Payroll Management',
    description:
      'We combine statutory domain mastery with state-of-the-art computational infrastructure to insulate your organization from regulatory penalties, computational leakage, and operational drag.',
    pillars: [
      {
        step: '01. Compliance Shield',
        title: '100% Regulatory Compliance',
        description:
          'Complete oversight of EPF, ESI, Gratuity provisions, Professional Tax challans, TDS/Form 16 filings, and regional labor welfare fund compliance with zero tolerance for deadlines missed.',
        icon: 'verified_user',
        highlight: 'Zero Statutory Penalties Guaranteed',
      },
      {
        step: '02. Mathematical Precision',
        title: 'Precise Legal & Compensation Math',
        description:
          'Meticulous basic, HRA, special allowances, overtime schemes, expense reimbursements, and statutory deductions calculated to the nearest rupee without friction or manual calculation defects.',
        icon: 'calculate',
        highlight: 'Dual Multi-Tier Validation',
      },
      {
        step: '03. Operational Velocity',
        title: 'Optimized Cost & Turnaround',
        description:
          'Slash in-house human resource operational overhead by up to 50% with cloud payroll automation, eliminate expensive internal software licenses, and accelerate month-end closing cycles.',
        icon: 'trending_up',
        highlight: 'Up to 50% Overhead Reduction',
      },
      {
        step: '04. Data Fortress',
        title: 'Enterprise Security & Access Control',
        description:
          'SOC 2 Type II and ISO 27001 audited data isolation, hardware encrypted salary registers, role-based hierarchy views, and frictionless employee self-service credentialing.',
        icon: 'enhanced_encryption',
        highlight: '256-Bit Encrypted Registers',
      },
    ],
  },
  beneficiariesSection: {
    eyebrow: 'Architected For Scale',
    heading: 'Who Benefits From Thinkwires Payroll Outsourcing?',
    description:
      'From fast-moving venture startups to multi-entity foreign subsidiaries, our payroll model dynamically flexes around headcount and regulatory jurisdictions.',
    segments: [
      {
        step: '01',
        icon: 'rocket_launch',
        title: 'Startups & Fast-Growing Scaleups',
        description:
          'Eliminate the need to hire internal HR administrators or purchase expensive payroll licenses. Focus engineering capital directly on core product iterations.',
        points: [
          'Agile month-to-month onboarding',
          'Direct integration with employee offer letters',
          'Zero setup penalty for shifting headcount',
        ],
      },
      {
        step: '02',
        icon: 'domain',
        title: 'Large MNCs & Global Enterprises',
        description:
          'Institutional-grade reconciliation across multi-city branches, diverse collective wage bands, and statutory audit-ready balance sheets for thousands of personnel.',
        points: [
          'Dedicated on-shore compliance manager',
          'Comprehensive annual statutory audits',
          'Multi-level approval role matrices',
        ],
      },
      {
        step: '03',
        icon: 'hub',
        title: 'Recruitment Agencies & Staffing Subcontractors',
        description:
          'Seamless third-party payroll fulfillment for deployed IT and functional contractors. We act as your invisible backend engine with white-labeled salary slips.',
        points: [
          'White-label automated pay slips',
          'Contingent worker labor compliance',
          'Weekly or bi-weekly disbursement runs',
        ],
      },
      {
        step: '04',
        icon: 'public',
        title: 'Cross-Border GCCs & Remote Tech Pods',
        description:
          'Enabling North American and European enterprises to seamlessly operate Global Capability Centers (GCCs) in India without establishing separate internal payroll departments.',
        points: [
          'FX-compliant foreign remittances',
          'Double taxation treaty adherence',
          'Cross-timezone enterprise SLA support',
        ],
      },
    ],
  },
  featuresSection: {
    eyebrow: 'Enterprise Operational Capabilities',
    heading: 'Engineered For Zero Friction, Maximum Accuracy',
    description:
      'Every touchpoint in the Thinkwires payroll framework is backed by an iron-clad SLA, robust banking APIs, and proactive regulatory filings.',
    features: [
      {
        icon: 'gavel',
        title: 'Taxation & Statutory Audit Readiness',
        description:
          'We manage monthly computation of Tax Deducted at Source (TDS), quarterly e-TDS returns (Form 24Q), automated distribution of digitally signed Form 16s, and full adherence to Employee Provident Fund (PF) and State Insurance (ESI) laws.',
        tags: ['PF Challan ECR', 'Form 24Q Returns', 'Form 16 Generation'],
        accent: 'primary',
      },
      {
        icon: 'payments',
        title: 'On-Time Salary Guarantee Across Gateways',
        description:
          'Direct integration with major Tier-1 banking channels ensures salaries credit precisely on schedule (weekly, bi-weekly, or monthly). We eliminate settlement bottlenecks through pre-funded escrow processing and NACH protocol integration.',
        tags: [
          'Direct Host-to-Host NEFT/RTGS',
          'Real-Time Bounce Handling',
          'Zero-Delay Guarantee',
        ],
        accent: 'cobalt-bright',
      },
      {
        icon: 'receipt_long',
        title: 'Automated Pay-Slips & Year-End Tax Reports',
        description:
          'Empower your staff with password-protected, encrypted pay slips delivered automatically via email and accessible through self-service web portals. Employees can easily model tax regimes (Old vs. New) and submit investment declarations.',
        tags: [
          'Encrypted PDF Pay-Slips',
          'Self-Service Tax Portal',
          'IT Declaration Engine',
        ],
        accent: 'tertiary',
      },
      {
        icon: 'support_agent',
        title: 'Dedicated Compliance Officer & 24/7 Desk',
        description:
          'Never get stuck in a ticket queue. You are paired with a designated Chartered Payroll Specialist and compliance counsel who actively monitors changing state government notifications and handles employee inquiries on your behalf.',
        tags: [
          'Named Compliance Manager',
          'Sub-Hour Query Resolution',
          'Statutory Notice Defence',
        ],
        accent: 'navy-dark',
      },
    ],
  },
  consultationSection: {
    eyebrow: 'Enterprise Consultation',
    heading: 'Get Started with Thinkwires HR Today!',
    description:
      'Avoid payroll errors, compliance risks, and time-consuming internal administration. Partner with Thinkwires HR and experience seamless, institutional payroll management.',
    hqDetails: {
      title: 'Direct Corporate Headquarters',
      address:
        'Plot No. 20, Block H-1/A, Sector 63, Noida, Uttar Pradesh 201301',
      email: 'hr@thinkwires.com',
      hours: '09:00 AM – 19:00 PM IST (Mon–Sat)',
      regions: ['United States', 'Canada Hub', 'India Central'],
    },
  },
};

export const fetchPayrollData = createAsyncThunk(
  'payroll/fetchPayrollData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/payroll`);
      if (!response.ok) {
        throw new Error(`Failed to fetch payroll data: ${response.statusText}`);
      }
      return await response.json();
    } catch (err) {
      console.warn('Falling back to local payroll data:', err.message);
      return fallbackPayrollData;
    }
  }
);

export const submitPayrollConsultation = createAsyncThunk(
  'payroll/submitPayrollConsultation',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/payroll/consultation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        throw new Error('Failed to submit consultation request');
      }
      return await response.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const payrollSlice = createSlice({
  name: 'payroll',
  initialState: {
    data: fallbackPayrollData,
    status: 'idle',
    error: null,
    submitStatus: 'idle',
    submitMessage: null,
  },
  reducers: {
    resetSubmitStatus: (state) => {
      state.submitStatus = 'idle';
      state.submitMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayrollData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPayrollData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload || fallbackPayrollData;
      })
      .addCase(fetchPayrollData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
        state.data = fallbackPayrollData;
      })
      .addCase(submitPayrollConsultation.pending, (state) => {
        state.submitStatus = 'loading';
      })
      .addCase(submitPayrollConsultation.fulfilled, (state, action) => {
        state.submitStatus = 'succeeded';
        state.submitMessage = action.payload.message;
      })
      .addCase(submitPayrollConsultation.rejected, (state, action) => {
        state.submitStatus = 'failed';
        state.submitMessage =
          action.payload || 'Submission failed. Please try again.';
      });
  },
});

export const { resetSubmitStatus } = payrollSlice.actions;
export default payrollSlice.reducer;
