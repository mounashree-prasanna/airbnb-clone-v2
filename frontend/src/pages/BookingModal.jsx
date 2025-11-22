import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { createBooking, clearBookingMessage } from "../store/slices/bookingSlice";


export default function BookingModal({
  propertyId,
  ownerId,
  nextAvailableDate,
  onClose,
  price,
  maxGuests,
}) {
  const [formData, setFormData] = useState({
    start_date: "",
    end_date: "",
    guests: 1,
  });
  const [minDate, setMinDate] = useState("");
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState("");
  const dispatch = useAppDispatch();
  const { creating, bookingMessage } = useAppSelector((state) => state.bookings || {});

  useEffect(() => {
    const minDateValue = nextAvailableDate || (() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    })();
    setMinDate(minDateValue);
  }, [nextAvailableDate]);

  useEffect(() => {
    if (maxGuests && formData.guests > maxGuests) {
      const adjusted = { ...formData, guests: maxGuests };
      setFormData(adjusted);
      setTotal(calculateTotal(adjusted));
    }
  }, [maxGuests, formData]);

  const calculateTotal = (data) => {
    const { start_date, end_date, guests } = data;
    if (!start_date || !end_date || !guests || !price) return 0;

    const start = new Date(start_date);
    const end = new Date(end_date);
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return price * guests * nights;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData };
    const parsedValue =
      name === "guests" ? Math.max(1, Number(value)) : value;

    if (
      name === "start_date" &&
      formData.end_date &&
      parsedValue >= formData.end_date
    ) {
      newFormData[name] = parsedValue;
      newFormData.end_date = "";
    } else {
      newFormData[name] = parsedValue;
    }

    if (name === "guests" && maxGuests) {
      newFormData.guests = Math.min(parsedValue, maxGuests);
    }
    
    setFormData(newFormData);
    setTotal(calculateTotal(newFormData));
  };

  useEffect(() => {
    // Clear message when component mounts
    dispatch(clearBookingMessage());
  }, [dispatch]);

  useEffect(() => {
    if (bookingMessage) {
      setMessage(bookingMessage);
    }
  }, [bookingMessage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const result = await dispatch(
        createBooking({
          propertyId,
          ownerId,
          startDate: formData.start_date,
          endDate: formData.end_date,
          guests: formData.guests,
        })
      ).unwrap();

      setMessage(result?.message || "Booking created successfully!");
      // Close modal after successful booking
      setTimeout(() => {
        onClose();
        window.location.reload(); // Refresh to show new booking
      }, 1500);
    } catch (errMessage) {
      setMessage(errMessage || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-center">Book This Property</h2>

        {message && (
          <p className={`text-center text-sm mb-3 font-medium ${
            message.includes("successfully") || message.includes("created") 
              ? "text-green-600" 
              : "text-red-600"
          }`}>
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              min={minDate}
              className="w-full border rounded-md p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              min={formData.start_date || minDate}
              className="w-full border rounded-md p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Guests
            </label>
            <input
              type="number"
              name="guests"
              min="1"
              max={maxGuests || undefined}
              value={formData.guests}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
              required
            />
            {maxGuests && (
              <p className="text-xs text-gray-500 mt-1">
                Max guests for this property: {maxGuests}
              </p>
            )}
          </div>

          {total > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Base price per guest:</span>
                <span className="font-semibold">${price}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-600">Total guests:</span>
                <span className="font-semibold">{formData.guests}</span>
              </div>
              {formData.start_date && formData.end_date && (
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-600">Number of nights:</span>
                  <span className="font-semibold">
                    {Math.ceil((new Date(formData.end_date) - new Date(formData.start_date)) / (1000 * 60 * 60 * 24))}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center mt-2 text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>${total}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={creating}
            className="w-full bg-rose-500 text-white py-2 rounded-md hover:bg-rose-600 transition disabled:bg-gray-400"
          >
            {creating ? "Booking..." : "Confirm Booking"}
          </button>
        </form>

        <button
          onClick={onClose}
          className="w-full mt-3 text-gray-500 text-sm underline hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
