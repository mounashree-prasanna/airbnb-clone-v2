import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginUser } from "../store/authSlice";

export default function Login() {
  const [role, setRole] = useState("traveler");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await dispatch(
        loginUser({ role, credentials: formData })
      ).unwrap();

      const nextRole = result.role || role;
      if (nextRole === "owner") {
        navigate("/owner/dashboard");
      } else {
        navigate("/home");
      }
    } catch (errMessage) {
      setError(errMessage);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Only one return block
  return (
    <div className="min-h-screen flex items-center justify-center bg-rose-500 p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img src="/airbnb-logo.png" alt="Airbnb Logo" className="w-16" />
        </div>
        <h2 className="text-3xl font-bold text-center mb-6">Login</h2>

        <div className="flex justify-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => setRole("traveler")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              role === "traveler" ? "bg-rose-500 text-white" : "bg-gray-200"
            }`}
          >
            Traveler
          </button>
          <button
            type="button"
            onClick={() => setRole("owner")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              role === "owner" ? "bg-rose-500 text-white" : "bg-gray-200"
            }`}
          >
            Owner
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={onChange}
            className="w-full p-3 border rounded-lg"
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={onChange}
            className="w-full p-3 border rounded-lg"
            required
          />
          {error && <p className="text-red-600 text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold text-white transition ${
              loading
                ? "bg-rose-300 cursor-not-allowed"
                : "bg-rose-500 hover:bg-rose-600"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          Don’t have an account?{" "}
          <a
            href="/signup"
            className="text-rose-500 font-semibold hover:underline"
          >
            Sign up here
          </a>
        </p>
      </div>
    </div>
  );
}
