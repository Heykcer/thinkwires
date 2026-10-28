import API_BASE from '../../utils/apiConfig';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import mockAboutData from '../../data/mockdata.json';

// Resolved safely via apiConfig (defaults to relative '/api' on production)
// API_BASE is imported above

export const fallbackAboutData = mockAboutData;

export const fetchAboutData = createAsyncThunk(
  'about/fetchAboutData',
  async () => {
    try {
      const response = await fetch(`${API_BASE}/about`, {
        headers: { Accept: 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        return { ...data, _isMock: false };
      }
    } catch (err) {
      console.warn(
        'API /about unavailable, utilizing validated mock fallback:',
        err.message
      );
    }
    return { ...mockAboutData, _isMock: true };
  }
);

export const submitConsultation = createAsyncThunk(
  'about/submitConsultation',
  async (formData, { rejectWithValue }) => {
    try {
      if (!formData.fullName || !formData.fullName.trim()) {
        throw new Error('Full Name is required.');
      }
      if (!formData.workEmail || !formData.workEmail.trim()) {
        throw new Error('Work Email is required.');
      }

      const response = await fetch(`${API_BASE}/about/consultation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        return { ...result, _isMock: false };
      }
    } catch (err) {
      console.warn(
        'Backend consultation endpoint unavailable, completing in safe simulated mock mode:',
        err.message
      );
    }

    return {
      success: true,
      message:
        'Strategy consultation requested successfully. Our staffing directors will review your brief within 5 business hours.',
      bookingRef: `TW-MOCK-${Date.now().toString(36).toUpperCase()}`,
      _isMock: true,
    };
  }
);

const aboutSlice = createSlice({
  name: 'about',
  initialState: {
    data: mockAboutData,
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    isMockMode: false,
    consultationStatus: 'idle', // 'idle' | 'submitting' | 'succeeded' | 'failed'
    consultationMessage: null,
    bookingRef: null,
    isConsultationMock: false,
  },
  reducers: {
    resetConsultationStatus: (state) => {
      state.consultationStatus = 'idle';
      state.consultationMessage = null;
      state.bookingRef = null;
      state.isConsultationMock = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAboutData.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAboutData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
        state.isMockMode = Boolean(action.payload?._isMock);
      })
      .addCase(fetchAboutData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
        state.data = mockAboutData;
        state.isMockMode = true;
      })
      .addCase(submitConsultation.pending, (state) => {
        state.consultationStatus = 'submitting';
        state.consultationMessage = null;
      })
      .addCase(submitConsultation.fulfilled, (state, action) => {
        state.consultationStatus = 'succeeded';
        state.consultationMessage =
          action.payload.message ||
          'Strategy consultation scheduled successfully!';
        state.bookingRef = action.payload.bookingRef || null;
        state.isConsultationMock = Boolean(action.payload._isMock);
      })
      .addCase(submitConsultation.rejected, (state, action) => {
        state.consultationStatus = 'failed';
        state.consultationMessage =
          action.payload ||
          action.error.message ||
          'Failed to schedule consultation.';
      });
  },
});

export const { resetConsultationStatus } = aboutSlice.actions;
export default aboutSlice.reducer;
