import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getApiBaseUrl } from '../../utils/apiConfig';

/**
 * Safely parse JSON response from server, preventing syntax crashes if the endpoint
 * returns HTML (e.g. 404/502 from proxy or static host).
 */
const safeParseJson = async (response, defaultErrorMessage = 'Request failed') => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      // JSON parse failed
    }
  }
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        'Backend service unreachable (404 Not Found). Please verify your backend API URL.'
      );
    }
    throw new Error(
      `${defaultErrorMessage} (HTTP ${response.status} ${response.statusText})`
    );
  }
  return {};
};

/**
 * Check and restore session on page load using HttpOnly cookie
 */
export const checkAuthSession = createAsyncThunk(
  'auth/checkAuthSession',
  async (_, { rejectWithValue }) => {
    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/auth/me`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // transmits HttpOnly cookies
      });

      if (!response.ok) {
        return rejectWithValue('Not authenticated');
      }

      const data = await safeParseJson(response, 'Session verification failed');
      if (data.authenticated && data.candidate) {
        return data.candidate;
      }
      return rejectWithValue('Unauthenticated');
    } catch (err) {
      return rejectWithValue(err.message || 'Session verification failed');
    }
  }
);

/**
 * Login Candidate
 */
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      let data;
      try {
        data = await safeParseJson(response, 'Login failed');
      } catch (parseErr) {
        return rejectWithValue(parseErr.message);
      }

      if (!response.ok) {
        return rejectWithValue(
          data.error || 'Login failed. Please check your credentials.'
        );
      }

      return data.candidate;
    } catch (err) {
      return rejectWithValue(err.message || 'Network error during login.');
    }
  }
);

/**
 * Register Candidate
 */
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (
    { name, email, password, confirmPassword, phone },
    { rejectWithValue }
  ) => {
    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password, confirmPassword, phone }),
      });

      let data;
      try {
        data = await safeParseJson(response, 'Registration failed');
      } catch (parseErr) {
        return rejectWithValue(parseErr.message);
      }

      if (!response.ok) {
        return rejectWithValue(data.error || 'Registration failed.');
      }

      return data.candidate;
    } catch (err) {
      return rejectWithValue(
        err.message || 'Network error during registration.'
      );
    }
  }
);

/**
 * Logout Candidate
 */
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await safeParseJson(response, 'Logout failed');
        return rejectWithValue(data.error || 'Logout failed');
      }

      return true;
    } catch (err) {
      return rejectWithValue(err.message || 'Logout failed');
    }
  }
);

/**
 * Update Profile
 */
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/candidate/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profileData),
      });

      const data = await safeParseJson(response, 'Failed to update profile');
      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to update profile');
      }

      return data.candidate;
    } catch (err) {
      return rejectWithValue(
        err.message || 'Network error during profile update.'
      );
    }
  }
);

const initialState = {
  user: null,
  isAuthenticated: false,
  isInitializing: true, // true until first /api/auth/me check completes
  loading: false,
  error: null,
  successMessage: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    setUserAvatar: (state, action) => {
      if (state.user) {
        state.user.avatarUrl = action.payload.avatarUrl;
        state.user.avatarType = action.payload.avatarType;
      }
    },
  },
  extraReducers: (builder) => {
    // Check Session
    builder
      .addCase(checkAuthSession.pending, (state) => {
        state.isInitializing = true;
      })
      .addCase(checkAuthSession.fulfilled, (state, action) => {
        state.isInitializing = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(checkAuthSession.rejected, (state) => {
        state.isInitializing = false;
        state.isAuthenticated = false;
        state.user = null;
      });

    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Invalid login credentials';
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Registration failed';
      });

    // Logout
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.loading = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        // Even if network failed, clear local state
        state.isAuthenticated = false;
        state.user = null;
        state.loading = false;
      });

    // Profile Update
    builder
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.successMessage = 'Profile updated successfully!';
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update profile';
      });
  },
});

export const { clearAuthError, clearSuccessMessage, setUserAvatar } =
  authSlice.actions;
export default authSlice.reducer;
