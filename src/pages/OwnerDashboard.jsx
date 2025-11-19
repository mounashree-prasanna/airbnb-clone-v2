import DashboardNavbar from "../components/Navbar";
import { Link } from "react-router-dom";

export default function OwnerDashboard() {
  return (
    <div>
      <DashboardNavbar />
      <div className="p-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">Owner Dashboard</h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            to="/owner/properties"
            className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition"
          >
            <h3 className="text-xl font-semibold text-rose-600 mb-2">My Properties</h3>
            <p>View and manage all your property listings.</p>
          </Link>

          <Link
            to="/owner/properties/new"
            className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition"
          >
            <h3 className="text-xl font-semibold text-rose-600 mb-2">Add Property</h3>
            <p>Post a new property for rent.</p>
          </Link>

          <Link
            to="/owner/bookings"
            className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition"
          >
            <h3 className="text-xl font-semibold text-rose-600 mb-2">Incoming Bookings</h3>
            <p>View and manage booking requests.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
