import Navbar from "../components/Navbar";
import { useState, useEffect, useMemo } from "react";
import axiosInstance from "../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS, API_BASE_URL } from "../utils/constants";

const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;


const Profile = () => {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    about: "",
    city: "",
    state: "",
    country: "",
    languages: "",
    gender: "Other",
    profile_image: null,
  });

  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const countries = ["United States", "Canada", "United Kingdom", "India", "Australia"];
  const genders = ["Male", "Female", "Other"];

  useEffect(() => {
    axiosInstance
      .get(`${API_ENDPOINTS.TRAVELER.USERS}/profile`, { withCredentials: true })
      .then((res) => {
        if (res.data) {
          setProfile({
            ...res.data,
            profile_image: res.data.profile_image || null,
          });
        }
      })
      .catch((err) => {
        console.error("Failed to fetch profile:", err);
      });
  }, []);

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const handleChange = async (e) => {
    const { name, value, files } = e.target;
    if (name === "profile_image" && files && files[0]) {
      try {
        const encoded = await toBase64(files[0]);
        setProfile({ ...profile, profile_image: encoded });
      } catch (error) {
        console.error("Failed to read file", error);
      }
    } else {
      setProfile({ ...profile, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (profile.phone && !phoneRegex.test(profile.phone)) {
      newErrors.phone = "Phone must be in NNN-NNN-NNNN format (e.g., 669-132-4567).";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    try {
      // Send as JSON like owner profile (base64 encoded image)
      const res = await axiosInstance.put(
        `${API_ENDPOINTS.TRAVELER.USERS}/profile`,
        profile,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      // Update profile state with response data
      if (res.data) {
        setProfile({
          ...res.data,
          profile_image: res.data.profile_image || null,
        });
      }

      setMessage("Profile updated successfully!");

      setTimeout(() => navigate("/home"), 1000);
    } catch (err) {
      console.error("Profile update failed:", err);
      setMessage("Error updating profile.");
    }
  };

  const travelerPathname = useMemo(() => {
    try {
      return new URL(API_ENDPOINTS.TRAVELER.USERS).pathname.replace(/\/$/, "");
    } catch {
      return "/traveler";
    }
  }, []);

  const resolveProfileImageSrc = () => {
    if (!profile.profile_image) return null;
    if (typeof profile.profile_image !== "string") return null;

    // If already a base64 data URL, return as-is (like owner profile)
    if (profile.profile_image.startsWith("data:")) {
      return profile.profile_image;
    }

    // If already an absolute URL, use it as-is
    if (profile.profile_image.startsWith("http")) {
      return profile.profile_image;
    }

    // For relative paths (legacy support for file uploads)
    const normalized = profile.profile_image.startsWith("/")
      ? profile.profile_image
      : `/${profile.profile_image}`;

    const baseHost = API_BASE_URL.replace(/\/$/, "");

    // Stored as \"/uploads/<file>\" in Mongo → request via /traveler/uploads/...
    if (normalized.startsWith("/uploads")) {
      return `${baseHost}/traveler${normalized}`;
    }

    // Fallback for any other relative paths
    return `${baseHost}${normalized}`;
  };


  return (
    <div>
      <Navbar />
      <div className="p-6 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">My Profile</h2>
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-md space-y-4"
          encType="multipart/form-data"
        >
          <div className="flex flex-col items-center">
            {profile.profile_image ? (
              <img
                src={resolveProfileImageSrc()}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover mb-2"
                onError={(e) => {
                  console.error("Image load error:", e.target.src);
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                No Image
              </div>
            )}
            <input
              type="file"
              name="profile_image"
              accept="image/*"
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block font-medium">Name</label>
            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          <div>
            <label className="block font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          <div>
            <label className="block font-medium">Phone</label>
              <input
                type="text"
                name="phone"
                value={profile.phone}
                onChange={handleChange}
                placeholder="669-132-4567"
                className={`w-full border px-3 py-2 rounded ${
                  errors.phone ? "border-red-500" : ""
                }`}
              />
              {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}

          </div>

          <div>
            <label className="block font-medium">About Me</label>
            <textarea
              name="about"
              value={profile.about}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          <div>
            <label className="block font-medium">City</label>
            <input
              type="text"
              name="city"
              value={profile.city}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          <div>
            <label className="block font-medium">State (Abbreviation)</label>
            <input
              type="text"
              name="state"
              maxLength="2"
              placeholder="e.g., CA"
              value={profile.state}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded uppercase"
            />
          </div>

          <div>
            <label className="block font-medium">Country</label>
            <select
              name="country"
              value={profile.country}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="">Select Country</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium">Languages</label>
            <input
              type="text"
              name="languages"
              placeholder="e.g., English, Spanish"
              value={profile.languages}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          <div>
            <label className="block font-medium">Gender</label>
            <select
              name="gender"
              value={profile.gender}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
            >
              {genders.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="bg-rose-500 text-white px-6 py-2 rounded hover:bg-rose-600"
          >
            Save Changes
          </button>

          {message && (
            <p className="text-center text-green-600 mt-3">{message}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default Profile;
