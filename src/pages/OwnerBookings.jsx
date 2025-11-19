import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "../components/Navbar";
import {
  fetchOwnerBookings,
  updateOwnerBookingStatus,
} from "../store/bookingSlice";

export default function OwnerBookings() {
  const dispatch = useDispatch();
  const { ownerItems, ownerStatus, ownerError } = useSelector(
    (state) => state.bookings
  );

  useEffect(() => {
    if (ownerStatus === "idle") {
      dispatch(fetchOwnerBookings());
    }
  }, [dispatch, ownerStatus]);

  const handleAction = (id, status) => {
    dispatch(updateOwnerBookingStatus({ bookingId: id, status }));
  };

  if (ownerStatus === "loading") {
    return (
      <div>
        <Navbar />
        <p className="text-center text-gray-500 mt-10">Loading bookings...</p>
      </div>
    );
  }

  if (ownerError) {
    return (
      <div>
        <Navbar />
        <p className="text-center text-red-600 mt-10">{ownerError}</p>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="p-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Incoming Booking Requests</h2>
        {ownerItems.length === 0 ? (
          <p className="text-gray-500">No bookings yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ownerItems.map((b) => (
              <div
                key={b.booking_id || b._id}
                className="border rounded-lg bg-white shadow p-4 space-y-2"
              >
                <img
                  src={b.photo_url || "https://picsum.photos/400/250"}
                  alt={b.property_title}
                  className="w-full h-40 object-cover rounded"
                />
                <h3 className="font-semibold text-lg">{b.property_title}</h3>
                <p className="text-gray-500 text-sm">{b.location}</p>
                <p className="text-sm text-gray-700">
                  <strong>Dates:</strong> {b.start_date} → {b.end_date}
                </p>
                <p className="text-sm">
                  <strong>Status:</strong>{" "}
                  <span
                    className={
                      b.status === "ACCEPTED"
                        ? "text-emerald-600"
                        : b.status === "CANCELLED"
                        ? "text-rose-600"
                        : "text-amber-600"
                    }
                  >
                    {b.status}
                  </span>
                </p>

                {b.status === "PENDING" && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() =>
                        handleAction(b.booking_id || b._id, "ACCEPTED")
                      }
                      className="flex-1 bg-emerald-600 text-white py-1 rounded hover:bg-emerald-700"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() =>
                        handleAction(b.booking_id || b._id, "CANCELLED")
                      }
                      className="flex-1 bg-rose-600 text-white py-1 rounded hover:bg-rose-700"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
