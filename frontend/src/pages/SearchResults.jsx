import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import PropertyCard from "../components/PropertyCard";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchProperties, searchProperties } from "../store/slices/propertySlice";

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const matchesDateRange = (property, startDate, endDate) => {
  if (!startDate && !endDate) return true;

  const availableFrom =
    property.available_from ||
    property.availableFrom ||
    property.next_available_date ||
    property.availableFromDate;

  const availableTo = property.available_to || property.availableTo;

  const availableStart = parseDate(availableFrom);
  const availableEnd = parseDate(availableTo);

  if (startDate && availableStart && startDate < availableStart) return false;
  if (endDate && availableEnd && endDate > availableEnd) return false;

  return true;
};

const meetsGuestRequirement = (property, guests) => {
  if (!guests) return true;
  const guestCapacity =
    property.guests ||
    property.maxGuests ||
    (property.bedrooms ? property.bedrooms * 2 : null);
  if (!guestCapacity) return false;
  return guestCapacity >= Number(guests);
};

export default function SearchResults() {
  const dispatch = useAppDispatch();
  const propertyState = useAppSelector((state) => state.properties) || {};
  const {
    items = [],
    status = 'idle',
    error,
    searchResults = [],
    searchStatus = 'idle',
    searchError,
  } = propertyState;

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const searchLocation = params.get("location") || "";
  const guests = params.get("guests") || "";
  const startDateParam = params.get("startDate") || "";
  const endDateParam = params.get("endDate") || "";

  useEffect(() => {
    if (searchLocation) {
      dispatch(
        searchProperties({
          location: searchLocation,
        })
      );
    } else if (status === "idle") {
      dispatch(fetchProperties());
    }
  }, [dispatch, searchLocation, status]);

  const baseList = searchLocation ? searchResults : items;
  const loading = searchLocation
    ? searchStatus === "loading"
    : status === "loading";
  const effectiveError = searchLocation ? searchError : error;

  const startDateObj = parseDate(startDateParam);
  const endDateObj = parseDate(endDateParam);

  const filteredProperties = useMemo(() => {
    const list = baseList || [];
    return list.filter(
      (property) =>
        matchesDateRange(property, startDateObj, endDateObj) &&
        meetsGuestRequirement(property, guests)
    );
  }, [baseList, startDateObj, endDateObj, guests]);

  const hasDateRange = startDateObj && endDateObj;

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
          {hasDateRange && (
            <p className="text-gray-600">
              Available for: {startDateObj.toLocaleDateString()} -{" "}
              {endDateObj.toLocaleDateString()}
            </p>
          )}
        </div>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : effectiveError ? (
          <p className="text-gray-500 mt-4">{effectiveError}</p>
        ) : filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredProperties.map((prop) => (
              <PropertyCard
                key={prop._id || prop.id}
                id={prop._id || prop.id}
                title={prop.title}
                location={prop.location}
                price={prop.price}
                photo_url={prop.photo_url}
              />
            ))}
          </div>
        ) : (
          <div className="text-gray-500 mt-4">
            <p>
              No available properties found
              {searchLocation && ` for "${searchLocation}"`}
              {hasDateRange &&
                ` during ${startDateObj.toLocaleDateString()} - ${endDateObj.toLocaleDateString()}`}
              .
            </p>
            <p className="mt-2 text-sm">
              This could be because the properties are either not available in
              this location
              {hasDateRange && " or are already booked for these dates"}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
