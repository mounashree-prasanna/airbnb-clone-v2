import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import PropertyCard from "../components/PropertyCard";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchProperties } from "../store/slices/propertySlice";
import { fetchTravelerBookings } from "../store/slices/bookingSlice";
import AIChatOnly from "../components/AIChatOnly";  

const Home = () => {
  const dispatch = useAppDispatch();
  const propertyState = useAppSelector((state) => state.properties) || {};
  const { items: properties = [], status = 'idle', error } = propertyState;
  
  const bookingState = useAppSelector((state) => state.bookings) || {};
  const { status: bookingStatus } = bookingState;

  // Get auth state - userId and role
  const authState = useAppSelector((state) => state.auth) || {};
  const { userId, role, isAuthenticated } = authState;

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchProperties());
    }
  }, [dispatch, status]);
  
  // Load bookings for travelers
  useEffect(() => {
    if (isAuthenticated && role === "traveler" && bookingStatus === "idle") {
      dispatch(fetchTravelerBookings());
    }
  }, [dispatch, isAuthenticated, role, bookingStatus]);

  return (
    <div>
      <Navbar />
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Explore Homes</h2>

        {status === "loading" ? (
          <p className="text-center text-gray-500 font-medium">
            Loading properties...
          </p>
        ) : error ? (
          <p className="text-center text-red-500 font-medium">{error}</p>
        ) : properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {properties.map((prop) => (
              <PropertyCard key={prop.id || prop._id || `prop-${prop.title}-${prop.location}`} {...prop} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">
            No properties available at the moment.
          </p>
        )}
      </div>

      {/* ✅ Show Chatbot only for logged-in travelers */}
      {isAuthenticated && role === "traveler" && userId && (
        <AIChatOnly travelerId={userId} />
      )}
    </div>
  );
};

export default Home;
