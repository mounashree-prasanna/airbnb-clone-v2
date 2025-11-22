import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_ENDPOINTS } from '../../utils/constants';
import axiosInstance from '../../utils/axiosInstance';

// Helper functions
const toNumber = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
};

const toArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeProperty = (property = {}) => {
  const rawId = property.id || property._id || property._id?._id;
  const bedroomsNumber = toNumber(property.bedrooms);
  const normalized = {
    ...property,
    id: rawId ? rawId.toString() : rawId,
    _id: rawId,
    ownerId: property.ownerId || property.owner_id,
    amenities: toArray(property.amenities),
    price: toNumber(property.price) ?? property.price,
    bedrooms: bedroomsNumber,
    bathrooms: toNumber(property.bathrooms) ?? property.bathrooms,
    available_from:
      property.available_from || property.availableFrom || property.availablefrom || "",
    available_to:
      property.available_to || property.availableTo || property.availableto || "",
    photo_url: property.photo_url || property.photoUrl || property.photoURL || "",
  };

  if (!normalized.guests && typeof bedroomsNumber === "number" && bedroomsNumber > 0) {
    normalized.guests = bedroomsNumber * 2;
  } else if (normalized.guests) {
    normalized.guests = toNumber(normalized.guests) ?? normalized.guests;
  }

  return normalized;
};

const normalizeList = (list) =>
  Array.isArray(list) ? list.map((item) => normalizeProperty(item)) : [];

const mapPropertyPayload = (payload = {}) => {
  const bedroomsNumber = toNumber(payload.bedrooms);
  
  // Helper to validate and format dates (preserves date without timezone conversion)
  const formatDate = (dateValue) => {
    if (!dateValue) return undefined;
    
    // If it's already a YYYY-MM-DD string, return it as-is
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue.trim())) {
      return dateValue.trim();
    }
    
    // If it's a Date object or other date string, extract YYYY-MM-DD
    try {
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
      if (isNaN(date.getTime())) return undefined;
      
      // Get local date components to avoid timezone shifts
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (err) {
      return undefined;
    }
  };
  
  const availableFrom = formatDate(payload.available_from || payload.availableFrom);
  const availableTo = formatDate(payload.available_to || payload.availableTo);
  
  const payloadCopy = {
    ...payload,
    price: toNumber(payload.price),
    bedrooms: bedroomsNumber,
    bathrooms: toNumber(payload.bathrooms),
    amenities: toArray(payload.amenities),
    guests:
      payload.guests !== undefined && payload.guests !== ""
        ? toNumber(payload.guests)
        : bedroomsNumber && bedroomsNumber > 0
        ? bedroomsNumber * 2
        : undefined,
    photoUrl: payload.photo_url || payload.photoUrl || "",
    availableFrom,
    availableTo,
  };

  delete payloadCopy.photo_url;
  delete payloadCopy.photoURL;
  delete payloadCopy.available_from;
  delete payloadCopy.available_to;

  Object.keys(payloadCopy).forEach((key) => {
    if (
      payloadCopy[key] === undefined ||
      payloadCopy[key] === null ||
      (typeof payloadCopy[key] === "string" && payloadCopy[key].trim() === "")
    ) {
      delete payloadCopy[key];
    }
  });

  return payloadCopy;
};

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

export const fetchOwnerProperties = createAsyncThunk(
  'property/fetchOwnerProperties',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(
        `${API_ENDPOINTS.PROPERTY.OWNER}/me`,
        { withCredentials: true }
      );
      return normalizeList(data);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Unable to load your properties.');
    }
  }
);

export const addOwnerProperty = createAsyncThunk(
  'property/addOwnerProperty',
  async (payload, { rejectWithValue }) => {
    try {
      const mappedPayload = mapPropertyPayload(payload);
      console.log('Sending property payload:', mappedPayload);
      const { data } = await axiosInstance.post(
        API_ENDPOINTS.PROPERTY.OWNER,
        mappedPayload,
        { withCredentials: true }
      );
      return {
        message: data?.message,
        property: data?.property ? normalizeProperty(data.property) : undefined,
      };
    } catch (error) {
      console.error('Add property error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to add property. Try again.';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateOwnerProperty = createAsyncThunk(
  'property/updateOwnerProperty',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const mappedUpdates = mapPropertyPayload(updates);
      const { data } = await axiosInstance.put(
        `${API_ENDPOINTS.PROPERTY.OWNER}/${id}`,
        mappedUpdates,
        { withCredentials: true }
      );
      return {
        message: data?.message,
        property: data?.property ? normalizeProperty(data.property) : undefined,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update property.');
    }
  }
);

export const deleteOwnerProperty = createAsyncThunk(
  'property/deleteOwnerProperty',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`${API_ENDPOINTS.PROPERTY.OWNER}/${id}`, {
        withCredentials: true,
      });
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete property.');
    }
  }
);

