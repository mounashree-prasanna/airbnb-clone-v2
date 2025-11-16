import Navbar from "../components/Navbar";
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_ENDPOINTS, API_BASE_URL } from "../utils/constants";

const OwnerProfile = () => {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    location: "",
    phone: "",
    profilePic: null,
  });

  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(API_ENDPOINTS.OWNER.PROFILE, { withCredentials: true })
      .then((res) => {
        if (res.data) {
          const { name, email, location, phone, profile_image } = res.data;
          setProfile({
            name: name || "",
            email: email || "",
            location: location || "",
            phone: phone || "",
            profilePic: profile_image || null,
          });
          if (profile_image) setPreview(profile_image);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch owner profile:", err);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profilePic" && files && files[0]) {
      setProfile({ ...profile, profilePic: files[0] });
      setPreview(URL.createObjectURL(files[0]));
    } else {
      setProfile({ ...profile, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (profile.profilePic && typeof profile.profilePic !== "string") {
        const fd = new FormData();
        fd.append("name", profile.name);
        fd.append("email", profile.email);
        fd.append("location", profile.location);
        fd.append("phone", profile.phone);
        fd.append("profile_image", profile.profilePic);

        await axios.put(API_ENDPOINTS.OWNER.PROFILE, fd, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.put(
          API_ENDPOINTS.OWNER.PROFILE,
          {
            name: profile.name,
            email: profile.email,
            location: profile.location,
            phone: profile.phone,
          },
          { withCredentials: true }
        );
      }

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
                src={preview.startsWith('http') ? preview : `${API_BASE_URL}${preview}`}
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
