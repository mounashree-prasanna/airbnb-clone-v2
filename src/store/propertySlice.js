import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import axiosInstance from "../utils/axiosInstance";
import { API_ENDPOINTS } from "../utils/constants";

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
    availableFrom: payload.available_from || payload.availableFrom || "",
    availableTo: payload.available_to || payload.availableTo || "",
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

export const fetchProperties = createAsyncThunk(
  "properties/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(API_ENDPOINTS.PROPERTY.BASE, {
        withCredentials: true,
      });
      return normalizeList(data);
    } catch (err) {
      const message =
        err.response?.data?.message || "Unable to load properties.";
      return rejectWithValue(message);
    }
  }
);

export const searchProperties = createAsyncThunk(
  "properties/search",
  async (params = {}, { rejectWithValue }) => {
    try {
      const endpoint = params.location
        ? API_ENDPOINTS.PROPERTY.SEARCH
        : API_ENDPOINTS.PROPERTY.BASE;

      const requestConfig = {
        withCredentials: true,
      };

      if (params.location) {
        requestConfig.params = params;
      }

      const { data } = await axios.get(endpoint, requestConfig);
      return { data: normalizeList(data), params };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.response?.status === 404
          ? "No properties found for this search."
          : "Search failed. Please try again.");
      return rejectWithValue(message);
    }
  }
);

export const fetchOwnerProperties = createAsyncThunk(
  "properties/fetchOwnerProperties",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(
        `${API_ENDPOINTS.PROPERTY.OWNER}/me`,
        { withCredentials: true }
      );
      return normalizeList(data);
    } catch (err) {
      const message =
        err.response?.data?.message || "Unable to load your properties.";
      return rejectWithValue(message);
    }
  }
);

export const addOwnerProperty = createAsyncThunk(
  "properties/addOwnerProperty",
  async (payload, { rejectWithValue }) => {
    try {
      const mappedPayload = mapPropertyPayload(payload);
      const { data } = await axiosInstance.post(
        API_ENDPOINTS.PROPERTY.OWNER,
        mappedPayload,
        { withCredentials: true }
      );
      return {
        message: data?.message,
        property: data?.property ? normalizeProperty(data.property) : undefined,
      };
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to add property. Try again.";
      return rejectWithValue(message);
    }
  }
);

export const updateOwnerProperty = createAsyncThunk(
  "properties/updateOwnerProperty",
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
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to update property.";
      return rejectWithValue(message);
    }
  }
);

export const deleteOwnerProperty = createAsyncThunk(
  "properties/deleteOwnerProperty",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`${API_ENDPOINTS.PROPERTY.OWNER}/${id}`, {
        withCredentials: true,
      });
      return id;
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to delete property.";
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  items: [],
  status: "idle",
  error: null,
  searchResults: [],
  searchStatus: "idle",
  searchError: null,
  lastSearchParams: null,
  ownerItems: [],
  ownerStatus: "idle",
  ownerError: null,
  ownerMutationStatus: "idle",
  ownerMutationError: null,
  ownerMutationMessage: "",
};

const propertySlice = createSlice({
  name: "properties",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProperties.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchProperties.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchProperties.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(searchProperties.pending, (state) => {
        state.searchStatus = "loading";
        state.searchError = null;
      })
      .addCase(searchProperties.fulfilled, (state, action) => {
        state.searchStatus = "succeeded";
        state.searchResults = action.payload.data;
        state.lastSearchParams = action.payload.params;
      })
      .addCase(searchProperties.rejected, (state, action) => {
        state.searchStatus = "failed";
        state.searchError = action.payload;
        state.searchResults = [];
      })
      .addCase(fetchOwnerProperties.pending, (state) => {
        state.ownerStatus = "loading";
        state.ownerError = null;
      })
      .addCase(fetchOwnerProperties.fulfilled, (state, action) => {
        state.ownerStatus = "succeeded";
        state.ownerItems = action.payload;
      })
      .addCase(fetchOwnerProperties.rejected, (state, action) => {
        state.ownerStatus = "failed";
        state.ownerError = action.payload;
      })
      .addCase(addOwnerProperty.pending, (state) => {
        state.ownerMutationStatus = "loading";
        state.ownerMutationError = null;
        state.ownerMutationMessage = "";
      })
      .addCase(addOwnerProperty.fulfilled, (state, action) => {
        state.ownerMutationStatus = "succeeded";
        if (action.payload?.property) {
          state.ownerItems.unshift(action.payload.property);
        }
        state.ownerMutationMessage =
          action.payload?.message || "Property created.";
      })
      .addCase(addOwnerProperty.rejected, (state, action) => {
        state.ownerMutationStatus = "failed";
        state.ownerMutationError = action.payload;
      })
      .addCase(updateOwnerProperty.pending, (state) => {
        state.ownerMutationStatus = "loading";
        state.ownerMutationError = null;
        state.ownerMutationMessage = "";
      })
      .addCase(updateOwnerProperty.fulfilled, (state, action) => {
        state.ownerMutationStatus = "succeeded";
        const updated = action.payload?.property;
        if (updated) {
          state.ownerItems = state.ownerItems.map((item) =>
            item._id === updated._id || item.id === updated._id ? updated : item
          );
        }
        state.ownerMutationMessage =
          action.payload?.message || "Property updated.";
      })
      .addCase(updateOwnerProperty.rejected, (state, action) => {
        state.ownerMutationStatus = "failed";
        state.ownerMutationError = action.payload;
      })
      .addCase(deleteOwnerProperty.pending, (state) => {
        state.ownerMutationStatus = "loading";
        state.ownerMutationError = null;
        state.ownerMutationMessage = "";
      })
      .addCase(deleteOwnerProperty.fulfilled, (state, action) => {
        state.ownerMutationStatus = "succeeded";
        state.ownerItems = state.ownerItems.filter(
          (item) => item._id !== action.payload && item.id !== action.payload
        );
        state.ownerMutationMessage = "Property removed.";
      })
      .addCase(deleteOwnerProperty.rejected, (state, action) => {
        state.ownerMutationStatus = "failed";
        state.ownerMutationError = action.payload;
      });
  },
});

export default propertySlice.reducer;

