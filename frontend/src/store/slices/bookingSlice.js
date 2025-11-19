import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_ENDPOINTS } from '../../utils/constants';
import axiosInstance from '../../utils/axiosInstance';

// Async thunks for booking operations
export const fetchTravelerBookings = createAsyncThunk(
  'booking/fetchTravelerBookings',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(API_ENDPOINTS.BOOKING.TRAVELER, {
        withCredentials: true,
      });
      return res.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bookings');
    }
  }
);

export const createBooking = createAsyncThunk(
  'booking/createBooking',
  async (bookingData, { rejectWithValue }) => {
    try {
      const res = await axios.post(API_ENDPOINTS.BOOKING.BASE, bookingData, {
        withCredentials: true,
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create booking');
    }
  }
);

export const cancelBooking = createAsyncThunk(
  'booking/cancelBooking',
  async (bookingId, { rejectWithValue }) => {
    try {
      await axios.put(
        `${API_ENDPOINTS.BOOKING.BASE}/${bookingId}/cancel`,
        {},
        { withCredentials: true }
      );
      return bookingId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to cancel booking');
    }
  }
);

export const fetchFavourites = createAsyncThunk(
  'booking/fetchFavourites',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        API_ENDPOINTS.TRAVELER.FAVOURITES + '/my-favourites'
      );
      return res.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch favourites');
    }
  }
);

export const addToFavourites = createAsyncThunk(
  'booking/addToFavourites',
  async (propertyId, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(API_ENDPOINTS.TRAVELER.FAVOURITES, {
        property_id: propertyId,
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add to favourites');
    }
  }
);

export const removeFromFavourites = createAsyncThunk(
  'booking/removeFromFavourites',
  async (propertyId, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`${API_ENDPOINTS.TRAVELER.FAVOURITES}/${propertyId}`);
      return propertyId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove from favourites');
    }
  }
);

const initialState = {
  bookings: [],
  favourites: [],
  loading: false,
  favouritesLoading: false,
  creating: false,
  cancelling: null,
  error: null,
  favouritesError: null,
  bookingMessage: null,
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    clearBookingError: (state) => {
      state.error = null;
    },
    clearBookingMessage: (state) => {
      state.bookingMessage = null;
    },
    clearFavouritesError: (state) => {
      state.favouritesError = null;
    },
    clearAllErrors: (state) => {
      state.error = null;
      state.favouritesError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Traveler Bookings
      .addCase(fetchTravelerBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTravelerBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload;
        state.error = null;
      })
      .addCase(fetchTravelerBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.bookings = [];
      })
      // Create Booking
      .addCase(createBooking.pending, (state) => {
        state.creating = true;
        state.error = null;
        state.bookingMessage = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.creating = false;
        state.bookingMessage = action.payload.message || 'Booking created successfully';
        // Optionally refresh bookings list
        state.error = null;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
        state.bookingMessage = null;
      })
      // Cancel Booking
      .addCase(cancelBooking.pending, (state, action) => {
        state.cancelling = action.meta.arg;
        state.error = null;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.cancelling = null;
        state.bookings = state.bookings.map((booking) =>
          booking.id === action.payload
            ? { ...booking, status: 'CANCELLED' }
            : booking
        );
        state.error = null;
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.cancelling = null;
        state.error = action.payload;
      })
      // Fetch Favourites
      .addCase(fetchFavourites.pending, (state) => {
        state.favouritesLoading = true;
        state.favouritesError = null;
      })
      .addCase(fetchFavourites.fulfilled, (state, action) => {
        state.favouritesLoading = false;
        state.favourites = action.payload;
        state.favouritesError = null;
      })
      .addCase(fetchFavourites.rejected, (state, action) => {
        state.favouritesLoading = false;
        state.favouritesError = action.payload;
        state.favourites = [];
      })
      // Add to Favourites
      .addCase(addToFavourites.fulfilled, (state, action) => {
        // Optionally refresh favourites list
        state.favouritesError = null;
      })
      .addCase(addToFavourites.rejected, (state, action) => {
        state.favouritesError = action.payload;
      })
      // Remove from Favourites
      .addCase(removeFromFavourites.fulfilled, (state, action) => {
        state.favourites = state.favourites.filter(
          (fav) => (fav.id || fav._id) !== action.payload
        );
        state.favouritesError = null;
      })
      .addCase(removeFromFavourites.rejected, (state, action) => {
        state.favouritesError = action.payload;
      });
  },
});

export const {
  clearBookingError,
  clearBookingMessage,
  clearFavouritesError,
  clearAllErrors,
} = bookingSlice.actions;
export default bookingSlice.reducer;

