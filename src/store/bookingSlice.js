import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../utils/axiosInstance";
import { API_ENDPOINTS } from "../utils/constants";

export const fetchTravelerBookings = createAsyncThunk(
  "bookings/fetchTravelerBookings",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(API_ENDPOINTS.BOOKING.TRAVELER, {
        withCredentials: true,
      });
      return data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Could not load your booking history. Try again later.";
      return rejectWithValue(message);
    }
  }
);

export const createBooking = createAsyncThunk(
  "bookings/createBooking",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(
        API_ENDPOINTS.BOOKING.BASE,
        payload,
        { withCredentials: true }
      );
      return data;
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Booking failed. Please try again.";
      return rejectWithValue(message);
    }
  }
);

export const cancelBooking = createAsyncThunk(
  "bookings/cancelBooking",
  async (bookingId, { rejectWithValue }) => {
    try {
      await axiosInstance.put(
        `${API_ENDPOINTS.BOOKING.BASE}/${bookingId}/status`,
        { status: "CANCELLED" },
        { withCredentials: true }
      );
      return bookingId;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Failed to cancel booking. Please try again.";
      return rejectWithValue(message);
    }
  }
);

export const fetchOwnerBookings = createAsyncThunk(
  "bookings/fetchOwnerBookings",
  async (_, { rejectWithValue, getState }) => {
    try {
      const ownerId =
        getState().auth.userId || localStorage.getItem("user_id");
      if (!ownerId) {
        return rejectWithValue("Missing owner id. Please login again.");
      }
      const { data } = await axiosInstance.get(
        `${API_ENDPOINTS.BOOKING.OWNER}/${ownerId}`,
        { withCredentials: true }
      );
      return data;
    } catch (err) {
      const message =
        err.response?.data?.message || "Could not load incoming bookings.";
      return rejectWithValue(message);
    }
  }
);

export const updateOwnerBookingStatus = createAsyncThunk(
  "bookings/updateOwnerBookingStatus",
  async ({ bookingId, status }, { rejectWithValue }) => {
    try {
      await axiosInstance.put(
        `${API_ENDPOINTS.BOOKING.BASE}/${bookingId}/status`,
        { status },
        { withCredentials: true }
      );
      return { bookingId, status };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        `Failed to ${status === "ACCEPTED" ? "accept" : "cancel"} booking.`;
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  items: [],
  status: "idle",
  error: null,
  actionStatus: "idle",
  actionError: null,
  cancellingId: null,
  lastActionMessage: "",
  ownerItems: [],
  ownerStatus: "idle",
  ownerError: null,
};

const bookingSlice = createSlice({
  name: "bookings",
  initialState,
  reducers: {
    resetBookingMessage(state) {
      state.lastActionMessage = "";
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTravelerBookings.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchTravelerBookings.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload || [];
      })
      .addCase(fetchTravelerBookings.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createBooking.pending, (state) => {
        state.actionStatus = "loading";
        state.actionError = null;
        state.lastActionMessage = "";
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        if (action.payload?.booking) {
          state.items.push(action.payload.booking);
        }
        state.lastActionMessage =
          action.payload?.message || "Booking created successfully.";
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError = action.payload;
      })
      .addCase(cancelBooking.pending, (state, action) => {
        state.cancellingId = action.meta.arg;
        state.actionError = null;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.cancellingId = null;
        state.items = state.items.map((booking) =>
          booking._id === action.payload
            ? { ...booking, status: "CANCELLED" }
            : booking
        );
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.cancellingId = null;
        state.actionError = action.payload;
      })
      .addCase(fetchOwnerBookings.pending, (state) => {
        state.ownerStatus = "loading";
        state.ownerError = null;
      })
      .addCase(fetchOwnerBookings.fulfilled, (state, action) => {
        state.ownerStatus = "succeeded";
        state.ownerItems = action.payload || [];
      })
      .addCase(fetchOwnerBookings.rejected, (state, action) => {
        state.ownerStatus = "failed";
        state.ownerError = action.payload;
      })
      .addCase(updateOwnerBookingStatus.fulfilled, (state, action) => {
        const { bookingId, status } = action.payload;
        state.ownerItems = state.ownerItems.map((booking) =>
          booking._id === bookingId || booking.booking_id === bookingId
            ? { ...booking, status }
            : booking
        );
      })
      .addCase(updateOwnerBookingStatus.rejected, (state, action) => {
        state.ownerError = action.payload;
      });
  },
});

export const { resetBookingMessage } = bookingSlice.actions;
export default bookingSlice.reducer;

