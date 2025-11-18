import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_ENDPOINTS } from '../../utils/constants';

// Async thunks for property operations
export const fetchProperties = createAsyncThunk(
  'property/fetchProperties',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(API_ENDPOINTS.PROPERTY.BASE);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch properties');
    }
  }
);

export const searchProperties = createAsyncThunk(
  'property/searchProperties',
  async (searchParams, { rejectWithValue }) => {
    try {
      const res = await axios.get(API_ENDPOINTS.PROPERTY.SEARCH, {
        params: searchParams,
        withCredentials: true,
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Search failed');
    }
  }
);

export const fetchPropertyDetail = createAsyncThunk(
  'property/fetchPropertyDetail',
  async (propertyId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_ENDPOINTS.PROPERTY.BASE}/${propertyId}`, {
        withCredentials: true,
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch property details');
    }
  }
);

const initialState = {
  properties: [],
  searchResults: [],
  currentProperty: null,
  loading: false,
  searchLoading: false,
  detailLoading: false,
  error: null,
  searchError: null,
  detailError: null,
};

const propertySlice = createSlice({
  name: 'property',
  initialState,
  reducers: {
    clearProperties: (state) => {
      state.properties = [];
      state.error = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchError = null;
    },
    clearPropertyDetail: (state) => {
      state.currentProperty = null;
      state.detailError = null;
    },
    clearErrors: (state) => {
      state.error = null;
      state.searchError = null;
      state.detailError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Properties
      .addCase(fetchProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProperties.fulfilled, (state, action) => {
        state.loading = false;
        state.properties = action.payload || [];
        state.error = null;
      })
      .addCase(fetchProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.properties = [];
      })
      // Search Properties
      .addCase(searchProperties.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchProperties.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload || [];
        state.searchError = null;
      })
      .addCase(searchProperties.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload;
        state.searchResults = [];
      })
      // Fetch Property Detail
      .addCase(fetchPropertyDetail.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchPropertyDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.currentProperty = action.payload;
        state.detailError = null;
      })
      .addCase(fetchPropertyDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload;
        state.currentProperty = null;
      });
  },
});

export const {
  clearProperties,
  clearSearchResults,
  clearPropertyDetail,
  clearErrors,
} = propertySlice.actions;
export default propertySlice.reducer;

