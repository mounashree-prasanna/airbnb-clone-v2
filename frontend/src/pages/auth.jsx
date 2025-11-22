import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../store/hooks";
import AuthService from "../services/AuthService";
import { loginUser } from "../store/slices/authSlice";

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "IN", name: "India" },
  { code: "UK", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
];

const LANGUAGES = ["English", "Spanish", "French", "Hindi", "Mandarin"];
const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];

// Validation functions
const validatePassword = (password) => {
  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number";
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return "Password must contain at least one special character";
  }
  return null;
};

const validatePhone = (phone) => {
  // Phone is optional, but if provided, it must match the format
  if (!phone || phone.trim() === "") {
    return null; // Phone is optional
  }
  const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
  if (!phoneRegex.test(phone)) {
    return "Phone must be in NNN-NNN-NNNN format (e.g., 669-132-4567)";
  }
  return null;
};

export default function AuthPage() {
  const [isSignup, setIsSignup] = useState(true);      
  const [role, setRole] = useState("traveler");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    city: "",
    country: "",
    language: "",
    gender: "",
    location: "",          
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData((s) => ({ ...s, [name]: value }));
    
    // Clear validation error for this field when user types
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setValidationErrors({});
    setLoading(true);

    // Validate password and phone for signup
    if (isSignup) {
      const errors = {};
      const passwordError = validatePassword(formData.password);
      if (passwordError) {
        errors.password = passwordError;
      }
      
      const phoneError = validatePhone(formData.phone);
      if (phoneError) {
        errors.phone = phoneError;
      }
      
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        setLoading(false);
        return;
      }
    }

    try {
      if (isSignup) {
        const payload =
          role === "owner"
            ? {
                role,
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                city: formData.city,
                country: formData.country,
                language: formData.language,
                gender: formData.gender,
                location: formData.location, 
              }
            : {
                role,
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                city: formData.city,
                country: formData.country,
                language: formData.language,
                gender: formData.gender,
              };

        const res = await AuthService.signup(role, payload);
        console.log("Signup success:", res.data);
        
        // Clear any auth tokens and redirect to login page
        // Don't auto-login - user must log in explicitly
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user_id");
        
        // Always redirect to login after successful signup
        navigate("/login");
      } else {
        const payload = {
          email: formData.email,
          password: formData.password,
        };

        const result = await dispatch(
          loginUser({ role, credentials: payload })
        ).unwrap();
        const userRole = result.role || role;

        if (userRole === "owner") {
          navigate("/owner/dashboard");
        } else {
          navigate("/home");
        }
      }
    } catch (err) {
      console.error("Auth error:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || err.message || (isSignup ? "Signup failed. Try again." : "Login failed. Please try again.");
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6">
      <h1 className="text-4xl font-extrabold text-white mb-6">
        Welcome to Airbnb Clone
      </h1>

      <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {isSignup ? "Sign Up" : "Login"} as {role === "traveler" ? "Traveler" : "Owner"}
        </h2>

        <div className="flex justify-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => setRole("traveler")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              role === "traveler" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            Traveler
          </button>
          <button
            type="button"
            onClick={() => setRole("owner")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              role === "owner" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            Owner
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <>
              <input
                name="name"
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={onChange}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={onChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                      validationErrors.email ? "border-red-500" : ""
                    }`}
                    required
                  />
                  {validationErrors.email && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.email}</p>
                  )}
                </div>
                <div>
                  <input
                    name="password"
                    type="password"
                    placeholder="Password (min 8 chars, 1 uppercase, 1 number, 1 special)"
                    value={formData.password}
                    onChange={onChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                      validationErrors.password ? "border-red-500" : ""
                    }`}
                    required
                  />
                  {validationErrors.password && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.password}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <input
                    name="phone"
                    type="tel"
                    placeholder="Phone (669-132-4567)"
                    value={formData.phone}
                    onChange={onChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                      validationErrors.phone ? "border-red-500" : ""
                    }`}
                  />
                  {validationErrors.phone && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.phone}</p>
                  )}
                </div>
                <input
                  name="city"
                  type="text"
                  placeholder="City"
                  value={formData.city}
                  onChange={onChange}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <select
                name="country"
                value={formData.country}
                onChange={onChange}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              >
                <option value="" disabled>Select Country</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select
                  name="language"
                  value={formData.language}
                  onChange={onChange}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="" disabled>Select Language</option>
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l.toLowerCase()}>{l}</option>
                  ))}
                </select>

                <select
                  name="gender"
                  value={formData.gender}
                  onChange={onChange}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="" disabled>Select Gender</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g.toLowerCase()}>{g}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {!isSignup && (
            <>
              <input
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={onChange}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
              <input
                name="password"
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={onChange}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg text-white transition ${
              loading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? (isSignup ? "Signing up..." : "Logging in...") : (isSignup ? "Sign Up" : "Login")}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          {isSignup ? "Already have an account?" : "Don’t have an account?"}{" "}
          <button
            type="button"
            onClick={() => setIsSignup((s) => !s)}
            className="text-blue-600 font-semibold hover:underline"
          >
            {isSignup ? "Login" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}
