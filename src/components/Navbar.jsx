import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaGlobe, FaBars, FaHeart, FaSearch } from "react-icons/fa";
import { useSelector } from "react-redux";

export default function DashboardNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, role } = useSelector((state) => state.auth);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [locationSearch, setLocationSearch] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("");
  
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };
  const minDate = getTomorrowDate();

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (locationSearch.trim()) params.set("location", locationSearch.trim());
    if (checkIn) params.set("startDate", checkIn);
    if (checkOut) params.set("endDate", checkOut);
    if (guests) params.set("guests", guests);

    if ([...params.keys()].length === 0) return;

    navigate(`/search?${params.toString()}`);
  };

  const hideSearch = role === "owner" && location.pathname.startsWith("/owner");

  return (
    <nav className="flex items-center justify-between px-6 py-3 shadow-md bg-rose-500 sticky top-0 z-50">
      <Link to="/home" className="flex items-center space-x-2">
        <img src="/airbnb-logo.png" alt="Airbnb Logo" className="h-8 w-auto" />
        <span className="hidden sm:block font-bold text-lg text-white tracking-tight">
          airbnb
        </span>
      </Link>

      {!hideSearch && (
        <>
          {/* Desktop Search Bar */}
          <div className="hidden md:flex items-center bg-white rounded-full shadow px-4 py-2 hover:shadow-lg transition w-[620px]">
            <input
              type="text"
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              placeholder="Search destinations"
              className="bg-transparent placeholder-gray-500 text-gray-800 outline-none text-sm flex-[1.5]"
            />
            <span className="text-gray-300">|</span>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              min={minDate}
              placeholder="Check-in"
              className="bg-transparent placeholder-gray-500 text-gray-800 outline-none text-sm flex-[1]"
              title="Check-in date"
            />
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              min={checkIn || minDate}
              placeholder="Check-out"
              className="bg-transparent placeholder-gray-500 text-gray-800 outline-none text-sm flex-[1]"
              title="Check-out date"
            />
            <span className="text-gray-300">|</span>
            <input
              type="number"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              placeholder="Guests"
              min="1"
              className="bg-transparent placeholder-gray-500 text-gray-800 outline-none text-sm flex-[0.7] min-w-[60px]"
            />
            <button
              onClick={handleSearch}
              className="bg-rose-500 text-white p-2 rounded-full hover:bg-rose-600 transition flex-shrink-0"
              aria-label="Search"
            >
              <FaSearch size={14} />
            </button>
          </div>

          {/* Mobile Search Bar */}
          <div className="md:hidden flex flex-col w-full">
            <div className="flex items-center bg-white rounded-full shadow px-4 py-2 hover:shadow-lg transition mx-2">
              <input
                type="text"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                placeholder="Search destinations"
                className="bg-transparent placeholder-gray-500 text-gray-800 outline-none text-sm flex-1"
              />
              <button
                onClick={handleSearch}
                className="bg-rose-500 text-white p-2 rounded-full hover:bg-rose-600 transition flex-shrink-0 ml-2"
                aria-label="Search"
              >
                <FaSearch size={14} />
              </button>
            </div>
            <div className="flex items-center justify-between px-4 py-2 space-x-2">
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                min={minDate}
                placeholder="Check-in"
                className="bg-white rounded-lg shadow px-2 py-1 text-sm flex-1"
                title="Check-in date"
              />
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn || minDate}
                placeholder="Check-out"
                className="bg-white rounded-lg shadow px-2 py-1 text-sm flex-1"
                title="Check-out date"
              />
              <input
                type="number"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
                placeholder="Guests"
                min="1"
                className="bg-white rounded-lg shadow px-2 py-1 text-sm w-20"
              />
            </div>
          </div>
        </>
      )}

      <div className="flex items-center space-x-4 relative text-white" ref={menuRef}>
        <FaGlobe className="text-lg cursor-pointer hover:scale-110 transition-transform" />

        {isAuthenticated && role === "traveler" && (
          <Link to="/favourites" className="hover:text-pink-300">
            <FaHeart className="text-lg cursor-pointer hover:scale-110 transition-transform" />
          </Link>
        )}

        <div
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center bg-white text-gray-600 px-3 py-1 rounded-full space-x-2 cursor-pointer hover:shadow-md transition"
        >
          <FaBars className="text-lg" />
        </div>

        {menuOpen && (
          <div className="absolute right-0 top-12 w-56 bg-white shadow-lg rounded-md text-gray-700 z-20 animate-fadeIn">
            <ul className="text-sm">
              {isAuthenticated ? (
                <>
                  {role === "traveler" && (
                    <>
                      <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                        <Link to="/profile">Profile</Link>
                      </li>
                      <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                        <Link to="/history">Travel History</Link>
                      </li>
                      <li
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-500 font-medium"
                        onClick={() => navigate("/logout")}
                      >
                        Logout
                      </li>
                    </>
                  )}

                  {role === "owner" && (
                    <>
                      <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                        <Link to="/owner/dashboard">Dashboard</Link>
                      </li>
                      <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                        <Link to="/owner/profile">Profile</Link>
                      </li>
                      <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                        <Link to="/owner/properties">My Properties</Link>
                      </li>
                      <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                        <Link to="/owner/properties/new">Add Property</Link>
                      </li>
                      <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                        <Link to="/owner/bookings">Incoming Bookings</Link>
                      </li>
                      <li
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-red-500 font-medium"
                        onClick={() => navigate("/logout")}
                      >
                        Logout
                      </li>
                    </>
                  )}
                </>
              ) : (
                <>
                  <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                    <Link to="/login">Login</Link>
                  </li>
                  <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                    <Link to="/signup">Sign Up</Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}
