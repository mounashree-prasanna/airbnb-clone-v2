import { Link } from "react-router-dom";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useState, useEffect, useMemo } from "react";
import { API_ENDPOINTS } from "../utils/constants";
import axiosInstance from "../utils/axiosInstance";

const PropertyCard = ({ _id, id, title, location, price, photo_url }) => {
  const propertyId = useMemo(() => _id || id, [_id, id]);
  const [isFavourite, setIsFavourite] = useState(false);

  useEffect(() => {
    if (!propertyId) return;

    const fetchFavourites = async () => {
      try {
        const res = await axiosInstance.get(
          API_ENDPOINTS.TRAVELER.FAVOURITES + "/my-favourites",
          { withCredentials: true }
        );
        
        const favourites = res.data || [];
        // The favourites API returns full property documents from Property Service,
        // where the ID is normalized as `id` (and on some endpoints may still be `_id`).
        // Properties on the Home page come from `getProperties` and use `_id`.
        // So treat a property as favourite if either `id` or `_id` matches this card's `_id`.
        const alreadyFav = favourites.some(
          (fav) => fav.id === propertyId || fav._id === propertyId
        );
        setIsFavourite(alreadyFav);
      } catch (err) {
        console.error("Error loading favourites:", err);
      }
    };
    fetchFavourites();
  }, [propertyId]);


  const toggleFavourite = async () => {
    if (!propertyId) return;
    try {
      if (isFavourite) {
        await axiosInstance.delete(
          `${API_ENDPOINTS.TRAVELER.FAVOURITES}/remove/${propertyId}`
        );
        setIsFavourite(false);
      } else {
        await axiosInstance.post(API_ENDPOINTS.TRAVELER.FAVOURITES + "/add", {
          propertyId,
        });
        // If the request succeeds (201), mark as favourite
        setIsFavourite(true);
      }
    } catch (err) {
      // If the server returns 409, it means the property is already in favourites.
      // Treat that as a successful "add" and keep the heart filled.
      if (err.response && err.response.status === 409) {
        setIsFavourite(true);
        return;
      }
      console.error("Error toggling favourite:", err);
    }
  };

  return (
    <div className="relative bg-white rounded-xl overflow-hidden shadow hover:shadow-lg transition cursor-pointer">
      <button
        onClick={toggleFavourite}
        className="absolute top-3 right-3 text-rose-500 hover:scale-110 transition-transform z-10"
      >
        {isFavourite ? <FaHeart size={22} /> : <FaRegHeart size={22} />}
      </button>

      {photo_url ? (
        <img
          src={photo_url}
          alt={title}
          className="w-full h-48 object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-48 flex items-center justify-center bg-gray-200 text-gray-500">
          No image available
        </div>
      )}

      <div className="p-3">
        <h3 className="font-semibold text-md text-gray-800 truncate">{title}</h3>
        <p className="text-gray-500 text-sm truncate">{location}</p>
        <p className="text-rose-600 font-bold mt-1">${price} / night</p>

        {propertyId && (
          <Link
            to={`/property/${propertyId}`}  
            className="inline-block mt-2 text-sm text-white bg-rose-500 px-3 py-1 rounded-lg hover:bg-rose-600"
          >
            View
          </Link>
        )}
      </div>
    </div>
  );
};

export default PropertyCard;
