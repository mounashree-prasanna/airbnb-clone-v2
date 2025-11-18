import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { searchProperties } from "../store/slices/propertySlice";
import Navbar from "../components/Navbar";
import PropertyCard from "../components/PropertyCard";

export default function SearchResults() {
  const dispatch = useAppDispatch();
  const { searchResults, searchLoading, searchError } = useAppSelector((state) => state.property);

  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const searchLocation = params.get("location") || "";
  const guests = params.get("guests") || "";
  const datesParam = params.get("dates") || "";
  
  const [startDate, endDate] = datesParam ? datesParam.split("|") : ["", ""];

  useEffect(() => {
    if (!searchLocation) {
      return;
    }

    const requestParams = { location: searchLocation, guests };
    if (startDate && endDate) {
      requestParams.startDate = startDate;
      requestParams.endDate = endDate;
    }
    
    dispatch(searchProperties(requestParams));
  }, [dispatch, searchLocation, guests, startDate, endDate]);

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

        {!searchLocation ? (
          <p className="text-gray-500 mt-4">Please enter a location to search.</p>
        ) : searchLoading ? (
          <p className="text-gray-500">Loading...</p>
        ) : searchError ? (
          <p className="text-gray-500 mt-4">{searchError}</p>
        ) : searchResults.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {searchResults.map((prop) => (
              <PropertyCard
                key={prop.id || prop._id}
                id={prop.id || prop._id}
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
