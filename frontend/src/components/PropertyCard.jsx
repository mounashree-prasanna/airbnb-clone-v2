import { Link } from "react-router-dom";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useState, useEffect } from "react";
import axios from "axios";

const PropertyCard = ({ id, title, location, price, photo_url }) => {
  const [isFavourite, setIsFavourite] = useState(false);

  useEffect(() => {
    const fetchFavourites = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/favourites/my-favourites", {
          withCredentials: true,
        });
        const favourites = res.data || [];
        const alreadyFav = favourites.some((fav) => fav.id === id);
        setIsFavourite(alreadyFav);
      } catch (err) {
        console.error("Error loading favourites:", err);
      }
    };
    fetchFavourites();
  }, [id]);

  const toggleFavourite = async () => {
    try {
      if (isFavourite) {
        await axios.delete(`http://localhost:5000/api/favourites/remove/${id}`, {
          withCredentials: true,
        });
        setIsFavourite(false);
      } else {
        await axios.post(
          "http://localhost:5000/api/favourites/add",
          { propertyId: id },
          { withCredentials: true }
        );
        setIsFavourite(true);
      }
    } catch (err) {
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

        <Link
          to={`/property/${id}`}
          className="inline-block mt-2 text-sm text-white bg-rose-500 px-3 py-1 rounded-lg hover:bg-rose-600"
        >
          View
        </Link>
      </div>
    </div>
  );
};

export default PropertyCard;
