import { useState, useEffect } from "react";
import axios from "axios";

export default function BookingModal({ propertyId, nextAvailableDate, onClose, price }) {
  const [formData, setFormData] = useState({
    start_date: "",
    end_date: "",
    guests: 1,
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [minDate, setMinDate] = useState("");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const minDateValue = nextAvailableDate || (() => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    })();
    setMinDate(minDateValue);
  }, [nextAvailableDate]);

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
    
    if (name === 'start_date' && formData.end_date && value >= formData.end_date) {
      newFormData[name] = value;
      newFormData.end_date = "";
    } else {
      newFormData[name] = value;
    }
    
    setFormData(newFormData);
    setTotal(calculateTotal(newFormData));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const traveler_id = localStorage.getItem("traveler_id"); 

      console.log({
        traveler_id,
        property_id: propertyId,
        start_date: formData.start_date,
        end_date: formData.end_date,
        guests: formData.guests,
      });

      const res = await axios.post(
        "http://localhost:5000/api/bookings",
        {
          traveler_id,
          property_id: propertyId,
          start_date: formData.start_date,
          end_date: formData.end_date,
          guests: formData.guests,
        },
        { withCredentials: true }
      );

      setMessage(` ${res.data.message}`);
    } catch (err) {
      console.error("Booking failed:", err);
      setMessage(
        err.response?.data?.error || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-center">Book This Property</h2>

        {message && (
          <p className="text-center text-sm mb-3 text-green-600 font-medium">
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
              value={formData.guests}
              onChange={handleChange}
              className="w-full border rounded-md p-2"
              required
            />
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
            disabled={loading}
            className="w-full bg-rose-500 text-white py-2 rounded-md hover:bg-rose-600 transition disabled:bg-gray-400"
          >
            {loading ? "Booking..." : "Confirm Booking"}
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
