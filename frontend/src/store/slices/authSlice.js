import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AuthService from '../../services/AuthService';

// Async thunks for authentication
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ role, credentials }, { rejectWithValue }) => {
    try {
      const res = await AuthService.login(role, credentials);
      const userRole = res.data.traveler?.role || res.data.owner?.role || res.data.role || role;
      const token = res.data.token;
      const userId = res.data.traveler?.id || res.data.owner?.id || res.data.user_id || '';

      // Store in localStorage
      if (token) localStorage.setItem('token', token);
      localStorage.setItem('role', userRole);
      if (userId) localStorage.setItem('user_id', userId);

      return {
        token,
        role: userRole,
        userId,
        isLoggedIn: true,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const signupUser = createAsyncThunk(
  'auth/signup',
  async ({ role, credentials }, { rejectWithValue }) => {
    try {
      const res = await AuthService.signup(role, credentials);
      const userRole = res.data.traveler?.role || res.data.owner?.role || res.data.role || role;
      const token = res.data.token;
      const userId = res.data.traveler?.id || res.data.owner?.id || res.data.user_id || '';

      // Store in localStorage
      if (token) localStorage.setItem('token', token);
      localStorage.setItem('role', userRole);
      if (userId) localStorage.setItem('user_id', userId);

      return {
        token,
        role: userRole,
        userId,
        isLoggedIn: true,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Signup failed');
    }
  }
);

export const checkSession = createAsyncThunk(
  'auth/checkSession',
  async (role, { rejectWithValue }) => {
    try {
      const res = await AuthService.checkSession(role);
      const userRole = res.data.role || localStorage.getItem('role');
      
      if (userRole) {
        localStorage.setItem('role', userRole);
      }

      return {
        isLoggedIn: res.data.isLoggedIn || false,
        role: userRole || null,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Session check failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (role, { rejectWithValue }) => {
    try {
      await AuthService.logout(role);
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user_id');
      return { isLoggedIn: false, role: null, token: null, userId: null };
    } catch (error) {
      // Even if logout fails on server, clear local state
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user_id');
      return { isLoggedIn: false, role: null, token: null, userId: null };
    }
  }
);

const initialState = {
  isLoggedIn: false,
  role: localStorage.getItem('role') || null,
  token: localStorage.getItem('token') || null,
  userId: localStorage.getItem('user_id') || null,
  loading: true,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      const { token, role, userId } = action.payload;
      state.token = token;
      state.role = role;
      state.userId = userId;
      state.isLoggedIn = true;
      if (token) localStorage.setItem('token', token);
      if (role) localStorage.setItem('role', role);
      if (userId) localStorage.setItem('user_id', userId);
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isLoggedIn = true;
        state.token = action.payload.token;
        state.role = action.payload.role;
        state.userId = action.payload.userId;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isLoggedIn = false;
      })
      // Signup
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isLoggedIn = true;
        state.token = action.payload.token;
        state.role = action.payload.role;
        state.userId = action.payload.userId;
        state.error = null;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isLoggedIn = false;
      })
      // Check Session
      .addCase(checkSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkSession.fulfilled, (state, action) => {
        state.loading = false;
        state.isLoggedIn = action.payload.isLoggedIn;
        state.role = action.payload.role;
      })
      .addCase(checkSession.rejected, (state) => {
        state.loading = false;
        state.isLoggedIn = false;
        state.role = null;
      })
      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.isLoggedIn = false;
        state.role = null;
        state.token = null;
        state.userId = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.loading = false;
        state.isLoggedIn = false;
        state.role = null;
        state.token = null;
        state.userId = null;
      });
  },
});

export const { clearError, setCredentials } = authSlice.actions;
export default authSlice.reducer;

