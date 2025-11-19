import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { signupUser, clearError } from "../store/slices/authSlice";


const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{9,}$/;

export default function Signup({ redirectTo }) {
  const [role, setRole] = useState("traveler");
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();
  const { loading, error, role: userRole } = useAppSelector((state) => state.auth);

  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    // Clear any previous errors when component mounts
    dispatch(clearError());
    
    // If already logged in, redirect immediately (only once on mount)
    const currentRole = localStorage.getItem("role");
    if (currentRole && !hasNavigated) {
      setHasNavigated(true);
      if (currentRole === "owner") {
        navigate("/owner/dashboard", { replace: true });
      } else if (currentRole === "traveler") {
        navigate(redirectTo || "/home", { replace: true });
      }
    }
  }, [dispatch, navigate, redirectTo, hasNavigated]);

  useEffect(() => {
    // Only navigate after a successful signup (when userRole changes from null to a role)
    // This prevents infinite loops by only navigating when we actually sign up
    if (userRole && !loading && !hasNavigated) {
      setHasNavigated(true);
      if (userRole === "owner") {
        navigate("/owner/dashboard", { replace: true });
      } else if (userRole === "traveler") {
        navigate(redirectTo || "/home", { replace: true });
      }
    }
  }, [userRole, navigate, redirectTo, loading, hasNavigated]);

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const validate = () => {
    const errs = {};
    if (!passwordRegex.test(formData.password)) {
      errs.password =
        "Password must be ≥9 characters and include 1 uppercase letter, 1 number, and 1 special character.";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    try {
      const res = await AuthService.signup(role, formData);
      console.log("Signup success:", res.data);
      navigate(redirectTo || "/login"); 
    } catch (err) {
      console.error("Signup error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Signup failed. Try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-rose-500 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6">Sign Up</h2>

        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => setRole("traveler")}
            className={`px-4 py-2 rounded-lg ${
              role === "traveler" ? "bg-rose-500 text-white" : "bg-gray-200"
            }`}
          >
            Traveler
          </button>
          <button
            onClick={() => setRole("owner")}
            className={`px-4 py-2 rounded-lg ${
              role === "owner" ? "bg-rose-500 text-white" : "bg-gray-200"
            }`}
          >
            Owner
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={onChange}
            required
            className="w-full p-3 border rounded-lg"
          />
          <input
            name="email"
            placeholder="Email"
            type="email"
            value={formData.email}
            onChange={onChange}
            required
            className="w-full p-3 border rounded-lg"
          />
          <input
            name="password"
            placeholder="Password"
            type="password"
            value={formData.password}
            onChange={(e) => {
              setFormData({ ...formData, password: e.target.value });
              if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: "" });
            }}
            required
            className={`w-full p-3 border rounded-lg ${
              fieldErrors.password ? "border-red-500" : ""
            }`}
          />
          {fieldErrors.password && (
            <p className="text-red-600 text-sm">{fieldErrors.password}</p>
          )}


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
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-rose-500 font-semibold hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
