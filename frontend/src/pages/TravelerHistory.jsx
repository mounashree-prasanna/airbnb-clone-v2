import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

const TravelerHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  const handleCancel = async (bookingId) => {
    try {
      setCancellingId(bookingId);
      await axios.put(
        `http://localhost:5000/api/bookings/${bookingId}/cancel`,
        {},
        { withCredentials: true }
      );
      
      setBookings(bookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'CANCELLED' }
          : booking
      ));
      
    } catch (err) {
      console.error("Error cancelling booking:", err);
      setError("Failed to cancel booking. Please try again.");
    } finally {
      setCancellingId(null);
    }
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/bookings/traveler`,
          { withCredentials: true }
        );

        setBookings(res.data);
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setError("Could not load your booking history.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  return (
    <div>
      <Navbar />
      <div className="p-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">My Bookings</h2>

        {loading ? (
          <p className="text-gray-500">Loading your bookings...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : bookings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {bookings.map((booking) => (
              <div
                key={booking.id}
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
                    {booking.start_date} → {booking.end_date}
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
                        onClick={() => handleCancel(booking.id)}
                        disabled={cancellingId === booking.id}
                        className="w-full mt-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white py-2 px-4 rounded-md text-sm transition-colors duration-200"
                      >
                        {cancellingId === booking.id ? "Cancelling..." : "Cancel Booking"}
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
