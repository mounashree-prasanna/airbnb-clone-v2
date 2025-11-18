import Navbar from "../components/Navbar";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchFavourites } from "../store/slices/bookingSlice";

const Favourites = () => {
  const dispatch = useAppDispatch();
  const { favourites, favouritesLoading } = useAppSelector((state) => state.booking);

  useEffect(() => {
    dispatch(fetchFavourites());
  }, [dispatch]);

  return (
    <div>
      <Navbar />
      <div className="p-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">My Favourites</h2>

        {favouritesLoading ? (
          <p className="text-gray-500">Loading your favourites...</p>
        ) : favourites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {favourites.map((fav) => (
              <div
                key={fav.id || fav._id}
                className="border rounded-lg shadow hover:shadow-lg transition duration-200 bg-white"
              >
                <img
                  src={fav.photo_url || "/placeholder.jpg"}
                  alt={fav.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="p-4 space-y-1">
                  <h3 className="font-semibold text-lg">{fav.title}</h3>
                  <p className="text-gray-600 text-sm">{fav.location}</p>
                  <p className="text-rose-500 font-medium">
                    ${fav.price} / night
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 mt-6">
            You have no favourite properties yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default Favourites;
