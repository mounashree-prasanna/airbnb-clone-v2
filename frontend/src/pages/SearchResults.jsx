import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import PropertyCard from "../components/PropertyCard";

export default function SearchResults() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const searchLocation = params.get("location") || "";
  const guests = params.get("guests") || "";
  const datesParam = params.get("dates") || "";
  
  const [startDate, endDate] = datesParam ? datesParam.split("|") : ["", ""];

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        if (!searchLocation) {
          setError("Please enter a location to search.");
          setLoading(false);
          return;
        }

        const requestParams = { location: searchLocation, guests };
        if (startDate && endDate) {
          requestParams.startDate = startDate;
          requestParams.endDate = endDate;
        }
        
        const res = await axios.get("http://localhost:5000/api/properties/search", {
          params: requestParams,
          withCredentials: true,
        });

        setProperties(res.data);
        setError("");
      } catch (err) {
        console.error("Search failed:", err);
        if (err.response?.status === 404) {
          setError("No properties found for this location.");
        } else {
          setError("Server error. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [searchLocation, guests, startDate, endDate]);

  return (
    <div>
      <Navbar />
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">
            {searchLocation
              ? `Search results for: ${searchLocation}`
              : "All Properties"}
          </h2>
          {startDate && endDate && (
            <p className="text-gray-600">
              Available for: {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
            </p>
          )}
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : error ? (
          <p className="text-gray-500 mt-4">{error}</p>
        ) : properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {properties.map((prop) => (
              <PropertyCard
                key={prop.id}
                id={prop.id}
                title={prop.title}
                location={prop.location}
                price={prop.price}
                photo_url={prop.photo_url}
              />
            ))}
          </div>
        ) : (
          <div className="text-gray-500 mt-4">
            <p>No available properties found for "{searchLocation}"
              {startDate && endDate && ` during ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`}.
            </p>
            <p className="mt-2 text-sm">
              This could be because the properties are either not available in this location
              {startDate && endDate && ' or are already booked for these dates'}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
