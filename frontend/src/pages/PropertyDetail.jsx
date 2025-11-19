import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchPropertyDetail } from "../store/slices/propertySlice";
import Navbar from "../components/Navbar";
import BookingModal from "./BookingModal";

const PropertyDetail = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const { currentProperty, detailLoading, detailError } = useAppSelector((state) => state.property);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchPropertyDetail(id));
    }
  }, [dispatch, id]);

  const property = currentProperty;
  const error = detailError;

  if (error) {
    return (
      <div>
        <Navbar />
        <p className="text-center text-red-500 font-medium mt-10">{error}</p>
      </div>
    );
  }

  if (detailLoading) {
    return (
      <div>
        <Navbar />
        <p className="text-center text-gray-600 mt-10">Loading property...</p>
      </div>
    );
  }

  const imageSrc = property.photo_url || property.photoUrl
    ? (property.photo_url || property.photoUrl)
    : `https://source.unsplash.com/800x600/?${property.title},${property.location}`;

  const guestCapacity =
    property.guests ||
    property.maxGuests ||
    (property.bedrooms ? property.bedrooms * 2 : null);

  const propertyId = property.id || property._id || id;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div>
      <Navbar />
      <div className="p-6 max-w-4xl mx-auto">
        <img
          src={imageSrc}
          alt={property.title}
          className="w-full h-80 object-cover rounded-lg"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://picsum.photos/800/600?grayscale";
          }}
        />

        <h2 className="text-3xl font-bold mt-4">{property.title}</h2>
        <p className="text-gray-600">{property.location}</p>
        <p className="mt-2">{property.description}</p>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <p><strong>Type:</strong> {property.type || "N/A"}</p>
          <p><strong>Bedrooms:</strong> {property.bedrooms || "N/A"}</p>
          <p><strong>Bathrooms:</strong> {property.bathrooms || "N/A"}</p>
          <p><strong>Guests:</strong> {guestCapacity || "N/A"}</p>
          <p><strong>Price:</strong> ${property.price} / night</p>
          <p className="col-span-2">
            <strong>Available:</strong> {property.next_available_date 
              ? formatDate(property.next_available_date) + " onwards" 
              : formatDate(property.available_from || property.availableFrom) + 
     " → " + formatDate(property.available_to || property.availableTo)
}
          </p>
        </div>

        {property.amenities && (
          <div className="mt-4">
            <strong>Amenities:</strong>
            <div className="flex flex-wrap gap-2 mt-2">
              {(Array.isArray(property.amenities)
                ? property.amenities
                : property.amenities.split(",")
              ).map((a, idx) => (
                <span
                  key={idx}
                  className="bg-gray-200 text-gray-700 text-sm px-3 py-1 rounded-full"
                >
                  {a.trim()}
                </span>
              ))}
            </div>
          </div>
        )}


        <button
          onClick={() => setShowModal(true)}
          className="mt-6 bg-rose-500 text-white px-6 py-2 rounded hover:bg-rose-600"
        >
          Book Now
        </button>

        {showModal && propertyId && (
          <BookingModal 
            propertyId={propertyId}
            ownerId={property.ownerId || property.owner_id}
            nextAvailableDate={property.next_available_date}
            onClose={() => setShowModal(false)} 
            price={property.price}
            maxGuests={guestCapacity}
          />
        )}
      </div>
    </div>
  );
};

export default PropertyDetail;
