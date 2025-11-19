import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import PropertyCard from "../components/PropertyCard";
import { useDispatch, useSelector } from "react-redux";
import { fetchProperties } from "../store/propertySlice";
import AIChatOnly from "../components/AIChatOnly";  

const Home = () => {
  const dispatch = useDispatch();
  const { items: properties, status, error } = useSelector(
    (state) => state.properties
  );

  // 🔹 Assuming your auth slice stores the logged-in user
  const { user } = useSelector((state) => state.auth || {}); 

  const [showLoginError, setShowLoginError] = useState(false);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchProperties());
    }
  }, [dispatch, status]);

  const handleChatAccess = () => {
    if (!user || !user._id) {
      setShowLoginError(true);
      return null;
    }
    return <AIChatOnly travelerId={user._id} />;
  };

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
              <PropertyCard key={prop._id} {...prop} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">
            No properties available at the moment.
          </p>
        )}
      </div>

      {/* ✅ Show Chatbot only for logged-in travelers */}
      {user && user._id && <AIChatOnly travelerId={user._id} />}

      {/* ❌ Error message for not logged-in users */}
      {showLoginError && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg z-50">
          <div className="flex items-center">
            <span className="font-semibold">Please log in to use the AI Concierge.</span>
            <button
              onClick={() => setShowLoginError(false)}
              className="ml-4 text-red-500 hover:text-red-700 font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
