import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import { useAppSelector } from "./store/hooks";
import { useEffect } from "react";
import { checkSession } from "./store/slices/authSlice";
import { useAppDispatch } from "./store/hooks";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Logout from "./pages/Logout";
import OwnerDashboard from "./pages/OwnerDashboard";
import OwnerMyProperties from "./pages/OwnerMyProperties";
import OwnerAddProperty from "./pages/OwnerAddProperty";
import OwnerBookings from "./pages/OwnerBookings";
import OwnerProfile from "./pages/OwnerProfile";
import PropertyDetail from "./pages/PropertyDetail";
import Favourites from "./pages/Favourites";
import Profile from "./pages/Profile";
import TravelerHistory from "./pages/TravelerHistory";
import SearchResults from "./pages/SearchResults";

function AppRoutes() {
  const dispatch = useAppDispatch();
  const { isLoggedIn, role, loading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Only check session once on mount
    const storedRole = localStorage.getItem("role");
    if (storedRole) {
      dispatch(checkSession(storedRole));
    } else {
      // Set loading to false if no role found
      dispatch(checkSession(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-700 text-lg">
        Checking session...
      </div>
    );

  const ProtectedRoute = ({ element }) => {
    if (!isLoggedIn) return <Navigate to="/login" replace />;
    return element;
  };

  const TravelerRoute = ({ element }) => {
    if (!isLoggedIn) return <Navigate to="/login" replace />;
    if (role !== "traveler") return <Navigate to="/owner/dashboard" replace />;
    return element;
  };

  const OwnerRoute = ({ element }) => {
    if (!isLoggedIn) return <Navigate to="/login" replace />;
    if (role !== "owner") return <Navigate to="/home" replace />;
    return element;
  };

  return (
    <Routes>
      {/* Public */}
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/logout" element={<Logout />} />

      {/* Traveler */}
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={TravelerRoute({ element: <Home /> })} />
      <Route path="/search" element={TravelerRoute({ element: <SearchResults /> })} />
      <Route path="/property/:id" element={TravelerRoute({ element: <PropertyDetail /> })} />
      <Route path="/favourites" element={TravelerRoute({ element: <Favourites /> })} />
      <Route path="/profile" element={TravelerRoute({ element: <Profile /> })} />
      <Route path="/history" element={TravelerRoute({ element: <TravelerHistory /> })} />

      {/* Owner */}
      <Route path="/owner/dashboard" element={OwnerRoute({ element: <OwnerDashboard /> })} />
      <Route path="/owner/properties" element={OwnerRoute({ element: <OwnerMyProperties /> })} />
      <Route path="/owner/properties/new" element={OwnerRoute({ element: <OwnerAddProperty /> })} />
      <Route path="/owner/bookings" element={OwnerRoute({ element: <OwnerBookings /> })} />
  <Route path="/owner/profile" element={OwnerRoute({ element: <OwnerProfile /> })} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Provider store={store}>
      <Router>
        <AppRoutes />
      </Router>
    </Provider>
  );
}

export default App;
