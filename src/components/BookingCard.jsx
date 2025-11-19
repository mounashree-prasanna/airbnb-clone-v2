export default function BookingCard({ booking }) {
    return (
      <div className="border rounded-lg p-4 shadow-sm bg-white">
        <h3 className="text-lg font-semibold mb-1">{booking.title}</h3>
        <p className="text-gray-600 text-sm mb-2">
          {booking.start_date} → {booking.end_date}
        </p>
        <p className="text-gray-600 text-sm mb-1">Guests: {booking.guests}</p>
        <p className="text-sm">
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
      </div>
    );
  }
  