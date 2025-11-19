import Navbar from "../components/Navbar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS, API_BASE_URL } from "../utils/constants";
import axiosInstance from "../utils/axiosInstance";

const OwnerProfile = () => {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    location: "",
    phone: "",
    profile_image: "",
  });

  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axiosInstance
      .get(API_ENDPOINTS.OWNER.PROFILE, { withCredentials: true })
      .then((res) => {
        if (res.data) {
          const { name, email, location, phone, profile_image } = res.data;
          setProfile({
            name: name || "",
            email: email || "",
            location: location || "",
            phone: phone || "",
            profile_image: profile_image || "",
          });
          if (profile_image) {
            setPreview(resolvePreview(profile_image));
          }
        }
      })
      .catch((err) => {
        console.error("Failed to fetch owner profile:", err);
      });
  }, []);

  const resolvePreview = (value) => {
    if (!value) return null;
    if (value.startsWith("data:") || value.startsWith("http")) return value;
    return `${API_BASE_URL}${value.startsWith("/") ? "" : "/"}${value}`;
  };

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const handleChange = async (e) => {
    const { name, value, files } = e.target;
    if (name === "profilePic" && files && files[0]) {
      try {
        const encoded = await toBase64(files[0]);
        setProfile({ ...profile, profile_image: encoded });
        setPreview(URL.createObjectURL(files[0]));
      } catch (error) {
        console.error("Failed to read file", error);
      }
    } else {
      setProfile({ ...profile, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axiosInstance.put(API_ENDPOINTS.OWNER.PROFILE, profile, {
        withCredentials: true,
      });

      setMessage("Profile updated successfully!");
      setTimeout(() => navigate("/owner/dashboard"), 900);
    } catch (err) {
      console.error("Profile update failed:", err);
      setMessage("Error updating profile.");
    }
  };

  return (
    <div>
      <Navbar />
      <div className="p-6 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Owner Profile</h2>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-md space-y-4"
          encType="multipart/form-data"
        >
          <div className="flex flex-col items-center">
            {preview ? (
              <img
                src={preview}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover mb-2"
              />
            ) : profile.profile_image ? (
              <img
                src={resolvePreview(profile.profile_image)}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover mb-2"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                No Image
              </div>
            )}
            <input
              type="file"
              name="profilePic"
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
            <label className="block font-medium">Location</label>
            <input
              type="text"
              name="location"
              value={profile.location}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              placeholder="City, State or full address"
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
              className="w-full border px-3 py-2 rounded"
            />
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

export default OwnerProfile;
