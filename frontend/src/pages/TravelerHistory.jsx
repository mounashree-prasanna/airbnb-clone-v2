import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "../components/Navbar";
import {
  fetchTravelerBookings,
  cancelBooking,
} from "../store/bookingSlice";
import axios from "axios";
import { API_ENDPOINTS } from "../utils/constants";

const TravelerHistory = () => {
  const dispatch = useDispatch();
  const { items: bookings, status, error, cancellingId } = useSelector(
    (state) => state.bookings
  );
  const [displayBookings, setDisplayBookings] = useState([]);

  const handleCancel = async (bookingId) => {
    dispatch(cancelBooking(bookingId));
  };

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchTravelerBookings());
    }
  }, [dispatch, status]);

  useEffect(() => {
    setDisplayBookings(bookings);
  }, [bookings]);

  useEffect(() => {
    const missingDetails = bookings.filter(
      (booking) =>
        booking.propertyId &&
        (!booking.title || !booking.photo_url || !booking.location)
    );
    if (missingDetails.length === 0) return;

    let ignore = false;

    const enrichBookings = async () => {
      try {
        const updates = await Promise.all(
          missingDetails.map(async (booking) => {
            try {
              const { data } = await axios.get(
                `${API_ENDPOINTS.PROPERTY.BASE}/${booking.propertyId}`,
                { withCredentials: true }
              );
              return {
                propertyId: booking.propertyId,
                title: data.title,
                location: data.location,
                photo_url: data.photo_url,
              };
            } catch (err) {
              console.warn(
                "Failed to fetch property details for booking",
                booking.propertyId,
                err.message
              );
              return null;
            }
          })
        );

        if (ignore) return;

        setDisplayBookings((prev) =>
          prev.map((booking) => {
            const enrichment = updates.find(
              (update) =>
                update &&
                update.propertyId &&
                update.propertyId === booking.propertyId
            );
            return enrichment ? { ...booking, ...enrichment } : booking;
          })
        );
      } catch (err) {
        console.warn("Failed to enrich bookings:", err);
      }
    };

    enrichBookings();
    return () => {
      ignore = true;
    };
  }, [bookings]);

  return (
    <div>
      <Navbar />
      <div className="p-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">My Bookings</h2>

        {status === "loading" ? (
          <p className="text-gray-500">Loading your bookings...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : displayBookings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {displayBookings.map((booking) => (
              <div
                key={booking._id}
                className="border rounded-lg shadow hover:shadow-lg transition duration-200 bg-white"
              >
                <img
                  src={
                    booking.photo_url ||
                    "https://images.unsplash.com/photo-1505691723518-36a5ac3be353?w=800"
                  }
                  alt={booking.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="p-4 space-y-1">
                  <h3 className="font-semibold text-lg">
                    {booking.title || "Property"}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {booking.city || booking.location || ""}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {booking.startDate ? new Date(booking.startDate).toLocaleDateString() : booking.start_date} → {booking.endDate ? new Date(booking.endDate).toLocaleDateString() : booking.end_date}
                  </p>
                  <p className="text-gray-700 text-sm">
                    Guests: {booking.guests}
                  </p>

                    <p className="text-sm mb-2">
                    Status:{" "}
                    <span
                      className={`font-semibold ${
                        booking.status === "ACCEPTED"
                          ? "text-green-600"
                          : booking.status === "CANCELLED"
                          ? "text-red-600"
                          : "text-yellow-500"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </p>
                  
                    {booking.status !== "CANCELLED" && booking.status !== "ACCEPTED" && (
                      <button
                        onClick={() => handleCancel(booking._id)}
                        disabled={cancellingId === booking._id}
                        className="w-full mt-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white py-2 px-4 rounded-md text-sm transition-colors duration-200"
                      >
                        {cancellingId === booking._id ? "Cancelling..." : "Cancel Booking"}
                      </button>
                    )}
                </div>
              </div>

            ))}
          </div>
        ) : (
          <p className="text-gray-500 mt-6">
            You haven’t booked any trips yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default TravelerHistory;
