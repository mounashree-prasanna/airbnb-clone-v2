import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AuthService from '../../services/AuthService';

// Async thunks for authentication
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ role, credentials }, { rejectWithValue }) => {
    try {
      const res = await AuthService.login(role, credentials);
      const userRole = res.data.traveler?.role || res.data.owner?.role || res.data.role || role;
      const token = res.data.accessToken || res.data.token;
      const refreshToken = res.data.refreshToken;
      const userId = res.data.traveler?.id || res.data.owner?.id || res.data.user_id || '';

      // Store in localStorage
      if (token) localStorage.setItem('token', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('role', userRole);
      if (userId) localStorage.setItem('user_id', userId);

      return {
        token,
        refreshToken,
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
      const token = res.data.accessToken || res.data.token;
      const refreshToken = res.data.refreshToken;
      const userId = res.data.traveler?.id || res.data.owner?.id || res.data.user_id || '';

      // Store in localStorage
      if (token) localStorage.setItem('token', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('role', userRole);
      if (userId) localStorage.setItem('user_id', userId);

      return {
        token,
        refreshToken,
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

      // Update access token if a new one was provided
      if (res.data.accessToken) {
        localStorage.setItem('token', res.data.accessToken);
      }

      const token = res.data.accessToken || localStorage.getItem('token');
      const userId = localStorage.getItem('user_id');
      
      return {
        isLoggedIn: res.data.isLoggedIn || false,
        role: userRole || null,
        token: token || null,
        userId: userId || null,
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
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('role');
      localStorage.removeItem('user_id');
      return { isLoggedIn: false, role: null, token: null, userId: null };
    } catch (error) {
      // Even if logout fails on server, clear local state
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('role');
      localStorage.removeItem('user_id');
      return { isLoggedIn: false, role: null, token: null, userId: null };
    }
  }
);

const getInitialAuthState = () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const userId = localStorage.getItem('user_id');
  const isAuthenticated = !!(token && role);
  
  return {
    isLoggedIn: isAuthenticated,
    isAuthenticated: isAuthenticated,
    role: role || null,
    token: token || null,
    userId: userId || null,
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    loading: false,
    error: null,
  };
};

const initialState = getInitialAuthState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetAuth: (state) => {
      // Reset auth state to initial unauthenticated state
      state.isLoggedIn = false;
      state.isAuthenticated = false;
      state.token = null;
      state.role = null;
      state.userId = null;
      state.error = null;
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('role');
      localStorage.removeItem('user_id');
    },
    setCredentials: (state, action) => {
      const { token, role, userId } = action.payload;
      state.token = token;
      state.role = role;
      state.userId = userId;
      state.isLoggedIn = true;
      state.isAuthenticated = true;
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
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.status = 'succeeded';
        state.isLoggedIn = true;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.role = action.payload.role;
        state.userId = action.payload.userId;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.status = 'failed';
        state.error = action.payload;
        state.isLoggedIn = false;
        state.isAuthenticated = false;
      })
      // Signup
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.status = 'loading';
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.status = 'succeeded';
        state.isLoggedIn = true;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.role = action.payload.role;
        state.userId = action.payload.userId;
        state.error = null;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.status = 'failed';
        state.error = action.payload;
        state.isLoggedIn = false;
        state.isAuthenticated = false;
      })
      // Check Session
      .addCase(checkSession.pending, (state) => {
        state.loading = true;
        state.status = 'loading';
      })
      .addCase(checkSession.fulfilled, (state, action) => {
        state.loading = false;
        state.status = 'succeeded';
        state.isLoggedIn = action.payload.isLoggedIn || false;
        state.isAuthenticated = action.payload.isLoggedIn || false;
        state.role = action.payload.role || state.role;
        // Update token and userId if available
        if (action.payload.token) {
          state.token = action.payload.token;
          localStorage.setItem('token', action.payload.token);
        }
        if (action.payload.userId) {
          state.userId = action.payload.userId;
        }
      })
      .addCase(checkSession.rejected, (state) => {
        state.loading = false;
        state.status = 'failed';
        state.isLoggedIn = false;
        state.isAuthenticated = false;
        state.role = null;
      })
      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.status = 'loading';
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.status = 'succeeded';
        state.isLoggedIn = false;
        state.isAuthenticated = false;
        state.role = null;
        state.token = null;
        state.userId = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.loading = false;
        state.status = 'failed';
        state.isLoggedIn = false;
        state.isAuthenticated = false;
        state.role = null;
        state.token = null;
        state.userId = null;
      });
  },
});

export const { clearError, resetAuth, setCredentials } = authSlice.actions;
export default authSlice.reducer;

