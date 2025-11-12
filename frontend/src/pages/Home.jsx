import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import PropertyCard from "../components/PropertyCard";
import { AIConciergeButton, AIConciergePanel } from "../components/AIConcierge";
import ConciergeResults from "../components/ConciergeResults";
import AIConciergeService from "../services/AIConciergeService";

const Home = () => {
  const [properties, setProperties] = useState([]);
  const [error, setError] = useState("");
  const [isConciergeOpen, setIsConciergeOpen] = useState(false);
  const [conciergeResults, setConciergeResults] = useState(null);
  const [conciergeError, setConciergeError] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/properties")
      .then((res) => {
        if (res.data.length > 0) {
          setProperties(res.data);
        } else {
          setError("No properties available at the moment.");
        }
      })
      .catch((err) => {
        console.error("Error fetching properties:", err);
        setError("Unable to load properties. Please try again later.");
      });
  }, []);

  const handleConciergeSubmit = async (formData) => {
    try {
      setConciergeError("");
      const results = await AIConciergeService.getRecommendations(formData);
      setConciergeResults(results);
      setIsConciergeOpen(false);
    } catch (error) {
      setConciergeError(error.message);
      console.error("Concierge error:", error);
    }
  };

  const handleCloseConcierge = () => {
    setIsConciergeOpen(false);
    setConciergeError("");
  };

  const handleCloseResults = () => {
    setConciergeResults(null);
  };

  return (
    <div>
      <Navbar />
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Explore Homes</h2>

        {error ? (
          <p className="text-center text-red-500 font-medium">{error}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {properties.map((prop) => (
              <PropertyCard key={prop.id} {...prop} />
            ))}
          </div>
        )}
      </div>

      <AIConciergeButton onClick={() => setIsConciergeOpen(true)} />

      <AIConciergePanel
        isOpen={isConciergeOpen}
        onClose={handleCloseConcierge}
        onSubmit={handleConciergeSubmit}
      />

      <ConciergeResults
        results={conciergeResults}
        onClose={handleCloseResults}
      />

      {conciergeError && (
        <div className="fixed bottom-4 left-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg z-50">
          <div className="flex items-center">
            <span className="font-medium">Error:</span>
            <span className="ml-2">{conciergeError}</span>
            <button
              onClick={() => setConciergeError("")}
              className="ml-4 text-red-500 hover:text-red-700"
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