const initialState = {
  items: [],
  properties: [],
  searchResults: [],
  currentProperty: null,
  status: 'idle',
  loading: false,
  searchLoading: false,
  searchStatus: 'idle',
  detailLoading: false,
  error: null,
  searchError: null,
  detailError: null,
  lastSearchParams: null,
  ownerItems: [],
  ownerStatus: 'idle',
  ownerError: null,
  ownerMutationStatus: 'idle',
  ownerMutationError: null,
  ownerMutationMessage: '',
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
        state.status = 'succeeded';
        state.properties = action.payload || [];
        state.items = action.payload || [];
        state.error = null;
      })
      .addCase(fetchProperties.rejected, (state, action) => {
        state.loading = false;
        state.status = 'failed';
        state.error = action.payload;
        state.properties = [];
        state.items = [];
      })
      // Search Properties
      .addCase(searchProperties.pending, (state) => {
        state.searchLoading = true;
        state.searchError = null;
      })
      .addCase(searchProperties.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchStatus = 'succeeded';
        state.searchResults = action.payload || [];
        state.searchError = null;
      })
      .addCase(searchProperties.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchStatus = 'failed';
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
      })
      // Fetch Owner Properties
      .addCase(fetchOwnerProperties.pending, (state) => {
        state.ownerStatus = 'loading';
        state.ownerError = null;
      })
      .addCase(fetchOwnerProperties.fulfilled, (state, action) => {
        state.ownerStatus = 'succeeded';
        state.ownerItems = action.payload;
      })
      .addCase(fetchOwnerProperties.rejected, (state, action) => {
        state.ownerStatus = 'failed';
        state.ownerError = action.payload;
      })
      // Add Owner Property
      .addCase(addOwnerProperty.pending, (state) => {
        state.ownerMutationStatus = 'loading';
        state.ownerMutationError = null;
        state.ownerMutationMessage = '';
      })
      .addCase(addOwnerProperty.fulfilled, (state, action) => {
        state.ownerMutationStatus = 'succeeded';
        if (action.payload?.property) {
          state.ownerItems.unshift(action.payload.property);
        }
        state.ownerMutationMessage = action.payload?.message || 'Property created.';
      })
      .addCase(addOwnerProperty.rejected, (state, action) => {
        state.ownerMutationStatus = 'failed';
        state.ownerMutationError = action.payload;
      })
      // Update Owner Property
      .addCase(updateOwnerProperty.pending, (state) => {
        state.ownerMutationStatus = 'loading';
        state.ownerMutationError = null;
        state.ownerMutationMessage = '';
      })
      .addCase(updateOwnerProperty.fulfilled, (state, action) => {
        state.ownerMutationStatus = 'succeeded';
        const updated = action.payload?.property;
        if (updated) {
          state.ownerItems = state.ownerItems.map((item) =>
            item._id === updated._id || item.id === updated._id ? updated : item
          );
        }
        state.ownerMutationMessage = action.payload?.message || 'Property updated.';
      })
      .addCase(updateOwnerProperty.rejected, (state, action) => {
        state.ownerMutationStatus = 'failed';
        state.ownerMutationError = action.payload;
      })
      // Delete Owner Property
      .addCase(deleteOwnerProperty.pending, (state) => {
        state.ownerMutationStatus = 'loading';
        state.ownerMutationError = null;
        state.ownerMutationMessage = '';
      })
      .addCase(deleteOwnerProperty.fulfilled, (state, action) => {
        state.ownerMutationStatus = 'succeeded';
        state.ownerItems = state.ownerItems.filter(
          (item) => item._id !== action.payload && item.id !== action.payload
        );
        state.ownerMutationMessage = 'Property removed.';
      })
      .addCase(deleteOwnerProperty.rejected, (state, action) => {
        state.ownerMutationStatus = 'failed';
        state.ownerMutationError = action.payload;
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

