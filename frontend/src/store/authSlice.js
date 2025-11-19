import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import AuthService from "../services/AuthService";

const getStoredRole = () => localStorage.getItem("role");
const getStoredToken = () => localStorage.getItem("token");
const getStoredUser = () => localStorage.getItem("user_id");

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ role, credentials }, { rejectWithValue }) => {
    try {
      const { data } = await AuthService.login(role, credentials);
      const resolvedRole = data?.traveler?.role || data?.role || role;
      const token = data?.token || null;
      const userId =
        data?.traveler?._id ||
        data?.traveler?.id ||
        data?.owner?._id ||
        data?.owner?.id ||
        data?.user?._id ||
        data?.user?.id ||
        null;

      if (token) localStorage.setItem("token", token);
      if (resolvedRole) localStorage.setItem("role", resolvedRole);
      if (userId) localStorage.setItem("user_id", userId);

      return {
        token,
        role: resolvedRole,
        userId,
        message: data?.message || "Logged in successfully",
      };
    } catch (err) {
      const message =
        err.response?.data?.message || "Login failed. Please try again.";
      return rejectWithValue(message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { getState, rejectWithValue }) => {
    try {
      const currentRole = getState().auth.role || getStoredRole() || "traveler";
      await AuthService.logout(currentRole);
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user_id");
      return true;
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to logout. Please try again.";
      return rejectWithValue(message);
    }
  }
);

export const checkSession = createAsyncThunk(
  "auth/checkSession",
  async (_, { rejectWithValue }) => {
    try {
      const storedRole = getStoredRole();
      const storedToken = getStoredToken();
      
      // If no token or role in localStorage, user is not logged in
      if (!storedToken || !storedRole) {
        return {
          isLoggedIn: false,
          role: null,
          userId: null,
          token: null,
        };
      }
      
      const { data } = await AuthService.checkSession(storedRole);

      return {
        isLoggedIn: data?.isLoggedIn || false,
        role: data?.role || storedRole,
        userId: data?.user?._id || data?.user?.id || getStoredUser() || null,
        token: storedToken,
      };
    } catch (err) {
      // On failure, clear auth state if token/role don't exist
      const storedToken = getStoredToken();
      const storedRole = getStoredRole();
      
      if (!storedToken || !storedRole) {
        return {
          isLoggedIn: false,
          role: null,
          userId: null,
          token: null,
        };
      }
      
      // On failure, keep existing auth state so a simple refresh/network hiccup
      // does not immediately log the user out.
      const message =
        err.response?.data?.message || "Unable to verify session right now.";
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  token: getStoredToken(),
  role: getStoredRole(),
  userId: getStoredUser(),
  isAuthenticated: !!getStoredToken() && !!getStoredRole(),
  status: "idle",
  error: null,
  message: "",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.message = "";
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.isAuthenticated = true;
        state.role = action.payload.role;
        state.token = action.payload.token;
        state.userId = action.payload.userId;
        state.message = action.payload.message;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.isAuthenticated = false;
        state.role = null;
        state.token = null;
        state.userId = null;
      })
      .addCase(logoutUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.status = "succeeded";
        state.isAuthenticated = false;
        state.role = null;
        state.token = null;
        state.userId = null;
        state.message = "";
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(checkSession.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(checkSession.fulfilled, (state, action) => {
        state.status = "succeeded";
      
        const { isLoggedIn, role, userId, token } = action.payload || {};
      
        // Rehydrate from localStorage if missing
        const storedToken = getStoredToken();
        const storedRole = getStoredRole();
        const storedUser = getStoredUser();
      
        // If backend says not logged in, clear everything
        if (isLoggedIn === false) {
          state.isAuthenticated = false;
          state.role = null;
          state.userId = null;
          state.token = null;
          // Clear localStorage
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          localStorage.removeItem("user_id");
        } else {
          state.role = role || storedRole || null;
          state.userId = userId || storedUser || null;
          state.token = token || storedToken || null;
          
          // ✅ Stay authenticated if token & role exist and backend confirmed session
          state.isAuthenticated =
            (!!state.token && !!state.role && isLoggedIn !== false);
        }
      })
      .addCase(checkSession.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      
        // ❗ Check if we have valid credentials in localStorage
        const token = getStoredToken();
        const role = getStoredRole();
        if (token && role) {
          // Only preserve if we have both token and role
          state.isAuthenticated = true;
          state.token = token;
          state.role = role;
          state.userId = getStoredUser();
        } else {
          // Clear everything if no valid credentials
          state.isAuthenticated = false;
          state.role = null;
          state.token = null;
          state.userId = null;
        }
      });
  },
});

export default authSlice.reducer;

