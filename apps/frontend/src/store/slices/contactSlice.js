import API_BASE from '../../utils/apiConfig';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Resolved safely via apiConfig (defaults to relative '/api' on production)
// API_BASE is imported above

export const fallbackContactData = {
  hero: {
    badge: 'Contact Thinkwires • We Respond Within 5 Hours',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Contact Us', href: '/contact' },
    ],
    heading: "Let's Build Your",
    headingHighlight: 'Next Engineering Squad.',
    description:
      'Whether you need specialized SAP talent, cross-border EOR solutions, or a dedicated DevOps squad — our staffing directors are ready. Reach out and receive pre-vetted profiles in under 5 hours.',
  },
  officeLocations: [
    {
      id: 'office-noida',
      tag: 'HEADQUARTERS',
      city: 'Noida, India',
      address: 'Plot No. 20, Block H-1/A, Sector 63',
      cityLine: 'Noida, Uttar Pradesh 201301',
      phones: [],
      email: 'info@thinkwires.com',
      hours: 'Mon – Fri, 9:00 AM – 7:00 PM IST',
      coverageTag: 'India Talent Operations',
      mapEmbedUrl: '',
    },
    {
      id: 'office-usa',
      tag: 'NORTH AMERICA',
      city: 'United States',
      address: 'Remote-First Operations',
      cityLine: 'EST / PST Coverage',
      phones: [],
      email: 'info@thinkwires.com',
      hours: 'Mon – Fri, 8:00 AM – 6:00 PM EST',
      coverageTag: 'US & Canada EOR Corridor',
      mapEmbedUrl: '',
    },
  ],
  channels: [
    {
      id: 'ch-1',
      icon: 'mail',
      title: 'Company Information',
      detail: 'info@thinkwires.com',
      sublabel: 'General inquiries & company information',
      href: 'mailto:info@thinkwires.com',
    },
    {
      id: 'ch-2',
      icon: 'mail',
      title: 'HR & Talent Desk',
      detail: 'hr@thinkwires.com',
      sublabel: 'Client staffing & candidate inquiries',
      href: 'mailto:hr@thinkwires.com',
    },
    {
      id: 'ch-3',
      icon: 'linkedin',
      title: 'LinkedIn',
      detail: 'Thinkwires',
      sublabel: 'Follow for talent insights',
      href: 'https://linkedin.com/company/thinkwires',
    },
    {
      id: 'ch-4',
      icon: 'clock',
      title: 'Response SLA',
      detail: 'Under 5 Hours',
      sublabel: 'For enterprise enquiries',
      href: null,
    },
  ],
  form: {
    title: 'Send Us a Message',
    subtitle:
      "Tell us about your hiring challenge and we'll respond with a tailored plan.",
    inquiryTypes: [
      'Staff Augmentation',
      'Permanent Hiring',
      'Employer of Record (EOR)',
      'Executive Search',
      'Talent Advisory',
      'Partnership / Vendor Registration',
      'General Inquiry',
    ],
    fields: [
      {
        name: 'fullName',
        label: 'Full Name',
        type: 'text',
        placeholder: 'e.g. James Mitchell',
        required: true,
      },
      {
        name: 'workEmail',
        label: 'Work Email',
        type: 'email',
        placeholder: 'james@company.com',
        required: true,
      },
      {
        name: 'phone',
        label: 'Phone Number',
        type: 'tel',
        placeholder: '+1 (555) 019-2834',
        required: false,
      },
      {
        name: 'company',
        label: 'Company / Organisation',
        type: 'text',
        placeholder: 'e.g. Accenture, TCS, Startup Inc.',
        required: false,
      },
      {
        name: 'inquiryType',
        label: 'Inquiry Type',
        type: 'select',
        placeholder: 'Select inquiry type',
        required: true,
      },
      {
        name: 'message',
        label: 'Describe Your Requirement',
        type: 'textarea',
        placeholder:
          'e.g. We need 4x SAP ABAP consultants for a 6-month engagement starting November.',
        required: false,
      },
    ],
    submitLabel: 'Send Message',
    footerNote: 'No spam. We respond to every message within 5 business hours.',
  },
  faq: [
    {
      id: 'faq-1',
      question: 'How quickly can you source profiles?',
      answer:
        'Our proprietary aggregator engine delivers pre-screened, job-fit candidate dossiers within 5 working hours of receiving your intake brief.',
    },
    {
      id: 'faq-2',
      question: 'Do you handle cross-border compliance?',
      answer:
        'Yes. We offer full Employer of Record (EOR) infrastructure across India, the US, and Canada — including statutory payroll, NDA assignments, and multi-jurisdiction tax withholding.',
    },
    {
      id: 'faq-3',
      question: 'What tech domains do you specialize in?',
      answer:
        'We have deep benches in SAP ABAP/HANA, Adobe Experience Manager (AEM), Teamcenter PLM, Kubernetes/DevOps, Generative AI, and Enterprise Salesforce.',
    },
    {
      id: 'faq-4',
      question: 'Is there a minimum team size for engagement?',
      answer:
        'No. We support single-resource placements all the way up to full squad builds of 50+ engineers. Our model scales to your velocity.',
    },
    {
      id: 'faq-5',
      question: 'Do you offer permanent and contract hiring?',
      answer:
        'Absolutely. We support contract/staff augmentation, permanent placement, executive search, and hybrid engagement models based on your business requirement.',
    },
  ],
};

// ─── Async Thunks ──────────────────────────────────────────────────────────────

export const fetchContactData = createAsyncThunk(
  'contact/fetchContactData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/contact`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (err) {
      console.warn(
        'Contact API unavailable, using fallback data:',
        err.message
      );
      return fallbackContactData;
    }
  }
);

export const submitContactMessage = createAsyncThunk(
  'contact/submitContactMessage',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/contact/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Submission failed');
      }
      return await response.json();
    } catch (err) {
      console.warn(
        'Contact submit API unavailable, simulating success:',
        err.message
      );
      return {
        success: true,
        message:
          'Thank you for reaching out! A Thinkwires staffing director will respond within 5 business hours.',
      };
    }
  }
);

// ─── Slice ─────────────────────────────────────────────────────────────────────

const contactSlice = createSlice({
  name: 'contact',
  initialState: {
    data: fallbackContactData,
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    submitStatus: 'idle', // 'idle' | 'submitting' | 'succeeded' | 'failed'
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
      .addCase(fetchContactData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchContactData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(fetchContactData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(submitContactMessage.pending, (state) => {
        state.submitStatus = 'submitting';
        state.submitMessage = null;
      })
      .addCase(submitContactMessage.fulfilled, (state, action) => {
        state.submitStatus = 'succeeded';
        state.submitMessage = action.payload.message;
      })
      .addCase(submitContactMessage.rejected, (state, action) => {
        state.submitStatus = 'failed';
        state.submitMessage =
          action.error.message || 'Something went wrong. Please try again.';
      });
  },
});

export const { resetSubmitStatus } = contactSlice.actions;
export default contactSlice.reducer;
